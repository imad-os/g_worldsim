import { Color } from 'three';

/**
 * Coats (imad 2026-11-27: "animals in different colours, respecting their type: a wolf in shades of grey, never red"): per kind, the
 * colours a real one of that kind comes in (sRGB) with how common each is. `main` / `light` replace the model's fur colours (models with
 * vertex colours); `tint` multiplies a textured model (the bear). Picked from the entity id, so every TV sees the same animal alike.
 */
export interface Coat { w: number; main?: number; light?: number; tint?: number }
export const COATS: (Coat[] | null)[] = [
  [{ w: 4 }, { w: 3, main: 0x6f6355, light: 0xcfc6b6 }, { w: 2, main: 0x9a7b55, light: 0xe2d3b4 }, { w: 1, main: 0x3d342d, light: 0x8f8476 }, { w: 1, main: 0xe6e2d9, light: 0xf5f2ec }], // rabbit: wild brown, agouti grey, sandy, dark, white
  [{ w: 4 }, { w: 2, main: 0x7a5c45, light: 0xb1a48e }, { w: 2, main: 0xb27a48, light: 0xdcc7a5 }, { w: 1, main: 0x84776a, light: 0xc2b8a8 }], // deer: red-brown, winter grey-brown, tawny, greyish
  [{ w: 4 }, { w: 2, tint: 0x8a8480 }, { w: 2, tint: 0xc0a088 }, { w: 1, tint: 0x9a9a9a }], // boar (low-poly): dark, darker, brown, grey
  [{ w: 4 }, { w: 3, main: 0xa6a6a3, light: 0xd9d9d5 }, { w: 2, main: 0x4a4a4b, light: 0x7d7d7b }, { w: 1, main: 0x262628, light: 0x535358 }, { w: 1, main: 0xdedcd6, light: 0xf2f1ec }, { w: 2, main: 0x7e776d, light: 0xb3aa9a }], // wolf: grey, light grey, charcoal, black, white, grey-brown (never red)
  [{ w: 4 }, { w: 3, tint: 0x9a8a7c }, { w: 2, tint: 0x4a4542 }, { w: 1, tint: 0xffd7b0 }, { w: 1, tint: 0xe0d8cc }], // bear: brown, dark brown, black, cinnamon, pale grizzly
];
/** Which coat entity `id` of kind `type` wears (-1 = none listed). A mixing hash: independent of the doe / stag choice (id parity). */
export function coatOf(type: number, id: number): number {
  const list = COATS[type];
  if (!list) return -1;
  let h = Math.imul(id ^ 0x5bd1e995, 0x2c1b3c6d); h ^= h >>> 15; h = Math.imul(h, 0x297a2d39); h ^= h >>> 13;
  let r = ((h >>> 0) / 4294967296) * list.reduce((s, c) => s + c.w, 0);
  for (let k = 0; k < list.length; k++) { r -= list[k]!.w; if (r < 0) return k; }
  return 0;
}
/** The tint of a coat for the low-poly set (white = as drawn). */
export function coatTint(type: number, id: number, out: Color): Color {
  const k = coatOf(type, id), c = k >= 0 ? COATS[type]![k]! : null;
  return c?.tint !== undefined ? out.setHex(c.tint) : out.setRGB(1, 1, 1);
}
