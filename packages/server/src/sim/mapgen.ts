import { Rng } from './rng.js';
import { TileMap } from './tilemap.js';
import type { MapDef, Scenario } from './scenario.js';

/**
 * Procedural map generators, chosen by `gen.type` in the scenario. Same seed + same map id = same map,
 * so a world can be rebuilt from the seed plus the saved changes (that is what the cloud backup keeps).
 */
type Gen = (m: TileMap, def: MapDef, rng: Rng, T: Record<string, number>) => void;

function tileIds(sc: Scenario): Record<string, number> {
  const T: Record<string, number> = {};
  for (const t of sc.tiles) T[t.name] = t.id;
  return T;
}

/** Smooth value noise in [0, 1). */
function makeNoise(rng: Rng, size = 256) {
  const v = new Float32Array(size * size);
  for (let i = 0; i < v.length; i++) v[i] = rng.next();
  const at = (x: number, y: number) => v[((y & (size - 1)) * size) + (x & (size - 1))]!;
  const s = (t: number) => t * t * (3 - 2 * t);
  return (x: number, y: number, scale: number) => {
    const fx = x / scale, fy = y / scale;
    const ix = Math.floor(fx), iy = Math.floor(fy);
    const tx = s(fx - ix), ty = s(fy - iy);
    const a = at(ix, iy), b = at(ix + 1, iy), c = at(ix, iy + 1), d = at(ix + 1, iy + 1);
    return a + (b - a) * tx + (c - a) * ty + (a - b - c + d) * tx * ty;
  };
}

function need(T: Record<string, number>, ...names: string[]) {
  for (const n of names) if (T[n] === undefined) throw new Error(`generator needs tile "${n}"`);
}

/** Ruined town: road grid, buildings (walls, doors, floors, some walls already broken), rubble, trees, a pond. */
const town: Gen = (m, def, rng, T) => {
  need(T, 'grass', 'dirt', 'road', 'floor', 'wall', 'rubble', 'tree', 'water');
  const noise = makeNoise(rng);
  const block = Number(def.gen.block ?? 28);
  const roadW = Number(def.gen.road ?? 4);
  const ruin = Number(def.gen.ruin ?? 0.15);
  for (let y = 0; y < m.h; y++) for (let x = 0; x < m.w; x++) {
    m.init(x, y, noise(x, y, 12) > 0.62 ? T.dirt! : T.grass!);
  }
  // Roads: a grid with a little jitter per line.
  const isRoad = new Uint8Array(m.w * m.h);
  for (let gx = block; gx < m.w - 4; gx += block) {
    const off = rng.int(3) - 1;
    for (let y = 0; y < m.h; y++) for (let k = 0; k < roadW; k++) {
      const x = gx + off + k; if (x >= 0 && x < m.w) { m.init(x, y, T.road!); isRoad[y * m.w + x] = 1; }
    }
  }
  for (let gy = block; gy < m.h - 4; gy += block) {
    const off = rng.int(3) - 1;
    for (let x = 0; x < m.w; x++) for (let k = 0; k < roadW; k++) {
      const y = gy + off + k; if (y >= 0 && y < m.h) { m.init(x, y, T.road!); isRoad[y * m.w + x] = 1; }
    }
  }
  const free = (x0: number, y0: number, x1: number, y1: number) => {
    if (x0 < 2 || y0 < 2 || x1 >= m.w - 2 || y1 >= m.h - 2) return false;
    for (let y = y0 - 1; y <= y1 + 1; y++) for (let x = x0 - 1; x <= x1 + 1; x++) {
      const t = m.get(x, y);
      if (isRoad[y * m.w + x] || t === T.wall || t === T.floor || t === T.water) return false;
    }
    return true;
  };
  // Buildings: try many rectangles, keep those that fit between roads.
  const tries = Math.floor((m.w * m.h) / 90);
  for (let i = 0; i < tries; i++) {
    const bw = 5 + rng.int(9), bh = 5 + rng.int(8);
    const x0 = 2 + rng.int(m.w - bw - 4), y0 = 2 + rng.int(m.h - bh - 4);
    const x1 = x0 + bw - 1, y1 = y0 + bh - 1;
    if (!free(x0, y0, x1, y1)) continue;
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
      const edge = x === x0 || x === x1 || y === y0 || y === y1;
      m.init(x, y, edge ? (rng.chance(ruin) ? T.rubble! : T.wall!) : T.floor!);
    }
    // Two doors on random sides (2 tiles wide so agents fit).
    for (let d = 0; d < 2; d++) {
      const side = rng.int(4);
      if (side < 2) {
        const x = x0 + 1 + rng.int(bw - 3), y = side === 0 ? y0 : y1;
        m.init(x, y, T.floor!); m.init(x + 1, y, T.floor!);
      } else {
        const y = y0 + 1 + rng.int(bh - 3), x = side === 2 ? x0 : x1;
        m.init(x, y, T.floor!); m.init(x, y + 1, T.floor!);
      }
    }
  }
  // A pond and scattered trees / rubble on open ground.
  const px = 20 + rng.int(m.w - 40), py = 20 + rng.int(m.h - 40), pr = 5 + rng.int(5);
  for (let y = py - pr - 2; y <= py + pr + 2; y++) for (let x = px - pr - 2; x <= px + pr + 2; x++) {
    if (!m.inside(x, y) || isRoad[y * m.w + x]) continue;
    const t = m.get(x, y); if (t === T.wall || t === T.floor) continue;
    const d = Math.hypot(x - px, y - py) + (noise(x, y, 3) - 0.5) * 2.5;
    if (d < pr) m.init(x, y, T.water!);
  }
  for (let y = 1; y < m.h - 1; y++) for (let x = 1; x < m.w - 1; x++) {
    const t = m.get(x, y);
    if (t !== T.grass && t !== T.dirt) continue;
    if (noise(x + 500, y, 9) > 0.6 && rng.chance(0.08)) m.init(x, y, T.tree!);
    else if (rng.chance(0.006)) m.init(x, y, T.rubble!);
  }
};

/** Wilderness: forest with clearings, a river with a ford, a few cabins. */
const wilds: Gen = (m, def, rng, T) => {
  need(T, 'grass', 'dirt', 'tree', 'water', 'sand', 'floor', 'wall');
  const noise = makeNoise(rng);
  const forest = Number(def.gen.forest ?? 0.5);
  for (let y = 0; y < m.h; y++) for (let x = 0; x < m.w; x++) {
    const n = noise(x, y, 16);
    m.init(x, y, n > 0.7 ? T.dirt! : T.grass!);
    if (n < forest && rng.chance(0.22 * (forest - n) / forest + 0.02)) m.init(x, y, T.tree!);
  }
  // River from top to bottom, meandering; a ford of sand halfway.
  let rx = m.w * (0.3 + rng.next() * 0.4);
  const fordY = (m.h / 2) | 0;
  for (let y = 0; y < m.h; y++) {
    rx += (noise(7, y, 20) - 0.5) * 1.2;
    const half = 2 + noise(y, 3, 10) * 2;
    for (let x = Math.floor(rx - half - 1); x <= Math.ceil(rx + half + 1); x++) {
      if (!m.inside(x, y)) continue;
      const d = Math.abs(x - rx);
      if (Math.abs(y - fordY) < 3) m.init(x, y, T.sand!);
      else if (d < half) m.init(x, y, T.water!);
      else m.init(x, y, T.sand!);
    }
  }
  // Cabins.
  for (let c = 0, tries = 0; c < 4 && tries < 200; tries++) {
    const bw = 5 + rng.int(3), bh = 5 + rng.int(3);
    const x0 = 4 + rng.int(m.w - bw - 8), y0 = 4 + rng.int(m.h - bh - 8);
    let ok = true;
    for (let y = y0 - 1; y <= y0 + bh && ok; y++) for (let x = x0 - 1; x <= x0 + bw && ok; x++) {
      const t = m.get(x, y); if (t === T.water || t === T.sand || t === T.wall) ok = false;
    }
    if (!ok) continue;
    for (let y = y0; y < y0 + bh; y++) for (let x = x0; x < x0 + bw; x++) {
      const edge = x === x0 || x === x0 + bw - 1 || y === y0 || y === y0 + bh - 1;
      m.init(x, y, edge ? T.wall! : T.floor!);
    }
    const dx = x0 + 1 + rng.int(bw - 3);
    m.init(dx, y0 + bh - 1, T.floor!); m.init(dx + 1, y0 + bh - 1, T.floor!);
    c++;
  }
};

const GENERATORS: Record<string, Gen> = { town, wilds };

/** Build a map from its definition. Portals' spots are cleared so travellers always have room. */
export function generateMap(sc: Scenario, def: MapDef, mapSeed: string): TileMap {
  const gen = GENERATORS[def.gen.type];
  if (!gen) throw new Error(`unknown map generator "${def.gen.type}"`);
  const m = new TileMap(def.w, def.h, sc.tiles);
  const T = tileIds(sc);
  gen(m, def, new Rng(mapSeed), T);
  const clear = T.road ?? T.dirt ?? T.grass ?? sc.tiles.find((t) => !t.solid)!.id;
  const clearAround = (x: number, y: number, r: number) => {
    for (let ty = Math.floor(y - r); ty <= Math.ceil(y + r); ty++) for (let tx = Math.floor(x - r); tx <= Math.ceil(x + r); tx++) {
      if (m.inside(tx, ty) && m.solid[m.get(tx, ty)]) m.init(tx, ty, clear);
    }
  };
  for (const p of sc.portals) {
    if (p.map === def.id && !p.exit) clearAround(p.x, p.y, 3);
    if (p.to === def.id && !p.exitTo) clearAround(p.toX, p.toY, 3);
  }
  m.base = m.tiles.slice();
  return m;
}
