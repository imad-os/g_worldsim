import { loadConfig } from './config.js';
import { App } from './app.js';
import { spawn } from 'node:child_process';
import { openSync } from 'node:fs';
import { join, resolve } from 'node:path';

const { cfg, secrets } = loadConfig(process.argv.slice(2));
if (!secrets.adminToken) console.warn('ADMIN_TOKEN is not set in .env: the control panel is disabled.');
if (secrets.viewers.size === 0) console.log('No fixed viewer tokens in .env: TVs join by themselves or pair from the panel.');

const app = new App(cfg, secrets);
let stopping = false;
const stop = (sig: string) => {
  if (stopping) return;
  stopping = true;
  app.log.info('stopping', { sig });
  app.stop().then(() => process.exit(0), (err) => { console.error(err); process.exit(1); });
};
for (const sig of ['SIGINT', 'SIGTERM', 'SIGBREAK', 'SIGHUP'] as const) process.on(sig, () => stop(sig));
process.on('uncaughtException', (err) => { app.log.error('uncaught', { source: 'crash', err: String(err?.stack ?? err) }); stop('crash'); });
process.on('unhandledRejection', (err) => app.log.error('unhandled rejection', { source: 'crash', err: String((err as Error)?.stack ?? err) }));

app.onStopRequest = () => stop('api');
// Restart from the panel: a clean stop (snapshot, tunnel down, port free), then the same command again as a detached
// process (not a child that dies with this one), output appended to data/stdout.log like the PC's watchdog does.
app.onRestartRequest = () => {
  if (stopping) return;
  stopping = true;
  app.log.warn('restarting');
  app.stop().then(() => {
    const log = openSync(join(resolve(cfg.dataDir), 'stdout.log'), 'a');
    const child = spawn(process.execPath, [...process.execArgv, ...process.argv.slice(1)], { cwd: process.cwd(), detached: true, stdio: ['ignore', log, log], windowsHide: true });
    child.unref();
    process.exit(0);
  }, (err) => { console.error(err); process.exit(1); });
};
app.start().catch((err) => { console.error(err); process.exit(1); });
