import { Kind } from '@worldsim/protocol';
import { ageOf } from './people.js';
import type { World } from './world.js';

/**
 * Homes (imad 2026-11-25: "the huts need doors, the doors open to the owner and his family only, people memorise their house").
 * Every hut (Survival.huts, known by the tile in front of its door) can have an owner. The owner, their partner, their
 * children, their parents and their brothers and sisters may go through its door; anyone else is put back at the doorway
 * (World.step for people, World.trustMove for players' own moves), like zombies and animals at any door. A hut with no
 * owner, a gate in the camp wall and a door in a ruin stay open to everyone.
 *
 * Owners: whoever builds a hut and has no home gets it; once an hour the free huts of a map go to the households without
 * one (couples with children first, then couples, then the oldest). When an owner dies the hut passes to the partner,
 * else a grown child, else it is free again. The person keeps it in `Profile.home` and a memory note, the planner's
 * prompt says where it is, they sleep there and run there from zombies.
 */
export interface Home { m: number; out: number; dir: number; owner: number; by: number; since: number }

export class Homes {
  readonly list: Home[] = [];
  /** `${map}:${tile}` -> home, for the 25 tiles of every hut. */
  private readonly tileOf = new Map<number, Home>();
  private saved = new Map<string, { owner: number; by: number; since: number }>();

  constructor(private w: World) {}

  save(): unknown { return this.list.map((h) => [h.m, h.out, h.owner, h.by, h.since]); }
  load(d: unknown): void {
    this.saved.clear();
    if (!Array.isArray(d)) return;
    for (const r of d as number[][]) if (Array.isArray(r) && r.length >= 3) this.saved.set(`${r[0]}:${r[1]}`, { owner: r[2]!, by: r[3] ?? -1, since: r[4] ?? 0 });
    this.sync();
  }

  /** Read the huts again (after a load, a new hut): owners kept. */
  sync(): void {
    const sv = this.w.survival, keep = new Map(this.saved);
    for (const h of this.list) keep.set(`${h.m}:${h.out}`, { owner: h.owner, by: h.by, since: h.since });
    this.list.length = 0; this.tileOf.clear();
    sv.huts.forEach((outs, m) => outs.forEach((out, n) => {
      if (out < 0) return;
      const dir = sv.hutDir[m]?.[n] ?? 0, k = keep.get(`${m}:${out}`);
      const h: Home = { m, out, dir, owner: k?.owner ?? -1, by: k?.by ?? -1, since: k?.since ?? 0 };
      this.list.push(h);
      const r = sv.hutRect(m, out, dir), W = this.w.maps[m]!.tiles.w;
      if (r) for (let yy = 0; yy < 5; yy++) for (let xx = 0; xx < 5; xx++) this.tileOf.set(m * 0x1000000 + (r.y0 + yy) * W + r.x0 + xx, h);
    }));
    this.saved.clear();
  }

  /** The hut that tile k of map m belongs to (its walls, floor or doorway). */
  at(m: number, k: number): Home | undefined { return this.tileOf.get(m * 0x1000000 + k); }
  /** Is this person (slot) inside the room of hut h? */
  inside(i: number, h: Home): boolean {
    const e = this.w.e, tm = this.w.maps[h.m]!.tiles;
    if (e.map[i] !== h.m) return false;
    return this.tileOf.get(h.m * 0x1000000 + Math.floor(e.y[i]!) * tm.w + Math.floor(e.x[i]!)) === h;
  }
  /** A hut's doorway tile. */
  doorOf(h: Home): number { return this.w.survival.hutRect(h.m, h.out, h.dir)!.door; }
  /** The middle of a hut's room (x, y in metres). */
  middle(h: Home): { x: number; y: number } {
    const r = this.w.survival.hutRect(h.m, h.out, h.dir)!;
    return { x: r.x0 + 2.5, y: r.y0 + 2.5 };
  }

  /** Family by blood or marriage: partners, parents and children, brothers and sisters. */
  family(a: number, b: number): boolean {
    if (a === b) return true;
    const pa = this.w.profiles.get(a), pb = this.w.profiles.get(b);
    if (!pa || !pb) return false;
    if (pa.partner === b || pb.partner === a) return true;
    if (pa.parents.includes(b) || pb.parents.includes(a)) return true;
    if (pa.parents.some((x) => pb.parents.includes(x))) return true;
    if (Object.keys(pa.kin ?? {}).length && this.w.family.related(a, b)) return true; // family chosen between players (sim/family.ts)
    // A partner's children (step-children) live with them too.
    if (pa.partner >= 0 && pb.parents.includes(pa.partner)) return true;
    if (pb.partner >= 0 && pa.parents.includes(pb.partner)) return true;
    return false;
  }
  /** May this person (slot) go into the hut that tile k belongs to? */
  mayEnter(i: number, m: number, k: number): boolean {
    const h = this.tileOf.get(m * 0x1000000 + k);
    if (!h || h.owner < 0) return true;
    const kind = this.w.e.kind[i];
    if (kind !== Kind.Agent && kind !== Kind.Player) return true;
    return this.family(h.owner, this.w.e.id(i));
  }
  /**
   * A step from tile `from` to tile `to` that a closed door stops: into a hut (its doorway or room) from outside it, when
   * the doorway has a door and this person is not family. Inside already = free to move and to leave.
   */
  shut(i: number, m: number, from: number, to: number): boolean {
    if (from === to || !this.tileOf.size) return false;
    const h = this.tileOf.get(m * 0x1000000 + to);
    if (!h || h.owner < 0 || this.tileOf.get(m * 0x1000000 + from) === h) return false;
    const tm = this.w.maps[m]!.tiles, r = this.w.survival.hutRect(m, h.out, h.dir);
    if (!r || !this.w.survival.isDoor(tm.tiles[r.door]!)) return false;
    return !this.mayEnter(i, m, to);
  }

  /** The hut a person lives in: their own, else their family's (partner first, then parents). */
  homeOf(id: number): Home | undefined {
    let fam: Home | undefined;
    const p = this.w.profiles.get(id);
    for (const h of this.list) {
      if (h.owner === id) return h;
      if (h.owner >= 0 && !fam && this.family(h.owner, id)) fam = h;
      else if (h.owner >= 0 && p && h.owner === p.partner) fam = h;
    }
    return fam;
  }

  /** A hut went up: the builder owns it when they have no home yet. */
  built(m: number, out: number, dir: number, builder: number): void {
    this.sync();
    const h = this.list.find((x) => x.m === m && x.out === out);
    if (!h) return;
    h.by = builder;
    if (builder >= 0 && !this.homeOf(builder) && this.adult(builder)) this.give(h, builder, 'I built it');
  }

  private adult(id: number): boolean {
    const p = this.w.profiles.get(id);
    return !!p && p.died === undefined && ageOf(p, this.w.gameSec, this.w.yearSec) >= 16;
  }
  private give(h: Home, id: number, why: string): void {
    const w = this.w, p = w.profiles.get(id);
    h.owner = id; h.since = w.gameSec;
    if (!p) return;
    const mp = w.maps[h.m]!, c = this.middle(h);
    p.home = { map: mp.def.id, x: Math.floor(c.x), y: Math.floor(c.y) };
    p.mind ??= { notes: [], summary: '', mood: 'calm', rel: {}, lastPlan: w.gameSec - 1e9 };
    p.mind.notes.push({ at: w.gameSec, text: `My home is the hut at (${Math.floor(c.x)}, ${Math.floor(c.y)}) in ${mp.def.name} (${why}). Only my family and I may go in.` });
    if (p.mind.notes.length > 12) p.mind.notes.splice(0, p.mind.notes.length - 12);
    w.emit('home', { id, name: p.name, map: mp.def.id, x: Math.floor(c.x), y: Math.floor(c.y), why });
  }

  /** People on map m who are the head of a household with no home (no family member owns one). */
  homeless(m: number): number[] {
    const w = this.w, e = w.e, out: number[] = [], seen = new Set<number>();
    for (let i = 0; i < e.hi; i++) {
      if ((e.kind[i] !== Kind.Agent && e.kind[i] !== Kind.Player) || e.map[i] !== m) continue;
      const id = e.id(i);
      if (seen.has(id) || !this.adult(id) || this.homeOf(id)) continue;
      // One per household: a partner already counted is the same family.
      const p = w.profiles.get(id)!;
      if (p.partner >= 0 && seen.has(p.partner)) continue;
      // A grown child still lives with the parents until they marry.
      if (p.partner < 0 && p.parents.some((x) => this.homeOf(x))) continue;
      seen.add(id); out.push(id);
    }
    return out;
  }
  /** Huts of map m that nobody owns. */
  free(m: number): Home[] { return this.list.filter((h) => h.m === m && h.owner < 0); }

  /** Once a game hour: an owner who died leaves the hut to the family; free huts go to households without a home. */
  hourly(): void {
    const w = this.w;
    this.sync();
    for (const h of this.list) {
      if (h.owner < 0) continue;
      const p = w.profiles.get(h.owner);
      if (p && p.died === undefined) continue;
      const heir = [p?.partner ?? -1, ...[...w.profiles].filter(([, q]) => q.parents.includes(h.owner)).map(([id]) => id)]
        .find((id) => id >= 0 && this.adult(id) && !this.ownsOne(id));
      if (p) delete p.home;
      h.owner = -1;
      if (heir !== undefined) this.give(h, heir, `it was ${p?.name ?? 'family'}'s`);
    }
    for (let m = 0; m < w.maps.length; m++) {
      const free = this.free(m);
      if (!free.length) continue;
      const want = this.homeless(m).map((id) => {
        const p = w.profiles.get(id)!, kids = [...w.profiles.values()].filter((q) => q.died === undefined && q.parents.includes(id)).length;
        return { id, score: (p.partner >= 0 ? 10 : 0) + kids * 5 + ageOf(p, w.gameSec, w.yearSec) / 100 };
      }).sort((a, b) => b.score - a.score);
      for (const h of free) { const x = want.shift(); if (!x) break; this.give(h, x.id, 'the camp gave it to us'); }
    }
  }
  private ownsOne(id: number): boolean { return this.list.some((h) => h.owner === id); }

  /** How many more huts map m needs so every household has a home. */
  needed(m: number): number { return Math.max(0, this.homeless(m).length - this.free(m).length); }
  /** For the panel and prompts: who owns what. */
  describe(id: number): string {
    const h = this.homeOf(id);
    if (!h) return 'No home yet (you sleep by the camp fire).';
    const c = this.middle(h), own = h.owner === id, ow = this.w.profiles.get(h.owner);
    return own ? `Your home: your hut at (${Math.floor(c.x)}, ${Math.floor(c.y)}); only your family may go in.`
      : `Your home: ${ow?.name ?? 'your family'}'s hut at (${Math.floor(c.x)}, ${Math.floor(c.y)}).`;
  }
}
