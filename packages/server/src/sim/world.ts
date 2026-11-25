import { Act, EFlag, Kind } from '@worldsim/protocol';
import { Entities, NO_MAP } from './entities.js';
import { generateMap } from './mapgen.js';
import { MapPhysics, BOUNDS, type PBody } from './physics.js';
import { Rng } from './rng.js';
import type { MapDef, PortalDef, Scenario } from './scenario.js';
import { SpatialGrid } from './spatial.js';
import { Brain, LIFE_DEFAULTS, THINK_EVERY, type LifeDef } from './brain.js';
import { randomProfile, PLAYER_AGE, type Profile } from './people.js';
import { Life } from './life.js';
import { Tasks } from './tasks.js';
import { Clans } from './clans.js';
import { Family } from './family.js';
import { Survival } from './survival.js';
import { Gear } from './gear.js';
import { Colony } from './colony.js';
import { Rules } from './rules.js';
import { Replays } from './replays.js';
import { Zombies } from './zombies.js';
import { Animals } from './animals.js';
import { Land } from './land.js';
import { Quests } from './quests.js';
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
  /** The local AI's newer parts, each switchable for controlled experiments (src/experiment.ts). Default: all on. */
  ai?: Partial<AiFlags>;
}

/** research/ARCHITECTURE.md: goap = goal-driven planning of work, learn = people learn what works, siting = buildings planned under constraints. */
export interface AiFlags { goap: boolean; learn: boolean; siting: boolean }

/** Think intervals (ticks) per LOD level: 0 = busy / in danger ... 3 = asleep. */

/**
 * The authoritative world: maps (tiles + physics + spatial grid), entities, portals between maps,
 * the game clock and the seeded RNG. `tick()` advances it by one fixed step and never allocates in
 * the steady state. Clients never influence it: the same ticks give the same world with or without viewers.
 */
export class World {
  readonly sc: Scenario;
  readonly seed: string;
  readonly opt: WorldOptions;
  readonly ai: AiFlags;
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
  /** Needs, choices, paths and actions of every agent. */
  readonly brain: Brain;
  /** Who every agent is (also the dead, for family trees), by entity id. */
  readonly profiles = new Map<number, Profile>();
  /** Ageing, partners, babies, old age (milestone 7). */
  readonly life: Life;
  readonly tasks: Tasks;
  readonly survival: Survival;
  /** What people wear and hold, upgrades, and the move viewers see (sim/gear.ts). */
  readonly gear: Gear;
  /** The camp's drives, goal planning (GOAP) and what people learn (sim/colony.ts). */
  readonly colony: Colony;
  /** Clans and fights between people (sim/clans.ts). */
  readonly clans: Clans;
  /** Families: who is family, little ones and who looks after them (sim/family.ts). */
  readonly family: Family;
  /** A person says a line aloud (the planner sets it: viewers, memory of those near). */
  speak: (i: number, text: string) => void = () => {};
  readonly zombies: Zombies;
  /** The owner's strict rules (sim/rules.ts). */
  readonly rules: Rules;
  /** Zombie attacks recorded for viewers to play back (sim/replays.ts). */
  readonly replays: Replays;
  /** Wild animals to hunt (sim/animals.ts). */
  readonly animals: Animals;
  /** The town's ring of trees, its 4 roads out, wrecks while travel is closed, rocks (sim/land.ts). */
  readonly land: Land;
  /** The town's teachers (NPCs) and their quests (sim/quests.ts). */
  readonly quests: Quests;
  private doorTile = -1;

  constructor(sc: Scenario, opt: WorldOptions) {
    this.sc = sc;
    this.opt = opt;
    this.ai = { goap: true, learn: true, siting: true, ...opt.ai };
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
    const L = sc.life ?? {};
    const life: LifeDef = { ...LIFE_DEFAULTS, ...L, needs: { ...LIFE_DEFAULTS.needs, ...L.needs } };
    this.brain = new Brain(this, life);
    this.life = new Life(this);
    this.tasks = new Tasks(this);
    this.survival = new Survival(this);
    this.gear = new Gear(this);
    this.colony = new Colony(this);
    this.clans = new Clans(this);
    this.family = new Family(this);
    this.zombies = new Zombies(this);
    this.rules = new Rules(this);
    this.replays = new Replays(this);
    this.animals = new Animals(this);
    this.land = new Land(this);
    this.quests = new Quests(this);
    this.doorTile = sc.tiles.find((t) => t.name === 'door')?.id ?? -1;
  }
  /** Game seconds per year of age. */
  get yearSec(): number { return this.brain.life.yearDays * 86400; }

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
      if (spot) {
        const i = this.spawnAgent(m.index, spot.x, spot.y);
        // Not everyone hungry at the same moment.
        if (i >= 0) { this.e.hunger[i] = this.rng.range(0, 40); this.e.thirst[i] = this.rng.range(0, 40); this.e.tired[i] = this.rng.range(0, 50); this.e.lonely[i] = this.rng.range(0, 50); }
      }
    }
    this.brain.spawnItems(true);
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
    for (let i = 0; i < e.hi; i++) if (e.kind[i] === Kind.Agent && !this.charName(i)) list.push(i);
    list.sort((a, b) => Number(e.map[b] === start) - Number(e.map[a] === start));
    for (let k = max; k < list.length; k++) { this.remove(list[k]!, 'population'); removed++; }
    if (start >= 0 && !this.travelOpen) {
      const def = this.maps[start]!.def;
      for (let k = 0; k < Math.min(max, list.length); k++) {
        const i = list[k]!;
        if (e.map[i] === start) continue;
        this.place(i, start, this.rng.range(def.w * 0.3, def.w * 0.7), this.rng.range(def.h * 0.3, def.h * 0.7));
        moved++;
      }
    }
    return { removed, moved };
  }

  /** Move an entity to (x, y) on its map at once (its body too). */
  setPos(i: number, x: number, y: number): void {
    const b = this.bodies[i];
    if (b) { this.pos.x = x; this.pos.y = y; b.setPosition(this.pos); }
    this.e.x[i] = x; this.e.y[i] = y; this.e.tx[i] = x; this.e.ty[i] = y;
  }
  /** Turn an entity's collisions off (a baby in arms) or on again. */
  bodyOn(i: number, on: boolean): void { const b = this.bodies[i]; if (b && b.isActive() !== on) b.setActive(on); }

  /** Put an agent or player at a free spot near (x, y) on a map, now (no travel). */
  place(i: number, map: number, x: number, y: number): void {
    const e = this.e;
    if (e.map[i] !== NO_MAP) this.dropBody(i);
    e.map[i] = NO_MAP; e.toMap[i] = map; e.ax[i] = x; e.ay[i] = y; e.goal[i] = -1;
    this.arriveAt(i);
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

  spawnAgent(map: number, x: number, y: number, profile?: Profile): number {
    const e = this.e;
    const i = e.create(Kind.Agent, map, x, y, this.agentR);
    if (i < 0) return -1;
    this.profiles.set(e.id(i), profile ?? randomProfile(this.rng, this.gameSec, this.livingNames(), this.yearSec));
    e.hp[i] = this.sc.agents.hp;
    e.nextThink[i] = this.tick + this.rng.int(THINK_EVERY[1]!);
    this.bodies[i] = this.maps[map]!.phys.createAgentBody(i, x, y, this.agentR);
    this.emit('spawn', { id: e.id(i), map: this.maps[map]!.def.id, x, y });
    return i;
  }

  /** One of the town's teachers (sim/quests.ts): a body that stands at its spot (it walks back there when pushed). */
  spawnNpc(map: number, x: number, y: number, look: number): number {
    const e = this.e;
    const i = e.create(Kind.Npc, map, x, y, this.agentR);
    if (i < 0) return -1;
    e.hp[i] = 100; e.sub[i] = look; e.tx[i] = x; e.ty[i] = y; e.speed[i] = 1;
    this.bodies[i] = this.maps[map]!.phys.createAgentBody(i, x, y, this.agentR);
    return i;
  }

  /** Characters whose player is away (entity ids): they sleep and their needs wait. */
  readonly away = new Set<number>();

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
    if (e.flags[i]! & EFlag.Sleeping) { // asleep: a move wakes the player up
      if (Math.abs(mx) + Math.abs(my) < 0.3) { e.inX[i] = e.inY[i] = 0; return; }
      e.flags[i] = e.flags[i]! & ~EFlag.Sleeping; e.act[i] = Act.Idle;
    }
    const len = Math.hypot(mx, my);
    const k = len > 1 ? 1 / len : 1;
    e.inX[i] = mx * k; e.inY[i] = my * k;
    e.speed[i] = run ? this.sc.agents.run : this.sc.agents.walk;
  }

  /**
   * The player's screen moves their character at once (imad 2026-11-20: "move my character immediately") and tells us where it
   * is: accepted when it is close to where we have it (2.5 m) and on walkable ground, else our place stands (the screen is told).
   */
  trustMove(i: number, x: number, y: number): boolean {
    const e = this.e, m = e.map[i]!;
    if (e.kind[i] !== Kind.Player || m === NO_MAP || (e.flags[i]! & EFlag.Sleeping)) return false;
    if (Math.hypot(x - e.x[i]!, y - e.y[i]!) > 2.5) return false;
    const tm = this.maps[m]!.tiles, r = e.radius[i]! * 0.8;
    for (const [dx, dy] of [[-r, -r], [r, -r], [-r, r], [r, r]] as const) {
      const tx = Math.floor(x + dx), ty = Math.floor(y + dy);
      if (!tm.inside(tx, ty) || tm.cost[tm.get(tx, ty)]! <= 0) return false;
      if (this.survival.homes.shut(i, m, Math.floor(e.y[i]! + dy) * tm.w + Math.floor(e.x[i]! + dx), ty * tm.w + tx)) { if (this.tick % 10 === 0) this.emit('blocked', { id: e.id(i), why: 'door' }); return false; }
    }
    const b = this.bodies[i];
    if (b) { this.pos.x = x; this.pos.y = y; b.setPosition(this.pos); }
    e.x[i] = x; e.y[i] = y;
    return true;
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

  /** Names in use by the living (new names never repeat one). */
  livingNames(): Set<string> {
    const s = new Set<string>();
    for (const [id, p] of this.profiles) if (p.died === undefined && this.e.slot(id) >= 0) s.add(p.name);
    return s;
  }
  profileOf(i: number): Profile | undefined { return this.profiles.get(this.e.id(i)); }

  /** A player's character (Kind.Player, or Kind.Agent while the AI autopilot drives it): the player's name, else ''. */
  charName(i: number): string { return this.profiles.get(this.e.id(i))?.player ?? ''; }
  isChar(i: number): boolean { return this.e.kind[i] === Kind.Player || !!this.charName(i); }

  /** Give a player's character its person profile (first time): a 25-year-old, sex and skin chosen later on the TV. */
  playerProfile(i: number, name: string): Profile {
    const id = this.e.id(i);
    let p = this.profiles.get(id);
    if (!p) {
      const r = randomProfile(this.rng, this.gameSec, this.livingNames(), this.yearSec);
      p = { ...r, name, sex: 'm', born: this.gameSec - PLAYER_AGE * this.yearSec, player: name, skin: 1, chose: false, auto: false };
      this.profiles.set(id, p);
    }
    this.setLook(i);
    return p;
  }
  /** The look sent to the viewers with a character (frame bits 24+): 1 + skin tone, + 8 for a woman. */
  setLook(i: number): void {
    const p = this.profileOf(i);
    if (p?.player) this.e.sub[i] = 1 + Math.max(0, Math.min(4, p.skin ?? 1)) + (p.sex === 'f' ? 8 : 0);
  }

  /** The player left with the autopilot on: the AI drives the character (an agent for the brain) until they come back. */
  toAgent(i: number): void {
    const e = this.e;
    if (e.kind[i] !== Kind.Player) return;
    e.kind[i] = Kind.Agent;
    e.inX[i] = e.inY[i] = 0;
    e.flags[i] = e.flags[i]! & ~EFlag.Sleeping;
    e.act[i] = Act.Idle; e.target[i] = -1;
    this.brain.stop(i);
    e.stuck[i] = 0;
    e.nextThink[i] = this.tick + 1;
  }
  /** The player is back: their hands on the controls again. */
  toPlayer(i: number): void {
    const e = this.e;
    if (e.kind[i] === Kind.Player) return;
    this.tasks.stop(i);
    this.brain.order(i, 'stop', -1, -1, 0);
    this.brain.stop(i);
    e.kind[i] = Kind.Player;
    e.stuck[i] = 1; e.speed[i] = 0; e.target[i] = -1;
    e.act[i] = Act.Idle;
  }

  remove(i: number, cause = 'removed'): void {
    const e = this.e;
    if (!e.alive(i)) return;
    const p = e.kind[i] === Kind.Agent ? this.profiles.get(e.id(i)) : undefined;
    if (p) { p.died = this.gameSec; p.cause = cause; if (cause === 'population' || cause === 'admin-remove') this.profiles.delete(e.id(i)); }
    if (e.kind[i] === Kind.Agent) this.emit('remove', { id: e.id(i), cause });
    if (this.family) { this.family.carried[i] = -1; this.family.carer[i] = -1; for (let k = 0; k < e.hi; k++) if (this.family.carried[k] === i) this.family.putDown(k); }
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
    this.brain.think();
    this.life.tick();
    if (this.tick % 20 === 0) { this.gear.update(); this.survival.update(); this.tasks.update(); this.rules.update(); this.clans.update(); this.family.update(); this.quests.update(); }
    this.zombies.update();
    this.animals.update();
    if (this.tick % 10 === 0) for (const i of this.land.pushing()) this.emit('blocked', { id: this.e.id(i) });
    this.replays.update();
    // Steering: agents push toward their goal; physics resolves collisions.
    for (let i = 0; i < e.hi; i++) {
      const k = e.kind[i]!;
      if (k === Kind.Projectile) {
        e.life[i]! -= dt;
        if (e.life[i]! <= 0) this.remove(i, 'expired');
        continue;
      }
      if ((k !== Kind.Agent && k !== Kind.Player && k !== Kind.Threat && k !== Kind.Animal && k !== Kind.Npc) || e.map[i] === NO_MAP) continue;
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
      // Doors let people through, never zombies or animals: they stay where they were (and claw at it).
      if ((e.kind[i] === Kind.Threat || e.kind[i] === Kind.Animal) && this.doorTile >= 0 && this.maps[e.map[i]!]!.tiles.tiles[Math.floor(p.y) * this.maps[e.map[i]!]!.tiles.w + Math.floor(p.x)] === this.doorTile) {
        this.pos.x = e.x[i]!; this.pos.y = e.y[i]!; b.setPosition(this.pos); this.vel.x = 0; this.vel.y = 0; b.setLinearVelocity(this.vel);
        e.vx[i] = 0; e.vy[i] = 0;
        continue;
      }
      // A hut's door opens only for its owner and their family (sim/homes.ts): anyone else stays outside.
      if ((e.kind[i] === Kind.Agent || e.kind[i] === Kind.Player) && this.doorTile >= 0) {
        const tm = this.maps[e.map[i]!]!.tiles, k = Math.floor(p.y) * tm.w + Math.floor(p.x);
        if (this.survival.homes.shut(i, e.map[i]!, Math.floor(e.y[i]!) * tm.w + Math.floor(e.x[i]!), k)) {
          this.pos.x = e.x[i]!; this.pos.y = e.y[i]!; b.setPosition(this.pos); this.vel.x = 0; this.vel.y = 0; b.setLinearVelocity(this.vel);
          e.vx[i] = 0; e.vy[i] = 0;
          if (e.kind[i] === Kind.Player && this.tick % 10 === 0) this.emit('blocked', { id: e.id(i), why: 'door' });
          continue;
        }
      }
      e.x[i] = p.x; e.y[i] = p.y; e.vx[i] = v.x; e.vy[i] = v.y;
      let fl = e.flags[i]! & ~EFlag.Moving; // Sleeping = asleep (set by the brain), not a resting physics body
      if (v.x * v.x + v.y * v.y > 0.01) { fl |= EFlag.Moving; e.angle[i] = Math.atan2(v.y, v.x); }
      e.flags[i] = fl;
    }
    this.family.carry(); // little ones in arms go with their carer
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

  /** Recreate physics bodies from the entity columns (after loading a snapshot). */
  rebuildBodies(): void {
    const e = this.e;
    for (let i = 0; i < e.hi; i++) {
      if (!e.alive(i) || e.map[i] === NO_MAP) continue;
      const ph = this.maps[e.map[i]!]!.phys;
      if (e.kind[i] === Kind.Agent || e.kind[i] === Kind.Player || e.kind[i] === Kind.Threat || e.kind[i] === Kind.Animal || e.kind[i] === Kind.Npc) this.bodies[i] = ph.createAgentBody(i, e.x[i]!, e.y[i]!, e.radius[i]!);
      else if (e.kind[i] === Kind.Projectile) this.bodies[i] = ph.createProjectileBody(i, e.owner[i]!, e.x[i]!, e.y[i]!, e.radius[i]!);
      const b = this.bodies[i];
      if (b) { this.vel.x = e.vx[i]!; this.vel.y = e.vy[i]!; b.setLinearVelocity(this.vel); }
    }
    for (const m of this.maps) { m.phys.rebuildDirty(); m.grid.rebuild(e, m.index); }
    this.brain.reset();
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
