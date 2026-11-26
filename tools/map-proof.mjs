// Browser proof of the TV map, its marks, the quick wheel's settings and bow aiming in third / first person (imad 2026-11-25).
// Usage: ADMIN_TOKEN=... node tools/map-proof.mjs <server> <sdk.js> <outdir>
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
const dev = (fn, arg) => page.evaluate(fn, arg);
await page.goto(`${server}/app/?server=${encodeURIComponent(server)}&tier=low&dev`);
const code = await page.waitForFunction(() => { const s = document.getElementById('screen'); if (s && s.hidden) return 'in'; const e = document.querySelector('.code'); return e && e.textContent.replace(/\s/g, ''); }, null, { timeout: 30000 }).then((h) => h.jsonValue());
if (code !== 'in') await adm({ cmd: 'approve', code, name: 'imad' });
await page.waitForFunction(() => document.getElementById('screen').hidden, null, { timeout: 30000 });
await page.waitForTimeout(5000);
for (let k = 0; k < 3 && await dev(() => document.getElementById('gmenu')?.hidden === false); k++) { await page.keyboard.press('Escape'); await page.waitForTimeout(400); }
const me = await dev(() => window.__dev.dbg().meId);
const [mx0, my0, map] = await dev(() => window.__dev.me());
console.log('me', me, map, mx0, my0);
// 1. No button bar at the bottom.
console.log('bottom bar text:', JSON.stringify(await dev(() => window.__dev.hint())), 'visible:', await dev(() => !document.getElementById('hint').hidden));
await page.screenshot({ path: `${out}/1-no-button-bar.png` });
// A hut of mine, so the map shows my home.
await adm({ cmd: 'agentSet', id: me, set: { 'bag.wood': 20, 'bag.stone': 10, 'bag.leather': 5, 'bag.bow': 1, 'bag.arrows': 20 } });
await page.waitForTimeout(1500);
let built = null;
for (const [dx, dy] of [[0, -3], [3, 0], [-6, 0], [0, 4], [6, 6], [-6, -6]]) { built = await dev(([dx, dy]) => window.__dev.place('hut', dx, dy, 0, true), [dx, dy]); await page.waitForTimeout(1500); if (did.some((d) => d.a === 'build' && d.ok)) break; await dev(() => window.__dev.unplace()); }
console.log('hut:', JSON.stringify(did.filter((d) => d.a === 'build').map((d) => d.code)));
await dev(() => window.__dev.unplace());
// 2. The map: open it (the action), wait for the tiles.
await dev(() => window.__dev.act('map'));
await page.waitForFunction(() => window.__dev.map().data, null, { timeout: 15000 });
await page.waitForTimeout(800);
console.log('map:', JSON.stringify(await dev(() => window.__dev.map())));
await page.screenshot({ path: `${out}/2-map.png` });
// Zoom in (CH + / PgUp), move the cursor with the arrows, mark a hunting spot.
await page.keyboard.press('PageUp'); await page.waitForTimeout(300); await page.keyboard.press('PageUp'); await page.waitForTimeout(300);
for (let k = 0; k < 4; k++) { await page.keyboard.press('ArrowRight'); await page.waitForTimeout(120); }
for (let k = 0; k < 2; k++) { await page.keyboard.press('ArrowUp'); await page.waitForTimeout(120); }
await page.waitForTimeout(500);
await page.screenshot({ path: `${out}/3-map-zoomed-cursor.png` });
await page.keyboard.press('Enter'); await page.waitForTimeout(500);
await page.screenshot({ path: `${out}/4-mark-this-place.png` });
await page.keyboard.press('ArrowDown'); await page.waitForTimeout(150); await page.keyboard.press('ArrowDown'); await page.waitForTimeout(150); // home, mine, -> hunt
await page.keyboard.press('Enter'); await page.waitForTimeout(1200);
for (let k = 0; k < 5; k++) { await page.keyboard.press('ArrowLeft'); await page.waitForTimeout(120); }
await page.keyboard.press('Enter'); await page.waitForTimeout(500); await page.keyboard.press('ArrowDown'); await page.waitForTimeout(150); await page.keyboard.press('Enter'); await page.waitForTimeout(1200); // a mine
console.log('marks answers:', JSON.stringify(did.filter((d) => d.a === 'mark').map((d) => [d.code, d.marks?.length])));
await page.waitForTimeout(600);
await page.screenshot({ path: `${out}/5-map-with-marks.png` });
// The marks stay on the server: a fresh map request lists them.
const marks = did.filter((d) => d.a === 'mark').pop()?.marks ?? [];
console.log('saved marks:', JSON.stringify(marks.map((m) => [m.kind, m.x, m.y])));
await page.keyboard.press('Escape'); await page.waitForTimeout(600);
// 3. Quick wheel settings: Settings > Quick action wheel; take "Drink" off, move "Map" later.
await dev(() => window.__dev.page('settings')); await page.waitForTimeout(400);
const rows = await dev(() => [...document.querySelectorAll('#gmenu .mr')].map((r) => r.textContent));
const wi = rows.findIndex((r) => /Quick action wheel/.test(r));
for (let k = 0; k < wi; k++) { await page.keyboard.press('ArrowDown'); await page.waitForTimeout(80); }
await page.keyboard.press('Enter'); await page.waitForTimeout(500);
await page.screenshot({ path: `${out}/6-wheel-settings.png` });
const wr = await dev(() => [...document.querySelectorAll('#gmenu .mr')].map((r) => r.textContent));
const di = wr.findIndex((r) => /Drink/.test(r));
for (let k = 0; k < di; k++) { await page.keyboard.press('ArrowDown'); await page.waitForTimeout(80); }
await page.keyboard.press('Enter'); await page.waitForTimeout(400);
await page.screenshot({ path: `${out}/7-wheel-item.png` });
const ir = await dev(() => [...document.querySelectorAll('#gmenu .mr')].map((r) => r.textContent));
const ri = ir.findIndex((r) => /Take it off/.test(r));
for (let k = 0; k < ri; k++) { await page.keyboard.press('ArrowDown'); await page.waitForTimeout(80); }
await page.keyboard.press('Enter'); await page.waitForTimeout(400); // off, back to the list
await page.keyboard.press('Enter'); await page.waitForTimeout(400); // first row = Map -> its page
await page.keyboard.press('ArrowDown'); await page.waitForTimeout(80); await page.keyboard.press('Enter'); await page.waitForTimeout(300); // Move later
await page.keyboard.press('Enter'); await page.waitForTimeout(300); // again
await page.keyboard.press('Escape'); await page.waitForTimeout(400);
await page.screenshot({ path: `${out}/8-wheel-settings-after.png` });
console.log('saved wheel:', JSON.stringify(await dev(() => MyPC.load('wheel', null))));
for (let k = 0; k < 4 && await dev(() => document.getElementById('gmenu')?.hidden === false); k++) { await page.keyboard.press('Escape'); await page.waitForTimeout(300); }
await dev(() => window.__dev.act('wheel')); await page.waitForTimeout(500);
await page.screenshot({ path: `${out}/9-wheel.png` });
await dev(() => window.__dev.act('wheel')); await page.waitForTimeout(400); // the same button closes it
// 4. Bow in third person: a deer in front, aim (yaw towards it), crosshair locks on it.
await adm({ cmd: 'animals', map, want: [0, 8, 0, 0, 0], fill: true });
const [x, y] = await dev(() => window.__dev.me());
const live = (await adm({ cmd: 'live', map }))?.data;
const mt = (await adm({ cmd: 'mapTiles', map }))?.data;
const solidAt = (px, py) => { const tx = Math.floor(px), ty = Math.floor(py); if (tx < 0 || ty < 0 || tx >= mt.w || ty >= mt.h) return true; const id = mt.tiles[ty * mt.w + tx]; return !!mt.solid[id - 1] || mt.names[id - 1] === 'tree'; };
const clear = (a) => { for (let k = 0; k <= 30; k++) { const px = a[1] - 11 + (k / 30) * 11; for (const dy of [-1.5, 0, 1.5]) if (solidAt(px, a[2] + dy)) return false; } return true; }; // 11 m of open ground west of it
const deer = live.animals.filter((a) => a[0] === 1).find(clear) ?? live.animals.find((a) => a[0] === 1);
console.log('deer', JSON.stringify(deer));
for (let k = 0; k < 6; k++) { await adm({ cmd: 'agentMove', id: me, map, x: deer[1] - 9, y: deer[2] }); await page.waitForTimeout(900); const [a, b] = await dev(() => window.__dev.me()); if (Math.hypot(a - deer[1] + 9, b - deer[2]) < 2) break; }
await dev(() => window.__dev.cam('third')); await page.waitForTimeout(800);
const aimTo = async () => { const l = (await adm({ cmd: 'live', map }))?.data, [a, b] = await dev(() => window.__dev.me()); const d = l.animals.filter((v) => v[0] === 1).sort((p, q) => Math.hypot(p[1] - a, p[2] - b) - Math.hypot(q[1] - a, q[2] - b))[0]; return Math.atan2(d[2] - b, d[1] - a) + Math.PI / 2 + 0.06; };
await dev((v) => window.__dev.yaw(v), await aimTo()); await page.waitForTimeout(500);
await page.screenshot({ path: `${out}/10-third-before-aim.png` });
await dev(() => window.__dev.act('aim', true)); await page.waitForTimeout(1200);
console.log('aim third:', JSON.stringify(await dev(() => window.__dev.aim())), 'xhair:', JSON.stringify(await dev(() => window.__dev.xhair())));
await page.screenshot({ path: `${out}/11-third-aiming-locked.png` });
await dev(() => window.__dev.act('aim', false)); await page.waitForTimeout(100);
await page.screenshot({ path: `${out}/12-third-shot.png` });
await page.waitForTimeout(800);
console.log('shot:', JSON.stringify(did.filter((d) => d.a === 'shoot').map((d) => d.code)));
// First person.
await dev(() => window.__dev.cam('first')); await page.waitForTimeout(800);
await dev(async (v) => window.__dev.yaw(v), await aimTo());
await dev(() => window.__dev.act('aim', true)); await page.waitForTimeout(1200);
console.log('aim first xhair:', JSON.stringify(await dev(() => window.__dev.xhair())));
await page.screenshot({ path: `${out}/13-first-aiming.png` });
// Free aim (turned away from game): white crosshair.
await dev((v) => window.__dev.yaw(window.__dev.yaw() + 1.4)); await page.waitForTimeout(700);
console.log('free xhair:', JSON.stringify(await dev(() => window.__dev.xhair())));
await page.screenshot({ path: `${out}/14-first-free-aim.png` });
await dev(() => window.__dev.act('aim', false));
await browser.close(); ws.close();
