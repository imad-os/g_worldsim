/**
 * Seeded RNG (sfc32). Small, fast, good quality, and its whole state is 4 uint32 numbers,
 * so it is saved in every snapshot: a restored world draws the same numbers it would have drawn.
 */
export class Rng {
  readonly s = new Uint32Array(4);

  constructor(seed: number | string = 1) { this.seed(seed); }

  seed(seed: number | string): void {
    let h = 1779033703 ^ 0;
    const str = String(seed);
    for (let i = 0; i < str.length; i++) {
      h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
      h = (h << 13) | (h >>> 19);
    }
    const s = this.s;
    for (let i = 0; i < 4; i++) {
      h = Math.imul(h ^ (h >>> 16), 2246822507);
      h = Math.imul(h ^ (h >>> 13), 3266489909);
      s[i] = (h ^= h >>> 16) >>> 0;
    }
    for (let i = 0; i < 12; i++) this.u32();
  }

  u32(): number {
    const s = this.s;
    const t = (((s[0]! + s[1]!) >>> 0) + s[3]!) >>> 0;
    s[3] = (s[3]! + 1) >>> 0;
    s[0] = s[1]! ^ (s[1]! >>> 9);
    s[1] = (s[2]! + (s[2]! << 3)) >>> 0;
    s[2] = (s[2]! << 21) | (s[2]! >>> 11);
    s[2] = (s[2]! + t) >>> 0;
    return t;
  }

  /** [0, 1) */
  next(): number { return this.u32() / 4294967296; }
  range(a: number, b: number): number { return a + (b - a) * this.next(); }
  int(n: number): number { return Math.floor(this.next() * n); }
  chance(p: number): boolean { return this.next() < p; }

  getState(): number[] { return Array.from(this.s); }
  setState(st: ArrayLike<number>): void { for (let i = 0; i < 4; i++) this.s[i] = st[i]! >>> 0; }
}
