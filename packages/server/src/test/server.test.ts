import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { WebSocket } from 'ws';
import { Msg, EFlag, PROTOCOL_VERSION, ENT_REC, encode, decode, unpackI32, type ServerMsg, type ClientMsg } from '@worldsim/protocol';
import { App } from '../app.js';
import { DEFAULTS, type Config } from '../config.js';
import { Logger } from '../log.js';

const ADMIN = 'admin-token-0123456789abcdef';
const VIEW1 = 'viewer-token-imad-1234', VIEW2 = 'viewer-token-guest-5678';

function makeApp(dataDir: string, extra: Partial<Config> = {}): App {
  const cfg: Config = { ...structuredClone(DEFAULTS), dataDir, port: 0, snapshotEverySec: 1, auth: { projectId: 'none' }, ...extra };
  cfg.tunnel = { provider: 'none', bin: { ngrok: '/nonexistent/ngrok' } };
  cfg.ai = { ...cfg.ai, provider: 'none' }; // tests never reach a real AI
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
    assert.equal(wa.portals.length, 8); // 4 roads out of town, 4 ways back
    await b.wait((m) => m.t === Msg.Welcome);
    // Watch where agents are.
    const e = app.world.e;
    const inMap = (mi: number) => { for (let i = 0; i < e.hi; i++) if (e.kind[i] === 1 && e.map[i] === mi) return i; return -1; };
    // Everyone starts in the town now: put one person in the woods for the second viewer.
    if (inMap(1) < 0) { const s = app.world.freeSpot(1, 96, 96, 80)!; app.world.spawnAgent(1, s.x, s.y); }
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

    // Travel between maps: closed by default, kept across restarts once opened.
    assert.equal(app.stats().travelOpen, false);
    adm.send({ t: Msg.Admin, id: 11, c: { cmd: 'travel', open: true } });
    assert.deepEqual(((await adm.wait((m) => m.t === Msg.AdminResult && (m as { id: number }).id === 11)) as { data: unknown }).data, { open: true });

    // The control panel's reads: overview, live map, tiles, people, history; reads are not written to the timeline.
    const ask = async (id: number, c: Record<string, unknown>) => {
      adm.send({ t: Msg.Admin, id, c: c as never });
      const r = (await adm.wait((m) => m.t === Msg.AdminResult && (m as { id: number }).id === id)) as unknown as { ok: boolean; data: never; error?: string };
      assert.equal(r.ok, true, `${String(c.cmd)}: ${r.error}`);
      return r.data as Record<string, unknown> & unknown[];
    };
    const ov = await ask(20, { cmd: 'overview' }) as unknown as { alive: number; maps: { id: string; people: number }[] };
    assert.ok(ov.alive > 0 && ov.maps.length >= 2);
    const live = await ask(21, { cmd: 'live', map: ov.maps[0]!.id }) as unknown as { people: unknown[] };
    assert.ok(Array.isArray(live.people));
    const tiles = await ask(22, { cmd: 'mapTiles', map: ov.maps[0]!.id }) as unknown as { w: number; h: number; tiles: Uint8Array };
    assert.equal(tiles.tiles.length, tiles.w * tiles.h);
    assert.ok((await ask(23, { cmd: 'people' })).length >= ov.alive);
    assert.ok(Array.isArray(await ask(24, { cmd: 'history' })));
    const adminRows = (await ask(25, { cmd: 'timeline', limit: 500, kind: 'admin' })) as { data: { cmd: string } }[];
    assert.ok(!adminRows.some((e) => ['overview', 'live', 'mapTiles', 'people', 'history', 'timeline'].includes(e.data.cmd)), 'reads are not logged');
    assert.ok(adminRows.some((e) => e.data.cmd === 'travel'), 'changes are logged');

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
    assert.equal(app2.world.travelOpen, true);
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
    // By default a TV joins at once under its My PC username; a second TV with the same name gets "(2)".
    for (const [name, want] of [['Sara', 'Sara'], ['sara', 'sara (2)']]) {
      const t = new Client(url);
      await t.opened();
      t.send({ t: Msg.Pair, v: PROTOCOL_VERSION, name, dev: 'Samsung TV' });
      const got = await t.wait((m) => m.t === Msg.Paired || m.t === Msg.PairCode) as unknown as { t: unknown; name: string };
      assert.equal(got.t, Msg.Paired, 'no code to approve');
      assert.equal(got.name, want);
      t.ws.close();
    }
    // Two names of one person are merged: the TV of "sara (2)" is now "Sara" (the old "Sara" TV row gives way).
    adm.send({ t: Msg.Admin, id: 8, c: { cmd: 'mergePlayer', from: 'sara (2)', into: 'Sara' } });
    const mg = await adm.wait((m) => m.t === Msg.AdminResult && (m as { id: number }).id === 8) as { ok: boolean; data: { renamed: boolean } };
    assert.equal(mg.ok, true); assert.equal(mg.data.renamed, true);
    assert.deepEqual((app.db.sql.prepare('SELECT name FROM players ORDER BY name').all() as { name: string }[]).map((r) => r.name).filter((n) => /sara/i.test(n)), ['Sara']);
    adm.send({ t: Msg.Admin, id: 9, c: { cmd: 'autoJoin', on: false } });
    assert.equal(((await adm.wait((m) => m.t === Msg.AdminResult && (m as { id: number }).id === 9)) as { data: { on: boolean } }).data.on, false);
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
    // Watch mode: my character goes on AI autopilot; playing again gives the controls back.
    c.send({ t: Msg.Join, watch: true });
    await new Promise((r) => setTimeout(r, 300));
    assert.equal(e.kind[i], 1, 'autopilot: an agent for the brain');
    c.send({ t: Msg.Join });
    await new Promise((r) => setTimeout(r, 300));
    assert.equal(e.kind[i], 6, 'back under my control');
    // Bad input is ignored, not a crash.
    c.send({ t: Msg.Input, mx: 1e9, my: Number.NaN as unknown as number });
    // A next to a person: they stop, face me and answer (built-in line: the AI is off), and everyone looking hears it.
    let ag = -1;
    for (let k = 0; k < e.hi; k++) if (e.kind[k] === 1) { ag = k; break; }
    app.world.place(ag, 0, e.x[i]! + 1.2, e.y[i]!);
    app.world.brain.stop(ag); e.nextThink[ag] = app.world.tick + 2000; // stand still here
    await new Promise((r) => setTimeout(r, 150)); // the spatial grid catches up on the next tick
    c.send({ t: Msg.View, map: 'town', x: e.x[i]!, y: e.y[i]!, r: 30 });
    c.send({ t: Msg.Input, mx: 0, my: 0, act: true });
    const said = await c.wait((m) => m.t === Msg.Notice && (m as { kind: string }).kind === 'say') as { data: { id: number; name: string; text: string } };
    assert.equal(said.data.id, e.id(ag));
    assert.ok(said.data.text.length > 2);
    assert.equal(e.act[ag], 6, 'they talk with me');
    // Leave: the character goes, its place is kept.
    const xs = e.x[i]!, ys = e.y[i]!;
    c.ws.close();
    await new Promise((r) => setTimeout(r, 300));
    // imad 2026-11-20: my character lives in the world 24/7, asleep while I am away; people can still find it.
    assert.equal(e.slot(you.id), i, 'character stays when the player leaves');
    assert.ok(e.flags[i]! & EFlag.Sleeping, 'asleep while away');
    assert.ok(app.world.away.has(you.id));
    const c2 = await connect(url, VIEW1);
    await c2.wait((m) => m.t === Msg.Welcome);
    c2.send({ t: Msg.Join });
    const you2 = await c2.wait((m) => m.t === Msg.You) as { id: number };
    const j = e.slot(you2.id);
    assert.equal(you2.id, you.id, 'the same character back');
    assert.ok(!(e.flags[j]! & EFlag.Sleeping) && !app.world.away.has(j), 'awake again when I come back');
    assert.ok(Math.hypot(e.x[j]! - xs, e.y[j]! - ys) < 1.5, `back where it left: ${xs},${ys} -> ${e.x[j]},${e.y[j]} saved ${app.db.getMeta('pos:imad')}`);
    // Admins have no character.
    const adm = await connect(url, ADMIN);
    await adm.wait((m) => m.t === Msg.Welcome);
    adm.send({ t: Msg.Join });
    assert.equal(((await adm.wait((m) => m.t === Msg.Error)) as { code: string }).code, 'forbidden');
    // The panel treats a player's character like any person (imad 2026-11-21): details, stats, rules, talk; orders wait for autopilot.
    const adc = async (id: number, c: Record<string, unknown>) => {
      adm.send({ t: Msg.Admin, id, c: c as never });
      return (await adm.wait((m) => m.t === Msg.AdminResult && (m as { id: number }).id === id)) as unknown as { ok: boolean; data: never; error?: string };
    };
    const pa = await adc(70, { cmd: 'agent', id: you.id });
    assert.equal((pa.data as { player: string }).player, 'imad');
    assert.equal((await adc(71, { cmd: 'agentSet', id: you.id, set: { hunger: 40 } })).ok, true, 'edit a player');
    assert.equal(e.hunger[j], 40);
    // Outside the usual range = a question, not a refusal (imad 2026-11-25): force applies it; what the engine can't hold stays refused.
    const big = await adc(75, { cmd: 'agentSet', id: you.id, set: { strength: 1.5 } }) as unknown as { ok: boolean; err?: string };
    assert.equal(big.ok, false); assert.match(String(big.err), /^confirm: strength = 150 % is outside the usual 0 % to 100 %/);
    assert.equal((await adc(76, { cmd: 'agentSet', id: you.id, set: { strength: 1.5 }, force: true })).ok, true, 'confirmed');
    assert.equal(app.world.profileOf(j)!.traits.strength, 1.5);
    assert.equal((await adc(77, { cmd: 'agentSet', id: you.id, set: { strength: -1 }, force: true })).ok, false, 'never below 0');
    assert.equal((await adc(78, { cmd: 'planner', batch: 30 })).ok, false, 'asks first');
    assert.equal((await adc(79, { cmd: 'planner', batch: 30, force: true })).ok, true);
    assert.equal((await adc(80, { cmd: 'speed', speed: 500, force: true })).ok, true, 'past maxSpeed on yes');
    assert.equal(app.loop.speed, 500);
    await adc(81, { cmd: 'speed', speed: 1 });
    const talk = await adc(72, { cmd: 'chat', id: you.id, text: 'hello' });
    assert.equal(talk.ok, true, talk.error);
    assert.equal((await adc(73, { cmd: 'order', id: you.id, kind: 'wander', target: '' })).ok, false, 'played by hand: no orders');
    const list = (await adc(74, { cmd: 'agents' })).data as { id: number }[];
    assert.equal(list.filter((x) => x.id === you.id).length, 1, 'listed once');
    c2.ws.close(); adm.ws.close();
    await app.stop();
  } finally {
    rmSync(dir, { recursive: true, force: true, maxRetries: 10, retryDelay: 200 });
  }
});

test('players do what people do; only allowed players see thoughts; person info', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'ws-'));
  try {
    const app = makeApp(dir);
    await app.start();
    after(() => app.stop());
    const url = app.net.address().replace('http', 'ws') + '/ws';
    const notice = (c: Client, kind: string, f: (d: any) => boolean = () => true) =>
      c.wait((m) => m.t === Msg.Notice && (m as { kind: string }).kind === kind && f((m as { data: unknown }).data)).then((m) => (m as { data: any }).data);
    const me = await connect(url, VIEW1), guest = await connect(url, VIEW2);
    const w1 = await me.wait((m) => m.t === Msg.Welcome) as { seer?: boolean };
    const w2 = await guest.wait((m) => m.t === Msg.Welcome) as { seer?: boolean };
    assert.equal(w1.seer, true, 'imad sees thoughts by default');
    assert.equal(w2.seer, false, 'other players do not');
    me.send({ t: Msg.Join });
    const you = await me.wait((m) => m.t === Msg.You) as { id: number };
    const e = app.world.e, i = e.slot(you.id);
    // Eat with nothing carried, then pick up food lying next to me, then eat it.
    me.send({ t: Msg.Do, a: 'eat' });
    assert.equal((await notice(me, 'did', (d) => d.a === 'eat')).code, 'noFood');
    let it = -1;
    for (let k = 0; k < e.hi; k++) if (e.kind[k] === 3 && e.map[k] === e.map[i]) { it = k; break; }
    assert.ok(it >= 0, 'food lies around');
    app.world.place(i, e.map[i]!, e.x[it]! + 0.5, e.y[it]!);
    e.hunger[i] = 60;
    me.msgs.length = 0;
    me.send({ t: Msg.Do, a: 'use' }); // the obvious thing here: pick it up
    const got = await notice(me, 'did');
    assert.equal(got.code, 'picked', JSON.stringify(got));
    assert.equal(e.carry[i], 1);
    me.send({ t: Msg.Do, a: 'eat' });
    assert.equal((await notice(me, 'did', (d) => d.a === 'eat')).code, 'ate');
    assert.equal(e.carry[i], 0);
    assert.ok(e.hunger[i]! < 60);
    const mine = await notice(me, 'me');
    assert.equal(typeof mine.hunger, 'number');
    // Sleep, then wake up by moving.
    me.send({ t: Msg.Do, a: 'sleep' });
    assert.equal((await notice(me, 'did', (d) => d.a === 'sleep')).code, 'sleep');
    assert.ok(e.flags[i]! & 4, 'asleep');
    for (let k = 0; k < 3; k++) { me.send({ t: Msg.Input, mx: 1, my: 0 }); await new Promise((r) => setTimeout(r, 100)); }
    me.send({ t: Msg.Input, mx: 0, my: 0 });
    assert.equal(e.flags[i]! & 4, 0, 'moving wakes me up');
    // Thoughts: the seer gets them for the people in view, the guest never.
    let ag = -1;
    for (let k = 0; k < e.hi; k++) if (e.kind[k] === 1) { ag = k; break; }
    me.send({ t: Msg.View, map: 'town', x: e.x[ag]!, y: e.y[ag]!, r: 40 });
    guest.send({ t: Msg.View, map: 'town', x: e.x[ag]!, y: e.y[ag]!, r: 40 });
    const minds = await notice(me, 'minds', (d) => Array.isArray(d) && d.some((r: number[]) => r[0] === e.id(ag)));
    assert.ok(minds.length >= 1);
    await new Promise((r) => setTimeout(r, 1300));
    assert.ok(!guest.msgs.some((m) => m.t === Msg.Notice && (m as { kind: string }).kind === 'minds'), 'guest gets no thoughts');
    // Person info: everyone gets the facts, only the seer gets the mind.
    me.send({ t: Msg.Info, id: e.id(ag) });
    guest.send({ t: Msg.Info, id: e.id(ag) });
    const a = await notice(me, 'info'), b = await notice(guest, 'info');
    assert.equal(a.id, e.id(ag)); assert.equal(b.name, a.name);
    assert.ok(typeof a.hunger === 'number' && a.traits);
    assert.equal(b.mind, undefined, 'no thoughts for the guest');
    // Typed on the TV next to someone: "wait here" -> they answer and stay.
    app.world.place(ag, e.map[i]!, e.x[i]! + 1.5, e.y[i]!);
    await new Promise((r) => setTimeout(r, 150));
    me.msgs.length = 0;
    me.send({ t: Msg.Do, a: 'talk', text: 'wait here please' });
    await notice(me, 'say', (d) => d.id === e.id(ag));
    assert.equal(app.world.brain.orderOf(ag).kind, 'stay', 'told to wait: waits');
    // The owner allows the guest in the panel.
    const adm = await connect(url, ADMIN);
    await adm.wait((m) => m.t === Msg.Welcome);
    adm.send({ t: Msg.Admin, id: 7, c: { cmd: 'seer', name: 'guest', on: true } });
    await adm.wait((m) => m.t === Msg.AdminResult && (m as { id: number }).id === 7);
    await notice(guest, 'minds');
    adm.send({ t: Msg.Admin, id: 8, c: { cmd: 'players' } });
    const pl = (await adm.wait((m) => m.t === Msg.AdminResult && (m as { id: number }).id === 8)) as { data: { name: string; seer: boolean }[] };
    assert.equal(pl.data.find((p) => p.name === 'guest')?.seer, true);
    me.ws.close(); guest.ws.close(); adm.ws.close();
    await app.stop();
  } finally {
    rmSync(dir, { recursive: true, force: true, maxRetries: 10, retryDelay: 200 });
  }
});

test('owner tools: strict rules from the panel, zombies per night and spawned next to someone, players go to anyone and are listed', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'ws-'));
  try {
    const app = makeApp(dir);
    await app.start();
    after(() => app.stop());
    const url = app.net.address().replace('http', 'ws') + '/ws';
    const adm = await connect(url, ADMIN);
    await adm.wait((m) => m.t === Msg.Welcome);
    let n = 100;
    const admin = async (c: Record<string, unknown>) => {
      const id = ++n;
      adm.send({ t: Msg.Admin, id, c } as ClientMsg);
      const r = await adm.wait((m) => m.t === Msg.AdminResult && (m as { id: number }).id === id) as { ok: boolean; data: any; err?: string };
      if (!r.ok) throw new Error(r.err);
      return r.data;
    };
    const w = app.world, e = w.e;
    const [aId, bId] = [...w.profiles.keys()];
    const bName = w.profiles.get(bId!)!.name;
    // Rules: one for a person, one for everyone; kept after a restart of the rules list; at most 5.
    let r = await admin({ cmd: 'rules', id: aId, add: `never talk to ${bName}` });
    const mine = r.people.find((p: { id: number }) => p.id === aId).rules;
    assert.deepEqual([...mine[0].forbid].sort(), ['child', 'court', 'talk']);
    assert.equal(mine[0].withName, bName);
    r = await admin({ cmd: 'rules', add: 'never leave the town' });
    assert.deepEqual(r.all[0].forbid, ['travel']);
    assert.ok(w.rules.forbidden(e.slot(aId!), 'talk', e.slot(bId!)));
    assert.equal(app.db.getMeta('rules_all'), JSON.stringify(r.all));
    for (let k = 0; k < 4; k++) await admin({ cmd: 'rules', id: aId, add: `rule ${k}` });
    await assert.rejects(admin({ cmd: 'rules', id: aId, add: 'one too many' }), /at most 5/);
    r = await admin({ cmd: 'rules', id: aId, remove: 0 });
    assert.equal(w.rules.forbidden(e.slot(aId!), 'talk', e.slot(bId!)), null, 'removed');
    // Zombies.
    assert.equal((await admin({ cmd: 'zombies', perNight: 4 })).perNight, 4);
    assert.equal(app.db.getMeta('zombies_night'), '4');
    const z = await admin({ cmd: 'zombieSpawn', near: bName, dist: 6, n: 2 });
    assert.equal(z.length, 2);
    assert.equal((await admin({ cmd: 'zombies' })).now.length, 2);
    await admin({ cmd: 'zombies', clear: true });
    assert.equal(w.zombies.count(), 0);
    // A player: listed in the panel with a position, goes to anyone from the game menu.
    const me = await connect(url, VIEW1);
    await me.wait((m) => m.t === Msg.Welcome);
    me.send({ t: Msg.Join });
    const you = await me.wait((m) => m.t === Msg.You) as { id: number };
    const people = await admin({ cmd: 'agents' });
    assert.ok(people.some((p: { player?: boolean; name: string }) => p.player && p.name === 'imad'), 'imad is in the panel list');
    const did = (code: string) => me.wait((m) => m.t === Msg.Notice && (m as { kind: string }).kind === 'did' && (m as { data: { code: string } }).data.code === code).then((m) => (m as { data: any }).data);
    me.send({ t: Msg.Do, a: 'roster' });
    const roster = (await did('roster')).list as [number, string, string][];
    assert.ok(roster.some(([id]) => id === bId));
    me.send({ t: Msg.Do, a: 'tp', text: String(bId) });
    const tp = await did('tp');
    assert.equal(tp.name, bName);
    const i = e.slot(you.id), j = e.slot(bId!);
    await new Promise((ok) => setTimeout(ok, 200));
    assert.ok(Math.hypot(e.x[i]! - e.x[j]!, e.y[i]! - e.y[j]!) < 6, 'next to them');
    me.ws.close(); adm.ws.close();
    await app.stop();
  } finally {
    rmSync(dir, { recursive: true, force: true, maxRetries: 10, retryDelay: 200 });
  }
});

test('past events: finished replays are kept in the database (the last 20) and sent to a viewer who asks', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'ws-'));
  try {
    const app = makeApp(dir);
    await app.start();
    after(() => app.stop());
    const url = app.net.address().replace('http', 'ws') + '/ws';
    const fake = (id: number) => ({ id, map: 'town', start: id * 100, end: id * 100 + 50, secs: 10, people: ['Lina'], zombies: 1, bites: 1, killed: 0, deaths: [], hz: 5, who: [[1, 0, 'Lina']], frames: '', events: [] });
    for (let k = 0; k < 23; k++) app.world.replays.onDone(fake(app.world.replays.nextId++) as never);
    const list = app.replayList();
    assert.equal(list.length, 20);
    assert.equal(list[0]!.id, 23, 'newest first');
    assert.equal(app.db.getMeta('replay:3'), undefined, 'the oldest dropped');
    const me = await connect(url, VIEW1);
    await me.wait((m) => m.t === Msg.Welcome);
    me.send({ t: Msg.Join });
    await me.wait((m) => m.t === Msg.You);
    const did = (code: string) => me.wait((m) => m.t === Msg.Notice && (m as { kind: string }).kind === 'did' && (m as { data: { code: string } }).data.code === code).then((m) => (m as { data: any }).data);
    me.send({ t: Msg.Do, a: 'replays' });
    assert.equal((await did('replays')).list.length, 20);
    me.send({ t: Msg.Do, a: 'replay', text: '22' });
    const r = (await did('replay')).rec;
    assert.equal(r.id, 22);
    assert.deepEqual(r.who, [[1, 0, 'Lina']]);
    me.ws.close();
    await app.stop();
  } finally {
    rmSync(dir, { recursive: true, force: true, maxRetries: 10, retryDelay: 200 });
  }
});

test('player buttons: attack hits what is in front, the bow shoots along the aim, build makes and puts things down', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'ws-'));
  try {
    const app = makeApp(dir);
    await app.start();
    const w = app.world, e = w.e, town = w.mapIndex.get('town')!, sv = w.survival;
    const spot = w.freeSpot(town, 60, 60)!;
    const p = w.spawnPlayer(town, spot.x, spot.y);
    const x = e.x[p]!, y = e.y[p]!;
    for (let i = 0; i < e.hi; i++) if (i !== p && (e.kind[i] === 5 || e.kind[i] === 7) && e.map[i] === town && Math.hypot(e.x[i]! - x, e.y[i]! - y) < 30) w.remove(i, 'test');
    const z = w.zombies.spawn(town, x + 2.3, y, true);
    const place = () => { e.x[z] = x + 2.3; e.y[z] = y; };
    place();
    // Melee: facing away = a swing at nothing; facing it = a hit.
    assert.equal(app.net.onDo('tester', p, 'hit', String(Math.PI)).code, 'swing');
    const hp0 = e.hp[z]!;
    assert.equal(app.net.onDo('tester', p, 'hit', '0').code, 'zHit');
    assert.ok(e.hp[z]! < hp0, 'it lost health');
    // Interact never fights.
    assert.notEqual(app.net.onDo('tester', p, 'take').code, 'zHit');
    // Bow: no bow, then a shot along the aim hits what is on that line; a shot elsewhere misses and uses the arrow.
    assert.equal(app.net.onDo('tester', p, 'shoot', '0').code, 'noBow');
    sv.inv(p).bow = 1; sv.inv(p).arrows = 3;
    e.x[z] = x + 12; e.y[z] = y + 0.4;
    const hp1 = e.hp[z]!;
    const r = app.net.onDo('tester', p, 'shoot', '0');
    assert.equal(r.code, 'zHit'); assert.equal(r.left, 2);
    assert.ok(e.hp[z]! < hp1);
    assert.equal(app.net.onDo('tester', p, 'shoot', String(Math.PI / 2)).code, 'missed');
    assert.equal(sv.inv(p).arrows, 1);
    // Build: not enough wood = told what is missing; with it the thing is made and put down (or kept when there is no room).
    sv.inv(p).wood = 0;
    assert.equal(app.net.onDo('tester', p, 'build', 'palisade@0').code, 'buildNeed');
    sv.inv(p).wood = 2;
    const b = app.net.onDo('tester', p, 'build', 'palisade@' + String(-Math.PI / 2));
    assert.ok(b.code === 'placed' || (b.code === 'noRoom' && b.kept), `built: ${JSON.stringify(b)}`);
    assert.equal(sv.inv(p).wood ?? 0, 0, 'the wood was used');
    await app.stop();
    // PvP: a separate action, off by default; small damage; Attack never touches a person.
    const q = w.freeSpot(town, x + 3, y)!;
    const person = [...Array(e.hi).keys()].find((i) => e.kind[i] === 1 && e.map[i] === town)!;
    e.x[person] = x + 1.2; e.y[person] = y; e.hp[person] = 100;
    assert.equal(app.net.onDo('tester', p, 'hitperson', '0').code, 'pvpOff');
    const before = e.hp[person]!;
    app.net.onDo('tester', p, 'hit', '0');
    assert.equal(e.hp[person], before, 'Attack never hits a person');
    assert.equal(app.net.onDo('tester', p, 'pvp', '1').code, 'pvp');
    const pr = app.net.onDo('tester', p, 'hitperson', '0');
    assert.equal(pr.code, 'pHit');
    assert.ok(e.hp[person]! < before && before - e.hp[person]! <= 30, 'small damage');
    void q;
  } finally { rmSync(dir, { recursive: true, force: true }); }
});
