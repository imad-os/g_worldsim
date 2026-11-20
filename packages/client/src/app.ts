import {
  Msg, PROTOCOL_VERSION, CHUNK_TILES, ENT_REC, POS_Q, ANG_Q, EFlag, Kind, encode, decode, unpackI32, chunkKey,
  type ServerMsg, type Welcome,
} from '@worldsim/protocol';
import { Color, type Group } from 'three';
import { t, tf, setLang, type Key } from './i18n.js';
import { RESOURCES, CATEGORIES, RECIPES_ALL, PLACEABLE, ANIMAL_NAMES, matchRecipe, type Recipe } from '@worldsim/protocol';
import { World3D, type Tier } from './gfx/world3d.js';
import { buildChunk } from './gfx/chunkmesh.js';
import { looksFor, hash2, type Look } from './gfx/look.js';
import type { PersonLook } from './gfx/people.js';
import { ReplayPlayer, gameTime, type ReplayRec, type ReplaySummary } from './replay.js';
import {
  ACTIONS, DEFAULT_BINDS, cloneBinds, padAction, remoteAction, remoteName, actionLabel, Menu, Bubbles, bar, personHtml,
  type ActionId, type Binds, type Page, type Row, type PersonInfo,
} from './ui.js';
import { Wheel, type WheelItem } from './wheel.js';

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
const cardEl = document.getElementById('card')!;

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
/** Graphics settings (imad 2026-11-20), saved per My PC profile: quality (auto = My PC's), fog, view distance, fps counter. */
interface Gfx { q: 'auto' | Tier; fog: number; dist: number; fps: boolean }
let gfx: Gfx = { q: 'auto', fog: 2, dist: 1, fps: false };
const FOG_K = [0, 1.6, 1, 0.6], DIST_K = [0.7, 1, 1.4];
function applyGfx(): void {
  if (!g3) return;
  g3.fogK = FOG_K[gfx.fog] ?? 1; g3.distK = DIST_K[gfx.dist] ?? 1;
  g3.settingsChanged();
  fpsEl.hidden = !gfx.fps || mode !== 'world';
  sendView();
}
const fpsEl = document.createElement('div');
fpsEl.id = 'fps'; fpsEl.hidden = true;
document.body.appendChild(fpsEl);
let fpsN = 0, fpsAt = 0, drawAt = 0;
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
const kind = new Uint8Array(CAP), flags = new Uint8Array(CAP), sub = new Uint8Array(CAP), atype = new Uint8Array(CAP); // sub: item type / agent action
const px = new Float32Array(CAP), py = new Float32Array(CAP), nx = new Float32Array(CAP), ny = new Float32Array(CAP);
const vx = new Float32Array(CAP), vy = new Float32Array(CAP), ang = new Float32Array(CAP);
const face = new Float32Array(CAP), phase = new Float32Array(CAP), spd = new Float32Array(CAP), lastX = new Float32Array(CAP), lastY = new Float32Array(CAP);
const lookOf: PersonLook[] = [];
const slotOf = new Map<number, number>();
let frameAt = 0, frameGap = 100;
let follow = -1; // entity id (watch)
let followSeen = 0;

// Me (play).
let meId = -1, meTransit = false, meArrive = 0, meTo = '';
let predX = 0, predY = 0, pvx = 0, pvy = 0, predOk = false;
let rtt = 150;
let sentMx = 0, sentMy = 0, sentRun = false, sentAt = 0, seq = 0;
let runHeld = false;
const held = { left: false, right: false, up: false, down: false };

// Game menu, buttons, thoughts, person card.
let binds: Binds = cloneBinds(DEFAULT_BINDS);
let capture: ActionId | null = null;
let thoughtsOn = true;
/** Camera in play: from above (the tilted view), behind my character or through their eyes; and where those two look. */
type CamView = 'top' | 'third' | 'first';
const CAM_VIEWS: CamView[] = ['top', 'third', 'first'];
let camView: CamView = 'top', yaw = 0;
let seer = false, mindsAt = 0;
let meNeeds: { hunger: number; thirst: number; tired: number; carry: number; asleep: boolean; hp?: number; inv?: Record<string, number>; def?: number; weapon?: string } | null = null;
/** The craft screen: the category open and what is put in. */
let craftCat = '';
const pot: Record<string, number> = {};
/** Everyone I can go to (game menu > Go to someone): [entity id, name, map name]; null = asked, not answered yet. */
let roster: [number, string, string][] | null = null;
/** Past events (recorded zombie attacks): the list (null = asked), the one playing, the map to go back to. */
let past: ReplaySummary[] | null = null;
/** My character as a person (the "Me" page): look, family, autopilot, rules, level. */
interface MeChar { name: string; sex: 'f' | 'm'; skin: number; chose: boolean; sexDays: number; auto: boolean; rules: string[]; max: number; xp: number; level: number;
  goal: { text: string; from: string; k: number; n: number; pct: number } | null; goals: { text: string; ok: boolean; xp: number }[];
  partner: { id: number; name: string } | null; children: { id: number; name: string; age: number }[]; expecting: number; traits: Record<string, number>; hp: number }
let meChar: MeChar | null = null, askedMine = false;
const lookDraft = { sex: 'm' as 'f' | 'm', skin: 1 };
let rp: ReplayPlayer | null = null;
let rpBackMap = '', rpDist = 24;
let info: PersonInfo | null = null, infoFor = -1, infoAt = 0;
const drawnX = new Float32Array(CAP), drawnY = new Float32Array(CAP), drawnF = new Uint32Array(CAP);
let frameNo = 0;
let pads = 0;

// ------------------------------------------------------------ people palette (post-apocalypse: worn, muted)
const C = (h: number) => new Color(h);
const TUNICS = [0x8b5a3c, 0x6b7d4a, 0x5a6f86, 0x9a7b4f, 0x7a4b4b, 0x5e5e6e, 0xa0683a, 0x4f6b5e, 0x8a7f6a].map(C);
const SKINS = [0xf1c9a5, 0xe0ac82, 0xc68b5e, 0x9c6a43, 0x6e4a2f].map(C);
const HAIRS = [0x2b1d14, 0x4a3020, 0x7a5230, 0xc9a46a, 0x1a1a1a, 0x8a8a8a].map(C);
const PANTS = [0x3b3a40, 0x4a3d30, 0x2f3b4a, 0x50483d].map(C);
/** Zombies: grey-green skin, torn dark clothes, arms out (drawn by People.add with reach). */
const ZOMBIE: PersonLook = { tunic: C(0x6b6650), skin: C(0x9fbf7f), hair: C(0x56604a), pants: C(0x3e4436) };
const ME: PersonLook = { tunic: C(0x2fa36b), skin: C(0xe8b890), hair: C(0x3a2416), pants: C(0x3a3f5a) };
const OTHER_PLAYER: PersonLook = { tunic: C(0xd9822b), skin: C(0xd8a27a), hair: C(0x2b1d14), pants: C(0x40404a) };
const GOLD = C(0xffd166), WHITE = C(0xffffff);
/** A player's character: their skin tone (1 + tone, + 8 = woman: the trousers match the top, like a dress). Made once each. */
const playerLooks = new Map<number, PersonLook>();
function playerLook(mine: boolean, code: number): PersonLook {
  const k = (mine ? 64 : 0) + code;
  let l = playerLooks.get(k);
  if (!l) {
    const base = mine ? ME : OTHER_PLAYER, f = (code & 8) !== 0;
    l = { tunic: base.tunic, skin: SKINS[Math.min(SKINS.length - 1, ((code - 1) & 7))]!, hair: f ? C(0x5a3420) : base.hair, pants: f ? base.tunic : base.pants };
    playerLooks.set(k, l);
  }
  return l;
}
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
  fpsEl.hidden = !gfx.fps || m !== 'world';
  if (m !== 'world') { noteEl.hidden = true; cardEl.hidden = true; cardHtml = ''; if (menu?.open) menu.close(); bubbles?.hide(); }
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
      seer = !!m.seer;
      looks = looksFor(m.tiles);
      solid.fill(0);
      for (const x of m.tiles) if (x.solid) solid[x.id] = 1;
      if (m.body) body = m.body;
      gameSec = m.clock.gameSec; tickAt = performance.now(); clockScale = m.clock.clockScale; simSpeed = m.clock.paused ? 0 : m.clock.speed;
      if (!g3) {
        try { g3 = new World3D(canvas, tier); } catch { show('nogl'); return; }
        resize(); applyGfx();
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
      // The camera goes to my character (it may be far from where I was watching), so its frames come in.
      if (how === 'play' && m.x !== undefined && m.y !== undefined) { camX = m.x; camY = m.y; snapCam = true; follow = -1; sendView(); }
      if (how === 'play' && !askedMine) { askedMine = true; send({ t: Msg.Do, a: 'mine' }); } // first time: choose how I look
      if (m.transit) note(tf('travelling', mapName(m.map)), 0);
      else noteEl.hidden = true;
      break;
    }
    case Msg.Notice:
      if (m.kind === 'people') flyToSomeone(m.data as number[][]);
      if (m.kind === 'interact') {
        const d = m.data as { id: number; kind: number } | null;
        const js = d ? slotOf.get(d.id) : undefined;
        note(!d ? t('nobody') : d.kind === Kind.Player ? t('metPlayer') : `${actName(js !== undefined ? sub[js]! : 0)}...`);
      }
      if (m.kind === 'say') { // someone near you (or the one you follow) said something
        const d = m.data as { id: number; name: string; text: string };
        note(`${d.name}: “${d.text}”`, 7000);
      }
      if (m.kind === 'did') onDid(m.data as { a: string; ok: boolean; code: string; item?: string });
      if (m.kind === 'me') { meNeeds = m.data as typeof meNeeds; drawCard(); if (menu.open && (menu.page === 'bag' || menu.page === 'cat' || menu.page === 'guide')) menu.refresh(); }
      if (m.kind === 'blocked') note(t('dBlocked'), 5000);
      if (m.kind === 'info') {
        const d = m.data as PersonInfo | null;
        if (d && d.id === infoFor) { info = d; drawCard(); if (menu.open && menu.page === 'person') menu.refresh(); }
      }
      if (m.kind === 'minds') { seer = true; mindsAt = performance.now(); bubbles.set(m.data as unknown[], actName); }
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
        kind[s] = r[o + 1]! & 255; flags[s] = (r[o + 1]! >> 8) & 255; sub[s] = (r[o + 1]! >> 16) & 255; atype[s] = (r[o + 1]! >>> 24) & 63;
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
const actName = (a: number) => t((['actIdle', 'actWander', 'actDrink', 'actEat', 'actForage', 'actSleep', 'actTalk', 'actTravel', 'actRest', 'actFlee', 'actGo', 'actGather', 'actBuild', 'actFight'] as const)[a] ?? 'actIdle');
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
  meshOf.set(k, g3.addChunk(geo.ground, geo.props, geo.glow, geo.pool));
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

function viewRadius(): number { return g3 && g3.view !== 'top' ? Math.min(96, g3.sight + 10) : Math.min(96, ((g3?.dist ?? 24) * 1.2 + 14) * (g3?.distK ?? 1)); }
function sendView(): void { if (welcome) send({ t: Msg.View, map, x: focusX(), y: focusY(), r: viewRadius() }); }

// ------------------------------------------------------------ play: my character
function meSlot(): number { return meId >= 0 ? slotOf.get(meId) ?? -1 : -1; }
function playing(): boolean { return how === 'play' && meId >= 0 && !meTransit; }
function focusX(): number { return rp ? rp.cx : playing() && predOk ? predX : camX; }
function focusY(): number { return rp ? rp.cy : playing() && predOk ? predY : camY; }

// ------------------------------------------------------------ past events: a recorded zombie attack, played back
function startReplay(rec: ReplayRec): void {
  if (rp) rp.close();
  if (!rpBackMap) rpBackMap = map;
  if (rec.map !== map) setMap(rec.map);
  if (how === 'play') send({ t: Msg.Input, mx: 0, my: 0, run: false, seq: ++seq });
  held.left = held.right = held.up = held.down = false; padHeld.left = padHeld.right = padHeld.up = padHeld.down = false;
  if (!rp && g3) rpDist = g3.dist;
  rp = new ReplayPlayer(rec, mapName(rec.map), clockScale, (id) => lookFor(id), ZOMBIE);
  document.body.classList.add('replaying');
  snapCam = true; sendView();
  MyPC.announce?.(t('rpTitle'));
}
function stopReplay(): void {
  if (!rp) return;
  rp.close(); rp = null;
  if (g3) g3.dist = rpDist;
  document.body.classList.remove('replaying');
  if (rpBackMap && rpBackMap !== map) setMap(rpBackMap);
  rpBackMap = '';
  predOk = false; snapCam = true; sendView();
  openMenu('past');
}

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
  if (menu.open || wheel.open) { STICK0[0] = STICK0[1] = 0; return STICK0; }
  let ax = MyPC.gamepad ? MyPC.gamepad.axis(0) : 0, ay = MyPC.gamepad ? MyPC.gamepad.axis(1) : 0;
  if (Math.hypot(ax, ay) < 0.18) { ax = 0; ay = 0; }
  if (held.left || padHeld.left) ax = -1; if (held.right || padHeld.right) ax = 1; if (held.up || padHeld.up) ay = -1; if (held.down || padHeld.down) ay = 1;
  const l = Math.hypot(ax, ay);
  if (l > 1) { ax /= l; ay /= l; }
  return [ax, ay];
}
const STICK: [number, number] = [0, 0];
const STICK0: [number, number] = [0, 0];

/** Third / first person: the stick moves along where I look (left / right = side steps), the right stick or ◀ ▶ turn. */
function viewStick(dt: number): [number, number] {
  if (menu.open || wheel.open) { STICK0[0] = STICK0[1] = 0; return STICK0; }
  const gp = MyPC.gamepad;
  let ax = gp ? gp.axis(0) : 0, ay = gp ? gp.axis(1) : 0, rx = gp ? gp.axis(2) : 0;
  if (Math.hypot(ax, ay) < 0.18) { ax = 0; ay = 0; }
  if (Math.abs(rx) < 0.2) rx = 0;
  const turn = rx * Math.abs(rx) + (held.right ? 1 : 0) - (held.left ? 1 : 0);
  yaw += turn * 2.4 * dt;
  // The left stick (and a controller's D-pad) walks / runs along where I look and steps sideways; it never turns the camera.
  if (!ax && !ay) { ax = (padHeld.right ? 1 : 0) - (padHeld.left ? 1 : 0); ay = (padHeld.down ? 1 : 0) - (padHeld.up ? 1 : 0); }
  const fwd = -ay + (held.up ? 1 : 0) - (held.down ? 1 : 0), side = ax;
  const fx = Math.sin(yaw), fy = -Math.cos(yaw);
  let mx = fx * fwd - fy * side, my = fy * fwd + fx * side;
  const l = Math.hypot(mx, my);
  if (l > 1) { mx /= l; my /= l; }
  VSTICK[0] = mx; VSTICK[1] = my;
  return VSTICK;
}
const VSTICK: [number, number] = [0, 0];

// ------------------------------------------------------------ quick action wheel
const wheel = new Wheel(document.getElementById('wheel')!);
const WHEEL_IDS = ['use', 'eat', 'drink', 'sleep', 'pickup', 'place', 'bag', 'camera'] as const;
const WHEEL_ICON: Record<string, string> = { use: '✋', eat: '🍖', drink: '💧', sleep: '🛏', pickup: '🧺', place: '🧱', bag: '🎒', camera: '🎥' };
const WHEEL_KEY: Record<string, Key> = { use: 'qUse', eat: 'qEat', drink: 'qDrink', sleep: 'qSleep', pickup: 'qPickup', place: 'qPlace', bag: 'qBag', camera: 'qCamera' };
/** The wheel's button: held on a controller (let go = do it), pressed once on the remote (arrows + OK). */
function wheelButton(pressed: boolean, pad: boolean): void {
  if (mode !== 'world' || menu.open || rp) return;
  if (pressed) {
    if (wheel.open) { if (!pad) wheel.close(); return; }
    if (how !== 'play' || !playing()) return;
    held.left = held.right = held.up = held.down = false; padHeld.left = padHeld.right = padHeld.up = padHeld.down = false; runHeld = false;
    const items: WheelItem[] = WHEEL_IDS.map((id) => ({ id, icon: WHEEL_ICON[id]!, label: id === 'place' ? placeLabel() : t(WHEEL_KEY[id]!) }));
    wheel.show(items, pad, t(pad ? 'wheelHelp' : 'wheelRemote'));
    return;
  }
  if (!pad || !wheel.hold) return;
  // A short press with nothing chosen keeps it open (pick with the D-pad, A to do it).
  if (wheel.sel < 0 && performance.now() - wheel.openedAt < 350) { wheel.hold = false; return; }
  runQuick(wheel.close());
}
/** What "Put down" would put down: the first thing in the bag that can be placed. */
function placeable(): string | null {
  const inv = meNeeds?.inv ?? {};
  for (const p of PLACEABLE) if ((inv[p] ?? 0) > 0) return p;
  return null;
}
function placeLabel(): string { const p = placeable(); return p ? tf('cPut', thing(p)) : t('qPlace'); }
function runQuick(id: string | null): void {
  if (!id) return;
  if (id === 'camera') { nextCamera(); return; }
  if (id === 'bag') { openMenu('bag'); return; }
  if (id === 'place') { const p = placeable(); if (p) send({ t: Msg.Do, a: 'place', text: p }); else note(t('qNothing'), 2000); return; }
  doAction(id as ActionId, true);
}

/** Next camera (from above -> third person -> first person). */
function nextCamera(to?: CamView): void {
  camView = to ?? CAM_VIEWS[(CAM_VIEWS.indexOf(camView) + 1) % CAM_VIEWS.length]!;
  MyPC.save('cam', camView);
  // Look the way my character faces.
  const s = meSlot();
  if (camView !== 'top' && s >= 0) yaw = Math.PI - face[s]!;
  if (g3) g3.yaw = yaw;
  snapCam = true;
  note(`${t('sCamera')}: ${camName(camView)}`, 1500);
  updateHints(); sendView();
}
function camName(v: CamView): string { return t(v === 'top' ? 'camTop' : v === 'third' ? 'camThird' : 'camFirst'); }

function updatePlay(dt: number, now: number): void {
  const [mx, my] = g3 && g3.view !== 'top' ? viewStick(dt) : stick();
  STICK[0] = mx; STICK[1] = my;
  const run = runHeld && !menu.open;
  const s = meSlot();
  if (s < 0) return;
  if (!predOk) { predX = nx[s]!; predY = ny[s]!; pvx = pvy = 0; predOk = true; }
  // My character moves on this screen at once (same rule as the server: velocity eases towards the wish at 8 m/s^2 at most);
  // the server is told where it is and takes it (imad 2026-11-20: "move my character immediately, not after the server").
  const sp = run ? body.run : body.walk;
  const wx = mx * sp, wy = my * sp, ax = wx - pvx, ay = wy - pvy, a = Math.hypot(ax, ay), mdv = 8 * dt;
  const f = a > mdv ? mdv / a : 1;
  pvx += ax * f; pvy += ay * f;
  const nxp = predX + pvx * dt;
  if (!blocked(nxp, predY)) predX = nxp; else pvx = 0;
  const nyp = predY + pvy * dt;
  if (!blocked(predX, nyp)) predY = nyp; else pvy = 0;
  const moving = Math.abs(pvx) + Math.abs(pvy) > 0.01;
  // Controls + my place: on change, every 100 ms while moving, once more when I stop.
  const qx = Math.round(mx * 50) / 50, qy = Math.round(my * 50) / 50;
  if (((qx !== sentMx || qy !== sentMy) && (now - sentAt > 50 || (!qx && !qy) || (!sentMx && !sentMy))) || run !== sentRun || ((moving || wasMoving) && now - sentAt > 100)) {
    sentMx = qx; sentMy = qy; sentRun = run; sentAt = now; wasMoving = moving;
    send({ t: Msg.Input, mx: qx, my: qy, run, seq: ++seq, x: Math.round(predX * 100) / 100, y: Math.round(predY * 100) / 100 });
  }
  // The server only overrules me when it really disagrees (a portal, a wall it knows, a push): far off = jump there,
  // standing still and a little off = ease there. Small differences while walking are just the network's delay.
  const lag = Math.min(0.5, (now - frameAt) / 1000 + rtt / 2000);
  const sx = nx[s]! + vx[s]! * lag, sy = ny[s]! + vy[s]! * lag;
  const ex = sx - predX, ey = sy - predY, e = Math.hypot(ex, ey);
  if (e > 3) { predX = sx; predY = sy; pvx = pvy = 0; }
  else if (!moving && !qx && !qy && e > 0.4 && now - sentAt > 600) { const k = 1 - Math.exp(-dt * 2); predX += ex * k; predY += ey * k; }
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
  if (g3.view === 'third') { g3.back = Math.max(3.5, Math.min(14, g3.back * f)); MyPC.save('back', g3.back); return; }
  if (g3.view === 'first') return;
  g3.dist = Math.max(12, Math.min(70, g3.dist * f));
  MyPC.save('dist', g3.dist);
}

function followNext(): void {
  let best = -1, bestD = Infinity, after = -1, afterD = Infinity;
  const cur = follow >= 0 ? slotOf.get(follow) ?? -1 : -1;
  const curD = cur >= 0 ? Math.hypot(nx[cur]! - camX, ny[cur]! - camY) : -1;
  for (let i = 0; i < CAP; i++) {
    if (eid[i] === -1 || (kind[i] !== Kind.Agent && kind[i] !== Kind.Player) || i === cur || eid[i] === meId) continue;
    const d = Math.hypot(nx[i]! - camX, ny[i]! - camY);
    if (d < bestD) { bestD = d; best = i; }
    if (d > curD && d < afterD) { afterD = d; after = i; }
  }
  const pick = cur >= 0 && after >= 0 ? after : best;
  if (pick >= 0 && (cur < 0 || after >= 0)) { follow = eid[pick]!; MyPC.announce?.(`${t('following')} #${follow & 0xffff}`); return; }
  // Nobody new in view: ask the server where everyone is and fly to the next one.
  send({ t: Msg.Who, map });
}
let whoTurn = 0;
function flyToSomeone(list: number[][]): void {
  const people = list.filter((p) => p[0] !== meId);
  if (!people.length) { note(t('nobody')); return; }
  const p = people[whoTurn++ % people.length]!;
  camX = p[1]!; camY = p[2]!; follow = p[0]!; followSeen = performance.now(); snapCam = true;
  sendView();
  MyPC.announce?.(`${t('following')} #${follow & 0xffff}`);
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
    if (s !== undefined) { camX = nx[s]!; camY = ny[s]!; followSeen = performance.now(); }
    else if (performance.now() - followSeen > 4000) follow = -1; // just flew there: give the frames a moment
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

/** My PC's menu stays short: everything else is in the game's own menu. */
function setMenu(): void {
  MyPC.setMenu([{ id: 'game', label: t('gameMenuItem') }, { id: 'server', label: t('menuServer') }]);
}

/** Hints from the player's own buttons (the controller's printed names when one is connected, else the remote's). */
function updateHints(): void {
  const k = (a: ActionId) => {
    if (pads) { const i = binds.pad[a]; return i === undefined ? '' : String(MyPC.gamepad?.label?.(i) ?? MyPC.gamepad?.name?.(i) ?? i); }
    const r = binds.remote[a]; return r ? remoteName(r) : '';
  };
  const part = (a: ActionId, label: string) => { const b = k(a); return b ? `${b}: ${label}` : ''; };
  const view = how === 'play' && camView !== 'top';
  const move = view ? `${t('hMove')}: ${pads ? 'stick' : '↑ ↓'} · ${t('hTurn')}: ${pads ? 'R stick' : '← →'}` : `${t('hMove')}: ${pads ? 'stick' : '← ↑ → ↓'}`;
  const list = how === 'play'
    ? [move, part('use', actionLabel('use')), part('run', actionLabel('run')), part('eat', actionLabel('eat')), part('sleep', actionLabel('sleep')), part('wheel', t('aWheel').replace(/ \(.*\)$/, '')), part('menu', actionLabel('menu'))]
    : [move, part('use', t('wFollow')), part('eat', t('wMap')), part('sleep', t('wCard')), part('menu', actionLabel('menu'))];
  if (!pads) list.push(t('hintMenu'));
  hudHint.textContent = list.filter(Boolean).join(' · ');
}

// ------------------------------------------------------------ actions
/** Nearest person (agent) to my character within r metres, or -1 (entity id). */
function nearestPerson(r: number): number {
  const x = focusX(), y = focusY();
  let best = -1, bd = r;
  for (let i = 0; i < CAP; i++) {
    if (eid[i] === -1 || kind[i] !== Kind.Agent) continue;
    const d = Math.hypot(nx[i]! - x, ny[i]! - y);
    if (d < bd) { bd = d; best = eid[i]!; }
  }
  return best;
}

/** One of the player's actions, from any button. */
function doAction(a: ActionId, pressed: boolean): void {
  if (a === 'run') { runHeld = pressed; return; }
  if (!pressed || mode !== 'world') return;
  switch (a) {
    case 'menu': openMenu(); return;
    case 'zoomIn': zoomBy(1 / 1.2); return;
    case 'zoomOut': zoomBy(1.2); return;
    case 'thoughts':
      thoughtsOn = !thoughtsOn; MyPC.save('thoughts', thoughtsOn);
      if (!thoughtsOn) bubbles.hide();
      note(`${t('sThoughts')}: ${t(thoughtsOn ? 'on' : 'off')}`, 1500);
      return;
    case 'person': openMenu('person'); return;
    case 'camera': if (how === 'play') nextCamera(); return;
    case 'wheel': wheelButton(true, false); return;
  }
  if (how === 'watch') {
    if (a === 'use') followNext();
    else if (a === 'eat') nextMap();
    else if (a === 'sleep') openMenu('person');
    return;
  }
  if (!playing()) return;
  if (a === 'use') {
    if (nearestPerson(2.8) < 0) { send({ t: Msg.Do, a: 'use' }); return; }
    // Next to someone: say it (My PC's speech to text, when the player turned it on) or type it (My PC's keyboard);
    // empty = just say hello. They may do what you ask.
    send({ t: Msg.Do, a: 'hold' }); // they stop and face me while I talk / type
    held.left = held.right = held.up = held.down = false; padHeld.left = padHeld.right = padHeld.up = padHeld.down = false; runHeld = false;
    if (sttOn()) { talkBySpeech(); return; }
    talkByKeyboard();
    return;
  }
  send({ t: Msg.Do, a }); // drink, eat, pickup, sleep
}

const ITEM_NAMES: Record<string, string> = {};
const cap1 = (x: string) => x.charAt(0).toUpperCase() + x.slice(1);
/** A resource, a made thing or an animal, in the player's language. */
function thing(k: string): string {
  const key = (RESOURCES as readonly string[]).includes(k) || k === 'meat' ? 'r' + cap1(k) : (ANIMAL_NAMES as readonly string[]).includes(k) ? 'an' + cap1(k) : 'x' + cap1(k);
  const v = t(key as Key);
  return v === key ? k : v;
}
function needText(need: Partial<Record<string, number>>): string { return Object.entries(need).map(([k, n]) => `${n} ${thing(k)}`).join(' + '); }
function gotText(got?: Record<string, number>): string { return got ? Object.entries(got).filter(([, n]) => n > 0).map(([k, n]) => `${n} ${thing(k)}`).join(', ') : ''; }
function catName(c: string): string { return t(('k' + cap1(c)) as Key); }
// ------------------------------------------------------------ talking: speech (My PC API 24) or the keyboard
let sttBusy = false;
function sttOn(): boolean { try { return (MyPC.apiLevel ?? 0) >= 24 && !!MyPC.stt?.enabled?.(); } catch { return false; } }
/** The last words sent from speech (a result comes both from listen() and the 'text' listener: send it once). */
let saidText = '', saidAt = 0;
function sendSpoken(text: string): void {
  const v = (text ?? '').trim(), now = performance.now();
  if (v && v === saidText && now - saidAt < 3000) return;
  saidText = v; saidAt = now;
  sendTalk(v);
}
function sendTalk(text: string | null | undefined): void {
  const v = (text ?? '').trim();
  send(v ? { t: Msg.Do, a: 'talk', text: v.slice(0, 300) } : { t: Msg.Do, a: 'talk' });
}
function talkByKeyboard(): void {
  if (!MyPC.text?.keyboard) { sendTalk(''); return; }
  void (MyPC.text.keyboard({ value: '', kind: 'text', label: t('sayLabel'), ok: 'OK' }) as Promise<string | null>).then((v) => sendTalk(v));
}
/** Names that may be said (helps the speech service write them right): the person in front of me, everyone I can go to. */
function sttHints(): string[] {
  const h = new Set<string>();
  if (info?.name) h.add(info.name);
  for (const [, n] of roster ?? []) h.add(n);
  return [...h].slice(0, 30);
}
function talkBySpeech(): void {
  if (sttBusy) { MyPC.stt.stop?.(); return; } // pressed again: that's all I said
  sttBusy = true;
  note(t('listening'), 0);
  (MyPC.stt.listen({ maxSeconds: 10, hint: sttHints() }) as Promise<{ text: string }>)
    .then((r) => { noteEl.hidden = true; sendSpoken(r.text); })
    .catch((e: { code?: string }) => {
      noteEl.hidden = true;
      if (e?.code === 'nothing' || e?.code === 'cancelled') return;
      talkByKeyboard(); // speech failed (no phone, no service, denied...): type it instead
    })
    .finally(() => { sttBusy = false; });
}
/** Push-to-talk: the phone's mic button (or the remote's Record key) while I stand next to someone. */
function onSttText(e: { text: string }): void {
  if (sttBusy) { sendSpoken(e.text); return; } // my own listen()'s words: sent once
  if (mode !== 'world' || !playing() || rp || nearestPerson(2.8) < 0) { note(`“${e.text}”`, 2500); return; }
  send({ t: Msg.Do, a: 'hold' });
  sendSpoken(e.text);
}

function onDid(d: { a: string; ok: boolean; code: string; item?: string; rec?: unknown; list?: [number, string, string][]; name?: string; x?: number; y?: number }): void {
  const dm = d as typeof d & { me?: MeChar; days?: number; why?: string };
  if (dm.me) {
    meChar = dm.me;
    if (menu.open && (menu.page === 'me' || menu.page === 'rules' || menu.page === 'look')) menu.refresh();
    // First time in the world: choose woman / man and a skin tone.
    if (!meChar.chose && how === 'play' && mode === 'world' && !menu.open) { lookDraft.sex = meChar.sex; lookDraft.skin = meChar.skin; openMenu('look'); }
  }
  if (d.code === 'mine') return;
  const charCodes: Record<string, Key> = { looked: 'looked', sexPregnant: 'sexPregnant', autoOn: 'autoOn', autoOff: 'autoOff', ruleAdded: 'ruleAdded', ruleRemoved: 'ruleRemoved',
    rulesFull: 'rulesFull', built: 'built', needHut: 'needHut', expecting: 'expecting', tooFar: 'tooFar' };
  if (charCodes[d.code]) { note(t(charCodes[d.code]!), 3000); if (d.code === 'looked' && menu.page === 'look') menu.back(); return; }
  if (d.code === 'sexWeek') { note(tf('sexWeek', String(dm.days ?? 7)), 3500); return; }
  if (d.code === 'partners') { note(tf('partners', d.name ?? ''), 4000); return; }
  if (d.code === 'why') { note(dm.why ?? '', 4000); return; }
  if (d.code === 'replays') { past = d.list as never; if (menu.page === 'past') menu.refresh(); return; }
  if (d.code === 'replay') { startReplay(d.rec as ReplayRec); return; }
  if (d.code === 'noReplay') { note(t('pastNone'), 2500); return; }
  if (d.code === 'roster') { roster = d.list ?? []; if (menu.page === 'goto') menu.refresh(); return; }
  if (d.code === 'tp') { predX = camX = d.x ?? predX; predY = camY = d.y ?? predY; snapCam = true; sendView(); note(tf('dTp', d.name ?? ''), 3000); return; }
  if (d.code === 'zHit' || d.code === 'zKilled') { note(t(d.code), 1800); return; }
  const dd = d as typeof d & { got?: Record<string, number> };
  if (d.code === 'aHit') { note(tf('aHit', thing(d.item ?? '')), 1500); return; }
  if (d.code === 'aKilled') { note(tf('aKilled', thing(d.item ?? ''), gotText(dd.got)), 3500); return; }
  if (d.code === 'chopped' || d.code === 'mined') { note(tf('dGot', gotText(dd.got)), 1500); return; }
  if (d.code === 'crafted') { for (const k of Object.keys(pot)) delete pot[k]; note(tf('dCrafted', thing(d.item ?? '')), 2500); menu.refresh(); return; }
  if (d.code === 'placed') { note(tf('dPlaced', thing(d.item ?? '')), 2500); return; }
  const more: Record<string, Key> = { noRecipe: 'dNoRecipe', noMat: 'dNoMat', noRoom: 'dNoRoom', noItem: 'dNoItem', tooThick: 'dTooThick' };
  if (more[d.code]) { note(t(more[d.code]!), 2800); return; }
  if (d.code === 'wait') return;
  if (d.code === 'full' && d.a === 'craft') { note(t('dBagFull'), 2500); return; }
  const map: Record<string, Parameters<typeof t>[0]> = {
    drank: 'dDrank', picked: 'dPicked', ate: 'dAte', sleep: 'dSleep', wake: 'dWake', noWater: 'dNoWater', nothing: 'dNothing',
    noFood: 'dNoFood', full: 'dFull', talk: 'dTalk', nobody: 'dNobody',
  };
  const k = map[d.code];
  if (!k) return;
  note(k === 'dPicked' ? tf('dPicked', ITEM_NAMES[d.item ?? ''] ?? d.item ?? '') : t(k), 2500);
}

// ------------------------------------------------------------ side card: my needs (play), the followed person (watch)
let cardHtml = '';
function drawCard(): void {
  let html = '';
  if (mode === 'world' && !menu.open) {
    if (how === 'play' && meNeeds) {
      html = `<div class="pn">${esc(profileName())}</div><div class="pbars">${bar(t('nFood'), meNeeds.hunger)}${bar(t('nWater'), meNeeds.thirst)}${bar(t('nRest'), meNeeds.tired)}${meNeeds.hp !== undefined && meNeeds.hp < 100 ? bar(t('nHp'), 100 - meNeeds.hp) : ''}</div>`
        + `<div class="pa">${meNeeds.asleep ? actName(5) : ''}${meNeeds.carry ? (meNeeds.asleep ? ' · ' : '') + tf('carry', String(meNeeds.carry)) : ''}</div>`;
    } else if (how === 'watch' && follow >= 0 && info && info.id === follow) html = personHtml(info, actName, false);
  }
  if (html === cardHtml) return;
  cardHtml = html;
  cardEl.innerHTML = html;
  cardEl.hidden = !html;
}

/** Who "This person" means: the one I follow (watch), or the nearest (play). */
function personTarget(): number { return how === 'watch' ? follow : nearestPerson(10); }

// ------------------------------------------------------------ the game's own menu
function onOff(v: boolean): string { return t(v ? 'on' : 'off'); }
function bindText(a: ActionId): string {
  const i = binds.pad[a], r = binds.remote[a];
  const p = i === undefined ? t('cNone') : String(MyPC.gamepad?.label?.(i) ?? MyPC.gamepad?.name?.(i) ?? i);
  return `${p} · ${r ? remoteName(r) : t('cNone')}`;
}

function buildPage(id: string): Page {
  const rows: Row[] = [];
  switch (id) {
    case 'root': {
      rows.push({ id: 'resume', label: t('mResume') });
      if (how === 'play') rows.push({ id: 'me', label: t('mMe'), sub: true }, { id: 'actions', label: t('mActions'), sub: true }, { id: 'bag', label: t('mBag'), sub: true }, { id: 'goto', label: t('mGoTo'), sub: true });
      if (personTarget() >= 0) rows.push({ id: 'person', label: how === 'play' ? t('mNearby') : t('mPerson'), sub: true });
      if (how === 'watch') rows.push({ id: 'next', label: t('mNextPerson') }, { id: 'map', label: t('mNextMap') });
      rows.push({ id: 'past', label: t('mPast'), sub: true });
      rows.push({ id: 'how', label: t(how === 'play' ? 'mWatch' : 'mPlay') });
      rows.push({ id: 'settings', label: t('mSettings'), sub: true }, { id: 'controls', label: t('mControls'), sub: true });
      return { id, title: t('mTitle'), rows };
    }
    case 'actions':
      for (const a of ['use', 'drink', 'eat', 'pickup', 'sleep'] as const) rows.push({ id: a, label: actionLabel(a) });
      return { id, title: t('mActions'), rows, html: meNeeds ? `<div class="pbars">${bar(t('nFood'), meNeeds.hunger)}${bar(t('nWater'), meNeeds.thirst)}${bar(t('nRest'), meNeeds.tired)}</div>` : undefined };
    case 'past':
      for (const r of past ?? []) {
        rows.push({ id: 'r' + r.id, label: `${gameTime(r.start, t('day'))} · ${r.people.join(', ') || '—'}`,
          value: `${r.zombies} ${t('pastZ')} · ${r.secs} s${r.deaths.length ? ' · ✝ ' + r.deaths.join(', ') : r.killed ? ' · ' + tf('pastKilled', String(r.killed)) : ''}` });
      }
      if (past && !past.length) rows.push({ id: 'back', label: t('mBack') });
      return { id, title: t('mPast'), rows, wide: true, text: !past ? '…' : past.length ? t('pastHelp') : t('pastNone') };
    case 'bag': {
      const inv = meNeeds?.inv ?? {};
      const items = Object.entries(inv).filter(([, n]) => n > 0);
      const html = (items.length ? `<div class="bag">${items.map(([k, n]) => `<span class="bi"><b>${n}</b> ${esc(thing(k))}</span>`).join('')}</div>` : `<p>${esc(t('bagEmpty'))}</p>`)
        + `<p class="dim">${meNeeds?.weapon ? esc(tf('cWeapon', thing(meNeeds.weapon))) + ' · ' : ''}${esc(tf('cDefence', String(meNeeds?.def ?? 0)))}${meNeeds?.carry ? ' · ' + esc(tf('carry', String(meNeeds.carry))) : ''}</p>`;
      rows.push({ id: 'craft', label: t('mCraft'), sub: true }, { id: 'guide', label: t('mGuide'), sub: true });
      for (const p of PLACEABLE) if ((inv[p] ?? 0) > 0) rows.push({ id: 'pl:' + p, label: tf('cPut', thing(p)), value: String(inv[p]) });
      return { id, title: t('mBag'), rows, html, wide: true };
    }
    case 'craft':
      for (const c of CATEGORIES) rows.push({ id: 'c:' + c, label: catName(c), sub: true });
      return { id, title: t('mCraft'), rows, text: t('catHelp') };
    case 'cat': {
      const inv = meNeeds?.inv ?? {};
      for (const r of RESOURCES) {
        const have = inv[r] ?? 0;
        if (!have && !pot[r]) continue;
        rows.push({ id: 'r:' + r, label: cap1(thing(r)), value: `${pot[r] ?? 0} / ${have}` });
      }
      const rec = matchRecipe(craftCat, pot), inside = Object.entries(pot).filter(([, n]) => n > 0);
      rows.push({ id: 'make', label: `${t('cMake')}: ${rec ? cap1(thing(rec.what)) + (rec.n && rec.n > 1 ? ' x' + rec.n : '') : t('cNoRecipe')}`, dim: !rec });
      rows.push({ id: 'clear', label: t('cClear') }, { id: 'guide', label: t('mGuide'), sub: true });
      const html = `<p>${esc(inside.length ? tf('cIn', needText(pot)) : t('cNothingIn'))}</p><p class="dim">${esc(t('catHelp'))}</p>`;
      return { id, title: catName(craftCat), rows, html };
    }
    case 'guide': {
      const inv = meNeeds?.inv ?? {};
      RECIPES_ALL.forEach((r: Recipe, k: number) => {
        if (craftCat && r.cat !== craftCat) return;
        const ok = Object.entries(r.need).every(([x, n]) => (inv[x] ?? 0) >= n!);
        rows.push({ id: 'g:' + k, label: `${craftCat ? '' : catName(r.cat) + ' · '}${cap1(thing(r.what))}${r.n && r.n > 1 ? ' x' + r.n : ''}`, value: `${needText(r.need)}${ok ? ' ' + t('cHave') : ''}` });
      });
      return { id, title: craftCat ? `${t('mGuide')} · ${catName(craftCat)}` : t('mGuide'), rows, wide: true, text: t('guideHelp') };
    }
    case 'goto':
      for (const [id, name, map] of roster ?? []) rows.push({ id: 'p' + id, label: name, value: map });
      if (roster && !roster.length) rows.push({ id: 'back', label: t('mBack') });
      return { id, title: t('mGoTo'), rows, text: roster ? t('mGoToHelp') : '…' };
    case 'me': {
      const c = meChar;
      if (!c) return { id, title: t('meTitle'), rows: [{ id: 'back', label: t('mBack') }], text: '…' };
      const tr = c.traits;
      const html = `<div class="pm"><b>${esc(c.name)}</b> · ${esc(t(c.sex === 'f' ? 'lookWoman' : 'lookMan'))} · ${esc(tf('meHp', String(c.hp)))}</div>`
        + `<div class="pm">${tf('pLevel', String(c.level), String(c.xp))}</div><div class="bp"><i style="width:${Math.max(4, Math.min(100, ((c.xp - 50 * c.level * c.level) / Math.max(1, 50 * (c.level + 1) ** 2 - 50 * c.level * c.level)) * 100))}%"></i></div>`
        + (c.goal ? `<div class="pm">${t('pGoal')}: <b>${esc(c.goal.text)}</b> · ${Math.min(c.goal.k + 1, c.goal.n)}/${c.goal.n}</div><div class="bp${c.goal.from !== 'myself' ? ' ord' : ''}"><i style="width:${Math.max(6, c.goal.pct)}%"></i></div>` : '')
        + `<div class="pm">${t('mePartner')}: <b>${esc(c.partner?.name ?? t('meNone'))}</b></div>`
        + `<div class="pm">${t('meChildren')}: <b>${c.children.length ? c.children.map((k) => `${esc(k.name)} (${k.age})`).join(', ') : esc(t('meNone'))}</b></div>`
        + (c.expecting >= 0 ? `<div class="pm">${esc(tf('meExpecting', String(c.expecting)))}</div>` : '')
        + `<div class="pm dim">${esc(tf('meTraits', String(tr.strength ?? 0), String(tr.speed ?? 0), String(tr.intelligence ?? 0), String(tr.courage ?? 0), String(tr.empathy ?? 0)))}</div>`
        + (c.goals.length ? `<div class="pm dim">${t('meGoals')}: ${c.goals.map((g) => `${g.ok ? '✓' : '✗'} ${esc(g.text)} (+${g.xp})`).join(' · ')}</div>` : '');
      rows.push({ id: 'look', label: t('lookTitle'), sub: true }, { id: 'auto', label: t('autoRow'), value: onOff(c.auto) },
        { id: 'rules', label: t('myRules'), value: `${c.rules.length} / ${c.max}`, sub: true }, { id: 'hut', label: t('meHut') });
      return { id, title: t('meTitle'), rows, html, wide: true };
    }
    case 'look': {
      rows.push({ id: 'f', label: t('lookWoman'), value: lookDraft.sex === 'f' ? '●' : '' }, { id: 'm', label: t('lookMan'), value: lookDraft.sex === 'm' ? '●' : '' });
      for (let k = 0; k < 5; k++) rows.push({ id: 's' + k, label: `${t('lookSkin')} ${k + 1}`, value: lookDraft.skin === k ? '●' : '' });
      rows.push({ id: 'save', label: t('lookSave') });
      const swatch = SKINS.map((c, k) => `<span class="sw${lookDraft.skin === k ? ' on' : ''}" style="background:#${c.getHexString()}"></span>`).join('');
      return { id, title: t('lookTitle'), rows, html: `<p>${esc(meChar && !meChar.chose ? t('lookHelp') : t('lookSexNote'))}</p><div class="sws">${swatch}</div>` };
    }
    case 'rules': {
      (meChar?.rules ?? []).forEach((r, k) => rows.push({ id: 'r' + k, label: r, value: '✕' }));
      if ((meChar?.rules.length ?? 0) < (meChar?.max ?? 5)) rows.push({ id: 'add', label: t('ruleAdd') });
      return { id, title: t('myRules'), rows, wide: true, text: `${tf('ruleHelp', String(meChar?.max ?? 5))} ${t('autoHelp')}` };
    }
    case 'person': {
      rows.push({ id: 'back', label: t('mBack') });
      if (how === 'play' && info && info.id === infoFor) {
        if (meChar?.partner?.id === info.id) rows.push({ id: 'child', label: t('tryChild') });
        else if (!meChar?.partner) rows.push({ id: 'court', label: t('askPartner') });
      }
      if (how === 'watch') rows.push({ id: 'next', label: t('mNextPerson') });
      return { id, title: info?.name ?? t('mPerson'), rows, wide: true, html: info && info.id === infoFor ? personHtml(info, actName, true) : '…' };
    }
    case 'settings':
      if (seer) rows.push({ id: 'thoughts', label: t('sThoughts'), value: onOff(thoughtsOn) });
      if (how === 'play') rows.push({ id: 'cam', label: t('sCamera'), value: camName(camView) });
      rows.push({ id: 'gfx', label: t('gTitle'), sub: true });
      rows.push({ id: 'zin', label: t('aZoomIn') }, { id: 'zout', label: t('aZoomOut') }, { id: 'server', label: t('sServer'), value: server }, { id: 'unpair', label: t('sUnpair') });
      return { id, title: t('mSettings'), rows, text: seer ? undefined : t('sThoughtsOnly') };
    case 'gfx':
      rows.push({ id: 'q', label: t('gQuality'), value: t(gfx.q === 'auto' ? 'gAuto' : gfx.q === 'low' ? 'gLow' : gfx.q === 'mid' ? 'gMid' : 'gHigh') + (gfx.q !== 'auto' && gfx.q !== tier ? ' *' : '') },
        { id: 'fog', label: t('gFog'), value: t((['gOff', 'gLight', 'gNormal', 'gThick'] as const)[gfx.fog] ?? 'gNormal') },
        { id: 'dist', label: t('gDist'), value: t((['gNear', 'gNormal', 'gFar'] as const)[gfx.dist] ?? 'gNormal') },
        { id: 'fps', label: t('gFps'), value: onOff(gfx.fps) });
      if (gfx.q !== 'auto' && gfx.q !== tier) rows.push({ id: 'restart', label: t('gRestart') });
      return { id, title: t('gTitle'), rows, text: t('gHelp') };
    case 'controls':
      for (const a of ACTIONS) rows.push({ id: a, label: actionLabel(a), value: bindText(a) });
      rows.push({ id: 'reset', label: t('cReset') });
      return { id, title: t('mControls'), rows, text: `${t('cHelp')} ${t('cWatchNote')}` };
  }
  return { id, title: '', rows };
}

function pickRow(page: string, row: string): void {
  if (page === 'root') {
    if (row === 'resume') menu.close();
    else if (row === 'actions' || row === 'settings' || row === 'controls') menu.push(row);
    else if (row === 'past') { past = null; send({ t: Msg.Do, a: 'replays' }); menu.push('past'); }
    else if (row === 'bag') menu.push('bag');
    else if (row === 'me') { send({ t: Msg.Do, a: 'mine' }); menu.push('me'); }
    else if (row === 'goto') { roster = null; send({ t: Msg.Do, a: 'roster' }); menu.push('goto'); }
    else if (row === 'person') { askInfo(personTarget(), true); menu.push('person'); }
    else if (row === 'next') { menu.close(); followNext(); }
    else if (row === 'map') { menu.close(); nextMap(); }
    else if (row === 'how') { menu.close(); setHow(how === 'play' ? 'watch' : 'play'); }
  } else if (page === 'actions') { menu.close(); doAction(row as ActionId, true); }
  else if (page === 'past') {
    if (row === 'back') menu.back();
    else { menu.close(); note('…', 1500); send({ t: Msg.Do, a: 'replay', text: row.slice(1) }); }
  }
  else if (page === 'bag') {
    if (row === 'craft') { craftCat = ''; menu.push('craft'); }
    else if (row === 'guide') { craftCat = ''; menu.push('guide'); }
    else if (row.startsWith('pl:')) { menu.close(); send({ t: Msg.Do, a: 'place', text: row.slice(3) }); }
  }
  else if (page === 'craft') { craftCat = row.slice(2); for (const k of Object.keys(pot)) delete pot[k]; menu.push('cat'); }
  else if (page === 'cat') {
    if (row.startsWith('r:')) { const r = row.slice(2), have = meNeeds?.inv?.[r] ?? 0; pot[r] = (pot[r] ?? 0) + 1 > Math.min(have, 4) ? 0 : (pot[r] ?? 0) + 1; menu.refresh(); }
    else if (row === 'clear') { for (const k of Object.keys(pot)) delete pot[k]; menu.refresh(); }
    else if (row === 'guide') menu.push('guide');
    else if (row === 'make') {
      const list = Object.entries(pot).filter(([, n]) => n > 0).map(([k, n]) => `${k}=${n}`).join(',');
      if (!matchRecipe(craftCat, pot)) { note(t('dNoRecipe'), 2500); return; }
      send({ t: Msg.Do, a: 'craft', text: `${craftCat}:${list}` });
    }
  }
  else if (page === 'guide') {
    const r = RECIPES_ALL[Number(row.slice(2))];
    if (!r) return;
    for (const k of Object.keys(pot)) delete pot[k];
    for (const [k, n] of Object.entries(r.need)) pot[k] = n!;
    if (craftCat === r.cat) menu.back(); // back to the craft screen, filled
    else { craftCat = r.cat; menu.push('cat'); }
  }
  else if (page === 'goto') {
    if (row === 'back') menu.back();
    else { menu.close(); send({ t: Msg.Do, a: 'tp', text: row.slice(1) }); }
  }
  else if (page === 'me') {
    if (row === 'back') menu.back();
    else if (row === 'look') { lookDraft.sex = meChar?.sex ?? 'm'; lookDraft.skin = meChar?.skin ?? 1; menu.push('look'); }
    else if (row === 'auto') send({ t: Msg.Do, a: 'auto', text: meChar?.auto ? '0' : '1' });
    else if (row === 'rules') menu.push('rules');
    else if (row === 'hut') { menu.close(); send({ t: Msg.Do, a: 'hut' }); }
  }
  else if (page === 'look') {
    if (row === 'f' || row === 'm') { lookDraft.sex = row; menu.refresh(); }
    else if (row === 'save') send({ t: Msg.Do, a: 'look', text: `${lookDraft.sex}:${lookDraft.skin}` });
    else if (row.startsWith('s')) { lookDraft.skin = Number(row.slice(1)); menu.refresh(); }
  }
  else if (page === 'rules') {
    if (row === 'add') {
      if (!MyPC.text?.keyboard) return;
      void (MyPC.text.keyboard({ value: '', kind: 'text', label: t('ruleLabel'), ok: 'OK' }) as Promise<string | null>)
        .then((v) => { if (v && v.trim()) send({ t: Msg.Do, a: 'ruleAdd', text: v.trim().slice(0, 200) }); });
    } else if (row.startsWith('r')) send({ t: Msg.Do, a: 'ruleDel', text: row.slice(1) });
  }
  else if (page === 'person') {
    if (row === 'back') menu.back();
    else if (row === 'court') send({ t: Msg.Do, a: 'court', text: String(info?.id ?? -1) });
    else if (row === 'child') send({ t: Msg.Do, a: 'child' });
    else if (row === 'next') { followNext(); window.setTimeout(() => { askInfo(follow, true); menu.refresh(); }, 300); }
  } else if (page === 'settings') {
    if (row === 'thoughts') { thoughtsOn = !thoughtsOn; MyPC.save('thoughts', thoughtsOn); if (!thoughtsOn) bubbles.hide(); menu.refresh(); }
    else if (row === 'cam') { nextCamera(); menu.refresh(); }
    else if (row === 'gfx') menu.push('gfx');
    else if (row === 'zin') zoomBy(1 / 1.2);
    else if (row === 'zout') zoomBy(1.2);
    else if (row === 'server') { menu.close(); void askServer(); }
    else if (row === 'unpair') { menu.close(); unpair(); }
  } else if (page === 'gfx') {
    if (row === 'q') { const o: Gfx['q'][] = ['auto', 'low', 'mid', 'high']; gfx.q = o[(o.indexOf(gfx.q) + 1) % o.length]!; }
    else if (row === 'fog') gfx.fog = (gfx.fog + 1) % 4;
    else if (row === 'dist') gfx.dist = (gfx.dist + 1) % 3;
    else if (row === 'fps') { gfx.fps = !gfx.fps; fpsN = 0; fpsAt = performance.now(); fpsEl.textContent = ''; }
    else if (row === 'restart') { MyPC.save('gfx', gfx); location.reload(); return; }
    MyPC.save('gfx', gfx); applyGfx(); menu.refresh();
  } else if (page === 'controls') {
    if (row === 'reset') { binds = cloneBinds(DEFAULT_BINDS); MyPC.save('binds', binds); menu.refresh(); updateHints(); return; }
    capture = row as ActionId;
    note(tf('cPress', actionLabel(capture)), 0);
  }
}

const menu = new Menu(buildPage, pickRow, () => { capture = null; noteEl.hidden = true; drawCard(); MyPC.back?.(false); });
const bubbles = new Bubbles(8);

function openMenu(page = 'root'): void {
  if (mode !== 'world') return;
  wheel.close();
  held.left = held.right = held.up = held.down = false; padHeld.left = padHeld.right = padHeld.up = padHeld.down = false; runHeld = false;
  if (page === 'person') {
    const id = personTarget();
    if (id < 0) { note(t('nobody'), 2000); return; }
    askInfo(id, true);
  }
  menu.show('root');
  if (page !== 'root') menu.push(page);
  MyPC.back?.(true);
  drawCard();
}

function askInfo(id: number, now = false): void {
  if (id < 0) return;
  if (id !== infoFor) { infoFor = id; info = null; }
  if (now || performance.now() - infoAt > 1000) { infoAt = performance.now(); send({ t: Msg.Info, id }); }
}

/** A button the player pressed while choosing one for an action. */
function captured(kindOf: 'pad' | 'remote', b: number | string): void {
  const a = capture!;
  capture = null;
  const side = kindOf === 'pad' ? binds.pad : binds.remote;
  // One button = one action: take it from the action that had it.
  for (const o of ACTIONS) if ((side as Record<string, unknown>)[o] === b) delete (side as Record<string, unknown>)[o];
  (side as Record<string, unknown>)[a] = b;
  MyPC.save('binds', binds);
  const name = kindOf === 'pad' ? String(MyPC.gamepad?.label?.(b as number) ?? b) : remoteName(b as string);
  note(tf('cSet', actionLabel(a), name), 2500);
  menu.refresh();
  updateHints();
}

// ------------------------------------------------------------ loop
const STEP = 1000 / 60;
let raf = 0, last = 0, acc = 0, viewAt = 0, hudAt = 0, pingAt = 0, wasMoving = false;
let snapCam = true;

function update(now: number): void {
  if (mode !== 'world') return;
  if (rp) { rp.update(STEP / 1000); return; }
  if (wheel.open && wheel.hold && MyPC.gamepad) wheel.aim(MyPC.gamepad.axis(0), MyPC.gamepad.axis(1));
  if (how === 'play') updatePlay(STEP / 1000, now); else updateWatch();
}

function draw(now: number, dt: number): void {
  if (mode !== 'world' || !g3) return;
  buildOne();
  const fx = focusX(), fy = focusY();
  g3.view = rp || !playing() || !predOk ? 'top' : camView;
  g3.yaw = yaw;
  g3.follow(fx, fy, dt, snapCam);
  snapCam = false;
  const gs = gameSec + ((now - tickAt) / 1000) * clockScale * simSpeed;
  g3.setHour(((gs / 3600 + 8) % 24 + 24) % 24, now / 1000);
  const a = Math.min(1.25, (now - frameAt) / frameGap);
  const P = g3.people, me = playing() && predOk ? meSlot() : -1, tsec = now / 1000;
  const r = g3.view === 'top' ? (g3.dist * 1.6 + 8) * g3.distK : g3.sight + 4, eyes = g3.view === 'first';
  frameNo++;
  P.begin(); g3.beginShots(); g3.beginItems(); g3.animals.begin();
  if (rp) { // a past event: only the recorded people and zombies
    rp.draw(P, dt, actName);
    g3.dist += (Math.max(16, Math.min(42, rp.span * 1.1 + 10)) - g3.dist) * Math.min(1, dt * 2);
    P.end(); g3.endShots(); g3.endItems(); g3.animals.end(); g3.render(); bubbles.hide();
    return;
  }
  for (let i = 0; i < CAP; i++) {
    if (eid[i] === -1) continue;
    let x = px[i]! + (nx[i]! - px[i]!) * a, y = py[i]! + (ny[i]! - py[i]!) * a;
    if (i === me) { x = predX; y = predY; }
    if (Math.abs(x - fx) > r || Math.abs(y - fy) > r) continue;
    if (kind[i] === Kind.Projectile) { g3.shot(x, y); continue; }
    if (kind[i] === Kind.Item) { g3.item(x, y, sub[i]!, eid[i]!); continue; }
    if (kind[i] !== Kind.Agent && kind[i] !== Kind.Player && kind[i] !== Kind.Threat && kind[i] !== Kind.Animal) continue;
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
    drawnX[i] = x; drawnY[i] = y; drawnF[i] = frameNo;
    if (kind[i] === Kind.Animal) { g3.animals.add(atype[i]!, x, y, face[i]!, phase[i]! * 1.4, Math.min(1, spd[i]! / 1.6)); continue; }
    if (eyes && i === me) continue;
    const lying = (flags[i]! & (EFlag.Sleeping | EFlag.Dead)) !== 0;
    const zed = kind[i] === Kind.Threat;
    const mine = i === me || eid[i] === meId;
    const look = zed ? ZOMBIE : atype[i]! > 0 && (kind[i] === Kind.Player || kind[i] === Kind.Agent) ? playerLook(mine, atype[i]!) : mine ? ME : kind[i] === Kind.Player ? OTHER_PLAYER : lookOf[i]!;
    P.add(x, y, face[i]!, phase[i]!, Math.min(1, spd[i]! / (zed ? 1.2 : 2.2)), look, lying, flags[i]! & EFlag.Child ? 0.62 : 1, zed);
    if (kind[i] === Kind.Player && !(i === me && g3.view !== 'top')) P.marker(x, y, tsec, eid[i] === meId ? GOLD : WHITE);
    else if (eid[i] === follow) P.marker(x, y, tsec, GOLD);
  }
  P.end(); g3.endShots(); g3.endItems(); g3.animals.end();
  g3.render();
  // Thoughts over heads: only for players the owner allows (the server sends them to nobody else).
  if (seer && thoughtsOn && !menu.open && now - mindsAt < 4000) bubbles.draw(bubblePos, bubbleProject, fx, fy, actName);
  else bubbles.hide();
}
function bubblePos(id: number, out: { x: number; y: number }): boolean {
  const s = slotOf.get(id);
  if (s === undefined || drawnF[s] !== frameNo) return false;
  out.x = drawnX[s]!; out.y = drawnY[s]!;
  return true;
}
const bubbleProject = (x: number, z: number, out: { x: number; y: number }) => !!g3 && g3.project(x, 2.2, z, out);

function frame(ts: number): void {
  raf = requestAnimationFrame(frame);
  if (!last) last = ts;
  const dt = Math.min(0.1, (ts - last) / 1000);
  acc += Math.min(250, ts - last); last = ts;
  while (acc >= STEP) { update(ts); acc -= STEP; }
  // Under the game menu the world is only drawn 10 times a second: the menu answers at once on small TVs.
  if (!menu.open || ts - drawAt > 100) { draw(ts, ts - drawAt > 200 ? dt : Math.min(0.1, (ts - drawAt) / 1000)); drawAt = ts; fpsN++; }
  if (gfx.fps && ts - fpsAt > 500) { fpsEl.textContent = `${Math.round(fpsN * 1000 / (ts - fpsAt))} fps · ${Math.round(rtt)} ms`; fpsN = 0; fpsAt = ts; }
  if (ts - viewAt > 250) { viewAt = ts; sendView(); }
  if (ts - pingAt > 3000) { pingAt = ts; send({ t: Msg.Ping, c: ts }); }
  if (ts - hudAt > 500 && mode === 'world') {
    hudAt = ts; updateHud(ts);
    if (how === 'watch' && follow >= 0) askInfo(follow); else if (menu.open && menu.page === 'person') askInfo(infoFor);
    drawCard();
  }
}

let hudText = '';
function updateHud(now: number): void {
  const gs = gameSec + ((now - tickAt) / 1000) * clockScale * simSpeed;
  const day = Math.floor((gs / 3600 + 8) / 24) + 1, h = Math.floor((gs / 3600 + 8) % 24), mi = Math.floor((gs / 60) % 60);
  const fs = follow >= 0 ? slotOf.get(follow) : undefined;
  const who = how === 'play' ? profileName() : follow >= 0 ? `${t('following')} #${follow & 0xffff}${fs !== undefined ? ' · ' + actName(sub[fs]!) : ''}` : t('free');
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
  held.left = held.right = held.up = held.down = false; padHeld.left = padHeld.right = padHeld.up = padHeld.down = false; runHeld = false;
  if (how === 'play') send({ t: Msg.Input, mx: 0, my: 0, run: false, seq: ++seq });
  sentMx = sentMy = 0;
}

// ------------------------------------------------------------ input
const DIRS = { left: 1, right: 1, up: 1, down: 1 } as const;
/** Arrows / D-pad / stick as directions: the menu when it is open, else moving. */
function direction(d: keyof typeof DIRS, pressed: boolean, repeat?: boolean, fromPad = false): void {
  if (rp && !menu.open) { if (pressed) { if (d === 'left' || d === 'right') rp.seek(d === 'left' ? -5 : 5); else if (!repeat) rp.faster(d === 'up'); } return; }
  if (menu.open) { if (pressed && (d === 'up' || d === 'down')) menu.input(d); return; }
  if (wheel.open) { if (pressed && !repeat) wheel.step(d); return; }
  if (repeat) return;
  // A controller's stick / D-pad only moves (its right stick turns the camera); the remote's ◀ ▶ turn in third / first person.
  if (fromPad) padHeld[d] = pressed; else held[d] = pressed;
}
const padHeld = { left: false, right: false, up: false, down: false };

/** OK on the screens before the world (server address, pairing failed). */
function screenOk(): void {
  if (mode === 'noserver' || mode === 'offline') void askServer();
  else if (mode === 'pairfail') { retry = 0; mode = 'connect'; connect(); }
}

/** Every remote button by name (API 19): OK and the arrows keep their jobs, the rest is the player's map. */
function onRemote(name: string, pressed: boolean, repeat: boolean): void {
  if (name in DIRS) { direction(name as keyof typeof DIRS, pressed, repeat); return; }
  if (capture) { if (pressed && !repeat) captured('remote', name); return; }
  if (mode !== 'world') { if (pressed && name === 'ok') screenOk(); return; }
  if (rp && !menu.open) { if (pressed && !repeat && name === 'ok') rp.toggle(); return; }
  if (menu.open) {
    if (!pressed || repeat) return;
    if (name === 'ok') menu.input('ok');
    else if (remoteAction(binds, name) === 'menu') menu.close();
    return;
  }
  const a = remoteAction(binds, name);
  if (wheel.open) {
    if (!pressed || repeat) return;
    if (name === 'ok') runQuick(wheel.close());
    else if (a === 'wheel' || a === 'menu') wheel.close();
    return;
  }
  if (a === 'wheel') { if (!repeat) wheelButton(pressed, false); return; }
  if (a && !repeat) doAction(a, pressed);
}

/** Controller buttons (by letter: 0 = A). The D-pad and the stick come through onInput as directions. */
function onPad(i: number, pressed: boolean): void {
  if (i >= 12 && i <= 16) return; // D-pad (directions) and Home (My PC's)
  if (capture) { if (pressed) captured('pad', i); return; }
  if (mode !== 'world') { if (pressed && i === 0) screenOk(); return; }
  if (rp && !menu.open) { if (pressed) { if (i === 0) rp.toggle(); else if (i === 1 || padAction(binds, i) === 'menu') stopReplay(); } return; }
  if (menu.open) {
    if (!pressed) return;
    if (i === 0) menu.input('ok');
    else if (i === 1) menu.input('back');
    else if (padAction(binds, i) === 'menu') menu.close();
    return;
  }
  const a = padAction(binds, i);
  if (a === 'wheel') { wheelButton(pressed, true); return; }
  if (wheel.open) {
    if (!pressed) return;
    if (i === 0) runQuick(wheel.close());
    else if (i === 1 || a === 'menu') wheel.close();
    return;
  }
  if (a) doAction(a, pressed);
}

// ------------------------------------------------------------ My PC
MyPC.init({
  keys: ['channel', 'buttons'],
  ownMenu: true,
  onInit(info: { lang: string; quality?: { tier: Tier } }) {
    setLang(info.lang);
    document.documentElement.lang = info.lang;
    document.documentElement.dir = info.lang === 'ar' ? 'rtl' : 'ltr';
    tier = info.quality?.tier ?? 'mid';
    gfx = { ...gfx, ...(MyPC.load('gfx', {}) as Partial<Gfx>) };
    if (gfx.q !== 'auto') tier = gfx.q;
    const q = new URLSearchParams(location.search);
    if (q.get('tier') === 'low' || q.get('tier') === 'mid' || q.get('tier') === 'high') tier = q.get('tier') as Tier;
    const cfg = (MyPC.app_config ?? {}) as { server?: string };
    auth = MyPC.load('auth', null);
    // Served by the world server itself (through its tunnel): that is the server.
    const own = /github\.io$/i.test(location.hostname) ? '' : location.origin;
    server = String(q.get('server') || cfg.server || MyPC.load('server', '') || auth?.server || own);
    how = MyPC.load('how', 'play') === 'watch' ? 'watch' : 'play';
    if (q.get('watch') !== null) how = 'watch';
    const b = MyPC.load('binds', null) as Binds | null;
    if (b && b.pad && b.remote) {
      binds = { pad: { ...b.pad }, remote: { ...b.remote } };
      // Actions added since: their default button, when the player has not used it for something else.
      for (const a of ACTIONS) {
        const dp = DEFAULT_BINDS.pad[a], dr = DEFAULT_BINDS.remote[a];
        if (!(a in b.pad) && dp !== undefined && padAction(binds, dp) === undefined) binds.pad[a] = dp;
        if (!(a in b.remote) && dr !== undefined && remoteAction(binds, dr) === undefined) binds.remote[a] = dr;
      }
    }
    const cv = MyPC.load('cam', 'top');
    camView = CAM_VIEWS.includes(cv) ? cv : 'top';
    thoughtsOn = MyPC.load('thoughts', true) !== false;
    window.addEventListener('resize', resize);
    setMenu();
    if (MyPC.gamepad) {
      MyPC.gamepad.on('pads', (list: unknown[]) => { pads = list.length; remoteOnly = !list.length; updateHints(); });
      MyPC.gamepad.on('button', (i: number, pressed: boolean) => onPad(i, pressed));
    }
    MyPC.buttons?.on?.((name: string, pressed: boolean, repeat: boolean) => onRemote(name, pressed, !!repeat));
    if ((MyPC.apiLevel ?? 0) >= 24 && MyPC.stt?.on) MyPC.stt.on('text', onSttText);
    if (q.get('dev') !== null) (window as unknown as { __dev: unknown }).__dev = { me: () => [focusX(), focusY(), map], cam: (v: CamView) => nextCamera(v), dbg: () => ({ yaw, camView, how, meId, meTransit, predOk, predX, predY, camX, camY, s: meSlot(), sx: meSlot() >= 0 ? nx[meSlot()] : null }), look: (x: number, y: number) => { follow = -1; camX = x; camY = y; snapCam = true; } };
    MyPC.ready();
  },
  onStart() {
    const d = Number(MyPC.load('dist', 24)) || 24, bk = Number(MyPC.load('back', 7)) || 7;
    connect(); startLoop();
    queueMicrotask(() => { if (g3) { g3.dist = d; g3.back = bk; } });
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
    if (id === 'game') setTimeout(() => openMenu(), 50);
    else if (id === 'server') void askServer();
  },
  onInput(action: string, pressed: boolean, repeat?: boolean, dev?: string): boolean | void {
    const pad = !!dev && /^pad/.test(dev);
    if (action in DIRS) { direction(action as keyof typeof DIRS, pressed, repeat, pad); return; }
    if (action === 'cancel') {
      if (!pressed) return pad ? true : undefined;
      if (capture) { capture = null; note(t('mControls'), 800); return true; }
      if (wheel.open) { wheel.close(); return true; }
      if (menu.open) { menu.input('back'); return true; }
      if (rp && !pad) { stopReplay(); return true; }
      if (pad) return true; // a controller's B is the player's own button (Run by default)
      if (mode !== 'world') return false; // nothing to close: My PC's menu
      openMenu(); // the remote's Back: the game menu (twice quickly = My PC's menu)
      return true;
    }
    // Controllers come through MyPC.gamepad (the player's map); here only the remote without MyPC.buttons, keyboard, touch.
    if (pad || action === 'jump' || action === 'menu' && pad) return;
    if (action === 'menu') { if (pressed) { if (menu.open) menu.close(); else openMenu(); } return; }
    if (capture) return;
    if (action === 'confirm') {
      if (!pressed) return;
      if (mode !== 'world') { screenOk(); return; }
      if (menu.open) { menu.input('ok'); return; }
      if (wheel.open) { runQuick(wheel.close()); return; }
      if (rp) { rp.toggle(); return; }
      doAction(dev === 'touch' ? 'use' : remoteAction(binds, 'ok') ?? 'use', true);
      return;
    }
    if (mode !== 'world' || menu.open) return;
    if (action === 'run') { doAction('run', pressed); return; }
    if (!pressed) return;
    if (action === 'pageUp') doAction(remoteAction(binds, 'chUp') ?? 'zoomIn', true);
    else if (action === 'pageDown') doAction(remoteAction(binds, 'chDown') ?? 'zoomOut', true);
  },
});
let startDist = 24;
void startDist;
const isPad = (dev?: string) => !!dev && /^(pad|touch)/.test(dev);
