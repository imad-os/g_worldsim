import type { Msg } from './constants.js';

/** viewer = a paired TV; admin = the admin token or a Firebase owner / admin; player = a Firebase player in the panel. */
export type Role = 'viewer' | 'admin' | 'player';

/** Client -> server: first message. `resume` = the session id of a previous connection, to keep its interest state. */
/** `token`: a viewer / admin token, or `fb:<Firebase ID token>` (panel sign-in with Google or email). */
export interface Hello { t: typeof Msg.Hello; v: number; token: string; name?: string; resume?: string }

/** Client -> server: the area the client wants to see (a map plus a centre and a radius in metres). */
export interface View { t: typeof Msg.View; map: string; x: number; y: number; r: number }

/** Client -> server, instead of Hello when the device has no token: start a pairing. */
export interface Pair { t: typeof Msg.Pair; v: number; name: string; dev?: string }

/** Client -> server: spawn (or take back) my character. */
export interface Join { t: typeof Msg.Join; /** In watch mode: my character goes on AI autopilot until I play again. */ watch?: boolean }
/**
 * Client -> server: my controls, sent on change and at least every 250 ms while held.
 * mx, my = stick -1..1 (screen up = -y), run, act = interact pressed (edge), seq = counter.
 */
export interface Input { t: typeof Msg.Input; mx: number; my: number; run?: boolean; act?: boolean; seq?: number; /** where the screen has my character now (it moves it at once) */ x?: number; y?: number }

/** Client -> server: my character does something (answer: Notice 'did' { a, ok, code }, then Notice 'me'). */
export interface Do { t: typeof Msg.Do; a: string; /** 'talk': what I say (typed on the TV). */ text?: string }
/** Client -> server: about one person (answer: Notice 'info'). */
export interface Info { t: typeof Msg.Info; id: number }
/** Client -> server: list the people of a map (answer: Notice kind 'people', data [id, x, y, act][]). */
export interface Who { t: typeof Msg.Who; map: string }

export interface Ping { t: typeof Msg.Ping; c: number }

/** Admin commands (control panel). Every field is validated server side. */
/**
 * An admin command's value outside the usual range fails with an error starting with this; the panel then asks
 * "are you sure?" and, on yes, sends the same command again with `force: true` (still inside what the engine can hold).
 */
export const CONFIRM = 'confirm: ';
export type AdminCmd =
  // a Firebase player may use only these (about themselves)
  | { cmd: 'me' }
  | { cmd: 'clans' }
  | { cmd: 'joinWorld'; name: string }
  | { cmd: 'approveMine'; code: string }
  | { cmd: 'revokeMine' }
  // staff
  | { cmd: 'accounts' }
  | { cmd: 'speed'; speed: number }
  | { cmd: 'pause'; paused: boolean }
  | { cmd: 'snapshot' }
  | { cmd: 'stats' }
  | { cmd: 'spawn'; map: string; x: number; y: number; kind?: number }
  | { cmd: 'remove'; id: number }
  | { cmd: 'shoot'; map: string; x: number; y: number; dx: number; dy: number }
  | { cmd: 'damageTile'; map: string; tx: number; ty: number; amount: number }
  | { cmd: 'pairings' }
  /** TVs join at once under their My PC username (default) or wait for approval. */
  | { cmd: 'autoJoin'; on?: boolean }
  /** Attach a player (character name) to an account, so that account has the character; name '' detaches. */
  | { cmd: 'linkPlayer'; uid: string; name: string }
  | { cmd: 'approve'; code: string; name?: string }
  | { cmd: 'deny'; code: string }
  | { cmd: 'players' }
  | { cmd: 'revoke'; name: string }
  | { cmd: 'mergePlayer'; from: string; into: string; keep?: 'from' | 'into' }
  | { cmd: 'tunnel' }
  | { cmd: 'tunnelSwitch'; provider: 'ngrok' | 'tailscale' | 'cloudflare' | 'cloudflare-quick' | 'none' }
  /** Let agents take portals to other maps (players always can). */
  | { cmd: 'travel'; open: boolean }
  | { cmd: 'ai' }
  | { cmd: 'aiModels' }
  | { cmd: 'aiSet'; provider: 'none' | 'gemini' | 'ollama' | 'openai'; model?: string; ollamaUrl?: string }
  /** Saved brains (provider + address + model + key); keys are never sent back, only how many and their last 4 characters. */
  | { cmd: 'brains' }
  | { cmd: 'brainSave'; id?: string; name?: string; provider?: string; url?: string; model?: string; key?: string; addKey?: string; removeKey?: number }
  | { cmd: 'brainUse'; id: string }
  | { cmd: 'brainDelete'; id: string }
  | { cmd: 'brainFallback'; id: string }
  | { cmd: 'brainModels' | 'brainTest'; id?: string; provider?: string; url?: string; model?: string; key?: string }
  | { cmd: 'aiTest'; prompt?: string }
  /** People: list, one in detail, change values, move, kill. */
  | { cmd: 'agents' }
  | { cmd: 'agent'; id: number }
  | { cmd: 'agentSet'; id: number; set: Record<string, number | string> }
  | { cmd: 'agentMove'; id: number; map: string; x?: number; y?: number }
  | { cmd: 'kill'; id: number }
  /** World: drop food, difficulty (0.25 easy .. 3 hard), recent events. */
  | { cmd: 'supply'; map: string; x?: number; y?: number; n?: number }
  | { cmd: 'difficulty'; value: number }
  | { cmd: 'timeline'; limit?: number; kind?: string }
  /** AI planner (milestone 6): settings, the last requests and answers, plan someone now, talk to someone. */
  | { cmd: 'planner'; on?: boolean; everyGameHours?: number; batch?: number; minGapSec?: number }
  | { cmd: 'aiLog' }
  /** Who sees people's thoughts and plans on their TV. */
  | { cmd: 'seer'; name: string; on: boolean }
  /** Life cycle (milestone 7): game days per year of age, the most people alive for a baby to come. */
  | { cmd: 'life'; yearDays?: number; maxPopulation?: number }
  /** Zombies (milestone 8): how many are released at random each night, clear them all; answers the ones out now. */
  | { cmd: 'zombies'; perNight?: number; clear?: boolean; cfg?: { hp?: number; speed?: number; bite?: number; sight?: number; smell?: number }; applyNow?: boolean }
  /** One (or n) zombie now: next to someone (`near` = a name, `dist` metres), or at (x, y) on a map (random when empty). */
  /** Animals per map: the owner's counts of each animal (null = back to the built-in mix), `fill` = now instead of a few each hour. */
  | { cmd: 'animals'; map?: string; want?: number[] | null; fill?: boolean }
  /** Planned zombie attacks: add one (in `days` days at hour:minute), remove one, or run one now. */
  | { cmd: 'zombieAttack'; add?: { days?: number; hour?: number; minute?: number; map?: string; n?: number; where?: string; near?: string; daily?: boolean; stays?: boolean }; remove?: number; now?: { map?: string; n?: number; where?: string; near?: string; stays?: boolean } }
  | { cmd: 'zombieSpawn'; map?: string; x?: number | string; y?: number | string; near?: string; dist?: number; n?: number; stays?: boolean }
  /** The owner's strict rules (at most 5 each): for everyone (no id) or one person; `add` = the words, `remove` = an index. */
  | { cmd: 'rules'; id?: number; add?: string; remove?: number }
  | { cmd: 'planNow'; id: number }
  /** Tell a person what to do now (no AI): goto / follow (target = a name), stay, stop, or a goal (drink, forage...). */
  | { cmd: 'order'; id: number; kind: string; target?: string }
  | { cmd: 'chat'; id: number; text: string }
  // Control panel 2 (2026-11-20): the dashboard's overview and history, a map's tiles, what moves on a map, everyone who ever lived, past events.
  | { cmd: 'overview' }
  | { cmd: 'history' }
  | { cmd: 'mapTiles'; map: string }
  | { cmd: 'live'; map: string }
  | { cmd: 'people' }
  | { cmd: 'replays' }
  // The panel's AI agent (2026-11-25, owner only): it looks on its own, proposes code; nothing runs until agentRun.
  | { cmd: 'coder' }
  | { cmd: 'coderAsk'; text: string }
  | { cmd: 'coderRun'; id: number; code?: string }
  | { cmd: 'coderCancel'; id: number }
  | { cmd: 'coderUndo'; id: number }
  | { cmd: 'coderReset' }
  | { cmd: 'coderBrain'; id: string }
  | { cmd: 'coderAudit'; limit?: number }
  // Server controls (2026-11-25, owner only for the ones that change the PC).
  | { cmd: 'serverInfo' }
  | { cmd: 'serverLog'; lines?: number; level?: string }
  | { cmd: 'serverRestart' }
  | { cmd: 'serverBuild'; restart?: boolean }
  | { cmd: 'serverUpdate'; restart?: boolean }
  | { cmd: 'backups' }
  | { cmd: 'backupMake' }
  | { cmd: 'backupRestore'; file: string }
  | { cmd: 'backupDelete'; file: string };

export interface Admin { t: typeof Msg.Admin; id: number; c: AdminCmd & { force?: boolean } }

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
  /** This viewer may see what people think and plan (the owner's choice in the panel). */
  seer?: boolean;
  /** Signed in with Firebase: the account (role owner / admin / player, character name, '' until they join). */
  account?: { uid: string; role: 'owner' | 'admin' | 'player'; name: string; email: string };
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
  difficulty?: number;
  yearDays?: number;
  maxPopulation?: number;
  /** Per map: the camp (where the first fire or hut went up), huts and burning fires (milestone 8). */
  zombies?: { now: number; perNight: number };
  camps?: { map: string; x: number; y: number; huts: number; fires: number }[];
  ai?: { provider: string; model: string; ready: boolean; why?: string; plans?: number; chats?: number; failures?: number };
}

/** x, y: where the character is now (the viewer's camera goes there). */
export interface You { t: typeof Msg.You; id: number; map: string; transit: boolean; arrive?: number; x?: number; y?: number }

export interface PairCode { t: typeof Msg.PairCode; code: string; exp: number }
export interface Paired { t: typeof Msg.Paired; token: string; name: string }
export interface Notice { t: typeof Msg.Notice; kind: string; data?: unknown }

export interface Pong { t: typeof Msg.Pong; c: number; s: number }
export interface AdminResult { t: typeof Msg.AdminResult; id: number; ok: boolean; data?: unknown; err?: string }

export type ClientMsg = Hello | Pair | Join | Input | View | Ping | Admin | Who | Do | Info;
export type ServerMsg = Welcome | ErrorMsg | Chunk | ChunkDrop | Frame | Stats | Pong | AdminResult | PairCode | Paired | Notice | You;
