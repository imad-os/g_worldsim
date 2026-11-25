import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { WebSocket } from 'ws';
import { Msg, PROTOCOL_VERSION, encode, decode, type ServerMsg, type AdminCmd, type ServerBuild } from '@worldsim/protocol';
import { App } from '../app.js';
import { DEFAULTS, type Config } from '../config.js';
import { Logger } from '../log.js';

const ADMIN = 'admin-token-0123456789abcdef';

function makeApp(dataDir: string): App {
  const cfg: Config = { ...structuredClone(DEFAULTS), dataDir, port: 0, snapshotEverySec: 3600, auth: { projectId: 'none' } };
  cfg.tunnel = { provider: 'none', bin: { ngrok: '/nonexistent/ngrok' } };
  cfg.ai = { ...cfg.ai, provider: 'none' };
  return new App(cfg, { adminToken: ADMIN, viewers: new Map() }, new Logger('error', undefined, true));
}

const fails = async (p: Promise<unknown>) => { try { await p; } catch (e) { return String((e as Error).message); } throw new Error('did not fail'); };

test('error log: failed commands, warnings and crashes are kept across restarts; an unknown command names itself and the build', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'ws-err-'));
  try {
    let app = makeApp(dir);
    await app.start();
    after(() => app.stop());
    // The running build lists every command, the new ones too.
    for (const c of ['errors', 'errorsClear', 'serverInfo', 'coder', 'brainFallback', 'agentSet', 'me', 'speed']) assert.ok(app.build.cmds.includes(c), c);

    // The admin token is not an account: its "me" says so instead of failing.
    assert.equal((await app.adminCmd({ cmd: 'me' }, 'admin', true) as { token?: boolean }).token, true);
    // An unknown command says which one and that the server is older than the panel; it is kept as an error.
    const m = await fails(app.adminCmd({ cmd: 'notACommand' } as unknown as AdminCmd, 'imad', true));
    assert.match(m, /^unknown command "notACommand": this server runs/);
    // A bad value = a warning with the command, who and the values; the same again only counts up.
    for (let k = 0; k < 3; k++) await fails(app.adminCmd({ cmd: 'remove', id: -5 } as AdminCmd, 'imad', true));
    // "Are you sure?" answers are not errors.
    assert.match(await fails(app.adminCmd({ cmd: 'speed', speed: 5000 } as AdminCmd, 'imad', true)), /^confirm: /);
    app.log.error('snapshot failed', { err: 'Error: disk full\n    at write (x.js:1:1)' });
    app.log.warn('restarting'); // only says what happened: not kept

    let r = await app.adminCmd({ cmd: 'errors' }, 'imad', true) as { rows: { level: string; source: string; msg: string; n: number; ctx: string; stack: string }[]; total: number; sources: { source: string }[] };
    assert.equal(r.total, 3, JSON.stringify(r.rows.map((x) => x.msg)));
    const unknown = r.rows.find((x) => x.msg.startsWith('notACommand'))!;
    assert.equal(unknown.level, 'error'); assert.equal(unknown.source, 'admin');
    const bad = r.rows.find((x) => x.msg.startsWith('remove'))!;
    assert.equal(bad.level, 'warn'); assert.equal(bad.n, 3);
    assert.deepEqual(JSON.parse(bad.ctx), { cmd: 'remove', who: 'imad', args: { id: -5 } });
    const snap = r.rows.find((x) => x.source === 'save')!;
    assert.equal(snap.msg, 'snapshot failed: Error: disk full'); assert.match(snap.stack, /at write/);
    assert.equal((await app.adminCmd({ cmd: 'errors', source: 'admin', level: 'warn' }, 'imad', true) as { rows: unknown[] }).rows.length, 1);

    // The panel learns the build and the commands in the admin welcome.
    const ws = new WebSocket(app.net.address().replace('http', 'ws') + '/ws');
    const welcome = new Promise<ServerMsg>((ok) => ws.on('message', (d) => { const x = decode(d as Buffer) as ServerMsg; if (x.t === Msg.Welcome) ok(x); }));
    await new Promise((ok) => ws.once('open', ok));
    ws.send(encode({ t: Msg.Hello, v: PROTOCOL_VERSION, token: ADMIN }));
    const b = (await welcome as { build?: ServerBuild }).build!;
    assert.ok(b.cmds.includes('errors') && b.started > 0 && b.errors24h >= 5, JSON.stringify({ ...b, cmds: b.cmds.length }));
    ws.close();

    // Kept across a restart; clear one, then all.
    await app.stop();
    app = makeApp(dir);
    await app.start();
    r = await app.adminCmd({ cmd: 'errors' }, 'imad', true) as typeof r;
    assert.equal(r.total, 3);
    await app.adminCmd({ cmd: 'errorsClear', id: (r.rows[0] as unknown as { id: number }).id }, 'imad', true);
    assert.equal((await app.adminCmd({ cmd: 'errors' }, 'imad', true) as typeof r).total, 2);
    await app.adminCmd({ cmd: 'errorsClear' }, 'imad', true);
    assert.equal((await app.adminCmd({ cmd: 'errors' }, 'imad', true) as typeof r).total, 0);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});
