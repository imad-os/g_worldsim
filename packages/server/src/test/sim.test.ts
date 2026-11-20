import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Kind, EFlag } from '@worldsim/protocol';
import { Rng } from '../sim/rng.js';
import { Entities, NO_MAP } from '../sim/entities.js';
import { SpatialGrid } from '../sim/spatial.js';
import { serialize, restore } from '../persist/snapshot.js';

import { newWorld, scenario } from './helpers.js';
import { World } from '../sim/world.js';

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
  assert.equal(w.e.countKind(Kind.Agent), 5);
  for (let k = 0; k < 15; k++) { const s = w.freeSpot(1, 20 + k * 10, 96, 60); if (s) w.spawnAgent(1, s.x, s.y); }
  w.travelOpen = true;
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
  w.travelOpen = true;
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

test('players: controls move the character, walls stop it, portals take it to the other map once', () => {
  const w = newWorld();
  const p = w.portals[0]!;
  const i = w.spawnPlayer(0, p.x - 6, p.y);
  assert.ok(i >= 0);
  assert.equal(w.e.kind[i], Kind.Player);
  const x0 = w.e.x[i]!;
  w.setInput(i, 0, 0, false);
  for (let k = 0; k < 20; k++) w.step();
  assert.ok(Math.abs(w.e.x[i]! - x0) < 0.05, 'no input, no move (the AI never moves a player)');
  w.setInput(i, 5, 0, true); // clamped to length 1
  for (let k = 0; k < 20 * 4 && w.e.map[i] !== NO_MAP; k++) w.step();
  assert.equal(w.e.map[i], NO_MAP, 'walked into the portal');
  for (let k = 0; k < 20 * 61; k++) w.step();
  assert.equal(w.e.map[i], 1, 'arrived in the woods');
  // Standing at the arrival point (inside the woods portal's reach) must not send it straight back.
  w.setInput(i, 0, 0, false);
  for (let k = 0; k < 40; k++) w.step();
  assert.equal(w.e.map[i], 1, 'no ping-pong');
  // Speed: walking 1.4 m/s, running 3.5 m/s.
  const s = w.freeSpot(1, 100, 100, 300)!;
  const j = w.spawnPlayer(1, s.x, s.y);
  w.setInput(j, 0, 1, true);
  for (let k = 0; k < 20; k++) w.step();
  const v = Math.hypot(w.e.vx[j]!, w.e.vy[j]!);
  assert.ok(v > 2.5 && v <= 3.6 || w.maps[1]!.tiles.isSolidAt(w.e.x[j]!, w.e.y[j]! + 0.5), `running speed ${v}`);
});

test('population: 5 people start in Old Town; travel stays closed until the owner opens it', () => {
  const w = newWorld();
  w.populate();
  assert.equal(w.e.countKind(Kind.Agent), 5);
  for (let i = 0; i < w.e.hi; i++) if (w.e.kind[i] === Kind.Agent) assert.equal(w.e.map[i], w.mapIndex.get('town'));
  // An agent sent to the portal while travel is closed does not leave.
  const p = w.portals[0]!;
  const s = w.freeSpot(0, p.x - 3, p.y, 50)!;
  const i = w.spawnAgent(0, s.x, s.y);
  w.e.goal[i] = 0; w.e.tx[i] = p.x; w.e.ty[i] = p.y; w.e.speed[i] = 1.4;
  for (let k = 0; k < 20 * 120; k++) w.step();
  for (let j = 0; j < w.e.hi; j++) if (w.e.kind[j] === Kind.Agent) assert.equal(w.e.map[j], 0, 'nobody left the town');
  // Fitting an old world of 7 (2 in the woods) to 5: extras go first, then the rest moves to the town.
  const a = w.spawnAgent(1, 30, 96), b = w.spawnAgent(1, 40, 96);
  assert.ok(a >= 0 && b >= 0);
  const r = w.fitPopulation(5);
  assert.equal(w.e.countKind(Kind.Agent), 5);
  assert.equal(r.removed, 3);
  for (let j = 0; j < w.e.hi; j++) if (w.e.kind[j] === Kind.Agent) assert.equal(w.e.map[j], 0);
  const w2 = newWorld();
  for (let k = 0; k < 3; k++) w2.spawnAgent(1, 30 + k * 5, 96);
  assert.equal(w2.fitPopulation(5).moved, 3, 'strays moved to the town while travel is closed');
  for (let j = 0; j < w2.e.hi; j++) if (w2.e.kind[j] === Kind.Agent) assert.equal(w2.e.map[j], 0);
});

test('life: in one game day 5 people drink, find food, sleep and talk; nobody dies or ends up in a wall', () => {
  const w = new World(scenario(), { tickRate: 20, clockScale: 30, capacity: 2048, seed: 'life-test' });
  w.populate();
  const ev: Record<string, number> = {};
  w.listeners.push((x) => { ev[x.kind] = (ev[x.kind] ?? 0) + 1; });
  const ticks = (24 * 3600) / 30 * 20;
  for (let k = 0; k < ticks; k++) w.step();
  assert.equal(ev.death ?? 0, 0, `deaths ${JSON.stringify(ev)}`);
  assert.ok((ev.drink ?? 0) >= 4, `drinks ${ev.drink}`);
  assert.ok((ev.pickup ?? 0) >= 3, `food found ${ev.pickup}`);
  assert.ok((ev.sleep ?? 0) >= 3 && (ev.wake ?? 0) >= 1, `sleep ${ev.sleep} wake ${ev.wake}`);
  assert.ok((ev.talk ?? 0) >= 1, `talks ${ev.talk}`);
  const e = w.e;
  for (let i = 0; i < e.hi; i++) {
    if (e.kind[i] !== Kind.Agent) continue;
    assert.ok(e.hunger[i]! < 100 && e.thirst[i]! < 100, 'needs met');
    const t = w.maps[e.map[i]!]!.tiles;
    assert.ok(!t.isSolidAt(e.x[i]!, e.y[i]!) || t.get(Math.floor(e.x[i]!), Math.floor(e.y[i]!)) === 6, 'not inside a wall');
  }
  let items = 0;
  for (let i = 0; i < e.hi; i++) if (e.kind[i] === Kind.Item) items++;
  assert.ok(items > 10 && items <= 84, `food on the maps ${items}`);
});

test('pathfinding: around walls, through the door, straight lines kept, unreachable = closest point', () => {
  const w = newWorld();
  const pf = w.brain.paths[0]!, t = w.maps[0]!.tiles;
  // Find two open points 30+ m apart and check the path never crosses a solid tile.
  let ok = 0;
  for (let k = 0; k < 40 && ok < 5; k++) {
    const a = w.freeSpot(0, w.rng.range(10, 240), w.rng.range(10, 240), 20), b = w.freeSpot(0, w.rng.range(10, 240), w.rng.range(10, 240), 20);
    if (!a || !b || Math.hypot(a.x - b.x, a.y - b.y) < 30) continue;
    const r = pf.find(a.x, a.y, b.x, b.y);
    if (r === 'none') continue;
    assert.ok(pf.outN >= 1 && pf.outN <= 64);
    let px = a.x, py = a.y;
    for (let n = 0; n < pf.outN; n++) {
      const c = pf.out[n]!, x = (c % t.w) + 0.5, y = Math.floor(c / t.w) + 0.5;
      assert.ok(pf.clear(px, py, x, y) || n === 0, 'each leg is a clear straight line');
      px = x; py = y;
    }
    ok++;
  }
  assert.ok(ok >= 3, `paths checked ${ok}`);
  // Into the middle of the pond (water is solid): a partial path to the shore.
  let water = -1;
  for (let k = 0; k < t.tiles.length && water < 0; k++) if (t.tiles[k] === 7 && t.tiles[k + 1] === 7 && t.tiles[k + 2] === 7 && t.tiles[k + t.w] === 7 && t.tiles[k - t.w] === 7) water = k + 1;
  if (water >= 0) {
    const s = w.freeSpot(0, (water % t.w) + 20, Math.floor(water / t.w), 60)!;
    assert.notEqual(pf.find(s.x, s.y, (water % t.w) + 0.5, Math.floor(water / t.w) + 0.5), 'full');
  }
});

test('life: talks make partners, a couple has a baby with traits from both, children are flagged, the old die', async () => {
  const { ageOf } = await import('../sim/people.js');
  const w = newWorld('life-cycle');
  w.populate();
  const e = w.e, from = w.yearSec;
  w.brain.life.yearDays = 1 / 24; // a year every game hour: fast enough to test
  w.life.rescale(from);
  const slots: number[] = [];
  for (let i = 0; i < e.hi; i++) if (e.kind[i] === Kind.Agent) slots.push(i);
  const f = slots.find((i) => w.profileOf(i)!.sex === 'f'), m = slots.find((i) => w.profileOf(i)!.sex === 'm');
  assert.ok(f !== undefined && m !== undefined, 'one woman and one man');
  const pf = w.profileOf(f!)!, pm = w.profileOf(m!)!;
  for (const p of [pf, pm]) { p.born = w.gameSec - 25 * w.yearSec; p.partner = -1; p.traits.lifespan = 70; }
  const events: string[] = [];
  w.listeners.push((ev) => events.push(ev.kind));
  for (let k = 0; k < 40 && pf.partner < 0; k++) w.emit('talk', { a: e.id(f!), b: e.id(m!), map: 'town' });
  assert.equal(pf.partner, e.id(m!));
  assert.equal(pm.partner, e.id(f!));
  assert.ok(events.includes('partner'));
  // Together, fed and watered: within a few years a baby.
  w.place(m!, e.map[f!]!, e.x[f!]! + 1, e.y[f!]!);
  let child = -1;
  for (let h = 0; h < 12 && child < 0; h++) {
    for (const i of [f!, m!]) { e.hunger[i] = 0; e.thirst[i] = 0; }
    w.gameSec += 3600;
    w.life.hourly();
    for (const [id, p] of w.profiles) if (p.parents.includes(e.id(f!)) && e.slot(id) >= 0) child = e.slot(id);
  }
  assert.ok(child >= 0, `a baby within 12 years: ${events.join(',')}`);
  const pc = w.profileOf(child)!;
  assert.deepEqual(pc.parents, [e.id(f!), e.id(m!)]);
  assert.equal(pc.generation, 1);
  assert.ok(ageOf(pc, w.gameSec, w.yearSec) < 1);
  assert.ok(e.flags[child]! & EFlag.Child, 'drawn as a child');
  for (const k of ['strength', 'empathy'] as const) {
    const lo = Math.min(pf.traits[k], pm.traits[k]) - 0.09, hi = Math.max(pf.traits[k], pm.traits[k]) + 0.09;
    assert.ok(pc.traits[k] >= lo && pc.traits[k] <= hi, `${k} from the parents`);
  }
  // Old age.
  pm.born = w.gameSec - 85 * w.yearSec;
  w.gameSec += 3600; w.life.hourly();
  assert.equal(e.slot(pm === w.profileOf(m!) ? e.id(m!) : -1), -1, 'died of old age');
  assert.equal(pm.cause, 'old age');
  assert.equal(pf.partner, -1, 'the widow may find someone again');
  // Ages keep their years when the life speed changes.
  const before = ageOf(pf, w.gameSec, w.yearSec), y0 = w.yearSec;
  w.brain.life.yearDays = 2; w.life.rescale(y0);
  assert.ok(Math.abs(ageOf(pf, w.gameSec, w.yearSec) - before) < 1e-6);
});

test('survival: a command "build a hut" gathers wood and stone, builds a real hut (walls, floor, door); a campfire burns, is fed, goes out', () => {
  const w = new World(scenario(), { tickRate: 20, clockScale: 30, capacity: 2048, seed: 'surv-test' });
  w.populate();
  const e = w.e, s = w.survival, T = s.T;
  let a = -1;
  for (let i = 0; i < e.hi; i++) if (e.kind[i] === Kind.Agent) { a = i; break; }
  const calm = () => { for (let i = 0; i < e.hi; i++) if (e.kind[i] === Kind.Agent) { e.hunger[i] = 0; e.thirst[i] = 0; e.tired[i] = 0; } };
  const ev: Record<string, number> = {};
  const builds: { what: string; tx: number; ty: number }[] = [];
  w.listeners.push((x) => { ev[x.kind] = (ev[x.kind] ?? 0) + 1; if (x.kind === 'build') builds.push(x.data as never); });
  assert.ok(w.tasks.start(a, 'build a hut', 'imad', [{ do: 'build', what: 'hut' }]));
  const t = w.profileOf(a)!.mind!.task!;
  for (let k = 0; k < 20 * 3600 && w.profileOf(a)!.mind?.task; k++) { calm(); w.step(); if (k === 200) assert.ok(t.steps.length >= 2, 'materials to gather were added before building'); }
  assert.equal(w.profileOf(a)!.mind?.task, undefined, 'task finished');
  const hut = builds.find((b) => b.what === 'hut');
  assert.ok(hut, `hut built ${JSON.stringify(ev)}`);
  assert.ok((ev.gather ?? 0) >= 6, `gathered ${ev.gather}`);
  const tm = w.maps[e.map[a]!]!.tiles;
  // The hut: 5 x 5, a ring of wooden walls with a door in the middle of the front, floor inside.
  const x0 = hut.tx - 2, y0 = hut.ty - 2;
  let walls = 0, floor = 0;
  for (let y = y0; y < y0 + 5; y++) for (let x = x0; x < x0 + 5; x++) { const id = tm.get(x, y); if (id === T.woodwall) walls++; if (id === T.floor) floor++; }
  assert.ok(walls >= 14 && floor >= 9, `walls ${walls} floor ${floor}`);
  assert.equal(tm.get(x0 + 2, y0 + 4), T.floor, 'the door is open');
  assert.ok(s.campOf(e.map[a]!), 'the hut made a camp');
  // A campfire, from nothing: wood and stone first.
  w.profileOf(a)!.inv = {};
  assert.ok(w.tasks.start(a, 'make a fire', 'imad', [{ do: 'build', what: 'campfire' }]));
  for (let k = 0; k < 20 * 3600 && w.profileOf(a)!.mind?.task; k++) { calm(); w.step(); }
  const fire = builds.find((b) => b.what === 'campfire');
  assert.ok(fire, 'campfire built');
  assert.equal(tm.get(fire.tx, fire.ty), T.campfire);
  const key = `${e.map[a]}:${fire.ty * tm.w + fire.tx}`;
  const until = s.fires.get(key)!;
  assert.ok(until > w.gameSec + 8 * 3600, 'fuel for the night');
  // Feed it: one wood = 4 more hours.
  w.profileOf(a)!.inv!.wood = 2;
  assert.ok(w.tasks.start(a, 'keep the fire going', 'imad', [{ do: 'tend' }]));
  for (let k = 0; k < 20 * 1200 && w.profileOf(a)!.mind?.task; k++) { calm(); w.step(); }
  assert.ok(s.fires.get(key)! >= until + 3.9 * 3600, 'fed');
  assert.equal(w.profileOf(a)!.inv!.wood, 1);
  // Sleeping next to it is warmer.
  assert.ok(s.warm(e.map[a]!, fire.tx + 0.5, fire.ty + 2));
  // Left alone it burns out and leaves ashes.
  s.fires.set(key, w.gameSec + 1);
  for (let k = 0; k < 40; k++) w.step();
  assert.equal(tm.get(fire.tx, fire.ty), T.ashes);
  // Tools: an axe from 1 wood + 1 stone (crafting 2026-11-20), and chopping with it gives 2 wood.
  w.profileOf(a)!.inv = { wood: 2, stone: 1 };
  assert.equal(s.craft(a, 'axe'), true);
  assert.deepEqual(w.profileOf(a)!.inv, { wood: 1, axe: 1 });
  assert.match(String(s.craft(a, 'spear')), /need 1 (claw|scrap)/);
  // Nobody ended up inside a new wall.
  for (let i = 0; i < e.hi; i++) if (e.kind[i] === Kind.Agent) assert.notEqual(w.maps[e.map[i]!]!.tiles.get(Math.floor(e.x[i]!), Math.floor(e.y[i]!)), T.woodwall);
});

test('survival: left alone for two game days, people make a camp, light a fire in the evening, build huts and tools; nobody dies', () => {
  const w = new World(scenario(), { tickRate: 20, clockScale: 30, capacity: 2048, seed: 'surv-own' });
  w.populate();
  const ev: Record<string, number> = {}, built: string[] = [];
  w.listeners.push((x) => { ev[x.kind] = (ev[x.kind] ?? 0) + 1; if (x.kind === 'build') built.push(String(x.data.what)); });
  for (let k = 0; k < (48 * 3600) / 30 * 20; k++) w.step();
  assert.equal(ev.death ?? 0, 0, `deaths ${JSON.stringify(ev)}`);
  assert.equal(ev.camp, 1, 'one camp');
  assert.ok(built.includes('campfire'), `fires ${built}`);
  assert.ok(built.filter((b) => b === 'hut').length >= 1, `huts ${built}`);
  assert.ok((ev.craft ?? 0) >= 1 && (ev.gather ?? 0) >= 20, `craft ${ev.craft} gather ${ev.gather}`);
  assert.ok((ev.drink ?? 0) >= 8 && (ev.sleep ?? 0) >= 6, `still drink ${ev.drink} and sleep ${ev.sleep}`);
});

test('zombies: released at night (the owner\'s number), people fight or flee, zombies die, the night ones crumble at dawn', () => {
  const w = new World(scenario(), { tickRate: 20, clockScale: 30, capacity: 2048, seed: 'zz' });
  w.populate();
  w.zombies.perNight = 3;
  const e = w.e, ev: Record<string, number> = {}, how: Record<string, number> = {};
  let released = 0, sawFight = false;
  w.listeners.push((x) => {
    ev[x.kind] = (ev[x.kind] ?? 0) + 1;
    if (x.kind === 'zombies') released += Number(x.data.n);
    if (x.kind === 'zombie') how[String(x.data.how)] = (how[String(x.data.how)] ?? 0) + 1;
  });
  // One that stays, right next to the first person: they fight it or run.
  const z = w.zombies.spawn(e.map[0]!, e.x[0]! + 6, e.y[0]!, true);
  assert.ok(z >= 0);
  for (let k = 0; k < (30 * 3600) / 30 * 20; k++) {
    w.step();
    if (!sawFight) for (let i = 0; i < e.hi; i++) if (e.kind[i] === Kind.Agent && (e.act[i] === 13 || e.act[i] === 9)) { sawFight = true; break; }
  }
  assert.equal(released, 3, `3 released at night: ${JSON.stringify(ev)}`);
  assert.ok(sawFight, 'someone fought or fled');
  assert.ok((how.killed ?? 0) + (how.dawn ?? 0) >= 3, `killed or crumbled: ${JSON.stringify(how)}`);
  let night = 0;
  for (let i = 0; i < e.hi; i++) if (e.kind[i] === Kind.Threat && e.sub[i] !== 1) night++;
  assert.equal(night, 0, 'no night zombie left after dawn');
});

test('rules: "never talk to X" holds (no talks, no courting, tasks refuse), in 4 languages; fights and travel can be forbidden', async () => {
  const { compileRule } = await import('../sim/rules.js');
  const w = new World(scenario(), { tickRate: 20, clockScale: 30, capacity: 2048, seed: 'rr' });
  w.populate();
  const e = w.e, nameOf = (n: string) => { for (const [id, p] of w.profiles) if (p.name.toLowerCase() === n.toLowerCase()) return id; return -1; };
  const ids = [...w.profiles.keys()], A = w.profiles.get(ids[0]!)!, B = w.profiles.get(ids[1]!)!;
  for (const t of [`never talk to ${B.name}`, `ne parle jamais à ${B.name}`, `nunca hables con ${B.name}`, `لا تتكلم مع ${B.name}`]) {
    const r = compileRule(w, t, nameOf);
    assert.deepEqual([...r.forbid].sort(), ['child', 'court', 'talk'], t);
    assert.equal(r.with, ids[1], t);
  }
  assert.deepEqual(compileRule(w, 'never leave the town', nameOf).forbid, ['travel']);
  assert.ok(compileRule(w, `stay away from ${B.name}`, nameOf).forbid.includes('goto'));
  A.rules = [compileRule(w, `never talk to ${B.name}`, nameOf)];
  let ab = 0;
  w.listeners.push((x) => { if (x.kind === 'talk' && new Set([x.data.a, x.data.b, ids[0], ids[1]]).size === 2) ab++; });
  const ia = e.slot(ids[0]!), ib = e.slot(ids[1]!);
  // A task to talk with B fails at once with the rule's words; the other way round too (talking takes two).
  assert.ok(w.tasks.start(ia, 'talk to B', 'owner', [{ do: 'talk', who: ids[1]! }]));
  let why = '';
  w.listeners.push((x) => { if (x.kind === 'task' && x.data.id === ids[0] && !why) why = String(x.data.why); });
  for (let k = 0; k < 2 * 86400 / 30 * 20; k++) w.step();
  assert.equal(ab, 0, 'they never talked');
  assert.match(why, /never talk to/);
  assert.equal(w.rules.between(ib, ia, 'talk'), A.rules[0]!.text);
  // Nobody fights when told not to; nobody leaves when travel is forbidden.
  w.rules.all = [compileRule(w, "don't fight", nameOf)];
  assert.ok(w.rules.forbidden(ib, 'fight'));
  A.rules.push(compileRule(w, `stay away from ${B.name}`, nameOf));
  assert.equal(w.brain.order(ia, 'follow', ids[1]!, -1, 60), false, 'an order that breaks a rule is refused');
});

test('work: "collect food and store it" fills the camp store; looting the ruins finds things', () => {
  const w = new World(scenario(), { tickRate: 20, clockScale: 30, capacity: 2048, seed: 'store1' });
  w.populate();
  const e = w.e, i = 0, ev: Record<string, number> = {};
  let done: unknown = null;
  w.listeners.push((x) => { ev[x.kind] = (ev[x.kind] ?? 0) + 1; if (x.kind === 'task' && x.data.id === e.id(i)) done = x.data; });
  assert.ok(w.tasks.start(i, 'stock the store', 'owner', [{ do: 'collect', what: 'food', times: 2 }, { do: 'store', what: 'food' }, { do: 'loot', times: 1 }]));
  for (let k = 0; k < (8 * 3600) / 30 * 20 && !done; k++) w.step();
  assert.ok(done && (done as { ok: boolean }).ok, `task ended ok: ${JSON.stringify(done)} ${JSON.stringify(ev)}`);
  assert.ok((ev.store ?? 0) >= 1 && (ev.loot ?? 0) >= 1, JSON.stringify(ev));
});

test('replays: a zombie attack is recorded (everyone near it, bites, kills), compact; quiet zombies make none', () => {
  const w = new World(scenario(), { tickRate: 20, clockScale: 30, capacity: 2048, seed: 'zz' });
  w.populate();
  const e = w.e, reps: import('../sim/replays.js').Replay[] = [];
  w.replays.onDone = (r) => reps.push(r);
  w.zombies.spawn(e.map[0]!, e.x[0]! + 8, e.y[0]!, true);
  for (let k = 0; k < (2 * 3600) / 30 * 20; k++) w.step();
  assert.ok(reps.length >= 1, 'one recorded');
  const r = reps[0]!;
  assert.ok(r.secs >= 3 && r.secs <= 180, `${r.secs} s`);
  assert.ok(r.people.length >= 1 && r.zombies >= 1, JSON.stringify(r.who));
  assert.ok(r.bites + r.killed >= 1 && r.events.some((x) => x[1] === 'bite' || x[1] === 'killed'), JSON.stringify(r.events.slice(0, 5)));
  // Frames decode: count, then rows of 7 int16; positions near where it happened.
  const a = new Int16Array(new Uint8Array(Buffer.from(r.frames, 'base64')).buffer);
  let k = 0, frames = 0;
  while (k < a.length) { assert.ok(a[k]! >= 1 && a[k]! < 60); k += 1 + a[k]! * 7; frames++; }
  assert.equal(k, a.length);
  assert.equal(Math.round(frames / r.hz), r.secs);
  assert.ok(JSON.stringify(r).length < 120_000, 'small');
});

test('rules that say what to DO are followed: "you must get married" -> find, talk, court; "reproduce" -> a child; "when you see X say Y" fires only near X', async () => {
  const { compileRule } = await import('../sim/rules.js');
  const w = new World(scenario(), { tickRate: 20, clockScale: 30, capacity: 2048, seed: 'must1' });
  w.populate();
  const e = w.e, nameOf = (n: string) => { for (const [id, p] of w.profiles) if (p.name.toLowerCase() === n.toLowerCase()) return id; return -1; };
  const ids = [...w.profiles.keys()];
  // imad's own rules (2026-11-20), word for word.
  const kinds = ['you must get married', 'reproduce', 'go find a husband', 'get married and have kids now'].map((t) => { const r = compileRule(w, t, nameOf); return [r.kind, r.goal]; });
  assert.deepEqual(kinds, [['goal', 'marry'], ['goal', 'child'], ['goal', 'marry'], ['goal', 'child']]);
  const B = w.profiles.get(ids[1]!)!;
  const g = compileRule(w, `when you see '${B.name}', great him with 'Hello my king'`, nameOf);
  assert.equal(g.kind, 'when'); assert.equal(g.say, 'Hello my king'); assert.equal(g.with, ids[1]);
  assert.equal(compileRule(w, `never talk to ${B.name}`, nameOf).kind, 'never');
  // Everyone must marry: within a few game days, couples form through courting (not by chance alone).
  let n = 0;
  for (const p of w.profiles.values()) { p.partner = -1; p.sex = n++ % 2 ? 'f' : 'm'; p.born = Math.min(p.born, w.gameSec - 20 * w.life.yearSec); }
  w.rules.all = [compileRule(w, 'you must get married', nameOf)];
  const ev: Record<string, number> = {};
  w.listeners.push((x) => { ev[x.kind] = (ev[x.kind] ?? 0) + 1; });
  for (let k = 0; k < 3 * 86400 / 30 * 20 && !(ev.partner ?? 0); k++) w.step();
  assert.ok((ev.rule ?? 0) >= 1, `the rule started tasks ${JSON.stringify(ev)}`);
  assert.ok((ev.partner ?? 0) >= 1, `a couple formed ${JSON.stringify(ev)}`);
  // The greeting: said next to B only.
  const said: string[] = [];
  w.rules.onSay = (i, t) => said.push(`${e.id(i)}:${t}`);
  const A = ids[0]!, ia = e.slot(A), ib = e.slot(ids[1]!);
  w.rules.all = [g];
  e.x[ib] = e.x[ia]! + 60; e.y[ib] = e.y[ia]!;
  w.rules.update();
  assert.ok(!said.some((x) => x.startsWith(`${A}:`)), 'far away: nothing');
  e.x[ib] = e.x[ia]! + 3; e.y[ib] = e.y[ia]!;
  w.rules.update(); w.rules.update();
  assert.equal(said.filter((x) => x === `${A}:Hello my king`).length, 1, 'once per meeting');
  assert.doesNotMatch(w.rules.text(ia), /Hello my king/, 'the trigger is the engine\'s, not in the prompt');
});

test('families: a child under 14 stays near a parent; at 14 they are on their own', async () => {
  const { inherit } = await import('../sim/people.js');
  const { EFlag } = await import('@worldsim/protocol');
  const w = new World(scenario(), { tickRate: 20, clockScale: 30, capacity: 2048, seed: 'fam1' });
  w.populate();
  const e = w.e, ids = [...w.profiles.keys()];
  const mum = w.profiles.get(ids[0]!)!, dad = w.profiles.get(ids[1]!)!;
  mum.sex = 'f'; dad.sex = 'm';
  const im = e.slot(ids[0]!);
  const kid = inherit(w.rng, mum, dad, [ids[0]!, ids[1]!], w.gameSec - 6 * w.life.yearSec, w.livingNames());
  const c = w.spawnAgent(e.map[im]!, e.x[im]! + 1, e.y[im]!, kid);
  e.flags[c] = e.flags[c]! | EFlag.Child;
  let far = 0, n = 0;
  for (let k = 0; k < 86400 / 30 * 20; k++) {
    w.step();
    if (k % 100 === 0 && e.hunger[c]! < 70 && e.thirst[c]! < 70) { n++; if (Math.hypot(e.x[c]! - e.x[im]!, e.y[c]! - e.y[im]!) > 25) far++; }
  }
  assert.ok(n > 50 && far / n < 0.12, `the child stayed near mum (${far}/${n} samples far)`);
  assert.equal(w.brain.guardian(c), im);
  kid.born = w.gameSec - 14.2 * w.life.yearSec;
  assert.equal(w.brain.guardian(c), -1, 'at 14: free');
});
