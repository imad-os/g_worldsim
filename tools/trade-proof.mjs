// Trade proof (imad 2026-11-27): two TVs (imad and sara) stand together, imad asks, sara accepts on her invite screen,
// both put things on their side, both accept, the bags swap. Screenshots of the invite, the trade screen and the result.
// ADMIN_TOKEN=... node tools/trade-proof.mjs <server> <sdk.js> <outdir>
import { createRequire } from 'node:module';
import fs from 'node:fs';
import WebSocket from 'ws';
import { encode, decode } from '@msgpack/msgpack';
const { chromium } = createRequire(import.meta.url)('playwright');
const [server, sdkPath, out] = process.argv.slice(2);
fs.mkdirSync(out, { recursive: true });
const ws = new WebSocket(server.replace(/^http/, 'ws') + '/ws');
await new Promise((r) => ws.on('open', r));
ws.send(encode({ t: 'hi', v: 1, token: process.env.ADMIN_TOKEN, name: 'proof' }));
const answers = new Map(); let aid = 100;
ws.on('message', (d) => { const m = decode(d); if (m.t === 'admr') answers.set(m.id, m); });
const adm = async (c) => { const id = ++aid; ws.send(encode({ t: 'adm', id, c })); for (let k = 0; k < 80 && !answers.has(id); k++) await new Promise((r) => setTimeout(r, 100)); return answers.get(id); };
await new Promise((r) => setTimeout(r, 800));
await adm({ cmd: 'autoJoin', on: false });
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
async function tv(name) {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 720 }, colorScheme: 'dark' });
  const page = await ctx.newPage();
  page.on('pageerror', (e) => console.log(`[${name} pageerror]`, e.message));
  await page.route(/mypc-sdk\.js/, (r) => r.fulfill({ contentType: 'text/javascript', body: fs.readFileSync(sdkPath) }));
  await page.goto(`${server}/app/?server=${encodeURIComponent(server)}&tier=low&dev`);
  const code = await page.waitForFunction(() => { const s = document.getElementById('screen'); if (s && s.hidden) return 'in'; const e = document.querySelector('.code'); return e && e.textContent.replace(/\s/g, ''); }, null, { timeout: 30000 }).then((h) => h.jsonValue());
  if (code !== 'in') console.log(name, 'approve', JSON.stringify((await adm({ cmd: 'approve', code, name }))?.data ?? null));
  await page.waitForFunction(() => document.getElementById('screen').hidden, null, { timeout: 30000 });
  await page.waitForTimeout(5000);
  for (let k = 0; k < 3 && await page.evaluate(() => document.getElementById('gmenu')?.hidden === false); k++) { await page.keyboard.press('Escape'); await page.waitForTimeout(400); }
  const me = await page.evaluate(() => window.__dev.dbg().meId);
  return { page, me, do: (a, text) => page.evaluate(([a, t]) => window.__dev.do(a, t), [a, text]), menu: () => page.evaluate(() => window.__dev.map().open) };
}
const A = await tv('imad'), B = await tv('sara');
console.log('ids', A.me, B.me);
// Stand together: sara next to imad.
const pos = await A.page.evaluate(() => window.__dev.me());
for (let k = 0; k < 6; k++) {
  await adm({ cmd: 'agentMove', id: B.me, x: pos[0] + 2, y: pos[1] });
  await B.page.waitForTimeout(1200);
  const p = await B.page.evaluate(() => window.__dev.me());
  if (Math.hypot(p[0] - pos[0] - 2, p[1] - pos[1]) < 1.5) break;
}
console.log('bags', JSON.stringify((await adm({ cmd: 'agentSet', id: A.me, set: { inv: { wood: 8, bow: 1, arrows: 12 } } }))?.data ?? null), JSON.stringify((await adm({ cmd: 'agentSet', id: B.me, set: { inv: { ore: 4, leather: 3 } } }))?.data ?? null));
await A.page.waitForTimeout(2500);
// imad asks; sara's TV opens the invite screen by itself.
await A.do('trade', `ask:${B.me}`);
await B.page.waitForTimeout(1500);
console.log('sara page', await B.menu());
await B.page.screenshot({ path: `${out}/1-invite-sara.png` });
await B.page.keyboard.press('Enter'); // first row: Trade
await A.page.waitForTimeout(1500);
console.log('pages', await A.menu(), await B.menu());
await A.do('trade', 'put:wood:5'); await A.do('trade', 'put:bow:1');
await B.do('trade', 'put:ore:3'); await B.do('trade', 'put:leather:1');
await A.page.waitForTimeout(1200);
await A.page.screenshot({ path: `${out}/2-trade-imad.png` });
await A.do('trade', 'ok:1');
await B.page.waitForTimeout(1200);
await B.page.screenshot({ path: `${out}/3-trade-sara-imad-accepted.png` });
await B.do('trade', 'ok:1');
await A.page.waitForTimeout(1500);
await A.page.screenshot({ path: `${out}/4-done-imad.png` });
const bagA = (await adm({ cmd: 'agent', id: A.me }))?.data, bagB = (await adm({ cmd: "agent", id: B.me }))?.data;
const inv = (r) => JSON.stringify(r?.inv ?? Object.keys(r ?? {}));
console.log('after', inv(bagA), inv(bagB), 'menus', await A.menu(), await B.menu());
fs.writeFileSync(`${out}/result.json`, JSON.stringify({ imad: bagA?.inv ?? null, sara: bagB?.inv ?? null }, null, 1));
await adm({ cmd: 'autoJoin', on: true });
await browser.close(); ws.close();
