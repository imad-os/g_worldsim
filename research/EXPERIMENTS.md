# Experiments

All runs: `npm run experiment -- --days D --arms ARMS --seeds S [--agents N] [--zombies Z] [--out file]`
(`packages/server/src/experiment.ts`). Scenario post-apocalypse, clock x30, 20 ticks/s, no LLM, seeds exp-a..exp-e
(5 seeds per arm unless said). Same seed + same flags = same numbers. Raw results: `research/results/*.json`.
Arms: **old** = every new flag off (the code before 2026-11-25), **new** = goap + learn + siting.

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
