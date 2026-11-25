import { Act, Kind } from '@worldsim/protocol';
import { NO_MAP } from './entities.js';
import { ageOf, levelOf, TRAIT_KEYS } from './people.js';
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
 *  marry who / divorce who  walk to them and ask (their own answer decides; the world is changed only if they say yes)
 *  court who           ask to become partners     child               have a child with your partner
 *  bring who           fetch food and give it     give who            give food you carry
 *  stay minutes        wait here                  drink eat forage sleep rest wander   the needs actions
 *  say text            say something aloud
 *  gather what times   wood (chop trees) / stone / scrap (search rubble) / food   craft what   make an axe or a spear
 *  build what          campfire / hut (gathers what is missing first)             tend         put wood on the fire
 *  collect what times  pick up food (kept, not eaten) or gather a material        store what   put it in the camp's crate
 *  take what times     take from the camp's crate                                 loot times   search ruins (food, scrap, stone)
 *  farm                plant a berry field near the camp                          repair       mend a broken hut wall (1 wood)
 *  heal who            dress someone's wounds                                     give who what  hand over food or a material
 *  trade who what get  give one thing for another (they must have it)
 *  hunt what times     hunt an animal (rabbit, deer, boar, wolf, bear): meat, leather, claws
 *  npc what            walk to a town teacher (guide, smith, hunter, warden, registrar) and talk: take / hand in a quest (sim/quests.ts)
 *  clan what who       join (who = the clan's leader or the clan's name) / quit / found (at the registrar) / vote (who) / call (a vote)
 *  tame                walk calmly up to the nearest wild horse and tame it (sim/horses.ts: courage, intelligence, speed, level)
 */
/** Food, wood, stone, scrap from free words (4 languages). */
export function resOf(what: string | undefined, dflt: 'food' | 'wood' = 'food'): 'food' | 'wood' | 'stone' | 'scrap' | 'ore' | 'brick' | 'leather' | 'claw' {
  const q = (what ?? '').toLowerCase();
  if (/\bore\b|iron|minerai|fer\b|mineral|hierro|خام|حديد/.test(q)) return 'ore';
  if (/brick|brique|ladrillo|طوب|آجر/.test(q)) return 'brick';
  if (/leather|hide|skin|cuir|peau|cuero|piel|جلد/.test(q)) return 'leather';
  if (/claw|griffe|garra|مخلب|مخالب/.test(q)) return 'claw';
  if (/wood|bois|madera|le[ñn]a|حطب|خشب|log/.test(q)) return 'wood';
  if (/scrap|metal|ferraille|chatarra|خردة/.test(q)) return 'scrap';
  if (/stone|rock|pierre|piedra|حجر/.test(q)) return 'stone';
  if (/food|eat|berr|can|nourriture|manger|comida|طعام|أكل/.test(q)) return 'food';
  return dflt;
}
/** What to make (craft) or put up (build), from free words in 4 languages. */
export function thingOf(q0: string, kind: 'craft' | 'build'): string {
  const q = q0.toLowerCase();
  const T: [RegExp, string][] = [
    [/first.?aid|med.?kit|\bkit\b|bandage|trousse|soin|botiqu[íi]n|إسعاف|ضماد/, 'medkit'], [/sword|épée|epee|espada|سيف/, 'sword'], [/\baxe|hache|hacha|فأس/, 'axe'], [/bow\b|\barc\b|arco|قوس/, 'bow'], [/arrow|flèche|fleche|flecha|سهم|سهام/, 'arrows'],
    [/spear|lance|lanza|رمح/, 'spear'], [/armou?r|armure|armadura|درع/, 'armor'], [/helmet|casque|casco|خوذة/, 'helmet'], [/cloth|vêtement|vetement|ropa|ملابس|لباس/, 'clothes'],
    [/palisade|fence|barricade|palissade|cerca|valla|سياج|حاجز/, 'palisade'], [/spike|pieu|estaca|أوتاد|شوك/, 'spikes'], [/stone ?wall|brick ?wall|mur de pierre|muro de piedra|جدار حجر/, 'stonewall'], [/\bwall|\bmur\b|muro|muralla|جدار|سور/, 'palisade'],
    [/door|porte|puerta|باب/, 'door'], [/window|fenêtre|fenetre|ventana|نافذة|شباك/, 'window'], [/\bbed|\blit\b|cama|سرير/, 'bed'], [/lamp|light|lantern|lampe|lanterne|lámpara|lampara|farol|مصباح|فانوس/, 'lamp'],
    [/hut|house|home|shelter|cabane|maison|abri|casa|cabaña|refugio|بيت|منزل|كوخ/, 'hut'], [/fire|feu|fuego|campfire|نار/, 'campfire'],
  ];
  for (const [re, v] of T) if (re.test(q)) return v;
  if (/weapon|arme|arma|سلاح/.test(q)) return 'spear';
  return kind === 'craft' ? 'axe' : 'campfire';
}
export interface Step { key?: string; units?: number; do: string; who?: number; what?: string; times?: number; minutes?: number; text?: string; t0?: number; phase?: number; n0?: number; got?: boolean; fails?: number; planned?: boolean; p0?: number; n1?: number }
export interface Task { text: string; from: string; steps: Step[]; k: number; started: number; status?: string; goal?: string; tries?: number; /** Started by a strict rule (its words, sim/rules.ts). */ rule?: string }

export const SKILLS = ['goto', 'find', 'follow', 'talk', 'court', 'marry', 'divorce', 'child', 'bring', 'give', 'stay', 'drink', 'eat', 'forage', 'sleep', 'rest', 'wander', 'say', 'gather', 'craft', 'build', 'tend',
  'collect', 'store', 'take', 'loot', 'farm', 'repair', 'heal', 'trade', 'hunt', 'npc', 'clan', 'tame', 'destroy'] as const;
const ACTS: Record<string, number> = { drink: Act.Drink, eat: Act.Eat, forage: Act.Forage, sleep: Act.Sleep, rest: Act.Rest, wander: Act.Wander };
const MAX_STEP_SEC = 3 * 3600; // a step that takes more than 3 game hours is given up

export class Tasks {
  /** Tasks by person (entity id). Kept in Profile.mind.task too, so they survive a restart. */
  /** Called when a person says something as part of a task. */
  onSay: (i: number, text: string) => void = () => {};
  /** Called when a task ends: done or failed (with why), for the person's memory. */
  onEnd: (id: number, task: Task, ok: boolean, why: string) => void = () => {};
  /** Ask a question that needs the other person's own answer (the planner): resolves 'ok' or why not. */
  onAsk: (a: number, b: number, what: 'marry' | 'divorce') => Promise<string> = async () => 'no one answers';
  private readonly asks = new Map<number, { done: boolean; res: string }>();

  /**
   * What each person really did (entity id -> what -> how many times), counted from the world's events. A step is only done
   * with proof (imad 2026-11-25: "they mark objectives done but they are not done"): a hunt needs that many kills, a build a
   * new building of that kind, a drink a drink... A step that ends without its proof fails with the real reason.
   */
  private readonly did = new Map<number, Map<string, number>>();

  constructor(private w: World) {
    w.listeners.push((ev) => {
      const d = ev.data, id = Number(d.id ?? -1);
      if (!(id >= 0)) return;
      const keys: string[] = [];
      switch (ev.kind) {
        case 'hunt': keys.push('hunt'); break;
        case 'build': keys.push('build', `build:${String(d.what)}`); break;
        case 'craft': keys.push(`craft:${String(d.what)}`); break;
        case 'pickup': case 'store': case 'take': case 'loot': case 'repair': case 'heal': case 'tend': case 'drink': case 'eat': case 'sleep': case 'give': case 'destroy':
          keys.push(ev.kind); break;
        default: return;
      }
      let m = this.did.get(id);
      if (!m) this.did.set(id, (m = new Map()));
      for (const k of keys) m.set(k, (m.get(k) ?? 0) + 1);
    });
  }

  /** How many times person `id` did `what` so far (events counted since the server started). */
  didCount(id: number, what: string): number { return this.did.get(id)?.get(what) ?? 0; }

  /** The proof a finished step needs: [event key, how many] (null = the step checks its outcome itself, or nothing to check). */
  private proof(s: Step): [string, number] | null {
    const what = s.what ?? '';
    switch (s.do) {
      case 'hunt': return ['hunt', Math.max(1, Math.min(6, s.times ?? 1))];
      case 'build': { const th = thingOf(what, 'build'); return [th === 'farm' || th === 'field' ? 'build:field' : `build:${th}`, 1]; }
      case 'craft': return [`craft:${thingOf(what, 'craft')}`, 1];
      case 'farm': return ['build:field', 1];
      case 'tend': case 'store': case 'take': case 'loot': case 'repair': case 'heal': case 'drink': case 'eat': case 'destroy': return [s.do, 1];
      case 'bring': return ['give', 1];
      case 'forage': case 'collect': return ['pickup', 1];
      default: return null;
    }
  }
  /** Is the step's outcome real? (some outcomes need no new event: a tool already owned, hands already full of food). */
  private proved(i: number, s: Step): boolean {
    const pr = this.proof(s);
    if (!pr) return true;
    const w = this.w, e = w.e, id = e.id(i);
    const got = this.didCount(id, pr[0]) - (s.p0 ?? 0);
    if (got >= pr[1]) return true;
    if (s.do === 'craft') return (w.survival.inv(i)[thingOf(s.what ?? '', 'craft')] ?? 0) >= 1; // "make an axe" with one in the bag
    if (s.do === 'collect' || s.do === 'forage') return e.carry[i]! >= 5 || (s.do === 'forage' && this.didCount(id, 'eat') - (s.n0 ?? 0) > 0);
    if (s.do === 'sleep') return true;
    return false;
  }

  private taskOf(id: number): Task | undefined { return this.w.profiles.get(id)?.mind?.task as Task | undefined; }

  /** Give person i a task (replaces the one they had). */
  start(i: number, text: string, from: string, steps: Step[]): boolean {
    const w = this.w, p = w.profileOf(i);
    if (!p || !steps.length) return false;
    p.mind ??= { notes: [], summary: '', mood: 'calm', rel: {}, lastPlan: 0 };
    w.survival.cancel(w.e.id(i));
    p.mind.task = { text: text.slice(0, 120), from, steps: steps.slice(0, 8), k: 0, started: w.gameSec };
    w.brain.order(i, 'stop', -1, -1, 0);
    return true;
  }

  stop(i: number): void {
    const p = this.w.profileOf(i);
    if (p?.mind?.task) { delete p.mind.task; this.w.survival.cancel(this.w.e.id(i)); this.w.brain.order(i, 'stop', -1, -1, 0); }
  }

  /** Once a game-second or so (World.step every 20 ticks). */
  update(): void {
    const w = this.w, e = w.e;
    for (let i = 0; i < e.hi; i++) {
      if (e.kind[i] !== Kind.Agent || e.map[i] === NO_MAP) continue;
      const t = this.taskOf(e.id(i));
      if (!t || w.clans.duelling(i)) continue; // a fight with a person comes first: the task waits
      const s = t.steps[t.k];
      if (!s) { this.end(i, t, true, ''); continue; }
      if (s.who === -2) { // "found": the person the last find step found
        for (let k = t.k - 1; k >= 0; k--) if (t.steps[k]!.do === 'find' && (t.steps[k]!.who ?? -1) >= 0) { s.who = t.steps[k]!.who; break; }
        if (s.who === -2) { this.end(i, t, false, 'I did not find anyone'); continue; }
      }
      if (s.t0 === undefined) {
        s.t0 = w.gameSec; s.phase = 0;
        const pr = this.proof(s);
        s.p0 = pr ? this.didCount(e.id(i), pr[0]) : 0;
        if (s.do === 'forage') s.n0 = this.didCount(e.id(i), 'eat');
      }
      else if (w.gameSec - s.t0 > MAX_STEP_SEC) { if (s.key) w.colony.record(i, s.key, false, 0, 0); this.end(i, t, false, `${s.do} took too long`); continue; }
      let r = this.run(i, s, t);
      // Done only with proof: a hunt that killed nothing, a build with no new building, a drink never drunk is not done.
      if (r === true && !this.proved(i, s)) r = `I did not manage to ${s.do === 'bring' ? 'bring it' : s.do + (s.what ? ' ' + String(s.what).trim().slice(0, 40) : '')}`;
      if (r === true) { if (s.key) w.colony.record(i, s.key, true, w.gameSec - (s.t0 ?? w.gameSec), s.units ?? s.times ?? 1); t.k++; if (t.k >= t.steps.length) this.end(i, t, true, ''); }
      else if (typeof r === 'string') { if (s.key) w.colony.record(i, s.key, false, 0, 0); this.end(i, t, false, r); }
    }
  }

  private end(i: number, t: Task, ok: boolean, why: string): void {
    const p = this.w.profileOf(i)!;
    delete p.mind!.task;
    // Objectives reward (imad 2026-11-20: "make objectives rewarding, specially the ones I ordered"): points, a level now and
    // then (a little stronger, braver, smarter), pride, more trust in who asked; failing still counts a little for trying.
    const ordered = t.from !== 'myself', steps = Math.max(1, t.steps.length);
    const xp = ok ? Math.round((ordered ? 25 : 10) + steps * (ordered ? 5 : 2)) : Math.min(5, t.k * 2);
    const before = levelOf(p.xp);
    p.xp = (p.xp ?? 0) + xp;
    (p.goals ??= []).push({ text: t.text, from: t.from, ok, at: this.w.gameSec, xp });
    if (p.goals.length > 10) p.goals.splice(0, p.goals.length - 10);
    const e = this.w.e;
    if (ok) {
      p.mind!.mood = ordered ? 'proud' : 'satisfied';
      e.lonely[i] = Math.max(0, e.lonely[i]! - (ordered ? 25 : 10));
      e.hp[i] = Math.min(this.w.sc.agents.hp, e.hp[i]! + 10);
      if (ordered && t.from !== 'owner') { const k = '@' + t.from; p.mind!.rel[k] = Math.min(5, (p.mind!.rel[k] ?? 0) + 1); }
    }
    const level = levelOf(p.xp);
    if (level > before) {
      for (const k of TRAIT_KEYS) if (k !== 'metabolism') p.traits[k] = Math.min(1, p.traits[k] + 0.02);
      this.w.emit('levelup', { id: e.id(i), level });
    }
    if (xp && ordered) this.w.emit('reward', { id: e.id(i), text: t.text, from: t.from, ok, xp, total: p.xp });
    this.w.survival.cancel(this.w.e.id(i));
    this.w.brain.order(i, 'stop', -1, -1, 0);
    this.w.emit('task', { id: this.w.e.id(i), text: t.text, ok, why });
    if (t.rule) this.w.rules.ended(i, t.rule, ok, why);
    this.onEnd(this.w.e.id(i), t, ok, why);
    // A planned task that failed: plan again from here (sim/colony.ts), the failed way now dearer.
    if (t.goal) {
      const again = !ok && this.w.e.slot(this.w.e.id(i)) === i && this.w.colony.replan(i, t.goal, t.text, t.from, t.tries ?? 0);
      if (!again) this.w.colony.outcome(i, t.goal, ok);
    }
  }

  /** One step: true = done, a string = failed (why), false = still on it. */
  private run(i: number, s: Step, t: Task): boolean | string {
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
    // The owner's strict rules come first: a step they forbid ends the task (sim/rules.ts).
    if (first) {
      const rn = s.do === 'find' || s.do === 'stay' || s.do === 'rest' || s.do === 'say' ? '' : s.do;
      const rule = rn ? w.rules.forbidden(i, rn, alive(s.who) ? e.slot(s.who!) : -1) : null;
      if (rule) return `I must not: "${rule}"`;
    }
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
      case 'npc': { // a town teacher: walk there, talk (take / hand in a quest)
        const key = String(s.what ?? 'guide').toLowerCase().replace(/[^a-z]/g, '');
        const k = (['guide', 'smith', 'hunter', 'warden', 'registrar'] as const).find((x) => key.includes(x)) ?? (/elder|mara/.test(key) ? 'guide' : /joren|forge/.test(key) ? 'smith' : /sela|hunt/.test(key) ? 'hunter' : /bram|guard/.test(key) ? 'warden' : /odile|clan|regist/.test(key) ? 'registrar' : 'guide');
        const j = w.quests.npcSlot(k);
        if (j < 0 || e.map[j] !== e.map[i]) return `the ${k} is not in this place`;
        if (Math.hypot(e.x[j]! - e.x[i]!, e.y[j]! - e.y[i]!) > 3) { if (b.orderOf(i).kind !== 'goto') b.order(i, 'goto', e.id(j), -1, 180); return false; }
        b.order(i, 'stop', -1, -1, 0);
        const r = w.quests.talk(i, k);
        if (r.state === 'handed') this.onSay(i, 'Thank you, I will remember that.');
        else if (r.state === 'taken') this.onSay(i, 'I will do it.');
        return true;
      }
      case 'clan':
        return w.clans.step(i, s, first);
      case 'follow': {
        if (!alive(s.who)) return 'they are not here any more';
        if (first) { b.order(i, 'follow', s.who!, -1, s.minutes ?? 60); s.phase = 1; return false; }
        return b.orderOf(i).kind === 'follow' ? false : true; // the order ends by itself after `minutes`
      }
      case 'marry': case 'divorce': {
        // Walk to them, then ask: "will you marry me?" / "I want a divorce". Their own answer (the AI, or built in) decides.
        if (!alive(s.who)) return 'they are not here any more';
        const me = e.id(i), q0 = this.asks.get(me);
        if (!q0) {
          const r = reach(s.who!);
          if (r !== true) return r;
          const j0 = e.slot(s.who!);
          b.order(i, 'stop', -1, -1, 0);
          b.listen(i, j0, 20);
          if (e.kind[j0] === Kind.Agent) b.listen(j0, i, 20);
          const q = { done: false, res: '' };
          this.asks.set(me, q);
          this.onSay(i, s.do === 'marry' ? 'Will you marry me?' : 'I want a divorce.');
          void this.onAsk(i, j0, s.do as 'marry' | 'divorce').then((res) => { q.done = true; q.res = res; }, () => { q.done = true; q.res = 'no answer'; });
          return false;
        }
        if (!q0.done) return false;
        this.asks.delete(me);
        return q0.res === 'ok' ? true : q0.res;
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
      case 'give': case 'trade': {
        const what = resOf(s.what);
        if (s.do === 'give' && what === 'food' && !s.text) { s.do = 'bring'; return false; } // food: the bring order (fetches some if needed)
        if (!alive(s.who)) return 'they are not here any more';
        if (s.phase !== 2) { const r = reach(s.who!); if (r !== true) return r; s.phase = 2; }
        const j = e.slot(s.who!), sv = w.survival;
        const have = (k: number, r: string) => (r === 'food' ? e.carry[k]! : (sv.inv(k) as Record<string, number>)[r] ?? 0);
        const move = (from: number, to: number, r: string, n: number) => {
          if (r === 'food') { e.carry[from]! -= n; e.carry[to] = Math.min(5, e.carry[to]! + n); }
          else { (sv.inv(from) as Record<string, number>)[r] = have(from, r) - n; (sv.inv(to) as Record<string, number>)[r] = Math.min(20, have(to, r) + n); }
        };
        const n = Math.max(1, Math.min(have(i, what), s.times ?? 1));
        if (have(i, what) <= 0) return `I have no ${what}`;
        if (s.do === 'trade') {
          const get = resOf(s.text, 'food');
          if (have(j, get) <= 0) return `${this.name(s.who!)} has no ${get}`;
          move(j, i, get, 1);
        }
        move(i, j, what, n);
        w.emit('give', { id: e.id(i), to: s.who, item: what, n, trade: s.do === 'trade' ? resOf(s.text, 'food') : undefined });
        return true;
      }
      case 'collect': case 'store': case 'take': case 'loot': case 'farm': case 'repair': case 'heal': case 'destroy': {
        const sv = w.survival, id = e.id(i);
        const what = resOf(s.what);
        if (s.do === 'collect' && what !== 'food') { s.do = 'gather'; s.what = what; s.phase = 0; return false; }
        if (s.do === 'repair' && first && (sv.inv(i).wood ?? 0) < 1 && t.steps.length < 12) { t.steps.splice(t.k, 0, { do: 'gather', what: 'wood', times: 2 }); s.t0 = undefined; return false; }
        if (s.do === 'store' && what === 'food' && first && e.carry[i]! <= 0 && t.steps.length < 12) { t.steps.splice(t.k, 0, { do: 'collect', what: 'food', times: 3 }); s.t0 = undefined; return false; }
        // Several times: collect / take / loot count down.
        if (first) { s.phase = 1; s.n0 = Math.max(1, Math.min(s.do === 'take' ? 5 : 8, s.times ?? (s.do === 'collect' ? 3 : 1))); }
        if (sv.busy(id)) return false;
        const end = sv.ended.get(id);
        if (end !== undefined && s.got) {
          sv.ended.delete(id); s.got = false;
          if (end !== true) return s.do === 'collect' && (s.fails = (s.fails ?? 0) + 1) < 3 ? false : end;
          if (s.do === 'take' || s.do === 'store' || --s.n0! <= 0) return true;
        }
        if (s.do === 'collect' && e.carry[i]! >= 5) return true; // hands full
        s.got = true;
        const r = s.do === 'collect' ? sv.collect(i) : s.do === 'store' ? sv.store(i, what) : s.do === 'take' ? sv.take(i, what, s.n0!)
          : s.do === 'loot' ? sv.loot(i) : s.do === 'farm' ? sv.plant(i) : s.do === 'repair' ? sv.repair(i) : s.do === 'destroy' ? sv.wreck(i, String(s.what ?? '').toLowerCase()) : sv.heal(i, s.who ?? -1);
        if (r !== true) { s.got = false; return r; }
        return false;
      }
      case 'bring': {
        if (!alive(s.who)) return 'they are not here any more';
        if (first) { b.order(i, 'bring', s.who!, -1, 180); s.phase = 1; return false; }
        return b.orderOf(i).kind === 'bring' ? false : near(s.who!, 4) ? true : 'I could not reach them';
      }
      case 'tame': {
        // Walk up to a wild horse (calmly: running people scare horses, sim/horses.ts), then try; each try makes it trust them
        // a little more. Up to 8 tries, then they give up.
        const H = w.horses;
        if (first) { s.phase = 1; s.n0 = 0; s.who = -1; if (w.rules.forbidden(i, 'tame')) return 'I must not tame horses'; }
        let h = (s.who ?? -1) >= 0 ? e.slot(s.who!) : -1;
        if (h >= 0 && H.owned(h)) { if (H.of(h)!.owner === e.id(i)) { b.order(i, 'stop', -1, -1, 0); return true; } h = -1; } // someone else got it first
        if (h < 0) {
          h = H.nearestWild(i, 160);
          if (h < 0) return 'there are no wild horses near here';
          s.who = e.id(h);
          b.order(i, 'follow', s.who, -1, 120);
          return false;
        }
        if (Math.hypot(e.x[h]! - e.x[i]!, e.y[h]! - e.y[i]!) > 3.3) { if (b.orderOf(i).kind !== 'follow') b.order(i, 'follow', s.who!, -1, 120); return false; }
        const r = H.tame(i, h);
        if (r.code === 'tamed') { b.order(i, 'stop', -1, -1, 0); return true; }
        if (r.code === 'wait' || r.code === 'tooFar') return false;
        if (r.code === 'forbidden') return 'I must not tame horses';
        if (r.code === 'tooYoung') return 'I am too young';
        if ((s.n0 = (s.n0 ?? 0) + 1) >= 8) { b.order(i, 'stop', -1, -1, 0); return `${r.name ?? 'the horse'} would not let me tame it`; }
        return false;
      }
      case 'hunt': {
        const id = e.id(i);
        const want = Math.max(1, Math.min(6, s.times ?? 1));
        if (first) { s.phase = 1; s.n0 = this.didCount(id, 'hunt'); s.got = false; }
        if (b.huntOf(i) >= 0) return false;
        if (s.got) {
          s.got = false;
          // Kills counted from the world's hunt events since this step began (not "the last kill", which may be old or another's).
          if (this.didCount(id, 'hunt') - s.n0! >= want) return true;
          // This chase got nothing (no kill since it began): one escape more.
          if (this.didCount(id, 'hunt') === (s.n1 ?? s.n0!) && (s.fails = (s.fails ?? 0) + 1) >= (w.ai.instinct ? 3 : 2)) return 'it got away';
        }
        s.n1 = this.didCount(id, 'hunt');
        const r = w.survival.hunt(i, s.what ?? '');
        if (r !== true) return r;
        s.got = true;
        return false;
      }
      case 'gather': {
        const what = /herb|herbe|hierba|عشب|أعشاب/.test(s.what ?? '') ? 'herb' : /wood|bois|madera|حطب|خشب|tree|log/.test(s.what ?? 'wood') ? 'wood' : /scrap|metal|ferraille|chatarra|خردة/.test(s.what ?? '') ? 'scrap'
          : /\bore\b|iron|minerai|hierro|خام|حديد/.test(s.what ?? '') ? 'ore' : /brick|brique|ladrillo|طوب/.test(s.what ?? '') ? 'brick'
          : /leather|hide|cuir|cuero|جلد/.test(s.what ?? '') ? 'leather' : /claw|griffe|garra|مخلب/.test(s.what ?? '') ? 'claw'
          : /stone|rock|pierre|piedra|حجر/.test(s.what ?? '') ? 'stone' : /food|berr|eat|manger|comida|طعام|meat|viande|carne|لحم/.test(s.what ?? '') ? (/meat|viande|carne|لحم/.test(s.what ?? '') ? 'meat' : 'food') : 'wood';
        if (what === 'food') { s.do = 'forage'; s.phase = 0; return false; }
        if (what === 'meat' || what === 'leather' || what === 'claw') { s.do = 'hunt'; s.what = what === 'claw' ? 'wolf' : ''; s.phase = 0; return false; }
        const sv = w.survival, id = e.id(i), have = () => sv.inv(i)[what] ?? 0;
        if (first) { s.n0 = have(); s.phase = 1; }
        const want = Math.max(1, Math.min(12, s.times ?? 3));
        if (have() >= Math.min(20, s.n0! + want)) return true;
        if (sv.busy(id)) return false;
        const end = sv.ended.get(id);
        if (typeof end === 'string' && s.got) { sv.ended.delete(id); if ((s.fails = (s.fails ?? 0) + 1) >= 3) return end; }
        s.got = true;
        const r = sv.gather(i, what);
        return r === true ? false : r;
      }
      case 'craft': case 'build': {
        const sv = w.survival, id = e.id(i);
        const what = s.do === 'craft' ? thingOf(s.what ?? '', 'craft') : thingOf(s.what ?? '', 'build');
        if (first) {
          s.phase = 1;
          const miss = (sv.inv(i)[what] ?? 0) > 0 ? [] : sv.missing(i, what);
          // With planning on, the way to get there is planned from what they carry and what is around (sim/colony.ts):
          // ore from the rocks across town, leather from a hunt, a spear first for a dangerous animal. No way = an honest why.
          if (miss.length && w.ai.goap && !s.planned && t.steps.length < 12) {
            const p = w.colony.planTo(i, s.do === 'craft' ? 'craft' : 'build', what);
            if (typeof p === 'string') return p;
            s.planned = true;
            const last = p[p.length - 1], before = (last && last.do === s.do && last.what === what ? p.slice(0, -1) : p).map((x) => ({ ...x }));
            if (before.length) { t.steps.splice(t.k, 0, ...before); s.t0 = undefined; return false; }
          }
          if (miss.length && t.steps.length < 12) { // get the materials first
            t.steps.splice(t.k, 0, ...miss.map(([res, n]) => ({ do: 'gather', what: res, times: n } as Step)));
            s.t0 = undefined; // its own time starts when it comes back to it
            return false;
          }
        }
        if (s.do === 'craft') return sv.craft(i, what);
        if (s.phase === 1) { const r = sv.build(i, what as 'hut'); if (r !== true) return r; s.phase = 2; return false; }
        if (sv.busy(id)) return false;
        const end = sv.ended.get(id); sv.ended.delete(id);
        return end ?? true;
      }
      case 'tend': {
        const sv = w.survival, id = e.id(i);
        if (first) {
          s.phase = 1;
          if ((sv.inv(i).wood ?? 0) < 1 && t.steps.length < 12) { t.steps.splice(t.k, 0, { do: 'gather', what: 'wood', times: 2 }); s.t0 = undefined; return false; }
        }
        if (s.phase === 1) { const r = sv.tend(i); if (r !== true) return r; s.phase = 2; return false; }
        if (sv.busy(id)) return false;
        const end = sv.ended.get(id); sv.ended.delete(id);
        return end ?? true;
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
      if (single && (p.partner >= 0 || ageOf(p, now, y) < ADULT + 2 || (me && w.family.close(e.id(i), e.id(j))))) continue;
      const d = Math.hypot(e.x[j]! - e.x[i]!, e.y[j]! - e.y[i]!);
      if (d < bd) { bd = d; best = e.id(j); }
    }
    return best;
  }

  private name(id: number): string { return this.w.profiles.get(id)?.name ?? 'them'; }

  /** The objective in progress: what, who asked, steps done / all, the step now, 0..100. */
  progress(id: number): { text: string; from: string; k: number; n: number; step: string; pct: number } | null {
    const t = this.taskOf(id);
    if (!t) return null;
    const s = t.steps[t.k], n = Math.max(1, t.steps.length);
    return { text: t.text, from: t.from, k: t.k, n, step: s ? s.do + (s.who !== undefined && s.who >= 0 ? ' ' + this.name(s.who) : s.what ? ' ' + s.what : '') : 'done', pct: Math.round((t.k / n) * 100) };
  }

  /** "find a wife: step 2 of 3, talk with Ines" for the panel and the bubbles. */
  describe(id: number): string {
    const t = this.taskOf(id);
    if (!t) return '';
    const s = t.steps[t.k];
    return `${t.text} (step ${t.k + 1}/${t.steps.length}: ${s ? s.do + (s.who !== undefined && s.who >= 0 ? ' ' + this.name(s.who) : s.what ? ' ' + s.what : '') : 'done'})`;
  }
}
