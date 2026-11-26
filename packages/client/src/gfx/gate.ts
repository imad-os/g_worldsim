import {
  BufferGeometry, Group, Mesh, MeshLambertMaterial, PlaneGeometry, CylinderGeometry, IcosahedronGeometry, ConeGeometry, BoxGeometry,
  Float32BufferAttribute, Matrix4, Euler, Quaternion, Vector3, Color, CanvasTexture, SRGBColorSpace,
} from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

/**
 * A way out of the map (imad 2026-11-26: "the portals look silly, this is not a wizard RPG: not doors, just an opening between
 * trees"). No ring, no glow: the road (or a worn dirt track) simply goes on past the edge of the map into thick woods, trees close
 * in on both sides, and a weathered wooden signpost at the side of the way names where it leads. Everything but the sign's text is
 * one vertex-coloured mesh (one draw call per gate, fine for the low-end TVs).
 */
export interface GateSpec { x: number; y: number; label?: string }

const ROAD = 0x6a6762, DIRT = 0x8a6b47, FLOOR = 0x4a6e36, FLOOR2 = 0x3c5a2c, TRUNK = 0x5b3e27, LEAF = 0x3f7a35, LEAF2 = 0x2f5f2c, WOOD = 0x7a5a3a;

/** Small seeded dice so a gate looks the same every time. */
function dice(seed: number): () => number {
  let s = (seed * 2654435761) >>> 0 || 1;
  return () => { s ^= s << 13; s >>>= 0; s ^= s >> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; };
}

const M = new Matrix4(), Q = new Quaternion(), E = new Euler(), V = new Vector3(), S = new Vector3(), C = new Color();

function piece(g: BufferGeometry, col: number | Color, x: number, y: number, z: number, ry = 0, sx = 1, sy = 1, sz = 1, rx = 0, rz = 0): BufferGeometry {
  const o = g.index ? g.toNonIndexed() : g.clone();
  o.deleteAttribute('uv');
  M.compose(V.set(x, y, z), Q.setFromEuler(E.set(rx, ry, rz)), S.set(sx, sy, sz));
  o.applyMatrix4(M);
  const n = o.getAttribute('position').count, c = new Float32Array(n * 3);
  const cc = typeof col === 'number' ? C.setHex(col) : col;
  for (let k = 0; k < n; k++) { c[k * 3] = cc.r; c[k * 3 + 1] = cc.g; c[k * 3 + 2] = cc.b; }
  o.setAttribute('color', new Float32BufferAttribute(c, 3));
  return o;
}

/** A ground strip from a to b (distance out along the way) and from l0 to l1 across it, colours at its inner and outer ends. */
function strip(x: number, z: number, ox: number, oz: number, a: number, b: number, l0: number, l1: number, y: number, c0: number, c1: number, seg = 6): BufferGeometry {
  const lx = -oz, lz = ox, pos: number[] = [], col: number[] = [];
  const A = new Color(c0), B = new Color(c1), K = new Color();
  for (let s = 0; s < seg; s++) {
    const t0 = s / seg, t1 = (s + 1) / seg, d0 = a + (b - a) * t0, d1 = a + (b - a) * t1;
    const P = (d: number, l: number): number[] => [x + ox * d + lx * l, y, z + oz * d + lz * l];
    const q = [P(d0, l0), P(d0, l1), P(d1, l1), P(d1, l0)];
    const k0 = K.copy(A).lerp(B, t0).toArray(), k1 = new Color().copy(A).lerp(B, t1).toArray();
    for (const [i, kk] of [[0, k0], [2, k1], [1, k0], [0, k0], [3, k1], [2, k1]] as const) { pos.push(...q[i]!); col.push(...kk); }
  }
  const g = new BufferGeometry();
  g.setAttribute('position', new Float32BufferAttribute(pos, 3));
  g.setAttribute('color', new Float32BufferAttribute(col, 3));
  g.computeVertexNormals();
  // Faces up whichever way the strip runs.
  const nrm = g.getAttribute('normal');
  for (let k = 0; k < nrm.count; k++) nrm.setXYZ(k, 0, 1, 0);
  return g;
}

const trunkG = new CylinderGeometry(0.12, 0.18, 1, 6);
const leafG = new IcosahedronGeometry(1, 0);
const pineG = new ConeGeometry(1, 1, 7);
const postG = new BoxGeometry(1, 1, 1);

function tree(parts: BufferGeometry[], r: () => number, x: number, z: number, big = 1): void {
  const s = (0.9 + r() * 0.7) * big, th = 1.1 * s + 0.4;
  parts.push(piece(trunkG, TRUNK, x, th / 2, z, r() * 6, s, th, s));
  const lc = new Color(r() < 0.5 ? LEAF : LEAF2).multiplyScalar(0.85 + r() * 0.3);
  if (r() < 0.45) {
    // A pine: two stacked cones.
    parts.push(piece(pineG, lc, x, th + 0.9 * s, z, r() * 6, 1.1 * s, 2.2 * s, 1.1 * s));
    parts.push(piece(pineG, lc.clone().multiplyScalar(1.1), x, th + 2.0 * s, z, r() * 6, 0.75 * s, 1.6 * s, 0.75 * s));
  } else {
    parts.push(piece(leafG, lc, x, th + 0.6 * s, z, r() * 6, 1.05 * s, 0.9 * s, 1.05 * s, r(), r()));
    parts.push(piece(leafG, lc.clone().multiplyScalar(1.1), x + (r() - 0.5) * 0.6 * s, th + 1.25 * s, z + (r() - 0.5) * 0.6 * s, r() * 6, 0.7 * s, 0.6 * s, 0.7 * s));
  }
}

/** The sign's board: the destination's name burnt into old planks. */
function signTexture(text: string): CanvasTexture {
  const cv = document.createElement('canvas'); cv.width = 256; cv.height = 64;
  const x = cv.getContext('2d')!;
  x.fillStyle = '#7a5a3a'; x.fillRect(0, 0, 256, 64);
  x.fillStyle = 'rgba(0,0,0,0.18)'; for (let k = 0; k < 6; k++) x.fillRect(0, 8 + k * 10, 256, 1);
  x.fillStyle = '#2b1d12'; x.font = 'bold 30px sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle';
  let t = text; while (x.measureText(t).width > 236 && t.length > 3) t = t.slice(0, -2) + '…';
  x.fillText(t, 128, 34);
  const tex = new CanvasTexture(cv); tex.colorSpace = SRGBColorSpace;
  return tex;
}

/** A gate at (x, y) on a map of w x h; the way out is towards the nearest edge. */
export function gateMesh(p: GateSpec, w: number, h: number, mat: MeshLambertMaterial): Group {
  const g = new Group();
  const toEdge = [p.y, w - p.x, h - p.y, p.x]; // north, east, south, west
  let side = 0; for (let k = 1; k < 4; k++) if (toEdge[k]! < toEdge[side]!) side = k;
  const [ox, oz] = ([[0, -1], [1, 0], [0, 1], [-1, 0]] as const)[side]!;
  const lx = -oz, lz = ox, edge = toEdge[side]!;
  const r = dice(Math.round(p.x) * 7919 + Math.round(p.y) * 104729);
  const parts: BufferGeometry[] = [];
  const FAR = edge + 26, HALF = 22;
  // Forest floor beyond the map's edge, the way going on through it (paved at first, then a dirt track), fading into the shade.
  parts.push(strip(p.x, p.y, ox, oz, edge - 0.02, FAR, -HALF, HALF, -0.04, FLOOR, FLOOR2, 4));
  parts.push(strip(p.x, p.y, ox, oz, edge - 0.6, FAR, -1.7, 1.7, -0.01, ROAD, 0x3a3226, 8));
  parts.push(strip(p.x, p.y, ox, oz, edge + 2, FAR, -1.1, 1.1, 0.0, DIRT, 0x4a3a28, 8));
  // Thick woods on both sides of the way, closing in overhead further out.
  for (let d = edge + 0.5; d < FAR; d += 1.6 + r() * 0.8) {
    for (const sgn of [-1, 1]) {
      for (let l = 2.6 + r() * 0.8; l < HALF; l += 1.7 + r() * 1.2) {
        const big = l < 4 ? 1.25 : 1;
        tree(parts, r, p.x + ox * (d + (r() - 0.5)) + lx * sgn * l, p.y + oz * (d + (r() - 0.5)) + lz * sgn * l, big);
      }
    }
  }
  // Further out the way bends away out of sight: trees close across it, so it never ends on open sky.
  const bend = r() < 0.5 ? -1 : 1;
  for (let d = FAR - 16; d < FAR + 2; d += 1.5 + r() * 0.6) {
    const gap = Math.max(0, (FAR - 8 - d) / 8) * 2.6; // the opening narrows to nothing
    for (let l = -2.8; l <= 2.8; l += 1.3 + r() * 0.5) {
      const ll = l + bend * (d - FAR + 16) * 0.3;
      if (Math.abs(l) < gap) continue;
      tree(parts, r, p.x + ox * (d + (r() - 0.5)) + lx * ll, p.y + oz * (d + (r() - 0.5)) + lz * ll, 1.2);
    }
  }
  // Two old trees framing the opening, right at the map's edge.
  for (const sgn of [-1, 1]) tree(parts, r, p.x + ox * (edge - 0.3) + lx * sgn * 2.7, p.y + oz * (edge - 0.3) + lz * sgn * 2.7, 1.35);
  // The signpost at the side of the way: a post and a board facing whoever walks up to it, with a thin top plank.
  const sx = p.x + lx * 2.6, sz = p.y + lz * 2.6, ang = Math.atan2(-lz, lx), bx = sx - lx * 0.5, bz = sz - lz * 0.5;
  parts.push(piece(postG, WOOD, sx, 1.0, sz, ang, 0.14, 2.0, 0.14));
  parts.push(piece(postG, 0x6a4d31, bx, 1.6, bz, ang, 1.6, 0.46, 0.07, 0, 0.04));
  parts.push(piece(postG, 0x4f3a25, bx, 1.86, bz, ang, 1.7, 0.05, 0.15));
  const geo = mergeGeometries(parts, false)!;
  for (const q of parts) q.dispose();
  const m = new Mesh(geo, mat);
  m.castShadow = true; m.receiveShadow = true;
  g.add(m);
  if (p.label) {
    const tex = signTexture(p.label);
    const bm = new MeshLambertMaterial({ map: tex });
    // Both faces: the way in reads it as well as the way out.
    for (const f of [1, -1]) {
      const b = new Mesh(new PlaneGeometry(1.54, 0.4), bm);
      b.position.set(bx - ox * 0.04 * f, 1.6, bz - oz * 0.04 * f);
      b.rotation.set(0, Math.atan2(-ox * f, -oz * f), 0);
      b.rotateZ(0.04 * f);
      g.add(b);
    }
  }
  return g;
}
