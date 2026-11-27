import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Kind, HOUSE_SIZE, HOUSE_NEED } from '@worldsim/protocol';
import { scenario } from './helpers.js';
import { World } from '../sim/world.js';
import { ageOf } from '../sim/people.js';

const mk = (seed: string) => new World(scenario(), { tickRate: 20, clockScale: 30, capacity: 2048, seed });
const tileId = (w: World, n: string) => w.sc.tiles.find((t) => t.name === n)!.id;

function openSpot(w: World, m: number, x: number, y: number, n: number): { x0: number; y0: number } {
  const tm = w.maps[m]!.tiles, G = tileId(w, 'grass'), D = tileId(w, 'dirt');
  for (let r = 0; r < 80; r++) for (let yy = y - r; yy <= y + r; yy++) for (let xx = x - r; xx <= x + r; xx++) {
    let ok = true;
    for (let j = -2; j < n + 4 && ok; j++) for (let i = -2; i < n + 2 && ok; i++) { const t = tm.inside(xx + i, yy + j) ? tm.get(xx + i, yy + j) : -1; if (t !== G && t !== D) ok = false; }
    if (ok && !w.land.inRing(m, xx, yy) && !w.portals.some((p) => p.from === m && Math.hypot(p.x - xx, p.y - yy) < 16)) return { x0: xx, y0: yy };
  }
  throw new Error('no open ground');
}

test('a big house is 9 x 9 with a 7 x 7 room, its own door, a home; pulled down it gives half back', () => {
  const w = mk('storage-1');
  w.populate(); w.land.setup();
  const e = w.e, town = w.mapIndex.get('town')!, sv = w.survival, T = sv.T, tm = w.maps[town]!.tiles, S = HOUSE_SIZE, H = (S - 1) >> 1;
  for (let i = 0; i < e.hi; i++) if (e.kind[i] === Kind.Agent) w.place(i, town, 20, 20);
  w.step();
  const s = openSpot(w, town, 60, 60, S);
  const pl = w.spawnPlayer(town, s.x0 + H + 0.5, s.y0 + S + 1.5);
  w.playerProfile(pl, 'imad');
  assert.equal(sv.placeAt(pl, 'house', s.x0, s.y0, 0), 'needHouse', 'not without the materials');
  for (const [k, n] of Object.entries(HOUSE_NEED)) sv.add(pl, k, n);
  assert.equal(sv.canPlace(pl, 'house', s.x0, s.y0, 0), '');
  assert.equal(sv.placeAt(pl, 'house', s.x0, s.y0, 0), 'built');
  assert.equal(tm.get(s.x0 + H, s.y0 + S - 1), T.door, 'door in the middle of the south wall');
  assert.equal(tm.get(s.x0 + S - 1, s.y0), T.woodwall, 'corner 9 tiles across');
  assert.equal(tm.get(s.x0 + S - 2, s.y0 + S - 2), T.floor, '7 x 7 room');
  assert.equal(tm.get(s.x0 + 1, s.y0 + 1), T.floor);
  for (const k of Object.keys(HOUSE_NEED)) assert.equal(sv.inv(pl)[k] ?? 0, 0, `${k} used`);
  const out = (s.y0 + S) * tm.w + s.x0 + H;
  assert.equal(sv.sizeOf(town, out, 0), S);
  sv.hutSz.clear();
  assert.equal(sv.sizeOf(town, out, 0), S, 'read back from its walls');
  const h = sv.homes.at(town, out - tm.w);
  assert.ok(h, 'a home');
  assert.equal(h!.owner, e.id(pl));
  const r = sv.hutRect(town, h!.out, h!.dir)!;
  assert.deepEqual([r.x0, r.y0, r.s], [s.x0, s.y0, S]);
  // A fridge goes on the far side of the room.
  sv.add(pl, 'fridge', 1);
  w.place(pl, town, s.x0 + 2.5, s.y0 + 3.5);
  assert.equal(sv.placeAt(pl, 'fridge', s.x0 + 1, s.y0 + 1), 'placed');
  // Pull it down: half of everything back (as piles: a player's hands are on the ground).
  w.place(pl, town, s.x0 + H + 0.5, s.y0 + S + 1.5);
  assert.equal(sv.destroyAt(pl, s.x0 + H, s.y0 + S - 1), 'destroyed');
  assert.notEqual(tm.get(s.x0 + S - 1, s.y0), T.woodwall, 'walls gone');
  assert.ok(!sv.homes.at(town, out - tm.w), 'no home left');
  const piles = sv.drops ? [...sv.drops.values()] : [];
  const got: Record<string, number> = {};
  for (const d of piles) got[d.what] = (got[d.what] ?? 0) + d.n;
  for (const [k, n] of Object.entries(HOUSE_NEED)) assert.equal((got[k] ?? 0) + (sv.inv(pl)[k] ?? 0), Math.floor(n / 2), `${k} half back`);
});

test('an AI person asked for a big house builds a 9 x 9 one', () => {
  const w = mk('storage-1');
  w.populate(); w.land.setup();
  const e = w.e, town = w.mapIndex.get('town')!, sv = w.survival, T = sv.T, tm = w.maps[town]!.tiles;
  w.step();
  let a = -1;
  for (let i = 0; i < e.hi; i++) if (e.kind[i] === Kind.Agent && ageOf(w.profiles.get(e.id(i))!, w.gameSec, w.yearSec) >= 18) { a = i; break; }
  assert.ok(a >= 0);
  for (const [k, n] of Object.entries(HOUSE_NEED)) sv.add(a, k, n);
  const r = sv.build(a, 'house');
  assert.equal(r, true, String(r));
  let built: { tx: number; ty: number; what: string } | null = null;
  w.listeners.push((ev) => { const d = ev as unknown as { kind?: string; type?: string; data?: Record<string, unknown> } & Record<string, unknown>; const dd = (d.data ?? d) as Record<string, unknown>; if ((d.kind ?? d.type) === 'build' && dd.id === e.id(a)) built = dd as never; });
  for (let n = 0; n < 20 * 60 * 20 && !built; n++) { e.hunger[a] = 0; e.thirst[a] = 0; e.tired[a] = 0; w.step(); }
  assert.ok(built, 'built');
  const b = built as unknown as { tx: number; ty: number; what: string };
  assert.equal(b.what, 'house');
  // (tx, ty) = the middle: walls 4 tiles out on every side.
  assert.equal(tm.get(b.tx - 4, b.ty - 4), T.woodwall);
  assert.equal(tm.get(b.tx + 3, b.ty + 3), T.floor);
});
