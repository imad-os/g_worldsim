import {
  InstancedMesh, MeshLambertMaterial, MeshBasicMaterial, CylinderGeometry, SphereGeometry, CircleGeometry, OctahedronGeometry,
  Matrix4, Quaternion, Euler, Vector3, Color, DynamicDrawUsage, type Scene, type BufferGeometry, type Material,
} from 'three';

/**
 * Every person on screen (agents and players) as a few instanced meshes: body, head, hair, two legs, two arms,
 * a soft round shadow on low-end TVs (real shadows otherwise) and a marker over players. Walking swings the legs
 * and arms with the person's real speed. Nothing is allocated per frame.
 */
const SCALE = 1.25; // a bit bigger than life, so people read well from the tilted camera

export interface PersonLook { tunic: Color; skin: Color; hair: Color; pants: Color }

export class People {
  private body: InstancedMesh; private head: InstancedMesh; private hair: InstancedMesh;
  private legs: InstancedMesh; private arms: InstancedMesh; private blob: InstancedMesh | null; private mark: InstancedMesh;
  private n = 0; private nm = 0;
  private base = new Matrix4(); private m = new Matrix4(); private part = new Matrix4();
  private q = new Quaternion(); private e = new Euler(); private v = new Vector3(); private s = new Vector3();
  private cap: number;

  constructor(scene: Scene, cap: number, shadows: boolean) {
    this.cap = cap;
    const lam = () => new MeshLambertMaterial({ color: 0xffffff });
    const mk = (g: BufferGeometry, mat: Material, count: number, cast: boolean) => {
      const im = new InstancedMesh(g, mat, count);
      im.instanceMatrix.setUsage(DynamicDrawUsage);
      im.count = 0; im.frustumCulled = false; im.castShadow = cast && shadows;
      scene.add(im);
      return im;
    };
    this.body = mk(new CylinderGeometry(0.17, 0.24, 0.6, 10).translate(0, 0.8, 0), lam(), cap, true);
    this.head = mk(new SphereGeometry(0.17, 14, 10).translate(0, 1.3, 0), lam(), cap, true);
    this.hair = mk(new SphereGeometry(0.182, 14, 6, 0, Math.PI * 2, 0, Math.PI * 0.55).translate(0, 1.33, -0.015), lam(), cap, true);
    this.legs = mk(new CylinderGeometry(0.075, 0.065, 0.5, 6).translate(0, -0.25, 0), lam(), cap * 2, true);
    this.arms = mk(new CylinderGeometry(0.06, 0.05, 0.44, 6).translate(0, -0.22, 0), lam(), cap * 2, true);
    this.blob = shadows ? null : mk(new CircleGeometry(0.38, 16).rotateX(-Math.PI / 2),
      new MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.28, depthWrite: false }), cap, false);
    this.mark = mk(new OctahedronGeometry(0.12, 0).scale(1, 1.6, 1), new MeshBasicMaterial({ color: 0xffffff }), 64, false);
    for (const im of [this.body, this.head, this.hair, this.legs, this.arms, this.mark]) im.setColorAt(0, new Color());
  }

  begin(): void { this.n = 0; this.nm = 0; }

  /**
   * One person. x, z = ground position; facing = rotation around up (0 = towards +z); phase / amp = walk cycle
   * (amp 0 standing .. 1 running); lying = asleep or dead.
   */
  add(x: number, z: number, facing: number, phase: number, amp: number, look: PersonLook, lying: boolean): void {
    if (this.n >= this.cap) return;
    const i = this.n++;
    const bob = Math.abs(Math.sin(phase)) * 0.05 * amp;
    this.base.compose(this.v.set(x, bob, z), this.q.setFromEuler(this.e.set(0, facing, 0)), this.s.set(SCALE, SCALE, SCALE));
    if (lying) {
      this.part.compose(this.v.set(0, 0.2, -0.55), this.q.setFromEuler(this.e.set(Math.PI / 2, 0, 0)), this.s.set(1, 1, 1));
      this.base.multiply(this.part);
    }
    this.body.setMatrixAt(i, this.base); this.body.setColorAt(i, look.tunic);
    this.head.setMatrixAt(i, this.base); this.head.setColorAt(i, look.skin);
    this.hair.setMatrixAt(i, this.base); this.hair.setColorAt(i, look.hair);
    const sw = Math.sin(phase) * 0.7 * amp;
    for (let k = 0; k < 2; k++) {
      const side = k ? 1 : -1;
      this.part.compose(this.v.set(side * 0.1, 0.52, 0), this.q.setFromEuler(this.e.set(sw * side, 0, 0)), this.s.set(1, 1, 1));
      this.m.multiplyMatrices(this.base, this.part);
      this.legs.setMatrixAt(i * 2 + k, this.m); this.legs.setColorAt(i * 2 + k, look.pants);
      this.part.compose(this.v.set(side * 0.25, 1.07, 0), this.q.setFromEuler(this.e.set(-sw * side * 0.8, 0, side * 0.12)), this.s.set(1, 1, 1));
      this.m.multiplyMatrices(this.base, this.part);
      this.arms.setMatrixAt(i * 2 + k, this.m); this.arms.setColorAt(i * 2 + k, look.tunic);
    }
    if (this.blob) {
      this.m.makeTranslation(x, 0.03, z);
      this.blob.setMatrixAt(i, this.m);
    }
  }

  /** A floating marker over a player (yours or someone else's). */
  marker(x: number, z: number, t: number, color: Color): void {
    if (this.nm >= 64) return;
    const i = this.nm++;
    this.m.compose(this.v.set(x, 2.15 + Math.sin(t * 3) * 0.08, z), this.q.setFromEuler(this.e.set(0, t * 2, 0)), this.s.set(1, 1, 1));
    this.mark.setMatrixAt(i, this.m); this.mark.setColorAt(i, color);
  }

  end(): void {
    const n = this.n;
    for (const im of [this.body, this.head, this.hair]) { im.count = n; flag(im); }
    for (const im of [this.legs, this.arms]) { im.count = n * 2; flag(im); }
    if (this.blob) { this.blob.count = n; this.blob.instanceMatrix.needsUpdate = true; }
    this.mark.count = this.nm; flag(this.mark);
  }
}

function flag(im: InstancedMesh): void {
  im.instanceMatrix.needsUpdate = true;
  if (im.instanceColor) im.instanceColor.needsUpdate = true;
}
