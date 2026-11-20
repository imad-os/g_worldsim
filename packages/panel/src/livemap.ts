import { cmd } from './api.js';

/** The live map: the map's tiles drawn once (one pixel per tile, scaled up), then what moves on it, every few seconds. */
type Tiles = { id: string; name: string; w: number; h: number; tiles: Uint8Array; colors: number[]; names: string[] };
export type Live = { map: string; people: [number, number, number, number, number][]; players: [string, number, number, number][]; zombies: [number, number][];
  animals: [number, number, number][]; items: [number, number][]; fires: number[][]; camp: [number, number] | null; portals: [string, number, number][] };

const cache = new Map<string, HTMLCanvasElement>();
const ANIMAL = ['#c8b08a', '#a8743a', '#5a4030', '#9aa3ad', '#3d2b1f'];

export class LiveMap {
  live: Live | null = null;
  private base: HTMLCanvasElement | null = null;
  private w = 0; private h = 0;
  private hover: { x: number; y: number; text: string } | null = null;
  names = new Map<number, string>();
  onPick: (id: number) => void = () => {};

  constructor(private canvas: HTMLCanvasElement, private tip: HTMLElement) {
    canvas.addEventListener('mousemove', (ev) => this.pointer(ev, false));
    canvas.addEventListener('mouseleave', () => { this.hover = null; this.tip.hidden = true; });
    canvas.addEventListener('click', (ev) => this.pointer(ev, true));
  }

  async show(map: string): Promise<void> {
    let b = cache.get(map);
    if (!b) {
      const t = await cmd<Tiles>({ cmd: 'mapTiles', map });
      b = document.createElement('canvas'); b.width = t.w; b.height = t.h;
      const g = b.getContext('2d')!, img = g.createImageData(t.w, t.h);
      const tiles = t.tiles instanceof Uint8Array ? t.tiles : new Uint8Array(t.tiles as ArrayLike<number>);
      for (let i = 0; i < tiles.length; i++) {
        const c = t.colors[tiles[i]!] ?? 0x333333, o = i * 4;
        img.data[o] = (c >> 16) & 255; img.data[o + 1] = (c >> 8) & 255; img.data[o + 2] = c & 255; img.data[o + 3] = 255;
      }
      g.putImageData(img, 0, 0);
      cache.set(map, b);
    }
    this.base = b; this.w = b.width; this.h = b.height;
    this.live = await cmd<Live>({ cmd: 'live', map });
    this.draw();
  }
  async refresh(map: string): Promise<void> { this.live = await cmd<Live>({ cmd: 'live', map }); this.draw(); }

  draw(): void {
    const c = this.canvas, box = c.parentElement!, dpr = Math.min(2, window.devicePixelRatio || 1);
    const cw = box.clientWidth, ch = Math.round(cw * (this.h / Math.max(1, this.w)));
    if (c.width !== Math.round(cw * dpr)) { c.width = Math.round(cw * dpr); c.height = Math.round(ch * dpr); c.style.height = ch + 'px'; }
    const g = c.getContext('2d')!, s = (cw * dpr) / Math.max(1, this.w);
    g.imageSmoothingEnabled = false;
    if (this.base) g.drawImage(this.base, 0, 0, c.width, c.height);
    g.fillStyle = 'rgba(10,14,20,0.25)'; g.fillRect(0, 0, c.width, c.height);
    const L = this.live; if (!L) return;
    const dot = (x: number, y: number, r: number, fill: string, ring = '') => {
      g.beginPath(); g.arc(x * s, y * s, r * dpr, 0, Math.PI * 2); g.fillStyle = fill; g.fill();
      if (ring) { g.lineWidth = 1.5 * dpr; g.strokeStyle = ring; g.stroke(); }
    };
    if (L.camp) { g.beginPath(); g.arc(L.camp[0] * s, L.camp[1] * s, 9 * dpr, 0, Math.PI * 2); g.lineWidth = 2 * dpr; g.strokeStyle = '#3ecf8e'; g.stroke(); }
    for (const p of L.portals) { g.fillStyle = '#b388ff'; g.fillRect(p[1] * s - 4 * dpr, p[2] * s - 4 * dpr, 8 * dpr, 8 * dpr); }
    for (const f of L.fires) dot(f[0]! + 0.5, f[1]! + 0.5, 4, '#ff8a3d', '#ffd166');
    for (const it of L.items) dot(it[0], it[1], 1.6, '#e7c66b');
    for (const a of L.animals) dot(a[1], a[2], 2.6, ANIMAL[a[0]] ?? '#a8743a', 'rgba(0,0,0,.5)');
    for (const z of L.zombies) dot(z[0], z[1], 4.5, '#ff5252', '#ffffff');
    for (const p of L.people) dot(p[1], p[2], p[3] & 32 ? 4 : 5, '#38bdf8', '#ffffff');
    for (const p of L.players) dot(p[1], p[2], 5.5, p[3] ? '#ffd166' : '#8a7440', '#ffffff');
  }

  private pointer(ev: MouseEvent, click: boolean): void {
    const L = this.live; if (!L) return;
    const r = this.canvas.getBoundingClientRect(), s = r.width / Math.max(1, this.w);
    const mx = (ev.clientX - r.left) / s, my = (ev.clientY - r.top) / s, near = 10 / s;
    let best = '', bd = near, id = -1;
    for (const p of L.people) { const d = Math.hypot(p[1] - mx, p[2] - my); if (d < bd) { bd = d; best = this.names.get(p[0]) ?? `#${p[0] & 0xffff}`; id = p[0]; } }
    for (const p of L.players) { const d = Math.hypot(p[1] - mx, p[2] - my); if (d < bd) { bd = d; best = `${p[0]} (player${p[3] ? '' : ', away'})`; id = -1; } }
    for (const z of L.zombies) { const d = Math.hypot(z[0] - mx, z[1] - my); if (d < bd) { bd = d; best = 'Zombie'; id = -1; } }
    if (!best) { this.tip.hidden = true; return; }
    if (click && id >= 0) { this.onPick(id); return; }
    this.tip.hidden = false; this.tip.textContent = best;
    this.tip.style.left = ev.clientX - r.left + 12 + 'px'; this.tip.style.top = ev.clientY - r.top - 10 + 'px';
  }
}
