import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Kind } from '@worldsim/protocol';
import { scenario } from './helpers.js';
import { World } from '../sim/world.js';
import { serialize, restore } from '../persist/snapshot.js';

const mk = (seed: string) => new World(scenario(), { tickRate: 20, clockScale: 30, capacity: 2048, seed });
const tid = (w: World, n: string) => w.sc.tiles.find((t) => t.name === n)!.id;
const count = (w: World, m: number, t: number) => { let n = 0; for (const x of w.maps[m]!.tiles.tiles) if (x === t) n++; return n; };

test('maps: each town gate leads to its own map (Pine Woods, Ridgeford, Black Fir Forest, Willow Farms), every map reaches every other', () => {
  const w = mk('five-maps');
  w.populate(); w.land.setup();
  assert.deepEqual(w.maps.map((m) => m.def.id), ['town', 'woods', 'ridge', 'firs', 'farms'], 'new maps are appended (saved map indexes stay right)');
  const town = w.mapIndex.get('town')!;
  const out = w.portals.filter((p) => p.from === town).map((p) => w.maps[p.dest]!.def.id).sort();
  assert.deepEqual(out, ['farms', 'firs', 'ridge', 'woods']);
  for (let a = 0; a < w.maps.length; a++) for (let b = 0; b < w.maps.length; b++) if (a !== b) assert.ok(w.routeMaps(a, b)?.length, `${w.maps[a]!.def.id} -> ${w.maps[b]!.def.id}`);
  // Every gate has a way back, and both ends stand on open ground.
  for (const p of w.portals) {
    assert.ok(w.portals.some((q) => q.from === p.dest && q.dest === p.from), `${p.id} has a way back`);
    assert.ok(!w.maps[p.from]!.tiles.isSolidAt(p.x, p.y), `${p.id} gate on open ground`);
    assert.ok(!w.maps[p.dest]!.tiles.isSolidAt(p.toX, p.toY), `${p.id} arrives on open ground`);
  }
  assert.equal(w.wild(w.mapIndex.get('firs')!), true, 'the forest is wild');
  assert.equal(w.wild(w.mapIndex.get('farms')!), false, 'the farms are not: families may go');
  assert.equal(w.wild(w.mapIndex.get('ridge')!), false);
  // Willow Farms: fields, farmsteads, a lake, a quarry; Ridgeford: a town with its own ring.
  const farms = w.mapIndex.get('farms')!, ridge = w.mapIndex.get('ridge')!;
  assert.ok(count(w, farms, tid(w, 'farm')) > 300, 'fields');
  assert.ok(count(w, farms, tid(w, 'wall')) > 80, 'farmsteads');
  assert.ok(count(w, farms, tid(w, 'water')) > 150, 'a lake');
  assert.ok(count(w, farms, tid(w, 'rock')) > 40, 'a quarry');
  assert.ok(count(w, ridge, tid(w, 'road')) > 2000 && w.land.inRing(ridge, 2, 2), 'Ridgeford is a town in a ring of trees');
});

test('maps: old fields bear berries, wild horses and game live on the farms, all maps start with herbs', () => {
  const w = mk('farm-life');
  w.populate(); w.land.setup();
  for (let k = 0; k < 20; k++) w.step();
  const farms = w.mapIndex.get('farms')!, e = w.e;
  const fields = [...w.survival.farms.keys()].filter((k) => k.startsWith(farms + ':')).length;
  assert.ok(fields >= 15, `fields that bear (${fields})`);
  const end = w.gameSec + 14 * 3600;
  while (w.gameSec < end) w.step();
  let horses = 0, game = 0, berries = 0;
  for (let i = 0; i < e.hi; i++) {
    if (e.map[i] !== farms) continue;
    if (e.kind[i] === Kind.Animal) { if (e.sub[i] === 5) horses++; else game++; }
    if (e.kind[i] === Kind.Item) berries++;
  }
  assert.ok(horses >= 3, `wild horses (${horses})`);
  assert.ok(game >= 4, `animals (${game})`);
  assert.ok(berries >= 5, `food on the ground (${berries})`);
  for (let m = 0; m < w.maps.length; m++) assert.ok(count(w, m, tid(w, 'herbs')) > 0, `${w.maps[m]!.def.id} herbs`);
});

test('maps: a world saved before the new maps gets their ring and rocks on its next start, the old maps are left alone', () => {
  const w = mk('old-world');
  w.populate(); w.land.setup(); w.step();
  const ridge = w.mapIndex.get('ridge')!, farms = w.mapIndex.get('farms')!, town = w.mapIndex.get('town')!, ROCK = tid(w, 'rock');
  // As a world from before: only town and woods had the land laid.
  const before = { tiles: [...w.maps.map((m) => m.tiles.tiles.slice())] };
  w.land.doneMaps.clear(); w.land.doneMaps.add('town'); w.land.doneMaps.add('woods');
  const bytes = serialize(w);
  const w2 = mk('old-world');
  restore(w2, bytes);
  // Pretend the new maps were never laid (fresh from the generator, as a world from before would load them).
  for (const m of [ridge, w.mapIndex.get('firs')!, farms]) w2.maps[m]!.tiles.tiles.set(w2.maps[m]!.tiles.base!);
  assert.deepEqual([...w2.land.doneMaps].sort(), ['town', 'woods']);
  w2.land.setup();
  assert.ok(w2.land.inRing(ridge, 3, 3) && w2.maps[ridge]!.tiles.get(3, 3) === tid(w, 'tree'), 'Ridgeford got its ring');
  assert.ok(count(w2, farms, ROCK) >= count(w, farms, ROCK) - 40 && count(w2, farms, ROCK) > 40, 'rocks laid');
  assert.deepEqual([...w2.maps[town]!.tiles.tiles], [...before.tiles[town]!], 'Old Town untouched');
  assert.deepEqual([...w2.land.doneMaps].sort(), ['farms', 'firs', 'ridge', 'town', 'woods']);
});
