import { Act, EFlag, Kind } from '@worldsim/protocol';
import { NO_MAP } from './entities.js';
import { Pathfinder } from './pathfind.js';
import { ACT_RULE } from './rules.js';
import { ageOf } from './people.js';
import { INDEPENDENT } from './life.js';
import type { World } from './world.js';

/**
 * The algorithmic layer of every agent (no LLM): needs, utility-based choice of an action, A* paths, and the
 * actions themselves (drink, forage, eat, sleep, talk, wander, rest, travel). Items (food) appear on the maps as
 * the scenario says. Level of detail comes from what the agent does, never from viewers:
 * talking 0 (every 2 ticks) < walking 1 (10) < busy in place 2 (40) < asleep 3 (120); walkers still follow their
 * path every tick (a cheap distance check). Seeded RNG only, so runs repeat. Allocation free in the steady state.
 */
export const THINK_EVERY = [2, 10, 40, 120];
const PMAX = 64;
const HOUR = 3600;

export interface NeedsDef { hunger: number; thirst: number; tired: number; lonely: number; sleepRecover: number }
export interface ItemDef { id: number; name: string; food: number; spawn: { maps: string[]; on?: string[]; near?: string; max: number; perHour: number } }
export interface LifeDef {
  needs: NeedsDef;
  /** Tile names: where to drink (next to), where to sleep sheltered. */
  water: string[];
  shelter: string[];
  items: ItemDef[];
  /** Scales every need's decay (moderate = 1). */
  difficulty: number;
  /** Game days per year of age (milestone 7; 1 = a year every game day). */
  yearDays: number;
  /** No baby is conceived while this many people are alive. */
  maxPopulation: number;
}
export const LIFE_DEFAULTS: LifeDef = {
  needs: { hunger: 2, thirst: 4, tired: 5.5, lonely: 2.5, sleepRecover: 13 },
  water: ['water'], shelter: ['floor'], items: [], difficulty: 1, yearDays: 1, maxPopulation: 14,
};

export class Brain {
  private readonly w: World;
  readonly life: LifeDef;
  readonly paths: Pathfinder[];
  private readonly pbuf: Int32Array;
  private readonly pN: Uint8Array;
  private readonly pK: Uint8Array;
  private readonly gx: Float32Array;
  private readonly gy: Float32Array;
  private readonly replans: Uint8Array;
  /** Per map: walkable tiles next to water, and shelter tiles. */
  private readonly drinkSpots: Int32Array[];
  private readonly shelterSpots: Int32Array[];
  private readonly itemDef = new Map<number, ItemDef>();
  private nextSpawn = 0;
  /** The planner's wish per agent: an action (-1 none), maybe with whom (entity id), until when (game seconds). */
  private readonly wishAct: Int8Array;
  private readonly wishWith: Int32Array;
  private readonly wishUntil: Float64Array;
  /** Orders (from a chat or the panel): what (0 none), whom (entity id), an action, until when (game seconds). Stronger than a wish. */
  private readonly ordKind: Uint8Array;
  private readonly ordWho: Int32Array;
  private readonly ordAct: Int8Array;
  private readonly ordUntil: Float64Array;
  /** The animal a person is hunting (entity id, -1 none) and until when they try. */
  private readonly huntId: Int32Array;
  private readonly huntUntil: Float64Array;
  /** A job (survival work): where to stand, what to face. */
  private readonly jobX: Float32Array;
  private readonly jobY: Float32Array;
  private readonly faceX: Float32Array;
  private readonly faceY: Float32Array;
  /** Path searches this second (stats). */
  searches = 0;

  constructor(w: World, life: LifeDef) {
    this.w = w; this.life = life;
    const cap = w.e.cap;
    this.paths = w.maps.map((m) => new Pathfinder(m.tiles));
    this.pbuf = new Int32Array(cap * PMAX); this.pN = new Uint8Array(cap); this.pK = new Uint8Array(cap);
    this.gx = new Float32Array(cap); this.gy = new Float32Array(cap); this.replans = new Uint8Array(cap);
    this.wishAct = new Int8Array(cap).fill(-1); this.wishWith = new Int32Array(cap).fill(-1); this.wishUntil = new Float64Array(cap);
    this.huntId = new Int32Array(cap).fill(-1); this.huntUntil = new Float64Array(cap);
    this.ordKind = new Uint8Array(cap); this.ordWho = new Int32Array(cap).fill(-1); this.ordAct = new Int8Array(cap).fill(-1); this.ordUntil = new Float64Array(cap);
    this.jobX = new Float32Array(cap); this.jobY = new Float32Array(cap); this.faceX = new Float32Array(cap); this.faceY = new Float32Array(cap);
    const idsOf = (names: string[]) => new Set(w.sc.tiles.filter((t) => names.includes(t.name)).map((t) => t.id));
    const water = idsOf(life.water), shelter = idsOf(life.shelter);
    this.drinkSpots = []; this.shelterSpots = [];
    for (const m of w.maps) {
      const t = m.tiles, d: number[] = [], s: number[] = [];
      for (let y = 0; y < t.h; y++) for (let x = 0; x < t.w; x++) {
        const id = t.tiles[y * t.w + x]!;
        if (t.cost[id]! <= 0) continue;
        if (shelter.has(id)) s.push(y * t.w + x);
        const near = (xx: number, yy: number) => xx >= 0 && yy >= 0 && xx < t.w && yy < t.h && water.has(t.tiles[yy * t.w + xx]!);
        if (near(x + 1, y) || near(x - 1, y) || near(x, y + 1) || near(x, y - 1)) d.push(y * t.w + x);
      }
      this.drinkSpots.push(Int32Array.from(d)); this.shelterSpots.push(Int32Array.from(s));
    }
    for (const it of life.items) this.itemDef.set(it.id, it);
  }

  /** Game hour of the day (0..24), the day starting at 08:00 like the viewers show. */
  hour(): number { return ((this.w.gameSec / HOUR + 8) % 24 + 24) % 24; }

  // ------------------------------------------------------------------ per tick
  think(): void {
    const w = this.w, e = w.e;
    if (w.tick % 20 === 0) this.playerNeeds();
    if (w.tick >= this.nextSpawn) { this.spawnItems(false); this.nextSpawn = w.tick + Math.round(60 / w.dt); }
    for (let i = 0; i < e.hi; i++) {
      if (e.kind[i] !== Kind.Agent || e.map[i] === NO_MAP) continue;
      if (this.pN[i]! > 0) this.follow(i);
      if (e.nextThink[i]! > w.tick) continue;
      this.decide(i);
    }
  }

  /** Walk the path: aim at the current waypoint, next one when close; the last one ends the walk. */
  private follow(i: number): void {
    const e = this.w.e, k = this.pK[i]!, n = this.pN[i]!;
    const last = k === n - 1;
    const W = this.w.maps[e.map[i]!]!.tiles.w;
    const c = this.pbuf[i * PMAX + k]!;
    const wx = last ? this.gx[i]! : (c % W) + 0.5, wy = last ? this.gy[i]! : ((c / W) | 0) + 0.5;
    e.tx[i] = wx; e.ty[i] = wy;
    const dx = wx - e.x[i]!, dy = wy - e.y[i]!;
    if (dx * dx + dy * dy < (last ? 0.12 : 0.36)) {
      if (last) { this.pN[i] = 0; e.nextThink[i] = this.w.tick; } // arrived: decide now
      else this.pK[i] = k + 1;
    }
  }

  /** Path to (x, y). False when there is no way. */
  goTo(i: number, x: number, y: number, run = false): boolean {
    const w = this.w, e = w.e, pf = this.paths[e.map[i]!]!;
    this.searches++;
    const r = pf.find(e.x[i]!, e.y[i]!, x, y);
    if (r === 'none') { this.pN[i] = 0; return false; }
    const n = pf.outN;
    for (let k = 0; k < n; k++) this.pbuf[i * PMAX + k] = pf.out[k]!;
    this.pN[i] = n; this.pK[i] = 0;
    const W = w.maps[e.map[i]!]!.tiles.w, endT = pf.out[n - 1]!;
    if (r === 'full') { this.gx[i] = x; this.gy[i] = y; } else { this.gx[i] = (endT % W) + 0.5; this.gy[i] = ((endT / W) | 0) + 0.5; }
    const pr = w.profileOf(i);
    e.speed[i] = (run ? w.sc.agents.run : w.sc.agents.walk) * (pr ? 0.85 + pr.traits.speed * 0.3 : 1) * (e.flags[i]! & EFlag.Child ? 0.75 : 1);
    e.stuck[i] = 0;
    return true;
  }

  /** The planner's wish (hybrid AI): a bonus for that action until `until` (game seconds). Needs that are desperate still win. */
  wish(i: number, act: number, withId: number, until: number): void {
    const e = this.w.e;
    this.wishAct[i] = act; this.wishWith[i] = withId; this.wishUntil[i] = until;
    // Reconsider soon when only passing time (not asleep, eating or in a conversation).
    const a = e.act[i]!;
    if (a === Act.Wander || a === Act.Rest || a === Act.Idle) e.nextThink[i] = Math.min(e.nextThink[i]!, this.w.tick + 1);
  }
  wishOf(i: number): number { return this.wishUntil[i]! > this.w.gameSec ? this.wishAct[i]! : -1; }

  /**
   * An order: 'come' / 'goto' = walk to that person (entity id) and stay next to them, 'follow' = keep walking behind them,
   * 'stay' = stop where you are, 'stop' = forget orders, 'act' = do that action now (then it stays a strong wish).
   * Only a desperate need (about to die of thirst or hunger) interrupts it. Wakes a sleeper.
   */
  order(i: number, kind: 'come' | 'goto' | 'follow' | 'stay' | 'stop' | 'act' | 'bring', who: number, act: number, gameMinutes: number): boolean {
    const w = this.w, e = w.e;
    if (e.kind[i] !== Kind.Agent) return false;
    if (kind === 'stop') { this.ordKind[i] = 0; this.wishUntil[i] = 0; if (e.act[i] === Act.Go) { this.stop(i); this.setAct(i, Act.Idle); } e.nextThink[i] = w.tick + 1; return true; }
    if ((kind === 'come' || kind === 'goto' || kind === 'follow' || kind === 'bring') && (who < 0 || e.slot(who) < 0 || e.slot(who) === i)) return false;
    if (kind === 'act' && act < 0) return false;
    // The owner's strict rules win over any order (sim/rules.ts).
    const rn = kind === 'come' || kind === 'goto' ? 'goto' : kind === 'act' ? ACT_RULE[act] : kind === 'stay' ? '' : kind;
    if (rn && w.rules.forbidden(i, rn, who >= 0 ? e.slot(who) : -1)) return false;
    this.ordKind[i] = kind === 'come' || kind === 'goto' ? 1 : kind === 'follow' ? 2 : kind === 'stay' ? 3 : kind === 'bring' ? 5 : 4;
    this.ordWho[i] = who; this.ordAct[i] = act;
    this.ordUntil[i] = w.gameSec + Math.max(5, Math.min(24 * 60, gameMinutes)) * 60;
    if (e.flags[i]! & EFlag.Sleeping) this.setAct(i, Act.Idle);
    this.pN[i] = 0; this.replans[i] = 0;
    e.nextThink[i] = w.tick + 1;
    return true;
  }
  /** The order now: ['come' | 'follow' | 'stay' | 'act' | 'bring' | 'job' | '', whom, action]. */
  orderOf(i: number): { kind: string; who: number; act: number } {
    const k = this.ordUntil[i]! > this.w.gameSec ? this.ordKind[i]! : 0;
    return { kind: ['', 'come', 'follow', 'stay', 'act', 'bring', 'job'][k]!, who: this.ordWho[i]!, act: this.ordAct[i]! };
  }

  /** Survival work (sim/survival.ts): walk to (sx, sy), then stay there doing `act` facing (fx, fy) until the job is stopped. */
  job(i: number, sx: number, sy: number, fx: number, fy: number, act: number): boolean {
    const w = this.w, e = w.e;
    if (e.kind[i] !== Kind.Agent) return false;
    this.ordKind[i] = 6; this.ordWho[i] = -1; this.ordAct[i] = act; this.ordUntil[i] = w.gameSec + 6 * HOUR;
    this.jobX[i] = sx; this.jobY[i] = sy; this.faceX[i] = fx; this.faceY[i] = fy;
    if (e.flags[i]! & EFlag.Sleeping) this.setAct(i, Act.Idle);
    this.pN[i] = 0; this.replans[i] = 0;
    e.nextThink[i] = w.tick + 1;
    return true;
  }
  /** Hunt an animal (entity id): chase it and hit it until it dies, runs off (60 m) or an hour passes. */
  hunt(i: number, id: number): boolean {
    const e = this.w.e;
    if (e.kind[i] !== Kind.Agent || this.w.e.slot(id) < 0) return false;
    this.huntId[i] = id; this.huntUntil[i] = this.w.gameSec + HOUR;
    if (e.flags[i]! & EFlag.Sleeping) this.setAct(i, Act.Idle);
    e.nextThink[i] = this.w.tick + 1;
    return true;
  }
  huntOf(i: number): number { return this.huntId[i]!; }
  private hunting(i: number): boolean {
    const w = this.w, e = w.e, id = this.huntId[i]!;
    if (id < 0) return false;
    const a = e.slot(id);
    const d = a >= 0 && e.map[a] === e.map[i] ? Math.hypot(e.x[a]! - e.x[i]!, e.y[a]! - e.y[i]!) : Infinity;
    if (a < 0 || e.kind[a] !== Kind.Animal || d > 60 || w.gameSec > this.huntUntil[i]! || e.thirst[i]! > 92 || e.hunger[i]! > 97 || e.hp[i]! < 30) {
      this.huntId[i] = -1;
      if (e.act[i] === Act.Fight) { this.stop(i); this.setAct(i, Act.Idle); e.target[i] = -1; }
      return false;
    }
    this.setAct(i, Act.Fight); e.target[i] = id;
    const ax = e.x[a]!, ay = e.y[a]!;
    if (d > 1.2) { if (!this.walking(i) || Math.hypot(this.gx[i]! - ax, this.gy[i]! - ay) > 1.5) { if (!this.goTo(i, ax, ay, true)) { this.huntId[i] = -1; return false; } } }
    else { this.stop(i); e.angle[i] = Math.atan2(ay - e.y[i]!, ax - e.x[i]!); }
    this.schedule(i, 0, 5);
    return true;
  }

  /** At the job's spot and working. */
  atJob(i: number): boolean {
    const e = this.w.e;
    return this.ordKind[i] === 6 && !this.walking(i) && e.act[i] === this.ordAct[i] && Math.hypot(this.jobX[i]! - e.x[i]!, this.jobY[i]! - e.y[i]!) <= 1.2;
  }
  /** A new roof (a hut's floor): a place to sleep from now on. */
  addShelter(m: number, t: number): void {
    const a = this.shelterSpots[m]!, b = new Int32Array(a.length + 1);
    b.set(a); b[a.length] = t; this.shelterSpots[m] = b;
  }

  /** Carry out the order, if any. True = handled this think. */
  private obey(i: number): boolean {
    const w = this.w, e = w.e, k = this.ordKind[i]!;
    if (!k) return false;
    if (this.ordUntil[i]! <= w.gameSec) { this.ordKind[i] = 0; return false; }
    if (e.thirst[i]! > 92 || e.hunger[i]! > 95) return false; // about to die: that first, the order waits
    if (k === 6) { // survival work: go there, then work (needs that get pressing pause it)
      if (e.thirst[i]! > 70 || e.hunger[i]! > 75 || e.tired[i]! > 90) { if (e.act[i] === this.ordAct[i]) { this.stop(i); this.setAct(i, Act.Idle); } return false; }
      const d = Math.hypot(this.jobX[i]! - e.x[i]!, this.jobY[i]! - e.y[i]!);
      if (d <= 1.0) {
        this.stop(i); this.setAct(i, this.ordAct[i]!);
        e.angle[i] = Math.atan2(this.faceY[i]! - e.y[i]!, this.faceX[i]! - e.x[i]!);
        this.schedule(i, 2); return true;
      }
      if (this.walking(i) && e.act[i] === this.ordAct[i]) { this.schedule(i, 1); return true; }
      if (!this.goTo(i, this.jobX[i]!, this.jobY[i]!)) { this.ordKind[i] = 0; return false; }
      this.setAct(i, this.ordAct[i]!); this.schedule(i, 1);
      return true;
    }
    if (k === 3) { // stay
      this.stop(i); this.setAct(i, Act.Rest, 20); this.schedule(i, 2, this.ticksLeft(i)); return true;
    }
    if (k === 4) { // do an action now, then keep it as a strong wish
      this.ordKind[i] = 0;
      this.wish(i, this.ordAct[i]!, -1, this.ordUntil[i]!);
      if (this.start(i, this.ordAct[i]!)) return true;
      return false;
    }
    const j = e.slot(this.ordWho[i]!);
    if (j < 0 || j === i || e.map[j] !== e.map[i]) { this.ordKind[i] = 0; return false; } // gone or on another map
    if (k === 5 && e.carry[i]! <= 0) return this.fetchFood(i); // bring food: find some first
    const d = Math.hypot(e.x[j]! - e.x[i]!, e.y[j]! - e.y[i]!);
    if (d <= (k === 2 ? 3 : 2)) { // next to them: stop and face them
      this.stop(i);
      e.angle[i] = Math.atan2(e.y[j]! - e.y[i]!, e.x[j]! - e.x[i]!);
      if (k === 5) { // hand over one food
        e.carry[i]!--; e.carry[j] = Math.min(5, e.carry[j]! + 1);
        w.emit('give', { id: e.id(i), to: e.id(j), item: 'food' });
      }
      if (k === 1 || k === 5) { this.ordKind[i] = 0; this.setAct(i, Act.Talk, 20); e.target[i] = e.id(j); e.goal[i] = -2; this.schedule(i, 0); return true; } // arrived
      this.setAct(i, Act.Go); e.target[i] = e.id(j); this.schedule(i, 1); return true; // following: wait for them to move
    }
    // On the way: a new path towards where they are now (they may move).
    if (this.walking(i) && e.act[i] === Act.Go && Math.hypot(this.gx[i]! - e.x[j]!, this.gy[i]! - e.y[j]!) < 2) { this.schedule(i, 1); return true; }
    if (!this.goTo(i, e.x[j]!, e.y[j]!, d > 12)) { this.ordKind[i] = 0; return false; }
    this.setAct(i, Act.Go); e.target[i] = e.id(j);
    this.schedule(i, 1);
    return true;
  }

  /**
   * A zombie in sight (10 m, 6 m when asleep: it wakes them): fight it (a spear or an axe, or strong, and brave enough,
   * and not badly hurt) or run: to the camp's fire when there is one within 80 m (zombies keep away from fire), else away.
   * True = handled. When it is gone (16 m+), they carry on.
   */
  private danger(i: number): boolean {
    const w = this.w, e = w.e, m = e.map[i]!;
    const asleep = (e.flags[i]! & EFlag.Sleeping) !== 0;
    const fighting = e.act[i] === Act.Fight, fleeing = e.act[i] === Act.Flee;
    let z = w.zombies.nearest(m, e.x[i]!, e.y[i]!, fighting || fleeing ? 16 : asleep ? 6 : 10);
    if (z < 0) z = w.animals.attacker(i); // a wolf or a bear going for them
    if (z < 0) {
      if ((fighting && this.huntId[i]! < 0) || fleeing) { this.stop(i); this.setAct(i, Act.Idle); e.target[i] = -1; }
      return false;
    }
    if (asleep) { this.setAct(i, Act.Idle); w.emit('wake', { id: e.id(i), why: 'zombie' }); }
    const p = w.profileOf(i), v = w.survival.inv(i);
    const armed = w.survival.weapon(i)[1] > 0; void v;
    const brave = (p?.traits.courage ?? 0.5) > (armed ? 0.3 : 0.55) && (armed || (p?.traits.strength ?? 0.5) > 0.6) && e.hp[i]! > 45 && !(e.flags[i]! & EFlag.Child) && !w.rules.forbidden(i, 'fight');
    const zx = e.x[z]!, zy = e.y[z]!, d = Math.hypot(zx - e.x[i]!, zy - e.y[i]!);
    if (brave) {
      if (!fighting) w.emit('fight', { id: e.id(i), zombie: e.id(z) });
      this.setAct(i, Act.Fight); e.target[i] = e.id(z);
      if (d > 1.2) { if (!this.walking(i) || Math.hypot(this.gx[i]! - zx, this.gy[i]! - zy) > 1.5) this.goTo(i, zx, zy, true); }
      else { this.stop(i); e.angle[i] = Math.atan2(zy - e.y[i]!, zx - e.x[i]!); }
      this.schedule(i, 0, 5);
      return true;
    }
    // Run.
    if (fleeing && this.walking(i) && d > 4) { this.schedule(i, 0, 8); return true; }
    if (!fleeing) w.emit('flee', { id: e.id(i), zombie: e.id(z) });
    this.setAct(i, Act.Flee); e.target[i] = e.id(z);
    const camp = w.survival.campOf(m), f = camp ? w.survival.fireNear(m, camp.x, camp.y, 20) : -1;
    const W = w.maps[m]!.tiles.w;
    let ok = false;
    if (f >= 0) {
      const fx = (f % W) + 0.5, fy = ((f / W) | 0) + 0.5;
      if (Math.hypot(fx - e.x[i]!, fy - e.y[i]!) < 80 && Math.hypot(fx - e.x[i]!, fy - e.y[i]!) > 2.5) {
        const s = w.freeSpot(m, fx + w.rng.range(-1.8, 1.8), fy + w.rng.range(-1.8, 1.8), 10);
        if (s) ok = this.goTo(i, s.x, s.y, true);
      } else if (Math.hypot(fx - e.x[i]!, fy - e.y[i]!) <= 2.5) { this.stop(i); this.schedule(i, 0, 10); return true; } // safe by the fire
    }
    if (!ok) {
      const dx = e.x[i]! - zx, dy = e.y[i]! - zy, l = Math.hypot(dx, dy) || 1;
      const s = w.freeSpot(m, e.x[i]! + (dx / l) * 14, e.y[i]! + (dy / l) * 14, 10);
      if (s) ok = this.goTo(i, s.x, s.y, true);
    }
    if (!ok && !w.rules.forbidden(i, 'fight')) { this.setAct(i, Act.Fight); e.target[i] = e.id(z); this.stop(i); } // cornered: fight back
    this.schedule(i, 0, 8);
    return true;
  }

  /** For a "bring food" order with empty hands: walk to the nearest food and pick it up (not eat it). */
  private fetchFood(i: number): boolean {
    const w = this.w, e = w.e;
    const t = this.nearestItem(i, 150);
    if (t < 0) { // none known: search around
      if (!this.walking(i) && !this.wanderGo(i, 30)) { this.ordKind[i] = 0; return false; }
      this.setAct(i, Act.Forage); this.schedule(i, 1); return true;
    }
    if (Math.hypot(e.x[t]! - e.x[i]!, e.y[t]! - e.y[i]!) <= 1.3) {
      const def = this.itemDef.get(e.sub[t]!);
      w.emit('pickup', { id: e.id(i), item: def?.name ?? 'food' });
      w.remove(t, 'taken');
      e.carry[i]!++;
      this.pN[i] = 0; e.nextThink[i] = w.tick + 1; this.setAct(i, Act.Go);
      return true;
    }
    if (this.walking(i) && e.act[i] === Act.Forage && Math.hypot(this.gx[i]! - e.x[t]!, this.gy[i]! - e.y[t]!) < 1) { this.schedule(i, 1); return true; }
    if (!this.goTo(i, e.x[t]!, e.y[t]!)) { this.ordKind[i] = 0; return false; }
    this.setAct(i, Act.Forage); e.target[i] = -1; this.schedule(i, 1);
    return true;
  }

  /** Stop and talk to someone who came up to this person (a player): face them for `secs` seconds. */
  listen(i: number, j: number, secs: number): void {
    const e = this.w.e;
    if (e.act[i] === Act.Sleep) return;
    this.stop(i); this.setAct(i, Act.Talk, secs); e.target[i] = e.id(j); e.goal[i] = -2;
    e.angle[i] = Math.atan2(e.y[j]! - e.y[i]!, e.x[j]! - e.x[i]!);
    this.schedule(i, 0);
  }

  // ------------------------------------------------------------------ players (they live by the same rules)
  /** Needs of the players' characters, every 20 ticks (no damage: a player is never killed by hunger). */
  private playerNeeds(): void {
    const w = this.w, e = w.e, N = this.life.needs, k = this.life.difficulty;
    const h = (20 * w.dt * w.opt.clockScale) / HOUR;
    for (let i = 0; i < e.hi; i++) {
      if (e.kind[i] !== Kind.Player || e.map[i] === NO_MAP || w.away.has(e.id(i))) continue; // away: asleep, needs wait
      const asleep = (e.flags[i]! & EFlag.Sleeping) !== 0;
      e.hunger[i] = Math.min(100, e.hunger[i]! + N.hunger * k * h * (asleep ? 0.5 : 1));
      e.thirst[i] = Math.min(100, e.thirst[i]! + N.thirst * k * h * (asleep ? 0.5 : 1));
      e.tired[i] = asleep ? Math.max(0, e.tired[i]! - N.sleepRecover * h * (w.survival.onBed(e.map[i]!, e.x[i]!, e.y[i]!) ? 2 : 1)) : Math.min(100, e.tired[i]! + N.tired * k * h);
      if (asleep && e.tired[i]! <= 0) { e.flags[i] = e.flags[i]! & ~EFlag.Sleeping; e.act[i] = Act.Idle; }
      // Wounds (zombie bites) heal: 20 a game hour when fed and watered, twice that asleep.
      if (e.hunger[i]! < 60 && e.thirst[i]! < 60) e.hp[i] = Math.min(w.sc.agents.hp, e.hp[i]! + 20 * h * (asleep ? 2 : 1));
    }
  }

  /** Next to water (the tile under or beside x, y). */
  nearWater(m: number, x: number, y: number): boolean {
    const t = this.w.maps[m]!.tiles, W = t.w;
    const tx = Math.floor(x), ty = Math.floor(y);
    const list = this.drinkSpots[m]!;
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
      const xx = tx + dx, yy = ty + dy;
      if (xx < 0 || yy < 0 || xx >= W || yy >= t.h) continue;
      const c = yy * W + xx;
      // drink spots are sorted by index (built row by row)
      let lo = 0, hi = list.length - 1;
      while (lo <= hi) { const mid = (lo + hi) >> 1, v = list[mid]!; if (v === c) return true; if (v < c) lo = mid + 1; else hi = mid - 1; }
    }
    return false;
  }

  /**
   * A player does what people do: 'use' = the obvious thing here (pick up food, drink, else eat), or one action by name.
   * Returns what happened ('drank', 'picked', 'ate', 'sleep', 'wake') or why not ('noWater', 'nothing', 'noFood', 'full').
   */
  playerDo(i: number, a: string): { ok: boolean; code: string; item?: string } {
    const w = this.w, e = w.e;
    if (e.kind[i] !== Kind.Player || e.map[i] === NO_MAP) return { ok: false, code: 'nothing' };
    const m = e.map[i]!;
    const item = () => { const t = this.nearestItem(i, 1.8); return t; };
    if (a === 'use') {
      if (item() >= 0) a = 'pickup';
      else if (this.nearWater(m, e.x[i]!, e.y[i]!) && e.thirst[i]! > 5) a = 'drink';
      else if (e.carry[i]! > 0 && e.hunger[i]! > 15) a = 'eat';
      else return { ok: false, code: 'nothing' };
    }
    switch (a) {
      case 'drink':
        if (!this.nearWater(m, e.x[i]!, e.y[i]!)) return { ok: false, code: 'noWater' };
        e.thirst[i] = 0; w.emit('drink', { id: e.id(i), player: true });
        return { ok: true, code: 'drank' };
      case 'pickup': {
        const t = item();
        if (t < 0) return { ok: false, code: 'nothing' };
        if (e.carry[i]! >= 5) return { ok: false, code: 'full' };
        const def = this.itemDef.get(e.sub[t]!);
        w.remove(t, 'taken');
        e.carry[i]!++;
        w.emit('pickup', { id: e.id(i), item: def?.name ?? 'food', player: true });
        return { ok: true, code: 'picked', item: def?.name ?? 'food' };
      }
      case 'eat':
        if (e.carry[i]! <= 0) return { ok: false, code: 'noFood' };
        e.carry[i]!--; e.hunger[i] = Math.max(0, e.hunger[i]! - 35);
        return { ok: true, code: 'ate' };
      case 'sleep':
        if (e.flags[i]! & EFlag.Sleeping) { e.flags[i] = e.flags[i]! & ~EFlag.Sleeping; e.act[i] = Act.Idle; return { ok: true, code: 'wake' }; }
        e.flags[i] = e.flags[i]! | EFlag.Sleeping; e.act[i] = Act.Sleep; e.inX[i] = e.inY[i] = 0;
        return { ok: true, code: 'sleep' };
    }
    return { ok: false, code: 'nothing' };
  }

  /** What a person is up to, in words, for the owner's thought bubbles: [action, target name or '', metres to go, wish]. */
  intent(i: number): { act: number; to: number; dist: number; wish: number; wishWith: number } {
    const e = this.w.e, walking = this.walking(i);
    const dist = walking ? Math.hypot(this.gx[i]! - e.x[i]!, this.gy[i]! - e.y[i]!) : 0;
    return { act: e.act[i]!, to: e.target[i]!, dist, wish: this.wishOf(i), wishWith: this.wishWith[i]! };
  }

  stop(i: number): void { const e = this.w.e; this.pN[i] = 0; e.tx[i] = e.x[i]!; e.ty[i] = e.y[i]!; e.speed[i] = 0; }
  walking(i: number): boolean { return this.pN[i]! > 0; }

  // ------------------------------------------------------------------ needs + choice
  private decide(i: number): void {
    const w = this.w, e = w.e, N = this.life.needs, rng = w.rng;
    const since = Math.min(0.5 * HOUR, (w.tick - e.lastThink[i]!) * w.dt * w.opt.clockScale) / HOUR; // game hours
    e.lastThink[i] = w.tick;
    const asleep = e.act[i] === Act.Sleep && !this.walking(i);
    const pr = w.profileOf(i), met = pr ? 0.8 + pr.traits.metabolism * 0.4 : 1;
    const k = this.life.difficulty;
    e.hunger[i] = Math.min(100, e.hunger[i]! + N.hunger * k * met * since * (asleep ? 0.5 : 1));
    e.thirst[i] = Math.min(100, e.thirst[i]! + N.thirst * k * since * (asleep ? 0.5 : 1));
    const warm = (asleep && w.survival.warm(e.map[i]!, e.x[i]!, e.y[i]!) ? 1.5 : 1) * (asleep && w.survival.onBed(e.map[i]!, e.x[i]!, e.y[i]!) ? 2 : 1); // by a fire, on a bed
    e.tired[i] = asleep ? Math.max(0, e.tired[i]! - N.sleepRecover * warm * since) : Math.min(100, e.tired[i]! + N.tired * k * since);
    e.lonely[i] = Math.min(100, e.lonely[i]! + N.lonely * k * since);
    // Health: starving or parched hurts; otherwise it heals slowly.
    if (e.hunger[i]! >= 100 || e.thirst[i]! >= 100) e.hp[i]! -= 6 * since * k;
    else if (e.hunger[i]! < 60 && e.thirst[i]! < 60) e.hp[i] = Math.min(w.sc.agents.hp, e.hp[i]! + 3 * since);
    if (e.hp[i]! <= 0 && w.charName(i)) e.hp[i] = 5; // a player's character on autopilot is hurt, never killed
    if (e.hp[i]! <= 0) {
      const cause = e.thirst[i]! >= 100 ? 'thirst' : 'hunger';
      w.emit('death', { id: e.id(i), cause, map: w.maps[e.map[i]!]!.def.id, x: e.x[i], y: e.y[i] });
      w.remove(i, cause);
      return;
    }
    if (!this.walking(i)) e.actT[i] = Math.max(0, e.actT[i]! - since * HOUR / w.opt.clockScale); // timers run once there
    if (this.danger(i)) return;
    if (this.hunting(i)) return;
    if (this.obey(i)) return;
    if (e.act[i] === Act.Go || ((e.act[i] === Act.Gather || e.act[i] === Act.Build) && this.ordKind[i] !== 6)) { this.stop(i); this.setAct(i, Act.Idle); } // the order ended

    // Stuck on the way (blocked by people or a door): replan, then give up after 3 tries.
    if (this.walking(i)) {
      const slow = e.vx[i]! * e.vx[i]! + e.vy[i]! * e.vy[i]! < 0.04;
      e.stuck[i] = slow ? Math.min(255, e.stuck[i]! + 1) : 0;
      if (e.stuck[i]! >= 4) {
        e.stuck[i] = 0;
        if (++this.replans[i]! <= 3 && this.goTo(i, this.gx[i]!, this.gy[i]!, e.speed[i]! > w.sc.agents.walk)) { this.schedule(i, 1); return; }
        this.replans[i] = 0; this.stop(i); this.setAct(i, Act.Idle);
      } else if (e.act[i] !== Act.Talk) { this.schedule(i, 1); return; } // on the way: keep going
    }

    // On arrival or while busy: carry on with the action.
    if (this.continueAct(i)) return;
    this.replans[i] = 0;
    this.choose(i, rng.next());
  }

  private schedule(i: number, lod: number, maxTicks = Infinity): void {
    const e = this.w.e;
    e.lod[i] = lod;
    e.nextThink[i] = this.w.tick + Math.max(1, Math.min(maxTicks, THINK_EVERY[lod]! + this.w.rng.int(4)));
  }
  private setAct(i: number, a: number, seconds = 0): void {
    const e = this.w.e;
    e.act[i] = a; e.actT[i] = seconds;
    e.flags[i] = a === Act.Sleep ? e.flags[i]! | EFlag.Sleeping : e.flags[i]! & ~EFlag.Sleeping;
  }
  /** Ticks until the action's timer ends. */
  private ticksLeft(i: number): number { return Math.ceil(this.w.e.actT[i]! / this.w.dt); }

  /** Score each action (0..~1.3) from the needs, with a bonus for the current one; pick the best. */
  private choose(i: number, jitter: number): void {
    const w = this.w, e = w.e;
    // Families (imad 2026-11-20: "parents raise the kid till 14, then he can go out"): a child under 14 stays close to a
    // parent (mother first) unless thirst or hunger are pressing; parents bring them food (sim/survival.ts).
    const guard = this.guardian(i);
    if (guard >= 0 && e.thirst[i]! < 70 && e.hunger[i]! < 80) {
      const d = Math.hypot(e.x[guard]! - e.x[i]!, e.y[guard]! - e.y[i]!);
      if (e.act[guard] === Act.Sleep && e.tired[i]! > 25 && d < 4) { this.start(i, Act.Sleep); return; }
      if (d > 7) {
        const s = w.freeSpot(e.map[i]!, e.x[guard]! + w.rng.range(-2.5, 2.5), e.y[guard]! + w.rng.range(-2.5, 2.5), 5);
        if (s && this.goTo(i, s.x, s.y, d > 25)) { this.setAct(i, Act.Wander); this.schedule(i, 1); return; }
      }
    }
    const curve = (v: number, from: number, p: number) => (v <= from ? 0 : Math.pow((v - from) / (100 - from), p));
    const night = this.hour() >= 22 || this.hour() < 6;
    const sDrink = curve(e.thirst[i]!, 25, 1.3) * 1.25 + (e.thirst[i]! > 80 ? 0.6 : 0);
    const sFood = curve(e.hunger[i]!, 30, 1.3) * 1.15 + (e.hunger[i]! > 85 ? 0.5 : 0);
    const sEat = e.carry[i]! > 0 ? sFood * 1.1 : 0;
    const sForage = (e.carry[i]! > 0 ? sFood * 0.4 : sFood) + (e.carry[i]! < 2 && !night ? 0.14 : 0);
    const sSleep = curve(e.tired[i]!, 35, 1.2) * 1.1 + (night && e.tired[i]! > 30 ? 0.35 : 0);
    const emp = w.profileOf(i)?.traits.empathy ?? 0.5;
    const sTalk = night ? 0 : curve(e.lonely[i]!, 20, 1.1) * (0.8 + emp * 0.5);
    const sWander = night ? 0.05 : 0.18;
    const sRest = 0.1;
    const sTravel = w.travelOpen && !night && guard < 0 ? 0.08 : 0;
    const scores = [sDrink, sEat, guard >= 0 && e.hunger[i]! < 80 ? 0 : sForage, sSleep, guard >= 0 ? sTalk * 0.3 : sTalk, sWander, sRest, sTravel];
    const acts = [Act.Drink, Act.Eat, Act.Forage, Act.Sleep, Act.Talk, Act.Wander, Act.Rest, Act.Travel];
    const wish = this.wishOf(i);
    let best = -1, bs = -1;
    for (let k = 0; k < scores.length; k++) {
      if (acts[k] !== Act.Rest && acts[k] !== Act.Talk && w.rules.forbidden(i, ACT_RULE[acts[k]!]!)) { scores[k] = -1; continue; } // the owner's rule
      if (acts[k] === wish && !(wish === Act.Travel && !w.travelOpen) && !(wish === Act.Eat && e.carry[i]! <= 0)) scores[k]! += 0.32;
      const s = scores[k]! + (acts[k] === e.act[i] ? 0.08 : 0) + jitter * 0.04 * ((k * 7 + 3) % 5) / 5;
      if (s > bs) { bs = s; best = k; }
    }
    if (!this.start(i, acts[best]!)) { if (!this.start(i, Act.Wander)) { this.setAct(i, Act.Rest, 10); this.schedule(i, 2, this.ticksLeft(i)); } }
  }

  /** Begin an action: pick its target and the path there. False when it can't be done now. */
  private start(i: number, a: number): boolean {
    const w = this.w, e = w.e, rng = w.rng, m = e.map[i]!;
    e.target[i] = -1; e.goal[i] = -1;
    switch (a) {
      case Act.Drink: {
        const t = this.nearestSpot(this.drinkSpots[m]!, w.maps[m]!.tiles.w, e.x[i]!, e.y[i]!);
        if (t < 0) return false;
        const W = w.maps[m]!.tiles.w;
        if (!this.goTo(i, (t % W) + 0.5, ((t / W) | 0) + 0.5, e.thirst[i]! > 85)) return false;
        this.setAct(i, Act.Drink, 15); e.target[i] = t;
        this.schedule(i, 1); return true;
      }
      case Act.Eat:
        if (e.carry[i]! <= 0) return false;
        this.stop(i); this.setAct(i, Act.Eat, 12); this.schedule(i, 2, this.ticksLeft(i)); return true;
      case Act.Forage: {
        // Food in the camp's store is the first place to look when it is near (people stock it for this).
        const st = e.carry[i]! <= 0 && e.hunger[i]! > 40 ? w.survival.stashFood(i, 150) : -1;
        if (st >= 0) {
          const W = w.maps[m]!.tiles.w, sp = w.freeSpot(m, (st % W) + 0.5, ((st / W) | 0) + 1.5, 6);
          if (sp && this.goTo(i, sp.x, sp.y, e.hunger[i]! > 85)) { this.setAct(i, Act.Forage); e.goal[i] = -3; this.schedule(i, 1); return true; }
        }
        const t = this.nearestItem(i, 90);
        if (t < 0) { // nothing known nearby: search a little further away
          if (!this.wanderGo(i, 30)) return false;
          this.setAct(i, Act.Forage); this.schedule(i, 1); return true;
        }
        if (!this.goTo(i, e.x[t]!, e.y[t]!, e.hunger[i]! > 85)) return false;
        this.setAct(i, Act.Forage); e.target[i] = e.id(t); this.schedule(i, 1); return true;
      }
      case Act.Sleep: {
        // Home first: the camp's huts, else by its fire (when the camp is within 120 m). Else a roof (shelter tile)
        // within 30 m; else where you are.
        const W = w.maps[m]!.tiles.w, camp = w.survival.campOf(m);
        let t = -1;
        if (camp && Math.hypot(camp.x - e.x[i]!, camp.y - e.y[i]!) < 120) {
          t = this.nearestSpot(this.shelterSpots[m]!, W, camp.x, camp.y, 14, rng.next() * 3);
          if (t < 0) { const s = w.freeSpot(m, camp.x + rng.range(-2.5, 2.5), camp.y + rng.range(-2.5, 2.5), 8); if (s) t = Math.floor(s.y) * W + Math.floor(s.x); }
        }
        if (t < 0) t = this.nearestSpot(this.shelterSpots[m]!, W, e.x[i]!, e.y[i]!, 30, rng.next() * 6);
        { // a small child sleeps next to the parent looking after them
          const g = this.guardian(i);
          if (g >= 0) { const s = w.freeSpot(m, e.x[g]! + rng.range(-1.5, 1.5), e.y[g]! + rng.range(-1.5, 1.5), 4); if (s) t = Math.floor(s.y) * W + Math.floor(s.x); }
        }
        this.setAct(i, Act.Sleep);
        if (t >= 0 && this.goTo(i, (t % W) + 0.5, ((t / W) | 0) + 0.5)) { e.flags[i] = e.flags[i]! & ~EFlag.Sleeping; this.schedule(i, 1); }
        else { this.stop(i); this.schedule(i, 3); }
        return true;
      }
      case Act.Talk: {
        let j = -1;
        if (this.wishOf(i) === Act.Talk && this.wishWith[i]! >= 0) { // the planner named someone
          const k = e.slot(this.wishWith[i]!);
          if (k >= 0 && k !== i && e.kind[k] === Kind.Agent && e.map[k] === m && e.act[k] !== Act.Sleep && Math.hypot(e.x[k]! - e.x[i]!, e.y[k]! - e.y[i]!) < 150 && !w.rules.between(i, k, 'talk')) j = k;
        }
        if (j < 0) j = this.nearestAgent(i, 60, 'talk');
        if (j < 0) return false;
        if (!this.goTo(i, e.x[j]!, e.y[j]!)) return false;
        this.setAct(i, Act.Talk); e.target[i] = e.id(j); this.schedule(i, 1); return true;
      }
      case Act.Wander:
        if (!this.wanderGo(i, 22)) return false;
        this.setAct(i, Act.Wander); this.schedule(i, 1); return true;
      case Act.Rest:
        this.stop(i); this.setAct(i, Act.Rest, 10 + rng.next() * 30); this.schedule(i, 2, this.ticksLeft(i)); return true;
      case Act.Travel: {
        if (!w.travelOpen) return false;
        let best = -1, bd = Infinity;
        for (let pi = 0; pi < w.portals.length; pi++) {
          const p = w.portals[pi]!;
          if (p.from !== m) continue;
          const d = Math.hypot(p.x - e.x[i]!, p.y - e.y[i]!) + rng.next() * 40;
          if (d < bd) { bd = d; best = pi; }
        }
        if (best < 0) return false;
        const p = w.portals[best]!;
        if (!this.goTo(i, p.x, p.y)) return false;
        this.setAct(i, Act.Travel); e.goal[i] = best; this.schedule(i, 1); return true;
      }
    }
    return false;
  }

  /** The current action after arriving / while busy. True = still on it. */
  private continueAct(i: number): boolean {
    const w = this.w, e = w.e, a = e.act[i]!;
    switch (a) {
      case Act.Drink: {
        if (e.target[i]! < 0) return false;
        if (e.actT[i]! > 0) { this.stop(i); this.schedule(i, 2, this.ticksLeft(i)); return true; }
        e.thirst[i] = 0; e.target[i] = -1; w.emit('drink', { id: e.id(i) });
        return false;
      }
      case Act.Eat:
        if (e.actT[i]! > 0) { this.schedule(i, 2, this.ticksLeft(i)); return true; }
        if (e.carry[i]! > 0) { e.carry[i]!--; e.hunger[i] = Math.max(0, e.hunger[i]! - 35); }
        return false;
      case Act.Forage: {
        if (e.actT[i]! > 0) { this.schedule(i, 2, this.ticksLeft(i)); return true; } // eating what was found
        if (e.goal[i] === -3) { // at the camp's store
          e.goal[i] = -1;
          if (w.survival.eatFromStash(i)) { this.stop(i); e.actT[i] = 10; this.schedule(i, 2, this.ticksLeft(i)); return true; }
          return false;
        }
        const t = e.target[i]! >= 0 ? e.slot(e.target[i]!) : -1;
        e.target[i] = -1;
        if (t < 0 || e.map[t] !== e.map[i]) return false; // gone (someone else took it) or was exploring
        if (Math.hypot(e.x[t]! - e.x[i]!, e.y[t]! - e.y[i]!) > 1.3) return false;
        const def = this.itemDef.get(e.sub[t]!);
        w.emit('pickup', { id: e.id(i), item: def?.name ?? 'item' });
        w.remove(t, 'taken');
        if (e.hunger[i]! > 30) { e.hunger[i] = Math.max(0, e.hunger[i]! - (def?.food ?? 30)); this.stop(i); e.actT[i] = 10; this.schedule(i, 2, this.ticksLeft(i)); return true; }
        if (e.carry[i]! < 5) e.carry[i]!++;
        return false;
      }
      case Act.Sleep: {
        if (!(e.flags[i]! & EFlag.Sleeping)) { this.stop(i); this.setAct(i, Act.Sleep); w.emit('sleep', { id: e.id(i) }); } // arrived at the bed
        const night = this.hour() >= 22 || this.hour() < 6;
        if (e.tired[i]! > 3 || (night && e.tired[i]! > 0)) {
          const g = this.guardian(i);
          if (g >= 0 && e.act[g] !== Act.Sleep && Math.hypot(e.x[g]! - e.x[i]!, e.y[g]! - e.y[i]!) > 10 && e.tired[i]! < 70) { // mum left: up and after her
            this.setAct(i, Act.Idle); w.emit('wake', { id: e.id(i) }); this.choose(i, 0); return true;
          }
          if (e.thirst[i]! > 90 || e.hunger[i]! > 92) { // woken by need: go and fix it
            this.setAct(i, Act.Idle);
            if (!this.start(i, e.thirst[i]! > 90 ? Act.Drink : e.carry[i]! > 0 ? Act.Eat : Act.Forage)) this.choose(i, 0);
            return true;
          }
          this.schedule(i, 3); return true;
        }
        this.setAct(i, Act.Idle); w.emit('wake', { id: e.id(i) });
        return false;
      }
      case Act.Talk: {
        const j = e.target[i]! >= 0 ? e.slot(e.target[i]!) : -1;
        if (j < 0 || e.map[j] !== e.map[i] || e.act[j] === Act.Sleep) { e.target[i] = -1; e.goal[i] = -1; return false; }
        const d = Math.hypot(e.x[j]! - e.x[i]!, e.y[j]! - e.y[i]!);
        if (e.goal[i] === -2) { // in the conversation (goal -2 marks it)
          if (e.actT[i]! <= 0) { e.goal[i] = -1; e.target[i] = -1; return false; } // said goodbye
          e.lonely[i] = Math.max(0, e.lonely[i]! - 4);
          this.schedule(i, 0, Math.min(20, this.ticksLeft(i)));
          return true;
        }
        if (w.rules.between(i, j, 'talk')) { e.target[i] = -1; e.goal[i] = -1; return false; } // a rule: they don't talk
        if (d <= 1.9) {
          // Start talking: both stop and face each other for 20-40 s.
          const secs = 20 + w.rng.next() * 20;
          this.stop(i); this.setAct(i, Act.Talk, secs); e.goal[i] = -2;
          if (e.goal[j] !== -2) {
            this.stop(j); this.setAct(j, Act.Talk, secs); e.target[j] = e.id(i); e.goal[j] = -2; this.schedule(j, 0);
            w.emit('talk', { a: e.id(i), b: e.id(j), map: w.maps[e.map[i]!]!.def.id });
          }
          e.angle[i] = Math.atan2(e.y[j]! - e.y[i]!, e.x[j]! - e.x[i]!);
          this.schedule(i, 0);
          return true;
        }
        if (d > 70 || !this.goTo(i, e.x[j]!, e.y[j]!)) { e.target[i] = -1; return false; }
        this.schedule(i, 1); return true; // the other one moved: follow
      }
      case Act.Rest:
        if (e.actT[i]! > 0) { this.schedule(i, 2, this.ticksLeft(i)); return true; }
        return false;
      case Act.Travel:
        return e.goal[i]! >= 0 && this.walking(i);
    }
    return false;
  }

  // ------------------------------------------------------------------ helpers
  /** The parent looking after a child under 14 on the same map (mother first), or -1. */
  guardian(i: number): number {
    const w = this.w, e = w.e, p = w.profileOf(i);
    if (!p || !p.parents.length || !(e.flags[i]! & EFlag.Child) || ageOf(p, w.gameSec, w.life.yearSec) >= INDEPENDENT) return -1;
    let best = -1;
    for (const pid of p.parents) {
      const j = e.slot(pid);
      if (j < 0 || e.map[j] !== e.map[i] || (e.kind[j] !== Kind.Agent && e.kind[j] !== Kind.Player)) continue;
      if (best < 0 || w.profiles.get(pid)?.sex === 'f') best = j;
    }
    return best;
  }

  private wanderGo(i: number, r: number): boolean {
    const w = this.w, e = w.e, m = e.map[i]!;
    if (this.guardian(i) >= 0) r = Math.min(r, 6); // small children don't go far
    for (let k = 0; k < 4; k++) {
      const s = w.freeSpot(m, e.x[i]! + w.rng.range(-r, r), e.y[i]! + w.rng.range(-r, r), 6);
      if (s && this.goTo(i, s.x, s.y)) return true;
    }
    return false;
  }

  /** Nearest tile of a list (within maxD), with an optional random extra distance to spread people out. */
  private nearestSpot(list: Int32Array, mw: number, x: number, y: number, maxD = Infinity, spread = 0): number {
    let best = -1, bd = maxD * maxD;
    for (let k = 0; k < list.length; k++) {
      const t = list[k]!, dx = (t % mw) + 0.5 - x, dy = ((t / mw) | 0) + 0.5 - y;
      const d = dx * dx + dy * dy + (spread ? ((t * 2654435761) >>> 24) / 255 * spread * spread : 0);
      if (d < bd) { bd = d; best = t; }
    }
    return best;
  }

  private nearestItem(i: number, r: number): number {
    const e = this.w.e, m = e.map[i]!;
    let best = -1, bd = r * r;
    for (let j = 0; j < e.hi; j++) {
      if (e.kind[j] !== Kind.Item || e.map[j] !== m) continue;
      const dx = e.x[j]! - e.x[i]!, dy = e.y[j]! - e.y[i]!, d = dx * dx + dy * dy;
      if (d < bd) { bd = d; best = j; }
    }
    return best;
  }

  /** The nearest person awake within r metres (`rule` = skip those a rule keeps them from doing that with). */
  private nearestAgent(i: number, r: number, rule = ''): number {
    const e = this.w.e, m = e.map[i]!;
    let best = -1, bd = r * r;
    for (let j = 0; j < e.hi; j++) {
      if (j === i || (e.kind[j] !== Kind.Agent && e.kind[j] !== Kind.Player) || e.map[j] !== m || e.act[j] === Act.Sleep) continue;
      if (rule && this.w.rules.between(i, j, rule)) continue;
      const dx = e.x[j]! - e.x[i]!, dy = e.y[j]! - e.y[i]!, d = dx * dx + dy * dy;
      if (d < bd) { bd = d; best = j; }
    }
    return best;
  }

  /** Food appears over time where the scenario says (fill = a new world starts half stocked). */
  spawnItems(fill: boolean): void {
    const w = this.w, e = w.e, rng = w.rng;
    for (const it of this.life.items) {
      const onIds = new Set(w.sc.tiles.filter((t) => it.spawn.on?.includes(t.name)).map((t) => t.id));
      const nearId = it.spawn.near ? w.sc.tiles.find((t) => t.name === it.spawn.near)?.id ?? -1 : -1;
      for (const mid of it.spawn.maps) {
        const m = w.mapIndex.get(mid);
        if (m === undefined) continue;
        let have = 0;
        for (let j = 0; j < e.hi; j++) if (e.kind[j] === Kind.Item && e.map[j] === m && e.sub[j] === it.id) have++;
        let want = fill ? Math.floor(it.spawn.max / 2) - have : (rng.next() < (it.spawn.perHour * 60 * w.opt.clockScale) / HOUR % 1 ? 1 : 0) + Math.floor((it.spawn.perHour * 60 * w.opt.clockScale) / HOUR);
        want = Math.min(want, it.spawn.max - have);
        const t = w.maps[m]!.tiles;
        for (let n = 0, tries = 0; n < want && tries < want * 40; tries++) {
          const x = rng.int(t.w), y = rng.int(t.h), id = t.tiles[y * t.w + x]!;
          if (t.cost[id]! <= 0) continue;
          let ok = onIds.has(id);
          if (!ok && nearId >= 0) {
            for (let d = 0; d < 4 && !ok; d++) {
              const xx = x + (d === 0 ? 1 : d === 1 ? -1 : 0), yy = y + (d === 2 ? 1 : d === 3 ? -1 : 0);
              ok = xx >= 0 && yy >= 0 && xx < t.w && yy < t.h && t.tiles[yy * t.w + xx] === nearId;
            }
          }
          if (!ok) continue;
          const j = e.create(Kind.Item, m, x + 0.2 + rng.next() * 0.6, y + 0.2 + rng.next() * 0.6, 0.2);
          if (j < 0) return;
          e.sub[j] = it.id;
          n++;
        }
      }
    }
  }

  /** A supply drop: n portions of the first food item scattered around (x, y). Returns how many landed. */
  drop(m: number, x: number, y: number, n: number): number {
    const w = this.w, e = w.e, t = w.maps[m]!.tiles, it = this.life.items[0];
    let k = 0;
    for (let tries = 0; k < n && tries < n * 20; tries++) {
      const px = x + w.rng.range(-4, 4), py = y + w.rng.range(-4, 4);
      if (t.isSolidAt(px, py)) continue;
      const j = e.create(Kind.Item, m, px, py, 0.2);
      if (j < 0) break;
      e.sub[j] = it?.id ?? 1; k++;
    }
    return k;
  }

  /** After loading a snapshot: paths are not saved, walkers decide again. */
  reset(): void { this.pN.fill(0); }
}
