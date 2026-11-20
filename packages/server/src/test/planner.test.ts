import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import type { AddressInfo } from 'node:net';
import { Act, Kind } from '@worldsim/protocol';
import { Ai, AI_DEFAULTS } from '../ai/llm.js';
import { Planner, cleanLine, askedFor, agrees } from '../ai/planner.js';
import { Logger } from '../log.js';
import { serialize, restore } from '../persist/snapshot.js';
import { newWorld } from './helpers.js';

// A fake Ollama that plans like a model would: everyone named in the prompt wants to talk to the first person.
let mode: 'ok' | 'junk' | 'think' | 'order' | 'forget' | 'plan' = 'ok';
let orderTarget = '';
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
    const sys = body.messages?.find((m: any) => m.role === 'system')?.content ?? '';
    if (/"say":"the words you say"/.test(sys)) { // a chat
      content = mode === 'think' ? '<think>hmm, who is this</think>Mira: "Hello there, stranger."' // forgot the JSON
        : mode === 'order' ? JSON.stringify({ say: "On my way!", do: 'goto', target: orderTarget })
        : mode === 'plan' ? JSON.stringify({ say: "Alright, I'll look around.", do: 'nothing', task: 'find a wife', plan: [
          { do: 'find', what: 'single woman' }, { do: 'talk', who: 'found', times: 2 }, { do: 'court', who: 'found' }, { do: 'say', text: 'Done.' }] })
        : mode === 'forget' ? JSON.stringify({ say: "Sure, I'm coming." }) // agreed but forgot "do"
        : JSON.stringify({ say: 'Hello there, stranger.', do: 'nothing', target: '' });
      res.end(JSON.stringify({ message: { role: 'assistant', content } }));
      return;
    }
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

test('chat orders: what people are asked to do, they do (model JSON, the speaker\'s words, or the panel)', async () => {
  assert.equal(askedFor('come search for me'), 'come');
  assert.equal(askedFor('Viens me chercher stp'), 'come');
  assert.equal(askedFor('ven aquí'), 'come');
  assert.equal(askedFor('تعال هنا'), 'come');
  assert.equal(askedFor('follow me to the river'), 'follow');
  assert.equal(askedFor('suis-moi'), 'follow');
  assert.equal(askedFor('wait here'), 'stay');
  assert.equal(askedFor('how are you?'), '');
  assert.ok(agrees("I'm coming!")); assert.ok(agrees("D'accord, j'arrive.")); assert.ok(!agrees('No way.'));

  const { w, ai, p } = setup();
  ai.apply({ provider: 'ollama', ollamaUrl: base, model: 'm' });
  const agents: number[] = [];
  for (let k = 0; k < w.e.hi; k++) if (w.e.kind[k] === Kind.Agent) agents.push(k);
  const [a, b] = agents as [number, number];
  const e = w.e, m = e.map[a]!;
  // Keep them fed so no desperate need interferes; put b 25 m away and hold it still.
  const calm = () => { for (const k of agents) { e.hunger[k] = 0; e.thirst[k] = 0; e.tired[k] = 0; } };
  calm();
  w.place(b, m, e.x[a]! + 25, e.y[a]!);
  const hold = () => { w.brain.stop(b); e.nextThink[b] = w.tick + 100000; };
  hold();
  // 1. The model answers with an action: go to b.
  mode = 'order'; orderTarget = w.profileOf(b)!.name;
  const r = await p.chat(a, 'owner', `Go and find ${orderTarget}.`);
  assert.equal(r.reply, 'On my way!');
  assert.match(r.did, new RegExp(`go to ${orderTarget}`));
  assert.equal(w.brain.orderOf(a).kind, 'come');
  for (let t = 0; t < 20 * 60 && Math.hypot(e.x[a]! - e.x[b]!, e.y[a]! - e.y[b]!) > 2.6; t++) { calm(); w.step(); }
  const d1 = Math.hypot(e.x[a]! - e.x[b]!, e.y[a]! - e.y[b]!);
  assert.ok(d1 <= 2.6, `walked to them: ${d1.toFixed(1)} m left`);

  // 2. The model forgets "do" but its answer agrees, and the player's words said "come": it comes to the player.
  const pl = w.spawnPlayer(m, e.x[a]! - 20, e.y[a]!);
  p.players = () => [['imad', pl]];
  mode = 'forget';
  const r2 = await p.chat(a, 'imad', 'come search for me', pl);
  assert.equal(r2.reply, "Sure, I'm coming.");
  assert.match(r2.did, /go to imad/);
  for (let t = 0; t < 20 * 60 && Math.hypot(e.x[a]! - e.x[pl]!, e.y[a]! - e.y[pl]!) > 2.6; t++) { calm(); hold(); w.step(); }
  const d2 = Math.hypot(e.x[a]! - e.x[pl]!, e.y[a]! - e.y[pl]!);
  assert.ok(d2 <= 2.6, `came to the player: ${d2.toFixed(1)} m left`);

  // 3. The panel's order, no AI: follow b; b walks away, a keeps up.
  ai.apply({ provider: 'none' });
  assert.match(p.orderFromPanel(a, 'follow', w.profileOf(b)!.name), /follow/);
  e.nextThink[b] = w.tick;
  w.brain.goTo(b, e.x[b]! - 15, e.y[b]! + 10);
  for (let t = 0; t < 20 * 40; t++) { calm(); w.step(); }
  const d3 = Math.hypot(e.x[a]! - e.x[b]!, e.y[a]! - e.y[b]!);
  assert.ok(d3 < 5, `kept up with them: ${d3.toFixed(1)} m`);
  assert.equal(w.brain.orderOf(a).kind, 'follow');
  // 4. Bring food (no AI, the owner's words): empty hands -> find food, pick it up, hand it to the player.
  assert.equal(askedFor('bring me some food'), 'bring');
  assert.equal(askedFor('apporte-moi à manger'), 'bring');
  e.carry[a] = 0; e.carry[pl] = 0;
  const r4 = await p.chat(a, 'imad', 'please bring me some food', pl);
  assert.match(r4.did, /bring food to imad/);
  for (let t = 0; t < 20 * 400 && e.carry[pl]! === 0; t++) { calm(); w.step(); }
  assert.equal(e.carry[pl], 1, 'the player got one food');
  p.orderFromPanel(a, 'follow', w.profileOf(b)!.name);
  // Stop: the order ends.
  p.orderFromPanel(a, 'stop', '');
  assert.equal(w.brain.orderOf(a).kind, '');
  mode = 'ok';
});

test('any request becomes a plan of steps the engine runs: "go and find a wife"', async () => {
  const { w, ai, p } = setup();
  ai.apply({ provider: 'ollama', ollamaUrl: base, model: 'm' });
  const e = w.e;
  const agents: number[] = [];
  for (let k = 0; k < e.hi; k++) if (e.kind[k] === Kind.Agent) agents.push(k);
  // A single adult man, and single adult women on the same map; nobody partnered, nobody related.
  for (const k of agents) { const pr = w.profileOf(k)!; pr.partner = -1; pr.parents = []; pr.born = w.gameSec - 25 * w.yearSec; }
  const man = agents.find((k) => w.profileOf(k)!.sex === 'm')!;
  const women = agents.filter((k) => w.profileOf(k)!.sex === 'f');
  assert.ok(man !== undefined && women.length, 'a man and a woman in the world');
  for (const k of women) w.place(k, e.map[man]!, e.x[man]! + 20, e.y[man]!);
  const calm = () => { for (const k of agents) { e.hunger[k] = 0; e.thirst[k] = 0; e.tired[k] = 0; } };
  calm();
  mode = 'plan';
  const r = await p.chat(man, 'owner', 'go and find a wife');
  assert.match(r.did, /find a wife \(find > talk > court > say\)/);
  const t0 = w.profileOf(man)!.mind!.task!;
  assert.equal(t0.steps.length, 4);
  const events: string[] = [];
  w.listeners.push((ev) => { if (ev.kind === 'task' || ev.kind === 'partner' || ev.kind === 'talk') events.push(ev.kind); });
  for (let t = 0; t < 20 * 900 && w.profileOf(man)!.mind!.task; t++) { calm(); w.step(); }
  assert.equal(w.profileOf(man)!.mind!.task, undefined, 'the task ended');
  assert.ok(events.includes('talk'), 'they talked');
  const pr = w.profileOf(man)!;
  const note = pr.mind!.notes.map((n) => n.text).join(' | ');
  // Courting may succeed or be refused ("not yet"): either way it really happened, next to her.
  if (pr.partner >= 0) {
    assert.equal(w.profiles.get(pr.partner)!.sex, 'f');
    assert.match(note, /I did what the voice from the sky asked: find a wife/);
  } else assert.match(note, /could not find a wife: .*not yet/);
  const her = women.map((k) => e.id(k)).find((id) => (pr.bonds?.['#' + id] ?? 0) >= 3);
  assert.ok(her !== undefined, 'he talked with one of them three times (2 talks + courting)');
  mode = 'ok';
});
