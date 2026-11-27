// Browser proof of the bag & crafting screen, the gear screen and gear on the character (imad 2026-11-25).
// Usage: ADMIN_TOKEN=... node tools/gear-proof.mjs <server> <sdk.js> <outdir>
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
await page.goto(`${server}/app/?server=${encodeURIComponent(server)}&tier=mid&dev`);
const code = await page.waitForFunction(() => { const s = document.getElementById('screen'); if (s && s.hidden) return 'in'; const e = document.querySelector('.code'); return e && e.textContent.replace(/\s/g, ''); }, null, { timeout: 30000 }).then((h) => h.jsonValue());
if (code !== 'in') await adm({ cmd: 'approve', code, name: 'imad' });
await page.waitForFunction(() => document.getElementById('screen').hidden, null, { timeout: 30000 });
await page.waitForTimeout(5000);
const key = async (k, n = 1) => { for (let i = 0; i < n; i++) { await page.keyboard.press(k); await page.waitForTimeout(250); } };
const menu = () => page.evaluate(() => document.getElementById('gmenu')?.hidden === false ? [...document.querySelectorAll('#gmenu .mt, #gmenu .mr')].map((e) => (e.classList.contains('on') ? '>' : '') + e.textContent).join(' | ') : '');
const note = () => page.evaluate(() => document.getElementById('note').hidden ? '' : document.getElementById('note').textContent);
const desc = () => page.evaluate(() => document.querySelector('#gmenu .ds')?.textContent ?? document.querySelector('#gmenu .gd')?.textContent ?? '');
const goRow = async (label) => { for (let k = 0; k < 30; k++) { if ((await menu()).includes('>' + label)) return; await key('ArrowDown'); } throw new Error('row not found ' + label + ' in ' + await menu()); };
if ((await menu()).includes('How I look')) { await goRow('Save'); await key('Enter'); await page.waitForTimeout(600); if (await menu()) await key('Escape'); }
// My character's id, and a bag to play with.
const meId = await page.evaluate(() => window.__dev.dbg().meId);
console.log('me:', meId);
const bag = { wood: 10, stone: 6, ore: 14, leather: 6, claw: 4, scrap: 4, brick: 2, sword: 1, bow: 1, arrows: 12, clothes: 1, helmet: 1, palisade: 2 };
const set = {}; for (const [k, n] of Object.entries(bag)) set['bag.' + k] = n;
console.log('bag:', JSON.stringify((await adm({ cmd: 'agentSet', id: meId, set })) ?? {}).slice(0, 120));
await page.waitForTimeout(1500);
// 1. Bag & crafting.
await page.evaluate(() => window.__dev.act('menu')); await page.waitForTimeout(400);
await goRow('Bag & crafting'); await key('Enter'); await page.waitForTimeout(800);
console.log('1 inv:', await desc());
await page.screenshot({ path: `${out}/1-bag.png` });
// 2. Clothing tab, armour from the recipe book: the grid fills, the result shows.
await key('ArrowUp', 4); await key('ArrowRight'); await key('ArrowDown'); await key('ArrowRight', 3); await key('ArrowRight');
console.log('2 book:', await desc());
await key('Enter'); await page.waitForTimeout(400);
console.log('2 filled:', await desc());
await page.screenshot({ path: `${out}/2-craft-armor.png` });
did.length = 0; await key('Enter'); await page.waitForTimeout(900);
console.log('2 made:', JSON.stringify(did.find((d) => d.a === 'craft')), '|', await note());
// 3. Put materials in by hand from the bag (wood + ore = sword in Weapons).
await key('ArrowUp', 1); await key('ArrowLeft', 3); await key('Enter'); // tabs: Weapons
await key('ArrowDown', 4); // bag row 0
await key('Enter'); await key('ArrowRight', 2); await key('Enter');
console.log('3 by hand:', await desc());
await page.screenshot({ path: `${out}/3-grid-by-hand.png` });
await key('Escape'); await page.waitForTimeout(300);
// 4. Gear: level the sword up to level 5 and raise its quality.
await goRow('Gear'); await key('Enter'); await page.waitForTimeout(1200);
await page.screenshot({ path: `${out}/4-gear.png` });
await key('ArrowRight'); await key('ArrowDown');
for (let k = 0; k < 4; k++) { did.length = 0; await key('Enter'); await page.waitForTimeout(700); console.log('4 level up:', JSON.stringify(did.find((d) => d.a === 'upgrade')), '|', await note()); }
await key('ArrowDown'); did.length = 0; await key('Enter'); await page.waitForTimeout(700);
console.log('4 quality:', JSON.stringify(did.find((d) => d.a === 'upgrade')), '|', await note());
await page.waitForTimeout(1500);
await page.screenshot({ path: `${out}/5-gear-upgraded.png` });
await page.waitForTimeout(2200); // the preview swings now and then
await page.screenshot({ path: `${out}/6-gear-swing.png` });
await key('Escape'); await key('Escape'); await page.waitForTimeout(400);
// 5. In the world, third person: a swing with the sword.
await page.evaluate(() => window.__dev.cam('third')); await page.waitForTimeout(1500);
await page.evaluate(() => window.__dev.act('attack')); await page.waitForTimeout(350);
await page.screenshot({ path: `${out}/7-swing-world.png` });
console.log('done');
await browser.close(); ws.close();
