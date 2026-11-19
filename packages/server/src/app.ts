import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Kind, type AdminCmd, type ServerStats, type ClockInfo } from '@worldsim/protocol';
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

const ROOT = resolve(fileURLToPath(import.meta.url), '../../../..');
const LOGGED = new Set(['spawn', 'remove', 'death', 'travel', 'arrive', 'destroyed', 'admin']);

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
  readonly monitor = new Monitor();
  lastSnapshotAt = 0;
  private timers: NodeJS.Timeout[] = [];
  private stopping = false;

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

    const loaded = this.snaps.loadLatest(this.world, (id, err) => this.log.warn('snapshot skipped', { id, err: String(err) }));
    if (loaded) {
      this.log.info('resumed from snapshot', { id: loaded.id, tick: loaded.tick, agents: this.world.e.countKind(Kind.Agent) });
    } else if (await this.cloud.restoreInto(this.world).catch((err) => { this.log.warn('cloud restore failed', { err: String(err) }); return false; })) {
      this.log.info('restored from the cloud backup', { tick: this.world.tick });
    } else {
      this.db.setMeta('seed', seed);
      this.db.setMeta('scenario', sc.id);
      this.world.populate();
      this.log.info('new world', { scenario: sc.id, seed, agents: this.world.e.countKind(Kind.Agent) });
    }
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
    await this.net.listen();

    this.timers.push(setInterval(() => this.snapshot(), c.snapshotEverySec * 1000));
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
      case 'players': return this.players.list();
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
