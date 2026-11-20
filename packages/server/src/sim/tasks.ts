import { Act, Kind } from '@worldsim/protocol';
import { NO_MAP } from './entities.js';
import { ageOf } from './people.js';
import { ADULT } from './life.js';
import type { World } from './world.js';

/**
 * Tasks: what a person was asked to do (or decided to do), as a short list of steps the engine knows how to run.
 * The AI turns any sentence ("go and find a wife", "bring Ines some food then come back") into these steps; the
 * engine runs them one by one, in order, with real movement and real rules (a couple still needs to like each other,
 * a baby still needs a partner and room in the world). A step that cannot be done ends the task with a reason, which
 * goes into the person's memory so they can say why.
 *
 * Skills (step "do"):
 *  goto who            walk to someone            find what           find a person ("single woman", "partner", a name) or food / water, then go there
 *  follow who minutes  walk with someone          talk who times      talk with someone (bonds grow)
 *  court who           ask to become partners     child               have a child with your partner
 *  bring who           fetch food and give it     give who            give food you carry
 *  stay minutes        wait here                  drink eat forage sleep rest wander   the needs actions
 *  say text            say something aloud
 */
export interface Step { do: string; who?: number; what?: string; times?: number; minutes?: number; text?: string; t0?: number; phase?: number }
export interface Task { text: string; from: string; steps: Step[]; k: number; started: number; status?: string }

export const SKILLS = ['goto', 'find', 'follow', 'talk', 'court', 'child', 'bring', 'give', 'stay', 'drink', 'eat', 'forage', 'sleep', 'rest', 'wander', 'say'] as const;
const ACTS: Record<string, number> = { drink: Act.Drink, eat: Act.Eat, forage: Act.Forage, sleep: Act.Sleep, rest: Act.Rest, wander: Act.Wander };
const MAX_STEP_SEC = 3 * 3600; // a step that takes more than 3 game hours is given up

export class Tasks {
  /** Tasks by person (entity id). Kept in Profile.mind.task too, so they survive a restart. */
  /** Called when a person says something as part of a task. */
  onSay: (i: number, text: string) => void = () => {};
  /** Called when a task ends: done or failed (with why), for the person's memory. */
  onEnd: (id: number, task: Task, ok: boolean, why: string) => void = () => {};

  constructor(private w: World) {}

  private taskOf(id: number): Task | undefined { return this.w.profiles.get(id)?.mind?.task as Task | undefined; }

  /** Give person i a task (replaces the one they had). */
  start(i: number, text: string, from: string, steps: Step[]): boolean {
    const w = this.w, p = w.profileOf(i);
    if (!p || !steps.length) return false;
    p.mind ??= { notes: [], summary: '', mood: 'calm', rel: {}, lastPlan: 0 };
    p.mind.task = { text: text.slice(0, 120), from, steps: steps.slice(0, 8), k: 0, started: w.gameSec };
    w.brain.order(i, 'stop', -1, -1, 0);
    return true;
  }

  stop(i: number): void {
    const p = this.w.profileOf(i);
    if (p?.mind?.task) { delete p.mind.task; this.w.brain.order(i, 'stop', -1, -1, 0); }
  }

  /** Once a game-second or so (World.step every 20 ticks). */
  update(): void {
    const w = this.w, e = w.e;
    for (let i = 0; i < e.hi; i++) {
      if (e.kind[i] !== Kind.Agent || e.map[i] === NO_MAP) continue;
      const t = this.taskOf(e.id(i));
      if (!t) continue;
      const s = t.steps[t.k];
      if (!s) { this.end(i, t, true, ''); continue; }
      if (s.who === -2) { // "found": the person the last find step found
        for (let k = t.k - 1; k >= 0; k--) if (t.steps[k]!.do === 'find' && (t.steps[k]!.who ?? -1) >= 0) { s.who = t.steps[k]!.who; break; }
        if (s.who === -2) { this.end(i, t, false, 'I did not find anyone'); continue; }
      }
      if (s.t0 === undefined) { s.t0 = w.gameSec; s.phase = 0; }
      else if (w.gameSec - s.t0 > MAX_STEP_SEC) { this.end(i, t, false, `${s.do} took too long`); continue; }
      const r = this.run(i, s);
      if (r === true) { t.k++; if (t.k >= t.steps.length) this.end(i, t, true, ''); }
      else if (typeof r === 'string') this.end(i, t, false, r);
    }
  }

  private end(i: number, t: Task, ok: boolean, why: string): void {
    const p = this.w.profileOf(i)!;
    delete p.mind!.task;
    this.w.brain.order(i, 'stop', -1, -1, 0);
    this.w.emit('task', { id: this.w.e.id(i), text: t.text, ok, why });
    this.onEnd(this.w.e.id(i), t, ok, why);
  }

  /** One step: true = done, a string = failed (why), false = still on it. */
  private run(i: number, s: Step): boolean | string {
    const w = this.w, e = w.e, b = w.brain;
    const first = s.phase === 0;
    const near = (id: number, r: number) => { const j = e.slot(id); return j >= 0 && e.map[j] === e.map[i] && Math.hypot(e.x[j]! - e.x[i]!, e.y[j]! - e.y[i]!) <= r; };
    const alive = (id: number | undefined) => id !== undefined && id >= 0 && e.slot(id) >= 0;
    /** Walk to someone; true once next to them. */
    const reach = (id: number): boolean | string => {
      if (!alive(id)) return 'they are not here any more';
      const j = e.slot(id);
      if (e.map[j] !== e.map[i]) return `${this.name(id)} is in another place`;
      if (near(id, 3)) return true;
      if (b.orderOf(i).kind !== 'come') b.order(i, 'goto', id, -1, 180);
      return false;
    };
    switch (s.do) {
      case 'say':
        if (s.text) this.onSay(i, s.text.slice(0, 200));
        return true;
      case 'find': {
        if (s.who === undefined || s.who < 0) {
          const what = (s.what ?? '').toLowerCase();
          if (/water|drink|eau|agua|ماء/.test(what)) { s.do = 'drink'; s.phase = 0; return false; }
          if (/food|eat|manger|comida|أكل|طعام/.test(what)) { s.do = 'forage'; s.phase = 0; return false; }
          const who = this.findPerson(i, what);
          if (who < 0) return `found nobody (${what || 'anyone'})`;
          s.who = who;
        }
        return reach(s.who);
      }
      case 'goto':
        return reach(s.who ?? -1);
      case 'follow': {
        if (!alive(s.who)) return 'they are not here any more';
        if (first) { b.order(i, 'follow', s.who!, -1, s.minutes ?? 60); s.phase = 1; return false; }
        return b.orderOf(i).kind === 'follow' ? false : true; // the order ends by itself after `minutes`
      }
      case 'talk': case 'court': case 'child': {
        let who = s.who ?? -1;
        if (s.do === 'child') {
          const p = w.profileOf(i)!;
          if (p.partner < 0) return 'I have no partner to have a child with';
          who = p.partner;
        }
        if (s.phase !== 2) {
          const r = reach(who);
          if (r !== true) return r;
          // Next to them: they both stop and talk for a moment.
          const j = e.slot(who);
          b.order(i, 'stop', -1, -1, 0);
          b.listen(i, j, 15);
          if (e.kind[j] === Kind.Agent) b.listen(j, i, 15);
          s.phase = 2; s.t0 = w.gameSec;
          return false;
        }
        if (w.gameSec - s.t0! < 60) return false; // a game minute of talking
        const j = e.slot(who);
        if (j < 0) return 'they left';
        if (s.do === 'talk') {
          if (e.kind[j] === Kind.Agent) for (let n = 0; n < Math.max(1, Math.min(4, s.times ?? 1)); n++) w.emit('talk', { a: e.id(i), b: who, map: w.maps[e.map[i]!]!.def.id });
          return true;
        }
        if (s.do === 'court') return w.life.court(e.id(i), who);
        return w.life.tryChild(e.id(i));
      }
      case 'bring': case 'give': {
        if (!alive(s.who)) return 'they are not here any more';
        if (s.do === 'give' && e.carry[i]! <= 0) return 'I have no food to give';
        if (first) { b.order(i, 'bring', s.who!, -1, 180); s.phase = 1; return false; }
        return b.orderOf(i).kind === 'bring' ? false : near(s.who!, 4) ? true : 'I could not reach them';
      }
      case 'stay': {
        if (first) { b.order(i, 'stay', -1, -1, s.minutes ?? 30); s.phase = 1; return false; }
        return b.orderOf(i).kind === 'stay' ? false : true;
      }
      default: {
        const a = ACTS[s.do];
        if (a === undefined) return `I don't know how to ${s.do}`;
        if (a === Act.Eat && e.carry[i]! <= 0) { s.do = 'forage'; return false; } // nothing to eat: find food first
        if (first) { b.order(i, 'act', -1, a, 60); s.phase = 1; s.t0 = w.gameSec; return false; }
        // Done once they did it (the action came and went), or after a while for open-ended ones.
        if (s.phase === 1 && e.act[i] === a) { s.phase = 3; return false; }
        if (s.phase === 3 && e.act[i] !== a) return true;
        return w.gameSec - s.t0! > (a === Act.Sleep ? 8 : 1) * 3600 ? true : false;
      }
    }
  }

  /** Someone who fits: a name, "partner", "single woman / man", "woman", "man", "anyone". Nearest first. -1 = nobody. */
  findPerson(i: number, what: string): number {
    const w = this.w, e = w.e, me = w.profileOf(i), now = w.gameSec, y = w.life.yearSec;
    const q = what.trim().toLowerCase();
    if (/partner|wife|husband|femme|mari|esposa|esposo|زوج/.test(q) && me && me.partner >= 0 && !/new|find a|trouve|busca|single|célibataire|soltera|soltero/.test(q)) return me.partner;
    for (const [id, p] of w.profiles) if (p.name.toLowerCase() === q && e.slot(id) >= 0) return id;
    const wantF = /woman|wife|girl|femme|fille|mujer|esposa|chica|امرأة|زوجة|بنت/.test(q), wantM = /\bman\b|husband|boy|homme|mari|hombre|esposo|chico|رجل|زوج\b/.test(q) && !wantF;
    const single = /single|wife|husband|partner|marry|célibataire|épouse|soltera|soltero|esposa|esposo|زوجة/.test(q);
    let best = -1, bd = Infinity;
    for (let j = 0; j < e.hi; j++) {
      if (j === i || e.kind[j] !== Kind.Agent || e.map[j] !== e.map[i]) continue;
      const p = w.profileOf(j);
      if (!p) continue;
      if (wantF && p.sex !== 'f') continue;
      if (wantM && p.sex !== 'm') continue;
      if (single && (p.partner >= 0 || ageOf(p, now, y) < ADULT + 2 || (me && (me.parents.some((x) => p.parents.includes(x)) || p.parents.includes(e.id(i)) || me.parents.includes(e.id(j)))))) continue;
      const d = Math.hypot(e.x[j]! - e.x[i]!, e.y[j]! - e.y[i]!);
      if (d < bd) { bd = d; best = e.id(j); }
    }
    return best;
  }

  private name(id: number): string { return this.w.profiles.get(id)?.name ?? 'them'; }

  /** "find a wife: step 2 of 3, talk with Ines" for the panel and the bubbles. */
  describe(id: number): string {
    const t = this.taskOf(id);
    if (!t) return '';
    const s = t.steps[t.k];
    return `${t.text} (step ${t.k + 1}/${t.steps.length}: ${s ? s.do + (s.who !== undefined && s.who >= 0 ? ' ' + this.name(s.who) : s.what ? ' ' + s.what : '') : 'done'})`;
  }
}
