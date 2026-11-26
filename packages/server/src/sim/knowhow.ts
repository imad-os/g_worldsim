/**
 * What the people know about the things of their world (imad 2026-11-26: "every item in the sim should be defined with a phrase,
 * and people must be aware of its benefits and how to use it"). The phrases are ONE table in protocol/items.ts (the TV's bag shows
 * them too); this file turns them into prompt lines: the whole know-how once per request, and per person what they own and use.
 */
import { ITEM_INFO, itemText } from '@worldsim/protocol';
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
