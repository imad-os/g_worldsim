import { encode, decode } from '@msgpack/msgpack';
import { copyBytes } from '@worldsim/protocol';
import type { Db } from './db.js';
import type { World } from '../sim/world.js';
import { Kind } from '@worldsim/protocol';
import { randomProfile } from '../sim/people.js';

export const SNAPSHOT_VERSION = 2; // 2: Profile.partner -1 = none (was 0)

/** Typed array -> bytes (copy of the used part). */
function bytesOf(a: ArrayLike<number> & { buffer: ArrayBufferLike; byteOffset: number; BYTES_PER_ELEMENT: number }, n: number): Uint8Array {
  return new Uint8Array(a.buffer, a.byteOffset, n * a.BYTES_PER_ELEMENT).slice();
}

/** Serialise the whole simulation state: clock, RNG, entity columns, tile types + hit points. */
export function serialize(w: World, withTiles = true): Uint8Array {
  const e = w.e, n = e.hi, cols: Record<string, Uint8Array> = {};
  for (const [k, a] of Object.entries(e.columns())) cols[k] = bytesOf(a as unknown as Float64Array, n);
  return encode({
    v: SNAPSHOT_VERSION,
    scenario: w.sc.id,
    seed: w.seed,
    tick: w.tick,
    gameSec: w.gameSec,
    rng: w.rng.getState(),
    hi: n,
    cols,
    profiles: [...w.profiles],
    survival: w.survival.save(),
    clans: w.clans.save(),
    territory: w.territory.save(),
    horses: w.horses.save(),
    lore: w.lore.save(),
    weather: w.weather.save(),
    zombies: w.zombies.perNight,
    land: w.land.done,
    landMaps: [...w.land.doneMaps],
    maps: !withTiles ? [] : w.maps.map((m) => ({ id: m.def.id, w: m.tiles.w, h: m.tiles.h, tiles: m.tiles.tiles, hp: m.tiles.hp, ver: new Uint8Array(m.tiles.chunkVer.buffer.slice(0)) })),
  });
}

interface SnapData {
  v: number; scenario: string; seed: string; tick: number; gameSec: number; rng: number[]; hi: number;
  cols: Record<string, Uint8Array>;
  profiles?: [number, import('../sim/people.js').Profile][];
  survival?: unknown;
  clans?: unknown;
  territory?: unknown;
  horses?: unknown;
  lore?: unknown;
  weather?: unknown;
  zombies?: number;
  land?: number;
  landMaps?: string[];
  maps: { id: string; w: number; h: number; tiles: Uint8Array; hp: Uint8Array; ver: Uint8Array }[];
}

const LEGACY_LAND = ['town', 'woods'];

/** Load a snapshot into a freshly built world (same scenario + seed). Throws on any mismatch. */
export function restore(w: World, bytes: Uint8Array, tileDiffs?: (w: World) => void): void {
  const s = decode(bytes) as SnapData;
  if (s.v !== SNAPSHOT_VERSION && s.v !== 1) throw new Error(`snapshot version ${s.v}`);
  if (s.scenario !== w.sc.id || s.seed !== w.seed) throw new Error('snapshot is for another world');
  if (s.hi > w.e.cap) throw new Error('snapshot larger than capacity');
  const cols = w.e.columns();
  for (const [k, a] of Object.entries(cols)) {
    const src = s.cols[k];
    const arr = a as unknown as Float64Array;
    arr.fill(0);
    if (!src) continue; // column added after this snapshot: zeros
    const Ctor = arr.constructor as Float64ArrayConstructor;
    const copy = new Ctor(copyBytes(src).buffer);
    if (copy.length !== s.hi) throw new Error(`snapshot column ${k} length`);
    arr.set(copy);
  }
  for (const sm of s.maps) {
    const m = w.maps[w.mapIndex.get(sm.id) ?? -1];
    if (!m || sm.w !== m.tiles.w || sm.h !== m.tiles.h) throw new Error(`snapshot map ${sm.id}`);
    m.tiles.tiles.set(sm.tiles);
    m.tiles.hp.set(sm.hp);
    const ver = new Uint32Array(copyBytes(sm.ver).buffer);
    if (ver.length === m.tiles.chunkVer.length) m.tiles.chunkVer.set(ver);
    m.tiles.dirty.fill(1);
    m.tiles.dirtyCount = m.tiles.dirty.length;
  }
  tileDiffs?.(w);
  w.e.rebuildIndex(s.hi);
  w.tick = s.tick;
  w.gameSec = s.gameSec;
  w.rng.setState(s.rng);
  // Bodies of the world built before the restore belong to nobody now.
  for (let i = 0; i < w.bodies.length; i++) { const b = w.bodies[i]; if (b) { b.getWorld().destroyBody(b); w.bodies[i] = null; } }
  w.rebuildBodies();
  w.profiles.clear();
  for (const [id, p] of s.profiles ?? []) { if (s.v === 1 && p.partner === 0) p.partner = -1; w.profiles.set(id, p); }
  w.survival.load(s.survival);
  w.clans.load(s.clans);
  w.territory.load(s.territory);
  w.horses.load(s.horses);
  w.lore.load(s.lore);
  w.weather.load(s.weather);
  if (typeof s.zombies === 'number') w.zombies.perNight = s.zombies;
  w.land.done = s.land ?? 0;
  w.land.doneMaps.clear();
  // Snapshots from before `landMaps`: the ring and rocks were laid on every map the world had then (its saved maps; a cloud
  // snapshot carries none, and those worlds had the two first maps, town and woods).
  for (const id of s.landMaps ?? (s.land ? (s.maps.length ? s.maps.map((x) => x.id) : LEGACY_LAND) : [])) w.land.doneMaps.add(id);
  // Worlds from before profiles: give every agent one.
  for (let i = 0; i < w.e.hi; i++) if (w.e.kind[i] === Kind.Agent && !w.profiles.has(w.e.id(i))) w.profiles.set(w.e.id(i), randomProfile(w.rng, w.gameSec, w.livingNames(), w.yearSec));
}

/** Snapshots in SQLite: write in one transaction, keep the newest `keep`. */
export class Snapshots {
  constructor(private readonly db: Db, private readonly keep = 5) {}

  save(w: World): { id: number; bytes: number; ms: number } {
    const t0 = performance.now();
    const data = serialize(w);
    const id = this.db.tx(() => {
      const r = this.db.sql.prepare('INSERT INTO snapshots (tick, game_sec, created_at, bytes, data) VALUES (?, ?, ?, ?, ?)')
        .run(w.tick, w.gameSec, Date.now(), data.byteLength, data);
      this.db.sql.prepare('DELETE FROM snapshots WHERE id NOT IN (SELECT id FROM snapshots ORDER BY id DESC LIMIT ?)').run(this.keep);
      return Number(r.lastInsertRowid);
    });
    return { id, bytes: data.byteLength, ms: performance.now() - t0 };
  }

  /** Restore the newest snapshot that loads cleanly (a damaged one falls back to the one before). */
  loadLatest(w: World, onSkip?: (id: number, err: unknown) => void): { id: number; tick: number } | null {
    const rows = this.db.sql.prepare('SELECT id, tick FROM snapshots ORDER BY id DESC').all() as { id: number; tick: number }[];
    for (const r of rows) {
      const row = this.db.sql.prepare('SELECT data FROM snapshots WHERE id = ?').get(r.id) as { data: Uint8Array };
      try { restore(w, row.data); return r; }
      catch (err) { onSkip?.(r.id, err); }
    }
    return null;
  }

  count(): number {
    return (this.db.sql.prepare('SELECT COUNT(*) AS n FROM snapshots').get() as { n: number }).n;
  }
}

/** Notable events go to the event log (timeline, "while you were away"). */
export class EventLog {
  private readonly ins;
  private pending: [number, number, string, string][] = [];
  constructor(private readonly db: Db, private readonly keepDays = 30) {
    this.ins = db.sql.prepare('INSERT INTO events (tick, game_sec, kind, data) VALUES (?, ?, ?, ?)');
  }
  add(tick: number, gameSec: number, kind: string, data: unknown): void {
    this.pending.push([tick, gameSec, kind, JSON.stringify(data)]);
  }
  /** Batched: one transaction per flush (called about once a second). */
  flush(): number {
    const p = this.pending;
    if (!p.length) return 0;
    this.pending = [];
    this.db.tx(() => { for (const r of p) this.ins.run(r[0], r[1], r[2], r[3]); });
    return p.length;
  }
  recent(limit = 100, kind?: string): { id: number; tick: number; game_sec: number; kind: string; data: string }[] {
    return (kind
      ? this.db.sql.prepare('SELECT * FROM events WHERE kind = ? ORDER BY id DESC LIMIT ?').all(kind, limit)
      : this.db.sql.prepare('SELECT * FROM events ORDER BY id DESC LIMIT ?').all(limit)) as never;
  }
}
