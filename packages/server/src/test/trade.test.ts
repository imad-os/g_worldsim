// Trading between two players (imad 2026-11-27): invite, offers, both accept, the swap; changes take acceptances back.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Kind } from '@worldsim/protocol';
import { scenario } from './helpers.js';
import { World } from '../sim/world.js';
import { Trades } from '../ops/trade.js';

const mk = () => new World(scenario(), { tickRate: 20, clockScale: 30, capacity: 2048, seed: 'trade' });

test('trade: invite, offer, both accept = swapped at once; a change clears acceptances; walking apart closes it', () => {
  const w = mk();
  w.populate();
  w.step();
  const m = w.mapIndex.get('town') ?? 0;
  const a = w.spawnPlayer(m, 96.5, 96.5); w.playerProfile(a, 'Ana');
  const b = w.spawnPlayer(m, 98.5, 96.5); w.playerProfile(b, 'Bo');
  const e = w.e, sv = w.survival, id = (i: number) => e.id(i);
  const notes: [number, string, Record<string, unknown>][] = [];
  const t = new Trades(w);
  t.notice = (i, kind, data) => notes.push([i, kind, data as Record<string, unknown>]);
  sv.add(a, 'wood', 6); sv.add(a, 'bow', 1);
  w.gear.state(a).up = { bow: [4, 2] };
  sv.add(b, 'ore', 3);

  // Invite: Bo hears it, nothing open yet.
  assert.equal(t.act(a, 'Ana', `ask:${id(b)}`).code, 'tradeAsked');
  assert.deepEqual(notes.at(-1)!.slice(0, 2), [b, 'trade']);
  assert.equal(notes.at(-1)![2].state, 'invite');
  assert.equal(t.act(a, 'Ana', 'put:wood:1').code, 'tradeNone');
  // Bo says yes: both see the screen.
  assert.equal(t.act(b, 'Bo', `yes:${id(a)}`).code, 'trade');
  assert.ok(t.trading(a) && t.trading(b));

  // Offers: no more than I have.
  assert.equal(t.act(a, 'Ana', 'put:wood:9').code, 'trade');
  assert.equal((t.act(a, 'Ana', 'view').trade as { me: { offer: Record<string, number> } }).me.offer.wood, 6);
  t.act(a, 'Ana', 'put:wood:-2');
  t.act(a, 'Ana', 'put:bow:1');
  assert.equal(t.act(b, 'Bo', 'put:ore:2').code, 'trade');
  assert.equal(t.act(b, 'Bo', 'put:sword:1').code, 'tradeNoMore', 'nothing I do not have');
  // The bow's level goes with it (her last one), shown to Bo.
  const v = t.act(b, 'Bo', 'view').trade as { them: { up: Record<string, number[]> } };
  assert.deepEqual(v.them.up.bow, [4, 2]);

  // Ana accepts, Bo changes his offer: her acceptance is taken back.
  t.act(a, 'Ana', 'ok:1');
  t.act(b, 'Bo', 'put:ore:1');
  assert.equal((t.act(a, 'Ana', 'view').trade as { me: { ok: boolean } }).me.ok, false);
  // Both accept: swapped.
  t.act(a, 'Ana', 'ok:1');
  const r = t.act(b, 'Bo', 'ok:1');
  assert.equal(r.code, 'traded');
  assert.equal(sv.inv(a).wood, 2); assert.equal(sv.inv(a).bow ?? 0, 0); assert.equal(sv.inv(a).ore, 3);
  assert.equal(sv.inv(b).wood, 4); assert.equal(sv.inv(b).bow, 1); assert.equal(sv.inv(b).ore ?? 0, 0);
  assert.deepEqual(w.gear.up(b, 'bow'), [4, 2]); assert.deepEqual(w.gear.up(a, 'bow'), [0, 0]);
  assert.ok(!t.trading(a) && !t.trading(b));
  assert.ok(notes.some(([i, k, d]) => i === a && k === 'trade' && d.state === 'done' && (d.got as Record<string, number>).ore === 3));

  // Food from the hands; no room = nothing moves.
  t.act(a, 'Ana', `ask:${id(b)}`); t.act(b, 'Bo', `yes:${id(a)}`);
  sv.add(b, 'wood', 20); // Bo's bag is full of wood
  t.act(a, 'Ana', 'put:wood:2');
  t.act(a, 'Ana', 'ok:1');
  assert.equal(t.act(b, 'Bo', 'ok:1').code, 'tradeNoRoom');
  assert.equal(sv.inv(a).wood, 2);
  // Asking back opens at once; walking apart closes it.
  t.act(a, 'Ana', 'cancel');
  assert.ok(notes.some(([i, k, d]) => i === b && k === 'trade' && d.state === 'closed' && d.why === 'cancelled'));
  t.act(a, 'Ana', `ask:${id(b)}`);
  assert.equal(t.act(b, 'Bo', `ask:${id(a)}`).code, 'trade');
  e.x[b] = 96.5 + 30;
  t.check();
  assert.ok(!t.trading(a));
  assert.ok(notes.some(([i, k, d]) => i === a && k === 'trade' && d.why === 'apart'));
  // Too far to start; not a player.
  assert.equal(t.act(a, 'Ana', `ask:${id(b)}`).code, 'tradeTooFar');
  let ag = -1; for (let j = 0; j < e.hi; j++) if (e.kind[j] === Kind.Agent && !w.charName(j)) { ag = j; break; }
  if (ag >= 0) assert.equal(t.act(a, 'Ana', `ask:${id(ag)}`).code, 'tradeNotPlayer');
});
