// Whole-server profile: the real App (sim + network + panel reads + snapshots) with TVs playing and a panel open.
// Prints every 10 s: event-loop delay (what TVs feel as stutter), tick time, effective speed, bytes sent, slowest admin reads.
//   node tools/server-profile.mjs [seconds 120] [speed 10] [tvs 2] [agents 14]
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { monitorEventLoopDelay } from 'node:perf_hooks';
import { WebSocket } from 'ws';
import { Msg, PROTOCOL_VERSION, encode, decode } from '@worldsim/protocol';
import { App } from '../packages/server/dist/app.js';
import { DEFAULTS } from '../packages/server/dist/config.js';
import { Logger } from '../packages/server/dist/log.js';

const [SECS = 120, SPEED = 10, TVS = 2, AGENTS = 14] = process.argv.slice(2).map(Number);
const ADMIN = 'admin-token-0123456789abcdef';
const viewers = new Map(Array.from({ length: TVS }, (_, k) => [`tv${k}`, `viewer-token-number-${k}-xxxx`]));
// A copy of the scenario with AGENTS people (and room for them to have children).
const scDir = mkdtempSync(join(tmpdir(), 'prof-sc-'));
{ const src = JSON.parse(readFileSync(new URL('../scenarios/post-apocalypse/scenario.json', import.meta.url), 'utf8'));
  src.agents.count = AGENTS; src.life = { ...(src.life ?? {}), maxPopulation: Math.max(14, AGENTS + 20) };
  mkdirSync(join(scDir, 'post-apocalypse')); writeFileSync(join(scDir, 'post-apocalypse', 'scenario.json'), JSON.stringify(src)); }
const cfg = { ...structuredClone(DEFAULTS), dataDir: process.env.DATA ?? mkdtempSync(join(tmpdir(), 'prof-')), port: 0, speed: SPEED, scenariosDir: scDir, auth: { projectId: 'none' } };
cfg.tunnel = { provider: 'none', bin: { ngrok: '/nonexistent' } };
cfg.ai = { ...cfg.ai, provider: 'none' };
const app = new App(cfg, { adminToken: ADMIN, viewers }, new Logger('error', undefined, true));
await app.start();
const url = app.net.address().replace('http', 'ws') + '/ws';
let bytes = 0;
function client(token) {
  return new Promise((ok) => {
    const ws = new WebSocket(url), c = { ws, waits: new Map(), id: 1 };
    ws.on('message', (d) => { bytes += d.length; const m = decode(d); if (m.t === Msg.AdminResult) { const w = c.waits.get(m.id); if (w) { c.waits.delete(m.id); w(m); } } });
    ws.on('open', () => { ws.send(encode({ t: Msg.Hello, v: PROTOCOL_VERSION, token })); ok(c); });
  });
}
const cmd = (c, body) => new Promise((ok) => { const id = c.id++; c.waits.set(id, ok); c.ws.send(encode({ t: Msg.Admin, id, c: body })); });
const tvs = [];
for (const [, tok] of viewers) { const c = await client(tok); await new Promise((r) => setTimeout(r, 300)); c.ws.send(encode({ t: Msg.Join })); tvs.push(c); }
const adm = await client(ADMIN);
await new Promise((r) => setTimeout(r, 500));
const slow = new Map();
const reads = [['overview', 5], ['live', 3], ['people', 4], ['history', 30], ['analysis', 15], ['agents', 4]];
const timers = reads.map(([name, every]) => setInterval(async () => {
  const t0 = performance.now(); await cmd(adm, name === 'live' ? { cmd: name, map: 'town' } : { cmd: name }); const d = performance.now() - t0;
  const r = slow.get(name) ?? { n: 0, t: 0, max: 0 }; r.n++; r.t += d; r.max = Math.max(r.max, d); slow.set(name, r);
}, every * 1000));
// TVs walk about.
const walk = setInterval(() => { for (const c of tvs) c.ws.send(encode({ t: Msg.Input, mx: Math.cos(Date.now() / 3000), my: Math.sin(Date.now() / 3000), seq: 0 })); }, 100);
let snapMax = 0, snapN = 0;
{ const f = app.snapshot.bind(app); app.snapshot = (...a) => { const t = performance.now(); try { return f(...a); } finally { snapMax = Math.max(snapMax, performance.now() - t); snapN++; } }; }
const h = monitorEventLoopDelay({ resolution: 5 }); h.enable();
const t0 = Date.now();
while (Date.now() - t0 < SECS * 1000) {
  await new Promise((r) => setTimeout(r, 10_000));
  if (globalThis.gc) globalThis.gc();
  const s = app.monitor.sample();
  console.log(JSON.stringify({ t: Math.round((Date.now() - t0) / 1000), lagP99: +(h.percentile(99) / 1e6).toFixed(1), lagMax: +(h.max / 1e6).toFixed(0), tickAvg: +s.avg.toFixed(2), tickMax: +s.max.toFixed(0),
    eff: +app.loop.effSpeed.toFixed(1), kbps: Math.round(bytes / 10 / 1024), people: app.world.profiles.size, ents: app.world.e.hi, heap: Math.round(s.heapMb), cpu: Math.round(s.cpuPct), day: +(app.world.gameSec / 86400).toFixed(2), snapMs: +snapMax.toFixed(0), snapN,
    reads: Object.fromEntries([...slow].map(([k, v]) => [k, `${(v.t / v.n).toFixed(0)}/${v.max.toFixed(0)}ms`])) }));
  bytes = 0; snapMax = 0; snapN = 0; h.reset(); slow.clear();
}
clearInterval(walk); timers.forEach(clearInterval);
await app.stop();
process.exit(0);
