import type { Msg } from './constants.js';

export type Role = 'viewer' | 'admin';

/** Client -> server: first message. `resume` = the session id of a previous connection, to keep its interest state. */
export interface Hello { t: typeof Msg.Hello; v: number; token: string; name?: string; resume?: string }

/** Client -> server: the area the client wants to see (a map plus a centre and a radius in metres). */
export interface View { t: typeof Msg.View; map: string; x: number; y: number; r: number }

/** Client -> server, instead of Hello when the device has no token: start a pairing. */
export interface Pair { t: typeof Msg.Pair; v: number; name: string; dev?: string }

/** Client -> server: spawn (or take back) my character. */
export interface Join { t: typeof Msg.Join }
/**
 * Client -> server: my controls, sent on change and at least every 250 ms while held.
 * mx, my = stick -1..1 (screen up = -y), run, act = interact pressed (edge), seq = counter.
 */
export interface Input { t: typeof Msg.Input; mx: number; my: number; run?: boolean; act?: boolean; seq?: number }

/** Client -> server: list the people of a map (answer: Notice kind 'people', data [id, x, y, act][]). */
export interface Who { t: typeof Msg.Who; map: string }

export interface Ping { t: typeof Msg.Ping; c: number }

/** Admin commands (control panel). Every field is validated server side. */
export type AdminCmd =
  | { cmd: 'speed'; speed: number }
  | { cmd: 'pause'; paused: boolean }
  | { cmd: 'snapshot' }
  | { cmd: 'stats' }
  | { cmd: 'spawn'; map: string; x: number; y: number; kind?: number }
  | { cmd: 'remove'; id: number }
  | { cmd: 'shoot'; map: string; x: number; y: number; dx: number; dy: number }
  | { cmd: 'damageTile'; map: string; tx: number; ty: number; amount: number }
  | { cmd: 'pairings' }
  | { cmd: 'approve'; code: string; name?: string }
  | { cmd: 'deny'; code: string }
  | { cmd: 'players' }
  | { cmd: 'revoke'; name: string }
  | { cmd: 'tunnel' }
  | { cmd: 'tunnelSwitch'; provider: 'ngrok' | 'tailscale' | 'cloudflare' | 'cloudflare-quick' | 'none' }
  /** Let agents take portals to other maps (players always can). */
  | { cmd: 'travel'; open: boolean }
  | { cmd: 'ai' }
  | { cmd: 'aiModels' }
  | { cmd: 'aiSet'; provider: 'none' | 'gemini' | 'ollama'; model?: string; ollamaUrl?: string }
  | { cmd: 'aiTest'; prompt?: string };

export interface Admin { t: typeof Msg.Admin; id: number; c: AdminCmd }

export interface MapInfo { id: string; name: string; w: number; h: number; tileSize: number; chunkTiles: number }
export interface PortalInfo { id: string; map: string; x: number; y: number; to: string; toX: number; toY: number; travel: number }
export interface TileTypeInfo { id: number; name: string; solid: boolean; color: number }

export interface Welcome {
  t: typeof Msg.Welcome;
  v: number;
  session: string;
  role: Role;
  scenario: string;
  maps: MapInfo[];
  portals: PortalInfo[];
  tiles: TileTypeInfo[];
  clock: ClockInfo;
  /** People's body: radius and walk / run speeds (m/s), so a player's own client can predict its moves. */
  body?: { radius: number; walk: number; run: number };
}

export interface ClockInfo {
  tick: number;
  /** Game time in game seconds since the world started. */
  gameSec: number;
  speed: number;
  paused: boolean;
  /** Game seconds per simulated second (1 real minute = 10 game minutes -> 10). */
  clockScale: number;
  tickRate: number;
}

export interface ErrorMsg { t: typeof Msg.Error; code: string; msg?: string }

/** A chunk's tiles (CHUNK_TILES^2 bytes, row major) and its version (bumped on every change). */
export interface Chunk { t: typeof Msg.Chunk; map: string; cx: number; cy: number; ver: number; tiles: Uint8Array }
export interface ChunkDrop { t: typeof Msg.ChunkDrop; map: string; keys: number[] }

/**
 * Entity frame (10-20 Hz). `upd` = packed Int32 records ENT_REC long:
 *   [id, kind | flags << 8 | sub << 16, x (cm), y (cm), angle (1e-4 rad), vx (cm/s), vy (cm/s)]
 * sub = item type for items, the current action (Act) for agents.
 * `del` = ids that left the view or died. A client interpolates between frames using `tick`.
 */
export interface Frame { t: typeof Msg.Frame; tick: number; gameSec: number; map: string; upd: Uint8Array; del: number[] }
export const ENT_REC = 7;

export interface Stats { t: typeof Msg.Stats; s: ServerStats }
export interface ServerStats {
  tick: number;
  speed: number;
  paused: boolean;
  /** Effective simulated seconds per real second (may be below `speed` when the machine can not keep up). */
  effSpeed: number;
  tps: number;
  tickMsAvg: number;
  tickMsP95: number;
  tickMsMax: number;
  rssMb: number;
  heapMb: number;
  cpuPct: number;
  entities: number;
  agents: number;
  clients: number;
  lastSnapshotAt: number;
  uptimeSec: number;
  tunnel?: { provider: string; state: string; url: string; error?: string };
  pairings?: number;
  travelOpen?: boolean;
  ai?: { provider: string; model: string; ready: boolean; why?: string };
}

export interface You { t: typeof Msg.You; id: number; map: string; transit: boolean; arrive?: number }

export interface PairCode { t: typeof Msg.PairCode; code: string; exp: number }
export interface Paired { t: typeof Msg.Paired; token: string; name: string }
export interface Notice { t: typeof Msg.Notice; kind: string; data?: unknown }

export interface Pong { t: typeof Msg.Pong; c: number; s: number }
export interface AdminResult { t: typeof Msg.AdminResult; id: number; ok: boolean; data?: unknown; err?: string }

export type ClientMsg = Hello | Pair | Join | Input | View | Ping | Admin | Who;
export type ServerMsg = Welcome | ErrorMsg | Chunk | ChunkDrop | Frame | Stats | Pong | AdminResult | PairCode | Paired | Notice | You;
