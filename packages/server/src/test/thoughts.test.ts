import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Kind } from '@worldsim/protocol';
import { World } from '../sim/world.js';
import { compileRule } from '../sim/rules.js';
import { Thoughts } from '../ops/thoughts.js';
import { scenario } from './helpers.js';

test('the Thoughts page groups people by what drives them, counts rule refusals and marks every change', () => {
  const sc = scenario(); sc.agents.count = 8;
  const w = new World(sc, { tickRate: 20, clockScale: 30, capacity: 2048, seed: 'thoughts-a' });
  w.populate(); w.land.setup(); w.step();
  const th = new Thoughts(w, (m) => w.maps[m]?.def.name ?? '');
  let people = 0; for (let i = 0; i < w.e.hi; i++) if (w.e.kind[i] === Kind.Agent) people++;
  const s0 = th.sample(0);
  assert.equal(s0.n, people);
  assert.equal(Object.values(s0.src).reduce((a, b) => a + b!, 0), people, 'everyone is in exactly one driver');
  // A rule that forbids sleeping: once people get tired it says no, and the page shows it.
  th.mark('owner', { cmd: 'rules', add: 'never sleep' });
  w.rules.all = [compileRule(w, 'never sleep', () => -1)];
  for (let i = 0; i < w.e.hi; i++) if (w.e.kind[i] === Kind.Agent) w.e.tired[i] = 95;
  for (let k = 0; k < 20 * 60; k++) w.step();
  const s1 = th.sample(60_000);
  assert.ok((w.rules.hits.get('never sleep') ?? 0) > 0, 'the rule held people back');
  assert.ok(s1.hits['never sleep']! > 0, 'counted in the sample');
  const info = th.info() as { groups: { n: number; src: string }[]; marks: { text: string }[]; rules: { text: string; hits: number; held: number; how: string }[]; series: unknown[] };
  assert.equal(info.groups.reduce((a, g) => a + g.n, 0), people);
  assert.match(info.marks[0]!.text, /New rule for everyone: "never sleep"/);
  const r = info.rules.find((x) => x.text === 'never sleep')!;
  assert.ok(r.hits > 0 && r.held > 0, JSON.stringify(r));
  assert.match(r.how, /blocks sleep/);
  assert.equal(info.series.length, 2);
  // No one is asleep: the rule really drove them.
  for (let i = 0; i < w.e.hi; i++) if (w.e.kind[i] === Kind.Agent) assert.notEqual(w.e.act[i], 5);
  // Knowledge passed in talks shows in the feed.
  w.emit('learned', { from: 1, to: 2, kind: 'place', what: 'water', text: 'Sami told Lina: water 40 m east', map: 0 });
  assert.equal((th.info() as { feed: { text: string }[] }).feed[0]!.text, 'Sami told Lina: water 40 m east');
});
