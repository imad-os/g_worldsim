import { EFlag, Kind } from '@worldsim/protocol';
import { NO_MAP } from './entities.js';
import type { World } from './world.js';

/**
 * The lay of the land on top of the generated maps (imad 2026-11-20): the town is ringed by a thick wood with only
 * 4 roads out (north, south, east, west), each one a way to the other map. While the owner keeps travel closed,
 * wrecked cars block those roads (someone who walks into them is told why). Rocks to mine (stone, ore) lie about,
 * more in the woods. Done with run-time tile changes, not in the generator, so old worlds get it too (once) and the
 * cloud backup (seed + changed tiles) keeps working.
 */
export const RING = 8;
const WRECK_AT = 5, PORTAL_AT = 2, ARRIVE_AT = 11;

interface Exit { m: number; side: string; lo: number; hi: number; c: number }

export class Land {
  /** 1 = the ring, exits and rocks were laid on this world (saved in snapshots). */
  done = 0;
  /**
   * The maps that already have their ring and rocks (saved as `landMaps`): a map added to the scenario later
   * (imad 2026-11-27: Ridgeford, Black Fir Forest, Willow Farms) gets them on its first start, the old ones are left alone.
   */
  readonly doneMaps = new Set<string>();
  readonly exits: Exit[] = [];
  private readonly T: Record<string, number> = {};
  private readonly ringed = new Set<number>();
  private blockedSay = new Map<number, number>();

  constructor(private w: World) {
    for (const t of w.sc.tiles) this.T[t.name] = t.id;
  }

  /** Every start (after a restore too): exits found on the roads, portals moved there, ring + rocks once, wrecks by travel. */
  setup(): void {
    const w = this.w;
    this.exits.length = 0; this.ringed.clear();
    for (const p of w.portals) {
      if (!p.exit) continue;
      const m = p.from;
      if (this.T.tree === undefined || this.T.road === undefined) continue;
      this.ringed.add(m);
      const e = this.findRoad(m, p.exit);
      this.exits.push(e);
      const pt = this.at(m, e.side, PORTAL_AT, e.c);
      p.x = pt.x + 0.5; p.y = pt.y + 0.5;
      const a = this.at(m, e.side, ARRIVE_AT, e.c);
      for (const q of w.portals) if (q.dest === m && q.exitTo === p.exit) { q.toX = a.x + 0.5; q.toY = a.y + 0.5; }
    }
    const todo = new Set<number>();
    w.maps.forEach((mp, m) => { if (!this.doneMaps.has(mp.def.id)) todo.add(m); });
    if (todo.size) { this.ring(todo); this.rocks(todo); for (const m of todo) this.doneMaps.add(w.maps[m]!.def.id); }
    this.done = 1;
    // Portal spots are always clear (a tree or a rock never stands on one).
    const clear = this.T.road ?? this.T.dirt!;
    for (const p of w.portals) {
      for (const [m, x, y] of [[p.from, p.x, p.y], [p.dest, p.toX, p.toY]] as const) {
        const tm = w.maps[m]!.tiles;
        for (let ty = Math.floor(y - 2); ty <= Math.ceil(y + 2); ty++) for (let tx = Math.floor(x - 2); tx <= Math.ceil(x + 2); tx++) {
          if (!tm.inside(tx, ty)) continue;
          const t = tm.get(tx, ty);
          if (tm.solid[t] && t !== this.T.wreck && t !== this.T.water) tm.set(tx, ty, clear);
        }
      }
    }
    this.tracks();
    this.block(!w.travelOpen);
  }

  /**
   * A worn dirt track from every gate out to the map's edge and a few metres in (imad 2026-11-26: a gate is an opening between the
   * trees, not a magic door), so a way out that has no road of its own still reads as a path. Only grass is worn (every start, idempotent).
   */
  private tracks(): void {
    const w = this.w, grass = this.T.grass, dirt = this.T.dirt;
    if (grass === undefined || dirt === undefined) return;
    for (const p of w.portals) {
      const tm = w.maps[p.from]!.tiles, x = Math.floor(p.x), y = Math.floor(p.y);
      const toEdge = [y, tm.w - 1 - x, tm.h - 1 - y, x];
      let side = 0; for (let k = 1; k < 4; k++) if (toEdge[k]! < toEdge[side]!) side = k;
      if (toEdge[side]! > 12) continue;
      const [ox, oy] = ([[0, -1], [1, 0], [0, 1], [-1, 0]] as const)[side]!;
      for (let d = -8; d <= toEdge[side]!; d++) for (let l = -1; l <= 1; l++) {
        const tx = x + ox * d - oy * l, ty = y + oy * d + ox * l;
        if (tm.inside(tx, ty) && tm.get(tx, ty) === grass) tm.set(tx, ty, dirt);
      }
    }
  }

  /** In the town's ring of trees (they are too thick to cut: the ring stays). */
  inRing(m: number, tx: number, ty: number): boolean {
    if (!this.ringed.has(m)) return false;
    const tm = this.w.maps[m]!.tiles;
    return Math.min(tx, ty, tm.w - 1 - tx, tm.h - 1 - ty) < RING;
  }

  /** Wrecked cars across the 4 roads out (travel closed) or the road clear again (open). */
  block(on: boolean): void {
    const W = this.T.wreck, road = this.T.road;
    if (W === undefined || road === undefined) return;
    for (const x of this.exits) {
      const tm = this.w.maps[x.m]!.tiles;
      for (let a = x.lo - 1; a <= x.hi + 1; a++) for (const d of [WRECK_AT, WRECK_AT + 1]) {
        const p = this.at(x.m, x.side, d, a);
        if (!tm.inside(p.x, p.y)) continue;
        const t = tm.get(p.x, p.y);
        if (on) { if (t !== W && (d === WRECK_AT || (a + d) % 2 === 0)) tm.set(p.x, p.y, W); }
        else if (t === W) tm.set(p.x, p.y, road);
      }
    }
  }

  /**
   * A player pushing into the wrecks: tell them why (once every 8 s). Called every 10 ticks.
   * Returns the slots to tell.
   */
  pushing(): number[] {
    const w = this.w, e = w.e, out: number[] = [], W = this.T.wreck;
    if (W === undefined || w.travelOpen) return out;
    for (let i = 0; i < e.hi; i++) {
      if (e.kind[i] !== Kind.Player || e.map[i] === NO_MAP || (e.flags[i]! & EFlag.Sleeping)) continue;
      if (Math.abs(e.inX[i]!) + Math.abs(e.inY[i]!) < 0.3 || !this.ringed.has(e.map[i]!)) continue;
      const tm = w.maps[e.map[i]!]!.tiles;
      const tx = Math.floor(e.x[i]! + e.inX[i]! * 0.9), ty = Math.floor(e.y[i]! + e.inY[i]! * 0.9);
      if (!tm.inside(tx, ty) || tm.get(tx, ty) !== W) continue;
      const id = e.id(i), now = Date.now();
      if ((this.blockedSay.get(id) ?? 0) > now) continue;
      this.blockedSay.set(id, now + 8000);
      out.push(i);
    }
    return out;
  }

  // ------------------------------------------------------------------ helpers
  /** Tile at depth d from the side's edge, position a along it. */
  private at(m: number, side: string, d: number, a: number): { x: number; y: number } {
    const tm = this.w.maps[m]!.tiles;
    return side === 'east' ? { x: tm.w - 1 - d, y: a } : side === 'west' ? { x: d, y: a } : side === 'north' ? { x: a, y: d } : { x: a, y: tm.h - 1 - d };
  }

  /** The road reaching that side nearest its middle (as generated). */
  private findRoad(m: number, side: string): Exit {
    const tm = this.w.maps[m]!.tiles, base = tm.base ?? tm.tiles, len = side === 'east' || side === 'west' ? tm.h : tm.w;
    const runs: [number, number][] = [];
    let s = -1;
    for (let a = 0; a <= len; a++) {
      const p = a < len ? this.at(m, side, RING + 1, a) : null;
      const road = p !== null && base[p.y * tm.w + p.x] === this.T.road;
      if (road && s < 0) s = a;
      if (!road && s >= 0) { runs.push([s, a - 1]); s = -1; }
    }
    let best: [number, number] | null = null;
    for (const r of runs) if (r[1] - r[0] >= 1 && (!best || Math.abs((r[0] + r[1]) / 2 - len / 2) < Math.abs((best[0] + best[1]) / 2 - len / 2))) best = r;
    if (!best) best = [Math.floor(len / 2) - 2, Math.floor(len / 2) + 1];
    return { m, side, lo: best[0], hi: best[1], c: Math.round((best[0] + best[1]) / 2) };
  }

  private inExit(m: number, tx: number, ty: number): boolean {
    const tm = this.w.maps[m]!.tiles;
    for (const x of this.exits) {
      if (x.m !== m) continue;
      const d = x.side === 'east' ? tm.w - 1 - tx : x.side === 'west' ? tx : x.side === 'north' ? ty : tm.h - 1 - ty;
      const a = x.side === 'east' || x.side === 'west' ? ty : tx;
      if (d <= RING + 2 && a >= x.lo - 1 && a <= x.hi + 1) return true;
    }
    return false;
  }

  /** The ring of trees round the town (open ground and roads become forest; buildings and water stay). */
  private ring(todo: Set<number>): void {
    const T = this.T, open = new Set([T.grass, T.dirt, T.road, T.rubble, T.sand].filter((x) => x !== undefined));
    for (const m of this.ringed) {
      if (!todo.has(m)) continue;
      const tm = this.w.maps[m]!.tiles;
      for (let y = 0; y < tm.h; y++) for (let x = 0; x < tm.w; x++) {
        if (Math.min(x, y, tm.w - 1 - x, tm.h - 1 - y) >= RING) continue;
        if (this.inExit(m, x, y)) { if (tm.solid[tm.get(x, y)]) tm.set(x, y, T.road!); else if (open.has(tm.get(x, y))) tm.set(x, y, T.road!); continue; }
        if (open.has(tm.get(x, y))) tm.set(x, y, T.tree!);
      }
      this.w.emit('land', { map: this.w.maps[m]!.def.id, what: 'ring' });
    }
  }

  /** Rocks to mine: clusters on open ground, many in the woods, a few in town. */
  private rocks(todo: Set<number>): void {
    const w = this.w, T = this.T, R = T.rock;
    if (R === undefined) return;
    const open = new Set([T.grass, T.dirt]);
    w.maps.forEach((mp, m) => {
      if (!todo.has(m)) return;
      const tm = mp.tiles, wild = mp.def.gen.type === 'wilds', n = mp.def.life?.rockClusters ?? (wild ? 18 : 5); // rare (imad 2026-11-25)
      let placed = 0;
      for (let tries = 0; placed < n && tries < n * 40; tries++) {
        const cx = RING + 3 + w.rng.int(tm.w - 2 * RING - 6), cy = RING + 3 + w.rng.int(tm.h - 2 * RING - 6);
        let ok = true;
        for (let y = cy - 3; y <= cy + 3 && ok; y++) for (let x = cx - 3; x <= cx + 3 && ok; x++) if (!open.has(tm.get(x, y)) && tm.get(x, y) !== T.tree) ok = false;
        for (const p of w.portals) if ((p.from === m && Math.hypot(p.x - cx, p.y - cy) < 10) || (p.dest === m && Math.hypot(p.toX - cx, p.toY - cy) < 10)) ok = false;
        if (!ok) continue;
        const k = 2 + w.rng.int(4);
        for (let j = 0; j < k; j++) {
          const x = cx + w.rng.int(3) - 1, y = cy + w.rng.int(3) - 1;
          if (open.has(tm.get(x, y))) tm.set(x, y, R);
        }
        placed++;
      }
    });
  }
}
