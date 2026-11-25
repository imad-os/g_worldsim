import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Kind } from '@worldsim/protocol';
import { App } from '../app.js';
import { DEFAULTS, type Config } from '../config.js';
import { Logger } from '../log.js';

const ADMIN = 'admin-token-0123456789abcdef';

function makeApp(dataDir: string): App {
  const cfg: Config = { ...structuredClone(DEFAULTS), dataDir, port: 0, snapshotEverySec: 3600, capacity: 600, auth: { projectId: 'none' } };
  cfg.tunnel = { provider: 'none', bin: { ngrok: '/nonexistent/ngrok' } };
  cfg.ai = { ...cfg.ai, provider: 'none' };
  return new App(cfg, { adminToken: ADMIN, viewers: new Map() }, new Logger('error', undefined, true));
}

test('a full world still takes new people, animals, zombies and players (food on the ground makes room); kills are counted; a player can be deleted', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'ws-room-'));
  const app = makeApp(dir);
  await app.start();
  after(() => { app.stop(); rmSync(dir, { recursive: true, force: true }); });
  const w = app.world, e = w.e, cmd = (c: object) => app.adminCmd(c as never, 'imad', true);

  // Fill every free slot with berries lying in town (what farms did over weeks on imad's PC).
  const town = w.mapIndex.get('town')!;
  while (e.room > 0) { const j = e.create(Kind.Item, town, 100 + Math.random() * 50, 100 + Math.random() * 50, 0.2); e.sub[j] = 2; }
  assert.equal(e.room, 0);

  const before = e.countKind(Kind.Agent);
  const p = await cmd({ cmd: 'spawn', map: 'town', x: 128, y: 128 }) as { id: number; name: string };
  assert.equal(e.countKind(Kind.Agent), before + 1);
  assert.ok(e.slot(p.id) >= 0 && p.name);

  const a = await cmd({ cmd: 'animals', map: 'town', want: [0, 0, 0, 2, 2], fill: true }) as { filled: { added: number; short?: string }; maps: { id: string; now: number[] }[] };
  assert.equal(a.filled.short, undefined, a.filled.short);
  assert.deepEqual(a.maps.find((m) => m.id === 'town')!.now.slice(3), [2, 2]);

  const z = await cmd({ cmd: 'zombieSpawn', map: 'town', n: 3 }) as unknown[];
  assert.equal(z.length, 3);
  const at = await cmd({ cmd: 'zombieAttack', now: { map: 'town', n: 2, where: 'random' } }) as { ran: { n: number } };
  assert.equal(at.ran.n, 2);

  // The berries are kept at twice the scenario's max from now on.
  w.brain.spawnItems(false);
  let berries = 0;
  for (let i = 0; i < e.hi; i++) if (e.kind[i] === Kind.Item && e.map[i] === town && e.sub[i] === 2) berries++;
  const max = w.brain.life.items.find((x) => x.id === 2)!.spawn.max;
  assert.ok(berries <= max * 2, `${berries} berries`);

  // Kills: an animal hunted, a zombie killed, someone shot, a duel won.
  w.emit('hunt', { id: p.id, animal: 'wolf' }); w.emit('hunt', { id: p.id, animal: 'wolf' }); w.emit('hunt', { id: p.id, animal: 'deer' });
  w.emit('zombie', { how: 'killed', by: p.id }); w.emit('death', { id: 99, cause: 'shot', by: p.id }); w.emit('duelEnd', { winner: p.id });
  assert.deepEqual(w.profiles.get(p.id)!.kills, { animals: { wolf: 2, deer: 1 }, zombies: 1, people: 1, beaten: 1 });
  const row = (await cmd({ cmd: 'agents' }) as { id: number; kills: object }[]).find((x) => x.id === p.id)!;
  assert.deepEqual(row.kills, { animals: 3, zombies: 1, people: 1, beaten: 1 });

  // A player: TV link + character; deleting removes both (and makes a backup first).
  const pend = app.players.request('Kid', 'TV', '1.2.3.4', () => {}, () => {});
  app.players.approve(pend.code);
  app.net.spawnResidents(['Kid']);
  const kid = app.net.residents.get('Kid')!;
  assert.ok(e.slot(kid) >= 0);
  const list = await cmd({ cmd: 'players' }) as { name: string }[];
  assert.ok(list.some((x) => x.name === 'Kid'));
  const d = await cmd({ cmd: 'playerDelete', name: 'kid' }) as { name: string; backup: { file: string }; character: boolean };
  assert.equal(d.name, 'Kid'); assert.ok(d.character); assert.ok(d.backup.file);
  assert.equal(e.slot(kid), -1);
  assert.equal(app.net.residents.has('Kid'), false);
  assert.equal(app.players.has('Kid'), false);
  assert.ok(!(await cmd({ cmd: 'players' }) as { name: string }[]).some((x) => x.name === 'Kid'));
});
