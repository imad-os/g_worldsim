import { Act, ANIMAL_NAMES, EFlag, Kind } from '@worldsim/protocol';
import { NO_MAP } from './entities.js';
import type { World } from './world.js';

/**
 * Wild animals (imad 2026-11-20): rabbits, deer, boars, wolves and bears (engine kind Animal, type in `sub`). They
 * appear at random, many in the woods and a few in town, far from people. Rabbits and deer run from anyone who comes
 * near; a boar runs too but turns on whoever hurts it; wolves hunt people at night; a bear attacks whoever comes too
 * close. Killing one gives its meat (food, in the hands), leather and claws to the hunter (crafting, sim/survival.ts).
 * People hunt as a task skill (`hunt`), fight back when attacked; players hit with "use" (or shoot with a bow).
 */
interface Kind5 { hp: number; run: number; walk: number; sight: number; bite: number; r: number; drops: { meat: number; leather: number; claw: number }; woods: number; town: number }
export const ANIMALS: Kind5[] = [
  { hp: 12, run: 3.0, walk: 0.9, sight: 8, bite: 0, r: 0.22, drops: { meat: 1, leather: 1, claw: 0 }, woods: 5, town: 3 },
  { hp: 40, run: 3.2, walk: 1.0, sight: 13, bite: 0, r: 0.35, drops: { meat: 3, leather: 2, claw: 0 }, woods: 4, town: 0.6 },
  { hp: 55, run: 3.2, walk: 0.9, sight: 9, bite: 7, r: 0.35, drops: { meat: 3, leather: 1, claw: 1 }, woods: 3, town: 0.5 },
  { hp: 45, run: 3.6, walk: 1.1, sight: 12, bite: 9, r: 0.3, drops: { meat: 1, leather: 1, claw: 2 }, woods: 2, town: 0.3 },
  { hp: 120, run: 3.3, walk: 0.8, sight: 9, bite: 16, r: 0.5, drops: { meat: 5, leather: 3, claw: 3 }, woods: 0.8, town: 0 },
];
const EVERY = 5, CAP_WOODS = 16, CAP_TOWN = 4, HOUR = 3600;
export type Drops = { meat: number; leather: number; claw: number };

export class Animals {
  /** What an animal of that type leaves (meat, leather, claws), and its name (for planning, sim/colony.ts). */
  dropsOf(type: number): { meat: number; leather: number; claw: number } { return ANIMALS[type]?.drops ?? { meat: 0, leather: 0, claw: 0 }; }
  typeName(type: number): string { return ANIMAL_NAMES[type] ?? ''; }
  private readonly cool = new Map<number, number>();
  private readonly wander = new Map<number, number>();
  /** Who last hurt an animal (its id -> the hunter's entity id): boars and bears go for them. */
  /** Animals that were hurt (or set on someone): entity id -> who they go for. */
  readonly angry = new Map<number, number>();
  /** Kills: hunter id -> [game second, animal type]. */
  readonly kills = new Map<number, [number, number]>();
  private nextHour = 0;
  /** The owner's counts per map (map id -> how many of each of the 5 animals; meta `animal_want`). None = the built-in mix. */
  readonly want = new Map<string, number[]>();
  constructor(private w: World) {}

  /** The built-in cap of a map (woods 16, town 4). */
  capOf(m: number): number { return this.w.maps[m]!.def.gen.type === 'wilds' ? CAP_WOODS : CAP_TOWN; }

  /** Bring map m to the owner's counts now (spawn the missing far from people, remove the extra). Returns how many changed. */
  fill(m: number): number {
    const want = this.want.get(this.w.maps[m]!.def.id);
    if (!want) return 0;
    let changed = 0;
    for (let t = 0; t < ANIMALS.length; t++) changed += this.toward(m, t, want[t] ?? 0, 99);
    return changed;
  }
  /** Spawn up to `max` of type t (or remove extras) towards `goal` on map m. */
  private toward(m: number, t: number, goal: number, max: number): number {
    const w = this.w, e = w.e, mp = w.maps[m]!;
    let have = this.count(m, t), n = 0;
    while (have > goal && n < max) {
      // The extra ones farthest from any player go first.
      let best = -1, bd = -1;
      for (let i = 0; i < e.hi; i++) {
        if (e.kind[i] !== Kind.Animal || e.map[i] !== m || e.sub[i] !== t) continue;
        let near = Infinity;
        for (let j = 0; j < e.hi; j++) if (e.kind[j] === Kind.Player && e.map[j] === m) near = Math.min(near, Math.hypot(e.x[j]! - e.x[i]!, e.y[j]! - e.y[i]!));
        if (near > bd) { bd = near; best = i; }
      }
      if (best < 0) break;
      w.remove(best, 'owner'); have--; n++;
    }
    for (let tries = 0; have < goal && n < max && tries < (goal - have) * 40 + 40; tries++) {
      const x = w.rng.range(10, mp.def.w - 10), y = w.rng.range(10, mp.def.h - 10);
      if (mp.tiles.isSolidAt(x, y)) continue;
      const tt = mp.tiles.get(Math.floor(x), Math.floor(y));
      if (tt === w.survival.T.floor || tt === w.survival.T.water) continue;
      let near = false;
      for (let j = 0; j < e.hi && !near; j++) if ((e.kind[j] === Kind.Agent || e.kind[j] === Kind.Player) && e.map[j] === m && Math.hypot(e.x[j]! - x, e.y[j]! - y) < 25) near = true;
      if (near) continue;
      if (this.spawn(m, x, y, t) >= 0) { have++; n++; }
    }
    return n;
  }

  count(m = -1, type = -1): number {
    const e = this.w.e;
    let n = 0;
    for (let i = 0; i < e.hi; i++) if (e.kind[i] === Kind.Animal && (m < 0 || e.map[i] === m) && (type < 0 || e.sub[i] === type)) n++;
    return n;
  }

  spawn(m: number, x: number, y: number, type: number): number {
    const w = this.w, e = w.e, a = ANIMALS[type]!;
    const s = w.freeSpot(m, x, y, 30);
    if (!s) return -1;
    const i = e.create(Kind.Animal, m, s.x, s.y, a.r);
    if (i < 0) return -1;
    e.sub[i] = type; e.hp[i] = a.hp; e.speed[i] = a.walk; e.tx[i] = s.x; e.ty[i] = s.y; e.act[i] = Act.Wander; e.target[i] = -1;
    w.bodies[i] = w.maps[m]!.phys.createAgentBody(i, s.x, s.y, a.r);
    return i;
  }

  /** Once a game hour: a few new ones where there are fewer than the map holds (woods many, town few). */
  private spawnSome(first: boolean): void {
    const w = this.w, e = w.e;
    w.maps.forEach((mp, m) => {
      const wild = mp.def.gen.type === 'wilds', cap = wild ? CAP_WOODS : CAP_TOWN;
      // The owner's counts: a few each hour towards them (all at once on the first hour).
      const want = this.want.get(mp.def.id);
      if (want) { for (let t = 0; t < ANIMALS.length; t++) this.toward(m, t, want[t] ?? 0, first ? 99 : wild ? 2 : 1); return; }
      let have = this.count(m);
      const tries = first ? cap : wild ? 3 : (w.rng.chance(0.4) ? 1 : 0);
      for (let k = 0; k < tries && have < cap; k++) {
        // Which animal: by how common it is on this kind of map.
        const weights = ANIMALS.map((a) => (wild ? a.woods : a.town)), sum = weights.reduce((s, v) => s + v, 0);
        let r = w.rng.next() * sum, type = 0;
        while (type < weights.length - 1 && r >= weights[type]!) { r -= weights[type]!; type++; }
        for (let t = 0; t < 30; t++) {
          const x = w.rng.range(10, mp.def.w - 10), y = w.rng.range(10, mp.def.h - 10);
          if (mp.tiles.isSolidAt(x, y)) continue;
          const tt = mp.tiles.get(Math.floor(x), Math.floor(y));
          if (tt === w.survival.T.floor || tt === w.survival.T.water) continue;
          let near = false;
          for (let j = 0; j < e.hi && !near; j++) if ((e.kind[j] === Kind.Agent || e.kind[j] === Kind.Player) && e.map[j] === m && Math.hypot(e.x[j]! - x, e.y[j]! - y) < 30) near = true;
          if (near) continue;
          if (this.spawn(m, x, y, type) >= 0) { have++; break; }
        }
      }
    });
  }

  /** The nearest animal to (x, y) on map m within r metres (slot, -1). `type` -1 = any. */
  nearest(m: number, x: number, y: number, r: number, type = -1): number {
    const e = this.w.e;
    let best = -1, bd = r;
    for (let i = 0; i < e.hi; i++) {
      if (e.kind[i] !== Kind.Animal || e.map[i] !== m || (type >= 0 && e.sub[i] !== type)) continue;
      const d = Math.hypot(e.x[i]! - x, e.y[i]! - y);
      if (d < bd) { bd = d; best = i; }
    }
    return best;
  }

  /** An animal going for person i (within 10 m), or -1: they defend themselves or run. */
  attacker(i: number): number {
    const e = this.w.e, id = e.id(i);
    for (let a = 0; a < e.hi; a++) {
      if (e.kind[a] !== Kind.Animal || e.map[a] !== e.map[i] || e.act[a] !== Act.Fight || e.target[a] !== id) continue;
      if (Math.hypot(e.x[a]! - e.x[i]!, e.y[a]! - e.y[i]!) < 10) return a;
    }
    return -1;
  }

  /** Hit an animal. Killed: its drops go to `by` (slot, -1 = nobody), returned; else null. */
  hit(a: number, dmg: number, by: number): Drops | null {
    const w = this.w, e = w.e;
    if (e.kind[a] !== Kind.Animal) return null;
    const type = e.sub[a]!, id = e.id(a);
    e.hp[a]! -= dmg;
    if (by >= 0) this.angry.set(id, e.id(by));
    e.nextThink[a] = 0;
    if (e.hp[a]! > 0) return null;
    const d = { ...ANIMALS[type]!.drops };
    if (by >= 0) {
      w.survival.gain(by, d);
      this.kills.set(e.id(by), [w.gameSec, type]);
    }
    w.emit('hunt', { id: by >= 0 ? e.id(by) : -1, animal: ANIMAL_NAMES[type], map: w.maps[e.map[a]!]!.def.id, ...d });
    this.cool.delete(id); this.wander.delete(id); this.angry.delete(id);
    w.remove(a, 'hunted');
    return d;
  }

  update(): void {
    const w = this.w, e = w.e;
    if (w.gameSec >= this.nextHour) {
      const first = this.nextHour === 0;
      this.nextHour = w.gameSec + HOUR;
      this.spawnSome(first && this.count() === 0);
    }
    if (w.tick % EVERY !== 0) return;
    const now = w.gameSec, hour = w.brain.hour(), night = hour >= 20 || hour < 6;
    for (let i = 0; i < e.hi; i++) {
      if (e.kind[i] !== Kind.Animal || e.map[i] === NO_MAP) continue;
      const m = e.map[i]!, id = e.id(i), type = e.sub[i]!, A = ANIMALS[type]!;
      // The nearest person it sees.
      let p = -1, pd = A.sight;
      for (let j = 0; j < e.hi; j++) {
        if ((e.kind[j] !== Kind.Agent && e.kind[j] !== Kind.Player) || e.map[j] !== m) continue;
        if (e.kind[j] === Kind.Player && w.away.has(e.id(j))) continue;
        let d = Math.hypot(e.x[j]! - e.x[i]!, e.y[j]! - e.y[i]!);
        // A hunter stalking this animal (instinct): low and quiet, downwind, seen at half the distance until close.
        if (w.ai.instinct && e.kind[j] === Kind.Agent && w.brain.huntOf(j) === id && d > 3) d *= 2;
        if (d < pd) { pd = d; p = j; }
      }
      const foe = this.angry.has(id) ? e.slot(this.angry.get(id)!) : -1;
      const fire = w.survival.fireNear(m, e.x[i]!, e.y[i]!, 5) >= 0 || w.survival.lampNear(m, e.x[i]!, e.y[i]!, 3.5);
      let attack = -1;
      if (A.bite > 0 && !fire) {
        if (foe >= 0 && e.map[foe] === m && Math.hypot(e.x[foe]! - e.x[i]!, e.y[foe]! - e.y[i]!) < 20 && type !== 3) attack = foe; // boar, bear: whoever hurt it
        else if (p >= 0 && ((type === 3 && (night || foe >= 0)) || (type === 4 && pd < 5))) attack = p;
      }
      if (attack >= 0) {
        const d = Math.hypot(e.x[attack]! - e.x[i]!, e.y[attack]! - e.y[i]!);
        e.act[i] = Act.Fight; e.target[i] = e.id(attack); e.speed[i] = A.run;
        e.tx[i] = e.x[attack]!; e.ty[i] = e.y[attack]!;
        if (d <= A.r + 0.75 && (this.cool.get(id) ?? 0) <= now) {
          this.cool.set(id, now + 1.4 * w.opt.clockScale);
          this.bite(i, attack, A.bite);
        }
        if (e.kind[attack] === Kind.Agent && e.nextThink[attack]! > w.tick + 4) e.nextThink[attack] = w.tick + 1; // they notice
        continue;
      }
      if (p >= 0 && (A.bite === 0 || type === 2 || foe >= 0 || pd < 4)) { // run away
        const dx = e.x[i]! - e.x[p]!, dy = e.y[i]! - e.y[p]!, l = Math.hypot(dx, dy) || 1;
        e.act[i] = Act.Flee; e.target[i] = -1; e.speed[i] = A.run;
        e.tx[i] = e.x[i]! + (dx / l) * 6 + w.rng.range(-1, 1); e.ty[i] = e.y[i]! + (dy / l) * 6 + w.rng.range(-1, 1);
        continue;
      }
      // Wander: graze about.
      if (e.act[i] !== Act.Wander) { e.act[i] = Act.Wander; this.wander.set(id, 0); }
      e.target[i] = -1;
      if ((this.wander.get(id) ?? 0) <= now || Math.hypot(e.tx[i]! - e.x[i]!, e.ty[i]! - e.y[i]!) < 0.3) {
        this.wander.set(id, now + (4 + w.rng.next() * 10) * w.opt.clockScale);
        const still = w.rng.chance(0.35);
        e.tx[i] = still ? e.x[i]! : e.x[i]! + w.rng.range(-7, 7); e.ty[i] = still ? e.y[i]! : e.y[i]! + w.rng.range(-7, 7); e.speed[i] = A.walk;
      }
    }
  }

  private bite(i: number, t: number, dmg: number): void {
    const w = this.w, e = w.e;
    const sleeping = (e.flags[t]! & EFlag.Sleeping) !== 0;
    const hurt = dmg * (sleeping ? 1.5 : 1) * (1 - w.survival.defence(t));
    e.hp[t]! -= hurt;
    w.emit('bitten', { id: e.id(t), by: e.id(i), hp: Math.round(e.hp[t]!), animal: ANIMAL_NAMES[e.sub[i]!] });
    if (w.isChar(t)) { e.hp[t] = Math.max(5, e.hp[t]!); return; }
    e.nextThink[t] = w.tick + 1;
    if (e.hp[t]! <= 0) {
      w.emit('death', { id: e.id(t), cause: ANIMAL_NAMES[e.sub[i]!], map: w.maps[e.map[t]!]!.def.id, x: e.x[t], y: e.y[t] });
      w.remove(t, 'animal');
      this.angry.delete(e.id(i));
    }
  }

  clear(): number {
    const e = this.w.e;
    let n = 0;
    for (let i = 0; i < e.hi; i++) if (e.kind[i] === Kind.Animal) { this.w.remove(i, 'cleared'); n++; }
    return n;
  }
}
