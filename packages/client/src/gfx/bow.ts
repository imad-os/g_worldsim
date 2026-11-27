import { BoxGeometry, ConeGeometry, CylinderGeometry, Group, Mesh, MeshLambertMaterial, PlaneGeometry, DoubleSide, Vector3, type Color } from 'three';

/**
 * A bow that really draws (imad 2026-11-27: "hold the bow right, pull the arrow on the string when aiming, release it properly";
 * only for my own character, to save the TV's work): two limbs that bend as the string comes back, a leather grip, the string
 * from tip to tip through the nocking point, an arrow nocked on it (on the left of the grip, as a right-hander shoots), and on
 * release the string snaps forward and shivers while the arrow leaves. One small group, rebuilt per frame from a few numbers.
 *
 * Local frame: the grip at the origin, the bow standing along +y, +z towards the archer (the string side), -z towards the target.
 */
const SEG = 8; // segments per limb
const HALF = 0.5; // grip to tip, metres
export const DRAW_LEN = 0.38; // how far the string comes back at full draw
const ARROW = 0.74;

export class LiveBow {
  readonly g = new Group();
  private limbs: Mesh[] = [];
  private strings: [Mesh, Mesh];
  private arrow = new Group();
  private flying = new Group();
  private wood = new MeshLambertMaterial({ color: 0x5b3a1e });
  private v = new Vector3(); private a = new Vector3(); private b = new Vector3();
  private static Y = new Vector3(0, 1, 0);
  /** The nocking point now (local), where the string hand holds. */
  readonly nock = new Vector3(0, 0, 0.08);

  constructor(shadows = false) {
    const seg = new CylinderGeometry(1, 1, 1, 6).translate(0, 0.5, 0); // unit long along +y, radius scaled per segment
    for (let k = 0; k < SEG * 2; k++) { const m = new Mesh(seg, this.wood); m.castShadow = shadows; this.limbs.push(m); this.g.add(m); }
    const grip = new Mesh(new CylinderGeometry(0.019, 0.019, 0.13, 8), new MeshLambertMaterial({ color: 0x3a2414 }));
    grip.castShadow = shadows; this.g.add(grip);
    const sGeo = new CylinderGeometry(0.0025, 0.0025, 1, 4).translate(0, 0.5, 0), sMat = new MeshLambertMaterial({ color: 0xe8e2d0 });
    this.strings = [new Mesh(sGeo, sMat), new Mesh(sGeo, sMat)];
    for (const s of this.strings) this.g.add(s);
    // The arrow: shaft, steel head, three feathers, along -z from its nock (origin).
    const shaft = new Mesh(new CylinderGeometry(0.0045, 0.0045, ARROW, 5).rotateX(Math.PI / 2).translate(0, 0, -ARROW / 2), new MeshLambertMaterial({ color: 0xc9a46a }));
    const head = new Mesh(new ConeGeometry(0.011, 0.05, 5).rotateX(-Math.PI / 2).translate(0, 0, -ARROW - 0.02), new MeshLambertMaterial({ color: 0x9aa3ad }));
    const nockM = new Mesh(new BoxGeometry(0.009, 0.009, 0.014).translate(0, 0, -0.007), new MeshLambertMaterial({ color: 0x222222 }));
    const fMat = new MeshLambertMaterial({ color: 0xd8473a, side: DoubleSide });
    this.arrow.add(shaft, head, nockM);
    for (let k = 0; k < 3; k++) {
      const f = new Mesh(new PlaneGeometry(0.02, 0.09).rotateX(Math.PI / 2).translate(0, 0.012, -0.075), fMat);
      f.rotation.z = (k * Math.PI * 2) / 3; this.arrow.add(f);
    }
    this.arrow.traverse((c) => { (c as Mesh).castShadow = shadows; });
    this.flying.add(this.arrow.clone());
    this.g.add(this.arrow, this.flying);
    for (const o of [this.g, this.arrow, this.flying]) o.traverse((c) => { c.frustumCulled = false; });
    this.flying.visible = false;
  }

  /**
   * draw 0..1 (string pulled back), vib = string shiver (m, after a release), arrowOn = an arrow on the string, fly = seconds since
   * an arrow left (-1 = none), tint = the bow's quality colour.
   */
  update(draw: number, vib: number, arrowOn: boolean, fly: number, tint?: Color): void {
    if (tint) this.wood.color.setHex(0x5b3a1e).multiply(tint);
    // The limbs: the middle is the farthest from the string; drawing bends them back and pulls the tips in a little.
    const bend = 0.07 + 0.055 * draw, shrink = 1 - 0.06 * draw;
    const pt = (t: number, out: Vector3) => out.set(0, t * HALF * shrink * (1 - 0.04 * t * t * draw), bend * t * t + 0.012 * t * t * t * t);
    let k = 0;
    for (const side of [1, -1]) {
      for (let s = 0; s < SEG; s++) {
        const t0 = (s / SEG) * side, t1 = ((s + 1) / SEG) * side;
        pt(t0, this.a); pt(t1, this.b);
        const m = this.limbs[k++]!;
        this.v.copy(this.b).sub(this.a);
        const len = this.v.length(), r = 0.016 - 0.009 * Math.abs(t0); // thick at the grip, thin at the tips
        m.position.copy(this.a);
        m.quaternion.setFromUnitVectors(LiveBow.Y, this.v.multiplyScalar(1 / len));
        m.scale.set(r, len, r);
      }
    }
    // The string: both tips to the nocking point.
    pt(1, this.a); pt(-1, this.b);
    const tipZ = this.a.z;
    this.nock.set(0, 0, tipZ + draw * DRAW_LEN + vib);
    for (let s = 0; s < 2; s++) {
      const tip = s ? this.b : this.a, m = this.strings[s]!;
      this.v.copy(this.nock).sub(tip);
      const len = this.v.length();
      m.position.copy(tip); m.quaternion.setFromUnitVectors(LiveBow.Y, this.v.multiplyScalar(1 / len)); m.scale.set(1, len, 1);
    }
    // The arrow sits on the string, on the left of the grip (the arrow rest).
    this.arrow.visible = arrowOn;
    if (arrowOn) this.arrow.position.set(-0.014, 0.012, this.nock.z);
    this.flying.visible = fly >= 0 && fly < 0.18;
    if (this.flying.visible) this.flying.position.set(-0.014, 0.012, tipZ - fly * 45);
  }
}

/**
 * The shot's timeline, from what the TV knows at once (Aim held / let go) and what the server says (a quick shot = anim 6 without
 * aiming): draw 0..1, the bow raised 0..1, an arrow on the string, the string's shiver and the flying arrow after the release.
 */
export class BowShot {
  draw = 0; up = 0; arrowOn = false; vib = 0; fly = -1;
  /** Seconds since the string was let go (-1 = none) and how far it had been drawn. */
  relT = -1; lastDraw = 0;
  private wasAim = false; private quick = false;
  /** Still playing a shot (the bow stays in hand whatever the weapon is). */
  get busy(): boolean { return this.wasAim || this.quick || (this.relT >= 0 && this.relT < 0.95); }
  reset(): void { this.wasAim = false; this.quick = false; this.relT = -1; this.draw = 0; this.up = 0; this.arrowOn = false; this.vib = 0; this.fly = -1; }
  step(aiming: boolean, anim: number, at: number, dt: number): void {
    const ease = (x: number) => { const c = Math.max(0, Math.min(1, x)); return c * c * (3 - 2 * c); };
    this.draw = 0; this.up = 0; this.arrowOn = false; this.vib = 0; this.fly = -1;
    if (aiming) { this.draw = ease(at / 0.6); this.up = 1; this.arrowOn = true; this.lastDraw = this.draw; this.wasAim = true; this.relT = -1; this.quick = false; return; }
    if (this.wasAim) { this.wasAim = false; this.relT = 0; } // let go of Aim = the shot
    if (anim === 6 && at < 0.3 && (this.relT < 0 || this.relT > 1.5) && !this.quick) this.quick = true; // a quick shot (Attack with a bow)
    if (this.quick) {
      if (anim === 6 && at < 0.3) { this.draw = ease(at / 0.3); this.up = 1; this.arrowOn = true; this.lastDraw = this.draw; return; }
      this.quick = false; this.relT = 0;
    }
    if (this.relT >= 0) {
      this.relT += dt;
      const t = this.relT;
      this.vib = this.lastDraw * 0.045 * Math.exp(-t * 12) * Math.cos(t * 80);
      this.fly = this.lastDraw > 0.25 ? t : -1;
      this.up = t < 0.55 ? 1 : 1 - ease((t - 0.55) / 0.35);
      if (t > 2) this.relT = -1;
    }
  }
}
