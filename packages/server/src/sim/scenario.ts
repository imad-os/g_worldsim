import { readFileSync } from 'node:fs';
import { join } from 'node:path';

export interface TileType {
  id: number;
  name: string;
  /** Blocks movement (gets a physics collider). */
  solid: boolean;
  /** Collider shape for solid tiles. */
  shape?: 'box' | 'circle';
  /** Hit points (0 = indestructible). */
  hp?: number;
  /** Tile it becomes when destroyed. */
  breaksTo?: number;
  /** Path cost multiplier for walkable tiles (1 = normal). */
  cost?: number;
  /** Colour for debug views and the map (0xRRGGBB). */
  color: number;
}

export interface MapDef {
  id: string;
  name: string;
  w: number;
  h: number;
  gen: { type: string; [k: string]: unknown };
  /** Dangerous for people (children never go); default: true for generated wilds. */
  danger?: boolean;
  /**
   * What lives and lies about on this map, when it differs from its kind (wilds / town): animal cap, wild horse cap,
   * rocks kept (cap), herbs kept, rock clusters laid on a new world. Missing = the kind's numbers.
   */
  life?: { animals?: number; horses?: number; rocks?: number; herbs?: number; rockClusters?: number };
}

export interface PortalDef {
  id: string;
  map: string;
  x: number;
  y: number;
  to: string;
  toX: number;
  toY: number;
  /** Travel time in game seconds. */
  travel: number;
  /** Radius in metres that triggers it. */
  r?: number;
  /** A town exit (north / south / east / west): placed on the road there at start (sim/land.ts). */
  exit?: string;
  /** Arrives at that town exit (its arrival point follows the exit). */
  exitTo?: string;
}

export interface Scenario {
  id: string;
  name: string;
  seed: number | string;
  tiles: TileType[];
  maps: MapDef[];
  portals: PortalDef[];
  /** count = people in a new world; startMap = where they all start (default: spread over every map). */
  agents: { count: number; radius: number; walk: number; run: number; hp: number; startMap?: string };
  projectile: { radius: number; speed: number; damage: number; ttl: number };
  /** Needs, food items, water / shelter tiles (see sim/brain.ts LIFE_DEFAULTS). */
  life?: Partial<Omit<import('./brain.js').LifeDef, 'needs'>> & { needs?: Partial<import('./brain.js').NeedsDef> };
}

export function loadScenario(dir: string): Scenario {
  const sc = JSON.parse(readFileSync(join(dir, 'scenario.json'), 'utf8')) as Scenario;
  validateScenario(sc);
  return sc;
}

export function validateScenario(sc: Scenario): void {
  const fail = (m: string) => { throw new Error(`scenario ${sc.id ?? '?'}: ${m}`); };
  if (!sc.id || !/^[a-z0-9-]{2,40}$/.test(sc.id)) fail('bad id');
  if (!Array.isArray(sc.tiles) || sc.tiles.length === 0 || sc.tiles.length > 255) fail('tiles: 1..255 types');
  const ids = new Set<number>();
  for (const t of sc.tiles) {
    if (!Number.isInteger(t.id) || t.id < 0 || t.id > 255 || ids.has(t.id)) fail(`tile id ${t.id}`);
    ids.add(t.id);
  }
  for (const t of sc.tiles) if (t.breaksTo !== undefined && !ids.has(t.breaksTo)) fail(`tile ${t.name} breaksTo ${t.breaksTo}`);
  if (!Array.isArray(sc.maps) || sc.maps.length === 0 || sc.maps.length > 250) fail('maps: 1..250');
  const mapIds = new Set<string>();
  for (const m of sc.maps) {
    if (!m.id || mapIds.has(m.id)) fail(`map id ${m.id}`);
    mapIds.add(m.id);
    if (!(m.w >= 32 && m.w <= 4096 && m.h >= 32 && m.h <= 4096)) fail(`map ${m.id} size`);
  }
  for (const p of sc.portals ?? []) {
    if (!mapIds.has(p.map) || !mapIds.has(p.to)) fail(`portal ${p.id} maps`);
    if (!(p.travel >= 0)) fail(`portal ${p.id} travel`);
  }
}
