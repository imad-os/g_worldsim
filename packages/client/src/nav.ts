/**
 * Finding the way (imad 2026-11-26): the compass bar on top of the screen (a line with white icons of home, the gates, the
 * camp, my horse, my partner and my saved marks, where they lie from where I look), names over people's heads, and riding
 * by yourself along a road the server worked out (Do `rideTo`).
 * Everything here is built once; per frame only transforms / opacity change (Chromium 108, locked 60 fps).
 */

/** White line icons (24 x 24 view box). */
const ICON: Record<string, string> = {
  home: 'M3 11 12 3l9 8v10h-6v-6H9v6H3z',
  camp: 'M12 2c1 4 6 6 6 12a6 6 0 0 1-12 0c0-3 2-5 3-7 0 2 1 3 2 3 0-3 0-6 1-8z',
  gate: 'M3 22V9a9 7 0 0 1 18 0v13h-4V10a5 4 0 0 0-10 0v12z',
  horse: 'M5 21l3-8-3-3 4-6 2 3 5-2 4 4-2 2-3-1-1 4 2 7h-3l-2-5-3 1-1 4z',
  partner: 'M12 21s-8-5-8-11a4.5 4.5 0 0 1 8-3 4.5 4.5 0 0 1 8 3c0 6-8 11-8 11z',
  mark: 'M12 22s-7-7-7-12a7 7 0 0 1 14 0c0 5-7 12-7 12zm0-9a3 3 0 1 0 0-6 3 3 0 0 0 0 6z',
  star: 'M12 2l3 7h7l-5.5 4.5L18.5 21 12 16.5 5.5 21l2-7.5L2 9h7z',
  danger: 'M12 2 1 21h22zm-1 7h2v6h-2zm0 8h2v2h-2z',
};
function iconOf(kind: string): string {
  if (kind.startsWith('mark:')) { const k = kind.slice(5); return ICON[k === 'star' || k === 'danger' || k === 'home' || k === 'camp' ? k : 'mark']!; }
  return ICON[kind] ?? ICON.mark!;
}
const svg = (d: string) => `<svg viewBox="0 0 24 24"><path d="${d}"/></svg>`;

export type CompassRow = [kind: string, label: string, x: number, y: number, d: number, via: string];

/** Half the field the bar covers either side of where I look (radians). */
const HALF = (100 * Math.PI) / 180;

export class Compass {
  private readonly el: HTMLDivElement;
  private readonly strip: HTMLDivElement;
  private items: { el: HTMLDivElement; d: HTMLSpanElement; row: CompassRow; lx: number; lo: number }[] = [];
  private readonly ticks: { el: HTMLElement; a: number; lx: number }[] = [];
  private shown = true;

  constructor() {
    this.el = document.createElement('div'); this.el.id = 'compass';
    this.strip = document.createElement('div'); this.strip.className = 'cp-in';
    this.el.appendChild(this.strip);
    // Cardinal letters and small ticks (server angles: 0 = east, y down, so north = -90°).
    const card: [string, number][] = [['N', -90], ['E', 0], ['S', 90], ['W', 180]];
    for (let a = -180; a < 180; a += 15) {
      const c = card.find(([, v]) => v === a), t = document.createElement(c ? 'b' : 'i');
      t.className = c ? 'cp-c' : a % 45 === 0 ? 'cp-t big' : 'cp-t';
      if (c) t.textContent = c[0];
      this.strip.appendChild(t);
      this.ticks.push({ el: t, a: (a * Math.PI) / 180, lx: 1e9 });
    }
    document.body.appendChild(this.el);
  }

  show(on: boolean): void { if (on !== this.shown) { this.shown = on; this.el.hidden = !on; } }

  /** New places from the server (rebuilt only when the list changes shape). */
  set(rows: CompassRow[], names: (kind: string, label: string) => string): void {
    const same = rows.length === this.items.length && rows.every((r, k) => this.items[k]!.row[0] === r[0] && this.items[k]!.row[1] === r[1]);
    if (!same) {
      for (const it of this.items) it.el.remove();
      this.items = rows.map((row) => {
        const el = document.createElement('div'); el.className = 'cp-i ' + (row[0].startsWith('mark:') ? 'mark' : row[0]);
        el.innerHTML = svg(iconOf(row[0]));
        el.title = names(row[0], row[1]);
        const d = document.createElement('span'); el.appendChild(d);
        this.strip.appendChild(el);
        return { el, d, row, lx: 1e9, lo: -1 };
      });
    }
    rows.forEach((r, k) => {
      const it = this.items[k]!;
      it.row = r;
    });
  }

  /** Per frame: I am at (x, y) looking along `fwd` (server angle). */
  draw(x: number, y: number, fwd: number, width: number): void {
    if (!this.shown) return;
    const half = width / 2;
    for (const t of this.ticks) {
      let d = t.a - fwd; d = Math.atan2(Math.sin(d), Math.cos(d));
      const px = Math.abs(d) > HALF ? -1e4 : Math.round((d / HALF) * half);
      if (px !== t.lx) { t.lx = px; t.el.style.transform = `translateX(${px}px)`; }
    }
    for (const it of this.items) {
      const r = it.row, dist = Math.hypot(r[2] - x, r[3] - y);
      let d = Math.atan2(r[3] - y, r[2] - x) - fwd; d = Math.atan2(Math.sin(d), Math.cos(d));
      const out = Math.abs(d) > HALF, px = Math.round((Math.max(-HALF, Math.min(HALF, d)) / HALF) * half);
      const op = out ? 0.35 : dist < 6 ? 0.55 : 1;
      if (px !== it.lx) { it.lx = px; it.el.style.transform = `translateX(${px}px)`; }
      if (op !== it.lo) { it.lo = op; it.el.style.opacity = String(op); }
      const txt = dist >= 1000 ? `${(dist / 1000).toFixed(1)} km` : `${Math.round(dist)} m`;
      if (it.d.textContent !== txt) it.d.textContent = txt;
    }
  }
}

/** Names over heads: a small pool of labels for the nearest people in view. */
export class Names {
  private readonly box: HTMLDivElement;
  private readonly pool: { el: HTMLDivElement; id: number; lx: number; ly: number }[] = [];
  private readonly cand: { id: number; x: number; y: number; d: number; h: number }[] = Array.from({ length: 64 }, () => ({ id: -1, x: 0, y: 0, d: 0, h: 0 }));
  private readonly pt = { x: 0, y: 0 };
  readonly names = new Map<number, string>();

  constructor(max = 14) {
    this.box = document.createElement('div'); this.box.id = 'names';
    for (let k = 0; k < max; k++) {
      const el = document.createElement('div'); el.className = 'nm'; el.hidden = true;
      this.box.appendChild(el);
      this.pool.push({ el, id: -1, lx: 0, ly: 0 });
    }
    document.body.appendChild(this.box);
  }
  add(rows: [number, string][]): void { for (const [id, n] of rows) this.names.set(id, n); }
  hide(): void { for (const p of this.pool) if (!p.el.hidden) { p.el.hidden = true; p.id = -1; } }

  /** `each(fn)` calls fn(id, x, y) for every person drawn this frame; `project` = world (x, height, z) to screen pixels. */
  draw(each: (fn: (id: number, x: number, y: number, h: number) => void) => void, project: (x: number, h: number, z: number, out: { x: number; y: number }) => boolean, fx: number, fy: number, range: number): void {
    let n = 0;
    each((id, x, y, h) => {
      if (n >= this.cand.length || !this.names.has(id)) return;
      const d = Math.hypot(x - fx, y - fy);
      if (d > range) return;
      const c = this.cand[n++]!; c.id = id; c.x = x; c.y = y; c.d = d; c.h = h;
    });
    let k = 0;
    for (; k < this.pool.length && k < n; k++) {
      let best = k;
      for (let j = k + 1; j < n; j++) if (this.cand[j]!.d < this.cand[best]!.d) best = j;
      if (best !== k) { const t = this.cand[k]!; this.cand[k] = this.cand[best]!; this.cand[best] = t; }
      const c = this.cand[k]!, p = this.pool[k]!;
      if (!project(c.x, c.h, c.y, this.pt)) { p.el.hidden = true; p.id = -1; continue; }
      if (p.id !== c.id) { p.id = c.id; p.el.textContent = this.names.get(c.id) ?? ''; }
      p.el.hidden = false;
      const rx = Math.round(this.pt.x), ry = Math.round(this.pt.y);
      if (rx !== p.lx || ry !== p.ly) { p.lx = rx; p.ly = ry; p.el.style.transform = `translate(${rx}px, ${ry}px) translate(-50%, -100%)`; }
    }
    for (; k < this.pool.length; k++) if (!this.pool[k]!.el.hidden) { this.pool[k]!.el.hidden = true; this.pool[k]!.id = -1; }
  }
}

/** Riding by yourself along the server's road for this map (a list of points); the stick, when touched, takes over. */
export class AutoRide {
  pts: [number, number][] = [];
  k = 0;
  gate = false;
  full = true;
  map = '';
  asked = 0;
  private best = Infinity;
  private bestAt = 0;
  fails = 0;
  constructor(readonly id: string, readonly label: string) {}

  load(pts: [number, number][], gate: boolean, full: boolean, map: string, now: number): void {
    this.pts = pts; this.k = 0; this.gate = gate; this.full = full; this.map = map; this.best = Infinity; this.bestAt = now;
  }
  /**
   * Where to push the stick (unit vector) from (x, y), or a word: 'ask' (the road ran out / I got stuck: ask again),
   * 'arrived', 'wait' (no road yet).
   */
  steer(x: number, y: number, now: number, out: [number, number]): 'go' | 'ask' | 'arrived' | 'wait' {
    if (!this.pts.length) return 'wait';
    while (this.k < this.pts.length - 1 && Math.hypot(this.pts[this.k]![0] - x, this.pts[this.k]![1] - y) < 1.6) { this.k++; this.best = Infinity; this.bestAt = now; this.fails = 0; }
    const [tx, ty] = this.pts[this.k]!, d = Math.hypot(tx - x, ty - y);
    const last = this.k === this.pts.length - 1;
    if (last && !this.gate && d < (this.full ? 2.5 : 3)) return this.full ? 'arrived' : 'ask';
    if (d < this.best - 0.3) { this.best = d; this.bestAt = now; }
    else if (now - this.bestAt > 2500) return 'ask'; // not getting closer: stuck on something
    // Look a little ahead: aim between this point and the next so turns are smooth.
    let ax = tx, ay = ty;
    if (!last && d < 4) { const [nx, ny] = this.pts[this.k + 1]!; const f = 1 - d / 4; ax = tx + (nx - tx) * f * 0.5; ay = ty + (ny - ty) * f * 0.5; }
    const l = Math.hypot(ax - x, ay - y) || 1;
    out[0] = (ax - x) / l; out[1] = (ay - y) / l;
    return 'go';
  }
}
