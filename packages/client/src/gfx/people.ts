import {
  InstancedMesh, MeshLambertMaterial, MeshBasicMaterial, CircleGeometry, OctahedronGeometry, IcosahedronGeometry, InstancedBufferAttribute,
  Matrix4, Quaternion, Euler, Vector3, Color, DynamicDrawUsage, AdditiveBlending, type Scene, type BufferGeometry, type Material,
} from 'three';
import { itemGeo, itemsReady } from './items.js';
import {
  torsoGeo, headGeo, hairGeo, CAPPED, upperArmGeo, foreArmGeo, thighGeo, shinGeo, personMat,
  HIP_Y, THIGH, SHIN, SOLE, SHOULDER_Y, SHOULDER_X, UPPER, FORE, NECK_Y,
} from './bodyparts.js';

/**
 * Every person on screen (agents and players) as a few instanced meshes (imad 2026-11-27: "better body shapes, customisation,
 * hair, running and walking, riding, attacking, mining, cutting, picking"): a shaped torso (a man's or a woman's, wider or slimmer
 * by build), head with eyes / nose / ears, one hair + beard mesh for every style, upper arms, forearms with hands, thighs, shins with
 * shoes. Each person is a small skeleton worked out on the CPU every frame (hips -> legs and torso -> head and arms, knees and
 * elbows bend) and posed by what they do: standing (breathing, weight shifts, looking round), walking and running (knees, arm
 * swing, lean, hips solved so a foot stays on the ground), sitting a horse at a walk / trot / gallop (the stride of THAT horse),
 * fighting by weapon, chopping, mining, building on one knee, picking up, talking, the bow. ~9 draw calls for any number of
 * people (no skinned meshes, nothing allocated per frame), real shadows on mid / high, a round blob on low.
 *
 * Gear (imad 2026-11-25): the weapon in hand, a bow on the back, a helmet, shoulder pads over armour, leather clothes,
 * from CC0 models (gfx/items.ts), tinted and glowing by quality.
 */
const SCALE = 1.25; // a bit bigger than life, so people read well from the tilted camera

/** How someone looks (colours resolved; the rest from protocol look.ts). Missing = a man of average build, short hair. */
export interface PersonLook { tunic: Color; skin: Color; hair: Color; pants: Color; woman?: boolean; hairStyle?: number; beard?: number; build?: number; elder?: boolean }

/** Quality tints (normal, fine, rare, epic, legendary) and glows. */
const Q_TINT = [new Color(1, 1, 1), new Color(0.95, 1.08, 0.95), new Color(0.88, 0.97, 1.18), new Color(1.06, 0.86, 1.22), new Color(1.35, 1.08, 0.55)];
const Q_GLOW = [new Color(0), new Color(0), new Color(0x2a6bff), new Color(0x9b3cff), new Color(0xffa31a)];
const ARMOR = new Color(0x7f8793), LEATHER = new Color(0x8b5a35);
/** Held models and their length (for the glow along them). */
const HELD = ['', 'sword', 'axe', 'spear', 'bow'] as const;
const MODELS = ['sword', 'axe', 'spear', 'bow', 'hammer', 'sledge', 'helmet', 'pads'] as const;
type Model = (typeof MODELS)[number];
const LEN: Record<string, number> = { sword: 1.0, axe: 0.75, spear: 1.75, bow: 0.55, hammer: 0.55, sledge: 0.85 };
const ease = (x: number) => { const c = x < 0 ? 0 : x > 1 ? 1 : x; return c * c * (3 - 2 * c); };
const clamp01 = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x);
/** Build (protocol look.ts BUILDS slim, average, broad, heavy): torso width / depth, shoulders, limb thickness. */
const BUILD_W = [0.9, 1, 1.1, 1.17], BUILD_D = [0.92, 1, 1.05, 1.28], BUILD_S = [0.93, 1, 1.1, 1.08], BUILD_L = [0.88, 1, 1.12, 1.16];
/** Where the fist grips in the forearm's frame, as the old one-piece arm had it (held models are placed 0.4 down from that). */
const GRIP = 0.4 - (FORE + 0.025);

/** A pose, filled for each person (no allocation): leg / arm 0 = the right side (-x), 1 = the left. */
class Pose {
  hipFixed = false; pelX = 0; pelY = 0; pelYaw = 0; pelRoll = 0;
  lean = 0; twist = 0; roll = 0; nod = 0; hYaw = 0; hRoll = 0;
  tp = [0, 0]; tr = [0, 0]; kn = [0, 0];
  ap = [0, 0]; ar = [0, 0]; ay = [0, 0]; el = [0, 0];
  /** How the held thing turns in the fist: PI / 2 = straight out of the fist (carried), PI = on along the forearm (a slash, a thrust). */
  wr = [Math.PI / 2, Math.PI / 2];
  reset(): void {
    this.hipFixed = false; this.pelX = this.pelY = this.pelYaw = this.pelRoll = 0;
    this.lean = this.twist = this.roll = this.nod = this.hYaw = this.hRoll = 0;
    for (let k = 0; k < 2; k++) { this.tp[k] = 0; this.tr[k] = 0.035; this.kn[k] = 0.04; this.ap[k] = 0.04; this.ar[k] = 0.1; this.ay[k] = 0; this.el[k] = 0.16; this.wr[k] = Math.PI / 2; }
  }
  arm(k: number, ap: number, ar: number, el: number, ay = 0): void { this.ap[k] = ap; this.ar[k] = ar; this.el[k] = el; this.ay[k] = ay; }
  leg(k: number, tp: number, kn: number, tr = 0.035): void { this.tp[k] = tp; this.kn[k] = kn; this.tr[k] = tr; }
}

export class People {
  private torsoM: InstancedMesh; private torsoF: InstancedMesh; private head: InstancedMesh; private hair: InstancedMesh;
  private upper: InstancedMesh; private fore: InstancedMesh; private thigh: InstancedMesh; private shin: InstancedMesh;
  private blob: InstancedMesh | null; private mark: InstancedMesh; private glow: InstancedMesh;
  private c2: { fore: InstancedBufferAttribute; shin: InstancedBufferAttribute }; private ilook: InstancedBufferAttribute;
  private gear: Partial<Record<Model, InstancedMesh>> = {};
  private gn: Record<Model, number> = { sword: 0, axe: 0, spear: 0, bow: 0, hammer: 0, sledge: 0, helmet: 0, pads: 0 };
  private nGlow = 0;
  private n = 0; private nm = 0; private nM = 0; private nF = 0;
  private base = new Matrix4(); private m = new Matrix4(); private part = new Matrix4(); private hand = new Matrix4(); private lhand = new Matrix4(); private hm = new Matrix4();
  private pel = new Matrix4(); private seg = new Matrix4(); private headM = new Matrix4();
  private q = new Quaternion(); private e = new Euler(); private v = new Vector3(); private s = new Vector3(); private one = new Vector3(1, 1, 1);
  private cap: number; private gcap: number;
  private tmpC = new Color();
  private pose = new Pose();
  private now = 0;

  /**
   * lo = the far set (imad 2026-11-26, 60 fps: "the further away, the less detail"): fewer sides on every part, no eyes, no shadow
   * cast (a soft round one on the ground instead), no held or worn models.
   */
  constructor(private scene: Scene, cap: number, private shadows: boolean, private lo = false) {
    this.cap = cap; this.gcap = lo ? 0 : Math.min(cap, 160);
    if (lo) this.shadows = false;
    const mk = (g: BufferGeometry, mat: Material, count: number, cast: boolean) => {
      const im = new InstancedMesh(g, mat, count);
      im.instanceMatrix.setUsage(DynamicDrawUsage);
      im.count = 0; im.frustumCulled = false; im.castShadow = cast && this.shadows;
      im.setColorAt(0, new Color());
      scene.add(im);
      return im;
    };
    const tone = personMat('tone');
    // Every 'tone' mesh carries a second colour per instance (only the forearm's hands and the shoes' trousers use it).
    const c2 = (g: BufferGeometry, n: number) => { const a = new InstancedBufferAttribute(new Float32Array(n * 3), 3); a.setUsage(DynamicDrawUsage); g.setAttribute('color2', a); return a; };
    const tm = torsoGeo(false, lo), tf = torsoGeo(true, lo), hd = headGeo(lo), ua = upperArmGeo(lo), fa = foreArmGeo(lo), th = thighGeo(lo), sh = shinGeo(lo), hr = hairGeo(lo);
    for (const g of [tm, tf, hd, ua, th]) c2(g, g === ua || g === th ? cap * 2 : cap);
    this.c2 = { fore: c2(fa, cap * 2), shin: c2(sh, cap * 2) };
    this.ilook = new InstancedBufferAttribute(new Float32Array(cap * 3), 3); this.ilook.setUsage(DynamicDrawUsage); hr.setAttribute('ilook', this.ilook);
    this.torsoM = mk(tm, tone, cap, true); this.torsoF = mk(tf, tone, cap, true);
    this.head = mk(hd, tone, cap, true);
    this.hair = mk(hr, personMat('hair'), cap, false); // hair casts no shadow (the head's is enough; the folded styles would cast too)
    this.upper = mk(ua, tone, cap * 2, true); this.fore = mk(fa, tone, cap * 2, true);
    this.thigh = mk(th, tone, cap * 2, true); this.shin = mk(sh, tone, cap * 2, true);
    this.blob = this.shadows ? null : mk(new CircleGeometry(0.38, lo ? 10 : 16).rotateX(-Math.PI / 2),
      new MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.28, depthWrite: false }), cap, false);
    this.mark = mk(new OctahedronGeometry(0.12, 0).scale(1, 1.6, 1), new MeshBasicMaterial({ color: 0xffffff }), 64, false);
    this.glow = mk(new IcosahedronGeometry(1, 1), new MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.32, blending: AdditiveBlending, depthWrite: false }), Math.max(1, this.gcap), false);
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

  begin(): void { this.liveOn = false; this.n = 0; this.nm = 0; this.nM = 0; this.nF = 0; this.nGlow = 0; for (const k of MODELS) this.gn[k] = 0; this.now = performance.now() / 1000; }

  /** My own character's left hand this frame when it holds a bow (`live`): World3D draws the bow that really draws there. */
  readonly liveHand = new Matrix4();
  liveOn = false;

  /**
   * One person. x, z = ground position; facing = rotation around up (0 = towards +z); phase / amp = walk cycle
   * (amp 0 standing .. 1 running); lying = asleep or dead (a share 0..1 while lying down / getting up). `size` 1 = adult
   * (children 0.62, little ones 0.42). `reach` = a zombie. `gear` = packed gear + move (protocol gear.ts), `at` = seconds since
   * the move began. `seat` = the height of the horse's back (0 = on foot), `lift` = metres up (on top of a bed), `live` = my own
   * character (the bow that draws, gfx/bow.ts). `seed` = the entity id (idle moves differ between people). `rideG` = how much
   * the horse gallops (0..1), `ridePh` = where in its stride (radians), `rideW` = how much it walks / trots, `rideWp` = that stride.
   */
  add(x: number, z: number, facing: number, phase: number, amp: number, look: PersonLook, lying: boolean | number, size = 1, reach = false, gear = 0, at = 0,
    seat = 0, lift = 0, live = false, seed = 0, rideG = 0, ridePh = 0, rideW = 0, rideWp = 0): void {
    if (this.n >= this.cap) return;
    const i = this.n++;
    const lie = typeof lying === 'number' ? lying : lying ? 1 : 0;
    if (lie > 0 || seat > 0) amp = 0;
    const anim = lie > 0.3 ? 0 : (gear >> 15) & 7, held = gear & 7, seq = (gear >> 18) & 15;
    const P = this.pose; P.reset();
    const woman = !!look.woman, build = look.build ?? 1, elder = !!look.elder;
    const t = this.now + (seed % 97) * 0.731;
    const run = clamp01((amp - 0.72) / 0.28); // walking pace ~1.5 m/s, running from ~2 m/s (amp = speed / 2.2)

    // ---------------------------------------------------------------- legs, hips and how the body carries itself
    if (lie > 0) { P.hipFixed = true; P.arm(0, 0.02, 0.12, 0.1); P.arm(1, 0.02, 0.12, 0.1); P.leg(0, 0, 0.05); P.leg(1, 0, 0.05); }
    else if (seat > 0) this.riding(P, rideG, ridePh, rideW, rideWp, t);
    else if (amp > 0.04) this.moving(P, phase, amp * (elder ? 0.85 : 1), run, reach);
    else this.idle(P, t, seed);
    if (elder && lie === 0) { P.lean += 0.1; P.nod -= 0.06; }
    if (reach && lie === 0) { // a zombie: hunched, head lolling, arms out in front swaying
      P.lean += 0.22; P.hRoll = 0.28; P.nod += 0.1;
      const sw = Math.sin(phase) * 0.15;
      P.arm(0, -1.35 + sw, 0.05, 0.12); P.arm(1, -1.4 - sw, 0.05, 0.12);
    }
    // ---------------------------------------------------------------- the move (arms; legs too when standing still)
    const still = seat === 0 && lie === 0 && amp < 0.3;
    if (anim && !reach) this.move(P, anim, held, seq, at, still, seat > 0, ((gear >> 23) & 1) === 1);

    // ---------------------------------------------------------------- the skeleton
    const k = SCALE * size * (woman ? 0.96 : 1);
    const bw = BUILD_W[build]!, bd = BUILD_D[build]!, bs = BUILD_S[build]! * (woman ? 0.9 : 1), bl = BUILD_L[build]! * (woman ? 0.92 : 1);
    let hipY = HIP_Y;
    if (!P.hipFixed) { // the lowest knee or foot touches the ground
      let low = 0;
      for (let kk = 0; kk < 2; kk++) {
        const c = Math.cos(P.tr[kk]!), knee = THIGH * Math.cos(P.tp[kk]!) * c, foot = knee + SHIN * Math.cos(P.tp[kk]! + P.kn[kk]!) * c;
        low = Math.max(low, knee, foot);
      }
      hipY = low + SOLE + P.pelY;
    } else hipY += P.pelY;
    const baseY = seat > 0 ? seat - HIP_Y * k : 0;
    this.base.compose(this.v.set(x, baseY + lift, z), this.q.setFromEuler(this.e.set(0, facing, 0)), this.s.set(k, k, k));
    if (lie > 0) {
      this.part.compose(this.v.set(0, 0.2 * lie, -0.55 * lie), this.q.setFromEuler(this.e.set((Math.PI / 2) * lie, 0, 0)), this.one);
      this.base.multiply(this.part);
    }
    this.local(this.base, this.pel, P.pelX, hipY, 0, 0, P.pelYaw, P.pelRoll);
    const body = (gear >> 10) & 3, bq = (gear >> 12) & 7;
    const tunic = body === 2 ? this.tmpC.copy(ARMOR).lerp(look.tunic, 0.25) : body === 1 ? this.tmpC.copy(LEATHER).lerp(look.tunic, 0.35) : look.tunic;
    // legs
    for (let kk = 0; kk < 2; kk++) {
      const side = kk ? 1 : -1, j = i * 2 + kk;
      this.local(this.pel, this.seg, side * 0.092 * bw, 0, 0, P.tp[kk]!, 0, side * P.tr[kk]!);
      this.put(this.thigh, j, this.seg, bl, look.pants);
      this.local(this.seg, this.m, 0, -THIGH, 0, P.kn[kk]!, 0, 0);
      this.seg.copy(this.m);
      this.put(this.shin, j, this.seg, bl, look.pants);
      this.c2.shin.setXYZ(j, 0, 0, 0);
    }
    // torso, head, hair
    this.local(this.pel, this.hm, 0, 0, 0, P.lean, P.twist, P.roll);
    const torso = woman ? this.torsoF : this.torsoM, ti = woman ? this.nF++ : this.nM++;
    this.m.multiplyMatrices(this.hm, this.part.makeScale(bw, 1, bd));
    torso.setMatrixAt(ti, this.m); torso.setColorAt(ti, tunic);
    const hs = size < 1 ? 1.12 : 1;
    this.local(this.hm, this.headM, 0, NECK_Y, 0, P.nod, P.hYaw, P.hRoll);
    if (hs !== 1) this.headM.multiply(this.part.makeScale(hs, hs, hs));
    this.head.setMatrixAt(i, this.headM); this.head.setColorAt(i, look.skin);
    this.hair.setMatrixAt(i, this.headM); this.hair.setColorAt(i, look.hair);
    const hst = look.hairStyle ?? 0;
    this.ilook.setXYZ(i, hst, 8 + (woman || size < 1 ? 0 : look.beard ?? 0), CAPPED[hst] ? 1 : 0);
    if ((gear >> 6) & 1) this.wear('helmet', this.headM, 0, 0.26, 0.0, 1.02, (gear >> 7) & 7);
    if (body === 2) this.wear('pads', this.hm, 0, 0.58, 0, bs, bq);
    // arms
    for (let kk = 0; kk < 2; kk++) {
      const side = kk ? 1 : -1, j = i * 2 + kk;
      this.local(this.hm, this.seg, side * SHOULDER_X * bs, SHOULDER_Y, 0, P.ap[kk]!, P.ay[kk]! * side, side * P.ar[kk]!);
      this.put(this.upper, j, this.seg, bl, tunic);
      this.local(this.seg, this.m, 0, -UPPER, 0, -P.el[kk]!, 0, 0);
      this.seg.copy(this.m);
      this.put(this.fore, j, this.seg, bl, tunic);
      this.c2.fore.setXYZ(j, look.skin.r, look.skin.g, look.skin.b);
      (kk === 0 ? this.hand : this.lhand).multiplyMatrices(this.seg, this.part.makeTranslation(0, -GRIP, 0));
    }
    // In the hands: the tool the move needs (axe to chop, a heavy hammer to mine, a hammer to build), else the weapon.
    if (lie < 0.3 && !reach) {
      const hq = (gear >> 3) & 7, heldK = HELD[held] ?? '';
      const tool: Model | '' = anim === 2 ? 'axe' : anim === 3 ? 'sledge' : anim === 4 ? 'hammer' : anim === 6 ? 'bow' : anim === 7 ? '' : (heldK as Model | '');
      if (tool === 'bow' && live) { this.liveHand.copy(this.lhand); this.liveOn = true; } // my own: the bow that draws (gfx/bow.ts)
      else if (tool === 'bow') this.holdIn('bow', this.lhand, heldK === 'bow' ? hq : 0); // the bow in the other hand
      else if (tool) this.holdIn(tool, this.hand, tool === heldK ? hq : 0, P.wr[0]!);
      if (((gear >> 22) & 1) && tool !== 'bow') { // a bow on the back
        const im = this.model('bow');
        if (im && this.gn.bow < this.gcap) {
          this.part.compose(this.v.set(0.02, 0.4, -0.19 * bd), this.q.setFromEuler(this.e.set(0, Math.PI / 2, 0.55)), this.s.set(0.85, 0.85, 0.85));
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

  /** out = parent x translate (px, py, pz) x rotation (rx, ry, rz). */
  private local(parent: Matrix4, out: Matrix4, px: number, py: number, pz: number, rx: number, ry: number, rz: number): void {
    this.part.compose(this.v.set(px, py, pz), this.q.setFromEuler(this.e.set(rx, ry, rz)), this.one);
    out.multiplyMatrices(parent, this.part);
  }
  /** A limb piece, thicker or thinner by build (x / z only). */
  private put(im: InstancedMesh, j: number, at: Matrix4, thick: number, c: Color): void {
    if (thick !== 1) { this.m.multiplyMatrices(at, this.part.makeScale(thick, 1, thick)); im.setMatrixAt(j, this.m); }
    else im.setMatrixAt(j, at);
    im.setColorAt(j, c);
  }

  /** Standing: breathing, the weight from foot to foot now and then, looking round, arms loose. */
  private idle(P: Pose, t: number, seed: number): void {
    const br = Math.sin(t * 1.7);
    P.lean = 0.012 * br; P.nod = -0.01 * br;
    const shift = Math.sin(t * 0.37 + seed);
    P.pelRoll = 0.035 * shift; P.pelX = 0.018 * shift;
    P.kn[shift > 0 ? 0 : 1] = 0.04 + 0.14 * Math.abs(shift); // the free knee bends a little
    const look = Math.sin(t * 0.23 + seed * 1.7);
    P.hYaw = 0.45 * look * look * look;
    for (let k = 0; k < 2; k++) { P.ar[k] = 0.1 + 0.012 * br; P.el[k] = 0.18 + 0.04 * Math.sin(t * 0.9 + k); P.ap[k] = 0.03 + 0.02 * Math.sin(t * 0.5 + k * 2); }
  }

  /** Walking and running: thighs swing, knees fold on the way forward (more when running), arms swing opposite, a lean when fast. */
  private moving(P: Pose, phase: number, a: number, run: number, zed: boolean): void {
    const A = a * (0.55 + 0.25 * run), B = a * (0.42 + 0.42 * run);
    for (let k = 0; k < 2; k++) {
      const ps = phase + (k ? Math.PI : 0), s = Math.sin(ps);
      P.tp[k] = -A * s;
      P.kn[k] = a * (0.08 + (0.55 + 1.05 * run) * Math.max(0, Math.cos(ps - 0.25 - 0.35 * run))) + run * 0.35 * Math.max(0, -s);
      if (zed && k === 0) P.kn[k] = P.kn[k]! * 0.3; // a stiff leg dragged along
      P.ap[k] = B * s;
      P.el[k] = 0.2 + 0.2 * a + 1.15 * run + Math.max(0, -P.ap[k]!) * 0.45;
      P.ar[k] = 0.08 + 0.05 * run;
    }
    const s = Math.sin(phase);
    P.lean = 0.04 * a + 0.2 * run;
    P.pelYaw = -0.09 * a * s; P.twist = 0.15 * a * s;
    P.pelRoll = 0.03 * a * (1 - run) * Math.sin(phase * 2);
    P.pelY = run * 0.03 * Math.abs(Math.cos(phase));
    P.nod = -P.lean * 0.6;
  }

  /**
   * On horseback: astride, knees bent in the stirrups, hands on the reins. Walking / trotting = rising with the trot; galloping =
   * up off the saddle, leaning forward, the hips taking the horse's bounds and the hands going with its head.
   */
  private riding(P: Pose, g: number, gp: number, w: number, wp: number, t: number): void {
    P.hipFixed = true;
    const trot = w * (1 - g);
    for (let k = 0; k < 2; k++) P.leg(k, -1.05 - 0.1 * g, 1.4 + 0.15 * g, 0.42);
    P.pelY = 0.035 * g + 0.025 * g * Math.sin(gp) + 0.035 * trot * Math.max(0, Math.sin(wp * 2));
    P.lean = 0.06 + 0.3 * g + 0.07 * g * Math.sin(gp + 0.7) + 0.03 * trot * Math.sin(wp * 2);
    P.nod = -P.lean * 0.75; P.hYaw = (1 - g) * 0.2 * Math.sin(t * 0.3);
    const reins = 0.08 * g * Math.sin(gp + 1.2) + 0.03 * trot * Math.sin(wp * 2);
    for (let k = 0; k < 2; k++) P.arm(k, -0.7 - 0.28 * g + reins, -0.05, 0.95 + 0.35 * g, 0.12);
  }

  /** The move (protocol gear.ts ANIMS): arms always, legs and the body when standing still. */
  private move(P: Pose, anim: number, held: number, seq: number, at: number, still: boolean, seated: boolean, aim: boolean): void {
    if (anim === 1) { // attack, by weapon
      if (held === 3) { // spear: draw back, thrust with both hands, a lunge
        const p = (at % 0.6) / 0.6, th = p < 0.35 ? -ease(p / 0.35) * 0.4 : p < 0.55 ? -0.4 + 1.4 * ease((p - 0.35) / 0.2) : 1 - ease((p - 0.55) / 0.45);
        P.arm(0, -0.6 - 0.75 * th, 0.12, 1.3 - 1.15 * th); P.arm(1, -1.15 - 0.3 * th, -0.25, 0.7 - 0.5 * th);
        P.wr[0] = Math.PI - 0.15; // the spear along the arms, pointing at the target
        P.twist = 0.35 - 0.25 * th; P.lean += 0.12 + 0.18 * th;
        if (still) { P.leg(1, -0.45 - 0.3 * th, 0.35 + 0.35 * th); P.leg(0, 0.3, 0.2); }
      } else if (held === 1 || held === 2) { // sword (slashes, forehand then backhand) or an axe (overhead chops)
        const p = (at % 0.55) / 0.55, wind = ease(p / 0.4), hit = ease((p - 0.4) / 0.3), back = ease((p - 0.75) / 0.25);
        P.wr[0] = Math.PI - 0.45; // the blade goes on from the forearm (over the shoulder when wound up, down in front at the hit)
        if (held === 2) {
          const r = p < 0.4 ? wind : 1 - hit;
          P.arm(0, -0.5 - 2.3 * r + 0.3 * back, 0.15, 0.55 * r + 0.1); P.arm(1, -0.6, 0.25, 0.9);
          P.lean += -0.08 * r + 0.25 * (p < 0.4 ? 0 : hit) * (1 - back);
        } else {
          const dir = seq & 1 ? -1 : 1, r = p < 0.4 ? wind : 1 - hit;
          P.arm(0, -0.5 - 2.0 * r, dir * (0.75 * r - 0.5 * (1 - r)) , 0.15 + 0.5 * r, 0.3 * dir * (1 - r)); P.arm(1, -0.55, 0.35, 1.0);
          P.twist = dir * (0.5 * r - 0.5 * (1 - r)) * (1 - back); P.lean += 0.18 * (1 - r) * (1 - back);
        }
        if (still) { P.leg(1, -0.4, 0.3); P.leg(0, 0.28, 0.15); }
      } else { // bare hands (or a bow as a club): fists up, a jab with one hand then the other
        const p = (at % 0.42) / 0.42, kk = seq & 1 ? 1 : 0, jab = p < 0.35 ? ease(p / 0.35) : 1 - ease((p - 0.35) / 0.65);
        P.arm(0, -0.95, -0.15, 1.95); P.arm(1, -0.95, -0.15, 1.95);
        P.arm(kk, -0.95 - 0.65 * jab, -0.15 - 0.15 * jab, 1.95 - 1.8 * jab);
        P.twist = (kk ? -1 : 1) * 0.4 * jab; P.lean += 0.08 + 0.08 * jab;
        if (still) { P.leg(1, -0.35, 0.3); P.leg(0, 0.25, 0.2); }
      }
    } else if (anim === 2) { // chop a tree: feet apart, both hands on the axe, wound back over the right shoulder, a swing into the trunk
      const p = (at % 0.85) / 0.85, r = p < 0.55 ? ease(p / 0.55) : 1 - ease((p - 0.55) / 0.15), fol = p < 0.55 ? 0 : ease((p - 0.55) / 0.2) * (1 - ease((p - 0.8) / 0.2));
      P.twist = -0.85 * r + 0.35 * fol; P.wr[0] = 2.5; // the axe head out at the trunk
      P.arm(0, -1.15 - 0.45 * r, 0.25 + 0.35 * r, 0.35 + 0.35 * r); P.arm(1, -1.25 - 0.35 * r, -0.45 + 0.1 * r, 0.55 + 0.3 * r, -0.2);
      P.lean += 0.1 + 0.08 * fol;
      if (still) { P.leg(0, 0.08, 0.28, 0.2); P.leg(1, -0.2, 0.3, 0.2); }
    } else if (anim === 3) { // mine: the heavy hammer up over the head, then down onto the rock bending the knees
      const p = (at % 0.95) / 0.95, up = p < 0.45 ? ease(p / 0.45) : p < 0.6 ? 1 - ease((p - 0.45) / 0.15) : 0, rec = p < 0.6 ? 0 : ease((p - 0.6) / 0.4);
      const ang = -0.55 - 2.35 * up;
      P.arm(0, ang, 0.12, 0.45 * up + 0.1); P.arm(1, ang, -0.12, 0.45 * up + 0.15);
      const down = p >= 0.45 && p < 0.7 ? 1 - rec : 0;
      P.lean += -0.12 * up + 0.48 * (p >= 0.45 ? 1 - rec : 0);
      if (still) { const kb = 0.12 + 0.45 * down; P.leg(0, -0.25 * down + 0.1, kb, 0.16); P.leg(1, -0.35 * down - 0.15, kb, 0.16); }
    } else if (anim === 4) { // build: down on one knee, bent over the work, quick hammer taps
      const p = (at % 0.42) / 0.42, tap = Math.sin(p * Math.PI);
      P.arm(0, -1.0 - 0.7 * tap, 0.1, 0.7 - 0.3 * tap); P.arm(1, -1.05, -0.2, 0.9);
      if (still) { P.leg(0, 0.25, 1.95, 0.08); P.leg(1, -1.45, 1.45, 0.06); P.lean += 0.42; }
      else P.lean += 0.25;
    } else if (anim === 5) { // talk: the hands move as they speak, a nod now and then, weight on one foot
      const a1 = 0.5 + 0.5 * Math.sin(at * 5.2), a2 = 0.5 + 0.5 * Math.sin(at * 3.7 + 1);
      P.arm(0, -0.3 - 0.35 * a1, 0.25, 1.05 + 0.4 * a1, -0.15); P.arm(1, -0.15 - 0.2 * a2, 0.2, 0.7 + 0.5 * a2, -0.1);
      P.nod += 0.1 * Math.sin(at * 7.5); P.hRoll = 0.05 * Math.sin(at * 1.3);
    } else if (anim === 6) { // the bow: side-on, bow arm out straight at the target, the string hand drawn back to the chin
      const p = Math.min(1, at / (aim ? 0.35 : 0.5)); // aim held = drawn and held; else a quick draw and the string goes
      const draw = aim ? ease(p) : p < 0.3 ? ease(p / 0.3) : 1 - ease(Math.min(1, (p - 0.3) / 0.12));
      P.arm(1, -1.55, 0.05, 0.03); P.arm(0, -1.5, -0.45 - 0.55 * draw, 0.25 + 1.85 * draw);
      P.twist = 0.35; P.hYaw = -0.3;
      if (still) { P.leg(1, -0.2, 0.08, 0.12); P.leg(0, 0.15, 0.1, 0.12); }
    } else if (anim === 7) { // pick up / pick herbs / search rubble: squat, a hand to the ground, back up (repeats while gathering)
      const p = (at % 1.0) / 1.0, d = p < 0.35 ? ease(p / 0.35) : p < 0.62 ? 1 : 1 - ease((p - 0.62) / 0.38);
      if (seated) { P.arm(0, -0.5 * d, 0.4 * d + 0.1, 0.2); return; }
      if (still) { P.leg(0, -1.3 * d, 2.3 * d + 0.04, 0.1 + 0.12 * d); P.leg(1, -1.15 * d, 2.1 * d + 0.04, 0.1 + 0.12 * d); }
      P.lean += 0.7 * d; P.nod = -0.25 * d;
      P.arm(0, -0.9 * d + 0.04, 0.12, 0.2 + 0.3 * (1 - d) * d); P.arm(1, -0.55 * d + 0.04, 0.18, 0.35);
    }
  }

  /** An item in a hand: the grip at the end of the arm, pointing forward from the fist. */
  private holdIn(k: Model, arm: Matrix4, q: number, wrist = Math.PI / 2): void {
    const im = this.model(k);
    if (!im || this.gn[k] >= this.gcap) return;
    this.part.compose(this.v.set(0, -0.4, 0.02), this.q.setFromEuler(this.e.set(wrist, 0, 0)), this.s.set(0.8, 0.8, 0.8));
    if (k === 'spear') this.part.multiply(this.m.makeTranslation(0, -0.55, 0)); // held near the middle
    this.m.multiplyMatrices(arm, this.part);
    const j = this.gn[k]++;
    im.setMatrixAt(j, this.m); im.setColorAt(j, Q_TINT[q] ?? Q_TINT[0]!);
    if (q >= 2 && this.nGlow < this.gcap) { // rare and up shine
      const len = LEN[k] ?? 0.6, pulse = 1 + 0.08 * Math.sin(performance.now() / 180);
      this.part.compose(this.v.set(0, k === 'bow' ? 0 : len * 0.62, 0), this.q.identity(), this.s.set(0.1 * pulse, len * 0.45 * pulse, 0.1 * pulse));
      this.m.multiply(this.part);
      const g = this.nGlow++; this.glow.setMatrixAt(g, this.m); this.glow.setColorAt(g, Q_GLOW[q]!);
    }
  }
  /** Something worn, placed on the body (y = height on that part, s = size). */
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
    this.m.compose(this.v.set(x, 2.15 + Math.sin(t * 3) * 0.08, z), this.q.setFromEuler(this.e.set(0, t * 2, 0)), this.one);
    this.mark.setMatrixAt(i, this.m); this.mark.setColorAt(i, color);
  }

  end(): void {
    const n = this.n;
    show(this.torsoM, this.nM); show(this.torsoF, this.nF);
    show(this.head, n); show(this.hair, n); this.ilook.needsUpdate = true;
    for (const im of [this.upper, this.fore, this.thigh, this.shin]) show(im, n * 2);
    this.c2.fore.needsUpdate = true;
    if (this.blob) { this.blob.count = n; this.blob.visible = n > 0; this.blob.instanceMatrix.needsUpdate = true; }
    show(this.mark, this.nm);
    show(this.glow, this.nGlow);
    for (const k of MODELS) { const im = this.gear[k]; if (im) show(im, this.gn[k]); }
  }
}

/** A mesh with nothing to draw is hidden (no draw call at all). */
function show(im: InstancedMesh, n: number): void {
  im.count = n; im.visible = n > 0;
  if (!n) return;
  im.instanceMatrix.needsUpdate = true;
  if (im.instanceColor) im.instanceColor.needsUpdate = true;
}
