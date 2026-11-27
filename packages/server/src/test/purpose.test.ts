import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Kind } from '@worldsim/protocol';
import { scenario } from './helpers.js';
import { World } from '../sim/world.js';
import { ageOf } from '../sim/people.js';

const mk = (seed: string) => new World(scenario(), { tickRate: 20, clockScale: 30, capacity: 2048, seed });
const agentsOn = (w: World, m: number) => [...Array(w.e.hi).keys()].filter((i) => w.e.kind[i] === Kind.Agent && w.e.map[i] === m);
const until = (w: World, ok: () => boolean, gameHours: number) => { const end = w.gameSec + gameHours * 3600; while (w.gameSec < end && !ok()) w.step(); return ok(); };

test('purpose: every adult gets a dream from who they are; only the brave dream of the woods', () => {
  const w = mk('dream-pick');
  w.populate(); w.land.setup();
  until(w, () => false, 1.5);
  let n = 0;
  for (const [, p] of w.profiles) {
    if (p.died !== undefined || p.player || ageOf(p, w.gameSec, w.yearSec) < 16) continue;
    assert.ok(p.dream, `${p.name} has a dream`);
    if (p.dream!.kind === 'explorer') assert.ok(p.traits.courage >= 0.6, `${p.name}: only the brave explore (courage ${p.traits.courage})`);
    n++;
  }
  assert.ok(n >= 3);
});

test('purpose: an explorer scouts places nobody has seen, comes home, tells the tale and is respected for it', () => {
  const w = mk('dream-scout');
  w.populate(); w.land.setup();
  const e = w.e, town = w.mapIndex.get('town')!, [a] = agentsOn(w, town) as [number];
  const A = e.id(a), p = w.profileOf(a)!;
  p.dream = { kind: 'explorer', at: 0, n: 0 };
  w.gameSec = Math.ceil(w.gameSec / 86400) * 86400 + 1 * 3600; // 09:00
  const seen0 = w.purpose.seenCount(A, town), inf0 = w.influence.of(A);
  let ev: Record<string, unknown> | null = null, said = '';
  w.listeners.push((x) => { if (x.kind === 'explore' && x.data.id === A) ev = x.data; });
  w.tasks.onSay = (i, t) => { if (i === a) said = t; };
  assert.ok(w.tasks.start(a, 'scout the far side of Old Town', 'myself', [{ do: 'explore', times: 2 }]));
  assert.ok(until(w, () => ev !== null, 6), 'the expedition ends');
  const r = ev as unknown as { wild: boolean; cells: number; found: string[] };
  assert.equal(r.wild, false);
  assert.ok(r.cells >= 2, `new places seen (${r.cells})`);
  assert.ok(w.purpose.seenCount(A, town) > seen0);
  assert.ok(w.influence.of(A) > inf0, 'a little more respected');
  assert.ok(w.memory.recall(A, 'explored').length >= 1, 'remembered');
  assert.match(said, /explored/);
  assert.equal(p.dream!.trips, 1);
});

test('purpose: with the roads open, a brave explorer goes into the woods by day and comes back before night', () => {
  const w = mk('dream-woods');
  w.populate(); w.land.setup();
  w.travelOpen = true; w.land.block(false);
  const e = w.e, town = w.mapIndex.get('town')!, woods = w.mapIndex.get('woods')!;
  const a = agentsOn(w, town).find((i) => !(e.flags[i]! & 32))!, A = e.id(a), p = w.profileOf(a)!;
  p.traits.courage = 0.9; p.dream = { kind: 'explorer', at: 0, n: 0 };
  e.hp[a] = w.sc.agents.hp;
  w.gameSec = Math.ceil(w.gameSec / 86400) * 86400; // 08:00
  w.zombies.perNight = 0;
  let ev: Record<string, unknown> | null = null, inWoods = false;
  w.listeners.push((x) => { if (x.kind === 'explore' && x.data.id === A) ev = x.data; });
  assert.ok(w.tasks.start(a, 'explore the Pine Woods', 'myself', [{ do: 'explore', what: 'woods', times: 2 }]));
  assert.ok(until(w, () => { if (e.map[a] === woods) inWoods = true; return ev !== null || !p.mind?.task; }, 12));
  assert.ok(inWoods, 'went into the woods');
  assert.ok(ev, `came back with a tale (${JSON.stringify(p.goals?.at(-1))})`);
  assert.equal((ev as unknown as { wild: boolean }).wild, true);
  assert.ok(w.purpose.seenCount(A, woods) >= 2, 'saw the woods');
  assert.equal(p.dream!.wild, 1);
  assert.ok(w.purpose.progress(A) > 0);
});

test('purpose: once the camp is stocked, free people pursue dreams and pastimes instead of standing around', () => {
  const run = (purpose: boolean) => {
    const w = new World(scenario(), { tickRate: 20, clockScale: 30, capacity: 2048, seed: 'dream-busy', ai: { goap: true, learn: true, siting: true, instinct: true, purpose } });
    w.populate(); w.land.setup();
    let tasks = 0;
    w.listeners.push((x) => { if (x.kind === 'task') tasks++; });
    until(w, () => false, 48);
    return { tasks, stats: w.purpose.stats };
  };
  const off = run(false), on = run(true);
  assert.equal(off.stats.pursuits + off.stats.pastimes, 0);
  assert.ok(on.stats.pursuits + on.stats.pastimes >= 12 && on.stats.pursuits >= 4, JSON.stringify(on.stats));
  assert.ok(on.tasks > off.tasks * 1.3, `more done (${on.tasks} vs ${off.tasks})`);
});
