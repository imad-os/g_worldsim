import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Act, EFlag } from '@worldsim/protocol';
import { scenario } from './helpers.js';
import { World } from '../sim/world.js';
import { inherit } from '../sim/people.js';
import { kidTalk, stageOf } from '../sim/family.js';

/** A world with a mother, a father and a baby of `age` years next to her. */
function withBaby(seed: string, age: number) {
  const w = new World(scenario(), { tickRate: 20, clockScale: 30, capacity: 2048, seed });
  w.populate();
  const e = w.e, ids = [...w.profiles.keys()];
  const mum = w.profiles.get(ids[0]!)!, dad = w.profiles.get(ids[1]!)!;
  mum.sex = 'f'; dad.sex = 'm'; mum.partner = ids[1]!; dad.partner = ids[0]!;
  const im = e.slot(ids[0]!);
  const kid = inherit(w.rng, mum, dad, [ids[0]!, ids[1]!], w.gameSec - age * w.life.yearSec, w.livingNames());
  const c = w.spawnAgent(e.map[im]!, e.x[im]! + 1, e.y[im]!, kid);
  e.flags[c] = e.flags[c]! | EFlag.Child | EFlag.Small;
  e.hunger[c] = 50; e.thirst[c] = 55;
  return { w, e, im, c, mumId: ids[0]!, dadId: ids[1]!, kidId: e.id(c) };
}

test('a baby is carried, fed and watered by a parent; it never drinks, forages or wanders off on its own', () => {
  const { w, e, c, kidId } = withBaby('baby1', 0.2);
  const own: string[] = [], care: string[] = [];
  w.listeners.push((ev) => {
    const d = ev.data as Record<string, number | string>;
    if ((ev.kind === 'drink' || ev.kind === 'pickup') && d.id === kidId) own.push(ev.kind);
    if (ev.kind === 'care' && d.kid === kidId) care.push(String(d.what));
  });
  let far = 0, held = 0, n = 0;
  // Half a game day (the baby stays under 1 year: a year is a game day by default).
  for (let k = 0; k < 43200 / 30 * 20; k++) {
    w.step();
    if (k % 200 === 0 && e.slot(kidId) === c) {
      n++;
      const car = w.family.carer[c]!;
      if (w.family.carried[c]! >= 0) held++;
      if (car < 0 || Math.hypot(e.x[c]! - e.x[car]!, e.y[c]! - e.y[car]!) > 3) far++;
      assert.notEqual(e.act[c], Act.Forage); assert.notEqual(e.act[c], Act.Drink); assert.notEqual(e.act[c], Act.Talk);
    }
  }
  assert.equal(e.slot(kidId), c, 'the baby is alive');
  assert.deepEqual(own, [], 'a baby does not drink or pick up food itself');
  assert.ok(care.includes('water'), `given water (${care.join(',')})`);
  assert.ok(care.includes('food'), `fed (${care.join(',')})`);
  assert.ok(held / n > 0.7, `carried most of the time (${held}/${n})`);
  assert.ok(far / n < 0.15, `with the carer (${far}/${n} far)`);
  assert.ok(e.hunger[c]! < 90 && e.thirst[c]! < 90, 'not starving');
  assert.ok(w.brain.order(c, 'come', w.e.id(0), -1, 30) === false, 'a baby cannot be ordered about');
});

test('a toddler walks at its carer\'s feet and is picked up when they go', () => {
  const { w, e, c, kidId } = withBaby('tod1', 1.5);
  let held = 0, onFoot = 0, far = 0, n = 0;
  for (let k = 0; k < 21600 / 30 * 20; k++) {
    w.step();
    if (k % 100 === 0 && e.slot(kidId) === c) {
      n++;
      if (w.family.carried[c]! >= 0) held++; else onFoot++;
      const car = w.family.carer[c]!;
      if (car < 0 || Math.hypot(e.x[c]! - e.x[car]!, e.y[c]! - e.y[car]!) > 7) far++;
    }
  }
  assert.ok(held > 0 && onFoot > 0, `both carried (${held}) and on foot (${onFoot})`);
  assert.ok(far / n < 0.15, `near the carer (${far}/${n})`);
});

test('a timid parent fights a zombie that goes for their child', () => {
  const { w, e, im, c } = withBaby('prot1', 6);
  e.flags[c] = (e.flags[c]! | EFlag.Child) & ~EFlag.Small;
  const mum = w.profileOf(im)!; mum.traits.courage = 0.2; mum.traits.strength = 0.2; // timid
  e.x[c] = e.x[im]! + 12; e.y[c] = e.y[im]!; w.setPos(c, e.x[c]!, e.y[c]!);
  const z = w.zombies.spawn(e.map[c]!, e.x[c]! + 4, e.y[c]!, true);
  assert.ok(z >= 0);
  e.nextThink[im] = w.tick;
  let fought = false;
  for (let k = 0; k < 200 && !fought; k++) { w.step(); if (e.act[im] === Act.Fight) fought = true; }
  assert.ok(fought, 'the timid mother fights for her child');
});

test('family: relations, chosen roles between players, no marriage within the family', () => {
  const w = new World(scenario(), { tickRate: 20, clockScale: 30, capacity: 2048, seed: 'kin1' });
  w.populate();
  const e = w.e, ids = [...w.profiles.keys()];
  const i0 = e.slot(ids[0]!);
  const a = w.spawnPlayer(e.map[i0]!, e.x[i0]! + 1, e.y[i0]!), b = w.spawnPlayer(e.map[i0]!, e.x[i0]! + 2, e.y[i0]!);
  const pa = w.playerProfile(a, 'imad'), pb = w.playerProfile(b, 'lina');
  pa.sex = 'm'; pb.sex = 'f';
  const ia = e.id(a), ib = e.id(b);
  assert.equal(w.life.canMarry(ia, ib), true, 'strangers may marry');
  assert.equal(w.family.ask(ia, ib, 'child'), true);
  assert.equal(w.family.answer(ib, ia, true), true);
  assert.equal(w.family.relation(ia, ib), 'daughter');
  assert.equal(w.family.relation(ib, ia), 'father');
  assert.notEqual(w.life.canMarry(ia, ib), true, 'a chosen daughter cannot marry her father');
  assert.notEqual(w.life.court(ia, ib), true);
  // A second chosen child is her sister.
  const c2 = w.spawnPlayer(e.map[i0]!, e.x[i0]! + 3, e.y[i0]!); const pc = w.playerProfile(c2, 'sami'); pc.sex = 'm';
  assert.equal(w.family.setRole(ia, e.id(c2), 'child'), true);
  assert.equal(w.family.relation(ib, e.id(c2)), 'brother');
  assert.ok(w.family.close(ib, e.id(c2)));
  // Married people cannot be made each other's family.
  w.family.setRole(ia, ib, null);
  assert.equal(w.life.wed(ia, ib), true);
  assert.match(String(w.family.setRole(ia, ib, 'sibling')), /married/);
  // Blood: siblings by birth.
  const mum = w.profiles.get(ids[0]!)!, dad = w.profiles.get(ids[1]!)!;
  const k1 = inherit(w.rng, mum, dad, [ids[0]!, ids[1]!], w.gameSec - 20 * w.life.yearSec, w.livingNames());
  const k2 = inherit(w.rng, mum, dad, [ids[0]!, ids[1]!], w.gameSec - 21 * w.life.yearSec, w.livingNames());
  k1.sex = 'm'; k2.sex = 'f';
  const s1 = w.spawnAgent(e.map[i0]!, e.x[i0]!, e.y[i0]! + 2, k1), s2 = w.spawnAgent(e.map[i0]!, e.x[i0]!, e.y[i0]! + 3, k2);
  assert.ok(w.family.close(e.id(s1), e.id(s2)));
  assert.notEqual(w.life.canMarry(e.id(s1), e.id(s2)), true);
});

test('children talk like children', () => {
  const pick = () => 0, fine = { hunger: 10, thirst: 10, tired: 10 };
  assert.match(kidTalk(0.5, 'Hello there, how are you?', { hunger: 80, thirst: 10, tired: 10 }, pick), /Waa/);
  assert.doesNotMatch(kidTalk(0.5, 'Hello there, how are you?', fine, pick), /Hello/);
  const one = kidTalk(1.5, 'I would like some water please', { hunger: 10, thirst: 80, tired: 10 }, pick);
  assert.ok(one.split(/\s+/).length <= 2, one);
  assert.ok(kidTalk(3, 'whatever', fine, pick, 'f').split(/\s+/).length <= 3);
  assert.ok(kidTalk(5, 'I think we should build a wall around the camp before the night comes', fine, pick).split(/\s+/).length <= 7);
  assert.equal(kidTalk(9, 'We need wood.', fine, pick), 'We need wood.');
  assert.equal(stageOf(0.5), 'baby'); assert.equal(stageOf(2), 'toddler'); assert.equal(stageOf(10), 'child');
});

test('both parents provide: the one who gave less takes the little one over and feeds it (imad 2026-11-26)', () => {
  const { w, e, im, c, mumId, dadId, kidId } = withBaby('share1', 1.5);
  const id = e.slot(dadId);
  w.place(id, e.map[im]!, e.x[im]! + 2, e.y[im]!);
  for (const j of [im, id]) { w.brain.stop(j); e.act[j] = Act.Idle; e.flags[j] = e.flags[j]! & ~EFlag.Sleeping; e.thirst[j] = e.hunger[j] = 0; }
  w.step();
  w.family.given.set(mumId, 4); w.family.given.set(dadId, 0); // she did it all morning
  e.hunger[c] = 70; e.carry[id] = 2;
  assert.equal(w.family.provider(c), id, "the father's turn");
  const fed: number[] = [];
  w.listeners.push((ev) => { if (ev.kind === 'care' && ev.data.kid === kidId && ev.data.what === 'food') fed.push(Number(ev.data.id)); });
  for (let k = 0; k < 20 * 60 && !fed.length; k++) w.step();
  assert.deepEqual(fed.slice(0, 1), [dadId], 'the father fed the child');
  assert.equal(w.family.carer[c], id, 'and has it with him now');
  // An older child: the parent whose turn it is brings food over.
  const { w: w2, e: e2, im: m2, c: c2, kidId: k2 } = withBaby('share2', 8);
  e2.flags[c2] = (e2.flags[c2]! | EFlag.Child) & ~EFlag.Small;
  w2.step();
  e2.hunger[c2] = 75; e2.carry[c2] = 0; e2.carry[m2] = 2; e2.hunger[m2] = e2.thirst[m2] = 0;
  w2.place(c2, e2.map[m2]!, e2.x[m2]! + 10, e2.y[m2]!);
  let brought = false;
  w2.listeners.push((ev) => { if (ev.kind === 'care' && ev.data.kid === k2 && ev.data.brought) brought = true; });
  for (let k = 0; k < 20 * 60 && !brought; k++) { w2.step(); e2.hunger[c2] = Math.max(e2.hunger[c2]!, 75); if (e2.carry[c2]! > 0 && !brought) break; }
  assert.ok(brought, 'food brought to the 8-year-old');
});

test('children (3-13) see to their needs but stay near home; with a parent they may go further', () => {
  const { w, e, im, c } = withBaby('leash1', 8);
  e.flags[c] = (e.flags[c]! | EFlag.Child) & ~EFlag.Small;
  const m = e.map[c]!;
  w.survival.camp[m] = { x: e.x[c]!, y: e.y[c]! };
  w.place(im, m, e.x[c]! + 30, e.y[c]! + 30); // mum away
  const far = w.freeSpot(m, e.x[c]! + 70, e.y[c]!, 30)!, near = w.freeSpot(m, e.x[c]! + 15, e.y[c]!, 10)!;
  e.thirst[c] = e.hunger[c] = 0;
  assert.equal(w.brain.goTo(c, far.x, far.y), false, 'not 70 m away on their own');
  assert.equal(w.brain.goTo(c, near.x, near.y), true, 'around home is fine');
  e.thirst[c] = 80;
  assert.equal(w.brain.goTo(c, far.x, far.y), true, 'parched: may go for water');
  e.thirst[c] = 0;
  w.place(im, m, e.x[c]! + 1, e.y[c]!);
  const f2 = w.freeSpot(m, e.x[im]! + 70, e.y[im]!, 30)!;
  w.place(im, m, f2.x - 4, f2.y); w.place(c, m, f2.x - 5, f2.y); // out together with mum
  assert.equal(w.brain.goTo(c, f2.x, f2.y), true, 'with mum next to them');
});

test('clan members guard a clan child by their own empathy and courage, never against a horde', () => {
  const { w, e, im, c, mumId, dadId } = withBaby('clan1', 6);
  e.flags[c] = (e.flags[c]! | EFlag.Child) & ~EFlag.Small;
  const m = e.map[c]!, ids = [...w.profiles.keys()].filter((x) => x !== mumId && x !== dadId && x !== e.id(c));
  const kind = e.slot(ids[0]!), cold = e.slot(ids[1]!);
  for (const j of [kind, cold]) { w.profileOf(j)!.born = w.gameSec - 30 * w.life.yearSec; e.flags[j] = e.flags[j]! & ~(EFlag.Child | EFlag.Small); }
  w.clans.found(m, mumId, [ids[0]!, ids[1]!]);
  Object.assign(w.profileOf(kind)!.traits, { empathy: 0.9, courage: 0.8 });
  Object.assign(w.profileOf(cold)!.traits, { empathy: 0.2, courage: 0.3 });
  w.place(im, w.mapIndex.get('woods') ?? m, 50, 50);
  w.place(kind, m, e.x[c]! + 10, e.y[c]!); w.place(cold, m, e.x[c]! - 10, e.y[c]!);
  const z = w.zombies.spawn(m, e.x[c]! + 3, e.y[c]! + 1, true);
  assert.ok(z >= 0);
  assert.equal(w.family.threatToClanKid(kind), z, 'the kind, brave one sees it as theirs to stop');
  assert.equal(w.family.threatToClanKid(cold), -1, 'the cold, timid one does not');
  for (let q = 0; q < 6; q++) w.zombies.spawn(m, e.x[c]! + 3 + (q % 3), e.y[c]! + 2 + q / 3, true);
  assert.equal(w.family.threatToClanKid(kind), -1, 'not against seven of them');
});
