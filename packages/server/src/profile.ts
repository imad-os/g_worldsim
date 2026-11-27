import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Kind } from '@worldsim/protocol';
import { loadScenario } from './sim/scenario.js';
import { World } from './sim/world.js';
import { serialize } from './persist/snapshot.js';

/**
 * Where does the server's time go as a world ages? Runs a realistic world (land set up, zombies at night) for some
 * game days and prints, per game half-day, ms per tick (mean / p95 / max), entities by kind and the snapshot size.
 *   node packages/server/dist/profile.js [agents 14] [days 4] [zombies 6] [maxPop 14]
 */
const ROOT = resolve(fileURLToPath(import.meta.url), '../../../..');
const [AG = 14, DAYS = 4, ZB = 6, MAXP = 14] = process.argv.slice(2).map(Number);
const sc = loadScenario(resolve(ROOT, 'scenarios/post-apocalypse'));
sc.agents.count = AG;
(sc.life as { maxPopulation?: number }).maxPopulation = MAXP;
const w = new World(sc, { tickRate: 20, clockScale: 30, capacity: 4096, seed: 'prof' });
w.populate();
w.land.setup();
w.zombies.perNight = ZB;
const acc = new Map<string, { t: number; max: number; n: number }>();
const wrap = (o: any, name: string, label: string) => { const f = o[name].bind(o); o[name] = (...a: unknown[]) => { const t0 = performance.now(); try { return f(...a); } finally { const d = performance.now() - t0, r = acc.get(label) ?? { t: 0, max: 0, n: 0 }; r.t += d; r.n++; if (d > r.max) r.max = d; acc.set(label, r); } }; };
for (const k of ['brain', 'life', 'weather', 'gear', 'survival', 'tasks', 'rules', 'clans', 'territory', 'family', 'quests', 'lore', 'influence', 'zombies', 'animals', 'horses', 'replays']) { const o = (w as any)[k]; for (const fn of ['think', 'tick', 'update']) if (typeof o?.[fn] === 'function') wrap(o, fn, k + '.' + fn); }
{ const sv = (w as any).survival; for (const fn of ['regrow', 'ownPlans', 'rotDrops', 'quarter', 'autoHeal', 'regrowHerbs', 'init']) if (typeof sv[fn] === 'function') wrap(sv, fn, 'sv.' + fn); wrap(sv.homes, 'hourly', 'homes.hourly'); for (const fn of ['goapPass','pickLeader','watch']) if (typeof sv[fn] === 'function') wrap(sv, fn, 'sv.' + fn); }
for (const m of (w as any).maps) { wrap(m.phys, 'step', 'phys.step'); wrap(m.phys, 'rebuildDirty', 'phys.rebuild'); wrap(m.grid, 'rebuild', 'grid'); }
const perHalfDay = 20 * 3600 * 12 / 30;
const total = Math.round(DAYS * 2 * perHalfDay);
let times: number[] = [];
const kinds = () => { const o: Record<string, number> = {}; for (const k of Object.keys(Kind).filter((x) => isNaN(Number(x)))) { const n = w.e.countKind((Kind as any)[k]); if (n) o[k] = n; } return o; };
for (let t = 0; t < total; t++) {
  const a = performance.now(); w.step(); times.push(performance.now() - a);
  if (times.length >= perHalfDay) {
    const s = [...times].sort((x, y) => x - y), mean = times.reduce((p, q) => p + q, 0) / times.length;
    const snap = serialize(w);
    console.log(JSON.stringify({ halfDay: Math.round(t / perHalfDay), ms: +mean.toFixed(3), p95: +s[Math.floor(s.length * .95)]!.toFixed(2), p99: +s[Math.floor(s.length * .99)]!.toFixed(2), max: +s.at(-1)!.toFixed(1), kinds: kinds(), snapKb: Math.round(snap.byteLength / 1024), heapMb: Math.round(process.memoryUsage().heapUsed / 1048576) }));
    console.log('  ', [...acc].sort((a, b) => b[1].max - a[1].max).slice(0, 8).map(([k, v]) => `${k} max ${v.max.toFixed(0)} avg ${(v.t / v.n).toFixed(3)}`).join(' | ')); acc.clear();
    times = [];
  }
}
