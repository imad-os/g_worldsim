// Browser proof of the big house, thin tall walls and roofs (imad 2026-11-27): builds a big house (9 x 9) and a hut next to it on the
// TV, then screenshots from above outside / inside (the roof of my room fades to 0.8), third person outside / inside (the camera under
// the ceiling) and first person inside (the ceiling seen from below).
// Usage: ADMIN_TOKEN=... node tools/roof-proof.mjs <server> <sdk.js> <outdir>
import fs from 'node:fs';
import { start } from './tv-base.mjs';
const [server, sdkPath, out] = process.argv.slice(2);
fs.mkdirSync(out, { recursive: true });
const t = await start(server, sdkPath, { width: 1280, height: 720 });
const { page, adm, dev, did, me, wait } = t;
const shot = async (name) => { await wait(1800); await page.screenshot({ path: `${out}/${name}.png` }); console.log('shot', name, JSON.stringify(await roofs())); };
const roofs = () => dev(() => { const r = window.__dev.g3().roofs; return { rooms: r.rooms.size, mine: r.mine?.key ?? null, keys: [...r.rooms.keys()] }; });
const bag = async (inv) => { const r = await adm({ cmd: 'agentSet', id: me, set: { inv } }); console.log('bag', me, JSON.stringify(r).slice(0, 300)); return r; };
const offs = [];
for (let r = 0; r <= 3; r++) for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) if (Math.max(Math.abs(dx), Math.abs(dy)) === r) offs.push([dx, dy]);
const find = async (what) => {
  for (const [dx, dy] of offs) {
    const p = await dev(([w, a, b]) => { const d = window.__dev; d.place(w); return d.place(undefined, a, b); }, [what, dx, dy]);
    await dev(() => window.__dev.unplace());
    if (p && p.check === '') return [dx, dy];
  }
  return null;
};
const build = async (what, inv) => {
  await bag(inv); await wait(1500);
  let at = await find(what);
  for (const [x, y] of [[100, 150], [150, 100], [90, 90], [160, 160], [70, 128], [120, 60]]) {
    if (at) break;
    await adm({ cmd: 'agentMove', id: me, map: 'town', x, y }); await wait(3000);
    at = await find(what);
  }
  if (!at) throw new Error('no room for a ' + what);
  const n0 = did.length;
  const p = await dev(([w, a, b]) => { const d = window.__dev; d.place(w); d.place(undefined, a, b); return d.place(undefined, 0, 0, 0, true); }, [what, ...at]);
  for (let k = 0; k < 30 && !did.slice(n0).some((d) => d.a === 'build'); k++) await wait(200);
  console.log(what, 'aimed', p?.tx, p?.ty, 'dir', p?.dir, 'answer', JSON.stringify(did.slice(n0).find((d) => d.a === 'build')));
  return p;
};
// 1. The big house, door to the south (the model starts with the door facing me).
const h = await build('house', { wood: 20, stone: 20, leather: 10, brick: 6 });
const S = 9, H = 4;
const rows = await dev(([x, y]) => { const o = []; for (let yy = 0; yy < 9; yy++) { let r = ''; for (let xx = 0; xx < 9; xx++) r += (window.__dev.tile(x + xx, y + yy) ?? '?').slice(0, 2) + ' '; o.push(r); } return o; }, [h.tx, h.ty]);
console.log('house tiles\n' + rows.join('\n'));
const DIRS = [[0, 1], [1, 0], [0, -1], [-1, 0]], [ddx, ddy] = DIRS[h.dir];
const doorX = h.tx + H + ddx * H, doorY = h.ty + H + ddy * H;
// 2. A hut beside it.
await adm({ cmd: 'agentMove', id: me, map: 'town', x: h.tx + S + 5, y: h.ty + H }); await wait(2500);
const hut = await build('hut', { wood: 20, stone: 10, leather: 5 });
// Outside, in front of the house's door, from above.
await adm({ cmd: 'agentMove', id: me, map: 'town', x: h.tx + H + 0.5, y: h.ty + S + 2.5 }); await wait(2500);
await shot('1-top-outside');
// Inside the house: the roof fades from above.
await dev(() => window.__dev.do('door'));
await adm({ cmd: 'agentMove', id: me, map: 'town', x: h.tx + H + 0.5, y: h.ty + H + 0.5 }); await wait(2500);
await shot('2-top-inside');
// Furniture along the walls: a bed, a fridge, a chest (thin walls: they stand against them).
await bag({ bed: 1, fridge: 1, chest: 1, window: 1 }); await wait(800);
for (const [w, x, y] of [['bed', h.tx + 1, h.ty + 4], ['fridge', h.tx + 7, h.ty + 7], ['chest', h.tx + 7, h.ty + 1], ['window', h.tx + 8, h.ty + 4]]) {
  const n0 = did.length;
  await dev(([a, b]) => window.__dev.do('build', a + '#' + b + ',0'), [w, `${x},${y}`]);
  for (let k = 0; k < 15 && !did.slice(n0).some((d) => d.a === 'build'); k++) await wait(200);
  console.log(w, JSON.stringify(did.slice(n0).find((d) => d.a === 'build')), await dev(([a, b]) => window.__dev.tile(a, b), [x, y]));
}
await shot('2b-top-inside-furnished');
// Third person: inside (camera under the ceiling), first person inside (the ceiling).
await dev(() => window.__dev.cam('third'));
await dev((y) => window.__dev.yaw(y), Math.atan2(-ddx, ddy) /* look away from the door: the camera sits by the door */);
await shot('3-third-inside');
await dev(() => window.__dev.cam('first'));
await dev(() => window.__dev.yaw(0.6));
await shot('4-first-inside');
// Third person outside, looking at the house and the hut.
await adm({ cmd: 'agentMove', id: me, map: 'town', x: doorX + 0.5 + ddx * 7, y: doorY + 0.5 + ddy * 7 }); await wait(2500);
await dev(() => window.__dev.cam('third'));
await dev((y) => window.__dev.yaw(y), Math.atan2(-ddx, ddy));
await shot('5-third-outside');
await dev(() => window.__dev.cam('top'));
await shot('6-top-both');
console.log('hut at', hut?.tx, hut?.ty);
const bench = await dev(() => window.__dev.bench(10));
console.log('bench', JSON.stringify(bench));
await t.browser.close(); t.ws.close();
