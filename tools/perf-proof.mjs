// Frame cost proof (imad 2026-11-26: "60 fps on low-end devices"): the same views on every run (town and woods, top / third / first
// person), each rendered 15 times with gl.finish() (= the whole GPU cost, software GL in the cloud), plus draw calls, triangles and
// the real frame rate over 4 s. Usage: ADMIN_TOKEN=... node tools/perf-proof.mjs <server> <sdk.js> <outdir> [tier] [label]
import { createRequire } from 'node:module';
const { chromium } = createRequire(import.meta.url)('playwright');
import WebSocket from 'ws';
import { encode, decode } from '@msgpack/msgpack';
const [server, sdkPath, out, tier = 'mid', label = 'run'] = process.argv.slice(2);
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
await adm({ cmd: 'weather', set: 'clear', hours: 48 });
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1 });
page.on('pageerror', (e) => console.log('[pageerror]', e.message));
await page.route(/mypc-sdk\.js/, (r) => r.fulfill({ contentType: 'text/javascript', body: fs.readFileSync(sdkPath) }));
await page.goto(`${server}/app/?server=${encodeURIComponent(server)}&tier=${tier}&dev`);
const code = await page.waitForFunction(() => { const s = document.getElementById('screen'); if (s && s.hidden) return 'in'; const e = document.querySelector('.code'); return e && e.textContent.replace(/\s/g, ''); }, null, { timeout: 30000 }).then((h) => h.jsonValue());
if (code !== 'in') await adm({ cmd: 'approve', code, name: 'imad' });
await page.waitForFunction(() => document.getElementById('screen').hidden, null, { timeout: 30000 });
await page.waitForTimeout(4000);
const key = async (k, n = 1) => { for (let i = 0; i < n; i++) { await page.keyboard.press(k); await page.waitForTimeout(220); } };
const menu = () => page.evaluate(() => document.getElementById('gmenu')?.hidden === false ? [...document.querySelectorAll('#gmenu .mt, #gmenu .mr')].map((e) => (e.classList.contains('on') ? '>' : '') + e.textContent).join(' | ') : '');
if ((await menu()).includes('Save')) { for (let k = 0; k < 10 && !(await menu()).includes('>Save'); k++) await key('ArrowDown'); await key('Enter'); await page.waitForTimeout(600); }
if (await menu()) await key('Escape');
const dev = (f, ...a) => page.evaluate(([f, a]) => window.__dev[f](...a), [f, a]);
const me = (await dev('dbg')).meId;
if (process.env.DYN !== '1') await dev('res', false).catch(() => {}); // fixed size: the same pixels on every run (the cloud's software GL would shrink it)
const fps = () => page.evaluate(() => new Promise((res) => { let n = 0; const t0 = performance.now(); const f = () => { n++; if (performance.now() - t0 < 4000) requestAnimationFrame(f); else res(n * 1000 / (performance.now() - t0)); }; requestAnimationFrame(f); }));
const rows = [];
async function scene(name, map, x, y, view, yaw) {
  for (let k = 0; k < 6; k++) { await adm({ cmd: 'agentMove', id: me, map, x, y }); await page.waitForTimeout(1200); const p = await dev('me'); if (p[2] === map && Math.hypot(p[0] - x, p[1] - y) < 3) break; }
  await dev('cam', view); await dev('yaw', yaw);
  for (let k = 0; k < 60; k++) { await page.waitForTimeout(500); const b = await dev('bench', 1); if (b && b.q === 0 && k > 4) break; }
  await page.waitForTimeout(1500);
  const b = await dev('bench', 15), f = await fps();
  await page.screenshot({ path: `${out}/${label}-${name}.png` });
  const row = { worker: b.worker, name, ms: +b.ms.toFixed(1), calls: b.calls, tris: b.tris, fps: +f.toFixed(1), chunks: b.chunks, px: `${b.w}x${b.h}` };
  rows.push(row); console.log(JSON.stringify(row));
}
await scene('town-top', 'town', 128, 128, 'top', 0);
await scene('town-third', 'town', 128, 128, 'third', 0.7);
await scene('woods-top', 'woods', 96, 96, 'top', 0);
await scene('woods-third', 'woods', 96, 96, 'third', 0.7);
await scene('woods-first', 'woods', 96, 96, 'first', 2.4);
fs.writeFileSync(`${out}/${label}-${tier}.json`, JSON.stringify(rows, null, 1));
await adm({ cmd: 'agentMove', id: me, map: 'town', x: 128, y: 128 });
await browser.close(); ws.close();
