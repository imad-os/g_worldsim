// Browser proof of the viewer app: opens app/ against a local server, pairs (approved through the admin socket),
// plays (walks the character), takes screenshots. Usage: node tools/view-proof.mjs <server> <sdk.js> <outdir> [tier]
import { createRequire } from 'node:module';
const { chromium } = createRequire(import.meta.url)('playwright');
import WebSocket from 'ws';
import { encode, decode } from '@msgpack/msgpack';
const [server, sdkPath, out, tier = 'high'] = process.argv.slice(2);
const admin = process.env.ADMIN_TOKEN;
const fs = await import('node:fs');
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
page.on('console', (m) => console.log('[page]', m.type(), m.text()));
page.on('pageerror', (e) => console.log('[pageerror]', e.message));
await page.route(/mypc-sdk\.js/, (r) => r.fulfill({ contentType: 'text/javascript', body: fs.readFileSync(sdkPath) }));
await page.goto(`${server}/app/?server=${encodeURIComponent(server)}&tier=${tier}`);
// Approve the pairing code the page shows.
const code = await page.waitForFunction(() => { const e = document.querySelector('.code'); return e && e.textContent.replace(/\s/g, ''); }, null, { timeout: 20000 }).then((h) => h.jsonValue());
console.log('pair code', code);
const ws = new WebSocket(server.replace(/^http/, 'ws') + '/ws');
await new Promise((r) => ws.on('open', r));
ws.send(encode({ t: 'hi', v: 1, token: admin, name: 'proof' }));
await new Promise((r) => setTimeout(r, 500));
ws.send(encode({ t: 'adm', id: 1, c: { cmd: 'approve', code, name: 'imad' } }));
ws.on('message', (d) => { const m = decode(d); if (m.t === 'admr') console.log('admin', JSON.stringify(m)); });
await page.waitForFunction(() => document.getElementById('screen').hidden, null, { timeout: 30000 });
await page.waitForTimeout(8000);
await page.screenshot({ path: `${out}/1-arrive.png` });
const fps = await page.evaluate(() => new Promise((res) => { let n = 0; const t0 = performance.now(); const f = () => { n++; if (performance.now() - t0 < 3000) requestAnimationFrame(f); else res(n / 3); }; requestAnimationFrame(f); }));
console.log('fps (software GL, no GPU):', fps.toFixed(1));
// Walk right then down for a few seconds.
await page.keyboard.down('ArrowRight'); await page.waitForTimeout(2500); await page.keyboard.up('ArrowRight');
await page.keyboard.down('ArrowDown'); await page.waitForTimeout(1500);
await page.screenshot({ path: `${out}/2-walking.png` });
await page.keyboard.up('ArrowDown');
await page.keyboard.press('Enter');
await page.waitForTimeout(700);
await page.screenshot({ path: `${out}/3-talk.png` });
console.log('hud:', await page.textContent('#top'), '| note:', await page.textContent('#note'));
// Watch mode on the same device (the pairing is kept): follow a person, low-end TV settings.
await page.goto(`${server}/app/?server=${encodeURIComponent(server)}&tier=low&watch`);
await page.waitForFunction(() => document.getElementById('screen').hidden, null, { timeout: 30000 });
await page.waitForTimeout(3000);
await page.keyboard.press('Enter');
await page.waitForTimeout(6000);
await page.screenshot({ path: `${out}/4-watch-low.png` });
console.log('hud:', await page.textContent('#top'));
ws.close(); await browser.close();
