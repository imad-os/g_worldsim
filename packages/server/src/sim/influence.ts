import { EFlag } from '@worldsim/protocol';
import { levelOf } from './people.js';
import type { World, WorldEvent } from './world.js';

/**
 * Influence (imad 2026-11-26: "anyone with enough influence can call an election and the more influential person should be
 * elected; influence goes up or down by what each person does: saving a child or a person, killing animals or zombies, doing
 * tasks, respecting the strict rules, and their level").
 *
 * Each person has deeds points (`Profile.influence.d`) fed by world events, and a score 0..100 =
 * BASE + deeds + level x LEVEL_PTS. Good deeds count less as the score grows (diminishing), bad ones count in full.
 * Deeds fade a little every game hour (about half in 6 game days), so influence has to be kept by acting.
 *
 * Clans (sim/clans.ts, hybrid chosen by imad): calling an election needs CALL_MIN; candidates are the leader + the 2 most
 * influential; AI ballots are 60 % the candidate's influence, 40 % feelings, family and loyalty.
 */
export const CALL_MIN = 40;
export const BASE = 10, LEVEL_PTS = 4;
const FADE_H = 0.9952; // deeds kept per game hour (half-life ~ 144 h = 6 days)
const LOG = 12;

export interface Influence { d: number; log: { t: number; d: number; why: string }[] }

/** What moves influence (points before diminishing). */
export const DEEDS = {
  savedChild: 8, savedPerson: 5, healed: 2, zombie: 2, beast: 2, game: 0.5, taskDone: 0.8, orderDone: 0.7, taskFailed: -0.8,
  questDone: 2, ruleKept: 1.5, ruleFailed: -2, duelWon: 1, duelLost: -1, helped: 0.5, careKid: 0.15, killedPerson: -15, lostChild: -3,
} as const;
const BEASTS = new Set(['boar', 'wolf', 'bear']);

export class Influences {
  /** threat entity id -> [victim id, tick of the bite]: who it was hurting, to tell a rescue from a plain kill. */
  private bites = new Map<number, [number, number]>();
  /** per person per kind: game second of the last small gain (care / help count once a game hour). */
  private cool = new Map<string, number>();
  private hour = -1;

  constructor(private readonly w: World) {
    w.listeners.push((ev) => this.on(ev));
  }

  /** The score 0..100 (entity id). */
  of(id: number): number {
    const p = this.w.profiles.get(id);
    if (!p) return 0;
    return Math.round(Math.max(0, Math.min(100, BASE + (p.influence?.d ?? 0) + levelOf(p.xp) * LEVEL_PTS)));
  }
  /** Why it is what it is: the last changes, newest first. */
  log(id: number): { t: number; d: number; why: string }[] { return (this.w.profiles.get(id)?.influence?.log ?? []).slice().reverse(); }
  /** Points added (after diminishing), with a reason. Exposed for the panel / tests. */
  add(id: number, pts: number, why: string): number {
    const p = this.w.profiles.get(id);
    if (!p || p.died !== undefined || !pts) return 0;
    const inf = (p.influence ??= { d: 0, log: [] });
    const d = pts > 0 ? pts * Math.max(0.2, 1 - this.of(id) / 110) : pts;
    inf.d = Math.max(-BASE - 40, Math.min(100, inf.d + d));
    const last = inf.log[inf.log.length - 1];
    if (last && last.why === why && this.w.gameSec - last.t < 3600) { last.d = Math.round((last.d + d) * 10) / 10; last.t = this.w.gameSec; }
    else { inf.log.push({ t: this.w.gameSec, d: Math.round(d * 10) / 10, why }); if (inf.log.length > LOG) inf.log.shift(); }
    return d;
  }
  /** The line in every prompt about the person. */
  promptText(id: number): string {
    const v = this.of(id), top = this.log(id).filter((x) => x.d > 0).slice(0, 2).map((x) => x.why);
    return `Your influence among the people: ${v}/100${top.length ? ` (known for: ${top.join('; ')})` : ''}${v >= CALL_MIN ? '; enough to call a clan election' : ''}.`;
  }

  private name(id: number): string { return this.w.profiles.get(id)?.name ?? 'someone'; }
  private once(id: number, k: string, gap = 3600): boolean {
    const key = `${id}:${k}`, t = this.cool.get(key) ?? -1e9;
    if (this.w.gameSec - t < gap) return false;
    this.cool.set(key, this.w.gameSec);
    return true;
  }
  private child(id: number): boolean {
    const e = this.w.e, i = e.slot(id);
    return i >= 0 && (e.flags[i]! & (EFlag.Child | EFlag.Small)) !== 0;
  }
  /** A kill of a threat that was hurting someone else (bitten within 20 s) or about to (going for them, within 3 m) = a rescue. */
  private rescue(by: number, threat: number, prey = -1, near = 99): boolean {
    const b = this.bites.get(threat);
    this.bites.delete(threat);
    const v = b && b[0] !== by && this.w.tick - b[1] <= 20 * this.w.opt.tickRate ? b[0] : prey !== by && near <= 3 ? prey : -1;
    const p = v >= 0 ? this.w.profiles.get(v) : undefined;
    if (!p || p.died !== undefined || this.w.e.slot(v) < 0) return false;
    const kid = this.child(v);
    if (kid) this.add(by, DEEDS.savedChild, `saved ${p.name} (a child)`);
    else this.add(by, DEEDS.savedPerson, `saved ${p.name}`);
    this.w.emit('influence', { id: by, saved: v, child: kid });
    return true;
  }

  private on(ev: WorldEvent): void {
    const d = ev.data as Record<string, unknown>, w = this.w;
    const n = (x: unknown) => (typeof x === 'number' ? x : -1);
    switch (ev.kind) {
      case 'bitten': if (n(d.by) >= 0 && w.profiles.has(n(d.id))) this.bites.set(n(d.by), [n(d.id), w.tick]); break;
      case 'zombie': if (d.how === 'killed' && w.profiles.has(n(d.by))) { if (!this.rescue(n(d.by), n(d.id), n(d.prey), Number(d.near ?? 99))) this.add(n(d.by), DEEDS.zombie, 'killed zombies'); } else if (d.how === 'dawn') this.bites.delete(n(d.id)); break;
      case 'hunt': {
        const by = n(d.id), a = String(d.animal ?? '');
        if (!w.profiles.has(by)) break;
        if (this.rescue(by, n(d.aid), n(d.prey), Number(d.near ?? 99))) break;
        if (BEASTS.has(a)) this.add(by, DEEDS.beast, `killed a ${a}`); else this.add(by, DEEDS.game, 'hunted game');
        break;
      }
      case 'heal': if (n(d.who) !== n(d.id)) this.add(n(d.id), DEEDS.healed, `treated ${this.name(n(d.who))}`); break;
      case 'care': if (d.what !== 'turn' && d.what !== 'grab' && this.once(n(d.id), 'care')) this.add(n(d.id), DEEDS.careKid, 'cared for children'); break;
      case 'tactic': if (d.plan === 'help' && this.once(n(d.id), 'help', 1800)) this.add(n(d.id), DEEDS.helped, 'came to help in fights'); break;
      case 'task': this.add(n(d.id), d.ok ? DEEDS.taskDone : DEEDS.taskFailed, d.ok ? 'got things done' : 'failed tasks'); break;
      case 'reward': if (d.ok) this.add(n(d.id), DEEDS.orderDone, `did what ${String(d.from ?? 'someone')} asked`); break;
      case 'questDone': this.add(n(d.id), DEEDS.questDone, 'finished quests'); break;
      case 'rule': if (d.did === 'done') this.add(n(d.id), DEEDS.ruleKept, 'keeps the strict rules'); else if (d.did === 'failed') this.add(n(d.id), DEEDS.ruleFailed, 'broke a strict rule'); break;
      case 'duelEnd': { const win = n(d.winner); if (win >= 0) { this.add(win, DEEDS.duelWon, 'won duels'); const lose = win === n(d.a) ? n(d.b) : n(d.a); this.add(lose, DEEDS.duelLost, 'lost duels'); } break; }
      case 'death': {
        const id = n(d.id), by = n(d.by);
        if (by >= 0 && by !== id && w.profiles.has(by) && w.profiles.has(id)) this.add(by, DEEDS.killedPerson, `killed ${this.name(id)}`);
        const p = w.profiles.get(id);
        if (p && d.cause !== 'old age' && this.child(id)) for (const par of p.parents) this.add(par, DEEDS.lostChild, `lost ${p.name} (their child)`);
        break;
      }
    }
  }

  /** Every 20 ticks: deeds fade once per game hour. */
  update(): void {
    const h = Math.floor(this.w.gameSec / 3600);
    if (h === this.hour) return;
    const steps = this.hour < 0 ? 0 : Math.min(48, h - this.hour);
    this.hour = h;
    if (!steps) return;
    const k = Math.pow(FADE_H, steps);
    for (const p of this.w.profiles.values()) if (p.influence && p.died === undefined) p.influence.d *= k;
    if (this.bites.size > 500) this.bites.clear();
    if (this.cool.size > 4000) this.cool.clear();
  }
}
