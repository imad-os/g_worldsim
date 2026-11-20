import { createHash, randomBytes, randomInt } from 'node:crypto';
import type { Db } from './db.js';

const hash = (t: string) => createHash('sha256').update(t).digest('hex');

export interface Pairing { code: string; name: string; dev: string; ip: string; at: number; done: (token: string, name: string) => void; fail: (why: string) => void }

/**
 * Viewer players. A TV pairs once: it shows a 6-digit code, the owner approves it in the control panel,
 * the TV gets its own token and keeps it (My PC saves it per profile). Only a SHA-256 of each token is stored.
 * Tokens from VIEWER_TOKENS in .env keep working too.
 */
export class Players {
  readonly pending = new Map<string, Pairing>();
  /** Names a TV may not take as they are (signed-in accounts' characters): it gets "name (2)". */
  reserved: (name: string) => boolean = () => false;

  constructor(private readonly db: Db, private readonly envViewers: Map<string, string>) {
    db.sql.exec(`CREATE TABLE IF NOT EXISTS players (
      name TEXT PRIMARY KEY, token_hash TEXT NOT NULL UNIQUE, dev TEXT NOT NULL DEFAULT '',
      created_at INTEGER NOT NULL, last_seen INTEGER NOT NULL DEFAULT 0)`);
  }

  /** Player name for a viewer token, or null. */
  check(token: string): string | null {
    if (token.length < 16 || token.length > 128) return null;
    const row = this.db.sql.prepare('SELECT name FROM players WHERE token_hash = ?').get(hash(token)) as { name: string } | undefined;
    if (row) {
      this.db.sql.prepare('UPDATE players SET last_seen = ? WHERE name = ?').run(Date.now(), row.name);
      return row.name;
    }
    const h = hash(token);
    for (const [n, t] of this.envViewers) if (hash(t) === h) return n;
    return null;
  }

  request(name: string, dev: string, ip: string, done: Pairing['done'], fail: Pairing['fail']): Pairing {
    this.expire();
    let code = '';
    do code = String(randomInt(0, 1_000_000)).padStart(6, '0'); while (this.pending.has(code));
    const p: Pairing = { code, name: name.slice(0, 32) || 'Player', dev: dev.slice(0, 40), ip, at: Date.now(), done, fail };
    this.pending.set(code, p);
    return p;
  }

  cancel(code: string): void { this.pending.delete(code); }

  expire(): void {
    const now = Date.now();
    for (const [c, p] of this.pending) if (now - p.at > 600_000) { this.pending.delete(c); p.fail('expired'); }
  }

  /** `exact`: a signed-in player pairs their own TV: it takes their name, replacing their previous TV. */
  approve(code: string, name?: string, exact = false): { name: string } {
    this.expire();
    const p = this.pending.get(code);
    if (!p) throw new Error('no such code (it lasts 10 minutes)');
    this.pending.delete(code);
    let n = (name ?? p.name).trim().slice(0, 32) || 'Player';
    const taken = (x: string) => !!this.db.sql.prepare('SELECT 1 FROM players WHERE lower(name) = lower(?)').get(x) || this.envViewers.has(x) || (!exact && this.reserved(x));
    if (exact) this.db.sql.prepare('DELETE FROM players WHERE name = ?').run(n);
    else if (taken(n)) { let k = 2; while (taken(`${n} (${k})`)) k++; n = `${n} (${k})`; }
    const token = randomBytes(24).toString('base64url');
    this.db.sql.prepare('INSERT INTO players (name, token_hash, dev, created_at, last_seen) VALUES (?, ?, ?, ?, ?)')
      .run(n, hash(token), p.dev, Date.now(), Date.now());
    p.done(token, n);
    return { name: n };
  }

  deny(code: string): void {
    const p = this.pending.get(code);
    if (p) { this.pending.delete(code); p.fail('denied'); }
  }

  list(): { name: string; dev: string; created: number; lastSeen: number; fromEnv: boolean }[] {
    const rows = this.db.sql.prepare('SELECT name, dev, created_at, last_seen FROM players ORDER BY created_at').all() as
      { name: string; dev: string; created_at: number; last_seen: number }[];
    return [
      ...[...this.envViewers.keys()].map((name) => ({ name, dev: '.env', created: 0, lastSeen: 0, fromEnv: true })),
      ...rows.map((r) => ({ name: r.name, dev: r.dev, created: r.created_at, lastSeen: r.last_seen, fromEnv: false })),
    ];
  }

  pendingList(): { code: string; name: string; dev: string; ip: string; at: number }[] {
    this.expire();
    return [...this.pending.values()].map(({ code, name, dev, ip, at }) => ({ code, name, dev, ip, at }));
  }

  has(name: string): boolean { return !!this.db.sql.prepare('SELECT 1 FROM players WHERE lower(name) = lower(?)').get(name) || [...this.envViewers.keys()].some((k) => k.toLowerCase() === name.toLowerCase()); }

  /** A TV's player takes another name (merging two names of one person): that name's other TVs keep working under it. */
  rename(from: string, to: string): boolean {
    return Number(this.db.sql.prepare('UPDATE players SET name = ? WHERE name = ?').run(to, from).changes) > 0;
  }

  revoke(name: string): boolean {
    return Number(this.db.sql.prepare('DELETE FROM players WHERE name = ?').run(name).changes) > 0;
  }
}
