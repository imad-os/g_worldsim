import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFile, spawn } from 'node:child_process';
import { promisify } from 'node:util';
import { existsSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { createServer } from 'node:net';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { ROOT, sameCommand, type RelaunchJob } from '../ops/relaunch.js';

/** A free port. */
function freePort(): Promise<number> {
  return new Promise((ok) => { const s = createServer().listen(0, '127.0.0.1', () => { const p = (s.address() as { port: number }).port; s.close(() => ok(p)); }); });
}
/** A stand-in server: answers /health, or (bad) quits at once with an error. */
function fakeServer(dir: string, port: number, bad: boolean): string {
  const f = join(dir, bad ? 'bad.mjs' : 'good.mjs');
  writeFileSync(f, bad ? "console.error('boom at start'); process.exit(1);\n"
    : `import http from 'node:http'; http.createServer((q, r) => r.end('{"ok":true}')).listen(${port}, '127.0.0.1'); setTimeout(() => process.exit(0), 20000);\n`);
  return f;
}
// Async: the "old server" is this test's child and must be reaped when it ends (a blocked event loop leaves a zombie that looks alive).
const run = async (job: RelaunchJob, dir: string) => {
  const file = join(dir, 'relaunch.json');
  writeFileSync(file, JSON.stringify(job));
  await promisify(execFile)(process.execPath, [join(ROOT, 'tools', 'relaunch.mjs'), file], { timeout: 60_000 });
  return JSON.parse(readFileSync(join(dir, 'deploy.json'), 'utf8')) as { restart: { state: string; log: string } };
};

test('restart helper: waits for the old process, starts the server, reports it up', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'relaunch-'));
  const port = await freePort();
  const old = spawn(process.execPath, ['-e', 'setTimeout(() => {}, 1500)']); // the "old server", gone in 1.5 s
  writeFileSync(join(dir, 'watchdog.pause'), 'x');
  const t0 = Date.now();
  const d = await run({ pid: old.pid!, node: process.execPath, args: [fakeServer(dir, port, false)], cwd: dir, dataDir: dir, host: '127.0.0.1', port, why: 'test', at: Date.now(), waitSec: 20 }, dir);
  assert.equal(d.restart.state, 'up', d.restart.log);
  assert.ok(Date.now() - t0 >= 1000, 'waited for the old process');
  assert.ok(!existsSync(join(dir, 'watchdog.pause')), 'the watchdog may watch again');
  assert.ok(!existsSync(join(dir, 'relaunch.json')));
});

test('restart helper: a server that will not start is reported failed with its error, the watchdog is not left paused', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'relaunch-'));
  const port = await freePort();
  writeFileSync(join(dir, 'watchdog.pause'), 'x');
  const d = await run({ pid: 999999, node: process.execPath, args: [fakeServer(dir, port, true)], cwd: dir, dataDir: dir, host: '127.0.0.1', port, why: 'test', at: Date.now(), waitSec: 10 }, dir);
  assert.equal(d.restart.state, 'failed');
  assert.match(d.restart.log, /boom at start/);
  assert.ok(!existsSync(join(dir, 'watchdog.pause')));
});

test('restart helper: the same command, main script relative with forward slashes', () => {
  const c = sameCommand();
  assert.equal(c.node, process.execPath);
  assert.ok(c.args.some((a) => /dist\/test\/relaunch\.test\.js$|\.test\.js$/.test(a)), c.args.join(' '));
  assert.ok(!c.args.some((a) => a.includes('\\')));
});
