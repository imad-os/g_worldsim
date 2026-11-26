import { test } from 'node:test';
import assert from 'node:assert/strict';
import { runSiege } from '../experiment-siege.js';

/**
 * imad 2026-11-26: "a population of 20 people attacked by 20 zombies, simulate a whole game day: they need to survive it easily;
 * the kids protected by their parents". One night attack on the camp (research/EXPERIMENTS.md E9 has the full matrix).
 */
test('20 people (8 of them children) against 20 zombies at night: they rally at the fire, the children live', () => {
  const r = runSiege('siege-g', 21, 'camp');
  assert.equal(r.people, 20);
  assert.equal(r.zombies, 20);
  assert.equal(r.kidsDied, 0, `children killed: ${JSON.stringify(r.deaths)}`);
  assert.ok(r.died <= 1, `deaths: ${JSON.stringify(r.deaths)}`);
  assert.ok(r.lowHp <= 4, `${r.lowHp} people fell below 30 hp`);
  assert.ok((r.fed.father ?? 0) > 0, `fathers feed their children too (${JSON.stringify(r.fed)})`);
});
