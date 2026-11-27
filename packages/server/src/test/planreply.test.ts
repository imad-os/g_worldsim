import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Kind } from '@worldsim/protocol';
import { Ai, AI_DEFAULTS } from '../ai/llm.js';
import { Planner } from '../ai/planner.js';
import { Logger } from '../log.js';
import { World } from '../sim/world.js';
import { scenario } from './helpers.js';

// imad 2026-11-27: "the ai brain returns errors like 'no usable plan in the answer'" for answers a person would read fine.
test('planner: loose batch answers are read (talk to X, None, duplicates, strangers, numeric moods)', () => {
  const w = new World(scenario(), { tickRate: 20, clockScale: 30, capacity: 2048, seed: 'plan-reply' });
  w.populate(); w.land.setup(); w.step(); w.step();
  const log = new Logger('error');
  const p = new Planner(w, new Ai({ ...AI_DEFAULTS, provider: 'none' }, {}, log), log);
  const ids: number[] = [];
  for (let j = 0; j < w.e.hi; j++) if (w.e.kind[j] === Kind.Agent) ids.push(w.e.id(j));
  const [A, B, C, D] = ids as [number, number, number, number];
  const nm = (id: number) => w.profiles.get(id)!.name;
  const wishOf = (id: number) => p.mind(id)!.plan;
  // "talk to <name> " with "with": "none", the same person twice, a stranger, a goal copied with its brackets, numeric moods.
  const got = p.applyPlansN([A, B, C], [
    { name: nm(A), goal: `talk to ${nm(B)} `, with: 'none', mood: '+5' },
    { name: nm(A), goal: 'find food for the hut', with: 'none' },
    { name: 'Farah', goal: 'None', mood: 3 },
    { name: nm(B) + ' ', goal: `talk with ${nm(C)}`, with: nm(D) },
    { name: nm(C), goal: 'talk (say with whom)', with: nm(A) },
  ]);
  assert.equal(got.seen, 3);
  assert.equal(got.n, 3);
  assert.equal(wishOf(A)?.act, 'talk'); assert.equal(wishOf(A)?.with, B, 'the name in the goal');
  assert.equal(wishOf(B)?.with, C, 'the goal\'s name wins over "with"');
  assert.equal(wishOf(C)?.with, A);
  // Everyone says None: still an answer (they carry on), not an error.
  assert.deepEqual(p.applyPlansN([D], [{ name: nm(D), goal: 'None', with: 'none' }]), { n: 0, seen: 1 });
  // Close wordings.
  assert.equal(p.readGoal(D, 'get some water', '').goal, 'drink');
  assert.equal(p.readGoal(D, 'go hunting for deer', '').goal, 'go hunting');
  assert.equal(p.readGoal(D, 'find food', '').goal, 'forage');
  assert.equal(p.readGoal(D, 'help with most needed homes', '').goal, null);
  assert.equal(p.readGoal(D, `help ${nm(A)}`, '').goal, 'talk');
});
