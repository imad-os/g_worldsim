import {
  Scene, PerspectiveCamera, HemisphereLight, DirectionalLight, Fog, Color, Group, InstancedMesh, Matrix4, Quaternion, Euler, Vector3,
  CylinderGeometry, IcosahedronGeometry, ConeGeometry, PlaneGeometry, CircleGeometry, MeshLambertMaterial, MeshBasicMaterial, Mesh,
  Points, PointsMaterial, BufferGeometry, Float32BufferAttribute, type WebGLRenderer,
} from 'three';
import { People, type PersonLook } from './people.js';
import { Horses3D } from './horses.js';

/**
 * The ride between two maps (imad 2026-11-25: "in travel it should be an animation: the player rides the horse and it runs
 * to the destination"). Its own small scene drawn with the world's renderer while my character is on the road on horseback:
 * my horse (the same animated CC0 model, coat and quality glow) galloping along a forest road, me in the saddle, trees,
 * rocks and grass streaming past, dust from the hooves, the camera sweeping slowly round from behind to the side.
 * The world does not move: the props do (three copies of one stretch of road, slid back and wrapped).
 */
const L = 90; // one stretch of road, metres
const SPEED = 9.5; // gallop, m/s
const ROAD = 3.4; // road half width

export class RideScene {
  readonly scene = new Scene();
  readonly camera = new PerspectiveCamera(50, 16 / 9, 0.3, 160);
  private readonly people: People;
  private readonly horses: Horses3D;
  private readonly props = new Group();
  private readonly dust: Points;
  private readonly dustAge = new Float32Array(40);
  private readonly dustPos: Float32Array;
  private t = 0;

  constructor(src: Horses3D) {
    const sky = new Color(0xa8d2ef);
    this.scene.background = sky;
    this.scene.fog = new Fog(sky, 30, 85);
    this.scene.add(new HemisphereLight(0xdcefff, 0x4a6a2e, 1.15));
    const sun = new DirectionalLight(0xfff1d6, 1.6); sun.position.set(-20, 30, 10); this.scene.add(sun);
    this.people = new People(this.scene, 2, false);
    this.horses = new Horses3D(this.scene, false, 1);
    this.horses.share(src);
    // Ground and road (still), with soft verges.
    const ground = new Mesh(new PlaneGeometry(400, 400).rotateX(-Math.PI / 2), new MeshLambertMaterial({ color: 0x5f9c3f }));
    ground.position.y = -0.02; this.scene.add(ground);
    const road = new Mesh(new PlaneGeometry(ROAD * 2, 400).rotateX(-Math.PI / 2), new MeshLambertMaterial({ color: 0x9c7f55 }));
    this.scene.add(road);
    for (const s of [-1, 1]) {
      const verge = new Mesh(new PlaneGeometry(1.1, 400).rotateX(-Math.PI / 2), new MeshLambertMaterial({ color: 0x86804f }));
      verge.position.set(s * (ROAD + 0.5), 0.005, 0); this.scene.add(verge);
    }
    const blob = new Mesh(new CircleGeometry(1, 20).rotateX(-Math.PI / 2).scale(0.7, 1, 1.35), new MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.25, depthWrite: false }));
    blob.position.y = 0.02; this.scene.add(blob);
    // Props along one stretch, copied 3 times (behind, here, ahead).
    let seed = 7;
    const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
    const trees: [number, number, number, number][] = [], rocks: [number, number, number][] = [], tufts: [number, number][] = [], ruts: [number, number][] = [];
    for (let z = 0; z < L; z += 2.2) {
      for (const s of [-1, 1]) {
        if (rnd() < 0.72) trees.push([s * (ROAD + 3 + rnd() * 5), z + rnd() * 2, 0.8 + rnd() * 0.6, rnd()]);
        if (rnd() < 0.55) trees.push([s * (ROAD + 9 + rnd() * 14), z + rnd() * 2, 0.9 + rnd() * 0.7, rnd()]);
        if (rnd() < 0.18) rocks.push([s * (ROAD + 1.4 + rnd() * 3), z + rnd() * 2, 0.25 + rnd() * 0.45]);
        for (let k = 0; k < 3; k++) tufts.push([s * (ROAD + 0.8 + rnd() * 10), z + rnd() * 2.2]);
      }
      if (rnd() < 0.5) ruts.push([(rnd() - 0.5) * ROAD * 1.4, z + rnd() * 2]);
    }
    const m = new Matrix4(), q = new Quaternion(), e = new Euler(), v = new Vector3(), sc = new Vector3();
    const put = (mesh: InstancedMesh, k: number, x: number, y: number, z: number, ry: number, sx: number, sy: number, sz: number) => {
      q.setFromEuler(e.set(0, ry, 0)); m.compose(v.set(x, y, z), q, sc.set(sx, sy, sz)); mesh.setMatrixAt(k, m);
    };
    const leafMat = new MeshLambertMaterial({ color: 0xffffff, flatShading: true });
    const trunk = new InstancedMesh(new CylinderGeometry(0.1, 0.17, 1, 6).translate(0, 0.5, 0), new MeshLambertMaterial({ color: 0x6b4a2e }), trees.length * 3);
    const leaf = new InstancedMesh(new IcosahedronGeometry(1, 1), leafMat, trees.length * 6);
    const rock = new InstancedMesh(new IcosahedronGeometry(1, 0), new MeshLambertMaterial({ color: 0x8a8580, flatShading: true }), rocks.length * 3);
    const tuft = new InstancedMesh(new ConeGeometry(0.06, 0.38, 3, 1, true).translate(0, 0.19, 0), new MeshLambertMaterial({ color: 0x4f8a32 }), tufts.length * 3);
    const rut = new InstancedMesh(new CircleGeometry(0.5, 7).rotateX(-Math.PI / 2), new MeshLambertMaterial({ color: 0x86693f }), ruts.length * 3);
    const greens = [0x3f7f37, 0x4c8c3a, 0x386f31, 0x5a9440].map((c) => new Color(c));
    let nt = 0, nl = 0, nr = 0, ng = 0, nu = 0;
    for (let c = -1; c <= 1; c++) {
      const oz = c * L;
      for (const [x, z, s, r] of trees) {
        const th = 1.6 * s;
        put(trunk, nt++, x, 0, z + oz, r * 6, s * 1.4, th, s * 1.4);
        const g = greens[Math.floor(r * 4) % 4]!;
        leaf.setColorAt(nl, g); put(leaf, nl++, x, th + 0.5 * s * 1.3, z + oz, r * 3, 0.95 * s * 1.3, 0.8 * s * 1.3, 0.95 * s * 1.3);
        leaf.setColorAt(nl, g.clone().multiplyScalar(1.12)); put(leaf, nl++, x + (r - 0.5) * 0.5 * s, th + 1.05 * s * 1.3, z + oz + 0.2, r * 5, 0.62 * s * 1.3, 0.55 * s * 1.3, 0.62 * s * 1.3);
      }
      for (const [x, z, s] of rocks) put(rock, nr++, x, s * 0.35, z + oz, x * 3, s, s * 0.7, s * 1.1);
      for (const [x, z] of tufts) put(tuft, ng++, x, 0, z + oz, x * 7 + z, 1, 0.8 + ((x * 13 + z) % 1 + 1) % 1 * 0.6, 1);
      for (const [x, z] of ruts) put(rut, nu++, x, 0.012, z + oz, 0, 1.2, 1, 2.2);
    }
    for (const im of [trunk, leaf, rock, tuft, rut]) { im.instanceMatrix.needsUpdate = true; im.frustumCulled = false; this.props.add(im); }
    if (leaf.instanceColor) leaf.instanceColor.needsUpdate = true;
    this.scene.add(this.props);
    // Dust kicked up by the hooves.
    this.dustPos = new Float32Array(this.dustAge.length * 3);
    const dg = new BufferGeometry(); dg.setAttribute('position', new Float32BufferAttribute(this.dustPos, 3));
    this.dust = new Points(dg, new PointsMaterial({ color: 0xcdb48a, size: 0.35, transparent: true, opacity: 0.55, depthWrite: false }));
    this.dust.frustumCulled = false;
    this.dustAge.fill(9);
    this.scene.add(this.dust);
  }

  /**
   * One frame. p = how far along the ride (0..1), look / gear = my character, horse = my horse's look; aspect = the screen.
   */
  draw(r: WebGLRenderer, dt: number, p: number, look: PersonLook, gear: number, horse: { q: number; coat: number; scale: number }, aspect: number): void {
    this.t += dt;
    const t = this.t;
    this.props.position.z = -((t * SPEED) % L);
    // Horse and rider in the middle of the road, a little bob and sway.
    const sway = Math.sin(t * 0.7) * 0.35;
    this.horses.begin();
    this.horses.add(1, sway, 0, 0, SPEED, 9, horse.scale, horse.q, horse.coat, true, t, dt);
    this.horses.end();
    this.people.begin();
    this.people.add(sway, 0, 0, t * 6, 0.2, look, false, 1, false, gear, t, this.horses.seat(horse.scale));
    this.people.end();
    // Dust: little puffs from the hooves, drifting back and fading.
    for (let k = 0; k < this.dustAge.length; k++) {
      this.dustAge[k] = this.dustAge[k]! + dt;
      if (this.dustAge[k]! > 1.1) { this.dustAge[k] = Math.random() * 0.2; this.dustPos[k * 3] = sway + (Math.random() - 0.5) * 0.9; this.dustPos[k * 3 + 1] = 0.08; this.dustPos[k * 3 + 2] = -0.6 + (Math.random() - 0.5) * 1.6; }
      this.dustPos[k * 3 + 1] = this.dustPos[k * 3 + 1]! + dt * 0.55;
      this.dustPos[k * 3 + 2] = this.dustPos[k * 3 + 2]! - dt * SPEED * 0.35;
    }
    (this.dust.geometry.getAttribute('position') as Float32BufferAttribute).needsUpdate = true;
    // Camera: from behind and above, sweeping round to the side as the ride goes on.
    const s = p * p * (3 - 2 * p), a = Math.PI * (0.86 - 0.42 * s), d = 7.5 - 1.5 * s, h = 3.4 - 1.1 * s;
    this.camera.aspect = aspect; this.camera.updateProjectionMatrix();
    this.camera.position.set(Math.sin(a) * d + sway * 0.5, h, Math.cos(a) * d);
    this.camera.lookAt(sway * 0.6, 1.7, 2.2);
    r.render(this.scene, this.camera);
  }
}
