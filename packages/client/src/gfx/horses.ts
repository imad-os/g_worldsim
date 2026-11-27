import {
  AnimationMixer, Box3, BufferAttribute, BufferGeometry, CanvasTexture, Color, Group, Mesh, MeshBasicMaterial, MeshLambertMaterial,
  Object3D, AdditiveBlending, Points, PointsMaterial, Float32BufferAttribute, PlaneGeometry, SkinnedMesh, BoxGeometry, Vector3, Sphere, type Frustum,
  type AnimationAction, type AnimationClip, type Scene,
} from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { clone as cloneSkinned } from 'three/examples/jsm/utils/SkeletonUtils.js';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

/**
 * Horses (imad 2026-11-25): Quaternius' CC0 animated horse (docs/models/horse.glb, credits next to it), one skinned
 * mesh per horse (its 8 parts merged into one draw call, coloured per coat), animations Idle / Eating / Walk / Gallop
 * picked from the real speed and what the server says it does, cross-faded. Tamed horses wear a saddle. Rare horses
 * have a faint blue sheen; legendary ones have a golden mane, a warm glow and sparks rising (imad 2026-11-25: no bright circle on the ground).
 * Until the model is loaded (or if it fails), the low-poly animal set draws them.
 */
const PARTS = ['Main', 'Main_Dark', 'Main_Light', 'Hooves', 'Hair', 'Muzzle', 'Eye_White', 'Eye_Black'];
/** Coats (server COATS order): main, dark, light, mane / tail, muzzle. Hooves and eyes stay. */
const COATS: [number, number, number, number, number][] = [
  [0x7a4424, 0x4f2c17, 0x9c5a32, 0x1d1712, 0x2b1d14], // bay
  [0x9a5124, 0x6e3816, 0xb86a35, 0x7a3a18, 0x3a2414], // chestnut
  [0x2a2523, 0x1b1716, 0x3a3330, 0x141110, 0x221c19], // black
  [0x8d8b86, 0x6c6a66, 0xa9a6a0, 0x4a4845, 0x55504c], // grey
  [0xe2ddd2, 0xc8c2b6, 0xf2eee6, 0xd6cfc0, 0x9c8f86], // white
  [0xc9a060, 0xa98345, 0xe0bb7a, 0xf0e2c0, 0x7a5a3a], // palomino
  [0xa8895e, 0x7d6443, 0xc1a476, 0x3b2c1d, 0x4e3a28], // dun
  [0xc9ccd3, 0x9ea3ad, 0xe6e9ee, 0xf5f7fa, 0x707580], // silver
];
const GOLD = 0xffc94a;
const SEAT = 0.64; // seat height as part of the horse's height
/** Gait changes with a margin (m/s): into a gallop above GALLOP_IN, back to a walk below GALLOP_OUT (riders trot at 3.1). */
const GALLOP_IN = 2.6, GALLOP_OUT = 2.1;
const H = 2.5; // height to the ears, metres (people are drawn 1.25 x life size too)

interface Inst {
  root: Group; mesh: SkinnedMesh; mixer: AnimationMixer; acts: Record<string, AnimationAction>; cur: string;
  mat: MeshLambertMaterial; coat: number; q: number; saddle: Mesh; ring: Mesh; sparks: Points | null; seen: number; idleAlt: number;
  /** Seconds of animation not yet played (skipped frames). */
  lag: number;
  /** Speed and animation pace eased over a few frames (the speed read from the screen jitters). */
  sp: number; ts: number;
  /** Proof / tuning: gait changes so far, the last 240 speeds given. */
  sw: number; raw: Float32Array; ri: number;
}

export class Horses3D {
  ready = false;
  private geos: BufferGeometry[] = [];
  private template: Object3D | null = null;
  private clips: AnimationClip[] = [];
  private unit = 1; // model units -> metres
  private yaw = 0; // turn so the model's nose points +z
  private readonly live = new Map<number, Inst>();
  private frame = 0;
  /**
   * The camera this frame (World3D sets it; the gate ride leaves it null = draw everything): a horse off screen is not drawn and
   * its skeleton not moved; far away its animation steps every other frame and casts no shadow (imad 2026-11-26, 60 fps).
   */
  view: { frustum: Frustum; eye: Vector3; shadowD: number } | null = null;
  private sphere = new Sphere();
  private ringTex: CanvasTexture;
  private sparkTex: CanvasTexture;
  private readonly saddleGeo = new BoxGeometry(0.5, 0.12, 0.62);
  private readonly saddleMat = new MeshLambertMaterial({ color: 0x5a3a22 });

  constructor(private scene: Scene, private shadows: boolean, private cap = 18) {
    this.ringTex = glowTexture(64, true);
    this.sparkTex = glowTexture(32, false);
  }

  async load(url: string): Promise<void> {
    const g = await new GLTFLoader().loadAsync(url);
    // The parts of the horse (one skinned mesh per material) -> one geometry per coat, with vertex colours.
    const parts: SkinnedMesh[] = [];
    g.scene.traverse((o) => { if ((o as SkinnedMesh).isSkinnedMesh) parts.push(o as SkinnedMesh); });
    if (!parts.length) throw new Error('no skinned mesh');
    const plain = parts.map((p) => {
      const src = p.geometry, out = new BufferGeometry();
      for (const name of ['position', 'normal', 'skinIndex', 'skinWeight']) {
        const a = src.getAttribute(name);
        if (!a) continue;
        const n = a.count, k = a.itemSize, arr = new Float32Array(n * k);
        for (let i = 0; i < n; i++) for (let j = 0; j < k; j++) arr[i * k + j] = a.getComponent(i, j);
        out.setAttribute(name, new BufferAttribute(arr, k));
      }
      if (src.index) out.setIndex(Array.from(src.index.array as ArrayLike<number>));
      return out;
    });
    const merged = mergeGeometries(plain, false);
    if (!merged) throw new Error('merge failed');
    const partOf: number[] = []; // vertex -> part index
    parts.forEach((p, k) => { const name = (Array.isArray(p.material) ? p.material[0] : p.material)?.name ?? ''; const pi = Math.max(0, PARTS.indexOf(name)); for (let v = 0; v < p.geometry.getAttribute('position').count; v++) partOf.push(pi); });
    for (let c = 0; c < COATS.length * 2; c++) { // + a golden-maned version of each for legendary horses
      const C = COATS[c % COATS.length]!, gold = c >= COATS.length;
      const pal = [C[0], C[1], C[2], 0x3a332b, gold ? GOLD : C[3], C[4], 0xf2f2f2, 0x0a0a0a].map((h) => new Color(h));
      const col = new Float32Array(partOf.length * 3);
      partOf.forEach((pi, v) => { const cc = pal[pi]!; col[v * 3] = cc.r; col[v * 3 + 1] = cc.g; col[v * 3 + 2] = cc.b; });
      const geo = new BufferGeometry();
      for (const [n, a] of Object.entries(merged.attributes)) geo.setAttribute(n, a);
      geo.setIndex(merged.index);
      geo.setAttribute('color', new BufferAttribute(col, 3));
      geo.computeBoundingSphere();
      this.geos.push(geo);
    }
    // The template: the armature with one merged skinned mesh in place of the parts.
    const first = parts[0]!;
    const sk = new SkinnedMesh(this.geos[0]!, new MeshLambertMaterial({ vertexColors: true }));
    sk.name = 'HorseMesh';
    first.parent!.add(sk);
    sk.bind(first.skeleton, first.bindMatrix);
    for (const p of parts) p.parent!.remove(p);
    // Size: the model's height -> H metres (a bit bigger than life, like people), nose along +z.
    g.scene.updateMatrixWorld(true);
    const box = new Box3().setFromObject(g.scene, true), size = box.getSize(new Vector3());
    this.unit = H / Math.max(0.001, size.y);
    this.yaw = size.x > size.z ? -Math.PI / 2 : 0;
    this.template = g.scene;
    this.clips = g.animations;
    this.ready = true;
  }

  /** Use another (loaded) set's model, coats and moves: the ride between maps draws in its own scene. */
  share(o: Horses3D): void {
    this.geos = o.geos; this.template = o.template; this.clips = o.clips; this.unit = o.unit; this.yaw = o.yaw; this.ready = o.ready;
  }

  begin(): void { this.frame++; }

  /**
   * One horse. x, z = ground; facing (0 = +z); speed m/s; act = server action (3 eat / 8 rest / 9 flee...); scale (1 = adult);
   * q quality 0-2, coat 0-7, tamed (saddle), t = seconds (effects), dt = frame time.
   */
  add(id: number, x: number, z: number, facing: number, speed: number, act: number, scale: number, q: number, coat: number, tamed: boolean, t: number, dt: number): void {
    if (!this.template) return;
    let h = this.live.get(id);
    if (!h) { if (this.live.size >= this.cap) return; h = this.make(); this.live.set(id, h); }
    h.seen = this.frame;
    const v = this.view;
    let far = false;
    if (v) {
      this.sphere.center.set(x, 1.1 * scale, z); this.sphere.radius = 1.8 * scale;
      if (!v.frustum.intersectsSphere(this.sphere)) { h.root.visible = false; h.lag += dt; return; }
      const d = Math.hypot(x - v.eye.x, z - v.eye.z);
      far = d > 30;
      const cast = this.shadows && d < v.shadowD;
      if (h.mesh.castShadow !== cast) { h.mesh.castShadow = cast; h.saddle.castShadow = cast; }
    }
    const gc = (q === 2 ? COATS.length : 0) + (coat & 7);
    if (h.coat !== gc) { h.mesh.geometry = this.geos[gc]!; h.coat = gc; }
    if (h.q !== q) {
      h.q = q;
      h.mat.emissive.setHex(q === 2 ? 0x3a2600 : q === 1 ? 0x0c1a33 : 0x000000);
      (h.ring.material as MeshBasicMaterial).color.setHex(q === 2 ? GOLD : 0x5aa8ff);
      h.ring.visible = false; // imad 2026-11-25: "remove the bright circle under horse feet"
      if (q === 2 && !h.sparks) h.sparks = this.makeSparks(h.root);
      if (h.sparks) h.sparks.visible = q === 2;
    }
    h.root.visible = true;
    h.root.position.set(x, 0, z);
    h.root.rotation.y = facing;
    h.root.scale.setScalar(scale);
    h.saddle.visible = tamed;
    // Animation from what it really does (imad 2026-11-26: "the running animation is not smooth"): the speed is eased first
    // (read from the screen it jitters frame to frame), the gait changes with a margin either way (a canter at 4.2 m/s sat
    // right on the old switch and flipped Walk / Gallop every few frames, each time from the start of the clip), a change of
    // gait keeps the legs where they were in the stride, and the pace follows the speed smoothly.
    h.raw[h.ri++ % 240] = speed;
    h.sp += (speed - h.sp) * (1 - Math.exp(-dt * 5));
    const sp = h.sp, cur = h.cur;
    const still = act === 3 ? 'Eating' : cur === 'Idle' || cur === 'Idle_2' ? cur : h.idleAlt > 0.7 ? 'Idle_2' : 'Idle';
    const want = sp > (cur === 'Gallop' ? GALLOP_OUT : GALLOP_IN) ? 'Gallop' : sp > (cur === 'Walk' || cur === 'Gallop' ? 0.15 : 0.35) ? 'Walk' : still;
    if (want !== cur && h.acts[want]) {
      const from = h.acts[cur], to = h.acts[want]!;
      const gaits = (want === 'Walk' || want === 'Gallop') && (cur === 'Walk' || cur === 'Gallop');
      const share = from && gaits ? (from.time % from.getClip().duration) / from.getClip().duration : 0;
      to.reset();
      if (gaits) to.time = share * to.getClip().duration; // the same point of the stride
      to.play();
      if (from) to.crossFadeFrom(from, gaits ? 0.35 : 0.3, false);
      h.cur = want;
      h.sw++;
      h.ts = -1; // a new gait starts at its own pace
      if (want === 'Walk' || want === 'Gallop') h.idleAlt = Math.random(); // the next rest: one of the two idles
    }
    const tsWant = h.cur === 'Gallop' ? Math.max(0.62, Math.min(1.5, 0.48 + sp * 0.062)) : h.cur === 'Walk' ? Math.max(0.55, Math.min(1.85, sp / 1.45)) : 1;
    h.ts = h.ts < 0 ? tsWant : h.ts + (tsWant - h.ts) * (1 - Math.exp(-dt * 6));
    for (const k of ['Walk', 'Gallop']) { const ac = h.acts[k]; if (ac && ac.isRunning()) ac.timeScale = k === 'Gallop' ? Math.max(0.62, h.ts) : Math.min(1.85, h.ts); }
    h.lag += dt;
    if (!far || ((this.frame + id) & 1) === 0) { h.mixer.update(Math.min(0.5, h.lag)); h.lag = 0; }
    // Quality effects: sparks rise and fade round a legendary horse.
    if (h.sparks && q === 2) {
      const pos = h.sparks.geometry.getAttribute('position') as BufferAttribute, n = pos.count;
      for (let k = 0; k < n; k++) {
        const ph = (t * 0.35 + k / n) % 1, an = k * 2.399 + t * 0.6;
        pos.setXYZ(k, Math.cos(an) * (0.55 + 0.15 * Math.sin(k)), 0.3 + ph * 2.1, Math.sin(an) * 0.9);
      }
      pos.needsUpdate = true;
      (h.sparks.material as PointsMaterial).opacity = 0.9;
    }
  }

  /**
   * How far the horse's back is up or down in its stride right now (metres, x its size): the rider and a first-person
   * camera rise and fall with it instead of a bob of their own.
   */
  bounce(id: number, scale: number): number {
    const h = this.live.get(id);
    if (!h) return 0;
    let b = 0;
    const g = h.acts.Gallop, w = h.acts.Walk;
    if (g && g.isRunning()) b += g.getEffectiveWeight() * 0.075 * (0.5 - 0.5 * Math.cos((g.time / g.getClip().duration) * Math.PI * 2));
    if (w && w.isRunning()) b += w.getEffectiveWeight() * 0.022 * (0.5 - 0.5 * Math.cos((w.time / w.getClip().duration) * Math.PI * 4));
    return b * scale;
  }

  /** The ridden horse's gait for the rider's body (gfx/people.ts): gallop weight 0..1, trot / walk weight, and where in each stride (radians). */
  readonly gait = { g: 0, w: 0, gp: 0, wp: 0 };
  strideOf(id: number): { g: number; w: number; gp: number; wp: number } {
    const h = this.live.get(id), o = this.gait;
    o.g = o.w = o.gp = o.wp = 0;
    if (!h) return o;
    const g = h.acts.Gallop, w = h.acts.Walk;
    if (g && g.isRunning()) { o.g = g.getEffectiveWeight(); o.gp = (g.time / g.getClip().duration) * Math.PI * 2; }
    if (w && w.isRunning()) { o.w = w.getEffectiveWeight(); o.wp = (w.time / w.getClip().duration) * Math.PI * 2; }
    return o;
  }

  /** Proof / tuning (?dev): each horse's gait, eased speed, pace, gait changes and its last speeds (oldest first). */
  debug(): { id: number; cur: string; sp: number; ts: number; sw: number; raw: number[] }[] {
    return [...this.live].map(([id, h]) => ({ id, cur: h.cur, sp: h.sp, ts: h.ts, sw: h.sw, raw: Array.from({ length: Math.min(240, h.ri) }, (_, k) => h.raw[(h.ri - Math.min(240, h.ri) + k) % 240]!) }));
  }

  /** Seat height of a horse drawn at `scale` (for its rider). */
  seat(scale: number): number { return H * SEAT * scale; }

  end(): void {
    for (const [id, h] of this.live) {
      if (h.seen === this.frame) continue;
      h.root.visible = false;
      if (this.frame - h.seen > 600) { this.scene.remove(h.root); h.mat.dispose(); this.live.delete(id); } // out of sight for long: let it go
    }
  }

  private make(): Inst {
    const root = new Group(), body = cloneSkinned(this.template!);
    body.scale.setScalar(this.unit); body.rotation.y = this.yaw;
    root.add(body);
    let mesh: SkinnedMesh | null = null;
    body.traverse((o) => { if (o.name === 'HorseMesh') mesh = o as SkinnedMesh; });
    const m = mesh as unknown as SkinnedMesh;
    const mat = new MeshLambertMaterial({ vertexColors: true });
    m.material = mat; m.castShadow = this.shadows; m.frustumCulled = false;
    const mixer = new AnimationMixer(body), acts: Record<string, AnimationAction> = {};
    for (const c of this.clips) acts[c.name] = mixer.clipAction(c);
    acts.Idle?.play();
    const saddle = new Mesh(this.saddleGeo, this.saddleMat);
    saddle.position.set(0, H * SEAT - 0.04, -0.05); saddle.castShadow = this.shadows; saddle.visible = false;
    root.add(saddle);
    const ring = new Mesh(new PlaneGeometry(2.6, 3.4).rotateX(-Math.PI / 2), new MeshBasicMaterial({ map: this.ringTex, transparent: true, depthWrite: false, blending: AdditiveBlending, color: 0x5aa8ff }));
    ring.position.y = 0.04; ring.visible = false; ring.renderOrder = 2;
    root.add(ring);
    this.scene.add(root);
    return { root, mesh: m, mixer, acts, cur: 'Idle', mat, coat: -1, q: -1, saddle, ring, sparks: null, seen: this.frame, idleAlt: Math.random(), lag: 0, sp: 0, ts: 1, sw: 0, raw: new Float32Array(240), ri: 0 };
  }

  private makeSparks(root: Group): Points {
    const n = 14, g = new BufferGeometry();
    g.setAttribute('position', new Float32BufferAttribute(new Float32Array(n * 3), 3));
    const p = new Points(g, new PointsMaterial({ map: this.sparkTex, color: GOLD, size: 0.22, transparent: true, depthWrite: false, blending: AdditiveBlending }));
    p.frustumCulled = false;
    root.add(p);
    return p;
  }
}

/** A soft round glow (ring = brighter edge) drawn once on a canvas. */
function glowTexture(n: number, ring: boolean): CanvasTexture {
  const c = document.createElement('canvas'); c.width = c.height = n;
  const x = c.getContext('2d')!, g = x.createRadialGradient(n / 2, n / 2, 0, n / 2, n / 2, n / 2);
  if (ring) { g.addColorStop(0, 'rgba(255,255,255,0.15)'); g.addColorStop(0.7, 'rgba(255,255,255,0.55)'); g.addColorStop(1, 'rgba(255,255,255,0)'); }
  else { g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.4, 'rgba(255,255,255,0.6)'); g.addColorStop(1, 'rgba(255,255,255,0)'); }
  x.fillStyle = g; x.fillRect(0, 0, n, n);
  return new CanvasTexture(c);
}
