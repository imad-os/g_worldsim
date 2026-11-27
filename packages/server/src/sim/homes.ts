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
/** imad 2026-11-25: a person may build at most 2 huts on a map. */
export const HUTS_PER_MAP = 2;
/**
 * Grown up (imad 2026-11-26: "my house is crowded with family; kids stay in the parents' hut as long as they are children, everyone
 * who became an adult can't enter it, make them aware so they build their own"): from 18 a son or daughter no longer lives in, nor
 * goes into, the parents' hut. A home is for its household only: the owner, the partner and their children under GROWN.
 */
export const GROWN = 18;

export interface Home { m: number; out: number; dir: number; owner: number; by: number; since: number }

export class Homes {
  readonly list: Home[] = [];
  /** `${map}:${tile}` -> home, for every tile of every hut (49 for a 7 x 7 one). */
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
      if (r) for (let yy = 0; yy < r.s; yy++) for (let xx = 0; xx < r.s; xx++) this.tileOf.set(m * 0x1000000 + (r.y0 + yy) * W + r.x0 + xx, h);
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
    return { x: r.x0 + r.s / 2, y: r.y0 + r.s / 2 };
  }

  /** Family by blood or marriage: partners, parents and children, brothers and sisters (who counts as family, not who may go in). */
  family(a: number, b: number): boolean {
    if (a === b) return true;
    const pa = this.w.profiles.get(a), pb = this.w.profiles.get(b);
    if (!pa || !pb) return false;
    if (pa.partner === b || pb.partner === a) return true;
    if (pa.parents.includes(b) || pb.parents.includes(a)) return true;
    if (pa.parents.some((x) => pb.parents.includes(x))) return true;
    if (Object.keys(pa.kin ?? {}).length && this.w.family.related(a, b)) return true; // family chosen between players (sim/family.ts)
    if (pa.partner >= 0 && pb.parents.includes(pa.partner)) return true;
    if (pb.partner >= 0 && pa.parents.includes(pb.partner)) return true;
    return false;
  }
  /** Is this person a child (under GROWN), alive or not? */
  private young(id: number): boolean {
    const p = this.w.profiles.get(id);
    return !!p && !p.player && ageOf(p, this.w.gameSec, this.w.yearSec) < GROWN;
  }
  /**
   * The household of the hut owned by `owner`: the owner, the partner and the children (or step-children) under GROWN. Grown sons and
   * daughters, brothers, sisters and parents are family but live in homes of their own (imad 2026-11-26).
   */
  household(owner: number, b: number): boolean {
    if (owner === b) return true;
    const po = this.w.profiles.get(owner), pb = this.w.profiles.get(b);
    if (!po || !pb) return false;
    if (po.partner === b || pb.partner === owner) return true;
    const kid = pb.parents.includes(owner) || (po.partner >= 0 && pb.parents.includes(po.partner));
    return kid && this.young(b);
  }
  /** A grown son or daughter of this hut's owner or partner (shut out since they came of age). */
  grownChild(h: Home, id: number): boolean {
    const po = this.w.profiles.get(h.owner), p = this.w.profiles.get(id);
    if (!po || !p || p.player) return false;
    return (p.parents.includes(h.owner) || (po.partner >= 0 && p.parents.includes(po.partner))) && !this.young(id);
  }
  /** May this person (slot) go into the hut that tile k belongs to? */
  mayEnter(i: number, m: number, k: number): boolean {
    const h = this.tileOf.get(m * 0x1000000 + k);
    if (!h || h.owner < 0) return true;
    const kind = this.w.e.kind[i];
    if (kind !== Kind.Agent && kind !== Kind.Player) return true;
    return this.household(h.owner, this.w.e.id(i));
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

  /** The hut a person lives in: their own, else their household's (the partner's first, then a parent's while they are a child). */
  homeOf(id: number): Home | undefined {
    let fam: Home | undefined;
    const p = this.w.profiles.get(id);
    for (const h of this.list) {
      if (h.owner === id) return h;
      if (h.owner >= 0 && p && h.owner === p.partner) fam = h;
      else if (h.owner >= 0 && !fam && this.household(h.owner, id)) fam = h;
    }
    return fam;
  }

  /** A hut went up: the builder owns it when they have no home yet. */
  built(m: number, out: number, dir: number, builder: number): void {
    this.sync();
    const h = this.list.find((x) => x.m === m && x.out === out);
    if (!h) return;
    h.by = builder;
    // A player always owns what they build (imad 2026-11-25: "I built a hut, slept, and was locked out": a second hut used to stay
    // ownerless and was handed to another family). An AI builder owns it when homeless, else it is for a family without a home.
    const pl = builder >= 0 && !!this.w.profiles.get(builder)?.player;
    if (builder >= 0 && (pl || !this.homeOf(builder)) && this.adult(builder)) this.give(h, builder, 'I built it');
  }
  /** How many huts person `id` built on map m (at most HUTS_PER_MAP, imad 2026-11-25). */
  builtBy(id: number, m: number): number { this.sync(); return this.list.filter((h) => h.m === m && h.by === id).length; }


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

  /** Person id moved away for good (sim/migrate.ts): the hut they owned on another map than `m` is free again. */
  leave(id: number, m: number): void {
    this.sync();
    const p = this.w.profiles.get(id);
    for (const h of this.list) if (h.owner === id && h.m !== m) {
      h.owner = -1;
      if (p) delete p.home;
      this.w.emit('home', { id, name: p?.name ?? '', map: this.w.maps[h.m]!.def.id, left: true, why: 'moved away' });
    }
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
    this.comeOfAge();
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
  /**
   * Sons and daughters who turned GROWN leave the parents' hut (imad 2026-11-26): once, a memory note and a line in every prompt tell them
   * they must build a hut of their own (or move into a free one); the camp's plans count them as a household without a home. Anyone
   * inside a hut that is not theirs to enter (a grown child, a guest left in when a door shut) is put out in front of its door.
   */
  comeOfAge(): void {
    const w = this.w, e = w.e;
    for (const h of this.list) {
      if (h.owner < 0) continue;
      for (const [id, p] of w.profiles) {
        if (p.died !== undefined || p.leftHome !== undefined || !this.grownChild(h, id)) continue;
        p.leftHome = w.gameSec;
        if (this.ownsOne(id)) continue;
        p.mind ??= { notes: [], summary: '', mood: 'calm', rel: {}, lastPlan: w.gameSec - 1e9 };
        p.mind.notes.push({ at: w.gameSec, text: `I am grown up now: my parents' hut is not my home any more and its door stays shut to me. I must build a hut of my own (or move into a free one).` });
        if (p.mind.notes.length > 12) p.mind.notes.splice(0, p.mind.notes.length - 12);
        w.emit('leftHome', { id, name: p.name, owner: h.owner });
      }
    }
    for (let i = 0; i < e.hi; i++) {
      if ((e.kind[i] !== Kind.Agent && e.kind[i] !== Kind.Player) || e.map[i]! >= w.maps.length) continue;
      const tm = w.maps[e.map[i]!]!.tiles, k = Math.floor(e.y[i]!) * tm.w + Math.floor(e.x[i]!), h = this.at(e.map[i]!, k);
      if (!h || h.owner < 0 || this.mayEnter(i, h.m, k) || k === this.doorOf(h)) continue;
      const W = tm.w;
      w.place(i, h.m, (h.out % W) + 0.5, Math.floor(h.out / W) + 0.5);
      w.emit('blocked', { id: e.id(i), why: 'door', put: 'out' });
    }
  }
  /** Grown up and still without a hut of their own: what every prompt about them says. */
  private grownText(id: number): string {
    const p = this.w.profiles.get(id);
    if (!p || p.player || p.leftHome === undefined) return '';
    return ' You are grown up: your parents\' hut is closed to you. Build a hut of your own (skill build {"what":"hut"}) or move into a free one; when you marry, your partner lives with you.';
  }
  private ownsOne(id: number): boolean { return this.list.some((h) => h.owner === id); }

  /** Someone with no home takes a free hut on map m (nearest first). The why for the task, or '' when they have a home / none is free. */
  moveIn(id: number, m: number): string {
    if (this.homeOf(id) || !this.adult(id)) return '';
    const s = this.w.e.slot(id), x = s >= 0 ? this.w.e.x[s]! : 0, y = s >= 0 ? this.w.e.y[s]! : 0;
    const h = this.free(m).sort((a, b) => { const ca = this.middle(a), cb = this.middle(b); return Math.hypot(ca.x - x, ca.y - y) - Math.hypot(cb.x - x, cb.y - y); })[0];
    if (!h) return '';
    this.give(h, id, 'it stood empty');
    const c = this.middle(h);
    return `no need: the free hut at (${Math.floor(c.x)}, ${Math.floor(c.y)}) is my home now`;
  }
  /** Every hut of a map (or all maps) with where it is, its door side and who lives there: for prompts, the panel and the TV map. */
  where(m?: number): { map: string; x: number; y: number; dir: number; door: [number, number]; owner: number; ownerName: string; free: boolean; by: number }[] {
    const w = this.w;
    this.sync();
    return this.list.filter((h) => m === undefined || h.m === m).map((h) => {
      const c = this.middle(h), tm = w.maps[h.m]!.tiles, d = this.doorOf(h);
      return { map: w.maps[h.m]!.def.id, x: Math.round(c.x * 10) / 10, y: Math.round(c.y * 10) / 10, dir: h.dir, door: [d % tm.w, (d / tm.w) | 0], owner: h.owner,
        ownerName: h.owner >= 0 ? w.profiles.get(h.owner)?.name ?? '' : '', free: h.owner < 0, by: h.by };
    });
  }
  /** For prompts: the huts on this map and whose they are (people know where every hut stands). */
  mapText(m: number, id: number): string {
    const all = this.where(m);
    if (!all.length) return 'Huts on this map: none yet.';
    const fam = (o: number) => o !== id && o >= 0 && this.family(id, o);
    // imad 2026-11-27 (prompts too long): every free hut, mine and my family's, then the 3 nearest others; the rest as a count.
    const s = this.w.e.slot(id), x = s >= 0 ? this.w.e.x[s]! : 0, y = s >= 0 ? this.w.e.y[s]! : 0;
    const key = (h: (typeof all)[number]) => (h.owner === id || h.free || fam(h.owner) ? -1e9 : 0) + Math.hypot(h.x - x, h.y - y);
    const shown = [...all].sort((a, b) => key(a) - key(b)).filter((h, k) => k < 3 || h.owner === id || h.free || fam(h.owner)).slice(0, 8);
    const rows = shown.map((h) => `(${Math.floor(h.x)}, ${Math.floor(h.y)}) ${h.owner === id ? 'yours' : h.free ? 'FREE: anyone without a home can move in' : `${h.ownerName}'s${fam(h.owner) ? ' (your family)' : ''}`}`);
    const free = all.filter((h) => h.free).length;
    return `Huts on this map: ${all.length} (${free ? `${free} free` : 'none free'}): ${rows.join('; ')}${all.length > shown.length ? `; and ${all.length - shown.length} more, all lived in` : ''}.`;
  }
  // ------------------------------------------------------------------ beds (imad 2026-11-26: "4 beds in his hut and he builds a new one")
  /** Who sleeps in hut h: the owner, their partner and the children of 3+ who live there (little ones sleep by a parent). */
  sleepers(h: Home): number[] {
    const w = this.w, out: number[] = [];
    if (h.owner < 0) return out;
    const o = w.profiles.get(h.owner);
    if (!o || o.died !== undefined) return out;
    out.push(h.owner);
    if (o.partner >= 0 && w.profiles.get(o.partner)?.died === undefined && w.profiles.has(o.partner)) out.push(o.partner);
    for (const [id, q] of w.profiles) {
      if (q.died !== undefined || out.includes(id) || q.partner >= 0 || q.player) continue;
      if (!(q.parents.includes(h.owner) || (o.partner >= 0 && q.parents.includes(o.partner)))) continue;
      const age = ageOf(q, w.gameSec, w.yearSec);
      if (age >= 3 && age < 18 && this.homeOf(id) === h) out.push(id);
    }
    return out;
  }
  /** Bed tiles inside hut h. */
  bedsIn(h: Home): number {
    const sv = this.w.survival, r = sv.hutRect(h.m, h.out, h.dir), tm = this.w.maps[h.m]!.tiles;
    if (!r) return 0;
    let n = 0;
    for (let yy = 0; yy < r.s; yy++) for (let xx = 0; xx < r.s; xx++) if (tm.tiles[(r.y0 + yy) * tm.w + r.x0 + xx] === sv.T.bed) n++;
    return n;
  }
  /** Beds hut h still lacks: one per sleeper, never more. */
  bedsMissing(h: Home): number { return Math.max(0, this.sleepers(h).length - this.bedsIn(h)); }
  /**
   * The one of a couple who does a job for the home (imad: "one partner will do it, not both"): the owner when they are an AI person
   * on their feet on that map, else the partner; -1 = nobody (both are players played by hand, or away).
   */
  doer(h: Home): number {
    const w = this.w, e = w.e, o = w.profiles.get(h.owner);
    if (!o) return -1;
    for (const id of [h.owner, o.partner]) { // always the same one (owner first): never both of them
      const s = id >= 0 ? e.slot(id) : -1;
      if (s >= 0 && e.kind[s] === Kind.Agent && e.map[s] === h.m && this.adult(id)) return id;
    }
    return -1;
  }
  /** For prompts: what my home holds and still needs (so nobody builds a fifth bed). */
  bedText(id: number): string {
    const h = this.homeOf(id);
    if (!h) return '';
    const b = this.bedsIn(h), n = this.sleepers(h).length, miss = Math.max(0, n - b);
    const sv = this.w.survival, f = sv.boxIn(h, 'fridge'), c = sv.boxIn(h, 'chest');
    const fi = f >= 0 ? sv.box(h.m, f) : null, ci = c >= 0 ? sv.box(h.m, c) : null;
    const chest = ci ? Object.entries(ci).filter(([, v]) => v).map(([k, v]) => `${v} ${k}`).join(', ') : '';
    return `Your home has ${b} bed${b === 1 ? '' : 's'} for ${n} sleeper${n === 1 ? '' : 's'}${miss ? `: it needs ${miss} more` : ': enough, build no more beds'}.`
      + (fi ? ` Its fridge holds ${fi.food ?? 0} food and ${fi.water ?? 0} water (eat and drink from it, fill it for the days to come).` : ' It has no fridge yet (a fridge keeps food and water: build one inside).')
      + (ci ? ` Its chest holds ${chest || 'nothing'}.` : ' It has no chest yet (keeps things and weapons).');
  }

  /** How many more huts map m needs so every household has a home. */
  needed(m: number): number { return Math.max(0, this.homeless(m).length - this.free(m).length); }
  /** For the panel and prompts: who owns what. */
  describe(id: number): string {
    const h = this.homeOf(id);
    if (!h) return 'No home yet (you sleep by the camp fire).' + this.grownText(id);
    const c = this.middle(h), own = h.owner === id, ow = this.w.profiles.get(h.owner);
    return (own ? `Your home: your hut at (${Math.floor(c.x)}, ${Math.floor(c.y)}); only your family may go in.`
      : `Your home: ${ow?.name ?? 'your family'}'s hut at (${Math.floor(c.x)}, ${Math.floor(c.y)}).`) + ' ' + this.bedText(id);
  }
}
