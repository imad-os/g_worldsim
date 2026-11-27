import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { writeFileSync } from 'node:fs';
import { Act, Kind } from '@worldsim/protocol';
import { loadScenario } from './sim/scenario.js';
import { World } from './sim/world.js';
import { Ai, AI_DEFAULTS } from './ai/llm.js';
import { Planner } from './ai/planner.js';
import { Logger } from './log.js';
import { Rng } from './sim/rng.js';

/**
 * E12 (research/EXPERIMENTS.md): how long the planner's prompts are and how good the choices made from them are, with a FAKE
 * model (no LLM in the cloud). The fake reads only the prompt text, like a model would:
 *  - "sensible": urgent needs first (from the need words), then a home / beds when the prompt says they are missing, else a
 *    work goal from the offered list, now and then a basic one;
 *  - "random": any goal from the offered list.
 * So the prompt's information and its goal list decide what people do: a list full of goals that cannot work makes failed tasks.
 *
 *   node packages/server/dist/experiment-prompts.js --days 3 --agents 16 --seeds a,b,c --policy sensible [--out f.json]
 */
const ROOT = resolve(fileURLToPath(import.meta.url), '../../../..');
const arg = (k: string, d: string) => { const i = process.argv.indexOf('--' + k); return i > 0 ? process.argv[i + 1]! : d; };
const DAYS = Number(arg('days', '3')), SEEDS = arg('seeds', 'pr-a,pr-b,pr-c').split(','), AGENTS = Number(arg('agents', '16'));
const POLICY = arg('policy', 'sensible'), OUT = arg('out', ''), SAMPLE = arg('sample', '');
const CLOCK = 30, RATE = 20, PLAN_EVERY = 20 * RATE; // the App ticks the planner every 2 s; minGapSec 20 = one batch per 20 real s

const BASIC = ['drink', 'eat', 'forage', 'sleep', 'talk', 'wander', 'rest', 'travel'];
const clean = (g: string) => g.replace(/\s*\(.*?\)\s*/g, '').trim();

/** The goals offered to one person: their own line ("Goals now:") or the shared one ("Possible goals:"). */
function goalsIn(block: string, shared: string[]): string[] {
  const own = /^Goals now: (.*)\.$/m.exec(block);
  return own ? own[1]!.split(', ').map(clean) : shared;
}
function lvl(block: string, k: string): number {
  const m = new RegExp(`${k}: (fine|a little|quite|very|desperately)`).exec(block);
  return m ? ['fine', 'a little', 'quite', 'very', 'desperately'].indexOf(m[1]!) : 0;
}

function fakeAnswer(prompt: string, rng: Rng, policy: string): string {
  const sharedM = /^Possible goals: (.*)\.$/m.exec(prompt);
  const shared = sharedM ? sharedM[1]!.split(', ').map(clean) : BASIC;
  const night = /\((night)\)/.test(prompt.split('\n')[0]!);
  const blocks = prompt.split(/\n(?=Person: )/).slice(1);
  const people = blocks.map((b) => {
    const name = /^Person: (\S+)/.exec(b)![1]!;
    const goals = goalsIn(b, shared);
    const near = /Near: ([^(;.]+?) \(/.exec(b)?.[1]?.replace(/, your .*$/, '').replace(/ \(a player\)$/, '') ?? '';
    const has = (g: string) => goals.includes(g);
    const work = goals.filter((g) => !BASIC.includes(g));
    let goal = '';
    if (policy === 'random') goal = goals[rng.int(goals.length)] ?? 'rest';
    else {
      const food = Number(/Carrying (\d+) food/.exec(b)?.[1] ?? 0);
      if (lvl(b, 'Thirsty') >= 3) goal = 'drink';
      else if (lvl(b, 'Hungry') >= 2) goal = food > 0 && has('eat') ? 'eat' : 'forage';
      else if (lvl(b, 'Tired') >= 3 || (night && lvl(b, 'Tired') >= 1)) goal = 'sleep';
      else if (lvl(b, 'Lonely') >= 2 && near) goal = 'talk';
      else if (/No home yet/.test(b) && has('build a hut')) goal = 'build a hut';
      else if (/it needs \d+ more/.test(b) && has('put a bed in a hut')) goal = 'put a bed in a hut';
      else if (work.length && rng.chance(0.7)) goal = work[rng.int(work.length)]!;
      else goal = ['talk', 'wander', 'rest', 'forage'][rng.int(4)]!;
    }
    return { name, goal, with: goal === 'talk' ? near : '', why: 'fake', say: '', mood: 'calm', memory: `${name} remembers.` };
  });
  return JSON.stringify({ people });
}

export interface PromptRun {
  seed: string; policy: string; calls: number; planned: number; chars: { avg: number; max: number; perPerson: number }; tokens: number;
  tasks: { ok: number; failed: number; okRate: number; reasons: Record<string, number>; byGoal: Record<string, [number, number]> };
  deaths: number; alive: number; built: Record<string, number>; stock: number; needs: { hunger: number; thirst: number; tired: number; lonely: number; hp: number };
  idle: number; talks: number; goals: Record<string, number>;
}

export async function runPrompts(seed: string, policy = POLICY, days = DAYS, agents = AGENTS): Promise<PromptRun> {
  const sc = loadScenario(resolve(ROOT, 'scenarios/post-apocalypse'));
  sc.agents.count = agents;
  const w = new World(sc, { tickRate: RATE, clockScale: CLOCK, capacity: 2048, seed });
  w.populate();
  w.land.setup();
  w.travelOpen = true;
  const log = new Logger('error');
  const ai = new Ai({ ...AI_DEFAULTS, provider: 'none' }, {}, log) as any;
  const rng = new Rng(seed + ':model');
  const lens: number[] = [];
  let calls = 0, planned = 0, sample = '';
  ai.status = () => ({ ready: true, callsLastHour: 0, maxCallsPerHour: 1e9 });
  ai.generate = async (r: { prompt: string; system?: string }) => {
    calls++; lens.push(r.prompt.length + (r.system?.length ?? 0));
    planned += (r.prompt.match(/^Person: /gm) ?? []).length;
    if (!sample && /Person: .*\b(man|woman), \d{2,}/.test(r.prompt) && calls > 20) sample = r.prompt;
    return { text: fakeAnswer(r.prompt, rng, policy), ms: 1 };
  };
  const planner = new Planner(w, ai, log, { minGapSec: 0 }) as any;
  // Tasks the planner started (its goals), to judge the choices made from the prompt.
  const mine = new Map<number, string>(), byGoal: Record<string, [number, number]> = {}, reasons: Record<string, number> = {}, goals: Record<string, number> = {};
  let inPlan = false;
  const apply = planner.applyPlans.bind(planner);
  planner.applyPlans = (ids: number[], list: { name: string; goal: string }[]) => {
    for (const p of list) goals[p.goal] = (goals[p.goal] ?? 0) + 1;
    inPlan = true; try { return apply(ids, list); } finally { inPlan = false; }
  };
  const start = w.tasks.start.bind(w.tasks);
  w.tasks.start = (i, text, from, steps) => { const ok = start(i, text, from, steps); if (ok) { if (inPlan) mine.set(w.e.id(i), text); else mine.delete(w.e.id(i)); } return ok; };
  let ok = 0, failed = 0, deaths = 0, talks = 0;
  const built: Record<string, number> = {};
  w.listeners.push((ev) => {
    const d = ev.data;
    if (ev.kind === 'death') deaths++;
    if (ev.kind === 'talk') talks++;
    if (ev.kind === 'build') built[String(d.what)] = (built[String(d.what)] ?? 0) + 1;
    if (ev.kind !== 'task') return;
    const id = Number(d.id), t = mine.get(id);
    if (t === undefined || t !== d.text) return;
    mine.delete(id);
    const b = (byGoal[t] ??= [0, 0]);
    if (d.ok) { ok++; b[0]++; } else { failed++; b[1]++; const why = String(d.why).replace(/\d+/g, 'N').slice(0, 60); reasons[why] = (reasons[why] ?? 0) + 1; }
  });
  const ticks = Math.round((days * 86400) / CLOCK * RATE), hourTicks = Math.round(3600 / CLOCK * RATE), e = w.e;
  const need = { hunger: 0, thirst: 0, tired: 0, lonely: 0, hp: 0 };
  let samples = 0, idle = 0, awake = 0;
  for (let k = 0; k < ticks; k++) {
    w.step();
    if (k % PLAN_EVERY === 0) await planner.tick();
    if (k % hourTicks === 0) for (let i = 0; i < e.hi; i++) {
      if (e.kind[i] !== Kind.Agent) continue;
      need.hunger += e.hunger[i]!; need.thirst += e.thirst[i]!; need.tired += e.tired[i]!; need.lonely += e.lonely[i]!; need.hp += e.hp[i]!; samples++;
      if (e.act[i] !== Act.Sleep) { awake++; if (e.act[i] === Act.Idle || e.act[i] === Act.Rest || e.act[i] === Act.Wander) idle++; }
    }
  }
  if (SAMPLE && sample) writeFileSync(SAMPLE, sample);
  let alive = 0, stock = 0;
  for (let i = 0; i < e.hi; i++) if (e.kind[i] === Kind.Agent) alive++;
  for (let m = 0; m < w.maps.length; m++) stock += (w.survival.stash[m]?.food ?? 0) + (w.survival.stash[m]?.wood ?? 0) + (w.survival.stash[m]?.stone ?? 0);
  const n = Math.max(1, samples), r1 = (x: number) => Math.round(x * 10) / 10, sum = lens.reduce((s, x) => s + x, 0);
  return {
    seed, policy, calls, planned, chars: { avg: Math.round(sum / Math.max(1, calls)), max: Math.max(0, ...lens), perPerson: Math.round(sum / Math.max(1, planned)) },
    tokens: Math.round(sum / 4), tasks: { ok, failed, okRate: Math.round((ok / Math.max(1, ok + failed)) * 100) / 100, reasons, byGoal },
    deaths, alive, built, stock, needs: { hunger: r1(need.hunger / n), thirst: r1(need.thirst / n), tired: r1(need.tired / n), lonely: r1(need.lonely / n), hp: r1(need.hp / n) },
    idle: Math.round((idle / Math.max(1, awake)) * 100) / 100, talks, goals,
  };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  const all: PromptRun[] = [];
  for (const seed of SEEDS) { const r = await runPrompts(seed); all.push(r); console.log(JSON.stringify(r)); }
  const avg = (f: (r: PromptRun) => number) => +(all.reduce((s, r) => s + f(r), 0) / all.length).toFixed(2);
  const rows: [string, number][] = [
    ['AI calls', avg((r) => r.calls)], ['people planned', avg((r) => r.planned)], ['prompt chars (avg)', avg((r) => r.chars.avg)], ['prompt chars (max)', avg((r) => r.chars.max)],
    ['chars per person', avg((r) => r.chars.perPerson)], ['tokens sent (total)', avg((r) => r.tokens)], ['planned tasks ok', avg((r) => r.tasks.ok)],
    ['planned tasks failed', avg((r) => r.tasks.failed)], ['ok rate', avg((r) => r.tasks.okRate)], ['deaths', avg((r) => r.deaths)], ['alive', avg((r) => r.alive)],
    ['stock', avg((r) => r.stock)], ['huts built', avg((r) => r.built.hut ?? 0)], ['hunger', avg((r) => r.needs.hunger)], ['thirst', avg((r) => r.needs.thirst)],
    ['tired', avg((r) => r.needs.tired)], ['lonely', avg((r) => r.needs.lonely)], ['hp', avg((r) => r.needs.hp)], ['idle', avg((r) => r.idle)], ['talks', avg((r) => r.talks)],
  ];
  console.log(`\n| ${POLICY} | mean of ${all.length} |\n|---|---|`);
  for (const [k, v] of rows) console.log(`| ${k} | ${v} |`);
  if (OUT) writeFileSync(OUT, JSON.stringify(all, null, 1));
}
