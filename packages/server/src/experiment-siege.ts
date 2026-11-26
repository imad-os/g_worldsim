import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Act, EFlag, Kind } from '@worldsim/protocol';
import { loadScenario } from './sim/scenario.js';
import { ageOf } from './sim/people.js';
import { World } from './sim/world.js';

/**
 * Siege experiment (research/EXPERIMENTS.md E9, imad 2026-11-26: "a population of 20 people attacked by 20 zombies, simulate a whole game
 * day; they need to survive it easily; log everything; the kids protected by their parents").
 *
 * 20 people in town: 6 couples with 8 children (two babies, two toddlers, four older children) and 0 singles. The town lives its day
 * from 08:00; at the attack hour 20 zombies (that stay, they do not crumble at dawn) come in from the roads at the edge. The run goes
 * on until 08:00 the next day. Every event goes to <out>/<seed>-events.jsonl, a position sample of everyone every game minute to
 * <seed>-track.jsonl, and the summary (deaths and their causes, hp lost, kids' safety, who carried / fed the little ones) to the console.
 *
 *   node packages/server/dist/experiment-siege.js --seeds s1,s2 --hour 21 --where edge --out research/results/siege [--days 2] [--n 20]
 */
const ROOT = resolve(fileURLToPath(import.meta.url), '../../../..');
const arg = (k: string, d: string) => { const i = process.argv.indexOf('--' + k); return i > 0 ? process.argv[i + 1]! : d; };

export interface SiegeResult {
  seed: string; hour: number; where: string;
  people: number; died: number; kidsDied: number; adultsDied: number; deaths: { name: string; age: number; cause: string; at: string; why: string }[];
  zombies: number; zombiesKilled: number; zombiesLeft: number; bites: number; animalBites: number; kidBites: number; hpLost: number;
  carried: number; turns: number; lowHp: number; minHp: number; parentFights: number; fed: Record<string, number>; carers: Record<string, number>;
  kidsFarFromHome: number; plans: Record<string, number>; alarms: number; firstBlood: string;
}

const ACT: Record<number, string> = Object.fromEntries(Object.entries(Act).map(([k, v]) => [v, k]));
const clock = (w: World) => { const h = (w.gameSec / 3600 + 8) % 24; return `${String(Math.floor(h)).padStart(2, '0')}:${String(Math.floor((h % 1) * 60)).padStart(2, '0')}`; };

/** Turn the populated 20 into families: 6 couples, 8 children (ages in years). */
export function makeFamilies(w: World): { kids: number[]; parents: Map<number, number[]> } {
  const e = w.e, ids: number[] = [];
  for (let i = 0; i < e.hi; i++) if (e.kind[i] === Kind.Agent) ids.push(e.id(i));
  const men = ids.filter((id) => w.profiles.get(id)!.sex === 'm'), women = ids.filter((id) => w.profiles.get(id)!.sex === 'f');
  // Make the sexes even enough: 6 men and 6 women stay adults, the rest are the children.
  while (men.length < 6) { const id = women.pop()!; w.profiles.get(id)!.sex = 'm'; men.push(id); }
  while (women.length < 6) { const id = men.pop()!; w.profiles.get(id)!.sex = 'f'; women.push(id); }
  const couples: [number, number][] = [];
  for (let k = 0; k < 6; k++) couples.push([women[k]!, men[k]!]);
  const kidIds = [...women.slice(6), ...men.slice(6)].slice(0, 8);
  const ages = [0.3, 0.6, 1.4, 2.2, 5, 7, 9, 12];
  const kidOf = [0, 1, 2, 3, 0, 1, 4, 5]; // couple of each child
  const parents = new Map<number, number[]>();
  for (const [f, m] of couples) {
    const pf = w.profiles.get(f)!, pm = w.profiles.get(m)!;
    for (const p of [pf, pm]) { if (ageOf(p, w.gameSec, w.yearSec) < 22) p.born = w.gameSec - 24 * w.yearSec; if (ageOf(p, w.gameSec, w.yearSec) > 45) p.born = w.gameSec - 38 * w.yearSec; p.pregnant = undefined; }
    pf.partner = m; pm.partner = f;
  }
  kidIds.forEach((id, n) => {
    const p = w.profiles.get(id)!, [f, m] = couples[kidOf[n]!]!;
    p.born = w.gameSec - ages[n]! * w.yearSec; p.parents = [f, m]; p.partner = -1; p.generation = 2; p.pregnant = undefined;
    const i = e.slot(id);
    e.flags[i] = e.flags[i]! | EFlag.Child | (ages[n]! < 3 ? EFlag.Small : 0);
    // Children start near their mother.
    const mi = e.slot(f), s = w.freeSpot(e.map[mi]!, e.x[mi]! + 1, e.y[mi]!, 10);
    if (s) w.place(i, e.map[mi]!, s.x, s.y);
    parents.set(id, [f, m]);
  });
  return { kids: kidIds, parents };
}

export function runSiege(seed: string, hour: number, where: 'edge' | 'camp' | 'random', out = '', n = 20): SiegeResult {
  const sc = loadScenario(resolve(ROOT, 'scenarios/post-apocalypse'));
  sc.agents.count = 20;
  sc.life!.maxPopulation = 40;
  const w = new World(sc, { tickRate: 20, clockScale: 10, capacity: 4096, seed });
  w.populate();
  w.land.setup();
  const { kids, parents } = makeFamilies(w);
  const e = w.e, people = new Set<number>();
  for (let i = 0; i < e.hi; i++) if (e.kind[i] === Kind.Agent) people.add(e.id(i));
  const name = (id: number) => w.profiles.get(id)?.name ?? `#${id}`;
  const ev: string[] = [], track: string[] = [];
  const r: SiegeResult = { seed, hour, where, people: people.size, died: 0, kidsDied: 0, adultsDied: 0, deaths: [], zombies: 0, zombiesKilled: 0, zombiesLeft: 0, bites: 0, animalBites: 0, kidBites: 0, hpLost: 0,
    carried: 0, turns: 0, lowHp: 0, minHp: 100, parentFights: 0, fed: {}, carers: {}, kidsFarFromHome: 0, plans: {}, alarms: 0, firstBlood: '' };
  const zIds = new Set<number>();
  const lastSeen = new Map<number, string>(); // what each person last did (for the death reason)
  w.listeners.push((x) => {
    const d = x.data as Record<string, any>;
    ev.push(JSON.stringify({ t: clock(w), k: x.kind, ...d }));
    if (x.kind === 'zombie' && d.how !== 'killed') zIds.add(Number(d.id));
    if (x.kind === 'zombie' && d.how === 'killed' && zIds.has(Number(d.id))) r.zombiesKilled++;
    if (x.kind === 'bitten' && d.animal) r.animalBites++;
    if (x.kind === 'bitten' && !d.animal && people.has(Number(d.id))) { r.bites++; if (kids.includes(Number(d.id))) r.kidBites++; if (!r.firstBlood) r.firstBlood = `${clock(w)} ${name(Number(d.id))}`; }
    if (x.kind === 'tactic') r.plans[d.plan] = (r.plans[d.plan] ?? 0) + 1;
    if (x.kind === 'alarm') r.alarms++;
    if (x.kind === 'care' && d.what !== 'turn') {
      const pr = parents.get(Number(d.kid)), by = Number(d.id);
      const role = pr ? (pr[0] === by ? 'mother' : pr[1] === by ? 'father' : 'other') : 'other';
      r.fed[role] = (r.fed[role] ?? 0) + 1;
    }
    if (x.kind === 'care' && d.what === 'turn') r.turns++;
    if (x.kind === 'death' && people.has(Number(d.id))) {
      const id = Number(d.id), p = w.profiles.get(id);
      r.died++; if (kids.includes(id)) r.kidsDied++; else r.adultsDied++;
      r.deaths.push({ name: name(id), age: p ? Math.round(ageOf(p, w.gameSec, w.yearSec) * 10) / 10 : -1, cause: String(d.cause), at: clock(w), why: lastSeen.get(id) ?? '' });
    }
  });
  // Planned attack at `hour` (game time); runs until 08:00 the next day.
  const toAttack = ((hour - 8 + 24) % 24) * 3600;
  let planned = false;
  const plan = () => { planned = true; w.zombies.plan({ at: w.gameSec, map: 'town', n, where: where === 'camp' && !w.survival.campOf(w.mapIndex.get('town')!) ? 'edge' : where, stays: true }); };
  const end = Number(arg('days', '1')) * 24 * 3600, perMin = 60 / w.opt.clockScale / w.dt; // ticks per game minute
  const hp0 = new Map<number, number>(), minHp = new Map<number, number>();
  const parentOfHeld = new Set<string>();
  for (let k = 0; w.gameSec < end; k++) {
    if (!planned && w.gameSec >= toAttack) plan();
    w.step();
    if (k % 5 === 0) {
      for (const id of people) {
        const i = e.slot(id); if (i < 0) continue;
        const z = w.zombies.nearest(e.map[i]!, e.x[i]!, e.y[i]!, 8);
        lastSeen.set(id, `${ACT[e.act[i]!]}${z >= 0 ? ` zombie ${Math.hypot(e.x[z]! - e.x[i]!, e.y[z]! - e.y[i]!).toFixed(1)} m` : ''} hp ${Math.round(e.hp[i]!)} plan ${w.brain.tactics.planOf(i)}`);
        if (!hp0.has(id)) hp0.set(id, e.hp[i]!);
        if (e.hp[i]! < (minHp.get(id) ?? 1e9)) minHp.set(id, e.hp[i]!);
        const c = w.family.carried[i]!;
        if (c >= 0) parentOfHeld.add(`${name(id)} by ${name(e.id(c))}`);
      }
    }
    if (k % Math.round(perMin) === 0) {
      const row: unknown[] = [clock(w)];
      for (const id of people) { const i = e.slot(id); if (i >= 0) row.push([id, Math.round(e.x[i]! * 10) / 10, Math.round(e.y[i]! * 10) / 10, ACT[e.act[i]!], Math.round(e.hp[i]!), w.family.carer[i]! >= 0 ? e.id(w.family.carer[i]!) : -1]); }
      for (const z of zIds) { const i = e.slot(z); if (i >= 0) row.push(['z' + z, Math.round(e.x[i]!), Math.round(e.y[i]!), ACT[e.act[i]!], Math.round(e.hp[i]!)]); }
      track.push(JSON.stringify(row));
      // Kids (3-13) far from home (more than 40 m from home / camp, and from both parents).
      for (const id of kids) {
        const i = e.slot(id), p = w.profiles.get(id); if (i < 0 || !p) continue;
        const age = ageOf(p, w.gameSec, w.yearSec); if (age < 3 || age >= 14) continue;
        const h = w.survival.homes.homeOf(id) ?? w.survival.homes.homeOf(parents.get(id)![0]!);
        const camp = w.survival.campOf(e.map[i]!);
        const near = (x: number, y: number) => Math.hypot(x - e.x[i]!, y - e.y[i]!) < 40;
        const W = w.maps[e.map[i]!]!.tiles.w;
        const ok = (h && h.m === e.map[i] && near((h.out % W) + 0.5, Math.floor(h.out / W) + 0.5)) || (camp && near(camp.x, camp.y)) || parents.get(id)!.some((pid) => { const j = e.slot(pid); return j >= 0 && e.map[j] === e.map[i] && near(e.x[j]!, e.y[j]!); });
        if (!ok) r.kidsFarFromHome++;
      }
    }
  }
  for (const id of people) { const i = e.slot(id); r.hpLost += (hp0.get(id) ?? 100) - (i >= 0 ? e.hp[i]! : 0); }
  r.hpLost = Math.round(r.hpLost);
  for (const id of people) { const v = minHp.get(id) ?? 100; if (v < 30) r.lowHp++; r.minHp = Math.min(r.minHp, Math.round(Math.max(0, v))); }
  r.zombies = zIds.size; r.zombiesLeft = [...zIds].filter((z) => e.slot(z) >= 0).length;
  r.carried = parentOfHeld.size;
  for (const x of ev) { const d = JSON.parse(x); if (d.k === 'fight' && kids.some((k) => parents.get(k)!.includes(Number(d.id)))) r.parentFights++; }
  for (const k of kids) { const i = e.slot(k); const c = i >= 0 ? w.family.carer[i]! : -1; r.carers[name(k)] = c; }
  for (const k of Object.keys(r.carers)) { const c = r.carers[k]!; (r.carers as Record<string, unknown>)[k] = c >= 0 ? name(e.id(c)) : '-'; }
  if (out) {
    mkdirSync(out, { recursive: true });
    writeFileSync(resolve(out, `${seed}-${hour}-${where}-events.jsonl`), ev.join('\n') + '\n');
    writeFileSync(resolve(out, `${seed}-${hour}-${where}-track.jsonl`), track.join('\n') + '\n');
  }
  return r;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  const out = arg('out', '');
  for (const seed of arg('seeds', 'siege-a').split(',')) for (const hour of arg('hour', '21').split(',').map(Number)) for (const where of arg('where', 'edge').split(',') as ('edge' | 'camp' | 'random')[]) {
    const t0 = Date.now();
    const r = runSiege(seed, hour, where, out, Number(arg('n', '20')));
    console.log(JSON.stringify({ ...r, secs: Math.round((Date.now() - t0) / 1000) }));
  }
}
