/**
 * How a person looks (imad 2026-11-27: "better body shapes, better customisation, hair"), ONE packed number shared by the server
 * (sim/looks.ts: from the profile, a player's own choices) and the TV (gfx/people.ts draws it). Sent once per person per viewer
 * (Notice `looks` [[id, code], ...], like names), so frames stay as small as before.
 *
 * bits 0-2 skin tone 0-4, 3 woman, 4-6 hair style, 7-9 hair colour, 10-11 build, 12-15 top colour, 16-18 trousers colour,
 * 19-20 beard, 21 elder (grey, a little stooped), 22 always 1 (a real code is never 0).
 */
export const HAIR_STYLES = ['short', 'crop', 'swept', 'curly', 'long', 'ponytail', 'bun', 'bald'] as const;
export const BEARDS = ['none', 'moustache', 'short', 'full'] as const;
export const BUILDS = ['slim', 'average', 'broad', 'heavy'] as const;
/** Colours (0xRRGGBB): the TV draws these, the TV look page shows them as swatches. */
export const SKIN_TONES = [0xf1c9a5, 0xe0ac82, 0xc68b5e, 0x9c6a43, 0x6e4a2f];
export const HAIR_COLOURS = [0x1c1612, 0x3b2619, 0x6b4428, 0x8a3f22, 0xc9a46a, 0xb8642c, 0x5a5550, 0xd8d2c8];
export const TOP_COLOURS = [0x8b5a3c, 0x6b7d4a, 0x5a6f86, 0x9a7b4f, 0x7a4b4b, 0x5e5e6e, 0xa0683a, 0x4f6b5e, 0x8a7f6a, 0x2f7d5c, 0xb04a3a, 0x3d5a9e, 0xc9a23a, 0x6a4a8a, 0xd8d0c0, 0x2f2f34];
export const PANTS_COLOURS = [0x3b3a40, 0x4a3d30, 0x2f3b4a, 0x50483d, 0x6a5a40, 0x2a2a2c, 0x5a3d2a, 0x44523a];

export interface LookParts { skin: number; woman: boolean; hair: number; hairColour: number; build: number; top: number; pants: number; beard: number; elder: boolean }

export function packLook(l: LookParts): number {
  const c = (v: number, n: number) => Math.max(0, Math.min(n - 1, Math.floor(v) || 0));
  return c(l.skin, 5) | (l.woman ? 8 : 0) | (c(l.hair, 8) << 4) | (c(l.hairColour, 8) << 7) | (c(l.build, 4) << 10)
    | (c(l.top, 16) << 12) | (c(l.pants, 8) << 16) | ((l.woman ? 0 : c(l.beard, 4)) << 19) | (l.elder ? 1 << 21 : 0) | (1 << 22);
}
export function unpackLook(v: number): LookParts {
  return { skin: Math.min(4, v & 7), woman: (v & 8) !== 0, hair: (v >> 4) & 7, hairColour: (v >> 7) & 7, build: (v >> 10) & 3,
    top: (v >> 12) & 15, pants: (v >> 16) & 7, beard: (v >> 19) & 3, elder: ((v >> 21) & 1) === 1 };
}

/** A fixed hash of an integer and a key -> [0, 1) (no dice: the same person always looks the same). */
export function lookHash(id: number, k: number): number {
  let h = Math.imul(id | 0, 374761393) + Math.imul(k | 0, 668265263);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}
/** Hair styles people pick by themselves (a few bald men, no bald women). */
const MEN_HAIR = [0, 0, 1, 1, 2, 3, 4, 7], WOMEN_HAIR = [4, 4, 5, 5, 6, 2, 3, 0];

/**
 * The look a person has when nobody chose one: from a hash of `seed` (their id), their sex, skin tone (else from the hash),
 * strength 0-1 (build), age in years (beard from 18, elder from 55) and a parent's hair colour (children mostly take it).
 */
export function defaultLook(seed: number, woman: boolean, age: number, strength = 0.5, skin = -1, parentHair = -1): LookParts {
  const h = (k: number) => lookHash(seed, k);
  const pick = (a: number[], k: number) => a[Math.floor(h(k) * a.length)]!;
  const elder = age >= 55;
  let hairColour = parentHair >= 0 && h(7) < 0.7 ? parentHair : Math.floor(h(8) * 6); // greys only with age
  if (elder && h(9) < 0.75) hairColour = h(10) < 0.5 ? 6 : 7;
  const build = h(11) < 0.1 ? 3 : strength < 0.38 ? 0 : strength > 0.68 ? 2 : 1;
  const beard = woman || age < 18 ? 0 : h(12) < 0.45 ? 0 : 1 + Math.floor(h(13) * 3);
  return { skin: skin >= 0 ? skin : Math.floor(h(14) * 5), woman, hair: pick(woman ? WOMEN_HAIR : MEN_HAIR, 15), hairColour, build,
    top: Math.floor(h(16) * 14), pants: Math.floor(h(17) * 8), beard, elder };
}

/** The look of the old frame code (1 + skin, + 8 woman: town teachers, old servers) with the rest from the hash. */
export function lookFromOld(code: number, seed: number): LookParts {
  const woman = (code & 8) !== 0;
  return defaultLook(seed, woman, 40, 0.5, Math.max(0, Math.min(4, (code & 7) - 1)));
}
