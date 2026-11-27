import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Db } from '../persist/db.js';
import { History } from '../ops/history.js';

test('chart history: minutes for 2 days, hours forever, ranges bucketed to at most 360 points', () => {
  const db = new Db(':memory:'), h = new History(db);
  const MIN = 60_000, start = Math.floor((Date.now() - 10 * 864e5) / 36e5) * 36e5 + 36e5;
  // 10 days of one row a minute: people = day number.
  for (let m = 0; m < 10 * 1440; m++) { const t = start + m * MIN; h.add([t, m * 60, Math.floor(m / 1440), 0, 0, 0, 0, 100, 0, 0, 20, 10, 200]); }
  const now = start + 10 * 1440 * MIN;
  assert.ok(h.recent.length <= 2 * 1440 + 1, 'minutes older than 2 days are dropped');
  const d = h.get('1d', now);
  assert.equal(d.range, '1d'); assert.ok(d.rows.length > 300 && d.rows.length <= 360, `1d rows ${d.rows.length}`);
  assert.ok(d.rows.every((r) => r[2] === 9));
  const w = h.get('1w', now);
  assert.ok(w.rows.length > 100 && w.rows.length <= 360, `1w rows ${w.rows.length}`);
  assert.ok(w.rows[0]![0]! >= now - 7 * 864e5 - 36e5);
  assert.equal(w.rows[0]![2], 3, 'a week back = day 3');
  const all = h.get('all', now);
  assert.equal(all.from, start); assert.equal(all.rows[0]![2], 0);
  // A restart reads the minutes back.
  const h2 = new History(db);
  assert.equal(h2.recent.length, h.recent.length);
  assert.equal(h.get('nonsense', now).range, '1d');
});
