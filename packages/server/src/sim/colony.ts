import { Kind, RECIPES_ALL, PLACEABLE, WEAPONS, HUT_NEED } from '@worldsim/protocol';
import { compress, plan, type Facts, type GAction } from './goap.js';
import type { Step } from './tasks.js';
import type { World } from './world.js';
import { HUTS_PER_MAP } from './homes.js';
import { ageOf } from './people.js';
import { ADULT } from './life.js';
import { ORE_CHANCE, ROCK_STONE } from './survival.js';

/**
 * The camp's work mind (research/ARCHITECTURE.md): instead of a fixed list of "if this then that job", the camp has
 * drives (warmth, shelter, food security, defence, tools, comfort) that score how much each goal matters right now, the
 * goals are handed out to whoever fits them best (a small auction: trait fit x value - time it would take, Smith 1980 contract
 * net), and each person plans their own way there with GOAP (sim/goap.ts) from what they carry and what is around them.
 * Plans become ordinary task steps (sim/tasks.ts), so the engine's rules still decide what really happens.
 *
 * People learn (flag `learn`): every step that succeeds or fails is counted per person and per camp (culture: what one
 * learns, others hear about at half the weight), with the real game seconds it took per unit. Plans then cost what things
 * really cost here, and actions that keep failing get dearer (1 / chance of success, Laplace-smoothed), so people stop
 * repeating what does not work and try other ways. A failed planned task is planned again once from where they stand.
 */

/** Game seconds of work (kept in step with sim/survival.ts WORK). */
const WORK = { chop: 120, dig: 100, mine: 240, place: 40, fire: 240, hut: 650, tend: 45, pick: 20, store: 40, plant: 180, repair: 60, hunt: 700, craft: 15 };
const HOUR = 3600;
/** Plans tried per allocation pass and map (counted, not timed, so runs stay deterministic): a big camp is served over a few passes. */
const PLANS_PER_PASS = 24;

export interface PStep { do: string; what?: string; unit?: string }
type Act = GAction<PStep>;
/** Learned outcomes: successes, failures, game seconds per unit (moving average, 0 = not known yet). */
type Know = Record<string, [number, number, number]>;

export interface Goal {
  name: string;
  /** Words for the task (the panel, the bubbles, the memory). */
  text: string;
  /** Alternatives: any one of these fact sets reached is enough. */
  want: Facts[];
  /** A long project (a hut: 20 wood, 10 stone, 5 leather): the many repeats of one action don't each count as a new risk, and the hours weigh less. */
  long?: boolean;
  /** How much it matters now, 0..1. */
  value: number;
  /** Which trait suits it (fit = 0.7 + 0.6 x trait). */
  trait: 'strength' | 'speed' | 'intelligence' | 'courage' | 'empathy';
  /** How many people may work on it at once. */
  crew: number;
  /** A fixed step list instead of planning (exploration). */
  steps?: Step[];
  /** Only for this person (a personal goal). */
  only?: number;
}

const HUNT_OK = [0, 1]; // rabbits and deer: no weapon needed
const DANGER = [2, 3, 4];

export class Colony {
  /** Per map: shared know-how (culture). */
  private readonly culture: Know[];
  /** Plans made / failed to find (stats for experiments and the panel). */
  private readonly explored: number[][] = [];
  private readonly backoff = new Map<string, { n: number; until: number }>();
  stats = { plans: 0, noPlan: 0, nodes: 0, replans: 0, ms: 0 };

  constructor(private w: World) { this.culture = w.maps.map(() => ({})); }

  save(): unknown { return { culture: this.culture }; }
  load(d: unknown): void {
    const v = d as { culture?: Know[] } | undefined;
    v?.culture?.forEach((k, m) => { if (m < this.culture.length && k) this.culture[m] = k; });
  }

  // ------------------------------------------------------------------ learning
  private know(i: number): Know | null {
    const p = this.w.profileOf(i);
    if (!p) return null;
    p.mind ??= { notes: [], summary: '', mood: 'calm', rel: {}, lastPlan: 0 };
    return ((p.mind as { know?: Know }).know ??= {});
  }
  /** A planned step ended (sim/tasks.ts): count it for the person and their camp. */
  record(i: number, key: string, ok: boolean, secs: number, units: number): void {
    if (!this.w.ai.learn || !key) return;
    const m = this.w.e.map[i]!;
    for (const k of [this.know(i), this.culture[m]]) {
      if (!k) continue;
      const r = (k[key] ??= [0, 0, 0]);
      if (ok) {
        r[0]++;
        const spu = secs / Math.max(1, units);
        if (spu > 0 && Number.isFinite(spu)) r[2] = r[2] ? r[2] * 0.7 + spu * 0.3 : spu;
      } else r[1]++;
    }
  }
  /** Chance that an action works (Laplace-smoothed successes / tries, the camp's experience at half weight); 1 without learning. */
  chance(i: number, key: string): number {
    if (!this.w.ai.learn || !key) return 1;
    const me = this.know(i)?.[key], c = this.culture[this.w.e.map[i]!]?.[key];
    const ok = (me?.[0] ?? 0) + 0.5 * (c?.[0] ?? 0), bad = (me?.[1] ?? 0) + 0.5 * (c?.[1] ?? 0);
    return (ok + 1) / (ok + bad + 2);
  }
  /** A goal failed for this person: they leave it alone for a while (2, 4, 8... game hours, at most 2 days); success clears it. */
  outcome(i: number, goal: string, ok: boolean): void {
    if (!this.w.ai.learn) return;
    const id = this.w.e.id(i), k = `${id}|${goal.split('@')[0]}`;
    if (ok) { this.backoff.delete(k); return; }
    const n = (this.backoff.get(k)?.n ?? 0) + 1;
    this.backoff.set(k, { n, until: this.w.gameSec + Math.min(48, 2 ** n) * HOUR });
  }
  private resting(i: number, goal: string): boolean {
    const b = this.backoff.get(`${this.w.e.id(i)}|${goal}`);
    return !!b && b.until > this.w.gameSec;
  }
  /** Cost multiplier and learned seconds per unit for an action. */
  private learned(i: number, key: string): [number, number] {
    if (!this.w.ai.learn) return [1, 0];
    const me = this.know(i)?.[key], c = this.culture[this.w.e.map[i]!]?.[key];
    const ok = (me?.[0] ?? 0) + 0.5 * (c?.[0] ?? 0), bad = (me?.[1] ?? 0) + 0.5 * (c?.[1] ?? 0);
    const p = (ok + 1) / (ok + bad + 2);
    const spu = me?.[2] || c?.[2] || 0;
    return [1 / Math.max(0.12, p), spu];
  }
  /** What a person has learned, for the panel and the prompt: "chop wood 5/0 ~140 s". */
  describe(i: number): string {
    const k = this.know(i);
    if (!k) return '';
    return Object.entries(k).sort((a, b) => b[1][0] + b[1][1] - a[1][0] - a[1][1]).slice(0, 6)
      .map(([n, [s, f, spu]]) => `${n} ${s}/${s + f}${spu ? ` ~${Math.round(spu)}s` : ''}`).join(', ');
  }

  // ------------------------------------------------------------------ what a person knows and can do
  /** Facts: what they carry, plus the camp's state (fire, fuel, food in store); goals count new things (+hut...) from 0. */
  facts(i: number): Facts {
    const w = this.w, e = w.e, sv = w.survival, m = e.map[i]!, camp = sv.campOf(m);
    const f: Facts = {};
    for (const [k, n] of Object.entries(sv.inv(i))) if (n) f[k] = n;
    f.food = e.carry[i]!;
    f.armed = sv.weapon(i)[1] > 0 ? 1 : 0;
    const fire = camp ? sv.fireNear(m, camp.x, camp.y, 15) : sv.nearestFire(i, 30);
    f.fire = fire >= 0 ? 1 : 0;
    f.fuel = fire >= 0 ? sv.fuel(m, fire) : 0;
    f.stash = sv.stash[m]?.food ?? 0;
    f.broken = sv.damaged(m) >= 0 ? 1 : 0;
    return f;
  }

  /** The actions open to person i here (sources must be within reach), with costs from distance, work and experience. */
  actions(i: number): Act[] {
    const w = this.w, e = w.e, sv = w.survival, T = sv.T, m = e.map[i]!, x = e.x[i]!, y = e.y[i]!;
    const tr = (d: number) => (d / Math.max(0.3, w.sc.agents.walk)) * w.opt.clockScale; // game seconds to walk d metres
    const dist = (t: number) => { if (t < 0) return Infinity; const k = sv.findTile(i, t); const W = w.maps[m]!.tiles.w; return k < 0 ? Infinity : Math.hypot((k % W) + 0.5 - x, ((k / W) | 0) + 0.5 - y); };
    const dTree = dist(T.tree), dRubble = dist(T.rubble), dRock = dist(T.rock);
    const camp = sv.campOf(m), dCamp = camp ? Math.hypot(camp.x - x, camp.y - y) : 0;
    const out: Act[] = [];
    const add = (key: string, a: Omit<Act, 'key' | 'cost'>, prior: (s: Facts) => number) => {
      const [mult, spu] = this.learned(i, key);
      const unit = a.step.unit;
      out.push({ ...a, key, cost: (s) => {
        const base = prior(s);
        // Learned seconds per unit replace the guess (blended half and half so one bad day does not stick).
        const per = unit && spu ? (base * 0.5 + spu * ((typeof a.add === 'function' ? a.add(s) : a.add)[unit] ?? 1) * 0.5) : base;
        return per * mult;
      } });
    };
    // Amortised walking per unit (the first trip is the long one); sources far off (known, past 60 m) cost the trip again.
    const hop = (d: number) => tr(4 + Math.min(d, 60) / 4 + Math.max(0, d - 60) / 2);
    if (Number.isFinite(dTree)) add('gather:wood', { add: (s) => ({ wood: (s.axe ?? 0) > 0 ? 2 : 1 }), step: { do: 'gather', what: 'wood', unit: 'wood' } }, () => WORK.chop + hop(dTree));
    const dStone = Math.min(dRubble, dRock);
    if (Number.isFinite(dStone)) add('gather:stone', { add: { stone: 1 }, step: { do: 'gather', what: 'stone', unit: 'stone' } }, () => dRock <= dRubble ? (WORK.mine + hop(dRock)) / ROCK_STONE : (WORK.dig + hop(dRubble)) / 0.5);
    if (Number.isFinite(dRock)) add('gather:ore', { add: { ore: 1 }, step: { do: 'gather', what: 'ore', unit: 'ore' } }, () => (WORK.mine + hop(dRock)) / ORE_CHANCE);
    if (Number.isFinite(dRubble)) {
      add('gather:brick', { add: { brick: 1 }, step: { do: 'gather', what: 'brick', unit: 'brick' } }, () => (WORK.dig + hop(dRubble)) / 0.5);
      add('gather:scrap', { add: { scrap: 1 }, step: { do: 'gather', what: 'scrap', unit: 'scrap' } }, () => (WORK.dig + hop(dRubble)) / 0.3);
    }
    // Food lying around (kept, not eaten).
    let dItem = Infinity;
    for (let j = 0; j < e.hi; j++) if (e.kind[j] === Kind.Item && e.map[j] === m) dItem = Math.min(dItem, Math.hypot(e.x[j]! - x, e.y[j]! - y));
    if (dItem < 90) add('collect:food', { add: { food: 1 }, step: { do: 'collect', what: 'food', unit: 'food' } }, () => WORK.pick + tr(Math.min(dItem, 40) / 2 + 6));
    // Hunting: an easy animal, or a dangerous one (claws) when armed.
    for (const [types, needArmed] of [[HUNT_OK, false], [DANGER, true]] as const) {
      let best = -1, bd = w.ai.instinct ? 220 : 90;
      for (const t of types) { const a = w.animals.nearest(m, x, y, w.ai.instinct ? 220 : 90, t); if (a >= 0) { const d = Math.hypot(e.x[a]! - x, e.y[a]! - y); if (d < bd) { bd = d; best = a; } } }
      if (best < 0) continue;
      const drops = w.animals.dropsOf(e.sub[best]!);
      const name = w.animals.typeName(e.sub[best]!);
      add(`hunt:${needArmed ? 'big' : 'small'}`, { pre: needArmed ? { armed: 1 } : undefined, add: { food: drops.meat, leather: drops.leather, claw: drops.claw }, step: { do: 'hunt', what: name } }, () => WORK.hunt + tr(bd));
    }
    // Crafting: every recipe of the shared table (things that are put down are built straight from materials below).
    const placed = new Set<string>(PLACEABLE);
    RECIPES_ALL.forEach((r, k) => {
      if (placed.has(r.what)) return;
      const give: Facts = { [r.what]: r.n ?? 1 };
      if (WEAPONS[r.what]) give.armed = 1;
      add(`craft:${r.what}#${k}`, { use: r.need as Facts, add: give, step: { do: 'craft', what: r.what } }, () => WORK.craft);
    });
    // Building at the camp.
    const toCamp = tr(dCamp);
    if (sv.enabled) {
      if (sv.homes.builtBy(e.id(i), m) < HUTS_PER_MAP) add('build:hut', { use: { ...HUT_NEED }, add: { '+hut': 1 }, step: { do: 'build', what: 'hut' } }, () => WORK.hut + toCamp);
      add('build:campfire', { use: { wood: 3, stone: 2 }, add: { fire: 1, fuel: 10, '+fire': 1 }, step: { do: 'build', what: 'campfire' } }, () => WORK.fire + toCamp);
      add('tend', { pre: { fire: 1 }, use: { wood: 1 }, add: { fuel: 4 }, step: { do: 'tend', unit: 'fuel' } }, () => WORK.tend + toCamp);
      add('repair', { use: { wood: 1, broken: 1 }, add: { '+repaired': 1 }, step: { do: 'repair' } }, () => WORK.repair + toCamp);
      for (const r of RECIPES_ALL) {
        if (!placed.has(r.what) || r.what === 'campfire') continue;
        const fact = r.what === 'palisade' || r.what === 'stonewall' ? '+wall' : '+' + r.what;
        add(`build:${r.what}`, { use: r.need as Facts, add: { [fact]: 1 }, step: { do: 'build', what: r.what } }, () => WORK.place + WORK.craft + toCamp);
        add(`place:${r.what}`, { use: { [r.what]: 1 }, add: { [fact]: 1 }, step: { do: 'build', what: r.what } }, () => WORK.place + toCamp); // one already made
      }
      if (camp) {
        add('store:food', { use: { food: 1 }, add: { stash: 1 }, step: { do: 'store', what: 'food' } }, () => (WORK.store + toCamp) / 3);
        add('farm', { add: { '+field': 1 }, step: { do: 'farm' } }, () => WORK.plant + toCamp);
      }
    }
    // The owner's strict rules: forbidden actions are not on the menu.
    const rule = (a: Act) => {
      const d = a.step.do, rn = d === 'collect' ? 'collect' : d === 'store' ? 'store' : d;
      return !w.rules.forbidden(i, rn);
    };
    return out.filter(rule);
  }

  /** The cheapest plan for one of the goal's alternatives, as task steps (null = no way from here). */
  planFor(i: number, g: Goal): { steps: Step[]; cost: number; p: number } | null {
    if (g.steps) return { steps: g.steps, cost: 1800, p: this.chance(i, g.steps[0]?.key ?? '') };
    const t0 = performance.now();
    const s = this.facts(i), acts = this.actions(i);
    let best: { steps: Step[]; cost: number; p: number } | null = null;
    for (const want0 of g.want) {
      // Goals are relative for the camp's new things (+hut...), absolute for what one carries.
      const want: Facts = {};
      for (const [k, n] of Object.entries(want0)) want[k] = n;
      const p = plan(s, want, acts, { maxNodes: 5000, maxDepth: 64 }) // a hut is 20 wood + 10 stone + 5 leather: 40+ steps;
      this.stats.nodes += p?.expanded ?? 0;
      if (!p || !p.actions.length) continue;
      if (best && p.cost >= best.cost) continue;
      // The plan's chance of working: every step has to (what the person and the camp learned).
      let pr = 1;
      for (const a of p.actions) pr *= this.chance(i, a.key);
      best = { steps: this.toSteps(s, p.actions), cost: p.cost, p: pr };
    }
    this.stats.ms += performance.now() - t0;
    if (best) this.stats.plans++; else this.stats.noPlan++;
    return best;
  }

  /**
   * A way to make or build one thing someone asked for (an LLM's one-step plan, the keyword net, an order): the task steps
   * up to and including it, or in plain words why there is no way from here (what is missing and that nothing around gives it).
   */
  planTo(i: number, kind: 'craft' | 'build', what: string): Step[] | string {
    const sv = this.w.survival, have = sv.inv(i)[what] ?? 0;
    const fact = what === 'hut' ? '+hut' : what === 'campfire' ? '+fire' : what === 'palisade' || what === 'stonewall' ? '+wall' : '+' + what;
    const want: Facts[] = kind === 'craft' ? [{ [what]: have + 1 }] : [{ [fact]: 1 }];
    const p = this.planFor(i, { name: 'asked', text: what, want, value: 1, trait: 'intelligence', crew: 1 });
    if (p) return p.steps;
    const miss = sv.missing(i, what);
    if (!miss.length) return kind === 'build' && !sv.enabled ? 'this world has no buildings' : `I don't know how to ${kind} ${what} here`;
    const acts = this.actions(i), made = new Set<string>();
    for (const a of acts) for (const k of Object.keys(typeof a.add === 'function' ? a.add({}) : a.add)) made.add(k);
    const SRC: Record<string, string> = { wood: 'trees', stone: 'rubble or rocks', ore: 'rocks', brick: 'rubble', scrap: 'rubble', leather: 'animals to hunt', claw: 'wolves or bears to hunt', food: 'food' };
    const need = miss.map(([k, n]) => `${n} ${k}`).join(' and ');
    const none = miss.filter(([k]) => !made.has(k)).map(([k]) => SRC[k] ?? k);
    return none.length ? `I need ${need}, and there are no ${none.join(' or ')} anywhere I know of here` : `I need ${need} and could not work out a way to get it`;
  }

  /** Plan actions -> task steps: same actions grouped (gather all the wood in one go), counts in units. */
  private toSteps(s0: Facts, acts: Act[]): Step[] {
    // Group: run the plan again, each time preferring another of the same action when it is still possible.
    const left = [...acts], order: Act[] = [];
    let s = { ...s0 };
    const can = (a: Act, st: Facts) => Object.entries(a.pre ?? {}).every(([k, n]) => (st[k] ?? 0) >= n) && Object.entries(a.use ?? {}).every(([k, n]) => (st[k] ?? 0) >= n);
    while (left.length) {
      const last = order[order.length - 1];
      let k = last ? left.findIndex((a) => a.key === last.key && can(a, s)) : -1;
      if (k < 0) k = left.findIndex((a) => can(a, s));
      if (k < 0) k = 0;
      const a = left.splice(k, 1)[0]!;
      const add = typeof a.add === 'function' ? a.add(s) : a.add;
      const n: Facts = { ...s };
      for (const [f, v] of Object.entries(a.use ?? {})) n[f] = (n[f] ?? 0) - v;
      for (const [f, v] of Object.entries(add)) n[f] = (n[f] ?? 0) + v;
      (a as Act & { _gain?: number })._gain = a.step.unit ? add[a.step.unit] ?? 1 : 1;
      order.push(a); s = n;
    }
    const steps: Step[] = [];
    for (const [a, times] of compress(order)) {
      const st: Step = { do: a.step.do, key: a.key };
      if (a.step.what) st.what = a.step.what;
      const units = a.step.unit ? Math.round(order.filter((x) => x === a).length && times * ((a as Act & { _gain?: number })._gain ?? 1)) : times;
      if (a.step.do === 'gather' || a.step.do === 'collect' || a.step.do === 'hunt') st.times = units;
      st.units = units;
      // A repeated build (several wall pieces) is several steps, each one piece.
      if (a.step.do === 'build' && times > 1) for (let k = 0; k < times; k++) steps.push({ ...st, units: 1 });
      else if (a.step.do === 'craft' && times > 1) for (let k = 0; k < times; k++) steps.push({ ...st, units: 1 });
      else steps.push(st);
    }
    return steps.slice(0, 12);
  }

  // ------------------------------------------------------------------ the camp's drives
  /** What the camp on map m needs now, most important first. */
  goals(m: number, people: number[], hour: number): Goal[] {
    const w = this.w, sv = w.survival, camp = sv.campOf(m), n = people.length;
    const gs: Goal[] = [];
    const threat = w.zombies.perNight > 0 || w.zombies.plans.some((x) => x.map === w.maps[m]!.def.id) || w.zombies.count(m) > 0;
    const cx = camp?.x ?? 0, cy = camp?.y ?? 0;
    const fire = camp ? sv.fireNear(m, cx, cy, 15) : -1;
    const fuel = fire >= 0 ? sv.fuel(m, fire) : 0;
    const evening = hour >= 15 && hour < 23, day = hour >= 7 && hour < 18;
    // Warmth and light: a fire for the night, kept burning.
    if (fire < 0 && (evening || (threat && (hour >= 19 || hour < 6)))) gs.push({ name: 'fire', text: 'make a campfire for the night', want: [{ '+fire': 1 }], value: 0.95, trait: 'intelligence', crew: 1 });
    else if (fire >= 0 && fuel < 5) gs.push({ name: 'fuel', text: 'keep the fire going', want: [{ fuel: fuel + 4 }], value: 0.85 - fuel * 0.08, trait: 'empathy', crew: 1 });
    // Shelter: a home for every household (sim/homes.ts; a hut's door opens only for its family), at least one hut per two people.
    // Only as many as households without a home that no free hut can take (huts are dear: move into a free one first).
    const roofs = sv.huts[m]!.length, needRoofs = roofs + sv.homes.needed(m); void n;
    if (roofs < needRoofs && day) gs.push({ name: 'hut', text: 'build a hut to sleep in', want: [{ '+hut': 1 }], long: true, value: 0.45 + 0.4 * ((needRoofs - roofs) / needRoofs), trait: 'strength', crew: needRoofs - roofs });
    if (camp && sv.damaged(m) >= 0) gs.push({ name: 'repair', text: 'repair the huts', want: [{ '+repaired': 1 }], value: 0.7, trait: 'strength', crew: 1 });
    if (camp && roofs) {
      // Safety: doors in the doorways and gates, a wall round the camp, spikes outside it.
      if (sv.doorSite(m) >= 0 || sv.gateSite(m) >= 0) gs.push({ name: 'door', text: 'put a door on a hut', want: [{ '+door': 1 }], value: threat ? 0.75 : 0.35, trait: 'intelligence', crew: 1 });
      const [up, left] = sv.campDefence(m);
      // The wall goes up round what it protects: once the huts stand (or at once when zombies come).
      if (left > 0 && (roofs >= needRoofs || threat)) gs.push({ name: 'wall', text: 'build the wall round the camp', want: [{ '+wall': 2 }], value: threat ? 0.7 : 0.22, trait: 'strength', crew: threat ? 3 : 1 });
      else if (up > 0 && threat && sv.defenceSite(m, 'spikes') >= 0) gs.push({ name: 'spikes', text: 'put spikes outside the wall', want: [{ '+spikes': 1 }], value: 0.4, trait: 'courage', crew: 1 });
      if (sv.countTiles(m, sv.T.bed) < roofs) gs.push({ name: 'bed', text: 'put a bed in a hut', want: [{ '+bed': 1 }], value: 0.22, trait: 'intelligence', crew: 1 });
      if (!sv.lampNear(m, cx, cy, 10)) gs.push({ name: 'lamp', text: 'put a lamp at the camp', want: [{ '+lamp': 1 }], value: threat ? 0.35 : 0.15, trait: 'intelligence', crew: 1 });
    }
    // Food security: a store with two portions a head, fields to grow more.
    if (camp) {
      const st = sv.stash[m]?.food ?? 0;
      if (st < n * 2) gs.push({ name: 'store', text: 'collect food and store it', want: [{ stash: st + 3 }], value: 0.25 + 0.4 * (1 - st / (n * 2)), trait: 'empathy', crew: Math.max(1, Math.ceil(n / 4)) });
      let fields = 0;
      for (const k of sv.farms.keys()) if (k.startsWith(m + ':')) fields++;
      if (fields < Math.ceil(n / 2)) gs.push({ name: 'field', text: 'plant a field', want: [{ '+field': 1 }], value: 0.3, trait: 'intelligence', crew: 1 });
    }
    // Each person's own kit: an axe, a weapon when zombies come, clothes from leather, wood for the fire.
    for (const i of people) {
      const v = sv.inv(i), armed = sv.weapon(i)[1] > 0;
      if (!(v.axe ?? 0)) gs.push({ name: 'axe', text: 'make an axe', want: [{ axe: 1 }], value: 0.28, trait: 'intelligence', crew: 1, only: i });
      // Fear of what may come (instinct): a weapon even on quiet days, more so under threat.
      if ((threat || w.ai.instinct) && !armed) gs.push({ name: 'weapon', text: 'make a weapon', want: [{ spear: 1 }, { sword: 1 }], value: threat ? 0.6 : 0.26, trait: 'courage', crew: 1, only: i });
      // A bow and arrows for the quick and brave (imad 2026-11-26: people use what things are for): they hunt from afar (Brain.bowShot).
      // Only with a home already (or leather to spare): a hut needs 5 leather and leather is scarce.
      const tq = w.profileOf(i)?.traits;
      if (tq && (tq.speed + tq.courage) / 2 > 0.5) {
        if (!(v.bow ?? 0) && (v.leather ?? 0) >= 1 && (sv.homes.homeOf(w.e.id(i)) || (v.leather ?? 0) >= 6)) gs.push({ name: 'bow', text: 'make a bow', want: [{ bow: 1 }], value: 0.24, trait: 'speed', crew: 1, only: i });
        else if ((v.bow ?? 0) && (v.arrows ?? 0) < 5) gs.push({ name: 'arrows', text: 'make arrows', want: [{ arrows: (v.arrows ?? 0) + 5 }], value: 0.22, trait: 'intelligence', crew: 1, only: i });
      }
      if ((v.leather ?? 0) >= 1 && !(v.clothes ?? 0) && !(v.armor ?? 0)) gs.push({ name: 'clothes', text: 'make clothes', want: [{ clothes: 1 }, { armor: 1 }], value: 0.3, trait: 'intelligence', crew: 1, only: i });
      if (fire >= 0 && (v.wood ?? 0) < 3) gs.push({ name: 'firewood', text: 'gather firewood', want: [{ wood: (v.wood ?? 0) + 4 }], value: 0.18, trait: 'strength', crew: 1, only: i });
    }
    // Offspring (instinct): a single adult looks for a partner among the single adults they know best (the rules of
    // courting still decide, sim/life.ts); more so with age and no children yet, never past the world's population cap.
    if (w.ai.instinct && day) {
      let living = 0;
      for (const q of w.profiles.values()) if (q.died === undefined) living++;
      if (living < w.brain.life.maxPopulation) for (const i of people) {
        const p = w.profileOf(i), id = w.e.id(i);
        if (!p || p.partner >= 0 || p.player) continue;
        const age = ageOf(p, w.gameSec, w.yearSec);
        if (age < ADULT + 2 || age > 45) continue;
        let best = -1, bv = -Infinity;
        for (const j of people) {
          const q = w.profileOf(j), jd = w.e.id(j);
          if (!q || j === i || q.partner >= 0 || q.player || q.sex === p.sex) continue;
          const qa = ageOf(q, w.gameSec, w.yearSec);
          if (qa < ADULT + 2 || qa > 45 || p.parents.some((x) => q.parents.includes(x)) || p.parents.includes(jd) || q.parents.includes(id)) continue;
          const v = (p.bonds?.['#' + jd] ?? 0) + (p.mind?.rel['#' + jd] ?? 0) * 2 - Math.abs(qa - age) * 0.1;
          if (v > bv) { bv = v; best = jd; }
        }
        if (best < 0) continue;
        let kids = 0;
        for (const q of w.profiles.values()) if (q.parents.includes(id)) kids++;
        gs.push({ name: 'family', text: `get closer to ${w.profiles.get(best)!.name}`, want: [], value: 0.1 + (age > 22 && !kids ? 0.08 : 0) + Math.min(0.08, Math.max(0, bv) * 0.02),
          trait: 'empathy', crew: 1, only: i, steps: [{ do: 'court', who: best, key: 'court' }] });
      }
    }
    // Exploring: the ruins may hold food, scrap, a spear (no plan: the outcome is unknown, that is the point).
    // Curiosity wears off: every search in the last 12 game hours halves the wish to search again (until something is found).
    const recent = (this.explored[m] ??= []).filter((t) => t > w.gameSec - 12 * HOUR);
    this.explored[m] = recent;
    gs.push({ name: 'explore', text: 'search the ruins', want: [], value: 0.12 / (1 + recent.length), trait: 'speed', crew: 1, steps: [{ do: 'loot', times: 2, key: 'loot' }] });
    return gs.sort((a, b) => b.value - a.value);
  }

  /**
   * Hand out the camp's goals to the free people of map m: goals by value, each to the candidate with the best
   * value x fit - hours of work x 0.04 (the plan's own cost), skipping goals already being worked on by enough people.
   */
  allocate(m: number, free: number[], all: number[], hour: number, from: (i: number) => string): number {
    const w = this.w, e = w.e;
    if (!free.length) return 0;
    const busy = new Map<string, number>();
    for (const i of all) { const g = (w.profileOf(i)?.mind?.task as { goal?: string } | undefined)?.goal; if (g) busy.set(g, (busy.get(g) ?? 0) + 1); }
    let started = 0, budget = PLANS_PER_PASS;
    for (const g of this.goals(m, all, hour)) {
      if (!free.length || budget <= 0) break;
      let crew = g.crew - (busy.get(g.only !== undefined ? `${g.name}@${e.id(g.only)}` : g.name) ?? 0);
      while (crew-- > 0 && free.length) {
        const fit = (i: number) => 0.7 + 0.6 * (w.profileOf(i)?.traits[g.trait] ?? 0.5);
        const cands = (g.only !== undefined ? free.filter((i) => i === g.only) : [...free].sort((a, b) => fit(b) - fit(a))).filter((i) => !this.resting(i, g.name)).slice(0, 3);
        let bi = -1, bn = 0.04, bp: { steps: Step[]; cost: number; p: number } | null = null;
        for (const i of cands) {
          if (budget-- <= 0) break;
          const p = this.planFor(i, g);
          if (!p) continue;
          const pr = g.long ? [...new Set(p.steps.map((s) => s.key ?? ''))].reduce((a, k) => a * this.chance(i, k), 1) : p.p;
          const net = g.value * fit(i) * pr - (p.cost / HOUR) * (g.long ? 0.008 : 0.04) + w.rng.next() * 0.02;
          if (net > bn) { bn = net; bi = i; bp = p; }
        }
        if (bi < 0 || !bp) break;
        if (!w.tasks.start(bi, g.text, from(bi), bp.steps)) break;
        const t = w.profileOf(bi)!.mind!.task as { goal?: string };
        t.goal = g.only !== undefined ? `${g.name}@${e.id(bi)}` : g.name;
        if (g.name === 'explore') (this.explored[m] ??= []).push(w.gameSec);
        free.splice(free.indexOf(bi), 1);
        started++;
      }
    }
    return started;
  }

  /** A planned task failed: plan once more from here for the same goal (the failure already made that way dearer). */
  replan(i: number, goal: string, text: string, from: string, tries: number): boolean {
    const w = this.w, e = w.e;
    if (!w.ai.goap || tries >= 2 || e.kind[i] !== Kind.Agent) return false;
    if (e.hunger[i]! > 60 || e.thirst[i]! > 60 || e.tired[i]! > 75) return false;
    const m = e.map[i]!, name = goal.split('@')[0]!;
    const people: number[] = [];
    for (let j = 0; j < e.hi; j++) if (e.kind[j] === Kind.Agent && e.map[j] === m) people.push(j);
    const g = this.goals(m, people, w.brain.hour()).find((x) => x.name === name && (x.only === undefined || x.only === i));
    if (!g || g.steps) return false;
    const p = this.planFor(i, g);
    if (!p) return false;
    if (!w.tasks.start(i, text, from, p.steps)) return false;
    const t = w.profileOf(i)!.mind!.task as { goal?: string; tries?: number };
    t.goal = goal; t.tries = tries + 1;
    this.stats.replans++;
    return true;
  }
}
