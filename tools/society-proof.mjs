// The Society page with a real history: node tools/society-proof.mjs <outdir>
// Starts a server in-process, lives 2 game days, sends three people into the woods next to bears and a wolf (real deaths, real bites),
// lets a child grow up, then screenshots the panel's Society page (desktop + phone).
import { createRequire } from 'node:module';
import { mkdtempSync, mkdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { App } from '../packages/server/dist/app.js';
import { DEFAULTS } from '../packages/server/dist/config.js';
import { Logger } from '../packages/server/dist/log.js';
import { Kind } from '@worldsim/protocol';
const { chromium } = createRequire(import.meta.url)('playwright');
const out = process.argv[2] ?? 'society-proof'; mkdirSync(out, { recursive: true });
const ADMIN = 'admin-token-0123456789abcdef', dir = mkdtempSync(join(tmpdir(), 'ws-soc-'));
const cfg = { ...structuredClone(DEFAULTS), dataDir: dir, port: 0, snapshotEverySec: 3600, capacity: 2048, auth: { projectId: 'none' } };
cfg.tunnel = { provider: 'none', bin: { ngrok: '/nonexistent/ngrok' } }; cfg.ai = { ...cfg.ai, provider: 'none' };
const app = new App(cfg, { adminToken: ADMIN, viewers: new Map() }, new Logger('error', undefined, true));
await app.start();
app.loop?.stop?.();
const w = app.world, e = w.e, woods = w.mapIndex.get('woods');
w.travelOpen = true; w.zombies.perNight = 4;
const step = (secs) => { for (let k = 0; k < secs * 20; k++) w.step(); };
step(2 * 86400 / w.opt.clockScale);
const people = []; for (let i = 0; i < e.hi; i++) if (e.kind[i] === Kind.Agent) people.push(i);
for (const [n, i] of people.slice(0, 3).entries()) {
  w.place(i, woods, 140 + n * 6, 40 + n * 3); e.hp[i] = 30;
  for (const t of [4, 4, 3]) w.animals.angry.set(e.id(w.animals.spawn(woods, e.x[i] + 1.5, e.y[i] + 0.5, t)), e.id(i));
}
step(90);
step(6 * 3600 / w.opt.clockScale);
const port = app.net.http.address().port, server = `http://127.0.0.1:${port}`;
const b = await chromium.launch();
for (const [tag, vp] of [['desk', { width: 1440, height: 900 }], ['phone', { width: 390, height: 844, isMobile: true, hasTouch: true }]]) {
  const ctx = await b.newContext({ viewport: vp, isMobile: vp.isMobile, hasTouch: vp.hasTouch, deviceScaleFactor: tag === 'desk' ? 1 : 2 });
  const page = await ctx.newPage();
  page.on('pageerror', (er) => console.log('pageerror', er.message));
  await page.goto(server + '/panel/');
  await page.waitForSelector('#sTokBox');
  await page.evaluate(() => { document.getElementById('sTokBox').open = true; });
  await page.fill('#sTokIn', ADMIN);
  if (await page.inputValue('#sAddrIn') === '') await page.fill('#sAddrIn', server);
  await page.click('#sGo');
  await page.waitForSelector('#app:not([hidden])', { timeout: 15000 });
  await page.evaluate(() => { location.hash = '#/society'; });
  await page.waitForTimeout(2500);
  await page.screenshot({ path: `${out}/${tag}-society.png`, fullPage: true });
  const t = await page.textContent('#view'); if (/undefined|NaN|\[object/.test(t)) console.log('bad text', t.match(/.{0,40}(undefined|NaN).{0,40}/)?.[0]);
  await ctx.close();
}
await b.close();
console.log(JSON.stringify(w.lore.info().lessons.map((l) => l.text)));
app.stop(); rmSync(dir, { recursive: true, force: true });
process.exit(0);
