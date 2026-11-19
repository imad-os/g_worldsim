import { CHUNK_TILES } from '@worldsim/protocol';
import type { TileType } from './scenario.js';

/** One map's tiles (type + hit points) with per-chunk versions and dirty tracking. */
export class TileMap {
  readonly w: number;
  readonly h: number;
  readonly cw: number;
  readonly ch: number;
  readonly tiles: Uint8Array;
  readonly hp: Uint8Array;
  /** Tile types as generated (for persistence diffs: only changed tiles go to the cloud). */
  base: Uint8Array | null = null;
  readonly chunkVer: Uint32Array;
  /** Chunks whose colliders must be rebuilt (set after a tile change, cleared by physics). */
  readonly dirty: Uint8Array;
  dirtyCount = 0;
  readonly solid: Uint8Array; // per tile type
  readonly maxHp: Uint8Array; // per tile type
  readonly breaksTo: Uint8Array; // per tile type
  readonly cost: Float32Array; // per tile type (0 = blocked)

  constructor(w: number, h: number, types: TileType[]) {
    this.w = w; this.h = h;
    this.cw = Math.ceil(w / CHUNK_TILES);
    this.ch = Math.ceil(h / CHUNK_TILES);
    this.tiles = new Uint8Array(w * h);
    this.hp = new Uint8Array(w * h);
    this.chunkVer = new Uint32Array(this.cw * this.ch).fill(1);
    this.dirty = new Uint8Array(this.cw * this.ch);
    this.solid = new Uint8Array(256);
    this.maxHp = new Uint8Array(256);
    this.breaksTo = new Uint8Array(256);
    this.cost = new Float32Array(256);
    for (const t of types) {
      this.solid[t.id] = t.solid ? 1 : 0;
      this.maxHp[t.id] = Math.min(255, t.hp ?? 0);
      this.breaksTo[t.id] = t.breaksTo ?? t.id;
      this.cost[t.id] = t.solid ? 0 : (t.cost ?? 1);
    }
  }

  inside(tx: number, ty: number): boolean { return tx >= 0 && ty >= 0 && tx < this.w && ty < this.h; }
  get(tx: number, ty: number): number { return this.tiles[ty * this.w + tx]!; }
  isSolidAt(x: number, y: number): boolean {
    const tx = Math.floor(x), ty = Math.floor(y);
    return !this.inside(tx, ty) || this.solid[this.tiles[ty * this.w + tx]!] === 1;
  }

  /** Set during generation (no versioning). */
  init(tx: number, ty: number, type: number): void {
    const i = ty * this.w + tx;
    this.tiles[i] = type;
    this.hp[i] = this.maxHp[type]!;
  }

  /** Change a tile at run time: bumps the chunk version and marks it dirty. */
  set(tx: number, ty: number, type: number): void {
    const i = ty * this.w + tx;
    if (this.tiles[i] === type) return;
    this.tiles[i] = type;
    this.hp[i] = this.maxHp[type]!;
    this.touch(tx, ty);
  }

  /** Damage a tile; returns true if it broke. Indestructible tiles (hp 0) ignore damage. */
  damage(tx: number, ty: number, amount: number): boolean {
    if (!this.inside(tx, ty)) return false;
    const i = ty * this.w + tx;
    const t = this.tiles[i]!;
    if (this.maxHp[t] === 0) return false;
    const left = this.hp[i]! - amount;
    if (left > 0) { this.hp[i] = left; return false; }
    this.set(tx, ty, this.breaksTo[t]!);
    return true;
  }

  private touch(tx: number, ty: number): void {
    const c = ((ty / CHUNK_TILES) | 0) * this.cw + ((tx / CHUNK_TILES) | 0);
    this.chunkVer[c]!++;
    if (this.dirty[c] === 0) { this.dirty[c] = 1; this.dirtyCount++; }
  }

  /** Copy one chunk's tiles into `out` (CHUNK_TILES^2 bytes, tiles outside the map = 0). */
  chunkTiles(cx: number, cy: number, out: Uint8Array): Uint8Array {
    out.fill(0);
    const x0 = cx * CHUNK_TILES, y0 = cy * CHUNK_TILES;
    for (let y = 0; y < CHUNK_TILES; y++) {
      const ty = y0 + y;
      if (ty >= this.h) break;
      const xe = Math.min(CHUNK_TILES, this.w - x0);
      out.set(this.tiles.subarray(ty * this.w + x0, ty * this.w + x0 + xe), y * CHUNK_TILES);
    }
    return out;
  }

  /** Changed tiles of a chunk vs the generated map: [index in chunk, type, ...]. */
  chunkDiff(cx: number, cy: number): number[] {
    const out: number[] = [];
    if (!this.base) return out;
    const x0 = cx * CHUNK_TILES, y0 = cy * CHUNK_TILES;
    for (let y = 0; y < CHUNK_TILES && y0 + y < this.h; y++) {
      for (let x = 0; x < CHUNK_TILES && x0 + x < this.w; x++) {
        const i = (y0 + y) * this.w + x0 + x;
        if (this.tiles[i] !== this.base[i]) out.push(y * CHUNK_TILES + x, this.tiles[i]!);
      }
    }
    return out;
  }
}
