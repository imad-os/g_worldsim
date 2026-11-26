import { MARK_ICON, type MapMark } from '@worldsim/protocol';
import { Pathfinder } from '../sim/pathfind.js';
import type { World } from '../sim/world.js';

/**
 * Where a player can head for (imad 2026-11-26): the compass bar on top of the TV (home, gates, camp, my horse, my partner,
 * my marks) and the quick wheel on horseback (ride by yourself to home / the camp / another map / a saved mark).
 *
 * Do `compass` -> { places: [kind, label, x, y, d, via] } for MY map: a place on another map is shown at the gate on the way
 * there (`via` = that map's id). Do `rideTo` '' -> { dests: [id, kind, label, d] } (only the ones worth riding to: 30 m+ away
 * or on another map); Do `rideTo` <id> -> { pts: [[x, y]...], gate: bool, label } = the road for this map's leg. The TV steers
 * along it like a stick held forward (its prediction stays as it is); a gate leg ends in the gate, and on the next map the TV
 * asks again with the same id.
 */
export interface Place { id: string; kind: string; label: string; map: number; x: number; y: number }

const FAR = 30;

export class Waypoints {
  private finders: Pathfinder[] = [];
  constructor(private w: World, private marks: (name: string) => MapMark[]) {}

  private finder(m: number): Pathfinder { return this.finders[m] ??= new Pathfinder(this.w.maps[m]!.tiles, 60000, 256); }

  /** Everything I know the place of, on any map. */
  all(name: string, i: number): Place[] {
    const w = this.w, e = w.e, me = e.id(i), out: Place[] = [];
    const sv = w.survival, home = sv.homes.homeOf(me);
    if (home) { const W = w.maps[home.m]!.tiles.w; out.push({ id: 'home', kind: 'home', label: 'home', map: home.m, x: (home.out % W) + 0.5, y: Math.floor(home.out / W) + 0.5 }); } // in front of its door (horses never go in)
    for (let m = 0; m < w.maps.length; m++) { const c = sv.campOf(m); if (c) out.push({ id: 'camp:' + w.maps[m]!.def.id, kind: 'camp', label: w.maps[m]!.def.name, map: m, x: c.x, y: c.y }); }
    for (const s of w.horses.mine(i)) {
      const h = w.horses.of(s);
      if (h && h.rider < 0 && e.map[s]! < w.maps.length) out.push({ id: 'horse:' + e.id(s), kind: 'horse', label: h.name, map: e.map[s]!, x: e.x[s]!, y: e.y[s]! });
    }
    const p = w.profiles.get(me), ps = p && p.partner >= 0 ? e.slot(p.partner) : -1;
    if (ps >= 0 && e.map[ps]! < w.maps.length) out.push({ id: 'partner', kind: 'partner', label: w.profiles.get(p!.partner)?.name ?? '', map: e.map[ps]!, x: e.x[ps]!, y: e.y[ps]! });
    for (const mk of this.marks(name)) {
      const m = w.maps.findIndex((q) => q.def.id === mk.map);
      if (m >= 0) out.push({ id: 'mark:' + mk.id, kind: 'mark:' + mk.kind, label: mk.label || MARK_ICON[mk.kind] || '', map: m, x: mk.x, y: mk.y });
    }
    return out;
  }

  /** The first gate on the way from map a to map b (portal index, -1 = none). */
  private gate(a: number, b: number): number {
    const r = this.w.routeMaps(a, b);
    return r && r.length ? r[0]! : -1;
  }

  compass(name: string, i: number): Record<string, unknown> {
    const w = this.w, e = w.e, m = e.map[i]!, x = e.x[i]!, y = e.y[i]!;
    const rows: (string | number)[][] = [];
    const add = (kind: string, label: string, px: number, py: number, via = '') => rows.push([kind, label, Math.round(px * 10) / 10, Math.round(py * 10) / 10, Math.round(Math.hypot(px - x, py - y)), via]);
    w.portals.forEach((p) => { if (p.from === m) add('gate', w.maps[p.dest]?.def.name ?? p.to, p.x, p.y, w.maps[p.dest]?.def.id ?? ''); });
    for (const pl of this.all(name, i)) {
      if (pl.kind === 'camp' && pl.map !== m) continue; // only this map's camp
      if (pl.map === m) { add(pl.kind, pl.label, pl.x, pl.y); continue; }
      const g = this.gate(m, pl.map);
      if (g >= 0) add(pl.kind, pl.label, w.portals[g]!.x, w.portals[g]!.y, w.maps[pl.map]!.def.id);
    }
    return { ok: true, code: 'compass', places: rows.slice(0, 40) };
  }

  /** The places worth riding to from here. */
  dests(name: string, i: number): [string, string, string, number][] {
    const w = this.w, e = w.e, m = e.map[i]!, x = e.x[i]!, y = e.y[i]!, out: [string, string, string, number][] = [];
    const dist = (pl: { map: number; x: number; y: number }) => pl.map === m ? Math.hypot(pl.x - x, pl.y - y) : -1; // -1 = another map
    for (const pl of this.all(name, i)) {
      if (pl.kind === 'horse' || pl.kind === 'partner') continue;
      if (pl.kind === 'camp' && pl.map !== m) continue;
      const d = dist(pl);
      if (d >= 0 && d < FAR) continue; // already here: no "go home" next to home
      if (d < 0 && this.gate(m, pl.map) < 0) continue;
      out.push([pl.id, pl.kind, pl.label, Math.round(d)]);
    }
    // Other maps (the woods, the town): through their gate.
    for (let k = 0; k < w.maps.length; k++) if (k !== m && this.gate(m, k) >= 0) out.push(['map:' + w.maps[k]!.def.id, w.wild(k) ? 'wild' : 'map', w.maps[k]!.def.name, -1]);
    const home = out.filter((r) => r[1] === 'home'), rest = out.filter((r) => r[1] !== 'home');
    const marks = rest.filter((r) => r[1].startsWith('mark:')).sort((a, b) => (a[3] < 0 ? 1e9 : a[3]) - (b[3] < 0 ? 1e9 : b[3])).slice(0, 5);
    return [...home, ...rest.filter((r) => !r[1].startsWith('mark:')), ...marks];
  }

  /** The road for this map's leg towards destination `id`. */
  route(name: string, i: number, id: string): Record<string, unknown> {
    const w = this.w, e = w.e, m = e.map[i]!;
    let target: { map: number; x: number; y: number; label: string } | null = null;
    const pt = /^pt:([^:]+):(-?[\d.]+):(-?[\d.]+)$/.exec(id); // a place picked on the TV's map (imad 2026-11-26)
    if (pt) {
      const k = w.maps.findIndex((q) => q.def.id === pt[1]);
      if (k < 0) return { ok: false, code: 'noRoute' };
      const tm = w.maps[k]!.tiles, x = Math.max(0.5, Math.min(tm.w - 0.5, Number(pt[2]))), y = Math.max(0.5, Math.min(tm.h - 0.5, Number(pt[3])));
      // A solid spot (a tree, a wall, water): the nearest open ground next to it.
      let gx = x, gy = y;
      if (tm.isSolidAt(x, y)) {
        let bd = Infinity;
        for (let r = 1; r <= 6 && bd === Infinity; r++) for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) {
          const xx = Math.floor(x) + dx, yy = Math.floor(y) + dy;
          if (!tm.inside(xx, yy) || tm.solid[tm.get(xx, yy)]) continue;
          const d = dx * dx + dy * dy; if (d < bd) { bd = d; gx = xx + 0.5; gy = yy + 0.5; }
        }
        if (bd === Infinity) return { ok: false, code: 'noRoute' };
      }
      target = { map: k, x: gx, y: gy, label: `${Math.round(x)}, ${Math.round(y)}` };
    } else if (id.startsWith('map:')) {
      const k = w.maps.findIndex((q) => q.def.id === id.slice(4));
      if (k < 0) return { ok: false, code: 'noRoute' };
      if (k === m) return { ok: true, code: 'arrived', id, label: w.maps[k]!.def.name };
      target = { map: k, x: NaN, y: NaN, label: w.maps[k]!.def.name };
    } else {
      const pl = this.all(name, i).find((p) => p.id === id);
      if (!pl) return { ok: false, code: 'noRoute' };
      target = pl;
    }
    let gx = target.x, gy = target.y, gate = false;
    if (target.map !== m) {
      const g = this.gate(m, target.map);
      if (g < 0) return { ok: false, code: 'noRoute' };
      gx = w.portals[g]!.x; gy = w.portals[g]!.y; gate = true;
    } else if (Math.hypot(gx - e.x[i]!, gy - e.y[i]!) < 4) return { ok: true, code: 'arrived', id, label: target.label };
    const pf = this.finder(m), r = pf.find(e.x[i]!, e.y[i]!, gx, gy);
    if (r === 'none') return { ok: false, code: 'noRoute' };
    const W = w.maps[m]!.tiles.w, pts: [number, number][] = [];
    for (let k = 0; k < pf.outN; k++) { const t = pf.out[k]!; pts.push([(t % W) + 0.5, Math.floor(t / W) + 0.5]); }
    if (r === 'full') pts.push([Math.round(gx * 10) / 10, Math.round(gy * 10) / 10]);
    return { ok: true, code: 'route', id, label: target.label, gate, full: r === 'full', pts };
  }
}
