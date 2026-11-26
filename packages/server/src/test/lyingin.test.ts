import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Kind, HUT_SIZE } from '@worldsim/protocol';
import { scenario } from './helpers.js';
import { World } from '../sim/world.js';
import { ageOf } from '../sim/people.js';

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

/** A couple with a hut (and a fridge in it) on the town map; the mother is about to give birth. */
function family(seed: string) {
  const w = mk(seed);
  w.populate(); w.land.setup();
  const e = w.e, town = w.mapIndex.get('town')!, sv = w.survival, y = w.life.yearSec;
  for (let i = 0; i < e.hi; i++) if (e.kind[i] === Kind.Agent) w.place(i, town, 20, 20);
  w.step();
  const adults: number[] = [];
  for (let i = 0; i < e.hi; i++) if (e.kind[i] === Kind.Agent && ageOf(w.profileOf(i)!, w.gameSec, y) > 20 && ageOf(w.profileOf(i)!, w.gameSec, y) < 40) adults.push(i);
  const mi = adults[0]!, fi = adults[1]!, mum = w.profileOf(mi)!, dad = w.profileOf(fi)!;
  mum.sex = 'f'; dad.sex = 'm'; mum.partner = e.id(fi); dad.partner = e.id(mi);
  const s = openSpot(w, town, 60, 60), H = (HUT_SIZE - 1) >> 1;
  w.place(fi, town, s.x0 + H + 0.5, s.y0 + HUT_SIZE + 1.5);
  sv.add(fi, 'wood', 20); sv.add(fi, 'stone', 10); sv.add(fi, 'leather', 5); sv.add(fi, 'fridge', 1);
  assert.equal(sv.placeAt(fi, 'hut', s.x0, s.y0, 0), 'built');
  const h = sv.homes.homeOf(e.id(fi))!;
  assert.ok(h, 'the father owns the hut');
  assert.equal(sv.homes.homeOf(e.id(mi)), h, 'his wife lives there too');
  w.place(fi, town, s.x0 + H + 0.5, s.y0 + H + 0.5);
  assert.equal(sv.placeAt(fi, 'fridge', s.x0 + 1, s.y0 + 1), 'placed');
  const fk = sv.boxIn(h, 'fridge');
  assert.ok(fk >= 0);
  for (const i of [mi, fi]) { e.hunger[i] = 10; e.thirst[i] = 10; e.tired[i] = 10; }
  return { w, e, sv, town, mi, fi, mum, dad, h, fk };
}

test('expecting: how far along the pregnancy is, 0-100 %', () => {
  const { w, mum, dad } = family('lyingin-pct');
  const len = 0.75 * w.life.yearSec;
  mum.pregnant = { father: w.e.id(w.e.slot(mum.partner)), due: w.gameSec + len / 2 };
  assert.equal(w.life.pregnancyPct(mum), 50);
  mum.pregnant.due = w.gameSec + len;
  assert.equal(w.life.pregnancyPct(mum), 0);
  mum.pregnant.due = w.gameSec - 10;
  assert.equal(w.life.pregnancyPct(mum), 100);
  void dad;
});

test('after a birth the mother stays home a week (out only when urgent) and the father fills the fridge', () => {
  const { w, e, sv, mi, fi, mum, h, fk } = family('lyingin-1');
  const mid = e.id(mi), fid = e.id(fi);
  const events: string[] = [];
  let fridgeIn = 0;
  w.listeners.push((ev) => {
    const d = ev.data as Record<string, unknown>;
    if (ev.kind === 'lyingIn' && d.id === mid) events.push('lyingIn');
    if (ev.kind === 'care' && d.what === 'fridge' && d.id === fid) events.push('fatherFridge');
    if (ev.kind === 'store' && d.box === 'fridge' && d.id === fid) fridgeIn += Number(d.n);
  });
  mum.pregnant = { father: fid, due: w.gameSec + 5 };
  // Give her a job first: the birth puts it aside.
  w.tasks.start(mi, 'gather wood', 'myself', [{ do: 'gather', what: 'wood', times: 3 }]);
  for (let k = 0; k < 3000 && !mum.lyingIn; k++) w.step();
  assert.ok(mum.lyingIn, 'a birth starts her week at home');
  assert.ok(events.includes('lyingIn'));
  assert.equal(mum.mind?.task, undefined, 'her work was put aside');
  assert.ok(w.family.lyingIn(mi));
  assert.equal(w.tasks.start(mi, 'go hunting', 'myself', [{ do: 'hunt' }]), false, 'no new work this week');
  assert.ok(w.tasks.start(mi, 'the owner wants this', 'the voice from the sky', [{ do: 'rest' }]), "the owner's own order still counts");
  w.tasks.stop(mi);
  // Half a game day: she keeps indoors (counted after her first game hour, to give her time to get home).
  const t0 = w.gameSec;
  let inside = 0, n = 0, outUrgent = 0;
  for (let k = 0; k < 43200 / 30 * 20; k++) {
    w.step();
    if (k % 100 === 0 && w.gameSec - t0 > 3600 && e.slot(mid) === mi) {
      n++;
      if (sv.homes.inside(mi, sv.homes.homeOf(mid)!)) inside++; // (homes are re-read now and then: ask again)
      else if (w.family.urgentOut(mi) || e.act[mi] === 9 /* flee */) outUrgent++;
      const task = (w.profileOf(mi)?.mind as { task?: { from: string; text: string } } | undefined)?.task;
      assert.ok(!task || task.from === 'the voice from the sky', `no errands (${task?.text})`);
      if (process.env.DEBUG_LYING && n % 20 === 1) console.log(Math.round((w.gameSec - t0) / 360) / 10, 'h', e.act[mi], e.x[mi]!.toFixed(1), e.y[mi]!.toFixed(1), 'home', JSON.stringify(sv.homes.middle(h)), 'th', e.thirst[mi]!.toFixed(0), e.hunger[mi]!.toFixed(0), w.family.lyingInHome(mi) ? 'H' : '-', w.brain.stayHome(mi), w.brain.orderOf(mi).kind);
    }
  }
  assert.ok(inside / n > 0.8, `at home most of the time (${inside}/${n}, ${outUrgent} urgent)`);
  assert.ok(events.includes('fatherFridge'), `the father was sent to fill the fridge (${events.join(',')})`);
  assert.ok(fridgeIn > 0, `the father put food / water in the fridge (${fridgeIn}; now ${JSON.stringify(sv.box(h.m, fk))})`);
  assert.equal(e.slot(mum.lyingIn!.baby) >= 0, true, 'the baby is alive');
  // The week ends.
  mum.lyingIn!.until = w.gameSec + 1;
  for (let k = 0; k < 40; k++) w.step();
  assert.equal(w.family.lyingIn(mi), false);
  assert.equal(mum.lyingIn, undefined);
});

test('a player next to a bed may lie down in it (their home\'s bed)', () => {
  const w = mk('lyingin-bed');
  w.populate(); w.land.setup();
  const e = w.e, town = w.mapIndex.get('town')!, sv = w.survival;
  for (let i = 0; i < e.hi; i++) if (e.kind[i] === Kind.Agent) w.place(i, town, 20, 20);
  w.step();
  const s = openSpot(w, town, 60, 60), H = (HUT_SIZE - 1) >> 1;
  const pl = w.spawnPlayer(town, s.x0 + H + 0.5, s.y0 + HUT_SIZE + 1.5);
  w.playerProfile(pl, 'imad');
  sv.add(pl, 'wood', 20); sv.add(pl, 'stone', 10); sv.add(pl, 'leather', 5); sv.add(pl, 'bed', 1);
  assert.equal(sv.placeAt(pl, 'hut', s.x0, s.y0, 0), 'built');
  w.place(pl, town, s.x0 + H + 0.5, s.y0 + H + 0.5);
  assert.equal(sv.placeAt(pl, 'bed', s.x0 + 1, s.y0 + 2), 'placed');
  w.place(pl, town, s.x0 + 2.5, s.y0 + 2.5);
  const b = sv.bedNear(pl, 1.8);
  assert.equal(b, (s.y0 + 2) * w.maps[town]!.tiles.w + s.x0 + 1, 'the bed next to me');
  w.place(pl, town, s.x0 + H + 0.5, s.y0 + HUT_SIZE + 3.5);
  assert.equal(sv.bedNear(pl, 1.8), -1, 'none from outside the hut');
});
