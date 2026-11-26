import { Act, Kind } from '@worldsim/protocol';
import { NO_MAP } from './entities.js';
import { ageOf, editDist } from './people.js';
import type { Step } from './tasks.js';
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
  /**
   * What kind of rule (imad 2026-11-20: "rules are not respected", every rule he gave was a "must"):
   * never = forbids things (`forbid`), goal = something they must work on until it is true (`goal`, `plan`),
   * when = when they see `with`, they say `say` (an engine trigger, never left to the model).
   */
  kind?: 'never' | 'goal' | 'when';
  goal?: 'marry' | 'child' | 'plan';
  /** goal 'plan': the steps made of the words (by the engine from the words it knows, else by the AI; sim/tasks.ts skills). */
  plan?: Step[];
  /** goal 'plan' (imad 2026-11-25: "you must hunt every day"): how often, in game seconds (0 = once, then done). */
  every?: number;
  /** goal 'plan': only between these hours of the day ([from, to), to < from = over midnight). */
  hours?: [number, number];
  /** Who made the plan: the engine from the words, or the AI. */
  by?: 'words' | 'ai';
  say?: string;
}
/** How a person is keeping a rule (Profile.mind.ruled, by the rule's words). */
export interface RuleLog { ok: number; fail: number; last?: number; tried?: number; why?: string }
export const MAX_RULES = 5;
/** The brain's actions (Act ids) under the names rules use. */
export const ACT_RULE: Record<number, string> = { 1: 'wander', 2: 'drink', 3: 'eat', 4: 'forage', 5: 'sleep', 6: 'talk', 7: 'travel', 11: 'gather', 12: 'build', 13: 'fight' };
/** Every skill or action a rule can forbid. */
export const RULE_ACTS = ['talk', 'goto', 'follow', 'court', 'child', 'bring', 'give', 'trade', 'heal', 'fight', 'travel', 'eat', 'drink',
  'sleep', 'forage', 'collect', 'gather', 'craft', 'build', 'tend', 'loot', 'store', 'take', 'farm', 'repair', 'wander', 'hunt', 'tame'] as const;

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
  [/\b(hunt\w*|chass\w*|caz\w*)\b|اصطد|صطاد|صيد/, ['hunt']],
  [/\b(tame|horses?|dompt\w*|cheva\w*|doma\w*|caballos?)\b|روض|ترويض|حصان|خيل/, ['tame']],
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
const WHEN = /\b(when(ever)?|each time|every time|if you (see|meet)|quand|lorsque|chaque fois|si tu vois|cuando|cada vez|si ves)\b|عندما|لما|كلما|إذا رأيت|اذا رأيت|اذا شفت/;
const SEE = /\b(see|meet|met|sees|vois|rencontre|ves|veas|encuentras)\b|ترى|تشوف|رأيت|شفت|تقابل/;
const MARRY = /\b(marr(y|ied|iage)|husband|wife|partner|spouse|mari|épou\w*|epou\w*|se marier|mari(é|e)e?|cas(ar|ate|arse)|espos[oa]|novi[oa])\b|تزوج|زواج|زوج|عروس/;
const CHILD = /\b(reproduce|kids?|child(ren)?|bab(y|ies)|family|enfants?|bébés?|bebes?|famille|reprodu\w*|niños?|hijos?|bebés?|familia)\b|أطفال|طفل|ولد|اولاد|أولاد|تكاثر|إنجاب|انجاب|ذرية/;
const NEVER = /\b(avoid|stay away|keep away|évite|evita|aléjate|alejate|never|don'?t|do not|no|not|stop|jamais|ne |n'|pas|nunca|no |deja de)\b|لا|أبدا|ابدا|ممنوع|توقف|ابتعد|تجنب/;

/** "never forget to ...", "no matter what" are orders to DO: read as "must" before looking for a "no". */
const NOT_A_NO = /\b(never|don'?t|do not) forget( to)?\b|\bno matter( what| how)?\b|\bn'oublie (jamais|pas)( de)?\b|\bno (te )?olvides( de)?\b|\bsin falta\b|لا تنس[ى]?|مهما/g;
/** Words of an order to do something (imad 2026-11-25: "you must hunt every day"). */
const MUST = /\b(must|have to|has to|need to|needs to|should|always|every|each|daily|nightly|hourly|go and|dois|doit|devez|il faut|faut|toujours|chaque|tous les|toutes les|debes|debe|tienes que|tiene que|hay que|siempre|cada|todos los|todas las)\b|يجب|لازم|عليك|دائما|كل يوم|كل ليلة|كل صباح/;
/** Orders to do something the engine knows without an AI: words -> the steps of one round. */
const DO: [RegExp, (t: string) => Step[]][] = [
  [/\b(hunt\w*|chass\w*|caz\w*)\b|اصطد|صطاد|صيد/, (t) => [{ do: 'hunt', what: animalIn(t), times: countIn(t, 1, 4) }]],
  [/\b(tame|dompt\w*|doma\w*)\b|روض|ترويض/, () => [{ do: 'tame' }]],
  [/\b(chop|cut (down )?trees?|wood|firewood|logs?|coupe\w*|bois|tala\w*|le[ñn]a|madera)\b|احطب|حطب|خشب|اقطع/, (t) => [{ do: 'gather', what: 'wood', times: countIn(t, 3, 8) }]],
  [/\b(ore|iron|minerai|fer|hierro)\b|خام|حديد/, (t) => [{ do: 'gather', what: 'ore', times: countIn(t, 2, 6) }]],
  [/\b(mine|stones?|rocks?|pierres?|roches?|piedras?|rocas?)\b|حجر|حجارة|صخر/, (t) => [{ do: 'gather', what: 'stone', times: countIn(t, 3, 8) }]],
  [/\b(scrap|metal|ferraille|chatarra)\b|خردة/, (t) => [{ do: 'gather', what: 'scrap', times: countIn(t, 2, 6) }]],
  [/\b(loot|scavenge|search the ruins|fouill\w*|saque\w*)\b|فتش/, (t) => [{ do: 'loot', times: countIn(t, 2, 5) }]],
  [/\b(plant|farm|sow|crops?|garden|plante\w*|cultiv\w*|siembra\w*|sembrar)\b|ازرع|زراعة/, () => [{ do: 'farm' }]],
  [/\b(store|stock|stash|guarda\w*|almacen\w*|stocke\w*)\b|خزن/, () => [{ do: 'store', what: 'food' }]],
  [/\b(forage|collect|pick|gather food|find food|get food|food|ramass\w*|cueill\w*|recog\w*|nourriture|comida)\b|اجمع|التقط|طعام|أكل/, (t) => [{ do: 'collect', what: 'food', times: countIn(t, 3, 8) }]],
  [/\b(repair|fix|mend|répar\w*|repar\w*|arregl\w*)\b|أصلح|اصلح/, () => [{ do: 'repair' }]],
  [/\b(fire|feed the fire|campfire|feu|fuego|hoguera)\b|نار/, (t) => /\b(build|make|light|allume|construi|enciende|haz)\b|ابن|اشعل|أشعل/.test(t) ? [{ do: 'build', what: 'campfire' }] : [{ do: 'tend' }]],
  [/\b(build|construi\w*|construy\w*|make|craft|fabriqu\w*|fais|haz|fabric\w*)\b|(^|\s)ابن(\s|$)|بناء|اصنع/, (t) => {
    const thing = /\b(hut|house|cabane|maison|cabaña|casa)\b|كوخ|بيت/.test(t) ? 'hut' : /\b(wall|palisade|mur|muro|palissade|empalizada)\b|سور|جدار/.test(t) ? 'palisade'
      : /\b(spikes?|pieux|pinchos)\b|أوتاد/.test(t) ? 'spikes' : /\b(bed|lit|cama)\b|سرير/.test(t) ? 'bed' : /\b(lamp|lampe|lámpara|lampara)\b|مصباح/.test(t) ? 'lamp'
        : /\b(door|porte|puerta)\b|باب/.test(t) ? 'door' : '';
    if (thing) return [{ do: 'build', what: thing }];
    const item = /\b(spear|lance|lanza)\b|رمح/.test(t) ? 'spear' : /\b(axe|hache|hacha)\b|فأس/.test(t) ? 'axe' : /\b(sword|épée|epee|espada)\b|سيف/.test(t) ? 'sword'
      : /\b(bow|arc|arco)\b|قوس/.test(t) ? 'bow' : /\b(arrows?|flèches?|fleches?|flechas?)\b|سهم|سهام/.test(t) ? 'arrow' : /\b(clothes|vêtements|ropa)\b|ملابس/.test(t) ? 'clothes'
        : /\b(armou?r|armure|armadura)\b|درع/.test(t) ? 'armor' : '';
    return item ? [{ do: 'craft', what: item }] : [];
  }],
  [/\b(heal|treat|care for the (sick|wounded)|soign\w*|cura\w*)\b|عالج|داو/, () => [{ do: 'heal' }]],
  [/\b(drink|bois de l'eau|bebe\w*)\b|اشرب/, () => [{ do: 'drink' }]],
  [/\b(sleep|dors|dormir|duerme)\b|(^|\s)(نم|تنام)(\s|$)/, () => [{ do: 'sleep' }]],
];
/** Orders that are done once (a hut every day would fill the map): no "every ..." word = once. */
const ONCE = new Set(['build', 'craft', 'tame']);
const ANIMALS: [RegExp, string][] = [[/\b(rabbits?|lapins?|conejos?)\b|أرنب|ارانب/, 'rabbit'], [/\b(deer|cerfs?|biches?|ciervos?|venados?)\b|غزال|غزلان|أيل/, 'deer'],
  [/\b(boars?|sangliers?|jabal[ií]e?s?)\b|خنزير/, 'boar'], [/\b(wol(f|ves)|loups?|lobos?)\b|ذئب|ذئاب/, 'wolf'], [/\b(bears?|ours|osos?)\b|دب/, 'bear']];
function animalIn(t: string): string { for (const [re, a] of ANIMALS) if (re.test(t)) return a; return ''; }
const NUMS: Record<string, number> = { one: 1, a: 1, an: 1, two: 2, twice: 2, three: 3, four: 4, five: 5, six: 6, un: 1, une: 1, deux: 2, trois: 3, quatre: 4, cinq: 5, uno: 1, una: 1, dos: 2, tres: 3, cuatro: 4, cinco: 5 };
/** A number of things in the words ("hunt 2 deer", "chop five trees"), between 1 and max; not the one of "every 2 days". */
function countIn(t: string, dflt: number, max: number): number {
  const u = t.replace(/\b(every|each|chaque|tous les|toutes les|cada|todos los|todas las)\s+\S+\s+(hours?|days?|heures?|jours?|horas?|d[ií]as?)\b/g, ' ');
  const m = /\b(\d{1,2}|one|two|three|four|five|six|deux|trois|quatre|cinq|dos|tres|cuatro|cinco)\s+(\p{L}+)/u.exec(u);
  const n = m ? Number(m[1]) || NUMS[m[1]!] || dflt : dflt;
  return Math.max(1, Math.min(max, n));
}
const DAY = 86400;
/** How often and when, from the words: every hour / N hours / day / N days / week, twice a day; morning, evening, night. */
function periodOf(t: string): { every?: number; hours?: [number, number] } {
  const out: { every?: number; hours?: [number, number] } = {};
  let m: RegExpExecArray | null;
  if ((m = /\b(every|each|chaque|tous les|toutes les|cada|todos los|todas las)\s+(\d{1,2}|two|three|four|five|six|deux|trois|quatre|cinq|dos|tres|cuatro|cinco)\s+(hours?|heures?|horas?)\b/.exec(t))) out.every = (Number(m[2]) || NUMS[m[2]!] || 1) * 3600;
  else if ((m = /\b(every|each|chaque|tous les|toutes les|cada|todos los|todas las)\s+(\d{1,2}|two|three|four|five|six|deux|trois|quatre|cinq|dos|tres|cuatro|cinco)\s+(days?|jours?|d[ií]as?)\b/.exec(t))) out.every = (Number(m[2]) || NUMS[m[2]!] || 1) * DAY;
  else if (/\b(hourly|every hour|each hour|chaque heure|toutes les heures|cada hora)\b|كل ساعة/.test(t)) out.every = 3600;
  else if (/\b(twice a day|two times a day|deux fois par jour|dos veces al d[ií]a)\b|مرتين في اليوم/.test(t)) out.every = DAY / 2;
  else if (/\b(weekly|every week|each week|chaque semaine|toutes les semaines|cada semana)\b|كل أسبوع|كل اسبوع/.test(t)) out.every = 7 * DAY;
  else if (/\b(daily|every ?day|each day|a day|per day|every (morning|evening|night)|each (morning|evening|night)|nightly|chaque (jour|matin|soir|nuit)|tous les (jours|matins|soirs)|toutes les nuits|par jour|cada (d[ií]a|mañana|manana|tarde|noche)|todos los d[ií]as|todas las (mañanas|noches|tardes)|al d[ií]a|always|toujours|siempre)\b|كل يوم|يوميا|كل صباح|كل ليلة|كل مساء|دائما/.test(t)) out.every = DAY;
  if (/\b(morning|mornings|dawn|matin|matins|aube|mañana|manana|mañanas)\b|صباح|الفجر/.test(t)) out.hours = [6, 11];
  else if (/\b(afternoon|après-midi|apres-midi|tarde)\b|بعد الظهر/.test(t)) out.hours = [12, 17];
  else if (/\b(evening|evenings|dusk|soir|soirs|soirée|crepúsculo|atardecer)\b|مساء|المغرب/.test(t)) out.hours = [17, 21];
  else if (/\b(night|nights|nightly|nuit|nuits|noche|noches)\b|ليل|ليلة/.test(t)) out.hours = [20, 5];
  return out;
}
/** Is it an order to DO (not a "never")? */
export function isMust(text: string): boolean {
  const t = ' ' + text.toLowerCase().replace(/[’']/g, "'").replace(NOT_A_NO, ' must ') + ' ';
  return !NEVER.test(t) && (MUST.test(t) || DO.some(([re]) => re.test(t)));
}
/** The steps the engine reads in an order to do something ([] = it does not know these words). */
export function stepsOfWords(text: string): Step[] {
  const t = ' ' + text.toLowerCase().replace(/[’']/g, "'") + ' ';
  for (const [re, f] of DO) if (re.test(t)) { const st = f(t); if (st.length) return st; }
  return [];
}
/** Words after "to / with / from / à / avec / con / de / مع" that look like a name (capital letter): the person a rule is about. */
const ABOUT = /\b(?:to|with|from|near|see|meet|à|a|avec|de|con|ver|par|para)\s+([\p{Lu}][\p{L}\d_-]{1,30})/gu;

/** Turn the owner's words into a check (no AI): the forbidden things and the person named in it. */
export function compileRule(w: World, text: string, nameOf: (name: string) => number): Rule {
  const t = ' ' + text.toLowerCase().replace(/[’']/g, "'").replace(NOT_A_NO, ' must ') + ' ';
  const forbid = new Set<string>();
  if (NEVER.test(t)) for (const [re, acts] of VERBS) if (re.test(t)) for (const a of acts) forbid.add(a);
  // A name in the rule: a person of the world or a player.
  let withId = -1, withName: string | undefined;
  const names = [...w.profiles.values()].filter((p) => p.died === undefined).map((p) => p.name);
  for (const n of names.sort((a, b) => b.length - a.length)) {
    if (new RegExp(`(^|[^\\p{L}])${n.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}([^\\p{L}]|$)`, 'u').test(t)) { withName = n; break; }
  }
  if (!withName) for (const word of text.split(/[^\p{L}\d_-]+/u)) { if (word.length >= 2 && nameOf(word) >= 0) { withName = word; break; } }
  // A name typed with a slip ("Miceal"): the closest person, 1 letter off (2 for long names).
  const typed = [...text.matchAll(ABOUT)].map((m) => m[1]!);
  if (!withName) {
    let best = 9;
    for (const word of typed) for (const n of names) {
      const d = editDist(word.toLowerCase(), n.toLowerCase());
      if (d < best && d <= (n.length >= 6 ? 2 : 1)) { best = d; withName = n; }
    }
  }
  if (withName) withId = nameOf(withName);
  // Nobody of that name (yet): the rule is about them, and blocks nothing until they are here (never "everyone").
  else if (typed.length && forbid.size) withName = typed[0];
  return classify({ text: text.trim().slice(0, 160), forbid: [...forbid], with: withId, withName }, nameOf);
}

/**
 * The rule's kind from its words (also for rules saved before kinds existed): "never ..." forbids; "when you see X,
 * say '...'" is a trigger; anything else is a goal they must work on (marry, have children, or the AI's plan).
 */
export function classify(r: Rule, nameOf: (name: string) => number = () => -1): Rule {
  const t = ' ' + r.text.toLowerCase().replace(/[’']/g, "'") + ' ';
  const quoted = [...r.text.matchAll(/["“«']([^"”»']{1,80})["”»']/g)].map((m) => m[1]!.trim()).filter(Boolean);
  if (WHEN.test(t) && (SEE.test(t) || quoted.length)) {
    // The person: a quoted name or the name found already; what to say: the other quoted words, or what follows "say" / "with".
    let see = r.withName;
    if (!see) for (const q of quoted) if (nameOf(q) >= 0) { see = q; break; }
    if (!see) { const m = /\b(see|meet|vois|ves|veas)\s+([\p{L}\d_-]+)/u.exec(r.text); if (m && nameOf(m[2]!) >= 0) see = m[2]; }
    let say = quoted.find((q) => q.toLowerCase() !== (see ?? '').toLowerCase());
    if (!say) { const m = /\b(say|tell|greet\w*|great\w*|dis|dire|di|decir|salu\w*)\b[^"]*?(with|:|that)?\s*(.+)$/iu.exec(r.text); if (m) say = m[3]!.replace(/^(him|her|them|lui|le|la|le dice)\s+/i, '').trim(); }
    if (see && say) {
      r.kind = 'when'; r.say = say.slice(0, 120); r.withName = see;
      const id = nameOf(see); if (id >= 0) r.with = id;
      r.forbid = [];
      return r;
    }
  }
  const yes = ' ' + r.text.toLowerCase().replace(/[’']/g, "'").replace(NOT_A_NO, ' must ') + ' ';
  if (r.forbid.length || NEVER.test(yes)) { r.kind = 'never'; delete r.goal; delete r.plan; delete r.every; delete r.hours; return r; }
  r.kind = 'goal';
  // Work the engine knows ("hunt", "chop wood", "farm"...) comes before marriage words ("hunt every day for your family").
  const steps = stepsOfWords(r.text);
  if (steps.length) { r.goal = 'plan'; r.plan = steps; r.by = 'words'; }
  else if (r.by === 'ai' && r.plan?.length) r.goal = 'plan';
  else r.goal = CHILD.test(t) ? 'child' : MARRY.test(t) ? 'marry' : r.plan?.length ? 'plan' : r.goal === 'plan' ? 'plan' : undefined;
  if (r.goal === 'plan') {
    const when = periodOf(yes);
    const first = r.plan?.[0]?.do ?? '';
    r.every = when.every ?? (ONCE.has(first) ? 0 : DAY);
    if (when.hours) r.hours = when.hours; else delete r.hours;
  }
  return r;
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
      if (r.with < 0 && r.withName) continue; // about someone who is not here (yet): blocks nothing, never "everyone"
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

  /** Characters get new entity ids after a restart: find the named person again (and give old rules their kind). */
  resolve(nameOf: (name: string) => number): void {
    this.nameOf = nameOf;
    const fix = (r: Rule) => {
      // Saved before orders to DO were understood (imad 2026-11-25: "it seems only the first kind works"): an order the
      // model mistook for a "never" (it forbade the very thing to do), or a goal with no steps, is read again.
      if (r.kind !== 'when' && isMust(r.text) && (r.kind === 'never' || (r.kind === 'goal' && (!r.goal || (r.goal === 'plan' && r.every === undefined))))) {
        r.forbid = []; delete r.kind; if (r.plan?.length && !r.by) r.by = 'ai';
      }
      if (!r.kind) classify(r, nameOf);
      if (r.withName) r.with = nameOf(r.withName);
    };
    this.all.forEach(fix);
    for (const p of this.w.profiles.values()) p.rules?.forEach(fix);
  }

  /** The words for the AI prompt ('' = none). Triggers ("when you see X say Y") are the engine's: not in the prompt. */
  text(i: number): string {
    const list = this.of(i);
    const never = list.filter((r) => r.kind !== 'goal' && r.kind !== 'when'), goals = list.filter((r) => r.kind === 'goal');
    const out: string[] = [];
    if (never.length) out.push(`Rules you must NEVER break (your owner's orders, stronger than anything else): ${never.map((r) => `"${r.text}"`).join('; ')}.`);
    if (goals.length) out.push(`Your owner's orders, your main goals until they are done (choose goals that move them forward): ${goals.map((r) => `"${r.text}"`).join('; ')}.`);
    return out.join('\n');
  }

  /** When the trigger rules last fired: '<person id>:<rule text>' -> game seconds. */
  private fired = new Map<string, number>();
  /** Last try of a goal: '<person id>:<rule text>' -> game seconds (a failed try waits before the next). */
  private tried = new Map<string, number>();
  private nameOf: (name: string) => number = () => -1;
  private ticks = 0;
  /** Says a line for person i (the planner's say: bubbles, chat, timeline). */
  onSay: (i: number, text: string) => void = () => {};

  /** Person i's record of keeping a rule (made on first use). */
  log(i: number, r: Rule, make = false): RuleLog | undefined {
    const p = this.w.profileOf(i);
    if (!p) return undefined;
    if (!make) return p.mind?.ruled?.[r.text];
    p.mind ??= { notes: [], summary: '', mood: 'calm', rel: {}, lastPlan: 0 };
    return ((p.mind.ruled ??= {})[r.text] ??= { ok: 0, fail: 0 });
  }
  /** The game day number (days start at midnight of the game clock). */
  private day(sec: number): number { return Math.floor((sec / 3600 + 8) / 24); }
  /** Is an order to DO due for person i now? (done this period already, or outside its hours = no) */
  due(i: number, r: Rule): boolean {
    const now = this.w.gameSec, l = this.log(i, r), every = r.every ?? DAY;
    if (r.hours) {
      const h = this.w.brain.hour(), [a, b] = r.hours;
      if (a <= b ? h < a || h >= b : h < a && h >= b) return false;
    }
    if (l?.last === undefined) return every > 0 || !l?.ok;
    if (every <= 0) return false; // once, and done
    if (every >= DAY) return this.day(now) - this.day(l.last) >= Math.round(every / DAY);
    return now - l.last >= every;
  }
  /** A task that came from a rule ended (sim/tasks.ts): count it. */
  ended(i: number, text: string, ok: boolean, why: string): void {
    const r = this.of(i).find((x) => x.text === text);
    if (!r) return;
    const l = this.log(i, r, true)!;
    if (ok) { l.ok++; l.last = this.w.gameSec; delete l.why; } else { l.fail++; l.why = why.slice(0, 80); }
    this.w.emit('rule', { id: this.w.e.id(i), text, did: ok ? 'done' : 'failed', why: ok ? undefined : why.slice(0, 80) });
  }
  /** May a rule's task push this one aside? Their own work, the camp's and quests: yes; an order from the owner, a player or another rule: no. */
  private yields(t: { from: string; rule?: string }): boolean {
    if (t.rule || t.from === 'owner' || t.from === 'the voice from the sky') return false;
    for (const p of this.w.profiles.values()) if (p.player && p.player === t.from) return false;
    return true;
  }

  /**
   * The engine's side of the rules (World.step, every 20 ticks): triggers fire when the person comes near, goals become
   * tasks the person works on until the goal is true (sim/tasks.ts), with a pause after a failed try. Orders to DO
   * ("you must hunt every day") come back every period; they push the person's own work aside, never an order.
   */
  update(): void {
    const w = this.w, e = w.e, now = w.gameSec, y = w.life.yearSec;
    if (++this.ticks % 60 === 0) { // someone named in a rule may have come (born, joined): look again now and then
      const fix = (r: Rule) => { if (r.withName && r.with < 0) r.with = this.nameOf(r.withName); };
      this.all.forEach(fix);
      for (const p of w.profiles.values()) p.rules?.forEach(fix);
    }
    const any = this.all.length > 0;
    for (let i = 0; i < e.hi; i++) {
      if (e.kind[i] !== Kind.Agent || e.map[i] === NO_MAP) continue;
      const p = w.profileOf(i);
      if (!p || (!any && !p.rules?.length)) continue;
      const id = e.id(i);
      for (const r of this.of(i)) {
        if (r.kind === 'when') {
          if (r.with < 0 || !r.say || e.act[i] === Act.Sleep) continue;
          const j = e.slot(r.with);
          if (j < 0 || j === i || e.map[j] !== e.map[i] || Math.hypot(e.x[j]! - e.x[i]!, e.y[j]! - e.y[i]!) > 7) continue;
          const k = `${id}:${r.text}`, last = this.fired.get(k);
          if (last !== undefined && now - last < 2 * 3600) continue; // once per meeting (2 game hours)
          this.fired.set(k, now);
          e.angle[i] = Math.atan2(e.y[j]! - e.y[i]!, e.x[j]! - e.x[i]!);
          this.onSay(i, r.say);
          w.emit('rule', { id, text: r.text, did: 'said', to: r.with });
          continue;
        }
        if (r.kind !== 'goal' || !r.goal) continue;
        if (w.family.lyingIn(i)) continue; // home with a newborn this week: the rule waits (sim/family.ts)
        const task = p.mind?.task as { from: string; rule?: string } | undefined;
        if (ageOf(p, now, y) < (r.goal === 'plan' ? 16 : 18)) continue; // a child
        if (e.hunger[i]! > 70 || e.thirst[i]! > 70 || e.tired[i]! > 85 || e.act[i] === Act.Sleep) continue; // needs first
        if (task && (r.goal !== 'plan' || !this.yields(task))) continue; // busy with an order (maybe this one)
        if (r.goal === 'plan' && !this.due(i, r)) continue;
        const k = `${id}:${r.text}`, last = this.tried.get(k);
        if (last !== undefined && now - last < 2 * 3600) continue;
        const steps = this.stepsFor(i, r);
        if (!steps) continue; // already true
        this.tried.set(k, now);
        if (r.goal === 'plan') this.log(i, r, true)!.tried = now;
        if (w.tasks.start(i, r.goal === 'plan' ? r.text : r.goal === 'marry' ? 'get married (owner\'s order)' : 'have a child (owner\'s order)', 'owner', steps)) {
          const t = p.mind!.task as { rule?: string };
          t.rule = r.text;
          w.emit('rule', { id, text: r.text, did: 'started' });
          break; // one task at a time
        }
      }
    }
  }

  /** How the engine understood a rule, in words (the panel shows it). */
  static how(r: Rule): string {
    if (r.kind === 'when') return `trigger: says "${r.say ?? ''}" when ${r.withName ?? '?'} is within 7 m (once per 2 game hours)`;
    if (r.kind === 'goal') {
      if (r.goal === 'marry') return 'goal: finds a single partner, talks, courts and marries; tried again every 2 game hours until married';
      if (r.goal === 'child') return 'goal: marries first, then tries for a child with the partner; again a year after each baby';
      if (r.goal === 'plan') {
        const st = (r.plan ?? []).map((s) => s.do + (s.what ? ' ' + s.what : '') + (s.times && s.times > 1 ? ` x${s.times}` : '')).join(' > ');
        const ev = r.every ?? DAY;
        const often = ev <= 0 ? 'once' : ev % DAY === 0 ? (ev === DAY ? 'every game day' : `every ${ev / DAY} game days`) : ev % 3600 === 0 ? (ev === 3600 ? 'every game hour' : `every ${ev / 3600} game hours`) : `every ${Math.round(ev / 60)} game minutes`;
        const hrs = r.hours ? `, between ${r.hours[0]}:00 and ${r.hours[1]}:00` : '';
        return `must do: ${st || '?'}, ${often}${hrs}${r.by === 'ai' ? ' (steps by the AI)' : ''}; it pushes their own work aside, needs first, a failed try waits 2 game hours`;
      }
      return 'goal: the engine does not know these words yet; told to the AI as a main goal (an AI brain turns it into steps)';
    }
    if (r.forbid.length) {
      const who = r.withName ? (r.with >= 0 ? ` with ${r.withName} only` : ` with ${r.withName} (nobody of that name here yet: blocks nothing until they are)`) : ' (with anyone)';
      return `never: blocks ${r.forbid.join(', ')}${who}`;
    }
    return 'never: no action of the engine matches these words; told to the AI in every prompt';
  }
  /** How well a rule is kept: one row per person it applies to (orders to DO only). */
  kept(r: Rule, ids: number[]): { id: number; name: string; ok: number; fail: number; last?: number; why?: string; due: boolean }[] {
    if (r.kind !== 'goal') return [];
    const w = this.w, out: { id: number; name: string; ok: number; fail: number; last?: number; why?: string; due: boolean }[] = [];
    for (const id of ids) {
      const i = w.e.slot(id), p = w.profiles.get(id);
      if (i < 0 || !p || p.died !== undefined || ageOf(p, w.gameSec, w.life.yearSec) < (r.goal === 'plan' ? 16 : 18)) continue; // children: not theirs yet
      const l = this.log(i, r);
      out.push({ id, name: p.name, ok: l?.ok ?? 0, fail: l?.fail ?? 0, last: l?.last, why: l?.why, due: r.goal === 'plan' ? this.due(i, r) : false });
    }
    return out;
  }

  /** The steps toward a goal now, or null when the goal is already true. */
  stepsFor(i: number, r: Rule): Step[] | null {
    const w = this.w, e = w.e, p = w.profileOf(i)!, now = w.gameSec;
    const marry: Step[] = [{ do: 'find', what: p.sex === 'f' ? 'single man' : 'single woman' }, { do: 'talk', who: -2, times: 3 }, { do: 'court', who: -2 }];
    // Nobody single of the other sex here: nothing to try for now (looked at again at the next try).
    const canMarry = () => w.tasks.findPerson(i, marry[0]!.what!) >= 0;
    if (r.goal === 'marry') return p.partner >= 0 || !canMarry() ? null : marry;
    if (r.goal === 'child') {
      if (p.partner < 0) return canMarry() ? marry : null; // a partner first
      const q = w.profiles.get(p.partner);
      if (p.pregnant || q?.pregnant) return null;
      // Past the age for children (the woman of the couple over 45): nothing more to try.
      const mother = p.sex === 'f' ? p : q;
      if (mother && ageOf(mother, now, w.life.yearSec) > 45) return null;
      // A child born less than a year ago counts as done for now.
      for (const c of w.profiles.values()) if (c.died === undefined && c.parents.includes(e.id(i)) && now - c.born < w.life.yearSec) return null;
      return [{ do: 'goto', who: p.partner }, { do: 'child' }];
    }
    if (r.goal === 'plan' && r.plan?.length) return r.plan.map((s) => ({ ...s, t0: undefined, phase: undefined, n0: undefined, got: undefined, fails: undefined })); // how often: due()
    return null;
  }
}
