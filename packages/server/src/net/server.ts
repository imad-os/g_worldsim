import { createServer, type IncomingMessage, type ServerResponse, type Server } from 'node:http';
import { randomBytes, timingSafeEqual } from 'node:crypto';
import { createReadStream, existsSync, statSync } from 'node:fs';
import { extname, join, normalize, resolve } from 'node:path';
import { WebSocketServer, type WebSocket } from 'ws';
import {
  Msg, Kind, PROTOCOL_VERSION, CHUNK_TILES, ENT_REC, POS_Q, ANG_Q, encode, decode, packI32, chunkKey,
  type AdminCmd, type ClientMsg, type Role, type ServerMsg, type ServerStats,
} from '@worldsim/protocol';
import type { World } from '../sim/world.js';
import type { Logger } from '../log.js';
import { NO_MAP } from '../sim/entities.js';
import type { Players } from '../persist/players.js';

export interface NetOptions {
  host: string;
  port: number;
  netHz: number;
  maxViewRadius: number;
  maxClients: number;
  adminToken: string;
  players: Players;
  staticDirs: { prefix: string; dir: string }[];
}

export interface AdminHandler { (cmd: AdminCmd, who: string): unknown | Promise<unknown> }

interface Session {
  id: string;
  ws: WebSocket | null;
  role: Role;
  name: string;
  ip: string;
  view: { map: number; x: number; y: number; r: number } | null;
  chunks: Map<number, number>; // key -> version sent
  chunkMap: number;
  /** Last time this viewer talked to someone (A next to a person). */
  talkAt?: number;
  known: Int32Array; // slot -> id + 1 (0 = not known)
  q: Int32Array;     // slot -> last sent x, y, angle (quantized)
  list: Int32Array;  // slots known after the last frame
  listN: number;
  // rate limit (token bucket, messages)
  tokens: number;
  tokensAt: number;
  avatar: number; // entity slot of this player's character, -1 none
  avatarId: number;
  lastMap: number;
  goneAt: number;
}

const MIME: Record<string, string> = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.png': 'image/png', '.webp': 'image/webp',
  '.svg': 'image/svg+xml', '.ogg': 'audio/ogg', '.ktx2': 'image/ktx2', '.wasm': 'application/wasm', '.map': 'application/json',
};

function safeEq(a: string, b: string): boolean {
  const x = Buffer.from(a), y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

const isNum = (v: unknown, lo = -1e9, hi = 1e9): v is number => typeof v === 'number' && Number.isFinite(v) && v >= lo && v <= hi;

/**
 * HTTP + WebSocket server. Viewers authenticate with their own token (several players at once), the
 * control panel with the admin token. Each viewer says which area it watches; it then gets that area's
 * chunks and, `netHz` times a second, only the entities in it that changed (interest management).
 * The world never waits for the network: frames are built from the current state, slow sockets skip frames.
 */
export class NetServer {
  readonly http: Server;
  private readonly wss: WebSocketServer;
  private readonly sessions = new Map<string, Session>();
  private timer: NodeJS.Timeout | null = null;
  private statsTimer: NodeJS.Timeout | null = null;
  private readonly scratch: Int32Array;
  private readonly rec: Int32Array;
  private readonly chunkBuf = new Uint8Array(CHUNK_TILES * CHUNK_TILES);
  private readonly ipConn = new Map<string, { n: number; at: number }>();
  private readonly ipFail = new Map<string, { n: number; at: number }>();
  private readonly ipPair = new Map<string, { n: number; at: number }>();
  stats: () => ServerStats = () => { throw new Error('stats not set'); };
  health: () => Record<string, unknown> = () => ({ ok: true });
  admin: AdminHandler = () => { throw new Error('no admin handler'); };
  welcomeExtra: () => Record<string, unknown> = () => ({});
  onStop: () => void = () => {};
  /** A viewer pressed A next to a person (viewer name, their character's slot, the person's slot). */
  onTalk: (name: string, player: number, agent: number) => void = () => {};
  clockInfo!: () => import('@worldsim/protocol').ClockInfo;

  constructor(private readonly world: World, private readonly o: NetOptions, private readonly log: Logger) {
    const cap = world.e.cap;
    this.scratch = new Int32Array(cap);
    this.rec = new Int32Array(cap * ENT_REC);
    this.http = createServer((req, res) => this.onHttp(req, res));
    this.wss = new WebSocketServer({ noServer: true, maxPayload: 64 * 1024, perMessageDeflate: false });
    this.http.on('upgrade', (req, socket, head) => {
      const ip = this.ipOf(req);
      if (new URL(req.url ?? '/', 'http://x').pathname !== '/ws' || !this.allowConn(ip)) { socket.destroy(); return; }
      this.wss.handleUpgrade(req, socket, head, (ws) => this.onSocket(ws, ip));
    });
  }

  listen(): Promise<void> {
    return new Promise((ok, fail) => {
      this.http.once('error', fail);
      this.http.listen(this.o.port, this.o.host, () => {
        this.timer = setInterval(() => this.broadcastFrames(), Math.round(1000 / this.o.netHz));
        this.statsTimer = setInterval(() => this.broadcastStats(), 1000);
        ok();
      });
    });
  }

  address(): string {
    const a = this.http.address();
    return typeof a === 'object' && a ? `http://${a.address}:${a.port}` : '';
  }

  private closing = false;
  async close(): Promise<void> {
    this.closing = true;
    if (this.timer) clearInterval(this.timer);
    if (this.statsTimer) clearInterval(this.statsTimer);
    for (const s of this.sessions.values()) s.ws?.close(1001, 'server stopping');
    this.wss.close();
    await new Promise<void>((ok) => this.http.close(() => ok()));
  }

  clientCount(): number {
    let n = 0;
    for (const s of this.sessions.values()) if (s.ws) n++;
    return n;
  }

  private ipOf(req: IncomingMessage): string {
    // Behind a tunnel every connection comes from 127.0.0.1; the tunnel puts the real address in a header.
    const fwd = req.headers['cf-connecting-ip'] ?? req.headers['x-forwarded-for'];
    const ip = (Array.isArray(fwd) ? fwd[0] : fwd)?.split(',')[0]?.trim();
    return ip || req.socket.remoteAddress || '?';
  }

  /** At most 20 new connections per IP per minute. */
  private allowConn(ip: string): boolean {
    const now = Date.now(), r = this.ipConn.get(ip);
    if (!r || now - r.at > 60_000) { this.ipConn.set(ip, { n: 1, at: now }); return true; }
    return ++r.n <= 20;
  }

  private authFailed(ip: string): boolean {
    const now = Date.now(), r = this.ipFail.get(ip);
    if (!r || now - r.at > 600_000) this.ipFail.set(ip, { n: 1, at: now });
    else r.n++;
    return (this.ipFail.get(ip)!.n) > 5;
  }

  private locked(ip: string): boolean {
    const r = this.ipFail.get(ip);
    return !!r && r.n > 5 && Date.now() - r.at < 600_000;
  }

  // ------------------------------------------------------------ HTTP

  private onHttp(req: IncomingMessage, res: ServerResponse): void {
    const url = new URL(req.url ?? '/', 'http://x');
    if (url.pathname === '/health') {
      res.writeHead(200, { 'content-type': 'application/json', 'cache-control': 'no-store', 'access-control-allow-origin': '*' });
      res.end(JSON.stringify(this.health()));
      return;
    }
    if (url.pathname === '/api/stop' && req.method === 'POST') {
      // Clean stop (snapshot first). Only from this PC: Windows has no SIGTERM for a hidden process.
      const auth = req.headers.authorization ?? '';
      const local = ['127.0.0.1', '::1', '::ffff:127.0.0.1'].includes(req.socket.remoteAddress ?? '') && !req.headers['x-forwarded-for'] && !req.headers['cf-connecting-ip'];
      if (!local || !this.o.adminToken || !safeEq(auth, `Bearer ${this.o.adminToken}`)) { res.writeHead(403); res.end(); return; }
      res.writeHead(200, { 'content-type': 'application/json' });
      res.end('{"ok":true}');
      setTimeout(() => this.onStop(), 50);
      return;
    }
    if (url.pathname === '/api/stats') {
      const auth = req.headers.authorization ?? '';
      if (!this.o.adminToken || !safeEq(auth, `Bearer ${this.o.adminToken}`)) { res.writeHead(401); res.end(); return; }
      res.writeHead(200, { 'content-type': 'application/json', 'cache-control': 'no-store' });
      res.end(JSON.stringify(this.stats()));
      return;
    }
    if (req.method !== 'GET' && req.method !== 'HEAD') { res.writeHead(405); res.end(); return; }
    for (const { prefix, dir } of this.o.staticDirs) {
      if (!url.pathname.startsWith(prefix)) continue;
      let rel = decodeURIComponent(url.pathname.slice(prefix.length)) || 'index.html';
      if (rel.endsWith('/')) rel += 'index.html';
      const root = resolve(dir), file = normalize(join(root, rel));
      if (!file.startsWith(root) || !existsSync(file) || !statSync(file).isFile()) break;
      res.writeHead(200, {
        'content-type': MIME[extname(file)] ?? 'application/octet-stream',
        'access-control-allow-origin': '*',
        'cache-control': 'no-cache',
        'x-content-type-options': 'nosniff',
      });
      if (req.method === 'HEAD') { res.end(); return; }
      createReadStream(file).pipe(res);
      return;
    }
    res.writeHead(404, { 'content-type': 'text/plain' });
    res.end('not found');
  }

  // ------------------------------------------------------------ WebSocket

  private send(s: Session, m: ServerMsg): void {
    if (s.ws && s.ws.readyState === 1) s.ws.send(encode(m));
  }

  private onSocket(ws: WebSocket, ip: string): void {
    let session: Session | null = null;
    const helloTimer = setTimeout(() => ws.close(4001, 'hello timeout'), 5000);
    ws.on('message', (raw, isBinary) => {
      let m: ClientMsg;
      try {
        if (!isBinary) throw new Error('text');
        m = decode(raw as Buffer) as ClientMsg;
        if (!m || typeof m !== 'object' || typeof (m as { t?: unknown }).t !== 'string') throw new Error('shape');
      } catch { ws.close(4002, 'bad message'); return; }
      if (!session) {
        if (m.t === Msg.Pair) { this.pair(ws, ip, m); return; }
        if (m.t !== Msg.Hello) { ws.close(4003, 'hello first'); return; }
        clearTimeout(helloTimer);
        session = this.hello(ws, ip, m);
        return;
      }
      if (!this.rate(session)) { ws.close(4008, 'too many messages'); return; }
      this.onMessage(session, m).catch((err) => this.log.warn('message failed', { err: String(err) }));
    });
    ws.on('close', () => {
      clearTimeout(helloTimer);
      if (session && session.ws === ws) { session.ws = null; session.goneAt = Date.now(); this.leave(session); }
      this.log.info('client left', { name: session?.name, role: session?.role });
    });
    ws.on('error', () => ws.terminate());
  }

  private rate(s: Session): boolean {
    const now = Date.now();
    s.tokens = Math.min(60, s.tokens + ((now - s.tokensAt) / 1000) * 30);
    s.tokensAt = now;
    if (s.tokens < 1) return false;
    s.tokens--;
    return true;
  }

  private hello(ws: WebSocket, ip: string, m: ClientMsg): Session | null {
    if (m.t !== Msg.Hello) return null;
    const fail = (code: string) => { this.sendRaw(ws, { t: Msg.Error, code }); ws.close(4004, code); return null; };
    if (m.v !== PROTOCOL_VERSION) return fail('version');
    if (this.locked(ip)) return fail('locked');
    const token = typeof m.token === 'string' ? m.token : '';
    let role: Role | null = null, name = '';
    if (this.o.adminToken && safeEq(token, this.o.adminToken)) { role = 'admin'; name = 'admin'; }
    else { const n = this.o.players.check(token); if (n) { role = 'viewer'; name = n; } }
    if (!role) { this.authFailed(ip); this.log.warn('auth failed', { ip }); return fail('auth'); }
    this.pruneSessions();
    if (this.clientCount() >= this.o.maxClients) return fail('full');
    // Resume: same player, same session id within 2 minutes -> keep the view (state is resent).
    let s = typeof m.resume === 'string' ? this.sessions.get(m.resume) : undefined;
    if (s && (s.name !== name || s.ws)) s = undefined;
    if (!s) {
      const cap = this.world.e.cap;
      s = {
        id: randomBytes(12).toString('base64url'), ws, role, name, ip, view: null,
        chunks: new Map(), chunkMap: -1, known: new Int32Array(cap), q: new Int32Array(cap * 4), list: new Int32Array(cap), listN: 0,
        tokens: 60, tokensAt: Date.now(), goneAt: 0, avatar: -1, avatarId: 0, lastMap: -2,
      };
      this.sessions.set(s.id, s);
    } else {
      s.ws = ws; s.goneAt = 0; s.chunks.clear(); s.known.fill(0); s.listN = 0;
    }
    const w = this.world;
    this.send(s, {
      t: Msg.Welcome, v: PROTOCOL_VERSION, session: s.id, role, scenario: w.sc.id,
      maps: w.maps.map((mm) => ({ id: mm.def.id, name: mm.def.name, w: mm.def.w, h: mm.def.h, tileSize: 1, chunkTiles: CHUNK_TILES })),
      portals: w.portals.map((p) => ({ id: p.id, map: p.map, x: p.x, y: p.y, to: p.to, toX: p.toX, toY: p.toY, travel: p.travel })),
      tiles: w.sc.tiles.map((t) => ({ id: t.id, name: t.name, solid: t.solid, color: t.color })),
      clock: this.clockInfo(),
      body: { radius: w.sc.agents.radius, walk: w.sc.agents.walk, run: w.sc.agents.run },
    });
    this.log.info('client joined', { name, role, resumed: !!(m as { resume?: string }).resume });
    return s;
  }

  /** Player characters: positions kept per player name between visits. */
  avatarStore: { get(name: string): { map: string; x: number; y: number } | null; set(name: string, p: { map: string; x: number; y: number }): void } = { get: () => null, set: () => {} };

  private ownsAvatar(s: Session): boolean {
    return s.avatar >= 0 && this.world.e.id(s.avatar) === s.avatarId && this.world.e.alive(s.avatar);
  }

  private join(s: Session): void {
    const w = this.world;
    if (!this.ownsAvatar(s)) {
      // One character per player name, even with two TVs.
      for (const o of this.sessions.values()) if (o !== s && o.name === s.name && this.ownsAvatar(o)) { s.avatar = o.avatar; s.avatarId = o.avatarId; o.avatar = -1; }
    }
    if (!this.ownsAvatar(s)) {
      const p = this.avatarStore.get(s.name);
      const mi = p ? w.mapIndex.get(p.map) ?? 0 : 0;
      const def = w.maps[mi]!.def;
      const slot = w.spawnPlayer(mi, p?.x ?? def.w / 2, p?.y ?? def.h / 2);
      if (slot < 0) { this.send(s, { t: Msg.Error, code: 'full' }); return; }
      s.avatar = slot; s.avatarId = w.e.id(slot);
      this.log.info('player joined the world', { name: s.name, map: w.maps[mi]!.def.id });
    }
    s.lastMap = -2;
    this.sendYou(s);
  }

  private sendYou(s: Session): void {
    const e = this.world.e, i = s.avatar;
    const m = e.map[i]!, transit = m === NO_MAP;
    const mi = transit ? e.toMap[i]! : m;
    s.lastMap = m;
    this.send(s, { t: Msg.You, id: s.avatarId, map: this.world.maps[mi]!.def.id, transit, arrive: transit ? e.arrive[i] : undefined });
    if (!transit) s.view = { map: m, x: e.x[i]!, y: e.y[i]!, r: s.view?.r ?? 40 };
  }

  /** The player left: keep where they were, take the character out of the world. */
  private leave(s: Session): void {
    if (this.closing) return; // the final snapshot saves every character's place
    if (!this.ownsAvatar(s)) { s.avatar = -1; return; }
    const w = this.world, e = w.e, i = s.avatar;
    const mi = e.map[i] === NO_MAP ? e.toMap[i]! : e.map[i]!;
    const x = e.map[i] === NO_MAP ? e.ax[i]! : e.x[i]!, y = e.map[i] === NO_MAP ? e.ay[i]! : e.y[i]!;
    this.avatarStore.set(s.name, { map: w.maps[mi]!.def.id, x, y });
    w.remove(i, 'left');
    s.avatar = -1;
  }

  /** Save every connected character's position (snapshots, shutdown). */
  saveAvatars(): void {
    const w = this.world, e = w.e;
    for (const s of this.sessions.values()) {
      if (!this.ownsAvatar(s)) continue;
      const i = s.avatar;
      if (e.map[i] === NO_MAP) this.avatarStore.set(s.name, { map: w.maps[e.toMap[i]!]!.def.id, x: e.ax[i]!, y: e.ay[i]! });
      else this.avatarStore.set(s.name, { map: w.maps[e.map[i]!]!.def.id, x: e.x[i]!, y: e.y[i]! });
    }
  }

  /** A device without a token asks to pair: it gets a code, the socket waits (10 min) for an admin to approve it. */
  private pairing = new WeakMap<WebSocket, string>();
  private pair(ws: WebSocket, ip: string, m: ClientMsg): void {
    if (m.t !== Msg.Pair) return;
    if (m.v !== PROTOCOL_VERSION) { this.sendRaw(ws, { t: Msg.Error, code: 'version' }); ws.close(4004, 'version'); return; }
    if (this.pairing.has(ws)) return;
    const now = Date.now(), r = this.ipPair.get(ip);
    if (!r || now - r.at > 600_000) this.ipPair.set(ip, { n: 1, at: now });
    else if (++r.n > 6) { this.sendRaw(ws, { t: Msg.Error, code: 'slow-down' }); ws.close(4008, 'slow down'); return; }
    const p = this.o.players.request(String(m.name ?? ''), String(m.dev ?? ''), ip,
      (token, name) => { this.sendRaw(ws, { t: Msg.Paired, token, name }); this.notifyAdmins('paired', { name }); },
      (why) => { this.sendRaw(ws, { t: Msg.Error, code: why }); ws.close(4005, why); });
    this.pairing.set(ws, p.code);
    ws.on('close', () => this.o.players.cancel(p.code));
    this.sendRaw(ws, { t: Msg.PairCode, code: p.code, exp: p.at + 600_000 });
    this.notifyAdmins('pairing', { code: p.code, name: p.name, dev: p.dev });
    this.log.info('pairing requested', { name: p.name, dev: p.dev, ip });
  }

  /** Someone said something on map m: viewers looking at that map and every admin hear it. */
  say(m: number, data: { id: number; name: string; text: string }): void {
    for (const s of this.sessions.values()) {
      if (s.role === 'admin' || (s.view && s.view.map === m)) this.send(s, { t: Msg.Notice, kind: 'say', data });
    }
  }

  notifyAdmins(kind: string, data?: unknown): void {
    for (const s of this.sessions.values()) if (s.role === 'admin') this.send(s, { t: Msg.Notice, kind, data });
  }

  /** Close every connection of a player (after its token was revoked). */
  kick(name: string): number {
    let n = 0;
    for (const [id, s] of this.sessions) {
      if (s.role !== 'viewer' || s.name !== name) continue;
      if (s.ws) { this.send(s, { t: Msg.Error, code: 'auth' }); s.ws.close(4004, 'revoked'); n++; }
      this.sessions.delete(id);
    }
    return n;
  }

  private sendRaw(ws: WebSocket, m: ServerMsg): void { if (ws.readyState === 1) ws.send(encode(m)); }

  private pruneSessions(): void {
    const now = Date.now();
    for (const [id, s] of this.sessions) if (!s.ws && now - s.goneAt > 120_000) this.sessions.delete(id);
  }

  private async onMessage(s: Session, m: ClientMsg): Promise<void> {
    switch (m.t) {
      case Msg.Who: {
        const mi = this.world.mapIndex.get(String(m.map));
        if (mi === undefined) return;
        const e = this.world.e, out: number[][] = [];
        for (let i = 0; i < e.hi && out.length < 200; i++) {
          if ((e.kind[i] === Kind.Agent || e.kind[i] === Kind.Player) && e.map[i] === mi) out.push([e.id(i), Math.round(e.x[i]! * 10) / 10, Math.round(e.y[i]! * 10) / 10, e.act[i]!]);
        }
        this.send(s, { t: Msg.Notice, kind: 'people', data: out });
        return;
      }
      case Msg.Ping:
        if (isNum(m.c)) this.send(s, { t: Msg.Pong, c: m.c, s: Date.now() });
        return;
      case Msg.Join: {
        if (s.role !== 'viewer') { this.send(s, { t: Msg.Error, code: 'forbidden' }); return; }
        this.join(s);
        return;
      }
      case Msg.Input: {
        if (s.avatar < 0 || !this.ownsAvatar(s)) return;
        const mx = isNum(m.mx, -1, 1) ? m.mx : 0, my = isNum(m.my, -1, 1) ? m.my : 0;
        this.world.setInput(s.avatar, mx, my, m.run === true);
        if (m.act === true) {
          const j = this.world.nearest(s.avatar, 2.5);
          this.send(s, { t: Msg.Notice, kind: 'interact', data: j >= 0 ? { id: this.world.e.id(j), kind: this.world.e.kind[j] } : null });
          // Talking to a person: at most one answer per 4 s per viewer.
          if (j >= 0 && this.world.e.kind[j] === Kind.Agent && Date.now() - (s.talkAt ?? 0) > 4000) { s.talkAt = Date.now(); this.onTalk(s.name, s.avatar, j); }
        }
        return;
      }
      case Msg.View: {
        const mi = this.world.mapIndex.get(String(m.map));
        if (mi === undefined || !isNum(m.x, -1e5, 1e5) || !isNum(m.y, -1e5, 1e5) || !isNum(m.r, 1, 1e5)) {
          this.send(s, { t: Msg.Error, code: 'bad-view' });
          return;
        }
        s.view = { map: mi, x: m.x, y: m.y, r: Math.min(m.r, this.o.maxViewRadius) };
        return;
      }
      case Msg.Admin: {
        if (s.role !== 'admin') { this.send(s, { t: Msg.Error, code: 'forbidden' }); return; }
        const id = isNum(m.id) ? m.id : 0;
        try {
          const data = await this.admin(m.c, s.name);
          this.send(s, { t: Msg.AdminResult, id, ok: true, data });
        } catch (err) {
          this.send(s, { t: Msg.AdminResult, id, ok: false, err: String((err as Error).message ?? err) });
        }
        return;
      }
      default:
        this.send(s, { t: Msg.Error, code: 'unknown' });
    }
  }

  // ------------------------------------------------------------ interest management

  private broadcastFrames(): void {
    for (const s of this.sessions.values()) {
      if (s.ws && s.avatar >= 0 && this.ownsAvatar(s) && this.world.e.map[s.avatar] !== s.lastMap) this.sendYou(s);
      if (!s.ws || !s.view || s.ws.readyState !== 1) continue;
      if (s.ws.bufferedAmount > 512 * 1024) continue; // slow link: skip this frame
      this.sendChunks(s);
      this.sendFrame(s);
    }
  }

  private sendChunks(s: Session): void {
    const v = s.view!, m = this.world.maps[v.map]!, t = m.tiles;
    if (s.chunkMap !== v.map) {
      if (s.chunkMap >= 0 && s.chunks.size) this.send(s, { t: Msg.ChunkDrop, map: this.world.maps[s.chunkMap]!.def.id, keys: [...s.chunks.keys()] });
      s.chunks.clear();
      s.chunkMap = v.map;
    }
    const C = CHUNK_TILES, r = v.r + C;
    const cx0 = Math.max(0, Math.floor((v.x - r) / C)), cx1 = Math.min(t.cw - 1, Math.floor((v.x + r) / C));
    const cy0 = Math.max(0, Math.floor((v.y - r) / C)), cy1 = Math.min(t.ch - 1, Math.floor((v.y + r) / C));
    let sent = 0;
    // Nearest chunks first, at most 6 per frame (no bursts on a TV's Wi-Fi).
    const ccx = Math.floor(v.x / C), ccy = Math.floor(v.y / C);
    for (let ring = 0; ring <= Math.max(cx1 - cx0, cy1 - cy0) && sent < 6; ring++) {
      for (let cy = ccy - ring; cy <= ccy + ring && sent < 6; cy++) {
        for (let cx = ccx - ring; cx <= ccx + ring && sent < 6; cx++) {
          if (Math.max(Math.abs(cx - ccx), Math.abs(cy - ccy)) !== ring) continue;
          if (cx < cx0 || cx > cx1 || cy < cy0 || cy > cy1) continue;
          const k = chunkKey(cx, cy), ver = t.chunkVer[cy * t.cw + cx]!;
          if (s.chunks.get(k) === ver) continue;
          s.chunks.set(k, ver);
          this.send(s, { t: Msg.Chunk, map: m.def.id, cx, cy, ver, tiles: t.chunkTiles(cx, cy, this.chunkBuf) });
          sent++;
        }
      }
    }
    // Drop chunks well outside the view (hysteresis of one chunk).
    const far = r + C;
    let drop: number[] | null = null;
    for (const k of s.chunks.keys()) {
      const cx = k & 0xffff, cy = k >>> 16;
      const dx = Math.max(0, Math.abs((cx + 0.5) * C - v.x) - C / 2), dy = Math.max(0, Math.abs((cy + 0.5) * C - v.y) - C / 2);
      if (dx > far || dy > far) (drop ??= []).push(k);
    }
    if (drop) {
      for (const k of drop) s.chunks.delete(k);
      this.send(s, { t: Msg.ChunkDrop, map: m.def.id, keys: drop });
    }
  }

  private sendFrame(s: Session): void {
    const w = this.world, e = w.e, v = s.view!, m = w.maps[v.map]!;
    const n = m.grid.queryRect(e, v.x - v.r, v.y - v.r, v.x + v.r, v.y + v.r, this.scratch);
    const rec = this.rec;
    let rn = 0;
    let delEarly: number[] | null = null;
    // Mark what is in view now (known[] keeps id+1; a negative mark means "seen this frame").
    for (let k = 0; k < n; k++) {
      const i = this.scratch[k]!;
      const id = e.id(i);
      const qx = Math.round(e.x[i]! * POS_Q), qy = Math.round(e.y[i]! * POS_Q), qa = Math.round(e.angle[i]! * ANG_Q);
      // kind | flags << 8 | sub << 16 (items: item type; agents: current action).
      const kf = e.kind[i]! | (e.flags[i]! << 8) | ((e.kind[i] === Kind.Item ? e.sub[i]! : e.act[i]!) << 16);
      const was = s.known[i]!;
      if (was > 0 && was !== id + 1) (delEarly ??= []).push(was - 1); // slot reused by a new entity
      const changed = was !== id + 1 || s.q[i * 4] !== qx || s.q[i * 4 + 1] !== qy || s.q[i * 4 + 2] !== qa || s.q[i * 4 + 3] !== kf;
      s.known[i] = -(id + 1);
      if (!changed) continue;
      s.q[i * 4] = qx; s.q[i * 4 + 1] = qy; s.q[i * 4 + 2] = qa; s.q[i * 4 + 3] = kf;
      const o = rn * ENT_REC;
      rec[o] = id; rec[o + 1] = kf; rec[o + 2] = qx; rec[o + 3] = qy; rec[o + 4] = qa;
      rec[o + 5] = Math.round(e.vx[i]! * POS_Q); rec[o + 6] = Math.round(e.vy[i]! * POS_Q);
      rn++;
    }
    let del: number[] | null = delEarly;
    for (let k = 0; k < s.listN; k++) {
      const i = s.list[k]!;
      if (s.known[i]! > 0) { (del ??= []).push(s.known[i]! - 1); s.known[i] = 0; }
    }
    for (let k = 0; k < n; k++) { const i = this.scratch[k]!; s.known[i] = -s.known[i]!; s.list[k] = i; }
    s.listN = n;
    if (rn === 0 && !del) return;
    this.send(s, { t: Msg.Frame, tick: w.tick, gameSec: w.gameSec, map: m.def.id, upd: packI32(rec, rn * ENT_REC), del: del ?? [] });
  }

  private broadcastStats(): void {
    let st: ServerStats | null = null;
    for (const s of this.sessions.values()) {
      if (!s.ws || s.ws.readyState !== 1) continue;
      st ??= this.stats();
      this.send(s, { t: Msg.Stats, s: st });
    }
  }

  /** Slots no longer in any map (transit) are simply not in the grid, so they leave every view. */
  static readonly TRANSIT = NO_MAP;
}
