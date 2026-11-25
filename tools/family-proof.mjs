// Browser proof of families (imad 2026-11-25): a little one of mine (under 3) on the TV's "My family" page with its needs,
// feeding it and picking it up by hand, the baby drawn small in my arms, and the panel's Family tab.
// Usage: ADMIN_TOKEN=... node tools/family-proof.mjs <server> <sdk.js> <outdir>
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
const adm = async (c) => { const id = ++aid; ws.send(encode({ t: 'adm', id, c })); for (let k = 0; k < 50 && !answers.has(id); k++) await new Promise((r) => setTimeout(r, 100)); const a = answers.get(id); if (a && !a.ok) console.log('[adm err]', c.cmd, a.err); return a; };
await page.goto(`${server}/app/?server=${encodeURIComponent(server)}&tier=low&dev`);
const code = await page.waitForFunction(() => { const s = document.getElementById('screen'); if (s && s.hidden) return 'in'; const e = document.querySelector('.code'); return e && e.textContent.replace(/\s/g, ''); }, null, { timeout: 30000 }).then((h) => h.jsonValue());
if (code !== 'in') await adm({ cmd: 'approve', code, name: 'imad' });
await page.waitForFunction(() => document.getElementById('screen').hidden, null, { timeout: 30000 });
await page.waitForTimeout(6000);
const key = async (k, n = 1) => { for (let i = 0; i < n; i++) { await page.keyboard.press(k); await page.waitForTimeout(220); } };
const menu = () => page.evaluate(() => document.getElementById('gmenu')?.hidden === false ? [...document.querySelectorAll('#gmenu .mt, #gmenu .mr')].map((e) => (e.classList.contains('on') ? '>' : '') + e.textContent).join(' | ') : '');
const note = () => page.evaluate(() => document.getElementById('note').hidden ? '' : document.getElementById('note').textContent);
const text = () => page.evaluate(() => document.querySelector('#gmenu .mx')?.textContent ?? '');
const goRow = async (label) => { for (let k = 0; k < 30; k++) { if ((await menu()).includes('>' + label)) return; await key('ArrowDown'); } throw new Error('row not found ' + label + ' in ' + await menu()); };
// First entry: save the look page.
if ((await menu()).includes('Save')) { await goRow('Save'); await key('Enter'); await page.waitForTimeout(800); }
for (let k = 0; k < 4 && await menu(); k++) await key('Backspace');

// My character and a person to be my little one (a family role set by the owner, then aged 1, hungry and thirsty).
const people = (await adm({ cmd: 'people' }))?.data ?? [];
const me = people.filter((p) => p.player && p.alive).sort((a, b) => b.id - a.id)[0];
const kid = people.find((p) => !p.player && p.alive && !p.partner);
console.log('me', me?.name, me?.id, '| kid', kid?.name, kid?.id);
const [mx, my, mmap] = await page.evaluate(() => window.__dev.me());
console.log('kin:', JSON.stringify((await adm({ cmd: 'kin', a: me.id, b: kid.id, role: 'child' }))?.data));
await adm({ cmd: 'agentSet', id: kid.id, set: { age: 1.2, hunger: 72, thirst: 64, tired: 20 }, force: true });
await adm({ cmd: 'agentSet', id: me.id, set: { carry: 3 } });
await adm({ cmd: 'agentMove', id: kid.id, map: mmap, x: mx + 1.2, y: my + 0.4 });
await page.waitForTimeout(2500);
await page.screenshot({ path: `${out}/1-toddler-next-to-me.png` });

// Game menu > Me > My family (Back twice quickly would be My PC's own menu: wait first).
await page.waitForTimeout(1500); await key('Backspace'); await page.waitForTimeout(600);
await goRow('Me'); await key('Enter'); await page.waitForTimeout(900);
await goRow('My family'); await key('Enter'); await page.waitForTimeout(1500);
console.log('family page:', await menu());
console.log('family text:', (await page.evaluate(() => document.querySelector('#gmenu')?.innerText ?? '')).replace(/\s+/g, ' ').slice(0, 600));
await page.screenshot({ path: `${out}/2-my-family.png` });
await goRow('Feed ' + kid.name); await key('Enter'); await page.waitForTimeout(900);
console.log('feed:', await note());
await page.waitForTimeout(2300);
await page.screenshot({ path: `${out}/3-after-feeding.png` });
await goRow('Pick up ' + kid.name); await key('Enter'); await page.waitForTimeout(900);
console.log('carry:', await note());
for (let k = 0; k < 5 && await menu(); k++) await key('Backspace');
await page.waitForTimeout(500);
// Walk with it in my arms.
await page.keyboard.down('ArrowRight'); await page.waitForTimeout(1800); await page.keyboard.up('ArrowRight');
await page.waitForTimeout(1200);
const after = (await adm({ cmd: 'agent', id: kid.id }))?.data;
const meNow = await page.evaluate(() => window.__dev.me());
console.log('after walking: kid at', after?.x?.toFixed?.(1), after?.y?.toFixed?.(1), '| me at', meNow[0].toFixed(1), meNow[1].toFixed(1), '| held', after?.family?.held, '| carer', after?.family?.carer, '| hunger', after?.hunger);
await page.screenshot({ path: `${out}/4-in-my-arms.png` });

// The panel's Family tab of the little one.
const panel = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await panel.goto(`${server}/panel/`);
await panel.waitForSelector('#sTokIn', { state: 'attached' });
await panel.evaluate(() => { const d = document.getElementById('sTokBox'); if (d) d.open = true; });
await panel.fill('#sTokIn', admin);
if (await panel.locator('#sAddrIn').isVisible() && await panel.inputValue('#sAddrIn') === '') await panel.fill('#sAddrIn', server);
await panel.click('#sGo');
await panel.waitForSelector('#app:not([hidden])', { timeout: 15000 });
await panel.evaluate((id) => { location.hash = `#/person/${id}`; }, kid.id); await panel.waitForTimeout(1500);
await panel.click('#xTabs [data-t="family"]'); await panel.waitForTimeout(800);
await panel.screenshot({ path: `${out}/5-panel-little-one.png`, fullPage: true });
await panel.evaluate((id) => { location.hash = `#/person/${id}`; }, me.id); await panel.waitForTimeout(1500);
await panel.click('#xTabs [data-t="family"]'); await panel.waitForTimeout(800);
await panel.screenshot({ path: `${out}/6-panel-parent.png`, fullPage: true });
ws.close(); await browser.close();
