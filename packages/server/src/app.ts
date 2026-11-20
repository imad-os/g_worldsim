import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Kind, EFlag, type AdminCmd, type ServerStats, type ClockInfo } from '@worldsim/protocol';
import type { Config, Secrets } from './config.js';
import { Logger } from './log.js';
import { Loop } from './loop.js';
import { Monitor } from './monitor.js';
import { Db } from './persist/db.js';
import { Snapshots, EventLog } from './persist/snapshot.js';
import { CloudSync } from './persist/cloud.js';
import { Players } from './persist/players.js';
import { loadScenario } from './sim/scenario.js';
import { World, type WorldEvent } from './sim/world.js';
import { NetServer } from './net/server.js';
import { TunnelManager } from './tunnel.js';
import { Ai, type AiSettings } from './ai/llm.js';
import { Planner, type PlannerConfig } from './ai/planner.js';
import { ageOf, TRAIT_KEYS, type Profile } from './sim/people.js';
import { NO_MAP } from './sim/entities.js';

const ROOT = resolve(fileURLToPath(import.meta.url), '../../../..');
const LOGGED = new Set(['spawn', 'remove', 'death', 'travel', 'arrive', 'destroyed', 'admin', 'talk', 'supply', 'birth', 'partner', 'say', 'pregnant']);

/** The whole server: world + loop + persistence + network. Used by main.ts and by the tests. */
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
  tunnel!: TunnelManager;
  ai!: Ai;
  planner!: Planner;
  readonly monitor = new Monitor();
  lastSnapshotAt = 0;
  private timers: NodeJS.Timeout[] = [];
  private stopping = false;
  onStopRequest: () => void = () => {};

  constructor(readonly cfg: Config, readonly secrets: Secrets, log?: Logger) {
    this.log = log ?? new Logger(cfg.logLevel, join(resolve(cfg.dataDir), 'server.log'));
  }

  async start(): Promise<void> {
    const c = this.cfg;
    const dataDir = resolve(c.dataDir);
    this.db = new Db(join(dataDir, `${c.worldId}.sqlite`));
    this.snaps = new Snapshots(this.db, c.snapshotsKept);
    this.events = new EventLog(this.db);
    this.players = new Players(this.db, this.secrets.viewers);
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
      for (let i = 0; i < this.world.e.hi; i++) if (this.world.e.kind[i] === Kind.Player) this.world.remove(i, 'restart');
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
    this.ai = new Ai(c.ai, { gemini: this.secrets.geminiKey, ollama: this.secrets.ollamaKey }, this.log, savedAi);
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
      adminToken: this.secrets.adminToken, players: this.players,
      staticDirs: [
        { prefix: '/panel/', dir: join(ROOT, 'packages/panel/www') },
        { prefix: '/app/', dir: join(ROOT, 'app') },
        { prefix: '/', dir: join(ROOT, 'packages/client/www') },
      ],
    }, this.log);
    this.net.stats = () => this.stats();
    this.net.clockInfo = () => this.clock();
    this.net.health = () => ({ ok: true, tick: w.tick, tps: Math.round(this.loop.ticksLastSec), paused: this.loop.paused, uptimeSec: Math.round((Date.now() - this.monitor.startedAt) / 1000) });
    this.net.admin = (cmd, who) => this.adminCmd(cmd, who);
    this.net.onStop = () => this.onStopRequest();
    // A player pressed A next to someone: they stop, face the player and answer.
    this.net.onTalk = (name, player, i, text) => { void this.planner.chat(i, name, text ?? null, player).catch(() => {}); };
    this.planner.players = () => this.net.characters();
    this.net.onHold = (player, i) => w.brain.listen(i, player, 60);
    // Players do what people do; the owner (and whoever they allow) sees thoughts and plans.
    this.net.onDo = (_name, player, a) => w.brain.playerDo(player, a);
    this.net.isSeer = (name) => this.seers().has(name.toLowerCase());
    this.net.info = (id, seer) => this.personInfo(id, seer);
    this.net.minds = (m, x, y, r) => this.mindsAround(m, x, y, r);
    this.net.me = (i) => ({ hunger: Math.round(w.e.hunger[i]!), thirst: Math.round(w.e.thirst[i]!), tired: Math.round(w.e.tired[i]!), carry: w.e.carry[i], asleep: (w.e.flags[i]! & EFlag.Sleeping) !== 0 });
    this.planner.onSay = (i, text) => this.net.say(w.e.map[i]!, { id: w.e.id(i), name: this.nameOf(w.e.id(i)), text });
    this.net.avatarStore = {
      get: (name) => { const v = this.db.getMeta('pos:' + name); return v ? JSON.parse(v) : null; },
      set: (name, p) => this.db.setMeta('pos:' + name, JSON.stringify(p)),
    };
    await this.net.listen();

    this.timers.push(setInterval(() => this.snapshot(), c.snapshotEverySec * 1000));
    this.timers.push(setInterval(() => { void this.planner.tick(this.loop.paused).catch((err) => this.log.warn('planner', { err: String(err) })); }, 2000));
    this.timers.push(setInterval(() => { try { this.events.flush(); } catch (err) { this.log.error('event flush', { err: String(err) }); } }, 1000));
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

  clock(): ClockInfo {
    return { tick: this.world.tick, gameSec: this.world.gameSec, speed: this.loop?.speed ?? this.cfg.speed, paused: this.loop?.paused ?? false, clockScale: this.cfg.clockScale, tickRate: this.cfg.tickRate };
  }

  snapshot(): void {
    try {
      this.net?.saveAvatars();
      const r = this.snaps.save(this.world);
      this.lastSnapshotAt = Date.now();
      this.log.debug('snapshot', { ...r, tick: this.world.tick });
    } catch (err) {
      this.log.error('snapshot failed', { err: String(err) });
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
      travelOpen: w.travelOpen, difficulty: w.brain.life.difficulty, yearDays: w.brain.life.yearDays, maxPopulation: w.brain.life.maxPopulation,
      ai: { ...(({ provider, model, ready, why }) => ({ provider, model, ready, why }))(this.ai.status()), plans: this.planner.counts.plans, chats: this.planner.counts.chats, failures: this.planner.counts.failures },
    };
  }

  /** Players who see thoughts (lower case). imad asked to be the only one by default (2026-11-20). */
  seers(): Set<string> {
    const v = this.db.getMeta('seers');
    return new Set((v ? (JSON.parse(v) as string[]) : ['imad']).map((n) => n.toLowerCase()));
  }

  /** One person for a viewer (watch mode's card). Thoughts, plans and memory only for seers. */
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
    };
    if (i >= 0) Object.assign(base, { act: e.act[i], hunger: Math.round(e.hunger[i]!), thirst: Math.round(e.thirst[i]!), tired: Math.round(e.tired[i]!), lonely: Math.round(e.lonely[i]!), hp: Math.round(e.hp[i]!), carry: e.carry[i] });
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
      out.push([e.id(i), act, to, Math.round(it.dist), plan ? plan.act : '', plan?.with !== undefined ? this.nameOf(plan.with) : '', plan?.why ?? '', p?.mind?.mood ?? '', p?.mind?.said && w.gameSec - p.mind.said.at < 1800 ? p.mind.said.text : '']);
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
      order: (() => { const o = w.brain.orderOf(i); return o.kind ? (o.kind === 'come' || o.kind === 'follow' ? `${o.kind === 'come' ? 'go to' : 'follow'} ${this.planner.whoName(o.who)}` : o.kind === 'act' ? ['stand', 'wander', 'drink', 'eat', 'forage', 'sleep', 'talk', 'travel', 'rest'][o.act] ?? 'act' : 'wait here') : null; })(),
      carry: e.carry[i], lod: e.lod[i], child: !!(e.flags[i]! & 32), pregnant: !!p?.pregnant, partner: p && p.partner >= 0 ? this.nameOf(p.partner) : null, talkingTo: e.act[i] === 6 && e.target[i]! >= 0 ? this.nameOf(e.target[i]!) : null,
    };
  }

  /** Control panel commands. Every value is checked here, whatever the client sent. */
  async adminCmd(c: AdminCmd, who: string): Promise<unknown> {
    const w = this.world;
    const num = (v: unknown, lo: number, hi: number, name: string) => {
      if (typeof v !== 'number' || !Number.isFinite(v) || v < lo || v > hi) throw new Error(`bad ${name}`);
      return v;
    };
    const mapOf = (id: unknown) => { const m = w.mapIndex.get(String(id)); if (m === undefined) throw new Error('bad map'); return m; };
    w.emit('admin', { who, cmd: c.cmd });
    switch (c?.cmd) {
      case 'speed': this.loop.setSpeed(num(c.speed, 0.01, this.cfg.maxSpeed, 'speed')); return this.clock();
      case 'pause': this.loop.paused = !!c.paused; return this.clock();
      case 'snapshot': this.snapshot(); return { at: this.lastSnapshotAt };
      case 'stats': return this.stats();
      case 'spawn': {
        const m = mapOf(c.map), def = w.maps[m]!.def;
        const s = w.freeSpot(m, num(c.x, 0, def.w, 'x'), num(c.y, 0, def.h, 'y'));
        if (!s) throw new Error('no room there');
        if (w.e.countKind(Kind.Agent) >= 100) throw new Error('population cap (100)');
        const i = w.spawnAgent(m, s.x, s.y);
        return { id: w.e.id(i) };
      }
      case 'remove': {
        const i = w.e.slot(num(c.id, 0, 2 ** 31, 'id'));
        if (i < 0) throw new Error('no such entity');
        w.remove(i, 'admin');
        return { ok: true };
      }
      case 'shoot': {
        const m = mapOf(c.map), def = w.maps[m]!.def;
        const i = w.shoot(m, num(c.x, 0, def.w, 'x'), num(c.y, 0, def.h, 'y'), num(c.dx, -1e3, 1e3, 'dx'), num(c.dy, -1e3, 1e3, 'dy'));
        return { id: i >= 0 ? w.e.id(i) : 0 };
      }
      case 'damageTile': {
        const m = mapOf(c.map), t = w.maps[m]!.tiles;
        const broke = t.damage(num(c.tx, 0, t.w - 1, 'tx') | 0, num(c.ty, 0, t.h - 1, 'ty') | 0, num(c.amount, 0, 255, 'amount'));
        return { broke };
      }
      case 'pairings': return this.players.pendingList();
      case 'approve': {
        if (typeof c.code !== 'string' || !/^\d{6}$/.test(c.code)) throw new Error('bad code');
        return this.players.approve(c.code, typeof c.name === 'string' ? c.name : undefined);
      }
      case 'deny': this.players.deny(String(c.code)); return { ok: true };
      case 'players': { const s = this.seers(); return this.players.list().map((p) => ({ ...p, seer: s.has(p.name.toLowerCase()) })); }
      case 'seer': {
        const name = String(c.name ?? '').trim().toLowerCase();
        if (!name) throw new Error('bad name');
        const s = this.seers();
        if (c.on === true) s.add(name); else s.delete(name);
        this.db.setMeta('seers', JSON.stringify([...s]));
        return { seers: [...s] };
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
        this.log.info(w.travelOpen ? 'travel opened' : 'travel closed', { who });
        return { open: w.travelOpen };
      }
      case 'ai': return this.ai.status();
      case 'aiModels': return this.ai.models();
      case 'aiSet': {
        const s = this.ai.apply({ provider: c.provider, model: c.model, ollamaUrl: c.ollamaUrl });
        this.db.setMeta('ai', JSON.stringify(s));
        this.log.info('ai changed', { who, provider: s.provider, model: this.ai.model });
        return this.ai.status();
      }
      case 'aiTest': {
        const prompt = typeof c.prompt === 'string' && c.prompt.trim() ? c.prompt.slice(0, 500) : 'In one short sentence, say hello as a survivor in a ruined town.';
        const r = await this.ai.generate({ system: 'You are a person living in a post-apocalyptic world. Answer briefly.', prompt, maxTokens: 120 });
        return { text: r.text.slice(0, 1000), ms: r.ms, provider: r.provider, model: r.model };
      }
      case 'agents': {
        const out = [];
        for (let i = 0; i < w.e.hi; i++) if (w.e.kind[i] === Kind.Agent) out.push(this.agentInfo(i));
        return out;
      }
      case 'agent': {
        const id = num(c.id, 0, 2 ** 31, 'id'), i = w.e.slot(id);
        const p = w.profiles.get(id);
        if (!p) throw new Error('no such person');
        const like = `%${id}%`;
        const events = (this.db.sql.prepare('SELECT tick, game_sec, kind, data FROM events WHERE data LIKE ? ORDER BY id DESC LIMIT 40').all(like) as { game_sec: number; kind: string; data: string }[])
          .filter((r) => { try { const d = JSON.parse(r.data) as Record<string, unknown>; return d.id === id || d.a === id || d.b === id; } catch { return false; } })
          .map((r) => ({ at: r.game_sec, kind: r.kind, data: JSON.parse(r.data) as unknown }));
        const family = { parents: p.parents.map((x) => this.nameOf(x)), children: [...w.profiles].filter(([, q]) => q.parents.includes(id)).map(([cid]) => this.nameOf(cid)), partner: p.partner >= 0 ? this.nameOf(p.partner) : null };
        return { ...(i >= 0 ? this.agentInfo(i) : { id, alive: false, name: p.name }), profile: p, age: ageOf(p, w.gameSec, w.yearSec), family, events, now: w.gameSec };
      }
      case 'agentSet': {
        const i = w.e.slot(num(c.id, 0, 2 ** 31, 'id'));
        if (i < 0 || w.e.kind[i] !== Kind.Agent) throw new Error('no such person');
        const p = w.profileOf(i)!, e = w.e;
        for (const [k, v] of Object.entries(c.set ?? {})) {
          if (k === 'name') { const n = String(v).trim().slice(0, 30); if (!n) throw new Error('bad name'); p.name = n; continue; }
          if (k === 'personality') { p.personality = String(v).split(',').map((s) => s.trim()).filter(Boolean).slice(0, 5); continue; }
          if (k === 'hunger' || k === 'thirst' || k === 'tired' || k === 'lonely') { e[k][i] = num(v, 0, 100, k); continue; }
          if (k === 'hp') { e.hp[i] = num(v, 1, w.sc.agents.hp, k); continue; }
          if (k === 'carry') { e.carry[i] = num(v, 0, 20, k); continue; }
          if ((TRAIT_KEYS as readonly string[]).includes(k)) { p.traits[k as (typeof TRAIT_KEYS)[number]] = num(v, 0, 1, k); continue; }
          if (k === 'lifespan') { p.traits.lifespan = num(v, 1, 150, k); continue; }
          throw new Error(`can't change ${k}`);
        }
        e.nextThink[i] = w.tick; // decide again with the new values
        return this.agentInfo(i);
      }
      case 'agentMove': {
        const i = w.e.slot(num(c.id, 0, 2 ** 31, 'id'));
        if (i < 0 || w.e.kind[i] !== Kind.Agent) throw new Error('no such person');
        const m = mapOf(c.map), def = w.maps[m]!.def;
        w.place(i, m, c.x !== undefined ? num(c.x, 0, def.w, 'x') : def.w / 2, c.y !== undefined ? num(c.y, 0, def.h, 'y') : def.h / 2);
        return this.agentInfo(i);
      }
      case 'kill': {
        const i = w.e.slot(num(c.id, 0, 2 ** 31, 'id'));
        if (i < 0 || w.e.kind[i] !== Kind.Agent) throw new Error('no such person');
        w.emit('death', { id: w.e.id(i), cause: 'killed by the owner', map: w.e.map[i] === NO_MAP ? '' : w.maps[w.e.map[i]!]!.def.id, x: w.e.x[i], y: w.e.y[i] });
        w.remove(i, 'killed by the owner');
        return { ok: true };
      }
      case 'supply': {
        const m = mapOf(c.map), def = w.maps[m]!.def;
        const x = c.x !== undefined ? num(c.x, 0, def.w, 'x') : w.rng.range(def.w * 0.3, def.w * 0.7);
        const y = c.y !== undefined ? num(c.y, 0, def.h, 'y') : w.rng.range(def.h * 0.3, def.h * 0.7);
        const n = w.brain.drop(m, x, y, c.n !== undefined ? num(c.n, 1, 30, 'n') : 8);
        w.emit('supply', { map: def.id, x, y, n });
        return { x, y, n };
      }
      case 'difficulty': {
        w.brain.life.difficulty = num(c.value, 0.25, 3, 'difficulty');
        this.db.setMeta('difficulty', String(w.brain.life.difficulty));
        return { value: w.brain.life.difficulty };
      }
      case 'timeline': {
        const lim = c.limit !== undefined ? num(c.limit, 1, 500, 'limit') : 100;
        this.events.flush();
        return this.events.recent(lim).map((r) => ({ at: r.game_sec, kind: r.kind, data: JSON.parse(r.data) as unknown }));
      }
      case 'life': {
        const L = w.brain.life;
        if (c.yearDays !== undefined) {
          const from = w.yearSec;
          L.yearDays = num(c.yearDays, 1 / 24, 365, 'yearDays');
          w.life.rescale(from);
          this.db.setMeta('year_days', String(L.yearDays));
        }
        if (c.maxPopulation !== undefined) { L.maxPopulation = Math.round(num(c.maxPopulation, 1, 100, 'maxPopulation')); this.db.setMeta('max_population', String(L.maxPopulation)); }
        return { yearDays: L.yearDays, maxPopulation: L.maxPopulation };
      }
      case 'planner': {
        const r = this.planner.set({ on: c.on, everyGameHours: c.everyGameHours, batch: c.batch, minGapSec: c.minGapSec });
        this.db.setMeta('planner', JSON.stringify(r));
        return this.planner.status();
      }
      case 'aiLog': return { ai: this.ai.status(), planner: this.planner.status(), log: [...this.planner.log].reverse() };
      case 'planNow': {
        const i = w.e.slot(num(c.id, 0, 2 ** 31, 'id'));
        if (i < 0 || w.e.kind[i] !== Kind.Agent || w.e.map[i] === NO_MAP) throw new Error('no such person here');
        if (!this.ai.status().ready) throw new Error('AI is off: choose Gemini or Ollama in the AI brain card');
        const n = await this.planner.plan([i]);
        const ex = this.planner.log[this.planner.log.length - 1];
        if (!n) throw new Error(ex?.err ?? 'no plan');
        return { plan: w.profiles.get(w.e.id(i))?.mind?.plan, mind: w.profiles.get(w.e.id(i))?.mind };
      }
      case 'chat': {
        const i = w.e.slot(num(c.id, 0, 2 ** 31, 'id'));
        if (i < 0 || w.e.kind[i] !== Kind.Agent) throw new Error('no such person');
        const text = typeof c.text === 'string' ? c.text.trim().slice(0, 300) : '';
        if (!text) throw new Error('say something');
        return this.planner.chat(i, 'owner', text);
      }
      case 'order': {
        const i = w.e.slot(num(c.id, 0, 2 ** 31, 'id'));
        return { did: this.planner.orderFromPanel(i, String(c.kind ?? ''), String(c.target ?? '')) };
      }
      default: throw new Error('unknown command');
    }
  }

  async stop(): Promise<void> {
    if (this.stopping) return;
    this.stopping = true;
    this.loop?.stop();
    for (const t of this.timers) clearInterval(t);
    await this.tunnel?.stop().catch(() => {});
    await this.net?.close();
    if (this.world) this.snapshot();
    try { this.events?.flush(); } catch { /* closing */ }
    if (this.cfg.cloud.enabled && this.world) { this.cloud.collect(this.world); await this.cloud.flush(); }
    this.db?.close();
    this.log.info('server stopped', { tick: this.world?.tick });
  }
}
