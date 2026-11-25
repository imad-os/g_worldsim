import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Kind } from '@worldsim/protocol';
import { World } from '../sim/world.js';
import { askedWork, countIn } from '../ai/planner.js';
import { scenario } from './helpers.js';

/** imad 2026-11-25: "told a person to hunt 3 animals, a minute later it was marked done but he did not hunt" (and many more like it). */
function one(seed: string) {
  const w = new World(scenario(), { tickRate: 20, clockScale: 10, capacity: 1024, seed });
  w.populate();
  const e = w.e;
  let i = -1;
  for (let j = 0; j < e.hi; j++) if (e.kind[j] === Kind.Agent) { i = j; break; }
  const ends: { ok: boolean; why: string }[] = [];
  w.listeners.push((ev) => { if (ev.kind === 'task' && ev.data.id === e.id(i)) ends.push({ ok: !!ev.data.ok, why: String(ev.data.why ?? '') }); });
  const run = (n = 40) => { for (let k = 0; k < n * 20; k++) w.step(); };
  return { w, e, i, id: e.id(i), ends, run };
}

test('the count in the words reaches the step: "hunt 3 animals" = 3 kills', () => {
  assert.equal(countIn('Go hunt 3 animals'), 3);
  assert.equal(countIn('chasse deux lapins'), 2);
  assert.equal(countIn('اصطد ثلاثة أرانب'), 3);
  assert.equal(countIn('make an axe'), 0);
  assert.equal(askedWork('Go hunt 3 animals')!.steps[0]!.times, 3);
  assert.equal(askedWork('gather 6 wood')!.steps[0]!.times, 6);
  assert.equal(askedWork('Build a wall around the camp')!.steps[0]!.what, 'palisade', 'a wall is a wall, not a campfire');
});

test('a hunt for 3 is done only after 3 kills of its own, not after one or an old one', () => {
  const { w, e, i, id, ends, run } = one('proof-hunt');
  w.emit('hunt', { id, animal: 'rabbit' }); // a kill from before the order does not count
  const sv = w.survival as unknown as { hunt: (i: number, what: string) => true | string };
  const br = w.brain as unknown as { huntOf: (i: number) => number };
  let chasing = false, chases = 0;
  sv.hunt = () => { chases++; chasing = true; return true; };
  br.huntOf = () => (chasing ? 1 : -1);
  /** The chase going on ends: with a kill of theirs (or of someone else's), or none. */
  const endChase = (killer: number | null) => { if (killer !== null) w.emit('hunt', { id: killer, animal: 'rabbit' }); chasing = false; run(3); };
  w.tasks.start(i, 'hunt 3 animals', 'owner', [{ do: 'hunt', times: 3 }]);
  run(3);
  endChase(id);
  assert.equal(ends.length, 0, 'one kill of three: still on it ' + JSON.stringify(ends));
  endChase(e.id((i + 1) % e.hi)); // someone else's kill: an escape for them
  endChase(id);
  assert.equal(ends.length, 0, 'two kills of three');
  endChase(id);
  assert.deepEqual(ends.map((x) => x.ok), [true]);
  assert.equal(chases, 4);
});

test('a step that ends without its outcome fails with the reason instead of "done"', () => {
  const { w, i, ends, run, id } = one('proof-tend');
  const sv = w.survival as unknown as { tend: (i: number) => true | string; busy: (id: number) => boolean; ended: Map<number, true | string> };
  w.survival.inv(i).wood = 3;
  sv.tend = () => true; sv.busy = () => false; // the job "ends" at once, no wood ever goes on a fire
  w.tasks.start(i, 'keep the fire going', 'owner', [{ do: 'tend' }]);
  run(5);
  assert.equal(ends.length, 1);
  assert.equal(ends[0]!.ok, false);
  assert.match(ends[0]!.why, /did not manage to tend/);
  // With the real outcome (a tend event of theirs) it is done.
  sv.tend = () => { w.emit('tend', { id, map: 'town' }); return true; };
  w.tasks.start(i, 'keep the fire going', 'owner', [{ do: 'tend' }]);
  run(5);
  assert.equal(ends.length, 2);
  assert.equal(ends[1]!.ok, true);
  // An open-ended action that never happened (drink, no water reached in an hour) is not done either.
  void sv.ended;
});
