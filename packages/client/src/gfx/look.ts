import type { TileTypeInfo } from '@worldsim/protocol';

/**
 * How each tile type looks in 3D. The scenario only gives a name and a flat colour; the viewer picks a softer
 * palette and a shape by name (unknown names: solid = a wall block, else flat ground in the scenario's colour).
 */
export const enum Shape { Ground = 0, Water = 1, Wall = 2, Tree = 3, Rubble = 4, Fire = 5, Ashes = 6, Rock = 7, Wreck = 8, Palisade = 9, Spikes = 10, Door = 11, Window = 12, Bed = 13, Lamp = 14, Herbs = 15, Fridge = 16, Chest = 17, Fence = 18, Stall = 19 }

/** `even`: built walls stay whole (no ruined tops); `planks`: draw boards on the sides. */
export interface Look { shape: Shape; ground: number; top: number; side: number; height: number; even?: boolean; planks?: boolean; open?: boolean }

/** Ground of the horse field (grass tufts like grass, no dry patches). */
export const PASTURE = 0x80b45a;

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
  woodwall: { shape: Shape.Wall, ground: 0x8a6a48, top: 0x8b6239, side: 0x7a5432, height: 1.7, even: true, planks: true },
  campfire: { shape: Shape.Fire, ground: 0x8d7a62, top: 0x8f8a82, side: 0x5b3a22, height: 0 },
  ashes: { shape: Shape.Ashes, ground: 0x6f6a63, top: 0x3d3a37, side: 0x4a3524, height: 0 },
  crate: { shape: Shape.Wall, ground: 0x8a6a48, top: 0xa47a48, side: 0x8b6239, height: 0.8, even: true, planks: true },
  farm: { shape: Shape.Ground, ground: 0x6b5236, top: 0, side: 0, height: 0 },
  rock: { shape: Shape.Rock, ground: 0x8d877e, top: 0x9a948c, side: 0, height: 0 },
  wreck: { shape: Shape.Wreck, ground: 0x6a6762, top: 0x8a4e32, side: 0x3b3a38, height: 0 },
  palisade: { shape: Shape.Palisade, ground: 0x8a6a48, top: 0x9b7046, side: 0x6e4b2c, height: 0 },
  spikes: { shape: Shape.Spikes, ground: 0x8a6a48, top: 0xa07a4a, side: 0x6e4b2c, height: 0 },
  stonewall: { shape: Shape.Wall, ground: 0x8d877e, top: 0xb5aea3, side: 0x9b8f80, height: 1.9, even: true },
  door: { shape: Shape.Door, ground: 0xb08a5f, top: 0x8b6239, side: 0x6b4a2f, height: 0 },
  dooropen: { shape: Shape.Door, ground: 0xb08a5f, top: 0x8b6239, side: 0x6b4a2f, height: 0, open: true },
  window: { shape: Shape.Window, ground: 0x8a6a48, top: 0x8b6239, side: 0x7a5432, height: 1.7 },
  bed: { shape: Shape.Bed, ground: 0xb08a5f, top: 0xb0503c, side: 0x7a5432, height: 0 },
  herbs: { shape: Shape.Herbs, ground: 0x76a955, top: 0x4f9a3c, side: 0xb48ad8, height: 0 },
  lamp: { shape: Shape.Lamp, ground: 0x8d7a62, top: 0xffe08a, side: 0x4a4440, height: 0 },
  fridge: { shape: Shape.Fridge, ground: 0xb08a5f, top: 0xdfe6e8, side: 0x8f9aa0, height: 0 },
  chest: { shape: Shape.Chest, ground: 0xb08a5f, top: 0x9b6a3a, side: 0x5a5550, height: 0 },
  // The horse paddock and stable (sim/stables.ts): post-and-rail fence, pasture, a straw floor under a roof, plank walls.
  fence: { shape: Shape.Fence, ground: 0x7fae58, top: 0xa47a4c, side: 0x7a5636, height: 0 },
  paddock: { shape: Shape.Ground, ground: PASTURE, top: 0, side: 0, height: 0 },
  stall: { shape: Shape.Stall, ground: 0xc9a65a, top: 0x8a5a3a, side: 0x6e4b2c, height: 0 },
  stablewall: { shape: Shape.Wall, ground: 0x8a6a48, top: 0x8b6239, side: 0x845c38, height: 2.3, even: true, planks: true },
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
