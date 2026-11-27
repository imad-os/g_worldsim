import {
  BufferGeometry, Float32BufferAttribute, LatheGeometry, SphereGeometry, CylinderGeometry, BoxGeometry, ConeGeometry, IcosahedronGeometry,
  Vector2, MeshLambertMaterial, type Material,
} from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

/**
 * The pieces of a person (imad 2026-11-27: "better body shapes, hair"), each built round its own joint so gfx/people.ts can
 * bend it: torso from the hips up (a man's and a woman's shape), head + neck from the neck (eyes, nose, ears), upper arm from
 * the shoulder, forearm + hand from the elbow, thigh from the hip, shin + shoe from the knee. All hair styles and beards are ONE
 * geometry: each vertex knows its style (`part`) and the vertex shader folds away the ones a person doesn't wear, so every hair
 * style on screen is a single draw call. `tone` per vertex: 0 = the instance colour, 1 = the second instance colour (`color2`:
 * the hand under a sleeve), 2 = dark (eyes, brows, shoe soles).
 *
 * Units are the body's own (people.ts scales by 1.25): hips at 0.52 over the ground, shoulders 1.04, eyes 1.30.
 */
export const HIP_Y = 0.52, THIGH = 0.25, SHIN = 0.25, SOLE = 0.02, SHOULDER_Y = 0.52, SHOULDER_X = 0.205, UPPER = 0.21, FORE = 0.2, NECK_Y = 0.585;

function tag(g: BufferGeometry, attr: string, v: number): BufferGeometry {
  const n = g.attributes.position!.count;
  g.setAttribute(attr, new Float32BufferAttribute(new Float32Array(n).fill(v), 1));
  return g;
}
function clean(g: BufferGeometry): BufferGeometry { // only what we use, so every piece merges
  for (const k of Object.keys(g.attributes)) if (k !== 'position' && k !== 'normal') g.deleteAttribute(k);
  return g.index ? g.toNonIndexed() : g;
}
function merge(parts: [BufferGeometry, number][], attr = 'tone'): BufferGeometry {
  return mergeGeometries(parts.map(([g, v]) => tag(clean(g), attr, v)), false)!;
}
const lathe = (pts: [number, number][], seg: number, zs: number) => new LatheGeometry(pts.map(([r, y]) => new Vector2(r, y)), seg).scale(1, 1, zs);

/** Torso, hips at y 0: a man's (wide shoulders) or a woman's (waist, hips, a tunic flaring a little at the hem). */
export function torsoGeo(woman: boolean, lo: boolean): BufferGeometry {
  const seg = lo ? 7 : 12;
  const pts: [number, number][] = woman
    ? [[0.001, -0.1], [0.2, -0.09], [0.205, -0.02], [0.195, 0.08], [0.15, 0.24], [0.17, 0.36], [0.18, 0.44], [0.17, 0.5], [0.15, 0.545], [0.06, 0.59], [0.001, 0.59]]
    : [[0.001, -0.04], [0.17, -0.03], [0.188, 0.06], [0.172, 0.2], [0.195, 0.36], [0.215, 0.46], [0.205, 0.52], [0.16, 0.565], [0.07, 0.6], [0.001, 0.6]];
  const body = lathe(pts, seg, 0.68);
  const parts: [BufferGeometry, number][] = [[body, 0]];
  if (!lo) {
    const belt = new CylinderGeometry(woman ? 0.155 : 0.18, woman ? 0.155 : 0.18, 0.035, seg).scale(1, 1, 0.7).translate(0, woman ? 0.24 : 0.12, 0);
    parts.push([belt, 2]);
  }
  return merge(parts);
}

/** Head and neck, the neck's base at y 0. */
export function headGeo(lo: boolean): BufferGeometry {
  const neck = new CylinderGeometry(0.055, 0.062, 0.12, lo ? 5 : 8).translate(0, 0.05, 0);
  const skull = new SphereGeometry(0.15, lo ? 8 : 12, lo ? 5 : 8).scale(0.9, 1.08, 0.98).translate(0, 0.2, 0);
  if (lo) return merge([[neck, 0], [skull, 0]]);
  const nose = new ConeGeometry(0.022, 0.06, 5).rotateX(Math.PI / 2 + 0.35).translate(0, 0.19, 0.155);
  const parts: [BufferGeometry, number][] = [[neck, 0], [skull, 0], [nose, 0]];
  for (const s of [-1, 1]) {
    parts.push([new SphereGeometry(0.019, 5, 3).scale(1, 1.1, 0.6).translate(s * 0.052, 0.225, 0.133), 2]); // eyes
    parts.push([new BoxGeometry(0.05, 0.012, 0.02).rotateZ(-s * 0.12).translate(s * 0.055, 0.262, 0.135), 2]); // brows
    parts.push([new SphereGeometry(0.035, 5, 3).scale(0.5, 1, 0.8).translate(s * 0.138, 0.2, 0), 0]); // ears
  }
  return merge(parts);
}

/** Upper arm from the shoulder down (sleeve colour), a round shoulder on top. */
export function upperArmGeo(lo: boolean): BufferGeometry {
  const s = lo ? 5 : 8;
  return merge([[new SphereGeometry(0.064, s, lo ? 3 : 4).translate(0, -0.01, 0), 0], [new CylinderGeometry(0.066, 0.055, UPPER, s).translate(0, -UPPER / 2, 0), 0]]);
}
/** Forearm from the elbow (sleeve) and the hand at its end (skin = colour 2). */
export function foreArmGeo(lo: boolean): BufferGeometry {
  const s = lo ? 5 : 8;
  const parts: [BufferGeometry, number][] = [[new SphereGeometry(0.056, s, 3), 0], [new CylinderGeometry(0.055, 0.042, FORE - 0.02, s).translate(0, -(FORE - 0.02) / 2, 0), 0],
    [new SphereGeometry(0.047, lo ? 5 : 6, lo ? 3 : 4).scale(0.85, 1.15, 0.7).translate(0, -FORE - 0.025, 0.005), 1]];
  if (!lo) parts.push([new SphereGeometry(0.02, 4, 2).scale(1, 1.6, 1).translate(0.035, -FORE - 0.005, 0.03), 1]); // thumb
  return merge(parts);
}
/** Thigh from the hip down (trousers). */
export function thighGeo(lo: boolean): BufferGeometry {
  const s = lo ? 5 : 8;
  return merge([[new SphereGeometry(0.088, s, lo ? 3 : 4).translate(0, -0.01, 0), 0], [new CylinderGeometry(0.088, 0.066, THIGH, s).translate(0, -THIGH / 2, 0), 0]]);
}
/** Shin from the knee (trousers) and the shoe (dark). */
export function shinGeo(lo: boolean): BufferGeometry {
  const s = lo ? 5 : 8;
  const parts: [BufferGeometry, number][] = [[new SphereGeometry(0.066, s, 3), 0], [new CylinderGeometry(0.064, 0.05, SHIN - 0.04, s).translate(0, -(SHIN - 0.04) / 2, 0), 0],
    [new BoxGeometry(0.095, 0.065, 0.19).translate(0, -SHIN + 0.015, 0.035), 2]];
  if (!lo) parts.push([new SphereGeometry(0.048, 5, 3).scale(1, 0.7, 1).translate(0, -SHIN + 0.03, 0.12), 2]); // round toe
  return merge(parts);
}

/** Hair styles drawn over the shared cap. */
export const CAP = 20, CAPPED = [true, false, true, false, true, true, true, false];
/** Hair style parts 0-7 (protocol look.ts HAIR_STYLES; 7 bald = nothing) and beards 9-11 (BEARDS 1-3 + 8), round the head (neck base at 0). */
export function hairGeo(lo: boolean): BufferGeometry {
  const hs = lo ? 6 : 10, cy = 0.2, hr = lo ? 3 : 5;
  const cap = (r: number, theta: number, back = 0) => new SphereGeometry(r, hs, hr, 0, Math.PI * 2, 0, theta).rotateX(-0.32).scale(0.95, 1.04, 1.02).translate(0, cy + 0.01, -0.012 - back);
  const parts: [BufferGeometry, number][] = [];
  const add = (g: BufferGeometry, style: number) => parts.push([g, style]);
  // 20 = the cap most styles share (short, swept, long, ponytail, bun: `ilook.z` 1)
  add(cap(0.162, Math.PI * 0.52), CAP);
  // 0 short: the cap, a little lower at the back
 add(new SphereGeometry(0.155, hs, 2, Math.PI * 1.15, Math.PI * 0.7, Math.PI * 0.45, Math.PI * 0.18).translate(0, cy, -0.01), 0);
  // 1 crop: close to the head
  add(cap(0.155, Math.PI * 0.42), 1);
  // 2 swept: a cap and a swept fringe over one side of the forehead
  add(new SphereGeometry(0.1, 6, 3).scale(1.2, 0.45, 0.6).rotateZ(-0.35).translate(0.04, cy + 0.12, 0.1), 2);
  // 3 curly: a big round mop (the facets read as curls)
  add(new IcosahedronGeometry(0.185, lo ? 0 : 1).scale(1, 0.88, 0.95).translate(0, cy + 0.075, -0.055), 3);
  // 4 long: a cap and hair down the back to the shoulders
  add(new CylinderGeometry(0.15, 0.17, 0.3, hs, 1, true, Math.PI * 0.4, Math.PI * 1.2).scale(1, 1, 0.85).translate(0, cy - 0.09, -0.02), 4);
  // 5 ponytail: a cap and a tail at the back
  add(new ConeGeometry(0.05, 0.26, 5).rotateX(Math.PI + 0.35).translate(0, cy - 0.04, -0.17), 5);
  add(new SphereGeometry(0.045, 5, 3).translate(0, cy + 0.07, -0.155), 5);
  // 6 bun: a cap and a bun on top at the back
  add(new SphereGeometry(0.07, 6, 4).translate(0, cy + 0.15, -0.09), 6);
  // beards: 9 moustache, 10 short, 11 full (8 + BEARDS index)
  add(new BoxGeometry(0.075, 0.018, 0.03).translate(0, cy - 0.055, 0.15), 9);
  add(new SphereGeometry(0.12, 7, 3, Math.PI * 0.12, Math.PI * 0.76, Math.PI * 0.62, Math.PI * 0.24).scale(1, 1.1, 1.04).translate(0, cy - 0.03, 0.015), 10);
  add(new BoxGeometry(0.075, 0.018, 0.03).translate(0, cy - 0.055, 0.15), 10);
  add(new SphereGeometry(0.126, 7, 4, Math.PI * 0.08, Math.PI * 0.84, Math.PI * 0.6, Math.PI * 0.3).scale(1, 1.15, 1.08).translate(0, cy - 0.03, 0.015), 11);
  add(new BoxGeometry(0.08, 0.02, 0.03).translate(0, cy - 0.055, 0.155), 11);
  // SphereGeometry's phi starts at -x and goes round through +z: front-facing pieces above use phiStart round PI * 0.12.
  return merge(parts, 'part');
}

/**
 * Lambert with two instance colours and a dark tone (`tone`), or (hair) styles folded away unless the instance wears them
 * (`ilook` = [hair style, beard part]). Only the colour / position chunks change, so shadows and fog work as usual.
 */
export function personMat(kind: 'tone' | 'hair'): Material {
  const m = new MeshLambertMaterial({ color: 0xffffff });
  m.onBeforeCompile = (sh) => {
    if (kind === 'tone') {
      sh.vertexShader = sh.vertexShader
        .replace('#include <common>', '#include <common>\nattribute float tone;\nattribute vec3 color2;')
        .replace('#include <color_vertex>', `#include <color_vertex>
#ifdef USE_INSTANCING_COLOR
  vColor.xyz = tone < 0.5 ? instanceColor.xyz : (tone < 1.5 ? color2 : vec3(0.13, 0.1, 0.085));
#endif`);
    } else {
      sh.vertexShader = sh.vertexShader
        .replace('#include <common>', '#include <common>\nattribute float part;\nattribute vec3 ilook;')
        .replace('#include <begin_vertex>', `#include <begin_vertex>
  if (abs(part - ilook.x) > 0.5 && abs(part - ilook.y) > 0.5 && (part < 19.5 || ilook.z < 0.5)) transformed = vec3(0.0, 0.2, 0.0);`);
    }
  };
  m.customProgramCacheKey = () => 'person-' + kind;
  return m;
}
