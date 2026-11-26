import { test } from 'node:test';
import assert from 'node:assert/strict';
import { editDist, uniqueName } from '../sim/people.js';
import { Rng } from '../sim/rng.js';

test('names: a big Arabic / Moroccan / Amazigh pool, no living name twice, none a slip away', () => {
  const rng = new Rng(11);
  const taken = new Set<string>(['Omar', 'Lina']);
  const got: string[] = [];
  for (let i = 0; i < 60; i++) { const n = uniqueName(rng, i % 2 ? 'm' : 'f', taken); taken.add(n); got.push(n); }
  assert.equal(new Set([...taken].map((n) => n.toLowerCase())).size, taken.size, 'no duplicate living names');
  for (const a of got) for (const b of taken) if (a !== b) assert.ok(editDist(a.toLowerCase(), b.toLowerCase()) > 1, `${a} ~ ${b}`);
  assert.ok(!uniqueName(new Rng(1), 'f', new Set(['amina'])).match(/^Amina$/), 'case-insensitive');
  // A full pool still gives a name (numbered once every name is taken).
  const all = new Set<string>();
  for (let i = 0; i < 400; i++) all.add(uniqueName(rng, 'f', all));
  assert.equal(all.size, 400);
});
