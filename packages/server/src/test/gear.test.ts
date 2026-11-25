import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Kind, Act, unpackGear, packGear, levelCost, qualityCost, gearMul } from '@worldsim/protocol';
import { scenario } from './helpers.js';
import { World } from '../sim/world.js';

const mk = (seed: string) => new World(scenario(), { tickRate: 20, clockScale: 30, capacity: 2048, seed });

test('gear: the best weapon is used unless one is chosen; levels and quality raise damage / defence and cost materials', () => {
  const w = mk('gear-test');
  w.populate();
  const e = w.e;
  let i = -1;
  for (let k = 0; k < e.hi; k++) if (e.kind[k] === Kind.Agent && w.profileOf(k)) { i = k; break; }
  assert.ok(i >= 0);
  const sv = w.survival, g = w.gear;
  for (const k of Object.keys(sv.inv(i))) delete sv.inv(i)[k];
  assert.deepEqual(sv.weapon(i), ['', 0], 'bare hands');
  sv.add(i, 'axe', 1); sv.add(i, 'sword', 1); sv.add(i, 'clothes', 1); sv.add(i, 'armor', 1); sv.add(i, 'helmet', 1);
  assert.equal(sv.weapon(i)[0], 'sword', 'the strongest carried');
  assert.equal(sv.weapon(i)[1], 34);
  assert.ok(Math.abs(sv.defence(i) - 0.5) < 1e-9, 'armor + helmet');
  // A player-style choice: the axe in hand, no body armour.
  assert.equal(g.equip(i, 'weapon:axe').ok, true);
  assert.equal(sv.weapon(i)[0], 'axe');
  assert.equal(g.equip(i, 'body:-').ok, true);
  assert.ok(Math.abs(sv.defence(i) - 0.15) < 1e-9, 'helmet only');
  assert.equal(g.equip(i, 'weapon:bow').ok, false, 'a bow is not a hand weapon');
  assert.equal(g.equip(i, 'weapon:spear').ok, false, 'not carried');
  g.equip(i, 'weapon:'); g.equip(i, 'body:');
  // Level up the sword: costs ore + stone; without them it says what is missing.
  const r0 = g.upgrade(i, 'sword:lv');
  assert.equal(r0.code, 'upNeed');
  assert.deepEqual(r0.need, levelCost('sword', 0));
  sv.add(i, 'ore', 20); sv.add(i, 'stone', 20);
  for (let k = 0; k < 2; k++) assert.equal(g.upgrade(i, 'sword:lv').code, 'upgraded');
  assert.deepEqual(g.up(i, 'sword'), [2, 0]);
  assert.equal(sv.inv(i).ore, 20 - 1 - 1);
  assert.ok(Math.abs(sv.weapon(i)[1] - 34 * 1.1) < 1e-9, '+2 = +10 %');
  // Quality: needs the level first (fine at +2), then rare things.
  sv.add(i, 'claw', 5); sv.add(i, 'scrap', 5);
  assert.equal(g.upgrade(i, 'sword:q').code, 'upgraded');
  assert.deepEqual(g.up(i, 'sword'), [2, 1]);
  assert.equal(g.upgrade(i, 'sword:q').code, 'needLevel', 'superior needs +4');
  assert.ok(Math.abs(sv.weapon(i)[1] - 34 * gearMul(2, 1)) < 1e-9);
  assert.deepEqual(qualityCost('sword', 0), { claw: 1, ore: 2, scrap: 1 });
  // Zombies feel it: damageOf grows with the weapon.
  assert.ok(w.zombies.damageOf(i) > 34 * 0.8);
  // Viewers get the gear and what the person does.
  e.act[i] = Act.Build;
  let look = unpackGear(g.code(i));
  assert.equal(look.held, 'sword'); assert.equal(look.hq, 1); assert.equal(look.helmet, true); assert.equal(look.body, 'armor'); assert.equal(look.anim, 'build');
  const seq0 = look.seq;
  g.play(i, 'attack');
  look = unpackGear(g.code(i));
  assert.equal(look.anim, 'attack');
  assert.equal(look.seq, (seq0 + 1) & 15, 'a new swing restarts the move');
  // Round trip of every field.
  const all = { held: 'bow', hq: 4, helmet: true, headQ: 3, body: 'clothes' as const, bodyQ: 2, anim: 'shoot' as const, seq: 9, back: false };
  assert.deepEqual(unpackGear(packGear(all)), all);
  // Saved with the profile.
  assert.deepEqual(w.profileOf(i)!.gear!.up!.sword, [2, 1]);
});
