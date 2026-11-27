// People's new bodies in the real game (imad 2026-11-27): ADMIN_TOKEN=... node tools/looks-proof.mjs <server> <sdk.js> <outdir>
// Pairs a TV as imad, puts my character next to the townsfolk, shots from above and from behind (third person), and the look page.
import { start } from './tv-base.mjs';
import fs from 'node:fs';
const [server, sdk, out = 'out/looks-proof'] = process.argv.slice(2);
fs.mkdirSync(out, { recursive: true });
const t = await start(server, sdk);
const ppl = (await t.adm({ cmd: 'people' }))?.r ?? (await t.adm({ cmd: 'agents' }))?.r;
const list = (Array.isArray(ppl) ? ppl : ppl?.people ?? ppl?.list ?? []).filter((p) => p.map === 'town' || p.map === undefined);
console.log('people', list.length, JSON.stringify(list[0] ?? {}).slice(0, 200));
const a = list.find((p) => !p.player) ?? list[0];
if (a) for (let k = 0; k < 6; k++) { await t.adm({ cmd: 'agentMove', id: t.me, map: 'town', x: (a.x ?? 96) + 2.5, y: (a.y ?? 96) + 2 }); await t.wait(700); }
await t.adm({ cmd: 'agentSet', id: t.me, set: { 'bag.sword': 1 } });
await t.wait(1500);
const looks = await t.dev(() => window.__dev.looks?.());
console.log('looks known', JSON.stringify(looks));
await t.page.screenshot({ path: `${out}/1-top.png` });
await t.dev(() => window.__dev.cam('third')); await t.wait(5000); console.log('dbg', JSON.stringify(await t.dev(() => ({ ...window.__dev.dbg(), cam: window.__dev.g3().view, fade: window.__dev.trip() }))));
await t.page.screenshot({ path: `${out}/2-third.png` });
await t.dev(() => window.__dev.yaw(Math.PI)); await t.wait(1500);
await t.page.screenshot({ path: `${out}/3-third-turned.png` });
await t.dev(() => window.__dev.cam('top')); await t.wait(800);
await t.dev(() => window.__dev.page('look')); await t.wait(1200);
await t.page.screenshot({ path: `${out}/4-look-page.png` });
const g = await t.dev(() => { const b = window.__dev.bench?.(20); return b; });
console.log('bench', JSON.stringify(g));
await t.browser.close(); t.ws.close();
console.log('saved', out);
