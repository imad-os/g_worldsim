import type { TileMap } from './tilemap.js';

/**
 * A* on a map's tile grid (8 directions, no corner cutting, tile costs from the scenario: roads are cheaper, rubble
 * dearer), then string pulling so people walk straight lines instead of tile steps. One instance per map; its
 * buffers are allocated once and reused (a visit stamp avoids clearing them). A node budget keeps one search
 * cheap: past it, the path goes to the explored tile closest to the goal.
 */
const SQ2 = Math.SQRT2;
const DX = [1, -1, 0, 0, 1, 1, -1, -1];
const DY = [0, 0, 1, -1, 1, -1, 1, -1];

export class Pathfinder {
  private readonly w: number;
  private readonly h: number;
  private readonly g: Float32Array;
  private readonly parent: Int32Array;
  private readonly seen: Uint32Array;
  private readonly closed: Uint32Array;
  private stamp = 0;
  private heap: Int32Array;
  private heapF: Float32Array;
  private hn = 0;
  private readonly minCost: number;
  readonly out: Int32Array; // tile indexes of the last path (after smoothing)
  outN = 0;
  /** Nodes expanded by the last search (stats / tests). */
  expanded = 0;

  constructor(private readonly t: TileMap, readonly maxNodes = 6000, maxOut = 64) {
    this.w = t.w; this.h = t.h;
    const n = t.w * t.h;
    this.g = new Float32Array(n); this.parent = new Int32Array(n);
    this.seen = new Uint32Array(n); this.closed = new Uint32Array(n);
    this.heap = new Int32Array(1024); this.heapF = new Float32Array(1024);
    let mc = Infinity;
    for (let k = 0; k < 256; k++) if (t.cost[k]! > 0) mc = Math.min(mc, t.cost[k]!);
    this.minCost = Number.isFinite(mc) ? mc : 1;
    this.out = new Int32Array(maxOut);
  }

  private costAt(tx: number, ty: number): number {
    if (tx < 0 || ty < 0 || tx >= this.w || ty >= this.h) return 0;
    return this.t.cost[this.t.tiles[ty * this.w + tx]!]!;
  }
  walkable(tx: number, ty: number): boolean { return this.costAt(tx, ty) > 0; }

  /**
   * Path from (sx, sy) to (gx, gy) in metres. Fills `out` with waypoint tile indexes (the start excluded, the
   * goal's tile last). Returns 'full' (reaches the goal), 'partial' (closest reachable point) or 'none'.
   */
  find(sx: number, sy: number, gx: number, gy: number): 'full' | 'partial' | 'none' {
    const W = this.w;
    let stx = Math.floor(sx), sty = Math.floor(sy);
    const gtx = Math.floor(gx), gty = Math.floor(gy);
    this.outN = 0; this.expanded = 0;
    if (stx < 0 || sty < 0 || stx >= W || sty >= this.h) return 'none';
    if (!this.walkable(stx, sty)) {
      // Standing on the edge of a solid tile (bodies are round): start from the nearest open neighbour.
      let found = false;
      for (let d = 0; d < 8 && !found; d++) if (this.walkable(stx + DX[d]!, sty + DY[d]!)) { stx += DX[d]!; sty += DY[d]!; found = true; }
      if (!found) return 'none';
    }
    const start = sty * W + stx, goal = gty * W + gtx;
    if (++this.stamp === 0xffffffff) { this.seen.fill(0); this.closed.fill(0); this.stamp = 1; }
    const st = this.stamp;
    this.hn = 0;
    this.g[start] = 0; this.parent[start] = -1; this.seen[start] = st;
    this.push(start, this.hdist(stx, sty, gtx, gty));
    let best = start, bestH = Infinity, reached = false;
    while (this.hn > 0) {
      const cur = this.pop();
      if (this.closed[cur] === st) continue;
      this.closed[cur] = st;
      const cx = cur % W, cy = (cur / W) | 0;
      const hh = this.hdist(cx, cy, gtx, gty);
      if (hh < bestH) { bestH = hh; best = cur; }
      if (cur === goal) { reached = true; break; }
      if (++this.expanded >= this.maxNodes) break;
      for (let d = 0; d < 8; d++) {
        const nx = cx + DX[d]!, ny = cy + DY[d]!;
        const c = this.costAt(nx, ny);
        if (c <= 0) continue;
        if (d >= 4 && (this.costAt(nx, cy) <= 0 || this.costAt(cx, ny) <= 0)) continue; // no corner cutting
        const ni = ny * W + nx;
        if (this.closed[ni] === st) continue;
        const ng = this.g[cur]! + c * (d >= 4 ? SQ2 : 1);
        if (this.seen[ni] === st && ng >= this.g[ni]!) continue;
        this.seen[ni] = st; this.g[ni] = ng; this.parent[ni] = cur;
        this.push(ni, ng + this.hdist(nx, ny, gtx, gty));
      }
    }
    const end = reached ? goal : best;
    if (end === start) return reached ? 'full' : 'none';
    this.smooth(start, end);
    return reached ? 'full' : 'partial';
  }

  /** Octile distance times the cheapest tile cost (admissible). */
  private hdist(ax: number, ay: number, bx: number, by: number): number {
    const dx = Math.abs(ax - bx), dy = Math.abs(ay - by);
    return (Math.max(dx, dy) + (SQ2 - 1) * Math.min(dx, dy)) * this.minCost;
  }

  /** Keep only the turns: from each kept point, jump to the farthest point still in a clear straight line. */
  private smooth(start: number, end: number): void {
    // Walk back from the end into a temporary list (reuses `heap` as scratch).
    let n = 0;
    for (let c = end; c !== -1 && c !== start; c = this.parent[c]!) {
      if (n >= this.heap.length) this.grow();
      this.heap[n++] = c;
    }
    // heap[n-1] is the first step after the start, heap[0] the end.
    const W = this.w;
    let from = start, k = n - 1;
    this.outN = 0;
    while (k >= 0) {
      let far = k;
      const fx = (from % W) + 0.5, fy = ((from / W) | 0) + 0.5;
      for (let j = Math.max(0, k - 40); j <= k; j++) { // try the farthest first (up to 40 steps ahead)
        const c = this.heap[j]!;
        if (this.clear(fx, fy, (c % W) + 0.5, ((c / W) | 0) + 0.5)) { far = j; break; }
      }
      if (this.outN >= this.out.length) break; // very long path: the walker replans when it runs out
      this.out[this.outN++] = this.heap[far]!;
      from = this.heap[far]!;
      k = far - 1;
    }
  }

  /** Straight line clear of solid tiles for a body of ~0.35 m (sampled every 0.25 m, both sides). */
  clear(ax: number, ay: number, bx: number, by: number): boolean {
    const dx = bx - ax, dy = by - ay, len = Math.hypot(dx, dy);
    const steps = Math.max(1, Math.ceil(len / 0.25));
    const px = (-dy / (len || 1)) * 0.35, py = (dx / (len || 1)) * 0.35;
    for (let s = 0; s <= steps; s++) {
      const x = ax + (dx * s) / steps, y = ay + (dy * s) / steps;
      if (!this.walkable(Math.floor(x), Math.floor(y)) || !this.walkable(Math.floor(x + px), Math.floor(y + py)) ||
        !this.walkable(Math.floor(x - px), Math.floor(y - py))) return false;
    }
    return true;
  }

  private push(node: number, f: number): void {
    if (this.hn >= this.heap.length) this.grow();
    let i = this.hn++;
    while (i > 0) {
      const p = (i - 1) >> 1;
      if (this.heapF[p]! <= f) break;
      this.heap[i] = this.heap[p]!; this.heapF[i] = this.heapF[p]!; i = p;
    }
    this.heap[i] = node; this.heapF[i] = f;
  }
  private pop(): number {
    const top = this.heap[0]!;
    const n = --this.hn;
    if (n > 0) {
      const node = this.heap[n]!, f = this.heapF[n]!;
      let i = 0;
      for (;;) {
        let c = 2 * i + 1;
        if (c >= n) break;
        if (c + 1 < n && this.heapF[c + 1]! < this.heapF[c]!) c++;
        if (this.heapF[c]! >= f) break;
        this.heap[i] = this.heap[c]!; this.heapF[i] = this.heapF[c]!; i = c;
      }
      this.heap[i] = node; this.heapF[i] = f;
    }
    return top;
  }
  private grow(): void {
    const h = new Int32Array(this.heap.length * 2); h.set(this.heap); this.heap = h;
    const f = new Float32Array(this.heapF.length * 2); f.set(this.heapF); this.heapF = f;
  }
}
