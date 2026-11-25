# The local AI: architecture

How people in the world decide what to do, without the LLM. The LLM (Ollama / Gemini, `ai/planner.ts`) sits on top: it
gives wishes, orders and step plans from conversations. Everything here runs every tick on the server, deterministic for a
given seed, and costs no AI calls.

```
              needs (hunger, thirst, tired, lonely)          the camp's drives (sim/colony.ts)
                          │                                   warmth · shelter · food · safety · tools · comfort · curiosity
                          ▼                                                 │ value 0..1 now
  Brain.decide (sim/brain.ts)                                               ▼
   danger → hunt → obey order/job → carry on → utility choice      allocation: value × trait fit × chance of success
   (drink, eat, forage, sleep, talk, wander, rest, travel)                       − hours of work × 0.04
                          ▲                                                 │ best candidate per goal
                          │ orders / jobs                                   ▼
  Tasks (sim/tasks.ts) ◄──── task steps ◄──── GOAP plan (sim/goap.ts) from that person's facts + actions
   runs steps with the real rules, reports each step's outcome ──► learning (Colony.record): person + camp culture
   a failed planned task is planned again once; a goal that keeps failing rests 2, 4, 8 ... hours
                          │
  Survival (sim/survival.ts): jobs on the map (chop, dig, build, place, tend, store, farm ...)
   building sites: camp site search, hut site constraint search, wall circle sized to the village, reserved ground
```

## Layers

1. **Reactive layer, `Brain`** (unchanged). Needs are a lack (0 fine .. 100 desperate). Each think picks the best scored
   action (utility AI, response curves per need, a small inertia bonus, a +0.32 bonus for the LLM's wish). Danger,
   hunting, orders and survival jobs come first. A* paths per map, level of detail by activity.
2. **Deliberative layer, `Colony` + `goap.ts`** (new, flag `goap`). Replaces the fixed hourly cascade of "if no fire at
   dusk then fire, else if fewer huts then hut, else 12% chance of a bed..." in `Survival.ownPlans`.
   - *Drives → goals.* `Colony.goals(m)` turns the camp's state into goals with a value: a fire at dusk (0.95), fuel when
     low, a roof per two people, repairs, doors / wall / spikes (higher under threat; the wall only once the huts stand),
     a food store of two portions a head, fields, beds, a lamp, each person's axe / weapon / clothes / firewood, and
     curiosity (searching ruins, halved by every search in the last 12 hours). A goal is a set of facts to reach, with
     alternatives ("spear or sword"). Adding a need is one line, not a new script.
   - *Allocation.* Goals by value; for each, the 3 free people whose trait fits best are planned for, and the one with the
     best `value × fit × P(success) − hours × 0.04` gets it (a one-round contract net). Crews for big jobs. Goals already
     being worked on by enough people are skipped. At most 24 plans per pass and map (a counted budget, so runs repeat).
     Passes run every game hour (with the leader, care for children and the wounded, the night watch as before) and every
     20 game minutes for whoever became free.
   - *Planning.* Facts = what the person carries (every resource and item), whether a fire burns at the camp and its fuel,
     food in the store, a broken wall, and counters for new camp things (`+hut`, `+wall`, `+door` ...). Actions are made
     from what is around them (a tree, rubble, rock, food lying about, an animal within reach) and from the **shared recipe
     table** (`protocol/craft.ts`): every recipe is a craft action, every placeable a build action, so a new recipe needs no
     planner code. Costs are game seconds of work plus walking, with yields that depend on the state (an axe doubles wood).
     Forward A* with a stock-aware additive heuristic (HSP-style); states that only differ in order collapse. The plan is
     regrouped (all the wood in one go) and becomes ordinary task steps, each tagged with its action key.
3. **Learning** (flag `learn`). `Tasks` reports every planned step: success with game seconds per unit, or failure. Each
   person keeps `mind.know` (successes, failures, seconds per unit) and the camp keeps a culture table (what one learns,
   the others count at half weight: social learning). The planner uses learned durations (blended with the prior) and
   divides cost by the Laplace-smoothed success chance; allocation multiplies value by the plan's chance of working. A
   failed planned task is re-planned once from where the person stands (plan repair); a goal that keeps failing for a
   person rests for 2, 4, 8 ... game hours (exponential back-off, at most 2 days), cleared by a success.
4. **Construction under constraints** (flag `siting`).
   - *Where to found the camp*: candidate centres on a 4-tile grid within 50 m, scored on open buildable ground within 11
     tiles, distance to water, trees within 30 m, distance from the founder; never near a portal.
   - *Where a hut goes* (`Survival.hutSite`): hard constraints: the 5 x 5 square and a ring round it on free open ground,
     inside the planned wall circle with a gap to its line, off the fire, two tiles of open ground in front of the door,
     not on anything reserved (other doors' aprons, ground others are building on), and, checked with a flood fill with
     the new walls counted, the camp still reaches every door, the store and the new door. Scored: the door faces the camp
     centre (4 orientations tried), close to the centre. Before the wall is fixed, a crowded site may widen the circle.
   - *The wall* is a circle sized to the village it protects (room for a hut per two people plus two to grow, at least the
     old 9 tiles, at most 20, wider when something already stands further out), fixed when its first piece goes up
     (`Survival.walls`, saved). It never covers a door apron; every other site search keeps off its line. Worlds whose wall
     was started on the old 9-tile ring keep that ring.
   - *Huts are read from their walls* (`sim/structures.ts`): door direction, room, enclosure and access are computed from
     tiles, so repairs, beds and doors work for any orientation (`hutRect`).

5. **Instincts and fear** (flag `instinct`, 2026-11-25).
   - *Fight or flight by the odds* (`Brain.fightOrFlight`): how long our side lasts against their bites against how long
     they last against our blows (a Lanchester-style duel of damage rates: hp / dps for each side). Friends within 14 m
     count fully when already fighting that threat, at 0.6 when they are awake, healthy and could join. Courage moves the
     bar (0.55 + 0.9 x courage, +0.1 armed), a child, partner or parent next to the threat multiplies the will to fight by
     1.6, and someone already fighting keeps at it unless the odds fall clearly (x1.4 hysteresis). One zombie or a wolf:
     fight; three zombies alone: run; with three friends: fight; a bear bare-handed alone: run, unless their child is there.
     Children and the badly hurt always run. Flags off = the old nerve rule.
   - *Alarm calls*: whoever sees a threat first shouts (at most once per 2 game minutes): everyone within 30 m hears it,
     sleepers within 12 m wake. Those who would fight come (up to 35 m away), the others take cover. A roof with the
     threat under it is no shelter; a fleeing person who finds no spot tries wider ones before fighting back cornered
     (before, people froze in "fleeing" next to a zombie in a hut without a door, and died).
   - *Hunting*: a hunter stalks the animal (it notices them at half its sight until 3 m), game is searched for up to 220 m
     and three escapes are allowed before "it got away".
   - *Foresight*: drink and eat before the night (dusk bonus), go home to sleep when zombies walk at night, make a weapon on
     quiet days (fear of what may come), look for a partner (single adults 18-45: the single adult they are closest to, by
     talks and feelings; the courting rules decide; never past the population cap; players' characters are never targets).
   - *Plans for what was asked*: a craft / build step from the LLM or the keyword net ("make a sword") is planned with GOAP
     from what the person carries and what is anywhere on the map (people know their map: an hourly index of tiles), so a
     sword becomes "dig ore at the rocks across town, then make it"; with no way the step fails at once with the reason
     ("I need 1 ore, and there are no rocks anywhere I know of here"). A tool already owned is "done", not "I need stone".
6. **Memory** (`sim/memory.ts`, flag `instinct`). Written by the engine from what happens, so everyone has it without AI
   calls. Short-term: the last 10 things (a repeat is merged and counted); a memory of importance 4+ of 10 moves to long-term
   when it leaves short-term memory, the rest is forgotten (Atkinson-Shiffrin stores). Long-term: at most 100; when full the
   lowest retention goes (importance x 2 + log2 of times it happened - days since / (importance / 2): the Ebbinghaus curve,
   slower for what mattered; importance 9+ is kept for life). Importance: a child born / kin dead 10, partner 9, a friend dead
   8, saw a death 6, killed a zombie 6, bitten 5-7, a hut built 6, a hunt 4 (a bear 7), small talk 1. Recall (Park et al.
   2023): recency (2-day half life) + importance + words in common with the question. Places: up to 4 each of water, wood,
   stone, ore, food, game, sleep and danger (where they were hurt), merged within 8 m. Used in every LLM prompt ("Your
   memories ... Places you know: water 20 m north; danger (I was hurt) 35 m east") and by the reactive layer (wandering keeps
   away from where they were bitten in the last two days). Kept in `Profile.mind.mem`, saved in snapshots.

## Flags

`new World(sc, { ..., ai: { goap, learn, siting, instinct } })`, all on by default (the server uses the defaults). Off = exactly the
old code paths, for controlled experiments (`npm run experiment`). Learning without `goap` does nothing.

## Files

| file | what |
|---|---|
| `sim/goap.ts` | the planner (pure, no world access) |
| `sim/colony.ts` | drives, goals, allocation, actions from the world, learning, re-planning |
| `sim/structures.ts` | flood fills, hut shape from walls, hut audit |
| `sim/memory.ts` | short / long-term memory, recall, places |
| `sim/brain.ts` | `fightOrFlight`, alarm shouts, foresight bonuses (instinct) |
| `sim/survival.ts` | camp site, hut site, wall circle, reservations, the old work list (flags off) |
| `src/experiment.ts` | the experiment runner and its metrics |
| `src/experiment-requests.ts` | E6: plain requests from the owner, done or why not |
| `src/experiment-defence.ts` | E7: a zombie, three zombies, a wolf, a bear next to each person |
| `test/ai.goap.test.ts` | planner, structures, colony and learning tests |
| `test/ai.instinct.test.ts` | odds, alarms, memory, plans for what was asked |
