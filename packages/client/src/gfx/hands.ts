import {
  BoxGeometry, Color, CylinderGeometry, Group, Mesh, MeshLambertMaterial, SphereGeometry, Vector3, Quaternion, Euler, type Camera,
} from 'three';
import { itemGeo, itemsReady } from './items.js';
import type { PersonLook } from './people.js';
import { LiveBow, BowShot } from './bow.js';

/**
 * First person (imad 2026-11-26: "it should show the hands of the player, and when mounting the hands and the horse's head"):
 * my own forearms and fists at the bottom of the screen, with the weapon or tool in them, swaying as I walk and playing the
 * same moves as my character (attack, chop, mine, build, talk, aim / shoot, use). On horseback both hands hold the reins
 * over the horse's neck and rise and fall with its stride. They hang on the camera (camera space: x right, y up, -z ahead),
 * never cast shadows, and cost 6-8 draw calls only while the first-person view is on.
 */
const HELD = ['', 'sword', 'axe', 'spear', 'bow'] as const;
type Tool = 'sword' | 'axe' | 'spear' | 'bow' | 'hammer' | 'sledge';
const TOOLS: Tool[] = ['sword', 'axe', 'spear', 'bow', 'hammer', 'sledge'];
const Q_TINT = [new Color(1, 1, 1), new Color(0.95, 1.08, 0.95), new Color(0.88, 0.97, 1.18), new Color(1.06, 0.86, 1.22), new Color(1.35, 1.08, 0.55)];
const ARMOR = new Color(0x7f8793), LEATHER = new Color(0x8b5a35);
const ease = (x: number) => { const c = Math.max(0, Math.min(1, x)); return c * c * (3 - 2 * c); };

/** One hand's pose: where the fist is and how the forearm turns (x = pitch: forearm down-back, y = out to the side, z = roll). */
interface Pose { x: number; y: number; z: number; rx: number; ry: number; rz: number }
const P = (x: number, y: number, z: number, rx: number, ry: number, rz = 0): Pose => ({ x, y, z, rx, ry, rz });
const mix = (a: Pose, b: Pose, k: number): Pose => ({
  x: a.x + (b.x - a.x) * k, y: a.y + (b.y - a.y) * k, z: a.z + (b.z - a.z) * k,
  rx: a.rx + (b.rx - a.rx) * k, ry: a.ry + (b.ry - a.ry) * k, rz: a.rz + (b.rz - a.rz) * k,
});
const REST_R = P(0.24, -0.27, -0.52, 0.62, 0.38), REST_L = P(-0.26, -0.3, -0.54, 0.62, -0.38);
const REIN_R = P(0.11, -0.23, -0.52, 0.95, 0.45, -0.25), REIN_L = P(-0.11, -0.23, -0.52, 0.95, -0.45, 0.25);

export interface HandsState {
  look: PersonLook;
  /** Packed gear + move (protocol gear.ts), seconds since the move began. */
  gear: number; at: number;
  /** Walk cycle (radians) and 0..1 how fast. */
  phase: number; amp: number;
  /** On horseback: the horse's stride bounce in metres (Horses3D.bounce). */
  riding: boolean; bounce: number;
  dt: number;
  /** The camera's vertical field of view (degrees): when it narrows (aiming) the hands keep their size on screen. */
  fov: number;
  /** Aim held on this TV (known at once; the server's copy comes a frame or more later). */
  aim?: boolean;
  /** On horseback: where the horse (and my body in the saddle) faces, as People / Horses3D `facing` (rotation.y, forward = +z). */
  heading?: number;
}

export class Hands {
  private root = new Group();
  private arm: [Group, Group];
  private skinMat = new MeshLambertMaterial({ color: 0xe8b890 });
  private sleeveMat = new MeshLambertMaterial({ color: 0x2fa36b });
  private reinMat = new MeshLambertMaterial({ color: 0x3b2414 });
  private reins: [Mesh, Mesh];
  private tools: Partial<Record<Tool, Mesh>> = {};
  private toolMat = new MeshLambertMaterial({ vertexColors: true });
  private tmp = new Color();
  private v = new Vector3(); private v2 = new Vector3(); private q = new Quaternion(); private e = new Euler();
  private static Z = new Vector3(0, 0, 1);
  /** Eased in when the view turns to first person / out of a menu (they rise into view). */
  private k = 0;
  private sway = { x: 0, y: 0 };
  /** The bow that draws (gfx/bow.ts) and the shot's timeline: seconds since the string was let go (-1 = none), how far it was drawn, where the hand was. */
  private bow = new LiveBow();
  private shot = new BowShot();
  private relPos = new Vector3();

  constructor(camera: Camera) {
    const fore = new CylinderGeometry(0.036, 0.046, 0.36, 8).rotateX(Math.PI / 2).translate(0, 0, 0.2); // from the wrist back to the elbow
    const fist = new SphereGeometry(0.052, 10, 8).scale(1, 0.9, 1.15);
    const thumb = new SphereGeometry(0.022, 6, 5).scale(1, 1, 1.6).translate(0.035, 0.02, -0.03);
    const mk = (side: number) => {
      const g = new Group();
      const f = new Mesh(fore, this.sleeveMat), h = new Mesh(fist, this.skinMat), t = new Mesh(thumb, this.skinMat);
      t.scale.x = -side; // the thumb on the inside of each hand
      for (const m of [f, h, t]) { m.frustumCulled = false; m.castShadow = false; m.receiveShadow = false; g.add(m); }
      g.scale.setScalar(0.82); // the fist, thumb and sleeve a little smaller than life: they are very close to the eye
      this.root.add(g);
      return g;
    };
    this.arm = [mk(1), mk(-1)];
    const rein = new BoxGeometry(0.012, 0.012, 1).translate(0, 0, 0.5);
    this.reins = [new Mesh(rein, this.reinMat), new Mesh(rein, this.reinMat)];
    for (const r of this.reins) { r.frustumCulled = false; this.root.add(r); }
    this.bow.g.visible = false;
    this.bow.g.scale.setScalar(0.5); // a viewmodel: half size so the riser, the limbs and the string fit the screen at arm's length
    this.root.add(this.bow.g);
    this.root.visible = false;
    this.root.renderOrder = 3;
    camera.add(this.root);
  }

  hide(): void { this.root.visible = false; this.k = 0; }

  /** Horse heading while riding (NaN = on foot: the hands turn with the camera, as the body does). */
  private heading = NaN;
  private qw = new Quaternion();
  /**
   * After the camera is placed (World3D.follow): on horseback the hands stay on the reins over the horse's neck and only the head
   * (the camera) turns (imad 2026-11-27: "when I turn the camera with the right stick the hand turns with the head, it should turn
   * the head only"). The hands' frame = the horse's heading with the camera's own up / down tilt, undone from the camera's turn.
   */
  orient(camera: Camera): void {
    if (!this.root.visible || Number.isNaN(this.heading)) { this.root.quaternion.identity(); return; }
    camera.getWorldDirection(this.v);
    const pitch = Math.asin(Math.max(-1, Math.min(1, this.v.y)));
    this.qw.setFromEuler(this.e.set(pitch, this.heading + Math.PI, 0, 'YXZ'));
    this.root.quaternion.copy(camera.quaternion).invert().multiply(this.qw);
  }

  private tool(k: Tool): Mesh | null {
    const have = this.tools[k];
    if (have) return have;
    if (!itemsReady) return null;
    const g = itemGeo(k);
    if (!g) return null;
    // The grip in the fist: a bow by its middle, anything else a little above the end of its handle.
    g.computeBoundingBox();
    const b = g.boundingBox!, len = b.max.y - b.min.y, grip = k === 'bow' ? (b.min.y + b.max.y) / 2 : k === 'spear' ? b.min.y + len * 0.4 : b.min.y + len * 0.08;
    const inner = new Mesh(g, this.toolMat.clone());
    inner.position.set(-(b.min.x + b.max.x) / 2, -grip, -(b.min.z + b.max.z) / 2);
    inner.frustumCulled = false; inner.castShadow = false;
    const m = new Group() as unknown as Mesh;
    m.add(inner); m.visible = false;
    (m as unknown as { mat: MeshLambertMaterial }).mat = inner.material as MeshLambertMaterial;
    return (this.tools[k] = m);
  }

  update(s: HandsState): void {
    this.root.visible = true;
    this.heading = s.riding && s.heading !== undefined ? s.heading : NaN;
    const f = Math.tan((s.fov * Math.PI) / 360) / Math.tan((62 * Math.PI) / 360);
    this.root.scale.set(f, f, 1);
    this.k = Math.min(1, this.k + s.dt * 3.5);
    const rise = (1 - ease(this.k)) * 0.25;
    // Colours: my skin, the sleeve of what I wear.
    const body = (s.gear >> 10) & 3;
    this.skinMat.color.copy(s.look.skin);
    this.sleeveMat.color.copy(body === 2 ? this.tmp.copy(ARMOR).lerp(s.look.tunic, 0.25) : body === 1 ? this.tmp.copy(LEATHER).lerp(s.look.tunic, 0.35) : s.look.tunic);
    const anim = (s.gear >> 15) & 7, aiming = s.aim ?? (anim === 6 && ((s.gear >> 23) & 1) === 1), at = s.at;
    const held = HELD[s.gear & 7] ?? '', hq = (s.gear >> 3) & 7;
    let r = s.riding ? REIN_R : REST_R, l = s.riding ? REIN_L : REST_L;
    let tool: Tool | '' = anim === 2 ? 'axe' : anim === 3 ? 'sledge' : anim === 4 ? 'hammer' : anim === 6 ? 'bow' : (held as Tool | '');
    let reins = s.riding;
    if (anim === 1) { // attack: up over the right shoulder, then a cut down across
      const p = (at % 0.55) / 0.55;
      const up = P(0.26, -0.02, -0.36, -0.25, 0.55, 0.5), down = P(-0.06, -0.33, -0.5, 1.15, -0.2, -0.3);
      r = p < 0.45 ? mix(r, up, ease(p / 0.45)) : mix(up, down, ease((p - 0.45) / 0.3) * (1 - ease((p - 0.8) / 0.2) * 0.6));
      reins = false;
    } else if (anim === 2) { // chop: both hands on the axe, a swing from the right into the trunk ahead
      const p = (at % 0.85) / 0.85;
      const back = P(0.3, -0.1, -0.38, 0.3, 0.9, 1.0), hit = P(0.0, -0.22, -0.55, 0.9, -0.1, 1.3);
      r = p < 0.55 ? mix(hit, back, ease(p / 0.55)) : mix(back, hit, ease((p - 0.55) / 0.3));
      l = { ...r, x: r.x - 0.05, y: r.y - 0.07, z: r.z + 0.06 };
      reins = false;
    } else if (anim === 3) { // mine: the heavy hammer from over the head down onto the rock
      const p = (at % 0.9) / 0.9;
      const up = P(0.05, 0.02, -0.34, -0.5, 0.1), hit = P(0.04, -0.33, -0.56, 1.25, 0.05);
      r = p < 0.5 ? mix(hit, up, ease(p / 0.5)) : mix(up, hit, ease((p - 0.5) / 0.3));
      l = { ...r, x: r.x - 0.09, y: r.y - 0.03, z: r.z + 0.05 };
      reins = false;
    } else if (anim === 4) { // build: quick hammer taps low ahead, the other hand holds the work
      const p = (at % 0.42) / 0.42;
      r = mix(P(0.14, -0.16, -0.46, 0.2, 0.2), P(0.1, -0.3, -0.52, 1.0, 0.1), Math.sin(p * Math.PI));
      l = P(-0.12, -0.32, -0.55, 1.1, -0.2);
      reins = false;
    } else if (anim === 5) { // talk: hands open in front, moving with the words
      r = mix(r, P(0.16, -0.2, -0.48, 0.35, 0.3, -0.4), 0.5 + 0.5 * Math.sin(at * 5.2));
      if (!s.riding) l = mix(l, P(-0.17, -0.22, -0.5, 0.35, -0.3, 0.4), 0.5 + 0.5 * Math.sin(at * 3.7 + 1));
    } else if (aiming || anim === 6) { // the bow: placed below with the string, once the arms are known
      reins = false; tool = 'bow';
    } else if (anim === 7) { // use: reach down ahead and pick up
      const p = Math.min(1, at / 0.6), k = Math.sin(p * Math.PI);
      r = mix(r, P(0.1, -0.42, -0.58, 1.3, 0.15), k);
    }
    // Walking: the hands swing a little, opposite each other; on horseback they rise and fall with the stride.
    const sw = s.riding ? 0 : Math.sin(s.phase) * s.amp, bob = s.riding ? -s.bounce * 0.35 : Math.abs(Math.cos(s.phase)) * 0.012 * s.amp;
    const ek = 1 - Math.exp(-s.dt * 10);
    this.sway.x += (sw * 0.012 - this.sway.x) * ek; this.sway.y += (bob - this.sway.y) * ek;
    this.place(this.arm[0], r, this.sway.x, this.sway.y - rise);
    this.place(this.arm[1], l, -this.sway.x, this.sway.y - rise);
    // The bow (imad 2026-11-27): gripped in the left fist, the arrow nocked; aiming pulls the string and the arrow back to the right
    // hand under the chin, letting go snaps the string forward (it shivers), the arrow leaves and the hand springs back and out.
    if (this.shot.busy) { tool = 'bow'; reins = false; } // the shot plays out whatever is in the hand now
    const hasBow = tool === 'bow' && !(s.riding && !anim && !aiming && !this.shot.busy);
    this.bow.g.visible = hasBow;
    if (hasBow) this.drawBow(s, aiming, anim, at, hq, held === 'bow', rise);
    else this.shot.reset();
    // The reins: from each fist forward and down to the horse's mouth.
    for (let k = 0; k < 2; k++) {
      const rm = this.reins[k]!;
      rm.visible = reins;
      if (!reins) continue;
      const a = this.arm[k]!.position;
      this.v.set(a.x * 0.5, a.y - 0.55, a.z - 1.05);
      this.v2.copy(this.v).sub(a);
      const len = this.v2.length();
      rm.position.copy(a); rm.scale.set(1, 1, len);
      rm.quaternion.setFromUnitVectors(Hands.Z, this.v2.multiplyScalar(1 / len));
    }
    // What is in the right hand (the bow is drawn above, in the left; a 2-handed tool sits in both).
    for (const k of TOOLS) { const m = this.tools[k]; if (m) m.visible = false; }
    const reinsHand = s.riding && !anim && tool !== 'bow'; // riding at rest: the weapon hangs at the side, out of sight
    if (tool && tool !== 'bow' && !reinsHand) {
      const m = this.tool(tool);
      if (m) {
        const hand = this.arm[0];
        if (m.parent !== hand) hand.add(m);
        m.visible = true;
        (m as unknown as { mat: MeshLambertMaterial }).mat.color.copy(Q_TINT[tool === held ? hq : 0] ?? Q_TINT[0]!);
        m.position.set(0, 0, 0);
        m.rotation.set(-1.3, 0, 0); m.scale.setScalar(tool === 'spear' ? 0.5 : 0.45);
      }
    }
  }

  private drawBow(s: HandsState, aiming: boolean, anim: number, at: number, hq: number, mine: boolean, rise: number): void {
    const sh = this.shot;
    sh.step(aiming, anim, at, s.dt);
    const { draw, up, arrowOn, vib, fly } = sh;
    // Where the bow is: raised ahead (canted, top to the right) or lowered at my left side.
    const sx = -this.sway.x, sy = this.sway.y - rise;
    const lo = { x: -0.25, y: -0.31, z: -0.6, rx: 0.45, rz: -0.35 }, hi = { x: -0.1, y: -0.12, z: -0.68, rx: 0.02, rz: -0.15 };
    const k = ease(up), g = this.bow.g;
    g.position.set(lo.x + (hi.x - lo.x) * k + sx, lo.y + (hi.y - lo.y) * k + sy, lo.z + (hi.z - lo.z) * k);
    g.rotation.set(lo.rx + (hi.rx - lo.rx) * k, 0.3 + 0.15 * k, lo.rz + (hi.rz - lo.rz) * k, 'ZXY'); // turned a little: the limbs' curve and the arrow show
    this.bow.update(draw, vib, arrowOn, fly, Q_TINT[mine ? hq : 0]);
    // The left fist round the grip, the forearm going back down to the left.
    this.arm[1].position.copy(g.position);
    this.arm[1].quaternion.setFromEuler(this.e.set(0.95 + 0.1 * (1 - k), -0.45 + 0.1 * (1 - k), g.rotation.z * 0.5, 'YXZ'));
    // The right hand: on the string while it is drawn, springing back after the shot, then down to rest.
    g.updateMatrix();
    this.v.copy(this.bow.nock).applyMatrix4(g.matrix);
    if (arrowOn) {
      this.relPos.copy(this.v);
      this.arm[0].position.set(this.v.x + 0.018, this.v.y - 0.026, this.v.z + 0.01);
      this.arm[0].quaternion.setFromEuler(this.e.set(0.35, 0.6, -0.35, 'YXZ'));
    } else if (sh.relT >= 0) {
      const t = sh.relT, out = ease(t / 0.09), back = ease((t - 0.45) / 0.4);
      const r = REST_R;
      this.arm[0].position.set(this.relPos.x + 0.016 + 0.06 * out, this.relPos.y - 0.024 + 0.025 * out, this.relPos.z + 0.012 + 0.07 * out);
      this.arm[0].position.lerp(this.v2.set(r.x + this.sway.x, r.y + sy, r.z), back);
      this.arm[0].quaternion.setFromEuler(this.e.set(0.35 + (r.rx - 0.35) * back, 0.6 + (r.ry - 0.6) * back + 0.3 * out * (1 - back), -0.35 * (1 - back), 'YXZ'));
    }
  }

  private place(g: Group, p: Pose, dx: number, dy: number): void {
    g.position.set(p.x + dx, p.y + dy, p.z);
    g.quaternion.setFromEuler(this.e.set(p.rx, p.ry, p.rz, 'YXZ'));
  }
}
