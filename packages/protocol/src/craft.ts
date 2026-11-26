/**
 * Crafting, shared by the server (sim/survival.ts) and the viewer's craft screen. A recipe is a category plus an
 * exact set of ingredients (the player picks the category, puts the ingredients in): the same ingredients can make
 * different things in different categories (1 wood + 1 ore = a sword in Weapons, a door in Furniture).
 */
export const RESOURCES = ['wood', 'stone', 'scrap', 'ore', 'brick', 'leather', 'claw', 'herb'] as const;
export type Resource = (typeof RESOURCES)[number];
export const CATEGORIES = ['weapon', 'clothing', 'defence', 'furniture', 'healing'] as const;
export type Category = (typeof CATEGORIES)[number];
export interface Recipe { cat: Category; what: string; need: Partial<Record<Resource, number>>; n?: number }

export const RECIPES_ALL: Recipe[] = [
  { cat: 'weapon', what: 'sword', need: { wood: 1, ore: 1 } },
  { cat: 'weapon', what: 'axe', need: { wood: 1, stone: 1 } },
  { cat: 'weapon', what: 'spear', need: { wood: 1, claw: 1 } },
  { cat: 'weapon', what: 'spear', need: { wood: 1, scrap: 1 } },
  { cat: 'weapon', what: 'bow', need: { wood: 2, leather: 1 } },
  { cat: 'weapon', what: 'arrows', need: { wood: 2, stone: 1 }, n: 5 },
  { cat: 'clothing', what: 'clothes', need: { leather: 2 } },
  { cat: 'clothing', what: 'armor', need: { leather: 2, ore: 1 } },
  { cat: 'clothing', what: 'helmet', need: { leather: 1, ore: 1 } },
  { cat: 'defence', what: 'palisade', need: { wood: 2 } },
  { cat: 'defence', what: 'spikes', need: { wood: 1, claw: 1 } },
  { cat: 'defence', what: 'stonewall', need: { brick: 2 } },
  { cat: 'furniture', what: 'door', need: { wood: 1, ore: 1 } },
  { cat: 'furniture', what: 'window', need: { wood: 1, scrap: 1 } },
  { cat: 'furniture', what: 'bed', need: { wood: 3, leather: 2 } },
  { cat: 'furniture', what: 'lamp', need: { scrap: 1, ore: 1 } },
  { cat: 'furniture', what: 'campfire', need: { wood: 3, stone: 2 } },
  { cat: 'furniture', what: 'fridge', need: { scrap: 3, stone: 2 } }, // imad 2026-11-26: keeps food and water for later (inside a hut only)
  { cat: 'furniture', what: 'chest', need: { wood: 4, scrap: 1 } }, // keeps things and weapons (inside a hut only)
  { cat: 'healing', what: 'medkit', need: { herb: 3, leather: 1 } }, // first-aid kit (imad 2026-11-25): herbs from the wild + a strip of leather
];
/** Health a first-aid kit gives back (of 100). */
export const MEDKIT_HEAL = 45;
/** Things that are put down on the ground (a tile of the same name). */
/** A hut (7 x 7 wooden walls, a floor and its own wooden door, imad 2026-11-25: "the huts need to be with doors"; 2026-11-26: "50 % bigger", was 5 x 5). */
export const HUT_SIZE = 7;
// imad 2026-11-25: dear, so people live in the huts they have instead of leaving abandoned ones everywhere.
export const HUT_NEED: Readonly<Record<string, number>> = { wood: 20, stone: 10, leather: 5 };
export const PLACEABLE = ['palisade', 'spikes', 'stonewall', 'door', 'window', 'bed', 'lamp', 'campfire', 'fridge', 'chest'] as const;
/** Furniture that goes only on a hut's floor (imad 2026-11-26). */
export const INSIDE_ONLY: readonly string[] = ['fridge', 'chest'];
/** What each storage piece keeps (imad 2026-11-26): a fridge food and water, a chest everything else (things, weapons, clothes). */
export function boxHolds(box: string, item: string): boolean {
  if (box === 'fridge') return item === 'food' || item === 'water';
  if (box === 'chest') return item !== 'food' && item !== 'water';
  return false;
}
/** How much of one kind a storage piece keeps. */
export const BOX_CAP = 40;
/** Food a person carries in the hands; more goes into the bag (imad 2026-11-26: "it says my hands are full (5)"). */
export const HANDS = 5;
/** Water one fill at the water gives (bottles in the bag), and what a drink of it takes off thirst. */
export const WATER_FILL = 3, WATER_DRINK = 60;
/** Weapons by strength (the best one carried is used), with damage. */
export const WEAPONS: Record<string, number> = { sword: 34, spear: 30, axe: 22 };
/** What a worn piece takes off a bite (body: the best of armor / clothes; head: helmet). */
export const DEFENCE: Record<string, number> = { armor: 0.35, clothes: 0.15, helmet: 0.15 };
/** The 5 animals (type = index). */
export const ANIMAL_NAMES = ['rabbit', 'deer', 'boar', 'wolf', 'bear'] as const;

/** The recipe for exactly these ingredients in this category, or null. */
export function matchRecipe(cat: string, put: Partial<Record<string, number>>): Recipe | null {
  const keys = Object.keys(put).filter((k) => (put[k] ?? 0) > 0);
  for (const r of RECIPES_ALL) {
    if (r.cat !== cat) continue;
    const need = Object.keys(r.need);
    if (need.length === keys.length && need.every((k) => put[k] === r.need[k as Resource])) return r;
  }
  return null;
}
