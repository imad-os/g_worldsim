# Notes for Claude (project memory)

Autonomous agent world simulator for imad. Full spec: the first message of the project thread "Build agent world
simulator" (milestones 1-8). Milestones 1-3, 5, 6, 7 done 2026-11-20 (4 first version, app 0.7.0); next 8 (post-apocalypse content, weather, polish).

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

## Population, travel, AI (imad 2026-11-19)
- 5 people (scenario `agents.count`, `startMap: "town"`). On start, `World.fitPopulation` trims to the count once per
  change of it (meta `agents_count`) and, while travel is closed, moves every stray to the start map.
- **Travel lock**: agents never take portals until imad opens travel in the panel (meta `travel_open`, admin `travel`).
  Players always can.
- **AI providers** (`packages/server/src/ai/llm.ts`): none / Gemini (`GEMINI_API_KEY`) / Ollama (address, optional
  `OLLAMA_API_KEY` for ollama.com). Switch in the panel's AI brain card (meta `ai`); `Ai.generate` with an hourly budget,
  2 at once. Planner code must only use `Ai`, never a provider directly. **Default (imad 2026-11-19): Ollama at
  https://ollama-cpu.chtipol.xyz, no model = the smallest installed one (fastest)**; meta `ai_defaults` = 2 moved old
  worlds once. Ollama calls send `think: false` (qwen3 spent the whole answer on thinking) and strip `<think>`.
- **Planner** (milestone 6, `ai/planner.ts`): every `everyGameHours` (3) a person is due; one request plans up to `batch`
  (5) people of one map, at most one request at a time, `minGapSec` (20) apart, stops at 80 % of the hourly budget
  (rest for chats). Answer = per person goal / with / why / say / mood / memory -> `Brain.wish` (+0.32 on that action's
  score, desperate needs still win). Memory in `Profile.mind` (notes 12, summary 400 chars, mood, rel, plan), saved in
  snapshots. Chat: panel person card (`chat`), TV A next to someone (`NetServer.onTalk`, they stop and face you); built-in
  lines without AI. Lines = event `say` -> Notice `say` to viewers of that map + admins. Panel: Planner settings, requests
  and answers (`aiLog`), Plan now (`planNow`).

## Player abilities, thoughts, game menu (imad 2026-11-20, app 0.7.0)
- Players do what people do: `Msg.Do` 'use' (the obvious thing: pick up / drink / eat) / drink / eat / pickup / sleep / talk
  -> Notice `did` { a, ok, code } + Notice `me` (my needs, also every 1 s). Players' needs change but never hurt; moving wakes.
- **Thoughts only for allowed players** (meta `seers`, default `['imad']`, panel Players card "sees thoughts", admin `seer`):
  Notice `minds` every 1 s for their view (rows `[id, act, toName, dist, wish, wishWith, why, mood, said]`), bubbles over
  heads (`ui.ts Bubbles`); `Msg.Info` -> Notice `info` (mind only for seers / admins); `Welcome.seer`.
- **The game's own menu** (`ui.ts Menu`, pages root / actions / person / settings / controls); My PC's menu has only
  "Game menu" + server. Opens with the remote's Back (twice quickly = My PC's menu) or the bound menu button (+ by default).
- **Button mapping** (Buttons page): OK on an action, then press any controller button (`MyPC.gamepad`) or remote button
  (`MyPC.buttons`, `keys: ['buttons']`); saved `MyPC.save('binds')`; defaults in `DEFAULT_BINDS`. Arrows / D-pad / Home / Back
  are never mapped. Hints are built from the binds and the pad's printed names.
- **Orders (imad 2026-11-20: "he said I'm coming but stays")**: wishes are only +0.32 bonuses; an ORDER is obeyed
  (`Brain.order` come/goto/follow/stay/stop/act, `Act.Go` = 10, only thirst > 92 / hunger > 95 interrupt). Chat answers are JSON
  `{"say","do","target"}`; safety net for small models: `askedFor(text)` (en/fr/es/ar "come", "follow me", "viens", "تعال"...)
  applies when the speaker is the owner, the answer `agrees()`, or there is no AI. TV: A next to someone = type what to say
  (My PC keyboard, `Do hold` makes them wait, `Do talk text`). Panel person card: Order row (admin `order`), "told to ..." in the summary.
  Owner "come" (no body) = to the player on that map. Proof: `node tools/panel-order-proof.mjs <server> <png>`.
- Proof: `ADMIN_TOKEN=... node tools/menu-proof.mjs <server> <sdk.js> <outdir>` (fake Xbox pad, `?dev` exposes `__dev.me()`).

## Life cycle (milestone 7, `sim/life.ts`, hourly)
- Age clock: `life.yearDays` game days per year (default 1, panel World card, meta `year_days`; `Life.rescale` keeps ages
  in years when it changes; worlds from before were counted in 365-day years and were rescaled once).
- 4+ talks between two unrelated adults (18+) of opposite sex, both single -> chance to become partners (`partner`).
  Woman 18-45 with her partner on the same map, both fed / watered, fewer than `life.maxPopulation` (14) alive ->
  0.9 / year to conceive, birth after 0.75 year (`inherit`: parents' traits + mutation, generation + 1). Under 16 =
  `EFlag.Child` (drawn at 0.62, walk 0.75). Past `traits.lifespan` the chance to die of old age grows each year.
- **`Profile.partner` -1 = none (entity id 0 is real; snapshot v2 moved old 0s)**; planner `with` -1 = nobody too.

## Agents (milestone 3, `sim/brain.ts`, `sim/pathfind.ts`)
- Needs stored as a lack (0 fine .. 100 desperate: hunger, thirst, tired, lonely) so zeros from old snapshots are healthy.
  Rates per game hour in scenario `life.needs` x `life.difficulty`; starving / parched costs hp, death at 0.
- Utility choice: Drink, Eat (carried food), Forage (food items: scenario `life.items`, spawned per game hour), Sleep
  (shelter tiles preferred, longer at night), Talk (goal -2 marks a conversation), Wander, Rest, Travel (only if open).
- A* per map (8 dirs, tile costs, no corner cutting, 6000 node budget, string pulling, 64 waypoints); paths are not in
  snapshots (walkers decide again). LOD by activity only: talk 0, walk 1, busy 2, asleep 3 (`THINK_EVERY`).
- Frames carry `sub` (bits 16-23): item type / agent action; viewers show "Following #3 · Getting water".
- `node /tmp/...life.mjs`-style check = test "life" (1 game day at clockScale 30: drink, food, sleep, talk, no deaths).

## Commands
`npm install`, `npm run build`, `npm test` (node:test: sim, persistence with a fake Firestore, server end to end),
`npm run bench -- 20 100`, `npm start -- --speed 5`. Docs: README.md, docs/ARCHITECTURE.md.
