import {
  Msg, PROTOCOL_VERSION, CHUNK_TILES, ENT_REC, POS_Q, ANG_Q, EFlag, Kind, KIND_RIDING, encode, decode, unpackI32, chunkKey,
  type ServerMsg, type Welcome,
} from '@worldsim/protocol';
import { Color } from 'three';
import { t, tf, setLang, type Key } from './i18n.js';
import { RESOURCES, CATEGORIES, RECIPES_ALL, PLACEABLE, HUT_NEED, HUT_SIZE, INSIDE_ONLY, BOX_CAP, boxHolds, ANIMAL_NAMES, WEAPONS, matchRecipe, type Recipe } from '@worldsim/protocol';
import { World3D, type Tier, type ChunkView } from './gfx/world3d.js';
import { DynRes } from './gfx/dynres.js';
import { buildChunk, chunkGeo, type ChunkData } from './gfx/chunkmesh.js';
import { looksFor, hash2, Shape, type Look } from './gfx/look.js';
import type { PersonLook } from './gfx/people.js';
import { RideScene } from './gfx/ride.js';
import { ReplayPlayer, gameTime, type ReplayRec, type ReplaySummary } from './replay.js';
import {
  ACTIONS, DEFAULT_BINDS, BINDS_V, cloneBinds, padAction, remoteAction, remoteName, actionLabel, Menu, Bubbles, bar, personHtml, STAGE_KEY,
  type ActionId, type Binds, type Page, type Row, type PersonInfo,
} from './ui.js';
import { Wheel, type WheelItem } from './wheel.js';
import { Sound, SOUND_DEFAULTS, type SoundPrefs } from './audio.js';
import { loadItems, iconStyle } from './gfx/items.js';
import { DEATH_SECS } from './gfx/animals.js';
import { InvScreen, GearScreen, BagScreen, type InvCtx } from './invui.js';
import { QuestUi } from './questui.js';
import { MapScreen, MARK_KEY, type MapData } from './mapui.js';
import { Compass, SoundCues, Names, AutoRide, ChatLog, type CompassRow } from './nav.js';
import { MARK_KINDS, MARK_ICON, NPCS, type MapMark, type MarkKind, type WeatherInfo } from '@worldsim/protocol';

// ------------------------------------------------------------ sounds (imad 2026-11-20: real recordings, with options)
const sound = new Sound();
/** Footsteps by the ground under me. */
const STEP_OF: Record<string, string> = { grass: 'step_grass', dirt: 'step_dirt', sand: 'step_dirt', farm: 'step_dirt', ashes: 'step_dirt', berries: 'step_grass', herbs: 'step_grass',
  road: 'step_stone', rubble: 'step_stone', rock: 'step_stone', floor: 'step_wood', bed: 'step_wood', door: 'step_wood', water: 'step_water' };
let stepName: string[] = [];
let stepDist = 0, lastHp = -1, ambAt = 0, campfireTile = -1;
/** Tile names by id (from the welcome): what may be built on. */
let tileName: string[] = [];
/** What each answer from the server sounds like. */
const DID_SOUND: Record<string, string> = { zHit: 'hit', zKilled: 'zombie_die', aHit: 'animal_hurt', aKilled: 'animal_die', chopped: 'chop', mined: 'mine', herbs: 'pickup', healed: 'reward', noMedkit: 'ui_error', fullHp: 'ui_error', drank: 'drink',
  ate: 'eat', picked: 'pickup', crafted: 'craft', placed: 'place', built: 'build', swing: 'swing', missed: 'bow_shot', sleep: 'drop', wake: 'equip', partners: 'reward', married: 'levelup', expecting: 'reward',
  called: 'whistle', doorOpened: 'door_open', doorClosed: 'door_close', doorLocked: 'ui_error', doorSomeone: 'ui_error',
  noRecipe: 'ui_error', noMat: 'ui_error', noRoom: 'ui_error', noItem: 'ui_error', buildNeed: 'ui_error', needHut: 'ui_error', hutLimit: 'ui_error', noBow: 'ui_error', noArrows: 'ui_error', tooFar: 'ui_error' };
const ANIMAL_CRY = ['rabbit', 'deer', 'boar', 'wolf_growl', 'bear_roar'];

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
/** Text and menu size (imad 2026-11-25: "a setting to adjust text and menu sizes"): Settings > Text and menu size, saved per My PC profile. */
const UI_SIZES = [0.85, 1, 1.15, 1.3, 1.5, 1.75];
let uiSize = 1;
function applyUiSize(): void {
  const r = document.documentElement.style;
  r.setProperty('--ui', String(uiSize));
  r.setProperty('--uib', String(Math.min(uiSize, 1.1))); // the big screens (bag, crafting, gear) fill the screen already: they grow less
}
const xhairEl = document.getElementById('xhair') ?? document.body.appendChild(Object.assign(document.createElement('div'), { id: 'xhair', hidden: true }));
const aimEl = document.getElementById('aimhud') ?? document.body.appendChild(Object.assign(document.createElement('div'), { id: 'aimhud', hidden: true }));
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
interface Gfx { q: 'auto' | Tier; fog: number; dist: number; fps: boolean; res: boolean }
let gfx: Gfx = { q: 'auto', fog: 2, dist: 1, fps: false, res: true };
/** Adaptive resolution (gfx/dynres.ts): the 3D view's size follows the frame rate; `gfx.res` false = the tier's fixed size. */
let dyn: DynRes | null = null;
const tierScale = () => (tier === 'low' ? 0.6 : tier === 'mid' ? 0.8 : 1);
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
const meshOf = new Map<number, ChunkView>();
const buildQ: number[] = [];
let gameSec = 0, tickAt = 0, clockScale = 10, simSpeed = 1;
let agentsTotal = 0;
let body = { radius: 0.3, walk: 1.4, run: 3.5 };

const CAP = 4096;
const eid = new Int32Array(CAP).fill(-1);
const kind = new Uint8Array(CAP), flags = new Uint8Array(CAP), sub = new Uint8Array(CAP), atype = new Uint8Array(CAP), alook = new Uint8Array(CAP), riding = new Uint8Array(CAP); // sub: item type / agent action
/** People's gear + move (protocol gear.ts) and when the move began (a new swing restarts it). */
const gearOf = new Int32Array(CAP), animKey = new Int32Array(CAP), animAt = new Float64Array(CAP);
const px = new Float32Array(CAP), py = new Float32Array(CAP), nx = new Float32Array(CAP), ny = new Float32Array(CAP);
const vx = new Float32Array(CAP), vy = new Float32Array(CAP), ang = new Float32Array(CAP);
const nextCry = new Float64Array(256 * 64);
const face = new Float32Array(CAP), phase = new Float32Array(CAP), spd = new Float32Array(CAP), lastX = new Float32Array(CAP), lastY = new Float32Array(CAP);
/** Lying down 0..1 (eased in / out: lying down, climbing into bed, getting up). */
const lieK = new Float32Array(CAP);
const lookOf: PersonLook[] = [];
const slotOf = new Map<number, number>();
let frameAt = 0, frameGap = 100;
let follow = -1; // entity id (watch)
let followSeen = 0;

// Me (play).
let meId = -1, meTransit = false, meArrive = 0, meTo = '';
/** On the road between maps on horseback: my horse's look and the ride's length (game s), the riding scene, how I last looked. */
let rideHorse: { name: string; q: number; coat: number; scale: number } | null = null, ride: RideScene | null = null;
/**
 * The road between maps (imad 2026-11-26: "smooth from entering the gate, load the next map while the animation plays, 5-15 s, and the
 * timer must not count without the animation"), on foot or on horseback. out = the world fades to black; ride = the road scene
 * (gfx/ride.ts) while the next map's chunks load behind it, its clock started on the server by Do `rideShown` at its first frame,
 * fading to black just before the end; in = arrived: the new map is drawn behind the black until its ground is in, then fades in.
 */
let trip: { phase: 'out' | 'ride' | 'in'; at: number; to: string; x: number; y: number; secs: number; left: number; shownAt: number; frames: number } | null = null;
const FADE_MS = 450;
const fadeEl = document.getElementById('fade') as HTMLDivElement | null;
function fade(on: boolean, ms = FADE_MS): void { if (!fadeEl) return; fadeEl.style.transitionDuration = `${ms}ms`; fadeEl.style.opacity = on ? '1' : '0'; }
let myLook: PersonLook | null = null, myGear = 0;
let predX = 0, predY = 0, pvx = 0, pvy = 0, predOk = false;
let rtt = 150;
let sentMx = 0, sentMy = 0, sentRun = false, sentAt = 0, seq = 0;
let runHeld = false;
const held = { left: false, right: false, up: false, down: false };

// Game menu, buttons, thoughts, person card.
let binds: Binds = cloneBinds(DEFAULT_BINDS);
let bindsNews = false, mapNews = false;
let capture: ActionId | null = null;
/** The bow's aim (imad 2026-11-20 "a good system to attack with a bow"): held Aim = the stick points, Attack shoots along it. */
let aimOn = false, aimAng = 0, aimLock = -1, moveAng = NaN, aimAt = 0, aimShown = -1;
/** Animals just killed, falling over where they were (Frame.dead; imad 2026-11-25). */
const corpses: { type: number; x: number; y: number; f: number; at: number }[] = [];
/** The way my character faces, as the server counts angles (0 = east, +y = south). */
function myAng(): number {
  if (aimOn) return aimAng;
  if (Number.isFinite(moveAng)) return moveAng;
  const s = meSlot();
  return s >= 0 ? Math.PI / 2 - face[s]! : 0;
}
/** The nearest zombie or animal within `r` m and `cone` radians of angle `a` from (x, y): slot or -1. */
function targetNear(x: number, y: number, a: number, r: number, cone: number): number {
  let best = -1, bd = r;
  for (let i = 0; i < CAP; i++) {
    if (eid[i] === -1 || (kind[i] !== Kind.Threat && kind[i] !== Kind.Animal) || (flags[i]! & EFlag.Dead) || riding[i]) continue; // never the horse I sit on
    const dx = nx[i]! - x, dy = ny[i]! - y, d = Math.hypot(dx, dy);
    if (d >= bd) continue;
    let da = Math.atan2(dy, dx) - a; da = Math.atan2(Math.sin(da), Math.cos(da));
    if (Math.abs(da) <= cone) { bd = d; best = i; }
  }
  return best;
}
let thoughtsOn = true;
/** Camera in play: from above (the tilted view), behind my character or through their eyes; and where those two look. */
type CamView = 'top' | 'third' | 'first';
const CAM_VIEWS: CamView[] = ['top', 'third', 'first'];
let camView: CamView = 'top', yaw = 0;
let seer = false, mindsAt = 0;
/** Horses in view (Notice 'horses'): id -> [scale, quality, coat, tamed, mine, name]. */
const horseInfo = new Map<number, [number, number, number, number, number, string]>();
let meNeeds: { ride?: { name: string; walk: number; run: number; sta: number; q: number } | null; pvp?: boolean; hunger: number; thirst: number; tired: number; carry: number; asleep: boolean; hp?: number; inv?: Record<string, number>; def?: number; weapon?: string; gear?: ReturnType<InvCtx['gear']>; cold?: { drain: number; fire: boolean; hut: boolean; bed: boolean; clothes: number; t: number } } | null = null;
/** The season and the sky over the map I look at (Notice 'weather', sim/weather.ts). */
let wxInfo: WeatherInfo | null = null;
let coldShown = 0;
/** The craft screen: the category open and what is put in. */
let craftCat = '';
const pot: Record<string, number> = {};
/** Everyone I can go to (game menu > Go to someone): [entity id, name, map name]; null = asked, not answered yet. */
let roster: [number, string, string][] | null = null;
/** Past events (recorded zombie attacks): the list (null = asked), the one playing, the map to go back to. */
let past: ReplaySummary[] | null = null;
/** My character as a person (the "Me" page): look, family, autopilot, rules, level. */
interface MeChar { name: string; sex: 'f' | 'm'; skin: number; chose: boolean; sexDays: number; auto: boolean; rules: string[]; max: number; xp: number; level: number; influence?: number; influenceLog?: { d: number; why: string }[];
  goal: { text: string; from: string; k: number; n: number; pct: number } | null; goals: { text: string; ok: boolean; xp: number }[];
  partner: { id: number; name: string } | null; children: Kid[]; expecting: number; expectingPct: number; traits: Record<string, number>; hp: number;
  horses?: { name: string; quality: string; speed: number; stamina: number; intel: number }[]; tame?: number; tamePower?: number;
  family?: { id: number; name: string; role: string; rel: string }[]; asks?: { from: number; name: string; role: string }[] }
/** One of my children, with their needs (0 fine .. 100 desperate): a parent looks after the little ones by hand. */
interface Kid { id: number; name: string; age: number; stage: string; hunger: number; thirst: number; tired: number; hp: number; held: boolean; near: boolean; carer: string }
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
const GOLD = C(0xffd166), WHITE = C(0xffffff), NPC_RING = C(0x5ad1ff);
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
  hudTop.hidden = m !== 'world';
  hudHint.hidden = true; // imad 2026-11-25: "remove the bottom black block with the buttons, I don't need it"
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
      chunkWorker()?.postMessage({ looks });
      solid.fill(0);
      for (const x of m.tiles) if (x.solid) solid[x.id] = 1;
      doorTileId = m.tiles.find((x) => x.name === 'door')?.id ?? -1; doorOpenId = m.tiles.find((x) => x.name === 'dooropen')?.id ?? -1;
      stepName = []; campfireTile = -1;
      tileName = [];
      for (const x of m.tiles) { stepName[x.id] = STEP_OF[x.name] ?? 'step_dirt'; tileName[x.id] = x.name; if (x.name === 'campfire') campfireTile = x.id; }
      if (m.body) body = m.body;
      gameSec = m.clock.gameSec; tickAt = performance.now(); clockScale = m.clock.clockScale; simSpeed = m.clock.paused ? 0 : m.clock.speed;
      if (!g3) {
        try { g3 = new World3D(canvas, tier); } catch { show('nogl'); return; }
        g3.rainSnow = MyPC.load('rainsnow', true) !== false;
        void loadItems();
        g3.horses.load(new URL('models/horse.glb', location.href).href).catch((err) => console.warn('horse model', err)); // CC0, docs/models/CREDITS.md
        const s0 = tierScale();
        dyn = new DynRes(s0, tier === 'high' ? 0.6 : 0.5, Math.min(1, s0 * 1.15));
        resize(); applyGfx();
      }
      if (!map || !m.maps.some((x) => x.id === map)) setMap(String(MyPC.load('map', m.maps[0]!.id)));
      else setMap(map);
      show('world');
      send({ t: Msg.Join, watch: how === 'watch' });
      sendView();
      break;
    }
    case Msg.You: {
      meId = m.id; meTransit = m.transit; meTo = m.map;
      meArrive = m.arrive ?? 0;
      rideHorse = m.transit ? m.horse ?? null : null;
      predOk = false;
      if (m.transit && how === 'play') { // into the gate: the road between maps (`trip`)
        const now = performance.now(), gs = gameSec + ((now - tickAt) / 1000) * clockScale * simSpeed;
        const secs = m.secs ?? Math.max(1, (meArrive - gs) / Math.max(0.01, clockScale * simSpeed)); // an older server: its game-time arrival
        const left = Math.min(secs, m.left ?? secs);
        if (!trip) { trip = { phase: 'out', at: now, to: m.map, x: m.x ?? 0, y: m.y ?? 0, secs, left, shownAt: 0, frames: 0 }; fade(true); }
        else { trip.to = m.map; trip.x = m.x ?? trip.x; trip.y = m.y ?? trip.y; trip.secs = secs; if (trip.shownAt) trip.shownAt = now - (secs - left) * 1000; else trip.left = left; }
      } else if (trip && !m.transit) { trip.phase = 'in'; trip.at = performance.now(); trip.frames = 0; fade(true, 200); } // arrived: draw the new map behind the black
      if (!m.transit && m.map !== map) setMap(m.map);
      // The camera goes to my character (it may be far from where I was watching), so its frames come in.
      if (how === 'play' && !m.transit && m.x !== undefined && m.y !== undefined) { camX = m.x; camY = m.y; snapCam = true; follow = -1; sendView(); }
      if (how === 'play' && !askedMine) { askedMine = true; send({ t: Msg.Do, a: 'mine' }); } // first time: choose how I look
      if (m.transit) note(rideHorse ? tf('hRideTo', rideHorse.name, mapName(m.map)) : tf('travelling', mapName(m.map)), 0);
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
      if (m.kind === 'say') { // someone near you (or the one you follow) said something: the chat log, bottom left
        const d = m.data as { id: number; name: string; text: string };
        chatLog.add(d.name, d.text);
      }
      if (m.kind === 'wchat') { const d = m.data as { name: string; text: string; sys: number }; chatLog.add(d.name, d.text, !!d.sys); }
      if (m.kind === 'did') onDid(m.data as { a: string; ok: boolean; code: string; item?: string });
      if (m.kind === 'quest' || m.kind === 'clanVote') quests.notice(m.kind, m.data);
      if (m.kind === 'me') {
        const hp = (m.data as { hp?: number }).hp ?? 100;
        if (lastHp >= 0 && hp < lastHp - 1) sound.play('hurt');
        lastHp = hp;
        meNeeds = m.data as typeof meNeeds; drawCard(); aimHud(); coldNote(); if (menu.open && (menu.page === 'bag' || menu.page === 'cat' || menu.page === 'guide' || menu.page === 'fight' || menu.page === 'inv' || menu.page === 'gear')) menu.refresh(); }
      if (m.kind === 'blocked') { const why = (m.data as { why?: string } | null)?.why; note(t(why === 'door' ? 'dDoorShut' : why === 'closed' ? 'dDoorClosed' : why === 'horse' ? 'dHorseIn' : 'dBlocked'), why === 'closed' ? 2500 : 5000); }
      if (m.kind === 'info') {
        const d = m.data as PersonInfo | null;
        if (d && d.id === infoFor) { info = d; drawCard(); if (menu.open && menu.page === 'person') menu.refresh(); }
      }
      if (m.kind === 'names') names.add(m.data as [number, string][]);
      if (m.kind === 'boxOpen' && g3) { const [bx, by, secs] = m.data as [number, number, number]; g3.anims.openBox(bx, by, secs, tileName[tileUnder(bx + 0.5, by + 0.5)] === 'fridge', performance.now()); }
      if (m.kind === 'weather') {
        const d = m.data as WeatherInfo, first = !wxInfo;
        if (wxInfo && wxInfo.s !== d.s) note(tf('seasonNews', t(`se${d.s}` as Key)), 6000);
        wxInfo = d;
        // Joining in a frozen winter: the ground is white already.
        g3?.setWeather(d.w, d.k, d.t, first && d.s === 3 && d.t < 1 ? 0.8 : first && d.s === 3 ? 0.3 : -1);
        hudText = '';
      }
      if (m.kind === 'horses') { horseInfo.clear(); for (const r of m.data as [number, number, number, number, number, number, string][]) horseInfo.set(r[0], [r[1] / 100, r[2], r[3], r[4], r[5], r[6]]); }
      if (m.kind === 'minds') { seer = true; mindsAt = performance.now(); bubbles.set(m.data as unknown[], actName); }
      break;
    case Msg.Pong: rtt = rtt * 0.7 + (performance.now() - m.c) * 0.3; break;
    case Msg.Chunk: {
      if (m.map !== map || !welcome) break;
      const k = chunkKey(m.cx, m.cy);
      const old = tilesOf.get(k);
      if (old && g3) fellTrees(m.cx, m.cy, old, m.tiles); // a cut tree falls (gfx/anims.ts)
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
      if (m.cs) clockScale = m.cs; // the clock runs faster by night / while everyone sleeps (World > Time)
      for (let i = 0; i < CAP; i++) if (eid[i] !== -1) { px[i] = nx[i]!; py[i] = ny[i]!; }
      const r = unpackI32(m.upd), gx = m.gx ? unpackI32(m.gx) : null;
      for (let o = 0; o < r.length; o += ENT_REC) {
        const s = slotFor(r[o]!);
        if (s < 0) continue;
        const fresh = kind[s] === 0;
        const g = gx ? gx[o / ENT_REC] ?? 0 : 0, ak = ((g >> 15) & 127) | ((g >> 16) & 128); // anim + count + aiming
        if (ak !== animKey[s] || fresh) { animKey[s] = ak; animAt[s] = now; }
        gearOf[s] = g;
        kind[s] = r[o + 1]! & 127; riding[s] = (r[o + 1]! & KIND_RIDING) ? 1 : 0; flags[s] = (r[o + 1]! >> 8) & 255; sub[s] = (r[o + 1]! >> 16) & 255; alook[s] = r[o + 1]! >>> 24; atype[s] = kind[s] === Kind.Animal ? alook[s]! & 7 : alook[s]! & 63; // kind bit 7 = riding; horses: quality bits 3-4, coat 5-7
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
        if (s !== undefined && kind[s] === Kind.Animal && m.dead?.includes(id) && drawnF[s]! > 0 && frameNo - drawnF[s]! < 30) { // killed: it falls where it was drawn
          if (corpses.length >= 32) corpses.shift();
          corpses.push({ type: atype[s]!, x: drawnX[s]!, y: drawnY[s]!, f: face[s]!, at: now });
        }
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
  chunkVer.set(k, (chunkVer.get(k) ?? 0) + 1);
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
/**
 * Chunk meshes are built in a worker (chunkworker.ts, imad 2026-11-26: a forest chunk held the game 80 ms on a fast PC, far more on
 * a TV): the nearest waiting chunk goes out (2 at a time), its arrays come back and only the GPU upload happens here. A chunk whose
 * tiles changed meanwhile, or another map, throws the old answer away. No worker (blocked, failed) = built here, one per frame.
 */
let worker: Worker | null | undefined, jobId = 0, mapGen = 0;
const jobs = new Map<number, { k: number; ver: number; gen: number }>();
const chunkVer = new Map<number, number>();
const BORDER = 3; // tiles round the chunk the builder looks at (walls, wrecks, doors look at their neighbours)
/** Main-thread ms spent on chunks (proof: total and the longest single build). */
const chunkMs = { total: 0, max: 0, n: 0 };
function chunkWorker(): Worker | null {
  if (worker !== undefined) return worker;
  if (location.search.includes('noworker')) return (worker = null);
  try {
    const here = new URL(import.meta.url);
    worker = new Worker(new URL('chunks.js' + here.search, here));
    worker.onmessage = (e: MessageEvent) => chunkDone(e.data as { id: number; data?: ChunkData; error?: string });
    worker.onerror = (e) => { console.warn('chunk worker', e.message); worker?.terminate(); worker = null; for (const j of jobs.values()) queueBuild(j.k); jobs.clear(); };
    if (looks.length) worker.postMessage({ looks });
  } catch (err) { console.warn('no chunk worker', err); worker = null; }
  return worker;
}
function chunkDone(m: { id: number; data?: ChunkData; error?: string }): void {
  const j = jobs.get(m.id);
  jobs.delete(m.id);
  if (!j || !g3 || !m.data) { if (m.error) console.warn('chunk', m.error); return; }
  if (j.gen !== mapGen || chunkVer.get(j.k) !== j.ver || !tilesOf.has(j.k)) return; // stale: the newer build is on its way
  const t0 = performance.now();
  const old = meshOf.get(j.k);
  if (old) g3.removeChunk(old);
  meshOf.set(j.k, g3.addChunk(chunkGeo(m.data), j.k & 0xffff, j.k >>> 16));
  noteChunkMs(performance.now() - t0);
}
function noteChunkMs(ms: number): void { chunkMs.total += ms; chunkMs.n++; if (ms > chunkMs.max) chunkMs.max = ms; }
/** The chunk's tiles with a border from its neighbours (-1 where none has arrived). */
function tileWindow(k: number): Int16Array {
  const W = CHUNK_TILES + BORDER * 2, win = new Int16Array(W * W);
  for (let y = 0; y < W; y++) for (let x = 0; x < W; x++) win[y * W + x] = tileAt(k, x - BORDER, y - BORDER);
  return win;
}
function buildOne(): void {
  if (!buildQ.length || !g3) return;
  const w = chunkWorker();
  if (w && jobs.size >= 2) return;
  let best = 0, bd = Infinity;
  const fx = focusX() / CHUNK_TILES - 0.5, fy = focusY() / CHUNK_TILES - 0.5;
  for (let i = 0; i < buildQ.length; i++) {
    const k = buildQ[i]!, d = Math.hypot((k & 0xffff) - fx, (k >>> 16) - fy);
    if (d < bd) { bd = d; best = i; }
  }
  const k = buildQ.splice(best, 1)[0]!;
  if (!tilesOf.has(k)) return;
  const hi = tier !== 'low';
  if (w) {
    const id = ++jobId, win = tileWindow(k);
    jobs.set(id, { k, ver: chunkVer.get(k) ?? 0, gen: mapGen });
    w.postMessage({ id, cx: k & 0xffff, cy: k >>> 16, win, b: BORDER, hi }, [win.buffer]);
    return;
  }
  const t0 = performance.now();
  const old = meshOf.get(k);
  if (old) g3.removeChunk(old);
  meshOf.set(k, g3.addChunk(chunkGeo(buildChunk(k & 0xffff, k >>> 16, (lx, ly) => tileAt(k, lx, ly), looks, hi)), k & 0xffff, k >>> 16));
  noteChunkMs(performance.now() - t0);
}

function setMap(id: string): void {
  if (!welcome) return;
  const mm = welcome.maps.find((x) => x.id === id) ?? welcome.maps[0]!;
  map = mm.id; mapW = mm.w; mapH = mm.h;
  camX = mm.w / 2; camY = mm.h / 2;
  tilesOf.clear(); meshOf.clear(); buildQ.length = 0; mapGen++; jobs.clear(); chunkVer.clear();
  g3?.setMap(mm.w, mm.h, welcome.portals.filter((p) => p.map === map).map((p) => ({ x: p.x, y: p.y, label: welcome!.maps.find((q) => q.id === p.to)?.name ?? p.to })));
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
function tileUnder(x: number, y: number): number {
  const tx = Math.floor(x), ty = Math.floor(y);
  if (tx < 0 || ty < 0 || tx >= mapW || ty >= mapH) return -1;
  const t = tilesOf.get(chunkKey((tx / CHUNK_TILES) | 0, (ty / CHUNK_TILES) | 0));
  return t ? t[(ty % CHUNK_TILES) * CHUNK_TILES + (tx % CHUNK_TILES)]! : -1;
}
/** Trees in the old tiles of a chunk that are gone in the new ones fell: each falls away from the nearest person (who cut it). */
function fellTrees(cx: number, cy: number, old: Uint8Array, now: Uint8Array): void {
  const t = performance.now();
  for (let k = 0; k < old.length; k++) {
    const a = looks[old[k]!], b = looks[now[k]!];
    if (!a || a.shape !== Shape.Tree || (b && b.shape === Shape.Tree)) continue;
    const wx = cx * CHUNK_TILES + (k % CHUNK_TILES), wy = cy * CHUNK_TILES + ((k / CHUNK_TILES) | 0);
    let bx = NaN, by = NaN, bd = 4;
    for (let i = 0; i < CAP; i++) {
      if (eid[i] === -1 || (kind[i] !== Kind.Agent && kind[i] !== Kind.Player)) continue;
      const d = Math.hypot(nx[i]! - wx - 0.5, ny[i]! - wy - 0.5);
      if (d < bd) { bd = d; bx = nx[i]!; by = ny[i]!; }
    }
    g3!.anims.fellTree(wx, wy, a, bx, by, t);
  }
}
/** A bed next to (x, y) a sleeper lies in: where to lie (on top of it, along it, the head on the pillow), or null. */
function bedPose(x: number, y: number, size: number): { x: number; y: number; f: number } | null {
  const cx = Math.floor(x), cy = Math.floor(y);
  for (let yy = cy - 1; yy <= cy + 1; yy++) for (let xx = cx - 1; xx <= cx + 1; xx++) {
    const id = tileUnder(xx + 0.5, yy + 0.5);
    if (id < 0 || looks[id]?.shape !== Shape.Bed) continue;
    // The foot of the bed reaches over the open floor next to it (as chunkmesh.ts draws it).
    const open = (ax: number, ay: number) => { const j = tileUnder(ax + 0.5, ay + 0.5); return j >= 0 && looks[j]?.shape === Shape.Ground; };
    const [fx, fz] = open(xx, yy + 1) ? [0, 1] : open(xx, yy - 1) ? [0, -1] : open(xx + 1, yy) ? [1, 0] : open(xx - 1, yy) ? [-1, 0] : [0, 0];
    const mx = xx + 0.5 + fx * 0.45, my = yy + 0.5 + fz * 0.45;
    if (Math.hypot(mx - x, my - y) > 1.25) continue;
    const along = fx || fz ? -0.45 + 0.9 * 1.25 * size : 0; // the head near the headboard, the feet towards the foot
    return { x: xx + 0.5 + fx * along, y: yy + 0.5 + fz * along, f: fx || fz ? Math.atan2(-fx, -fz) : 0 };
  }
  return null;
}
const easeS = (v: number) => { const u = Math.max(0, Math.min(1, v)); return u * u * (3 - 2 * u); };
function stepUnder(x: number, y: number): string { const t = tileUnder(x, y); return stepName[t] ?? 'step_dirt'; }
/** Every second: ambience by the hour and the map, the campfire's crackle by how near the nearest one is. */
function ambience(now: number): void {
  if (now - ambAt < 1000) return;
  ambAt = now;
  if (mode !== 'world' || rp) { for (const id of ['amb_day', 'amb_night', 'amb_woods', 'fire_loop', 'rain_loop', 'wind_loop']) sound.loop(id, 0); return; }
  const h = (((gameSec + ((now - tickAt) / 1000) * clockScale * simSpeed) / 3600 + 8) % 24 + 24) % 24;
  const night = h < 5.5 || h >= 20.5, woods = /wood|forest/i.test(map);
  sound.loop('amb_night', night ? 0.8 : 0);
  sound.loop('amb_woods', !night && woods ? 0.8 : 0);
  sound.loop('amb_day', !night && !woods ? 0.6 : 0);
  let fd = 99;
  if (campfireTile >= 0) {
    const cx = Math.floor(focusX()), cy = Math.floor(focusY());
    for (let yy = cy - 9; yy <= cy + 9; yy++) for (let xx = cx - 9; xx <= cx + 9; xx++) if (tileUnder(xx + 0.5, yy + 0.5) === campfireTile) fd = Math.min(fd, Math.hypot(xx + 0.5 - focusX(), yy + 0.5 - focusY()));
  }
  sound.loop('fire_loop', fd < 9 ? Math.min(1, (1 - fd / 9) * 1.2) : 0);
  // The weather: rain on the roofs and leaves, wind in storms and blizzards.
  const wk = wxInfo?.w ?? 'clear', wkk = wxInfo?.k ?? 0;
  sound.loop('rain_loop', wk === 'rain' || wk === 'storm' ? 0.45 + 0.45 * wkk : 0);
  sound.loop('wind_loop', wk === 'storm' || wk === 'blizzard' ? 0.5 + 0.4 * wkk : wk === 'snow' ? 0.25 : 0);
}
function blocked(x: number, y: number): boolean {
  const r = body.radius * 0.9;
  if (solidAt(x - r, y - r) || solidAt(x + r, y - r) || solidAt(x - r, y + r) || solidAt(x + r, y + r)) return true;
  // A closed door stops me like a wall (the interact button opens it); one I already stand in lets me out.
  if (doorTileId < 0) return false;
  const k0x = Math.floor(predX), k0y = Math.floor(predY);
  for (const [dx, dy] of [[-r, -r], [r, -r], [-r, r], [r, r]] as const) {
    const tx = Math.floor(x + dx), ty = Math.floor(y + dy);
    if ((tx !== k0x || ty !== k0y) && tileUnder(tx + 0.5, ty + 0.5) === doorTileId) return true;
  }
  return false;
}

// ------------------------------------------------------------ the interact button's hint (imad 2026-11-25: "show A: mount near the horse, A: open door near it")
let doorTileId = -1, doorOpenId = -1;
const iaEl = document.getElementById('iahint')!;
let iaAt = 0, iaShown = '';
/** What the interact button does right now, in the server's own order for "take" (sim/brain.ts playerDo + app.ts). */
let iaNow: { key: Key; door?: [number, number] } | null = null;
/** The door within reach I face most (x, y, open?), or null. */
function nearDoor(): [number, number, boolean] | null {
  if (doorTileId < 0) return null;
  const x = focusX(), y = focusY(), a = myAng();
  let best: [number, number, boolean] | null = null, bs = Infinity;
  for (let yy = Math.floor(y) - 2; yy <= Math.floor(y) + 2; yy++) for (let xx = Math.floor(x) - 2; xx <= Math.floor(x) + 2; xx++) {
    const t = tileUnder(xx + 0.5, yy + 0.5);
    if (t !== doorTileId && t !== doorOpenId) continue;
    if (xx === Math.floor(x) && yy === Math.floor(y)) continue; // standing in the doorway: step out first
    const d = Math.hypot(xx + 0.5 - x, yy + 0.5 - y);
    if (d > 1.9) continue;
    const sc = d - Math.cos(Math.atan2(yy + 0.5 - y, xx + 0.5 - x) - a) * 0.6;
    if (sc < bs) { bs = sc; best = [xx, yy, t === doorOpenId]; }
  }
  return best;
}
function interactHint(): { key: Key; door?: [number, number] } | null {
  if (how !== 'play' || !playing() || !meNeeds) return null;
  const x = focusX(), y = focusY();
  if (meNeeds.ride) return { key: 'iaOff' };
  if (meNeeds.asleep) return { key: 'iaWake' };
  let bk = '', bxd = 2.2; // my fridge / chest (imad 2026-11-26)
  for (let yy = Math.floor(y) - 2; yy <= Math.floor(y) + 2; yy++) for (let xx = Math.floor(x) - 2; xx <= Math.floor(x) + 2; xx++) {
    const n = tileName[tileUnder(xx + 0.5, yy + 0.5)];
    if (n !== 'fridge' && n !== 'chest') continue;
    const d = Math.hypot(xx + 0.5 - x, yy + 0.5 - y);
    if (d < bxd) { bxd = d; bk = n; }
  }
  const dr = nearDoor();
  // A door beside the fridge: the nearer one wins (standing at the fridge = the fridge).
  if (dr && !(bk && bxd < Math.hypot(dr[0] + 0.5 - x, dr[1] + 0.5 - y))) return { key: dr[2] ? 'iaClose' : 'iaOpen', door: [dr[0], dr[1]] };
  for (let i = 0; i < CAP; i++) if (eid[i] !== -1 && kind[i] === Kind.Item && Math.hypot(nx[i]! - x, ny[i]! - y) < 1.4) return { key: 'iaPick' };
  if (bk) return { key: bk === 'fridge' ? 'iaFridge' : 'iaChest' };
  for (let yy = Math.floor(y) - 2; yy <= Math.floor(y) + 2; yy++) for (let xx = Math.floor(x) - 2; xx <= Math.floor(x) + 2; xx++) { // a bed: lie down in it (imad 2026-11-26)
    if (tileName[tileUnder(xx + 0.5, yy + 0.5)] === 'bed' && Math.hypot(xx + 0.5 - x, yy + 0.5 - y) < 1.8) return { key: 'iaBed' };
  }
  for (let i = 0; i < CAP; i++) if (eid[i] !== -1 && kind[i] === Kind.Item && Math.hypot(nx[i]! - x, ny[i]! - y) < 1.8) return { key: 'iaPick' };
  for (let yy = Math.floor(y) - 2; yy <= Math.floor(y) + 2; yy++) for (let xx = Math.floor(x) - 2; xx <= Math.floor(x) + 2; xx++) {
    if (tileName[tileUnder(xx + 0.5, yy + 0.5)] === 'water' && Math.abs(xx + 0.5 - x) < 2.1 && Math.abs(yy + 0.5 - y) < 2.1) return { key: meNeeds.thirst > 5 ? 'iaDrink' : 'iaFill' }; // not thirsty: fill bottles
  }
  if ((meNeeds.carry > 0 || (meNeeds.inv?.food ?? 0) > 0) && meNeeds.hunger > 15) return { key: 'iaEat' };
  let best = '', bd = 1.6;
  for (let yy = Math.floor(y) - 2; yy <= Math.floor(y) + 2; yy++) for (let xx = Math.floor(x) - 2; xx <= Math.floor(x) + 2; xx++) {
    const n = tileName[tileUnder(xx + 0.5, yy + 0.5)];
    if (n !== 'tree' && n !== 'rock' && n !== 'rubble') continue;
    const d = Math.hypot(xx + 0.5 - x, yy + 0.5 - y);
    if (d < bd) { bd = d; best = n; }
  }
  if (best) return { key: best === 'tree' ? 'iaChop' : best === 'rock' ? 'iaMine' : 'iaSearch' };
  for (let i = 0; i < CAP; i++) {
    if (eid[i] === -1 || kind[i] !== Kind.Animal) continue;
    const h = horseInfo.get(eid[i]!);
    if (!h) continue;
    const d = Math.hypot(nx[i]! - x, ny[i]! - y);
    if (h[4] && d < 3.5) return { key: 'iaMount' };
    if (!h[3] && d < 3.4) return { key: 'iaTame' };
  }
  return null;
}
/** Five times a second: the chip "A  Open the door" over the hints. */
function updateInteract(now: number): void {
  if (now - iaAt < 200) return;
  iaAt = now;
  iaNow = mode === 'world' && !menu.open && !placing && !aimOn && !wheel.open ? interactHint() : null;
  const k = keyName('use');
  const txt = iaNow && k ? `<b>${esc(k)}</b><span>${esc(t(iaNow.key))}</span>` : '';
  if (txt === iaShown) return;
  iaShown = txt;
  iaEl.innerHTML = txt;
  iaEl.hidden = !txt;
}

function stick(): [number, number] {
  if (menu.open || wheel.open) { STICK0[0] = STICK0[1] = 0; return STICK0; }
  if (stickLatch) { // the stick that chose on the wheel walks only after it came back to the middle (imad 2026-11-27: "sleep from the wheel wakes at once")
    const g = MyPC.gamepad; if (!g || Math.hypot(g.axis(0), g.axis(1)) < 0.3) stickLatch = false; else { STICK0[0] = STICK0[1] = 0; return STICK0; }
  }
  let ax = MyPC.gamepad ? MyPC.gamepad.axis(0) : 0, ay = MyPC.gamepad ? MyPC.gamepad.axis(1) : 0;
  if (Math.hypot(ax, ay) < 0.18) { ax = 0; ay = 0; }
  if (held.left || padHeld.left) ax = -1; if (held.right || padHeld.right) ax = 1; if (held.up || padHeld.up) ay = -1; if (held.down || padHeld.down) ay = 1;
  const l = Math.hypot(ax, ay);
  if (l > 1) { ax /= l; ay /= l; }
  return [ax, ay];
}
const STICK: [number, number] = [0, 0];
const STICK0: [number, number] = [0, 0];
let stickLatch = false;

/** Third / first person: the stick moves along where I look (left / right = side steps), the right stick or ◀ ▶ turn. */
function viewStick(dt: number): [number, number] {
  if (menu.open || wheel.open) { STICK0[0] = STICK0[1] = 0; return STICK0; }
  if (stickLatch) { // the stick that chose on the wheel walks only after it came back to the middle (imad 2026-11-27: "sleep from the wheel wakes at once")
    const g = MyPC.gamepad; if (!g || Math.hypot(g.axis(0), g.axis(1)) < 0.3) stickLatch = false; else { STICK0[0] = STICK0[1] = 0; return STICK0; }
  }
  const gp = MyPC.gamepad;
  let ax = gp ? gp.axis(0) : 0, ay = gp ? gp.axis(1) : 0, rx = gp ? gp.axis(2) : 0;
  if (Math.hypot(ax, ay) < 0.18) { ax = 0; ay = 0; }
  if (Math.abs(rx) < 0.2) rx = 0;
  const turn = rx * Math.abs(rx) + (held.right ? 1 : 0) - (held.left ? 1 : 0);
  yaw += turn * (aimOn ? 1.3 : 2.4) * dt; // drawing the bow: slower, finer turns
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
/** Everything the wheel can hold; the player picks which and in what order (Settings > Quick action wheel, `MyPC.save('wheel')`). */
const WHEEL_ALL = ['map', 'use', 'horse', 'eat', 'drink', 'sleep', 'heal', 'build', 'place', 'bag', 'camera', 'attackPerson', 'gear', 'me', 'talk', 'attack', 'pickup', 'thoughts'] as const;
const WHEEL_DEFAULT: string[] = ['map', 'use', 'horse', 'eat', 'drink', 'sleep', 'heal', 'build', 'place', 'bag', 'camera', 'attackPerson'];
const WHEEL_MAX = 12;
let wheelIds: string[] = [...WHEEL_DEFAULT];
const WHEEL_ICON: Record<string, string> = { map: '🗺', horse: '🐎', use: '✋', eat: '🍖', drink: '💧', sleep: '🛏', build: '🔨', place: '🧱', bag: '🎒', camera: '🎥', attackPerson: '⚔️', heal: '✚', gear: '🛡', me: '🙂', talk: '💬', attack: '🗡', pickup: '👐', thoughts: '💭' };
const WHEEL_KEY: Record<string, Key> = { map: 'qMap', horse: 'qHorse', use: 'qUse', eat: 'qEat', drink: 'qDrink', sleep: 'qSleep', build: 'aBuild', place: 'qPlace', bag: 'qBag', camera: 'qCamera', attackPerson: 'aAttackPerson', heal: 'qHeal', gear: 'qGear', me: 'qMe', talk: 'qTalk', attack: 'qAttack', pickup: 'qPickup', thoughts: 'qThoughts' };
function loadWheel(): void {
  const v = MyPC.load('wheel', null) as unknown;
  if (Array.isArray(v)) { const ok = v.filter((x): x is string => typeof x === 'string' && (WHEEL_ALL as readonly string[]).includes(x)); if (ok.length >= 2) wheelIds = [...new Set(ok)].slice(0, WHEEL_MAX); }
}
function saveWheel(): void { MyPC.save('wheel', wheelIds); }
let wheelEdit = '';
// ------------------------------------------------------------ the compass bar, names over heads, riding by yourself (imad 2026-11-26)
const compass = new Compass(), names = new Names(), chatLog = new ChatLog(), cues = new SoundCues();
const CUE_ICON = ['🐇', '🦌', '🐗', '🐺', '🐻', '🐎'];
setInterval(() => chatLog.tick(performance.now()), 5000);
let namesOn = true, cuesOn = true, compassOn = true, compassAt = 0, rideDestsAt = 0;
/** Where I can ride from here: [id, kind, label, metres (-1 = another map)] (Do `rideTo` ''). */
let rideDests: [string, string, string, number][] = [];
let autoRide: AutoRide | null = null;
const ARV: [number, number] = [0, 0];
function rideLabel(r: [string, string, string, number]): string {
  if (r[1] === 'home') return t('rideHome');
  if (r[1] === 'camp') return t('rideCamp');
  if (r[1] === 'map' || r[1] === 'wild') return tf('rideMap', r[2]);
  const k = r[1].slice(5) as MarkKind;
  return `${MARK_ICON[k] ?? ''} ${r[2] && r[2] !== MARK_ICON[k] ? r[2] : t(MARK_KEY[k] ?? 'mkStar')}`;
}
function rideIcon(kind: string): string { return kind === 'home' ? '🏠' : kind === 'camp' ? '🔥' : kind === 'wild' ? '🌲' : kind === 'map' ? '🏘' : MARK_ICON[kind.slice(5) as MarkKind] ?? '📍'; }
function startAutoRide(id: string, label: string): void {
  if (!meNeeds?.ride) return;
  autoRide = new AutoRide(id, label);
  autoRide.asked = performance.now();
  send({ t: Msg.Do, a: 'rideTo', text: id });
  note(tf('rideGoing', label), 4000);
}
function stopAutoRide(why: Key | '' = ''): void {
  if (!autoRide) return;
  autoRide = null; runHeld = false;
  if (why) note(t(why), 3000);
}
function mapNow(): string { return map; }
function compassName(kind: string, label: string): string { return kind === 'home' ? t('cHome') : kind === 'camp' ? t('cCamp') : kind === 'partner' ? `${t('cPartner')}: ${label}` : label; }
/** The wheel's button: held on a controller (let go = do it), pressed once on the remote (arrows + OK). */
function wheelButton(pressed: boolean, pad: boolean): void {
  if (mode !== 'world' || menu.open || rp) return;
  if (pressed) {
    if (wheel.open) { if (!pad) wheel.close(); return; }
    if (how !== 'play' || !playing()) return;
    held.left = held.right = held.up = held.down = false; padHeld.left = padHeld.right = padHeld.up = padHeld.down = false; runHeld = false;
    if (meNeeds?.ride) { // on horseback: a wheel of its own (imad 2026-11-26): where to ride by yourself, get off, talk, attack
      const items: WheelItem[] = [{ id: 'rideOff', icon: '🐎', label: t('rideOff') }];
      if (autoRide) items.push({ id: 'rideStop', icon: '✋', label: t('rideStop') });
      for (const r of rideDests.slice(0, 12 - 4 - items.length)) items.push({ id: 'ride:' + r[0], icon: rideIcon(r[1]), label: rideLabel(r) });
      items.push({ id: 'talk', icon: WHEEL_ICON.talk!, label: t('qTalk') }, { id: 'attack', icon: WHEEL_ICON.attack!, label: t('qAttack') }, { id: 'map', icon: WHEEL_ICON.map!, label: t('qMap') });
      wheel.show(items, pad, pad ? t('wheelRide') : t('wheelRemote'));
      rideDestsAt = performance.now(); send({ t: Msg.Do, a: 'rideTo', text: '' });
      return;
    }
    const items: WheelItem[] = wheelIds.map((id) => ({ id, icon: WHEEL_ICON[id]!, label: id === 'place' ? placeLabel() : t(WHEEL_KEY[id]!) }));
    wheel.show(items, pad, t(pad ? 'wheelHelp' : 'wheelRemote'));
    return;
  }
  if (!pad || !wheel.hold) return;
  // A short press with nothing chosen keeps it open (pick with the D-pad, A to do it).
  if (wheel.sel < 0 && performance.now() - wheel.openedAt < 350) { wheel.hold = false; return; }
  runQuick(wheel.close());
}
let seatBounce = 0;
/** Seat height of the horse a rider at (x, y) sits on (the ridden horse nearest to them), with its stride's bounce. */
function riderSeat(x: number, y: number): number {
  let best = -1, bd = 1.5;
  for (let j = 0; j < CAP; j++) {
    if (eid[j] === -1 || kind[j] !== Kind.Animal || atype[j] !== 5 || !(riding[j])) continue;
    const d = Math.hypot(nx[j]! - x, ny[j]! - y);
    if (d < bd) { bd = d; best = j; }
  }
  const sc = best >= 0 ? horseInfo.get(eid[best]!)?.[0] ?? 1 : 1;
  seatBounce = g3 && best >= 0 ? g3.horses.bounce(eid[best]!, sc) : 0; // the rider rises and falls with the horse's stride
  return (g3 ? g3.horses.seat(sc) : 1.4 * sc) + seatBounce;
}
/** The nearest horse within r m of me (slot / -1). */
function horseNear(r: number): number {
  const s = meSlot();
  if (s < 0) return -1;
  let best = -1, bd = r;
  for (let j = 0; j < CAP; j++) {
    if (eid[j] === -1 || kind[j] !== Kind.Animal || atype[j] !== 5 || riding[j]) continue;
    const d = Math.hypot(nx[j]! - predX, ny[j]! - predY);
    if (d < bd) { bd = d; best = j; }
  }
  return best;
}
/** What "Put down" would put down: the first thing in the bag that can be placed. */
function placeable(): string | null {
  const inv = meNeeds?.inv ?? {};
  for (const p of PLACEABLE) if ((inv[p] ?? 0) > 0) return p;
  return null;
}
// ------------------------------------------------------------ aimed building (imad 2026-11-25: "aim where to build very precisely")
/** What is being placed: a see-through model the player moves tile by tile, turns (a hut's door) and confirms. */
let placing: { what: string; tx: number; ty: number; dir: number; moveAt: number; sent: boolean } | null = null;
const PLACE_REACH = 8;
/** Door directions as the server numbers them: south, east, north, west (outwards). */
const PDIRS = [[0, 1], [1, 0], [0, -1], [-1, 0]] as const;
const BUILD_ON = new Set(['grass', 'dirt', 'sand', 'ashes', 'road']);
const WALLISH = new Set(['woodwall', 'palisade', 'stonewall', 'floor']);
/** How tall each thing's model is (0 = flat). */
const GHOST_H: Record<string, number> = { palisade: 1.3, spikes: 0.5, stonewall: 1.3, door: 1.5, window: 1.2, bed: 0.35, lamp: 1.6, campfire: 0.3, fridge: 1.7, chest: 0.6 };
/** A hut's size (7 x 7 since imad 2026-11-26) and half of it. */
const HS = HUT_SIZE, HH = (HUT_SIZE - 1) >> 1;
function startPlacing(what: string): void {
  if (how !== 'play' || !playing()) return;
  menu.close();
  if (wheel.open) wheel.close();
  if (aimOn) setAim(false);
  const a = myAng(), x = focusX(), y = focusY();
  held.left = held.right = held.up = held.down = false; padHeld.left = padHeld.right = padHeld.up = padHeld.down = false; runHeld = false;
  if (what === 'hut') {
    const cx = x + Math.cos(a) * (HH + 2.5), cy = y + Math.sin(a) * (HH + 2.5);
    // The door faces me.
    const dx = x - cx, dy = y - cy, dir = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 1 : 3) : dy > 0 ? 0 : 2;
    placing = { what, tx: Math.floor(cx - HH), ty: Math.floor(cy - HH), dir, moveAt: 0, sent: false };
  } else placing = { what, tx: Math.floor(x + Math.cos(a) * 1.6), ty: Math.floor(y + Math.sin(a) * 1.6), dir: 0, moveAt: 0, sent: false };
  sound.play('ui_open');
  askDestroy();
  placeNote();
}
function stopPlacing(): void { if (!placing) return; placing = null; destroyInfo = null; g3?.ghost(null); noteEl.hidden = true; updateHints(); }
/** Pulling down (imad 2026-11-25): the server says whose the aimed thing is and what comes down with it (a whole hut). */
let destroyInfo: { tx: number; ty: number; code: string; cells: number[]; owner: string } | null = null;
let destroyAsk = 0;
function askDestroy(): void {
  if (!placing || placing.what !== 'destroy') return;
  const p = placing;
  clearTimeout(destroyAsk);
  destroyAsk = window.setTimeout(() => { if (placing === p) send({ t: Msg.Do, a: 'destroy', text: `${p.tx},${p.ty},?` }); }, 120);
}
/** '' = it can go there (as far as this screen knows: the server has the last word), else the code. */
function placeCheck(p: NonNullable<typeof placing>): string {
  const x = focusX(), y = focusY();
  if (p.what === 'destroy') {
    if (Math.hypot(p.tx + 0.5 - x, p.ty + 0.5 - y) > PLACE_REACH) return 'tooFar';
    return destroyInfo && destroyInfo.tx === p.tx && destroyInfo.ty === p.ty ? destroyInfo.code : 'wait';
  }
  const person = (tx: number, ty: number) => {
    for (let i = 0; i < CAP; i++) if (eid[i] !== -1 && (kind[i] === Kind.Agent || kind[i] === Kind.Player) && Math.abs(nx[i]! - tx - 0.5) < 0.9 && Math.abs(ny[i]! - ty - 0.5) < 0.9) return true;
    return false;
  };
  if (p.what === 'hut') {
    const cx = Math.max(p.tx, Math.min(p.tx + HS - 1, x - 0.5)), cy = Math.max(p.ty, Math.min(p.ty + HS - 1, y - 0.5));
    if (Math.hypot(cx + 0.5 - x, cy + 0.5 - y) > PLACE_REACH) return 'tooFar';
    const [dx, dy] = PDIRS[p.dir]!, dX = p.tx + HH + dx * HH, dY = p.ty + HH + dy * HH;
    for (let yy = 0; yy < HS; yy++) for (let xx = 0; xx < HS; xx++) {
      const t0 = tileUnder(p.tx + xx + 0.5, p.ty + yy + 0.5);
      if (t0 < 0) return 'unknown';
      if (!BUILD_ON.has(tileName[t0] ?? '')) return 'noRoom';
      const edge = xx === 0 || yy === 0 || xx === HS - 1 || yy === HS - 1;
      if (edge && !(p.tx + xx === dX && p.ty + yy === dY) && person(p.tx + xx, p.ty + yy)) return 'someone';
    }
    const o = tileUnder(p.tx + HH + dx * (HH + 1) + 0.5, p.ty + HH + dy * (HH + 1) + 0.5);
    if (o < 0 || solid[o]) return 'doorBlocked';
    return '';
  }
  if (Math.hypot(p.tx + 0.5 - x, p.ty + 0.5 - y) > PLACE_REACH) return 'tooFar';
  const t0 = tileUnder(p.tx + 0.5, p.ty + 0.5);
  if (t0 < 0) return 'unknown';
  const n = tileName[t0] ?? '';
  if (INSIDE_ONLY.includes(p.what) && n !== 'floor') return 'insideHut'; // a fridge / chest: on a hut's floor only (imad 2026-11-26)
  if (!BUILD_ON.has(n) && n !== 'floor' && !((p.what === 'door' || p.what === 'window') && WALLISH.has(n))) return 'noRoom';
  if (p.what !== 'bed' && p.what !== 'campfire' && person(p.tx, p.ty)) return 'someone';
  return '';
}
const PLACE_CODE: Record<string, Key> = { insideHut: 'cInsideHut', tooFar: 'cTooFar', someone: 'cSomeone', doorBlocked: 'cDoorBlocked', noRoom: 'cNoRoom', unknown: 'cUnknown', nothing: 'dsNothing', notYours: 'dsNotYours', wait: 'dsWait', hutLimit: 'dHutLimit' };
function placeNote(): void {
  if (!placing) return;
  if (placing.what === 'destroy') {
    const c = placeCheck(placing);
    const keys = pads ? tf('dsPad', String(MyPC.gamepad?.label?.(0) ?? 'A'), String(MyPC.gamepad?.label?.(1) ?? 'B')) : t('dsRemote');
    const why = c === 'notYours' ? tf('dsNotYours', destroyInfo?.owner || '?') : c === 'unknown' && destroyInfo ? t('dsUnknown') : c ? t(PLACE_CODE[c] ?? 'dsNothing') : t('dsOk');
    note(`${tf('plTitle', t('bDestroy'))} · ${why} — ${keys}`, 0);
    return;
  }
  const c = placeCheck(placing), name = placing.what === 'hut' ? t('bHut2').replace(/ \(.*$/, '') : cap1(thing(placing.what));
  const keys = pads ? tf('plPad', String(MyPC.gamepad?.label?.(0) ?? 'A'), placing.what === 'hut' ? `${String(MyPC.gamepad?.label?.(2) ?? 'X')} / ${keyName('build') || 'Y'}` : '—', String(MyPC.gamepad?.label?.(1) ?? 'B'))
    : tf('plRemote', placing.what === 'hut' ? (keyName('build') || 'CH+') : '—');
  const door = placing.what === 'hut' ? ' · ' + tf('plDoor', t((['dirS', 'dirE', 'dirN', 'dirW'] as const)[placing.dir]!)) : '';
  note(`${tf('plTitle', name)} · ${c ? tf('plBad', t(PLACE_CODE[c] ?? 'cNoRoom')) : t('plOk')}${door} — ${keys}`, 0);
}
function placeMove(dx: number, dy: number): void {
  if (!placing) return;
  const p = placing, w = p.what === 'hut' ? HS : 1;
  const nxp = Math.max(0, Math.min(mapW - w, p.tx + dx)), nyp = Math.max(0, Math.min(mapH - w, p.ty + dy));
  // Never further than the reach (plus the hut's size).
  const cx = nxp + w / 2, cy = nyp + w / 2;
  if (Math.hypot(cx - focusX(), cy - focusY()) > PLACE_REACH + w / 2 + 0.8) { sound.play('ui_error'); return; }
  p.tx = nxp; p.ty = nyp;
  sound.play('ui_move', undefined, undefined, 0.5);
  askDestroy();
  placeNote();
}
function placeTurn(): void { if (!placing || placing.what !== 'hut') return; placing.dir = (placing.dir + 1) % 4; sound.play('ui_move'); placeNote(); }
function placeConfirm(): void {
  if (!placing || placing.sent) return;
  const c = placeCheck(placing);
  if (c && c !== 'unknown') { sound.play('ui_error'); note(tf('plBad', t(PLACE_CODE[c] ?? 'cNoRoom')), 2000); setTimeout(placeNote, 2000); return; }
  if (placing.what === 'destroy') {
    if (c) { sound.play('ui_error'); return; }
    placing.sent = true;
    send({ t: Msg.Do, a: 'destroy', text: `${placing.tx},${placing.ty}` });
    note(t('plSent'), 0);
    return;
  }
  placing.sent = true;
  send({ t: Msg.Do, a: 'build', text: `${placing.what}#${placing.tx},${placing.ty},${placing.dir}` });
  note(t('plSent'), 0);
}
/** Every frame while placing: the stick / arrows move the model one tile at a time (held = repeats), in the camera's frame. */
function placeTick(now: number): void {
  if (!placing) return;
  let [ax, ay] = stick();
  if (g3 && g3.view !== 'top') { // forward / side along where I look
    const fwd = -ay, side = ax, fx = Math.sin(yaw), fy = -Math.cos(yaw);
    ax = fx * fwd - fy * side; ay = fy * fwd + fx * side;
  }
  if (Math.hypot(ax, ay) < 0.5) { placing.moveAt = 0; return; }
  if (now < placing.moveAt) return;
  placing.moveAt = now + (placing.moveAt ? 140 : 300); // first step at once, then repeats
  if (Math.abs(ax) > Math.abs(ay) * 1.2) placeMove(Math.sign(ax), 0);
  else if (Math.abs(ay) > Math.abs(ax) * 1.2) placeMove(0, Math.sign(ay));
  else placeMove(Math.sign(ax), Math.sign(ay));
}
/** The see-through model on the 3D view. */
function drawGhost(): void {
  if (!g3) return;
  if (!placing || how !== 'play') { g3.ghost(null); return; }
  const p = placing, ok = !placeCheck(p), cells: number[] = [];
  if (p.what === 'destroy') { // what comes down (a whole hut), green = mine to pull down
    const d = destroyInfo && destroyInfo.tx === p.tx && destroyInfo.ty === p.ty ? destroyInfo.cells : [p.ty * mapW + p.tx];
    for (const k of d) cells.push(k % mapW, Math.floor(k / mapW), 1.6);
    g3.ghost(cells, ok);
    return;
  }
  if (p.what === 'hut') {
    const [dx, dy] = PDIRS[p.dir]!, dX = p.tx + HH + dx * HH, dY = p.ty + HH + dy * HH;
    for (let yy = 0; yy < HS; yy++) for (let xx = 0; xx < HS; xx++) {
      const X = p.tx + xx, Y = p.ty + yy, edge = xx === 0 || yy === 0 || xx === HS - 1 || yy === HS - 1;
      cells.push(X, Y, X === dX && Y === dY ? 1.5 : edge ? 1.2 : 0);
    }
    g3.ghost(cells, ok, [dX + 0.5 + dx * 1.1, dY + 0.5 + dy * 1.1, Math.atan2(dy, dx)]);
  } else { cells.push(p.tx, p.ty, GHOST_H[p.what] ?? 0.8); g3.ghost(cells, ok); }
}
function placeLabel(): string { const p = placeable(); return p ? tf('cPut', thing(p)) : t('qPlace'); }
function runQuick(id: string | null): void {
  if (!id) return;
  stickLatch = true;
  if (id === 'rideOff') { stopAutoRide(); doAction('horse', true); return; }
  if (id === 'rideStop') { stopAutoRide('rideStopped'); return; }
  if (id.startsWith('ride:')) { const r = rideDests.find((x) => x[0] === id.slice(5)); if (r) startAutoRide(r[0], r[1] === 'home' ? t('cHome') : r[1] === 'camp' ? t('cCamp') : r[1].startsWith('mark:') ? rideLabel(r) : r[2]); return; }
  if (id === 'camera') { nextCamera(); return; }
  if (id === 'bag') { openMenu('bag'); return; }
  if (id === 'heal') { send({ t: Msg.Do, a: 'medkit' }); return; }
  if (id === 'gear') { openMenu('gear'); return; }
  if (id === 'me') { send({ t: Msg.Do, a: 'mine' }); openMenu('me'); return; }
  if (id === 'place') { const p = placeable(); if (p) startPlacing(p); else note(t('qNothing'), 2000); return; }
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
  let [mx, my] = placing ? [0, 0] : g3 && g3.view !== 'top' ? viewStick(dt) : stick();
  if (placing) placeTick(now); // the stick moves the model, my character stands
  if (aimOn) {
    const s0 = meSlot(), ax0 = predOk ? predX : s0 >= 0 ? nx[s0]! : 0, ay0 = predOk ? predY : s0 >= 0 ? ny[s0]! : 0;
    if (g3 && g3.view !== 'top') {
      // Third / first person (imad 2026-11-25, "aim like a real person, a crosshair on the target"): I aim where the camera looks.
      // The right stick / ◀ ▶ turn (slower), the left stick sideways turns finely; my character stands with the bow drawn.
      const gp = MyPC.gamepad;
      let lx = gp && !menu.open ? gp.axis(0) : 0; if (Math.abs(lx) < 0.2) lx = 0;
      yaw += lx * Math.abs(lx) * 0.9 * dt;
      // Aim assist (as before: the shot goes to the locked target): near the line, the aim also drifts onto it.
      if (s0 >= 0) aimLock = targetNear(ax0, ay0, yaw - Math.PI / 2, 26, 0.12);
      if (aimLock >= 0 && eid[aimLock] !== -1) {
        let d = Math.atan2(ny[aimLock]! - ay0, nx[aimLock]! - ax0) - (yaw - Math.PI / 2);
        d = Math.atan2(Math.sin(d), Math.cos(d));
        if (Math.abs(d) < 0.12) yaw += d * Math.min(1, dt * 4);
      }
      aimAng = yaw - Math.PI / 2;
    } else {
      // From above: the stick turns the aim, the nearest target close to the line is locked (red ring).
      if (Math.hypot(mx, my) > 0.35) aimAng = Math.atan2(my, mx);
      if (s0 >= 0) aimLock = targetNear(ax0, ay0, aimAng, 22, 0.14);
    }
    mx = my = 0;
  }
  let autoRun = false;
  if (autoRide) { // riding by myself along the server's road; touching the stick takes the reins
    if (!meNeeds?.ride) stopAutoRide();
    else if (Math.hypot(mx, my) > 0.3) stopAutoRide('rideStopped');
    else if (!meTransit) {
      if (autoRide.map && autoRide.map !== map) autoRide.pts = []; // a new map: the next leg
      const st = autoRide.steer(predX, predY, now, ARV);
      if (st === 'go') { mx = ARV[0]; my = ARV[1]; autoRun = true; if (g3 && g3.view !== 'top') { let dy = Math.atan2(my, mx) + Math.PI / 2 - yaw; dy = Math.atan2(Math.sin(dy), Math.cos(dy)); yaw += dy * Math.min(1, dt * 2.5); } }
      else if (st === 'arrived') { const l = autoRide.label; stopAutoRide(); note(tf('rideArrived', l), 3500); sound.play('ui_ok'); }
      else if (now - autoRide.asked > 1500) { // the road ran out, I got stuck or I am on a new map: ask again
        if (st === 'ask' && ++autoRide.fails > 4) stopAutoRide('rideLost');
        else { autoRide.asked = now; autoRide.pts = []; send({ t: Msg.Do, a: 'rideTo', text: autoRide.id }); }
      }
    }
  }
  STICK[0] = mx; STICK[1] = my;
  const run = (runHeld || autoRun) && !menu.open;
  const s = meSlot();
  if (s < 0) return;
  if (!predOk) { predX = nx[s]!; predY = ny[s]!; pvx = pvy = 0; predOk = true; }
  // My character moves on this screen at once (same rule as the server: velocity eases towards the wish at 8 m/s^2 at most);
  // the server is told where it is and takes it (imad 2026-11-20: "move my character immediately, not after the server").
  const rd = meNeeds?.ride, sp = rd ? (run ? rd.run : rd.walk) : run ? body.run : body.walk; // on a horse: its pace (the server does the same)
  const wx = mx * sp, wy = my * sp, ax = wx - pvx, ay = wy - pvy, a = Math.hypot(ax, ay), mdv = 8 * dt;
  const f = a > mdv ? mdv / a : 1;
  pvx += ax * f; pvy += ay * f;
  const nxp = predX + pvx * dt;
  if (!blocked(nxp, predY)) predX = nxp; else pvx = 0;
  const nyp = predY + pvy * dt;
  if (!blocked(predX, nyp)) predY = nyp; else pvy = 0;
  const moving = Math.abs(pvx) + Math.abs(pvy) > 0.01;
  if (moving) {
    stepDist += Math.hypot(pvx, pvy) * dt;
    if (stepDist > (run ? 0.9 : 0.68)) { stepDist = 0; sound.play(stepUnder(predX, predY), undefined, undefined, run ? 0.6 : 0.42); }
  }
  if (Math.abs(pvx) + Math.abs(pvy) > 0.3) moveAng = Math.atan2(pvy, pvx);
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

/** Watch mode: the camera follows my own character (it is on autopilot meanwhile), on whatever map it is. */
function followMe(): void {
  if (meId < 0) return;
  if (!meTransit && meTo && meTo !== map) setMap(meTo);
  follow = meId; followSeen = performance.now(); snapCam = true;
  sendView();
  MyPC.announce?.(t('followingMe'));
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
    send({ t: Msg.Join, watch: true }); // my character goes on autopilot while I watch; the camera stays on it
    if (meId >= 0) window.setTimeout(followMe, 400);
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
    ? [move, part('use', actionLabel('use').replace(/ \(.*\)$/, '')), part('talk', actionLabel('talk')), part('attack', actionLabel('attack')), part('aim', actionLabel('aim').replace(/ \(.*\)$/, '')), part('run', actionLabel('run')), part('wheel', t('aWheel').replace(/ \(.*\)$/, '')), part('build', actionLabel('build')), part('menu', actionLabel('menu'))]
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

/** Is one of the town's teachers (NPC) within r metres, nearer than any person? */
function nearestNpc(r: number): boolean {
  const x = focusX(), y = focusY();
  let npc = Infinity, person = Infinity;
  for (let i = 0; i < CAP; i++) {
    if (eid[i] === -1 || (kind[i] !== Kind.Npc && kind[i] !== Kind.Agent)) continue;
    const d = Math.hypot(nx[i]! - x, ny[i]! - y);
    if (kind[i] === Kind.Npc) npc = Math.min(npc, d); else person = Math.min(person, d);
  }
  return npc < r && npc <= person;
}

/** One of the player's actions, from any button. */
function doAction(a: ActionId, pressed: boolean): void {
  if (a === 'run') { runHeld = pressed; return; }
  if (a === 'aim') { setAim(pressed, !pressed); return; }
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
    case 'map': openMap(); return;
    case 'camera': if (how === 'play') nextCamera(); return;
    case 'wheel': wheelButton(true, false); return;
    case 'build': if (placing) placeTurn(); else if (how === 'play') openMenu('build'); return;
  }
  if (how === 'watch') {
    if (a === 'use') followNext();
    else if (a === 'eat') nextMap();
    else if (a === 'sleep') openMenu('person');
    return;
  }
  if (!playing()) return;
  if (a === 'use') { // things: a door, take, gather, drink... (never people, never a fight)
    const h = interactHint();
    send(h?.door ? { t: Msg.Do, a: 'take', text: `door:${h.door[0]},${h.door[1]}` } : { t: Msg.Do, a: 'take' });
    return;
  }
  if (a === 'attack') { attack(); return; }
  if (a === 'horse') { send({ t: Msg.Do, a: 'horse' }); return; } // off when riding, on my horse, tame a wild one, or call mine
  if (a === 'attackPerson') { // a person, never by mistake: PvP must be on first
    if (!meNeeds?.pvp) { note(t('pvpNeed'), 3000); return; }
    send({ t: Msg.Do, a: 'hitperson', text: myAng().toFixed(3) });
    return;
  }
  if (a === 'talk') {
    if (nearestNpc(3.5)) { quests.talkToNpc(); return; } // a town teacher: quests (and clans at the registrar)
    if (nearestPerson(3.5) < 0) { note(t('dNobodyNear'), 2000); return; }
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

/** Attack: always a hit with the melee weapon (or fists) on what is in front. The bow shoots only when the Aim button is let go
 *  (imad 2026-11-27: "after a bow shot, Attack shot an arrow again: wrong, Attack uses the sword, the bow only on Aim release"). */
function attack(): void {
  if (aimOn) return; // aiming: letting go of the aim button shoots (imad 2026-11-25)
  const a = myAng();
  send({ t: Msg.Do, a: 'hit', text: a.toFixed(3) });
}
/** Aim button held: the stick turns the aim, my character holds the bow drawn; let go = the arrow flies (`fire`). */
function setAim(on: boolean, fire = false): void {
  if (on === aimOn) return;
  if (on && (how !== 'play' || !playing() || menu.open || mode !== 'world')) return;
  aimOn = on;
  const inv = meNeeds?.inv ?? {}, bow = (inv.bow ?? 0) > 0, arrows = inv.arrows ?? 0;
  if (on) {
    aimAng = g3 && g3.view !== 'top' && camView !== 'top' ? yaw - Math.PI / 2 : Number.isFinite(moveAng) ? moveAng : myAng(); aimAt = performance.now();
    if (!bow) note(t('noBow'), 3500);
    else if (arrows < 1) note(t('noArrows'), 3500);
    else note(tf('aimOn', keyName('aim')), 2500);
    if (bow) send({ t: Msg.Do, a: 'aim', text: '1' }); // everyone sees the bow in my hands
  } else {
    if (fire && bow && arrows > 0) {
      const x = focusX(), y = focusY();
      const t0 = aimLock >= 0 && eid[aimLock] !== -1 ? Math.atan2(ny[aimLock]! - y, nx[aimLock]! - x) : aimAng;
      send({ t: Msg.Do, a: 'shoot', text: t0.toFixed(3) });
    }
    if (bow) send({ t: Msg.Do, a: 'aim', text: '0' });
    aimLock = -1; g3?.aim(false); xhairEl.hidden = true;
  }
  aimHud();
}
/** My own character while I aim: the bow drawn in my hands at once (the server's frames follow a moment later). */
function aimGear(g: number): number {
  if ((meNeeds?.inv?.bow ?? 0) < 1) return g;
  const q = (meNeeds?.gear as { up?: Record<string, [number, number]> } | undefined)?.up?.bow?.[1] ?? 0;
  return (g & ~(7 | 7 << 3 | 127 << 15 | 1 << 22)) | 4 | (q & 7) << 3 | 6 << 15 | 1 << 23;
}
/** While aiming: my arrows, next to the aim (imad 2026-11-25: "when aiming show the arrows I have"). */
function aimHud(): void {
  const n = aimOn && (meNeeds?.inv?.bow ?? 0) > 0 ? meNeeds?.inv?.arrows ?? 0 : -1;
  if (n === aimShown) return;
  aimShown = n;
  if (n < 0) { aimEl.hidden = true; return; }
  const ic = iconStyle('arrows', 48);
  aimEl.innerHTML = `${ic ? `<i style="${ic}"></i>` : ''}<b>${n}</b><span>${tf('arrowsLeft', String(n))}</span>`;
  aimEl.classList.toggle('none', n < 1);
  aimEl.hidden = false;
}
/** The button for an action as the player sees it (the controller's printed name, else the remote's). */
function keyName(a: ActionId): string {
  if (pads) { const i = binds.pad[a]; return i === undefined ? '' : String(MyPC.gamepad?.label?.(i) ?? MyPC.gamepad?.name?.(i) ?? i); }
  const r = binds.remote[a]; return r ? remoteName(r) : '';
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
  if (quests.did(d as never)) return;
  if (d.code === 'compass') { compass.set(((d as unknown as { places?: CompassRow[] }).places ?? []), compassName); return; }
  if (d.code === 'rideDests') { rideDests = (d as unknown as { dests?: [string, string, string, number][] }).dests ?? []; return; }
  if (d.a === 'rideTo') {
    const r = d as typeof d & { id?: string; pts?: [number, number][]; gate?: boolean; full?: boolean; label?: string };
    if (!autoRide || r.id !== autoRide.id) return;
    if (d.code === 'route' && r.pts?.length) { autoRide.load(r.pts, !!r.gate, r.full !== false, mapNow(), performance.now()); return; }
    if (d.code === 'arrived') { const l = autoRide.label; stopAutoRide(); note(tf('rideArrived', l), 3500); sound.play('ui_ok'); return; }
    stopAutoRide('rideNoWay'); return;
  }
  if (d.code === 'onHorse') { note(t('onHorse'), 2500); sound.play('ui_error'); return; }
  { // a fridge / chest (imad 2026-11-26)
    const bx = d as typeof d & { kind?: string; at?: number[]; inv?: Record<string, number>; bag?: Record<string, number>; food?: number; carry?: number; moved?: number; cap?: number };
    if (bx.kind === 'fridge' || bx.kind === 'chest') {
      boxView = { kind: bx.kind, at: bx.at ?? [0, 0], inv: bx.inv ?? {}, bag: { ...(bx.bag ?? {}), food: bx.food ?? 0 }, cap: bx.cap ?? BOX_CAP };
      if (d.code === 'box') { if (!(menu.open && menu.page === 'box')) openMenu('box'); else menu.refresh(); sound.play('ui_open'); return; }
      if (d.code === 'boxPut' || d.code === 'boxTook') { sound.play('ui_ok'); note(tf(d.code === 'boxPut' ? 'boxPutN' : 'boxTookN', String(bx.moved ?? 0), thing(d.item ?? '')), 1500); }
      else { sound.play('ui_error'); note(t((BOX_CODE[d.code] ?? 'dNothing') as Key), 2200); }
      if (menu.open && menu.page === 'box') menu.refresh();
      return;
    }
    if ((d.a === 'box' || d.a === 'take' || d.a === 'use') && BOX_CODE[d.code]) { sound.play('ui_error'); note(t(BOX_CODE[d.code]! as Key), 2200); return; }
    if (d.code === 'pickedBag') { sound.play('pickup'); note(tf('dPickedBag', ITEM_NAMES[d.item ?? ''] ?? d.item ?? ''), 2500); return; }
    if (d.code === 'filled') { sound.play('drink'); note(tf('dFilled', d.item ?? ''), 2500); return; }
    if (d.code === 'drankBottle') { sound.play('drink'); note(t('dDrankBottle'), 2000); return; }
    if (d.code === 'bottlesFull') { sound.play('ui_error'); note(t('dBottlesFull'), 2200); return; }
    if (d.code === 'notRiding') { sound.play('ui_error'); note(t('rideNotRiding'), 3000); if (autoRide) stopAutoRide(); return; }
  }
  if (d.a === 'map') { if (d.ok) mapScreen.set(d as unknown as MapData); return; }
  if (d.a === 'mark') {
    const dm = d as typeof d & { marks?: MapMark[]; id?: number };
    if (dm.marks) mapScreen.setMarks(dm.marks);
    const added = dm.marks?.find((m) => m.id === dm.id);
    const msg: Record<string, string> = { marked: tf('marked', added ? markName(added.kind) : ''), unmarked: t('unmarked'), renamed: t('renamed'), markFull: t('markFull'), markBad: t('markBad') };
    if (msg[d.code]) { sound.play(d.ok ? 'ui_ok' : 'ui_error'); note(msg[d.code]!, 2500); }
    if (menu.open && MAP_PAGES.has(menu.page)) menu.refresh();
    return;
  }
  if (d.a === 'destroy') {
    const dd = d as typeof d & { tx?: number; ty?: number; check?: boolean; cells?: number[]; owner?: string };
    if (dd.check) { if (placing?.what === 'destroy') { destroyInfo = { tx: dd.tx ?? -1, ty: dd.ty ?? -1, code: d.code, cells: dd.cells ?? [], owner: dd.owner ?? '' }; placeNote(); } return; }
    if (d.ok) { stopPlacing(); sound.play('ui_ok'); note(t('dsDone'), 2500); return; }
    if (placing) { placing.sent = false; destroyInfo = null; askDestroy(); }
    sound.play('ui_error');
    note(d.code === 'notYours' ? tf('dsNotYours', '?') : d.code === 'unknown' ? t('dsUnknown') : t(PLACE_CODE[d.code] ?? 'dsNothing'), 3000);
    if (placing) setTimeout(placeNote, 3000);
    return;
  }
  if (d.a === 'build' && placing) { // the aimed build's answer: done = close the model, else say why and keep aiming
    if (d.ok) stopPlacing();
    else { placing.sent = false; setTimeout(placeNote, 3200); }
  }
  if (d.a === 'build') {
    const why: Record<string, Key> = { tooFar: 'dTooFar', someone: 'dSomeone', doorBlocked: 'dDoorBlocked' };
    if (why[d.code]) { sound.play('ui_error'); note(t(why[d.code]!), 3000); return; }
    if (d.code === 'needHut') { sound.play('ui_error'); note(tf('needHut2', needText(HUT_NEED)), 3500); return; }
  }
  if (d.a === 'shoot') { sound.play('bow_shot'); if (d.ok) setTimeout(() => sound.play('arrow_hit'), 110); }
  else if (DID_SOUND[d.code]) sound.play(DID_SOUND[d.code]!, undefined, undefined, d.code === 'zKilled' ? 0.9 : 1);
  if (d.code === 'chopped' && (d as { got?: Record<string, number> }).got?.wood && Math.random() < 0.25) sound.play('tree_fall', undefined, undefined, 0.6);
  const dm = d as typeof d & { me?: MeChar; days?: number; why?: string; what?: string; on?: boolean; dmg?: number };
  if (dm.me) {
    meChar = dm.me;
    if (menu.open && (menu.page === 'me' || menu.page === 'rules' || menu.page === 'look' || menu.page === 'family')) menu.refresh();
    // First time in the world: choose woman / man and a skin tone.
    if (!meChar.chose && how === 'play' && mode === 'world' && !menu.open) { lookDraft.sex = meChar.sex; lookDraft.skin = meChar.skin; openMenu('look'); }
  }
  if (d.code === 'mine') return;
  const charCodes: Record<string, Key> = { doorLocked: 'doorLocked', doorSomeone: 'doorSomeone', looked: 'looked', sexPregnant: 'sexPregnant', autoOn: 'autoOn', autoOff: 'autoOff', ruleAdded: 'ruleAdded', ruleRemoved: 'ruleRemoved',
    rulesFull: 'rulesFull', built: 'built', needHut: 'needHut', expecting: 'expecting', tooFar: 'tooFar',
    kinSet: 'kinSet', kinRefused: 'kinRefused', kinDropped: 'kinDropped', kinAlready: 'kinAlready', kinOnlyPlayers: 'kinOnlyPlayers',
    kidFed: 'kidFed', kidWater: 'kidWater', kidUp: 'kidUp', kidDown: 'kidDown', kidBed: 'kidBed', kidNone: 'kidNone', kidNotMine: 'kidNotMine', kidFar: 'kidFar' };
  if (d.code === 'doorOpened' || d.code === 'doorClosed') { iaAt = 0; return; }
  if (charCodes[d.code]) { note(t(charCodes[d.code]!), 3000); if (d.code === 'looked' && menu.page === 'look') menu.back(); return; }
  if (d.code === 'sexWeek') { note(tf('sexWeek', String(dm.days ?? 7)), 3500); return; }
  if (d.code === 'partners') { note(tf('partners', d.name ?? ''), 4000); return; }
  if (d.code === 'kinAsked' || d.code === 'kinYes' || d.code === 'kinNo') { note(tf(d.code, d.name ?? ''), 4000); return; }
  if (d.code === 'kinAskedYou') { note(tf('kinAskedYou', d.name ?? '', t(('role' + String((d as { role?: string }).role ?? 'child')) as Key)), 7000); send({ t: Msg.Do, a: 'mine' }); return; }
  if (d.code === 'married' || d.code === 'divorced') { note(tf(d.code, d.name ?? ''), 6000); if (menu.open && menu.page === 'me') send({ t: Msg.Do, a: 'mine' }); return; }
  if (d.code === 'asking') { note(tf(dm.what === 'divorce' ? 'askingDivorce' : 'askingMarry', d.name ?? ''), 4000); return; }
  if (d.code === 'why') { note(dm.why ?? '', 4000); return; }
  if (d.code === 'replays') { past = d.list as never; if (menu.page === 'past') menu.refresh(); return; }
  if (d.code === 'replay') { startReplay(d.rec as ReplayRec); return; }
  if (d.code === 'noReplay') { note(t('pastNone'), 2500); return; }
  if (d.code === 'roster') { roster = d.list ?? []; if (menu.page === 'goto') menu.refresh(); return; }
  if (d.code === 'bedSleep') { predX = d.x ?? predX; predY = d.y ?? predY; sound.play('drop'); note(t('dBedSleep'), 3500); return; } // onto the bed: the lying-down animation does the rest
  if (d.code === 'tp') { predX = camX = d.x ?? predX; predY = camY = d.y ?? predY; snapCam = true; sendView(); if (d.name) note(tf('dTp', d.name), 3000); return; }
  const dd = d as typeof d & { got?: Record<string, number>; left?: number; need?: Record<string, number>; kept?: boolean; lv?: number; q?: number };
  const arrows = dd.left !== undefined ? ' ' + tf('arrowsLeft', String(dd.left)) : '';
  { // horses
    const hd = d as typeof d & { chance?: number; trust?: number };
    const HC: Record<string, Key> = { mounted: 'hMounted', dismounted: 'hDismounted', called: 'hCalled', noHorse: 'hNoHorse', notMine: 'hNotMine', taken: 'hTaken', tooYoung: 'hYoung', notWild: 'hNotMine' };
    if (d.code === 'tamed') { note(tf('hTamed', d.name ?? ''), 6000); sound.play('ui_ok'); return; }
    if (d.code === 'tameFail' || d.code === 'kicked') { note(tf(d.code === 'kicked' ? 'hKicked' : 'hFail', d.name ?? '', String(hd.trust ?? 0)), 3500); if (d.code === 'kicked') sound.play('hurt'); return; }
    const hx = d as typeof d & { dist?: number; map?: string };
    if (d.code === 'walkOver') { note(tf('hWalkOver', d.name ?? '', String(hx.dist ?? '')), 3500); return; }
    if (d.code === 'otherMap') { note(tf('hOtherMap', d.name ?? '', mapName(hx.map ?? '')), 3500); return; }
    if (d.code === 'came') { note(tf('hCame', d.name ?? ''), 3500); sound.play('ui_ok'); return; }
    if ((d.a === 'horse' || d.a === 'take' || d.a === 'use') && HC[d.code]) { note(tf(HC[d.code]!, d.name ?? ''), d.code === 'mounted' ? 4500 : 2500); return; }
  }
  if (d.code === 'zHit' || d.code === 'zKilled') { note(t(d.code) + arrows, 1800); return; }
  if (d.code === 'swing') { note(t('dSwing'), 1200); return; }
  if (d.code === 'pvp') { note(t(dm.on ? 'pvpNoteOn' : 'pvpNoteOff'), 4000); return; }
  if (d.code === 'pvpOff') { note(t('pvpNeed'), 3000); return; }
  if (d.code === 'theirPvpOff') { note(t('theirPvpOff'), 2500); return; }
  if (d.code === 'pHit') { note(tf('pHit', String(dm.dmg ?? 0)), 1500); return; }
  if (d.code === 'noBow' || d.code === 'noArrows') { note(t(d.code), 3500); return; }
  if (d.code === 'missed') { note(tf('missed', String(dd.left ?? 0)), 1800); return; }
  if (d.code === 'buildNeed') { note(tf('buildNeed', needText(dd.need ?? {})), 3500); return; }
  if (dd.kept) { note(t('bKept'), 3500); return; }
  if (d.code === 'aHit') { note(tf('aHit', thing(d.item ?? '')) + arrows, 1500); return; }
  if (d.code === 'aKilled') { note(tf('aKilled', thing(d.item ?? ''), gotText(dd.got)), 3500); return; }
  if (d.code === 'mined' && !Object.keys(dd.got ?? {}).length) { note(t('dHard'), 1200); return; }
  if (d.code === 'chopped' || d.code === 'mined' || d.code === 'herbs') { note(tf('dGot', gotText(dd.got)), 1500); return; }
  if (d.code === 'healed') { note(tf('dHealed', String((dd as { hp?: number }).hp ?? '')), 2500); bagScreen.fix(); menu.refresh(); return; }
  if (d.code === 'noMedkit' || d.code === 'fullHp') { note(t(d.code === 'noMedkit' ? 'dNoMedkit' : 'dFullHp'), 2500); return; }
  if (d.code === 'equipped') { note(t('dEquipped'), 1500); return; }
  if (d.code === 'upgraded') { note(tf('dUpgraded', cap1(thing(dd.item ?? '')), `+${dd.lv ?? 0} ${t(('qual' + (dd.q ?? 0)) as Key)}`), 3000); return; }
  if (d.code === 'upNeed') { note(tf('dUpNeed', needText(dd.need ?? {})), 3500); return; }
  if (d.code === 'needLevel') { note(tf('dNeedLevel', String(dd.need?.level ?? '')), 3000); return; }
  if (d.code === 'maxLevel' || d.code === 'maxQuality' || d.code === 'notCarried') { note(t(d.code === 'maxLevel' ? 'dMaxLevel' : d.code === 'maxQuality' ? 'dMaxQuality' : 'dNotCarried'), 2500); return; }
  if (d.code === 'crafted') { invScreen.clear(); for (const k of Object.keys(pot)) delete pot[k]; note(tf('dCrafted', thing(d.item ?? '')), 2500); menu.refresh(); return; }
  if (d.code === 'placed') { note(tf('dPlaced', thing(d.item ?? '')), 2500); return; }
  const more: Record<string, Key> = { noRecipe: 'dNoRecipe', noMat: 'dNoMat', noRoom: 'dNoRoom', noItem: 'dNoItem', tooThick: 'dTooThick', hutLimit: 'dHutLimit' };
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
        + `<div class="pa">${meNeeds.asleep ? actName(5) : ''}${meNeeds.carry ? (meNeeds.asleep ? ' · ' : '') + tf('carry', String(meNeeds.carry + (meNeeds.inv?.food ?? 0))) : ''}</div>`
        + (meNeeds.cold && (meNeeds.cold.drain > 0 || meNeeds.cold.t < 5) ? `<div class="pa ${meNeeds.cold.drain > 0 ? 'cold' : ''}">${meNeeds.cold.drain > 0 ? '❄' : meNeeds.cold.fire ? '🔥' : '🌡'} ${Math.round(meNeeds.cold.t)} °C${meNeeds.cold.drain > 0 ? ` · −${meNeeds.cold.drain < 10 ? meNeeds.cold.drain.toFixed(1) : Math.round(meNeeds.cold.drain)} ${t('nHp')}/h` : ''}</div>` : '')
        + (meNeeds.ride ? `<div class="pa">🐎 ${esc(tf('hRide', meNeeds.ride.name, String(meNeeds.ride.sta)))}</div>` : (() => {
          const hs = horseNear(5), hi = hs >= 0 ? horseInfo.get(eid[hs]!) : undefined;
          return hi ? `<div class="pa">🐎 ${esc(tf('hNear', hi[5], t((['qCommon', 'qRare', 'qLegendary'] as const)[hi[1]] ?? 'qCommon'), t(hi[4] ? 'hYours' : hi[3] ? 'hOwned' : 'hWild')))}</div>` : '';
        })());
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
  { const qp = quests.page(id); if (qp) return qp; } // quests, NPC talk, clan (questui.ts)
  const rows: Row[] = [];
  switch (id) {
    case 'map': return { id, title: t('mMap'), rows, big: true, html: mapScreen.html(), grid: mapScreen };
    case 'box': { // my fridge / chest: take one, put one, put all
      const b = boxView;
      if (!b) return { id, title: t('boxFridge'), rows: [{ id: 'back', label: t('mBack') }] };
      const inside = Object.entries(b.inv).filter(([, n]) => n > 0).sort((x, y) => y[1] - x[1]);
      const fits = Object.entries(b.bag).filter(([k, n]) => n > 0 && boxHolds(b.kind, k));
      rows.push({ id: 'h:in', label: `— ${t('boxInside')} —`, dim: true });
      if (!inside.length) rows.push({ id: 'h:empty', label: t('boxEmpty'), dim: true });
      for (const [k, n] of inside) rows.push({ id: 'take:' + k, label: tf('boxTake', cap1(thing(k))), value: `${n} / ${b.cap}` });
      rows.push({ id: 'h:bag', label: `— ${t('boxBag')} —`, dim: true });
      if (!fits.length) rows.push({ id: 'h:none', label: t('boxNothing'), dim: true });
      for (const [k, n] of fits) {
        rows.push({ id: 'put:' + k, label: tf('boxPut', cap1(thing(k))), value: `× ${n}` });
        if (n > 1) rows.push({ id: 'all:' + k, label: tf('boxPutAll', thing(k)), value: `× ${n}` });
      }
      rows.push({ id: 'back', label: t('mBack') });
      return { id, title: `${b.kind === 'fridge' ? '🧊' : '🧰'} ${t(b.kind === 'fridge' ? 'boxFridge' : 'boxChest')}`, rows, wide: true, text: tf(b.kind === 'fridge' ? 'boxHelpFridge' : 'boxHelpChest', String(b.cap)) };
    }
    case 'markNew': {
      if (meNeeds?.ride && mapScreen.markAt().map === map) rows.push({ id: 'ride', label: `🐎 ${t('mapRide')}` }); // only on horseback, on my map (imad 2026-11-26)
      for (const k of MARK_KINDS) rows.push({ id: 'k:' + k, label: markName(k) });
      const at = mapScreen.markAt();
      return { id, title: t('markNew'), rows, text: `${t('markHelp')} (${Math.round(at.x)}, ${Math.round(at.y)})` };
    }
    case 'markEdit': {
      const m = markSel;
      if (!m) return { id, title: t('markEdit'), rows: [{ id: 'back', label: t('mBack') }] };
      if (meNeeds?.ride) rows.push({ id: 'ride', label: `🐎 ${t('mapRide')}` });
      rows.push({ id: 'name', label: t('markName'), value: m.label || '—' }, { id: 'icon', label: t('markIcon'), value: markName(m.kind), sub: true }, { id: 'del', label: t('markRemove') }, { id: 'back', label: t('mBack') });
      return { id, title: `${MARK_ICON[m.kind]} ${m.label || t(MARK_KEY[m.kind])}`, rows, text: `${Math.round(m.x)}, ${Math.round(m.y)}` };
    }
    case 'markIcon':
      for (const k of MARK_KINDS) rows.push({ id: 'k:' + k, label: markName(k), value: markSel?.kind === k ? '✓' : undefined });
      return { id, title: t('markIcon'), rows };
    case 'wheelset': {
      wheelIds.forEach((w, n) => rows.push({ id: 'w:' + w, label: `${WHEEL_ICON[w] ?? ''} ${wheelLabel(w)}`, value: tf('wOn', String(n + 1)) }));
      for (const w of WHEEL_ALL) if (!wheelIds.includes(w)) rows.push({ id: 'w:' + w, label: `${WHEEL_ICON[w] ?? ''} ${wheelLabel(w)}`, value: t('wOff'), dim: true });
      rows.push({ id: 'reset', label: t('wReset') });
      return { id, title: t('sWheel'), rows, wide: true, text: t('wheelSetHelp') };
    }
    case 'wheelitem': {
      const n = wheelIds.indexOf(wheelEdit);
      if (n >= 0) rows.push({ id: 'up', label: t('wEarlier'), dim: n === 0 }, { id: 'down', label: t('wLater'), dim: n === wheelIds.length - 1 }, { id: 'off', label: t('wRemove') });
      else rows.push({ id: 'on', label: t('wAdd') });
      rows.push({ id: 'back', label: t('mBack') });
      return { id, title: `${WHEEL_ICON[wheelEdit] ?? ''} ${wheelLabel(wheelEdit)}`, rows, text: n >= 0 ? tf('wOn', String(n + 1)) : t('wOff') };
    }
    case 'inv': return { id, title: t('invTitle'), rows, big: true, html: invScreen.html(), grid: invScreen };
    case 'gear': return { id, title: t('gearTitle'), rows, big: true, html: gearScreen.html(), grid: gearScreen };
    case 'root': {
      rows.push({ id: 'resume', label: t('mResume') });
      if (how === 'play') rows.push({ id: 'me', label: t('mMe'), sub: true }, { id: 'actions', label: t('mActions'), sub: true }, { id: 'build', label: t('bTitle'), sub: true }, { id: 'bag', label: t('bagTitle'), sub: true }, { id: 'inv', label: t('invTitle'), sub: true }, { id: 'gear', label: t('mGear'), sub: true }, { id: 'fight', label: t('mFight'), sub: true }, { id: 'goto', label: t('mGoTo'), sub: true }, ...quests.rootRows());
      if (personTarget() >= 0) rows.push({ id: 'person', label: how === 'play' ? t('mNearby') : t('mPerson'), sub: true });
      if (how === 'watch') rows.push(...(meId >= 0 ? [{ id: 'mine', label: t('mFollowMe') }] : []), { id: 'next', label: t('mNextPerson') }, { id: 'map', label: t('mNextMap') });
      rows.push({ id: 'worldmap', label: t('mMap') });
      rows.push({ id: 'past', label: t('mPast'), sub: true });
      rows.push({ id: 'how', label: t(how === 'play' ? 'mWatch' : 'mPlay') });
      rows.push({ id: 'settings', label: t('mSettings'), sub: true }, { id: 'controls', label: t('mControls'), sub: true });
      return { id, title: t('mTitle'), rows };
    }
    case 'build': {
      const inv = meNeeds?.inv ?? {};
      const hutOk = Object.entries(HUT_NEED).every(([k, n]) => (inv[k] ?? 0) >= n);
      rows.push({ id: 'b:hut', label: tf('bHut2', needText(HUT_NEED)), value: hutOk ? t('cHave') : t('bMissing'), dim: !hutOk });
      for (const p of PLACEABLE) {
        const r = RECIPES_ALL.find((q) => q.what === p);
        const have = inv[p] ?? 0, can = !!r && Object.entries(r.need).every(([k, n]) => (inv[k] ?? 0) >= n!);
        rows.push({ id: 'b:' + p, label: `${cap1(thing(p))}${r ? ' (' + needText(r.need) + ')' : ''}`, value: have ? tf('bInBag', String(have)) : can ? t('cHave') : t('bMissing'), dim: !have && !can });
      }
      rows.push({ id: 'b:destroy', label: t('bDestroy'), value: t('bDestroyV') });
      const bag = RESOURCES.filter((k) => (inv[k] ?? 0) > 0).map((k) => `${inv[k]} ${thing(k)}`).join(', ');
      return { id, title: t('bTitle'), rows, wide: true, html: `<p>${esc(t('bHelp2'))}</p>${bag ? `<p class="dim">${esc(t('fHave'))}: ${esc(bag)}</p>` : ''}` };
    }
    case 'fight': {
      const rec = (w: string) => { const r = RECIPES_ALL.find((q) => q.what === w); return r ? needText(r.need) : '—'; };
      const inv = meNeeds?.inv ?? {};
      const lines = [t('fightHelp'), tf('fFists', '15')];
      for (const [w, dmg] of Object.entries(WEAPONS)) lines.push(tf('fWeapon', cap1(thing(w)), String(dmg), rec(w)));
      lines.push(tf('fBow', rec('bow'), rec('arrows')), t('fArmour'), t('fTips'), t('pvpHelp'));
      const keys = `${actionLabel('attack')}: <b>${esc(keyName('attack') || t('cNone'))}</b> · ${esc(actionLabel('aim'))}: <b>${esc(keyName('aim') || t('cNone'))}</b>`;
      const have = ['sword', 'spear', 'axe', 'bow', 'arrows', 'clothes', 'armor', 'helmet'].filter((k) => (inv[k] ?? 0) > 0).map((k) => `${inv[k]} ${thing(k)}`).join(', ');
      rows.push({ id: 'pvp', label: t('mPvp'), value: t(meNeeds?.pvp ? 'pvpOnW' : 'pvpOffW') }, { id: 'craft', label: t('mCraft'), sub: true }, { id: 'back', label: t('mBack') });
      return { id, title: t('mFight'), rows, wide: true, html: `<p>${keys}</p>${lines.map((l) => `<p>${esc(l)}</p>`).join('')}${have ? `<p class="dim">${esc(t('fHave'))}: ${esc(have)}</p>` : ''}` };
    }
    case 'actions':
      for (const a of ['use', 'horse', 'talk', 'attack', 'attackPerson', 'drink', 'eat', 'pickup', 'sleep'] as const) rows.push({ id: a, label: actionLabel(a) });
      return { id, title: t('mActions'), rows, html: meNeeds ? `<div class="pbars">${bar(t('nFood'), meNeeds.hunger)}${bar(t('nWater'), meNeeds.thirst)}${bar(t('nRest'), meNeeds.tired)}</div>` : undefined };
    case 'past':
      for (const r of past ?? []) {
        rows.push({ id: 'r' + r.id, label: `${gameTime(r.start, t('day'))} · ${r.people.join(', ') || '—'}`,
          value: `${r.zombies} ${t('pastZ')} · ${r.secs} s${r.deaths.length ? ' · ✝ ' + r.deaths.join(', ') : r.killed ? ' · ' + tf('pastKilled', String(r.killed)) : ''}` });
      }
      if (past && !past.length) rows.push({ id: 'back', label: t('mBack') });
      return { id, title: t('mPast'), rows, wide: true, text: !past ? '…' : past.length ? t('pastHelp') : t('pastNone') };
    case 'bag': return { id, title: t('bagTitle'), rows, big: true, html: bagScreen.html(), grid: bagScreen }; // the big bag (imad 2026-11-25)
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
        + (c.influence !== undefined ? `<div class="pm">${tf('pInf', String(c.influence))}</div><div class="bp"><i style="width:${Math.max(2, c.influence)}%"></i></div>${(c.influenceLog ?? []).filter((x) => x.d > 0).length ? `<div class="pm dim">${esc(tf('pInfWhy', [...new Set((c.influenceLog ?? []).filter((x) => x.d > 0).map((x) => x.why))].slice(0, 3).join(', ')))}</div>` : ''}` : '')
        + (c.goal ? `<div class="pm">${t('pGoal')}: <b>${esc(c.goal.text)}</b> · ${Math.min(c.goal.k + 1, c.goal.n)}/${c.goal.n}</div><div class="bp${c.goal.from !== 'myself' ? ' ord' : ''}"><i style="width:${Math.max(6, c.goal.pct)}%"></i></div>` : '')
        + `<div class="pm">${t('mePartner')}: <b>${esc(c.partner?.name ?? t('meNone'))}</b></div>`
        + `<div class="pm">${t('meChildren')}: <b>${c.children.length ? c.children.map((k) => `${esc(k.name)} (${k.age})`).join(', ') : esc(t('meNone'))}</b></div>`
        + (c.expecting >= 0 ? `<div class="pm">${esc(tf('meExpecting', String(c.expecting)))}${c.expectingPct >= 0 ? ` <b>${c.expectingPct} %</b><div class="pbar"><i style="width:${Math.max(2, c.expectingPct)}%"></i></div>` : ''}</div>` : '')
        + `<div class="pm dim">${esc(tf('meTraits', String(tr.strength ?? 0), String(tr.speed ?? 0), String(tr.intelligence ?? 0), String(tr.courage ?? 0), String(tr.empathy ?? 0)))}</div>`
        + `<div class="pm">${esc(tf('meTame', String(c.tame ?? 0), String(c.tamePower ?? 0)))}</div>`
        + (c.horses?.length ? `<div class="pm">${t('meHorses')}: ${c.horses.map((h) => esc(tf('meHorse', h.name, t(h.quality === 'legendary' ? 'qLegendary' : h.quality === 'rare' ? 'qRare' : 'qCommon'), String(h.speed), String(h.stamina), String(h.intel)))).join('<br>')}</div>` : '')
        + (c.goals.length ? `<div class="pm dim">${t('meGoals')}: ${c.goals.map((g) => `${g.ok ? '✓' : '✗'} ${esc(g.text)} (+${g.xp})`).join(' · ')}</div>` : '');
      rows.push({ id: 'family', label: t('famTitle'), value: c.asks?.length ? `${c.asks.length} !` : c.children.some((k) => k.stage === 'baby' || k.stage === 'toddler') ? '♥' : '', sub: true });
      rows.push({ id: 'look', label: t('lookTitle'), sub: true }, { id: 'auto', label: t('autoRow'), value: onOff(c.auto) },
        { id: 'rules', label: t('myRules'), value: `${c.rules.length} / ${c.max}`, sub: true }, { id: 'hut', label: tf('meHut2', needText(HUT_NEED)) });
      return { id, title: t('meTitle'), rows, html, wide: true };
    }
    case 'family': { // imad 2026-11-25: parents see their little ones' needs and look after them; family chosen between players
      const c = meChar;
      if (!c) return { id, title: t('famTitle'), rows: [{ id: 'back', label: t('mBack') }], text: '…' };
      const pc = (v: number) => String(Math.max(0, 100 - Math.round(v)));
      let html = '';
      for (const a of c.asks ?? []) rows.push({ id: `ay:${a.from}`, label: tf('famAskFrom', a.name, t(('role' + a.role) as Key)), value: t('famYes') }, { id: `an:${a.from}`, label: '   ' + t('famNo'), value: '✕' });
      for (const k of c.children) {
        const little = k.stage === 'baby' || k.stage === 'toddler';
        html += `<div class="pm"><b>${esc(k.name)}</b> · ${esc(t(STAGE_KEY[k.stage] ?? 'stChild'))} (${Math.floor(k.age)})${k.carer ? ' · ' + esc(tf('famLooked', k.carer)) : ''}</div>`
          + `<div class="pm dim">${esc(tf('famNeeds', pc(k.hunger), pc(k.thirst), pc(k.tired)))}${little && !k.near ? ' · ' + esc(t('famFar')) : ''}</div>`
          + `<div class="bp"><i style="width:${Math.max(4, 100 - Math.max(k.hunger, k.thirst))}%"></i></div>`;
        if (little) rows.push({ id: `kf:${k.id}`, label: tf('famFeed', k.name), dim: !k.near }, { id: `kw:${k.id}`, label: tf('famWater', k.name), dim: !k.near },
          { id: `kc:${k.id}`, label: tf(k.held ? 'famDown' : 'famCarry', k.name), dim: !k.near && !k.held }, { id: `kb:${k.id}`, label: tf('famBed', k.name), dim: !k.near });
      }
      if (!c.children.length) html += `<p>${esc(t('famNone'))}</p>`;
      if (c.family?.length) {
        html += `<div class="pm">${esc(t('famChosen'))}: ${c.family.map((f) => `<b>${esc(f.name)}</b> (${esc(f.rel || t(('role' + f.role) as Key))})`).join(', ')}</div>`;
        for (const f of c.family) rows.push({ id: `kd:${f.id}`, label: tf('famDrop', f.rel || t(('role' + f.role) as Key)) + ` · ${f.name}`, value: '✕' });
      }
      if (!rows.length) rows.push({ id: 'back', label: t('mBack') });
      return { id, title: t('famTitle'), rows, html, wide: true, text: t('famHelp') };
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
        if (meChar?.partner?.id === info.id) rows.push({ id: 'child', label: t('tryChild') }, { id: 'divorce', label: t('askDivorce') });
        else if (!meChar?.partner) rows.push({ id: 'court', label: t('askPartner') }, { id: 'marry', label: t('askMarry') });
        if (info.isPlayer && meChar?.partner?.id !== info.id && !meChar?.family?.some((f) => f.id === info!.id)) rows.push({ id: 'kin:child', label: t('askChild') }, { id: 'kin:sibling', label: t('askSibling') }, { id: 'kin:parent', label: t('askParent') });
      }
      if (how === 'watch') rows.push({ id: 'next', label: t('mNextPerson') });
      return { id, title: info?.name ?? t('mPerson'), rows, wide: true, html: info && info.id === infoFor ? personHtml(info, actName, true) : '…' };
    }
    case 'settings':
      if (seer) rows.push({ id: 'thoughts', label: t('sThoughts'), value: onOff(thoughtsOn) });
      if (how === 'play') rows.push({ id: 'cam', label: t('sCamera'), value: camName(camView) });
      rows.push({ id: 'names', label: t('sNames'), value: onOff(namesOn) }, { id: 'cues', label: t('sCues'), value: onOff(cuesOn) }, { id: 'compass', label: t('sCompass'), value: onOff(compassOn) }, { id: 'rainsnow', label: t('sWeather'), value: onOff(g3?.rainSnow ?? true) });
      rows.push({ id: 'uisize', label: t('sUiSize'), value: `${Math.round(uiSize * 100)} %` }, { id: 'wheel', label: t('sWheel'), sub: true }, { id: 'gfx', label: t('gTitle'), sub: true }, { id: 'snd', label: t('sndTitle'), sub: true });
      rows.push({ id: 'zin', label: t('aZoomIn') }, { id: 'zout', label: t('aZoomOut') }, { id: 'server', label: t('sServer'), value: server }, { id: 'unpair', label: t('sUnpair') });
      return { id, title: t('mSettings'), rows, text: seer ? undefined : t('sThoughtsOnly') };
    case 'snd': {
      const pc = (v: number) => `${Math.round(v * 100)} %`, sp = sound.prefs;
      rows.push({ id: 'on', label: t('sndOn'), value: onOff(sp.on) }, { id: 'master', label: t('sndMaster'), value: pc(sp.master), dim: !sp.on },
        { id: 'fx', label: t('sndFx'), value: pc(sp.fx), dim: !sp.on }, { id: 'amb', label: t('sndAmb'), value: pc(sp.amb), dim: !sp.on }, { id: 'ui', label: t('sndUi'), value: pc(sp.ui), dim: !sp.on });
      return { id, title: t('sndTitle'), rows, text: t('sndHelp') };
    }
    case 'gfx':
      rows.push({ id: 'q', label: t('gQuality'), value: t(gfx.q === 'auto' ? 'gAuto' : gfx.q === 'low' ? 'gLow' : gfx.q === 'mid' ? 'gMid' : 'gHigh') + (gfx.q !== 'auto' && gfx.q !== tier ? ' *' : '') },
        { id: 'fog', label: t('gFog'), value: t((['gOff', 'gLight', 'gNormal', 'gThick'] as const)[gfx.fog] ?? 'gNormal') },
        { id: 'dist', label: t('gDist'), value: t((['gNear', 'gNormal', 'gFar'] as const)[gfx.dist] ?? 'gNormal') },
        { id: 'res', label: t('gRes'), value: t(gfx.res ? 'gResAuto' : 'gResFull') },
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
  if (quests.pick(page, row, () => menu.back())) return;
  if (page === 'root') {
    if (row === 'resume') menu.close();
    else if (row === 'actions' || row === 'settings' || row === 'controls') menu.push(row);
    else if (row === 'past') { past = null; send({ t: Msg.Do, a: 'replays' }); menu.push('past'); }
    else if (row === 'bag' || row === 'build' || row === 'fight' || row === 'inv' || row === 'gear') menu.push(row);
    else if (row === 'me') { send({ t: Msg.Do, a: 'mine' }); menu.push('me'); }
    else if (row === 'goto') { roster = null; send({ t: Msg.Do, a: 'roster' }); menu.push('goto'); }
    else if (row === 'person') { askInfo(personTarget(), true); menu.push('person'); }
    else if (row === 'mine') { menu.close(); followMe(); }
    else if (row === 'next') { menu.close(); followNext(); }
    else if (row === 'map') { menu.close(); nextMap(); }
    else if (row === 'how') { menu.close(); setHow(how === 'play' ? 'watch' : 'play'); }
    else if (row === 'worldmap') { menu.close(); openMap(); }
  } else if (page === 'box') {
    const b = boxView;
    if (row === 'back' || !b) { menu.back(); return; }
    const m = /^(take|put|all):(\w+)$/.exec(row);
    if (!m) return;
    const n = m[1] === 'all' ? b.bag[m[2]!] ?? 1 : 1;
    send({ t: Msg.Do, a: 'box', text: `${m[1] === 'take' ? 'take' : 'put'}:${b.at[0]},${b.at[1]}:${m[2]}:${n}` });
  } else if (page === 'markNew') {
    const at = mapScreen.markAt();
    if (row === 'ride') { menu.close(); startAutoRide(`pt:${at.map}:${at.x}:${at.y}`, `${Math.round(at.x)}, ${Math.round(at.y)}`); return; }
    if (row.startsWith('k:')) { send({ t: Msg.Do, a: 'mark', text: `add:${at.map}:${at.x}:${at.y}:${row.slice(2)}` }); menu.back(); }
  } else if (page === 'markEdit') {
    const m = markSel;
    if (row === 'back' || !m) menu.back();
    else if (row === 'ride') { menu.close(); startAutoRide('mark:' + m.id, m.label || t(MARK_KEY[m.kind])); }
    else if (row === 'icon') menu.push('markIcon');
    else if (row === 'del') { send({ t: Msg.Do, a: 'mark', text: `del:${m.id}` }); menu.back(); }
    else if (row === 'name') {
      if (!MyPC.text?.keyboard) return;
      void (MyPC.text.keyboard({ value: m.label, kind: 'text', label: t('markLabel'), ok: 'OK' }) as Promise<string | null>)
        .then((v) => { if (v !== null && v !== undefined) { m.label = v.trim().slice(0, 40); send({ t: Msg.Do, a: 'mark', text: `name:${m.id}:${m.label}` }); menu.refresh(); } });
    }
  } else if (page === 'markIcon') {
    if (markSel && row.startsWith('k:')) { markSel.kind = row.slice(2) as MarkKind; send({ t: Msg.Do, a: 'mark', text: `kind:${markSel.id}:${markSel.kind}` }); menu.back(); }
  } else if (page === 'wheelset') {
    if (row === 'reset') { wheelIds = [...WHEEL_DEFAULT]; saveWheel(); menu.refresh(); }
    else { wheelEdit = row.slice(2); menu.push('wheelitem'); }
  } else if (page === 'wheelitem') {
    const n = wheelIds.indexOf(wheelEdit);
    if (row === 'back') { menu.back(); return; }
    if (row === 'up' && n > 0) { [wheelIds[n - 1], wheelIds[n]] = [wheelIds[n]!, wheelIds[n - 1]!]; }
    else if (row === 'down' && n >= 0 && n < wheelIds.length - 1) { [wheelIds[n + 1], wheelIds[n]] = [wheelIds[n]!, wheelIds[n + 1]!]; }
    else if (row === 'off') { if (wheelIds.length <= 2) { note(t('wMin'), 2500); return; } wheelIds.splice(n, 1); saveWheel(); menu.back(); return; }
    else if (row === 'on') { if (wheelIds.length >= WHEEL_MAX) { note(t('wMax'), 2500); return; } wheelIds.push(wheelEdit); saveWheel(); menu.back(); return; }
    saveWheel(); menu.refresh();
  } else if (page === 'actions') { menu.close(); doAction(row as ActionId, true); }
  else if (page === 'build') startPlacing(row.slice(2));
  else if (page === 'fight') { if (row === 'back') menu.back(); else if (row === 'craft') menu.push('inv'); else if (row === 'pvp') { send({ t: Msg.Do, a: 'pvp', text: meNeeds?.pvp ? '0' : '1' }); } }
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
    else if (row === 'family') { send({ t: Msg.Do, a: 'mine' }); menu.push('family'); }
    else if (row === 'hut') startPlacing('hut');
  }
  else if (page === 'family') {
    if (row === 'back') { menu.back(); return; }
    const [k, id] = row.split(':');
    if (k === 'ay' || k === 'an') send({ t: Msg.Do, a: 'kinAnswer', text: `${id}:${k === 'ay' ? 1 : 0}` });
    else if (k === 'kd') send({ t: Msg.Do, a: 'kinDrop', text: id });
    else { const what = ({ kf: 'feed', kw: 'water', kc: 'carry', kb: 'bed' } as Record<string, string>)[k!]; if (what) send({ t: Msg.Do, a: 'care', text: `${what}:${id}` }); }
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
    else if (row === 'marry' || row === 'divorce') { send({ t: Msg.Do, a: row, text: String(info?.id ?? -1) }); menu.close(); }
    else if (row === 'child') send({ t: Msg.Do, a: 'child' });
    else if (row.startsWith('kin:')) send({ t: Msg.Do, a: 'kinAsk', text: `${info?.id ?? -1}:${row.slice(4)}` });
    else if (row === 'next') { followNext(); window.setTimeout(() => { askInfo(follow, true); menu.refresh(); }, 300); }
  } else if (page === 'settings') {
    if (row === 'thoughts') { thoughtsOn = !thoughtsOn; MyPC.save('thoughts', thoughtsOn); if (!thoughtsOn) bubbles.hide(); menu.refresh(); }
    else if (row === 'cam') { nextCamera(); menu.refresh(); }
    else if (row === 'names') { namesOn = !namesOn; MyPC.save('names', namesOn); menu.refresh(); }
    else if (row === 'cues') { cuesOn = !cuesOn; MyPC.save('cues', cuesOn); menu.refresh(); }
    else if (row === 'rainsnow' && g3) { g3.rainSnow = !g3.rainSnow; MyPC.save('rainsnow', g3.rainSnow); menu.refresh(); }
    else if (row === 'compass') { compassOn = !compassOn; MyPC.save('compass', compassOn); compassAt = 0; menu.refresh(); }
    else if (row === 'uisize') { uiSize = UI_SIZES[(UI_SIZES.indexOf(uiSize) + 1) % UI_SIZES.length]!; MyPC.save('uiSize', uiSize); applyUiSize(); menu.refresh(); }
    else if (row === 'gfx' || row === 'snd') menu.push(row);
    else if (row === 'wheel') menu.push('wheelset');
    else if (row === 'zin') zoomBy(1 / 1.2);
    else if (row === 'zout') zoomBy(1.2);
    else if (row === 'server') { menu.close(); void askServer(); }
    else if (row === 'unpair') { menu.close(); unpair(); }
  } else if (page === 'snd') {
    const sp = sound.prefs;
    if (row === 'on') sp.on = !sp.on;
    else if (row === 'master' || row === 'fx' || row === 'amb' || row === 'ui') { const v = Math.round(sp[row] * 10); sp[row] = (v >= 10 ? 0 : v + 1) / 10; }
    sound.apply(); MyPC.save('sound', sp); menu.refresh();
    if (row !== 'on') sound.play(row === 'ui' ? 'ui_ok' : row === 'amb' ? 'bird' : 'hit');
  } else if (page === 'gfx') {
    if (row === 'q') { const o: Gfx['q'][] = ['auto', 'low', 'mid', 'high']; gfx.q = o[(o.indexOf(gfx.q) + 1) % o.length]!; }
    else if (row === 'fog') gfx.fog = (gfx.fog + 1) % 4;
    else if (row === 'dist') gfx.dist = (gfx.dist + 1) % 3;
    else if (row === 'res') { gfx.res = !gfx.res; if (dyn) dyn.scale = dyn.start; resize(); }
    else if (row === 'fps') { gfx.fps = !gfx.fps; fpsN = 0; fpsAt = performance.now(); fpsEl.textContent = ''; }
    else if (row === 'restart') { MyPC.save('gfx', gfx); location.reload(); return; }
    MyPC.save('gfx', gfx); applyGfx(); menu.refresh();
  } else if (page === 'controls') {
    if (row === 'reset') { binds = cloneBinds(DEFAULT_BINDS); MyPC.save('binds', binds); menu.refresh(); updateHints(); return; }
    capture = row as ActionId;
    note(tf('cPress', actionLabel(capture)), 0);
  }
}

/** Bag & crafting, gear (invui.ts). */
const invCtx: InvCtx = {
  inv: () => (meNeeds?.inv ?? {}) as Record<string, number>,
  gear: () => meNeeds?.gear,
  thing: (k) => cap1(thing(k)),
  catName: (c) => catName(c),
  send: (a, text) => send({ t: Msg.Do, a, text }),
  note: (s, ms) => note(s, ms),
  close: () => menu.close(),
  open: (p) => menu.push(p),
  look: () => { const s = meSlot(); return s >= 0 && atype[s]! > 0 ? playerLook(true, atype[s]!) : ME; },
};
const invScreen = new InvScreen(invCtx), gearScreen = new GearScreen(invCtx), bagScreen = new BagScreen(invCtx);
const menu = new Menu(buildPage, pickRow, () => { capture = null; noteEl.hidden = true; drawCard(); MyPC.back?.(false); });
const quests = new QuestUi({
  send: (m) => send(m as never),
  push: (p) => { if (!menu.open) menu.show(p); else menu.push(p); },
  refresh: (p) => { if (menu.open && menu.page === p) menu.refresh(); },
  note: (text, ms) => note(text, ms),
  keyboard: (label, cb) => { if (!MyPC.text?.keyboard) return; void (MyPC.text.keyboard({ value: '', kind: 'text', label, ok: 'OK' }) as Promise<string | null>).then((v) => { if (v) cb(v); }); },
  thing: (k) => thing(k),
});
menu.onSound = (id) => sound.play(id);
/** The TV's map (mapui.ts) and the mark being changed on it. */
const mapScreen = new MapScreen({
  colors: () => {
    const color: number[] = [], solid: boolean[] = [];
    for (const x of welcome?.tiles ?? []) { color[x.id] = x.color; solid[x.id] = x.solid; }
    return { color, solid };
  },
  me: () => (meSlot() >= 0 || playing() ? [focusX(), focusY(), myAng(), map] : [camX, camY, 0, map]),
  send: (a, text) => send({ t: Msg.Do, a, text }),
  push: (page) => { markSel = mapScreen.hovered() ?? null; menu.push(page); },
  remote: () => !pads,
  npcName: (k) => NPCS.find((n) => n.key === k)?.name ?? k,
});
let markSel: MapMark | null = null;
/** The fridge / chest open on the screen (its contents and what my bag holds), from the server's answer. */
let boxView: { kind: 'fridge' | 'chest'; at: number[]; inv: Record<string, number>; bag: Record<string, number>; cap: number } | null = null;
const BOX_CODE: Record<string, string> = { boxFull: 'boxFull', bagFull: 'bagFull', fridgeOnly: 'fridgeOnly', chestNoFood: 'chestNoFood', noBox: 'noBox', notYours: 'notYoursBox' };
const MAP_PAGES = new Set(['map', 'markNew', 'markEdit', 'markIcon']);
function openMap(): void {
  if (mode !== 'world') return;
  if (menu.open && menu.page === 'map') { menu.close(); return; }
  wheel.close(); setAim(false); stopPlacing();
  held.left = held.right = held.up = held.down = false; padHeld.left = padHeld.right = padHeld.up = padHeld.down = false; runHeld = false;
  mapScreen.start();
  menu.show('map');
  MyPC.back?.(true);
}
/** A button on the map: X / 🔴 back to me, Y / 🟢 next map, L R / CH + − zoom. True = used. */
function mapKey(k: 'me' | 'next' | 'in' | 'out' | ''): boolean {
  if (!k || !menu.open || menu.page !== 'map') return false;
  sound.play('ui_move'); mapScreen.key(k);
  return true;
}
const markName = (k: MarkKind) => `${MARK_ICON[k]} ${t(MARK_KEY[k])}`;
const wheelLabel = (id: string) => (id === 'place' ? t('qPlace') : t(WHEEL_KEY[id] ?? 'qUse'));
const bubbles = new Bubbles(8);

function openMenu(page = 'root'): void {
  if (mode !== 'world') return;
  wheel.close(); setAim(false); stopPlacing();
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
  sound.lx = focusX(); sound.ly = focusY(); sound.yaw = yaw; sound.topView = g3.view === 'top';
  sound.tick(dt); ambience(now);
  if (trip && how !== 'play') { trip = null; fade(false, 0); }
  if (trip && trip.phase === 'out' && now - trip.at >= FADE_MS) { // black: switch to the next map now, so its ground loads during the ride
    if (trip.to !== map) setMap(trip.to);
    camX = trip.x; camY = trip.y; snapCam = true; follow = -1; sendView();
    trip.phase = 'ride'; trip.at = now;
  }
  if (trip && trip.phase === 'ride') { // on the road between maps: the ride itself (gfx/ride.ts), on foot or on horseback
    ride ??= new RideScene(g3.horses);
    const gs = gameSec + ((now - tickAt) / 1000) * clockScale * simSpeed, cv = g3.renderer.domElement;
    const p = trip.shownAt ? Math.max(0, Math.min(1, (now - trip.shownAt) / (trip.secs * 1000))) : 0;
    ride.draw(g3.renderer, dt, p, myLook ?? ME, myGear & ~(7 << 15), rideHorse, cv.width / Math.max(1, cv.height), ((gs / 3600 + 8) % 24 + 24) % 24);
    if (!trip.shownAt) { // first frame on screen: the server's clock starts now (a ride resumed after a reconnect keeps what is left)
      trip.shownAt = now - (trip.secs - trip.left) * 1000;
      send({ t: Msg.Do, a: 'rideShown' });
      fade(false);
    } else if (now - trip.shownAt > trip.secs * 1000 - FADE_MS) fade(true); // the end of the road: to black, the new map comes in behind it
    names.hide();
    buildOne(); buildOne(); // the road is cheap to draw: build the next map's chunks faster meanwhile
    bubbles.hide();
    return;
  }
  if (trip && trip.phase === 'in' && ++trip.frames >= 3 && now - trip.at >= 250 && ((!buildQ.length && !jobs.size) || now - trip.at > 1500)) { fade(false); trip = null; } // the ground is in: fade in
  if (bindsNews && playing() && predOk) {
    bindsNews = false;
    const parts = (['use', 'talk', 'attack', 'aim', 'build'] as const).map((a) => `${keyName(a)}: ${actionLabel(a).replace(/ \(.*\)$/, '')}`);
    note(tf('bindsNew', parts.join(' · ')), 9000);
  }
  if (mapNews && playing() && predOk) { mapNews = false; note(t('mapBtnNews'), 7000); }
  const fx = focusX(), fy = focusY();
  g3.view = rp || !playing() || !predOk ? 'top' : camView;
  g3.yaw = yaw;
  g3.follow(fx, fy, dt, snapCam);
  snapCam = false;
  const gs = gameSec + ((now - tickAt) / 1000) * clockScale * simSpeed;
  g3.tickWeather(dt, fx, fy);
  g3.setHour(((gs / 3600 + 8) % 24 + 24) % 24, now / 1000);
  const a = Math.min(1.25, (now - frameAt) / frameGap);
  const P = g3.people, me = playing() && predOk ? meSlot() : -1, tsec = now / 1000;
  const r = g3.view === 'top' ? (g3.dist * 1.6 + 8) * g3.distK : g3.sight + 4, eyes = g3.view === 'first';
  frameNo++;
  P.begin(); g3.peopleFar.begin(); g3.beginShots(); g3.beginItems(); g3.animals.begin(); g3.horses.begin();
  if (rp) { // a past event: only the recorded people and zombies
    rp.draw(P, dt, actName);
    g3.dist += (Math.max(16, Math.min(42, rp.span * 1.1 + 10)) - g3.dist) * Math.min(1, dt * 2);
  P.end(); g3.peopleFar.end(); g3.endShots(); g3.endItems(); g3.animals.end(); g3.horses.end(); g3.render(); bubbles.hide();
    return;
  }
  let handsOn = false;
  for (let i = 0; i < CAP; i++) {
    if (eid[i] === -1) continue;
    let x = px[i]! + (nx[i]! - px[i]!) * a, y = py[i]! + (ny[i]! - py[i]!) * a;
    if (i === me) { x = predX; y = predY; }
    if (Math.abs(x - fx) > r || Math.abs(y - fy) > r) continue;
    if (kind[i] === Kind.Projectile) { g3.shot(x, y, vx[i]!, vy[i]!); continue; }
    if (kind[i] === Kind.Item) { g3.item(x, y, sub[i]!, eid[i]!); continue; }
    if (kind[i] !== Kind.Agent && kind[i] !== Kind.Player && kind[i] !== Kind.Threat && kind[i] !== Kind.Animal && kind[i] !== Kind.Npc) continue;
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
    if ((kind[i] === Kind.Animal || kind[i] === Kind.Threat) && !(flags[i]! & EFlag.Dead)) {
      // Now and then a zombie groans, an animal calls (from where it is: quieter far away, left / right of the camera).
      const k = eid[i]! & 16383;
      if (!nextCry[k]) nextCry[k] = now + 1500 + Math.random() * 6000;
      else if (now > nextCry[k]!) {
        const zed = kind[i] === Kind.Threat;
        nextCry[k] = now + (zed ? 5000 + Math.random() * 7000 : 9000 + Math.random() * 14000);
        sound.play(zed ? (Math.hypot(x - fx, y - fy) < 2.5 ? 'zombie_attack' : 'zombie_groan') : ANIMAL_CRY[atype[i]!] ?? 'bird', x, y, zed ? 0.9 : 0.7);
        if (cuesOn) cues.heard(eid[i]!, zed ? '🧟' : CUE_ICON[atype[i]!] ?? '🐾', x, y, now, zed ? 4 : 3);
      } else if (cuesOn) cues.move(eid[i]!, x, y);
    }
    if (kind[i] === Kind.Animal && atype[i] === 5) { // a horse: the animated model (low-poly stand-in until it has loaded)
      const hi = horseInfo.get(eid[i]!), sc = hi?.[0] ?? 1;
      let hx = x, hy = y, hf = face[i]!, hv = spd[i]!;
      if (riding[i] && me >= 0 && Math.hypot(nx[i]! - nx[me]!, ny[i]! - ny[me]!) < 1.2) { hx = predX; hy = predY; hf = face[me]!; hv = spd[me]!; } // my own horse is where I am on this screen
      if (g3.horses.ready) g3.horses.add(eid[i]!, hx, hy, hf, hv, sub[i]!, sc, (alook[i]! >> 3) & 3, alook[i]! >> 5, (hi?.[3] ?? 0) === 1, tsec, dt);
      else g3.animals.add(5, hx, hy, hf, phase[i]! * 1.4, Math.min(1, hv / 1.6));
      continue;
    }
    if (kind[i] === Kind.Animal) { g3.animals.add(atype[i]!, x, y, face[i]!, phase[i]! * 1.4, Math.min(1, spd[i]! / 1.6)); continue; }
    if (i === me && aimOn) face[i] = Math.PI / 2 - (aimLock >= 0 && eid[aimLock] !== -1 ? Math.atan2(ny[aimLock]! - y, nx[aimLock]! - x) : aimAng); // I turn to my aim
    if (eyes && i === me) {
      // First person (imad 2026-11-26): the eye where my character's eyes really are, worked out again every frame (a child is
      // shorter, on horseback it is the saddle's height + my seated height and rises and falls with the stride, lying down is
      // low), and my own hands at the bottom of the screen instead of my body.
      const f = flags[i]!, sz = f & EFlag.Small ? 0.42 : f & EFlag.Child ? 0.62 : 1, k = 1.25 * sz, asleep = (f & EFlag.Sleeping) !== 0;
      const seat = riding[i] ? riderSeat(x, y) : 0;
      g3.eyeWant = asleep ? 0.55 : seat > 0 ? seat + 0.8 * k : 1.32 * k;
      if (asleep) g3.hands.hide();
      else {
        g3.hands.update({ look: atype[i]! > 0 ? playerLook(true, atype[i]!) : ME, gear: aimOn ? aimGear(gearOf[i]!) : gearOf[i]!, at: aimOn ? (now - aimAt) / 1000 : (now - animAt[i]!) / 1000,
          phase: phase[i]!, amp: Math.min(1, spd[i]! / 2.2), riding: seat > 0, bounce: seat > 0 ? seatBounce : 0, dt, fov: g3.camera.fov, aim: aimOn });
        handsOn = true;
      }
      myLook = atype[i]! > 0 ? playerLook(true, atype[i]!) : ME; myGear = gearOf[i]!;
      continue;
    }
    // Lying down (imad 2026-11-26: "they are not visible, the bed hides them"): asleep next to a bed = climb onto it and lie on top
    // of it along it, the head on the pillow; elsewhere lie down on the ground; getting up plays it backwards.
    const dead = (flags[i]! & EFlag.Dead) !== 0, asleep = (flags[i]! & EFlag.Sleeping) !== 0, size = flags[i]! & EFlag.Small ? 0.42 : flags[i]! & EFlag.Child ? 0.62 : 1;
    lieK[i] = dead ? 1 : lieK[i]! + Math.sign((asleep ? 1 : 0) - lieK[i]!) * Math.min(Math.abs((asleep ? 1 : 0) - lieK[i]!), dt / (asleep ? 1.1 : 0.8));
    let lying: number = lieK[i]!, lift = 0;
    if (lying > 0 && !dead && !(flags[i]! & EFlag.Carried) && !riding[i]) {
      const bp = bedPose(x, y, size);
      if (bp) {
        const u = lying, mv = easeS(u * 1.5);
        x += (bp.x - x) * mv; y += (bp.y - y) * mv;
        lift = 0.5 * easeS(u / 0.45); // a step up onto it first
        lying = easeS((u - 0.3) / 0.7); // then lie back
        let df = bp.f - face[i]!; df = Math.atan2(Math.sin(df), Math.cos(df));
        face[i] = face[i]! + df * easeS(u * 2) * Math.min(1, dt * 14);
      } else lying = easeS(lying);
    }
    const zed = kind[i] === Kind.Threat;
    const mine = i === me || eid[i] === meId;
    const look = zed ? ZOMBIE : atype[i]! > 0 && (kind[i] === Kind.Player || kind[i] === Kind.Agent || kind[i] === Kind.Npc) ? playerLook(mine, atype[i]!) : mine ? ME : kind[i] === Kind.Player ? OTHER_PLAYER : lookOf[i]!;
    const seat = riding[i] ? riderSeat(x, y) : 0;
    if (i === me) { myLook = look; myGear = gearOf[i]!; }
    const PP = i === me ? P : g3.peopleFor(x, y); // far away: the simpler set
    PP.add(x, y, face[i]!, phase[i]!, Math.min(1, spd[i]! / (zed ? 1.2 : 2.2)), look, lying, size, zed, zed ? 0 : mine && aimOn ? aimGear(gearOf[i]!) : gearOf[i]!, mine && aimOn ? (now - aimAt) / 1000 : (now - animAt[i]!) / 1000, seat, lift, i === me);
    if (kind[i] === Kind.Player && !(i === me && g3.view !== 'top')) PP.marker(x, y, tsec, eid[i] === meId ? GOLD : WHITE);
    else if (kind[i] === Kind.Npc) PP.marker(x, y, tsec, NPC_RING); // the town's teachers: talk to them for quests
    else if (eid[i] === follow) PP.marker(x, y, tsec, GOLD);
  }
  for (let k = corpses.length - 1; k >= 0; k--) { // animals just killed: falling over, then sinking
    const c = corpses[k]!, age = (now - c.at) / 1000;
    if (age > DEATH_SECS) { corpses.splice(k, 1); continue; }
    g3.animals.add(c.type, c.x, c.y, c.f, 0, 0, age);
  }
  if (!handsOn) g3.hands.hide();
  if (me >= 0) g3.myBowAt(aimOn, aimOn ? aimGear(gearOf[me]!) : gearOf[me]!, aimOn ? (now - aimAt) / 1000 : (now - animAt[me]!) / 1000, dt);
  else g3.myBowAt(false, 0, 0, dt);
  P.end(); g3.peopleFar.end(); g3.endShots(); g3.endItems(); g3.animals.end(); g3.horses.end();
  g3.anims.update(now, dt, (tx, ty) => tileUnder(tx + 0.5, ty + 0.5), looks, menu.open && menu.page === 'box' && boxView ? [boxView.at[0]!, boxView.at[1]!] : null);
  if (aimOn && me >= 0) {
    const lk = aimLock >= 0 && eid[aimLock] !== -1 ? aimLock : -1;
    const ang = lk >= 0 ? Math.atan2(ny[lk]! - predY, nx[lk]! - predX) : aimAng;
    g3.aim(true, predX, predY, ang, lk >= 0 ? Math.max(1, Math.hypot(nx[lk]! - predX, ny[lk]! - predY) - 0.6) : 22, lk >= 0 ? nx[lk]! : NaN, lk >= 0 ? ny[lk]! : NaN);
  } else g3.aim(false);
  drawGhost();
  g3.aiming = aimOn && me >= 0 && (meNeeds?.inv?.bow ?? 0) > 0;
  g3.render();
  crosshair(me, now);
  // Thoughts over heads: only for players the owner allows (the server sends them to nobody else).
  if (seer && thoughtsOn && !menu.open && now - mindsAt < 4000) bubbles.draw(bubblePos, bubbleProject, fx, fy, actName);
  else bubbles.hide();
  if (namesOn && !menu.open && !rp) names.draw(eachPerson, nameProject, fx, fy, 26); else names.hide();
  if (cuesOn && how === 'play' && !menu.open && !rp && !meTransit) cues.draw(now, fx, fy, g3.view === 'top', yaw, 26, nameProject); else cues.hide();
  const cpOn = compassOn && how === 'play' && playing() && !menu.open && !meTransit && !rp;
  compass.show(cpOn);
  if (cpOn) compass.draw(predX, predY, g3.view !== 'top' ? yaw - Math.PI / 2 : -Math.PI / 2, compassFit(now));
}
/** The compass sits at the very top (imad 2026-11-26: top 10px) in the gap between the top bar and my card, so it never covers either. */
let fitAt = 0, fitW = 0;
function compassFit(now: number): number {
  if (now - fitAt < 500 && fitW) return fitW;
  fitAt = now;
  const el = document.getElementById('compass'), top = document.getElementById('top'), card = document.getElementById('card');
  if (!el) return fitW = Math.min(innerWidth * 0.38, 900);
  const gap = innerWidth * 0.015, boxes = [top, card].filter((b) => b && !b.hidden).map((b) => b!.getBoundingClientRect()).filter((r) => r.width > 0 && r.top < 80);
  let l = gap, r = innerWidth - gap;
  for (const b of boxes) { if (b.left + b.width / 2 < innerWidth / 2) l = Math.max(l, b.right + gap); else r = Math.min(r, b.left - gap); }
  const w = Math.max(innerWidth * 0.22, Math.min(900, r - l));
  el.style.left = `${Math.round(l + (r - l - w) / 2)}px`; el.style.width = `${Math.round(w)}px`; el.style.transform = 'none';
  return fitW = w;
}
/** Every person / player / teacher drawn this frame but me: (id, x, y, height of the name). */
function eachPerson(fn: (id: number, x: number, y: number, h: number) => void): void {
  for (let i = 0; i < CAP; i++) {
    if (eid[i] === -1 || drawnF[i] !== frameNo || eid[i] === meId) continue;
    const k = kind[i];
    if (k !== Kind.Agent && k !== Kind.Player && k !== Kind.Npc) continue;
    const f = flags[i]!;
    fn(eid[i]!, drawnX[i]!, drawnY[i]!, (f & EFlag.Small ? 1.05 : f & EFlag.Child ? 1.55 : 2.05) + (riding[i] ? 1.2 : 0));
  }
}
const nameProject = (x: number, h: number, z: number, out: { x: number; y: number }) => !!g3 && g3.project(x, h, z, out);
/**
 * The bow's crosshair in third / first person: a small sight on the screen where the arrow will fly (15 m ahead), or on the
 * locked target (red, closing in, its distance). The engine's own assist decides the target, as before.
 */
let xhairState = '', xhairLock = -1, xhairLockAt = 0;
const XP = { x: 0, y: 0 };
function crosshair(me: number, now: number): void {
  if (!g3 || !aimOn || me < 0 || g3.view === 'top' || (meNeeds?.inv?.bow ?? 0) < 1) { if (!xhairEl.hidden) xhairEl.hidden = true; xhairState = ''; return; }
  const lk = aimLock >= 0 && eid[aimLock] !== -1 ? aimLock : -1;
  if (lk !== xhairLock) { xhairLock = lk; xhairLockAt = now; }
  let ok: boolean, dist = 0;
  if (lk >= 0) { dist = Math.hypot(nx[lk]! - predX, ny[lk]! - predY); ok = g3.project(drawnF[lk] === frameNo ? drawnX[lk]! : nx[lk]!, kind[lk] === Kind.Animal ? 0.6 : 1.2, drawnF[lk] === frameNo ? drawnY[lk]! : ny[lk]!, XP); }
  else ok = g3.project(predX + Math.cos(aimAng) * 15, 1.25, predY + Math.sin(aimAng) * 15, XP);
  if (!ok) { XP.x = innerWidth / 2; XP.y = innerHeight / 2; }
  const k = lk >= 0 ? Math.max(0, 1 - (now - xhairLockAt) / 180) : 0; // the lock closes in
  xhairEl.style.transform = `translate(${Math.round(XP.x)}px, ${Math.round(XP.y)}px) translate(-50%, -50%) scale(${(1 + k * 0.8).toFixed(2)})`;
  const st = lk >= 0 ? 'lock:' + Math.round(dist) : 'free';
  if (st !== xhairState) {
    xhairState = st;
    xhairEl.className = lk >= 0 ? 'lock' : '';
    xhairEl.innerHTML = `<i class="xr"></i><i class="xt"></i><i class="xb"></i><i class="xl"></i><i class="xg"></i><i class="xd"></i>${lk >= 0 ? `<b>${Math.round(dist)} m</b>` : ''}`;
  }
  if (xhairEl.hidden) xhairEl.hidden = false;
}
function bubblePos(id: number, out: { x: number; y: number }): boolean {
  const s = slotOf.get(id);
  if (s === undefined || drawnF[s] !== frameNo) return false;
  out.x = drawnX[s]!; out.y = drawnY[s]!;
  return true;
}
const bubbleProject = (x: number, z: number, out: { x: number; y: number }) => !!g3 && g3.project(x, 2.2, z, out);

let famAt = 0;
function frame(ts: number): void {
  raf = requestAnimationFrame(frame);
  if (menu.open && menu.page === 'family' && ts - famAt > 2000) { famAt = ts; send({ t: Msg.Do, a: 'mine' }); } // my little ones' needs, live
  if (!last) last = ts;
  const dt = Math.min(0.1, (ts - last) / 1000);
  acc += Math.min(250, ts - last); last = ts;
  while (acc >= STEP) { update(ts); acc -= STEP; }
  // Under the game menu the world is only drawn 10 times a second: the menu answers at once on small TVs.
  if (menu.open && menu.page === 'gear') gearScreen.draw(ts); else gearScreen.stop();
  if (menu.open && MAP_PAGES.has(menu.page)) {
    if (menu.page === 'map' && MyPC.gamepad) { mapScreen.stick(MyPC.gamepad.axis(0), MyPC.gamepad.axis(1), dt); mapScreen.zoomStick(MyPC.gamepad.axis(3), ts); }
    mapScreen.draw(ts);
  } else mapScreen.stop();
  if (!menu.open || ts - drawAt > 100) {
    draw(ts, ts - drawAt > 200 ? dt : Math.min(0.1, (ts - drawAt) / 1000)); drawAt = ts; fpsN++;
    // The view's size follows the frame rate (not while a menu draws it 10 times a second, nor while chunks are still being built).
    if (dyn && gfx.res && dyn.frame(ts, !menu.open && mode === 'world' && !document.hidden && buildQ.length < 3 && !meTransit)) resize();
  }
  if (gfx.fps && ts - fpsAt > 500) {
    const st = g3?.stats;
    fpsEl.textContent = `${Math.round(fpsN * 1000 / (ts - fpsAt))} fps · ${Math.round(rtt)} ms` + (st ? ` · ${Math.round((g3!.renderer.domElement.width / Math.max(1, innerWidth)) * 100)} % · ${st.calls} dc · ${Math.round(st.tris / 1000)}k` : '');
    fpsN = 0; fpsAt = ts;
  }
  if (ts - viewAt > 250) { viewAt = ts; sendView(); }
  if (ts - pingAt > 3000) { pingAt = ts; send({ t: Msg.Ping, c: ts }); }
  if (how === 'play' && mode === 'world' && playing() && !meTransit) {
    if (compassOn && ts - compassAt > 2000) { compassAt = ts; send({ t: Msg.Do, a: 'compass' }); }
    if (meNeeds?.ride && ts - rideDestsAt > 5000) { rideDestsAt = ts; send({ t: Msg.Do, a: 'rideTo', text: '' }); }
  }
  updateInteract(ts);
  if (ts - hudAt > 500 && mode === 'world') {
    hudAt = ts; updateHud(ts);
    if (how === 'watch' && follow >= 0) askInfo(follow); else if (menu.open && menu.page === 'person') askInfo(infoFor);
    drawCard();
  }
}

let hudText = '';
const WX_ICON: Record<string, string> = { clear: '☀', cloudy: '☁', rain: '🌧', storm: '⛈', snow: '🌨', blizzard: '❄', fog: '🌫' };
/** Tell me once when the cold starts to hurt (and again every 2 minutes while it does), and when a fire warms me. */
function coldNote(): void {
  const c = meNeeds?.cold;
  if (!c || how !== 'play') return;
  const now = performance.now();
  if (c.drain > 0.5) { if (now - coldShown > 120000) { coldShown = now; note(tf(c.hut ? 'coldHut' : 'coldNow', c.drain < 10 ? c.drain.toFixed(1) : String(Math.round(c.drain))), 7000); } }
  else if (c.fire && c.t < 5 && coldShown > 0) { coldShown = 0; note(t('warmFire'), 4000); }
}
function updateHud(now: number): void {
  const gs = gameSec + ((now - tickAt) / 1000) * clockScale * simSpeed;
  const day = Math.floor((gs / 3600 + 8) / 24) + 1, h = Math.floor((gs / 3600 + 8) % 24), mi = Math.floor((gs / 60) % 60);
  const fs = follow >= 0 ? slotOf.get(follow) : undefined;
  const who = how === 'play' ? profileName() : follow >= 0 ? `${t('following')} #${follow & 0xffff}${fs !== undefined ? ' · ' + actName(sub[fs]!) : ''}` : t('free');
  const wx = wxInfo ? ` · ${WX_ICON[wxInfo.w] ?? ''} ${t(`se${wxInfo.s}` as Key)} ${Math.round(wxInfo.t)} °C` : '';
  const txt = `${mapName(map)} · ${t('day')} ${day} ${String(h).padStart(2, '0')}:${String(mi).padStart(2, '0')}${wx} · ${agentsTotal} ${t('agents')} · ${who}`;
  if (txt !== hudText) { hudText = txt; hudTop.textContent = txt; }
  if (meTransit && how === 'play') {
    const left = trip?.shownAt ? ` ${Math.max(0, Math.ceil(trip.secs - (now - trip.shownAt) / 1000))} s` : ''; // counts only while the road shows
    noteEl.textContent = `${rideHorse ? tf('hRideTo', rideHorse.name, mapName(meTo)) : tf('travelling', mapName(meTo))}${left}`;
    noteEl.hidden = false;
  }
}

function resize(): void {
  const s = Math.min(1, Math.min(1920 / innerWidth, 1080 / innerHeight, window.devicePixelRatio || 1)) * (gfx.res && dyn ? dyn.scale : tierScale());
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
  if (menu.open) {
    // The map reads the controller's stick itself (smooth); its D-pad and the remote's arrows step.
    if (fromPad && menu.page === 'map' && MyPC.gamepad && Math.hypot(MyPC.gamepad.axis(0), MyPC.gamepad.axis(1)) > 0.3) return;
    if (pressed) menu.input(d);
    return;
  }
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
  if (pressed) sound.unlock();
  if (name in DIRS) { direction(name as keyof typeof DIRS, pressed, repeat); return; }
  if (capture) { if (pressed && !repeat) captured('remote', name); return; }
  if (mode !== 'world') { if (pressed && name === 'ok') screenOk(); return; }
  if (rp && !menu.open) { if (pressed && !repeat && name === 'ok') rp.toggle(); return; }
  if (menu.open) {
    if (!pressed || repeat) return;
    if (menu.page === 'map' && remoteAction(binds, name) === 'map') { menu.close(); return; }
    if (mapKey(name === 'red' ? 'me' : name === 'green' ? 'next' : name === 'chUp' || name === 'yellow' ? 'in' : name === 'chDown' || name === 'blue' ? 'out' : '')) return;
    if (name === 'ok') menu.input('ok');
    else if (remoteAction(binds, name) === 'menu') menu.close();
    return;
  }
  const a = remoteAction(binds, name);
  if (placing) {
    if (!pressed || repeat) return;
    if (name === 'ok') placeConfirm();
    else if (a === 'build' || name === 'chUp' || name === 'chDown') placeTurn();
    else if (a === 'menu' || name === 'back') stopPlacing();
    return;
  }
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
  if (pressed) sound.unlock();
  if (i >= 12 && i <= 16) return; // D-pad (directions) and Home (My PC's)
  if (capture) { if (pressed) captured('pad', i); return; }
  if (mode !== 'world') { if (pressed && i === 0) screenOk(); return; }
  if (rp && !menu.open) { if (pressed) { if (i === 0) rp.toggle(); else if (i === 1 || padAction(binds, i) === 'menu') stopReplay(); } return; }
  if (menu.open) {
    if (!pressed) return;
    if (menu.page === 'map' && padAction(binds, i) === 'map') { menu.close(); return; }
    if (mapKey(i === 2 ? 'me' : i === 3 ? 'next' : i === 5 || i === 7 ? 'in' : i === 4 || i === 6 ? 'out' : '')) return; // R / ZR zoom in, L / ZL out
    if (i === 0) menu.input('ok');
    else if (i === 1) menu.input('back');
    else if (padAction(binds, i) === 'menu') menu.close();
    return;
  }
  if (placing) { // A builds, B cancels, X / Y / the shoulders (or Build again) turn the door
    if (!pressed) return;
    if (i === 0) placeConfirm();
    else if (i === 1) stopPlacing();
    else if (i === 2 || i === 3 || i === 4 || i === 5 || padAction(binds, i) === 'build') placeTurn();
    else if (padAction(binds, i) === 'menu') { stopPlacing(); openMenu(); }
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
    { const u = Number(MyPC.load('uiSize', 1)); uiSize = UI_SIZES.includes(u) ? u : 1; applyUiSize(); }
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
    if (b && b.pad && b.remote && (b.v ?? 1) < BINDS_V) {
      // The buttons were laid out again (interact / talk / attack / aim / build): the new defaults, said once.
      binds = cloneBinds(DEFAULT_BINDS); MyPC.save('binds', binds); bindsNews = true;
    } else if (b && b.pad && b.remote) {
      binds = { pad: { ...b.pad }, remote: { ...b.remote }, v: BINDS_V };
      // The map takes − from Thoughts when the player still had it there (Thoughts stays in Settings and the Buttons page).
      if (!('map' in b.pad) && b.pad.thoughts === DEFAULT_BINDS.pad.map) { delete binds.pad.thoughts; binds.pad.map = DEFAULT_BINDS.pad.map; MyPC.save('binds', binds); mapNews = true; }
      // Actions added since: their default button, when the player has not used it for something else.
      for (const a of ACTIONS) {
        const dp = DEFAULT_BINDS.pad[a], dr = DEFAULT_BINDS.remote[a];
        if (!(a in b.pad) && dp !== undefined && padAction(binds, dp) === undefined) binds.pad[a] = dp;
        if (!(a in b.remote) && dr !== undefined && remoteAction(binds, dr) === undefined) binds.remote[a] = dr;
      }
    }
    { const sp = MyPC.load('sound', null) as Partial<SoundPrefs> | null; sound.prefs = { ...SOUND_DEFAULTS, ...(sp && typeof sp === 'object' ? sp : {}) }; }
    void sound.load(new URL('audio/', location.href).href);
    // Browsers and TVs let sound start only after a button press.
    for (const ev of ['keydown', 'pointerdown', 'touchstart'] as const) window.addEventListener(ev, () => sound.unlock(), { passive: true });
    const cv = MyPC.load('cam', 'top');
    camView = CAM_VIEWS.includes(cv) ? cv : 'top';
    thoughtsOn = MyPC.load('thoughts', true) !== false;
    namesOn = MyPC.load('names', true) !== false; cuesOn = MyPC.load('cues', true) !== false; compassOn = MyPC.load('compass', true) !== false;
    loadWheel();
    window.addEventListener('resize', resize);
    setMenu();
    if (MyPC.gamepad) {
      MyPC.gamepad.on('pads', (list: unknown[]) => { pads = list.length; remoteOnly = !list.length; updateHints(); });
      MyPC.gamepad.on('button', (i: number, pressed: boolean) => onPad(i, pressed));
    }
    MyPC.buttons?.on?.((name: string, pressed: boolean, repeat: boolean) => onRemote(name, pressed, !!repeat));
    if ((MyPC.apiLevel ?? 0) >= 24 && MyPC.stt?.on) MyPC.stt.on('text', onSttText);
    if (q.get('dev') !== null) (window as unknown as { __dev: unknown }).__dev = { cues: () => [...document.querySelectorAll('#cues .cue')].filter((e) => !(e as HTMLElement).hidden).map((e) => [e.textContent, (e as HTMLElement).style.transform]), asleep: () => (meSlot() >= 0 ? (flags[meSlot()]! & EFlag.Sleeping) !== 0 : null), mapKey: (k: 'me' | 'next' | 'in' | 'out') => mapKey(k), unplace: () => stopPlacing(), tile: (x: number, y: number) => tileName[tileUnder(x + 0.5, y + 0.5)] ?? '?', place: (what?: string, dx?: number, dy?: number, turn?: number, ok?: boolean) => { if (what) startPlacing(what); for (let k = 0; k < Math.abs(dx ?? 0); k++) placeMove(Math.sign(dx!), 0); for (let k = 0; k < Math.abs(dy ?? 0); k++) placeMove(0, Math.sign(dy!)); for (let k = 0; k < (turn ?? 0); k++) placeTurn(); if (ok) placeConfirm(); return placing ? { ...placing, check: placeCheck(placing) } : null; }, snd: () => sound.stats(), open: (p: string) => openMenu(p), ui: (v?: number) => { if (v) { uiSize = v; applyUiSize(); } return uiSize; }, act: (a: ActionId, on = true) => doAction(a, on), aim: (to?: number) => { if (to !== undefined) aimAng = to; return { aimOn, aimAng, aimLock, hud: aimEl.hidden ? '' : aimEl.textContent, corpses: corpses.length, fell: corpses.map((c) => [c.x, c.y]) }; }, me: () => [focusX(), focusY(), map], page: (p: string) => openMenu(p), yaw: (v?: number) => { if (v !== undefined) yaw = v; return yaw; }, xhair: () => (xhairEl.hidden ? '' : xhairEl.className + ':' + xhairEl.textContent), map: () => ({ open: menu.open && menu.page, cx: mapScreen.cx, cy: mapScreen.cy, marks: mapScreen.marks.length, zoom: mapScreen.zoom, data: !!mapScreen.data }), hint: () => (hudHint.hidden ? '' : hudHint.textContent), cam: (v: CamView) => nextCamera(v), dbg: () => ({ yaw, camView, how, meId, meTransit, predOk, predX, predY, camX, camY, s: meSlot(), sx: meSlot() >= 0 ? nx[meSlot()] : null }), look: (x: number, y: number) => { follow = -1; camX = x; camY = y; snapCam = true; }, jump: (x: number, y: number) => { predOk = false; follow = -1; camX = x; camY = y; snapCam = true; sendView(); }, ride: () => (autoRide ? { id: autoRide.id, k: autoRide.k, n: autoRide.pts.length, map: autoRide.map } : null), dests: () => rideDests, quick: (id: string) => runQuick(id), names: () => names.names.size, do: (a: string, text?: string) => send({ t: Msg.Do, a, text }), g3: () => g3, res: (on: boolean) => { gfx.res = on; if (dyn) dyn.scale = dyn.start; resize(); return dyn?.scale; }, bench: (n?: number) => g3 ? { ...g3.bench(n), w: g3.renderer.domElement.width, h: g3.renderer.domElement.height, tier, chunks: meshOf.size, q: buildQ.length + jobs.size, worker: !!worker, chunkMs: { ...chunkMs } } : null, ia: () => (iaEl.hidden ? '' : iaEl.textContent), lie: () => (meSlot() >= 0 ? lieK[meSlot()] : -1), falls: () => g3?.anims.debug(performance.now()) ?? [], gaits: () => g3?.horses.debug() ?? [], trip: () => (trip ? { phase: trip.phase, secs: trip.secs, shown: trip.shownAt ? (performance.now() - trip.shownAt) / 1000 : -1, fade: fadeEl ? +getComputedStyle(fadeEl).opacity : -1, chunks: meshOf.size, q: buildQ.length + jobs.size, map } : { fade: fadeEl ? +getComputedStyle(fadeEl).opacity : -1, chunks: meshOf.size, map }) };
    MyPC.ready();
  },
  onStart() {
    const d = Number(MyPC.load('dist', 24)) || 24, bk = Number(MyPC.load('back', 7)) || 7;
    connect(); startLoop();
    queueMicrotask(() => { if (g3) { g3.dist = d; g3.back = bk; } });
    startDist = d;
  },
  onPause() { stopLoop(); sound.pause(true); },
  onResume() { sound.pause(false); startLoop(); },
  onDestroy() {
    stopLoop(); sound.pause(true); clearTimeout(retryTimer);
    window.removeEventListener('resize', resize);
    if (ws) { ws.onclose = null; ws.close(); ws = null; }
    g3?.dispose(); g3 = null;
  },
  onMenu(id: string) {
    if (id === 'game') setTimeout(() => openMenu(), 50);
    else if (id === 'server') void askServer();
  },
  onInput(action: string, pressed: boolean, repeat?: boolean, dev?: string): boolean | void {
    if (pressed) sound.unlock();
    const pad = !!dev && /^pad/.test(dev);
    if (action in DIRS) { direction(action as keyof typeof DIRS, pressed, repeat, pad); return; }
    if (action === 'cancel') {
      if (!pressed) return pad ? true : undefined;
      if (capture) { capture = null; note(t('mControls'), 800); return true; }
      if (placing && !menu.open) { stopPlacing(); return true; }
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
      if (placing) { placeConfirm(); return; }
      if (wheel.open) { runQuick(wheel.close()); return; }
      if (rp) { rp.toggle(); return; }
      doAction(dev === 'touch' ? 'use' : remoteAction(binds, 'ok') ?? 'use', true);
      return;
    }
    if (menu.open && (action === 'pageUp' || action === 'pageDown')) { if (pressed) mapKey(action === 'pageUp' ? 'in' : 'out'); return; }
    if (mode !== 'world' || menu.open) return;
    if (action === 'run') { doAction('run', pressed); return; }
    if (!pressed) return;
    if (placing && (action === 'pageUp' || action === 'pageDown')) { placeTurn(); return; }
    if (action === 'pageUp') doAction(remoteAction(binds, 'chUp') ?? 'zoomIn', true);
    else if (action === 'pageDown') doAction(remoteAction(binds, 'chDown') ?? 'zoomOut', true);
  },
});
let startDist = 24;
void startDist;
const isPad = (dev?: string) => !!dev && /^(pad|touch)/.test(dev);
