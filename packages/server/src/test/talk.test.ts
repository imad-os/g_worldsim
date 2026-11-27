import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Act, EFlag, Kind } from '@worldsim/protocol';
import { scenario } from './helpers.js';
import { World } from '../sim/world.js';
import { ageOf } from '../sim/people.js';

const mk = (seed: string) => new World(scenario(), { tickRate: 20, clockScale: 30, capacity: 2048, seed });
const adults = (w: World, m: number) => [...Array(w.e.hi).keys()].filter((i) => w.e.kind[i] === Kind.Agent && w.e.map[i] === m && ageOf(w.profileOf(i)!, w.gameSec, w.yearSec) >= 18);
const at = (w: World, hour: number) => { w.gameSec = Math.ceil(w.gameSec / 86400) * 86400 + (hour - 8) * 3600; };

test('talk: a talk passes what one knows and the other does not (danger, a place, news), with real lines', () => {
  const w = mk('talk-pass');
  w.populate(); w.land.setup(); w.step();
  const e = w.e, town = w.mapIndex.get('town')!, [a, b] = adults(w, town) as [number, number];
  const A = e.id(a), B = e.id(b);
  at(w, 10);
  w.aware.sights.clear();
  w.aware.see(A, 'zombie', town, e.x[a]! + 30, e.y[a]!, 0, -1, 2);
  w.memory.place(A, 'ore', town, 40, 40);
  w.talk.seed(A, 'death:999', 'Old Tom died (hunger)', 8);
  const lines: string[] = [], learned: string[] = [];
  w.talk.onLine = (_t, _f, _to, text) => lines.push(text);
  w.listeners.push((ev) => { if (ev.kind === 'learned' && ev.data.to === B) learned.push(String(ev.data.kind)); });
  w.emit('talk', { a: A, b: B, map: 'town' });
  assert.ok(w.aware.of(B).some((s) => s.k === 'zombie' && s.hop === 1 && s.from === A), 'B knows of the zombies, told by A');
  assert.ok(learned.includes('danger'), 'a danger was passed');
  assert.ok(lines.length >= 2 && lines.some((l) => /zombie/.test(l)), `real lines: ${lines.join(' | ')}`);
  assert.ok(w.talk.last.n >= 2);
  // A second talk passes the next things (the place, the news) since B knows the zombies now.
  w.emit('talk', { a: A, b: B, map: 'town' });
  assert.ok(w.memory.places(B, 'ore').length > 0 || w.talk.knowsNews(B, 'death:999'), 'more knowledge passed');
});

test('talk: no good places for an enemy clan, and a third-hand story is a rumour', () => {
  const w = mk('talk-foe');
  w.populate(); w.land.setup(); w.step();
  const e = w.e, town = w.mapIndex.get('town')!, [a, b, c] = adults(w, town) as [number, number, number];
  const A = e.id(a), B = e.id(b), C = e.id(c);
  at(w, 10);
  w.memory.place(A, 'ore', town, 50, 50);
  const enemies = w.clans.enemies.bind(w.clans);
  w.clans.enemies = (x: number, y: number) => ((x === A && y === B) || (x === B && y === A) ? true : enemies(x, y));
  w.emit('talk', { a: A, b: B, map: 'town' });
  assert.equal(w.memory.places(B, 'ore').some((p) => p.x === 50 && p.y === 50), false, 'the enemy is not told');
  w.clans.enemies = enemies;
  w.aware.sights.clear();
  w.aware.see(A, 'wolf', town, 60, 60, 0, -1);
  w.emit('talk', { a: A, b: B, map: 'town' }); // B heard it from A (hop 1)
  w.emit('talk', { a: B, b: C, map: 'town' }); // C heard it from B (hop 2: a rumour)
  const s = w.aware.of(C).find((x) => x.k === 'wolf');
  assert.ok(s, 'the wolf story reached C');
  assert.equal(s!.hop, 2);
});

test('talk: a starving listener gets a share of food; two free adults agree to work together', () => {
  const w = mk('talk-pact');
  w.populate(); w.land.setup(); w.step();
  const e = w.e, town = w.mapIndex.get('town')!, [a, b] = adults(w, town) as [number, number];
  const A = e.id(a), B = e.id(b);
  at(w, 10);
  w.profileOf(a)!.traits.empathy = 0.9;
  e.carry[a] = 3; e.carry[b] = 0; e.hunger[b] = 80; e.hunger[a] = 10;
  w.emit('talk', { a: A, b: B, map: 'town' });
  assert.equal(e.carry[b], 1, 'B got food');
  // A pact: the camp is short of wood (store with 0), both free and fed; try a few talks (it is a chance).
  e.hunger[b] = 10;
  w.survival.stash[town] = { t: 0, food: 0, wood: 0, stone: 0, scrap: 0 };
  let pact: Record<string, unknown> | null = null;
  w.listeners.push((ev) => { if (ev.kind === 'pact') pact = ev.data; });
  for (let k = 0; k < 30 && !pact; k++) {
    for (const i of [a, b]) { w.tasks.stop(i); (w.talk as unknown as { pactAt: Map<number, number> }).pactAt.clear(); }
    w.emit('talk', { a: A, b: B, map: 'town' });
  }
  assert.ok(pact, 'they agreed on a joint plan');
  assert.ok(w.profileOf(a)!.mind!.task && w.profileOf(b)!.mind!.task, 'both have the task');
  assert.match(w.profileOf(a)!.mind!.task!.text, /with/);
});

test('rhythm: rested in the middle of the night, people sleep on until morning; a need still wakes them', () => {
  const w = mk('talk-night');
  w.populate(); w.land.setup(); w.step();
  const e = w.e, town = w.mapIndex.get('town')!, [a] = adults(w, town) as [number];
  at(w, 2);
  w.brain.order(a, 'stop', -1, -1, 0);
  e.act[a] = Act.Sleep; e.flags[a] = e.flags[a]! | EFlag.Sleeping; e.tired[a] = 0; e.thirst[a] = 10; e.hunger[a] = 10;
  const end = w.gameSec + 2 * 3600;
  while (w.gameSec < end) { w.step(); e.thirst[a] = Math.min(e.thirst[a]!, 40); e.hunger[a] = Math.min(e.hunger[a]!, 40); }
  assert.equal(e.act[a], Act.Sleep, 'still asleep at 4 am');
  assert.equal(w.why(a)?.src, 'need');
  e.thirst[a] = 95;
  for (let k = 0; k < 400 && e.act[a] === Act.Sleep; k++) w.step();
  assert.notEqual(e.act[a], Act.Sleep, 'thirst woke them');
});
