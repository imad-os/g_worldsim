import { Kind } from '@worldsim/protocol';
import type { World, WorldEvent } from './world.js';

/**
 * What the community has learned, kept after the people who learned it are gone (imad 2026-11-26: "community memory for
 * places, persons and animals, so they grow learning from the previous generations").
 *
 * Personal memory (sim/memory.ts) dies with its owner. Lore belongs to the people as a whole and is fed by what happens
 * to any of them: deaths and bites mark a PLACE (24 m cells), a THREAT (zombie, wolf, bear, boar...) and a MAP; a person
 * who kills, shoots or fights others is feared, one who treats wounds or comes to help is trusted. Fear fades slowly
 * (half of it in about ten game days), so old lessons stay while they are true and go once the danger is gone.
 *
 * Each living person knows it by age (`knows`): nothing under 3, taught bit by bit as a child, all of it from 13. That is
 * how a newborn of the third generation still fears the bear valley where its grandmother died. The engine acts on it:
 * wandering and foraging keep out of feared places, hunters leave feared beasts alone unless well armed, nerve drops in
 * front of a feared threat, people avoid talking to someone feared, a feared wild map is for armed adults only; every
 * prompt says it ("What your people know").
 */
export const CELL = 24;
const PLURAL: Record<string, string> = { zombie: 'Zombies', wolf: 'Wolves', bear: 'Bears', boar: 'Boars', deer: 'Deer', rabbit: 'Rabbits', horse: 'Horses' };
const DECAY_H = 0.997; // fear kept per game hour (half-life ~ 230 h)
const MAX_PLACES = 80, MAX_LESSONS = 80;

export interface LPlace { m: number; cx: number; cy: number; fear: number; told?: number; deaths: number; hurts: number; causes: Record<string, number>; who: string[]; first: number; last: number }
export interface LThreat { k: string; fear: number; deaths: number; hurts: number; beaten: number; last: number }
export interface LPerson { id: number; name: string; fear: number; trust: number; deeds: string[]; last: number }
export interface LMap { m: number; fear: number; deaths: number; last: number }
export interface Lesson { t: number; text: string; kind: 'place' | 'threat' | 'person' | 'map' }
interface Saved { places: LPlace[]; threats: LThreat[]; persons: LPerson[]; maps: LMap[]; lessons: Lesson[]; hour: number }

export class Lore {
  places = new Map<string, LPlace>();
  threats = new Map<string, LThreat>();
  persons = new Map<number, LPerson>();
  maps = new Map<number, LMap>();
  lessons: Lesson[] = [];
  private hour = -1;

  constructor(private readonly w: World) {
    w.listeners.push((ev) => this.on(ev));
  }

  // ------------------------------------------------------------------ what each person knows of it
  /** How much of the lore person i carries, 0..1: none under 3, taught as a child, all of it from 13. */
  knows(i: number): number {
    const a = this.w.family.ageOf(i);
    return a < 3 ? 0 : a >= 13 ? 1 : (a - 3) / 10;
  }
  private key(m: number, x: number, y: number): string { return `${m}:${Math.floor(x / CELL)}:${Math.floor(y / CELL)}`; }
  /** Fear of the place (x, y) on map m as person i knows it (the cell and its neighbours count half). */
  placeFear(i: number, m: number, x: number, y: number): number {
    if (!this.places.size) return 0;
    const cx = Math.floor(x / CELL), cy = Math.floor(y / CELL);
    let f = 0;
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
      const p = this.places.get(`${m}:${cx + dx}:${cy + dy}`);
      if (p) f = Math.max(f, p.fear * (dx || dy ? 0.5 : 1));
    }
    return f * this.knows(i);
  }
  /** A place they keep out of (fear 3+ as they know it). */
  feared(i: number, m: number, x: number, y: number): boolean { return this.placeFear(i, m, x, y) >= 3; }
  /** Fear of a kind of threat ('zombie', 'wolf', 'bear'...), as person i knows it (0..10). */
  fearOf(i: number, k: string): number { const t = this.threats.get(k); return t ? t.fear * this.knows(i) : 0; }
  /** Fear of a whole map (0..10). */
  mapFear(i: number, m: number): number { const t = this.maps.get(m); return t ? t.fear * this.knows(i) : 0; }
  /** Person j (entity id) is someone the people fear more than they trust (as i knows it). */
  distrusts(i: number, jid: number): boolean { const p = this.persons.get(jid); return !!p && (p.fear - p.trust) * this.knows(i) >= 4; }

  // ------------------------------------------------------------------ learning
  private lesson(kind: Lesson['kind'], text: string): void {
    this.lessons.push({ t: this.w.gameSec, text, kind });
    if (this.lessons.length > MAX_LESSONS) this.lessons.splice(0, this.lessons.length - MAX_LESSONS);
  }
  private markPlace(m: number, x: number, y: number, fear: number, cause: string, who?: string, death = false): LPlace {
    const k = this.key(m, x, y), now = this.w.gameSec;
    let p = this.places.get(k);
    if (!p) { p = { m, cx: Math.floor(x / CELL), cy: Math.floor(y / CELL), fear: 0, deaths: 0, hurts: 0, causes: {}, who: [], first: now, last: now }; this.places.set(k, p); }
    p.fear = Math.min(10, p.fear + fear); p.last = now; p.causes[cause] = (p.causes[cause] ?? 0) + 1;
    if (death) { p.deaths++; if (who) { p.who.push(who); if (p.who.length > 4) p.who.shift(); } } else p.hurts++;
    if (this.places.size > MAX_PLACES) { let low = '', lf = Infinity; for (const [kk, q] of this.places) if (q.fear < lf) { lf = q.fear; low = kk; } this.places.delete(low); }
    return p;
  }
  private markThreat(k: string, fear: number, death: boolean): LThreat {
    let t = this.threats.get(k);
    if (!t) { t = { k, fear: 0, deaths: 0, hurts: 0, beaten: 0, last: this.w.gameSec }; this.threats.set(k, t); }
    t.fear = Math.max(0, Math.min(10, t.fear + fear)); t.last = this.w.gameSec;
    if (death) t.deaths++; else if (fear > 0) t.hurts++;
    return t;
  }
  private markMap(m: number, fear: number): LMap {
    let t = this.maps.get(m);
    if (!t) { t = { m, fear: 0, deaths: 0, last: this.w.gameSec }; this.maps.set(m, t); }
    t.fear = Math.min(10, t.fear + fear); t.deaths++; t.last = this.w.gameSec;
    return t;
  }
  private person(id: number): LPerson | null {
    let p = this.persons.get(id);
    if (!p) {
      const pr = this.w.profiles.get(id);
      if (!pr) return null;
      p = { id, name: pr.name, fear: 0, trust: 0, deeds: [], last: this.w.gameSec }; this.persons.set(id, p);
    }
    return p;
  }
  private deed(id: number, fear: number, trust: number, text: string): void {
    const p = this.person(id);
    if (!p) return;
    p.fear = Math.max(0, Math.min(10, p.fear + fear)); p.trust = Math.max(0, Math.min(10, p.trust + trust)); p.last = this.w.gameSec;
    if (p.deeds[p.deeds.length - 1] !== text) { p.deeds.push(text); if (p.deeds.length > 5) p.deeds.shift(); }
  }
  private mapIdx(id: unknown): number { const m = this.w.mapIndex.get(String(id ?? '')); return m ?? -1; }
  private nameOf(id: number): string { return this.w.profiles.get(id)?.name ?? 'someone'; }
  /** "the north-east of Pine Woods" for a cell. */
  area(p: { m: number; cx: number; cy: number }): string {
    const def = this.w.maps[p.m]?.def;
    if (!def) return 'somewhere';
    const x = (p.cx + 0.5) * CELL / def.w, y = (p.cy + 0.5) * CELL / def.h;
    const ns = y < 0.34 ? 'north' : y > 0.66 ? 'south' : '', ew = x < 0.34 ? 'west' : x > 0.66 ? 'east' : '';
    return ns || ew ? `the ${ns}${ns && ew ? '-' : ''}${ew} of ${def.name}` : `the middle of ${def.name}`;
  }

  private on(ev: WorldEvent): void {
    const w = this.w, e = w.e, d = ev.data;
    switch (ev.kind) {
      case 'death': {
        const id = Number(d.id ?? -1), pr = w.profiles.get(id);
        if (!pr) return; // a horse or a stranger
        const cause = String(d.cause ?? 'died'), m = this.mapIdx(d.map);
        if (cause === 'cold') { this.lesson('threat', `${pr.name} froze to death standing in the cold: in winter we sleep by the fire or in a hut, and wear clothes`); return; }
        if (cause === 'old age' || cause === 'hunger' || cause === 'thirst' || m < 0) return; // not a danger to keep away from
        const x = Number(d.x), y = Number(d.y);
        const by = d.by !== undefined ? Number(d.by) : -1;
        if (Number.isFinite(x) && Number.isFinite(y)) {
          const p = this.markPlace(m, x, y, 4, cause, pr.name, true);
          this.lesson('place', `${pr.name} was killed by ${cause === 'zombie' ? 'a zombie' : cause === 'shot' ? 'an arrow' : `a ${cause}`} in ${this.area(p)}: people keep away from there`);
        }
        if (cause !== 'shot') { const t = this.markThreat(cause, 3, true); if (t.deaths === 1 || t.deaths % 3 === 0) this.lesson('threat', `${cause === 'zombie' ? 'Zombies' : `The ${cause}`} took ${t.deaths} of us so far: fear ${cause === 'zombie' ? 'them' : 'it'}`); }
        const mp = this.markMap(m, 2);
        if (mp.deaths === 2 || mp.deaths % 4 === 0) this.lesson('map', `${w.maps[m]!.def.name}: ${mp.deaths} of our people died there`);
        if (by >= 0 && by !== id && w.profiles.has(by)) { this.deed(by, 6, 0, `killed ${pr.name}`); this.lesson('person', `${this.nameOf(by)} killed ${pr.name}: people fear them`); }
        return;
      }
      case 'bitten': {
        const id = Number(d.id ?? -1), i = e.slot(id);
        if (i < 0 || !w.profiles.has(id) || e.map[i]! < 0 || e.map[i]! >= w.maps.length) return;
        const k = d.animal ? String(d.animal) : 'zombie';
        const p = this.markPlace(e.map[i]!, e.x[i]!, e.y[i]!, 0.5, k);
        if (p.fear >= 2 && !p.told) { p.told = 1; this.lesson('place', `${PLURAL[k] ?? k} keep hurting people in ${this.area(p)}: people keep away from there`); }
        const t = this.threats.get(k);
        if (!t || t.deaths > 0 || t.fear < 3) this.markThreat(k, 0.25, false); // bites alone make a threat feared up to 3; deaths beyond
        return;
      }
      case 'hunt': { // a beast brought down: a little less fear of that kind
        const k = String(d.animal ?? ''), t = this.threats.get(k);
        if (t) { t.fear = Math.max(0, t.fear - 0.2); t.beaten++; }
        return;
      }
      case 'zombie': if (d.how === 'killed') { const t = this.threats.get('zombie'); if (t) { t.fear = Math.max(0, t.fear - 0.1); t.beaten++; } } return;
      case 'duel': { const a = Number(d.a), b = Number(d.b); if (w.profiles.has(a)) this.deed(a, 0.3, 0, `fought ${this.nameOf(b)}`); if (w.profiles.has(b)) this.deed(b, 0.3, 0, `fought ${this.nameOf(a)}`); return; }
      case 'pvp': { const by = Number(d.by); if (w.profiles.has(by)) this.deed(by, 0.4, 0, `hit ${this.nameOf(Number(d.id))}`); return; }
      case 'heal': { const id = Number(d.id), who = Number(d.who); if (id !== who && w.profiles.has(id)) this.deed(id, 0, 0.8, `treated ${this.nameOf(who)}`); return; }
      case 'tactic': if (d.plan === 'help') { const id = Number(d.id); if (w.profiles.has(id)) this.deed(id, 0, 0.6, 'came to help someone attacked'); } return;
    }
  }

  /** Every game hour: fear fades; places, threats and people nobody fears or trusts any more are forgotten. */
  update(): void {
    const h = Math.floor(this.w.gameSec / 3600);
    if (h === this.hour) return;
    const n = this.hour < 0 ? 1 : Math.min(48, h - this.hour);
    this.hour = h;
    const k = Math.pow(DECAY_H, n);
    for (const [key, p] of this.places) { p.fear *= k; if (p.fear < 0.3) this.places.delete(key); }
    for (const [key, t] of this.threats) { t.fear *= k; if (t.fear < 0.05 && !t.deaths) this.threats.delete(key); }
    for (const t of this.maps.values()) t.fear *= k;
    for (const [id, p] of this.persons) { p.fear *= k; p.trust *= Math.pow(0.999, n); if (p.fear < 0.2 && p.trust < 0.2) this.persons.delete(id); }
  }

  // ------------------------------------------------------------------ telling it
  /** The lore in a few lines for a prompt about person i (scaled by what they were taught). '' when there is none. */
  promptText(i: number): string {
    const kn = this.knows(i);
    if (kn <= 0) return '';
    const parts: string[] = [];
    const pl = [...this.places.values()].filter((p) => p.fear * kn >= 2).sort((a, b) => b.fear - a.fear).slice(0, 3)
      .map((p) => `${this.area(p)} (${p.deaths ? `${p.deaths} died` : `${p.hurts} hurt`}: ${Object.entries(p.causes).sort((a, b) => b[1] - a[1]).map(([c]) => c).slice(0, 2).join(', ')})`);
    if (pl.length) parts.push(`keep away from ${pl.join('; ')}`);
    const th = [...this.threats.values()].filter((t) => t.fear * kn >= 1.5).sort((a, b) => b.fear - a.fear).slice(0, 3).map((t) => `${t.k}s (${t.deaths ? `${t.deaths} of us killed` : `${t.hurts} bitten`})`);
    if (th.length) parts.push(`fear ${th.join(', ')}`);
    const mp = [...this.maps.values()].filter((t) => t.fear * kn >= 2).map((t) => `${this.w.maps[t.m]!.def.name} (${t.deaths} dead)`);
    if (mp.length) parts.push(`deadly places: ${mp.join(', ')}`);
    const pf = [...this.persons.values()].filter((p) => (p.fear - p.trust) * kn >= 3).slice(0, 3).map((p) => `${p.name} (${p.deeds.slice(-1)[0] ?? ''})`);
    if (pf.length) parts.push(`beware of ${pf.join(', ')}`);
    const pt = [...this.persons.values()].filter((p) => (p.trust - p.fear) * kn >= 2).sort((a, b) => b.trust - a.trust).slice(0, 3).map((p) => p.name);
    if (pt.length) parts.push(`people to trust: ${pt.join(', ')}`);
    if (!parts.length) return '';
    return `${kn < 1 ? 'Your elders taught you' : 'What your people learned (also from those before you)'}: ${parts.join('; ')}.`;
  }

  /** Everything, for the panel's Society page. */
  info(): object {
    const w = this.w, e = w.e, now = w.gameSec;
    const living: { id: number; name: string; age: number; knows: number; fears: string[] }[] = [];
    for (let i = 0; i < e.hi; i++) {
      if (e.kind[i] !== Kind.Agent && e.kind[i] !== Kind.Player) continue;
      const p = w.profileOf(i);
      if (!p) continue;
      const kn = this.knows(i), fears: string[] = [];
      for (const t of this.threats.values()) if (t.fear * kn >= 1.5) fears.push(t.k);
      for (const t of this.maps.values()) if (t.fear * kn >= 2) fears.push(w.maps[t.m]!.def.name);
      for (const q of this.persons.values()) if (q.id !== e.id(i) && (q.fear - q.trust) * kn >= 4) fears.push(q.name);
      living.push({ id: e.id(i), name: p.name, age: Math.floor(w.family.ageOf(i)), knows: Math.round(kn * 100), fears });
    }
    let gens = 0; for (const p of w.profiles.values()) if (p.died === undefined) gens = Math.max(gens, (p.generation ?? 0) + 1);
    const dead = [...w.profiles.values()].filter((p) => p.died !== undefined).length;
    return {
      now, generations: gens, dead,
      places: [...this.places.values()].sort((a, b) => b.fear - a.fear).map((p) => ({ map: w.maps[p.m]!.def.id, mapName: w.maps[p.m]!.def.name, area: this.area(p), x: (p.cx + 0.5) * CELL, y: (p.cy + 0.5) * CELL, fear: +p.fear.toFixed(1), deaths: p.deaths, hurts: p.hurts, causes: p.causes, who: p.who, first: p.first, last: p.last })),
      threats: [...this.threats.values()].sort((a, b) => b.fear - a.fear).map((t) => ({ ...t, fear: +t.fear.toFixed(1) })),
      maps: w.maps.map((m) => { const t = this.maps.get(m.index); return { map: m.def.id, name: m.def.name, wild: w.wild(m.index), fear: +(t?.fear ?? 0).toFixed(1), deaths: t?.deaths ?? 0 }; }),
      persons: [...this.persons.values()].sort((a, b) => (b.fear + b.trust) - (a.fear + a.trust)).map((p) => ({ ...p, fear: +p.fear.toFixed(1), trust: +p.trust.toFixed(1), alive: w.profiles.get(p.id)?.died === undefined })),
      lessons: this.lessons.slice().reverse(),
      living,
    };
  }

  save(): Saved { return { places: [...this.places.values()], threats: [...this.threats.values()], persons: [...this.persons.values()], maps: [...this.maps.values()], lessons: this.lessons, hour: this.hour }; }
  load(s: unknown): void {
    const d = s as Partial<Saved> | undefined;
    this.places.clear(); this.threats.clear(); this.persons.clear(); this.maps.clear(); this.lessons = [];
    if (!d) return;
    for (const p of d.places ?? []) this.places.set(`${p.m}:${p.cx}:${p.cy}`, p);
    for (const t of d.threats ?? []) this.threats.set(t.k, t);
    for (const p of d.persons ?? []) this.persons.set(p.id, p);
    for (const t of d.maps ?? []) this.maps.set(t.m, t);
    this.lessons = d.lessons ?? [];
    this.hour = d.hour ?? -1;
  }
}
