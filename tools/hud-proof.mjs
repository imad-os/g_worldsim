// Browser proof (imad 2026-11-26): the compass icons in their own colours, my card on the very top edge, the chat log at the bottom left
// (what people near me say + the world channel, last 4 lines), and no NPC lines when an AI person takes a quest.
// Usage: ADMIN_TOKEN=... node tools/hud-proof.mjs <server> <sdk.js> <outdir>
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
const page = await browser.newPage({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 2 });
page.on('pageerror', (e) => console.log('[pageerror]', e.message));
await page.route(/mypc-sdk\.js/, (r) => r.fulfill({ contentType: 'text/javascript', body: fs.readFileSync(sdkPath) }));
await page.goto(`${server}/app/?server=${encodeURIComponent(server)}&tier=mid&dev`);
const code = await page.waitForFunction(() => { const s = document.getElementById('screen'); if (s && s.hidden) return 'in'; const e = document.querySelector('.code'); return e && e.textContent.replace(/\s/g, ''); }, null, { timeout: 30000 }).then((h) => h.jsonValue());
if (code !== 'in') await adm({ cmd: 'approve', code, name: 'imad' });
await page.waitForFunction(() => document.getElementById('screen').hidden, null, { timeout: 30000 });
await page.waitForTimeout(5000);
const key = async (k) => { await page.keyboard.press(k); await page.waitForTimeout(250); };
const menu = () => page.evaluate(() => document.getElementById('gmenu')?.hidden === false ? [...document.querySelectorAll('#gmenu .mt, #gmenu .mr')].map((e) => (e.classList.contains('on') ? '>' : '') + e.textContent).join(' | ') : '');
const dev = (f, ...a) => page.evaluate(([f, a]) => window.__dev[f](...a), [f, a]);
if ((await menu()).includes('Save')) { for (let k = 0; k < 10 && !(await menu()).includes('>Save'); k++) await key('ArrowDown'); await key('Enter'); await page.waitForTimeout(600); }
if (await menu()) await key('Escape');
const p = await dev('me');
// Marks of every kind round me, so the compass shows them all.
const kinds = ['home', 'mine', 'hunt', 'wood', 'water', 'farm', 'danger', 'camp', 'star'];
kinds.forEach((k, n) => { const a = -Math.PI / 2 + (n - 4) * 0.33; dev('do', 'mark', `add:${p[2]}:${Math.round(p[0] + Math.cos(a) * (30 + n * 7))}:${Math.round(p[1] + Math.sin(a) * (30 + n * 7))}:${k}`); });
// People near me talk; a death and a quest visit happen elsewhere.
const pr = await adm({ cmd: 'people' }), people = Array.isArray(pr) ? pr : pr?.list ?? [];
const live = people.filter((x) => x.alive !== false);
for (const [k, x] of live.slice(0, 2).entries()) await adm({ cmd: 'agentMove', id: x.id, map: p[2], x: Math.round(p[0] + 2 + k), y: Math.round(p[1] - 3) });
await page.waitForTimeout(1500);
for (const [k, x] of live.slice(0, 2).entries()) { await adm({ cmd: 'chat', id: x.id, text: k ? 'How are you today?' : 'Hello there!' }); await page.waitForTimeout(800); }
if (live[3]) await adm({ cmd: 'kill', id: live[3].id });
await page.waitForTimeout(3000);
await dev('cam', 'top');
await page.waitForTimeout(1500);
await page.screenshot({ path: `${out}/1-hud-top.png` });
await dev('cam', 'third'); await dev('yaw', 0); await page.waitForTimeout(2500);
await page.screenshot({ path: `${out}/2-hud-third-person.png` });
const hud = await page.evaluate(() => {
  const r = (id) => { const b = document.getElementById(id)?.getBoundingClientRect(); return b ? [Math.round(b.left), Math.round(b.top), Math.round(b.width), Math.round(b.height)] : null; };
  return { card: r('card'), compass: r('compass'), chat: [...document.querySelectorAll('#chatlog div')].map((d) => d.textContent), note: document.getElementById('note').hidden ? '' : document.getElementById('note').textContent,
    colours: [...document.querySelectorAll('.cp-i')].map((e) => e.className + ' ' + getComputedStyle(e.querySelector('svg')).fill) };
});
console.log(JSON.stringify(hud, null, 1));
await browser.close(); ws.close();
