# Notes for Claude (project memory)

Autonomous agent world simulator for imad. Full spec: the first message of the project thread "Build agent world
simulator" (milestones 1-8). Milestones 1-3, 5, 6, 7 done 2026-11-20 (4 first version); 8 parts 1-3 (tasks, survival, zombies) + strict rules + animals / crafting, camera views, quick wheel done, app 0.9.0; horses app 0.12.0; next weather, polish. Population: births only, no newcomers (imad 2026-11-20).

## Owner rules
- Push straight to `main` (no branches / PRs). **Panel screenshots: dark mode only** (imad 2026-11-26; proof scripts default to dark). Never say something works without a real run and proof (screenshot,
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
- **The link finds itself (imad 2026-11-27: ngrok's free data ran out, cloudflare-quick's link changes at every start; "we use Firebase, this
  must be automatic")**: `persist/link.ts` `LinkPublisher` writes every new tunnel link (TunnelManager.onUrl) to Firestore `server/current`
  { url, provider, at, uid } (public read; rules `match /server/{doc}`: only the account that created it updates it, staff may delete it).
  No service account: the server makes its own Firebase account once (email / password, else anonymous) in `data/firebase-link.json`.
  One write per change, retries 1 / 5 / 15 / 30 min. TV (`client/src/published.ts`, app.ts `findServer`) and panel (api.ts `findServer`)
  read it when they have no address or theirs does not answer (at most every 20 s), then save it. Health checks of a new address
  (`askHealth`) ask 1.1.1.1 / 8.8.8.8 (Windows caches a not-yet-existing trycloudflare name as missing); a switch to cloudflare-quick
  waits 12 s first. Proof `ADMIN_TOKEN=... node tools/link-proof.mjs <server> <sdk.js> <outdir>`.
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
  Missing recordings: sleep, voices, baby, laugh. Proof `node tools/sound-proof.mjs`.
- **Ambience overhaul (imad 2026-11-27: "fire badly repeating, rain / wind / night must be continuous", horses, animals)**: beds are 45-80 s
  recordings (CC0 felix.blume / richwise, Oculus Audio Pack CC BY 4.0, 0 A.D. CC BY-SA 3.0: credits in docs/audio/CREDITS.md + manifest),
  made by `tools/audio/fetch.sh` + `python3 -I tools/audio/build.py` (sources in .cache/audio). `Sound` loops = TWO streamed players per loop,
  the next starts from a random place 3 s before the end, equal-power crossfade (`<audio loop>` gapped at the seam); the server's static files
  now answer byte ranges (seeking). app.ts `ambience()` blends day / night over dawn and dusk, woods vs town, rain hushes birds; `sprinkle()`
  layers fire pops from the fire, owls / far howls at night (`playFar`), gusts, birds; `World3D.onFlash` -> thunder. `hooves()`: walk 4 beats,
  trot 2, gallop strides by speed for every horse drawn, my own while riding (no footsteps on horseback). Wolf howl / deer synthesised.
  Proof `ADMIN_TOKEN=... node tools/ambience-proof.mjs <server> <sdk.js> <outdir>` (`?dev` `__dev.sndEnd / sndPlayers / amb / flash`).
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
- Server reads for it: `overview`, `history { range: 1d|1w|1m|6m|1y|all }` (`ops/history.ts`, SQLite table `history`: minutes 2 days, hours forever,
  at most 360 points a range; no range = the old last-24-h array; panel `charts.ts rangeSeg` = one All / 1y / 6m / 1m / 1w / 1d choice for every chart, `ws_chartRange`), `mapTiles`, `live`, `people`, `replays`,
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
- **Rules both ways (imad 2026-11-25: "you never talk to Miceal" / "you must hunt every day", "only the first works")**: `isMust` / `stepsOfWords`
  (`DO` table, 4 languages: hunt, tame, wood, ore, stone, scrap, loot, farm, store, food, repair, fire, build / craft X, heal, drink, sleep) ->
  goal 'plan' `by: 'words'` (AI not asked) with `every` (every hour / N hours / day / N days / week, twice a day; no word = daily, build /
  craft / tame = once) and `hours` (morning 6-11, afternoon, evening 17-21, night 20-5). "never forget to" = must; work words beat family
  words. The AI never turns a must into a never (forbid ignored). `Rules.due` (by game day for >= 1 day), counts in `Profile.mind.ruled[text]`
  { ok, fail, last, why } via `Task.rule` -> `Rules.ended`; a rule task pushes aside own / camp / quest tasks (`yields`), never owner / player
  orders. Names: Damerau slips (1, 2 for 6+ letters); an unknown name blocks nothing (never "everyone"), looked up again now and then.
  "never hunt" / "never tame" forbid hunt / tame. Admin `rules` returns `how` (`Rules.how`) + `kept` per rule; panel `ruleRow` (util.ts)
  on Strict rules and the person Rules tab (everyone's rules listed too). Test rules.test.ts; E8 `experiment-rules.js`; proof
  `ADMIN_TOKEN=... node tools/rules-proof.mjs <server> <outdir> [wait s]`.

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

## Restart, rebuild, deploy from the panel (imad 2026-11-27: "rebuild and restart takes the server down", "I need a deploy button")
- The server no longer starts its own replacement as a child (that child could die with it on Windows, or fail unseen while the watchdog was
  paused 15 min). `run.ts onRestartRequest(why, before)` first starts `tools/relaunch.mjs` on its own (`ops/relaunch.ts`: Windows = WMI
  `Win32_Process.Create` via PowerShell so it is nobody's child, else / fallback a detached child), then a clean stop (30 s cap) and exit.
  The helper waits for the old pid (60 s, then kills it), starts the server the watchdog's way (`packages/server/dist/main.js` relative,
  data/stdout.log / stderr.log), waits for /health (300 s), and on a deploy whose new code dies goes back with `git reset --keep <before>`
  and starts that (fresh.ts recompiles). One retry, then gives up and removes watchdog.pause at once. Log data/relaunch.log; outcome in
  data/deploy.json { job, restart { state asked | stopping | starting | up | rolledBack | failed, log, from, to } } (`Control.lastDeploy`,
  serverInfo `lastDeploy`); a rollback / failure also goes to the error log once (meta `deploy_reported`).
- Panel Server page: Restart, Rebuild and restart (= compile the code already on the PC: tsc + build-client; fetches nothing; the server
  compiles itself at start anyway), **Deploy** (admin `serverUpdate` / `serverDeploy`: git pull --rebase --autostash, npm install if
  package files changed, build, restart; a failed step keeps the old server running with the log shown). The page follows the restart
  (other pid = back) and shows the job + restart logs. watchdog.ps1 / restart.ps1 match the server's command line with either slash.
  Test relaunch.test.ts; proof `ADMIN_TOKEN=... node tools/deploy-proof.mjs <server> <outdir> [click]`.

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

## Analysis page (imad 2026-11-25)
- Panel page "Analysis" (`panel/src/analysis.ts`, staff): every stat (`ops/analysis.ts` `Analysis.stats()`: population, why each woman 18+ has no
  baby now (same checks as `Life.hourly`), single men / women + possible pairs, objectives done / failed + top failure reasons (last 500 `task`
  events), per map animals by kind / trees / rocks / rubble / farms / huts / doors / beds / leader, what people do, deaths, clans, rules, AI, event counts).
- Ask the AI: admin `analysisAsk { question, include: LOG_TYPES ids, brain }` ('' = the live `Ai` in use with its fallback, else a temporary `Ai`
  of that saved brain, counted in brain stats). Log types: people, life, work, danger, social, convo, travel, admin, ai, server (server = warn/error from
  `control.logTail`; switch to the error-log store when it lands). Prompt = stats JSON + ticked logs within 60k chars (newest kept), redacted;
  `analysisPreview` shows it. Answers in meta `analysis_log` (last 30), `analysisForget`. Test analysis.test.ts; proof `node tools/analysis-proof.mjs <outdir>`.
## Error log, server build check (imad 2026-11-25: "I need an error log", "unknown command a lot")
- "unknown command" / "bad maxPopulation" = the panel (Pages, always the newest) talks to a server process on the PC that runs OLDER code
  (not pulled / rebuilt / restarted). Such a server can't update itself if it predates the Server controls: deploy on the PC by hand.
- `App.build` { commit at start, subject, started, cmds = the `case '...'` labels of `runAdmin` + `playerCmd` } goes in the admin Welcome
  (`build`, + `errors24h`). Panel `api.ts`: a command the server doesn't list = refused at once with a clear text + one red banner
  (`#outdated`), no request; older servers' "unknown command" answer gets the same text. Server's own answer names the command and build.
- `ops/errors.ts` `ErrorLog`: SQLite table `errors` (last 3000; same source + msg within 10 min = n + 1). Fed by `adminCmd` failures (not
  'confirm:'; bad values = warn, others = error with stack), every `log.warn` / `log.error` (`Logger.onProblem`, source guessed by
  `sourceOf`, `NOT_PROBLEMS` skipped), crashes (main.ts source 'crash'). Admin `errors { limit, source, level, q, since }`, `errorsClear { id? }`;
  Notice `error` to admins. Panel page Errors (`panel/src/errors.ts`, nav badge). Test errors.test.ts.
  Admin token = no account: `me` answers `{ token: true }` (panel Me page explains), joinWorld / approveMine / revokeMine say so.
- **Pull + start is enough (imad 2026-11-25)**: `npm start` runs packages/server/dist (not in git). `main.ts` now only calls `fresh.ts ensureFresh()`
  (package files newer than node_modules/.package-lock.json = npm install via npm-cli.js next to node; src newer than dist/.built = tsc -b),
  then imports `run.ts` (the old main). `npm run build` writes dist/.built. `WORLDSIM_NO_AUTOBUILD=1` skips it.
- `tools/restart.ps1 [-Pull]` (imad): pause the watchdog, clean stop if running, start hidden (PowerShell can close), wait for /health.
  Node = `D:\node\node.exe` (imad's path; watchdog.ps1 prefers it too), else .node\, else PATH.
## Little ones and family roles (imad 2026-11-25, app 0.10.1, `sim/family.ts` = `World.family`)
- Under 3 (`TODDLER`) = dependent (`Family.dependent`, flag `EFlag.Small` 64, drawn x0.42): `Brain.little` replaces the brain (sleep, cry, toddle
  after the carer; never drink / forage / talk / travel; orders, jobs, hunts and planner plans refuse them). Carer (`Family.carer`, every 20 ticks):
  mother, father (AI first; a player-parent online does it by hand), grown family, else the kindest adult within 60 m; a player who lets a need pass
  75 gets an AI helper. Babies (< 1) are carried (`carried`, `EFlag.Carried` 128, body off, glued in `Family.carry()` after physics); toddlers are
  picked up when the carer walks off or zombies are near. `Brain.tendKids` (after danger): fetch the child, feed it (carried food / store via
  `grabFromStash`, found food is kept for it), take it to water (`Family.drank`). Parents fight for a child under 14 a zombie / beast goes for
  (+0.45 nerve, `threatToMine`); one holding a baby runs instead.
- Speech: `kidTalk` (cries / babble < 1, one word < 2, two-three words < 4, cut short < 7) in `Planner.say` / chat (no AI call under 2); `kidVoice` in prompts.
- Family = blood + roles chosen between players (`Profile.kin` '#id' -> what they are to me, both sides). `relation` / `close` (parents, children,
  siblings incl. half, grandparents, aunts / uncles: never court, marry or have a child; replaces the old checks in life / tasks) / `related` (clans' kin).
  Babies know parents (rel +4) and siblings (+2) at birth; under 16 near family grow closer hourly. Player characters stay 25 (imad skipped the
  "make a player-kid young" question 2026-11-25: do not change ages).
- TV: Me > My family (needs of my children, Feed / Give water / Pick up / Put to bed = Do `care` "what:id" within 3 m, requests to accept, ✕ to drop);
  person page of a player = Ask to be my child / sibling / parent (Do `kinAsk` "id:role" -> their TV note, Do `kinAnswer` "id:1|0", `kinDrop`). Strings `i18n6.ts`.
  Panel person Family tab: siblings, stage, carer, their children's needs, chosen family + set (admin `kin { a, b, role }`); Edit tab has Age (not players).
  Test family.test.ts; proof `ADMIN_TOKEN=... node tools/family-proof.mjs <server> <sdk.js> <outdir>`.

## Homes, aimed building, regrowing resources (imad 2026-11-25)
- **Homes** (`sim/homes.ts`, `Survival.homes`, saved in the survival snapshot `homes`): every hut (known by its `out` tile) may have an owner; the
  doorway's door lets through only the owner + partner, parents / children, siblings, step-children (`Homes.family`). Others are put back at the
  doorway (`World.step` via `homes.shut(i, m, fromTile, toTile)`, and `trustMove` for players; event / Notice `blocked { why: 'door' }`). No owner,
  camp-wall gates, ruin doors = open. Builder without a home owns a new hut; hourly `homes.hourly()`: dead owner -> partner / grown child; free huts
  -> households without one (couples with kids first). `Profile.home` + a memory note; prompt line `homes.describe` in `selfText`; people sleep at
  home and flee to a roof whose door opens for them.
  **Rest at home (imad 2026-11-25)**: `Brain.homeSpot` (bed, else an inside tile); sleep goes home from anywhere on the map unless exhausted
  (tired >= 92 and > 40 m), rest walks home (goal -5) within 90 m or at night; 2 tries then sleep where they are. 4-day run: ~97 % of sleep, ~94 % of rest at home.
  Clan orders replace a member's own task (not owner / player / rule ones). Colony / ownPlans build huts until every household has one (`homes.needed`).
- **Huts come with their own door** (agents and players), cost `HUT_NEED` = 20 wood + 10 stone + 5 leather (protocol craft.ts; imad 2026-11-25:
  "more expensive so people use the ones they built"). Pulling one down gives half back. Colony builds a hut only for a household with no home
  that no free hut can take (`homes.needed`, the old "one per 2 people" is gone); goal `long` (unique-key success chance, hours x 0.008);
  GOAP depth 64 / 5000 nodes. A homeless AI told to build moves into the nearest free hut instead (`Homes.moveIn`). Every prompt lists the
  map's huts and whose they are (`Homes.mapText`). `Homes.where(m?)` = admin `huts { map? }`, `mapTiles.huts`, player Do `huts` (code huts, list).
  Hunt steps with no game around search for up to 5 game hours (hunt steps may take 6 h). Leather is the bottleneck in town (4 animals max).
- **Own huts, 2 a map, no horses indoors (imad 2026-11-26: "built a hut, slept, got out and it blocked me")**: the cause = a player's second hut
  stayed ownerless (builder already had a home) and `homes.hourly` handed it to another family; also the closed-door block was reported as
  "not your home". Now a PLAYER always owns what they builds (AI builders only when homeless); `HUTS_PER_MAP` = 2 per builder per map
  (`Homes.builtBy`, code `hutLimit` / AI "I already built 2 huts here"; GOAP drops build:hut at the limit). Blocked notices say why: `door`
  (not your home), `closed` (press A), `horse` (riding: players stopped at a hut's edge, AI riders get off). Animals (horses too) never step
  into a hut's tiles. Strings dDoorClosed / dHorseIn / dHutLimit (i18nBuild). Note: `Survival.init()` runs on the first step and recounts huts
  from walls: tests must step once before building. Test homes.test "a player owns every hut they build".
- **Aimed building** (TV): picking a build row / Put down / Me > hut opens a see-through model (`World3D.ghost`, green / red) moved tile by tile
  with stick / arrows (camera-relative in third / first), X / Y / shoulders / Build / CH+- turn a hut's door, A / OK build, B / Back cancel.
  Do `build` "what#tx,ty,dir" -> `Survival.placeAt` / `canPlace` (reach 8 m, codes tooFar / someone / doorBlocked / noRoom); old "what@angle"
  still works. Strings `i18nBuild.ts` (TB). Proof `ADMIN_TOKEN=... node tools/build-proof.mjs <server> <sdk.js> <outdir>` (`?dev`
  `__dev.place / unplace / tile`). Admin `agentSet { set: { inv: { wood: 14 } } }` sets a bag.
- **Pulling down (imad 2026-11-25: "only owned buildings or when the owner is dead")**: `Survival.owners` (`${map}:${tile}` -> builder id, saved `own`)
  for pieces (putDown, fires, fields); huts = `Homes` owner else `by`. `mayDestroy` = nothing / unknown (no owner recorded: old buildings stay) / notYours
  (owner alive and not me). A hut comes down whole (`destroyCells`, half its materials back), a piece goes back into the bag. TV: Build > Pull down
  (ghost green / red from Do `destroy` "tx,ty,?", confirm = "tx,ty"); AI: task skill `destroy { what }` (job `wreck`, `askedWork` words in 4 languages).
  Admin `resetBuildings { map? }` (panel Server > Start over): backup "before-reset", every built tile back to its ground, huts / homes / camps /
  wall circle / crate / fires / fields forgotten. Test homes.test; proof `ADMIN_TOKEN=... node tools/destroy-proof.mjs <server> <sdk.js> <outdir>`.
- **Resources** (`Survival.regrow`, hourly): steady level per map counted once (`resTarget`, saved `res`): trees never below the generated count,
  regrow on stumps + seed next to trees (~3 % of the gap / h); rocks capped (woods 60 / town 12), one surfaces ~every 7 h out of sight (25 m).
  Rocks always refill to the cap (one an hour at most, chance = max(0.15, lack)); rubble regrows on its base tiles (~2 % of the lack / h).
  Never in the camp wall circle, homes, door aprons, roads, near portals. Rocks are hard: 15 damage a blow (6 blows), stone 60 %, ore 10 % a blow;
  agents' `mine` job 240 s, players 1.6 s between blows. New worlds: 18 rock clusters in the woods, 5 in town. Test homes.test.ts.

## Doors, the interact hint, prop sizes (imad 2026-11-25)
- **Doors open and close**: tile `door` = closed, `dooropen` (24) = open (both non-solid in the scenario so paths work). Closed: players can't step in
  from outside (`World.trustMove` + physics read-back; TV `blocked()`), zombies / animals neither; open: everyone, threats too. Owned huts still
  shut strangers out either way (`homes.shut`). AI people pass both and close an open door behind them (nobody else on it). Players: A (Do `take`
  "door:tx,ty", or Do `door`) -> `Survival.toggleDoor` (2.2 m; codes doorOpened / doorClosed / doorLocked / doorSomeone; event `door`).
- **Hut doors drawn wrong** = the client always drew the frame along X, so east / west doors stood across the doorway. `chunkmesh` now turns doors
  by their wall neighbours (and draws the open plank swung).
- **Interact hint** (`#iahint`, `updateInteract` in app.ts every 200 ms): "A Open the door / Close / Pick up / Drink / Eat / Chop / Mine / Search /
  Get on your horse / Tame / Get off", same order as the server's take. Hidden while a menu / placing / aim / wheel is open. Strings in i18nBuild.ts.
- **Sizes**: wrecked cars = one 3 m car per 3 barrier tiles (stray tiles beside a row = wreckage), beds 0.98 x 1.9 m towards the open side.
- `mapTiles` names / colours / solid are indexed by tile id (they were by array position, ids start at 1: off by one). Admin `agentMove` of a
  player's character sends its TV Notice `did` tp so the camera follows. Proof `ADMIN_TOKEN=... [OLD=old game.js] node tools/doors-proof.mjs <server> <sdk.js> <outdir>`.

## Local AI: instincts and memory (imad 2026-11-25)
- **Instinct flag (imad 2026-11-25: "people don't defend themselves", "say they'll do it but stand", "objectives fail", memory
  100 / 10, places)**: `Brain.fightOrFlight` (hp / dps odds with friends within 14 m, courage, kin x1.6), alarm shouts (30 m,
  wake within 12 m, `alarm` event), flee never stops in a hut with the threat inside; hunters stalk (half sight), game up to
  220 m, 3 escapes; dusk drink / eat, home at night when zombies walk, weapon on quiet days, `family` goal (court the closest
  single adult, never players). Craft / build steps from chats are GOAP-planned (`Colony.planTo`, map-wide tile index
  `Survival.findTile`) or fail with the real reason. `sim/memory.ts` (`w.memory`, `Profile.mind.mem`: short 10, long 100,
  places 4 per kind; `story(i)` in every prompt). Experiments: `experiment-requests.js` (E6), `experiment-defence.js` (E7);
  the harnesses call `w.land.setup()` like the server. The long-term-plan strictness question: imad said skip for now.
- **Done needs proof (imad 2026-11-25: "hunt 3 animals marked done after a minute, many examples")**: `Tasks` keeps a ledger of what each
  person really did from world events (`didCount(id, key)`: hunt, build:<what>, craft:<what>, pickup, store, take, loot, repair, heal, tend,
  drink, eat, sleep, give, destroy); `proof(step)` = the key + count a step needs, snapshotted at step start (`p0`); a step returning true
  without it fails "I did not manage to ...". Hunts count their own kills since the step began (not "the last kill"). `countIn(text)`
  (digits + number words en/fr/es/ar, 2+) puts the said count on the repeating step (askedWork and models' one-step plans); thingOf "wall" =
  palisade (was campfire). Test tasks.proof.test.ts.

## Items, gear, moves (imad 2026-11-25, app 0.11.1)
- **Assets**: CC0 models only (Quaternius, KayKit, Kenney; `docs/models/CREDITS.md`). `tools/assets/fetch.sh` (KayKit packs at pinned commits into
  .cache/) + `node tools/assets/build-items.mjs` (headless Chromium: FBX / glTF -> flat-shaded face-colour triangles; `tools/assets/items.mjs` = which
  model, turn, size, icon angle) -> `docs/models/items.json` (models used in game: sword axe spear bow hammer sledge helmet pads) + `docs/icons/items.png/json`
  (27 icons, one atlas). Client `gfx/items.ts` loads both in the background (`iconStyle(id, px)`, `itemGeo`). Kenney FBX files fail in FBXLoader: use their glb.
- **Gear** (`protocol/gear.ts`, server `sim/gear.ts`, `World.gear`, `Profile.gear` { weapon / ranged / head / body = chosen ('' best, '-' none), up { item: [lv, q] } }):
  Survival.weapon / defence delegate to it (equipped, x `gearMul(lv, q)` = quality mul [1, 1.12, 1.25, 1.42, 1.65] x (1 + 0.05 lv)); bow shots x `bowMul`.
  Levels +0..+10 (`levelCost`), quality normal / fine / superior / epic / elite (`qualityCost`: claws, ore / leather, scrap, bricks; needs +2 / +4 / +6 / +8).
  Do `equip` "slot:item", Do `upgrade` "item:lv" | "item:q" (codes upgraded / upNeed / needLevel / maxLevel / maxQuality / notCarried); Notice `me` carries
  `gear` (+ `use` = what each slot really uses) and is sent at once after equip / upgrade / craft. Agents level what they use up to +3 hourly with spare materials.
  Admin `agentSet` set `{ 'bag.ore': 5 }` edits a bag.
- **Frames** carry `gx` (one Int32 per record, `packGear`: held, helmet, body, qualities, anim, anim count, bow on back). Anim from `Gear.play(i, anim)` (players:
  hit / shoot / build / place / talk / gather in app.ts onDo) or from the act (Fight attack, Build build, Talk talk, Gather chop near a tree else mine).
  Client `People.add(..., gear, at)`: procedural moves (attack, chop with an axe, mine with a heavy hammer, build with a hammer, talk + nod, shoot, use),
  weapon in the right hand / bow in the left, bow on the back, helmet, shoulder pads + steel tunic for armour, leather tunic for clothes, quality tints +
  additive glow from superior up. Proof without a server: `node tools/people-proof/run.mjs <outdir>`.
- **Screens** (`invui.ts`, Menu pages with a `grid` = own cursor, `big`): "Bag & crafting" (category tabs, 3x3 grid -> result, recipe book fills the grid,
  9x4 bag; A on a material = into the grid, on gear = equip, on a placeable = put down) and "Gear" (3D preview = a second small WebGLRenderer only while open,
  4 slots, choices Best / Nothing / items, Level up / Raise quality with costs). Strings `i18ng.ts` (TG). Proof: `ADMIN_TOKEN=... node tools/gear-proof.mjs <server> <sdk.js> <outdir>`.
- **Bow aiming, animal deaths (imad 2026-11-25, app 0.12.1)**: holding Aim sends Do `aim` 1 (`Gear.aiming`, frame gx bit 23 = bow drawn and held,
  anim shoot); letting go of Aim SHOOTS (Do `shoot` at the locked target / aim angle, then `aim` 0); Attack while aiming does nothing. My own character
  shows the drawn bow at once (`aimGear`). `#aimhud` = arrows icon + count while aiming. Player arrows fly at `ARROW_SPEED` 100 m/s (`World.shoot(.., speed)`),
  drawn as a streak along their flight. Killed animals: `World.fell` (id -> tick, 5 s) -> `Frame.dead` ids; the TV keeps them as `corpses` and
  `Animals3D.add(.., dead = seconds)` staggers, rolls on the side, kicks, sinks (`DEATH_SECS` 4). Proof `ADMIN_TOKEN=... node tools/bow-proof.mjs <server> <sdk.js> <outdir>`.
- **Bag screen, bigger crafting, text size, herbs and first-aid kits (imad 2026-11-25, app 0.12.4)**: game menu > Bag = `BagScreen` (invui.ts: 6 x 4+ big slots
  with names, the item's picture / what it does / what A does; A = use a kit, equip, put down, or open crafting for a material). Bag & crafting: slots 5.4vw,
  crafting + recipes on the left, the 6 x 6 bag on the right. Settings > Text and menu size (85-175 %, `MyPC.save('uiSize')`): CSS vars `--ui` (bars,
  card, menus: `transform: scale`, never `zoom`, so Chromium 108 places them the same) and `--uib` (big screens + wheel, capped at 1.1 so they fit).
  Herbs: tile `herbs` (id 25, chunkmesh `Shape.Herbs` leafy clump + flowers) on grass next to trees, kept at 45 (woods) / 14 (town) by
  `Survival.regrowHerbs` (hourly, seeded at init when a map has none); A next to one = 1-2 `herb` (code `herbs`), task skill gather what herb,
  job 'dig'. Category `healing`: `medkit` = 3 herb + 1 leather; `MEDKIT_HEAL` 45. Do `medkit` (bag / wheel item heal) -> `Survival.useMedkit`
  (healed / noMedkit / fullHp); AI people below 55 % use theirs (`autoHeal`, every 20 ticks); hourly own plan: a kind person picks herbs and makes
  a kit when nobody free has one. Icons herb / medkit baked from KayKit (waterplant, box_small + bottle). Proof `ADMIN_TOKEN=... node tools/bag-proof.mjs <server> <sdk.js> <outdir>`.
- Proof scripts: admin `mapTiles` `names` / `solid` are indexed BY TILE ID (`names[0]` = '', `names.indexOf('tree')` = the tree id). Moving a played character with `agentMove` may take
  a few tries (the TV's own prediction wins at first): ask again until `__dev.me()` is there.

## Quests, NPCs, deep clans (imad 2026-11-25, app 0.11.1)
- **NPCs are not people (imad's choice)**: Kind.Npc 8 (`World.spawnNpc`, look in frame bits 24+, no profile / needs / age / clans, not population),
  5 in the middle of the start map (`protocol/quests.ts NPCS`: guide Mara, smith Joren, hunter Sela, warden Bram, registrar Odile). Kept in
  snapshots; `Quests.setup()` (App start, after land) finds them by look or makes them. TV: a cyan ring; Talk next to one = Do `npc`.
- **Quests** (`sim/quests.ts`, table in `protocol/quests.ts` with en/fr/es/ar texts, ONE table for server + TV): 10 in order, taken from the giver,
  counted from world events by that person after taking (`need` ev/what/n: npc, drink, pickup, gather, craft, build, tend, hunt, clanJoin), handed
  in to the giver (xp, items, food; level ups; lesson -> memory note + `Profile.quests` + `Quests.promptText` in every prompt). AI people do them
  too: every 30 game min by day, free / safe adults get a task (skill `npc` = walk to a teacher and talk + the quest's `plan` steps), from the
  NPC's name. Do `quests` = rows; Notice `quest` = progress. Admin `quests` (panel People: Quests card; person page Quests card).
- **Two kinds of leader (imad's choice)**: the camp leader by traits (Survival.pickLeader) runs the camp's work; a clan leader is ELECTED.
- **Clans** (`sim/clans.ts`): founded at the registrar (AI: task skill `clan found` walks there; player: talk to Odile > Found a clan, name by
  keyboard; no registrar on that map = found at the camp). The first clan founded by an AI invites those who like the founder; a player recruits.
  Join = walk to the leader and ask (`accepts`: AI leader refuses someone they dislike); quit; switch when another clan fits clearly better
  (`fit`) and loyalty < 0.4. Players' characters never move by themselves. Respect (members' feelings + leadership), approval (feelings +
  loyalty). Elections (`callVote` / `closeVote`): every 3 game days, after a day if approval < 35 %, or an ambitious member / a player / admin
  `clanVote` calls one; leader + 2 most respected (+ caller) stand, 2 game hours, AI vote by feelings x respect x kin, players vote on the TV,
  tie keeps the leader. AI leader orders every 6 game hours only for real needs (night + zombies = arm and rally; store low on food / wood, only
  once the camp has a store); a player leader's order (Do `clan` `order:<words>`) goes to members via `Planner.chat` (speaker = their leader:
  obeyed by loyalty). Do `clan` info / join:<id> / quit / found:<name> / vote:<id> / call / order:<text>. Events quest, questDone, clanJoin,
  clanSwitch, clanVote(Start), clanOrder, clanRebel logged. TV: `client/src/questui.ts` (pages quests / npc / clan / clanJoin / clanVote).
- Test quests.test.ts; proof `ADMIN_TOKEN=... node tools/quest-proof.mjs <server> <sdk.js> <outdir>` (sdk from raw.githubusercontent.com/imad-os/g/main/sdk/mypc-sdk.js).

## Horses (imad 2026-11-25, app 0.12.0)
- `sim/horses.ts` (`World.horses`, own `Rng` so horses never shift the rest of the world's dice; saved in snapshots `horses`). Kind.Animal type 5
  (`HORSE`; `Animals` skips it: not in the 5-animal mix / owner counts, `nearest(-1)` never picks a horse, a tamed one can't be hit).
  Per horse: size, intel, speed (gallop m/s), stamina (s), quality 0 common / 1 rare / 2 legendary (stats by tier), coat 0-7, herd, owner, rider, trust per person.
- Behaviour: herds (lead mare picks grass / water, stallion at the edge, foals by the mother; boids cohesion / separation), graze / doze, bunch at night;
  flight from zombies, wolves, bears and untrusted people (running = worse), alarm spreads to the herd; stallion kicks predators; habituation (calm people
  nearby slowly gain trust, max 0.4). Population: foals 0.6 / year with a stallion, old age past 22, a new band from the edge when a map has < half its cap
  (woods 14; none in town: "in the wilderness", so town people need travel open to reach them; players can always go).
- Taming: chance = 0.12 + (power - difficulty) x 1.1 + trust x 0.45 (+ food); power = courage .35 + intelligence .35 + speed .2 + level x .04
  (`skill` points per person, `tameLevel`); difficulty = .25 + intel .3 + q .17. Failure = more trust, may kick (6 hp). Tamed: leaves the herd.
- **Tamed horses live free (imad 2026-11-25: "not follow me", "physically, not magically")**: never follow; graze / wander within `RANGE` 28 m of
  their home spot (`hx` / `hy` = where left / where they came to the owner), still take fright. Horse button: riding = off; mine within 3.5 m = on;
  wild within 3.4 m = tame; mine on this map farther than `CALL_NEAR` 10 m = `call` (mode `come`: runs by an A* path, `routes` not saved, gives up
  after 150 s, stops ~3 m away = mode `wait` 90 s, event `horseCame` -> Notice did `came`); 3.5-10 m = code `walkOver`; other map = `otherMap`.
  Agents whistle theirs (call) for walks > 22 m and get on when it is within 6 m.
- Riding: `Horses.riding[slot]` (1 rider, 2 ridden horse; frames: bit 7 of the kind byte = `KIND_RIDING`, the 8 flag bits are taken); the ridden horse has no physics body and is synced to the rider (`Horses.sync` after portals);
  `World.step` uses `rideSpeed` (trot 3.1 x size, gallop = horse speed while stamina lasts, else canter 4.2). Through a gate on horseback
  (`World.enterPortal`): `Horses.gateSecs(pi)` = 5-15 REAL seconds, fixed per gate (hash of the gate), x the live clockScale; Msg.You carries
  `horse` (rideLook) and the TV draws `gfx/ride.ts RideScene` (own scene, same renderer: my horse galloping on a forest road, me in the saddle,
  props sliding past, dust, camera sweeping round) + note "Riding X to Y n s".
  Agents get on their horse (within 6 m) for paths > 22 m (`Brain.goalDist`) and off to sleep / talk / eat / rest or on arrival.
- Task skill `tame` (+ `askedWork` "tame a horse", planner aliases); hourly own plans: one free adult with power > 0.45 per map now and then.
- Player: Do `horse` (off / on my horse / tame the wild one within 3.4 m / call mine), A (take) also tames / mounts when nothing else is near, Do `horseInfo`.
  `me.ride` { name, walk, run, sta, q } (the TV predicts at that pace), Notice `horses` once a second for the view ([id, scale x100, q, coat, tamed, mine, name]),
  frame bits 24-31 of a horse = 5 | q << 3 | coat << 5. Me page: horses + taming level. Admin `horses { map? }`, `horseSpawn { map, x, y | near, n, q }`.
- TV: `gfx/horses.ts` = Quaternius CC0 animated horse `docs/models/horse.glb` (280 KB; credits docs/models/CREDITS.md), 8 parts merged into one skinned
  mesh with vertex colours per coat (+ golden mane for legendary), Idle / Eating / Walk / Gallop by speed, saddle when tamed, rare = faint blue sheen,
  legendary = warm glow + sparks (no ground circle: imad 2026-11-25); rider pose `People.add(..., seat)`. Strings `i18n7.ts`. Action `horse` (unbound; wheel + Actions; A's context hint mirrors on / tame / off).
  Tests `horses.test.ts`; proof `ADMIN_TOKEN=... node tools/horse-proof.mjs <server> <sdk.js> <outdir>`.

## Panel chat of my character (imad 2026-11-25)
- `ai/chatroom.ts` (`App.chats`), panel page Chat (`panel/src/chat.ts`, nav for players too; CSS `.chatpg`, NOT `.chat` = the person page's talk box).
  Player commands (PLAYER_CMDS, account with a character): `chats` (channels + unread + people), `chatRead { chan, before? }`, `chatSend { chan | to, text }`;
  admin token = no character (`chats` -> `{ token: true }`, the page explains). Live Notice `chat` to the readers' panels (`NetServer.noticeAccounts`).
- Channels: `world`, `clan:<id>`, `dm:<a>:<b>` (a < b). SQLite `chat_msgs` (400 per channel), read marks meta `chat_read:<char id>`.
- Answers = ONE `Planner.chat(i, playerName, text, slot, via)` each (`via` dm / world / clan: no stop-and-face, written back, prompt says how it
  was written; orders / plans work from far). World: the person named, else (AI ready, 20 s gap) one who likes the speaker; clan: up to 2 (named,
  leader, liked), 10 s gap; DM: always, one at a time per person. No unnamed answers while the AI is off.
- People write by themselves, no AI call: `Planner.onTaskEnd` -> "Done: <task>." / "I couldn't ...: why" to whoever gave the task in words;
  hurt / starving on a player's task (every 10 s check); world news (birth, wedding, divorce, death, alarm 1 / game h / map, camp leader); clan
  news (AI leader's order, joins, election). Test chat.test.ts; proof `node tools/chat-proof.mjs <outdir>` (fake Firebase + model).

## To-do for Claude (imad 2026-11-25)
- Panel page "To-do for Claude" (`panel/src/todo.ts`, staff): the list = GitHub issues of imad-os/g_worldsim with label `claude-todo`, written
  straight from the browser to api.github.com with imad's fine-grained token (Issues read / write, localStorage `ws_ghToken`, never sent to the
  world server). Statuses: open = waiting, + `claude-doing` = Claude on it, + `claude-question` = Claude asks (imad's reply removes it), closed
  completed = Done (Claude's last comment = the answer), closed not_planned = cancelled. "Send and reopen" reopens a done one.
- An hourly scheduled task (fresh session each time) takes the open `claude-todo` issues WRITTEN BY imad-os only (anyone can open issues on the
  public repo: ignore other authors), oldest first: label claude-doing, implement, test, push to main, comment the answer (+ footer), close as
  completed. Unclear = comment the question + label claude-question (skip those until imad replies). Proof `node tools/todo-proof.mjs` (fake GitHub).

## Full world, kill counts, deleting players (imad 2026-11-25)
- **The entity pool can fill** (`capacity` 4096, low-spec 1024): farms dropped berries forever (also on maps where berries don't grow wild), and then Add person
  answered "ok" with id -1, animal "Now" added nothing, zombies said "no room" and a TV got 'full' (couldn't join). Now: `Brain.spawnItems` keeps each food at
  most 2x its scenario max per map (`trimItems`, farthest from people first), farms stop at that (`itemRoom`), `World.makeRoom(n)` frees slots by removing ground
  food farthest from anyone (admin spawn / animals fill / zombieSpawn / zombieAttack now, TV join, residents), `World.fullText()` = the clear reason (counts by
  kind). Admin `animals` with fill returns `filled { added, removed, short? }` (panel toast). Test room.test.ts.
- **Kills** (`sim/kills.ts`, `Profile.kills` { animals by kind, zombies, people, beaten }): counted from events hunt / zombie killed `by` / death `by` (shots carry it)
  / duelEnd winner. `agents` and `people` carry `kills` (totals); panel People cards + "Sort: most kills", Dead / everyone table column, person page card "Kills and fights".
- **Delete a player** (admin `playerDelete { name }`, panel Players & TVs > Delete): snapshot + backup "before-delete", kick, TV token row, character + profile,
  bag, place, seer, account link. `players` also lists characters with no TV row (`noTv`) so leftovers ("name (2)") can be deleted. "Unlink TV" = the old revoke.
- Tools: `node tools/admin-cmd.mjs <ws url>/ws '<json>'...` (ADMIN_TOKEN; MAX = answer length), proof `node tools/room-proof.mjs <server> <outdir>`.

## Day / night / sleep clock speeds (imad 2026-11-25: "make the day faster ... so I don't spend all login time sleeping")
- `World.clockMul` { day, night, sleep } (meta `clock_mul`, admin `clockSpeed { day?, night?, sleep? }`, usual 0.25-20 else confirm): x on the
  configured clockScale; `World.updateClock()` at the start of every step (phase picked each sim second) sets the live `opt.clockScale`, which every
  system already reads. Day 06-20, night 20-06; sleep = `playersAsleep()` (App: at least one online player, every online player's character
  EFlag.Sleeping) when faster than the hour's own. Ticks / physics unchanged (deterministic, same real walking pace). Frames carry `cs` (live
  clockScale) so TVs extrapolate the sun right; Welcome clockScale = live. Panel World > Time rows + "Now: ..." line (stats `clock`). Test clock.test.ts.

## TV map, marks, wheel settings, bow crosshair, no button bar (imad 2026-11-25, app 0.12.5)
- **Map** (`client/src/mapui.ts` `MapScreen`, a big Menu page with a Grid; server `ops/mapview.ts` `MapView`): action `map` (pad − = button 8, remote
  Guide; saved binds that still had Thoughts on − give it to the map once, note `mapBtnNews`), quick wheel, game menu row. Do `map` text = map id
  ('' = mine, "<id>:live" = no tiles): tiles once per map + places (every hut with owner / mine / free, my home, camp, fires, store, gates, NPCs, my
  horses, people, players) refreshed every 4 s. Stick / arrows move a cursor (the canvas redraws only when something changed), A / OK = mark here or
  edit the mark under the cursor, X / 🔴 back to me, Y / 🟢 next map, L R / CH + − / PgUp PgDn zoom (fit, 2, 4, 7, 11 px per m).
- **Marks** (`protocol/marks.ts` MARK_KINDS home mine hunt wood water farm danger camp star, MAX_MARKS 60): Do `mark` "add:map:x:y:kind[:label]" /
  "del:id" / "name:id:label" / "kind:id:kind", kept by character name in meta `marks:<name>` (mergePlayer moves them, playerDelete forgets them).
  Do text limit 210 for `mark`. Test mapview.test.ts.
- Horses on the map (imad 2026-11-26): `places.horses` = mine [x, y, name] (gold ring + name), `places.wild` = untamed [x, y, q] (dots: brown common,
  blue rare, gold legendary; 🐎 from zoom 7). Others' tamed horses are left out.
- **Quick wheel settings**: Settings > Quick action wheel (pages wheelset / wheelitem): `WHEEL_ALL` (map, use, horse, eat, drink, sleep, heal, build,
  place, bag, camera, attackPerson, gear, me, talk, attack, pickup, thoughts), 2-12 in order, `MyPC.save('wheel')`.
- **Bow in third / first person**: aiming = where the camera looks (`aimAng = yaw - π/2`), turns slower, left stick sideways turns finely; the camera
  eases over the right shoulder (`World3D.aiming`, fov -13 / -22); `#xhair` crosshair (white = 15 m ahead, red + distance = the locked target;
  the old lock-on assist + a gentle pull within 0.12 rad); my character turns to the aim. Top view keeps the ground line + ring.
- `#hint` (the bottom button bar) is never shown (imad: not needed); the A context pill (`#iahint`) stays. `Menu.render` leaves a page's html
  alone when unchanged (the map's canvas stays put). Proof `ADMIN_TOKEN=... node tools/map-proof.mjs <server> <sdk.js> <outdir>` (`?dev` `__dev.page / yaw / xhair / map`).

## Fighting several at once, helping each other, the woods (imad 2026-11-26)
- `sim/tactics.ts` (`Brain.tactics`), used in `Brain.danger` with the instinct flag: every zombie / attacking animal within 14 m counts
  (`threats`), not only the nearest. Running: `escape` scores 16 ways by the time margin against ALL of them (walls cut a way short, a haven
  or friends pull), keeps the way 3 s unless another is 1.5 m better, and no new path while the old one still points the same way (the
  "a-b-a-b 5 m" bug with 5 zombies = the way was re-picked from whichever zombie was nearest twice a second). The fight-or-run choice is kept
  5 s (`lockUntil`), and someone safe by a fire stays there (no going out to fight and back). Fighting: focus fire (`target`: the one friends
  hit, else close / weak), kite (step back) when hemmed in from two sides, breakout (fight the one in the best way) when surrounded.
  Event `tactic { plan fight | help | kite | flee | haven | breakout, n }` + a shouted line with 2+ attackers. 20 s after a threat the watch stays 14 m.
- Help: `Tactics.victim` = a person (agent, child or player) within 18 m being bitten / gored -> neighbours fight it (odds x1.5, nerve +0.3).
- Wild maps (`World.wild(m)`: gen type wilds or map `danger: true`): children (EFlag.Child / Small) are turned back at the gate
  (`portalsAndTransit`) and a child in the woods goes home; adults go only 06-15 with hp >= 60 (`Brain.mayGoWild`) and leave from 16:00;
  watch radius 14 m there (9 asleep); `Planner.placeText` in every prompt. Test tactics.test.ts (5 zombies: 0 deaths, was 10 of 35).
- **Community memory = lore (imad 2026-11-26: "community memory for places, persons and animals, learning from previous generations", "a panel screen")**:
  `sim/lore.ts` (`World.lore`, snapshot `lore`), fed by events: deaths (not old age / hunger) mark a 24 m place cell (+4), the threat kind (+3) and the map
  (+2); bites +0.5 place / +0.25 kind (bites alone stop at 3); kills of that kind -0.2; a killer +6 fear, duels / PvP a little; heal / help = trust.
  Fades x0.997 a game hour (half in ~10 days). `knows(i)` by age: 0 under 3, taught 3-12, all from 13: lore outlives its witnesses. Acts: wander /
  forage avoid cells with fear 3+ (neighbours half), hunters skip feared beasts unless armed 30+, nerve -up to 30 %, no chats started with a distrusted
  person, a wild map with dread 5+ = armed adults only, 9+ = nobody (`mayGoWild`); `promptText` in every prompt; lessons list (80). Admin `lore`,
  panel page Society (`panel/src/society.ts`). Test lore.test.ts; proof `node tools/society-proof.mjs <outdir>`.

## What every thing is for, horses ridden, bows used (imad 2026-11-26, app 0.12.6)
- `protocol/items.ts` `ITEM_INFO` (ONE table, en / fr / es / ar): one phrase per thing = its benefit + how to get / use it (materials, food, weapons,
  wear, medkit, defences, furniture, hut, store crate, field, horse). TV bag screen shows it (`invui.ts what()`). Server `sim/knowhow.ts`: `KNOW_HOW`
  (all phrases, once per batch prompt and per chat prompt) and `ownText(w, i)` ("Your things: axe (...)") + `Horses.promptText(i)` (your horse and
  where it is / where wild ones live) in `Planner.describe`. A new item = a new ITEM_INFO row (test items.test.ts checks every recipe / placeable / resource).
- **Horses (imad: woods only; with travel closed nobody gets one)**: task skill `tame` now takes the road to the nearest map with wild horses
  (`Tasks.walkToMap` = job to the gate + `e.goal`), by day (`Brain.mayGoWild`), walks (never runs) up to the horse, gives up at 16:00 in the wild;
  new skill `ride { what: home | map }` (get on, whistle for it, ride through the gates home, off by the camp / home; also fetches a horse left on
  another map). `Horses.ownPlans`: on a map without wild horses, 06-12 while travel is open, 1 free adult with a knack (power > 0.4) goes out
  ("go to the wild, tame a horse and ride it home"); chat / planner tame plans get `ride home` added. `autoMount`: call for 30 m+ left, get on with
  10 m+ left (before: 22 m left AFTER it arrived, so calls ended with no ride); `rideLogic` keeps them on while heading to a gate / on a ride step.
  4-day runs with travel open: 3-5 people own a horse, 16-34 rides; closed: none (by design).
- **Bows**: `Brain.bowShot` = a hunter with bow + arrows shoots from 3.5-16 m (1.5 s, uses an arrow, hit by intelligence and range, damage as for
  players, never with a person near the line; event `shot`). Colony goals `bow` (quick + brave, only with a home or 6+ leather: huts need 5) / `arrows`.
- **Gates are openings between trees (imad 2026-11-26: "portals look silly, not a wizard RPG")**: no ring / glow. `client/src/gfx/gate.ts` `gateMesh`
  (one vertex-coloured mesh per gate + the sign's canvas text): the road goes on past the map's edge (paved, then a dirt track) through thick woods
  that close across it further out, two big trees frame the opening, a wooden signpost names the map it leads to (both faces). `Land.tracks()` wears
  a 3-wide dirt track on grass from each gate to the edge and 8 tiles in (every start). Proof `ADMIN_TOKEN=... node tools/gates-proof.mjs <server> <sdk.js> <outdir>`.


## Zombie sieges, both parents, kids near home, clan kids (imad 2026-11-26)
- Experiment `experiment-siege.ts` (E10, research/EXPERIMENTS.md): 20 people (6 couples, 8 kids) vs 20 zombies, a whole game day, full event /
  track logs; test siege.test.ts (one night attack, ~35 s). Night deaths 18 -> 7 and children 9 -> 1 over 16 runs; day attacks unchanged.
- `Tactics.muster(m)` (3+ zombies within 70 m of the camp; at its burning fire, or its ashes relit with 1 wood via `Survival.relight`; never
  with no fire) + `Brain.rally`: go there round the zombies, weak inside 4 m of the fire, fit fight within 7 m, sleep there, `sally` out together
  (2.5 to 1), thirsty / hungry leave when nothing is close. Also: map edge = dead end when running, friends on their feet count in the odds,
  the fight lock ends after 15 hp lost / more attackers, `Tactics.cornered` (bitten 3x in 6 s while running = fight back), carers grab little ones.
- Both parents provide: `Family.given` (food / water given, halved daily), `provider(k)` = the free parent who gave less; their `duty` takes the
  little one over (event care `turn`); older children (3-13) get food brought (`hungryKid` / `bring`, duty 'bring'). Kids 3-13: `Brain.kidHome`
  (home, a parent's home, else camp), `leashed()` in `goTo` (no walk past `KID_RANGE` 35 m from home alone unless thirst > 75 / hunger > 85).
- Clan kids (imad): `Family.threatToClanKid` = only empathy x .6 + courage x .4 > .45, against 1-4 attackers by those traits, never 5+;
  clan members are preferred as stand-in carers and kind ones bring food to a clan child whose parents are away.

## Sleeping at home, beds by need, riding by yourself, compass, names (imad 2026-11-26, app 0.12.7)
- **Sleeping out is risky**: `Brain.mayStayOut(i, d)` = only worn out (tired 97+) and 60 m+ from the hut, or hp < 25 % and 30 m+ (was tired 92 / 40 m);
  4 tries to get home; evening (20-05) with tired > 25 and home > 40 m = +0.25 sleep score (set off early). `sleepSafe` = in my home, by a fire or
  under a roof. Someone WITH a hut on the map asleep elsewhere = `outside` (rest x0.6, up and home once tired < 55) + memory note; the homeless are
  not penalised (no choice; also keeps the siege test's dice).
- **Beds by need** (`Homes.sleepers` = owner, partner, children 3-17 living there; `bedsIn`, `bedsMissing`, `doer` = owner first, else partner: ONE
  of the couple; `bedText` in every prompt via `describe`). Colony goal 'bed' per home lacking beds (`only` = doer, 2 homes a pass); ownPlans use
  `Survival.bedWanted`; `buildThing('bed')` goes into MY home (or a free hut with no bed) and refuses a full home; `Survival.noNeed(i, what)` ends a
  build-bed task at once with the reason (before gathering). Test needs-beds.test.ts.
- **Players' company**: `Brain.playerNeeds` now counts loneliness (grows alone; people awake within 6 m lower it, `Brain.company`); talking -15.
- **On horseback** (server app.ts): A / take / use = get off (no chopping, mining, picking up); pickup / drink = code `onHorse`; attack and talk work.
- **Riding by yourself** (`ops/waypoints.ts` `Waypoints`, `App.waypoints`): Do `rideTo` '' -> `dests` [id, kind, label, m (-1 = other map)]: home (in
  front of its door), this map's camp, other maps (through their gate), 5 nearest marks; nothing within 30 m. Do `rideTo` id -> `pts` (A* 60000
  nodes / 256 points) for this map's leg, `gate` = it ends in a gate. TV (`nav.ts AutoRide`): steers like the stick at a gallop, camera eases
  behind; a new map / road end / stuck 2.5 s = ask again; touching the stick = `rideStopped`. Quick wheel when riding = Get off, Stop, ride
  destinations, Talk, Attack, Map (refreshed every 5 s while riding).
- **Whistle**: `docs/audio/action/whistle_*.ogg` synthesised by `tools/audio/whistle.mjs` (CC0), DID_SOUND `called`.
- **Compass bar** (`nav.ts Compass`, `#compass` under the top bar, `#note` moved to 9vw): Do `compass` every 2 s -> places [kind, label, x, y, d, via]
  (gates, home, this map's camp, my horses, my partner, my marks; other-map places at the gate on the way). White SVG icons, ±100° field,
  N / E / S / W ticks; Settings > Compass bar (`MyPC.save('compass')`).
- **Names over heads** (`nav.ts Names`, `#names`): Notice `names` [[id, name]] sends each name once per session (`Session.names`, reset on reconnect;
  NPCs by their table name); nearest 14 within 26 m; Settings > Names over heads (`MyPC.save('names')`). Strings `i18n8.ts` (T8).
- Proof `ADMIN_TOKEN=... node tools/ride-proof.mjs <server> <sdk.js> <outdir>` (`?dev` `__dev.ride / dests / quick / names / do`).

## Names (imad 2026-11-26: "more names, more unique, Arabic and Moroccan")
- `sim/people.ts` pools = the old 24 + 24 and `F_AR` / `M_AR` (110 + 98 Arabic, Moroccan darija spellings, Amazigh). First names only
  (no family names in the sim). `uniqueName` (one dice draw): a name no living person has (any case) and, while the pool allows, none a
  rules slip away (`editDist`, moved here from rules.ts); full pool = "Name 2". Existing people keep their names. Test names.test.ts.

## Weather, seasons, the cold, hut clusters (imad 2026-11-26, app 0.13.0)
- `sim/weather.ts` (`World.weather`, own Rng, state in snapshots `weather`; calendar settings in meta `weather_cfg` { seasonDays 3, shift, cold }; a world from
  before the weather starts late in spring on its first start via `startNow`). Temperature = season curve (10 + 11 cos, warmest mid-summer) + spell offset + day swing
  (coldest 03:00) + wild maps -1.5. Spells 2-9 game h by season odds (clear cloudy rain storm fog; rain -> snow < 1 °C, storm -> blizzard). Protocol `weather.ts`
  (SEASONS, WEATHERS, COLD_BELOW 5, WARMTH clothes .45 armor .3 helmet .1 x gearMul, `Gear.warmth`).
- Cold: under 5 °C, standing still (not Moving, not Gather / Build / Fight) loses (5 - T) x 2 hp / game h x exposure = (1 - clothes) x hut 0.2 (bed 0.5 more) x fire 0
  (FIRE_WARM 6 m). Drain > 2 halves healing. By a fire healing x2.5 (agents) / x2 (players). Players floored at 5 hp; agents can die (cause `cold`, lore lesson).
  `Brain.chilled[i]`. AI: colony / ownPlans keep the camp fire lit and fed when `coldSoon`, warm clothes valued 0.62; sleep by the fire (`fireSpot`, 260 m) when the hut
  would not be warm enough; `warmUp` (chilled > 4, hp < 85 %) walks to the fire / home; asleep and freezing = wake and go. Prompt line `weather.promptText`.
- Camps = hut clusters: `hutSiteIn` adds `cluster()` (a hut 1-2 tiles from another +1.6, 3-4 +0.7, more neighbours a little more). Test weather.test.ts.
- Admin `weather { seasonDays?, season? (jump), set? + hours? + k?, cold?, clear? }` (bare = read), stats `weather`; panel World > Weather and seasons. Notice `weather`
  (WeatherInfo) per viewer on change / every 10 s; `me.cold` { drain, fire, hut, bed, clothes, t }. TV: `gfx/weather.ts Precip` (rain lines / snow points moved
  only in the vertex shader; 450 / 1000 / 1800 drops by tier, point size capped 14 px), clouds dim sun + grey sky, fog closes in, lightning, snow lies (groundMat
  emissive), fog colour follows the sky; top bar season + °C, card ❄ / 🔥 line, cold note, rain / wind loops, Settings > Rain and snow (`MyPC.save('rainsnow')`).
  Strings `i18n9.ts`. Proof `ADMIN_TOKEN=... node tools/weather-proof.mjs <server> <sdk.js> <outdir>`; software-GL frame times low tier: 16.8 ms in every weather.

## Influence and fairer clan elections (imad 2026-11-26, hybrid chosen on the decision card, app 0.13.1)
- `sim/influence.ts` (`World.influence`, `Profile.influence` { d, log 12 } kept with the profile): score 0-100 = 10 + deeds + level x 4. Deeds from events:
  saved child +8 / person +5 (killing a threat that bit someone else within 20 s, or was going for them within 3 m: zombie / hunt events carry `prey`, `near`,
  hunt `aid`; event `influence`), treated someone +2, zombie +2, boar / wolf / bear +2, game +0.5, task done +0.8 / failed -0.8, ordered +0.7, quest +2,
  rule kept +1.5 / failed -2, duel won +1 / lost -1, kid care +0.15 and help in a fight +0.5 (once an hour), killed a person -15, lost a child -3. Gains
  x max(0.2, 1 - score/110); deeds fade x0.9952 a game hour (half in 6 days). `promptText` in `selfText`.
- Clans: `CALL_MIN` 40 to call a vote (players code `clanLowInfluence`; AI challengers need 40 and +10 over the leader; scheduled / low-approval / panel
  votes unchanged); candidates = leader + 2 most influential (+ caller); AI ballot = `voteScore` 0.6 x influence/100 + 0.4 x feelings / family / loyalty;
  ties keep the leader, else the most influential; a leader gone = the most influential; respect = feelings + influence / 20; split rebels by influence.
- Shown: panel person card Influence (log, help `influence`), People cards + Sort: most influence, Clans card chips; TV Me page + Clan page (members by influence).
  Test influence.test.ts; proof `node tools/influence-proof.mjs <outdir>`.
## Camp plan, fridges and chests, 7 x 7 huts, map ride (imad 2026-11-26, app 0.14.0)
- `HUT_SIZE` 7 (protocol craft.ts; old 5 x 5 huts still read via `hutSz` / walls). Camp circle up to 28 tiles for the town's blocks.
- Fridge (tiles 26) / chest (27): `INSIDE_ONLY`, placed only on a hut's floor along a wall, never by the door; family only (`mayUseBox`).
  Fridge = food + water, chest = the rest (`boxHolds`, `BOX_CAP` 40). Do `box` "x,y" / "put|take:x,y:item:n"; TV page `box` (i18n10.ts T10).
  Pulling a hut down gives the boxes' contents back. Food: 5 in the hands then the bag (`addFood`, code `pickedBag`); water bottles
  (A at the water when not thirsty = `filled`, drink anywhere = `drankBottle`).
- `sim/campplan.ts` (`World.plan`): food / water kept per head, homes, beds, fridges, chests, wood, stone -> `Colony.stock()` goals + a
  daytime filler for half the free people (not lonely, not with a quest left). Chores of the plan give no company. Clothes only with a
  home or 6+ leather. `thingOf` knows fridge / chest (they were built as campfires). Admin `campPlan`; panel People > Camp plans.
- TV: map zoom 7 levels + scale bar, "Ride here" on the map only when mounted (`pt:` route), compass pills in metres; compass + card at top 10px, the compass fits the gap between the top bar and the card (`compassFit`, app 0.14.1). Menu skips `h:` headers.
- Proof `ADMIN_TOKEN=... node tools/storage-proof.mjs <server> <sdk.js> <outdir>`. A hut with no site in the circle goes within 18 tiles of the camp first (the wall follows it).

## 60 fps on low-end devices (imad 2026-11-26)
- Measure first: `ADMIN_TOKEN=... node tools/perf-proof.mjs <server> <sdk.js> <outdir> [tier] [label]` renders the same 5 views (town / woods,
  top / third / first) 15 times with a GPU sync each (`World3D.bench`, `__dev.bench`), plus draw calls, triangles, fps and screenshots
  (adaptive resolution off: `__dev.res(false)`). Software GL in the cloud = fill-rate heavy proxy; real fps belongs on imad's PC / TV.
  Settings > Graphics > Show fps now also shows the render size %, draw calls and triangles (`World3D.stats`).
- Shadows (`gfx/shadows.ts patchShadows`): three 0.170's PCF read the packed shadow map 17x per pixel (the biggest cost); now a 2 x 2
  bilinear filter (4 reads, same softness) + a fade over the last 8 % of the shadow box (no hard edge). PCF soft (high tier) unchanged.
- Levels of detail (`ChunkGeo` in chunkmesh.ts, `World3D.lodPass` every frame, `LOD` table per tier x view distance): `props` always,
  `near` (grass, flowers, fire stones, herb flowers, round crowns on mid / high) only close, `far` (simple crowns) further, `groundLo`
  (tile-corner grid, 1/4 triangles) past `ground` m; skirts hang 1 m under every chunk edge so fine / coarse neighbours never show a
  gap; chunks past the fog are hidden. The top view keeps full detail (everything on screen is close). People past `people` m use
  `World3D.peopleFar` (half the sides, no cast shadow, a round blob instead, no gear); horses off screen skip skeleton + drawing,
  past 30 m animate every other frame, no shadow outside the shadow box.
- Chunk building runs in a worker (`chunkworker.ts` -> `docs/chunks.js`, classic script, built by build-client.mjs): a woods chunk
  took 80 ms on the main thread (a stutter per chunk while walking), the builder is now typed-array based (15 ms) and off the main
  thread (main thread ~1-3 ms per chunk: the GPU upload). Jobs carry the chunk's tiles + 3-tile border, 2 in flight, stale answers
  (tiles changed, map changed) are dropped by `chunkVer` / `mapGen`. `?noworker` or a failing worker = built on the main thread.
- Adaptive resolution (`gfx/dynres.ts DynRes`, Settings > Graphics > Resolution: Automatic / Fixed, `gfx.res`): 5 % steps between
  0.5 (high 0.6) and 1.15 x the tier's size (max 1), down after 2 slow seconds (fps < screen rate - 5), up after 8 smooth ones;
  a step up that fails is blocked 30 s doubling to 5 min; the screen rate is learnt (50-60 Hz). Not judged while a menu is open,
  chunks are loading or riding through a gate.

## A week at home after a birth, beds, box / tree animations, pregnancy % (imad 2026-11-26, app 0.14.3)
- Lying-in (`Family.startLyingIn` on birth, `Profile.lyingIn` { until, baby }, `LYING_IN_DAYS` 7 game days, AI mothers only): her task is put aside
  (not the owner's), `Tasks.start` refuses all but owner / sky orders, rules / jobs / night watch skip her; `Brain.stayHome` = no talk / wander /
  travel, drink and eat from the home fridge or a bottle, rest at home; out only when `Family.urgentOut` (thirst > 80 / hunger > 85 and the fridge
  empty). `Family.provide()` (hourly): the father (else grown kin) gets "fill the fridge for X and the baby" (build fridge if none, food x3, water).
  Only with a home on her map (`lyingInHome`): a homeless mother works as usual. NOTE: 1 game day a year = the baby is ~7 by the end. Test lyingin.test.ts.
- Beds: A next to a bed (1.8 m, `Survival.bedNear`) = lie in it (code `bedSleep`, hint `iaBed`; asleep = A wakes, hint `iaWake`, checked before boxes).
  TV eases people onto the bed (`lieK`, `bedPose` matches chunkmesh's bed turn): step up, lie back on top towards the pillow (`People.add` lie 0..1 + lift).
- `client/src/gfx/anims.ts` (`World3D.anims`): fridge door / chest lid open on Notice `boxOpen` [tx, ty, secs] (`Survival.opened` from boxOut / boxPut,
  `NetServer.toMap`; kept open while the box page is open); a cut tree (tile change in `Msg.Chunk`) falls away from the chopper, bounces, leaves fly, sinks.
- `Life.pregnancyPct` (0-100): panel cards "expecting N%", person page bar, TV Me / person pages; prompts say it. Admin `agentSet { pregnant: 0-100 | -1 }`.
  Proofs `ADMIN_TOKEN=... node tools/home-proof.mjs <server> <sdk.js> <outdir>`, `node tools/pregnancy-proof.mjs <server> <outdir>` (dark panel).

## People screen layout (imad 2026-11-26: "very tall, badly designed")
- `panel/src/people.ts`: section tabs People / Clans / Camp plans / Quests / Dead / Everyone ever (`pTab`; clans, camp plans and quests were cards above the
  list and grew with the population), filter chips with counts (needs help, on an objective, children, expecting, single adults), Table (default, sortable
  headers, `pLay`) or compact Cards; phone = the table's rows turn into 2-line blocks; players' characters = slim rows. Desktop 2150 -> 1150 px for 16 people.

## Grown children leave home, everyone in a clan, clan camps (imad 2026-11-26)
- `Homes.household(owner, id)` (sim/homes.ts) decides who may go in and whose home it is: owner, partner, their children / step-children under
  `GROWN` 18. Grown sons / daughters, siblings, parents and chosen kin are still `family()` but shut out. `Homes.comeOfAge()` (hourly): sets
  `Profile.leftHome`, memory note "build a hut of my own", event `leftHome`; anyone inside a hut they may not enter is put in front of its door.
  `describe` (every prompt) tells the grown and homeless to build or move in; `homeless()` counts them (colony plans their huts).
- Clans (sim/clans.ts): everyone chooses (`choose1`): an unaligned adult (16+, AI only; players choose on the TV) walks to the best accepting clan;
  after `CHOOSE_WITHIN` 12 game h they are taken in (event `clanChosen`); no clan accepts = found one. Children join a parent's clan (`kidClan`).
  No camp leader = the most influential adult founds the first clan. Prompt: "everyone must belong to one".
- `CLAN_CAMP_AT` 20: a clan with more members that is not `mainClan(m)` (camp leader's clan, else the biggest) gets `Clan.camp` 45-90 m from the
  other camps (`campCheck`, `Survival.campSite`), event `clanCamp`, notes, the leader lights its fire. `Survival.campFor(i)` / `clans.campOf(id, m)`:
  that clan's huts and fires go there (`hutSiteIn` with an origin). Walls / night watch / store stay at the map's first camp. Test society.test.ts.

## Tidy TV screen: compass colours, top-edge card, chat log (imad 2026-11-26, app 0.14.6)
- Compass icons 2.5vw, each kind its own colour (`--c` per `.cp-i.<kind>` / `.mk-<mark kind>` in docs/index.html; marks are pins except star / danger).
- `#card` flush with the top-right edge (top 0, right 0, 15vw, smaller text).
- `#top` (world line: map, day, time, weather, people) at the bottom right, 5px from the edges, 1vw text (imad 2026-11-27, app 0.14.7; RTL bottom left).
- `#chatlog` (nav.ts `ChatLog`), bottom left, text only, last 4 lines (older than 1 min faint): Notice `say` (people near me) + Notice `wchat`
  (world channel lines: `Chats` hook `world` -> `NetServer.toViewers`). `say` no longer uses the #note banner.
- NPC lines go only to the player who talked (`Quests.onNpcSay(.., to)` -> `noticeTo`); an AI person taking a quest is silent.
  Proof `ADMIN_TOKEN=... node tools/hud-proof.mjs <server> <sdk.js> <outdir>`.

## The road between maps (imad 2026-11-26, app 0.14.5)
- Every player trip through a gate shows the road (`gfx/ride.ts RideScene`): on horseback a gallop, on foot (or before the horse model loads) a walk;
  light follows the game hour. Client `trip` in app.ts: out (world fades to black, `#fade` CSS opacity) -> ride (`setMap` to the destination at once,
  view at the arrival point, so its chunks load during the ride; 2 chunk builds a frame) -> in (arrival: the new map drawn behind black until its
  ground is in, max 1.5 s, then fades in).
- Server `World.gate` (entity id -> secs / left / shown): players only, length `Horses.gateSecs(pi)` = 5-15 s per gate (sim s = real at speed 1, no
  clockScale). The clock runs only after the TV's Do `rideShown` (sent at the ride's first frame), or after `GATE_WAIT` 5 s with no answer.
  Msg.You carries `secs` / `left` (reconnect resumes). Agents keep `p.travel` / horse gateSecs x clockScale. Not saved (restart = old `arrive`).
- Tests woods-travel.test "the road between maps", horses.test; proof `ADMIN_TOKEN=... node tools/travel-proof.mjs <server> <sdk.js> <outdir>`
  (`?dev` `__dev.trip()`).

## Right-to-left menus (imad 2026-11-26: "Arabic: left goes right")
- In Arabic `document.dir = 'rtl'` mirrors the CSS-laid-out grid screens (bag, Bag & crafting, gear), so `Menu.input` swaps left / right for a page's
  `grid` (`visual()` in ui.ts) unless the grid says `geo: true` (MapScreen: a canvas, same in every language). The quick wheel is placed by absolute
  positions (not mirrored). Proof: Playwright `locale: 'ar'` (the SDK takes the language from the browser when standalone), press arrows, compare the
  `.on` element's x.
## First-person hands, eye height, smooth gallop (imad 2026-11-26, app 0.14.6)
- `gfx/hands.ts` `Hands` (hung on the camera, `World3D.hands`; the camera is now in the scene): first person shows my forearms + fists (skin, sleeve by
  what I wear) with the weapon / tool (grip from the model's bounding box: bow by its middle), the same moves as `People` (attack, chop, mine, build,
  talk, aim / shoot, use), walk sway; on horseback both hands on the reins over the horse's neck. Scaled by the camera fov so aiming keeps their size.
- Eye height (`World3D.eyeWant`, eased in `follow`): app.ts works it out every frame from my size (child / small), seat (`riderSeat` incl. the
  stride's `Horses3D.bounce`) and lying: on foot 1.65 m, in the saddle ~2.6 m (the horse's head and ears show ahead), asleep 0.55.
- Horses (`Horses3D.add`): speed eased (5/s), gait with a margin (gallop in > 2.6 m/s, out < 2.1: the canter at 4.2 sat on the old 4.2 switch),
  a gait change keeps the point of the stride + 0.35 s fade, pace eased. Riders bounce with the horse's back instead of their own bob.
  `?dev` `__dev.gaits()`. Proof `ADMIN_TOKEN=... node tools/fpv-proof.mjs <server> <sdk.js> <outdir>` (writes gaits.json).
- **A bow that really draws (imad 2026-11-27: "hold the bow right, pull the arrow on the string, release properly", my own character only)**:
  `gfx/bow.ts` `LiveBow` (limbs that bend, string tip-nock-tip, arrow nocked on the left of the grip, a flying arrow after the shot) + `BowShot`
  (timeline from Aim held / let go on this TV and the server's quick shot anim 6: draw 0..1 over 0.6 s, release = string snaps and shivers,
  the hand springs back, bow lowers after 0.55 s). First person: `Hands` draws it at half size in the left fist, the right fist on the nock.
  Third / top view: `People.add(.., live)` for me skips the baked bow and `World3D.myBowAt` puts the LiveBow in that hand (raised when drawing,
  hanging otherwise). Everyone else keeps the baked model. Proof `ADMIN_TOKEN=... node tools/bowdraw-proof.mjs <server> <sdk.js> <outdir>`.

## Map icons, card, wheel sleep, sound cues, compass, attack, horse history, drops (imad 2026-11-27, app 0.14.9-0.14.16)
- TV map icons sized from the map box (`base`) x `ICON_ZOOM` per zoom step. `#card` bottom right above `#top`. Compass 1.5x, distances 2vw.
- Sleep: the stick that picked a wheel item is latched (`stickLatch`) until it returns to the middle; players are never woken for being rested
  (`Brain.playerNeeds`), only by a move / A / Sleep.
- `nav.ts SoundCues` (`#cues`, Settings > Where sounds come from, `MyPC.save('cues')`): a heard zombie / animal (26 m) off screen = its icon
  on that screen edge with an arrow; `__dev.cues()`.
- Attack = always melee (`attack()` in app.ts sends Do `hit` only); the bow shoots only on Aim release.
- Horses: `Horse.log` (HorseNote [gameSec, code, arg], 20) + `Horses.lost` (owner id -> last 3 LostHorse, saved); Do `horse` answers carry
  `hist` (`Horses.history`), the TV shows the last lines / what happened (`horseHist`, i18n7 hh*). Old age kept for tamed horses (imad's choice).
- **Drops** (protocol `drops.ts`, `Survival.ground / dropAt / pickDrops / drops`, saved `drops`): a character played by hand (Kind.Player)
  gets chop / mine / herbs, kills (`Animals.hit`) and pull-downs (`pullDown` -> `pullDown0`, boxes too) as piles on the ground (Kind.Item,
  sub = DROP_BASE 100 + kind); A picks up every pile within 2 m (code `pickedDrop`); piles rot after 2 game days; AI people (and autopilot)
  still fill their bag and never forage piles (`nearestItem(.., piles)`). TV draws logs / lumps / bundles / herbs (world3d `drop`). Test drops.test.ts.
- `tools/tv-base.mjs` = shared start of TV proofs (pairs, `adm`, `dev`, `did`, optional fake pad `__axis` / `__btn`). The local server stops
  accepting new TVs after ~20 proof runs (clients cycle "client left"): restart it between runs.

## Dreams, pastimes, expeditions (imad 2026-11-27: "they stand still in the camp all day like zombies; exploring the woods = the dream of the top, for the courageous")
- `sim/purpose.ts` (`World.purpose`, flag `ai.purpose`, default on; own Rng). Every AI adult (16+) gets `Profile.dream` { kind, n, trips, wild, lastWild, past }
  picked by traits: explorer (only courage >= 0.6), hunter, builder, provider, healer, leader, family, sage. Progress from real events (hunt / build /
  store + give food / heal + medkit / questDone + talks with kids), influence (leader), children (family), share of each map's 24 m cells seen
  (`Profile.seen` map id -> bit words, marked every 20 ticks for agents and players; wild maps count x3, goal 60 %). Come true = +12 influence, 100 xp,
  memory, event `dream` (world chat news), a new dream. Prompt line `purpose.promptText` in `selfText`; panel person card "Dream in life" (`agentInfo.dream`).
- `Purpose.pass(m, free, hour)` runs after `Colony.allocate` (goapPass + quarter, 07-19): free adults pursue the dream (75 %) or a pastime (visit a friend,
  walk with the partner, play with a child, look round the camp, herbs, wood); children 3-13 play with each other, follow a parent, listen to an
  adult. 15 game min between pursuits, 3 h after a failed one. Builders build the wall only once every household has a hut; hunters leave game to the
  hut plans while huts are missing and the map has < 8 animals.
- Task skill `explore { what: 'woods' | 'near' | '', times }`: unseen cells few others know, 60-80 m out, away from lore's feared places; look round
  2-5 game min (trees / rocks / water / herbs / animals / wild horses -> memory places + the tale), home, tell it (`tasks.onSay`), event `explore`,
  influence +3 (wild) / +0.3-0.8. Woods = through the gate by day (`mayGoWild`), only while travel is open, back by 15:00. Unreachable cells count as seen.
- E11 in research/EXPERIMENTS.md (4 days, 8 people, 3 seeds): tasks done 103 -> 252, talks 14 -> 71, idle 0.82 -> 0.71, stock 27 -> 66, no deaths.
  Test purpose.test.ts.
- Guards are real people (night watch, `Survival.watch`: AI people on a 3-hour `guard` job by courage / strength / weapon); the 5 in the middle of
  town (Mara, Joren, Sela, warden Bram, Odile) are NPCs (Kind.Npc, quest givers, no needs).

## Server speed with a big population (imad 2026-11-27: "300 people, max speed 2-3.7 instead of x4")
- Cost grows with people: 14 people 0.25 ms a tick, 300 people ~3 ms (cloud), most in physics (crowds touching), the brain, and
  the camp planner's pauses. Measure: `node packages/server/dist/profile.js <agents> <days> <zombies> <maxPop>` (sim only, per
  system max / avg every half game day) and `node tools/server-profile.mjs <secs> <speed> <tvs> <agents>` (the whole App with TVs
  and panel reads: event-loop lag, tick ms, effective speed, kB/s, admin read times).
- `Family.childrenOf` uses a parent -> children index rebuilt once a tick (it walked every profile ever per call);
  `threatToClanKid` loops over a per-tick list of children per map. Same results (world hash checked).
- GOAP `plan` = `planFast` on number arrays (journal in the heuristic, effects memoised by `GAction.reads`); `planRef` = the
  reference, test ai.goap compares both on random problems. Colony actions declare `reads` (gather:wood reads axe).
- The jam: a clan leader's day order (store water / food / wood / stone) went to EVERY free member: ~100 people at the one crate and the
  water's edge, pushing each other every tick. `Clans.leaderOrder` now sends a day chore to a crew of `min(12, 4 + members / 15)`; the night
  rally still calls everyone. 300 people: 2.4 -> 1.8 ms a tick. Tried and NOT kept: physics iterations 6 / 2 (fewer contacts, but 3 seeded tests changed).

## Wild animals as real models (imad 2026-11-27: "the bears, wolves, rabbits and deer are bad 3D models", app 0.14.18)
- `client/src/gfx/beasts.ts` `Beasts3D` (`World3D.beasts`): rabbit, deer (doe / stag by entity id parity), wolf, bear as animated skinned
  models from docs/models (CC0, credits docs/models/CREDITS.md); the boar and anything not loaded yet = the old low-poly `Animals3D`.
  Moves: Walk / run clip by eased speed (pace follows it), Attack on act Fight (13) when close, idles picked now and then (deer / rabbits
  graze), a killed animal (corpses keep the entity id) plays Death and sinks (the bear has none: it rolls over). Off screen = skipped,
  past 30 m every other frame, cap 16 low / 28 other tiers.
- Models made by `node tools/assets/build-animals.mjs` (after `sh tools/assets/fetch.sh` + `npm i --no-save @gltf-transform/core@4
  @gltf-transform/functions@4 @gltf-transform/extensions@4 pngjs@7 jpeg-js@0.4`): parts merged into one mesh with vertex colours, only
  used clips, still channels dropped, quantized (~70-300 KB each). The bear had no skeleton: rigged + its clips made in the script.
- Proof `ADMIN_TOKEN=... node tools/animals-proof.mjs <server> <sdk.js> <outdir>` (`?dev` `__dev.beasts()`).
