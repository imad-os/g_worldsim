import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import type { AddressInfo } from 'node:net';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { WebSocket } from 'ws';
import { Msg, PROTOCOL_VERSION, encode, decode, type ServerMsg, type ClientMsg } from '@worldsim/protocol';
import { BrainStats, Failover } from '../ai/brainstats.js';
import { App } from '../app.js';
import { DEFAULTS, type Config } from '../config.js';
import { Logger } from '../log.js';

const H = 3_600_000;

test('brain stats: calls and errors in the last 24 h, 7 days and lifetime, kept in the database', () => {
  let stored: string | undefined;
  const st = new BrainStats(() => stored, (j) => { stored = j; });
  const now = Date.UTC(2026, 10, 25, 12);
  st.record('b1', true, '', now - 10 * 24 * H); // 10 days ago: lifetime only
  st.record('b1', false, 'old error', now - 3 * 24 * H); // 3 days ago: week + lifetime
  st.record('b1', true, '', now - 2 * H);
  st.record('b1', false, 'HTTP 500', now - H);
  st.record('b2', true, '', now);
  st.flush();
  const v = new BrainStats(() => stored, () => {}).view('b1', now);
  assert.deepEqual(v.day, { calls: 2, errors: 1 });
  assert.deepEqual(v.week, { calls: 3, errors: 2 });
  assert.deepEqual(v.life, { calls: 4, errors: 2 });
  assert.equal(v.lastError, 'HTTP 500');
  assert.deepEqual(st.view('nobody', now).life, { calls: 0, errors: 0 });
  st.drop('b1');
  assert.equal(st.view('b1', now).life.calls, 0);
});

test('failover: 3 errors in a row switch for 30 minutes, a success in between starts the count again', () => {
  const f = new Failover();
  const t = 1_000_000;
  assert.equal(f.result(false, 'x', t), false);
  assert.equal(f.result(false, 'x', t), false);
  assert.equal(f.result(true, '', t), false, 'a success resets the streak');
  assert.equal(f.result(false, 'a', t), false);
  assert.equal(f.result(false, 'b', t), false);
  assert.equal(f.result(false, 'c', t), true, 'third error in a row');
  assert.ok(f.on(t + 29 * 60_000));
  assert.equal(f.expired(t + 29 * 60_000), false);
  assert.equal(f.expired(t + 30 * 60_000), true);
  assert.equal(f.on(t + 30 * 60_000), false);
  assert.equal(f.expired(t + 31 * 60_000), false, 'only once');
});

test('brains: the brain in use failing 3 times hands over to the fallback for 30 min, then comes back; stats per brain', async () => {
  const fake = createServer((req, res) => {
    let b = ''; req.on('data', (c) => (b += c));
    req.on('end', () => {
      res.setHeader('content-type', 'application/json');
      if (req.url!.endsWith('/api/tags')) return res.end(JSON.stringify({ models: [{ name: 'llama3.2:latest', size: 2e9 }] }));
      if (req.url === '/good/api/chat') return res.end(JSON.stringify({ message: { content: 'hello from the fallback' } }));
      res.statusCode = 500; res.end(JSON.stringify({ error: 'model crashed' }));
    });
  });
  await new Promise<void>((ok) => fake.listen(0, '127.0.0.1', ok));
  const base = `http://127.0.0.1:${(fake.address() as AddressInfo).port}`;
  const dir = mkdtempSync(join(tmpdir(), 'ws-'));
  const cfg: Config = { ...structuredClone(DEFAULTS), dataDir: dir, port: 0, snapshotEverySec: 1, auth: { projectId: 'none' } };
  cfg.tunnel = { provider: 'none', bin: { ngrok: '/nonexistent/ngrok' } };
  cfg.ai = { ...cfg.ai, provider: 'none' };
  const app = new App(cfg, { adminToken: 'admin-token-0123456789abcdef', viewers: new Map() }, new Logger('error', undefined, true));
  await app.start();
  after(async () => { await app.stop(); fake.close(); rmSync(dir, { recursive: true, force: true }); });
  const ws = new WebSocket(app.net.address().replace('http', 'ws') + '/ws');
  const msgs: ServerMsg[] = [];
  ws.on('message', (d) => msgs.push(decode(d as Buffer) as ServerMsg));
  await new Promise((ok) => ws.once('open', ok));
  ws.send(encode({ t: Msg.Hello, v: PROTOCOL_VERSION, token: 'admin-token-0123456789abcdef' }));
  for (let k = 0; k < 200 && !msgs.some((m) => m.t === Msg.Welcome); k++) await new Promise((ok) => setTimeout(ok, 25));
  let n = 0;
  const admin = async (c: Record<string, unknown>): Promise<any> => {
    const id = ++n;
    ws.send(encode({ t: Msg.Admin, id, c } as ClientMsg));
    for (let k = 0; k < 400; k++) {
      const r = msgs.find((m) => m.t === Msg.AdminResult && (m as { id: number }).id === id) as { ok: boolean; data: any; err?: string } | undefined;
      if (r) { if (!r.ok) throw new Error(r.err); return r.data; }
      await new Promise((ok) => setTimeout(ok, 25));
    }
    throw new Error('no answer');
  };
  // b1 (in use) is broken, b2 works.
  await admin({ cmd: 'brainSave', id: 'b1', name: 'Broken', provider: 'ollama', url: base + '/bad', model: 'llama3.2' });
  const b2 = (await admin({ cmd: 'brainSave', name: 'Good', provider: 'ollama', url: base + '/good', model: 'llama3.2' })).saved;
  await assert.rejects(admin({ cmd: 'brainFallback', id: 'b1' }), /own fallback/);
  let v = await admin({ cmd: 'brainFallback', id: b2 });
  assert.equal(v.fallback, b2);
  for (let k = 0; k < 3; k++) await assert.rejects(admin({ cmd: 'aiTest' }), /500/);
  v = await admin({ cmd: 'brains' });
  assert.equal(v.failover.on, true); assert.equal(v.failover.brain, b2);
  assert.ok(v.failover.until - Date.now() > 29 * 60_000);
  assert.match(v.failover.reason, /model crashed/);
  assert.equal(v.active, 'b1', 'the brain in use stays the default');
  assert.equal((await admin({ cmd: 'aiTest' })).text, 'hello from the fallback');
  v = await admin({ cmd: 'brains' });
  const s1 = v.list.find((b: any) => b.id === 'b1').stats, s2 = v.list.find((b: any) => b.id === b2).stats;
  assert.deepEqual([s1.day, s1.week, s1.life], [{ calls: 3, errors: 3 }, { calls: 3, errors: 3 }, { calls: 3, errors: 3 }]);
  assert.deepEqual(s2.life, { calls: 1, errors: 0 });
  // 30 minutes later: back to the default.
  app.failover.until = Date.now() - 1;
  (app as unknown as { fallbackCheck(): void }).fallbackCheck();
  v = await admin({ cmd: 'brains' });
  assert.equal(v.failover.on, false);
  await assert.rejects(admin({ cmd: 'aiTest' }), /500/, 'the default answers again');
  // Stats are saved in the database.
  app.brainStats.flush();
  assert.equal(JSON.parse(app.db.getMeta('brain_stats')!).b1.c, 4);
  // No fallback: errors never switch.
  await admin({ cmd: 'brainFallback', id: '' });
  for (let k = 0; k < 4; k++) await assert.rejects(admin({ cmd: 'aiTest' }), /500/);
  assert.equal((await admin({ cmd: 'brains' })).failover.on, false);
  ws.close();
});
