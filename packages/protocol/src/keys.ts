/** Chunk key: one number for (cx, cy), both 0..65535. */
export function chunkKey(cx: number, cy: number): number { return (cy << 16) | cx; }
export function chunkKeyX(k: number): number { return k & 0xffff; }
export function chunkKeyY(k: number): number { return k >>> 16; }
