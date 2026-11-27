// A player's work drops what it gives on the ground; they pick it up by hand (imad 2026-11-27).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Kind, dropKindOf } from '@worldsim/protocol';
import { scenario } from './helpers.js';
import { World } from '../sim/world.js';
import { serialize, restore } from '../persist/snapshot.js';

const mk = (seed: string) => new World(scenario(), { tickRate: 20, clockScale: 30, capacity: 2048, seed });

test('drops: a player\'s chop and kill land on the ground as piles, A picks them up, piles are saved; AI people still get it in the bag', () => {
  const w = mk('drops');
  w.populate();
  w.step();
  const e = w.e, sv = w.survival, T = sv.T;
  const m = w.mapIndex.get('woods') ?? 1, tm = w.maps[m]!.tiles;
  let tree = -1;
  for (let k = 0; k < tm.tiles.length && tree < 0; k++) { const x = k % tm.w, y = (k / tm.w) | 0; if (tm.tiles[k] === T.tree && !w.land.inRing(m, x, y) && tm.inside(x, y + 1) && !tm.isSolidAt(x + 0.5, y + 1.5)) tree = k; }
  assert.ok(tree >= 0);
  const tx = tree % tm.w, ty = (tree / tm.w) | 0;
  const pl = w.spawnPlayer(m, tx + 0.5, ty + 1.5); w.playerProfile(pl, 'Chopper');
  w.place(pl, m, tx + 0.5, ty + 1.5);
  const r = sv.playerWork(pl)!;
  assert.equal(r.code, 'chopped');
  assert.equal(sv.inv(pl).wood ?? 0, 0, 'not in the bag');
  const piles = () => [...sv.drops].map(([id, d]) => ({ j: e.slot(id), ...d })).filter((p) => p.j >= 0);
  const wood = piles().find((p) => p.what === 'wood')!;
  assert.ok(wood && wood.n >= 1);
  assert.equal(e.kind[wood.j], Kind.Item); assert.equal(dropKindOf(e.sub[wood.j]!), 'wood');
  assert.ok(Math.hypot(e.x[wood.j]! - e.x[pl]!, e.y[wood.j]! - e.y[pl]!) < 1.8, 'next to me');
  // A second chop adds to the same pile.
  sv.playerWork(pl);
  assert.equal(piles().filter((p) => p.what === 'wood').length, 1);
  const n = piles().find((p) => p.what === 'wood')!.n;
  // AI people do not forage piles.
  assert.equal(w.brain.nearestItem(pl, 3), -1); assert.ok(w.brain.nearestItem(pl, 3, true) >= 0);
  // Saved with the world.
  const w2 = mk('drops'); restore(w2, serialize(w));
  assert.equal([...w2.survival.drops.values()].find((d) => d.what === 'wood')!.n, n);
  // A (use) picks it up.
  const p = w.brain.playerDo(pl, 'use') as { ok: boolean; code: string; got?: Record<string, number> };
  assert.equal(p.code, 'pickedDrop'); assert.equal(p.got?.wood, n);
  assert.equal(sv.inv(pl).wood, n); assert.equal(piles().length, 0);
  // A kill: meat, leather (and claws) where it fell.
  const a = w.animals.spawn(m, e.x[pl]! + 1, e.y[pl]!, 1);
  assert.ok(a >= 0);
  const ax = e.x[a]!, ay = e.y[a]!;
  while (!w.animals.hit(a, 50, pl)) { /* until it falls */ }
  const got = piles();
  assert.ok(got.some((g) => g.what === 'meat') && got.some((g) => g.what === 'leather'), JSON.stringify(got));
  for (const g of got) assert.ok(Math.hypot(e.x[g.j]! - ax, e.y[g.j]! - ay) < 1, 'where it fell');
  const food0 = sv.foodOf(pl);
  const q = w.brain.playerDo(pl, 'pickup') as { code: string; got?: Record<string, number> };
  assert.equal(q.code, 'pickedDrop');
  assert.ok(sv.foodOf(pl) > food0 && (sv.inv(pl).leather ?? 0) >= 2);
  // An AI person's chop still goes straight into their bag.
  const ag = w.spawnAgent(m, tx + 0.5, ty + 1.5);
  sv.add(ag, 'wood', 0);
  (sv as unknown as { take1(i: number, m: number, x: number, y: number, t: number): unknown }).take1(ag, m, tx, ty, tm.get(tx, ty));
  assert.ok((sv.inv(ag).wood ?? 0) >= 1);
});
