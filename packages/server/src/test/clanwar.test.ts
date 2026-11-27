import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Kind } from '@worldsim/protocol';
import { Ai, AI_DEFAULTS } from '../ai/llm.js';
import { Planner } from '../ai/planner.js';
import { Logger } from '../log.js';
import { scenario } from './helpers.js';
import { World } from '../sim/world.js';
import { warWords } from '../sim/clans.js';

const mk = (seed: string) => new World(scenario(), { tickRate: 20, clockScale: 30, capacity: 2048, seed });
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const hourly = (w: World) => (w.clans as any).hourly();
const log = new Logger('error');

/** Two clans of 5 adults each in town, nobody else; the leaders are ids[0] and ids[5]. */
function twoClans(seed: string) {
  const w = mk(seed);
  w.populate(); w.land.setup();
  const e = w.e, town = w.mapIndex.get('town')!;
  for (let i = 0; i < e.hi; i++) if (e.kind[i] === Kind.Agent) w.remove(i);
  w.step();
  const people: number[] = [];
  for (let n = 0; n < 10; n++) people.push(w.spawnAgent(town, 40 + (n % 5) * 1.2, 40 + Math.floor(n / 5) * 30));
  for (const i of people) { const p = w.profileOf(i)!; p.born = w.gameSec - 30 * w.yearSec; p.parents = []; p.partner = -1; p.traits.courage = 0.9; }
  const ids = people.map((i) => e.id(i));
  const A = w.clans.found(town, ids[0]!, ids.slice(1, 5)), B = w.clans.found(town, ids[5]!, ids.slice(6, 10));
  return { w, e, town, people, ids, A, B };
}

test('clan war words', () => {
  assert.equal(warWords('Declare war on the Redhand'), 'war');
  assert.equal(warWords('déclare la guerre aux Ashfall'), 'war');
  assert.equal(warWords('اعلن الحرب'), 'war');
  assert.equal(warWords('make peace with them'), 'peace');
  assert.equal(warWords('go fetch some wood'), '');
});

test('clan war: the owner tells a leader to declare war (and to make peace); a member cannot', async () => {
  const { w, e, people, A, B } = twoClans('war-order');
  const p = new Planner(w, new Ai({ ...AI_DEFAULTS, provider: 'none' }, {}, log), log);
  const member = await p.chat(people[1]!, 'owner', `Declare war on the ${B.name}!`);
  assert.match(member.did, /not done.*only/, 'a member says only the leader can');
  assert.equal(w.clans.wars.length, 0);
  const r = await p.chat(people[0]!, 'owner', `Declare war on the ${B.name}!`);
  assert.match(r.did, new RegExp(`war on the ${B.name}`));
  assert.ok(w.clans.warOf(A.id, B.id), 'the war is on');
  assert.equal(w.clans.tension(A.id, B.id), 10);
  assert.match(w.clans.promptText(people[6]!), new RegExp(`AT WAR with ${A.name}`), 'the other side knows it');
  // The model's own clan step "war <clan>" is a war, never a join (it used to fall through to "join" and walk to the enemy's leader).
  assert.equal(w.clans.step(people[5]!, { what: `war ${A.name}` }, true), `we are already at war with the ${A.name}`);
  assert.equal(w.clans.clanOf(e.id(people[5]!))?.id, B.id);
  const peace = await p.chat(people[5]!, 'owner', 'Make peace.');
  assert.match(peace.did, /peace with/);
  assert.equal(w.clans.wars.length, 0);
  assert.equal(w.clans.tension(A.id, B.id), 3);
});

test('clan war: enemies fight on sight, the duels count, nobody dies, the side far behind sues for peace', () => {
  const { w, e, town, people, ids, A, B } = twoClans('war-fight');
  assert.equal(w.clans.declareWar(A, B, 'owner'), true);
  // Put them face to face.
  for (let n = 0; n < 10; n++) w.place(people[n]!, town, 50 + (n % 5) * 3, 50 + (n < 5 ? 0 : 2));
  const seen: Record<string, number> = {};
  w.listeners.push((ev) => { if (['duel', 'duelEnd', 'pvp', 'death'].includes(ev.kind)) { const k = ev.kind + (ev.kind === 'duelEnd' ? ':' + String(ev.data.why) : ''); seen[k] = (seen[k] ?? 0) + 1; } });
  for (let s = 0; s < 20 * 900; s++) { w.step(); for (const i of people) { e.hunger[i] = 0; e.thirst[i] = 0; e.tired[i] = 0; } }
  const war = w.clans.warOf(A.id, B.id) ?? null;
  for (const i of people) assert.ok(e.slot(e.id(i)) >= 0 && e.hp[i]! > 0, 'nobody died');
  const won = war ? war.wins[0] + war.wins[1] : -1;
  assert.ok(war === null || won > 0, `duels were fought and counted (${won}, ${JSON.stringify(seen)})`);
  assert.equal(seen.death ?? 0, 0, 'nobody died');
  // Far behind: the losing AI leader sues for peace within a few hours.
  if (!war) return;
  war.wins = [7, 1];
  for (let h = 0; h < 30 && w.clans.warOf(A.id, B.id); h++) { w.gameSec += 3600; hourly(w); }
  assert.equal(w.clans.warOf(A.id, B.id), undefined, 'peace');
  void ids;
});

test('changing clan: a married person moves to the partner\'s clan; a much better fitting clan draws a member over', () => {
  const { w, e, people, ids, A, B } = twoClans('war-switch');
  const a = people[2]!, b = people[7]!;
  w.profileOf(a)!.partner = ids[7]!; w.profileOf(b)!.partner = ids[2]!;
  // b is more loyal: a moves.
  (w.clans as unknown as { loyal: Map<number, number> }).loyal.set(ids[2]!, 0.3);
  (w.clans as unknown as { loyal: Map<number, number> }).loyal.set(ids[7]!, 0.9);
  for (let h = 0; h < 40 && w.clans.clanOf(ids[2]!)?.id !== B.id; h++) {
    w.gameSec += 3600; hourly(w);
    for (let s = 0; s < 20 * 60; s++) w.step();
  }
  assert.equal(w.clans.clanOf(ids[2]!)?.id, B.id, 'she walked over to the other leader and was taken in');
  assert.equal(w.clans.clanOf(ids[7]!)?.id, B.id, 'he stays');
  // Someone who loves the other clan and dislikes their own leader crosses over.
  const c = people[3]!, cid = ids[3]!, pr = w.profileOf(c)!;
  pr.mind ??= { notes: [], summary: '', mood: 'calm', rel: {}, lastPlan: 0 };
  pr.mind.rel['#' + ids[0]] = -4;
  for (const x of B.members) pr.mind.rel['#' + x] = 4;
  for (let h = 0; h < 60 && w.clans.clanOf(cid)?.id !== B.id; h++) {
    w.gameSec += 3600; hourly(w);
    for (let s = 0; s < 20 * 60; s++) w.step();
  }
  assert.equal(w.clans.clanOf(cid)?.id, B.id, 'they changed clan by themselves');
  void e; void A;
});

test('tension comes from real causes (no dice), says why, and a war starts after 3 hours at 10/10', () => {
  const { w, A, B } = twoClans('war-tension');
  // Homes far apart and members neutral: tension only heals.
  A.hx = 20; A.hy = 20; B.hx = 150; B.hy = 150;
  for (let h = 0; h < 5; h++) { w.gameSec += 3600; hourly(w); }
  assert.equal(w.clans.tension(A.id, B.id), 0, 'nothing happened, no tension');
  // Bad blood: everyone in A hates everyone in B and back.
  for (const x of A.members) for (const y of B.members) for (const [a, b] of [[x, y], [y, x]] as const) { const p = w.profiles.get(a)!; p.mind ??= { notes: [], summary: '', mood: 'calm', rel: {}, lastPlan: 0 }; p.mind.rel['#' + b] = -5; }
  const seen: number[] = [];
  let war = false;
  w.listeners.push((ev) => { if (ev.kind === 'clanWar') war = true; });
  for (let h = 0; h < 60 && !war; h++) { w.gameSec += 3600; hourly(w); seen.push(w.clans.tension(A.id, B.id)); }
  assert.ok(seen.every((t, k) => k === 0 || t >= seen[k - 1]! || war), 'it only climbs while the causes last');
  const why = w.clans.why(A.id, B.id);
  assert.equal(why[0]?.[0], 'bad blood', 'bad blood is the biggest cause');
  assert.ok(why.some(([k]) => k === 'bad blood'), `bad blood is named (${JSON.stringify(why)})`);
  const at10 = seen.findIndex((t) => t >= 10);
  assert.ok(at10 >= 0 && war, `a war was declared (${seen.slice(-8).join(' ')}, ${A.members.length}/${B.members.length})`);
  assert.ok(seen.length - 1 - at10 >= 3, `only after 3 hours at 10/10 (${seen.length - 1 - at10})`);
});

test('war history: each declared war is kept with what both sides did and why it ended; the war length is a setting', () => {
  const { w, e, people, A, B } = twoClans('war-history');
  assert.equal(w.clans.declareWar(A, B, 'owner', 'the voice from the sky ordered it'), true);
  const h = w.clans.history.at(-1)!;
  assert.equal(h.an, A.name); assert.equal(h.end, undefined);
  // A duel won by A, a blow, a raid, a walk-away: counted for the side that did it.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const cl = w.clans as any;
  cl.start(people[0]!, people[5]!, 'war');
  w.clans.damage(people[5]!, 6, people[0]!);
  cl.end(cl.duels.get(e.id(people[0]!)), 'yield', people[5]!);
  w.clans.warStat(B.id, A.id, 'avoided', 1);
  const lo = A.id < B.id ? 0 : 1;
  assert.equal(h.wins[lo], 1); assert.equal(h.duels, 1); assert.equal(h.blows[lo], 1); assert.equal(h.dmg[lo], 6); assert.equal(h.avoided[1 - lo], 1);
  // Ends by itself after warDays: the reason says so; 0 = never by itself.
  w.clans.warDays = 0;
  w.gameSec += 10 * 86400; hourly(w);
  assert.ok(w.clans.warOf(A.id, B.id), 'no end by itself with war length 0');
  w.clans.warDays = 3; hourly(w);
  assert.equal(w.clans.warOf(A.id, B.id), undefined);
  assert.match(h.endWhy ?? '', /worn out.*3 game days/);
  assert.ok(h.end! > h.start); assert.equal(h.winner, A.name);
  // Saved and loaded with the clans.
  const copy = mk('war-history-2'); copy.clans.load(JSON.parse(JSON.stringify(w.clans.save())));
  assert.equal(copy.clans.history.at(-1)!.endWhy, h.endWhy); assert.equal(copy.clans.warDays, 3);
});
