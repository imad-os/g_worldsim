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
  const all = { held: 'bow', hq: 4, helmet: true, headQ: 3, body: 'clothes' as const, bodyQ: 2, anim: 'shoot' as const, seq: 9, back: false, aim: true };
  assert.deepEqual(unpackGear(packGear(all)), all);
  // Saved with the profile.
  assert.deepEqual(w.profileOf(i)!.gear!.up!.sword, [2, 1]);
});

test('aiming: a player holding the aim with a bow is sent drawing it; a killed animal is marked for viewers to show it fall', () => {
  const w = mk('aim-test');
  w.populate();
  const e = w.e;
  const i = w.spawnPlayer(0, 20, 20);
  assert.ok(i >= 0);
  w.playerProfile(i, 'Tester');
  const sv = w.survival, g = w.gear;
  for (const k of Object.keys(sv.inv(i))) delete sv.inv(i)[k];
  sv.add(i, 'sword', 1); sv.add(i, 'bow', 1);
  assert.equal(unpackGear(g.code(i)).held, 'sword');
  g.aiming[i] = 1;
  const a = unpackGear(g.code(i));
  assert.equal(a.held, 'bow'); assert.equal(a.anim, 'shoot'); assert.equal(a.aim, true); assert.equal(a.back, false);
  g.play(i, 'shoot'); // let go: the shot plays, not the held draw
  assert.equal(unpackGear(g.code(i)).aim, false);
  g.aiming[i] = 0;
  sv.add(i, 'bow', -1); g.aiming[i] = 1;
  assert.equal(unpackGear(g.code(i)).aim, false, 'no bow, no aiming');
  // An arrow can fly faster than the scenario's projectiles.
  const p = w.shoot(e.map[i]!, e.x[i]! + 1, e.y[i]!, 1, 0, i, 100);
  assert.ok(p >= 0); assert.equal(Math.round(e.vx[p]!), 100);
  // A hunted animal: removed, and its id kept a moment in `fell`.
  const an = w.animals.spawn(e.map[i]!, e.x[i]! + 3, e.y[i]!, 0);
  assert.ok(an >= 0);
  const id = e.id(an);
  assert.ok(w.animals.hit(an, 999, i));
  assert.equal(w.fell.has(id), true);
  assert.equal(e.alive(an), false);
});

test('herbs and first-aid kits: herbs grow by trees, picking gives herbs, 3 herbs + 1 leather = a kit, a kit heals; hurt AI people use theirs', () => {
  const w = mk('herb-test');
  w.populate();
  const e = w.e, sv = w.survival, T = sv.T;
  assert.ok(T.herbs >= 0, 'the herbs tile exists');
  for (let h = 0; h < 6; h++) (sv as unknown as { regrow(): void }).regrow();
  let patches = 0, at = -1, m0 = 0;
  for (let m = 0; m < w.maps.length; m++) { const tm = w.maps[m]!.tiles; for (let k = 0; k < tm.tiles.length; k++) if (tm.tiles[k] === T.herbs) { patches++; if (at < 0) { at = k; m0 = m; } } }
  assert.ok(patches > 10, `herb patches grew (${patches})`);
  const i = w.spawnPlayer(m0, 20, 20); w.playerProfile(i, 'Herbalist');
  const tm = w.maps[m0]!.tiles, tx = at % tm.w, ty = (at / tm.w) | 0;
  w.place(i, m0, tx + 0.5, ty + 1.3);
  const r = sv.playerWork(i);
  assert.equal(r?.code, 'herbs');
  assert.equal(sv.inv(i).herb ?? 0, 0, 'on the ground first (imad 2026-11-27)');
  assert.ok((sv.pickDrops(i, 4).got.herb ?? 0) >= 1);
  assert.ok((sv.inv(i).herb ?? 0) >= 1);
  assert.equal(tm.get(tx, ty), T.grass, 'picked clean');
  sv.add(i, 'herb', 5); sv.add(i, 'leather', 1);
  const c = sv.craftPut(i, 'healing', { herb: 3, leather: 1 });
  assert.equal(c.ok, true);
  assert.equal(sv.inv(i).medkit, 1);
  e.hp[i] = 30;
  assert.equal(sv.useMedkit(i).code, 'healed');
  assert.equal(Math.round(e.hp[i]!), 75);
  assert.equal(sv.useMedkit(i).code, 'noMedkit');
  // An AI person below 55 % uses a kit by themselves.
  let a = -1;
  for (let k = 0; k < e.hi; k++) if (e.kind[k] === Kind.Agent && w.profileOf(k) && !w.family.dependent(k)) { a = k; break; }
  sv.add(a, 'medkit', 1); e.hp[a] = 40;
  sv.autoHeal();
  assert.equal(Math.round(e.hp[a]!), 85);
  assert.equal(sv.inv(a).medkit ?? 0, 0);
});
