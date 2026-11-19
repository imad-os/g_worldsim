import planck from 'planck';
import { CHUNK_TILES } from '@worldsim/protocol';
import type { TileMap } from './tilemap.js';

const { World, Box, Circle, Chain } = planck;
type PWorld = InstanceType<typeof World>;
export type PBody = ReturnType<PWorld['createBody']>;

/** Static bodies carry negative user data: -(1 + chunk index); map bounds = -1e9. */
export const BOUNDS = -1e9;

export const VEL_ITERS = 8;
export const POS_ITERS = 3;

/**
 * One map's Planck (Box2D) world: top-down, no gravity. Solid tiles become static colliders, one body
 * per 32x32 chunk with the solid tiles merged into as few boxes as possible (greedy rows + columns).
 * A changed chunk (destroyed wall...) gets its body rebuilt after the step.
 */
export class MapPhysics {
  readonly world: PWorld;
  readonly tiles: TileMap;
  private readonly chunkBodies: (PBody | null)[];
  private readonly circleType: Uint8Array;
  /** Contacts of projectiles recorded during a step: [projectile slot, other user data] pairs. */
  readonly hitA: Int32Array;
  readonly hitB: Float64Array;
  hitN = 0;

  constructor(tiles: TileMap, circleTypes: number[], maxHits = 1024) {
    this.tiles = tiles;
    this.world = new World({ gravity: { x: 0, y: 0 } });
    this.chunkBodies = new Array(tiles.cw * tiles.ch).fill(null);
    this.circleType = new Uint8Array(256);
    for (const t of circleTypes) this.circleType[t] = 1;
    this.hitA = new Int32Array(maxHits);
    this.hitB = new Float64Array(maxHits);
    const bounds = this.world.createBody({ type: 'static' });
    bounds.setUserData(BOUNDS);
    bounds.createFixture(new Chain([
      { x: 0, y: 0 }, { x: tiles.w, y: 0 }, { x: tiles.w, y: tiles.h }, { x: 0, y: tiles.h },
    ], true), { friction: 0 });
    for (let c = 0; c < this.chunkBodies.length; c++) this.buildChunk(c);
    this.world.on('begin-contact', (contact) => {
      const a = contact.getFixtureA().getBody().getUserData() as number;
      const b = contact.getFixtureB().getBody().getUserData() as number;
      const pa = this.isProjectile(a), pb = this.isProjectile(b);
      if (!pa && !pb) return;
      if (this.hitN >= this.hitA.length) return;
      if (pa) { this.hitA[this.hitN] = a; this.hitB[this.hitN++] = b; }
      if (pb && this.hitN < this.hitA.length) { this.hitA[this.hitN] = b; this.hitB[this.hitN++] = a; }
    });
  }

  /** Set by the world: tells whether an entity slot is a projectile. */
  isProjectile: (userData: number) => boolean = () => false;

  /** Rebuild the colliders of chunks changed since the last call. */
  rebuildDirty(): number {
    const t = this.tiles;
    if (t.dirtyCount === 0) return 0;
    let n = 0;
    for (let c = 0; c < t.dirty.length; c++) {
      if (t.dirty[c] === 0) continue;
      t.dirty[c] = 0;
      this.buildChunk(c);
      n++;
    }
    t.dirtyCount = 0;
    return n;
  }

  private buildChunk(c: number): void {
    const old = this.chunkBodies[c];
    if (old) this.world.destroyBody(old);
    this.chunkBodies[c] = null;
    const t = this.tiles;
    const cx = c % t.cw, cy = (c / t.cw) | 0;
    const x0 = cx * CHUNK_TILES, y0 = cy * CHUNK_TILES;
    const x1 = Math.min(t.w, x0 + CHUNK_TILES), y1 = Math.min(t.h, y0 + CHUNK_TILES);
    const used = new Uint8Array(CHUNK_TILES * CHUNK_TILES);
    let body: PBody | null = null;
    const ensure = () => {
      if (!body) { body = this.world.createBody({ type: 'static' }); body.setUserData(-(1 + c)); }
      return body;
    };
    const boxTile = (x: number, y: number) => {
      const tt = t.tiles[y * t.w + x]!;
      return t.solid[tt] === 1 && this.circleType[tt] === 0;
    };
    for (let y = y0; y < y1; y++) {
      for (let x = x0; x < x1; x++) {
        const li = (y - y0) * CHUNK_TILES + (x - x0);
        if (used[li]) continue;
        const tt = t.tiles[y * t.w + x]!;
        if (t.solid[tt] === 0) continue;
        if (this.circleType[tt]) {
          used[li] = 1;
          ensure().createFixture(new Circle({ x: x + 0.5, y: y + 0.5 }, 0.4), { friction: 0.2 });
          continue;
        }
        // Widest run on this row, then grow down while the whole run is solid and unused.
        let xe = x;
        while (xe + 1 < x1 && !used[(y - y0) * CHUNK_TILES + (xe + 1 - x0)] && boxTile(xe + 1, y)) xe++;
        let ye = y;
        grow: while (ye + 1 < y1) {
          for (let k = x; k <= xe; k++) {
            if (used[(ye + 1 - y0) * CHUNK_TILES + (k - x0)] || !boxTile(k, ye + 1)) break grow;
          }
          ye++;
        }
        for (let yy = y; yy <= ye; yy++) for (let k = x; k <= xe; k++) used[(yy - y0) * CHUNK_TILES + (k - x0)] = 1;
        const hw = (xe - x + 1) / 2, hh = (ye - y + 1) / 2;
        ensure().createFixture(new Box(hw, hh, { x: x + hw, y: y + hh }), { friction: 0.2 });
      }
    }
    this.chunkBodies[c] = body;
  }

  /** Number of static fixtures (for stats / tests). */
  staticFixtures(): number {
    let n = 0;
    for (const b of this.chunkBodies) for (let f = b?.getFixtureList(); f; f = f.getNext()) n++;
    return n;
  }

  createAgentBody(slot: number, x: number, y: number, r: number): PBody {
    const b = this.world.createBody({ type: 'dynamic', position: { x, y }, fixedRotation: true, allowSleep: true });
    b.setUserData(slot);
    b.createFixture(new Circle(r), { density: 1, friction: 0, filterGroupIndex: -(slot + 1) });
    return b;
  }

  createProjectileBody(slot: number, owner: number, x: number, y: number, r: number): PBody {
    const b = this.world.createBody({ type: 'dynamic', position: { x, y }, bullet: true, fixedRotation: true });
    b.setUserData(slot);
    b.createFixture(new Circle(r), { density: 0.5, friction: 0, restitution: 0, filterGroupIndex: owner >= 0 ? -(owner + 1) : 0 });
    return b;
  }

  /** First solid tile along a ray (step 0.1 m), or -1. Used to find which tile a projectile hit. */
  solidTileAlong(x: number, y: number, dx: number, dy: number, maxDist: number): number {
    const t = this.tiles;
    for (let d = 0; d <= maxDist; d += 0.1) {
      const tx = Math.floor(x + dx * d), ty = Math.floor(y + dy * d);
      if (!t.inside(tx, ty)) return -1;
      if (t.solid[t.tiles[ty * t.w + tx]!]) return ty * t.w + tx;
    }
    return -1;
  }

  step(dt: number): void {
    this.hitN = 0;
    this.world.step(dt, VEL_ITERS, POS_ITERS);
  }
}
