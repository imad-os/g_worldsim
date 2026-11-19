/** Wire protocol version. Bump on any breaking change; server and clients refuse a mismatch. */
export const PROTOCOL_VERSION = 1;

/** World units: 1 unit = 1 metre. One tile = TILE_SIZE metres. */
export const TILE_SIZE = 1;
/** Tiles per chunk side. Chunks are the unit of streaming, physics colliders and persistence diffs. */
export const CHUNK_TILES = 32;
export const CHUNK_SIZE = CHUNK_TILES * TILE_SIZE;

/** Positions on the wire: centimetres in an int32. Angles: 1/10000 rad in an int16. */
export const POS_Q = 100;
export const ANG_Q = 10000;

/** Entity kinds. Scenario packs map their own types onto these engine kinds. */
export const Kind = {
  None: 0,
  Agent: 1,
  Projectile: 2,
  Item: 3,
  Prop: 4,
  Threat: 5,
} as const;
export type Kind = (typeof Kind)[keyof typeof Kind];

/** Entity flags (bit field, sent to clients). */
export const EFlag = {
  Alive: 1,
  Moving: 2,
  Sleeping: 4,
  Transit: 8, // travelling between maps, not in any map
  Dead: 16,
} as const;

/** Message type tags (first field `t` of every message). Short strings keep msgpack small and readable in logs. */
export const Msg = {
  // client -> server
  Hello: 'hi',
  View: 'view', // interest area
  Ping: 'ping',
  Admin: 'adm',
  Pair: 'pair', // ask to pair this device (no token yet)
  // server -> client
  Welcome: 'wel',
  Error: 'err',
  Chunk: 'chk',
  ChunkDrop: 'chx',
  Frame: 'frm',
  Stats: 'sts',
  Pong: 'pong',
  AdminResult: 'admr',
  PairCode: 'pairc', // the code to show on the TV
  Paired: 'paired',  // approved: the device's own token
  Notice: 'note',    // something to tell admins live (a TV waiting to be paired...)
} as const;
