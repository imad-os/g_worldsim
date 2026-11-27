import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Act, Kind } from '@worldsim/protocol';
import { scenario } from './helpers.js';
import { World } from '../sim/world.js';
import { ageOf } from '../sim/people.js';

// imad 2026-11-27: "I couldn't treat Zoe: they walked away." The patient waits for the one treating them; the treatment goes through.
test('heal: the patient goes on until the healer is beside them, then they speak, the patient holds still and is treated', () => {
  const w = new World(scenario(), { tickRate: 20, clockScale: 30, capacity: 2048, seed: 'heal-wait' });
  w.populate(); w.land.setup(); w.step();
  w.gameSec = Math.ceil(w.gameSec / 86400) * 86400 + 2 * 3600; // 10:00
  const e = w.e, town = w.mapIndex.get('town')!;
  const ad = [...Array(e.hi).keys()].filter((i) => e.kind[i] === Kind.Agent && e.map[i] === town && ageOf(w.profileOf(i)!, w.gameSec, w.yearSec) >= 18);
  const [h, p] = ad as [number, number];
  for (const i of [h, p]) { e.thirst[i] = 10; e.hunger[i] = 10; e.tired[i] = 10; }
  // The patient is 20 m off and on the move: sent somewhere 60 m away.
  w.tasks.stop(h); w.tasks.stop(p);
  w.place(p, e.map[h]!, e.x[h]! + 20, e.y[h]!);
  e.hp[p] = 40;
  w.brain.order(p, 'goto', -1, -1, 600);
  w.brain.goTo(p, e.x[p]! + 60, e.y[p]!);
  for (let k = 0; k < 10; k++) w.step();
  let healed: Record<string, unknown> | null = null, met = -1;
  const said: string[] = [];
  w.speak = (i, text) => { if (i === h || i === p) said.push(text); }; // the app wires this to the planner's lines
  w.listeners.push((ev) => {
    if (ev.kind === 'heal' && ev.data.who === e.id(p)) healed = ev.data;
    if (ev.kind === 'healMeet' && ev.data.who === e.id(p)) met = w.tick;
  });
  assert.equal(w.survival.heal(h, e.id(p)), true);
  let waited = 0, heldEarly = 0, movedEarly = 0;
  for (let k = 0; k < 4000 && !healed; k++) {
    const x0 = e.x[p]!, y0 = e.y[p]!;
    w.step();
    e.hp[p] = Math.min(e.hp[p]!, 40); // still hurt until treated
    const far = Math.hypot(e.x[h]! - e.x[p]!, e.y[h]! - e.y[p]!) > 8;
    if (met < 0 && far) { if (w.survival.healerOf(e.id(p)) >= 0) heldEarly++; if (Math.hypot(e.x[p]! - x0, e.y[p]! - y0) > 0.01) movedEarly++; }
    if (w.survival.healerOf(e.id(p)) >= 0 && e.act[p] === Act.Rest) waited++;
  }
  assert.ok(healed, `treated (ended: ${String(w.survival.ended.get(e.id(h)) ?? '')})`);
  assert.equal(heldEarly, 0, 'not held still while the healer is still far');
  assert.ok(movedEarly > 0, 'the patient went on with their own day before the healer came');
  assert.ok(met >= 0, 'they met (handshake)');
  assert.ok(said.some((t) => /hold still/i.test(t)) && said.some((t) => /thank you/i.test(t)), `words exchanged: ${said.join(' | ')}`);
  assert.ok(waited > 0, 'the patient held still for the treatment');
});
