// Starts the world server again after the panel's Restart / Rebuild / Deploy (imad 2026-11-27: "when I do rebuild and restart
// the server goes down"). The old server used to start its own replacement as a child just before it quit; on the PC that
// replacement could die with it or fail with nobody watching, and the watchdog was paused for 15 minutes. Now the old server
// starts THIS small script on its own (on Windows through WMI, so it is nobody's child), saves the world and quits; this script:
//   1. waits for the old process to end (60 s, then ends it),
//   2. starts the server hidden, the same way as tools/watchdog.ps1 (output in data/stdout.log / data/stderr.log),
//   3. waits for http://127.0.0.1:<port>/health (it compiles first when the code changed: up to 5 min),
//   4. the new code does not start and the job gave the commit from before the pull = `git reset --keep <before>`, start again,
//   5. writes what happened to data/deploy.json (`restart`), which the panel's Server page shows; log in data/relaunch.log.
// No dependencies: plain Node. Usage: node tools/relaunch.mjs <data/relaunch.json>
import { spawn, execFileSync } from 'node:child_process';
import { appendFileSync, existsSync, openSync, readFileSync, rmSync, writeFileSync, closeSync, statSync } from 'node:fs';
import { join } from 'node:path';

const jobFile = process.argv[2];
const job = JSON.parse(readFileSync(jobFile, 'utf8'));
// { pid, node, args, cwd, dataDir, host, port, before?, why, at, waitSec? }
const data = job.dataDir;
const logFile = join(data, 'relaunch.log');
const deployFile = join(data, 'deploy.json');
const pauseFile = join(data, 'watchdog.pause');
const lines = [];
const say = (m) => {
  const l = `${new Date().toISOString()}  ${m}`;
  lines.push(l);
  try { appendFileSync(logFile, l + '\n'); } catch { /* nowhere to write */ }
};
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const alive = (pid) => { try { process.kill(pid, 0); return true; } catch (e) { return e.code === 'EPERM'; } };
const state = (s, extra = {}) => {
  let d = {};
  try { d = JSON.parse(readFileSync(deployFile, 'utf8')); } catch { /* first one */ }
  d.restart = { ...(d.restart?.at === job.at ? d.restart : {}), at: job.at, why: job.why, state: s, log: lines.join('\n').slice(-8000), ...extra };
  try { writeFileSync(deployFile, JSON.stringify(d, null, 1)); } catch { /* read-only */ }
};
const pause = () => { try { writeFileSync(pauseFile, `relaunch ${new Date().toISOString()}`); } catch { /* ok */ } };

async function health() {
  const host = !job.host || job.host === '0.0.0.0' || job.host === '::' ? '127.0.0.1' : job.host;
  try {
    const r = await fetch(`http://${host.includes(':') ? `[${host}]` : host}:${job.port}/health`, { signal: AbortSignal.timeout(4000) });
    return r.ok && /"ok":true/.test(await r.text());
  } catch { return false; }
}

/** Start the server and wait for it. true = up. */
async function startAndWait(label) {
  const outF = join(data, 'stdout.log'), errF = join(data, 'stderr.log');
  const errAt = existsSync(errF) ? statSync(errF).size : 0;
  const out = openSync(outF, 'a'), err = openSync(errF, 'a');
  let exited = null;
  let child;
  try {
    child = spawn(job.node, job.args, { cwd: job.cwd, detached: true, stdio: ['ignore', out, err], windowsHide: true });
  } catch (e) { say(`${label}: could not start: ${e.message}`); return false; }
  child.on('exit', (code) => { exited = code ?? -1; });
  child.on('error', (e) => { exited = -1; say(`${label}: could not start: ${e.message}`); });
  child.unref();
  closeSync(out); closeSync(err);
  say(`${label}: started pid ${child.pid}: ${job.node} ${job.args.join(' ')}`);
  const until = Date.now() + (job.waitSec ?? 300) * 1000;
  let n = 0;
  while (Date.now() < until) {
    await sleep(1000);
    if (exited !== null) {
      let errText = '';
      try { const all = readFileSync(errF, 'utf8'); errText = all.slice(errAt).trim().split(/\r?\n/).slice(-25).join('\n'); } catch { /* none */ }
      say(`${label}: the server stopped at once (exit ${exited})${errText ? `:\n${errText}` : ''}`);
      return false;
    }
    if (await health()) { say(`${label}: up, answering on port ${job.port}`); return child.pid; }
    if (++n % 20 === 0) { pause(); say(`${label}: still starting (${n} s; it compiles first when the code changed)`); }
  }
  say(`${label}: no answer after ${job.waitSec ?? 300} s: ending pid ${child.pid}`);
  try { process.kill(child.pid); } catch { /* gone */ }
  return false;
}

function git(...a) {
  try { return { ok: true, out: execFileSync('git', a, { cwd: job.cwd, encoding: 'utf8', windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'], timeout: 60_000 }).trim() }; } catch (e) { return { ok: false, out: `${e.stdout ?? ''}${e.stderr ?? ''}`.trim() || e.message }; }
}

try {
  pause();
  say(`restart (${job.why}): waiting for the old server (pid ${job.pid}) to save and stop`);
  state('stopping');
  for (let i = 0; i < 60 && alive(job.pid); i++) await sleep(1000);
  if (alive(job.pid)) { say(`old server still running after 60 s: ending pid ${job.pid}`); try { process.kill(job.pid); } catch { /* gone */ } await sleep(2000); }
  // Nothing else may hold the port: something answering now is another copy (the watchdog started one): keep that one.
  if (await health()) { say('a server already answers (started by the watchdog?): nothing to do'); state('up', { end: Date.now() }); }
  else {
    state('starting');
    let pid = await startAndWait('start');
    if (!pid && job.before) {
      const now = git('rev-parse', 'HEAD').out;
      if (now && !now.startsWith(job.before) && !job.before.startsWith(now)) {
        say(`the new code did not start: going back to ${job.before.slice(0, 7)} (git reset --keep), the code from before the update`);
        const r = git('reset', '--keep', job.before);
        say(r.ok ? `back on ${job.before.slice(0, 7)}` : `git reset failed: ${r.out}`);
        if (r.ok) {
          pid = await startAndWait('start the old code');
          if (pid) { state('rolledBack', { end: Date.now(), pid, from: now, to: job.before }); throw 'done'; }
        }
      }
    }
    if (!pid) { say('trying once more in 5 s'); await sleep(5000); pid = await startAndWait('retry'); }
    if (pid) state('up', { end: Date.now(), pid });
    else { say('the server did not come back: the watchdog tries again every 2 minutes. See data/stderr.log.'); state('failed', { end: Date.now() }); }
  }
} catch (e) {
  if (e !== 'done') { say(`relaunch error: ${e?.stack ?? e}`); state('failed', { end: Date.now() }); }
} finally {
  // The server removes these when it is up; on failure the watchdog must take over now, not in 15 minutes.
  rmSync(pauseFile, { force: true });
  rmSync(join(data, 'restart.flag'), { force: true });
  rmSync(jobFile, { force: true });
}
