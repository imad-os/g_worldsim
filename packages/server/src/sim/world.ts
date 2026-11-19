import { EFlag, Kind } from '@worldsim/protocol';
import { Entities, NO_MAP } from './entities.js';
import { generateMap } from './mapgen.js';
import { MapPhysics, BOUNDS, type PBody } from './physics.js';
import { Rng } from './rng.js';
import type { MapDef, PortalDef, Scenario } from './scenario.js';
import { SpatialGrid } from './spatial.js';
import type { TileMap } from './tilemap.js';

export interface WMap {
  index: number;
  def: MapDef;
  tiles: TileMap;
  phys: MapPhysics;
  grid: SpatialGrid;
}

export interface WorldEvent { tick: number; gameSec: number; kind: string; data: Record<string, unknown> }

export interface WorldOptions {
  tickRate: number;      // simulated ticks per simulated second
  clockScale: number;    // game seconds per simulated second
  capacity: number;
  seed?: number | string;
}

/** Think intervals (ticks) per LOD level: 0 = busy / in danger ... 3 = asleep. */
const THINK_EVERY = [2, 10, 40, 120];

/**
 * The authoritative world: maps (tiles + physics + spatial grid), entities, portals between maps,
 * the game clock and the seeded RNG. `tick()` advances it by one fixed step and never allocates in
 * the steady state. Clients never influence it: the same ticks give the same world with or without viewers.
 */
export class World {
  readonly sc: Scenario;
  readonly seed: string;
  readonly opt: WorldOptions;
  readonly dt: number;
  readonly maps: WMap[] = [];
  readonly mapIndex = new Map<string, number>();
  readonly portals: (PortalDef & { from: number; dest: number })[];
  readonly e: Entities;
  readonly bodies: (PBody | null)[];
  readonly rng: Rng;
  tick = 0;
  gameSec = 0;
  /** Listeners for notable events (persistence, clients, highlights). */
  readonly listeners: ((ev: WorldEvent) => void)[] = [];
  private readonly scratch = new Int32Array(256);
  private readonly vel = { x: 0, y: 0 };
  private readonly pos = { x: 0, y: 0 };
  private readonly agentR: number;

  constructor(sc: Scenario, opt: WorldOptions) {
    this.sc = sc;
    this.opt = opt;
    this.seed = String(opt.seed ?? sc.seed);
    this.dt = 1 / opt.tickRate;
    this.rng = new Rng(this.seed + ':world');
    this.e = new Entities(opt.capacity);
    this.bodies = new Array(opt.capacity).fill(null);
    this.agentR = sc.agents.radius;
    const circles = sc.tiles.filter((t) => t.solid && t.shape === 'circle').map((t) => t.id);
    sc.maps.forEach((def, index) => {
      const tiles = generateMap(sc, def, `${this.seed}:map:${def.id}`);
      const phys = new MapPhysics(tiles, circles);
      phys.isProjectile = (u) => u >= 0 && this.e.kind[u] === Kind.Projectile;
      this.maps.push({ index, def, tiles, phys, grid: new SpatialGrid(def.w, def.h, opt.capacity) });
      this.mapIndex.set(def.id, index);
    });
    this.portals = sc.portals.map((p) => ({ ...p, from: this.mapIndex.get(p.map)!, dest: this.mapIndex.get(p.to)! }));
  }

  emit(kind: string, data: Record<string, unknown>): void {
    const ev = { tick: this.tick, gameSec: this.gameSec, kind, data };
    for (const l of this.listeners) l(ev);
  }

  /** Initial population, spread over the maps (only for a brand new world). */
  populate(): void {
    const n = this.sc.agents.count, start = this.startMap();
    for (let k = 0; k < n; k++) {
      const m = this.maps[start >= 0 ? start : k % this.maps.length]!;
      const spot = this.freeSpot(m.index, this.rng.range(8, m.def.w - 8), this.rng.range(8, m.def.h - 8), 40);
      if (spot) this.spawnAgent(m.index, spot.x, spot.y);
    }
  }

  /** The scenario's start map index, or -1 (spread over every map). */
  startMap(): number { const id = this.sc.agents.startMap; return id ? this.mapIndex.get(id) ?? -1 : -1; }

  /**
   * Agents may take portals only while travel is open (the owner opens the other maps when ready).
   * Players always can.
   */
  travelOpen = false;

  /**
   * Bring the population to the owner's setting: keep at most `max` agents (those already on the start map first)
   * and, while travel is closed, move every agent that is elsewhere (or on the road) to the start map.
   */
  fitPopulation(max: number): { removed: number; moved: number } {
    const e = this.e, start = this.startMap();
    let removed = 0, moved = 0;
    const list: number[] = [];
    for (let i = 0; i < e.hi; i++) if (e.kind[i] === Kind.Agent) list.push(i);
    list.sort((a, b) => Number(e.map[b] === start) - Number(e.map[a] === start));
    for (let k = max; k < list.length; k++) { this.remove(list[k]!, 'population'); removed++; }
    if (start >= 0 && !this.travelOpen) {
      const def = this.maps[start]!.def;
      for (let k = 0; k < Math.min(max, list.length); k++) {
        const i = list[k]!;
        if (e.map[i] === start) continue;
        if (e.map[i] !== NO_MAP) this.dropBody(i);
        e.map[i] = NO_MAP; e.toMap[i] = start;
        e.ax[i] = this.rng.range(def.w * 0.3, def.w * 0.7); e.ay[i] = this.rng.range(def.h * 0.3, def.h * 0.7);
        e.goal[i] = -1;
        this.arriveAt(i);
        moved++;
      }
    }
    return { removed, moved };
  }

  /** A walkable point near (x, y) with room for an agent, or null. */
  freeSpot(map: number, x: number, y: number, tries = 30): { x: number; y: number } | null {
    const t = this.maps[map]!.tiles, r = this.agentR + 0.05;
    for (let k = 0; k < tries; k++) {
      const d = k * 0.35; // search outward from the wanted point
      const px = k === 0 ? x : x + this.rng.range(-d, d), py = k === 0 ? y : y + this.rng.range(-d, d);
      if (!t.isSolidAt(px - r, py - r) && !t.isSolidAt(px + r, py - r) && !t.isSolidAt(px - r, py + r) && !t.isSolidAt(px + r, py + r)) {
        return { x: px, y: py };
      }
    }
    return null;
  }

  spawnAgent(map: number, x: number, y: number): number {
    const e = this.e;
    const i = e.create(Kind.Agent, map, x, y, this.agentR);
    if (i < 0) return -1;
    e.hp[i] = this.sc.agents.hp;
    e.nextThink[i] = this.tick + this.rng.int(THINK_EVERY[1]!);
    this.bodies[i] = this.maps[map]!.phys.createAgentBody(i, x, y, this.agentR);
    this.emit('spawn', { id: e.id(i), map: this.maps[map]!.def.id, x, y });
    return i;
  }

  /** A person's character. Same body as an agent; moved by their controls, never by the AI. */
  spawnPlayer(map: number, x: number, y: number): number {
    const s = this.freeSpot(map, x, y, 60) ?? this.freeSpot(map, this.maps[map]!.def.w / 2, this.maps[map]!.def.h / 2, 200);
    if (!s) return -1;
    const e = this.e;
    const i = e.create(Kind.Player, map, s.x, s.y, this.agentR);
    if (i < 0) return -1;
    e.hp[i] = this.sc.agents.hp;
    this.bodies[i] = this.maps[map]!.phys.createAgentBody(i, s.x, s.y, this.agentR);
    return i;
  }

  setInput(i: number, mx: number, my: number, run: boolean): void {
    const e = this.e;
    if (e.kind[i] !== Kind.Player) return;
    const len = Math.hypot(mx, my);
    const k = len > 1 ? 1 / len : 1;
    e.inX[i] = mx * k; e.inY[i] = my * k;
    e.speed[i] = run ? this.sc.agents.run : this.sc.agents.walk;
  }

  /** Nearest agent or player within r metres of slot i (for "interact"), or -1. */
  nearest(i: number, r: number): number {
    const e = this.e, m = this.maps[e.map[i]!];
    if (!m) return -1;
    const n = m.grid.queryCircle(e, e.x[i]!, e.y[i]!, r, this.scratch);
    let best = -1, bd = Infinity;
    for (let k = 0; k < n; k++) {
      const j = this.scratch[k]!;
      if (j === i || (e.kind[j] !== Kind.Agent && e.kind[j] !== Kind.Player)) continue;
      const d = Math.hypot(e.x[j]! - e.x[i]!, e.y[j]! - e.y[i]!);
      if (d < bd) { bd = d; best = j; }
    }
    return best;
  }

  remove(i: number, cause = 'removed'): void {
    const e = this.e;
    if (!e.alive(i)) return;
    if (e.kind[i] === Kind.Agent) this.emit('remove', { id: e.id(i), cause });
    this.dropBody(i);
    e.destroy(i);
  }

  private dropBody(i: number): void {
    const b = this.bodies[i];
    if (b) { b.getWorld().destroyBody(b); this.bodies[i] = null; }
  }

  shoot(map: number, x: number, y: number, dx: number, dy: number, owner = -1): number {
    const P = this.sc.projectile, e = this.e;
    const len = Math.hypot(dx, dy) || 1;
    const i = e.create(Kind.Projectile, map, x, y, P.radius);
    if (i < 0) return -1;
    e.owner[i] = owner; e.life[i] = P.ttl; e.hp[i] = P.damage;
    e.vx[i] = (dx / len) * P.speed; e.vy[i] = (dy / len) * P.speed;
    const b = this.maps[map]!.phys.createProjectileBody(i, owner, x, y, P.radius);
    this.vel.x = e.vx[i]!; this.vel.y = e.vy[i]!;
    b.setLinearVelocity(this.vel);
    this.bodies[i] = b;
    return i;
  }

  /** Shortest chain of maps (by travel time) from one map to another: portal indexes, or null. */
  routeMaps(from: number, to: number): number[] | null {
    if (from === to) return [];
    const n = this.maps.length, dist = new Float64Array(n).fill(Infinity), via = new Int32Array(n).fill(-1);
    const done = new Uint8Array(n);
    dist[from] = 0;
    for (;;) {
      let u = -1;
      for (let k = 0; k < n; k++) if (!done[k] && dist[k]! < Infinity && (u < 0 || dist[k]! < dist[u]!)) u = k;
      if (u < 0) return null;
      if (u === to) break;
      done[u] = 1;
      this.portals.forEach((p, pi) => {
        if (p.from !== u) return;
        const d = dist[u]! + p.travel;
        if (d < dist[p.dest]!) { dist[p.dest] = d; via[p.dest] = pi; }
      });
    }
    const path: number[] = [];
    for (let m = to; m !== from; m = this.portals[via[m]!]!.from) path.unshift(via[m]!);
    return path;
  }

  // ---------------------------------------------------------------- tick

  step(): void {
    const e = this.e, dt = this.dt;
    this.think();
    // Steering: agents push toward their goal; physics resolves collisions.
    for (let i = 0; i < e.hi; i++) {
      const k = e.kind[i]!;
      if (k === Kind.Projectile) {
        e.life[i]! -= dt;
        if (e.life[i]! <= 0) this.remove(i, 'expired');
        continue;
      }
      if ((k !== Kind.Agent && k !== Kind.Player) || e.map[i] === NO_MAP) continue;
      const b = this.bodies[i]!;
      const dx = e.tx[i]! - e.x[i]!, dy = e.ty[i]! - e.y[i]!;
      const d = Math.hypot(dx, dy);
      let wx = 0, wy = 0;
      if (k === Kind.Player) {
        wx = e.inX[i]! * e.speed[i]!; wy = e.inY[i]! * e.speed[i]!;
      } else if (d > 0.15) {
        const s = Math.min(e.speed[i]!, d * 2); // slow down on arrival
        wx = (dx / d) * s; wy = (dy / d) * s;
      }
      // Acceleration limit (8 m/s^2): smooth, physical starts and stops.
      const lv = b.getLinearVelocity();
      const ax = wx - lv.x, ay = wy - lv.y, a = Math.hypot(ax, ay), maxDv = 8 * dt;
      const f = a > maxDv ? maxDv / a : 1;
      this.vel.x = lv.x + ax * f; this.vel.y = lv.y + ay * f;
      if (this.vel.x !== lv.x || this.vel.y !== lv.y) { b.setAwake(true); b.setLinearVelocity(this.vel); }
    }
    for (const m of this.maps) m.phys.step(dt);
    for (const m of this.maps) this.handleHits(m);
    for (const m of this.maps) {
      const rebuilt = m.phys.rebuildDirty();
      if (rebuilt) this.emit('tiles', { map: m.def.id, chunks: rebuilt });
    }
    // Read back bodies.
    for (let i = 0; i < e.hi; i++) {
      const b = this.bodies[i];
      if (!b) continue;
      const p = b.getPosition(), v = b.getLinearVelocity();
      e.x[i] = p.x; e.y[i] = p.y; e.vx[i] = v.x; e.vy[i] = v.y;
      let fl = e.flags[i]! & ~(EFlag.Moving | EFlag.Sleeping);
      if (v.x * v.x + v.y * v.y > 0.01) { fl |= EFlag.Moving; e.angle[i] = Math.atan2(v.y, v.x); }
      if (!b.isAwake()) fl |= EFlag.Sleeping;
      e.flags[i] = fl;
    }
    this.portalsAndTransit();
    for (const m of this.maps) m.grid.rebuild(e, m.index);
    this.tick++;
    this.gameSec += dt * this.opt.clockScale;
  }

  private handleHits(m: WMap): void {
    const e = this.e, ph = m.phys;
    for (let h = 0; h < ph.hitN; h++) {
      const p = ph.hitA[h]!, other = ph.hitB[h]!;
      if (e.kind[p] !== Kind.Projectile) continue; // already used this step
      const dmg = e.hp[p]!;
      if (other >= 0 && e.kind[other] === Kind.Agent) {
        e.hp[other]! -= dmg;
        this.emit('hit', { id: e.id(other), by: e.owner[p]! >= 0 ? e.id(e.owner[p]!) : 0, dmg });
        if (e.hp[other]! <= 0) {
          this.emit('death', { id: e.id(other), cause: 'shot', map: m.def.id, x: e.x[other], y: e.y[other] });
          this.remove(other, 'shot');
        }
      } else if (other !== BOUNDS && other < 0) {
        const b = this.bodies[p]!, pos = b.getPosition();
        const sp = Math.hypot(e.vx[p]!, e.vy[p]!) || 1;
        const ti = ph.solidTileAlong(pos.x, pos.y, e.vx[p]! / sp, e.vy[p]! / sp, 1.2);
        if (ti >= 0) {
          const tx = ti % m.tiles.w, ty = (ti / m.tiles.w) | 0;
          if (m.tiles.damage(tx, ty, dmg)) this.emit('destroyed', { map: m.def.id, tx, ty });
        }
      }
      this.remove(p, 'hit');
    }
  }

  private portalsAndTransit(): void {
    const e = this.e;
    for (let i = 0; i < e.hi; i++) {
      const k = e.kind[i];
      if (k !== Kind.Agent && k !== Kind.Player) continue;
      if (e.map[i] === NO_MAP) {
        if (this.gameSec >= e.arrive[i]!) this.arriveAt(i);
        continue;
      }
      if (k === Kind.Player) {
        // People walk into a portal to take it (after first stepping out of the one they arrived by).
        let inside = -1;
        for (let pi = 0; pi < this.portals.length; pi++) {
          const p = this.portals[pi]!;
          if (p.from !== e.map[i]) continue;
          const r = (p.r ?? 1.5) + (e.stuck[i] ? 1 : 0), dx = e.x[i]! - p.x, dy = e.y[i]! - p.y;
          if (dx * dx + dy * dy <= r * r) { inside = pi; break; }
        }
        if (inside < 0) e.stuck[i] = 0;
        else if (!e.stuck[i]) this.enterPortal(i, inside);
        continue;
      }
      const g = e.goal[i]!;
      if (g < 0) continue;
      if (!this.travelOpen) { e.goal[i] = -1; continue; }
      const p = this.portals[g]!;
      if (p.from !== e.map[i]) { e.goal[i] = -1; continue; }
      const r = p.r ?? 1.5;
      const dx = e.x[i]! - p.x, dy = e.y[i]! - p.y;
      if (dx * dx + dy * dy <= r * r) this.enterPortal(i, g);
    }
  }

  private enterPortal(i: number, pi: number): void {
    const e = this.e, p = this.portals[pi]!;
    this.dropBody(i);
    e.map[i] = NO_MAP;
    e.flags[i] = (e.flags[i]! | EFlag.Transit) & ~EFlag.Moving;
    e.toMap[i] = p.dest;
    e.arrive[i] = this.gameSec + p.travel;
    e.ax[i] = p.toX; e.ay[i] = p.toY;
    e.vx[i] = 0; e.vy[i] = 0; e.inX[i] = 0; e.inY[i] = 0;
    e.goal[i] = -1;
    this.emit('travel', { id: e.id(i), from: p.map, to: p.to, arrive: e.arrive[i] });
  }

  private arriveAt(i: number): void {
    const e = this.e, m = e.toMap[i]!;
    const spot = this.freeSpot(m, e.ax[i]!, e.ay[i]!, 60) ?? { x: e.ax[i]!, y: e.ay[i]! };
    e.map[i] = m;
    e.x[i] = spot.x; e.y[i] = spot.y; e.tx[i] = spot.x; e.ty[i] = spot.y;
    e.flags[i] = e.flags[i]! & ~EFlag.Transit;
    e.stuck[i] = e.kind[i] === Kind.Player ? 1 : 0;
    this.bodies[i] = this.maps[m]!.phys.createAgentBody(i, spot.x, spot.y, e.radius[i]!);
    e.nextThink[i] = this.tick + 1;
    this.emit('arrive', { id: e.id(i), map: this.maps[m]!.def.id, x: spot.x, y: spot.y });
  }

  /**
   * Placeholder behaviour until the AI milestone: wander to random reachable-looking spots and
   * sometimes travel to another map through a portal. Runs per agent on its LOD schedule.
   */
  private think(): void {
    const e = this.e, rng = this.rng, A = this.sc.agents;
    for (let i = 0; i < e.hi; i++) {
      if (e.kind[i] !== Kind.Agent || e.map[i] === NO_MAP || e.nextThink[i]! > this.tick) continue;
      const m = this.maps[e.map[i]!]!;
      const dx = e.tx[i]! - e.x[i]!, dy = e.ty[i]! - e.y[i]!;
      const far = dx * dx + dy * dy > 0.5;
      const slow = e.vx[i]! * e.vx[i]! + e.vy[i]! * e.vy[i]! < 0.04;
      e.stuck[i] = far && slow ? Math.min(255, e.stuck[i]! + 1) : 0;
      if (!far || e.stuck[i]! >= 3) {
        e.stuck[i] = 0;
        e.goal[i] = -1;
        if (rng.chance(0.25)) {
          e.speed[i] = 0; e.tx[i] = e.x[i]!; e.ty[i] = e.y[i]!; e.lod[i] = 2; // rest a while
        } else if (this.travelOpen && rng.chance(0.01)) {
          // Head for a portal of this map (agents know every map and how they connect).
          let best = -1, bd = Infinity;
          for (let pi = 0; pi < this.portals.length; pi++) {
            const p = this.portals[pi]!;
            if (p.from !== m.index) continue;
            const d = Math.hypot(p.x - e.x[i]!, p.y - e.y[i]!) + rng.next() * 40;
            if (d < bd) { bd = d; best = pi; }
          }
          if (best >= 0) {
            const p = this.portals[best]!;
            e.goal[i] = best; e.tx[i] = p.x; e.ty[i] = p.y; e.speed[i] = A.walk; e.lod[i] = 1;
          }
        } else {
          const s = this.freeSpot(m.index, e.x[i]! + rng.range(-20, 20), e.y[i]! + rng.range(-20, 20), 8);
          if (s) { e.tx[i] = s.x; e.ty[i] = s.y; e.speed[i] = rng.chance(0.1) ? A.run : A.walk; e.lod[i] = 1; }
        }
      }
      e.nextThink[i] = this.tick + THINK_EVERY[e.lod[i]!]! + rng.int(4);
    }
  }

  /** Recreate physics bodies from the entity columns (after loading a snapshot). */
  rebuildBodies(): void {
    const e = this.e;
    for (let i = 0; i < e.hi; i++) {
      if (!e.alive(i) || e.map[i] === NO_MAP) continue;
      const ph = this.maps[e.map[i]!]!.phys;
      if (e.kind[i] === Kind.Agent || e.kind[i] === Kind.Player) this.bodies[i] = ph.createAgentBody(i, e.x[i]!, e.y[i]!, e.radius[i]!);
      else if (e.kind[i] === Kind.Projectile) this.bodies[i] = ph.createProjectileBody(i, e.owner[i]!, e.x[i]!, e.y[i]!, e.radius[i]!);
      const b = this.bodies[i];
      if (b) { this.vel.x = e.vx[i]!; this.vel.y = e.vy[i]!; b.setLinearVelocity(this.vel); }
    }
    for (const m of this.maps) { m.phys.rebuildDirty(); m.grid.rebuild(e, m.index); }
  }

  /** FNV-1a hash of the simulation state (determinism checks). */
  hash(): string {
    let h = 0x811c9dc5;
    const mix = (v: number) => { h ^= v; h = Math.imul(h, 0x01000193) >>> 0; };
    const e = this.e;
    mix(this.tick);
    for (let i = 0; i < e.hi; i++) {
      if (!e.alive(i)) continue;
      mix(i); mix(e.kind[i]!); mix(e.map[i]!); mix(Math.round(e.x[i]! * 1000)); mix(Math.round(e.y[i]! * 1000));
    }
    for (const m of this.maps) for (let k = 0; k < m.tiles.tiles.length; k += 1) if (m.tiles.tiles[k] !== m.tiles.base![k]) { mix(k); mix(m.tiles.tiles[k]!); }
    for (const v of this.rng.s) mix(v);
    return h.toString(16);
  }
}
