// Browser proof of the game's own menu, button mapping, thought bubbles, my needs and the person card.
// Usage: ADMIN_TOKEN=... node tools/menu-proof.mjs <server> <sdk.js> <outdir>
// A fake controller (an Xbox pad) is put in navigator.getGamepads so the SDK's standalone mode reads it.
import { createRequire } from 'node:module';
const { chromium } = createRequire(import.meta.url)('playwright');
import WebSocket from 'ws';
import { encode, decode } from '@msgpack/msgpack';
const [server, sdkPath, out] = process.argv.slice(2);
const admin = process.env.ADMIN_TOKEN;
const fs = await import('node:fs');
fs.mkdirSync(out, { recursive: true });
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
page.on('pageerror', (e) => console.log('[pageerror]', e.message));
page.on('console', (m) => { if (m.type() === 'error') console.log('[page]', m.text()); });
await page.addInitScript(() => {
  const btn = () => ({ pressed: false, touched: false, value: 0 });
  const pad = { id: 'Xbox 360 Controller (STANDARD GAMEPAD Vendor: 045e Product: 028e)', index: 0, connected: true, mapping: 'standard',
    buttons: Array.from({ length: 17 }, btn), axes: [0, 0, 0, 0], timestamp: 1 };
  window.__pad = pad;
  window.__press = (i, on) => { pad.buttons[i].pressed = on; pad.buttons[i].value = on ? 1 : 0; pad.timestamp++; };
  Object.defineProperty(navigator, 'getGamepads', { configurable: true, writable: true, value: () => [pad, null, null, null] });
});
await page.route(/mypc-sdk\.js/, (r) => r.fulfill({ contentType: 'text/javascript', body: fs.readFileSync(sdkPath) }));
await page.goto(`${server}/app/?server=${encodeURIComponent(server)}&tier=mid&dev`);
const code = await page.waitForFunction(() => { const e = document.querySelector('.code'); return e && e.textContent.replace(/\s/g, ''); }, null, { timeout: 20000 }).then((h) => h.jsonValue());
const ws = new WebSocket(server.replace(/^http/, 'ws') + '/ws');
await new Promise((r) => ws.on('open', r));
ws.send(encode({ t: 'hi', v: 1, token: admin, name: 'proof' }));
await new Promise((r) => setTimeout(r, 500));
ws.send(encode({ t: 'adm', id: 1, c: { cmd: 'approve', code, name: 'imad' } }));
ws.on('message', (d) => { const m = decode(d); if (m.t === 'admr' && m.id > 1) console.log('admin', JSON.stringify(m).slice(0, 200)); });
await page.waitForFunction(() => document.getElementById('screen').hidden, null, { timeout: 30000 });
await page.waitForTimeout(7000);

const tap = async (i, ms = 120) => { await page.evaluate((i) => window.__press(i, true), i); await page.waitForTimeout(ms); await page.evaluate((i) => window.__press(i, false), i); await page.waitForTimeout(250); };
const key = async (k) => { await page.keyboard.press(k); await page.waitForTimeout(250); };
const state = () => page.evaluate(() => ({
  hint: document.getElementById('hint').textContent,
  note: document.getElementById('note').hidden ? '' : document.getElementById('note').textContent,
  card: document.getElementById('card').hidden ? '' : document.getElementById('card').textContent,
  menu: document.getElementById('gmenu')?.hidden === false ? [...document.querySelectorAll('#gmenu .mt, #gmenu .mr')].map((e) => (e.classList.contains('on') ? '>' : '') + e.textContent).join(' | ') : '',
  bubbles: [...document.querySelectorAll('.bub')].filter((b) => !b.hidden).map((b) => b.textContent),
}));

// 1. Playing: my needs card, thought bubbles over the people near me (this player is "imad", allowed by default).
// Bring three people next to my character (admin agentMove) so their bubbles are in view.
const [mx, my, mmap] = await page.evaluate(() => window.__dev.me());
for (const [k, dx, dy] of [[0, 3, -1], [1, -3, 1], [2, 1, 3]]) ws.send(encode({ t: 'adm', id: 10 + k, c: { cmd: 'agentMove', id: k, map: mmap, x: mx + dx, y: my + dy } }));
await page.waitForTimeout(1800);
await page.screenshot({ path: `${out}/1-play-bubbles.png` });
console.log('1', JSON.stringify(await state()));

// 2. Actions: Y (sleep), then move to wake; X (eat) with no food.
await tap(3); await page.waitForTimeout(600);
console.log('2a sleep', (await state()).note);
await page.keyboard.down('ArrowRight'); await page.waitForTimeout(500); await page.keyboard.up('ArrowRight');
await tap(2); await page.waitForTimeout(600);
console.log('2b eat', (await state()).note);

// 3. The game menu (+ on the controller = Start, button 9).
await tap(9); await page.waitForTimeout(400);
await page.screenshot({ path: `${out}/2-menu.png` });
console.log('3', (await state()).menu);

// 4. Buttons page: choose "Eat", press RT (7) to put Eat on it.
const goRow = async (label) => {
  for (let k = 0; k < 20; k++) { const s = await state(); if (s.menu.includes('>' + label)) return; await key('ArrowDown'); }
  throw new Error('row not found ' + label);
};
await goRow('Buttons'); await tap(0);
await goRow('Eat'); await tap(0);
console.log('4a', (await state()).note);
await tap(7); await page.waitForTimeout(300);
await page.screenshot({ path: `${out}/3-buttons.png` });
const s4 = await state();
console.log('4b', s4.note, '|', s4.menu.split(' | ').filter((r) => /Eat/.test(r)).join(' '));
// B back to the root, then B closes.
await tap(1); await tap(1);
console.log('4c menu closed:', !(await state()).menu, '| hint:', (await state()).hint);
// RT now eats.
await tap(7); await page.waitForTimeout(600);
console.log('4d RT ->', (await state()).note);

// 5. Watch mode from the menu, follow someone (A), the side card, then the full person page.
await tap(9); await goRow('Watch the world'); await tap(0);
await page.waitForTimeout(1500);
await tap(0); await page.waitForTimeout(5000);
await page.screenshot({ path: `${out}/4-watch-card.png` });
console.log('5a', JSON.stringify(await state()));
await tap(3); await page.waitForTimeout(1500); // Y = person card page in watch mode
await page.screenshot({ path: `${out}/5-person-page.png` });
console.log('5b', (await state()).menu.slice(0, 300));
console.log('5c', await page.evaluate(() => document.querySelector('#gmenu .mx').textContent.slice(0, 400)));
await tap(1); await tap(1);
// Settings page.
await tap(9); await goRow('Settings'); await tap(0);
await page.screenshot({ path: `${out}/6-settings.png` });
console.log('6', (await state()).menu);
// Remote Back closes the menu page by page.
await key('Escape'); await key('Escape');
console.log('7 after Back x2 menu:', (await state()).menu || '(closed)');
ws.close(); await browser.close();
