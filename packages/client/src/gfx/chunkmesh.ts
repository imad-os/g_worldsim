import {
  BufferGeometry, Float32BufferAttribute, Uint16BufferAttribute, Color, Matrix4, Matrix3, Vector3, Quaternion, Euler,
  IcosahedronGeometry, CylinderGeometry, ConeGeometry,
} from 'three';
import { CHUNK_TILES } from '@worldsim/protocol';
import { Shape, hash2, noise2, type Look } from './look.js';

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

let T: { trunk: Tpl; leaf: Tpl; leafLo: Tpl; rock: Tpl; blade: Tpl; log: Tpl; flame: Tpl } | null = null;
function templates() {
  if (!T) T = {
    trunk: tpl(new CylinderGeometry(0.1, 0.17, 1, 6, 1, true).translate(0, 0.5, 0)),
    leaf: tpl(new IcosahedronGeometry(1, 1)),
    leafLo: tpl(new IcosahedronGeometry(1, 0)),
    rock: tpl(new IcosahedronGeometry(1, 0)),
    blade: tpl(new ConeGeometry(0.045, 0.34, 3, 1, true).translate(0, 0.17, 0)),
    log: tpl(new CylinderGeometry(0.06, 0.06, 0.62, 6, 1, false).rotateZ(Math.PI / 2)),
    flame: tpl(new ConeGeometry(0.16, 0.5, 5, 1, false).translate(0, 0.25, 0)),
  };
  return T;
}

class Out {
  pos: number[] = []; nor: number[] = []; col: number[] = [];
  geometry(): BufferGeometry | null {
    if (!this.pos.length) return null;
    const g = new BufferGeometry();
    g.setAttribute('position', new Float32BufferAttribute(this.pos, 3));
    g.setAttribute('normal', new Float32BufferAttribute(this.nor, 3));
    g.setAttribute('color', new Float32BufferAttribute(this.col, 3));
    g.computeBoundingSphere();
    return g;
  }
}

const vA = new Vector3(), vN = new Vector3(), m4 = new Matrix4(), m3 = new Matrix3(), q = new Quaternion(), eu = new Euler(), sc = new Vector3(), tr = new Vector3();
const cTmp = new Color();

function addTpl(o: Out, t: Tpl, m: Matrix4, c: Color, ao: number): void {
  m3.getNormalMatrix(m);
  const p = t.pos, n = t.nor, span = t.maxY - t.minY || 1;
  for (let i = 0; i < p.length; i += 3) {
    const k = ao + (1 - ao) * ((p[i + 1]! - t.minY) / span);
    vA.set(p[i]!, p[i + 1]!, p[i + 2]!).applyMatrix4(m);
    vN.set(n[i]!, n[i + 1]!, n[i + 2]!).applyMatrix3(m3).normalize();
    o.pos.push(vA.x, vA.y, vA.z); o.nor.push(vN.x, vN.y, vN.z); o.col.push(c.r * k, c.g * k, c.b * k);
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
  for (let i = 0; i < 6; i++) {
    o.pos.push(P[i * 3]!, P[i * 3 + 1]!, P[i * 3 + 2]!); o.nor.push(nx, ny, nz);
    o.col.push(c.r * K[i]!, c.g * K[i]!, c.b * K[i]!);
  }
}

export function wallHeight(look: Look, wx: number, wy: number): number {
  return !look.even && hash2(wx * 7 + 1, wy * 13 + 5) < 0.3 ? 0.8 + hash2(wx, wy + 99) * 1.2 : look.height;
}

const colOf = (hex: number, out: Color) => out.setHex(hex);
const DRY = new Color(0xb2b268), WARM = new Color();

/** glow = unlit parts (flames), drawn with their own colours day and night. */
export interface ChunkGeo { ground: BufferGeometry; props: BufferGeometry | null; glow: BufferGeometry | null }

export function buildChunk(cx: number, cy: number, at: TileAt, looks: Look[], hiDetail: boolean): ChunkGeo {
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
  const idx = new Uint16Array(N * N * 6);
  let p = 0;
  for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
    const a = j * V + i, b = a + 1, d = a + V, e = d + 1;
    if ((i + j) & 1) { idx[p++] = a; idx[p++] = d; idx[p++] = b; idx[p++] = b; idx[p++] = d; idx[p++] = e; }
    else { idx[p++] = a; idx[p++] = d; idx[p++] = e; idx[p++] = a; idx[p++] = e; idx[p++] = b; }
  }
  const ground = new BufferGeometry();
  ground.setAttribute('position', new Float32BufferAttribute(pos, 3));
  ground.setAttribute('color', new Float32BufferAttribute(col, 3));
  ground.setIndex(new Uint16BufferAttribute(idx, 1));
  ground.computeVertexNormals();
  ground.computeBoundingSphere();

  // ---------------------------------------------------------------- props
  const t = templates();
  const o = new Out(), og = new Out();
  const leaf = hiDetail ? t.leaf : t.leafLo;
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
      addTpl(o, leaf, place(px, th + 0.5 * s, pz, r2, r1 * 6, r3, 0.95 * s, 0.8 * s, 0.95 * s), c, 0.62);
      c.multiplyScalar(1.08);
      addTpl(o, leaf, place(px + (r2 - 0.5) * 0.5 * s, th + 1.05 * s, pz + (r3 - 0.5) * 0.4 * s, r3, r2 * 6, r1, 0.62 * s, 0.55 * s, 0.62 * s), c, 0.75);
    } else if (L.shape === Shape.Fire || L.shape === Shape.Ashes) {
      // A ring of stones, crossed logs and (burning) a flame of three cones.
      const px = wx + 0.5, pz = wy + 0.5, lit = L.shape === Shape.Fire;
      for (let k = 0; k < 7; k++) {
        const a = (k / 7) * Math.PI * 2 + r1, sz = 0.1 + hash2(wx + k, wy - k) * 0.05;
        colOf(L.top, c).multiplyScalar(0.8 + hash2(wx * 3 + k, wy) * 0.3);
        addTpl(o, t.rock, place(px + Math.cos(a) * 0.34, sz * 0.4, pz + Math.sin(a) * 0.34, a, a * 2, 0, sz, sz * 0.7, sz), c, 0.65);
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
    } else if (L.shape === Shape.Ground && L.ground === 0x76a955 && r1 < 0.2) {
      // Grass tuft (3 blades), sometimes with a flower.
      const px = wx + 0.2 + r2 * 0.6, pz = wy + 0.2 + r3 * 0.6;
      colOf(0x5f9a45, c).multiplyScalar(0.85 + r2 * 0.3);
      for (let k = 0; k < 3; k++) addTpl(o, t.blade, place(px + (k - 1) * 0.06, 0, pz + ((k * 7) % 3 - 1) * 0.05, (r3 - 0.5) * 0.5, k * 2.1, (k - 1) * 0.35, 1, 0.7 + r1 * 1.5, 1), c, 0.6);
      if (r1 < 0.05) {
        colOf(r2 < 0.33 ? 0xf2efe6 : r2 < 0.66 ? 0xf3c94a : 0xd9564a, c);
        addTpl(o, t.rock, place(px, 0.28, pz, r1, r2, r3, 0.06, 0.05, 0.06), c, 1);
      }
    }
  }
  return { ground, props: o.geometry(), glow: og.geometry() };
}
