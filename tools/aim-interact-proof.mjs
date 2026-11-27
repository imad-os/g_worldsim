// Interact only on what I touch and face (imad 2026-11-27). I stand against a tree (grass on my west), face it: the chip says
// "A Chop" and A sends take "tile:x,y" (chopped); turned away (west, open grass): no chip, A does nothing (iaNothing note).
// ADMIN_TOKEN=... node tools/aim-interact-proof.mjs <server> <sdk.js> <outdir>
import fs from 'node:fs';
import { start } from './tv-base.mjs';
const [server, sdkPath, out] = process.argv.slice(2);
fs.mkdirSync(out, { recursive: true });
const t = await start(server, sdkPath, { width: 1280, height: 720 });
const { page, adm, dev, did, notes, me, wait } = t;
const sent = [];
await page.exposeFunction('__sent', (a) => sent.push(a));
await page.evaluate(() => { const o = WebSocket.prototype.send; WebSocket.prototype.send = function (d) { try { const s = new TextDecoder('latin1').decode(new Uint8Array(d.buffer ? d.buffer : d)); if (s.includes('do')) window.__sent(s.replace(/[^ -~]/g, '.').slice(0, 40)); } catch {} return o.call(this, d); }; });
const mt = (await adm({ cmd: 'mapTiles', map: 'town' })).data;
const id = (n) => mt.names.indexOf(n);
const T = mt.tiles, W = mt.w, tree = id('tree'), grass = id('grass');
const at = (x, y) => T[y * W + x];
// a tree with 3 grass tiles to its west and grass round that strip (nothing else to touch)
let spot = null;
for (let y = 30; y < mt.h - 30 && !spot; y++) for (let x = 30; x < W - 30 && !spot; x++) {
  if (at(x, y) !== tree) continue;
  let ok = true;
  for (let yy = y - 2; yy <= y + 2 && ok; yy++) for (let xx = x - 4; xx <= x - 1 && ok; xx++) if (at(xx, yy) !== grass) ok = false;
  if (ok) spot = [x, y];
}
console.log('tree at', spot);
const res = { tree: spot };
for (let k = 0; k < 6; k++) { await adm({ cmd: 'agentMove', id: me, map: 'town', x: spot[0] - 0.45, y: spot[1] + 0.5 }); await wait(1200); const p = await dev(() => window.__dev.me()); if (Math.abs(p[0] - (spot[0] - 0.45)) < 0.4) break; }
const face = async (key) => { await page.keyboard.down(key); await wait(120); await page.keyboard.up(key); await wait(700); };
await face('ArrowLeft'); // turn away first (a short step west onto grass)
res.away = await dev(() => window.__dev.ia());
await page.screenshot({ path: `${out}/1-facing-away.png` });
let s0 = sent.length;
await dev(() => window.__dev.act('use')); await wait(800);
res.awaySent = sent.slice(s0).filter((x) => x.includes('take'));
res.awayNote = await page.evaluate(() => document.getElementById('note')?.textContent ?? '');
await face('ArrowRight'); await face('ArrowRight'); // back to the tree, facing it (blocked by it)
res.facing = await dev(() => window.__dev.ia());
await page.screenshot({ path: `${out}/2-facing-tree.png` });
s0 = sent.length; const d0 = did.length;
await dev(() => window.__dev.act('use')); await wait(1200);
res.facingSent = sent.slice(s0).filter((x) => x.includes('take')); res.facingDid = did.slice(d0).map((d) => d.code);
fs.writeFileSync(`${out}/result.json`, JSON.stringify(res, null, 1));
console.log(JSON.stringify(res, null, 1));
await t.browser.close(); process.exit(0);
