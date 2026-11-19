import {
  Msg, PROTOCOL_VERSION, CHUNK_TILES, ENT_REC, POS_Q, ANG_Q, EFlag, Kind, encode, decode, unpackI32, chunkKey,
  type ServerMsg, type Welcome,
} from '@worldsim/protocol';
import { t, setLang } from './i18n.js';

/**
 * World viewer, a My PC app. Watches the simulation (never changes it): free camera or follow a person,
 * any map. Pairs once per My PC profile (the TV shows a code, the owner approves it in the control panel)
 * and keeps its token with MyPC.save. One rAF loop, fixed 60 Hz update, no allocation per frame.
 */
declare const MyPC: any;

const VERSION = '0.2.0';
const canvas = document.getElementById('c') as HTMLCanvasElement;
const ctx = canvas.getContext('2d', { alpha: false })!;
const screenEl = document.getElementById('screen')!;
const hudTop = document.getElementById('top')!;
const hudHint = document.getElementById('hint')!;

// ------------------------------------------------------------ state
type Auth = { token: string; name: string; server: string };
let auth: Auth | null = null;
let server = '';
let ws: WebSocket | null = null;
let mode: 'connect' | 'offline' | 'noserver' | 'pair' | 'pairfail' | 'world' = 'connect';
let pairCode = '';
let retry = 0, retryTimer = 0;
let welcome: Welcome | null = null;
let map = '';
let mapW = 256, mapH = 256;
let camX = 128, camY = 128, zoom = 10; // px per metre
let tierLow = false;
let remoteOnly = true;
const colors = new Map<number, string>();
const chunkCanvas = new Map<number, HTMLCanvasElement>();
let chunkKeys = new Int32Array(256), chunkN = 0; // list for the draw loop (no Map iterator per frame)
const chunkList: HTMLCanvasElement[] = [];
let gameSec = 0, tickAt = 0;
let agentsTotal = 0;

const CAP = 4096;
const eid = new Int32Array(CAP).fill(-1);
const kind = new Uint8Array(CAP), flags = new Uint8Array(CAP);
const px = new Float32Array(CAP), py = new Float32Array(CAP), nx = new Float32Array(CAP), ny = new Float32Array(CAP), ang = new Float32Array(CAP);
const slotOf = new Map<number, number>();
let frameAt = 0, frameGap = 100;
let follow = -1; // entity id

// ------------------------------------------------------------ sprites (drawn once)
const SPR = 48;
function makeSprite(body: string, ring: string): HTMLCanvasElement {
  const c = document.createElement('canvas'); c.width = c.height = SPR;
  const g = c.getContext('2d')!;
  g.fillStyle = 'rgba(0,0,0,0.35)'; g.beginPath(); g.ellipse(SPR / 2 + 3, SPR / 2 + 5, 15, 11, 0, 0, 6.283); g.fill();
  const gr = g.createRadialGradient(SPR / 2 - 5, SPR / 2 - 6, 2, SPR / 2, SPR / 2, 17);
  gr.addColorStop(0, '#fff6e8'); gr.addColorStop(0.35, body); gr.addColorStop(1, '#2a1a10');
  g.fillStyle = gr; g.beginPath(); g.arc(SPR / 2, SPR / 2, 15, 0, 6.283); g.fill();
  g.lineWidth = 3; g.strokeStyle = ring; g.stroke();
  return c;
}
const sprAgent = makeSprite('#e8955a', '#1b1b1b');
const sprFollow = makeSprite('#ffd166', '#ffffff');
const sprSleep = makeSprite('#8aa6b8', '#1b1b1b');

function hexColor(n: number): string { return '#' + n.toString(16).padStart(6, '0'); }
function shade(n: number, f: number): string {
  const r = Math.min(255, ((n >> 16) & 255) * f) | 0, g = Math.min(255, ((n >> 8) & 255) * f) | 0, b = Math.min(255, (n & 255) * f) | 0;
  return `rgb(${r},${g},${b})`;
}

/** A chunk drawn once at 8 px per tile, with a little shading so walls and trees stand up from the ground. */
function drawChunk(tiles: Uint8Array): HTMLCanvasElement {
  const P = 8, c = document.createElement('canvas');
  c.width = c.height = CHUNK_TILES * P;
  const g = c.getContext('2d')!;
  const solid = new Set(welcome!.tiles.filter((x) => x.solid).map((x) => x.id));
  const byId = new Map(welcome!.tiles.map((x) => [x.id, x]));
  for (let i = 0; i < tiles.length; i++) {
    const id = tiles[i]!, info = byId.get(id), x = (i % CHUNK_TILES) * P, y = ((i / CHUNK_TILES) | 0) * P;
    const col = info?.color ?? 0;
    const v = 0.9 + (((i * 2654435761) >>> 28) / 16) * 0.2; // fixed per-tile variation
    g.fillStyle = shade(col, v); g.fillRect(x, y, P, P);
    if (info?.name === 'tree') {
      g.fillStyle = 'rgba(0,0,0,0.3)'; g.beginPath(); g.arc(x + 5, y + 6, 4, 0, 6.283); g.fill();
      g.fillStyle = shade(col, 1.25); g.beginPath(); g.arc(x + 4, y + 4, 3.6, 0, 6.283); g.fill();
    } else if (solid.has(id) && info?.name !== 'water') {
      g.fillStyle = shade(col, 1.3); g.fillRect(x, y, P, 2);
      g.fillStyle = shade(col, 0.6); g.fillRect(x, y + P - 2, P, 2);
    }
  }
  return c;
}

function rebuildChunkList(): void {
  chunkN = 0; chunkList.length = 0;
  if (chunkKeys.length < chunkCanvas.size) chunkKeys = new Int32Array(chunkCanvas.size * 2);
  for (const [k, cv] of chunkCanvas) { chunkKeys[chunkN++] = k; chunkList.push(cv); }
}

// ------------------------------------------------------------ screens
function show(m: typeof mode, extra = ''): void {
  mode = m;
  canvas.style.visibility = m === 'world' ? 'visible' : 'hidden';
  hudTop.hidden = hudHint.hidden = m !== 'world';
  screenEl.hidden = m === 'world';
  let html = '';
  switch (m) {
    case 'connect': html = `<h1>${t('connecting')}</h1>`; break;
    case 'offline': html = `<h1>${t('offline')}</h1><p class="dim">${esc(server)}</p><p class="key">A · ${t('menuServer')}</p>`; break;
    case 'noserver': html = `<h1>${t('noServer')}</h1><p class="key">${t('enterServer')}</p>`; break;
    case 'pair': html = `<h1>${t('pairTitle')}</h1><p>${t('pairHow')}</p><div class="code">${pairCode.slice(0, 3)} ${pairCode.slice(3)}</div><p class="dim">${esc(panelUrl())}</p><p class="dim">${t('pairWait')}</p>`; break;
    case 'pairfail': html = `<h1>${extra}</h1>`; break;
  }
  screenEl.innerHTML = html;
  if (m === 'pair') MyPC.announce?.(`${t('pairTitle')}. ${pairCode.split('').join(' ')}`);
}
const esc = (s: string) => s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
const panelUrl = () => server.replace(/\/+$/, '') + '/panel/';

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

function profileName(): string { return String(MyPC.info?.().profile?.name ?? 'Player'); }
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
      break;
    case Msg.Welcome: {
      welcome = m;
      colors.clear();
      for (const x of m.tiles) colors.set(x.id, hexColor(x.color));
      gameSec = m.clock.gameSec; tickAt = performance.now();
      if (!map || !m.maps.some((x) => x.id === map)) setMap(String(MyPC.load('map', m.maps[0]!.id)));
      else { chunkCanvas.clear(); rebuildChunkList(); clearEntities(); }
      show('world');
      sendView();
      break;
    }
    case Msg.Chunk:
      if (m.map !== map || !welcome) break;
      chunkCanvas.set(chunkKey(m.cx, m.cy), drawChunk(m.tiles));
      rebuildChunkList();
      break;
    case Msg.ChunkDrop:
      if (m.map !== map) break;
      for (const k of m.keys) chunkCanvas.delete(k);
      rebuildChunkList();
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
        if (fresh) { px[s] = nx[s]!; py[s] = ny[s]!; }
      }
      for (const id of m.del) {
        const s = slotOf.get(id);
        if (s !== undefined) { eid[s] = -1; kind[s] = 0; slotOf.delete(id); }
        if (id === follow) follow = -1;
      }
      break;
    }
    case Msg.Stats: agentsTotal = m.s.agents; break;
  }
}

function slotFor(id: number): number {
  const s = slotOf.get(id);
  if (s !== undefined) return s;
  for (let i = 0; i < CAP; i++) if (eid[i] === -1) { eid[i] = id; slotOf.set(id, i); return i; }
  return -1;
}
function clearEntities(): void { eid.fill(-1); kind.fill(0); slotOf.clear(); follow = -1; }

function setMap(id: string): void {
  if (!welcome) return;
  const mm = welcome.maps.find((x) => x.id === id) ?? welcome.maps[0]!;
  map = mm.id; mapW = mm.w; mapH = mm.h;
  camX = mm.w / 2; camY = mm.h / 2;
  chunkCanvas.clear(); rebuildChunkList(); clearEntities();
  MyPC.save('map', map);
  sendView();
}

function viewRadius(): number { return Math.hypot(canvas.width, canvas.height) / zoom / 2 + 6; }
function sendView(): void { if (welcome) send({ t: Msg.View, map, x: camX, y: camY, r: viewRadius() }); }

// ------------------------------------------------------------ actions
function nextMap(): void {
  if (!welcome) return;
  const i = welcome.maps.findIndex((x) => x.id === map);
  setMap(welcome.maps[(i + 1) % welcome.maps.length]!.id);
  MyPC.announce?.(welcome.maps.find((x) => x.id === map)!.name);
}
function zoomBy(f: number): void { zoom = Math.max(3, Math.min(40, zoom * f)); MyPC.save('zoom', zoom); }

/** Follow the next person on screen (nearest to the centre first, then around). */
function followNext(): void {
  let best = -1, bestD = Infinity, after = -1, afterD = Infinity;
  const cur = follow >= 0 ? slotOf.get(follow) ?? -1 : -1;
  const curD = cur >= 0 ? Math.hypot(nx[cur]! - camX, ny[cur]! - camY) : -1;
  for (let i = 0; i < CAP; i++) {
    if (eid[i] === -1 || kind[i] !== Kind.Agent || i === cur) continue;
    const d = Math.hypot(nx[i]! - camX, ny[i]! - camY);
    if (d < bestD) { bestD = d; best = i; }
    if (d > curD && d < afterD) { afterD = d; after = i; }
  }
  const pick = cur >= 0 && after >= 0 ? after : best;
  if (pick >= 0) { follow = eid[pick]!; MyPC.announce?.(`${t('following')} #${follow & 0xffff}`); }
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

function unpair(): void {
  auth = null; MyPC.save('auth', null); retry = 0; connect();
}

// ------------------------------------------------------------ loop
const STEP = 1000 / 60;
let raf = 0, last = 0, acc = 0, viewAt = 0, hudAt = 0;
const held = { left: false, right: false, up: false, down: false };

function update(): void {
  if (mode !== 'world') return;
  let ax = MyPC.gamepad ? MyPC.gamepad.axis(0) : 0, ay = MyPC.gamepad ? MyPC.gamepad.axis(1) : 0;
  if (Math.abs(ax) < 0.15) ax = 0; if (Math.abs(ay) < 0.15) ay = 0;
  if (held.left) ax = -1; if (held.right) ax = 1; if (held.up) ay = -1; if (held.down) ay = 1;
  if (ax || ay) {
    follow = -1;
    const sp = 600 / zoom / 60; // screen-relative speed
    camX = Math.max(0, Math.min(mapW, camX + ax * sp)); camY = Math.max(0, Math.min(mapH, camY + ay * sp));
  }
  if (MyPC.gamepad) {
    const rz = MyPC.gamepad.axis(3);
    if (Math.abs(rz) > 0.2) zoom = Math.max(3, Math.min(40, zoom * (1 - rz * 0.02)));
    if (MyPC.gamepad.pressed(4)) zoom = Math.max(3, zoom / 1.015);
    if (MyPC.gamepad.pressed(5)) zoom = Math.min(40, zoom * 1.015);
  }
  if (follow >= 0) {
    const s = slotOf.get(follow);
    if (s === undefined) follow = -1;
    else { camX += (nx[s]! - camX) * 0.08; camY += (ny[s]! - camY) * 0.08; }
  }
}

function draw(now: number): void {
  const W = canvas.width, H = canvas.height;
  ctx.fillStyle = '#0b0d10';
  ctx.fillRect(0, 0, W, H);
  if (mode !== 'world') return;
  const ox = W / 2 - camX * zoom, oy = H / 2 - camY * zoom, cs = CHUNK_TILES * zoom;
  for (let k = 0; k < chunkN; k++) {
    const key = chunkKeys[k]!;
    const x = ox + (key & 0xffff) * cs, y = oy + (key >>> 16) * cs;
    if (x > W || y > H || x + cs < 0 || y + cs < 0) continue;
    ctx.drawImage(chunkList[k]!, x, y, cs + 0.5, cs + 0.5);
  }
  // Portals: a soft ring.
  if (welcome) for (let i = 0; i < welcome.portals.length; i++) {
    const p = welcome.portals[i]!;
    if (p.map !== map) continue;
    ctx.strokeStyle = 'rgba(120,230,255,0.8)'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(ox + p.x * zoom, oy + p.y * zoom, 2 * zoom, 0, 6.283); ctx.stroke();
  }
  const a = Math.min(1.25, (now - frameAt) / frameGap);
  const size = Math.max(14, 0.8 * zoom);
  for (let i = 0; i < CAP; i++) {
    if (eid[i] === -1) continue;
    const x = ox + (px[i]! + (nx[i]! - px[i]!) * a) * zoom, y = oy + (py[i]! + (ny[i]! - py[i]!) * a) * zoom;
    if (x < -size || y < -size || x > W + size || y > H + size) continue;
    if (kind[i] === Kind.Projectile) { ctx.fillStyle = '#fff3a0'; ctx.fillRect(x - 2, y - 2, 4, 4); continue; }
    const spr = eid[i] === follow ? sprFollow : flags[i]! & EFlag.Sleeping ? sprSleep : sprAgent;
    ctx.drawImage(spr, x - size / 2, y - size / 2, size, size);
  }
  // Day / night: a tint over the world (one fillRect).
  const hour = ((gameSec + ((now - tickAt) / 1000) * 10) / 3600 + 8) % 24;
  const night = hour < 5 || hour > 21 ? 1 : hour < 7 ? (7 - hour) / 2 : hour > 19 ? (hour - 19) / 2 : 0;
  if (night > 0) { ctx.fillStyle = `rgba(10,20,60,${(night * 0.55).toFixed(2)})`; ctx.fillRect(0, 0, W, H); }
}

function frame(ts: number): void {
  raf = requestAnimationFrame(frame);
  if (!last) last = ts;
  acc += Math.min(250, ts - last); last = ts;
  while (acc >= STEP) { update(); acc -= STEP; }
  draw(ts);
  if (ts - viewAt > 250) { viewAt = ts; sendView(); }
  if (ts - hudAt > 500 && mode === 'world') { hudAt = ts; updateHud(ts); }
}

let hudText = '';
function updateHud(now: number): void {
  const gs = gameSec + ((now - tickAt) / 1000) * 10;
  const day = Math.floor((gs / 3600 + 8) / 24) + 1, h = Math.floor((gs / 3600 + 8) % 24), mi = Math.floor((gs / 60) % 60);
  const mname = welcome?.maps.find((x) => x.id === map)?.name ?? map;
  const fol = follow >= 0 ? `${t('following')} #${follow & 0xffff}` : t('free');
  const txt = `${mname} · ${t('day')} ${day} ${String(h).padStart(2, '0')}:${String(mi).padStart(2, '0')} · ${agentsTotal} ${t('agents')} · ${fol}`;
  if (txt !== hudText) { hudText = txt; hudTop.textContent = txt; }
}

function resize(): void {
  const s = Math.min(1, (tierLow ? 0.75 : 1) * Math.min(1920 / innerWidth, 1080 / innerHeight, window.devicePixelRatio || 1));
  canvas.width = Math.round(innerWidth * s); canvas.height = Math.round(innerHeight * s);
  ctx.imageSmoothingEnabled = false;
}

function startLoop(): void { if (!raf) { last = 0; acc = 0; raf = requestAnimationFrame(frame); } }
function stopLoop(): void { if (raf) cancelAnimationFrame(raf); raf = 0; }

// ------------------------------------------------------------ My PC
MyPC.init({
  keys: ['channel'],
  onInit(info: { lang: string; quality?: { tier: string } }) {
    setLang(info.lang);
    document.documentElement.lang = info.lang;
    tierLow = info.quality?.tier === 'low';
    const cfg = (MyPC.app_config ?? {}) as { server?: string };
    const q = new URLSearchParams(location.search);
    auth = MyPC.load('auth', null);
    // Served by the world server itself (through its tunnel): that is the server.
    const own = /github\.io$/i.test(location.hostname) ? '' : location.origin;
    server = String(q.get('server') || cfg.server || MyPC.load('server', '') || auth?.server || own);
    zoom = Number(MyPC.load('zoom', 14)) || 14;
    resize();
    window.addEventListener('resize', resize);
    MyPC.setMenu([
      { id: 'map', label: t('menuMap') }, { id: 'zin', label: t('menuZoomIn') }, { id: 'zout', label: t('menuZoomOut') },
      { id: 'server', label: t('menuServer') }, { id: 'unpair', label: t('menuUnpair') },
    ]);
    hudHint.textContent = t('hintsRemote');
    if (MyPC.gamepad) {
      MyPC.gamepad.on('pads', (list: unknown[]) => { remoteOnly = !list.length; hudHint.textContent = t(remoteOnly ? 'hintsRemote' : 'hints'); });
      MyPC.gamepad.on('button', (i: number, pressed: boolean) => {
        if (!pressed || mode !== 'world') return;
        if (i === 2) nextMap();
      });
    }
    MyPC.ready();
  },
  onStart() { connect(); startLoop(); },
  onPause: stopLoop,
  onResume: startLoop,
  onDestroy() {
    stopLoop(); clearTimeout(retryTimer);
    window.removeEventListener('resize', resize);
    if (ws) { ws.onclose = null; ws.close(); ws = null; }
  },
  onMenu(id: string) {
    if (id === 'map') nextMap();
    else if (id === 'zin') zoomBy(1.4);
    else if (id === 'zout') zoomBy(1 / 1.4);
    else if (id === 'server') void askServer();
    else if (id === 'unpair') unpair();
  },
  onInput(action: string, pressed: boolean): boolean | void {
    if (action in held) { held[action as keyof typeof held] = pressed; return; }
    if (!pressed) return;
    if (mode === 'noserver' || mode === 'offline') { if (action === 'confirm') void askServer(); return action === 'cancel' ? false : undefined; }
    if (mode === 'pairfail') { if (action === 'confirm') { retry = 0; mode = 'connect'; connect(); } return action === 'cancel' ? false : undefined; }
    if (mode !== 'world') return action === 'cancel' ? false : undefined;
    if (action === 'confirm') followNext();
    else if (action === 'pageUp') zoomBy(1.25);
    else if (action === 'pageDown') zoomBy(0.8);
    else if (action === 'cancel') { if (follow >= 0) { follow = -1; return true; } return false; }
  },
});
void VERSION;
