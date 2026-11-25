import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Kind } from '@worldsim/protocol';
import { compress, plan, type GAction } from '../sim/goap.js';
import { auditHut, flood, walkableNear } from '../sim/structures.js';
import { World } from '../sim/world.js';
import { scenario } from './helpers.js';

const acts: GAction<null>[] = [
  { key: 'chop', add: (s) => ({ wood: (s.axe ?? 0) > 0 ? 2 : 1 }), cost: 130, step: null },
  { key: 'dig', add: { stone: 1 }, cost: 200, step: null },
  { key: 'axe', use: { wood: 1, stone: 1 }, add: { axe: 1 }, cost: 15, step: null },
  { key: 'hut', use: { wood: 12, stone: 4 }, add: { '+hut': 1 }, cost: 650, step: null },
  { key: 'palisade', use: { item: 1 }, add: { '+wall': 1 }, cost: 10, step: null }, // needs an item nobody can make
  { key: 'wall', use: { wood: 2 }, add: { '+wall': 1 }, cost: 60, step: null },
];

test('goap: plans a hut from nothing, discovers that an axe first is cheaper, uses what is carried', () => {
  const p = plan({}, { '+hut': 1 }, acts)!;
  const keys = compress(p.actions).map(([a]) => a.key);
  assert.ok(keys.includes('axe') && keys.at(-1) === 'hut', keys.join(' '));
  assert.ok(p.cost < 12 * 130 + 4 * 200 + 650, `cost ${p.cost}`);
  // Already carrying enough: just build.
  assert.deepEqual(plan({ wood: 12, stone: 4 }, { '+hut': 1 }, acts)!.actions.map((a) => a.key), ['hut']);
  // The cheapest producer can be a dead end (an item no one can make): the planner takes the other way.
  assert.deepEqual(compress(plan({}, { '+wall': 2 }, acts)!.actions).map(([a, n]) => `${a.key}x${n}`).at(-1), 'wallx2');
  // Impossible goals give null, fast.
  assert.equal(plan({}, { unobtainium: 1 }, acts), null);
});

test('structures: a hut is read from its walls in any orientation; a gap in the wall is not a room', () => {
  const w = new World(scenario(), { tickRate: 20, clockScale: 30, capacity: 256, seed: 'struct' });
  const tm = w.maps[0]!.tiles, T = w.survival.T;
  // An open patch, then a 5 x 5 hut with its door facing east at (x0 + 4, y0 + 2).
  const x0 = 60, y0 = 60;
  for (let y = y0 - 3; y < y0 + 8; y++) for (let x = x0 - 3; x < x0 + 9; x++) tm.set(x, y, T.grass);
  for (let y = 0; y < 5; y++) for (let x = 0; x < 5; x++) tm.set(x0 + x, y0 + y, x === 0 || y === 0 || x === 4 || y === 4 ? T.woodwall : T.floor);
  tm.set(x0 + 4, y0 + 2, T.floor);
  const out = (y0 + 2) * tm.w + x0 + 5;
  const a = auditHut(tm, out, null, null);
  assert.ok(a.door && a.enclosed && a.room === 9, JSON.stringify(a));
  tm.set(x0, y0 + 1, T.grass); // a hole at the back
  assert.equal(auditHut(tm, out, null, null).enclosed, false);
  const c = walkableNear(tm, x0 + 7, y0 + 2, 2);
  assert.ok(flood(tm, c % tm.w, (c / tm.w) | 0, 500).has(out));
});

/** Run a 5-person world for two game days with the given AI flags; what was built and how tasks went. */
function run(seed: string, ai: Partial<World['ai']>) {
  const w = new World(scenario(), { tickRate: 20, clockScale: 30, capacity: 2048, seed, ai });
  w.populate();
  let ok = 0, bad = 0;
  w.listeners.push((x) => { if (x.kind === 'task') { if (x.data.ok) ok++; else bad++; } });
  for (let k = 0; k < (48 * 3600) / 30 * 20; k++) w.step();
  return { w, ok, bad };
}

test('colony: people plan their own work, huts are usable rooms inside the wall line with doors facing the camp', () => {
  const { w, ok, bad } = run('colony-test', {});
  const e = w.e;
  let alive = 0;
  for (let i = 0; i < e.hi; i++) if (e.kind[i] === Kind.Agent) alive++;
  assert.equal(alive, 5);
  assert.ok(ok >= 20 && bad <= ok / 5, `tasks ok ${ok} failed ${bad}`);
  assert.ok(w.colony.stats.plans > 10, JSON.stringify(w.colony.stats));
  const m = 0, tm = w.maps[m]!.tiles, camp = w.survival.campOf(m)!;
  assert.ok(camp, 'a camp');
  const c0 = walkableNear(tm, camp.x, camp.y, 4), reach = flood(tm, c0 % tm.w, (c0 / tm.w) | 0, 20000);
  const per = w.survival.perimeter(m)!;
  const huts = w.survival.huts[m]!;
  assert.ok(huts.length >= 2, `huts ${huts.length}`);
  for (const [k, out] of huts.entries()) {
    const a = auditHut(tm, out, reach, per, w.survival.hutDir[m]![k]);
    assert.ok(a.functional, `hut ${k}: ${JSON.stringify(a)}`);
  }
  // People learned something about their work (per person and for the camp).
  const someone = [...w.profiles.values()].find((p) => Object.keys((p.mind as { know?: object } | undefined)?.know ?? {}).length);
  assert.ok(someone, 'someone learned');
});

test('colony: an action that keeps failing gets avoided (learning), and the old behaviour is still there with the flags off', () => {
  const w = new World(scenario(), { tickRate: 20, clockScale: 30, capacity: 2048, seed: 'learn-test' });
  w.populate();
  let i = 0;
  while (w.e.kind[i] !== Kind.Agent) i++;
  const before = w.colony.chance(i, 'hunt:small');
  for (let n = 0; n < 6; n++) w.colony.record(i, 'hunt:small', false, 0, 0);
  const after = w.colony.chance(i, 'hunt:small');
  assert.ok(after < before / 3, `${before} -> ${after}`);
  w.colony.record(i, 'gather:wood', true, 300, 2);
  assert.ok(w.colony.describe(i).includes('gather:wood 1/1 ~150s'), w.colony.describe(i));
  // Flags off: the fixed hourly work list runs, no plans are made.
  const old = run('learn-test', { goap: false, learn: false, siting: false });
  assert.equal(old.w.colony.stats.plans, 0);
  assert.ok(old.ok + old.bad > 0);
});
