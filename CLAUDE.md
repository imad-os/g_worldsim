# Notes for Claude (project memory)

Autonomous agent world simulator for imad. Full spec: the first message of the project thread "Build agent world
simulator" (milestones 1-8). Milestones 1-2 done 2026-11-19; next is 3 (needs, utility AI, A*, LOD).

## Owner rules
- Push straight to `main` (no branches / PRs). Never say something works without a real run and proof (screenshot,
  test output). Ask imad before any decision the spec does not cover.
- The **simulator is NOT a My PC app**: a standalone headless Node server on imad's PC, full physics.
  Only the **viewer client** is a My PC app (follow https://raw.githubusercontent.com/imad-os/g/main/sdk/GUIDE.md,
  fetched fresh): locked 60 fps, low-end Samsung TVs (Chromium 108, `target: chrome108`, no CSS nesting), remote /
  gamepad only, A B X Y in the Nintendo places + the **+** button, printed A = OK, B = Back. Strings en / fr / es / ar.
- Several players (each their own viewer token), not only imad. Agents know the maps and travel between them.
- fps / GPU tests run on imad's PC (i5-6600, HD 530), headless; the cloud container has no GPU.
- Firestore: free tier only, never per-tick writes, batched outbox with a daily cap.

## Viewer app and access (2026-11-19)
- `app/` = My PC app (built by `npm run build`, committed; Pages main / root -> https://imad-os.github.io/g_worldsim/app/).
  Config `server` = the public link. Pairing: TV shows a code, panel approves, token per My PC profile (`MyPC.save('auth')`),
  server keeps a SHA-256 in SQLite `players`. Never a login form of our own (GUIDE: My PC owns accounts).
- Tunnel adapters in `packages/server/src/tunnel.ts` (ngrok / tailscale / cloudflare / cloudflare-quick / none).
- On imad's PC: `D:\frb\g_worldsim`, portable Node 22 in `.node\` (system Node is 20), started hidden in the background.

## Viewer look (imad 2026-11-19: "2.5D like the 3DS Zelda games, refined, not pixelated")
- three.js low-poly 3D, camera tilted 58 degrees looking north (`packages/client/src/gfx/`): smooth half-tile ground with
  soft blends, ruined walls, low-poly trees, rocks, grass; people = instanced body / head / hair / legs / arms with a walk
  cycle; sun / moon follow the game clock; shadows on mid / high tiers, round blob shadows on low.
- Play mode (default): your own character (Join / Input), predicted locally and corrected towards the server. Watch mode
  in My PC's menu. Proof: `node tools/view-proof.mjs <server> <sdk.js> <outdir>` (ADMIN_TOKEN set; pairs, walks, screenshots;
  the cloud has software GL only, ~7 fps: fps proof belongs on imad's PC).

## Commands
`npm install`, `npm run build`, `npm test` (node:test: sim, persistence with a fake Firestore, server end to end),
`npm run bench -- 20 100`, `npm start -- --speed 5`. Docs: README.md, docs/ARCHITECTURE.md.
