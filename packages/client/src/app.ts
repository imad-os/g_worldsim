import {
  Msg, PROTOCOL_VERSION, CHUNK_TILES, ENT_REC, POS_Q, ANG_Q, EFlag, Kind, encode, decode, unpackI32, chunkKey,
  type ServerMsg, type Welcome,
} from '@worldsim/protocol';
import { Color, type Group } from 'three';
import { t, tf, setLang } from './i18n.js';
import { World3D, type Tier } from './gfx/world3d.js';
import { buildChunk } from './gfx/chunkmesh.js';
import { looksFor, hash2, type Look } from './gfx/look.js';
import type { PersonLook } from './gfx/people.js';

/**
 * The world, as a My PC app. 3D low-poly with a tilted camera. Two ways to be there:
 *  - Play (default): your own character, moved with the stick / arrows, B runs, A talks; the camera follows you.
 *    Your moves are predicted here and corrected softly by the server (it owns the truth).
 *  - Watch: free camera, follow a person, any map.
 * Pairs once per My PC profile (the TV shows a code, the owner approves it in the control panel) and keeps its
 * token with MyPC.save. One rAF loop, fixed 60 Hz update, no allocation per frame in the loop.
 */
declare const MyPC: any;

const canvas = document.getElementById('c') as HTMLCanvasElement;
const screenEl = document.getElementById('screen')!;
const hudTop = document.getElementById('top')!;
const hudHint = document.getElementById('hint')!;
const noteEl = document.getElementById('note')!;

// ------------------------------------------------------------ state
type Auth = { token: string; name: string; server: string };
let auth: Auth | null = null;
let server = '';
let ws: WebSocket | null = null;
let mode: 'connect' | 'offline' | 'noserver' | 'pair' | 'pairfail' | 'nogl' | 'world' = 'connect';
let how: 'play' | 'watch' = 'play';
let pairCode = '';
let retry = 0, retryTimer = 0;
let welcome: Welcome | null = null;
let map = '';
let mapW = 256, mapH = 256;
let camX = 128, camY = 128;
let tier: Tier = 'mid';
let remoteOnly = true;
let g3: World3D | null = null;
let looks: Look[] = [];
const solid = new Uint8Array(256);
const tilesOf = new Map<number, Uint8Array>();
const meshOf = new Map<number, Group>();
const buildQ: number[] = [];
let gameSec = 0, tickAt = 0, clockScale = 10, simSpeed = 1;
let agentsTotal = 0;
let body = { radius: 0.3, walk: 1.4, run: 3.5 };

const CAP = 4096;
const eid = new Int32Array(CAP).fill(-1);
const kind = new Uint8Array(CAP), flags = new Uint8Array(CAP);
const px = new Float32Array(CAP), py = new Float32Array(CAP), nx = new Float32Array(CAP), ny = new Float32Array(CAP);
const vx = new Float32Array(CAP), vy = new Float32Array(CAP), ang = new Float32Array(CAP);
const face = new Float32Array(CAP), phase = new Float32Array(CAP), spd = new Float32Array(CAP), lastX = new Float32Array(CAP), lastY = new Float32Array(CAP);
const lookOf: PersonLook[] = [];
const slotOf = new Map<number, number>();
let frameAt = 0, frameGap = 100;
let follow = -1; // entity id (watch)

// Me (play).
let meId = -1, meTransit = false, meArrive = 0, meTo = '';
let predX = 0, predY = 0, pvx = 0, pvy = 0, predOk = false;
let rtt = 150;
let sentMx = 0, sentMy = 0, sentRun = false, sentAt = 0, seq = 0;
let runHeld = false;
const held = { left: false, right: false, up: false, down: false };

// ------------------------------------------------------------ people palette (post-apocalypse: worn, muted)
const C = (h: number) => new Color(h);
const TUNICS = [0x8b5a3c, 0x6b7d4a, 0x5a6f86, 0x9a7b4f, 0x7a4b4b, 0x5e5e6e, 0xa0683a, 0x4f6b5e, 0x8a7f6a].map(C);
const SKINS = [0xf1c9a5, 0xe0ac82, 0xc68b5e, 0x9c6a43, 0x6e4a2f].map(C);
const HAIRS = [0x2b1d14, 0x4a3020, 0x7a5230, 0xc9a46a, 0x1a1a1a, 0x8a8a8a].map(C);
const PANTS = [0x3b3a40, 0x4a3d30, 0x2f3b4a, 0x50483d].map(C);
const ME: PersonLook = { tunic: C(0x2fa36b), skin: C(0xe8b890), hair: C(0x3a2416), pants: C(0x3a3f5a) };
const OTHER_PLAYER: PersonLook = { tunic: C(0xd9822b), skin: C(0xd8a27a), hair: C(0x2b1d14), pants: C(0x40404a) };
const GOLD = C(0xffd166), WHITE = C(0xffffff);
function lookFor(id: number): PersonLook {
  const h = (k: number) => hash2(id & 0xffff, k);
  const pick = (a: Color[], k: number) => a[Math.floor(h(k) * a.length)]!;
  return { tunic: pick(TUNICS, 1), skin: pick(SKINS, 2), hair: pick(HAIRS, 3), pants: pick(PANTS, 4) };
}

// ------------------------------------------------------------ screens
function show(m: typeof mode, extra = ''): void {
  mode = m;
  canvas.style.visibility = m === 'world' ? 'visible' : 'hidden';
  hudTop.hidden = hudHint.hidden = m !== 'world';
  if (m !== 'world') noteEl.hidden = true;
  screenEl.hidden = m === 'world';
  let html = '';
  switch (m) {
    case 'connect': html = `<h1>${t('connecting')}</h1>`; break;
    case 'offline': html = `<h1>${t('offline')}</h1><p class="dim">${esc(server)}</p><p class="key">A · ${t('menuServer')}</p>`; break;
    case 'noserver': html = `<h1>${t('noServer')}</h1><p class="key">${t('enterServer')}</p>`; break;
    case 'pair': html = `<h1>${t('pairTitle')}</h1><p>${t('pairHow')}</p><div class="code">${pairCode.slice(0, 3)} ${pairCode.slice(3)}</div><p class="dim">${esc(panelUrl())}</p><p class="dim">${t('pairWait')}</p>`; break;
    case 'pairfail': html = `<h1>${extra}</h1>`; break;
    case 'nogl': html = `<h1>${t('noGl')}</h1>`; break;
  }
  screenEl.innerHTML = html;
  if (m === 'pair') MyPC.announce?.(`${t('pairTitle')}. ${pairCode.split('').join(' ')}`);
  updateHints();
}
const esc = (s: string) => s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
const panelUrl = () => server.replace(/\/+$/, '') + '/panel/';

let noteTimer = 0;
function note(text: string, ms = 3500): void {
  noteEl.textContent = text; noteEl.hidden = false;
  clearTimeout(noteTimer);
  if (ms > 0) noteTimer = window.setTimeout(() => { noteEl.hidden = true; }, ms);
  MyPC.announce?.(text);
}

function wsUrl(addr: string): string {
  let a = addr.trim().replace(/\/+$/, '');
  if (!/^[a-z]+:\/\//i.test(a)) a = 'https://' + a;
  return a.replace(/^http/i, 'ws') + '/ws';
}

// ------------------------------------------------------------ network
function connect(): void {
  clearTimeout(retryTimer);
  if (ws) { ws.onclose = null; ws.close(); ws = null; }
  if (!server) { show('noserver'); return; }
  if (mode !== 'world') show(retry > 1 ? 'offline' : 'connect');
  let sock: WebSocket;
  try { sock = new WebSocket(wsUrl(server)); } catch { show('noserver'); return; }
  sock.binaryType = 'arraybuffer';
  ws = sock;
  sock.onopen = () => {
    retry = 0;
    if (auth?.token) sock.send(encode({ t: Msg.Hello, v: PROTOCOL_VERSION, token: auth.token, name: profileName() }));
    else sock.send(encode({ t: Msg.Pair, v: PROTOCOL_VERSION, name: profileName(), dev: deviceName() }));
  };
  sock.onmessage = (ev) => onMsg(decode(ev.data as ArrayBuffer) as ServerMsg);
  sock.onclose = () => {
    if (ws !== sock) return;
    ws = null;
    if (mode === 'pairfail') return;
    retry++;
    if (mode !== 'world' || retry > 2) show('offline');
    retryTimer = window.setTimeout(connect, Math.min(15000, 1000 * 2 ** Math.min(retry, 4)));
  };
}

function profileName(): string { return String(MyPC.info?.().profile?.name || auth?.name || 'Player'); }
function deviceName(): string { return /Tizen|SMART-TV/i.test(navigator.userAgent) ? 'Samsung TV' : /Android/i.test(navigator.userAgent) ? 'Android' : 'Browser'; }

function send(m: object): void { if (ws && ws.readyState === 1) ws.send(encode(m as never)); }

function onMsg(m: ServerMsg): void {
  switch (m.t) {
    case Msg.PairCode: pairCode = m.code; show('pair'); break;
    case Msg.Paired:
      auth = { token: m.token, name: m.name, server };
      MyPC.save('auth', auth);
      ws?.close(); // reconnect with the token
      break;
    case Msg.Error:
      if (m.code === 'auth') { auth = null; MyPC.save('auth', null); setTimeout(connect, 300); }
      else if (m.code === 'expired' || m.code === 'denied') { show('pairfail', t(m.code === 'expired' ? 'pairExpired' : 'pairDenied')); }
      else if (m.code === 'full') note(t('worldFull'));
      break;
    case Msg.Welcome: {
      welcome = m;
      looks = looksFor(m.tiles);
      solid.fill(0);
      for (const x of m.tiles) if (x.solid) solid[x.id] = 1;
      if (m.body) body = m.body;
      gameSec = m.clock.gameSec; tickAt = performance.now(); clockScale = m.clock.clockScale; simSpeed = m.clock.paused ? 0 : m.clock.speed;
      if (!g3) {
        try { g3 = new World3D(canvas, tier); } catch { show('nogl'); return; }
        resize();
      }
      if (!map || !m.maps.some((x) => x.id === map)) setMap(String(MyPC.load('map', m.maps[0]!.id)));
      else setMap(map);
      show('world');
      if (how === 'play') send({ t: Msg.Join });
      sendView();
      break;
    }
    case Msg.You: {
      meId = m.id; meTransit = m.transit; meTo = m.map;
      meArrive = m.arrive ?? 0;
      predOk = false;
      if (!m.transit && m.map !== map) setMap(m.map);
      if (m.transit) note(tf('travelling', mapName(m.map)), 0);
      else noteEl.hidden = true;
      break;
    }
    case Msg.Notice:
      if (m.kind === 'interact') {
        const d = m.data as { id: number; kind: number } | null;
        note(!d ? t('nobody') : d.kind === Kind.Player ? t('metPlayer') : t('metAgent'));
      }
      break;
    case Msg.Pong: rtt = rtt * 0.7 + (performance.now() - m.c) * 0.3; break;
    case Msg.Chunk: {
      if (m.map !== map || !welcome) break;
      const k = chunkKey(m.cx, m.cy);
      tilesOf.set(k, m.tiles);
      queueBuild(k);
      break;
    }
    case Msg.ChunkDrop:
      if (m.map !== map) break;
      for (const k of m.keys) {
        tilesOf.delete(k);
        const g = meshOf.get(k);
        if (g) { g3?.removeChunk(g); meshOf.delete(k); }
      }
      break;
    case Msg.Frame: {
      if (m.map !== map) break;
      const now = performance.now();
      frameGap = frameGap * 0.85 + Math.min(400, now - frameAt) * 0.15;
      frameAt = now;
      gameSec = m.gameSec; tickAt = now;
      for (let i = 0; i < CAP; i++) if (eid[i] !== -1) { px[i] = nx[i]!; py[i] = ny[i]!; }
      const r = unpackI32(m.upd);
      for (let o = 0; o < r.length; o += ENT_REC) {
        const s = slotFor(r[o]!);
        if (s < 0) continue;
        const fresh = kind[s] === 0;
        kind[s] = r[o + 1]! & 255; flags[s] = r[o + 1]! >> 8;
        nx[s] = r[o + 2]! / POS_Q; ny[s] = r[o + 3]! / POS_Q; ang[s] = r[o + 4]! / ANG_Q;
        vx[s] = r[o + 5]! / POS_Q; vy[s] = r[o + 6]! / POS_Q;
        if (fresh) {
          px[s] = lastX[s] = nx[s]!; py[s] = lastY[s] = ny[s]!; spd[s] = 0; phase[s] = 0;
          face[s] = Math.atan2(vx[s]!, vy[s]!) || 0;
          lookOf[s] = lookFor(r[o]!);
        }
      }
      for (const id of m.del) {
        const s = slotOf.get(id);
        if (s !== undefined) { eid[s] = -1; kind[s] = 0; slotOf.delete(id); }
        if (id === follow) follow = -1;
      }
      break;
    }
    case Msg.Stats: agentsTotal = m.s.agents; simSpeed = m.s.paused ? 0 : m.s.speed; break;
  }
}

function slotFor(id: number): number {
  const s = slotOf.get(id);
  if (s !== undefined) return s;
  for (let i = 0; i < CAP; i++) if (eid[i] === -1) { eid[i] = id; slotOf.set(id, i); return i; }
  return -1;
}
function clearEntities(): void { eid.fill(-1); kind.fill(0); slotOf.clear(); follow = -1; }
const mapName = (id: string) => welcome?.maps.find((x) => x.id === id)?.name ?? id;

// ------------------------------------------------------------ chunks
function queueBuild(k: number): void {
  if (!buildQ.includes(k)) buildQ.push(k);
}
/** Tile at a position local to chunk k (reads the neighbour chunk past the edges; -1 = not here yet). */
function tileAt(k: number, lx: number, ly: number): number {
  let cx = k & 0xffff, cy = k >>> 16;
  if (lx < 0) { cx--; lx += CHUNK_TILES; } else if (lx >= CHUNK_TILES) { cx++; lx -= CHUNK_TILES; }
  if (ly < 0) { cy--; ly += CHUNK_TILES; } else if (ly >= CHUNK_TILES) { cy++; ly -= CHUNK_TILES; }
  if (cx < 0 || cy < 0) return -1;
  const t = tilesOf.get(chunkKey(cx, cy));
  return t ? t[ly * CHUNK_TILES + lx]! : -1;
}
/** Build the nearest waiting chunk (one per frame keeps frames smooth). */
function buildOne(): void {
  if (!buildQ.length || !g3) return;
  let best = 0, bd = Infinity;
  const fx = focusX() / CHUNK_TILES - 0.5, fy = focusY() / CHUNK_TILES - 0.5;
  for (let i = 0; i < buildQ.length; i++) {
    const k = buildQ[i]!, d = Math.hypot((k & 0xffff) - fx, (k >>> 16) - fy);
    if (d < bd) { bd = d; best = i; }
  }
  const k = buildQ.splice(best, 1)[0]!;
  if (!tilesOf.has(k)) return;
  const old = meshOf.get(k);
  if (old) g3.removeChunk(old);
  const geo = buildChunk(k & 0xffff, k >>> 16, (lx, ly) => tileAt(k, lx, ly), looks, tier === 'high');
  meshOf.set(k, g3.addChunk(geo.ground, geo.props));
}

function setMap(id: string): void {
  if (!welcome) return;
  const mm = welcome.maps.find((x) => x.id === id) ?? welcome.maps[0]!;
  map = mm.id; mapW = mm.w; mapH = mm.h;
  camX = mm.w / 2; camY = mm.h / 2;
  tilesOf.clear(); meshOf.clear(); buildQ.length = 0;
  g3?.setMap(mm.w, mm.h, welcome.portals.filter((p) => p.map === map));
  clearEntities();
  predOk = false; snapCam = true;
  MyPC.save('map', map);
  sendView();
}

function viewRadius(): number { return Math.min(96, (g3?.dist ?? 24) * 1.2 + 14); }
function sendView(): void { if (welcome) send({ t: Msg.View, map, x: focusX(), y: focusY(), r: viewRadius() }); }

// ------------------------------------------------------------ play: my character
function meSlot(): number { return meId >= 0 ? slotOf.get(meId) ?? -1 : -1; }
function playing(): boolean { return how === 'play' && meId >= 0 && !meTransit; }
function focusX(): number { return playing() && predOk ? predX : camX; }
function focusY(): number { return playing() && predOk ? predY : camY; }

function solidAt(x: number, y: number): boolean {
  const tx = Math.floor(x), ty = Math.floor(y);
  if (tx < 0 || ty < 0 || tx >= mapW || ty >= mapH) return true;
  const t = tilesOf.get(chunkKey((tx / CHUNK_TILES) | 0, (ty / CHUNK_TILES) | 0));
  return t ? solid[t[(ty % CHUNK_TILES) * CHUNK_TILES + (tx % CHUNK_TILES)]!] === 1 : false;
}
function blocked(x: number, y: number): boolean {
  const r = body.radius * 0.9;
  return solidAt(x - r, y - r) || solidAt(x + r, y - r) || solidAt(x - r, y + r) || solidAt(x + r, y + r);
}

function stick(): [number, number] {
  let ax = MyPC.gamepad ? MyPC.gamepad.axis(0) : 0, ay = MyPC.gamepad ? MyPC.gamepad.axis(1) : 0;
  if (Math.hypot(ax, ay) < 0.18) { ax = 0; ay = 0; }
  if (held.left) ax = -1; if (held.right) ax = 1; if (held.up) ay = -1; if (held.down) ay = 1;
  const l = Math.hypot(ax, ay);
  if (l > 1) { ax /= l; ay /= l; }
  return [ax, ay];
}
const STICK: [number, number] = [0, 0];

function updatePlay(dt: number, now: number): void {
  const [mx, my] = stick();
  STICK[0] = mx; STICK[1] = my;
  const run = runHeld || (!!MyPC.gamepad && (MyPC.gamepad.pressed(1) || MyPC.gamepad.pressed(2) || MyPC.gamepad.pressed(3)));
  // Send controls on change, and every 200 ms while held.
  const qx = Math.round(mx * 50) / 50, qy = Math.round(my * 50) / 50;
  if (qx !== sentMx || qy !== sentMy || run !== sentRun || ((qx || qy) && now - sentAt > 200)) {
    sentMx = qx; sentMy = qy; sentRun = run; sentAt = now;
    send({ t: Msg.Input, mx: qx, my: qy, run, seq: ++seq });
  }
  const s = meSlot();
  if (s < 0) return;
  if (!predOk) { predX = nx[s]!; predY = ny[s]!; pvx = pvy = 0; predOk = true; }
  // Same rule as the server: velocity eases towards the wish at 8 m/s^2 at most.
  const sp = run ? body.run : body.walk;
  const wx = mx * sp, wy = my * sp, ax = wx - pvx, ay = wy - pvy, a = Math.hypot(ax, ay), mdv = 8 * dt;
  const f = a > mdv ? mdv / a : 1;
  pvx += ax * f; pvy += ay * f;
  const nxp = predX + pvx * dt;
  if (!blocked(nxp, predY)) predX = nxp; else pvx = 0;
  const nyp = predY + pvy * dt;
  if (!blocked(predX, nyp)) predY = nyp; else pvy = 0;
  // Correct softly towards where the server says I am (moved on by the time since that frame).
  const lag = Math.min(0.5, (now - frameAt) / 1000 + rtt / 2000);
  const sx = nx[s]! + vx[s]! * lag, sy = ny[s]! + vy[s]! * lag;
  const ex = sx - predX, ey = sy - predY, e = Math.hypot(ex, ey);
  if (e > 2.5) { predX = sx; predY = sy; }
  else { const k = 1 - Math.exp(-dt * (e > 0.6 ? 6 : 2.5)); predX += ex * k; predY += ey * k; }
}

// ------------------------------------------------------------ watch
function nextMap(): void {
  if (!welcome) return;
  const i = welcome.maps.findIndex((x) => x.id === map);
  setMap(welcome.maps[(i + 1) % welcome.maps.length]!.id);
  MyPC.announce?.(mapName(map));
}
function zoomBy(f: number): void {
  if (!g3) return;
  g3.dist = Math.max(12, Math.min(70, g3.dist * f));
  MyPC.save('dist', g3.dist);
}

function followNext(): void {
  let best = -1, bestD = Infinity, after = -1, afterD = Infinity;
  const cur = follow >= 0 ? slotOf.get(follow) ?? -1 : -1;
  const curD = cur >= 0 ? Math.hypot(nx[cur]! - camX, ny[cur]! - camY) : -1;
  for (let i = 0; i < CAP; i++) {
    if (eid[i] === -1 || (kind[i] !== Kind.Agent && kind[i] !== Kind.Player) || i === cur) continue;
    const d = Math.hypot(nx[i]! - camX, ny[i]! - camY);
    if (d < bestD) { bestD = d; best = i; }
    if (d > curD && d < afterD) { afterD = d; after = i; }
  }
  const pick = cur >= 0 && after >= 0 ? after : best;
  if (pick >= 0) { follow = eid[pick]!; MyPC.announce?.(`${t('following')} #${follow & 0xffff}`); }
}

function updateWatch(): void {
  const [ax, ay] = stick();
  if (ax || ay) {
    follow = -1;
    const sp = ((g3?.dist ?? 24) / 24) * 0.35;
    camX = Math.max(0, Math.min(mapW, camX + ax * sp)); camY = Math.max(0, Math.min(mapH, camY + ay * sp));
  }
  if (follow >= 0) {
    const s = slotOf.get(follow);
    if (s === undefined) follow = -1;
    else { camX = nx[s]!; camY = ny[s]!; }
  }
}

function setHow(h: typeof how): void {
  how = h;
  MyPC.save('how', h);
  setMenu();
  updateHints();
  if (h === 'play') { send({ t: Msg.Join }); predOk = false; snapCam = true; }
  else {
    send({ t: Msg.Input, mx: 0, my: 0, run: false, seq: ++seq });
    const s = meSlot();
    if (s >= 0) { camX = nx[s]!; camY = ny[s]!; }
  }
}

async function askServer(): Promise<void> {
  const v: string | null = MyPC.text?.keyboard
    ? await MyPC.text.keyboard({ value: server, kind: 'url', label: t('serverLabel'), ok: 'OK' })
    : window.prompt(t('serverLabel'), server);
  if (v === null || !v.trim()) return;
  server = v.trim();
  MyPC.save('server', server);
  retry = 0;
  connect();
}

function unpair(): void { auth = null; MyPC.save('auth', null); retry = 0; connect(); }

function setMenu(): void {
  MyPC.setMenu([
    { id: 'how', label: t(how === 'play' ? 'menuWatch' : 'menuPlay') },
    ...(how === 'watch' ? [{ id: 'map', label: t('menuMap') }] : []),
    { id: 'zin', label: t('menuZoomIn') }, { id: 'zout', label: t('menuZoomOut') },
    { id: 'server', label: t('menuServer') }, { id: 'unpair', label: t('menuUnpair') },
  ]);
}

function updateHints(): void {
  hudHint.textContent = t(how === 'play' ? (remoteOnly ? 'hintsPlayRemote' : 'hintsPlay') : (remoteOnly ? 'hintsRemote' : 'hints'));
}

// ------------------------------------------------------------ loop
const STEP = 1000 / 60;
let raf = 0, last = 0, acc = 0, viewAt = 0, hudAt = 0, pingAt = 0;
let snapCam = true;

function update(now: number): void {
  if (mode !== 'world') return;
  if (how === 'play') updatePlay(STEP / 1000, now); else updateWatch();
}

function draw(now: number, dt: number): void {
  if (mode !== 'world' || !g3) return;
  buildOne();
  const fx = focusX(), fy = focusY();
  g3.follow(fx, fy, dt, snapCam);
  snapCam = false;
  const gs = gameSec + ((now - tickAt) / 1000) * clockScale * simSpeed;
  g3.setHour(((gs / 3600 + 8) % 24 + 24) % 24, now / 1000);
  const a = Math.min(1.25, (now - frameAt) / frameGap);
  const P = g3.people, me = playing() && predOk ? meSlot() : -1, tsec = now / 1000;
  const r = g3.dist * 1.6 + 8;
  P.begin(); g3.beginShots();
  for (let i = 0; i < CAP; i++) {
    if (eid[i] === -1) continue;
    let x = px[i]! + (nx[i]! - px[i]!) * a, y = py[i]! + (ny[i]! - py[i]!) * a;
    if (i === me) { x = predX; y = predY; }
    if (Math.abs(x - fx) > r || Math.abs(y - fy) > r) continue;
    if (kind[i] === Kind.Projectile) { g3.shot(x, y); continue; }
    if (kind[i] !== Kind.Agent && kind[i] !== Kind.Player) continue;
    // Walk cycle from the distance really covered on screen.
    const ddx = x - lastX[i]!, ddy = y - lastY[i]!, moved = Math.hypot(ddx, ddy);
    lastX[i] = x; lastY[i] = y;
    const v = dt > 0 ? Math.min(6, moved / dt) : 0;
    spd[i] = spd[i]! + (v - spd[i]!) * Math.min(1, dt * 10);
    if (moved > 0.004) {
      const want = Math.atan2(ddx, ddy);
      let d = want - face[i]!;
      d = Math.atan2(Math.sin(d), Math.cos(d));
      face[i] = face[i]! + d * Math.min(1, dt * 12);
    }
    phase[i] = (phase[i]! + moved * 4.2) % (Math.PI * 2);
    const lying = (flags[i]! & (EFlag.Sleeping | EFlag.Dead)) !== 0;
    const look = i === me || eid[i] === meId ? ME : kind[i] === Kind.Player ? OTHER_PLAYER : lookOf[i]!;
    P.add(x, y, face[i]!, phase[i]!, Math.min(1, spd[i]! / 2.2), look, lying);
    if (kind[i] === Kind.Player) P.marker(x, y, tsec, eid[i] === meId ? GOLD : WHITE);
    else if (eid[i] === follow) P.marker(x, y, tsec, GOLD);
  }
  P.end(); g3.endShots();
  g3.render();
}

function frame(ts: number): void {
  raf = requestAnimationFrame(frame);
  if (!last) last = ts;
  const dt = Math.min(0.1, (ts - last) / 1000);
  acc += Math.min(250, ts - last); last = ts;
  while (acc >= STEP) { update(ts); acc -= STEP; }
  draw(ts, dt);
  if (ts - viewAt > 250) { viewAt = ts; sendView(); }
  if (ts - pingAt > 3000) { pingAt = ts; send({ t: Msg.Ping, c: ts }); }
  if (ts - hudAt > 500 && mode === 'world') { hudAt = ts; updateHud(ts); }
}

let hudText = '';
function updateHud(now: number): void {
  const gs = gameSec + ((now - tickAt) / 1000) * clockScale * simSpeed;
  const day = Math.floor((gs / 3600 + 8) / 24) + 1, h = Math.floor((gs / 3600 + 8) % 24), mi = Math.floor((gs / 60) % 60);
  const who = how === 'play' ? profileName() : follow >= 0 ? `${t('following')} #${follow & 0xffff}` : t('free');
  const txt = `${mapName(map)} · ${t('day')} ${day} ${String(h).padStart(2, '0')}:${String(mi).padStart(2, '0')} · ${agentsTotal} ${t('agents')} · ${who}`;
  if (txt !== hudText) { hudText = txt; hudTop.textContent = txt; }
  if (meTransit && how === 'play') {
    const left = Math.max(0, Math.ceil((meArrive - gs) / Math.max(0.01, clockScale * simSpeed)));
    noteEl.textContent = `${tf('travelling', mapName(meTo))} ${left} s`;
    noteEl.hidden = false;
  }
}

function resize(): void {
  const s = Math.min(1, Math.min(1920 / innerWidth, 1080 / innerHeight, window.devicePixelRatio || 1)) * (tier === 'low' ? 0.6 : tier === 'mid' ? 0.8 : 1);
  g3?.resize(Math.round(innerWidth * s), Math.round(innerHeight * s));
}

function startLoop(): void { if (!raf) { last = 0; acc = 0; raf = requestAnimationFrame(frame); } }
function stopLoop(): void {
  if (raf) cancelAnimationFrame(raf);
  raf = 0;
  held.left = held.right = held.up = held.down = false; runHeld = false;
  if (how === 'play') send({ t: Msg.Input, mx: 0, my: 0, run: false, seq: ++seq });
  sentMx = sentMy = 0;
}

// ------------------------------------------------------------ My PC
MyPC.init({
  keys: ['channel'],
  onInit(info: { lang: string; quality?: { tier: Tier } }) {
    setLang(info.lang);
    document.documentElement.lang = info.lang;
    tier = info.quality?.tier ?? 'mid';
    const q = new URLSearchParams(location.search);
    if (q.get('tier') === 'low' || q.get('tier') === 'mid' || q.get('tier') === 'high') tier = q.get('tier') as Tier;
    const cfg = (MyPC.app_config ?? {}) as { server?: string };
    auth = MyPC.load('auth', null);
    // Served by the world server itself (through its tunnel): that is the server.
    const own = /github\.io$/i.test(location.hostname) ? '' : location.origin;
    server = String(q.get('server') || cfg.server || MyPC.load('server', '') || auth?.server || own);
    how = MyPC.load('how', 'play') === 'watch' ? 'watch' : 'play';
    if (q.get('watch') !== null) how = 'watch';
    window.addEventListener('resize', resize);
    setMenu();
    if (MyPC.gamepad) {
      MyPC.gamepad.on('pads', (list: unknown[]) => { remoteOnly = !list.length; updateHints(); });
      MyPC.gamepad.on('button', (i: number, pressed: boolean) => {
        if (!pressed || mode !== 'world') return;
        if (i === 2 && how === 'watch') nextMap();
        else if (i === 4) zoomBy(1.15);
        else if (i === 5) zoomBy(1 / 1.15);
      });
    }
    MyPC.ready();
  },
  onStart() {
    const d = Number(MyPC.load('dist', 24)) || 24;
    connect(); startLoop();
    queueMicrotask(() => { if (g3) g3.dist = d; });
    startDist = d;
  },
  onPause: stopLoop,
  onResume: startLoop,
  onDestroy() {
    stopLoop(); clearTimeout(retryTimer);
    window.removeEventListener('resize', resize);
    if (ws) { ws.onclose = null; ws.close(); ws = null; }
    g3?.dispose(); g3 = null;
  },
  onMenu(id: string) {
    if (id === 'how') setHow(how === 'play' ? 'watch' : 'play');
    else if (id === 'map') nextMap();
    else if (id === 'zin') zoomBy(1 / 1.3);
    else if (id === 'zout') zoomBy(1.3);
    else if (id === 'server') void askServer();
    else if (id === 'unpair') unpair();
  },
  onInput(action: string, pressed: boolean, _repeat?: boolean, dev?: string): boolean | void {
    if (action in held) { held[action as keyof typeof held] = pressed; return; }
    if (action === 'run') { runHeld = pressed; return; }
    if (!pressed) return action === 'cancel' && isPad(dev) ? true : undefined;
    if (mode === 'noserver' || mode === 'offline') { if (action === 'confirm') void askServer(); return action === 'cancel' ? false : undefined; }
    if (mode === 'pairfail') { if (action === 'confirm') { retry = 0; mode = 'connect'; connect(); } return action === 'cancel' ? false : undefined; }
    if (mode !== 'world') return action === 'cancel' ? false : undefined;
    if (action === 'pageUp') { zoomBy(1 / 1.2); return; }
    if (action === 'pageDown') { zoomBy(1.2); return; }
    if (how === 'play') {
      if (action === 'confirm' && playing()) send({ t: Msg.Input, mx: sentMx, my: sentMy, run: sentRun, act: true, seq: ++seq });
      // B on a controller runs (held); the remote's Back has nothing to close here: My PC's menu.
      if (action === 'cancel') return isPad(dev) ? true : false;
      return;
    }
    if (action === 'confirm') followNext();
    else if (action === 'cancel') { if (follow >= 0) { follow = -1; return true; } return false; }
  },
});
let startDist = 24;
void startDist;
const isPad = (dev?: string) => !!dev && /^(pad|touch)/.test(dev);
