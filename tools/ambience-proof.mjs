// Browser proof of the new ambience and horse sounds (imad 2026-11-27): the long beds play, the two players of a loop hand over
// with a crossfade (no gap), a campfire crackles with pops from where it is, a storm brings heavy rain, wind and thunder, the night
// brings crickets, owls and howls, horses' hooves follow their gait and my own horse's hooves replace my footsteps.
// Usage: ADMIN_TOKEN=... node tools/ambience-proof.mjs <server> <sdk.js> <outdir>
import { start } from './tv-base.mjs';
import fs from 'node:fs';
const [server, sdkPath, out] = process.argv.slice(2);
fs.mkdirSync(out, { recursive: true });
const { browser, page, adm, dev, me, wait, did } = await start(server, sdkPath, { width: 1280, height: 720 }, { pad: true });
const snd = () => dev(() => window.__dev.snd());
const players = () => dev(() => window.__dev.sndPlayers());
const log = async () => (await snd()).log.join(' ');
const show = async (label) => { const s = await snd(); console.log(label, '| loops', s.loops.join(' '), '| swaps', s.swaps, '| state', s.state); };
await page.keyboard.press('Shift'); // the first button press unlocks sound
await wait(4000);
await show('1 day in town');
console.log('  players', JSON.stringify(await players()));

if (!process.env.ONLY_HORSE) {
// 2. The handover: every loop jumps to 4 s before its end; the second player must start and take over.
const n = await dev(() => window.__dev.sndEnd());
await wait(1600);
console.log('2 moved', n, 'loops near their end; during the crossfade:', JSON.stringify(await players()));
await wait(4000);
await show('  after the handover');
console.log('  players', JSON.stringify(await players()));

// 3. A campfire two tiles ahead.
await adm({ cmd: 'agentSet', id: me, set: { inv: { wood: 10, stone: 10 } } });
const placed = await dev(() => window.__dev.place('campfire', 0, -2, 0, true));
await wait(3500);
const fire = await dev(() => window.__dev.amb());
await show(`3 campfire placed (${placed ? 'ok' : 'no'}), fire ${fire.fd.toFixed(1)} m`);
console.log('  played:', (await log()).split(' ').filter((s) => s === 'fire_pop').length, 'fire pops in the last sounds');
await page.screenshot({ path: `${out}/1-campfire.png` });

// 4. A storm: heavy rain, wind, gusts, thunder after a flash.
await adm({ cmd: 'weather', set: 'storm', hours: 3, k: 1 });
await wait(13000);
await dev(() => window.__dev.flash());
await wait(4500);
await show('4 storm');
console.log('  played:', await log());
await page.screenshot({ path: `${out}/2-storm.png` });
await adm({ cmd: 'weather', clear: true });

// 5. Night: run the day clock fast until it is dark.
await adm({ cmd: 'clockSpeed', day: 20 }); await adm({ cmd: 'speed', speed: 8 });
for (let k = 0; k < 90 && (await dev(() => window.__dev.amb())).night < 0.9; k++) await wait(2000);
await adm({ cmd: 'clockSpeed', day: 1, night: 1 }); await adm({ cmd: 'speed', speed: 1 }); await adm({ cmd: 'weather', set: 'clear', hours: 3 });
await wait(6000);
await wait(3000);
await show('5 night ' + JSON.stringify(await dev(() => { const a = window.__dev.amb(); return { night: a.night, rain: a.rain, wind: a.wind }; })));
for (let k = 0; k < 20 && !/owl|wolf_howl/.test(await log()); k++) await wait(5000);
console.log('  night sounds:', (await log()).split(' ').filter((x) => /owl|wolf|bird|fire/.test(x)).join(' '));

}
// 6. Horses: three spawn next to me; I run at them (they bolt: gallop), then I tame one, get on and ride: hooves, no footsteps.
const at = await dev(() => window.__dev.me()); console.log('at', JSON.stringify(at), JSON.stringify(await adm({ cmd: 'horses', map: at[2] })).slice(0, 200));
await adm({ cmd: 'horseSpawn', map: at[2], x: Math.round(at[0] + 6), y: Math.round(at[1]), n: 3, q: 0 });
await wait(1500);
await dev(() => { window.__axis(1, 0); window.__btn(1, true); });
await wait(3000);
await dev(() => { window.__axis(0, 0); window.__btn(1, false); });
await wait(1500);
const l6 = (await log()).split(' ');
console.log('6 herd running: hoof', l6.filter((s) => s === 'hoof').length, 'gallop', l6.filter((s) => s === 'gallop').length, '| horse calls', l6.filter((s) => s.startsWith('horse')).length);
let tamed = false;
await adm({ cmd: 'agentSet', id: me, set: { courage: 1, intelligence: 1, speed: 1 } }); // a born horse-tamer, so the proof gets on quickly
for (let k = 0; k < 30 && !tamed; k++) {
  const list = (await adm({ cmd: 'horses', map: at[2] }))?.data?.list ?? [];
  if (list.some((h) => h.owner)) { tamed = true; break; }
  const pos = await dev(() => window.__dev.me());
  const h = list.filter((x) => x.wild).sort((a, b) => Math.hypot(a.x - pos[0], a.y - pos[1]) - Math.hypot(b.x - pos[0], b.y - pos[1]))[0];
  if (!h) { console.log('  no wild horse near', list.length); break; }
  await adm({ cmd: 'agentMove', id: me, map: at[2], x: Math.round(h.x - 1.4), y: Math.round(h.y) });
  await wait(700);
  await dev(() => window.__dev.act('horse'));
  await wait(900);
  if (k % 5 === 0) console.log('  try', k, h.name, Math.hypot(h.x - pos[0], h.y - pos[1]).toFixed(1), 'm ->', JSON.stringify(did.at(-1)));
}
const mine = ((await adm({ cmd: 'horses', map: at[2] }))?.data?.list ?? []).find((h) => h.owner);
console.log('  tamed', !!mine);
if (mine) {
  await adm({ cmd: 'agentMove', id: me, map: at[2], x: Math.round(mine.x - 1.2), y: Math.round(mine.y) });
  await wait(1200);
  await dev(() => window.__dev.act('horse'));
  await wait(1500);
  for (const [gait, run, ms] of [['trot', false, 3500], ['gallop', true, 3500]]) {
    const before = (await log()).split(' ').length;
    await dev(([r]) => { window.__axis(-1, 0); window.__btn(1, r); }, [run]);
    await wait(ms);
    const l = (await log()).split(' ');
    console.log(`  riding (${gait}): hoof`, l.filter((s) => s === 'hoof').length, 'gallop', l.filter((s) => s === 'gallop').length, 'footsteps', l.filter((s) => s.startsWith('step_')).length, '| last', l.slice(-12).join(' '), before ? '' : '');
    if (gait === 'gallop') await page.screenshot({ path: `${out}/3-gallop.png` });
  }
  await dev(() => { window.__axis(0, 0); window.__btn(1, false); });
}
await wait(1000);
console.log('done; players', JSON.stringify(await players()));
await browser.close();
process.exit(0);
