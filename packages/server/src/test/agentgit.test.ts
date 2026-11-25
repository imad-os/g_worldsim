import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Db } from '../persist/db.js';
import { Agent, type AgentHost } from '../ops/agent.js';
import type { Control } from '../ops/control.js';
import { Logger } from '../log.js';

const git = (cwd: string, ...a: string[]) => execFileSync('git', ['-c', 'user.name=t', '-c', 'user.email=t@t', ...a], { cwd, encoding: 'utf8' }).trim();

test('agent code changes: one git commit each, Revert takes out exactly that change (later ones stay)', async () => {
  const root = mkdtempSync(join(tmpdir(), 'ws-git-'));
  try {
    git(root, 'init', '-q');
    mkdirSync(join(root, 'packages/server/src'), { recursive: true });
    const f = join(root, 'packages/server/src/a.ts');
    writeFileSync(f, 'const A = 1;\nconst gap1 = 0;\nconst gap2 = 0;\nconst gap3 = 0;\nconst B = 1;\n');
    writeFileSync(join(root, 'other.txt'), 'x');
    git(root, 'add', '.'); git(root, 'commit', '-q', '-m', 'start');
    writeFileSync(join(root, 'other.txt'), 'local change, not the agent\'s');
    let builds = 0;
    const control = { dataDir: join(root, 'data'), build: async () => { builds++; return true; }, backup: () => ({ file: 'x' }), scheduleRestore: () => {} } as unknown as Control;
    const host: AgentHost = { ai: () => { throw new Error('no ai'); }, brainName: () => 'none', scope: () => ({}), data: () => ({}), snapshot: () => {}, secrets: () => [] };
    const db = new Db(':memory:');
    const ag = new Agent(root, db, ':memory:', control, host, new Logger('error', undefined, true));
    const propose = (ask: string, find: string, replace: string) => {
      (ag as unknown as { propose: (...a: unknown[]) => void }).propose(ask, 'edit', 'why', undefined, [{ path: 'packages/server/src/a.ts', find, replace }], true);
      return ag.pending!.id;
    };
    const p1 = await ag.execute(propose('make A two', 'const A = 1;', 'const A = 2;'), 'imad');
    assert.equal(p1.status, 'done', p1.result);
    assert.ok(p1.commit, 'traced as a commit');
    assert.match(git(root, 'log', '-1', '--format=%s'), /World agent #1: make A two/);
    assert.equal(git(root, 'show', '--name-only', '--format=', p1.commit!), 'packages/server/src/a.ts', 'only the agent\'s file is in the commit');
    const p2 = await ag.execute(propose('make B two', 'const B = 1;', 'const B = 2;'), 'imad');
    assert.equal(p2.status, 'done');
    // Revert the FIRST change: B = 2 stays.
    const r = await ag.undo(p1.id);
    assert.equal(r.restart, true);
    assert.equal(readFileSync(f, 'utf8'), 'const A = 1;\nconst gap1 = 0;\nconst gap2 = 0;\nconst gap3 = 0;\nconst B = 2;\n');
    assert.match(git(root, 'log', '-1', '--format=%s'), /Revert "World agent #1/);
    assert.equal(ag.get(p1.id)!.status, 'undone');
    assert.ok(ag.get(p1.id)!.revertCommit);
    assert.equal(readFileSync(join(root, 'other.txt'), 'utf8'), 'local change, not the agent\'s', 'other local changes untouched');
    assert.equal(builds, 3);
  } finally { rmSync(root, { recursive: true, force: true }); }
});
