import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { existsSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Kind } from '@worldsim/protocol';
import { App } from '../app.js';
import { DEFAULTS, type Config } from '../config.js';
import { Logger } from '../log.js';

const ADMIN = 'admin-token-0123456789abcdef';

function makeApp(dataDir: string): App {
  const cfg: Config = { ...structuredClone(DEFAULTS), dataDir, port: 0, snapshotEverySec: 3600, auth: { projectId: 'none' } };
  cfg.tunnel = { provider: 'none', bin: { ngrok: '/nonexistent/ngrok' } };
  cfg.ai = { ...cfg.ai, provider: 'none' };
  return new App(cfg, { adminToken: ADMIN, viewers: new Map(), openaiKey: 'sk-secret-openai-key-123456' }, new Logger('error', undefined, true));
}

const until = async (f: () => boolean, ms = 8000) => { const t = Date.now(); while (!f()) { if (Date.now() - t > ms) throw new Error('timeout'); await new Promise((r) => setTimeout(r, 20)); } };

test('panel AI agent: looks on its own, proposes code, runs it only on the owner\'s Run with a backup, undo restores the database', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'ws-agent-'));
  // A fake Ollama answering the agent's turns in order; it records the prompts it saw.
  const answers: string[] = [];
  const prompts: string[] = [];
  const fake = createServer((req, res) => {
    let b = '';
    req.on('data', (d) => (b += d));
    req.on('end', () => {
      const j = JSON.parse(b) as { messages: { content: string }[] };
      prompts.push(j.messages.map((m) => m.content).join('\n'));
      res.setHeader('content-type', 'application/json');
      res.end(JSON.stringify({ message: { role: 'assistant', content: answers.shift() ?? '{"say":"nothing more"}' } }));
    });
  });
  await new Promise<void>((ok) => fake.listen(0, '127.0.0.1', () => ok()));
  after(() => fake.close());
  try {
    const app = makeApp(dir);
    await app.start();
    let restarted = 0;
    app.onRestartRequest = () => { restarted++; };
    const w = app.world;
    let i = -1;
    for (let k = 0; k < w.e.hi; k++) if (w.e.kind[k] === Kind.Agent) { i = k; break; }
    const p = w.profileOf(i)!, name = p.name, sex0 = p.sex, sex1 = sex0 === 'f' ? 'm' : 'f';

    // Owner only.
    await assert.rejects(app.adminCmd({ cmd: 'coderAsk', text: 'hi' }, 'someone', false), /only the owner/);
    const port = (fake.address() as { port: number }).port;
    const saved = await app.adminCmd({ cmd: 'brainSave', name: 'fake', provider: 'ollama', url: `http://127.0.0.1:${port}`, model: 'fake' }, 'admin', true) as { saved: string };
    await app.adminCmd({ cmd: 'coderBrain', id: saved.saved }, 'admin', true);

    answers.push(
      JSON.stringify({ say: 'Let me look.', peek: `return data.agents.filter(a => a.name === ${JSON.stringify(name)}).map(a => a.sex)`, read: ['.env', 'packages/server/src/sim/people.ts:13-16'], sql: "UPDATE meta SET v = 'x'" }),
      JSON.stringify({ say: 'Changing the sex.', run: `const x = person(${JSON.stringify(name)}); x.p.sex = '${sex1}'; world.setLook(x.i); print('key', 'sk-secret-openai-key-123456'); return x.p.sex;`, why: 'asked' }),
      JSON.stringify({ say: 'Done, it worked.' }),
    );
    await app.adminCmd({ cmd: 'coderAsk', text: `make ${name} the other sex` }, 'admin', true);
    await until(() => !app.agent.busy);
    const v = await app.adminCmd({ cmd: 'coder' }, 'admin', true) as { pending: { id: number; kind: string; code: string; status: string } | null; steps: { role: string; text: string }[] };
    assert.ok(v.pending && v.pending.kind === 'run' && v.pending.status === 'waiting', 'a proposal waits');
    assert.equal(p.sex, sex0, 'nothing changed before Run');
    const look = v.steps.find((s) => s.role === 'look')!.text;
    assert.match(look, new RegExp(`\\[peek\\]\\n\\["${sex0}"\\]`), 'peek saw the copy');
    assert.match(look, /\[read \.env\] not readable/, 'secrets are not readable');
    assert.match(look, /13\| export interface Profile/, 'source is readable');
    assert.match(look, /\[sql\] only one SELECT/, 'sql is read-only');
    assert.match(prompts[1]!, /LOOK RESULT/, 'the model got its look results');

    const r = await app.adminCmd({ cmd: 'coderRun', id: v.pending.id }, 'admin', true) as { proposal: { status: string; result: string; backup: string } };
    assert.equal(r.proposal.status, 'done', r.proposal.result);
    assert.equal(p.sex, sex1, 'the run changed the live world');
    assert.ok(!r.proposal.result.includes('sk-secret-openai'), 'secrets are redacted from results');
    assert.match(r.proposal.result, /=> "?[fm]"?/);
    assert.ok(existsSync(join(dir, 'backups', r.proposal.backup)), 'a database copy was made first');
    await until(() => !app.agent.busy);
    assert.ok(prompts.at(-1)!.includes('ACTION RESULT'), 'the model saw what happened');
    const audit = await app.adminCmd({ cmd: 'coderAudit' }, 'admin', true) as { id: number; status: string; by: string }[];
    assert.equal(audit[0]!.status, 'done');
    assert.equal(audit[0]!.by, 'admin');

    // An edit outside the source is refused before anything is written.
    answers.push(JSON.stringify({ say: 'edit', edit: [{ path: '.env', find: 'A', replace: 'B' }] }));
    await app.adminCmd({ cmd: 'coderAsk', text: 'change .env' }, 'admin', true);
    await until(() => !app.agent.busy);
    const e = app.agent.pending!;
    assert.match(e.result ?? '', /only source files/);
    const er = await app.adminCmd({ cmd: 'coderRun', id: e.id }, 'admin', true) as { proposal: { status: string } };
    assert.equal(er.proposal.status, 'failed');
    await until(() => !app.agent.busy);

    // Server controls.
    const info = await app.adminCmd({ cmd: 'serverInfo' }, 'admin', true) as { pid: number; backups: number };
    assert.equal(info.pid, process.pid);
    assert.ok(info.backups >= 1);
    const logs = await app.adminCmd({ cmd: 'serverLog', lines: 50 }, 'admin', true) as unknown[];
    assert.ok(Array.isArray(logs));
    await assert.rejects(app.adminCmd({ cmd: 'serverRestart' }, 'x', false), /only the owner/);
    await assert.rejects(app.adminCmd({ cmd: 'backupRestore', file: '../../etc/passwd' }, 'admin', true), /no such backup/);

    // Undo the run: the copy made before it comes back at the restart.
    await app.adminCmd({ cmd: 'coderUndo', id: v.pending.id }, 'admin', true);
    await until(() => restarted > 0, 3000);
    assert.ok(existsSync(join(dir, 'restore.json')));
    await app.stop();
    const app2 = makeApp(dir);
    await app2.start();
    after(() => app2.stop());
    const back = [...app2.world.profiles.values()].find((q) => q.name === name)!;
    assert.equal(back.sex, sex0, 'restored to before the run');
    assert.ok(!existsSync(join(dir, 'restore.json')));
    assert.ok((app2.control.backups()).some((b) => b.why === 'before-restore'), 'the replaced database is kept');
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
