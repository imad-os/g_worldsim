import type { Db } from '../persist/db.js';

/**
 * The dashboard's charts over time (imad 2026-11-27: "charts for lifetime, 1y, 6m, 1m, 1w, 1d").
 * One row a minute is kept for 2 days, one row an hour (the average of its minutes) forever: ~9000 small rows a year.
 * A row = [time ms, game sec, people, hunger, thirst, tired, lonely, hp, zombies, animals, ticks/s, cpu %, ram MB].
 * A query answers at most `POINTS` rows, averaged in equal time buckets, so a year draws as fast as a day.
 */
export const RANGES: Record<string, number> = { '1d': 864e5, '1w': 7 * 864e5, '1m': 30 * 864e5, '6m': 182 * 864e5, '1y': 365 * 864e5, all: Infinity };
const POINTS = 360, MINUTE_KEEP = 2 * 864e5, HOUR = 36e5;

export class History {
  /** Minute rows of the last 2 days, oldest first (also on disk, so a restart keeps the 1d chart). */
  readonly recent: number[][] = [];
  constructor(private db: Db) {
    db.sql.exec('CREATE TABLE IF NOT EXISTS history (res INTEGER NOT NULL, t INTEGER NOT NULL, v TEXT NOT NULL, PRIMARY KEY (res, t))');
    const rows = db.sql.prepare('SELECT v FROM history WHERE res = 1 AND t >= ? ORDER BY t').all(Date.now() - MINUTE_KEEP) as { v: string }[];
    for (const r of rows) this.recent.push(JSON.parse(r.v) as number[]);
  }

  add(row: number[]): void {
    const t = row[0]!, last = this.recent[this.recent.length - 1];
    // An hour is complete: its average becomes an hourly row.
    if (last && Math.floor(last[0]! / HOUR) !== Math.floor(t / HOUR)) {
      const h = Math.floor(last[0]! / HOUR) * HOUR, rows = this.recent.filter((r) => r[0]! >= h && r[0]! < h + HOUR);
      if (rows.length) this.db.sql.prepare('INSERT OR REPLACE INTO history (res, t, v) VALUES (60, ?, ?)').run(h, JSON.stringify(average(rows, h)));
    }
    this.recent.push(row);
    this.db.sql.prepare('INSERT OR REPLACE INTO history (res, t, v) VALUES (1, ?, ?)').run(t, JSON.stringify(row));
    const old = t - MINUTE_KEEP;
    if (this.recent.length && this.recent[0]![0]! < old) {
      let k = 0; while (k < this.recent.length && this.recent[k]![0]! < old) k++;
      this.recent.splice(0, k);
      this.db.sql.prepare('DELETE FROM history WHERE res = 1 AND t < ?').run(old);
    }
  }

  /** The rows of a range ('1d' .. 'all'), at most POINTS of them; `from` = where the range starts (the first row for 'all'). */
  get(range: string, now = Date.now()): { range: string; from: number; to: number; rows: number[][] } {
    const span = RANGES[range] ?? RANGES['1d']!, from = now - span;
    let rows: number[][];
    if (span <= MINUTE_KEEP) rows = this.recent.filter((r) => r[0]! >= from);
    else {
      const hours = (this.db.sql.prepare('SELECT v FROM history WHERE res = 60 AND t >= ? ORDER BY t').all(Number.isFinite(from) ? from : 0) as { v: string }[]).map((r) => JSON.parse(r.v) as number[]);
      // The current hour (and minutes not yet folded into an hour) come from the minute rows.
      const lastH = hours.length ? hours[hours.length - 1]![0]! + HOUR : -Infinity;
      rows = [...hours, ...this.recent.filter((r) => r[0]! >= lastH && r[0]! >= from)];
    }
    const start = Number.isFinite(from) ? from : rows[0]?.[0] ?? now;
    return { range: RANGES[range] ? range : '1d', from: start, to: now, rows: bucket(rows, start, now) };
  }
}

function average(rows: number[][], t: number): number[] {
  const n = rows[0]!.length, out = new Array<number>(n).fill(0);
  for (const r of rows) for (let k = 1; k < n; k++) out[k]! += r[k] ?? 0;
  for (let k = 1; k < n; k++) out[k] = Math.round((out[k]! / rows.length) * 10) / 10;
  out[0] = t; out[1] = rows[rows.length - 1]![1]!; // game time: where it got to
  return out;
}

/** At most POINTS rows: rows in the same time slice are averaged. */
function bucket(rows: number[][], from: number, to: number): number[][] {
  if (rows.length <= POINTS) return rows;
  const w = Math.max(1, (to - from) / POINTS), out: number[][] = [];
  let cur: number[][] = [], k = -1;
  for (const r of rows) {
    const b = Math.floor((r[0]! - from) / w);
    if (b !== k && cur.length) { out.push(average(cur, cur[cur.length - 1]![0]!)); cur = []; }
    k = b; cur.push(r);
  }
  if (cur.length) out.push(average(cur, cur[cur.length - 1]![0]!));
  return out;
}
