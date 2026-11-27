# How the people think

The design of the AI that drives the people of the world (not the NPCs, who are fixed quest givers). Written 2026-11-27
after the "aware" round (imad: "people must be as smart as they can get, like a normal player... when I play I feel they
are alive, not some random stuff"). `ARCHITECTURE.md` has the details of each older layer, `EXPERIMENTS.md` the numbers.

Everything below runs on the server, every tick, with no AI model: it is deterministic for a seed, costs nothing per person
and works when the model is off. The model (Ollama / Gemini / OpenAI-compatible, the brain chosen in the panel) sits on
top for words: plans every few game hours, and every conversation with a player. Nothing here is drawn on the TV: the TV
only receives positions and acts as before, so the 60 fps budget on the TV is untouched.

## The layers, from the fastest to the slowest

```
 every think (0.1-2 s)     Brain.decide (sim/brain.ts)
                           little ones > danger (fight / run / rally) > own children > hunt > orders and jobs > the cold
                           > carry on > choose by score: drink, eat, forage, sleep, talk, wander, rest (the fire at evening), travel
                               ▲ awareness: fresh dangers and game (sim/aware.ts), fear of places (memory, lore), the day's rhythm
 every second              Tasks (sim/tasks.ts): step plans with proof that each step really happened
                           Aware: each person looks round (every 5 s, 18 m) and notes what moves; Talk: plans agreed last night start
 every talk                Talk (sim/talk.ts): what one knows and the other does not, by value; help; joint plans
 every 20 game min / hour  Colony (sim/colony.ts): camp drives -> goals -> who fits best -> GOAP plan; Purpose: dreams, pastimes
                           leaders, night watch, clans, family care, homes, influence, lore
 every 3 game hours        Planner (ai/planner.ts): the model writes wishes, goals and memory for up to 5 people at a time
 when a player speaks      Planner.chat: the model answers in character, may take an order or a plan of steps
```

## What a person knows

| knowledge | where | how it gets there | how long |
|---|---|---|---|
| needs, health, what they carry | `Entities`, `Survival.inv` | the body | now |
| what moves around them | `Aware.sights` (6 per person) | own eyes every 5 s within 18 m; a bite or shout nearby; told in a talk | zombies 3 h or dawn, beasts 6-8 h, horses 12 h |
| places (water, wood, stone, ore, food, game, sleep, danger) | `Mind.mem.p` (4 of each) | where they drank, cut, dug, found, got hurt; explorations; told in a talk | while useful |
| their own life | `Mind.mem` short 10 / long 100 | events, by importance, Ebbinghaus-style forgetting | for life when it mattered |
| news (deaths, births, weddings, leaders, wars, quarrels, tales) | `Mind.heard` (10) | witnesses and those concerned first hand; everyone else hears it from someone | days |
| how to do things | `Mind.know` + camp culture | every planned step's outcome; tips from someone better at it | grows |
| what the people as a whole fear | `Lore` | deaths and bites mark places, beasts, maps, people; children learn it by age and from adults who talk to them | fades over ~10 days |
| feelings | `Mind.rel` | talks, gifts, help, fights | slow |
| plans agreed | `Talk.plans`, `Mind.task` | agreed in a talk (now, or by the fire for the next morning) | until done |

Everything a person knows goes into their prompt, so the model's words match what they really know: "Around you lately:
2 zombies 30 m north (Sami told you, 20 min ago)", "News you know: Lina had a baby: Nour (heard)", "Places you know: water
20 m east", "You agreed with Sami to hunt together tomorrow morning".

## The day's rhythm (new)

People had a body clock with no day in it: tired grows 5.5 an hour awake and sleep takes 13 off an hour, so they went to
bed at 19-20 h, woke at 2-3 am fully rested and stood in the dark until dawn (a third of all their waking time).

- **Evenings** (19:00 to their bedtime): resting scores 0.75, and resting means sitting by the camp's burning fire (a free
  spot round it, else at home). Sitting with others keeps loneliness down; every minute or so one turns to a neighbour and
  they talk. Before bed whoever sees the fire burning low puts a log on (from the bag or the camp's store).
- **Bedtime** 21:30-22:30 and **waking** 5:30-6:30, by person (early birds and night owls).
- **Sleeping in**: rested in the night, they sleep on until their waking hour. It is encouragement, not a lock (imad: "not
  hard programmed, except for urgency"): thirst over 90, hunger over 92, a zombie or beast close by, an alarm, a child's
  carer walking off, the cold (freezing and under half health: up and moving) still wake them at once.

## Awareness (new, `sim/aware.ts`)

Before, people knew only what was within reach right now (the nearest zombie within 10-16 m) or everything at once (the
count of zombies on the map). Now each person keeps a few **sightings**: kind, place, how many, when, and whether they saw
it themselves (hop 0), were told by the one who saw it (hop 1) or heard it as a rumour (hop 2+, a few metres vaguer per
retelling). What changes:

- wandering and foraging keep away from a fresh danger seen or told of (25 m, longer for what they saw themselves)
- someone told of a danger close by in the last half hour is on the alert (a wider watch, like after an alarm)
- a hunter with no game in sight walks to the freshest game they know of, instead of a random search
- every prompt says what is around them lately

Costs: each awake person looks round once every 5 s through the map's spatial grid (one query of 18 m), about 0.02 ms a
person a second on the cloud's CPU. Memory only, not in snapshots.

## Conversations that carry knowledge (new, `sim/talk.ts`)

When two people stop to talk (the `talk` event, from a pastime visit, the evening fire, loneliness, a planner wish), up to
4 turns are said. Each turn the speaker tells the listener **the most useful thing the listener does not know**, scored
for that listener:

| what | value (higher first) | not told to |
|---|---|---|
| a danger they saw (zombies 7, wolf / bear / boar 6) | fades with age; half for another map | (everyone is warned, even rivals) |
| game (3, +3 for a hunter) and wild horses (2, +2 for the brave) | fades with age | an enemy clan |
| a place (water / wood / stone 2, ore / game 3, a trouble spot 5) | +3 water when thirsty, +2 food when hungry, +3 what their current step needs | an enemy clan (trouble spots yes) |
| news | its importance (death 8, war 7, birth 6, wedding 5 ...) minus hops, +2 when it is about someone they know | the person it is about |
| a tip | 3 + their failures: someone with 3+ successes and 75 %+ at a job tells one who keeps failing (`Colony.teach`: the listener counts part of the teller's experience, so their plans change) | an enemy |
| a lesson of the people's lore, to a child of 3-12 | 3.5 (`Lore.teach`: the child knows the lore sooner) | |

Nothing is said to someone the speaker dislikes (feelings -3 or worse). After the turns:

- **Help**: a kind speaker (empathy 0.35+) with food to spare gives one to a starving listener (hunger 55+, nothing in hand).
- **A joint plan** (`pact`): two free adults (no task, or only a visit / walk) by day may agree to do something together:
  a hunt (game known about, or a hunter's dream; both brave enough; the leader is the one who knows where the game is) or
  fetching wood for a camp short of it. Both get the task; the follower walks with the leader first. Agreed by the fire in
  the evening, it is a plan for the next morning: it starts between 7 and 10 when both are up and free ("as we agreed").
  The more they like each other, the likelier; at most one plan per person per 4 game hours.

The listener's knowledge really changes (sightings, places, news, know-how, lore), so what they do next changes. The lines
are written from what was passed ("I saw 2 zombies about 40 m north-east of here, not an hour ago." - "I will keep away
from there.") and go to the person's Conversations tab in the panel. Only when nothing worth saying was found does the old
built-in small talk fill in. Talks between people never call the model (imad's choice: the AI budget stays for plans and
for players' chats; a player talking to someone always gets the model, and its prompt carries all of the above).

Events for the panel's Thoughts screen: `learned` { from, to, kind: danger | game | place | news | rumour | skill | lore |
help | plan, what, text, map } per piece passed, `pact` { a, b, what, text, map, tomorrow?, kept? } per plan.

## Why now (new, `sim/why.ts`)

`World.why(i)` returns `{ src, text, at }` for what is not plain from a task, an order or a need: the evening by the fire
(social), a talk and whether it passed knowledge (social), sleeping in at night (need), keeping away from a danger they
know of (danger), the alert (danger), going after game they were told about (own), a rule keeping them out of their home
(rule). The brain notes a 1-byte code when it decides for such a reason (`Brain.why`), the words are made only when asked.
The Thoughts screen (ops/thoughts.ts, another module) reads it.

## Rules about home (new)

"never stay at home" used to compile to nothing the engine could act on. Rules now know the word `home` (en / fr / es / ar:
"stay at home", "stay inside", "rester à la maison", "quédate en casa", "ابق في البيت"): a person under it rests by the
fire, or out in the open, instead of at home, and the Thoughts screen counts each time the rule held them back. Sleeping at
night still goes home (safety first; tell me if it should not).

## Performance

All of this is server-side. Cloud container, 8 people, 4 game days: 0.12-0.13 ms a tick before and after (E13). The talk
work happens once per talk (a few dozen a day), the looks once every 5 s per person on the spatial grid. Snapshots grow
by the news lists (about 1.5 kB per person). The TV gets nothing new.

## Tuning knobs

| what | where |
|---|---|
| bedtime / waking hours | `Brain.bedtime` / `Brain.wakeAt` (sim/brain.ts) |
| evening rest score 0.75 | `Brain.choose` (`sRest`) |
| how far and how often people look | `LOOK_R` 18 m, `LOOK_EVERY` 5 passes (sim/aware.ts) |
| how long sightings last | `LIFE` (sim/aware.ts) |
| turns per talk, news kept, time between plans | `ROUNDS` 4, `HEARD` 10, `PACT_EVERY` 4 h (sim/talk.ts) |
| values of what is told | `PLACE_V` and the scores in `Talk.best` |
| switch it all off | `World` option `ai: { aware: false }` (the experiments' arms) |

## Ideas for next rounds

1. Teamwork on big jobs: two building one hut (one fetches, one builds), a bucket chain to the store, a hunting party of
   three closing from two sides on a bear.
2. Asking for help: someone who failed a job twice asks the one who knows it best (today the tip comes only by chance).
3. Lies and secrets: low-empathy rivals hiding a good place, or exaggerating (imad chose truth for now).
4. Morning plans for everyone: at the fire, the leader hands out tomorrow's work, so the morning starts with purpose.
5. Moods that last a day (grief after a death, joy after a birth) changing work and talk.
