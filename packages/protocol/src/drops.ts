/**
 * Things a player's work drops on the ground (imad 2026-11-27: "cutting a tree, killing an animal, breaking a stone, pulling down a
 * building: the items drop on the ground and I pick them up, they do not go into the bag by magic"). ONE table for server + TV:
 * a ground pile is a Kind.Item entity whose sub (frame bits 16-23) is DROP_BASE + its index here (anything else = 'other').
 */
export const DROP_BASE = 100;
export const DROP_KINDS = ['wood', 'stone', 'brick', 'scrap', 'ore', 'leather', 'claw', 'herb', 'meat', 'food', 'water', 'other'] as const;
export type DropKind = (typeof DROP_KINDS)[number];
/** The item sub of a pile of `what`. */
export function dropSub(what: string): number { const k = DROP_KINDS.indexOf(what as DropKind); return DROP_BASE + (k >= 0 ? k : DROP_KINDS.length - 1); }
/** The kind of pile an item sub is ('' = not a pile: food items of the scenario). */
export function dropKindOf(sub: number): DropKind | '' { return sub >= DROP_BASE && sub < DROP_BASE + DROP_KINDS.length ? DROP_KINDS[sub - DROP_BASE]! : ''; }
