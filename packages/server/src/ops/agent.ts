/**
 * The panel's AI agent (imad 2026-11-25: "an AI agent in the control panel that writes code and executes it to do what the
 * panel was not programmed for: add a new animal, change a player's sex..."). The owner asks in words; the model may LOOK on
 * its own (read source files, search them, read-only SQL, a script on a copy of the world's data in a sandbox) and then
 * PROPOSES one action: `run` = JavaScript inside the live server, or `edit` = changes to the source files, then a rebuild.
 * Nothing changes until the owner presses Run in the panel. Before a run the world is saved and the database copied
 * (undo = restore that copy); before an edit the original files are kept (undo = put them back and rebuild).
 * Every proposal and what came of it is kept in SQLite (`agent_audit`). Secrets never reach the model (`redact`).
 */
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, resolve, sep } from 'node:path';
import vm from 'node:vm';
import { DatabaseSync } from 'node:sqlite';
import { parseJsonReply, type Ai } from '../ai/llm.js';
import type { Db } from '../persist/db.js';
import type { Logger } from '../log.js';
import { run, type Control } from './control.js';

export interface Edit { path: string; find?: string; replace?: string; create?: string }
export interface Step { at: number; role: 'you' | 'agent' | 'look' | 'result' | 'error'; text: string; who?: string; proposal?: number }
export interface Proposal {
  id: number; kind: 'run' | 'edit'; why: string; code?: string; edits?: Edit[]; restart?: boolean;
  status: 'waiting' | 'running' | 'done' | 'failed' | 'cancelled' | 'undone'; result?: string; backup?: string; at: number; by?: string; ask: string;
  /** Edits: the local git commit that holds them (the trace; Revert = git revert of it). */
  commit?: string; revertCommit?: string;
}
export interface AgentHost {
  /** The model the agent thinks with (a separate Ai object: the people's budget is not touched). */
  ai(): Ai;
  brainName(): string;
  /** Values available to run code (world, db, app, admin...). */
  scope(print: (...v: unknown[]) => void): Record<string, unknown>;
  /** A JSON-friendly copy of the world for `peek` scripts. */
  data(): unknown;
  snapshot(): void;
  /** Every secret the server knows (API keys, tokens): replaced by *** in anything sent to the model or the panel. */
  secrets(): string[];
}

const MAX_STEPS = 80, MAX_TURNS = 8, LOOK_CAP = 12_000, PROMPT_CAP = 90_000, RUN_TIMEOUT = 30_000;
/** Never read: secrets, the database, dependencies, built files. */
const DENY = /(^|\/)(\.git|node_modules|data|\.node|dist)(\/|$)|(^|\/)\.env|worldsim\.config\.json$|\.sqlite|(^|\/)docs\/.*\.js$|\.(png|jpe?g|ogg|mp3|wav|ico|glb|woff2?)$/i;
/** Only source may be written by an edit. */
const WRITABLE = /^(packages\/(protocol|server|client|panel)\/src\/|scenarios\/)[\w./ -]+\.(ts|mjs|js|json|css|html|md)$/;
const TEXT = /\.(ts|mjs|js|json|md|css|html|txt|ps1)$/i;

export class Agent {
  steps: Step[] = [];
  pending: Proposal | null = null;
  busy = false;
  phase = '';
  private nextId = 1;
  private files: string[] | null = null;

  constructor(readonly root: string, private readonly db: Db, private readonly dbFile: string, private readonly control: Control,
    private readonly host: AgentHost, private readonly log: Logger) {
    db.sql.exec(`CREATE TABLE IF NOT EXISTS agent_audit (
      id INTEGER PRIMARY KEY, at INTEGER NOT NULL, who TEXT NOT NULL, kind TEXT NOT NULL, ask TEXT NOT NULL, why TEXT NOT NULL,
      code TEXT NOT NULL, status TEXT NOT NULL, result TEXT NOT NULL DEFAULT '', backup TEXT NOT NULL DEFAULT '', ran_at INTEGER)`);
    for (const col of ['git TEXT NOT NULL DEFAULT \'\'', 'revert_git TEXT NOT NULL DEFAULT \'\'']) { try { db.sql.exec(`ALTER TABLE agent_audit ADD COLUMN ${col}`); } catch { /* there */ } }
    const top = db.sql.prepare('SELECT MAX(id) AS m FROM agent_audit').get() as { m: number | null };
    this.nextId = (top.m ?? 0) + 1;
    try { const s = JSON.parse(db.getMeta('agent_chat') ?? '{}') as { steps?: Step[] }; this.steps = s.steps ?? []; } catch { /* fresh */ }
    // A proposal still waiting when the server stopped can still be run: it is in the audit table.
    const w = db.sql.prepare("SELECT * FROM agent_audit WHERE status = 'waiting' ORDER BY id DESC LIMIT 1").get() as Record<string, unknown> | undefined;
    if (w) this.pending = this.fromRow(w);
    db.sql.exec("UPDATE agent_audit SET status = 'failed', result = 'the server stopped while it ran' WHERE status = 'running'");
  }

  view(): Record<string, unknown> {
    return { busy: this.busy, phase: this.phase, brain: this.host.brainName(), steps: this.steps.slice(-MAX_STEPS), pending: this.pending };
  }

  audit(limit = 50): Proposal[] {
    return (this.db.sql.prepare('SELECT * FROM agent_audit ORDER BY id DESC LIMIT ?').all(limit) as Record<string, unknown>[]).map((r) => this.fromRow(r));
  }

  get(id: number): Proposal | null {
    const r = this.db.sql.prepare('SELECT * FROM agent_audit WHERE id = ?').get(id) as Record<string, unknown> | undefined;
    return r ? this.fromRow(r) : null;
  }

  reset(): void {
    if (this.busy) throw new Error('the agent is working: wait for it');
    if (this.pending) this.setStatus(this.pending, 'cancelled', 'conversation cleared');
    this.pending = null; this.steps = []; this.save();
  }

  private fromRow(r: Record<string, unknown>): Proposal {
    const kind = String(r.kind) as Proposal['kind'], code = String(r.code);
    let edits: Edit[] | undefined, restart: boolean | undefined;
    if (kind === 'edit') { try { const j = JSON.parse(code) as { edits: Edit[]; restart?: boolean }; edits = j.edits; restart = j.restart; } catch { edits = []; } }
    return { id: Number(r.id), kind, why: String(r.why), code: kind === 'run' ? code : undefined, edits, restart, status: String(r.status) as Proposal['status'],
      result: String(r.result ?? ''), backup: String(r.backup ?? ''), at: Number(r.at), by: String(r.who), ask: String(r.ask),
      commit: String(r.git ?? '') || undefined, revertCommit: String(r.revert_git ?? '') || undefined };
  }

  private push(role: Step['role'], text: string, extra: Partial<Step> = {}): void {
    this.steps.push({ at: Date.now(), role, text: this.redact(text), ...extra });
    if (this.steps.length > MAX_STEPS) this.steps.splice(0, this.steps.length - MAX_STEPS);
    this.save();
  }

  private save(): void {
    // Looks are long and only useful to the model during one task: the saved chat keeps them short.
    this.db.setMeta('agent_chat', JSON.stringify({ steps: this.steps.map((s) => s.role === 'look' ? { ...s, text: s.text.slice(0, 4000) } : s) }));
  }

  redact(text: string): string {
    let t = String(text ?? '');
    for (const s of this.host.secrets()) if (s && s.length >= 6) t = t.split(s).join('***');
    return t;
  }

  // ------------------------------------------------------------ asking

  /** The owner's words: the model works on them in the background (looks, then proposes or answers). */
  ask(text: string, who: string): void {
    const t = String(text ?? '').trim().slice(0, 4000);
    if (!t) throw new Error('say what you want');
    if (this.busy) throw new Error('the agent is still working on the last request');
    if (this.pending?.status === 'waiting') this.setStatus(this.pending, 'cancelled', 'a new request came');
    this.pending = null;
    this.push('you', t, { who });
    void this.think(t);
  }

  private async think(ask: string): Promise<void> {
    this.busy = true;
    try {
      const ai = this.host.ai();
      for (let turn = 0; turn < MAX_TURNS; turn++) {
        this.phase = turn ? 'looking further…' : 'thinking…';
        const r = await ai.generate({ system: this.system(), prompt: this.transcript(), json: true, maxTokens: 6000, temperature: 0.2 });
        const j = parseJsonReply<Record<string, unknown>>(r.text);
        if (!j || typeof j !== 'object') {
          if (turn === 0 || !this.steps.at(-1)?.text.startsWith('Your last answer was not')) { this.push('look', `Your last answer was not one JSON object. Answer again with JSON only. It began: ${r.text.slice(0, 300)}`); continue; }
          this.push('error', 'The model did not answer with JSON twice. Try again, or pick a stronger brain for the agent.'); break;
        }
        if (typeof j.say === 'string' && j.say.trim()) this.push('agent', j.say.trim().slice(0, 4000));
        const looks: string[] = [];
        if (Array.isArray(j.read)) for (const p of j.read.slice(0, 6)) looks.push(this.read(String(p)));
        if (typeof j.grep === 'string' && j.grep) looks.push(this.grep(j.grep, typeof j.in === 'string' ? j.in : ''));
        if (typeof j.sql === 'string' && j.sql) looks.push(this.sql(j.sql));
        if (typeof j.peek === 'string' && j.peek) looks.push(this.peek(j.peek));
        if (typeof j.run === 'string' && j.run.trim()) { this.propose(ask, 'run', String(j.why ?? j.say ?? ''), j.run, undefined, false); break; }
        if (Array.isArray(j.edit) && j.edit.length) { this.propose(ask, 'edit', String(j.why ?? j.say ?? ''), undefined, j.edit as Edit[], !!j.restart); break; }
        if (!looks.length) break; // an answer, nothing more to do
        this.push('look', looks.join('\n\n'));
      }
    } catch (err) {
      this.push('error', `The model could not answer: ${(err as Error).message ?? err}`);
    } finally {
      this.busy = false; this.phase = '';
    }
  }

  private propose(ask: string, kind: Proposal['kind'], why: string, code: string | undefined, edits: Edit[] | undefined, restart: boolean): void {
    const clean = edits?.slice(0, 20).map((e) => ({ path: String(e.path ?? '').replace(/\\/g, '/').replace(/^\.\//, ''), ...(typeof e.create === 'string' ? { create: e.create } : { find: String(e.find ?? ''), replace: String(e.replace ?? '') }) }));
    const p: Proposal = { id: this.nextId++, kind, why: this.redact(why.slice(0, 2000)), code: code ? this.redact(code).slice(0, 40_000) : undefined, edits: clean, restart, status: 'waiting', at: Date.now(), ask: ask.slice(0, 2000) };
    if (clean) { const bad = clean.map((e) => this.checkEdit(e)).filter(Boolean); if (bad.length) p.result = `Check before running: ${bad.join('; ')}`; }
    this.db.sql.prepare('INSERT INTO agent_audit (id, at, who, kind, ask, why, code, status, result) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)')
      .run(p.id, p.at, 'agent', kind, p.ask, p.why, kind === 'run' ? p.code! : JSON.stringify({ edits: clean, restart }), 'waiting', p.result ?? '');
    this.pending = p;
    this.push('agent', kind === 'run' ? 'I wrote code to run on the live server. Check it, then press Run.' : `I prepared changes to ${clean!.length} file place(s). Check them, then press Apply.`, { proposal: p.id });
  }

  private setStatus(p: Proposal, status: Proposal['status'], result: string, backup?: string): void {
    p.status = status; p.result = this.redact(result).slice(0, 20_000); if (backup !== undefined) p.backup = backup;
    this.db.sql.prepare('UPDATE agent_audit SET status = ?, result = ?, backup = COALESCE(?, backup), ran_at = CASE WHEN ? IN (\'running\') THEN ? ELSE ran_at END WHERE id = ?')
      .run(status, p.result, backup ?? null, status, Date.now(), p.id);
  }

  cancel(id: number): void {
    const p = this.pending;
    if (!p || p.id !== id || p.status !== 'waiting') throw new Error('nothing waiting with that number');
    this.setStatus(p, 'cancelled', 'cancelled by the owner');
    this.pending = null;
    this.push('result', `#${id} cancelled.`);
  }

  // ------------------------------------------------------------ running (owner pressed Run / Apply)

  /** Run the waiting proposal. `code` = the owner's edited version of the code (run proposals). */
  async execute(id: number, who: string, code?: string): Promise<Proposal> {
    const p = this.pending;
    if (!p || p.id !== id || p.status !== 'waiting') throw new Error('nothing waiting with that number');
    if (this.busy) throw new Error('the agent is still thinking');
    if (p.kind === 'run' && typeof code === 'string' && code.trim() && code !== p.code) {
      p.code = code.slice(0, 40_000);
      this.db.sql.prepare('UPDATE agent_audit SET code = ? WHERE id = ?').run(p.code, p.id);
    }
    this.db.sql.prepare('UPDATE agent_audit SET who = ? WHERE id = ?').run(who, p.id);
    p.by = who;
    this.pending = null;
    this.setStatus(p, 'running', '');
    this.busy = true; this.phase = p.kind === 'run' ? 'running…' : 'changing files…';
    try { if (p.kind === 'run') await this.runCode(p); else await this.applyEdits(p); }
    finally { this.busy = false; this.phase = ''; }
    this.log.warn('agent action', { id: p.id, kind: p.kind, who, status: p.status });
    this.push('result', `#${p.id} ${(p.status as string) === 'done' ? 'done' : 'failed'}:\n${p.result}`, { proposal: p.id });
    // The model sees what happened and can say so, or fix a failure with a new proposal.
    void this.think(p.ask);
    return p;
  }

  private async runCode(p: Proposal): Promise<void> {
    let backup = '';
    try {
      this.host.snapshot();
      backup = this.control.backup(`agent-${p.id}`).file;
    } catch (err) { this.setStatus(p, 'failed', `no backup could be made, nothing was run: ${(err as Error).message}`); return; }
    const out: string[] = [];
    const print = (...v: unknown[]) => { if (out.length < 400) out.push(v.map((x) => typeof x === 'string' ? x : safeJson(x)).join(' ')); };
    const scope = this.host.scope(print);
    try {
      const AsyncFunction = Object.getPrototypeOf(async () => {}).constructor as new (...a: string[]) => (...v: unknown[]) => Promise<unknown>;
      const fn = new AsyncFunction(...Object.keys(scope), `"use strict";\n${p.code}`);
      let timer: NodeJS.Timeout | undefined;
      const value = await Promise.race([fn(...Object.values(scope)), new Promise((_, no) => { timer = setTimeout(() => no(new Error(`still running after ${RUN_TIMEOUT / 1000} s (stopped waiting)`)), RUN_TIMEOUT); })]);
      clearTimeout(timer);
      if (value !== undefined) out.push(`=> ${typeof value === 'string' ? value : safeJson(value)}`);
      try { this.host.snapshot(); } catch { /* the next timed save keeps it */ }
      this.setStatus(p, 'done', (out.join('\n') || 'ran, nothing printed') + `\n(database copy before the run: ${backup})`, backup);
    } catch (err) {
      out.push(`Error: ${(err as Error).stack ?? err}`);
      this.setStatus(p, 'failed', out.join('\n') + `\n(database copy before the run: ${backup}; the world may be partly changed: Undo restores the copy)`, backup);
    }
  }

  private editDir(id: number): string { return join(this.control.dataDir, 'agent', `edit-${id}`); }

  private abs(path: string): string {
    const a = resolve(this.root, path), rel = relative(this.root, a).split(sep).join('/');
    if (rel.startsWith('..') || !WRITABLE.test(rel) || DENY.test(rel)) throw new Error(`${path}: only source files under packages/*/src or scenarios can be changed`);
    return a;
  }

  private checkEdit(e: Edit): string {
    try {
      const a = this.abs(e.path);
      if (typeof e.create === 'string') return existsSync(a) ? `${e.path} already exists` : '';
      if (!existsSync(a)) return `${e.path} does not exist`;
      if (!e.find) return `${e.path}: empty "find"`;
      const n = readFileSync(a, 'utf8').split(e.find).length - 1;
      return n === 1 ? '' : `${e.path}: the text to replace is found ${n} times (must be once)`;
    } catch (err) { return (err as Error).message; }
  }

  private async applyEdits(p: Proposal): Promise<void> {
    const edits = p.edits ?? [];
    const problems = edits.map((e) => this.checkEdit(e)).filter(Boolean);
    if (problems.length) { this.setStatus(p, 'failed', `nothing changed: ${problems.join('; ')}`); return; }
    // Keep the originals (null = a new file) to undo.
    const orig: Record<string, string | null> = {};
    for (const e of edits) { const a = this.abs(e.path); if (!(e.path in orig)) orig[e.path] = existsSync(a) ? readFileSync(a, 'utf8') : null; }
    const dir = this.editDir(p.id);
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, 'original.json'), JSON.stringify(orig));
    try {
      for (const e of edits) {
        const a = this.abs(e.path);
        if (typeof e.create === 'string') { mkdirSync(dirname(a), { recursive: true }); writeFileSync(a, e.create); continue; }
        const t = readFileSync(a, 'utf8');
        if (t.split(e.find!).length !== 2) throw new Error(`${e.path}: the text to replace is no longer found exactly once`);
        writeFileSync(a, t.replace(e.find!, () => e.replace ?? ''));
      }
    } catch (err) { this.putBack(orig); this.setStatus(p, 'failed', `nothing kept: ${(err as Error).message}`); return; }
    this.phase = 'building…';
    const out: string[] = [];
    const ok = await this.control.build(out);
    if (!ok) {
      this.putBack(orig);
      const again: string[] = [];
      await this.control.build(again);
      this.setStatus(p, 'failed', `The build failed, the files were put back as they were:\n${tail(out.join('\n'), 6000)}`);
      return;
    }
    // The trace (imad 2026-11-25: "any code changes stay traced and revertable by a button"): one local git commit per change.
    const c = await this.commit(Object.keys(orig), `World agent #${p.id}: ${p.ask.split('\n')[0]!.slice(0, 72)}`, `${p.why}\n\nRun by ${p.by ?? '?'} from the control panel.`);
    if (c.hash) { p.commit = c.hash; this.db.sql.prepare('UPDATE agent_audit SET git = ? WHERE id = ?').run(c.hash, p.id); }
    this.setStatus(p, 'done', `Changed ${Object.keys(orig).join(', ')} and built. ${c.hash ? `Git commit ${c.hash.slice(0, 8)} (Revert undoes exactly this).` : `Not traced in git (${c.why}); Revert puts the kept originals back.`} ${p.restart !== false ? 'Restart the server to use the new code.' : ''}\n${tail(out.join('\n'), 1500)}`);
  }

  private git(args: string[]) {
    return run('git', ['-c', 'user.name=World agent', '-c', 'user.email=agent@worldsim.local', '-c', 'core.autocrlf=false', ...args], this.root, 60_000);
  }

  /** Commit only these files (other local changes are left alone). */
  private async commit(paths: string[], subject: string, body: string): Promise<{ hash?: string; why?: string }> {
    const inside = await this.git(['rev-parse', '--is-inside-work-tree']);
    if (inside.code !== 0) return { why: 'not a git repository' };
    const add = await this.git(['add', '--', ...paths]);
    if (add.code !== 0) return { why: add.out.slice(0, 300) };
    const c = await this.git(['commit', '-q', '-m', subject, '-m', body, '--', ...paths]);
    if (c.code !== 0) return { why: c.out.slice(0, 300) };
    const h = await this.git(['rev-parse', 'HEAD']);
    return h.code === 0 ? { hash: h.out.trim() } : { why: h.out.slice(0, 300) };
  }

  private putBack(orig: Record<string, string | null>): void {
    for (const [path, text] of Object.entries(orig)) {
      const a = this.abs(path);
      if (text === null) rmSync(a, { force: true }); else writeFileSync(a, text);
    }
  }

  /** Undo a finished action: code edits are put back and rebuilt; a run's database copy is restored at a restart (the caller restarts). */
  async undo(id: number): Promise<{ restart: boolean; text: string }> {
    const p = this.get(id);
    if (!p || (p.status !== 'done' && p.status !== 'failed')) throw new Error('only a finished action can be undone');
    if (p.kind === 'edit' && p.commit) {
      // git revert = a new commit that takes out exactly this change, even after later changes (if they touch other lines).
      const r = await this.git(['revert', '--no-edit', p.commit]);
      if (r.code !== 0) {
        await this.git(['revert', '--abort']);
        throw new Error(`git could not revert #${id}: a later change touches the same lines (revert the later one first). ${r.out.slice(0, 300)}`);
      }
      const h = (await this.git(['rev-parse', 'HEAD'])).out.trim();
      const out: string[] = [];
      const ok = await this.control.build(out);
      this.db.sql.prepare('UPDATE agent_audit SET revert_git = ? WHERE id = ?').run(h, id);
      this.setStatus(p, 'undone', `reverted by git commit ${h.slice(0, 8)}${ok ? ', rebuilt' : ', BUT the build failed: ' + tail(out.join('\n'), 3000)}`);
      this.push('result', `#${id} reverted (git ${h.slice(0, 8)}); the server restarts with the old code.`);
      return { restart: ok, text: `reverted (git ${h.slice(0, 8)})${ok ? ', restarting' : ', build failed: not restarted'}` };
    }
    if (p.kind === 'edit') {
      const f = join(this.editDir(id), 'original.json');
      if (!existsSync(f)) throw new Error('the original files of this change are not kept');
      this.putBack(JSON.parse(readFileSync(f, 'utf8')) as Record<string, string | null>);
      const out: string[] = [];
      const ok = await this.control.build(out);
      this.setStatus(p, 'undone', `files put back${ok ? ' and rebuilt' : ', BUT the build failed: ' + tail(out.join('\n'), 3000)}`);
      this.push('result', `#${id} reverted: the files are back as they were; the server restarts with the old code.`);
      return { restart: ok, text: `files put back${ok ? ', restarting' : ', build failed: not restarted'}` };
    }
    if (!p.backup) throw new Error('no database copy was made for this run');
    this.control.scheduleRestore(p.backup);
    this.setStatus(p, 'undone', `database copy ${p.backup} restored at the restart`);
    this.push('result', `#${id} undone: the world goes back to the copy made before it (${p.backup}); the server restarts.`);
    return { restart: true, text: `restoring ${p.backup}` };
  }

  // ------------------------------------------------------------ looking (no confirmation: nothing changes)

  private sourceFiles(): string[] {
    if (this.files) return this.files;
    const out: string[] = [];
    const walk = (d: string) => {
      for (const n of readdirSync(join(this.root, d), { withFileTypes: true })) {
        const rel = d ? `${d}/${n.name}` : n.name;
        if (DENY.test(rel) || n.name.startsWith('.')) continue;
        if (n.isDirectory()) walk(rel); else if (TEXT.test(n.name)) out.push(rel);
      }
    };
    for (const d of ['packages', 'scenarios', 'tools', 'firebase']) if (existsSync(join(this.root, d))) walk(d);
    for (const f of ['CLAUDE.md', 'ARCHITECTURE.md', 'README.md', 'package.json']) if (existsSync(join(this.root, f))) out.push(f);
    this.files = out.sort();
    return this.files;
  }

  /** "path" or "path:from-to" (lines). */
  read(spec: string): string {
    const m = /^(.*?)(?::(\d+)(?:-(\d+))?)?$/.exec(spec.trim())!;
    const path = m[1]!.replace(/\\/g, '/').replace(/^\.\//, '');
    const a = resolve(this.root, path), rel = relative(this.root, a).split(sep).join('/');
    if (rel.startsWith('..') || DENY.test(rel) || !existsSync(a) || statSync(a).isDirectory()) return `[read ${spec}] not readable (missing, or not allowed)`;
    const lines = readFileSync(a, 'utf8').split('\n');
    const from = Math.max(1, Number(m[2] ?? 1)), to = Math.min(lines.length, Number(m[3] ?? (from + 399)));
    const body = lines.slice(from - 1, to).map((l, k) => `${from + k}| ${l}`).join('\n');
    return `[read ${rel} lines ${from}-${to} of ${lines.length}${to < lines.length ? `; ask "${rel}:${to + 1}-${Math.min(lines.length, to + 400)}" for more` : ''}]\n${cap(body)}`;
  }

  grep(pattern: string, under: string): string {
    let re: RegExp;
    try { re = new RegExp(pattern.slice(0, 200), 'i'); } catch { return `[grep ${pattern}] not a valid regular expression`; }
    const hits: string[] = [];
    for (const f of this.sourceFiles()) {
      if (under && !f.startsWith(under)) continue;
      const lines = readFileSync(join(this.root, f), 'utf8').split('\n');
      for (let k = 0; k < lines.length && hits.length < 80; k++) if (re.test(lines[k]!)) hits.push(`${f}:${k + 1}: ${lines[k]!.trim().slice(0, 200)}`);
      if (hits.length >= 80) break;
    }
    return `[grep ${pattern}${under ? ' in ' + under : ''}] ${hits.length} match(es)${hits.length >= 80 ? ' (first 80)' : ''}\n${hits.join('\n')}`;
  }

  sql(q: string): string {
    const s = q.trim().replace(/;+\s*$/, '');
    if (!/^(select|with|pragma\s+table_info|explain)\b/i.test(s) || s.includes(';')) return `[sql] only one SELECT / WITH / PRAGMA table_info (a change must be a "run")`;
    let ro: DatabaseSync | null = null;
    try {
      ro = new DatabaseSync(this.dbFile, { readOnly: true });
      const rows = ro.prepare(s).all() as Record<string, unknown>[];
      const shown = rows.slice(0, 100).map((r) => Object.fromEntries(Object.entries(r).map(([k, v]) => [k, v instanceof Uint8Array ? `<${v.length} bytes>` : typeof v === 'string' && v.length > 400 ? v.slice(0, 400) + '…' : v])));
      return `[sql ${s.slice(0, 200)}] ${rows.length} row(s)${rows.length > 100 ? ' (first 100)' : ''}\n${cap(safeJson(shown))}`;
    } catch (err) { return `[sql] ${(err as Error).message}`; }
    finally { ro?.close(); }
  }

  /** A script on a JSON copy of the world, in a sandbox with a time limit: it can't change anything. */
  peek(code: string): string {
    try {
      const ctx = vm.createContext({ __src: JSON.stringify(this.host.data()) }, { microtaskMode: 'afterEvaluate', codeGeneration: { strings: false, wasm: false } });
      const out = vm.runInContext(`(() => { const data = JSON.parse(__src); const __r = (function (data) { "use strict";\n${code}\n})(data); return JSON.stringify(__r === undefined ? null : __r); })()`, ctx, { timeout: 3000 }) as unknown;
      return `[peek]\n${cap(typeof out === 'string' ? out : String(out))}`;
    } catch (err) { return `[peek] Error: ${(err as Error).message}`; }
  }

  // ------------------------------------------------------------ the prompt

  private system(): string {
    return `You are the operator agent of "World", a headless Node.js + TypeScript simulation server (people, players, animals, zombies, survival) that runs on the owner's PC. The owner talks to you from the control panel and asks for things the panel has no button for.

Answer with ONE JSON object, nothing else. Keys (all optional):
- "say": short text for the owner (their language), what you found or will do.
- "read": ["path", "path:120-300"]  read source files (line numbers shown). "grep": "regex" (+ "in": "packages/server/src") search the source.
- "sql": "SELECT ..." read-only query on the SQLite database (tables meta(k,v), snapshots, events(tick,game_sec,kind,data), agent_audit; most world state lives in memory, not in SQL).
- "peek": "JS function body" runs in a sandbox on a COPY of the world as \`data\` ({ people, agents, overview, maps, meta }); return a value. Use it to look at people / numbers.
- "run": "JS async function body" = code that runs INSIDE the live server after the owner presses Run. Use it for changes to the live world or the database (change a person, a setting, spawn things). Return a value or print(...) to report.
- "edit": [{"path": "...", "find": "exact text, found once", "replace": "new text"} or {"path": "...", "create": "whole new file"}] = source changes for new behaviour or content (a new animal, a new rule...). After Apply the server rebuilds (tsc + client bundle); a restart makes it live. Only packages/*/src/** and scenarios/** can change. Set "restart": true when a restart is needed.
- "why": one or two sentences, why this run / edit does what was asked.
Looking (read / grep / sql / peek) needs no approval and you get the results in the next turn; a "run" or "edit" ends your turn and waits for the owner. Propose at most one run or edit at a time. When you are not sure of a name or a field, look first (CLAUDE.md is the project's notes; read the parts you need). When nothing needs doing, just "say".

Inside "run" code these names exist:
  world: the live World (packages/server/src/sim/world.ts). Entities are columns by slot i: world.e.kind[i] (1 person, 6 player character, 5 zombie, 7 animal, 3 item), world.e.map[i], x[i], y[i], hp[i], hunger[i], thirst[i], tired[i], lonely[i] (0 fine..100), act[i], flags[i]; world.e.hi = slots in use; world.e.id(i) = entity id; world.e.slot(id) = slot (-1 gone).
  world.profiles: Map<entity id, Profile> (name, sex 'f'|'m', born (game s), traits, personality, parents, partner (-1 none), player (a player's name for their character), skin 0-4, inv, rules, mind, xp). world.profileOf(i). After changing sex / skin of a character call world.setLook(i).
  world.maps[m].def.id ('town', 'woods'...), world.mapIndex.get(id) -> m, world.freeSpot(m, x, y), world.spawnAgent(m, x, y), world.remove(i, cause), world.emit(kind, data), world.gameSec.
  world.animals, world.zombies, world.survival, world.life, world.tasks, world.clans, world.brain, world.land (read their files for methods).
  find(name) -> slot of the living person or player character with that name (-1 none); person(name) -> { i, id, p } or null.
  db: db.getMeta(k), db.setMeta(k, v), db.sql.prepare(sql).all(...) / .run(...).  admin(cmd): any control panel command (e.g. admin({ cmd: 'agentSet', id, hp: 100 })).
  app: the whole server (app.planner, app.net, app.snapshot()). print(...values) adds lines to the result.
The world is saved right after a run. Keep code short and safe; never read or print API keys or tokens; never call process.exit.

Source files: ${this.sourceFiles().join(', ')}`;
  }

  /** The conversation for the model: newest last, old look results cut first. */
  private transcript(): string {
    const lines = this.steps.map((s) => {
      const who = s.role === 'you' ? 'OWNER' : s.role === 'agent' ? 'YOU' : s.role === 'look' ? 'LOOK RESULT' : s.role === 'result' ? 'ACTION RESULT' : 'ERROR';
      return `${who}: ${s.text}`;
    });
    let total = lines.reduce((n, l) => n + l.length, 0);
    for (let k = 0; k < lines.length && total > PROMPT_CAP; k++) {
      if (!lines[k]!.startsWith('LOOK RESULT')) continue;
      total -= lines[k]!.length - 60;
      lines[k] = 'LOOK RESULT: (old, cut; look again if needed)';
    }
    if (this.pending?.status === 'waiting') lines.push(`(#${this.pending.id} is waiting for the owner.)`);
    return `${lines.join('\n\n')}\n\nYour next JSON answer:`;
  }
}

function cap(t: string): string { return t.length > LOOK_CAP ? t.slice(0, LOOK_CAP) + `\n… (${t.length - LOOK_CAP} more characters cut: ask a smaller part)` : t; }
function tail(t: string, n: number): string { return t.length > n ? '…' + t.slice(-n) : t; }
function safeJson(v: unknown): string {
  try { return JSON.stringify(v, (_k, x: unknown) => typeof x === 'bigint' ? String(x) : x instanceof Map ? Object.fromEntries(x) : x instanceof Set ? [...x] : ArrayBuffer.isView(x) ? `<${(x as Uint8Array).length} values>` : x) ?? String(v); }
  catch { return String(v); }
}
