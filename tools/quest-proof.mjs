// Browser proof of quests and clans on the TV: walk up to Elder Mara, Talk = the quest is taken; the Quests page; meet the warden,
// back to Mara = handed in; Odile the registrar: found a clan; the Clan page; an election and my vote; the panel's Clans + Quests cards.
// Usage: ADMIN_TOKEN=... node tools/quest-proof.mjs <server> <sdk.js> <outdir>
import { createRequire } from 'node:module';
const { chromium } = createRequire(import.meta.url)('playwright');
import WebSocket from 'ws';
import { encode, decode } from '@msgpack/msgpack';
const [server, sdkPath, out] = process.argv.slice(2);
const admin = process.env.ADMIN_TOKEN;
const fs = await import('node:fs');
fs.mkdirSync(out, { recursive: true });
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
page.on('pageerror', (e) => console.log('[pageerror]', e.message));
await page.route(/mypc-sdk\.js/, (r) => r.fulfill({ contentType: 'text/javascript', body: fs.readFileSync(sdkPath) }));
const ws = new WebSocket(server.replace(/^http/, 'ws') + '/ws');
await new Promise((r) => ws.on('open', r));
ws.send(encode({ t: 'hi', v: 1, token: admin, name: 'proof' }));
const answers = new Map();
ws.on('message', (d) => { const m = decode(d); if (m.t === 'admr') answers.set(m.id, m); });
let aid = 100;
const adm = async (c) => { const id = ++aid; ws.send(encode({ t: 'adm', id, c })); for (let k = 0; k < 80 && !answers.has(id); k++) await new Promise((r) => setTimeout(r, 100)); return answers.get(id); };
await page.goto(`${server}/app/?server=${encodeURIComponent(server)}&tier=low&dev`);
const code = await page.waitForFunction(() => { const s = document.getElementById('screen'); if (s && s.hidden) return 'in'; const e = document.querySelector('.code'); return e && e.textContent.replace(/\s/g, ''); }, null, { timeout: 30000 }).then((h) => h.jsonValue());
if (code !== 'in') await adm({ cmd: 'approve', code, name: 'imad' });
await page.waitForFunction(() => document.getElementById('screen').hidden, null, { timeout: 30000 });
await page.waitForTimeout(6000);
await page.evaluate(() => { window.MyPC.text = window.MyPC.text || {}; window.MyPC.text.keyboard = async () => 'Wolfpack'; });
const key = async (k, n = 1) => { for (let i = 0; i < n; i++) { await page.keyboard.press(k); await page.waitForTimeout(250); } };
const menu = () => page.evaluate(() => document.getElementById('gmenu')?.hidden === false ? [...document.querySelectorAll('#gmenu .mt, #gmenu .mr')].map((e) => (e.classList.contains('on') ? '>' : '') + e.textContent).join(' | ') : '');
const text = () => page.evaluate(() => document.querySelector('#gmenu .mx')?.textContent ?? '');
const note = () => page.evaluate(() => document.getElementById('note').hidden ? '' : document.getElementById('note').textContent);
const goRow = async (label) => { for (let k = 0; k < 24; k++) { if ((await menu()).includes('>' + label)) return; await key('ArrowDown'); } throw new Error('row not found ' + label + ' in ' + await menu()); };
const closeAll = async () => { for (let k = 0; k < 6 && (await menu()); k++) { await page.keyboard.press('Escape'); await page.waitForTimeout(400); } };
// The look page opens on first entry: save it.
if ((await menu()).includes('Save')) { await goRow('Save'); await key('Enter'); await page.waitForTimeout(600); }
await closeAll();
const q = (await adm({ cmd: 'quests' })).data;
console.log('npcs:', q.npcs.map((n) => `${n.name} (${n.x},${n.y})`).join(', '));
const meId = await page.evaluate(() => window.__dev.me ? null : null);
void meId;
const people = (await adm({ cmd: 'people' })).data;
const list = Array.isArray(people) ? people : people.people ?? people.list ?? [];
const mine = list.find((p) => p.player && p.name === 'imad') ?? list.find((p) => p.player);
console.log('my character:', mine?.name, mine?.id);
const goNpc = async (key0) => {
  const n = q.npcs.find((x) => x.key === key0);
  const r = await adm({ cmd: 'agentMove', id: mine.id, map: n.map, x: n.x + 1.3, y: n.y + 0.4 });
  if (!r?.ok) console.log('move failed', r?.err);
  for (let k = 0; k < 30; k++) { const [x, y] = await page.evaluate(() => window.__dev.me()); if (Math.hypot(x - n.x - 1.3, y - n.y - 0.4) < 1.5) break; await page.waitForTimeout(300); }
  await page.waitForTimeout(800);
};
// The Talk button = Y on a pad / green on the remote; here the keyboard's default binding is used through the dev hook when present.
const talk = async () => { await page.evaluate(() => window.__dev?.act ? window.__dev.act('talk') : null); await page.waitForTimeout(1500); };
const hasAct = await page.evaluate(() => !!window.__dev?.act);
console.log('dev act hook:', hasAct);
// 1. Elder Mara: Talk = quest taken.
await goNpc('guide');
await page.screenshot({ path: `${out}/1-npcs-in-town.png` });
await talk();
console.log('1 npc page:', await menu()); console.log('1 text:', await text());
await page.screenshot({ path: `${out}/2-mara-gives-quest.png` });
// 2. The Quests page.
await goRow('Quests'); await key('Enter'); await page.waitForTimeout(1200);
console.log('2 quests:', await menu()); console.log('2 text:', await text());
await page.screenshot({ path: `${out}/3-quests-page.png` });
await closeAll();
// 3. Meet the warden, back to Mara: handed in.
await goNpc('warden'); await talk(); console.log('3 warden:', await text()); await closeAll();
await goNpc('guide'); await talk();
console.log('3 hand in:', await text());
await page.screenshot({ path: `${out}/4-handed-in.png` });
await closeAll();
// 4. Odile: found a clan.
await goNpc('registrar'); await talk();
console.log('4 registrar:', await menu());
await goRow('Found a clan'); await key('Enter'); await page.waitForTimeout(1500);
console.log('4 founded:', await note());
await goRow('Clan ›'); await key('Enter'); await page.waitForTimeout(1200);
console.log('4 clan page:', await menu()); console.log('4 clan text:', await text());
await page.screenshot({ path: `${out}/5-my-clan.png` });
await closeAll();
// 5. Two people join my clan; an election; I vote on the TV.
const c0 = (await adm({ cmd: 'clans' })).data.clans.find((c) => c.name === 'Wolfpack');
console.log('5 clan:', c0?.name, c0?.members.map((m) => m.name).join(', '));
// The others have no clan now: within a game hour or two they walk up to me (the only clan's leader) and ask to join.
await adm({ cmd: 'speed', speed: 20 });
let c1 = c0;
for (let k = 0; k < 60 && c1.members.length < 3; k++) { await page.waitForTimeout(1000); c1 = (await adm({ cmd: 'clans' })).data.clans.find((c) => c.name === 'Wolfpack'); }
await adm({ cmd: 'speed', speed: 1 });
console.log('5 after joins:', c1.members.map((m) => m.name).join(', '));
const tl = (await adm({ cmd: 'timeline', kind: 'clanJoin' })).data;
console.log('5 join events:', JSON.stringify(tl).slice(0, 300));
const r = await adm({ cmd: 'clanVote', id: c0.id });
console.log('5 vote:', r?.ok, r?.err ?? '');
await closeAll(); await page.evaluate(() => window.__dev.act('menu')); await page.waitForTimeout(600);
await goRow('Clan'); await key('Enter'); await page.waitForTimeout(1200);
console.log('5 clan page:', await menu()); console.log('5 text:', await text());
if ((await menu()).includes('Vote for the leader')) { await goRow('Vote for the leader'); await key('Enter'); await page.waitForTimeout(500); console.log('5 ballot:', await menu()); await key('Enter'); await page.waitForTimeout(1200); console.log('5 voted:', await note()); }
await page.screenshot({ path: `${out}/6-election.png` });
await closeAll();
// 6. The panel: Clans and Quests cards on the People page.
const panel = await browser.newPage({ viewport: { width: 1280, height: 900 } });
await panel.goto(`${server}/panel/?server=${encodeURIComponent(server)}`);
await panel.waitForTimeout(1500);
const tokenBox = await panel.$('input[type=password]');
if (tokenBox) { await tokenBox.fill(admin); await panel.keyboard.press('Enter'); await panel.waitForTimeout(2500); }
await panel.evaluate(() => { location.hash = '#/people'; });
await panel.waitForTimeout(4000);
const cl = await panel.$('#pClans');
if (cl) await cl.screenshot({ path: `${out}/7-panel-clans-quests.png` }); else await panel.screenshot({ path: `${out}/7-panel.png`, fullPage: true });
console.log('done');
await browser.close(); ws.close();
process.exit(0);
