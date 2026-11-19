import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { WebSocket } from 'ws';
import { Msg, PROTOCOL_VERSION, ENT_REC, encode, decode, unpackI32, type ServerMsg, type ClientMsg } from '@worldsim/protocol';
import { App } from '../app.js';
import { DEFAULTS, type Config } from '../config.js';
import { Logger } from '../log.js';

const ADMIN = 'admin-token-0123456789abcdef';
const VIEW1 = 'viewer-token-imad-1234', VIEW2 = 'viewer-token-guest-5678';

function makeApp(dataDir: string, extra: Partial<Config> = {}): App {
  const cfg: Config = { ...structuredClone(DEFAULTS), dataDir, port: 0, snapshotEverySec: 1, ...extra };
  cfg.tunnel = { provider: 'none', bin: { ngrok: '/nonexistent/ngrok' } };
  return new App(cfg, { adminToken: ADMIN, viewers: new Map([['imad', VIEW1], ['guest', VIEW2]]) }, new Logger('error', undefined, true));
}

class Client {
  ws: WebSocket;
  msgs: ServerMsg[] = [];
  private waiters: [(m: ServerMsg) => boolean, (m: ServerMsg) => void][] = [];
  constructor(url: string) {
    this.ws = new WebSocket(url);
    this.ws.on('message', (d) => {
      const m = decode(d as Buffer) as ServerMsg;
      this.msgs.push(m);
      this.waiters = this.waiters.filter(([f, ok]) => (f(m) ? (ok(m), false) : true));
    });
  }
  opened() { return new Promise<void>((ok, fail) => { this.ws.once('open', () => ok()); this.ws.once('error', fail); }); }
  send(m: ClientMsg) { this.ws.send(encode(m)); }
  wait(f: (m: ServerMsg) => boolean, ms = 5000): Promise<ServerMsg> {
    const found = this.msgs.find(f);
    if (found) return Promise.resolve(found);
    return new Promise((ok, fail) => {
      const t = setTimeout(() => fail(new Error('timeout')), ms);
      this.waiters.push([f, (m) => { clearTimeout(t); ok(m); }]);
    });
  }
  closed() { return new Promise<number>((ok) => this.ws.once('close', (c) => ok(c))); }
}

async function connect(url: string, token: string): Promise<Client> {
  const c = new Client(url);
  await c.opened();
  c.send({ t: Msg.Hello, v: PROTOCOL_VERSION, token });
  return c;
}

test('server: viewers stream their area, auth and roles enforced, admin controls time, restart resumes', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'ws-'));
  try {
    const app = makeApp(dir);
    await app.start();
    after(() => app.stop());
    const url = app.net.address().replace('http', 'ws') + '/ws';

    const health = await (await fetch(app.net.address() + '/health')).json() as { ok: boolean };
    assert.equal(health.ok, true);
    assert.equal((await fetch(app.net.address() + '/api/stats')).status, 401);
    assert.equal((await fetch(app.net.address() + '/api/stats', { headers: { authorization: `Bearer ${ADMIN}` } })).status, 200);

    // Wrong token.
    const bad = await connect(url, 'nope-nope-nope-nope');
    const err = await bad.wait((m) => m.t === Msg.Error) as { code: string };
    assert.equal(err.code, 'auth');
    await bad.closed();

    // Two players at once, each watching a different map.
    const a = await connect(url, VIEW1), b = await connect(url, VIEW2);
    const wa = await a.wait((m) => m.t === Msg.Welcome) as { role: string; maps: { id: string }[]; portals: unknown[] };
    assert.equal(wa.role, 'viewer');
    assert.deepEqual(wa.maps.map((m) => m.id), ['town', 'woods']);
    assert.equal(wa.portals.length, 2);
    await b.wait((m) => m.t === Msg.Welcome);
    // Watch where agents are.
    const e = app.world.e;
    const inMap = (mi: number) => { for (let i = 0; i < e.hi; i++) if (e.kind[i] === 1 && e.map[i] === mi) return i; return -1; };
    const ia = inMap(0), ib = inMap(1);
    a.send({ t: Msg.View, map: 'town', x: e.x[ia]!, y: e.y[ia]!, r: 40 });
    b.send({ t: Msg.View, map: 'woods', x: e.x[ib]!, y: e.y[ib]!, r: 40 });
    const ca = await a.wait((m) => m.t === Msg.Chunk) as { map: string; tiles: Uint8Array };
    assert.equal(ca.map, 'town');
    assert.equal(ca.tiles.length, 32 * 32);
    const fa = await a.wait((m) => m.t === Msg.Frame) as { map: string; upd: Uint8Array };
    assert.equal(fa.map, 'town');
    const recs = unpackI32(fa.upd);
    assert.ok(recs.length >= ENT_REC && recs.length % ENT_REC === 0, `records ${recs.length} bytes ${fa.upd.byteLength} off ${fa.upd.byteOffset}`);
    const fb = await b.wait((m) => m.t === Msg.Frame) as { map: string };
    assert.equal(fb.map, 'woods');
    // Only nearby chunks: a 40 m view never gets the whole 8x8-chunk town.
    await new Promise((r) => setTimeout(r, 1500));
    const townChunks = new Set(a.msgs.filter((m) => m.t === Msg.Chunk).map((m) => (m as { cx: number; cy: number }).cx + ',' + (m as { cy: number }).cy));
    assert.ok(townChunks.size > 0 && townChunks.size < 64, `${townChunks.size} chunks`);

    // A viewer can not use admin commands.
    a.send({ t: Msg.Admin, id: 1, c: { cmd: 'pause', paused: true } });
    assert.equal(((await a.wait((m) => m.t === Msg.Error && (m as { code: string }).code === 'forbidden')) as { code: string }).code, 'forbidden');

    // Admin: speed and pause, with validation.
    const adm = await connect(url, ADMIN);
    assert.equal(((await adm.wait((m) => m.t === Msg.Welcome)) as { role: string }).role, 'admin');
    adm.send({ t: Msg.Admin, id: 7, c: { cmd: 'speed', speed: 10 } });
    assert.equal(((await adm.wait((m) => m.t === Msg.AdminResult && (m as { id: number }).id === 7)) as { ok: boolean }).ok, true);
    adm.send({ t: Msg.Admin, id: 8, c: { cmd: 'speed', speed: 1e9 } });
    assert.equal(((await adm.wait((m) => m.t === Msg.AdminResult && (m as { id: number }).id === 8)) as { ok: boolean }).ok, false);
    await new Promise((r) => setTimeout(r, 2200));
    const st = app.stats();
    assert.ok(st.tps > 100, `x10 runs about 200 ticks/s, got ${st.tps}`);
    adm.send({ t: Msg.Admin, id: 9, c: { cmd: 'pause', paused: true } });
    await adm.wait((m) => m.t === Msg.AdminResult && (m as { id: number }).id === 9);
    const t1 = app.world.tick;
    await new Promise((r) => setTimeout(r, 300));
    assert.equal(app.world.tick, t1, 'paused');
    adm.send({ t: Msg.Admin, id: 10, c: { cmd: 'pause', paused: false } });
    await adm.wait((m) => m.t === Msg.AdminResult && (m as { id: number }).id === 10);

    // Junk is refused.
    const junk = await connect(url, VIEW1);
    await junk.wait((m) => m.t === Msg.Welcome);
    junk.ws.send(Buffer.from([0xc1, 0xff]));
    assert.equal(await junk.closed(), 4002);

    for (const c of [a, b, adm]) c.ws.close();
    const tickAtStop = app.world.tick;
    const hashAtStop = app.world.hash();
    await app.stop();

    // Restart from the same folder: the world goes on where it stopped.
    const app2 = makeApp(dir);
    await app2.start();
    after(() => app2.stop());
    assert.equal(app2.world.tick, tickAtStop);
    assert.equal(app2.world.hash(), hashAtStop);
    await app2.stop();
  } finally {
    rmSync(dir, { recursive: true, force: true, maxRetries: 10, retryDelay: 200 });
  }
});

test('pairing: a TV gets a code, the admin approves it, the TV keeps its own token; revoke kicks it', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'ws-'));
  try {
    const app = makeApp(dir);
    await app.start();
    after(() => app.stop());
    const url = app.net.address().replace('http', 'ws') + '/ws';
    const adm = await connect(url, ADMIN);
    await adm.wait((m) => m.t === Msg.Welcome);
    const tv = new Client(url);
    await tv.opened();
    tv.send({ t: Msg.Pair, v: PROTOCOL_VERSION, name: 'Imad', dev: 'Samsung TV' });
    const pc = await tv.wait((m) => m.t === Msg.PairCode) as { code: string };
    assert.match(pc.code, /^\d{6}$/);
    const note = await adm.wait((m) => m.t === Msg.Notice && (m as { kind: string }).kind === 'pairing') as { data: { code: string } };
    assert.equal(note.data.code, pc.code);
    adm.send({ t: Msg.Admin, id: 1, c: { cmd: 'approve', code: pc.code, name: 'imad tv' } });
    const ok = await adm.wait((m) => m.t === Msg.AdminResult && (m as { id: number }).id === 1) as { ok: boolean; data: { name: string } };
    assert.equal(ok.ok, true);
    const paired = await tv.wait((m) => m.t === Msg.Paired) as { token: string; name: string };
    assert.equal(paired.name, 'imad tv');
    assert.ok(paired.token.length >= 24);
    // A wrong code is refused.
    adm.send({ t: Msg.Admin, id: 2, c: { cmd: 'approve', code: '000000' } });
    assert.equal(((await adm.wait((m) => m.t === Msg.AdminResult && (m as { id: number }).id === 2)) as { ok: boolean }).ok, false);
    // The token works as a viewer, also after a server restart (stored hashed in SQLite).
    const v = await connect(url, paired.token);
    assert.equal(((await v.wait((m) => m.t === Msg.Welcome)) as { role: string }).role, 'viewer');
    const raw = JSON.stringify(app.db.sql.prepare('SELECT * FROM players').all());
    assert.ok(!raw.includes(paired.token), 'only a hash is stored');
    adm.send({ t: Msg.Admin, id: 3, c: { cmd: 'revoke', name: 'imad tv' } });
    await adm.wait((m) => m.t === Msg.AdminResult && (m as { id: number }).id === 3);
    assert.equal(await v.closed(), 4004, 'revoked viewer is disconnected');
    const again = await connect(url, paired.token);
    assert.equal(((await again.wait((m) => m.t === Msg.Error)) as { code: string }).code, 'auth');
    adm.ws.close();
    // Switching to a tunnel that can not start keeps the old one.
    await assert.rejects(app.tunnel.switchTo('ngrok' as never).catch((e) => { throw e; }));
    assert.equal(app.tunnel.status().provider, 'none');
    await app.stop(); // close SQLite before the folder goes (Windows keeps open files)
  } finally {
    rmSync(dir, { recursive: true, force: true, maxRetries: 10, retryDelay: 200 });
  }
});

test('players: join puts my character in the world, input moves it, leaving keeps its place', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'ws-'));
  try {
    const app = makeApp(dir);
    await app.start();
    after(() => app.stop());
    const url = app.net.address().replace('http', 'ws') + '/ws';
    const c = await connect(url, VIEW1);
    await c.wait((m) => m.t === Msg.Welcome);
    c.send({ t: Msg.Join });
    const you = await c.wait((m) => m.t === Msg.You) as { id: number; map: string; transit: boolean };
    assert.equal(you.map, 'town');
    assert.equal(you.transit, false);
    const e = app.world.e, i = e.slot(you.id);
    assert.equal(e.kind[i], 6);
    const x0 = e.x[i]!, y0 = e.y[i]!;
    // Hold a direction for a second (re-sent like a real client).
    for (let k = 0; k < 5; k++) { c.send({ t: Msg.Input, mx: 0.7, my: 0.7, run: true }); await new Promise((r) => setTimeout(r, 200)); }
    c.send({ t: Msg.Input, mx: 0, my: 0 });
    const moved = Math.hypot(e.x[i]! - x0, e.y[i]! - y0);
    assert.ok(moved > 0.5, `moved ${moved.toFixed(2)} m`);
    // Our own character appears in our frames.
    await c.wait((m) => m.t === Msg.Frame && unpackI32((m as { upd: Uint8Array }).upd).some((v, k) => k % ENT_REC === 0 && v === you.id));
    // Bad input is ignored, not a crash.
    c.send({ t: Msg.Input, mx: 1e9, my: Number.NaN as unknown as number });
    // Leave: the character goes, its place is kept.
    const xs = e.x[i]!, ys = e.y[i]!;
    c.ws.close();
    await new Promise((r) => setTimeout(r, 300));
    assert.equal(e.slot(you.id), -1, 'character removed when the player leaves');
    const c2 = await connect(url, VIEW1);
    await c2.wait((m) => m.t === Msg.Welcome);
    c2.send({ t: Msg.Join });
    const you2 = await c2.wait((m) => m.t === Msg.You) as { id: number };
    const j = e.slot(you2.id);
    assert.ok(Math.hypot(e.x[j]! - xs, e.y[j]! - ys) < 1.5, `back where it left: ${xs},${ys} -> ${e.x[j]},${e.y[j]} saved ${app.db.getMeta('pos:imad')}`);
    // Admins have no character.
    const adm = await connect(url, ADMIN);
    await adm.wait((m) => m.t === Msg.Welcome);
    adm.send({ t: Msg.Join });
    assert.equal(((await adm.wait((m) => m.t === Msg.Error)) as { code: string }).code, 'forbidden');
    c2.ws.close(); adm.ws.close();
    await app.stop();
  } finally {
    rmSync(dir, { recursive: true, force: true, maxRetries: 10, retryDelay: 200 });
  }
});
