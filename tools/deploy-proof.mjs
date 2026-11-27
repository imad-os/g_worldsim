// Panel Server page around a Deploy: node tools/deploy-proof.mjs <server> <outdir> [click] (ADMIN_TOKEN set, dark mode).
// Shot 1 = the page as it is (the last deploy / restart); with "click": press Deploy, shots while it restarts and once it is back.
import { createRequire } from 'node:module';
import { mkdirSync } from 'node:fs';
const { chromium } = createRequire(import.meta.url)('playwright');
const [server, out, click] = process.argv.slice(2);
mkdirSync(out, { recursive: true });
const b = await chromium.launch();
const ctx = await b.newContext({ colorScheme: 'dark', viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 2 });
const page = await ctx.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(`pageerror ${e.message}`));
page.on('dialog', (d) => d.accept());
await page.goto(server + '/panel/');
await page.waitForSelector('#sTokBox, #sTokIn');
await page.evaluate(() => { const d = document.getElementById('sTokBox'); if (d) d.open = true; });
await page.fill('#sTokIn', process.env.ADMIN_TOKEN);
if (await page.inputValue('#sAddrIn') === '') await page.fill('#sAddrIn', server);
await page.click('#sGo');
await page.waitForSelector('#app:not([hidden])', { timeout: 15000 });
await page.evaluate(() => { location.hash = '#/server'; });
await page.waitForSelector('#cUpdate');
await page.waitForTimeout(2500);
const shot = async (n) => { const el = await page.$('#cJob'); await (await el.evaluateHandle((e) => e.closest('.card') ?? e)).asElement().screenshot({ path: `${out}/${n}.png` }); console.log(n, (await page.textContent('#cJob')).replace(/\s+/g, ' ').slice(0, 300)); };
await shot('1-before');
if (click) {
  await page.click('#cUpdate');
  await page.waitForFunction(() => /restarting|saving and stopping|starting|back up|back on the old code|failed/.test(document.getElementById('cJob')?.textContent ?? ''), null, { timeout: 120000 });
  await shot('2-restarting');
  await page.waitForFunction(() => /back up|back on the old code|did not come back/.test(document.getElementById('cJob')?.textContent ?? ''), null, { timeout: 300000 });
  await page.waitForTimeout(1000);
  await shot('3-after');
}
console.log(errors.length ? errors.join('\n') : 'no page errors');
await b.close();
