// Browser proof of the automatic server link (imad 2026-11-27: "we already use Firebase and Firestore, this must be automatic").
// A real server on this PC; the TV app and the panel are opened as on GitHub Pages with a dead old link (ngrok out of data);
// Firestore server/current (answered here) holds the new cloudflare-quick link, which Chromium reaches through a local TLS
// forwarder. Both must find it, connect and save it, with nothing typed.
// (In the cloud container run it with the proxy variables unset: the forwarder is local.)
// ADMIN_TOKEN=... node tools/link-proof.mjs <server http url> <sdk.js> <outdir>
import { createRequire } from 'node:module';
import fs from 'node:fs';
import tls from 'node:tls';
import net from 'node:net';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
const { chromium } = createRequire(import.meta.url)('playwright');
const [server, sdkPath, out] = process.argv.slice(2);
fs.mkdirSync(out, { recursive: true });
const NEW = 'new-link-proof.trycloudflare.com', OLD = 'old-link-proof.ngrok-free.dev';
const u = new URL(server);
// TLS in front of the local server (self-signed: Chromium is told to accept it).
const key = path.join(out, 'k.pem'), crt = path.join(out, 'c.pem');
execFileSync('openssl', ['req', '-x509', '-newkey', 'rsa:2048', '-nodes', '-keyout', key, '-out', crt, '-days', '1', '-subj', `/CN=${NEW}`], { stdio: 'ignore' });
const fwd = tls.createServer({ key: fs.readFileSync(key), cert: fs.readFileSync(crt) }, (s) => { const c = net.connect(Number(u.port), u.hostname); s.pipe(c).pipe(s); c.on('error', () => s.destroy()); s.on('error', () => c.destroy()); });
await new Promise((r) => fwd.listen(0, '127.0.0.1', r));
const port = fwd.address().port;
const browser = await chromium.launch({ args: ['--disable-features=LocalNetworkAccessChecks,PrivateNetworkAccessRespectPreflightResults,BlockInsecurePrivateNetworkRequests', '--ignore-certificate-errors', `--host-resolver-rules=MAP ${NEW}:443 127.0.0.1:${port}, MAP ${OLD} ~NOTFOUND`, '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const asks = [];
async function page(view) {
  const p = await browser.newPage({ viewport: view, colorScheme: 'dark' });
  p.on('pageerror', (e) => console.log('[pageerror]', e.message));
  if (process.env.DEBUG) { p.on('websocket', (w) => { console.log('ws', w.url()); w.on('socketerror', (e) => console.log('wserr', e)); w.on('close', () => console.log('wsclose', w.url())); }); p.on('requestfailed', (r) => console.log('fail', r.url(), r.failure()?.errorText)); p.on('console', (m) => console.log('console', m.text())); }
  await p.route(/mypc-sdk\.js/, (r) => r.fulfill({ contentType: 'text/javascript', body: fs.readFileSync(sdkPath) }));
  // GitHub Pages = the committed docs/ folder.
  await p.route(/^https:\/\/imad-os\.github\.io\/g_worldsim\//, (r) => {
    let f = new URL(r.request().url()).pathname.replace(/^\/g_worldsim\//, '');
    if (!f || f.endsWith('/')) f += 'index.html';
    const file = path.join('docs', f);
    if (!fs.existsSync(file)) return r.fulfill({ status: 404, body: '' });
    const ct = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.css': 'text/css', '.svg': 'image/svg+xml' }[path.extname(f)] ?? 'application/octet-stream';
    return r.fulfill({ contentType: ct, body: fs.readFileSync(file) });
  });
  await p.route(/firestore\.googleapis\.com/, (r) => { asks.push(r.request().url()); return r.fulfill({ contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: JSON.stringify({ fields: { url: { stringValue: `https://${NEW}` }, provider: { stringValue: 'cloudflare-quick' } } }) }); });
  return p;
}
const ok = (c, m) => { console.log(c ? 'PASS' : 'FAIL', m); if (!c) process.exitCode = 1; };

// 1. The TV app with the old ngrok address (as in its config).
const tv = await page({ width: 1280, height: 720 });
await tv.goto(`https://imad-os.github.io/g_worldsim/?server=${encodeURIComponent('https://' + OLD)}&tier=low`);
// In the world (players join by themselves), or the pairing code when auto join is off.
const got = await tv.waitForFunction(() => { if (document.getElementById('screen')?.hidden) return 'in the world'; const e = document.querySelector('.code'); return e && 'pairing code ' + e.textContent.replace(/\s/g, ''); }, null, { timeout: 40000 }).then((h) => h.jsonValue()).catch(() => '');
await tv.waitForTimeout(4000);
await tv.screenshot({ path: path.join(out, 'tv-found-link.png') });
const tvSaved = await tv.evaluate(() => JSON.stringify(localStorage));
ok(!!got, `TV reached the new server: ${got}`);
ok(tvSaved.includes(NEW), 'TV saved the new link');

// 2. The panel on Pages with the old address saved and the admin token.
const pn = await page({ width: 1280, height: 800 });
await pn.addInitScript(([old, tok]) => { if (!localStorage.getItem('ws_server')) { localStorage.setItem('ws_server', JSON.stringify(old)); localStorage.setItem('ws_token', JSON.stringify(tok)); localStorage.setItem('ws_mode', JSON.stringify('token')); localStorage.setItem('ws_theme', JSON.stringify('dark')); } }, ['https://' + OLD, process.env.ADMIN_TOKEN]);
await pn.goto('https://imad-os.github.io/g_worldsim/panel/');
const inPanel = await pn.waitForFunction(() => document.getElementById('signin')?.hidden === true, null, { timeout: 40000 }).then(() => true).catch(() => false);
await pn.waitForTimeout(1500);
await pn.screenshot({ path: path.join(out, 'panel-found-link.png') });
ok(inPanel, 'panel signed in on the new server by itself');
ok((await pn.evaluate(() => localStorage.getItem('ws_server'))).includes(NEW), 'panel saved the new link');
ok(asks.length > 0 && asks.length <= 6, `Firestore asked ${asks.length} time(s)`);
await browser.close();
fwd.close();
