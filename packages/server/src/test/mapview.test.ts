import { test } from 'node:test';
import assert from 'node:assert/strict';
import { HUT_NEED, type MapMark } from '@worldsim/protocol';
import { scenario } from './helpers.js';
import { World } from '../sim/world.js';
import { MapView } from '../ops/mapview.js';

const mk = (seed: string) => new World(scenario(), { tickRate: 20, clockScale: 30, capacity: 2048, seed });
const tileId = (w: World, n: string) => w.sc.tiles.find((t) => t.name === n)!.id;
function meta(): { getMeta(k: string): string | undefined; setMeta(k: string, v: string): void; delMeta(k: string): void; m: Map<string, string> } {
  const m = new Map<string, string>();
  return { m, getMeta: (k) => m.get(k), setMeta: (k, v) => { m.set(k, v); }, delMeta: (k) => { m.delete(k); } };
}
function openSpot(w: World, m: number, x: number, y: number): { x0: number; y0: number } {
  const tm = w.maps[m]!.tiles, G = tileId(w, 'grass'), D = tileId(w, 'dirt');
  for (let r = 0; r < 60; r++) for (let yy = y - r; yy <= y + r; yy++) for (let xx = x - r; xx <= x + r; xx++) {
    let ok = true;
    for (let j = -2; j < 9 && ok; j++) for (let i = -2; i < 7 && ok; i++) { const t = tm.inside(xx + i, yy + j) ? tm.get(xx + i, yy + j) : -1; if (t !== G && t !== D) ok = false; }
    if (ok && !w.land.inRing(m, xx, yy) && !w.portals.some((p) => p.from === m && Math.hypot(p.x - xx, p.y - yy) < 12)) return { x0: xx, y0: yy };
  }
  throw new Error('no open ground');
}

test('the TV map: tiles once, places (my home, every hut, gates, teachers), and my own marks kept by name', () => {
  const w = mk('mapview');
  w.populate(); w.land.setup(); w.quests.setup();
  const town = w.mapIndex.get('town')!, sv = w.survival, db = meta();
  const s = openSpot(w, town, 60, 60);
  const pl = w.spawnPlayer(town, s.x0 + 2.5, s.y0 + 7.5);
  w.playerProfile(pl, 'imad');
  for (const [k, n] of Object.entries(HUT_NEED)) sv.add(pl, k as never, (n ?? 0) + 2);
  assert.equal(sv.placeAt(pl, 'hut', s.x0, s.y0, 0), 'built');
  const mine = w.horses.spawn(town, s.x0 + 12, s.y0 + 3, { owner: w.e.id(pl) }), wildH = w.horses.spawn(town, s.x0 + 20, s.y0 + 3);
  assert.ok(mine >= 0 && wildH >= 0);
  const mv = new MapView(w, db);
  mv.planner = () => [['imad', pl]];
  const v = mv.view('imad', pl, '') as { map: { id: string; w: number; h: number; tiles?: Uint8Array }; places: { home: number[] | null; huts: number[][]; portals: unknown[]; npcs: unknown[] }; me: number[] | null };
  assert.equal(v.map.id, 'town');
  assert.equal(v.map.tiles!.length, v.map.w * v.map.h);
  assert.ok(v.places.home, 'my hut is my home on the map');
  assert.ok(v.places.huts.some((h) => h[2] === 1), 'every hut is listed, mine marked as mine');
  assert.ok(v.places.portals.length > 0 && v.places.npcs.length > 0);
  const pl2 = v.places as unknown as { horses: [number, number, string][]; wild: [number, number, number][] };
  assert.equal(pl2.horses.length, 1, 'my horse is on the map, with its name');
  assert.ok(pl2.horses[0]![2] && Math.abs(pl2.horses[0]![0] - w.e.x[mine]!) < 0.2);
  assert.ok(pl2.wild.some(([x]) => Math.abs(x - w.e.x[wildH]!) < 0.2), 'wild horses too');
  assert.ok(v.me && Math.abs(v.me[0]! - (s.x0 + 2.5)) < 0.2);
  const live = mv.view('imad', pl, 'town:live') as { map: { tiles?: unknown } };
  assert.equal(live.map.tiles, undefined, 'live = places only');

  // Marks: add, rename, change the icon, remove; bad ones refused; kept by name (any case) in the meta store.
  const a = mv.mark('imad', 'add:town:40.25:50:mine:Iron: north') as { ok: boolean; code: string; id: number; marks: MapMark[] };
  assert.equal(a.code, 'marked');
  assert.deepEqual([a.marks[0]!.x, a.marks[0]!.y, a.marks[0]!.kind, a.marks[0]!.label], [40.3, 50, 'mine', 'Iron: north']);
  assert.equal((mv.mark('imad', 'add:town:1:1:castle') as { code: string }).code, 'markBad');
  assert.equal((mv.mark('imad', 'add:nowhere:1:1:home') as { code: string }).code, 'markBad');
  mv.mark('imad', `name:${a.id}:Rocks`); mv.mark('imad', `kind:${a.id}:hunt`);
  assert.deepEqual(mv.marks('IMAD').map((m) => [m.kind, m.label]), [['hunt', 'Rocks']]);
  assert.ok(db.m.has('marks:imad'));
  for (let k = 0; k < 70; k++) mv.mark('imad', `add:town:${k}:${k}:star`);
  assert.equal(mv.marks('imad').length, 60, 'at most 60');
  assert.equal((mv.mark('imad', 'add:town:2:2:star') as { code: string }).code, 'markFull');
  mv.merge('imad', 'imad2');
  assert.equal(mv.marks('imad').length, 0); assert.equal(mv.marks('imad2').length, 60);
  assert.equal((mv.mark('imad2', `del:${mv.marks('imad2')[0]!.id}`) as { code: string }).code, 'unmarked');
  assert.equal(mv.marks('imad2').length, 59);
  mv.forget('imad2');
  assert.equal(db.m.has('marks:imad2'), false);
});
