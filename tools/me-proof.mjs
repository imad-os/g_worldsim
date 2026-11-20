// Browser proof of the player's character as a person: the first-entry look screen (woman / man, skin tone), the "Me"
// page (level, family, autopilot, rules), asking someone to be a partner. Usage:
// ADMIN_TOKEN=... node tools/me-proof.mjs <server> <sdk.js> <outdir>
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
page.on('websocket', (sock) => sock.on('framereceived', (f) => { try { const m = decode(Buffer.isBuffer(f.payload) ? f.payload : Buffer.from(f.payload)); if (m.t === 'note' && m.kind === 'did' && process.env.DEBUG) console.log('[did]', JSON.stringify(m.data).slice(0, 160)); } catch {} }));
await page.route(/mypc-sdk\.js/, (r) => r.fulfill({ contentType: 'text/javascript', body: fs.readFileSync(sdkPath) }));
const ws = new WebSocket(server.replace(/^http/, 'ws') + '/ws');
await new Promise((r) => ws.on('open', r));
ws.send(encode({ t: 'hi', v: 1, token: admin, name: 'proof' }));
const answers = new Map();
ws.on('message', (d) => { const m = decode(d); if (m.t === 'admr') answers.set(m.id, m); });
let aid = 100;
const adm = async (c) => { const id = ++aid; ws.send(encode({ t: 'adm', id, c })); for (let k = 0; k < 50 && !answers.has(id); k++) await new Promise((r) => setTimeout(r, 100)); return answers.get(id); };
await page.goto(`${server}/app/?server=${encodeURIComponent(server)}&tier=low&dev`);
// Auto join (default) or a pairing code.
const code = await page.waitForFunction(() => { const s = document.getElementById('screen'); if (s && s.hidden) return 'in'; const e = document.querySelector('.code'); return e && e.textContent.replace(/\s/g, ''); }, null, { timeout: 30000 }).then((h) => h.jsonValue());
if (code !== 'in') await adm({ cmd: 'approve', code, name: 'imad' });
await page.waitForFunction(() => document.getElementById('screen').hidden, null, { timeout: 30000 });
await page.waitForTimeout(6000);
const key = async (k, n = 1) => { for (let i = 0; i < n; i++) { await page.keyboard.press(k); await page.waitForTimeout(220); } };
const menu = () => page.evaluate(() => document.getElementById('gmenu')?.hidden === false ? [...document.querySelectorAll('#gmenu .mt, #gmenu .mr')].map((e) => (e.classList.contains('on') ? '>' : '') + e.textContent).join(' | ') : '');
const note = () => page.evaluate(() => document.getElementById('note').hidden ? '' : document.getElementById('note').textContent);
const text = () => page.evaluate(() => document.querySelector('#gmenu .mx')?.textContent ?? '');
const goRow = async (label) => { for (let k = 0; k < 20; k++) { if ((await menu()).includes('>' + label)) return; await key('ArrowDown'); } throw new Error('row not found ' + label + ' in ' + await menu()); };

// 1. First entry: the look page opens by itself.
console.log('1 look page:', await menu());
console.log('1 text:', await text());
await page.screenshot({ path: `${out}/1-first-look.png` });
await goRow('Woman'); await key('Enter');
await goRow('Skin tone 4'); await key('Enter');
await page.screenshot({ path: `${out}/2-look-chosen.png` });
await goRow('Save'); await key('Enter');
await page.waitForTimeout(800);
console.log('2 saved:', await note(), '| menu now:', await menu() || '(closed)');
// 3. The Me page.
let m = await menu();
console.log('3 root:', m);
await goRow('Me'); await key('Enter'); await page.waitForTimeout(800);
console.log('3 me:', await menu());
console.log('3 me text:', await text());
await page.screenshot({ path: `${out}/3-me.png` });
// 4. Autopilot on, a rule (the keyboard answers by itself here).
// The sex can't change again this week.
await goRow('How I look'); await key('Enter'); await goRow('Man'); await key('Enter'); await goRow('Save'); await key('Enter'); await page.waitForTimeout(800);
console.log('3b first change after the pick:', await note());
await goRow('How I look'); await key('Enter'); await goRow('Woman'); await key('Enter'); await goRow('Save'); await key('Enter'); await page.waitForTimeout(800);
console.log('3c again the same week:', await note()); await key('Escape'); await page.waitForTimeout(300);
await goRow('AI autopilot'); await key('Enter'); await page.waitForTimeout(700);
console.log('4 auto:', await note(), '|', (await menu()).split(' | ').find((r) => r.includes('autopilot')));
await page.evaluate(() => { window.MyPC.text = window.MyPC.text || {}; window.MyPC.text.keyboard = async () => 'you must get married'; });
await goRow('My rules'); await key('Enter');
await goRow('Add a rule'); await key('Enter'); await page.waitForTimeout(900);
console.log('4 rules:', await menu(), '|', await note());
await page.screenshot({ path: `${out}/4-rules.png` });
await key('Escape'); await page.waitForTimeout(500);
// 5. A woman next to me: ask her to be my partner (from the person page).
const ov = await adm({ cmd: 'people' });
const list = ov?.data?.people ?? ov?.data?.list ?? ov?.data ?? [];
console.log('5 people answer keys:', Object.keys(ov?.data ?? {}).join(','));
const [mx, my, mmap] = await page.evaluate(() => window.__dev.me());
const woman = (Array.isArray(list) ? list : []).find((p) => p.sex === 'f' && p.alive && !p.player && p.age >= 18 && p.age <= 45 && !p.partner);
console.log('5 woman:', woman?.name, woman?.id);
if (woman) {
  await adm({ cmd: 'agentMove', id: woman.id, map: mmap, x: mx + 1.5, y: my });
  await page.waitForTimeout(1500);
  for (let k = 0; k < 6 && !(await menu()).startsWith('World'); k++) { await page.keyboard.press('Escape'); await page.waitForTimeout(700); }
  await goRow('Nearest person');
  await key('Enter'); await page.waitForTimeout(1500);
  console.log('5 person:', await menu());
  await page.screenshot({ path: `${out}/5-person.png` });
  for (let k = 0; k < 10; k++) {
    if (!(await menu()).includes('Ask to be my partner')) break;
    await goRow('Ask to be my partner'); await key('Enter'); await page.waitForTimeout(900);
    const n = await note(); console.log('5 ask:', n);
    if (/said yes/.test(n)) break;
  }
  await page.screenshot({ path: `${out}/6-partner.png` });
}
await key('Escape', 3);
ws.close(); await browser.close();
