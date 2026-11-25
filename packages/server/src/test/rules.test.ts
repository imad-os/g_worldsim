import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Kind } from '@worldsim/protocol';
import { World } from '../sim/world.js';
import { compileRule, classify, Rules, type Rule } from '../sim/rules.js';
import { scenario } from './helpers.js';

const world = (seed: string) => {
  const w = new World(scenario(), { tickRate: 20, clockScale: 30, capacity: 2048, seed });
  w.populate(); w.land.setup();
  const nameOf = (n: string) => { for (const [id, p] of w.profiles) if (p.died === undefined && p.name.toLowerCase() === n.toLowerCase()) return id; return -1; };
  w.rules.resolve(nameOf);
  return { w, nameOf, ids: [...w.profiles.keys()].filter((id) => w.e.kind[w.e.slot(id)] === Kind.Agent) };
};

test('rules both ways (imad 2026-11-25): "must" orders become work again every period, "never" rules block; misspelt names; panel words', () => {
  const { w, nameOf, ids } = world('rules2');
  const B = w.profiles.get(ids[1]!)!;
  const c = (t: string) => compileRule(w, t, nameOf);
  // Orders to DO, in 4 languages, with how often.
  const hunt = c('you must hunt every day');
  assert.equal(hunt.kind, 'goal'); assert.equal(hunt.goal, 'plan'); assert.equal(hunt.by, 'words');
  assert.deepEqual(hunt.forbid, []); assert.equal(hunt.plan![0]!.do, 'hunt'); assert.equal(hunt.every, 86400);
  assert.equal(c('tu dois chasser chaque jour').plan![0]!.do, 'hunt');
  assert.equal(c('debes cazar todos los días').plan![0]!.do, 'hunt');
  assert.equal(c('يجب أن تصطاد كل يوم').plan![0]!.do, 'hunt');
  const wood = c('chop wood every morning');
  assert.deepEqual([wood.plan![0]!.do, wood.plan![0]!.what, wood.every, wood.hours], ['gather', 'wood', 86400, [6, 11]]);
  assert.equal(c('farm twice a day').every, 43200);
  assert.equal(c('collect food every 6 hours').every, 6 * 3600);
  assert.equal(c('hunt 2 deer every day').plan![0]!.times, 2);
  assert.equal(c('hunt 2 deer every day').plan![0]!.what, 'deer');
  assert.equal(c('build a hut').every, 0, 'a hut is built once');
  assert.equal(c('never forget to hunt').kind, 'goal', '"never forget to" is an order to do');
  assert.equal(c('hunt every day for your family').plan![0]!.do, 'hunt', 'work words come before family words');
  assert.equal(c('you must get married').goal, 'marry', 'marriage goals as before');
  // Never rules: as before, and now hunting / taming too.
  assert.deepEqual(c('never hunt').forbid, ['hunt']);
  assert.equal(c('never hunt').kind, 'never');
  // A misspelt name finds the person; an unknown one blocks nothing (never "talk to nobody at all").
  const slip = B.name.slice(0, 1) + B.name.slice(2, 3) + B.name.slice(1, 2) + B.name.slice(3);
  const nt = c(`you never talk to ${slip}`);
  assert.equal(nt.kind, 'never'); assert.equal(nt.withName, B.name); assert.equal(nt.with, ids[1]);
  const ghost = c('you never talk to Zxqwert');
  assert.equal(ghost.withName, 'Zxqwert'); assert.equal(ghost.with, -1);
  const A = w.profiles.get(ids[0]!)!, ia = w.e.slot(ids[0]!), ib = w.e.slot(ids[1]!), ic = w.e.slot(ids[2]!);
  A.rules = [ghost];
  assert.equal(w.rules.forbidden(ia, 'talk', ic), null, 'a rule about someone not here blocks nobody');
  A.rules = [nt];
  assert.ok(w.rules.forbidden(ia, 'talk', ib)); assert.equal(w.rules.forbidden(ia, 'talk', ic), null);
  // Rules saved before: a "must" the model had turned into a "never", and a goal with no steps, are read again at start.
  const old1: Rule = { text: 'you must hunt every day', forbid: ['hunt', 'fight'], with: -1, kind: 'never', ai: true };
  const old2: Rule = { text: 'chop wood every day', forbid: [], with: -1, kind: 'goal' };
  w.rules.all = [old1, old2];
  w.rules.resolve(nameOf);
  assert.deepEqual([old1.kind, old1.goal, old1.forbid.length, old1.plan![0]!.do], ['goal', 'plan', 0, 'hunt']);
  assert.deepEqual([old2.goal, old2.plan![0]!.what], ['plan', 'wood']);
  // How it was understood, for the panel.
  assert.match(Rules.how(hunt), /must do: hunt, every game day/);
  assert.match(Rules.how(nt), new RegExp(`never: blocks talk.*with ${B.name} only`));
  assert.match(Rules.how(classify(ghost)), /nobody of that name here yet/);
});

test('a "must hunt every day" rule comes back every day, pushes their own work aside and is counted', () => {
  const { w, nameOf, ids } = world('rules3');
  const e = w.e;
  w.rules.all = [compileRule(w, 'you must hunt every day', nameOf)];
  const r = w.rules.all[0]!, i = e.slot(ids[0]!);
  // Their own work is pushed aside by the rule; an order of the owner is not.
  w.tasks.start(i, 'gather wood', 'myself', [{ do: 'gather', what: 'wood', times: 3 }]);
  w.rules.update();
  assert.equal((w.profileOf(i)!.mind!.task as { rule?: string }).rule, r.text);
  const j = e.slot(ids[1]!);
  w.tasks.start(j, 'come here', 'owner', [{ do: 'stay', minutes: 30 }]);
  w.rules.update();
  assert.equal(w.profileOf(j)!.mind!.task!.text, 'come here');
  // Done today = not due again until tomorrow.
  w.rules.ended(i, r.text, true, '');
  assert.equal(w.rules.due(i, r), false);
  assert.equal(w.rules.kept(r, [ids[0]!])[0]!.ok, 1);
  w.gameSec += 86400;
  assert.equal(w.rules.due(i, r), true, 'the next day it is due again');
  // In a run: every person hunts each game day (2 days).
  const kills = new Map<string, number>();
  const day = () => Math.floor((w.gameSec / 3600 + 8) / 24);
  w.listeners.push((x) => { const d = x.data as { id?: number }; if (x.kind === 'hunt' && (d.id ?? -1) >= 0) kills.set(`${d.id}:${day()}`, 1); });
  const d0 = day();
  for (let k = 0; k < 2 * 86400 / 30 * 20; k++) w.step();
  let kept = 0, n = 0;
  for (const id of ids) if (w.profiles.get(id)?.died === undefined) for (const dd of [d0, d0 + 1]) { n++; if (kills.has(`${id}:${dd}`)) kept++; }
  assert.ok(kept >= Math.ceil(n * 0.7), `days with a hunt: ${kept} / ${n}`);
});
