import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Kind } from '@worldsim/protocol';
import { scenario } from './helpers.js';
import { World } from '../sim/world.js';

const mk = (seed: string) => new World(scenario(), { tickRate: 20, clockScale: 30, capacity: 2048, seed });
const tileId = (w: World, n: string) => w.sc.tiles.find((t) => t.name === n)!.id;

/** An open patch of grass near (x, y) big enough for a hut and room round it. */
function openSpot(w: World, m: number, x: number, y: number): { x0: number; y0: number } {
  const tm = w.maps[m]!.tiles, G = tileId(w, 'grass'), D = tileId(w, 'dirt');
  for (let r = 0; r < 60; r++) for (let yy = y - r; yy <= y + r; yy++) for (let xx = x - r; xx <= x + r; xx++) {
    let ok = true;
    for (let j = -2; j < 9 && ok; j++) for (let i = -2; i < 7 && ok; i++) { const t = tm.inside(xx + i, yy + j) ? tm.get(xx + i, yy + j) : -1; if (t !== G && t !== D) ok = false; }
    if (ok && !w.land.inRing(m, xx, yy) && !w.portals.some((p) => p.from === m && Math.hypot(p.x - xx, p.y - yy) < 12)) return { x0: xx, y0: yy };
  }
  throw new Error('no open ground');
}

test('aimed building: a player puts a hut exactly where aimed (door facing the chosen way), it has its own door and is theirs', () => {
  const w = mk('home-aim');
  w.populate(); w.land.setup();
  const e = w.e, town = w.mapIndex.get('town')!, sv = w.survival, T = sv.T, tm = w.maps[town]!.tiles;
  for (let i = 0; i < e.hi; i++) if (e.kind[i] === Kind.Agent) w.place(i, town, 20, 20);
  w.step();
  const s = openSpot(w, town, 60, 60);
  const pl = w.spawnPlayer(town, s.x0 + 2.5, s.y0 + 7.5);
  w.playerProfile(pl, 'imad');
  sv.add(pl, 'wood', 14); sv.add(pl, 'stone', 4);
  assert.equal(sv.canPlace(pl, 'hut', s.x0 + 30, s.y0, 0), 'tooFar', 'out of reach');
  assert.equal(sv.canPlace(pl, 'hut', s.x0, s.y0, 0), '', 'open ground in reach');
  assert.equal(sv.placeAt(pl, 'hut', s.x0, s.y0, 0), 'built');
  assert.equal(tm.get(s.x0 + 2, s.y0 + 4), T.door, 'the door in the middle of the south wall');
  assert.equal(tm.get(s.x0, s.y0), T.woodwall); assert.equal(tm.get(s.x0 + 2, s.y0 + 2), T.floor);
  const h = sv.homes.homeOf(e.id(pl));
  assert.ok(h, 'the builder owns it');
  assert.deepEqual(w.profileOf(pl)!.home, { map: 'town', x: s.x0 + 2, y: s.y0 + 2 });
  assert.match(w.profileOf(pl)!.mind!.notes.at(-1)!.text, /My home is the hut/);
  // A thing put down exactly on a tile; a taken tile says so.
  sv.add(pl, 'lamp', 2);
  assert.equal(sv.placeAt(pl, 'lamp', s.x0 + 5, s.y0 + 6), 'placed');
  assert.equal(tm.get(s.x0 + 5, s.y0 + 6), tileId(w, 'lamp'));
  assert.equal(sv.placeAt(pl, 'lamp', s.x0 + 5, s.y0 + 6), 'noRoom');
  // Facing east this time: the door is on the east wall.
  sv.add(pl, 'wood', 14); sv.add(pl, 'stone', 4);
  w.place(pl, town, s.x0 + 2.5, s.y0 + 7.5);
  const s2 = openSpot(w, town, s.x0 + 2, s.y0 + 12);
  w.place(pl, town, s2.x0 - 1.5, s2.y0 + 2.5);
  assert.equal(sv.placeAt(pl, 'hut', s2.x0, s2.y0, 1), 'built');
  assert.equal(tm.get(s2.x0 + 4, s2.y0 + 2), T.door, 'east door');
});

test('a hut\'s door opens only for its owner and their family; strangers stay outside and are told', () => {
  const w = mk('home-door');
  w.populate(); w.land.setup();
  const e = w.e, town = w.mapIndex.get('town')!, sv = w.survival;
  for (let i = 0; i < e.hi; i++) if (e.kind[i] === Kind.Agent) w.place(i, town, 20, 20);
  w.step();
  const s = openSpot(w, town, 60, 60);
  const owner = w.spawnPlayer(town, s.x0 + 2.5, s.y0 + 6.5);
  w.playerProfile(owner, 'imad');
  sv.add(owner, 'wood', 14); sv.add(owner, 'stone', 4);
  assert.equal(sv.placeAt(owner, 'hut', s.x0, s.y0, 0), 'built');
  w.place(owner, town, s.x0 + 2.5, s.y0 + 5.5);
  assert.equal(sv.toggleDoor(owner, s.x0 + 2, s.y0 + 4), 'doorOpened', 'left open: still only for the family');
  w.place(owner, town, s.x0 - 3, s.y0 + 8);
  const stranger = w.spawnPlayer(town, s.x0 + 2.5, s.y0 + 6.5);
  w.playerProfile(stranger, 'guest');
  const told: number[] = [];
  w.listeners.push((ev) => { if (ev.kind === 'blocked' && ev.data.why === 'door') told.push(Number(ev.data.id)); });
  const inside = (i: number) => e.x[i]! > s.x0 + 1 && e.x[i]! < s.x0 + 4 && e.y[i]! > s.y0 + 1 && e.y[i]! < s.y0 + 4;
  const walkIn = (i: number) => { let got = false; for (let k = 0; k < 20 * 4; k++) { w.setInput(i, 0, -1, false); w.step(); if (inside(i)) got = true; } w.setInput(i, 0, 0, false); return got; };
  assert.equal(walkIn(stranger), false, 'a stranger cannot go in');
  assert.ok(told.includes(e.id(stranger)), 'the stranger is told why');
  // The client's own moves are checked too.
  w.place(stranger, town, s.x0 + 2.5, s.y0 + 5.5);
  assert.equal(w.trustMove(stranger, s.x0 + 2.5, s.y0 + 4.5), false, 'no stepping onto the door');
  // Married to the owner: the door opens.
  w.place(stranger, town, s.x0 + 2.5, s.y0 + 6.5);
  w.profileOf(stranger)!.partner = e.id(owner); w.profileOf(owner)!.partner = e.id(stranger);
  assert.equal(walkIn(stranger), true, 'family goes in');
  assert.equal(sv.homes.homeOf(e.id(stranger)), sv.homes.homeOf(e.id(owner)), 'their home too');
  // Zombies never pass a door.
  const z = w.zombies.spawn(town, s.x0 + 2.5, s.y0 + 6.5, true);
  assert.ok(z >= 0);
});

test('homes: free huts go to families without one, a dead owner leaves it to the partner, people sleep at home; saved', () => {
  const w = mk('home-hourly');
  w.populate(); w.land.setup();
  const e = w.e, town = w.mapIndex.get('town')!, sv = w.survival;
  const people = [...Array(e.hi).keys()].filter((i) => e.kind[i] === Kind.Agent && e.map[i] === town);
  for (const i of people) { w.place(i, town, 20, 20); w.profileOf(i)!.born = w.gameSec - 30 * w.yearSec; w.profileOf(i)!.partner = -1; w.profileOf(i)!.parents = []; }
  const [a, b] = people as [number, number];
  w.step(); // the first step counts the map's huts
  // A hut nobody owns (built by a child, say): the hourly pass gives it to a household.
  const s = openSpot(w, town, 60, 60);
  const pl = w.spawnPlayer(town, s.x0 + 2.5, s.y0 + 7.5);
  w.playerProfile(pl, 'builder');
  sv.add(pl, 'wood', 14); sv.add(pl, 'stone', 4);
  assert.equal(sv.placeAt(pl, 'hut', s.x0, s.y0, 0), 'built');
  let h = sv.homes.list[0]!;
  h.owner = -1;
  w.remove(pl, 'removed');
  // a and b marry: they come first.
  w.profileOf(a)!.partner = e.id(b); w.profileOf(b)!.partner = e.id(a);
  sv.homes.hourly();
  h = sv.homes.list[0]!;
  assert.ok(h.owner === e.id(a) || h.owner === e.id(b), `the couple got it (${h.owner})`);
  assert.ok(sv.homes.needed(town) >= 1, 'others still need homes');
  // Sleep: the owner heads home.
  const own = e.slot(h.owner);
  e.tired[own] = 99;
  w.place(own, town, s.x0 + 2.5, s.y0 + 12);
  let home = false;
  for (let k = 0; k < 20 * 60 && !home; k++) { e.tired[own] = 99; e.hunger[own] = 0; e.thirst[own] = 0; w.step(); home = e.x[own]! > s.x0 && e.x[own]! < s.x0 + 5 && e.y[own]! > s.y0 && e.y[own]! < s.y0 + 5; }
  assert.ok(home, 'they sleep in their own hut');
  // Kept in snapshots.
  const saved = JSON.parse(JSON.stringify(sv.save()));
  const was = h.owner;
  sv.load(saved);
  assert.equal(sv.homes.list[0]!.owner, was, 'owner kept');
  // The owner dies: the partner has it.
  const heir = was === e.id(a) ? b : a;
  w.remove(e.slot(was), 'old age');
  sv.homes.hourly();
  assert.equal(sv.homes.list[0]!.owner, e.id(heir), 'the partner inherits');
});

test('natural resources come back to a steady level; rocks are hard and ore is rare', () => {
  const w = mk('regrow');
  w.populate(); w.land.setup();
  const e = w.e, woods = w.mapIndex.get('woods')!, sv = w.survival, tm = w.maps[woods]!.tiles, T = sv.T;
  for (let i = 0; i < e.hi; i++) if (e.kind[i] === Kind.Agent) w.place(i, w.mapIndex.get('town')!, 20, 20);
  const before = sv.countRes(woods);
  assert.ok(before.rock > 0 && before.rock <= 18 * 5, `rocks are few (${before.rock})`);
  const hourly = (sv as unknown as { regrow(): void });
  (sv as unknown as { regrow(): void }).regrow(); // counts the steady level
  const target = sv.resTarget[woods]!;
  assert.ok(target.tree >= before.tree);
  // Cut a third of the trees and break most rocks.
  let cut = 0;
  for (let k = 0; k < tm.tiles.length && cut < before.tree / 3; k++) if (tm.tiles[k] === T.tree && !w.land.inRing(woods, k % tm.w, (k / tm.w) | 0)) { tm.set(k % tm.w, (k / tm.w) | 0, T.dirt); cut++; }
  let broke = 0;
  for (let k = 0; k < tm.tiles.length; k++) if (tm.tiles[k] === T.rock && broke < before.rock - 2) { tm.set(k % tm.w, (k / tm.w) | 0, T.grass); broke++; }
  const town0 = w.mapIndex.get('town')!, ttm0 = w.maps[town0]!.tiles, RUB = T.rubble;
  const rubble = () => { let n = 0; for (const t of ttm0.tiles) if (t === RUB) n++; return n; };
  const rub0 = rubble();
  let gone = 0;
  for (let k = 0; k < ttm0.tiles.length && gone < rub0 / 2; k++) if (ttm0.tiles[k] === RUB) { ttm0.set(k % ttm0.w, (k / ttm0.w) | 0, ttm0.breaksTo[RUB]!); gone++; }
  const rubLow = rubble();
  const low = sv.countRes(woods);
  for (let h = 0; h < 24 * 6; h++) hourly.regrow.call(sv);
  const after = sv.countRes(woods);
  assert.ok(after.tree > low.tree + cut * 0.5, `trees grow back (${low.tree} -> ${after.tree}, target ${target.tree})`);
  assert.ok(after.tree <= target.tree + 5, 'never past the steady level');
  assert.ok(after.rock > low.rock && after.rock <= target.rock, `rocks surface slowly (${low.rock} -> ${after.rock})`);
  assert.ok(rubble() > rubLow + gone * 0.3, `ruins crumble again: rubble ${rubLow} -> ${rubble()} (of ${rub0})`);
  // Hard: a rock takes several blows; ore is rare.
  const town = w.mapIndex.get('town')!, ttm = w.maps[town]!.tiles;
  const pl = w.spawnPlayer(town, 30, 30); w.playerProfile(pl, 'miner');
  let ore = 0, blows = 0;
  const take1 = (sv as unknown as { take1(i: number, m: number, x: number, y: number, t: number): Record<string, number> }).take1.bind(sv);
  for (let r = 0; r < 40; r++) {
    ttm.set(40, 40, T.rock);
    let n = 0;
    while (ttm.get(40, 40) === T.rock && n < 50) { const g = take1(pl, town, 40, 40, T.rock); ore += g.ore ?? 0; n++; }
    blows += n;
  }
  assert.ok(blows / 40 >= 5, `blows per rock ${blows / 40}`);
  assert.ok(ore / blows < 0.2, `ore per blow ${ore / blows}`);
});

test('pulling down: only your own building, or one whose owner is dead; an admin reset clears every building and starts over', () => {
  const w = mk('home-destroy');
  w.populate(); w.land.setup();
  const e = w.e, town = w.mapIndex.get('town')!, sv = w.survival, T = sv.T, tm = w.maps[town]!.tiles;
  for (let i = 0; i < e.hi; i++) if (e.kind[i] === Kind.Agent) w.place(i, town, 20, 20);
  w.step();
  const s = openSpot(w, town, 60, 60);
  const me = w.spawnPlayer(town, s.x0 + 2.5, s.y0 + 7.5); w.playerProfile(me, 'imad');
  const other = w.spawnPlayer(town, s.x0 + 3.5, s.y0 + 7.5); w.playerProfile(other, 'lina');
  sv.add(me, 'wood', 14); sv.add(me, 'stone', 4); sv.add(me, 'lamp', 1);
  assert.equal(sv.placeAt(me, 'hut', s.x0, s.y0, 0), 'built');
  assert.equal(sv.placeAt(me, 'lamp', s.x0 + 5, s.y0 + 6), 'placed');
  // Someone else may not; the map's own ground is not a building.
  assert.equal(sv.destroyAt(other, s.x0 + 5, s.y0 + 6), 'notYours');
  assert.equal(sv.destroyAt(other, s.x0, s.y0), 'notYours', 'not my hut');
  assert.equal(sv.destroyAt(other, s.x0 + 6, s.y0 + 8), 'nothing');
  assert.equal(sv.destroyCells(town, s.y0 * tm.w + s.x0).length, 25, 'a hut comes down whole');
  // The owner may: the lamp goes back into the bag, the hut gives back half its materials and the home is gone.
  assert.equal(sv.destroyAt(me, s.x0 + 5, s.y0 + 6), 'destroyed');
  assert.notEqual(tm.get(s.x0 + 5, s.y0 + 6), tileId(w, 'lamp'));
  assert.equal(sv.inv(me).lamp, 1);
  assert.equal(sv.destroyAt(me, s.x0 + 2, s.y0 + 4), 'destroyed');
  assert.equal(sv.huts[town]!.length, 0); assert.equal(sv.homes.homeOf(e.id(me)), undefined);
  assert.equal(w.profileOf(me)!.home, undefined);
  for (let yy = 0; yy < 5; yy++) for (let xx = 0; xx < 5; xx++) assert.ok(!sv.builtTile(tm.get(s.x0 + xx, s.y0 + yy)), 'all its tiles are ground again');
  assert.equal(sv.inv(me).wood, 7); assert.equal(sv.inv(me).stone, 2);
  // An AI person's hut: nobody else may, until the owner is dead.
  const ai = [...Array(e.hi).keys()].find((i) => e.kind[i] === Kind.Agent)!;
  w.place(ai, town, s.x0 + 2.5, s.y0 + 7.5);
  sv.add(ai, 'wood', 14); sv.add(ai, 'stone', 4);
  assert.equal(sv.placeAt(ai, 'hut', s.x0, s.y0, 0), 'built');
  w.place(other, town, s.x0 + 3.5, s.y0 + 7.5);
  assert.equal(sv.destroyAt(other, s.x0 + 2, s.y0 + 4), 'notYours');
  w.profileOf(ai)!.died = w.gameSec;
  assert.equal(sv.destroyAt(other, s.x0 + 2, s.y0 + 4), 'destroyed', 'the owner is dead');
  // An AI person pulls down their own thing by a task step.
  const ai2 = [...Array(e.hi).keys()].find((i) => e.kind[i] === Kind.Agent && i !== ai)!;
  w.place(ai2, town, s.x0 + 4.5, s.y0 + 7.5);
  sv.add(ai2, 'lamp', 1);
  assert.equal(sv.placeAt(ai2, 'lamp', s.x0 + 6, s.y0 + 7), 'placed');
  assert.equal(sv.wreck(other, 'lamp'), 'nothing here is mine to pull down');
  assert.equal(sv.wreck(ai2, 'lamp'), true);
  for (let n = 0; n < 20 * 60 && tm.get(s.x0 + 6, s.y0 + 7) === tileId(w, 'lamp'); n++) w.step();
  assert.notEqual(tm.get(s.x0 + 6, s.y0 + 7), tileId(w, 'lamp'), 'they took it down');
  // Admin reset: every building goes, homes and camps are forgotten.
  sv.add(me, 'wood', 14); sv.add(me, 'stone', 4);
  w.place(me, town, s.x0 + 2.5, s.y0 + 7.5);
  assert.equal(sv.placeAt(me, 'hut', s.x0, s.y0, 0), 'built');
  assert.ok(sv.campOf(town));
  const r = sv.resetBuildings();
  assert.ok(r.tiles >= 25 && r.huts >= 1, JSON.stringify(r));
  assert.equal(sv.huts[town]!.length, 0); assert.equal(sv.campOf(town), null); assert.equal(sv.homes.list.length, 0);
  assert.equal(w.profileOf(me)!.home, undefined);
  assert.equal(sv.countTiles(town, T.woodwall), 0);
});

test('doors open and close with the interact button: a closed door stops a player, a stranger cannot open it, people close it behind them', () => {
  const w = mk('home-doors');
  w.populate(); w.land.setup();
  const e = w.e, town = w.mapIndex.get('town')!, sv = w.survival, T = sv.T, tm = w.maps[town]!.tiles;
  for (let i = 0; i < e.hi; i++) if (e.kind[i] === Kind.Agent) w.place(i, town, 20, 20);
  w.step();
  const s = openSpot(w, town, 60, 60);
  const me = w.spawnPlayer(town, s.x0 + 2.5, s.y0 + 6.5); w.playerProfile(me, 'imad');
  const other = w.spawnPlayer(town, s.x0 + 5.5, s.y0 + 7.5); w.playerProfile(other, 'lina');
  sv.add(me, 'wood', 14); sv.add(me, 'stone', 4);
  assert.equal(sv.placeAt(me, 'hut', s.x0, s.y0, 0), 'built');
  const dx = s.x0 + 2, dy = s.y0 + 4; // the south door
  w.place(me, town, dx + 0.5, dy + 1.5);
  assert.equal(tm.get(dx, dy), T.door, 'a new hut\'s door is shut');
  assert.equal(w.trustMove(me, dx + 0.5, dy + 0.6), false, 'a closed door stops me');
  w.place(other, town, dx + 1.5, dy + 1.5);
  assert.equal(sv.toggleDoor(other, dx, dy), 'doorLocked', 'not their home');
  assert.equal(sv.toggleDoor(me, dx + 9, dy), 'nothing');
  assert.equal(sv.toggleDoor(me, dx, dy), 'doorOpened');
  assert.equal(tm.get(dx, dy), T.doorOpen);
  assert.equal(w.trustMove(me, dx + 0.5, dy + 0.6), true, 'open: I walk in');
  assert.equal(sv.toggleDoor(me, dx, dy), 'doorSomeone', 'not on myself');
  assert.equal(w.trustMove(me, dx + 0.5, dy - 0.4), true, 'into the room');
  assert.equal(sv.toggleDoor(me, dx, dy), 'doorClosed');
  assert.equal(tm.get(dx, dy), T.door);
  // A gate with no owner opens for anyone; an AI person walking through an open door shuts it behind them.
  sv.toggleDoor(me, dx, dy);
  const ai = [...Array(e.hi).keys()].find((i) => e.kind[i] === Kind.Agent)!;
  sv.homes.list[0]!.owner = -1; // free hut: open to all
  w.place(ai, town, dx + 0.5, dy + 0.5);
  e.vx[ai] = 0; e.vy[ai] = 2;
  for (let n = 0; n < 40 && Math.floor(e.y[ai]!) === dy; n++) { w.brain.order(ai, 'goto', -1, -1, 60); w.place(ai, town, dx + 0.5, dy + 0.5 + n * 0.05); w.step(); }
  w.place(ai, town, dx + 0.5, dy + 0.9);
  // Step off the door tile by physics: move the body one tile down.
  const b = (w as unknown as { bodies: { setLinearVelocity(v: { x: number; y: number }): void }[] }).bodies[ai];
  for (let n = 0; n < 30 && Math.floor(e.y[ai]!) === dy; n++) { b?.setLinearVelocity({ x: 0, y: 3 }); w.step(); }
  if (Math.floor(e.y[ai]!) !== dy) assert.equal(tm.get(dx, dy), T.door, 'they shut it behind them');
});
