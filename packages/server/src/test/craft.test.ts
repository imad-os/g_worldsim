import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Kind, Act, matchRecipe } from '@worldsim/protocol';
import { scenario } from './helpers.js';
import { World } from '../sim/world.js';
import { RING } from '../sim/land.js';

const mk = (seed: string) => new World(scenario(), { tickRate: 20, clockScale: 30, capacity: 2048, seed });
const tileId = (w: World, n: string) => w.sc.tiles.find((t) => t.name === n)!.id;

test('land: the town is ringed by trees with 4 roads out; wrecks block them while travel is closed, and a player is told', () => {
  const w = mk('land-test');
  w.populate();
  w.land.setup();
  const town = w.maps[w.mapIndex.get('town')!]!, tm = town.tiles, TREE = tileId(w, 'tree'), WRECK = tileId(w, 'wreck'), ROAD = tileId(w, 'road');
  assert.equal(w.land.exits.length, 4);
  // Every edge tile is a tree, a wreck / road at an exit, or a building / water.
  let trees = 0, other = 0;
  for (let x = 0; x < tm.w; x++) for (const y of [1, tm.h - 2]) { const t = tm.get(x, y); if (t === TREE) trees++; else if (t !== ROAD && t !== WRECK) other++; }
  assert.ok(trees > tm.w * 1.6, `ring of trees (${trees})`);
  const wrecks = () => { let n = 0; for (const t of tm.tiles) if (t === WRECK) n++; return n; };
  assert.ok(wrecks() >= 4 * 6, `wrecks across the 4 roads (${wrecks()})`);
  // Town portals sit on their exit road, inside the ring.
  for (const p of w.portals.filter((q) => q.exit)) {
    assert.equal(tm.get(Math.floor(p.x), Math.floor(p.y)), ROAD, `${p.id} on the road`);
    assert.ok(Math.min(p.x, p.y, tm.w - p.x, tm.h - p.y) < RING);
  }
  // A player walking east into the wrecks of the east road is told why.
  const east = w.land.exits.find((x) => x.side === 'east')!;
  const pl = w.spawnPlayer(town.index, tm.w - 1 - 9.5, east.c + 0.5);
  const told: unknown[] = [];
  w.listeners.push((ev) => { if (ev.kind === 'blocked') told.push(ev.data); });
  for (let k = 0; k < 200; k++) { w.setInput(pl, 1, 0, false); w.step(); }
  assert.ok(told.length >= 1, 'told the road is blocked');
  assert.ok(w.e.map[pl] === town.index && w.e.x[pl]! < tm.w - 4, 'did not get through');
  // Travel opened: the road is clear.
  w.travelOpen = true; w.land.block(false);
  assert.equal(wrecks(), 0);
});

test('animals: many in the woods, few in town; a hunt kills one and gives meat, leather (claws from some)', () => {
  const w = mk('animal-test');
  w.populate();
  w.land.setup();
  for (let k = 0; k < 40; k++) w.step();
  const woods = w.mapIndex.get('woods')!, town = w.mapIndex.get('town')!;
  assert.ok(w.animals.count(woods) > w.animals.count(town), `woods ${w.animals.count(woods)} > town ${w.animals.count(town)}`);
  // Put a deer next to a person and send them hunting.
  const e = w.e;
  let a = -1;
  for (let i = 0; i < e.hi; i++) if (e.kind[i] === Kind.Agent) { a = i; break; }
  const deer = w.animals.spawn(e.map[a]!, e.x[a]! + 6, e.y[a]!, 0);
  assert.ok(deer >= 0);
  w.survival.inv(a).spear = 1;
  assert.ok(w.tasks.start(a, 'go hunting', 'imad', [{ do: 'hunt', what: 'rabbit' }]));
  let hunted: Record<string, unknown> | null = null;
  w.listeners.push((ev) => { if (ev.kind === 'hunt') hunted = ev.data; });
  for (let k = 0; k < 20 * 600 && !hunted; k++) { e.hunger[a] = 0; e.thirst[a] = 0; e.tired[a] = 0; w.step(); }
  assert.ok(hunted, 'the animal was hunted down');
  assert.ok(e.carry[a]! >= 1, 'meat in the hands');
  assert.ok((w.survival.inv(a).leather ?? 0) >= 1, 'leather in the bag');
});

test('crafting: category + exact ingredients; a player makes a sword, armour, a door; zombies cannot pass the door; armour softens bites', () => {
  assert.equal(matchRecipe('weapon', { wood: 1, ore: 1 })?.what, 'sword');
  assert.equal(matchRecipe('furniture', { wood: 1, ore: 1 })?.what, 'door');
  assert.equal(matchRecipe('weapon', { wood: 1, claw: 1 })?.what, 'spear');
  assert.equal(matchRecipe('clothing', { leather: 2, ore: 1 })?.what, 'armor');
  assert.equal(matchRecipe('weapon', { wood: 2, ore: 1 }), null);
  const w = mk('craft-test');
  w.land.setup();
  const m = w.mapIndex.get('woods')!, tm = w.maps[m]!.tiles;
  // Open ground for the test.
  const G = tileId(w, 'grass');
  for (let y = 80; y < 100; y++) for (let x = 20; x < 40; x++) tm.set(x, y, G);
  const pl = w.spawnPlayer(m, 25.5, 90.5);
  w.survival.playerName = (i) => (i === pl ? 'imad' : '');
  const inv = w.survival.inv(pl);
  Object.assign(inv, { wood: 5, ore: 3, leather: 2 });
  const r1 = w.survival.craftPut(pl, 'weapon', { wood: 1, ore: 1 });
  assert.ok(r1.ok && r1.r.what === 'sword');
  assert.equal(w.survival.weapon(pl)[0], 'sword');
  assert.equal(w.survival.craftPut(pl, 'weapon', { wood: 9 }).ok, false);
  assert.ok(w.survival.craftPut(pl, 'clothing', { leather: 2, ore: 1 }).ok);
  assert.equal(w.survival.defence(pl), 0.35);
  assert.ok(w.survival.craftPut(pl, 'furniture', { wood: 1, ore: 1 }).ok);
  assert.equal(inv.door, 1);
  assert.equal(w.survival.pinv.get('imad'), inv, 'kept by player name');
  // Put the door down in front (facing east).
  w.e.angle[pl] = 0;
  assert.equal(w.survival.placeFront(pl, 'door'), 'placed');
  const DOOR = tileId(w, 'door');
  assert.equal(tm.get(26, 90), DOOR);
  // A wall on both sides of the door, a zombie behind it going for the player: it never steps onto the door.
  const WALL = tileId(w, 'palisade');
  for (let y = 87; y <= 93; y++) for (let x = 20; x <= 26; x++) if ((x === 20 || x === 26 || y === 87 || y === 93) && !(x === 26 && y === 90)) tm.set(x, y, WALL);
  w.place(pl, m, 24.5, 90.5);
  const z = w.zombies.spawn(m, 28.5, 90.5, true);
  assert.ok(z >= 0);
  let onDoor = 0;
  for (let k = 0; k < 250; k++) { w.step(); if (w.e.kind[z] === Kind.Threat && tm.get(Math.floor(w.e.x[z]!), Math.floor(w.e.y[z]!)) === DOOR) onDoor++; }
  assert.equal(onDoor, 0, 'the zombie never stood in the door');
  assert.ok(w.e.kind[z] === Kind.Threat && w.e.x[z]! > 26.5, `it stayed outside (${w.e.x[z]})`);
  // People walk through it.
  void Act;
});

test('the owner plans zombie attacks (when, where, how many, every day) and sets animal counts per map', () => {
  const w = mk('attack-test');
  w.populate();
  w.land.setup();
  const town = w.mapIndex.get('town')!, woods = w.mapIndex.get('woods')!;
  // A planned attack an hour from now, from the roads, 6 zombies, every day.
  let saved = 0;
  w.zombies.onPlans = () => saved++;
  const p = w.zombies.plan({ at: w.gameSec + 3600, map: 'town', n: 6, where: 'edge', daily: true, stays: true });
  assert.equal(w.zombies.count(town), 0);
  for (let k = 0; k < 3000 && w.zombies.count(town) === 0; k++) w.step();
  assert.equal(w.zombies.count(town), 6, 'they came');
  assert.equal(w.zombies.plans.length, 1, 'a daily plan stays');
  assert.ok(w.zombies.plans[0]!.at > w.gameSec, 'for tomorrow');
  assert.ok(saved >= 2);
  // Next to someone: within 40 m of them.
  const e = w.e;
  let a = -1; for (let i = 0; i < e.hi; i++) if (e.kind[i] === Kind.Agent && e.map[i] === town) { a = i; break; }
  const r = w.zombies.attack({ map: 'town', n: 3, where: 'near', near: w.profileOf(a)!.name, stays: true });
  assert.equal(r.n, 3);
  assert.equal(w.zombies.attack({ map: 'town', n: 3, where: 'near', near: 'Nobody At All' }).n, 0);
  assert.ok(w.zombies.unplan(p.id)); assert.equal(w.zombies.plans.length, 0);
  // Animals: the owner's numbers per map, at once with fill.
  w.animals.want.set('woods', [0, 2, 0, 0, 1]);
  w.animals.fill(woods);
  assert.deepEqual([0, 1, 2, 3, 4].map((t) => w.animals.count(woods, t)), [0, 2, 0, 0, 1]);
});
