// Browser proof (imad 2026-11-26): seasons and weather on the TV (rain, a storm, snow lying on the ground, fog), the temperature in the
// top bar, the cold on my card while I stand still in a winter night and the warmth by a fire; the panel's World page (dark).
// Usage: ADMIN_TOKEN=... node tools/weather-proof.mjs <server> <sdk.js> <outdir>
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
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1 });
page.on('pageerror', (e) => console.log('[pageerror]', e.message));
await page.route(/mypc-sdk\.js/, (r) => r.fulfill({ contentType: 'text/javascript', body: fs.readFileSync(sdkPath) }));
await page.goto(`${server}/app/?server=${encodeURIComponent(server)}&tier=mid&dev`);
const code = await page.waitForFunction(() => { const s = document.getElementById('screen'); if (s && s.hidden) return 'in'; const e = document.querySelector('.code'); return e && e.textContent.replace(/\s/g, ''); }, null, { timeout: 30000 }).then((h) => h.jsonValue());
if (code !== 'in') await adm({ cmd: 'approve', code, name: 'imad' });
await page.waitForFunction(() => document.getElementById('screen').hidden, null, { timeout: 30000 });
await page.waitForTimeout(5000);
const key = async (k, n = 1) => { for (let i = 0; i < n; i++) { await page.keyboard.press(k); await page.waitForTimeout(220); } };
const menu = () => page.evaluate(() => document.getElementById('gmenu')?.hidden === false ? [...document.querySelectorAll('#gmenu .mt, #gmenu .mr')].map((e) => (e.classList.contains('on') ? '>' : '') + e.textContent).join(' | ') : '');
const dev = (f, ...a) => page.evaluate(([f, a]) => window.__dev[f](...a), [f, a]);
const top = () => page.evaluate(() => document.getElementById('top').textContent);
const card = () => page.evaluate(() => document.getElementById('card').textContent);
const note = () => page.evaluate(() => document.getElementById('note').hidden ? '' : document.getElementById('note').textContent);
if ((await menu()).includes('Save')) { for (let k = 0; k < 10 && !(await menu()).includes('>Save'); k++) await key('ArrowDown'); await key('Enter'); await page.waitForTimeout(600); }
if (await menu()) await key('Escape');
const me = (await dev('dbg')).meId;
// The clock: a winter day at 13:00 (gameSec 0 = 08:00).
const shot = async (name, wait = 4000) => { await page.waitForTimeout(wait); await page.screenshot({ path: `${out}/${name}.png` }); console.log(name, '|', await top(), '|', (await card()).slice(0, 120)); };
console.log('weather now', JSON.stringify(await adm({ cmd: 'weather' })));
await shot('0-spring-start');
await adm({ cmd: 'weather', season: 0 }); await adm({ cmd: 'weather', set: 'rain', hours: 12, k: 0.9 });
await dev('cam', 'third'); await dev('yaw', 0.6);
await shot('1-rain-third-person', 5000);
await adm({ cmd: 'weather', set: 'storm', hours: 12, k: 1 });
await shot('2-storm', 5000);
await adm({ cmd: 'weather', set: 'fog', hours: 12, k: 0.9 });
await shot('3-fog', 6000);
await adm({ cmd: 'weather', season: 3 });
await adm({ cmd: 'weather', set: 'snow', hours: 24, k: 0.85 });
await dev('cam', 'top');
await shot('4-snow-falling', 25000); // snow settles on the ground while it falls
await dev('cam', 'third'); await dev('yaw', 2.2);
await shot('5-snow-third-person', 4000);
await adm({ cmd: 'weather', set: 'clear', hours: 24 });
await shot('6-winter-clear-snow-lies', 4000);
// Standing still in the cold: my card says what it costs; then a fire next to me.
await adm({ cmd: 'weather', set: 'blizzard', hours: 24, k: 1 });
for (let k = 0; k < 8; k++) { await page.waitForTimeout(1000); const c = await card(); if (/−/.test(c)) break; }
await shot('7-blizzard-cold-card', 1500);
console.log('note:', await note());
const pos = await dev('me');
await adm({ cmd: 'agentSet', id: me, set: { 'bag.campfire': 1 } });
const r = await dev('do', 'build', `campfire#${Math.floor(pos[0]) + 2},${Math.floor(pos[1])},0`);
console.log('fire', JSON.stringify(r));
for (let k = 0; k < 8; k++) { await page.waitForTimeout(1000); const c = await card(); if (/🔥/.test(c)) break; }
await shot('8-by-the-fire-warm', 1500);
console.log('note:', await note());
console.log('weather at end', JSON.stringify(await adm({ cmd: 'weather' })));
await browser.close();
// The panel: World page in dark mode.
const b2 = await chromium.launch();
const ctx = await b2.newContext({ colorScheme: 'dark', viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
const pg = await ctx.newPage();
pg.on('pageerror', (e) => console.log('[panel pageerror]', e.message));
await pg.goto(server + '/panel/');
await pg.waitForSelector('#sTokBox');
await pg.evaluate(() => { document.getElementById('sTokBox').open = true; });
await pg.fill('#sTokIn', process.env.ADMIN_TOKEN);
if (await pg.inputValue('#sAddrIn') === '') await pg.fill('#sAddrIn', server);
await pg.click('#sGo');
await pg.waitForSelector('#app:not([hidden])', { timeout: 15000 });
await pg.evaluate(() => { location.hash = '#/world'; });
await pg.waitForTimeout(6000);
await pg.screenshot({ path: `${out}/9-panel-world-weather.png` });
await pg.click('#view .hq >> nth=1').catch(() => {}); // the weather card's "?"
await pg.waitForTimeout(400);
console.log('panel:', (await pg.textContent('#wxNow')), '|', await pg.textContent('#wxTemps'));
await b2.close();
ws.close();
