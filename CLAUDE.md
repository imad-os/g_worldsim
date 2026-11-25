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
- **Never locked out (imad 2026-11-21, ERR_NGROK_3200: the server had been started from a Claude session and died with it)**:
  `TunnelManager` asks the public `/health` every minute; 3 misses in a row = stop + start the tunnel (waits grow to 10 min while it
  keeps failing; `tunnel` status carries `check`). On the PC the server is started ONLY by the Windows task "WorldSim Watchdog"
  (every 2 min + at logon; local /health down = start it hidden; public link failing twice = clean restart; log data/watchdog.log),
  never as a child of a Claude session. Deploys write `data/watchdog.pause` first and delete it after the restart.
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

## Buttons: interact, talk, attack, aim, build (imad 2026-11-20, binds v2)
- `DEFAULT_BINDS` v2 (`BINDS_V`; older saved binds are replaced once, the TV says the new layout): A interact (Do `take`: pick up /
  gather / drink, never people or fights), Y talk (person within 3.5 m), X attack (Do `hit` text = my angle: zombie / animal in a
  70 deg cone 2.6 m, else within 1.9 m any side; with a bow and nothing in reach it shoots at the target the facing points to),
  ZL aim (held: the stick turns the aim, line + red ring on the locked target, X shoots: Do `shoot` text = angle, first target
  within 0.9 m of the line up to 22 m, 30 / 24 / 18 damage by range), L3 build (page Build: hut + every PLACEABLE, made from the
  bag's materials first: Do `build` "what@angle"). Game menu > How to fight = the weapon guide from `WEAPONS` / recipes.
  Angles sent by the TV use the server's convention (0 = east). Server test "player buttons"; proof `node tools/buttons-proof.mjs`.

## Sounds (imad 2026-11-20: "high quality, open source, no MIDI, with options")
- Files: `docs/audio/` (CC0 Ogg Vorbis, mono one-shots, stereo loops; ids + credits in `manifest.json` / `CREDITS.md`), served by
  Pages and the server's /app/. Engine `packages/client/src/audio.ts` (`Sound`: one Web Audio graph, decoded once after the first button
  press, distance + left / right pan from the camera, 14 voices max, loops as streamed `<audio>`; unknown ids are silent).
  Wiring in app.ts: footsteps by the tile under me (`STEP_OF`), answers from the server (`DID_SOUND`), zombie groans / attack and
  animal calls from where they are (`nextCry`), hurt when my health drops, menu sounds (`Menu.onSound`), ambience by hour / map
  and the nearest campfire (`ambience()`). Settings > Sound (`MyPC.save('sound')`: on, master, effects, ambience, menus).
  Missing recordings: deer, wolf howl, sleep, voices, baby, laugh. Proof `node tools/sound-proof.mjs`.
- Panel chat (imad 2026-11-20): the Talk box keeps what is typed while answers arrive (`draft`; `addChat` redraws only the messages).

## Marry and divorce by words (imad 2026-11-20)
- On the TV, talking to someone (`Planner.chat` with the player's slot): `askedMarry` (en / fr / es / ar) -> the prompt says they are
  asked and whether the world allows it (`Life.canMarry`: single, opposite sex, adults, not family, no rule); the model answers
  `"marry": true|false` (missing = `agrees(reply)`; no AI = a chance from bonds / feelings / empathy) -> `Life.wed` (event `partner`
  with `wed`). `askedDivorce` ("I don't want a divorce" is not one) from her partner = `Life.divorce` (event `divorce`). The player's TV
  gets Notice `did` `married` / `divorced`. The panel's chat is the owner's voice: no marriages there. Test "marry and divorce by words".

## Planned zombie attacks, animal counts per map (imad 2026-11-20, panel Zombies & animals)
- Admin `zombieAttack { add: { days, hour, minute, map, n, where: edge | camp | near | random, near, daily, stays }, remove, now }`:
  `Zombies.plans` (meta `zombie_plans`, saved through `onPlans`), run in `Zombies.update` when due (`attack()`: edge = inside the
  ring on the roads in, camp = 30-45 m round it, near = 25-35 m from a named person; they head straight in). Daily ones move a day on.
- Admin `animals { map, want: number[5] | null, fill }`: `Animals.want` (meta `animal_want`) replaces the built-in mix of that map;
  `spawnSome` moves 1-2 per hour towards it (extras farthest from players go), `fill` = at once. Test in craft.test.ts.

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
- **Merge two names of one person**: admin `mergePlayer { from, into }` (bags added, "into" keeps its character, the TV token row is renamed, TVs reconnect).
- **Brains** (`ai/brains.ts`, meta `brains` { active, list [{ id, name, provider, url, model, key }] }, server DB only): admin `brains`,
  `brainSave` (key undefined = keep, '' = remove; `addKey` appends keys, `removeKey` = index; panel: key chips …last4 + ✕, "Add key"), `brainUse`, `brainDelete` (not the one in use), `brainModels` / `brainTest` (a temporary
  `Ai`, the live one untouched). Clients get keys only as a count + last 4 characters. First start seeds the AI in use (+ "Gemini (keys
  in .env)" when .env has keys). Old `aiSet` updates the brain in use. Provider `openai` = any OpenAI-compatible API (`/v1` base, Bearer key).
- **Brain stats and fallback (imad 2026-11-25)**: `ai/brainstats.ts`. `BrainStats` counts every live AI call per brain (`Ai.tag` = brain id, `Ai.onResult`)
  in hourly buckets (7 days) + lifetime, meta `brain_stats` (flushed every 15 s / at stop; panel Test calls not counted). `Failover`: the brain in use failing
  3 calls in a row = the fallback brain (`Brains.fallbackId`, admin `brainFallback { id }`, '' = none) thinks for 30 min, then back. Use / save of the active
  brain / aiSet end it. `brains` returns `stats` per brain + `failover`. Test brains.test.ts.
- **Keys take turns**: `GEMINI_API_KEYS=k1,k2` (and/or `GEMINI_API_KEY`) in .env, or several comma-separated keys in a brain's key
  field: round robin per call (`Ai.nextKey`). A brain's own key wins over .env. `OPENAI_API_KEY` in .env also works.
- **Rule kinds (imad 2026-11-20: "rules are not respected"; all his rules were "must" rules)**: `classify()` in sim/rules.ts:
  `never` (forbid, as before), `goal` (`marry` / `child` / `plan` = AI steps from refineRule, once a game day) = `Rules.update()` (World.step
  every 20 ticks) starts a task (from 'owner') when the person is free, adult, not desperate, the goal not yet true, 2 game hours between
  tries; `when` ("when you see 'X', greet him with 'Y'") = the engine says Y within 7 m of X, once per 2 game hours, NOT in the prompt.
  Old saved rules get their kind at load (`resolve`). Prompt: never rules + "your owner's orders, your main goals".

## Objectives and families (imad 2026-11-20)
- **Objectives = tasks** (`sim/tasks.ts`): `Tasks.progress(id)` { text, from, k, n, step, pct }. Panel person card / detail "Objectives"
  and TV bubbles show a progress bar (gold = ordered by someone). Rewards on task end: xp ordered 25 + 5 x steps, own 10 + 2 x steps,
  failed max 5; `levelOf(xp) = floor(sqrt(xp / 50))`, each level +0.02 on every trait but metabolism; success = proud / satisfied,
  +10 hp, less lonely, rel +1 with the asker. `Profile.xp`, `goals` (last 10). Events reward / levelup / grown.
- **Families** (`life.ts INDEPENDENT = 14`, `Brain.guardian`): a child under 14 stays with a parent on its map (mother first):
  follows past 7 m, wanders 6 m at most, sleeps next to them, never travels, forages only when very hungry. At 14: event `grown`.

## Players' characters are people (imad 2026-11-20)
- A player's character has a `Profile` with `player: <name>` (`World.playerProfile`, made at join / spawnResidents): sex, `skin` 0-4,
  `chose`, `sexAt` (real ms; after the first pick the sex can change once a real week, `SEX_WEEK_MS`; not while pregnant), `auto`.
  Always 25 (`PLAYER_AGE`), never die (hp floored at 5 by hunger, zombies, animals). Kept in snapshots with the same entity id;
  `NetServer.adopt` re-links them by name at start (old characters without a profile are still made again).
- Frames: players' characters carry their look in bits 24+ (`e.sub` = 1 + skin, + 8 woman); the TV draws that skin tone, a woman's
  trousers match her top.
- Partner / children: TV person page "Ask to be my partner" (Do `court` text = entity id, within 10 m -> `Life.court`) and "Try for a
  child" (Do `child` -> `Life.tryChild`); conception / birth in `Life.hourly` include players. A mother waits a year between babies.
- **Autopilot** (`auto`, Do `auto` 1/0): leaving with it on = `World.toAgent` (Kind.Agent: the brain, planner and rules drive it); coming
  back = `toPlayer`. The bag stays the player's (`survival.inv` by `charName`). 5 rules (Do `ruleAdd` text / `ruleDel` index, the same
  `compileRule` + `refineRule` as the owner's).
- Do `mine` -> the TV "Me" page (level, objective, partner, children, traits, look, autopilot, rules); first entry opens "How I look".
  Do `hut` = a hut right ahead (`Survival.playerHut`, 12 wood + 4 stone). Strings `i18n5.ts`. Proof: `node tools/me-proof.mjs`.

## Leaders and camp defences (imad 2026-11-20: "no doors, walls or defences", "leaders", "stats not well used")
- `Survival.pickLeader(m)` (hourly in `ownPlans`): the adult (16+, not a player) with the best courage x1.2 + intelligence + empathy x0.8
  + strength x0.4 + level x0.15; the leader stays unless beaten by 0.25 (event `leader`). Planner prompts and the panel (Maps table,
  Leader / Wall columns) show it. The leader hands out the work by traits (`best(score)`): strength builds / repairs, speed + courage
  hunt, empathy feeds / treats / stores food, intelligence farms / puts doors; tasks say "from <leader>". The leader speaks
  (`w.speak`) at most every 6 game hours about the day's work.
- Defences: doors in hut doorways (`doorSite`; people stand in doorways, so a door goes in anyway), a wall ring 9 tiles round the camp
  with 4 ways in (`defenceSite` / `campDefence` = [up, left]), spikes at 10 after the wall. Under threat (zombies per night, a planned
  attack, zombies on the map) a crew of up to 3; else now and then 1. `reserved()` keeps a crew on different tiles.
- Test craft.test "a leader hands out the work...".

## Watch = autopilot, link a player to an account (imad 2026-11-21)
- Client sends `Join { watch: true }` when it connects in watch mode / switches to it: the character becomes an agent (`World.toAgent`, the
  brain, planner and his 5 rules drive it); `Join` without it (play) = `toPlayer`. `leave()` ends the watch autopilot (sleeps) unless the
  player's own `auto` is on.
- Admin `linkPlayer { uid, name }` (name '' detaches; one account per name; the name must be a real character): panel Users & roles has a
  Player picker per account (`accounts` returns `free` = characters with no account). A linked character is staff (owner / admin tools such
  as Go to someone) via `Accounts.isStaff(name)`. Tests: auth.test (link), server.test "players" (watch).
- **Players' characters in the panel (imad 2026-11-21)**: the People screen's player cards open the same person page (`#/person/<id>`):
  `agent`, `agentSet` (stats / needs / traits), `agentMove`, `chat` (talk), `rules` accept a character of kind Player or Agent
  (`agentInfo` carries `player`, `auto`, `manual`, `online`). A character played by hand (Kind.Player: online or asleep away) answers
  chat but is not driven: `order` / `planNow` say so; chat orders and plans apply only on autopilot (watch mode or its own `auto`).

## Zombie numbers, fighting back, follow me, family in prompts, marry / divorce on order (imad 2026-11-21)
- `Zombies.cfg` { hp 120, speed 1.15, bite 8, sight 16, smell 120 } (`ZOMBIE_DEFAULTS`, meta `zombie_cfg`), panel Zombies & animals > Zombie strength
  (admin `zombies { cfg, applyNow }`; applyNow also sets the zombies already out). Unarmed people fight back: `Brain.danger` nerve =
  courage + strength x 0.4 + 0.25 armed + 0.15 per friend already fighting it (> 0.62 fights; before, only armed or strong AND brave did, and
  nobody was); bare hands hit 12.
- Watch mode: menu row "Follow my character" (`followMe`, also done on switching to watch).
- `Planner.describe` now has `selfText` (stats 0-10, level, weapon, defence, current work) and `familyText` (married to / single, children,
  parents, siblings, expecting). Keep both in every prompt about a person.
- Task skills `marry { who }` / `divorce { who }` (`sim/tasks.ts`): walk to them, say it, `Tasks.onAsk` -> `Planner.chat(them, askerName, 'Will you
  marry me?' / 'I want a divorce.', askerSlot)`: THEIR answer decides (`Life.wed` / `divorce` keep the rules); the step fails with their reply
  when they say no. Chat plans use them ("go ask Lina to marry you"; `askedToWedSomeone` is the net for small models). `chat()` accepts any
  profiled speaker (an agent sent to ask is a speaker too). Manual: person page rows Propose marriage / Ask for a divorce (Do `marry` / `divorce`,
  text = entity id, within 10 m). Test planner.test "go ask her to marry you".
- **Marry / divorce really happen (imad 2026-11-21: "he said he did but I still see him married")**: a character played by hand (Kind.Player) has no
  tasks, so chat only produced words. Now `Planner.wedNow` does it at once (divorce = `Life.divorce`; marry = the other person's own answer via
  chat) for such characters, from chat plans / the keyword net AND from the panel: Talk & orders > Give an order > "Ask … to marry them" / "Divorce …"
  (admin `order` kind `marry` / `divorce`, `Planner.orderWed`: a task for a person on their feet, immediate for a player played by hand;
  an error says why not, e.g. "Lina said no"). Test planner.test "played by hand is married / divorced at once".

## Conversations, night watch, PvP, clans (imad 2026-11-21, app 0.10.0)
- Panel person page tab **Conversations** (`Planner.convo`, `ai/convo.ts`, memory only, 600 lines): lines said aloud to someone near, chats with players / the owner, and a built-in
  small-talk exchange when two people stop to talk (no AI call). The page redraw (`redraw()` in `panel/src/people.ts`) keeps page scroll, tab bar scroll and chat scroll.
- **Doors only in doorways**: `buildThing('door')` uses a hut doorway or a gate of the finished camp wall (`gateSite`), else fails ("no doorway or gate"), never a random spot.
  **Night watch** (`Survival.watch`, hourly, 20:00-05:00, camp + 3 people): 1 guard (2 with zombies about and 5+ people) at a post on the camp ring, 3 game hours, chosen by courage x1.2 +
  strength x0.6 + weapon; timid (courage <= 0.4) never. **Retreat indoors**: with a door standing (`doorsUp`), fleeing people run to the nearest roof before the fire.
- **PvP** (`sim/clans.ts`): Do `pvp` 1/0 = switch (off by default, meta `pvp_on`), Do `hitperson` = hit a person (the normal Attack never does). Both players need it on. `pvpDamage`: weapon on
  unarmed up to 30, weapon on armed ~10, bare hands on armour 3; nobody dies of it (hp >= 3, players >= 5). Client: action `attackPerson` (unbound by default; Actions menu, quick wheel), PvP row in How to fight.
- **Clans** (`Clans`, saved in snapshots): the map leader founds one, others join by feelings (`mind.rel`) and family; loyalty moves hourly; 6+ adults: a strong rival of the leader may split
  off with friends and a home of their own; rival clans get tense (`tension` 0-10). Quarrels (`quarrel`, 8 people a second): tension >= 4, dislike <= -2 or "on edge" (hungry, grumpy...) start a duel
  (`Brain.duelMove` / `duelEnd`): small hits, loser yields. Panel People page "Clans" card; clan line in every prompt. Territory = a home point only (one camp per map for now).

## Panel AI agent and server controls (imad 2026-11-25)
- **AI agent** (`ops/agent.ts`, panel page "AI agent" = `panel/src/coder.ts`, admin `coder*` commands, OWNER ONLY = admin token or a Firebase
  owner; `AdminHandler` gets `owner`): the owner asks in words; the model answers JSON and may LOOK freely (`read` files with line ranges,
  `grep`, read-only `sql` on a readOnly connection, `peek` = JS in node:vm on a JSON copy of the world, 3 s limit), then PROPOSES `run` (async
  JS in the live server: `world, db, app, find, person, admin, print, Kind`) or `edit` (find-once / create in packages/*/src or scenarios only).
  Nothing changes until Run / Apply. Run: snapshot + `VACUUM INTO` backup first, snapshot after; Undo = restore that backup at a restart.
  Apply: originals kept in data/agent/edit-<id>/, rebuild (`Control.build`), a failed build puts them back; Undo = put back + rebuild.
  Audit table `agent_audit`; chat in meta `agent_chat`; its brain = meta `agent_brain` (default: first gemini / openai brain, else the one in
  use; a separate `Ai`, not the people's budget). Secrets (brain keys, .env keys, tokens) are replaced by *** in everything shown / sent.
  **Traced and revertable (imad 2026-11-25)**: every applied edit = a local git commit of only those files ("World agent #id: ask", column `git`);
  Revert = `git revert` of it (column `revert_git`; a clash with a later change aborts and says so) + rebuild + restart. Runs: Revert = backup restore.
  No git = the kept originals. Agent commits stay local: bring them into the repo by hand.
- **Server controls** (`ops/control.ts`, Server page `panel/src/serverctl.ts`): `serverInfo` (git commit / local changes, pid, db size, job),
  `serverLog`, `serverRestart` (writes data/watchdog.pause + restart.flag, clean stop, main.ts spawns the same command detached; the new
  process removes both), `serverBuild` / `serverUpdate` (git checkout -- docs, git pull --rebase --autostash so agent commits ride on top, abort on conflict, npm install if package files changed, build; then restart),
  `backups` / `backupMake` / `backupRestore` (data/restore.json, applied at start before the db opens; the old db kept as before-restore) /
  `backupDelete`. Last 15 backups kept. Test `agent.test.ts`; proof `ADMIN_TOKEN=... node tools/agent-proof.mjs <server> <outdir>` (fake model).

## Percent editor, no hard admin limits (imad 2026-11-25)
- Panel person Edit tab shows every level as 0-100 %: Food / Water / Rest / Company = 100 - lack, Health = % of `hpMax` (sent in `agent`),
  traits x100; Food carried (count) and Lifespan (years) keep their units (`editFields` / `fromPct` in people.ts).
- Admin values outside the usual range are asked, never refused: `num(v, lo, hi, name, hard?, pct?)` in `adminCmd` throws `CONFIRM`
  ('confirm: ...', protocol) unless `c.force`; panel `api.ts cmd()` shows confirm() and resends with `force: true`. `hard` = what the engine
  can hold (default >= 0); ids / positions / hours / indexes / needs use `fixed()` (no override). Planner.set and loop.setSpeed take force too.
## Local AI research (imad 2026-11-25: "evolve agents into autonomous artificial life", push every update to main)
- Docs in `research/` (ARCHITECTURE, EXPERIMENTS, BACKLOG, REFERENCES; NOT in docs/, which is the Pages site).
- `World.ai` flags { goap, learn, siting } (default all on; `opt.ai` to switch): `sim/colony.ts` = camp drives -> goals ->
  allocation (value x trait fit x success chance - hours x 0.04, max 24 plans per pass) -> GOAP plan (`sim/goap.ts`, actions
  built from the recipe table) -> task steps tagged `key`; `Tasks` reports step outcomes -> `Colony.record` (Profile.mind.know +
  per-map culture, saved in survival snapshot `colony`); failed planned task re-planned once, then goal back-off 2^n h.
  Flags off = the old `ownPlans` list. Siting: `Survival.campSite`, `hutSite` (constraints + flood-fill access), wall circle
  `perimeter()` sized to the village and fixed at the first piece (`walls`, old worlds with a 9-ring keep it), `hutDir`,
  `taken()` reservations. `sim/structures.ts` audits huts. Experiments: `npm run experiment -- --days 3 --arms old,new`.
