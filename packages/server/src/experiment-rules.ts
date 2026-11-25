import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { writeFileSync } from 'node:fs';
import { Kind } from '@worldsim/protocol';
import { loadScenario } from './sim/scenario.js';
import { World } from './sim/world.js';
import { compileRule } from './sim/rules.js';

/**
 * Rules experiment (research/EXPERIMENTS.md E8, imad 2026-11-25: "rules can be to do or to not do; it seems only the first
 * works"). The same world three ways for N game days, no LLM (the engine's own reading of the words):
 *   none  = no rule;
 *   must  = for everyone "you must hunt every day", and for one person "you never talk to <a misspelt name of B>";
 *   never = for everyone "never hunt".
 * Measured per person and game day: did they hunt (a kill), did the rule's task end done / failed (and why), and talks
 * between A and B. A day "kept" = that person made at least one kill that day.
 *
 *   node packages/server/dist/experiment-rules.js --days 3 --seeds r1,r2 [--out file]
 */
const ROOT = resolve(fileURLToPath(import.meta.url), '../../../..');
const arg = (k: string, d: string) => { const i = process.argv.indexOf('--' + k); return i > 0 ? process.argv[i + 1]! : d; };
const DAYS = Number(arg('days', '3')), SEEDS = arg('seeds', 'r1,r2').split(','), ARMS = arg('arms', 'none,must,never').split(','), OUT = arg('out', '');

function misspell(n: string): string { return n.length > 3 ? n.slice(0, 1) + n.slice(2, 3) + n.slice(1, 2) + n.slice(3) : n + 'e'; }

function runOnce(arm: string, seed: string) {
  const sc = loadScenario(resolve(ROOT, 'scenarios/post-apocalypse'));
  sc.agents.count = 5;
  const w = new World(sc, { tickRate: 20, clockScale: 30, capacity: 2048, seed });
  w.populate();
  w.land.setup();
  const e = w.e, nameOf = (n: string) => { for (const [id, p] of w.profiles) if (p.died === undefined && p.name.toLowerCase() === n.toLowerCase()) return id; return -1; };
  w.rules.resolve(nameOf);
  const ids = [...w.profiles.keys()].filter((id) => e.kind[e.slot(id)] === Kind.Agent);
  const A = ids[0]!, B = ids[1]!, pa = w.profiles.get(A)!, pb = w.profiles.get(B)!;
  const rules: string[] = [];
  if (arm === 'must') {
    w.rules.all = [compileRule(w, 'you must hunt every day', nameOf)];
    pa.rules = [compileRule(w, `you never talk to ${misspell(pb.name)}`, nameOf)];
    rules.push(`all: ${w.rules.all[0]!.text}`, `${pa.name}: ${pa.rules[0]!.text} (-> ${pa.rules[0]!.withName}, ${pa.rules[0]!.forbid.join('/')})`);
  } else if (arm === 'never') {
    w.rules.all = [compileRule(w, 'never hunt', nameOf)];
    rules.push(`all: ${w.rules.all[0]!.text} (${w.rules.all[0]!.forbid.join('/')})`);
  }
  const day = () => Math.floor((w.gameSec / 3600 + 8) / 24);
  const kills = new Map<string, number>(), done = new Map<string, number>(), failed: Record<string, number> = {};
  let talksAB = 0, started = 0;
  w.listeners.push((x) => {
    const d = x.data as Record<string, unknown>;
    if (x.kind === 'hunt' && typeof d.id === 'number' && d.id >= 0) kills.set(`${d.id}:${day()}`, (kills.get(`${d.id}:${day()}`) ?? 0) + 1);
    if (x.kind === 'rule' && d.did === 'started') started++;
    if (x.kind === 'rule' && d.did === 'done') done.set(`${d.id}:${day()}`, 1);
    if (x.kind === 'rule' && d.did === 'failed') failed[String(d.why)] = (failed[String(d.why)] ?? 0) + 1;
    if (x.kind === 'talk' && ((d.a === A && d.b === B) || (d.a === B && d.b === A))) talksAB++;
  });
  const d0 = day(), ticks = DAYS * 86400 / 30 * 20;
  for (let k = 0; k < ticks; k++) w.step();
  // Full days only: the first day (from 08:00) and every one after.
  const alive = ids.filter((id) => w.profiles.get(id)?.died === undefined);
  let keptDays = 0, ruleDays = 0, all = 0, totalKills = 0;
  for (const id of alive) for (let dd = d0; dd < d0 + DAYS; dd++) { all++; const n = kills.get(`${id}:${dd}`) ?? 0; totalKills += n; if (n) keptDays++; if (done.has(`${id}:${dd}`)) ruleDays++; }
  return { arm, seed, rules, people: alive.length, personDays: all, daysWithAKill: keptDays, daysRuleDone: ruleDays, kills: totalKills, tasksStarted: started, failed, talksAB };
}

const rows = [];
for (const arm of ARMS) for (const seed of SEEDS) {
  const r = runOnce(arm, seed);
  rows.push(r);
  console.log(JSON.stringify(r));
}
console.log('\narm    | person-days | days with a kill | kills | rule done days | A-B talks');
for (const arm of ARMS) {
  const g = rows.filter((r) => r.arm === arm), s = (k: 'personDays' | 'daysWithAKill' | 'kills' | 'daysRuleDone' | 'talksAB') => g.reduce((a, r) => a + r[k], 0);
  console.log(`${arm.padEnd(6)} | ${String(s('personDays')).padStart(11)} | ${String(s('daysWithAKill')).padStart(9)} (${Math.round(100 * s('daysWithAKill') / Math.max(1, s('personDays')))} %) | ${String(s('kills')).padStart(5)} | ${String(s('daysRuleDone')).padStart(14)} | ${s('talksAB')}`);
}
if (OUT) writeFileSync(OUT, JSON.stringify(rows, null, 2));
