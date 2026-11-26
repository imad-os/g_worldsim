/**
 * The TV's map (imad 2026-11-25: "a map opened with a button that shows where I am and where the buildings and things are,
 * like the panel's", "mark home, mines, hunt spots"). A Menu page with its own cursor (Grid): the stick / arrows move the
 * cursor (the view follows it), A / OK marks the place under it (or opens the mark under it), X = back to me, Y = next map,
 * L / R or CH + / − zoom. The tiles come once per map (Do `map`), places every few seconds (Do `map` "<id>:live"); the
 * marks are the player's own, kept on the server (Do `mark`).
 * Drawn on one canvas only when something changed (the cursor, the data, my place), never every frame for nothing.
 */
import { MARK_ICON, type MapMark, type MarkKind } from '@worldsim/protocol';
import { t, tf, type Key } from './i18n.js';
import type { Grid } from './ui.js';

export interface MapPlaces {
  camp: [number, number] | null; fires: [number, number][]; home: [number, number] | null; huts: [number, number, number, string][];
  store: [number, number] | null; portals: [number, number, string][]; npcs: [number, number, string][]; horses: [number, number, string][]; wild?: [number, number, number][];
  people: [number, number][]; players: [number, number, string][];
}
export interface MapData { map: { id: string; name: string; w: number; h: number; tiles?: Uint8Array }; maps: [string, string][]; me: [number, number, number] | null; places: MapPlaces; marks: MapMark[] }

export interface MapCtx {
  /** Tile colours by tile id (0xRRGGBB) and which are solid. */
  colors(): { color: number[]; solid: boolean[] };
  /** Where my character is now on this screen: x, y, facing (0 = east), map id. */
  me(): [number, number, number, string];
  send(a: string, text: string): void;
  /** Open a menu page above the map (mark a place / my mark). */
  push(page: string): void;
  remote(): boolean;
  npcName(key: string): string;
}

const ZOOMS = [0, 2, 4, 7, 11]; // pixels per metre (0 = the whole map fits)
const NPC_ICON = '📜';
export const MARK_KEY: Record<MarkKind, Key> = { home: 'mkHome', mine: 'mkMine', hunt: 'mkHunt', wood: 'mkWood', water: 'mkWater', farm: 'mkFarm', danger: 'mkDanger', camp: 'mkCamp', star: 'mkStar' };
const esc = (s: string) => s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

export class MapScreen implements Grid {
  data: MapData | null = null;
  marks: MapMark[] = [];
  /** The map shown ('' = where I am). */
  mapId = '';
  /** Cursor (metres) and the view's centre. */
  cx = 0; cy = 0; vx = 0; vy = 0;
  zoom = 2;
  /** The mark under the cursor (id, -1 = none) and where a new mark would go. */
  hover = -1;
  private tilesOf = new Map<string, { w: number; h: number; img: HTMLCanvasElement }>();
  private canvas = Object.assign(document.createElement('canvas'), { className: 'mapc' });
  private dirty = true;
  private askAt = 0;
  private drawnAt = 0;
  private infoEl: HTMLElement | null = null;
  private infoText = '';
  open = false;

  constructor(private c: MapCtx) {}

  /** The page opened: ask for the map where I am, the cursor on me. */
  start(): void {
    const me = this.c.me();
    this.open = true;
    if (!this.mapId || this.mapId !== me[3]) this.mapId = me[3];
    this.cx = this.vx = me[0]; this.cy = this.vy = me[1];
    this.ask(true);
    this.dirty = true;
  }
  stop(): void { this.open = false; }

  private ask(tiles: boolean): void {
    this.askAt = performance.now();
    if (!tiles && !this.tilesOf.has(this.mapId)) tiles = true;
    this.c.send('map', this.mapId + (!tiles || this.tilesOf.has(this.mapId) ? ':live' : '')); // the tiles once per map
  }

  /** The server's answer (Do `map`). */
  set(d: MapData): void {
    const tl = d.map.tiles;
    if (tl && tl.length >= d.map.w * d.map.h) this.tilesOf.set(d.map.id, { w: d.map.w, h: d.map.h, img: this.paint(d.map.w, d.map.h, tl) });
    const first = !this.data || this.data.map.id !== d.map.id;
    this.data = d; this.marks = d.marks ?? this.marks; this.mapId = d.map.id;
    if (first && this.c.me()[3] !== d.map.id) { this.cx = this.vx = d.map.w / 2; this.cy = this.vy = d.map.h / 2; }
    this.dirty = true;
  }
  setMarks(list: MapMark[]): void { this.marks = list; this.dirty = true; }

  /** One pixel per tile, soft colours (drawn bigger with smoothing, so it reads as a painted map, not as pixels). */
  private paint(w: number, h: number, tiles: Uint8Array): HTMLCanvasElement {
    const cv = document.createElement('canvas'); cv.width = w; cv.height = h;
    const g = cv.getContext('2d')!, im = g.createImageData(w, h), { color, solid } = this.c.colors();
    for (let k = 0; k < w * h; k++) {
      const id = tiles[k]!, col = color[id] ?? 0x556655, s = solid[id] ? 0.78 : 1;
      // A little towards parchment: maps read better a bit warm and soft.
      const r = ((col >> 16) & 255) * s, gg = ((col >> 8) & 255) * s, b = (col & 255) * s;
      im.data[k * 4] = r * 0.82 + 40; im.data[k * 4 + 1] = gg * 0.82 + 34; im.data[k * 4 + 2] = b * 0.82 + 22; im.data[k * 4 + 3] = 255;
    }
    g.putImageData(im, 0, 0);
    return cv;
  }

  html(): string {
    const d = this.data;
    const tabs = d ? d.maps.map(([id, name]) => `<span class="mtab${id === this.mapId ? ' cur' : ''}">${esc(name)}</span>`).join('') : '';
    const legend = [['me', '▲', t('mapYou')], ['home', '🏠', t('mapHome')], ['hut', '▪', t('mapHut')], ['camp', '🔥', t('mapCamp')], ['gate', '⇆', t('mapGate').replace(/\s*\{0\}/, '')], ['npc', NPC_ICON, 'NPC'], ['horse', '🐎', t('mapHorses')], ['mark', '⭐', t('markEdit')]]
      .map(([k, i, l]) => `<span class="lg lg-${k}"><b>${i}</b>${esc(l!)}</span>`).join('');
    return `<div class="mapv"><div class="mtabs">${tabs}</div><div id="mapbox">${d ? '' : `<div class="mapwait">${esc(t('mapLoading'))}</div>`}</div>
<div class="minfo" id="mapinfo"></div><div class="mlegend">${legend}</div><div class="nv">${esc(t(this.c.remote() ? 'mapHelpRemote' : 'mapHelp'))}</div></div>`;
  }

  // ---------------------------------------------------------------- input
  move(d: 'up' | 'down' | 'left' | 'right'): void {
    const step = 26 / this.ppm();
    if (d === 'left') this.cx -= step; else if (d === 'right') this.cx += step; else if (d === 'up') this.cy -= step; else this.cy += step;
    this.clampCursor(); this.dirty = true;
  }
  /** The analog stick (every frame while the map is open): smooth moves, faster when pushed far. */
  stick(ax: number, ay: number, dt: number): void {
    if (Math.hypot(ax, ay) < 0.2) return;
    const sp = (380 / this.ppm()) * dt;
    this.cx += ax * Math.abs(ax) * sp; this.cy += ay * Math.abs(ay) * sp;
    this.clampCursor(); this.dirty = true;
  }
  ok(): void {
    if (!this.data) return;
    this.c.push(this.hover >= 0 ? 'markEdit' : 'markNew');
  }
  /** Buttons of the map: 'me' (back to me), 'next' (next map), 'in' / 'out' (zoom). */
  key(k: 'me' | 'next' | 'in' | 'out'): void {
    if (k === 'in' || k === 'out') { this.zoom = Math.max(0, Math.min(ZOOMS.length - 1, this.zoom + (k === 'in' ? 1 : -1))); this.dirty = true; return; }
    if (k === 'me') { const me = this.c.me(); if (me[3] !== this.mapId) { this.mapId = me[3]; this.data = null; this.ask(true); } this.cx = me[0]; this.cy = me[1]; this.dirty = true; return; }
    const maps = this.data?.maps ?? [];
    if (maps.length < 2) return;
    const i = maps.findIndex(([id]) => id === this.mapId);
    this.mapId = maps[(i + 1) % maps.length]![0];
    this.data = null; this.hover = -1; this.ask(true); this.dirty = true;
  }

  private ppm(): number {
    const d = this.data, box = this.canvas;
    if (ZOOMS[this.zoom]! > 0 || !d) return ZOOMS[this.zoom]! || 2;
    return Math.min((box.width || 800) / d.map.w, (box.height || 500) / d.map.h) * 0.96;
  }
  private clampCursor(): void {
    const d = this.data; if (!d) return;
    this.cx = Math.max(0, Math.min(d.map.w, this.cx)); this.cy = Math.max(0, Math.min(d.map.h, this.cy));
  }

  /** Where a new mark goes and the mark under the cursor. */
  markAt(): { map: string; x: number; y: number } { return { map: this.mapId, x: Math.round(this.cx * 10) / 10, y: Math.round(this.cy * 10) / 10 }; }
  hovered(): MapMark | undefined { return this.marks.find((m) => m.id === this.hover); }

  // ---------------------------------------------------------------- drawing
  /** Every frame while the page is open: puts the canvas in its box, asks for fresh places, redraws when something changed. */
  draw(now: number): void {
    if (!this.open) return;
    const box = document.getElementById('mapbox');
    if (!box) return;
    if (this.canvas.parentElement !== box) { box.textContent = ''; box.appendChild(this.canvas); this.dirty = true; this.infoText = ''; }
    this.infoEl = document.getElementById('mapinfo');
    const W = Math.min(1600, Math.round(box.clientWidth)), H = Math.min(1000, Math.round(box.clientHeight));
    if (W > 0 && (this.canvas.width !== W || this.canvas.height !== H)) { this.canvas.width = W; this.canvas.height = H; this.dirty = true; }
    if (now - this.askAt > 4000) this.ask(false);
    if (now - this.drawnAt > 400) this.dirty = true; // my own place moves
    if (!this.dirty || !this.data || !W) return;
    this.dirty = false; this.drawnAt = now;
    this.render(W, H);
  }

  private render(W: number, H: number): void {
    const d = this.data!, g = this.canvas.getContext('2d')!, k = this.ppm();
    // The view follows the cursor: it moves when the cursor leaves the middle 60 % (whole map = fixed).
    const hw = W / 2 / k, hh = H / 2 / k;
    if (ZOOMS[this.zoom] === 0) { this.vx = d.map.w / 2; this.vy = d.map.h / 2; }
    else {
      if (this.cx < this.vx - hw * 0.6) this.vx = this.cx + hw * 0.6; if (this.cx > this.vx + hw * 0.6) this.vx = this.cx - hw * 0.6;
      if (this.cy < this.vy - hh * 0.6) this.vy = this.cy + hh * 0.6; if (this.cy > this.vy + hh * 0.6) this.vy = this.cy - hh * 0.6;
      this.vx = d.map.w < hw * 2 ? d.map.w / 2 : Math.max(hw, Math.min(d.map.w - hw, this.vx));
      this.vy = d.map.h < hh * 2 ? d.map.h / 2 : Math.max(hh, Math.min(d.map.h - hh, this.vy));
    }
    const X = (x: number) => (x - this.vx) * k + W / 2, Y = (y: number) => (y - this.vy) * k + H / 2;
    g.fillStyle = '#1a1712'; g.fillRect(0, 0, W, H);
    const tl = this.tilesOf.get(d.map.id);
    if (tl) { g.imageSmoothingEnabled = true; g.drawImage(tl.img, X(0), Y(0), d.map.w * k, d.map.h * k); }
    // A light grid every 16 m (about the size of a hut and its yard): distances read at a glance.
    g.strokeStyle = 'rgba(255, 244, 220, 0.07)'; g.lineWidth = 1; g.beginPath();
    for (let x = 0; x <= d.map.w; x += 16) { g.moveTo(Math.round(X(x)) + 0.5, Y(0)); g.lineTo(Math.round(X(x)) + 0.5, Y(d.map.h)); }
    for (let y = 0; y <= d.map.h; y += 16) { g.moveTo(X(0), Math.round(Y(y)) + 0.5); g.lineTo(X(d.map.w), Math.round(Y(y)) + 0.5); }
    g.stroke();
    g.strokeStyle = 'rgba(255, 230, 180, 0.5)'; g.lineWidth = 2; g.strokeRect(X(0), Y(0), d.map.w * k, d.map.h * k);
    const p = d.places, fs = Math.max(13, Math.min(24, H / 30));
    const icon = (x: number, y: number, s: string, size = fs, label = '', col = '#fff6e0') => {
      g.font = `${size}px sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle';
      g.fillText(s, X(x), Y(y));
      if (label) { g.font = `600 ${Math.round(fs * 0.62)}px sans-serif`; g.lineWidth = 3; g.strokeStyle = 'rgba(0,0,0,0.75)'; g.strokeText(label, X(x), Y(y) + size * 0.85); g.fillStyle = col; g.fillText(label, X(x), Y(y) + size * 0.85); g.fillStyle = '#fff'; }
    };
    const dot = (x: number, y: number, r: number, fill: string, line = 'rgba(0,0,0,0.6)') => { g.beginPath(); g.arc(X(x), Y(y), r, 0, Math.PI * 2); g.fillStyle = fill; g.fill(); g.lineWidth = 1.5; g.strokeStyle = line; g.stroke(); };
    // Huts (every one built: mine gold, someone's brown, free ones grey), then the camp and its fires, the store.
    for (const [x, y, own, who] of p.huts) {
      const s = Math.max(7, 5 * k);
      g.fillStyle = own === 1 ? '#ffd166' : own === 2 ? '#b07a45' : '#8c8c84'; g.strokeStyle = 'rgba(0,0,0,0.7)'; g.lineWidth = 1.5;
      g.fillRect(X(x) - s / 2, Y(y) - s / 2, s, s); g.strokeRect(X(x) - s / 2, Y(y) - s / 2, s, s);
      if (k >= 4 && own !== 1) icon(x, y + 2, '', fs, who ? tf('mapHutOf', who) : t('mapHutFree'), '#e8d9c0');
    }
    for (const [x, y] of p.fires) dot(x, y, 4, '#ff8a3c');
    if (p.camp) icon(p.camp[0], p.camp[1], '🔥', fs * 1.2, t('mapCamp'));
    if (p.store) icon(p.store[0], p.store[1], '📦', fs * 0.9, k >= 4 ? t('mapStore') : '');
    if (p.home) icon(p.home[0], p.home[1], '🏠', fs * 1.25, t('mapHome'), '#ffd166');
    for (const [x, y, to] of p.portals) {
      g.beginPath(); g.arc(X(x), Y(y), fs * 0.55, 0, Math.PI * 2); g.fillStyle = 'rgba(120, 200, 255, 0.35)'; g.fill(); g.lineWidth = 2; g.strokeStyle = '#8fd3ff'; g.stroke();
      icon(x, y, '⇆', fs * 0.8, tf('mapGate', d.maps.find(([id]) => id === to)?.[1] ?? to), '#bfe6ff');
    }
    for (const [x, y, key] of p.npcs) icon(x, y, NPC_ICON, fs * 0.85, k >= 7 ? this.c.npcName(key) : '', '#9ff3ff');
    for (const [x, y] of p.people) dot(x, y, 3.2, '#f1efe6');
    for (const [x, y, n] of p.players) { dot(x, y, 4.2, '#6fb7ff', '#0d2a44'); if (k >= 2) icon(x, y - 0.2, '', fs, n, '#cfe6ff'); }
    for (const [x, y, q] of p.wild ?? []) { dot(x, y, 3.6, q === 2 ? '#ffcf4a' : q === 1 ? '#8fc8ff' : '#a8784a'); if (k >= 7) icon(x, y - 1.2, '🐎', fs * 0.6); } // wild horses (gold = legendary, blue = rare)
    for (const [x, y, n] of p.horses) { g.beginPath(); g.arc(X(x), Y(y), fs * 0.62, 0, Math.PI * 2); g.fillStyle = 'rgba(20, 16, 10, 0.7)'; g.fill(); g.lineWidth = 2; g.strokeStyle = '#ffd166'; g.stroke(); icon(x, y, '🐎', fs * 0.8, n, '#ffe7a3'); } // my horses, always named
    // My marks.
    let hover = -1, hd = 18;
    for (const m of this.marks) {
      if (m.map !== d.map.id) continue;
      g.beginPath(); g.arc(X(m.x), Y(m.y), fs * 0.72, 0, Math.PI * 2); g.fillStyle = 'rgba(20, 16, 10, 0.75)'; g.fill(); g.lineWidth = 2; g.strokeStyle = '#ffd166'; g.stroke();
      icon(m.x, m.y, MARK_ICON[m.kind] ?? '⭐', fs * 0.85, m.label || t(MARK_KEY[m.kind] ?? 'mkStar'), '#ffe7a3');
      const dd = Math.hypot(X(m.x) - X(this.cx), Y(m.y) - Y(this.cy));
      if (dd < hd) { hd = dd; hover = m.id; }
    }
    this.hover = hover;
    // Me: an arrow the way I face.
    const me = this.c.me();
    if (me[3] === d.map.id) {
      const x = X(me[0]), y = Y(me[1]), a = me[2], r = fs * 0.75;
      g.save(); g.translate(x, y); g.rotate(a);
      g.beginPath(); g.moveTo(r, 0); g.lineTo(-r * 0.7, r * 0.62); g.lineTo(-r * 0.35, 0); g.lineTo(-r * 0.7, -r * 0.62); g.closePath();
      g.fillStyle = '#ffd166'; g.fill(); g.lineWidth = 2.5; g.strokeStyle = '#1a1206'; g.stroke(); g.restore();
    }
    // The cursor.
    const ux = X(this.cx), uy = Y(this.cy), on = hover >= 0;
    g.strokeStyle = on ? '#ffd166' : '#ffffff'; g.lineWidth = 2;
    g.beginPath(); g.arc(ux, uy, 11, 0, Math.PI * 2); g.stroke();
    g.beginPath(); g.moveTo(ux - 20, uy); g.lineTo(ux - 7, uy); g.moveTo(ux + 7, uy); g.lineTo(ux + 20, uy); g.moveTo(ux, uy - 20); g.lineTo(ux, uy - 7); g.moveTo(ux, uy + 7); g.lineTo(ux, uy + 20); g.stroke();
    this.info(me);
  }

  /** The line under the map: what is under the cursor, how far from me. */
  private info(me: [number, number, number, string]): void {
    const d = this.data!, p = d.places;
    const near = (x: number, y: number, r = 3) => Math.hypot(x - this.cx, y - this.cy) < Math.max(r, 14 / this.ppm());
    let what = '';
    const m = this.hovered();
    if (m) what = `${MARK_ICON[m.kind]} ${m.label || t(MARK_KEY[m.kind])}`;
    else if (p.home && near(p.home[0], p.home[1], 4)) what = '🏠 ' + t('mapHome');
    else if (p.camp && near(p.camp[0], p.camp[1], 4)) what = '🔥 ' + t('mapCamp');
    else {
      const g = p.portals.find(([x, y]) => near(x, y, 4)); const h = p.huts.find(([x, y]) => near(x, y, 3.5)); const n = p.npcs.find(([x, y]) => near(x, y));
      const pl = p.players.find(([x, y]) => near(x, y)); const hr = p.horses.find(([x, y]) => near(x, y));
      if (g) what = '⇆ ' + tf('mapGate', d.maps.find(([id]) => id === g[2])?.[1] ?? g[2]);
      else if (h) what = h[2] === 1 ? '🏠 ' + t('mapHome') : h[3] ? tf('mapHutOf', h[3]) : t('mapHutFree');
      else if (n) what = NPC_ICON + ' ' + this.c.npcName(n[2]);
      else if (pl) what = pl[2];
      else if (hr) what = '🐎 ' + tf('mapHorse', hr[2]);
      else if ((p.wild ?? []).some(([x, y]) => near(x, y))) what = '🐎 ' + t('mapWild');
    }
    const here = me[3] === d.map.id;
    const dist = here ? Math.round(Math.hypot(me[0] - this.cx, me[1] - this.cy)) : -1;
    const where = !here ? t('mapOther') : dist < 3 ? t('mapHere') : tf('mapAway', String(dist));
    const text = `<b>${esc(d.map.name)}</b> · ${Math.round(this.cx)}, ${Math.round(this.cy)} · ${esc(where)}${what ? ` · <span class="mw">${esc(what)}</span>` : ''}`;
    if (text !== this.infoText && this.infoEl) { this.infoText = text; this.infoEl.innerHTML = text; }
  }
}
