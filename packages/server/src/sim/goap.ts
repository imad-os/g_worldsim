/**
 * Goal-Oriented Action Planning (GOAP; Orkin 2006, "Three States and a Plan: the AI of F.E.A.R.") over numeric facts.
 *
 * A person knows a few facts about themselves and the camp (wood carried, an axe or not, huts standing, fuel in the fire...)
 * and a set of actions, each with what it needs, what it uses up, what it gives and what it costs (game seconds). A goal
 * is a set of facts to reach ("hut >= 1"). The planner searches forward with A* for the cheapest sequence of actions, so
 * it finds ways nobody wrote down: to build a hut it gathers the wood and stone it lacks, and when there is a lot of wood
 * to chop it may make an axe first because chopping with one gives twice the wood. New recipes become new actions without
 * new code (sim/colony.ts builds the actions from the shared recipe table).
 *
 * The heuristic is a relaxed, stock-aware "additive" estimate (Bonet & Geffner 2001, HSP): what is still missing, bought with
 * the cheapest producer of each fact, ingredients included, ignoring the order of the actions. It is not strictly admissible
 * (it can over-count shared ingredients), which only makes plans slightly less than optimal in rare cases; the node budget
 * keeps the cost bounded. Pure function of its inputs: deterministic, no world access, cheap to test.
 */
export type Facts = Record<string, number>;

export interface GAction<S = unknown> {
  /** Unique name, e.g. "gather:wood" or "craft:spear#1". */
  key: string;
  /** Needed, not used up (a tool, a fire to feed). */
  pre?: Facts;
  /** Used up. */
  use?: Facts;
  /** Given (a function when it depends on the state, e.g. more wood with an axe). */
  add: Facts | ((s: Facts) => Facts);
  /** Game seconds (a function when it depends on the state). */
  cost: number | ((s: Facts) => number);
  /** What the executor runs (sim/tasks.ts step), opaque here. */
  step: S;
  /**
   * The facts a function `add` / `cost` reads ([] = none: they give the same at every state). Left out = they may read
   * anything. Only a speed hint: the planner then works them out once per value of those facts instead of at every state.
   */
  reads?: string[];
}

export interface Plan<S = unknown> { actions: GAction<S>[]; cost: number; expanded: number }

const addOf = (a: GAction, s: Facts) => (typeof a.add === 'function' ? a.add(s) : a.add);
const costOf = (a: GAction, s: Facts) => (typeof a.cost === 'function' ? a.cost(s) : a.cost);

function applicable(a: GAction, s: Facts): boolean {
  if (a.pre) for (const k in a.pre) if ((s[k] ?? 0) < a.pre[k]!) return false;
  if (a.use) for (const k in a.use) if ((s[k] ?? 0) < a.use[k]!) return false;
  return true;
}
function apply(a: GAction, s: Facts): Facts {
  const n: Facts = { ...s };
  if (a.use) for (const k in a.use) n[k] = (n[k] ?? 0) - a.use[k]!;
  const add = addOf(a, s);
  for (const k in add) n[k] = (n[k] ?? 0) + add[k]!;
  return n;
}
function satisfied(s: Facts, goal: Facts): boolean {
  for (const k in goal) if ((s[k] ?? 0) < goal[k]!) return false;
  return true;
}

/** Relaxed cost of reaching `goal` from `s`: stock first, then the cheapest producer of each missing unit (recursively). */
export function relaxed(s: Facts, goal: Facts, actions: GAction[], producers: Map<string, GAction[]>): number {
  const stock: Facts = { ...s };
  let total = 0;
  const visiting = new Set<string>();
  const need = (f: string, n: number, depth: number): boolean => {
    const have = Math.max(0, stock[f] ?? 0), take = Math.min(have, n);
    stock[f] = have - take; n -= take;
    if (n <= 1e-9) return true;
    if (depth > 6 || visiting.has(f)) return false;
    const ps = producers.get(f);
    if (!ps?.length) return false;
    // Producers by cost per unit, judged at the start state; the first one whose own needs can be met is used.
    const cand: [GAction, number, number][] = [];
    for (const a of ps) {
      const y = addOf(a, s)[f] ?? 0;
      if (y > 0) cand.push([a, costOf(a, s) / y, y]);
    }
    cand.sort((p, q) => p[1] - q[1]);
    visiting.add(f);
    let ok = false;
    for (const [best, , by] of cand) {
      const saved = { ...stock }, t0 = total;
      const times = Math.ceil(n / by - 1e-9);
      total += times * costOf(best, s);
      ok = true;
      if (best.use) for (const k in best.use) ok = need(k, best.use[k]! * times, depth + 1) && ok;
      if (best.pre) for (const k in best.pre) if ((s[k] ?? 0) < best.pre[k]!) ok = need(k, best.pre[k]! - (s[k] ?? 0), depth + 1) && ok;
      if (ok) break;
      for (const k in stock) delete stock[k];
      Object.assign(stock, saved); total = t0;
    }
    visiting.delete(f);
    return ok;
  };
  for (const k in goal) if (!need(k, goal[k]!, 0)) return Infinity;
  return total;
}

/** Index the producers of each fact once per action set. */
export function producersOf(actions: GAction[], s: Facts): Map<string, GAction[]> {
  const m = new Map<string, GAction[]>();
  for (const a of actions) for (const k in addOf(a, s)) { let l = m.get(k); if (!l) m.set(k, (l = [])); l.push(a); }
  return m;
}

/** A small binary heap of [f, node]. */
class Heap<T> {
  private f: number[] = []; private v: T[] = [];
  get size(): number { return this.f.length; }
  push(f: number, v: T): void {
    let i = this.f.length; this.f.push(f); this.v.push(v);
    while (i > 0) { const p = (i - 1) >> 1; if (this.f[p]! <= f) break; this.f[i] = this.f[p]!; this.v[i] = this.v[p]!; i = p; }
    this.f[i] = f; this.v[i] = v;
  }
  pop(): T {
    const top = this.v[0]!, lf = this.f.pop()!, lv = this.v.pop()!;
    if (this.f.length) {
      let i = 0; const n = this.f.length;
      for (;;) { let c = 2 * i + 1; if (c >= n) break; if (c + 1 < n && this.f[c + 1]! < this.f[c]!) c++; if (this.f[c]! >= lf) break; this.f[i] = this.f[c]!; this.v[i] = this.v[c]!; i = c; }
      this.f[i] = lf; this.v[i] = lv;
    }
    return top;
  }
}

interface Node { s: Facts; g: number; act: GAction | null; parent: Node | null; depth: number }

/**
 * The reference planner: plain objects, easy to read. `plan` below gives exactly the same answers (test ai.goap.test.ts
 * compares them), only faster.
 *
 * The cheapest plan from `start` to `goal`, or null when there is none within `maxNodes` expansions / `maxDepth` actions.
 * States are compared on the facts the actions and the goal mention (rounded to 1/100), so different orders of the
 * same work collapse into one state.
 */
export function planRef<S>(start: Facts, goal: Facts, actions: GAction<S>[], opts: { maxNodes?: number; maxDepth?: number } = {}): Plan<S> | null {
  const maxNodes = opts.maxNodes ?? 4000, maxDepth = opts.maxDepth ?? 40;
  if (satisfied(start, goal)) return { actions: [], cost: 0, expanded: 0 };
  const keys = new Set<string>(Object.keys(goal));
  for (const a of actions) { for (const k in a.pre ?? {}) keys.add(k); for (const k in a.use ?? {}) keys.add(k); for (const k in addOf(a, start)) keys.add(k); }
  const order = [...keys].sort();
  const keyOf = (s: Facts) => order.map((k) => Math.round((s[k] ?? 0) * 100)).join(',');
  const producers = producersOf(actions, start);
  const h0 = relaxed(start, goal, actions, producers);
  if (!Number.isFinite(h0)) return null;
  const open = new Heap<Node>(), best = new Map<string, number>();
  open.push(h0, { s: start, g: 0, act: null, parent: null, depth: 0 });
  best.set(keyOf(start), 0);
  let expanded = 0;
  while (open.size && expanded < maxNodes) {
    const n = open.pop();
    if (satisfied(n.s, goal)) {
      const out: GAction<S>[] = [];
      for (let k: Node | null = n; k && k.act; k = k.parent) out.unshift(k.act as GAction<S>);
      return { actions: out, cost: n.g, expanded };
    }
    if ((best.get(keyOf(n.s)) ?? Infinity) < n.g) continue; // a cheaper way here was found later
    expanded++;
    if (n.depth >= maxDepth) continue;
    for (const a of actions) {
      if (!applicable(a, n.s)) continue;
      const s2 = apply(a, n.s), g2 = n.g + costOf(a, n.s), k2 = keyOf(s2);
      if ((best.get(k2) ?? Infinity) <= g2) continue;
      const h = relaxed(s2, goal, actions, producers);
      if (!Number.isFinite(h)) continue;
      best.set(k2, g2);
      open.push(g2 + h, { s: s2, g: g2, act: a, parent: n, depth: n.depth + 1 });
    }
  }
  return null;
}

/** A plan() state: one number per fact the goal or the actions mention (order = the sorted fact names). */
type St = Float64Array;
/** What an action gives and costs at some state: the facts it adds (indexes, amounts) and its cost. */
interface Eff { ai: number[]; av: number[]; cost: number }
interface CAct<S> { a: GAction<S>; pre: number[]; preV: number[]; use: number[]; useV: number[]; fixed: Eff | null; dep: number[] | null; memo: Map<string | number, Eff> }
class Unindexed extends Error {}

/**
 * The cheapest plan from `start` to `goal`, or null when there is none within `maxNodes` expansions / `maxDepth` actions.
 * States are compared on the facts the actions and the goal mention (rounded to 1/100), so different orders of the
 * same work collapse into one state.
 *
 * Same search as `planRef`, on number arrays instead of objects (the planner was the server's biggest pause: up to 0.4 s
 * planning huts, imad 2026-11-27 "the server struggles"): facts by index, a journal instead of copies in the heuristic,
 * and what each action gives and costs worked out once per value of the facts it reads (`GAction.reads`).
 */
export function plan<S>(start: Facts, goal: Facts, actions: GAction<S>[], opts: { maxNodes?: number; maxDepth?: number } = {}): Plan<S> | null {
  try { return planFast(start, goal, actions, opts); } catch (err) { if (err instanceof Unindexed) return planRef(start, goal, actions, opts); throw err; }
}

function planFast<S>(start: Facts, goal: Facts, actions: GAction<S>[], opts: { maxNodes?: number; maxDepth?: number }): Plan<S> | null {
  const maxNodes = opts.maxNodes ?? 4000, maxDepth = opts.maxDepth ?? 40;
  if (satisfied(start, goal)) return { actions: [], cost: 0, expanded: 0 };
  const keys = new Set<string>(Object.keys(goal));
  for (const a of actions) { for (const k in a.pre ?? {}) keys.add(k); for (const k in a.use ?? {}) keys.add(k); for (const k in addOf(a, start)) keys.add(k); }
  const order = [...keys].sort(), K = order.length, ix = new Map(order.map((k, n) => [k, n]));
  const idx = (k: string) => { const n = ix.get(k); if (n === undefined) throw new Unindexed(k); return n; };
  const st0: St = new Float64Array(K);
  for (let k = 0; k < K; k++) st0[k] = start[order[k]!] ?? 0;
  // A state as an object, for the actions' own add / cost functions (facts outside the index never change).
  const obj = (st: St): Facts => { const o: Facts = { ...start }; for (let k = 0; k < K; k++) o[order[k]!] = st[k]!; return o; };
  const effAt = (a: GAction<S>, o: Facts): Eff => {
    const add = addOf(a, o), ai: number[] = [], av: number[] = [];
    for (const k in add) { ai.push(idx(k)); av.push(add[k]!); }
    return { ai, av, cost: costOf(a, o) };
  };
  const acts: CAct<S>[] = actions.map((a) => {
    const pre: number[] = [], preV: number[] = [], use: number[] = [], useV: number[] = [];
    for (const k in a.pre ?? {}) { pre.push(idx(k)); preV.push(a.pre![k]!); }
    for (const k in a.use ?? {}) { use.push(idx(k)); useV.push(a.use![k]!); }
    const isFixed = typeof a.add !== 'function' && typeof a.cost !== 'function';
    const reads = isFixed ? [] : a.reads;
    const dep = reads ? reads.filter((k) => ix.has(k)).map((k) => ix.get(k)!) : null; // a fact outside the index never changes
    return { a, pre, preV, use, useV, fixed: reads && !reads.length ? effAt(a, start) : null, dep, memo: new Map() };
  });
  const eff = (c: CAct<S>, st: St): Eff => {
    if (c.fixed) return c.fixed;
    if (!c.dep) return effAt(c.a, obj(st));
    let mk: string | number;
    if (c.dep.length === 1) mk = st[c.dep[0]!]!;
    else { mk = ''; for (const d of c.dep) mk += st[d]! + ','; }
    let e = c.memo.get(mk);
    if (!e) { e = effAt(c.a, obj(st)); c.memo.set(mk, e); }
    return e;
  };
  const gi: number[] = [], gv: number[] = [];
  for (const k in goal) { gi.push(idx(k)); gv.push(goal[k]!); }
  const sat = (st: St) => { for (let g = 0; g < gi.length; g++) if (st[gi[g]!]! < gv[g]!) return false; return true; };
  const can = (c: CAct<S>, st: St) => {
    for (let k = 0; k < c.pre.length; k++) if (st[c.pre[k]!]! < c.preV[k]!) return false;
    for (let k = 0; k < c.use.length; k++) if (st[c.use[k]!]! < c.useV[k]!) return false;
    return true;
  };
  const keyOf = (st: St) => { let o = ''; for (let k = 0; k < K; k++) o += Math.round(st[k]! * 100) + ','; return o; };
  // Producers of each fact, as `producersOf`: by what the action gives at the start.
  const prod: CAct<S>[][] = Array.from({ length: K }, () => []);
  for (const c of acts) for (const k in addOf(c.a, start)) prod[idx(k)]!.push(c);

  // The relaxed heuristic of `relaxed()`, on arrays: stock changes are journalled and undone when a producer fails.
  const stock: St = new Float64Array(K), visiting = new Uint8Array(K), jk: number[] = [], jv: number[] = [];
  const ranked: ([CAct<S>, number, number, number][] | null | undefined)[] = new Array(K);
  // A fact whose producers all give and cost the same at every state is ranked once for the whole search.
  const stable = prod.map((ps) => ps.every((c) => c.fixed)), kept: ([CAct<S>, number, number, number][] | null | undefined)[] = new Array(K);
  let hs: St = st0, total = 0;
  const rank = (f: number): [CAct<S>, number, number, number][] | null => {
    let cand = ranked[f];
    if (cand !== undefined) return cand;
    if (stable[f] && kept[f] !== undefined) return (ranked[f] = kept[f]!);
    const ps = prod[f]!;
    if (!ps.length) cand = null;
    else {
      cand = [];
      for (const c of ps) {
        const e = eff(c, hs);
        let y = 0;
        for (let k = 0; k < e.ai.length; k++) if (e.ai[k] === f) { y = e.av[k]!; break; }
        if (y > 0) cand.push([c, e.cost / y, y, e.cost]);
      }
      cand.sort((p, q) => p[1] - q[1]);
    }
    ranked[f] = cand;
    if (stable[f]) kept[f] = cand;
    return cand;
  };
  const need = (f: number, n: number, depth: number): boolean => {
    const have = Math.max(0, stock[f]!), take = Math.min(have, n);
    jk.push(f); jv.push(stock[f]!); stock[f] = have - take; n -= take;
    if (n <= 1e-9) return true;
    if (depth > 6 || visiting[f]) return false;
    const cand = rank(f);
    if (!cand) return false;
    visiting[f] = 1;
    let ok = false;
    for (const [best, , by, cost] of cand) {
      const mark = jk.length, t0 = total;
      const times = Math.ceil(n / by - 1e-9);
      total += times * cost;
      ok = true;
      for (let k = 0; k < best.use.length; k++) ok = need(best.use[k]!, best.useV[k]! * times, depth + 1) && ok;
      for (let k = 0; k < best.pre.length; k++) { const pk = best.pre[k]!; if (hs[pk]! < best.preV[k]!) ok = need(pk, best.preV[k]! - hs[pk]!, depth + 1) && ok; }
      if (ok) break;
      while (jk.length > mark) stock[jk.pop()!] = jv.pop()!;
      total = t0;
    }
    visiting[f] = 0;
    return ok;
  };
  const h = (st: St): number => {
    hs = st; total = 0; stock.set(st); jk.length = 0; jv.length = 0; ranked.fill(undefined);
    for (let g = 0; g < gi.length; g++) if (!need(gi[g]!, gv[g]!, 0)) return Infinity;
    return total;
  };

  interface FNode { s: St; g: number; act: GAction<S> | null; parent: FNode | null; depth: number }
  const h0 = h(st0);
  if (!Number.isFinite(h0)) return null;
  const open = new Heap<FNode>(), best = new Map<string, number>();
  open.push(h0, { s: st0, g: 0, act: null, parent: null, depth: 0 });
  best.set(keyOf(st0), 0);
  let expanded = 0;
  while (open.size && expanded < maxNodes) {
    const n = open.pop();
    if (sat(n.s)) {
      const out: GAction<S>[] = [];
      for (let k: FNode | null = n; k && k.act; k = k.parent) out.unshift(k.act);
      return { actions: out, cost: n.g, expanded };
    }
    if ((best.get(keyOf(n.s)) ?? Infinity) < n.g) continue; // a cheaper way here was found later
    expanded++;
    if (n.depth >= maxDepth) continue;
    for (const c of acts) {
      if (!can(c, n.s)) continue;
      const e = eff(c, n.s), s2 = n.s.slice();
      for (let k = 0; k < c.use.length; k++) s2[c.use[k]!] = s2[c.use[k]!]! - c.useV[k]!;
      for (let k = 0; k < e.ai.length; k++) s2[e.ai[k]!] = s2[e.ai[k]!]! + e.av[k]!;
      const g2 = n.g + e.cost, k2 = keyOf(s2);
      if ((best.get(k2) ?? Infinity) <= g2) continue;
      const hv = h(s2);
      if (!Number.isFinite(hv)) continue;
      best.set(k2, g2);
      open.push(g2 + hv, { s: s2, g: g2, act: c.a, parent: n, depth: n.depth + 1 });
    }
  }
  return null;
}

/** Consecutive repeats of one action become one step with a count: [action, times][]. */
export function compress<S>(actions: GAction<S>[]): [GAction<S>, number][] {
  const out: [GAction<S>, number][] = [];
  for (const a of actions) { const l = out[out.length - 1]; if (l && l[0].key === a.key) l[1]++; else out.push([a, 1]); }
  return out;
}
