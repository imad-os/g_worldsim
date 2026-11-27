import {
  AnimationMixer, Box3, BufferAttribute, BufferGeometry, Color, Group, LoopOnce, MeshLambertMaterial, Sphere, SkinnedMesh, Vector3, type AnimationAction, type AnimationClip,
  type Frustum, type Material, type Object3D, type Scene,
} from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { clone as cloneSkinned } from 'three/examples/jsm/utils/SkeletonUtils.js';
import { DEATH_SECS } from './animals.js';
import { COATS, coatOf } from './coats.js';

/**
 * Wild animals as animated models (imad 2026-11-27: "the bears, wolves, rabbits and deer are bad 3D models"): CC0 models prepared
 * by tools/assets/build-animals.mjs into docs/models (one skinned mesh each, credits in docs/models/CREDITS.md): a rabbit, a doe and
 * a stag (deer: by entity id), a wolf, a bear. Moves picked from the real speed (walk / run, the pace follows the speed), from what
 * the server says it does (Fight = attack when close) and idles that change now and then (grazing for deer and rabbits). A killed
 * animal plays its death (the bear has none: it rolls over), lies still and sinks. The boar keeps the low-poly set (no fitting
 * model yet), as does any kind whose model has not loaded.
 */
/** `fur` = the model's own fur colours [main, light] (linear, as in the file) that a coat recolours. */
interface Variant { url: string; scale: number; fur?: [number[], number[]] }
interface Def {
  variants: Variant[];
  /** Height of the first variant in metres (to the top of the ears; animals are drawn bigger than life, like people). */
  h: number;
  /** m/s at which Walk / the run clip play at their own pace, and where the run starts (with a margin either way). */
  walkAt: number; runAt: number; runIn: number;
  run: string;
  /** Idles to pick from when still, with a weight each. */
  idles: [string, number][];
}
const DEFS: (Def | null)[] = [
  { variants: [{ url: 'rabbit.glb', scale: 1, fur: [[0.2, 0.13, 0.07], [0.69, 0.6, 0.45]] }], h: 0.5, walkAt: 1.3, runAt: 3.0, runIn: 0.15, run: 'Run', idles: [['Idle', 3], ['Idle_2', 2]] },
  { variants: [{ url: 'deer.glb', scale: 1, fur: [[0.3, 0.13, 0.06], [0.48, 0.4, 0.29]] }, { url: 'stag.glb', scale: 1.12, fur: [[0.24, 0.14, 0.06], [0.48, 0.4, 0.29]] }], h: 2.05, walkAt: 1.1, runAt: 3.4, runIn: 2.0, run: 'Gallop', idles: [['Idle', 3], ['Idle_2', 1], ['Eating', 3]] },
  null, // boar: the low-poly set
  { variants: [{ url: 'wolf.glb', scale: 1, fur: [[0.18, 0.19, 0.17], [0.36, 0.38, 0.33]] }], h: 1.25, walkAt: 1.1, runAt: 3.6, runIn: 2.0, run: 'Gallop', idles: [['Idle', 3], ['Idle_2', 2], ['Eating', 1]] },
  { variants: [{ url: 'bear.glb', scale: 1 }], h: 1.7, walkAt: 0.9, runAt: 3.3, runIn: 1.9, run: 'Gallop', idles: [['Idle', 4], ['Eating', 1]] },
];
const FIGHT = 13;

interface Model {
  template: Object3D; clips: AnimationClip[]; unit: number; yaw: number; radius: number; height: number;
  /** Per coat: its own geometry (recoloured fur; null = the model's) or material (tinted texture). Made once at load. */
  geos: (BufferGeometry | null)[]; mats: (Material | null)[];
}
interface Inst {
  type: number; v: number; root: Group; body: Object3D; mesh: SkinnedMesh; mixer: AnimationMixer; acts: Record<string, AnimationAction>;
  cur: string; seen: number; lag: number; sp: number; ts: number; idleLeft: number; dead: boolean;
}

export class Beasts3D {
  private models: (Model | null)[][] = DEFS.map((d) => (d ? d.variants.map(() => null) : []));
  private readonly live = new Map<number, Inst>();
  private frame = 0;
  private sphere = new Sphere();
  private mats: Material[] = [];
  /** The camera this frame (World3D sets it): off screen = not drawn, skeleton not moved; far = animated every other frame, no shadow. */
  view: { frustum: Frustum; eye: Vector3; shadowD: number } | null = null;

  constructor(private scene: Scene, private shadows: boolean, private cap = 24) {}

  /** Loads every model in the background (base = the docs/models/ address); each kind is drawn as soon as its models are in. */
  loadAll(base: string): void {
    DEFS.forEach((d, type) => {
      if (!d) return;
      void (async () => { // the first variant first: the others take its unit
        for (let k = 0; k < d.variants.length; k++) {
          const v = d.variants[k]!;
          try { this.models[type]![k] = await this.load(new URL(v.url, base).href, d.h * v.scale, k === 0 ? 0 : (this.models[type]![0]?.unit ?? 0) * v.scale, type, v); }
          catch (err) { console.warn('animal model', v.url, err); }
        }
      })();
    });
  }

  private async load(url: string, h: number, unitHint: number, type: number, v: Variant): Promise<Model> {
    const g = await new GLTFLoader().loadAsync(url);
    let mesh: SkinnedMesh | null = null;
    g.scene.traverse((o) => { if ((o as SkinnedMesh).isSkinnedMesh && !mesh) mesh = o as SkinnedMesh; });
    if (!mesh) throw new Error('no skinned mesh');
    const sk = mesh as SkinnedMesh, src = sk.material as Material & { map?: unknown };
    const mat = new MeshLambertMaterial({ vertexColors: !!sk.geometry.getAttribute('color'), map: (src as { map?: MeshLambertMaterial['map'] }).map ?? null });
    sk.material = mat; this.mats.push(mat);
    g.scene.updateMatrixWorld(true);
    const box = new Box3().setFromObject(g.scene, true), size = box.getSize(new Vector3());
    // Variants of one kind share the first one's unit (a stag's antlers must not shrink its body).
    const unit = unitHint > 0 ? unitHint : h / Math.max(0.001, size.y);
    const { geos, mats } = this.coats(type, v, sk, mat);
    return { template: g.scene, clips: g.animations, unit, yaw: size.x > size.z ? -Math.PI / 2 : 0, radius: Math.max(size.x, size.y, size.z) * unit * 0.6, height: size.y * unit, geos, mats };
  }

  /**
   * The coats of one model: a vertex-coloured model gets a geometry per coat that shares every buffer but the colours (the fur's main
   * and light colours swapped, shading kept: each vertex keeps its brightness relative to the fur colour it was); a textured one gets
   * a material per coat with a tint. Eyes, nose, hooves, antlers keep their colours.
   */
  private coats(type: number, v: Variant, sk: SkinnedMesh, mat: MeshLambertMaterial): { geos: (BufferGeometry | null)[]; mats: (Material | null)[] } {
    const list = COATS[type] ?? [], geos: (BufferGeometry | null)[] = [], mats: (Material | null)[] = [];
    const src = sk.geometry, col = src.getAttribute('color');
    const tmp = new Color();
    for (const coat of list) {
      let g: BufferGeometry | null = null, m: Material | null = null;
      if (coat.main !== undefined && col && v.fur) {
        const n = col.count, out = new Float32Array(n * 3);
        const targets = [tmp.setHex(coat.main).toArray() as number[], new Color(coat.light ?? coat.main).toArray() as number[]];
        for (let k = 0; k < n; k++) {
          const r = col.getX(k), gg = col.getY(k), b = col.getZ(k);
          let hit = -1;
          for (let f = 0; f < 2 && hit < 0; f++) { const F = v.fur[f]!; if (Math.abs(r - F[0]!) + Math.abs(gg - F[1]!) + Math.abs(b - F[2]!) < 0.05) hit = f; }
          if (hit < 0) { out[k * 3] = r; out[k * 3 + 1] = gg; out[k * 3 + 2] = b; continue; }
          const F = v.fur[hit]!, T = targets[hit]!, lum = (r + gg + b) / Math.max(1e-4, F[0]! + F[1]! + F[2]!);
          out[k * 3] = T[0]! * lum; out[k * 3 + 1] = T[1]! * lum; out[k * 3 + 2] = T[2]! * lum;
        }
        g = new BufferGeometry();
        for (const [name, a] of Object.entries(src.attributes)) g.setAttribute(name, name === 'color' ? new BufferAttribute(out, 3) : a);
        g.setIndex(src.index); for (const gr of src.groups) g.addGroup(gr.start, gr.count, gr.materialIndex);
        g.boundingBox = src.boundingBox; g.boundingSphere = src.boundingSphere;
      } else if (coat.tint !== undefined) {
        const mm = mat.clone(); mm.color.setHex(coat.tint); m = mm; this.mats.push(mm);
      }
      geos.push(g); mats.push(m);
    }
    return { geos, mats };
  }

  private model(type: number, id: number): Model | null {
    const ms = this.models[type];
    if (!ms || !ms.length) return null;
    const m = ms[id % ms.length] ?? ms[0];
    return m ?? null;
  }

  begin(): void { this.frame++; }

  /**
   * One animal (type 0 rabbit .. 4 bear) at (x, z), facing (0 = +z), speed m/s, act = server action, dt = frame time;
   * dead >= 0 = seconds since it was killed. False = no model for it (yet): the caller draws the low-poly one.
   */
  add(type: number, id: number, x: number, z: number, facing: number, speed: number, act: number, dt: number, dead = -1): boolean {
    const d = DEFS[type], m = d ? this.model(type, id) : null;
    if (!d || !m) return false;
    let h = this.live.get(id);
    if (h && h.type !== type) { this.drop(id, h); h = undefined; }
    if (!h) {
      if (this.live.size >= this.cap) this.evict();
      if (this.live.size >= this.cap) return false;
      h = this.make(type, id, m);
      this.live.set(id, h);
    }
    h.seen = this.frame;
    const v = this.view;
    let far = false;
    if (v) {
      this.sphere.center.set(x, m.height * 0.5, z); this.sphere.radius = m.radius + 0.3;
      if (!v.frustum.intersectsSphere(this.sphere)) { h.root.visible = false; h.lag += dt; return true; }
      const dd = Math.hypot(x - v.eye.x, z - v.eye.z);
      far = dd > 30;
      const cast = this.shadows && dd < v.shadowD;
      if (h.mesh.castShadow !== cast) h.mesh.castShadow = cast;
    }
    h.root.visible = true;
    h.root.position.set(x, 0, z);
    h.root.rotation.set(0, facing, 0);
    // What to play.
    h.sp += (speed - h.sp) * (1 - Math.exp(-dt * 5));
    const sp = h.sp;
    let want: string;
    if (dead >= 0) {
      want = h.acts.Death ? 'Death' : h.cur;
      if (!h.dead) {
        h.dead = true;
        if (h.acts.Death) { const a = h.acts.Death; a.setLoop(LoopOnce, 1); a.clampWhenFinished = true; }
      }
      // No death of its own (the bear): it tips over onto its side, like the low-poly set.
      if (!h.acts.Death) {
        const f = Math.min(1, Math.max(0, (dead - 0.15) / 0.5)), fall = f * f * (3 - 2 * f);
        h.root.rotation.set(0, facing, (Math.PI / 2) * fall, 'YXZ');
        h.root.position.y = m.height * 0.12 * fall;
        if (h.acts[h.cur]) h.acts[h.cur]!.timeScale = Math.max(0, 1 - dead * 2);
      }
      if (dead > DEATH_SECS - 1) h.root.position.y -= Math.min(1, dead - (DEATH_SECS - 1)) * m.height * 0.6;
    } else if (act === FIGHT && sp < 1.2 && h.acts.Attack) want = 'Attack';
    else if (sp > (h.cur === d.run ? d.runIn * 0.8 : d.runIn) && h.acts[d.run]) want = d.run;
    else if (sp > (h.cur === 'Walk' || h.cur === d.run ? 0.12 : 0.3)) want = h.acts.Walk ? 'Walk' : d.run;
    else {
      h.idleLeft -= dt;
      const still = d.idles.some(([n]) => n === h!.cur);
      want = still && h.idleLeft > 0 ? h.cur : pick(d.idles, h.acts);
      if (want !== h.cur || !still) h.idleLeft = 5 + Math.random() * 7;
    }
    if (want !== h.cur && h.acts[want]) {
      const from = h.acts[h.cur], to = h.acts[want]!;
      const gaits = want === 'Walk' || want === d.run, wasGait = h.cur === 'Walk' || h.cur === d.run;
      const share = from && gaits && wasGait ? (from.time % from.getClip().duration) / from.getClip().duration : 0;
      to.reset();
      if (gaits && wasGait) to.time = share * to.getClip().duration; // the same point of the stride
      to.play();
      if (from) to.crossFadeFrom(from, want === 'Death' ? 0.15 : 0.3, false);
      h.cur = want;
    }
    // Pace: the legs keep up with the ground (clamped so a crawl or a dash still looks like the animal).
    const run = h.cur === d.run && d.run !== 'Walk', walk = h.cur === 'Walk' || (h.cur === d.run && !h.acts.Walk && sp < d.runIn);
    const tsWant = walk ? Math.max(0.5, Math.min(1.9, sp / d.walkAt)) : run ? Math.max(0.65, Math.min(1.6, sp / d.runAt)) : 1;
    h.ts += (tsWant - h.ts) * (1 - Math.exp(-dt * 6));
    const ac = h.acts[h.cur];
    if (ac && (walk || run)) ac.timeScale = h.ts;
    h.lag += dt;
    if (!far || ((this.frame + id) & 1) === 0) { h.mixer.update(Math.min(0.5, h.lag)); h.lag = 0; }
    return true;
  }

  end(): void {
    for (const [id, h] of this.live) {
      if (h.seen === this.frame) continue;
      h.root.visible = false;
      if (this.frame - h.seen > 600) this.drop(id, h); // out of sight for long: let it go
    }
  }

  private evict(): void { // full: the one not drawn for the longest goes
    let best = -1, bestId = -1;
    for (const [id, h] of this.live) if (h.seen !== this.frame && this.frame - h.seen > best) { best = this.frame - h.seen; bestId = id; }
    if (bestId >= 0) this.drop(bestId, this.live.get(bestId)!);
  }

  private drop(id: number, h: Inst): void { this.scene.remove(h.root); h.mixer.stopAllAction(); this.live.delete(id); }

  private make(type: number, id: number, m: Model): Inst {
    const root = new Group(), body = cloneSkinned(m.template);
    body.scale.setScalar(m.unit); body.rotation.y = m.yaw;
    root.add(body);
    let mesh: SkinnedMesh | null = null;
    body.traverse((o) => { if ((o as SkinnedMesh).isSkinnedMesh && !mesh) mesh = o as SkinnedMesh; });
    const sk = mesh as unknown as SkinnedMesh;
    sk.castShadow = this.shadows; sk.frustumCulled = false;
    const coat = coatOf(type, id); // its own coat (fur recoloured or texture tinted)
    if (coat >= 0) { const g = m.geos[coat], mt = m.mats[coat]; if (g) sk.geometry = g; if (mt) sk.material = mt; }
    const mixer = new AnimationMixer(body), acts: Record<string, AnimationAction> = {};
    for (const c of m.clips) acts[c.name] = mixer.clipAction(c);
    const d = DEFS[type]!, first = pick(d.idles, acts);
    acts[first]?.play();
    if (acts[first]) acts[first]!.time = Math.random() * acts[first]!.getClip().duration; // a herd does not breathe in step
    this.scene.add(root);
    return { type, v: id, root, body, mesh: sk, mixer, acts, cur: first, seen: this.frame, lag: 0, sp: 0, ts: 1, idleLeft: 4 + Math.random() * 8, dead: false };
  }

  /** Proof (?dev): the animals drawn with a model and what each plays. */
  debug(): { id: number; type: number; cur: string; sp: number }[] {
    return [...this.live].filter(([, h]) => h.seen === this.frame).map(([id, h]) => ({ id, type: h.type, cur: h.cur, sp: +h.sp.toFixed(2) }));
  }
}

function pick(list: [string, number][], acts: Record<string, AnimationAction>): string {
  const have = list.filter(([n]) => acts[n]);
  let r = Math.random() * have.reduce((s, [, w]) => s + w, 0);
  for (const [n, w] of have) { r -= w; if (r <= 0) return n; }
  return have[0]?.[0] ?? Object.keys(acts)[0] ?? 'Idle';
}
