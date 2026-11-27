// Proof for the stables and the animals' coats (imad 2026-11-27).
// Usage: ADMIN_TOKEN=... node tools/stable-proof.mjs <server> <sdk.js> <outdir>
// Gives my character 4 tamed horses outside Old Town's paddock, watches them walk in through the gate (top + third person),
// rain sends them under the stable's roof; then fills the woods with wolves, deer, rabbits and bears and looks at their coats.
import fs from 'node:fs';
import { start } from './tv-base.mjs';
const [server, sdkPath, out] = process.argv.slice(2);
fs.mkdirSync(out, { recursive: true });
const t = await start(server, sdkPath, { width: 1280, height: 720 });
const { page, adm, dev, me, wait } = t;
const log = {};
const R = (r) => r?.data ?? r?.res ?? r;
const st = R(await adm({ cmd: 'horses' })).stables.find((s) => s.map === 'town');
log.stable = st;
const [gx, gy] = st.gate, cx = (st.x0 + st.x1 + 1) / 2, cy = (st.y0 + st.y1 + 1) / 2;
const ox = gx + Math.sign(gx - cx) * (Math.abs(gx - cx) > Math.abs(gy - cy) ? 14 : 0), oy = gy + Math.sign(gy - cy) * (Math.abs(gy - cy) >= Math.abs(gx - cx) ? 14 : 0);
if (!process.env.COATS_ONLY) {
await adm({ cmd: 'weather', set: 'clear', hours: 6 });
await adm({ cmd: 'agentMove', id: me, map: 'town', x: Math.round(ox + 3), y: Math.round(oy + 3) });
await wait(3000);
for (let k = 0; k < 5 && !(await dev(() => window.__dev.me()))?.[2]; k++) await wait(800);
for (const q of [0, 1, 2]) await adm({ cmd: 'horseSpawn', map: 'town', x: Math.round(ox), y: Math.round(oy), n: q ? 1 : 2, q, owner: me });
const where = async () => R(await adm({ cmd: 'horses', map: 'town' })).list.filter((h) => h.mine !== undefined && h.owner).map((h) => ({ name: h.name, x: h.x, y: h.y, mode: h.mode,
  inside: h.x >= st.x0 + 1 && h.x < st.x1 && h.y >= st.y0 + 1 && h.y < st.y1, stall: h.x >= st.stall[0] && h.x < st.stall[2] + 1 && h.y >= st.stall[1] && h.y < st.stall[3] + 1 }));
log.start = await where();
await dev(() => { window.__dev.cam('top'); window.__dev.g3().back = 9; });
await wait(2500);
await page.screenshot({ path: `${out}/1-horses-outside.png` });
// They wait ~10 s, then walk in.
let n = 0;
for (let k = 0; k < 60; k++) { await wait(2000); const w = await where(); n = w.filter((h) => h.inside).length; if (n === w.length) break; }
log.inField = await where();
await adm({ cmd: 'agentMove', id: me, map: 'town', x: Math.round(gx + (gx - cx) * 0.1), y: Math.round(gy + (gy - cy) * 0.1) });
await wait(2500);
await dev(() => { window.__dev.g3().back = 14; });
await wait(2000);
await page.screenshot({ path: `${out}/2-field-top.png` });
await dev(([a]) => { window.__dev.cam('third'); window.__dev.yaw(a); window.__dev.g3().back = 6; }, [Math.atan2(cy - gy, cx - gx) + Math.PI / 2]);
await wait(3000);
await page.screenshot({ path: `${out}/3-field-third.png` });
// Rain: under the roof.
await adm({ cmd: 'weather', set: 'rain', hours: 3 });
for (let k = 0; k < 45; k++) { await wait(2000); const w = await where(); if (w.every((h) => h.stall)) break; }
log.inRain = await where();
await page.screenshot({ path: `${out}/4-rain-third.png` });
await dev(() => { window.__dev.cam('top'); window.__dev.g3().back = 12; });
await wait(2500);
await page.screenshot({ path: `${out}/5-rain-top.png` });
await adm({ cmd: 'weather', set: 'clear', hours: 6 });
}
// Coats: a row of each kind in an open spot of Willow Farms (fewer trees in the way), the world slowed so they stand still.
const NAMES = ['rabbit', 'deer', 'boar', 'wolf', 'bear'];
let spot = [100, 100];
for (const [x, y] of [[96, 96], [80, 110], [110, 80], [70, 70], [120, 120]]) { spot = [x, y]; break; }
for (const type of [3, 1, 0, 4, 2]) {
  await adm({ cmd: 'speed', speed: 1 });
  await adm({ cmd: 'agentMove', id: me, map: 'farms', x: spot[0], y: spot[1] + 7 });
  for (let k = 0; k < 6; k++) { await wait(900); const p = await dev(() => window.__dev.me()); if (p && Math.hypot(p[0] - spot[0], p[1] - spot[1] - 7) < 3) break; await adm({ cmd: 'agentMove', id: me, map: 'farms', x: spot[0], y: spot[1] + 7 }); }
  const r = R(await adm({ cmd: 'animalSpawn', map: 'farms', x: spot[0] - (type === 0 ? 4 : 7), y: spot[1], type, n: type === 0 ? 6 : 9 }));
  await adm({ cmd: 'speed', speed: 0.02, force: true });
  await dev(([b]) => { window.__dev.cam('third'); window.__dev.yaw(0); window.__dev.g3().back = b; }, [type === 0 ? 4 : 8]);
  await wait(3500);
  await page.screenshot({ path: `${out}/coat-${NAMES[type]}.png` });
  log[`coat-${NAMES[type]}`] = { ids: r?.ids, drawn: await dev(() => window.__dev.beasts()) };
  for (const id of r?.ids ?? []) await adm({ cmd: 'remove', id });
}
await adm({ cmd: 'speed', speed: 1 });
fs.writeFileSync(`${out}/stable.json`, JSON.stringify(log, null, 1));
console.log(JSON.stringify(log).slice(0, 2500));
await t.browser.close(); t.ws.close();
