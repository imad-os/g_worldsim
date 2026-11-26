// Browser proof of how the gates between maps look (imad 2026-11-26: "the portals look silly ... not doors but just an opening
// between trees"). Stands next to every gate of the town and of the woods, top and third-person views, travel open.
// Usage: ADMIN_TOKEN=... [OLD=old game.js] node tools/gates-proof.mjs <server> <sdk.js> <outdir> [prefix]
import { createRequire } from 'node:module';
const { chromium } = createRequire(import.meta.url)('playwright');
import WebSocket from 'ws';
import { encode, decode } from '@msgpack/msgpack';
const [server, sdkPath, out, prefix = ''] = process.argv.slice(2);
const fs = await import('node:fs');
fs.mkdirSync(out, { recursive: true });
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const ws = new WebSocket(server.replace(/^http/, 'ws') + '/ws');
await new Promise((r) => ws.on('open', r));
ws.send(encode({ t: 'hi', v: 1, token: process.env.ADMIN_TOKEN, name: 'proof' }));
const answers = new Map();
let welcome = null;
ws.on('message', (d) => { const m = decode(d); if (m.t === 'admr') answers.set(m.id, m); if (m.t === 'wel') welcome = m; });
let aid = 100;
const adm = async (c) => { const id = ++aid; ws.send(encode({ t: 'adm', id, c })); for (let k = 0; k < 80 && !answers.has(id); k++) await new Promise((r) => setTimeout(r, 100)); return answers.get(id); };
while (!welcome) await new Promise((r) => setTimeout(r, 100));
if (process.env.TRAVEL) await adm({ cmd: 'travel', open: process.env.TRAVEL === '1' });
await adm({ cmd: 'clockSpeed', day: 0.25 });
const page = await browser.newPage({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1 });
page.on('pageerror', (e) => console.log('[pageerror]', e.message));
await page.route(/mypc-sdk\.js/, (r) => r.fulfill({ contentType: 'text/javascript', body: fs.readFileSync(sdkPath) }));
if (process.env.OLD) await page.route(/game\.js/, (r) => r.fulfill({ contentType: 'text/javascript', body: fs.readFileSync(process.env.OLD) }));
await page.goto(`${server}/app/?server=${encodeURIComponent(server)}&tier=mid&dev`);
const code = await page.waitForFunction(() => { const s = document.getElementById('screen'); if (s && s.hidden) return 'in'; const e = document.querySelector('.code'); return e && e.textContent.replace(/\s/g, ''); }, null, { timeout: 30000 }).then((h) => h.jsonValue());
if (code !== 'in') await adm({ cmd: 'approve', code, name: 'imad' });
await page.waitForFunction(() => document.getElementById('screen').hidden, null, { timeout: 30000 });
await page.waitForTimeout(4000);
for (let k = 0; k < 3; k++) if (await page.evaluate(() => document.getElementById('gmenu')?.hidden === false)) { await page.keyboard.press('Escape'); await page.waitForTimeout(400); }
const me = (await page.evaluate(() => window.__dev.dbg())).meId;
const maps = welcome.maps ?? [];
const sizeOf = (id) => { const m = maps.find((q) => q.id === id); return m ? [m.w, m.h] : [256, 256]; };
const only = (process.env.GATES ?? '').split(',').filter(Boolean);
let n = 0;
for (const p of welcome.portals) {
  if (only.length && !only.includes(p.id)) continue;
  const [w, h] = sizeOf(p.map);
  // Stand on the road 9 m in from the gate, looking out at it.
  const dx = p.x < 20 ? 1 : p.x > w - 20 ? -1 : 0, dy = dx ? 0 : p.y < 20 ? 1 : p.y > h - 20 ? -1 : 0;
  const sx = p.x + dx * 7, sy = p.y + dy * 7;
  for (let k = 0; k < 6; k++) {
    await adm({ cmd: 'agentMove', id: me, map: p.map, x: sx, y: sy });
    await page.waitForTimeout(1500);
    const at = await page.evaluate(() => window.__dev.me());
    if (at[2] === p.map && Math.hypot(at[0] - sx, at[1] - sy) < 3) break;
  }
  await page.waitForTimeout(2500);
  const yaw = Math.atan2(p.y - sy, p.x - sx) + Math.PI / 2; // the camera looks along yaw - pi/2
  await page.evaluate(() => window.__dev.cam('top'));
  await page.waitForTimeout(1500);
  await page.screenshot({ path: `${out}/${prefix}${++n}-${p.map}-${p.id}-top.png` });
  await page.evaluate((y) => { window.__dev.cam('third'); window.__dev.yaw(y); }, yaw);
  await page.waitForTimeout(2500);
  await page.screenshot({ path: `${out}/${prefix}${n}-${p.map}-${p.id}-third.png` });
  console.log('gate', p.id, p.map, p.x, p.y, '->', p.to);
}
await browser.close(); ws.close(); process.exit(0);
