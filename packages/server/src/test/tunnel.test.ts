import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { TunnelManager, type Tunnel, type TunnelStatus } from '../tunnel.js';
import { Logger } from '../log.js';

/** A stand-in tunnel whose public address is a local server that can be switched off (like ERR_NGROK_3200). */
test('tunnel watchdog restarts a tunnel whose public address stops answering', async () => {
  let up = true;
  const srv = createServer((req, res) => {
    if (!up) { res.writeHead(404, { 'content-type': 'text/plain' }); res.end('ERR_NGROK_3200 endpoint offline'); return; }
    res.writeHead(200, { 'content-type': 'application/json' }); res.end('{"ok":true}');
  });
  await new Promise<void>((r) => srv.listen(0, '127.0.0.1', r));
  after(() => { srv.closeAllConnections(); srv.close(); });
  const url = `http://127.0.0.1:${(srv.address() as { port: number }).port}`;
  let starts = 0, stops = 0;
  const fake: Tunnel = {
    name: 'ngrok',
    async start() { starts++; up = true; }, // a fresh start brings the endpoint back
    async stop() { stops++; },
    status(): TunnelStatus { return { provider: 'ngrok', state: 'up', url }; },
    publicUrl: () => url,
  };
  const m = new TunnelManager({ port: 0 }, new Logger('error', undefined, true), 'none');
  m.current = fake;
  m.watchFails = 2;
  assert.equal(await m.check(), true);
  up = false;
  assert.equal(await m.check(), false);
  assert.equal(stops, 0, 'one miss is not enough');
  assert.equal(await m.check(), false);
  assert.equal(stops, 1, 'restarted after two misses');
  assert.equal(starts, 1);
  assert.equal(await m.check(), true, 'answers again after the restart');
  assert.deepEqual([m.status().check?.ok, m.status().check?.restarts, m.status().check?.fails], [true, 1, 0]);

  // The timer runs by itself and stops with the manager.
  m.watchEveryMs = 50;
  await m.start();
  up = false;
  await new Promise((r) => setTimeout(r, 400));
  assert.ok(starts >= 3, `watchdog restarted on its own (${starts})`);
  await m.stop();
});

/** imad 2026-11-27: the live switch to cloudflare-quick said "does not answer" on Windows (a new name, cached as missing). */
test('a brand-new tunnel address is given time and asked through public DNS, else the PC lookup', async () => {
  const srv = createServer((_req, res) => { res.writeHead(200, { 'content-type': 'application/json' }); res.end('{"ok":true}'); });
  await new Promise<void>((r) => srv.listen(0, '127.0.0.1', r));
  after(() => { srv.closeAllConnections(); srv.close(); });
  const port = (srv.address() as { port: number }).port;
  const { askHealth } = await import('../tunnel.js');
  assert.equal(await askHealth(`http://127.0.0.1:${port}`, 3000), true);
  assert.equal(await askHealth(`http://localhost:${port}`, 6000), true, 'a name public DNS does not know falls back to the PC lookup');
  assert.equal(await askHealth('http://127.0.0.1:1', 2000), false);
  const m = new TunnelManager({ port: 0 }, new Logger('error', undefined, true), 'none');
  m.firstWaitMs = 300;
  const t0 = Date.now();
  assert.equal(await m.healthy(`http://127.0.0.1:${port}`, true), true);
  assert.ok(Date.now() - t0 >= 290, 'waited before the first check');
});
