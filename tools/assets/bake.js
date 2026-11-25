// Runs in headless Chromium (tools/assets/build-items.mjs): loads every item's CC0 model, bakes it into flat-shaded
// triangles with per-face colours (material colour x texture colour at the face), and renders its icon.
import * as THREE from 'three';
import { FBXLoader } from 'three/addons/loaders/FBXLoader.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { ITEMS } from './items.mjs';

const ROOT = { q: '/tools/assets/src/quaternius/', k: '/tools/assets/src/kenney/', adv: '/.cache/assets/kaykit-adventurers/', dun: '/.cache/assets/kaykit-dungeon/', hex: '/.cache/assets/kaykit-hexagon/' };
const url = (src) => { const i = src.indexOf('/'); return ROOT[src.slice(0, i)] + src.slice(i + 1); };
const cache = new Map();
async function load(src) {
  if (!cache.has(src)) {
    const u = url(src);
    cache.set(src, src.endsWith('.fbx') ? new FBXLoader().loadAsync(u) : new GLTFLoader().loadAsync(u).then((g) => g.scene));
  }
  return cache.get(src);
}

const pixels = new Map();
function texData(tex) {
  if (!tex || !tex.image) return null;
  if (pixels.has(tex)) return pixels.get(tex);
  const img = tex.image, c = document.createElement('canvas');
  c.width = img.width; c.height = img.height;
  const g = c.getContext('2d'); g.drawImage(img, 0, 0);
  const d = { w: c.width, h: c.height, px: g.getImageData(0, 0, c.width, c.height).data, flipY: tex.flipY };
  pixels.set(tex, d);
  return d;
}

/** Triangles of an object as { p: [x,y,z...], c: [r,g,b...] (sRGB 0..1 per vertex) } in its own space. */
async function triangles(src, pick, tint) {
  const root = await load(src);
  root.updateMatrixWorld(true);
  const p = [], c = [];
  const v = new THREE.Vector3(), col = new THREE.Color();
  root.traverse((o) => {
    if (!o.isMesh || (pick && !pick.test(o.name))) return;
    const g = o.geometry, pos = g.attributes.position, uv = g.attributes.uv, idx = g.index;
    const mats = Array.isArray(o.material) ? o.material : [o.material];
    const groups = g.groups.length ? g.groups : [{ start: 0, count: idx ? idx.count : pos.count, materialIndex: 0 }];
    for (const gr of groups) {
      const mat = mats[gr.materialIndex] ?? mats[0];
      const td = texData(mat.map);
      for (let k = gr.start; k + 2 < gr.start + gr.count; k += 3) {
        const ids = [0, 1, 2].map((j) => (idx ? idx.getX(k + j) : k + j));
        col.copy(mat.color ?? new THREE.Color(1, 1, 1)).convertLinearToSRGB();
        let r = col.r, gg = col.g, b = col.b;
        if (td && uv) {
          let u = 0, w = 0;
          for (const id of ids) { u += uv.getX(id) / 3; w += uv.getY(id) / 3; }
          u = ((u % 1) + 1) % 1; w = ((w % 1) + 1) % 1;
          const x = Math.min(td.w - 1, Math.floor(u * td.w)), y = Math.min(td.h - 1, Math.floor((td.flipY ? 1 - w : w) * td.h));
          const o4 = (y * td.w + x) * 4;
          r *= td.px[o4] / 255; gg *= td.px[o4 + 1] / 255; b *= td.px[o4 + 2] / 255;
        }
        const vc = g.attributes.color;
        if (vc) { let a = 0, bb = 0, cc = 0; for (const id of ids) { a += vc.getX(id) / 3; bb += vc.getY(id) / 3; cc += vc.getZ(id) / 3; } col.setRGB(a, bb, cc).convertLinearToSRGB(); r *= col.r; gg *= col.g; b *= col.b; }
        if (tint) { r *= tint[0]; gg *= tint[1]; b *= tint[2]; }
        for (const id of ids) {
          v.fromBufferAttribute(pos, id);
          if (o.isSkinnedMesh) o.applyBoneTransform(id, v);
          v.applyMatrix4(o.matrixWorld);
          p.push(v.x, v.y, v.z); c.push(Math.min(1, r), Math.min(1, gg), Math.min(1, b));
        }
      }
    }
  });
  return { p, c };
}

function transform(t, rot, scale = 1, at = [0, 0, 0]) {
  const m = new THREE.Matrix4().compose(new THREE.Vector3(...at), new THREE.Quaternion().setFromEuler(new THREE.Euler(...rot.map((d) => (d * Math.PI) / 180))), new THREE.Vector3(scale, scale, scale));
  const v = new THREE.Vector3();
  for (let i = 0; i < t.p.length; i += 3) { v.set(t.p[i], t.p[i + 1], t.p[i + 2]).applyMatrix4(m); t.p[i] = v.x; t.p[i + 1] = v.y; t.p[i + 2] = v.z; }
  return t;
}
function bbox(p) {
  const lo = [Infinity, Infinity, Infinity], hi = [-Infinity, -Infinity, -Infinity];
  for (let i = 0; i < p.length; i += 3) for (let k = 0; k < 3; k++) { lo[k] = Math.min(lo[k], p[i + k]); hi[k] = Math.max(hi[k], p[i + k]); }
  return { lo, hi };
}

async function bake(it) {
  let t;
  if (it.parts) {
    t = { p: [], c: [] };
    for (const part of it.parts) {
      const q = await triangles(part.src, part.pick, part.tint);
      // each part on the ground, centred, then placed
      const b = bbox(q.p), k = 1 / Math.max(...[0, 1, 2].map((i) => b.hi[i] - b.lo[i]));
      for (let i = 0; i < q.p.length; i += 3) { q.p[i] = (q.p[i] - (b.lo[0] + b.hi[0]) / 2) * k; q.p[i + 1] = (q.p[i + 1] - b.lo[1]) * k; q.p[i + 2] = (q.p[i + 2] - (b.lo[2] + b.hi[2]) / 2) * k; }
      transform(q, part.rot, part.scale, part.at);
      t.p.push(...q.p); t.c.push(...q.c);
    }
  } else t = await triangles(it.src, it.pick, it.tint);
  transform(t, it.rot);
  const b = bbox(t.p), dim = [0, 1, 2].map((i) => b.hi[i] - b.lo[i]), k = (it.size ?? 1) / Math.max(...dim);
  const ax = (b.lo[0] + b.hi[0]) / 2, az = (b.lo[2] + b.hi[2]) / 2, ay = it.anchor === 'center' ? (b.lo[1] + b.hi[1]) / 2 : b.lo[1];
  for (let i = 0; i < t.p.length; i += 3) { t.p[i] = (t.p[i] - ax) * k; t.p[i + 1] = (t.p[i + 1] - ay) * k; t.p[i + 2] = (t.p[i + 2] - az) * k; }
  return t;
}

function geometry(t) {
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(t.p, 3));
  const lin = t.c.map((x) => (x <= 0.04045 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4)));
  g.setAttribute('color', new THREE.Float32BufferAttribute(lin, 3));
  g.computeVertexNormals(); // non-indexed: flat faces
  return g;
}

const b64 = (a) => { let s = ''; const u = new Uint8Array(a.buffer, a.byteOffset, a.byteLength); for (let i = 0; i < u.length; i += 8192) s += String.fromCharCode(...u.subarray(i, i + 8192)); return btoa(s); };

/** Compact model: positions Int16 (scale s), colours Uint8 sRGB, per vertex; normals are made again on load (flat). */
function pack(t) {
  let m = 0;
  for (const x of t.p) m = Math.max(m, Math.abs(x));
  const s = m / 32767 || 1, P = new Int16Array(t.p.length), C = new Uint8Array(t.c.length);
  for (let i = 0; i < t.p.length; i++) P[i] = Math.round(t.p[i] / s);
  for (let i = 0; i < t.c.length; i++) C[i] = Math.round(t.c[i] * 255);
  return { n: t.p.length / 3, s, p: b64(P), c: b64(C) };
}

const SIZE = 128;
async function icons(baked) {
  const r = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
  r.setPixelRatio(1); r.setSize(SIZE * 2, SIZE * 2);
  r.toneMapping = THREE.NeutralToneMapping;
  const scene = new THREE.Scene();
  scene.add(new THREE.HemisphereLight(0xeaf2ff, 0x6b5a48, 1.5));
  const key = new THREE.DirectionalLight(0xfff4e0, 2.6); key.position.set(-2, 4, 5); scene.add(key);
  const rim = new THREE.DirectionalLight(0xbfd8ff, 1.2); rim.position.set(3, 2, -4); scene.add(rim);
  const cam = new THREE.PerspectiveCamera(24, 1, 0.01, 100);
  const cols = 8, rows = Math.ceil(baked.length / cols);
  const atlas = document.createElement('canvas'); atlas.width = cols * SIZE; atlas.height = rows * SIZE;
  const ag = atlas.getContext('2d');
  const tmp = document.createElement('canvas'); tmp.width = tmp.height = SIZE; const tg = tmp.getContext('2d');
  const sil = document.createElement('canvas'); sil.width = sil.height = SIZE; const sg = sil.getContext('2d');
  baked.forEach(({ it, t }, n) => {
    const mesh = new THREE.Mesh(geometry(t), new THREE.MeshLambertMaterial({ vertexColors: true }));
    const ic = it.icon ?? {};
    const grp = new THREE.Group(); grp.add(mesh);
    grp.rotation.set(((ic.pitch ?? 20) * Math.PI) / 180, ((ic.yaw ?? 30) * Math.PI) / 180, ((ic.roll ?? 0) * Math.PI) / 180, 'YXZ');
    scene.add(grp);
    grp.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(grp), c = box.getCenter(new THREE.Vector3()), sz = box.getSize(new THREE.Vector3());
    const rad = Math.max(sz.x, sz.y) / 2 * 1.08 + sz.z * 0.05;
    const dist = rad / Math.tan((cam.fov * Math.PI) / 360) / (ic.zoom ?? 1);
    cam.position.set(c.x, c.y, c.z + dist + sz.z / 2); cam.lookAt(c);
    r.render(scene, cam);
    scene.remove(grp); mesh.geometry.dispose();
    // outline + soft shadow, then the item
    tg.clearRect(0, 0, SIZE, SIZE); tg.drawImage(r.domElement, 6, 6, SIZE - 12, SIZE - 12);
    sg.clearRect(0, 0, SIZE, SIZE); sg.globalCompositeOperation = 'source-over';
    for (let a = 0; a < 16; a++) sg.drawImage(tmp, Math.cos(a / 8 * Math.PI) * 2.2, Math.sin(a / 8 * Math.PI) * 2.2);
    sg.globalCompositeOperation = 'source-in'; sg.fillStyle = 'rgba(28,20,14,0.95)'; sg.fillRect(0, 0, SIZE, SIZE);
    const x = (n % cols) * SIZE, y = Math.floor(n / cols) * SIZE;
    ag.save(); ag.globalAlpha = 0.35; ag.filter = 'blur(3px)'; ag.drawImage(sil, x + 3, y + 5); ag.restore();
    ag.drawImage(sil, x, y); ag.drawImage(tmp, x, y);
  });
  return { png: atlas.toDataURL('image/png'), cols, size: SIZE };
}

window.bakeAll = async () => {
  const baked = [];
  for (const it of ITEMS) {
    try { baked.push({ it, t: await bake(it) }); } catch (e) { console.log('FAIL ' + it.id + ': ' + e.message); throw e; }
  }
  const ic = await icons(baked);
  const models = {};
  for (const { it, t } of baked) if (it.world) models[it.id] = pack(t);
  const info = baked.map(({ it, t }) => { const b = bbox(t.p); return `${it.id}: ${t.p.length / 9} tris, ${b.lo.map((x, i) => (b.hi[i] - x).toFixed(2)).join(' x ')}`; });
  return { ids: baked.map((b) => b.it.id), icons: ic, models, info };
};
