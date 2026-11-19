import { createSign } from 'node:crypto';
import { CHUNK_TILES } from '@worldsim/protocol';
import type { Db } from './db.js';
import { serialize, restore } from './snapshot.js';
import type { World } from '../sim/world.js';
import type { Logger } from '../log.js';

/**
 * Firestore backup (REST, service account from .env). SQLite stays the working store; the cloud gets a
 * compact copy every few minutes, through an outbox table that coalesces changes per document:
 *   worlds/<world>                      clock, population, scenario (when changed)
 *   worlds/<world>/state/entities       every entity's columns, msgpack (when changed)
 *   worlds/<world>/chunks/<map>_<cx>_<cy> changed tiles vs the generated map (only chunks that changed)
 * Never per tick. A daily write cap (default 15 000 of the free 20 000) stops uploads before the quota.
 */
export interface CloudConfig {
  enabled: boolean;
  projectId: string;
  worldId: string;
  everySec: number;
  maxWritesPerDay: number;
  /** Service account: { client_email, private_key }. */
  credentials?: { client_email: string; private_key: string; token_uri?: string };
  /** Overridable for tests. */
  base?: string;
  tokenUrl?: string;
}

type FsValue = Record<string, unknown>;

export function toFs(v: unknown): FsValue {
  if (v === null || v === undefined) return { nullValue: null };
  if (typeof v === 'boolean') return { booleanValue: v };
  if (typeof v === 'number') return Number.isInteger(v) ? { integerValue: String(v) } : { doubleValue: v };
  if (typeof v === 'string') return { stringValue: v };
  if (v instanceof Uint8Array) return { bytesValue: Buffer.from(v.buffer, v.byteOffset, v.byteLength).toString('base64') };
  if (Array.isArray(v)) return { arrayValue: { values: v.map(toFs) } };
  if (typeof v === 'object') return { mapValue: { fields: fieldsOf(v as Record<string, unknown>) } };
  throw new Error('unsupported value');
}

export function fieldsOf(o: Record<string, unknown>): Record<string, FsValue> {
  const f: Record<string, FsValue> = {};
  for (const [k, v] of Object.entries(o)) if (v !== undefined) f[k] = toFs(v);
  return f;
}

export function fromFs(v: FsValue): unknown {
  if ('nullValue' in v) return null;
  if ('booleanValue' in v) return v.booleanValue;
  if ('integerValue' in v) return Number(v.integerValue);
  if ('doubleValue' in v) return v.doubleValue;
  if ('stringValue' in v) return v.stringValue;
  if ('bytesValue' in v) return new Uint8Array(Buffer.from(String(v.bytesValue), 'base64'));
  if ('arrayValue' in v) return ((v.arrayValue as { values?: FsValue[] }).values ?? []).map(fromFs);
  if ('mapValue' in v) return fromFields((v.mapValue as { fields?: Record<string, FsValue> }).fields ?? {});
  return undefined;
}

export function fromFields(f: Record<string, FsValue>): Record<string, unknown> {
  const o: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(f)) o[k] = fromFs(v);
  return o;
}

export class CloudSync {
  private token = '';
  private tokenExp = 0;
  private lastEntHash = '';
  private lastWorldDoc = '';
  private readonly syncedVer = new Map<string, number>();
  private backoffUntil = 0;
  busy = false;
  lastOk = 0;
  lastError = '';

  constructor(private readonly db: Db, readonly cfg: CloudConfig, private readonly log: Logger) {
    const saved = db.getMeta('cloud_chunk_ver');
    if (saved) for (const [k, v] of Object.entries(JSON.parse(saved) as Record<string, number>)) this.syncedVer.set(k, v);
  }

  private get base(): string {
    return `${this.cfg.base ?? 'https://firestore.googleapis.com'}/v1/projects/${this.cfg.projectId}/databases/(default)/documents`;
  }
  private docName(path: string): string {
    return `projects/${this.cfg.projectId}/databases/(default)/documents/${path}`;
  }

  enqueue(path: string, data: Record<string, unknown>): void {
    this.db.sql.prepare(`INSERT INTO outbox (path, data, updated_at, attempts) VALUES (?, ?, ?, 0)
      ON CONFLICT(path) DO UPDATE SET data = excluded.data, updated_at = excluded.updated_at`)
      .run(path, JSON.stringify(data, (_k, v) => (v instanceof Uint8Array ? { $b: Buffer.from(v).toString('base64') } : v)), Date.now());
  }

  pending(): number {
    return (this.db.sql.prepare('SELECT COUNT(*) AS n FROM outbox').get() as { n: number }).n;
  }

  /** Put what changed since the last collect into the outbox (cheap; no network). */
  collect(w: World): number {
    const root = `worlds/${this.cfg.worldId}`;
    let n = 0;
    const worldDoc = { scenario: w.sc.id, seed: w.seed, tick: w.tick, gameSec: Math.floor(w.gameSec), agents: w.e.countKind(1), maps: w.maps.map((m) => m.def.id) };
    const wd = JSON.stringify({ ...worldDoc, tick: 0, gameSec: Math.floor(w.gameSec / 600) });
    const h = w.hash();
    if (h !== this.lastEntHash) {
      this.enqueue(`${root}/state/entities`, { tick: w.tick, gameSec: w.gameSec, data: serialize(w, false) });
      this.enqueue(root, { ...worldDoc, savedAt: Date.now() });
      this.lastEntHash = h; this.lastWorldDoc = wd; n += 2;
    } else if (wd !== this.lastWorldDoc) {
      this.enqueue(root, { ...worldDoc, savedAt: Date.now() }); this.lastWorldDoc = wd; n++;
    }
    for (const m of w.maps) {
      const t = m.tiles;
      for (let c = 0; c < t.chunkVer.length; c++) {
        const key = `${m.def.id}_${c % t.cw}_${(c / t.cw) | 0}`;
        const ver = t.chunkVer[c]!;
        if ((this.syncedVer.get(key) ?? 1) === ver) continue;
        this.enqueue(`${root}/chunks/${key}`, { map: m.def.id, cx: c % t.cw, cy: (c / t.cw) | 0, ver, diff: t.chunkDiff(c % t.cw, (c / t.cw) | 0) });
        this.syncedVer.set(key, ver);
        n++;
      }
    }
    if (n) this.db.setMeta('cloud_chunk_ver', JSON.stringify(Object.fromEntries(this.syncedVer)));
    return n;
  }

  private dayKey(): string { return 'fs_writes_' + new Date().toISOString().slice(0, 10); }
  writesToday(): number { return Number(this.db.getMeta(this.dayKey()) ?? 0); }

  private async accessToken(): Promise<string> {
    if (this.token && Date.now() < this.tokenExp - 60_000) return this.token;
    const c = this.cfg.credentials;
    if (!c) throw new Error('no Firebase credentials');
    const now = Math.floor(Date.now() / 1000);
    const b64 = (o: unknown) => Buffer.from(JSON.stringify(o)).toString('base64url');
    const aud = this.cfg.tokenUrl ?? c.token_uri ?? 'https://oauth2.googleapis.com/token';
    const unsigned = `${b64({ alg: 'RS256', typ: 'JWT' })}.${b64({ iss: c.client_email, scope: 'https://www.googleapis.com/auth/datastore', aud, iat: now, exp: now + 3600 })}`;
    const sig = createSign('RSA-SHA256').update(unsigned).sign(c.private_key, 'base64url');
    const res = await fetch(aud, {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion: `${unsigned}.${sig}` }),
    });
    if (!res.ok) throw new Error(`token ${res.status}`);
    const j = (await res.json()) as { access_token: string; expires_in: number };
    this.token = j.access_token;
    this.tokenExp = Date.now() + j.expires_in * 1000;
    return this.token;
  }

  /** Upload the outbox (max 400 documents per commit). Returns documents written. */
  async flush(): Promise<number> {
    if (!this.cfg.enabled || this.busy || Date.now() < this.backoffUntil) return 0;
    const rows = this.db.sql.prepare('SELECT path, data, updated_at FROM outbox ORDER BY updated_at LIMIT 400').all() as
      { path: string; data: string; updated_at: number }[];
    if (!rows.length) return 0;
    const used = this.writesToday();
    if (used + rows.length > this.cfg.maxWritesPerDay) {
      this.lastError = `daily write cap reached (${used}/${this.cfg.maxWritesPerDay})`;
      return 0;
    }
    this.busy = true;
    try {
      const writes = rows.map((r) => ({
        update: { name: this.docName(r.path), fields: fieldsOf(JSON.parse(r.data, (_k, v) => (v && typeof v === 'object' && '$b' in v ? new Uint8Array(Buffer.from(v.$b, 'base64')) : v))) },
      }));
      const res = await fetch(`${this.base}:commit`, {
        method: 'POST',
        headers: { authorization: `Bearer ${await this.accessToken()}`, 'content-type': 'application/json' },
        body: JSON.stringify({ writes }),
      });
      if (!res.ok) throw new Error(`commit ${res.status} ${(await res.text()).slice(0, 200)}`);
      const del = this.db.sql.prepare('DELETE FROM outbox WHERE path = ? AND updated_at = ?');
      this.db.tx(() => { for (const r of rows) del.run(r.path, r.updated_at); });
      this.db.setMeta(this.dayKey(), String(used + rows.length));
      this.lastOk = Date.now();
      this.lastError = '';
      return rows.length;
    } catch (err) {
      this.lastError = String((err as Error).message ?? err);
      this.backoffUntil = Date.now() + 60_000;
      this.db.sql.prepare('UPDATE outbox SET attempts = attempts + 1').run();
      this.log.warn('cloud sync failed', { err: this.lastError });
      return 0;
    } finally {
      this.busy = false;
    }
  }

  private async get(path: string): Promise<Record<string, unknown> | null> {
    const res = await fetch(`${this.base}/${path}`, { headers: { authorization: `Bearer ${await this.accessToken()}` } });
    if (res.status === 404) return null;
    if (!res.ok) throw new Error(`get ${path} ${res.status}`);
    const j = (await res.json()) as { fields?: Record<string, FsValue> };
    return fromFields(j.fields ?? {});
  }

  /** Rebuild a world from the cloud copy (used when the local database is gone). */
  async restoreInto(w: World): Promise<boolean> {
    if (!this.cfg.enabled) return false;
    const root = `worlds/${this.cfg.worldId}`;
    const ents = await this.get(`${root}/state/entities`);
    if (!ents?.data) return false;
    const chunks: Record<string, unknown>[] = [];
    let pageToken = '';
    do {
      const res = await fetch(`${this.base}/${root}/chunks?pageSize=300${pageToken ? `&pageToken=${pageToken}` : ''}`,
        { headers: { authorization: `Bearer ${await this.accessToken()}` } });
      if (!res.ok) throw new Error(`list chunks ${res.status}`);
      const j = (await res.json()) as { documents?: { fields: Record<string, FsValue> }[]; nextPageToken?: string };
      for (const d of j.documents ?? []) chunks.push(fromFields(d.fields));
      pageToken = j.nextPageToken ?? '';
    } while (pageToken);
    restore(w, ents.data as Uint8Array, (world) => {
      for (const c of chunks) {
        const m = world.maps[world.mapIndex.get(String(c.map)) ?? -1];
        if (!m) continue;
        const diff = c.diff as number[], x0 = Number(c.cx) * CHUNK_TILES, y0 = Number(c.cy) * CHUNK_TILES;
        for (let k = 0; k < diff.length; k += 2) {
          const tx = x0 + (diff[k]! % CHUNK_TILES), ty = y0 + ((diff[k]! / CHUNK_TILES) | 0);
          m.tiles.init(tx, ty, diff[k + 1]!);
        }
        const ci = Number(c.cy) * m.tiles.cw + Number(c.cx);
        m.tiles.chunkVer[ci] = Number(c.ver);
        this.syncedVer.set(`${c.map}_${c.cx}_${c.cy}`, Number(c.ver));
        m.tiles.dirty[ci] = 1; m.tiles.dirtyCount++;
      }
    });
    return true;
  }
}
