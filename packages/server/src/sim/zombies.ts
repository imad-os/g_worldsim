import { Act, EFlag, Kind } from '@worldsim/protocol';
import { NO_MAP } from './entities.js';
import type { World } from './world.js';

/**
 * Milestone 8, part 3: zombies (engine kind Threat). The owner sets how many are released at random each night
 * (`perNight`, 21:00, far from people and fires) and can spawn one anywhere at any time (those stay until killed;
 * the night ones crumble at dawn). A zombie shambles towards the nearest person it sees (16 m; slower than a walk),
 * never closer than 5 m to a burning fire, claws at walls in its way (huts get holes, people repair them) and hurts
 * whoever it reaches. People who see one (sim/brain.ts `danger`) flee to the fire or fight it (a spear or an axe, a
 * strong and brave person); players hit with their "use" action. Players' characters are hurt but never die.
 */
/** What zombies claw through to get at people. */
const CLAW = new Set(['woodwall', 'wall', 'crate', 'palisade', 'spikes', 'stonewall', 'door', 'window', 'lamp', 'bed']);
export const FIRE_SAFE = 5;
const EVERY = 5;
/** The owner's zombie numbers (panel, meta `zombie_cfg`): health, walking speed (m/s), bite damage, sight (chase) and smell (drift towards people) distance in metres. */
export interface ZombieCfg { hp: number; speed: number; bite: number; sight: number; smell: number }
export const ZOMBIE_DEFAULTS: ZombieCfg = { hp: 120, speed: 1.15, bite: 8, sight: 16, smell: 120 };
export const NIGHT_HOUR = 21, DAWN_HOUR = 6;

/** A zombie attack the owner planned (panel): when, where, how many; `daily` = again every day at that time. */
export interface AttackPlan { id: number; at: number; map: string; n: number; where: 'near' | 'edge' | 'camp' | 'random'; near?: string; daily?: boolean; stays?: boolean }

export class Zombies {
  /** Released at random each night (owner setting, meta `zombies_night`). */
  perNight = 0;
  cfg: ZombieCfg = { ...ZOMBIE_DEFAULTS };
  /** Planned attacks (meta `zombie_plans`), soonest first. */
  plans: AttackPlan[] = [];
  /** A plan ran or changed: the app saves them. */
  onPlans: () => void = () => {};
  private lastNight: number | null = null;
  private readonly cool = new Map<number, number>(); // entity id -> next game second it may bite / hit
  private readonly wander = new Map<number, number>();
  constructor(private w: World) {}

  /** Change the numbers (checked by the caller); `now` also sets every zombie out now to the new health and speed. */
  setCfg(c: Partial<ZombieCfg>, now = false): void {
    const e = this.w.e;
    this.cfg = { ...this.cfg, ...c };
    if (!now) return;
    for (let i = 0; i < e.hi; i++) if (e.kind[i] === Kind.Threat) { e.hp[i] = this.cfg.hp; e.speed[i] = this.cfg.speed; }
  }

  count(m = -1): number {
    const e = this.w.e;
    let n = 0;
    for (let i = 0; i < e.hi; i++) if (e.kind[i] === Kind.Threat && (m < 0 || e.map[i] === m)) n++;
    return n;
  }

  /** A zombie at (x, y). `stays` = does not crumble at dawn (spawned by the owner). Returns the slot or -1. */
  spawn(m: number, x: number, y: number, stays: boolean): number {
    const w = this.w, e = w.e;
    const s = w.freeSpot(m, x, y, 40);
    if (!s) return -1;
    const i = e.create(Kind.Threat, m, s.x, s.y, w.sc.agents.radius);
    if (i < 0) return -1;
    e.hp[i] = this.cfg.hp; e.sub[i] = stays ? 1 : 0; e.speed[i] = this.cfg.speed; e.tx[i] = s.x; e.ty[i] = s.y; e.act[i] = Act.Wander;
    w.bodies[i] = w.maps[m]!.phys.createAgentBody(i, s.x, s.y, w.sc.agents.radius);
    w.emit('zombie', { id: e.id(i), map: w.maps[m]!.def.id, x: Math.round(s.x), y: Math.round(s.y), how: stays ? 'spawned' : 'night' });
    return i;
  }

  /** Night release: n zombies on a map with people, each far (35+ m) from everyone and 15+ m from any fire. */
  release(m: number, n: number): number {
    const w = this.w, e = w.e, def = w.maps[m]!.def;
    let k = 0;
    for (let tries = 0; k < n && tries < n * 60; tries++) {
      const x = w.rng.range(4, def.w - 4), y = w.rng.range(4, def.h - 4);
      if (w.maps[m]!.tiles.isSolidAt(x, y) || w.survival.fireNear(m, x, y, 15) >= 0) continue;
      let ok = true, near = Infinity;
      for (let j = 0; j < e.hi && ok; j++) {
        if ((e.kind[j] !== Kind.Agent && e.kind[j] !== Kind.Player) || e.map[j] !== m) continue;
        const d = Math.hypot(e.x[j]! - x, e.y[j]! - y);
        if (d < 35) ok = false;
        near = Math.min(near, d);
      }
      if (!ok || near > 110) continue; // not on top of anyone, but not lost at the far end of the map either
      if (this.spawn(m, x, y, false) >= 0) k++;
    }
    return k;
  }

  /** Add a planned attack (`at` = game second). */
  plan(p: Omit<AttackPlan, 'id'>): AttackPlan {
    const q: AttackPlan = { ...p, id: Math.max(0, ...this.plans.map((x) => x.id)) + 1 };
    this.plans.push(q); this.plans.sort((a, b) => a.at - b.at); this.onPlans();
    return q;
  }
  unplan(id: number): boolean { const n = this.plans.length; this.plans = this.plans.filter((x) => x.id !== id); if (n !== this.plans.length) this.onPlans(); return n !== this.plans.length; }

  /** An attack now: n zombies near someone (25-35 m), at the edge of the map (on the roads in when there are some), around the camp, or anywhere. */
  attack(p: Pick<AttackPlan, 'map' | 'n' | 'where' | 'near' | 'stays'>): { map: string; n: number; why?: string } {
    const w = this.w, e = w.e;
    let m = w.mapIndex.get(p.map) ?? -1;
    let cx = -1, cy = -1;
    if (p.where === 'near') {
      const name = (p.near ?? '').trim().toLowerCase();
      let j = -1;
      for (const [id, pr] of w.profiles) if (pr.name.toLowerCase() === name) { const s = e.slot(id); if (s >= 0 && e.map[s] !== NO_MAP) { j = s; break; } }
      if (j < 0) return { map: p.map, n: 0, why: `nobody called ${p.near}` };
      m = e.map[j]!; cx = e.x[j]!; cy = e.y[j]!;
    }
    if (m < 0) return { map: p.map, n: 0, why: 'no such map' };
    const def = w.maps[m]!.def, camp = w.survival.camp[m];
    if (p.where === 'camp') { if (!camp) return { map: def.id, n: 0, why: 'this map has no camp yet' }; cx = camp.x; cy = camp.y; }
    const n = Math.max(1, Math.min(40, Math.round(p.n)));
    let k = 0;
    const exits = w.land.exits.filter((x) => x.m === m);
    for (let tries = 0; k < n && tries < n * 40; tries++) {
      let x: number, y: number;
      if (cx >= 0) { const a = w.rng.next() * Math.PI * 2, d = w.rng.range(p.where === 'camp' ? 30 : 25, p.where === 'camp' ? 45 : 35); x = cx + Math.cos(a) * d; y = cy + Math.sin(a) * d; }
      else if (p.where === 'edge') {
        const ex = exits.length ? exits[tries % exits.length]! : null, inset = 12 + w.rng.range(0, 6);
        if (ex) {
          const along = ex.c + w.rng.range(-3, 3);
          x = ex.side === 'east' ? def.w - inset : ex.side === 'west' ? inset : along;
          y = ex.side === 'south' ? def.h - inset : ex.side === 'north' ? inset : along;
        } else { const side = w.rng.int(4); x = side === 0 ? inset : side === 1 ? def.w - inset : w.rng.range(inset, def.w - inset); y = side === 2 ? inset : side === 3 ? def.h - inset : w.rng.range(inset, def.h - inset); }
      } else { x = w.rng.range(6, def.w - 6); y = w.rng.range(6, def.h - 6); }
      if (x < 2 || y < 2 || x > def.w - 2 || y > def.h - 2 || w.maps[m]!.tiles.isSolidAt(x, y)) continue;
      const i = this.spawn(m, x, y, p.stays !== false);
      if (i < 0) continue;
      k++;
      // They come straight in: towards the one named, the camp, or the middle of the map.
      const tx = cx >= 0 ? cx : camp ? camp.x : def.w / 2, ty = cx >= 0 ? cy : camp ? camp.y : def.h / 2;
      e.tx[i] = tx; e.ty[i] = ty; e.speed[i] = this.cfg.speed;
      this.wander.set(e.id(i), w.gameSec + 40 * w.opt.clockScale);
    }
    if (k) w.emit('zombies', { map: def.id, n: k, attack: true, where: p.where, near: p.near ?? '' });
    return { map: def.id, n: k };
  }

  /** Is (x, y) a person zombies may go for? Not near a fire, not an away player. */
  private prey(j: number): boolean {
    const w = this.w, e = w.e;
    if (e.kind[j] === Kind.Player && w.away.has(e.id(j))) return false;
    return w.survival.fireNear(e.map[j]!, e.x[j]!, e.y[j]!, FIRE_SAFE) < 0 && !w.survival.lampNear(e.map[j]!, e.x[j]!, e.y[j]!, 3);
  }

  /** The nearest zombie to (x, y) on map m within r metres (slot, -1 none). */
  nearest(m: number, x: number, y: number, r: number): number {
    const e = this.w.e;
    let best = -1, bd = r;
    for (let i = 0; i < e.hi; i++) {
      if (e.kind[i] !== Kind.Threat || e.map[i] !== m) continue;
      const d = Math.hypot(e.x[i]! - x, e.y[i]! - y);
      if (d < bd) { bd = d; best = i; }
    }
    return best;
  }

  /** Hit a zombie (a person fighting, a player's "use"). True if it died. */
  hit(z: number, dmg: number, by: number): boolean {
    const w = this.w, e = w.e;
    if (e.kind[z] !== Kind.Threat) return false;
    e.hp[z]! -= dmg;
    if (e.hp[z]! > 0) return false;
    w.emit('zombie', { id: e.id(z), map: w.maps[e.map[z]!]!.def.id, how: 'killed', by: by >= 0 ? e.id(by) : -1, prey: e.act[z] === Act.Fight ? e.target[z] : -1, near: e.act[z] === Act.Fight && e.slot(e.target[z]!) >= 0 ? Math.hypot(e.x[e.slot(e.target[z]!)]! - e.x[z]!, e.y[e.slot(e.target[z]!)]! - e.y[z]!) : 99 });
    this.cool.delete(e.id(z)); this.wander.delete(e.id(z));
    w.remove(z, 'killed');
    return true;
  }

  /** Every tick (the work every EVERY ticks). */
  update(): void {
    const w = this.w, e = w.e;
    const hour = w.brain.hour(), night = hour >= NIGHT_HOUR || hour < DAWN_HOUR;
    // The night's release.
    const nightNo = Math.floor((w.gameSec / 3600 + 8 - NIGHT_HOUR) / 24);
    if (this.lastNight === null) this.lastNight = nightNo; // not on the first tick after a start
    else if (nightNo > this.lastNight) {
      this.lastNight = nightNo;
      if (this.perNight > 0) for (let m = 0; m < w.maps.length; m++) {
        let people = 0;
        for (let j = 0; j < e.hi; j++) if (e.kind[j] === Kind.Agent && e.map[j] === m) people++;
        if (people) { const n = this.release(m, this.perNight); if (n) w.emit('zombies', { map: w.maps[m]!.def.id, n }); }
      }
    }
    if (w.tick % EVERY !== 0) return;
    // Planned attacks whose time came.
    if (this.plans.length && this.plans[0]!.at <= w.gameSec) {
      for (const p of this.plans.filter((x) => x.at <= w.gameSec)) {
        this.attack(p);
        if (p.daily) p.at += 86400 * Math.max(1, Math.ceil((w.gameSec - p.at + 1) / 86400)); else this.plans = this.plans.filter((x) => x !== p);
      }
      this.plans.sort((a, b) => a.at - b.at); this.onPlans();
    }
    const now = w.gameSec, dts = EVERY * w.dt; // real seconds since the last pass
    for (let i = 0; i < e.hi; i++) {
      if (e.kind[i] !== Kind.Threat || e.map[i] === NO_MAP) continue;
      const m = e.map[i]!, id = e.id(i);
      // Dawn: the night's zombies crumble.
      if (!night && e.sub[i] === 0) {
        e.hp[i]! -= 6 * dts;
        if (e.hp[i]! <= 0) { w.emit('zombie', { id, map: w.maps[m]!.def.id, how: 'dawn' }); w.remove(i, 'dawn'); continue; }
      }
      // The nearest person it can go for.
      let t = -1, td = this.cfg.sight;
      for (let j = 0; j < e.hi; j++) {
        if ((e.kind[j] !== Kind.Agent && e.kind[j] !== Kind.Player) || e.map[j] !== m) continue;
        const d = Math.hypot(e.x[j]! - e.x[i]!, e.y[j]! - e.y[i]!);
        if (d < 12 && e.kind[j] === Kind.Agent && e.nextThink[j]! > w.tick + 4 && e.act[j] !== Act.Flee && e.act[j] !== Act.Fight) e.nextThink[j] = w.tick + 1; // they notice it
        if (d < td && this.prey(j)) { td = d; t = j; }
      }
      let fire = w.survival.fireNear(m, e.x[i]!, e.y[i]!, FIRE_SAFE + 1);
      if (fire < 0 && w.survival.lampNear(m, e.x[i]!, e.y[i]!, 3.5)) fire = Math.floor(e.y[i]! + 0.01) * w.maps[m]!.tiles.w + Math.floor(e.x[i]! + (e.vx[i]! > 0 ? 1 : -1)); // a lamp: back off the way it came
      if (fire >= 0) { // too close to a fire: back away from it
        const W = w.maps[m]!.tiles.w, fx = (fire % W) + 0.5, fy = ((fire / W) | 0) + 0.5;
        const dx = e.x[i]! - fx, dy = e.y[i]! - fy, l = Math.hypot(dx, dy) || 1;
        e.tx[i] = e.x[i]! + (dx / l) * 4; e.ty[i] = e.y[i]! + (dy / l) * 4; e.act[i] = Act.Flee; e.target[i] = -1;
        continue;
      }
      if (t >= 0) {
        e.tx[i] = e.x[i]! + (e.x[t]! - e.x[i]!) * 1.05; e.ty[i] = e.y[i]! + (e.y[t]! - e.y[i]!) * 1.05;
        e.act[i] = Act.Fight; e.target[i] = e.id(t); e.speed[i] = this.cfg.speed;
        if (td <= 1.05 && (this.cool.get(id) ?? 0) <= now) { // bite
          this.cool.set(id, now + 1.2 * w.opt.clockScale);
          this.bite(i, t);
        } else if (td > 1.4) this.claw(i, t);
      } else {
        e.act[i] = Act.Wander; e.target[i] = -1;
        if ((this.wander.get(id) ?? 0) <= now || Math.hypot(e.tx[i]! - e.x[i]!, e.ty[i]! - e.y[i]!) < 0.4) {
          this.wander.set(id, now + (5 + w.rng.next() * 8) * w.opt.clockScale);
          // They smell people: drift towards the nearest one within 120 m (a wide, wandering approach).
          let sx = 0, sy = 0, sd = this.cfg.smell;
          for (let j = 0; j < e.hi; j++) {
            if ((e.kind[j] !== Kind.Agent && e.kind[j] !== Kind.Player) || e.map[j] !== m || !this.prey(j)) continue;
            const d = Math.hypot(e.x[j]! - e.x[i]!, e.y[j]! - e.y[i]!);
            if (d < sd) { sd = d; sx = (e.x[j]! - e.x[i]!) / d; sy = (e.y[j]! - e.y[i]!) / d; }
          }
          e.tx[i] = e.x[i]! + sx * 8 + w.rng.range(-6, 6); e.ty[i] = e.y[i]! + sy * 8 + w.rng.range(-6, 6); e.speed[i] = this.cfg.speed * 0.7;
        }
      }
    }
    // People fighting hit the zombie they face, about once a second.
    for (let j = 0; j < e.hi; j++) {
      if (e.kind[j] !== Kind.Agent || e.act[j] !== Act.Fight || e.map[j] === NO_MAP) continue;
      const z = e.slot(e.target[j]!);
      if (z < 0 || (e.kind[z] !== Kind.Threat && e.kind[z] !== Kind.Animal) || Math.hypot(e.x[z]! - e.x[j]!, e.y[z]! - e.y[j]!) > 1.5 + e.radius[z]!) continue;
      const pid = e.id(j);
      if ((this.cool.get(pid) ?? 0) > now) continue;
      this.cool.set(pid, now + 1 * w.opt.clockScale);
      if (e.kind[z] === Kind.Animal) { if (w.animals.hit(z, this.damageOf(j), j)) e.nextThink[j] = w.tick + 1; continue; }
      if (this.hit(z, this.damageOf(j), j)) e.nextThink[j] = w.tick + 1;
    }
  }

  /** How hard person j hits: the best weapon (sword 34, spear 30, axe 22), bare hands 9 (players 15); strength adds up to 40 %. */
  damageOf(j: number): number {
    const w = this.w, wp = w.survival.weapon(j)[1], str = w.profileOf(j)?.traits.strength ?? 0.5;
    return (wp || (w.e.kind[j] === Kind.Player ? 15 : 12)) * (0.8 + str * 0.4);
  }

  private bite(i: number, t: number): void {
    const w = this.w, e = w.e;
    const sleeping = (e.flags[t]! & EFlag.Sleeping) !== 0;
    e.hp[t]! -= this.cfg.bite * (sleeping ? 1.5 : 1) * (1 - w.survival.defence(t));
    w.emit('bitten', { id: e.id(t), by: e.id(i), hp: Math.round(e.hp[t]!) });
    if (w.isChar(t)) { e.hp[t] = Math.max(5, e.hp[t]!); return; } // players are hurt, never killed
    e.nextThink[t] = w.tick + 1;
    if (e.hp[t]! <= 0) {
      w.emit('death', { id: e.id(t), cause: 'zombie', map: w.maps[e.map[t]!]!.def.id, x: e.x[t], y: e.y[t] });
      w.remove(t, 'zombie');
    }
  }

  /** Blocked by a wall on the way to its prey: claw at it (a wooden wall gives way after ~15 s, a stone one later). */
  private claw(i: number, t: number): void {
    const w = this.w, e = w.e;
    if (e.vx[i]! * e.vx[i]! + e.vy[i]! * e.vy[i]! > 0.05) return; // moving fine
    const dx = e.x[t]! - e.x[i]!, dy = e.y[t]! - e.y[i]!, l = Math.hypot(dx, dy) || 1;
    const tx = Math.floor(e.x[i]! + (dx / l) * 0.8), ty = Math.floor(e.y[i]! + (dy / l) * 0.8);
    const tm = w.maps[e.map[i]!]!.tiles;
    if (!tm.inside(tx, ty) || (!tm.solid[tm.get(tx, ty)] && tm.get(tx, ty) !== w.survival.T.door)) return;
    const name = w.sc.tiles.find((x) => x.id === tm.get(tx, ty))?.name;
    if (!name || !CLAW.has(name)) return; // not trees, rocks, wrecks or water
    if (name === 'spikes') { e.hp[i]! -= 4; if (e.hp[i]! <= 0) { w.emit('zombie', { id: e.id(i), map: w.maps[e.map[i]!]!.def.id, how: 'killed', by: -1 }); w.remove(i, 'spikes'); return; } }
    if (tm.damage(tx, ty, name === 'stonewall' ? 0.7 : 1.4)) w.emit('destroyed', { map: w.maps[e.map[i]!]!.def.id, tx, ty, by: 'zombie' });
  }

  clear(): number {
    const e = this.w.e;
    let n = 0;
    for (let i = 0; i < e.hi; i++) if (e.kind[i] === Kind.Threat) { this.w.remove(i, 'cleared'); n++; }
    return n;
  }
}
