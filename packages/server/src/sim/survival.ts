import { Act, Kind } from '@worldsim/protocol';
import { NO_MAP } from './entities.js';
import type { World } from './world.js';

/**
 * Milestone 8, part 2: living off the land. People carry materials (wood, stone, scrap) and tools (axe, spear) in
 * `Profile.inv`; they chop trees, search rubble, make tools, light campfires and build huts, all on the real map
 * (tiles change, so the viewers and the path finder see it). Work is a "job": walk to a spot, then work there for
 * some game time (`Brain.job`). Fires burn fuel and go out (ashes) unless someone adds wood. Cut trees grow back.
 * Commands use these as task skills (gather / craft / build / tend in sim/tasks.ts), and people also decide on
 * their own once an hour: a fire for the evening, a hut when there are not enough roofs, an axe, a wood pile.
 */
export const RES = ['wood', 'stone', 'scrap'] as const;
export const TOOLS = ['axe', 'spear'] as const;
export type Res = (typeof RES)[number];
export type Inv = Partial<Record<Res | (typeof TOOLS)[number], number>>;
export const CAP = 20;
export const RECIPES: Record<string, Inv> = {
  axe: { wood: 2, stone: 1 },
  spear: { wood: 2, scrap: 1 },
  campfire: { wood: 3, stone: 2 },
  hut: { wood: 12, stone: 4 },
};
/** Game seconds of work. */
const WORK = { chop: 120, dig: 100, fire: 240, hut: 50, tend: 45, pick: 20, store: 40, take: 30, loot: 150, plant: 180, repair: 60, heal: 120 } as const;
/** What a storage crate keeps. */
export type StashKey = 'food' | Res;
export interface Stash { t: number; food: number; wood: number; stone: number; scrap: number }
const HOUR = 3600;
const FIRE_START = 10 * HOUR, FIRE_ADD = 4 * HOUR, FIRE_WARM = 6;

type JobKind = keyof typeof WORK;
interface Job { kind: JobKind; m: number; tx: number; ty: number; work: number; tiles?: number[]; tries?: number; why?: string; who?: number; what?: string; n?: number }

/** Job kinds under the names the owner's rules use (sim/rules.ts). */
const JOB_RULE: Record<string, string> = { chop: 'gather', dig: 'gather', fire: 'build', hut: 'build', pick: 'collect', plant: 'farm' };

export class Survival {
  private readonly jobs = new Map<number, Job>();
  /** Burning fires: `${map}:${tile index}` -> game second the fuel runs out. */
  readonly fires = new Map<string, number>();
  /** Huts (door tile index) per map, for the "enough roofs?" rule. */
  readonly huts: number[][];
  /** Each map's camp: where the first fire or hut went up; later fires and huts go near it, people sleep there. */
  readonly camp: ({ x: number; y: number } | null)[];
  readonly T: { tree: number; rubble: number; campfire: number; ashes: number; woodwall: number; floor: number; dirt: number; grass: number; water: number; crate: number; farm: number };
  /** Each map's storage crate (made at the camp the first time someone stores something). */
  readonly stash: (Stash | null)[];
  /** Planted fields: `${map}:${tile}` -> game second of the next harvest (berries appear around it). */
  readonly farms = new Map<string, number>();
  /** Ruin floors searched: `${map}:${tile}` -> game second (searched again after 2 days). */
  private readonly looted = new Map<string, number>();
  private readonly buildable = new Set<number>();
  private lastTick = -1;
  private nextHour = 0;
  /** A job ended: ok, or why not (for tasks). */
  readonly ended = new Map<number, true | string>();

  constructor(private w: World) {
    const id = (n: string) => w.sc.tiles.find((t) => t.name === n)?.id ?? -1;
    this.T = { tree: id('tree'), rubble: id('rubble'), campfire: id('campfire'), ashes: id('ashes'), woodwall: id('woodwall'), floor: id('floor'), dirt: id('dirt'), grass: id('grass'), water: id('water'), crate: id('crate'), farm: id('farm') };
    for (const n of ['grass', 'dirt', 'sand', 'ashes']) if (id(n) >= 0) this.buildable.add(id(n));
    this.huts = w.maps.map(() => []);
    this.camp = w.maps.map(() => null);
    this.stash = w.maps.map(() => null);
  }

  /** What snapshots keep (fires, camps, crates, fields, huts). */
  save(): unknown {
    return { fires: [...this.fires], camp: this.camp, stash: this.stash, farms: [...this.farms], looted: [...this.looted], huts: this.huts };
  }
  load(d: unknown): void {
    const v = d as { fires?: [string, number][]; camp?: ({ x: number; y: number } | null)[]; stash?: (Stash | null)[]; farms?: [string, number][]; looted?: [string, number][]; huts?: number[][] } | undefined;
    if (!v) return;
    this.init();
    this.fires.clear(); for (const [k, t] of v.fires ?? []) this.fires.set(k, t);
    this.farms.clear(); for (const [k, t] of v.farms ?? []) this.farms.set(k, t);
    this.looted.clear(); for (const [k, t] of v.looted ?? []) this.looted.set(k, t);
    v.camp?.forEach((c, m) => { if (m < this.camp.length && c) this.camp[m] = c; });
    v.stash?.forEach((c, m) => { if (m < this.stash.length) this.stash[m] = c; });
    v.huts?.forEach((h, m) => { if (m < this.huts.length) this.huts[m] = h; });
  }
  campOf(m: number): { x: number; y: number } | null { return this.camp[m] ?? null; }
  private setCamp(m: number, x: number, y: number): void { if (!this.camp[m]) { this.camp[m] = { x, y }; this.w.emit('camp', { map: this.w.maps[m]!.def.id, x, y }); } }

  get enabled(): boolean { return this.T.campfire >= 0 && this.T.woodwall >= 0; }

  /** After loading (or a new world): fires found on the maps burn 4 more hours; huts are counted from their walls. */
  init(): void {
    const w = this.w;
    this.fires.clear();
    this.lastTick = w.tick;
    w.maps.forEach((m, mi) => {
      const t = m.tiles;
      let walls = 0;
      this.camp[mi] = null;
      for (let k = 0; k < t.tiles.length; k++) {
        if (t.tiles[k] === this.T.campfire) this.fires.set(`${mi}:${k}`, w.gameSec + FIRE_ADD);
        if (t.tiles[k] === this.T.woodwall) { walls++; if (!this.camp[mi]) this.camp[mi] = { x: (k % t.w) + 2.5, y: ((k / t.w) | 0) + 6 }; }
        if (t.tiles[k] === this.T.campfire && !this.camp[mi]) this.camp[mi] = { x: (k % t.w) + 0.5, y: ((k / t.w) | 0) + 0.5 };
      }
      this.huts[mi] = Array.from({ length: Math.round(walls / 15) }, () => -1);
    });
    this.lastTick = w.tick;
  }

  inv(i: number): Inv { const p = this.w.profileOf(i); if (!p) return {}; return (p.inv ??= {}); }
  has(i: number, need: Inv): boolean { const v = this.inv(i); return Object.entries(need).every(([k, n]) => (v[k as Res] ?? 0) >= n!); }
  /** What is missing for a recipe: [[res, count], ...]. */
  missing(i: number, what: string): [Res, number][] {
    const need = RECIPES[what] ?? {}, v = this.inv(i), out: [Res, number][] = [];
    for (const [k, n] of Object.entries(need)) if ((v[k as Res] ?? 0) < n!) out.push([k as Res, n! - (v[k as Res] ?? 0)]);
    return out;
  }
  private add(i: number, k: keyof Inv, n: number): void { const v = this.inv(i); v[k] = Math.max(0, Math.min(CAP, (v[k] ?? 0) + n)); }
  private use(i: number, need: Inv): void { for (const [k, n] of Object.entries(need)) this.add(i, k as Res, -n!); }

  /** Make a tool now (materials are used up). True or why not. */
  craft(i: number, what: string): true | string {
    if (!(TOOLS as readonly string[]).includes(what)) return `I can't make ${what}`;
    const rule = this.w.rules.forbidden(i, 'craft');
    if (rule) return `I must not: "${rule}"`;
    if (!this.has(i, RECIPES[what]!)) return `I need ${this.missing(i, what).map(([k, n]) => `${n} ${k}`).join(' and ')}`;
    if ((this.inv(i)[what as 'axe'] ?? 0) >= 1) return true;
    this.use(i, RECIPES[what]!);
    this.add(i, what as 'axe', 1);
    this.w.emit('craft', { id: this.w.e.id(i), what });
    return true;
  }

  busy(id: number): boolean { return this.jobs.has(id); }
  jobOf(id: number): string { return this.jobs.get(id)?.kind ?? ''; }
  cancel(id: number): void { if (this.jobs.delete(id)) { const i = this.w.e.slot(id); if (i >= 0) this.w.brain.order(i, 'stop', -1, -1, 0); } }

  /** Start getting one piece of a resource: the nearest tree (wood) or rubble (stone, scrap). True or why not. */
  gather(i: number, what: Res): true | string {
    const tile = what === 'wood' ? this.T.tree : this.T.rubble;
    if (tile < 0) return `there is no ${what} here`;
    const t = this.nearestTile(i, tile, 60);
    if (t < 0) return what === 'wood' ? 'there are no trees near here' : 'there is no rubble near here';
    return this.begin(i, { kind: what === 'wood' ? 'chop' : 'dig', m: this.w.e.map[i]!, tx: t % this.W(i), ty: (t / this.W(i)) | 0, work: 0 });
  }

  /** Start building a campfire or a hut near (x, y) (default: where they stand). Materials are used when it is done. */
  build(i: number, what: 'campfire' | 'hut', x?: number, y?: number): true | string {
    if (!this.enabled) return 'this world has no buildings';
    if (!this.has(i, RECIPES[what]!)) return `I need ${this.missing(i, what).map(([k, n]) => `${n} ${k}`).join(' and ')}`;
    const e = this.w.e, m = e.map[i]!, camp = this.camp[m];
    // Near the camp when there is one (a village grows), else where they stand.
    const nearCamp = camp && Math.hypot(camp.x - e.x[i]!, camp.y - e.y[i]!) < 150;
    const cx = x ?? (nearCamp ? camp.x : e.x[i]!), cy = y ?? (nearCamp ? camp.y : e.y[i]!);
    if (what === 'campfire') {
      const s = this.site(m, cx, cy, 1, 1, 12);
      if (s < 0) return 'I found no clear ground for a fire';
      const W = this.w.maps[m]!.tiles.w;
      return this.begin(i, { kind: 'fire', m, tx: s % W, ty: (s / W) | 0, work: 0 });
    }
    const s = this.site(m, cx, cy, 5, 5, 30);
    if (s < 0) return 'I found no clear ground for a hut';
    const W = this.w.maps[m]!.tiles.w, x0 = s % W, y0 = (s / W) | 0;
    // Floor first (inside), then the walls from the back to the front; the door (front middle) stays open.
    const floor: number[] = [], walls: number[] = [];
    for (let yy = 0; yy < 5; yy++) for (let xx = 0; xx < 5; xx++) {
      const k = (y0 + yy) * W + x0 + xx, edge = xx === 0 || yy === 0 || xx === 4 || yy === 4;
      if (!edge) floor.push(k, this.T.floor);
      else if (!(yy === 4 && xx === 2)) walls.push(k, this.T.woodwall);
      else floor.push(k, this.T.floor);
    }
    // Stand just outside the door, at (x0 + 2, y0 + 5).
    return this.begin(i, { kind: 'hut', m, tx: x0 + 2, ty: y0 + 5, work: 0, tiles: [...floor, ...walls] });
  }

  /** Put wood on the nearest fire (within 40 m). */
  tend(i: number): true | string {
    if ((this.inv(i).wood ?? 0) < 1) return 'I have no wood';
    const t = this.nearestFire(i, 40);
    if (t < 0) return 'there is no fire near here';
    const W = this.W(i);
    return this.begin(i, { kind: 'tend', m: this.w.e.map[i]!, tx: t % W, ty: (t / W) | 0, work: 0 });
  }

  // ------------------------------------------------------------ more work (milestone 8: carry / store, loot, farm, repair, heal)
  /** Pick up the nearest food (into the hands, not eaten). */
  collect(i: number): true | string {
    const e = this.w.e;
    if (e.carry[i]! >= 5) return 'my hands are full';
    let best = -1, bd = 90;
    for (let j = 0; j < e.hi; j++) {
      if (e.kind[j] !== Kind.Item || e.map[j] !== e.map[i]) continue;
      const d = Math.hypot(e.x[j]! - e.x[i]!, e.y[j]! - e.y[i]!);
      if (d < bd && !this.claimed(e.id(j))) { bd = d; best = j; }
    }
    if (best < 0) return 'I found no food around here';
    return this.begin(i, { kind: 'pick', m: e.map[i]!, tx: Math.floor(e.x[best]!), ty: Math.floor(e.y[best]!), work: 0, who: e.id(best) });
  }
  private claimed(itemId: number): boolean { for (const j of this.jobs.values()) if (j.kind === 'pick' && j.who === itemId) return true; return false; }

  /** The map's crate, made at the camp (or here, which then becomes the camp) the first time. */
  crateOf(m: number, x: number, y: number): Stash | null {
    const w = this.w;
    if (this.stash[m]) return this.stash[m]!;
    if (this.T.crate < 0) return null;
    const camp = this.camp[m];
    const s = this.site(m, camp?.x ?? x, camp?.y ?? y, 1, 1, 10);
    if (s < 0) return null;
    const tm = w.maps[m]!.tiles;
    tm.set(s % tm.w, (s / tm.w) | 0, this.T.crate);
    this.stash[m] = { t: s, food: 0, wood: 0, stone: 0, scrap: 0 };
    this.setCamp(m, (s % tm.w) + 0.5, ((s / tm.w) | 0) + 0.5);
    w.emit('build', { what: 'crate', map: w.maps[m]!.def.id, tx: s % tm.w, ty: (s / tm.w) | 0 });
    return this.stash[m]!;
  }

  /** Put what they carry (food, or a material) into the camp's crate. */
  store(i: number, what: StashKey): true | string {
    const e = this.w.e, m = e.map[i]!;
    if ((what === 'food' ? e.carry[i]! : this.inv(i)[what] ?? 0) <= 0) return `I have no ${what} to store`;
    const st = this.crateOf(m, e.x[i]!, e.y[i]!);
    if (!st) return 'I found no place for a store';
    const W = this.W(i);
    return this.begin(i, { kind: 'store', m, tx: st.t % W, ty: (st.t / W) | 0, work: 0, what });
  }

  /** Take n of something from the camp's crate. */
  take(i: number, what: StashKey, n: number): true | string {
    const e = this.w.e, m = e.map[i]!, st = this.stash[m];
    if (!st || st[what] <= 0) return `there is no ${what} in the store`;
    const W = this.W(i);
    return this.begin(i, { kind: 'take', m, tx: st.t % W, ty: (st.t / W) | 0, work: 0, what, n });
  }
  /** Food in the camp's crate within r metres: the crate's tile, or -1. */
  stashFood(i: number, r: number): number {
    const e = this.w.e, m = e.map[i]!, st = this.stash[m];
    if (!st || st.food <= 0) return -1;
    const W = this.W(i);
    return Math.hypot((st.t % W) + 0.5 - e.x[i]!, ((st.t / W) | 0) + 0.5 - e.y[i]!) <= r ? st.t : -1;
  }
  /** Eat from the crate (standing next to it). */
  eatFromStash(i: number): boolean {
    const e = this.w.e, st = this.stash[e.map[i]!];
    if (!st || st.food <= 0) return false;
    const W = this.W(i);
    if (Math.hypot((st.t % W) + 0.5 - e.x[i]!, ((st.t / W) | 0) + 0.5 - e.y[i]!) > 2.2) return false;
    st.food--;
    e.hunger[i] = Math.max(0, e.hunger[i]! - 40);
    this.w.emit('eat', { id: e.id(i), from: 'store' });
    return true;
  }

  /** Search an old building (a ruin's floor) for something useful. */
  loot(i: number): true | string {
    const w = this.w, e = w.e, m = e.map[i]!, tm = w.maps[m]!.tiles;
    if (!tm.base) return 'nothing to search here';
    const cx = Math.floor(e.x[i]!), cy = Math.floor(e.y[i]!), R = 60;
    let best = -1, bd = Infinity;
    for (let k = 0; k < 400; k++) {
      const x = cx + w.rng.int(R * 2) - R, y = cy + w.rng.int(R * 2) - R;
      if (!tm.inside(x, y)) continue;
      const t = y * tm.w + x;
      if (tm.base[t] !== this.T.floor || tm.tiles[t] !== this.T.floor) continue;
      if ((this.looted.get(`${m}:${t}`) ?? -Infinity) > w.gameSec - 48 * HOUR) continue;
      const d = Math.hypot(x - cx, y - cy);
      if (d < bd) { bd = d; best = t; }
    }
    if (best < 0) return 'every ruin near here has been searched';
    return this.begin(i, { kind: 'loot', m, tx: best % tm.w, ty: (best / tm.w) | 0, work: 0 });
  }

  /** Plant a field of berries near the camp (berries grow there every 12 game hours). */
  plant(i: number): true | string {
    if (this.T.farm < 0) return 'nothing to plant here';
    const e = this.w.e, m = e.map[i]!, camp = this.camp[m];
    const s = this.site(m, camp?.x ?? e.x[i]!, camp?.y ?? e.y[i]!, 1, 1, 18);
    if (s < 0) return 'I found no ground to plant';
    const W = this.W(i);
    return this.begin(i, { kind: 'plant', m, tx: s % W, ty: (s / W) | 0, work: 0 });
  }

  /** A broken or damaged hut wall near the camp (tile index, -1 none). */
  damaged(m: number): number {
    const tm = this.w.maps[m]!.tiles;
    for (const door of this.huts[m]!) {
      if (door < 0) continue;
      const x0 = (door % tm.w) - 2, y0 = ((door / tm.w) | 0) - 5;
      for (let yy = 0; yy < 5; yy++) for (let xx = 0; xx < 5; xx++) {
        if (!(xx === 0 || yy === 0 || xx === 4 || yy === 4) || (yy === 4 && xx === 2)) continue;
        const t = (y0 + yy) * tm.w + x0 + xx;
        if (tm.tiles[t] !== this.T.woodwall ? this.buildable.has(tm.tiles[t]!) : tm.hp[t]! < tm.maxHp[this.T.woodwall]!) return t;
      }
    }
    return -1;
  }
  /** Mend a hut wall (1 wood). */
  repair(i: number): true | string {
    if ((this.inv(i).wood ?? 0) < 1) return 'I have no wood';
    const m = this.w.e.map[i]!, t = this.damaged(m);
    if (t < 0) return 'nothing is broken';
    const W = this.W(i);
    return this.begin(i, { kind: 'repair', m, tx: t % W, ty: (t / W) | 0, work: 0 });
  }

  /** Dress someone's wounds (they get back 35 health). */
  heal(i: number, who: number): true | string {
    const e = this.w.e, j = e.slot(who);
    if (j < 0 || e.map[j] !== e.map[i]) return 'they are not here';
    if (j === i) return 'I cannot treat myself';
    if (e.hp[j]! >= this.w.sc.agents.hp - 2) return 'they are not hurt';
    return this.begin(i, { kind: 'heal', m: e.map[i]!, tx: Math.floor(e.x[j]!), ty: Math.floor(e.y[j]!), work: 0, who });
  }

  private W(i: number): number { return this.w.maps[this.w.e.map[i]!]!.tiles.w; }

  private begin(i: number, j: Job): true | string {
    const w = this.w, e = w.e, t = w.maps[j.m]!.tiles;
    const rn = JOB_RULE[j.kind] ?? j.kind, rule = w.rules.forbidden(i, rn, j.kind === 'heal' ? e.slot(j.who!) : -1);
    if (rule) return `I must not: "${rule}"`;
    // Where to stand: next to the tile (a tree is solid); for a hut, outside the door.
    let sx = j.tx + 0.5, sy = j.ty + 0.5;
    if (j.kind === 'pick') { const it = e.slot(j.who!); if (it < 0) return 'it is gone'; sx = e.x[it]!; sy = e.y[it]!; }
    else if (j.kind === 'loot') { /* stand on the floor tile itself */ }
    else if (j.kind !== 'hut') {
      let bd = Infinity;
      for (const [dx, dy] of [[0, 1], [1, 0], [-1, 0], [0, -1], [1, 1], [-1, 1], [1, -1], [-1, -1]] as const) {
        const xx = j.tx + dx, yy = j.ty + dy;
        if (!t.inside(xx, yy) || t.cost[t.get(xx, yy)]! <= 0) continue;
        const d = Math.hypot(xx + 0.5 - e.x[i]!, yy + 0.5 - e.y[i]!);
        if (d < bd) { bd = d; sx = xx + 0.5 - dx * 0.25; sy = yy + 0.5 - dy * 0.25; }
      }
      if (bd === Infinity) return 'I cannot get to it';
    }
    const act = j.kind === 'chop' || j.kind === 'dig' || j.kind === 'pick' || j.kind === 'loot' || j.kind === 'take' ? Act.Gather : Act.Build;
    if (!w.brain.job(i, sx, sy, j.tx + 0.5, j.ty + 0.5, act)) return 'I cannot get there';
    this.jobs.set(e.id(i), j);
    this.ended.delete(e.id(i));
    return true;
  }

  private done(id: number, r: true | string): void {
    this.jobs.delete(id);
    this.ended.set(id, r);
    const i = this.w.e.slot(id);
    if (i >= 0) this.w.brain.order(i, 'stop', -1, -1, 0);
  }

  /** Every 20 ticks: the work goes on, fires burn; once an game hour: regrowth and people's own plans. */
  update(): void {
    const w = this.w, e = w.e;
    if (this.lastTick < 0) this.init();
    const dg = (w.tick - this.lastTick) * w.dt * w.opt.clockScale;
    this.lastTick = w.tick;
    for (const [id, j] of this.jobs) {
      const i = e.slot(id);
      if (i < 0 || e.map[i] !== j.m) { this.jobs.delete(id); continue; }
      const o = w.brain.orderOf(i);
      if (o.kind !== 'job') { this.done(id, j.why ?? 'I had to stop'); continue; }
      if (!w.brain.atJob(i)) continue;
      j.work += dg;
      if (j.work < WORK[j.kind]) continue;
      j.work = 0;
      const r = this.step(i, j);
      if (r !== false) this.done(id, r);
    }
    // Fires burn down.
    for (const [k, until] of this.fires) {
      if (until > w.gameSec) continue;
      const [m, t] = k.split(':').map(Number) as [number, number];
      const tm = w.maps[m]!.tiles;
      this.fires.delete(k);
      if (tm.tiles[t] === this.T.campfire) { tm.set(t % tm.w, (t / tm.w) | 0, this.T.ashes); w.emit('fireout', { map: w.maps[m]!.def.id, tx: t % tm.w, ty: (t / tm.w) | 0 }); }
    }
    // Fields: berries grow around them every 12 game hours.
    for (const [key, at] of this.farms) {
      if (at > w.gameSec) continue;
      const [m, t] = key.split(':').map(Number) as [number, number];
      const tm = w.maps[m]!.tiles;
      if (tm.tiles[t] !== this.T.farm) { this.farms.delete(key); continue; }
      this.farms.set(key, w.gameSec + 12 * HOUR);
      const berry = w.brain.life.items.find((x) => /berr/.test(x.name))?.id ?? w.brain.life.items[0]?.id ?? 1;
      for (let n = 0; n < 2; n++) {
        const x = (t % tm.w) + 0.5 + w.rng.range(-1.2, 1.2), y = ((t / tm.w) | 0) + 0.5 + w.rng.range(-1.2, 1.2);
        if (tm.isSolidAt(x, y)) continue;
        const it = e.create(Kind.Item, m, x, y, 0.2);
        if (it >= 0) e.sub[it] = berry;
      }
      w.emit('harvest', { map: w.maps[m]!.def.id, tx: t % tm.w, ty: (t / tm.w) | 0 });
    }
    if (w.gameSec >= this.nextHour) {
      const first = this.nextHour === 0;
      this.nextHour = w.gameSec + HOUR;
      if (!first) { this.regrow(); this.ownPlans(); }
    }
  }

  /** One unit of work done. false = more to do, true = finished, a string = failed. */
  private step(i: number, j: Job): boolean | true | string {
    const w = this.w, e = w.e, tm = w.maps[j.m]!.tiles, k = j.ty * tm.w + j.tx;
    const id = e.id(i), mapId = w.maps[j.m]!.def.id;
    switch (j.kind) {
      case 'chop': {
        if (tm.tiles[k] !== this.T.tree) return 'someone else cut that tree';
        tm.damage(j.tx, j.ty, 20);
        const n = (this.inv(i).axe ?? 0) > 0 ? 2 : 1;
        this.add(i, 'wood', n);
        w.emit('gather', { id, what: 'wood', n, map: mapId });
        return true;
      }
      case 'dig': {
        if (tm.tiles[k] !== this.T.rubble) return 'that rubble is gone';
        tm.damage(j.tx, j.ty, 10);
        this.add(i, 'stone', 1);
        const scrap = w.rng.chance(0.35);
        if (scrap) this.add(i, 'scrap', 1);
        w.emit('gather', { id, what: scrap ? 'stone+scrap' : 'stone', n: 1, map: mapId });
        return true;
      }
      case 'fire': {
        if (!this.buildable.has(tm.tiles[k]!) || this.occupied(j.m, j.tx, j.ty)) return 'the ground there is taken';
        if (!this.has(i, RECIPES.campfire!)) return 'I lost my materials';
        this.use(i, RECIPES.campfire!);
        tm.set(j.tx, j.ty, this.T.campfire);
        this.fires.set(`${j.m}:${k}`, w.gameSec + FIRE_START);
        this.setCamp(j.m, j.tx + 0.5, j.ty + 0.5);
        w.emit('build', { id, what: 'campfire', map: mapId, tx: j.tx, ty: j.ty });
        return true;
      }
      case 'tend': {
        const key = `${j.m}:${k}`;
        if (!this.fires.has(key)) return 'the fire went out';
        if ((this.inv(i).wood ?? 0) < 1) return 'I have no wood';
        this.add(i, 'wood', -1);
        this.fires.set(key, Math.min(w.gameSec + 24 * HOUR, this.fires.get(key)! + FIRE_ADD));
        w.emit('tend', { id, map: mapId });
        return true;
      }
      case 'pick': {
        const it = e.slot(j.who!);
        if (it < 0 || e.kind[it] !== Kind.Item) return 'someone took it first';
        if (Math.hypot(e.x[it]! - e.x[i]!, e.y[it]! - e.y[i]!) > 1.8) return 'it was too far';
        w.remove(it, 'taken');
        e.carry[i] = Math.min(5, e.carry[i]! + 1);
        w.emit('pickup', { id, item: 'food', keep: true });
        return true;
      }
      case 'store': case 'take': {
        const st = this.stash[j.m];
        if (!st || tm.tiles[st.t] !== this.T.crate) { this.stash[j.m] = null; return 'the store is gone'; }
        const what = j.what as StashKey;
        if (j.kind === 'store') {
          const n = what === 'food' ? e.carry[i]! : this.inv(i)[what as Res] ?? 0;
          if (n <= 0) return `I have no ${what}`;
          if (what === 'food') e.carry[i] = 0; else this.add(i, what as Res, -n);
          st[what] += n;
          w.emit('store', { id, what, n, total: st[what], map: mapId });
          return true;
        }
        const room = what === 'food' ? 5 - e.carry[i]! : CAP - (this.inv(i)[what as Res] ?? 0);
        const n = Math.min(j.n ?? 1, st[what], room);
        if (n <= 0) return st[what] <= 0 ? `there is no ${what} left in the store` : 'my hands are full';
        st[what] -= n;
        if (what === 'food') e.carry[i]! += n; else this.add(i, what as Res, n);
        w.emit('take', { id, what, n, left: st[what], map: mapId });
        return true;
      }
      case 'loot': {
        this.looted.set(`${j.m}:${k}`, w.gameSec);
        const r = w.rng.next();
        let got = 'nothing';
        if (r < 0.35) { e.carry[i] = Math.min(5, e.carry[i]! + 1); got = 'canned food'; }
        else if (r < 0.65) { this.add(i, 'scrap', 1); got = 'scrap'; }
        else if (r < 0.8) { this.add(i, 'stone', 1); got = 'stone'; }
        else if (r < 0.85 && !(this.inv(i).spear ?? 0)) { this.add(i, 'spear', 1); got = 'an old spear'; }
        w.emit('loot', { id, got, map: mapId });
        return true;
      }
      case 'plant': {
        if (!this.buildable.has(tm.tiles[k]!) || this.occupied(j.m, j.tx, j.ty)) return 'the ground there is taken';
        tm.set(j.tx, j.ty, this.T.farm);
        this.farms.set(`${j.m}:${k}`, w.gameSec + 12 * HOUR);
        this.setCamp(j.m, j.tx + 0.5, j.ty + 0.5);
        w.emit('build', { id, what: 'field', map: mapId, tx: j.tx, ty: j.ty });
        return true;
      }
      case 'repair': {
        if ((this.inv(i).wood ?? 0) < 1) return 'I have no wood';
        if (tm.tiles[k] === this.T.woodwall) tm.hp[k] = tm.maxHp[this.T.woodwall]!;
        else if (this.occupied(j.m, j.tx, j.ty)) return 'someone is in the way';
        else tm.set(j.tx, j.ty, this.T.woodwall);
        this.add(i, 'wood', -1);
        w.emit('repair', { id, map: mapId, tx: j.tx, ty: j.ty });
        return true;
      }
      case 'heal': {
        const t = e.slot(j.who!);
        if (t < 0) return 'they are gone';
        if (Math.hypot(e.x[t]! - e.x[i]!, e.y[t]! - e.y[i]!) > 3) return 'they walked away';
        e.hp[t] = Math.min(w.sc.agents.hp, e.hp[t]! + 35);
        w.emit('heal', { id, who: j.who, hp: Math.round(e.hp[t]!) });
        return true;
      }
      case 'hut': {
        if (!j.tiles!.length) return true;
        if (!j.tries) { // the first piece: pay for the whole hut
          if (!this.has(i, RECIPES.hut!)) return 'I lost my materials';
          this.use(i, RECIPES.hut!);
        }
        j.tries = (j.tries ?? 0) + 1;
        // Place up to 2 tiles per unit of work; a wall tile with someone on it waits (at most 30 tries in all).
        for (let n = 0; n < 2 && j.tiles!.length; n++) {
          const t = j.tiles![0]!, type = j.tiles![1]!, tx = t % tm.w, ty = (t / tm.w) | 0;
          if (type === this.T.woodwall && this.occupied(j.m, tx, ty) && j.tries < 30) { j.tiles!.push(j.tiles!.shift()!, j.tiles!.shift()!); continue; }
          j.tiles!.splice(0, 2);
          if (tm.tiles[t] !== this.T.water) tm.set(tx, ty, type);
          if (type === this.T.floor) w.brain.addShelter(j.m, t);
        }
        if (j.tiles!.length) return false;
        this.huts[j.m]!.push(j.ty * tm.w + j.tx);
        this.setCamp(j.m, j.tx + 0.5, j.ty + 1.5);
        w.emit('build', { id, what: 'hut', map: mapId, tx: j.tx, ty: j.ty - 3 });
        return true;
      }
    }
    return 'nothing to do';
  }

  // ------------------------------------------------------------------ where
  /** Someone (or something) is standing on that tile. */
  private occupied(m: number, tx: number, ty: number): boolean {
    const e = this.w.e;
    for (let j = 0; j < e.hi; j++) {
      if (e.map[j] !== m || (e.kind[j] !== Kind.Agent && e.kind[j] !== Kind.Player)) continue;
      if (Math.abs(e.x[j]! - tx - 0.5) < 0.9 && Math.abs(e.y[j]! - ty - 0.5) < 0.9) return true;
    }
    return false;
  }

  /** A clear area w x h (top-left tile index) near (x, y) within r metres: buildable ground, a free ring around it, no water or portal near. -1 = none. */
  site(m: number, x: number, y: number, sw: number, sh: number, r: number): number {
    const w = this.w, tm = w.maps[m]!.tiles, rng = w.rng;
    const fits = (x0: number, y0: number): boolean => {
      for (let yy = y0 - 1; yy <= y0 + sh + (sw > 1 ? 1 : 0); yy++) for (let xx = x0 - 1; xx <= x0 + sw; xx++) {
        if (!tm.inside(xx, yy)) return false;
        const t = tm.get(xx, yy), inside = xx >= x0 && yy >= y0 && xx < x0 + sw && yy < y0 + sh;
        if (inside ? !this.buildable.has(t) : tm.cost[t]! <= 0 || t === this.T.campfire) return false;
      }
      for (const p of w.portals) if (p.from === m && Math.hypot(p.x - x0, p.y - y0) < 8) return false;
      if (sw === 1) for (const k of this.fires.keys()) { const [fm, ft] = k.split(':').map(Number) as [number, number]; if (fm === m && Math.hypot((ft % tm.w) - x0, ((ft / tm.w) | 0) - y0) < 6) return false; }
      for (let yy = y0; yy < y0 + sh; yy++) for (let xx = x0; xx < x0 + sw; xx++) if (this.occupied(m, xx, yy)) return false;
      return true;
    };
    for (let k = 0; k < 160; k++) {
      const d = 2 + (k / 160) * r, a = rng.next() * Math.PI * 2;
      const x0 = Math.floor(x + Math.cos(a) * d - sw / 2), y0 = Math.floor(y + Math.sin(a) * d - sh / 2);
      if (fits(x0, y0)) return y0 * tm.w + x0;
    }
    return -1;
  }

  private nearestTile(i: number, type: number, r: number): number {
    const e = this.w.e, tm = this.w.maps[e.map[i]!]!.tiles;
    const cx = Math.floor(e.x[i]!), cy = Math.floor(e.y[i]!);
    let best = -1, bd = r * r;
    for (let yy = Math.max(0, cy - r); yy <= Math.min(tm.h - 1, cy + r); yy++) for (let xx = Math.max(0, cx - r); xx <= Math.min(tm.w - 1, cx + r); xx++) {
      if (tm.tiles[yy * tm.w + xx] !== type) continue;
      const d = (xx - cx) ** 2 + (yy - cy) ** 2 + ((xx * 31 + yy * 17) % 7); // a little spread so not everyone picks the same tree
      if (d < bd) { bd = d; best = yy * tm.w + xx; }
    }
    return best;
  }

  /** The nearest burning fire's tile index within r metres of person i (-1 = none). */
  nearestFire(i: number, r: number): number {
    const e = this.w.e;
    return this.fireNear(e.map[i]!, e.x[i]!, e.y[i]!, r);
  }
  fireNear(m: number, x: number, y: number, r: number): number {
    const tm = this.w.maps[m]!.tiles;
    let best = -1, bd = r;
    for (const k of this.fires.keys()) {
      const c = k.indexOf(':');
      if (Number(k.slice(0, c)) !== m) continue;
      const t = Number(k.slice(c + 1)), d = Math.hypot((t % tm.w) + 0.5 - x, ((t / tm.w) | 0) + 0.5 - y);
      if (d < bd) { bd = d; best = t; }
    }
    return best;
  }
  /** Sleeping by a fire is warmer (the brain recovers faster). */
  warm(m: number, x: number, y: number): boolean { return this.fires.size > 0 && this.fireNear(m, x, y, FIRE_WARM) >= 0; }
  /** Hours of fuel left in a fire (0 = none). */
  fuel(m: number, t: number): number { const u = this.fires.get(`${m}:${t}`); return u ? Math.max(0, (u - this.w.gameSec) / HOUR) : 0; }

  // ------------------------------------------------------------------ hourly
  /** Trees grow back where they were cut (a stump left as dirt where the map had a tree). */
  private regrow(): void {
    const w = this.w;
    if (this.T.tree < 0) return;
    for (let mi = 0; mi < w.maps.length; mi++) {
      const tm = w.maps[mi]!.tiles;
      if (!tm.base) continue;
      for (let k = 0; k < 400; k++) {
        const t = w.rng.int(tm.tiles.length);
        if (tm.base[t] !== this.T.tree || tm.tiles[t] !== this.T.dirt) continue;
        if (w.rng.chance(0.15) && !this.occupied(mi, t % tm.w, (t / tm.w) | 0)) tm.set(t % tm.w, (t / tm.w) | 0, this.T.tree);
      }
    }
  }

  /**
   * People prepare on their own (no AI needed; the AI's plans and commands come on top): in the evening someone lights
   * a fire where the group is if none burns there, someone with wood feeds a fire that is low, by day the group builds
   * huts until there is a roof for about every two people, and the others make an axe or gather a wood pile.
   */
  private ownPlans(): void {
    const w = this.w, e = w.e, hour = w.brain.hour();
    if (!this.enabled) return;
    for (let mi = 0; mi < w.maps.length; mi++) {
      const free: number[] = [];
      let n = 0, sx = 0, sy = 0, building = false;
      for (let i = 0; i < e.hi; i++) {
        if (e.kind[i] !== Kind.Agent || e.map[i] !== mi || e.map[i] === NO_MAP) continue;
        n++; sx += e.x[i]!; sy += e.y[i]!;
        const p = w.profileOf(i);
        if (p?.mind?.task) { if (/hut|shelter|fire/.test(p.mind.task.text)) building = true; continue; }
        if (this.jobs.has(e.id(i)) || w.brain.orderOf(i).kind) continue;
        if (e.flags[i]! & 32 /* child */) continue;
        if (e.hunger[i]! > 60 || e.thirst[i]! > 60 || e.tired[i]! > 75 || e.act[i] === Act.Sleep) continue;
        free.push(i);
      }
      if (!n || !free.length) continue;
      const pick = () => free.splice(w.rng.int(free.length), 1)[0]!;
      const take = (pred: (i: number) => boolean) => { const k = free.findIndex(pred); return k >= 0 ? free.splice(k, 1)[0]! : -1; };
      // Care first: a hungry child gets food from a parent (or anyone free); the wounded get their wounds dressed.
      for (let c = 0; c < e.hi && free.length; c++) {
        if (e.kind[c] !== Kind.Agent || e.map[c] !== mi || !(e.flags[c]! & 32) || e.hunger[c]! < 45 || e.carry[c]! > 0) continue;
        const parents = w.profileOf(c)?.parents ?? [];
        let i = take((x) => parents.includes(e.id(x)));
        if (i < 0) i = pick();
        w.tasks.start(i, `feed ${w.profileOf(c)?.name ?? 'the child'}`, 'myself', [{ do: 'bring', who: e.id(c) }]);
      }
      for (let h = 0; h < e.hi && free.length; h++) {
        if (e.kind[h] !== Kind.Agent || e.map[h] !== mi || e.hp[h]! >= 60) continue;
        const i = take((x) => x !== h);
        if (i >= 0) w.tasks.start(i, `treat ${w.profileOf(h)?.name ?? 'the wounded'}`, 'myself', [{ do: 'heal', who: e.id(h) }]);
      }
      if (!free.length || building) continue;
      const camp = this.camp[mi], cx = camp?.x ?? sx / n, cy = camp?.y ?? sy / n;
      const evening = hour >= 16 && hour < 23;
      const fire = this.fireNear(mi, cx, cy, camp ? 15 : 30);
      if (evening && fire < 0) { w.tasks.start(pick(), 'make a campfire for the night', 'myself', [{ do: 'build', what: 'campfire' }]); continue; }
      if (fire >= 0 && this.fuel(mi, fire) < 3 && free.length) {
        const k = free.findIndex((i) => (this.inv(i).wood ?? 0) > 0);
        const i = k >= 0 ? free.splice(k, 1)[0]! : pick();
        w.tasks.start(i, 'keep the fire going', 'myself', [{ do: 'tend' }]);
      }
      if (!free.length || hour < 7 || hour >= 18) continue;
      if (this.huts[mi]!.length < Math.ceil(n / 2) && w.rng.chance(0.6)) { w.tasks.start(pick(), 'build a hut to sleep in', 'myself', [{ do: 'build', what: 'hut' }]); continue; }
      if (!free.length) continue;
      // Walls zombies broke are mended; a store of food for bad days; a field near the camp; ruins searched; spears.
      if (camp && this.damaged(mi) >= 0) { w.tasks.start(pick(), 'repair the huts', 'myself', [{ do: 'repair' }]); if (!free.length) continue; }
      const carrier = take((x) => e.carry[x]! >= 3);
      if (carrier >= 0 && camp) { w.tasks.start(carrier, 'put food in the store', 'myself', [{ do: 'store', what: 'food' }]); if (!free.length) continue; }
      const st = this.stash[mi];
      if (camp && (st?.food ?? 0) < n * 2 && w.rng.chance(0.5)) { w.tasks.start(pick(), 'collect food and store it', 'myself', [{ do: 'collect', what: 'food', times: 3 }, { do: 'store', what: 'food' }]); if (!free.length) continue; }
      const fields = [...this.farms.keys()].filter((k) => k.startsWith(mi + ':')).length;
      if (camp && fields < Math.ceil(n / 2) && w.rng.chance(0.35)) { w.tasks.start(pick(), 'plant a field', 'myself', [{ do: 'farm' }]); if (!free.length) continue; }
      const i = pick();
      if (!(this.inv(i).spear ?? 0) && (this.inv(i).scrap ?? 0) >= 1 && w.zombies.perNight > 0 && w.rng.chance(0.5)) w.tasks.start(i, 'make a spear', 'myself', [{ do: 'craft', what: 'spear' }]);
      else if (w.rng.chance(0.2)) w.tasks.start(i, 'search the ruins', 'myself', [{ do: 'loot', times: 2 }]);
      else if (!(this.inv(i).axe ?? 0) && w.rng.chance(0.5)) w.tasks.start(i, 'make an axe', 'myself', [{ do: 'craft', what: 'axe' }]);
      else if ((this.inv(i).wood ?? 0) < 6 && w.rng.chance(0.4)) w.tasks.start(i, 'gather firewood', 'myself', [{ do: 'gather', what: 'wood', times: 4 }]);
    }
  }
}
