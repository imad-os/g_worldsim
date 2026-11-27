import { test } from 'node:test';
import assert from 'node:assert/strict';
import { scenario } from './helpers.js';
import { World } from '../sim/world.js';
import { serialize, restore } from '../persist/snapshot.js';
import { Pathfinder } from '../sim/pathfind.js';

const mk = (seed: string) => new World(scenario(), { tickRate: 20, clockScale: 30, capacity: 2048, seed });
const run = (w: World, n: number) => { for (let k = 0; k < n; k++) w.step(); };

test('stables: every town map gets a fenced field with a stable and a gate, none in the wild; kept on restore', () => {
  const w = mk('stables-lay');
  w.populate();
  w.land.setup();
  for (const mp of w.maps) {
    const p = w.horses.stables.of(mp.index), wild = mp.def.gen.type === 'wilds';
    assert.equal(!!p, !wild, `${mp.def.id}: ${wild ? 'no stable in the wild' : 'a stable'}`);
    if (!p) continue;
    const tm = mp.tiles, T = (n: string) => w.sc.tiles.find((t) => t.name === n)!.id;
    // Fenced all round but the gate; a roofed straw floor inside; pasture elsewhere.
    let fence = 0, gaps = 0;
    for (let x = p.x0; x <= p.x1; x++) for (const y of [p.y0, p.y1]) { const t = tm.get(x, y); if (t === T('fence') || t === T('stablewall')) fence++; else gaps++; }
    for (let y = p.y0 + 1; y < p.y1; y++) for (const x of [p.x0, p.x1]) { const t = tm.get(x, y); if (t === T('fence') || t === T('stablewall')) fence++; else gaps++; }
    assert.equal(gaps, 2, `${mp.def.id}: a gate 2 tiles wide`);
    assert.ok((p.sx1 - p.sx0 + 1) * (p.sy1 - p.sy0 + 1) >= 24, 'stalls');
    // The gate leads somewhere: a path from the map's middle to inside the fence.
    const pf = new Pathfinder(tm, 60000, 256);
    assert.notEqual(pf.find(p.ox, p.oy, p.ix, p.iy), 'none', `${mp.def.id}: through the gate`);
  }
  const w2 = mk('stables-lay'); restore(w2, serialize(w)); w2.land.setup();
  const t = w.mapIndex.get('town')!;
  assert.deepEqual(w2.horses.stables.of(t), w.horses.stables.of(t), 'read back from the tiles, not laid again');
});

test('stables: a tamed horse left in town walks into its field after a few seconds, under the roof at night, and still comes when called', () => {
  const w = mk('stables-horse');
  w.populate();
  w.land.setup();
  run(w, 2);
  const m = w.mapIndex.get('town')!, p = w.horses.stables.of(m)!, e = w.e;
  // A player and their horse 40 m from the gate.
  const sx = p.ox + (p.ox > 96 ? -30 : 30), sy = p.oy;
  const pl = w.spawnPlayer(m, sx, sy);
  const a = w.horses.spawn(m, sx + 1.5, sy, { q: 0 });
  const h = w.horses.of(a)!;
  h.owner = e.id(pl);
  assert.equal(w.horses.mount(pl, a), 'mounted');
  assert.equal(w.horses.dismount(pl), 'dismounted');
  // The rider walks off; within a couple of real minutes the horse is inside the fence.
  w.setPos(pl, 40, 40); e.tx[pl] = 40; e.ty[pl] = 40;
  w.brain.hour = () => 12;
  let inAt = -1;
  for (let k = 0; k < 20 * 180 && inAt < 0; k++) { w.step(); if (w.horses.stables.inside(m, e.x[a]!, e.y[a]!)) inAt = k / 20; }
  assert.ok(inAt > 5 && inAt < 150, `in the field after ${inAt} s`);
  run(w, 20 * 60);
  assert.ok(w.horses.stables.inside(m, e.x[a]!, e.y[a]!), 'stays inside the fence');
  // Night: under the stable's roof.
  w.brain.hour = () => 23;
  let roofed = false;
  for (let k = 0; k < 20 * 240 && !roofed; k++) { w.step(); roofed = w.horses.stables.inStall(m, e.x[a]!, e.y[a]!); }
  assert.ok(roofed, 'in the stable at night');
  // Called from outside: out through the gate to its owner.
  w.brain.hour = () => 12;
  w.setPos(pl, p.ox + (p.ox > 96 ? -20 : 20), p.oy); e.tx[pl] = e.x[pl]!; e.ty[pl] = e.y[pl]!;
  const r = w.horses.playerAct(pl) as { code: string };
  assert.equal(r.code, 'called');
  let came = false;
  for (let k = 0; k < 20 * 150 && !came; k++) { w.step(); e.tx[pl] = e.x[pl]!; e.ty[pl] = e.y[pl]!; came = Math.hypot(e.x[a]! - e.x[pl]!, e.y[a]! - e.y[pl]!) < 3.5; }
  assert.ok(came, 'came out of the field when called');
});

