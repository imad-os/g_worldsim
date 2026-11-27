// Proof for the animated wild animals (imad 2026-11-27): rabbit, deer (doe / stag), wolf, bear drawn with their models, moving.
// Usage: ADMIN_TOKEN=... node tools/animals-proof.mjs <server> <sdk.js> <outdir>
// Puts my character in the woods, fills the woods with every kind, then looks at the nearest of each kind (top view and third
// person) and writes what each model plays (__dev.beasts()) to beasts.json.
import fs from 'node:fs';
import { start } from './tv-base.mjs';
const [server, sdkPath, out] = process.argv.slice(2);
fs.mkdirSync(out, { recursive: true });
const t = await start(server, sdkPath, { width: 1280, height: 720 });
const { page, adm, dev, me, wait } = t;
await adm({ cmd: 'agentMove', id: me, map: 'woods', x: 128, y: 128 });
await wait(3000);
for (let k = 0; k < 5 && !(await dev(() => window.__dev.me()))?.[2]; k++) await wait(800);
await adm({ cmd: 'animals', map: 'woods', want: [4, 4, 2, 4, 3], fill: true });
await wait(3000);
const NAMES = ['rabbit', 'deer', 'boar', 'wolf', 'bear'];
const log = {};
const find = async (type, skip = 0) => {
  const live = await adm({ cmd: 'live', map: 'woods' });
  const all = (live?.data ?? live?.res ?? live ?? {}).animals ?? [];
  return all.filter((a) => a[0] === type)[skip] ?? null;
};
// Close up, third person from behind me, the world slowed right down so they stay put (their idles still play).
await dev(() => window.__dev.cam('third'));
for (const type of [0, 1, 3, 4]) for (const skip of type === 1 ? [0, 1] : [0]) {
  await adm({ cmd: 'speed', speed: 1 });
  const a = await find(type, skip);
  if (!a) { console.log('no', NAMES[type]); continue; }
  const [, x, y] = a, back = type === 0 ? 2.2 : type === 4 ? 5 : 4.5;
  await adm({ cmd: 'agentMove', id: me, map: 'woods', x: Math.round(x - 1), y: Math.round(y + back) });
  await adm({ cmd: 'speed', speed: 0.02, force: true });
  await wait(1200);
  await dev(([b]) => { window.__dev.yaw(0); const g = window.__dev.g3(); g.back = b; }, [type === 0 ? 2.6 : 5]);
  await wait(2500);
  const name = `close-${NAMES[type]}${skip ? skip + 1 : ''}`;
  await page.screenshot({ path: `${out}/${name}.png` });
  log[name] = await dev(() => window.__dev.beasts());
}
// The usual top view at normal speed: they walk, graze, run.
await adm({ cmd: 'speed', speed: 1 });
await dev(() => { window.__dev.cam('top'); window.__dev.g3().back = 7; });
for (const type of [3, 4, 1]) {
  const a = await find(type);
  if (!a) continue;
  await adm({ cmd: 'agentMove', id: me, map: 'woods', x: Math.round(a[1]), y: Math.round(a[2] + 3) });
  await wait(2500);
  await page.screenshot({ path: `${out}/top-${NAMES[type]}.png` });
  log[`top-${NAMES[type]}`] = await dev(() => window.__dev.beasts());
}
fs.writeFileSync(`${out}/beasts.json`, JSON.stringify(log, null, 1));
console.log(JSON.stringify(log).slice(0, 1500));
await t.browser.close(); t.ws.close();
