// Proof of the panel's Analysis page: node tools/analysis-proof.mjs <outdir>
// Starts a real server in-process (fresh world, speed 20 for a while so the logs fill), a fake model that answers from
// the prompt it got, opens the panel, ticks logs, previews, asks, and takes desktop + phone screenshots.
import { createRequire } from 'node:module';
import { createServer } from 'node:http';
import { mkdirSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
const { chromium } = createRequire(import.meta.url)('playwright');
const { App } = await import('../packages/server/dist/app.js');
const { DEFAULTS } = await import('../packages/server/dist/config.js');
const { Logger } = await import('../packages/server/dist/log.js');
const out = process.argv[2] ?? 'analysis-proof';
mkdirSync(out, { recursive: true });
const TOKEN = 'proof-admin-token-0123456789';
let seen = '';
const fake = createServer((req, res) => {
  let b = ''; req.on('data', (d) => (b += d)); req.on('end', () => {
    const p = JSON.parse(b).messages.map((m) => m.content).join('\n'); seen = p;
    const st = JSON.parse(p.match(/WORLD STATS NOW \(JSON\):\n(.*)\n/)[1]);
    const R = st.reproduction, why = Object.entries(R.women18plus).map(([k, v]) => `${v} × ${k}`).join(', ');
    const text = `Nobody is expecting a baby right now, mostly because ${why || 'there are no women of 18 or more'}.\n\n- ${R.singleMen} single men and ${R.singleWomen} single women; ${R.possibleSinglePairs} possible pairs among them.\n- Couples need 4 talks first: the "Talks and clans" log shows how often they meet.\n\nWhat you could change: give them time to talk (fewer jobs at night), or order two of them to court.`;
    res.setHeader('content-type', 'application/json'); setTimeout(() => res.end(JSON.stringify({ message: { role: 'assistant', content: text } })), 900);
  });
});
await new Promise((ok) => fake.listen(0, '127.0.0.1', ok));
const dir = mkdtempSync(join(tmpdir(), 'ws-anproof-'));
const cfg = { ...structuredClone(DEFAULTS), dataDir: dir, port: 0, snapshotEverySec: 3600, auth: { projectId: 'none' } };
cfg.tunnel = { provider: 'none', bin: { ngrok: '/nonexistent/ngrok' } };
cfg.ai = { ...cfg.ai, provider: 'none' };
const app = new App(cfg, { adminToken: TOKEN, viewers: new Map() }, new Logger('error', undefined, true));
await app.start();
await app.adminCmd({ cmd: 'brainSave', name: 'Fake analyst', provider: 'ollama', url: `http://127.0.0.1:${fake.address().port}`, model: 'proof' }, 'admin', true);
await app.adminCmd({ cmd: 'speed', speed: 20 }, 'admin', true).catch(() => {});
await new Promise((r) => setTimeout(r, 12000));
const server = `http://127.0.0.1:${app.net.http.address().port}`;
const b = await chromium.launch();
const errors = [];
for (const [tag, vp] of [['desk', { width: 1440, height: 900 }], ['phone', { width: 390, height: 844, isMobile: true, hasTouch: true }]]) {
  const ctx = await b.newContext({ viewport: { width: vp.width, height: vp.height }, isMobile: vp.isMobile, hasTouch: vp.hasTouch, deviceScaleFactor: 2 });
  const page = await ctx.newPage();
  page.on('pageerror', (e) => errors.push(`${tag} pageerror ${e.message}`));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(`${tag} console ${m.text()}`); });
  await page.goto(server + '/panel/');
  await page.waitForSelector('#sTokBox');
  await page.waitForTimeout(1500);
  await page.evaluate(() => { document.getElementById('sTokBox').open = true; });
  await page.fill('#sTokIn', TOKEN);
  await page.click('#sGo');
  await page.waitForSelector('#app:not([hidden])', { timeout: 15000 });
  await page.evaluate(() => { location.hash = '#/analysis'; });
  await page.waitForSelector('#anTypes input');
  await page.waitForTimeout(800);
  if (tag === 'desk') {
    await page.screenshot({ path: `${out}/1-stats.png`, fullPage: true });
    await page.check('#anTypes input[value="social"]');
    await page.selectOption('#anBrain', { label: 'Fake analyst · proof' });
    await page.fill('#anQ', 'Why are people refusing to reproduce?');
    await page.click('#anPrev');
    await page.waitForSelector('#anPreview details');
    await page.screenshot({ path: `${out}/2-preview.png` });
    await page.click('#anGo');
    await page.waitForSelector('.an-ans', { timeout: 30000 });
    await page.waitForTimeout(300);
    await page.locator('#anChat').screenshot({ path: `${out}/3-answer.png` });
    await page.screenshot({ path: `${out}/3-answer-page.png` });
  } else {
    await page.screenshot({ path: `${out}/4-phone.png`, fullPage: true });
  }
  const t = await page.textContent('#view'); if (/undefined|NaN|\[object/.test(t)) errors.push(`${tag}: text has undefined/NaN: ${t.match(/.{0,40}(undefined|NaN|\[object).{0,40}/)?.[0]}`);
  await ctx.close();
}
await b.close();
console.log('prompt sent:', seen.length, 'chars; has Everyone now:', seen.includes('LOG "Everyone now"'), '; has Talks:', seen.includes('LOG "Talks and clans"'));
console.log(errors.length ? 'ERRORS\n' + errors.join('\n') : 'no page errors');
await app.stop(); fake.close(); rmSync(dir, { recursive: true, force: true });
process.exit(errors.length ? 1 : 0);
