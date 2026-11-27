import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Kind, EFlag, Act } from '@worldsim/protocol';
import { scenario } from './helpers.js';
import { World } from '../sim/world.js';
import { serialize, restore } from '../persist/snapshot.js';

const HOUR = 3600;
const mk = (seed: string) => new World(scenario(), { tickRate: 20, clockScale: 30, capacity: 2048, seed });
const tileId = (w: World, n: string) => w.sc.tiles.find((t) => t.name === n)!.id;
/** Set the game clock to an hour of the current day (gameSec 0 = 08:00). */
const at = (w: World, hour: number) => { const d = Math.floor((w.gameSec + 8 * HOUR) / 86400); w.gameSec = d * 86400 + (hour - 8) * HOUR; };

/** An open patch of grass near (x, y) big enough for a hut and room round it. */
function openSpot(w: World, m: number, x: number, y: number): { x0: number; y0: number } {
  const tm = w.maps[m]!.tiles, G = tileId(w, 'grass'), D = tileId(w, 'dirt');
  for (let r = 0; r < 60; r++) for (let yy = y - r; yy <= y + r; yy++) for (let xx = x - r; xx <= x + r; xx++) {
    let ok = true;
    for (let j = -2; j < 13 && ok; j++) for (let i = -2; i < 9 && ok; i++) { const t = tm.inside(xx + i, yy + j) ? tm.get(xx + i, yy + j) : -1; if (t !== G && t !== D) ok = false; }
    if (ok && !w.land.inRing(m, xx, yy) && !w.portals.some((p) => p.from === m && Math.hypot(p.x - xx, p.y - yy) < 12)) return { x0: xx, y0: yy };
  }
  throw new Error('no open ground');
}

test('seasons and weather: a calendar of 4 seasons, warm summers, freezing winter nights, snow instead of rain, saved in snapshots', () => {
  const w = mk('wx-cal'), wx = w.weather;
  w.step();
  assert.equal(wx.season(), 0, 'a new world starts in spring');
  assert.ok(wx.temp(0) > 8, `late spring is mild (${wx.temp(0).toFixed(1)} °C)`);
  // Through a whole year: every season comes, summer is the warmest, winter the coldest.
  const means: number[][] = [[], [], [], []];
  const kinds = new Set<string>();
  const year = 4 * wx.cfg.seasonDays * 86400;
  for (let t = 0; t < year; t += HOUR) { w.gameSec = t; wx.update(); means[wx.season()]!.push(wx.temp(0)); kinds.add(wx.kind); }
  const avg = means.map((a) => a.reduce((x, y) => x + y, 0) / a.length);
  assert.ok(avg[1]! > avg[0]! && avg[1]! > avg[2]! && avg[3]! < avg[2]! && avg[3]! < avg[0]!, `summer warmest, winter coldest: ${avg.map((x) => x.toFixed(1)).join(' / ')}`);
  assert.ok(Math.min(...means[3]!) < 0, 'winter nights freeze');
  assert.ok(Math.min(...means[1]!) > 5, 'summer nights are never cold');
  assert.ok(kinds.size >= 4, `the sky changes: ${[...kinds].join(', ')}`);
  // Rain in the frost is snow.
  wx.jumpTo(3); at(w, 4); wx.set('rain', 0.01); w.gameSec += 60; wx.forced = 0; wx.until = w.gameSec + 3 * HOUR; wx.update();
  assert.equal(wx.season(), 3);
  if (wx.temp(0) < 1) assert.equal(wx.kind, 'snow', 'rain at ' + wx.temp(0).toFixed(1) + ' °C falls as snow');
  // Admin weather holds; the snapshot keeps the sky.
  wx.set('blizzard', 5, 0.9);
  const snap = serialize(w);
  const w2 = mk('wx-cal');
  w2.weather.cfg.shift = wx.cfg.shift; // the calendar's settings are the owner's (meta, not the snapshot)
  restore(w2, snap);
  assert.equal(w2.weather.kind, 'blizzard'); assert.equal(w2.weather.k, 0.9); assert.equal(w2.weather.forced, wx.forced);
  assert.ok(w2.weather.promptText(0).includes('blizzard') && /costs health/.test(w2.weather.promptText(0)), 'the people are told');
});

test('the cold: standing still under 5 °C costs health, moving does not; a fire stops it and heals faster, a hut and clothes soften it', () => {
  const w = mk('wx-cold');
  w.populate(); w.land.setup();
  const e = w.e, sv = w.survival, town = w.mapIndex.get('town')!, wx = w.weather;
  for (let i = 0; i < e.hi; i++) if (e.kind[i] === Kind.Agent) w.remove(i, 'admin-remove');
  w.step();
  wx.jumpTo(3); at(w, 3); wx.set('clear', 48); wx.update();
  const T = wx.temp(town);
  assert.ok(T < 0, `a winter night: ${T.toFixed(1)} °C`);
  const s = openSpot(w, town, 60, 60);
  const p = w.spawnPlayer(town, s.x0 + 2.5, s.y0 + 8.5);
  w.playerProfile(p, 'imad');
  e.hunger[p] = 10; e.thirst[p] = 10; e.hp[p] = 60;
  const open = wx.warmthAt(p, town, e.x[p]!, e.y[p]!);
  assert.equal(open.exposure, 1); assert.ok(Math.abs(open.drain - (5 - T) * 2) < 1e-6, 'fully exposed: (5 - T) x 2 an hour');
  // Standing still for a game hour in the open: health goes down.
  const hour = () => { const g = w.gameSec; while (w.gameSec < g + HOUR) w.step(); };
  hour();
  assert.ok(e.hp[p]! < 60, `still in the frost: ${e.hp[p]!.toFixed(1)} hp`);
  assert.ok(w.brain.chilled[p]! > 5);
  // Moving: no loss (the body makes heat), healing as usual.
  e.hp[p] = 60;
  const g0 = w.gameSec;
  let dir = 1;
  while (w.gameSec < g0 + HOUR) { if (w.tick % 60 === 0) dir = -dir; w.setInput(p, dir, 0, false); w.step(); }
  w.setInput(p, 0, 0, false);
  assert.ok(e.hp[p]! >= 60, `walking about: ${e.hp[p]!.toFixed(1)} hp`);
  // Clothes: the loss is 45 % smaller.
  sv.add(p, 'clothes', 1);
  assert.ok(Math.abs(wx.warmthAt(p, town, e.x[p]!, e.y[p]!).exposure - 0.55) < 1e-6, 'clothes keep 45 % off');
  sv.add(p, 'clothes', -1);
  // A hut: 80 % less; a bed in it, half the rest.
  sv.add(p, 'wood', 20); sv.add(p, 'stone', 10); sv.add(p, 'leather', 5);
  w.place(p, town, s.x0 + 2.5, s.y0 + 7.5);
  assert.equal(sv.placeAt(p, 'hut', s.x0, s.y0, 0), 'built');
  const inHut = wx.warmthAt(p, town, s.x0 + 2.5, s.y0 + 2.5);
  assert.ok(inHut.hut && Math.abs(inHut.exposure - 0.2) < 1e-6, 'a hut keeps 80 % of the cold off');
  // A campfire: no cold at all within 6 m, and wounds heal twice as fast.
  w.place(p, town, s.x0 + 2.5, s.y0 + 9.5);
  sv.add(p, 'campfire', 1);
  const fire = sv.placeAt(p, 'campfire', s.x0 + 2, s.y0 + 11);
  assert.ok(fire === 'placed' || fire === 'built', 'fire: ' + fire);
  w.place(p, town, s.x0 + 4.5, s.y0 + 11.5);
  const byFire = wx.warmth(p);
  assert.ok(byFire.fire && byFire.exposure === 0 && byFire.drain === 0, 'by the fire the cold cannot reach');
  e.hp[p] = 40; e.flags[p] = e.flags[p]! & ~EFlag.Sleeping;
  hour();
  const healedByFire = e.hp[p]! - 40;
  assert.ok(healedByFire > 35, `by a fire wounds heal fast: +${healedByFire.toFixed(1)}`);
  // Never below 5 for a player's character, however cold.
  w.place(p, town, s.x0 + 30.5, s.y0 + 30.5); e.hp[p] = 8;
  for (let k = 0; k < 3; k++) hour();
  assert.ok(e.hp[p]! >= 5, 'a player is hurt, never killed');
  // Switched off: no cold.
  wx.cfg.cold = false;
  assert.equal(wx.chill(p), 0);
});

test('a cold night: people sleep by the burning camp fire, not out in the frost; nobody freezes', () => {
  const w = mk('wx-night');
  w.populate(); w.land.setup();
  const e = w.e, sv = w.survival, town = w.mapIndex.get('town')!, wx = w.weather;
  w.step();
  const s = openSpot(w, town, 60, 60);
  const people: number[] = [];
  for (let i = 0; i < e.hi; i++) if (e.kind[i] === Kind.Agent) { people.push(i); w.place(i, town, s.x0 + 2 + (people.length % 3), s.y0 + 4 + (people.length % 2)); e.hunger[i] = 10; e.thirst[i] = 10; e.tired[i] = 70; }
  const lit = people[0]!;
  sv.add(lit, 'campfire', 1);
  w.place(lit, town, s.x0 + 2.5, s.y0 + 2.5);
  assert.ok(['placed', 'built'].includes(sv.placeAt(lit, 'campfire', s.x0 + 2, s.y0 + 4)), 'a camp fire');
  wx.jumpTo(3); at(w, 20); wx.set('snow', 24, 0.7); wx.update();
  assert.ok(wx.cold(town), `cold: ${wx.temp(town).toFixed(1)} °C`);
  const fireTile = sv.fireNear(town, s.x0 + 2.5, s.y0 + 4.5, 3);
  assert.ok(fireTile >= 0);
  const fuel = () => { const k = `${town}:${fireTile}`; sv.fires.set(k, Math.max(sv.fires.get(k)!, w.gameSec + 10 * HOUR)); };
  fuel(); // the clock was moved on to 20:00: the new fire has its fuel counted from now (else it reads as burnt down when they lie down)
  for (const i of people) { e.nextThink[i] = w.tick + 1; }
  let deaths = 0;
  w.listeners.push((ev) => { if (ev.kind === 'death' && ev.data.cause === 'cold') deaths++; });
  const g0 = w.gameSec;
  let asleepWarm = 0, asleep = 0;
  while (w.gameSec < g0 + 8 * HOUR) {
    w.step(); if (w.tick % 200 === 0) fuel();
    if (w.tick % 400 === 0) for (const i of people) if (e.alive(i) && e.kind[i] === Kind.Agent && e.act[i] === Act.Sleep && (e.flags[i]! & EFlag.Sleeping)) { asleep++; if (sv.warm(town, e.x[i]!, e.y[i]!) || sv.homes.at(town, Math.floor(e.y[i]!) * w.maps[town]!.tiles.w + Math.floor(e.x[i]!))) asleepWarm++; }
  }
  assert.equal(deaths, 0, 'nobody froze');
  assert.ok(asleep > 0, 'they slept');
  assert.ok(asleepWarm / asleep > 0.7, `asleep by the fire (or under a roof): ${asleepWarm} of ${asleep}`);
});

test('a camp is a cluster of huts: each new hut goes next to the others, a short lane apart', () => {
  const w = mk('wx-cluster');
  w.populate(); w.land.setup();
  const e = w.e, sv = w.survival, town = w.mapIndex.get('town')!, tm = w.maps[town]!.tiles;
  w.step();
  const s = { x0: 120, y0: 120 };
  // Open grass all round (the town's ruins and roads left out of it), so only the siting decides.
  const G = tileId(w, 'grass');
  for (let y = s.y0 - 24; y <= s.y0 + 24; y++) for (let x = s.x0 - 24; x <= s.x0 + 24; x++) tm.set(x, y, G);
  w.maps[town]!.phys.rebuildDirty();
  const b = [...Array(e.hi).keys()].find((i) => e.kind[i] === Kind.Agent)!;
  w.place(b, town, s.x0 + 2.5, s.y0 + 2.5);
  sv.add(b, 'campfire', 1);
  sv.placeAt(b, 'campfire', s.x0 + 2, s.y0 + 2); // the camp's middle
  const rects: { x0: number; y0: number }[] = [];
  for (let n = 0; n < 6; n++) {
    const h = sv.hutSite(town);
    assert.ok(h, 'room for hut ' + (n + 1));
    // Put it up at once (the walls a builder would make), so the next one sees it.
    for (let yy = 0; yy < 5; yy++) for (let xx = 0; xx < 5; xx++) {
      const edge = xx === 0 || yy === 0 || xx === 4 || yy === 4;
      tm.set(h.x0 + xx, h.y0 + yy, edge ? sv.T.woodwall : sv.T.floor);
    }
    const [dx, dy] = [[0, 1], [1, 0], [0, -1], [-1, 0]][h.dir]!;
    tm.set(h.x0 + 2 + dx * 2, h.y0 + 2 + dy * 2, sv.T.floor);
    sv.huts[town]!.push((h.y0 + 2 + dy * 3) * tm.w + h.x0 + 2 + dx * 3); sv.hutDir[town]!.push(h.dir);
    rects.push(h);
  }
  const gap = (a: { x0: number; y0: number }, c: { x0: number; y0: number }) => Math.max(Math.max(c.x0 - (a.x0 + 4), a.x0 - (c.x0 + 4)), Math.max(c.y0 - (a.y0 + 4), a.y0 - (c.y0 + 4))) - 1;
  for (const [n, r] of rects.entries()) {
    const near = Math.min(...rects.filter((_, k) => k !== n).map((c) => gap(r, c)));
    assert.ok(near <= 3, `hut ${n + 1} is ${near} tiles from its nearest neighbour`);
  }
  const c = sv.campOf(town)!;
  const far = Math.max(...rects.map((r) => Math.hypot(r.x0 + 2.5 - c.x, r.y0 + 2.5 - c.y)));
  assert.ok(far < 14, `the village is tight round the fire (farthest hut ${far.toFixed(1)} m)`);
});
