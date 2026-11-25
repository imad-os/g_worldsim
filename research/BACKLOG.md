# Improvement backlog (prioritised)

Value = what it changes in measured behaviour; cost = engineering + CPU. Done items move to EXPERIMENTS.md.

## Weaknesses found in the audit (2026-11-25)

- The camp's work was a fixed if / else list with random chances (`Survival.ownPlans`), one job per person per hour, and a
  global "someone is building, nobody else plans" gate. **Fixed** (goal planning).
- Failures repeated: "there are no rocks near here" (doors and swords need ore that the town lacks), "there is no fire near
  here" (feeding a fire 40 m from wherever the wood was cut), the same task failing again each hour. **Fixed** (plans check
  what exists; tend / build target the camp; learning + back-off).
- Huts went anywhere within 30 m of the camp with the door always south; the defence wall was a fixed 9-tile circle, so
  huts ended outside it; two builders could choose the same ground. **Fixed** (siting, reservations).
- The camp was founded wherever the first fire was lit (often on a road crossing next to a ruin). **Fixed** (camp site).
- A duel and a task fought over the same person. **Fixed** (tasks wait during a duel).
- Still open: people are idle ~80 % of waking hours (sampled hourly); conversations are short and rare; animals are hard to
  catch (half of hunts end "it got away"); the reactive layer scans every entity for the nearest item / person (O(N²)).

## Next, by value

1. **Perception cache per pass** (cost S). `Colony.actions` scans tiles and entities per plan (~1.2 ms per plan at 100
   people, a 43 ms pass at most). Cache nearest sources per person per pass, use the spatial grid for items. Keeps big
   worlds smooth.
2. **Shared plans and roles** (cost M). Two people building one hut, a hunting party, a bucket chain to the store: a joint
   goal split into sub-goals per person (HTN-style decomposition of a GOAP plan, or "help" actions that add to another's
   counters). Today crews only work in parallel.
3. **Learned drive weights per camp** (cost M). Bandit over goal choices with the camp's outcomes (fire hours, hunger,
   deaths, bites) as reward, so camps develop different priorities ("culture"). Measure divergence across seeds.
4. **Social drive in planning** (cost S). Loneliness and relationships as goals (visit a friend, eat together, teach a
   skill: copy `know` entries between people who talk), so work and social life trade off by value, not by a threshold.
5. **Smaller walls** (cost S). Welzl's minimum enclosing circle or a convex-hull wall around the footprint, gates where
   paths cross; measure pieces per protected hut.
6. **Hunting tactics** (cost M). Approach from downwind / behind, two hunters, traps; today "it got away" is the main
   remaining failure.
7. **Long-term personal goals** (cost M). From memory and level: "become the best hunter", "build my own house", "start a
   family", scored like drives and kept across days (`Profile.goals` exists).
8. **Flow fields for many agents** (cost M). One field per popular target (water, camp, store) per map instead of one A*
   per agent; needed for hordes and 100+ people.
9. **Prompt the LLM with know-how** (cost S). Add `Colony.describe(i)` to `Planner.describe`, so chats can say "I'm good at
   chopping, hunting never works for me".
10. **Evolving temperaments** (cost L). Stronger selection on traits through survival and children, measured over
    generations.
