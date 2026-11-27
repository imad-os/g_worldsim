// Prepares the wild animals' 3D models from CC0 sources (imad 2026-11-27: "the bears, wolves, rabbits and deer are bad 3D models").
//   sh tools/assets/fetch.sh                      (once: the source models into .cache/assets)
//   npm i --no-save @gltf-transform/core@4 @gltf-transform/functions@4 @gltf-transform/extensions@4 pngjs@7 jpeg-js@0.4
//   node tools/assets/build-animals.mjs [wolf deer stag rabbit bear]
// Writes docs/models/<name>.glb: one skinned mesh per animal (all its parts merged into one draw call, colours as vertex colours,
// or the fur texture for the bear), only the animations the game plays (short names), keyframes resampled, mesh quantized.
// The bear had no skeleton: it is rigged here (hips, chest, head, 4 legs) and its moves are made here (Idle, Walk, Gallop,
// Eating, Attack). Credits: docs/models/CREDITS.md.
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { prune, resample, dedup, quantize, weld } from '@gltf-transform/functions';
import { PNG } from 'pngjs';
import jpeg from 'jpeg-js';

const root = resolve(new URL('../..', import.meta.url).pathname);
const Q = root + '/.cache/assets/quaternius-animals/models/glTF/';
const O = root + '/.cache/assets/oga-animals/files/converted/';
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS);

const lin = (c) => { c /= 255; return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); };
const hex = (h) => [lin((h >> 16) & 255), lin((h >> 8) & 255), lin(h & 255)];

/**
 * All the skinned meshes of the model -> one mesh with one primitive (vertex colours from each part's material colour,
 * `colors[materialName]` overrides it), on the first mesh node; `inset[materialName]` pulls a part in along its normals
 * (a body under a fur shell would flicker through it); `drop` = mesh names left out.
 */
function mergeParts(doc, { colors = {}, inset = {}, drop = [] } = {}) {
  const nodes = doc.getRoot().listNodes().filter((n) => n.getMesh());
  const keep = nodes.filter((n) => n.getSkin() && !drop.includes(n.getMesh().getName()));
  const skin = keep[0].getSkin();
  const P = [], N = [], J = [], W = [], C = [], I = [];
  const v = [0, 0, 0, 0];
  for (const n of keep) {
    if (n.getSkin() !== skin) throw new Error('parts with different skins');
    for (const p of n.getMesh().listPrimitives()) {
      const m = p.getMaterial(), name = m?.getName() ?? '';
      const col = colors[name] != null ? hex(colors[name]) : (m?.getBaseColorFactor() ?? [1, 1, 1]).slice(0, 3);
      const pos = p.getAttribute('POSITION'), nor = p.getAttribute('NORMAL'), jo = p.getAttribute('JOINTS_0'), we = p.getAttribute('WEIGHTS_0');
      const base = P.length / 3, k = inset[name] ?? 0;
      for (let i = 0; i < pos.getCount(); i++) {
        const q = pos.getElement(i, [0, 0, 0]), nn = nor.getElement(i, [0, 0, 0]);
        P.push(q[0] - nn[0] * k, q[1] - nn[1] * k, q[2] - nn[2] * k); N.push(...nn);
        J.push(...jo.getElement(i, v.slice())); W.push(...we.getElement(i, v.slice())); C.push(...col);
      }
      const idx = p.getIndices();
      if (idx) for (let i = 0; i < idx.getCount(); i++) I.push(base + idx.getScalar(i));
      else for (let i = 0; i < pos.getCount(); i++) I.push(base + i);
    }
  }
  // Parts that are not skinned but hang from a bone (the stag's antlers on its head): moved into the mesh's space, all on that bone.
  const joints = skin.listJoints(), inv = invert(keep[0].getWorldMatrix());
  for (const n of nodes) {
    if (n.getSkin() || drop.includes(n.getMesh().getName())) continue;
    let b = n.getParentNode();
    while (b && !joints.includes(b)) b = b.getParentNode();
    if (!b) continue;
    const T = mul(inv, n.getWorldMatrix()), ji = joints.indexOf(b);
    for (const p of n.getMesh().listPrimitives()) {
      const m = p.getMaterial(), name = m?.getName() ?? '';
      const col = colors[name] != null ? hex(colors[name]) : (m?.getBaseColorFactor() ?? [1, 1, 1]).slice(0, 3);
      const pos = p.getAttribute('POSITION'), nor = p.getAttribute('NORMAL'), base = P.length / 3;
      for (let i = 0; i < pos.getCount(); i++) {
        const q = pos.getElement(i, [0, 0, 0]), nn = nor.getElement(i, [0, 0, 0]);
        P.push(...apply(T, q, 1)); const r = apply(T, nn, 0), l = Math.hypot(...r) || 1; N.push(r[0] / l, r[1] / l, r[2] / l);
        J.push(ji, 0, 0, 0); W.push(1, 0, 0, 0); C.push(...col);
      }
      const idx = p.getIndices();
      if (idx) for (let i = 0; i < idx.getCount(); i++) I.push(base + idx.getScalar(i));
      else for (let i = 0; i < pos.getCount(); i++) I.push(base + i);
    }
  }
  const buf = doc.getRoot().listBuffers()[0];
  const acc = (type, arr) => doc.createAccessor().setType(type).setArray(arr).setBuffer(buf);
  const mat = doc.createMaterial('Main').setBaseColorFactor([1, 1, 1, 1]).setRoughnessFactor(1).setMetallicFactor(0);
  const prim = doc.createPrimitive()
    .setAttribute('POSITION', acc('VEC3', new Float32Array(P))).setAttribute('NORMAL', acc('VEC3', new Float32Array(N)))
    .setAttribute('JOINTS_0', acc('VEC4', new Uint16Array(J))).setAttribute('WEIGHTS_0', acc('VEC4', new Float32Array(W)))
    .setAttribute('COLOR_0', acc('VEC3', new Float32Array(C)))
    .setIndices(acc('SCALAR', P.length / 3 < 65536 ? new Uint16Array(I) : new Uint32Array(I)))
    .setMaterial(mat);
  const mesh = doc.createMesh('Animal').addPrimitive(prim);
  const old = new Set(nodes.map((n) => n.getMesh()));
  keep[0].setMesh(mesh).setName('Animal');
  for (const n of nodes) if (n !== keep[0]) n.dispose();
  for (const m of old) m.dispose();
}

// Column-major 4x4 matrices (glTF order).
function mul(a, b) { const o = new Array(16).fill(0); for (let c = 0; c < 4; c++) for (let r = 0; r < 4; r++) for (let k = 0; k < 4; k++) o[c * 4 + r] += a[k * 4 + r] * b[c * 4 + k]; return o; }
function apply(m, v, w) { return [0, 1, 2].map((r) => m[r] * v[0] + m[4 + r] * v[1] + m[8 + r] * v[2] + m[12 + r] * w); }
function invert(m) { // general 4x4 inverse (Gauss-Jordan)
  const a = [0, 1, 2, 3].map((r) => [0, 1, 2, 3].map((c) => m[c * 4 + r]).concat([0, 1, 2, 3].map((c) => (c === r ? 1 : 0))));
  for (let c = 0; c < 4; c++) {
    let p = c; for (let r = c + 1; r < 4; r++) if (Math.abs(a[r][c]) > Math.abs(a[p][c])) p = r;
    [a[c], a[p]] = [a[p], a[c]];
    const d = a[c][c]; for (let k = 0; k < 8; k++) a[c][k] /= d;
    for (let r = 0; r < 4; r++) if (r !== c) { const f = a[r][c]; for (let k = 0; k < 8; k++) a[r][k] -= f * a[c][k]; }
  }
  const o = new Array(16); for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) o[c * 4 + r] = a[r][4 + c]; return o;
}

/** Keep only these animations, renamed: { NewName: 'name in the file (after the last |)' }. */
function keepClips(doc, map) {
  const want = new Map(Object.entries(map).map(([k, v]) => [v, k]));
  for (const a of doc.getRoot().listAnimations()) {
    const short = a.getName().split('|').pop();
    if (want.has(short)) { a.setName(want.get(short)); want.delete(short); } else { a.listChannels().forEach((c) => c.dispose()); a.listSamplers().forEach((x) => x.dispose()); a.dispose(); }
  }
  if (want.size) throw new Error('missing clips: ' + [...want.keys()].join(', '));
}

/** Drop animation channels that never move their bone away from its rest pose (most scale and translation tracks). */
function dropStill(doc) {
  let n = 0;
  for (const a of doc.getRoot().listAnimations()) for (const c of a.listChannels()) {
    const node = c.getTargetNode(), path = c.getTargetPath(), out = c.getSampler().getOutput();
    const rest = path === 'translation' ? node.getTranslation() : path === 'rotation' ? node.getRotation() : path === 'scale' ? node.getScale() : null;
    if (!rest) continue;
    const v = [], k = rest.length, eps = path === 'translation' ? 1e-4 * (Math.hypot(...rest) + 1) : 1e-4;
    let still = true;
    for (let i = 0; i < out.getCount() && still; i++) {
      out.getElement(i, v);
      const flip = path === 'rotation' && v[0] * rest[0] + v[1] * rest[1] + v[2] * rest[2] + v[3] * rest[3] < 0 ? -1 : 1;
      for (let j = 0; j < k; j++) if (Math.abs(v[j] * flip - rest[j]) > eps) { still = false; break; }
    }
    if (still) { c.dispose(); n++; }
  }
  for (const a of doc.getRoot().listAnimations()) {
    const used = new Set(a.listChannels().map((c) => c.getSampler()));
    for (const s of a.listSamplers()) if (!used.has(s)) s.dispose();
  }
  for (const a of doc.getRoot().listAccessors()) if (!a.listParents().some((p) => p.propertyType !== 'Root')) a.dispose();
  return n;
}

async function finish(doc, out) {
  await doc.transform(resample({ tolerance: 1e-3 }));
  dropStill(doc);
  await doc.transform(prune(), dedup(), quantize({ quantizePosition: 14, quantizeNormal: 8, quantizeColor: 8, quantizeWeight: 8 }), prune());
  const glb = await io.writeBinary(doc);
  writeFileSync(root + '/docs/models/' + out, glb);
  const anims = doc.getRoot().listAnimations().map((a) => a.getName());
  const verts = doc.getRoot().listMeshes().reduce((s, m) => s + m.listPrimitives().reduce((t, p) => t + p.getAttribute('POSITION').getCount(), 0), 0);
  console.log(`${out}: ${(glb.byteLength / 1024).toFixed(0)} KB, ${verts} vertices, ${anims.join(' ')}`);
}

const QUAT_CLIPS = { Idle: 'Idle', Idle_2: 'Idle_2', Walk: 'Walk', Gallop: 'Gallop', Eating: 'Eating', Death: 'Death' };

const BUILD = {
  async wolf() {
    const doc = await io.read(Q + 'Wolf.gltf');
    mergeParts(doc);
    keepClips(doc, { ...QUAT_CLIPS, Attack: 'Attack', Hit: 'Idle_HitReact1' });
    await finish(doc, 'wolf.glb');
  },
  async deer() {
    const doc = await io.read(Q + 'Deer.gltf');
    mergeParts(doc);
    keepClips(doc, { ...QUAT_CLIPS, Attack: 'Attack_Headbutt', Hit: 'Idle_HitReact1' });
    await finish(doc, 'deer.glb');
  },
  async stag() {
    const doc = await io.read(Q + 'Stag.gltf');
    mergeParts(doc);
    keepClips(doc, { ...QUAT_CLIPS, Attack: 'Attack_Headbutt', Hit: 'Idle_HitReact1' });
    await finish(doc, 'stag.glb');
  },
  async rabbit() {
    // Snabisch's rabbit: a brown fur shell over a white body; the body is pulled in a little so it shows only where the
    // shell is open (chest, paws, tail) instead of flickering through it. Wild-rabbit colours. The flat "Plane" is dropped.
    const doc = await io.read(O + 'rabbit-0/rabbit.glb');
    mergeParts(doc, { colors: { Fur: 0x7a634c, 'Fur.001': 0xd9cbb4 }, inset: { 'Fur.001': 0.07 }, drop: ['Plane'] });
    for (const n of doc.getRoot().listNodes()) if (n.getName() === 'Plane') n.dispose();
    keepClips(doc, { Idle: 'Sitting.000', Idle_2: 'Sitting.001', Run: 'Running', Death: 'Dying.000' });
    await finish(doc, 'rabbit.glb');
  },
  async bear() { await buildBear(); },
};

// ---------------------------------------------------------------- the bear: rig + moves

function smooth(a, b, x) { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); }

async function buildBear() {
  const doc = await io.read(O + 'white-bear-low-poly/bear.glb');
  const node = doc.getRoot().listNodes().find((n) => n.getMesh());
  const prim = node.getMesh().listPrimitives()[0];
  const pos = prim.getAttribute('POSITION'), nor = prim.getAttribute('NORMAL'), n = pos.getCount();
  // Bake the node's transform, turn it round (nose along +z like the other animals), feet on y = 0.
  const M = node.getMatrix();
  const tp = (p) => [M[0] * p[0] + M[4] * p[1] + M[8] * p[2] + M[12], M[1] * p[0] + M[5] * p[1] + M[9] * p[2] + M[13], M[2] * p[0] + M[6] * p[1] + M[10] * p[2] + M[14]];
  const tn = (p) => { const r = [M[0] * p[0] + M[4] * p[1] + M[8] * p[2], M[1] * p[0] + M[5] * p[1] + M[9] * p[2], M[2] * p[0] + M[6] * p[1] + M[10] * p[2]]; const l = Math.hypot(...r) || 1; return r.map((x) => x / l); };
  const local = [], P = new Float32Array(n * 3), N = new Float32Array(n * 3);
  let minY = Infinity, minZ = Infinity, maxZ = -Infinity;
  for (let i = 0; i < n; i++) {
    const q = pos.getElement(i, [0, 0, 0]); local.push(q);
    const w = tp(q), m = tn(nor.getElement(i, [0, 0, 0]));
    P[i * 3] = -w[0]; P[i * 3 + 1] = w[1]; P[i * 3 + 2] = -w[2];
    N[i * 3] = -m[0]; N[i * 3 + 1] = m[1]; N[i * 3 + 2] = -m[2];
    minY = Math.min(minY, w[1]); minZ = Math.min(minZ, -w[2]); maxZ = Math.max(maxZ, -w[2]);
  }
  const cz = (minZ + maxZ) / 2;
  for (let i = 0; i < n; i++) { P[i * 3 + 1] -= minY; P[i * 3 + 2] -= cz; }
  const place = (q) => { const w = tp(q); return [-w[0], w[1] - minY, -w[2] - cz]; };
  // Bones, placed in the model's own (source) coordinates: there the head is at -z, the feet at y = -3.3, legs end at y ~ -1.1.
  const LEG_TOP = -1.1;
  const B = [
    { name: 'Hips', at: [0, -0.5, 2.0], parent: -1 },
    { name: 'Chest', at: [0, -0.5, -1.4], parent: 0 },
    { name: 'Head', at: [0, -0.5, -3.1], parent: 1 },
    { name: 'Leg_FL', at: [1.15, LEG_TOP + 0.1, -1.7], parent: 1 },
    { name: 'Leg_FR', at: [-1.15, LEG_TOP + 0.1, -1.7], parent: 1 },
    { name: 'Leg_BL', at: [1.2, LEG_TOP + 0.2, 2.5], parent: 0 },
    { name: 'Leg_BR', at: [-1.2, LEG_TOP + 0.2, 2.5], parent: 0 },
  ];
  const at = B.map((b) => place(b.at));
  // Weights: legs below the belly (front / back by z, left / right by x), the head past the neck, the body split between
  // hips and chest along its length; soft bands so the joints bend smoothly.
  const J = new Uint16Array(n * 4), W = new Float32Array(n * 4);
  for (let i = 0; i < n; i++) {
    const [x, y, z] = local[i];
    const chest = smooth(1.2, -0.8, z), body = [[0, 1 - chest], [1, chest]];
    let leg = -1, wl = 0;
    if (y < LEG_TOP + 0.45) {
      if (z > -3.1 && z < -0.3) leg = x >= 0 ? 3 : 4;
      else if (z > 0.9 && z < 4.2) leg = x >= 0 ? 5 : 6;
      if (leg >= 0) wl = smooth(LEG_TOP + 0.45, LEG_TOP - 0.3, y);
    }
    const wh = y > -2 ? smooth(-2.6, -3.4, z) : 0;
    const inf = [];
    if (wl > 0) inf.push([leg, wl]);
    if (wh > 0) inf.push([2, wh]);
    const rest = Math.max(0, 1 - wl - wh);
    for (const [b, w] of body) if (w * rest > 0.001) inf.push([b, w * rest]);
    inf.sort((a, b) => b[1] - a[1]);
    const top = inf.slice(0, 4), s = top.reduce((t, e) => t + e[1], 0);
    top.forEach(([b, w], k) => { J[i * 4 + k] = b; W[i * 4 + k] = w / s; });
  }
  const buf = doc.getRoot().listBuffers()[0];
  const acc = (type, arr) => doc.createAccessor().setType(type).setArray(arr).setBuffer(buf);
  prim.setAttribute('POSITION', acc('VEC3', P)).setAttribute('NORMAL', acc('VEC3', N)).setAttribute('JOINTS_0', acc('VEC4', J)).setAttribute('WEIGHTS_0', acc('VEC4', W));
  // The fur texture, white -> brown (eyes, nose and claws stay dark), 256 px JPEG.
  const src = PNG.sync.read(readFileSync(root + '/tools/assets/src/oga/bear_fur.png'));
  const S = 256, k = src.width / S, out = Buffer.alloc(S * S * 4);
  const FUR = [96, 66, 44], LIGHT = [128, 94, 66];
  for (let yy = 0; yy < S; yy++) for (let xx = 0; xx < S; xx++) {
    const c = [0, 0, 0];
    for (let dy = 0; dy < k; dy++) for (let dx = 0; dx < k; dx++) { const o = ((yy * k + dy) * src.width + xx * k + dx) * 4; for (let j = 0; j < 3; j++) c[j] += src.data[o + j] / (k * k); }
    const L = (0.3 * c[0] + 0.59 * c[1] + 0.11 * c[2]) / 255;
    const fur = smooth(0.3, 0.55, L), shade = 0.94 + 0.12 * Math.max(-1, Math.min(1, (L - 0.84) / 0.08));
    const o = (yy * S + xx) * 4;
    for (let j = 0; j < 3; j++) {
      const brown = FUR[j] * shade;
      const dark = c[j] * 0.45; // eyes, nose, pads, claws: darker, slightly warm
      out[o + j] = Math.round(Math.min(255, dark + (brown - dark) * fur));
    }
    out[o + 3] = 255;
  }
  const jpg = jpeg.encode({ data: out, width: S, height: S }, 82).data;
  const tex = doc.createTexture('fur').setImage(new Uint8Array(jpg)).setMimeType('image/jpeg');
  const mat = prim.getMaterial().setName('Main').setBaseColorFactor([1, 1, 1, 1]).setBaseColorTexture(tex).setRoughnessFactor(1).setMetallicFactor(0);
  mat.getBaseColorTextureInfo().setMagFilter(9729).setMinFilter(9987);
  // The skeleton.
  const scene = doc.getRoot().listScenes()[0];
  const joints = B.map((b, i) => doc.createNode(b.name));
  B.forEach((b, i) => {
    const p = b.parent >= 0 ? at[b.parent] : [0, 0, 0];
    joints[i].setTranslation([at[i][0] - p[0], at[i][1] - p[1], at[i][2] - p[2]]);
    if (b.parent >= 0) joints[b.parent].addChild(joints[i]);
  });
  const arm = doc.createNode('Armature').addChild(joints[0]);
  scene.addChild(arm);
  const ibm = new Float32Array(16 * B.length);
  at.forEach((a, i) => { const o = i * 16; ibm[o] = ibm[o + 5] = ibm[o + 10] = ibm[o + 15] = 1; ibm[o + 12] = -a[0]; ibm[o + 13] = -a[1]; ibm[o + 14] = -a[2]; });
  const skin = doc.createSkin('BearSkin').setSkeleton(joints[0]).setInverseBindMatrices(acc('MAT4', ibm));
  for (const j of joints) skin.addJoint(j);
  node.setMatrix([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]).setSkin(skin).setName('Animal');
  node.getMesh().setName('Animal');
  // Moves. Legs swing round x (+ = foot backwards), the hips carry the bob; height h for scale.
  const h = Math.max(...Array.from({ length: n }, (_, i) => P[i * 3 + 1]));
  const hips0 = joints[0].getTranslation();
  const qx = (a) => [Math.sin(a / 2), 0, 0, Math.cos(a / 2)];
  const qmul = (a, b) => [a[3] * b[0] + a[0] * b[3] + a[1] * b[2] - a[2] * b[1], a[3] * b[1] - a[0] * b[2] + a[1] * b[3] + a[2] * b[0], a[3] * b[2] + a[0] * b[1] - a[1] * b[0] + a[2] * b[3], a[3] * b[3] - a[0] * b[0] - a[1] * b[1] - a[2] * b[2]];
  const qy = (a) => [0, Math.sin(a / 2), 0, Math.cos(a / 2)];
  const qz = (a) => [0, 0, Math.sin(a / 2), Math.cos(a / 2)];
  const rot = (rx = 0, ry = 0, rz = 0) => qmul(qmul(qy(ry), qx(rx)), qz(rz));
  const clip = (name, T, keys, f) => {
    const anim = doc.createAnimation(name), times = new Float32Array(keys + 1);
    for (let k = 0; k <= keys; k++) times[k] = (T * k) / keys;
    const tAcc = acc('SCALAR', times);
    const tracks = B.map(() => new Float32Array((keys + 1) * 4)), hipsT = new Float32Array((keys + 1) * 3);
    for (let k = 0; k <= keys; k++) {
      const f0 = f((k % keys) / keys, k / keys); // loops end where they start
      B.forEach((b, i) => tracks[i].set(f0.r[b.name] ?? [0, 0, 0, 1], k * 4));
      hipsT.set([hips0[0], hips0[1] + (f0.lift ?? 0) * h, hips0[2] + (f0.fwd ?? 0) * h], k * 3);
    }
    B.forEach((b, i) => {
      const s = doc.createAnimationSampler().setInput(tAcc).setOutput(acc('VEC4', tracks[i])).setInterpolation('LINEAR');
      anim.addSampler(s).addChannel(doc.createAnimationChannel().setTargetNode(joints[i]).setTargetPath('rotation').setSampler(s));
    });
    const s = doc.createAnimationSampler().setInput(tAcc).setOutput(acc('VEC3', hipsT)).setInterpolation('LINEAR');
    anim.addSampler(s).addChannel(doc.createAnimationChannel().setTargetNode(joints[0]).setTargetPath('translation').setSampler(s));
  };
  const TAU = Math.PI * 2, S1 = Math.sin;
  clip('Idle', 4, 48, (u) => {
    const a = TAU * u;
    return { r: { Chest: rot(0.02 * S1(2 * a)), Head: rot(0.06 * S1(2 * a + 1), 0.28 * S1(a)), Hips: rot(0, 0, 0.01 * S1(a)) }, lift: 0.004 * S1(2 * a) };
  });
  clip('Walk', 1.3, 32, (u) => {
    const a = TAU * u, A = 0.3, leg = (o) => rot(A * S1(a - TAU * o)), lift = (o) => Math.max(0, -Math.cos(a - TAU * o));
    return {
      r: { Leg_BL: leg(0), Leg_FL: leg(0.25), Leg_BR: leg(0.5), Leg_FR: leg(0.75), Hips: rot(0, 0.05 * S1(a), 0.04 * S1(a)), Chest: rot(0.02 * S1(2 * a), -0.06 * S1(a), -0.03 * S1(a)), Head: rot(0.07 * S1(2 * a + 0.6), 0.04 * S1(a)) },
      lift: 0.014 * Math.abs(Math.cos(a)) + 0.004 * (lift(0) + lift(0.5)),
    };
  });
  clip('Gallop', 0.62, 24, (u) => {
    const a = TAU * u, A = 0.46;
    return {
      r: { Leg_FL: rot(A * S1(a)), Leg_FR: rot(A * S1(a + 0.45)), Leg_BL: rot(A * S1(a + Math.PI)), Leg_BR: rot(A * S1(a + Math.PI + 0.45)), Hips: rot(0.07 * S1(a + 0.4)), Chest: rot(-0.12 * S1(a + 1.9)), Head: rot(0.1 * S1(a + 2.4)) },
      lift: 0.045 * (0.5 + 0.5 * S1(2 * a + 1)),
    };
  });
  clip('Eating', 3, 36, (u) => {
    const a = TAU * u;
    return { r: { Chest: rot(0.12), Head: rot(0.62 + 0.07 * S1(6 * a), 0.12 * S1(a)), Leg_FL: rot(-0.12), Leg_FR: rot(-0.12) }, lift: -0.01 };
  });
  clip('Attack', 1.25, 30, (u, t) => {
    // Up on the back legs (0 - 0.35), a swipe of each front paw, back down (0.8 - 1).
    const up = smooth(0, 0.3, t) * (1 - smooth(0.78, 1, t)), sw = S1(TAU * 2 * smooth(0.25, 0.8, t));
    return {
      r: { Hips: rot(-0.95 * up), Leg_BL: rot(0.95 * up), Leg_BR: rot(0.95 * up), Chest: rot(-0.1 * up), Head: rot(0.25 * up + 0.15 * up * sw),
        Leg_FL: rot(-0.55 * up + 0.35 * up * sw, 0, 0.18 * up), Leg_FR: rot(-0.55 * up - 0.35 * up * sw, 0, -0.18 * up) },
      lift: 0.08 * up, fwd: -0.05 * up,
    };
  });
  await doc.transform(weld());
  await finish(doc, 'bear.glb');
}

const which = process.argv.slice(2);
for (const k of which.length ? which : Object.keys(BUILD)) await BUILD[k]();
