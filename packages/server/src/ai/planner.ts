/**
 * The LLM layer of the hybrid AI (milestone 6). The built-in brain (sim/brain.ts) keeps every person alive tick by
 * tick; the planner, a few times per game day, asks the model what each person WANTS (a wish: talk to someone, rest,
 * forage...) and what they say, and keeps their memory. A wish is only a bonus in the brain's choice, so a desperate
 * need always wins and a slow or failing model never stops the world.
 *
 *  - Batching: one request plans for up to `batch` people of one map.
 *  - Priority: people with something new and big (a death, a supply drop, a chat) first, then the longest waiting.
 *  - Budget: the planner leaves 20 % of the hourly AI budget for chats, waits `minGapSec` between its requests,
 *    and runs one request at a time.
 *  - Memory: short-term notes (last 12 events), a long-term summary the model rewrites, mood, feelings about others.
 *  - Chat: the owner (panel) or a player (A next to someone on the TV) talks to a person; built-in lines when AI is off.
 * Planner code only uses `Ai`, never a provider directly.
 */
import { Act, Kind } from '@worldsim/protocol';
import type { Ai } from './llm.js';
import { parseJsonReply } from './llm.js';
import type { Logger } from '../log.js';
import type { World, WorldEvent } from '../sim/world.js';
import { NO_MAP } from '../sim/entities.js';
import { ageOf, type Mind } from '../sim/people.js';

export interface PlannerConfig {
  on: boolean;
  /** Each person is planned again after this many game hours. */
  everyGameHours: number;
  /** People per request. */
  batch: number;
  /** Real seconds between two planning requests. */
  minGapSec: number;
}
export const PLANNER_DEFAULTS: PlannerConfig = { on: true, everyGameHours: 3, batch: 5, minGapSec: 20 };

export interface Exchange { at: number; kind: 'plan' | 'chat'; who: string; prompt: string; reply: string; ms: number; err?: string }

const GOALS: Record<string, number> = {
  drink: Act.Drink, eat: Act.Eat, forage: Act.Forage, sleep: Act.Sleep, talk: Act.Talk, wander: Act.Wander, rest: Act.Rest, travel: Act.Travel,
};
const ACT_TEXT = ['standing', 'walking around', 'going for water', 'eating', 'looking for food', 'sleeping', 'talking', 'travelling', 'resting', 'running away'];
const NOTES_MAX = 12;
const HOUR = 3600;

/** Words for a need (0 fine .. 100 desperate). */
function level(v: number): string { return v < 25 ? 'fine' : v < 50 ? 'a little' : v < 75 ? 'quite' : v < 92 ? 'very' : 'desperately'; }
/** Strip what models add around an answer: <think> blocks, quotes, a "Name:" prefix. */
export function cleanLine(text: string, name: string): string {
  let t = text.replace(/<think>[\s\S]*?<\/think>/gi, '').replace(/<\/?think>/gi, '').trim();
  t = t.replace(new RegExp(`^\\s*\\**${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\**\\s*:\\s*`, 'i'), '');
  t = t.replace(/^\s*\**[A-Z][\w'-]{1,20}( \d+)?\**\s*:\s*(?=["“«])/, ''); // another "Name:" before a quote
  t = t.replace(/^["“”'«»\s]+|["“”'«»\s]+$/g, '').replace(/\s+/g, ' ');
  return t.slice(0, 220);
}

/** What the speaker asks for, from their words (en / fr / es / ar): 'come' | 'follow' | 'stay' | 'stop' | ''. */
export function askedFor(text: string): string {
  const t = ' ' + text.toLowerCase() + ' ';
  if (/\b(follow me|come with me|suis[- ]moi|suivez[- ]moi|viens avec moi|s[ií]gueme|ven conmigo)\b|اتبعني|إتبعني|تعال معي|تبعني/.test(t)) return 'follow';
  if (/\b(come( here| to me| over| find me| search for me)?|get over here|viens|venez|rejoins[- ]moi|ven( aquí| aca| acá)?|ven a buscarme|búscame|buscame)\b|تعال|تعالي|اجي|أجي|ارواح/.test(t) && !/\b(come on|comment|venir de|welcome)\b/.test(t)) return 'come';
  if (/\b(stay( here)?|wait( here| for me)?|don't move|attends|reste( ici)?|espera|quédate|quedate)\b|انتظر|ابق|إبق|استنى/.test(t)) return 'stay';
  if (/\b(stop following|forget it|never ?mind|laisse tomber|olvídalo|olvidalo)\b|انس الأمر/.test(t)) return 'stop';
  return '';
}
/** Does an answer agree to come ("I'm coming", "on my way", "j'arrive", "voy", "حاضر")? */
export function agrees(text: string): boolean {
  return /\b(i'?m coming|coming|on my way|be right there|i'?ll come|ok(ay)?|sure|yes|alright|j'arrive|j'y vais|d'accord|oui|voy|vale|claro|s[ií]|ya voy)\b|حاضر|نعم|حسنا|حسناً|جاي|قادم|آتي|طيب/i.test(text);
}

export class Planner {
  cfg: PlannerConfig;
  readonly log: Exchange[] = [];
  readonly counts = { batches: 0, plans: 0, chats: 0, failures: 0, builtIn: 0 };
  private busy = false;
  private lastRunAt = 0;
  /** Lines said, for the viewers and the panel (App forwards them). */
  onSay: (i: number, text: string) => void = () => {};

  constructor(private w: World, private ai: Ai, private logger: Logger, cfg?: Partial<PlannerConfig>) {
    this.cfg = { ...PLANNER_DEFAULTS, ...cfg };
    // Wishes from before a restart still count.
    for (let i = 0; i < w.e.hi; i++) {
      const p = w.e.kind[i] === Kind.Agent ? w.profileOf(i) : undefined;
      const pl = p?.mind?.plan;
      if (pl && pl.until > w.gameSec && GOALS[pl.act] !== undefined) w.brain.wish(i, GOALS[pl.act]!, pl.with ?? -1, pl.until);
    }
    w.listeners.push((ev) => this.onEvent(ev));
  }

  set(p: Partial<PlannerConfig>): PlannerConfig {
    const n = (v: unknown, lo: number, hi: number, name: string) => {
      if (typeof v !== 'number' || !Number.isFinite(v) || v < lo || v > hi) throw new Error(`bad ${name}`);
      return v;
    };
    const c = { ...this.cfg };
    if (p.on !== undefined) c.on = p.on === true;
    if (p.everyGameHours !== undefined) c.everyGameHours = n(p.everyGameHours, 0.25, 48, 'everyGameHours');
    if (p.batch !== undefined) c.batch = Math.round(n(p.batch, 1, 10, 'batch'));
    if (p.minGapSec !== undefined) c.minGapSec = n(p.minGapSec, 2, 3600, 'minGapSec');
    this.cfg = c;
    return c;
  }

  status(): Record<string, unknown> { return { ...this.cfg, busy: this.busy, counts: { ...this.counts } }; }

  // ------------------------------------------------------------------ memory
  mind(id: number): Mind | undefined {
    const p = this.w.profiles.get(id);
    if (!p) return undefined;
    p.mind ??= { notes: [], summary: '', mood: 'calm', rel: {}, lastPlan: this.w.gameSec - 1e9 };
    return p.mind;
  }
  note(id: number, text: string, urgent = false): void {
    const m = this.mind(id);
    if (!m) return;
    m.notes.push({ at: this.w.gameSec, text: text.slice(0, 200) });
    if (m.notes.length > NOTES_MAX) m.notes.splice(0, m.notes.length - NOTES_MAX);
    if (urgent) m.urgent = true;
  }
  private feel(id: number, key: string, d: number): void {
    const m = this.mind(id);
    if (m) m.rel[key] = Math.max(-5, Math.min(5, (m.rel[key] ?? 0) + d));
  }
  private name(id: number): string { return this.w.profiles.get(id)?.name ?? 'someone'; }
  /** Living people on map m (slots). */
  private onMap(m: number): number[] {
    const e = this.w.e, out: number[] = [];
    for (let i = 0; i < e.hi; i++) if (e.kind[i] === Kind.Agent && e.map[i] === m) out.push(i);
    return out;
  }

  private onEvent(ev: WorldEvent): void {
    const d = ev.data as Record<string, any>, w = this.w;
    switch (ev.kind) {
      case 'talk':
        this.note(d.a, `Talked with ${this.name(d.b)}.`); this.note(d.b, `Talked with ${this.name(d.a)}.`);
        this.feel(d.a, '#' + d.b, 0.5); this.feel(d.b, '#' + d.a, 0.5);
        break;
      case 'death': {
        const m = w.mapIndex.get(String(d.map));
        if (m === undefined) break;
        for (const i of this.onMap(m)) if (w.e.id(i) !== d.id) this.note(w.e.id(i), `${this.name(d.id)} died (${d.cause}).`, true);
        break;
      }
      case 'supply': {
        const m = w.mapIndex.get(String(d.map));
        if (m === undefined) break;
        for (const i of this.onMap(m)) this.note(w.e.id(i), `A supply drop of ${d.n} food fell near (${Math.round(d.x)}, ${Math.round(d.y)}).`, true);
        break;
      }
      case 'pickup': this.note(d.id, `Found ${d.item}.`); break;
      case 'travel': this.note(d.id, `Left for ${w.maps[w.mapIndex.get(String(d.to)) ?? 0]?.def.name ?? d.to}.`); break;
      case 'arrive': this.note(d.id, 'Arrived in a new place.', true); break;
    }
  }

  // ------------------------------------------------------------------ planning
  /** Called every couple of real seconds by the App: maybe send one planning request. */
  async tick(paused = false): Promise<void> {
    const st = this.ai.status();
    if (!this.cfg.on || !st.ready || this.busy || paused) return;
    if (Date.now() - this.lastRunAt < this.cfg.minGapSec * 1000) return;
    if (st.callsLastHour >= st.maxCallsPerHour * 0.8) return; // keep the rest for chats
    const w = this.w, e = w.e, due = w.gameSec - this.cfg.everyGameHours * HOUR;
    // Who is due, by map: urgent first, then the longest waiting.
    const cand: { i: number; m: number; urgent: boolean; last: number }[] = [];
    for (let i = 0; i < e.hi; i++) {
      if (e.kind[i] !== Kind.Agent || e.map[i] === NO_MAP) continue;
      const mind = this.mind(e.id(i));
      if (!mind) continue;
      if (mind.urgent || mind.lastPlan <= due) cand.push({ i, m: e.map[i]!, urgent: !!mind.urgent, last: mind.lastPlan });
    }
    if (!cand.length) return;
    cand.sort((a, b) => (a.urgent === b.urgent ? a.last - b.last : a.urgent ? -1 : 1));
    const m = cand[0]!.m;
    const batch = cand.filter((c) => c.m === m).slice(0, this.cfg.batch).map((c) => c.i);
    await this.plan(batch);
  }

  /** One request for these people (slots on one map). */
  async plan(slots: number[]): Promise<number> {
    const w = this.w, e = w.e;
    this.busy = true; this.lastRunAt = Date.now();
    const ids = slots.map((i) => e.id(i));
    for (const id of ids) { const m = this.mind(id)!; m.lastPlan = w.gameSec; m.urgent = false; }
    const prompt = this.planPrompt(slots);
    const system = 'You decide what survivors in a post-apocalyptic world want to do next. Stay in character, be practical, '
      + 'keep lines short and natural. Answer ONLY with JSON: {"people":[{"name":"...","goal":"...","with":"name or empty",'
      + '"why":"short reason","say":"one short line they say aloud, or empty","mood":"one word","memory":"their updated long-term memory, '
      + 'at most 300 characters"}]}';
    const ex: Exchange = { at: Date.now(), kind: 'plan', who: ids.map((id) => this.name(id)).join(', '), prompt, reply: '', ms: 0 };
    let applied = 0;
    try {
      const r = await this.ai.generate({ system, prompt, json: true, maxTokens: 220 * slots.length + 100, temperature: 0.8 });
      ex.reply = r.text.slice(0, 6000); ex.ms = r.ms;
      const j = parseJsonReply<{ people?: unknown[] }>(r.text.replace(/<think>[\s\S]*?<\/think>/gi, ''));
      const list = Array.isArray(j?.people) ? j!.people : Array.isArray(j) ? (j as unknown[]) : null;
      if (!list) throw new Error('the answer had no "people" list');
      applied = this.applyPlans(ids, list);
      this.counts.batches++; this.counts.plans += applied;
      if (!applied) throw new Error('no usable plan in the answer');
    } catch (err) {
      ex.err = err instanceof Error ? err.message : String(err);
      this.counts.failures++;
      this.logger.debug('planner failed', { err: ex.err });
    } finally {
      this.busy = false;
      this.keep(ex);
    }
    return applied;
  }

  private applyPlans(ids: number[], list: unknown[]): number {
    const w = this.w, e = w.e;
    let n = 0;
    for (const raw of list) {
      if (!raw || typeof raw !== 'object') continue;
      const p = raw as Record<string, unknown>;
      const name = String(p.name ?? '').trim().toLowerCase();
      const id = ids.find((x) => this.name(x).toLowerCase() === name) ?? (list.length === 1 && ids.length === 1 ? ids[0] : undefined);
      if (id === undefined) continue;
      const i = e.slot(id), mind = this.mind(id)!;
      if (i < 0) continue;
      const goal = String(p.goal ?? '').trim().toLowerCase();
      const act = GOALS[goal];
      const withName = String(p.with ?? '').trim().toLowerCase();
      let withId = -1;
      if (withName) for (const [oid, op] of w.profiles) if (op.name.toLowerCase() === withName && e.slot(oid) >= 0 && oid !== id) { withId = oid; break; }
      if (typeof p.mood === 'string' && p.mood.trim()) mind.mood = p.mood.trim().slice(0, 30);
      if (typeof p.memory === 'string' && p.memory.trim()) mind.summary = p.memory.trim().slice(0, 400);
      if (act !== undefined) {
        const until = w.gameSec + this.cfg.everyGameHours * HOUR;
        mind.plan = { act: goal, with: withId >= 0 ? withId : undefined, why: String(p.why ?? '').slice(0, 160), until };
        w.brain.wish(i, act, withId, until);
        n++;
      }
      const say = typeof p.say === 'string' ? cleanLine(p.say, this.name(id)) : '';
      if (say) this.say(i, say);
    }
    return n;
  }

  private planPrompt(slots: number[]): string {
    const w = this.w, e = w.e, m = e.map[slots[0]!]!, place = w.maps[m]!.def.name;
    const goals = ['drink', 'eat (only when carrying food)', 'forage', 'sleep', 'talk (say with whom)', 'wander', 'rest', ...(w.travelOpen ? ['travel (to another place)'] : [])];
    const lines = [`Time: ${this.clock()}. Place: ${place}. Travel to other places is ${w.travelOpen ? 'open' : 'closed'}.`, `Possible goals: ${goals.join(', ')}.`, ''];
    for (const i of slots) lines.push(this.describe(i), '');
    lines.push('For each person above, give one entry in "people".');
    return lines.join('\n');
  }

  /** A person as the model sees them. */
  private describe(i: number): string {
    const w = this.w, e = w.e, id = e.id(i), p = w.profileOf(i)!, mind = this.mind(id)!;
    const near: string[] = [];
    for (let j = 0; j < e.hi; j++) {
      if (j === i || e.map[j] !== e.map[i] || (e.kind[j] !== Kind.Agent && e.kind[j] !== Kind.Player)) continue;
      const d = Math.hypot(e.x[j]! - e.x[i]!, e.y[j]! - e.y[i]!);
      if (d > 80) continue;
      const nm = e.kind[j] === Kind.Player ? `${this.nameOfId(e.id(j))} (a player)` : this.name(e.id(j));
      near.push(`${nm} (${Math.round(d)} m, ${ACT_TEXT[e.act[j]!] ?? 'standing'})`);
    }
    const rel = Object.entries(mind.rel).filter(([, v]) => Math.abs(v) >= 1).map(([k, v]) => `${k[0] === '#' ? this.name(Number(k.slice(1))) : k.slice(1)} ${v > 0 ? '+' : ''}${Math.round(v)}`);
    const wish = mind.plan && mind.plan.until > w.gameSec ? `${mind.plan.act}${mind.plan.with !== undefined ? ' with ' + this.name(mind.plan.with) : ''}` : 'none';
    return [
      `Person: ${p.name} (${p.sex === 'f' ? 'woman' : 'man'}, ${Math.floor(ageOf(p, w.gameSec, w.yearSec))}; ${p.personality.join(', ')}; mood: ${mind.mood})`,
      `Hungry: ${level(e.hunger[i]!)}. Thirsty: ${level(e.thirst[i]!)}. Tired: ${level(e.tired[i]!)}. Lonely: ${level(e.lonely[i]!)}. Health ${Math.round(e.hp[i]!)}%. Carrying ${e.carry[i]} food. Now: ${ACT_TEXT[e.act[i]!] ?? 'standing'}. Last wish: ${wish}.`,
      `Near: ${near.length ? near.join('; ') : 'nobody'}.`,
      ...(rel.length ? [`Feelings: ${rel.join(', ')}.`] : []),
      `Memory: ${mind.summary || 'nothing yet'}`,
      `Recent: ${mind.notes.length ? mind.notes.slice(-8).map((n) => `${this.clock(n.at)} ${n.text}`).join(' | ') : 'nothing'}`,
    ].join('\n');
  }

  /** "day 2 14:30 (afternoon)" — the day starts at 08:00 like the viewers show. */
  clock(at = this.w.gameSec): string {
    const h = at / HOUR + 8, day = Math.floor(h / 24) + 1, hh = ((h % 24) + 24) % 24;
    const part = hh < 5 ? 'night' : hh < 12 ? 'morning' : hh < 17 ? 'afternoon' : hh < 21 ? 'evening' : 'night';
    return `day ${day} ${String(Math.floor(hh)).padStart(2, '0')}:${String(Math.floor((hh % 1) * 60)).padStart(2, '0')} (${part})`;
  }

  private say(i: number, text: string): void {
    const w = this.w, e = w.e, id = e.id(i);
    const mind = this.mind(id)!;
    mind.said = { at: w.gameSec, text };
    // Others close by hear it.
    for (let j = 0; j < e.hi; j++) {
      if (j !== i && e.kind[j] === Kind.Agent && e.map[j] === e.map[i] && Math.hypot(e.x[j]! - e.x[i]!, e.y[j]! - e.y[i]!) < 12) this.note(e.id(j), `${this.name(id)} said: "${text}"`);
    }
    w.emit('say', { id, text, map: w.maps[e.map[i]!]?.def.id ?? '' });
    this.onSay(i, text);
  }

  // ------------------------------------------------------------------ chat
  /** Players' characters by name (App fills it from the network): [name, slot]. */
  players: () => [string, number][] = () => [];

  /** Someone by name: a person (agent) or a player's character. Entity id, or -1. */
  whoIs(name: string, except = -1): number {
    const n = name.trim().toLowerCase().replace(/^@/, '');
    if (!n) return -1;
    const e = this.w.e;
    for (const [id, p] of this.w.profiles) if (p.name.toLowerCase() === n && id !== except && e.slot(id) >= 0) return id;
    for (const [pn, slot] of this.players()) if (pn.toLowerCase() === n && e.kind[slot] === Kind.Player) return e.id(slot);
    return -1;
  }

  /**
   * Someone talks to person i: `from` is the owner ('owner') or a player's name; `text` = what they said (null = they
   * walked up to them); `player` = the speaker's character slot. The model answers in JSON with what they say AND what
   * they do ({"say", "do", "target"}); what they do becomes an order (Brain.order). A small model may forget the "do":
   * the speaker's own words ("come", "follow me", "viens"...) and an answer that agrees ("I'm coming") count too.
   * Built-in lines when the AI is off or fails.
   */
  async chat(i: number, from: string, text: string | null, player = -1): Promise<{ reply: string; ai: boolean; did: string }> {
    const w = this.w, e = w.e;
    if (i < 0 || e.kind[i] !== Kind.Agent) throw new Error('no such person');
    const id = e.id(i), p = w.profileOf(i)!, mind = this.mind(id)!;
    const owner = from === 'owner';
    if (player >= 0) w.brain.listen(i, player, 30);
    const who = owner ? 'a voice from the sky (the owner of this world; you always do what it asks)' : `${from}, a player (a survivor like you)`;
    const key = '@' + from;
    let reply = '', usedAi = false, doRaw = '', target = '';
    const st = this.ai.status();
    if (st.ready && (e.act[i] !== Act.Sleep || owner)) {
      const present = this.presentNames(i);
      const prompt = [this.describe(i), `People you can name: ${present.join(', ') || 'nobody'}.`, '',
        text ? `${who} says to you: "${text.slice(0, 300)}"` : `${who} walks up to you.`,
        `Your feeling about them: ${Math.round(mind.rel[key] ?? 0)} (-5..5).`,
        'If you are asked to do something and you agree, say what you do in "do" (come = walk to the one speaking to you; follow = keep '
        + 'walking with someone; goto = walk to someone named in "target"; stay = stop and wait; stop = stop what you were told; or drink, eat, '
        + 'forage, sleep, talk, wander, rest). Otherwise "do" is "nothing".'].join('\n');
      const system = `You are ${p.name}, a survivor in a post-apocalyptic world. Speak naturally and briefly (one or two short sentences), in the `
        + 'language you are spoken to. Answer ONLY with JSON: {"say":"the words you say","do":"come|follow|goto|stay|stop|drink|eat|forage|sleep|talk|wander|rest|nothing","target":"a name or empty"}';
      const ex: Exchange = { at: Date.now(), kind: 'chat', who: `${from} -> ${p.name}`, prompt, reply: '', ms: 0 };
      try {
        const r = await this.ai.generate({ system, prompt, json: true, maxTokens: 200, temperature: 0.8 });
        ex.reply = r.text.slice(0, 2000); ex.ms = r.ms;
        const raw = r.text.replace(/<think>[\s\S]*?<\/think>/gi, '');
        const j = parseJsonReply<Record<string, unknown>>(raw);
        if (j && typeof j === 'object') {
          reply = cleanLine(String(j.say ?? j.text ?? j.answer ?? ''), p.name);
          doRaw = String(j.do ?? j.action ?? '').trim().toLowerCase();
          target = String(j.target ?? j.with ?? '').trim();
        } else reply = cleanLine(raw, p.name); // the model forgot the JSON: its words are still the answer
        usedAi = !!reply;
        if (!reply) ex.err = 'empty answer';
      } catch (err) {
        ex.err = err instanceof Error ? err.message : String(err);
        this.counts.failures++;
      }
      this.keep(ex);
    }
    // What was asked, from the speaker's own words (works without AI too).
    const asked = text ? askedFor(text) : '';
    const agreed = reply ? agrees(reply) : false;
    if (!doRaw || doRaw === 'nothing' || doRaw === 'none') {
      // The owner is obeyed; a player when the answer agrees (or there is no AI to ask).
      if (asked && (owner || agreed || !usedAi)) doRaw = asked;
      else doRaw = '';
    }
    if (!reply) {
      reply = doRaw === 'come' || doRaw === 'follow' ? (owner ? 'Yes. On my way.' : "Alright, I'm coming.") : doRaw === 'stay' ? "Okay, I'll wait here." : this.builtInLine(i);
      this.counts.builtIn++;
    }
    const did = this.applyChatOrder(i, doRaw, target, player, owner);
    this.counts.chats++;
    this.note(id, (text ? `${owner ? 'The voice from the sky' : from} said "${text.slice(0, 80)}"; I answered "${reply.slice(0, 80)}".` : `${from} came to talk; I said "${reply.slice(0, 80)}".`)
      + (did ? ` I ${did}.` : ''), !!text);
    this.feel(id, key, 0.5);
    if (e.slot(id) === i) this.say(i, reply);
    return { reply, ai: usedAi, did };
  }

  /** Turn a chat's "do" into an order. Returns what they do, in words ('' = nothing). */
  private applyChatOrder(i: number, doRaw: string, target: string, player: number, owner: boolean): string {
    const w = this.w, e = w.e, id = e.id(i);
    const d = doRaw.replace(/[^a-z]/g, '');
    if (!d) return '';
    const speaker = player >= 0 && e.kind[player] === Kind.Player ? e.id(player) : -1;
    const named = target ? this.whoIs(target, id) : -1;
    const mins = owner ? 180 : 60;
    if (d === 'come' || d === 'goto' || d === 'follow') {
      // The voice from the sky has no body: "come" = to the player named, else the player on this map (the owner playing).
      const onMap = (): number => { for (const [, slot] of this.players()) if (e.map[slot] === e.map[i]) return e.id(slot); return -1; };
      const to = d === 'come' ? (speaker >= 0 ? speaker : named >= 0 ? named : owner ? onMap() : -1) : named >= 0 ? named : speaker >= 0 ? speaker : owner ? onMap() : -1;
      if (to < 0) return '';
      if (!w.brain.order(e.slot(id), d === 'follow' ? 'follow' : 'goto', to, -1, d === 'follow' ? mins * 2 : mins)) return '';
      return `${d === 'follow' ? 'follow' : 'go to'} ${this.nameOfId(to)}`;
    }
    if (d === 'stay' || d === 'wait') { w.brain.order(e.slot(id), 'stay', -1, -1, mins); return 'wait here'; }
    if (d === 'stop') { w.brain.order(e.slot(id), 'stop', -1, -1, 0); return 'stop'; }
    const act = GOALS[d];
    if (act === undefined) return '';
    if (act === Act.Talk && named >= 0) { w.brain.order(e.slot(id), 'goto', named, -1, mins); return `go to talk with ${this.nameOfId(named)}`; }
    w.brain.order(e.slot(id), 'act', -1, act, mins);
    return d;
  }

  /** Names a person can use: the people and players on their map. */
  private presentNames(i: number): string[] {
    const e = this.w.e, out: string[] = [];
    for (const [id, p] of this.w.profiles) { const k = e.slot(id); if (k >= 0 && k !== i && e.map[k] === e.map[i]) out.push(p.name); }
    for (const [n, slot] of this.players()) if (e.map[slot] === e.map[i]) out.push(n);
    return out.slice(0, 20);
  }

  whoName(id: number): string { return this.nameOfId(id); }

  private nameOfId(id: number): string {
    const p = this.w.profiles.get(id);
    if (p) return p.name;
    const slot = this.w.e.slot(id);
    for (const [n, s] of this.players()) if (s === slot) return n;
    return 'them';
  }

  /** The owner's order from the panel, without asking the model. */
  orderFromPanel(i: number, kind: string, target: string): string {
    const w = this.w, e = w.e;
    if (i < 0 || e.kind[i] !== Kind.Agent) throw new Error('no such person');
    const did = this.applyChatOrder(i, kind, target, -1, true);
    if (!did) throw new Error(kind === 'goto' || kind === 'follow' ? 'choose who' : 'unknown order');
    this.note(e.id(i), `The voice from the sky told me to ${did}.`, true);
    return did;
  }

  /** What a person says without a model: from their needs and the time of day. */
  builtInLine(i: number): string {
    const e = this.w.e, r = this.w.rng.next();
    if (e.act[i] === Act.Sleep) return 'Zzz...';
    if (e.thirst[i]! > 65) return r < 0.5 ? "I'm so thirsty. Is there any clean water near here?" : 'Water... I need water before anything else.';
    if (e.hunger[i]! > 65) return r < 0.5 ? "Got any food? I'm starving." : "I haven't eaten in a while. Seen any cans around?";
    if (e.tired[i]! > 70) return 'I can barely keep my eyes open.';
    if (e.lonely[i]! > 50) return r < 0.5 ? 'Good to see a friendly face out here.' : "Stay a while. It's been lonely.";
    const lines = ['Stay safe out there.', 'Quiet day. I like it that way.', 'Keep an eye out for supply drops.', 'The old town still has a few roofs left.'];
    return lines[Math.floor(r * lines.length)]!;
  }

  private keep(ex: Exchange): void {
    ex.prompt = ex.prompt.slice(0, 6000);
    this.log.push(ex);
    if (this.log.length > 20) this.log.splice(0, this.log.length - 20);
  }
}
