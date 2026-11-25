// Browser proof of the big bag screen, the bigger crafting screen, herbs + first-aid kits and the text / menu size setting
// (imad 2026-11-25). Usage: ADMIN_TOKEN=... node tools/bag-proof.mjs <server> <sdk.js> <outdir>
import { createRequire } from 'node:module';
const { chromium } = createRequire(import.meta.url)('playwright');
import WebSocket from 'ws';
import { encode, decode } from '@msgpack/msgpack';
const [server, sdkPath, out] = process.argv.slice(2);
const fs = await import('node:fs');
fs.mkdirSync(out, { recursive: true });
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
page.on('pageerror', (e) => console.log('[pageerror]', e.message));
const did = [];
page.on('websocket', (sock) => sock.on('framereceived', (f) => { try { const m = decode(Buffer.isBuffer(f.payload) ? f.payload : Buffer.from(f.payload)); if (m.t === 'note' && m.kind === 'did') did.push(m.data); } catch {} }));
await page.route(/mypc-sdk\.js/, (r) => r.fulfill({ contentType: 'text/javascript', body: fs.readFileSync(sdkPath) }));
const ws = new WebSocket(server.replace(/^http/, 'ws') + '/ws');
await new Promise((r) => ws.on('open', r));
ws.send(encode({ t: 'hi', v: 1, token: process.env.ADMIN_TOKEN, name: 'proof' }));
const answers = new Map();
ws.on('message', (d) => { const m = decode(d); if (m.t === 'admr') answers.set(m.id, m); });
let aid = 100;
const adm = async (c) => { const id = ++aid; ws.send(encode({ t: 'adm', id, c })); for (let k = 0; k < 50 && !answers.has(id); k++) await new Promise((r) => setTimeout(r, 100)); return answers.get(id); };
await page.goto(`${server}/app/?server=${encodeURIComponent(server)}&tier=low&dev`);
const code = await page.waitForFunction(() => { const s = document.getElementById('screen'); if (s && s.hidden) return 'in'; const e = document.querySelector('.code'); return e && e.textContent.replace(/\s/g, ''); }, null, { timeout: 30000 }).then((h) => h.jsonValue());
if (code !== 'in') await adm({ cmd: 'approve', code, name: 'imad' });
await page.waitForFunction(() => document.getElementById('screen').hidden, null, { timeout: 30000 });
await page.waitForTimeout(5000);
const menuOpen = () => page.evaluate(() => document.getElementById('gmenu')?.hidden === false);
const note = () => page.evaluate(() => document.getElementById('note').hidden ? '' : document.getElementById('note').textContent);
for (let k = 0; k < 3 && await menuOpen(); k++) { await page.keyboard.press('Escape'); await page.waitForTimeout(400); }
const me = await page.evaluate(() => window.__dev.dbg().meId);
const [, , map] = await page.evaluate(() => window.__dev.me());
// 2. A full bag, hurt.
await adm({ cmd: 'agentSet', id: me, set: { 'bag.herb': 5, 'bag.leather': 2, 'bag.wood': 8, 'bag.stone': 4, 'bag.ore': 2, 'bag.sword': 1, 'bag.bow': 1, 'bag.arrows': 15, 'bag.armor': 1, 'bag.helmet': 1, 'bag.palisade': 2, 'bag.medkit': 0 } });
await adm({ cmd: 'agentSet', id: me, set: { hp: 35 } });
await page.waitForTimeout(1500);
// 3. The crafting screen, Healing tab: the recipe book fills the grid, make a kit.
await page.evaluate(() => window.__dev.open('inv')); await page.waitForTimeout(500);
for (let k = 0; k < 12; k++) await page.keyboard.press('ArrowUp');
for (let k = 0; k < 4; k++) { await page.keyboard.press('ArrowRight'); await page.waitForTimeout(120); } // tabs: Healing
for (let k = 0; k < 4; k++) { await page.keyboard.press('ArrowDown'); await page.waitForTimeout(120); } // grid -> book
await page.keyboard.press('Enter'); await page.waitForTimeout(400); // fill the grid from the recipe
await page.screenshot({ path: `${out}/2-crafting-healing.png` });
did.length = 0;
await page.keyboard.press('Enter'); await page.waitForTimeout(900); // make
console.log('craft:', JSON.stringify(did.find((d) => d.a === 'craft')), '|', await note());
// 4. The big bag: the kit, A uses it.
await page.keyboard.press('Escape'); await page.waitForTimeout(300);
await page.evaluate(() => window.__dev.open('bag')); await page.waitForTimeout(600);
const names = await page.evaluate(() => [...document.querySelectorAll('.bc span')].map((e) => e.textContent).filter(Boolean));
console.log('bag:', names.join(', '));
const kit = names.findIndex((n) => /first-aid/i.test(n));
for (let k = 0; k < kit; k++) { await page.keyboard.press('ArrowRight'); await page.waitForTimeout(80); }
await page.waitForTimeout(300);
await page.screenshot({ path: `${out}/3-bag-first-aid-kit.png` });
did.length = 0;
await page.keyboard.press('Enter'); await page.waitForTimeout(900);
console.log('use kit:', JSON.stringify(did.find((d) => d.a === 'medkit')), '|', await note());
await page.screenshot({ path: `${out}/4-bag-after-healing.png` });
for (let k = 0; k < 4 && await menuOpen(); k++) { await page.keyboard.press('Escape'); await page.waitForTimeout(400); }
// 1. Herbs in the world: walk up to a patch, A picks it.
const mt = (await adm({ cmd: 'mapTiles', map }))?.data, H = mt.names.indexOf('herbs') + 1; // tile ids start at 1 (names are listed from id 1)
const [x0, y0] = await page.evaluate(() => window.__dev.me());
let best = -1, bd = 1e9;
mt.tiles.forEach((t, k) => { if (t === H) { const d = Math.hypot(k % mt.w - x0, Math.floor(k / mt.w) - y0); if (d < bd) { bd = d; best = k; } } });
console.log('herb patches on', map, mt.tiles.filter((t) => t === H).length, 'nearest', bd.toFixed(0), 'm');
if (best >= 0) {
  const hx = best % mt.w + 0.5, hy = Math.floor(best / mt.w) + 1.6, px0 = hx + 1.6, py0 = hy + 1.4;
  for (let k = 0; k < 15; k++) { await adm({ cmd: 'agentMove', id: me, map, x: px0, y: py0 }); await page.waitForTimeout(900); const [mx, my] = await page.evaluate(() => window.__dev.me()); if (Math.hypot(mx - px0, my - py0) < 1.5) break; }
   await page.waitForTimeout(1500);
  for (let k = 0; k < 6; k++) { await adm({ cmd: 'agentMove', id: me, map, x: hx, y: hy }); await page.waitForTimeout(700); const [mx, my] = await page.evaluate(() => window.__dev.me()); if (Math.hypot(mx - hx, my - hy) < 1) break; }
  did.length = 0;
  await page.evaluate(() => window.__dev.act('take')); await page.waitForTimeout(800);
  console.log('A next to herbs:', JSON.stringify(did.find((d) => d.a === 'take')), '|', await note());
}
// 5. Text and menu size: Settings, 150 %.
await page.keyboard.press('Escape'); await page.waitForTimeout(300);
await page.evaluate(() => window.__dev.open('settings')); await page.waitForTimeout(400);
const rows = () => page.evaluate(() => [...document.querySelectorAll('#gmenu .mr')].map((e) => (e.classList.contains('on') ? '>' : '') + e.textContent).join(' | '));
for (let k = 0; k < 14 && !(await rows()).includes('>Text and menu size'); k++) { await page.keyboard.press('ArrowDown'); await page.waitForTimeout(150); }
console.log('settings rows:', await rows());
for (let k = 0; k < 6 && !(await rows()).includes('150 %'); k++) { await page.keyboard.press('Enter'); await page.waitForTimeout(200); } // up to 150 %
if (await page.evaluate(() => window.__dev.ui()) !== 1.5) await page.evaluate(() => window.__dev.ui(1.5)); // (arrows did not reach the menu: set it directly)
console.log('size:', await page.evaluate(() => window.__dev.ui()), '|', (await rows()).split(' | ').find((r) => r.includes('size')));
await page.screenshot({ path: `${out}/5-settings-150.png` });
await page.keyboard.press('Escape'); await page.waitForTimeout(300); await page.keyboard.press('Escape'); await page.waitForTimeout(500);
await page.screenshot({ path: `${out}/6-world-150.png` });
await page.evaluate(() => window.__dev.open('bag')); await page.waitForTimeout(600);
await page.screenshot({ path: `${out}/7-bag-150.png` });
await page.keyboard.press('Escape'); await page.waitForTimeout(300);
await page.evaluate(() => window.__dev.open('inv')); await page.waitForTimeout(600);
await page.screenshot({ path: `${out}/8-crafting-150.png` });
const fits = await page.evaluate(() => { const r = document.getElementById('gmenu').getBoundingClientRect(); return { l: Math.round(r.left), t: Math.round(r.top), r: Math.round(r.right), b: Math.round(r.bottom), w: innerWidth, h: innerHeight }; });
console.log('crafting screen box at 150 %:', JSON.stringify(fits));
// 6. Herb patches up close: watch mode (the camera is free there), looking at one.
for (let k = 0; k < 4 && await menuOpen(); k++) { await page.keyboard.press('Escape'); await page.waitForTimeout(400); }
await page.evaluate(() => window.__dev.open('settings')); await page.waitForTimeout(300);
for (let k = 0; k < 10 && !(await rows()).includes('>Text and menu size'); k++) { await page.keyboard.press('ArrowDown'); await page.waitForTimeout(120); }
await page.evaluate(() => window.__dev.ui(1));
await page.evaluate(() => window.__dev.open('root')); await page.waitForTimeout(300);
for (let k = 0; k < 20 && !(await rows()).includes('>Watch the world'); k++) { await page.keyboard.press('ArrowDown'); await page.waitForTimeout(100); }
await page.keyboard.press('Enter'); await page.waitForTimeout(2500);
for (let k = 0; k < 4 && await menuOpen(); k++) { await page.keyboard.press('Escape'); await page.waitForTimeout(400); }
const mt2 = (await adm({ cmd: 'mapTiles', map }))?.data, G = mt2.names.indexOf('grass') + 1, D = mt2.names.indexOf('dirt') + 1;
const clear = (k) => { const x = k % mt2.w, y = Math.floor(k / mt2.w); for (let dy = 1; dy <= 3; dy++) for (let dx = -1; dx <= 1; dx++) { const t = mt2.tiles[(y + dy) * mt2.w + x + dx]; if (t !== G && t !== H && t !== D) return false; } return true; };
const at = mt2.tiles.findIndex((t, k) => t === H && clear(k)); // one with open grass in front (the camera looks from the south)
if (at >= 0) {
  await page.evaluate(([x, y]) => window.__dev.look(x, y), [at % mt2.w + 0.5, Math.floor(at / mt2.w) + 0.5]);
  for (let k = 0; k < 3; k++) await page.evaluate(() => window.__dev.act('zoomIn'));
  await page.waitForTimeout(2500);
  await page.screenshot({ path: `${out}/1-herbs-in-the-world.png` });
}
await browser.close(); ws.close();
