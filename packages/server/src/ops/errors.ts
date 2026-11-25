import type { Db } from '../persist/db.js';

/** One kept problem. The same source + message again within 10 minutes only counts up (`n`, `last`): no flood. */
export interface ErrorRow {
  id: number;
  /** First and last time seen (ms). */
  at: number;
  last: number;
  n: number;
  level: 'warn' | 'error';
  /** Where it came from: admin (a panel command), log (the server's own warnings / errors), crash, net, ai... */
  source: string;
  msg: string;
  /** What was going on: the command, who sent it, its fields, the request... (JSON, secrets hidden). */
  ctx: string;
  stack: string;
}

const KEEP = 3000;
const SAME_WINDOW = 10 * 60_000;

/**
 * The server's error log (panel page "Errors"): SQLite table `errors`, kept across restarts, the last 3000 problems.
 * Entries that arrive before the database is open (start up) wait in memory and are written once it is.
 */
export class ErrorLog {
  private db: Db | null = null;
  private early: Omit<ErrorRow, 'id' | 'n' | 'last'>[] = [];
  private writes = 0;
  /** Hides secrets (keys, tokens) in what is kept. */
  redact: (s: string) => string = (s) => s;
  /** Told about every new entry (the panel's live badge). */
  onAdd: (r: ErrorRow) => void = () => {};

  attach(db: Db): void {
    db.sql.exec(`CREATE TABLE IF NOT EXISTS errors (
      id INTEGER PRIMARY KEY AUTOINCREMENT, at INTEGER NOT NULL, last INTEGER NOT NULL, n INTEGER NOT NULL DEFAULT 1,
      level TEXT NOT NULL, source TEXT NOT NULL, msg TEXT NOT NULL, ctx TEXT NOT NULL DEFAULT '', stack TEXT NOT NULL DEFAULT '');
      CREATE INDEX IF NOT EXISTS errors_last ON errors(last);`);
    this.db = db;
    const early = this.early;
    this.early = [];
    for (const e of early) this.write(e);
  }

  detach(): void { this.db = null; }

  add(level: 'warn' | 'error', source: string, msg: string, ctx?: unknown, stack?: string): void {
    const e = {
      at: Date.now(), level, source: source.slice(0, 40), msg: this.redact(String(msg)).slice(0, 2000),
      ctx: ctx === undefined ? '' : this.redact(typeof ctx === 'string' ? ctx : safeJson(ctx)).slice(0, 4000),
      stack: stack ? this.redact(stack).slice(0, 4000) : '',
    };
    if (!this.db) { if (this.early.length < 200) this.early.push(e); return; }
    this.write(e);
  }

  private write(e: Omit<ErrorRow, 'id' | 'n' | 'last'>): void {
    const db = this.db!;
    try {
      const same = db.sql.prepare('SELECT id FROM errors WHERE source = ? AND msg = ? AND last >= ? ORDER BY id DESC LIMIT 1').get(e.source, e.msg, e.at - SAME_WINDOW) as { id: number } | undefined;
      let id: number;
      if (same) {
        db.sql.prepare('UPDATE errors SET n = n + 1, last = ?, ctx = ?, stack = CASE WHEN ? != \'\' THEN ? ELSE stack END, level = CASE WHEN ? = \'error\' THEN \'error\' ELSE level END WHERE id = ?')
          .run(e.at, e.ctx, e.stack, e.stack, e.level, same.id);
        id = same.id;
      } else {
        id = Number(db.sql.prepare('INSERT INTO errors (at, last, n, level, source, msg, ctx, stack) VALUES (?, ?, 1, ?, ?, ?, ?, ?)')
          .run(e.at, e.at, e.level, e.source, e.msg, e.ctx, e.stack).lastInsertRowid);
        if (++this.writes % 100 === 0) db.sql.prepare('DELETE FROM errors WHERE id <= (SELECT MAX(id) FROM errors) - ?').run(KEEP);
      }
      const row = db.sql.prepare('SELECT * FROM errors WHERE id = ?').get(id) as unknown as ErrorRow | undefined;
      if (row) this.onAdd(row);
    } catch { /* the error log must never break the server */ }
  }

  /** Newest first. `since` = only rows seen after that time (ms); `q` = text in the message, source or context. */
  list(o: { limit?: number; source?: string; level?: string; q?: string; since?: number } = {}): { rows: ErrorRow[]; total: number; sources: { source: string; n: number }[] } {
    if (!this.db) return { rows: [], total: 0, sources: [] };
    const where: string[] = [], args: (string | number)[] = [];
    if (o.source) { where.push('source = ?'); args.push(o.source); }
    if (o.level === 'error' || o.level === 'warn') { where.push('level = ?'); args.push(o.level); }
    if (o.q) { where.push('(msg LIKE ? OR ctx LIKE ? OR source LIKE ?)'); const q = `%${o.q}%`; args.push(q, q, q); }
    if (o.since) { where.push('last > ?'); args.push(o.since); }
    const w = where.length ? `WHERE ${where.join(' AND ')}` : '';
    const rows = this.db.sql.prepare(`SELECT * FROM errors ${w} ORDER BY last DESC, id DESC LIMIT ?`).all(...args, Math.max(1, Math.min(1000, o.limit ?? 200))) as unknown as ErrorRow[];
    const total = Number((this.db.sql.prepare(`SELECT COUNT(*) AS c FROM errors ${w}`).get(...args) as { c: number }).c);
    const sources = this.db.sql.prepare('SELECT source, SUM(n) AS n FROM errors GROUP BY source ORDER BY n DESC').all() as unknown as { source: string; n: number }[];
    return { rows, total, sources };
  }

  /** Problems in the last `ms` (counting repeats): the dashboard / nav badge. */
  recentCount(ms = 24 * 3600_000): number {
    if (!this.db) return 0;
    try { return Number((this.db.sql.prepare('SELECT COALESCE(SUM(n), 0) AS c FROM errors WHERE last >= ?').get(Date.now() - ms) as { c: number }).c); } catch { return 0; }
  }

  /** Everything, or one row. */
  clear(id?: number): number {
    if (!this.db) return 0;
    return Number((id !== undefined ? this.db.sql.prepare('DELETE FROM errors WHERE id = ?').run(id) : this.db.sql.prepare('DELETE FROM errors').run()).changes);
  }
}

function safeJson(v: unknown): string {
  try { return JSON.stringify(v, (_k, x) => (typeof x === 'bigint' ? String(x) : x)) ?? ''; } catch { return String(v); }
}
