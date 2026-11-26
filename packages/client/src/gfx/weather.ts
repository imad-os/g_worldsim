import { BufferGeometry, Float32BufferAttribute, LineSegments, Points, ShaderMaterial, AdditiveBlending, NormalBlending, Vector3, type Scene } from 'three';

/**
 * Rain and snow (imad 2026-11-26): particles in a box round where the camera looks, moved entirely on the GPU (a time uniform and
 * a wrap in world space), so a TV pays no JavaScript per drop. Rain = short streaks (line segments), snow = soft round flakes
 * (points) that sway. The amount follows the weather's strength (draw range), nothing is rebuilt while it changes.
 */
const VS_RAIN = `
uniform float uT; uniform vec3 uC; uniform vec3 uB; uniform vec3 uV;
attribute float aEnd;
varying float vA;
void main() {
  vec3 p = position * uB + uV * uT - uC;
  p = mod(p, uB) + uC - uB * 0.5;
  p -= uV * 0.035 * aEnd;
  vA = 1.0 - aEnd * 0.7;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
}`;
const FS_RAIN = `
uniform float uO; varying float vA;
void main() { gl_FragColor = vec4(0.72, 0.8, 0.92, uO * vA); }`;
const VS_SNOW = `
uniform float uT; uniform vec3 uC; uniform vec3 uB; uniform vec3 uV; uniform float uS;
void main() {
  vec3 p = position * uB + uV * uT - uC;
  p.x += sin(uT * 1.3 + position.y * 40.0) * 0.5;
  p.z += cos(uT * 1.1 + position.x * 40.0) * 0.4;
  p = mod(p, uB) + uC - uB * 0.5;
  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  gl_PointSize = min(14.0, uS * (0.6 + fract(position.z * 91.0) * 0.8) / max(1.0, -mv.z)); // capped: no big blended squares near the camera (fill rate)
  gl_Position = projectionMatrix * mv;
}`;
const FS_SNOW = `
uniform float uO;
void main() {
  vec2 d = gl_PointCoord - 0.5;
  float a = smoothstep(0.5, 0.15, length(d));
  gl_FragColor = vec4(1.0, 1.0, 1.0, a * uO);
}`;

export class Precip {
  private rain: LineSegments;
  private snow: Points;
  private rainMat: ShaderMaterial;
  private snowMat: ShaderMaterial;
  private readonly n: number;
  private t = 0;
  private center = new Vector3();
  constructor(scene: Scene, tier: 'low' | 'mid' | 'high') {
    this.n = tier === 'low' ? 450 : tier === 'mid' ? 1000 : 1800; // low-end TVs: few drops, each a 1-pixel line or a small point
    const box = new Vector3(44, 20, 44);
    // Rain: two vertices per drop at the same place, the second marked as the streak's tail.
    const rp = new Float32Array(this.n * 6), re = new Float32Array(this.n * 2);
    let seed = 7;
    const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
    for (let k = 0; k < this.n; k++) {
      const x = rnd(), y = rnd(), z = rnd();
      rp.set([x, y, z, x, y, z], k * 6); re[k * 2] = 0; re[k * 2 + 1] = 1;
    }
    const rg = new BufferGeometry();
    rg.setAttribute('position', new Float32BufferAttribute(rp, 3));
    rg.setAttribute('aEnd', new Float32BufferAttribute(re, 1));
    const uni = () => ({ uT: { value: 0 }, uC: { value: this.center }, uB: { value: box }, uV: { value: new Vector3() }, uO: { value: 0.5 }, uS: { value: 60 } });
    this.rainMat = new ShaderMaterial({ uniforms: uni(), vertexShader: VS_RAIN, fragmentShader: FS_RAIN, transparent: true, depthWrite: false, blending: NormalBlending });
    this.rain = new LineSegments(rg, this.rainMat);
    const sp = new Float32Array(this.n * 3);
    for (let k = 0; k < this.n * 3; k++) sp[k] = rnd();
    const sg = new BufferGeometry();
    sg.setAttribute('position', new Float32BufferAttribute(sp, 3));
    this.snowMat = new ShaderMaterial({ uniforms: uni(), vertexShader: VS_SNOW, fragmentShader: FS_SNOW, transparent: true, depthWrite: false, blending: AdditiveBlending });
    this.snow = new Points(sg, this.snowMat);
    for (const o of [this.rain, this.snow]) { o.frustumCulled = false; o.visible = false; o.renderOrder = 5; scene.add(o); }
  }
  /** kind: 0 none, 1 rain, 2 storm rain, 3 snow, 4 blizzard; k = strength 0..1; (x, z) = where the camera looks; dark = night 0..1. */
  update(dt: number, kind: number, k: number, x: number, z: number, dark: number): void {
    this.t += dt;
    this.center.set(x, 9, z);
    const rainy = kind === 1 || kind === 2, snowy = kind === 3 || kind === 4;
    this.rain.visible = rainy && k > 0.02;
    this.snow.visible = snowy && k > 0.02;
    if (rainy) {
      const u = this.rainMat.uniforms;
      u.uT!.value = this.t;
      (u.uV!.value as Vector3).set(kind === 2 ? 4 : 1.2, -17, kind === 2 ? 1.5 : 0.4);
      u.uO!.value = (0.32 + 0.25 * k) * (1 - dark * 0.45);
      this.rain.geometry.setDrawRange(0, Math.round(this.n * Math.min(1, 0.25 + k * (kind === 2 ? 1 : 0.8))) * 2);
    }
    if (snowy) {
      const u = this.snowMat.uniforms;
      u.uT!.value = this.t;
      (u.uV!.value as Vector3).set(kind === 4 ? 5 : 0.5, kind === 4 ? -3.5 : -1.3, kind === 4 ? 2 : 0.3);
      u.uO!.value = (0.55 + 0.35 * k) * (1 - dark * 0.5);
      u.uS!.value = innerHeight * 0.05;
      this.snow.geometry.setDrawRange(0, Math.round(this.n * Math.min(1, 0.25 + k * (kind === 4 ? 1 : 0.75))));
    }
  }
}
