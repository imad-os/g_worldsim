import { Act, ANIMAL_NAMES, Kind, dropSub, dropKindOf, HUT_NEED, HUT_SIZE, INSIDE_ONLY, BOX_CAP, HANDS, WATER_FILL, WATER_DRINK, boxHolds, RECIPES_ALL, RESOURCES, PLACEABLE, MEDKIT_HEAL, matchRecipe, type Recipe } from '@worldsim/protocol';
import { NO_MAP } from './entities.js';
import { ageOf, levelOf } from './people.js';
import type { World } from './world.js';
import { flood, hutAt, walkableNear } from './structures.js';
import { Homes, HUTS_PER_MAP } from './homes.js';

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
/** What one person carries of a thing (imad 2026-11-27: the bag doubled, 20 -> 40; arrows 30 -> 60). */
export const CAP = 40;
export const ARROW_CAP = 60;
export const capOf = (k: string): number => (k === 'arrows' ? ARROW_CAP : CAP);
/** A pile on the ground (Survival.drops). */
export interface Drop { what: string; n: number; at: number }
/** Things made from a recipe (crafting, shared with the viewer: @worldsim/protocol craft.ts) plus the hut. */
export const RECIPES: Record<string, Inv> = { hut: { ...HUT_NEED } };
for (const r of RECIPES_ALL) RECIPES[r.what] ??= r.need;
/** What pulling down `what` gives back: half of each ingredient (rounded down), at least 1 of the biggest. A field gives back its seeds' worth of nothing. */
export function refundOf(what: string): [string, number][] {
  const need = RECIPES[what];
  if (!need) return [];
  const out = Object.entries(need).map(([k, n]) => [k, Math.floor((n ?? 0) / 2)] as [string, number]).filter(([, n]) => n > 0);
  if (!out.length) { const big = Object.entries(need).sort((x, y) => (y[1] ?? 0) - (x[1] ?? 0))[0]; if (big) out.push([big[0], 1]); }
  return out;
}
/** Kept in the inventory (not put down): weapons, arrows and clothes. */
const KEEP = new Set(['sword', 'axe', 'spear', 'bow', 'arrows', 'clothes', 'armor', 'helmet']);
/** Game seconds of work. */
const WORK = { fill: 30, wreck: 90, chop: 120, dig: 100, mine: 240, place: 40, fire: 240, hut: 50, tend: 45, pick: 20, store: 40, take: 30, loot: 150, plant: 180, repair: 60, heal: 120, guard: 300 } as const;
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
interface Job { kind: JobKind; m: number; tx: number; ty: number; work: number; dir?: number; tiles?: number[]; tries?: number; why?: string; who?: number; what?: string; n?: number; box?: number }
const LAMP_R = 3.5, BED_R = 1.3;
/** How far a player can aim a build (metres). */
export const PLACE_REACH = 8;
/** Door directions (outwards): south, east, north, west. */
const DIRS = [[0, 1], [1, 0], [0, -1], [-1, 0]] as const;

/** Job kinds under the names the owner's rules use (sim/rules.ts). */
const JOB_RULE: Record<string, string> = { fill: 'gather', wreck: 'build', chop: 'gather', dig: 'gather', mine: 'gather', fire: 'build', hut: 'build', place: 'build', pick: 'collect', plant: 'farm' };

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
  readonly T: { tree: number; rubble: number; campfire: number; ashes: number; woodwall: number; floor: number; dirt: number; grass: number; water: number; crate: number; farm: number; rock: number; lamp: number; bed: number; door: number; doorOpen: number; herbs: number; fridge: number; chest: number };
  /** What each fridge / chest holds (imad 2026-11-26): `${map}:${tile}` -> things. */
  readonly boxes = new Map<string, Inv>();
  /** Each hut's size (tiles a side) by `${map}:${out}`: new huts 7 (HUT_SIZE), huts from before 5. */
  readonly hutSz = new Map<string, number>();
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
    this.T = { tree: id('tree'), rubble: id('rubble'), campfire: id('campfire'), ashes: id('ashes'), woodwall: id('woodwall'), floor: id('floor'), dirt: id('dirt'), grass: id('grass'), water: id('water'), crate: id('crate'), farm: id('farm'), rock: id('rock'), lamp: id('lamp'), bed: id('bed'), door: id('door'), doorOpen: id('dooropen'), herbs: id('herbs'), fridge: id('fridge'), chest: id('chest') };
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
    return { drops: [...this.drops], colony: this.w.colony.save(), fires: [...this.fires], camp: this.camp, stash: this.stash, farms: [...this.farms], looted: [...this.looted], huts: this.huts, hutDir: this.hutDir, walls: this.walls, pinv: [...this.pinv], homes: this.homes.save(), res: this.resTarget, own: [...this.owners], boxes: [...this.boxes], hsz: [...this.hutSz] };
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
    this.drops.clear(); for (const [k, x] of (v as { drops?: [number, Drop][] }).drops ?? []) if (this.w.e.slot(k) >= 0) this.drops.set(k, x);
    const vb = v as { boxes?: [string, Inv][]; hsz?: [string, number][] };
    this.boxes.clear(); for (const [k, x] of vb.boxes ?? []) this.boxes.set(k, x);
    this.hutSz.clear(); for (const [k, n] of vb.hsz ?? []) this.hutSz.set(k, n);
    this.w.colony.load((v as { colony?: unknown }).colony);
    this.homes.load((v as { homes?: unknown }).homes);
    const rt = (v as { res?: ({ tree: number; rock: number } | null)[] }).res;
    rt?.forEach((r, m) => { if (m < this.resTarget.length) this.resTarget[m] = r; });
    this.owners.clear(); for (const [k, id] of (v as { own?: [string, number][] }).own ?? []) this.owners.set(k, id);
  }
  campOf(m: number): { x: number; y: number } | null { return this.camp[m] ?? null; }
  /** The camp person (slot) i belongs to on their map: their clan's own camp when it has one (sim/clans.ts CLAN_CAMP_AT), else the map's. */
  campFor(i: number): { x: number; y: number } | null {
    const m = this.w.e.map[i]!;
    return this.w.clans.campOf(this.w.e.id(i), m) ?? this.camp[m] ?? null;
  }
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
    let r = Math.sqrt((roofs * (HUT_SIZE + 2.5) ** 2 + 60) / Math.PI) + 2.5;
    for (const out of this.huts[m]!) {
      const h = this.hutRect(m, out, this.hutDir[m]![this.huts[m]!.indexOf(out)] ?? 0);
      if (!h) continue;
      for (const [x, y] of [[h.x0, h.y0], [h.x0 + h.s, h.y0], [h.x0, h.y0 + h.s], [h.x0 + h.s, h.y0 + h.s]] as const) {
        const d = Math.hypot(x - c.x, y - c.y);
        if (d < 32) r = Math.max(r, d + 2);
      }
    }
    void tm;
    return Math.min(32, Math.max(9, Math.ceil(r))); // 7 x 7 huts (a hut sited at the edge, 26 m out, needs 29) (imad 2026-11-26) need a wider circle in the town's blocks
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
  /** A hut's square (s tiles a side: 7 now, 5 for huts from before) from the tile in front of its door and the way the door faces. */
  hutRect(m: number, out: number, dir: number, size?: number): { x0: number; y0: number; door: number; inside: number; dx: number; dy: number; s: number } | null {
    if (out < 0) return null;
    const s = size ?? this.sizeOf(m, out, dir), H = (s - 1) >> 1;
    const W = this.w.maps[m]!.tiles.w, [dx, dy] = DIRS[dir] ?? DIRS[0]!;
    const ox = out % W, oy = (out / W) | 0, cx = ox - dx * (H + 1), cy = oy - dy * (H + 1);
    return { x0: cx - H, y0: cy - H, door: (oy - dy) * W + ox - dx, inside: (oy - dy * 2) * W + ox - dx * 2, dx, dy, s };
  }
  /** How big hut `out` is: as recorded when it went up, else read from its walls (the room's depth behind the door), else 5 (old huts). */
  sizeOf(m: number, out: number, dir = 0): number {
    const key = `${m}:${out}`, known = this.hutSz.get(key);
    if (known) return known;
    const tm = this.w.maps[m]?.tiles;
    if (!tm || out < 0) return 5;
    const [dx, dy] = DIRS[dir] ?? DIRS[0]!, ox = out % tm.w, oy = (out / tm.w) | 0;
    let n = 0;
    for (let k = 2; k <= HUT_SIZE; k++) { // past the doorway: count the room's tiles up to the back wall
      const x = ox - dx * k, y = oy - dy * k;
      if (!tm.inside(x, y)) break;
      const t = tm.get(x, y);
      if (t === this.T.woodwall || t === this.placeTile.get('window')) break;
      n++;
    }
    const s = n >= HUT_SIZE - 2 ? HUT_SIZE : 5;
    this.hutSz.set(key, s);
    return s;
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
    // Old farms (generated farm tiles, Willow Farms): one in 16 still bears, like a field someone planted (berries every 12 h, staggered).
    w.maps.forEach((mp, mi) => {
      const tm = mp.tiles;
      if (mp.def.gen.type !== 'farms' || !tm.base || this.T.farm < 0 || [...this.farms.keys()].some((k) => k.startsWith(mi + ':'))) return;
      for (let k = 0; k < tm.base.length; k++) {
        const x = k % tm.w, y = (k / tm.w) | 0;
        if (tm.base[k] === this.T.farm && tm.tiles[k] === this.T.farm && x % 4 === 0 && y % 4 === 0) this.farms.set(`${mi}:${k}`, w.gameSec + ((x + y) % 12) * HOUR);
      }
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
      if (k === 'meat') { const g = this.dropTo; if (g && g.i === i && this.dropAt(g.m, g.x, g.y, 'meat', n)) continue; this.addFood(i, n); }
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
  /** The nearest bed within r metres that person i may lie in (their home's, a free hut's, or one in the open): tile, or -1. */
  bedNear(i: number, r: number): number {
    if (this.T.bed < 0) return -1;
    const e = this.w.e, m = e.map[i]!, tm = this.w.maps[m]!.tiles, x = e.x[i]!, y = e.y[i]!, R = Math.ceil(r);
    let best = -1, bd = r;
    for (let yy = Math.floor(y) - R; yy <= Math.floor(y) + R; yy++) for (let xx = Math.floor(x) - R; xx <= Math.floor(x) + R; xx++) {
      if (!tm.inside(xx, yy) || tm.tiles[yy * tm.w + xx] !== this.T.bed) continue;
      const k = yy * tm.w + xx, d = Math.hypot(xx + 0.5 - x, yy + 0.5 - y);
      if (d < bd && this.homes.mayEnter(i, m, k)) { bd = d; best = k; }
    }
    return best;
  }
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
    const cap = capOf(r.what);
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
    if (what === 'fridge' || what === 'chest') this.boxes.set(`${m}:${k}`, {});
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
    // On the ground between the tile and me (a player played by hand picks it up: A).
    const cx = tx + 0.5, cy = ty + 0.5, dd = Math.hypot(e.x[i]! - cx, e.y[i]! - cy) || 1, gx = cx + ((e.x[i]! - cx) / dd) * Math.min(0.9, dd * 0.6), gy = cy + ((e.y[i]! - cy) / dd) * Math.min(0.9, dd * 0.6);
    const got = this.ground(i, m, gx, gy, () => this.take1(i, m, tx, ty, t));
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
  // ------------------------------------------------------------------ piles on the ground (protocol drops.ts)
  /** Piles a player's work dropped: entity id -> what, how many, when (game s). Saved. */
  readonly drops = new Map<number, Drop>();
  /** While set, what person `i` gets lands on the ground at (x, y) instead of in their bag (`ground`). */
  private dropTo: { i: number; m: number; x: number; y: number } | null = null;
  /**
   * What a player gets by `fn` (chopping, mining, a kill, pulling down) drops on the ground at (x, y) on map m, to pick up by hand
   * (imad 2026-11-27: "the items drop on the ground and I pick them up, not into the bag by magic"). Only a character played by hand;
   * AI people (and players on autopilot) still put it straight into their bag.
   */
  ground<T>(i: number, m: number, x: number, y: number, fn: () => T): T {
    if (this.w.e.kind[i] !== Kind.Player || this.dropTo) return fn();
    this.dropTo = { i, m, x, y };
    try { return fn(); } finally { this.dropTo = null; }
  }
  /** A pile of n `what` at (x, y) (added to a pile of the same within 1.2 m). False when the world is full (then nothing dropped). */
  dropAt(m: number, x: number, y: number, what: string, n: number): boolean {
    const w = this.w, e = w.e, sub = dropSub(what);
    for (const [id, d] of this.drops) {
      const j = e.slot(id);
      if (j < 0 || d.what !== what || e.map[j] !== m || Math.hypot(e.x[j]! - x, e.y[j]! - y) > 1.2) continue;
      d.n += n; d.at = w.gameSec; return true;
    }
    const tm = w.maps[m]!.tiles;
    let px = x + w.rng.range(-0.35, 0.35), py = y + w.rng.range(-0.35, 0.35);
    if (tm.isSolidAt(px, py)) { px = x; py = y; }
    if (tm.isSolidAt(px, py)) { const s = w.freeSpot(m, x, y, 4); if (s) { px = s.x; py = s.y; } }
    if (e.room === 0) w.makeRoom(1);
    const j = e.create(Kind.Item, m, px, py, 0.2);
    if (j < 0) return false;
    e.sub[j] = sub;
    this.drops.set(e.id(j), { what, n, at: w.gameSec });
    return true;
  }
  /** Is item slot j a pile (not food of the scenario)? */
  isDrop(j: number): boolean { return dropKindOf(this.w.e.sub[j]!) !== '' && this.drops.has(this.w.e.id(j)); }
  /** Player i picks up every pile within r m (as much as the bag / hands hold): what was got and whether some was left (full). */
  pickDrops(i: number, r = 2): { got: Record<string, number>; left: boolean } {
    const w = this.w, e = w.e, m = e.map[i]!, got: Record<string, number> = {};
    let left = false;
    for (const [id, d] of [...this.drops]) {
      const j = e.slot(id);
      if (j < 0) { this.drops.delete(id); continue; }
      if (e.map[j] !== m || Math.hypot(e.x[j]! - e.x[i]!, e.y[j]! - e.y[i]!) > r) continue;
      let took = 0;
      if (d.what === 'meat' || d.what === 'food') took = this.addFood(i, d.n);
      else { const before = this.inv(i)[d.what] ?? 0; this.add(i, d.what, d.n); took = (this.inv(i)[d.what] ?? 0) - before; }
      if (took > 0) got[d.what] = (got[d.what] ?? 0) + took;
      d.n -= took;
      if (d.n <= 0) { this.drops.delete(id); w.remove(j, 'taken'); } else left = true;
    }
    if (Object.keys(got).length) w.emit('pickup', { id: e.id(i), item: Object.keys(got).join('+'), player: true, ground: true });
    return { got, left };
  }
  /** Piles left lying 2 game days rot away; piles whose entity is gone are forgotten (hourly). */
  private rotDrops(): void {
    const w = this.w, e = w.e;
    for (const [id, d] of [...this.drops]) {
      const j = e.slot(id);
      if (j < 0 || e.kind[j] !== Kind.Item) { this.drops.delete(id); continue; }
      if (w.gameSec - d.at > 2 * 86400) { this.drops.delete(id); w.remove(j, 'rotted'); }
    }
  }
  add(i: number, k: string, n: number): void {
    if (n > 0 && this.dropTo && this.dropTo.i === i) { const g = this.dropTo; if (this.dropAt(g.m, g.x, g.y, k, n)) return; }
    const v = this.inv(i); v[k] = Math.max(0, Math.min(capOf(k), (v[k] ?? 0) + n)); if (!v[k]) delete v[k]; }
  /** How many of one thing a bag holds (the trade screen asks). */
  capOf(k: string): number { return capOf(k); }
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
    if (w.ai.instinct && type < 0 && e.sub[a] !== 0 && e.sub[a] !== 1 && w.lore.fearOf(i, ANIMAL_NAMES[e.sub[a]!] ?? '') >= 5 && this.weapon(i)[1] < 30) { // a beast the people fear: smaller game
      const b = w.animals.nearest(e.map[i]!, e.x[i]!, e.y[i]!, far, w.rng.chance(0.5) ? 0 : 1); if (b >= 0) a = b;
    }
    if (e.sub[a] === 4 && this.weapon(i)[1] < 30 && type !== 4) { const b = w.animals.nearest(e.map[i]!, e.x[i]!, e.y[i]!, 90, w.rng.chance(0.5) ? 0 : 1); if (b >= 0) a = b; } // not a bear with bare hands
    return w.brain.hunt(i, e.id(a)) ? true : 'I cannot get to it';
  }

  /** Start building a campfire or a hut near (x, y) (default: where they stand). Materials are used when it is done. */
  build(i: number, what: string, x?: number, y?: number): true | string {
    if (!this.enabled) return 'this world has no buildings';
    if (what !== 'campfire' && what !== 'hut') return this.buildThing(i, what);
    // Huts are dear (imad 2026-11-25): someone with no home moves into a free hut instead of building another.
    if (what === 'hut' && this.w.e.kind[i] === Kind.Agent) { const moved = this.homes.moveIn(this.w.e.id(i), this.w.e.map[i]!); if (moved) return moved; }
    if (what === 'hut' && this.homes.builtBy(this.w.e.id(i), this.w.e.map[i]!) >= HUTS_PER_MAP) return `I already built ${HUTS_PER_MAP} huts here, that is the most`;
    if (!this.has(i, RECIPES[what]!)) return `I need ${this.missing(i, what).map(([k, n]) => `${n} ${k}`).join(' and ')}`;
    const e = this.w.e, m = e.map[i]!;
    if (this.w.ai.siting && !this.camp[m] && x === undefined) { const cs = this.campSite(m, e.x[i]!, e.y[i]!); if (cs) this.setCamp(m, cs.x, cs.y); }
    const own = this.w.clans.campOf(e.id(i), m); // a clan with a camp of its own builds there (imad 2026-11-26)
    const camp = own ?? this.camp[m];
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
      const hs = own ? this.hutSiteIn(m, { x: Math.floor(own.x), y: Math.floor(own.y), r: 16 }, own) ?? this.hutSiteIn(m, { x: Math.floor(own.x), y: Math.floor(own.y), r: 24 }, own) : this.hutSite(m);
      if (hs) { x0 = hs.x0; y0 = hs.y0; dir = hs.dir; }
      else { // no room inside the wall: outside, as before (it will not be protected)
        // Close first, so the wall that follows the huts (plannedRadius, up to 28) can still take it in; far only when nothing is near.
        let s0 = this.site(m, cx, cy, HUT_SIZE, HUT_SIZE, 18);
        if (s0 < 0) s0 = this.site(m, cx, cy, HUT_SIZE, HUT_SIZE, 30);
        if (s0 < 0) return 'I found no clear ground for a hut';
        x0 = s0 % W; y0 = (s0 / W) | 0;
      }
    } else {
      const s = this.site(m, cx, cy, HUT_SIZE, HUT_SIZE, 30);
      if (s < 0) return 'I found no clear ground for a hut';
      x0 = s % W; y0 = (s / W) | 0;
    }
    const S = HUT_SIZE, H = (S - 1) >> 1, [ddx, ddy] = DIRS[dir]!, door = (y0 + H + ddy * H) * W + x0 + H + ddx * H;
    // Floor first (inside), then the walls from the back to the front; the doorway stays open.
    const floor: number[] = [], walls: number[] = [];
    for (let yy = 0; yy < S; yy++) for (let xx = 0; xx < S; xx++) {
      const k = (y0 + yy) * W + x0 + xx, edge = xx === 0 || yy === 0 || xx === S - 1 || yy === S - 1;
      if (k === door) continue;
      if (!edge) floor.push(k, this.T.floor);
      else walls.push(k, this.T.woodwall);
    }
    walls.push(door, this.T.door >= 0 ? this.T.door : this.T.floor); // its own door last (imad 2026-11-25: huts come with doors)
    // Stand just outside the door.
    return this.begin(i, { kind: 'hut', m, tx: x0 + H + ddx * (H + 1), ty: y0 + H + ddy * (H + 1), work: 0, tiles: [...floor, ...walls], dir, n: S });
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
    // Before the wall is fixed, a crowded spot may take a wider circle (the wall will follow the huts), up to 24 tiles.
    for (let r = p.r; r <= (this.walls[m] ? p.r : 28); r += 2) { const h = this.hutSiteIn(m, { ...p, r }); if (h) return h; }
    return null;
  }
  private hutSiteIn(m: number, p: { x: number; y: number; r: number }, origin?: { x: number; y: number }): { x0: number; y0: number; dir: number } | null {
    const w = this.w, tm = w.maps[m]!.tiles, camp = origin ?? this.camp[m];
    if (!camp) return null;
    const keep = this.taken(m), cands: [number, number, number, number][] = [];
    const ok = (x: number, y: number, inner: boolean) => {
      if (!tm.inside(x, y)) return false;
      const t = tm.get(x, y), k = y * tm.w + x;
      if (keep.has(k) || t === this.T.campfire) return false;
      return inner ? this.buildable.has(t) : tm.cost[t]! > 0;
    };
    const R = p.r, S = HUT_SIZE, H = (S - 1) >> 1;
    // The village is a cluster (imad 2026-11-26: "camps must be a collection of huts, so the strategy is to stay close for a better
    // defence"): every hut that stands pulls the next one next to it, a one or two tile lane apart (a short wall, neighbours in call).
    const rects: { x0: number; y0: number }[] = [];
    this.huts[m]!.forEach((o, n) => { if (o < 0) return; const r = this.hutRect(m, o, this.hutDir[m]![n] ?? 0); if (r) rects.push(r); });
    const cluster = (x0: number, y0: number) => {
      let v = 0;
      for (const r of rects) {
        const gap = Math.max(Math.max(r.x0 - (x0 + S - 1), x0 - (r.x0 + S - 1)), Math.max(r.y0 - (y0 + S - 1), y0 - (r.y0 + S - 1))) - 1;
        if (gap < 1) continue;
        v += gap <= 2 ? (v ? 0.6 : 1.6) : gap <= 4 ? (v ? 0.2 : 0.7) : 0;
      }
      return v;
    };
    for (let cy = Math.floor(p.y - R); cy <= p.y + R; cy++) for (let cx = Math.floor(p.x - R); cx <= p.x + R; cx++) {
      const d = Math.hypot(cx + 0.5 - (p.x + 0.5), cy + 0.5 - (p.y + 0.5));
      if (d + (H + 0.55) * 1.42 > R - 1.2 || d < H + 2.5) continue;
      const x0 = cx - H, y0 = cy - H;
      let fits = true;
      for (let yy = y0 - 1; yy <= y0 + S && fits; yy++) for (let xx = x0 - 1; xx <= x0 + S && fits; xx++) {
        const inner = xx >= x0 && yy >= y0 && xx < x0 + S && yy < y0 + S;
        if (!ok(xx, yy, inner) || (inner && this.occupied(m, xx, yy))) fits = false;
      }
      if (!fits) continue;
      for (const p0 of w.portals) if (p0.from === m && Math.hypot(p0.x - cx, p0.y - cy) < 8) fits = false;
      if (!fits) continue;
      const ux = (p.x - cx) / (d || 1), uy = (p.y - cy) / (d || 1);
      for (let dir = 0; dir < 4; dir++) {
        const [dx, dy] = DIRS[dir]!;
        // Two tiles of open ground in front of the door.
        const fx = cx + dx * (H + 1), fy = cy + dy * (H + 1);
        if (!ok(fx, fy, false) || !ok(fx + dx, fy + dy, false)) continue;
        const face = dx * ux + dy * uy; // 1 = the door looks at the camp
        cands.push([face * 2 - d * 0.3 + cluster(x0, y0), x0, y0, dir]);
      }
    }
    cands.sort((a2, b2) => b2[0] - a2[0]);
    // Access: test the best few with a flood from the camp's centre, the new walls counted as standing.
    const c0 = walkableNear(tm, camp.x, camp.y, 4);
    if (c0 < 0) return null;
    // Another camp (a clan's own): only the huts round it must stay reachable from its centre.
    const near = (k: number) => !origin || Math.hypot((k % tm.w) - p.x, ((k / tm.w) | 0) - p.y) <= p.r + 8;
    const targets = this.huts[m]!.filter((o) => o >= 0 && near(o));
    const st0 = this.stash[m], st = st0 && near(st0.t) ? st0 : null;
    for (const [, x0, y0, dir] of cands.slice(0, 8)) {
      const [dx, dy] = DIRS[dir]!, door = (y0 + H + dy * H) * tm.w + x0 + H + dx * H, out = door + dy * tm.w + dx;
      const wall = (k: number) => { const x = k % tm.w, y = (k / tm.w) | 0; return x >= x0 && y >= y0 && x < x0 + S && y < y0 + S && (x === x0 || y === y0 || x === x0 + S - 1 || y === y0 + S - 1) && k !== door; };
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
    if (this.homes.builtBy(this.w.e.id(i), this.w.e.map[i]!) >= HUTS_PER_MAP) return 'hutLimit';
    if (!this.has(i, RECIPES.hut!)) return 'needHut';
    const w = this.w, e = w.e, m = e.map[i]!, tm = w.maps[m]!.tiles;
    const a = e.angle[i]!, s = this.site(m, e.x[i]! + Math.cos(a) * 5, e.y[i]! + Math.sin(a) * 5, HUT_SIZE, HUT_SIZE, 20);
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
      const S = HUT_SIZE, H = (S - 1) >> 1;
      const cx = Math.max(tx, Math.min(tx + S - 1, x - 0.5)), cy = Math.max(ty, Math.min(ty + S - 1, y - 0.5));
      if (Math.hypot(cx + 0.5 - x, cy + 0.5 - y) > PLACE_REACH) return 'tooFar';
      const [dx, dy] = DIRS[dir] ?? DIRS[0]!, door = (ty + H + dy * H) * tm.w + tx + H + dx * H;
      for (let yy = 0; yy < S; yy++) for (let xx = 0; xx < S; xx++) {
        const X = tx + xx, Y = ty + yy;
        if (!tm.inside(X, Y) || w.land.inRing(m, X, Y)) return 'noRoom';
        const t = tm.get(X, Y);
        if (!this.buildable.has(t) && t !== 3 /* road */) return 'noRoom';
        const edge = xx === 0 || yy === 0 || xx === S - 1 || yy === S - 1;
        if (edge && Y * tm.w + X !== door && this.occupied(m, X, Y)) return 'someone';
      }
      // The ground in front of the door must be open (a way in).
      const ox = tx + H + dx * (H + 1), oy = ty + H + dy * (H + 1);
      if (!tm.inside(ox, oy) || tm.solid[tm.get(ox, oy)]) return 'doorBlocked';
      if (near(tx + H + 0.5, ty + H + 0.5, H + 4)) return 'noRoom';
      return '';
    }
    const tile = this.placeTile.get(what);
    if (tile === undefined) return 'nothing';
    if (!tm.inside(tx, ty) || w.land.inRing(m, tx, ty)) return 'noRoom';
    if (INSIDE_ONLY.includes(what)) { // a fridge or a chest: on a hut's floor, never on the tile just inside the door (imad 2026-11-26)
      const c = this.insideSpot(i, m, ty * tm.w + tx);
      if (c) return c;
    }
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
      if (this.homes.builtBy(this.w.e.id(i), this.w.e.map[i]!) >= HUTS_PER_MAP) return 'hutLimit';
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
    const S = HUT_SIZE, H = (S - 1) >> 1, [dx, dy] = DIRS[dir] ?? DIRS[0]!, door = (y0 + H + dy * H) * tm.w + x0 + H + dx * H;
    for (let yy = 0; yy < S; yy++) for (let xx = 0; xx < S; xx++) {
      const k = (y0 + yy) * tm.w + x0 + xx, edge = xx === 0 || yy === 0 || xx === S - 1 || yy === S - 1;
      if (edge && k !== door && this.occupied(m, x0 + xx, y0 + yy)) return 'someone';
    }
    this.use(i, RECIPES.hut!);
    for (let yy = 0; yy < S; yy++) for (let xx = 0; xx < S; xx++) {
      const k = (y0 + yy) * tm.w + x0 + xx, edge = xx === 0 || yy === 0 || xx === S - 1 || yy === S - 1;
      if (tm.tiles[k] === this.T.water) continue;
      if (k === door) tm.set(x0 + xx, y0 + yy, this.T.door >= 0 ? this.T.door : this.T.floor);
      else tm.set(x0 + xx, y0 + yy, edge ? this.T.woodwall : this.T.floor);
      if (!edge) w.brain.addShelter(m, k);
    }
    const out = (y0 + H + dy * (H + 1)) * tm.w + x0 + H + dx * (H + 1);
    this.hutSz.set(`${m}:${out}`, S);
    this.huts[m]!.push(out);
    this.hutDir[m]!.push(dir);
    this.homes.built(m, out, dir, e.id(i));
    this.setCamp(m, x0 + H + 0.5 + dx * (H + 2), y0 + H + 0.5 + dy * (H + 2));
    w.emit('build', { id: e.id(i), what: 'hut', map: w.maps[m]!.def.id, tx: x0 + H, ty: y0 + H, player: true });
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
    if (r) for (let yy = 0; yy < r.s; yy++) for (let xx = 0; xx < r.s; xx++) out.push((r.y0 + yy) * W + r.x0 + xx);
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
    const e = this.w.e, W = this.w.maps[m]!.tiles.w, h0 = this.homes.at(m, k);
    // A player's pull-down drops what comes back on the ground (a hut: in front of its door, else where the piece stood).
    const at = h0 ? h0.out : k, ax = (at % W) + 0.5, ay = ((at / W) | 0) + 0.5;
    const dd = Math.hypot(e.x[i]! - ax, e.y[i]! - ay) || 1, gx = ax + ((e.x[i]! - ax) / dd) * Math.min(1, dd * 0.5), gy = ay + ((e.y[i]! - ay) / dd) * Math.min(1, dd * 0.5);
    this.ground(i, m, gx, gy, () => this.pullDown0(i, m, k));
  }
  private pullDown0(i: number, m: number, k: number): void {
    const w = this.w, tm = w.maps[m]!.tiles, h = this.homes.at(m, k), W = tm.w;
    const what = h ? 'hut' : tm.tiles[k] === this.T.doorOpen ? 'door' : [...this.placeTile].find(([, t]) => t === tm.tiles[k])?.[0] ?? (tm.tiles[k] === this.T.farm ? 'field' : 'campfire');
    const cells = this.destroyCells(m, k);
    for (const c of cells) {
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
    }
    // Recycling (imad 2026-11-27: "on destruction it should drop half of the ingredients needed to build"): every built thing gives back half
    // of what it cost, rounded down, and at least one of its main material (a door of 1 wood + 1 ore gives 1 wood).
    for (const [k, n] of refundOf(what === 'door' ? 'door' : what)) this.add(i, k, n);
    for (const c of cells) this.emptyBox(i, m, c); // what was kept in a fridge / chest goes into the bag (the rest is lost)
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
      for (const map of [this.owners, this.fires, this.farms, this.looted, this.boxes, this.hutSz] as Map<string, unknown>[]) for (const key of [...map.keys()]) if (key.startsWith(mi + ':')) map.delete(key);
      for (const [id, j] of [...this.jobs]) if (j.m === mi) this.cancel(id);
      w.brain.resetShelters(mi);
      out.maps++;
    }
    this.tileIdx.clear();
    this.homes.sync();
    w.emit('reset', { what: 'buildings', map: m >= 0 ? w.maps[m]!.def.id : 'all', ...out });
    return out;
  }

  /** Why building `what` is pointless for person i ('' = go ahead): a bed for a home that has one per sleeper already. */
  noNeed(i: number, what: string): string {
    if (what !== 'bed') return '';
    const h = this.homes.homeOf(this.w.e.id(i));
    if (!h || h.m !== this.w.e.map[i] || this.homes.bedsMissing(h) > 0) return '';
    const b = this.homes.bedsIn(h), n = this.homes.sleepers(h).length;
    return `my home already has ${b} bed${b === 1 ? '' : 's'} for ${n} of us: no need for another`;
  }
  /** Should person i make a bed: their home lacks one and they are the one of the couple who does it (not both). */
  bedWanted(i: number): boolean {
    const h = this.homes.homeOf(this.w.e.id(i));
    return !!h && h.m === this.w.e.map[i] && this.homes.bedsMissing(h) > 0 && this.homes.doer(h) === this.w.e.id(i);
  }
  /** Put down a palisade / spikes / wall / door / window / bed / lamp near the camp (a bed: inside a hut). Made first if needed. */
  private buildThing(i: number, what: string): true | string {
    if (!this.placeTile.has(what)) return `I can't build ${what}`;
    if ((this.inv(i)[what] ?? 0) < 1 && !this.has(i, RECIPES[what]!)) return `I need ${this.missing(i, what).map(([k, n]) => `${n} ${k}`).join(' and ')}`;
    const w = this.w, e = w.e, m = e.map[i]!, tm = w.maps[m]!.tiles, camp = this.camp[m];
    let s = -1;
    if (what === 'bed') { // a hut's floor with nothing on it: my own home (one bed per sleeper), else a free hut with no bed yet
      const home = this.homes.homeOf(e.id(i));
      if (home && home.m === m && this.homes.bedsMissing(home) <= 0) {
        const b = this.homes.bedsIn(home);
        return `my home already has ${b} bed${b === 1 ? '' : 's'}, enough for everyone who sleeps there`;
      }
      if (!home) this.homes.sync();
      const outs = home && home.m === m ? [home] : this.homes.free(m).filter((h) => this.homes.bedsIn(h) < 1);
      if (!outs.length) return home ? 'my home is on another map' : 'I have no home to put a bed in';
      for (let n = 0; n < outs.length && s < 0; n++) {
        const h = this.hutRect(m, outs[n]!.out, outs[n]!.dir);
        if (!h) continue;
        // The far side of the room first, never the tile just inside the door (people must get in).
        for (let yy = 1; yy <= h.s - 2 && s < 0; yy++) for (let xx = 1; xx <= h.s - 2 && s < 0; xx++) {
          const k = (h.y0 + (h.dy < 0 ? h.s - 1 - yy : yy)) * tm.w + h.x0 + (h.dx < 0 ? h.s - 1 - xx : xx);
          if (tm.tiles[k] === this.T.floor && k !== h.inside) s = k;
        }
      }
    }
    if (INSIDE_ONLY.includes(what)) { // a fridge / chest: inside MY home (imad 2026-11-26: "must be built only inside the hut")
      const home = this.homes.homeOf(e.id(i));
      if (!home) return `I have no home to put a ${what} in`;
      if (home.m !== m) return 'my home is on another map';
      if (this.boxIn(home, what as 'fridge' | 'chest') >= 0) return `my home already has a ${what}`;
      s = this.boxSite(home);
      if (s < 0) return `there is no free floor in my home for a ${what}`;
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
    if (this.foodRoom(i) <= 0) return 'my hands and my bag are full of food';
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

  /** Put what they carry (food, water or a material) away: food and water into their home's fridge when it has room, else the camp's crate. */
  store(i: number, what: StashKey | 'water'): true | string {
    const e = this.w.e, m = e.map[i]!;
    if ((what === 'food' ? this.foodOf(i) : this.inv(i)[what] ?? 0) <= 0) return `I have no ${what} to store`;
    if (what === 'food' || what === 'water') {
      const f = this.myBox(i, 'fridge', 160, what, true);
      if (f >= 0) { const W = this.W(i); return this.begin(i, { kind: 'store', m, tx: f % W, ty: (f / W) | 0, work: 0, what, box: f }); }
    }
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
  /** Food kept within r metres: my home's fridge first, else the camp's crate: its tile, or -1. */
  stashFood(i: number, r: number): number {
    const f = this.myBox(i, 'fridge', r, 'food');
    if (f >= 0) return f;
    const e = this.w.e, m = e.map[i]!, st = this.stash[m];
    if (!st || st.food <= 0) return -1;
    const W = this.W(i);
    return Math.hypot((st.t % W) + 0.5 - e.x[i]!, ((st.t / W) | 0) + 0.5 - e.y[i]!) <= r ? st.t : -1;
  }
  /** Take one food from the crate into the hands (for a little one), standing next to it. */
  grabFromStash(i: number): boolean {
    const e = this.w.e, st = this.stash[e.map[i]!];
    if (e.carry[i]! < HANDS) { const f = this.boxNear(i, 'fridge', 2.2, 'food'); if (f >= 0) { this.boxOut(e.map[i]!, f, 'food', 1); e.carry[i]!++; return true; } }
    if (!st || st.food <= 0 || e.carry[i]! >= HANDS) return false;
    const W = this.W(i);
    if (Math.hypot((st.t % W) + 0.5 - e.x[i]!, ((st.t / W) | 0) + 0.5 - e.y[i]!) > 2.2) return false;
    st.food--; e.carry[i]!++;
    return true;
  }
  /** Eat from the crate (standing next to it). */
  eatFromStash(i: number): boolean {
    const e = this.w.e, st = this.stash[e.map[i]!];
    const f = this.boxNear(i, 'fridge', 2.2, 'food');
    if (f >= 0) { // from the home's fridge
      this.boxOut(e.map[i]!, f, 'food', 1);
      e.hunger[i] = Math.max(0, e.hunger[i]! - 40);
      this.w.emit('eat', { id: e.id(i), from: 'fridge' });
      return true;
    }
    if (!st || st.food <= 0) return false;
    const W = this.W(i);
    if (Math.hypot((st.t % W) + 0.5 - e.x[i]!, ((st.t / W) | 0) + 0.5 - e.y[i]!) > 2.2) return false;
    st.food--;
    e.hunger[i] = Math.max(0, e.hunger[i]! - 40);
    this.w.emit('eat', { id: e.id(i), from: 'store' });
    return true;
  }

  // ------------------------------------------------------------ food in the bag, water bottles, fridges and chests (imad 2026-11-26)
  /** All the food a person has: in the hands (up to 5) and in the bag. */
  foodOf(i: number): number { return this.w.e.carry[i]! + (this.inv(i).food ?? 0); }
  /** How much more food fits: the hands, then the bag. */
  foodRoom(i: number): number { return Math.max(0, HANDS - this.w.e.carry[i]!) + Math.max(0, CAP - (this.inv(i).food ?? 0)); }
  /** Food found / given / hunted: into the hands, the rest into the bag (imad 2026-11-26: "it says my hands are full (5)"). How many fitted. */
  addFood(i: number, n: number): number {
    if (n > 0 && this.dropTo && this.dropTo.i === i) { const g = this.dropTo; if (this.dropAt(g.m, g.x, g.y, 'food', n)) return n; }
    const e = this.w.e, h = Math.min(n, Math.max(0, HANDS - e.carry[i]!));
    e.carry[i] = e.carry[i]! + h;
    const b = Math.min(n - h, Math.max(0, CAP - (this.inv(i).food ?? 0)));
    if (b > 0) this.add(i, 'food', b);
    return h + b;
  }
  /** Take n food away (hands first, then the bag): how many. */
  useFood(i: number, n: number): number {
    const e = this.w.e, h = Math.min(n, e.carry[i]!);
    e.carry[i] = e.carry[i]! - h;
    const b = Math.min(n - h, this.inv(i).food ?? 0);
    if (b > 0) this.add(i, 'food', -b);
    return h + b;
  }
  /** Empty hands are filled from the bag again (eating, giving and feeding use the hands). */
  refill(i: number): void {
    const e = this.w.e, v = this.inv(i), n = Math.min(HANDS - e.carry[i]!, v.food ?? 0);
    if (n > 0) { e.carry[i] = e.carry[i]! + n; this.add(i, 'food', -n); }
  }
  /** Drink a bottle of water from the bag (anywhere): true = drank. */
  drinkBottle(i: number): boolean {
    const e = this.w.e;
    if ((this.inv(i).water ?? 0) <= 0) return false;
    this.add(i, 'water', -1);
    e.thirst[i] = Math.max(0, e.thirst[i]! - WATER_DRINK);
    this.w.emit('drink', { id: e.id(i), from: 'bottle' });
    return true;
  }
  /** A player at the water's edge fills bottles (3, up to CAP): how many. */
  fillBottles(i: number): number {
    const before = this.inv(i).water ?? 0;
    this.add(i, 'water', WATER_FILL);
    const n = (this.inv(i).water ?? 0) - before;
    if (n > 0) this.w.emit('gather', { id: this.w.e.id(i), what: 'water', n, map: this.w.maps[this.w.e.map[i]!]!.def.id });
    return n;
  }
  /** An AI person fetches water: walk to the nearest water's edge and fill bottles there. */
  fetchWater(i: number): true | string {
    const w = this.w, e = w.e, m = e.map[i]!, W = this.W(i);
    if ((this.inv(i).water ?? 0) >= CAP) return 'I carry all the water I can';
    const t = w.brain.waterSpot(i);
    if (t < 0) return 'there is no water near here';
    return this.begin(i, { kind: 'fill', m, tx: t % W, ty: (t / W) | 0, work: 0 });
  }

  /** Is tile k of map m a fridge or a chest ('' = neither)? */
  boxKind(m: number, k: number): '' | 'fridge' | 'chest' {
    const t = this.w.maps[m]!.tiles.tiles[k];
    return t === this.T.fridge && t >= 0 ? 'fridge' : t === this.T.chest && t >= 0 ? 'chest' : '';
  }
  /** What a fridge / chest holds (made empty when it has no record yet). */
  box(m: number, k: number): Inv { const key = `${m}:${k}`; let b = this.boxes.get(key); if (!b) this.boxes.set(key, (b = {})); return b; }
  /** May person i open the fridge / chest on tile k: the home's family (sim/homes.ts), anyone for one in a free hut. */
  mayUseBox(i: number, m: number, k: number): boolean { return this.homes.mayEnter(i, m, k); }
  /** A fridge / chest is opened for a moment (viewers swing its door / lid open: imad 2026-11-26). */
  opened(m: number, k: number, secs = 2.5): void { this.w.emit('boxOpen', { m, k, secs }); }
  private boxOut(m: number, k: number, item: string, n: number): number {
    const b = this.box(m, k), g = Math.min(n, b[item] ?? 0);
    if (g > 0) this.opened(m, k);
    b[item] = (b[item] ?? 0) - g; if (!b[item]) delete b[item];
    return g;
  }
  /** Where a fridge / chest may go: '' = here, else why not (the TV's ghost and the AI use it). */
  insideSpot(i: number, m: number, k: number): string {
    const tm = this.w.maps[m]!.tiles, h = this.homes.at(m, k);
    if (!h || tm.tiles[k] !== this.T.floor) return 'insideHut';
    const r = this.hutRect(m, h.out, h.dir);
    if (!r || k === r.inside || k === r.door) return 'doorBlocked';
    if (i >= 0 && !this.homes.mayEnter(i, m, k)) return 'notYours';
    return '';
  }
  /** The tile of hut h's fridge / chest, or -1. */
  boxIn(h: { m: number; out: number; dir: number }, kind: 'fridge' | 'chest'): number {
    const r = this.hutRect(h.m, h.out, h.dir), tm = this.w.maps[h.m]!.tiles, t = kind === 'fridge' ? this.T.fridge : this.T.chest;
    if (!r || t < 0) return -1;
    for (let yy = 1; yy < r.s - 1; yy++) for (let xx = 1; xx < r.s - 1; xx++) { const k = (r.y0 + yy) * tm.w + r.x0 + xx; if (tm.tiles[k] === t) return k; }
    return -1;
  }
  /** A free floor tile against a wall of hut h for a fridge / chest (corners first, never in the way in from the door). */
  boxSite(h: { m: number; out: number; dir: number }): number {
    const r = this.hutRect(h.m, h.out, h.dir), tm = this.w.maps[h.m]!.tiles;
    if (!r) return -1;
    let best = -1, bs = -Infinity;
    const doorX = r.door % tm.w, doorY = (r.door / tm.w) | 0;
    for (let yy = 1; yy < r.s - 1; yy++) for (let xx = 1; xx < r.s - 1; xx++) {
      const x = r.x0 + xx, y = r.y0 + yy, k = y * tm.w + x;
      if (tm.tiles[k] !== this.T.floor || k === r.inside || this.occupied(h.m, x, y)) continue;
      const edge = (xx === 1 ? 1 : 0) + (yy === 1 ? 1 : 0) + (xx === r.s - 2 ? 1 : 0) + (yy === r.s - 2 ? 1 : 0);
      if (!edge) continue; // along the walls only: the middle stays free to walk
      const inLine = r.dx === 0 ? x === doorX : y === doorY; // straight in from the door
      const sc = edge * 2 + Math.hypot(x - doorX, y - doorY) * 0.3 - (inLine ? 5 : 0);
      if (sc > bs) { bs = sc; best = k; }
    }
    return best;
  }
  /** My home's fridge / chest within r metres (with `item` in it, or with room for it when `room`): tile or -1. */
  myBox(i: number, kind: 'fridge' | 'chest', r: number, item: string, room = false): number {
    const e = this.w.e, h = this.homes.homeOf(e.id(i));
    if (!h || h.m !== e.map[i]) return -1;
    const k = this.boxIn(h, kind);
    if (k < 0) return -1;
    const W = this.W(i);
    if (Math.hypot((k % W) + 0.5 - e.x[i]!, ((k / W) | 0) + 0.5 - e.y[i]!) > r) return -1;
    const have = this.box(h.m, k)[item] ?? 0;
    return room ? (have < BOX_CAP ? k : -1) : have > 0 ? k : -1;
  }
  /** A fridge / chest within r metres I may open (holding `item` when given): tile or -1. */
  boxNear(i: number, kind: '' | 'fridge' | 'chest', r: number, item = ''): number {
    const e = this.w.e, m = e.map[i]!, tm = this.w.maps[m]!.tiles, R = Math.ceil(r), cx = Math.floor(e.x[i]!), cy = Math.floor(e.y[i]!);
    let best = -1, bd = Infinity;
    for (let y = cy - R; y <= cy + R; y++) for (let x = cx - R; x <= cx + R; x++) {
      if (!tm.inside(x, y)) continue;
      const k = y * tm.w + x, bk = this.boxKind(m, k);
      if (!bk || (kind && bk !== kind) || !this.mayUseBox(i, m, k)) continue;
      if (item && !((this.box(m, k)[item] ?? 0) > 0)) continue;
      const d = Math.hypot(x + 0.5 - e.x[i]!, y + 0.5 - e.y[i]!);
      if (d <= r && d < bd) { bd = d; best = k; }
    }
    return best;
  }
  /** Put n of `item` from the bag (food: hands + bag) into the fridge / chest on tile k: how many went in, or a code. */
  boxPut(i: number, k: number, item: string, n: number): number | string {
    const m = this.w.e.map[i]!, kind = this.boxKind(m, k);
    if (!kind) return 'nothing';
    if (!this.mayUseBox(i, m, k)) return 'notYours';
    if (!boxHolds(kind, item)) return kind === 'fridge' ? 'fridgeOnly' : 'chestNoFood';
    const b = this.box(m, k), room = BOX_CAP - (b[item] ?? 0);
    if (room <= 0) return 'boxFull';
    const have = item === 'food' ? this.foodOf(i) : this.inv(i)[item] ?? 0;
    const g = Math.min(n, have, room);
    if (g <= 0) return 'noItem';
    if (item === 'food') { // the bag's food goes first, the hands' last
      const fromBag = Math.min(g, this.inv(i).food ?? 0);
      if (fromBag) this.add(i, 'food', -fromBag);
      if (g > fromBag) this.w.e.carry[i] = this.w.e.carry[i]! - (g - fromBag);
    } else this.add(i, item, -g);
    b[item] = (b[item] ?? 0) + g;
    this.opened(m, k);
    this.w.emit('store', { id: this.w.e.id(i), what: item, n: g, total: b[item], map: this.w.maps[m]!.def.id, box: kind });
    return g;
  }
  /** Take n of `item` out of the fridge / chest on tile k into the hands / bag: how many, or a code. */
  boxTake(i: number, k: number, item: string, n: number): number | string {
    const m = this.w.e.map[i]!, kind = this.boxKind(m, k);
    if (!kind) return 'nothing';
    if (!this.mayUseBox(i, m, k)) return 'notYours';
    const b = this.box(m, k), have = b[item] ?? 0;
    if (have <= 0) return 'noItem';
    const room = item === 'food' ? this.foodRoom(i) : capOf(item) - (this.inv(i)[item] ?? 0);
    const g = Math.min(n, have, Math.max(0, room));
    if (g <= 0) return 'bagFull';
    this.boxOut(m, k, item, g);
    if (item === 'food') this.addFood(i, g); else this.add(i, item, g);
    this.w.emit('take', { id: this.w.e.id(i), what: item, n: g, left: b[item] ?? 0, map: this.w.maps[m]!.def.id, box: kind });
    return g;
  }
  /** A fridge / chest pulled down: what it held goes into the bag of who pulled it down (as much as fits). */
  private emptyBox(i: number, m: number, k: number): void {
    const key = `${m}:${k}`, b = this.boxes.get(key);
    if (!b) return;
    for (const [item, n] of Object.entries(b)) if (n) { if (item === 'food') this.addFood(i, n); else this.add(i, item, n); }
    this.boxes.delete(key);
  }
  /** Where to stand to use the store on tile k: beside a fridge / chest on its hut's floor (never through the wall), else below the crate. */
  besideStore(m: number, k: number): { x: number; y: number } | null {
    const tm = this.w.maps[m]!.tiles, x = k % tm.w, y = (k / tm.w) | 0;
    if (!this.boxKind(m, k)) return this.w.freeSpot(m, x + 0.5, y + 1.5, 6);
    const h = this.homes.at(m, k);
    for (const [dx, dy] of DIRS) {
      const xx = x + dx, yy = y + dy;
      if (!tm.inside(xx, yy) || tm.solid[tm.get(xx, yy)] || (h && this.homes.at(m, yy * tm.w + xx) !== h)) continue;
      return { x: xx + 0.5, y: yy + 0.5 };
    }
    return null;
  }
  /** The fridges / chests of map m and what they hold (the panel, the camp plan). */
  boxesOf(m: number): { k: number; kind: 'fridge' | 'chest'; inv: Inv }[] {
    const out: { k: number; kind: 'fridge' | 'chest'; inv: Inv }[] = [];
    for (const [key, inv] of this.boxes) {
      const [mm, k] = key.split(':').map(Number) as [number, number];
      if (mm !== m) continue;
      const kind = this.boxKind(m, k);
      if (kind) out.push({ k, kind, inv }); else this.boxes.delete(key); // broken by zombies: gone
    }
    return out;
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
      const { x0, y0, s: S } = h;
      for (let yy = 0; yy < S; yy++) for (let xx = 0; xx < S; xx++) {
        const t = (y0 + yy) * tm.w + x0 + xx;
        if (!(xx === 0 || yy === 0 || xx === S - 1 || yy === S - 1) || t === h.door) continue;
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
    if (j.box === undefined && w.family.lyingInHome(i)) return 'I stay home with my newborn this week'; // only the fridge / chest at home (sim/family.ts)
    // Where to stand: next to the tile (a tree is solid); for a hut, outside the door.
    let sx = j.tx + 0.5, sy = j.ty + 0.5;
    if (j.kind === 'pick') { const it = e.slot(j.who!); if (it < 0) return 'it is gone'; sx = e.x[it]!; sy = e.y[it]!; }
    else if (j.kind === 'loot' || j.kind === 'fill') { /* stand on the floor tile itself / at the water's edge */ }
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
    const act = j.kind === 'chop' || j.kind === 'dig' || j.kind === 'pick' || j.kind === 'loot' || j.kind === 'take' || j.kind === 'fill' ? Act.Gather : Act.Build;
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
      if (!first) { this.regrow(); this.homes.hourly(); this.ownPlans(); this.rotDrops(); }
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
        this.addFood(i, 1);
        w.emit('pickup', { id, item: 'food', keep: true });
        return true;
      }
      case 'fill': {
        if (!w.brain.nearWater(j.m, e.x[i]!, e.y[i]!)) return 'I could not reach the water';
        return this.fillBottles(i) > 0 ? true : 'I carry all the water I can';
      }
      case 'store': case 'take': {
        if (j.box !== undefined) { // a home's fridge
          const r = j.kind === 'store' ? this.boxPut(i, j.box, j.what!, 99) : this.boxTake(i, j.box, j.what!, j.n ?? 1);
          return typeof r === 'number' ? true : r === 'boxFull' ? 'the fridge is full' : r === 'noItem' ? `I have no ${j.what}` : `I could not use the fridge (${r})`;
        }
        const st = this.stash[j.m];
        if (!st || tm.tiles[st.t] !== this.T.crate) { this.stash[j.m] = null; return 'the store is gone'; }
        const what = j.what as StashKey;
        if (j.kind === 'store') {
          const n = what === 'food' ? this.foodOf(i) : this.inv(i)[what as Res] ?? 0;
          if (n <= 0) return `I have no ${what}`;
          if (what === 'food') this.useFood(i, n); else this.add(i, what as Res, -n);
          st[what] = (st[what] ?? 0) + n;
          w.emit('store', { id, what, n, total: st[what], map: mapId });
          return true;
        }
        const room = what === 'food' ? this.foodRoom(i) : CAP - (this.inv(i)[what as Res] ?? 0);
        const n = Math.min(j.n ?? 1, st[what] ?? 0, room);
        if (n <= 0) return (st[what] ?? 0) <= 0 ? `there is no ${what} left in the store` : 'my hands are full';
        st[what] -= n;
        if (what === 'food') this.addFood(i, n); else this.add(i, what as Res, n);
        w.emit('take', { id, what, n, left: st[what], map: mapId });
        return true;
      }
      case 'loot': {
        this.looted.set(`${j.m}:${k}`, w.gameSec);
        const r = w.rng.next();
        let got = 'nothing';
        if (r < 0.35) { this.addFood(i, 1); got = 'canned food'; }
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
        const hs = j.n ?? 5, hh = ((hs - 1) >> 1) + 1, [jdx, jdy] = DIRS[j.dir ?? 0] ?? DIRS[0]!;
        this.hutSz.set(`${j.m}:${j.ty * tm.w + j.tx}`, hs);
        this.huts[j.m]!.push(j.ty * tm.w + j.tx);
        this.hutDir[j.m]!.push(j.dir ?? 0);
        this.homes.built(j.m, j.ty * tm.w + j.tx, j.dir ?? 0, id);
        this.setCamp(j.m, j.tx + 0.5 + jdx, j.ty + 0.5 + jdy);
        w.emit('build', { id, what: 'hut', map: mapId, tx: j.tx - jdx * hh, ty: j.ty - jdy * hh });
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
  /** The camp's burnt-out fire (ashes) within 20 m of the camp: tile index, or -1. */
  campAshes(m: number, at?: { x: number; y: number }): number {
    const c = at ?? this.camp[m], tm = this.w.maps[m]!.tiles;
    if (!c || this.T.ashes < 0) return -1;
    let best = -1, bd = 20;
    for (let y = Math.max(0, Math.floor(c.y - 20)); y <= Math.min(tm.h - 1, c.y + 20); y++) for (let x = Math.max(0, Math.floor(c.x - 20)); x <= Math.min(tm.w - 1, c.x + 20); x++) {
      if (tm.tiles[y * tm.w + x] !== this.T.ashes) continue;
      const d = Math.hypot(x + 0.5 - c.x, y + 0.5 - c.y);
      if (d < bd) { bd = d; best = y * tm.w + x; }
    }
    return best;
  }
  /** Light the camp's old fire again in a hurry (zombies at the camp): 1 wood from the bag or the camp's store. True = burning. */
  relight(i: number, m: number, t: number): boolean {
    const w = this.w, tm = w.maps[m]!.tiles, st = this.stash[m];
    if (tm.tiles[t] !== this.T.ashes) return false;
    if ((this.inv(i).wood ?? 0) >= 1) this.add(i, 'wood', -1);
    else if (st && st.wood >= 1) st.wood--;
    else return false;
    tm.set(t % tm.w, (t / tm.w) | 0, this.T.campfire);
    this.fires.set(`${m}:${t}`, w.gameSec + FIRE_ADD);
    w.emit('tend', { id: w.e.id(i), map: w.maps[m]!.def.id, relit: true });
    return true;
  }
  /** Hours of fuel left in a fire (0 = none). */
  /**
   * Sitting by the fire in the evening (flag aware): one who sees it burning low puts a log on before the night, from their
   * bag or the camp's store. True if they did.
   */
  logOn(i: number, below = 8): boolean {
    const w = this.w, e = w.e, m = e.map[i]!, t = this.fireNear(m, e.x[i]!, e.y[i]!, 4);
    if (t < 0 || this.fuel(m, t) >= below) return false;
    const st = this.stash[m];
    if ((this.inv(i).wood ?? 0) >= 1) this.add(i, 'wood', -1);
    else if (st && (st.wood ?? 0) >= 1 && this.campOf(m) && Math.hypot(this.campOf(m)!.x - e.x[i]!, this.campOf(m)!.y - e.y[i]!) < 20) st.wood--;
    else return false;
    const key = `${m}:${t}`;
    this.fires.set(key, Math.min(w.gameSec + 24 * HOUR, this.fires.get(key)! + FIRE_ADD));
    w.emit('tend', { id: e.id(i), map: w.maps[m]!.def.id });
    return true;
  }
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
      tg.rock = mp.def.life?.rocks ?? (mp.def.gen.type === 'wilds' ? ROCKS_WILD : ROCKS_TOWN); // rare, but never mined out for good
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
    const lack = (mp.def.life?.herbs ?? (mp.def.gen.type === 'wilds' ? HERBS_WILD : HERBS_TOWN)) - now;
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
    for (let i = 0; i < e.hi; i++) if ((e.kind[i] === Kind.Agent || e.kind[i] === Kind.Player) && e.carry[i]! < HANDS && e.map[i] !== NO_MAP) this.refill(i); // hands topped up from the bag
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
    for (let i = 0; i < e.hi; i++) if (e.kind[i] === Kind.Agent && e.map[i] === m && !(e.flags[i]! & 32) && !w.clans.campOf(e.id(i), m)) people.push(i); // a clan with its own camp guards that one (sim/territory.ts)
    if (people.length < 3) return;
    const threat = w.zombies.perNight > 0 || w.zombies.count(m) > 0 || w.zombies.plans.some((x) => x.map === w.maps[m]!.def.id);
    const want = threat && people.length >= 5 ? 2 : 1;
    let have = this.guards(m);
    if (have >= want) return;
    const lid = this.leader[m] ?? -1;
    const fit = people.filter((i) => !this.jobs.has(e.id(i)) && !w.family.lyingInHome(i) && !w.profileOf(i)?.mind?.task && !w.brain.orderOf(i).kind && e.hp[i]! > 60 && e.hunger[i]! < 60 && e.thirst[i]! < 60 && e.tired[i]! < 65 && !w.rules.forbidden(i, 'fight')
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
  /** Put person i on guard at (x, y) facing (fx, fy) for `hours` game hours (sim/territory.ts: a clan camp's watch). */
  postGuard(i: number, m: number, x: number, y: number, fx: number, fy: number, hours: number): boolean {
    const w = this.w, e = w.e;
    if (this.jobs.has(e.id(i)) || !w.brain.job(i, x, y, fx, fy, Act.Idle)) return false;
    this.jobs.set(e.id(i), { kind: 'guard', m, tx: Math.floor(x), ty: Math.floor(y), work: 0, n: w.gameSec + hours * HOUR });
    this.ended.delete(e.id(i));
    w.emit('guard', { id: e.id(i), map: w.maps[m]!.def.id });
    return true;
  }
  /** Person id stands guard now. */
  guarding(id: number): boolean { return this.jobs.get(id)?.kind === 'guard'; }
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
    w.purpose.pass(m, this.freeOf(m).free, hour); // the rest pursue their dreams or a pastime (sim/purpose.ts)
    const ls = lid >= 0 ? e.slot(lid) : -1;
    if (n >= 1 && ls >= 0 && e.map[ls] === m && (this.toldAt[m] ?? -1e9) < w.gameSec - 6 * HOUR) {
      this.toldAt[m] = w.gameSec;
      const threat = w.zombies.perNight > 0 || w.zombies.count(m) > 0;
      w.speak(ls, threat ? 'Zombies are coming. Everyone: doors, walls and weapons!' : w.plan.speech(m)); // the camp's plan in words (sim/campplan.ts)
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
      w.purpose.pass(m, this.freeOf(m).free, hour);
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
      const chilly = w.weather.coldSoon(mi, 10); // the cold (sim/weather.ts): a fire day and night
      if ((evening || chilly) && fire < 0) { start(pick(), chilly ? 'make a campfire against the cold' : 'make a campfire for the night', [{ do: 'build', what: 'campfire' }]); continue; }
      if (fire >= 0 && this.fuel(mi, fire) < (chilly ? 6 : 3) && free.length) {
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
      else if (camp && this.huts[mi]!.length && w.rng.chance(0.12) && this.bedWanted(i)) start(i, 'put a bed in my home', [{ do: 'build', what: 'bed' }]);
      else if (camp && w.rng.chance(0.1) && !this.lampNear(mi, camp.x, camp.y, 10)) start(i, 'put a lamp at the camp', [{ do: 'build', what: 'lamp' }]);
      else if (!(this.inv(i).spear ?? 0) && (this.inv(i).scrap ?? 0) >= 1 && w.zombies.perNight > 0 && w.rng.chance(0.5)) start(i, 'make a spear', [{ do: 'craft', what: 'spear' }]);
      else if (w.rng.chance(0.2)) start(i, 'search the ruins', [{ do: 'loot', times: 2 }]);
      else if (!(this.inv(i).axe ?? 0) && w.rng.chance(0.5)) start(i, 'make an axe', [{ do: 'craft', what: 'axe' }]);
      else if ((this.inv(i).wood ?? 0) < 6 && w.rng.chance(0.4)) start(i, 'gather firewood', [{ do: 'gather', what: 'wood', times: 4 }]);
    }
  }
}
