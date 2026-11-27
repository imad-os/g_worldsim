import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { WebSocket } from 'ws';
import { Msg, PROTOCOL_VERSION, encode, decode, type ServerMsg, type ClientMsg } from '@worldsim/protocol';
import { App } from '../app.js';
import { DEFAULTS, type Config } from '../config.js';
import { Logger } from '../log.js';
import { NO_MAP } from '../sim/entities.js';

const ADMIN = 'admin-token-0123456789abcdef';
const VIEW1 = 'viewer-token-imad-1234';

test('a player walks into the woods: the server keeps running', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'ws-'));
  const errs: unknown[] = [];
  const onErr = (e: unknown) => { errs.push(e); };
  process.on('uncaughtException', onErr);
  try {
    const cfg: Config = { ...structuredClone(DEFAULTS), dataDir: dir, port: 0, snapshotEverySec: 1, auth: { projectId: 'none' } };
    cfg.tunnel = { provider: 'none', bin: { ngrok: '/nonexistent/ngrok' } };
    cfg.ai = { ...cfg.ai, provider: 'none' };
    const app = new App(cfg, { adminToken: ADMIN, viewers: new Map([['imad', VIEW1]]) }, new Logger('error', undefined, true));
    await app.start();
    after(() => app.stop());
    const url = app.net.address().replace('http', 'ws') + '/ws';
    const ws = new WebSocket(url);
    const msgs: ServerMsg[] = [];
    ws.on('message', (d) => msgs.push(decode(d as Buffer) as ServerMsg));
    await new Promise<void>((ok, fail) => { ws.once('open', () => ok()); ws.once('error', fail); });
    const send = (m: ClientMsg) => ws.send(encode(m));
    send({ t: Msg.Hello, v: PROTOCOL_VERSION, token: VIEW1 });
    const until = async (f: (m: ServerMsg) => boolean, ms = 8000) => { const t0 = Date.now(); while (Date.now() - t0 < ms) { const m = msgs.find(f); if (m) return m; await new Promise((r) => setTimeout(r, 50)); } throw new Error('timeout'); };
    await until((m) => m.t === Msg.Welcome);
    send({ t: Msg.Join });
    const you = await until((m) => m.t === Msg.You) as { id: number };
    const w = app.world, e = w.e, i = e.slot(you.id);
    const woods = w.maps.findIndex((m) => m.def.id === 'woods');
    const gate = w.portals.find((p) => p.from === e.map[i] && p.dest === woods)!;
    w.place(i, e.map[i]!, gate.x, gate.y);
    e.stuck[i] = 0; // as if walked in from outside
    const t0 = Date.now();
    let onRoad = false;
    while (Date.now() - t0 < 15000 && e.map[i] !== woods) {
      send({ t: Msg.Input, mx: 0, my: 0 });
      await new Promise((r) => setTimeout(r, 100));
      if (!onRoad && e.map[i] === NO_MAP) { onRoad = true; await new Promise((r) => setTimeout(r, 2500)); const g = w.gate.get(you.id)!; g.shown = true; g.left = 0; } // on the road through a few 'me' notices, then there
    }
    assert.ok(onRoad, 'took the road');
    assert.equal(e.map[i], woods, 'arrived in the woods');
    send({ t: Msg.View, map: 'woods', x: e.x[i]!, y: e.y[i]!, r: 40 });
    // Walk about in the woods for a while, asking what a TV asks.
    for (let k = 0; k < 60; k++) {
      send({ t: Msg.Input, mx: Math.cos(k / 5), my: Math.sin(k / 5), run: true });
      if (k % 10 === 0) for (const a of ['compass', 'map', 'rideTo', 'roster', 'mine']) send({ t: Msg.Do, a, text: '' } as ClientMsg);
      await new Promise((r) => setTimeout(r, 100));
    }
    assert.deepEqual(errs, []);
    const h = await (await fetch(app.net.address() + '/health')).json() as { ok: boolean };
    assert.equal(h.ok, true);
    ws.close();
    await app.stop();
  } finally {
    process.off('uncaughtException', onErr);
    rmSync(dir, { recursive: true, force: true, maxRetries: 10, retryDelay: 200 });
  }
});

test('the road between maps: 5-15 s, counted only once the TV shows the ride', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'ws-'));
  try {
    const cfg: Config = { ...structuredClone(DEFAULTS), dataDir: dir, port: 0, snapshotEverySec: 1, auth: { projectId: 'none' } };
    cfg.tunnel = { provider: 'none', bin: { ngrok: '/nonexistent/ngrok' } };
    cfg.ai = { ...cfg.ai, provider: 'none' };
    const app = new App(cfg, { adminToken: ADMIN, viewers: new Map([['imad', VIEW1]]) }, new Logger('error', undefined, true));
    await app.start();
    after(() => app.stop());
    const ws = new WebSocket(app.net.address().replace('http', 'ws') + '/ws');
    const msgs: ServerMsg[] = [];
    ws.on('message', (d) => msgs.push(decode(d as Buffer) as ServerMsg));
    await new Promise<void>((ok, fail) => { ws.once('open', () => ok()); ws.once('error', fail); });
    const send = (m: ClientMsg) => ws.send(encode(m));
    const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
    const until = async (f: (m: ServerMsg) => boolean, ms = 8000) => { const t0 = Date.now(); while (Date.now() - t0 < ms) { const m = msgs.find(f); if (m) return m; await sleep(50); } throw new Error('timeout'); };
    send({ t: Msg.Hello, v: PROTOCOL_VERSION, token: VIEW1 });
    await until((m) => m.t === Msg.Welcome);
    send({ t: Msg.Join });
    const you = await until((m) => m.t === Msg.You) as { id: number };
    const w = app.world, e = w.e, i = e.slot(you.id);
    const woods = w.maps.findIndex((m) => m.def.id === 'woods');
    const gate = w.portals.find((p) => p.from === e.map[i] && p.dest === woods)!;
    w.place(i, e.map[i]!, gate.x, gate.y);
    e.stuck[i] = 0;
    const road = await until((m) => m.t === Msg.You && (m as { transit: boolean }).transit, 5000) as { secs?: number; left?: number; map: string };
    assert.equal(road.map, 'woods');
    assert.ok(road.secs! >= 5 && road.secs! <= 15, `ride of ${road.secs} s`);
    // The TV has not shown it yet: the clock waits.
    await sleep(2000);
    assert.equal(e.map[i], NO_MAP, 'still on the road');
    assert.equal(w.gateLeft(i)!.left, road.secs, 'nothing counted before the TV shows the ride');
    send({ t: Msg.Do, a: 'rideShown' } as ClientMsg);
    const t0 = Date.now();
    while (e.map[i] !== woods && Date.now() - t0 < 20000) await sleep(50);
    const took = (Date.now() - t0) / 1000;
    assert.equal(e.map[i], woods, 'arrived');
    assert.ok(Math.abs(took - road.secs!) < 1.5, `took ${took.toFixed(1)} s for a ${road.secs} s ride`);
    assert.equal(w.gate.size, 0);
    ws.close();
    await app.stop();
  } finally {
    rmSync(dir, { recursive: true, force: true, maxRetries: 10, retryDelay: 200 });
  }
});
