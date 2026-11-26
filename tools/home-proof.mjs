// Browser proof (imad 2026-11-26): a bed, a fridge and a chest in my hut; "A Sleep" next to the bed, climbing into bed and lying on
// top of it; "A Open the fridge" and its door swinging open, the chest's lid lifting; a cut tree falling over; the panel showing
// how far a pregnancy is.
// Usage: ADMIN_TOKEN=... node tools/home-proof.mjs <server> <sdk.js> <outdir>
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
await adm({ cmd: 'zombies', perNight: 0 });
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
await adm({ cmd: 'clockSpeed', day: 0.25 }); // keep it daylight for the pictures
await adm({ cmd: 'agentSet', id: me, set: { inv: { wood: 30, stone: 12, leather: 5, fridge: 1, chest: 1, bed: 1, food: 6, water: 4, axe: 1 } } });
let p0 = await dev('me');
p0 = await moveMe(Math.round(p0[0] - 30), Math.round(p0[1] + 40));
let pl = null;
for (const [dx, dy] of [[0, 0], [20, 0], [-20, 0], [0, 20], [0, -20], [25, 25], [-25, 25], [25, -25], [-25, -25], [40, 0], [-40, 0], [0, 40], [0, -40]]) {
  await moveMe(Math.round(p0[0] + dx), Math.round(p0[1] + dy));
  pl = await dev('place', 'hut', 0, -5, 0, false);
  for (let k = 0; k < 16 && pl?.check; k++) pl = await dev('place', undefined, [1, 0, -1, 0][k % 4] * (1 + (k >> 2)), [0, 1, 0, -1][k % 4] * (1 + (k >> 2)), 0, false);
  if (!pl?.check) break;
  await dev('unplace');
}
await dev('place', undefined, 0, 0, 0, true);
await page.waitForTimeout(1500);
const hx = pl.tx + 3, hy = pl.ty + 3; // the room's middle
console.log('hut at', hx, hy);
await moveMe(hx + 0.5, hy + 0.5);
await dev('cam', 'top');
await page.waitForTimeout(1200);
// A fridge and a chest against the back wall, a bed against the left wall.
for (const [what, tx, ty] of [['fridge', hx - 2, hy - 2], ['chest', hx + 2, hy - 2], ['bed', hx - 2, hy]]) {
  let r = await dev('place', what, 0, 0, 0, false);
  r = await dev('place', undefined, tx - r.tx, ty - r.ty, 0, false);
  await dev('place', undefined, 0, 0, 0, true);
  await page.waitForTimeout(1200);
  console.log(what, 'at', r.tx, r.ty, 'check', r.check, '|', await note());
}
const bedX = hx - 2, bedY = hy;
// 1. Next to the bed: the hint says "A Sleep".
await moveMe(bedX + 1.5, bedY + 0.5);
await page.waitForTimeout(1200);
console.log('hint by the bed:', await dev('ia'));
await dev('cam', 'third'); await dev('yaw', -Math.PI / 2); await page.waitForTimeout(1500);
await page.screenshot({ path: `${out}/1-hint-sleep-by-the-bed.png` });
// 2. A: climbing into bed (mid-way), then lying on top of it.
await adm({ cmd: 'agentSet', id: me, set: { tired: 95 } }); // tired: they stay asleep a while (rested players wake by themselves)
await page.waitForTimeout(600);
await dev('act', 'use');
await page.waitForTimeout(450);
console.log('lying share mid-way:', await dev('lie'));
await page.screenshot({ path: `${out}/2-climbing-into-bed.png` });
await page.waitForTimeout(1600);
console.log('lying share:', await dev('lie'), '| note', await note(), '| hint', await dev('ia'));
await page.screenshot({ path: `${out}/3-asleep-on-the-bed.png` });
await dev('cam', 'top'); await page.waitForTimeout(1500);
await page.screenshot({ path: `${out}/4-asleep-on-the-bed-top.png` });
await dev('act', 'use'); // A again: get up
await page.waitForTimeout(1500);
console.log('after getting up:', await dev('lie'), await note());
// 3. The fridge: hint, then its door swings open.
await moveMe(hx - 2 + 0.5, hy - 2 + 1.5);
await page.waitForTimeout(1200);
console.log('hint by the fridge:', await dev('ia'));
await dev('cam', 'third'); await dev('yaw', 0); await page.waitForTimeout(1500);
await page.screenshot({ path: `${out}/5-hint-open-the-fridge.png` });
await dev('cam', 'top'); await page.waitForTimeout(1200);
await page.screenshot({ path: `${out}/6a-fridge-closed.png` });
await dev('do', 'box', `${hx - 2},${hy - 2}`);
await page.waitForTimeout(900);
await key('Escape'); await page.waitForTimeout(200); if (await menu()) await key('Escape');
await page.waitForTimeout(500);
await page.screenshot({ path: `${out}/6b-fridge-door-open.png` });
await page.waitForTimeout(9000); // it closes again
// 4. The chest's lid.
await moveMe(hx + 1.3, hy - 0.4);
await page.waitForTimeout(1500);
await page.screenshot({ path: `${out}/7a-chest-closed.png` });
console.log('hint by the chest:', await dev('ia'));
await dev('do', 'box', `${hx + 2},${hy - 2}`);
await page.waitForTimeout(900);
await key('Escape'); await page.waitForTimeout(200); if (await menu()) await key('Escape');
await page.waitForTimeout(500);
await page.screenshot({ path: `${out}/7b-chest-lid-open.png` });
// 5. A tree: chop it down (3 blows), watch it fall.
const tiles = await adm({ cmd: 'mapTiles', map: town });
const W = tiles.w, H = tiles.h, treeId = tiles.names.indexOf('tree'); // names are indexed by tile id
let tree = null, bd = Infinity;
const raw = tiles.tiles instanceof Uint8Array ? tiles.tiles : Uint8Array.from(tiles.tiles);
for (let y = 2; y < H - 2; y++) for (let x = 2; x < W - 2; x++) {
  if (raw[y * W + x] !== treeId) continue;
  const name = (xx, yy) => tiles.names[raw[yy * W + xx]];
  let wet = false;
  for (let yy = y - 5; yy <= y + 5 && !wet; yy++) for (let xx = x - 5; xx <= x + 5; xx++) if (yy > 0 && xx > 0 && yy < H && xx < W && name(xx, yy) === 'water') { wet = true; break; }
  const around = [[1, 0], [2, 0], [1, 1], [1, -1], [-1, 0], [-2, 0], [-3, 0], [-1, 1], [-2, 1]].every(([dx, dy]) => ['grass', 'dirt'].includes(name(x + dx, y + dy)));
  const d = Math.hypot(x - hx, y - hy);
  if (!wet && around && d < bd && d > 10) { bd = d; tree = [x, y]; }
}
console.log('tree', tree);
await moveMe(tree[0] + 1.6, tree[1] + 0.5); // east of it: it falls west, across the screen
await dev('cam', 'top'); await page.waitForTimeout(1500);
console.log('hint by the tree:', await dev('ia'));
await page.screenshot({ path: `${out}/8a-tree-before.png` });
let felled = false;
for (let k = 0; k < 12 && !felled; k++) {
  await dev('act', 'use');
  for (let j = 0; j < 17 && !felled; j++) { await page.waitForTimeout(100); felled = (await dev('tile', tree[0], tree[1])) !== 'tree'; }
  if (felled) break;
  console.log('  chop', k, await note());
}
// (the tile change arrives with the chunk: the fall started then)
console.log('falls', JSON.stringify(await dev('falls')));
await page.screenshot({ path: `${out}/8b-tree-falling.png` });
console.log('falls', JSON.stringify(await dev('falls')));
await page.waitForTimeout(700);
console.log('falls', JSON.stringify(await dev('falls')));
await page.screenshot({ path: `${out}/8c-tree-landing-leaves.png` });
await page.waitForTimeout(1200);
await page.screenshot({ path: `${out}/8d-tree-down.png` });
console.log('tree felled', felled);
await browser.close();
ws.close();
