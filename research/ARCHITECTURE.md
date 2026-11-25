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

## Flags

`new World(sc, { ..., ai: { goap, learn, siting } })`, all on by default (the server uses the defaults). Off = exactly the
old code paths, for controlled experiments (`npm run experiment`). Learning without `goap` does nothing.

## Files

| file | what |
|---|---|
| `sim/goap.ts` | the planner (pure, no world access) |
| `sim/colony.ts` | drives, goals, allocation, actions from the world, learning, re-planning |
| `sim/structures.ts` | flood fills, hut shape from walls, hut audit |
| `sim/survival.ts` | camp site, hut site, wall circle, reservations, the old work list (flags off) |
| `src/experiment.ts` | the experiment runner and its metrics |
| `test/ai.goap.test.ts` | planner, structures, colony and learning tests |
