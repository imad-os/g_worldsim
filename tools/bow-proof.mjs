// Browser proof of bow aiming and animal deaths (imad 2026-11-25): hold Aim = the bow drawn in my hands + my arrows shown,
// let go = the arrow flies (fast), a killed animal falls over. Usage: ADMIN_TOKEN=... node tools/bow-proof.mjs <server> <sdk.js> <outdir>
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
const did = [], dead = [];
page.on('websocket', (sock) => sock.on('framereceived', (f) => { try { const m = decode(Buffer.isBuffer(f.payload) ? f.payload : Buffer.from(f.payload)); if (m.t === 'note' && m.kind === 'did') did.push(m.data); if (m.dead) dead.push(...m.dead); } catch {} }));
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
for (let k = 0; k < 3 && await menuOpen(); k++) { await page.keyboard.press('Escape'); await page.waitForTimeout(400); }
const me = await page.evaluate(() => window.__dev.dbg().meId);
const [, , map] = await page.evaluate(() => window.__dev.me());
console.log('me', me, 'map', map);
console.log('bag:', JSON.stringify((await adm({ cmd: 'agentSet', id: me, set: { 'bag.bow': 1, 'bag.arrows': 12, 'bag.sword': 1 } }))?.ok));
await adm({ cmd: 'animals', map, want: [0, 12, 6, 0, 0], fill: true });
const live = (await adm({ cmd: 'live', map }))?.data;
const mt = (await adm({ cmd: 'mapTiles', map }))?.data, tree = mt.names.indexOf('tree');
const open = (x, y) => { for (let dy = -5; dy <= 3; dy++) for (let dx = -8; dx <= 3; dx++) { const tx = Math.floor(x) + dx, ty = Math.floor(y) + dy; if (tx >= 0 && ty >= 0 && tx < mt.w && ty < mt.h && (mt.tiles[ty * mt.w + tx] === tree || mt.solid[mt.tiles[ty * mt.w + tx]])) return false; } return true; };
const deer = live.animals.find((a) => a[0] !== 5 && open(a[1], a[2])) ?? live.animals.find((a) => a[0] === 1) ?? live.animals[0]; // on open ground, so nothing hides its fall
console.log('animal', JSON.stringify(deer));
const moveTo = async (x, y) => { // the TV's own prediction may win a moment: ask again until it is there
  for (let k = 0; k < 6; k++) { await adm({ cmd: 'agentMove', id: me, map, x, y }); await page.waitForTimeout(900); const [mx, my] = await page.evaluate(() => window.__dev.me()); if (Math.hypot(mx - x, my - y) < 2) return true; }
  return false;
};
console.log('move:', await moveTo(deer[1] - 6, deer[2]));
await page.waitForTimeout(1200);
console.log('me after the move:', JSON.stringify(await page.evaluate(() => window.__dev.me())));
await page.evaluate(() => window.__dev.cam('third')); await page.waitForTimeout(800);
await page.screenshot({ path: `${out}/0-sword-in-hand.png` });
const aimAt = async () => {
  const l = (await adm({ cmd: 'live', map }))?.data, [x, y] = await page.evaluate(() => window.__dev.me());
  const a = l.animals.filter((v) => v[0] !== 5).sort((p, q) => Math.hypot(p[1] - x, p[2] - y) - Math.hypot(q[1] - x, q[2] - y))[0];
  return a ? Math.atan2(a[2] - y, a[1] - x) : 0;
};
await page.evaluate(() => window.__dev.act('aim', true));
await page.evaluate((a) => window.__dev.aim(a), await aimAt());
await page.waitForTimeout(900);
console.log('aiming:', JSON.stringify(await page.evaluate(() => window.__dev.aim())));
await page.screenshot({ path: `${out}/1-aiming-bow-drawn.png` });
let shots = 0, killed = false;
for (; shots < 14 && !killed; shots++) {
  did.length = 0;
  if (shots > 0) { // it ran: walk up to it again (6 m)
    const l = (await adm({ cmd: 'live', map }))?.data, [x, y] = await page.evaluate(() => window.__dev.me());
    const a = l.animals.filter((v) => v[0] !== 5 && open(v[1], v[2])).sort((p, q) => Math.hypot(p[1] - x, p[2] - y) - Math.hypot(q[1] - x, q[2] - y))[0];
    if (a && Math.hypot(a[1] - x, a[2] - y) > 8) await moveTo(a[1] - 6, a[2]);
  }
  await page.evaluate((a) => window.__dev.aim(a), await aimAt());
  await page.evaluate(() => window.__dev.act('aim', false)); // let go = shoot
  await page.waitForTimeout(60);
  if (shots === 0) await page.screenshot({ path: `${out}/2-arrow-flying.png` });
  for (let k = 0; k < 20 && !(await page.evaluate(() => window.__dev.aim().corpses)); k++) await page.waitForTimeout(40);
  if (await page.evaluate(() => window.__dev.aim().corpses)) { killed = true; break; }
  await page.waitForTimeout(300);
  console.log('shot', shots + 1, JSON.stringify(did.find((d) => d.a === 'shoot')));
  await page.evaluate(() => window.__dev.act('aim', true)); await page.waitForTimeout(250);
}
const t0 = Date.now();
const [fx, fy] = (await page.evaluate(() => window.__dev.aim().fell))[0] ?? [0, 0];
await page.evaluate(() => window.__dev.cam('top'));
adm({ cmd: 'agentMove', id: me, map, x: fx - 1.5, y: fy + 2.5 }); // stand next to it, so the camera shows it
console.log('fell at', fx, fy, 'me', JSON.stringify(await page.evaluate(() => window.__dev.me())));
console.log('hud after letting go:', JSON.stringify(await page.evaluate(() => window.__dev.aim().hud)));
for (const [k, ms] of [[3, 150], [4, 450], [5, 1100], [6, 3300]]) { const w = ms - (Date.now() - t0); if (w > 0) await page.waitForTimeout(w); await page.screenshot({ path: `${out}/${k}-animal-death-${ms}ms.png` }); }
console.log('kill answer:', JSON.stringify(did.find((d) => d.a === 'shoot')));
console.log('killed:', killed, 'dead ids in frames:', JSON.stringify(dead), 'corpses drawn:', JSON.stringify(await page.evaluate(() => window.__dev.aim().corpses)));
await browser.close(); ws.close();
