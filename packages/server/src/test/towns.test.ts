import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Kind } from '@worldsim/protocol';
import { scenario } from './helpers.js';
import { World } from '../sim/world.js';
import { seats } from '../sim/towns.js';

const mk = (seed: string) => new World(scenario(), { tickRate: 20, clockScale: 30, capacity: 2048, seed });
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const hourly = (w: World) => (w.territory as any).hourly();

function clanOf(n: number, seed: string) {
  const w = mk(seed);
  w.populate(); w.land.setup();
  const e = w.e, town = w.mapIndex.get('town')!;
  for (let i = 0; i < e.hi; i++) if (e.kind[i] === Kind.Agent) w.remove(i);
  w.step();
  const tm = w.maps[town]!.tiles, c0 = w.freeSpot(town, tm.w / 2, tm.h / 2, 60)!;
  w.survival.camp[town] = c0;
  const people: number[] = [];
  for (let k = 0; k < n; k++) { const s = w.freeSpot(town, c0.x + (k % 6) * 1.5 - 4, c0.y + 3 + Math.floor(k / 6) * 1.5, 80) ?? c0; people.push(w.spawnAgent(town, s.x, s.y)); }
  for (const i of people) { const p = w.profileOf(i)!; p.born = w.gameSec - 30 * w.yearSec; p.parents = []; p.partner = -1; }
  const ids = people.map((i) => e.id(i));
  const C = w.clans.found(town, ids[0]!, ids.slice(1));
  w.survival.leader[town] = ids[0]!;
  return { w, e, town, people, ids, C };
}

test('towns: seats by size', () => {
  assert.deepEqual([10, 11, 15, 16, 24, 25, 40].map(seats), [0, 1, 1, 2, 2, 3, 3]);
});

test('towns: no town at 10 members; past 10 the AI leader makes one and names a head of security, the bravest', () => {
  const small = clanOf(10, 'town-small');
  hourly(small.w);
  assert.equal(small.C.town, undefined, 'ten is not enough');
  const { w, people, ids, C } = clanOf(12, 'town-12');
  w.profileOf(people[5]!)!.traits.courage = 1; w.profileOf(people[5]!)!.traits.strength = 1;
  hourly(w);
  assert.ok(C.town, 'the camp is a town');
  assert.equal(w.towns.holder(C, 'security'), ids[5], 'the bravest and strongest heads security');
  assert.equal(w.towns.holder(C, 'resources'), -1, 'one seat at 12');
  assert.match(w.clans.promptText(people[5]!), /YOU are the head of security/);
  assert.match(w.clans.promptText(people[2]!), /TOWN with a government \(security: /);
});

test('towns: 26 members fill all three seats with three different people, never the leader', () => {
  const { w, ids, C } = clanOf(26, 'town-26');
  hourly(w);
  const h = (['security', 'resources', 'society'] as const).map((r) => w.towns.holder(C, r));
  assert.ok(h.every((x) => x >= 0), `three heads (${h.join(', ')})`);
  assert.equal(new Set(h).size, 3);
  assert.ok(!h.includes(ids[0]!), 'not the leader');
  // A head who leaves is replaced at the next hour.
  w.clans.leave(C, h[0]!, 'test');
  hourly(w);
  assert.ok(w.towns.holder(C, 'security') >= 0 && w.towns.holder(C, 'security') !== h[0]);
});
