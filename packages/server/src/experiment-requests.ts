import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { writeFileSync } from 'node:fs';
import { Kind } from '@worldsim/protocol';
import { loadScenario } from './sim/scenario.js';
import { World, type AiFlags } from './sim/world.js';
import { Ai, AI_DEFAULTS } from './ai/llm.js';
import { Planner } from './ai/planner.js';
import { Logger } from './log.js';
import { createServer } from 'node:http';
import type { AddressInfo } from 'node:net';

/** With --llm: a stand-in for a small model that agrees and sends the one-step plan of the request it is asked about. */
let nextPlan: Record<string, unknown>[] = [];
let llmBase = '';
async function fakeModel(): Promise<void> {
  const srv = createServer((req, res) => {
    let b = '';
    req.on('data', (c) => (b += c));
    req.on('end', () => {
      res.setHeader('content-type', 'application/json');
      res.end(JSON.stringify({ message: { role: 'assistant', content: JSON.stringify({ say: "Alright, I'll do it.", do: 'nothing', task: 'what you asked', plan: nextPlan }) } }));
    });
  });
  await new Promise<void>((ok) => srv.listen(0, '127.0.0.1', ok));
  srv.unref();
  llmBase = `http://127.0.0.1:${(srv.address() as AddressInfo).port}`;
}

/**
 * Objective experiment (research/EXPERIMENTS.md E6): the owner asks each person for one thing in plain words, the way
 * imad does in the panel, with no LLM (the built-in understanding only), or with a plan an LLM typically sends
 * (`--llm`: a one-step plan such as [{do:'craft', what:'door'}], the shape small models answer with). Then we watch for 4 game
 * hours: did they take it on, did it end done or failed, and why.
 *
 *   node packages/server/dist/experiment-requests.js --arms old,new --seeds a,b,c [--llm] [--out file]
 */
const ROOT = resolve(fileURLToPath(import.meta.url), '../../../..');
const arg = (k: string, d: string) => { const i = process.argv.indexOf('--' + k); return i > 0 ? process.argv[i + 1]! : d; };
const SEEDS = arg('seeds', 'req-a,req-b,req-c').split(','), ARMS = arg('arms', 'old,new').split(','), OUT = arg('out', '');
const LLM = process.argv.includes('--llm');
const ALL: (keyof AiFlags)[] = ['goap', 'learn', 'siting', 'instinct'];
const flagsOf = (arm: string) => { const on = arm === 'new' ? ALL : arm === 'old' ? [] : arm.split('+'); const f = {} as AiFlags; for (const k of ALL) f[k] = on.includes(k); return f; };

/** [words, the one-step plan a small model would send]. */
export const REQUESTS: [string, Record<string, unknown>[]][] = [
  ['Build a hut for us', [{ do: 'build', what: 'hut' }]],
  ['Make yourself a spear', [{ do: 'craft', what: 'spear' }]],
  ['Light a campfire', [{ do: 'build', what: 'campfire' }]],
  ['Go and gather some wood', [{ do: 'gather', what: 'wood', times: 4 }]],
  ['Bring me stones', [{ do: 'gather', what: 'stone', times: 3 }]],
  ['Make an axe', [{ do: 'craft', what: 'axe' }]],
  ['Collect food and store it', [{ do: 'collect', what: 'food', times: 3 }, { do: 'store', what: 'food' }]],
  ['Put a door on the hut', [{ do: 'build', what: 'door' }]],
  ['Make a sword', [{ do: 'craft', what: 'sword' }]],
  ['Build a wall around the camp', [{ do: 'build', what: 'palisade' }]],
  ['Plant a field', [{ do: 'farm' }]],
  ['Go hunting', [{ do: 'hunt' }]],
  ['Make clothes', [{ do: 'craft', what: 'clothes' }]],
  ['Put a lamp at the camp', [{ do: 'build', what: 'lamp' }]],
  ['Search the ruins', [{ do: 'loot', times: 2 }]],
];

async function runOnce(arm: string, seed: string) {
  const sc = loadScenario(resolve(ROOT, 'scenarios/post-apocalypse'));
  sc.agents.count = 5;
  const w = new World(sc, { tickRate: 20, clockScale: 30, capacity: 2048, seed, ai: flagsOf(arm) });
  w.populate();
  w.land.setup(); // as the server does at start: the ring of trees, roads, wrecks, rocks
  const log = new Logger('error');
  const ai = new Ai({ ...AI_DEFAULTS, provider: 'none' }, {}, log);
  const p = new Planner(w, ai, log, {});
  if (LLM) ai.apply({ provider: 'ollama', ollamaUrl: llmBase, model: 'm' });
  for (let k = 0; k < (10 * 3600) / 30 * 20; k++) w.step(); // a morning goes by: a camp, some work
  const e = w.e, people: number[] = [];
  for (let i = 0; i < e.hi; i++) if (e.kind[i] === Kind.Agent) people.push(i);
  const out: { req: string; name: string; did: string; ok: boolean | null; why: string }[] = [];
  const ends = new Map<number, { ok: boolean; why: string; text: string }>();
  w.listeners.push((ev) => { if (ev.kind === 'task' && !ends.has(Number(ev.data.id))) ends.set(Number(ev.data.id), { ok: !!ev.data.ok, why: String(ev.data.why ?? ''), text: String(ev.data.text) }); });
  for (let r = 0; r < REQUESTS.length; r += people.length) {
    ends.clear();
    const asked: [number, string, string][] = [];
    for (let k = 0; k < people.length && r + k < REQUESTS.length; k++) {
      const i = people[k]!, [text, plan] = REQUESTS[r + k]!;
      if (e.slot(e.id(i)) !== i) continue;
      nextPlan = plan;
      const res = await p.chat(i, 'owner', text);
      asked.push([e.id(i), text, res.did]);
    }
    for (let k = 0; k < (4 * 3600) / 30 * 20; k++) w.step();
    for (const [id, text, did] of asked) {
      const end = ends.get(id);
      const t = w.profiles.get(id)?.mind?.task as { text?: string } | undefined;
      out.push({ req: text, name: w.profiles.get(id)?.name ?? '?', did, ok: !did ? false : end ? end.ok : t ? null : false, why: !did ? 'nothing done' : end ? end.why : t ? 'still on it' : 'no outcome' });
    }
  }
  return out;
}

if (process.env.REQ_RUN || (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1]))) {
  if (LLM) await fakeModel();
  const all: Record<string, unknown>[] = [];
  for (const arm of ARMS) {
    let ok = 0, n = 0, still = 0;
    const why: Record<string, number> = {}, byReq: Record<string, number> = {};
    for (const seed of SEEDS) for (const r of await runOnce(arm, seed)) {
      n++; if (r.ok) ok++; if (r.ok === null) still++;
      if (!r.ok) why[r.why.slice(0, 50)] = (why[r.why.slice(0, 50)] ?? 0) + 1;
      if (r.ok) byReq[r.req] = (byReq[r.req] ?? 0) + 1;
      all.push({ arm, seed, ...r });
    }
    console.log(JSON.stringify({ arm, llm: LLM, requests: n, done: ok, rate: +(ok / n).toFixed(2), stillOn: still, why, doneBy: byReq }));
  }
  if (OUT) writeFileSync(OUT, JSON.stringify(all, null, 1));
}
