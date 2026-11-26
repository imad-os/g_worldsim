// Browser proof (imad 2026-11-26): a 7 x 7 hut, a fridge and a chest inside it (their screen), food kept, the map's zoom levels,
// "Ride here" on the map only on horseback, the compass with metres.
// Usage: ADMIN_TOKEN=... node tools/storage-proof.mjs <server> <sdk.js> <outdir>
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

const rows = () => page.evaluate(() => [...document.querySelectorAll('#gmenu .mr')].map((e) => e.textContent.trim()).join(' | '));
await adm({ cmd: 'agentSet', id: me, set: { inv: { wood: 20, stone: 10, leather: 5, fridge: 1, chest: 1, sword: 1, water: 4, food: 6 } } });
let p0 = await dev('me');
p0 = await moveMe(Math.round(p0[0] - 30), Math.round(p0[1] + 40));
// A hut 7 x 7 where I aim.
let pl = null;
// Look for open ground big enough (7 x 7 + room round it): try spots round the town until the ghost turns green.
for (const [dx, dy] of [[0, 0], [20, 0], [-20, 0], [0, 20], [0, -20], [25, 25], [-25, 25], [25, -25], [-25, -25], [40, 0], [-40, 0], [0, 40], [0, -40]]) {
  await moveMe(Math.round(p0[0] + dx), Math.round(p0[1] + dy));
  pl = await dev('place', 'hut', 0, -5, 0, false);
  for (let k = 0; k < 16 && pl?.check; k++) pl = await dev('place', undefined, [1, 0, -1, 0][k % 4] * (1 + (k >> 2)), [0, 1, 0, -1][k % 4] * (1 + (k >> 2)), 0, false);
  if (!pl?.check) break;
  await dev('unplace');
}
console.log('hut place', JSON.stringify(pl));
await dev('place', undefined, 0, 0, 0, true);
await page.waitForTimeout(1500);
const huts = (await adm({ cmd: 'huts', map: town }))?.list ?? [];
const mineHut = huts.find((h) => h.owner === 'imad' || h.mine) ?? huts.at(-1);
console.log('huts', JSON.stringify(huts).slice(0, 400));
// Inside: the middle of the room, a fridge and a chest against the back wall.
const hx = pl.tx + 3, hy = pl.ty + 3; // the room's middle (x0 + 3)
console.log('hut at', hx, hy);
await moveMe(hx + 0.5, hy + 0.5);
await dev('cam', 'top');
await page.waitForTimeout(1200);
for (const [what, dx] of [['fridge', -2], ['chest', 2]]) {
  let r = await dev('place', what, 0, 0, 0, false);
  const st = r ? [r.tx, r.ty] : null;
  r = await dev('place', undefined, hx + dx - r.tx, hy - 2 - r.ty, 0, false);
  console.log(what, 'place', JSON.stringify(r), 'from', st);
  await dev('place', undefined, 0, 0, 0, true);
  await page.waitForTimeout(1200);
  console.log('  note', await note());
}
await page.waitForTimeout(1500);
await page.screenshot({ path: `${out}/1-fridge-and-chest-in-a-7x7-hut.png` });
await dev('cam', 'third'); await dev('yaw', Math.PI / 2); await page.waitForTimeout(1800);
await page.screenshot({ path: `${out}/1b-inside-third-person.png` });
await dev('cam', 'top'); await page.waitForTimeout(800);
// Open the fridge (A next to it) and put food in.
const fx = hx - 2, fy = hy - 2;
await moveMe(fx + 1.5, fy + 1.5);
await dev('do', 'box', `${fx},${fy}`);
await page.waitForTimeout(1200);
console.log('fridge page:', await rows());
await dev('do', 'box', `put:${fx},${fy}:food:4`);
await dev('do', 'box', `put:${fx},${fy}:water:2`);
await page.waitForTimeout(1200);
console.log('fridge page after:', await rows(), '|', await note());
await page.screenshot({ path: `${out}/2-fridge-screen.png` });
await key('Escape'); await page.waitForTimeout(400); if (await menu()) await key('Escape');
await moveMe(hx + 1.5, hy - 0.5);
await dev('do', 'box', `${hx + 2},${hy - 2}`);
await page.waitForTimeout(1200);
await dev('do', 'box', `put:${hx + 2},${hy - 2}:sword:1`);
await page.waitForTimeout(1000);
console.log('chest page:', await rows());
await page.screenshot({ path: `${out}/3-chest-screen.png` });
await key('Escape'); await page.waitForTimeout(400); if (await menu()) await key('Escape');
// The camp plan the people work to.
console.log('camp plan', JSON.stringify(await adm({ cmd: 'campPlan', map: town })).slice(0, 600));
// The map: zoomed out, then in step by step; no "Ride here" on foot.
await dev('act', 'map'); await page.waitForTimeout(2500);
for (let z = 0; z < 2; z++) { await page.keyboard.press('PageDown'); await page.waitForTimeout(400); }
await page.screenshot({ path: `${out}/4-map-zoomed-out.png` });
for (let z = 0; z < 6; z++) { await page.keyboard.press('PageUp'); await page.waitForTimeout(500); }
console.log('map', JSON.stringify(await dev('map')));
await page.screenshot({ path: `${out}/5-map-zoomed-in.png` });
await key('Enter'); await page.waitForTimeout(800);
console.log('mark menu on foot:', await rows());
await page.screenshot({ path: `${out}/6-map-mark-on-foot-no-ride.png` });
await key('Escape'); await page.waitForTimeout(400);
for (let k = 0; k < 3 && await menu(); k++) await key('Escape');
// A horse: tame one, get on, then the map offers "Ride here".
await adm({ cmd: 'horseSpawn', map: town, x: Math.round(hx + 12), y: Math.round(hy + 8), n: 3, q: 0 });
await page.waitForTimeout(2000);
let tamed = false;
for (let k = 0; k < 40 && !tamed; k++) {
  const list = (await adm({ cmd: 'horses', map: town })).list;
  if (list.find((h) => h.owner)) { tamed = true; break; }
  const pos = await dev('me');
  const h = list.filter((x) => x.wild).sort((a, b) => Math.hypot(a.x - pos[0], a.y - pos[1]) - Math.hypot(b.x - pos[0], b.y - pos[1]))[0];
  await adm({ cmd: 'agentMove', id: me, map: town, x: Math.round(h.x - 1.4), y: Math.round(h.y) });
  await page.waitForTimeout(700);
  await dev('act', 'horse'); await page.waitForTimeout(900);
}
let mine = null;
for (let k = 0; k < 8; k++) {
  mine = (await adm({ cmd: 'horses', map: town })).list.find((h) => h.owner);
  await adm({ cmd: 'agentMove', id: me, map: town, x: Math.round(mine.x - 1), y: Math.round(mine.y) });
  await page.waitForTimeout(1000);
  await dev('act', 'horse'); await page.waitForTimeout(1200);
  if (/on|ride|saddle|Riding|You get/i.test(await note()) && !/No horse/.test(await note())) break;
}
console.log('mount:', await note());
await dev('cam', 'third'); await dev('yaw', 0); await page.waitForTimeout(3000);
console.log('compass:', await page.evaluate(() => document.getElementById('compass')?.textContent));
await page.screenshot({ path: `${out}/7-compass-with-metres.png` });
await dev('cam', 'top');
await dev('act', 'map'); await page.waitForTimeout(2500);
for (let k = 0; k < 6; k++) { await page.keyboard.press('ArrowRight'); await page.waitForTimeout(120); }
await key('Enter'); await page.waitForTimeout(800);
console.log('mark menu riding:', await rows());
await page.screenshot({ path: `${out}/8-map-ride-here-when-riding.png` });
const rr = await page.evaluate(() => [...document.querySelectorAll('#gmenu .mr')].findIndex((e) => e.textContent.includes('Ride here')));
if (rr >= 0) { await key('Enter'); await page.waitForTimeout(2500); console.log('ride:', await note(), JSON.stringify(await dev('ride'))); await page.screenshot({ path: `${out}/9-riding-to-the-picked-place.png` }); }
await browser.close();
ws.close();
