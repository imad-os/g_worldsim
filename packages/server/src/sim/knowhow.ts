/**
 * What the people know about the things of their world (imad 2026-11-26: "every item in the sim should be defined with a phrase,
 * and people must be aware of its benefits and how to use it"). The phrases are ONE table in protocol/items.ts (the TV's bag shows
 * them too); this file turns them into prompt lines: the whole know-how once per request, and per person what they own and use.
 */
import { ITEM_INFO, itemText, RECIPES_ALL, HUT_NEED, HOUSE_NEED } from '@worldsim/protocol';
import type { World } from './world.js';

const ORDER: string[] = ['material', 'food', 'weapon', 'wear', 'healing', 'defence', 'furniture', 'building', 'animal'];
/** Every thing and what it is for, in English, for the model (one line). */
export const KNOW_HOW = 'What things are for (use them: they keep you alive): '
  + Object.entries(ITEM_INFO).sort((a, b) => ORDER.indexOf(a[1].kind) - ORDER.indexOf(b[1].kind)).map(([, v]) => v.text.en).join(' ');

/** The short benefit of a thing (the phrase up to its first full stop, without the name). */
export function benefit(id: string): string {
  const t = itemText(id);
  if (!t) return '';
  const body = t.replace(/^[^:]*:\s*/, '');
  return body.split(/\.\s/)[0]!.replace(/\.$/, '');
}

/** What person i carries that is more than a material, each with what it does for them ("axe (chops trees ...)"). */
export function ownText(w: World, i: number): string {
  const v = w.survival.inv(i), out: string[] = [];
  for (const [k, n] of Object.entries(v)) {
    if (!n || !ITEM_INFO[k] || ITEM_INFO[k]!.kind === 'material') continue;
    out.push(`${n > 1 ? n + ' ' : ''}${k} (${benefit(k)})`);
  }
  return out.length ? `Your things: ${out.join('; ')}.` : '';
}

// ------------------------------------------------------------------ short know-how (imad 2026-11-27: "the prompts got very long, slow, timeouts")
/** Where every material comes from, in one line (the build / craft steps gather what is missing by themselves). */
export const SOURCES = 'Where materials come from: wood = trees (an axe gives 2 a blow); stone = rubble or rocks; scrap = rubble and ruins; ore = rocks (1 in 10 blows); '
  + 'brick = rubble; leather = hunted animals (scarce); claws = wolves and bears; herbs = leafy patches by the trees. Build and craft steps gather what is missing by themselves.';
const ALIAS: Record<string, string> = { field: 'farm', store: 'crate', 'first-aid kit': 'medkit', armour: 'armor', claws: 'claw', herbs: 'herb', bricks: 'brick', 'stone wall': 'stonewall', fire: 'campfire' };
/** What a thing costs: "2 wood + 1 leather" (both ways for a spear), '' = nothing to make. */
export function recipeOf(id: string): string {
  if (id === 'hut') return Object.entries(HUT_NEED).map(([k, n]) => `${n} ${k}`).join(' + ');
  if (id === 'house') return Object.entries(HOUSE_NEED).map(([k, n]) => `${n} ${k}`).join(' + ');
  return RECIPES_ALL.filter((r) => r.what === id).map((r) => Object.entries(r.need).map(([k, n]) => `${n} ${k}`).join(' + ')).join(' or ');
}
/** One short line for a thing: "axe (1 wood + 1 stone): chops trees for 2 wood a blow ...". */
export function briefOf(id: string): string {
  const b = benefit(id);
  if (!b) return '';
  const r = recipeOf(id);
  return `${id === 'crate' ? "the camp's store" : id === 'farm' ? 'field' : id}${r ? ` (${r})` : ''}: ${b}`;
}
/** The things named in some words ("make me a lamp" -> lamp). */
export function mentioned(text: string): string[] {
  const t = ' ' + text.toLowerCase() + ' ', out = new Set<string>();
  for (const id of Object.keys(ITEM_INFO)) if (new RegExp(`\\b${id}s?\\b`).test(t)) out.add(id);
  for (const [k, id] of Object.entries(ALIAS)) if (t.includes(k)) out.add(id);
  return [...out];
}
/** Short know-how for only these things (the ones a prompt's people can use or make now), '' = none. */
export function knowHowFor(ids: Iterable<string>): string {
  const set = [...new Set(ids)].filter((id) => ITEM_INFO[id] && ITEM_INFO[id]!.kind !== 'material');
  set.sort((a, b) => ORDER.indexOf(ITEM_INFO[a]!.kind) - ORDER.indexOf(ITEM_INFO[b]!.kind));
  return set.length ? `What things are for (cost: use): ${set.map(briefOf).filter(Boolean).join('; ')}.` : '';
}
