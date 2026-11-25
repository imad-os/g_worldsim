import type { TileMap } from './tilemap.js';

/**
 * Spatial reasoning about what people build (no AI, plain grid geometry): flood fills on the tile grid, the shape of a
 * hut found from its walls (any orientation), and an audit of a settlement (are the huts closed rooms, can you get in,
 * can you reach every door from the camp, are they inside the wall). Used by the builders (sim/survival.ts: a site is
 * only taken when the result still works) and by the experiments (src/experiment.ts: "construction functionality").
 */

const D4 = [[1, 0], [-1, 0], [0, 1], [0, -1]] as const;
/** Door directions (outwards) as sim/survival.ts numbers them: south, east, north, west. */
const OUT = [[0, 1], [1, 0], [0, -1], [-1, 0]] as const;

/** Breadth-first flood over walkable tiles (cost > 0) from (sx, sy), at most `limit` tiles, never through `block` tiles. */
export function flood(tm: TileMap, sx: number, sy: number, limit: number, block?: (k: number) => boolean): Set<number> {
  const seen = new Set<number>();
  if (!tm.inside(sx, sy)) return seen;
  const k0 = sy * tm.w + sx;
  if (tm.cost[tm.tiles[k0]!]! <= 0 || block?.(k0)) return seen;
  const q = [k0];
  seen.add(k0);
  for (let h = 0; h < q.length && seen.size < limit; h++) {
    const k = q[h]!, x = k % tm.w, y = (k / tm.w) | 0;
    for (const [dx, dy] of D4) {
      const xx = x + dx, yy = y + dy;
      if (!tm.inside(xx, yy)) continue;
      const n = yy * tm.w + xx;
      if (seen.has(n) || tm.cost[tm.tiles[n]!]! <= 0 || block?.(n)) continue;
      seen.add(n); q.push(n);
    }
  }
  return seen;
}

/** The nearest walkable tile to (x, y) within r tiles (index), or -1. */
export function walkableNear(tm: TileMap, x: number, y: number, r = 3): number {
  const cx = Math.floor(x), cy = Math.floor(y);
  let best = -1, bd = Infinity;
  for (let yy = cy - r; yy <= cy + r; yy++) for (let xx = cx - r; xx <= cx + r; xx++) {
    if (!tm.inside(xx, yy) || tm.cost[tm.get(xx, yy)]! <= 0) continue;
    const d = (xx - cx) ** 2 + (yy - cy) ** 2;
    if (d < bd) { bd = d; best = yy * tm.w + xx; }
  }
  return best;
}

export interface HutShape {
  /** The tile in front of the door (outside), the doorway, one step inside. */
  out: number; door: number; inside: number;
  /** Unit step from the door to the outside. */
  dx: number; dy: number;
}

/**
 * The hut whose doorway is next to `out` (the tile in front of it): the neighbour that is walkable with a solid tile on both
 * sides (a gap in a wall). Works for any orientation, so old (door south) and new huts are read the same way. null = none.
 */
export function hutAt(tm: TileMap, out: number, dir?: number): HutShape | null {
  if (out < 0) return null;
  let first: HutShape | null = null;
  const x = out % tm.w, y = (out / tm.w) | 0;
  const solid = (xx: number, yy: number) => !tm.inside(xx, yy) || tm.cost[tm.get(xx, yy)]! <= 0;
  for (const [dx, dy] of dir === undefined ? D4 : [OUT[dir] ?? OUT[0]!]) {
    const ddx = x - dx, ddy = y - dy; // the door, one step from out (into the hut)
    if (!tm.inside(ddx, ddy) || solid(ddx, ddy)) continue;
    // Walls on both sides of the doorway (perpendicular to the way in).
    if (!solid(ddx + dy, ddy + dx) || !solid(ddx - dy, ddy - dx)) continue;
    const ix = ddx - dx, iy = ddy - dy;
    if (!tm.inside(ix, iy) || solid(ix, iy)) continue;
    const h = { out, door: ddy * tm.w + ddx, inside: iy * tm.w + ix, dx, dy };
    // Several gaps can look like a doorway (a hut next to a ruin): the one that leads into a closed room wins.
    if (dir !== undefined || flood(tm, ix, iy, 64, (k) => k === h.door).size < 64) return h;
    first ??= h;
  }
  return first;
}

export interface HutAudit {
  out: number;
  /** A doorway was found (walls on both sides, a way in). */
  door: boolean;
  /** The inside is a closed room: from inside you only get out through the doorway. */
  enclosed: boolean;
  /** Tiles inside (a 5 x 5 hut has 9). */
  room: number;
  /** The tile in front of the door can be reached from the camp's centre. */
  reachable: boolean;
  /** Inside the settlement's wall (when one is planned), else true. */
  protected: boolean;
  /** All of the above: a hut people can really use. */
  functional: boolean;
}

/** Audit one hut. `fromCamp` = the tiles reachable from the camp (one flood, shared by every hut on the map). */
export function auditHut(tm: TileMap, out: number, fromCamp: Set<number> | null, wall: { x: number; y: number; r: number } | null, dir?: number): HutAudit {
  const s = hutAt(tm, out, dir);
  const a: HutAudit = { out, door: !!s, enclosed: false, room: 0, reachable: false, protected: true, functional: false };
  if (!s) return a;
  const room = flood(tm, s.inside % tm.w, (s.inside / tm.w) | 0, 64, (k) => k === s.door);
  a.room = room.size;
  a.enclosed = room.size > 0 && room.size < 64;
  a.reachable = !fromCamp || fromCamp.has(out);
  if (wall) {
    const hx = s.inside % tm.w + 0.5, hy = ((s.inside / tm.w) | 0) + 0.5;
    a.protected = Math.hypot(hx - wall.x, hy - wall.y) + 2.5 <= wall.r;
  }
  a.functional = a.door && a.enclosed && a.reachable && a.protected;
  return a;
}
