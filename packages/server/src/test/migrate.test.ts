import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Kind } from '@worldsim/protocol';
import { scenario } from './helpers.js';
import { World } from '../sim/world.js';

/** imad 2026-11-27: "encourage them to spread over the maps ... aware when resources get less because of a lot of people; make it rare". */
test('migrate: a crowded town short of food knows it, and now and then a household moves to a better place for good', () => {
  const sc = scenario();
  sc.agents.count = 22;
  const w = new World(sc, { tickRate: 20, clockScale: 30, capacity: 4096, seed: 'migrate-a' });
  w.populate(); w.land.setup(); w.step();
  const e = w.e, town = w.mapIndex.get('town')!, woods = w.mapIndex.get('woods')!;
  w.wild = (m: number) => false && m >= 0; // the woods stand in for a second town here (the real new maps come from the scenario)
  for (let i = 0; i < e.hi; i++) if (e.kind[i] === Kind.Agent && e.map[i] !== town) w.place(i, town, 128 + (i % 10), 128 + ((i / 10) | 0));
  w.travelOpen = true; w.land.block(false);
  const moved: number[] = [], settled: number[] = [];
  w.listeners.push((ev) => { if (process.env.DBG && (ev.kind === 'migrate' || (ev.kind === 'task' && String(ev.data.text).startsWith('move')))) console.log(ev.kind, JSON.stringify(ev.data), ((w.gameSec / 3600 + 8) % 24).toFixed(1)); if (ev.kind === 'migrate') moved.push(...(ev.data.ids as number[])); if (ev.kind === 'settled') settled.push(Number(ev.data.id)); });
  const strip = () => { for (let i = 0; i < e.hi; i++) if (e.kind[i] === Kind.Item && e.map[i] === town && e.sub[i]! < 100) w.remove(i, 'gone'); const st = w.survival.stash[town]; if (st) st.food = 0; };
  strip();
  w.migrate.count();
  const p = w.migrate.press[town]!;
  assert.ok(p.score >= 0.6, `the town is under strain: ${JSON.stringify(p)}`);
  assert.equal(w.migrate.better(town), woods);
  const someone = [...Array(e.hi).keys()].find((i) => e.kind[i] === Kind.Agent && e.map[i] === town)!;
  assert.match(w.migrate.promptText(someone), /under strain/);
  const end = w.gameSec + 5 * 86400;
  while (w.gameSec < end && settled.length === 0) { w.step(); if (w.tick % 2000 === 0) strip(); }
  assert.ok(moved.length >= 1 && moved.length <= 2, `one household moved: ${moved.length}`);
  assert.ok(settled.length >= 1, 'they arrived and settled');
  const j = e.slot(settled[0]!);
  assert.equal(e.map[j], woods);
  assert.ok(w.migrate.stats.moves <= 3, 'rare');
});
