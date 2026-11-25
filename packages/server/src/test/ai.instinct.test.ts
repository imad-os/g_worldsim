import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Kind } from '@worldsim/protocol';
import { World } from '../sim/world.js';
import { SHORT, LONG } from '../sim/memory.js';
import { scenario } from './helpers.js';

/** A small town of 5, everyone set on open ground next to each other, all healthy. */
function town(seed: string, ai?: Partial<World['ai']>) {
  const w = new World(scenario(), { tickRate: 20, clockScale: 10, capacity: 1024, seed, ai });
  w.populate();
  const e = w.e, people: number[] = [];
  for (let i = 0; i < e.hi; i++) if (e.kind[i] === Kind.Agent) people.push(i);
  const s = w.freeSpot(0, 128, 128, 200)!;
  people.forEach((i, k) => { const p = w.freeSpot(0, s.x + k * 1.5, s.y, 30)!; w.place(i, 0, p.x, p.y); e.hp[i] = w.sc.agents.hp; });
  return { w, e, people };
}

test('instinct: fight or flight by the odds; friends close by and kin in danger change the answer', () => {
  const { w, e, people } = town('odds');
  const [a, b, c, d] = people as [number, number, number, number];
  // Alone (the others far away) against one zombie: fight.
  for (const j of [b, c, d, people[4]!]) { const p = w.freeSpot(0, e.x[a]! + 60, e.y[a]!, 30)!; w.place(j, 0, p.x, p.y); }
  w.profileOf(a)!.traits.courage = 0.5;
  const z1 = w.zombies.spawn(0, e.x[a]! + 4, e.y[a]!, true);
  assert.equal(w.brain.fightOrFlight(a, z1, false), true, 'one zombie: fight');
  // Three zombies, alone: run.
  const z2 = w.zombies.spawn(0, e.x[a]! + 4, e.y[a]! + 1, true), z3 = w.zombies.spawn(0, e.x[a]! + 4, e.y[a]! - 1, true);
  assert.equal(w.brain.fightOrFlight(a, z1, false), false, 'three zombies alone: run');
  // Friends come close (awake, healthy): together they can take them.
  for (const [k, j] of [b, c, d].entries()) { const p = w.freeSpot(0, e.x[a]! - 1, e.y[a]! + k - 1, 10)!; w.place(j, 0, p.x, p.y); }
  assert.equal(w.brain.fightOrFlight(a, z1, false), true, 'three zombies with three friends: fight');
  void z2; void z3;
  // A bear, bare hands, alone: run (a child of theirs next to it: they stand and fight).
  for (const j of [b, c, d]) { const p = w.freeSpot(0, e.x[a]! + 60, e.y[a]!, 30)!; w.place(j, 0, p.x, p.y); }
  for (let k = 0; k < e.hi; k++) if (e.kind[k] === Kind.Threat) w.remove(k, 'gone');
  w.survival.inv(a).axe = 0; w.survival.inv(a).spear = 0; w.survival.inv(a).sword = 0;
  w.profileOf(a)!.traits.courage = 0.3; w.profileOf(a)!.traits.strength = 0.5;
  const bear = w.animals.spawn(0, e.x[a]! + 4, e.y[a]!, 4);
  assert.equal(w.brain.fightOrFlight(a, bear, false), false, 'a bear alone, bare hands: run');
  w.profileOf(b)!.parents = [e.id(a)];
  const p = w.freeSpot(0, e.x[bear]! + 1, e.y[bear]!, 10)!; w.place(b, 0, p.x, p.y);
  assert.equal(w.brain.fightOrFlight(a, bear, false), true, 'their child next to the bear: fight');
  // The old rule is untouched with the flag off (this is only the odds function; danger() uses the old nerve rule then).
  const off = town('odds', { instinct: false });
  assert.equal(off.w.ai.instinct, false);
});

test('instinct: a shout brings friends who are near; with instincts off nobody hears it', () => {
  for (const instinct of [true, false]) {
    const { w, e, people } = town('alarm', { instinct });
    const [a, b] = people as [number, number];
    for (const i of people) { w.profileOf(i)!.traits.courage = 0.8; w.survival.inv(i).spear = 1; }
    const pb = w.freeSpot(0, e.x[a]! + 18, e.y[a]!, 20)!; w.place(b, 0, pb.x, pb.y); // 18 m away: sees nothing itself
    for (const j of people.slice(2)) { const p = w.freeSpot(0, e.x[a]! - 80, e.y[a]!, 30)!; w.place(j, 0, p.x, p.y); }
    let alarms = 0;
    w.listeners.push((x) => { if (x.kind === 'alarm') alarms++; });
    const z = w.zombies.spawn(0, e.x[a]! - 4, e.y[a]!, true), zid = e.id(z);
    let helped = false;
    for (let k = 0; k < 20 * 30 && !helped; k++) { w.step(); if (e.target[b] === zid) helped = true; }
    if (instinct) { assert.ok(alarms >= 1, 'a shout'); assert.ok(helped, 'the friend 18 m away came to fight it'); }
    else { assert.equal(alarms, 0); assert.equal(helped, false, 'without the shout, 18 m is out of sight'); }
  }
});

test('memory: 10 short-term, 100 long-term, important things kept, recall by relevance, places merged', () => {
  const { w, e, people } = town('mem');
  const i = people[0]!, id = e.id(i), mem = w.memory;
  for (let k = 0; k < 30; k++) mem.add(id, 'talk', 1, `small talk ${k}`);
  const m = w.profileOf(i)!.mind!.mem!;
  assert.equal(m.s.length, SHORT);
  assert.equal(m.l.length, 0, 'small things are forgotten');
  mem.add(id, 'child', 10, 'my child Sami was born');
  for (let k = 0; k < 250; k++) { w.gameSec += 600; mem.add(id, 'hunt', 5, `hunted a deer on hill ${k}`); }
  assert.ok(m.l.length <= LONG && m.l.length > 50, `long ${m.l.length}`);
  assert.ok(m.l.some((r) => r.x === 'my child Sami was born'), 'a child born is remembered for life');
  // The same thing again is one memory that happened more often.
  mem.add(id, 'talk', 1, 'talked with Lina'); mem.add(id, 'talk', 1, 'talked with Lina');
  assert.equal(m.s.filter((r) => r.x === 'talked with Lina')[0]!.n, 2);
  // Recall: the question picks the memory.
  assert.equal(mem.recall(id, 'tell me about your child', 1)[0]!.x, 'my child Sami was born');
  // Places: near ones merge; fear of where they were bitten.
  mem.place(id, 'danger', 0, 50, 50); mem.place(id, 'danger', 0, 53, 51);
  assert.equal(mem.places(id, 'danger').length, 1);
  assert.equal(mem.places(id, 'danger')[0]!.n, 2);
  assert.ok(mem.feared(id, 0, 55, 50));
  assert.ok(!mem.feared(id, 0, 90, 90));
  assert.match(mem.story(i, 'child'), /child Sami/);
  // From events: a bite is remembered, with the place.
  w.emit('bitten', { id: e.id(people[1]!), by: 1, hp: 30 });
  assert.ok(w.profileOf(people[1]!)!.mind!.mem!.s.some((r) => r.k === 'hurt'));
  assert.equal(w.memory.places(e.id(people[1]!), 'danger').length, 1);
});

test('asked to make something: a real plan when there is a way, an honest reason when there is none', () => {
  const { w, people } = town('planto');
  w.land.setup();
  const i = people[0]!;
  const p = w.colony.planTo(i, 'craft', 'sword');
  assert.ok(Array.isArray(p), String(p));
  const steps = p as { do: string; what?: string }[];
  assert.ok(steps.some((s) => s.do === 'gather' && s.what === 'ore'), JSON.stringify(steps));
  assert.equal(steps.at(-1)!.do, 'craft');
  // No rocks anywhere on the map: no ore, and they say so.
  const tm = w.maps[0]!.tiles, T = w.survival.T;
  for (let k = 0; k < tm.tiles.length; k++) if (tm.tiles[k] === T.rock) tm.set(k % tm.w, (k / tm.w) | 0, T.grass);
  w.gameSec += 7200; // the map index is rebuilt
  const why = w.colony.planTo(i, 'craft', 'sword');
  assert.equal(typeof why, 'string');
  assert.match(why as string, /ore.*rocks/);
});
