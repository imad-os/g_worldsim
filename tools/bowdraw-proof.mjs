// Browser proof (imad 2026-11-27): the bow in first person and on my own character in third person: held at my side, the arrow
// nocked and the string pulled back while aiming, the string snapping forward and the arrow leaving on release.
// Usage: ADMIN_TOKEN=... node tools/bowdraw-proof.mjs <server> <sdk.js> <outdir>
import { createRequire } from 'node:module';
const { chromium } = createRequire(import.meta.url)('playwright');
import WebSocket from 'ws';
import { encode, decode } from '@msgpack/msgpack';
const [server, sdkPath, out] = process.argv.slice(2);
const fs = await import('node:fs');
fs.mkdirSync(out, { recursive: true });
const ws = new WebSocket(server.replace(/^http/, 'ws') + '/ws');
await new Promise((r) => ws.on('open', r));
ws.send(encode({ t: 'hi', v: 1, token: process.env.ADMIN_TOKEN, name: 'proof' }));
const answers = new Map();
ws.on('message', (d) => { const m = decode(d); if (m.t === 'admr') answers.set(m.id, m); });
let aid = 100;
const adm = async (c) => { const id = ++aid; ws.send(encode({ t: 'adm', id, c })); for (let k = 0; k < 80 && !answers.has(id); k++) await new Promise((r) => setTimeout(r, 100)); const a = answers.get(id); if (a && a.ok === false) console.log('admin error', c.cmd, JSON.stringify(a).slice(0, 300)); return a?.data; };
await adm({ cmd: 'aiSet', provider: 'none' });
await adm({ cmd: 'travel', open: true });
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--autoplay-policy=no-user-gesture-required'] });
const page = await browser.newPage({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1 });
page.on('pageerror', (e) => console.log('[pageerror]', e.message));
await page.addInitScript(() => {
  const btn = () => ({ pressed: false, touched: false, value: 0 });
  const pad = { id: 'Xbox 360 Controller (STANDARD GAMEPAD Vendor: 045e Product: 028e)', index: 0, connected: true, mapping: 'standard', buttons: Array.from({ length: 17 }, btn), axes: [0, 0, 0, 0], timestamp: 1 };
  window.__axis = (x, y) => { pad.axes[0] = x; pad.axes[1] = y; pad.timestamp++; };
  Object.defineProperty(navigator, 'getGamepads', { configurable: true, writable: true, value: () => [pad, null, null, null] });
});
await page.route(/mypc-sdk\.js/, (r) => r.fulfill({ contentType: 'text/javascript', body: fs.readFileSync(sdkPath) }));
await page.goto(`${server}/app/?server=${encodeURIComponent(server)}&tier=mid&dev`);
const code = await page.waitForFunction(() => { const s = document.getElementById('screen'); if (s && s.hidden) return 'in'; const e = document.querySelector('.code'); return e && e.textContent.replace(/\s/g, ''); }, null, { timeout: 30000 }).then((h) => h.jsonValue());
if (code !== 'in') await adm({ cmd: 'approve', code, name: 'imad' });
await page.waitForFunction(() => document.getElementById('screen').hidden, null, { timeout: 30000 });
await page.waitForTimeout(5000);
const key = async (k, n = 1) => { for (let i = 0; i < n; i++) { await page.keyboard.press(k); await page.waitForTimeout(220); } };
const menu = () => page.evaluate(() => document.getElementById('gmenu')?.hidden === false ? [...document.querySelectorAll('#gmenu .mt, #gmenu .mr')].map((e) => (e.classList.contains('on') ? '>' : '') + e.textContent).join(' | ') : '');
const note = () => page.evaluate(() => document.getElementById('note').hidden ? '' : document.getElementById('note').textContent);
const dev = (f, ...a) => page.evaluate(([f, a]) => window.__dev[f](...a), [f, a]);
if ((await menu()).includes('Save')) { for (let k = 0; k < 10 && !(await menu()).includes('>Save'); k++) await key('ArrowDown'); await key('Enter'); await page.waitForTimeout(600); }
if (await menu()) await key('Escape');
const me = (await dev('dbg')).meId;
const town = 'town';
const moveMe = async (x, y) => { for (let k = 0; k < 6; k++) { await adm({ cmd: 'agentMove', id: me, map: town, x, y }); await page.waitForTimeout(900); const p = await dev('me'); if (Math.hypot(p[0] - x, p[1] - y) < 3) return p; } return dev('me'); };


const shot = (n) => page.screenshot({ path: `${out}/${n}.png` });
let p0 = await dev('me');
p0 = await moveMe(Math.round(p0[0] - 20), Math.round(p0[1] + 30));
await adm({ cmd: 'agentSet', id: me, set: { 'bag.bow': 1, 'bag.arrows': 30 } });
await dev('do', 'equip', 'weapon:-');
await dev('do', 'equip', 'ranged:bow');
await page.waitForTimeout(1500);
for (const view of ['first', 'third']) {
  if (view === 'third') { const q = await dev('me'); await moveMe(Math.round(q[0] + 50), Math.round(q[1] - 80)); }
  await dev('cam', view); await page.waitForTimeout(300); await dev('cam', view);
  await dev('yaw', 0.6); await page.waitForTimeout(2000);
  await dev('do', 'equip', 'weapon:bow'); await page.waitForTimeout(1500);
  await shot(`${view}-1-bow-at-my-side`);
  await dev('act', 'aim'); await page.waitForTimeout(120);
  await shot(`${view}-2-arrow-nocked`);
  await page.waitForTimeout(1200);
  await shot(`${view}-3-full-draw`);
  await dev('act', 'aim', false);
  await shot(`${view}-4-release`);
  await page.waitForTimeout(250);
  await shot(`${view}-5-after-the-shot`);
  await page.waitForTimeout(1500);
}
await browser.close();
ws.close();
