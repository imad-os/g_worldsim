import {
  AnimationMixer, Box3, BufferAttribute, BufferGeometry, CanvasTexture, Color, Group, Mesh, MeshBasicMaterial, MeshLambertMaterial,
  Object3D, AdditiveBlending, Points, PointsMaterial, Float32BufferAttribute, PlaneGeometry, SkinnedMesh, BoxGeometry, Vector3,
  type AnimationAction, type AnimationClip, type Scene,
} from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { clone as cloneSkinned } from 'three/examples/jsm/utils/SkeletonUtils.js';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

/**
 * Horses (imad 2026-11-25): Quaternius' CC0 animated horse (docs/models/horse.glb, credits next to it), one skinned
 * mesh per horse (its 8 parts merged into one draw call, coloured per coat), animations Idle / Eating / Walk / Gallop
 * picked from the real speed and what the server says it does, cross-faded. Tamed horses wear a saddle. Rare horses
 * glow blue on the ground; legendary ones have a golden mane, a warm glow, a pulsing golden ring and sparks rising.
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
const H = 2.5; // height to the ears, metres (people are drawn 1.25 x life size too)

interface Inst {
  root: Group; mesh: SkinnedMesh; mixer: AnimationMixer; acts: Record<string, AnimationAction>; cur: string;
  mat: MeshLambertMaterial; coat: number; q: number; saddle: Mesh; ring: Mesh; sparks: Points | null; seen: number; idleAlt: number;
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
    const gc = (q === 2 ? COATS.length : 0) + (coat & 7);
    if (h.coat !== gc) { h.mesh.geometry = this.geos[gc]!; h.coat = gc; }
    if (h.q !== q) {
      h.q = q;
      h.mat.emissive.setHex(q === 2 ? 0x3a2600 : q === 1 ? 0x0c1a33 : 0x000000);
      (h.ring.material as MeshBasicMaterial).color.setHex(q === 2 ? GOLD : 0x5aa8ff);
      h.ring.visible = q > 0;
      if (q === 2 && !h.sparks) h.sparks = this.makeSparks(h.root);
      if (h.sparks) h.sparks.visible = q === 2;
    }
    h.root.visible = true;
    h.root.position.set(x, 0, z);
    h.root.rotation.y = facing;
    h.root.scale.setScalar(scale);
    h.saddle.visible = tamed;
    // Animation from what it really does.
    const want = speed > 4.2 ? 'Gallop' : speed > 0.25 ? 'Walk' : act === 3 ? 'Eating' : (h.idleAlt > 0.7 ? 'Idle_2' : 'Idle');
    if (want !== h.cur && h.acts[want]) {
      const from = h.acts[h.cur], to = h.acts[want]!;
      to.reset().play();
      if (from) to.crossFadeFrom(from, 0.25, false);
      h.cur = want;
      if (want === 'Idle' || want === 'Idle_2') h.idleAlt = Math.random();
    }
    const a = h.acts[h.cur];
    if (a) a.timeScale = h.cur === 'Gallop' ? Math.max(0.6, speed / 7.5) : h.cur === 'Walk' ? Math.max(0.5, Math.min(2.4, speed / 1.5)) : 1;
    h.mixer.update(dt);
    // Quality effects: the ring breathes, sparks rise and fade.
    if (q > 0) { const p = 0.85 + Math.sin(t * (q === 2 ? 3 : 1.6) + id) * 0.15; h.ring.scale.setScalar(p); (h.ring.material as MeshBasicMaterial).opacity = q === 2 ? 0.7 : 0.45; }
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
    return { root, mesh: m, mixer, acts, cur: 'Idle', mat, coat: -1, q: -1, saddle, ring, sparks: null, seen: this.frame, idleAlt: Math.random() };
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
