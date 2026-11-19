import { Act, EFlag, Kind } from '@worldsim/protocol';
import { NO_MAP } from './entities.js';
import { Pathfinder } from './pathfind.js';
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
}
export const LIFE_DEFAULTS: LifeDef = {
  needs: { hunger: 2, thirst: 4, tired: 5.5, lonely: 2.5, sleepRecover: 13 },
  water: ['water'], shelter: ['floor'], items: [], difficulty: 1,
};

export class Brain {
  private readonly w: World;
  private readonly life: LifeDef;
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
  /** Path searches this second (stats). */
  searches = 0;

  constructor(w: World, life: LifeDef) {
    this.w = w; this.life = life;
    const cap = w.e.cap;
    this.paths = w.maps.map((m) => new Pathfinder(m.tiles));
    this.pbuf = new Int32Array(cap * PMAX); this.pN = new Uint8Array(cap); this.pK = new Uint8Array(cap);
    this.gx = new Float32Array(cap); this.gy = new Float32Array(cap); this.replans = new Uint8Array(cap);
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
    e.speed[i] = run ? w.sc.agents.run : w.sc.agents.walk;
    e.stuck[i] = 0;
    return true;
  }

  stop(i: number): void { const e = this.w.e; this.pN[i] = 0; e.tx[i] = e.x[i]!; e.ty[i] = e.y[i]!; e.speed[i] = 0; }
  walking(i: number): boolean { return this.pN[i]! > 0; }

  // ------------------------------------------------------------------ needs + choice
  private decide(i: number): void {
    const w = this.w, e = w.e, N = this.life.needs, rng = w.rng;
    const since = Math.min(0.5 * HOUR, (w.tick - e.lastThink[i]!) * w.dt * w.opt.clockScale) / HOUR; // game hours
    e.lastThink[i] = w.tick;
    const asleep = e.act[i] === Act.Sleep && !this.walking(i);
    const k = this.life.difficulty;
    e.hunger[i] = Math.min(100, e.hunger[i]! + N.hunger * k * since * (asleep ? 0.5 : 1));
    e.thirst[i] = Math.min(100, e.thirst[i]! + N.thirst * k * since * (asleep ? 0.5 : 1));
    e.tired[i] = asleep ? Math.max(0, e.tired[i]! - N.sleepRecover * since) : Math.min(100, e.tired[i]! + N.tired * k * since);
    e.lonely[i] = Math.min(100, e.lonely[i]! + N.lonely * k * since);
    // Health: starving or parched hurts; otherwise it heals slowly.
    if (e.hunger[i]! >= 100 || e.thirst[i]! >= 100) e.hp[i]! -= 6 * since * k;
    else if (e.hunger[i]! < 60 && e.thirst[i]! < 60) e.hp[i] = Math.min(w.sc.agents.hp, e.hp[i]! + 3 * since);
    if (e.hp[i]! <= 0) {
      const cause = e.thirst[i]! >= 100 ? 'thirst' : 'hunger';
      w.emit('death', { id: e.id(i), cause, map: w.maps[e.map[i]!]!.def.id, x: e.x[i], y: e.y[i] });
      w.remove(i, cause);
      return;
    }
    if (!this.walking(i)) e.actT[i] = Math.max(0, e.actT[i]! - since * HOUR / w.opt.clockScale); // timers run once there

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
    const curve = (v: number, from: number, p: number) => (v <= from ? 0 : Math.pow((v - from) / (100 - from), p));
    const night = this.hour() >= 22 || this.hour() < 6;
    const sDrink = curve(e.thirst[i]!, 25, 1.3) * 1.25 + (e.thirst[i]! > 80 ? 0.6 : 0);
    const sFood = curve(e.hunger[i]!, 30, 1.3) * 1.15 + (e.hunger[i]! > 85 ? 0.5 : 0);
    const sEat = e.carry[i]! > 0 ? sFood * 1.1 : 0;
    const sForage = (e.carry[i]! > 0 ? sFood * 0.4 : sFood) + (e.carry[i]! < 2 && !night ? 0.14 : 0);
    const sSleep = curve(e.tired[i]!, 35, 1.2) * 1.1 + (night && e.tired[i]! > 30 ? 0.35 : 0);
    const sTalk = night ? 0 : curve(e.lonely[i]!, 20, 1.1) * 1.05;
    const sWander = night ? 0.05 : 0.18;
    const sRest = 0.1;
    const sTravel = w.travelOpen && !night ? 0.08 : 0;
    const scores = [sDrink, sEat, sForage, sSleep, sTalk, sWander, sRest, sTravel];
    const acts = [Act.Drink, Act.Eat, Act.Forage, Act.Sleep, Act.Talk, Act.Wander, Act.Rest, Act.Travel];
    let best = -1, bs = -1;
    for (let k = 0; k < scores.length; k++) {
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
        const t = this.nearestItem(i, 90);
        if (t < 0) { // nothing known nearby: search a little further away
          if (!this.wanderGo(i, 30)) return false;
          this.setAct(i, Act.Forage); this.schedule(i, 1); return true;
        }
        if (!this.goTo(i, e.x[t]!, e.y[t]!, e.hunger[i]! > 85)) return false;
        this.setAct(i, Act.Forage); e.target[i] = e.id(t); this.schedule(i, 1); return true;
      }
      case Act.Sleep: {
        // Prefer a roof (shelter tile) within 30 m; else sleep where you are.
        const t = this.nearestSpot(this.shelterSpots[m]!, w.maps[m]!.tiles.w, e.x[i]!, e.y[i]!, 30, rng.next() * 6);
        const W = w.maps[m]!.tiles.w;
        this.setAct(i, Act.Sleep);
        if (t >= 0 && this.goTo(i, (t % W) + 0.5, ((t / W) | 0) + 0.5)) { e.flags[i] = e.flags[i]! & ~EFlag.Sleeping; this.schedule(i, 1); }
        else { this.stop(i); this.schedule(i, 3); }
        return true;
      }
      case Act.Talk: {
        const j = this.nearestAgent(i, 60);
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
  private wanderGo(i: number, r: number): boolean {
    const w = this.w, e = w.e, m = e.map[i]!;
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

  private nearestAgent(i: number, r: number): number {
    const e = this.w.e, m = e.map[i]!;
    let best = -1, bd = r * r;
    for (let j = 0; j < e.hi; j++) {
      if (j === i || (e.kind[j] !== Kind.Agent && e.kind[j] !== Kind.Player) || e.map[j] !== m || e.act[j] === Act.Sleep) continue;
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

  /** After loading a snapshot: paths are not saved, walkers decide again. */
  reset(): void { this.pN.fill(0); }
}
