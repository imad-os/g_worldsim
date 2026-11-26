import { test } from 'node:test';
import assert from 'node:assert/strict';
import { EFlag, Kind } from '@worldsim/protocol';
import { scenario } from './helpers.js';
import { World } from '../sim/world.js';
import { CALL_MIN } from '../sim/influence.js';
import { voteScore } from '../sim/clans.js';

const mk = (seed: string) => new World(scenario(), { tickRate: 20, clockScale: 30, capacity: 2048, seed });
const agentsOn = (w: World, m: number) => [...Array(w.e.hi).keys()].filter((i) => w.e.kind[i] === Kind.Agent && w.e.map[i] === m);

test('influence: saving a child counts most, plain kills and tasks a little, killing a person costs a lot; deeds fade', () => {
  const w = mk('inf-deeds');
  w.populate(); w.land.setup();
  const e = w.e, town = w.mapIndex.get('town')!, [a, b, kid] = agentsOn(w, town) as [number, number, number];
  const A = e.id(a), B = e.id(b), K = e.id(kid);
  e.flags[kid]! |= EFlag.Child;
  const v0 = w.influence.of(A);
  assert.ok(v0 >= 10, `starts at 10 + level (${v0})`);

  // A zombie bites the child, A kills it: a rescue.
  const z = w.zombies.spawn(town, e.x[kid]! + 1, e.y[kid]!, true);
  w.emit('bitten', { id: K, by: e.id(z), hp: 60 });
  let saved: unknown = null; w.listeners.push((x) => { if (x.kind === 'influence') saved = x.data; });
  assert.ok(w.zombies.hit(z, 9999, a));
  assert.deepEqual(saved, { id: A, saved: K, child: true });
  const v1 = w.influence.of(A);
  assert.ok(v1 - v0 >= 6, `saving a child: +${v1 - v0}`);
  assert.match(w.influence.log(A)[0]!.why, /saved .*a child/);

  // B kills a zombie that was biting nobody: a small gain.
  const vb = w.influence.of(B);
  const z2 = w.zombies.spawn(town, 5, 5, true);
  w.zombies.hit(z2, 9999, b);
  const dz = w.influence.of(B) - vb;
  assert.ok(dz >= 1 && dz < v1 - v0, `a zombie kill counts less (+${dz})`);

  // Tasks and rules move it both ways.
  const t0 = w.influence.of(B);
  for (let k = 0; k < 5; k++) w.emit('task', { id: B, text: 'x', ok: true });
  const t1 = w.influence.of(B); assert.ok(t1 > t0, 'tasks done');
  for (let k = 0; k < 3; k++) w.emit('rule', { id: B, text: 'r', did: 'failed' });
  assert.ok(w.influence.of(B) < t1, 'broken rules');

  // Killing a person is the worst.
  const k0 = w.influence.of(A);
  w.emit('death', { id: B, cause: 'shot', by: A });
  assert.ok(k0 - w.influence.of(A) >= 10, 'a killer loses influence');

  // It fades with time.
  const p = w.profileOf(a)!; p.influence!.d = 50;
  w.influence.update(); for (let h = 0; h < 6 * 24; h++) { (w as unknown as { gameSec: number }).gameSec += 3600; w.influence.update(); }
  assert.ok(Math.abs(p.influence!.d - 25) < 2, `half gone in 6 days (${p.influence!.d.toFixed(1)})`);
  assert.match(w.influence.promptText(A), /influence among the people: \d+\/100/);
});

test('influence: calling a vote needs 40, candidates are the most influential, the influential one wins the hybrid vote', () => {
  const w = mk('inf-vote');
  w.populate(); w.land.setup(); w.quests.setup();
  const e = w.e, town = w.mapIndex.get('town')!, people = agentsOn(w, town);
  assert.ok(people.length >= 5);
  const ids = people.map((i) => e.id(i));
  const cl = w.clans.found(town, ids[0]!, ids.slice(1));
  const set = (id: number, d: number) => { const p = w.profiles.get(id)!; p.xp = 0; p.influence = { d, log: [] }; };
  for (const id of ids) set(id, 0);
  for (const a of ids) for (const b of ids) if (a !== b) { const p = w.profiles.get(a)!; p.mind ??= { notes: [], summary: '', mood: 'calm', rel: {}, lastPlan: -1e9 }; p.mind.rel['#' + b] = 0; }
  const hero = ids[3]!;
  set(hero, 60);
  // A player with low influence can't call one.
  const pl = w.spawnPlayer(town, e.x[people[0]!]!, e.y[people[0]!]!); w.playerProfile(pl, 'tester');
  w.clans.join(cl, e.id(pl), 0.5);
  (w as unknown as { gameSec: number }).gameSec += 7 * 3600;
  const r = w.clans.playerDo(pl, 'call');
  assert.equal(r.code, 'clanLowInfluence'); assert.equal(r.need, CALL_MIN);
  set(e.id(pl), 45);
  assert.equal(w.clans.playerDo(pl, 'call').code, 'clanVoteOn');
  assert.ok(cl.vote!.cands.includes(hero), 'the most influential stands');
  w.clans.closeVote(cl);
  assert.equal(cl.leader, hero, `the most influential wins (tally ${JSON.stringify(cl.result?.tally)})`);

  // Feelings still matter: a hated person barely ahead in influence loses to a liked one.
  assert.ok(voteScore(55, -5, false, 0.5) < voteScore(45, 4, false, 0.5));
  assert.ok(voteScore(90, -1, false, 0.5) > voteScore(30, 2, false, 0.5));
});
