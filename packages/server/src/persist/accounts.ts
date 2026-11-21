import type { Db } from './db.js';
import type { AccountRole } from '../auth/firebase.js';

export interface Account { uid: string; name: string; email: string; role: AccountRole; created: number; lastSeen: number }

/**
 * People signed in with Firebase (panel). `name` = their character in the world (empty until they join).
 * The role is a copy of Firestore roles/<uid>, refreshed at every sign-in; it decides in-game tools too
 * (owner / admin: admin tools; player: exactly what a person of the world can do).
 */
export class Accounts {
  constructor(private readonly db: Db) {
    db.sql.exec(`CREATE TABLE IF NOT EXISTS accounts (
      uid TEXT PRIMARY KEY, name TEXT NOT NULL DEFAULT '', email TEXT NOT NULL DEFAULT '', role TEXT NOT NULL DEFAULT 'player',
      created_at INTEGER NOT NULL, last_seen INTEGER NOT NULL DEFAULT 0)`);
  }

  private row(r: { uid: string; name: string; email: string; role: string; created_at: number; last_seen: number } | undefined): Account | null {
    return r ? { uid: r.uid, name: r.name, email: r.email, role: r.role as AccountRole, created: r.created_at, lastSeen: r.last_seen } : null;
  }

  get(uid: string): Account | null {
    return this.row(this.db.sql.prepare('SELECT * FROM accounts WHERE uid = ?').get(uid) as never);
  }

  byName(name: string): Account | null {
    if (!name) return null;
    return this.row(this.db.sql.prepare('SELECT * FROM accounts WHERE lower(name) = lower(?)').get(name) as never);
  }

  /** At sign-in: create or refresh (email, role, last seen). */
  seen(uid: string, email: string, role: AccountRole): Account {
    const now = Date.now();
    this.db.sql.prepare(`INSERT INTO accounts (uid, email, role, created_at, last_seen) VALUES (?, ?, ?, ?, ?)
      ON CONFLICT(uid) DO UPDATE SET email = excluded.email, role = excluded.role, last_seen = excluded.last_seen`).run(uid, email, role, now, now);
    return this.get(uid)!;
  }

  setName(uid: string, name: string): void { this.db.sql.prepare('UPDATE accounts SET name = ? WHERE uid = ?').run(name, uid); }

  /** Attach a character name to an account (name '' = detach). A name belongs to one account only. */
  link(uid: string, name: string): void {
    const other = name ? this.byName(name) : null;
    if (other && other.uid !== uid) throw new Error(`${name} is already linked to ${other.email || other.uid}`);
    this.setName(uid, name);
  }

  list(): Account[] {
    return (this.db.sql.prepare('SELECT * FROM accounts ORDER BY created_at').all() as never[]).map((r) => this.row(r)!);
  }

  isStaff(name: string): boolean { const a = this.byName(name); return !!a && (a.role === 'owner' || a.role === 'admin'); }
}
