import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { writeFileSync } from 'node:fs';
import { Act, Kind } from '@worldsim/protocol';
import { loadScenario } from './sim/scenario.js';
import { World, type AiFlags } from './sim/world.js';
import { auditHut, flood, walkableNear } from './sim/structures.js';
import { serialize } from './persist/snapshot.js';

/**
 * Repeatable experiments (research/EXPERIMENTS.md): run the world headless for some game days with fixed seeds, with the
 * AI features on or off, and measure what people actually achieve. No LLM is used (the local algorithms only), so every
 * run with the same seed and flags gives the same numbers.
 *
 *   node packages/server/dist/experiment.js --days 3 --seeds a,b,c --agents 5 --zombies 0 --arms old,new [--out file.json]
 *
 * Arms: old = every new feature off (the behaviour before), new = all on, or a list of flags such as "goap+learn".
 */
const ROOT = resolve(fileURLToPath(import.meta.url), '../../../..');
const arg = (k: string, d: string) => { const i = process.argv.indexOf('--' + k); return i > 0 ? process.argv[i + 1]! : d; };
const DAYS = Number(arg('days', '3')), SEEDS = arg('seeds', 'exp-a,exp-b,exp-c').split(','), AGENTS = Number(arg('agents', '5'));
const ZOMBIES = Number(arg('zombies', '0')), ARMS = arg('arms', 'old,new').split(','), OUT = arg('out', '');
const CLOCK = 30, RATE = 20;

const ALL: (keyof AiFlags)[] = ['goap', 'learn', 'siting', 'instinct', 'purpose'];
function flagsOf(arm: string): AiFlags {
  const on = arm === 'new' ? ALL : arm === 'old' ? [] : arm.split('+');
  const f = {} as AiFlags;
  for (const k of ALL) f[k] = on.includes(k);
  return f;
}

export interface RunResult {
  arm: string; seed: string; days: number; agents: number;
  alive: number; born: number; deaths: Record<string, number>;
  needs: { hunger: number; thirst: number; tired: number; lonely: number; hp: number };
  tasks: { started: number; ok: number; failed: number; okRate: number; byFrom: Record<string, [number, number]>; reasons: Record<string, number>; texts: Record<string, number> };
  loops: number; built: Record<string, number>; gathered: number; crafted: number;
  huts: { n: number; functional: number; enclosed: number; reachable: number; protected: number };
  wall: { up: number; left: number }; fireHours: number; stock: number;
  idle: number; talks: number; partners: number;
  msPerTick: number; p95: number; searchesPerHour: number;
  fights: number; flees: number; bites: number; zombiesKilled: number; alarms: number;
  memory: { short: number; long: number; places: number }; snapshotKB: number;
}

export function runOnce(arm: string, seed: string, days = DAYS, agents = AGENTS, zombies = ZOMBIES): RunResult {
  const sc = loadScenario(resolve(ROOT, 'scenarios/post-apocalypse'));
  sc.agents.count = agents;
  const w = new World(sc, { tickRate: RATE, clockScale: CLOCK, capacity: 2048, seed, ai: flagsOf(arm) });
  w.populate();
  w.land.setup(); // as the server does at start: the ring of trees, roads, wrecks, rocks
  w.zombies.perNight = zombies;
  const deaths: Record<string, number> = {}, built: Record<string, number> = {}, reasons: Record<string, number> = {};
  const byFrom: Record<string, [number, number]> = {}, texts: Record<string, number> = {};
  let ok = 0, failed = 0, gathered = 0, crafted = 0, talks = 0, partners = 0, born = 0, loops = 0;
  let fights = 0, flees = 0, bites = 0, zombiesKilled = 0, alarms = 0;
  const lastFail = new Map<string, number>();
  w.listeners.push((ev) => {
    const d = ev.data;
    switch (ev.kind) {
      case 'death': deaths[String(d.cause)] = (deaths[String(d.cause)] ?? 0) + 1; break;
      case 'build': built[String(d.what)] = (built[String(d.what)] ?? 0) + 1; break;
      case 'gather': gathered++; break;
      case 'craft': crafted++; break;
      case 'talk': talks++; break;
      case 'partner': partners++; break;
      case 'birth': born++; break;
      case 'fight': fights++; break;
      case 'flee': flees++; break;
      case 'bitten': bites++; break;
      case 'alarm': alarms++; break;
      case 'zombie': if (d.how === 'killed') zombiesKilled++; break;
      case 'task': {
        texts[String(d.text)] = (texts[String(d.text)] ?? 0) + 1;
        const from = String(w.profiles.get(Number(d.id))?.goals?.at(-1)?.from ?? '?') === 'myself' ? 'myself' : 'leader/other';
        const b = (byFrom[from] ??= [0, 0]);
        if (d.ok) { ok++; b[0]++; } else {
          failed++; b[1]++;
          const why = String(d.why).replace(/\d+/g, 'N').replace(/"[^"]*"/g, '"…"').slice(0, 60);
          reasons[why] = (reasons[why] ?? 0) + 1;
          // A loop: the same person failing the same task for the same reason again (3rd time and more counts).
          const key = `${d.id}|${d.text}|${why}`, n = (lastFail.get(key) ?? 0) + 1;
          lastFail.set(key, n);
          if (n >= 3) loops++;
        }
        break;
      }
    }
  });
  const ticks = Math.round((days * 86400) / CLOCK * RATE), hourTicks = Math.round(3600 / CLOCK * RATE);
  const times = new Float64Array(ticks);
  const need = { hunger: 0, thirst: 0, tired: 0, lonely: 0, hp: 0 };
  let samples = 0, idle = 0, awake = 0, fireHours = 0, searches = 0;
  const e = w.e;
  for (let k = 0; k < ticks; k++) {
    const a = performance.now();
    w.step();
    times[k] = performance.now() - a;
    searches += w.brain.searches; w.brain.searches = 0;
    if (k % hourTicks === 0) {
      for (let i = 0; i < e.hi; i++) {
        if (e.kind[i] !== Kind.Agent) continue;
        need.hunger += e.hunger[i]!; need.thirst += e.thirst[i]!; need.tired += e.tired[i]!; need.lonely += e.lonely[i]!; need.hp += e.hp[i]!; samples++;
        if (e.act[i] !== Act.Sleep) { awake++; if (e.act[i] === Act.Idle || e.act[i] === Act.Rest || e.act[i] === Act.Wander) idle++; }
      }
      for (let m = 0; m < w.maps.length; m++) { const c = w.survival.campOf(m); if (c && w.survival.fireNear(m, c.x, c.y, 15) >= 0) fireHours++; }
    }
  }
  // Construction audit at the end.
  const huts = { n: 0, functional: 0, enclosed: 0, reachable: 0, protected: 0 };
  const wall = { up: 0, left: 0 };
  let stock = 0;
  for (let m = 0; m < w.maps.length; m++) {
    const camp = w.survival.campOf(m);
    if (!camp) continue;
    const tm = w.maps[m]!.tiles, c0 = walkableNear(tm, camp.x, camp.y, 4);
    const reach = c0 >= 0 ? flood(tm, c0 % tm.w, (c0 / tm.w) | 0, 20000) : new Set<number>();
    const per = w.survival.perimeter(m);
    for (const [k, out] of w.survival.huts[m]!.entries()) {
      if (out < 0) continue;
      const r = auditHut(tm, out, reach, per, w.survival.hutDir[m]![k]);
      huts.n++; if (r.functional) huts.functional++; if (r.enclosed) huts.enclosed++; if (r.reachable) huts.reachable++; if (r.protected) huts.protected++;
    }
    const [up, left] = w.survival.campDefence(m);
    wall.up += up; wall.left += left;
    stock += w.survival.stash[m]?.food ?? 0;
  }
  let alive = 0;
  const mem = { short: 0, long: 0, places: 0 };
  for (let i = 0; i < e.hi; i++) if (e.kind[i] === Kind.Agent) {
    alive++;
    const m = w.profileOf(i)?.mind?.mem;
    if (m) { mem.short += m.s.length; mem.long += m.l.length; mem.places += Object.values(m.p).reduce((s, x) => s + (x?.length ?? 0), 0); }
  }
  for (const k of Object.keys(mem) as (keyof typeof mem)[]) mem[k] = Math.round((mem[k] / Math.max(1, alive)) * 10) / 10;
  const snapshotKB = Math.round(serialize(w, false).length / 1024);
  times.sort();
  const total = times.reduce((s, x) => s + x, 0);
  const n = Math.max(1, samples);
  const r1 = (x: number) => Math.round(x * 10) / 10;
  return {
    arm, seed, days, agents, alive, born, deaths,
    needs: { hunger: r1(need.hunger / n), thirst: r1(need.thirst / n), tired: r1(need.tired / n), lonely: r1(need.lonely / n), hp: r1(need.hp / n) },
    tasks: { started: ok + failed, ok, failed, okRate: Math.round((ok / Math.max(1, ok + failed)) * 100) / 100, byFrom, reasons, texts },
    loops, built, gathered, crafted, huts, wall, fireHours, stock,
    idle: Math.round((idle / Math.max(1, awake)) * 100) / 100, talks, partners,
    msPerTick: +(total / ticks).toFixed(4), p95: +times[Math.floor(ticks * 0.95)]!.toFixed(4), searchesPerHour: Math.round(searches / (days * 24)),
    fights, flees, bites, zombiesKilled, alarms, memory: mem, snapshotKB,
  };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  const all: RunResult[] = [];
  for (const arm of ARMS) for (const seed of SEEDS) {
    const r = runOnce(arm, seed);
    all.push(r);
    console.log(JSON.stringify(r));
  }
  // Mean per arm of the headline numbers.
  const keys: [string, (r: RunResult) => number][] = [
    ['alive', (r) => r.alive], ['deaths', (r) => Object.values(r.deaths).reduce((s, x) => s + x, 0)], ['tasksOk', (r) => r.tasks.ok], ['tasksFailed', (r) => r.tasks.failed],
    ['okRate', (r) => r.tasks.okRate], ['loops', (r) => r.loops], ['huts', (r) => r.huts.n], ['hutsFunctional', (r) => r.huts.functional],
    ['wallUp', (r) => r.wall.up], ['fireHours', (r) => r.fireHours], ['gathered', (r) => r.gathered], ['crafted', (r) => r.crafted], ['stock', (r) => r.stock],
    ['hunger', (r) => r.needs.hunger], ['thirst', (r) => r.needs.thirst], ['idle', (r) => r.idle], ['talks', (r) => r.talks], ['lonely', (r) => r.needs.lonely], ['msPerTick', (r) => r.msPerTick], ['searches/h', (r) => r.searchesPerHour],
    ['partners', (r) => r.partners], ['born', (r) => r.born], ['bites', (r) => r.bites], ['zombiesKilled', (r) => r.zombiesKilled], ['alarms', (r) => r.alarms],
    ['memShort', (r) => r.memory.short], ['memLong', (r) => r.memory.long], ['places', (r) => r.memory.places], ['snapshotKB', (r) => r.snapshotKB],
  ];
  const rows = ARMS.map((arm) => {
    const rs = all.filter((r) => r.arm === arm);
    return [arm, ...keys.map(([, f]) => rs.reduce((s, r) => s + f(r), 0) / rs.length)];
  });
  console.log('\n| metric | ' + ARMS.join(' | ') + ' |\n|---|' + ARMS.map(() => '---').join('|') + '|');
  keys.forEach(([k], j) => console.log(`| ${k} | ${rows.map((r) => +Number(r[j + 1]).toFixed(3)).join(' | ')} |`));
  if (OUT) writeFileSync(OUT, JSON.stringify(all, null, 1));
}
