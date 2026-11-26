import {
  InstancedMesh, MeshLambertMaterial, BoxGeometry, CylinderGeometry, IcosahedronGeometry, Matrix4, Quaternion, Euler, Vector3, Color,
  DynamicDrawUsage, type Scene, type BufferGeometry,
} from 'three';
import { Shape, hash2, type Look } from './look.js';

/**
 * Small moving bits of the world the chunk meshes (static) can't do (imad 2026-11-26):
 *  - a fridge's door swinging open / a chest's lid lifting while someone uses it (Notice `boxOpen`, and my own box page);
 *  - a cut tree falling over: it tips away from the one who cut it, slowly then faster, hits the ground with a little bounce and
 *    a burst of leaves, lies a moment, then sinks into the ground.
 * Everything is instanced (4 draw calls), nothing is allocated per frame.
 */
type At = (x: number, y: number) => number; // tile id at a map tile (-1 = unknown)

interface BoxAnim { tx: number; ty: number; fridge: boolean; until: number; k: number }
interface Fall { x: number; z: number; s: number; th: number; yaw: number; dir: number; t0: number; leaf: Color; leaf2: Color; trunk: Color; burst: boolean }

const FALL = 1.5, LIE = 1.6, SINK = 1.2;
const ease = (x: number) => x * x * (3 - 2 * x);

export class Anims {
  private box: InstancedMesh; private trunk: InstancedMesh; private leaf: InstancedMesh; private bits: InstancedMesh;
  private boxes = new Map<number, BoxAnim>();
  private falls: Fall[] = [];
  private m = new Matrix4(); private p = new Matrix4(); private q = new Quaternion(); private e = new Euler(); private v = new Vector3(); private s = new Vector3();
  private c = new Color(); private base = new Matrix4(); private hinge = new Matrix4(); private tmp = new Matrix4(); private tc = new Color();
  private nb = 0; private nt = 0; private nl = 0; private nx = 0;

  constructor(scene: Scene, shadows: boolean) {
    const mk = (g: BufferGeometry, n: number) => {
      const im = new InstancedMesh(g, new MeshLambertMaterial({ color: 0xffffff, flatShading: true }), n);
      im.instanceMatrix.setUsage(DynamicDrawUsage); im.count = 0; im.frustumCulled = false; im.castShadow = shadows;
      im.setColorAt(0, new Color());
      scene.add(im); return im;
    };
    this.box = mk(new BoxGeometry(1, 1, 1).translate(0, 0.5, 0), 96);
    this.trunk = mk(new CylinderGeometry(0.1, 0.17, 1, 6, 1, true).translate(0, 0.5, 0), 16);
    this.leaf = mk(new IcosahedronGeometry(1, 1), 32);
    this.bits = mk(new BoxGeometry(0.09, 0.02, 0.07), 16 * 14);
  }

  /** For the proof scripts: falling trees and their ages (s). */
  debug(now: number): number[] { return this.falls.map((f) => Math.round((now - f.t0) / 100) / 10); }
  /** A fridge / chest at tile (tx, ty) opens for `secs` (again = longer). */
  openBox(tx: number, ty: number, secs: number, fridge: boolean, now: number): void {
    const key = ty * 65536 + tx, b = this.boxes.get(key);
    if (b) { b.until = Math.max(b.until, now + secs * 1000); b.fridge = fridge; return; }
    if (this.boxes.size >= 24) return;
    this.boxes.set(key, { tx, ty, fridge, until: now + secs * 1000, k: 0 });
  }

  /** A tree on tile (wx, wy) was cut down: it falls away from (fromX, fromY) (the chopper; NaN = a random way). */
  fellTree(wx: number, wy: number, look: Look, fromX: number, fromY: number, now: number): void {
    if (this.falls.length >= 16) this.falls.shift();
    // The same tree the chunk drew (chunkmesh.ts): size, lean of the trunk, colours.
    const r1 = hash2(wx, wy), r2 = hash2(wy + 17, wx - 3), r3 = hash2(wx * 3 + 7, wy * 5 + 1);
    const s = 0.85 + r1 * 0.5, x = wx + 0.5 + (r2 - 0.5) * 0.3, z = wy + 0.5 + (r3 - 0.5) * 0.3, th = 0.9 * s + 0.3;
    const trunk = new Color(look.side), leaf = new Color(look.top);
    leaf.lerp(new Color(r2 < 0.5 ? 0x6aa84a : 0x3c7a38), r3 * 0.7).multiplyScalar(0.92 + r1 * 0.16);
    const dir = Number.isFinite(fromX) && Math.hypot(x - fromX, z - fromY) > 0.05 ? Math.atan2(x - fromX, z - fromY) : r1 * Math.PI * 2;
    this.falls.push({ x, z, s, th, yaw: r2 * 6, dir, t0: now, leaf, leaf2: leaf.clone().multiplyScalar(1.08), trunk, burst: false });
  }

  /** Every frame: draw what is moving. `at` reads tiles, `looks` their looks (to find a box's wall), `keepOpen` = my own box page. */
  update(now: number, dt: number, at: At, looks: Look[], keepOpen: [number, number] | null): void {
    this.nb = this.nt = this.nl = this.nx = 0;
    if (keepOpen) { const b = this.boxes.get(keepOpen[1] * 65536 + keepOpen[0]); if (b) b.until = Math.max(b.until, now + 400); }
    for (const [key, b] of this.boxes) {
      const want = now < b.until ? 1 : 0;
      b.k += Math.sign(want - b.k) * Math.min(Math.abs(want - b.k), dt * (want ? 2.6 : 2.0));
      const id = at(b.tx, b.ty), L = id >= 0 ? looks[id] : undefined;
      if (!L || (L.shape !== Shape.Fridge && L.shape !== Shape.Chest)) { this.boxes.delete(key); continue; } // pulled down
      if (b.k <= 0.001 && !want) { this.boxes.delete(key); continue; }
      this.drawBox(b, L, at, looks);
    }
    for (let k = this.falls.length - 1; k >= 0; k--) if (!this.drawFall(this.falls[k]!, (now - this.falls[k]!.t0) / 1000)) this.falls.splice(k, 1);
    const fl = (im: InstancedMesh, n: number) => { im.count = n; im.instanceMatrix.needsUpdate = true; if (im.instanceColor) im.instanceColor.needsUpdate = true; };
    fl(this.box, this.nb); fl(this.trunk, this.nt); fl(this.leaf, this.nl); fl(this.bits, this.nx);
  }

  private put(im: InstancedMesh, n: number, color: Color | number): void {
    im.setMatrixAt(n, this.m);
    im.setColorAt(n, typeof color === 'number' ? this.c.setHex(color) : color);
  }
  private part(x: number, y: number, z: number, rx: number, ry: number, rz: number, sx: number, sy: number, sz: number): Matrix4 {
    return this.p.compose(this.v.set(x, y, z), this.q.setFromEuler(this.e.set(rx, ry, rz)), this.s.set(sx, sy, sz));
  }

  /** The open door / lid over the closed one the chunk drew: the inside dark, the door swung on its hinge. */
  private drawBox(b: BoxAnim, L: Look, at: At, looks: Look[]): void {
    if (this.nb > 90) return;
    const wallAt = (x: number, y: number) => { const id = at(x, y); return id >= 0 && looks[id]!.shape === Shape.Wall ? 1 : 0; };
    const [bx, bz] = wallAt(b.tx, b.ty - 1) ? [0, -1] : wallAt(b.tx, b.ty + 1) ? [0, 1] : wallAt(b.tx - 1, b.ty) ? [-1, 0] : wallAt(b.tx + 1, b.ty) ? [1, 0] : [0, -1];
    const fx = -bx, fz = -bz, yaw = Math.atan2(fx, fz); // local +z = the front
    const cx = b.tx + 0.5 + bx * 0.12, cz = b.ty + 0.5 + bz * 0.12, k = ease(b.k);
    // Local frame: x = across the front, z = out of the front.
    const base = this.base.compose(this.v.set(cx, 0, cz), this.q.setFromEuler(this.e.set(0, yaw, 0)), this.s.set(1, 1, 1));
    const emit = (color: Color | number) => { this.m.multiplyMatrices(base, this.p); this.put(this.box, this.nb++, color); };
    // A part turned about a hinge: base * T(hinge) * R * T(offset) * part.
    const hinged = (hx: number, hy: number, hz: number, rx: number, ry: number, ox: number, oy: number, oz: number, sx: number, sy: number, sz: number, color: Color | number) => {
      this.hinge.compose(this.v.set(hx, hy, hz), this.q.setFromEuler(this.e.set(rx, ry, 0)), this.s.set(1, 1, 1));
      this.hinge.premultiply(base);
      this.tmp.compose(this.v.set(ox, oy, oz), this.q.identity(), this.s.set(sx, sy, sz));
      this.m.multiplyMatrices(this.hinge, this.tmp); this.put(this.box, this.nb++, color);
    };
    if (b.fridge) {
      // The dark inside with two shelves (a fridge is 0.74 wide, 1.78 high, 0.66 deep), then the door hinged on its left edge.
      this.part(0, 0.06, 0.336, 0, 0, 0, 0.66 * Math.min(1, k * 3), 1.66, 0.012); emit(0x2a2f33);
      if (k > 0.2) { this.part(0, 0.62, 0.3, 0, 0, 0, 0.62, 0.025, 0.06); emit(0xd8dde0); this.part(0, 1.12, 0.3, 0, 0, 0, 0.62, 0.025, 0.06); emit(0xd8dde0); }
      if (k > 0.35) { this.part(-0.12, 0.66, 0.29, 0, 0, 0, 0.16, 0.14, 0.12); emit(0xc4523f); this.part(0.14, 1.16, 0.29, 0, 0, 0, 0.1, 0.2, 0.1); emit(0x7fb8d8); } // a can, a bottle
      const a = k * 1.75; // hinge at the left front edge (x -0.37, z 0.33): the door swings out to the side
      hinged(-0.37, 0, 0.33, 0, -a, 0.37, 0, 0.025, 0.74, 1.78, 0.05, this.tc.setHex(L.top).multiplyScalar(0.98));
      hinged(-0.37, 0, 0.33, 0, -a, 0.66, 0.5, 0.07, 0.04, 0.55, 0.04, L.side); // its handle, near the free edge
    } else {
      // A chest: the dark inside over the closed lid, the lid lifted on its back edge.
      this.part(0, 0.58, 0, 0, 0, 0, 0.8 * Math.min(1, k * 3), 0.06, 0.52); emit(0x2a1f16);
      if (k > 0.3) { this.part(-0.18, 0.6, 0.02, 0, 0.3, 0, 0.16, 0.06, 0.14); emit(0xb08a5f); this.part(0.16, 0.6, -0.05, 0, -0.2, 0, 0.2, 0.05, 0.12); emit(0x8a9096); } // wood, a bit of metal
      const a = k * 1.4; // hinge along the back top edge (stands up, not into the wall): the front of the lid lifts up and over
      hinged(0, 0.62, -0.29, -a, 0, 0, -0.12, 0.29, 0.86, 0.12, 0.58, 0x7c5230);
      hinged(0, 0.62, -0.29, -a, 0, 0, -0.1, 0.58, 0.1, 0.14, 0.04, L.side); // the lock on its front
    }
  }

  /** One falling tree at t seconds; false once it has gone. */
  private drawFall(f: Fall, t: number): boolean {
    if (t > FALL + LIE + SINK || this.nt >= 16) return false;
    // Tipping over: an angle from upright to flat, slow at first (gravity), a little bounce when it lands.
    let ang: number;
    if (t < FALL) { const u = t / FALL; ang = (Math.PI / 2) * u * u; }
    else { const u = t - FALL; ang = Math.PI / 2 - Math.abs(Math.sin(u * 9)) * Math.exp(-u * 6) * 0.12; }
    const sink = t > FALL + LIE ? ease((t - FALL - LIE) / SINK) : 0, down = sink * 0.9, shrink = 1 - sink * 0.35;
    // Rotation about the trunk's foot, around the axis across the fall direction.
    const pivot = this.base.compose(this.v.set(f.x, -down, f.z), this.q.setFromEuler(this.e.set(0, f.dir, 0)), this.s.set(shrink, shrink, shrink));
    pivot.multiply(this.tmp.makeRotationX(ang));
    const emit = (im: InstancedMesh, n: number, c: Color) => { this.m.multiplyMatrices(pivot, this.p); this.put(im, n, c); };
    this.part(0, 0, 0, 0, f.yaw, 0, f.s, f.th, f.s); emit(this.trunk, this.nt++, f.trunk);
    if (this.nl < 30) {
      this.part(0, f.th + 0.5 * f.s, 0, 0.3, f.yaw, 0.2, 0.95 * f.s, 0.8 * f.s, 0.95 * f.s); emit(this.leaf, this.nl++, f.leaf);
      this.part(0.12 * f.s, f.th + 1.05 * f.s, 0.08, 0.5, f.yaw * 2, 0.1, 0.62 * f.s, 0.55 * f.s, 0.62 * f.s); emit(this.leaf, this.nl++, f.leaf2);
    }
    // Leaves flying off where the crown hits the ground.
    if (t > FALL * 0.92 && t < FALL + 1.1) {
      const u = (t - FALL * 0.92) / 1.2, reach = f.th + 0.8 * f.s;
      const hx = f.x + Math.sin(f.dir) * reach, hz = f.z + Math.cos(f.dir) * reach;
      for (let j = 0; j < 14 && this.nx < 16 * 14; j++) {
        const a = j * 2.399 + f.yaw, sp = 0.8 + (j % 5) * 0.35, up = 2.2 + (j % 3) * 0.8;
        const x = hx + Math.cos(a) * sp * u, z = hz + Math.sin(a) * sp * u, y = Math.max(0.03, 0.4 + up * u - 4.9 * u * u);
        this.m.compose(this.v.set(x, y, z), this.q.setFromEuler(this.e.set(u * 9 + j, a, u * 7)), this.s.set(1.6, 1.6, 1.6));
        this.put(this.bits, this.nx++, j % 2 ? f.leaf : f.leaf2);
      }
    }
    return true;
  }
}
