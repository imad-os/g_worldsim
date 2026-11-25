/**
 * The panel's Analysis page (imad 2026-11-25: "all stats and an option to ask the AI brain about it, and I can select log
 * types to include in the prompt, like asking why people refuse to reproduce, or how many animals").
 *
 * `stats()` = everything worth knowing about the world now, in one object (also the start of every prompt).
 * `ask()` = one question to a brain: the stats + the log types the owner ticked, cut to a size the model can take.
 * Nothing in the world changes. Questions and answers are kept in meta `analysis_log` (last 30). Secrets are hidden.
 */
import { Kind, EFlag, Act, ANIMAL_NAMES } from '@worldsim/protocol';
import type { Db } from '../persist/db.js';
import type { EventLog } from '../persist/snapshot.js';
import type { World } from '../sim/world.js';
import { NO_MAP } from '../sim/entities.js';
import { ageOf } from '../sim/people.js';
import { ADULT } from '../sim/life.js';
import type { Ai } from '../ai/llm.js';
import type { Exchange } from '../ai/planner.js';
import type { Line } from '../ai/convo.js';

export interface LogType { id: string; name: string; about: string; kinds?: string[] }
/** What the owner can tick to send along with the question. */
export const LOG_TYPES: LogType[] = [
  { id: 'people', name: 'Everyone now', about: 'one line per living person: age, sex, partner, needs, what they do, mood, objective, memory' },
  { id: 'life', name: 'Births, deaths, couples', about: 'births, deaths and their cause, new couples, divorces, pregnancies, children growing up', kinds: ['birth', 'death', 'partner', 'divorce', 'pregnant', 'grown'] },
  { id: 'work', name: 'Work and objectives', about: 'objectives done or failed (and why), rewards, building, crafting, storing, healing', kinds: ['task', 'reward', 'levelup', 'build', 'craft', 'store', 'loot', 'repair', 'heal', 'camp', 'give', 'supply', 'land'] },
  { id: 'danger', name: 'Zombies, animals, fights', about: 'zombie nights and attacks, hunts, fights, things destroyed, night guards', kinds: ['zombie', 'zombies', 'fight', 'hunt', 'destroyed', 'replay', 'guard'] },
  { id: 'social', name: 'Talks and clans', about: 'who talked to whom, what was said, clans, leaders, duels', kinds: ['talk', 'say', 'clan', 'clanSplit', 'clanLeave', 'clanLeader', 'clanEnd', 'duel', 'duelEnd'] },
  { id: 'convo', name: 'Conversations', about: 'the last lines people said to each other and to players' },
  { id: 'travel', name: 'Travel and arrivals', about: 'trips between maps, arrivals, people added or removed', kinds: ['travel', 'arrive', 'teleport', 'spawn', 'remove', 'joined'] },
  { id: 'admin', name: 'Owner actions and rules', about: 'what was changed from the panel, strict rules', kinds: ['admin', 'rule', 'ruleSet'] },
  { id: 'ai', name: 'AI planner requests', about: 'the last prompts sent to the people\'s brain and its answers' },
  { id: 'server', name: 'Server warnings and errors', about: 'the server log (warnings and errors only)' },
];
const DEFAULT_TYPES = ['people', 'life', 'work'];
/** Characters of data sent with one question (stats first, then the ticked logs share the rest). */
const BUDGET = 60_000;
const KEEP = 30;
/** The game clock starts at 08:00 (Brain.hour). */
const START = 8 * 3600;
const ACT_NAME: Record<number, string> = Object.fromEntries(Object.entries(Act).map(([k, v]) => [v, k.toLowerCase()]));
const ID_KEYS = ['id', 'a', 'b', 'mother', 'father', 'with', 'by', 'target', 'leader', 'from', 'to', 'victim', 'killer'];

export interface AnalysisDeps {
  world: () => World;
  db: Db;
  events: EventLog;
  overview: () => Record<string, unknown>;
  aiStatus: () => Record<string, unknown>;
  planner: () => { status: () => Record<string, unknown>; log: Exchange[]; convo: { lines: Line[] } };
  serverLog: (lines: number) => { t: string; level: string; msg: string; data: string }[];
  /** '' = the brain in use (with its fallback); an id = that saved brain. */
  ai: (brainId: string) => { ai: Ai; name: string };
  redact: (s: string) => string;
  players: () => [string, number][];
}
export interface Answer { at: number; q: string; include: string[]; brain: string; model: string; answer: string; ms: number; chars: number; err?: string; who: string }

export class Analysis {
  busy = false;
  constructor(private d: AnalysisDeps) {}

  history(): Answer[] {
    try { return JSON.parse(this.d.db.getMeta('analysis_log') ?? '[]') as Answer[]; } catch { return []; }
  }

  private nameOf(id: number): string { return this.d.world().profiles.get(id)?.name ?? `#${id & 0xffff}`; }

  /** Everything worth knowing now: the dashboard's overview plus reproduction, objectives, resources, animals, clans, AI. */
  stats(): Record<string, unknown> {
    const w = this.d.world(), e = w.e, now = w.gameSec, y = w.yearSec, L = w.brain.life;
    const ov = this.d.overview();
    let living = 0;
    for (let i = 0; i < e.hi; i++) if (e.kind[i] === Kind.Agent) living++;

    // Reproduction: why each woman of age is not expecting (the same checks as Life.hourly / tryChild).
    const block: Record<string, number> = {}, women: { name: string; age: number; why: string }[] = [];
    let singleMen = 0, singleWomen = 0, adultsM = 0, adultsF = 0, possiblePairs = 0;
    const singles: { id: number; sex: string; parents: number[] }[] = [];
    for (let i = 0; i < e.hi; i++) {
      if (e.kind[i] !== Kind.Agent && e.kind[i] !== Kind.Player) continue;
      const id = e.id(i), p = w.profiles.get(id);
      if (!p || p.died !== undefined) continue;
      const age = ageOf(p, now, y);
      if (age < ADULT + 2) continue;
      if (p.sex === 'm') adultsM++; else adultsF++;
      if (p.partner < 0) { if (p.sex === 'm') singleMen++; else singleWomen++; singles.push({ id, sex: p.sex, parents: p.parents }); }
      if (p.sex !== 'f') continue;
      let why = '';
      if (p.pregnant) why = 'expecting';
      else if (age > 45) why = 'past 45';
      else if (p.partner < 0) why = 'no partner';
      else {
        const j = e.slot(p.partner);
        if (j < 0) why = 'partner gone';
        else if (e.map[j] !== e.map[i]) why = 'partner on another map';
        else if (e.hunger[i]! > 70 || e.thirst[i]! > 70 || e.hunger[j]! > 70 || e.thirst[j]! > 70) why = 'too hungry or thirsty (over 70)';
        else if (w.rules.between(i, j, 'child')) why = 'a strict rule forbids it';
        else if (living >= L.maxPopulation) why = `population cap reached (${living} / ${L.maxPopulation})`;
        else if ([...w.profiles.values()].some((c) => c.parents[0] === id && now - c.born < y)) why = 'had a baby less than a year ago';
        else why = 'can conceive (0.9 chance a year)';
      }
      block[why] = (block[why] ?? 0) + 1;
      women.push({ name: p.name, age: Math.floor(age), why });
    }
    for (let a = 0; a < singles.length; a++) for (let b = a + 1; b < singles.length; b++) {
      const s = singles[a]!, t = singles[b]!;
      if (s.sex !== t.sex && !s.parents.some((x) => t.parents.includes(x)) && !s.parents.includes(t.id) && !t.parents.includes(s.id)) possiblePairs++;
    }

    // Objectives (tasks) from the timeline: done / failed, who asked, the commonest reasons for failing.
    const tasks = { done: 0, failed: 0, byFrom: {} as Record<string, { done: number; failed: number }>, reasons: {} as Record<string, number>, running: 0 };
    for (const r of this.d.events.recent(500, 'task')) {
      const t = JSON.parse(r.data) as { ok?: boolean; why?: string; text?: string };
      if (t.ok) tasks.done++; else { tasks.failed++; const k = String(t.why ?? '?').slice(0, 80); tasks.reasons[k] = (tasks.reasons[k] ?? 0) + 1; }
    }
    for (const p of w.profiles.values()) if (p.died === undefined && p.mind?.task) tasks.running++;
    tasks.reasons = Object.fromEntries(Object.entries(tasks.reasons).sort((a, b) => b[1] - a[1]).slice(0, 12));

    // Land: what can still be gathered on each map, animals by name, zombies.
    const T = w.survival.T;
    const maps = w.maps.map((mp, mi) => {
      const animals: Record<string, number> = {};
      let zombies = 0, people = 0, items = 0;
      for (let i = 0; i < e.hi; i++) {
        if (e.map[i] !== mi) continue;
        if (e.kind[i] === Kind.Animal) { const n = (e.sub[i] === 5 ? 'horse' : ANIMAL_NAMES[e.sub[i]!]) ?? String(e.sub[i]); animals[n] = (animals[n] ?? 0) + 1; }
        else if (e.kind[i] === Kind.Threat) zombies++;
        else if (e.kind[i] === Kind.Agent) people++;
        else if (e.kind[i] === Kind.Item) items++;
      }
      const tiles = (t: number) => w.survival.countTiles(mi, t);
      return { id: mp.def.id, name: mp.def.name, people, zombies, foodItems: items, animals, trees: tiles(T.tree), rocks: tiles(T.rock), rubble: tiles(T.rubble), farms: tiles(T.farm),
        huts: w.survival.huts[mi]?.length ?? 0, doors: tiles(T.door), beds: tiles(T.bed), leader: w.survival.leaderName(mi), store: w.survival.stash[mi] ?? null };
    });

    // What people do right now.
    const doing: Record<string, number> = {};
    for (let i = 0; i < e.hi; i++) if (e.kind[i] === Kind.Agent && e.map[i] !== NO_MAP) { const a = ACT_NAME[e.act[i]!] ?? String(e.act[i]); doing[a] = (doing[a] ?? 0) + 1; }

    // How often each kind of event happened lately.
    const kinds: Record<string, number> = {};
    for (const r of this.d.events.recent(3000)) kinds[r.kind] = (kinds[r.kind] ?? 0) + 1;

    const pl = this.d.planner();
    return {
      clock: { gameDay: Math.floor((now + START) / 86400) + 1, hour: Math.floor(w.brain.hour()), yearDays: L.yearDays, maxPopulation: L.maxPopulation, travelOpen: w.travelOpen },
      population: (({ alive, children, adults, pregnant, couples, asleep, working, talking, hungry, thirsty, hurt, needs, dead, born, generations, causes }) =>
        ({ alive, children, adults, pregnant, couples, asleep, working, talking, hungry, thirsty, hurt, averageLack: needs, dead, born, generations, causesOfDeath: causes }))(ov as never),
      doingNow: doing,
      reproduction: { adultMen: adultsM, adultWomen: adultsF, singleMen, singleWomen, possibleSinglePairs: possiblePairs, women18plus: block, women },
      objectives: tasks,
      maps,
      clans: w.clans.clans.map((c) => ({ name: c.name, map: w.maps[c.map]?.def.id ?? '', leader: this.nameOf(c.leader), members: c.members.length })),
      zombiesPerNight: w.zombies.perNight,
      rules: { forEveryone: w.rules.all.map((r) => r.text), perPerson: [...w.profiles.values()].filter((p) => p.rules?.length && p.died === undefined).map((p) => ({ name: p.name, rules: p.rules!.map((r) => r.text) })) },
      ai: { brain: this.d.aiStatus(), planner: pl.status() },
      eventsLately: kinds,
    };
  }

  /** One ticked log type as text lines (newest last), at most `max` characters. */
  private logText(t: LogType, max: number): string {
    const w = this.d.world(), e = w.e, now = w.gameSec, y = w.yearSec;
    const out: string[] = [];
    const clock = (s: number) => { const g = s + START; return `day ${Math.floor(g / 86400) + 1} ${String(Math.floor((g % 86400) / 3600)).padStart(2, '0')}:${String(Math.floor((g % 3600) / 60)).padStart(2, '0')}`; };
    if (t.kinds) {
      const rows: { game_sec: number; kind: string; data: string }[] = [];
      for (const k of t.kinds) rows.push(...this.d.events.recent(80, k));
      rows.sort((a, b) => a.game_sec - b.game_sec);
      for (const r of rows.slice(-200)) {
        let data: Record<string, unknown> = {};
        try { data = JSON.parse(r.data) as Record<string, unknown>; } catch { /* */ }
        for (const k of ID_KEYS) if (typeof data[k] === 'number' && w.profiles.has(data[k] as number)) data[k] = this.nameOf(data[k] as number);
        out.push(`${clock(r.game_sec)} ${r.kind} ${JSON.stringify(data)}`);
      }
    } else if (t.id === 'people') {
      for (let i = 0; i < e.hi; i++) {
        if (e.kind[i] !== Kind.Agent && e.kind[i] !== Kind.Player) continue;
        const id = e.id(i), p = w.profiles.get(id);
        if (!p || e.map[i] === NO_MAP && e.kind[i] !== Kind.Player) continue;
        const m = p.mind, task = m?.task as { text?: string } | undefined;
        out.push([`${p.name}${p.player ? ' (player ' + p.player + ')' : ''}`, `${p.sex} ${Math.floor(ageOf(p, now, y))}y`, e.map[i] === NO_MAP ? 'travelling' : w.maps[e.map[i]!]!.def.id,
          `partner ${p.partner >= 0 ? this.nameOf(p.partner) : 'none'}`, p.pregnant ? 'expecting' : '', (e.flags[i]! & EFlag.Child) ? 'child' : '',
          `hp ${Math.round(e.hp[i]!)} hunger ${Math.round(e.hunger[i]!)} thirst ${Math.round(e.thirst[i]!)} tired ${Math.round(e.tired[i]!)} lonely ${Math.round(e.lonely[i]!)}`,
          `doing ${ACT_NAME[e.act[i]!] ?? e.act[i]}`, m?.mood ? `mood ${m.mood}` : '', task?.text ? `objective "${task.text}"` : '', m?.plan ? `wish ${m.plan.act}` : '',
          `traits ${Object.entries(p.traits).map(([k, v]) => `${k} ${Math.round(Number(v) * 100) / 100}`).join(', ')}`,
          m?.summary ? `memory "${m.summary.slice(0, 200)}"` : '', m?.notes?.length ? `notes ${m.notes.slice(-4).map((n) => '"' + n.text.slice(0, 80) + '"').join(' ')}` : '',
        ].filter(Boolean).join(' | '));
      }
    } else if (t.id === 'convo') {
      for (const l of this.d.planner().convo.lines.slice(-150)) out.push(`${clock(l.at)} ${l.from === -2 ? 'The owner' : l.from < 0 ? 'Someone' : this.nameOf(l.from)} -> ${l.to < 0 ? 'everyone' : this.nameOf(l.to)}: ${l.text}`);
    } else if (t.id === 'ai') {
      for (const x of this.d.planner().log.slice(-8)) out.push(`[${x.kind} for ${x.who}, ${x.ms} ms${x.err ? ', error ' + x.err : ''}]\nPROMPT: ${x.prompt.slice(0, 1500)}\nANSWER: ${x.reply.slice(0, 1500)}`);
    } else if (t.id === 'server') {
      for (const l of this.d.serverLog(400).filter((l) => l.level === 'warn' || l.level === 'error').slice(-120)) out.push(`${l.t} ${l.level} ${l.msg} ${l.data}`);
    }
    // Newest kept when too long.
    let text = out.join('\n');
    if (text.length > max) text = '…(older lines cut)\n' + text.slice(text.length - max);
    return text || '(nothing logged)';
  }

  /** The prompt for one question (also shown to the owner before sending, `preview`). */
  prompt(question: string, include: string[]): { system: string; prompt: string } {
    const types = LOG_TYPES.filter((t) => include.includes(t.id));
    const stats = JSON.stringify(this.stats());
    const share = Math.max(2000, Math.floor((BUDGET - stats.length) / Math.max(1, types.length)));
    const parts = [`WORLD STATS NOW (JSON):\n${stats}`];
    for (const t of types) parts.push(`LOG "${t.name}" (${t.about}):\n${this.logText(t, share)}`);
    const system = 'You are the analyst of a running simulation of a small post-apocalyptic world: autonomous people with needs (hunger, thirst, tired, lonely: 0 = fine, 100 = desperate),'
      + ' traits, objectives (tasks), couples and babies, camps, zombies at night and animals. The owner asks you a question about it. Answer ONLY from the data given:'
      + ' quote the numbers and names that support each point, say plainly when the data cannot tell, and never invent people or events.'
      + ' Structure: a one or two sentence answer first, then the reasons (most important first), then what the owner could change (panel settings, rules, orders) if it helps.'
      + ' Rules of the world worth knowing: partners need 2 adults 18+ of opposite sex, single, not family; a woman 18-45 conceives with her partner on the same map'
      + ' when both have hunger and thirst under 70, no rule forbids it, the population is under the cap, and she had no baby in the last year; pregnancy lasts 0.75 year.'
      + ' Answer in the language of the question. Plain text, short paragraphs or dashes, no tables.';
    return { system, prompt: this.d.redact(`${parts.join('\n\n')}\n\nTHE OWNER'S QUESTION: ${question}`) };
  }

  async ask(question: string, include: string[], brainId: string, who: string): Promise<Answer> {
    const q = question.trim().slice(0, 2000);
    if (!q) throw new Error('type a question');
    if (this.busy) throw new Error('one question at a time: the last one is still being answered');
    const inc = include.filter((x) => LOG_TYPES.some((t) => t.id === x));
    const { ai, name } = this.d.ai(brainId);
    const { system, prompt } = this.prompt(q, inc);
    const a: Answer = { at: Date.now(), q, include: inc, brain: name, model: '', answer: '', ms: 0, chars: prompt.length, who };
    this.busy = true;
    try {
      const r = await ai.generate({ system, prompt, maxTokens: 2000, temperature: 0.3 });
      a.answer = this.d.redact(r.text.replace(/<think>[\s\S]*?<\/think>/g, '').trim()) || '(the brain gave an empty answer)';
      a.model = r.model; a.ms = r.ms;
    } catch (e) {
      a.err = this.d.redact(e instanceof Error ? e.message : String(e));
    } finally { this.busy = false; }
    const list = [a, ...this.history()].slice(0, KEEP);
    this.d.db.setMeta('analysis_log', JSON.stringify(list));
    return a;
  }
}
export { DEFAULT_TYPES };
