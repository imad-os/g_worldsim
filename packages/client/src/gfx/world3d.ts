import {
  WebGLRenderer, Scene, PerspectiveCamera, HemisphereLight, DirectionalLight, PointLight, Color, Fog, Mesh, Group,
  PlaneGeometry, MeshLambertMaterial, MeshPhongMaterial, MeshBasicMaterial, TorusGeometry, CircleGeometry, SphereGeometry,
  InstancedMesh, Matrix4, Vector3, Quaternion, Euler, CylinderGeometry, IcosahedronGeometry, MeshLambertMaterial as Lam, PCFSoftShadowMap, PCFShadowMap, NeutralToneMapping, AdditiveBlending, DynamicDrawUsage, DoubleSide,
  type BufferGeometry,
} from 'three';
import { People } from './people.js';
import { Animals3D } from './animals.js';

export type Tier = 'low' | 'mid' | 'high';

/**
 * The 3D view: renderer, tilted camera (about 58 degrees down, looking north, like a classic top-down adventure),
 * sun / moon and sky light that follow the game clock, real shadows on mid / high TVs, water, portals, people and
 * shots. Chunks are added by the app through addChunk / removeChunk.
 */
const PITCH = (58 * Math.PI) / 180;

export class World3D {
  readonly renderer: WebGLRenderer;
  readonly scene = new Scene();
  readonly camera = new PerspectiveCamera(30, 16 / 9, 1, 400);
  readonly people: People;
  private hemi = new HemisphereLight(0xcfe3ff, 0x5d4c3a, 1.1);
  private sun = new DirectionalLight(0xfff1d6, 2.4);
  private lamp = new PointLight(0xffc27a, 0, 14, 1.6);
  private fog: Fog;
  private bg = new Color(0x9cc7e8);
  private chunks = new Group();
  private water: Mesh;
  private under: Mesh;
  private portals = new Group();
  private shots: InstancedMesh;
  private nShots = 0;
  // Items: canned food (1), berry bush (2), anything else = a small crate.
  private cans: InstancedMesh; private bushes: InstancedMesh; private berries: InstancedMesh; private crates: InstancedMesh;
  private nCan = 0; private nBush = 0; private nCrate = 0;
  private q = new Quaternion(); private eu = new Euler(); private v3 = new Vector3(); private s3 = new Vector3();
  private groundMat = new MeshLambertMaterial({ vertexColors: true });
  private propMat = new MeshLambertMaterial({ vertexColors: true });
  private glowMat = new MeshBasicMaterial({ vertexColors: true });
  /** Lamp light on the ground: added on, only at night. */
  private poolMat = new MeshBasicMaterial({ vertexColors: true, transparent: true, opacity: 0, blending: AdditiveBlending, depthWrite: false, side: DoubleSide });
  readonly animals: Animals3D;
  readonly target = new Vector3();
  private look = new Vector3();
  dist = 24;
  /** 'top' = the tilted view from above; 'third' = behind my character; 'first' = through their eyes. */
  view: 'top' | 'third' | 'first' = 'top';
  /** Where 'third' / 'first' look (radians, 0 = north, clockwise). */
  yaw = 0;
  /** Distance behind the character in 'third'. */
  back = 7;
  private viewSet = '';
  private tier: Tier;
  private m = new Matrix4();
  private shadowR = 30;

  constructor(canvas: HTMLCanvasElement, tier: Tier) {
    this.tier = tier;
    this.renderer = new WebGLRenderer({ canvas, antialias: tier === 'high', powerPreference: 'high-performance', stencil: false });
    this.renderer.setPixelRatio(1);
    this.renderer.toneMapping = NeutralToneMapping;
    this.renderer.toneMappingExposure = 1.05;
    const shadows = tier !== 'low';
    if (shadows) {
      this.renderer.shadowMap.enabled = true;
      this.renderer.shadowMap.type = tier === 'high' ? PCFSoftShadowMap : PCFShadowMap; // soft edges only on strong screens
      this.sun.castShadow = true;
      const s = tier === 'high' ? 2048 : 1024;
      this.sun.shadow.mapSize.set(s, s);
      this.sun.shadow.bias = -0.0006;
      this.sun.shadow.normalBias = 0.03;
      this.sun.shadow.camera.near = 1; this.sun.shadow.camera.far = 120;
    }
    this.scene.background = this.bg;
    this.fog = new Fog(this.bg, 60, 160);
    this.scene.fog = this.fog;
    this.scene.add(this.hemi, this.sun, this.sun.target, this.lamp, this.chunks, this.portals);
    // Beyond the map edge: dark forest floor instead of empty sky.
    this.under = new Mesh(new PlaneGeometry(4000, 4000).rotateX(-Math.PI / 2), new MeshLambertMaterial({ color: 0x2e4a2a }));
    this.under.position.y = -0.8;
    this.scene.add(this.under);
    this.water = new Mesh(new PlaneGeometry(1, 1).rotateX(-Math.PI / 2),
      new MeshPhongMaterial({ color: 0x2f86b0, transparent: true, opacity: 0.72, shininess: 90, specular: 0x9fd4f0 }));
    this.water.position.y = -0.14;
    this.water.receiveShadow = shadows;
    this.scene.add(this.water);
    this.people = new People(this.scene, 512, shadows);
    this.animals = new Animals3D(this.scene, 128, shadows);
    this.shots = new InstancedMesh(new SphereGeometry(0.07, 6, 4), new MeshBasicMaterial({ color: 0xfff1a0 }), 256);
    this.shots.instanceMatrix.setUsage(DynamicDrawUsage);
    this.shots.count = 0; this.shots.frustumCulled = false;
    this.scene.add(this.shots);
    const inst = (g: BufferGeometry, color: number, n: number) => {
      const m = new InstancedMesh(g, new Lam({ color, flatShading: true }), n);
      m.instanceMatrix.setUsage(DynamicDrawUsage); m.count = 0; m.frustumCulled = false; m.castShadow = shadows;
      this.scene.add(m); return m;
    };
    this.cans = inst(new CylinderGeometry(0.09, 0.09, 0.17, 10).translate(0, 0.085, 0), 0xc4523f, 256);
    this.bushes = inst(new IcosahedronGeometry(0.52, 1).scale(1, 0.8, 1).translate(0, 0.38, 0), 0x3f7f37, 256);
    this.berries = inst(new IcosahedronGeometry(0.075, 0), 0xe0203a, 256 * 6);
    this.crates = inst(new CylinderGeometry(0.2, 0.2, 0.3, 4).rotateY(Math.PI / 4).translate(0, 0.15, 0), 0x9a7448, 128);
  }

  beginItems(): void { this.nCan = this.nBush = this.nCrate = 0; }
  item(x: number, z: number, type: number, id: number): void {
    const r = ((id * 2654435761) >>> 0) / 4294967296;
    this.m.compose(this.v3.set(x, 0, z), this.q.setFromEuler(this.eu.set(0, r * 6.28, 0)), this.s3.set(1, 1, 1));
    if (type === 1 && this.nCan < 256) {
      this.cans.setMatrixAt(this.nCan++, this.m);
    } else if (type === 2 && this.nBush < 256) {
      const b = this.nBush++;
      this.bushes.setMatrixAt(b, this.m);
      for (let k = 0; k < 6; k++) {
        const a = r * 6.28 + k * 1.05;
        this.m.makeTranslation(x + Math.cos(a) * 0.43, 0.32 + (k % 3) * 0.14, z + Math.sin(a) * 0.43);
        this.berries.setMatrixAt(b * 6 + k, this.m);
      }
    } else if (this.nCrate < 128) this.crates.setMatrixAt(this.nCrate++, this.m);
  }
  endItems(): void {
    this.cans.count = this.nCan; this.bushes.count = this.nBush; this.berries.count = this.nBush * 6; this.crates.count = this.nCrate;
    for (const m of [this.cans, this.bushes, this.berries, this.crates]) m.instanceMatrix.needsUpdate = true;
  }

  /** A new map: water covers it, old chunks and portals go. */
  setMap(w: number, h: number, portals: { x: number; y: number }[]): void {
    this.clearChunks();
    this.water.scale.set(w, 1, h); this.water.position.set(w / 2, -0.14, h / 2);
    for (const c of this.portals.children.slice()) { this.portals.remove(c); dispose(c as Mesh); }
    for (const p of portals) this.portals.add(portalMesh(p.x, p.y));
  }

  addChunk(ground: BufferGeometry, props: BufferGeometry | null, glow: BufferGeometry | null = null, pool: BufferGeometry | null = null): Group {
    const g = new Group();
    const gm = new Mesh(ground, this.groundMat);
    gm.receiveShadow = this.tier !== 'low';
    g.add(gm);
    if (props) {
      const pm = new Mesh(props, this.propMat);
      pm.castShadow = pm.receiveShadow = this.tier !== 'low';
      g.add(pm);
    }
    if (glow) g.add(new Mesh(glow, this.glowMat));
    if (pool) { const pm = new Mesh(pool, this.poolMat); pm.renderOrder = 2; g.add(pm); }
    this.chunks.add(g);
    return g;
  }
  removeChunk(g: Group): void {
    this.chunks.remove(g);
    for (const c of g.children) (c as Mesh).geometry.dispose();
  }
  clearChunks(): void { for (const g of this.chunks.children.slice()) this.removeChunk(g as Group); }

  beginShots(): void { this.nShots = 0; }
  shot(x: number, z: number): void {
    if (this.nShots >= 256) return;
    this.m.makeTranslation(x, 1.0, z);
    this.shots.setMatrixAt(this.nShots++, this.m);
  }
  endShots(): void { this.shots.count = this.nShots; this.shots.instanceMatrix.needsUpdate = true; }

  resize(w: number, h: number): void {
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
  }

  private readonly pv = new Vector3();
  /** Where world point (x, height h, z) is on the screen, in CSS pixels of the full-window canvas. False when off screen. */
  project(x: number, h: number, z: number, out: { x: number; y: number }): boolean {
    const v = this.pv.set(x, h, z).project(this.camera);
    if (v.z > 1 || v.x < -1.1 || v.x > 1.1 || v.y < -1.1 || v.y > 1.1) return false;
    out.x = (v.x + 1) / 2 * innerWidth; out.y = (1 - v.y) / 2 * innerHeight;
    return true;
  }

  /** How far a person sees in 'third' / 'first' (fog hides the rest: fewer chunks and shadows to draw). */
  get sight(): number { return (this.tier === 'low' ? 42 : this.tier === 'mid' ? 52 : 64) * this.distK; }
  /** Graphics settings (player's choice): view distance x0.7 / 1 / 1.4; fog 0 = off, else x1.6 light / 1 normal / 0.6 thick. */
  distK = 1;
  fogK = 1;
  private fogAt(near: number, far: number): void {
    if (!this.fogK) { this.fog.near = 1e5; this.fog.far = 1e6; return; }
    this.fog.near = near * this.fogK; this.fog.far = far * this.fogK;
  }
  /** Settings changed: the camera picks them up at the next frame. */
  settingsChanged(): void { this.viewSet = ''; }

  /** Camera follows target (x, z) smoothly; `snap` jumps there. */
  follow(x: number, z: number, dt: number, snap: boolean): void {
    this.target.set(x, 0, z);
    const k = snap ? 1 : 1 - Math.exp(-dt * (this.view === 'top' ? 6 : 14));
    this.look.x += (x - this.look.x) * k; this.look.z += (z - this.look.z) * k;
    let d = this.dist;
    if (this.view !== this.viewSet) {
      this.viewSet = this.view;
      const cam = this.camera;
      if (this.view === 'top') { cam.fov = 30; cam.near = 1; cam.far = 400; } else { cam.fov = this.view === 'first' ? 62 : 55; cam.near = 0.12; cam.far = this.sight * (this.fogK ? Math.max(1, this.fogK) : 1.6) + 6; }
      cam.updateProjectionMatrix();
    }
    let sx0 = this.look.x, sz0 = this.look.z;
    if (this.view === 'top') {
      this.camera.position.set(this.look.x, Math.sin(PITCH) * d, this.look.z + Math.cos(PITCH) * d);
      this.camera.lookAt(this.look.x, 0, this.look.z);
      this.fogAt(d * 1.6 * this.distK, d * 3.6 * this.distK);
    } else {
      // Forward on the ground: yaw 0 = north (-z).
      const fx = Math.sin(this.yaw), fz = -Math.cos(this.yaw);
      if (this.view === 'third') {
        const b = this.back;
        this.camera.position.set(this.look.x - fx * b, 1.4 + b * 0.42, this.look.z - fz * b);
        this.camera.lookAt(this.look.x + fx * 3, 1.1, this.look.z + fz * 3);
      } else {
        this.camera.position.set(this.look.x + fx * 0.18, 1.55, this.look.z + fz * 0.18);
        this.camera.lookAt(this.look.x + fx * 10, 0.9, this.look.z + fz * 10);
      }
      this.fogAt(this.sight * 0.35, this.sight);
      d = this.sight * 0.4;
      // Shadows where the eye is: a box ahead of the character.
      sx0 = this.look.x + fx * d * 0.8; sz0 = this.look.z + fz * d * 0.8;
    }
    // The shadow box moves with the camera (in whole texels, so shadows don't shimmer).
    if (this.sun.castShadow) {
      const r = (this.shadowR = Math.min(60, d * 1.15 + 6));
      const cam = this.sun.shadow.camera;
      if (cam.right !== r) { cam.left = -r; cam.right = r; cam.top = r; cam.bottom = -r; cam.updateProjectionMatrix(); }
    }
    const step = (this.shadowR * 2) / this.sun.shadow.mapSize.x;
    const sx = Math.round(sx0 / step) * step, sz = Math.round(sz0 / step) * step;
    this.sun.target.position.set(sx, 0, sz);
    this.sun.position.set(sx + this.sunDir.x * 50, this.sunDir.y * 50, sz + this.sunDir.z * 50);
    this.lamp.position.set(x, 2.2, z);
  }

  private sunDir = new Vector3(0.4, 0.8, 0.45).normalize();
  private c1 = new Color(); private c2 = new Color();

  /** Light for the hour of the day (0..24). */
  setHour(h: number, t: number): void {
    // day = 1 at noon, 0 at night, soft dawn (5-8) and dusk (18-21).
    const day = h < 5 || h > 21 ? 0 : h < 8 ? (h - 5) / 3 : h > 18 ? (21 - h) / 3 : 1;
    const warm = day > 0 && day < 1 ? Math.sin(day * Math.PI) : 0;
    // Sun travels east -> west over the south (the camera looks north, so shadows fall towards the viewer's top).
    const a = ((h - 6) / 12) * Math.PI;
    if (day > 0) this.sunDir.set(-Math.cos(a) * 0.8, Math.max(0.5, Math.sin(a)), 0.55).normalize();
    else this.sunDir.set(0.3, 0.8, 0.4).normalize(); // moon
    this.sun.intensity = day > 0 ? 0.5 + 2.0 * day : 0.45;
    this.sun.color.setHex(0x8ea8ff).lerp(this.c1.setHex(0xfff1d6), day).lerp(this.c2.setHex(0xffa060), warm * 0.7);
    // Seen from the side (third / first person) walls in their own shade show too: more sky light there.
    this.hemi.intensity = (0.35 + 0.8 * day) * (this.view === 'top' ? 1 : 1.5);
    this.hemi.color.setHex(0x30406a).lerp(this.c1.setHex(0xcfe3ff), day);
    this.hemi.groundColor.setHex(0x1c1a22).lerp(this.c1.setHex(0x5d4c3a), day);
    this.bg.setHex(0x0b1426).lerp(this.c1.setHex(0x9cc7e8), day).lerp(this.c2.setHex(0xe79a6a), warm * 0.6);
    this.lamp.intensity = (1 - day) * 9;
    this.poolMat.opacity = (1 - day) * 0.42; this.poolMat.visible = day < 0.98;
    // Portals breathe.
    const s = 1 + Math.sin(t * 2.5) * 0.06;
    for (const p of this.portals.children) { p.children[0]!.rotation.y = t * 0.8; p.children[1]!.scale.set(s, 1, s); }
  }

  render(): void { this.renderer.render(this.scene, this.camera); }

  dispose(): void {
    this.clearChunks();
    this.renderer.dispose();
  }
}

function portalMesh(x: number, y: number): Group {
  const g = new Group();
  g.position.set(x, 0, y);
  const ring = new Mesh(new TorusGeometry(1.3, 0.11, 8, 32), new MeshBasicMaterial({ color: 0x8ff0ff }));
  ring.position.y = 1.4;
  const glow = new Mesh(new CircleGeometry(2, 32).rotateX(-Math.PI / 2),
    new MeshBasicMaterial({ color: 0x4fd8ff, transparent: true, opacity: 0.45, blending: AdditiveBlending, depthWrite: false, side: DoubleSide }));
  glow.position.y = 0.05;
  g.add(ring, glow);
  return g;
}

function dispose(o: Mesh | Group): void {
  o.traverse((c) => { const m = c as Mesh; if (m.geometry) m.geometry.dispose(); });
}
