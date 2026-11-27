import type { World } from './world.js';

/**
 * Stables and horse fields (imad 2026-11-27: "a horse stable and a horses field, so when we are not riding them they go there after
 * seconds of not in use; in the wild they feed on grass and roam like normal horses").
 *
 * Every map that is not wild (Old Town, Ridgeford, Willow Farms) gets one paddock, laid once by the land on run-time tiles (old worlds get
 * it on their next start): a post-and-rail fence (`fence`) round a field of pasture (`paddock`, its own ground so nothing is built or
 * grows there), a 2-tile gate on the side that faces the camp / the middle of the map, and a stable at the back: plank walls
 * (`stablewall`) on three sides and a roofed straw floor (`stall`) open to the field. A tamed horse nobody rides on such a map walks there
 * by a real path, grazes and roams inside the fence by day and stands in the stable at night or in rain / snow (sim/horses.ts).
 * Nothing about it is saved: the layout is read back from the tiles at every start (so a cloud restore keeps it too).
 */
export interface Paddock {
  m: number;
  /** Fence box, tiles, inclusive. */
  x0: number; y0: number; x1: number; y1: number;
  /** Tile just outside the gate and just inside it (centres in metres). */
  ox: number; oy: number; ix: number; iy: number;
  /** Stall box (tiles, inclusive). */
  sx0: number; sy0: number; sx1: number; sy1: number;
}

/** Field size in tiles along / across the gate's side (outer box, fence included) and the stable's depth / width. */
const LONG = 20, DEEP = 15, ST_W = 10, ST_D = 5;

export class Stables {
  readonly list: (Paddock | null)[] = [];
  private T: Record<string, number> = {};
  constructor(private w: World) { for (const t of w.sc.tiles) this.T[t.name] = t.id; }

  /** The paddock of map m (null: wild map / none). */
  of(m: number): Paddock | null { return this.list[m] ?? null; }
  /** Inside the fence (the field or the stable), with an optional margin in tiles. */
  inside(m: number, x: number, y: number, margin = 0): boolean {
    const p = this.list[m];
    return !!p && x >= p.x0 + 1 - margin && x < p.x1 + margin && y >= p.y0 + 1 - margin && y < p.y1 + margin;
  }
  inStall(m: number, x: number, y: number): boolean {
    const p = this.list[m];
    return !!p && x >= p.sx0 && x < p.sx1 + 1 && y >= p.sy0 && y < p.sy1 + 1;
  }
  /** Can a horse on map m be kept in a stable there. */
  has(m: number): boolean { return !!this.list[m]; }

  /** Every start, after the land: read each map's paddock from its tiles; a town map without one gets it now. */
  setup(): void {
    const w = this.w, T = this.T;
    this.list.length = 0;
    if (T.fence === undefined || T.paddock === undefined || T.stall === undefined || T.stablewall === undefined) return;
    w.maps.forEach((mp, m) => {
      this.list[m] = this.read(m);
      if (this.list[m] || this.wild(m)) return;
      const s = this.site(m);
      if (!s) { this.list[m] = null; return; }
      this.lay(m, s.x0, s.y0, s.side);
      this.list[m] = this.read(m);
      if (this.list[m]) w.emit('stable', { map: mp.def.id, x: s.x0, y: s.y0 });
    });
  }
  private wild(m: number): boolean { const d = this.w.maps[m]!.def; return d.gen.type === 'wilds' || d.danger === true; }

  /** The paddock from the tiles (fence bounding box, stall box, the gate = the gap in the fence line). */
  private read(m: number): Paddock | null {
    const tm = this.w.maps[m]!.tiles, T = this.T;
    let x0 = 1e9, y0 = 1e9, x1 = -1, y1 = -1, sx0 = 1e9, sy0 = 1e9, sx1 = -1, sy1 = -1;
    for (let k = 0; k < tm.tiles.length; k++) {
      const t = tm.tiles[k]!;
      if (t !== T.fence && t !== T.stablewall && t !== T.stall) continue;
      const x = k % tm.w, y = (k / tm.w) | 0;
      if (t === T.stall) { sx0 = Math.min(sx0, x); sy0 = Math.min(sy0, y); sx1 = Math.max(sx1, x); sy1 = Math.max(sy1, y); }
      else { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); }
    }
    if (x1 < 0 || sx1 < 0 || x1 - x0 < 6 || y1 - y0 < 6) return null;
    // The gate: a run of open tiles on the fence line.
    let gx = -1, gy = -1, nx = 0, ny = 0;
    const edge = (x: number, y: number, dx: number, dy: number) => {
      if (gx >= 0) return;
      const t = tm.get(x, y);
      if (t !== T.fence && t !== T.stablewall && !tm.solid[t]) { gx = x; gy = y; nx = dx; ny = dy; }
    };
    for (let x = x0 + 1; x < x1; x++) { edge(x, y0, 0, -1); edge(x, y1, 0, 1); }
    for (let y = y0 + 1; y < y1; y++) { edge(x0, y, -1, 0); edge(x1, y, 1, 0); }
    if (gx < 0) return null;
    // Middle of a 2-wide gate: the next tile along the fence line is open too.
    const ax = ny ? 1 : 0, ay = nx ? 1 : 0;
    const t2 = tm.get(gx + ax, gy + ay), two = t2 !== T.fence && t2 !== T.stablewall && !tm.solid[t2];
    const cx = gx + 0.5 + (two ? ax * 0.5 : 0), cy = gy + 0.5 + (two ? ay * 0.5 : 0);
    return { m, x0, y0, x1, y1, ox: cx + nx * 1.6, oy: cy + ny * 1.6, ix: cx - nx * 2.2, iy: cy - ny * 2.2, sx0, sy0, sx1, sy1 };
  }

  /**
   * Where the paddock goes: open ground (grass, dirt, sand, herbs; trees are cleared) inside the ring of trees, clear of the gates,
   * the camp's wall circle, roads, ruins, water and huts; the gate faces the camp (else the middle of the map) and has open ground in
   * front of it; about 30-45 m from there (close enough to fetch a horse, out of the village's way).
   */
  private site(m: number): { x0: number; y0: number; side: number } | null {
    const w = this.w, tm = w.maps[m]!.tiles, T = this.T;
    const ok = new Set([T.grass, T.dirt, T.sand, T.herbs].filter((t) => t !== undefined));
    const camp = w.survival.campOf(m), cx = camp?.x ?? tm.w / 2, cy = camp?.y ?? tm.h / 2;
    const wallR = camp ? 32 : 0;
    let best: { x0: number; y0: number; side: number } | null = null, bs = -Infinity;
    for (let side = 0; side < 4; side++) { // side the gate is on: 0 north, 1 east, 2 south, 3 west
      const W = side % 2 === 0 ? LONG : DEEP, H = side % 2 === 0 ? DEEP : LONG;
      for (let y0 = 10; y0 + H < tm.h - 10; y0 += 2) for (let x0 = 10; x0 + W < tm.w - 10; x0 += 2) {
        const mx = x0 + W / 2, my = y0 + H / 2, d = Math.hypot(mx - cx, my - cy);
        if (d < wallR + Math.max(W, H) / 2 + 2 || d > 80) continue;
        // The gate must face the camp: its side's outward normal points towards it.
        const [nx, ny] = ([[0, -1], [1, 0], [0, 1], [-1, 0]] as const)[side]!;
        if ((cx - mx) * nx + (cy - my) * ny < Math.hypot(cx - mx, cy - my) * 0.5) continue;
        if (w.land.inRing(m, x0 - 1, y0 - 1) || w.land.inRing(m, x0 + W, y0 + H)) continue;
        let bad = false, trees = 0;
        for (let y = y0 - 1; y <= y0 + H && !bad; y++) for (let x = x0 - 1; x <= x0 + W && !bad; x++) {
          const t = tm.get(x, y), edge = x < x0 || y < y0 || x >= x0 + W || y >= y0 + H;
          if (t === T.tree) { if (edge) continue; trees++; continue; }
          if (edge ? tm.solid[t] && t !== T.rock : !ok.has(t)) bad = true;
        }
        if (bad) continue;
        // Open ground in front of the gate.
        const gx = side % 2 === 0 ? x0 + W / 2 : side === 1 ? x0 + W + 1 : x0 - 2, gy = side % 2 === 1 ? y0 + H / 2 : side === 2 ? y0 + H + 1 : y0 - 2;
        let front = true;
        for (let k = -1; k <= 1 && front; k++) { const t = tm.get(Math.floor(gx + (ny ? k : 0)), Math.floor(gy + (nx ? k : 0))); if (tm.solid[t] && t !== T.tree) front = false; }
        if (!front) continue;
        let near = false;
        for (const p of w.portals) if ((p.from === m && Math.hypot(p.x - mx, p.y - my) < 24) || (p.dest === m && Math.hypot(p.toX - mx, p.toY - my) < 24)) near = true;
        if (near) continue;
        const score = -Math.abs(d - 38) / 8 - trees / 25 - (side === 2 ? 0 : 0.05);
        if (score > bs) { bs = score; best = { x0, y0, side }; }
      }
    }
    return best;
  }

  /** Lay the fence, field, gate and stable with the gate on `side` (0 N, 1 E, 2 S, 3 W) of the box at (x0, y0). */
  lay(m: number, x0: number, y0: number, side: number): void {
    const tm = this.w.maps[m]!.tiles, T = this.T;
    // Local frame: u along the gate's side (0..LONG-1), v from the stable's back wall (0) to the gate's side (DEEP-1).
    const at = (u: number, v: number): [number, number] => {
      switch (side) {
        case 2: return [x0 + u, y0 + v]; // gate south, stable north
        case 0: return [x0 + LONG - 1 - u, y0 + DEEP - 1 - v]; // gate north
        case 1: return [x0 + v, y0 + u]; // gate east, stable west
        default: return [x0 + DEEP - 1 - v, y0 + LONG - 1 - u]; // gate west
      }
    };
    const gateU = Math.floor(LONG / 2) + 2; // a little off the middle, away from the stable's side
    for (let v = 0; v < DEEP; v++) for (let u = 0; u < LONG; u++) {
      const [x, y] = at(u, v), border = u === 0 || v === 0 || u === LONG - 1 || v === DEEP - 1;
      let t = T.paddock!;
      if (border) t = T.fence!;
      if (v === DEEP - 1 && (u === gateU || u === gateU + 1)) t = T.dirt ?? T.grass!; // the gate
      const inSt = u < ST_W && v < ST_D;
      if (inSt) {
        if (u === 0 || v === 0 || u === ST_W - 1) t = v < ST_D - 1 || u === 0 ? T.stablewall! : t; // back + sides, open front
        else t = T.stall!;
        if (u === ST_W - 1 && v === ST_D - 1) t = T.paddock!; // the front corner stays open (the end of the side wall)
      }
      tm.set(x, y, t);
    }
    // A worn track out of the gate (two tiles of dirt where it was grass).
    for (let k = 1; k <= 3; k++) for (const du of [gateU, gateU + 1]) {
      const [x, y] = at(du, DEEP - 1 + k);
      if (tm.inside(x, y) && tm.get(x, y) === T.grass) tm.set(x, y, T.dirt ?? T.grass!);
    }
  }

  /** A spot to stand on: in the field (`stall` false) or under the stable's roof (true), random, centre of a tile. */
  spot(m: number, stall: boolean, r: () => number): { x: number; y: number } | null {
    const p = this.list[m];
    if (!p) return null;
    const [ax, ay, bx, by] = stall ? [p.sx0, p.sy0, p.sx1, p.sy1] : [p.x0 + 2, p.y0 + 2, p.x1 - 2, p.y1 - 2];
    const tm = this.w.maps[m]!.tiles;
    for (let t = 0; t < 12; t++) {
      const x = ax + Math.floor(r() * (bx - ax + 1)), y = ay + Math.floor(r() * (by - ay + 1));
      if (!tm.solid[tm.get(x, y)] && (stall || !this.inStall(m, x, y))) return { x: x + 0.5, y: y + 0.5 };
    }
    return null;
  }
  /** For the TV map / prompts: [map, x, y] of each paddock's middle and its gate. */
  places(m: number): { x: number; y: number; gx: number; gy: number } | null {
    const p = this.list[m];
    return p ? { x: (p.x0 + p.x1 + 1) / 2, y: (p.y0 + p.y1 + 1) / 2, gx: p.ox, gy: p.oy } : null;
  }
}
