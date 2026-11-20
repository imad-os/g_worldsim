import type { World } from './world.js';

/**
 * The owner's strict rules (imad 2026-11-20: "never talk to Jade"), for everyone or for one person, at most 5 each.
 * A rule is the owner's own words. It goes into every AI request about that person as something they must never
 * break, AND it is turned once into a check the engine enforces whatever the model says (`forbid` = skills /
 * actions, `with` = one person or anyone). The check comes from the words themselves (4 languages); when an AI is
 * on, the planner refines it once (Planner.compileRule) — the rule's words never need to match a fixed command.
 */
export interface Rule {
  text: string;
  /** Skills / actions that are forbidden (task skill names and brain action names alike). Empty = AI only. */
  forbid: string[];
  /** Entity id of the person the rule is about (-1 = anyone / nobody in particular). */
  with: number;
  withName?: string;
  /** Refined by the AI already. */
  ai?: boolean;
}
export const MAX_RULES = 5;
/** The brain's actions (Act ids) under the names rules use. */
export const ACT_RULE: Record<number, string> = { 1: 'wander', 2: 'drink', 3: 'eat', 4: 'forage', 5: 'sleep', 6: 'talk', 7: 'travel', 11: 'gather', 12: 'build', 13: 'fight' };
/** Every skill or action a rule can forbid. */
export const RULE_ACTS = ['talk', 'goto', 'follow', 'court', 'child', 'bring', 'give', 'trade', 'heal', 'fight', 'travel', 'eat', 'drink',
  'sleep', 'forage', 'collect', 'gather', 'craft', 'build', 'tend', 'loot', 'store', 'take', 'farm', 'repair', 'wander'] as const;

/** Words -> what they forbid. Order matters little: every match is added. */
const VERBS: [RegExp, string[]][] = [
  [/\b(talk|speak|chat|say|parl\w*|discut\w*|habl\w*|charl\w*)\b|تكلم|تتكلم|تحدث|يتحدث|كلم/, ['talk', 'court', 'child']],
  [/\b(avoid|stay away|keep away|go near|approach|come near|touch|évite|eloigne|éloigne|approche|evita|acerca|aléjate|alejate)\b|ابتعد|تجنب|لا تقترب|اقترب/, ['talk', 'goto', 'follow', 'bring', 'give', 'trade', 'heal', 'court', 'child']],
  [/\b(follow|suis|suivre|sigue|seguir)\b|اتبع|تتبع/, ['follow']],
  [/\b(go to|visit|va voir|aller voir|ve a|visita)\b|اذهب إلى|(^|\s)زر(\s|$)/, ['goto']],
  [/\b(marry|court|date|love|partner|wife|husband|épouse|mari|marie|amour|novi\w*|cas\w*|esposa|esposo)\b|تزوج|زواج|حب/, ['court']],
  [/\b(child|baby|kid|enfant|bébé|bebe|niño|hijo)\b|طفل|ولد|بيبي/, ['child']],
  [/\b(give|share|donne|partage|da|dar|comparte)\b|أعط|اعط|شارك/, ['give', 'bring']],
  [/\b(trade|swap|exchange|échange|cambia|intercambia)\b|بادل|تبادل/, ['trade']],
  [/\b(heal|treat|soigne|cura)\b|عالج|داو/, ['heal']],
  [/\b(fight|attack|kill|hit|combat\w*|attaque|tue|pelea|ataca|mata)\b|قاتل|هاجم|اقتل|اضرب/, ['fight']],
  [/\b(travel|leave town|leave the town|go to the woods|voyage|quitte|viaja|sal del pueblo)\b|سافر|غادر/, ['travel']],
  [/\b(eat|mange|come|comer)\b|(^|\s)(كل|تأكل|أكل|ياكل)(\s|$)/, ['eat']],
  [/\b(sleep|dors|dormir|duerme)\b|(^|\s)(نم|تنام|نوم)(\s|$)/, ['sleep']],
  [/\b(chop|cut trees?|wood|coupe|bois|tala|madera)\b|احطب|اقطع/, ['gather']],
  [/\b(build|construi\w*|construy\w*)\b|(^|\s)ابن(\s|$)|بناء/, ['build']],
  [/\b(loot|scavenge|search the ruins|fouill\w*|saque\w*)\b|فتش/, ['loot']],
  [/\b(forage|collect|pick|gather food|ramass\w*|cueill\w*|recog\w*)\b|اجمع|التقط/, ['forage', 'collect']],
  [/\b(store|stock|stash|range|guarda|almacena)\b|خزن/, ['store']],
  [/\b(plant|farm|sow|plante|cultiv\w*|siembra)\b|ازرع|زراعة/, ['farm']],
  [/\b(repair|fix|répare|repare|arregla)\b|أصلح|اصلح/, ['repair']],
  [/\b(wander|roam|err\w*|vagabond\w*|deambul\w*)\b|تجول/, ['wander']],
  [/\b(take from the store|steal|vole|roba)\b|اسرق/, ['take']],
];
const NEVER = /\b(avoid|stay away|keep away|évite|evita|aléjate|alejate|never|don'?t|do not|no|not|stop|jamais|ne |n'|pas|nunca|no |deja de)\b|لا|أبدا|ابدا|ممنوع|توقف|ابتعد|تجنب/;

/** Turn the owner's words into a check (no AI): the forbidden things and the person named in it. */
export function compileRule(w: World, text: string, nameOf: (name: string) => number): Rule {
  const t = ' ' + text.toLowerCase().replace(/[’']/g, "'") + ' ';
  const forbid = new Set<string>();
  if (NEVER.test(t)) for (const [re, acts] of VERBS) if (re.test(t)) for (const a of acts) forbid.add(a);
  // A name in the rule: a person of the world or a player.
  let withId = -1, withName: string | undefined;
  const names = [...w.profiles.values()].filter((p) => p.died === undefined).map((p) => p.name);
  for (const n of names.sort((a, b) => b.length - a.length)) {
    if (new RegExp(`(^|[^\\p{L}])${n.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}([^\\p{L}]|$)`, 'u').test(t)) { withName = n; break; }
  }
  if (!withName) for (const word of text.split(/[^\p{L}\d_-]+/u)) { if (word.length >= 2 && nameOf(word) >= 0) { withName = word; break; } }
  if (withName) withId = nameOf(withName);
  return { text: text.trim().slice(0, 160), forbid: [...forbid], with: withId, withName };
}

export class Rules {
  /** Rules for everyone (meta `rules_all`). */
  all: Rule[] = [];
  constructor(private w: World) {}

  /** Every rule that applies to person i: everyone's, then their own. */
  of(i: number): Rule[] {
    const own = this.w.profileOf(i)?.rules ?? [];
    return own.length ? [...this.all, ...own] : this.all;
  }

  /**
   * Is person i (entity index) forbidden to `act` with person j (entity index, -1 = nobody in particular)? Returns the
   * rule's words, or null. A rule about one person only forbids things done with that person; a rule about nobody
   * forbids the act itself.
   */
  forbidden(i: number, act: string, j = -1): string | null {
    if (i < 0) return null;
    const list = this.of(i);
    if (!list.length) return null;
    const jid = j >= 0 ? this.w.e.id(j) : -1;
    for (const r of list) {
      if (!r.forbid.includes(act)) continue;
      if (r.with >= 0 ? r.with === jid : true) return r.text;
    }
    return null;
  }
  /** Either of the two may not `act` with the other (talking takes two). */
  between(i: number, j: number, act: string): string | null { return this.forbidden(i, act, j) ?? (j >= 0 ? this.forbidden(j, act, i) : null); }
  /** Same, with entity ids (-1 = nobody). */
  forbiddenId(id: number, act: string, withId = -1): string | null {
    const e = this.w.e, i = e.slot(id);
    return i < 0 ? null : this.forbidden(i, act, withId >= 0 ? e.slot(withId) : -1);
  }

  /** Characters get new entity ids after a restart: find the named person again. */
  resolve(nameOf: (name: string) => number): void {
    const fix = (r: Rule) => { if (r.withName) r.with = nameOf(r.withName); };
    this.all.forEach(fix);
    for (const p of this.w.profiles.values()) p.rules?.forEach(fix);
  }

  /** The words for the AI prompt ('' = none). */
  text(i: number): string {
    const list = this.of(i);
    return list.length ? `Rules you must NEVER break (your owner's orders, stronger than anything else): ${list.map((r) => `"${r.text}"`).join('; ')}.` : '';
  }
}
