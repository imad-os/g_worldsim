import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Act, Kind } from '@worldsim/protocol';
import { loadScenario } from './sim/scenario.js';
import { World, type AiFlags } from './sim/world.js';

/**
 * Defence experiment (research/EXPERIMENTS.md E7): after a morning in town (a camp, work under way), a threat appears 5 m from
 * each person in turn: one zombie, a group of three, a wolf, a bear. 90 game seconds later: did they fight or run, did
 * friends come, did they live, how much health was lost, how many attackers died. Everyone's health is reset between trials.
 *
 *   node packages/server/dist/experiment-defence.js --arms old,new --seeds a,b,c
 */
const ROOT = resolve(fileURLToPath(import.meta.url), '../../../..');
const arg = (k: string, d: string) => { const i = process.argv.indexOf('--' + k); return i > 0 ? process.argv[i + 1]! : d; };
const SEEDS = arg('seeds', 'def-a,def-b,def-c').split(','), ARMS = arg('arms', 'old,new').split(','), MODES = arg('modes', 'zombie,horde,wolf,bear').split(',');
const ALL: (keyof AiFlags)[] = ['goap', 'learn', 'siting', 'instinct'];
const flagsOf = (arm: string) => { const on = arm === 'new' ? ALL : arm === 'old' ? [] : arm.split('+'); const f = {} as AiFlags; for (const k of ALL) f[k] = on.includes(k); return f; };

export function runDefence(arm: string, seed: string, mode: string) {
  const sc = loadScenario(resolve(ROOT, 'scenarios/post-apocalypse'));
  sc.agents.count = 5;
  const w = new World(sc, { tickRate: 20, clockScale: 10, capacity: 2048, seed, ai: flagsOf(arm) });
  w.populate();
  w.land.setup();
  for (let k = 0; k < (10 * 3600) / 10 * 20; k++) w.step();
  const e = w.e, people: number[] = [];
  for (let i = 0; i < e.hi; i++) if (e.kind[i] === Kind.Agent) people.push(e.id(i));
  const r = { trials: 0, fought: 0, fled: 0, none: 0, died: 0, hpLost: 0, foesKilled: 0, foes: 0, helpers: 0, alarms: 0 };
  let alarms = 0;
  w.listeners.push((ev) => { if (ev.kind === 'alarm') alarms++; });
  for (const id of people) {
    const i = e.slot(id);
    if (i < 0) continue;
    for (const pid of people) { const j = e.slot(pid); if (j >= 0) { e.hp[j] = w.sc.agents.hp; } }
    r.trials++;
    const a = w.rng.next() * 6.28, hp0 = e.hp[i]!;
    const n = mode === 'horde' ? 3 : 1, ids: number[] = [];
    for (let q = 0; q < n; q++) {
      const x = e.x[i]! + Math.cos(a + q * 0.5) * 5, y = e.y[i]! + Math.sin(a + q * 0.5) * 5;
      const f = mode === 'bear' ? w.animals.spawn(e.map[i]!, x, y, 4) : mode === 'wolf' ? w.animals.spawn(e.map[i]!, x, y, 3) : w.zombies.spawn(e.map[i]!, x, y, true);
      if (f >= 0) { ids.push(e.id(f)); if (mode === 'wolf' || mode === 'bear') { w.animals.angry.set(e.id(f), id); } }
    }
    let fought = false, fled = false;
    const helped = new Set<number>();
    for (let k = 0; k < 20 * 90; k++) {
      w.step();
      const s = e.slot(id);
      if (s < 0) break;
      if (e.act[s] === Act.Fight) fought = true;
      if (e.act[s] === Act.Flee) fled = true;
      for (const pid of people) { const j = e.slot(pid); if (j >= 0 && pid !== id && e.act[j] === Act.Fight && ids.includes(e.target[j]!)) helped.add(pid); }
      if (ids.every((f) => e.slot(f) < 0)) break;
    }
    const s = e.slot(id);
    r.fought += fought ? 1 : 0; r.fled += fled ? 1 : 0; if (!fought && !fled) r.none++;
    if (s < 0) r.died++;
    r.hpLost += hp0 - (s >= 0 ? e.hp[s]! : 0);
    r.foes += ids.length; r.foesKilled += ids.filter((f) => e.slot(f) < 0).length;
    r.helpers += helped.size;
    for (const f of ids) { const k = e.slot(f); if (k >= 0) w.remove(k, 'gone'); }
  }
  r.alarms = alarms;
  return r;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  for (const mode of MODES) for (const arm of ARMS) {
    const t = { trials: 0, fought: 0, fled: 0, none: 0, died: 0, hpLost: 0, foesKilled: 0, foes: 0, helpers: 0, alarms: 0 };
    for (const seed of SEEDS) { const r = runDefence(arm, seed, mode); for (const k of Object.keys(t) as (keyof typeof t)[]) t[k] += r[k]; }
    console.log(JSON.stringify({ mode, arm, trials: t.trials, fought: t.fought, fled: t.fled, noReaction: t.none, died: t.died, hpLostAvg: Math.round(t.hpLost / t.trials), foesKilled: `${t.foesKilled}/${t.foes}`, helpersAvg: +(t.helpers / t.trials).toFixed(2), alarms: t.alarms }));
  }
}
