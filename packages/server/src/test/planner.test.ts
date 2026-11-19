import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import type { AddressInfo } from 'node:net';
import { Act, Kind } from '@worldsim/protocol';
import { Ai, AI_DEFAULTS } from '../ai/llm.js';
import { Planner, cleanLine } from '../ai/planner.js';
import { Logger } from '../log.js';
import { serialize, restore } from '../persist/snapshot.js';
import { newWorld } from './helpers.js';

// A fake Ollama that plans like a model would: everyone named in the prompt wants to talk to the first person.
let mode: 'ok' | 'junk' | 'think' = 'ok';
const prompts: string[] = [];
const fake = createServer((req, res) => {
  let b = '';
  req.on('data', (c) => (b += c));
  req.on('end', () => {
    res.setHeader('content-type', 'application/json');
    const body = JSON.parse(b || '{}');
    const user = body.messages?.find((m: any) => m.role === 'user')?.content ?? '';
    prompts.push(user);
    const names = [...user.matchAll(/^Person: (\S+)/gm)].map((m: RegExpMatchArray) => m[1]);
    let content: string;
    if (body.format !== 'json') content = mode === 'think' ? '<think>hmm, who is this</think>Mira: "Hello there, stranger."' : 'Hello there, stranger.';
    else if (mode === 'junk') content = 'I would rather not.';
    else content = JSON.stringify({ people: names.map((n, k) => ({ name: n, goal: 'talk', with: k ? names[0] : names[1] ?? '', why: 'company', say: `Hey, it's ${n}.`, mood: 'hopeful', memory: `${n} remembers the long winter.` })) });
    res.end(JSON.stringify({ message: { role: 'assistant', content } }));
  });
});
await new Promise<void>((ok) => fake.listen(0, '127.0.0.1', ok));
const base = `http://127.0.0.1:${(fake.address() as AddressInfo).port}`;
after(() => fake.close());
const log = new Logger('error');

function setup() {
  const w = newWorld('plan-1');
  w.populate();
  const ai = new Ai({ ...AI_DEFAULTS, provider: 'none' }, {}, log);
  const p = new Planner(w, ai, log, { minGapSec: 2 });
  return { w, ai, p };
}

test('planner: one batched request plans for everyone on the map, wishes steer the brain, memory and lines kept', async () => {
  const { w, ai, p } = setup();
  const said: string[] = [];
  p.onSay = (_i, t) => said.push(t);
  await p.tick(); // AI off: nothing happens
  assert.equal(p.counts.batches, 0);
  ai.apply({ provider: 'ollama', ollamaUrl: base, model: 'm' });
  await p.tick();
  assert.equal(p.counts.batches, 1, 'one request');
  assert.equal(prompts.length, 1);
  const people = [...w.profiles.values()];
  assert.equal(p.counts.plans, people.length, 'one plan per person, all in one request (5 <= batch)');
  for (const pr of people) {
    assert.equal(pr.mind!.plan!.act, 'talk');
    assert.equal(pr.mind!.mood, 'hopeful');
    assert.match(pr.mind!.summary, /long winter/);
  }
  assert.equal(said.length, people.length);
  assert.match(prompts[0]!, /Possible goals: .*forage/);
  assert.ok(!/travel \(/.test(prompts[0]!), 'travel is not offered while closed');
  // Nobody is due again right away; the gap between requests holds too.
  await p.tick();
  assert.equal(p.counts.batches, 1);
  // The brain follows the wish: within a game hour several people talk.
  let talked = 0;
  w.listeners.push((ev) => { if (ev.kind === 'talk') talked++; });
  for (let t = 0; t < 20 * 60 * 3; t++) w.step();
  assert.ok(talked >= 1, `talks: ${talked}`);
  // A death is big news: those who saw it are planned first, and know about it.
  const e = w.e;
  let victim = -1;
  for (let i = 0; i < e.hi; i++) if (e.kind[i] === Kind.Agent) { victim = i; break; }
  const vname = w.profileOf(victim)!.name;
  w.emit('death', { id: e.id(victim), cause: 'thirst', map: 'town' });
  w.remove(victim, 'thirst');
  const someone = [...w.profiles.values()].find((q) => q.name !== vname)!;
  assert.equal(someone.mind!.urgent, true);
  assert.match(someone.mind!.notes.at(-1)!.text, new RegExp(`${vname} died`));
});

test('planner: a junk answer is a counted failure and the world goes on; chat answers, built-in lines when AI is off', async () => {
  const { w, ai, p } = setup();
  ai.apply({ provider: 'ollama', ollamaUrl: base });
  mode = 'junk';
  const i = (() => { for (let k = 0; k < w.e.hi; k++) if (w.e.kind[k] === Kind.Agent) return k; return -1; })();
  assert.equal(await p.plan([i]), 0);
  assert.equal(p.counts.failures, 1);
  assert.ok(p.log.at(-1)!.err);
  mode = 'think';
  const name = w.profileOf(i)!.name;
  const r = await p.chat(i, 'owner', 'Who are you?');
  assert.equal(r.ai, true);
  assert.equal(r.reply, 'Hello there, stranger.', 'think block, quotes and a name prefix removed');
  assert.match(prompts.at(-1)!, /Who are you\?/);
  assert.match(w.profileOf(i)!.mind!.notes.at(-1)!.text, /Who are you/);
  ai.apply({ provider: 'none' });
  const r2 = await p.chat(i, 'imad', null);
  assert.equal(r2.ai, false);
  assert.ok(r2.reply.length > 3);
  assert.equal(cleanLine(`${name}: "Hi."`, name), 'Hi.');
  mode = 'ok';
});

test('planner: minds and wishes survive a snapshot', async () => {
  const { w, ai, p } = setup();
  ai.apply({ provider: 'ollama', ollamaUrl: base });
  await p.tick();
  const bytes = serialize(w);
  const w2 = newWorld('plan-1');
  restore(w2, bytes);
  const p2 = new Planner(w2, new Ai({ ...AI_DEFAULTS, provider: 'none' }, {}, log), log);
  const any = [...w2.profiles.values()][0]!;
  assert.match(any.mind!.summary, /long winter/);
  let wished = 0;
  for (let i = 0; i < w2.e.hi; i++) if (w2.e.kind[i] === Kind.Agent && w2.brain.wishOf(i) === Act.Talk) wished++;
  assert.equal(wished, w2.e.countKind(Kind.Agent));
  assert.ok(p2);
});
