import { loadConfig } from './config.js';
import { App } from './app.js';
import { resolve } from 'node:path';
import { relaunch } from './ops/relaunch.js';

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
// Restart from the panel (imad 2026-11-27: "rebuild and restart takes the server down"): tools/relaunch.mjs is started on its own
// FIRST (ops/relaunch.ts: on Windows through WMI, so it is not our child and survives us), then a clean stop (snapshot, tunnel down,
// port free) and exit. It waits for this process to end, starts the server again the watchdog's way, waits for /health, rolls a
// failed deploy back, and writes what happened to data/deploy.json for the panel. A stop that hangs ends after 30 s anyway.
app.onRestartRequest = (why, before) => {
  if (stopping) return;
  stopping = true;
  app.log.warn('restarting', { why, before });
  let how = '';
  try { how = relaunch({ dataDir: resolve(cfg.dataDir), host: cfg.host, port: cfg.port, why, before, log: (m, d) => app.log.info(m, d) }); } catch (err) { app.log.error('relaunch helper failed to start', { err: String(err) }); }
  if (!how) app.log.error('no relaunch helper: the watchdog starts the server again within 2 minutes');
  const quit = (code: number) => { app.log.info('exiting for the restart', { how }); setTimeout(() => process.exit(code), 100); };
  const hard = setTimeout(() => quit(0), 30_000);
  app.stop().then(() => { clearTimeout(hard); quit(0); }, (err) => { clearTimeout(hard); console.error(err); quit(1); });
};
app.start().catch((err) => { console.error(err); process.exit(1); });
