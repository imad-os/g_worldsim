import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { generateKeyPairSync, createSign } from 'node:crypto';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { WebSocket } from 'ws';
import { Msg, PROTOCOL_VERSION, encode, decode, type ServerMsg, type ClientMsg } from '@worldsim/protocol';
import { FirebaseAuth } from '../auth/firebase.js';
import { App } from '../app.js';
import { DEFAULTS, type Config } from '../config.js';
import { Logger } from '../log.js';

// A fake Google: its own RSA key signs ID tokens; a fake Firestore answers roles/<uid> only to that user's own token.
const PID = 'worldsim-test';
const { privateKey, publicKey } = generateKeyPairSync('rsa', { modulusLength: 2048 });
const jwk = { ...publicKey.export({ format: 'jwk' }), kid: 'k1', alg: 'RS256', use: 'sig' };
const b64u = (o: unknown) => Buffer.from(JSON.stringify(o)).toString('base64url');
function idToken(uid: string, email: string, over: Record<string, unknown> = {}, key = privateKey): string {
  const t = Math.floor(Date.now() / 1000);
  const h = b64u({ alg: 'RS256', kid: 'k1', typ: 'JWT' }), b = b64u({ aud: PID, iss: `https://securetoken.google.com/${PID}`, sub: uid, iat: t, exp: t + 3600, email, email_verified: true, ...over });
  return `${h}.${b}.${createSign('RSA-SHA256').update(`${h}.${b}`).sign(key).toString('base64url')}`;
}
const ROLES: Record<string, string> = { u_owner: 'owner', u_admin: 'admin' };
const fakeFetch = async (url: string, init?: { headers?: Record<string, string> }) => {
  const res = (status: number, body: unknown) => ({ ok: status < 300, status, headers: { get: (k: string) => (k === 'cache-control' ? 'max-age=600' : null) }, json: async () => body });
  if (url.includes('securetoken')) return res(200, { keys: [jwk] });
  const uid = decodeURIComponent(url.split('/roles/')[1] ?? '');
  const tok = init?.headers?.Authorization?.replace('Bearer ', '') ?? '';
  const sub = JSON.parse(Buffer.from(tok.split('.')[1] ?? '', 'base64url').toString() || '{}').sub;
  if (sub !== uid) return res(403, {});
  return ROLES[uid] ? res(200, { fields: { role: { stringValue: ROLES[uid] } } }) : res(404, {});
};

test('firebase: ID tokens checked with the public keys, roles read with the own token', async () => {
  const a = new FirebaseAuth(PID, fakeFetch);
  const u = await a.verify(idToken('u_owner', 'o@example.com'));
  assert.equal(u.uid, 'u_owner');
  assert.equal(await a.role('u_owner', idToken('u_owner', 'o@example.com')), 'owner');
  assert.equal(await a.role('u_new', idToken('u_new', 'n@example.com')), 'player', 'no document = player');
  const other = generateKeyPairSync('rsa', { modulusLength: 2048 }).privateKey;
  await assert.rejects(a.verify(idToken('x', 'x@example.com', {}, other)), /signature/);
  await assert.rejects(a.verify(idToken('x', 'x@example.com', { aud: 'other' })), /other project/);
  await assert.rejects(a.verify(idToken('x', 'x@example.com', { exp: 1 })), /expired/);
  await assert.rejects(new FirebaseAuth('').verify('a.b.c'), /not set up/);
});

class Client {
  ws: WebSocket; msgs: ServerMsg[] = [];
  constructor(url: string) { this.ws = new WebSocket(url); this.ws.on('message', (d) => this.msgs.push(decode(d as Buffer) as ServerMsg)); }
  opened() { return new Promise<void>((ok, fail) => { this.ws.once('open', () => ok()); this.ws.once('error', fail); }); }
  send(m: ClientMsg) { this.ws.send(encode(m)); }
  async wait(f: (m: ServerMsg) => boolean, ms = 5000): Promise<ServerMsg> {
    const end = Date.now() + ms;
    for (;;) { const m = this.msgs.find(f); if (m) return m; if (Date.now() > end) throw new Error('timeout'); await new Promise((r) => setTimeout(r, 20)); }
  }
  async cmd(id: number, c: Record<string, unknown>) {
    const from = this.msgs.length;
    this.send({ t: Msg.Admin, id, c: c as never });
    return (await this.wait((m) => this.msgs.indexOf(m) >= from && ((m.t === Msg.AdminResult && (m as { id: number }).id === id) || m.t === Msg.Error))) as unknown as { t: string; ok: boolean; data: never; err?: string; code?: string };
  }
}
async function signIn(url: string, token: string) { const c = new Client(url); await c.opened(); c.send({ t: Msg.Hello, v: PROTOCOL_VERSION, token }); return c; }

test('firebase accounts: owner gets the admin tools, a player only joins as a person and pairs their own TV', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'ws-auth-'));
  try {
    const cfg: Config = { ...structuredClone(DEFAULTS), dataDir: dir, port: 0, auth: { projectId: PID } };
    cfg.tunnel = { provider: 'none', bin: { ngrok: '/nonexistent/ngrok' } };
    cfg.ai = { ...cfg.ai, provider: 'none' };
    const app = new App(cfg, { adminToken: 'admin-token-0123456789abcdef', viewers: new Map() }, new Logger('error', undefined, true));
    app.authFetch = fakeFetch;
    await app.start();
    after(() => app.stop());
    const url = app.net.address().replace('http', 'ws') + '/ws';

    const owner = await signIn(url, 'fb:' + idToken('u_owner', 'o@example.com'));
    const wo = (await owner.wait((m) => m.t === Msg.Welcome)) as { role: string; account: { role: string } };
    assert.equal(wo.role, 'admin'); assert.equal(wo.account.role, 'owner');
    assert.equal((await owner.cmd(1, { cmd: 'overview' })).ok, true, 'owner uses admin commands');

    const pl = await signIn(url, 'fb:' + idToken('u_p', 'p@example.com'));
    const wp = (await pl.wait((m) => m.t === Msg.Welcome)) as { role: string; account: { role: string; name: string } };
    assert.equal(wp.role, 'player'); assert.equal(wp.account.name, '');
    assert.equal((await pl.cmd(2, { cmd: 'overview' })).code, 'forbidden', 'a player has no admin tools');
    assert.match(String((await pl.cmd(3, { cmd: 'joinWorld', name: 'admin' })).err), /taken/);
    const j = await pl.cmd(4, { cmd: 'joinWorld', name: 'Sara' });
    assert.equal(j.ok, true, j.err);
    const me = (await pl.cmd(5, { cmd: 'me' })).data as { name: string; character: { hp: number } | null };
    assert.equal(me.name, 'Sara'); assert.ok(me.character, 'a character lives in the world');
    assert.ok(app.net.characters().some(([n]) => n === 'Sara'));
    assert.equal(app.isStaff('Sara'), false, 'no in-game admin tools for a player');

    // TVs join by themselves under their My PC name, but never as an owner's / admin's character.
    assert.equal((await owner.cmd(20, { cmd: 'joinWorld', name: 'Boss' })).ok, true);
    const tvb = new Client(url); await tvb.opened(); tvb.send({ t: Msg.Pair, v: PROTOCOL_VERSION, name: 'boss' });
    assert.equal(((await tvb.wait((m) => m.t === Msg.Paired)) as { name: string }).name, 'boss (2)');
    tvb.ws.close();
    assert.equal((await owner.cmd(21, { cmd: 'autoJoin', on: false })).ok, true);
    // Their TV: pair -> the player approves it themselves -> it plays as Sara.
    const tv = new Client(url); await tv.opened(); tv.send({ t: Msg.Pair, v: PROTOCOL_VERSION, name: 'TV' });
    const code = ((await tv.wait((m) => m.t === Msg.PairCode)) as { code: string }).code;
    assert.deepEqual((await pl.cmd(6, { cmd: 'approveMine', code })).data, { name: 'Sara' });
    const tok = ((await tv.wait((m) => m.t === Msg.Paired)) as { token: string }).token;
    const tv2 = await signIn(url, tok);
    assert.equal(((await tv2.wait((m) => m.t === Msg.Welcome)) as { role: string }).role, 'viewer');

    // A bad token is refused.
    const bad = await signIn(url, 'fb:' + idToken('u_x', 'x@example.com', { aud: 'nope' }));
    assert.equal(await new Promise<number>((ok) => bad.ws.once('close', (c) => ok(c))), 4004);
    for (const c of [owner, pl, tv, tv2]) c.ws.close();
    await app.stop(); // close the database before the folder is removed (Windows)
  } finally { rmSync(dir, { recursive: true, force: true, maxRetries: 10, retryDelay: 200 }); }
});
