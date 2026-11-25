/**
 * Per-brain call counts and the fallback brain (imad 2026-11-25).
 *  - `BrainStats`: calls and errors of every saved brain, in hourly buckets (last 7 days) + a lifetime total, kept in the
 *    server's database (meta `brain_stats`, written at most once a minute and at stop). Only the live AI counts, not panel tests.
 *  - `Failover`: the brain in use failing `errors` (3) calls in a row hands over to the fallback brain for `ms` (30 min),
 *    then the brain in use takes over again.
 */

export interface Count { calls: number; errors: number }
export interface StatsView { day: Count; week: Count; life: Count; lastError: string; lastErrorAt: number; lastOkAt: number }
/** One brain's numbers: lifetime calls / errors, hourly buckets [hour index, calls, errors], the last error and success. */
interface Rec { c: number; e: number; h: [number, number, number][]; le: string; lea: number; lok: number }

const HOUR = 3_600_000;
const KEEP_HOURS = 7 * 24 + 1;

export class BrainStats {
  private s: Record<string, Rec> = {};
  private dirty = false;

  constructor(load: () => string | undefined, private readonly save: (json: string) => void) {
    try { const raw = load(); if (raw) { const j = JSON.parse(raw) as Record<string, Rec>; if (j && typeof j === 'object') this.s = j; } } catch { this.s = {}; }
  }

  /** A finished call of brain `id`: ok, or the error's message. */
  record(id: string, ok: boolean, err = '', now = Date.now()): void {
    const r = (this.s[id] ??= { c: 0, e: 0, h: [], le: '', lea: 0, lok: 0 });
    const hr = Math.floor(now / HOUR);
    let last = r.h[r.h.length - 1];
    if (!last || last[0] !== hr) { last = [hr, 0, 0]; r.h.push(last); }
    while (r.h.length && r.h[0]![0] <= hr - KEEP_HOURS) r.h.shift();
    r.c++; last[1]++;
    if (ok) r.lok = now;
    else { r.e++; last[2]++; r.le = err.slice(0, 300); r.lea = now; }
    this.dirty = true;
  }

  view(id: string, now = Date.now()): StatsView {
    const r = this.s[id];
    const sum = (hours: number): Count => {
      const from = Math.floor(now / HOUR) - hours + 1, out = { calls: 0, errors: 0 };
      for (const [h, c, e] of r?.h ?? []) if (h >= from) { out.calls += c; out.errors += e; }
      return out;
    };
    return { day: sum(24), week: sum(7 * 24), life: { calls: r?.c ?? 0, errors: r?.e ?? 0 }, lastError: r?.le ?? '', lastErrorAt: r?.lea ?? 0, lastOkAt: r?.lok ?? 0 };
  }

  drop(id: string): void { if (this.s[id]) { delete this.s[id]; this.dirty = true; } }

  /** Write to the database if anything changed. */
  flush(): void { if (this.dirty) { this.dirty = false; this.save(JSON.stringify(this.s)); } }
}

export class Failover {
  /** Errors in a row of the brain in use. */
  streak = 0;
  /** While now < until, the fallback brain thinks. 0 = not on the fallback. */
  until = 0;
  since = 0;
  reason = '';

  constructor(readonly errors = 3, readonly ms = 30 * 60_000) {}

  on(now = Date.now()): boolean { return this.until > now; }

  /** A call of the brain in use ended. True = hand over to the fallback now. */
  result(ok: boolean, err = '', now = Date.now()): boolean {
    if (this.on(now)) return false;
    if (ok) { this.streak = 0; return false; }
    if (++this.streak < this.errors) return false;
    this.streak = 0; this.until = now + this.ms; this.since = now; this.reason = err.slice(0, 300);
    return true;
  }

  /** The 30 minutes are over: true once, then back to normal. */
  expired(now = Date.now()): boolean {
    if (!this.until || this.until > now) return false;
    this.reset();
    return true;
  }

  reset(): void { this.streak = 0; this.until = 0; this.since = 0; this.reason = ''; }
}
