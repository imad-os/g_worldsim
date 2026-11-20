import { Act, Kind } from '@worldsim/protocol';
import { NO_MAP } from './entities.js';
import { ageOf } from './people.js';
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
  /** goal 'plan': the steps the AI made of the words (sim/tasks.ts skills). */
  plan?: Step[];
  say?: string;
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
const WHEN = /\b(when(ever)?|each time|every time|if you (see|meet)|quand|lorsque|chaque fois|si tu vois|cuando|cada vez|si ves)\b|عندما|لما|كلما|إذا رأيت|اذا رأيت|اذا شفت/;
const SEE = /\b(see|meet|met|sees|vois|rencontre|ves|veas|encuentras)\b|ترى|تشوف|رأيت|شفت|تقابل/;
const MARRY = /\b(marr(y|ied|iage)|husband|wife|partner|spouse|mari|épou\w*|epou\w*|se marier|mari(é|e)e?|cas(ar|ate|arse)|espos[oa]|novi[oa])\b|تزوج|زواج|زوج|عروس/;
const CHILD = /\b(reproduce|kids?|child(ren)?|bab(y|ies)|family|enfants?|bébés?|bebes?|famille|reprodu\w*|niños?|hijos?|bebés?|familia)\b|أطفال|طفل|ولد|اولاد|أولاد|تكاثر|إنجاب|انجاب|ذرية/;
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
  if (r.forbid.length || NEVER.test(t)) { r.kind = 'never'; return r; }
  r.kind = 'goal';
  r.goal = CHILD.test(t) ? 'child' : MARRY.test(t) ? 'marry' : r.plan?.length ? 'plan' : r.goal === 'plan' ? 'plan' : undefined;
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
    const fix = (r: Rule) => { if (!r.kind) classify(r, nameOf); if (r.withName) r.with = nameOf(r.withName); };
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
  /** Says a line for person i (the planner's say: bubbles, chat, timeline). */
  onSay: (i: number, text: string) => void = () => {};

  /**
   * The engine's side of the rules (World.step, every 20 ticks): triggers fire when the person comes near, goals become
   * tasks the person works on until the goal is true (sim/tasks.ts), with a pause after a failed try.
   */
  update(): void {
    const w = this.w, e = w.e, now = w.gameSec, y = w.life.yearSec;
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
        if (p.mind?.task || ageOf(p, now, y) < 18) continue; // busy with a task (maybe this one), or a child
        if (e.hunger[i]! > 70 || e.thirst[i]! > 70 || e.tired[i]! > 85 || e.act[i] === Act.Sleep) continue; // needs first
        const k = `${id}:${r.text}`, last = this.tried.get(k);
        if (last !== undefined && now - last < 2 * 3600) continue;
        const steps = this.stepsFor(i, r);
        if (!steps) continue; // already true
        this.tried.set(k, now);
        if (w.tasks.start(i, r.goal === 'plan' ? r.text : r.goal === 'marry' ? 'get married (owner\'s order)' : 'have a child (owner\'s order)', 'owner', steps)) {
          w.emit('rule', { id, text: r.text, did: 'started' });
          break; // one task at a time
        }
      }
    }
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
    if (r.goal === 'plan' && r.plan?.length) {
      // A free plan: once a game day.
      const k = `${e.id(i)}:${r.text}:done`, last = this.tried.get(k);
      if (last !== undefined && now - last < 86400) return null;
      this.tried.set(k, now);
      return r.plan.map((s) => ({ ...s }));
    }
    return null;
  }
}
