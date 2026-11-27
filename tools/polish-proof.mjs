// Proof (2026-11-27): words over the speaker's head, the doubled bag, R2 batches in crafting, arrows on an arc, the restart notice.
// ADMIN_TOKEN=... node tools/polish-proof.mjs <server> <sdk.js> <outdir>   (the restart at the end really restarts the server)
import { start } from './tv-base.mjs';
import { createRequire } from 'node:module';
const { chromium } = createRequire(import.meta.url)('playwright');
const [server, sdk, out] = process.argv.slice(2);
const { browser, page, adm, dev, did, me, wait } = await start(server, sdk, { width: 1280, height: 720 }, { pad: true });
const [x, y, mapId] = await dev(() => window.__dev.me());
const maps = (await adm({ cmd: 'overview' }))?.data?.maps ?? [];
const map = Math.max(0, maps.findIndex((m) => m.id === mapId));
console.log('me', me, 'at', x.toFixed(1), y.toFixed(1), mapId, map);
await dev(() => window.__dev.cam('third'));
const pad = async (i) => { await page.evaluate((b) => window.__btn(b, true), i); await wait(120); await page.evaluate((b) => window.__btn(b, false), i); await wait(200); };

// 1. Someone next to me answers: their words over their head.
const live = (await adm({ cmd: 'live', map }))?.data;
const aid = (live?.people ?? []).find((p) => !(p[3] & 32))?.[0] ?? live?.people?.[0]?.[0];
console.log('talking to', aid);
for (let k = 0; k < 4; k++) { await adm({ cmd: 'agentMove', id: aid, map, x: x + 1.4, y: y - 1.2 }); await wait(400); }
await dev(() => window.__dev.do('hold'));
await wait(800);
did.length = 0;
await dev(() => window.__dev.do('talk', 'Hello, how are you today?'));
let sp = [];
for (let k = 0; k < 60 && !sp.length; k++) { await wait(250); sp = await dev(() => window.__dev.speech()); }
console.log('talk answer:', JSON.stringify(did.find((d) => d.a === 'talk')));
console.log('speech over heads:', JSON.stringify(sp));
await page.screenshot({ path: `${out}/1-speech-over-head.png` });

// 2. The bag holds 40 now, and R2 adds a batch: arrows x5 -> x25 with 10 wood + 5 stone.
const set = await adm({ cmd: 'agentSet', id: me, set: { 'bag.wood': 40, 'bag.stone': 12, 'bag.bow': 1 } });
console.log('bag set to 40 wood:', JSON.stringify(set?.ok ?? set?.err ?? set));
await wait(1500);
await dev(() => window.__dev.open('inv'));
await wait(500);
console.log('grid filled:', JSON.stringify(await dev(() => window.__dev.inv('arrows'))));
for (let k = 0; k < 4; k++) await pad(7); // R2 x4 = 5 batches
await pad(6); await pad(7); // L2 then R2 again
console.log('after R2 x4, L2, R2:', JSON.stringify(await dev(() => window.__dev.inv())));
await wait(400);
await page.screenshot({ path: `${out}/2-craft-batch-x25.png` });
did.length = 0;
await pad(0); // A on the result = make them
for (let k = 0; k < 20 && !did.find((d) => d.a === 'craft'); k++) await wait(150);
console.log('craft answer:', JSON.stringify(did.find((d) => d.a === 'craft')));
await wait(800);
const bag = await dev(() => window.__dev.inv());
console.log('after making:', JSON.stringify(bag));
await dev(() => window.__dev.open('bag')); await wait(700);
await page.screenshot({ path: `${out}/3-bag-after.png` });
await page.keyboard.press('Escape'); await wait(300); await page.keyboard.press('Escape'); await wait(500);

// 3. Arrows on an arc: shoot at the person standing 10 m ahead (no harm: arrows hit animals / zombies) and along an empty line.
const ang = 0.4;
await adm({ cmd: 'agentMove', id: aid, map, x: x + Math.cos(ang) * 12, y: y + Math.sin(ang) * 12 });
await dev(() => window.__dev.cam('top'));
await wait(1200);
const heights = [];
await dev(() => window.__dev.act('aim', true)); await wait(700);
await dev((a) => window.__dev.aim(a), ang);
await dev(() => window.__dev.act('aim', false));
for (let k = 0; k < 14; k++) {
  await wait(16);
  const arcs = await dev(() => window.__dev.arcs());
  if (arcs.length) heights.push(arcs.map((v) => [v.R.toFixed(1), v.H.toFixed(2), v.h1]));
  if (k === 2) await page.screenshot({ path: `${out}/4-arrow-in-flight.png` });
}
console.log('arcs (length m, rise m, end height):', JSON.stringify(heights.at(-1) ?? []));

// 4. The restart notice: TV countdown + the panel's banner.
const ctx = await browser.newContext({ colorScheme: 'dark', viewport: { width: 1440, height: 900 } });
const pp = await ctx.newPage();
await pp.goto(`${server}/panel/`);
await pp.waitForSelector('#sTokIn', { state: 'attached' });
if (!(await pp.isVisible('#sTokIn'))) await pp.evaluate(() => { for (const d of document.querySelectorAll('details')) d.open = true; });
await pp.fill('#sTokIn', process.env.ADMIN_TOKEN);
if (await pp.inputValue('#sAddrIn') === '') await pp.fill('#sAddrIn', server);
await pp.click('#sGo');
await pp.waitForSelector('#app:not([hidden])', { timeout: 15000 });
await pp.waitForTimeout(1500);
console.log('restart:', JSON.stringify((await adm({ cmd: 'serverRestart' }))?.data ?? null));
await wait(1200);
await page.screenshot({ path: `${out}/5-tv-restart-notice.png` });
await pp.screenshot({ path: `${out}/6-panel-restart-banner.png` });
console.log('tv note:', await dev(() => document.getElementById('note')?.textContent));
console.log('panel banner:', await pp.evaluate(() => document.getElementById('restarting')?.textContent));
await wait(9000);
console.log('tv note while down:', await dev(() => document.getElementById('note')?.textContent), 'offline screen:', await dev(() => !document.getElementById('screen')?.hidden));
await pp.screenshot({ path: `${out}/7-panel-restarting.png` });
await browser.close();
process.exit(0);
