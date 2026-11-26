import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Act, EFlag, Kind } from '@worldsim/protocol';
import { World } from '../sim/world.js';
import { scenario } from './helpers.js';

/** The town of 5 after a morning (camp, work under way), as the server runs it. */
function town(seed: string) {
  const sc = scenario(); sc.agents.count = 5;
  const w = new World(sc, { tickRate: 20, clockScale: 10, capacity: 2048, seed });
  w.populate(); w.land.setup();
  for (let k = 0; k < 72000; k++) w.step(); // 10 game hours
  const e = w.e, people: number[] = [];
  for (let i = 0; i < e.hi; i++) if (e.kind[i] === Kind.Agent && !(e.flags[i]! & EFlag.Child)) people.push(e.id(i));
  return { w, e, people };
}

test('five zombies round one person: a plan, no running back and forth, nobody dies (imad 2026-11-26)', () => {
  let trials = 0, died = 0, dither = 0;
  const plans = new Set<string>();
  for (const seed of ['t5-a', 't5-b']) {
    const { w, e, people } = town(seed);
    w.listeners.push((ev) => { if (ev.kind === 'tactic') plans.add(String(ev.data.plan)); });
    for (const id of people) {
      for (const p of people) { const j = e.slot(p); if (j >= 0) e.hp[j] = w.sc.agents.hp; }
      const i = e.slot(id); if (i < 0) continue;
      trials++;
      const zs: number[] = [];
      for (let q = 0; q < 5; q++) { const a = 1 + q * 1.25; const f = w.zombies.spawn(e.map[i]!, e.x[i]! + Math.cos(a) * 7, e.y[i]! + Math.sin(a) * 7, true); if (f >= 0) zs.push(e.id(f)); }
      const track: [number, number, number][] = [];
      for (let k = 0; k < 20 * 60; k++) { w.step(); const s = e.slot(id); if (s < 0) break; if (k % 10 === 0) track.push([e.x[s]!, e.y[s]!, e.act[s]!]); }
      if (e.slot(id) < 0) died++;
      // Back and forth while running: 3 s with more than 4 m walked but less than 1.5 m from where they were.
      for (let t = 6; t < track.length; t += 6) {
        if (track.slice(t - 6, t + 1).some((p) => p[2] !== Act.Flee)) continue;
        let L = 0; for (let u = t - 5; u <= t; u++) L += Math.hypot(track[u]![0] - track[u - 1]![0], track[u]![1] - track[u - 1]![1]);
        if (L > 4 && Math.hypot(track[t]![0] - track[t - 6]![0], track[t]![1] - track[t - 6]![1]) < 1.5) dither++;
      }
      for (const z of zs) { const k = e.slot(z); if (k >= 0) w.remove(k, 'gone'); }
    }
  }
  assert.ok(trials >= 6, `trials ${trials}`);
  assert.equal(died, 0, `${died} of ${trials} died`);
  assert.ok(dither <= 1, `ran back and forth ${dither} times`);
  assert.ok(plans.size >= 2, `plans used: ${[...plans].join(', ')}`);
});

test('someone attacked: the people near come and fight it with them', () => {
  const { w, e, people } = town('help-a');
  const [a, b] = people.map((id) => e.slot(id)) as [number, number];
  const woods = w.mapIndex.get('woods')!;
  for (const id of people.slice(2)) { const j = e.slot(id); w.place(j, woods, 96, 96); } // the others far away
  const s0 = w.freeSpot(e.map[a]!, 128, 128, 200)!; w.place(a, e.map[a]!, s0.x, s0.y);
  const p = w.freeSpot(e.map[a]!, e.x[a]! + 8, e.y[a]!, 60)!; w.place(b, e.map[a]!, p.x, p.y);
  for (const k of [a, b]) { w.brain.stop(k); e.act[k] = Act.Idle; e.flags[k] = e.flags[k]! & ~EFlag.Sleeping; }
  e.hp[a] = e.hp[b] = w.sc.agents.hp;
  w.profileOf(b)!.traits.courage = 0.45;
  // A wolf goes for a; b (8 m away) did not see it coming for himself.
  const wolf = w.animals.spawn(e.map[a]!, e.x[a]! + 1.2, e.y[a]! + 0.5, 3);
  w.animals.angry.set(e.id(wolf), e.id(a));
  let helped = false;
  for (let k = 0; k < 20 * 20 && !helped; k++) { w.step(); if (e.act[b] === Act.Fight && e.target[b] === e.id(wolf)) helped = true; if (e.slot(e.id(wolf)) < 0) break; }
  assert.ok(helped, 'b fought the wolf that attacked a');
});

test('the woods: children never go, a child there heads home, adults only by day', () => {
  const { w, e, people } = town('wild-a');
  const town0 = w.mapIndex.get('town')!, woods = w.mapIndex.get('woods')!;
  assert.equal(w.wild(woods), true); assert.equal(w.wild(town0), false);
  w.travelOpen = true;
  const i = e.slot(people[0]!);
  w.profileOf(i)!.born = w.gameSec - 10 * w.yearSec; // ten years old
  e.flags[i] = e.flags[i]! | EFlag.Child;
  assert.equal(w.brain.mayGoWild(i), false, 'a child may not go');
  // Walked to the gate anyway (an order, a parent): turned back at the road.
  const gate = w.portals.findIndex((p) => p.from === town0 && p.dest === woods);
  const g = w.portals[gate]!;
  w.place(i, town0, g.x, g.y); e.goal[i] = gate;
  w.step();
  assert.equal(e.map[i], town0, 'still in town'); assert.equal(e.goal[i], -1);
  // An adult may by day, not late.
  const j = e.slot(people[1]!);
  e.hp[j] = 100;
  const hour = w.brain.hour();
  assert.equal(w.brain.mayGoWild(j), hour >= 6 && hour < 15);
});

test('a player bitten by a zombie: the person next to them fights it too (players do not shout)', () => {
  const { w, e, people } = town('help-p');
  const b = e.slot(people[0]!), woods = w.mapIndex.get('woods')!;
  for (const id of people.slice(1)) w.place(e.slot(id), woods, 96, 96);
  const s0 = w.freeSpot(0, 128, 128, 200)!;
  const pl = w.spawnPlayer(0, s0.x, s0.y);
  const p = w.freeSpot(0, e.x[pl]! + 11, e.y[pl]!, 60)!; w.place(b, 0, p.x, p.y);
  w.brain.stop(b); e.act[b] = Act.Idle; e.flags[b] = e.flags[b]! & ~EFlag.Sleeping; e.hp[b] = 100;
  w.profileOf(b)!.traits.courage = 0.5;
  const z = w.zombies.spawn(0, e.x[pl]! - 0.8, e.y[pl]!, true);
  let helped = false;
  for (let k = 0; k < 20 * 20 && !helped; k++) { w.step(); if (e.act[b] === Act.Fight && e.target[b] === e.id(z)) helped = true; if (e.slot(e.id(z)) < 0) break; }
  assert.ok(helped, 'fought the zombie on the player');
});
