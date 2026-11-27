import { createServer, type IncomingMessage, type ServerResponse, type Server } from 'node:http';
import { randomBytes, timingSafeEqual } from 'node:crypto';
import { createReadStream, existsSync, statSync } from 'node:fs';
import { extname, join, normalize, resolve } from 'node:path';
import { WebSocketServer, type WebSocket } from 'ws';
import {
  Msg, Kind, KIND_RIDING, EFlag, Act, PROTOCOL_VERSION, CHUNK_TILES, ENT_REC, POS_Q, ANG_Q, encode, decode, packI32, chunkKey,
  type AdminCmd, type ClientMsg, type Role, type ServerMsg, type ServerStats,
  type ServerBuild,
} from '@worldsim/protocol';
import type { World } from '../sim/world.js';
import type { Logger } from '../log.js';
import { NO_MAP } from '../sim/entities.js';
import type { Players } from '../persist/players.js';
import type { Accounts } from '../persist/accounts.js';
import type { FirebaseAuth, AccountRole } from '../auth/firebase.js';

export interface NetOptions {
  host: string;
  port: number;
  netHz: number;
  maxViewRadius: number;
  maxClients: number;
  adminToken: string;
  players: Players;
  /** Firebase sign-ins (panel); off when no project is set. */
  auth?: FirebaseAuth;
  accounts?: Accounts;
  /** TVs join at once under their My PC profile name (no code to approve). */
  autoJoin?: () => boolean;
  staticDirs: { prefix: string; dir: string }[];
}

/** `owner` = the admin token or a Firebase owner (not an admin account): code-running and PC controls need it. */
export interface AdminHandler { (cmd: AdminCmd, who: string, owner: boolean): unknown | Promise<unknown> }

interface Session {
  id: string;
  ws: WebSocket | null;
  role: Role;
  name: string;
  ip: string;
  /** Signed in with Firebase. */
  acct?: { uid: string; role: AccountRole; email: string };
  view: { map: number; x: number; y: number; r: number } | null;
  chunks: Map<number, number>; // key -> version sent
  chunkMap: number;
  /** Last time this viewer talked to someone (A next to a person). */
  talkAt?: number;
  known: Int32Array; // slot -> id + 1 (0 = not known)
  q: Int32Array;     // slot -> last sent x, y, angle (quantized)
  g: Int32Array;     // slot -> last sent gear code
  horsesSent?: boolean;
  /** The weather sent last (Notice 'weather') and seconds since. */
  wxKey?: string;
  wxN?: number;
  /** Names this viewer already has (entity id -> name): only new ones are sent (Notice `names`, for names over heads). */
  names?: Map<number, string>;
  list: Int32Array;  // slots known after the last frame
  listN: number;
  /** Frames since the last one sent (a quiet view still gets one a second: the clock moves on). */
  idle: number;
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

/** Commands a Firebase player may send (all about themselves). */
const PLAYER_CMDS = new Set(['me', 'joinWorld', 'approveMine', 'revokeMine', 'chats', 'chatRead', 'chatSend']);

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
  private readonly gx: Int32Array;
  private readonly chunkBuf = new Uint8Array(CHUNK_TILES * CHUNK_TILES);
  private readonly ipConn = new Map<string, { n: number; at: number }>();
  private readonly ipFail = new Map<string, { n: number; at: number }>();
  private readonly ipPair = new Map<string, { n: number; at: number }>();
  stats: () => ServerStats = () => { throw new Error('stats not set'); };
  health: () => Record<string, unknown> = () => ({ ok: true });
  admin: AdminHandler = () => { throw new Error('no admin handler'); };
  welcomeExtra: () => Record<string, unknown> = () => ({});
  /** Admins' Welcome: the running build and its commands (app.ts). */
  adminWelcome: () => ServerBuild | undefined = () => undefined;
  onStop: () => void = () => {};
  /** A viewer pressed A next to a person (viewer name, their character's slot, the person's slot). */
  onTalk: (name: string, player: number, agent: number, text?: string) => void = () => {};
  /** A viewer is typing to person `agent`: they wait. */
  onHold: (player: number, agent: number) => void = () => {};
  /** A viewer's character does something (see Msg.Do). */
  onDo: (name: string, player: number, a: string, text?: string) => Record<string, unknown> = () => ({ ok: false });
  /** About one person; `seer` adds their thoughts and memory. */
  info: (id: number, seer: boolean) => unknown = () => null;
  /** Who may see thoughts (the owner's choice). */
  isSeer: (name: string) => boolean = () => false;
  /** Commands a Firebase account runs about itself (character, its TVs). */
  playerCmd: (c: AdminCmd, uid: string, role: AccountRole) => unknown | Promise<unknown> = () => { throw new Error('not ready'); };
  /** Thoughts of the people around (x, y) on map m, within r. */
  minds: (m: number, x: number, y: number, r: number) => unknown[] = () => [];
  /** Horses in a view (their look, who owns them) for every viewer, once a second. */
  horses: (m: number, x: number, y: number, r: number, me: number) => unknown[] = () => [];
  /** My character's needs. */
  me: (slot: number) => unknown = () => null;
  clockInfo!: () => import('@worldsim/protocol').ClockInfo;

  constructor(private readonly world: World, private readonly o: NetOptions, private readonly log: Logger) {
    const cap = world.e.cap;
    this.scratch = new Int32Array(cap);
    this.rec = new Int32Array(cap * ENT_REC);
    this.gx = new Int32Array(cap);
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
      const size = statSync(file).size;
      const head: Record<string, string | number> = {
        'content-type': MIME[extname(file)] ?? 'application/octet-stream',
        'access-control-allow-origin': '*',
        'cache-control': 'no-cache',
        'x-content-type-options': 'nosniff',
        'accept-ranges': 'bytes',
      };
      // Byte ranges (2026-11-27): the TV's sound loops start each pass from a random place, which needs a seekable stream.
      const m = /^bytes=(\d*)-(\d*)$/.exec(String(req.headers.range ?? ''));
      if (m && (m[1] || m[2])) {
        let a = m[1] ? +m[1] : Math.max(0, size - +m[2]!), b = m[1] && m[2] ? +m[2] : size - 1;
        b = Math.min(b, size - 1);
        if (a > b || a >= size) { res.writeHead(416, { 'content-range': `bytes */${size}` }); res.end(); return; }
        res.writeHead(206, { ...head, 'content-range': `bytes ${a}-${b}/${size}`, 'content-length': b - a + 1 });
        if (req.method === 'HEAD') { res.end(); return; }
        createReadStream(file, { start: a, end: b }).pipe(res);
        return;
      }
      res.writeHead(200, { ...head, 'content-length': size });
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
    let session: Session | null = null, busy = false;
    const helloTimer = setTimeout(() => ws.close(4001, 'hello timeout'), 5000);
    ws.on('message', (raw, isBinary) => {
      let m: ClientMsg;
      try {
        if (!isBinary) throw new Error('text');
        m = decode(raw as Buffer) as ClientMsg;
        if (!m || typeof m !== 'object' || typeof (m as { t?: unknown }).t !== 'string') throw new Error('shape');
      } catch { ws.close(4002, 'bad message'); return; }
      if (!session) {
        if (busy) return; // still checking the first hello
        if (m.t === Msg.Pair) { this.pair(ws, ip, m); return; }
        if (m.t !== Msg.Hello) { ws.close(4003, 'hello first'); return; }
        clearTimeout(helloTimer);
        busy = true;
        this.hello(ws, ip, m).then((s) => { session = s; busy = false; }, (err) => { this.log.warn('hello failed', { err: String(err) }); ws.close(4004, 'auth'); });
        return;
      }
      if (!this.rate(session)) { ws.close(4008, 'too many messages'); return; }
      this.onMessage(session, m).catch((err) => this.log.warn('message failed', { t: m.t, who: session?.name, err: String((err as Error)?.stack ?? err) }));
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

  private async hello(ws: WebSocket, ip: string, m: ClientMsg): Promise<Session | null> {
    if (m.t !== Msg.Hello) return null;
    const fail = (code: string) => { this.sendRaw(ws, { t: Msg.Error, code }); ws.close(4004, code); return null; };
    if (m.v !== PROTOCOL_VERSION) return fail('version');
    if (this.locked(ip)) return fail('locked');
    const token = typeof m.token === 'string' ? m.token : '';
    let role: Role | null = null, name = '', acct: Session['acct'];
    if (token.startsWith('fb:') && this.o.auth?.enabled && this.o.accounts) {
      // Firebase sign-in (panel): the role comes from Firestore roles/<uid>, read with the person's own token.
      try {
        const idt = token.slice(3), u = await this.o.auth.verify(idt), r = await this.o.auth.role(u.uid, idt);
        const a = this.o.accounts.seen(u.uid, u.email, r);
        acct = { uid: u.uid, role: r, email: u.email };
        role = r === 'player' ? 'player' : 'admin';
        name = a.name || `${r} ${u.uid.slice(0, 6)}`; // never the email in logs or the timeline
      } catch (err) { this.log.warn('firebase sign-in refused', { ip, err: String((err as Error).message ?? err) }); }
      if (ws.readyState !== 1) return null;
    } else if (this.o.adminToken && safeEq(token, this.o.adminToken)) { role = 'admin'; name = 'admin'; }
    else { const n = this.o.players.check(token); if (n) { role = 'viewer'; name = n; } }
    if (!role && token.startsWith('fb:')) return fail('auth'); // a signed token: expired or another project, not a guess
    if (!role) { this.authFailed(ip); this.log.warn('auth failed', { ip }); return fail('auth'); }
    this.pruneSessions();
    if (this.clientCount() >= this.o.maxClients) return fail('full');
    // Resume: same player, same session id within 2 minutes -> keep the view (state is resent).
    let s = typeof m.resume === 'string' ? this.sessions.get(m.resume) : undefined;
    if (s && (s.name !== name || s.ws)) s = undefined;
    if (!s) {
      const cap = this.world.e.cap;
      s = {
        id: randomBytes(12).toString('base64url'), ws, role, name, ip, acct, view: null,
        chunks: new Map(), chunkMap: -1, known: new Int32Array(cap), q: new Int32Array(cap * 4), g: new Int32Array(cap), list: new Int32Array(cap), listN: 0, idle: 0,
        tokens: 60, tokensAt: Date.now(), goneAt: 0, avatar: -1, avatarId: 0, lastMap: -2,
      };
      this.sessions.set(s.id, s);
    } else {
      s.ws = ws; s.goneAt = 0; s.chunks.clear(); s.known.fill(0); s.listN = 0; s.names = undefined;
    }
    const w = this.world;
    this.send(s, {
      t: Msg.Welcome, v: PROTOCOL_VERSION, session: s.id, role, scenario: w.sc.id,
      maps: w.maps.map((mm) => ({ id: mm.def.id, name: mm.def.name, w: mm.def.w, h: mm.def.h, tileSize: 1, chunkTiles: CHUNK_TILES })),
      portals: w.portals.map((p) => ({ id: p.id, map: p.map, x: p.x, y: p.y, to: p.to, toX: p.toX, toY: p.toY, travel: p.travel })),
      tiles: w.sc.tiles.map((t) => ({ id: t.id, name: t.name, solid: t.solid, color: t.color })),
      clock: this.clockInfo(),
      body: { radius: w.sc.agents.radius, walk: w.sc.agents.walk, run: w.sc.agents.run },
      seer: role === 'viewer' && this.isSeer(name),
      account: acct ? { uid: acct.uid, role: acct.role, name: this.o.accounts!.get(acct.uid)?.name ?? '', email: acct.email } : undefined,
      build: role === 'admin' ? this.adminWelcome() : undefined,
    });
    this.log.info('client joined', { name, role, resumed: !!(m as { resume?: string }).resume });
    return s;
  }

  /** Player characters: positions kept per player name between visits. */
  avatarStore: { get(name: string): { map: string; x: number; y: number } | null; set(name: string, p: { map: string; x: number; y: number }): void } = { get: () => null, set: () => {} };

  /** Players' characters in the world: [name, slot]. */
  characters(): [string, number][] {
    const out: [string, number][] = [];
    for (const [name, id] of this.residents) { const i = this.world.e.slot(id); if (i >= 0 && this.world.isChar(i)) out.push([name, i]); }
    return out;
  }
  /** Is this player here now (a screen connected)? */
  online(name: string): boolean { for (const s of this.sessions.values()) if (s.ws && s.name === name && s.avatar >= 0) return true; return false; }

  private ownsAvatar(s: Session): boolean {
    return s.avatar >= 0 && this.world.e.id(s.avatar) === s.avatarId && this.world.e.alive(s.avatar);
  }

  private join(s: Session): void {
    const w = this.world;
    if (!this.ownsAvatar(s)) {
      // One character per player name, even with two TVs.
      for (const o of this.sessions.values()) if (o !== s && o.name === s.name && this.ownsAvatar(o)) { s.avatar = o.avatar; s.avatarId = o.avatarId; o.avatar = -1; }
    }
    if (!this.ownsAvatar(s)) { // the character kept in the world while the player was away
      const r = this.residents.get(s.name);
      const i = r !== undefined ? w.e.slot(r) : -1;
      if (i >= 0 && w.isChar(i)) { s.avatar = i; s.avatarId = r!; }
    }
    if (!this.ownsAvatar(s)) {
      const p = this.avatarStore.get(s.name);
      const mi = p ? w.mapIndex.get(p.map) ?? 0 : 0;
      const def = w.maps[mi]!.def;
      w.makeRoom(1);
      const slot = w.spawnPlayer(mi, p?.x ?? def.w / 2, p?.y ?? def.h / 2);
      if (slot < 0) { this.log.error('a player could not join', { name: s.name, why: w.e.room === 0 ? w.fullText() : 'no free ground' }); this.send(s, { t: Msg.Error, code: 'full' }); return; }
      s.avatar = slot; s.avatarId = w.e.id(slot);
      this.residents.set(s.name, s.avatarId);
      this.log.info('player joined the world', { name: s.name, map: w.maps[mi]!.def.id });
    }
    // Awake and standing: the player is here (in watch mode it stays like that, doing nothing).
    const e = w.e, i = s.avatar;
    w.toPlayer(i); // the AI autopilot hands the controls back
    this.onCharacter(i, s.name);
    w.away.delete(s.avatarId);
    if (e.flags[i]! & EFlag.Sleeping) { e.flags[i] = e.flags[i]! & ~EFlag.Sleeping; e.act[i] = Act.Idle; }
    s.lastMap = -2;
    this.sendYou(s);
  }

  private sendYou(s: Session): void {
    const e = this.world.e, i = s.avatar;
    const m = e.map[i]!, transit = m === NO_MAP;
    const mi = transit ? e.toMap[i]! : m;
    s.lastMap = m;
    const g = transit ? this.world.gateLeft(i) : undefined;
    this.send(s, { t: Msg.You, id: s.avatarId, map: this.world.maps[mi]!.def.id, transit, arrive: transit ? e.arrive[i] : undefined, secs: g?.secs, left: g?.left, horse: transit ? this.world.horses.rideLook(i) : undefined, x: transit ? e.ax[i] : e.x[i], y: transit ? e.ay[i] : e.y[i] });
    if (!transit) s.view = { map: m, x: e.x[i]!, y: e.y[i]!, r: s.view?.r ?? 40 };
  }

  /** Players' characters stay in the world 24/7 (imad 2026-11-20): name -> entity id. */
  readonly residents = new Map<string, number>();

  /** At start: every known player's character lies asleep where they left it. */
  spawnResidents(names: string[]): void {
    const w = this.world;
    for (const name of new Set(names)) {
      if (this.residents.has(name)) continue;
      const p = this.avatarStore.get(name);
      const mi = p ? w.mapIndex.get(p.map) ?? 0 : 0;
      const def = w.maps[mi]!.def;
      w.makeRoom(1);
      const i = w.spawnPlayer(mi, p?.x ?? def.w / 2, p?.y ?? def.h / 2);
      if (i < 0) { this.log.error('a player\'s character could not be made', { name, why: w.e.room === 0 ? w.fullText() : 'no free ground' }); continue; }
      this.residents.set(name, w.e.id(i));
      this.onCharacter(i, name);
      this.sleepAway(i);
    }
  }

  /** A player's character gets its person profile (sex, skin, partner, children, autopilot): set by the app. */
  onCharacter: (i: number, name: string) => void = (i, name) => { this.world.playerProfile(i, name); };

  /** After a restart: a character kept in the snapshot is that player's again (asleep, or on autopilot). */
  adopt(name: string, i: number): void {
    this.residents.set(name, this.world.e.id(i));
    if (this.world.e.kind[i] === Kind.Player) this.sleepAway(i);
  }

  /** The player is away: the AI autopilot (if they turned it on) or sleep. */
  private goAway(i: number): void {
    if (this.world.profileOf(i)?.auto) { this.world.away.delete(this.world.e.id(i)); this.world.toAgent(i); }
    else this.sleepAway(i);
  }

  /** The player is away: the character lies down and sleeps until they come back. */
  private sleepAway(i: number): void {
    const w = this.world, e = w.e;
    w.setInput(i, 0, 0, false);
    e.inX[i] = e.inY[i] = 0;
    e.flags[i] = e.flags[i]! | EFlag.Sleeping; e.act[i] = Act.Sleep;
    w.away.add(e.id(i));
  }

  /** The player left: the character stays where it is and falls asleep (unless another of their screens is still here). */
  private leave(s: Session): void {
    if (this.closing) return; // the final snapshot saves every character's place
    if (!this.ownsAvatar(s)) { s.avatar = -1; return; }
    const w = this.world, e = w.e, i = s.avatar;
    for (const o of this.sessions.values()) if (o !== s && o.ws && o.name === s.name) { o.avatar = i; o.avatarId = s.avatarId; s.avatar = -1; return; }
    const mi = e.map[i] === NO_MAP ? e.toMap[i]! : e.map[i]!;
    const x = e.map[i] === NO_MAP ? e.ax[i]! : e.x[i]!, y = e.map[i] === NO_MAP ? e.ay[i]! : e.y[i]!;
    this.avatarStore.set(s.name, { map: w.maps[mi]!.def.id, x, y });
    this.residents.set(s.name, s.avatarId);
    if (e.kind[i] === Kind.Agent && !w.profileOf(i)?.auto) w.toPlayer(i); // the watch-mode autopilot ends with the screen
    this.goAway(i);
    s.avatar = -1;
  }

  /** Save every connected character's position (snapshots, shutdown). */
  saveAvatars(): void {
    const w = this.world, e = w.e;
    for (const [name, id] of this.residents) {
      const i = e.slot(id);
      if (i < 0 || !w.isChar(i)) continue;
      const s = { name };
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
    if (this.o.autoJoin?.()) {
      // Players join with their TV's My PC username: nobody has to approve a code.
      const r = this.o.players.approve(p.code);
      this.log.info('player joined from a TV', { name: r.name, dev: p.dev, ip });
      return;
    }
    this.sendRaw(ws, { t: Msg.PairCode, code: p.code, exp: p.at + 600_000 });
    this.notifyAdmins('pairing', { code: p.code, name: p.name, dev: p.dev });
    this.log.info('pairing requested', { name: p.name, dev: p.dev, ip });
  }

  /** Someone said something on map m: viewers looking at that map and every admin hear it. */
  /** Tell the player whose character is in that slot. */
  noticeTo(slot: number, kind: string, data: unknown): void {
    for (const s of this.sessions.values()) if (s.ws && s.avatar === slot && this.ownsAvatar(s)) this.send(s, { t: Msg.Notice, kind, data });
  }

  /** A notice for every viewer looking at map m (not the admins' panels). */
  toMap(m: number, kind: string, data: unknown): void {
    for (const s of this.sessions.values()) if (s.ws && s.view && s.view.map === m) this.send(s, { t: Msg.Notice, kind, data });
  }

  /** A notice for every TV (not the admins' panels): the world channel's lines for the chat log. */
  toViewers(kind: string, data: unknown): void {
    for (const s of this.sessions.values()) if (s.ws && s.role === 'viewer') this.send(s, { t: Msg.Notice, kind, data });
  }

  say(m: number, data: { id: number; name: string; text: string }): void {
    for (const s of this.sessions.values()) {
      if (s.role === 'admin' || (s.view && s.view.map === m)) this.send(s, { t: Msg.Notice, kind: 'say', data });
    }
  }

  /** Panels signed in with an account whose character is one of `names` (null = every signed-in account with a character). */
  noticeAccounts(names: string[] | null, kind: string, data: unknown): void {
    const want = names ? new Set(names) : null;
    for (const s of this.sessions.values()) {
      if (!s.ws || !s.acct) continue;
      const n = this.o.accounts?.get(s.acct.uid)?.name;
      if (n && (!want || want.has(n))) this.send(s, { t: Msg.Notice, kind, data });
    }
  }

  notifyAdmins(kind: string, data?: unknown): void {
    for (const s of this.sessions.values()) if (s.role === 'admin') this.send(s, { t: Msg.Notice, kind, data });
  }

  /** Close a player's connections without an error: their TVs connect again by themselves (after a rename). */
  reconnect(name: string): number {
    let n = 0;
    for (const [id, s] of this.sessions) {
      if (s.role !== 'viewer' || s.name !== name) continue;
      if (s.ws) { s.ws.close(1012, 'again'); n++; }
      this.sessions.delete(id);
    }
    return n;
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
        if (m.watch === true && this.ownsAvatar(s)) { this.world.toAgent(s.avatar); this.world.away.delete(s.avatarId); } // watching: the AI plays my character
        return;
      }
      case Msg.Input: {
        if (s.avatar < 0 || !this.ownsAvatar(s)) return;
        const mx = isNum(m.mx, -1, 1) ? m.mx : 0, my = isNum(m.my, -1, 1) ? m.my : 0;
        this.world.setInput(s.avatar, mx, my, m.run === true);
        if (isNum(m.x, 0, 4096) && isNum(m.y, 0, 4096)) this.world.trustMove(s.avatar, m.x, m.y);
        if (m.act === true) {
          const j = this.world.nearest(s.avatar, 2.5);
          this.send(s, { t: Msg.Notice, kind: 'interact', data: j >= 0 ? { id: this.world.e.id(j), kind: this.world.e.kind[j] } : null });
          // Talking to a person: at most one answer per 4 s per viewer.
          if (j >= 0 && this.world.e.kind[j] === Kind.Agent && Date.now() - (s.talkAt ?? 0) > 4000) { s.talkAt = Date.now(); this.world.e.lonely[s.avatar] = Math.max(0, this.world.e.lonely[s.avatar]! - 15); this.onTalk(s.name, s.avatar, j); }
        }
        return;
      }
      case Msg.Do: {
        if (s.avatar < 0 || !this.ownsAvatar(s) || typeof m.a !== 'string' || m.a.length > 12) return;
        if (m.a === 'rideShown') { this.world.gateShown(s.avatar); return; } // the TV shows the road between maps: its clock starts
        if (m.a === 'hold') { // I am typing what to say: the person waits for me
          const j = this.world.nearest(s.avatar, 3);
          if (j >= 0 && this.world.e.kind[j] === Kind.Agent) this.onHold(s.avatar, j);
          return;
        }
        if (m.a === 'talk') {
          const j = this.world.nearest(s.avatar, 3);
          const text = typeof m.text === 'string' ? m.text.trim().slice(0, 300) : '';
          if (j >= 0 && this.world.e.kind[j] === Kind.Agent && (text || Date.now() - (s.talkAt ?? 0) > 4000)) { s.talkAt = Date.now(); this.world.e.lonely[s.avatar] = Math.max(0, this.world.e.lonely[s.avatar]! - 15); this.onTalk(s.name, s.avatar, j, text || undefined); }
          this.send(s, { t: Msg.Notice, kind: 'did', data: { a: 'talk', ok: j >= 0, code: j >= 0 ? 'talk' : 'nobody' } });
          return;
        }
        this.send(s, { t: Msg.Notice, kind: 'did', data: { a: m.a, ...this.onDo(s.name, s.avatar, m.a, typeof m.text === 'string' ? m.text.slice(0, m.a === 'ruleAdd' || m.a === 'clan' || m.a === 'mark' ? 210 : 40) : undefined) } });
        if ((m.a === 'equip' || m.a === 'upgrade' || m.a === 'craft' || m.a === 'medkit' || m.a === 'take' || m.a === 'use') && s.avatar >= 0 && this.ownsAvatar(s)) this.send(s, { t: Msg.Notice, kind: 'me', data: this.me(s.avatar) }); // the bag / gear screens at once
        this.send(s, { t: Msg.Notice, kind: 'me', data: this.me(s.avatar) });
        return;
      }
      case Msg.Info: {
        if (!isNum(m.id, 0, 2 ** 31)) return;
        this.send(s, { t: Msg.Notice, kind: 'info', data: this.info(m.id, s.role === 'admin' || this.isSeer(s.name)) });
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
        const id = isNum(m.id) ? m.id : 0;
        const mine = PLAYER_CMDS.has(String((m.c as { cmd?: unknown } | undefined)?.cmd));
        if (s.role !== 'admin' && !(mine && s.acct)) { this.send(s, { t: Msg.Error, code: 'forbidden' }); return; }
        try {
          // A Firebase player only asks about themselves; staff use the same commands for their own character.
          const data = mine && s.acct ? await this.playerCmd(m.c, s.acct.uid, s.acct.role) : await this.admin(m.c, s.name, !s.acct || s.acct.role === 'owner');
          if (mine && s.acct && (m.c as { cmd: string }).cmd === 'joinWorld') s.name = this.o.accounts!.get(s.acct.uid)?.name || s.name;
          this.send(s, { t: Msg.AdminResult, id, ok: true, data });
        } catch (err) {
          this.send(s, { t: Msg.AdminResult, id, ok: false, err: String((err as Error).message ?? err) });
        }
        return;
      }
      default:
        this.log.warn('unknown message', { source: 'net', t: String((m as { t?: unknown }).t), who: s.name, role: s.role });
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
      const kf = (e.kind[i]! | (w.horses.riding[i] ? KIND_RIDING : 0)) | (e.flags[i]! << 8) | ((e.kind[i] === Kind.Item ? e.sub[i]! : e.act[i]!) << 16) | (e.kind[i] === Kind.Animal ? w.horses.look(i) << 24 : e.kind[i] === Kind.Npc || ((e.kind[i] === Kind.Player || e.kind[i] === Kind.Agent) && e.sub[i]) ? (e.sub[i]! & 0x3f) << 24 : 0); // kind (bit 7 = riding / ridden); animals: type in bits 24+ (horses: + quality << 3, coat << 5); npcs: role; players' characters: look (1 + skin, +8 woman)
      const was = s.known[i]!;
      if (was > 0 && was !== id + 1) (delEarly ??= []).push(was - 1); // slot reused by a new entity
      const gc = w.gear.code(i);
      const changed = was !== id + 1 || s.q[i * 4] !== qx || s.q[i * 4 + 1] !== qy || s.q[i * 4 + 2] !== qa || s.q[i * 4 + 3] !== kf || s.g[i] !== gc;
      s.known[i] = -(id + 1);
      if (!changed) continue;
      s.q[i * 4] = qx; s.q[i * 4 + 1] = qy; s.q[i * 4 + 2] = qa; s.q[i * 4 + 3] = kf; s.g[i] = gc;
      this.gx[rn] = gc;
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
    let dead: number[] | undefined;
    if (del && w.fell.size) for (const id of del) if (w.fell.has(id)) (dead ??= []).push(id);
    for (let k = 0; k < n; k++) { const i = this.scratch[k]!; s.known[i] = -s.known[i]!; s.list[k] = i; }
    s.listN = n;
    if (rn === 0 && !del && ++s.idle < this.o.netHz) return;
    s.idle = 0;
    this.send(s, { t: Msg.Frame, tick: w.tick, gameSec: w.gameSec, map: m.def.id, upd: packI32(rec, rn * ENT_REC), del: del ?? [], gx: packI32(this.gx, rn), cs: w.opt.clockScale, ...(dead ? { dead } : {}) });
  }

  private broadcastStats(): void {
    let st: ServerStats | null = null;
    for (const s of this.sessions.values()) {
      if (!s.ws || s.ws.readyState !== 1) continue;
      st ??= this.stats();
      this.send(s, { t: Msg.Stats, s: st });
      if (s.role !== 'viewer') continue;
      if (s.avatar >= 0 && this.ownsAvatar(s)) this.send(s, { t: Msg.Notice, kind: 'me', data: this.me(s.avatar) });
      if (s.view) { const hs = this.horses(s.view.map, s.view.x, s.view.y, s.view.r, s.avatar); if (hs.length || s.horsesSent) this.send(s, { t: Msg.Notice, kind: 'horses', data: hs }); s.horsesSent = hs.length > 0; }
      if (s.view) this.sendNames(s);
      if (s.view) { // the season and the sky over the map I look at: when it changes, else every 10 s
        const wx = this.world.weather.info(s.view.map), key = `${wx.s}|${wx.day}|${wx.w}|${Math.round(wx.t)}`;
        if (key !== s.wxKey || (s.wxN = (s.wxN ?? 0) + 1) >= 10) { s.wxKey = key; s.wxN = 0; this.send(s, { t: Msg.Notice, kind: 'weather', data: wx }); }
      }
      if (s.view && this.isSeer(s.name)) this.send(s, { t: Msg.Notice, kind: 'minds', data: this.minds(s.view.map, s.view.x, s.view.y, s.view.r) });
    }
  }

  /** Names of the people, players and town teachers in view that this viewer does not have yet: [[id, name], ...] (imad 2026-11-26: names over heads). */
  private sendNames(s: Session): void {
    const w = this.world, e = w.e, v = s.view!, out: [number, string][] = [];
    const have = s.names ??= new Map();
    if (have.size > 3000) have.clear();
    for (let i = 0; i < e.hi && out.length < 80; i++) {
      const k = e.kind[i];
      if ((k !== Kind.Agent && k !== Kind.Player && k !== Kind.Npc) || e.map[i] !== v.map) continue;
      if (Math.abs(e.x[i]! - v.x) > v.r || Math.abs(e.y[i]! - v.y) > v.r) continue;
      const id = e.id(i), n = this.nameFor(i);
      if (!n || have.get(id) === n) continue;
      have.set(id, n); out.push([id, n]);
    }
    if (out.length) this.send(s, { t: Msg.Notice, kind: 'names', data: out });
  }
  /** The name shown over someone's head (set by the app). */
  nameFor: (i: number) => string = (i) => this.world.profileOf(i)?.name ?? '';

  /** Slots no longer in any map (transit) are simply not in the grid, so they leave every view. */
  static readonly TRANSIT = NO_MAP;
}
