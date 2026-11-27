import { Act, EFlag, Kind } from '@worldsim/protocol';
import { NO_MAP } from './entities.js';
import { Rng } from './rng.js';
import { Pathfinder } from './pathfind.js';
import type { World } from './world.js';
import { Stables } from './stables.js';

/**
 * Horses (imad 2026-11-25: "cool, smart like real horses, in herds, tamed, ridden, stats, common / rare / legendary").
 * Engine kind Animal, type 5 (`HORSE`). Everything a horse is lives here (by entity id, saved in snapshots).
 *
 * How they behave (a small model of real horse behaviour, no AI calls):
 *  - Herds of 3-8 in the wild (the woods, none in town): a lead mare chooses where the herd goes (grass, sometimes
 *    water), a stallion keeps to the edge, foals stay at their mother's side. Each horse steers by cohesion (back to the
 *    herd when it drifts off), separation (never on top of each other) and the leader's heading (boids).
 *  - A day: grazing most of the time (head down), walking on to new grass, dozing standing up; at night they bunch up.
 *  - Flight: a horse that sees a threat (a zombie, a wolf, a bear, or a person it does not trust coming close, worse
 *    when they run) gallops away and the alarm spreads to the herd. Smarter horses tell a calm walker from a hunter.
 *    A stallion kicks a predator that gets too close. After the danger the herd slows, looks back, settles.
 *  - Stamina: galloping uses it, walking / grazing brings it back. A tired horse canters.
 *  - Trust: a person who comes near calmly (and keeps trying) is trusted a little more each time: the horse lets them
 *    closer, and taming gets easier ("join-up"). Hurting a horse makes it distrust that person.
 *  - Taming (`tame`): a skill. The chance comes from the person's courage, intelligence and speed, their taming level
 *    (grows with every try) and the horse's trust, against the horse's intelligence and quality. A failed try may get
 *    them kicked. A tamed horse leaves its herd and lives on its own near where it was left (grazing, wandering, taking
 *    fright); its owner calls it from afar (it runs there by a real path) or walks up to it to ride it.
 *  - Riding: the rider moves at the horse's pace (a trot when walking, a gallop when running while stamina lasts),
 *    and the horse carries them through the gates (5-15 real seconds per gate, `gateSecs`). People ride for long walks and get off to work, sleep or talk.
 *  - Population: mares foal (stats from both parents plus a little chance), old horses die, and when a map has too
 *    few wild horses a new band wanders in from the edge, so numbers stay steady.
 */
export const HORSE = 5;
export const QUALITY = ['common', 'rare', 'legendary'] as const;
/** Coat colours (TV colours them; legendary ones also glow). */
export const COATS = ['bay', 'chestnut', 'black', 'grey', 'white', 'palomino', 'dun', 'silver'] as const;
const NAMES = ['Storm', 'Ash', 'Blaze', 'Willow', 'Comet', 'Dusty', 'Maple', 'Shadow', 'Spirit', 'Clover', 'Ember', 'Juniper', 'Hazel', 'Flint', 'Misty',
  'Rowan', 'Sable', 'Thunder', 'Breeze', 'Cinder', 'Duke', 'Echo', 'Fable', 'Ginger', 'Indigo', 'Jasper', 'Kestrel', 'Luna', 'Nova', 'Onyx', 'Pepper',
  'Quill', 'Rusty', 'Sierra', 'Tango', 'Umber', 'Vega', 'Wren', 'Zephyr', 'Biscuit', 'Copper', 'Dune', 'Frost', 'Gale', 'Honey', 'Iris', 'Kona'];

export interface Horse {
  name: string; sex: 'f' | 'm'; born: number; mother: number;
  /** 0.85-1.2: body size (draw scale, carries a rider better). */
  size: number;
  /** 0-1: learns faster who is safe, harder to tame, judges threats better. */
  intel: number;
  /** Top gallop, m/s. */
  speed: number;
  /** Seconds of gallop when rested; `sta` = what is left now. */
  stamina: number; sta: number;
  /** 0 common, 1 rare, 2 legendary. */
  q: number;
  coat: number;
  /** Herd id (-1 = none: tamed or alone). */
  herd: number;
  /** Owner's entity id (-1 = wild) and the rider's (-1 = nobody). */
  owner: number; rider: number;
  /** Trust per person ('#id' -> -1..1). */
  trust: Record<string, number>;
  /** Fear 0..1 and where the danger is. */
  fear: number; fx: number; fy: number;
  /** What it is doing and until when (sim seconds since start). */
  mode: 'graze' | 'walk' | 'rest' | 'flee' | 'follow' | 'alert' | 'come' | 'wait' | 'stable';
  until: number;
  /** Tamed: where it lives now (it roams round here); set where it was left or where it came to its owner. */
  hx?: number; hy?: number;
  /** What happened to it (imad 2026-11-27: "keep a history, show it when I call it"): [game second, code, arg] (last 20). */
  log?: HorseNote[];
}
/** One line of a horse's history: [game second, code, arg]. Codes: tamed / mount / left / road / called / came / gaveUp (arg = map id), wild, old (arg = age), gone. */
export type HorseNote = [number, string, string?];
/** A horse its owner lost (died, ran wild, vanished): kept so the owner can be told what happened. */
export interface LostHorse { name: string; q: number; at: number; why: string; log: HorseNote[] }
interface Herd { id: number; map: number; lead: number; gx: number; gy: number; until: number }

const QSTATS = [ // per quality: [speed lo, hi], [stamina lo, hi], [intel lo, hi], [size lo, hi]
  { speed: [5.6, 7.0], sta: [40, 70], intel: [0.2, 0.6], size: [0.88, 1.08] },
  { speed: [6.8, 8.0], sta: [65, 100], intel: [0.45, 0.8], size: [0.95, 1.14] },
  { speed: [8.0, 9.5], sta: [100, 140], intel: [0.7, 1.0], size: [1.05, 1.2] },
];
const CAP_WILDS = 14, CAP_TOWN = 0, EVERY = 5, HOUR = 3600;
const TROT = 3.1, CANTER = 4.2;
/** A called horse comes only from farther than this (closer: walk over to it). Roaming range round its home. */
export const CALL_NEAR = 10;
const RANGE = 28;
/** Seconds a horse left on a map with a stable waits before it goes there. */
const STABLE_AFTER = 10;
/** Taming level from points: 0 .. 10. */
export function tameLevel(xp = 0): number { return Math.min(10, Math.floor(Math.sqrt(Math.max(0, xp) / 12))); }

/** Age in years of person slot i (0 = unknown). */
function ageOfSlot(w: World, i: number): number { const p = w.profileOf(i); return p ? (w.gameSec - p.born) / w.yearSec : 0; }

export class Horses {
  readonly h = new Map<number, Horse>();
  readonly herds = new Map<number, Herd>();
  /** Taming points per person (entity id). */
  readonly skill = new Map<number, number>();
  private nextHerd = 1;
  private nextHour = 0;
  private t = 0;
  /** A called horse's way to its owner (not saved: it finds it again). */
  private routes = new Map<number, { pts: number[]; k: number; gx: number; gy: number; at: number; since: number }>();
  private finders: Pathfinder[] = [];
  /** Horses each owner (entity id) lost, newest last (3 kept), saved. */
  readonly lost = new Map<number, LostHorse[]>();
  /** Who tried to tame which horse last (cooldown, real sim seconds). */
  private readonly tryAt = new Map<number, number>();
  /** Each town map's paddock + stable (sim/stables.ts). */
  readonly stables: Stables;
  /** A horse on its way to the paddock / stable (not saved). */
  private tripFail = new Map<number, number>();
  private trips = new Map<number, { pts: number[]; k: number; tx: number; ty: number; at: number; since: number }>();

  /** Per slot: 1 = on a horse, 2 = a horse being ridden (frames: bit 7 of the kind byte). Rebuilt every tick from the riders. */
  readonly riding: Uint8Array;
  /** Their own random numbers: horses never change the rest of the world's dice. */
  private readonly rng: Rng;
  constructor(private w: World) { this.rng = new Rng(w.seed + ':horses'); this.riding = new Uint8Array(w.e.cap); this.stables = new Stables(w); }

  // ------------------------------------------------------------------ reading
  of(i: number): Horse | undefined { return this.w.e.kind[i] === Kind.Animal && this.w.e.sub[i] === HORSE ? this.h.get(this.w.e.id(i)) : undefined; }
  isHorse(i: number): boolean { return this.w.e.kind[i] === Kind.Animal && this.w.e.sub[i] === HORSE; }
  /** A tamed horse (nobody may hunt it; Attack skips it). */
  owned(i: number): boolean { const h = this.of(i); return !!h && h.owner >= 0; }
  /** Frame bits 24-31 of an animal: type, and for horses quality (bits 3-4) and coat (bits 5-7). */
  look(i: number): number {
    const e = this.w.e;
    if (e.sub[i] !== HORSE) return e.sub[i]! & 0x3f;
    const h = this.h.get(e.id(i));
    return HORSE | ((h?.q ?? 0) << 3) | ((h?.coat ?? 0) << 5);
  }
  /** The horse person i rides (slot) or -1. */
  ridden(i: number): number {
    const e = this.w.e;
    if (this.riding[i] !== 1) return -1;
    const id = e.id(i);
    for (const [hid, h] of this.h) if (h.rider === id) return e.slot(hid);
    return -1;
  }
  /** Horses person i owns (slots). */
  mine(i: number): number[] {
    const id = this.w.e.id(i), out: number[] = [];
    for (const [hid, h] of this.h) if (h.owner === id) { const s = this.w.e.slot(hid); if (s >= 0) out.push(s); }
    return out;
  }
  ageYears(h: Horse): number { return (this.w.gameSec - h.born) / this.w.yearSec; }
  /** Draw scale: a foal is small and grows up over 2 years. */
  scale(h: Horse): number { const a = this.ageYears(h); return h.size * (a >= 2 ? 1 : 0.55 + 0.45 * Math.max(0, a) / 2); }
  count(m = -1, wild = false): number {
    let n = 0;
    for (const [id, h] of this.h) { const s = this.w.e.slot(id); if (s >= 0 && (m < 0 || this.w.e.map[s] === m) && (!wild || h.owner < 0)) n++; }
    return n;
  }
  /** A horse's details for the TV / panel. */
  info(i: number, viewer = -1): Record<string, unknown> | null {
    const h = this.of(i);
    if (!h) return null;
    const e = this.w.e, oi = h.owner >= 0 ? e.slot(h.owner) : -1;
    return { id: e.id(i), name: h.name, sex: h.sex, q: h.q, quality: QUALITY[h.q], coat: COATS[h.coat], size: +h.size.toFixed(2), scale: +this.scale(h).toFixed(2),
      intel: Math.round(h.intel * 100), speed: +h.speed.toFixed(1), stamina: Math.round(h.stamina), sta: Math.round((h.sta / h.stamina) * 100), age: +this.ageYears(h).toFixed(1),
      owner: oi >= 0 ? this.w.profileOf(oi)?.name ?? '' : '', mine: viewer >= 0 && h.owner === e.id(viewer), ridden: h.rider >= 0, wild: h.owner < 0, mode: h.mode,
      trust: viewer >= 0 ? Math.round((h.trust['#' + e.id(viewer)] ?? 0) * 100) : 0 };
  }
  /** Taming power of person i (0..~1.2): courage, intelligence, speed, level. */
  power(i: number): number {
    const p = this.w.profileOf(i), tr = p?.traits;
    const lv = tameLevel(this.skill.get(this.w.e.id(i)));
    return (tr ? tr.courage * 0.35 + tr.intelligence * 0.35 + tr.speed * 0.2 : 0.45) + lv * 0.04;
  }
  /** How hard horse h is to tame (0.3 .. ~1). */
  difficulty(h: Horse): number { return 0.25 + h.intel * 0.3 + h.q * 0.17; }
  chance(i: number, h: Horse): number {
    const trust = Math.max(0, h.trust['#' + this.w.e.id(i)] ?? 0);
    const food = this.w.e.carry[i]! > 0 ? 0.06 : 0; // a handful of food helps
    return Math.max(0.03, Math.min(0.9, 0.12 + (this.power(i) - this.difficulty(h)) * 1.1 + trust * 0.45 + food));
  }

  // ------------------------------------------------------------------ making
  private roll(q: number): Pick<Horse, 'speed' | 'stamina' | 'intel' | 'size'> {
    const r = this.rng, S = QSTATS[q]!;
    return { speed: r.range(S.speed[0]!, S.speed[1]!), stamina: r.range(S.sta[0]!, S.sta[1]!), intel: r.range(S.intel[0]!, S.intel[1]!), size: r.range(S.size[0]!, S.size[1]!) };
  }
  private quality(bias = 0): number {
    const v = this.rng.next() - bias;
    return v < 0.04 ? 2 : v < 0.24 ? 1 : 0;
  }
  private name(): string {
    const used = new Set([...this.h.values()].map((h) => h.name));
    const free = NAMES.filter((n) => !used.has(n));
    const list = free.length ? free : NAMES;
    return list[this.rng.int(list.length)]! + (free.length ? '' : ` ${this.rng.int(90) + 10}`);
  }
  /** One horse at (x, y) on map m. Quality / stats rolled unless given. Returns the slot or -1. */
  spawn(m: number, x: number, y: number, o: Partial<Horse> = {}): number {
    const w = this.w, e = w.e;
    const i = w.animals.spawn(m, x, y, HORSE, this.rng);
    if (i < 0) return -1;
    const q = o.q ?? this.quality();
    const st = this.roll(q);
    const coat = o.coat ?? (q === 2 ? (this.rng.chance(0.5) ? 7 : 2) : this.rng.int(7));
    const h: Horse = { name: this.name(), sex: this.rng.chance(0.55) ? 'f' : 'm', born: w.gameSec - this.rng.range(3, 12) * w.yearSec, mother: -1, ...st, sta: 0, q, coat,
      herd: -1, owner: -1, rider: -1, trust: {}, fear: 0, fx: 0, fy: 0, mode: 'graze', until: 0, ...o };
    h.sta = h.stamina;
    this.h.set(e.id(i), h);
    return i;
  }
  /** A new herd of n on map m around (x, y) (first a lead mare, then a stallion, then mixed). */
  spawnHerd(m: number, x: number, y: number, n: number, q?: number): number[] {
    const id = this.nextHerd++, out: number[] = [];
    for (let k = 0; k < n; k++) {
      const i = this.spawn(m, x + this.rng.range(-4, 4), y + this.rng.range(-4, 4), { herd: id, ...(q !== undefined ? { q } : {}), ...(k === 0 ? { sex: 'f' as const } : k === 1 ? { sex: 'm' as const } : {}) });
      if (i >= 0) out.push(i);
    }
    if (out.length) this.herds.set(id, { id, map: m, lead: this.w.e.id(out[0]!), gx: x, gy: y, until: 0 });
    return out;
  }
  private capOf(m: number): number { const d = this.w.maps[m]!.def; return d.life?.horses ?? (d.gen.type === 'wilds' ? CAP_WILDS : CAP_TOWN); }
  /** A clear spot far from people, near an edge when `edge` (a band wandering in). */
  private spot(m: number, edge: boolean): { x: number; y: number } | null {
    const w = this.w, e = w.e, mp = w.maps[m]!, W = mp.def.w, H = mp.def.h;
    for (let t = 0; t < 60; t++) {
      let x = this.rng.range(14, W - 14), y = this.rng.range(14, H - 14);
      if (edge) { const s = this.rng.int(4); if (s === 0) x = this.rng.range(14, 30); else if (s === 1) x = W - this.rng.range(14, 30); else if (s === 2) y = this.rng.range(14, 30); else y = H - this.rng.range(14, 30); }
      if (mp.tiles.isSolidAt(x, y)) continue;
      const tt = mp.tiles.get(Math.floor(x), Math.floor(y));
      if (tt === w.survival.T.floor || tt === w.survival.T.water) continue;
      let near = false;
      for (let j = 0; j < e.hi && !near; j++) if ((e.kind[j] === Kind.Agent || e.kind[j] === Kind.Player) && e.map[j] === m && Math.hypot(e.x[j]! - x, e.y[j]! - y) < 35) near = true;
      if (!near) return { x, y };
    }
    return null;
  }

  // ------------------------------------------------------------------ actions
  /** Person i tries to tame horse slot a. Returns a code: tamed / tameFail / kicked / tooFar / notWild / wait / forbidden. */
  tame(i: number, a: number): { code: string; chance?: number; trust?: number; name?: string } {
    const w = this.w, e = w.e, h = this.of(a);
    if (!h) return { code: 'noHorse' };
    if (h.owner >= 0) return { code: h.owner === e.id(i) ? 'already' : 'notWild', name: h.name };
    if (e.map[a] !== e.map[i] || Math.hypot(e.x[a]! - e.x[i]!, e.y[a]! - e.y[i]!) > 3.4) return { code: 'tooFar', name: h.name };
    if (e.flags[i]! & EFlag.Child) return { code: 'tooYoung' };
    const rule = w.rules.forbidden(i, 'tame');
    if (rule) return { code: 'forbidden' };
    const now = w.tick * w.dt, me = e.id(i);
    if ((this.tryAt.get(me) ?? 0) > now) return { code: 'wait', name: h.name };
    this.tryAt.set(me, now + 2.5);
    const ch = this.chance(i, h), k = '#' + me;
    this.skill.set(me, (this.skill.get(me) ?? 0) + 2);
    if (this.rng.chance(ch)) {
      this.leaveHerd(e.id(a), h);
      h.owner = me; h.trust[k] = 1; h.fear = 0; h.mode = 'wait'; h.until = now + 20; h.hx = e.x[a]!; h.hy = e.y[a]!;
      this.skill.set(me, (this.skill.get(me) ?? 0) + 10);
      this.note(h, 'tamed', this.mapId(a));
      w.emit('tamed', { id: me, horse: e.id(a), name: h.name, quality: QUALITY[h.q], chance: +ch.toFixed(2) });
      return { code: 'tamed', name: h.name, chance: ch };
    }
    // Not this time: it trusts them a little more (a smart person learns faster how to calm it), shies away, maybe kicks.
    const tr = w.profileOf(i)?.traits;
    h.trust[k] = Math.min(0.9, (h.trust[k] ?? 0) + 0.08 + (tr?.intelligence ?? 0.5) * 0.08);
    h.fear = 0.55; h.fx = e.x[i]!; h.fy = e.y[i]!; h.mode = 'flee'; h.until = now + 2.5;
    if (this.rng.chance((1 - (tr?.courage ?? 0.5)) * 0.3 + h.q * 0.05)) {
      e.hp[i] = e.hp[i]! - 6;
      if (w.isChar(i)) e.hp[i] = Math.max(5, e.hp[i]!);
      w.emit('kicked', { id: me, horse: e.id(a), hp: Math.round(e.hp[i]!) });
      if (e.hp[i]! <= 0) { w.emit('death', { id: me, cause: 'horse', map: w.maps[e.map[i]!]!.def.id, x: e.x[i], y: e.y[i] }); w.remove(i, 'horse'); }
      return { code: 'kicked', chance: ch, trust: h.trust[k], name: h.name };
    }
    return { code: 'tameFail', chance: ch, trust: h.trust[k], name: h.name };
  }
  /** Admin: horse a is tamed by person i at once (it leaves its herd and lives where it stands). */
  give(a: number, i: number): void {
    const h = this.of(a), e = this.w.e;
    if (!h || h.rider >= 0) return;
    this.leaveHerd(e.id(a), h);
    h.owner = e.id(i); h.trust['#' + e.id(i)] = 1; h.fear = 0; h.mode = 'graze'; h.until = this.t; h.hx = e.x[a]!; h.hy = e.y[a]!;
    this.note(h, 'tamed', this.mapId(a));
  }
  /** A line in the horse's history. */
  private note(h: Horse, code: string, arg?: string): void {
    const l = h.log ??= [];
    const last = l[l.length - 1];
    if (last && last[1] === code && last[2] === arg && this.w.gameSec - last[0] < 600) { last[0] = this.w.gameSec; return; } // the same thing again soon: one line
    l.push(arg === undefined ? [Math.round(this.w.gameSec), code] : [Math.round(this.w.gameSec), code, arg]);
    if (l.length > 20) l.splice(0, l.length - 20);
  }
  private mapId(i: number): string { const m = this.w.e.map[i]!; return m === NO_MAP ? '' : this.w.maps[m]?.def.id ?? ''; }
  /** Its owner lost horse h (why: old / wild / gone): remembered for them. */
  private loseIt(owner: number, h: Horse, why: string): void {
    if (owner < 0) return;
    const l = this.lost.get(owner) ?? [];
    l.push({ name: h.name, q: h.q, at: Math.round(this.w.gameSec), why, log: (h.log ?? []).slice(-10) });
    if (l.length > 3) l.splice(0, l.length - 3);
    this.lost.set(owner, l);
    this.w.emit('horseLost', { id: owner, name: h.name, why });
  }
  /** The history of my horse(s) for the TV: every horse I own + the ones I lost. */
  history(i: number): { horses: { name: string; q: number; map: string; log: HorseNote[] }[]; lost: LostHorse[] } {
    const e = this.w.e, me = e.id(i);
    const horses = this.mine(i).map((s) => { const h = this.h.get(e.id(s))!; return { name: h.name, q: h.q, map: this.mapId(s), log: (h.log ?? []).slice(-8) }; });
    return { horses, lost: this.lost.get(me) ?? [] };
  }
  private leaveHerd(id: number, h: Horse): void {
    const hd = this.herds.get(h.herd);
    h.herd = -1;
    if (!hd || hd.lead !== id) return;
    const next = this.members(hd.id)[0];
    if (next === undefined) this.herds.delete(hd.id); else hd.lead = this.w.e.id(next);
  }
  private members(herd: number): number[] {
    const out: number[] = [];
    for (const [id, h] of this.h) if (h.herd === herd) { const s = this.w.e.slot(id); if (s >= 0) out.push(s); }
    return out;
  }

  /** Person i gets on horse a (theirs, within 3.5 m). */
  mount(i: number, a: number): string {
    const w = this.w, e = w.e, h = this.of(a);
    if (!h) return 'noHorse';
    if (h.owner !== e.id(i)) return 'notMine';
    if (h.rider >= 0) return h.rider === e.id(i) ? 'riding' : 'taken';
    if (this.riding[i]) return 'riding';
    if (e.flags[i]! & EFlag.Child) return 'tooYoung';
    if (e.map[a] !== e.map[i] || Math.hypot(e.x[a]! - e.x[i]!, e.y[a]! - e.y[i]!) > 3.5) return 'tooFar';
    h.rider = e.id(i); h.mode = 'follow'; h.fear = 0; this.routes.delete(e.id(a));
    w.detachBody(a);
    this.riding[i] = 1; this.riding[a] = 2;
    e.x[a] = e.x[i]!; e.y[a] = e.y[i]!;
    this.note(h, 'mount', this.mapId(a));
    w.emit('mount', { id: h.rider, horse: e.id(a), name: h.name });
    return 'mounted';
  }
  /** Person i gets off (the horse stands next to them). */
  dismount(i: number): string {
    const w = this.w, e = w.e, a = this.ridden(i);
    if (a < 0) { this.riding[i] = 0; return 'notRiding'; }
    this.drop(a, this.h.get(e.id(a))!);
    w.emit('dismount', { id: e.id(i), horse: e.id(a) });
    return 'dismounted';
  }
  /** The horse is let go of by its rider: on the ground next to where they are. */
  private drop(a: number, h: Horse): void {
    const w = this.w, e = w.e, r = h.rider >= 0 ? e.slot(h.rider) : -1;
    h.rider = -1; h.mode = 'wait'; h.until = this.t + (this.stables.has(r >= 0 && e.map[r] !== NO_MAP ? e.map[r]! : e.map[a]!) ? STABLE_AFTER : 30);
    e.flags[a] = e.flags[a]! & ~EFlag.Transit; this.riding[a] = 0;
    if (r >= 0) this.riding[r] = 0;
    const m = r >= 0 && e.map[r] !== NO_MAP ? e.map[r]! : e.map[a]!;
    if (m === NO_MAP) return; // still on the road: placed when the rider arrives
    const s = w.freeSpot(m, e.x[a]! + Math.cos(e.angle[a]! + 1.6) * 1.2, e.y[a]! + Math.sin(e.angle[a]! + 1.6) * 1.2, 30, this.rng) ?? { x: e.x[a]!, y: e.y[a]! };
    w.attachBody(a, m, s.x, s.y);
    e.tx[a] = s.x; e.ty[a] = s.y; e.speed[a] = 0; h.hx = s.x; h.hy = s.y;
    this.note(h, 'left', w.maps[m]!.def.id);
  }
  /** The speed of rider i given what they asked for (walk / run). */
  rideSpeed(i: number, want: number): number {
    const a = this.ridden(i), h = a >= 0 ? this.h.get(this.w.e.id(a)) : undefined;
    if (!h) return want;
    if (want <= 0) return 0;
    const run = want > this.w.sc.agents.walk * 1.3;
    return run ? (h.sta > 1 ? h.speed : CANTER) : TROT * Math.min(1.1, h.size);
  }
  /** What the TV needs to move my character at the horse's pace. */
  rideOf(i: number): { name: string; walk: number; run: number; sta: number; q: number } | null {
    const a = this.ridden(i), h = a >= 0 ? this.h.get(this.w.e.id(a)) : undefined;
    if (!h) return null;
    return { name: h.name, walk: TROT * Math.min(1.1, h.size), run: h.sta > 1 ? h.speed : CANTER, sta: Math.round((h.sta / h.stamina) * 100), q: h.q };
  }
  /** Player i's "horse" button: off when riding; on my horse when one is near; else try to tame the nearest wild one. */
  playerAct(i: number): Record<string, unknown> {
    const e = this.w.e;
    if (this.riding[i] === 1) return { ok: true, code: this.dismount(i) };
    const m = e.map[i]!, x = e.x[i]!, y = e.y[i]!;
    let mineN = -1, wild = -1, md = 3.5, wd = 3.4;
    for (const [id, h] of this.h) {
      const s = e.slot(id);
      if (s < 0 || e.map[s] !== m || h.rider >= 0) continue;
      const d = Math.hypot(e.x[s]! - x, e.y[s]! - y);
      if (h.owner === e.id(i) && d < md) { md = d; mineN = s; }
      else if (h.owner < 0 && d < wd) { wd = d; wild = s; }
    }
    if (mineN >= 0) { const c = this.mount(i, mineN); return { ok: c === 'mounted', code: c, name: this.of(mineN)?.name }; }
    if (wild >= 0) { const r = this.tame(i, wild); return { ok: r.code === 'tamed', ...r, chance: r.chance !== undefined ? Math.round(r.chance * 100) : undefined, trust: r.trust !== undefined ? Math.round(r.trust * 100) : undefined }; }
    // My horse is somewhere else: farther than CALL_NEAR on this map = I whistle and it runs to me (a real way, no magic);
    // closer = I walk over to it; on another map = it stays there.
    const free = this.mine(i).filter((s) => this.h.get(e.id(s))!.rider < 0);
    let here = -1, hd = Infinity;
    for (const s of free) { if (e.map[s] !== m) continue; const d = Math.hypot(e.x[s]! - x, e.y[s]! - y); if (d < hd) { hd = d; here = s; } }
    if (here >= 0) {
      const h = this.h.get(e.id(here))!;
      if (hd <= CALL_NEAR) return { ok: false, code: 'walkOver', name: h.name, dist: Math.round(hd) };
      this.call(here, i);
      return { ok: true, code: 'called', name: h.name, dist: Math.round(hd) };
    }
    const away = free.find((s) => e.map[s] !== NO_MAP);
    if (away !== undefined) return { ok: false, code: 'otherMap', name: this.h.get(e.id(away))!.name, map: this.w.maps[e.map[away]!]!.def.id };
    return { ok: false, code: 'noHorse'};
  }
  /** Horse a is called by its owner i: it runs to them by a real path (`come`). */
  call(a: number, i: number): void {
    const h = this.of(a);
    if (!h || h.rider >= 0) return;
    h.mode = 'come'; h.until = 0; h.fear = 0;
    this.routes.set(this.w.e.id(a), { pts: [], k: 0, gx: NaN, gy: NaN, at: -1e9, since: this.t });
    this.note(h, 'called', this.mapId(a));
    this.w.emit('horseCalled', { id: this.w.e.id(i), horse: this.w.e.id(a), name: h.name });
  }
  /** Real seconds the ride through gate (portal index) pi takes: 5-15, its own for each gate. */
  gateSecs(pi: number): number {
    const p = this.w.portals[pi];
    const key = p ? `${p.from}:${p.dest}:${Math.round(p.x)}:${Math.round(p.y)}` : String(pi);
    let hsh = 2166136261;
    for (let k = 0; k < key.length; k++) { hsh ^= key.charCodeAt(k); hsh = Math.imul(hsh, 16777619); }
    return 5 + ((hsh >>> 0) % 1001) / 100;
  }
  /** What my ridden horse looks like (the TV's riding scene between maps). */
  rideLook(i: number): { name: string; q: number; coat: number; scale: number } | undefined {
    const a = this.ridden(i), h = a >= 0 ? this.h.get(this.w.e.id(a)) : undefined;
    return h ? { name: h.name, q: h.q, coat: h.coat, scale: +this.scale(h).toFixed(2) } : undefined;
  }
  /**
   * What person i knows about horses, for the prompts: their own horse (where it is, how to use it) or where the wild ones are and
   * how to get one (imad 2026-11-26: "nobody uses horses to move").
   */
  promptText(i: number): string {
    const w = this.w, e = w.e, m = e.map[i]!, mine = this.mine(i);
    if (this.riding[i] === 1) { const a = this.ridden(i), h = a >= 0 ? this.of(a) : undefined; return `You are riding your horse${h ? ' ' + h.name : ''}: it carries you fast, also through the gates.`; }
    if (mine.length) {
      const a = mine[0]!, h = this.of(a)!, q = ['common', 'rare', 'legendary'][h.q];
      let where = e.map[a] === m ? `${Math.round(Math.hypot(e.x[a]! - e.x[i]!, e.y[a]! - e.y[i]!))} m away` : e.map[a] === NO_MAP ? 'on the road' : `in ${w.maps[e.map[a]!]!.def.name}`;
      if (e.map[a] !== NO_MAP && this.stables.inside(e.map[a]!, e.x[a]!, e.y[a]!)) where += ', in the stable\'s field (it goes there when nobody rides it)';
      return `Your horse: ${h.name} (${q}, gallops ${h.speed.toFixed(1)} m/s), ${where}. Ride it for any long way and to other places (skill ride): you get on by yourself when it is near, it comes when you whistle.`;
    }
    const wild = w.maps.filter((x) => this.count(x.index, true) > 0).map((x) => x.def.name);
    if (!wild.length) return 'You have no horse, and there are no wild horses about.';
    return `You have no horse. Wild horses live in ${wild.join(', ')}${this.count(m, true) ? ' (some here)' : ''}: tame one (skill tame; brave, clever people do it best) to ride 3-5 times faster than walking.`;
  }
  /** The nearest wild horse to person i within r m (slot / -1). */
  nearestWild(i: number, r: number): number {
    const e = this.w.e;
    let best = -1, bd = r;
    for (const [id, h] of this.h) {
      if (h.owner >= 0) continue;
      const s = e.slot(id);
      if (s < 0 || e.map[s] !== e.map[i]) continue;
      const d = Math.hypot(e.x[s]! - e.x[i]!, e.y[s]! - e.y[i]!);
      if (d < bd) { bd = d; best = s; }
    }
    return best;
  }
  /** A horse was hit by person `by` (slot, -1): it is frightened, its herd runs, it will not trust them. */
  onHit(a: number, by: number): void {
    const e = this.w.e, h = this.of(a);
    if (!h) return;
    if (by >= 0) h.trust['#' + e.id(by)] = -1;
    this.alarm(a, h, by >= 0 ? e.x[by]! : e.x[a]!, by >= 0 ? e.y[by]! : e.y[a]!);
  }
  private alarm(a: number, h: Horse, x: number, y: number): void {
    const e = this.w.e, now = this.t;
    h.fear = 1; h.fx = x; h.fy = y; h.mode = 'flee'; h.until = now + 6;
    if (h.herd < 0) return;
    for (const s of this.members(h.herd)) {
      const o = this.h.get(e.id(s))!;
      if (o === h || o.fear >= 0.9 || Math.hypot(e.x[s]! - e.x[a]!, e.y[s]! - e.y[a]!) > 30) continue;
      o.fear = 0.9; o.fx = x; o.fy = y; o.mode = 'flee'; o.until = now + 5 + this.rng.next() * 2;
    }
  }

  // ------------------------------------------------------------------ per tick
  update(): void {
    const w = this.w, e = w.e;
    this.t = w.tick * w.dt;
    if (w.gameSec >= this.nextHour) { const first = this.nextHour === 0; this.nextHour = w.gameSec + HOUR; this.hourly(first); }
    if (w.tick % EVERY !== 0) return;
    const dt = w.dt * EVERY, night = (() => { const hr = w.brain.hour(); return hr >= 21 || hr < 5; })();
    // Herd centres (and the leader's heading) once per pass.
    const cx = new Map<number, [number, number, number]>();
    for (const [id, h] of this.h) {
      if (h.herd < 0) continue;
      const s = e.slot(id);
      if (s < 0 || e.map[s] === NO_MAP) continue;
      const c = cx.get(h.herd) ?? [0, 0, 0];
      c[0] += e.x[s]!; c[1] += e.y[s]!; c[2]++; cx.set(h.herd, c);
    }
    for (const hd of this.herds.values()) this.lead(hd, cx.get(hd.id), night);
    for (const [id, h] of this.h) {
      const i = e.slot(id);
      if (i < 0) { this.forget(id, h); continue; }
      // Stamina: a gallop uses it, the rest of the time it comes back.
      const v = Math.hypot(e.vx[i]!, e.vy[i]!);
      h.sta = v > CANTER + 0.3 ? Math.max(0, h.sta - dt) : Math.min(h.stamina, h.sta + dt * (v < 0.5 ? 0.9 : 0.45));
      if (h.rider >= 0) { this.rideLogic(i, h); continue; }
      if (e.map[i] === NO_MAP) continue;
      this.think(i, h, cx.get(h.herd), night, dt);
    }
  }

  /** The lead mare chooses where the herd goes next. */
  private lead(hd: Herd, c: [number, number, number] | undefined, night: boolean): void {
    const w = this.w, e = w.e, li = e.slot(hd.lead);
    if (li < 0 || !c) { const m = this.members(hd.id); if (!m.length) this.herds.delete(hd.id); else hd.lead = e.id(m[0]!); return; }
    if (hd.until > this.t && Math.hypot(hd.gx - e.x[li]!, hd.gy - e.y[li]!) > 2) return;
    // Night: stay put. Day: on to new grass, 10-30 m on, now and then to water.
    hd.until = this.t + (night ? 60 : this.rng.range(25, 70));
    if (night) { hd.gx = e.x[li]!; hd.gy = e.y[li]!; return; }
    const mp = w.maps[e.map[li]!]!;
    if (this.rng.chance(0.18) && w.survival.T.water >= 0) {
      const k = w.survival.nearestTile(li, w.survival.T.water, 70);
      if (k >= 0) { const W = mp.tiles.w, s = w.freeSpot(e.map[li]!, (k % W) + 0.5, ((k / W) | 0) + 0.5, 20, this.rng); if (s) { hd.gx = s.x; hd.gy = s.y; return; } }
    }
    for (let t = 0; t < 12; t++) {
      const a = this.rng.next() * Math.PI * 2, d = this.rng.range(10, 30);
      const x = Math.max(10, Math.min(mp.def.w - 10, e.x[li]! + Math.cos(a) * d)), y = Math.max(10, Math.min(mp.def.h - 10, e.y[li]! + Math.sin(a) * d));
      if (mp.tiles.isSolidAt(x, y)) continue;
      const tt = mp.tiles.get(Math.floor(x), Math.floor(y));
      if (tt === w.survival.T.floor || tt === w.survival.T.water) continue;
      hd.gx = x; hd.gy = y; return;
    }
  }

  /** The nearest danger horse i sees: [x, y, how bad 0..1] or null. Smarter horses notice predators sooner and trust calm walkers more. */
  private danger(i: number, h: Horse): [number, number, number] | null {
    const w = this.w, e = w.e, m = e.map[i]!, x = e.x[i]!, y = e.y[i]!;
    let best: [number, number, number] | null = null;
    for (let j = 0; j < e.hi; j++) {
      if (e.map[j] !== m || j === i) continue;
      const k = e.kind[j];
      let r = 0;
      if (k === Kind.Threat) r = 16 + h.intel * 6;
      else if (k === Kind.Animal && (e.sub[j] === 3 || e.sub[j] === 4)) r = 12 + h.intel * 6;
      else if (k === Kind.Agent || k === Kind.Player) {
        if (k === Kind.Player && w.away.has(e.id(j))) continue;
        if (h.owner >= 0 && (h.owner === e.id(j) || this.riding[j])) continue; // a tamed horse knows people
        if (h.owner >= 0) continue;
        const tk = '#' + e.id(j), trust = h.trust[tk] ?? 0;
        // Habituation: someone who stays near and moves calmly is trusted a little more each moment (smart horses learn faster).
        const dj = Math.hypot(e.x[j]! - x, e.y[j]! - y);
        if (dj < 12 && Math.hypot(e.vx[j]!, e.vy[j]!) < 1.7 && trust > -0.5 && trust < 0.4) h.trust[tk] = trust + 0.002 * (0.6 + h.intel * 0.6) * (0.6 + (w.profileOf(j)?.traits.intelligence ?? 0.5) * 0.8);
        const fast = Math.hypot(e.vx[j]!, e.vy[j]!) > 2.2 ? 1.6 - h.intel * 0.3 : 1; // a running person looks like a hunter
        const armed = e.act[j] === Act.Fight ? 1.4 : 1;
        r = (4.5 + (1 - h.intel) * 4) * (1 - Math.max(-0.6, Math.min(0.85, trust))) * fast * armed;
      } else continue;
      const d = Math.hypot(e.x[j]! - x, e.y[j]! - y);
      if (d < r) { const bad = 1 - d / r; if (!best || bad > best[2]) best = [e.x[j]!, e.y[j]!, bad]; }
      // A stallion kicks a wolf / bear / zombie that is right at the herd.
      if (d < 1.6 && h.sex === 'm' && this.ageYears(h) >= 3 && (k === Kind.Threat || k === Kind.Animal) && this.rng.chance(0.35)) {
        if (k === Kind.Threat) w.zombies.hit(j, 14, -1); else w.animals.hit(j, 14, -1);
        w.emit('horseKick', { horse: e.id(i), at: k === Kind.Threat ? 'zombie' : 'animal' });
      }
    }
    return best;
  }

  private think(i: number, h: Horse, c: [number, number, number] | undefined, night: boolean, dt: number): void {
    const w = this.w, e = w.e, now = this.t, x = e.x[i]!, y = e.y[i]!;
    const dg = this.danger(i, h);
    if (dg && (dg[2] > 0.15 || h.fear > 0.3)) {
      if (h.mode !== 'flee') this.alarm(i, h, dg[0], dg[1]);
      else { h.fx = dg[0]; h.fy = dg[1]; h.fear = Math.max(h.fear, dg[2] + 0.4); h.until = Math.max(h.until, now + 3); }
    }
    const gait = (v: number) => { e.speed[i] = v; };
    const at = (tx: number, ty: number) => { e.tx[i] = tx; e.ty[i] = ty; };
    if (h.mode === 'flee') {
      if (now > h.until) { h.fear = Math.max(0, h.fear - dt * 0.6); if (h.fear <= 0.05) { h.mode = 'alert'; h.until = now + this.rng.range(4, 9); } }
      // Away from the danger, a little towards the herd (they run together), the leader's way.
      let ax = x - h.fx, ay = y - h.fy; const l = Math.hypot(ax, ay) || 1; ax /= l; ay /= l;
      if (c && c[2] > 1) { const hx = c[0] / c[2] - x, hy = c[1] / c[2] - y, hl = Math.hypot(hx, hy); if (hl > 3) { ax += (hx / hl) * 0.35; ay += (hy / hl) * 0.35; } }
      const tx = x + ax * 8, ty = y + ay * 8;
      const mp = w.maps[e.map[i]!]!;
      if (mp.tiles.isSolidAt(tx, ty)) { at(x - ay * 8, y + ax * 8); } else at(tx, ty); // a wall ahead: break sideways
      gait(h.sta > 1 ? h.speed * (0.75 + h.fear * 0.25) : CANTER);
      e.act[i] = Act.Flee;
      return;
    }
    // Tamed (imad 2026-11-25: "not follow me, do whatever it wants"): it lives on its own round its home spot, comes when called.
    if (h.owner >= 0) {
      const o = e.slot(h.owner);
      if (o < 0 && !w.profiles.get(h.owner)?.player) { this.note(h, 'wild'); this.loseIt(h.owner, h, 'wild'); h.owner = -1; h.mode = 'graze'; this.routes.delete(e.id(i)); this.joinHerd(i, h); return; } // the owner died: wild again
      if (h.hx === undefined || h.hy === undefined) { h.hx = x; h.hy = y; }
      if (h.mode === 'come') { if (this.come(i, h, o)) return; }
      if (h.mode === 'follow') h.mode = 'graze'; // old saves: no more following
      const kept = this.stables.has(e.map[i]!);
      if (h.mode === 'wait' && kept && now < h.until && h.until - now < 80) { // a stable here: not needed (owner walked off) = off it goes after a few seconds
        if (o < 0 || e.map[o] !== e.map[i] || Math.hypot(e.x[o]! - x, e.y[o]! - y) > 12) h.until = Math.min(h.until, now);
      }
      if (h.mode === 'wait') { // came to its owner (or was just left): stands there a while, then lives there
        if (now < h.until) { gait(0); at(x, y); e.act[i] = Act.Idle; if (o >= 0 && e.map[o] === e.map[i] && Math.hypot(e.x[o]! - x, e.y[o]! - y) < 8) e.angle[i] = Math.atan2(e.y[o]! - y, e.x[o]! - x); return; }
        h.mode = 'graze'; h.until = now; h.hx = x; h.hy = y;
      }
      if (kept && this.kept(i, h, night)) return;
      if (h.mode === 'walk') { // on its way somewhere near home (more grass, a look round)
        if (Math.hypot(e.tx[i]! - x, e.ty[i]! - y) > 1 && now < h.until) return;
        h.mode = 'graze'; h.until = now;
      }
      if (now >= h.until && !night && this.rng.chance(0.3)) { // now and then it walks on: within its range of home
        const mp = w.maps[e.map[i]!]!;
        if (kept) { // in the paddock: somewhere else in the field (or under the roof in bad weather)
          const sp = this.stables.spot(e.map[i]!, this.shelter(night), () => this.rng.next());
          if (sp && Math.hypot(sp.x - x, sp.y - y) > 2 && this.finder(e.map[i]!).clear(x, y, sp.x, sp.y)) {
            h.mode = 'walk'; h.until = now + 30; at(sp.x, sp.y); gait(1.1 + h.size * 0.1); e.act[i] = Act.Wander;
            return;
          }
        }
        for (let t = 0; t < 8 && !kept; t++) {
          const an = this.rng.next() * Math.PI * 2, dd = this.rng.range(5, 16);
          let tx = x + Math.cos(an) * dd, ty = y + Math.sin(an) * dd;
          const hd = Math.hypot(tx - h.hx, ty - h.hy);
          if (hd > RANGE) { tx = h.hx + (tx - h.hx) * (RANGE / hd) * 0.6; ty = h.hy + (ty - h.hy) * (RANGE / hd) * 0.6; }
          if (tx < 3 || ty < 3 || tx > mp.def.w - 3 || ty > mp.def.h - 3 || mp.tiles.isSolidAt(tx, ty) || !this.finder(e.map[i]!).clear(x, y, tx, ty)) continue;
          const tt = mp.tiles.get(Math.floor(tx), Math.floor(ty));
          if (tt === w.survival.T.floor || tt === w.survival.T.water) continue;
          h.mode = 'walk'; h.until = now + 30; at(tx, ty); gait(1.1 + h.size * 0.1); e.act[i] = Act.Wander;
          return;
        }
      }
      this.graze(i, h, x, y, night);
      return;
    }
    // Wild, calm: boids around the herd, the leader's way; foals at their mother's side.
    let gx = x, gy = y, far = 0;
    const hd = this.herds.get(h.herd);
    if (h.mother >= 0 && this.ageYears(h) < 1.5) { const mo = e.slot(h.mother); if (mo >= 0 && e.map[mo] === e.map[i]) { gx = e.x[mo]! + 1.2; gy = e.y[mo]!; far = Math.hypot(gx - x, gy - y); } }
    else if (hd && c && c[2] > 0) {
      const cxm = c[0] / c[2], cym = c[1] / c[2];
      const isLead = e.id(i) === hd.lead;
      if (isLead) { gx = hd.gx; gy = hd.gy; far = Math.hypot(gx - x, gy - y); }
      else {
        // Cohesion: towards the herd's middle, shifted the leader's way; a stallion keeps to the edge.
        const li = e.slot(hd.lead), lx = li >= 0 ? e.x[li]! : cxm, ly = li >= 0 ? e.y[li]! : cym;
        gx = cxm * 0.6 + lx * 0.4; gy = cym * 0.6 + ly * 0.4;
        far = Math.hypot(gx - x, gy - y) - (h.sex === 'm' ? 6 : night ? 1.5 : 4);
      }
    }
    // Separation: step off anyone closer than 1.6 m.
    for (const [oid] of this.h) {
      const s = e.slot(oid);
      if (s < 0 || s === i || e.map[s] !== e.map[i]) continue;
      const dx = x - e.x[s]!, dy = y - e.y[s]!, d = Math.hypot(dx, dy);
      if (d < 1.6 && d > 0.01) { gx += (dx / d) * 1.5; gy += (dy / d) * 1.5; far = Math.max(far, 0.8); }
    }
    if (h.mode === 'alert') { // looking back at where the danger was
      e.speed[i] = 0; at(x, y); e.act[i] = Act.Idle; e.angle[i] = Math.atan2(h.fy - y, h.fx - x);
      if (now > h.until) h.mode = 'graze';
      return;
    }
    if (far > 1.2) { h.mode = 'walk'; at(gx, gy); gait(far > 12 ? TROT : 1.1 + h.size * 0.1); e.act[i] = Act.Wander; return; }
    this.graze(i, h, x, y, night);
  }
  /** Under a roof wanted: night, rain, storm, snow. */
  private shelter(night: boolean): boolean { const k = this.w.weather.kind; return night || k === 'rain' || k === 'storm' || k === 'snow' || k === 'blizzard'; }
  /**
   * A tamed horse nobody rides on a map with a stable (sim/stables.ts): it goes there by a real path and stays inside the fence,
   * in the field by day, under the stable's roof at night and in rain / snow. True = handled this pass (on its way).
   */
  private kept(i: number, h: Horse, night: boolean): boolean {
    const e = this.w.e, id = e.id(i), m = e.map[i]!, x = e.x[i]!, y = e.y[i]!, now = this.t;
    if (this.trips.has(id)) { if (this.trip(i, h)) return true; }
    if ((this.tripFail.get(id) ?? -1e9) > now - 60) return false; // could not get there lately: lives where it is for a while
    const roof = this.shelter(night), inside = this.stables.inside(m, x, y);
    let go = !inside;
    if (inside && roof && !this.stables.inStall(m, x, y) && h.mode !== 'walk' && this.rng.chance(0.25)) go = true;
    if (!go) return false;
    const sp = this.stables.spot(m, roof || !inside && this.rng.chance(0.3), () => this.rng.next());
    if (!sp) return false;
    this.trips.set(id, { pts: [], k: 0, tx: sp.x, ty: sp.y, at: -1e9, since: now });
    h.mode = 'stable'; h.until = now;
    if (!inside) this.note(h, 'stable', this.mapId(i));
    return this.trip(i, h);
  }
  /** On its way to the stable / field: follows a path (found again every few seconds); gives up after 3 minutes. */
  private trip(i: number, h: Horse): boolean {
    const w = this.w, e = w.e, id = e.id(i), x = e.x[i]!, y = e.y[i]!, now = this.t, r = this.trips.get(id);
    if (!r || h.mode !== 'stable') { this.trips.delete(id); return false; }
    const d = Math.hypot(r.tx - x, r.ty - y);
    if (d < 1.2) { this.trips.delete(id); h.mode = 'graze'; h.until = now; h.hx = x; h.hy = y; e.speed[i] = 0; e.tx[i] = x; e.ty[i] = y; return false; }
    if (now - r.since > 180) { this.trips.delete(id); this.tripFail.set(id, now); h.mode = 'graze'; h.until = now; h.hx = x; h.hy = y; return false; }
    if (now - r.at > 6 || (r.pts.length && r.k >= r.pts.length)) {
      const pf = this.finder(e.map[i]!), res = pf.find(x, y, r.tx, r.ty);
      r.pts = []; r.k = 0; r.at = now;
      if (res !== 'none') { const W = w.maps[e.map[i]!]!.tiles.w; for (let k = 0; k < pf.outN; k++) { const t = pf.out[k]!; r.pts.push((t % W) + 0.5, ((t / W) | 0) + 0.5); } }
    }
    while (r.k < r.pts.length - 2 && Math.hypot(r.pts[r.k]! - x, r.pts[r.k + 1]! - y) < 1.2) r.k += 2;
    if (!r.pts.length || r.k >= r.pts.length - 2) { e.tx[i] = r.tx; e.ty[i] = r.ty; } else { e.tx[i] = r.pts[r.k]!; e.ty[i] = r.pts[r.k + 1]!; }
    e.speed[i] = d > 40 ? TROT : d > 4 ? 1.5 + h.size * 0.1 : 1.1;
    e.act[i] = Act.Go;
    return true;
  }
  private finder(m: number): Pathfinder { return this.finders[m] ??= new Pathfinder(this.w.maps[m]!.tiles, 4000); }
  /** A called horse runs to its owner along a real path. False when it is no longer coming (then it lives on as usual). */
  private come(i: number, h: Horse, o: number): boolean {
    const w = this.w, e = w.e, id = e.id(i), x = e.x[i]!, y = e.y[i]!, now = this.t;
    const r = this.routes.get(id);
    if (o < 0 || e.map[o] !== e.map[i] || !r || now - r.since > 150) { if (r) this.note(h, 'gaveUp', this.mapId(i)); this.routes.delete(id); h.mode = 'graze'; h.until = now; return false; }
    const ox = e.x[o]!, oy = e.y[o]!, d = Math.hypot(ox - x, oy - y);
    if (d < 3) { // here: it stops by its owner and waits to be ridden
      this.routes.delete(id); h.mode = 'wait'; h.until = now + 90; h.hx = x; h.hy = y;
      e.speed[i] = 0; e.tx[i] = x; e.ty[i] = y; e.act[i] = Act.Idle; e.angle[i] = Math.atan2(oy - y, ox - x);
      this.note(h, 'came', this.mapId(i));
      w.emit('horseCame', { id: h.owner, horse: id, name: h.name });
      return true;
    }
    if (!r.pts.length || Math.hypot(ox - r.gx, oy - r.gy) > 4 || now - r.at > 5) {
      const pf = this.finder(e.map[i]!), res = pf.find(x, y, ox, oy);
      r.pts = []; r.k = 0; r.gx = ox; r.gy = oy; r.at = now;
      if (res !== 'none') { const W = w.maps[e.map[i]!]!.tiles.w; for (let k = 0; k < pf.outN; k++) { const t = pf.out[k]!; r.pts.push((t % W) + 0.5, ((t / W) | 0) + 0.5); } }
    }
    while (r.k < r.pts.length - 2 && Math.hypot(r.pts[r.k]! - x, r.pts[r.k + 1]! - y) < 1.2) r.k += 2;
    const last = r.k >= r.pts.length - 2;
    if (!r.pts.length || last) { e.tx[i] = ox; e.ty[i] = oy; } else { e.tx[i] = r.pts[r.k]!; e.ty[i] = r.pts[r.k + 1]!; }
    e.speed[i] = d > 14 ? (h.sta > 1 ? h.speed * 0.85 : CANTER) : d > 6 ? TROT : 1.6;
    e.act[i] = Act.Go;
    return true;
  }
  /** Graze (head down, a step now and then) or doze standing; at night mostly doze. */
  private graze(i: number, h: Horse, x: number, y: number, night: boolean): void {
    const w = this.w, e = w.e, now = this.t;
    if (h.mode === 'walk' || h.mode === 'follow' || h.mode === 'come' || h.mode === 'wait') { h.mode = 'graze'; h.until = now; }
    if (now < h.until) { if (Math.hypot(e.tx[i]! - x, e.ty[i]! - y) < 0.3) e.speed[i] = 0; return; }
    const rest = night ? this.rng.chance(0.8) : this.rng.chance(0.25);
    h.mode = rest ? 'rest' : 'graze';
    h.until = now + this.rng.range(5, rest ? 25 : 14);
    e.act[i] = rest ? Act.Rest : Act.Eat;
    if (!rest && this.rng.chance(0.6)) { const a = this.rng.next() * Math.PI * 2; e.tx[i] = x + Math.cos(a) * 1.2; e.ty[i] = y + Math.sin(a) * 1.2; e.speed[i] = 0.45; }
    else { e.tx[i] = x; e.ty[i] = y; e.speed[i] = 0; }
  }
  /** A horse on its own joins the nearest herd of its map (or starts one). */
  private joinHerd(i: number, h: Horse): void {
    const e = this.w.e;
    let best = -1, bd = 60;
    for (const hd of this.herds.values()) {
      const l = e.slot(hd.lead);
      if (l < 0 || e.map[l] !== e.map[i]) continue;
      const d = Math.hypot(e.x[l]! - e.x[i]!, e.y[l]! - e.y[i]!);
      if (d < bd) { bd = d; best = hd.id; }
    }
    if (best >= 0) { h.herd = best; return; }
    const id = this.nextHerd++;
    h.herd = id;
    this.herds.set(id, { id, map: e.map[i]!, lead: e.id(i), gx: e.x[i]!, gy: e.y[i]!, until: 0 });
  }

  /** People decide when to ride: on for a long walk (their horse close by), off to work, sleep, talk, eat. */
  private rideLogic(a: number, h: Horse): void {
    const w = this.w, e = w.e, r = e.slot(h.rider);
    if (r < 0 || e.hp[r]! <= 0) { this.drop(a, h); return; }
    if (e.flags[r]! & EFlag.Sleeping) { this.dismount(r); return; }
    if (e.kind[r] === Kind.Agent) {
      const act = e.act[r]!;
      const off = act === Act.Sleep || act === Act.Talk || act === Act.Eat || act === Act.Drink || act === Act.Rest;
      const going = act === Act.Travel || w.tasks.stepOf(e.id(r))?.do === 'ride'; // on the way to a gate / riding somewhere: stay on
      if (off || (!going && w.brain.goalDist(r) < 2 && Math.hypot(e.vx[r]!, e.vy[r]!) < 0.2)) this.dismount(r);
    }
  }
  /** Agents with a horse close by get on it for a long way (called by update for agents, every pass). */
  private autoMount(): void {
    const w = this.w, e = w.e;
    for (const [id, h] of this.h) {
      if (h.owner < 0 || h.rider >= 0) continue;
      const o = e.slot(h.owner), a = e.slot(id);
      if (o < 0 || a < 0 || e.kind[o] !== Kind.Agent || e.map[o] !== e.map[a] || e.map[o] === NO_MAP) continue;
      if ((e.flags[o]! & (EFlag.Sleeping | EFlag.Child)) || this.riding[o]) continue;
      const act = e.act[o]!;
      if (act !== Act.Go && act !== Act.Wander && act !== Act.Forage && act !== Act.Travel && act !== Act.Flee && act !== Act.Fight && act !== Act.Gather && act !== Act.Build) continue;
      // A long way to go (30 m+): whistle, it gallops over; get on when it is there and there is still 10 m+ to go (imad 2026-11-26:
      // "nobody uses horses": the old rule wanted 22 m left AFTER the horse arrived, so most calls ended with no ride).
      const left = w.brain.goalDist(o), d = Math.hypot(e.x[a]! - e.x[o]!, e.y[a]! - e.y[o]!);
      if (left < (d <= 6 ? 10 : 30)) continue;
      if (d > 6) { if (h.mode !== 'flee' && h.mode !== 'come' && d < 120) this.call(a, o); continue; } // whistle: it runs over, they get on when it is there
      this.mount(o, a);
    }
  }

  /** After the physics step: a ridden horse is where its rider is (also on the road between maps). */
  sync(): void {
    const w = this.w, e = w.e;
    if (w.tick % EVERY === 0) this.autoMount();
    for (const [id, h] of this.h) {
      if (h.rider < 0) continue;
      const a = e.slot(id), r = e.slot(h.rider);
      if (a < 0) { if (r >= 0) this.riding[r] = 0; h.rider = -1; continue; }
      if (r < 0) { this.drop(a, h); continue; }
      if (e.map[r] === NO_MAP) {
        if (e.map[a] !== NO_MAP) { // the rider just took the road: the horse carries them (World.enterPortal timed the ride, gateSecs)
          w.detachBody(a);
          e.map[a] = NO_MAP; e.flags[a] = e.flags[a]! | EFlag.Transit;
        }
        continue;
      }
      if (e.map[a] !== e.map[r]) { e.map[a] = e.map[r]!; e.flags[a] = e.flags[a]! & ~EFlag.Transit; this.note(h, 'road', this.mapId(a)); }
      e.x[a] = e.x[r]!; e.y[a] = e.y[r]!; e.vx[a] = e.vx[r]!; e.vy[a] = e.vy[r]!; e.angle[a] = e.angle[r]!;
      e.tx[a] = e.x[a]!; e.ty[a] = e.y[a]!;
      e.flags[a] = (e.flags[a]! & ~EFlag.Moving) | (e.flags[r]! & EFlag.Moving);
      e.act[a] = Act.Go;
    }
    this.rebuildRiding();
  }

  private rebuildRiding(): void {
    const e = this.w.e;
    this.riding.fill(0);
    for (const [id, h] of this.h) { if (h.rider < 0) continue; const a = e.slot(id), r = e.slot(h.rider); if (a >= 0 && r >= 0) { this.riding[a] = 2; this.riding[r] = 1; } }
  }

  /** A horse that is gone (hunted, removed): forget it, its rider gets off. */
  private forget(id: number, h: Horse): void {
    this.trips.delete(id); this.tripFail.delete(id);
    if (h.rider >= 0) { const r = this.w.e.slot(h.rider); if (r >= 0) this.riding[r] = 0; }
    if (h.owner >= 0) { this.note(h, 'gone'); this.loseIt(h.owner, h, 'gone'); } // its owner is told
    this.h.delete(id);
    if (h.herd >= 0) { const hd = this.herds.get(h.herd); if (hd && hd.lead === id) { const m = this.members(hd.id); if (m.length) hd.lead = this.w.e.id(m[0]!); else this.herds.delete(hd.id); } }
  }

  /** Once a game hour: foals, old age, bands wandering in where there are too few. */
  private hourly(first: boolean): void {
    const w = this.w, e = w.e;
    // Horses from an old snapshot without horse data (or spawned by hand): give them stats.
    for (let i = 0; i < e.hi; i++) if (e.kind[i] === Kind.Animal && e.sub[i] === HORSE && !this.h.has(e.id(i))) {
      const q = this.quality(), st = this.roll(q);
      this.h.set(e.id(i), { name: this.name(), sex: this.rng.chance(0.5) ? 'f' : 'm', born: w.gameSec - 5 * w.yearSec, mother: -1, ...st, sta: st.stamina, q, coat: this.rng.int(7), herd: -1, owner: -1, rider: -1, trust: {}, fear: 0, fx: 0, fy: 0, mode: 'graze', until: 0 });
      this.joinHerd(i, this.h.get(e.id(i))!);
    }
    w.maps.forEach((mp, m) => {
      const cap = this.capOf(m), wild = this.count(m, true);
      if (wild < Math.ceil(cap / 2) && (first || this.rng.chance(0.25))) {
        const s = this.spot(m, !first);
        if (s) { const n = Math.min(cap - wild, mp.def.gen.type === 'wilds' || cap > 6 ? 3 + this.rng.int(5) : 3); if (n > 0) this.spawnHerd(m, s.x, s.y, n); }
      }
    });
    if (first) return;
    this.ownPlans();
    // Foals: a grown mare with a stallion in her herd, 0.6 a year, while the map has room.
    const perHour = 0.6 / Math.max(1, w.yearSec / HOUR);
    for (const [id, h] of [...this.h]) {
      const i = e.slot(id);
      if (i < 0 || !this.isHorse(i)) { if (h.owner >= 0) { this.note(h, 'gone'); this.loseIt(h.owner, h, 'gone'); } this.h.delete(id); continue; } // removed some other way: its owner is told
      if (e.map[i] === NO_MAP) continue;
      const age = this.ageYears(h);
      // Old age, tamed horses too (imad 2026-11-27 kept it): a year is one game day by default, so a tamed horse may die after a
      // few days of play; its owner is told what happened when they call it (history).
      if (age > 22 + (h.q * 3) && this.rng.chance((age - 22) * 0.1 * perHour * 10)) { // old age
        if (h.owner >= 0) { this.note(h, 'old', String(Math.floor(age))); this.loseIt(h.owner, h, 'old'); }
        w.emit('death', { id, cause: 'old age', horse: h.name, map: w.maps[e.map[i]!]!.def.id });
        if (h.rider >= 0) this.dismount(e.slot(h.rider));
        this.h.delete(id); w.remove(i, 'old age');
        continue;
      }
      if (h.sex !== 'f' || age < 3 || h.herd < 0 || h.owner >= 0 || this.count(e.map[i]!, true) >= this.capOf(e.map[i]!)) continue;
      const sire = this.members(h.herd).map((s) => this.h.get(e.id(s))!).find((o) => o.sex === 'm' && this.ageYears(o) >= 3);
      if (!sire || !this.rng.chance(perHour)) continue;
      const bias = (h.q + sire.q) * 0.06, q = Math.max(this.quality(bias), Math.min(h.q, sire.q) && this.rng.chance(0.3) ? Math.min(h.q, sire.q) : 0);
      const mix = (a: number, b: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, (a + b) / 2 + this.rng.range(-0.08, 0.08) * (hi - lo)));
      const S = QSTATS[q]!;
      const f = this.spawn(e.map[i]!, e.x[i]! + 0.8, e.y[i]!, { q, herd: h.herd, mother: id, born: w.gameSec, coat: this.rng.chance(0.7) ? (this.rng.chance(0.5) ? h.coat : sire.coat) : this.rng.int(7),
        speed: mix(h.speed, sire.speed, S.speed[0]!, S.speed[1]! + 0.4), stamina: mix(h.stamina, sire.stamina, S.sta[0]!, S.sta[1]! + 10), intel: mix(h.intel, sire.intel, 0.1, 1), size: mix(h.size, sire.size, 0.85, 1.2) });
      if (f >= 0) { const fh = this.h.get(e.id(f))!; fh.sta = fh.stamina; w.emit('foal', { mother: id, name: fh.name, quality: QUALITY[fh.q], map: w.maps[e.map[i]!]!.def.id }); }
    }
  }

  /** Hourly: on a map with wild horses, now and then a free adult with a knack for it (and no horse yet) goes to tame one. */
  private ownPlans(): void {
    const w = this.w, e = w.e;
    const taming = (m: number) => { for (let i = 0; i < e.hi; i++) if (e.kind[i] === Kind.Agent && (m < 0 || e.map[i] === m) && (w.profileOf(i)?.mind?.task as { steps?: { do: string }[] } | undefined)?.steps?.some((s) => s.do === 'tame' || s.do === 'ride')) return true; return false; };
    const free = (i: number) => {
      if (e.kind[i] !== Kind.Agent || e.map[i] === NO_MAP || (e.flags[i]! & (EFlag.Child | EFlag.Small | EFlag.Sleeping))) return false;
      const p = w.profileOf(i);
      if (!p || p.mind?.task || w.rules.forbidden(i, 'tame')) return false;
      return !(e.hunger[i]! > 60 || e.thirst[i]! > 60 || e.tired[i]! > 80 || e.lonely[i]! > 40); // company first
    };
    const home = (i: number) => { const h = w.survival.homes.homeOf(e.id(i)); return h ? h.m : w.startMap(); };
    const wildAnywhere = this.count(-1, true) > 0, hour = w.brain.hour();
    w.maps.forEach((_, m) => {
      if (this.count(m, true)) {
        if (!this.rng.chance(0.15) || taming(m)) return; // one at a time
        let best = -1, bp = 0.45;
        for (let i = 0; i < e.hi; i++) {
          if (e.map[i] !== m || !free(i) || this.mine(i).length) continue;
          const pw = this.power(i) + this.rng.range(-0.08, 0.08);
          if (pw > bp && this.nearestWild(i, 160) >= 0) { bp = pw; best = i; }
        }
        if (best >= 0) w.tasks.start(best, 'tame a wild horse', 'myself', [{ do: 'tame' }, ...(home(best) >= 0 && home(best) !== m ? [{ do: 'ride', what: 'home' }] : [])]);
        return;
      }
      // No wild horses here (the town, imad 2026-11-26: "nobody uses horses to move"): while the roads are open, now and then one
      // free adult with a knack for it (and no horse yet) goes out to the wild in the morning, tames one and rides it home.
      // Someone whose horse was left on another map goes and fetches it.
      if (!w.travelOpen || hour < 6 || hour >= 12) return;
      for (let i = 0; i < e.hi; i++) {
        if (e.map[i] !== m || !free(i)) continue;
        const mine = this.mine(i);
        if (mine.length && !mine.some((a) => e.map[a] === m) && mine.some((a) => e.map[a] !== NO_MAP) && w.brain.mayGoWild(i) && this.rng.chance(0.3)) { w.tasks.start(i, 'fetch my horse', 'myself', [{ do: 'ride', what: 'home' }]); return; }
      }
      if (!wildAnywhere || taming(-1) || !this.rng.chance(0.25)) return;
      let best = -1, bp = 0.4;
      for (let i = 0; i < e.hi; i++) {
        if (e.map[i] !== m || !free(i) || this.mine(i).length || !w.brain.mayGoWild(i) || ageOfSlot(w, i) < 18) continue;
        const pw = this.power(i) + this.rng.range(-0.08, 0.08);
        if (pw > bp) { bp = pw; best = i; }
      }
      if (best >= 0) w.tasks.start(best, 'go to the wild, tame a horse and ride it home', 'myself', [{ do: 'tame' }, { do: 'ride', what: 'home' }]);
    });
  }

  // ------------------------------------------------------------------ saving
  save(): unknown { return { h: [...this.h], herds: [...this.herds.values()], skill: [...this.skill], nextHerd: this.nextHerd, lost: [...this.lost] }; }
  load(s: unknown): void {
    this.h.clear(); this.herds.clear(); this.skill.clear(); this.lost.clear();
    const d = s as { h?: [number, Horse][]; herds?: Herd[]; skill?: [number, number][]; nextHerd?: number; lost?: [number, LostHorse[]][] } | undefined;
    if (!d) return;
    for (const [k, v] of d.lost ?? []) if (Array.isArray(v)) this.lost.set(k, v);
    const e = this.w.e;
    for (const [id, h] of d.h ?? []) {
      const i = e.slot(id);
      if (i < 0 || !this.isHorse(i)) { if (h.owner >= 0) { this.note(h, 'gone'); this.loseIt(h.owner, h, 'gone'); } continue; }
      h.mode = h.rider >= 0 ? 'follow' : 'graze'; h.until = 0; h.fear = 0; // a call in progress is not saved
      this.h.set(id, h);
    }
    for (const hd of d.herds ?? []) { hd.until = 0; this.herds.set(hd.id, hd); }
    for (const [k, v] of d.skill ?? []) this.skill.set(k, v);
    this.nextHerd = d.nextHerd ?? this.nextHerd;
    // Riders: restore their flag; the horse's body is not in the physics world while ridden.
    for (const [id, h] of this.h) {
      if (h.rider < 0) continue;
      const a = e.slot(id), r = e.slot(h.rider);
      if (a < 0 || r < 0) { h.rider = -1; continue; }
      this.riding[r] = 1; this.riding[a] = 2;
      this.w.detachBody(a);
    }
  }
}
