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
 * The cheapest plan from `start` to `goal`, or null when there is none within `maxNodes` expansions / `maxDepth` actions.
 * States are compared on the facts the actions and the goal mention (rounded to 1/100), so different orders of the
 * same work collapse into one state.
 */
export function plan<S>(start: Facts, goal: Facts, actions: GAction<S>[], opts: { maxNodes?: number; maxDepth?: number } = {}): Plan<S> | null {
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

/** Consecutive repeats of one action become one step with a count: [action, times][]. */
export function compress<S>(actions: GAction<S>[]): [GAction<S>, number][] {
  const out: [GAction<S>, number][] = [];
  for (const a of actions) { const l = out[out.length - 1]; if (l && l[0].key === a.key) l[1]++; else out.push([a, 1]); }
  return out;
}
