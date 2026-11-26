/**
 * Builds chunk meshes away from the game (imad 2026-11-26, 60 fps): one forest chunk took 80 ms on a fast PC (far more on a TV) and
 * the game stood still while it was built, a stutter at every step into new ground. Here it is built in a worker and the arrays
 * come back without a copy; the main thread only hands them to the GPU.
 *
 * In: { looks } once, then { id, cx, cy, win, b, hi }: win = the chunk's tiles with a b-tile border (-1 = not here yet).
 * Out: { id, data } (gfx/chunkmesh.ts ChunkData).
 */
import { CHUNK_TILES } from '@worldsim/protocol';
import { buildChunk, chunkBuffers } from './gfx/chunkmesh.js';
import type { Look } from './gfx/look.js';

let looks: Look[] = [];
const ctx = self as unknown as { onmessage: ((e: MessageEvent) => void) | null; postMessage(m: unknown, t: ArrayBuffer[]): void };
ctx.onmessage = (e: MessageEvent) => {
  const m = e.data as { looks?: Look[]; id: number; cx: number; cy: number; win: Int16Array; b: number; hi: boolean };
  if (m.looks) { looks = m.looks; return; }
  const W = CHUNK_TILES + m.b * 2, win = m.win, b = m.b;
  const at = (lx: number, ly: number): number => {
    const x = lx + b, y = ly + b;
    return x < 0 || y < 0 || x >= W || y >= W ? -1 : win[y * W + x]!;
  };
  try {
    const data = buildChunk(m.cx, m.cy, at, looks, m.hi);
    ctx.postMessage({ id: m.id, data }, chunkBuffers(data));
  } catch (err) {
    ctx.postMessage({ id: m.id, error: String(err) }, []);
  }
};
