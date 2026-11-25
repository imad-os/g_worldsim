import {
  InstancedMesh, MeshLambertMaterial, SphereGeometry, CylinderGeometry, ConeGeometry, Matrix4, Quaternion, Euler, Vector3, Color,
  DynamicDrawUsage, type Scene, type BufferGeometry,
} from 'three';

/**
 * Wild animals as instanced low-poly quadrupeds: a body, a head, 4 legs, 2 ears (or horns / antlers) and a tail,
 * scaled and coloured per kind (rabbit, deer, boar, wolf, bear). Legs swing with the real speed. No allocation per frame.
 * A killed animal (`dead` = seconds since it died) staggers, falls on its side with a last kick of the legs, lies still,
 * then sinks into the ground (gone after DEATH_SECS).
 */
interface Shape4 { len: number; h: number; wide: number; head: number; leg: number; ear: number; earUp: number; tail: number; body: number; headC: number; earC: number }
const KINDS: Shape4[] = [
  { len: 0.32, h: 0.2, wide: 0.2, head: 0.12, leg: 0.08, ear: 0.16, earUp: 1, tail: 0.06, body: 0xb3a08a, headC: 0xb8a690, earC: 0xc9b6a0 }, // rabbit
  { len: 0.9, h: 0.42, wide: 0.32, head: 0.17, leg: 0.62, ear: 0.3, earUp: 0.5, tail: 0.07, body: 0xa0703f, headC: 0x9a6a3a, earC: 0x6b4a2a }, // deer (antlers)
  { len: 0.78, h: 0.42, wide: 0.4, head: 0.2, leg: 0.3, ear: 0.1, earUp: 0.6, tail: 0.04, body: 0x4f3d30, headC: 0x47372b, earC: 0xe6dcc6 }, // boar (tusks)
  { len: 0.75, h: 0.32, wide: 0.26, head: 0.16, leg: 0.42, ear: 0.13, earUp: 1, tail: 0.12, body: 0x7d7d80, headC: 0x8a8a8e, earC: 0x5a5a5e }, // wolf
  { len: 1.25, h: 0.62, wide: 0.66, head: 0.3, leg: 0.48, ear: 0.1, earUp: 1, tail: 0.06, body: 0x4a3324, headC: 0x523a29, earC: 0x3a281c }, // bear
  { len: 1.25, h: 0.5, wide: 0.42, head: 0.2, leg: 0.8, ear: 0.12, earUp: 1, tail: 0.14, body: 0x7a4424, headC: 0x6e3c20, earC: 0x1d1712 }, // horse (until its model has loaded)
];

/** How long a killed animal stays on screen (s). */
export const DEATH_SECS = 4;

export class Animals3D {
  private body: InstancedMesh; private head: InstancedMesh; private legs: InstancedMesh; private ears: InstancedMesh; private tail: InstancedMesh;
  private n = 0;
  private base = new Matrix4(); private m = new Matrix4(); private part = new Matrix4();
  private q = new Quaternion(); private e = new Euler(); private eb = new Euler(0, 0, 0, 'YXZ'); private v = new Vector3(); private s = new Vector3();
  private cols: { body: Color; head: Color; ear: Color }[];

  constructor(scene: Scene, private cap: number, shadows: boolean) {
    const mk = (g: BufferGeometry, count: number) => {
      const im = new InstancedMesh(g, new MeshLambertMaterial({ color: 0xffffff, flatShading: true }), count);
      im.instanceMatrix.setUsage(DynamicDrawUsage); im.count = 0; im.frustumCulled = false; im.castShadow = shadows;
      im.setColorAt(0, new Color());
      scene.add(im); return im;
    };
    this.body = mk(new SphereGeometry(0.5, 10, 7), cap);
    this.head = mk(new SphereGeometry(0.5, 9, 6), cap);
    this.legs = mk(new CylinderGeometry(0.5, 0.4, 1, 5).translate(0, -0.5, 0), cap * 4);
    this.ears = mk(new ConeGeometry(0.5, 1, 4).translate(0, 0.5, 0), cap * 2);
    this.tail = mk(new SphereGeometry(0.5, 6, 4), cap);
    this.cols = KINDS.map((k) => ({ body: new Color(k.body), head: new Color(k.headC), ear: new Color(k.earC) }));
  }

  begin(): void { this.n = 0; }

  /** One animal at (x, z) facing `facing` (0 = +z), walk phase / amp (0..1); `dead` >= 0 = seconds since it was killed. */
  add(type: number, x: number, z: number, facing: number, phase: number, amp: number, dead = -1): void {
    if (this.n >= this.cap) return;
    const K = KINDS[type] ?? KINDS[0]!, C = this.cols[type] ?? this.cols[0]!, i = this.n++;
    let roll = 0, sink = 0, kick = 0, pitch = 0;
    if (dead >= 0) { // stagger (0.15 s), fall on the side (0.45 s, a small bounce), legs kick and go still, sink at the end
      amp = 0;
      const f = Math.min(1, Math.max(0, (dead - 0.15) / 0.45)), fall = f * f * (3 - 2 * f);
      const bounce = dead > 0.6 && dead < 0.9 ? Math.sin(((dead - 0.6) / 0.3) * Math.PI) * 0.12 : 0;
      roll = (Math.PI / 2) * fall - bounce;
      pitch = dead < 0.15 ? -0.15 * Math.sin((dead / 0.15) * Math.PI) : 0; // the hit: a jolt back
      kick = dead > 0.6 && dead < 1.6 ? Math.sin(dead * 22) * 0.35 * (1.6 - dead) : 0;
      sink = dead > DEATH_SECS - 1 ? Math.min(1, dead - (DEATH_SECS - 1)) * (K.h + K.wide) * 0.9 : 0;
    }
    const hop = type === 0 ? Math.abs(Math.sin(phase)) * 0.12 * amp : Math.abs(Math.sin(phase * 2)) * 0.03 * amp;
    const y = K.leg + K.h / 2 + hop;
    // A dead animal tips over round the middle of its body (YXZ: turn to its facing first, then roll), down onto its side.
    const y0 = K.leg + K.h / 2, cy = y0 + (K.wide / 2 - y0) * Math.sin(roll) - sink;
    this.base.compose(this.v.set(x, cy * 1.35, z), this.q.setFromEuler(this.eb.set(pitch, facing, roll, 'YXZ')), this.s.set(1.35, 1.35, 1.35)); // a bit bigger than life, like people
    this.base.multiply(this.part.makeTranslation(0, -y0, 0));
    const put = (im: InstancedMesh, k: number, px: number, py: number, pz: number, rx: number, ry: number, rz: number, sx: number, sy: number, sz: number, c: Color) => {
      this.part.compose(this.v.set(px, py, pz), this.q.setFromEuler(this.e.set(rx, ry, rz)), this.s.set(sx, sy, sz));
      this.m.multiplyMatrices(this.base, this.part);
      im.setMatrixAt(k, this.m); im.setColorAt(k, c);
    };
    put(this.body, i, 0, y, 0, 0, 0, 0, K.wide, K.h, K.len, C.body);
    const hz = K.len / 2 + K.head * 0.55, hy = y + K.h * 0.35;
    put(this.head, i, 0, hy, hz, 0, 0, 0, K.head * 1.6, K.head * 1.5, K.head * (type === 2 ? 2.4 : 2), C.head);
    put(this.tail, i, 0, y + K.h * 0.2, -K.len / 2, 0.6, 0, 0, K.tail * 1.2, K.tail, K.tail * (type === 3 ? 4 : 1.4), C.ear);
    const sw = Math.sin(phase) * 0.35 * amp + kick;
    for (let k = 0; k < 4; k++) {
      const side = k & 1 ? 1 : -1, front = k < 2 ? 1 : -1;
      put(this.legs, i * 4 + k, side * K.wide * 0.3, K.leg + 0.02, front * K.len * 0.3, sw * side * front, 0, 0, K.wide * 0.22 + 0.02, K.leg + 0.02, K.wide * 0.22 + 0.02, C.body);
    }
    for (let k = 0; k < 2; k++) {
      const side = k ? 1 : -1;
      if (type === 2) put(this.ears, i * 2 + k, side * K.head * 0.5, hy - K.head * 0.3, hz + K.head * 0.9, 1.3, 0, -side * 0.3, 0.04, K.ear, 0.04, C.ear); // tusks
      else put(this.ears, i * 2 + k, side * K.head * 0.45, hy + K.head * 0.55, hz - K.head * 0.1, -0.2 * K.earUp, 0, side * (type === 1 ? 0.6 : 0.25), K.ear * (type === 1 ? 0.18 : 0.45), K.ear, K.ear * 0.25, C.ear);
    }
  }

  end(): void {
    const n = this.n;
    for (const [im, k] of [[this.body, 1], [this.head, 1], [this.tail, 1], [this.legs, 4], [this.ears, 2]] as const) {
      im.count = n * k; im.instanceMatrix.needsUpdate = true; if (im.instanceColor) im.instanceColor.needsUpdate = true;
    }
  }
}
