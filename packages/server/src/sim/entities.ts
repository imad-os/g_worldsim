import { EFlag, Kind } from '@worldsim/protocol';

/** Map index meaning "in transit between maps". */
export const NO_MAP = 255;

/**
 * Every entity of every map in one struct-of-arrays store (typed arrays, fixed capacity).
 * No per-tick allocation: slots are reused through a free list, and a generation counter
 * makes public ids unique over time: id = gen << 16 | slot.
 */
export class Entities {
  readonly cap: number;
  count = 0;

  readonly gen: Uint16Array;
  readonly kind: Uint8Array;
  readonly flags: Uint8Array;
  readonly map: Uint8Array;
  readonly x: Float64Array;
  readonly y: Float64Array;
  readonly vx: Float32Array;
  readonly vy: Float32Array;
  readonly angle: Float32Array;
  readonly radius: Float32Array;
  readonly hp: Float32Array;
  /** Movement goal (placeholder steering until the AI milestone). */
  readonly tx: Float64Array;
  readonly ty: Float64Array;
  readonly speed: Float32Array;
  /** Projectiles: who fired it (entity slot, -1 none) and time left (sim seconds). */
  readonly owner: Int32Array;
  readonly life: Float32Array;
  /** Transit between maps: target map, arrival game time, arrival point. */
  readonly toMap: Uint8Array;
  readonly arrive: Float64Array;
  readonly ax: Float64Array;
  readonly ay: Float64Array;
  /** LOD level (0 full rate .. 3 rare) and the tick of the next "think". */
  readonly lod: Uint8Array;
  readonly nextThink: Float64Array;
  /** Portal the entity is heading for (-1 none). */
  readonly goal: Int16Array;
  /** Thinks in a row without real progress (stuck detection). */
  readonly stuck: Uint8Array;

  private readonly free: Int32Array;
  private freeTop = 0;
  /** Highest slot ever used + 1 (loops stop there). */
  hi = 0;

  constructor(cap = 4096) {
    if (cap > 65536) throw new Error('capacity max 65536');
    this.cap = cap;
    this.gen = new Uint16Array(cap);
    this.kind = new Uint8Array(cap);
    this.flags = new Uint8Array(cap);
    this.map = new Uint8Array(cap);
    this.x = new Float64Array(cap);
    this.y = new Float64Array(cap);
    this.vx = new Float32Array(cap);
    this.vy = new Float32Array(cap);
    this.angle = new Float32Array(cap);
    this.radius = new Float32Array(cap);
    this.hp = new Float32Array(cap);
    this.tx = new Float64Array(cap);
    this.ty = new Float64Array(cap);
    this.speed = new Float32Array(cap);
    this.owner = new Int32Array(cap);
    this.life = new Float32Array(cap);
    this.toMap = new Uint8Array(cap);
    this.arrive = new Float64Array(cap);
    this.ax = new Float64Array(cap);
    this.ay = new Float64Array(cap);
    this.lod = new Uint8Array(cap);
    this.nextThink = new Float64Array(cap);
    this.goal = new Int16Array(cap);
    this.stuck = new Uint8Array(cap);
    this.free = new Int32Array(cap);
    for (let i = cap - 1; i >= 0; i--) this.free[this.freeTop++] = i;
  }

  alive(i: number): boolean { return this.kind[i] !== Kind.None; }

  id(i: number): number { return ((this.gen[i]! & 0x7fff) << 16) | i; }

  /** Slot of a public id, or -1 when that entity no longer exists. */
  slot(id: number): number {
    const i = id & 0xffff;
    if (i >= this.cap || this.kind[i] === Kind.None || (this.gen[i]! & 0x7fff) !== (id >>> 16)) return -1;
    return i;
  }

  create(kind: number, map: number, x: number, y: number, radius: number): number {
    if (this.freeTop === 0) return -1;
    const i = this.free[--this.freeTop]!;
    this.kind[i] = kind;
    this.flags[i] = EFlag.Alive;
    this.map[i] = map;
    this.x[i] = x; this.y[i] = y;
    this.vx[i] = 0; this.vy[i] = 0; this.angle[i] = 0;
    this.radius[i] = radius;
    this.hp[i] = 100;
    this.tx[i] = x; this.ty[i] = y; this.speed[i] = 0;
    this.owner[i] = -1; this.life[i] = 0;
    this.toMap[i] = 0; this.arrive[i] = 0; this.ax[i] = 0; this.ay[i] = 0;
    this.lod[i] = 0; this.nextThink[i] = 0; this.goal[i] = -1; this.stuck[i] = 0;
    if (i >= this.hi) this.hi = i + 1;
    this.count++;
    return i;
  }

  destroy(i: number): void {
    if (this.kind[i] === Kind.None) return;
    this.kind[i] = Kind.None;
    this.flags[i] = 0;
    this.gen[i] = (this.gen[i]! + 1) & 0x7fff;
    this.free[this.freeTop++] = i;
    this.count--;
  }

  countKind(k: number): number {
    let n = 0;
    for (let i = 0; i < this.hi; i++) if (this.kind[i] === k) n++;
    return n;
  }

  /** Every array, for snapshots (only the used part [0, hi)). */
  columns(): Record<string, ArrayLike<number> & { subarray(a: number, b: number): ArrayLike<number> }> {
    return {
      gen: this.gen, kind: this.kind, flags: this.flags, map: this.map, x: this.x, y: this.y,
      vx: this.vx, vy: this.vy, angle: this.angle, radius: this.radius, hp: this.hp,
      tx: this.tx, ty: this.ty, speed: this.speed, owner: this.owner, life: this.life,
      toMap: this.toMap, arrive: this.arrive, ax: this.ax, ay: this.ay, lod: this.lod, nextThink: this.nextThink,
      goal: this.goal, stuck: this.stuck,
    };
  }

  /** Rebuild the free list and counters after the columns were loaded from a snapshot. */
  rebuildIndex(hi: number): void {
    this.hi = hi;
    this.count = 0;
    this.freeTop = 0;
    for (let i = this.cap - 1; i >= 0; i--) {
      if (i < hi && this.kind[i] !== Kind.None) this.count++;
      else this.free[this.freeTop++] = i;
    }
  }
}
