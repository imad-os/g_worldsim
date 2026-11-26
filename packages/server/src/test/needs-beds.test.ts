import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Kind, EFlag } from '@worldsim/protocol';
import { scenario } from './helpers.js';
import { World } from '../sim/world.js';
import { Waypoints } from '../ops/waypoints.js';

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

/** Two adult agents of the town, married, and a hut the husband built (theirs). */
function couple(seed: string) {
  const w = mk(seed);
  w.populate(); w.land.setup();
  const e = w.e, town = w.mapIndex.get('town')!, sv = w.survival;
  for (let i = 0; i < e.hi; i++) if (e.kind[i] === Kind.Agent) w.place(i, town, 20, 20);
  w.step();
  const ag: number[] = [];
  for (let i = 0; i < e.hi; i++) if (e.kind[i] === Kind.Agent && !(e.flags[i]! & EFlag.Child)) ag.push(i);
  const [a, b] = ag as [number, number];
  const pa = w.profileOf(a)!, pb = w.profileOf(b)!;
  pa.born = pb.born = w.gameSec - 30 * w.yearSec; pa.sex = 'm'; pb.sex = 'f';
  for (const [p, q] of [[pa, pb], [pb, pa]] as const) { p.partner = e.id(q === pa ? a : b); p.parents = []; }
  const s = openSpot(w, town, 60, 60);
  w.place(a, town, s.x0 + 3.5, s.y0 + 9.5);
  sv.add(a, 'wood', 20); sv.add(a, 'stone', 10); sv.add(a, 'leather', 5);
  assert.equal(sv.placeAt(a, 'hut', s.x0, s.y0, 0), 'built');
  const h = sv.homes.homeOf(e.id(a))!;
  assert.ok(h && h.owner === e.id(a), 'the builder owns his hut');
  return { w, e, town, sv, a, b, h, s };
}

test('people know what their home holds: one bed per sleeper, made by one of the couple, never a fifth bed', () => {
  const { w, e, town, sv, a, b, h, s } = couple('beds-1');
  assert.equal(sv.homes.homeOf(e.id(b)), h, 'his wife lives there too');
  assert.equal(sv.homes.sleepers(h).length, 2);
  assert.equal(sv.homes.bedsMissing(h), 2);
  assert.equal(sv.homes.doer(h), e.id(a), 'the owner does it');
  assert.ok(sv.bedWanted(a)); assert.ok(!sv.bedWanted(b), 'not both of them');
  const goals = () => w.colony.goals(town, [a, b], 10).filter((g) => g.name === 'bed');
  assert.equal(goals().length, 1, 'one bed goal for the home');
  assert.equal(goals()[0]!.only, a);
  // Four beds already (imad: "he has 4 beds in his hut and gives himself a task to build a new one").
  const tm = w.maps[town]!.tiles, bed = sv.T.bed;
  tm.set(s.x0 + 1, s.y0 + 1, bed); tm.set(s.x0 + 2, s.y0 + 1, bed); tm.set(s.x0 + 3, s.y0 + 1, bed); tm.set(s.x0 + 1, s.y0 + 2, bed);
  assert.equal(sv.homes.bedsIn(h), 4);
  assert.equal(sv.homes.bedsMissing(h), 0);
  assert.equal(goals().length, 0, 'no bed goal for a full home');
  assert.ok(!sv.bedWanted(a));
  assert.match(sv.noNeed(a, 'bed'), /already has 4 beds/);
  assert.match(sv.homes.bedText(e.id(a)), /4 beds for 2 sleepers: enough/);
  // Asked to build one anyway: the task ends at once with the reason, no wood gathered for it.
  const ends: { ok: boolean; why: string }[] = [];
  w.listeners.push((ev) => { if (ev.kind === 'task' && ev.data.id === e.id(a)) ends.push(ev.data as never); });
  w.tasks.start(a, 'build a bed', 'owner', [{ do: 'build', what: 'bed' }]);
  for (let k = 0; k < 60 && w.profileOf(a)!.mind?.task; k++) w.step();
  assert.ok(!w.profileOf(a)!.mind?.task, 'the task ended');
  assert.equal(ends.length, 1);
  assert.equal(ends[0]!.ok, false);
  assert.match(ends[0]!.why, /already has 4 beds/, 'with the reason');
  assert.equal(w.survival.inv(a).wood ?? 0, 0, 'no wood gathered for it');
});

test('sleeping out is risky: with a hut on the map they walk home unless worn out or badly hurt and far', () => {
  const { w, e, a, h } = couple('beds-2');
  const c = w.survival.homes.middle(h);
  assert.ok(!w.brain.mayStayOut(a, 80), 'rested enough to walk 80 m home');
  e.tired[a] = 98;
  assert.ok(w.brain.mayStayOut(a, 80), 'worn out and far: no choice');
  assert.ok(!w.brain.mayStayOut(a, 30), 'worn out but close: home');
  e.tired[a] = 50; e.hp[a] = w.sc.agents.hp * 0.2;
  assert.ok(w.brain.mayStayOut(a, 50), 'badly hurt and far');
  e.hp[a] = w.sc.agents.hp;
  w.place(a, h.m, c.x, c.y);
  assert.ok(w.brain.sleepSafe(a), 'inside the hut = safe');
  w.place(a, h.m, c.x + 30, c.y + 30);
  assert.ok(!w.brain.sleepSafe(a), 'in the open = not safe');
});

test('a player alone gets lonely; people around keep the company bar up', () => {
  const w = mk('lonely');
  w.populate(); w.land.setup();
  const e = w.e, town = w.mapIndex.get('town')!;
  for (let i = 0; i < e.hi; i++) if (e.kind[i] === Kind.Agent) w.place(i, town, 20, 20);
  w.step();
  const pl = w.spawnPlayer(town, 120, 120);
  w.playerProfile(pl, 'imad');
  e.lonely[pl] = 0;
  for (let k = 0; k < 600; k++) w.step();
  const alone = e.lonely[pl]!;
  assert.ok(alone > 0.3, `lonely grows alone (${alone})`);
  w.place(pl, town, 20.5, 21);
  for (let i = 0; i < e.hi; i++) if (e.kind[i] === Kind.Agent) { e.flags[i] = e.flags[i]! & ~EFlag.Sleeping; }
  e.lonely[pl] = 50;
  for (let k = 0; k < 200; k++) { w.place(pl, town, 20.5, 21); w.step(); }
  assert.ok(w.brain.company(pl, 6) > 0 || e.lonely[pl]! < 50, 'someone near');
  assert.ok(e.lonely[pl]! < 50, `company lowers it (${e.lonely[pl]})`);
});

test('riding by yourself: the places worth riding to and a road home', () => {
  const { w, e, town, a, h } = couple('ride-dests');
  const pl = w.spawnPlayer(town, 30, 30);
  w.playerProfile(pl, 'imad');
  const marks = [{ id: 1, map: 'town', x: 90, y: 40, kind: 'mine' as const, label: 'rocks', at: 0 }];
  const wp = new Waypoints(w, () => marks);
  // My home: the couple's hut given to me for the test (I am the partner of nobody; make me its owner).
  h.owner = e.id(pl);
  const c = w.survival.homes.middle(h);
  w.place(pl, town, c.x + 1, c.y + 1);
  let ids = wp.dests('imad', pl).map((r) => r[0]);
  assert.ok(!ids.includes('home'), 'next to home: no "go home"');
  w.place(pl, town, 25, 25);
  ids = wp.dests('imad', pl).map((r) => r[0]);
  assert.ok(ids.includes('home'), 'far from home: ride home');
  assert.ok(ids.includes('mark:1'), 'a saved mark');
  const r = wp.route('imad', pl, 'home') as { code: string; pts: [number, number][] };
  assert.equal(r.code, 'route');
  const end = r.pts.at(-1)!;
  const W = w.maps[town]!.tiles.w, ox = (h.out % W) + 0.5, oy = Math.floor(h.out / W) + 0.5;
  assert.ok(Math.hypot(end[0] - ox, end[1] - oy) < 1.5, 'the road ends at home, in front of its door');
  const cp = wp.compass('imad', pl) as { places: (string | number)[][] };
  assert.ok(cp.places.some((p) => p[0] === 'home'), 'the compass shows home');
  assert.ok(cp.places.some((p) => p[0] === 'gate'), 'and the gates');
  void a;
});
