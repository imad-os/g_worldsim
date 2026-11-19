import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { generateKeyPairSync } from 'node:crypto';
import { Db } from '../persist/db.js';
import { Snapshots, EventLog } from '../persist/snapshot.js';
import { CloudSync } from '../persist/cloud.js';
import { Logger } from '../log.js';
import { newWorld } from './helpers.js';

test('sqlite snapshots: keep the newest N, a damaged one falls back to the one before', () => {
  const db = new Db(':memory:');
  const s = new Snapshots(db, 3);
  const w = newWorld();
  w.populate();
  const hashes: string[] = [];
  for (let k = 0; k < 5; k++) { for (let t = 0; t < 100; t++) w.step(); s.save(w); hashes.push(w.hash()); }
  assert.equal(s.count(), 3);
  // Corrupt the newest.
  db.sql.prepare('UPDATE snapshots SET data = ? WHERE id = (SELECT MAX(id) FROM snapshots)').run(new Uint8Array([1, 2, 3]));
  const w2 = newWorld();
  const skipped: number[] = [];
  const r = s.loadLatest(w2, (id) => skipped.push(id));
  assert.ok(r);
  assert.equal(skipped.length, 1);
  assert.equal(w2.hash(), hashes[3]);
  const ev = new EventLog(db);
  ev.add(1, 1, 'death', { id: 5 }); ev.add(2, 2, 'travel', { id: 6 });
  assert.equal(ev.flush(), 2);
  assert.equal(ev.recent(10).length, 2);
  db.close();
});

test('cloud: batched commit of changed docs only, daily cap, restore from the cloud copy', async () => {
  const docs = new Map<string, unknown>();
  let commits = 0, tokens = 0;
  const srv = createServer((req, res) => {
    let body = '';
    req.on('data', (c) => (body += c));
    req.on('end', () => {
      if (req.url === '/token') { tokens++; res.end(JSON.stringify({ access_token: 'tok', expires_in: 3600 })); return; }
      assert.equal(req.headers.authorization, 'Bearer tok');
      const base = '/v1/projects/p/databases/(default)/documents';
      if (req.url === `${base}:commit`) {
        commits++;
        for (const wr of JSON.parse(body).writes) docs.set(wr.update.name.split('/documents/')[1], { fields: wr.update.fields });
        res.end('{}'); return;
      }
      const path = decodeURIComponent(req.url!.slice(base.length + 1).split('?')[0]!);
      if (path.endsWith('/chunks')) {
        res.end(JSON.stringify({ documents: [...docs].filter(([k]) => k.startsWith(path + '/')).map(([, v]) => v) })); return;
      }
      const d = docs.get(path);
      if (!d) { res.writeHead(404); res.end(); return; }
      res.end(JSON.stringify(d));
    });
  });
  await new Promise<void>((ok) => srv.listen(0, '127.0.0.1', ok));
  const port = (srv.address() as { port: number }).port;
  const { privateKey } = generateKeyPairSync('rsa', { modulusLength: 2048 });
  const cfg = {
    enabled: true, projectId: 'p', worldId: 'w1', everySec: 300, maxWritesPerDay: 100,
    credentials: { client_email: 'sa@p.iam', private_key: privateKey.export({ type: 'pkcs8', format: 'pem' }).toString() },
    base: `http://127.0.0.1:${port}`, tokenUrl: `http://127.0.0.1:${port}/token`,
  };
  const db = new Db(':memory:');
  const log = new Logger('error', undefined, true);
  const cloud = new CloudSync(db, cfg, log);
  const w = newWorld();
  w.populate();
  for (let t = 0; t < 200; t++) w.step();
  w.maps[0]!.tiles.damage(20, 20, 255); w.maps[0]!.tiles.damage(21, 20, 255);
  const n1 = cloud.collect(w);
  assert.ok(n1 >= 2);
  assert.equal(await cloud.flush(), cloud.pending() === 0 ? n1 : -1);
  assert.equal(commits, 1);
  assert.equal(tokens, 1);
  assert.equal(cloud.collect(w), 0, 'nothing changed -> nothing queued');
  // Daily cap.
  db.setMeta('fs_writes_' + new Date().toISOString().slice(0, 10), '99');
  for (let t = 0; t < 50; t++) w.step();
  cloud.collect(w);
  assert.equal(await cloud.flush(), 0);
  assert.match(cloud.lastError, /cap/);
  db.setMeta('fs_writes_' + new Date().toISOString().slice(0, 10), '0');
  assert.ok((await cloud.flush()) > 0);
  // Restore into a fresh world from the cloud copy only.
  const w2 = newWorld();
  const cloud2 = new CloudSync(new Db(':memory:'), cfg, log);
  assert.equal(await cloud2.restoreInto(w2), true);
  assert.equal(w2.hash(), w.hash());
  srv.close();
});
