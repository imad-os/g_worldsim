// Interact = talk, PvP = a switch (imad 2026-11-27). A person next to me: the A hint says "Talk to <name>" and A starts a talk
// (Do hold + the keyboard); PvP off: X never hits them; PvP on from the Actions page: the same X hits them (pHit).
// ADMIN_TOKEN=... node tools/interact-proof.mjs <server> <sdk.js> <outdir>
import fs from 'node:fs';
import { start } from './tv-base.mjs';
const [server, sdkPath, out] = process.argv.slice(2);
fs.mkdirSync(out, { recursive: true });
const t = await start(server, sdkPath, { width: 1280, height: 720 }, { pad: true });
const { page, adm, dev, did, notes, me, wait } = t;
const sent = [];
await page.exposeFunction('__sent', (a) => sent.push(a));
await page.evaluate(() => { const o = WebSocket.prototype.send; WebSocket.prototype.send = function (d) { try { const u = new Uint8Array(d.buffer ? d.buffer : d); const s = new TextDecoder('latin1').decode(u); const m = /\xa1t\xa2do\xa1a\xa?([a-z]+)/.exec(s); if (s.includes('do')) window.__sent(s.replace(/[^ -~]/g, '.').slice(0, 40)); } catch {} return o.call(this, d); }; });
await page.evaluate(() => { window.MyPC.text = { keyboard: () => new Promise((r) => setTimeout(() => r('hello'), 300)) }; });
const res = {};
const [x, y, map] = await dev(() => window.__dev.me());
const list = (await adm({ cmd: 'agents' })).data;
const p = list.find((a) => !a.player && a.map === map && a.age >= 18) ?? list.find((a) => !a.player);
res.person = p?.name;
// stand them right in front of me (I face my angle)
await adm({ cmd: 'agentMove', id: p.id, map, x: x + 0.8, y });
await adm({ cmd: 'order', id: p.id, kind: 'stay' });
await wait(2500);
res.hint = await dev(() => window.__dev.ia());
await page.screenshot({ path: `${out}/1-talk-hint.png` });
// A (pad 0) = talk
const s0 = sent.length;
await dev((a) => window.__dev.act(a), 'use'); await wait(150); await dev((a) => window.__dev.act(a, false), 'use'); await wait(1500);
res.aSent = sent.slice(s0);
// PvP off: X (pad 2) does not hurt them
const hp0 = (await adm({ cmd: 'agent', id: p.id })).data.hp;
await dev((a) => window.__dev.act(a), 'attack'); await wait(150); await dev((a) => window.__dev.act(a, false), 'attack'); await wait(1200);
res.xOff = did.slice(-2).map((d) => d.code); res.hpAfterXOff = [hp0, (await adm({ cmd: 'agent', id: p.id })).data.hp];
res.wheelHasPvp = await page.evaluate(() => JSON.stringify(window.MyPC.load('wheel', null)));
// PvP on from the Actions page
await dev(() => window.__dev.open('actions')); await wait(600);
await page.screenshot({ path: `${out}/2-actions-pvp-row.png` });
await dev(() => window.__dev.quick('pvp')); await wait(1200);
await page.keyboard.press('Escape'); await wait(500);
res.pvpNote = notes.filter((n) => n.kind === 'did' && n.data.code === 'pvp').map((n) => n.data.on);
await adm({ cmd: 'agentMove', id: p.id, map, x: x + 0.8, y }); await wait(1500);
const d0 = did.length;
await dev((a) => window.__dev.act(a), 'attack'); await wait(150); await dev((a) => window.__dev.act(a, false), 'attack'); await wait(1200);
res.xOn = did.slice(d0).map((d) => d.code); res.sentOn = sent.slice(-4);
res.hpAfterXOn = (await adm({ cmd: 'agent', id: p.id })).data.hp;
await page.screenshot({ path: `${out}/3-pvp-hit.png` });
await dev(() => window.__dev.quick('pvp')); await wait(800); // off again
fs.writeFileSync(`${out}/result.json`, JSON.stringify(res, null, 1));
console.log(JSON.stringify(res, null, 1));
await t.browser.close(); process.exit(0);
