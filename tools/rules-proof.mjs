// Strict rules both ways, in the real panel: node tools/rules-proof.mjs <server> <outdir> [wait seconds] (ADMIN_TOKEN set).
// Adds "you must hunt every day" for everyone and "you never talk to <first person, misspelt>" for the second person through the
// Rules page, waits (a game day at --speed 100), then screenshots the Rules page (how each rule was understood, who kept it)
// and the second person's Rules tab.
import { createRequire } from 'node:module';
import { mkdirSync } from 'node:fs';
const { chromium } = createRequire(import.meta.url)('playwright');
const [server, out, wait = '100'] = process.argv.slice(2);
mkdirSync(out, { recursive: true });
const b = await chromium.launch();
const page = await b.newPage({ viewport: { width: 1280, height: 900 }, deviceScaleFactor: 2 });
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
await page.goto(server + '/panel/');
await page.waitForSelector('#sTokBox');
await page.evaluate(() => { document.getElementById('sTokBox').open = true; });
await page.fill('#sTokIn', process.env.ADMIN_TOKEN);
if (await page.inputValue('#sAddrIn') === '') await page.fill('#sAddrIn', server);
await page.click('#sGo');
await page.waitForSelector('#app:not([hidden])', { timeout: 15000 });
await page.evaluate(() => { location.hash = '#/rules'; });
await page.waitForSelector('#rWho .who');
const people = await page.evaluate(() => [...document.querySelectorAll('#rWho .who')].slice(1).map((x) => ({ id: x.dataset.id, name: x.textContent.replace(/\s*\d+\/\d+\s*$/, '').trim() })));
const [p1, p2] = people;
const slip = p1.name.slice(0, 1) + p1.name.slice(2, 3) + p1.name.slice(1, 2) + p1.name.slice(3);
await page.fill('#rText', 'you must hunt every day'); await page.click('#rAdd');
await page.waitForFunction(() => /hunt/.test(document.getElementById('rList').textContent), null, { timeout: 20000 }).catch(() => {});
console.log('after the first add:', (await page.textContent('#rList')).replace(/\s+/g, ' '), '| toast:', await page.evaluate(() => document.body.innerText.match(/.*(Rule added|error|unknown).*/i)?.[0] ?? ''));
await page.click(`#rWho .who[data-id="${p2.id}"]`); await page.waitForFunction((id) => document.querySelector(`#rWho .who.on`)?.dataset.id === id, p2.id);
await page.fill('#rText', `you never talk to ${slip}`); await page.click('#rAdd'); await page.waitForTimeout(1500);
console.log('rules added; waiting', wait, 's');
await page.waitForTimeout(Number(wait) * 1000);
await page.evaluate(() => { location.hash = '#/dashboard'; }); await page.waitForTimeout(500);
await page.evaluate(() => { location.hash = '#/rules'; }); await page.waitForSelector('#rWho .who'); await page.waitForTimeout(800);
await page.click('#rWho .who[data-id="-1"]'); await page.waitForTimeout(800);
await page.screenshot({ path: `${out}/1-rules-everyone.png`, fullPage: true });
console.log('everyone:', (await page.textContent('#rList')).replace(/\s+/g, ' '));
await page.click(`#rWho .who[data-id="${p2.id}"]`); await page.waitForTimeout(500);
console.log(`${p2.name}:`, (await page.textContent('#rList')).replace(/\s+/g, ' '));
await page.evaluate((id) => { location.hash = `#/person/${id}`; }, p2.id); await page.waitForTimeout(1200);
await page.click('#xTabs [data-t="rules"]'); await page.waitForTimeout(1500);
await page.screenshot({ path: `${out}/2-person-rules.png`, fullPage: true });
console.log('errors:', errors.length ? errors : 'none');
await b.close();
