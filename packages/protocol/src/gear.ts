/**
 * Gear (imad 2026-11-25): what a person wears and holds, its level (+0..+10) and its quality (normal .. elite), shared
 * by the server (sim/gear.ts: damage, defence, upgrades) and the viewer (gear screen, models in hands, icons).
 */
import { WEAPONS, DEFENCE, type Resource } from './craft.js';

export const QUALITIES = ['normal', 'fine', 'superior', 'epic', 'elite'] as const;
export type Quality = 0 | 1 | 2 | 3 | 4;
/** Frame / icon colour of each quality. */
export const QUALITY_COLOR = ['#b9b3a8', '#62c95a', '#4aa3ff', '#b36cff', '#ffb02e'];
/** Damage / defence multiplier of each quality. */
export const QUALITY_MUL = [1, 1.12, 1.25, 1.42, 1.65];
export const MAX_LEVEL = 10;
/** Each level adds 5 % on top of the quality. */
export function gearMul(lv: number, q: number): number { return (QUALITY_MUL[q] ?? 1) * (1 + 0.05 * Math.max(0, Math.min(MAX_LEVEL, lv))); }
/** Quality q -> q + 1 needs this level first (fine +2, superior +4, epic +6, elite +8). */
export function qualityNeedsLevel(q: number): number { return 2 + 2 * q; }

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
/** Materials to take an item from level lv to lv + 1. */
export function levelCost(item: string, lv: number): Cost {
  const n = Math.ceil((lv + 1) / 2);
  if (item === 'clothes') return { leather: n };
  if (item === 'bow') return { wood: 1, leather: Math.ceil((lv + 1) / 3) };
  if (item === 'spear') return { wood: 1, stone: n };
  if (METAL.has(item)) return item === 'helmet' || item === 'armor' ? { ore: n, leather: 1 } : { ore: n, stone: 1 };
  return {};
}
/** Materials to raise the quality from q to q + 1 (rare things: claws, ore, scrap, then bricks). */
export function qualityCost(item: string, q: number): Cost {
  const k = q + 1;
  const c: Cost = item === 'clothes' || item === 'bow' ? { claw: k, leather: 2 * k, scrap: k } : { claw: k, ore: 2 * k, scrap: k };
  if (q >= 2) c.brick = q - 1;
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
