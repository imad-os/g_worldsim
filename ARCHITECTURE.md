# Architecture (milestones 1-2)

## Time
- The world advances in fixed ticks of 1/`tickRate` simulated seconds (default 20 Hz; 15 Hz in low-spec mode).
  Physics always gets the same step, so it stays accurate at any speed.
- `speed` (x0.01 .. x100, panel or `--speed`) is how many ticks run per real second: x1 = 20 ticks/s, x100 = 2000.
  If the PC can not keep up it runs what it can (25 ms per wake, so the network stays responsive) and drops the
  backlog; the panel shows the effective speed.
- The game clock runs `clockScale` (10) game seconds per simulated second: **1 real minute = 10 game minutes**
  at x1, a game day = 2.4 real hours. Movement is at real-life speed (people walk 1.4 m/s); only the clock
  (day / night, needs, travel times) is accelerated, like in life-sim games.

## World
- Units: metres. Tiles are 1 m; chunks are 32 x 32 tiles (streaming, colliders, persistence diffs).
- Several maps per world (`town` Old Town 256 x 256 m in the middle; round it, 192 x 192 m each: `woods` Pine Woods east,
  `ridge` Ridgeford north (a second town), `firs` Black Fir Forest south (lakes, no river), `farms` Willow Farms west
  (generator `farms`)), generated from the world seed. Each town gate leads to its own map and the four outer maps are
  linked in a ring (woods - ridge - farms - firs - woods). Portals link
  maps; a traveller leaves the physics world, spends the portal's travel time (game seconds) in transit, then
  appears at the other end. `World.routeMaps(a, b)` gives the fastest chain of portals (agents know every map).
- Entities are a struct-of-arrays of typed arrays with a fixed capacity, a free list and generation-tagged ids
  (`gen << 16 | slot`): no allocation per tick.
- One spatial hash grid per map (4 m cells, linked lists in typed arrays, rebuilt each tick in O(n)).
- LOD: each agent thinks on its own schedule (every 2 / 10 / 40 / 120 ticks by level). Levels depend on what the
  agent does, never on cameras or viewers.

## Physics
- Planck.js (Box2D), one world per map, top-down, no gravity, 8 velocity / 3 position iterations.
- Solid tiles become static colliders: one body per chunk, tiles merged into as few boxes as possible; trees are
  circles. A changed chunk (a wall shot down) gets its body rebuilt after the step.
- Agents are dynamic circles steered toward a target with an acceleration limit. Projectiles are bullet bodies
  (continuous collision), never hit their shooter, damage agents or tiles (walls break into rubble).
- Deterministic: same seed + same commands = the same world (tested). After a restore Box2D's contact cache is
  rebuilt, so paths can drift slightly from an uninterrupted run; the state itself restores exactly.

## Persistence
- SQLite (Node's built-in `node:sqlite`, WAL): a full snapshot every 30 s and on shutdown, newest 5 kept,
  written in one transaction. At start the newest snapshot that loads is used (a damaged one falls back to the
  previous). Killed with `kill -9`, the server loses at most one snapshot interval. Notable events go to an
  `events` table in batches (timeline, "while you were away").
- Firestore is a backup, off until a service account is in `.env`: every 5 min the outbox gets only what
  changed (world doc, one entities doc, changed chunks as diffs vs the generated map) and uploads it in one
  commit, under a daily write cap (15 000 of the free 20 000). With no local database, the server rebuilds the
  world from the cloud copy.

## Network
- HTTP: `/health`, `/api/stats` (admin bearer token), static files for the viewer and `/panel/`.
- WebSocket `/ws`, binary MessagePack (`packages/protocol`). First message `hi` with a token: each player has
  their own viewer token (`VIEWER_TOKENS`), the panel uses `ADMIN_TOKEN`. Wrong tokens: 5 tries per IP per 10 min.
  20 connections per IP per minute, 30 messages per second per connection, 64 KB per message, every field checked.
- Interest management: a viewer sends `view` (map, centre, radius). It gets that area's chunks (nearest first,
  6 per frame, versioned, dropped when far) and, 10 times a second, only entities in view that changed, as
  packed int32 records (cm positions). Slow sockets skip frames. Reconnect with `resume` keeps the view.

## Local AI (agents deciding without the LLM)

See `research/ARCHITECTURE.md` (needs, goal planning, learning, construction under constraints) and `research/EXPERIMENTS.md`.
