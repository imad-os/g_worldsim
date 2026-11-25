import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import type { AddressInfo } from 'node:net';
import { Kind } from '@worldsim/protocol';
import { Ai, AI_DEFAULTS } from '../ai/llm.js';
import { Planner } from '../ai/planner.js';
import { Chats, type ChatMsg } from '../ai/chatroom.js';
import { Db } from '../persist/db.js';
import { Logger } from '../log.js';
import { newWorld } from './helpers.js';

// A fake model: "wait" in the words = a two-step task (say, then stay 2 game minutes); otherwise a plain answer.
const prompts: string[] = [];
const fake = createServer((req, res) => {
  let b = '';
  req.on('data', (c) => (b += c));
  req.on('end', () => {
    const body = JSON.parse(b || '{}');
    const user = body.messages?.find((m: { role: string }) => m.role === 'user')?.content ?? '';
    prompts.push(user);
    const content = /says to you: ".*wait/.test(user)
      ? JSON.stringify({ say: 'Sure, I will wait there.', task: 'wait by the well', plan: [{ do: 'say', text: 'Waiting.' }, { do: 'stay', minutes: 2 }] })
      : JSON.stringify({ say: 'Hello from far away.', do: 'nothing' });
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ message: { role: 'assistant', content } }));
  });
});
await new Promise<void>((ok) => fake.listen(0, '127.0.0.1', ok));
const base = `http://127.0.0.1:${(fake.address() as AddressInfo).port}`;
after(() => fake.close());
const log = new Logger('error');
const settle = async (c: Chats) => { for (let k = 0; k < 200 && c.pending > 0; k++) await new Promise((r) => setTimeout(r, 10)); };

test('panel chat: direct messages, a long task reported "done", world and clan channels, bounded answers', async () => {
  const w = newWorld('chat-1');
  w.populate();
  const ai = new Ai({ ...AI_DEFAULTS, provider: 'none' }, {}, log);
  ai.apply({ provider: 'ollama', ollamaUrl: base, model: 'm' });
  const p = new Planner(w, ai, log);
  const e = w.e;
  const agents: number[] = [];
  for (let k = 0; k < e.hi; k++) if (e.kind[k] === Kind.Agent) agents.push(k);
  const a = agents[0]!, b = agents[1]!, m = e.map[a]!;
  const pl = w.spawnPlayer(m, e.x[a]! + 30, e.y[a]!);
  w.playerProfile(pl, 'imad');
  const me = e.id(pl);
  p.players = () => [['imad', pl]];
  const told: { to: string[] | null; m: ChatMsg }[] = [];
  const db = new Db(':memory:');
  const chats = new Chats(db, w, p, {
    charOf: (n) => (n === 'imad' ? me : -1), playerOf: (id) => w.profiles.get(id)?.player ?? '',
    aiReady: () => ai.status().ready, notify: (to, msg) => told.push({ to, m: msg }),
  });
  p.onTaskEnd = (id, from, text, ok, why) => chats.taskEnded(id, from, text, ok, why);
  const calm = () => { for (const k of agents) { e.hunger[k] = 0; e.thirst[k] = 0; e.tired[k] = 0; } };

  // 1. A direct message with an order: the answer comes back written, the task starts from far away.
  const ida = e.id(a), nameA = w.profileOf(a)!.name;
  const { chan } = chats.send(me, 'imad', { to: ida, text: 'Please wait by the well for me.' });
  assert.equal(chan, Chats.dm(me, ida));
  await settle(chats);
  let r = chats.read(me, chan);
  assert.deepEqual(r.msgs.map((x) => x.name), ['imad', nameA]);
  assert.equal(r.msgs[1]!.text, 'Sure, I will wait there.');
  assert.match(prompts.at(-1)!, /written message only to you/);
  assert.equal(w.profileOf(a)!.mind!.task?.from, 'imad', 'the task is from the player');
  assert.ok(told.some((t) => t.to?.includes('imad') && t.m.from === ida), 'the player\'s panel is told');
  // 2. The task ends: they write "Done" by themselves (no AI call).
  const before = prompts.length;
  for (let t = 0; t < 20 * 60 && w.profileOf(a)!.mind!.task; t++) { calm(); w.step(); }
  assert.equal(w.profileOf(a)!.mind!.task, undefined, 'the task ended');
  r = chats.read(me, chan);
  assert.equal(r.msgs.at(-1)!.text, 'Done: wait by the well.');
  assert.equal(prompts.length, before, 'no AI call for the report');
  // Unread counts: read marks clear them.
  const l = chats.list(me);
  assert.deepEqual(l.chans.map((c) => c.kind), ['world', 'dm']);
  assert.equal(l.chans[1]!.unread, 0);
  assert.ok(l.people.some((x) => x.id === ida && !x.player));

  // 3. World channel: the person named answers; then nobody unnamed for 20 s (one answer per message at most).
  const nameB = w.profileOf(b)!.name, idb = e.id(b);
  await new Promise((ok) => setTimeout(ok, 1300));
  chats.send(me, 'imad', { chan: 'world', text: `Hello ${nameB}, are you there?` });
  await settle(chats);
  let wm = chats.read(me, 'world').msgs.filter((x) => !x.sys);
  assert.deepEqual(wm.map((x) => x.from), [me, idb]);
  assert.match(prompts.at(-1)!, /world channel/);
  await new Promise((ok) => setTimeout(ok, 1300));
  chats.send(me, 'imad', { chan: 'world', text: 'Anyone else?' });
  await settle(chats);
  wm = chats.read(me, 'world').msgs.filter((x) => !x.sys);
  assert.equal(wm.length, 3, 'no second unnamed answer within 20 s');
  assert.throws(() => chats.send(me, 'imad', { chan: 'world', text: 'too fast' }), /slow down/);
  // Big moments are posted by the engine.
  w.emit('partner', { a: ida, b: idb, wed: true });
  assert.match(chats.read(me, 'world').msgs.at(-1)!.text, new RegExp(`${nameA} and ${nameB} are married`));

  // 4. Clan channel: only members read it; up to 2 members answer.
  await new Promise((ok) => setTimeout(ok, 1300));
  assert.throws(() => chats.send(me, 'imad', { chan: 'clan:1', text: 'hi' }), /not in a clan/);
  const c = w.clans.found(m, ida, [idb, me, ...agents.slice(2).map((k) => e.id(k))]);
  const cc = `clan:${c.id}`;
  assert.ok(chats.list(me).chans.some((x) => x.chan === cc));
  chats.send(me, 'imad', { chan: cc, text: 'Good evening, clan.' });
  await settle(chats);
  const cm = chats.read(me, cc).msgs.filter((x) => !x.sys && x.from !== me);
  assert.equal(cm.length, 2, 'two members answer');
  assert.ok(cm.some((x) => x.from === ida), 'the leader answers for the clan');
  const other = w.spawnPlayer(m, 5, 5); w.playerProfile(other, 'sam');
  assert.throws(() => chats.read(e.id(other), cc), /not in that clan/);
  assert.throws(() => chats.read(e.id(other), chan), /not your chat/);

  // 5. AI off: a direct message still gets a built-in answer; the world channel stays quiet unless someone is named.
  ai.apply({ provider: 'none' });
  await new Promise((ok) => setTimeout(ok, 1300));
  const n0 = chats.read(me, 'world').msgs.length;
  chats.send(me, 'imad', { chan: 'world', text: 'Quiet day.' });
  await settle(chats);
  assert.equal(chats.read(me, 'world').msgs.length, n0 + 1);
  await new Promise((ok) => setTimeout(ok, 1300));
  chats.send(me, 'imad', { to: idb, text: 'How are you?' });
  await settle(chats);
  assert.equal(chats.read(me, Chats.dm(me, idb)).msgs.length, 2);
});
