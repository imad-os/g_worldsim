import { Act, ANIMAL_NAMES, COLD_BELOW, DROP_BASE, EFlag, Kind } from '@worldsim/protocol';
import { NO_MAP } from './entities.js';
import { Pathfinder } from './pathfind.js';
import { ACT_RULE } from './rules.js';
import { ageOf } from './people.js';
import { INDEPENDENT } from './life.js';
import { BABY, kidTalk } from './family.js';
import { ANIMALS } from './animals.js';
import { Tactics } from './tactics.js';
import { FIRE_SAFE } from './zombies.js';
import type { World } from './world.js';
import { Why, type WhyCode } from './why.js';

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
/** How far from home a child (3-13) goes on their own (imad 2026-11-26: "they move for their needs, but not far from home"). */
export const KID_RANGE = 35;

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
  /** How far the quarry may get before the hunt is given up (60 m, or more when it was spotted further off). */
  private readonly huntFar: Float32Array;
  /** People whose survival job ended because no path led to its spot (read once by Survival for the reason). */
  readonly noWay = new Set<number>();
  /** Instinct: someone shouted about a threat (entity id) near this person (by entity id): they come to help or take cover. */
  private readonly alarm = new Map<number, { z: number; until: number }>();
  private readonly shoutAt = new Map<number, number>();
  private readonly tacticAt = new Map<number, number>();
  /** Plans against several attackers, ways out, focus fire (sim/tactics.ts). */
  readonly tactics: Tactics;
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
    this.huntId = new Int32Array(cap).fill(-1); this.huntUntil = new Float64Array(cap); this.huntFar = new Float32Array(cap).fill(60);
    this.whyCode = new Uint8Array(cap); this.whyArg = new Int32Array(cap).fill(-1); this.whyAt = new Float64Array(cap);
    this.ordKind = new Uint8Array(cap); this.ordWho = new Int32Array(cap).fill(-1); this.ordAct = new Int8Array(cap).fill(-1); this.ordUntil = new Float64Array(cap);
    this.tactics = new Tactics(w, cap);
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
    if (!run && this.leashed(i, x, y)) return false; // a child does not go far from home on their own
    this.searches++;
    // Clans at war keep out of each other's camps (sim/territory.ts): a goal inside one is refused, the way goes round them.
    const av = w.territory.avoidFor(i);
    if (av && w.territory.refuse(i, av, x, y)) { this.pN[i] = 0; return false; }
    pf.avoid = av;
    const r = pf.find(e.x[i]!, e.y[i]!, x, y);
    pf.avoid = null;
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
  /** "Why now" notes (sim/why.ts): code, entity id it is about, when (not saved). */
  readonly whyCode: Uint8Array;
  readonly whyArg: Int32Array;
  readonly whyAt: Float64Array;
  why(i: number, code: WhyCode, arg = -1): void { this.whyCode[i] = code; this.whyArg[i] = arg; this.whyAt[i] = this.w.gameSec; }
  wishOf(i: number): number { return this.wishUntil[i]! > this.w.gameSec ? this.wishAct[i]! : -1; }

  /**
   * An order: 'come' / 'goto' = walk to that person (entity id) and stay next to them, 'follow' = keep walking behind them,
   * 'stay' = stop where you are, 'stop' = forget orders, 'act' = do that action now (then it stays a strong wish).
   * Only a desperate need (about to die of thirst or hunger) interrupts it. Wakes a sleeper.
   */
  order(i: number, kind: 'come' | 'goto' | 'follow' | 'stay' | 'stop' | 'act' | 'bring', who: number, act: number, gameMinutes: number): boolean {
    const w = this.w, e = w.e;
    if (e.kind[i] !== Kind.Agent || w.family.dependent(i)) return false; // a baby cannot be sent anywhere
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
    if (e.kind[i] !== Kind.Agent || w.family.dependent(i)) return false;
    { // a new mother's week at home: work only inside it (the fridge, the chest)
      const h = w.family.lyingInHome(i), W = w.maps[e.map[i]!]!.tiles.w;
      if (h && w.survival.homes.at(h.m, Math.floor(sy) * W + Math.floor(sx)) !== h) return false;
    }
    this.ordKind[i] = 6; this.ordWho[i] = -1; this.ordAct[i] = act; this.ordUntil[i] = w.gameSec + 6 * HOUR;
    this.noWay.delete(e.id(i));
    this.jobX[i] = sx; this.jobY[i] = sy; this.faceX[i] = fx; this.faceY[i] = fy;
    if (e.flags[i]! & EFlag.Sleeping) this.setAct(i, Act.Idle);
    this.pN[i] = 0; this.replans[i] = 0;
    e.nextThink[i] = w.tick + 1;
    return true;
  }
  /** In a fight with a person: close in on them (x, y) or, when close, stand and face them. */
  duelMove(i: number, fx: number, fy: number, close: boolean, foe: number): void {
    const e = this.w.e;
    this.setAct(i, Act.Fight); e.target[i] = foe;
    if (close) { this.stop(i); e.angle[i] = Math.atan2(fy - e.y[i]!, fx - e.x[i]!); }
    else if (!this.walking(i) || Math.hypot(this.gx[i]! - fx, this.gy[i]! - fy) > 1.5) this.goTo(i, fx, fy, true);
    this.schedule(i, 0, 10);
  }
  /** Walk (run = hurry) away from (fx, fy) until `d` metres from it (sim/territory.ts: told to leave a clan's camp, or keeping clear of an enemy). */
  stepAway(i: number, fx: number, fy: number, d: number, run = false): boolean {
    const w = this.w, e = w.e;
    if (e.kind[i] !== Kind.Agent) return false;
    const dx = e.x[i]! - fx, dy = e.y[i]! - fy, l = Math.hypot(dx, dy) || 1;
    if (l >= d) return true;
    const s = w.freeSpot(e.map[i]!, fx + (dx / l) * d, fy + (dy / l) * d, 8);
    if (!s) return false;
    this.ordKind[i] = 0;
    if (e.flags[i]! & EFlag.Sleeping) e.flags[i] = e.flags[i]! & ~EFlag.Sleeping;
    if (!this.goTo(i, s.x, s.y, run)) return false;
    this.setAct(i, Act.Wander); e.target[i] = -1; e.goal[i] = -1;
    this.schedule(i, 1);
    return true;
  }
  /** Walk up to (x, y) and stand facing it (a guard speaking to an intruder). */
  confront(i: number, x: number, y: number): void {
    const w = this.w, e = w.e;
    if (e.kind[i] !== Kind.Agent) return;
    const d = Math.hypot(x - e.x[i]!, y - e.y[i]!);
    if (d > 3) { if (!this.walking(i) || Math.hypot(this.gx[i]! - x, this.gy[i]! - y) > 2) this.goTo(i, x, y, d > 10); }
    else { this.stop(i); e.angle[i] = Math.atan2(y - e.y[i]!, x - e.x[i]!); }
    this.setAct(i, Act.Idle);
    this.schedule(i, 0, 20);
  }
  /** The fight is over: the one who gave way walks off, the other calms down. */
  duelEnd(i: number, yielded: boolean, foe: number): void {
    const w = this.w, e = w.e, j = e.slot(foe);
    this.stop(i); this.setAct(i, Act.Idle); e.target[i] = -1;
    if (yielded && j >= 0) {
      const dx = e.x[i]! - e.x[j]!, dy = e.y[i]! - e.y[j]!, l = Math.hypot(dx, dy) || 1;
      const s = w.freeSpot(e.map[i]!, e.x[i]! + (dx / l) * 12, e.y[i]! + (dy / l) * 12, 8);
      if (s) this.goTo(i, s.x, s.y, true);
    }
    e.nextThink[i] = w.tick + 2;
  }
  /** Hunt an animal (entity id): chase it and hit it until it dies, runs off (60 m) or an hour passes. */
  hunt(i: number, id: number): boolean {
    const e = this.w.e;
    if (e.kind[i] !== Kind.Agent || this.w.e.slot(id) < 0 || this.w.family.dependent(i)) return false;
    this.huntId[i] = id; this.huntUntil[i] = this.w.gameSec + HOUR;
    const a = e.slot(id);
    this.huntFar[i] = this.w.ai.instinct && a >= 0 ? Math.max(60, Math.hypot(e.x[a]! - e.x[i]!, e.y[a]! - e.y[i]!) + 20) : 60;
    if (e.flags[i]! & EFlag.Sleeping) this.setAct(i, Act.Idle);
    e.nextThink[i] = this.w.tick + 1;
    return true;
  }
  huntOf(i: number): number { return this.huntId[i]!; }
  /**
   * A hunter with a bow and arrows shoots the animal from where they stand (imad 2026-11-26: "people must know how to use their
   * things"): one arrow every 1.5 s, the hit by skill and range (30 / 24 / 18 damage x the bow's level and quality, as for players).
   * Never with someone else near the line of fire. False = no bow / arrows, or no clear shot (then they close in as before).
   */
  private bowShot(i: number, a: number, d: number): boolean {
    const w = this.w, e = w.e, sv = w.survival, inv = sv.inv(i);
    if ((inv.bow ?? 0) < 1 || (inv.arrows ?? 0) < 1) return false;
    const m = e.map[i]!, x = e.x[i]!, y = e.y[i]!, dx = (e.x[a]! - x) / d, dy = (e.y[a]! - y) / d;
    for (let j = 0; j < e.hi; j++) {
      if (j === i || e.map[j] !== m || (e.kind[j] !== Kind.Agent && e.kind[j] !== Kind.Player)) continue;
      const rx = e.x[j]! - x, ry = e.y[j]! - y, along = rx * dx + ry * dy;
      if (along > 0 && along < d + 1 && Math.abs(rx * dy - ry * dx) < 1.5) return false; // someone in the way
    }
    this.stop(i); e.angle[i] = Math.atan2(dy, dx);
    const now = w.tick;
    if ((this.shotAt.get(e.id(i)) ?? -1e9) > now) return true; // drawing the next arrow
    this.shotAt.set(e.id(i), now + Math.round(1.5 / w.dt));
    sv.add(i, 'arrows', -1);
    w.gear.play(i, 'shoot');
    const p = w.shoot(m, x + dx * 0.6, y + dy * 0.6, dx, dy, i, 100);
    if (p >= 0) e.hp[p] = 0; // the flying arrow is only seen: the hit is decided here
    const skill = w.profileOf(i)?.traits.intelligence ?? 0.5;
    w.emit('shot', { id: e.id(i), at: e.id(a), d: Math.round(d) });
    if (!w.rng.chance(Math.max(0.25, 0.6 + skill * 0.3 - d / 50))) return true; // missed
    w.animals.hit(a, (d < 10 ? 30 : d < 16 ? 24 : 18) * w.gear.bowMul(i), i);
    return true;
  }
  private readonly shotAt = new Map<number, number>();
  /** How far the end of the path person i is walking is (0 = not walking): riders get on a horse for a long way. */
  goalDist(i: number): number { const e = this.w.e; return this.pN[i]! > 0 ? Math.hypot(this.gx[i]! - e.x[i]!, this.gy[i]! - e.y[i]!) : 0; }
  private hunting(i: number): boolean {
    const w = this.w, e = w.e, id = this.huntId[i]!;
    if (id < 0) return false;
    const a = e.slot(id);
    const d = a >= 0 && e.map[a] === e.map[i] ? Math.hypot(e.x[a]! - e.x[i]!, e.y[a]! - e.y[i]!) : Infinity;
    if (a < 0 || e.kind[a] !== Kind.Animal || d > this.huntFar[i]! || w.gameSec > this.huntUntil[i]! || e.thirst[i]! > 92 || e.hunger[i]! > 97 || e.hp[i]! < 30) {
      this.huntId[i] = -1;
      if (e.act[i] === Act.Fight) { this.stop(i); this.setAct(i, Act.Idle); e.target[i] = -1; }
      return false;
    }
    this.setAct(i, Act.Fight); e.target[i] = id;
    const ax = e.x[a]!, ay = e.y[a]!;
    if (d > 3.5 && d < 16 && this.bowShot(i, a, d)) { this.schedule(i, 0, 5); return true; } // a bow: shoot from afar (sim/knowhow.ts)
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
  /** Count the roofs of map m again (after buildings were pulled down). */
  resetShelters(m: number): void {
    const w = this.w, t = w.maps[m]!.tiles, shelter = new Set(w.sc.tiles.filter((x) => this.life.shelter.includes(x.name)).map((x) => x.id)), s: number[] = [];
    for (let k = 0; k < t.tiles.length; k++) if (t.cost[t.tiles[k]!]! > 0 && shelter.has(t.tiles[k]!)) s.push(k);
    this.shelterSpots[m] = Int32Array.from(s);
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
      if (!this.goTo(i, this.jobX[i]!, this.jobY[i]!)) { this.ordKind[i] = 0; this.noWay.add(e.id(i)); return false; }
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
    const w = this.w, e = w.e, m = e.map[i]!, T = this.tactics;
    if (w.clans.duelling(i)) { this.schedule(i, 0, 10); return true; } // a fight with a person (sim/clans.ts drives it)
    const asleep = (e.flags[i]! & EFlag.Sleeping) !== 0;
    const fighting = e.act[i] === Act.Fight, fleeing = e.act[i] === Act.Flee;
    const wild = w.wild(m); // the woods: people keep their eyes open (imad 2026-11-26: "they should know it is very dangerous")
    let z = w.zombies.nearest(m, e.x[i]!, e.y[i]!, fighting || fleeing ? 16 : asleep ? (wild ? 9 : 6) : wild || (w.ai.instinct && T.alert(i)) || w.aware.alert(i) ? 14 : 10);
    if (z < 0) z = w.animals.attacker(i); // a wolf or a bear going for them
    // A parent sees a zombie or a beast near their child (under 14): they go for it, even timid ones (imad 2026-11-25: "parents protect their kids").
    let protect = false;
    if (z < 0 && !fleeing) { z = w.family.threatToMine(i); protect = z >= 0; }
    // A clan member's child in danger (imad 2026-11-26: "clan members too feel responsible, by empathy and courage, but nobody faces 10
    // zombies for someone else's kid"): only the kind / brave, and only against a few.
    let clanKid = false;
    if (z < 0 && !fleeing && !asleep && w.ai.instinct) { z = w.family.threatToClanKid(i); clanKid = protect = z >= 0; }
    // Someone near is being bitten or gored: go and fight it with them (imad 2026-11-26: "if one is attacked and the other is near, both attack").
    let help = -1;
    if (z < 0 && !asleep && w.ai.instinct) { const v = T.victim(i); if (v) { z = v.z; help = v.v; } }
    let rally = false;
    if (z < 0 && w.ai.instinct) { // someone near shouted for help: the threat they saw
      const id = e.id(i), a = this.alarm.get(id);
      if (a) {
        const s = e.slot(a.z);
        if (a.until > w.gameSec && s >= 0 && e.map[s] === m && (e.kind[s] === Kind.Threat || e.kind[s] === Kind.Animal) && Math.hypot(e.x[s]! - e.x[i]!, e.y[s]! - e.y[i]!) < 35) { z = s; rally = true; }
        else this.alarm.delete(id);
      }
    }
    if (z < 0 && w.ai.instinct && !(e.flags[i]! & EFlag.Small)) { // the camp is under attack: everyone within 90 m comes to the rally point
      const mu = T.muster(m, i);
      if (mu && Math.hypot(mu.x - e.x[i]!, mu.y - e.y[i]!) < 90) z = w.zombies.nearest(m, mu.x, mu.y, 90);
      // Asleep by the fire with nothing close: sleep on (the fire keeps them off).
      if (z >= 0 && asleep && mu?.fire && Math.hypot(mu.x - e.x[i]!, mu.y - e.y[i]!) < 5.5 && w.zombies.nearest(m, e.x[i]!, e.y[i]!, 8) < 0) { this.schedule(i, 3); return true; }
    }
    if (z < 0) {
      if ((fighting && this.huntId[i]! < 0) || fleeing) { this.stop(i); this.setAct(i, Act.Idle); e.target[i] = -1; }
      T.reset(i);
      return false;
    }
    if (asleep) { this.setAct(i, Act.Idle); w.emit('wake', { id: e.id(i), why: 'zombie' }); }
    T.seen[i] = w.tick;
    const p = w.profileOf(i);
    const armed = w.survival.weapon(i)[1] > 0;
    // Everything coming for us here, not only the nearest one (several zombies = one plan against all of them).
    const th = T.threats(m, e.x[i]!, e.y[i]!, 14).slice();
    if (!th.includes(z)) th.push(z);
    // People defend themselves (imad 2026-11-21: "people can't attack"): bare hands count too; a friend already fighting it, or a rule-free
    // person with some nerve, joins in. Only the very timid, the hurt and children run.
    let allies = 0;
    for (let j = 0; j < e.hi && allies < 2; j++) if (j !== i && e.kind[j] === Kind.Agent && e.act[j] === Act.Fight && e.target[j] === e.id(z) && Math.hypot(e.x[j]! - e.x[i]!, e.y[j]! - e.y[i]!) < 14) allies++;
    let holding = w.family.kidsOf(i).some((k) => w.family.carried[k] === i); // a baby in arms: run with it, never fight
    // My little one on the ground: get to it and pick it up first (toddlers were left standing while their carer ran).
    if (!holding && e.kind[i] === Kind.Agent) {
      const near = Math.hypot(e.x[z]! - e.x[i]!, e.y[z]! - e.y[i]!);
      for (const k of w.family.kidsOf(i)) {
        if (w.family.carried[k]! >= 0) continue;
        const dk = Math.hypot(e.x[k]! - e.x[i]!, e.y[k]! - e.y[i]!);
        if (dk <= 1.8) { w.family.pickUp(k, i); holding = true; w.emit('care', { id: e.id(i), kid: e.id(k), what: 'grab' }); break; }
        if (dk < 25 && (near > 2.5 || dk < 4)) {
          if (asleep) this.setAct(i, Act.Idle);
          if (!this.walking(i) || Math.hypot(this.gx[i]! - e.x[k]!, this.gy[i]! - e.y[k]!) > 1.2) this.goTo(i, e.x[k]!, e.y[k]!, true);
          this.setAct(i, Act.Flee); e.target[i] = e.id(z); this.tactic(i, 'haven', th.length);
          this.schedule(i, 0, 3);
          return true;
        }
      }
    }
    const nerve = (p?.traits.courage ?? 0.5) + (p?.traits.strength ?? 0.5) * 0.4 + (armed ? 0.25 : 0) + allies * 0.15 + (protect ? 0.45 : 0) + (help >= 0 ? 0.3 : 0);
    // Safe by a fire (zombies and beasts keep off it): stay there, unless someone of ours outside needs us.
    const safe = w.ai.instinct && w.survival.fireNear(m, e.x[i]!, e.y[i]!, FIRE_SAFE - 0.5) >= 0;
    if (safe && !protect && help < 0) {
      if (!fleeing) w.emit('flee', { id: e.id(i), zombie: e.id(z) });
      this.stop(i); this.setAct(i, Act.Flee); e.target[i] = e.id(z); this.tactic(i, 'haven', th.length);
      this.schedule(i, 0, 10);
      return true;
    }
    // A camp under attack: rally at the fire / the camp and fight there together (sim/tactics.ts muster).
    const mu = w.ai.instinct && !protect && help < 0 ? T.muster(m, i) : null;
    const ral = mu ? this.rally(i, z, th, mu, holding) : false;
    if (ral === null) { if (e.act[i] === Act.Flee || e.act[i] === Act.Fight) { this.stop(i); this.setAct(i, Act.Idle); e.target[i] = -1; } return false; } // safe enough to see to thirst / hunger first
    if (ral) return true;
    let brave = !holding && (w.ai.instinct ? this.fightOrFlight(i, z, fighting, help >= 0, fleeing, protect ? (clanKid ? 1.2 : 1.8) : 1)
      : (nerve > 0.62 || fighting) && e.hp[i]! > (fighting ? 30 : protect ? 25 : 45) && !(e.flags[i]! & EFlag.Child) && !w.rules.forbidden(i, 'fight'));
    // A choice is kept for 5 s (no going out to fight and back to the fire every other second), unless badly hurt.
    if (w.ai.instinct) {
      // ... but hurt by 15+ since, or more of them come: choose again now (a guard kept fighting 4 zombies down to 20 hp, then died running).
      if (T.lockUntil[i]! > w.tick && e.hp[i]! >= 25 && !holding && T.lockHp[i]! - e.hp[i]! < 15 && th.length <= T.lockN[i]!) brave = T.lockBrave[i] === 1 && !w.rules.forbidden(i, 'fight');
      else { T.lockBrave[i] = brave ? 1 : 0; T.lockUntil[i] = w.tick + Math.round(5 / w.dt); T.lockHp[i] = e.hp[i]!; T.lockN[i] = Math.max(1, th.length); }
      // Running does not help when it keeps biting me (a boar, a zombie at my heels): turn and fight that one (a woman ran from a boar for 11 minutes and died).
      const cz = brave ? -1 : T.cornered(i);
      if (cz >= 0 && e.hp[i]! > 6 && !w.rules.forbidden(i, 'fight') && th.filter((j) => Math.hypot(e.x[j]! - e.x[i]!, e.y[j]! - e.y[i]!) < 3).length <= 2) {
        if (e.act[i] !== Act.Fight) w.emit('fight', { id: e.id(i), zombie: e.id(cz), cornered: true });
        this.setAct(i, Act.Fight); e.target[i] = e.id(cz); this.stop(i); e.angle[i] = Math.atan2(e.y[cz]! - e.y[i]!, e.x[cz]! - e.x[i]!);
        this.tactic(i, 'breakout', th.length); this.schedule(i, 0, 5);
        return true;
      }
    }
    if ((protect || help >= 0) && !brave) return false; // too weak to help: the danger is not at their own side
    const zx = e.x[z]!, zy = e.y[z]!, d = Math.hypot(zx - e.x[i]!, zy - e.y[i]!);
    if (w.ai.instinct && !rally && help < 0 && !fighting && !fleeing) this.shout(i, z, brave);
    if (rally && !brave && d > 14) { this.alarm.delete(e.id(i)); return false; } // heard it, too far to matter for someone who would not fight
    const runSpeed = w.sc.agents.run * 0.9;
    if (brave) {
      // Focus fire: the one friends already hit, else the closest / weakest; kept until it is dead or far.
      const t = w.ai.instinct ? T.target(i, z) : z;
      const tx = e.x[t]!, ty = e.y[t]!, td = Math.hypot(tx - e.x[i]!, ty - e.y[i]!);
      if (!fighting) w.emit('fight', { id: e.id(i), zombie: e.id(t) });
      this.setAct(i, Act.Fight); e.target[i] = e.id(t);
      // Hemmed in by two or more from different sides, few friends: step back so they come one at a time (kite), still facing the target.
      if (w.ai.instinct && th.length >= 2 && T.swarmed(i, th) && T.fightersOn(t, i) < 2) {
        const f = T.friends(i), out = T.escape(i, th, f, runSpeed);
        if (out.margin > -Infinity) {
          this.tactic(i, 'kite', th.length);
          const r = Math.min(4, out.len), gx = e.x[i]! + Math.cos(out.a) * r, gy = e.y[i]! + Math.sin(out.a) * r;
          if (!this.walking(i) || Math.hypot(this.gx[i]! - gx, this.gy[i]! - gy) > 2) this.goTo(i, gx, gy, true);
          this.schedule(i, 0, 5);
          return true;
        }
      }
      if (w.ai.instinct) this.tactic(i, help >= 0 ? 'help' : 'fight', th.length);
      if (td > 1.2) { if (!this.walking(i) || Math.hypot(this.gx[i]! - tx, this.gy[i]! - ty) > 1.5) this.goTo(i, tx, ty, true); }
      else { this.stop(i); e.angle[i] = Math.atan2(ty - e.y[i]!, tx - e.x[i]!); }
      this.schedule(i, 0, 5);
      return true;
    }
    // Run.
    if (!fleeing) w.emit('flee', { id: e.id(i), zombie: e.id(z) });
    this.setAct(i, Act.Flee); e.target[i] = e.id(z);
    if (!w.ai.instinct) return this.runOld(i, z, fleeing, d, zx, zy);
    // A haven: indoors when a door stands (zombies are put back at a door), else the camp's fire (zombies keep off it).
    const W = w.maps[m]!.tiles.w;
    let haven: { x: number; y: number } | null = null;
    if (w.survival.doorsUp(m) > 0) {
      const sp = this.shelterSpots[m]!, homes = w.survival.homes, h = homes.homeOf(e.id(i)); let bk = -1, bs = 60;
      for (let n = 0; n < sp.length; n++) {
        const k = sp[n]!;
        if (!homes.mayEnter(i, m, k)) continue; // only a roof whose door opens for me
        const kx = (k % W) + 0.5, ky = ((k / W) | 0) + 0.5, dk = Math.hypot(kx - e.x[i]!, ky - e.y[i]!), sc = dk - (h && homes.at(m, k) === h ? 8 : 0); // my own home first
        if (dk >= 60 || sc >= bs) continue;
        if (th.some((j) => Math.hypot(kx - e.x[j]!, ky - e.y[j]!) < 4)) continue; // a roof with a threat at it is no shelter
        bs = sc; bk = k;
      }
      if (bk >= 0) haven = { x: (bk % W) + 0.5, y: ((bk / W) | 0) + 0.5 };
    }
    if (!haven) {
      const camp = w.survival.campOf(m), f = camp ? w.survival.fireNear(m, camp.x, camp.y, 20) : -1;
      if (f >= 0) { const fx = (f % W) + 0.5, fy = ((f / W) | 0) + 0.5; if (Math.hypot(fx - e.x[i]!, fy - e.y[i]!) < 80) haven = { x: fx, y: fy }; }
    }
    if (haven && Math.hypot(haven.x - e.x[i]!, haven.y - e.y[i]!) < 1.6) { this.stop(i); this.tactic(i, 'haven', th.length); this.schedule(i, 0, 10); return true; } // safe there
    const pull = haven ?? T.friends(i);
    const out = T.escape(i, th, pull, runSpeed);
    // Surrounded with no way out: break through the one standing in the best way.
    if (out.margin < -1.5 && !w.rules.forbidden(i, 'fight') && !holding) {
      let b = z, ba = Infinity;
      for (const j of th) { const a = Math.abs(Math.atan2(Math.sin(Math.atan2(e.y[j]! - e.y[i]!, e.x[j]! - e.x[i]!) - out.a), Math.cos(Math.atan2(e.y[j]! - e.y[i]!, e.x[j]! - e.x[i]!) - out.a))); if (a < ba) { ba = a; b = j; } }
      this.tactic(i, 'breakout', th.length);
      this.setAct(i, Act.Fight); e.target[i] = e.id(b);
      const bd = Math.hypot(e.x[b]! - e.x[i]!, e.y[b]! - e.y[i]!);
      if (bd > 1.2) this.goTo(i, e.x[b]!, e.y[b]!, true); else { this.stop(i); e.angle[i] = Math.atan2(e.y[b]! - e.y[i]!, e.x[b]! - e.x[i]!); }
      this.schedule(i, 0, 5);
      return true;
    }
    // The haven's way is open (within 50 degrees of the best way out and not cut off): run there; else along the way out.
    let gx: number, gy: number;
    const ha = haven ? Math.atan2(haven.y - e.y[i]!, haven.x - e.x[i]!) : 0;
    if (haven && Math.cos(ha - out.a) > 0.64 && out.margin > 0) {
      this.tactic(i, 'haven', th.length);
      gx = haven.x; gy = haven.y;
      if (!this.walking(i) || Math.hypot(this.gx[i]! - gx, this.gy[i]! - gy) > 2) {
        const s = w.freeSpot(m, gx, gy, 10);
        if (!s || !this.goTo(i, s.x, s.y, true)) { gx = e.x[i]! + Math.cos(out.a) * out.len; gy = e.y[i]! + Math.sin(out.a) * out.len; this.goTo(i, gx, gy, true); }
      }
    } else {
      this.tactic(i, 'flee', th.length);
      gx = e.x[i]! + Math.cos(out.a) * out.len; gy = e.y[i]! + Math.sin(out.a) * out.len;
      // Same way as before and still far from its end: keep running, no new path (this is what stopped the a-b-a-b turning).
      const same = this.walking(i) && Math.hypot(this.gx[i]! - e.x[i]!, this.gy[i]! - e.y[i]!) > 3
        && Math.cos(Math.atan2(this.gy[i]! - e.y[i]!, this.gx[i]! - e.x[i]!) - out.a) > 0.8;
      if (!same && !this.goTo(i, gx, gy, true)) {
        const s = w.freeSpot(m, gx, gy, 14);
        if (!s || !this.goTo(i, s.x, s.y, true)) { if (!w.rules.forbidden(i, 'fight')) { this.setAct(i, Act.Fight); e.target[i] = e.id(z); this.stop(i); } } // cornered: fight back
      }
    }
    this.schedule(i, 0, 8);
    return true;
  }

  /**
   * The camp is under attack (T.muster): go to the rally point, running round the zombies; there, children, the hurt and those holding
   * a baby stay in the middle, the others fight what comes within reach of the group (at a fire: only what comes close, the fire keeps
   * the rest off). False = not for me (far away, a zombie right on me: the usual fight-or-run decides).
   */
  private rally(i: number, z: number, th: number[], mu: { x: number; y: number; fire: boolean; ash: number }, holding: boolean): boolean | null {
    const w = this.w, e = w.e, m = e.map[i]!, T = this.tactics;
    const dm = Math.hypot(mu.x - e.x[i]!, mu.y - e.y[i]!);
    if (dm > 90) return false;
    // Thirsty or hungry and nothing within 20 m, or parched / starving and nothing right on me: go and see to it (a boy died of
    // thirst by the fire waiting out the night; on a second day 6 and 9 of 20 did, zombies hovering round the fire).
    const pressing = e.thirst[i]! > 82 || e.hunger[i]! > 88;
    if ((e.thirst[i]! > 70 || e.hunger[i]! > 80) && w.zombies.nearest(m, e.x[i]!, e.y[i]!, pressing ? 4 : 20) < 0) return null;
    if (pressing) return false; // one on me: the usual fight-or-run
    const weak = holding || (e.flags[i]! & EFlag.Child) !== 0 || e.hp[i]! < 35 || w.rules.forbidden(i, 'fight');
    const R = mu.fire ? 3.6 : 4; // arrived: within R + 1 (by a fire: only within 5 m are they out of the zombies' reach)
    if (dm > R + 1 && !weak && e.act[i] === Act.Fight && e.hp[i]! >= 45) { // out with the group after one: see it through
      const t = e.slot(e.target[i]!);
      if (t >= 0 && e.kind[t] === Kind.Threat && e.map[t] === m && Math.hypot(e.x[t]! - mu.x, e.y[t]! - mu.y) < 74) return this.engage(i, t, th.length);
    }
    if (dm > R + 1) {
      const dz = Math.hypot(e.x[z]! - e.x[i]!, e.y[z]! - e.y[i]!);
      if (dz < 1.6 && !weak) return false; // one on me: deal with it first
      // A zombie between me and the group: go round it (the way out that leans most towards the rally point).
      const ang = Math.atan2(mu.y - e.y[i]!, mu.x - e.x[i]!);
      let gx = mu.x, gy = mu.y;
      const blocked = th.some((j) => { const a = Math.atan2(e.y[j]! - e.y[i]!, e.x[j]! - e.x[i]!), d = Math.hypot(e.x[j]! - e.x[i]!, e.y[j]! - e.y[i]!); return d < Math.min(dm, 8) && Math.cos(a - ang) > 0.8; });
      if (blocked) { const out = T.escape(i, th, mu, w.sc.agents.run * 0.9); if (out.margin > -Infinity) { gx = e.x[i]! + Math.cos(out.a) * out.len; gy = e.y[i]! + Math.sin(out.a) * out.len; } }
      if (!this.walking(i) || Math.hypot(this.gx[i]! - gx, this.gy[i]! - gy) > 2.5) {
        const s = blocked ? w.freeSpot(m, gx, gy, 6) : this.spotBy(m, mu, mu.fire ? 4.4 : 4);
        if (!s || !this.goTo(i, s.x, s.y, true)) return false;
      }
      if (e.act[i] !== Act.Flee) w.emit('flee', { id: e.id(i), zombie: e.id(z), rally: true });
      this.setAct(i, Act.Flee); e.target[i] = e.id(z); this.tactic(i, 'haven', th.length);
      this.schedule(i, 0, 5);
      return true;
    }
    // At the rally point. One biting me: hit back (a man stood in the crowd and was bitten 13 times).
    const on = th.find((j) => Math.hypot(e.x[j]! - e.x[i]!, e.y[j]! - e.y[i]!) < 1.6);
    if (on !== undefined && e.hp[i]! >= 25 && !holding && !(e.flags[i]! & EFlag.Child) && !w.rules.forbidden(i, 'fight')) return this.engage(i, on, th.length);
    // The weak (children, the hurt, a baby in arms) into the middle, inside the fire's reach.
    if (weak && mu.fire && dm > 4) {
      if (!this.walking(i) || Math.hypot(this.gx[i]! - mu.x, this.gy[i]! - mu.y) > 4) {
        const s = this.spotBy(m, mu, 3.5);
        if (s) this.goTo(i, s.x, s.y, true);
      }
      this.setAct(i, Act.Flee); e.target[i] = e.id(z); this.schedule(i, 0, 4);
      return true;
    }
    // The fire is out: light it again (a piece of wood from my bag or the store).
    if (!mu.fire && dm < 2.6 && mu.ash >= 0 && w.survival.relight(i, m, mu.ash)) w.speak(i, 'Fire! Stay by the fire!');
    const reach = mu.fire ? 7 : 6;
    let t = -1, td = Infinity;
    if (!weak) for (const j of th) { const d = Math.hypot(e.x[j]! - mu.x, e.y[j]! - mu.y); if (d < reach && d < td) { td = d; t = j; } }
    if (t >= 0) {
      t = T.target(i, t);
      if (Math.hypot(e.x[t]! - mu.x, e.y[t]! - mu.y) > reach + 1) t = -1;
    }
    if (t < 0 && !weak && e.hp[i]! >= 50) t = this.sally(i, mu);
    if (t < 0) { // hold: stand in the group; by a fire with nothing close, sleep there
      this.stop(i);
      if (mu.fire && e.tired[i]! > (this.hour() >= 21 || this.hour() < 6 ? 20 : 60) && !th.some((j) => Math.hypot(e.x[j]! - e.x[i]!, e.y[j]! - e.y[i]!) < 9)) {
        this.setAct(i, Act.Sleep); w.emit('sleep', { id: e.id(i), fire: true }); this.schedule(i, 3); return true;
      }
      this.setAct(i, Act.Flee); e.target[i] = e.id(z); this.tactic(i, 'haven', th.length);
      this.schedule(i, 0, 5);
      return true;
    }
    return this.engage(i, t, th.length);
  }
  /** A free spot within r metres of point c (round a fire: inside its reach), or null. */
  private spotBy(m: number, c: { x: number; y: number }, r: number): { x: number; y: number } | null {
    const w = this.w;
    for (let k = 0; k < 10; k++) {
      const a = w.rng.next() * Math.PI * 2, d = 1.2 + w.rng.next() * (r - 1.2);
      const s = w.freeSpot(m, c.x + Math.cos(a) * d, c.y + Math.sin(a) * d, 1.5);
      if (s && Math.hypot(s.x - c.x, s.y - c.y) <= r) return s;
    }
    return w.freeSpot(m, c.x, c.y, r);
  }
  private engage(i: number, t: number, n: number): boolean {
    const w = this.w, e = w.e;
    if (e.act[i] !== Act.Fight) w.emit('fight', { id: e.id(i), zombie: e.id(t), rally: true });
    this.setAct(i, Act.Fight); e.target[i] = e.id(t); this.tactic(i, 'fight', n);
    const tx = e.x[t]!, ty = e.y[t]!, d = Math.hypot(tx - e.x[i]!, ty - e.y[i]!);
    if (d > 1.2) { if (!this.walking(i) || Math.hypot(this.gx[i]! - tx, this.gy[i]! - ty) > 1.5) this.goTo(i, tx, ty, true); }
    else { this.stop(i); e.angle[i] = Math.atan2(ty - e.y[i]!, tx - e.x[i]!); }
    this.schedule(i, 0, 5);
    return true;
  }

  /**
   * From the rally point, the group goes out together for the zombie nearest to it (within 70 m) when it is outnumbered three to
   * one by the fit grown-ups there (so the camp is cleared one by one, not by people alone). The zombie (slot), or -1.
   */
  private sally(i: number, mu: { x: number; y: number }): number {
    const w = this.w, e = w.e, m = e.map[i]!;
    let z = -1, zd = 70;
    for (let j = 0; j < e.hi; j++) if (e.kind[j] === Kind.Threat && e.map[j] === m) { const d = Math.hypot(e.x[j]! - mu.x, e.y[j]! - mu.y); if (d < zd) { zd = d; z = j; } }
    if (z < 0) return -1;
    let near = 0, group = 0;
    for (let j = 0; j < e.hi; j++) {
      if (e.map[j] !== m) continue;
      if (e.kind[j] === Kind.Threat) { if (Math.hypot(e.x[j]! - e.x[z]!, e.y[j]! - e.y[z]!) < 8) near++; continue; }
      if (e.kind[j] !== Kind.Agent || e.flags[j]! & (EFlag.Child | EFlag.Sleeping) || e.hp[j]! < 50) continue;
      const d = Math.hypot(e.x[j]! - mu.x, e.y[j]! - mu.y);
      if (d < 7 || (e.act[j] === Act.Fight && e.target[j] === e.id(z))) group++;
    }
    return group >= 3 && group >= near * 2.5 ? z : -1;
  }

  /** Say what we do against a group (once per plan change, at most every 40 game seconds) and log it (event `tactic`). */
  private tactic(i: number, plan: 'fight' | 'help' | 'kite' | 'flee' | 'haven' | 'breakout', n: number): void {
    const w = this.w, id = this.w.e.id(i);
    if (!this.tactics.setPlan(i, plan === 'help' ? 'fight' : plan) && plan !== 'help') return;
    if ((this.tacticAt.get(id) ?? 0) > w.gameSec) return;
    this.tacticAt.set(id, w.gameSec + 40);
    w.emit('tactic', { id, plan, n, map: w.maps[w.e.map[i]!]!.def.id });
    if (n < 2 && plan !== 'help') return;
    const line = plan === 'help' ? 'Hold on, I am coming!' : plan === 'fight' ? `${n} of them! Stay together, hit the same one!`
      : plan === 'kite' ? 'Back off, do not let them get round you!' : plan === 'haven' ? `${n} of them! Inside, now!`
      : plan === 'breakout' ? 'They have me surrounded, I am breaking through!' : `Too many of them, run!`;
    w.speak(i, line);
  }

  /** Running away without the instinct flag (the first version, kept for experiments' "old" arm). */
  private runOld(i: number, z: number, fleeing: boolean, d: number, zx: number, zy: number): boolean {
    const w = this.w, e = w.e, m = e.map[i]!;
    if (fleeing && this.walking(i) && d > 4) { this.schedule(i, 0, 8); return true; }
    const camp = w.survival.campOf(m), f = camp ? w.survival.fireNear(m, camp.x, camp.y, 20) : -1;
    const W = w.maps[m]!.tiles.w;
    let ok = false;
    if (w.survival.doorsUp(m) > 0) {
      const sp = this.shelterSpots[m]!, homes = w.survival.homes, h = homes.homeOf(e.id(i)); let bk = -1, bs = 60, bd = 60;
      for (let n = 0; n < sp.length; n++) {
        const k = sp[n]!;
        if (!homes.mayEnter(i, m, k)) continue;
        const dk = Math.hypot((k % W) + 0.5 - e.x[i]!, ((k / W) | 0) + 0.5 - e.y[i]!), sc = dk - (h && homes.at(m, k) === h ? 8 : 0);
        if (dk < 60 && sc < bs) { bs = sc; bd = dk; bk = k; }
      }
      if (bk >= 0) { if (bd < 1.2) { this.stop(i); this.schedule(i, 0, 10); return true; } ok = this.goTo(i, (bk % W) + 0.5, ((bk / W) | 0) + 0.5, true); }
    }
    if (!ok && f >= 0) {
      const fx = (f % W) + 0.5, fy = ((f / W) | 0) + 0.5;
      if (Math.hypot(fx - e.x[i]!, fy - e.y[i]!) < 80 && Math.hypot(fx - e.x[i]!, fy - e.y[i]!) > 2.5) {
        const s = w.freeSpot(m, fx + w.rng.range(-1.8, 1.8), fy + w.rng.range(-1.8, 1.8), 10);
        if (s) ok = this.goTo(i, s.x, s.y, true);
      } else if (Math.hypot(fx - e.x[i]!, fy - e.y[i]!) <= 2.5) { this.stop(i); this.schedule(i, 0, 10); return true; }
    }
    if (!ok) {
      const dx = e.x[i]! - zx, dy = e.y[i]! - zy, l = Math.hypot(dx, dy) || 1;
      const s = w.freeSpot(m, e.x[i]! + (dx / l) * 14, e.y[i]! + (dy / l) * 14, 10);
      if (s) ok = this.goTo(i, s.x, s.y, true);
    }
    if (!ok && !w.rules.forbidden(i, 'fight')) { this.setAct(i, Act.Fight); e.target[i] = e.id(z); this.stop(i); }
    this.schedule(i, 0, 8);
    return true;
  }

  /**
   * Fight or flight by the odds (instinct): how long our side would last against their bites versus how long they last
   * against our blows, counting friends close by (those already fighting fully, the others as maybe), weapons and strength.
   * Courage shifts the bar; kin in danger (a child, a partner, a parent next to the threat) makes people stand and fight.
   * One zombie or a wolf: fight. Two zombies alone: run, with two friends: fight. A bear bare-handed alone: run.
   */
  fightOrFlight(i: number, z: number, fighting: boolean, helping = false, fleeing = false, protect = 1): boolean {
    const w = this.w, e = w.e, m = e.map[i]!;
    if ((e.flags[i]! & EFlag.Child) || w.rules.forbidden(i, 'fight')) return false;
    if (e.hp[i]! < (fighting ? 25 : 40)) return false;
    const zx = e.x[z]!, zy = e.y[z]!, zid = e.id(z);
    let tHp = 0, tDps = 0;
    for (let j = 0; j < e.hi; j++) {
      if (e.map[j] !== m || Math.hypot(e.x[j]! - zx, e.y[j]! - zy) > 12) continue;
      if (e.kind[j] === Kind.Threat) { tHp += Math.max(1, e.hp[j]!); tDps += w.zombies.cfg.bite / 1.2; }
      else if (e.kind[j] === Kind.Animal && (j === z || e.act[j] === Act.Fight)) { tHp += Math.max(1, e.hp[j]!); tDps += (ANIMALS[e.sub[j]!]?.bite ?? 5) / 1.4; }
    }
    let oHp = e.hp[i]!, oDps = w.zombies.damageOf(i);
    for (let j = 0; j < e.hi; j++) {
      if (j === i || e.map[j] !== m || (e.kind[j] !== Kind.Agent && e.kind[j] !== Kind.Player)) continue;
      if (Math.hypot(e.x[j]! - e.x[i]!, e.y[j]! - e.y[i]!) > 14 || (e.flags[j]! & (EFlag.Child | EFlag.Sleeping))) continue;
      if (e.kind[j] === Kind.Player && w.away.has(e.id(j))) continue;
      // Friends on their feet count even while running: they stand together if together they win (else all ran because all ran).
      const d = Math.hypot(e.x[j]! - e.x[i]!, e.y[j]! - e.y[i]!);
      const k = e.act[j] === Act.Fight && e.target[j] === zid ? 1 : e.hp[j]! < 45 ? 0 : e.act[j] === Act.Flee ? (d < 10 ? 0.5 : 0) : 0.6;
      oHp += e.hp[j]! * k; oDps += w.zombies.damageOf(j) * k;
    }
    const odds = (oHp / Math.max(0.1, tDps)) / (tHp / Math.max(0.1, oDps)); // > 1: we outlast them
    const courage = w.profileOf(i)?.traits.courage ?? 0.5;
    // What the people learned of this kind of threat (deaths of those before) takes some nerve away.
    const kindName = e.kind[z] === Kind.Threat ? 'zombie' : (ANIMAL_NAMES[e.sub[z]!] ?? '');
    const nerve = (0.55 + courage * 0.9 + (w.survival.weapon(i)[1] > 0 ? 0.1 : 0)) * (1 - Math.min(0.3, w.lore.fearOf(i, kindName) / 30));
    // Kin next to it, or a neighbour being bitten right now, make people stand; once running they keep running unless it turns (hysteresis).
    return odds * nerve * (this.kinNear(i, zx, zy) ? 1.6 : 1) * (helping ? 1.5 : 1) * protect * (fighting ? 1.4 : fleeing ? 0.8 : 1) >= 1;
  }

  /** A child, partner or parent of person i within 10 m of (x, y). */
  private kinNear(i: number, x: number, y: number): boolean {
    const w = this.w, e = w.e, p = w.profileOf(i);
    if (!p) return false;
    const me = e.id(i), near = (id: number) => { const j = e.slot(id); return j >= 0 && e.map[j] === e.map[i] && Math.hypot(e.x[j]! - x, e.y[j]! - y) < 10; };
    if (p.partner >= 0 && near(p.partner)) return true;
    if (p.parents.some(near)) return true;
    for (const [id, q] of w.profiles) if (q.parents.includes(me) && near(id)) return true;
    return false;
  }

  /** Instinct: a shout when a threat shows up (once a game minute or two): people within 30 m hear it, sleepers within 12 m wake. */
  private shout(i: number, z: number, fight: boolean): void {
    const w = this.w, e = w.e, id = e.id(i), now = w.gameSec, m = e.map[i]!;
    if ((this.shoutAt.get(id) ?? 0) > now) return;
    this.shoutAt.set(id, now + 120);
    let n = 0;
    for (let j = 0; j < e.hi; j++) {
      if (j === i || e.kind[j] !== Kind.Agent || e.map[j] !== m) continue;
      const d = Math.hypot(e.x[j]! - e.x[i]!, e.y[j]! - e.y[i]!);
      if (d > 30) continue;
      if (e.flags[j]! & EFlag.Sleeping) { if (d > 12) continue; this.setAct(j, Act.Idle); w.emit('wake', { id: e.id(j), why: 'alarm' }); }
      this.alarm.set(e.id(j), { z: e.id(z), until: now + 600 });
      e.nextThink[j] = w.tick + 1;
      n++;
    }
    const zombie = e.kind[z] === Kind.Threat;
    w.emit('alarm', { id, threat: e.id(z), zombie, n, map: w.maps[m]!.def.id });
    if (n) w.speak(i, zombie ? (fight ? 'A zombie! With me, everyone!' : 'Zombies! Run, get inside!') : (fight ? 'An animal is on me! Help!' : 'A wild animal! Get away!'));
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
      // A player sleeps until they get up themselves (a move, A, Sleep again): waking them when rested made Sleep end at once
      // when they were not tired (imad 2026-11-27: "it sleeps and wakes the same time").
      // Company: people awake within 6 m keep loneliness down, alone it grows like everyone's (it was never counted: the bar stayed full).
      if (!asleep) {
        const near = this.company(i, 6);
        e.lonely[i] = near > 0 ? Math.max(0, e.lonely[i]! - (8 + 4 * Math.min(3, near)) * h) : Math.min(100, e.lonely[i]! + N.lonely * k * h);
      }
      // Wounds (zombie bites) heal: 20 a game hour when fed and watered, twice that asleep, twice again by a fire.
      // Cold (sim/weather.ts): standing still under 5 °C costs health; while it takes more than 2 an hour, healing is halved.
      const chill = w.weather.chill(i), byFire = w.survival.warm(e.map[i]!, e.x[i]!, e.y[i]!);
      this.chilled[i] = chill;
      if (e.hunger[i]! < 60 && e.thirst[i]! < 60) e.hp[i] = Math.min(w.sc.agents.hp, e.hp[i]! + 20 * h * (asleep ? 2 : 1) * (byFire ? 2 : 1) * (chill > 2 ? 0.5 : 1));
      if (chill > 0) e.hp[i] = Math.max(5, e.hp[i]! - chill * h); // a player's character is hurt, never killed
    }
  }

  /** People awake within r metres of i (agents and players' characters on the map, not away). */
  company(i: number, r: number): number {
    const w = this.w, e = w.e; let n = 0;
    for (let j = 0; j < e.hi; j++) {
      if (j === i || e.map[j] !== e.map[i] || (e.kind[j] !== Kind.Agent && e.kind[j] !== Kind.Player)) continue;
      if ((e.flags[j]! & EFlag.Sleeping) || e.act[j] === Act.Sleep || w.away.has(e.id(j))) continue;
      if (Math.abs(e.x[j]! - e.x[i]!) < r && Math.abs(e.y[j]! - e.y[i]!) < r && Math.hypot(e.x[j]! - e.x[i]!, e.y[j]! - e.y[i]!) < r) n++;
    }
    return n;
  }

  /** Metres from (x, y) to the nearest place to drink on map m (Infinity = none). */
  waterDist(m: number, x: number, y: number): number {
    const W = this.w.maps[m]!.tiles.w, t = this.nearestSpot(this.drinkSpots[m]!, W, x, y);
    return t < 0 ? Infinity : Math.hypot((t % W) + 0.5 - x, ((t / W) | 0) + 0.5 - y);
  }
  /** The nearest place to drink from person i (a tile index, -1 = none on this map). */
  waterSpot(i: number): number {
    const e = this.w.e, m = e.map[i]!;
    return this.nearestSpot(this.drinkSpots[m]!, this.w.maps[m]!.tiles.w, e.x[i]!, e.y[i]!);
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
    const item = () => { const t = this.nearestItem(i, 1.8, true); return t; };
    if (a === 'use') {
      if (item() >= 0) a = 'pickup';
      else if (this.nearWater(m, e.x[i]!, e.y[i]!) && e.thirst[i]! > 5) a = 'drink';
      else if (this.nearWater(m, e.x[i]!, e.y[i]!)) a = 'fill'; // not thirsty at the water: fill bottles for later (imad 2026-11-26)
      else if (w.survival.foodOf(i) > 0 && e.hunger[i]! > 15) a = 'eat';
      else return { ok: false, code: 'nothing' };
    }
    switch (a) {
      case 'drink':
        if (!this.nearWater(m, e.x[i]!, e.y[i]!)) return w.survival.drinkBottle(i) ? { ok: true, code: 'drankBottle' } : { ok: false, code: 'noWater' };
        e.thirst[i] = 0; w.emit('drink', { id: e.id(i), player: true });
        return { ok: true, code: 'drank' };
      case 'fill': {
        if (!this.nearWater(m, e.x[i]!, e.y[i]!)) return { ok: false, code: 'noWater' };
        const n = w.survival.fillBottles(i);
        return n > 0 ? { ok: true, code: 'filled', item: String(w.survival.inv(i).water ?? 0) } : { ok: false, code: 'bottlesFull' };
      }
      case 'pickup': {
        const t = item();
        if (t < 0) return { ok: false, code: 'nothing' };
        if (w.survival.isDrop(t)) { // piles my work dropped: everything within 2 m that fits
          const r = w.survival.pickDrops(i, 2);
          return Object.keys(r.got).length ? { ok: true, code: 'pickedDrop', got: r.got, left: r.left } as { ok: boolean; code: string } : { ok: false, code: 'full' };
        }
        if (w.survival.foodRoom(i) <= 0) return { ok: false, code: 'full' }; // hands (5) and bag (20) both full
        const def = this.itemDef.get(e.sub[t]!), toBag = e.carry[i]! >= 5;
        w.remove(t, 'taken');
        w.survival.addFood(i, 1);
        w.emit('pickup', { id: e.id(i), item: def?.name ?? 'food', player: true });
        return { ok: true, code: toBag ? 'pickedBag' : 'picked', item: def?.name ?? 'food' };
      }
      case 'eat':
        w.survival.refill(i);
        if (e.carry[i]! <= 0) return { ok: false, code: 'noFood' };
        e.carry[i]!--; e.hunger[i] = Math.max(0, e.hunger[i]! - 35);
        w.survival.refill(i);
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
  /** Walks home that were cut short (sleep), per slot. */
  private readonly homeTries: number[] = [];
  /** 1 = asleep in the open (not home, no roof, no fire): light, uneasy sleep. */
  private readonly outside: number[] = [];
  /** Health the cold took a game hour at the last look (sim/weather.ts; 0 = warm enough). */
  readonly chilled: number[] = [];
  private readonly frozen: number[] = [];
  private shelterIds: Set<number> | null = null;
  /**
   * Sleeping here is safe (imad 2026-11-26: "make them feel it is risky to sleep outside their hut"): inside my own (family's) home,
   * by a fire or under a roof. Anywhere else = light, uneasy sleep (rest comes slower) and they go home once a little rested.
   */
  sleepSafe(i: number): boolean {
    const w = this.w, e = w.e, m = e.map[i]!, homes = w.survival.homes, h = homes.homeOf(e.id(i));
    if (h && h.m === m && homes.inside(i, h)) return true;
    if (w.survival.warm(m, e.x[i]!, e.y[i]!)) return true; // by a fire (the camp's, a siege rally): watched over, not alone in the dark
    const t = w.maps[m]!.tiles, x = Math.floor(e.x[i]!), y = Math.floor(e.y[i]!);
    if (x < 0 || y < 0 || x >= t.w || y >= t.h) return false;
    this.shelterIds ??= new Set(w.sc.tiles.filter((s) => this.life.shelter.includes(s.name)).map((s) => s.id));
    return this.shelterIds.has(t.tiles[y * t.w + x]!);
  }
  /** Someone with a hut d metres away may sleep where they are only with no choice: worn out (tired 97+) and 60 m+ away, or badly hurt (hp < 25 %) and 30 m+ away. */
  mayStayOut(i: number, d: number): boolean {
    const e = this.w.e;
    return (e.tired[i]! >= 97 && d > 60) || (e.hp[i]! < this.w.sc.agents.hp * 0.25 && d > 30);
  }
  /**
   * Freezing where they stand (sim/weather.ts): standing still in the cold and losing health = walk to the burning fire (anywhere on the
   * map: walking keeps them warm), else home, and stay there a while. True = on the way.
   */
  private warmUp(i: number): boolean {
    const w = this.w, e = w.e;
    if ((this.chilled[i] ?? 0) <= 4 || this.walking(i) || e.hp[i]! > w.sc.agents.hp * 0.85 || w.family.dependent(i) || e.act[i] === Act.Fight) return false;
    if (e.act[i] === Act.Sleep && e.hp[i]! > w.sc.agents.hp * 0.7) return false; // asleep: woken by continueAct when it gets bad
    const W = w.maps[e.map[i]!]!.tiles.w, f = this.fireSpot(i, 260), t = f >= 0 ? f : this.homeSpot(i);
    if (t < 0 || Math.hypot((t % W) + 0.5 - e.x[i]!, ((t / W) | 0) + 0.5 - e.y[i]!) < 2) return false;
    if (e.act[i] === Act.Sleep) w.emit('wake', { id: e.id(i), why: 'cold' });
    this.setAct(i, e.tired[i]! > 60 ? Act.Sleep : Act.Rest, e.tired[i]! > 60 ? 0 : 60 + w.rng.next() * 60);
    if (e.act[i] === Act.Sleep) e.flags[i] = e.flags[i]! & ~EFlag.Sleeping;
    if (!this.goTo(i, (t % W) + 0.5, ((t / W) | 0) + 0.5)) { this.setAct(i, Act.Idle); return false; }
    if (e.act[i] === Act.Rest) e.goal[i] = -5;
    this.schedule(i, 1);
    return true;
  }
  /** A free tile 1.5-3.5 m from the nearest burning fire within r metres (warm all night), or -1. */
  fireSpot(i: number, r: number): number {
    const w = this.w, e = w.e, m = e.map[i]!, sv = w.survival, W = w.maps[m]!.tiles.w;
    const camp = sv.campOf(m);
    let f = camp ? sv.fireNear(m, camp.x, camp.y, 15) : -1;
    if (f < 0 || Math.hypot((f % W) + 0.5 - e.x[i]!, ((f / W) | 0) + 0.5 - e.y[i]!) > r) f = sv.fireNear(m, e.x[i]!, e.y[i]!, r);
    if (f < 0 || sv.fuel(m, f) < 2) return -1;
    const a = ((e.id(i) * 2.399) % (2 * Math.PI)), d = 1.6 + ((e.id(i) * 7) % 5) * 0.4;
    const s = w.freeSpot(m, (f % W) + 0.5 + Math.cos(a) * d, ((f / W) | 0) + 0.5 + Math.sin(a) * d, 3);
    if (!s || !sv.warm(m, s.x, s.y)) return -1;
    return Math.floor(s.y) * W + Math.floor(s.x);
  }
  /** A free tile inside my home's room (a bed first; spread by person so a family does not stack on one tile), or -1. */
  homeSpot(i: number): number {
    const w = this.w, e = w.e, homes = w.survival.homes, h = homes.homeOf(e.id(i));
    if (!h || h.m !== e.map[i]) return -1;
    const r = w.survival.hutRect(h.m, h.out, h.dir), tm = w.maps[h.m]!.tiles;
    if (!r) return -1;
    const cells: number[] = [];
    for (let yy = 1; yy <= 3; yy++) for (let xx = 1; xx <= 3; xx++) { const k = (r.y0 + yy) * tm.w + r.x0 + xx; if (!tm.solid[tm.tiles[k]!] || tm.tiles[k] === w.survival.T.bed) cells.push(k); }
    if (!cells.length) return -1;
    const bed = cells.find((k) => tm.tiles[k] === w.survival.T.bed);
    if (bed !== undefined && !tm.solid[w.survival.T.bed]) return bed;
    const free = cells.filter((k) => k !== r.inside); // never block the doorway's inside tile
    const list = free.length ? free : cells;
    return list[(e.id(i) * 7) % list.length]!;
  }

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
    e.tired[i] = asleep ? Math.max(0, e.tired[i]! - N.sleepRecover * warm * (this.outside[i] ? 0.6 : 1) * since) : Math.min(100, e.tired[i]! + N.tired * k * since);
    e.lonely[i] = Math.min(100, e.lonely[i]! + N.lonely * k * since);
    // Health: starving or parched hurts; otherwise it heals slowly (faster by a fire). Standing still in the cold hurts (sim/weather.ts).
    const chill = w.weather.chill(i);
    this.chilled[i] = chill;
    if (e.hunger[i]! >= 100 || e.thirst[i]! >= 100) e.hp[i]! -= 6 * since * k;
    else if (e.hunger[i]! < 60 && e.thirst[i]! < 60) e.hp[i] = Math.min(w.sc.agents.hp, e.hp[i]! + 3 * since * (w.survival.warm(e.map[i]!, e.x[i]!, e.y[i]!) ? 2.5 : 1) * (chill > 2 ? 0.5 : 1));
    if (chill > 0) { e.hp[i]! -= chill * since; if (e.hp[i]! <= 0) this.frozen[i] = 1; }
    if (e.hp[i]! <= 0 && w.charName(i)) e.hp[i] = 5; // a player's character on autopilot is hurt, never killed
    if (e.hp[i]! <= 0) {
      const cause = this.frozen[i] && e.hunger[i]! < 100 && e.thirst[i]! < 100 ? 'cold' : e.thirst[i]! >= 100 ? 'thirst' : 'hunger';
      this.frozen[i] = 0;
      w.emit('death', { id: e.id(i), cause, map: w.maps[e.map[i]!]!.def.id, x: e.x[i], y: e.y[i] });
      w.remove(i, cause);
      return;
    }
    if (!this.walking(i)) e.actT[i] = Math.max(0, e.actT[i]! - since * HOUR / w.opt.clockScale); // timers run once there
    if (w.family.dependent(i)) { this.little(i); return; } // under 3: looked after, never on their own
    if (this.danger(i)) return;
    if (this.tendKids(i)) return;
    if (this.hunting(i)) return;
    if (this.obey(i)) return;
    if (this.warmUp(i)) return;
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
      const home = this.kidHome(i);
      if (d > 7 && (!home || Math.hypot(e.x[guard]! - home.x, e.y[guard]! - home.y) < KID_RANGE)) { // with mum while she is near home
        const s = w.freeSpot(e.map[i]!, e.x[guard]! + w.rng.range(-2.5, 2.5), e.y[guard]! + w.rng.range(-2.5, 2.5), 5);
        if (s && this.goTo(i, s.x, s.y, d > 25)) { this.setAct(i, Act.Wander); this.schedule(i, 1); return; }
      }
      if (home && d > 7 && Math.hypot(e.x[i]! - home.x, e.y[i]! - home.y) > KID_RANGE * 0.7) { // she is off working far: back home
        const s = w.freeSpot(e.map[i]!, home.x + w.rng.range(-5, 5), home.y + w.rng.range(-5, 5), 8);
        if (s && this.goTo(i, s.x, s.y)) { this.setAct(i, Act.Wander); this.schedule(i, 1); return; }
      }
    }
    const curve = (v: number, from: number, p: number) => (v <= from ? 0 : Math.pow((v - from) / (100 - from), p));
    const night = this.hour() >= 22 || this.hour() < 6;
    let sDrink = curve(e.thirst[i]!, 25, 1.3) * 1.25 + (e.thirst[i]! > 80 ? 0.6 : 0);
    const sFood = curve(e.hunger[i]!, 30, 1.3) * 1.15 + (e.hunger[i]! > 85 ? 0.5 : 0);
    let sEat = e.carry[i]! > 0 ? sFood * 1.1 : 0;
    let sForage = (e.carry[i]! > 0 ? sFood * 0.4 : sFood) + (e.carry[i]! < 2 && !night ? 0.14 : 0);
    let sSleep = curve(e.tired[i]!, 35, 1.2) * 1.1 + (night && e.tired[i]! > 30 ? 0.35 : 0);
    const emp = w.profileOf(i)?.traits.empathy ?? 0.5;
    const sTalk = night ? 0 : curve(e.lonely[i]!, 20, 1.1) * (0.8 + emp * 0.5);
    const sWander = night ? 0.05 : 0.18;
    // Evenings by the fire (flag aware): after the day's work people sit together until bedtime, talk, tell what they saw.
    const sRest = this.evening(i) && guard < 0 && e.tired[i]! < 92 ? 0.75 : 0.1;
    let sTravel = w.travelOpen && !night && guard < 0 ? 0.08 : 0;
    // The woods are deadly (imad 2026-11-26): no child ever goes; a child found there goes home; adults go by day only and leave before dark.
    if (w.travelOpen && w.wild(e.map[i]!)) {
      const h = this.hour();
      if (e.flags[i]! & EFlag.Child) sTravel = 1.2;
      else if (h >= 16 || h < 6) sTravel = 0.75 + (h >= 18 || h < 6 ? 0.3 : 0);
    } else if (sTravel > 0 && !this.mayGoWild(i)) sTravel = this.safeGate(i) >= 0 ? sTravel : 0;
    if (w.ai.instinct) { // foresight: drink and eat before the night; out in the dark when zombies walk = home to sleep
      const h = this.hour(), dusk = h >= 19 && h < 23;
      if (dusk && e.thirst[i]! > 30) sDrink += 0.22;
      if (dusk && e.hunger[i]! > 35) { sEat += e.carry[i]! > 0 ? 0.2 : 0; sForage += e.carry[i]! > 0 ? 0 : 0.12; }
      if (night && e.tired[i]! > 15 && (w.zombies.perNight > 0 || w.zombies.count(e.map[i]!) > 0)) sSleep += 0.3;
    }
    { // a hut far away: set off for it before the night, sleeping out is risky
      const h = w.survival.homes.homeOf(e.id(i)), hr = this.hour();
      if (h && h.m === e.map[i] && (hr >= 20 || hr < 5) && e.tired[i]! > 25 && guard < 0) {
        const c = w.survival.homes.middle(h);
        if (Math.hypot(c.x - e.x[i]!, c.y - e.y[i]!) > 40) sSleep += 0.25;
      }
    }
    const scores = [sDrink, sEat, guard >= 0 && e.hunger[i]! < 80 ? 0 : sForage, sSleep, guard >= 0 ? sTalk * 0.3 : sTalk, sWander, sRest, sTravel];
    const acts = [Act.Drink, Act.Eat, Act.Forage, Act.Sleep, Act.Talk, Act.Wander, Act.Rest, Act.Travel];
    // A new mother's week at home (sim/family.ts): no talks, walks or travel; rest at home, the fridge for food and water.
    const stay = this.stayHome(i);
    if (stay) { scores[4] = -1; scores[5] = -1; scores[7] = -1; scores[6] = Math.max(scores[6]!, 0.3); }
    const wish = this.wishOf(i);
    let best = -1, bs = -1;
    for (let k = 0; k < scores.length; k++) {
      if (scores[k]! < 0) continue;
      if (acts[k] !== Act.Rest && acts[k] !== Act.Talk && w.rules.forbidden(i, ACT_RULE[acts[k]!]!)) { scores[k] = -1; continue; } // the owner's rule
      if (acts[k] === wish && !(wish === Act.Travel && !w.travelOpen) && !(wish === Act.Eat && e.carry[i]! <= 0)) scores[k]! += 0.32;
      const s = scores[k]! + (acts[k] === e.act[i] ? 0.08 : 0) + jitter * 0.04 * ((k * 7 + 3) % 5) / 5;
      if (s > bs) { bs = s; best = k; }
    }
    if (!this.start(i, acts[best]!)) { if (!this.start(i, stay ? Act.Rest : Act.Wander)) { this.setAct(i, Act.Rest, 10); this.schedule(i, 2, this.ticksLeft(i)); } }
  }

  /**
   * May person i go into a wild map now (imad 2026-11-26: "very dangerous, kids are not allowed, only adults, they die a lot there")?
   * Never a child (under 16) or a little one; adults only by day with time to come back (06:00-15:00), not badly hurt, not when
   * zombies are out by day. Players decide for themselves.
   */
  mayGoWild(i: number): boolean {
    const w = this.w, e = w.e;
    if (e.kind[i] === Kind.Player) return true;
    if (e.flags[i]! & (EFlag.Child | EFlag.Small)) return false;
    const h = this.hour();
    if (!(h >= 6 && h < 15 && e.hp[i]! >= 60)) return false;
    // A wild map the people learned to dread (many died there): only the well armed go, and none when the dread is at its worst.
    let worst = 0; for (const p of w.portals) if (p.from === e.map[i] && w.wild(p.dest)) worst = Math.max(worst, w.lore.mapFear(i, p.dest));
    return worst < 5 || (worst < 9 && w.survival.weapon(i)[1] >= 20);
  }
  /** A gate from person i's map to a map that is not wild (-1 none). */
  private safeGate(i: number): number {
    const w = this.w, m = w.e.map[i]!;
    for (let pi = 0; pi < w.portals.length; pi++) if (w.portals[pi]!.from === m && !w.wild(w.portals[pi]!.dest)) return pi;
    return -1;
  }

  // ------------------------------------------------------------------ the day's rhythm (flag aware)
  /** Person i's own hours (an early bird or a night owl, by id): bed at 21:30-22:30, up at 5:30-6:30. */
  bedtime(i: number): number { return 21.5 + ((this.w.e.id(i) * 37) % 13) / 12; }
  wakeAt(i: number): number { return 5.5 + ((this.w.e.id(i) * 53) % 13) / 12; }
  /**
   * Asleep at night: stay asleep until morning even when rested (imad 2026-11-27: people woke at 2-3 am fully rested and
   * stood in the dark until dawn, a third of all their waking time). Needs, danger and the cold still wake them (above).
   */
  sleepIn(i: number): boolean {
    if (this.w.ai.aware === false || this.w.e.kind[i] !== Kind.Agent) return false;
    const h = this.hour();
    if (!(h >= this.bedtime(i) - 1 || h < this.wakeAt(i))) return false;
    // A hungry or thirsty child of theirs close by wakes them (a crying child is urgent, imad 2026-11-27).
    const e = this.w.e;
    for (const k of this.w.family.childrenOf(e.id(i))) {
      const j = e.slot(k);
      if (j >= 0 && e.map[j] === e.map[i] && this.w.family.ageOf(j) < 14 && (e.hunger[j]! > 70 || e.thirst[j]! > 75) && Math.abs(e.x[j]! - e.x[i]!) < 15 && Math.abs(e.y[j]! - e.y[i]!) < 15) return false;
    }
    return true;
  }
  /** The evening (19:00 to bedtime): time with the others by the camp's fire, or at home. */
  evening(i: number): boolean {
    if (this.w.ai.aware === false) return false;
    const h = this.hour();
    return h >= 19 && h < this.bedtime(i);
  }

  /** A mother in her week at home with a newborn, on her home's map, with nothing urgent: she keeps indoors (sim/family.ts). */
  stayHome(i: number): boolean { return !!this.w.family.lyingInHome(i) && !this.w.family.urgentOut(i); }

  /** Begin an action: pick its target and the path there. False when it can't be done now. */
  private start(i: number, a: number): boolean {
    const w = this.w, e = w.e, rng = w.rng, m = e.map[i]!;
    e.target[i] = -1; e.goal[i] = -1;
    const stay = this.stayHome(i);
    if (stay && (a === Act.Talk || a === Act.Wander || a === Act.Travel)) return false;
    if (stay && (a === Act.Drink || a === Act.Forage)) { // only what the home's fridge holds (the father keeps it filled)
      if (a === Act.Drink && w.survival.drinkBottle(i)) { w.family.drank(i); this.stop(i); this.setAct(i, Act.Drink, 6); this.schedule(i, 2, this.ticksLeft(i)); return true; }
      const f = w.survival.myBox(i, 'fridge', 140, a === Act.Drink ? 'water' : 'food'), sp = f >= 0 ? w.survival.besideStore(m, f) : null;
      if (!sp || !this.goTo(i, sp.x, sp.y)) return false;
      this.setAct(i, a, a === Act.Drink ? 15 : 0); e.target[i] = a === Act.Drink ? f : -1; e.goal[i] = a === Act.Drink ? -4 : -3; this.schedule(i, 1); return true;
    }
    switch (a) {
      case Act.Drink: {
        const t = this.nearestSpot(this.drinkSpots[m]!, w.maps[m]!.tiles.w, e.x[i]!, e.y[i]!);
        const W = w.maps[m]!.tiles.w, dw = t < 0 ? Infinity : Math.hypot((t % W) + 0.5 - e.x[i]!, ((t / W) | 0) + 0.5 - e.y[i]!);
        // Water kept for later (imad 2026-11-26): a bottle from the bag when the water is far, else the home's fridge when it is nearer.
        if (dw > 15 && w.survival.drinkBottle(i)) { this.stop(i); this.setAct(i, Act.Drink, 6); this.schedule(i, 2, this.ticksLeft(i)); return true; }
        const f = w.survival.myBox(i, 'fridge', Math.min(dw, 140), 'water');
        if (f >= 0) {
          const sp = w.survival.besideStore(m, f);
          if (sp && this.goTo(i, sp.x, sp.y, e.thirst[i]! > 85)) { this.setAct(i, Act.Drink, 15); e.target[i] = f; e.goal[i] = -4; this.schedule(i, 1); return true; }
        }
        if (t < 0) return false;
        if (!this.goTo(i, (t % W) + 0.5, ((t / W) | 0) + 0.5, e.thirst[i]! > 85)) return false;
        this.setAct(i, Act.Drink, 15); e.target[i] = t;
        this.schedule(i, 1); return true;
      }
      case Act.Eat:
        if (e.carry[i]! <= 0) return false;
        this.stop(i); this.setAct(i, Act.Eat, 12); this.schedule(i, 2, this.ticksLeft(i)); return true;
      case Act.Forage: {
        // Food in the camp's store is the first place to look when it is near (people stock it for this).
        const st = e.carry[i]! <= 0 && (e.hunger[i]! > 40 || w.family.wantsFood(i)) ? w.survival.stashFood(i, 150) : -1;
        if (st >= 0) {
          const sp = w.survival.besideStore(m, st);
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
        const W = w.maps[m]!.tiles.w, camp = w.survival.campOf(m), homes = w.survival.homes;
        const mine = (k: number) => homes.mayEnter(i, m, k); // never in someone else's home (its door is shut to me)
        let t = -1;
        // My own home (or my family's) first: people know where they live (imad 2026-11-25).
        const h = homes.homeOf(e.id(i));
        if (h && h.m === m && !this.mayStayOut(i, Math.hypot(homes.middle(h).x - e.x[i]!, homes.middle(h).y - e.y[i]!))) t = this.homeSpot(i); // anywhere on the map: outside is risky (only worn out or badly hurt and far)
        if (t < 0 && camp && Math.hypot(camp.x - e.x[i]!, camp.y - e.y[i]!) < 120) {
          t = this.nearestSpot(this.shelterSpots[m]!, W, camp.x, camp.y, 14, rng.next() * 3, mine);
          if (t < 0) { const s = w.freeSpot(m, camp.x + rng.range(-2.5, 2.5), camp.y + rng.range(-2.5, 2.5), 8); if (s) t = Math.floor(s.y) * W + Math.floor(s.x); }
        }
        if (t < 0) t = this.nearestSpot(this.shelterSpots[m]!, W, e.x[i]!, e.y[i]!, 30, rng.next() * 6, mine);
        // A cold night (sim/weather.ts): where the cold would still bite at the place picked (no hut, a ruin's floor, or a hut without a bed and no
        // warm clothes), by a burning fire instead. Judged at the place they would sleep, not where they stand (standing by the fire, a ruin's open
        // floor 6 m away looked fine and they froze there, 2026-11-27).
        if (w.weather.coldSoon(m, 8)) {
          const here = t >= 0 ? w.weather.warmthAt(i, m, (t % W) + 0.5, ((t / W) | 0) + 0.5) : w.weather.warmthAt(i, m, e.x[i]!, e.y[i]!);
          const worst = { ...here, drain: (COLD_BELOW - Math.min(COLD_BELOW, w.weather.lowSoon(m, 8))) * 2 * here.exposure }; // the night's real low (the season's mean - 6 missed a snow spell)
          if (worst.drain > 3) { const f = this.fireSpot(i, 260); if (f >= 0) t = f; }
        }
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
      case Act.Rest: {
        if (this.evening(i) && !stay && this.guardian(i) < 0) { // the evening: by the camp's fire with the others (else at home, below)
          const f = this.fireSpot(i, 150), W = w.maps[m]!.tiles.w;
          if (f >= 0 && this.goTo(i, (f % W) + 0.5, ((f / W) | 0) + 0.5)) { this.setAct(i, Act.Rest, 0); e.goal[i] = -6; this.why(i, Why.Evening); this.schedule(i, 1); return true; }
        }
        // Rest at home when it is near (imad 2026-11-25: "keep resting in their home except if some urgency").
        const h0 = w.survival.homes.homeOf(e.id(i)), noHome = !stay && !!h0 && w.rules.forbidden(i, 'home');
        if (noHome) { // a rule: not at home ("never stay at home"): rest by the fire, else out in the open
          const f = this.fireSpot(i, 150), W = w.maps[m]!.tiles.w;
          if (f >= 0 && this.goTo(i, (f % W) + 0.5, ((f / W) | 0) + 0.5)) { this.setAct(i, Act.Rest, 0); e.goal[i] = -5; this.why(i, Why.Rule); this.schedule(i, 1); return true; }
          if (w.survival.homes.inside(i, h0!) && this.wanderGo(i, 15)) { this.setAct(i, Act.Wander); this.why(i, Why.Rule); this.schedule(i, 1); return true; }
        }
        const h = noHome ? undefined : h0;
        if (h && h.m === m && !w.survival.homes.inside(i, h)) {
          const c = w.survival.homes.middle(h), d = Math.hypot(c.x - e.x[i]!, c.y - e.y[i]!), t = this.homeSpot(i), W = w.maps[m]!.tiles.w;
          const night = this.hour() >= 20 || this.hour() < 6;
          if ((d < 90 || night || stay) && t >= 0 && this.goTo(i, (t % W) + 0.5, ((t / W) | 0) + 0.5)) { this.setAct(i, Act.Rest, 0); e.goal[i] = -5; this.schedule(i, 1); return true; }
        }
        this.stop(i); this.setAct(i, Act.Rest, h && w.survival.homes.inside(i, h) ? 30 + rng.next() * 60 : 10 + rng.next() * 30); this.schedule(i, 2, this.ticksLeft(i)); return true;
      }
      case Act.Travel: {
        if (!w.travelOpen) return false;
        let best = -1, bd = Infinity;
        const inWild = w.wild(m), mayWild = this.mayGoWild(i);
        for (let pi = 0; pi < w.portals.length; pi++) {
          const p = w.portals[pi]!;
          if (p.from !== m) continue;
          if (w.wild(p.dest) && !mayWild) continue; // children never, adults not late in the day or hurt
          const d = Math.hypot(p.x - e.x[i]!, p.y - e.y[i]!) + rng.next() * 40 + (inWild && w.wild(p.dest) ? 500 : 0); // out of the woods: the way to safety first
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
        if (e.goal[i] === -4) { // at the home's fridge: a bottle out of it
          e.goal[i] = -1; e.target[i] = -1;
          const f = w.survival.boxNear(i, 'fridge', 2.4, 'water');
          if (f < 0 || w.survival.boxTake(i, f, 'water', 1) !== 1) return false;
          w.survival.drinkBottle(i);
          w.family.drank(i); // the little ones with them drink too
          return false;
        }
        e.thirst[i] = 0; e.target[i] = -1; w.emit('drink', { id: e.id(i) });
        w.family.drank(i); // the little ones with them drink too
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
          if (e.carry[i]! <= 0 && w.family.wantsFood(i) && w.survival.grabFromStash(i)) return false; // for a hungry little one
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
        if (e.hunger[i]! > 30 && !(e.carry[i]! <= 0 && w.family.wantsFood(i))) { e.hunger[i] = Math.max(0, e.hunger[i]! - (def?.food ?? 30)); this.stop(i); e.actT[i] = 10; this.schedule(i, 2, this.ticksLeft(i)); return true; }
        w.survival.addFood(i, 1); // into the hands, else the bag
        return false;
      }
      case Act.Sleep: {
        if (!(e.flags[i]! & EFlag.Sleeping)) { // the walk ended: at home? (a blocked or cut-short walk is tried again, twice)
          const homes = w.survival.homes, h = homes.homeOf(e.id(i));
          if (h && h.m === e.map[i] && !homes.inside(i, h) && !(w.weather.coldSoon(e.map[i]!, 8) && w.survival.warm(e.map[i]!, e.x[i]!, e.y[i]!)) && this.guardian(i) < 0 && (this.homeTries[i] ?? 0) < 4 && !this.mayStayOut(i, Math.hypot(homes.middle(h).x - e.x[i]!, homes.middle(h).y - e.y[i]!)) && e.tired[i]! > 3) {
            this.homeTries[i] = (this.homeTries[i] ?? 0) + 1;
            const t = this.homeSpot(i), W = w.maps[e.map[i]!]!.tiles.w;
            if (t >= 0 && this.goTo(i, (t % W) + 0.5, ((t / W) | 0) + 0.5)) { this.schedule(i, 1); return true; }
          }
          this.homeTries[i] = 0;
          this.stop(i); this.setAct(i, Act.Sleep); w.emit('sleep', { id: e.id(i) }); // arrived at the bed
          if (!this.sleepSafe(i)) { this.outside[i] = h && h.m === e.map[i] ? 1 : 0; // uneasy sleep (slower rest, up and home soon) for those who have a hut here
            w.memory.add(e.id(i), 'sleepOut', 3, h ? 'I had to sleep outside, far from my hut: it felt unsafe' : 'I slept in the open with no hut of my own: it felt unsafe'); }
          else this.outside[i] = 0;
        }
        const night = this.hour() >= 22 || this.hour() < 6;
        const sleepIn = e.tired[i]! <= 3 && !(night && e.tired[i]! > 0) && this.sleepIn(i);
        if (sleepIn && this.whyCode[i] !== Why.SleepIn) this.why(i, Why.SleepIn);
        if (e.tired[i]! > 3 || (night && e.tired[i]! > 0) || sleepIn) {
          const g = this.guardian(i);
          if (g >= 0 && e.act[g] !== Act.Sleep && Math.hypot(e.x[g]! - e.x[i]!, e.y[g]! - e.y[i]!) > 10 && e.tired[i]! < 70) { // mum left: up and after her
            this.setAct(i, Act.Idle); w.emit('wake', { id: e.id(i) }); this.choose(i, 0); return true;
          }
          if (this.chilled[i]! > 3 && e.hp[i]! < w.sc.agents.hp * 0.7 && this.guardian(i) < 0 && !w.family.dependent(i)) { // freezing in their sleep: up and to a fire (or home)
            const W = w.maps[e.map[i]!]!.tiles.w, f = this.fireSpot(i, 260), t = f >= 0 ? f : this.homeSpot(i);
            if (t >= 0 && Math.hypot((t % W) + 0.5 - e.x[i]!, ((t / W) | 0) + 0.5 - e.y[i]!) > 3) {
              this.setAct(i, Act.Sleep); e.flags[i] = e.flags[i]! & ~EFlag.Sleeping; w.emit('wake', { id: e.id(i), why: 'cold' });
              if (this.goTo(i, (t % W) + 0.5, ((t / W) | 0) + 0.5)) { this.schedule(i, 1); return true; }
            }
          }
          if (w.ai.aware !== false && this.chilled[i]! > 2 && e.hp[i]! < w.sc.agents.hp * 0.5 && !w.family.dependent(i)) { // critical: freezing where they lie, even by the fire: up and keep moving
            this.setAct(i, Act.Idle); w.emit('wake', { id: e.id(i), why: 'cold' });
            if (!this.wanderGo(i, 4)) this.choose(i, 0); return true;
          }
          if (this.outside[i] && e.tired[i]! < 55 && this.guardian(i) < 0) { // rested a little in the open: up and home to sleep safe
            const h = w.survival.homes.homeOf(e.id(i));
            if (h && h.m === e.map[i]) { this.outside[i] = 0; this.setAct(i, Act.Idle); w.emit('wake', { id: e.id(i) }); if (!this.start(i, Act.Sleep)) this.choose(i, 0); return true; }
          }
          if (e.thirst[i]! > 90 || e.hunger[i]! > 92) { // woken by need: go and fix it
            this.setAct(i, Act.Idle);
            if (!this.start(i, e.thirst[i]! > 90 ? Act.Drink : e.carry[i]! > 0 ? Act.Eat : Act.Forage)) this.choose(i, 0);
            return true;
          }
          this.schedule(i, 3); return true;
        }
        this.outside[i] = 0;
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
        if (e.goal[i] === -6) { // by the fire in the evening: sit, keep company, now and then talk with someone sitting there too
          if (this.walking(i)) { this.schedule(i, 1); return true; }
          if (!this.evening(i)) { w.survival.logOn(i, 10); e.goal[i] = -1; return false; } // bedtime: a log on for the night if it burns low
          if (e.actT[i]! <= 0) {
            w.survival.logOn(i, 4);
            const j = this.nearestAgent(i, 6, 'talk');
            if (j >= 0 && e.kind[j] === Kind.Agent && e.goal[j] !== -2 && w.rng.chance(0.45)) {
              e.goal[i] = -1; this.setAct(i, Act.Talk); e.target[i] = e.id(j); this.why(i, Why.Talk, e.id(j)); this.schedule(i, 0); return true;
            }
            this.stop(i); this.setAct(i, Act.Rest, 40 + w.rng.next() * 60); e.goal[i] = -6;
          }
          if (this.company(i, 5) > 0) e.lonely[i] = Math.max(0, e.lonely[i]! - 2);
          this.schedule(i, 2, this.ticksLeft(i)); return true;
        }
        if (e.goal[i] === -5) { // on the way home to rest
          if (this.walking(i)) { this.schedule(i, 1); return true; }
          e.goal[i] = -1; this.stop(i); this.setAct(i, Act.Rest, 30 + this.w.rng.next() * 60); this.schedule(i, 2, this.ticksLeft(i)); return true;
        }
        if (e.actT[i]! > 0) { this.schedule(i, 2, this.ticksLeft(i)); return true; }
        return false;
      case Act.Travel:
        return e.goal[i]! >= 0 && this.walking(i);
    }
    return false;
  }

  // ------------------------------------------------------------------ little ones and their carers (sim/family.ts)
  /**
   * A baby or toddler (under 3) thinks: no water, food or trips of its own. In arms: sleeps or looks around. On the ground:
   * sleeps where it is when tired (or when the carer sleeps), else toddles after the carer. Cries now and then when in need.
   */
  private little(i: number): void {
    const w = this.w, e = w.e, fam = w.family, c = fam.carer[i]!, held = fam.carried[i]! >= 0, age = fam.ageOf(i);
    const night = this.hour() >= 21 || this.hour() < 7;
    const asleep = e.act[i] === Act.Sleep;
    const sleepy = e.tired[i]! > 50 || (night && e.tired[i]! > 15) || (c >= 0 && e.act[c] === Act.Sleep) || (asleep && e.tired[i]! > 2);
    const need = Math.max(e.hunger[i]!, e.thirst[i]!);
    if (need > 60 && w.rng.chance(asleep ? 0.3 : 0.12)) { // a hungry or thirsty baby wakes and cries
      if (asleep) { this.setAct(i, Act.Idle); w.emit('wake', { id: e.id(i), why: 'need' }); }
      w.speak(i, kidTalk(age, '', { hunger: e.hunger[i]!, thirst: e.thirst[i]!, tired: e.tired[i]! }, (n) => w.rng.int(n), c >= 0 ? (w.profileOf(c)?.sex ?? '') : ''));
    } else if (sleepy && !(need > 80)) {
      if (!asleep) { this.stop(i); this.setAct(i, Act.Sleep); w.emit('sleep', { id: e.id(i) }); }
      this.schedule(i, 2); return;
    } else if (asleep) { this.setAct(i, Act.Idle); w.emit('wake', { id: e.id(i) }); }
    if (held) { this.stop(i); this.setAct(i, Act.Idle); this.schedule(i, 2); return; }
    if (c >= 0 && age >= BABY) {
      const d = Math.hypot(e.x[c]! - e.x[i]!, e.y[c]! - e.y[i]!);
      if (d > 2.2) {
        const s = w.freeSpot(e.map[i]!, e.x[c]! + w.rng.range(-1, 1), e.y[c]! + w.rng.range(-1, 1), 4);
        if (s && this.goTo(i, s.x, s.y)) { e.speed[i] = 0.55; this.setAct(i, Act.Wander); this.schedule(i, 1); return; }
      } else if (!this.walking(i) && w.rng.chance(0.25)) { // little steps around their carer
        const s = w.freeSpot(e.map[i]!, e.x[c]! + w.rng.range(-1.6, 1.6), e.y[c]! + w.rng.range(-1.6, 1.6), 3);
        if (s && this.goTo(i, s.x, s.y)) { e.speed[i] = 0.4; this.setAct(i, Act.Wander); this.schedule(i, 1); return; }
      }
    }
    if (!this.walking(i)) { this.stop(i); this.setAct(i, Act.Idle); }
    this.schedule(i, this.walking(i) ? 1 : 2);
  }

  /** A carer sees to their little ones first: fetch them, feed them, take them to water. True = busy with that. */
  private tendKids(i: number): boolean {
    const w = this.w, e = w.e, fam = w.family;
    if (e.thirst[i]! > 92 || e.hunger[i]! > 95) return false; // about to die themselves
    const d = fam.duty(i);
    if (!d.what) return false;
    const k = d.kid;
    if (d.what === 'bring' && this.stayHome(i)) return false; // home with the newborn: the others bring it
    if (d.what === 'bring') { // food for an older child of mine (or of the clan): walk over and hand it
      if (fam.bring(i, k)) { this.stop(i); this.schedule(i, 2); return true; }
      if (this.walking(i) && e.act[i] === Act.Go && e.target[i] === e.id(k) && Math.hypot(this.gx[i]! - e.x[k]!, this.gy[i]! - e.y[k]!) < 2.5) { this.schedule(i, 1); return true; }
      const s = w.freeSpot(e.map[i]!, e.x[k]!, e.y[k]!, 4);
      if (!s || !this.goTo(i, s.x, s.y)) return false;
      this.setAct(i, Act.Go); e.target[i] = e.id(k); this.schedule(i, 1); return true;
    }
    if (d.what === 'fetch') {
      if (this.walking(i) && e.act[i] === Act.Go && e.target[i] === e.id(k) && Math.hypot(this.gx[i]! - e.x[k]!, this.gy[i]! - e.y[k]!) < 2) { this.schedule(i, 1); return true; }
      const s = w.freeSpot(e.map[i]!, e.x[k]! + w.rng.range(-0.6, 0.6), e.y[k]! + w.rng.range(-0.6, 0.6), 6);
      if (!s || !this.goTo(i, s.x, s.y, Math.hypot(e.x[k]! - e.x[i]!, e.y[k]! - e.y[i]!) > 15)) return false;
      if (e.flags[i]! & EFlag.Sleeping) this.setAct(i, Act.Idle);
      this.setAct(i, Act.Go); e.target[i] = e.id(k); this.schedule(i, 1); return true;
    }
    if (d.what === 'food') {
      if (fam.feed(i)) { this.stop(i); this.setAct(i, Act.Rest, 6); this.schedule(i, 2, this.ticksLeft(i)); return true; }
      if (e.act[i] === Act.Forage) return false; // already looking for some
      return this.start(i, Act.Forage);
    }
    if (e.act[i] === Act.Drink) return false; // on the way to water
    return this.start(i, Act.Drink);
  }

  // ------------------------------------------------------------------ helpers
  /** Children 3-13 see to their own needs, but near home (imad 2026-11-26): their home, a parent's home, else the camp. */
  kidHome(i: number): { x: number; y: number } | null {
    const w = this.w, e = w.e, p = w.profileOf(i), m = e.map[i]!;
    if (!p || p.player || !(e.flags[i]! & EFlag.Child) || ageOf(p, w.gameSec, w.life.yearSec) >= INDEPENDENT || w.family.dependent(i)) return null;
    const homes = w.survival.homes, W = w.maps[m]!.tiles.w;
    for (const id of [e.id(i), ...p.parents]) { const h = homes.homeOf(id); if (h && h.m === m) return { x: (h.out % W) + 0.5, y: Math.floor(h.out / W) + 0.5 }; }
    return w.survival.campOf(m);
  }
  /** Would walking to (x, y) take child i more than KID_RANGE from home with no parent at their side? (Pressing thirst / hunger may.) */
  leashed(i: number, x: number, y: number): boolean {
    const e = this.w.e;
    if (!(e.flags[i]! & EFlag.Child) || e.kind[i] !== Kind.Agent) return false;
    const h = this.kidHome(i);
    if (!h || Math.hypot(x - h.x, y - h.y) <= KID_RANGE || Math.hypot(x - h.x, y - h.y) <= Math.hypot(e.x[i]! - h.x, e.y[i]! - h.y)) return false;
    if (e.thirst[i]! > 75 || e.hunger[i]! > 85) return false;
    const p = this.w.profileOf(i)!;
    return !p.parents.some((pid) => { const j = e.slot(pid); return j >= 0 && e.map[j] === e.map[i] && Math.hypot(e.x[j]! - e.x[i]!, e.y[j]! - e.y[i]!) < 8 && Math.hypot(e.x[j]! - x, e.y[j]! - y) < 12; });
  }
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
      if (s && k < 3 && w.ai.instinct && (w.memory.feared(e.id(i), m, s.x, s.y) || w.lore.feared(i, m, s.x, s.y))) continue; // not where something bit them lately, nor where the people lost someone
      if (s && k < 3 && w.aware.risky(i, m, s.x, s.y)) { this.why(i, Why.Avoid); continue; } // not towards a danger they saw or were told of
      if (s && this.goTo(i, s.x, s.y)) return true;
    }
    return false;
  }

  /** Nearest tile of a list (within maxD), with an optional random extra distance to spread people out. */
  private nearestSpot(list: Int32Array, mw: number, x: number, y: number, maxD = Infinity, spread = 0, ok?: (t: number) => boolean): number {
    let best = -1, bd = maxD * maxD;
    for (let k = 0; k < list.length; k++) {
      const t = list[k]!;
      if (ok && !ok(t)) continue;
      const dx = (t % mw) + 0.5 - x, dy = ((t / mw) | 0) + 0.5 - y;
      const d = dx * dx + dy * dy + (spread ? ((t * 2654435761) >>> 24) / 255 * spread * spread : 0);
      if (d < bd) { bd = d; best = t; }
    }
    return best;
  }

  /** Nearest item within r m; `piles` = also piles a player's work dropped (AI people forage food only). */
  nearestItem(i: number, r: number, piles = false): number {
    const e = this.w.e, m = e.map[i]!;
    let best = -1, bd = r * r;
    for (let j = 0; j < e.hi; j++) {
      if (e.kind[j] !== Kind.Item || e.map[j] !== m || (!piles && e.sub[j]! >= DROP_BASE)) continue;
      const dx = e.x[j]! - e.x[i]!, dy = e.y[j]! - e.y[i]!;
      let d = dx * dx + dy * dy;
      if (d < bd && this.w.ai.instinct && this.w.lore.feared(i, m, e.x[j]!, e.y[j]!)) d *= 9; // food in a feared place: only when nothing else is near
      if (d < bd && this.w.aware.risky(i, m, e.x[j]!, e.y[j]!, 15)) d *= 9; // where zombies / beasts were seen lately
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
      if (rule === 'talk' && this.w.ai.instinct && this.w.lore.distrusts(i, e.id(j))) continue; // someone the people fear
      const dx = e.x[j]! - e.x[i]!, dy = e.y[j]! - e.y[i]!, d = dx * dx + dy * dy;
      if (d < bd) { bd = d; best = j; }
    }
    return best;
  }

  /** Food appears over time where the scenario says (fill = a new world starts half stocked). */
  spawnItems(fill: boolean): void {
    const w = this.w, e = w.e, rng = w.rng;
    // Never more than twice the scenario's max of one food on the ground of a map (farms dropped berries forever, also on maps
    // where berries do not grow wild, and filled the entity pool: imad 2026-11-25, nothing could be added any more).
    if (!fill) for (const it of this.life.items) for (let m = 0; m < w.maps.length; m++) { const over = -this.itemRoom(m, it.id); if (over > 0) this.trimItems(m, it.id, over); }
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

  /** Remove n pieces of item type `sub` on map m, those farthest from anyone first. Returns how many went. */
  trimItems(m: number, sub: number, n: number): number {
    const w = this.w, e = w.e, far: [number, number][] = [];
    for (let i = 0; i < e.hi; i++) {
      if (e.kind[i] !== Kind.Item || e.map[i] !== m || e.sub[i] !== sub) continue;
      let near = Infinity;
      for (let j = 0; j < e.hi; j++) if ((e.kind[j] === Kind.Agent || e.kind[j] === Kind.Player) && e.map[j] === m) near = Math.min(near, Math.hypot(e.x[j]! - e.x[i]!, e.y[j]! - e.y[i]!));
      far.push([near, i]);
    }
    far.sort((a, b) => b[0] - a[0]);
    let k = 0;
    for (const [, i] of far) { if (k >= n) break; w.remove(i, 'rot'); k++; }
    return k;
  }

  /** How many of item type `sub` may still lie on map m (twice the scenario's max). */
  itemRoom(m: number, sub: number): number {
    const e = this.w.e, it = this.life.items.find((x) => x.id === sub);
    let have = 0;
    for (let j = 0; j < e.hi; j++) if (e.kind[j] === Kind.Item && e.map[j] === m && e.sub[j] === sub) have++;
    return (it ? it.spawn.max * 2 : 60) - have;
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
