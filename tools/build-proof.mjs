// Browser proof of aimed building (imad 2026-11-25): the see-through model (red where it cannot go, green where it can),
// moved tile by tile and turned, then the hut built exactly there with its own door, and a lamp put on an exact tile.
// Usage: ADMIN_TOKEN=... node tools/build-proof.mjs <server> <sdk.js> <outdir>
import { createRequire } from 'node:module';
const { chromium } = createRequire(import.meta.url)('playwright');
import WebSocket from 'ws';
import { encode, decode } from '@msgpack/msgpack';
const [server, sdkPath, out] = process.argv.slice(2);
const admin = process.env.ADMIN_TOKEN;
const fs = await import('node:fs');
fs.mkdirSync(out, { recursive: true });
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 2 });
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
const key = async (k, n = 1) => { for (let i = 0; i < n; i++) { await page.keyboard.press(k); await page.waitForTimeout(220); } };
const menu = () => page.evaluate(() => document.getElementById('gmenu')?.hidden === false ? [...document.querySelectorAll('#gmenu .mt, #gmenu .mr')].map((e) => (e.classList.contains('on') ? '>' : '') + e.textContent).join(' | ') : '');
const note = () => page.evaluate(() => document.getElementById('note').hidden ? '' : document.getElementById('note').textContent);
const goRow = async (label) => { for (let k = 0; k < 30; k++) { if ((await menu()).includes('>' + label)) return; await key('ArrowDown'); } throw new Error('row not found ' + label + ' in ' + await menu()); };
if ((await menu()).includes('How I look')) { await goRow('Save'); await key('Enter'); await page.waitForTimeout(600); if (await menu()) await key('Escape'); }
const dbg = await page.evaluate(() => window.__dev.dbg());
const me = dbg.meId;
console.log('me', me, 'at', dbg.predX?.toFixed(1), dbg.predY?.toFixed(1));
// Materials for two huts and a lamp, then stand on open ground in the middle of the town's square.
const set = await adm({ cmd: 'agentSet', id: me, set: { inv: { wood: 28, stone: 8, lamp: 2 } } });
console.log('bag', JSON.stringify(set?.data?.inv ?? set?.err ?? set));
await page.waitForTimeout(1500);
// Find a spot in reach where the hut can go (the model says so), and one where it cannot.
let good = null, bad = null;
const offs = [];
for (let r = 0; r <= 3; r++) for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) if (Math.max(Math.abs(dx), Math.abs(dy)) === r) offs.push([dx, dy]);
const search = async () => {
  good = null;
  for (const [dx, dy] of offs) {
    const p = await page.evaluate(([a, b]) => { const d = window.__dev; d.place('hut'); return d.place(undefined, a, b); }, [dx, dy]);
    if (p && p.check === '' && !good) good = [dx, dy];
    if (p && p.check && p.check !== 'tooFar' && !bad) bad = [dx, dy, p.check];
    await page.evaluate(() => window.__dev.unplace());
    if (good) return;
  }
};
await search();
for (const [x, y] of [[100, 150], [150, 100], [90, 90], [160, 160], [70, 128]]) {
  if (good) break;
  const t = await adm({ cmd: 'agentMove', id: me, map: 'town', x, y });
  console.log('moved to', t?.data?.x, t?.data?.y, t?.error ?? '');
  await page.waitForTimeout(2500);
  await search();
}
console.log('good offset', good, 'bad', bad);
// 1. A red model where it cannot go (if one was found), 2. green where it can, turned so the door faces east.
if (bad) {
  await page.evaluate(([a, b]) => { window.__dev.place('hut'); window.__dev.place(undefined, a, b); }, bad);
  await page.waitForTimeout(700);
  console.log('1 note (red):', (await note()).replace(/\n/g, ' / '));
  await page.screenshot({ path: `${out}/1-ghost-red.png` });
  await page.evaluate(() => window.__dev.unplace());
}
await page.evaluate(([a, b]) => { window.__dev.place('hut'); window.__dev.place(undefined, a, b); }, good ?? [0, 0]);
await page.waitForTimeout(500);
console.log('before CH+', JSON.stringify(await page.evaluate(() => window.__dev.place())));
const turned = await page.evaluate(() => window.__dev.place(undefined, 0, 0, 1)); // turn the door once (CH+ / X / Y / Build on a TV)
console.log('turned ->', JSON.stringify(turned));
await page.waitForTimeout(700);
console.log('2 note (green):', (await note()).replace(/\n/g, ' / '));
await page.screenshot({ path: `${out}/2-ghost-green.png` });
// 3. Confirm with OK (Enter): the server builds it exactly there.
const at = await page.evaluate(() => window.__dev.place());
console.log('menu before Enter:', await menu(), 'did so far', JSON.stringify(did.filter((d) => d.a === 'build')));
await key('Enter');
await page.waitForTimeout(1500);
console.log('after Enter:', JSON.stringify(await page.evaluate(() => window.__dev.place())), (await note()).replace(/\n/g, ' / '));
if (!did.some((d) => d.a === 'build')) { await page.evaluate(() => window.__dev.place(undefined, 0, 0, 0, true)); await page.waitForTimeout(1500); console.log('confirmed by dev'); }
await page.waitForTimeout(1000);
const ans = did.filter((d) => d.a === 'build').at(-1);
console.log('3 build answer:', JSON.stringify(ans), 'aimed at', at?.tx, at?.ty, 'dir', at?.dir);
const tiles = await page.evaluate(([x, y]) => { const out = []; for (let yy = 0; yy < 5; yy++) { let row = ''; for (let xx = 0; xx < 5; xx++) row += (window.__dev.tile?.(x + xx, y + yy) ?? '?') + ' '; out.push(row); } return out; }, [at.tx, at.ty]);
console.log('hut tiles:\n' + tiles.join('\n'));
await page.screenshot({ path: `${out}/3-hut-built.png` });
// 4. A lamp on an exact tile: two tiles to the side of the hut's door.
await page.evaluate(() => { window.__dev.place('lamp'); });
await page.waitForTimeout(500);
const lp = await page.evaluate(() => window.__dev.place());
console.log('4 lamp aimed at', lp?.tx, lp?.ty, 'check', lp?.check);
await key('Enter');
await page.waitForTimeout(2000);
console.log('4 lamp answer:', JSON.stringify(did.filter((d) => d.a === 'build').at(-1)), 'tile now', await page.evaluate(([x, y]) => window.__dev.tile?.(x, y), [lp.tx, lp.ty]));
// 5. Third person: the hut and its door seen from behind my character.
await page.evaluate(() => window.__dev.cam('third'));
await page.waitForTimeout(1500);
await page.screenshot({ path: `${out}/4-third-person.png` });
const info = await adm({ cmd: 'agent', id: me });
console.log('5 my home:', JSON.stringify(info?.data?.home ?? null));
console.log('all build answers', JSON.stringify(did.filter((d) => d.a === 'build')));
await browser.close();
ws.close();
