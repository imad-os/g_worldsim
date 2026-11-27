import { DROP_BASE, Kind } from '@worldsim/protocol';
import type { World } from './world.js';

/**
 * Spreading over the maps (flag `aware`, imad 2026-11-27: "a mechanism to encourage them to spread over the maps, for resources,
 * hunts or crowded places; they need to be aware when resources get less because of a lot of people; make it rare").
 *
 * Once a game day (at 9:00) each lived-in map that is not wild gets a PRESSURE from what it has for the people on it: food on the
 * ground and in the store, game, trees that can be cut (not the town's ring), and the crowd itself (more than CROWD people). The
 * people there know it: a line in their prompts ("Food is getting short here: 18 people, 1.2 food a head") and a piece of news that
 * talks spread ("too many mouths here, food is short"), and those who stay keep it in mind.
 *
 * When a map is clearly worse off than another one reachable through the gates (pressure 0.6+, the other 0.4 lower), now and then
 * (at most one household a map every MOVE_EVERY game days, and only half of those days) a household moves there for good: a single
 * adult or a couple with no children under 14 (children never travel), never the camp's leader, a new mother or a player, chosen by
 * who has least to keep them (no home of their own, grown and left home, little loyalty to their clan) and most nerve and curiosity.
 * They walk through the gates (task skill `settle`), give up the hut they leave behind (`Homes.leave`) and start again there.
 * Agents only travel while travel is open (the owner's travel lock), so with it closed nobody moves.
 */
const CROWD = 16, MOVE_EVERY = 2, HOUR = 3600, DAY = 86400;

export interface Pressure { m: number; n: number; food: number; game: number; trees: number; score: number; why: string }

export class Migrate {
  /** Pressure per map, from the last daily count. */
  readonly press: (Pressure | null)[] = [];
  private lastDay = -1;
  private readonly lastMove = new Map<number, number>();
  stats = { moves: 0, checks: 0 };

  constructor(private readonly w: World) {}

  /** Every 20 ticks: once a game day at 9:00. */
  update(): void {
    const w = this.w;
    if (w.ai.aware === false) return;
    const h = w.brain.hour(), day = Math.floor((w.gameSec + 8 * HOUR) / DAY);
    if (h < 9 || day === this.lastDay) return;
    this.lastDay = day;
    this.count();
    this.stats.checks++;
    for (let m = 0; m < w.maps.length; m++) {
      const p = this.press[m];
      if (!p || p.score < 0.4) continue;
      this.tell(m, p);
      if (p.score >= 0.6 && w.travelOpen) this.maybeMove(m, p, day);
    }
  }

  /** Count what each lived-in map has per head. */
  count(): void {
    const w = this.w, e = w.e;
    const n = new Array<number>(w.maps.length).fill(0), food = n.slice(), game = n.slice();
    for (let i = 0; i < e.hi; i++) {
      const m = e.map[i]!;
      if (m < 0 || m >= w.maps.length) continue;
      if (e.kind[i] === Kind.Agent) n[m]!++;
      else if (e.kind[i] === Kind.Item && e.sub[i]! < DROP_BASE) food[m]!++;
      else if (e.kind[i] === Kind.Animal && e.sub[i]! !== 5 && e.sub[i]! !== 3 && e.sub[i]! !== 4) game[m]!++; // rabbits, deer, boar (not wolves, bears, horses)
    }
    for (let m = 0; m < w.maps.length; m++) {
      if (w.wild(m)) { this.press[m] = null; continue; }
      const tm = w.maps[m]!.tiles, T = w.survival.T.tree;
      let trees = 0;
      for (let k = 0; k < tm.tiles.length; k++) if (tm.tiles[k] === T && !w.land.inRing(m, k % tm.w, (k / tm.w) | 0)) trees++;
      const people = n[m]!, st = w.survival.stash[m];
      const f = food[m]! + (st?.food ?? 0) + game[m]! * 3;
      const fh = people ? f / people : 99, th = people ? trees / people : 99;
      const short = Math.max(0, 1 - fh / 3), crowd = Math.max(0, (people - CROWD) / CROWD), wood = Math.max(0, 1 - th / 15) * 0.5;
      const score = people < 4 ? 0 : Math.min(2, short + crowd + wood);
      const why = [short > 0.3 ? `food is short (${fh.toFixed(1)} a head)` : '', crowd > 0 ? `crowded (${people} people)` : '', wood > 0.2 ? `few trees left to cut (${trees})` : ''].filter(Boolean).join(', ');
      this.press[m] = { m, n: people, food: Math.round(fh * 10) / 10, game: game[m]!, trees, score: Math.round(score * 100) / 100, why };
    }
  }

  /** The best other map reachable from m for settlers (not wild, clearly better), or -1. */
  better(m: number): number {
    const w = this.w, p = this.press[m];
    if (!p) return -1;
    let best = -1, bs = p.score - 0.4;
    for (let k = 0; k < w.maps.length; k++) {
      const q = this.press[k];
      if (k === m || !q || w.wild(k)) continue;
      const r = w.routeMaps(m, k);
      if (!r || !r.length) continue;
      const s = q.score + r.length * 0.05;
      if (s < bs) { bs = s; best = k; }
    }
    return best;
  }

  /** The people of m know how it is: news (talks spread it) once a day while it lasts. */
  private tell(m: number, p: Pressure): void {
    const w = this.w, e = w.e, key = `scarce:${m}:${Math.floor(w.gameSec / DAY)}`, text = `${w.maps[m]!.def.name} has too many mouths: ${p.why || 'things are getting short'}`;
    let told = 0;
    for (let i = 0; i < e.hi && told < 3; i++) if (e.kind[i] === Kind.Agent && e.map[i] === m && w.family.ageOf(i) >= 16 && w.rng.chance(0.3)) { if (w.talk.seed(e.id(i), key, text, 4)) told++; }
  }

  private maybeMove(m: number, p: Pressure, day: number): void {
    const w = this.w, e = w.e;
    if (day - (this.lastMove.get(m) ?? -99) < MOVE_EVERY || !w.rng.chance(0.5)) return;
    const to = this.better(m);
    if (to < 0) return;
    const leader = w.survival.leader[m] ?? -1;
    let best = -1, bs = -Infinity;
    for (let i = 0; i < e.hi; i++) {
      if (e.kind[i] !== Kind.Agent || e.map[i] !== m) continue;
      const pr = w.profileOf(i), id = e.id(i);
      if (!pr || pr.player || id === leader || pr.mind?.task || w.brain.orderOf(i).kind || w.family.ageOf(i) < 18 || w.family.lyingInHome(i)) continue;
      if (this.youngKids(id) || e.hp[i]! < 60) continue;
      const pj = pr.partner >= 0 ? e.slot(pr.partner) : -1;
      if (pr.partner >= 0 && (pj < 0 || e.map[pj] !== m || w.profileOf(pj)?.mind?.task || pr.partner === leader || w.family.lyingInHome(pj))) continue;
      const t = pr.traits, home = w.survival.homes.homeOf(id), loyal = w.clans.clanOf(id) ? w.clans.loyalty(id) : 0.3;
      const v = t.courage * 0.8 + t.intelligence * 0.3 + (home ? -0.6 : 0.4) + (pr.leftHome ? 0.3 : 0) - loyal * 0.4 + w.rng.next() * 0.3;
      if (v > bs) { bs = v; best = i; }
    }
    if (best < 0 || bs < 0.2) return;
    const pr = w.profileOf(best)!, id = e.id(best), dest = w.maps[to]!.def;
    const who = [best, ...(pr.partner >= 0 ? [e.slot(pr.partner)] : [])];
    const why = `in ${w.maps[m]!.def.name} ${p.why || 'there are too many people'}`;
    for (const i of who) {
      const other = who.length > 1 ? ` with ${w.profileOf(i === best ? who[1]! : best)?.name ?? 'my partner'}` : '';
      if (!w.tasks.start(i, `move to ${dest.name} for good${other}`, 'myself', [{ do: 'settle', what: dest.id }])) return;
      (w.profileOf(i)!.mind!.task as { goal?: string }).goal = 'settle';
      w.memory.add(e.id(i), 'move', 7, `decided to leave for ${dest.name}: ${why}`);
    }
    this.lastMove.set(m, day);
    this.stats.moves++;
    const names = who.map((i) => w.profileOf(i)?.name ?? 'someone').join(' and ');
    w.speak(best, `There is not enough for all of us here. ${who.length > 1 ? 'We are' : 'I am'} going to try our luck in ${dest.name}.`);
    w.emit('migrate', { id, ids: who.map((i) => e.id(i)), from: w.maps[m]!.def.id, to: dest.id, why });
    for (let i = 0; i < e.hi; i++) if (e.kind[i] === Kind.Agent && e.map[i] === m && !who.includes(i) && Math.hypot(e.x[i]! - e.x[best]!, e.y[i]! - e.y[best]!) < 40)
      w.talk.seed(e.id(i), `migrate:${id}:${Math.floor(w.gameSec / DAY)}`, `${names} left for ${dest.name}: ${why}`, 5, who.map((k) => e.id(k)));
  }
  private youngKids(id: number): boolean {
    for (const k of this.w.family.childrenOf(id)) { const j = this.w.e.slot(k); if (j >= 0 && this.w.family.ageOf(j) < 14) return true; }
    return false;
  }

  /** A line for the prompts of people on a map under pressure. */
  promptText(i: number): string {
    if (this.w.ai.aware === false) return '';
    const m = this.w.e.map[i]!, p = this.press[m];
    if (!p || p.score < 0.4) return '';
    const b = this.better(m);
    return `This place is under strain: ${p.why || 'too many people'}.${b >= 0 ? ` ${this.w.maps[b]!.def.name} has more to go round.` : ''}`;
  }
}
