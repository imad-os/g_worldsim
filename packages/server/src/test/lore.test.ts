import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Kind } from '@worldsim/protocol';
import { World } from '../sim/world.js';
import { serialize, restore } from '../persist/snapshot.js';
import { scenario } from './helpers.js';

function world(seed: string) {
  const sc = scenario(); sc.agents.count = 6;
  const w = new World(sc, { tickRate: 20, clockScale: 10, capacity: 2048, seed });
  w.populate(); w.land.setup(); w.step();
  const people: number[] = [];
  for (let i = 0; i < w.e.hi; i++) if (w.e.kind[i] === Kind.Agent) people.push(i);
  return { w, e: w.e, people };
}

test('the community remembers where and what killed its people, children learn it as they grow, it outlives everyone who saw it', () => {
  const { w, e, people } = world('lore-a');
  const woods = w.mapIndex.get('woods')!;
  const [a, b, c] = people as [number, number, number];
  // Three people killed by bears in the same part of the woods.
  for (const i of [a, b, c]) w.emit('death', { id: e.id(i), cause: 'bear', map: 'woods', x: 150, y: 40 });
  const L = w.lore;
  const adult = people[3]!;
  w.profileOf(adult)!.born = w.gameSec - 30 * w.yearSec;
  assert.ok(L.placeFear(adult, woods, 152, 44) >= 9, 'the place is dreaded');
  assert.ok(L.feared(adult, woods, 150, 40));
  assert.equal(L.feared(adult, woods, 30, 150), false, 'not the whole map');
  assert.ok(L.fearOf(adult, 'bear') >= 8, 'bears are feared');
  assert.equal(L.maps.get(woods)!.deaths, 3);
  assert.ok(L.lessons.some((l) => /killed by a bear in the north-east of Pine Woods/.test(l.text)), L.lessons.map((l) => l.text).join(' | '));
  // A baby knows nothing yet, an 8 year old half of it, a 13 year old all of it.
  const kid = people[4]!;
  w.profileOf(kid)!.born = w.gameSec - 1 * w.yearSec; assert.equal(L.knows(kid), 0);
  w.profileOf(kid)!.born = w.gameSec - 8 * w.yearSec; assert.equal(L.knows(kid), 0.5);
  w.profileOf(kid)!.born = w.gameSec - 13 * w.yearSec; assert.equal(L.knows(kid), 1);
  // In the prompt.
  assert.match(L.promptText(adult), /keep away from the north-east of Pine Woods \(3 died: bear\).*fear bears \(3 of us killed\).*Pine Woods \(3 dead\)/);
  // An unarmed adult no longer goes into such a map; well armed, yes (by day).
  w.gameSec = Math.ceil(w.gameSec / 86400) * 86400 + 2 * 3600; // 10:00
  w.survival.inv(adult).spear = 0; w.survival.inv(adult).axe = 0; w.survival.inv(adult).sword = 0;
  e.hp[adult] = 100; e.map[adult] = w.mapIndex.get('town')!;
  assert.equal(w.brain.mayGoWild(adult), false, 'unarmed: not into the dreaded woods');
  // Snapshots keep it; everyone who saw it can be gone.
  const w2 = new World(w.sc, { tickRate: 20, clockScale: 10, capacity: 2048, seed: 'lore-a' });
  restore(w2, serialize(w));
  assert.equal(w2.lore.maps.get(woods)!.deaths, 3);
  assert.ok(w2.lore.places.size >= 1 && w2.lore.threats.get('bear')!.deaths === 3);
  // Fear fades slowly: after 10 game days about half of it is left, still remembered.
  const f0 = L.places.values().next().value!.fear;
  for (let h = 1; h <= 240; h++) { w.gameSec += 3600; L.update(); }
  const f1 = L.places.values().next().value!.fear;
  assert.ok(f1 < f0 * 0.6 && f1 > f0 * 0.35, `${f0} -> ${f1}`);
});

test('a killer is feared and a healer trusted; people do not stop to chat with someone the people fear', () => {
  const { w, e, people } = world('lore-b');
  const [a, b, c] = people as [number, number, number];
  w.emit('death', { id: e.id(b), cause: 'shot', by: e.id(a), map: 'town', x: 100, y: 100 });
  w.emit('heal', { id: e.id(c), who: e.id(people[3]!), hp: 80 });
  w.emit('heal', { id: e.id(c), who: e.id(people[4]!), hp: 80 });
  w.emit('heal', { id: e.id(c), who: e.id(people[3]!), hp: 80 });
  const x = people[5]!;
  w.profileOf(x)!.born = w.gameSec - 30 * w.yearSec;
  assert.equal(w.lore.distrusts(x, e.id(a)), true);
  assert.equal(w.lore.distrusts(x, e.id(c)), false);
  const t = w.lore.promptText(x);
  assert.match(t, new RegExp(`beware of ${w.profileOf(a)!.name} \\(killed ${w.profiles.get(e.id(b))!.name}\\)`));
  assert.match(t, new RegExp(`people to trust: ${w.profileOf(c)!.name}`));
  const info = w.lore.info() as { persons: { name: string }[]; living: unknown[] };
  assert.ok(info.persons.length >= 2 && info.living.length >= 5);
});
