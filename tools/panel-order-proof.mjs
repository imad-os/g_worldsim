import { createRequire } from 'node:module';
const { chromium } = createRequire(import.meta.url)('playwright');
const [server, out] = process.argv.slice(2);
const b = await chromium.launch(); const page = await b.newPage({ viewport: { width: 1280, height: 1000 } });
page.on('pageerror', (e) => console.log('[pageerror]', e.message));
await page.goto(server + '/panel/');
await page.fill('#token', process.env.ADMIN_TOKEN); await page.click('#go');
await page.waitForTimeout(2500);
// open the first person
const ok = await page.evaluate(() => { const el = document.querySelector('[data-id], [data-open]'); if (el) { el.click(); return el.outerHTML.slice(0, 120); } return null; });
console.log('opened', ok);
await page.waitForSelector('#personCard:not([hidden])', { timeout: 10000 });
const names = await page.evaluate(() => [...document.querySelectorAll('#pOrdNames option')].map((o) => o.value));
console.log('names', names);
await page.selectOption('#pOrd', 'follow'); await page.fill('#pOrdWho', names[0]); await page.click('#pOrdGo');
await page.waitForTimeout(1500);
console.log('chat:', await page.textContent('#pChat'), '| sum:', await page.textContent('#pSum'));
await page.locator('#personCard').screenshot({ path: out });
await b.close();
