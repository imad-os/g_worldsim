import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Kind } from '@worldsim/protocol';
import { scenario } from './helpers.js';
import { World } from '../sim/world.js';
import { GROWN } from '../sim/homes.js';
import { CLAN_CAMP_AT } from '../sim/clans.js';

const mk = (seed: string) => new World(scenario(), { tickRate: 20, clockScale: 30, capacity: 2048, seed });
const tileId = (w: World, n: string) => w.sc.tiles.find((t) => t.name === n)!.id;
function openSpot(w: World, m: number, x: number, y: number): { x0: number; y0: number } {
  const tm = w.maps[m]!.tiles, G = tileId(w, 'grass'), D = tileId(w, 'dirt');
  for (let r = 0; r < 60; r++) for (let yy = y - r; yy <= y + r; yy++) for (let xx = x - r; xx <= x + r; xx++) {
    let ok = true;
    for (let j = -2; j < 11 && ok; j++) for (let i = -2; i < 9 && ok; i++) { const t = tm.inside(xx + i, yy + j) ? tm.get(xx + i, yy + j) : -1; if (t !== G && t !== D) ok = false; }
    if (ok && !w.land.inRing(m, xx, yy) && !w.portals.some((p) => p.from === m && Math.hypot(p.x - xx, p.y - yy) < 12)) return { x0: xx, y0: yy };
  }
  throw new Error('no open ground');
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const hourly = (w: World) => (w.clans as any).hourly();

test('society: children live in the parents\' hut, a grown son or daughter is shut out, told, and counted as needing a home', () => {
  const w = mk('soc-grown');
  w.populate(); w.land.setup();
  const e = w.e, town = w.mapIndex.get('town')!, sv = w.survival;
  for (let i = 0; i < e.hi; i++) if (e.kind[i] === Kind.Agent) w.place(i, town, 20, 20);
  w.step();
  const s = openSpot(w, town, 60, 60);
  const owner = w.spawnPlayer(town, s.x0 + 3.5, s.y0 + 8.5);
  w.playerProfile(owner, 'imad');
  sv.add(owner, 'wood', 20); sv.add(owner, 'stone', 10); sv.add(owner, 'leather', 5);
  assert.equal(sv.placeAt(owner, 'hut', s.x0, s.y0, 0), 'built');
  const h = sv.homes.homeOf(e.id(owner))!;
  const kid = w.spawnAgent(town, s.x0 + 3.5, s.y0 + 3.5), son = w.spawnAgent(town, s.x0 + 2.5, s.y0 + 3.5);
  for (const [i, age] of [[kid, 9], [son, GROWN + 2]] as const) { const p = w.profileOf(i)!; p.parents = [e.id(owner)]; p.partner = -1; p.born = w.gameSec - age * w.yearSec; }
  const k = (i: number) => Math.floor(e.y[i]!) * w.maps[town]!.tiles.w + Math.floor(e.x[i]!);
  assert.equal(sv.homes.mayEnter(kid, town, k(kid)), true, 'a child may go in');
  assert.equal(sv.homes.homeOf(e.id(kid)), h, 'and lives there');
  assert.equal(sv.homes.mayEnter(son, town, k(son)), false, 'a grown son may not');
  assert.equal(sv.homes.homeOf(e.id(son)), undefined, 'it is not his home any more');
  assert.ok(sv.homes.homeless(town).includes(e.id(son)), 'he is a household without a home (the camp plans a hut for him)');
  assert.equal(sv.homes.inside(kid, h), true, 'the child is in');
  sv.homes.hourly();
  const h2 = sv.homes.homeOf(e.id(owner))!; // homes are read again each hour
  assert.equal(sv.homes.inside(son, h2), false, 'he was put out in front of the door');
  assert.equal(sv.homes.inside(kid, h2), true, 'the child stays');
  assert.ok(w.profileOf(son)!.leftHome !== undefined);
  assert.match(w.profileOf(son)!.mind!.notes.at(-1)!.text, /grown up now.*build a hut of my own/);
  assert.match(sv.homes.describe(e.id(son)), /grown up.*Build a hut of your own/, 'every prompt about him says so');
  // Once he marries, his wife lives in HIS home, not with her parents.
  const sh = openSpot(w, town, s.x0 + 30, s.y0);
  w.place(son, town, sh.x0 + 3.5, sh.y0 + 9.5);
  sv.add(son, 'wood', 20); sv.add(son, 'stone', 10); sv.add(son, 'leather', 5);
  assert.equal(sv.placeAt(son, 'hut', sh.x0, sh.y0, 0), 'built');
  assert.ok(sv.homes.homeOf(e.id(son)) && sv.homes.homeOf(e.id(son))!.out !== h2.out, 'his own hut');
});

test('society: everyone chooses a clan (adults are taken in at the latest after half a day, children follow their parents)', () => {
  const w = mk('soc-clan');
  w.populate(); w.land.setup();
  const e = w.e, town = w.mapIndex.get('town')!;
  const people: number[] = [];
  for (let n = 0; n < 7; n++) { const i = w.spawnAgent(town, 40 + n, 40); people.push(i); }
  for (let i = 0; i < e.hi; i++) if (e.kind[i] === Kind.Agent) { w.place(i, town, 40 + (i % 9), 40 + Math.floor(i / 9)); const p = w.profileOf(i)!; p.born = w.gameSec - 30 * w.yearSec; p.parents = []; }
  const kid = people[0]!, mum = people[1]!;
  w.profileOf(kid)!.born = w.gameSec - 8 * w.yearSec; w.profileOf(kid)!.parents = [e.id(mum)];
  w.step();
  const agents = [...Array(e.hi).keys()].filter((i) => e.kind[i] === Kind.Agent && e.map[i] === town);
  // Nobody likes anyone: no join would happen by liking alone.
  for (const i of agents) { const p = w.profileOf(i)!; p.mind ??= { notes: [], summary: '', mood: 'calm', rel: {}, lastPlan: 0 }; for (const j of agents) if (j !== i) p.mind.rel['#' + e.id(j)] = -1; }
  hourly(w);
  assert.ok(w.clans.clans.some((c) => c.map === town), 'a clan was founded');
  for (let h = 0; h < 14; h++) { w.gameSec += 3600; hourly(w); }
  const none = agents.filter((i) => !w.clans.clanOf(e.id(i)));
  assert.deepEqual(none.map((i) => w.profileOf(i)!.name), [], 'everyone is in a clan');
  assert.equal(w.clans.clanOf(e.id(kid))?.id, w.clans.clanOf(e.id(mum))?.id, 'the child is in the mother\'s clan');
  assert.match(w.clans.promptText(agents[0]!), /Clan:/);
});

test(`society: a clan of more than ${CLAN_CAMP_AT} members gets a camp of its own and its members build their huts there`, () => {
  const w = mk('soc-camp');
  w.populate(); w.land.setup();
  const e = w.e, town = w.mapIndex.get('town')!, sv = w.survival;
  w.step();
  const tm = w.maps[town]!.tiles;
  const main = { x: tm.w / 2, y: tm.h / 2 };
  sv.camp[town] = main;
  const people: number[] = [];
  for (let n = 0; n < 26; n++) people.push(w.spawnAgent(town, main.x + (n % 6), main.y + Math.floor(n / 6)));
  for (const i of people) { const p = w.profileOf(i)!; p.born = w.gameSec - 30 * w.yearSec; p.parents = []; p.partner = -1; }
  const ids = people.map((i) => e.id(i));
  const small = w.clans.found(town, ids[0]!, ids.slice(1, 4));
  const big = w.clans.found(town, ids[4]!, ids.slice(5));
  sv.leader[town] = ids[0]!; // the camp leader's clan holds the map's camp
  assert.ok(big.members.length > CLAN_CAMP_AT);
  hourly(w);
  assert.ok(big.camp, 'the big clan has its own camp');
  assert.equal(small.camp, undefined, 'the clan of the first camp keeps it');
  const d = Math.hypot(big.camp!.x - main.x, big.camp!.y - main.y);
  assert.ok(d >= 45, `away from the first camp (${d.toFixed(0)} m)`);
  assert.match(w.clans.promptText(e.slot(ids[6]!)), /own camp at/);
  const builder = e.slot(ids[7]!);
  assert.deepEqual(sv.campFor(builder), { x: big.camp!.x, y: big.camp!.y });
  sv.add(builder, 'wood', 20); sv.add(builder, 'stone', 10); sv.add(builder, 'leather', 5);
  assert.equal(sv.build(builder, 'hut'), true);
  for (let k = 0; k < 20 * 600 && sv.busy(ids[7]!); k++) w.step();
  const home = sv.homes.homeOf(ids[7]!);
  assert.ok(home, 'the hut went up and is his');
  const c = sv.homes.middle(home!);
  assert.ok(Math.hypot(c.x - big.camp!.x, c.y - big.camp!.y) < 30, `the hut stands at the clan's camp (${Math.hypot(c.x - big.camp!.x, c.y - big.camp!.y).toFixed(0)} m)`);
});
