import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { App } from '../app.js';
import { DEFAULTS, type Config } from '../config.js';
import { Logger } from '../log.js';

const ADMIN = 'admin-token-0123456789abcdef';
const HOUR = 3600;

function makeApp(dataDir: string): App {
  const cfg: Config = { ...structuredClone(DEFAULTS), dataDir, port: 0, snapshotEverySec: 3600, capacity: 600, auth: { projectId: 'none' } };
  cfg.tunnel = { provider: 'none', bin: { ngrok: '/nonexistent/ngrok' } };
  cfg.ai = { ...cfg.ai, provider: 'none' };
  return new App(cfg, { adminToken: ADMIN, viewers: new Map() }, new Logger('error', undefined, true));
}

test('the game clock runs at its own speed by day, by night and while every player sleeps; saved; odd values are asked', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'ws-clock-'));
  let app = makeApp(dir);
  await app.start();
  app.loop.paused = true;
  const cmd = (c: object, force = false) => app.adminCmd({ ...c, ...(force ? { force: true } : {}) } as never, 'imad', true);
  let w = app.world;
  const base = w.clockBase, dt = w.dt;
  // Game seconds that 20 ticks add, starting at a given game hour (gameSec 0 = 08:00).
  const run = (atHour: number) => { w.gameSec = ((atHour - 8 + 24) % 24) * HOUR; w.tick = 0; const g0 = w.gameSec; for (let k = 0; k < 20; k++) w.step(); return w.gameSec - g0; };

  assert.ok(Math.abs(run(12) - 20 * dt * base) < 1e-6, 'x1 by default');
  const r = await cmd({ cmd: 'clockSpeed', day: 2, night: 4, sleep: 8 }) as { day: number; night: number; sleep: number };
  assert.deepEqual([r.day, r.night, r.sleep], [2, 4, 8]);
  assert.ok(Math.abs(run(12) - 20 * dt * base * 2) < 1e-6, 'day x2');
  assert.equal(w.clockPhase, 'day');
  assert.ok(Math.abs(run(23) - 20 * dt * base * 4) < 1e-6, 'night x4');
  assert.equal(w.clockPhase, 'night');

  // A player in the game asleep: the sleep speed; awake again: the hour's own.
  const real = w.playersAsleep;
  assert.equal(real(), false, 'nobody in the game = never the sleep speed');
  let asleep = true;
  w.playersAsleep = () => asleep;
  assert.ok(Math.abs(run(23) - 20 * dt * base * 8) < 1e-6, 'sleep x8');
  assert.equal(w.clockPhase, 'sleep');
  asleep = false;
  run(23);
  assert.equal(w.clockPhase, 'night');

  w.playersAsleep = real;

  // Outside the usual range: asked first, then taken with force; nonsense refused.
  await assert.rejects(cmd({ cmd: 'clockSpeed', night: 50 }), /confirm/);
  await cmd({ cmd: 'clockSpeed', night: 50 }, true);
  await assert.rejects(cmd({ cmd: 'clockSpeed', day: -1 }, true), /bad day/);
  const s = app.stats();
  assert.equal(s.clock?.night, 50);

  // Kept across a restart.
  app.stop();
  app = makeApp(dir);
  await app.start();
  after(() => { app.stop(); rmSync(dir, { recursive: true, force: true }); });
  w = app.world;
  assert.deepEqual({ ...w.clockMul }, { day: 2, night: 50, sleep: 8 });
});
