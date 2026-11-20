// Proof of the panel's Firebase sign-in without a real Firebase: a fake Google (own RSA key) and a fake Firestore with the
// same role rules, the real server in-process, the real panel in Chromium. node tools/auth-proof.mjs <outdir>
import { createRequire } from 'node:module';
import { generateKeyPairSync, createSign } from 'node:crypto';
import { mkdirSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { App } from '../packages/server/dist/app.js';
import { DEFAULTS } from '../packages/server/dist/config.js';
import { Logger } from '../packages/server/dist/log.js';
const { chromium } = createRequire(import.meta.url)('playwright');
const out = process.argv[2] ?? 'out/auth'; mkdirSync(out, { recursive: true });
const PID = 'worldsim-proof', OWNER = 'owner@example.com';
const { privateKey, publicKey } = generateKeyPairSync('rsa', { modulusLength: 2048 });
const jwk = { ...publicKey.export({ format: 'jwk' }), kid: 'k1', alg: 'RS256' };
const b64u = (o) => Buffer.from(JSON.stringify(o)).toString('base64url');
const sign = (uid, email) => { const t = Math.floor(Date.now() / 1000); const h = b64u({ alg: 'RS256', kid: 'k1' }), b = b64u({ aud: PID, iss: `https://securetoken.google.com/${PID}`, sub: uid, iat: t, exp: t + 3600, email, email_verified: true });
  return `${h}.${b}.${createSign('RSA-SHA256').update(`${h}.${b}`).sign(privateKey).toString('base64url')}`; };
const subOf = (tok) => { try { return JSON.parse(Buffer.from(tok.split('.')[1], 'base64url').toString()); } catch { return {}; } };
// The fake Firestore (same decisions as firebase/firestore.rules for roles / players).
const db = { roles: new Map(), players: new Map() };
const roleOf = (uid) => db.roles.get(uid)?.role ?? 'player';
const fsDoc = (col, id, o) => ({ name: `projects/${PID}/databases/(default)/documents/${col}/${id}`, fields: Object.fromEntries(Object.entries(o).map(([k, v]) => [k, typeof v === 'number' ? { integerValue: String(v) } : { stringValue: String(v) }])) });
const fromFields = (f) => Object.fromEntries(Object.entries(f).map(([k, v]) => [k, v.stringValue ?? Number(v.integerValue)]));
function firestore(method, url, auth, body) {
  const me = subOf(auth.replace('Bearer ', '')); const u = new URL(url); const path = u.pathname.split('/documents/')[1]; const [col, id] = path.split('/');
  const staff = ['owner', 'admin'].includes(roleOf(me.sub));
  if (method === 'GET' && id) { if (me.sub !== id && !staff) return [403, {}]; const d = db[col].get(id); return d ? [200, fsDoc(col, id, d)] : [404, {}]; }
  if (method === 'GET') return staff ? [200, { documents: [...db[col]].map(([k, v]) => fsDoc(col, k, v)) }] : [403, {}];
  if (method === 'POST') { const nid = u.searchParams.get('documentId'); const d = fromFields(body.fields);
    if (nid !== me.sub || db[col].has(nid)) return [403, {}];
    if (col === 'roles' && !(d.role === 'player' || (d.role === 'owner' && me.email === OWNER))) return [403, {}];
    db[col].set(nid, d); return [200, fsDoc(col, nid, d)]; }
  if (method === 'PATCH') { if (col !== 'roles' || roleOf(me.sub) !== 'owner' || id === me.sub) return [403, {}]; db.roles.set(id, { ...db.roles.get(id), ...fromFields(body.fields) }); return [200, fsDoc(col, id, db.roles.get(id))]; }
  return [400, {}];
}
const authFetch = async (url, init) => {
  const res = (st, b) => ({ ok: st < 300, status: st, headers: { get: () => 'max-age=600' }, json: async () => b });
  if (url.includes('securetoken')) return res(200, { keys: [jwk] });
  const [st, b] = firestore('GET', url, init?.headers?.Authorization ?? '', null); return res(st, b);
};
// The server, in-process.
const cfg = { ...structuredClone(DEFAULTS), dataDir: mkdtempSync(join(tmpdir(), 'ws-authproof-')), port: 0, auth: { projectId: PID } };
cfg.tunnel = { provider: 'none' }; cfg.ai = { ...cfg.ai, provider: 'none' };
const app = new App(cfg, { adminToken: 'proof-admin-token-0123456789', viewers: new Map() }, new Logger('error', undefined, true));
app.authFetch = authFetch; await app.start();
const server = app.net.address();
// The fake Firebase JS SDK served in place of gstatic's.
const SDK_APP = 'export function initializeApp(c) { return { c }; }';
const SDK_AUTH = `const auth = { currentUser: null, authStateReady: async () => {} };
const user = (uid, email) => ({ uid, email, displayName: email.split('@')[0], photoURL: null, emailVerified: true, getIdToken: () => window.__sign(uid, email) });
export function getAuth() { const s = sessionStorage.getItem('fakeUser'); if (s) { const [u, e] = s.split('|'); auth.currentUser = user(u, e); } return auth; }
export class GoogleAuthProvider { setCustomParameters() {} }
const set = (u, e) => { sessionStorage.setItem('fakeUser', u + '|' + e); auth.currentUser = user(u, e); return { user: auth.currentUser }; };
export async function signInWithPopup() { return set('u_owner', '${OWNER}'); }
export async function signInWithEmailAndPassword(a, email) { return set('u_' + email.split('@')[0], email); }
export async function createUserWithEmailAndPassword(a, email) { return set('u_' + email.split('@')[0], email); }
export async function sendEmailVerification() {} export async function sendPasswordResetEmail() {}
export async function signOut() { sessionStorage.removeItem('fakeUser'); auth.currentUser = null; }`;
const b = await chromium.launch();
async function page(vp) {
  const ctx = await b.newContext({ viewport: vp, colorScheme: 'dark' });
  const p = await ctx.newPage();
  const errs = []; p.on('pageerror', (e) => errs.push(e.message)); p.errs = errs;
  await p.exposeFunction('__sign', sign);
  await p.route('**/panel/firebase.json', (r) => r.fulfill({ json: { apiKey: 'proof', projectId: PID, authDomain: 'x' } }));
  await p.route('https://www.gstatic.com/firebasejs/**', (r) => r.fulfill({ contentType: 'text/javascript', body: r.request().url().endsWith('firebase-app.js') ? SDK_APP : SDK_AUTH }));
  await p.route('https://firestore.googleapis.com/**', (r) => { const q = r.request(); const [st, body] = firestore(q.method(), q.url(), q.headers().authorization ?? '', q.postDataJSON?.() ?? null); return r.fulfill({ status: st, json: body }); });
  await p.goto(server + '/panel/');
  return p;
}
// 1. The owner signs in with Google.
const o = await page({ width: 1440, height: 900 });
await o.waitForSelector('#sGoogle', { state: 'visible' });
await o.screenshot({ path: `${out}/1-signin.png` });
await o.click('#sGoogle');
await o.waitForSelector('#app:not([hidden])', { timeout: 15000 });
await o.waitForTimeout(2500);
await o.screenshot({ path: `${out}/2-owner-dashboard.png` });
console.log('owner role in Firestore:', roleOf('u_owner'), '| nav:', await o.$$eval('.side .nav a', (a) => a.map((x) => x.dataset.nav).join(',')));
// 2. A player creates an account with email + password and joins.
const p = await page({ width: 390, height: 844 });
await p.waitForSelector('#sEmail', { state: 'visible' });
await p.fill('#sEmail', 'sara@example.com'); await p.fill('#sPass', 'secret123'); await p.click('#sNew');
await p.waitForSelector('#app:not([hidden])', { timeout: 15000 });
await p.waitForSelector('#meName', { timeout: 10000 });
await p.screenshot({ path: `${out}/3-player-join.png` });
await p.fill('#meName', 'Sara'); await p.click('#meJoin'); await p.waitForTimeout(2000);
await p.screenshot({ path: `${out}/4-player-character.png`, fullPage: true });
console.log('player nav:', await p.$$eval('nav.bottom a', (a) => a.map((x) => x.dataset.nav).join(',')), '| players doc:', JSON.stringify(db.players.get('u_sara')));
const forbidden = await p.evaluate(async () => { location.hash = '#/dashboard'; await new Promise((r) => setTimeout(r, 800)); return location.hash + ' -> ' + document.getElementById('title').textContent; });
console.log('player opening the dashboard:', forbidden);
console.log('in-game admin tools: owner?', app.isStaff('Sara') ? 'Sara yes (BAD)' : 'Sara no');
// 3. The owner sees Sara on Users & roles and makes her an admin.
await o.evaluate(() => { location.hash = '#/users'; }); await o.waitForTimeout(2000);
await o.selectOption('select[data-uid="u_sara"]', 'admin'); await o.waitForTimeout(800);
await o.screenshot({ path: `${out}/5-owner-users.png` });
console.log('Sara in Firestore after the change:', roleOf('u_sara'));
console.log('page errors:', [...o.errs, ...p.errs].join(' | ') || 'none');
await b.close(); await app.stop();
