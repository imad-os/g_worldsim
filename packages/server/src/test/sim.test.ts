import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Kind, EFlag } from '@worldsim/protocol';
import { Rng } from '../sim/rng.js';
import { Entities, NO_MAP } from '../sim/entities.js';
import { SpatialGrid } from '../sim/spatial.js';
import { serialize, restore } from '../persist/snapshot.js';

import { newWorld } from './helpers.js';

test('rng: same seed same numbers, state round trip', () => {
  const a = new Rng('x'), b = new Rng('x');
  for (let i = 0; i < 100; i++) assert.equal(a.u32(), b.u32());
  const st = a.getState(), n1 = a.next();
  b.setState(st);
  assert.equal(b.next(), n1);
  assert.notEqual(new Rng('y').u32(), new Rng('x').u32());
});

test('entities: ids are unique over time, slots reused', () => {
  const e = new Entities(4);
  const i = e.create(Kind.Agent, 0, 1, 1, 0.3), id = e.id(i);
  e.destroy(i);
  assert.equal(e.slot(id), -1);
  const j = e.create(Kind.Agent, 0, 2, 2, 0.3);
  assert.equal(j, i);
  assert.notEqual(e.id(j), id);
  assert.equal(e.slot(e.id(j)), j);
  for (let k = 0; k < 3; k++) assert.ok(e.create(Kind.Item, 0, 0, 0, 0.1) >= 0);
  assert.equal(e.create(Kind.Item, 0, 0, 0, 0.1), -1, 'capacity is a hard cap');
});

test('spatial grid: same answers as brute force', () => {
  const e = new Entities(2000), rng = new Rng(3), g = new SpatialGrid(200, 150, 2000, 4);
  for (let k = 0; k < 1500; k++) e.create(Kind.Agent, k % 3 === 0 ? 1 : 0, rng.range(0, 200), rng.range(0, 150), 0.3);
  g.rebuild(e, 0);
  const out = new Int32Array(2000);
  for (let t = 0; t < 50; t++) {
    const x = rng.range(0, 200), y = rng.range(0, 150), r = rng.range(1, 30);
    const n = g.queryCircle(e, x, y, r, out);
    const got = Array.from(out.subarray(0, n)).sort((a, b) => a - b);
    const want: number[] = [];
    for (let i = 0; i < e.hi; i++) if (e.map[i] === 0 && Math.hypot(e.x[i]! - x, e.y[i]! - y) <= r) want.push(i);
    assert.deepEqual(got, want);
  }
});

test('maps: generated, merged colliders, portals walkable', () => {
  const w = newWorld();
  for (const m of w.maps) {
    let solid = 0;
    for (const t of m.tiles.tiles) if (m.tiles.solid[t]) solid++;
    const fx = m.phys.staticFixtures();
    assert.ok(solid > 500, `${m.def.id} has obstacles`);
    assert.ok(fx < solid * 0.8, `${m.def.id}: ${fx} fixtures for ${solid} solid tiles (merged)`);
  }
  for (const p of w.portals) {
    assert.ok(!w.maps[p.from]!.tiles.isSolidAt(p.x, p.y), `portal ${p.id} start is walkable`);
    assert.ok(!w.maps[p.dest]!.tiles.isSolidAt(p.toX, p.toY), `portal ${p.id} end is walkable`);
  }
});

test('physics: after 10 simulated minutes no agent is inside a wall or outside its map', () => {
  const w = newWorld();
  w.populate();
  assert.equal(w.e.countKind(Kind.Agent), 20);
  for (let k = 0; k < 20 * 600; k++) w.step();
  let moved = 0;
  for (let i = 0; i < w.e.hi; i++) {
    if (w.e.kind[i] !== Kind.Agent || w.e.map[i] === NO_MAP) continue;
    const t = w.maps[w.e.map[i]!]!.tiles, x = w.e.x[i]!, y = w.e.y[i]!;
    assert.ok(x > 0 && y > 0 && x < t.w && y < t.h, 'inside the map');
    // The centre may never be in a solid tile (the 0.3 m body can touch one).
    // Box tiles: the centre may never be in one. Round tiles (trees, r 0.4): only their corners are free.
    const tt = t.get(Math.floor(x), Math.floor(y));
    if (tt === 6) {
      const d = Math.hypot(x - (Math.floor(x) + 0.5), y - (Math.floor(y) + 0.5));
      assert.ok(d > 0.4 + 0.3 - 0.02, `agent ${i} overlaps a tree (${d.toFixed(3)} m)`);
    } else {
      assert.ok(!t.isSolidAt(x, y), `agent ${i} at ${x.toFixed(2)},${y.toFixed(2)} is inside solid tile ${tt}`);
    }
    if (w.e.flags[i]! & EFlag.Moving) moved++;
  }
  assert.ok(moved > 0, 'agents move');
});

test('determinism: same seed, same world after 3000 ticks; other seed differs', () => {
  const a = newWorld(), b = newWorld(), c = newWorld('other');
  for (const w of [a, b, c]) w.populate();
  for (let k = 0; k < 3000; k++) { a.step(); b.step(); c.step(); }
  assert.equal(a.hash(), b.hash());
  assert.notEqual(a.hash(), c.hash());
});

test('snapshot: restore gives the exact same state, and it keeps running', () => {
  const a = newWorld();
  a.populate();
  for (let k = 0; k < 1500; k++) a.step();
  a.maps[0]!.tiles.damage(10, 10, 255);
  const bytes = serialize(a);
  const b = newWorld();
  restore(b, bytes);
  assert.equal(b.hash(), a.hash());
  assert.equal(b.tick, a.tick);
  assert.equal(b.gameSec, a.gameSec);
  assert.deepEqual(b.rng.getState(), a.rng.getState());
  for (let k = 0; k < 600; k++) { a.step(); b.step(); }
  // Box2D's contact cache is not saved, so the paths may drift slightly; the clock and the population must not.
  assert.equal(b.tick, a.tick);
  assert.equal(b.e.countKind(Kind.Agent), a.e.countKind(Kind.Agent));
});

test('projectiles: shots break a wall, its collider is rebuilt', () => {
  const w = newWorld();
  const m = w.maps[0]!, t = m.tiles;
  // Find a wall tile with open ground to its west.
  let wx = -1, wy = -1;
  for (let y = 5; y < t.h - 5 && wx < 0; y++) for (let x = 8; x < t.w - 5; x++) {
    if (t.get(x, y) === 5 && !t.solid[t.get(x - 1, y)!] && !t.solid[t.get(x - 2, y)!] && !t.solid[t.get(x - 3, y)!]) { wx = x; wy = y; break; }
  }
  assert.ok(wx > 0, 'found a wall');
  const fx0 = m.phys.staticFixtures();
  const events: string[] = [];
  w.listeners.push((ev) => events.push(ev.kind));
  for (let s = 0; s < 4 && t.get(wx, wy) === 5; s++) {
    w.shoot(0, wx - 2.5, wy + 0.5, 1, 0);
    for (let k = 0; k < 10; k++) w.step();
  }
  assert.equal(t.get(wx, wy), 8, 'wall became rubble');
  assert.ok(events.includes('destroyed'));
  assert.equal(w.e.countKind(Kind.Projectile), 0, 'projectiles freed');
  assert.notEqual(m.phys.staticFixtures(), fx0, 'colliders rebuilt');
  assert.ok(t.chunkVer[Math.floor(wy / 32) * t.cw + Math.floor(wx / 32)]! > 1, 'chunk version bumped');
});

test('projectiles: a shot hurts an agent, not its shooter', () => {
  const w = newWorld();
  const s = w.freeSpot(0, 60, 60, 200)!;
  const shooter = w.spawnAgent(0, s.x, s.y);
  // Target 1.5 m east if free, else skip.
  if (w.maps[0]!.tiles.isSolidAt(s.x + 1.5, s.y) || w.maps[0]!.tiles.isSolidAt(s.x + 0.75, s.y)) return;
  const target = w.spawnAgent(0, s.x + 1.5, s.y);
  const hp0 = w.e.hp[target]!;
  w.shoot(0, s.x, s.y, 1, 0, shooter);
  for (let k = 0; k < 5; k++) w.step();
  assert.ok(w.e.hp[target]! < hp0, 'target hurt');
  assert.equal(w.e.hp[shooter], 100, 'shooter unhurt');
});

test('maps: agents travel between maps through portals', () => {
  const w = newWorld();
  assert.deepEqual(w.routeMaps(0, 1)!.map((p) => w.portals[p]!.id), ['town-east']);
  assert.deepEqual(w.routeMaps(1, 0)!.map((p) => w.portals[p]!.id), ['woods-west']);
  const p = w.portals[0]!;
  const s = w.freeSpot(0, p.x - 4, p.y, 50)!;
  const i = w.spawnAgent(0, s.x, s.y);
  w.e.goal[i] = 0; w.e.tx[i] = p.x; w.e.ty[i] = p.y; w.e.speed[i] = 1.4; w.e.nextThink[i] = 1e9;
  const kinds: string[] = [];
  w.listeners.push((ev) => kinds.push(ev.kind));
  for (let k = 0; k < 20 * 20 && w.e.map[i] !== NO_MAP; k++) w.step();
  assert.equal(w.e.map[i], NO_MAP, 'left the town');
  assert.ok(kinds.includes('travel'));
  // Travel takes 600 game s = 60 simulated s at clockScale 10.
  for (let k = 0; k < 20 * 61; k++) w.step();
  assert.equal(w.e.map[i], 1, 'arrived in the woods');
  assert.ok(Math.hypot(w.e.x[i]! - p.toX, w.e.y[i]! - p.toY) < 6);
});
