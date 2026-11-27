// Browser proof of the road between maps (imad 2026-11-26: "it must work every time, smooth from entering the gate, load the next map
// during the animation, 5-15 s, the timer must not count without the animation"). Walks into a town gate on foot, then rides back
// from the woods on a horse; samples the TV's trip state (__dev.trip) every 200 ms and takes screenshots along the way.
// Usage: ADMIN_TOKEN=... node tools/travel-proof.mjs <server> <sdk.js> <outdir>
import { createRequire } from 'node:module';
const { chromium } = createRequire(import.meta.url)('playwright');
import WebSocket from 'ws';
import { encode, decode } from '@msgpack/msgpack';
const [server, sdkPath, out] = process.argv.slice(2);
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
await adm({ cmd: 'travel', open: true });
await adm({ cmd: 'zombies', perNight: 0 });
const page = await browser.newPage({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1 });
page.on('pageerror', (e) => console.log('[pageerror]', e.message));
await page.route(/mypc-sdk\.js/, (r) => r.fulfill({ contentType: 'text/javascript', body: fs.readFileSync(sdkPath) }));
await page.goto(`${server}/app/?server=${encodeURIComponent(server)}&tier=low&dev`);
const code = await page.waitForFunction(() => { const s = document.getElementById('screen'); if (s && s.hidden) return 'in'; const e = document.querySelector('.code'); return e && e.textContent.replace(/\s/g, ''); }, null, { timeout: 30000 }).then((h) => h.jsonValue());
if (code !== 'in') await adm({ cmd: 'approve', code, name: 'imad' });
await page.waitForFunction(() => document.getElementById('screen').hidden, null, { timeout: 30000 });
await page.waitForTimeout(4000);
for (let k = 0; k < 3; k++) if (await page.evaluate(() => document.getElementById('gmenu')?.hidden === false)) { await page.keyboard.press('Escape'); await page.waitForTimeout(400); }
const me = (await page.evaluate(() => window.__dev.dbg())).meId;
const sizeOf = (id) => { const m = welcome.maps.find((q) => q.id === id); return m ? [m.w, m.h] : [256, 256]; };

async function trip(from, to, label) {
  const p = welcome.portals.find((q) => q.map === from && q.to === to);
  const [w, h] = sizeOf(from);
  const dx = p.x < 20 ? 1 : p.x > w - 20 ? -1 : 0, dy = dx ? 0 : p.y < 20 ? 1 : p.y > h - 20 ? -1 : 0;
  const sx = p.x + dx * 5, sy = p.y + dy * 5;
  for (let k = 0; k < 6; k++) {
    await adm({ cmd: 'agentMove', id: me, map: from, x: sx, y: sy });
    await page.waitForTimeout(1500);
    const at = await page.evaluate(() => window.__dev.me());
    if (at[2] === from && Math.hypot(at[0] - sx, at[1] - sy) < 3) break;
  }
  await page.evaluate(() => window.__dev.cam('top'));
  await page.waitForTimeout(2500);
  // Walk out through the gate (top view: arrows are map directions, up = north).
  const key = dx === 1 ? 'ArrowLeft' : dx === -1 ? 'ArrowRight' : dy === 1 ? 'ArrowUp' : 'ArrowDown';
  await page.keyboard.down(key);
  const log = [], t0 = Date.now(), shots = new Set();
  let shot = 0;
  while (Date.now() - t0 < 30000) {
    const s = await page.evaluate(() => ({ ...window.__dev.trip(), note: document.getElementById('note').hidden ? '' : document.getElementById('note').textContent }));
    s.t = +((Date.now() - t0) / 1000).toFixed(1);
    log.push(s);
    if (s.phase) await page.keyboard.up(key);
    const want = s.phase === 'out' && s.fade > 0.3 ? 'a-fade-out' : s.phase === 'ride' && s.shown > 0.6 && s.shown < 1.5 ? 'b-ride-start'
      : s.phase === 'ride' && s.shown > s.secs / 2 && s.shown < s.secs / 2 + 1 ? 'c-ride-middle' : s.phase === 'in' ? 'd-arrived-behind-black'
      : !s.phase && log.some((x) => x.phase === 'in') && s.fade < 0.05 ? 'e-new-map' : '';
    if (want && !shots.has(want)) { shots.add(want); await page.screenshot({ path: `${out}/${label}-${++shot}-${want}.png` }); }
    if (shots.has('e-new-map')) break;
    await page.waitForTimeout(200);
  }
  await page.keyboard.up(key);
  fs.writeFileSync(`${out}/${label}-timeline.json`, JSON.stringify(log, null, 0).replace(/},{/g, '},\n{'));
  const ride = log.filter((x) => x.phase === 'ride' && x.shown >= 0);
  const first = log.find((x) => x.phase), arrived = log.find((x) => x.phase === 'in'), done = log.find((x, k) => k && !x.phase && log[k - 1].phase);
  const chunksAtArrival = arrived?.chunks ?? 0;
  console.log(label, JSON.stringify({ secs: first?.secs, enteredGateAt: first?.t, rideShownFor: ride.at(-1)?.shown?.toFixed(1), arrivedAt: arrived?.t, fadedInAt: done?.t, chunksBuiltBeforeArrival: chunksAtArrival, map: done?.map, notes: [...new Set(log.map((x) => x.note).filter(Boolean))].slice(0, 4) }));
}
if (!process.env.HORSE_ONLY) await trip('town', 'woods', 'foot');
else { const p = welcome.portals.find((q) => q.map === 'woods'); for (let k = 0; k < 4; k++) { await adm({ cmd: 'agentMove', id: me, map: 'woods', x: p.x + (p.x < 20 ? 30 : -30), y: p.y + (p.y < 20 ? 30 : p.y > 200 ? -30 : 0) }); await page.waitForTimeout(1500); } }
// On horseback back to town: a tame-able horse right here, Horse until I am on it.
const at = await page.evaluate(() => window.__dev.me());
await adm({ cmd: 'agentSet', id: me, set: { courage: 1, intelligence: 1, speed: 1 } });
let hid = (await adm({ cmd: 'horseSpawn', map: 'woods', x: at[0] + 1.5, y: at[1], n: 1, q: 0 }))?.data?.ids?.[0];
for (let k = 0; k < 40; k++) {
  await page.evaluate(() => window.__dev.act('horse'));
  await page.waitForTimeout(900);
  const r = await page.evaluate(() => window.__dev.ia() + ' | ' + document.getElementById('note').textContent);
  if (k % 5 === 0) console.log('  horse:', r);
  if (/walk over/.test(r)) { const hm = (await adm({ cmd: 'horses', map: 'woods' })).list.find((h) => h.owner); if (hm) { await adm({ cmd: 'agentMove', id: me, map: 'woods', x: Math.round(hm.x - 1.2), y: Math.round(hm.y) }); await page.evaluate(([x, y]) => window.__dev.jump(x, y), [Math.round(hm.x - 1.2), Math.round(hm.y)]); await page.waitForTimeout(1200); } }
  if (/No horse/.test(r)) { const a = await page.evaluate(() => window.__dev.me()); hid = (await adm({ cmd: 'horseSpawn', map: 'woods', x: a[0] + 1.5, y: a[1], n: 1, q: 0 }))?.data?.ids?.[0]; await page.waitForTimeout(500); }
  if (/get off/i.test(r)) break;
}
await trip('woods', 'town', 'horse');
await browser.close(); ws.close(); process.exit(0);
