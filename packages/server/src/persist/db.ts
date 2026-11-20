import { DatabaseSync } from 'node:sqlite';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';

/**
 * Local SQLite store (Node's built-in `node:sqlite`, no native module to compile). WAL mode:
 * a crash or power cut never leaves a half-written snapshot, and writes do not block readers.
 */
export class Db {
  readonly sql: DatabaseSync;

  constructor(path: string) {
    if (path !== ':memory:') mkdirSync(dirname(path), { recursive: true });
    this.sql = new DatabaseSync(path);
    this.sql.exec(`
      PRAGMA journal_mode = WAL;
      PRAGMA synchronous = NORMAL;
      PRAGMA busy_timeout = 3000;
      CREATE TABLE IF NOT EXISTS meta (k TEXT PRIMARY KEY, v TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS snapshots (
        id INTEGER PRIMARY KEY AUTOINCREMENT, tick INTEGER NOT NULL, game_sec REAL NOT NULL,
        created_at INTEGER NOT NULL, bytes INTEGER NOT NULL, data BLOB NOT NULL);
      CREATE TABLE IF NOT EXISTS events (
        id INTEGER PRIMARY KEY AUTOINCREMENT, tick INTEGER NOT NULL, game_sec REAL NOT NULL,
        kind TEXT NOT NULL, data TEXT NOT NULL);
      CREATE INDEX IF NOT EXISTS events_kind ON events(kind, id);
      CREATE TABLE IF NOT EXISTS outbox (
        path TEXT PRIMARY KEY, data TEXT NOT NULL, updated_at INTEGER NOT NULL, attempts INTEGER NOT NULL DEFAULT 0);
    `);
  }

  getMeta(k: string): string | undefined {
    const r = this.sql.prepare('SELECT v FROM meta WHERE k = ?').get(k) as { v: string } | undefined;
    return r?.v;
  }

  setMeta(k: string, v: string): void {
    this.sql.prepare('INSERT INTO meta (k, v) VALUES (?, ?) ON CONFLICT(k) DO UPDATE SET v = excluded.v').run(k, v);
  }

  delMeta(k: string): void { this.sql.prepare('DELETE FROM meta WHERE k = ?').run(k); }

  tx<T>(fn: () => T): T {
    this.sql.exec('BEGIN IMMEDIATE');
    try { const r = fn(); this.sql.exec('COMMIT'); return r; }
    catch (err) { this.sql.exec('ROLLBACK'); throw err; }
  }

  close(): void { this.sql.close(); }
}
