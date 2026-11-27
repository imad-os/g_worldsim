// Pictures of every generated map (tile colours; gates magenta, arrival points cyan) + tile counts.
// Usage: node tools/map-dump.mjs <outdir>   (after npm run build). Writes <map id>.png.
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const { loadScenario } = await import(path.join(root, 'packages/server/dist/sim/scenario.js'));
const { World } = await import(path.join(root, 'packages/server/dist/sim/world.js'));
const out = process.argv[2] ?? 'map-dump';
fs.mkdirSync(out, { recursive: true });
const sc = loadScenario(path.join(root, 'scenarios/post-apocalypse'));
const w = new World(sc, { tickRate: 30, clockScale: 30, capacity: 4096 });
w.land.setup();

const crcT = new Int32Array(256).map((_, n) => { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; return c; });
const crc = (b) => { let c = -1; for (const x of b) c = crcT[(c ^ x) & 255] ^ (c >>> 8); return (c ^ -1) >>> 0; };
const chunk = (type, data) => { const len = Buffer.alloc(4); len.writeUInt32BE(data.length); const td = Buffer.concat([Buffer.from(type), data]); const c = Buffer.alloc(4); c.writeUInt32BE(crc(td)); return Buffer.concat([len, td, c]); };
function png(wd, ht, rgb, scale) {
  const W = wd * scale, H = ht * scale, raw = Buffer.alloc((W * 3 + 1) * H);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const s = (((y / scale) | 0) * wd + ((x / scale) | 0)) * 3; rgb.copy(raw, y * (W * 3 + 1) + 1 + x * 3, s, s + 3); }
  const ih = Buffer.alloc(13); ih.writeUInt32BE(W); ih.writeUInt32BE(H, 4); ih[8] = 8; ih[9] = 2;
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ih), chunk('IDAT', zlib.deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]);
}
const cols = {}; for (const t of sc.tiles) cols[t.id] = t.color;
for (const mp of w.maps) {
  const t = mp.tiles, buf = Buffer.alloc(t.w * t.h * 3), cnt = {};
  for (let k = 0; k < t.tiles.length; k++) { const c = cols[t.tiles[k]] ?? 0; buf[k * 3] = c >> 16; buf[k * 3 + 1] = (c >> 8) & 255; buf[k * 3 + 2] = c & 255; cnt[t.tiles[k]] = (cnt[t.tiles[k]] ?? 0) + 1; }
  for (const p of w.portals) for (const [m, x, y, c] of [[p.from, p.x, p.y, [255, 0, 255]], [p.dest, p.toX, p.toY, [0, 255, 255]]]) {
    if (m !== mp.index) continue;
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const k = (Math.floor(y) + dy) * t.w + Math.floor(x) + dx; if (k >= 0 && k < t.tiles.length) buf.set(c, k * 3); }
  }
  fs.writeFileSync(path.join(out, `${mp.def.id}.png`), png(t.w, t.h, buf, 3));
  console.log(mp.def.id.padEnd(6), mp.def.name.padEnd(18), Object.entries(cnt).map(([k, v]) => `${sc.tiles.find((x) => x.id == k)?.name}:${v}`).join(' '));
}
for (const p of w.portals) console.log(`${p.id.padEnd(12)} ${w.maps[p.from].def.id} (${p.x}, ${p.y}) -> ${w.maps[p.dest].def.id} (${p.toX}, ${p.toY})`);
