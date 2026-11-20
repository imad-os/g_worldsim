# World simulator

A headless, 24/7 simulation of a small world of autonomous agents (up to 100), plus a viewer that runs as a
**My PC** app on the TV and a control panel for a PC or phone. The simulation never depends on a viewer:
the same ticks give the same world whether anyone watches or not. Scenarios (post-apocalypse first) are data
packs in `scenarios/`, not engine code.

Status: **milestones 1 and 2** (monorepo, tick loop, maps and chunks, physics, persistence, WebSocket API).
The agents only wander and travel between maps for now; needs, utility AI and pathfinding are milestone 3.

## Run it (Windows, macOS or Linux)

Needs **Node.js 22.13 or newer** (it uses Node's built-in SQLite, so there is nothing native to compile).

```sh
npm install
copy .env.example .env        # (cp on macOS / Linux) then put your own tokens in it
npm run build
npm start                     # or: npm start -- --speed 10 --low-spec
```

- Health: `http://127.0.0.1:8787/health` (no login).
- Control panel: `http://127.0.0.1:8787/panel/` (admin token).
- Debug view: `http://127.0.0.1:8787/debug.html?token=<viewer token>` (arrows move, + / - zoom, M next map).
- Benchmark: `npm run bench -- 20 100` (ms per tick, the highest speed this PC can run, RAM, snapshot size).
- Tests: `npm test`.
- Stop cleanly (snapshot first, works on Windows too): `node tools/stop.mjs`.

The server listens on 127.0.0.1 only. From the internet it is reached through an **outbound tunnel** (no router
port): `tunnel.provider` in `worldsim.config.json` or `--tunnel` = `ngrok` (set `tunnel.ngrokDomain` to your free
static domain), `tailscale` (Funnel), `cloudflare` (named tunnel: `CLOUDFLARE_TUNNEL_TOKEN` in `.env` +
`tunnel.cloudflareHostname`), `cloudflare-quick` (random trycloudflare.com link) or `none`. The panel shows the
public link and switches providers live (the new one must answer before the old one stops).

## The TV app (My PC)

`docs/` is the viewer as a My PC app (GitHub Pages, main / docs: `https://imad-os.github.io/g_worldsim/`; the control panel is
`docs/panel/` at `https://imad-os.github.io/g_worldsim/panel/`; both also served by the
server at `/app/`). Add it in the App Store Manager and set its config `server` to the public link. The first time,
the TV shows a 6-digit code: approve it in the panel (TVs waiting). The TV keeps its own token per My PC profile, so it
never asks again; Players in the panel removes a TV. Several players can pair. `npm run build` rebuilds `docs/game.js`;
bump `version` in `docs/mypc-app.json` for each release.

## Layout

| Folder | What |
|---|---|
| `packages/protocol` | Shared wire protocol: message types, MessagePack codec, units, chunk keys. Used by the server and both web clients. |
| `packages/server` | The simulation (TypeScript, Node). `sim/` world, maps, physics, entities; `persist/` SQLite + Firestore; `net/` HTTP + WebSocket. |
| `packages/client` | Viewer. Now: a debug view that proves the stream end to end. Milestone 4: the PixiJS v8 My PC app. |
| `packages/panel` | Control panel (now: time speed, pause, snapshot, live stats). Milestone 5 adds the rest. |
| `scenarios/` | Scenario packs (`scenario.json`: tiles, maps, portals between maps, agent and projectile settings). |
| `ARCHITECTURE.md` | How the pieces work and the decisions behind them. |

## Configuration

`worldsim.config.json` (optional, see `worldsim.config.example.json`) + command line (`--speed`, `--port`, `--host`,
`--data`, `--scenario`, `--tick-rate`, `--low-spec`). Secrets only in `.env` (see `.env.example`); nothing in it is
ever sent to a client.
