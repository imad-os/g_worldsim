// The Thoughts page with a real before / after: node tools/thoughts-proof.mjs <outdir>
// Starts a server in-process, lives to the evening, samples everyone, adds the rules "never sleep" and "never stay at home"
// from the panel's own command, lives on (a sample every 20 game minutes), then screenshots the Thoughts page (dark, desktop + phone).
import { createRequire } from 'node:module';
import { mkdtempSync, mkdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { App } from '../packages/server/dist/app.js';
import { DEFAULTS } from '../packages/server/dist/config.js';
import { Logger } from '../packages/server/dist/log.js';
const { chromium } = createRequire(import.meta.url)('playwright');
const out = process.argv[2] ?? 'thoughts-proof'; mkdirSync(out, { recursive: true });
const ADMIN = 'admin-token-0123456789abcdef', dir = mkdtempSync(join(tmpdir(), 'ws-th-'));
const cfg = { ...structuredClone(DEFAULTS), dataDir: dir, port: 0, snapshotEverySec: 3600, capacity: 2048, auth: { projectId: 'none' } };
cfg.tunnel = { provider: 'none', bin: { ngrok: '/nonexistent/ngrok' } }; cfg.ai = { ...cfg.ai, provider: 'none' };
const app = new App(cfg, { adminToken: ADMIN, viewers: new Map() }, new Logger('error', undefined, true));
await app.start();
app.loop?.stop?.();
const w = app.world, th = app.thoughts;
const step = (gameSecs) => { for (let k = 0; k < gameSecs / w.opt.clockScale * 20; k++) w.step(); };
// To 19:00 of day 2.
const day = 86400, hour = (g) => ((g / 3600 + 8) % 24 + 24) % 24;
step(day / 2); while (hour(w.gameSec) < 19 || hour(w.gameSec) > 20) step(600);
const t0 = Date.now() - 20 * 60_000;
th.samples.length = 0;
for (let k = 0; k < 8; k++) { step(1200); th.sample(t0 + k * 60_000 - 60_000); }
await app.adminCmd({ cmd: 'rules', add: 'never sleep' }, 'owner', true);
await app.adminCmd({ cmd: 'rules', add: 'never stay at home' }, 'owner', true);
const t1 = Date.now() - 10 * 60_000;
// The proof squeezes game hours into seconds: put the two changes at t1 and t1 + 1 min so the samples fall around them like in a real run.
th.marks.at(-2).at = t1; th.marks.at(-1).at = t1 + 60_000 + 1;
for (let k = 1; k <= 16; k++) { step(900); th.sample(t1 + k * 30_000); }
const info = th.info();
console.log('rules', JSON.stringify(info.rules.map((r) => [r.text, r.how, r.hits, r.held])));
console.log('now', JSON.stringify(info.series.at(-1).src), JSON.stringify(info.series.at(-1).place));
const port = app.net.http.address().port, server = `http://127.0.0.1:${port}`;
const b = await chromium.launch();
for (const [tag, vp] of [['desk', { width: 1440, height: 900 }], ['phone', { width: 390, height: 844, isMobile: true, hasTouch: true }]]) {
  const ctx = await b.newContext({ colorScheme: 'dark', viewport: vp, isMobile: vp.isMobile, hasTouch: vp.hasTouch, deviceScaleFactor: tag === 'desk' ? 1 : 2 });
  const page = await ctx.newPage();
  page.on('pageerror', (er) => console.log('pageerror', er.message));
  await page.goto(server + '/panel/');
  await page.waitForSelector('#sTokBox');
  await page.evaluate(() => { document.getElementById('sTokBox').open = true; });
  await page.fill('#sTokIn', ADMIN);
  if (await page.inputValue('#sAddrIn') === '') await page.fill('#sAddrIn', server);
  await page.click('#sGo');
  await page.waitForSelector('#app:not([hidden])', { timeout: 15000 });
  await page.evaluate(() => { localStorage.setItem('ws_thMark', '0'); location.hash = '#/thoughts'; });
  await page.waitForTimeout(2500);
  // Compare with the first rule (the one about sleep).
  const first = await page.$$eval('#thMark option', (os) => os.map((o) => [o.value, o.textContent]));
  const sleepOpt = first.find(([, t]) => /never sleep"/.test(t));
  if (sleepOpt) { await page.selectOption('#thMark', sleepOpt[0]); await page.waitForTimeout(300); }
  await page.screenshot({ path: `${out}/${tag}-thoughts.png`, fullPage: true });
  const t = await page.textContent('#view'); if (/undefined|NaN|\[object/.test(t)) console.log('bad text', t.match(/.{0,40}(undefined|NaN|\[object).{0,40}/)?.[0]);
  await ctx.close();
}
await b.close();
app.stop(); rmSync(dir, { recursive: true, force: true });
process.exit(0);
