import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Kind } from '@worldsim/protocol';
import { scenario } from './helpers.js';
import { World } from '../sim/world.js';

const mk = (seed: string) => new World(scenario(), { tickRate: 20, clockScale: 30, capacity: 2048, seed });

/** Two clans of 5 adults in town: A holds the map's camp, B has a camp of its own 60 m east. */
function setup(seed: string) {
  const w = mk(seed);
  w.populate(); w.land.setup();
  const e = w.e, town = w.mapIndex.get('town')!;
  for (let i = 0; i < e.hi; i++) if (e.kind[i] === Kind.Agent) w.remove(i);
  w.step();
  const tm = w.maps[town]!.tiles;
  const main = w.freeSpot(town, tm.w / 2 - 30, tm.h / 2, 30)!, other = w.freeSpot(town, tm.w / 2 + 30, tm.h / 2, 30)!;
  w.survival.camp[town] = main;
  const people: number[] = [];
  for (let n = 0; n < 10; n++) { const c = n < 5 ? main : other; const s = w.freeSpot(town, c.x + (n % 5) * 1.5 - 3, c.y + 2, 80) ?? c; people.push(w.spawnAgent(town, s.x, s.y)); }
  for (const i of people) { const p = w.profileOf(i)!; p.born = w.gameSec - 30 * w.yearSec; p.parents = []; p.partner = -1; p.traits.courage = 0.8; }
  const ids = people.map((i) => e.id(i));
  const A = w.clans.found(town, ids[0]!, ids.slice(1, 5)), B = w.clans.found(town, ids[5]!, ids.slice(6, 10));
  w.survival.leader[town] = ids[0]!;
  B.camp = { x: other.x, y: other.y, m: town, at: w.gameSec }; B.hx = other.x; B.hy = other.y;
  const fed = () => { for (const i of people) { e.hunger[i] = 0; e.thirst[i] = 0; e.tired[i] = 0; } };
  return { w, e, town, people, ids, A, B, main, other, fed };
}

test('territory: each clan has a camp; at peace a visitor walks in freely and nobody warns them', () => {
  const { w, e, town, people, A, B, other, fed } = setup('terr-peace');
  const camps = w.territory.camps(town);
  assert.equal(camps.length, 2);
  assert.equal(camps.find((c) => c.main)?.clan, A.id, 'the map\'s camp is A\'s');
  assert.equal(camps.find((c) => !c.main)?.clan, B.id);
  let warned = 0;
  w.listeners.push((ev) => { if (ev.kind === 'clanWarn') warned++; });
  const v = people[1]!;
  w.place(v, town, other.x + 3, other.y + 3);
  for (let s = 0; s < 20 * 60; s++) { w.step(); fed(); }
  assert.equal(warned, 0, 'a visitor at peace is welcome');
  assert.equal(w.territory.avoidFor(v), null, 'no camp is closed to them');
  assert.match(w.clans.promptText(v), new RegExp(`${B.name} town .*open to visit`));
});

test('territory: at war an intruder is warned, turns back, is barred and their ways go round the camp', () => {
  const { w, e, town, people, ids, A, B, other, fed } = setup('terr-war');
  assert.equal(w.clans.declareWar(A, B, 'owner'), true);
  const v = people[2]!;
  // Awareness: a walk into the enemy camp is refused, the mask covers it.
  const mask = w.territory.avoidFor(v);
  assert.ok(mask, 'the enemy camp is closed to them');
  assert.equal(w.brain.goTo(v, other.x, other.y), false, 'they do not walk into the enemy camp');
  assert.match(w.clans.promptText(v), /CLOSED to you/);
  // Put them inside anyway (wandered in before the war): warned and they leave.
  let warned = 0, trespass = 0;
  w.listeners.push((ev) => { if (ev.kind === 'clanWarn') warned++; if (ev.kind === 'trespass') trespass++; });
  w.place(v, town, other.x + 2, other.y + 2);
  let out = -1;
  for (let s = 0; s < 20 * 90 && out < 0; s++) { w.step(); fed(); if (Math.hypot(e.x[v]! - other.x, e.y[v]! - other.y) > 18) out = s; }
  assert.ok(warned >= 1 && trespass >= 1, 'a guard warned them');
  assert.ok(out >= 0, 'they walked out of the camp');
  assert.ok(e.hp[v]! >= 99, 'nobody struck them: they left in time');
  assert.ok(w.profileOf(v)!.mind!.notes.some((n) => /warned me out/.test(n.text)), 'they remember it');
  void ids;
});

test('territory: an intruder who stays is driven out by a duel; small hits, nobody dies', () => {
  const { w, e, town, people, A, B, other, fed } = setup('terr-stay');
  w.clans.declareWar(A, B, 'owner');
  // This one will not listen.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (w.territory as any).react = () => {};
  const v = people[3]!;
  w.place(v, town, other.x + 1, other.y + 1);
  w.brain.order(v, 'stay', -1, -1, 30);
  const hits: number[] = [];
  let duel = '';
  w.listeners.push((ev) => { if (ev.kind === 'duel' && !duel) duel = String(ev.data.why); if (ev.kind === 'pvp') hits.push(Number(ev.data.dmg)); });
  for (let s = 0; s < 20 * 120; s++) { w.step(); fed(); }
  assert.equal(duel, 'intruder', 'the guards struck after the warning');
  assert.ok(hits.length > 0 && hits.every((d) => d <= 14), `hits are small (${hits.slice(0, 8).join(', ')})`);
  for (const i of people) assert.ok(e.hp[i]! > 0, 'nobody died');
});

test('territory: paths keep out of a closed camp', () => {
  const { w, e, town, people, A, B, other } = setup('terr-path');
  w.clans.declareWar(A, B, 'owner');
  const v = people[1]!;
  // From one side of the enemy camp to the other: the way goes round.
  w.place(v, town, other.x - 26, other.y);
  const goal = w.freeSpot(town, other.x + 26, other.y, 80)!;
  assert.ok(w.brain.goTo(v, goal.x, goal.y));
  let closest = Infinity;
  for (let s = 0; s < 20 * 60; s++) { w.step(); closest = Math.min(closest, Math.hypot(e.x[v]! - other.x, e.y[v]! - other.y)); if (Math.hypot(e.x[v]! - goal.x, e.y[v]! - goal.y) < 1.5) break; }
  assert.ok(closest > 15, `stayed out of the camp (closest ${closest.toFixed(1)} m)`);
});

test('territory: a camp is a small town whose edge takes in its people\'s huts; destroying gives back half the ingredients', () => {
  const { w, e, town, people, B, other } = setup('terr-town');
  const sv = w.survival, b = people[7]!, tm = w.maps[town]!.tiles;
  const r0 = w.territory.camps(town).find((c) => c.clan === B.id)!.r;
  // A hut 24-30 m out from B's centre, built by a B member.
  sv.add(b, 'wood', 40); sv.add(b, 'stone', 20); sv.add(b, 'leather', 10);
  let built = '';
  for (let a = 0; a < 16 && built !== 'built'; a++) {
    const x0 = Math.floor(other.x + Math.cos(a * 0.4) * 26) - 3, y0 = Math.floor(other.y + Math.sin(a * 0.4) * 26) - 3;
    w.place(b, town, x0 + 3.5, y0 + 9.5);
    built = sv.placeAt(b, 'hut', x0, y0, 0);
  }
  assert.equal(built, 'built');
  w.step(); for (let s = 0; s < 21; s++) w.step();
  const r1 = w.territory.camps(town).find((c) => c.clan === B.id)!.r;
  assert.ok(r1 > r0 + 8, `the town grew to take in the hut (${r0} -> ${r1.toFixed(0)} m)`);
  // Recycling: a palisade (2 wood) gives back 1 wood; a door (1 wood + 1 ore) at least 1 wood.
  const wood0 = sv.inv(b).wood ?? 0;
  const p = w.freeSpot(town, e.x[b]! + 2, e.y[b]!, 40)!;
  w.place(b, town, p.x, p.y);
  sv.add(b, 'palisade', 1);
  const tx = Math.floor(p.x) + 2, ty = Math.floor(p.y);
  assert.equal(sv.placeAt(b, 'palisade', tx, ty, 0), 'placed');
  assert.equal(sv.destroyAt(b, tx, ty), 'destroyed');
  assert.equal((sv.inv(b).wood ?? 0) - wood0, 1, 'half of 2 wood back');
  assert.equal(sv.inv(b).palisade ?? 0, 0, 'recycled, not the palisade itself');
  void tm;
});
