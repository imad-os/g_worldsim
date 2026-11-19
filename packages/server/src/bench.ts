import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Kind } from '@worldsim/protocol';
import { loadScenario } from './sim/scenario.js';
import { World } from './sim/world.js';
import { serialize } from './persist/snapshot.js';

/**
 * Headless benchmark: how fast can this machine tick the world? Prints ms per tick, the highest
 * possible speed (x1 = 20 ticks/s), RAM, and the snapshot size and time. Usage: npm run bench [-- agents]
 */
const ROOT = resolve(fileURLToPath(import.meta.url), '../../../..');
const sc = loadScenario(resolve(ROOT, 'scenarios/post-apocalypse'));
const counts = process.argv.slice(2).map(Number).filter((n) => n > 0);
for (const n of counts.length ? counts : [20, 100]) {
  sc.agents.count = n;
  const w = new World(sc, { tickRate: 20, clockScale: 10, capacity: 4096, seed: 'bench' });
  w.populate();
  for (let k = 0; k < 400; k++) w.step(); // warm up
  const N = 20 * 300, times = new Float64Array(N);
  const t0 = performance.now();
  for (let k = 0; k < N; k++) { const a = performance.now(); w.step(); times[k] = performance.now() - a; }
  const ms = performance.now() - t0;
  times.sort();
  const s0 = performance.now(), snap = serialize(w), sms = performance.now() - s0;
  const mem = process.memoryUsage();
  console.log(JSON.stringify({
    agents: w.e.countKind(Kind.Agent), ticks: N, msPerTick: +(ms / N).toFixed(4), p95: +times[Math.floor(N * 0.95)]!.toFixed(4), max: +times[N - 1]!.toFixed(3),
    maxSpeed: Math.floor(1000 / (ms / N) / 20), rssMb: Math.round(mem.rss / 1048576), heapMb: Math.round(mem.heapUsed / 1048576),
    snapshotKb: Math.round(snap.byteLength / 1024), snapshotMs: +sms.toFixed(1),
  }));
}
