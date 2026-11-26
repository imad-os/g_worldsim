import { Kind, NPCS, MARK_KINDS, MAX_MARKS, type MapMark } from '@worldsim/protocol';
import type { World } from '../sim/world.js';

/**
 * The TV's own map (imad 2026-11-25: "a map that shows where I am and where the buildings and things are, like the panel's,
 * and I can mark home, mines, hunt spots"). Do `map` (text = map id, '' = where I am; "<id>:live" = without the tiles) answers the tiles of that map and
 * the places on it: gates, the camp and its fires, the store, my home, the town's teachers, my horses, people and
 * players. Do `mark` keeps the player's own marks, by character name, in SQLite meta `marks:<name>` (any map, any TV).
 */
export interface MetaStore { getMeta(k: string): string | undefined | null; setMeta(k: string, v: string): void; delMeta(k: string): void }

const r1 = (v: number) => Math.round(v * 10) / 10;

export class MapView {
  constructor(private w: World, private db: MetaStore) {}

  marks(name: string): MapMark[] {
    try {
      const v = JSON.parse(this.db.getMeta('marks:' + name.toLowerCase()) ?? '[]') as unknown;
      return Array.isArray(v) ? (v as MapMark[]).filter((m) => m && typeof m.id === 'number' && typeof m.map === 'string') : [];
    } catch { return []; }
  }
  private saveMarks(name: string, list: MapMark[]): void {
    const k = 'marks:' + name.toLowerCase();
    if (list.length) this.db.setMeta(k, JSON.stringify(list)); else this.db.delMeta(k);
  }
  /** Two names of one player became one (mergePlayer): "from"'s marks join "into"'s. */
  merge(from: string, into: string): void {
    const a = this.marks(from);
    if (!a.length) return;
    const b = this.marks(into);
    let id = b.reduce((n, m) => Math.max(n, m.id), 0);
    for (const m of a) if (b.length < MAX_MARKS) b.push({ ...m, id: ++id });
    this.saveMarks(into, b); this.saveMarks(from, []);
  }
  forget(name: string): void { this.saveMarks(name, []); }

  /**
   * Do `mark`: "add:<map>:<x>:<y>:<kind>[:<label>]" | "del:<id>" | "name:<id>:<label>" | "kind:<id>:<kind>" | "list".
   * Answer { ok, code: 'marks', marks } (code markFull / markBad when it can't).
   */
  mark(name: string, text: string): Record<string, unknown> {
    const list = this.marks(name);
    const [op, ...rest] = text.split(':');
    const out = (code = 'marks', ok = true) => ({ ok, code, marks: this.marks(name) });
    if (op === 'add') {
      const [mapId, xs, ys, kind, ...lab] = rest;
      const mi = this.w.maps.findIndex((m) => m.def.id === mapId);
      const x = Number(xs), y = Number(ys);
      if (mi < 0 || !Number.isFinite(x) || !Number.isFinite(y) || !(MARK_KINDS as readonly string[]).includes(kind ?? '')) return out('markBad', false);
      if (list.length >= MAX_MARKS) return out('markFull', false);
      const t = this.w.maps[mi]!.tiles;
      const id = list.reduce((n, m) => Math.max(n, m.id), 0) + 1;
      list.push({ id, map: mapId!, x: r1(Math.max(0, Math.min(t.w, x))), y: r1(Math.max(0, Math.min(t.h, y))), kind: kind as MapMark['kind'], label: lab.join(':').trim().slice(0, 40), at: Date.now() });
      this.saveMarks(name, list);
      return { ...out('marked'), id };
    }
    const id = Number(rest[0]), m = list.find((q) => q.id === id);
    if (op === 'del') { if (!m) return out('markBad', false); this.saveMarks(name, list.filter((q) => q !== m)); return out('unmarked'); }
    if (op === 'name') { if (!m) return out('markBad', false); m.label = rest.slice(1).join(':').trim().slice(0, 40); this.saveMarks(name, list); return out('renamed'); }
    if (op === 'kind') { const k = rest[1] ?? ''; if (!m || !(MARK_KINDS as readonly string[]).includes(k)) return out('markBad', false); m.kind = k as MapMark['kind']; this.saveMarks(name, list); return out('renamed'); }
    return out();
  }

  /** Do `map`: one map's tiles and what stands on it, as the player may know it. */
  view(name: string, player: number, text: string): Record<string, unknown> {
    const w = this.w, e = w.e, [mapId, live] = text.split(':');
    let m = mapId ? w.maps.findIndex((q) => q.def.id === mapId) : e.map[player]!;
    if (m < 0 || m >= w.maps.length) m = e.map[player]! < w.maps.length ? e.map[player]! : 0;
    const mp = w.maps[m]!, tw = mp.tiles.w, me = e.id(player);
    const at = (k: number) => [k % tw + 0.5, Math.floor(k / tw) + 0.5];
    const people: [number, number][] = [], players: [number, number, string][] = [], npcs: [number, number, string][] = [], horses: [number, number, string][] = [];
    const chars = new Map<number, string>();
    for (const [n, i] of this.planner()) chars.set(i, n);
    for (let i = 0; i < e.hi; i++) {
      if (!e.alive(i) || e.map[i] !== m || i === player) continue;
      const k = e.kind[i];
      if (chars.has(i)) players.push([r1(e.x[i]!), r1(e.y[i]!), chars.get(i)!]);
      else if (k === Kind.Agent) people.push([r1(e.x[i]!), r1(e.y[i]!)]);
    }
    for (const n of NPCS) { const s = w.quests.npcSlot(n.key); if (s >= 0 && e.map[s] === m) npcs.push([r1(e.x[s]!), r1(e.y[s]!), n.key]); }
    for (const s of w.horses.mine(player)) if (e.map[s] === m) horses.push([r1(e.x[s]!), r1(e.y[s]!), w.horses.of(s)?.name ?? '']);
    const fires = [...w.survival.fires.keys()].filter((k) => k.startsWith(m + ':')).map((k) => at(Number(k.slice(String(m).length + 1))));
    const camp = w.survival.campOf(m), stash = w.survival.stash[m];
    const home = w.survival.homes.homeOf(me);
    const homeAt = home && home.m === m ? w.survival.homes.middle(home) : null;
    const huts = w.survival.homes.list.filter((h) => h.m === m).map((h) => { const c = w.survival.homes.middle(h); return [r1(c.x), r1(c.y), h.owner === me ? 1 : h.owner >= 0 ? 2 : 0, h.owner >= 0 ? w.profiles.get(h.owner)?.name ?? '' : '']; });
    const portals = w.portals.filter((p) => p.from === m).map((p) => [r1(p.x), r1(p.y), w.maps[p.dest]?.def.id ?? p.to]);
    return {
      ok: true, code: 'map',
      map: { id: mp.def.id, name: mp.def.name, w: tw, h: mp.tiles.h, ...(live === 'live' ? {} : { tiles: mp.tiles.tiles }) }, // 'live' = places only (the TV keeps the tiles)
      maps: w.maps.map((q) => [q.def.id, q.def.name]),
      me: e.map[player] === m ? [r1(e.x[player]!), r1(e.y[player]!), +e.angle[player]!.toFixed(2)] : null,
      places: {
        camp: camp ? [r1(camp.x), r1(camp.y)] : null, fires, home: homeAt ? [r1(homeAt.x), r1(homeAt.y)] : null, huts,
        store: stash ? at(stash.t) : null,
        portals, npcs, horses, people, players,
      },
      marks: this.marks(name),
    };
  }
  /** Players' characters [name, slot] (set by the app: the network knows them). */
  planner: () => [string, number][] = () => [];
}
