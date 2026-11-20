import type { Rng } from './rng.js';

/**
 * Who each agent is: name, sex, birth time, genetic traits and personality. Kept per entity id in the world (and in
 * snapshots). Traits are 0..1 (0.5 = average) except lifespan (game years). Children blend their parents' traits
 * with a small mutation (milestone 7 uses `inherit`).
 */
export interface Traits {
  strength: number; speed: number; intelligence: number; courage: number; empathy: number; metabolism: number;
  /** Game years. */
  lifespan: number;
}
export interface Profile {
  name: string;
  sex: 'f' | 'm';
  /** Game seconds when born (can be negative: born before the world began). */
  born: number;
  traits: Traits;
  personality: string[];
  /** Entity ids of the parents (empty for the first survivors). */
  parents: number[];
  generation: number;
  /** Partner's entity id (-1 = none; 0 is a real id). */
  partner: number;
  /** Game seconds of death, and why (kept for family trees). */
  died?: number;
  cause?: string;
  /** What the AI planner keeps for this person (memory, mood, plan); absent until the planner first runs. */
  mind?: Mind;
  /** Talks with each other person ('#<id>' -> count): enough of them and two adults may become partners. */
  bonds?: Record<string, number>;
  /** Expecting a baby: the father's entity id and the birth time (game seconds). */
  pregnant?: { father: number; due: number };
}

/** A person's mind for the LLM planner (milestone 6). Times are game seconds. */
export interface Mind {
  /** Short-term memory, newest last (at most 12). */
  notes: { at: number; text: string }[];
  /** Long-term memory, rewritten by the model (at most 400 characters). */
  summary: string;
  mood: string;
  /** Feelings about others, -5..5: '#<entity id>' for people of the world, '@<name>' for players. */
  rel: Record<string, number>;
  /** The current wish: an action name, maybe a person, until when. */
  plan?: { act: string; with?: number; why: string; until: number };
  /** When the planner last thought for this person. */
  lastPlan: number;
  /** Something big happened: plan again soon. */
  urgent?: boolean;
  said?: { at: number; text: string };
}

export const TRAIT_KEYS = ['strength', 'speed', 'intelligence', 'courage', 'empathy', 'metabolism'] as const;
export const YEAR = 365 * 24 * 3600;

const F = ['Amina', 'Sara', 'Lina', 'Nora', 'Yasmin', 'Hana', 'Maya', 'Leila', 'Ines', 'Zoe', 'Eva', 'Rita', 'Salma', 'Iris', 'Mira', 'Ada', 'Nadia', 'Rosa', 'Jade', 'Kenza', 'Tara', 'Lea', 'Asma', 'Vera'];
const M = ['Omar', 'Adam', 'Yusuf', 'Karim', 'Leo', 'Sami', 'Idris', 'Noah', 'Rayan', 'Tariq', 'Elias', 'Malik', 'Hugo', 'Ilyas', 'Jonas', 'Nabil', 'Ravi', 'Theo', 'Anas', 'Milo', 'Zaid', 'Bilal', 'Ivan', 'Hamza'];
const PERSONALITY = ['cautious', 'brave', 'kind', 'grumpy', 'curious', 'calm', 'stubborn', 'cheerful', 'shy', 'proud', 'loyal', 'sly',
  'generous', 'impatient', 'hard-working', 'dreamy'];

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

/** A random adult survivor (aged 18-45 when the world starts). */
export function randomProfile(rng: Rng, now: number, taken: Set<string>, year = YEAR): Profile {
  const sex: 'f' | 'm' = rng.chance(0.5) ? 'f' : 'm';
  const traits = {} as Traits;
  for (const k of TRAIT_KEYS) traits[k] = clamp01(0.5 + (rng.next() + rng.next() + rng.next() - 1.5) * 0.4);
  traits.lifespan = 60 + rng.next() * 25;
  return { name: uniqueName(rng, sex, taken), sex, born: now - (18 + rng.next() * 27) * year, traits, personality: pickPersonality(rng), parents: [], generation: 0, partner: -1 };
}

/** A baby: traits are the parents' average plus a mutation; personality partly from each. */
export function inherit(rng: Rng, a: Profile, b: Profile, ids: [number, number], now: number, taken: Set<string>, mutation = 0.08): Profile {
  const sex: 'f' | 'm' = rng.chance(0.5) ? 'f' : 'm';
  const traits = {} as Traits;
  for (const k of TRAIT_KEYS) {
    const w = rng.next();
    traits[k] = clamp01(a.traits[k] * w + b.traits[k] * (1 - w) + (rng.next() - 0.5) * 2 * mutation);
  }
  traits.lifespan = Math.max(40, (a.traits.lifespan + b.traits.lifespan) / 2 + (rng.next() - 0.5) * 10);
  const pool = [...a.personality, ...b.personality];
  const personality = [...new Set([pool[rng.int(pool.length)]!, rng.chance(0.5) ? pool[rng.int(pool.length)]! : PERSONALITY[rng.int(PERSONALITY.length)]!])];
  return { name: uniqueName(rng, sex, taken), sex, born: now, traits, personality, parents: [...ids], generation: Math.max(a.generation, b.generation) + 1, partner: -1 };
}

function pickPersonality(rng: Rng): string[] {
  const a = PERSONALITY[rng.int(PERSONALITY.length)]!;
  let b = PERSONALITY[rng.int(PERSONALITY.length)]!;
  if (b === a) b = PERSONALITY[(PERSONALITY.indexOf(a) + 5) % PERSONALITY.length]!;
  return [a, b];
}

function uniqueName(rng: Rng, sex: 'f' | 'm', taken: Set<string>): string {
  const list = sex === 'f' ? F : M;
  for (let k = 0; k < 8; k++) { const n = list[rng.int(list.length)]!; if (!taken.has(n)) return n; }
  let n = 2;
  const base = list[rng.int(list.length)]!;
  while (taken.has(`${base} ${n}`)) n++;
  return `${base} ${n}`;
}

/** Age in years (`year` = game seconds per year of age, `World.yearSec`). */
export function ageOf(p: Profile, now: number, year = YEAR): number { return (now - p.born) / year; }
