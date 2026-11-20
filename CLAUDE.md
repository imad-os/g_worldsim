# Notes for Claude (project memory)

Autonomous agent world simulator for imad. Full spec: the first message of the project thread "Build agent world
simulator" (milestones 1-8). Milestones 1-3, 5, 6, 7 done 2026-11-20 (4 first version); 8 parts 1-3 (tasks, survival, zombies) + strict rules + animals / crafting, camera views, quick wheel done, app 0.9.0; next weather, polish; next weather, polish. Population: births only, no newcomers (imad 2026-11-20).

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
- `docs/` = My PC app (built by `npm run build`, committed; **Pages main / docs** -> https://imad-os.github.io/g_worldsim/, imad 2026-11-20:
  the site holds only the game + `docs/panel/`; the repo stays public). `docs/app/index.html` only sends the old /app/ address on. Server: `/app/` = docs/.
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
  imad's own server (address only in the PC's worldsim.config.json + the saved setting, NEVER in the public repo: Ollama has no password), no model = the smallest installed one (fastest)**; meta `ai_defaults` = 2 moved old
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
  (`Brain.order` come/goto/follow/bring/stay/stop/act; bring = fetch the nearest food if empty-handed, then hand 1 over (event `give`); `Act.Go` = 10, only thirst > 92 / hunger > 95 interrupt). Chat answers are JSON
  `{"say","do","target"}`; safety net for small models: `askedFor(text)` (en/fr/es/ar "come", "follow me", "viens", "تعال"...)
  applies when the speaker is the owner, the answer `agrees()`, or there is no AI. TV: A next to someone = type what to say
  (My PC keyboard, `Do hold` makes them wait, `Do talk text`). Panel person card: Order row (admin `order`), "told to ..." in the summary.
  Owner "come" (no body) = to the player on that map. Proof: `node tools/panel-order-proof.mjs <server> <png>`.
- **Tasks = any request as a plan of steps (imad 2026-11-20: "intelligent, not predefined commands")**: `sim/tasks.ts`
  (`World.tasks`, run every 20 ticks, stored in `Profile.mind.task`). Chat JSON may carry `"task"` + `"plan":[{"do":skill,...}]`;
  skills = `SKILLS` (goto, find, follow, talk, court, child, bring, give, stay, drink, eat, forage, sleep, rest, wander, say;
  `who: "me"` = speaker, `"found"` = the last find step's person). `Life.court` / `Life.tryChild` keep the real rules.
  A failed step ends the task with a reason: memory note + they say "I couldn't ...". Panel summary "(task: ...)", bubbles
  show it (wish `task`). Part 2 / 3 (milestone 8) add gather / craft / build / fire / zombies as more skills.
- **Survival (milestone 8 part 2, 2026-11-20, app 0.7.3)**: `sim/survival.ts` (`World.survival`). `Profile.inv` { wood, stone, scrap,
  axe, spear } (max 20). Jobs = `Brain.job` (order kind 'job': walk to a spot, then `Act.Gather` 11 / `Act.Build` 12 there; pressing
  needs pause it). Chop a tree (wood, 2 with an axe; tree hp 60 = 3 chops, regrows on its old tile), search rubble (stone, 35 % scrap).
  Recipes axe 2w+1s, spear 2w+1scrap, campfire 3w+2s (10 h of fuel, +4 h per wood, then `ashes`; sleeping within 6 m recovers x1.5),
  hut 12w+4s (5x5 `woodwall` ring, door front middle, `floor` inside = new shelter). Task skills gather / craft / build / tend (missing
  materials become gather steps). The first fire / hut sets the map's **camp** (people within 120 m sleep there; later builds go near it).
  Hourly own plans without AI: fire at dusk if none at the camp, feed a low fire, huts until one per 2 people, axe, firewood. AI: batch
  goals 'build a hut' etc. (`WORK_GOALS`), chat plans with the new skills, `askedWork(text)` keyword net. Panel: Order row work items,
  camps in the stats. TV: campfire (flames unlit = glow at night), ashes, wooden walls (`even`). Proof: `tools/camp-proof.mjs` (`?dev` `__dev.look(x, y)`).
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
`npm run bench -- 20 100`, `npm start -- --speed 5`. Docs: README.md, ARCHITECTURE.md.

## Residents, zombies, more work, strict rules (imad 2026-11-20, app 0.7.4)
- **Players' characters live 24/7** (`NetServer.residents`, spawned at start for every paired player): away = asleep where left
  (`World.away` holds ENTITY IDS, needs wait, zombies ignore them); watching = awake, standing; Play = camera jumps to it (`You` x / y).
  Listed in the panel People card with positions; `whoIs` finds them, so people can be sent to imad. Player wounds heal 20 hp / game hour.
- **Game menu > Go to someone** (play): Do `roster` -> list, Do `tp` text = entity id -> next to them (any map).
- **Zombies** (`sim/zombies.ts`, Kind.Threat, Act.Fight 13): `perNight` (meta `zombies_night`, panel Zombies card) released at 21:00,
  crumble at dawn; panel spawn next to a name or at x / y (stay). Chase prey not near a fire, bite (players floored at 5 hp), claw walls;
  people fight (armed / strong + brave) or flee to the camp fire. Player A next to one hits it. TV draws them grey-green, arms out.
- **More work** (`sim/survival.ts` + task skills): collect, store (camp crate tile 13), take, loot (ruins), farm (tile 14, berries every 12 h),
  repair, heal, trade, give materials; own plans stock the store, plant, mend, treat, make spears when zombies are on.
- **Strict rules** (`sim/rules.ts`): owner's words, at most 5 for everyone (meta `rules_all`) and 5 per person (`Profile.rules`). Each is
  compiled once by words (4 languages) and refined ONCE by the AI (`Planner.refineRule`, only adds), then enforced by the engine in
  choose / talk / orders / tasks / survival jobs / courting / babies / fights, and written in every prompt about that person. A player a
  rule forbids talking to gets no answer and no AI request. Panel Strict rules card; admin `rules` { id?, add?, remove? }.
- **Past events = zombie attack replays** (imad 2026-11-20, app 0.7.5; `sim/replays.ts`, client `replay.ts`): when a zombie goes for
  someone, everyone within 30 m is sampled 5 times a second (int16 dm positions, angle, act, hp, flags) + events (bite, killed, death,
  fight, flee, say; fight / flee once per 5 s per person), from 5 s before until 10 s quiet (max 3 min). Recordings with no event are
  dropped (a zombie at a hut wall all night). Last 20 in SQLite meta `replays` (list) + `replay:<id>` (never in snapshots / cloud).
  Viewer: game menu > Past events (Do `replays` / `replay` text = id) plays it on the 3D view (other entities hidden, camera fits the
  group): A pause, left / right 5 s, up / down speed 0.5-4x, B / Back = back to the list. Proof script idea: spawn zombies near a
  name, speed 3, wait for timeline event `replay`, then open it on the TV.
- imad 2026-11-20: "every time you update server dont wait for me": every push to main is deployed on his PC without asking.
- **Talk by voice (imad 2026-11-20, app 0.7.6, My PC API 24 `MyPC.stt`, GUIDE section 23)**: the talk action next to someone checks
  `MyPC.stt.enabled()` EVERY time: on = `listen({ maxSeconds: 10, hint: names })` (A again = stop early; 'nothing' / 'cancelled' = say
  nothing; other errors = keyboard), off / older My PC = `MyPC.text.keyboard` as before. `stt.on('text')` = the phone's mic button
  talks to the person next to me (push to talk); a result arriving both ways is sent once (`sendSpoken`). No mic / AI code in the app.

## Animals, crafting, the land (imad 2026-11-20, app 0.8.0)
- **Land** (`sim/land.ts`, run-time tile changes once, `land` in snapshots): the town is ringed by trees (`RING` 8 tiles, too thick
  to cut) with 4 roads out (one per side; the 4 town portals have `exit`, the woods portals `exitTo`, moved onto the roads at every
  start). While travel is closed, wrecked cars (tile `wreck`, hp 0) block the roads; a player pushing into them gets Notice `blocked`.
  Opening travel clears them (`land.block`). Rocks (tile `rock`): 30 clusters in the woods, 9 in town.
- **Animals** (`sim/animals.ts`, Kind.Animal 7, type in frame `kf` bits 24+): rabbit, deer, boar, wolf, bear; caps 16 woods / 4
  town, hourly spawns 30 m from people. Boar / bear fight back, wolves bite at night, bears within 5 m; fire 5 m / lamp 3.5 m keep
  them off. Kills give meat (carried) + leather + claws (`ANIMALS` drops). Agents: skill `hunt`, own plans; players: A next to one
  (or a bow shot within 14 m, uses an arrow).
- **Crafting** (`protocol/craft.ts`, ONE table for server + TV): category (weapon / clothing / defence / furniture) + exact
  ingredients = `matchRecipe` (1 wood + 1 ore = sword in Weapons, door in Furniture). Weapons damage (`WEAPONS`), clothing defence
  (`DEFENCE`, bites x (1 - def)). Players: game menu > Bag & crafting > Craft > category: put ingredients (A adds one), Make;
  Recipe guide fills the pot. Do `craft` "cat:wood=1,ore=1", Do `place` item (in front, by angle). A next to a tree / rock / rubble
  gathers (900 ms cooldown). Player bags kept by name (`survival.pinv`).
- **Blocks** (tiles 15-23): defences palisade / spikes (hurt zombies) / stonewall (half damage); door (people pass, zombies and
  animals are put back in `World.step`), window, bed (shelter, rest x2), lamp (glow + soft light pool at night, zombies back off 3 m).
- Server frames: a quiet view still gets one frame a second (the clock moves on, `Session.idle`).
- Test `craft.test.ts`; proof script idea: pair a TV in-process, hunt with A, craft through the menu, place blocks, night shot.

## Camera views and the quick action wheel (imad 2026-11-20, app 0.9.0)
- Play mode camera (`World3D.view`: top / third / first, `yaw`, `back`; saved `MyPC.save('cam')` / `'back'`): Settings > Camera,
  the action `camera` (R3 by default) or the wheel. Third / first: stick = forward / side steps along `yaw`, right stick or remote
  ◀ ▶ turn; fov 55 / 62, sight (fog + camera far) 42 / 52 / 64 m by tier, entity / view radius from it, shadow box ahead, sky light
  x1.5 so shaded walls read. First person hides my own body. Watch mode and replays stay top.
- Quick action wheel (`wheel.ts`, `#wheel`): action `wheel` (ZR / RT by default, remote ⏯): hold, point the left stick, let go;
  a short press keeps it open (D-pad / arrows round it, A / OK do it, B / Back close). Items: use, eat, drink, sleep, pick up, put
  down (first placeable in the bag), bag, camera. Saved binds get new actions' default buttons when free.
- Strings `i18n4.ts` (T4). Proof idea: fake pad with `__axis`, R3 x2 for the views, hold button 7 + axis for the wheel.

## Control panel (imad 2026-11-20: "advanced, informative, '?' guides, responsive, hosted on GitHub")
- Sources `packages/panel/src/` (no framework: `main.ts` shell + hash router, one `Screen` per page in `dashboard.ts`, `people.ts`,
  `screens.ts`; `help.ts` = every "?" text; `charts.ts` SVG charts; `livemap.ts` canvas map), built by `npm run build` into
  `docs/panel/panel.js` (committed) next to `docs/panel/index.html` + `docs/panel/panel.css` (design tokens, dark / light, phone layout <= 900 px
  with a bottom bar).
- Hosted on GitHub Pages: https://imad-os.github.io/g_worldsim/panel/ (server address typed once, or `?server=<link>`), and by the
  server itself at `/panel/`. It talks only over the WebSocket admin protocol, so ngrok's browser warning page never shows.
- Server reads for it: `overview`, `history` (one row a minute, 24 h, memory only), `mapTiles`, `live`, `people`, `replays`,
  `timeline { kind }`. Read-only admin commands are NOT written to the timeline (`READS` / `READ_BARE` in app.ts); changes are.
- Dashboard widgets chosen in Settings (`ws_dash` in localStorage), theme / accent / compact / help buttons per browser.
- Proof: `ADMIN_TOKEN=... node tools/panel-proof.mjs <server> <outdir>` (desktop + phone screenshots of every page;
  `PANEL=<page url>` opens a copy from another origin, `DARK=1`).

## Accounts: Firebase sign-in, roles, players (imad 2026-11-20)
- Firebase project **worldsim-2fe1e** (imad 2026-11-20). Panel sign-in: Google or email / password (Firebase Auth 13.4.0, SDK from gstatic loaded only when `docs/panel/firebase.json` has the
  project's public web config; `{}` = sign-in off, admin token only, and in-game admin tools stay open to every player as before).
  The admin token stays as the PC's own way in (fold-out on the sign-in card).
- Roles: Firestore `roles/<uid>` { role owner | admin | player, email, name, at }; no document = player. `players/<uid>` { name, email, at }
  = who joined. Rules: `firebase/firestore.rules` (OWNER_EMAIL placeholder: imad's email is ONLY in the copy published in the
  console, never in the repo). New sign-in: the panel creates its roles doc (`fb.ensureRole`: tries 'owner', the rules allow it only
  for the owner's verified email, else 'player'). Only the owner changes roles (Users & roles page, Firestore REST PATCH).
- Server (`auth/firebase.ts`, no service account): Hello token `fb:<ID token>` -> RS256 check against Google's public keys (aud /
  iss = project from `docs/panel/firebase.json` or config `auth.projectId`) -> role read from Firestore with THAT person's token
  (cached 30 s; config `auth.projectId` 'none' = off, the tests use it) -> SQLite `accounts` (uid, name, email, role). owner / admin = session role 'admin'; player = role 'player', only
  `PLAYER_CMDS` (me, joinWorld, approveMine = link their own TV under their name, revokeMine). In-game admin tools (Go to someone /
  `tp`) = `App.isStaff(name)`. A role change counts from that person's next sign-in.
- Tests: `auth.test.ts` (fake Google key + Firestore). Proof: `node tools/auth-proof.mjs <outdir>` (fake SDK + Firestore, real server
  and panel: owner by Google, player by email joins, owner makes her admin).

## TVs join by themselves, saved brains, Gemini key turns (imad 2026-11-20)
- **Players never sign in to the panel**: a TV that opens the World app joins at once under its My PC profile name (meta `auto_join`,
  default on; admin `autoJoin { on? }`, switch on Players & TVs). A taken name (any case) gets "(2)"; an owner's / admin's character
  name is reserved (`Players.reserved` = `Accounts.isStaff`). Off = the old 6-digit code + approval / approveMine.
- **Brains** (`ai/brains.ts`, meta `brains` { active, list [{ id, name, provider, url, model, key }] }, server DB only): admin `brains`,
  `brainSave` (key undefined = keep, '' = remove; `addKey` appends keys, `removeKey` = index; panel: key chips …last4 + ✕, "Add key"), `brainUse`, `brainDelete` (not the one in use), `brainModels` / `brainTest` (a temporary
  `Ai`, the live one untouched). Clients get keys only as a count + last 4 characters. First start seeds the AI in use (+ "Gemini (keys
  in .env)" when .env has keys). Old `aiSet` updates the brain in use. Provider `openai` = any OpenAI-compatible API (`/v1` base, Bearer key).
- **Keys take turns**: `GEMINI_API_KEYS=k1,k2` (and/or `GEMINI_API_KEY`) in .env, or several comma-separated keys in a brain's key
  field: round robin per call (`Ai.nextKey`). A brain's own key wins over .env. `OPENAI_API_KEY` in .env also works.
