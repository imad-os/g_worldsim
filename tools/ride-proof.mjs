// Browser proof (imad 2026-11-26): the compass bar, names over heads, the quick wheel on horseback (ride by yourself to home /
// a mark / another map), no gathering from the saddle, the whistle when calling the horse.
// Usage: ADMIN_TOKEN=... node tools/ride-proof.mjs <server> <sdk.js> <outdir>
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
// A hut of my own (built where I aim), then a saved mark across the town.
await adm({ cmd: 'agentSet', id: me, set: { inv: { wood: 20, stone: 10, leather: 5 } } });
let p0 = await dev('me');
const people = (await adm({ cmd: 'people' }))?.list ?? [];
console.log('me at', p0, 'people', people.length);
// Names over heads: next to Lina, from above and behind.
{ const pm = await dev('me'); for (const [id, dx, dy] of [[0, -2, -4], [1, 2, -5], [2, 0, -8]]) await adm({ cmd: 'agentMove', id, map: town, x: Math.round(pm[0] + dx), y: Math.round(pm[1] + dy) }); }
await page.waitForTimeout(2000);
console.log('names known', await dev('names'));
await page.screenshot({ path: `${out}/0-names-over-heads.png` });
await dev('cam', 'third'); await dev('yaw', 0); await page.waitForTimeout(1500);
await page.screenshot({ path: `${out}/0b-names-third-person.png` });
await dev('cam', 'top');
p0 = await dev('me');
p0 = await moveMe(Math.round(p0[0] - 30), Math.round(p0[1] + 40));
console.log('place', JSON.stringify(await dev('place', 'hut', 0, -4, 0, false)));
for (let k = 0; k < 6; k++) { const r = await dev('place', undefined, 0, 0, 0, false); if (r?.check === '' || r?.check === true || r?.check === 'ok') break; await dev('place', undefined, 1, 0, 0, false); }
console.log('place now', JSON.stringify(await dev('place', undefined, 0, 0, 0, true)));
await page.waitForTimeout(1500);
const huts = await adm({ cmd: 'huts', map: town });
console.log('huts', JSON.stringify(huts).slice(0, 300));
await dev('do', 'mark', `add:${town}:${Math.round(p0[0] + 50)}:${Math.round(p0[1] + 30)}:mine:Rocks`);
// A horse: a herd next to me, tame one, get on.
console.log('spawn', JSON.stringify(await adm({ cmd: 'horseSpawn', map: town, x: Math.round(p0[0] + 8), y: Math.round(p0[1] + 4), n: 3, q: 0 })));
await page.waitForTimeout(2000);
let tamed = false;
for (let k = 0; k < 40 && !tamed; k++) {
  const list = (await adm({ cmd: 'horses', map: town })).list;
  const mine = list.find((h) => h.owner);
  if (mine) { tamed = true; break; }
  const pos = await dev('me');
  const h = list.filter((x) => x.wild).sort((a, b) => Math.hypot(a.x - pos[0], a.y - pos[1]) - Math.hypot(b.x - pos[0], b.y - pos[1]))[0];
  await adm({ cmd: 'agentMove', id: me, map: town, x: Math.round(h.x - 1.4), y: Math.round(h.y) });
  await page.waitForTimeout(700);
  await dev('act', 'horse');
  await page.waitForTimeout(900);
  console.log('  tame try', k + 1, h?.name, await note());
}
let mine = (await adm({ cmd: 'horses', map: town })).list.find((h) => h.owner);
console.log('tamed', mine?.name);
// The whistle: walk 40 m away and call it.
let mp = await moveMe(Math.round(mine.x + 40), Math.round(mine.y));
await dev('act', 'horse');
await page.waitForTimeout(800);
console.log('call:', await note(), '| sound log:', JSON.stringify((await dev('snd')).log.slice(-4)));
for (let k = 0; k < 30; k++) { await page.waitForTimeout(1000); mine = (await adm({ cmd: 'horses', map: town })).list.find((h) => h.owner); mp = await dev('me'); if (Math.hypot(mine.x - mp[0], mine.y - mp[1]) < 3.4) break; }
await dev('act', 'horse');
await page.waitForTimeout(1200);
console.log('mount:', await note());
// Ride 70 m away from home and look around in third person: the compass and the names.
mp = await moveMe(Math.round(p0[0] + 30), Math.round(p0[1] - 50));
await dev('cam', 'third');
await dev('yaw', 0);
for (let k = 0; k < 5; k++) { await page.waitForTimeout(1000); }
console.log('names known', await dev('names'));
await page.screenshot({ path: `${out}/1-compass-names-riding.png` });
// The wheel on horseback.
await dev('act', 'wheel');
await page.waitForTimeout(1200);
console.log('wheel:', await page.evaluate(() => [...document.querySelectorAll('#wheel .wh-s span')].map((e) => e.textContent).join(' | ')));
await page.screenshot({ path: `${out}/2-wheel-on-horseback.png` });
await dev('act', 'wheel');
// A on a tree from the saddle = get off, never chop.
console.log('dests', JSON.stringify(await dev('dests')));
await dev('quick', 'ride:home');
await page.waitForTimeout(1500);
console.log('ride:', await note(), JSON.stringify(await dev('ride')));
await page.waitForTimeout(2500);
await page.screenshot({ path: `${out}/3-riding-home-by-itself.png` });
let ok = false;
for (let k = 0; k < 60; k++) { await page.waitForTimeout(1000); const r = await dev('ride'); if (!r) { ok = true; break; } }
mp = await dev('me');
console.log('arrived?', ok, await note(), 'at', mp, 'home', JSON.stringify(huts).slice(0, 120));
await page.screenshot({ path: `${out}/4-arrived-home.png` });
// The wheel next to home: no "Ride home".
await page.waitForTimeout(5500);
await dev('act', 'wheel'); await page.waitForTimeout(1000);
console.log('wheel at home:', await page.evaluate(() => [...document.querySelectorAll('#wheel .wh-s span')].map((e) => e.textContent).join(' | ')));
await dev('act', 'wheel');
// To the woods by itself, through the gate.
await dev('quick', 'ride:map:woods');
let left = false;
for (let k = 0; k < 120; k++) { await page.waitForTimeout(1000); const d = await dev('me'); if (d[2] === 'woods') { left = true; break; } }
console.log('reached the woods?', left, await note());
await page.waitForTimeout(3000);
await page.screenshot({ path: `${out}/5-in-the-woods.png` });
// Use (A) from the saddle: gets off, gathers nothing.
console.log('riding?', JSON.stringify((await dev('dbg'))));
await dev('act', 'use');
await page.waitForTimeout(400);
console.log('A on horseback:', await note());
await dev('open', 'settings');
await page.waitForTimeout(800);
console.log('settings:', await menu());
await page.screenshot({ path: `${out}/6-settings.png` });
await browser.close();
ws.close();
