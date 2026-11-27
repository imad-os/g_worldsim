/**
 * Gear (imad 2026-11-25, levels 1-50 and legendary 2026-11-27): what a person wears and holds, its level (1..50, kept as
 * 0..49) and its quality (normal, fine, rare, epic, legendary), shared by the server (sim/gear.ts: damage, defence,
 * upgrades) and the viewer (gear screen, models in hands, icons).
 */
import { WEAPONS, DEFENCE, type Resource } from './craft.js';

export const QUALITIES = ['normal', 'fine', 'rare', 'epic', 'legendary'] as const;
export type Quality = 0 | 1 | 2 | 3 | 4;
export const MAX_QUALITY = 4;
/** Frame / icon colour of each quality. */
export const QUALITY_COLOR = ['#b9b3a8', '#62c95a', '#4aa3ff', '#b36cff', '#ffb02e'];
/** Damage / defence multiplier of each quality. */
export const QUALITY_MUL = [1, 1.12, 1.25, 1.42, 1.8];
/** Levels shown 1..50; stored as 0..49 (an item never levelled = level 1; worlds from before keep their +n as level n + 1). */
export const TOP_LEVEL = 50;
/** The highest STORED level (49 = level 50). */
export const MAX_LEVEL = TOP_LEVEL - 1;
/** The level a player reads (stored + 1). */
export function shownLevel(lv: number): number { return Math.max(0, Math.min(MAX_LEVEL, lv)) + 1; }
/** Levels 2-11 add 5 % each (as before), then 2.5 % each: level 50 = x2.475 (x4.46 when legendary). */
export function levelMul(lv: number): number { const l = Math.max(0, Math.min(MAX_LEVEL, lv)); return 1 + 0.05 * Math.min(10, l) + 0.025 * Math.max(0, l - 10); }
export function gearMul(lv: number, q: number): number { return (QUALITY_MUL[q] ?? 1) * levelMul(lv); }
/** Quality q -> q + 1 needs this SHOWN level first: fine 5, rare 15, epic 25, legendary 40. */
export const QUALITY_LEVEL = [5, 15, 25, 40];
export function qualityNeedsLevel(q: number): number { return QUALITY_LEVEL[q] ?? TOP_LEVEL; }
/** May the quality go up from q at this stored level? */
export function qualityReady(lv: number, q: number): boolean { return q < MAX_QUALITY && shownLevel(lv) >= qualityNeedsLevel(q); }
/**
 * What worn things really take off a bite (0..0.8) from their summed power: up to 0.5 as it is (old worlds unchanged), above
 * that it keeps growing more and more slowly, so levels 1 to 50 always count.
 */
export function defenceOf(v: number): number { return v <= 0.5 ? Math.max(0, v) : 0.5 + 0.3 * (1 - Math.exp(-(v - 0.5) / 0.6)); }

export const SLOTS = ['weapon', 'ranged', 'head', 'body'] as const;
export type Slot = (typeof SLOTS)[number];
export const SLOT_OF: Record<string, Slot> = { sword: 'weapon', axe: 'weapon', spear: 'weapon', bow: 'ranged', helmet: 'head', armor: 'body', clothes: 'body' };
/** Things that can be levelled up (arrows are used up, materials are materials). */
export const UPGRADABLE = Object.keys(SLOT_OF);
/** A bow shot's damage before level / quality (30 near, 24, 18 far: x this / 30). */
export const BOW_DAMAGE = 30;
export function baseOf(item: string): number { return item === 'bow' ? BOW_DAMAGE : WEAPONS[item] ?? DEFENCE[item] ?? 0; }

/** A person's gear: the chosen item per slot ('' or missing = the best one carried, '-' = nothing) and upgrades per item: [level, quality]. */
export interface GearState { weapon?: string; ranged?: string; head?: string; body?: string; up?: Record<string, [number, number]> }

type Cost = Partial<Record<Resource, number>>;
const METAL = new Set(['sword', 'axe', 'helmet', 'armor']);
/**
 * Materials to take an item from stored level lv to lv + 1. The main material grows by 1 every 5 levels (1..10, so a bag
 * holds it); from level 11 scrap, from 26 claws, from 41 bricks too.
 */
export function levelCost(item: string, lv: number): Cost {
  const n = 1 + Math.floor(Math.max(0, lv) / 5);
  let c: Cost;
  if (item === 'clothes') c = { leather: n };
  else if (item === 'bow') c = { wood: 1 + Math.floor(lv / 10), leather: Math.ceil((lv + 1) / 5) };
  else if (item === 'spear') c = { wood: 1, stone: n };
  else if (METAL.has(item)) c = item === 'helmet' || item === 'armor' ? { ore: n, leather: 1 + Math.floor(lv / 15) } : { ore: n, stone: 1 + Math.floor(lv / 15) };
  else return {};
  if (lv >= 10) c.scrap = 1 + Math.floor((lv - 10) / 15);
  if (lv >= 25) c.claw = 1 + Math.floor((lv - 25) / 15);
  if (lv >= 40) c.brick = 1;
  return c;
}
/** Materials to raise the quality from q to q + 1 (rare things: claws, ore / leather, scrap, then bricks; legendary the most). */
export function qualityCost(item: string, q: number): Cost {
  const k = q + 1;
  const c: Cost = item === 'clothes' || item === 'bow' ? { claw: k, leather: 2 * k, scrap: k } : { claw: k, ore: 2 * k, scrap: k };
  if (q >= 2) c.brick = q - 1;
  if (q >= 3) { c.claw = 6; c.scrap = 6; c.brick = 4; }
  return c;
}

// ---------------------------------------------------------------- frames
/** Held item numbers in frames (bits 0-2). */
export const HELD = ['', 'sword', 'axe', 'spear', 'bow'] as const;
/** What a person is doing, for the viewer's animation (bits 15-17). */
export const ANIMS = ['', 'attack', 'chop', 'mine', 'build', 'talk', 'shoot', 'use'] as const;
export type Anim = (typeof ANIMS)[number];
export interface GearLook { held: string; hq: number; helmet: boolean; headQ: number; body: '' | 'clothes' | 'armor'; bodyQ: number; anim: Anim; seq: number; back: boolean; aim?: boolean }
/**
 * One Int32 per person in a frame (`Frame.gx`, parallel to the records): held 3 bits + its quality 3, helmet 1 + quality 3,
 * body 2 (1 clothes, 2 armor) + quality 3, anim 3, anim count 4 (a new swing restarts the move), bow on the back 1, aiming (bow drawn and held) 1.
 */
export function packGear(g: GearLook): number {
  const h = Math.max(0, HELD.indexOf(g.held as (typeof HELD)[number])), a = Math.max(0, ANIMS.indexOf(g.anim));
  return h | (g.hq & 7) << 3 | (g.helmet ? 1 : 0) << 6 | (g.headQ & 7) << 7 | (g.body === 'armor' ? 2 : g.body === 'clothes' ? 1 : 0) << 10
    | (g.bodyQ & 7) << 12 | a << 15 | (g.seq & 15) << 18 | (g.back ? 1 : 0) << 22 | (g.aim ? 1 : 0) << 23;
}
export function unpackGear(v: number): GearLook {
  const b = (v >> 10) & 3;
  return { held: HELD[v & 7] ?? '', hq: (v >> 3) & 7, helmet: ((v >> 6) & 1) === 1, headQ: (v >> 7) & 7, body: b === 2 ? 'armor' : b === 1 ? 'clothes' : '', bodyQ: (v >> 12) & 7,
    anim: ANIMS[(v >> 15) & 7] ?? '', seq: (v >> 18) & 15, back: ((v >> 22) & 1) === 1, aim: ((v >> 23) & 1) === 1 };
}
