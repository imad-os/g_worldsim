// Browser proof of the player's buttons (imad 2026-11-20): Interact / Talk / Attack / Aim / Build, the Build page and the
// "How to fight" guide. Usage: ADMIN_TOKEN=... node tools/buttons-proof.mjs <server> <sdk.js> <outdir>
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
const did = [];
page.on('websocket', (sock) => sock.on('framereceived', (f) => { try { const m = decode(Buffer.isBuffer(f.payload) ? f.payload : Buffer.from(f.payload)); if (m.t === 'note' && m.kind === 'did') did.push(m.data); } catch {} }));
await page.route(/mypc-sdk\.js/, (r) => r.fulfill({ contentType: 'text/javascript', body: fs.readFileSync(sdkPath) }));
const ws = new WebSocket(server.replace(/^http/, 'ws') + '/ws');
await new Promise((r) => ws.on('open', r));
ws.send(encode({ t: 'hi', v: 1, token: admin, name: 'proof' }));
const answers = new Map();
ws.on('message', (d) => { const m = decode(d); if (m.t === 'admr') answers.set(m.id, m); });
let aid = 100;
const adm = async (c) => { const id = ++aid; ws.send(encode({ t: 'adm', id, c })); for (let k = 0; k < 50 && !answers.has(id); k++) await new Promise((r) => setTimeout(r, 100)); return answers.get(id); };
await page.goto(`${server}/app/?server=${encodeURIComponent(server)}&tier=low&dev`);
const code = await page.waitForFunction(() => { const s = document.getElementById('screen'); if (s && s.hidden) return 'in'; const e = document.querySelector('.code'); return e && e.textContent.replace(/\s/g, ''); }, null, { timeout: 30000 }).then((h) => h.jsonValue());
if (code !== 'in') await adm({ cmd: 'approve', code, name: 'imad' });
await page.waitForFunction(() => document.getElementById('screen').hidden, null, { timeout: 30000 });
await page.waitForTimeout(6000);
const key = async (k, n = 1) => { for (let i = 0; i < n; i++) { await page.keyboard.press(k); await page.waitForTimeout(220); } };
const menu = () => page.evaluate(() => document.getElementById('gmenu')?.hidden === false ? [...document.querySelectorAll('#gmenu .mt, #gmenu .mr')].map((e) => (e.classList.contains('on') ? '>' : '') + e.textContent).join(' | ') : '');
const note = () => page.evaluate(() => document.getElementById('note').hidden ? '' : document.getElementById('note').textContent);
const text = () => page.evaluate(() => document.querySelector('#gmenu .mx')?.textContent ?? '');
const goRow = async (label) => { for (let k = 0; k < 30; k++) { if ((await menu()).includes('>' + label)) return; await key('ArrowDown'); } throw new Error('row not found ' + label + ' in ' + await menu()); };
// The first-entry look page (new character): save it so the world is free.
if ((await menu()).includes('How I look')) { await goRow('Save'); await key('Enter'); await page.waitForTimeout(600); if (await menu()) await key('Escape'); }
console.log('0 note (new buttons):', await note());
console.log('1 hints:', await page.evaluate(() => document.getElementById('hint').textContent));
const [mx, my, map] = await page.evaluate(() => window.__dev.me());
// 2. Talk with nobody near; Interact (take / gather).
await page.evaluate(() => window.__dev.act('talk')); await page.waitForTimeout(300);
console.log('2 talk alone:', await note());
// 3. Attack: a zombie spawned 1.5 m east, facing it.
const z = await adm({ cmd: 'zombieSpawn', map, x: mx + 1.6, y: my, stays: true });
console.log('3 zombie:', JSON.stringify(z?.r ?? z).slice(0, 120));
await page.waitForTimeout(1500);
did.length = 0;
await page.evaluate(() => window.__dev.act('attack')); await page.waitForTimeout(900);
console.log('3 attack ->', JSON.stringify(did.find((d) => d.a === 'hit')), '| note:', await note());
await page.screenshot({ path: `${out}/1-attack.png` });
// 4. Aim (held): the line on the ground; no bow = told how to make one.
await page.evaluate(() => window.__dev.act('aim', true)); await page.waitForTimeout(700);
console.log('4 aim:', JSON.stringify(await page.evaluate(() => window.__dev.aim())), '| note:', await note());
await page.screenshot({ path: `${out}/2-aim.png` });
did.length = 0;
await page.evaluate(() => window.__dev.act('attack')); await page.waitForTimeout(700);
console.log('4 shoot without a bow:', await note());
await page.evaluate(() => window.__dev.act('aim', false));
// 5. Build page and the fight guide.
await page.evaluate(() => window.__dev.act('build')); await page.waitForTimeout(500);
console.log('5 build:', await menu());
console.log('5 build text:', await text());
await page.screenshot({ path: `${out}/3-build.png` });
await key('Enter'); await page.waitForTimeout(800);
console.log('5 hut without wood:', JSON.stringify(did.find((d) => d.a === 'build')), '|', await note());
await page.waitForTimeout(1500);
await page.evaluate(() => window.__dev.act('menu')); await page.waitForTimeout(400);
console.log('6 root:', await menu());
await goRow('How to fight'); await key('Enter'); await page.waitForTimeout(400);
console.log('6 fight:', await text());
await page.screenshot({ path: `${out}/4-fight.png` });
await key('Escape'); await page.waitForTimeout(400);
console.log('6b back:', await menu());
await goRow('Buttons'); await key('Enter'); await page.waitForTimeout(300);
console.log('7 controls:', await menu());
await page.screenshot({ path: `${out}/5-controls.png` });
await browser.close(); ws.close();
