/**
 * Server controls for the panel (imad 2026-11-25: "more server control like restart and many more actions"):
 * process info, the server log, database backups (make / list / restore at the next start / delete), rebuild,
 * update from GitHub, restart. Long jobs (build, update) run in child processes and report through `job`.
 */
import { execFile } from 'node:child_process';
import { copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync, renameSync, rmSync, statSync, unlinkSync, writeFileSync, openSync, readSync, closeSync } from 'node:fs';
import { basename, dirname, join } from 'node:path';
import type { Db } from '../persist/db.js';
import type { Logger } from '../log.js';

export interface BackupInfo { file: string; bytes: number; at: number; why: string }
export interface Job { what: 'build' | 'update'; state: 'running' | 'done' | 'failed'; log: string; at: number; end?: number; before?: string; after?: string }
/** data/deploy.json: the last build / deploy job (it outlives the restart) and how the restart went (written by tools/relaunch.mjs). */
export interface Deploy {
  job?: Job;
  restart?: { at: number; why: string; state: 'asked' | 'stopping' | 'starting' | 'up' | 'rolledBack' | 'failed'; log?: string; end?: number; pid?: number; from?: string; to?: string; who?: string };
}

const KEEP = 15;
const SAFE_NAME = /^[\w.-]+\.sqlite$/;

/** Run a program, collect its output (never throws: code -1 = could not start). */
export function run(cmd: string, args: string[], cwd: string, timeoutMs = 300_000): Promise<{ code: number; out: string }> {
  return new Promise((ok) => {
    execFile(cmd, args, { cwd, timeout: timeoutMs, maxBuffer: 8e6, windowsHide: true }, (err, stdout, stderr) => {
      const out = `${stdout ?? ''}${stderr ?? ''}`.trim();
      ok({ code: err ? (typeof (err as { code?: unknown }).code === 'number' ? (err as { code: number }).code : -1) : 0, out: err && !out ? String(err.message) : out });
    });
  });
}

export class Control {
  job: Job | null = null;
  readonly backupDir: string;

  constructor(readonly root: string, readonly dataDir: string, readonly dbFile: string, private readonly db: () => Db, private readonly log: Logger) {
    this.backupDir = join(dataDir, 'backups');
  }

  // ------------------------------------------------------------ backups

  /** A full copy of the world database (VACUUM INTO: consistent while the server runs). */
  backup(why: string): BackupInfo {
    mkdirSync(this.backupDir, { recursive: true });
    const stamp = new Date().toISOString().replace(/[:T]/g, '-').replace(/\..+$/, '');
    const tag = why.replace(/[^\w-]+/g, '-').slice(0, 30) || 'manual';
    let file = `${stamp}_${tag}.sqlite`;
    for (let k = 2; existsSync(join(this.backupDir, file)); k++) file = `${stamp}_${tag}-${k}.sqlite`;
    const path = join(this.backupDir, file);
    this.db().sql.exec(`VACUUM INTO '${path.replace(/'/g, "''")}'`);
    this.prune();
    this.log.info('database backup', { file, why });
    return { file, bytes: statSync(path).size, at: Date.now(), why: tag };
  }

  backups(): BackupInfo[] {
    if (!existsSync(this.backupDir)) return [];
    return readdirSync(this.backupDir).filter((f) => SAFE_NAME.test(f)).map((f) => {
      const st = statSync(join(this.backupDir, f));
      return { file: f, bytes: st.size, at: st.mtimeMs, why: f.replace(/^[\d-]+_/, '').replace(/\.sqlite$/, '') };
    }).sort((a, b) => b.at - a.at);
  }

  private prune(): void {
    // Copies made before a restore are kept apart from the count (they are the way back).
    for (const b of this.backups().filter((x) => !x.why.startsWith('before-restore')).slice(KEEP)) rmSync(join(this.backupDir, b.file), { force: true });
  }

  private checkName(file: string): string {
    const f = basename(String(file ?? ''));
    if (!SAFE_NAME.test(f) || f !== file || !existsSync(join(this.backupDir, f))) throw new Error('no such backup');
    return f;
  }

  deleteBackup(file: string): void { rmSync(join(this.backupDir, this.checkName(file)), { force: true }); }

  /** The database is open: the copy is put in place at the next start (then the caller restarts). */
  scheduleRestore(file: string): void {
    const f = this.checkName(file);
    writeFileSync(join(this.dataDir, 'restore.json'), JSON.stringify({ file: f, at: Date.now() }));
    this.log.warn('restore scheduled for the next start', { file: f });
  }

  /** At start, before the database opens: a scheduled restore replaces it (the current one is kept as a backup). */
  static applyPendingRestore(dataDir: string, dbFile: string, log: Logger): string | null {
    const flag = join(dataDir, 'restore.json');
    if (!existsSync(flag)) return null;
    let file = '';
    try { file = String((JSON.parse(readFileSync(flag, 'utf8')) as { file?: string }).file ?? ''); } catch { /* broken flag */ }
    unlinkSync(flag);
    const src = join(dataDir, 'backups', basename(file));
    if (!SAFE_NAME.test(basename(file)) || !existsSync(src)) { log.warn('restore skipped: backup not found', { file }); return null; }
    if (existsSync(dbFile)) {
      const stamp = new Date().toISOString().replace(/[:T]/g, '-').replace(/\..+$/, '');
      renameSync(dbFile, join(dataDir, 'backups', `${stamp}_before-restore.sqlite`));
    }
    for (const x of ['-wal', '-shm']) rmSync(dbFile + x, { force: true });
    mkdirSync(dirname(dbFile), { recursive: true });
    copyFileSync(src, dbFile);
    log.warn('database restored from a backup', { file });
    return file;
  }

  // ------------------------------------------------------------ the last deploy and restart

  get deployFile(): string { return join(this.dataDir, 'deploy.json'); }
  lastDeploy(): Deploy | null {
    try { return JSON.parse(readFileSync(this.deployFile, 'utf8')) as Deploy; } catch { return null; }
  }
  private saveDeploy(d: Deploy): void {
    try { mkdirSync(this.dataDir, { recursive: true }); writeFileSync(this.deployFile, JSON.stringify(d, null, 1)); } catch (err) { this.log.warn('deploy.json not written', { err: String(err) }); }
  }
  /** A restart is on its way (the helper fills in the rest). A restart with no job of its own clears the old job's lines. */
  noteRestart(why: string, who: string): void {
    const job = this.job && this.job.end && Date.now() - this.job.end < 60_000 ? this.job : undefined;
    this.saveDeploy({ job, restart: { at: Date.now(), why: `${why} by ${who}`, state: 'asked', who } });
  }

  // ------------------------------------------------------------ info and log

  async info(): Promise<Record<string, unknown>> {
    const git = async (...a: string[]) => { const r = await run('git', a, this.root, 10_000); return r.code === 0 ? r.out : ''; };
    const [commit, branch, changes, subject] = await Promise.all([git('rev-parse', '--short', 'HEAD'), git('rev-parse', '--abbrev-ref', 'HEAD'), git('status', '--porcelain'), git('log', '-1', '--format=%s (%cr)')]);
    const size = (f: string) => { try { return statSync(f).size; } catch { return 0; } };
    const m = process.memoryUsage();
    return {
      pid: process.pid, node: process.version, platform: `${process.platform} ${process.arch}`, root: this.root,
      uptimeSec: Math.round(process.uptime()), rssMb: Math.round(m.rss / 1e6), heapMb: Math.round(m.heapUsed / 1e6),
      dbBytes: size(this.dbFile) + size(this.dbFile + '-wal'), backups: this.backups().length,
      git: { commit, branch, subject, changed: changes ? changes.split('\n').filter(Boolean).map((l) => l.trim().replace(/^\S+\s+/, '')) : [] },
      job: this.job, lastDeploy: this.lastDeploy(), restorePending: existsSync(join(this.dataDir, 'restore.json')),
    };
  }

  /** The last lines of the server log file (JSON lines), newest last; level = at least that level. */
  logTail(lines: number, level: string, recent: string[]): { t: string; level: string; msg: string; data: string }[] {
    const file = join(this.dataDir, 'server.log');
    let text = '';
    if (existsSync(file)) {
      const fd = openSync(file, 'r');
      try {
        const len = statSync(file).size, n = Math.min(len, 512 * 1024), buf = Buffer.alloc(n);
        readSync(fd, buf, 0, n, len - n);
        text = buf.toString('utf8');
      } finally { closeSync(fd); }
    } else text = recent.join('\n');
    const order: Record<string, number> = { debug: 0, info: 1, warn: 2, error: 3 }, min = order[level] ?? 0;
    const out: { t: string; level: string; msg: string; data: string }[] = [];
    for (const l of text.split('\n')) {
      if (!l.startsWith('{')) continue;
      try {
        const { t, level: lv, msg, ...rest } = JSON.parse(l) as Record<string, unknown>;
        if ((order[String(lv)] ?? 0) < min) continue;
        out.push({ t: String(t), level: String(lv), msg: String(msg), data: Object.keys(rest).length ? JSON.stringify(rest).slice(0, 600) : '' });
      } catch { /* a cut line */ }
    }
    return out.slice(-lines);
  }

  // ------------------------------------------------------------ build and update

  private npmCli(): string | null {
    const d = dirname(process.execPath);
    for (const p of [join(d, 'node_modules/npm/bin/npm-cli.js'), join(d, '../lib/node_modules/npm/bin/npm-cli.js')]) if (existsSync(p)) return p;
    return null;
  }

  /** The same steps as `npm run build`, with this Node (the PC's portable one). */
  async build(out: string[]): Promise<boolean> {
    const tsc = join(this.root, 'node_modules/typescript/bin/tsc');
    const a = await run(process.execPath, [tsc, '-b', 'packages/protocol', 'packages/server'], this.root);
    out.push(`$ tsc -b packages/protocol packages/server (exit ${a.code})`, a.out);
    if (a.code !== 0) return false;
    // The server's own check at start (fresh.ts) compares the sources with this stamp: written, it does not compile again.
    try { writeFileSync(join(this.root, 'packages', 'server', 'dist', '.built'), new Date().toISOString()); } catch { /* ok */ }
    const b = await run(process.execPath, ['tools/build-client.mjs'], this.root);
    out.push(`$ node tools/build-client.mjs (exit ${b.code})`, b.out);
    return b.code === 0;
  }

  /** Start a build or an update (git pull --ff-only, npm install when the lock file changed, build) in the background. */
  startJob(what: Job['what'], then: (ok: boolean) => void): Job {
    if (this.job?.state === 'running') throw new Error(`a ${this.job.what} is already running`);
    const job: Job = { what, state: 'running', log: '', at: Date.now() };
    this.job = job;
    const out: string[] = [];
    const flush = () => { job.log = out.filter(Boolean).join('\n').slice(-20000); };
    void (async () => {
      try {
        if (what === 'update') {
          const before = (await run('git', ['rev-parse', 'HEAD'], this.root, 10_000)).out;
          if (/^[0-9a-f]{7,40}$/.test(before)) job.before = before;
          // Built bundles (docs/) are made again below: their local copies never block the pull. Changes the panel's agent
          // committed locally are replayed on top of GitHub's (rebase); a conflict stops and leaves everything as it was.
          await run('git', ['checkout', '--', 'docs'], this.root, 30_000);
          const p = await run('git', ['-c', 'user.name=World agent', '-c', 'user.email=agent@worldsim.local', 'pull', '--rebase', '--autostash'], this.root, 120_000);
          out.push(`$ git pull --rebase --autostash (exit ${p.code})`, p.out); flush();
          job.after = (await run('git', ['rev-parse', 'HEAD'], this.root, 10_000)).out;
          if (p.code === 0) out.push(job.after === before ? 'already up to date: nothing new on GitHub' : `code ${before.slice(0, 7)} -> ${job.after.slice(0, 7)}`);
          if (p.code !== 0) { const ab = await run('git', ['rebase', '--abort'], this.root, 30_000); out.push(ab.code === 0 ? 'rebase aborted: nothing changed' : ''); throw new Error('git pull failed'); }
          const lock = await run('git', ['diff', '--name-only', before, 'HEAD', '--', 'package-lock.json', 'package.json', 'packages/*/package.json'], this.root, 10_000);
          if (lock.out.trim()) {
            const npm = this.npmCli();
            if (!npm) out.push('package files changed but npm was not found next to node: run npm install by hand');
            else { const i = await run(process.execPath, [npm, 'install', '--no-audit', '--no-fund'], this.root, 300_000); out.push(`$ npm install (exit ${i.code})`, i.out); if (i.code !== 0) throw new Error('npm install failed'); }
            flush();
          }
        }
        const ok = await this.build(out);
        flush();
        if (!ok) throw new Error('build failed');
        job.state = 'done';
      } catch (err) {
        out.push(String((err as Error).message ?? err));
        job.state = 'failed';
      }
      flush();
      job.end = Date.now();
      this.saveDeploy({ job });
      if (job.state === 'failed') this.log.warn(`${what === 'update' ? 'deploy' : 'rebuild'} failed: the server keeps running the old code`, { log: job.log.slice(-1500) });
      else this.log.info(`${what} ${job.state}`);
      then(job.state === 'done');
    })();
    return job;
  }
}
