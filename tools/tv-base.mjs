// Shared start of the TV proofs (2026-11-27): opens the TV in Chromium, pairs it as imad, exposes adm() / dev() / did[] / notes[].
// import { start } from './tv-base.mjs'; const t = await start(server, sdkPath, { width, height });
import { createRequire } from 'node:module';
import fs from 'node:fs';
const { chromium } = createRequire(import.meta.url)('playwright');
import WebSocket from 'ws';
import { encode, decode } from '@msgpack/msgpack';
export async function start(server, sdkPath, view = { width: 1280, height: 720 }) {
  const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const page = await browser.newPage({ viewport: view, colorScheme: 'dark' });
  page.on('pageerror', (e) => console.log('[pageerror]', e.message));
  const did = [], notes = [];
  page.on('websocket', (sock) => sock.on('framereceived', (f) => { try { const m = decode(Buffer.isBuffer(f.payload) ? f.payload : Buffer.from(f.payload)); if (m.t === 'note') { notes.push(m); if (m.kind === 'did') did.push(m.data); } } catch {} }));
  await page.route(/mypc-sdk\.js/, (r) => r.fulfill({ contentType: 'text/javascript', body: fs.readFileSync(sdkPath) }));
  const ws = new WebSocket(server.replace(/^http/, 'ws') + '/ws');
  await new Promise((r) => ws.on('open', r));
  ws.send(encode({ t: 'hi', v: 1, token: process.env.ADMIN_TOKEN, name: 'proof' }));
  const answers = new Map();
  ws.on('message', (d) => { const m = decode(d); if (m.t === 'admr') answers.set(m.id, m); });
  let aid = 100;
  const adm = async (c) => { const id = ++aid; ws.send(encode({ t: 'adm', id, c })); for (let k = 0; k < 80 && !answers.has(id); k++) await new Promise((r) => setTimeout(r, 100)); return answers.get(id); };
  const dev = (fn, arg) => page.evaluate(fn, arg);
  await page.goto(`${server}/app/?server=${encodeURIComponent(server)}&tier=low&dev`);
  const code = await page.waitForFunction(() => { const s = document.getElementById('screen'); if (s && s.hidden) return 'in'; const e = document.querySelector('.code'); return e && e.textContent.replace(/\s/g, ''); }, null, { timeout: 30000 }).then((h) => h.jsonValue());
  if (code !== 'in') await adm({ cmd: 'approve', code, name: 'imad' });
  await page.waitForFunction(() => document.getElementById('screen').hidden, null, { timeout: 30000 });
  await page.waitForTimeout(5000);
  for (let k = 0; k < 3 && await dev(() => document.getElementById('gmenu')?.hidden === false); k++) { await page.keyboard.press('Escape'); await page.waitForTimeout(400); }
  const me = await dev(() => window.__dev.dbg().meId);
  const wait = (ms) => page.waitForTimeout(ms);
  return { browser, page, ws, adm, dev, did, notes, me, wait };
}
