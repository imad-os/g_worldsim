import { icon } from './util.js';

/** The "?" guides: one per card / setting. Short, plain words. */
export const HELP: Record<string, [string, string]> = {
  dashboard: ['Dashboard', 'What is going on right now. The tiles, charts and the live map refresh by themselves. Choose what this page shows in Settings > Dashboard.'],
  kpiTime: ['Game time', 'The world has its own clock. At speed x1 one real minute is 10 game minutes. Change the speed or pause on the World page.'],
  kpiPeople: ['People', 'People alive now (children are under 16). Couples can have babies when they are fed and fewer than the population limit are alive. Nobody new arrives: the town grows only by births.'],
  kpiPlayers: ['Players', 'TVs paired to this world. Each player has a character that lives in the world all the time: asleep where they left it when the TV is off.'],
  kpiZombies: ['Zombies', 'Zombies walking now. At 21:00 the number you set comes out and they crumble at dawn. The ones you spawn yourself stay until killed.'],
  kpiAnimals: ['Animals', 'Rabbits, deer, boars, wolves and bears. Many in the woods, few in town. People and players hunt them for meat, leather and claws.'],
  kpiDeaths: ['Births and deaths', 'Everyone who ever lived is kept, so family trees stay complete. See the People page, Dead tab.'],
  kpiServer: ['Server', 'Ticks per second should stay at 20. If the PC is too slow the world runs slower than the speed you set. CPU and RAM are the server process on your PC.'],
  kpiAi: ['AI brain', 'The model that plans for people and answers chats. Requests per hour are limited so the world never waits for it.'],
  liveMap: ['Live map', 'Everything on the map, refreshed every few seconds. Blue = people, gold = players (dim when away), red = zombies, brown = animals, orange = fires, green ring = the camp, purple = roads out. Tap a person to open them.'],
  needsChart: ['How people are', 'Average of everyone alive, one point a minute. Higher is better (food, water, rest are shown as how fine they are). The history starts again when the server restarts.'],
  popChart: ['Population', 'People alive, zombies and animals over time, one point a minute.'],
  acts: ['What people are doing', 'Everyone alive, by what they are doing right now.'],
  alerts: ['Needs your attention', 'TVs waiting for a code, people starving or hurt, the AI failing, the world paused or the internet link down.'],
  feed: ['Latest events', 'The newest things that happened. The Events page has all of them with filters.'],
  mapsTable: ['Maps', 'Each map: who is there, zombies and animals, the camp (where the first fire or hut went up), huts (and their doors), fires burning, the leader (chosen by courage, mind, kindness, strength and level: they hand out the work), the wall round the camp (pieces up / all) and the camp store.'],
  people: ['People', 'Everyone alive, and the dead too (their family stays known). Tap someone for their page: needs, mind, talk, orders, family, rules and what happened to them.'],
  person: ['Person', 'One person. Talk to them as if you were there, give orders they must obey, edit their needs and traits, see their memory and plans (from the AI).'],
  pMind: ['Mind', 'Filled by the AI brain: mood, what they want to do now and why, and what they remember. Empty while the AI is off.'],
  pTalk: ['Talk', 'You talk as the owner. They answer (with the AI, or built-in lines without it) and may do what you ask: "come to imad", "build a hut", "go and find a wife".'],
  pOrder: ['Orders', 'An order is obeyed, not just suggested. Only being very thirsty or starving interrupts it. Work orders become a plan of steps (gather, craft, build).'],
  pEdit: ['Edit', 'Needs are a lack: 0 = fine, 100 = desperate. hp is health (0 = dead). Traits shape how they act: strength, speed, bravery, sociability...'],
  pFamily: ['Family', 'Parents, partner and children. Two single adults who talk a lot may become partners.'],
  pRules: ['Their rules', 'Strict rules for this person only, in your own words. At most 5. The engine enforces them, and they are written in every AI prompt about this person.'],
  world: ['World', 'The clock, how hard life is, ageing, the population limit, travel between maps, supply drops and saving.'],
  speed: ['Speed', 'How fast the world runs. x1 = normal (1 real minute = 10 game minutes). High speeds need a fast PC: watch the Server tiles.'],
  difficulty: ['Difficulty', 'How fast hunger, thirst and tiredness grow. 1 = normal, 0.5 = easy, 2 = hard.'],
  ageing: ['Ageing', 'How many game days make one year of age. 1 day = a whole life in a few weeks of game time, 365 = real life.'],
  maxPop: ['Population limit', 'No baby is conceived while this many people (or more) are alive.'],
  travel: ['Travel', 'While closed, people stay in Old Town and wrecked cars block the 4 roads out. Players can always travel. Opening it clears the roads.'],
  supply: ['Supply drop', 'Drops food portions on a map now, near its middle.'],
  snapshot: ['Save now', 'The world is saved by itself every few minutes. This saves it right now.'],
  zStrength: ['Zombie strength', 'Health, speed (metres per second), bite damage, how far they see you (they chase inside it) and how far they smell people (they drift towards the nearest one inside it). Saved numbers apply to every zombie that appears from now on; the second button also sets the zombies already out. Players are hurt but never killed.'],
  zombies: ['Zombies', 'Set how many come out each night, spawn some now next to someone or at a place, or remove them all.'],
  zSpawn: ['Spawn zombies', 'Next to a name (a person or a player), at a distance in metres, or at x / y on a map (empty = a random place). Spawned zombies stay until killed.'],
  animals: ['Animals by map', 'How many of each animal live on each map. Type the number you want of each, then Save: a few come (or go) every game hour, far from people. "Now" does it at once. "Built-in mix" goes back to the world\'s own numbers (woods 16, town 4).'],
  zAttack: ['Plan a zombie attack', 'Choose the day and time on the game clock, the map, how many and where they come from: next to someone (25-35 m away), from the roads at the edge of the map, around the camp, or anywhere. "Every day" repeats it. They stay until killed unless you untick it. "Attack now" sends them at once.'],
  animalTable: ['Animal guide', 'Health, speed, how they react and what a kill gives. Fire and lamps keep the dangerous ones away.'],
  crafting: ['Crafting', 'Pick a category, put in the exact ingredients: the same ingredients make different things in different categories (1 wood + 1 ore = a sword in Weapons, a door in Furniture). People craft by themselves too.'],
  stores: ['Camp stores', 'What people put in the crate at each camp.'],
  holdings: ['Who has what', 'What each person carries in their bag.'],
  rules: ['Strict rules', 'Your orders that are never broken, in your own words (any language): "never talk to Jade", "never leave the town". At most 5 for everyone and 5 per person. The AI reads each one once to understand it; then the engine enforces it.'],
  ai: ['AI brain', 'One brain = a type, an address, a model and an API key if it needs one. Off = the built-in brain only. Gemini uses the brain\'s key, else GEMINI_API_KEYS from the server .env. Ollama = your own models at an address the server PC can reach. OpenAI-compatible = OpenAI, OpenRouter, Groq, LM Studio, vLLM... "List models" and "Test" try what is in the form without changing the brain in use.'],
  brains: ['Saved brains', 'Keep several AI set-ups and switch with "Use": the people think with the brain in use from their next request. Keys stay on the server: this page only shows their last 4 characters. Each brain shows its requests and errors in the last 24 hours, 7 days and since it was added (live requests only, not Test). "Set as fallback" picks the brain that takes over for 30 minutes when the brain in use fails 3 requests in a row; after that the brain in use is tried again.'],
  objectives: ['Objectives', 'What a person is working on, step by step, with a progress bar: their own goals (a fire, a hut, food...), your orders and strict rules ("you must get married"), and what players ask. Finishing one gives points: 10 + 2 per step for their own, 25 + 5 per step for an order. Every level (50, 200, 450 points...) makes them a little stronger, braver and smarter. A finished order also makes them proud, less lonely and heals them a little.'],
  aiKey: ['API keys', 'Paste a key and press Add key; add as many as you like (up to 20). They take turns: one key per request, and when Google says one is busy or over its quota the next one is tried. Saved keys are never shown again, only their last 4 characters; ✕ removes one. Gemini with no key here uses the keys in the server .env (GEMINI_API_KEYS=k1,k2), also taking turns. Your own Ollama needs no key.'],
  aiUrl: ['Address', 'Ollama: the base address, without /api, e.g. http://192.168.1.20:11434. OpenAI-compatible: the address ending in /v1, e.g. https://api.openai.com/v1, https://openrouter.ai/api/v1, https://api.groq.com/openai/v1. It must work from the PC that runs the server (127.0.0.1 = that PC).'],
  aiModel: ['Model', 'A model name from "List models", e.g. qwen3:1.7b. Empty = the smallest installed model, the fastest.'],
  planner: ['Planner', 'Every few game hours each person gets a plan from the AI: what to do, with whom, why, and what to remember. One request plans for several people of the same map.'],
  aiLog: ['Requests and answers', 'The last requests sent to the AI and what it answered, with the time it took. Useful when people act strangely.'],
  players: ['Players and TVs', 'A TV that opens the World app joins by itself under its My PC username (a name already taken gets "(2)"). Turn "TVs join by themselves" off to approve each TV here with a 6-digit code instead. "Sees thoughts" shows what people think over their heads on that TV. Remove = that TV has to join again.'],
  autoJoin: ['TVs join by themselves', 'On: a TV that opens the World app gets its own character at once, named after the My PC user on that TV. Players never sign in to this panel. Off: the TV shows a 6-digit code and waits until you approve it here (or a signed-in person links it on My character).'],
  pairings: ['TVs waiting', 'Codes shown on TVs right now. Approve with a name, or deny.'],
  events: ['Events', 'Everything that happened, newest first. Filter by kind or search for a name.'],
  replays: ['Past events', 'Zombie attacks recorded as replays (the last 20). Watch them on the TV: game menu > Past events.'],
  agent: ['AI agent', 'Ask in words for something the panel has no button for: change a person, give things, add a new animal... The agent reads the code and looks at the world by itself, then shows you the code it wants to run on the live server, or the changes it wants to make to the source files. Nothing changes until you press Run / Apply. Only the owner (or the admin token) can use it.'],
  agentAsk: ['Asking', 'Write what you want, Ctrl+Enter or Ask. The grey "Looked" lines are what the agent read on its own (files, a search, the database, a copy of the world): looking never changes anything. Code needs a strong model: pick a Gemini or OpenAI-compatible brain here if you have one; a small local model often writes wrong code. API keys and tokens are never shown to the model.'],
  agentRun: ['Before you run', 'Read what it will do. Run = the code runs inside the server right now; first the world is saved and the whole database copied (Server > Backups). Apply = the source files change and the server rebuilds; restart to use the new code (a failed build puts the files back). Changes made here live only on your PC: tell Claude in the project to bring them into GitHub, or the next update from GitHub may refuse to pull.'],
  agentAudit: ['History', 'Every proposal, who ran it, the code and what came out (kept in the server database). Undo on a run restores the database copy made just before it (everything since is lost) and restarts; Undo on file changes puts the old files back and rebuilds.'],
  serverCtl: ['Controls', 'Restart = save, stop and start again (about 10 s, TVs reconnect by themselves). Rebuild = compile the code on the PC again. Update = get the latest code from GitHub (git pull), rebuild and restart. Only the owner (or the admin token).'],
  backups: ['Backups', 'Full copies of the world database, made before every agent run and when you press Make one. Restore = the server restarts with that copy (the current database is kept as a "before-restore" copy). The last 15 are kept.'],
  serverLog: ['Server log', 'What the server wrote lately (data/server.log). Keys and tokens are hidden.'],
  server: ['Server', 'The server process on your PC: speed of the simulation, CPU and RAM, the internet link and saving.'],
  tunnel: ['Internet link', 'How TVs and this panel reach your PC from outside. ngrok keeps the same address. Switching restarts the link (a few seconds offline).'],
  settings: ['Settings', 'Settings of this panel on this device only: the server address, what the dashboard shows, the look.'],
  me: ['My character', 'Your own person in the world. Join once with a name: you then live there like everyone else (needs, work, talk, fights). Away = asleep where you left them.'],
  account: ['Your account', 'You signed in with Google or your email. Your role decides what you can do: owner and admins get every page and the admin tools in the game; players get this page only and play like any person of the world.'],
  myTv: ['Your TV', 'Install World from My PC\'s App Store on the TV and open it: it shows a 6-digit code. Type it here and that TV plays as your character. Linking another TV replaces the first one.'],
  join: ['Join the world', '2 to 20 letters, digits or spaces, not a name already used by a person or another player. You start in Old Town.'],
  users: ['Users & roles', 'Everyone who signed in to this panel. Only the owner changes roles; it counts from that person\'s next sign-in. Roles are kept in your Firebase project (roles collection), protected by its rules.'],
  roles: ['Roles', 'Owner: everything, and gives roles. Admin: every page and the in-game admin tools. Player: joins the world as a person and links their own TV.'],
  address: ['Server address', 'The public link of your world server (the same one the TV app uses), e.g. https://something.ngrok-free.dev. This panel can be opened from GitHub and connects there.'],
  token: ['Admin token', 'ADMIN_TOKEN in the server .env file on your PC: a way in for you even without Google or email. This device remembers it until you sign out.'],
};

export function help(key: string): string {
  return HELP[key] ? `<button class="hq" data-help="${key}" aria-label="Help: ${HELP[key]![0]}" title="What is this?">${icon('help')}</button>` : '';
}

let open: HTMLElement | null = null;
export function showHelp(btn: HTMLElement): void {
  const key = btn.dataset.help!, h = HELP[key];
  closeHelp();
  if (!h) return;
  const pop = document.createElement('div');
  pop.className = 'pop';
  pop.setAttribute('role', 'dialog');
  pop.innerHTML = `<div class="pop-t">${h[0]}</div><div class="pop-b">${h[1]}</div>`;
  document.body.appendChild(pop);
  const r = btn.getBoundingClientRect(), pw = Math.min(320, innerWidth - 24);
  pop.style.width = pw + 'px';
  let x = r.left + r.width / 2 - pw / 2;
  x = Math.max(12, Math.min(innerWidth - pw - 12, x));
  const below = r.bottom + 8 + pop.offsetHeight < innerHeight;
  pop.style.left = x + 'px';
  pop.style.top = (below ? r.bottom + 8 : Math.max(8, r.top - 8 - pop.offsetHeight)) + window.scrollY + 'px';
  open = pop;
}
export function closeHelp(): void { open?.remove(); open = null; }
