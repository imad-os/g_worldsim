# Experiments

All runs: `npm run experiment -- --days D --arms ARMS --seeds S [--agents N] [--zombies Z] [--out file]`
(`packages/server/src/experiment.ts`). Scenario post-apocalypse, clock x30, 20 ticks/s, no LLM, seeds exp-a..exp-e
(5 seeds per arm unless said). Same seed + same flags = same numbers. Raw results: `research/results/*.json`.
Arms: **old** = every new flag off (the code before 2026-11-25), **new** = goap + learn + siting (E1-E5), + instinct from E6.

Note: E1-E5 ran without `World.land.setup()` (the server calls it at start: the ring of trees, roads, rocks), so the town had
no rocks and no ore. From E6 the harnesses call it; E8 repeats E1 / E3 that way.

Metrics: task success rate and failures (planned and own tasks, LLM orders excluded since no LLM runs); **loops** = the same
person failing the same task for the same reason a 3rd time or more; **functional huts** = a doorway, a closed room, the
door reachable from the camp centre by flood fill, inside the wall circle (`sim/structures.ts auditHut`); wall pieces up;
fire hours = game hours with a fire burning at the camp (of 72); idle = share of hourly samples of awake people resting /
wandering / idle; ms per tick on the cloud container (one core).

## E1. Old vs new, 5 people, 3 game days (2026-11-25)

| metric | old | new |
|---|---|---|
| deaths | 0 | 0 |
| tasks done / failed per run | 32 / 19 | 91.6 / 1.2 |
| task success rate | 0.63 | **0.99** |
| failure loops per run | 5.2 | **0** |
| functional huts (all seeds) | 8 / 15 | **14 / 15** |
| wall pieces up (ring finished?) | 5.2 (no) | 40.8 (yes, every seed) |
| fire hours of 72 | 39.6 | **64** |
| things crafted | 8.4 | 47 |
| mean hunger / thirst | 28.9 / 26.4 | 27.7 / 26.1 |
| talks per run / mean loneliness | 7.2 / 20.6 | 6.0 / 16.2 |
| idle share | 0.85 | 0.84 |
| ms per tick | 0.067 | 0.071 |

Old failure reasons: "there are no rocks near here" (doors and swords need ore that the town lacks), "there is no fire near
here" (feeding a fire from wherever the wood was cut), hunts that get away. New: a handful of "took too long" / "someone is
in the way".

## E2. Ablation (which part does what), 5 people, 3 days

| metric | goap only | goap + learn | goap + siting |
|---|---|---|---|
| task success | 0.63 | **0.98** | 0.58 |
| loops per run | 34.6 | **0** | 47.4 |
| functional huts per run (of 3) | 1.0 | 0.2 | **3.0** |

- Planning alone gets far more done (walls, fires, crafting) but repeats what fails (hunting for leather, mostly):
  without outcome statistics, nothing tells the planner hunting rarely works here. Learning removes the loops completely.
- Planning without siting builds at the camp centre where the old random site search puts huts outside the 9-tile wall
  or against each other; siting fixes construction on its own. Each part is needed; all three together is E1's "new".

## E3. Zombies every night (2 per night), 5 people, 3 days

| metric | old | new |
|---|---|---|
| deaths | 0 | 0 |
| mean health | 96.3 | **98.2** |
| task success / loops | 0.63 / 12.6 | **0.92 / 1.8** |
| functional huts | 8 / 15 | **13 / 15** |
| wall pieces up | 23.6 | 42.4 |
| fire hours | 42.4 | 64 |

Under threat the drives raise doors, walls, spikes and weapons (people make spears / swords as "make a weapon").

## E4. 20 people, 2 days (2 seeds)

| metric | old | new |
|---|---|---|
| deaths | 0 | 0 |
| tasks done / success | 19.5 / 0.77 | 150.5 / **0.98** |
| huts / functional | 5.5 / 1 of 11 | 10 / **12 of 20** |
| wall pieces | 1 | 62 |
| food in the store | 0 | 44 |
| talks per run | 29.5 | **19.5** (worse) |
| ms per tick | 0.106 | 0.114 |

Big villages outgrow the planned wall circle in cluttered town ground (8 of 20 huts end outside it), and a busy camp talks
less: both are in the backlog.

## E5. Cost at 100 people (bench, clock x10, 10 simulated minutes)

| | old | new |
|---|---|---|
| ms per tick (mean) | 0.270 | 0.280 |
| p99 | 0.66 | 0.79 |
| worst tick | 4.2 ms | 43 ms (one planning pass; 24 plans at ~1.2 ms) |

Before the per-pass plan budget the worst tick was 254 ms; the budget (counted, not timed, so runs stay deterministic) brought
it to 43 ms. A perception cache is the next step (backlog 1).

## GOAP sanity check

From nothing, the planner's hut plan makes an axe first (1 wood + 1 stone), because an axe doubles the wood per chop:
2575 game s against 3010 for chopping by hand (test `ai.goap.test.ts`). Nobody wrote "make an axe before a hut".

## E6. Plain requests from the owner (2026-11-25, instinct round)

`node packages/server/dist/experiment-requests.js --arms old,goap+learn+siting,new [--llm]`: after a morning in town each
of the 5 people is asked one thing in plain words (15 requests: build a hut, make a sword, put a door on the hut, go hunting,
make clothes...), the way imad does in the panel; then 4 game hours. Seeds req-a..c, 45 requests per arm. `--llm` answers
every chat with the one-step plan a small model sends ([{do: 'craft', what: 'sword'}]); the numbers were the same.

| | old | goap + learn + siting | new (+ instinct) |
|---|---|---|---|
| done | 37 / 45 (0.82) | 38 / 45 (0.84) | **41 / 45 (0.91)** |
| failed because | no animals found 3, it got away 4, ground taken 1 | no doorway needs a door 3, it got away 3, no way there 1 | no doorway needs a door 3, no animals 1 |

Before the fixes (same harness without the town's rocks): 0.69 / 0.78, with "there are no rocks near here" x5 and "I need 1
stone" for an axe the person already had. Now the remaining failures are true ("the hut already has its door").

## E7. Defence: a threat 5 m from each person (2026-11-25)

`node packages/server/dist/experiment-defence.js`: after a morning in town, one zombie / three zombies / a wolf / a bear
appears 5 m from each person in turn (health reset between trials), 90 game seconds. 15 trials per cell (3 seeds x 5).

| threat | arm | fought | fled | died | health lost | attackers killed | friends who helped |
|---|---|---|---|---|---|---|---|
| 1 zombie | old | 12 | 4 | 1 | 32 | 11 / 15 | 0.53 |
| | new | 15 | 0 | **0** | 29 | **15 / 15** | 0.27 |
| 3 zombies | old | 12 | 12 | 2 | 55 | 18 / 45 | 0.93 |
| | goap+learn+siting | 15 | 9 | 9 | 73 | 23 / 45 | 0.53 |
| | new | 11 | 13 | 2 | **32** | 18 / 45 | 0.67 |
| wolf | old | 12 | 5 | 2 | 28 | 12 / 15 | 0.07 |
| | new | 15 | 0 | **0** | **10** | **15 / 15** | 0.27 |
| bear | old | 12 | 13 | 6 | 80 | 4 / 15 | 0 |
| | new | 15 | 0 | **0** | **44** | **15 / 15** | 0.27 |

- The old rule fought by nerve alone and gave up half way; against a bear 6 of 15 died. With the odds and the shout,
  friends come, the bear is killed every time, nobody dies.
- Three zombies: the first instinct version was worse (7 deaths): people ran into a hut without a door with the zombies
  after them and stood there "fleeing". A roof with the threat under it is now no shelter, and a cornered person looks
  wider for a way out: 2 deaths, health lost 32 instead of 55.

## E8. E1 / E3 again with the town's rocks, three arms (3 seeds, 3 days)

| metric | old | goap + learn + siting | new (+ instinct) |
|---|---|---|---|
| task success / loops | 0.69 / 4.7 | 0.97 / 0.7 | 0.97 / **0** |
| tasks done | 32 | 87 | **97** |
| functional huts | 1.3 / 3 | 3 / 3 | 3.3 / 3.3 |
| wall pieces | 4.7 | 30 | 38 |
| partners / births | 0 / 0 | 0 / 0 | **1.3 / 1.3** |
| memories kept per person (short / long / places) | - | - | 8.5 / 6.9 / 13 |
| snapshot size | 22 KB | 24 KB | 32 KB |
| ms per tick | 0.074 | 0.073 | 0.072 |

With 3 zombies a night:

| metric | old | goap + learn + siting | new (+ instinct) |
|---|---|---|---|
| deaths | 2.7 | 0.7 | **0.3** |
| alive at the end (births count) | 2.3 | 4.3 | **6** |
| bites | 67 | 32 | **26** |
| task success | 0.75 | 0.93 | **0.96** |
| alarms shouted | 0 | 0 | 6.3 |

Memory costs ~10 KB of snapshot for 5 people after 3 days (at most 100 + 10 + 32 small records per person, so it stays far
under Firestore's 1 MiB document limit). The tick cost does not change.

## E9. E6 / E7 again after merging the day's other work (homes with locked doors, rarer and harder rocks)

| | old | new |
|---|---|---|
| plain requests done | 32 / 45 (0.71; "no rocks near here" x5) | **39 / 45 (0.87)** |
| 3 zombies: died / attackers killed / friends who helped | 13 of 14 / 6 of 42 / 0.14 | **1 of 14 / 30 of 42 / 2.4** |
| bear: died / killed / helped | 14 of 15 / 0 of 15 / 0 | **0 of 15 / 15 of 15 / 2.5** |

With doors that open only for family, the old flee rule (run to the nearest roof) leaves people outside a locked door with
the zombies behind them; the odds, the shout and friends coming make the difference.

## E8. Strict rules both ways: "must hunt every day" / "never hunt" (2026-11-25)
`node packages/server/dist/experiment-rules.js --days 3 --seeds r1,r2,r3` (5 people, no LLM: the engine's own reading of the words).
Arm `must` = for everyone "you must hunt every day" + for one person "you never talk to <second person, two letters swapped>".

| arm | person-days | days with a kill | kills | days the rule ended done | talks between the pair |
|---|---|---|---|---|---|
| no rule | 45 | 0 (0 %) | 0 | – | 2 |
| must hunt every day | 45 | **45 (100 %)** | 56 | 45 | **0** |
| never hunt | 45 | 0 (0 %) | 0 | – | 0 |

Before: "you must hunt every day" had no engine meaning (kind goal, no steps) unless an AI turned it into a plan, its task
waited for a moment with no task at all (the colony keeps people busy), and a small model could list "hunt" as forbidden, which
turned the order into a "never". Failed tries were "I found no animals near here" (28) and "it got away" (3); each waits 2 game hours.
On a live server (town only, travel closed, 4 animals at most in town) the same rule got 7 kills for 5 people in ~1.5 game days:
hunting in town is limited by game, not by the rule.

## E10. Siege: 20 people (8 children) against 20 zombies, a whole game day (2026-11-26)
`node packages/server/dist/experiment-siege.js --seeds siege-a,... --hour 13,21 --where edge,camp --out <dir> [--days 2]`
(post-apocalypse scenario, town, 6 couples + 8 children aged 0.3 / 0.6 / 1.4 / 2.2 / 5 / 7 / 9 / 12, the town lives from 08:00,
20 zombies that do not crumble at dawn come in at 13:00 or 21:00 from the roads (edge) or 30-45 m round the camp; until 08:00
the next day. Every event goes to `<seed>-<hour>-<where>-events.jsonl`, everyone's position / act / hp / carer each game minute
to `-track.jsonl`.) 32 runs: seeds a-d x 13 / 21 x edge / camp, seeds e-l x 13 / 21 x camp.

| | before | after |
|---|---|---|
| deaths (all 32 runs, 640 lives) | 29 | **18** |
| children killed | 14 | **5** |
| night attacks: deaths / children / bites on children | 18 / 9 / 187 | **7 / 1 / 27** |
| day attacks: deaths / children | 11 / 5 | 11 / 4 |
| 2 days after a night attack (4 seeds): deaths | – | 15 (thirst, at the fire) -> **0** |
| food and water given by fathers (8 fresh seeds, one day) | 0 | 31 (mothers 115) |

What the logs showed (every death was printed with its last 14 events and who was within 10 m):
- almost everyone who died was alone and running, often caught against the map's edge (`Tactics.way` now treats the last
  14 m before the edge as a dead end); nobody stood together because everyone counted only friends not running (friends on
  their feet within 10 m count now);
- a night guard kept fighting 4 zombies down to 20 hp: the 5 s fight-or-run lock now ends after 15 hp lost or more attackers;
- a woman ran from a boar for 11 minutes, bitten 15 times: bitten 3 times in 6 s while running = turn and fight (`cornered`);
- toddlers were left standing while their carer ran: a carer now runs to the little one and picks it up first.
- Rally (`Tactics.muster`, `Brain.rally`): 3+ zombies within 70 m of the camp = everyone within 90 m goes to the camp's
  burning fire (or lights its ashes again with one wood), the weak in the middle (inside 5 m: zombies cannot reach them
  there), the fit hit what comes within 7 m, sleep there at night, and go out together for the nearest zombie when they
  outnumber it and its neighbours 2.5 to 1. Thirsty / hungry people leave the group for water when nothing is close.
  Tried and dropped: a rally with no fire (20 of 20 dead: a crowd of bare hands loses to 20 zombies; scattered they outrun
  them) and a fire made new on the spot (not up in time: 8 and 13 dead).
- Day attacks with no fire yet are not better: people still scatter and a few hurt ones are caught later. Next: weapons
  before a planned attack (spears), huts with doors as a day shelter.

## E11. Dreams, pastimes and expeditions (2026-11-27)
imad: "they stand still in the camp all day, only eating, drinking and resting". `npm run experiment -- --days 4 --seeds exp-a,exp-b,exp-c
--agents 8 --arms goap+learn+siting+instinct,new` (the second arm adds `purpose`, sim/purpose.ts). Means of 3 seeds, travel closed, no zombies:

| metric | without dreams | with dreams |
|---|---|---|
| tasks done | 103 | 254 |
| tasks failed | 20 | 29 (ok rate 0.84 -> 0.90) |
| idle (Rest / Wander / Idle share of waking samples) | 0.82 | 0.72 |
| talks | 14 | 77 |
| loneliness | 23.0 | 18.2 |
| food kept | 27 | 63 |
| huts (functional) | 2 (1.7) | 3.3 (3.3) |
| gathered | 303 | 495 |
| deaths | 0 | 0 |
| ms per tick | 0.154 | 0.145 |

The idle share that is left is mostly children (who stay by a parent) and new mothers' week at home, plus walking legs of tasks
counted as Wander. With travel open (scratch run, seed exp-a): 3 expeditions into the Pine Woods in 4 days, each back with
"plenty of trees, rocks to mine, water, wild horses, wolves (danger)..."; no deaths.

## E12. Shorter planner prompts, goals that can work (2026-11-27)

imad: "the prompts for persons planning got very long, slow, even timeouts ... make sure they will not make them dumb". No LLM in the
cloud, so `experiment-prompts.ts` plans with a FAKE model that reads only the prompt text (urgent needs from the need words, a hut /
bed when the prompt says one is missing, else a work goal from the goals offered; or "random" = any offered goal). 16 people, travel
open, 3 game days, seeds pr-a/b/c, one batch per 20 real s (as the server). Before = the code at 8cf9a18.

| sensible fake model | before | after |
|---|---|---|
| AI calls | 388 | 318 |
| people planned | 1353 | 608 |
| prompt characters per call (avg) | 20,244 | 8,948 |
| tokens sent in 3 days (chars / 4) | 1.97 M | 0.71 M |
| planned tasks done / failed | 8 / 899 (1 %) | 222 / 78 (74 %) |
| deaths | 0 | 0 |
| store stock | 444 | 459 |
| lonely / idle | 19.3 / 0.42 | 13.2 / 0.34 |
| talks | 203 | 411 |

Random fake model: tasks ok rate 64 % -> 85 %, calls 397 -> 347, tokens 1.58 M -> 0.80 M, no deaths either way.
Before, the prompt said "No home yet" and offered "build a hut" while no leather could be had in town: 888 failed hut tasks, each
failure marked the person urgent and planned them again (the loop that made the calls). Now that goal shows under "Not possible now"
with the engine's reason. Huts finished by planned tasks: 2.3 -> 0.7 (the 2 came out of ~900 tries; the camp's own hut plans are
unchanged). `npm run build && node packages/server/dist/experiment-prompts.js --days 3 --policy sensible`.

## E13. Daily rhythm, awareness, talks that carry knowledge (2026-11-27)
imad: "as smart as they can get... when I play I feel they are alive". `npm run experiment -- --days 4 --seeds exp-a,exp-b,exp-c --agents 8
--arms goap+learn+siting+instinct+purpose,new` (the second arm adds `aware`: sim/aware.ts, sim/talk.ts, the evening / sleep rhythm). Means of 3 seeds:

| metric | before | aware |
|---|---|---|
| awake between 0 and 5 h (share of people) | 0.63 | **0.23** |
| idle (rest / wander / idle share of waking samples; the evening by the fire counts as rest) | 0.72 | 0.66 |
| talks | 70 | **107** |
| pieces of knowledge passed in talks | 0 | **203** |
| joint plans agreed (hunts, wood) | 0 | 3 |
| failure loops | 4.3 | 2 |
| bites | 10.3 | 6.7 |
| tasks done / ok rate | 247 / 0.89 | 224 / 0.88 |
| huts | 3.3 | 2.3 |
| fire hours (of 88) | 88 | 88 |
| food kept | 60 | 63 |
| deaths | 0 | 0 |
| ms per tick | 0.137 | 0.112 |
| snapshot kB | 60 | 73 |

Tasks done fall by ~9 %: by hour, the loss is the night (0-6 h: 29 tasks before, 10 now: firewood and fire tending done by people
awake at 3 am); daytime work is the same within noise. A first version let the fire go out at night (81 of 88 h): whoever sits by
it at bedtime now puts a log on. Fewer huts in 4 days (2.3 vs 3.3, one seed built 1) is the open cost.
With 2 zombies a night (2 seeds, 3 days): bites 22.5 -> 18.5, night awake 0.58 -> 0.36, no deaths either way.
Night siege (20 people, 8 children, 20 zombies at 21:00, `runSiege`, 11 seeds): deaths 3 -> 1, people under 30 hp 17 -> 12 (one child died
in one seed, none before); fathers fed a child in 8 of 11 runs (10 of 11 before), so the siege test moved from seed siege-g (0 feeds by a
father in that seed) to s1.
