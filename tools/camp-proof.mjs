// Browser proof of milestone 8 part 2: people build a camp (huts, a campfire) on their own; the TV shows it by day and at night.
// Usage: ADMIN_TOKEN=... node tools/camp-proof.mjs <server> <sdk.js> <outdir>
// Fast-forwards the world (admin speed) until a camp with a hut and a fire exists in the evening, then watches someone there.
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
let nid = 1;
const waits = new Map();
ws.on('message', (d) => { const m = decode(d); if (m.t === 'admr' && waits.has(m.id)) { waits.get(m.id)(m); waits.delete(m.id); } });
const cmd = (c) => new Promise((r) => { const id = ++nid; waits.set(id, r); ws.send(encode({ t: 'adm', id, c })); });
ws.send(encode({ t: 'hi', v: 1, token: admin, name: 'proof' }));
await new Promise((r) => setTimeout(r, 500));
await cmd({ cmd: 'aiSet', provider: 'none' });
const hourOf = (c) => ((c.gameSec / 3600 + 8) % 24);
const until = async (want, speed, label, maxSec = 600) => {
  await cmd({ cmd: 'speed', speed });
  const t0 = Date.now();
  for (;;) {
    const s = (await cmd({ cmd: 'stats' })).data ?? {};
    const c = (await cmd({ cmd: 'pause', paused: false })).data ?? {};
    if (want(s, c)) { await cmd({ cmd: 'speed', speed: 1 }); console.log(label, 'day', Math.floor((c.gameSec / 3600 + 8) / 24) + 1, hourOf(c).toFixed(1) + 'h', JSON.stringify(s.camps)); return { s, c }; }
    if (Date.now() - t0 > maxSec * 1000) throw new Error('timeout ' + label);
    await new Promise((r) => setTimeout(r, 1000));
  }
};
// A camp with a hut and a burning fire, at dusk.
await until((s, c) => s.camps?.[0]?.huts >= 1 && s.camps[0].fires >= 1 && hourOf(c) >= 17.5 && hourOf(c) < 19, 100, 'camp ready');

const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
page.on('pageerror', (e) => console.log('[pageerror]', e.message));
await page.addInitScript(() => {
  const btn = () => ({ pressed: false, touched: false, value: 0 });
  const pad = { id: 'Xbox 360 Controller (STANDARD GAMEPAD Vendor: 045e Product: 028e)', index: 0, connected: true, mapping: 'standard', buttons: Array.from({ length: 17 }, btn), axes: [0, 0, 0, 0], timestamp: 1 };
  window.__press = (i, on) => { pad.buttons[i].pressed = on; pad.buttons[i].value = on ? 1 : 0; pad.timestamp++; };
  Object.defineProperty(navigator, 'getGamepads', { configurable: true, writable: true, value: () => [pad, null, null, null] });
});
await page.route(/mypc-sdk\.js/, (r) => r.fulfill({ contentType: 'text/javascript', body: fs.readFileSync(sdkPath) }));
await page.goto(`${server}/app/?server=${encodeURIComponent(server)}&tier=mid&dev`);
const code = await page.waitForFunction(() => { const e = document.querySelector('.code'); return e && e.textContent.replace(/\s/g, ''); }, null, { timeout: 20000 }).then((h) => h.jsonValue());
await cmd({ cmd: 'approve', code, name: 'imad' });
await page.waitForFunction(() => document.getElementById('screen').hidden, null, { timeout: 30000 });
await page.waitForTimeout(5000);
const tap = async (i, ms = 120) => { await page.evaluate((i) => window.__press(i, true), i); await page.waitForTimeout(ms); await page.evaluate((i) => window.__press(i, false), i); await page.waitForTimeout(250); };
const menuRows = () => page.evaluate(() => [...document.querySelectorAll('#gmenu .mr')].map((e) => (e.classList.contains('on') ? '>' : '') + e.textContent).join(' | '));
// Watch mode, then follow people until one is at the camp (within 12 m).
await tap(9);
for (let k = 0; k < 20 && !(await menuRows()).includes('>Watch the world'); k++) { await page.keyboard.press('ArrowDown'); await page.waitForTimeout(200); }
await tap(0); await page.waitForTimeout(1500);
const camp = (await cmd({ cmd: 'stats' })).data.camps[0];
const people = (await cmd({ cmd: "agents" })).data;
const near = (people.list ?? people).filter((p) => p.map === camp.map).sort((a, b) => Math.hypot(a.x - camp.x, a.y - camp.y) - Math.hypot(b.x - camp.x, b.y - camp.y));
console.log('people by the camp', near.map((p) => `${p.name} ${Math.round(Math.hypot(p.x - camp.x, p.y - camp.y))} m ${p.task ?? ''}`).join('; '));
// Bring the nearest person to the camp's fire side so the camera (following them) frames the camp.
// Look at the camp (dev hook: the camera stays there).
await page.evaluate(([x, y]) => window.__dev.look(x, y), [camp.x, camp.y]);
await page.waitForTimeout(6000);
await page.screenshot({ path: `${out}/1-camp-evening.png` });
console.log('card', await page.evaluate(() => document.getElementById('card').textContent));
// Night: everyone sleeps at the camp, the fire glows.
await until((s, c) => hourOf(c) >= 23 || hourOf(c) < 1, 30, 'night', 300);
await page.waitForTimeout(6000);
await page.screenshot({ path: `${out}/2-camp-night.png` });
console.log('night card', await page.evaluate(() => document.getElementById('card').textContent));
ws.close(); await browser.close();
