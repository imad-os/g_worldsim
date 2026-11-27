import { Act, EFlag, Kind } from '@worldsim/protocol';
import type { World } from './world.js';

/**
 * Fighting and running with several attackers (imad 2026-11-26: "with 5 zombies he ran from a to b and back, 5 m apart";
 * "if one is attacked and the other is near, both should attack"; "more than 1 zombie: build a strategy").
 *
 * - `threats` = every zombie, and every animal on the attack, within r of a person.
 * - `escape` scores 16 ways out by the time margin against EVERY threat (where would each one be when I pass that point),
 *   walls cut a way short, a haven (roof, fire, friends) pulls. The chosen way is kept for a few seconds and only given up
 *   for a clearly better one, so people no longer turn round each time another zombie happens to be the nearest.
 * - `target` = focus fire: the one friends already hit, else the weakest close one; kept until it is dead or far.
 * - `victim` = someone near being bitten / gored: their neighbours come and fight it with them.
 * The plan (fight / kite / flee / haven / breakout) is kept per person with its reason so the panel and replays can show it.
 */
export const DIRS = 16;
/** Metres from the map's edge that count as a dead end when running. */
const EDGE = 14;
export type Plan = 'fight' | 'kite' | 'flee' | 'haven' | 'breakout';

export class Tactics {
  /** Per slot: the way out being run (radians), until (tick), the plan, the focus target id. */
  readonly ang: Float32Array;
  readonly until: Float64Array;
  readonly plan: Uint8Array;
  readonly focus: Int32Array;
  /** The fight-or-run choice, kept for a few seconds (tick until, 1 = fight). */
  readonly lockUntil: Float64Array;
  readonly lockBrave: Uint8Array;
  /** Tick a threat was last in sight: for 20 s after, people keep a wide watch (no going back to work with zombies 17 m away). */
  readonly seen: Float64Array;
  /** The health when the fight-or-run choice was made: losing 15+ since then makes them choose again at once. */
  readonly lockHp: Float32Array;
  readonly lockN: Uint8Array;
  /** Bites taken lately (count since tick `bitFrom`, by whom): bitten again and again while running = cornered, fight back. */
  readonly bitN: Uint8Array;
  readonly bitFrom: Float64Array;
  readonly bitBy: Int32Array;
  private readonly buf: number[] = [];
  static readonly PLANS: Plan[] = ['fight', 'fight', 'kite', 'flee', 'haven', 'breakout'];

  constructor(private readonly w: World, cap: number) {
    this.ang = new Float32Array(cap); this.until = new Float64Array(cap); this.plan = new Uint8Array(cap); this.focus = new Int32Array(cap).fill(-1);
    this.lockUntil = new Float64Array(cap); this.lockBrave = new Uint8Array(cap); this.seen = new Float64Array(cap);
    this.lockHp = new Float32Array(cap); this.lockN = new Uint8Array(cap);
    this.bitN = new Uint8Array(cap); this.bitFrom = new Float64Array(cap); this.bitBy = new Int32Array(cap).fill(-1);
    w.listeners.push((ev) => {
      if (ev.kind !== 'bitten') return;
      const i = w.e.slot(Number(ev.data.id));
      if (i < 0) return;
      if (w.tick - this.bitFrom[i]! > 6 / w.dt) { this.bitFrom[i] = w.tick; this.bitN[i] = 0; }
      this.bitN[i] = Math.min(255, this.bitN[i]! + 1); this.bitBy[i] = Number(ev.data.by);
    });
  }
  private musterAt = new Map<string, { tick: number; p: { x: number; y: number; fire: boolean; n: number; ash: number } | null }>();
  /**
   * Stand together (imad 2026-11-26: "20 people attacked by 20 zombies must survive it easily"; the logs showed everyone who died was
   * alone, running, often into the map's edge): while 3+ zombies are within 70 m of a camp, everyone near rallies at the
   * camp's burning fire (zombies keep off it), else at the camp itself, and fights there as one group. The point, or null.
   * With `i` (a person) it is that person's own camp: a clan with a camp of its own defends that one (imad 2026-11-27).
   */
  muster(m: number, i = -1): { x: number; y: number; fire: boolean; n: number; ash: number } | null {
    const w = this.w, e = w.e;
    const camp = i >= 0 ? w.survival.campFor(i) : w.survival.campOf(m);
    const key = camp ? `${m}:${Math.round(camp.x)}:${Math.round(camp.y)}` : `${m}`, c = this.musterAt.get(key);
    if (c && w.tick - c.tick < 20) return c.p;
    let p: { x: number; y: number; fire: boolean; n: number; ash: number } | null = null;
    if (camp) {
      let n = 0;
      for (let j = 0; j < e.hi; j++) if (e.kind[j] === Kind.Threat && e.map[j] === m && Math.hypot(e.x[j]! - camp.x, e.y[j]! - camp.y) < 70) n++;
      if (n >= 3) {
        const f = w.survival.fireNear(m, camp.x, camp.y, 20), W = w.maps[m]!.tiles.w;
        if (f >= 0) p = { x: (f % W) + 0.5, y: ((f / W) | 0) + 0.5, fire: true, n, ash: -1 };
        else {
          // No fire burning (by day): rally only if the old one can be lit again with a piece of wood (bag or store). Without a fire a crowd
          // of bare hands against 20 zombies loses (tried: 20 of 20 dead); scattered, people outrun them.
          const a = w.survival.campAshes(m, camp);
          let wood = (w.survival.stash[m]?.wood ?? 0) > 0;
          for (let j = 0; j < e.hi && !wood && a >= 0; j++) if (e.kind[j] === Kind.Agent && e.map[j] === m && (w.survival.inv(j).wood ?? 0) > 0 && Math.hypot(e.x[j]! - camp.x, e.y[j]! - camp.y) < 90) wood = true;
          // (A fire made new on the spot was tried too: it is not up in time and the crowd dies round it, 8 and 13 of 20.)
          if (a >= 0 && wood) p = { x: (a % W) + 0.5, y: ((a / W) | 0) + 0.5, fire: false, n, ash: a };
        }
        if (p && !c?.p) w.emit('muster', { map: w.maps[m]!.def.id, x: Math.round(p.x), y: Math.round(p.y), fire: p.fire, zombies: n });
      }
    }
    if (this.musterAt.size > 64) this.musterAt.clear();
    this.musterAt.set(key, { tick: w.tick, p });
    return p;
  }

  /** Bitten 3+ times in the last 6 s (running does not shake it off): the one doing it (slot), else -1. */
  cornered(i: number): number {
    if (this.bitN[i]! < 3 || this.w.tick - this.bitFrom[i]! > 6 / this.w.dt) return -1;
    const z = this.w.e.slot(this.bitBy[i]!);
    return z >= 0 && this.hostile(z) && Math.hypot(this.w.e.x[z]! - this.w.e.x[i]!, this.w.e.y[z]! - this.w.e.y[i]!) < 3 ? z : -1;
  }

  reset(i: number): void { this.until[i] = 0; this.plan[i] = 0; this.focus[i] = -1; this.lockUntil[i] = 0; this.bitN[i] = 0; }
  /** Saw a threat within the last 20 s. */
  alert(i: number): boolean { return this.seen[i]! > 0 && this.w.tick - this.seen[i]! < 20 / this.w.dt; }
  planOf(i: number): Plan | '' { return this.plan[i] ? Tactics.PLANS[this.plan[i]!]! : ''; }
  setPlan(i: number, p: Plan): boolean { const k = Tactics.PLANS.indexOf(p, 1); const ch = this.plan[i] !== k; this.plan[i] = k; return ch; }

  /** Is this thing coming for people (a zombie, or an animal in a fight)? */
  hostile(j: number): boolean {
    const e = this.w.e;
    return e.alive(j) && (e.kind[j] === Kind.Threat || (e.kind[j] === Kind.Animal && e.act[j] === Act.Fight && !this.w.horses.owned(j)));
  }

  /** Threats within r metres of (x, y) on map m (slots, a reused array). */
  threats(m: number, x: number, y: number, r: number): number[] {
    const e = this.w.e, out = this.buf; out.length = 0;
    for (let j = 0; j < e.hi; j++) {
      if (e.map[j] !== m || !this.hostile(j)) continue;
      if (Math.hypot(e.x[j]! - x, e.y[j]! - y) <= r) out.push(j);
    }
    return out;
  }

  /**
   * Someone near person i (18 m) being attacked right now (a zombie within 3 m going for them, an animal fighting them):
   * { z: the attacker, v: the one attacked } or null. Children, players and adults all count as someone to save.
   */
  victim(i: number): { z: number; v: number } | null {
    const w = this.w, e = w.e, m = e.map[i]!;
    let best: { z: number; v: number } | null = null, bd = 18;
    for (let z = 0; z < e.hi; z++) {
      if (e.map[z] !== m || !this.hostile(z) || e.target[z]! < 0) continue;
      const v = e.slot(e.target[z]!);
      if (v < 0 || v === i || e.map[v] !== m || (e.kind[v] !== Kind.Agent && e.kind[v] !== Kind.Player)) continue;
      if (Math.hypot(e.x[z]! - e.x[v]!, e.y[z]! - e.y[v]!) > (e.kind[z] === Kind.Threat ? 3 : 6)) continue; // on them, not only on the way
      const d = Math.hypot(e.x[v]! - e.x[i]!, e.y[v]! - e.y[i]!);
      if (d < bd) { bd = d; best = { z, v }; }
    }
    return best;
  }

  /** How many people (agents / players, not children) are fighting thing z within 14 m of (x, y), i excluded. */
  fightersOn(z: number, i: number): number {
    const e = this.w.e, id = e.id(z);
    let n = 0;
    for (let j = 0; j < e.hi; j++) {
      if (j === i || (e.kind[j] !== Kind.Agent && e.kind[j] !== Kind.Player) || e.map[j] !== e.map[z]) continue;
      if (e.act[j] === Act.Fight && e.target[j] === id && Math.hypot(e.x[j]! - e.x[z]!, e.y[j]! - e.y[z]!) < 4) n++;
    }
    return n;
  }

  /**
   * Focus fire: which of the threats near person i to go for. The current one is kept while it lives and stays within 6 m.
   * Else: the one most friends are already hitting, then the closest (weaker ones a little closer).
   */
  target(i: number, z: number): number {
    const w = this.w, e = w.e, m = e.map[i]!;
    const cur = this.focus[i]! >= 0 ? e.slot(this.focus[i]!) : -1;
    if (cur >= 0 && e.map[cur] === m && this.hostile(cur) && Math.hypot(e.x[cur]! - e.x[i]!, e.y[cur]! - e.y[i]!) < 6) return cur;
    let best = z, bs = Infinity;
    for (const j of this.threats(m, e.x[i]!, e.y[i]!, 10).slice()) {
      const d = Math.hypot(e.x[j]! - e.x[i]!, e.y[j]! - e.y[i]!);
      const s = d - this.fightersOn(j, i) * 4 + Math.min(1, Math.max(0, e.hp[j]!) / 120) * 1.5;
      if (s < bs) { bs = s; best = j; }
    }
    this.focus[i] = e.id(best);
    return best;
  }

  /**
   * The time margin of running from person i along angle a: for points 2..R m along it, how much farther than "now" each
   * threat still is when I get there (my run speed vs theirs), the worst of them; a wall stops the way there (a way
   * shorter than 4 m is no way: -Infinity). Returns { margin, len }.
   */
  private way(i: number, a: number, th: readonly number[], R: number, speed: number): { margin: number; len: number } {
    const w = this.w, e = w.e, t = w.maps[e.map[i]!]!.tiles, x0 = e.x[i]!, y0 = e.y[i]!;
    const cx = Math.cos(a), cy = Math.sin(a);
    let margin = Infinity, len = 0;
    for (let s = 2; s <= R; s += 2) {
      const px = x0 + cx * s, py = y0 + cy * s;
      if (t.isSolidAt(px, py) || t.isSolidAt(px - cx * 1, py - cy * 1)) break;
      // The map's edge is a dead end (most people who died running were caught against it): no running towards it.
      const edge = Math.min(px, py, t.w - px, t.h - py);
      if (edge < EDGE && edge < Math.min(x0, y0, t.w - x0, t.h - y0)) break;
      len = s;
      for (const j of th) {
        const vz = e.kind[j] === Kind.Threat ? w.zombies.cfg.speed : 4.5; // animals on the attack are fast
        const dz = Math.hypot(px - e.x[j]!, py - e.y[j]!);
        const m = dz - (s / speed) * vz; // how far it still is when I am there
        if (m < margin) margin = m;
      }
    }
    if (len < 4) return { margin: -Infinity, len };
    return { margin: margin === Infinity ? 99 : margin, len };
  }

  /**
   * The best way out for person i from the threats `th`: angle, run length, its margin. `pull` (optional) = a place to
   * prefer (a roof, the fire, friends): ways towards it get up to +2 m of margin. The way chosen before is kept until its
   * commitment runs out unless another one is better by 1.5 m (hysteresis: no turning back and forth).
   */
  escape(i: number, th: readonly number[], pull: { x: number; y: number } | null, speed: number): { a: number; len: number; margin: number } {
    const w = this.w, e = w.e, R = 14;
    const pa = pull ? Math.atan2(pull.y - e.y[i]!, pull.x - e.x[i]!) : 0;
    let ba = 0, bl = 0, bm = -Infinity, bs = -Infinity;
    const score = (a: number) => {
      const r = this.way(i, a, th, R, speed);
      return { ...r, s: r.margin + (pull ? Math.cos(a - pa) * 2 : 0) + r.len * 0.05 };
    };
    for (let k = 0; k < DIRS; k++) {
      const a = (k / DIRS) * Math.PI * 2, r = score(a);
      if (r.s > bs) { bs = r.s; ba = a; bl = r.len; bm = r.margin; }
    }
    if (this.until[i]! > w.tick) { // keep the way we were running unless it got clearly worse than the best
      const r = score(this.ang[i]!);
      if (r.s > -Infinity && r.s >= bs - 1.5) return { a: this.ang[i]!, len: r.len, margin: r.margin };
    }
    this.ang[i] = ba; this.until[i] = w.tick + Math.round(3 / w.dt);
    return { a: ba, len: bl, margin: bm };
  }

  /** Is person i hemmed in: two or more threats within 2.2 m, on different sides (more than 90 degrees apart)? */
  swarmed(i: number, th: readonly number[]): boolean {
    const e = this.w.e;
    const close = th.filter((j) => Math.hypot(e.x[j]! - e.x[i]!, e.y[j]! - e.y[i]!) < 2.2);
    if (close.length < 2) return false;
    for (let a = 0; a < close.length; a++) for (let b = a + 1; b < close.length; b++) {
      const ax = e.x[close[a]!]! - e.x[i]!, ay = e.y[close[a]!]! - e.y[i]!, bx = e.x[close[b]!]! - e.x[i]!, by = e.y[close[b]!]! - e.y[i]!;
      if ((ax * bx + ay * by) / ((Math.hypot(ax, ay) * Math.hypot(bx, by)) || 1) < 0) return true;
    }
    return false;
  }

  /** Friends close to person i (adults on their feet within 14 m) as a pull point for a retreat (their middle), or null. */
  friends(i: number): { x: number; y: number; n: number } | null {
    const e = this.w.e, m = e.map[i]!;
    let sx = 0, sy = 0, n = 0;
    for (let j = 0; j < e.hi; j++) {
      if (j === i || (e.kind[j] !== Kind.Agent && e.kind[j] !== Kind.Player) || e.map[j] !== m) continue;
      if (e.flags[j]! & (EFlag.Child | EFlag.Sleeping) || e.hp[j]! < 40) continue;
      const d = Math.hypot(e.x[j]! - e.x[i]!, e.y[j]! - e.y[i]!);
      if (d > 3 && d < 14) { sx += e.x[j]!; sy += e.y[j]!; n++; }
    }
    return n ? { x: sx / n, y: sy / n, n } : null;
  }
}
