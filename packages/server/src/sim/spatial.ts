import type { Entities } from './entities.js';

/**
 * Uniform spatial hash grid for one map (linked lists in typed arrays, rebuilt every tick in O(n),
 * no allocation). Queries write slot numbers into a caller-owned Int32Array.
 */
export class SpatialGrid {
  readonly cell: number;
  readonly gw: number;
  readonly gh: number;
  private readonly head: Int32Array;
  private readonly next: Int32Array;

  constructor(widthM: number, heightM: number, cap: number, cell = 4) {
    this.cell = cell;
    this.gw = Math.ceil(widthM / cell);
    this.gh = Math.ceil(heightM / cell);
    this.head = new Int32Array(this.gw * this.gh).fill(-1);
    this.next = new Int32Array(cap).fill(-1);
  }

  rebuild(e: Entities, mapIndex: number): void {
    this.head.fill(-1);
    const { gw, gh, cell, head, next } = this;
    for (let i = 0; i < e.hi; i++) {
      if (e.kind[i] === 0 || e.map[i] !== mapIndex) continue;
      let cx = (e.x[i]! / cell) | 0, cy = (e.y[i]! / cell) | 0;
      if (cx < 0) cx = 0; else if (cx >= gw) cx = gw - 1;
      if (cy < 0) cy = 0; else if (cy >= gh) cy = gh - 1;
      const c = cy * gw + cx;
      next[i] = head[c]!;
      head[c] = i;
    }
  }

  /** Slots within `r` metres of (x, y) (circle test on centres). Returns how many were written. */
  queryCircle(e: Entities, x: number, y: number, r: number, out: Int32Array): number {
    const { gw, gh, cell, head, next } = this;
    const x0 = Math.max(0, ((x - r) / cell) | 0), x1 = Math.min(gw - 1, ((x + r) / cell) | 0);
    const y0 = Math.max(0, ((y - r) / cell) | 0), y1 = Math.min(gh - 1, ((y + r) / cell) | 0);
    const r2 = r * r;
    let n = 0;
    for (let cy = y0; cy <= y1; cy++) {
      for (let cx = x0; cx <= x1; cx++) {
        for (let i = head[cy * gw + cx]!; i !== -1; i = next[i]!) {
          const dx = e.x[i]! - x, dy = e.y[i]! - y;
          if (dx * dx + dy * dy <= r2) {
            if (n >= out.length) return n;
            out[n++] = i;
          }
        }
      }
    }
    return n;
  }

  /** Slots whose centre is inside the rectangle. */
  queryRect(e: Entities, x0m: number, y0m: number, x1m: number, y1m: number, out: Int32Array): number {
    const { gw, gh, cell, head, next } = this;
    const x0 = Math.max(0, (x0m / cell) | 0), x1 = Math.min(gw - 1, (x1m / cell) | 0);
    const y0 = Math.max(0, (y0m / cell) | 0), y1 = Math.min(gh - 1, (y1m / cell) | 0);
    let n = 0;
    for (let cy = y0; cy <= y1; cy++) {
      for (let cx = x0; cx <= x1; cx++) {
        for (let i = head[cy * gw + cx]!; i !== -1; i = next[i]!) {
          const px = e.x[i]!, py = e.y[i]!;
          if (px >= x0m && px <= x1m && py >= y0m && py <= y1m) {
            if (n >= out.length) return n;
            out[n++] = i;
          }
        }
      }
    }
    return n;
  }
}
