// Proof of the building rules (imad 2026-11-27): the aimed model is red on a road / tree / rock with the reason, and building where I
// stand works (the server steps me out of the wall). Usage: ADMIN_TOKEN=... node tools/buildspot-proof.mjs <server> <sdk.js> <outdir>
import fs from 'node:fs';
import { start } from './tv-base.mjs';
const [server, sdkPath, out] = process.argv.slice(2);
fs.mkdirSync(out, { recursive: true });
const t = await start(server, sdkPath, { width: 1280, height: 720 });
const { page, adm, dev, did, me, wait } = t;
const note = () => dev(() => (document.getElementById('note').hidden ? '' : document.getElementById('note').textContent));
const tile = (x, y) => dev(([a, b]) => window.__dev.tile(a, b), [x, y]);
await adm({ cmd: 'agentSet', id: me, set: { inv: { wood: 20, stone: 20, leather: 10, brick: 6, palisade: 2 } } });
// 1. On the road: the town's main roads cross the middle.
let road = null;
const [mx, my] = await dev(() => window.__dev.me());
for (let r = 1; r < 25 && !road; r++) for (let dy = -r; dy <= r && !road; dy++) for (let dx = -r; dx <= r && !road; dx++) if ((await tile(Math.floor(mx) + dx, Math.floor(my) + dy)) === 'road') road = [Math.floor(mx) + dx, Math.floor(my) + dy];
console.log('road tile', road);
await adm({ cmd: 'agentMove', id: me, map: 'town', x: road[0] + 0.5, y: road[1] - 2.5 }); await wait(2500);
await dev(() => window.__dev.place('palisade'));
const p0 = await dev(() => window.__dev.place());
const p1 = await dev(([dx, dy]) => window.__dev.place(undefined, dx, dy), [road[0] - p0.tx, road[1] - p0.ty]);
await wait(600);
console.log('1 on the road:', p1.check, '|', await note());
await page.screenshot({ path: `${out}/1-road-red.png` });
await dev(() => window.__dev.unplace());
// 2. On a tree: find one near.
let tree = null;
await adm({ cmd: 'agentMove', id: me, map: 'town', x: mx, y: my }); await wait(2500);
for (let r = 1; r < 9 && !tree; r++) for (let dy = -r; dy <= r && !tree; dy++) for (let dx = -r; dx <= r && !tree; dx++) if ((await tile(Math.floor(mx) + dx, Math.floor(my) + dy)) === 'tree') tree = [Math.floor(mx) + dx, Math.floor(my) + dy];
if (tree) {
  await dev(() => window.__dev.place('palisade')); const q0 = await dev(() => window.__dev.place());
  const q = await dev(([dx, dy]) => window.__dev.place(undefined, dx, dy), [tree[0] - q0.tx, tree[1] - q0.ty]);
  await wait(600); console.log('2 on a tree:', q.check, '|', await note());
  await dev(() => window.__dev.unplace());
} else console.log('2 no tree near');
// 3. A big house with me standing on its wall line (its south-west corner).
const offs = [];
for (let r = 0; r <= 3; r++) for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) if (Math.max(Math.abs(dx), Math.abs(dy)) === r) offs.push([dx, dy]);
let spot = null;
for (const [x, y] of [[100, 150], [150, 100], [90, 90], [160, 160], [70, 128], [120, 60]]) {
  await adm({ cmd: 'agentMove', id: me, map: 'town', x, y }); await wait(3000);
  for (const [dx, dy] of offs) {
    const p = await dev(([a, b]) => { const d = window.__dev; d.place('house'); return d.place(undefined, a, b); }, [dx, dy]);
    await dev(() => window.__dev.unplace());
    if (p && p.check === '') { spot = p; break; }
  }
  if (spot) break;
}
console.log('house spot', spot.tx, spot.ty, 'dir', spot.dir);
const cx = spot.tx, cy = spot.ty + 8; // south-west corner: a wall tile
for (let k = 0; k < 4; k++) { await adm({ cmd: 'agentMove', id: me, map: 'town', x: cx + 0.5, y: cy + 0.5 }); await wait(1500); const [ax, ay] = await dev(() => window.__dev.me()); if (Math.floor(ax) === cx && Math.floor(ay) === cy) break; }
console.log('me at', JSON.stringify(await dev(() => window.__dev.me())));
await dev(() => window.__dev.place('house')); const h0 = await dev(() => window.__dev.place());
const h = await dev(([dx, dy, turn]) => window.__dev.place(undefined, dx, dy, turn), [spot.tx - h0.tx, spot.ty - h0.ty, (spot.dir - h0.dir + 4) % 4]);
console.log('3 house with me on its corner ->', JSON.stringify(h.check), 'dir', h.dir);
await wait(500);
await page.screenshot({ path: `${out}/2-house-on-me-green.png` });
const n0 = did.length;
await dev(() => window.__dev.place(undefined, 0, 0, 0, true));
for (let k = 0; k < 20 && !did.slice(n0).some((d) => d.a === 'build'); k++) await wait(200);
await wait(1500);
const [bx, by] = await dev(() => window.__dev.me());
console.log('3 answer', JSON.stringify(did.slice(n0).filter((d) => d.a === 'build' || d.code === 'tp')), 'tile under me now', await tile(Math.floor(bx), Math.floor(by)), 'at', bx.toFixed(1), by.toFixed(1), 'corner tile', await tile(cx, cy));
await page.screenshot({ path: `${out}/3-house-built-me-outside.png` });
await t.browser.close(); t.ws.close();
