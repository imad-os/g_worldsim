import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Kind } from '@worldsim/protocol';
import { Ai, AI_DEFAULTS } from '../ai/llm.js';
import { Planner } from '../ai/planner.js';
import { Logger } from '../log.js';
import { World } from '../sim/world.js';
import { scenario } from './helpers.js';

// imad 2026-11-27: "the prompts got very long, slow, timeouts ... make sure they will not make them dumb".
const run = (w: World, n: number) => { for (let k = 0; k < n; k++) w.step(); };
type Inner = { planPrompt(s: number[]): string; nothingToDecide(i: number, m: unknown): boolean };

function setup() {
  const w = new World(scenario(), { tickRate: 20, clockScale: 30, capacity: 2048, seed: 'lean-prompt' });
  w.populate(); w.land.setup(); run(w, 2);
  const log = new Logger('error');
  const p = new Planner(w, new Ai({ ...AI_DEFAULTS, provider: 'none' }, {}, log), log);
  const people: number[] = [];
  for (let j = 0; j < w.e.hi; j++) if (w.e.kind[j] === Kind.Agent) people.push(j);
  return { w, p, inner: p as unknown as Inner, people };
}

test('prompts: only goals that can work now, a reason for the rest, short enough', () => {
  const { w, p, inner, people } = setup();
  const [a, kid] = people as [number, number];
  // A child of 5 only lives: no work goals, and no AI call for them.
  w.profileOf(kid)!.born = w.gameSec - 5 * w.yearSec;
  const g = p.goalsFor(kid);
  assert.deepEqual(g.goals.filter((x) => / /.test(x) && !/\(/.test(x)), [], `no work for a 5-year-old: ${g.goals.join(', ')}`);
  assert.equal(inner.nothingToDecide(kid, p.mind(w.e.id(kid))), true, 'a small child is left to the built-in brain');
  // An adult with an axe is not offered another one; a goal that failed waits with its reason.
  w.profileOf(a)!.born = w.gameSec - 30 * w.yearSec;
  assert.ok(p.goalsFor(a).goals.includes('make an axe'));
  w.survival.add(a, 'axe', 1);
  assert.ok(!p.goalsFor(a).goals.includes('make an axe'), 'has an axe already');
  assert.ok(p.goalsFor(a).goals.includes('gather wood'));
  w.tasks.onEnd(w.e.id(a), { text: 'gather wood', from: 'myself', steps: [], k: 0, started: w.gameSec } as never, false, 'no trees left');
  const after = p.goalsFor(a);
  assert.ok(!after.goals.includes('gather wood') && after.cant.some((c) => /gather wood \(tried lately: no trees left\)/.test(c)), after.cant.join('; '));
  // The batch prompt: each person's own goals, the shared things once, no braces in the clan hint.
  const batch = people.slice(0, 5);
  const pr = inner.planPrompt(batch);
  assert.equal((pr.match(/^Goals now: /gm) ?? []).length, batch.length);
  assert.equal((pr.match(/Where materials come from/g) ?? []).length, 0, 'in the system prompt, not here');
  assert.equal((p.planSystem().match(/Where materials come from/g) ?? []).length, 1, 'said once');
  assert.ok(!/You may change clan|Past \d+ members|huts are dear/.test(pr), 'the world\'s rules are not repeated per person');
  assert.ok(!/\{"what"/.test(pr), 'the clan hint is plain words');
  assert.ok(pr.length < 10000, `5 people in ${pr.length} characters`);
  assert.ok(/^Weather: /m.test(pr), 'the weather (once on top when the same for all)');
  for (const i of batch) assert.match(pr, new RegExp(`Person: ${w.profileOf(i)!.name} `));
  // What a good decision needs is still there for each person.
  for (const k of ['Needs: hungry', 'health', 'Stats (0-10)', 'Family:', 'Has:', 'Near:', 'Memory:', 'Recent:']) assert.equal((pr.match(new RegExp(k.replace(/[()]/g, '\\$&'), 'g')) ?? []).length >= batch.length, true, k);
});

test('prompts: asleep at night or busy = asked later, but never past three plan intervals', () => {
  const { w, p, inner, people } = setup();
  const i = people[0]!, m = p.mind(w.e.id(i))!;
  w.profileOf(i)!.born = w.gameSec - 30 * w.yearSec;
  assert.equal(inner.nothingToDecide(i, m), false);
  m.task = { text: 'gather wood', from: 'myself', steps: [{ do: 'gather', what: 'wood' }], k: 0, started: w.gameSec } as never;
  m.lastPlan = w.gameSec - 4 * 3600;
  assert.equal(inner.nothingToDecide(i, m), true, 'busy with a task');
  m.urgent = true;
  assert.equal(inner.nothingToDecide(i, m), false, 'something big happened');
  m.urgent = false; m.lastPlan = w.gameSec - 10 * 3600;
  assert.equal(inner.nothingToDecide(i, m), false, 'too long without a plan');
});

test('prompts: a sentence everyone of the batch shares is said once above them, under its own label', async () => {
  const { hoist } = await import('../ai/planner.js');
  const order = 'The leader\'s order: "We have no water. Fill bottles and store them."';
  const b = [['Person: A (man)', `Clan: Ashfall, led by Hicham (elected). Your loyalty 40%. ${order}`, 'Weather: summer (day 1 of 3), clear sky, 20 degrees.', 'Has: 0 food, 1 axe and nothing else at all.'],
    ['Person: B (woman)', `Clan: Ashfall, led by Hicham (elected). Your loyalty 70%. ${order}`, 'Weather: summer (day 1 of 3), clear sky, 20 degrees.', 'Has: 0 food, 1 axe and nothing else at all.']];
  assert.deepEqual(hoist(b), [`Clan: Ashfall, led by Hicham (elected). ${order}`, 'Weather: summer (day 1 of 3), clear sky, 20 degrees.'], 'the quote is not cut in two');
  assert.deepEqual(b[0], ['Person: A (man)', 'Clan: Your loyalty 40%.', 'Has: 0 food, 1 axe and nothing else at all.'], 'personal lines stay, an emptied line goes');
  assert.deepEqual(hoist([b[1]!]), [], 'one person: nothing moves');
});
