// The D-pad is four action buttons (imad 2026-11-27): held in the world it does not walk (only the left stick does); on the
// Buttons page it can be given to an action (here D-pad up -> Map) without stepping the menu, and then opens the map.
// ADMIN_TOKEN=... node tools/dpad-proof.mjs <server> <sdk.js> <outdir>
import fs from 'node:fs';
import { start } from './tv-base.mjs';
const [server, sdkPath, out] = process.argv.slice(2);
fs.mkdirSync(out, { recursive: true });
const t = await start(server, sdkPath, { width: 1280, height: 720 }, { pad: true });
const { page, dev, wait } = t;
const res = {};
const pos = () => dev(() => window.__dev.me());
const btn = async (i, ms = 150) => { await page.evaluate((i) => window.__btn(i, true), i); await wait(ms); await page.evaluate((i) => window.__btn(i, false), i); await wait(400); };
await wait(1500);
const p0 = await pos();
for (const i of [12, 13, 14, 15]) await btn(i, 1200); // hold each D-pad direction 1.2 s
const p1 = await pos();
res.dpadMoved = Math.hypot(p1[0] - p0[0], p1[1] - p0[1]).toFixed(2);
await page.evaluate(() => window.__axis(1, 0)); await wait(1200); await page.evaluate(() => window.__axis(0, 0)); await wait(500);
const p2 = await pos();
res.stickMoved = Math.hypot(p2[0] - p1[0], p2[1] - p1[1]).toFixed(2);
// Buttons page: down to "Map", A, then D-pad up
await dev(() => window.__dev.page('controls')); await wait(500);
const rows = await page.evaluate(() => [...(document.querySelector('#gmenu .on')?.parentElement?.children ?? [])].map((e) => e.textContent));
const k = rows.findIndex((r) => /^Map/.test(r.trim()));
res.mapRow = k;
for (let n = 0; n < k; n++) { await page.keyboard.press('ArrowDown'); await wait(80); }
await btn(0); // A = choose the row
res.press = await page.evaluate(() => document.getElementById('note')?.textContent ?? '');
await btn(12); // D-pad up
res.set = await page.evaluate(() => document.getElementById('note')?.textContent ?? '');
res.cursorRow = await page.evaluate(() => document.querySelector('#gmenu .on')?.textContent ?? '');
await page.screenshot({ path: `${out}/1-buttons-dpad-up-map.png` });
await dev(() => window.__dev.close()); await wait(600);
const p3 = await pos();
await btn(12);
await wait(800);
res.mapAfterDpad = (await dev(() => window.__dev.map())).open;
const p4 = await pos();
res.movedOnDpad = Math.hypot(p4[0] - p3[0], p4[1] - p3[1]).toFixed(2);
await page.screenshot({ path: `${out}/2-dpad-up-opens-map.png` });
fs.writeFileSync(`${out}/result.json`, JSON.stringify(res, null, 1));
console.log(JSON.stringify(res, null, 1));
await t.browser.close(); process.exit(0);
