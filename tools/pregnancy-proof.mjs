// Panel proof (imad 2026-11-26: "on expecting baby it should have the progression percentage"): a woman with a partner set 62 % of the
// way, her card on People and her person page, in dark mode. Usage: ADMIN_TOKEN=... node tools/pregnancy-proof.mjs <server> <outdir>
import { createRequire } from 'node:module';
import { mkdirSync } from 'node:fs';
import WebSocket from 'ws';
import { encode, decode } from '@msgpack/msgpack';
const { chromium } = createRequire(import.meta.url)('playwright');
const [server, out] = process.argv.slice(2);
mkdirSync(out, { recursive: true });
const ws = new WebSocket(server.replace(/^http/, 'ws') + '/ws');
await new Promise((r) => ws.on('open', r));
ws.send(encode({ t: 'hi', v: 1, token: process.env.ADMIN_TOKEN, name: 'proof' }));
const answers = new Map();
ws.on('message', (d) => { const m = decode(d); if (m.t === 'admr') answers.set(m.id, m); });
let aid = 100;
const adm = async (c) => { const id = ++aid; ws.send(encode({ t: 'adm', id, c })); for (let k = 0; k < 80 && !answers.has(id); k++) await new Promise((r) => setTimeout(r, 100)); const a = answers.get(id); if (a && a.ok === false) console.log('admin error', c.cmd, JSON.stringify(a).slice(0, 300)); return a?.data; };
const people = (await adm({ cmd: 'agents' })) ?? [];
const list = Array.isArray(people) ? people : people.list ?? [];
const adults = list.filter((p) => !p.player && p.age >= 20 && p.age <= 40);
let she = null, he = null;
const pairs = [];
for (const f of adults.filter((p) => p.sex === 'f')) for (const m of adults.filter((p) => p.sex === 'm')) pairs.push([f, m]);
for (let round = 0; round < 3 && !he; round++) for (const [f, m] of pairs) {
  // A real proposal: his own answer decides (the rules stay), so try pairs until one says yes.
  console.log('ask', f.name, '->', m.name, JSON.stringify(await adm({ cmd: 'order', id: f.id, kind: 'marry', target: m.name })));
  for (let k = 0; k < 90; k++) { const a = await adm({ cmd: 'agent', id: f.id }); if (a?.partner) { she = f; he = m; break; } if (!a?.task) break; await new Promise((r) => setTimeout(r, 1000)); }
  if (he) break;
}
console.log('couple', she?.name, he?.name);
console.log('set', JSON.stringify(await adm({ cmd: 'agentSet', id: she.id, set: { pregnant: 62 } })));
const b = await chromium.launch();
const ctx = await b.newContext({ colorScheme: 'dark', viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
const page = await ctx.newPage();
page.on('pageerror', (e) => console.log('pageerror', e.message));
await page.goto(server + '/panel/');
await page.waitForSelector('#sTokBox');
await page.evaluate(() => { document.getElementById('sTokBox').open = true; });
await page.waitForSelector('#sTokIn', { state: 'visible' });
await page.fill('#sTokIn', process.env.ADMIN_TOKEN);
if (await page.inputValue('#sAddrIn') === '') await page.fill('#sAddrIn', server);
await page.click('#sGo');
await page.waitForSelector('#app:not([hidden])', { timeout: 15000 });
await page.evaluate(() => { location.hash = '#/people'; });
await page.waitForTimeout(2500);
await page.screenshot({ path: `${out}/p1-people-expecting-percent.png` });
await page.evaluate((h) => { location.hash = h; }, `#/person/${she.id}`);
await page.waitForTimeout(2500);
await page.screenshot({ path: `${out}/p2-person-expecting-percent.png` });
console.log('text', (await page.textContent('#view')).match(/Expecting[^%]*%[^.]{0,20}/)?.[0]);
await b.close(); ws.close();
