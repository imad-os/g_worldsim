import {
  BufferGeometry, BufferAttribute, Float32BufferAttribute, Uint16BufferAttribute, Color, Matrix4, Matrix3, Vector3, Quaternion, Euler,
  IcosahedronGeometry, CylinderGeometry, ConeGeometry, BoxGeometry, CircleGeometry,
} from 'three';
import { CHUNK_TILES } from '@worldsim/protocol';
import { PASTURE, Shape, hash2, noise2, type Look } from './look.js';

/**
 * Builds the meshes of one 32 x 32 m chunk, once, when it arrives:
 *  - ground: a smooth grid at half a tile (soft colour blends between tiles, gentle bumps, water beds sloping into
 *    banks, darker ground at the foot of walls) = 1 draw call;
 *  - props: walls (only the faces that show, ruined tops), low-poly trees, rocks, grass tufts and flowers, flat
 *    shaded with a little ambient occlusion baked into the vertex colours = 1 draw call.
 * Coordinates: sim x -> three x, sim y -> three z, up = three y.
 */
const N = CHUNK_TILES * 2; // ground cells per side
const WATER_BED = -0.55;

type TileAt = (lx: number, ly: number) => number; // tile id at local coords (may be outside, -1 = unknown)

interface Tpl { pos: Float32Array; nor: Float32Array; minY: number; maxY: number }
function tpl(g: BufferGeometry): Tpl {
  const n = g.index ? g.toNonIndexed() : g;
  n.computeVertexNormals();
  const pos = n.getAttribute('position').array as Float32Array;
  let minY = Infinity, maxY = -Infinity;
  for (let i = 1; i < pos.length; i += 3) { minY = Math.min(minY, pos[i]!); maxY = Math.max(maxY, pos[i]!); }
  return { pos, nor: n.getAttribute('normal').array as Float32Array, minY, maxY };
}

let T: { trunk: Tpl; leaf: Tpl; leafLo: Tpl; rock: Tpl; blade: Tpl; log: Tpl; flame: Tpl; box: Tpl; spike: Tpl; post: Tpl; disc: Tpl; wheel: Tpl } | null = null;
function templates() {
  if (!T) T = {
    trunk: tpl(new CylinderGeometry(0.1, 0.17, 1, 6, 1, true).translate(0, 0.5, 0)),
    leaf: tpl(new IcosahedronGeometry(1, 1)),
    leafLo: tpl(new IcosahedronGeometry(1, 0)),
    rock: tpl(new IcosahedronGeometry(1, 0)),
    blade: tpl(new ConeGeometry(0.045, 0.34, 3, 1, true).translate(0, 0.17, 0)),
    log: tpl(new CylinderGeometry(0.06, 0.06, 0.62, 6, 1, false).rotateZ(Math.PI / 2)),
    flame: tpl(new ConeGeometry(0.16, 0.5, 5, 1, false).translate(0, 0.25, 0)),
    box: tpl(new BoxGeometry(1, 1, 1).translate(0, 0.5, 0)),
    spike: tpl(new ConeGeometry(0.5, 1, 6, 1, false).translate(0, 0.5, 0)),
    post: tpl(new CylinderGeometry(0.5, 0.5, 1, 7, 1, false).translate(0, 0.5, 0)),
    disc: tpl(new CircleGeometry(1, 16).rotateX(-Math.PI / 2)),
    wheel: tpl(new CylinderGeometry(0.5, 0.5, 1, 8, 1, false).rotateZ(Math.PI / 2)),
  };
  return T;
}

/** Vertices of one mesh being built: position, normal, colour, in growing typed arrays (no JS number lists: 3-4x faster on TVs). */
class Out {
  p = new Float32Array(3 * 1024); n = new Float32Array(3 * 1024); c = new Float32Array(3 * 1024); k = 0;
  private grow(add: number): void {
    const need = this.k + add * 3;
    if (need <= this.p.length) return;
    const size = Math.max(need, this.p.length * 2), g = (a: Float32Array) => { const b = new Float32Array(size); b.set(a.subarray(0, this.k)); return b; };
    this.p = g(this.p); this.n = g(this.n); this.c = g(this.c);
  }
  /** Room for `count` more vertices (call before v()). */
  room(count: number): void { this.grow(count); }
  v(px: number, py: number, pz: number, nx: number, ny: number, nz: number, r: number, g: number, b: number): void {
    const k = this.k, P = this.p, N = this.n, C = this.c;
    P[k] = px; P[k + 1] = py; P[k + 2] = pz; N[k] = nx; N[k + 1] = ny; N[k + 2] = nz; C[k] = r; C[k + 1] = g; C[k + 2] = b;
    this.k = k + 3;
  }
  data(): MeshData | null {
    if (!this.k) return null;
    return { pos: this.p.slice(0, this.k), nor: this.n.slice(0, this.k), col: this.c.slice(0, this.k) };
  }
}

const m4 = new Matrix4(), m3 = new Matrix3(), q = new Quaternion(), eu = new Euler(), sc = new Vector3(), tr = new Vector3();

function addTpl(o: Out, t: Tpl, m: Matrix4, c: Color, ao: number): void {
  m3.getNormalMatrix(m);
  const p = t.pos, n = t.nor, span = t.maxY - t.minY || 1, e = m.elements, f = m3.elements;
  const cr = c.r, cg = c.g, cb = c.b, k0 = 1 - ao, minY = t.minY;
  o.room(p.length / 3);
  for (let i = 0; i < p.length; i += 3) {
    const x = p[i]!, y = p[i + 1]!, z = p[i + 2]!, a = n[i]!, b = n[i + 1]!, d = n[i + 2]!;
    const k = ao + k0 * ((y - minY) / span);
    let nx = f[0]! * a + f[3]! * b + f[6]! * d, ny = f[1]! * a + f[4]! * b + f[7]! * d, nz = f[2]! * a + f[5]! * b + f[8]! * d;
    const l = 1 / (Math.sqrt(nx * nx + ny * ny + nz * nz) || 1); nx *= l; ny *= l; nz *= l;
    o.v(e[0]! * x + e[4]! * y + e[8]! * z + e[12]!, e[1]! * x + e[5]! * y + e[9]! * z + e[13]!, e[2]! * x + e[6]! * y + e[10]! * z + e[14]!,
      nx, ny, nz, cr * k, cg * k, cb * k);
  }
}

/** A pool of light: rings fading from the colour at the centre to nothing at the rim (drawn added on). */
const POOL_R = [0, 0.3, 0.6, 0.82, 1], POOL_K = [1, 0.75, 0.38, 0.12, 0], POOL_SEG = 20;
function addPool(o: Out, x: number, z: number, r: number, c: Color): void {
  for (let ring = 0; ring < POOL_R.length - 1; ring++) {
    const r0 = POOL_R[ring]! * r, r1 = POOL_R[ring + 1]! * r, k0 = POOL_K[ring]!, k1 = POOL_K[ring + 1]!;
    for (let s = 0; s < POOL_SEG; s++) {
      const a0 = (s / POOL_SEG) * Math.PI * 2, a1 = ((s + 1) / POOL_SEG) * Math.PI * 2;
      const c0 = Math.cos(a0), s0 = Math.sin(a0), c1 = Math.cos(a1), s1 = Math.sin(a1);
      const quad: [number, number, number][] = [[r0 * c0, r0 * s0, k0], [r1 * c1, r1 * s1, k1], [r1 * c0, r1 * s0, k1], [r0 * c0, r0 * s0, k0], [r0 * c1, r0 * s1, k0], [r1 * c1, r1 * s1, k1]];
      o.room(6);
      for (const [dx, dz, k] of quad) o.v(x + dx, 0.05, z + dz, 0, 1, 0, c.r * k, c.g * k, c.b * k);
    }
  }
}

function place(x: number, y: number, z: number, rx: number, ry: number, rz: number, sx: number, sy: number, sz: number): Matrix4 {
  return m4.compose(tr.set(x, y, z), q.setFromEuler(eu.set(rx, ry, rz)), sc.set(sx, sy, sz));
}

/** A quad from 4 corners (counter-clockwise seen from the outside), bottom pair darker. */
function quad(o: Out, ax: number, ay: number, az: number, bx: number, by: number, bz: number, cx: number, cy: number, cz: number,
  dx: number, dy: number, dz: number, nx: number, ny: number, nz: number, c: Color, kab: number, kcd: number): void {
  const P = [ax, ay, az, bx, by, bz, cx, cy, cz, ax, ay, az, cx, cy, cz, dx, dy, dz];
  const K = [kab, kab, kcd, kab, kcd, kcd];
  o.room(6);
  for (let i = 0; i < 6; i++) o.v(P[i * 3]!, P[i * 3 + 1]!, P[i * 3 + 2]!, nx, ny, nz, c.r * K[i]!, c.g * K[i]!, c.b * K[i]!);
}

export function wallHeight(look: Look, wx: number, wy: number): number {
  return !look.even && hash2(wx * 7 + 1, wy * 13 + 5) < 0.3 ? 0.8 + hash2(wx, wy + 99) * 1.2 : look.height;
}

const colOf = (hex: number, out: Color) => out.setHex(hex);
const DRY = new Color(0xb2b268), WARM = new Color();

/** glow = unlit parts (flames), drawn with their own colours day and night. */
/** pool = pools of lamp light on the ground (drawn added on at night). */
/**
 * Levels of detail (imad 2026-11-26: "full detail near, less far away, like GTA"): ground = half-tile grid, groundLo = one vertex per
 * tile corner (a quarter of the triangles) for far chunks; props = drawn at every distance, near = only close to the eye (grass,
 * flowers, small stones; the round tree crowns on mid / high), far = what stands in for `near` further away (simple crowns).
 */
export interface ChunkGeo { ground: BufferGeometry; groundLo: BufferGeometry; props: BufferGeometry | null; near: BufferGeometry | null; far: BufferGeometry | null; glow: BufferGeometry | null; pool: BufferGeometry | null }

/**
 * The ground grid from the full (V x V) vertex arrays, every `step`-th vertex, with a skirt hanging 1 m down round the edge: where a
 * near chunk (fine grid) meets a far one (coarse grid) their edges differ by a few centimetres, and the skirts close the gap.
 */
function gridGeo(pos: Float32Array, col: Float32Array, V: number, step: number): MeshData {
  const n = (V - 1) / step, W = n + 1, top = W * W, edge = n * 4;
  const P = new Float32Array((top + edge) * 3), C = new Float32Array((top + edge) * 3);
  for (let j = 0; j < W; j++) for (let i = 0; i < W; i++) {
    const s = (j * step * V + i * step) * 3, d = (j * W + i) * 3;
    P[d] = pos[s]!; P[d + 1] = pos[s + 1]!; P[d + 2] = pos[s + 2]!;
    C[d] = col[s]!; C[d + 1] = col[s + 1]!; C[d + 2] = col[s + 2]!;
  }
  const idx = new Uint16Array(n * n * 6 + edge * 6);
  let p = 0;
  for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) {
    const a = j * W + i, b = a + 1, d = a + W, e = d + 1;
    if ((i + j) & 1) { idx[p++] = a; idx[p++] = d; idx[p++] = b; idx[p++] = b; idx[p++] = d; idx[p++] = e; }
    else { idx[p++] = a; idx[p++] = d; idx[p++] = e; idx[p++] = a; idx[p++] = e; idx[p++] = b; }
  }
  const g = new BufferGeometry();
  g.setAttribute('position', new Float32BufferAttribute(P, 3));
  g.setIndex(new Uint16BufferAttribute(idx.subarray(0, p), 1));
  g.computeVertexNormals();
  // The rim, walked round counter-clockwise seen from above: each top vertex gets a twin 1 m below with its colour and normal.
  const ring: number[] = [];
  for (let i = 0; i < n; i++) ring.push(i); // north edge (z small), west -> east
  for (let j = 0; j < n; j++) ring.push(j * W + n); // east edge
  for (let i = n; i > 0; i--) ring.push(n * W + i); // south edge
  for (let j = n; j > 0; j--) ring.push(j * W); // west edge
  const N0 = g.getAttribute('normal').array as Float32Array, NOR = new Float32Array((top + edge) * 3);
  NOR.set(N0);
  for (let k = 0; k < edge; k++) {
    const v = ring[k]!, d = (top + k) * 3;
    P[d] = P[v * 3]!; P[d + 1] = P[v * 3 + 1]! - 1; P[d + 2] = P[v * 3 + 2]!;
    for (let c = 0; c < 3; c++) { C[d + c] = C[v * 3 + c]! * 0.8; NOR[d + c] = NOR[v * 3 + c]!; }
  }
  for (let k = 0; k < edge; k++) { // two triangles per rim segment, facing out (the gap is seen from the neighbour's side)
    const a = ring[k]!, b = ring[(k + 1) % edge]!, a2 = top + k, b2 = top + ((k + 1) % edge);
    idx[p++] = a; idx[p++] = b; idx[p++] = a2; idx[p++] = b; idx[p++] = b2; idx[p++] = a2;
  }
  return { pos: P, nor: NOR, col: C, idx: idx.slice(0, p) };
}

/** The raw arrays of one mesh (built in a worker, sent over without copying). idx = triangle list, else every 3 vertices. */
export interface MeshData { pos: Float32Array; nor: Float32Array; col: Float32Array; idx?: Uint16Array }
export interface ChunkData { ground: MeshData; groundLo: MeshData; props: MeshData | null; near: MeshData | null; far: MeshData | null; glow: MeshData | null; pool: MeshData | null }
/** Every array of a chunk (to hand over to the main thread without a copy). */
export function chunkBuffers(d: ChunkData): ArrayBuffer[] {
  const out: ArrayBuffer[] = [];
  for (const m of [d.ground, d.groundLo, d.props, d.near, d.far, d.glow, d.pool]) if (m) { out.push(m.pos.buffer as ArrayBuffer, m.nor.buffer as ArrayBuffer, m.col.buffer as ArrayBuffer); if (m.idx) out.push(m.idx.buffer as ArrayBuffer); }
  return out;
}
function geo(m: MeshData | null): BufferGeometry | null {
  if (!m) return null;
  const g = new BufferGeometry();
  g.setAttribute('position', new BufferAttribute(m.pos, 3)); // the arrays as they are (no copy)
  g.setAttribute('normal', new BufferAttribute(m.nor, 3));
  g.setAttribute('color', new BufferAttribute(m.col, 3));
  if (m.idx) g.setIndex(new BufferAttribute(m.idx, 1));
  g.computeBoundingSphere();
  return g;
}
/** The meshes three.js draws, from the arrays (main thread, quick). */
export function chunkGeo(d: ChunkData): ChunkGeo {
  return { ground: geo(d.ground)!, groundLo: geo(d.groundLo)!, props: geo(d.props), near: geo(d.near), far: geo(d.far), glow: geo(d.glow), pool: geo(d.pool) };
}

export function buildChunk(cx: number, cy: number, at: TileAt, looks: Look[], hiDetail: boolean): ChunkData {
  const ox = cx * CHUNK_TILES, oy = cy * CHUNK_TILES;
  // ---------------------------------------------------------------- ground
  const V = N + 1;
  const pos = new Float32Array(V * V * 3), col = new Float32Array(V * V * 3);
  const c = new Color(), acc = new Color();
  for (let j = 0; j < V; j++) for (let i = 0; i < V; i++) {
    // Tiles touching this vertex: a centre vertex has 1, an edge vertex 2, a corner vertex 4.
    const xs0 = i & 1 ? (i - 1) >> 1 : (i >> 1) - 1, xs1 = i & 1 ? xs0 : i >> 1;
    const ys0 = j & 1 ? (j - 1) >> 1 : (j >> 1) - 1, ys1 = j & 1 ? ys0 : j >> 1;
    let n = 0, h = 0, wall = false, flat = false;
    acc.setRGB(0, 0, 0);
    const wx = ox + i / 2, wy = oy + j / 2;
    for (let ty = ys0; ty <= ys1; ty++) for (let tx = xs0; tx <= xs1; tx++) {
      const id = at(tx, ty);
      if (id < 0) continue;
      const L = looks[id]!;
      colOf(L.ground, c);
      if (L.shape === Shape.Ground && L.ground === 0x76a955) { // grass: dry patches
        const d = noise2(wx + 300, wy, 9);
        c.lerp(DRY, Math.max(0, d - 0.45) * 1.1);
      }
      acc.r += c.r; acc.g += c.g; acc.b += c.b;
      h += L.shape === Shape.Water ? WATER_BED : 0;
      if (L.shape === Shape.Wall) wall = true;
      if (L.ground === 0x6a6762 || L.ground === 0xb08a5f || L.shape === Shape.Water) flat = true; // road, floor, water: no bumps
      n++;
    }
    if (!n) { acc.setHex(0x6ea64f); n = 1; }
    const k = (0.9 + noise2(wx, wy, 3.5) * 0.18 + (hash2(i + ox * 2, j + oy * 2) - 0.5) * 0.05) * (wall ? 0.7 : 1);
    const o = (j * V + i) * 3;
    col[o] = (acc.r / n) * k; col[o + 1] = (acc.g / n) * k; col[o + 2] = (acc.b / n) * k;
    pos[o] = wx; pos[o + 2] = wy;
    pos[o + 1] = h / n + (flat ? 0 : (noise2(wx, wy, 2.5) - 0.5) * 0.14);
  }
  const ground = gridGeo(pos, col, V, 1), groundLo = gridGeo(pos, col, V, 2);

  // ---------------------------------------------------------------- props
  const t = templates();
  // o = drawn at every distance; on = only near the eye (grass, flowers, small stones, round tree crowns); of = only far (simple crowns).
  const o = new Out(), og = new Out(), op = new Out(), on = new Out(), of = new Out();
  for (let ly = 0; ly < CHUNK_TILES; ly++) for (let lx = 0; lx < CHUNK_TILES; lx++) {
    const id = at(lx, ly), L = looks[id]!, wx = ox + lx, wy = oy + ly;
    const r1 = hash2(wx, wy), r2 = hash2(wy + 17, wx - 3), r3 = hash2(wx * 3 + 7, wy * 5 + 1);
    if (L.shape === Shape.Wall) {
      const h = wallHeight(L, wx, wy);
      const v = 0.92 + r1 * 0.14;
      colOf(L.top, c).multiplyScalar(v);
      const x0 = wx, x1 = wx + 1, z0 = wy, z1 = wy + 1;
      quad(o, x0, h, z1, x1, h, z1, x1, h, z0, x0, h, z0, 0, 1, 0, c, 1, 1);
      colOf(L.side, c).multiplyScalar(v);
      // A side shows from the neighbour's top (or the ground) up to this top.
      const side = (nx: number, ny: number): number => {
        const nid = at(nx, ny);
        if (nid < 0) return 0;
        const NL = looks[nid]!;
        return NL.shape === Shape.Wall ? wallHeight(NL, ox + nx, oy + ny) : 0;
      };
      let b = side(lx, ly + 1); if (b < h) quad(o, x0, b, z1, x1, b, z1, x1, h, z1, x0, h, z1, 0, 0, 1, c, b ? 0.85 : 0.55, 1);
      b = side(lx, ly - 1); if (b < h) quad(o, x1, b, z0, x0, b, z0, x0, h, z0, x1, h, z0, 0, 0, -1, c, b ? 0.85 : 0.55, 1);
      b = side(lx + 1, ly); if (b < h) quad(o, x1, b, z1, x1, b, z0, x1, h, z0, x1, h, z1, 1, 0, 0, c, b ? 0.85 : 0.55, 0.95);
      b = side(lx - 1, ly); if (b < h) quad(o, x0, b, z0, x0, b, z1, x0, h, z1, x0, h, z0, -1, 0, 0, c, b ? 0.85 : 0.55, 0.95);
    } else if (L.shape === Shape.Tree) {
      const s = 0.85 + r1 * 0.5, px = wx + 0.5 + (r2 - 0.5) * 0.3, pz = wy + 0.5 + (r3 - 0.5) * 0.3;
      const th = 0.9 * s + 0.3;
      colOf(L.side, c);
      addTpl(o, t.trunk, place(px, 0, pz, 0, r2 * 6, 0, s, th, s), c, 0.55);
      colOf(L.top, c);
      WARM.setHex(r2 < 0.5 ? 0x6aa84a : 0x3c7a38);
      c.lerp(WARM, r3 * 0.7).multiplyScalar(0.92 + r1 * 0.16);
      const m1 = place(px, th + 0.5 * s, pz, r2, r1 * 6, r3, 0.95 * s, 0.8 * s, 0.95 * s).clone();
      const c1 = c.clone(); c.multiplyScalar(1.08);
      const m2 = place(px + (r2 - 0.5) * 0.5 * s, th + 1.05 * s, pz + (r3 - 0.5) * 0.4 * s, r3, r2 * 6, r1, 0.62 * s, 0.55 * s, 0.62 * s);
      if (hiDetail) { // round crowns near the eye, the simple ones further away
        addTpl(on, t.leaf, m1, c1, 0.62); addTpl(of, t.leafLo, m1, c1, 0.62);
        addTpl(on, t.leaf, m2, c, 0.75); addTpl(of, t.leafLo, m2, c, 0.75);
      } else { addTpl(o, t.leafLo, m1, c1, 0.62); addTpl(o, t.leafLo, m2, c, 0.75); }
    } else if (L.shape === Shape.Fire || L.shape === Shape.Ashes) {
      // A ring of stones, crossed logs and (burning) a flame of three cones.
      const px = wx + 0.5, pz = wy + 0.5, lit = L.shape === Shape.Fire;
      for (let k = 0; k < 7; k++) {
        const a = (k / 7) * Math.PI * 2 + r1, sz = 0.1 + hash2(wx + k, wy - k) * 0.05;
        colOf(L.top, c).multiplyScalar(0.8 + hash2(wx * 3 + k, wy) * 0.3);
        addTpl(on, t.rock, place(px + Math.cos(a) * 0.34, sz * 0.4, pz + Math.sin(a) * 0.34, a, a * 2, 0, sz, sz * 0.7, sz), c, 0.65);
      }
      colOf(L.side, c);
      for (let k = 0; k < 3; k++) addTpl(o, t.log, place(px, 0.07 + k * 0.03, pz, 0, r2 * 3 + k * 1.05, lit ? 0.25 : 0.05, 1, 1, 1), c, 0.6);
      if (lit) {
        colOf(0xf28a2e, c); addTpl(og, t.flame, place(px, 0.08, pz, 0, r1 * 6, 0, 1, 1.15, 1), c, 0.75);
        colOf(0xf9c74f, c); addTpl(og, t.flame, place(px + 0.04, 0.1, pz - 0.03, 0.1, r2 * 6, 0, 0.6, 0.8, 0.6), c, 0.85);
        colOf(0xfff1b8, c); addTpl(og, t.flame, place(px - 0.02, 0.1, pz + 0.02, 0, r3 * 6, 0.1, 0.3, 0.5, 0.3), c, 1);
      }
    } else if (L.shape === Shape.Rubble) {
      for (let k = 0; k < 3; k++) {
        const a = hash2(wx * 5 + k, wy * 3 - k), b2 = hash2(wy * 7 + k, wx - k * 11);
        colOf(L.top, c).multiplyScalar(0.8 + a * 0.35);
        const sz = 0.16 + a * 0.22;
        addTpl(o, t.rock, place(wx + 0.2 + b2 * 0.6, sz * 0.25, wy + 0.2 + a * 0.6, a * 3, b2 * 6, b2, sz, sz * 0.6, sz * 0.9), c, 0.6);
      }
    } else if (L.shape === Shape.Rock) {
      // A boulder or two: big grey stones, some with a rusty vein (ore).
      for (let k = 0; k < 2; k++) {
        const a = hash2(wx * 3 + k, wy * 7 - k), b2 = hash2(wy * 5 + k, wx + k * 13);
        colOf(L.top, c).multiplyScalar(0.78 + a * 0.3);
        if (k === 1 && r2 < 0.4) c.lerp(WARM.setHex(0xa0673c), 0.45);
        const sz = k ? 0.28 + a * 0.15 : 0.45 + a * 0.15;
        addTpl(o, t.rock, place(wx + 0.3 + b2 * 0.4, sz * 0.45, wy + 0.3 + a * 0.4, a * 3, b2 * 6, b2, sz, sz * 0.8, sz * 0.95), c, 0.55);
      }
    } else if (L.shape === Shape.Wreck) {
      // Wrecked cars across the road (imad 2026-11-25: "the wrecked cars are tiny"): one full-size car (about 3 m long) per 3 tiles of the
      // barrier, drawn by the first wreck tile of its group, lying along the barrier, a little tilted; loose tyres and bits between them.
      const isW = (x: number, y: number) => { const id2 = at(x, y); return id2 >= 0 && looks[id2]!.shape === Shape.Wreck; };
      const rowH = (x: number, y: number) => isW(x - 1, y) || isW(x + 1, y), rowV = (x: number, y: number) => isW(x, y - 1) || isW(x, y + 1);
      // A lone wreck tile next to a barrier row (the ragged second row) is wreckage, not a car of its own (two cars would overlap).
      const stray = (!rowH(lx, ly) && ((isW(lx, ly - 1) && rowH(lx, ly - 1)) || (isW(lx, ly + 1) && rowH(lx, ly + 1))))
        || (!rowV(lx, ly) && ((isW(lx - 1, ly) && rowV(lx - 1, ly)) || (isW(lx + 1, ly) && rowV(lx + 1, ly))));
      const alongX = isW(lx - 1, ly) || isW(lx + 1, ly) || !(isW(lx, ly - 1) || isW(lx, ly + 1));
      const along = alongX ? wx : wy, across = alongX ? wy : wx, g0 = Math.floor((along + across) / 3) * 3 - across;
      let first = -1;
      for (let k = 0; k < 3 && first < 0; k++) if (alongX ? isW(g0 + k - ox, ly) : isW(lx, g0 + k - oy)) first = g0 + k;
      if (stray) { // scattered parts: a tyre, a door panel
        colOf(L.side, c); addTpl(o, t.wheel, place(wx + 0.3 + r2 * 0.4, 0.1, wy + 0.3 + r3 * 0.4, 0, r2 * 6, Math.PI / 2, 0.2, 0.6, 0.6), c, 0.5);
        WARM.setHex(0x6e5a48); c.copy(WARM).multiplyScalar(0.8 + r1 * 0.3);
        addTpl(o, t.box, place(wx + 0.5 + (r1 - 0.5) * 0.4, 0.05, wy + 0.5 + (r3 - 0.5) * 0.4, 0, r1 * 6, 0.08, 1.0, 0.08, 0.7), c, 0.6);
      } else if (first === along) {
        const mid = g0 + 1.5, cx0 = alongX ? mid : wx + 0.5, cz0 = alongX ? wy + 0.5 : mid;
        const yaw = (alongX ? 0 : Math.PI / 2) + (r1 - 0.5) * 0.5, tilt = (r2 - 0.5) * 0.18, cs = Math.cos(yaw), sn = Math.sin(yaw);
        const at2 = (f: number, s2: number): [number, number] => [cx0 + cs * f + sn * s2, cz0 - sn * f + cs * s2];
        WARM.setHex([0x8a4e32, 0x5f6b72, 0x7a6a3a, 0x6e3a30, 0x3f5560][Math.floor(r3 * 5)]!);
        c.copy(WARM).multiplyScalar(0.85 + r1 * 0.2);
        addTpl(o, t.box, place(cx0, 0.3, cz0, tilt * 0.5, yaw, tilt, 3.0, 0.62, 1.45), c, 0.6); // body
        let [px, pz] = at2(0.25, 0);
        c.multiplyScalar(0.85);
        addTpl(o, t.box, place(px, 0.9, pz, tilt * 0.5, yaw, tilt + 0.06, 1.5, 0.5 * (0.7 + r2 * 0.4), 1.3), c, 0.7); // crushed cabin
        colOf(0x2a3236, c);
        [px, pz] = at2(0.25, 0); addTpl(o, t.box, place(px, 1.05, pz, tilt * 0.5, yaw, tilt + 0.06, 1.3, 0.28 * (0.7 + r2 * 0.4), 1.34), c, 0.9); // dark broken glass band
        colOf(L.side, c);
        for (const [f, s2] of [[1.0, 0.72], [-1.0, 0.72], [1.0, -0.72], [-1.0, -0.72]] as const) {
          if (hash2(wx * 7 + f * 3, wy + s2 * 5) < 0.25) continue; // a wheel gone
          [px, pz] = at2(f, s2); addTpl(o, t.wheel, place(px, 0.32, pz, 0, yaw + Math.PI / 2, 0, 0.2, 0.62, 0.62), c, 0.5);
        }
      } else if (r1 < 0.35) { // a loose tyre or a bit of metal
        colOf(L.side, c); addTpl(o, t.wheel, place(wx + 0.3 + r2 * 0.4, 0.1, wy + 0.3 + r3 * 0.4, 0, r2 * 6, Math.PI / 2, 0.2, 0.6, 0.6), c, 0.5);
      }
    } else if (L.shape === Shape.Palisade) {
      // Sharpened logs side by side.
      for (let k = 0; k < 3; k++) {
        const h = 1.5 + hash2(wx + k * 5, wy - k) * 0.4, px = wx + 0.18 + k * 0.32, pz = wy + 0.5 + (hash2(wx * 9 + k, wy) - 0.5) * 0.1;
        colOf(L.side, c).multiplyScalar(0.85 + hash2(wx + k, wy * 3) * 0.25);
        addTpl(o, t.post, place(px, 0, pz, 0, k, 0, 0.3, h, 0.3), c, 0.55);
        colOf(L.top, c);
        addTpl(o, t.spike, place(px, h, pz, 0, k, 0, 0.3, 0.28, 0.3), c, 0.8);
      }
      for (let k = 0; k < 3; k++) {
        const pz = wy + 0.2 + k * 0.3, px = wx + 0.5;
        colOf(L.side, c).multiplyScalar(0.85 + hash2(wx + k, wy * 5) * 0.25);
        addTpl(o, t.post, place(px, 0, pz, 0, k, 0, 0.28, 1.4 + hash2(wx - k, wy + k) * 0.4, 0.28), c, 0.55);
      }
    } else if (L.shape === Shape.Spikes) {
      // Sharpened stakes, crossed in pairs, leaning out both ways.
      for (let k = 0; k < 3; k++) {
        const px = wx + 0.2 + k * 0.3;
        for (const lean of [0.5, -0.5]) {
          const len = 1.05, dz = Math.sin(lean) * len, top = Math.cos(lean) * len;
          colOf(L.side, c); addTpl(o, t.post, place(px, 0, wy + 0.5, lean, 0, 0, 0.12, len, 0.12), c, 0.6);
          colOf(L.top, c); addTpl(o, t.spike, place(px, top, wy + 0.5 + dz, lean, 0, 0, 0.12, 0.32, 0.12), c, 0.85);
        }
      }
    } else if (L.shape === Shape.Door) {
      // A frame and a plank door, set in the line of the wall around it (imad 2026-11-25: doors in east / west walls were drawn across
      // the doorway); shut, or swung open inwards (the interact button opens and closes it).
      const wl = (x: number, y: number) => { const id2 = at(x, y); if (id2 < 0) return 0; const S = looks[id2]!.shape; return S === Shape.Wall || S === Shape.Window || S === Shape.Palisade ? 1 : 0; };
      const vert = wl(lx, ly - 1) + wl(lx, ly + 1) > wl(lx - 1, ly) + wl(lx + 1, ly), yaw = vert ? Math.PI / 2 : 0;
      const cx0 = wx + 0.5, cz0 = wy + 0.5, cs = Math.cos(yaw), sn = Math.sin(yaw);
      const at2 = (f: number, s2: number): [number, number] => [cx0 + cs * f + sn * s2, cz0 - sn * f + cs * s2];
      colOf(L.side, c);
      let [px, pz] = at2(-0.44, 0); addTpl(o, t.box, place(px, 0, pz, 0, yaw, 0, 0.12, 1.85, 0.2), c, 0.6);
      [px, pz] = at2(0.44, 0); addTpl(o, t.box, place(px, 0, pz, 0, yaw, 0, 0.12, 1.85, 0.2), c, 0.6);
      addTpl(o, t.box, place(cx0, 1.78, cz0, 0, yaw, 0, 1, 0.14, 0.22), c, 0.8);
      colOf(L.top, c);
      if (L.open) { [px, pz] = at2(-0.38, -0.4); addTpl(o, t.box, place(px, 0.03, pz, 0, yaw + Math.PI / 2, 0, 0.78, 1.7, 0.07), c, 0.7); }
      else {
        addTpl(o, t.box, place(cx0, 0.03, cz0, 0, yaw, 0, 0.76, 1.7, 0.08), c, 0.7);
        colOf(0x3b2a1a, c); [px, pz] = at2(0.24, 0); addTpl(o, t.box, place(px, 0.85, pz, 0, yaw, 0, 0.07, 0.07, 0.14), c, 0.9); // the handle
      }
    } else if (L.shape === Shape.Window) {
      // A low plank wall, glass above it, posts and a beam.
      colOf(L.side, c);
      addTpl(o, t.box, place(wx + 0.5, 0, wy + 0.5, 0, 0, 0, 1, 0.8, 0.92), c, 0.6);
      addTpl(o, t.box, place(wx + 0.06, 0.8, wy + 0.5, 0, 0, 0, 0.12, 0.9, 0.92), c, 0.8);
      addTpl(o, t.box, place(wx + 0.94, 0.8, wy + 0.5, 0, 0, 0, 0.12, 0.9, 0.92), c, 0.8);
      addTpl(o, t.box, place(wx + 0.5, 1.6, wy + 0.5, 0, 0, 0, 1, 0.12, 0.92), c, 0.85);
      colOf(0x9fd4e8, c); addTpl(og, t.box, place(wx + 0.5, 0.8, wy + 0.5, 0, 0, 0, 0.78, 0.8, 0.04), c, 1);
    } else if (L.shape === Shape.Bed) {
      // A bed a grown person fits in (imad 2026-11-25: "beds are tiny"): about 1 x 1.9 m, the head on this tile against the wall,
      // the foot reaching over the open floor next to it; a wooden frame, a red blanket, a pillow.
      const open = (x: number, y: number) => { const id2 = at(x, y); return id2 >= 0 && looks[id2]!.shape === Shape.Ground; };
      const [fx, fz] = open(lx, ly + 1) ? [0, 1] : open(lx, ly - 1) ? [0, -1] : open(lx + 1, ly) ? [1, 0] : open(lx - 1, ly) ? [-1, 0] : [0, 0];
      const reach = fx || fz ? 0.45 : 0, yaw = fx ? Math.PI / 2 : 0, len = fx || fz ? 1.9 : 1.0;
      const bx = wx + 0.5 + fx * reach, bz = wy + 0.5 + fz * reach;
      colOf(L.side, c); addTpl(o, t.box, place(bx, 0, bz, 0, yaw, 0, 0.98, 0.42, len), c, 0.6);
      colOf(L.top, c); addTpl(o, t.box, place(bx + fx * 0.15, 0.42, bz + fz * 0.15, 0, yaw, 0, 0.92, 0.14, len * 0.72), c, 0.85);
      colOf(0xeee6d6, c); addTpl(o, t.box, place(wx + 0.5 - fx * 0.22, 0.42, wy + 0.5 - fz * 0.22, 0, yaw, 0, 0.7, 0.16, 0.34), c, 0.9);
    } else if (L.shape === Shape.Lamp) {
      // A post with a lantern; its light pools on the ground at night.
      colOf(L.side, c);
      addTpl(o, t.post, place(wx + 0.5, 0, wy + 0.5, 0, 0, 0, 0.1, 1.7, 0.1), c, 0.6);
      addTpl(o, t.box, place(wx + 0.5, 1.68, wy + 0.5, 0, 0.6, 0, 0.3, 0.06, 0.3), c, 0.8);
      colOf(L.top, c); addTpl(og, t.box, place(wx + 0.5, 1.45, wy + 0.5, 0, 0.6, 0, 0.2, 0.24, 0.2), c, 1);
      colOf(0xffb24a, c); addPool(op, wx + 0.5, wy + 0.5, 4.2, c);
    } else if (L.shape === Shape.Fridge || L.shape === Shape.Chest) {
      // A fridge (tall, pale, a door line and a handle) or a chest (a wooden box with iron bands and a lock), its back to the
      // nearest wall and its front to the room (imad 2026-11-26: built only inside a hut).
      const wallAt = (x: number, y: number) => { const id2 = at(x, y); return id2 >= 0 && looks[id2]!.shape === Shape.Wall ? 1 : 0; };
      const [bx, bz] = wallAt(lx, ly - 1) ? [0, -1] : wallAt(lx, ly + 1) ? [0, 1] : wallAt(lx - 1, ly) ? [-1, 0] : wallAt(lx + 1, ly) ? [1, 0] : [0, -1];
      const yaw = bx ? Math.PI / 2 : 0, fx = -bx, fz = -bz; // front = away from the wall
      const cx0 = wx + 0.5 + bx * 0.12, cz0 = wy + 0.5 + bz * 0.12;
      if (L.shape === Shape.Fridge) {
        colOf(L.top, c); addTpl(o, t.box, place(cx0, 0, cz0, 0, yaw, 0, 0.74, 1.78, 0.66), c, 0.75);
        colOf(L.side, c);
        addTpl(o, t.box, place(cx0 + fx * 0.335, 1.14, cz0 + fz * 0.335, 0, yaw, 0, 0.7, 0.03, 0.02), c, 0.9); // the freezer's door line
        const hx = cx0 + fx * 0.345 + (bx ? 0 : 0.26), hz = cz0 + fz * 0.345 + (bx ? 0.26 : 0);
        addTpl(o, t.box, place(hx, 0.5, hz, 0, yaw, 0, 0.04, 0.55, 0.04), c, 1); // handles
        addTpl(o, t.box, place(hx, 1.25, hz, 0, yaw, 0, 0.04, 0.35, 0.04), c, 1);
      } else {
        colOf(L.top, c); addTpl(o, t.box, place(cx0, 0, cz0, 0, yaw, 0, 0.84, 0.5, 0.56), c, 0.7);
        colOf(0x7c5230, c); addTpl(o, t.box, place(cx0, 0.5, cz0, 0, yaw, 0, 0.86, 0.12, 0.58), c, 0.8); // the lid
        colOf(L.side, c);
        for (const s2 of [-0.3, 0.3]) addTpl(o, t.box, place(cx0 + (bx ? 0 : s2), 0, cz0 + (bx ? s2 : 0), 0, yaw, 0, 0.06, 0.63, 0.6), c, 0.9); // iron bands
        addTpl(o, t.box, place(cx0 + fx * 0.29, 0.38, cz0 + fz * 0.29, 0, yaw, 0, 0.1, 0.14, 0.04), c, 1); // the lock
      }
    } else if (L.shape === Shape.Herbs) {
      // A patch of healing herbs: a few round leafy clumps with small lilac and white flowers (A next to it picks them).
      for (let k = 0; k < 4; k++) {
        const a = r1 * 6.28 + k * 1.57, d = 0.12 + ((k * 0.37 + r2) % 1) * 0.2, px = wx + 0.5 + Math.cos(a) * d, pz = wy + 0.5 + Math.sin(a) * d, sz = 0.2 + ((r3 + k * 0.29) % 1) * 0.1;
        colOf(L.top, c).multiplyScalar(0.85 + ((r2 + k * 0.17) % 1) * 0.3);
        addTpl(o, t.leafLo, place(px, sz * 0.7, pz, a, a * 2, 0, sz * 1.2, sz, sz * 1.2), c, 0.7);
        colOf(k % 2 ? L.side : 0xf2efe6, c);
        addTpl(on, t.rock, place(px + 0.03, sz * 1.5, pz - 0.02, a, 0, 0, 0.07, 0.06, 0.07), c, 1);
      }
    } else if (L.shape === Shape.Fence) {
      // Post and rails (the horse paddock): a post on every tile, two rails to the next fence (or stable wall) east and south,
      // and to a stable wall west / north (walls draw no rails of their own).
      const kind = (x: number, y: number) => { const id2 = at(x, y); return id2 < 0 ? 0 : looks[id2]!.shape === Shape.Fence ? 1 : looks[id2]!.shape === Shape.Wall ? 2 : 0; };
      const px = wx + 0.5, pz = wy + 0.5;
      colOf(L.side, c).multiplyScalar(0.88 + r1 * 0.2);
      addTpl(o, t.box, place(px, 0, pz, 0, r2 * 0.3, 0, 0.16, 1.3 + r3 * 0.08, 0.16), c, 0.55);
      colOf(L.top, c).multiplyScalar(0.9 + r2 * 0.15);
      const rails = (dx: number, dy: number) => {
        for (const h of [0.55, 1.05]) addTpl(o, t.box, place(px + dx * 0.5, h, pz + dy * 0.5, 0, 0, (r1 - 0.5) * 0.04, dx ? 1.02 : 0.07, 0.11, dy ? 1.02 : 0.07), c, 0.75);
      };
      if (kind(lx + 1, ly)) rails(1, 0);
      if (kind(lx, ly + 1)) rails(0, 1);
      if (kind(lx - 1, ly) === 2) rails(-1, 0);
      if (kind(lx, ly - 1) === 2) rails(0, -1);
    } else if (L.shape === Shape.Stall) {
      // The stable: a straw floor under a lean-to roof that rises from the open front to the back wall, posts along the front, a
      // manger against the back wall. The front is the side whose run of stall tiles ends in the open (the shorter way across).
      const isS = (x: number, y: number) => { const id2 = at(x, y); return id2 >= 0 && looks[id2]!.shape === Shape.Stall; };
      const isW = (x: number, y: number) => { const id2 = at(x, y); return id2 >= 0 && looks[id2]!.shape === Shape.Wall; };
      const run = (dx: number, dy: number) => { let k = 1; while (k < 12 && isS(lx + dx * k, ly + dy * k)) k++; return k; };
      let fx = 0, fz = 1, best = 99;
      for (const [dx, dy] of [[0, 1], [0, -1], [1, 0], [-1, 0]] as const) {
        const f = run(dx, dy), b = run(-dx, -dy);
        if (isW(lx + dx * f, ly + dy * f) || !isW(lx - dx * b, ly - dy * b)) continue;
        if (f + b < best) { best = f + b; fx = dx; fz = dy; }
      }
      const f = run(fx, fz); // 1 = the front row
      // Roof height at s metres in from the front edge; corners of this tile's roof (with overhangs at the front and the sides).
      const H0 = 2.45, SL = 0.17, sNear = f - 1, sFar = f;
      const ux = fz ? 1 : 0, uz = fx ? 1 : 0; // along the front
      const sideA = isS(lx - ux, ly - uz) ? 0 : 0.3, sideB = isS(lx + ux, ly + uz) ? 0 : 0.3;
      const cx0 = wx + 0.5, cz0 = wy + 0.5;
      const pt = (s: number, a: number): [number, number, number] => { // s from the front edge (in), a along (-0.5 .. 0.5 + overhang)
        const dIn = (f - 0.5) - s; // metres from the tile centre towards the front
        return [cx0 + fx * dIn + ux * a, H0 + SL * Math.max(0, s), cz0 + fz * dIn + uz * a];
      };
      const s0 = sNear === 0 ? -0.45 : sNear, a0 = -0.5 - sideA, a1 = 0.5 + sideB;
      const P1 = pt(s0, a0), P2 = pt(s0, a1), P3 = pt(sFar + (isW(lx - fx * 1, ly - fz * 1) ? 0.3 : 0), a1), P4 = pt(sFar + (isW(lx - fx, ly - fz) ? 0.3 : 0), a0);
      colOf(L.top, c).multiplyScalar(0.9 + r1 * 0.12);
      const up = (A: number[], B: number[], C: number[], D: number[]) => {
        // Winding: counter-clockwise from above for the top face.
        const cr = (B[0]! - A[0]!) * (D[2]! - A[2]!) - (B[2]! - A[2]!) * (D[0]! - A[0]!);
        if (cr > 0) quad(o, A[0]!, A[1]!, A[2]!, D[0]!, D[1]!, D[2]!, C[0]!, C[1]!, C[2]!, B[0]!, B[1]!, B[2]!, 0, 1, 0, c, 1, 1);
        else quad(o, A[0]!, A[1]!, A[2]!, B[0]!, B[1]!, B[2]!, C[0]!, C[1]!, C[2]!, D[0]!, D[1]!, D[2]!, 0, 1, 0, c, 1, 1);
        const lo = (P: number[]) => [P[0]!, P[1]! - 0.08, P[2]!];
        colOf(0x5e4330, c);
        const [a, b, cc, d] = [lo(A), lo(B), lo(C), lo(D)];
        if (cr > 0) quad(o, a[0]!, a[1]!, a[2]!, b[0]!, b[1]!, b[2]!, cc[0]!, cc[1]!, cc[2]!, d[0]!, d[1]!, d[2]!, 0, -1, 0, c, 0.6, 0.6);
        else quad(o, a[0]!, a[1]!, a[2]!, d[0]!, d[1]!, d[2]!, cc[0]!, cc[1]!, cc[2]!, b[0]!, b[1]!, b[2]!, 0, -1, 0, c, 0.6, 0.6);
      };
      up(P1, P2, P3, P4);
      colOf(L.side, c);
      if (f === 1) { // posts along the front (every other tile and at the ends) and a beam under the roof's edge
        const along = fz ? wx : wy;
        const post = (a: number) => { const [x, , z] = pt(0, a); addTpl(o, t.box, place(x, 0, z, 0, 0, 0, 0.18, H0 - 0.05, 0.18), c, 0.55); };
        if (along % 2 === 0 || sideA) post(-0.45);
        if (sideB) post(0.45);
        const [bx, , bz] = pt(0, 0);
        addTpl(o, t.box, place(bx, H0 - 0.22, bz, 0, 0, 0, ux ? 1.02 : 0.14, 0.16, uz ? 1.02 : 0.14), c, 0.7);
      }
      if (f >= 2 && isW(lx - fx, ly - fz)) { // back row: a manger with hay
        const [mx, , mz] = pt(f - 0.3, 0);
        addTpl(o, t.box, place(mx, 0, mz, 0, 0, 0, ux ? 0.9 : 0.42, 0.62, uz ? 0.9 : 0.42), c, 0.6);
        colOf(0xd8b85e, c).multiplyScalar(0.9 + r2 * 0.15);
        addTpl(o, t.box, place(mx, 0.62, mz, 0, 0, 0, ux ? 0.8 : 0.34, 0.12 + r3 * 0.06, uz ? 0.8 : 0.34), c, 0.9);
      } else if (r1 < 0.12) { // a bale of straw now and then
        colOf(0xd2b25a, c);
        addTpl(o, t.box, place(wx + 0.3 + r2 * 0.4, 0, wy + 0.3 + r3 * 0.4, 0, r1 * 20, 0, 0.7, 0.4, 0.45), c, 0.7);
      }
    } else if (L.shape === Shape.Ground && (L.ground === 0x76a955 || L.ground === PASTURE) && r1 < 0.2) {
      // Grass tuft (3 blades), sometimes with a flower.
      const px = wx + 0.2 + r2 * 0.6, pz = wy + 0.2 + r3 * 0.6;
      colOf(0x5f9a45, c).multiplyScalar(0.85 + r2 * 0.3);
      for (let k = 0; k < 3; k++) addTpl(on, t.blade, place(px + (k - 1) * 0.06, 0, pz + ((k * 7) % 3 - 1) * 0.05, (r3 - 0.5) * 0.5, k * 2.1, (k - 1) * 0.35, 1, 0.7 + r1 * 1.5, 1), c, 0.6);
      if (r1 < 0.05) {
        colOf(r2 < 0.33 ? 0xf2efe6 : r2 < 0.66 ? 0xf3c94a : 0xd9564a, c);
        addTpl(on, t.rock, place(px, 0.28, pz, r1, r2, r3, 0.06, 0.05, 0.06), c, 1);
      }
    }
  }
  return { ground, groundLo, props: o.data(), near: on.data(), far: of.data(), glow: og.data(), pool: op.data() };
}
