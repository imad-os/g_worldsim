// Proof for "add people / animals / zombies", kill counts and deleting a player:
// node tools/room-proof.mjs <server> <outdir> (ADMIN_TOKEN set; pairs a fake TV called "Kid" first).
import { createRequire } from 'node:module';
import { mkdirSync } from 'node:fs';
const require = createRequire(new URL('../packages/server/package.json', import.meta.url));
const { chromium } = createRequire(import.meta.url)('playwright');
const WebSocket = require('ws'); const { encode, decode } = require('@msgpack/msgpack');
const [server, out] = process.argv.slice(2);
mkdirSync(out, { recursive: true });
// A TV that pairs and joins by itself (auto join) as "Kid".
await new Promise((ok, fail) => {
  const ws = new WebSocket(server.replace('http', 'ws') + '/ws'); ws.binaryType = 'nodebuffer';
  ws.on('open', () => ws.send(encode({ t: 'pair', v: 1, name: 'Kid', dev: 'Samsung TV' })));
  ws.on('message', (b) => { const m = decode(b); if (m.t === 'paired') { const w2 = new WebSocket(server.replace('http', 'ws') + '/ws'); w2.binaryType = 'nodebuffer';
    w2.on('open', () => w2.send(encode({ t: 'hi', v: 1, token: m.token, name: 'Kid' })));
    w2.on('message', (b2) => { const x = decode(b2); if (x.t === 'wel') w2.send(encode({ t: 'join' })); if (x.t === 'you') { console.log('Kid joined', x.map, Math.round(x.x), Math.round(x.y)); w2.close(); ws.close(); ok(); } if (x.t === 'err') { console.log('TV error', x.code); fail(new Error(x.code)); } }); } });
  setTimeout(() => fail(new Error('pair timeout')), 15000);
});
// Admin commands over the same protocol as the panel.
const admin = (c) => new Promise((ok, fail) => {
  const ws = new WebSocket(server.replace('http', 'ws') + '/ws'); ws.binaryType = 'nodebuffer';
  ws.on('open', () => ws.send(encode({ t: 'hi', v: 1, token: process.env.ADMIN_TOKEN })));
  ws.on('message', (b) => { const m = decode(b); if (m.t === 'wel') ws.send(encode({ t: 'adm', id: 1, c })); if (m.t === 'admr') { ws.close(); m.ok ? ok(m.data) : fail(new Error(m.err)); } });
});
const b = await chromium.launch();
const page = await (await b.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 })).newPage();
const errors = [];
page.on('pageerror', (e) => errors.push('pageerror ' + e.message));
page.on('dialog', (d) => { console.log('confirm:', d.message()); void d.accept(); });
const toast = async () => { await page.waitForSelector('.toast', { timeout: 8000 }); const t = (await page.locator('.toast').last().textContent()).trim(); console.log('toast:', t); return t; };
await page.goto(server + '/panel/');
await page.waitForSelector('#sTokBox', { state: 'attached' }); await page.evaluate(() => { document.getElementById('sTokBox').open = true; });
await page.fill('#sTokIn', process.env.ADMIN_TOKEN);
if (await page.inputValue('#sAddrIn') === '') await page.fill('#sAddrIn', server);
await page.click('#sGo');
await page.waitForSelector('#app:not([hidden])', { timeout: 15000 });
// 1. People > Add a person
await page.evaluate(() => { location.hash = '#/people'; }); await page.waitForTimeout(2000);
await page.click('#pAdd'); await toast(); await page.waitForTimeout(1500);
await page.screenshot({ path: `${out}/1-people-added.png` });
// 2. Zombies & animals: wolves and bears "Now", then 3 zombies
await page.evaluate(() => { location.hash = '#/zombies'; }); await page.waitForTimeout(2500);
await page.fill('[data-am="town"][data-ak="3"]', '4'); await page.fill('[data-am="town"][data-ak="4"]', '3');
await page.click('[data-afill="town"]'); await toast(); await page.waitForTimeout(800);
await page.locator('#aMaps').scrollIntoViewIfNeeded(); await page.screenshot({ path: `${out}/2-animals-now.png` });
await page.fill('#zN', '3'); await page.click('#zGo'); await toast(); await page.waitForTimeout(800);
await page.evaluate(() => window.scrollTo(0, 0)); await page.screenshot({ path: `${out}/3-zombies-spawned.png` });
// Let the world run a while (fast) so people meet the wolves, bears and zombies.
await admin({ cmd: 'speed', speed: 60 }); await page.waitForTimeout(Number(process.env.RUN_MS ?? 60000)); await admin({ cmd: 'speed', speed: 1 });
const ks = (await admin({ cmd: 'agents' })).filter((p) => p.kills && (p.kills.animals || p.kills.zombies || p.kills.people || p.kills.beaten)).map((p) => `${p.name}: ${JSON.stringify(p.kills)}`);
console.log('kills:', ks.join(' | ') || 'none yet');
// 3. A person with kills
await page.evaluate(() => { location.hash = '#/people'; }); await page.waitForTimeout(1500);
await page.selectOption('#pSort', 'kills'); await page.waitForTimeout(800);
await page.screenshot({ path: `${out}/4-people-kills.png` });
const id = await page.evaluate(() => document.querySelector('.pcard[href^="#/person/"]')?.getAttribute('href')?.split('/')[2]);
await page.evaluate((h) => { location.hash = h; }, `#/person/${id}`); await page.waitForTimeout(2000);
await page.screenshot({ path: `${out}/5-person-kills.png`, fullPage: true });
// 4. Players & TVs: delete Kid
await page.evaluate(() => { location.hash = '#/players'; }); await page.waitForTimeout(2000);
await page.screenshot({ path: `${out}/6-players-before.png` });
await page.click('[data-del="Kid"]'); await toast(); await page.waitForTimeout(1500);
await page.screenshot({ path: `${out}/7-players-after.png` });
console.log(errors.length ? errors.join('\n') : 'no page errors');
await b.close();
