import type { TileTypeInfo } from '@worldsim/protocol';

/**
 * How each tile type looks in 3D. The scenario only gives a name and a flat colour; the viewer picks a softer
 * palette and a shape by name (unknown names: solid = a wall block, else flat ground in the scenario's colour).
 */
export const enum Shape { Ground = 0, Water = 1, Wall = 2, Tree = 3, Rubble = 4 }

export interface Look { shape: Shape; ground: number; top: number; side: number; height: number }

const BY_NAME: Record<string, Look> = {
  grass: { shape: Shape.Ground, ground: 0x76a955, top: 0, side: 0, height: 0 },
  dirt: { shape: Shape.Ground, ground: 0xa47e58, top: 0, side: 0, height: 0 },
  road: { shape: Shape.Ground, ground: 0x6a6762, top: 0, side: 0, height: 0 },
  floor: { shape: Shape.Ground, ground: 0xb08a5f, top: 0, side: 0, height: 0 },
  sand: { shape: Shape.Ground, ground: 0xdcc893, top: 0, side: 0, height: 0 },
  water: { shape: Shape.Water, ground: 0x4c6f62, top: 0, side: 0, height: 0 },
  wall: { shape: Shape.Wall, ground: 0x8d877e, top: 0xc2b8aa, side: 0xa69b8d, height: 2.3 },
  tree: { shape: Shape.Tree, ground: 0x5e8f45, top: 0x4f9440, side: 0x6b4a2f, height: 0 },
  rubble: { shape: Shape.Rubble, ground: 0x908779, top: 0x9b9283, side: 0, height: 0 },
};

export function looksFor(tiles: TileTypeInfo[]): Look[] {
  const out: Look[] = [];
  for (let i = 0; i < 256; i++) out.push({ shape: Shape.Ground, ground: 0x6ea64f, top: 0, side: 0, height: 0 });
  for (const t of tiles) {
    const l = BY_NAME[t.name];
    out[t.id] = l ? { ...l } : t.solid
      ? { shape: Shape.Wall, ground: t.color, top: t.color, side: t.color, height: 2 }
      : { shape: Shape.Ground, ground: t.color, top: 0, side: 0, height: 0 };
  }
  return out;
}

/** Fixed hash of two integers -> [0, 1). */
export function hash2(x: number, y: number): number {
  let h = Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

/** Smooth value noise, about one bump per `scale` metres, in [0, 1). */
export function noise2(x: number, y: number, scale: number): number {
  const fx = x / scale, fy = y / scale, ix = Math.floor(fx), iy = Math.floor(fy);
  let tx = fx - ix, ty = fy - iy;
  tx = tx * tx * (3 - 2 * tx); ty = ty * ty * (3 - 2 * ty);
  const a = hash2(ix, iy), b = hash2(ix + 1, iy), c = hash2(ix, iy + 1), d = hash2(ix + 1, iy + 1);
  return a + (b - a) * tx + (c - a) * ty + (a - b - c + d) * tx * ty;
}
