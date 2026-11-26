import { Act, Kind, HUT_NEED, RECIPES_ALL, RESOURCES, PLACEABLE, MEDKIT_HEAL, matchRecipe, type Recipe } from '@worldsim/protocol';
import { NO_MAP } from './entities.js';
import { ageOf, levelOf } from './people.js';
import type { World } from './world.js';
import { flood, hutAt, walkableNear } from './structures.js';
import { Homes } from './homes.js';

/**
 * Milestone 8, part 2: living off the land. People carry materials (wood, stone, scrap) and tools (axe, spear) in
 * `Profile.inv`; they chop trees, search rubble, make tools, light campfires and build huts, all on the real map
 * (tiles change, so the viewers and the path finder see it). Work is a "job": walk to a spot, then work there for
 * some game time (`Brain.job`). Fires burn fuel and go out (ashes) unless someone adds wood. Cut trees grow back.
 * Commands use these as task skills (gather / craft / build / tend in sim/tasks.ts), and people also decide on
 * their own once an hour: a fire for the evening, a hut when there are not enough roofs, an axe, a wood pile.
 */
export const RES = RESOURCES;
export type Res = (typeof RES)[number];
/** Materials, tools, weapons, clothes and things to put down, by name. */
export type Inv = Partial<Record<string, number>>;
export const CAP = 20;
/** Things made from a recipe (crafting, shared with the viewer: @worldsim/protocol craft.ts) plus the hut. */
export const RECIPES: Record<string, Inv> = { hut: { ...HUT_NEED } };
for (const r of RECIPES_ALL) RECIPES[r.what] ??= r.need;
/** Kept in the inventory (not put down): weapons, arrows and clothes. */
const KEEP = new Set(['sword', 'axe', 'spear', 'bow', 'arrows', 'clothes', 'armor', 'helmet']);
/** Game seconds of work. */
const WORK = { wreck: 90, chop: 120, dig: 100, mine: 240, place: 40, fire: 240, hut: 50, tend: 45, pick: 20, store: 40, take: 30, loot: 150, plant: 180, repair: 60, heal: 120, guard: 300 } as const;
/** What a storage crate keeps. */
export type StashKey = 'food' | Res;
export interface Stash { t: number; food: number; wood: number; stone: number; scrap: number; [k: string]: number }
const HOUR = 3600;
/** A rock (90 hp) takes 6 blows; each gives stone 60 % of the time and ore 10 %. */
const ROCK_HIT = 15;
export const ORE_CHANCE = 0.1, ROCK_STONE = 0.6;
/** Rocks a map keeps at most (regrowth stops there): rare. */
const ROCKS_WILD = 60, ROCKS_TOWN = 12;
/** Herb patches a map keeps (they grow back where picked out). */
const HERBS_WILD = 45, HERBS_TOWN = 14;
const FIRE_START = 10 * HOUR, FIRE_ADD = 4 * HOUR, FIRE_WARM = 6;

type JobKind = keyof typeof WORK;
interface Job { kind: JobKind; m: number; tx: number; ty: number; work: number; dir?: number; tiles?: number[]; tries?: number; why?: string; who?: number; what?: string; n?: number }
const LAMP_R = 3.5, BED_R = 1.3;
/** How far a player can aim a build (metres). */
export const PLACE_REACH = 8;
/** Door directions (outwards): south, east, north, west. */
const DIRS = [[0, 1], [1, 0], [0, -1], [-1, 0]] as const;

/** Job kinds under the names the owner's rules use (sim/rules.ts). */
const JOB_RULE: Record<string, string> = { wreck: 'build', chop: 'gather', dig: 'gather', mine: 'gather', fire: 'build', hut: 'build', place: 'build', pick: 'collect', plant: 'farm' };

export class Survival {
  private readonly jobs = new Map<number, Job>();
  /** Burning fires: `${map}:${tile index}` -> game second the fuel runs out. */
  readonly fires = new Map<string, number>();
  /** Huts (door tile index) per map, for the "enough roofs?" rule. */
  readonly huts: number[][];
  /** Which way each hut's door faces (0 south, 1 east, 2 north, 3 west; old huts: south). */
  readonly hutDir: number[][];
  /** The camp wall's circle once its first piece went up (it no longer moves): centre and radius in tiles. */
  private readonly walls: ({ x: number; y: number; r: number } | null)[];
  private readonly legacy = new Set<number>();
  /** Each map's camp: where the first fire or hut went up; later fires and huts go near it, people sleep there. */
  readonly camp: ({ x: number; y: number } | null)[];
  /** Each map's leader (entity id, -1 = none): chosen every hour by courage, mind, kindness, strength and level (imad 2026-11-20: "social life and leaders"). */
  readonly leader: number[] = [];
  private toldAt: number[] = [];
  readonly T: { tree: number; rubble: number; campfire: number; ashes: number; woodwall: number; floor: number; dirt: number; grass: number; water: number; crate: number; farm: number; rock: number; lamp: number; bed: number; door: number; doorOpen: number; herbs: number };
  /** Tile id of each thing that is put down (palisade, door, bed...). */
  readonly placeTile = new Map<string, number>();
  /** Players' things, by player name (agents keep theirs in Profile.inv). */
  readonly pinv = new Map<string, Inv>();
  /** The player's name of a character slot (set by the app). */
  playerName: (i: number) => string = () => '';
  /** Each map's storage crate (made at the camp the first time someone stores something). */
  readonly stash: (Stash | null)[];
  /** Planted fields: `${map}:${tile}` -> game second of the next harvest (berries appear around it). */
  readonly farms = new Map<string, number>();
  /** Ruin floors searched: `${map}:${tile}` -> game second (searched again after 2 days). */
  private readonly looted = new Map<string, number>();
  private readonly buildable = new Set<number>();
  private lastTick = -1;
  private nextHour = 0;
  private nextQuarter = 0;
  /** A job ended: ok, or why not (for tasks). */
  readonly ended = new Map<number, true | string>();
  /** Who owns each hut; its door opens only for them and their family (sim/homes.ts). */
  readonly homes: Homes;
  /** Each map's steady level of trees and rocks (counted once): regrowth brings them back to it. */
  readonly resTarget: ({ tree: number; rock: number } | null)[];
  /** Who put each piece up (`${map}:${tile}` -> entity id): only they may pull it down, or anyone once they are dead. Huts: sim/homes.ts. */
  readonly owners = new Map<string, number>();

  constructor(private w: World) {
    const id = (n: string) => w.sc.tiles.find((t) => t.name === n)?.id ?? -1;
    this.T = { tree: id('tree'), rubble: id('rubble'), campfire: id('campfire'), ashes: id('ashes'), woodwall: id('woodwall'), floor: id('floor'), dirt: id('dirt'), grass: id('grass'), water: id('water'), crate: id('crate'), farm: id('farm'), rock: id('rock'), lamp: id('lamp'), bed: id('bed'), door: id('door'), doorOpen: id('dooropen'), herbs: id('herbs') };
    for (const n of PLACEABLE) if (id(n) >= 0) this.placeTile.set(n, id(n));
    for (const n of ['grass', 'dirt', 'sand', 'ashes']) if (id(n) >= 0) this.buildable.add(id(n));
    this.huts = w.maps.map(() => []);
    this.hutDir = w.maps.map(() => []);
    this.walls = w.maps.map(() => null);
    this.camp = w.maps.map(() => null);
    this.stash = w.maps.map(() => null);
    this.homes = new Homes(w);
    this.resTarget = w.maps.map(() => null);
  }

  /** What snapshots keep (fires, camps, crates, fields, huts). */
  save(): unknown {
    return { colony: this.w.colony.save(), fires: [...this.fires], camp: this.camp, stash: this.stash, farms: [...this.farms], looted: [...this.looted], huts: this.huts, hutDir: this.hutDir, walls: this.walls, pinv: [...this.pinv], homes: this.homes.save(), res: this.resTarget, own: [...this.owners] };
  }
  load(d: unknown): void {
    const v = d as { pinv?: [string, Inv][]; fires?: [string, number][]; camp?: ({ x: number; y: number } | null)[]; stash?: (Stash | null)[]; farms?: [string, number][]; looted?: [string, number][]; huts?: number[][] } | undefined;
    if (!v) return;
    this.init();
    this.fires.clear(); for (const [k, t] of v.fires ?? []) this.fires.set(k, t);
    this.farms.clear(); for (const [k, t] of v.farms ?? []) this.farms.set(k, t);
    this.looted.clear(); for (const [k, t] of v.looted ?? []) this.looted.set(k, t);
    v.camp?.forEach((c, m) => { if (m < this.camp.length && c) this.camp[m] = c; });
    v.stash?.forEach((c, m) => { if (m < this.stash.length) this.stash[m] = c; });
    v.huts?.forEach((h, m) => { if (m < this.huts.length) this.huts[m] = h; });
    const vv = v as { hutDir?: number[][]; walls?: ({ x: number; y: number; r: number } | null)[] };
    this.huts.forEach((h, m) => { this.hutDir[m] = h.map((_, k) => vv.hutDir?.[m]?.[k] ?? 0); });
    vv.walls?.forEach((c, m) => { if (m < this.walls.length) this.walls[m] = c; });
    this.pinv.clear(); for (const [k, x] of v.pinv ?? []) this.pinv.set(k, x);
    this.w.colony.load((v as { colony?: unknown }).colony);
    this.homes.load((v as { homes?: unknown }).homes);
    const rt = (v as { res?: ({ tree: number; rock: number } | null)[] }).res;
    rt?.forEach((r, m) => { if (m < this.resTarget.length) this.resTarget[m] = r; });
    this.owners.clear(); for (const [k, id] of (v as { own?: [string, number][] }).own ?? []) this.owners.set(k, id);
  }
  campOf(m: number): { x: number; y: number } | null { return this.camp[m] ?? null; }
  /** The circle the camp's wall follows (centre, radius in tiles), or null with no camp. */
  perimeter(m: number): { x: number; y: number; r: number } | null {
    const c = this.camp[m];
    if (!c) return null;
    if (!this.w.ai.siting) return { x: Math.floor(c.x), y: Math.floor(c.y), r: 9 };
    if (!this.walls[m] && !this.legacy.has(m)) { // a world from before: a wall already started on the old 9-tile ring keeps it
      this.legacy.add(m);
      const tm = this.w.maps[m]!.tiles, pal = this.placeTile.get('palisade'), sw = this.placeTile.get('stonewall'), cx = Math.floor(c.x), cy = Math.floor(c.y);
      let up = 0;
      for (let a = 0; a < 360; a += 3) { const r = (a * Math.PI) / 180, x = Math.round(cx + Math.cos(r) * 9), y = Math.round(cy + Math.sin(r) * 9); if (tm.inside(x, y) && (tm.get(x, y) === pal || tm.get(x, y) === sw)) up++; }
      if (up >= 3) this.walls[m] = { x: cx, y: cy, r: 9 };
    }
    return this.walls[m] ?? { x: Math.floor(c.x), y: Math.floor(c.y), r: this.plannedRadius(m) };
  }
  /**
   * How big the wall must be to hold the village it protects (siting): room for a hut (with the space in front of its door)
   * per two people, two to grow, the fire and the store; never smaller than the old 9 tiles, and wider when something
   * already stands further out. Capped at 16 so the wall stays a job a small camp can finish.
   */
  private plannedRadius(m: number): number {
    const w = this.w, e = w.e, c = this.camp[m]!, tm = w.maps[m]!.tiles;
    let n = 0;
    for (let i = 0; i < e.hi; i++) if ((e.kind[i] === Kind.Agent || e.kind[i] === Kind.Player) && e.map[i] === m) n++;
    const roofs = Math.max(this.huts[m]!.length, Math.ceil((n + 2) / 2));
    let r = Math.sqrt((roofs * 56 + 60) / Math.PI) + 2.5;
    for (const out of this.huts[m]!) {
      const h = this.hutRect(m, out, this.hutDir[m]![this.huts[m]!.indexOf(out)] ?? 0);
      if (!h) continue;
      for (const [x, y] of [[h.x0, h.y0], [h.x0 + 5, h.y0], [h.x0, h.y0 + 5], [h.x0 + 5, h.y0 + 5]] as const) {
        const d = Math.hypot(x - c.x, y - c.y);
        if (d < 22) r = Math.max(r, d + 2);
      }
    }
    void tm;
    return Math.min(20, Math.max(9, Math.ceil(r)));
  }
  /** Fix the wall's circle (the first piece is going up). */
  private freezeWall(m: number): void { if (this.w.ai.siting && !this.walls[m]) { const p = this.perimeter(m); if (p) this.walls[m] = p; } }
  /** The tiles of the wall ring at radius R (the 4 ways in left out), in building order. */
  private ring(m: number, R: number): number[] {
    const p = this.perimeter(m)!, tm = this.w.maps[m]!.tiles, out: number[] = [], seen = new Set<number>();
    const step = Math.min(3, (0.6 / R) * (180 / Math.PI));
    for (let a = 0; a < 360; a += step) {
      const rr = (a * Math.PI) / 180, x = Math.round(p.x + Math.cos(rr) * R), y = Math.round(p.y + Math.sin(rr) * R);
      if (Math.abs(x - p.x) <= 1 || Math.abs(y - p.y) <= 1 || !tm.inside(x, y)) continue;
      const k = y * tm.w + x;
      if (!seen.has(k)) { seen.add(k); out.push(k); }
    }
    return out;
  }
  /** A hut's 5 x 5 square from the tile in front of its door and the way the door faces. */
  hutRect(m: number, out: number, dir: number): { x0: number; y0: number; door: number; inside: number; dx: number; dy: number } | null {
    if (out < 0) return null;
    const W = this.w.maps[m]!.tiles.w, [dx, dy] = DIRS[dir] ?? DIRS[0]!;
    const ox = out % W, oy = (out / W) | 0, cx = ox - dx * 3, cy = oy - dy * 3;
    return { x0: cx - 2, y0: cy - 2, door: (oy - dy) * W + ox - dx, inside: (oy - dy * 2) * W + ox - dx * 2, dx, dy };
  }
  private setCamp(m: number, x: number, y: number): void { if (!this.camp[m]) { this.camp[m] = { x, y }; this.w.emit('camp', { map: this.w.maps[m]!.def.id, x, y }); } }

  get enabled(): boolean { return this.T.campfire >= 0 && this.T.woodwall >= 0; }

  /** After loading (or a new world): fires found on the maps burn 4 more hours; huts are counted from their walls. */
  init(): void {
    const w = this.w;
    this.fires.clear();
    this.lastTick = w.tick;
    for (let mi = 0; mi < w.maps.length; mi++) { // herbs there from the start (old worlds too); a restored world already has them (same dice)
      const tm = w.maps[mi]!.tiles;
      if (this.T.herbs >= 0 && !tm.tiles.includes(this.T.herbs)) for (let k = 0; k < 10; k++) this.regrowHerbs(mi);
    }
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
      this.hutDir[mi] = this.huts[mi]!.map(() => 0);
    });
    this.homes.sync();
    this.lastTick = w.tick;
  }

  inv(i: number): Inv {
    if (this.w.isChar(i)) {
      const n = this.w.charName(i) || this.playerName(i);
      if (!n) return {};
      let v = this.pinv.get(n);
      if (!v) this.pinv.set(n, (v = {}));
      return v;
    }
    const p = this.w.profileOf(i); if (!p) return {}; return (p.inv ??= {});
  }
  /** Meat goes into the hands (it is food), leather and claws into the bag. */
  gain(i: number, d: Partial<Record<string, number>>): void {
    const e = this.w.e;
    for (const [k, n] of Object.entries(d)) {
      if (!n) continue;
      if (k === 'meat') e.carry[i] = Math.min(5, e.carry[i]! + n);
      else this.add(i, k, n);
    }
  }
  /** What worn clothes take off a bite (0..0.5). */
  defence(i: number): number { return this.w.gear.defence(i); }
  /** The weapon in hand (chosen on the gear screen, else the best carried) and how hard it hits with its level / quality (0 = none). */
  weapon(i: number): [string, number] { return this.w.gear.weapon(i); }
  /** A lamp burns within r metres of (x, y): zombies and wolves keep away. */
  lampNear(m: number, x: number, y: number, r: number): boolean {
    if (this.T.lamp < 0) return false;
    const tm = this.w.maps[m]!.tiles, R = Math.ceil(r);
    const cx = Math.floor(x), cy = Math.floor(y);
    for (let yy = cy - R; yy <= cy + R; yy++) for (let xx = cx - R; xx <= cx + R; xx++) {
      if (tm.inside(xx, yy) && tm.tiles[yy * tm.w + xx] === this.T.lamp && Math.hypot(xx + 0.5 - x, yy + 0.5 - y) <= r) return true;
    }
    return false;
  }
  /** Sleeping on a bed: rest comes twice as fast. */
  onBed(m: number, x: number, y: number): boolean {
    if (this.T.bed < 0) return false;
    const tm = this.w.maps[m]!.tiles, cx = Math.floor(x), cy = Math.floor(y);
    for (let yy = cy - 1; yy <= cy + 1; yy++) for (let xx = cx - 1; xx <= cx + 1; xx++) {
      if (tm.inside(xx, yy) && tm.tiles[yy * tm.w + xx] === this.T.bed && Math.hypot(xx + 0.5 - x, yy + 0.5 - y) <= BED_R) return true;
    }
    return false;
  }

  /** A player's craft: the category and what they put in. The thing made, or why not. */
  craftPut(i: number, cat: string, put: Partial<Record<string, number>>): { ok: true; r: Recipe } | { ok: false; code: string } {
    const r = matchRecipe(cat, put);
    if (!r) return { ok: false, code: 'noRecipe' };
    if (!this.has(i, r.need)) return { ok: false, code: 'noMat' };
    const cap = r.what === 'arrows' ? 30 : CAP;
    if ((this.inv(i)[r.what] ?? 0) >= cap) return { ok: false, code: 'full' };
    this.use(i, r.need);
    const v = this.inv(i); v[r.what] = Math.min(cap, (v[r.what] ?? 0) + (r.n ?? 1));
    this.w.emit('craft', { id: this.w.e.id(i), what: r.what, player: this.w.e.kind[i] === Kind.Player });
    return { ok: true, r };
  }

  /** A player puts a thing down on the tile in front (a door or a window may go into a wall). */
  placeFront(i: number, what: string): string {
    const e = this.w.e, a = e.angle[i]!;
    if (!this.placeTile.has(what)) return 'nothing';
    if ((this.inv(i)[what] ?? 0) < 1) return 'noItem';
    const tx = Math.floor(e.x[i]! + Math.cos(a) * 1.1), ty = Math.floor(e.y[i]! + Math.sin(a) * 1.1);
    const c = this.placeAt(i, what, tx, ty);
    return c === 'someone' || c === 'tooFar' ? 'noRoom' : c;
  }
  private putDown(i: number, m: number, tx: number, ty: number, what: string): void {
    const w = this.w, tm = w.maps[m]!.tiles, tile = this.placeTile.get(what)!;
    this.add(i, what, -1);
    tm.set(tx, ty, tile);
    const k = ty * tm.w + tx;
    if (what === 'campfire') { this.fires.set(`${m}:${k}`, w.gameSec + FIRE_START); this.setCamp(m, tx + 0.5, ty + 0.5); }
    if (what === 'bed') w.brain.addShelter(m, k);
    this.owners.set(`${m}:${k}`, w.e.id(i));
    w.emit('build', { id: w.e.id(i), what, map: w.maps[m]!.def.id, tx, ty });
  }

  /** A player's "use" by a tree, a rock or rubble: one piece of it now. Code, or '' (none in front). */
  playerWork(i: number): { code: string; got?: Record<string, number>; hard?: boolean } | null {
    const w = this.w, e = w.e, m = e.map[i]!, tm = w.maps[m]!.tiles;
    let best = -1, bd = 1.6;
    for (let yy = Math.floor(e.y[i]!) - 2; yy <= Math.floor(e.y[i]!) + 2; yy++) for (let xx = Math.floor(e.x[i]!) - 2; xx <= Math.floor(e.x[i]!) + 2; xx++) {
      if (!tm.inside(xx, yy)) continue;
      const t = tm.get(xx, yy);
      if (t !== this.T.tree && t !== this.T.rock && t !== this.T.rubble && (t !== this.T.herbs || this.T.herbs < 0)) continue;
      const d = Math.hypot(xx + 0.5 - e.x[i]!, yy + 0.5 - e.y[i]!);
      if (d < bd) { bd = d; best = yy * tm.w + xx; }
    }
    if (best < 0) return null;
    const tx = best % tm.w, ty = (best / tm.w) | 0, t = tm.tiles[best]!;
    if (t === this.T.tree && w.land.inRing(m, tx, ty)) return { code: 'tooThick' };
    const got = this.take1(i, m, tx, ty, t);
    return { code: t === this.T.tree ? 'chopped' : t === this.T.herbs ? 'herbs' : 'mined', got, hard: t === this.T.rock };
  }
  /** One piece from a tree / rock / rubble tile (it wears down): what was got. */
  private take1(i: number, m: number, tx: number, ty: number, t: number): Record<string, number> {
    const w = this.w, tm = w.maps[m]!.tiles, got: Record<string, number> = {};
    if (t === this.T.tree) { tm.damage(tx, ty, 20); got.wood = (this.inv(i).axe ?? 0) > 0 ? 2 : 1; }
    else if (t === this.T.herbs) { tm.set(tx, ty, this.T.grass); got.herb = w.rng.chance(0.4) ? 2 : 1; } // a patch of healing herbs: picked clean, grows back elsewhere
    else if (t === this.T.rock) { tm.damage(tx, ty, ROCK_HIT); if (w.rng.chance(ROCK_STONE)) got.stone = 1; if (w.rng.chance(ORE_CHANCE)) got.ore = 1; } // hard and poor (imad 2026-11-25: rocks and ore are rare and hard)
    else { tm.damage(tx, ty, 10); if (w.rng.chance(0.5)) got.brick = 1; else got.stone = 1; if (w.rng.chance(0.3)) got.scrap = 1; }
    for (const [k, n] of Object.entries(got)) this.add(i, k, n);
    w.emit('gather', { id: w.e.id(i), what: Object.keys(got).join('+'), n: 1, map: w.maps[m]!.def.id, tx, ty });
    return got;
  }
  has(i: number, need: Inv): boolean { const v = this.inv(i); return Object.entries(need).every(([k, n]) => (v[k as Res] ?? 0) >= n!); }
  /** What is missing for a recipe: [[res, count], ...]. */
  missing(i: number, what: string): [Res, number][] {
    const v = this.inv(i), out: [Res, number][] = [];
    const lack = (nd: Inv) => Object.entries(nd).reduce((s, [k, n]) => s + Math.max(0, n! - (v[k] ?? 0)), 0);
    let need = RECIPES[what] ?? {};
    for (const r of RECIPES_ALL) if (r.what === what && lack(r.need) < lack(need)) need = r.need;
    for (const [k, n] of Object.entries(need)) if ((v[k as Res] ?? 0) < n!) out.push([k as Res, n! - (v[k as Res] ?? 0)]);
    return out;
  }
  add(i: number, k: string, n: number): void { const v = this.inv(i); v[k] = Math.max(0, Math.min(k === 'arrows' ? 30 : CAP, (v[k] ?? 0) + n)); if (!v[k]) delete v[k]; }
  private use(i: number, need: Inv): void { for (const [k, n] of Object.entries(need)) this.add(i, k, -n!); }

  /** Make a tool now (materials are used up). True or why not. */
  craft(i: number, what: string): true | string {
    const list = RECIPES_ALL.filter((r) => r.what === what);
    if (!list.length) return `I can't make ${what}`;
    const rule = this.w.rules.forbidden(i, 'craft');
    if (rule) return `I must not: "${rule}"`;
    if (KEEP.has(what) && what !== 'arrows' && (this.inv(i)[what] ?? 0) >= 1) return true; // one is enough: already has it
    const r = list.find((x) => this.has(i, x.need));
    if (!r) return `I need ${this.missing(i, what).map(([k, n]) => `${n} ${k}`).join(' and ')}`;
    this.use(i, r.need);
    this.add(i, what, r.n ?? 1);
    this.w.emit('craft', { id: this.w.e.id(i), what });
    return true;
  }

  busy(id: number): boolean { return this.jobs.has(id); }
  jobOf(id: number): string { return this.jobs.get(id)?.kind ?? ''; }
  cancel(id: number): void { if (this.jobs.delete(id)) { const i = this.w.e.slot(id); if (i >= 0) this.w.brain.order(i, 'stop', -1, -1, 0); } }

  /** Start getting one piece of a resource: the nearest tree (wood) or rubble (stone, scrap). True or why not. */
  gather(i: number, what: Res): true | string {
    if (what === 'leather' || what === 'claw') return this.hunt(i, what === 'claw' ? 'wolf' : '');
    const tiles = what === 'herb' ? [this.T.herbs] : what === 'wood' ? [this.T.tree] : what === 'ore' ? [this.T.rock] : what === 'stone' ? [this.T.rubble, this.T.rock] : [this.T.rubble];
    let t = -1, bd = Infinity;
    const e = this.w.e, W = this.W(i);
    for (const tile of tiles) {
      if (tile < 0) continue;
      const k = this.w.ai.goap ? this.findTile(i, tile) : this.nearestTile(i, tile, 60);
      if (k >= 0) { const d = Math.hypot((k % W) - e.x[i]!, ((k / W) | 0) - e.y[i]!); if (d < bd) { bd = d; t = k; } }
    }
    if (t < 0) return what === 'herb' ? 'there are no herbs near here' : what === 'wood' ? 'there are no trees near here' : what === 'ore' ? 'there are no rocks near here' : 'there is no rubble near here';
    // (with goap on the search covers the whole map: the words then mean "none anywhere here")
    return this.begin(i, { kind: what === 'wood' ? 'chop' : this.w.maps[this.w.e.map[i]!]!.tiles.tiles[t] === this.T.rock ? 'mine' : 'dig', m: this.w.e.map[i]!, tx: t % W, ty: (t / W) | 0, work: 0 });
  }

  /** Go hunting: the nearest animal (of that kind) within 90 m. The brain does the chase (Brain.hunt). */
  hunt(i: number, what: string): true | string {
    const w = this.w, e = w.e, q = what.toLowerCase();
    const rule = w.rules.forbidden(i, 'hunt') ?? w.rules.forbidden(i, 'fight');
    if (rule) return `I must not: "${rule}"`;
    const type = /rabbit|lapin|conejo|أرنب/.test(q) ? 0 : /deer|cerf|ciervo|غزال/.test(q) ? 1 : /boar|sanglier|jabal|خنزير/.test(q) ? 2 : /wolf|loup|lobo|ذئب/.test(q) ? 3 : /bear|ours|oso|دب/.test(q) ? 4 : -1;
    const far = w.ai.instinct ? 220 : 90; // with instincts on, people go further for game (they know where animals roam)
    let a = w.animals.nearest(e.map[i]!, e.x[i]!, e.y[i]!, 90, type);
    if (a < 0 && type >= 0) a = w.animals.nearest(e.map[i]!, e.x[i]!, e.y[i]!, 90);
    if (a < 0 && far > 90) a = w.animals.nearest(e.map[i]!, e.x[i]!, e.y[i]!, far, type);
    if (a < 0 && far > 90 && type >= 0) a = w.animals.nearest(e.map[i]!, e.x[i]!, e.y[i]!, far);
    if (a < 0) return 'I found no animals near here';
    if (e.sub[a] === 4 && this.weapon(i)[1] < 30 && type !== 4) { const b = w.animals.nearest(e.map[i]!, e.x[i]!, e.y[i]!, 90, w.rng.chance(0.5) ? 0 : 1); if (b >= 0) a = b; } // not a bear with bare hands
    return w.brain.hunt(i, e.id(a)) ? true : 'I cannot get to it';
  }

  /** Start building a campfire or a hut near (x, y) (default: where they stand). Materials are used when it is done. */
  build(i: number, what: string, x?: number, y?: number): true | string {
    if (!this.enabled) return 'this world has no buildings';
    if (what !== 'campfire' && what !== 'hut') return this.buildThing(i, what);
    // Huts are dear (imad 2026-11-25): someone with no home moves into a free hut instead of building another.
    if (what === 'hut' && this.w.e.kind[i] === Kind.Agent) { const moved = this.homes.moveIn(this.w.e.id(i), this.w.e.map[i]!); if (moved) return moved; }
    if (!this.has(i, RECIPES[what]!)) return `I need ${this.missing(i, what).map(([k, n]) => `${n} ${k}`).join(' and ')}`;
    const e = this.w.e, m = e.map[i]!;
    if (this.w.ai.siting && !this.camp[m] && x === undefined) { const cs = this.campSite(m, e.x[i]!, e.y[i]!); if (cs) this.setCamp(m, cs.x, cs.y); }
    const camp = this.camp[m];
    // Near the camp when there is one (a village grows), else where they stand.
    const nearCamp = camp && (this.w.ai.goap || Math.hypot(camp.x - e.x[i]!, camp.y - e.y[i]!) < 150); // planned work is for the camp
    const cx = x ?? (nearCamp ? camp.x : e.x[i]!), cy = y ?? (nearCamp ? camp.y : e.y[i]!);
    if (what === 'campfire') {
      const s = this.site(m, cx, cy, 1, 1, 12);
      if (s < 0) return 'I found no clear ground for a fire';
      const W = this.w.maps[m]!.tiles.w;
      return this.begin(i, { kind: 'fire', m, tx: s % W, ty: (s / W) | 0, work: 0 });
    }
    const W = this.w.maps[m]!.tiles.w;
    let x0: number, y0: number, dir = 0;
    if (this.w.ai.siting && camp) {
      const hs = this.hutSite(m);
      if (hs) { x0 = hs.x0; y0 = hs.y0; dir = hs.dir; }
      else { // no room inside the wall: outside, as before (it will not be protected)
        const s0 = this.site(m, cx, cy, 5, 5, 30);
        if (s0 < 0) return 'I found no clear ground for a hut';
        x0 = s0 % W; y0 = (s0 / W) | 0;
      }
    } else {
      const s = this.site(m, cx, cy, 5, 5, 30);
      if (s < 0) return 'I found no clear ground for a hut';
      x0 = s % W; y0 = (s / W) | 0;
    }
    const [ddx, ddy] = DIRS[dir]!, door = (y0 + 2 + ddy * 2) * W + x0 + 2 + ddx * 2;
    // Floor first (inside), then the walls from the back to the front; the doorway stays open.
    const floor: number[] = [], walls: number[] = [];
    for (let yy = 0; yy < 5; yy++) for (let xx = 0; xx < 5; xx++) {
      const k = (y0 + yy) * W + x0 + xx, edge = xx === 0 || yy === 0 || xx === 4 || yy === 4;
      if (k === door) continue;
      if (!edge) floor.push(k, this.T.floor);
      else walls.push(k, this.T.woodwall);
    }
    walls.push(door, this.T.door >= 0 ? this.T.door : this.T.floor); // its own door last (imad 2026-11-25: huts come with doors)
    // Stand just outside the door.
    return this.begin(i, { kind: 'hut', m, tx: x0 + 2 + ddx * 3, ty: y0 + 2 + ddy * 3, work: 0, tiles: [...floor, ...walls], dir });
  }

  /**
   * Where to found the camp (siting): a settlement needs room to grow, water and wood near, and should not be far from the
   * people. Candidate centres on a 4-tile grid within 50 m are scored on the share of open buildable ground within 11 tiles
   * (huts, fire, fields and a wall need it), walking distance to water, trees within 30 m (firewood, building) and the
   * distance from here. Done once per map, so the full scan is affordable.
   */
  campSite(m: number, x: number, y: number): { x: number; y: number } | null {
    const w = this.w, tm = w.maps[m]!.tiles;
    let best: { x: number; y: number } | null = null, bs = -Infinity;
    for (let cy = Math.floor(y - 50); cy <= y + 50; cy += 4) for (let cx = Math.floor(x - 50); cx <= x + 50; cx += 4) {
      if (!tm.inside(cx, cy) || !this.buildable.has(tm.get(cx, cy)) || w.land.inRing(m, cx, cy)) continue;
      const d = Math.hypot(cx - x, cy - y);
      if (d > 50) continue;
      let open = 0, all = 0, trees = 0;
      for (let yy = cy - 11; yy <= cy + 11; yy++) for (let xx = cx - 11; xx <= cx + 11; xx++) {
        if ((xx - cx) ** 2 + (yy - cy) ** 2 > 121) continue;
        all++;
        if (tm.inside(xx, yy) && this.buildable.has(tm.get(xx, yy))) open++;
      }
      for (let yy = cy - 30; yy <= cy + 30; yy += 3) for (let xx = cx - 30; xx <= cx + 30; xx += 3) if (tm.inside(xx, yy) && tm.get(xx, yy) === this.T.tree && !w.land.inRing(m, xx, yy)) trees++;
      let portal = false;
      for (const p of w.portals) if (p.from === m && Math.hypot(p.x - cx, p.y - cy) < 16) portal = true;
      if (portal) continue;
      const water = Math.min(120, w.brain.waterDist(m, cx + 0.5, cy + 0.5));
      const score = (open / all) * 3 - water / 60 - d / 100 + Math.min(trees, 40) / 40;
      if (score > bs) { bs = score; best = { x: cx + 0.5, y: cy + 0.5 }; }
    }
    return best;
  }

  /**
   * Where the next hut goes (siting, research/ARCHITECTURE.md "construction"): a constraint search, not a random clear patch.
   * Hard rules: the 5 x 5 square and a free ring round it on open ground; inside the wall's circle with a gap to the wall's line;
   * not on the fire's square; the doorway and two tiles in front of it free (and never in front of another hut's door); after
   * it stands, the camp's centre still reaches every door, the store and the way out. Scored: the door faces the camp's centre,
   * close to it (a compact village is a short wall). null = no such place (the caller may then build outside, as before).
   */
  hutSite(m: number): { x0: number; y0: number; dir: number } | null {
    const p = this.perimeter(m);
    if (!p) return null;
    // Before the wall is fixed, a crowded spot may take a wider circle (the wall will follow the huts), up to 16 tiles.
    for (let r = p.r; r <= (this.walls[m] ? p.r : 20); r += 2) { const h = this.hutSiteIn(m, { ...p, r }); if (h) return h; }
    return null;
  }
  private hutSiteIn(m: number, p: { x: number; y: number; r: number }): { x0: number; y0: number; dir: number } | null {
    const w = this.w, tm = w.maps[m]!.tiles, camp = this.camp[m];
    if (!camp) return null;
    const keep = this.taken(m), cands: [number, number, number, number][] = [];
    const ok = (x: number, y: number, inner: boolean) => {
      if (!tm.inside(x, y)) return false;
      const t = tm.get(x, y), k = y * tm.w + x;
      if (keep.has(k) || t === this.T.campfire) return false;
      return inner ? this.buildable.has(t) : tm.cost[t]! > 0;
    };
    const R = p.r;
    for (let cy = Math.floor(p.y - R); cy <= p.y + R; cy++) for (let cx = Math.floor(p.x - R); cx <= p.x + R; cx++) {
      const d = Math.hypot(cx + 0.5 - (p.x + 0.5), cy + 0.5 - (p.y + 0.5));
      if (d + 3.6 > R - 1.2 || d < 4.5) continue;
      const x0 = cx - 2, y0 = cy - 2;
      let fits = true;
      for (let yy = y0 - 1; yy <= y0 + 5 && fits; yy++) for (let xx = x0 - 1; xx <= x0 + 5 && fits; xx++) {
        const inner = xx >= x0 && yy >= y0 && xx < x0 + 5 && yy < y0 + 5;
        if (!ok(xx, yy, inner) || (inner && this.occupied(m, xx, yy))) fits = false;
      }
      if (!fits) continue;
      for (const p0 of w.portals) if (p0.from === m && Math.hypot(p0.x - cx, p0.y - cy) < 8) fits = false;
      if (!fits) continue;
      const ux = (p.x - cx) / (d || 1), uy = (p.y - cy) / (d || 1);
      for (let dir = 0; dir < 4; dir++) {
        const [dx, dy] = DIRS[dir]!;
        // Two tiles of open ground in front of the door.
        const fx = cx + dx * 3, fy = cy + dy * 3;
        if (!ok(fx, fy, false) || !ok(fx + dx, fy + dy, false)) continue;
        const face = dx * ux + dy * uy; // 1 = the door looks at the camp
        cands.push([face * 2 - d * 0.3, x0, y0, dir]);
      }
    }
    cands.sort((a2, b2) => b2[0] - a2[0]);
    // Access: test the best few with a flood from the camp's centre, the new walls counted as standing.
    const c0 = walkableNear(tm, camp.x, camp.y, 4);
    if (c0 < 0) return null;
    const targets = this.huts[m]!.filter((o) => o >= 0);
    const st = this.stash[m];
    for (const [, x0, y0, dir] of cands.slice(0, 8)) {
      const [dx, dy] = DIRS[dir]!, door = (y0 + 2 + dy * 2) * tm.w + x0 + 2 + dx * 2, out = door + dy * tm.w + dx;
      const wall = (k: number) => { const x = k % tm.w, y = (k / tm.w) | 0; return x >= x0 && y >= y0 && x < x0 + 5 && y < y0 + 5 && (x === x0 || y === y0 || x === x0 + 4 || y === y0 + 4) && k !== door; };
      const reach = flood(tm, c0 % tm.w, (c0 / tm.w) | 0, 8000, wall);
      if (!reach.has(out) || targets.some((o) => !reach.has(o))) continue;
      if (st && ![1, -1, tm.w, -tm.w].some((dd) => reach.has(st.t + dd))) continue;
      return { x0, y0, dir };
    }
    return null;
  }

  /** A player builds a hut (imad 2026-11-20: players can make everything the people make): right away, just ahead of them. */
  playerHut(i: number): string {
    if (!this.enabled) return 'nothing';
    if (!this.has(i, RECIPES.hut!)) return 'needHut';
    const w = this.w, e = w.e, m = e.map[i]!, tm = w.maps[m]!.tiles;
    const a = e.angle[i]!, s = this.site(m, e.x[i]! + Math.cos(a) * 4, e.y[i]! + Math.sin(a) * 4, 5, 5, 12);
    if (s < 0) return 'noRoom';
    return this.hutAt(i, s % tm.w, (s / tm.w) | 0, 0);
  }
  /**
   * Can this player put `what` exactly there (imad 2026-11-25: "aim where to build very precisely")? A thing: tile (tx, ty);
   * a hut: its 5 x 5 square with the top-left at (tx, ty), the door facing dir (0 south, 1 east, 2 north, 3 west).
   * '' = yes, else why not (the TV's ghost turns red with it).
   */
  canPlace(i: number, what: string, tx: number, ty: number, dir = 0): string {
    const w = this.w, e = w.e, m = e.map[i]!, tm = w.maps[m]!.tiles, x = e.x[i]!, y = e.y[i]!;
    const near = (px: number, py: number, r: number) => { for (const p of w.portals) if (p.from === m && Math.hypot(p.x - px, p.y - py) < r) return true; return false; };
    if (what === 'hut') {
      if (!this.enabled) return 'nothing';
      // Close enough: the square's nearest tile within 8 m.
      const cx = Math.max(tx, Math.min(tx + 4, x - 0.5)), cy = Math.max(ty, Math.min(ty + 4, y - 0.5));
      if (Math.hypot(cx + 0.5 - x, cy + 0.5 - y) > PLACE_REACH) return 'tooFar';
      const [dx, dy] = DIRS[dir] ?? DIRS[0]!, door = (ty + 2 + dy * 2) * tm.w + tx + 2 + dx * 2;
      for (let yy = 0; yy < 5; yy++) for (let xx = 0; xx < 5; xx++) {
        const X = tx + xx, Y = ty + yy;
        if (!tm.inside(X, Y) || w.land.inRing(m, X, Y)) return 'noRoom';
        const t = tm.get(X, Y);
        if (!this.buildable.has(t) && t !== 3 /* road */) return 'noRoom';
        const edge = xx === 0 || yy === 0 || xx === 4 || yy === 4;
        if (edge && Y * tm.w + X !== door && this.occupied(m, X, Y)) return 'someone';
      }
      // The ground in front of the door must be open (a way in).
      const ox = tx + 2 + dx * 3, oy = ty + 2 + dy * 3;
      if (!tm.inside(ox, oy) || tm.solid[tm.get(ox, oy)]) return 'doorBlocked';
      if (near(tx + 2.5, ty + 2.5, 6)) return 'noRoom';
      return '';
    }
    const tile = this.placeTile.get(what);
    if (tile === undefined) return 'nothing';
    if (!tm.inside(tx, ty) || w.land.inRing(m, tx, ty)) return 'noRoom';
    if (Math.hypot(tx + 0.5 - x, ty + 0.5 - y) > PLACE_REACH) return 'tooFar';
    const t = tm.get(tx, ty), wallish = t === this.T.woodwall || t === this.placeTile.get('palisade') || t === this.placeTile.get('stonewall') || t === this.T.floor;
    const ok = this.buildable.has(t) || t === this.T.floor || t === 3 /* road */ || ((what === 'door' || what === 'window') && wallish);
    if (!ok) return 'noRoom';
    if ((tm.solid[tile] || what === 'door') && this.occupied(m, tx, ty)) return 'someone';
    if (near(tx, ty, 4)) return 'noRoom';
    return '';
  }
  /** A player puts `what` exactly where they aimed (made from the bag's materials by the caller first). */
  placeAt(i: number, what: string, tx: number, ty: number, dir = 0): string {
    if (what === 'hut') {
      if (!this.has(i, RECIPES.hut!)) return 'needHut';
      const c = this.canPlace(i, what, tx, ty, dir);
      return c || this.hutAt(i, tx, ty, dir);
    }
    if ((this.inv(i)[what] ?? 0) < 1) return 'noItem';
    const c = this.canPlace(i, what, tx, ty, dir);
    if (c) return c;
    const e = this.w.e;
    e.angle[i] = Math.atan2(ty + 0.5 - e.y[i]!, tx + 0.5 - e.x[i]!);
    this.putDown(i, e.map[i]!, tx, ty, what);
    return 'placed';
  }
  /** Put a player's hut up at once: walls, a floor, its own door (theirs: only their family may go in). */
  private hutAt(i: number, x0: number, y0: number, dir: number): string {
    const w = this.w, e = w.e, m = e.map[i]!, tm = w.maps[m]!.tiles;
    const [dx, dy] = DIRS[dir] ?? DIRS[0]!, door = (y0 + 2 + dy * 2) * tm.w + x0 + 2 + dx * 2;
    for (let yy = 0; yy < 5; yy++) for (let xx = 0; xx < 5; xx++) {
      const k = (y0 + yy) * tm.w + x0 + xx, edge = xx === 0 || yy === 0 || xx === 4 || yy === 4;
      if (edge && k !== door && this.occupied(m, x0 + xx, y0 + yy)) return 'someone';
    }
    this.use(i, RECIPES.hut!);
    for (let yy = 0; yy < 5; yy++) for (let xx = 0; xx < 5; xx++) {
      const k = (y0 + yy) * tm.w + x0 + xx, edge = xx === 0 || yy === 0 || xx === 4 || yy === 4;
      if (tm.tiles[k] === this.T.water) continue;
      if (k === door) tm.set(x0 + xx, y0 + yy, this.T.door >= 0 ? this.T.door : this.T.floor);
      else tm.set(x0 + xx, y0 + yy, edge ? this.T.woodwall : this.T.floor);
      if (!edge) w.brain.addShelter(m, k);
    }
    const out = (y0 + 2 + dy * 3) * tm.w + x0 + 2 + dx * 3;
    this.huts[m]!.push(out);
    this.hutDir[m]!.push(dir);
    this.homes.built(m, out, dir, e.id(i));
    this.setCamp(m, x0 + 2.5 + dx * 4, y0 + 2.5 + dy * 4);
    w.emit('build', { id: e.id(i), what: 'hut', map: w.maps[m]!.def.id, tx: x0 + 2, ty: y0 + 2, player: true });
    return 'built';
  }

  // ------------------------------------------------------------------ doors (imad 2026-11-25: "the doors can be opened and closed with the interaction button")
  /** Is tile t a door, open or closed? */
  isDoor(t: number): boolean { return t >= 0 && (t === this.T.door || t === this.T.doorOpen); }
  /**
   * A player opens or closes the door on tile (tx, ty), within 2.2 m. A hut's door only for its owner's family (sim/homes.ts); gates and
   * ruin doors for anyone. Code: doorOpened / doorClosed / doorLocked / doorSomeone / tooFar / nothing.
   */
  toggleDoor(i: number, tx: number, ty: number): string {
    const e = this.w.e, m = e.map[i]!, tm = this.w.maps[m]!.tiles;
    if (!tm.inside(tx, ty)) return 'nothing';
    const k = ty * tm.w + tx, t = tm.tiles[k]!;
    if (!this.isDoor(t)) return 'nothing';
    if (Math.hypot(tx + 0.5 - e.x[i]!, ty + 0.5 - e.y[i]!) > 2.2) return 'tooFar';
    if (!this.homes.mayEnter(i, m, k)) return 'doorLocked';
    if (t === this.T.doorOpen) {
      for (let j = 0; j < e.hi; j++) if (e.map[j] === m && (e.kind[j] === Kind.Agent || e.kind[j] === Kind.Player || e.kind[j] === Kind.Threat || e.kind[j] === Kind.Animal) && Math.floor(e.x[j]!) === tx && Math.floor(e.y[j]!) === ty) return 'doorSomeone';
      tm.set(tx, ty, this.T.door);
      this.w.emit('door', { id: e.id(i), map: this.w.maps[m]!.def.id, tx, ty, open: false });
      return 'doorClosed';
    }
    tm.set(tx, ty, this.T.doorOpen);
    this.w.emit('door', { id: e.id(i), map: this.w.maps[m]!.def.id, tx, ty, open: true });
    return 'doorOpened';
  }

  // ------------------------------------------------------------------ pulling down (imad 2026-11-25: "only owned buildings or when the owner is dead")
  /** Tiles people build (walls, floors, doors, fires, fields, crates and everything put down). */
  builtTile(t: number): boolean {
    const T = this.T;
    return t >= 0 && (t === T.woodwall || t === T.floor || t === T.door || t === T.doorOpen || t === T.campfire || t === T.ashes || t === T.crate || t === T.farm || [...this.placeTile.values()].includes(t));
  }
  /** Something built here that the map did not start with. */
  private isBuilt(m: number, k: number): boolean {
    const tm = this.w.maps[m]!.tiles, t = tm.tiles[k]!;
    return this.builtTile(t) && (!tm.base || tm.base[k] !== t || !!this.homes.at(m, k) || this.owners.has(`${m}:${k}`));
  }
  /** What a pulled-down tile becomes: the ground it was built on (open ground where a tree or a rock stood). */
  private groundOf(m: number, k: number): number {
    const tm = this.w.maps[m]!.tiles, b = tm.base?.[k];
    if (b === undefined || tm.solid[b] || this.builtTile(b)) return this.T.dirt >= 0 ? this.T.dirt : this.T.grass;
    return b;
  }
  /** Whose is the thing on tile k: a hut's owner (else its builder), a piece's builder; -1 = nobody knows. */
  ownerOf(m: number, k: number): number {
    const h = this.homes.at(m, k);
    if (h) return h.owner >= 0 ? h.owner : h.by;
    return this.owners.get(`${m}:${k}`) ?? -1;
  }
  private gone(id: number): boolean { const p = this.w.profiles.get(id); return !p || p.died !== undefined; }
  /** '' = this person may pull down what is on tile k; else nothing / unknown (nobody knows whose) / notYours. */
  mayDestroy(i: number, m: number, k: number): string {
    if (!this.isBuilt(m, k)) return 'nothing';
    const o = this.ownerOf(m, k);
    if (o < 0) return 'unknown';
    if (o !== this.w.e.id(i) && !this.gone(o)) return 'notYours';
    return '';
  }
  /** The tiles that come down together with tile k (a whole hut, else that one tile). */
  destroyCells(m: number, k: number): number[] {
    const h = this.homes.at(m, k), W = this.w.maps[m]!.tiles.w;
    if (!h) return [k];
    const r = this.hutRect(m, h.out, h.dir);
    const out: number[] = [];
    if (r) for (let yy = 0; yy < 5; yy++) for (let xx = 0; xx < 5; xx++) out.push((r.y0 + yy) * W + r.x0 + xx);
    return out;
  }
  /** A player aims at tile (tx, ty): pull it down if it is theirs or its owner is dead. Code: destroyed / tooFar / nothing / unknown / notYours. */
  destroyAt(i: number, tx: number, ty: number): string {
    const e = this.w.e, m = e.map[i]!, tm = this.w.maps[m]!.tiles;
    if (!tm.inside(tx, ty)) return 'nothing';
    if (Math.hypot(tx + 0.5 - e.x[i]!, ty + 0.5 - e.y[i]!) > PLACE_REACH) return 'tooFar';
    const k = ty * tm.w + tx, c = this.mayDestroy(i, m, k);
    if (c) return c;
    e.angle[i] = Math.atan2(ty + 0.5 - e.y[i]!, tx + 0.5 - e.x[i]!);
    this.pullDown(i, m, k);
    return 'destroyed';
  }
  /** An AI person pulls down their own (or a dead owner's) hut / piece nearest to them; what = 'hut', a thing's name or '' = any. */
  wreck(i: number, what = ''): true | string {
    const w = this.w, e = w.e, m = e.map[i]!, tm = w.maps[m]!.tiles, me = e.id(i);
    const want = what === 'hut' ? -2 : what ? this.placeTile.get(what) ?? (what === 'fire' ? this.T.campfire : what === 'field' ? this.T.farm : -3) : -1;
    if (want === -3) return `I don't know what "${what}" is`;
    let best = -1, bd = Infinity;
    const consider = (k: number) => {
      if (this.mayDestroy(i, m, k)) return;
      const d = Math.hypot((k % tm.w) + 0.5 - e.x[i]!, ((k / tm.w) | 0) + 0.5 - e.y[i]!);
      if (d < bd) { bd = d; best = k; }
    };
    if (want === -1 || want === -2) for (const h of this.homes.list) if (h.m === m) consider(this.homes.doorOf(h));
    if (want !== -2) for (const key of this.owners.keys()) {
      const [mm, k] = key.split(':').map(Number) as [number, number];
      if (mm === m && !this.homes.at(m, k) && (want < 0 || tm.tiles[k] === want)) consider(k);
    }
    if (best < 0) {
      const mine = [...this.owners].some(([key, o]) => o === me && key.startsWith(m + ':')) || this.homes.list.some((h) => h.m === m && (h.owner === me || h.by === me));
      return mine ? 'I have nothing like that to pull down' : 'nothing here is mine to pull down';
    }
    return this.begin(i, { kind: 'wreck', m, tx: best % tm.w, ty: (best / tm.w) | 0, work: 0 });
  }
  /** Take it down: the ground comes back; a thing put down goes back into the bag, a hut gives back half its materials. */
  private pullDown(i: number, m: number, k: number): void {
    const w = this.w, tm = w.maps[m]!.tiles, h = this.homes.at(m, k), W = tm.w;
    const what = h ? 'hut' : tm.tiles[k] === this.T.doorOpen ? 'door' : [...this.placeTile].find(([, t]) => t === tm.tiles[k])?.[0] ?? (tm.tiles[k] === this.T.farm ? 'field' : 'campfire');
    for (const c of this.destroyCells(m, k)) {
      if (tm.tiles[c] !== this.T.water && this.builtTile(tm.tiles[c]!)) tm.set(c % W, (c / W) | 0, this.groundOf(m, c));
      this.owners.delete(`${m}:${c}`); this.fires.delete(`${m}:${c}`); this.farms.delete(`${m}:${c}`);
    }
    if (h) {
      const n = this.huts[m]!.indexOf(h.out);
      if (n >= 0) { this.huts[m]!.splice(n, 1); this.hutDir[m]!.splice(n, 1); }
      const p = h.owner >= 0 ? w.profiles.get(h.owner) : undefined;
      if (p) delete p.home;
      h.owner = -1;
      this.homes.sync();
      this.add(i, 'wood', Math.floor((HUT_NEED.wood ?? 0) / 2)); this.add(i, 'stone', Math.floor((HUT_NEED.stone ?? 0) / 2)); this.add(i, 'leather', Math.floor((HUT_NEED.leather ?? 0) / 2));
    } else if (what !== 'campfire' && what !== 'field' && this.placeTile.has(what)) this.add(i, what, 1);
    w.brain.resetShelters(m);
    w.emit('destroy', { id: w.e.id(i), what, map: w.maps[m]!.def.id, tx: k % W, ty: (k / W) | 0 });
  }
  /**
   * Admin: pull down every building on map m (all maps when m < 0) and start over (imad 2026-11-25): huts, walls, doors, beds, lamps,
   * fires, fields, the store crate (and what was in it); homes, camps and the camp wall's circle are forgotten. Trees and rocks stay.
   */
  resetBuildings(m = -1): { tiles: number; huts: number; maps: number } {
    const w = this.w, out = { tiles: 0, huts: 0, maps: 0 };
    for (let mi = 0; mi < w.maps.length; mi++) {
      if (m >= 0 && mi !== m) continue;
      const tm = w.maps[mi]!.tiles;
      for (let k = 0; k < tm.tiles.length; k++) {
        const t = tm.tiles[k]!;
        if (!this.builtTile(t) || (tm.base && tm.base[k] === t && !this.homes.at(mi, k) && !this.owners.has(`${mi}:${k}`))) continue;
        tm.set(k % tm.w, (k / tm.w) | 0, this.groundOf(mi, k)); out.tiles++;
      }
      out.huts += this.huts[mi]!.length;
      for (const h of this.homes.list) if (h.m === mi && h.owner >= 0) { const p = w.profiles.get(h.owner); if (p) delete p.home; }
      for (const p of w.profiles.values()) if (p.home && p.home.map === w.maps[mi]!.def.id) delete p.home;
      this.huts[mi] = []; this.hutDir[mi] = [];
      this.walls[mi] = null; this.camp[mi] = null; this.stash[mi] = null; this.legacy.delete(mi); delete this.doorCache[mi];
      for (const map of [this.owners, this.fires, this.farms, this.looted] as Map<string, unknown>[]) for (const key of [...map.keys()]) if (key.startsWith(mi + ':')) map.delete(key);
      for (const [id, j] of [...this.jobs]) if (j.m === mi) this.cancel(id);
      w.brain.resetShelters(mi);
      out.maps++;
    }
    this.tileIdx.clear();
    this.homes.sync();
    w.emit('reset', { what: 'buildings', map: m >= 0 ? w.maps[m]!.def.id : 'all', ...out });
    return out;
  }

  /** Put down a palisade / spikes / wall / door / window / bed / lamp near the camp (a bed: inside a hut). Made first if needed. */
  private buildThing(i: number, what: string): true | string {
    if (!this.placeTile.has(what)) return `I can't build ${what}`;
    if ((this.inv(i)[what] ?? 0) < 1 && !this.has(i, RECIPES[what]!)) return `I need ${this.missing(i, what).map(([k, n]) => `${n} ${k}`).join(' and ')}`;
    const w = this.w, e = w.e, m = e.map[i]!, tm = w.maps[m]!.tiles, camp = this.camp[m];
    let s = -1;
    if (what === 'bed') { // a hut's floor with nothing on it
      for (let n = 0; n < this.huts[m]!.length && s < 0; n++) {
        const h = this.hutRect(m, this.huts[m]![n]!, this.hutDir[m]![n] ?? 0);
        if (!h) continue;
        // The far side of the room first, never the tile just inside the door (people must get in).
        for (let yy = 1; yy <= 3 && s < 0; yy++) for (let xx = 1; xx <= 3 && s < 0; xx++) {
          const k = (h.y0 + (h.dy < 0 ? 4 - yy : yy)) * tm.w + h.x0 + (h.dx < 0 ? 4 - xx : xx);
          if (tm.tiles[k] === this.T.floor && k !== h.inside) s = k;
        }
      }
    }
    if (what === 'door') s = this.doorSite(m); // the open doorway of a hut
    if (what === 'door' && s < 0) s = this.gateSite(m);
    if (what === 'door' && s < 0) return 'there is no doorway or gate that needs a door'; // never a door standing alone in the open (imad 2026-11-21)
    if (s < 0 && camp && (what === 'palisade' || what === 'stonewall' || what === 'spikes')) s = this.defenceSite(m, what);
    if (s < 0) s = this.site(m, camp?.x ?? e.x[i]!, camp?.y ?? e.y[i]!, 1, 1, what === 'lamp' ? 10 : 16);
    if (s < 0) return 'I found no place for it';
    return this.begin(i, { kind: 'place', m, tx: s % tm.w, ty: (s / tm.w) | 0, work: 0, what });
  }

  /** Someone is already on the way to build there (so a crew spreads along the wall). */
  private reserved(m: number, k: number): boolean {
    const tm = this.w.maps[m]!.tiles;
    for (const j of this.jobs.values()) if (j.kind === 'place' && j.m === m && j.ty * tm.w + j.tx === k) return true;
    return false;
  }
  /** The ways in of the camp wall (north / east / south / west, 9 tiles out) get a door once the wall stands: tile index or -1. */
  gateSite(m: number): number {
    const camp = this.camp[m];
    if (!camp) return -1;
    const [up] = this.campDefence(m);
    if (up < 12) return -1;
    const tm = this.w.maps[m]!.tiles, p = this.perimeter(m)!, cx = p.x, cy = p.y, R = p.r, door = this.placeTile.get('door');
    for (const [dx, dy] of [[0, -R], [R, 0], [0, R], [-R, 0]] as const) {
      const x = cx + dx, y = cy + dy;
      if (!tm.inside(x, y)) continue;
      const k = y * tm.w + x;
      if (tm.tiles[k] === door || !this.buildable.has(tm.tiles[k]!) || this.reserved(m, k) || this.w.land.inRing(m, x, y)) continue;
      return k;
    }
    return -1;
  }
  private readonly doorCache: [number, number][] = [];
  /** Doors standing in huts or the wall on map m (counted at most every 5 game minutes). */
  doorsUp(m: number): number {
    const c = this.doorCache[m];
    if (c && c[0] > this.w.gameSec - 300) return c[1];
    const tm = this.w.maps[m]!.tiles, door = this.placeTile.get('door');
    let n = 0;
    for (let k = 0; k < tm.tiles.length; k++) if (tm.tiles[k] === door) n++;
    this.doorCache[m] = [this.w.gameSec, n];
    return n;
  }
  /** A hut's doorway with no door yet (tile index), or -1. */
  doorSite(m: number): number {
    const tm = this.w.maps[m]!.tiles;
    for (let n = 0; n < this.huts[m]!.length; n++) {
      const h = this.hutRect(m, this.huts[m]![n]!, this.hutDir[m]![n] ?? 0);
      if (!h) continue;
      const k = h.door; // the gap is just inside the spot in front of the hut
      if (tm.tiles[k] === this.T.floor && !this.reserved(m, k)) return k;
    }
    return -1;
  }
  /**
   * Where the next piece of the camp's defence goes (imad 2026-11-20: "people have no doors, walls or defences"): a ring of
   * walls 9 tiles round the camp (4 ways in left open, north / east / south / west), spikes one tile outside it. -1 = done.
   */
  defenceSite(m: number, what: string): number {
    const camp = this.camp[m];
    if (!camp) return -1;
    if (what !== 'spikes') this.freezeWall(m);
    const tm = this.w.maps[m]!.tiles, p = this.perimeter(m)!, R = what === 'spikes' ? p.r + 1 : p.r;
    const keep = this.w.ai.siting ? this.aprons(m) : null;
    for (const k of this.ring(m, R)) {
      const x = k % tm.w, y = (k / tm.w) | 0;
      if (!this.buildable.has(tm.tiles[k]!) || this.occupied(m, x, y) || this.reserved(m, k) || this.w.land.inRing(m, x, y)) continue;
      if (keep?.has(k)) continue; // never in front of a door
      return k;
    }
    return -1;
  }
  /** How far the camp's defence is: [pieces up, pieces still to build] (walls only). */
  campDefence(m: number): [number, number] {
    const camp = this.camp[m];
    if (!camp) return [0, 0];
    const tm = this.w.maps[m]!.tiles, pal = this.placeTile.get('palisade'), sw = this.placeTile.get('stonewall');
    const keep = this.w.ai.siting ? this.aprons(m) : null;
    let up = 0, left = 0;
    for (const k of this.ring(m, this.perimeter(m)!.r)) {
      const t = tm.tiles[k]!;
      if (t === pal || t === sw) up++; else if (this.buildable.has(t) && !keep?.has(k)) left++;
    }
    return [up, left];
  }
  /** Tiles nobody may build on (siting): the aprons, plus what others are already building (a hut's square with the ring
   * round it and the ground in front of its door; a piece being put down). Shared by every site search, so two builders
   * never pick the same ground. */
  taken(m: number): Set<number> {
    const tm = this.w.maps[m]!.tiles, keep = this.aprons(m);
    for (const j of this.jobs.values()) {
      if (j.m !== m) continue;
      if (j.kind === 'place' || j.kind === 'fire' || j.kind === 'plant') { keep.add(j.ty * tm.w + j.tx); continue; }
      if (j.kind !== 'hut' || !j.tiles) continue;
      for (let n = 0; n < j.tiles.length; n += 2) { const k = j.tiles[n]!; for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) keep.add(k + dy * tm.w + dx); }
      const [ddx, ddy] = DIRS[j.dir ?? 0]!;
      for (let d = 0; d <= 2; d++) keep.add((j.ty + ddy * d) * tm.w + j.tx + ddx * d);
    }
    return keep;
  }
  /** Tiles to keep clear (siting): the doorway and two tiles in front of every hut. */
  aprons(m: number): Set<number> {
    const W = this.w.maps[m]!.tiles.w, out = new Set<number>();
    this.huts[m]!.forEach((o, k) => {
      const h = this.hutRect(m, o, this.hutDir[m]![k] ?? 0);
      if (!h) return;
      for (let d = 0; d <= 2; d++) out.add(o + (h.dy * d) * W + h.dx * d);
      out.add(h.door);
    });
    return out;
  }

  /** Put wood on the nearest fire (within 40 m). */
  tend(i: number): true | string {
    if ((this.inv(i).wood ?? 0) < 1) return 'I have no wood';
    // The camp's fire first (a planned "keep the fire going" means that one, wherever the wood was cut).
    const m0 = this.w.e.map[i]!, c0 = this.camp[m0];
    let t = this.w.ai.goap && c0 ? this.fireNear(m0, c0.x, c0.y, 15) : -1;
    if (t < 0) t = this.nearestFire(i, 40);
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
    if (!st || (st[what] ?? 0) <= 0) return `there is no ${what} in the store`;
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
  /** Take one food from the crate into the hands (for a little one), standing next to it. */
  grabFromStash(i: number): boolean {
    const e = this.w.e, st = this.stash[e.map[i]!];
    if (!st || st.food <= 0 || e.carry[i]! >= 5) return false;
    const W = this.W(i);
    if (Math.hypot((st.t % W) + 0.5 - e.x[i]!, ((st.t / W) | 0) + 0.5 - e.y[i]!) > 2.2) return false;
    st.food--; e.carry[i]!++;
    return true;
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
    for (let n = 0; n < this.huts[m]!.length; n++) {
      const h = this.hutRect(m, this.huts[m]![n]!, this.hutDir[m]![n] ?? 0);
      if (!h) continue;
      const { x0, y0 } = h;
      for (let yy = 0; yy < 5; yy++) for (let xx = 0; xx < 5; xx++) {
        const t = (y0 + yy) * tm.w + x0 + xx;
        if (!(xx === 0 || yy === 0 || xx === 4 || yy === 4) || t === h.door) continue;
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
    this.autoHeal();
    const dg = (w.tick - this.lastTick) * w.dt * w.opt.clockScale;
    this.lastTick = w.tick;
    for (const [id, j] of this.jobs) {
      const i = e.slot(id);
      if (i < 0 || e.map[i] !== j.m) { this.jobs.delete(id); continue; }
      const o = w.brain.orderOf(i);
      if (o.kind !== 'job') { this.done(id, j.why ?? (w.brain.noWay.delete(id) ? 'I could not find a way there' : 'I had to stop')); continue; }
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
      for (let n = 0, room = w.brain.itemRoom(m, berry); n < Math.min(2, room); n++) {
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
      if (!first) { this.regrow(); this.homes.hourly(); this.ownPlans(); }
      this.nextQuarter = w.gameSec + HOUR / 3;
    } else if (w.ai.goap && w.gameSec >= this.nextQuarter) { this.nextQuarter = w.gameSec + HOUR / 3; this.quarter(); }
  }

  /** One unit of work done. false = more to do, true = finished, a string = failed. */
  private step(i: number, j: Job): boolean | true | string {
    const w = this.w, e = w.e, tm = w.maps[j.m]!.tiles, k = j.ty * tm.w + j.tx;
    const id = e.id(i), mapId = w.maps[j.m]!.def.id;
    switch (j.kind) {
      case 'chop': {
        if (tm.tiles[k] !== this.T.tree) return 'someone else cut that tree';
        this.take1(i, j.m, j.tx, j.ty, this.T.tree);
        return true;
      }
      case 'place': {
        if (!this.buildable.has(tm.tiles[k]!) && tm.tiles[k] !== this.T.floor) return 'the ground there is taken';
        if (this.occupied(j.m, j.tx, j.ty) && j.what !== 'bed' && j.what !== 'door') return 'someone is in the way'; // people walk through doors
        if ((this.inv(i)[j.what!] ?? 0) < 1) { const r = this.craft(i, j.what!); if (r !== true) return r; }
        if (j.what === 'palisade' || j.what === 'stonewall') this.freezeWall(j.m);
        this.putDown(i, j.m, j.tx, j.ty, j.what!);
        return true;
      }
      case 'guard': return w.gameSec >= (j.n ?? 0) ? true : false; // stand at the post until the shift ends (a fight or hunger ends it earlier)
      case 'dig': case 'mine': {
        if (tm.tiles[k] !== this.T.rubble && tm.tiles[k] !== this.T.rock && (tm.tiles[k] !== this.T.herbs || this.T.herbs < 0)) return 'that is gone';
        this.take1(i, j.m, j.tx, j.ty, tm.tiles[k]!);
        void mapId;
        return true;
      }
      case 'fire': {
        if (!this.buildable.has(tm.tiles[k]!) || this.occupied(j.m, j.tx, j.ty)) return 'the ground there is taken';
        if (!this.has(i, RECIPES.campfire!)) return 'I lost my materials';
        this.use(i, RECIPES.campfire!);
        tm.set(j.tx, j.ty, this.T.campfire);
        this.fires.set(`${j.m}:${k}`, w.gameSec + FIRE_START);
        this.owners.set(`${j.m}:${k}`, id);
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
          st[what] = (st[what] ?? 0) + n;
          w.emit('store', { id, what, n, total: st[what], map: mapId });
          return true;
        }
        const room = what === 'food' ? 5 - e.carry[i]! : CAP - (this.inv(i)[what as Res] ?? 0);
        const n = Math.min(j.n ?? 1, st[what] ?? 0, room);
        if (n <= 0) return (st[what] ?? 0) <= 0 ? `there is no ${what} left in the store` : 'my hands are full';
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
        this.owners.set(`${j.m}:${k}`, id);
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
      case 'wreck': {
        const c = this.mayDestroy(i, j.m, k);
        if (c) return c === 'notYours' ? 'it is not mine' : c === 'unknown' ? 'nobody knows whose it is' : 'it is gone';
        this.pullDown(i, j.m, k);
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
        this.hutDir[j.m]!.push(j.dir ?? 0);
        this.homes.built(j.m, j.ty * tm.w + j.tx, j.dir ?? 0, id);
        this.setCamp(j.m, j.tx + 0.5, j.ty + 1.5);
        w.emit('build', { id, what: 'hut', map: mapId, tx: j.tx, ty: j.ty - 3 });
        return true;
      }
    }
    return 'nothing to do';
  }

  countTiles(m: number, t: number): number { if (t < 0) return 0; let n = 0; for (const x of this.w.maps[m]!.tiles.tiles) if (x === t) n++; return n; }

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
    const band = w.ai.siting ? this.perimeter(m) : null, keep = w.ai.siting ? this.taken(m) : null;
    const fits = (x0: number, y0: number): boolean => {
      for (let yy = y0 - 1; yy <= y0 + sh + (sw > 1 ? 1 : 0); yy++) for (let xx = x0 - 1; xx <= x0 + sw; xx++) {
        if (!tm.inside(xx, yy)) return false;
        const t = tm.get(xx, yy), inside = xx >= x0 && yy >= y0 && xx < x0 + sw && yy < y0 + sh;
        if (inside ? !this.buildable.has(t) : tm.cost[t]! <= 0 || t === this.T.campfire) return false;
      }
      for (const p of w.portals) if (p.from === m && Math.hypot(p.x - x0, p.y - y0) < 8) return false;
      if (band) for (let yy = y0; yy < y0 + sh; yy++) for (let xx = x0; xx < x0 + sw; xx++) { const d = Math.hypot(xx + 0.5 - band.x - 0.5, yy + 0.5 - band.y - 0.5); if (Math.abs(d - band.r) < 1.6) return false; } // the wall's line stays free
      if (keep) for (let yy = y0; yy < y0 + sh; yy++) for (let xx = x0; xx < x0 + sw; xx++) if (keep.has(yy * tm.w + xx)) return false;
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

  /** Per map and tile type: where those tiles are (rebuilt every game hour; checked again on use). People know their map. */
  private tileIdx = new Map<string, { at: number; list: Int32Array }>();
  /** The nearest tile of a type anywhere within r metres (default the whole map), from the hourly index: -1 = none. */
  farTile(i: number, type: number, r = 400): number {
    const w = this.w, e = w.e, m = e.map[i]!, tm = w.maps[m]!.tiles, key = m + ':' + type;
    let ix = this.tileIdx.get(key);
    if (!ix || w.gameSec - ix.at > 3600 || w.gameSec < ix.at) {
      const out: number[] = [];
      for (let k = 0; k < tm.tiles.length; k++) if (tm.tiles[k] === type && !(type === this.T.tree && w.land.inRing(m, k % tm.w, (k / tm.w) | 0))) out.push(k);
      ix = { at: w.gameSec, list: Int32Array.from(out) };
      this.tileIdx.set(key, ix);
    }
    const x = e.x[i]!, y = e.y[i]!;
    let best = -1, bd = r * r;
    for (const k of ix.list) {
      if (tm.tiles[k] !== type) continue;
      const d = ((k % tm.w) + 0.5 - x) ** 2 + (((k / tm.w) | 0) + 0.5 - y) ** 2;
      if (d < bd) { bd = d; best = k; }
    }
    return best;
  }

  /** Near first (60 m, the usual search), else the nearest one the person knows of on the map. */
  findTile(i: number, type: number): number {
    const k = this.nearestTile(i, type, 60);
    return k >= 0 ? k : this.farTile(i, type);
  }

  nearestTile(i: number, type: number, r: number): number {
    const e = this.w.e, tm = this.w.maps[e.map[i]!]!.tiles;
    const cx = Math.floor(e.x[i]!), cy = Math.floor(e.y[i]!);
    let best = -1, bd = r * r;
    for (let yy = Math.max(0, cy - r); yy <= Math.min(tm.h - 1, cy + r); yy++) for (let xx = Math.max(0, cx - r); xx <= Math.min(tm.w - 1, cx + r); xx++) {
      if (tm.tiles[yy * tm.w + xx] !== type) continue;
      if (type === this.T.tree && this.w.land.inRing(e.map[i]!, xx, yy)) continue;
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
  /**
   * Natural resources come back to a steady level (imad 2026-11-25: "they need to grow and keep a steady population").
   * Each map's level is counted once (trees: never fewer than the map was made with; rocks: capped low, they are rare).
   * Below it, trees grow back on their old stumps and seed next to living trees; now and then a rock surfaces next to
   * another one or alone in the open, out of people's sight. Never inside the camp's wall line, on roads, by portals or
   * in front of a door.
   */
  private regrow(): void {
    const w = this.w, T = this.T;
    if (T.tree < 0) return;
    for (let mi = 0; mi < w.maps.length; mi++) {
      this.regrowRubble(mi);
      this.regrowHerbs(mi);
      const mp = w.maps[mi]!, tm = mp.tiles, n = this.countRes(mi);
      let tg = this.resTarget[mi];
      if (!tg) {
        let base = 0;
        if (tm.base) for (let k = 0; k < tm.base.length; k++) if (tm.base[k] === T.tree && !w.land.inRing(mi, k % tm.w, (k / tm.w) | 0)) base++;
        tg = this.resTarget[mi] = { tree: Math.max(n.tree, base), rock: 0 };
      }
      tg.rock = mp.def.gen.type === 'wilds' ? ROCKS_WILD : ROCKS_TOWN; // rare, but never mined out for good
      // Trees: about 3 % of what is missing an hour (at least one try).
      const lackT = tg.tree - n.tree;
      for (let tries = lackT > 0 ? Math.min(40, 1 + Math.ceil(lackT * 0.03)) : 0, grown = 0; tries > 0 && grown < Math.max(1, Math.ceil(lackT * 0.03)); tries--) {
        let k = -1;
        if (tm.base && w.rng.chance(0.5)) { // an old stump
          for (let s = 0; s < 60 && k < 0; s++) { const t = w.rng.int(tm.tiles.length); if (tm.base[t] === T.tree && tm.tiles[t] === T.dirt) k = t; }
        } else { // a seed next to a living tree
          for (let s = 0; s < 200 && k < 0; s++) {
            const t = w.rng.int(tm.tiles.length), x = t % tm.w, y = (t / tm.w) | 0;
            if (tm.tiles[t] !== T.tree || w.land.inRing(mi, x, y)) continue;
            const nx = x + w.rng.int(5) - 2, ny = y + w.rng.int(5) - 2;
            if (tm.inside(nx, ny) && (tm.get(nx, ny) === T.grass || tm.get(nx, ny) === T.dirt)) k = ny * tm.w + nx;
          }
        }
        if (k >= 0 && this.growOk(mi, k, 0)) { tm.set(k % tm.w, (k / tm.w) | 0, T.tree); grown++; }
      }
      // Rocks: slowly (one every 7 game hours when a few are missing, up to about one an hour when most are gone).
      let rocksNow = T.rock >= 0 && n.rock < tg.rock ? (w.rng.chance(Math.max(0.15, (tg.rock - n.rock) / tg.rock)) ? 1 : 0) : 0;
      while (rocksNow-- > 0) {
        for (let s = 0; s < 300; s++) {
          let t = w.rng.int(tm.tiles.length);
          if (tm.tiles[t] === T.rock && w.rng.chance(0.6)) { // the cluster grows
            const x = t % tm.w + w.rng.int(3) - 1, y = ((t / tm.w) | 0) + w.rng.int(3) - 1;
            if (!tm.inside(x, y)) continue;
            t = y * tm.w + x;
          }
          if (tm.tiles[t] !== T.grass && tm.tiles[t] !== T.dirt) continue;
          if (!this.growOk(mi, t, 25)) continue;
          tm.set(t % tm.w, (t / tm.w) | 0, T.rock);
          w.emit('regrow', { map: mp.def.id, what: 'rock', tx: t % tm.w, ty: (t / tm.w) | 0 });
          break;
        }
      }
    }
  }
  /**
   * Ruins keep crumbling (imad 2026-11-25: "resources need to regenerate so we don't go extinct"): searched rubble (stone, brick,
   * scrap) comes back slowly on the ruin tiles it came from, about 2 % of what is missing an hour, out of people's sight.
   */
  private regrowRubble(mi: number): void {
    const w = this.w, T = this.T, tm = w.maps[mi]!.tiles;
    if (!tm.base || T.rubble < 0) return;
    let base = 0, now = 0;
    for (let k = 0; k < tm.tiles.length; k++) { if (tm.base[k] === T.rubble) { base++; if (tm.tiles[k] === T.rubble) now++; } }
    const lack = base - now;
    if (lack <= 0) return;
    const want = Math.max(1, Math.ceil(lack * 0.02));
    for (let s = 0, n = 0; s < 400 && n < want; s++) {
      const k = w.rng.int(tm.tiles.length);
      if (tm.base[k] !== T.rubble || tm.tiles[k] !== tm.breaksTo[T.rubble]) continue;
      if (!this.growOk(mi, k, 15, true)) continue;
      tm.set(k % tm.w, (k / tm.w) | 0, T.rubble); n++;
    }
  }
  /**
   * Healing herbs (imad 2026-11-25: first-aid kits "crafted from herbs collected"): patches on grass next to trees, a steady number
   * per map (HERBS_WILD / HERBS_TOWN); picked ones grow back elsewhere, about a quarter of what is missing an hour, out of sight.
   */
  private regrowHerbs(mi: number): void {
    const w = this.w, T = this.T, mp = w.maps[mi]!, tm = mp.tiles;
    if (T.herbs < 0 || T.grass < 0 || T.tree < 0) return;
    let now = 0;
    for (let k = 0; k < tm.tiles.length; k++) if (tm.tiles[k] === T.herbs) now++;
    const lack = (mp.def.gen.type === 'wilds' ? HERBS_WILD : HERBS_TOWN) - now;
    if (lack <= 0) return;
    const want = Math.max(1, Math.ceil(lack * 0.25));
    for (let s = 0, n = 0; s < 600 && n < want; s++) {
      const t = w.rng.int(tm.tiles.length), x = t % tm.w, y = (t / tm.w) | 0;
      if (tm.tiles[t] !== T.tree) continue;
      const nx = x + w.rng.int(5) - 2, ny = y + w.rng.int(5) - 2;
      if (!tm.inside(nx, ny) || tm.get(nx, ny) !== T.grass) continue;
      const k = ny * tm.w + nx;
      if (!this.growOk(mi, k, 10)) continue;
      tm.set(nx, ny, T.herbs); n++;
    }
  }
  /**
   * Use a first-aid kit (imad 2026-11-25): +MEDKIT_HEAL health. Players from the bag screen / the wheel; AI people when hurt
   * (`autoHeal`). Codes: healed / noMedkit / fullHp.
   */
  useMedkit(i: number): { ok: boolean; code: string; hp?: number } {
    const w = this.w, e = w.e, max = w.sc.agents.hp;
    if ((this.inv(i).medkit ?? 0) < 1) return { ok: false, code: 'noMedkit' };
    if (e.hp[i]! >= max - 1) return { ok: false, code: 'fullHp', hp: Math.round(e.hp[i]!) };
    this.add(i, 'medkit', -1);
    e.hp[i] = Math.min(max, e.hp[i]! + MEDKIT_HEAL);
    w.emit('heal', { id: e.id(i), who: e.id(i), hp: Math.round(e.hp[i]!), kit: true });
    return { ok: true, code: 'healed', hp: Math.round(e.hp[i]!) };
  }
  /** AI people use a kit when badly hurt and not in the middle of a fight (every 20 ticks). */
  autoHeal(): void {
    const w = this.w, e = w.e, max = w.sc.agents.hp;
    for (let i = 0; i < e.hi; i++) {
      if (e.kind[i] !== Kind.Agent || e.hp[i]! <= 0 || e.hp[i]! > max * 0.55 || e.act[i] === Act.Fight) continue;
      if (w.family.dependent(i)) continue;
      if ((this.inv(i).medkit ?? 0) > 0) this.useMedkit(i);
    }
  }
  /** Trees (outside the ring nobody can cut) and rocks on map m. */
  countRes(m: number): { tree: number; rock: number } {
    const tm = this.w.maps[m]!.tiles, T = this.T;
    let tree = 0, rock = 0;
    for (let k = 0; k < tm.tiles.length; k++) {
      const t = tm.tiles[k];
      if (t === T.tree) { if (!this.w.land.inRing(m, k % tm.w, (k / tm.w) | 0)) tree++; }
      else if (t === T.rock) rock++;
    }
    return { tree, rock };
  }
  /** May something grow on tile k (nobody within `sight` metres, away from the camp, homes, doors, roads and portals)? */
  private growOk(m: number, k: number, sight: number, ruin = false): boolean {
    const w = this.w, tm = w.maps[m]!.tiles, x = k % tm.w, y = (k / tm.w) | 0;
    if (w.land.inRing(m, x, y) || this.homes.at(m, k) || this.occupied(m, x, y)) return false;
    const p = this.perimeter(m);
    if (p && Math.hypot(x - p.x, y - p.y) < p.r + 4) return false;
    for (const q of w.portals) if ((q.from === m && Math.hypot(q.x - x, q.y - y) < 6) || (q.dest === m && Math.hypot(q.toX - x, q.toY - y) < 6)) return false;
    if (!ruin) for (const [dx, dy] of [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1]] as const) if (tm.inside(x + dx, y + dy) && tm.get(x + dx, y + dy) === 3 /* road */) return false;
    if (this.aprons(m).has(k)) return false;
    if (sight > 0) {
      const e = w.e;
      for (let i = 0; i < e.hi; i++) if ((e.kind[i] === Kind.Agent || e.kind[i] === Kind.Player) && e.map[i] === m && Math.hypot(e.x[i]! - x, e.y[i]! - y) < sight) return false;
    }
    return true;
  }

  /**
   * The map's leader: the adult (16+) people would follow (courage, a good mind, kindness, strength, level). A leader stays
   * until someone clearly better comes (or they die / leave). Event `leader` when it changes.
   */
  pickLeader(m: number): number {
    const w = this.w, e = w.e, cur = this.leader[m] ?? -1;
    const score = (i: number): number => {
      const p = w.profileOf(i);
      if (!p || ageOf(p, w.gameSec, w.yearSec) < 16 || p.player) return -1;
      const t = p.traits;
      return t.courage * 1.2 + t.intelligence + t.empathy * 0.8 + t.strength * 0.4 + levelOf(p.xp) * 0.15;
    };
    let best = -1, bs = -1, curScore = -1;
    for (let i = 0; i < e.hi; i++) {
      if (e.kind[i] !== Kind.Agent || e.map[i] !== m) continue;
      const v = score(i);
      if (e.id(i) === cur) curScore = v;
      if (v > bs) { bs = v; best = e.id(i); }
    }
    const next = curScore >= 0 && bs < curScore + 0.25 ? cur : best;
    if (next !== cur) { this.leader[m] = next; if (next >= 0) w.emit('leader', { id: next, map: w.maps[m]!.def.id, name: w.profiles.get(next)?.name ?? '' }); }
    return next;
  }
  /** Guards on duty on map m. */
  guards(m: number): number { let n = 0; for (const j of this.jobs.values()) if (j.kind === 'guard' && j.m === m) n++; return n; }
  /**
   * The night watch (imad 2026-11-21: "basic survival knowledge"): from dusk to dawn, with a camp, a few of the people still on their feet
   * stand at a post on the camp's ring (the four ways in take turns), 2 when zombies are about and 1 otherwise (from 3 people up).
   * The bravest and strongest take the post (courage x1.2, strength x0.6, a weapon, the leader first); the timid and the hurt never.
   * The shift lasts 3 game hours; whoever is hungry, thirsty or worn out is relieved.
   */
  private watch(m: number, hour: number): void {
    const w = this.w, e = w.e, camp = this.camp[m];
    if (!camp || !(hour >= 20 || hour < 5)) return;
    const people: number[] = [];
    for (let i = 0; i < e.hi; i++) if (e.kind[i] === Kind.Agent && e.map[i] === m && !(e.flags[i]! & 32)) people.push(i);
    if (people.length < 3) return;
    const threat = w.zombies.perNight > 0 || w.zombies.count(m) > 0 || w.zombies.plans.some((x) => x.map === w.maps[m]!.def.id);
    const want = threat && people.length >= 5 ? 2 : 1;
    let have = this.guards(m);
    if (have >= want) return;
    const lid = this.leader[m] ?? -1;
    const fit = people.filter((i) => !this.jobs.has(e.id(i)) && !w.profileOf(i)?.mind?.task && !w.brain.orderOf(i).kind && e.hp[i]! > 60 && e.hunger[i]! < 60 && e.thirst[i]! < 60 && e.tired[i]! < 65 && !w.rules.forbidden(i, 'fight')
      && (w.profileOf(i)?.traits.courage ?? 0.5) > 0.4)
      .sort((a, b) => this.guardScore(b, lid) - this.guardScore(a, lid));
    for (const i of fit) {
      if (have >= want) break;
      const post = this.post(m, have + (Math.floor(w.gameSec / (3 * HOUR)) % 4));
      if (!post) return;
      const j: Job = { kind: 'guard', m, tx: Math.floor(post.x), ty: Math.floor(post.y), work: 0, n: w.gameSec + 3 * HOUR };
      const tm = w.maps[m]!.tiles;
      if (!w.brain.job(i, post.x, post.y, post.x + Math.cos(((have * 90 + 45) * Math.PI) / 180) * 3, post.y + Math.sin(((have * 90 + 45) * Math.PI) / 180) * 3, Act.Idle)) continue;
      void tm;
      this.jobs.set(e.id(i), j); this.ended.delete(e.id(i));
      have++;
      w.emit('guard', { id: e.id(i), map: w.maps[m]!.def.id });
    }
  }
  private guardScore(i: number, lid: number): number {
    const t = this.w.profileOf(i)?.traits;
    return (t?.courage ?? 0.5) * 1.2 + (t?.strength ?? 0.5) * 0.6 + (this.weapon(i)[1] > 0 ? 0.3 : 0) + (this.w.e.id(i) === lid ? 0.2 : 0) + this.w.rng.next() * 0.1;
  }
  /** A post on the camp's ring: one of the four ways in (k = 0..3), 7 tiles from the fire. */
  private post(m: number, k: number): { x: number; y: number } | null {
    const camp = this.camp[m]!, a = ((k % 4) * 90 * Math.PI) / 180;
    const R = this.perimeter(m)!.r - 2;
    return this.w.freeSpot(m, camp.x + Math.cos(a) * R, camp.y + Math.sin(a) * R, 6);
  }
  /** People of map m who could take some work now (awake, not hungry / thirsty / worn out, no task or job, not a child). */
  private freeOf(m: number): { free: number[]; all: number[] } {
    const w = this.w, e = w.e, free: number[] = [], all: number[] = [];
    for (let i = 0; i < e.hi; i++) {
      if (e.kind[i] !== Kind.Agent || e.map[i] !== m) continue;
      all.push(i);
      if (w.profileOf(i)?.mind?.task || this.jobs.has(e.id(i)) || w.brain.orderOf(i).kind || e.flags[i]! & 32) continue;
      if (e.hunger[i]! > 60 || e.thirst[i]! > 60 || e.tired[i]! > 75 || e.act[i] === Act.Sleep || e.lonely[i]! > 40) continue; // lonely people go and talk first (the brain)
      free.push(i);
    }
    return { free, all };
  }
  /** Hand out the camp's goals (sim/colony.ts); the leader says what the work is now and then. */
  private goapPass(m: number, free: number[], hour: number, by: (i: number) => string, lid: number): void {
    const w = this.w, e = w.e;
    const { all, free: ready } = this.freeOf(m);
    const n = w.colony.allocate(m, free.filter((i) => ready.includes(i)), all, hour, by);
    const ls = lid >= 0 ? e.slot(lid) : -1;
    if (n >= 1 && ls >= 0 && e.map[ls] === m && (this.toldAt[m] ?? -1e9) < w.gameSec - 6 * HOUR) {
      this.toldAt[m] = w.gameSec;
      const threat = w.zombies.perNight > 0 || w.zombies.count(m) > 0;
      w.speak(ls, threat ? 'Zombies are coming. Everyone: doors, walls and weapons!' : 'Everyone has work today: let us make this camp a home.');
    }
  }
  /** Between the hours: whoever became free gets work at once (planning only, no new leader, no care round). */
  private quarter(): void {
    const w = this.w, hour = w.brain.hour();
    for (let m = 0; m < w.maps.length; m++) {
      const { free } = this.freeOf(m);
      if (!free.length) continue;
      const lid = this.leader[m] ?? -1, lname = lid >= 0 ? w.profiles.get(lid)?.name ?? '' : '';
      w.colony.allocate(m, free, this.freeOf(m).all, hour, (i) => (lid >= 0 && w.e.id(i) !== lid ? lname : 'myself'));
    }
  }
  /** The leader of map m by name ('' = none). */
  leaderName(m: number): string { const id = this.leader[m] ?? -1; return id >= 0 ? this.w.profiles.get(id)?.name ?? '' : ''; }

  /**
   * People prepare on their own (no AI needed; the AI's plans and commands come on top): in the evening someone lights
   * a fire where the group is if none burns there, someone with wood feeds a fire that is low, by day the group builds
   * huts until there is a roof for about every two people, and the others make an axe or gather a wood pile.
   */
  private ownPlans(): void {
    const w = this.w, e = w.e, hour = w.brain.hour();
    if (!this.enabled) return;
    for (let mi = 0; mi < w.maps.length; mi++) this.watch(mi, hour);
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
      if (!n) { this.leader[mi] = -1; continue; }
      const lid = this.pickLeader(mi), lname = lid >= 0 ? w.profiles.get(lid)?.name ?? '' : '';
      if (!free.length) continue;
      // The leader hands out the work: each job to who fits it best (strength builds, speed and courage hunt, kindness cares,
      // a good mind farms and crafts); the leader's own work is their own.
      const by = (i: number) => (lid >= 0 && e.id(i) !== lid ? lname : 'myself');
      const start = (i: number, what: string, steps: Parameters<typeof w.tasks.start>[3]) => w.tasks.start(i, what, by(i), steps);
      const best = (score: (x: number) => number) => {
        let k = -1, bs = -Infinity;
        free.forEach((x, j) => { const v = score(x) + w.rng.next() * 0.15; if (v > bs) { bs = v; k = j; } });
        return k >= 0 ? free.splice(k, 1)[0]! : -1;
      };
      const tr = (x: number) => w.profileOf(x)?.traits ?? { strength: 0.5, speed: 0.5, intelligence: 0.5, courage: 0.5, empathy: 0.5, metabolism: 0.5 };
      const pick = () => free.splice(w.rng.int(free.length), 1)[0]!;
      const take = (pred: (i: number) => boolean) => { const k = free.findIndex(pred); return k >= 0 ? free.splice(k, 1)[0]! : -1; };
      // Care first: a hungry child gets food from a parent (or anyone free); the wounded get their wounds dressed.
      for (let c = 0; c < e.hi && free.length; c++) {
        if (e.kind[c] !== Kind.Agent || e.map[c] !== mi || !(e.flags[c]! & 32) || e.hunger[c]! < 45 || e.carry[c]! > 0) continue;
        const parents = w.profileOf(c)?.parents ?? [];
        let i = take((x) => parents.includes(e.id(x)));
        if (i < 0) i = best((x) => tr(x).empathy);
        start(i, `feed ${w.profileOf(c)?.name ?? 'the child'}`, [{ do: 'bring', who: e.id(c) }]);
      }
      for (let h = 0; h < e.hi && free.length; h++) {
        if (e.kind[h] !== Kind.Agent || e.map[h] !== mi || e.hp[h]! >= 60) continue;
        const i = (() => { const k = free.filter((x) => x !== h).sort((a, b) => tr(b).empathy - tr(a).empathy)[0]; if (k === undefined) return -1; free.splice(free.indexOf(k), 1); return k; })();
        if (i >= 0) start(i, `treat ${w.profileOf(h)?.name ?? 'the wounded'}`, [{ do: 'heal', who: e.id(h) }]);
      }
      if (w.ai.goap) { // the camp's drives and each person's own plan (sim/colony.ts) instead of the fixed list below
        this.goapPass(mi, free, hour, by, lid);
        continue;
      }
      if (!free.length || building) continue;
      const camp = this.camp[mi], cx = camp?.x ?? sx / n, cy = camp?.y ?? sy / n;
      const evening = hour >= 16 && hour < 23;
      const fire = this.fireNear(mi, cx, cy, camp ? 15 : 30);
      if (evening && fire < 0) { start(pick(), 'make a campfire for the night', [{ do: 'build', what: 'campfire' }]); continue; }
      if (fire >= 0 && this.fuel(mi, fire) < 3 && free.length) {
        const k = free.findIndex((i) => (this.inv(i).wood ?? 0) > 0);
        const i = k >= 0 ? free.splice(k, 1)[0]! : pick();
        start(i, 'keep the fire going', [{ do: 'tend' }]);
      }
      if (!free.length || hour < 7 || hour >= 18) continue;
      if (this.homes.needed(mi) > 0 && w.rng.chance(0.6)) { start(best((x) => tr(x).strength), 'build a hut to sleep in', [{ do: 'build', what: 'hut' }]); continue; }
      if (!free.length) continue;
      // Walls zombies broke are mended; a store of food for bad days; a field near the camp; ruins searched; spears.
      if (camp && this.damaged(mi) >= 0) { start(best((x) => tr(x).strength), 'repair the huts', [{ do: 'repair' }]); if (!free.length) continue; }
      // Doors on the huts, then a wall round the camp with 4 ways in, then spikes outside it (imad 2026-11-20). Faster when zombies come.
      if (camp && this.huts[mi]!.length) {
        const threat = w.zombies.perNight > 0 || w.zombies.plans.some((x) => x.map === w.maps[mi]!.def.id) || w.zombies.count(mi) > 0;
        const [up, left] = this.campDefence(mi);
        let jobs = 0;
        if ((this.doorSite(mi) >= 0 || this.gateSite(mi) >= 0) && free.length && w.rng.chance(threat ? 0.8 : 0.4)) { start(best((x) => tr(x).intelligence), 'put a door on a hut', [{ do: 'build', what: 'door' }]); jobs++; }
        const crew = threat ? Math.min(3, Math.ceil(free.length / 2)) : w.rng.chance(0.3) ? 1 : 0;
        for (let k = 0; k < crew && left > 0 && free.length; k++) { start(best((x) => tr(x).strength), 'build the wall round the camp', [{ do: 'build', what: (this.inv(free[0]!).brick ?? 0) >= 2 ? 'stonewall' : 'palisade' }]); jobs++; }
        if (left === 0 && up > 0 && threat && free.length && this.defenceSite(mi, 'spikes') >= 0 && w.rng.chance(0.5)) { start(best((x) => tr(x).courage), 'put spikes outside the wall', [{ do: 'build', what: 'spikes' }]); jobs++; }
        // The leader says what the day's work is, now and then.
        const ls = lid >= 0 ? e.slot(lid) : -1;
        if (jobs && ls >= 0 && e.map[ls] === mi && (this.toldAt[mi] ?? -1e9) < w.gameSec - 6 * HOUR) {
          this.toldAt[mi] = w.gameSec;
          w.speak(ls, threat ? (left > 0 ? 'Zombies are coming. Everyone: doors on the huts and a wall round the camp!' : 'The wall stands. Spikes outside it, and keep the fire going!') : 'Let us make the camp safe: doors first, then a wall.');
        }
        if (!free.length) continue;
      }
      const carrier = take((x) => e.carry[x]! >= 3);
      if (carrier >= 0 && camp) { start(carrier, 'put food in the store', [{ do: 'store', what: 'food' }]); if (!free.length) continue; }
      const st = this.stash[mi];
      if (camp && (st?.food ?? 0) < n * 2 && w.rng.chance(0.5)) { start(best((x) => tr(x).empathy), 'collect food and store it', [{ do: 'collect', what: 'food', times: 3 }, { do: 'store', what: 'food' }]); if (!free.length) continue; }
      const fields = [...this.farms.keys()].filter((k) => k.startsWith(mi + ':')).length;
      if (camp && fields < Math.ceil(n / 2) && w.rng.chance(0.35)) { start(best((x) => tr(x).intelligence), 'plant a field', [{ do: 'farm' }]); if (!free.length) continue; }
      // First-aid kits (imad 2026-11-25): a kind person picks herbs and makes one when nobody here has a kit.
      if (this.T.herbs >= 0 && w.rng.chance(0.3) && !free.some((x) => (this.inv(x).medkit ?? 0) > 0)) {
        const hl = best((x) => tr(x).empathy + tr(x).intelligence * 0.5), hv = this.inv(hl);
        if ((hv.herb ?? 0) >= 3 && (hv.leather ?? 0) >= 1) start(hl, 'make a first-aid kit', [{ do: 'craft', what: 'medkit' }]);
        else if ((hv.herb ?? 0) < 3) start(hl, 'pick herbs for a first-aid kit', [{ do: 'gather', what: 'herb', times: 3 - (hv.herb ?? 0) }, ...((hv.leather ?? 0) >= 1 ? [{ do: 'craft', what: 'medkit' }] : [])]);
        if (!free.length) continue;
      }
      const i = best((x) => (tr(x).speed + tr(x).courage) / 2 + (this.weapon(x)[1] > 0 ? 0.2 : 0));
      const v = this.inv(i), hasW = this.weapon(i)[1] > 0;
      const prey = w.animals.nearest(mi, e.x[i]!, e.y[i]!, 70);
      if ((v.leather ?? 0) >= 2 && !(v.clothes ?? 0) && !(v.armor ?? 0)) w.tasks.start(i, (v.ore ?? 0) >= 1 ? 'make armour' : 'make clothes', 'myself', [{ do: 'craft', what: (v.ore ?? 0) >= 1 ? 'armor' : 'clothes' }]);
      else if ((v.ore ?? 0) >= 1 && (v.wood ?? 0) >= 1 && !(v.sword ?? 0)) start(i, 'make a sword', [{ do: 'craft', what: 'sword' }]);
      else if (prey >= 0 && (hasW || e.sub[prey]! < 2) && ((st?.food ?? 0) < n * 2 || e.hunger[i]! > 40) && w.rng.chance(0.45)) start(i, 'go hunting', [{ do: 'hunt' }]);
      else if (camp && this.huts[mi]!.length && w.rng.chance(0.12) && this.countTiles(mi, this.T.bed) < this.huts[mi]!.length) start(i, 'put a bed in a hut', [{ do: 'build', what: 'bed' }]);
      else if (camp && w.rng.chance(0.1) && !this.lampNear(mi, camp.x, camp.y, 10)) start(i, 'put a lamp at the camp', [{ do: 'build', what: 'lamp' }]);
      else if (!(this.inv(i).spear ?? 0) && (this.inv(i).scrap ?? 0) >= 1 && w.zombies.perNight > 0 && w.rng.chance(0.5)) start(i, 'make a spear', [{ do: 'craft', what: 'spear' }]);
      else if (w.rng.chance(0.2)) start(i, 'search the ruins', [{ do: 'loot', times: 2 }]);
      else if (!(this.inv(i).axe ?? 0) && w.rng.chance(0.5)) start(i, 'make an axe', [{ do: 'craft', what: 'axe' }]);
      else if ((this.inv(i).wood ?? 0) < 6 && w.rng.chance(0.4)) start(i, 'gather firewood', [{ do: 'gather', what: 'wood', times: 4 }]);
    }
  }
}
