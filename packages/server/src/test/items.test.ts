import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ITEM_INFO, itemText, RECIPES_ALL, PLACEABLE, RESOURCES, Kind, EFlag } from '@worldsim/protocol';
import { Ai, AI_DEFAULTS } from '../ai/llm.js';
import { Planner } from '../ai/planner.js';
import { Logger } from '../log.js';
import { KNOW_HOW, SOURCES, ownText } from '../sim/knowhow.js';
import { World } from '../sim/world.js';
import { NO_MAP } from '../sim/entities.js';
import { scenario } from './helpers.js';

const run = (w: World, n: number) => { for (let k = 0; k < n; k++) w.step(); };

test('items: every thing in the world has a phrase (benefit + how to use) in the 4 languages', () => {
  const things = new Set<string>([...RESOURCES, ...RECIPES_ALL.map((r) => r.what), ...PLACEABLE, 'hut', 'horse', 'food', 'meat', 'crate', 'farm']);
  for (const k of things) {
    const i = ITEM_INFO[k];
    assert.ok(i, `${k} has a phrase`);
    for (const l of ['en', 'fr', 'es', 'ar'] as const) assert.ok(i.text[l].length > 20, `${k} ${l}`);
  }
  assert.equal(itemText('axe', 'xx'), ITEM_INFO.axe!.text.en);
  assert.ok(KNOW_HOW.includes('Horse:') && KNOW_HOW.includes('First-aid kit:') && KNOW_HOW.includes('Bow:'));
});

test('items: prompts tell people what things are for, what they own and where their horse is', () => {
  const w = new World(scenario(), { tickRate: 20, clockScale: 30, capacity: 2048, seed: 'items-prompt' });
  w.populate(); w.land.setup(); run(w, 2);
  const log = new Logger('error');
  const p = new Planner(w, new Ai({ ...AI_DEFAULTS, provider: 'none' }, {}, log), log);
  let i = -1;
  for (let j = 0; j < w.e.hi; j++) if (w.e.kind[j] === Kind.Agent) { i = j; break; }
  w.survival.add(i, 'axe', 1); w.survival.add(i, 'medkit', 1);
  const pr = (p as unknown as { planPrompt(s: number[]): string }).planPrompt([i]);
  assert.ok(!pr.includes(KNOW_HOW), 'not the whole know-how list any more (imad 2026-11-27: prompts too long)');
  assert.ok(p.planSystem().includes(SOURCES) && !pr.includes(SOURCES), 'where materials come from: once, in the system prompt');
  assert.ok(/axe \(1 wood \+ 1 stone\): chops trees/.test(pr) && /medkit \(3 herb \+ 1 leather\): gives back 45 health/.test(pr), 'what the things in play are for and cost');
  assert.ok(!/stonewall \(/.test(pr), 'nothing about things nobody here can make or use');
  assert.ok(/^Has: .*\b1 axe\b.*\b1 medkit\b/m.test(pr), 'what they own');
  assert.equal((pr.match(/chops trees/g) ?? []).length, 1, 'what a thing does is said once (imad 2026-11-27: it was said twice)');
  assert.ok(/You have no horse\. Wild horses live in/.test(pr), 'where the wild horses are');
  assert.ok(!/hut = 12 wood/.test(pr), 'the real hut cost');
});

test('items: with travel open, a town person goes to the wild, tames a horse, rides it home through the gate and rides it in town', () => {
  const sc = scenario(); sc.agents.count = 4;
  const w = new World(sc, { tickRate: 20, clockScale: 30, capacity: 2048, seed: 'items-ride' });
  w.populate(); w.travelOpen = true; w.land.setup(); run(w, 2);
  const e = w.e, town = w.startMap();
  let i = -1;
  for (let j = 0; j < e.hi; j++) if (e.kind[j] === Kind.Agent && e.map[j] === town && !(e.flags[j]! & (EFlag.Child | EFlag.Small))) { i = j; break; }
  const id = e.id(i), pf = w.profileOf(i)!;
  pf.traits.courage = 1; pf.traits.intelligence = 1; pf.traits.speed = 1; w.horses.skill.set(id, 1500);
  const seen: string[] = [];
  w.listeners.push((ev) => { if (ev.data.id === id && ['travel', 'tamed', 'mount'].includes(ev.kind)) seen.push(ev.kind + (ev.kind === 'travel' ? ':' + String(ev.data.to) + (w.horses.riding[w.e.slot(id)] === 1 ? ':riding' : '') : '')); });
  assert.ok(w.tasks.start(i, 'tame a horse and ride it home', 'owner', [{ do: 'tame' }, { do: 'ride', what: 'home' }]));
  let ended: boolean | undefined;
  w.listeners.push((ev) => { if (ev.kind === 'task' && ev.data.id === id) ended = ev.data.ok === true; });
  for (let k = 0; k < 20 * 120 * 7 && ended === undefined; k++) { w.step(); const s = e.slot(id); e.hunger[s] = 0; e.thirst[s] = 0; e.tired[s] = 0; e.lonely[s] = 0; e.hp[s] = 100; }
  assert.equal(ended, true, `the task ended well (${seen.join(', ')})`);
  assert.ok(seen.includes('travel:woods'), 'went to the woods');
  assert.ok(seen.includes('tamed'), 'tamed a horse');
  assert.ok(seen.some((x) => x === 'travel:town:riding'), `rode home through the gate (${seen.join(', ')})`);
  const s = e.slot(id), a = w.horses.mine(s)[0]!;
  assert.equal(e.map[s], town); assert.equal(e.map[a], town, 'the horse lives in town now');
  // A long walk in town: they get on their horse by themselves.
  w.horses.dismount(s); run(w, 2);
  assert.equal(w.horses.riding[s] as number, 0);
  const mounts0 = seen.filter((x) => x === 'mount').length;
  const mp = w.maps[town]!;
  let far: { x: number; y: number } | null = null;
  for (let t = 0; t < 80 && !far; t++) { const an = t * 0.7, d = 45 + (t % 4) * 8; const sp = w.freeSpot(town, Math.max(15, Math.min(mp.def.w - 15, e.x[s]! + Math.cos(an) * d)), Math.max(15, Math.min(mp.def.h - 15, e.y[s]! + Math.sin(an) * d)), 40); if (sp && w.brain.goTo(s, sp.x, sp.y) && w.brain.goalDist(s) > 40) far = sp; }
  assert.ok(far, 'a place far off');
  w.brain.job(s, far!.x, far!.y, far!.x + 1, far!.y, 11);
  let rode = false;
  for (let k = 0; k < 20 * 90 && !rode; k++) { w.step(); rode = w.horses.riding[s] === 1; }
  assert.ok(rode && seen.filter((x) => x === 'mount').length > mounts0, 'rode for the long walk in town');
  assert.notEqual(e.map[s], NO_MAP);
});

test('items: a hunter with a bow shoots the animal from afar, using arrows', () => {
  const w = new World(scenario(), { tickRate: 20, clockScale: 30, capacity: 2048, seed: 'items-bow' });
  w.populate(); w.land.setup(); run(w, 2);
  const e = w.e;
  let i = -1;
  for (let j = 0; j < e.hi; j++) if (e.kind[j] === Kind.Agent && !(e.flags[j]! & (EFlag.Child | EFlag.Small))) { i = j; break; }
  const id = e.id(i);
  w.survival.add(i, 'bow', 1); w.survival.add(i, 'arrows', 10);
  const m = e.map[i]!;
  let a = -1;
  for (let t = 0; t < 40 && a < 0; t++) { const an = t * 0.9; const sp = w.freeSpot(m, e.x[i]! + Math.cos(an) * 10, e.y[i]! + Math.sin(an) * 10, 3); if (sp) a = w.animals.spawn(m, sp.x, sp.y, 1); } // a deer 10 m away
  assert.ok(a >= 0);
  const aid = e.id(a);
  let shots = 0, killed = false;
  w.listeners.push((ev) => { if (ev.kind === 'shot' && ev.data.id === id) shots++; if (ev.kind === 'hunt' && ev.data.id === id) killed = true; });
  assert.ok(w.brain.hunt(i, aid));
  let minD = Infinity;
  for (let k = 0; k < 20 * 60 && !killed; k++) { w.step(); const s = e.slot(aid); if (s >= 0) minD = Math.min(minD, Math.hypot(e.x[s]! - e.x[i]!, e.y[s]! - e.y[i]!)); }
  assert.ok(shots >= 1, 'shot arrows');
  assert.ok((w.survival.inv(i).arrows ?? 0) <= 10 - shots, 'arrows used up');
  assert.ok(killed, `the deer was killed (${shots} shots, closest ${minD.toFixed(1)} m)`);
  assert.ok(ownText(w, i).includes('bow ('));
});
