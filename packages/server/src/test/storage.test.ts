import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Kind, HUT_SIZE } from '@worldsim/protocol';
import { scenario } from './helpers.js';
import { World } from '../sim/world.js';

const mk = (seed: string) => new World(scenario(), { tickRate: 20, clockScale: 30, capacity: 2048, seed });
const tileId = (w: World, n: string) => w.sc.tiles.find((t) => t.name === n)!.id;

function openSpot(w: World, m: number, x: number, y: number, n = HUT_SIZE): { x0: number; y0: number } {
  const tm = w.maps[m]!.tiles, G = tileId(w, 'grass'), D = tileId(w, 'dirt');
  for (let r = 0; r < 80; r++) for (let yy = y - r; yy <= y + r; yy++) for (let xx = x - r; xx <= x + r; xx++) {
    let ok = true;
    for (let j = -2; j < n + 4 && ok; j++) for (let i = -2; i < n + 2 && ok; i++) { const t = tm.inside(xx + i, yy + j) ? tm.get(xx + i, yy + j) : -1; if (t !== G && t !== D) ok = false; }
    if (ok && !w.land.inRing(m, xx, yy) && !w.portals.some((p) => p.from === m && Math.hypot(p.x - xx, p.y - yy) < 14)) return { x0: xx, y0: yy };
  }
  throw new Error('no open ground');
}

test('huts are 7 x 7; a fridge and a chest go only inside a hut; they keep food / water and things for the family', () => {
  const w = mk('storage-1');
  w.populate(); w.land.setup();
  const e = w.e, town = w.mapIndex.get('town')!, sv = w.survival, T = sv.T, tm = w.maps[town]!.tiles;
  for (let i = 0; i < e.hi; i++) if (e.kind[i] === Kind.Agent) w.place(i, town, 20, 20);
  w.step();
  const s = openSpot(w, town, 60, 60), H = (HUT_SIZE - 1) >> 1;
  const pl = w.spawnPlayer(town, s.x0 + H + 0.5, s.y0 + HUT_SIZE + 1.5);
  w.playerProfile(pl, 'imad');
  sv.add(pl, 'wood', 20); sv.add(pl, 'stone', 10); sv.add(pl, 'leather', 5);
  assert.equal(sv.placeAt(pl, 'hut', s.x0, s.y0, 0), 'built');
  assert.equal(tm.get(s.x0 + H, s.y0 + HUT_SIZE - 1), T.door, 'door in the middle of the south wall');
  assert.equal(tm.get(s.x0 + HUT_SIZE - 1, s.y0), T.woodwall, 'corner 7 tiles across');
  assert.equal(tm.get(s.x0 + HUT_SIZE - 2, s.y0 + 1), T.floor, '5 x 5 room');
  const h = sv.homes.homeOf(e.id(pl))!;
  assert.equal(sv.hutRect(town, h.out, h.dir)!.s, 7);
  assert.equal(sv.homes.inside(pl, h), false);
  // Inside only.
  sv.add(pl, 'fridge', 1); sv.add(pl, 'chest', 1);
  w.place(pl, town, s.x0 + H + 0.5, s.y0 + H + 0.5); // in the room
  assert.equal(sv.canPlace(pl, 'fridge', s.x0 - 2, s.y0 + 2), 'insideHut', 'not on the grass outside');
  assert.equal(sv.canPlace(pl, 'fridge', s.x0 + H, s.y0 + HUT_SIZE - 2), 'doorBlocked', 'not just inside the door');
  assert.equal(sv.placeAt(pl, 'fridge', s.x0 + 1, s.y0 + 1), 'placed');
  assert.equal(sv.placeAt(pl, 'chest', s.x0 + HUT_SIZE - 2, s.y0 + 1), 'placed');
  const fk = (s.y0 + 1) * tm.w + s.x0 + 1, ck = (s.y0 + 1) * tm.w + s.x0 + HUT_SIZE - 2;
  assert.equal(sv.boxKind(town, fk), 'fridge'); assert.equal(sv.boxKind(town, ck), 'chest');
  // Food: 5 in the hands, more in the bag; into the fridge, out again.
  assert.equal(sv.addFood(pl, 8), 8);
  assert.equal(e.carry[pl], 5); assert.equal(sv.inv(pl).food, 3);
  assert.equal(sv.boxPut(pl, fk, 'food', 6), 6);
  assert.equal(sv.foodOf(pl), 2, 'the bag first, then the hands');
  assert.equal(sv.boxPut(pl, fk, 'sword', 1), 'fridgeOnly');
  sv.add(pl, 'sword', 1);
  assert.equal(sv.boxPut(pl, ck, 'food', 1), 'chestNoFood');
  assert.equal(sv.boxPut(pl, ck, 'sword', 1), 1);
  assert.equal(sv.inv(pl).sword ?? 0, 0);
  assert.equal(sv.boxTake(pl, fk, 'food', 2), 2);
  assert.equal(sv.box(town, fk).food, 4);
  // A stranger may not open them.
  const other = w.spawnPlayer(town, s.x0 + 1.5, s.y0 + 2.5);
  w.playerProfile(other, 'stranger');
  assert.equal(sv.boxTake(other, fk, 'food', 1), 'notYours');
  // Water: fill at the water when not thirsty, drink a bottle anywhere.
  const ws = w.brain.waterSpot(pl);
  assert.ok(ws >= 0, 'water on the map');
  w.place(pl, town, (ws % tm.w) + 0.5, Math.floor(ws / tm.w) + 0.5);
  e.thirst[pl] = 0;
  const f = w.brain.playerDo(pl, 'use');
  assert.equal(f.code, 'filled');
  assert.equal(sv.inv(pl).water, 3);
  w.place(pl, town, s.x0 + H + 0.5, s.y0 + H + 0.5);
  e.thirst[pl] = 80;
  assert.equal(w.brain.playerDo(pl, 'drink').code, 'drankBottle');
  assert.equal(e.thirst[pl], 20);
  // Picking food up with full hands: into the bag (imad: "it says my hands are full (5)").
  e.carry[pl] = 5;
  const it = e.create(Kind.Item, town, e.x[pl]! + 0.3, e.y[pl]!, 0.2); e.sub[it] = 1;
  const p = w.brain.playerDo(pl, 'use');
  assert.equal(p.code, 'pickedBag');
  // The plan sees the fridge and what it holds; the prompt text names it.
  const plan = w.plan.of(town);
  assert.equal(plan.lines.find((l) => l.key === 'fridges')!.have, 1);
  assert.ok(plan.lines.find((l) => l.key === 'food')!.have >= 4);
  assert.match(sv.homes.bedText(e.id(pl)), /fridge holds 4 food/);
  // Pulling the hut down gives what was inside back.
  const before = sv.inv(pl).sword ?? 0;
  assert.equal(sv.destroyAt(pl, s.x0 + 1, s.y0), 'destroyed');
  assert.equal(sv.inv(pl).sword ?? 0, before + 1, 'the chest\'s sword back in the bag');
  assert.equal(sv.boxesOf(town).length, 0);
});

test('the camp plan gives idle people work: water and food are stored for later, fridges go into homes', () => {
  const w = mk('storage-plan');
  w.populate(); w.land.setup();
  const e = w.e, town = w.mapIndex.get('town')!, sv = w.survival;
  w.step();
  const people: number[] = [];
  for (let i = 0; i < e.hi; i++) if (e.kind[i] === Kind.Agent) people.push(i);
  // A camp with a fire, everyone fed and rested: nothing urgent, so only the plan has work.
  const c = people[0]!;
  sv.add(c, 'wood', 6); sv.add(c, 'stone', 4);
  for (let k = 0; k < 3000 && !sv.campOf(town); k++) { if (k === 0) w.tasks.start(c, 'make a fire', 'myself', [{ do: 'build', what: 'campfire' }]); w.step(); }
  assert.ok(sv.campOf(town), 'a camp');
  const goals = w.colony.goals(town, people, 10).map((g) => g.name);
  assert.ok(goals.includes('water'), 'water to keep is a goal: ' + goals.join(','));
  assert.ok(goals.includes('store'), 'food to keep is a goal');
  assert.match(w.plan.text(town), /water kept 0\/\d+/);
  // A day: water and food get stored (fridges or the crate).
  let stored = 0;
  w.listeners.push((ev) => { if (ev.kind === 'store' && (ev.data.what === 'water' || ev.data.what === 'food')) stored++; });
  for (let k = 0; k < 20 * 60 * 30 && stored < 2; k++) w.step();
  assert.ok(stored >= 2, `water / food stored for later (${stored})`);
  assert.ok(w.plan.kept(town).water + w.plan.kept(town).food > 0);
});
