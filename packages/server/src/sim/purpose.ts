import { Act, EFlag, Kind, ANIMAL_NAMES } from '@worldsim/protocol';
import { NO_MAP } from './entities.js';
import { Rng } from './rng.js';
import { ageOf } from './people.js';
import { ADULT } from './life.js';
import { CALL_MIN } from './influence.js';
import type { Step } from './tasks.js';
import type { World } from './world.js';

/**
 * Life purposes (imad 2026-11-27: "they just stand still in the camp all day, eating, drinking, resting, like zombies; add goals
 * like exploring; exploring the woods should be the dream of the top, a goal the courageous ones target; give them life purposes").
 *
 * Needs (sim/brain.ts) keep people alive and the camp's work mind (sim/colony.ts) keeps the camp stocked, but once the camp is
 * stocked nothing is left to want: 80 % of waking hours went to Rest / Wander. Here every adult has a DREAM, a life goal picked
 * from who they are (traits), with real progress counted from what they really did in the world:
 *
 *   explorer  see every corner of the wild woods (only the bravest dream of it)   progress = cells seen, the woods' cells x3
 *   hunter    become the greatest hunter                                         animals killed
 *   builder   build a camp that lasts                                            buildings put up
 *   provider  nobody here goes hungry                                            food stored or given
 *   healer    heal the wounded                                                   wounds treated, first-aid kits made
 *   leader    lead my people                                                     influence (sim/influence.ts)
 *   family    raise a family                                                     children
 *   sage      learn all the teachers know, and teach the young                   quests handed in, lessons told
 *
 * When the camp's own work leaves someone free by day, they PURSUE their dream (a task of ordinary steps, sim/tasks.ts), or a
 * small pastime (visit a friend, walk with their partner, play with their child, scout round the camp, pick herbs): people
 * look busy because they are. A dream that comes true gives influence, xp and a memory, the world hears of it, and the
 * person dreams of something new.
 *
 * Exploring (task skill `explore`): every person knows which 24 m cells of each map they have seen (marked as they move,
 * Profile.seen). An expedition goes to 2-3 cells nobody (or few) has seen, far out, not where the community's lore says people
 * died, looks around there (trees, rocks, herbs, water, animals, wild horses go into memory as places), then comes home and
 * tells what they found. With `what: 'woods'` it first takes the road to the wild map: by day only (Brain.mayGoWild), and only
 * while travel is open (the owner's lock); with the roads closed the brave scout the far side of their own map instead.
 */
export const CELL = 24;
export type DreamKind = 'explorer' | 'hunter' | 'builder' | 'provider' | 'healer' | 'leader' | 'family' | 'sage';
export interface Dream {
  kind: DreamKind;
  /** Game seconds it was chosen. */
  at: number;
  /** Progress counted from events (hunter / builder / provider / healer / sage); the others are computed. */
  n: number;
  /** Expeditions made (all / into the wild), last wild trip (game seconds). */
  trips?: number;
  wild?: number;
  lastWild?: number;
  /** Dreams that came true before this one. */
  past?: DreamKind[];
}
export const DREAM_TEXT: Record<DreamKind, string> = {
  explorer: 'to explore every corner of the wild woods',
  hunter: 'to become the greatest hunter',
  builder: 'to build a camp that will last',
  provider: 'that nobody here ever goes hungry',
  healer: 'to heal the wounded',
  leader: 'to lead my people',
  family: 'to raise a family',
  sage: 'to learn all the teachers know and teach the young',
};
/** What makes each dream come true (a number of the dream's own unit). */
export const DREAM_GOAL: Record<DreamKind, number> = { explorer: 0, hunter: 12, builder: 14, provider: 40, healer: 8, leader: 60, family: 3, sage: 10 };
/** The explorer's dream: this share of the woods seen (cells of wild maps count 3, cells of home maps 1). */
const EXPLORE_SHARE = 0.6;
/** Minimum game time between two pursuits of the same person (the rest is theirs: talks, rest, quests). */
const REST_BETWEEN = 900;

interface Ext { home: number; target: number; n: number; found: Set<string>; tried: Set<number> }

export class Purpose {
  private readonly rng: Rng;
  /** Next game second each person may start a pursuit (entity id). */
  private readonly next = new Map<number, number>();
  /** Expeditions under way (entity id): where from, where to, new cells, what was found, cells that could not be reached. */
  private readonly ext = new Map<number, Ext>();
  private nextHour = 0;
  /** People on a pursuit now (entity id). */
  private readonly going = new Set<number>();
  stats = { pursuits: 0, pastimes: 0, trips: 0, wildTrips: 0, dreams: 0 };

  constructor(private readonly w: World) {
    this.rng = new Rng(w.seed + ':purpose'); // own dice: purposes never shift the rest of the world's
    w.listeners.push((ev) => {
      const d = ev.data, id = Number(ev.kind === 'talk' ? d.a : d.id ?? -1);
      if (!(id >= 0)) return;
      if (ev.kind === 'task' && this.going.has(id)) { // a pursuit ended: after a failure, that dream waits a few hours
        this.going.delete(id);
        if (!d.ok) this.next.set(id, w.gameSec + 3 * 3600);
        return;
      }
      const dr = w.profiles.get(id)?.dream;
      if (!dr) return;
      switch (ev.kind) {
        case 'hunt': if (dr.kind === 'hunter') dr.n++; break;
        case 'build': if (dr.kind === 'builder') dr.n++; break;
        case 'store': if (dr.kind === 'provider' && (d.what === undefined || d.what === 'food' || d.item === 'food')) dr.n += Math.max(1, Number(d.n ?? 1)); break;
        case 'give': if (dr.kind === 'provider' && (d.item === 'food' || d.item === undefined)) dr.n++; break;
        case 'heal': if (dr.kind === 'healer' && Number(d.who) !== id) dr.n++; break;
        case 'craft': if (dr.kind === 'healer' && d.what === 'medkit') dr.n++; break;
        case 'questDone': if (dr.kind === 'sage') dr.n++; break;
        case 'talk': if (dr.kind === 'sage' && this.isChild(Number(d.b ?? -1))) dr.n += 0.25; break;
      }
    });
  }

  private isChild(id: number): boolean {
    const p = this.w.profiles.get(id);
    return !!p && p.died === undefined && ageOf(p, this.w.gameSec, this.w.yearSec) < 14;
  }

  // ------------------------------------------------------------------ cells seen
  private cells(m: number): { cw: number; n: number } {
    const d = this.w.maps[m]!.def, cw = Math.ceil(d.w / CELL);
    return { cw, n: cw * Math.ceil(d.h / CELL) };
  }
  private seenOf(id: number, m: number, make = false): number[] | null {
    const p = this.w.profiles.get(id);
    if (!p) return null;
    const k = this.w.maps[m]!.def.id;
    if (!p.seen?.[k]) { if (!make) return null; (p.seen ??= {})[k] = []; }
    return p.seen![k]!;
  }
  hasSeen(id: number, m: number, c: number): boolean { const s = this.seenOf(id, m); return !!s && ((s[c >> 5] ?? 0) & (1 << (c & 31))) !== 0; }
  private mark(id: number, m: number, c: number): boolean {
    const s = this.seenOf(id, m, true)!;
    const k = c >> 5, b = 1 << (c & 31);
    while (s.length <= k) s.push(0);
    if (s[k]! & b) return false;
    s[k] = s[k]! | b;
    return true;
  }
  /** Cells of map m person id has seen. */
  seenCount(id: number, m: number): number {
    const s = this.seenOf(id, m);
    if (!s) return 0;
    let n = 0;
    for (let v of s) { v = v >>> 0; while (v) { v &= v - 1; n++; } }
    return n;
  }
  /** The explorer's progress 0..1: the wild maps' cells count 3, the others 1, out of EXPLORE_SHARE of all. */
  exploreShare(id: number): number {
    const w = this.w;
    let have = 0, all = 0;
    for (let m = 0; m < w.maps.length; m++) { const k = w.wild(m) ? 3 : 1; have += this.seenCount(id, m) * k; all += this.cells(m).n * k; }
    return all ? Math.min(1, have / (all * EXPLORE_SHARE)) : 0;
  }
  /** Share of map m person id has seen (0..1). */
  mapShare(id: number, m: number): number { return this.seenCount(id, m) / this.cells(m).n; }

  // ------------------------------------------------------------------ dreams
  /** Progress of person id's dream, 0..1. */
  progress(id: number): number {
    const w = this.w, p = w.profiles.get(id), d = p?.dream;
    if (!p || !d) return 0;
    switch (d.kind) {
      case 'explorer': return this.exploreShare(id);
      case 'leader': { const c = w.clans.clanOf(id); return c && c.leader === id ? 1 : Math.min(1, w.influence.of(id) / DREAM_GOAL.leader); }
      case 'family': { let k = 0; for (const q of w.profiles.values()) if (q.parents.includes(id)) k++; return Math.min(1, k / DREAM_GOAL.family); }
      default: return Math.min(1, d.n / DREAM_GOAL[d.kind]);
    }
  }
  /** Pick a dream for person i from who they are (the bravest may dream of the woods). */
  private choose(i: number): DreamKind {
    const w = this.w, p = w.profileOf(i)!, t = p.traits, past = p.dream?.past ?? [];
    const age = ageOf(p, w.gameSec, w.yearSec);
    const W: [DreamKind, number][] = [
      ['explorer', t.courage >= 0.6 ? (t.courage - 0.45) * 3 + t.speed * 0.8 + t.intelligence * 0.3 : 0],
      ['hunter', t.speed + t.courage * 0.8 + t.strength * 0.5 - 0.6],
      ['builder', t.strength * 1.2 + t.intelligence * 0.6 - 0.5],
      ['provider', t.empathy * 1.2 + t.intelligence * 0.3 - 0.4],
      ['healer', t.empathy + t.intelligence * 0.9 - 0.7],
      ['leader', t.courage * 0.7 + t.intelligence * 0.7 + t.empathy * 0.4 - 0.75],
      ['family', p.partner >= 0 || age < 40 ? t.empathy * 0.8 + 0.1 : 0],
      ['sage', t.intelligence * 1.3 - 0.45],
    ];
    let sum = 0;
    for (const x of W) { x[1] = past.includes(x[0]) ? 0 : Math.max(0, x[1]) ** 2; sum += x[1]; }
    if (sum <= 0) return 'provider';
    let r = this.rng.next() * sum;
    for (const [k, v] of W) { r -= v; if (r <= 0) return k; }
    return W[0]![0];
  }
  /** One line for the AI prompts. */
  promptText(id: number): string {
    const d = this.w.profiles.get(id)?.dream;
    if (!d) return '';
    const pc = Math.round(this.progress(id) * 100);
    const trips = d.trips ? ` You have been on ${d.trips} expedition${d.trips > 1 ? 's' : ''}${d.wild ? ` (${d.wild} into the wild)` : ''}.` : '';
    const past = d.past?.length ? ` Dreams that came true: ${d.past.map((k) => DREAM_TEXT[k]).join('; ')}.` : '';
    return `Your dream in life: ${DREAM_TEXT[d.kind]} (${pc}% there).${trips}${past}`;
  }
  /** For the panel / the TV. */
  info(id: number): { kind: DreamKind; text: string; pct: number; trips: number; wild: number; past: DreamKind[]; seen: { map: string; pct: number }[] } | null {
    const w = this.w, d = w.profiles.get(id)?.dream;
    if (!d) return null;
    return { kind: d.kind, text: DREAM_TEXT[d.kind], pct: Math.round(this.progress(id) * 100), trips: d.trips ?? 0, wild: d.wild ?? 0, past: d.past ?? [],
      seen: w.maps.map((mp, m) => ({ map: mp.def.name, pct: Math.round(this.mapShare(id, m) * 100) })) };
  }

  // ------------------------------------------------------------------ every 20 ticks
  update(): void {
    const w = this.w, e = w.e;
    for (let i = 0; i < e.hi; i++) {
      if ((e.kind[i] !== Kind.Agent && e.kind[i] !== Kind.Player) || e.map[i] === NO_MAP || e.flags[i]! & EFlag.Sleeping) continue;
      const m = e.map[i]!, { cw } = this.cells(m);
      const c = Math.floor(e.y[i]! / CELL) * cw + Math.floor(e.x[i]! / CELL), id = e.id(i);
      if (c < 0 || !w.profiles.has(id)) continue;
      if (this.mark(id, m, c)) { const x = this.ext.get(id); if (x) x.n++; }
    }
    if (w.gameSec >= this.nextHour) { this.nextHour = w.gameSec + 3600; this.hourly(); }
  }
  private hourly(): void {
    const w = this.w, e = w.e;
    for (let i = 0; i < e.hi; i++) {
      if (e.kind[i] !== Kind.Agent) continue;
      const p = w.profileOf(i), id = e.id(i);
      if (!p || p.player || ageOf(p, w.gameSec, w.yearSec) < ADULT) continue;
      if (!p.dream) {
        p.dream = { kind: this.choose(i), at: w.gameSec, n: 0, past: [] };
        w.memory.add(id, 'dream', 6, `My dream: ${DREAM_TEXT[p.dream.kind]}.`);
        w.emit('dream', { id, kind: p.dream.kind, text: DREAM_TEXT[p.dream.kind], new: true });
        continue;
      }
      if (this.progress(id) >= 1) { // it came true
        const d = p.dream, past = [...(d.past ?? []), d.kind];
        this.stats.dreams++;
        w.influence.add(id, 12, `my dream came true: ${DREAM_TEXT[d.kind]}`);
        p.xp = (p.xp ?? 0) + 100;
        p.mind ??= { notes: [], summary: '', mood: 'calm', rel: {}, lastPlan: 0 };
        p.mind.mood = 'proud';
        w.memory.add(id, 'dream', 10, `My dream came true: ${DREAM_TEXT[d.kind]}.`);
        w.emit('dream', { id, kind: d.kind, text: DREAM_TEXT[d.kind], done: true });
        p.dream = { kind: 'provider', at: w.gameSec, n: 0, past, trips: d.trips, wild: d.wild, lastWild: d.lastWild };
        p.dream.kind = this.choose(i);
        if (past.length >= 8) p.dream.past = [];
        w.memory.add(id, 'dream', 6, `My new dream: ${DREAM_TEXT[p.dream.kind]}.`);
      }
    }
  }

  // ------------------------------------------------------------------ pursuits
  /**
   * The free people of map m after the camp's work was handed out (sim/survival.ts): by day, each pursues their dream or a
   * pastime, now and then (the more driven, the more often). Returns how many started something.
   */
  pass(m: number, free: number[], hour: number): number {
    const w = this.w, e = w.e;
    if (hour < 7 || hour >= 19 || w.ai.purpose === false) return 0;
    let n = 0;
    for (const i of free) {
      const p = w.profileOf(i), id = e.id(i);
      if (!p?.dream || p.player || p.mind?.task || w.family.lyingInHome(i) || w.family.dependent(i)) continue;
      if ((this.next.get(id) ?? 0) > w.gameSec) continue;
      const t = p.traits, drive = 0.6 + 0.35 * ((t.courage + t.intelligence + t.strength) / 3);
      if (this.rng.next() > drive) { this.next.set(id, w.gameSec + 600); continue; }
      const plan = this.rng.next() < 0.75 ? this.pursue(i, hour) ?? this.pastime(i) : this.pastime(i) ?? this.pursue(i, hour);
      if (!plan) { this.next.set(id, w.gameSec + 900); continue; }
      if (!w.tasks.start(i, plan.text, 'myself', plan.steps)) continue;
      (p.mind!.task as { goal?: string }).goal = plan.dream ? `dream:${p.dream.kind}` : 'pastime';
      this.next.set(id, w.gameSec + REST_BETWEEN);
      this.going.add(id);
      if (plan.dream) this.stats.pursuits++; else this.stats.pastimes++;
      n++;
    }
    return n + this.kids(m);
  }

  /**
   * Children (3-13) play too: with another child, at a parent's heels while they work, or listening to an adult's stories
   * (a sage's dream counts the lessons). They stay near home anyway (Brain.leashed).
   */
  private kids(m: number): number {
    const w = this.w, e = w.e;
    let n = 0;
    for (let i = 0; i < e.hi; i++) {
      if (e.kind[i] !== Kind.Agent || e.map[i] !== m || !(e.flags[i]! & EFlag.Child) || e.flags[i]! & EFlag.Sleeping || w.family.dependent(i)) continue;
      const p = w.profileOf(i), id = e.id(i);
      if (!p || p.mind?.task || w.brain.orderOf(i).kind || e.hunger[i]! > 55 || e.thirst[i]! > 55 || e.tired[i]! > 70) continue;
      if ((this.next.get(id) ?? 0) > w.gameSec) continue;
      this.next.set(id, w.gameSec + 900);
      if (this.rng.next() > 0.6) continue;
      const near = (j: number, r: number) => Math.hypot(e.x[j]! - e.x[i]!, e.y[j]! - e.y[i]!) < r;
      let kid = -1, parent = -1, elder = -1;
      for (let j = 0; j < e.hi; j++) {
        if (j === i || !this.awakeOn(j, m) || e.kind[j] !== Kind.Agent || w.family.dependent(j) || !near(j, 40)) continue;
        if (e.flags[j]! & EFlag.Child) { if (kid < 0 || this.rng.chance(0.4)) kid = j; }
        else if (p.parents.includes(e.id(j))) parent = j;
        else if (near(j, 25) && (elder < 0 || w.profileOf(j)?.dream?.kind === 'sage')) elder = j;
      }
      const name = (j: number) => w.profileOf(j)?.name ?? 'them';
      const r = this.rng.next();
      const plan = kid >= 0 && r < 0.55 ? { text: `play with ${name(kid)}`, steps: [{ do: 'talk', who: e.id(kid), times: 2 }] as Step[] }
        : parent >= 0 && r < 0.85 ? { text: `help ${name(parent)}`, steps: [{ do: 'follow', who: e.id(parent), minutes: 20 }] as Step[] }
          : elder >= 0 ? { text: `listen to ${name(elder)}'s stories`, steps: [{ do: 'talk', who: e.id(elder), times: 2 }] as Step[] }
            : kid >= 0 ? { text: `play with ${name(kid)}`, steps: [{ do: 'talk', who: e.id(kid), times: 2 }] as Step[] } : null;
      if (!plan || !w.tasks.start(i, plan.text, 'myself', plan.steps)) continue;
      (p.mind!.task as { goal?: string }).goal = 'play';
      this.stats.pastimes++;
      n++;
    }
    return n;
  }

  /** A step towards the dream, or null when nothing can be done for it now. */
  pursue(i: number, hour: number): { text: string; steps: Step[]; dream: true } | null {
    const w = this.w, e = w.e, p = w.profileOf(i)!, d = p.dream!, id = e.id(i), m = e.map[i]!, sv = w.survival;
    const out = (text: string, steps: Step[]) => ({ text, steps, dream: true as const });
    switch (d.kind) {
      case 'explorer': {
        const wild = this.wildMap(i);
        if (wild >= 0 && hour >= 6 && hour < 12 && (d.lastWild ?? -1e9) < w.gameSec - 20 * 3600 && w.brain.mayGoWild(i) && !w.wild(m))
          return out(`explore the ${w.maps[wild]!.def.name}`, [{ do: 'explore', what: 'woods', times: 3 }]);
        if (w.wild(m)) return out(`explore the ${w.maps[m]!.def.name}`, [{ do: 'explore', times: 2 }]);
        return this.mapShare(id, m) < 0.95 ? out(`scout the far side of ${w.maps[m]!.def.name}`, [{ do: 'explore', times: 2 }]) : null;
      }
      case 'hunter': {
        // Game is scarce in town and huts need leather: while a household still needs its hut, the camp's own plans hunt first.
        if (sv.homes.needed(m) > 0 && w.animals.count(m) < 8) return null;
        const armed = sv.weapon(i)[1] > 0;
        const steps: Step[] = [{ do: 'hunt', what: armed && p.traits.courage > 0.55 && this.rng.chance(0.4) ? 'boar' : '', times: 1 }];
        if (sv.campOf(m)) steps.push({ do: 'store', what: 'food' });
        return out('go hunting (to become a great hunter)', steps);
      }
      case 'builder': {
        const [, left] = sv.campDefence(m);
        for (const what of left > 0 && sv.homes.needed(m) <= 0 ? ['palisade', 'lamp', 'bed'] : ['lamp', 'bed']) { // the wall only once every household has its hut (as sim/colony.ts)
          if (what === 'bed' && !sv.bedWanted(i)) continue;
          if (what === 'lamp' && sv.campOf(m) && sv.lampNear(m, sv.campOf(m)!.x, sv.campOf(m)!.y, 14)) continue;
          if (what === 'palisade' && !sv.campOf(m)) continue;
          const st = w.colony.planTo(i, 'build', what);
          if (typeof st !== 'string' && st.length) return out(what === 'palisade' ? 'build up the camp wall' : `put a ${what} up`, st);
        }
        return sv.campOf(m) ? out('cut wood for the camp\'s next buildings', [{ do: 'gather', what: 'wood', times: 4 }, { do: 'store', what: 'wood' }]) : null;
      }
      case 'provider': {
        const hungry = this.hungryNear(i);
        if (hungry >= 0 && e.carry[i]! > 0) return out(`bring food to ${w.profileOf(hungry)?.name ?? 'someone'}`, [{ do: 'bring', who: e.id(hungry) }]);
        const fields = [...sv.farms.keys()].filter((k) => k.startsWith(m + ':')).length;
        if (sv.campOf(m) && fields < 4 && this.rng.chance(0.3)) return out('plant a field so there is always food', [{ do: 'farm' }]);
        return out('gather food for everyone', sv.campOf(m) ? [{ do: 'collect', what: 'food', times: 3 }, { do: 'store', what: 'food' }] : [{ do: 'collect', what: 'food', times: 3 }]);
      }
      case 'healer': {
        for (let j = 0; j < e.hi; j++) {
          if ((e.kind[j] !== Kind.Agent && e.kind[j] !== Kind.Player) || j === i || e.map[j] !== m || e.hp[j]! >= w.sc.agents.hp * 0.75) continue;
          return out(`treat ${w.profileOf(j)?.name ?? 'the wounded'}`, [{ do: 'heal', who: e.id(j) }]);
        }
        const v = sv.inv(i);
        if ((v.medkit ?? 0) < 2) {
          const st = w.colony.planTo(i, 'craft', 'medkit');
          if (typeof st !== 'string' && st.length) return out('make a first-aid kit', st);
          if (sv.T.herbs >= 0) return out('pick herbs for medicine', [{ do: 'gather', what: 'herb', times: 3 }]);
        }
        return null;
      }
      case 'leader': {
        const c = w.clans.clanOf(id);
        if (c && c.leader !== id && w.influence.of(id) >= CALL_MIN + 5 && this.rng.chance(0.15)) return out('call a vote to lead the clan', [{ do: 'clan', what: 'call' }]);
        const j = this.leastKnown(i);
        return j >= 0 ? out(`win ${w.profileOf(j)?.name ?? 'them'} over`, [{ do: 'talk', who: e.id(j), times: 2 }]) : null;
      }
      case 'family': {
        const kid = this.childOf(i);
        if (kid >= 0) return out(`spend time with ${w.profileOf(kid)?.name ?? 'my child'}`, [{ do: 'talk', who: e.id(kid), times: 2 }, { do: 'follow', who: e.id(kid), minutes: 20 }]);
        const pj = p.partner >= 0 ? e.slot(p.partner) : -1;
        if (pj >= 0 && e.map[pj] === m && !(e.flags[pj]! & EFlag.Sleeping)) return out(`spend time with ${w.profileOf(pj)?.name ?? 'my partner'}`, [{ do: 'talk', who: p.partner, times: 2 }]);
        return null; // single: the camp's 'family' goal courts (sim/colony.ts)
      }
      case 'sage': {
        if (w.quests.wants(i)) return null; // the quests' own pass sends them to the teachers
        const kid = this.anyChild(i);
        if (kid >= 0) return out(`teach ${w.profileOf(kid)?.name ?? 'a child'} what I know`, [{ do: 'talk', who: e.id(kid), times: 3 }]);
        return null;
      }
    }
  }

  /** A short pastime (a friend, the partner, a child, a look round the camp, herbs). */
  pastime(i: number): { text: string; steps: Step[]; dream?: false } | null {
    const w = this.w, e = w.e, p = w.profileOf(i)!, t = p.traits, m = e.map[i]!;
    const opts: [number, () => { text: string; steps: Step[] } | null][] = [
      [0.4 + t.empathy, () => { const j = this.friend(i); return j >= 0 ? { text: `visit ${w.profileOf(j)?.name ?? 'a friend'}`, steps: [{ do: 'talk', who: e.id(j), times: 2 }] } : null; }],
      [0.6, () => { const pj = p.partner >= 0 ? e.slot(p.partner) : -1; return pj >= 0 && e.map[pj] === m && !(e.flags[pj]! & EFlag.Sleeping) ? { text: `take a walk with ${w.profileOf(pj)?.name ?? 'my partner'}`, steps: [{ do: 'talk', who: p.partner, times: 1 }, { do: 'follow', who: p.partner, minutes: 25 }] } : null; }],
      [0.5 + t.empathy * 0.5, () => { const k = this.childOf(i); return k >= 0 ? { text: `play with ${w.profileOf(k)?.name ?? 'my child'}`, steps: [{ do: 'talk', who: e.id(k), times: 2 }] } : null; }],
      [t.courage * 1.2, () => (this.mapShare(e.id(i), m) < 0.98 ? { text: 'look round the camp', steps: [{ do: 'explore', what: 'near', times: 1 }] } : null)],
      [w.survival.T.herbs >= 0 ? 0.2 + t.empathy * 0.4 : 0, () => ({ text: 'pick herbs', steps: [{ do: 'gather', what: 'herb', times: 2 }] })],
      [0.25 + t.strength * 0.4, () => (w.survival.campOf(m) ? { text: 'cut some wood', steps: [{ do: 'gather', what: 'wood', times: 2 }, { do: 'store', what: 'wood' }] } : null)],
    ];
    for (let tries = 0; tries < 3; tries++) {
      let sum = 0;
      for (const o of opts) sum += o[0];
      if (sum <= 0) return null;
      let r = this.rng.next() * sum, k = 0;
      for (; k < opts.length - 1; k++) { r -= opts[k]![0]; if (r <= 0) break; }
      const got = opts[k]![1]();
      if (got) return got;
      opts[k]![0] = 0;
    }
    return null;
  }

  // ------------------------------------------------------------------ helpers
  /** A wild map person i can take the road to (-1: travel closed, none, or a child). */
  wildMap(i: number): number {
    const w = this.w, here = w.e.map[i]!;
    if (!w.travelOpen) return -1;
    let best = -1, bd = Infinity;
    for (let m = 0; m < w.maps.length; m++) {
      if (m === here || !w.wild(m)) continue;
      const r = w.routeMaps(here, m);
      if (!r || !r.length) continue;
      const d = r.reduce((a, pi) => a + w.portals[pi]!.travel, 0);
      if (d < bd) { bd = d; best = m; }
    }
    return best;
  }
  private awakeOn(j: number, m: number): boolean { const e = this.w.e; return e.map[j] === m && !(e.flags[j]! & EFlag.Sleeping) && (e.kind[j] === Kind.Agent || e.kind[j] === Kind.Player); }
  /** The awake person on my map I like most (not my partner: that is another pastime). */
  private friend(i: number): number {
    const w = this.w, e = w.e, p = w.profileOf(i)!, m = e.map[i]!;
    let best = -1, bv = -Infinity;
    for (let j = 0; j < e.hi; j++) {
      if (j === i || !this.awakeOn(j, m) || e.kind[j] !== Kind.Agent) continue;
      const jd = e.id(j);
      if (jd === p.partner || w.family.dependent(j) || w.lore.distrusts(i, jd)) continue;
      const d = Math.hypot(e.x[j]! - e.x[i]!, e.y[j]! - e.y[i]!);
      if (d > 120) continue;
      const v = (p.mind?.rel['#' + jd] ?? 0) + (p.bonds?.['#' + jd] ?? 0) * 0.3 - d * 0.01 + this.rng.next() * 0.8;
      if (v > bv) { bv = v; best = j; }
    }
    return best;
  }
  /** The adult on my map I know least (a would-be leader wins people over). */
  private leastKnown(i: number): number {
    const w = this.w, e = w.e, p = w.profileOf(i)!, m = e.map[i]!;
    let best = -1, bv = Infinity;
    for (let j = 0; j < e.hi; j++) {
      if (j === i || !this.awakeOn(j, m) || e.kind[j] !== Kind.Agent) continue;
      const q = w.profileOf(j), jd = e.id(j);
      if (!q || ageOf(q, w.gameSec, w.yearSec) < ADULT || w.lore.distrusts(i, jd)) continue;
      const v = (p.bonds?.['#' + jd] ?? 0) + (p.mind?.rel['#' + jd] ?? 0) * 2 + this.rng.next() * 1.5;
      if (v < bv) { bv = v; best = j; }
    }
    return best;
  }
  /** One of my children (3-13) awake on my map. */
  private childOf(i: number): number {
    const w = this.w, e = w.e, id = e.id(i), m = e.map[i]!;
    for (let j = 0; j < e.hi; j++) {
      if (j === i || !this.awakeOn(j, m) || e.kind[j] !== Kind.Agent || w.family.dependent(j)) continue;
      const q = w.profileOf(j);
      if (q?.parents.includes(id) && ageOf(q, w.gameSec, w.yearSec) < 14) return j;
    }
    return -1;
  }
  /** Any child (3-13) awake on my map within 80 m. */
  private anyChild(i: number): number {
    const w = this.w, e = w.e, m = e.map[i]!;
    for (let j = 0; j < e.hi; j++) {
      if (j === i || !this.awakeOn(j, m) || e.kind[j] !== Kind.Agent || w.family.dependent(j) || !(e.flags[j]! & EFlag.Child)) continue;
      if (Math.hypot(e.x[j]! - e.x[i]!, e.y[j]! - e.y[i]!) < 80) return j;
    }
    return -1;
  }
  /** Someone hungry with nothing to eat on my map (provider). */
  private hungryNear(i: number): number {
    const e = this.w.e, m = e.map[i]!;
    for (let j = 0; j < e.hi; j++) if (j !== i && this.awakeOn(j, m) && e.kind[j] === Kind.Agent && e.hunger[j]! > 55 && e.carry[j]! <= 0) return j;
    return -1;
  }

  // ------------------------------------------------------------------ the explore step (sim/tasks.ts)
  /** One look at an expedition: true = home again (or done), a string = why it failed, false = still out. */
  exploreStep(i: number, s: Step, first: boolean): boolean | string {
    const w = this.w, e = w.e, b = w.brain, id = e.id(i);
    let x = this.ext.get(id);
    if (first || !x) {
      const woods = /wood|wild|forest|for[eê]t|bosque|غابة/i.test(s.what ?? '');
      const near = s.what === 'near';
      let target = e.map[i]!;
      if (woods) {
        const wm = this.wildMap(i);
        if (wm < 0) return w.travelOpen ? 'I found no road to the wild' : 'the roads out are closed';
        target = wm;
      }
      x = { home: e.map[i]!, target, n: 0, found: new Set(), tried: new Set() };
      this.ext.set(id, x);
      s.phase = 1; s.times = Math.max(1, Math.min(4, s.times ?? 2)); s.gx = undefined; s.gy = undefined; s.fails = 0; s.n1 = near ? 1 : 0;
      if (woods && w.wild(target) && !w.wild(e.map[i]!) && !b.mayGoWild(i)) { this.ext.delete(id); return 'it was too late in the day to set out for the wild'; }
    }
    const lateInWild = w.wild(e.map[i]!) && b.hour() >= 15;
    switch (s.phase) {
      case 1: // the road to the place to explore
        if (e.map[i] !== x.target) {
          if (w.wild(x.target) && !w.wild(e.map[i]!) && !b.mayGoWild(i)) { this.ext.delete(id); return 'it was too late in the day to set out for the wild'; }
          if (!w.tasks.walkToMap(i, x.target, s)) { this.ext.delete(id); return 'I found no road there'; }
          return false;
        }
        s.phase = 2; s.gx = undefined; s.gy = undefined;
        return false;
      case 2: { // to a place nobody has seen much of
        if (lateInWild || e.map[i] !== x.target) { s.phase = 4; s.gx = undefined; return false; }
        if (s.gx === undefined) {
          const c = this.pickCell(i, x, s.n1 === 1);
          if (!c) { s.phase = 4; return false; }
          s.gx = c.x; s.gy = c.y; s.minutes = c.c;
          b.job(i, c.x, c.y, c.x + 1, c.y, Act.Go);
          return false;
        }
        if (Math.hypot(s.gx - e.x[i]!, s.gy! - e.y[i]!) <= 2.2) { s.phase = 3; s.wait = w.gameSec + 120 + this.rng.next() * 180; this.survey(i, x); return false; }
        if (b.orderOf(i).kind !== 'job') { // no way there: try another place (seen from afar: it counts as known)
          x.tried.add(s.minutes ?? -1);
          if ((s.minutes ?? -1) >= 0) this.mark(id, e.map[i]!, s.minutes!);
          s.gx = undefined;
          if ((s.fails = (s.fails ?? 0) + 1) > 4) s.phase = 4;
        }
        return false;
      }
      case 3: // looking round
        if (w.gameSec < (s.wait ?? 0) && !lateInWild) { e.angle[i] += 0.02; return false; }
        s.times = (s.times ?? 1) - 1;
        s.gx = undefined;
        s.phase = s.times > 0 && !lateInWild ? 2 : 4;
        return false;
      case 4: { // home again
        const hm = this.homeMap(i);
        if (e.map[i] !== hm) { if (!w.tasks.walkToMap(i, hm, s)) { return this.finish(i, x, false); } return false; }
        const sv = w.survival, h = sv.homes.homeOf(id), c = h && h.m === hm ? sv.homes.middle(h) : sv.campOf(hm);
        if (!c || Math.hypot(c.x - e.x[i]!, c.y - e.y[i]!) < 12 || s.n1 === 1) return this.finish(i, x, true);
        if (b.orderOf(i).kind !== 'job' || s.gx !== c.x || s.gy !== c.y + 5) {
          if (s.gx === c.x && s.gy === c.y + 5) return this.finish(i, x, true); // the way home is blocked: the tale is told from here
          b.job(i, c.x, c.y + 5, c.x, c.y, Act.Go); s.gx = c.x; s.gy = c.y + 5;
        }
        return false;
      }
    }
    return false;
  }
  private homeMap(i: number): number {
    const w = this.w, h = w.survival.homes.homeOf(w.e.id(i));
    if (h) return h.m;
    const x = this.ext.get(w.e.id(i));
    return x ? x.home : w.e.map[i]!;
  }
  /** The next place to look at: a cell I have not seen, far but not too far, few others know, not where people died. */
  private pickCell(i: number, x: Ext, near: boolean): { x: number; y: number; c: number } | null {
    const w = this.w, e = w.e, id = e.id(i), m = e.map[i]!, { cw, n } = this.cells(m);
    const know: number[] = new Array(n).fill(0);
    let people = 0;
    for (const [pid, q] of w.profiles) {
      if (pid === id || q.died !== undefined || !q.seen?.[w.maps[m]!.def.id]) continue;
      people++;
      for (let c = 0; c < n; c++) if (this.hasSeen(pid, m, c)) know[c]++;
    }
    const camp = w.survival.campOf(m), ox = near && camp ? camp.x : e.x[i]!, oy = near && camp ? camp.y : e.y[i]!;
    const want = near ? 45 : w.wild(m) ? 60 : 80;
    let best = -1, bv = -Infinity;
    for (let c = 0; c < n; c++) {
      if (x.tried.has(c) || this.hasSeen(id, m, c)) continue;
      const cx = (c % cw + 0.5) * CELL, cy = (((c / cw) | 0) + 0.5) * CELL;
      const d = Math.hypot(cx - ox, cy - oy);
      if (near && d > 70) continue;
      const v = -Math.abs(d - want) * 0.012 + (people ? (1 - know[c]! / people) * 0.6 : 0.3) - w.lore.placeFear(i, m, cx, cy) * 0.25 + this.rng.next() * 0.4;
      if (v > bv) { bv = v; best = c; }
    }
    if (best < 0) return null;
    const cx = (best % cw + 0.5) * CELL, cy = (((best / cw) | 0) + 0.5) * CELL;
    const sp = w.freeSpot(m, cx, cy, 24, this.rng);
    if (!sp || Math.floor(sp.x / CELL) + Math.floor(sp.y / CELL) * cw !== best) { x.tried.add(best); this.mark(id, m, best); return this.pickCell(i, x, near); } // no ground to stand on there (water, the ring of trees): known
    return { x: sp.x, y: sp.y, c: best };
  }
  /** What is around here: places for the memory, words for the tale. */
  private survey(i: number, x: Ext): void {
    const w = this.w, e = w.e, id = e.id(i), m = e.map[i]!, tm = w.maps[m]!.tiles, T = w.survival.T;
    const px = Math.floor(e.x[i]!), py = Math.floor(e.y[i]!), R = 14;
    let trees = 0, rocks = 0, herbs = 0, water = 0, wx = 0, wy = 0, rx = 0, ry = 0, tx = 0, ty = 0;
    for (let y = Math.max(0, py - R); y <= Math.min(tm.h - 1, py + R); y++) for (let xx = Math.max(0, px - R); xx <= Math.min(tm.w - 1, px + R); xx++) {
      const t = tm.tiles[y * tm.w + xx]!;
      if (t === T.tree) { trees++; tx = xx; ty = y; } else if (t === T.rock) { rocks++; rx = xx; ry = y; } else if (t === T.herbs) herbs++; else if (t === T.water) { water++; wx = xx; wy = y; }
    }
    if (trees >= 12) { x.found.add('plenty of trees'); w.memory.place(id, 'wood', m, tx + 0.5, ty + 0.5); }
    if (rocks >= 2) { x.found.add('rocks to mine'); w.memory.place(id, 'stone', m, rx + 0.5, ry + 0.5); }
    if (herbs >= 2) x.found.add('herbs');
    if (water >= 4) { x.found.add('water'); w.memory.place(id, 'water', m, wx + 0.5, wy + 0.5); }
    let horses = 0;
    for (let j = 0; j < e.hi; j++) {
      if (e.kind[j] !== Kind.Animal || e.map[j] !== m || Math.hypot(e.x[j]! - e.x[i]!, e.y[j]! - e.y[i]!) > 35) continue;
      const hh = w.horses.of(j);
      if (hh) { if (hh.owner < 0) horses++; continue; }
      const k = ANIMAL_NAMES[e.sub[j]!] ?? '';
      if (k) { x.found.add(k === 'wolf' || k === 'bear' ? `${k}s (danger)` : `${k}s`); if (k !== 'wolf' && k !== 'bear') w.memory.place(id, 'hunt', m, e.x[j]!, e.y[j]!); }
    }
    if (horses) x.found.add('wild horses');
  }
  private where(m: number, xx: number, yy: number): string {
    const d = this.w.maps[m]!.def, dx = xx - d.w / 2, dy = yy - d.h / 2;
    if (this.w.wild(m)) return `the ${d.name}`;
    const ns = dy < -d.h * 0.15 ? 'north' : dy > d.h * 0.15 ? 'south' : '', ew = dx > d.w * 0.15 ? 'east' : dx < -d.w * 0.15 ? 'west' : '';
    return ns || ew ? `the ${ns}${ns && ew ? '-' : ''}${ew} of ${d.name}` : `the middle of ${d.name}`;
  }
  private finish(i: number, x: Ext, home: boolean): boolean | string {
    const w = this.w, e = w.e, id = e.id(i), p = w.profileOf(i)!, wild = w.wild(x.target);
    this.ext.delete(id);
    if (!x.n && !x.found.size) return home ? 'there was nothing new to see' : 'I could not get home';
    const d = p.dream;
    if (d) { d.trips = (d.trips ?? 0) + 1; if (wild) { d.wild = (d.wild ?? 0) + 1; d.lastWild = w.gameSec; } }
    this.stats.trips++; if (wild) this.stats.wildTrips++;
    const place = this.where(x.target, e.x[i]!, e.y[i]!), list = [...x.found];
    const tale = list.length ? `I explored ${place}: ${list.slice(0, 5).join(', ')}.` : `I explored ${place}: nothing much out there.`;
    w.influence.add(id, wild ? 3 : x.n >= 3 ? 0.8 : 0.3, wild ? `explored ${place}` : `scouted ${place}`);
    w.memory.add(id, 'explore', wild ? 8 : 4, tale);
    w.emit('explore', { id, map: w.maps[x.target]!.def.id, name: w.maps[x.target]!.def.name, wild, cells: x.n, found: list });
    if (x.n >= 2 || wild) w.tasks.onSay(i, wild ? `Back from ${place}! ${list.length ? 'Out there: ' + list.slice(0, 4).join(', ') + '.' : 'Quiet out there.'}` : tale);
    return true;
  }
}
