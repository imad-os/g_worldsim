import { Kind } from '@worldsim/protocol';
import type { World, WorldEvent } from './world.js';
import type { Mind } from './people.js';

/**
 * What a person remembers of their own life (flag `instinct`; research/ARCHITECTURE.md "Memory"). The engine, not the LLM,
 * writes it, from what happens to them and around them, so it costs no AI calls and is there for everyone.
 *
 *  - Short-term memory: the last 10 things (merged when the same thing repeats: "talked with Lina x4").
 *  - Long-term memory: up to 100. A short-term memory that matters (importance 4+ of 10) is kept when it leaves short-term
 *    memory; the rest is forgotten. When long-term memory is full, the one with the lowest retention goes: importance, how
 *    often it happened, how long ago (the very important ones, a child born, a partner dead, last for life).
 *  - Recall (Park et al., Generative Agents 2023): recency + importance + relevance to a question, for prompts and the panel.
 *  - Places: where they found water, wood, stone, ore, food, game, a bed, and where they were hurt (up to 4 of each), so
 *    they know their surroundings and fear the places where something bit them.
 */

export interface Rec { t: number; k: string; i: number; x: string; n: number; w?: number }
export interface Place { m: number; x: number; y: number; t: number; n: number }
export type PlaceKind = 'water' | 'wood' | 'stone' | 'ore' | 'food' | 'hunt' | 'sleep' | 'danger';
export interface Mem { s: Rec[]; l: Rec[]; p: Partial<Record<PlaceKind, Place[]>> }

export const SHORT = 10, LONG = 100, PLACES = 4;
const DAY = 86400;

export class Memory {
  constructor(private w: World) {
    w.listeners.push((ev) => { if (w.ai.instinct) this.on(ev); });
  }

  private mem(id: number): Mem | null {
    const p = this.w.profiles.get(id);
    if (!p || p.died !== undefined) return null;
    p.mind ??= { notes: [], summary: '', mood: 'calm', rel: {}, lastPlan: 0 } as Mind;
    return (p.mind.mem ??= { s: [], l: [], p: {} });
  }
  private name(id: number): string { return this.w.profiles.get(id)?.name ?? 'someone'; }

  /** Remember something (importance 1..10). Same kind and words as one already in short-term memory = that one again. */
  add(id: number, k: string, imp: number, text: string, who?: number): void {
    const m = this.mem(id);
    if (!m) return;
    const now = this.w.gameSec;
    const same = m.s.find((r) => r.k === k && r.x === text);
    if (same) { same.n++; same.t = now; same.i = Math.max(same.i, imp); return; }
    m.s.push({ t: now, k, i: imp, x: text.slice(0, 90), n: 1, ...(who !== undefined ? { w: who } : {}) });
    while (m.s.length > SHORT) this.consolidate(m, m.s.shift()!);
  }

  /** Leaving short-term memory: kept for good if it mattered, merged with the same memory, the weakest forgotten. */
  private consolidate(m: Mem, r: Rec): void {
    if (r.i < 4) return;
    const same = m.l.find((x) => x.k === r.k && x.x === r.x);
    if (same) { same.n += r.n; same.t = r.t; same.i = Math.max(same.i, r.i); return; }
    m.l.push(r);
    if (m.l.length <= LONG) return;
    let worst = 0, ws = Infinity;
    for (let k = 0; k < m.l.length; k++) { const s = this.retention(m.l[k]!); if (s < ws) { ws = s; worst = k; } }
    m.l.splice(worst, 1);
  }
  private retention(r: Rec): number {
    const days = Math.max(0, this.w.gameSec - r.t) / DAY;
    return r.i * 2 + Math.log2(1 + r.n) - days / (r.i >= 9 ? 1e6 : r.i * 0.5);
  }

  /** The memories that fit a question best: recency, importance, words in common (top n, most relevant first). */
  recall(id: number, query = '', n = 8): Rec[] {
    const m = this.mem(id);
    if (!m) return [];
    const words = new Set(query.toLowerCase().split(/[^a-zà-ÿ؀-ۿ]+/).filter((x) => x.length > 2));
    const now = this.w.gameSec;
    const score = (r: Rec) => {
      const rec = Math.exp(-Math.max(0, now - r.t) / (2 * DAY));
      let rel = 0;
      if (words.size) for (const x of r.x.toLowerCase().split(/[^a-zà-ÿ؀-ۿ]+/)) if (words.has(x)) rel += 0.5;
      return rec + r.i / 10 + Math.min(1.5, rel);
    };
    return [...m.l, ...m.s].map((r) => [score(r), r] as const).sort((a, b) => b[0] - a[0]).slice(0, n).map(([, r]) => r);
  }

  /** Remember a place (merged with one within 8 m). */
  place(id: number, k: PlaceKind, mi: number, x: number, y: number): void {
    const m = this.mem(id);
    if (!m) return;
    const list = (m.p[k] ??= []), now = this.w.gameSec;
    const near = list.find((p) => p.m === mi && Math.hypot(p.x - x, p.y - y) < 8);
    if (near) { near.n++; near.t = now; return; }
    list.push({ m: mi, x: Math.round(x), y: Math.round(y), t: now, n: 1 });
    if (list.length > PLACES) { list.sort((a, b) => (b.n + b.t / DAY) - (a.n + a.t / DAY)); list.length = PLACES; }
  }
  places(id: number, k: PlaceKind): Place[] { return this.mem(id)?.p[k] ?? []; }
  /** Fear: a place within r metres where something hurt them in the last two days. */
  feared(id: number, mi: number, x: number, y: number, r = 12): boolean {
    const now = this.w.gameSec;
    return this.places(id, 'danger').some((p) => p.m === mi && now - p.t < 2 * DAY && Math.hypot(p.x - x, p.y - y) < r);
  }

  /** Their life in a few lines, for prompts and the panel: what they remember most, and the places they know. */
  story(i: number, query = ''): string {
    const w = this.w, e = w.e, id = e.id(i), m = this.mem(id);
    if (!m) return '';
    const clock = (t: number) => { const d = Math.floor(t / DAY), h = Math.floor((t % DAY) / 3600); return `day ${d + 1} ${String(h).padStart(2, '0')}h`; };
    const mems = this.recall(id, query, 8).map((r) => `${clock(r.t)} ${r.x}${r.n > 1 ? ` (x${r.n})` : ''}`);
    const dir = (dx: number, dy: number) => (Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'east' : 'west') : dy > 0 ? 'south' : 'north');
    const pl: string[] = [];
    for (const [k, list] of Object.entries(m.p) as [PlaceKind, Place[]][]) {
      const here = list.filter((p) => p.m === e.map[i]);
      if (!here.length) continue;
      const p = here.reduce((a, b) => (Math.hypot(a.x - e.x[i]!, a.y - e.y[i]!) < Math.hypot(b.x - e.x[i]!, b.y - e.y[i]!) ? a : b));
      const d = Math.round(Math.hypot(p.x - e.x[i]!, p.y - e.y[i]!));
      pl.push(`${k === 'danger' ? 'danger (I was hurt)' : k} ${d < 5 ? 'right here' : `${d} m ${dir(p.x - e.x[i]!, p.y - e.y[i]!)}`}`);
    }
    return [`Your memories (${m.l.length} kept, ${m.s.length} recent): ${mems.length ? mems.join(' | ') : 'nothing yet'}.`,
      ...(pl.length ? [`Places you know: ${pl.join('; ')}.`] : [])].join('\n');
  }

  // ------------------------------------------------------------------ from what happens
  private on(ev: WorldEvent): void {
    const w = this.w, e = w.e, d = ev.data, id = Number(d.id ?? -1), i = id >= 0 ? e.slot(id) : -1;
    const at = (j: number, k: PlaceKind) => { if (j >= 0) this.place(e.id(j), k, e.map[j]!, e.x[j]!, e.y[j]!); };
    /** People within r m of slot j (agents and players' characters), not j. */
    const around = (j: number, r: number) => { const out: number[] = []; if (j < 0) return out; for (let k = 0; k < e.hi; k++) if (k !== j && (e.kind[k] === Kind.Agent || e.kind[k] === Kind.Player) && e.map[k] === e.map[j] && Math.hypot(e.x[k]! - e.x[j]!, e.y[k]! - e.y[j]!) < r) out.push(e.id(k)); return out; };
    switch (ev.kind) {
      case 'bitten': {
        const by = d.animal ? `a ${String(d.animal)}` : 'a zombie', hp = Number(d.hp ?? 100);
        this.add(id, 'hurt', hp < 40 ? 7 : 5, `bitten by ${by}`); at(i, 'danger'); break;
      }
      case 'fight': this.add(id, 'fight', 4, 'fought a zombie'); break;
      case 'flee': this.add(id, 'flee', 4, 'ran from a zombie'); at(i, 'danger'); break;
      case 'alarm': for (const o of around(i, 30)) this.add(o, 'alarm', 3, `${this.name(id)} shouted: ${d.zombie ? 'zombies' : 'a wild animal'}`, id); break;
      case 'zombie': if (d.how === 'killed' && Number(d.by) >= 0) this.add(Number(d.by), 'kill', 6, 'killed a zombie'); break;
      case 'hunt': if (id >= 0) { this.add(id, 'hunt', d.animal === 'bear' ? 7 : 4, `hunted a ${String(d.animal)}`); at(i, 'hunt'); } break;
      case 'death': {
        const dead = w.profiles.get(id), cause = String(d.cause ?? 'died');
        if (!dead) break;
        const kin = new Set<number>([dead.partner, ...dead.parents]);
        for (const [pid, q] of w.profiles) if (q.parents.includes(id)) kin.add(pid);
        for (const [pid, q] of w.profiles) {
          if (pid === id || q.died !== undefined) continue;
          const close = kin.has(pid), feel = (q.mind?.rel ?? {})['#' + id] ?? 0;
          if (close) this.add(pid, 'loss', 10, `${dead.name} died (${cause})`, id);
          else if (feel >= 2) this.add(pid, 'loss', 8, `my friend ${dead.name} died (${cause})`, id);
        }
        const j = e.slot(id);
        for (const o of around(j, 20)) if (!kin.has(o)) this.add(o, 'saw', 6, `saw ${dead.name} die (${cause})`, id);
        break;
      }
      case 'birth': {
        const c = this.name(id);
        for (const p of [Number(d.mother), Number(d.father)]) if (p >= 0) this.add(p, 'child', 10, `my child ${c} was born`, id);
        break;
      }
      case 'pregnant': this.add(id, 'child', 8, 'expecting a baby'); if (Number(d.father) >= 0) this.add(Number(d.father), 'child', 8, `${this.name(id)} is expecting our baby`, id); break;
      case 'partner': { const a = Number(d.a), b = Number(d.b), how = d.wed ? 'married' : 'became partners with'; this.add(a, 'love', 9, `${how} ${this.name(b)}`, b); this.add(b, 'love', 9, `${how} ${this.name(a)}`, a); break; }
      case 'divorce': { const a = Number(d.a), b = Number(d.b); this.add(a, 'love', 8, `divorced ${this.name(b)}`, b); this.add(b, 'love', 8, `divorced ${this.name(a)}`, a); break; }
      case 'task': this.add(id, d.ok ? 'done' : 'failed', d.ok ? 3 : 4, d.ok ? `did: ${String(d.text)}` : `could not ${String(d.text)}: ${String(d.why ?? '')}`); break;
      case 'reward': if (d.ok) this.add(id, 'praise', 4, `${String(d.from) === 'owner' ? 'the owner' : String(d.from)} was pleased: ${String(d.text)}`); break;
      case 'levelup': this.add(id, 'grow', 6, `got better at things (level ${String(d.level)})`); break;
      case 'grown': this.add(id, 'grow', 8, 'grew up: on my own now'); break;
      case 'leader': if (id >= 0) { this.add(id, 'leader', 7, 'became the leader'); for (const [pid, q] of w.profiles) if (pid !== id && q.died === undefined && e.slot(pid) >= 0 && w.maps[e.map[e.slot(pid)]!]!.def.id === d.map) this.add(pid, 'leader', 3, `${this.name(id)} leads us now`, id); } break;
      case 'duel': { const a = Number(d.a), b = Number(d.b); this.add(a, 'quarrel', 6, `fought with ${this.name(b)} (${String(d.why ?? '')})`, b); this.add(b, 'quarrel', 6, `fought with ${this.name(a)} (${String(d.why ?? '')})`, a); break; }
      case 'build': if (id >= 0 && d.what) this.add(id, 'build', d.what === 'hut' ? 6 : 3, `built a ${String(d.what)}`); break;
      case 'craft': if (id >= 0) this.add(id, 'craft', 2, `made a ${String(d.what)}`); break;
      case 'loot': if (id >= 0 && d.got && Object.keys(d.got as object).length) this.add(id, 'find', 3, `found ${Object.keys(d.got as object).join(', ')} in the ruins`); break;
      case 'talk': { const a = Number(d.a), b = Number(d.b); this.add(a, 'talk', 1, `talked with ${this.name(b)}`, b); this.add(b, 'talk', 1, `talked with ${this.name(a)}`, a); break; }
      case 'give': if (Number(d.to) >= 0) this.add(Number(d.to), 'gift', 3, `${this.name(id)} gave me ${String(d.item)}`, id); break;
      case 'heal': if (Number(d.who) >= 0) this.add(Number(d.who), 'gift', 4, `${this.name(id)} treated my wounds`, id); break;
      case 'guard': this.add(id, 'guard', 2, 'kept watch at night'); break;
      // Places only.
      case 'drink': at(i, 'water'); break;
      case 'sleep': at(i, 'sleep'); break;
      case 'pickup': at(i, 'food'); break;
      case 'gather': {
        const what = String(d.what ?? ''), k: PlaceKind = /wood/.test(what) ? 'wood' : /ore/.test(what) ? 'ore' : 'stone';
        if (i >= 0) this.place(id, k, e.map[i]!, d.tx !== undefined ? Number(d.tx) : e.x[i]!, d.ty !== undefined ? Number(d.ty) : e.y[i]!);
        break;
      }
    }
  }
}
