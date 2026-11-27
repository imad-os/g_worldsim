// Rubber-band check (imad 2026-11-27: "the server keeps bringing me back to a previous point"): the real App, one TV that
// walks / runs like the TV app does (moves its character at once, sends where it is every 100 ms) and corrects itself from the
// frames with the TV's own rule (CORRECT below = packages/client/src/app.ts). Counts snaps back, server refusals and the worst gap.
//   node tools/lag-proof.mjs [seconds 40] [speed 1] [stall ms every 5 s, 0 = none] [netJitter ms 0]
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { WebSocket } from 'ws';
import { fork } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { Msg, PROTOCOL_VERSION, encode, decode, unpackI32, ENT_REC, POS_Q } from '@worldsim/protocol';
import { App } from '../packages/server/dist/app.js';
import { DEFAULTS } from '../packages/server/dist/config.js';
import { Logger } from '../packages/server/dist/log.js';

const [SECS = 40, SPEED = 1, STALL = 0, JITTER = 0] = process.argv.slice(2).map(Number);
const ADMIN = 'admin-token-0123456789abcdef', TOK = 'viewer-token-number-0-xxxx';
const why = {};
if (process.argv[2] === 'serve') {
  const [, , , SP, ST] = process.argv.map(Number);
  const cfg = { ...structuredClone(DEFAULTS), dataDir: mkdtempSync(join(tmpdir(), 'lag-')), port: 0, speed: SP, auth: { projectId: 'none' } };
  cfg.tunnel = { provider: 'none', bin: { ngrok: '/nonexistent' } };
  cfg.ai = { ...cfg.ai, provider: 'none' };
  const app = new App(cfg, { adminToken: ADMIN, viewers: new Map([['tv0', TOK]]) }, new Logger('error', undefined, true));
  await app.start();
  let refused = 0;
  { const f = app.world.trustMove.bind(app.world); app.world.trustMove = (i, x, y, ...a) => { const d = Math.hypot(x - app.world.e.x[i], y - app.world.e.y[i]); const ok = f(i, x, y, ...a); if (!ok) { refused++; const k = d > 2.5 ? 'far' : 'wall'; why[k] = (why[k] ?? 0) + 1; } return ok; }; }
  // Stalls of the server's event loop (a snapshot, a slow AI answer, GC...).
  if (ST) setInterval(() => { const t = Date.now(); while (Date.now() - t < ST) { /* busy */ } }, 5000);
  process.on('message', (m) => { if (m === 'stats') process.send({ refused, why, eff: app.loop.effSpeed }); });
  const tm = app.world.maps[0].tiles, solid = [];
  for (let k = 0; k < tm.w * tm.h; k++) solid.push(tm.cost[tm.tiles[k]] <= 0 ? 1 : 0);
  process.send({ url: app.net.address().replace('http', 'ws') + '/ws', w: tm.w, solid, r: app.world.agentR });
  await new Promise(() => {});
}
const child = fork(fileURLToPath(import.meta.url), ['serve', String(SPEED), String(STALL)]);
const boot = await new Promise((ok) => child.once('message', ok)), url = boot.url;
const ws = new WebSocket(url);
await new Promise((ok) => ws.on('open', ok));
ws.send(encode({ t: Msg.Hello, v: PROTOCOL_VERSION, token: TOK }));
await new Promise((r) => setTimeout(r, 400));
ws.send(encode({ t: Msg.Join }));
const later = (fn) => (JITTER ? setTimeout(fn, Math.random() * JITTER) : fn());
let fixNow = false, meId = -1, sx = NaN, sy = NaN, svx = 0, svy = 0, frameAt = 0, ack = 0, fix = 0, fixSeen = 0, fresh = false;
ws.on('message', (d) => later(() => {
  const m = decode(d);
  if (m.t === Msg.You) { meId = m.id; if (m.x !== undefined) { px = m.x; py = m.y; ok = true; } }
  if (m.t === Msg.Frame) {
    const r = unpackI32(m.upd);
    for (let o = 0; o < r.length; o += ENT_REC) if (r[o] === meId) { sx = r[o + 2] / POS_Q; sy = r[o + 3] / POS_Q; svx = r[o + 5] / POS_Q; svy = r[o + 6] / POS_Q; frameAt = performance.now(); fresh = true; }
    if (m.ack !== undefined) ack = m.ack;
    if (m.fix !== undefined && m.fix > fix) { fix = m.fix; fixNow = m.fix === m.ack; }
  }
}));
// Stalls of the server's event loop (a snapshot, a slow AI answer, GC...).
let px = 0, py = 0, ok = false, pvx = 0, pvy = 0, seq = 0, sentAt = 0, snaps = 0, worst = 0, far = 0, farSince = 0;
const solidAt = (x, y) => { const tx = Math.floor(x), ty = Math.floor(y); return tx < 0 || ty < 0 || tx >= boot.w || ty >= boot.w || boot.solid[ty * boot.w + tx] === 1; };
const R = (boot.r ?? 0.35) * 0.9, blocked = (x, y) => solidAt(x - R, y - R) || solidAt(x + R, y - R) || solidAt(x - R, y + R) || solidAt(x + R, y + R); // = the TV's blocked()
const NEW = process.env.OLD !== '1';
let last = performance.now();
const t0 = performance.now();
const loop = setInterval(() => {
  const now = performance.now(), dt = Math.min(0.1, (now - last) / 1000); last = now;
  if (!ok) { if (!isNaN(sx)) { px = sx; py = sy; ok = true; } return; }
  const k = (now - t0) / 1000, run = Math.floor(k / 6) % 2 === 1;
  const mx = Math.cos(k / 4), my = Math.sin(k / 4), sp = run ? 3.5 : 1.4;
  const ax = mx * sp - pvx, ay = my * sp - pvy, a = Math.hypot(ax, ay), mdv = 8 * dt, f = a > mdv ? mdv / a : 1;
  pvx += ax * f; pvy += ay * f;
  if (!blocked(px + pvx * dt, py)) px += pvx * dt; else pvx = 0;
  if (!blocked(px, py + pvy * dt)) py += pvy * dt; else pvy = 0;
  if (now - sentAt > 100) { sentAt = now; ws.send(encode({ t: Msg.Input, mx: Math.round(mx * 50) / 50, my: Math.round(my * 50) / 50, run, seq: ++seq, x: Math.round(px * 100) / 100, y: Math.round(py * 100) / 100 })); }
  if (isNaN(sx)) return;
  const e0 = Math.hypot(sx - px, sy - py); worst = Math.max(worst, e0);
  // CORRECT: the TV's rule.
  if (!NEW) {
    const lag = Math.min(0.5, (now - frameAt) / 1000 + 0.02);
    const ex = sx + svx * lag - px, ey = sy + svy * lag - py, e = Math.hypot(ex, ey);
    if (e > 3) { snaps++; px = sx + svx * lag; py = sy + svy * lag; pvx = pvy = 0; }
  } else { // = packages/client/src/app.ts updatePlay (server with ack / fix)
    const moving = Math.abs(pvx) + Math.abs(pvy) > 0.01;
    const live = now - frameAt < 350 && ack >= seq - 2;
    const ex = sx - px, ey = sy - py, e = Math.hypot(ex, ey);
    if (fix > fixSeen && (fixSeen = fix, fixNow)) { if (e > 0.6) { snaps++; px = sx; py = sy; pvx = pvy = 0; } else { px += ex * 0.5; py += ey * 0.5; } farSince = 0; }
    else if (live && e > 3) { if (!farSince) farSince = now; else if (now - farSince > 1000) { snaps++; far++; px = sx; py = sy; pvx = pvy = 0; farSince = 0; } }
    else farSince = 0;
    void moving;
  }
  fresh = false;
}, 16);
await new Promise((r) => setTimeout(r, SECS * 1000));
clearInterval(loop); 
child.send('stats'); const st = await new Promise((ok) => child.once('message', ok));
console.log(JSON.stringify({ rule: NEW ? 'new' : 'old', secs: SECS, speed: SPEED, stallMs: STALL, jitterMs: JITTER, sent: seq, snapsBack: snaps, farSnaps: far, serverRefused: st.refused, why: st.why, worstGapM: +worst.toFixed(2), eff: +st.eff.toFixed(2) }));
ws.close(); child.kill(); process.exit(0);
