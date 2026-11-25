// Browser proof of horses (imad 2026-11-25): wild herds with quality effects, taming with one button, riding (trot / gallop).
// Usage: ADMIN_TOKEN=... node tools/horse-proof.mjs <server> <sdk.js> <outdir>
import { createRequire } from 'node:module';
const { chromium } = createRequire(import.meta.url)('playwright');
import WebSocket from 'ws';
import { encode, decode } from '@msgpack/msgpack';
const [server, sdkPath, out] = process.argv.slice(2);
const admin = process.env.ADMIN_TOKEN;
const fs = await import('node:fs');
fs.mkdirSync(out, { recursive: true });
const ws = new WebSocket(server.replace(/^http/, 'ws') + '/ws');
await new Promise((r) => ws.on('open', r));
ws.send(encode({ t: 'hi', v: 1, token: admin, name: 'proof' }));
const answers = new Map();
ws.on('message', (d) => { const m = decode(d); if (m.t === 'admr') answers.set(m.id, m); });
let aid = 100;
const adm = async (c) => { const id = ++aid; ws.send(encode({ t: 'adm', id, c })); for (let k = 0; k < 80 && !answers.has(id); k++) await new Promise((r) => setTimeout(r, 100)); const a = answers.get(id); if (a && a.ok === false) console.log('admin error', c.cmd, a.error); return a?.data; };
await adm({ cmd: 'aiSet', provider: 'none' });
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1 });
page.on('pageerror', (e) => console.log('[pageerror]', e.message));
page.on('console', (m) => { if (m.type() === 'warning' || m.type() === 'error') console.log('[console]', m.text()); });
await page.addInitScript(() => {
  const btn = () => ({ pressed: false, touched: false, value: 0 });
  const pad = { id: 'Xbox 360 Controller (STANDARD GAMEPAD Vendor: 045e Product: 028e)', index: 0, connected: true, mapping: 'standard', buttons: Array.from({ length: 17 }, btn), axes: [0, 0, 0, 0], timestamp: 1 };
  window.__press = (i, on) => { pad.buttons[i].pressed = on; pad.buttons[i].value = on ? 1 : 0; pad.timestamp++; };
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
const card = () => page.evaluate(() => document.getElementById('card').textContent);
// First entry: the look page. Save it as it is.
if ((await menu()).includes('Save')) { for (let k = 0; k < 10 && !(await menu()).includes('>Save'); k++) await key('ArrowDown'); await key('Enter'); await page.waitForTimeout(600); }
if (await menu()) await key('Escape');
const me = (await page.evaluate(() => window.__dev.dbg())).meId;
console.log('me', me);
// To the woods, a common herd there plus a rare and a legendary one next to me (the herds of the world are there too).
await adm({ cmd: 'agentMove', id: me, map: 'woods', x: 128, y: 128 });
await page.waitForTimeout(3000);
const at = await page.evaluate(() => window.__dev.me());
await adm({ cmd: 'horseSpawn', map: 'woods', x: at[0] + 10, y: at[1] - 3, n: 3, q: 2 });
await adm({ cmd: 'horseSpawn', map: 'woods', x: at[0] - 10, y: at[1] - 4, n: 3, q: 1 });
await adm({ cmd: 'horseSpawn', map: 'woods', x: at[0], y: at[1] + 11, n: 3, q: 0 });
await page.waitForTimeout(2500);
const hs = await adm({ cmd: 'horses', map: 'woods' });
console.log('horses on the woods:', hs.list.length, 'herds', hs.herds, hs.list.slice(0, 12).map((h) => `${h.name} ${h.quality} ${h.coat} spd ${h.speed} sta ${h.stamina} int ${h.intel} @${h.x},${h.y}`).join('; '));
// They ran from me at first; once settled, look at each herd from above (zoomed in).
await page.waitForTimeout(9000);
const all = (await adm({ cmd: 'horses', map: 'woods' })).list;
for (const [q, name] of [[2, 'legendary'], [1, 'rare'], [0, 'common']]) {
  const g = all.filter((h) => h.q === q && h.wild).sort((a, b) => b.herd - a.herd);
  const herd = g.filter((h) => h.herd === g[0].herd);
  const x = herd.reduce((s, h) => s + h.x, 0) / herd.length, y = herd.reduce((s, h) => s + h.y, 0) / herd.length;
  await page.evaluate(([x, y]) => window.__dev.look(x, y), [x, y]);
  if (q === 2) for (let k = 0; k < 4; k++) await page.evaluate(() => window.__dev.act('zoomIn'));
  await page.waitForTimeout(2500);
  await page.screenshot({ path: `${out}/1-herd-${name}.png` });
  console.log('herd', name, herd.map((h) => `${h.name} ${h.coat} ${h.mode}`).join(', '));
}
for (let k = 0; k < 4; k++) await page.evaluate(() => window.__dev.act('zoomOut'));
await page.evaluate(() => window.__dev.cam('third'));
console.log('card near horses:', await card());
// Taming: walk up to the nearest wild horse and press Horse (on the wheel / Actions; here the action directly) until it works.
let res = '', target = null;
for (let k = 0; k < 40 && !res.includes('tamed'); k++) {
  const list = (await adm({ cmd: 'horses', map: 'woods' })).list.filter((h) => h.wild);
  const pos = await page.evaluate(() => window.__dev.me());
  list.sort((a, b) => Math.hypot(a.x - pos[0], a.y - pos[1]) - Math.hypot(b.x - pos[0], b.y - pos[1]));
  target = list.find((h) => h.id === target?.id) ?? list[0];
  await adm({ cmd: 'agentMove', id: me, map: 'woods', x: target.x - 1.4, y: target.y });
  await page.waitForTimeout(700);
  await page.evaluate(() => window.__dev.act('horse'));
  await page.waitForTimeout(900);
  res = await note();
  console.log('try', k + 1, target.name, target.quality, '->', res);
  if (res.includes('tamed') || res.includes('kicked')) await page.screenshot({ path: `${out}/3-${res.includes('tamed') ? 'tamed' : 'kicked'}.png` });
}
const mine = (await adm({ cmd: 'horses', map: 'woods' })).list.find((h) => h.owner);
console.log('my horse', JSON.stringify(mine));
await adm({ cmd: 'agentMove', id: me, map: 'woods', x: mine.x - 1.2, y: mine.y });
await page.waitForTimeout(1200);
await page.evaluate(() => window.__dev.act('horse'));
await page.waitForTimeout(1200);
console.log('mount:', await note(), '| card:', await card());
await page.screenshot({ path: `${out}/4-riding-still.png` });
// Ride east: a trot, then hold run (B) for a gallop.
const speed = async (ms) => { const a = await page.evaluate(() => window.__dev.me()); await page.waitForTimeout(ms); const b = await page.evaluate(() => window.__dev.me()); return Math.hypot(b[0] - a[0], b[1] - a[1]) / (ms / 1000); };
const pos1 = await page.evaluate(() => window.__dev.me()), dl = Math.hypot(128 - pos1[0], 128 - pos1[1]) || 1;
await page.evaluate(([x, y]) => window.__axis(x, y), [(128 - pos1[0]) / dl, (128 - pos1[1]) / dl]); // towards the open middle
await page.waitForTimeout(800);
console.log('trot m/s', (await speed(2000)).toFixed(2));
await page.screenshot({ path: `${out}/5-trot.png` });
await page.evaluate(() => window.__press(1, true));
await page.waitForTimeout(800);
console.log('gallop m/s', (await speed(2000)).toFixed(2));
await page.screenshot({ path: `${out}/6-gallop.png` });
await page.evaluate(() => { window.__press(1, false); window.__axis(0, 0); });
await page.waitForTimeout(1500);
console.log('card after:', await card());
await page.evaluate(() => window.__dev.act('horse'));
await page.waitForTimeout(1200);
console.log('off:', await note());
await page.screenshot({ path: `${out}/7-off.png` });
ws.close(); await browser.close();
