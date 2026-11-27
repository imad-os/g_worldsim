import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Kind, QUESTS, NPCS } from '@worldsim/protocol';
import { scenario } from './helpers.js';
import { World } from '../sim/world.js';

const mk = (seed: string) => new World(scenario(), { tickRate: 20, clockScale: 30, capacity: 2048, seed });
const agentsOn = (w: World, m: number) => [...Array(w.e.hi).keys()].filter((i) => w.e.kind[i] === Kind.Agent && w.e.map[i] === m);
const calm = (w: World, ids: number[]) => { for (const i of ids) { w.e.hunger[i] = 0; w.e.thirst[i] = 0; w.e.tired[i] = 0; } };
/** Put slot i right next to an NPC. */
const nextTo = (w: World, i: number, key: string) => { const j = w.quests.npcSlot(key); w.place(i, w.e.map[j]!, w.e.x[j]! + 1.2, w.e.y[j]!); };

test('quests: the NPCs stand in Old Town and Ridgeford (not people); a player takes, does and hands in quests in order', () => {
  const w = mk('quest-player');
  w.populate(); w.land.setup(); w.quests.setup();
  const e = w.e, town = w.mapIndex.get('town')!;
  assert.equal(w.quests.npcs.size, NPCS.length);
  for (const [k, id] of w.quests.npcs) { const j = e.slot(id), at = NPCS.find((n) => n.key === k)!.map; assert.equal(e.kind[j], Kind.Npc); assert.equal(e.map[j], at ? w.mapIndex.get(at) : town); assert.equal(w.profiles.has(id), false, 'an NPC is not a person'); }
  // Set up again (a restart): still 5, never 10.
  w.quests.setup();
  let n = 0; for (let i = 0; i < e.hi; i++) if (e.alive(i) && e.kind[i] === Kind.Npc) n++;
  assert.equal(n, NPCS.length);

  const pl = w.spawnPlayer(town, 60, 60); w.playerProfile(pl, 'tester');
  const id = e.id(pl);
  // Quest 1 from the guide: meet the warden, come back.
  nextTo(w, pl, 'warden');
  assert.equal(w.quests.talk(pl, 'warden').state, 'elsewhere', 'the warden sends me to the guide first');
  nextTo(w, pl, 'guide');
  const t1 = w.quests.talk(pl, 'guide');
  assert.equal(t1.state, 'taken'); assert.equal(t1.quest, 'q1');
  nextTo(w, pl, 'warden'); w.quests.talk(pl, 'warden');
  assert.equal(w.quests.state(id).cur?.ready, true, 'meeting the warden counts');
  const xp0 = w.profileOf(pl)!.xp ?? 0, food0 = e.carry[pl]!;
  nextTo(w, pl, 'guide');
  assert.equal(w.quests.talk(pl, 'guide').state, 'handed');
  assert.deepEqual(w.quests.state(id).done, ['q1']);
  assert.ok((w.profileOf(pl)!.xp ?? 0) > xp0 && e.carry[pl]! > food0, 'reward: xp and food');
  // Quest 2 (drink) is taken from the guide; a real drink at the water counts.
  assert.equal(w.quests.talk(pl, 'guide').quest, 'q2');
  const tm = w.maps[town]!.tiles, WATER = w.sc.tiles.find((t) => t.name === 'water')!.id;
  let wx = -1, wy = -1;
  for (let y = 10; y < tm.h - 10 && wx < 0; y++) for (let x = 10; x < tm.w - 10; x++) if (tm.get(x, y) === WATER && tm.get(x + 2, y) !== WATER && !tm.isSolidAt(x + 2.5, y + 0.5)) { wx = x + 2.5; wy = y + 0.5; break; }
  assert.ok(wx > 0, 'water in town');
  w.place(pl, town, wx, wy); e.thirst[pl] = 50;
  assert.equal(w.brain.playerDo(pl, 'drink').code, 'drank');
  assert.equal(w.quests.state(id).cur?.ready, true);
  const rows = w.quests.rows(id);
  assert.equal(rows.length, QUESTS.length);
  assert.equal(rows[0]!.state, 'done'); assert.equal(rows[1]!.state, 'ready'); assert.equal(rows[2]!.state, 'locked');
  // NPCs stay where they stand while the world runs.
  const g = w.quests.npcSlot('guide'), gx = e.x[g]!, gy = e.y[g]!;
  for (let k = 0; k < 400; k++) w.step();
  assert.ok(Math.hypot(e.x[g]! - gx, e.y[g]! - gy) < 1.5, 'the guide stays at her spot');
});

test('quests: an AI person goes to the teachers by themselves, finishes the first quest and keeps its lesson', () => {
  const w = mk('quest-ai');
  w.populate(); w.land.setup(); w.quests.setup();
  const town = w.mapIndex.get('town')!, people = agentsOn(w, town);
  const i = people[0]!, id = w.e.id(i);
  assert.ok(w.quests.planFor(i), 'a quest task');
  assert.match(w.tasks.describe(id), /quest/);
  for (let k = 0; k < 20 * 3600 * 3 / 30 && !w.quests.state(id).done.includes('q1'); k++) { calm(w, people); w.step(); }
  assert.ok(w.quests.state(id).done.includes('q1'), `q1 handed in (now: ${w.tasks.describe(id)})`);
  assert.match(w.quests.promptText(i), /teachers/, 'the lesson is in the prompt');
  // Left alone in daytime, free AI people take quests on their own.
  const before = people.filter((x) => w.quests.state(w.e.id(x)).cur || w.quests.state(w.e.id(x)).done.length).length;
  for (let k = 0; k < 20 * 3600 * 6 / 30; k++) { calm(w, people); w.step(); }
  const after = people.filter((x) => w.quests.state(w.e.id(x)).cur || w.quests.state(w.e.id(x)).done.length).length;
  assert.ok(after > before, `more people on quests (${before} -> ${after})`);
});

test('clans: founded at the registrar, joined by asking, leaders elected by the members, a player votes, quits and founds', () => {
  const w = mk('clan-deep');
  w.populate(); w.land.setup(); w.quests.setup();
  const e = w.e, town = w.mapIndex.get('town')!, people = agentsOn(w, town);
  const ev: string[] = [];
  w.listeners.push((x) => ev.push(x.kind));
  // An AI founder walks to Odile and founds.
  const [a, b, c, d] = people as [number, number, number, number];
  w.tasks.start(a, 'found a clan', 'myself', [{ do: 'clan', what: 'found' }]);
  for (let k = 0; k < 20 * 3600 / 30 && !w.clans.clanOf(e.id(a)); k++) { calm(w, people); w.step(); }
  const cl = w.clans.clanOf(e.id(a));
  assert.ok(cl, 'founded');
  const r = w.quests.npcSlot('registrar');
  assert.ok(Math.hypot(e.x[a]! - e.x[r]!, e.y[a]! - e.y[r]!) < 4.5, 'at the registrar');
  // Others join by walking to the leader and asking.
  for (const x of [b, c, d]) w.tasks.start(x, 'join', 'myself', [{ do: 'clan', what: 'join', who: e.id(a) }]);
  for (let k = 0; k < 20 * 3600 / 30 && cl!.members.length < 4; k++) { calm(w, people); w.step(); }
  assert.ok(cl!.members.length >= 4, `joined (${cl!.members.length})`);
  assert.ok(ev.includes('clanJoin'));
  // The members dislike the leader and like b: an election makes b the leader.
  const rel = (x: number, y: number, v: number) => { const p = w.profileOf(x)!; p.mind ??= { notes: [], summary: '', mood: 'calm', rel: {}, lastPlan: 0 }; p.mind.rel['#' + e.id(y)] = v; };
  for (const x of [c, d]) { rel(x, a, -5); rel(x, b, 5); }
  rel(a, b, 5);
  assert.ok(w.clans.approval(cl!) < 50, `approval low (${w.clans.approval(cl!)})`);
  assert.ok(w.clans.callVote(cl!, 'test'));
  assert.ok(cl!.vote!.cands.includes(e.id(b)), 'b stands');
  w.clans.closeVote(cl!);
  assert.equal(cl!.leader, e.id(b), 'b elected');
  assert.ok(ev.includes('clanVote') && ev.includes('clanLeader'));
  // A player: joins, votes in the next election (their ballot counts), quits, founds only next to the registrar.
  const pl = w.spawnPlayer(town, e.x[b]! + 2, e.y[b]!); w.playerProfile(pl, 'tester');
  assert.equal(w.clans.playerDo(pl, `join:${cl!.id}`).code, 'clanJoined');
  assert.ok(cl!.members.includes(e.id(pl)));
  w.clans.callVote(cl!, 'test 2');
  const cand = cl!.vote!.cands.find((k) => k !== cl!.leader)!;
  assert.equal(w.clans.playerDo(pl, `vote:${cand}`).code, 'clanVoted');
  assert.ok(cl!.vote!.ballots.some(([v, k]) => v === e.id(pl) && k === cand));
  w.clans.closeVote(cl!);
  assert.equal(w.clans.playerDo(pl, 'quit').code, 'clanLeft');
  assert.equal(w.clans.playerDo(pl, 'found:Wolves').code, 'clanAtRegistrar', 'only at the registrar');
  nextTo(w, pl, 'registrar');
  const f = w.clans.playerDo(pl, 'found:Wolves');
  assert.equal(f.code, 'clanFounded'); assert.equal(f.name, 'Wolves');
  assert.equal(w.clans.clanOf(e.id(pl))!.leader, e.id(pl));
  // Joining the player's clan from the old one = a switch.
  w.clans.join(w.clans.clanOf(e.id(pl))!, e.id(d), 0.5);
  assert.ok(ev.includes('clanSwitch') && !cl!.members.includes(e.id(d)));
  // A player leader's order reaches the members on the same map.
  const o = w.clans.playerDo(pl, 'order:gather wood for the camp');
  assert.equal(o.code, 'clanOrdered'); assert.equal(o.n, 1);
});

test('clans: an AI leader gives an order of the day and the members do it as a task from the leader', () => {
  const w = mk('clan-order');
  w.populate(); w.land.setup(); w.quests.setup();
  const e = w.e, town = w.mapIndex.get('town')!, people = agentsOn(w, town);
  const cl = w.clans.found(town, e.id(people[0]!), people.slice(1).map((i) => e.id(i)));
  // Loyal members: each one takes an order by chance (0.15 + loyalty x 0.6), so at the starting 0.5 all four say no on ~9 % of seeds.
  for (const id of cl.members) (w.clans as unknown as { loyal: Map<number, number> }).loyal.set(id, 1);
  for (const i of people) w.tasks.stop(i);
  assert.ok(w.survival.crateOf(town, e.x[people[0]!]!, e.y[people[0]!]!), 'the camp has a store');
  // Morning, nothing in the store: "collect food and store it".
  w.gameSec += ((9 - w.brain.hour() + 24) % 24) * 3600;
  let ordered = 0;
  w.listeners.push((x) => { if (x.kind === 'clanOrder') ordered = Number(x.data.n); });
  // The camp leader may hand out the day's work in the same hour, and each member says yes by chance: an order nobody took is
  // given again the next hour (the dice differ with every change to the world, so the test does not hang on one roll).
  const C = cl as { order?: string; orderAt?: number };
  for (let k = 0; k < 20 * 3600 * 6 / 30 && !(cl.order && ordered >= 1); k++) {
    if (cl.order && ordered === 0) { C.order = undefined; C.orderAt = -1e9; }
    calm(w, people); for (const i of people.slice(1)) if (w.profileOf(i)?.mind?.task && !cl.order) w.tasks.stop(i); w.step();
  }
  assert.ok(cl.order, 'an order was given');
  assert.ok(ordered >= 1, `members took it (${ordered})`);
  const leaderName = w.profiles.get(cl.leader)!.name;
  assert.ok(people.some((i) => (w.profileOf(i)?.mind?.task as { from?: string } | undefined)?.from === leaderName), 'a task from the leader');
});

test('quests: after the first 10, Mara sends you north; Ridgeford\'s teachers give quests 12-20; an AI person takes the road there', () => {
  const w = mk('quest-ridge');
  w.populate(); w.land.setup(); w.quests.setup();
  const e = w.e, town = w.mapIndex.get('town')!, ridge = w.mapIndex.get('ridge')!;
  assert.equal(QUESTS.length, 20);
  for (const k of ['mayor', 'healer', 'farmer', 'ranger', 'builder']) assert.equal(w.quests.npcMap(k), ridge, `${k} in Ridgeford`);
  // Every quest's giver exists, and the chain goes on in order.
  for (const q of QUESTS) assert.ok(w.quests.npcSlot(q.npc) >= 0, `${q.id}: ${q.npc}`);
  const pl = w.spawnPlayer(town, 60, 60); w.playerProfile(pl, 'walker');
  const id = e.id(pl);
  w.quests.state(id).done = QUESTS.slice(0, 10).map((q) => q.id);
  nextTo(w, pl, 'guide');
  const t = w.quests.talk(pl, 'guide');
  assert.equal(t.quest, 'q11'); assert.equal(t.state, 'taken');
  nextTo(w, pl, 'mayor');
  assert.equal(e.map[pl], ridge);
  w.quests.talk(pl, 'mayor');
  assert.equal(w.quests.state(id).cur?.ready, true, 'meeting the mayor counts');
  nextTo(w, pl, 'guide'); assert.equal(w.quests.talk(pl, 'guide').state, 'handed');
  nextTo(w, pl, 'mayor'); assert.equal(w.quests.talk(pl, 'mayor').quest, 'q12', 'the mayor gives the next one');
  // Herbs for the healer count from a real gather event.
  w.quests.state(id).cur = { id: 'q13', n: 0, at: w.gameSec };
  for (let k = 0; k < 3; k++) w.emit('gather', { id, what: 'herb', n: 1 });
  assert.equal(w.quests.state(id).cur?.ready, true);
  // Words find the teacher.
  assert.equal((w.quests.constructor as unknown as { keyFrom: (s: string) => string }).keyFrom('talk to Yasmin'), 'healer');
  assert.equal((w.quests.constructor as unknown as { keyFrom: (s: string) => string }).keyFrom('Elder Mara'), 'guide');
  // An AI person in Old Town with q12 next walks the road to Ridgeford (travel open) and takes it.
  w.travelOpen = true; w.land.block(false); w.zombies.perNight = 0;
  const a = agentsOn(w, town).find((i) => !(e.flags[i]! & 32))!, A = e.id(a);
  w.quests.state(A).done = QUESTS.slice(0, 11).map((q) => q.id);
  for (const i of agentsOn(w, town)) w.tasks.stop(i);
  w.gameSec += ((8 - w.brain.hour() + 24) % 24) * 3600;
  assert.ok(w.quests.planFor(a), 'a task to Ridgeford');
  let took = false;
  w.listeners.push((x) => { if (x.kind === 'quest' && x.data.id === A && x.data.quest === 'q12') took = true; });
  const end = w.gameSec + 8 * 3600;
  while (w.gameSec < end && !took) { calm(w, [a]); w.step(); }
  assert.ok(took, `took q12 in Ridgeford (map ${w.maps[e.map[a]!]?.def.id}, task ${JSON.stringify(w.profileOf(a)?.mind?.task?.text)})`);
  assert.equal(e.map[a], ridge);
});
