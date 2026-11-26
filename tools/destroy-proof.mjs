// Browser proof of pulling down (imad 2026-11-25: "we can destroy only owned buildings or when the owner is dead"): build a hut and a lamp
// (tools/build-proof.mjs steps), then aim Build > Pull down: green on my own lamp / hut (taken down, materials back), red on someone else's,
// then the panel's Reset all buildings. Usage: ADMIN_TOKEN=... node tools/destroy-proof.mjs <server> <sdk.js> <outdir>
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

// A hut of mine for sure (the first try above may have met someone in the way).
let hutAt = did.some((d) => d.a === 'build' && d.item === 'hut' && d.ok) ? at : null;
for (const [dx, dy] of hutAt ? [] : offs) {
  const q = await page.evaluate(([a, b]) => { const d = window.__dev; d.place('hut'); return d.place(undefined, a, b); }, [dx, dy]);
  if (q?.check === '') {
    await page.evaluate(() => window.__dev.place(undefined, 0, 0, 0, true));
    await page.waitForTimeout(1500);
    if (did.some((d) => d.a === 'build' && d.item === 'hut' && d.ok)) { hutAt = q; break; }
  }
  await page.evaluate(() => window.__dev.unplace());
}
console.log('my hut at', hutAt?.tx, hutAt?.ty, 'dir', hutAt?.dir);
// And a lamp of mine next to it (not on the hut).
let lamp = null;
for (const [dx, dy] of offs) {
  const q = await page.evaluate(([a, b]) => { const d = window.__dev; d.place('lamp'); return d.place(undefined, a, b); }, [dx, dy]);
  const onHut = q && q.tx >= hutAt.tx - 1 && q.tx <= hutAt.tx + 5 && q.ty >= hutAt.ty - 1 && q.ty <= hutAt.ty + 5;
  if (q?.check === '' && !onHut) {
    const n0 = did.length;
    await page.evaluate(() => window.__dev.place(undefined, 0, 0, 0, true));
    await page.waitForTimeout(1500);
    if (did.slice(n0).some((d) => d.a === 'build' && d.ok)) { lamp = q; break; }
  }
  await page.evaluate(() => window.__dev.unplace());
}
console.log('my lamp at', lamp?.tx, lamp?.ty, await page.evaluate(([x, y]) => window.__dev.tile(x, y), [lamp.tx, lamp.ty]));
await page.screenshot({ path: `${out}/4-hut-and-lamp.png` });
const pulls = () => did.filter((d) => d.a === 'destroy' && !d.check);
const aimAt = async (pg, tx, ty) => {
  await pg.evaluate(() => window.__dev.place('destroy'));
  const p0 = await pg.evaluate(() => window.__dev.place());
  await pg.evaluate(([dx, dy]) => window.__dev.place(undefined, dx, dy), [tx - p0.tx, ty - p0.ty]);
  await pg.waitForTimeout(1000);
  return pg.evaluate(() => window.__dev.place());
};
const noteOf = (pg) => pg.evaluate(() => document.getElementById('note').hidden ? '' : document.getElementById('note').textContent);
const bagOf = async () => (await adm({ cmd: 'agent', id: me }))?.data?.inv ?? null;
// 5. A second TV (another player) next to my hut: my lamp and my hut are red for them and stay.
const ctx2 = await browser.newContext({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 2 });
const page2 = await ctx2.newPage();
const did2 = [];
page2.on('websocket', (sock) => sock.on('framereceived', (f) => { try { const m = decode(Buffer.isBuffer(f.payload) ? f.payload : Buffer.from(f.payload)); if (m.t === 'note' && m.kind === 'did') did2.push(m.data); } catch {} }));
await page2.route(/mypc-sdk\.js/, (r) => r.fulfill({ contentType: 'text/javascript', body: fs.readFileSync(sdkPath) }));
await page2.goto(`${server}/app/?server=${encodeURIComponent(server)}&tier=mid&dev`);
const code2 = await page2.waitForFunction(() => { const s = document.getElementById('screen'); if (s && s.hidden) return 'in'; const e = document.querySelector('.code'); return e && e.textContent.replace(/\s/g, ''); }, null, { timeout: 30000 }).then((h) => h.jsonValue());
if (code2 !== 'in') await adm({ cmd: 'approve', code: code2, name: 'lina' });
await page2.waitForFunction(() => document.getElementById('screen').hidden, null, { timeout: 30000 });
await page2.waitForTimeout(4000);
for (let k = 0; k < 3; k++) if (await page2.evaluate(() => document.getElementById('gmenu')?.hidden === false)) { await page2.keyboard.press('Escape'); await page2.waitForTimeout(400); }
const me2 = (await page2.evaluate(() => window.__dev.dbg())).meId;
const myPos = await page.evaluate(() => window.__dev.me());
await adm({ cmd: 'agentMove', id: me2, map: 'town', x: myPos[0] + 1, y: myPos[1] });
await page2.waitForTimeout(2500);
let p = await aimAt(page2, lamp.tx, lamp.ty);
console.log('5 other player', me2, 'aims at my lamp:', p?.check, '|', (await noteOf(page2)).replace(/\n/g, ' / '));
await page2.screenshot({ path: `${out}/5-other-player-red.png` });
await page2.evaluate(() => window.__dev.place(undefined, 0, 0, 0, true));
await page2.waitForTimeout(1200);
p = await aimAt(page2, hutAt.tx + 2, hutAt.ty + 2);
console.log('5 other player aims at my hut:', p?.check, '|', (await noteOf(page2)).replace(/\n/g, ' / '));
await page2.screenshot({ path: `${out}/6-other-player-hut-red.png` });
await page2.evaluate(() => window.__dev.unplace());
console.log('5 lamp tile still', await page.evaluate(([x, y]) => window.__dev.tile(x, y), [lamp.tx, lamp.ty]), 'other player answers', JSON.stringify(did2.filter((d) => d.a === 'destroy' && !d.check)));
// 6. Me: my lamp is green; pulled down, it is back in my bag.
console.log('6 bag before', JSON.stringify(await bagOf()));
p = await aimAt(page, lamp.tx, lamp.ty);
console.log('6 my lamp:', p?.check, '|', (await note()).replace(/\n/g, ' / '));
await page.screenshot({ path: `${out}/7-my-lamp-green.png` });
await key('Enter');
await page.waitForTimeout(1500);
console.log('6 pulled:', JSON.stringify(pulls().at(-1)), 'tile now', await page.evaluate(([x, y]) => window.__dev.tile(x, y), [lamp.tx, lamp.ty]), '| bag', JSON.stringify(await bagOf()));
// 7. My hut: the whole hut shows green and comes down; half its materials come back, no home any more.
p = await aimAt(page, hutAt.tx + 2, hutAt.ty + 2);
console.log('7 my hut:', p?.check, '|', (await note()).replace(/\n/g, ' / '));
await page.screenshot({ path: `${out}/8-my-hut-green.png` });
await key('Enter');
await page.waitForTimeout(2000);
console.log('7 pulled:', JSON.stringify(pulls().at(-1)), '| home', JSON.stringify((await adm({ cmd: 'agent', id: me }))?.data?.home ?? null), '| bag', JSON.stringify(await bagOf()));
await page.screenshot({ path: `${out}/9-hut-gone.png` });
// 8. The panel's Start over card; a new hut, then Reset all buildings (backup first).
await adm({ cmd: 'agentSet', id: me, set: { inv: { wood: 20, stone: 10, leather: 5 } } });
await page.waitForTimeout(1000);
await page.evaluate(([a, b]) => { window.__dev.place('hut'); window.__dev.place(undefined, a, b, 0, true); }, good ?? [0, 0]);
await page.waitForTimeout(2000);
console.log('8 new hut', JSON.stringify(did.filter((d) => d.a === 'build').at(-1)));
const pp = await (await browser.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
pp.on('dialog', (d) => { console.log('8 confirm:', d.message()); void d.accept(); });
await pp.goto(server + '/panel/');
await pp.waitForSelector('#sTokBox');
await pp.evaluate(() => { document.getElementById('sTokBox').open = true; });
await pp.fill('#sTokIn', admin);
if (await pp.inputValue('#sAddrIn') === '') await pp.fill('#sAddrIn', server);
await pp.click('#sGo');
await pp.waitForSelector('#app:not([hidden])', { timeout: 15000 });
await pp.evaluate(() => { location.hash = '#/server'; });
await pp.waitForSelector('#cReset', { timeout: 15000 });
await pp.waitForTimeout(1500);
await pp.locator('#cReset').scrollIntoViewIfNeeded();
await pp.screenshot({ path: `${out}/10-panel-start-over.png` });
await pp.click('#cReset');
await pp.waitForTimeout(3000);
const toastTxt = await pp.evaluate(() => [...document.querySelectorAll('.toast, #toasts *')].map((x) => x.textContent).join(' | '));
console.log('8 toast:', toastTxt);
await pp.screenshot({ path: `${out}/11-panel-after-reset.png` });
await page.waitForTimeout(1500);
const ov = await adm({ cmd: 'agent', id: me });
console.log('8 after reset: my home', JSON.stringify(ov?.data?.home ?? null));
await page.screenshot({ path: `${out}/12-tv-after-reset.png` });
await browser.close();
ws.close();
