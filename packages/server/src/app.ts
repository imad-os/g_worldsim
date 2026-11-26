import { animalKills } from './sim/kills.js';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Kind, EFlag, ANIMAL_NAMES, RECIPES_ALL, PLACEABLE, CONFIRM, QUESTS, NPCS, WEATHERS, type AdminCmd, type ServerStats, type ClockInfo } from '@worldsim/protocol';
import type { Config, Secrets } from './config.js';
import { Logger } from './log.js';
import { Loop } from './loop.js';
import { Monitor } from './monitor.js';
import { Db } from './persist/db.js';
import { Snapshots, EventLog } from './persist/snapshot.js';
import { CloudSync } from './persist/cloud.js';
import { Players } from './persist/players.js';
import { Accounts } from './persist/accounts.js';
import { FirebaseAuth } from './auth/firebase.js';
import { existsSync, readFileSync, writeFileSync, rmSync } from 'node:fs';
import { loadScenario } from './sim/scenario.js';
import { World, type WorldEvent } from './sim/world.js';
import { PLACE_REACH } from './sim/survival.js';
import { NetServer } from './net/server.js';
import { TunnelManager } from './tunnel.js';
import type { AttackPlan } from './sim/zombies.js';
import { Ai, keyList, type AiSettings, type Provider } from './ai/llm.js';
import { Brains } from './ai/brains.js';
import { BrainStats, Failover } from './ai/brainstats.js';
import { Planner, type PlannerConfig } from './ai/planner.js';
import { ageOf, levelOf, TRAIT_KEYS, SEX_WEEK_MS, type Profile } from './sim/people.js';
import { stageOf } from './sim/family.js';
import { tameLevel } from './sim/horses.js';
import { NO_MAP } from './sim/entities.js';
import { KEEP, summary, type ReplaySummary } from './sim/replays.js';
import { pvpDamage } from './sim/clans.js';
import { compileRule, MAX_RULES, Rules, type Rule } from './sim/rules.js';
import { Control } from './ops/control.js';
import { Agent } from './ops/agent.js';
import { Analysis, LOG_TYPES, DEFAULT_TYPES } from './ops/analysis.js';
import { ErrorLog } from './ops/errors.js';
import { Chats } from './ai/chatroom.js';
import { MapView } from './ops/mapview.js';
import { Waypoints } from './ops/waypoints.js';
import { execFileSync } from 'node:child_process';

const ROOT = resolve(fileURLToPath(import.meta.url), '../../../..');
const ARROW_SPEED = 100; // m/s: a player's bow arrow (imad 2026-11-25: "make the arrow faster"; other projectiles use the scenario's speed)
/** The Firebase project of the panel's sign-in: docs/panel/firebase.json (the public web config, the same file the panel reads). */
function firebaseProject(): string {
  const f = join(ROOT, 'docs', 'panel', 'firebase.json');
  try { return existsSync(f) ? String((JSON.parse(readFileSync(f, 'utf8')) as { projectId?: string }).projectId ?? '') : ''; } catch { return ''; }
}
/** Panel commands that only read: never written to the timeline. */
/** Tile colours / names / solid, indexed by tile id, for the panel's map and tools. */
function byId(tiles: { id: number; name: string; color: number; solid?: boolean }[]): { colors: number[]; names: string[]; solid: boolean[] } {
  const n = Math.max(0, ...tiles.map((t) => t.id)) + 1, colors = new Array<number>(n).fill(0), names = new Array<string>(n).fill(''), solid = new Array<boolean>(n).fill(false);
  for (const t of tiles) { colors[t.id] = t.color; names[t.id] = t.name; solid[t.id] = !!t.solid; }
  return { colors, names, solid };
}
const READS = new Set<string>(['errors', 'analysis', 'analysisPreview', 'analysisAsk', 'coder', 'coderAudit', 'serverInfo', 'serverLog', 'backups', 'brains', 'brainModels', 'brainTest', 'accounts', 'stats', 'pairings', 'players', 'tunnel', 'ai', 'aiModels', 'agents', 'agent', 'overview', 'history', 'replays', 'mapTiles', 'huts', 'lore', 'live', 'people', 'horses', 'timeline', 'aiLog', 'clans', 'quests', 'chats', 'chatRead']);
/** Commands that only read when they carry nothing but `cmd` (and `id`). */
const READ_BARE = new Set<string>(['weather', 'autoJoin', 'rules', 'zombies', 'life', 'planner', 'animals', 'zombieAttack']);
const LOGGED = new Set(['kin', 'clan', 'clanSplit', 'clanLeave', 'clanLeader', 'clanEnd', 'duel', 'duelEnd', 'guard', 'grown', 'reward', 'levelup', 'joined', 'replay', 'ruleSet', 'rule', 'spawn', 'remove', 'death', 'travel', 'arrive', 'destroyed', 'admin', 'talk', 'supply', 'birth', 'partner', 'say', 'pregnant',
  'build', 'craft', 'hunt', 'land', 'store', 'loot', 'zombie', 'zombies', 'fight', 'heal', 'repair', 'task', 'camp', 'teleport', 'give',
  'quest', 'questDone', 'clanJoin', 'clanSwitch', 'clanVote', 'clanVoteStart', 'clanOrder', 'clanRebel', 'alarm', 'destroy', 'reset', 'door']);

/** Warnings that only say what happened (the server log keeps them): not problems for the error log. */
const NOT_PROBLEMS = new Set(['restart asked', 'restarting', 'agent action', 'restore scheduled for the next start', 'database restored from a backup']);
/** Where a log line comes from, by its words (the error log's Source filter). */
function sourceOf(msg: string): string {
  if (/^(ai |planner|brain|fallback|saved brain)/.test(msg)) return 'ai';
  if (msg.startsWith('tunnel')) return 'tunnel';
  if (msg.startsWith('cloud')) return 'cloud';
  if (/^(hello|auth|message|firebase|unknown message)/.test(msg)) return 'net';
  if (/^(snapshot|event flush|restore)/.test(msg)) return 'save';
  return 'log';
}

/** The whole server: world + loop + persistence + network. Used by main.ts and by the tests. */
/** Kill counts for the panel: animals (all kinds), zombies, people, duels won. */
const killsOf = (p: Profile | undefined) => ({ animals: animalKills(p?.kills), zombies: p?.kills?.zombies ?? 0, people: p?.kills?.people ?? 0, beaten: p?.kills?.beaten ?? 0 });

export class App {
  readonly log: Logger;
  db!: Db;
  world!: World;
  loop!: Loop;
  net!: NetServer;
  snaps!: Snapshots;
  events!: EventLog;
  cloud!: CloudSync;
  players!: Players;
  accounts!: Accounts;
  auth!: FirebaseAuth;
  /** Tests: a fake Google / Firestore for the sign-in checks. */
  authFetch?: ConstructorParameters<typeof FirebaseAuth>[1];
  tunnel!: TunnelManager;
  ai!: Ai;
  brains!: Brains;
  brainStats!: BrainStats;
  /** The brain in use failing 3 calls in a row = the fallback brain for 30 min. */
  failover = new Failover();
  planner!: Planner;
  chats!: Chats;
  readonly monitor = new Monitor();
  lastSnapshotAt = 0;
  private timers: NodeJS.Timeout[] = [];
  private stopping = false;
  onStopRequest: () => void = () => {};
  /** Stop cleanly and start again (main.ts starts a new server process). */
  onRestartRequest: () => void = () => {};
  control!: Control;
  agent!: Agent;
  analysis!: Analysis;
  /** Every warning / error the server meets (failed panel commands, its own log, crashes), kept in SQLite: panel page Errors. */
  readonly errors = new ErrorLog();
  /** The commit this process started from and the admin commands it knows (sent to the panel: an older server is told apart). */
  readonly build = App.buildInfo();

  constructor(readonly cfg: Config, readonly secrets: Secrets, log?: Logger) {
    this.log = log ?? new Logger(cfg.logLevel, join(resolve(cfg.dataDir), 'server.log'));
    this.log.onProblem = (level, msg, data) => {
      const { source, stack, err, ...rest } = (data ?? {}) as Record<string, unknown>;
      const text = err !== undefined ? `${msg}: ${String(err).split('\n')[0]}` : msg;
      const st = typeof stack === 'string' ? stack : typeof err === 'string' && err.includes('\n    at ') ? err : undefined;
      if (NOT_PROBLEMS.has(msg)) return;
      this.errors.add(level, typeof source === 'string' ? source : sourceOf(msg), text, Object.keys(rest).length ? rest : undefined, st);
    };
  }

  /** The git commit at start (the code running now, whatever was pulled since) and the commands of `runAdmin`. */
  static buildInfo(): { commit: string; subject: string; started: number; cmds: string[] } {
    let commit = '', subject = '';
    try {
      commit = execFileSync('git', ['rev-parse', '--short', 'HEAD'], { cwd: ROOT, timeout: 5000, stdio: ['ignore', 'pipe', 'ignore'], windowsHide: true }).toString().trim();
      subject = execFileSync('git', ['log', '-1', '--format=%s'], { cwd: ROOT, timeout: 5000, stdio: ['ignore', 'pipe', 'ignore'], windowsHide: true }).toString().trim().slice(0, 160);
    } catch { /* no git */ }
    const src = App.prototype.runAdmin.toString() + App.prototype.playerCmd.toString(); // a signed-in person's own ones too
    const cmds = [...new Set([...src.matchAll(/case '([A-Za-z]+)':/g)].map((m) => m[1]!))].sort();
    return { commit, subject, started: Date.now(), cmds };
  }

  async start(): Promise<void> {
    const c = this.cfg;
    const dataDir = resolve(c.dataDir);
    const dbFile = join(dataDir, `${c.worldId}.sqlite`);
    Control.applyPendingRestore(dataDir, dbFile, this.log); // a backup chosen in the panel replaces the database (before it opens)
    this.db = new Db(dbFile);
    this.errors.attach(this.db);
    this.errors.onAdd = (r) => this.net?.notifyAdmins('error', { id: r.id, level: r.level, source: r.source, msg: r.msg, n: r.n, last: r.last });
    this.control = new Control(ROOT, dataDir, dbFile, () => this.db, this.log);
    this.snaps = new Snapshots(this.db, c.snapshotsKept);
    this.events = new EventLog(this.db);
    this.players = new Players(this.db, this.secrets.viewers);
    this.accounts = new Accounts(this.db);
    // A TV can't take an owner's / admin's character name (in-game tools follow the name).
    this.players.reserved = (n) => this.accounts.isStaff(n);
    this.auth = new FirebaseAuth(c.auth.projectId === 'none' ? '' : c.auth.projectId || firebaseProject(), this.authFetch); // 'none' = sign-in off
    const sc = loadScenario(resolve(ROOT, c.scenariosDir, c.scenario));
    const seed = this.db.getMeta('seed') ?? String(sc.seed);
    this.world = new World(sc, { tickRate: c.tickRate, clockScale: c.clockScale, capacity: c.capacity, seed });
    this.cloud = new CloudSync(this.db, {
      enabled: c.cloud.enabled, projectId: c.cloud.projectId, worldId: c.worldId, everySec: c.cloud.everySec,
      maxWritesPerDay: c.cloud.maxWritesPerDay, credentials: this.secrets.firebase,
    }, this.log);

    const loadedSnap = this.snaps.loadLatest(this.world, (id, err) => this.log.warn('snapshot skipped', { id, err: String(err) }));
    const loaded = loadedSnap;
    if (loaded) {
      // Characters belong to connected people: nobody is connected after a restart.
      // Players' characters with a person profile (sex, partner, children...) stay; older ones are made again by name.
      for (let i = 0; i < this.world.e.hi; i++) if (this.world.e.kind[i] === Kind.Player && !this.world.charName(i)) this.world.remove(i, 'restart');
      this.log.info('resumed from snapshot', { id: loaded.id, tick: loaded.tick, agents: this.world.e.countKind(Kind.Agent) });
    } else if (await this.cloud.restoreInto(this.world).catch((err) => { this.log.warn('cloud restore failed', { err: String(err) }); return false; })) {
      this.log.info('restored from the cloud backup', { tick: this.world.tick });
    } else {
      this.db.setMeta('seed', seed);
      this.db.setMeta('scenario', sc.id);
      this.world.populate();
      this.log.info('new world', { scenario: sc.id, seed, agents: this.world.e.countKind(Kind.Agent) });
    }
    // Owner settings kept in the database: travel between maps, and the population size of the scenario.
    this.world.travelOpen = this.db.getMeta('travel_open') === '1';
    { const z = this.db.getMeta('zombie_cfg'); if (z) { try { this.world.zombies.setCfg(JSON.parse(z) as never); } catch { /* defaults */ } } }
    { const z = this.db.getMeta('zombies_night'); if (z !== null && z !== undefined) this.world.zombies.perNight = Number(z) || 0; }
    { const z = this.db.getMeta('zombie_plans'); if (z) { try { this.world.zombies.plans = JSON.parse(z) as AttackPlan[]; } catch { /* broken: none */ } } }
    { const v = this.db.getMeta('pvp_on'); if (v) { try { this.pvp = new Set(JSON.parse(v) as string[]); } catch { /* none */ } } }
    this.world.clans.pvpOn = (i) => this.pvp.has(this.world.survival.playerName(i).toLowerCase());
    this.world.zombies.onPlans = () => this.db.setMeta('zombie_plans', JSON.stringify(this.world.zombies.plans));
    { const a = this.db.getMeta('animal_want'); if (a) { try { for (const [k, v] of JSON.parse(a) as [string, number[]][]) this.world.animals.want.set(k, v); } catch { /* broken: built-in mix */ } } }
    this.world.land.setup(); // the town's ring of trees, its 4 roads out (wrecks while travel is closed), rocks
    this.world.quests.setup(); // the town's teachers (NPCs), made again at every start
    const want = sc.agents.count;
    if (this.db.getMeta('agents_count') !== String(want) || !this.world.travelOpen) {
      const r = this.world.fitPopulation(this.db.getMeta('agents_count') !== String(want) ? want : 1e9);
      this.db.setMeta('agents_count', String(want));
      if (r.removed || r.moved) this.log.info('population fitted', { ...r, agents: this.world.e.countKind(Kind.Agent) });
    }
    const diff = Number(this.db.getMeta('difficulty'));
    if (diff > 0) this.world.brain.life.difficulty = diff;
    // How fast people age (milestone 7). Ages saved before this setting were counted in real 365-day years.
    const yd = Number(this.db.getMeta('year_days'));
    if (yd > 0) this.world.brain.life.yearDays = yd;
    else if (loaded) this.world.life.rescale(365 * 86400);
    this.db.setMeta('year_days', String(this.world.brain.life.yearDays));
    const maxPop = Number(this.db.getMeta('max_population'));
    if (maxPop > 0) this.world.brain.life.maxPopulation = maxPop;
    let savedAi = this.db.getMeta('ai') ? (JSON.parse(this.db.getMeta('ai')!) as Partial<AiSettings>) : undefined;
    // Owner request 2026-11-19: the default AI is now imad's Ollama server with the fastest model. Once, a world still on
    // the old defaults (off, or the local address) takes the new ones; choices made after that are kept.
    if (this.db.getMeta('ai_defaults') !== '2') {
      if (savedAi && (savedAi.provider === 'none' || savedAi.ollamaUrl === 'http://127.0.0.1:11434')) savedAi = undefined;
      else if (savedAi?.provider === 'ollama') savedAi = { ...savedAi, model: '' }; // the fastest one, picked by the server
      this.db.setMeta('ai_defaults', '2');
    }
    this.ai = new Ai(c.ai, this.aiKeys(), this.log, savedAi);
    // Saved brains (imad 2026-11-20): the AI in use becomes the first one; Gemini is offered when .env has its keys.
    this.brains = new Brains(() => this.db.getMeta('brains'), (j) => this.db.setMeta('brains', j), this.ai.settings,
      this.secrets.geminiKey ? [{ provider: 'gemini', name: 'Gemini (keys in .env)' }] : []);
    try { this.ai.apply(this.brains.settingsOf(this.brains.active)); } catch (err) { this.log.warn('saved brain refused', { err: String(err) }); }
    this.ai.tag = this.brains.active.id;
    this.brainStats = new BrainStats(() => this.db.getMeta('brain_stats'), (j) => this.db.setMeta('brain_stats', j));
    this.ai.onResult = (tag, ok, err) => this.aiResult(tag, ok, err);
    const savedPlanner = this.db.getMeta('planner');
    this.planner = new Planner(this.world, this.ai, this.log, savedPlanner ? (JSON.parse(savedPlanner) as Partial<PlannerConfig>) : undefined);
    this.world.listeners.push((ev: WorldEvent) => { if (LOGGED.has(ev.kind)) this.events.add(ev.tick, ev.gameSec, ev.kind, ev.data); });
    this.snapshot();

    const w = this.world;
    this.loop = new Loop(() => {
      const t0 = performance.now();
      w.step();
      this.monitor.recordTick(performance.now() - t0);
    }, c.tickRate, c.speed, 25, c.maxSpeed);

    this.net = new NetServer(w, {
      host: c.host, port: c.port, netHz: c.netHz, maxViewRadius: c.maxViewRadius, maxClients: c.maxClients,
      adminToken: this.secrets.adminToken, players: this.players, auth: this.auth, accounts: this.accounts,
      autoJoin: () => this.db.getMeta('auto_join') !== '0',
      staticDirs: [
        { prefix: '/panel/', dir: join(ROOT, 'docs', 'panel') }, // the same files GitHub Pages serves (main /docs)
        { prefix: '/app/', dir: join(ROOT, 'docs') },
        { prefix: '/', dir: join(ROOT, 'packages/client/www') },
      ],
    }, this.log);
    this.net.stats = () => this.stats();
    // Day / night / sleep clock speeds (World > Time): the sleep speed needs every player who is in the game asleep.
    w.playersAsleep = () => {
      let any = false;
      for (const [name, i] of this.net.characters()) {
        if (!this.net.online(name)) continue;
        if (!(w.e.flags[i]! & EFlag.Sleeping)) return false;
        any = true;
      }
      return any;
    };
    try {
      const saved = JSON.parse(this.db.getMeta('clock_mul') ?? '{}') as Record<string, unknown>;
      for (const k of ['day', 'night', 'sleep'] as const) { const v = saved[k]; if (typeof v === 'number' && v > 0 && v <= 1000) w.clockMul[k] = v; }
    } catch { /* keep x1 */ }
    w.updateClock(true);
    // Seasons and weather (sim/weather.ts): the calendar's settings are the owner's (meta), the sky itself is in the snapshot.
    // A world from before the weather starts its calendar late in spring (no sudden winter on the first start).
    if (this.db.getMeta('weather_cfg') === undefined || this.db.getMeta('weather_cfg') === null) { w.weather.startNow(); this.db.setMeta('weather_cfg', JSON.stringify(w.weather.cfg)); }
    try {
      const v = JSON.parse(this.db.getMeta('weather_cfg') ?? '{}') as Record<string, unknown>, c = w.weather.cfg;
      if (typeof v.seasonDays === 'number' && v.seasonDays > 0) c.seasonDays = v.seasonDays;
      if (typeof v.shift === 'number' && Number.isFinite(v.shift)) c.shift = v.shift;
      if (typeof v.cold === 'boolean') c.cold = v.cold;
    } catch { /* defaults */ }
    w.weather.onCfg = () => this.db.setMeta('weather_cfg', JSON.stringify(w.weather.cfg));
    this.net.clockInfo = () => this.clock();
    this.net.health = () => ({ ok: true, tick: w.tick, tps: Math.round(this.loop.ticksLastSec), paused: this.loop.paused, uptimeSec: Math.round((Date.now() - this.monitor.startedAt) / 1000) });
    this.net.admin = (cmd, who, owner) => this.adminCmd(cmd, who, owner);
    this.net.adminWelcome = () => ({ ...this.build, errors24h: this.errors.recentCount() });
    this.net.onStop = () => this.onStopRequest();
    // A player pressed A next to someone: they stop, face the player and answer.
    this.net.onTalk = (name, player, i, text) => { void this.planner.chat(i, name, text ?? null, player).catch(() => {}); };
    this.planner.players = () => this.net.characters();
    this.net.onHold = (player, i) => w.brain.listen(i, player, 60);
    // Players do what people do; the owner (and whoever they allow) sees thoughts and plans.
    this.net.onDo = (name, player, a, text) => {
      const e = w.e;
      if (a === 'replays') return { ok: true, code: 'replays', list: this.replayList() };
      if (a === 'replay') { const v = this.db.getMeta('replay:' + Number(text)); return v ? { ok: true, code: 'replay', rec: JSON.parse(v) } : { ok: false, code: 'noReplay' }; }
      if (a === 'map') return this.mapView.view(name, player, String(text ?? '')); // the TV's map: tiles + places + my marks
      if (a === 'mark') return this.mapView.mark(name, String(text ?? 'list'));
      if (a === 'compass') return e.map[player] === NO_MAP ? { ok: false, code: 'nothing' } : this.waypoints.compass(name, player); // the compass bar on top of the TV
      if (a === 'rideTo') { // on horseback, ride by yourself: '' = where to, else the road for this map's leg
        if (e.map[player] === NO_MAP) return { ok: false, code: 'nothing' };
        const id = String(text ?? '');
        return id ? this.waypoints.route(name, player, id) : { ok: true, code: 'rideDests', dests: this.waypoints.dests(name, player) };
      }
      if (a === 'roster') return { ok: true, code: 'roster', list: this.roster(name) };
      if (a === 'quests') return { ok: true, code: 'quests', list: w.quests.rows(e.id(player)) };
      if (a === 'npc') { // talk to the town teacher next to me: take / hand in a quest (the registrar also founds clans)
        const k = w.quests.nearNpc(player, 4);
        if (!k) return { ok: false, code: 'noNpc' };
        const r = w.quests.talk(player, k);
        return { ok: true, code: 'npc', talk: r, quests: w.quests.rows(e.id(player)), ...(k === 'registrar' ? { clan: w.clans.info(player) } : {}) };
      }
      if (a === 'clan') { // info / join:<id> / quit / found:<name> / vote:<id> / call / order:<words>
        const r = w.clans.playerDo(player, String(text ?? 'info'));
        if (r.ok && r.code === 'clanOrdered') { // a leader's words to the clan: each member hears them and the loyal ones obey
          const c = w.clans.clanOf(e.id(player))!;
          for (const j of w.clans.hearers(c)) void this.planner.chat(j, name, String(text).slice(6), player).catch(() => {});
        }
        return r;
      }
      if (a === 'tp') return this.isStaff(name) ? this.teleport(player, Number(text)) : { ok: false, code: 'staffOnly' }; // admin tool
      { const r = this.charDo(name, player, a, text); if (r) return r; } // my character: look, autopilot, rules, partner, child, hut
      if (e.map[player] === NO_MAP) return { ok: false, code: 'nothing' };
      const sv = w.survival;
      if (a === 'equip') return w.gear.equip(player, String(text ?? '')); // gear screen: "slot:item"
      if (a === 'upgrade') return w.gear.upgrade(player, String(text ?? '')); // "item:lv" | "item:q"
      if (a === 'medkit') { const r = sv.useMedkit(player); if (r.ok) w.gear.play(player, 'use'); return r; } // a first-aid kit from the bag
      if (a === 'aim') { // aim button held / let go: viewers see the bow drawn in my hands (imad 2026-11-25)
        const on = String(text ?? '') === '1' && (sv.inv(player).bow ?? 0) > 0;
        w.gear.aiming[player] = on ? 1 : 0;
        return { ok: true, code: 'aim', on };
      }
      { // what viewers see me do (a swing, a chop, a shot...)
        const an = a === 'hit' || a === 'hitperson' ? 'attack' : a === 'shoot' ? 'shoot' : a === 'build' || a === 'place' ? 'build' : a === 'talk' || a === 'hold' ? 'talk' : '';
        if (an) w.gear.play(player, an, an === 'talk' ? 4 : undefined);
      }
      if (a === 'craft') { // "weapon:wood=1,ore=1"
        const [cat, list] = String(text ?? '').split(':');
        const put: Record<string, number> = {};
        for (const p of (list ?? '').split(',')) { const [k, n] = p.split('='); if (k && Number(n) > 0) put[k] = Math.min(20, Math.floor(Number(n))); }
        const r = sv.craftPut(player, cat ?? '', put);
        return r.ok ? { ok: true, code: 'crafted', item: r.r.what } : { ok: false, code: r.code };
      }
      if (a === 'place') { const c = sv.placeFront(player, String(text ?? '')); return { ok: c === 'placed', code: c, item: String(text ?? '') }; }
      // The player's buttons (imad 2026-11-20): Interact = things (take / gather / drink...), Talk = people (on the TV),
      // Attack = hit what is in front, Aim + Attack = a bow shot along the aim. The angle comes from the TV (where I face / aim).
      const ang = (v: unknown) => { const n = Number(String(v ?? '').split('@').pop()); return Number.isFinite(n) && String(v ?? '').trim() !== '' ? n : NaN; };
      if (a === 'hit') {
        const m = e.map[player]!, x = e.x[player]!, y = e.y[player]!, an0 = ang(text);
        if (Number.isFinite(an0)) e.angle[player] = an0;
        const t = this.frontTarget(player, e.angle[player]!, 2.6, 1.2) ;
        const near = t >= 0 ? t : (() => { const z = w.zombies.nearest(m, x, y, 1.9); return z >= 0 ? z : w.animals.nearest(m, x, y, 2.2); })();
        if (near < 0) return { ok: false, code: 'swing', weapon: sv.weapon(player)[0] };
        e.angle[player] = Math.atan2(e.y[near]! - y, e.x[near]! - x);
        if (e.kind[near] === Kind.Threat) return { ok: true, code: w.zombies.hit(near, w.zombies.damageOf(player), player) ? 'zKilled' : 'zHit' };
        return this.hitAnimal(player, near, w.zombies.damageOf(player));
      }
      // Horses (sim/horses.ts): off when riding, on my horse when it is next to me, else try to tame the wild one next to me;
      // my horse elsewhere on the map comes when I call. 'horseInfo' text = id: that horse's details.
      if (a === 'horse') return w.horses.playerAct(player);
      if (a === 'horseInfo') { const h = e.slot(Number(text)); const d = h >= 0 ? w.horses.info(h, player) : null; return d ? { ok: true, code: 'horseInfo', horse: d } : { ok: false, code: 'noHorse' }; }
      if (a === 'pvp') { // the PvP switch: off by default; on = people can hit me and I can hit them
        const on = String(text ?? '') === '1', k = name.toLowerCase();
        if (on) this.pvp.add(k); else this.pvp.delete(k);
        try { this.db.setMeta('pvp_on', JSON.stringify([...this.pvp])); } catch { /* kept in memory */ }
        return { ok: true, code: 'pvp', on };
      }
      if (a === 'hitperson') { // a separate action: never a hit on a person by mistake (the other Attack only touches zombies and animals)
        if (!this.pvp.has(name.toLowerCase())) return { ok: false, code: 'pvpOff' };
        const now = Date.now();
        if ((this.hitAt.get(name) ?? 0) > now) return { ok: false, code: 'wait' };
        const m = e.map[player]!, x = e.x[player]!, y = e.y[player]!, an0 = ang(text);
        if (Number.isFinite(an0)) e.angle[player] = an0;
        let t = -1, bd = 2.2;
        for (let j = 0; j < e.hi; j++) {
          if (j === player || e.map[j] !== m || (e.kind[j] !== Kind.Agent && e.kind[j] !== Kind.Player) || e.hp[j]! <= 0) continue;
          const dx = e.x[j]! - x, dy = e.y[j]! - y, d = Math.hypot(dx, dy);
          if (d >= bd) continue;
          let da = Math.atan2(dy, dx) - e.angle[player]!; da = Math.atan2(Math.sin(da), Math.cos(da));
          if (Math.abs(da) <= 1.2 || d < 0.9) { bd = d; t = j; }
        }
        if (t < 0) return { ok: false, code: 'swing', weapon: sv.weapon(player)[0] };
        if (e.kind[t] === Kind.Player && !w.clans.pvpOn(t)) return { ok: false, code: 'theirPvpOff' };
        this.hitAt.set(name, now + 900);
        e.angle[player] = Math.atan2(e.y[t]! - y, e.x[t]! - x);
        const dmg = pvpDamage(sv.weapon(player)[1], sv.weapon(t)[1] > 0, sv.defence(t));
        w.clans.damage(t, dmg, player);
        if (e.kind[t] === Kind.Agent) w.clans.hurtBy(t, player);
        return { ok: true, code: 'pHit', dmg };
      }
      if (a === 'shoot') {
        const m = e.map[player]!, x = e.x[player]!, y = e.y[player]!, inv = sv.inv(player);
        if ((inv.bow ?? 0) < 1) return { ok: false, code: 'noBow' };
        if ((inv.arrows ?? 0) < 1) return { ok: false, code: 'noArrows' };
        const an0 = ang(text), aim = Number.isFinite(an0) ? an0 : e.angle[player]!;
        e.angle[player] = aim;
        sv.add(player, 'arrows', -1);
        // The arrow flies along the aim; it hits the first zombie or animal within 0.9 m of that line, up to 22 m.
        const t = this.lineTarget(player, aim, 22, 0.9);
        const dx = Math.cos(aim), dy = Math.sin(aim);
        w.shoot(m, x + dx * 0.6, y + dy * 0.6, dx, dy, player, ARROW_SPEED);
        if (t < 0) return { ok: false, code: 'missed', left: inv.arrows ?? 0 };
        const d = Math.hypot(e.x[t]! - x, e.y[t]! - y), dmg = (d < 10 ? 30 : d < 16 ? 24 : 18) * w.gear.bowMul(player);
        if (e.kind[t] === Kind.Threat) return { ok: true, code: w.zombies.hit(t, dmg, player) ? 'zKilled' : 'zHit', left: inv.arrows ?? 0 };
        return { ...this.hitAnimal(player, t, dmg), left: inv.arrows ?? 0 };
      }
      if (a === 'destroy') {
        // "tx,ty" = pull down what stands there (own buildings, or a dead owner's: imad 2026-11-25); "tx,ty,?" = only ask (the TV's aim).
        const at = /^(\d+),(\d+)(,\?)?$/.exec(String(text ?? '').trim()), m = e.map[player]!, tm = w.maps[m]!.tiles;
        if (!at) return { ok: false, code: 'nothing' };
        const tx = Number(at[1]), ty = Number(at[2]);
        if (at[3]) {
          if (!tm.inside(tx, ty)) return { ok: false, code: 'nothing', tx, ty, check: true };
          const k = ty * tm.w + tx, far = Math.hypot(tx + 0.5 - e.x[player]!, ty + 0.5 - e.y[player]!) > PLACE_REACH;
          const c = far ? 'tooFar' : sv.mayDestroy(player, m, k), o = sv.ownerOf(m, k);
          return { ok: !c, code: c, tx, ty, check: true, cells: c === 'nothing' ? [k] : sv.destroyCells(m, k), owner: o >= 0 ? w.profiles.get(o)?.name ?? '' : '' };
        }
        const c = sv.destroyAt(player, tx, ty);
        if (c === 'destroyed') w.gear.play(player, 'build');
        return { ok: c === 'destroyed', code: c, tx, ty };
      }
      if (a === 'build') {
        // "what#tx,ty,dir" = exactly there (aimed with the TV's ghost, imad 2026-11-25); older TVs: "what" or "what@angle" = in front.
        const raw = String(text ?? ''), what = raw.split(/[@#]/)[0]!.trim();
        const at = /#(\d+),(\d+)(?:,(\d))?$/.exec(raw);
        const an0 = ang(raw.includes('@') ? raw : '');
        if (Number.isFinite(an0)) e.angle[player] = an0;
        const put = (): string => at ? sv.placeAt(player, what, Number(at[1]), Number(at[2]), Number(at[3] ?? 0)) : what === 'hut' ? sv.playerHut(player) : sv.placeFront(player, what);
        if (what === 'hut') { const c = put(); return { ok: c === 'built', code: c, item: what }; }
        if ((sv.inv(player)[what] ?? 0) < 1) {
          const r = RECIPES_ALL.find((q) => q.what === what && (PLACEABLE as readonly string[]).includes(q.what));
          if (!r) return { ok: false, code: 'nothing', item: what };
          if (at) { const c0 = sv.canPlace(player, what, Number(at[1]), Number(at[2])); if (c0) return { ok: false, code: c0, item: what }; } // not made for nothing
          const c = sv.craftPut(player, r.cat, r.need);
          if (!c.ok) return { ok: false, code: c.code === 'noMat' ? 'buildNeed' : c.code, item: what, need: r.need };
          const pc = put();
          if (pc !== 'placed') return { ok: false, code: pc, item: what, kept: true }; // made, kept in the bag
          return { ok: true, code: 'placed', item: what };
        }
        const pc = put();
        return { ok: pc === 'placed', code: pc, item: what };
      }
      if (a === 'huts') { // every hut on my map (or text = a map id): for the TV's map (imad 2026-11-25: "each hut marked on the map")
        const mi = text ? w.maps.findIndex((mp) => mp.def.id === text) : e.map[player]!;
        const me = e.id(player);
        return { ok: true, code: 'huts', list: mi < 0 ? [] : sv.homes.where(mi).map((h) => ({ ...h, mine: h.owner === me || (h.owner >= 0 && sv.homes.family(me, h.owner)) })) };
      }
      if (a === 'door' || ((a === 'take' || a === 'use') && /^door:\d+,\d+$/.test(String(text ?? '')))) {
        // The interact button on a door (imad 2026-11-25): open / close it, if this person may.
        const at = /(\d+),(\d+)$/.exec(String(text ?? ''));
        if (!at) return { ok: false, code: 'nothing' };
        const c = sv.toggleDoor(player, Number(at[1]), Number(at[2]));
        if (c === 'doorOpened' || c === 'doorClosed') w.gear.play(player, 'use');
        return { ok: c === 'doorOpened' || c === 'doorClosed', code: c };
      }
      // On horseback (imad 2026-11-26): no chopping, mining, searching or picking up from the saddle; A gets off (attack and talk still work).
      if ((a === 'use' || a === 'take') && w.horses.riding[player]) return w.horses.playerAct(player);
      if ((a === 'pickup' || a === 'drink') && w.horses.riding[player]) return { ok: false, code: 'onHorse' };
      if (a === 'use' || a === 'take') {
        if (a === 'use') { // older TVs: "use" also hits what is next to me
          const m = e.map[player]!, x = e.x[player]!, y = e.y[player]!;
          const z = w.zombies.nearest(m, x, y, 1.9);
          if (z >= 0) return { ok: true, code: w.zombies.hit(z, w.zombies.damageOf(player), player) ? 'zKilled' : 'zHit' };
          const an = w.animals.nearest(m, x, y, 2.4);
          if (an >= 0) return this.hitAnimal(player, an, w.zombies.damageOf(player));
        }
        const r0 = w.brain.playerDo(player, 'use');
        if (r0.ok) return r0;
        // A tree, a rock or rubble next to me: chop / mine one piece (at most one a second).
        const now = Date.now();
        if ((this.workAt.get(name) ?? 0) > now) return { ok: false, code: 'wait' };
        const wk = sv.playerWork(player);
        if (wk) { this.workAt.set(name, now + (wk.hard ? 1600 : 900)); w.gear.play(player, wk.code === 'chopped' ? 'chop' : wk.code === 'mined' ? 'mine' : 'use'); return { ok: !!wk.got, code: wk.code, got: wk.got }; }
        // Nothing else here but a horse: get on mine / try to tame a wild one (never off the horse by mistake).
        if (!w.horses.riding[player]) {
          let hn = false;
          for (const [hid, h] of w.horses.h) { const s = e.slot(hid); if (s >= 0 && e.map[s] === e.map[player] && h.rider < 0 && Math.hypot(e.x[s]! - e.x[player]!, e.y[s]! - e.y[player]!) < 3.4) { hn = true; break; } }
          if (hn) return w.horses.playerAct(player);
        }
        return r0;
      }
      return w.brain.playerDo(player, a);
    };
    this.net.isSeer = (name) => this.seers().has(name.toLowerCase());
    this.net.info = (id, seer) => this.personInfo(id, seer);
    this.net.minds = (m, x, y, r) => this.mindsAround(m, x, y, r);
    this.net.me = (i) => ({ hunger: Math.round(w.e.hunger[i]!), thirst: Math.round(w.e.thirst[i]!), tired: Math.round(w.e.tired[i]!), carry: w.e.carry[i], hp: Math.round(w.e.hp[i]!), asleep: (w.e.flags[i]! & EFlag.Sleeping) !== 0,
      inv: w.survival.inv(i), def: Math.round(w.survival.defence(i) * 100), weapon: w.survival.weapon(i)[0], gear: { ...w.gear.state(i), use: { weapon: w.gear.equipped(i, 'weapon'), ranged: w.gear.equipped(i, 'ranged'), head: w.gear.equipped(i, 'head'), body: w.gear.equipped(i, 'body') } }, pvp: this.pvp.has(w.survival.playerName(i).toLowerCase()), ride: w.horses.rideOf(i),
      // The cold (sim/weather.ts): health it takes a game hour now (0 = fine), what keeps it off here, clothes' warmth %.
      cold: (() => { const wm = w.weather.warmth(i); return { drain: Math.round((w.brain.chilled[i] ?? 0) * 10) / 10, fire: wm.fire, hut: wm.hut, bed: wm.bed, clothes: Math.round(wm.clothes * 100), t: Math.round(w.weather.temp(w.e.map[i]!) * 10) / 10 }; })() });
    this.net.horses = (m, x, y, r, me) => this.horsesAround(m, x, y, r, me);
    this.net.nameFor = (i) => { // over heads: a person's / player's name, a town teacher's
      if (w.e.kind[i] === Kind.Npc) { const k = w.quests.keyOf(w.e.id(i)); return k ? NPCS.find((n) => n.key === k)?.name ?? '' : ''; }
      return w.profileOf(i)?.name ?? '';
    };
    w.survival.playerName = (i) => this.net.characters().find(([, k]) => k === i)?.[0] ?? '';
    // Walking into the wrecks across a road out while travel is closed: that player is told why.
    // Married or divorced by words: the player's TV is told (and shows it on the Me page).
    w.listeners.push((ev) => {
      if ((ev.kind !== 'partner' || !ev.data.wed) && ev.kind !== 'divorce') return;
      for (const [x, y] of [[ev.data.a, ev.data.b], [ev.data.b, ev.data.a]] as const) {
        const i = w.e.slot(Number(x));
        if (i >= 0 && w.e.kind[i] === Kind.Player) this.net.noticeTo(i, 'did', { a: 'talk', ok: true, code: ev.kind === 'divorce' ? 'divorced' : 'married', name: w.profiles.get(Number(y))?.name ?? '' });
      }
    });
    // A called horse got to its owner: that player's TV says so.
    w.listeners.push((ev) => { if (ev.kind === 'horseCame') { const i = w.e.slot(Number(ev.data.id)); if (i >= 0 && w.e.kind[i] === Kind.Player) this.net.noticeTo(i, 'did', { a: 'horse', ok: true, code: 'came', name: ev.data.name }); } });
    w.listeners.push((ev) => { if (ev.kind === 'blocked') { const i = w.e.slot(Number(ev.data.id)); if (i >= 0) this.net.noticeTo(i, 'blocked', ev.data.why ? { why: ev.data.why } : {}); } });
    this.planner.onSay = (i, text) => this.net.say(w.e.map[i]!, { id: w.e.id(i), name: this.nameOf(w.e.id(i)), text });
    // Quests (sim/quests.ts): the NPCs speak to the viewers of their map, lessons go into memory, players see their progress.
    w.quests.onNpcSay = (j, nm, text) => this.net.say(w.e.map[j]!, { id: w.e.id(j), name: nm, text });
    w.quests.onLearn = (id, text) => this.planner.note(id, text, true);
    w.quests.onProgress = (i, d) => this.net.noticeTo(i, 'quest', d);
    w.clans.onVote = (c, open) => { for (const id of c.members) { const i = w.e.slot(id); if (i >= 0 && w.e.kind[i] === Kind.Player) this.net.noticeTo(i, 'clanVote', { open, clan: c.name }); } };
    this.net.avatarStore = {
      get: (name) => { const v = this.db.getMeta('pos:' + name); return v ? JSON.parse(v) : null; },
      set: (name, p) => this.db.setMeta('pos:' + name, JSON.stringify(p)),
    };
    // Every player's character lives in the world 24/7: asleep where they left it until they come back.
    for (let i = 0; i < w.e.hi; i++) { const n = w.e.alive(i) ? w.charName(i) : ''; if (n && !this.net.residents.has(n)) this.net.adopt(n, i); }
    this.net.spawnResidents([...this.players.list().map((p) => p.name), ...this.accounts.list().map((a) => a.name).filter(Boolean)]);
    this.net.playerCmd = (c, uid) => this.playerCmd(c, uid);
    // Panel chat for a player's own character (ai/chatroom.ts): direct chats, the world channel, the clan channel.
    this.chats = new Chats(this.db, w, this.planner, {
      charOf: (name) => { const id = this.net.residents.get(name); return id !== undefined && w.e.slot(id) >= 0 ? id : -1; },
      playerOf: (id) => w.profiles.get(id)?.player ?? '',
      aiReady: () => this.ai.status().ready,
      notify: (to, m) => this.net.noticeAccounts(to, 'chat', m),
    });
    this.planner.onTaskEnd = (id, from, text, ok, why) => this.chats.taskEnded(id, from, text, ok, why);
    // The owner's strict rules (sim/rules.ts): everyone's are in the database, each person's in their profile.
    { const r = this.db.getMeta('rules_all'); if (r) { try { this.world.rules.all = JSON.parse(r) as Rule[]; } catch { /* broken: none */ } } }
    this.world.rules.resolve((n) => this.planner.whoIs(n));
    // Zombie attacks as replays (sim/replays.ts): the last 20 in SQLite (never in snapshots or the cloud backup).
    w.replays.nextId = (this.replayList()[0]?.id ?? 0) + 1;
    w.replays.nameOf = (id) => { const s = w.e.slot(id); return this.net.characters().find(([, k]) => k === s)?.[0] ?? ''; };
    w.replays.onDone = (r) => {
      this.db.setMeta('replay:' + r.id, JSON.stringify(r));
      const list = [summary(r), ...this.replayList()];
      for (const old of list.splice(KEEP)) this.db.delMeta('replay:' + old.id);
      this.db.setMeta('replays', JSON.stringify(list));
    };
    await this.net.listen();
    // A restart from the panel paused the PC's watchdog: up again, it may watch again.
    if (existsSync(join(dataDir, 'restart.flag'))) { rmSync(join(dataDir, 'restart.flag'), { force: true }); rmSync(join(dataDir, 'watchdog.pause'), { force: true }); }
    this.agent = new Agent(ROOT, this.db, dbFile, this.control, {
      ai: () => this.agentAi(), brainName: () => this.agentBrain()?.name ?? 'none',
      scope: (print) => this.agentScope(print), data: () => this.agentData(), snapshot: () => this.snapshot(), secrets: () => this.secretList(),
    }, this.log);
    this.analysis = new Analysis({
      world: () => this.world, db: this.db, events: this.events, overview: () => this.overview(),
      aiStatus: () => { const s = this.ai.status(); return { provider: s.provider, model: s.model, ready: s.ready, why: s.why, callsLastHour: s.callsLastHour, maxCallsPerHour: s.maxCallsPerHour, lastError: s.lastError, brain: this.brains.get(this.ai.tag)?.name ?? '' }; },
      planner: () => this.planner, serverLog: (n) => this.control.logTail(n, 'warn', this.log.recent), ai: (id) => this.analysisAi(id),
      redact: (s) => this.agent.redact(s), players: () => this.net.characters(),
    });
    this.errors.redact = (t) => this.agent.redact(t);

    this.timers.push(setInterval(() => this.snapshot(), c.snapshotEverySec * 1000));
    this.sampleHistory();
    this.timers.push(setInterval(() => this.sampleHistory(), 60_000));
    this.timers.push(setInterval(() => { if (!this.loop.paused) try { this.chats.check(); } catch (err) { this.log.warn('chat check', { err: String(err) }); } }, 10_000));
    this.timers.push(setInterval(() => { void this.planner.tick(this.loop.paused).catch((err) => this.log.warn('planner', { err: String((err as Error)?.stack ?? err) })); }, 2000));
    this.timers.push(setInterval(() => { try { this.events.flush(); } catch (err) { this.log.error('event flush', { err: String(err) }); } }, 1000));
    this.timers.push(setInterval(() => { this.fallbackCheck(); try { this.brainStats.flush(); } catch (err) { this.log.error('brain stats', { err: String(err) }); } }, 15_000));
    if (c.cloud.enabled) {
      this.timers.push(setInterval(() => { this.cloud.collect(w); void this.cloud.flush(); }, c.cloud.everySec * 1000));
    }
    this.tunnel = new TunnelManager({
      port: (this.net.http.address() as { port: number }).port, bin: c.tunnel.bin, ngrokDomain: c.tunnel.ngrokDomain,
      cloudflareHostname: c.tunnel.cloudflareHostname, cloudflareToken: this.secrets.cloudflareToken,
    }, this.log, (this.db.getMeta('tunnel_provider') as Config['tunnel']['provider'] | undefined) ?? c.tunnel.provider);
    this.tunnel.onUrl = (url, old) => {
      this.db.setMeta('public_url', url);
      this.net.notifyAdmins('url', { url, old });
    };
    void this.tunnel.start();
    this.loop.start();
    this.log.info('server up', { url: this.net.address(), tickRate: c.tickRate, speed: c.speed, lowSpec: c.lowSpec });
  }

  // ------------------------------------------------------------ the panel's AI agent and server controls (2026-11-25)

  /** The agent's brain: its own choice (meta agent_brain), else a cloud brain (code needs a strong model), else the one in use. */
  private agentBrain() {
    const v = this.brains.view(), chosen = this.db.getMeta('agent_brain');
    const id = (chosen && v.list.some((b) => b.id === chosen) ? chosen : undefined) ?? v.list.find((b) => b.provider === 'gemini' || b.provider === 'openai')?.id ?? this.brains.active.id;
    return this.brains.get(id);
  }
  private agentAi(): Ai {
    const b = this.agentBrain();
    if (!b || b.provider === 'none') throw new Error('the agent needs an AI brain: pick one on the AI agent page');
    const ai = new Ai({ ...this.cfg.ai, provider: 'none', timeoutMs: Math.max(this.cfg.ai.timeoutMs, 240_000) }, this.aiKeys(), this.log);
    ai.apply(this.brains.settingsOf(b));
    return ai;
  }
  /** The Analysis page's brain: '' = the one in use (with its fallback, the live budget), else a saved brain of its own. */
  private analysisAi(id: string): { ai: Ai; name: string } {
    if (!id) return { ai: this.ai, name: this.brains.get(this.ai.tag)?.name ?? this.brains.active.name };
    const b = this.brains.get(id);
    if (!b) throw new Error('no such brain');
    if (b.provider === 'none') throw new Error(`${b.name} has no AI: pick another brain`);
    const ai = new Ai({ ...this.cfg.ai, provider: 'none', timeoutMs: Math.max(this.cfg.ai.timeoutMs, 240_000) }, this.aiKeys(), this.log);
    ai.apply(this.brains.settingsOf(b));
    ai.tag = b.id;
    ai.onResult = (tag, ok, err) => this.brainStats.record(tag, ok, err);
    return { ai, name: b.name };
  }
  private secretList(): string[] {
    const s = this.secrets, out = [s.adminToken, s.cloudflareToken ?? '', s.ollamaKey ?? '', s.openaiKey ?? '', s.firebase?.private_key ?? '', ...keyList(s.geminiKey), ...s.viewers.values()];
    for (const b of this.brains.view().list) out.push(...keyList(this.brains.get(b.id)?.key));
    return out.filter((x) => x && x.length >= 6);
  }
  /** What agent code can use. */
  private agentScope(print: (...v: unknown[]) => void): Record<string, unknown> {
    const w = this.world;
    const find = (name: string): number => {
      const n = String(name ?? '').trim().toLowerCase();
      for (let i = 0; i < w.e.hi; i++) {
        if (w.e.kind[i] !== Kind.Agent && w.e.kind[i] !== Kind.Player) continue;
        const p = w.profileOf(i);
        if (p && p.died === undefined && (p.name.toLowerCase() === n || p.player?.toLowerCase() === n)) return i;
      }
      return -1;
    };
    const person = (name: string) => { const i = find(name); return i < 0 ? null : { i, id: w.e.id(i), p: w.profileOf(i)! }; };
    return { world: w, db: this.db, app: this, find, person, print, Kind, admin: (c: AdminCmd) => this.adminCmd(c, 'agent', true), console: { log: print, warn: print, error: print } };
  }
  /** A JSON copy of the world for the agent's sandboxed looks. */
  private agentData(): unknown {
    const w = this.world, agents: unknown[] = [];
    for (let i = 0; i < w.e.hi; i++) if (w.e.kind[i] === Kind.Agent || w.e.kind[i] === Kind.Player) agents.push(this.agentInfo(i));
    const meta = Object.fromEntries((this.db.sql.prepare("SELECT k, v FROM meta WHERE k NOT IN ('brains', 'ai', 'agent_chat', 'replays') AND k NOT LIKE 'replay:%'").all() as { k: string; v: string }[]).map((r) => [r.k, r.v.length > 2000 ? r.v.slice(0, 2000) + '…' : r.v]));
    const people = [...w.profiles].map(([id, p]) => ({ id, ...p, mind: p.mind ? { mood: p.mind.mood, summary: p.mind.summary } : undefined, bonds: undefined }));
    return { people, agents, overview: this.overview(), maps: w.maps.map((m) => ({ index: m.index, id: m.def.id, name: m.def.name, w: m.def.w, h: m.def.h })), meta };
  }
  /** Restart: the PC's watchdog is paused meanwhile (it would start a second server), the new process lifts the pause. */
  private restartSoon(who: string): { ok: true; restarting: true } {
    const d = resolve(this.cfg.dataDir);
    try { writeFileSync(join(d, 'watchdog.pause'), `restart from the panel by ${who}`); writeFileSync(join(d, 'restart.flag'), String(Date.now())); } catch { /* tests, read-only */ }
    this.log.warn('restart asked', { who });
    setTimeout(() => this.onRestartRequest(), 300);
    return { ok: true, restarting: true };
  }
  private ownerOnly(owner: boolean): void { if (!owner) throw new Error('only the owner (or the admin token) can do this'); }

  private readonly workAt = new Map<string, number>();
  /** Players (lower case) who switched PvP on: only they can hit or be hit by other people (imad 2026-11-21). */
  private pvp = new Set<string>();
  private _mapView: MapView | null = null;
  /** The TV's map and each player's marks on it (ops/mapview.ts). */
  get mapView(): MapView { if (!this._mapView) { this._mapView = new MapView(this.world, this.db); this._mapView.planner = () => this.net.characters(); } return this._mapView; }
  private _way: Waypoints | null = null;
  /** The compass bar and riding by yourself (ops/waypoints.ts). */
  get waypoints(): Waypoints { return this._way ??= new Waypoints(this.world, (n) => this.mapView.marks(n)); }
  private readonly hitAt = new Map<string, number>();
  /** The nearest zombie or animal in front of player i (within `r` m and `cone` radians either side of angle `a`), or -1. */
  private frontTarget(i: number, a: number, r: number, cone: number): number {
    const e = this.world.e, m = e.map[i]!, x = e.x[i]!, y = e.y[i]!;
    let best = -1, bd = r;
    for (let j = 0; j < e.hi; j++) {
      if ((e.kind[j] !== Kind.Threat && e.kind[j] !== Kind.Animal) || e.map[j] !== m || e.hp[j]! <= 0 || this.world.horses.owned(j)) continue; // never a tamed horse
      const dx = e.x[j]! - x, dy = e.y[j]! - y, d = Math.hypot(dx, dy);
      if (d >= bd) continue;
      let da = Math.atan2(dy, dx) - a; da = Math.atan2(Math.sin(da), Math.cos(da));
      if (Math.abs(da) <= cone || d < 0.9) { bd = d; best = j; }
    }
    return best;
  }
  /** The first zombie or animal an arrow along angle `a` meets (closer than `side` m to the line, ahead, within `r` m), or -1. */
  private lineTarget(i: number, a: number, r: number, side: number): number {
    const e = this.world.e, m = e.map[i]!, x = e.x[i]!, y = e.y[i]!, cx = Math.cos(a), cy = Math.sin(a);
    let best = -1, bd = r;
    for (let j = 0; j < e.hi; j++) {
      if ((e.kind[j] !== Kind.Threat && e.kind[j] !== Kind.Animal) || e.map[j] !== m || e.hp[j]! <= 0 || this.world.horses.owned(j)) continue;
      const dx = e.x[j]! - x, dy = e.y[j]! - y, along = dx * cx + dy * cy, off = Math.abs(dx * cy - dy * cx);
      if (along > 0.3 && along < bd && off <= side + along * 0.02) { bd = along; best = j; }
    }
    return best;
  }
  private hitAnimal(player: number, a: number, dmg: number): { ok: boolean; code: string; got?: Record<string, number>; item?: string } {
    const w = this.world, type = w.e.sub[a]!;
    const d = w.animals.hit(a, dmg, player);
    return d ? { ok: true, code: 'aKilled', item: ANIMAL_NAMES[type] ?? 'horse', got: d } : { ok: true, code: 'aHit', item: ANIMAL_NAMES[type] ?? 'horse' };
  }

  /** The clock speeds by phase and what runs now (stats + the clockSpeed command). */
  clockSpeeds(): NonNullable<ServerStats['clock']> {
    const w = this.world;
    return { ...w.clockMul, phase: w.clockPhase, mul: w.opt.clockScale / w.clockBase, base: w.clockBase };
  }

  /** Season, sky and the temperature on every map (stats + the weather command). */
  weatherInfo(): NonNullable<ServerStats['weather']> {
    const wx = this.world.weather, i = wx.info(0), temps: Record<string, number> = {};
    for (const m of this.world.maps) temps[m.def.id] = Math.round(wx.temp(m.index) * 10) / 10;
    return { s: i.s, sd: i.sd, day: i.day, w: i.w, k: i.k, temps, cold: wx.cfg.cold, forced: wx.forced, until: wx.until, f: i.f };
  }

  clock(): ClockInfo {
    return { tick: this.world.tick, gameSec: this.world.gameSec, speed: this.loop?.speed ?? this.cfg.speed, paused: this.loop?.paused ?? false, clockScale: this.world.opt.clockScale, tickRate: this.cfg.tickRate };
  }

  snapshot(): void {
    try {
      this.net?.saveAvatars();
      const r = this.snaps.save(this.world);
      this.lastSnapshotAt = Date.now();
      this.log.debug('snapshot', { ...r, tick: this.world.tick });
    } catch (err) {
      this.log.error('snapshot failed', { err: String((err as Error)?.stack ?? err) });
    }
  }

  stats(): ServerStats {
    const m = this.monitor.sample(), w = this.world;
    return {
      tick: w.tick, speed: this.loop.speed, paused: this.loop.paused, effSpeed: this.loop.effSpeed, tps: this.loop.ticksLastSec,
      tickMsAvg: m.avg, tickMsP95: m.p95, tickMsMax: m.max, rssMb: m.rssMb, heapMb: m.heapMb, cpuPct: m.cpuPct,
      entities: w.e.count, agents: w.e.countKind(Kind.Agent), clients: this.net.clientCount(),
      lastSnapshotAt: this.lastSnapshotAt, uptimeSec: Math.round((Date.now() - this.monitor.startedAt) / 1000),
      tunnel: this.tunnel?.status(), pairings: this.players.pending.size,
      clock: this.clockSpeeds(),
      weather: this.weatherInfo(),
      travelOpen: w.travelOpen, difficulty: w.brain.life.difficulty, yearDays: w.brain.life.yearDays, maxPopulation: w.brain.life.maxPopulation,
      zombies: { now: w.zombies.count(), perNight: w.zombies.perNight },
      camps: w.maps.flatMap((m, mi) => { const c = w.survival.campOf(mi); return c ? [{ map: m.def.id, x: Math.round(c.x), y: Math.round(c.y), huts: w.survival.huts[mi]!.length, fires: [...w.survival.fires.keys()].filter((k) => k.startsWith(mi + ':')).length }] : []; }),
      ai: { ...(({ provider, model, ready, why }) => ({ provider, model, ready, why }))(this.ai.status()), plans: this.planner.counts.plans, chats: this.planner.counts.chats, failures: this.planner.counts.failures },
    };
  }

  /** The dashboard's history: one sample a minute, the last 24 hours (memory only: starts again with the server). */
  readonly hist: number[][] = [];
  sampleHistory(): void {
    const w = this.world, e = w.e;
    let n = 0, hu = 0, th = 0, ti = 0, lo = 0, hp = 0;
    for (let i = 0; i < e.hi; i++) if (e.kind[i] === Kind.Agent && e.map[i] !== NO_MAP) { n++; hu += e.hunger[i]!; th += e.thirst[i]!; ti += e.tired[i]!; lo += e.lonely[i]!; hp += e.hp[i]!; }
    const d = Math.max(1, n), m = this.monitor.sample(), r = (v: number) => Math.round(v * 10) / 10;
    // [time ms, game sec, people, hunger, thirst, tired, lonely, hp, zombies, animals, ticks/s, cpu %, ram MB]
    this.hist.push([Date.now(), Math.round(w.gameSec), n, r(hu / d), r(th / d), r(ti / d), r(lo / d), r(hp / d), w.zombies.count(), w.animals.count(), Math.round(this.loop.ticksLastSec), Math.round(m.cpuPct), Math.round(m.rssMb)]);
    if (this.hist.length > 1440) this.hist.splice(0, this.hist.length - 1440);
  }
  /** The dashboard: who is alive, how they are, what each map holds. */
  overview(): Record<string, unknown> {
    const w = this.world, e = w.e;
    let alive = 0, children = 0, pregnant = 0, partners = 0, asleep = 0, working = 0, talking = 0, hungry = 0, thirsty = 0, hurt = 0;
    const need = { hunger: 0, thirst: 0, tired: 0, lonely: 0, hp: 0 }, acts: Record<number, number> = {};
    const maps = w.maps.map((mp, mi) => ({ id: mp.def.id, name: mp.def.name, w: mp.tiles.w, h: mp.tiles.h, type: mp.def.gen.type, people: 0, players: 0, online: 0, zombies: 0, animals: [0, 0, 0, 0, 0], items: 0,
      camp: (() => { const c = w.survival.campOf(mi); return c ? [Math.round(c.x), Math.round(c.y)] : null; })(), huts: w.survival.huts[mi]?.length ?? 0,
      fires: [...w.survival.fires.keys()].filter((k) => k.startsWith(mi + ':')).length, store: w.survival.stash[mi] ?? null,
      leader: w.survival.leaderName(mi), defence: w.survival.campDefence(mi), doors: w.survival.countTiles(mi, w.survival.T.door) }));
    for (let i = 0; i < e.hi; i++) {
      const m = e.map[i]!; if (m === NO_MAP) continue;
      const k = e.kind[i], mp = maps[m]!;
      if (k === Kind.Agent) {
        alive++; mp.people++;
        need.hunger += e.hunger[i]!; need.thirst += e.thirst[i]!; need.tired += e.tired[i]!; need.lonely += e.lonely[i]!; need.hp += e.hp[i]!;
        if (e.flags[i]! & EFlag.Child) children++;
        if (e.flags[i]! & EFlag.Sleeping) asleep++;
        if (e.hunger[i]! > 70) hungry++;
        if (e.thirst[i]! > 70) thirsty++;
        if (e.hp[i]! < 50) hurt++;
        const a = e.act[i]!; acts[a] = (acts[a] ?? 0) + 1;
        if (a === 11 || a === 12) working++;
        if (a === 6) talking++;
        const p = w.profiles.get(e.id(i));
        if (p?.pregnant) pregnant++;
        if (p && p.partner >= 0) partners++;
      } else if (k === Kind.Threat) mp.zombies++;
      else if (k === Kind.Animal) mp.animals[e.sub[i]!] = (mp.animals[e.sub[i]!] ?? 0) + 1;
      else if (k === Kind.Item) mp.items++;
    }
    for (const [name, i] of this.net.characters()) { const m = e.map[i]!; if (m !== NO_MAP) { maps[m]!.players++; if (this.net.online(name)) maps[m]!.online++; } }
    let dead = 0, born = 0, oldest = 0;
    const causes: Record<string, number> = {};
    for (const [, p] of w.profiles) {
      if (p.died !== undefined) { dead++; causes[p.cause ?? '?'] = (causes[p.cause ?? '?'] ?? 0) + 1; }
      if (p.generation > 0) born++;
      oldest = Math.max(oldest, p.generation);
    }
    const d = Math.max(1, alive), r = (v: number) => Math.round((v / d) * 10) / 10;
    return {
      gameSec: w.gameSec, clockScale: w.opt.clockScale, yearDays: w.brain.life.yearDays, speed: this.loop.speed, paused: this.loop.paused,
      alive, children, adults: alive - children, pregnant, couples: Math.floor(partners / 2), asleep, working, talking, hungry, thirsty, hurt,
      needs: { hunger: r(need.hunger), thirst: r(need.thirst), tired: r(need.tired), lonely: r(need.lonely), hp: r(need.hp) }, acts,
      dead, born, generations: oldest, causes, maps, animalNames: ANIMAL_NAMES, travelOpen: w.travelOpen,
      rules: { all: w.rules.all.length, people: [...w.profiles.values()].reduce((s, p) => s + (p.rules?.length ?? 0), 0) },
      zombiesNight: w.zombies.perNight, pairings: this.players.pending.size, replays: this.replayList().length,
    };
  }

  /** Everyone a player can go to (game menu): [id, name, map name], people first, then other players. */
  roster(me: string): [number, string, string][] {
    const w = this.world, e = w.e, out: [number, string, string][] = [];
    for (let i = 0; i < e.hi; i++) if (e.kind[i] === Kind.Agent && e.map[i] !== NO_MAP) out.push([e.id(i), this.nameOf(e.id(i)), w.maps[e.map[i]!]!.def.name]);
    out.sort((a, b) => a[1].localeCompare(b[1]));
    for (const [name, i] of this.net.characters()) if (name !== me && e.map[i] !== NO_MAP) out.push([e.id(i), name, w.maps[e.map[i]!]!.def.name]);
    return out;
  }
  /** Put a player's character right next to someone (any map). */
  /** In-game admin tools (Go to someone...): owner / admin accounts; without Firebase sign-in set up, every player as before. */
  /** Saved brains for the panel (no keys) + how many Gemini keys .env has, each brain's calls / errors, the fallback state. */
  private brainsView() {
    const v = this.brains.view(), now = Date.now(), f = this.failover;
    return {
      ...v, list: v.list.map((b) => ({ ...b, stats: this.brainStats.view(b.id, now) })),
      envKeys: { gemini: keyList(this.secrets.geminiKey).length },
      failover: { on: f.on(now), brain: f.on(now) ? this.ai.tag : '', since: f.since, until: f.until, streak: f.streak, reason: f.reason, errors: f.errors, minutes: Math.round(f.ms / 60_000) },
    };
  }

  /** A live AI call ended: count it for its brain; the brain in use failing 3 in a row hands over to the fallback brain. */
  private aiResult(tag: string, ok: boolean, err: string): void {
    if (tag) this.brainStats.record(tag, ok, err);
    if (tag !== this.brains.active.id || !this.brains.fallbackId) return;
    if (!this.failover.result(ok, err)) return;
    const fb = this.brains.get(this.brains.fallbackId)!;
    try {
      this.ai.apply(this.brains.settingsOf(fb));
      this.ai.tag = fb.id;
      this.log.warn('brain failing: fallback in use', { from: this.brains.active.name, to: fb.name, minutes: Math.round(this.failover.ms / 60_000), err });
    } catch (e) { this.failover.reset(); this.log.warn('fallback brain refused', { err: String(e) }); }
  }
  /** The fallback's 30 minutes are over: the brain in use thinks again. */
  private fallbackCheck(): void {
    if (this.failover.expired()) { this.backToActive(); this.log.info('fallback over: brain in use again', { name: this.brains.active.name }); }
  }
  /** End the fallback at once (the owner chose or changed a brain). */
  private endFallback(): void {
    if (!this.failover.until && !this.failover.streak) return;
    const was = this.failover.until > 0;
    this.failover.reset();
    if (was) this.backToActive();
  }
  private backToActive(): void {
    try { this.ai.apply(this.brains.settingsOf(this.brains.active)); } catch (e) { this.log.warn('saved brain refused', { err: String(e) }); }
    this.ai.tag = this.brains.active.id;
  }
  private aiKeys() { return { gemini: this.secrets.geminiKey, ollama: this.secrets.ollamaKey, openai: this.secrets.openaiKey }; }

  /** Switch the AI to a saved brain. */
  private useBrain(id: string, who: string): void {
    const b = this.brains.get(id);
    if (!b) throw new Error('no such brain');
    this.failover.reset();
    const s = this.ai.apply(this.brains.settingsOf(b));
    this.brains.use(id);
    this.ai.tag = id;
    this.db.setMeta('ai', JSON.stringify({ ...s, key: undefined }));
    this.log.info('brain in use', { who, name: b.name, provider: s.provider, model: this.ai.model });
  }

  isStaff(name: string): boolean {
    if (!this.auth.enabled) return true;
    return this.accounts.isStaff(name);
  }

  /** A signed-in account about itself: its character and its TV. Players get exactly what a person of the world has. */
  playerCmd(c: AdminCmd, uid: string): unknown {
    const a = this.accounts.get(uid);
    if (!a) throw new Error('sign in again');
    switch (c.cmd) {
      case 'me': {
        const r = a.name ? this.net.residents.get(a.name) : undefined, e = this.world.e, i = r !== undefined ? e.slot(r) : -1;
        const me = i >= 0 ? { id: r, map: this.world.maps[e.map[i] === NO_MAP ? e.toMap[i]! : e.map[i]!]!.def.name, x: Math.round(e.x[i]!), y: Math.round(e.y[i]!),
          hp: Math.round(e.hp[i]!), hunger: Math.round(e.hunger[i]!), thirst: Math.round(e.thirst[i]!), tired: Math.round(e.tired[i]!), asleep: (e.flags[i]! & EFlag.Sleeping) !== 0,
          online: this.net.online(a.name), inv: this.world.survival.inv(i) } : null;
        return { name: a.name, role: a.role, email: a.email, character: me, tv: !!a.name && this.players.has(a.name), clock: this.clock() };
      }
      case 'joinWorld': {
        if (a.name) return { name: a.name };
        const name = String(c.name ?? '').trim().replace(/\s+/g, ' ');
        if (!/^[\p{L}\p{N} ._-]{2,20}$/u.test(name)) throw new Error('2 to 20 letters, digits or spaces');
        const lower = name.toLowerCase();
        const person = [...this.world.profiles.values()].some((p) => p.name.toLowerCase() === lower);
        if (person || lower === 'admin' || this.accounts.byName(name)) throw new Error('that name is taken');
        // A TV already paired under that name: only the owner / an admin may take it over (their own old TV).
        if (this.players.has(name) && a.role === 'player') throw new Error('that name is taken');
        this.accounts.setName(uid, name);
        this.net.spawnResidents([name]);
        this.world.emit('joined', { name, who: a.email });
        return { name };
      }
      case 'chats': case 'chatRead': case 'chatSend': {
        const me = a.name ? this.net.residents.get(a.name) : undefined;
        if (me === undefined || this.world.e.slot(me) < 0) throw new Error(a.name ? 'your character is not in the world right now' : 'join the world first (My character page)');
        if (c.cmd === 'chats') return this.chats.list(me);
        if (c.cmd === 'chatRead') return this.chats.read(me, String(c.chan ?? ''), Math.max(0, Math.floor(Number(c.before) || 0)));
        return this.chats.send(me, a.name, { chan: c.chan !== undefined ? String(c.chan) : undefined, to: c.to !== undefined ? Number(c.to) : undefined, text: String(c.text ?? '') });
      }
      case 'approveMine': {
        if (!a.name) throw new Error('join the world first');
        if (typeof c.code !== 'string' || !/^\d{6}$/.test(c.code)) throw new Error('bad code');
        return this.players.approve(c.code, a.name, true);
      }
      case 'revokeMine': {
        if (!a.name || !this.players.revoke(a.name)) throw new Error('no TV');
        return { kicked: this.net.kick(a.name) };
      }
      default: throw new Error('not allowed');
    }
  }

  teleport(player: number, id: number): Record<string, unknown> {
    const w = this.world, e = w.e, j = Number.isInteger(id) ? e.slot(id) : -1;
    if (j < 0 || j === player || e.map[j] === NO_MAP) return { ok: false, code: 'nobody' };
    const m = e.map[j]!, s = w.freeSpot(m, e.x[j]! + 1.2, e.y[j]! + 0.6, 40) ?? { x: e.x[j]!, y: e.y[j]! };
    w.place(player, m, s.x, s.y);
    e.inX[player] = e.inY[player] = 0;
    w.emit('teleport', { id: e.id(player), to: id, map: w.maps[m]!.def.id });
    return { ok: true, code: 'tp', name: e.kind[j] === Kind.Agent ? this.nameOf(id) : this.net.characters().find(([, k]) => k === j)?.[0] ?? '', x: s.x, y: s.y, map: w.maps[m]!.def.id };
  }

  /** Players who see thoughts (lower case). imad asked to be the only one by default (2026-11-20). */
  seers(): Set<string> {
    const v = this.db.getMeta('seers');
    return new Set((v ? (JSON.parse(v) as string[]) : ['imad']).map((n) => n.toLowerCase()));
  }

  /** One person for a viewer (watch mode's card). Thoughts, plans and memory only for seers. */
  /**
   * The player's own character as a person (imad 2026-11-20): look (sex once a real week, skin tone), the AI autopilot
   * while away, 5 rules for that autopilot, asking someone to be a partner, trying for a child, building a hut.
   * Null = not one of these.
   */
  private charDo(name: string, player: number, a: string, text?: string): Record<string, unknown> | null {
    const w = this.world, e = w.e, p = w.playerProfile(player, name);
    const mine = () => ({ ok: true, code: 'mine', me: this.charInfo(player) });
    switch (a) {
      case 'mine': return mine();
      case 'look': { // "f:2" = woman, skin tone 2
        const [sx, sk] = String(text ?? '').split(':');
        const sex = sx === 'f' ? 'f' : 'm', skin = Math.max(0, Math.min(4, Math.floor(Number(sk) || 0)));
        if (p.chose && sex !== p.sex) {
          const left = (p.sexAt ?? 0) + SEX_WEEK_MS - Date.now();
          if (left > 0) return { ok: false, code: 'sexWeek', days: Math.ceil(left / 86400_000), me: this.charInfo(player) };
          if (p.pregnant) return { ok: false, code: 'sexPregnant', me: this.charInfo(player) };
          p.sexAt = Date.now();
        }
        p.sex = sex; p.skin = skin; p.chose = true;
        w.setLook(player);
        return { ...mine(), code: 'looked' };
      }
      case 'auto': p.auto = text === '1'; return { ...mine(), code: p.auto ? 'autoOn' : 'autoOff' };
      // Families (imad 2026-11-25, sim/family.ts): look after my little ones by hand; choose other players as my family.
      case 'care': { // "feed:<kid id>" | water | carry | bed
        const [what, kid] = String(text ?? '').split(':');
        const r = w.family.care(player, what ?? '', Number(kid));
        return r.ok ? { ...mine(), code: r.code } : { ok: false, code: r.code, me: this.charInfo(player) };
      }
      case 'kinAsk': { // "<their character id>:<role>" = what they would be to me (child | sibling | parent)
        const [tid, role] = String(text ?? '').split(':');
        const t = e.slot(Number(tid));
        if (t < 0 || t === player || !w.charName(t)) return { ok: false, code: 'kinOnlyPlayers' };
        if (role !== 'child' && role !== 'sibling' && role !== 'parent') return { ok: false, code: 'nothing' };
        if (p.partner === e.id(t)) return { ok: false, code: 'why', why: `you are married to ${w.profileOf(t)?.name ?? 'them'}` };
        const r = w.family.ask(e.id(player), e.id(t), role);
        if (r !== true) return r === 'already' ? { ...mine(), code: 'kinAlready' } : { ok: false, code: 'why', why: r };
        this.net.noticeTo(t, 'did', { a: 'kin', ok: true, code: 'kinAskedYou', name: p.name, role });
        return { ...mine(), code: 'kinAsked', name: w.profileOf(t)?.name ?? '' };
      }
      case 'kinAnswer': { // "<asker id>:1" yes / ":0" no
        const [fid, yes] = String(text ?? '').split(':');
        const r = w.family.answer(e.id(player), Number(fid), yes === '1');
        if (r !== true) return { ok: false, code: 'why', why: r, me: this.charInfo(player) };
        const f = e.slot(Number(fid));
        if (f >= 0) this.net.noticeTo(f, 'did', { a: 'kin', ok: yes === '1', code: yes === '1' ? 'kinYes' : 'kinNo', name: p.name });
        return { ...mine(), code: yes === '1' ? 'kinSet' : 'kinRefused' };
      }
      case 'kinDrop': { const r = w.family.setRole(e.id(player), Number(text), null); return r === true ? { ...mine(), code: 'kinDropped' } : { ok: false, code: 'why', why: r }; }
      case 'ruleAdd': {
        const t = String(text ?? '').trim();
        if (!t) return mine();
        p.rules ??= [];
        if (p.rules.length >= MAX_RULES) return { ok: false, code: 'rulesFull', me: this.charInfo(player) };
        const pid = e.id(player), r = compileRule(w, t.slice(0, 200), (n) => this.planner.whoIs(n, pid));
        p.rules.push(r);
        w.emit('ruleSet', { id: pid, text: r.text, forbid: r.forbid.join(','), with: r.withName ?? '', player: name });
        void this.planner.refineRule(r, p.name).catch(() => {}); // the AI reads it once (in the background)
        return { ...mine(), code: 'ruleAdded' };
      }
      case 'ruleDel': {
        const k = Math.floor(Number(text));
        if (p.rules && k >= 0 && k < p.rules.length) p.rules.splice(k, 1);
        if (p.rules && !p.rules.length) delete p.rules;
        return { ...mine(), code: 'ruleRemoved' };
      }
      case 'court': case 'child': {
        if (e.map[player] === NO_MAP) return { ok: false, code: 'nothing' };
        if (a === 'child') {
          const r = w.life.tryChild(e.id(player));
          return r === true ? { ...mine(), code: 'expecting' } : { ok: false, code: 'why', why: r };
        }
        const t = e.slot(Number(text));
        if (t < 0 || e.map[t] !== e.map[player] || Math.hypot(e.x[t]! - e.x[player]!, e.y[t]! - e.y[player]!) > 10) return { ok: false, code: 'tooFar' };
        const r = w.life.court(e.id(player), e.id(t));
        return r === true ? { ...mine(), code: 'partners', name: this.nameOf(e.id(t)) } : { ok: false, code: 'why', why: r };
      }
      case 'marry': case 'divorce': { // by hand (imad 2026-11-21): ask the person next to me; their own answer decides
        if (e.map[player] === NO_MAP) return { ok: false, code: 'nothing' };
        const t = e.slot(Number(text));
        if (t < 0 || e.kind[t] !== Kind.Agent || e.map[t] !== e.map[player] || Math.hypot(e.x[t]! - e.x[player]!, e.y[t]! - e.y[player]!) > 10) return { ok: false, code: 'tooFar' };
        const ida = e.id(player), idb = e.id(t);
        const why = a === 'marry' ? w.life.canMarry(ida, idb) : (w.profiles.get(ida)?.partner === idb ? true : 'we are not married');
        if (why !== true) return { ok: false, code: 'why', why };
        void this.planner.chat(t, w.profileOf(player)?.name ?? name, a === 'marry' ? 'Will you marry me?' : 'I want a divorce.', player).catch(() => {});
        return { ok: true, code: 'asking', name: this.nameOf(idb), what: a };
      }
      case 'hut': {
        if (e.map[player] === NO_MAP) return { ok: false, code: 'nothing' };
        const c = w.survival.playerHut(player);
        return { ok: c === 'built', code: c };
      }
    }
    return null;
  }

  /** Horses in a view, for the TV: [id, scale x100, quality, coat, tamed 0/1, mine 0/1, name]. */
  horsesAround(m: number, x: number, y: number, r: number, me: number): unknown[] {
    const w = this.world, e = w.e, out: unknown[] = [], myId = me >= 0 ? e.id(me) : -2;
    for (const [id, h] of w.horses.h) {
      const s = e.slot(id);
      if (s < 0 || e.map[s] !== m || Math.abs(e.x[s]! - x) > r || Math.abs(e.y[s]! - y) > r) continue;
      out.push([id, Math.round(w.horses.scale(h) * 100), h.q, h.coat, h.owner >= 0 ? 1 : 0, h.owner === myId ? 1 : 0, h.name]);
    }
    return out;
  }

  /** What the TV shows on the player's "Me" page. */
  charInfo(i: number): Record<string, unknown> {
    const w = this.world, e = w.e, p = w.profileOf(i)!, now = w.gameSec, y = w.yearSec, id = e.id(i);
    const partner = p.partner >= 0 ? { id: p.partner, name: w.profiles.get(p.partner)?.name ?? '?' } : null;
    const children = w.family.kidsInfo(i); // with their needs: a parent sees and fixes them (imad 2026-11-25)
    const family = Object.entries(p.kin ?? {}).map(([k, role]) => ({ id: Number(k.slice(1)), name: w.profiles.get(Number(k.slice(1)))?.name ?? '?', role, rel: w.family.relation(id, Number(k.slice(1))) }));
    const asks = w.family.asks.filter((x) => x.to === id).map((x) => ({ from: x.from, name: w.profiles.get(x.from)?.name ?? '?', role: x.role }));
    const left = p.chose ? Math.max(0, (p.sexAt ?? 0) + SEX_WEEK_MS - Date.now()) : 0;
    return {
      name: p.name, sex: p.sex, skin: p.skin ?? 1, chose: !!p.chose, sexDays: Math.ceil(left / 86400_000), auto: !!p.auto,
      rules: (p.rules ?? []).map((r) => r.text), max: MAX_RULES, xp: p.xp ?? 0, level: levelOf(p.xp), goal: w.tasks.progress(id),
      goals: (p.goals ?? []).slice(-5).reverse(), partner, children, family, asks, expecting: p.pregnant ? Math.max(0, Math.ceil((p.pregnant.due - now) / 3600)) : -1,
      traits: Object.fromEntries(TRAIT_KEYS.filter((k) => k !== 'metabolism').map((k) => [k, Math.round(p.traits[k] * 100)])),
      hp: Math.round(e.hp[i]!),
      horses: w.horses.mine(i).map((h) => w.horses.info(h, i)), tame: tameLevel(w.horses.skill.get(id)), tamePower: Math.round(w.horses.power(i) * 100),
    };
  }

  personInfo(id: number, seer: boolean): Record<string, unknown> | null {
    const w = this.world, e = w.e, p = w.profiles.get(id);
    if (!p) return null;
    const i = e.slot(id), r2 = (v: number) => Math.round(v * 100) / 100;
    const base: Record<string, unknown> = {
      id, name: p.name, sex: p.sex, age: Math.floor(ageOf(p, w.gameSec, w.yearSec)), alive: i >= 0, cause: p.cause,
      personality: p.personality, generation: p.generation, pregnant: !!p.pregnant,
      partner: p.partner >= 0 ? this.nameOf(p.partner) : null, parents: p.parents.map((x) => this.nameOf(x)),
      children: [...w.profiles].filter(([, q]) => q.parents.includes(id)).map(([, q]) => q.name),
      traits: Object.fromEntries(Object.entries(p.traits).map(([k, v]) => [k, k === 'lifespan' ? Math.round(v) : r2(v)])),
      goal: w.tasks.progress(id), level: levelOf(p.xp), xp: p.xp ?? 0, isPlayer: !!p.player,
      stage: stageOf(ageOf(p, w.gameSec, w.yearSec)), siblings: w.family.siblingsOf(id).map((x) => this.nameOf(x)),
      chosen: Object.entries(p.kin ?? {}).map(([k, role]) => ({ name: this.nameOf(Number(k.slice(1))), role })),
      carer: i >= 0 && w.family.carer[i]! >= 0 ? this.nameOf(e.id(w.family.carer[i]!)) : null, held: i >= 0 && w.family.carried[i]! >= 0,
    };
    if (i >= 0) Object.assign(base, { act: e.act[i], hunger: Math.round(e.hunger[i]!), thirst: Math.round(e.thirst[i]!), tired: Math.round(e.tired[i]!), lonely: Math.round(e.lonely[i]!), hp: Math.round(e.hp[i]!), carry: e.carry[i], inv: w.survival.inv(i) });
    if (seer && p.mind) {
      const m = p.mind;
      base.mind = { mood: m.mood, plan: m.plan && m.plan.until > w.gameSec ? { act: m.plan.act, with: m.plan.with !== undefined ? this.nameOf(m.plan.with) : null, why: m.plan.why } : null, memory: m.summary, said: m.said?.text ?? null, recent: m.notes.slice(-5).map((n) => n.text) };
    }
    return base;
  }

  /** Thought bubbles: [id, act, target name, metres to go, wish act, wish with, why, mood, said] for people near (x, y). */
  mindsAround(m: number, x: number, y: number, r: number): unknown[] {
    const w = this.world, e = w.e, out: unknown[] = [];
    for (let i = 0; i < e.hi && out.length < 40; i++) {
      if (e.kind[i] !== Kind.Agent || e.map[i] !== m || Math.abs(e.x[i]! - x) > r || Math.abs(e.y[i]! - y) > r) continue;
      const it = w.brain.intent(i), p = w.profileOf(i);
      const act = it.act;
      const to = (act === 6 && it.to >= 0) ? this.nameOf(it.to) : '';
      const plan = p?.mind?.plan && p.mind.plan.until > w.gameSec ? p.mind.plan : undefined;
      const task = w.tasks.describe(e.id(i));
      const g = w.tasks.progress(e.id(i));
      out.push([e.id(i), act, to, Math.round(it.dist), task ? 'task' : plan ? plan.act : '', !task && plan?.with !== undefined ? this.nameOf(plan.with) : '', task || (plan?.why ?? ''), p?.mind?.mood ?? '', p?.mind?.said && w.gameSec - p.mind.said.at < 1800 ? p.mind.said.text : '',
        g ? g.pct : -1, g ? (g.from === 'myself' ? '' : g.from === 'owner' ? '!' : g.from) : '']);
    }
    return out;
  }

  private nameOf(id: number): string { return this.world.profiles.get(id)?.name ?? `#${id & 0xffff}`; }

  /** A person's live state for the panel. */
  agentInfo(i: number): Record<string, unknown> {
    const w = this.world, e = w.e, p = w.profileOf(i) as Profile | undefined, id = e.id(i);
    const r1 = (v: number) => Math.round(v * 10) / 10;
    return {
      id, alive: true, name: p?.name ?? `#${i}`, sex: p?.sex, age: p ? Math.floor(ageOf(p, w.gameSec, w.yearSec)) : 0,
      map: e.map[i] === NO_MAP ? null : w.maps[e.map[i]!]!.def.id, x: r1(e.x[i]!), y: r1(e.y[i]!), act: e.act[i],
      hunger: r1(e.hunger[i]!), thirst: r1(e.thirst[i]!), tired: r1(e.tired[i]!), lonely: r1(e.lonely[i]!), hp: r1(e.hp[i]!),
      task: w.tasks.describe(id) || null, kills: killsOf(p),
      goal: w.tasks.progress(id), xp: p?.xp ?? 0, level: levelOf(p?.xp), goals: (p?.goals ?? []).slice(-5).reverse(),
      order: (() => { const o = w.brain.orderOf(i); return o.kind ? (o.kind === 'come' || o.kind === 'follow' || o.kind === 'bring' ? `${o.kind === 'come' ? 'go to' : o.kind === 'bring' ? 'bring food to' : 'follow'} ${this.planner.whoName(o.who)}` : o.kind === 'job' ? null : o.kind === 'act' ? ['stand', 'wander', 'drink', 'eat', 'forage', 'sleep', 'talk', 'travel', 'rest'][o.act] ?? 'act' : 'wait here') : null; })(),
      player: p?.player ?? null, auto: !!p?.auto, manual: e.kind[i] === Kind.Player, online: p?.player ? this.net.online(p.player) : false,
      carry: e.carry[i], inv: w.survival.inv(i), home: w.survival.homes.describe(e.id(i)), lod: e.lod[i], child: !!(e.flags[i]! & 32), pregnant: !!p?.pregnant, partner: p && p.partner >= 0 ? this.nameOf(p.partner) : null, talkingTo: e.act[i] === 6 && e.target[i]! >= 0 ? this.nameOf(e.target[i]!) : null,
    };
  }

  /** Control panel commands. A failure is answered to the panel and kept in the error log (not the "are you sure?" ones). */
  async adminCmd(c: AdminCmd, who: string, owner = false): Promise<unknown> {
    try { return await this.runAdmin(c, who, owner); } catch (err) {
      const msg = String((err as Error)?.message ?? err);
      if (!msg.startsWith(CONFIRM)) {
        const { cmd, ...args } = (c ?? {}) as Record<string, unknown>;
        // A bad value is the sender's mistake (warn); anything else is the server's (error, with where it happened).
        const mine = /^(bad |unknown command|no such |only the owner|nobody |who should)/.test(msg);
        this.errors.add(mine && !msg.startsWith('unknown command') ? 'warn' : 'error', 'admin', `${String(cmd)}: ${msg}`, { cmd, who, args }, mine ? undefined : (err as Error)?.stack);
      }
      throw err;
    }
  }

  /** Every value is checked here, whatever the client sent. */
  private async runAdmin(c: AdminCmd, who: string, owner = false): Promise<unknown> {
    const w = this.world;
    // lo..hi = the usual range. Outside it the panel asks "are you sure?" (error 'confirm: ...') and sends the command again
    // with force: true; the admin may then set anything inside `hard` (what the engine can hold: default >= 0 when lo >= 0).
    const force = (c as { force?: unknown } | undefined)?.force === true;
    // pct = shown to the owner as a percentage (the panel edits people in %): the factor from the stored value to %.
    const num = (v: unknown, lo: number, hi: number, name: string, hard: [number, number] = [lo >= 0 ? 0 : -1e12, 1e12], pct = 0) => {
      if (typeof v !== 'number' || !Number.isFinite(v) || v < hard[0] || v > hard[1]) throw new Error(`bad ${name}`);
      const show = (x: number) => (pct ? `${Math.round(x * pct * 10) / 10} %` : String(x));
      if ((v < lo || v > hi) && !force) throw new Error(`${CONFIRM}${name} = ${show(v)} is outside the usual ${show(lo)} to ${show(hi)}`);
      return v;
    };
    const fixed = (v: unknown, lo: number, hi: number, name: string) => num(v, lo, hi, name, [lo, hi]);
    const mapOf = (id: unknown) => { const m = w.mapIndex.get(String(id)); if (m === undefined) throw new Error('bad map'); return m; };
    const reads = READS.has(c?.cmd) || (READ_BARE.has(c?.cmd) && Object.keys(c).every((k) => k === 'cmd' || k === 'id'));
    if (!reads) w.emit('admin', { who, cmd: c.cmd }); // only changes are logged (the panel polls the reads)
    switch (c?.cmd) {
      case 'speed': this.loop.setSpeed(num(c.speed, 0.01, this.cfg.maxSpeed, 'speed', [0.001, 1e4]), force); return this.clock();
      case 'clockSpeed': { // how fast the game clock runs by day, by night and while every player sleeps (x on the usual clock)
        const m = w.clockMul;
        for (const k of ['day', 'night', 'sleep'] as const) if (c[k] !== undefined) m[k] = num(c[k], 0.25, 20, `${k} clock speed`, [0.01, 1000]);
        this.db.setMeta('clock_mul', JSON.stringify(m));
        w.updateClock(true);
        return this.clockSpeeds();
      }
      case 'weather': { // seasons and weather: { seasonDays?, season? (0-3 = jump there), set? (sky) + hours?, k?, cold? (on / off), clear? (end the admin's sky) }
        const wx = w.weather;
        if (c.seasonDays !== undefined) {
          const f = wx.yearF(), sd = num(c.seasonDays, 1, 30, 'season length (game days)', [0.05, 1000]);
          // Keep today's place in the year when the length changes.
          wx.cfg.seasonDays = sd;
          wx.cfg.shift = (f - wx.yearF()) * 4 * sd + wx.cfg.shift;
        }
        if (c.cold !== undefined) wx.cfg.cold = !!c.cold;
        if (c.season !== undefined) wx.jumpTo(fixed(c.season, 0, 3, 'season'));
        if (c.set !== undefined) {
          if (!WEATHERS.includes(c.set)) throw new Error('bad weather (clear, cloudy, rain, storm, snow, blizzard, fog)');
          wx.set(c.set, c.hours === undefined ? 6 : num(c.hours, 0.25, 72, 'hours', [0.01, 10000]), c.k === undefined ? undefined : fixed(c.k, 0, 1, 'strength'));
        }
        if (c.clear) { wx.forced = 0; wx.until = 0; }
        this.db.setMeta('weather_cfg', JSON.stringify(wx.cfg));
        w.weather.update();
        return this.weatherInfo();
      }
      case 'pause': this.loop.paused = !!c.paused; return this.clock();
      case 'snapshot': this.snapshot(); return { at: this.lastSnapshotAt };
      case 'stats': return this.stats();
      case 'spawn': {
        const m = mapOf(c.map), def = w.maps[m]!.def;
        const s = w.freeSpot(m, fixed(c.x, 0, def.w, 'x'), fixed(c.y, 0, def.h, 'y'));
        if (!s) throw new Error('no room there');
        if (w.e.countKind(Kind.Agent) >= 100) throw new Error('population cap (100)');
        w.makeRoom(1);
        const i = w.spawnAgent(m, s.x, s.y);
        if (i < 0) throw new Error(w.fullText());
        return { id: w.e.id(i), name: w.profiles.get(w.e.id(i))?.name ?? '' };
      }
      case 'remove': {
        const i = w.e.slot(fixed(c.id, 0, 2 ** 31, 'id'));
        if (i < 0) throw new Error('no such entity');
        w.remove(i, 'admin');
        return { ok: true };
      }
      case 'shoot': {
        const m = mapOf(c.map), def = w.maps[m]!.def;
        const i = w.shoot(m, fixed(c.x, 0, def.w, 'x'), fixed(c.y, 0, def.h, 'y'), fixed(c.dx, -1e3, 1e3, 'dx'), fixed(c.dy, -1e3, 1e3, 'dy'));
        return { id: i >= 0 ? w.e.id(i) : 0 };
      }
      case 'damageTile': {
        const m = mapOf(c.map), t = w.maps[m]!.tiles;
        const broke = t.damage(fixed(c.tx, 0, t.w - 1, 'tx') | 0, fixed(c.ty, 0, t.h - 1, 'ty') | 0, fixed(c.amount, 0, 255, 'amount'));
        return { broke };
      }
      case 'pairings': return this.players.pendingList();
      case 'autoJoin': {
        if (typeof c.on === 'boolean') { this.db.setMeta('auto_join', c.on ? '1' : '0'); this.log.info(c.on ? 'TVs join by themselves' : 'TVs need approval', { who }); }
        return { on: this.db.getMeta('auto_join') !== '0' };
      }
      case 'accounts': return { signIn: this.auth.enabled, project: this.auth.projectId, list: this.accounts.list().map((a) => ({ ...a, online: !!a.name && this.net.online(a.name), tv: !!a.name && this.players.has(a.name) })), free: [...this.net.residents.keys()].filter((n) => !this.accounts.byName(n)).sort() };
      case 'approve': {
        if (typeof c.code !== 'string' || !/^\d{6}$/.test(c.code)) throw new Error('bad code');
        return this.players.approve(c.code, typeof c.name === 'string' ? c.name : undefined);
      }
      case 'deny': this.players.deny(String(c.code)); return { ok: true };
      case 'players': {
        const s = this.seers(), list = this.players.list(), have = new Set(list.map((p) => p.name.toLowerCase()));
        // Characters whose TV link is gone ("name (2)" left behind, a TV that paired again): listed too, so they can be deleted.
        const orphans = [...this.net.residents.keys()].filter((n) => !have.has(n.toLowerCase())).map((name) => ({ name, dev: 'no TV linked', created: 0, lastSeen: 0, fromEnv: false, noTv: true }));
        return [...list, ...orphans].map((p) => ({ ...p, seer: s.has(p.name.toLowerCase()) }));
      }
      case 'seer': {
        const name = String(c.name ?? '').trim().toLowerCase();
        if (!name) throw new Error('bad name');
        const s = this.seers();
        if (c.on === true) s.add(name); else s.delete(name);
        this.db.setMeta('seers', JSON.stringify([...s]));
        return { seers: [...s] };
      }
      case 'linkPlayer': { // imad 2026-11-21: attach my character to my account to get the owner's abilities
        const uid = String(c.uid ?? ''), name = String(c.name ?? '').trim();
        if (!this.accounts.get(uid)) throw new Error('no such account');
        if (name && !this.net.residents.has(name)) throw new Error('that player has no character');
        this.accounts.link(uid, name);
        return { uid, name };
      }
      case 'mergePlayer': { // two names of one person (imad 2026-11-20: "imad (2)" -> "imad"): one character, one bag, every TV under "into"
        const from = String(c.from ?? '').trim(), into = String(c.into ?? '').trim();
        if (!from || !into || from === into) throw new Error('from and into are needed');
        const e = w.e, a = this.net.residents.get(from), b = this.net.residents.get(into);
        const ia = a !== undefined ? e.slot(a) : -1, ib = b !== undefined ? e.slot(b) : -1;
        // The bag: added together.
        const bagA = w.survival.pinv.get(from);
        if (bagA) { const bagB = w.survival.pinv.get(into) ?? {}; for (const [k, n] of Object.entries(bagA)) bagB[k as keyof typeof bagB] = Math.min(20, (bagB[k as keyof typeof bagB] ?? 0) + (n ?? 0)); w.survival.pinv.set(into, bagB); w.survival.pinv.delete(from); }
        this.mapView.merge(from, into); // the map's marks too
        // The character in use ("from", unless keep: 'into') stays, with its place, look and family; the other goes.
        const keepInto = c.keep === 'into' && ib >= 0;
        if (keepInto) { if (ia >= 0) { w.profiles.delete(a!); w.remove(ia, 'merged'); } }
        else if (ia >= 0) {
          if (ib >= 0) { w.profiles.delete(b!); w.remove(ib, 'merged'); }
          const p = w.profileOf(ia); if (p) { p.player = into; p.name = into; }
          this.net.residents.set(into, a!);
          const pos = this.db.getMeta('pos:' + from); if (pos) this.db.setMeta('pos:' + into, pos);
        }
        this.net.residents.delete(from);
        const pos = this.db.getMeta('pos:' + from);
        if (pos && !this.db.getMeta('pos:' + into)) this.db.setMeta('pos:' + into, pos);
        this.db.delMeta('pos:' + from);
        if (this.players.has(into)) this.players.revoke(into); // an old TV under that name: the TV in use takes it
        const renamed = this.players.rename(from, into);
        const again = this.net.reconnect(from) + this.net.reconnect(into);
        w.emit('merged', { from, into });
        return { renamed, characters: keepInto ? 'kept into' : ia >= 0 ? 'from kept, now called into' : 'none to move', reconnected: again };
      }
      case 'resetBuildings': { // imad 2026-11-25: "a button to reset the world from all buildings and start over"; a backup first
        const mapId = String(c.map ?? '').trim(), m = mapId ? w.maps.findIndex((x) => x.def.id === mapId) : -1;
        if (mapId && m < 0) throw new Error(`no map called ${mapId}`);
        this.snapshot();
        const backup = this.control.backup('before-reset');
        const r = w.survival.resetBuildings(m);
        this.snapshot();
        return { ...r, map: mapId || 'all', backup };
      }
      case 'playerDelete': { // imad 2026-11-25: "an option to delete players too": TV link, character, bag, place, account link; a backup first
        const name = String(c.name ?? '').trim();
        if (!name) throw new Error('bad name');
        const known = [...this.net.residents.keys()].find((k) => k.toLowerCase() === name.toLowerCase()) ?? (this.players.has(name) ? name : '');
        if (!known) throw new Error(`no player called ${name}`);
        if (this.players.list().some((p) => p.fromEnv && p.name === known)) throw new Error('that player comes from VIEWER_TOKENS in .env: remove it there');
        this.snapshot();
        const backup = this.control.backup('before-delete');
        const kicked = this.net.kick(known);
        this.players.revoke(known);
        const id = this.net.residents.get(known), i = id !== undefined ? w.e.slot(id) : -1;
        if (i >= 0 && (w.e.kind[i] === Kind.Player || w.e.kind[i] === Kind.Agent)) { w.remove(i, 'deleted'); w.profiles.delete(id!); }
        if (id !== undefined) w.away.delete(id);
        this.net.residents.delete(known);
        w.survival.pinv.delete(known);
        this.mapView.forget(known);
        this.db.delMeta('pos:' + known);
        const s = this.seers(); if (s.delete(known.toLowerCase())) this.db.setMeta('seers', JSON.stringify([...s]));
        const acct = this.accounts.byName(known); if (acct) this.accounts.link(acct.uid, '');
        w.emit('playerDeleted', { name: known, who });
        this.log.info('player deleted', { name: known, who, backup });
        this.snapshot();
        return { name: known, backup, kicked, character: i >= 0 };
      }
      case 'revoke': {
        const ok = this.players.revoke(String(c.name));
        if (!ok) throw new Error('no such player (players from .env are removed there)');
        return { kicked: this.net.kick(String(c.name)) };
      }
      case 'tunnel': return this.tunnel.status();
      case 'tunnelSwitch': {
        const ok = ['ngrok', 'tailscale', 'cloudflare', 'cloudflare-quick', 'none'];
        if (!ok.includes(String(c.provider))) throw new Error('bad provider');
        const st = await this.tunnel.switchTo(c.provider);
        this.db.setMeta('tunnel_provider', c.provider);
        return st;
      }
      case 'travel': {
        w.travelOpen = c.open === true;
        this.db.setMeta('travel_open', w.travelOpen ? '1' : '0');
        w.land.block(!w.travelOpen);
        this.log.info(w.travelOpen ? 'travel opened' : 'travel closed', { who });
        return { open: w.travelOpen };
      }
      case 'ai': return this.ai.status();
      case 'aiModels': return this.ai.models();
      case 'aiSet': {
        this.endFallback();
        const s = this.ai.apply({ provider: c.provider, model: c.model, ollamaUrl: c.ollamaUrl });
        this.brains.syncActive(s);
        this.db.setMeta('ai', JSON.stringify({ ...s, key: undefined }));
        this.log.info('ai changed', { who, provider: s.provider, model: this.ai.model });
        return this.ai.status();
      }
      case 'brains': return this.brainsView();
      case 'brainSave': {
        const b = this.brains.put({ id: c.id, name: c.name, provider: c.provider as Provider, url: c.url, model: c.model, key: c.key, addKey: c.addKey, removeKey: c.removeKey }, (s) => this.ai.check(s));
        if (b.id === this.brains.active.id) this.useBrain(b.id, who);
        else if (b.id === this.ai.tag && this.failover.on()) this.ai.apply(this.brains.settingsOf(b)); // the fallback thinking now: its new settings at once
        this.log.info('brain saved', { who, id: b.id, name: b.name, provider: b.provider });
        return { ...this.brainsView(), saved: b.id };
      }
      case 'brainUse': {
        this.useBrain(String(c.id), who);
        return { ...this.brainsView(), ai: this.ai.status() };
      }
      case 'brainDelete': {
        const id = String(c.id);
        this.brains.remove(id);
        if (this.ai.tag === id) this.endFallback();
        this.brainStats.drop(id);
        return this.brainsView();
      }
      case 'brainFallback': {
        const id = String(c.id ?? '');
        this.brains.setFallback(id);
        if (!id || this.ai.tag !== id) this.endFallback();
        this.log.info('fallback brain', { who, id: id || 'none' });
        return this.brainsView();
      }
      case 'brainModels': case 'brainTest': {
        // A saved brain (id) and / or the editor's unsaved values, tried on a separate AI object: the one in use is untouched.
        const base = c.id ? this.brains.get(String(c.id)) : undefined;
        if (c.id && !base) throw new Error('no such brain');
        const tmp = new Ai({ ...this.cfg.ai, provider: 'none' }, this.aiKeys(), this.log);
        tmp.apply({ provider: (c.provider ?? base?.provider ?? 'none') as Provider, ollamaUrl: c.url ?? base?.url ?? '', model: c.model ?? base?.model ?? '', key: c.key ?? base?.key ?? '' });
        if (c.cmd === 'brainModels') return tmp.models();
        const r = await tmp.generate({ system: 'You are a person living in a post-apocalyptic world. Answer briefly.', prompt: 'In one short sentence, say hello as a survivor in a ruined town.', maxTokens: 120 });
        return { text: r.text.slice(0, 1000), ms: r.ms, provider: r.provider, model: r.model };
      }
      case 'aiTest': {
        const prompt = typeof c.prompt === 'string' && c.prompt.trim() ? c.prompt.slice(0, 500) : 'In one short sentence, say hello as a survivor in a ruined town.';
        const r = await this.ai.generate({ system: 'You are a person living in a post-apocalyptic world. Answer briefly.', prompt, maxTokens: 120 });
        return { text: r.text.slice(0, 1000), ms: r.ms, provider: r.provider, model: r.model };
      }
      case 'agents': {
        const out = [];
        for (let i = 0; i < w.e.hi; i++) if (w.e.kind[i] === Kind.Agent) out.push(this.agentInfo(i));
        // Players' characters too (they live in the world 24/7): people can be sent to them.
        const seen = new Set(out.map((o) => o.id));
        for (const [name, i] of this.net.characters()) {
          if (seen.has(w.e.id(i))) continue;
          const e = w.e, r1 = (v: number) => Math.round(v * 10) / 10;
          out.push({ id: e.id(i), player: true, name, online: this.net.online(name), alive: true, map: e.map[i] === NO_MAP ? null : w.maps[e.map[i]!]!.def.id, x: r1(e.x[i]!), y: r1(e.y[i]!), act: e.act[i], asleep: (e.flags[i]! & EFlag.Sleeping) !== 0 } as never);
        }
        return out;
      }
      case 'clans': {
        const nm = (id: number) => this.nameOf(id);
        return { clans: w.clans.clans.map((c) => ({ id: c.id, name: c.name, map: w.maps[c.map]?.def.id ?? '', leader: nm(c.leader), leaderId: c.leader, home: [Math.round(c.hx), Math.round(c.hy)], since: c.at,
          founder: c.founder !== undefined ? nm(c.founder) : '', approval: w.clans.approval(c), order: c.order ?? '', lastVote: c.lastVote ?? c.at,
          vote: c.vote ? { end: c.vote.end, why: c.vote.why, cands: c.vote.cands.map((k) => nm(k)), votes: c.vote.ballots.length } : null,
          result: c.result ? { at: c.result.at, winner: nm(c.result.winner), old: nm(c.result.old), tally: c.result.tally.map(([k, n]) => [nm(k), n]) } : null,
          members: c.members.map((id) => ({ id, name: nm(id), loyalty: Math.round(w.clans.loyalty(id) * 100), respect: Math.round(w.clans.respect(id, c) * 10) / 10 })), rivals: w.clans.rivals(c).map((r) => ({ name: r.clan.name, tension: Math.round(r.tension * 10) / 10 })) })), now: w.gameSec };
      }
      case 'clanVote': { // the owner calls an election in a clan
        const cl = w.clans.byId(fixed(c.id, 0, 1e6, 'id'));
        if (!cl) throw new Error('no such clan');
        if (!w.clans.callVote(cl, 'the voice from the sky asked for a vote')) throw new Error('a vote is already on (or too few members)');
        return { ok: true, end: cl.vote!.end };
      }
      case 'quests': { // the town's teachers and everyone's quests
        const people: { id: number; name: string; player: boolean; done: number; cur: string; n: number; need: number; ready: boolean }[] = [];
        for (let i = 0; i < w.e.hi; i++) {
          if (w.e.kind[i] !== Kind.Agent && w.e.kind[i] !== Kind.Player) continue;
          const p = w.profileOf(i); if (!p) continue;
          people.push({ id: w.e.id(i), name: p.name, player: !!p.player, ...w.quests.summary(w.e.id(i)) });
        }
        return { npcs: w.quests.list(), quests: QUESTS.map((q) => ({ id: q.id, title: q.title.en, npc: q.npc, ask: q.ask.en, lesson: q.lesson, xp: q.reward.xp })), people };
      }
      case 'agent': {
        const id = fixed(c.id, 0, 2 ** 31, 'id'), i = w.e.slot(id);
        const p = w.profiles.get(id);
        if (!p) throw new Error('no such person');
        const like = `%${id}%`;
        const events = (this.db.sql.prepare('SELECT tick, game_sec, kind, data FROM events WHERE data LIKE ? ORDER BY id DESC LIMIT 40').all(like) as { game_sec: number; kind: string; data: string }[])
          .filter((r) => { try { const d = JSON.parse(r.data) as Record<string, unknown>; return d.id === id || d.a === id || d.b === id; } catch { return false; } })
          .map((r) => ({ at: r.game_sec, kind: r.kind, data: JSON.parse(r.data) as unknown }));
        const F = w.family, stage = stageOf(ageOf(p, w.gameSec, w.yearSec));
        const family = { parents: F.parentsOf(id).map((x) => this.nameOf(x)), children: F.childrenOf(id).map((cid) => this.nameOf(cid)), partner: p.partner >= 0 ? this.nameOf(p.partner) : null,
          siblings: F.siblingsOf(id).map((x) => this.nameOf(x)), stage, chosen: Object.entries(p.kin ?? {}).map(([k, role]) => ({ id: Number(k.slice(1)), name: this.nameOf(Number(k.slice(1))), role })),
          carer: i >= 0 && F.carer[i]! >= 0 ? this.nameOf(w.e.id(F.carer[i]!)) : null, held: i >= 0 && F.carried[i]! >= 0,
          kids: i >= 0 ? F.kidsInfo(i) : [] };
        const clan = w.clans.clanOf(id); const clanInfo = clan ? { name: clan.name, leader: this.nameOf(clan.leader), approval: w.clans.approval(clan), respect: Math.round(w.clans.respect(id, clan) * 10) / 10, loyalty: Math.round(w.clans.loyalty(id) * 100), rivals: w.clans.rivals(clan).map((r) => `${r.clan.name} (${Math.round(r.tension)}/10)`) } : null;
        const talk = this.planner.convo.of(id).map((l) => ({ at: l.at, from: l.from, to: l.to, fromName: l.from === -2 ? 'The owner' : l.from < 0 ? 'Someone' : this.nameOf(l.from), toName: l.to < 0 ? '' : this.nameOf(l.to), text: l.text }));
        return { ...(i >= 0 ? this.agentInfo(i) : { id, alive: false, name: p.name }), profile: p, age: ageOf(p, w.gameSec, w.yearSec), family, events, talk, clan: clanInfo, quests: w.quests.summary(id), now: w.gameSec, hpMax: w.sc.agents.hp };
      }
      case 'agentSet': {
        const i = w.e.slot(fixed(c.id, 0, 2 ** 31, 'id'));
        if (i < 0 || (w.e.kind[i] !== Kind.Agent && !w.isChar(i))) throw new Error('no such person');
        const p = w.profileOf(i)!, e = w.e;
        for (const [k, v] of Object.entries(c.set ?? {})) {
          if (k === 'name') { const n = String(v).trim().slice(0, 30); if (!n) throw new Error('bad name'); p.name = n; continue; }
          if (k === 'personality') { p.personality = String(v).split(',').map((s) => s.trim()).filter(Boolean).slice(0, 5); continue; }
          if (k === 'hunger' || k === 'thirst' || k === 'tired' || k === 'lonely') { e[k][i] = fixed(v, 0, 100, k); continue; }
          if (k === 'hp') { e.hp[i] = num(v, 1, w.sc.agents.hp, 'health', [1, 1e6], 100 / w.sc.agents.hp); continue; }
          if (k === 'carry') { e.carry[i] = num(v, 0, 20, k, [0, 255]) | 0; continue; }
          if (k === 'inv' && v && typeof v === 'object') { // the bag: { wood: 14, stone: 4 } (0 = none)
            const bag = w.survival.inv(i);
            for (const [r, n] of Object.entries(v as Record<string, unknown>)) { if (!/^[a-z]{2,16}$/.test(r)) throw new Error(`bad item ${r}`); const q = fixed(n, 0, 30, r) | 0; if (q) bag[r] = q; else delete bag[r]; }
            continue;
          }
          if ((TRAIT_KEYS as readonly string[]).includes(k)) { p.traits[k as (typeof TRAIT_KEYS)[number]] = num(v, 0, 1, k, undefined, 100); continue; }
          if (k === 'lifespan') { p.traits.lifespan = num(v, 1, 150, k); continue; }
          if (k === 'age') { if (p.player) throw new Error("players' characters stay 25"); p.born = w.gameSec - num(v, 0, 100, k, [0, 1000]) * w.yearSec; const ag = Number(v); e.flags[i] = (e.flags[i]! & ~(EFlag.Child | EFlag.Small)) | (ag < 16 ? EFlag.Child : 0) | (ag < 3 ? EFlag.Small : 0); continue; } // years
          if (k.startsWith('bag.')) { const inv = w.survival.inv(i), it = k.slice(4); inv[it] = fixed(v, 0, it === 'arrows' ? 30 : 20, k) | 0; if (!inv[it]) delete inv[it]; continue; } // bag: { 'bag.ore': 5 }
          throw new Error(`can't change ${k}`);
        }
        e.nextThink[i] = w.tick; // decide again with the new values
        return this.agentInfo(i);
      }
      case 'kin': { // the owner sets a family role between two people: b is <role> to a (child | sibling | parent | '' = none)
        const a = fixed(c.a, 0, 2 ** 31, 'a'), b = fixed(c.b, 0, 2 ** 31, 'b');
        const role = c.role === '' || c.role === null ? null : String(c.role);
        if (role !== null && role !== 'child' && role !== 'sibling' && role !== 'parent') throw new Error('role: child, sibling or parent');
        const r = w.family.setRole(a, b, role as 'child' | 'sibling' | 'parent' | null);
        if (r !== true) throw new Error(r);
        return { ok: true, relation: w.family.relation(a, b) };
      }
      case 'agentMove': {
        const i = w.e.slot(fixed(c.id, 0, 2 ** 31, 'id'));
        if (i < 0 || (w.e.kind[i] !== Kind.Agent && !w.isChar(i))) throw new Error('no such person');
        const m = mapOf(c.map), def = w.maps[m]!.def;
        w.place(i, m, c.x !== undefined ? fixed(c.x, 0, def.w, 'x') : def.w / 2, c.y !== undefined ? fixed(c.y, 0, def.h, 'y') : def.h / 2);
        // A player's TV follows its character there (else its camera stays behind and loses it).
        if (w.isChar(i)) this.net.noticeTo(i, 'did', { a: 'tp', ok: true, code: 'tp', name: '', x: w.e.x[i], y: w.e.y[i], map: def.id });
        return this.agentInfo(i);
      }
      case 'kill': {
        const i = w.e.slot(fixed(c.id, 0, 2 ** 31, 'id'));
        if (i < 0 || w.e.kind[i] !== Kind.Agent) throw new Error('no such person');
        w.emit('death', { id: w.e.id(i), cause: 'killed by the owner', map: w.e.map[i] === NO_MAP ? '' : w.maps[w.e.map[i]!]!.def.id, x: w.e.x[i], y: w.e.y[i] });
        w.remove(i, 'killed by the owner');
        return { ok: true };
      }
      case 'supply': {
        const m = mapOf(c.map), def = w.maps[m]!.def;
        const x = c.x !== undefined ? fixed(c.x, 0, def.w, 'x') : w.rng.range(def.w * 0.3, def.w * 0.7);
        const y = c.y !== undefined ? fixed(c.y, 0, def.h, 'y') : w.rng.range(def.h * 0.3, def.h * 0.7);
        const n = w.brain.drop(m, x, y, c.n !== undefined ? num(c.n, 1, 30, 'n', [1, 2000]) : 8);
        w.emit('supply', { map: def.id, x, y, n });
        return { x, y, n };
      }
      case 'difficulty': {
        w.brain.life.difficulty = num(c.value, 0.25, 3, 'difficulty', [0, 1000]);
        this.db.setMeta('difficulty', String(w.brain.life.difficulty));
        return { value: w.brain.life.difficulty };
      }
      case 'coder': this.ownerOnly(owner); return { ...this.agent.view(), brains: this.brains.view().list.map((b) => ({ id: b.id, name: b.name, provider: b.provider, model: b.model })), brainId: this.agentBrain()?.id ?? '' };
      case 'coderAsk': this.ownerOnly(owner); this.agent.ask(String(c.text ?? ''), who); return this.agent.view();
      case 'coderRun': {
        this.ownerOnly(owner);
        const p = await this.agent.execute(fixed(c.id, 1, 1e9, 'id'), who, typeof c.code === 'string' ? c.code : undefined);
        return { proposal: p, ...this.agent.view() };
      }
      case 'coderCancel': this.ownerOnly(owner); this.agent.cancel(fixed(c.id, 1, 1e9, 'id')); return this.agent.view();
      case 'coderUndo': {
        this.ownerOnly(owner);
        const r = await this.agent.undo(fixed(c.id, 1, 1e9, 'id'));
        if (r.restart) this.restartSoon(who);
        return { ...r, ...this.agent.view() };
      }
      case 'coderReset': this.ownerOnly(owner); this.agent.reset(); return this.agent.view();
      case 'coderBrain': { this.ownerOnly(owner); if (!this.brains.get(String(c.id))) throw new Error('no such brain'); this.db.setMeta('agent_brain', String(c.id)); return this.agent.view(); }
      case 'coderAudit': this.ownerOnly(owner); return this.agent.audit(c.limit !== undefined ? fixed(c.limit, 1, 500, 'limit') : 50);
      // The Analysis page (imad 2026-11-25): every stat, and questions to a brain with the log types ticked.
      case 'analysis': return { stats: this.analysis.stats(), types: LOG_TYPES.map(({ id, name, about }) => ({ id, name, about })), defaults: DEFAULT_TYPES,
        brains: this.brains.view().list.map((b) => ({ id: b.id, name: b.name, provider: b.provider, model: b.model })), inUse: this.brains.get(this.ai.tag)?.name ?? this.brains.active.name,
        history: this.analysis.history(), busy: this.analysis.busy };
      case 'analysisPreview': { const p = this.analysis.prompt(String(c.question ?? ''), Array.isArray(c.include) ? c.include.map(String) : []); return { ...p, chars: p.system.length + p.prompt.length }; }
      case 'analysisAsk': return this.analysis.ask(String(c.question ?? ''), Array.isArray(c.include) ? c.include.map(String) : [], String(c.brain ?? ''), who);
      case 'analysisForget': { this.db.setMeta('analysis_log', '[]'); return []; }
      case 'serverInfo': return { ...(await this.control.info()), owner };
      case 'serverLog': return this.control.logTail(c.lines !== undefined ? fixed(c.lines, 1, 2000, 'lines') : 300, String(c.level ?? 'info'), this.log.recent).map((l) => ({ ...l, msg: this.agent.redact(l.msg), data: this.agent.redact(l.data) }));
      case 'serverRestart': this.ownerOnly(owner); return this.restartSoon(who);
      case 'serverBuild': case 'serverUpdate': {
        this.ownerOnly(owner);
        const job = this.control.startJob(c.cmd === 'serverBuild' ? 'build' : 'update', (ok) => { if (ok && c.restart) this.restartSoon(who); });
        return { job };
      }
      case 'backups': return this.control.backups();
      case 'backupMake': this.snapshot(); return { made: this.control.backup('manual'), list: this.control.backups() };
      case 'backupRestore': { this.ownerOnly(owner); this.control.scheduleRestore(String(c.file)); return this.restartSoon(who); }
      case 'backupDelete': this.ownerOnly(owner); this.control.deleteBackup(String(c.file)); return this.control.backups();
      case 'overview': return this.overview();
      case 'history': return this.hist;
      case 'replays': return this.replayList();
      case 'lore': return w.lore.info(); // the Society page: what the people learned and fear
      case 'huts': return { huts: w.survival.homes.where(c.map ? mapOf(c.map) : undefined) };
      case 'mapTiles': {
        const m = mapOf(c.map), mp = w.maps[m]!;
        return { id: mp.def.id, name: mp.def.name, w: mp.tiles.w, h: mp.tiles.h, tiles: mp.tiles.tiles, ...byId(w.sc.tiles), huts: w.survival.homes.where(m) }; // indexed by tile id (ids start at 1: by position they were one off)
      }
      case 'live': { // what moves on one map, for the panel's live map (small arrays, asked every few seconds)
        const m = mapOf(c.map), e = w.e, r1 = (v: number) => Math.round(v * 10) / 10;
        const people: [number, number, number, number, number][] = [], zombies: [number, number][] = [], animals: [number, number, number][] = [], items: [number, number][] = [];
        for (let i = 0; i < e.hi; i++) {
          if (e.map[i] !== m) continue;
          const k = e.kind[i];
          if (k === Kind.Agent) people.push([e.id(i), r1(e.x[i]!), r1(e.y[i]!), e.flags[i]!, e.act[i]!]);
          else if (k === Kind.Threat) zombies.push([r1(e.x[i]!), r1(e.y[i]!)]);
          else if (k === Kind.Animal) animals.push([e.sub[i]!, r1(e.x[i]!), r1(e.y[i]!)]);
          else if (k === Kind.Item) items.push([r1(e.x[i]!), r1(e.y[i]!)]);
        }
        const players = this.net.characters().filter(([, i]) => e.map[i] === m).map(([name, i]) => [name, r1(e.x[i]!), r1(e.y[i]!), this.net.online(name) ? 1 : 0] as const);
        const tw = w.maps[m]!.tiles.w, fires = [...w.survival.fires.keys()].filter((k) => k.startsWith(m + ':')).map((k) => { const t = Number(k.slice(String(m).length + 1)); return [t % tw, Math.floor(t / tw)]; });
        const camp = w.survival.campOf(m);
        return { map: w.maps[m]!.def.id, people, players, zombies, animals, items, fires, camp: camp ? [Math.round(camp.x), Math.round(camp.y)] : null, portals: w.portals.filter((p) => p.from === m).map((p) => [p.id, r1(p.x), r1(p.y)]) };
      }
      case 'people': { // everyone who ever lived (the dead too), for the People screen and family trees
        const out = [];
        for (const [id, p] of w.profiles) {
          const i = w.e.slot(id), alive = i >= 0 && p.died === undefined && (w.e.kind[i] === Kind.Agent || w.e.kind[i] === Kind.Player);
          out.push({ id, name: p.name, sex: p.sex, age: Math.floor(ageOf(p, p.died ?? w.gameSec, w.yearSec)), alive, died: p.died ?? null, cause: p.cause ?? null, generation: p.generation,
            parents: p.parents.map((x) => this.nameOf(x)), partner: p.partner >= 0 ? this.nameOf(p.partner) : null, children: [...w.profiles].filter(([, q]) => q.parents.includes(id)).length,
            personality: p.personality, mood: p.mind?.mood ?? null, rules: p.rules?.length ?? 0, player: p.player ?? null, kills: killsOf(p) });
        }
        return out;
      }
      case 'timeline': {
        const lim = c.limit !== undefined ? fixed(c.limit, 1, 500, 'limit') : 100;
        this.events.flush();
        return this.events.recent(lim, typeof c.kind === 'string' && c.kind ? c.kind : undefined).map((r) => ({ at: r.game_sec, kind: r.kind, data: JSON.parse(r.data) as unknown }));
      }
      case 'life': {
        const L = w.brain.life;
        if (c.yearDays !== undefined) {
          const from = w.yearSec;
          L.yearDays = num(c.yearDays, 1 / 24, 365, 'yearDays', [1 / 1440, 1e5]);
          w.life.rescale(from);
          this.db.setMeta('year_days', String(L.yearDays));
        }
        if (c.maxPopulation !== undefined) { L.maxPopulation = Math.round(num(c.maxPopulation, 1, 100, 'maxPopulation', [0, 1e5])); this.db.setMeta('max_population', String(L.maxPopulation)); }
        return { yearDays: L.yearDays, maxPopulation: L.maxPopulation };
      }
      case 'planner': {
        const r = this.planner.set({ on: c.on, everyGameHours: c.everyGameHours, batch: c.batch, minGapSec: c.minGapSec }, force);
        this.db.setMeta('planner', JSON.stringify(r));
        return this.planner.status();
      }
      case 'aiLog': return { ai: this.ai.status(), planner: this.planner.status(), log: [...this.planner.log].reverse() };
      case 'planNow': {
        const i = w.e.slot(fixed(c.id, 0, 2 ** 31, 'id'));
        if (i >= 0 && w.e.kind[i] === Kind.Player) throw new Error('played by hand: turn their autopilot on (or wait until they watch / leave) to plan for them');
        if (i < 0 || w.e.kind[i] !== Kind.Agent || w.e.map[i] === NO_MAP) throw new Error('no such person here');
        if (!this.ai.status().ready) throw new Error('AI is off: choose Gemini or Ollama in the AI brain card');
        const n = await this.planner.plan([i]);
        const ex = this.planner.log[this.planner.log.length - 1];
        if (!n) throw new Error(ex?.err ?? 'no plan');
        return { plan: w.profiles.get(w.e.id(i))?.mind?.plan, mind: w.profiles.get(w.e.id(i))?.mind };
      }
      case 'chat': {
        const i = w.e.slot(fixed(c.id, 0, 2 ** 31, 'id'));
        if (i < 0 || (w.e.kind[i] !== Kind.Agent && !w.isChar(i))) throw new Error('no such person');
        const text = typeof c.text === 'string' ? c.text.trim().slice(0, 300) : '';
        if (!text) throw new Error('say something');
        return this.planner.chat(i, 'owner', text);
      }
      case 'rules': { // the owner's strict rules: for everyone (no id) or one person; add words, remove by index
        const pid = c.id === undefined || c.id < 0 ? -1 : fixed(c.id, 0, 2 ** 31, 'id');
        const prof = pid >= 0 ? w.profiles.get(pid) : undefined;
        if (pid >= 0 && (!prof || prof.died !== undefined || w.e.slot(pid) < 0)) throw new Error('no such person');
        const list = (): Rule[] => (pid >= 0 ? (prof!.rules ??= []) : w.rules.all);
        if (typeof c.add === 'string' && c.add.trim()) {
          if (list().length >= MAX_RULES) throw new Error(`at most ${MAX_RULES} rules`);
          const r = compileRule(w, c.add.trim(), (n) => this.planner.whoIs(n, pid));
          await this.planner.refineRule(r, pid >= 0 ? prof!.name : 'everyone');
          list().push(r);
          w.emit('ruleSet', { id: pid, text: r.text, forbid: r.forbid.join(','), with: r.withName ?? '' });
        }
        if (c.remove !== undefined) { const k = fixed(c.remove, 0, MAX_RULES - 1, 'remove'); list().splice(k, 1); }
        if (pid >= 0 && prof && !prof.rules?.length) delete prof.rules;
        if (pid < 0) this.db.setMeta('rules_all', JSON.stringify(w.rules.all));
        const people: { id: number; name: string; rules: Rule[] }[] = [];
        for (const [id, p] of w.profiles) if (p.died === undefined && w.e.slot(id) >= 0 && (w.e.kind[w.e.slot(id)] === Kind.Agent || w.isChar(w.e.slot(id)))) people.push({ id, name: p.name, rules: p.rules ?? [] });
        // How each rule was understood, and (orders to DO) how each person keeps it: times done / failed, the last time, why it failed.
        const agents = people.filter((x) => w.e.kind[w.e.slot(x.id)] === Kind.Agent).map((x) => x.id);
        const show = (r: Rule, ids: number[]) => ({ ...r, how: Rules.how(r), kept: w.rules.kept(r, ids) });
        return { all: w.rules.all.map((r) => show(r, agents)), people: people.map((x) => ({ ...x, rules: x.rules.map((r) => show(r, [x.id])) })), max: MAX_RULES, now: w.gameSec };
      }
      case 'zombies': { // the owner's zombie controls: how many each night; the ones out now
        if (c.perNight !== undefined) { w.zombies.perNight = num(c.perNight, 0, 50, 'perNight', [0, 5000]); this.db.setMeta('zombies_night', String(w.zombies.perNight)); }
        if (c.cfg && typeof c.cfg === 'object') {
          const k = c.cfg as Record<string, unknown>, z = w.zombies.cfg;
          w.zombies.setCfg({ hp: k.hp !== undefined ? num(k.hp, 10, 5000, 'health', [1, 1e7]) : z.hp, speed: k.speed !== undefined ? num(k.speed, 0.2, 6, 'speed', [0, 1000]) : z.speed,
            bite: k.bite !== undefined ? num(k.bite, 0, 200, 'attack') : z.bite, sight: k.sight !== undefined ? num(k.sight, 3, 80, 'sight') : z.sight, smell: k.smell !== undefined ? num(k.smell, 10, 400, 'smell') : z.smell }, c.applyNow === true);
          this.db.setMeta('zombie_cfg', JSON.stringify(w.zombies.cfg));
        }
        if (c.clear) w.zombies.clear();
        const now: { id: number; map: string; x: number; y: number; hp: number; stays: boolean }[] = [];
        for (let i = 0; i < w.e.hi; i++) if (w.e.kind[i] === Kind.Threat && w.e.map[i] !== NO_MAP) now.push({ id: w.e.id(i), map: w.maps[w.e.map[i]!]!.def.id, x: Math.round(w.e.x[i]!), y: Math.round(w.e.y[i]!), hp: Math.round(w.e.hp[i]!), stays: w.e.sub[i] === 1 });
        return { perNight: w.zombies.perNight, cfg: w.zombies.cfg, now };
      }
      case 'horses': {
        const list: unknown[] = [];
        for (const [id] of w.horses.h) { const i = w.e.slot(id); if (i < 0 || (c.map !== undefined && w.e.map[i] !== mapOf(c.map))) continue; list.push({ ...w.horses.info(i), map: w.e.map[i] === NO_MAP ? '' : w.maps[w.e.map[i]!]!.def.id, x: Math.round(w.e.x[i]! * 10) / 10, y: Math.round(w.e.y[i]! * 10) / 10, herd: w.horses.h.get(id)!.herd }); }
        return { list, herds: w.horses.herds.size, wild: w.horses.count(-1, true), tamed: list.filter((h) => !(h as { wild: boolean }).wild).length };
      }
      case 'horseSpawn': {
        const m = mapOf(c.map), near = c.near !== undefined ? w.e.slot(fixed(c.near, 0, 2 ** 31, 'near')) : -1, def = w.maps[m]!.def;
        const x = near >= 0 ? w.e.x[near]! + 6 : c.x !== undefined ? fixed(c.x, 0, def.w, 'x') : def.w / 2, y = near >= 0 ? w.e.y[near]! : c.y !== undefined ? fixed(c.y, 0, def.h, 'y') : def.h / 2;
        const n = fixed(c.n ?? 4, 1, 12, 'n') | 0, q = c.q !== undefined ? fixed(c.q, 0, 2, 'q') | 0 : undefined;
        const got = w.horses.spawnHerd(m, x, y, n, q);
        return { ok: true, n: got.length, ids: got.map((i) => w.e.id(i)) };
      }
      case 'animals': {
        let filled: { added: number; removed: number; short?: string } | undefined;
        if (c.map !== undefined && (c.want !== undefined || c.fill)) {
          const m = mapOf(c.map), id = w.maps[m]!.def.id;
          if (c.want === null) w.animals.want.delete(id);
          else if (Array.isArray(c.want)) w.animals.want.set(id, ANIMAL_NAMES.map((_, k) => num(c.want![k] ?? 0, 0, 40, 'count', [0, 5000]) | 0));
          this.db.setMeta('animal_want', JSON.stringify([...w.animals.want]));
          if (c.fill) {
            const want = w.animals.want.get(id) ?? [];
            w.makeRoom(want.reduce((a, v, k) => a + Math.max(0, v - w.animals.count(m, k)), 0) + 1);
            const before = ANIMAL_NAMES.map((_, k) => w.animals.count(m, k));
            w.animals.fill(m);
            const after = ANIMAL_NAMES.map((_, k) => w.animals.count(m, k));
            const short = ANIMAL_NAMES.filter((_, k) => after[k]! < (want[k] ?? 0));
            filled = { added: after.reduce((a, v, k) => a + Math.max(0, v - before[k]!), 0), removed: before.reduce((a, v, k) => a + Math.max(0, v - after[k]!), 0),
              short: short.length ? (w.e.room === 0 ? w.fullText() : `no free ground far enough (25 m) from people for: ${short.join(', ')}`) : undefined };
            if (short.length) w.emit('warn', { what: 'animals', why: filled.short });
          }
        }
        return { maps: w.maps.map((mp, m) => ({ id: mp.def.id, name: mp.def.name, now: ANIMAL_NAMES.map((_, k) => w.animals.count(m, k)), want: w.animals.want.get(mp.def.id) ?? null, cap: w.animals.capOf(m) })), filled };
      }
      case 'zombieAttack': {
        if (c.add) {
          const a = c.add, m = mapOf(a.map), where = (['near', 'edge', 'camp', 'random'] as const).find((x) => x === a.where) ?? 'edge';
          if (where === 'near' && !String(a.near ?? '').trim()) throw new Error('who should they attack?');
          // The game clock: day 1 starts at 08:00 (gameSec 0); the attack is in `days` days at hour:minute (today when still ahead).
          const dayStart = Math.floor((w.gameSec + 8 * 3600) / 86400) * 86400 - 8 * 3600;
          let at = dayStart + num(a.days ?? 0, 0, 30, 'days') * 86400 + fixed(a.hour ?? 21, 0, 23, 'hour') * 3600 + fixed(a.minute ?? 0, 0, 59, 'minute') * 60;
          if (at <= w.gameSec) at += 86400;
          w.zombies.plan({ at, map: w.maps[m]!.def.id, n: num(a.n ?? 6, 1, 40, 'n', [1, 5000]) | 0, where, near: where === 'near' ? String(a.near).trim().slice(0, 40) : undefined, daily: !!a.daily, stays: a.stays !== false });
        }
        if (c.remove !== undefined) w.zombies.unplan(Number(c.remove));
        let ran: { map: string; n: number; why?: string } | undefined;
        if (c.now) {
          const a = c.now, where = (['near', 'edge', 'camp', 'random'] as const).find((x) => x === a.where) ?? 'edge';
          w.makeRoom(Number(a.n ?? 6) || 6);
          ran = w.zombies.attack({ map: a.map ? w.maps[mapOf(a.map)]!.def.id : w.maps[0]!.def.id, n: num(a.n ?? 6, 1, 40, 'n', [1, 5000]), where, near: a.near, stays: a.stays !== false });
          if (!ran.n) throw new Error(w.e.room === 0 ? w.fullText() : ran.why ?? 'no free ground for them');
        }
        return { plans: w.zombies.plans, gameSec: w.gameSec, ran };
      }
      case 'zombieSpawn': { // one zombie, now: at (x, y) on a map, or next to someone (a name), or at random
        let m = 0, x = 0, y = 0;
        const near = typeof c.near === 'string' ? c.near.trim() : '';
        if (near) {
          const id = this.planner.whoIs(near);
          const j = id >= 0 ? w.e.slot(id) : -1;
          if (j < 0 || w.e.map[j] === NO_MAP) throw new Error(`nobody called ${near}`);
          const a = w.rng.next() * Math.PI * 2, d = num(c.dist ?? 8, 2, 60, 'dist', [0, 1e5]);
          m = w.e.map[j]!; x = w.e.x[j]! + Math.cos(a) * d; y = w.e.y[j]! + Math.sin(a) * d;
        } else {
          m = mapOf(c.map); const def = w.maps[m]!.def;
          x = c.x !== undefined && c.x !== '' ? fixed(c.x, 0, def.w, 'x') : w.rng.range(8, def.w - 8);
          y = c.y !== undefined && c.y !== '' ? fixed(c.y, 0, def.h, 'y') : w.rng.range(8, def.h - 8);
        }
        const n = Math.round(num(Number(c.n ?? 1), 1, 20, 'n', [1, 5000]));
        const out = [];
        w.makeRoom(n);
        for (let k = 0; k < n; k++) { const i = w.zombies.spawn(m, x + (k ? w.rng.range(-2, 2) : 0), y + (k ? w.rng.range(-2, 2) : 0), c.stays !== false); if (i >= 0) out.push({ id: w.e.id(i), map: w.maps[m]!.def.id, x: Math.round(w.e.x[i]!), y: Math.round(w.e.y[i]!) }); }
        if (!out.length) throw new Error(w.e.room === 0 ? w.fullText() : `no free ground there (${Math.round(x)}, ${Math.round(y)} on ${w.maps[m]!.def.id}): every spot within 14 m is a wall, a tree or water`);
        return out;
      }
      case 'order': {
        const i = w.e.slot(fixed(c.id, 0, 2 ** 31, 'id'));
        if (c.kind === 'marry' || c.kind === 'divorce') return { did: await this.planner.orderWed(i, c.kind, String(c.target ?? '')) };
        if (i >= 0 && w.e.kind[i] === Kind.Player) throw new Error('played by hand: turn their autopilot on (or wait until they watch / leave) to give orders');
        return { did: this.planner.orderFromPanel(i, String(c.kind ?? ''), String(c.target ?? '')) };
      }
      // A person's own commands reach here only from the admin token (Firebase sign-ins go to playerCmd): the token is not an account.
      case 'me': return { token: true, name: '', role: owner ? 'owner' : 'admin', email: '', tv: false, character: null, clock: this.clock() };
      case 'chats': return { token: true, me: -1, chans: [], people: [] };
      case 'chatRead': case 'chatSend': throw new Error('signed in with the admin token, which has no character: sign in with Google or email to chat as your character');
      case 'joinWorld': case 'approveMine': case 'revokeMine': throw new Error('signed in with the admin token, which is not an account: sign in with Google or email to have your own character');
      case 'errors': return { ...this.errors.list({ limit: c.limit !== undefined ? fixed(c.limit, 1, 1000, 'limit') : 200, source: c.source ? String(c.source) : undefined, level: c.level ? String(c.level) : undefined, q: c.q ? String(c.q).slice(0, 100) : undefined, since: c.since !== undefined ? fixed(c.since, 0, 1e15, 'since') : undefined }), build: this.build };
      case 'errorsClear': return { removed: this.errors.clear(c.id !== undefined ? fixed(c.id, 0, 2 ** 31, 'id') : undefined) };
      default: {
        const b = this.build;
        throw new Error(`unknown command "${String((c as { cmd?: unknown } | undefined)?.cmd)}": this server runs ${b.commit ? 'build ' + b.commit : 'an unknown build'} (started ${new Date(b.started).toISOString().slice(0, 16).replace('T', ' ')} UTC). If the panel is newer than that, update and restart the server (Server page > Update)`);
      }
    }
  }

  /** The recorded zombie attacks, newest first (no frames). */
  replayList(): ReplaySummary[] {
    try { return JSON.parse(this.db.getMeta('replays') ?? '[]') as ReplaySummary[]; } catch { return []; }
  }

  async stop(): Promise<void> {
    if (this.stopping) return;
    this.stopping = true;
    this.loop?.stop();
    try { this.world?.replays.flush(); } catch { /* closing */ }
    for (const t of this.timers) clearInterval(t);
    await this.tunnel?.stop().catch(() => {});
    await this.net?.close();
    if (this.world) this.snapshot();
    try { this.events?.flush(); } catch { /* closing */ }
    try { this.brainStats?.flush(); } catch { /* closing */ }
    if (this.cfg.cloud.enabled && this.world) { this.cloud.collect(this.world); await this.cloud.flush(); }
    this.errors.detach();
    this.db?.close();
    this.log.info('server stopped', { tick: this.world?.tick });
  }
}
