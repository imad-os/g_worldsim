// The AI brain page's saved brains: a scrolling list, a Test button per brain and "Test them all" (fastest first).
//   node tools/brains-proof.mjs <outdir>
// A fake OpenAI-compatible server answers with a different delay per model (one always fails), the real server and panel do the rest.
import { createRequire } from 'node:module';
import { createServer } from 'node:http';
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { App } from '../packages/server/dist/app.js';
import { DEFAULTS } from '../packages/server/dist/config.js';
import { Logger } from '../packages/server/dist/log.js';
const { chromium } = createRequire(import.meta.url)('playwright');
const out = process.argv[2] ?? 'brains-proof'; mkdirSync(out, { recursive: true });

const DELAY = { 'qwen2.5:1.5b': 350, 'llama3.2:3b': 900, 'gemma2:9b': 2100, 'qwen2.5:14b': 3400, 'mistral:7b': 1500, 'phi3:3.8b': 700, 'broken-model': -1 };
const fake = createServer((req, res) => {
  let body = '';
  req.on('data', (c) => { body += c; });
  req.on('end', () => {
    const model = (() => { try { return JSON.parse(body).model; } catch { return ''; } })(), d = DELAY[model] ?? 500;
    if (d < 0) { res.writeHead(500, { 'content-type': 'application/json' }); res.end(JSON.stringify({ error: { message: 'model failed to load' } })); return; }
    setTimeout(() => {
      res.writeHead(200, { 'content-type': 'application/json' });
      res.end(JSON.stringify({ choices: [{ message: { content: `(${model}) Hello, stranger. Keep your voice down, the dead hear well in these ruins.` } }] }));
    }, d);
  });
});
await new Promise((r) => fake.listen(0, '127.0.0.1', r));
const fakeUrl = `http://127.0.0.1:${fake.address().port}/v1`;

const ADMIN = 'admin-token-0123456789abcdef', dir = mkdtempSync(join(tmpdir(), 'ws-br-'));
const cfg = { ...structuredClone(DEFAULTS), dataDir: dir, port: 0, snapshotEverySec: 3600, capacity: 2048, auth: { projectId: 'none' } };
cfg.tunnel = { provider: 'none', bin: { ngrok: '/nonexistent/ngrok' } }; cfg.ai = { ...cfg.ai, provider: 'none' };
const app = new App(cfg, { adminToken: ADMIN, viewers: new Map() }, new Logger('error', undefined, true));
await app.start();
for (const model of Object.keys(DELAY)) await app.adminCmd({ cmd: 'brainSave', name: model, provider: 'openai', url: fakeUrl, model }, 'owner', true);
const port = app.net.http.address().port, server = `http://127.0.0.1:${port}`;
const b = await chromium.launch();
const result = {};
for (const [tag, vp] of [['desk', { width: 1440, height: 900 }], ['phone', { width: 390, height: 844, isMobile: true, hasTouch: true }]]) {
  const ctx = await b.newContext({ colorScheme: 'dark', viewport: vp, isMobile: vp.isMobile, hasTouch: vp.hasTouch, deviceScaleFactor: 2 });
  const page = await ctx.newPage();
  page.on('pageerror', (er) => console.log('pageerror', er.message));
  await page.goto(server + '/panel/');
  await page.waitForSelector('#sTokBox');
  await page.evaluate(() => { document.getElementById('sTokBox').open = true; });
  await page.fill('#sTokIn', ADMIN);
  if (await page.inputValue('#sAddrIn') === '') await page.fill('#sAddrIn', server);
  await page.click('#sGo');
  await page.waitForSelector('#app:not([hidden])', { timeout: 15000 });
  await page.evaluate(() => { location.hash = '#/ai'; });
  await page.waitForSelector('#bList .li', { timeout: 15000 });
  const box = await page.$eval('#bList', (el) => ({ client: el.clientHeight, scroll: el.scrollHeight }));
  if (tag === 'desk') {
    // One brain alone first.
    await page.click('[data-btest]');
    await page.waitForSelector('#bList .btry .tag', { timeout: 15000 });
    await page.screenshot({ path: `${out}/${tag}-one-test.png` });
  }
  await page.click('#bTestAll');
  await page.waitForFunction(() => /answered/.test(document.getElementById('bTestNote')?.textContent ?? ''), null, { timeout: 60000 });
  const order = await page.$$eval('#bList .li', (els) => els.map((el) => [el.querySelector('b')?.textContent, el.querySelector('.btry .tag')?.textContent]));
  result[tag] = { box, order, note: await page.textContent('#bTestNote') };
  const card = await page.$('#bList');
  await card.evaluate((el) => el.closest('.card')?.scrollIntoView({ block: 'start' }));
  await page.waitForTimeout(300);
  await page.screenshot({ path: `${out}/${tag}-test-all.png` });
  await page.$eval('#bList', (el) => { el.scrollTop = el.scrollHeight; });
  await page.waitForTimeout(200);
  await page.screenshot({ path: `${out}/${tag}-scrolled.png` });
  await ctx.close();
}
await b.close();
console.log(JSON.stringify(result, null, 1));
writeFileSync(`${out}/result.json`, JSON.stringify(result, null, 1));
app.stop(); fake.close(); rmSync(dir, { recursive: true, force: true });
