import { Msg, CHUNK_TILES, ENT_REC, POS_Q, ANG_Q, unpackI32, chunkKey, type Welcome, type ServerMsg } from '@worldsim/protocol';
import { Conn } from './conn.js';

/**
 * Developer view (milestone 1-2): proves the server pipe end to end. Draws the streamed chunks
 * (one cached canvas each) and the entities, interpolated between network frames, in one fixed
 * 60 Hz rAF loop with no allocation per frame. The real viewer (PixiJS, My PC app) is milestone 4.
 * URL: debug.html?token=...&map=town&x=128&y=128
 */
const q = new URLSearchParams(location.search);
const canvas = document.getElementById('c') as HTMLCanvasElement;
const ctx = canvas.getContext('2d', { alpha: false })!;
const hud = document.getElementById('hud')!;
const proto = location.protocol === 'https:' ? 'wss:' : 'ws:';
const conn = new Conn(q.get('ws') ?? `${proto}//${location.host}/ws`, q.get('token') ?? '', 'debug');

let welcome: Welcome | null = null;
const colors = new Map<number, string>();
const chunks = new Map<number, HTMLCanvasElement>();
let map = q.get('map') ?? 'town';
let camX = Number(q.get('x') ?? 128), camY = Number(q.get('y') ?? 128), zoom = 8; // px per metre

// Entities: id -> slot in typed arrays (prev / next positions for interpolation).
const CAP = 4096;
const eid = new Int32Array(CAP).fill(-1);
const kind = new Uint8Array(CAP), flags = new Uint8Array(CAP);
const px = new Float32Array(CAP), py = new Float32Array(CAP), nx = new Float32Array(CAP), ny = new Float32Array(CAP), ang = new Float32Array(CAP);
const slotOf = new Map<number, number>();
let frameAt = 0, frameGap = 100, frames = 0, fps = 0, fpsAt = 0, fpsN = 0;
let stats = '';

function slotFor(id: number): number {
  let s = slotOf.get(id);
  if (s !== undefined) return s;
  for (let i = 0; i < CAP; i++) if (eid[i] === -1) { eid[i] = id; slotOf.set(id, i); return i; }
  return -1;
}

function onMsg(m: ServerMsg): void {
  switch (m.t) {
    case Msg.Welcome:
      welcome = m;
      for (const t of m.tiles) colors.set(t.id, '#' + t.color.toString(16).padStart(6, '0'));
      sendView();
      break;
    case Msg.Chunk: {
      if (m.map !== map) break;
      const cv = document.createElement('canvas');
      cv.width = cv.height = CHUNK_TILES;
      const c2 = cv.getContext('2d')!;
      for (let i = 0; i < m.tiles.length; i++) {
        c2.fillStyle = colors.get(m.tiles[i]!) ?? '#000';
        c2.fillRect(i % CHUNK_TILES, (i / CHUNK_TILES) | 0, 1, 1);
      }
      chunks.set(chunkKey(m.cx, m.cy), cv);
      break;
    }
    case Msg.ChunkDrop:
      for (const k of m.keys) chunks.delete(k);
      break;
    case Msg.Frame: {
      const now = performance.now();
      frameGap = frameGap * 0.8 + Math.min(500, now - frameAt) * 0.2;
      frameAt = now;
      frames++;
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
      for (const id of m.del) { const s = slotOf.get(id); if (s !== undefined) { eid[s] = -1; kind[s] = 0; slotOf.delete(id); } }
      break;
    }
    case Msg.Stats:
      stats = `tick ${m.s.tick}  tps ${m.s.tps.toFixed(0)}  x${m.s.speed}  agents ${m.s.agents}  tick ${m.s.tickMsAvg.toFixed(2)} ms  ${m.s.rssMb.toFixed(0)} MB`;
      break;
    case Msg.Error:
      stats = 'error: ' + m.code;
      break;
  }
}

function sendView(): void { conn.send({ t: Msg.View, map, x: camX, y: camY, r: Math.max(canvas.width, canvas.height) / zoom / 2 + 8 }); }

const keys = new Set<string>();
addEventListener('keydown', (e) => {
  keys.add(e.key);
  if (e.key === 'm' && welcome) { const i = welcome.maps.findIndex((x) => x.id === map); map = welcome.maps[(i + 1) % welcome.maps.length]!.id; chunks.clear(); slotOf.clear(); eid.fill(-1); kind.fill(0); sendView(); }
  if (e.key === '+' || e.key === '=') zoom = Math.min(32, zoom * 1.25);
  if (e.key === '-') zoom = Math.max(2, zoom / 1.25);
});
addEventListener('keyup', (e) => keys.delete(e.key));

function resize(): void { canvas.width = innerWidth; canvas.height = innerHeight; ctx.imageSmoothingEnabled = false; }
addEventListener('resize', resize);
resize();

const STEP = 1000 / 60;
let last = 0, acc = 0, viewAt = 0;
function update(): void {
  const sp = 40 / zoom;
  if (keys.has('ArrowLeft')) camX -= sp; if (keys.has('ArrowRight')) camX += sp;
  if (keys.has('ArrowUp')) camY -= sp; if (keys.has('ArrowDown')) camY += sp;
}
function draw(now: number): void {
  ctx.fillStyle = '#111';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  const ox = canvas.width / 2 - camX * zoom, oy = canvas.height / 2 - camY * zoom;
  for (const [k, cv] of chunks) {
    const cx = k & 0xffff, cy = k >>> 16;
    ctx.drawImage(cv, ox + cx * CHUNK_TILES * zoom, oy + cy * CHUNK_TILES * zoom, CHUNK_TILES * zoom, CHUNK_TILES * zoom);
  }
  const a = Math.min(1.5, (now - frameAt) / frameGap);
  for (let i = 0; i < CAP; i++) {
    if (eid[i] === -1) continue;
    const x = px[i]! + (nx[i]! - px[i]!) * a, y = py[i]! + (ny[i]! - py[i]!) * a;
    const sx = ox + x * zoom, sy = oy + y * zoom;
    if (kind[i] === 2) { ctx.fillStyle = '#ff0'; ctx.fillRect(sx - 1, sy - 1, 3, 3); continue; }
    ctx.fillStyle = flags[i]! & 4 ? '#8ab' : '#f84';
    ctx.beginPath(); ctx.arc(sx, sy, Math.max(2, 0.3 * zoom), 0, 6.283); ctx.fill();
    ctx.strokeStyle = '#000'; ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(sx + Math.cos(ang[i]!) * 0.5 * zoom, sy + Math.sin(ang[i]!) * 0.5 * zoom); ctx.stroke();
  }
  if (welcome) for (const p of welcome.portals) if (p.map === map) {
    ctx.strokeStyle = '#4ff'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(ox + p.x * zoom, oy + p.y * zoom, 2 * zoom, 0, 6.283); ctx.stroke(); ctx.lineWidth = 1;
  }
}
function frame(ts: number): void {
  requestAnimationFrame(frame);
  if (!last) last = ts;
  acc += Math.min(250, ts - last); last = ts;
  while (acc >= STEP) { update(); acc -= STEP; }
  draw(ts);
  if (ts - viewAt > 250) { viewAt = ts; sendView(); }
  fpsN++;
  if (ts - fpsAt >= 1000) { fps = fpsN; fpsN = 0; fpsAt = ts; hud.textContent = `${map}  ${fps} fps  net ${frames} frames  |  ${stats}`; frames = 0; }
}

conn.onMsg = onMsg;
conn.onState = (s, why) => { if (s !== 'open') hud.textContent = s + (why ? ': ' + why : ''); };
conn.open();
requestAnimationFrame(frame);
