import { loadConfig } from './config.js';
import { App } from './app.js';

const { cfg, secrets } = loadConfig(process.argv.slice(2));
if (!secrets.adminToken) console.warn('ADMIN_TOKEN is not set in .env: the control panel is disabled.');
if (secrets.viewers.size === 0) console.warn('VIEWER_TOKENS is not set in .env: no viewer can connect.');

const app = new App(cfg, secrets);
let stopping = false;
const stop = (sig: string) => {
  if (stopping) return;
  stopping = true;
  app.log.info('stopping', { sig });
  app.stop().then(() => process.exit(0), (err) => { console.error(err); process.exit(1); });
};
for (const sig of ['SIGINT', 'SIGTERM', 'SIGBREAK', 'SIGHUP'] as const) process.on(sig, () => stop(sig));
process.on('uncaughtException', (err) => { app.log.error('uncaught', { err: String(err?.stack ?? err) }); stop('crash'); });
process.on('unhandledRejection', (err) => app.log.error('unhandled rejection', { err: String(err) }));

app.start().catch((err) => { console.error(err); process.exit(1); });
