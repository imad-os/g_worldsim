// Screenshots of the control panel on a desktop and a phone: node tools/panel-proof.mjs <server> <outdir> (ADMIN_TOKEN set).
// With PANEL=<url of the panel page> it opens that page (e.g. a copy served from another origin, like GitHub Pages) with ?server=.
import { createRequire } from 'node:module';
import { mkdirSync } from 'node:fs';
const { chromium } = createRequire(import.meta.url)('playwright');
const [server, out] = process.argv.slice(2);
mkdirSync(out, { recursive: true });
const pageUrl = process.env.PANEL ? `${process.env.PANEL}?server=${encodeURIComponent(server)}` : server + '/panel/';
const b = await chromium.launch();
const errors = [];
for (const [tag, vp] of [['desk', { width: 1440, height: 900 }], ['phone', { width: 390, height: 844, isMobile: true, hasTouch: true }]]) {
  const ctx = await b.newContext({ colorScheme: process.env.LIGHT ? 'light' : 'dark', viewport: { width: vp.width, height: vp.height }, isMobile: vp.isMobile, hasTouch: vp.hasTouch, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  page.on('pageerror', (e) => errors.push(`${tag} pageerror ${e.message}`));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(`${tag} console ${m.text()}`); });
  await page.goto(pageUrl);
  await page.waitForSelector('#sTokIn', { state: 'visible' });
  if (tag === 'desk') await page.screenshot({ path: `${out}/${tag}-signin.png` });
  await page.fill('#sTokIn', process.env.ADMIN_TOKEN);
  if (await page.inputValue('#sAddrIn') === '') await page.fill('#sAddrIn', server);
  await page.click('#sGo');
  await page.waitForSelector('#app:not([hidden])', { timeout: 15000 });
  const pages = tag === 'desk'
    ? ['dashboard', 'people', 'person', 'person-talk', 'world', 'zombies', 'crafting', 'rules', 'ai', 'players', 'events', 'server', 'settings']
    : ['dashboard', 'people', 'person', 'world', 'events', 'more'];
  for (const p of pages) {
    if (p === 'person' || p === 'person-talk') {
      const id = await page.evaluate(() => location.hash.startsWith('#/person/') ? location.hash.split('/')[2] : null) ?? await page.evaluate(async () => {
        await new Promise((r) => setTimeout(r, 100)); const el = document.querySelector('[href^="#/person/"]'); return el ? el.getAttribute('href').split('/')[2] : null; });
      if (!id) { errors.push(`${tag} no person link`); continue; }
      await page.evaluate((h) => { location.hash = h; }, `#/person/${id}`);
      if (p === 'person-talk') { await page.waitForTimeout(800); await page.click('#xTabs [data-t="talk"]'); }
    } else if (p === 'more') {
      await page.click('#moreBtn');
    } else await page.evaluate((h) => { location.hash = h; }, `#/${p}`);
    await page.waitForTimeout(p === 'dashboard' ? 3500 : 1800);
    await page.screenshot({ path: `${out}/${tag}-${p}.png`, fullPage: tag === 'desk' });
    const t = await page.textContent('#view'); if (/undefined|NaN|\[object/.test(t)) errors.push(`${tag} ${p}: text has undefined/NaN: ${t.match(/.{0,40}(undefined|NaN|\[object).{0,40}/)?.[0]}`);
  }
  if (tag === 'desk') { // a "?" help popover
    await page.evaluate(() => { location.hash = '#/dashboard'; }); await page.waitForTimeout(1500);
    await page.click('#view .hq >> nth=0'); await page.waitForTimeout(300);
    await page.screenshot({ path: `${out}/desk-help.png` });
  }
  await ctx.close();
}
await b.close();
console.log(errors.length ? errors.join('\n') : 'no page errors');
