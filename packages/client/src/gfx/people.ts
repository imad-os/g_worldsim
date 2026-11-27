import {
  InstancedMesh, MeshLambertMaterial, MeshBasicMaterial, CylinderGeometry, SphereGeometry, CircleGeometry, OctahedronGeometry, IcosahedronGeometry,
  Matrix4, Quaternion, Euler, Vector3, Color, DynamicDrawUsage, AdditiveBlending, type Scene, type BufferGeometry, type Material,
} from 'three';
import { itemGeo, itemsReady } from './items.js';

/**
 * Every person on screen (agents and players) as a few instanced meshes: body, head, hair, two legs, two arms,
 * a soft round shadow on low-end TVs (real shadows otherwise) and a marker over players. Walking swings the legs
 * and arms with the person's real speed. Nothing is allocated per frame.
 *
 * Gear (imad 2026-11-25): the weapon in hand, a bow on the back, a helmet, shoulder pads over armour, leather clothes,
 * from CC0 models (gfx/items.ts), tinted and glowing by quality; and moves: attack, chop, mine, build, talk, shoot, use.
 */
const SCALE = 1.25; // a bit bigger than life, so people read well from the tilted camera

export interface PersonLook { tunic: Color; skin: Color; hair: Color; pants: Color }

/** Quality tints (normal, fine, superior, epic, elite) and glows. */
const Q_TINT = [new Color(1, 1, 1), new Color(0.95, 1.08, 0.95), new Color(0.88, 0.97, 1.18), new Color(1.06, 0.86, 1.22), new Color(1.35, 1.08, 0.55)];
const Q_GLOW = [new Color(0), new Color(0), new Color(0x2a6bff), new Color(0x9b3cff), new Color(0xffa31a)];
const ARMOR = new Color(0x7f8793), LEATHER = new Color(0x8b5a35);
/** Held models and their length (for the glow along them). */
const HELD = ['', 'sword', 'axe', 'spear', 'bow'] as const;
const MODELS = ['sword', 'axe', 'spear', 'bow', 'hammer', 'sledge', 'helmet', 'pads'] as const;
type Model = (typeof MODELS)[number];
const LEN: Record<string, number> = { sword: 1.0, axe: 0.75, spear: 1.75, bow: 0.55, hammer: 0.55, sledge: 0.85 };
const ease = (x: number) => x * x * (3 - 2 * x);

export class People {
  private body: InstancedMesh; private head: InstancedMesh; private hair: InstancedMesh;
  private legs: InstancedMesh; private arms: InstancedMesh; private blob: InstancedMesh | null; private mark: InstancedMesh;
  private glow: InstancedMesh;
  private gear: Partial<Record<Model, InstancedMesh>> = {};
  private gn: Record<Model, number> = { sword: 0, axe: 0, spear: 0, bow: 0, hammer: 0, sledge: 0, helmet: 0, pads: 0 };
  private nGlow = 0;
  private n = 0; private nm = 0;
  private base = new Matrix4(); private m = new Matrix4(); private part = new Matrix4(); private hand = new Matrix4(); private lhand = new Matrix4(); private hm = new Matrix4();
  private q = new Quaternion(); private e = new Euler(); private v = new Vector3(); private s = new Vector3();
  private cap: number; private gcap: number;
  private tmpC = new Color();

  /**
   * lo = the far set (imad 2026-11-26, 60 fps: "the further away, the less detail"): fewer sides on every part, no shadow cast
   * (a soft round one on the ground instead), no held or worn models.
   */
  constructor(private scene: Scene, cap: number, private shadows: boolean, private lo = false) {
    this.cap = cap; this.gcap = lo ? 0 : Math.min(cap, 160);
    const lam = () => new MeshLambertMaterial({ color: 0xffffff });
    const mk = (g: BufferGeometry, mat: Material, count: number, cast: boolean) => {
      const im = new InstancedMesh(g, mat, count);
      im.instanceMatrix.setUsage(DynamicDrawUsage);
      im.count = 0; im.frustumCulled = false; im.castShadow = cast && shadows;
      scene.add(im);
      return im;
    };
    const r = lo ? 0.5 : 1; // sides of each part (far: half)
    this.body = mk(new CylinderGeometry(0.17, 0.24, 0.6, Math.round(10 * r)).translate(0, 0.8, 0), lam(), cap, true);
    this.head = mk(new SphereGeometry(0.17, Math.round(14 * r), Math.round(10 * r)).translate(0, 1.3, 0), lam(), cap, true);
    this.hair = mk(new SphereGeometry(0.182, Math.round(14 * r), lo ? 4 : 6, 0, Math.PI * 2, 0, Math.PI * 0.55).translate(0, 1.33, -0.015), lam(), cap, true);
    this.legs = mk(new CylinderGeometry(0.075, 0.065, 0.5, lo ? 4 : 6).translate(0, -0.25, 0), lam(), cap * 2, true);
    this.arms = mk(new CylinderGeometry(0.06, 0.05, 0.44, lo ? 4 : 6).translate(0, -0.22, 0), lam(), cap * 2, true);
    if (lo) this.shadows = false;
    for (const im of [this.body, this.head, this.hair, this.legs, this.arms]) im.castShadow = this.shadows;
    this.blob = this.shadows ? null : mk(new CircleGeometry(0.38, lo ? 10 : 16).rotateX(-Math.PI / 2),
      new MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.28, depthWrite: false }), cap, false);
    this.mark = mk(new OctahedronGeometry(0.12, 0).scale(1, 1.6, 1), new MeshBasicMaterial({ color: 0xffffff }), 64, false);
    this.glow = mk(new IcosahedronGeometry(1, 1), new MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.32, blending: AdditiveBlending, depthWrite: false }), Math.max(1, this.gcap), false);
    for (const im of [this.body, this.head, this.hair, this.legs, this.arms, this.mark, this.glow]) im.setColorAt(0, new Color());
  }

  /** The item models arrive after the first frames (gfx/items.ts): their meshes are made once they are here. */
  private model(k: Model): InstancedMesh | null {
    const have = this.gear[k];
    if (have) return have;
    if (!itemsReady || this.lo) return null;
    const g = itemGeo(k);
    if (!g) return null;
    const im = new InstancedMesh(g, new MeshLambertMaterial({ vertexColors: true }), this.gcap);
    im.instanceMatrix.setUsage(DynamicDrawUsage); im.count = 0; im.frustumCulled = false; im.castShadow = this.shadows;
    im.setColorAt(0, new Color());
    this.scene.add(im);
    return (this.gear[k] = im);
  }

  begin(): void { this.liveOn = false; this.n = 0; this.nm = 0; this.nGlow = 0; for (const k of MODELS) this.gn[k] = 0; }

  /**
   * One person. x, z = ground position; facing = rotation around up (0 = towards +z); phase / amp = walk cycle
   * (amp 0 standing .. 1 running); lying = asleep or dead. `size` 1 = adult; children are drawn smaller (0.6).
   * `reach` = arms held out in front (a zombie). `gear` = packed gear + move (protocol gear.ts), `at` = seconds since the move began.
   * `lying` may be a share 0..1 (lying down / getting up, imad 2026-11-26), `lift` = metres up (on top of a bed).
   */
  /** My own character's left hand this frame when it holds a bow (`live`): World3D draws the bow that really draws there. */
  readonly liveHand = new Matrix4();
  liveOn = false;
  add(x: number, z: number, facing: number, phase: number, amp: number, look: PersonLook, lying: boolean | number, size = 1, reach = false, gear = 0, at = 0, seat = 0, lift = 0, live = false): void {
    if (this.n >= this.cap) return;
    const i = this.n++;
    const lie = typeof lying === 'number' ? lying : lying ? 1 : 0;
    if (lie > 0) amp = 0;
    const anim = lie > 0.3 ? 0 : (gear >> 15) & 7;
    // The move: arm angles (x = forward / up, z = out to the side), a twist and a lean of the whole body, a nod.
    let rx = 0, rz = 0.12, lx = 0, lz = 0.12, twist = 0, lean = 0, nod = 0, armsSet = false;
    if (anim === 1) { // attack: wind up overhead, strike down in front
      const p = (at % 0.55) / 0.55;
      rx = p < 0.45 ? -0.3 - 2.4 * ease(p / 0.45) : -2.7 + 2.2 * ease((p - 0.45) / 0.55);
      lx = -0.6; twist = p < 0.45 ? 0.3 * ease(p / 0.45) : 0.3 - 0.65 * ease((p - 0.45) / 0.55); lean = p < 0.45 ? 0 : 0.12; armsSet = true;
    } else if (anim === 2) { // chop: both hands on the axe, a sideways swing into the trunk
      const p = (at % 0.85) / 0.85;
      rx = lx = -1.25; rz = 0.35; lz = -0.25;
      twist = p < 0.55 ? 0.75 * ease(p / 0.55) : 0.75 - 1.15 * ease((p - 0.55) / 0.45); lean = 0.08; armsSet = true;
    } else if (anim === 3) { // mine: a heavy hammer from over the head down onto the rock
      const p = (at % 0.9) / 0.9;
      rx = lx = p < 0.5 ? -0.5 - 2.4 * ease(p / 0.5) : -2.9 + 2.25 * ease((p - 0.5) / 0.5);
      rz = 0.25; lz = -0.25; lean = p < 0.5 ? -0.05 : 0.22; armsSet = true;
    } else if (anim === 4) { // build: quick hammer taps, bent over the work
      const p = (at % 0.42) / 0.42;
      rx = -0.8 - 0.75 * Math.sin(p * Math.PI); lx = -1.0; lz = -0.15; lean = 0.25; armsSet = true;
    } else if (anim === 5) { // talk: hands moving, a nod now and then
      rx = -0.45 - 0.35 * (0.5 + 0.5 * Math.sin(at * 5.2)); rz = 0.35;
      lx = -0.2 - 0.25 * (0.5 + 0.5 * Math.sin(at * 3.7 + 1)); lz = 0.25; nod = 0.12 * Math.sin(at * 7.5); armsSet = true;
    } else if (anim === 6 && (gear >> 23) & 1) { // aiming: the bow arm out at the target, the string hand drawn back to the shoulder and held
      const p = Math.min(1, at / 0.35);
      lx = -1.55 + 0.03 * Math.sin(at * 2.1); lz = -0.05; rx = -1.5; rz = 0.45 + 0.8 * ease(p); twist = 0.3; armsSet = true; // rz > 0 = across the chest
    } else if (anim === 6) { // shoot: a quick draw, then the string goes and the hand springs forward
      const p = Math.min(1, at / 0.5);
      lx = -1.55; lz = -0.05; rx = -1.5; rz = p < 0.3 ? 0.45 + 0.8 * ease(p / 0.3) : 1.25 - 0.95 * ease(Math.min(1, (p - 0.3) / 0.12)); twist = 0.25; armsSet = true;
    } else if (anim === 7) { // use: reach down and pick up
      const p = Math.min(1, at / 0.6);
      rx = -0.9 * Math.sin(p * Math.PI); lean = 0.3 * Math.sin(p * Math.PI); armsSet = true;
    }
    // On a horse (`seat` = its back's height): sit there, legs astride, hands on the reins.
    const bob = seat > 0 ? seat - 0.52 * SCALE * size : Math.abs(Math.sin(phase)) * 0.05 * amp * size, k = SCALE * size;
    if (seat > 0) amp = 0;
    this.base.compose(this.v.set(x, bob + lift, z), this.q.setFromEuler(this.e.set(0, facing + twist, 0)), this.s.set(k, k, k));
    if (lie > 0) {
      this.part.compose(this.v.set(0, 0.2 * lie, -0.55 * lie), this.q.setFromEuler(this.e.set((Math.PI / 2) * lie, 0, 0)), this.s.set(1, 1, 1));
      this.base.multiply(this.part);
    }
    // The legs stay planted; the body leans from the hips.
    this.hm.copy(this.base);
    if (lean) { this.part.compose(this.v.set(0, 0.5, 0), this.q.setFromEuler(this.e.set(lean, 0, 0)), this.s.set(1, 1, 1)); this.m.makeTranslation(0, -0.5, 0); this.part.multiply(this.m); this.hm.multiply(this.part); }
    const body = (gear >> 10) & 3, bq = (gear >> 12) & 7;
    const tunic = body === 2 ? this.tmpC.copy(ARMOR).lerp(look.tunic, 0.25) : body === 1 ? this.tmpC.copy(LEATHER).lerp(look.tunic, 0.35) : look.tunic;
    this.body.setMatrixAt(i, this.hm); this.body.setColorAt(i, tunic);
    if (nod) { this.part.compose(this.v.set(0, 1.15, 0), this.q.setFromEuler(this.e.set(nod, 0, 0)), this.s.set(1, 1, 1)); this.m.makeTranslation(0, -1.15, 0); this.part.multiply(this.m); this.m.multiplyMatrices(this.hm, this.part); }
    else this.m.copy(this.hm);
    this.head.setMatrixAt(i, this.m); this.head.setColorAt(i, look.skin);
    this.hair.setMatrixAt(i, this.m); this.hair.setColorAt(i, look.hair);
    if ((gear >> 6) & 1) this.wear('helmet', this.m, 0, 1.36, 0.0, 1.02, (gear >> 7) & 7);
    if (body === 2) this.wear('pads', this.hm, 0, 1.1, 0, 1.0, bq);
    const sw = Math.sin(phase) * 0.7 * amp;
    for (let kk = 0; kk < 2; kk++) {
      const side = kk ? 1 : -1; // kk 0 = the right side (facing +z, right is -x)
      this.part.compose(this.v.set(side * (seat > 0 ? 0.2 : 0.1), 0.52, 0), this.q.setFromEuler(seat > 0 ? this.e.set(-0.5, 0, side * 0.55) : this.e.set(sw * side, 0, 0)), this.s.set(1, 1, 1));
      this.m.multiplyMatrices(this.base, this.part);
      this.legs.setMatrixAt(i * 2 + kk, this.m); this.legs.setColorAt(i * 2 + kk, look.pants);
      const e = reach ? this.e.set(-1.35 + sw * side * 0.15, 0, side * 0.05)
        : armsSet ? (kk ? this.e.set(lx, 0, -lz * side) : this.e.set(rx, 0, -rz * side))
        : seat > 0 ? this.e.set(-0.75, 0, side * 0.05) : this.e.set(-sw * side * 0.8, 0, side * 0.12);
      this.part.compose(this.v.set(side * 0.25, 1.07, 0), this.q.setFromEuler(e), this.s.set(1, 1, 1));
      this.m.multiplyMatrices(this.hm, this.part);
      this.arms.setMatrixAt(i * 2 + kk, this.m); this.arms.setColorAt(i * 2 + kk, tunic);
      (kk === 0 ? this.hand : this.lhand).copy(this.m);
    }
    // In the hands: the tool the move needs (axe to chop, a heavy hammer to mine, a hammer to build), else the weapon.
    if (lie < 0.3 && !reach) {
      const held = HELD[gear & 7] ?? '', hq = (gear >> 3) & 7;
      const tool: Model | '' = anim === 2 ? 'axe' : anim === 3 ? 'sledge' : anim === 4 ? 'hammer' : anim === 6 ? 'bow' : (held as Model | '');
      if (tool === 'bow' && live) { this.liveHand.copy(this.lhand); this.liveOn = true; } // my own: the bow that draws (gfx/bow.ts)
      else if (tool === 'bow') this.holdIn('bow', this.lhand, held === 'bow' ? hq : 0); // the bow in the other hand
      else if (tool) this.holdIn(tool, this.hand, tool === held ? hq : 0);
      if (((gear >> 22) & 1) && tool !== 'bow') { // a bow on the back
        const im = this.model('bow');
        if (im && this.gn.bow < this.gcap) {
          this.part.compose(this.v.set(0.02, 0.92, -0.24), this.q.setFromEuler(this.e.set(0, Math.PI / 2, 0.55)), this.s.set(0.85, 0.85, 0.85));
          this.m.multiplyMatrices(this.hm, this.part);
          const j = this.gn.bow++; im.setMatrixAt(j, this.m); im.setColorAt(j, Q_TINT[0]!);
        }
      }
    }
    if (this.blob) {
      this.m.makeTranslation(x, 0.03, z);
      this.blob.setMatrixAt(i, this.m);
    }
  }

  /** An item in a hand: the grip at the end of the arm, pointing forward from the fist. */
  private holdIn(k: Model, arm: Matrix4, q: number): void {
    const im = this.model(k);
    if (!im || this.gn[k] >= this.gcap) return;
    this.part.compose(this.v.set(0, -0.4, 0.02), this.q.setFromEuler(this.e.set(Math.PI / 2, 0, 0)), this.s.set(0.8, 0.8, 0.8));
    if (k === 'spear') this.part.multiply(this.m.makeTranslation(0, -0.55, 0)); // held near the middle
    this.m.multiplyMatrices(arm, this.part);
    const j = this.gn[k]++;
    im.setMatrixAt(j, this.m); im.setColorAt(j, Q_TINT[q] ?? Q_TINT[0]!);
    if (q >= 2 && this.nGlow < this.gcap) { // superior and up shine
      const len = LEN[k] ?? 0.6, pulse = 1 + 0.08 * Math.sin(performance.now() / 180);
      this.part.compose(this.v.set(0, k === 'bow' ? 0 : len * 0.62, 0), this.q.identity(), this.s.set(0.1 * pulse, len * 0.45 * pulse, 0.1 * pulse));
      this.m.multiply(this.part);
      const g = this.nGlow++; this.glow.setMatrixAt(g, this.m); this.glow.setColorAt(g, Q_GLOW[q]!);
    }
  }
  /** Something worn, placed on the body (y = height on the body, s = size). */
  private wear(k: Model, on: Matrix4, x: number, y: number, z: number, s: number, q: number): void {
    const im = this.model(k);
    if (!im || this.gn[k] >= this.gcap) return;
    this.part.compose(this.v.set(x, y, z), this.q.identity(), this.s.set(s, s, s));
    this.m.multiplyMatrices(on, this.part);
    const j = this.gn[k]++;
    im.setMatrixAt(j, this.m); im.setColorAt(j, Q_TINT[q] ?? Q_TINT[0]!);
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
    this.glow.count = this.nGlow; flag(this.glow);
    for (const k of MODELS) { const im = this.gear[k]; if (im) { im.count = this.gn[k]; flag(im); } }
  }
}

function flag(im: InstancedMesh): void {
  im.instanceMatrix.needsUpdate = true;
  if (im.instanceColor) im.instanceColor.needsUpdate = true;
}
