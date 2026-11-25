// Proof of the panel's Chat page (imad 2026-11-25): a fake Google / Firestore (as tools/auth-proof.mjs) and a fake model, the real
// server in-process, the real panel in Chromium: world channel, a direct order reported "Done", the clan channel, a phone, the admin token. node tools/chat-proof.mjs <outdir> (panel chat)
import { createRequire } from 'node:module';
import { generateKeyPairSync, createSign } from 'node:crypto';
import { mkdirSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { App } from '../packages/server/dist/app.js';
import { DEFAULTS } from '../packages/server/dist/config.js';
import { Logger } from '../packages/server/dist/log.js';
import { createServer } from 'node:http';
import { Kind } from '../packages/protocol/dist/index.js';
const { chromium } = createRequire(import.meta.url)('playwright');
const out = process.argv[2] ?? 'out/chat'; mkdirSync(out, { recursive: true });
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
const cfg = { ...structuredClone(DEFAULTS), dataDir: mkdtempSync(join(tmpdir(), 'ws-chatproof-')), port: 0, auth: { projectId: PID } };
cfg.tunnel = { provider: 'none' }; cfg.ai = { ...cfg.ai, provider: 'none' };
// A fake model: "wait" = a short task (stay 3 game minutes), else a friendly answer.
const llm = createServer((req, res) => { let s = ''; req.on('data', (c) => (s += c)); req.on('end', () => {
  const body = JSON.parse(s || '{}'), user = body.messages?.find((m) => m.role === 'user')?.content ?? '';
  const said = /says to you: "([^"]*)"/.exec(user)?.[1] ?? '';
  const via = /world channel/.test(user) ? 'world' : /clan channel/.test(user) ? 'clan' : 'dm';
  const c = /wait/i.test(said) ? { say: 'Sure, I will wait by the well until you come.', task: 'wait by the well', plan: [{ do: 'say', text: 'Waiting here.' }, { do: 'stay', minutes: 3 }] }
    : via === 'clan' ? { say: 'We are with you. The store needs wood before dark.', do: 'nothing' }
    : via === 'world' ? { say: 'Hi Sara! All quiet near the camp today.', do: 'nothing' } : { say: 'Hello!', do: 'nothing' };
  res.setHeader('content-type', 'application/json'); res.end(JSON.stringify({ message: { role: 'assistant', content: JSON.stringify(c) } })); }); });
await new Promise((ok) => llm.listen(0, '127.0.0.1', ok));
const app = new App(cfg, { adminToken: 'proof-admin-token-0123456789', viewers: new Map() }, new Logger('error', undefined, true));
app.authFetch = authFetch; await app.start();
app.ai.apply({ provider: 'ollama', ollamaUrl: `http://127.0.0.1:${llm.address().port}`, model: 'm' });
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

const w = app.world, e = w.e;
const agents = []; for (let k = 0; k < e.hi; k++) if (e.kind[k] === Kind.Agent && !w.charName(k)) agents.push(k);
const nameOf = (k) => w.profileOf(k).name;
const shot = async (pg, f) => { await pg.waitForTimeout(400); await pg.screenshot({ path: `${out}/${f}` }); console.log('shot', f); };
// 1. A player signs in with email, joins as Sara, opens Chat.
const p = await page({ width: 1440, height: 900 });
await p.waitForSelector('#sEmail', { state: 'visible' });
await p.fill('#sEmail', 'sara@example.com'); await p.fill('#sPass', 'secret123'); await p.click('#sNew');
await p.waitForSelector('#meName', { timeout: 15000 });
await p.fill('#meName', 'Sara'); await p.click('#meJoin'); await p.waitForTimeout(1500);
console.log('player nav:', await p.$$eval('.side .nav a', (a) => a.map((x) => x.dataset.nav).join(',')));
await p.evaluate(() => { location.hash = '#/chat'; });
await p.waitForSelector('#chIn', { timeout: 10000 });
// A wedding in the world: the engine posts it in the world channel.
const man = agents.find((k) => w.profileOf(k).sex === 'm' && w.life.canMarry(e.id(k), e.id(agents.find((j) => w.profileOf(j).sex === 'f'))) === true);
const woman = agents.find((j) => w.profileOf(j).sex === 'f');
if (man !== undefined) console.log('wedding:', w.life.wed(e.id(man), e.id(woman)));
const named = nameOf(agents[1]);
await p.fill('#chIn', `Hello ${named}, how is the camp?`); await p.click('#chGo');
await p.waitForFunction((n) => [...document.querySelectorAll('.ch-m:not(.me) .ch-n')].some((x) => x.textContent === n), named, { timeout: 15000 });
await shot(p, '1-world-channel.png');
// 2. A direct message with a long-ish order; the answer, then "Done" when the task ends.
const worker = agents[0], wname = nameOf(worker);
await app.adminCmd({ cmd: 'speed', speed: 5 }, 'proof', true);
await p.waitForTimeout(1300);
await p.selectOption('#chTo', String(e.id(worker)));
await p.fill('#chIn', 'Please wait by the well for me, I will come later.'); await p.click('#chGo');
await p.waitForFunction(() => document.querySelectorAll('.ch-m:not(.me)').length >= 1, null, { timeout: 15000 });
await shot(p, '2-dm-order.png');
console.log('task of', wname, ':', JSON.stringify(w.profileOf(worker).mind.task?.text), 'from', w.profileOf(worker).mind.task?.from);
await p.waitForFunction(() => [...document.querySelectorAll('.ch-m:not(.me) p')].some((x) => x.textContent.startsWith('Done')), null, { timeout: 90000 });
await shot(p, '3-dm-done.png');
// 3. Sara's clan: the clan channel, members answer.
const c = w.clans.found(e.map[agents[2]], e.id(agents[2]), [e.id(agents[3]), e.id(agents[4]), app.net.residents.get('Sara')].filter((x) => x !== undefined), undefined, 'Ironwood');
await p.waitForTimeout(800);
await p.evaluate(() => { location.hash = '#/me'; }); await p.waitForTimeout(500); await p.evaluate(() => { location.hash = '#/chat'; });
await p.waitForSelector(`[data-chan="clan:${c.id}"]`, { timeout: 10000 }); await p.click(`[data-chan="clan:${c.id}"]`);
await p.waitForTimeout(1300);
await p.fill('#chIn', 'Good evening, clan. What do we need?'); await p.click('#chGo');
await p.waitForFunction(() => document.querySelectorAll('.ch-m:not(.me)').length >= 2, null, { timeout: 15000 });
await shot(p, '4-clan-channel.png');
// 4. A phone: the list, then the open chat.
const m = await page({ width: 390, height: 844 });
await m.waitForSelector('#sEmail', { state: 'visible' });
await m.fill('#sEmail', 'sara@example.com'); await m.fill('#sPass', 'secret123'); await m.click('#sEmailGo');
await m.waitForSelector('#app:not([hidden])', { timeout: 15000 });
await m.evaluate(() => { location.hash = '#/chat'; }); await m.waitForSelector('#chList .ch-row', { timeout: 10000 });
await shot(m, '5-phone-list.png');
await m.click(`[data-chan^="dm:"]`); await m.waitForSelector('.chatpg.open .ch-m');
await shot(m, '6-phone-dm.png');
// 5. The admin token: no character, the page says so.
const t = await page({ width: 1200, height: 700 });
await t.waitForSelector('#sTokBox', { state: 'attached' });
await t.evaluate(() => { document.getElementById('sTokBox').open = true; });
await t.fill('#sTokIn', 'proof-admin-token-0123456789'); await t.click('#sGo');
await t.waitForSelector('#app:not([hidden])', { timeout: 15000 });
await t.evaluate(() => { location.hash = '#/chat'; }); await t.waitForSelector('#chWrap .card-b p', { timeout: 10000 });
await shot(t, '7-admin-token.png');
const rows = app.db.sql.prepare('SELECT chan, name, text, sys FROM chat_msgs ORDER BY id').all();
for (const r of rows) console.log(`  [${r.chan}] ${r.sys ? '(news)' : r.name + ':'} ${r.text}`);
console.log('page errors:', [...p.errs, ...m.errs, ...t.errs].join(' | ') || 'none');
await b.close(); await app.stop(); llm.close();
