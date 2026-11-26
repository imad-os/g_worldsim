// Browser proof of doors and the interact hint (imad 2026-11-25: "the hut door sometimes builds wrongly", "doors open and close with the
// interaction button", "show A: open door / A: mount ...", "wrecked cars and beds are tiny"). Huts facing all 4 ways, seen with the OLD
// client (OLD=<old game.js>) and the new one; the hint next to a door; A opens it, A closes it; a full-size bed; the road's wrecked cars.
// Usage: ADMIN_TOKEN=... [OLD=old-game.js] node tools/doors-proof.mjs <server> <sdk.js> <outdir>
import { createRequire } from 'node:module';
const { chromium } = createRequire(import.meta.url)('playwright');
import WebSocket from 'ws';
import { encode, decode } from '@msgpack/msgpack';
const [server, sdkPath, out] = process.argv.slice(2);
const admin = process.env.ADMIN_TOKEN;
const fs = await import('node:fs');
fs.mkdirSync(out, { recursive: true });
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const ws = new WebSocket(server.replace(/^http/, 'ws') + '/ws');
await new Promise((r) => ws.on('open', r));
ws.send(encode({ t: 'hi', v: 1, token: admin, name: 'proof' }));
const answers = new Map();
ws.on('message', (d) => { const m = decode(d); if (m.t === 'admr') answers.set(m.id, m); });
let aid = 100;
const adm = async (c) => { const id = ++aid; ws.send(encode({ t: 'adm', id, c })); for (let k = 0; k < 80 && !answers.has(id); k++) await new Promise((r) => setTimeout(r, 100)); return answers.get(id); };

async function tv(old) {
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 2 });
  page.on('pageerror', (e) => console.log('[pageerror]', e.message));
  const did = [];
  page.on('websocket', (sock) => sock.on('framereceived', (f) => { try { const m = decode(Buffer.isBuffer(f.payload) ? f.payload : Buffer.from(f.payload)); if (m.t === 'note' && m.kind === 'did') did.push(m.data); } catch {} }));
  await page.route(/mypc-sdk\.js/, (r) => r.fulfill({ contentType: 'text/javascript', body: fs.readFileSync(sdkPath) }));
  if (old) await page.route(/game\.js/, (r) => r.fulfill({ contentType: 'text/javascript', body: fs.readFileSync(old) }));
  await page.goto(`${server}/app/?server=${encodeURIComponent(server)}&tier=mid&dev`);
  const code = await page.waitForFunction(() => { const s = document.getElementById('screen'); if (s && s.hidden) return 'in'; const e = document.querySelector('.code'); return e && e.textContent.replace(/\s/g, ''); }, null, { timeout: 30000 }).then((h) => h.jsonValue());
  if (code !== 'in') await adm({ cmd: 'approve', code, name: 'imad' });
  await page.waitForFunction(() => document.getElementById('screen').hidden, null, { timeout: 30000 });
  await page.waitForTimeout(4000);
  for (let k = 0; k < 3; k++) if (await page.evaluate(() => document.getElementById('gmenu')?.hidden === false)) { await page.keyboard.press('Escape'); await page.waitForTimeout(400); }
  return { page, did };
}
const { page, did } = await tv(null);
const me = (await page.evaluate(() => window.__dev.dbg())).meId;
const tiles = (await adm({ cmd: 'mapTiles', map: 'town' })).data;
const name = (x, y) => tiles.names[tiles.tiles[y * tiles.w + x]];
// An open patch 14 x 14 for 4 huts.
let spot = null;
for (let r = 0; r < 120 && !spot; r++) for (let y = 128 - r; y <= 128 + r && !spot; y += 1) for (let x = 128 - r; x <= 128 + r && !spot; x += 1) {
  let ok = true;
  for (let j = -1; j < 15 && ok; j++) for (let i = -1; i < 15 && ok; i++) { const n = name(x + i, y + j); if (n !== 'grass' && n !== 'dirt' && n !== 'road' && n !== 'sand') ok = false; }
  if (ok) spot = [x, y];
}
console.log('open patch at', spot);
const huts = [[0, 0, 0], [8, 0, 1], [0, 8, 2], [8, 8, 3]]; // x, y offset, door south / east / north / west
for (const [ox, oy, dir] of huts) {
  await adm({ cmd: 'agentSet', id: me, set: { inv: { wood: 20, stone: 10, leather: 5, bed: 1 } } });
  const x0 = spot[0] + ox, y0 = spot[1] + oy;
  const [sx, sy] = [[2.5, 7.5], [7.5, 2.5], [2.5, -2.5], [-2.5, 2.5]][dir];
  await adm({ cmd: 'agentMove', id: me, map: 'town', x: x0 + sx, y: y0 + sy });
  await page.waitForTimeout(1500);
  const p0 = await page.evaluate(() => { window.__dev.place('hut'); return window.__dev.place(); });
  const r = await page.evaluate(([dx, dy, turns]) => window.__dev.place(undefined, dx, dy, turns), [x0 - p0.tx, y0 - p0.ty, (dir - p0.dir + 4) % 4]);
  const n0 = did.length;
  await page.evaluate(() => window.__dev.place(undefined, 0, 0, 0, true));
  await page.waitForTimeout(1500);
  console.log('hut dir', dir, 'aim', r?.tx, r?.ty, r?.dir, r?.check, '->', JSON.stringify(did.slice(n0).filter((d) => d.a === 'build')));
}
// A bed in the first hut (against the north wall, its foot over the floor).
await adm({ cmd: 'agentMove', id: me, map: 'town', x: spot[0] + 2.5, y: spot[1] + 5.6 });
await page.waitForTimeout(1200);
await page.keyboard.press('Enter'); await page.waitForTimeout(800); // A at the closed door: open it
console.log('A at the door ->', JSON.stringify(did.at(-1)));
await adm({ cmd: 'agentMove', id: me, map: 'town', x: spot[0] + 2.5, y: spot[1] + 3.5 });
await page.waitForTimeout(1200);
await adm({ cmd: 'agentSet', id: me, set: { inv: { bed: 1 } } });
const pb = await page.evaluate(() => { window.__dev.place('bed'); return window.__dev.place(); });
await page.evaluate(([dx, dy]) => window.__dev.place(undefined, dx, dy, 0, true), [spot[0] + 1 - pb.tx, spot[1] + 1 - pb.ty]);
await page.waitForTimeout(1500);
console.log('bed ->', JSON.stringify(did.filter((d) => d.a === 'build').at(-1)));
// Huts from above with the new client.
await adm({ cmd: 'agentMove', id: me, map: 'town', x: spot[0] + 6.5, y: spot[1] + 6.5 });
await page.waitForTimeout(2500);
await page.screenshot({ path: `${out}/2-huts-4-ways-after.png` });
// The hint at a door, A opens it, A closes it (first hut, standing outside its south door).
await adm({ cmd: 'agentMove', id: me, map: 'town', x: spot[0] + 13.7, y: spot[1] + 2.5 }); // just east of the east-door hut's door
await page.waitForTimeout(1500);
const hint = () => page.evaluate(() => { const e = document.getElementById('iahint'); return e.hidden ? '' : e.textContent; });
console.log('3 hint by the east door:', await hint());
await page.evaluate(() => window.__dev.cam('third'));
await page.waitForTimeout(1500);
await page.screenshot({ path: `${out}/3-hint-open-door.png` });
await page.keyboard.press('Enter'); await page.waitForTimeout(1200);
console.log('3 A ->', JSON.stringify(did.at(-1)), '| hint now:', await hint());
await page.screenshot({ path: `${out}/4-door-opened.png` });
await page.keyboard.press('Enter'); await page.waitForTimeout(1200);
console.log('4 A ->', JSON.stringify(did.at(-1)), '| hint now:', await hint());
await page.evaluate(() => window.__dev.cam('top'));
// Inside the first hut: the bed.
await adm({ cmd: 'agentMove', id: me, map: 'town', x: spot[0] + 3.5, y: spot[1] + 6.5 });
await page.waitForTimeout(1500);
await page.evaluate(() => window.__dev.cam('third'));
await page.waitForTimeout(1500);
await page.screenshot({ path: `${out}/5-bed.png` });
await page.evaluate(() => window.__dev.cam('top'));
// A chopping hint by a tree, and the wrecked cars across a road.
async function settle(x, y) {
  for (let k = 0; k < 30; k++) {
    await page.waitForTimeout(300);
    const d = await page.evaluate(() => window.__dev.dbg());
    if (Math.hypot(d.predX - x, d.predY - y) < 1.5) { await page.waitForTimeout(1200); return; }
    if (k === 29) console.log('view did not follow', JSON.stringify(d));
  }
}
let wreck = null;
for (let k = 0; k < tiles.tiles.length && !wreck; k++) if (tiles.names[tiles.tiles[k]] === 'wreck') wreck = [k % tiles.w, Math.floor(k / tiles.w)];
console.log('a wreck at', wreck);
if (wreck) {
  // Stand on the road a few tiles in from the barrier, towards the middle of the map (never into the way out).
  const ix = Math.abs(wreck[0] - 128) > Math.abs(wreck[1] - 128) ? -Math.sign(wreck[0] - 128) : 0, iy = ix ? 0 : -Math.sign(wreck[1] - 128);
  const cand = [wreck[0] + ix * 5, wreck[1] + iy * 5];
  console.log('move to wreck', JSON.stringify((await adm({ cmd: 'agentMove', id: me, map: 'town', x: cand[0] + 0.5, y: cand[1] + 0.5 }))?.err ?? 'ok'), cand);
  await settle(cand[0] + 0.5, cand[1] + 0.5);
  await page.screenshot({ path: `${out}/6-wrecks.png` });
}
let tree = null;
for (let k = 0; k < tiles.tiles.length && !tree; k++) { const x = k % tiles.w, y = Math.floor(k / tiles.w); if (tiles.names[tiles.tiles[k]] === 'tree' && x > 40 && x < 216 && y > 40 && y < 216 && !tiles.solid[tiles.tiles[k + 1]]) tree = [x, y]; }
if (tree) {
  console.log('move to tree', tree, JSON.stringify((await adm({ cmd: 'agentMove', id: me, map: 'town', x: tree[0] + 1.6, y: tree[1] + 0.5 }))));
  await settle(tree[0] + 1.6, tree[1] + 0.5);
  console.log('8 hint by a tree:', await hint());
  await page.screenshot({ path: `${out}/8-hint-chop.png` });
}
await page.close();
// The old client on the same huts (before).
if (process.env.OLD) {
  const o = await tv(process.env.OLD);
  const me2 = (await o.page.evaluate(() => window.__dev?.dbg?.().meId ?? -1));
  console.log('old TV character', me2);
  await adm({ cmd: 'agentMove', id: me2 >= 0 ? me2 : me, map: 'town', x: spot[0] + 6.5, y: spot[1] + 6.5 });
  await o.page.waitForTimeout(3000);
  await o.page.screenshot({ path: `${out}/1-huts-4-ways-before.png` });
  await o.page.close();
}
await browser.close();
ws.close();
