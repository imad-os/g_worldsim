import { BufferGeometry, Float32BufferAttribute } from 'three';

/**
 * Item models and icons, baked from CC0 models (Quaternius, KayKit, Kenney: tools/assets/build-items.mjs, credits in
 * docs/models/CREDITS.md): `models/items.json` = flat-shaded triangles with face colours (weapons in hands, helmets,
 * shoulder pads), `icons/items.png` = one atlas for the bag, crafting and gear screens. Both load once, in the background.
 */
interface Packed { n: number; s: number; p: string; c: string }
const geos = new Map<string, BufferGeometry>();
let iconInfo: { size: number; cols: number; ids: string[] } | null = null;
let loading: Promise<void> | null = null;
export let itemsReady = false;

function bytes(b64: string): Uint8Array {
  const s = atob(b64), u = new Uint8Array(s.length);
  for (let i = 0; i < s.length; i++) u[i] = s.charCodeAt(i);
  return u;
}
function unpack(m: Packed): BufferGeometry {
  const P = new Int16Array(bytes(m.p).buffer), C = bytes(m.c);
  const pos = new Float32Array(P.length), col = new Float32Array(C.length);
  for (let i = 0; i < P.length; i++) pos[i] = P[i]! * m.s;
  for (let i = 0; i < C.length; i++) { const x = C[i]! / 255; col[i] = x <= 0.04045 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4); }
  const g = new BufferGeometry();
  g.setAttribute('position', new Float32BufferAttribute(pos, 3));
  g.setAttribute('color', new Float32BufferAttribute(col, 3));
  g.computeVertexNormals();
  return g;
}

/** Start loading (relative to the page: works on GitHub Pages and the server's /app/). */
export function loadItems(): Promise<void> {
  loading ??= (async () => {
    try {
      const [m, ic] = await Promise.all([fetch('models/items.json').then((r) => r.json()), fetch('icons/items.json').then((r) => r.json())]);
      for (const [k, v] of Object.entries(m as Record<string, Packed>)) geos.set(k, unpack(v));
      iconInfo = ic;
      itemsReady = true;
    } catch { /* no models: people are drawn without them */ }
  })();
  return loading;
}
export const itemGeo = (id: string) => geos.get(id);

/** An icon as inline CSS (background from the atlas), or '' when there is none for this id. */
export function iconStyle(id: string, px: number): string {
  const ic = iconInfo;
  const k = ic ? ic.ids.indexOf(id) : -1;
  if (!ic || k < 0) return '';
  const rows = Math.ceil(ic.ids.length / ic.cols), x = (k % ic.cols) * px, y = Math.floor(k / ic.cols) * px;
  return `background-image:url(icons/items.png);background-size:${ic.cols * px}px ${rows * px}px;background-position:-${x}px -${y}px`;
}
export const hasIcon = (id: string) => !!iconInfo && iconInfo.ids.includes(id);
