/**
 * Milestone 7: the life cycle. Once per game hour: people age, two adults who have talked a lot may become partners,
 * a couple living well may have a baby (traits from both parents, `inherit`), children grow up, the old die.
 * Age runs on its own clock: `life.yearDays` game days per year (1 by default), so generations are visible.
 * Every chance uses the world's seeded RNG: same seed, same lives.
 */
import { EFlag, Kind } from '@worldsim/protocol';
import { NO_MAP } from './entities.js';
import { ageOf, inherit } from './people.js';
import type { World, WorldEvent } from './world.js';

const HOUR = 3600;
export const ADULT = 16;
/** Talks before two people may become partners. */
const BOND_TALKS = 4;
/** Per year: chance a happy couple conceives; how long a pregnancy lasts (years). */
const CONCEIVE_PER_YEAR = 0.9;
const GESTATION_YEARS = 0.75;

export class Life {
  private lastHour = -1;

  constructor(private w: World) {
    w.listeners.push((ev) => this.onEvent(ev));
  }

  /** Game seconds per year of age. */
  get yearSec(): number { return this.w.brain.life.yearDays * 86400; }

  private onEvent(ev: WorldEvent): void {
    const w = this.w, d = ev.data as Record<string, number>;
    if (ev.kind === 'talk') {
      const a = w.profiles.get(d.a!), b = w.profiles.get(d.b!);
      if (!a || !b) return;
      a.bonds ??= {}; b.bonds ??= {};
      a.bonds['#' + d.b] = (a.bonds['#' + d.b] ?? 0) + 1;
      b.bonds['#' + d.a] = (b.bonds['#' + d.a] ?? 0) + 1;
      this.maybePartners(d.a!, d.b!);
    } else if (ev.kind === 'remove') {
      // A widow(er) may find someone again.
      const p = w.profiles.get(d.id!);
      if (p && p.partner >= 0) { const q = w.profiles.get(p.partner); if (q && q.partner === d.id) q.partner = -1; }
    }
  }

  private maybePartners(ida: number, idb: number): void {
    const w = this.w, a = w.profiles.get(ida)!, b = w.profiles.get(idb)!, now = w.gameSec, y = this.yearSec;
    if (a.partner >= 0 || b.partner >= 0 || a.sex === b.sex) return;
    if (ageOf(a, now, y) < ADULT + 2 || ageOf(b, now, y) < ADULT + 2) return;
    if (a.parents.some((x) => b.parents.includes(x)) || a.parents.includes(idb) || b.parents.includes(ida)) return; // family
    if ((a.bonds?.['#' + idb] ?? 0) < BOND_TALKS) return;
    if (w.rules.forbiddenId(ida, 'court', idb) ?? w.rules.forbiddenId(idb, 'court', ida)) return; // the owner's rule
    if (!w.rng.chance(0.35)) return;
    a.partner = idb; b.partner = ida;
    w.emit('partner', { a: ida, b: idb });
  }

  /**
   * Someone asks another to be their partner (a task step). They must be single adults of opposite sex, not family,
   * and know each other a little (bonds); the answer depends on how much they talked and on the other's empathy.
   * True = partners now, else why not.
   */
  court(ida: number, idb: number): true | string {
    const w = this.w, a = w.profiles.get(ida), b = w.profiles.get(idb), now = w.gameSec, y = this.yearSec;
    if (!a || !b) return 'they are not here';
    if (a.partner === idb) return true;
    const rule = w.rules.forbiddenId(ida, 'court', idb) ?? w.rules.forbiddenId(idb, 'court', ida);
    if (rule) return `I must not: "${rule}"`;
    if (a.partner >= 0) return 'I already have a partner';
    if (b.partner >= 0) return `${b.name} already has a partner`;
    if (a.sex === b.sex) return `${b.name} is not interested`;
    if (ageOf(a, now, y) < ADULT + 2 || ageOf(b, now, y) < ADULT + 2) return 'too young';
    if (a.parents.some((x) => b.parents.includes(x)) || a.parents.includes(idb) || b.parents.includes(ida)) return `${b.name} is family`;
    a.bonds ??= {}; b.bonds ??= {};
    a.bonds['#' + idb] = (a.bonds['#' + idb] ?? 0) + 1; b.bonds['#' + ida] = (b.bonds['#' + ida] ?? 0) + 1;
    const talks = a.bonds['#' + idb]!;
    const chance = Math.min(0.9, 0.15 + talks * 0.12 + b.traits.empathy * 0.2);
    if (!w.rng.chance(chance)) return `${b.name} said "not yet, I barely know you"`;
    a.partner = idb; b.partner = ida;
    w.emit('partner', { a: ida, b: idb });
    return true;
  }

  /** A couple tries for a child now (a task step). True = expecting, else why not. */
  tryChild(id: number): true | string {
    const w = this.w, e = w.e, p = w.profiles.get(id), now = w.gameSec, y = this.yearSec;
    if (!p || p.partner < 0) return 'I have no partner';
    const q = w.profiles.get(p.partner);
    if (!q) return 'my partner is gone';
    const mother = p.sex === 'f' ? p : q, mid = p.sex === 'f' ? id : p.partner;
    if (mother.sex !== 'f') return 'we cannot have a child together';
    { const rule = w.rules.forbiddenId(id, 'child', p.partner) ?? w.rules.forbiddenId(p.partner, 'child', id); if (rule) return `I must not: "${rule}"`; }
    if (mother.pregnant) return `${mother.name} is already expecting`;
    const age = ageOf(mother, now, y);
    if (age < ADULT + 2 || age > 45) return `${mother.name} is not of age to have a child`;
    let living = 0;
    for (let i = 0; i < e.hi; i++) if (e.kind[i] === Kind.Agent) living++;
    if (living >= w.brain.life.maxPopulation) return 'there is no room for more people in this world';
    const i = e.slot(mid);
    if (i >= 0 && (e.hunger[i]! > 70 || e.thirst[i]! > 70)) return 'we are too hungry and thirsty for a baby now';
    if (!w.rng.chance(0.6)) return 'no baby this time';
    mother.pregnant = { father: mid === id ? p.partner : id, due: now + GESTATION_YEARS * y };
    w.emit('pregnant', { id: mid, father: mother.pregnant.father });
    return true;
  }

  /** Every tick: does the hourly work when a game hour has passed. */
  tick(): void {
    const h = Math.floor(this.w.gameSec / HOUR);
    if (this.lastHour < 0) { this.lastHour = h; return; }
    if (h === this.lastHour) return;
    this.lastHour = h;
    this.hourly();
  }

  hourly(): void {
    const w = this.w, e = w.e, now = w.gameSec, y = this.yearSec, perHour = HOUR / y; // years per game hour
    let living = 0;
    for (let i = 0; i < e.hi; i++) if (e.kind[i] === Kind.Agent) living++;
    for (let i = 0; i < e.hi; i++) {
      if (e.kind[i] !== Kind.Agent) continue;
      const id = e.id(i), p = w.profiles.get(id);
      if (!p) continue;
      const age = ageOf(p, now, y);
      // Children are small and slower; the flag tells the viewers.
      e.flags[i] = age < ADULT ? e.flags[i]! | EFlag.Child : e.flags[i]! & ~EFlag.Child;
      // Old age: past their lifespan the chance to die grows every year.
      const over = age - p.traits.lifespan;
      if (over > -3 && w.rng.chance(Math.min(1, (0.25 + Math.max(0, over) * 0.5) * perHour) )) {
        w.emit('death', { id, cause: 'old age', map: e.map[i] === NO_MAP ? '' : w.maps[e.map[i]!]!.def.id, x: e.x[i], y: e.y[i], age: Math.floor(age) });
        w.remove(i, 'old age');
        living--;
        continue;
      }
      // Birth.
      if (p.pregnant && p.pregnant.due <= now && e.map[i] !== NO_MAP) {
        const father = w.profiles.get(p.pregnant.father);
        const fid = p.pregnant.father;
        delete p.pregnant;
        const s = w.freeSpot(e.map[i]!, e.x[i]! + 0.8, e.y[i]!, 6);
        if (!s) continue;
        const child = inherit(w.rng, p, father ?? p, [id, fid], now, w.livingNames());
        const c = w.spawnAgent(e.map[i]!, s.x, s.y, child);
        if (c < 0) continue;
        e.hunger[c] = 10; e.thirst[c] = 10; e.tired[c] = 20; e.lonely[c] = 0;
        e.flags[c] = e.flags[c]! | EFlag.Child;
        living++;
        w.emit('birth', { id: e.id(c), mother: id, father: fid, map: w.maps[e.map[i]!]!.def.id });
        continue;
      }
      // Conception: a woman 18-45 with her partner alive on the same map, both fed and watered, room in the world.
      if (p.sex === 'f' && p.partner >= 0 && !p.pregnant && age >= ADULT + 2 && age <= 45 && living < w.brain.life.maxPopulation) {
        const j = e.slot(p.partner);
        if (j < 0 || e.map[j] !== e.map[i] || e.map[i] === NO_MAP) continue;
        if (e.hunger[i]! > 70 || e.thirst[i]! > 70 || e.hunger[j]! > 70 || e.thirst[j]! > 70) continue;
        if (w.rules.between(i, j, 'child')) continue; // the owner's rule
        if (w.rng.chance(CONCEIVE_PER_YEAR * perHour)) {
          p.pregnant = { father: p.partner, due: now + GESTATION_YEARS * y };
          w.emit('pregnant', { id, father: p.partner });
        }
      }
    }
  }

  /**
   * Change how fast people age, keeping everyone's age in years (and how far along a pregnancy is).
   * `fromYearSec` = the year length the ages were counted in.
   */
  rescale(fromYearSec: number): void {
    const w = this.w, now = w.gameSec, k = this.yearSec / fromYearSec;
    if (k === 1) return;
    for (const p of w.profiles.values()) {
      p.born = now - (now - p.born) * k;
      if (p.died !== undefined) p.died = now - (now - p.died) * k;
      if (p.pregnant) p.pregnant.due = now + (p.pregnant.due - now) * k;
    }
  }
}
