// Browser proof (imad 2026-11-26): first person shows my hands (with the weapon / tool, playing the moves), on horseback the
// hands on the reins and the horse's head, the eye at my character's real height (on foot / in the saddle); the horse's gait
// while riding (speeds the TV fed the horse model + its gait changes, written to gaits.json).
// Usage: ADMIN_TOKEN=... node tools/fpv-proof.mjs <server> <sdk.js> <outdir>
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
const eye = () => page.evaluate(() => { const g = window.__dev.g3(); return { want: +g.eyeWant.toFixed(2), cam: +g.camera.position.y.toFixed(2) }; });
let p0 = await dev('me');
p0 = await moveMe(Math.round(p0[0] - 20), Math.round(p0[1] + 30));
await adm({ cmd: 'agentSet', id: me, set: { 'bag.sword': 1, 'bag.bow': 1, 'bag.arrows': 20 } });
await dev('do', 'equip', 'weapon:sword');
await page.waitForTimeout(1500);
await dev('cam', 'first'); await page.waitForTimeout(300);
await dev('cam', 'first');
console.log('view', (await dev('dbg')).camView);
await dev('yaw', 0.6); await page.waitForTimeout(2500);
console.log('on foot eye', JSON.stringify(await eye()));
await shot('1-first-person-hands-sword');
await dev('act', 'attack'); await page.waitForTimeout(120); await dev('act', 'attack', false); await page.waitForTimeout(160);
await shot('2-first-person-attack');
await page.waitForTimeout(1200);
await dev('do', 'equip', 'weapon:-');
await page.waitForTimeout(1200);
await shot('3-first-person-bare-hands');
await dev('act', 'aim'); await page.waitForTimeout(900);
await shot('4-first-person-bow-drawn');
await dev('act', 'aim', false); await page.waitForTimeout(800);
await dev('do', 'equip', 'weapon:sword');
// A horse: a herd next to me, tame one, get on.
await dev('cam', 'top');
p0 = await dev('me');
console.log('spawn', JSON.stringify(await adm({ cmd: 'horseSpawn', map: town, x: Math.round(p0[0] + 8), y: Math.round(p0[1] + 4), n: 3, q: 0 })));
await page.waitForTimeout(2000);
for (let k = 0; k < 40; k++) {
  const list = (await adm({ cmd: 'horses', map: town })).list;
  if (list.find((h) => h.owner)) break;
  const pos = await dev('me');
  const h = list.filter((x) => x.wild).sort((a, b) => Math.hypot(a.x - pos[0], a.y - pos[1]) - Math.hypot(b.x - pos[0], b.y - pos[1]))[0];
  await moveMe(Math.round(h.x - 1.4), Math.round(h.y));
  await dev('act', 'horse');
  await page.waitForTimeout(900);
}
let mine = (await adm({ cmd: 'horses', map: town })).list.find((h) => h.owner);
console.log('tamed', mine?.name);
for (let k = 0; k < 6; k++) {
  mine = (await adm({ cmd: 'horses', map: town })).list.find((h) => h.owner);
  await moveMe(Math.round(mine.x - 1.5), Math.round(mine.y));
  await dev('act', 'horse'); await page.waitForTimeout(1300);
  const n = await note(); console.log('mount:', n);
  if (/riding/i.test(n)) break;
}
await dev('cam', 'first'); await dev('yaw', 0.6); await page.waitForTimeout(2500);
console.log('riding eye', JSON.stringify(await eye()));
await shot('5-first-person-riding-reins-horse-head');
// Ride by itself to a mark 80 m away, at a gallop: watch the gait.
const pm = await dev('me');
await dev('do', 'mark', `add:${town}:${Math.round(pm[0] + 60)}:${Math.round(pm[1] - 50)}:star:Far`);
await page.waitForTimeout(1500);
await dev('act', 'wheel'); await page.waitForTimeout(600); await dev('act', 'wheel');
const ds = await dev('dests'); console.log('dests', JSON.stringify(ds));
const far = (ds || []).find((d) => /Far/.test(d[2])) ?? (ds || []).find((d) => d[1] === 'camp');
if (far) await dev('quick', `ride:${far[0]}`);
const gaits = [];
for (let k = 0; k < 24; k++) {
  await page.waitForTimeout(500);
  const g = await dev('gaits');
  const e = await eye();
  gaits.push({ t: k * 0.5, eye: e, horses: g.map((h) => ({ id: h.id, cur: h.cur, sp: +h.sp.toFixed(2), ts: +h.ts.toFixed(2), sw: h.sw })) });
  if (k === 6) await shot('6-first-person-galloping');
  if (k === 10) { await dev('cam', 'third'); }
  if (k === 13) await shot('7-third-person-galloping');
}
const all = await dev('gaits');
fs.writeFileSync(`${out}/gaits.json`, JSON.stringify({ samples: gaits, horses: all }, null, 1));
console.log('gait samples', JSON.stringify(gaits.map((s) => s.horses.map((h) => `${h.cur}:${h.sp}:${h.sw}`).join(' ') + ' eye ' + s.eye.cam)));
await browser.close();
ws.close();
