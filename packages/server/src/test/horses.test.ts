import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Kind } from '@worldsim/protocol';
import { scenario } from './helpers.js';
import { World } from '../sim/world.js';
import { HORSE, QUALITY } from '../sim/horses.js';
import { serialize, restore } from '../persist/snapshot.js';
import { NO_MAP } from '../sim/entities.js';

const mk = (seed: string) => new World(scenario(), { tickRate: 20, clockScale: 30, capacity: 2048, seed });
const woods = (w: World) => w.mapIndex.get('woods') ?? w.maps.findIndex((m) => m.def.gen.type === 'wilds');
const run = (w: World, n: number) => { for (let k = 0; k < n; k++) w.step(); };
const dist = (w: World, a: number, b: number) => Math.hypot(w.e.x[a]! - w.e.x[b]!, w.e.y[a]! - w.e.y[b]!);

test('horses: wild herds in the woods with stats by quality, kept together', () => {
  const w = mk('horse-herds');
  w.populate();
  run(w, 2);
  const m = woods(w);
  assert.ok(w.horses.count(m) >= 3, `a herd in the woods (${w.horses.count(m)})`);
  for (const [id, h] of w.horses.h) {
    const i = w.e.slot(id);
    assert.equal(w.e.kind[i], Kind.Animal); assert.equal(w.e.sub[i], HORSE);
    assert.ok(h.speed >= 5.6 && h.speed <= 9.5 && h.stamina >= 40 && h.stamina <= 140 && h.intel >= 0.2 && h.intel <= 1 && h.size >= 0.88 && h.size <= 1.2, JSON.stringify(h));
    assert.ok(QUALITY[h.q]);
    // The frame bits say horse + quality + coat.
    const look = w.horses.look(i);
    assert.equal(look & 7, HORSE); assert.equal((look >> 3) & 3, h.q); assert.equal(look >> 5, h.coat);
  }
  // Horses are not in the 5-animal mix the owner counts (and never picked as "any animal" to hunt).
  assert.equal(w.animals.count(m), w.animals.count(m, 0) + w.animals.count(m, 1) + w.animals.count(m, 2) + w.animals.count(m, 3) + w.animals.count(m, 4));
  // 3 game hours later they are still a herd: everyone within 30 m of the herd's middle.
  run(w, 20 * 60 * 6);
  for (const hd of w.horses.herds.values()) {
    const ms = [...w.horses.h].filter(([, h]) => h.herd === hd.id).map(([id]) => w.e.slot(id)).filter((s) => s >= 0);
    const cx = ms.reduce((a, s) => a + w.e.x[s]!, 0) / ms.length, cy = ms.reduce((a, s) => a + w.e.y[s]!, 0) / ms.length;
    for (const s of ms) assert.ok(Math.hypot(w.e.x[s]! - cx, w.e.y[s]! - cy) < 30, `herd ${hd.id} together`);
  }
});

test('horses: a zombie near the herd sends it galloping away; the alarm spreads', () => {
  const w = mk('horse-flight');
  w.populate();
  run(w, 2);
  const m = woods(w);
  const hd = [...w.horses.herds.values()].find((x) => x.map === m)!;
  const lead = w.e.slot(hd.lead);
  const z = w.zombies.spawn(m, w.e.x[lead]! + 5, w.e.y[lead]!, true);
  assert.ok(z >= 0);
  w.e.speed[z] = 0;
  const herd = () => [...w.horses.h].filter(([, h]) => h.herd === hd.id).map(([id]) => w.e.slot(id)).filter((s) => s >= 0);
  const far = () => { const ms = herd(); return ms.reduce((a, s) => a + dist(w, s, z), 0) / ms.length; };
  const before = far();
  let fled = 0, fast = 0;
  for (let k = 0; k < 20 * 4; k++) {
    w.step();
    w.e.tx[z] = w.e.x[z]!; w.e.ty[z] = w.e.y[z]!;
    for (const [, h] of w.horses.h) if (h.herd === hd.id && h.mode === 'flee') fled++;
    for (const s of herd()) fast = Math.max(fast, Math.hypot(w.e.vx[s]!, w.e.vy[s]!));
  }
  assert.ok(far() > before + 6, `the herd ran away (${before.toFixed(1)} -> ${far().toFixed(1)} m on average)`);
  assert.ok(fast > 4.5, `at a gallop (${fast.toFixed(1)} m/s)`);
  assert.ok(fled > 1, 'the herd ran too');
});

test('horses: taming depends on the person, trust grows with each try, then the owner rides it faster', () => {
  const w = mk('horse-tame');
  w.populate();
  run(w, 2);
  const m = woods(w);
  const [hid, h] = [...w.horses.h].find(([id]) => w.e.map[w.e.slot(id)] === m)!;
  const a = w.e.slot(hid);
  h.q = 0; h.intel = 0.3;
  const p = w.spawnAgent(m, w.e.x[a]! + 1.5, w.e.y[a]!);
  const brave = w.profileOf(p)!;
  brave.traits.courage = 0.9; brave.traits.intelligence = 0.9; brave.traits.speed = 0.8;
  const meek = w.spawnAgent(m, w.e.x[a]! - 1.5, w.e.y[a]!);
  const mp = w.profileOf(meek)!;
  mp.traits.courage = 0.1; mp.traits.intelligence = 0.1; mp.traits.speed = 0.1;
  assert.ok(w.horses.chance(p, h) > w.horses.chance(meek, h) + 0.3, `brave and smart tame better (${w.horses.chance(p, h).toFixed(2)} vs ${w.horses.chance(meek, h).toFixed(2)})`);
  // Harder for a legendary, clever horse.
  const legend = { ...h, q: 2, intel: 0.95 };
  assert.ok(w.horses.chance(p, legend) < w.horses.chance(p, h));
  // Try until tamed (each failure: more trust).
  let tries = 0, res = '';
  for (; tries < 30 && res !== 'tamed'; tries++) {
    const e = w.e;
    e.x[a] = e.x[p]! + 1.2; e.y[a] = e.y[p]!; w.bodies[a]?.setPosition({ x: e.x[a]!, y: e.y[a]! });
    const t0 = h.trust['#' + e.id(p)] ?? 0;
    const r = w.horses.tame(p, a);
    res = r.code;
    if (res === 'tameFail' || res === 'kicked') assert.ok((h.trust['#' + e.id(p)] ?? 0) > t0, 'trust grows');
    run(w, 60);
  }
  assert.equal(res, 'tamed', `tamed after ${tries} tries`);
  assert.equal(h.owner, w.e.id(p)); assert.equal(h.herd, -1);
  assert.ok(w.horses.owned(a));
  assert.ok(w.animals.nearest(m, w.e.x[a]!, w.e.y[a]!, 10, -1) !== a, 'nobody hunts a tamed horse');
  // Mount: the rider moves at the horse's pace.
  const e = w.e;
  if (w.horses.riding[p] === 1) w.horses.dismount(p); // the new owner may already be on it (they get on for any way of 10 m+)
  e.x[a] = e.x[p]! + 1; e.y[a] = e.y[p]!; w.bodies[a]?.setPosition({ x: e.x[a]!, y: e.y[a]! });
  assert.equal(w.horses.mount(p, a), 'mounted');
  assert.ok(w.horses.riding[p] === 1 && w.horses.riding[a] === 2);
  assert.ok(w.horses.rideSpeed(p, w.sc.agents.walk) > w.sc.agents.walk * 1.8, 'a trot is much faster than a walk');
  assert.ok(w.horses.rideSpeed(p, w.sc.agents.run) >= h.speed - 0.01 || h.sta <= 1, 'a gallop');
  run(w, 10);
  assert.ok(dist(w, a, p) < 0.01, 'the horse is under its rider');
  assert.equal(w.horses.dismount(p), 'dismounted');
  assert.ok(!w.horses.riding[p] && w.bodies[a], 'off, and the horse is back in the world');
  // Saved and loaded: the owner is kept.
  const w2 = mk('horse-tame');
  restore(w2, serialize(w));
  assert.equal(w2.horses.h.get(hid)?.owner, w.e.id(p));
  assert.equal(w2.horses.h.get(hid)?.name, h.name);
});

test('horses: a player tames and rides with one button; an agent tames by task and rides on a long walk', () => {
  const w = mk('horse-player');
  w.populate();
  run(w, 2);
  const m = woods(w);
  const [hid, h] = [...w.horses.h].find(([id]) => w.e.map[w.e.slot(id)] === m)!;
  const a = w.e.slot(hid), e = w.e;
  const pl = w.spawnPlayer(m, e.x[a]! + 1.5, e.y[a]!);
  w.playerProfile(pl, 'tester');
  const pr = w.profileOf(pl)!; pr.traits.courage = 1; pr.traits.intelligence = 1; pr.traits.speed = 1;
  let r: Record<string, unknown> = {};
  for (let k = 0; k < 40 && r.code !== 'tamed'; k++) {
    e.x[a] = e.x[pl]! + 1.2; e.y[a] = e.y[pl]!; w.bodies[a]?.setPosition({ x: e.x[a]!, y: e.y[a]! });
    r = w.horses.playerAct(pl);
    run(w, 60);
  }
  assert.equal(r.code, 'tamed');
  e.x[a] = e.x[pl]! + 1.2; e.y[a] = e.y[pl]!; w.bodies[a]?.setPosition({ x: e.x[a]!, y: e.y[a]! });
  assert.equal(w.horses.playerAct(pl).code, 'mounted');
  assert.ok(w.horses.rideOf(pl)!.walk > 2.5);
  // Riding east at a walk input: much farther than walking would go.
  // Riding at a walk input (the best of 4 ways, in case a tree is in the way): much farther than walking would go.
  let best = 0;
  for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]] as const) {
    const x0 = e.x[pl]!, y0 = e.y[pl]!;
    for (let k = 0; k < 30; k++) { w.setInput(pl, dx, dy, false); w.step(); }
    best = Math.max(best, Math.hypot(e.x[pl]! - x0, e.y[pl]! - y0));
  }
  w.setInput(pl, 0, 0, false);
  assert.ok(best > 1.35 * w.sc.agents.walk * 1.5, `trotted ${best.toFixed(1)} m in 1.5 s`);
  assert.equal(w.horses.playerAct(pl).code, 'dismounted');
  void h;
  // An agent with a knack for it goes and tames the nearest wild horse by itself (task "tame").
  const ag = w.spawnAgent(m, e.x[pl]! + 3, e.y[pl]!);
  const ap = w.profileOf(ag)!; ap.traits.courage = 1; ap.traits.intelligence = 1; ap.traits.speed = 1;
  w.horses.skill.set(e.id(ag), 1200); // a seasoned horse tamer
  assert.ok(w.tasks.start(ag, 'tame a horse', 'owner', [{ do: 'tame' }]));
  let got = false;
  for (let k = 0; k < 20 * 60 * 20 && !got; k++) { w.step(); got = w.horses.mine(ag).length > 0; e.hunger[ag] = 0; e.thirst[ag] = 0; e.tired[ag] = 0; }
  assert.ok(got, 'the agent tamed a horse');
  // Sent far away: they get on it.
  const hs = w.horses.mine(ag)[0]!;
  e.x[hs] = e.x[ag]! + 1; e.y[hs] = e.y[ag]!; w.bodies[hs]?.setPosition({ x: e.x[hs]!, y: e.y[hs]! });
  const mp = w.maps[m]!;
  let far: { x: number; y: number } | null = null;
  for (let t = 0; t < 80 && !far; t++) { const an = t * 0.7, d = 35 + (t % 4) * 6; const s = w.freeSpot(m, Math.max(15, Math.min(mp.def.w - 15, e.x[ag]! + Math.cos(an) * d)), Math.max(15, Math.min(mp.def.h - 15, e.y[ag]! + Math.sin(an) * d)), 40); if (s && w.brain.goTo(ag, s.x, s.y) && w.brain.goalDist(ag) > 28) far = s; }
  assert.ok(far, 'a place far off');
  w.brain.job(ag, far!.x, far!.y, far!.x + 1, far!.y, 11); // survival work over there
  let rode = false, off = false;
  for (let k = 0; k < 20 * 60 && !off; k++) { w.step(); const on = w.horses.riding[ag] === 1; rode ||= on; off = rode && !on; }
  assert.ok(rode, 'got on the horse for the long way');
  assert.ok(off && Math.hypot(e.x[ag]! - far!.x, e.y[ag]! - far!.y) < 3, 'got off there to work');
});

test('horses: a tamed horse lives on its own, comes when called from far (a real run, not from 10 m), and carries its rider through a gate in 5-15 s', () => {
  const w = mk('horse-call');
  w.populate();
  run(w, 2);
  const m = woods(w), e = w.e;
  const [hid, h] = [...w.horses.h].find(([id]) => e.map[e.slot(id)] === m)!;
  const a = e.slot(hid);
  const pl = w.spawnPlayer(m, e.x[a]! + 1.5, e.y[a]!);
  w.playerProfile(pl, 'rider');
  let r: Record<string, unknown> = {};
  for (let k = 0; k < 60 && r.code !== 'tamed'; k++) { // tame it (any way that works: trust grows with every try)
    e.x[a] = e.x[pl]! + 1.2; e.y[a] = e.y[pl]!; w.bodies[a]?.setPosition({ x: e.x[a]!, y: e.y[a]! });
    r = w.horses.playerAct(pl); run(w, 60);
  }
  assert.equal(r.code, 'tamed');
  // I walk off 40 m: it does not follow me, it stays round where it was.
  const hx = e.x[a]!, hy = e.y[a]!;
  const far = [[40, 0], [-40, 0], [0, 40], [0, -40]].map(([dx, dy]) => w.freeSpot(m, hx + dx!, hy + dy!, 40)).find((s) => s && Math.hypot(s.x - hx, s.y - hy) > 30)!;
  w.place(pl, m, far.x, far.y);
  run(w, 20 * 40);
  assert.ok(dist(w, a, pl) > 22, `it stayed (${dist(w, a, pl).toFixed(1)} m from me)`);
  assert.ok(Math.hypot(e.x[a]! - hx, e.y[a]! - hy) < 32, 'round its home');
  // Called: it runs over by itself (its own legs: it is never more than a few metres further on than a step before).
  const came: unknown[] = [];
  w.listeners.push((x) => { if (x.kind === 'horseCame') came.push(x.data); });
  assert.equal(w.horses.playerAct(pl).code, 'called');
  let jump = 0, px = e.x[a]!, py = e.y[a]!;
  for (let k = 0; k < 20 * 60 && !came.length; k++) { w.step(); jump = Math.max(jump, Math.hypot(e.x[a]! - px, e.y[a]! - py)); px = e.x[a]!; py = e.y[a]!; }
  assert.equal(came.length, 1, `it came (${dist(w, a, pl).toFixed(1)} m)`);
  assert.ok(dist(w, a, pl) < 3.6 && jump < 1, `next to me, no teleport (largest step ${jump.toFixed(2)} m)`);
  // Within 10 m it does not come: walk over to it.
  const near = [[7, 0], [-7, 0], [0, 7], [0, -7]].map(([dx, dy]) => w.freeSpot(m, e.x[a]! + dx!, e.y[a]! + dy!, 20)).find((s) => s && Math.hypot(s.x - e.x[a]!, s.y - e.y[a]!) > 4);
  if (near) w.place(pl, m, near.x, near.y);
  assert.ok(near && dist(w, a, pl) > 3.5 && dist(w, a, pl) <= 10, 'a few metres off');
  assert.equal(w.horses.playerAct(pl).code, 'walkOver');
  // Ride through a gate: the horse goes along, 5-15 real seconds.
  w.place(pl, m, e.x[a]! + 1.2, e.y[a]!);
  assert.equal(w.horses.playerAct(pl).code, 'mounted');
  const pi = w.portals.findIndex((p) => p.from === m), p = w.portals[pi]!;
  w.place(pl, m, p.x, p.y); e.stuck[pl] = 0;
  w.step();
  assert.equal(e.map[pl], NO_MAP, 'on the road');
  const secs = (e.arrive[pl]! - w.gameSec) / w.opt.clockScale;
  assert.ok(secs >= 4.9 && secs <= 15.1, `ride ${secs.toFixed(1)} s`);
  assert.ok(Math.abs(secs - w.horses.gateSecs(pi)) < 0.2, 'that gate\'s own time');
  run(w, Math.ceil(16 * 20));
  assert.equal(e.map[pl], p.dest, 'arrived');
  assert.equal(e.map[a], p.dest, 'the horse came too');
  assert.equal(w.horses.riding[pl], 1, 'still on its back');
  assert.ok(h.owner === e.id(pl));
});
