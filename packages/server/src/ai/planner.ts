/**
 * The LLM layer of the hybrid AI (milestone 6). The built-in brain (sim/brain.ts) keeps every person alive tick by
 * tick; the planner, a few times per game day, asks the model what each person WANTS (a wish: talk to someone, rest,
 * forage...) and what they say, and keeps their memory. A wish is only a bonus in the brain's choice, so a desperate
 * need always wins and a slow or failing model never stops the world.
 *
 *  - Batching: one request plans for up to `batch` people of one map.
 *  - Priority: people with something new and big (a death, a supply drop, a chat) first, then the longest waiting.
 *  - Budget: the planner leaves 20 % of the hourly AI budget for chats, waits `minGapSec` between its requests,
 *    and runs one request at a time.
 *  - Memory: short-term notes (last 12 events), a long-term summary the model rewrites, mood, feelings about others.
 *  - Chat: the owner (panel) or a player (A next to someone on the TV) talks to a person; built-in lines when AI is off.
 * Planner code only uses `Ai`, never a provider directly.
 */
import { Convo, smallTalk } from './convo.js';
import { kidTalk, kidVoice } from '../sim/family.js';
import { Act, EFlag, Kind, RECIPES_ALL, CONFIRM, HUT_NEED } from '@worldsim/protocol';
import { KNOW_HOW, ownText } from '../sim/knowhow.js';
import type { Ai } from './llm.js';
import { parseJsonReply } from './llm.js';
import type { Logger } from '../log.js';
import type { World, WorldEvent } from '../sim/world.js';
import { NO_MAP } from '../sim/entities.js';
import { ageOf, levelOf, type Mind } from '../sim/people.js';
import { SKILLS, thingOf, type Step } from '../sim/tasks.js';
import { RULE_ACTS, classify, isMust, type Rule } from '../sim/rules.js';

export interface PlannerConfig {
  on: boolean;
  /** Each person is planned again after this many game hours. */
  everyGameHours: number;
  /** People per request. */
  batch: number;
  /** Real seconds between two planning requests. */
  minGapSec: number;
}
export const PLANNER_DEFAULTS: PlannerConfig = { on: true, everyGameHours: 3, batch: 5, minGapSec: 20 };

export interface Exchange { at: number; kind: 'plan' | 'chat' | 'rule'; who: string; prompt: string; reply: string; ms: number; err?: string }

const GOALS: Record<string, number> = {
  drink: Act.Drink, eat: Act.Eat, forage: Act.Forage, sleep: Act.Sleep, talk: Act.Talk, wander: Act.Wander, rest: Act.Rest, travel: Act.Travel,
};
const RECIPE_TEXT = RECIPES_ALL.map((r) => `${r.what} = ${Object.entries(r.need).map(([k, n]) => `${n} ${k}`).join(' + ')}`).join(', ');
const HUT_TEXT = Object.entries(HUT_NEED).map(([k, n]) => `${n} ${k}`).join(' + ');
const ACT_TEXT = ['standing', 'walking around', 'going for water', 'eating', 'looking for food', 'sleeping', 'talking', 'travelling', 'resting', 'running away', 'going to someone', 'gathering', 'building'];
/** Goals of the batch planner that are work (milestone 8): they start a task. */
const WORK_GOALS: Record<string, Step[]> = {
  'gather wood': [{ do: 'gather', what: 'wood', times: 4 }], 'gather stone': [{ do: 'gather', what: 'stone', times: 3 }],
  'gather scrap': [{ do: 'gather', what: 'scrap', times: 2 }], 'make an axe': [{ do: 'craft', what: 'axe' }],
  'make a spear': [{ do: 'craft', what: 'spear' }], 'build a campfire': [{ do: 'build', what: 'campfire' }],
  'build a hut': [{ do: 'build', what: 'hut' }], 'feed the fire': [{ do: 'tend' }],
  'collect food and store it': [{ do: 'collect', what: 'food', times: 4 }, { do: 'store', what: 'food' }],
  'go hunting': [{ do: 'hunt' }], 'tame a horse': [{ do: 'tame' }, { do: 'ride', what: 'home' }], 'ride my horse home': [{ do: 'ride', what: 'home' }],
  'make a bow': [{ do: 'craft', what: 'bow' }], 'make arrows': [{ do: 'craft', what: 'arrows' }], 'make a first-aid kit': [{ do: 'craft', what: 'medkit' }], 'make armour': [{ do: 'craft', what: 'armor' }], 'make clothes': [{ do: 'craft', what: 'clothes' }], 'make a sword': [{ do: 'craft', what: 'sword' }],
  'put a bed in a hut': [{ do: 'build', what: 'bed' }], 'put up a palisade': [{ do: 'build', what: 'palisade' }],
  'search the ruins': [{ do: 'loot', times: 3 }], 'plant a field': [{ do: 'farm' }], 'repair the huts': [{ do: 'repair' }],
};
const NOTES_MAX = 12;
const HOUR = 3600;

/** Words for a need (0 fine .. 100 desperate). */
function level(v: number): string { return v < 25 ? 'fine' : v < 50 ? 'a little' : v < 75 ? 'quite' : v < 92 ? 'very' : 'desperately'; }
/** Strip what models add around an answer: <think> blocks, quotes, a "Name:" prefix. */
export function cleanLine(text: string, name: string): string {
  let t = text.replace(/<think>[\s\S]*?<\/think>/gi, '').replace(/<\/?think>/gi, '').trim();
  t = t.replace(new RegExp(`^\\s*\\**${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\**\\s*:\\s*`, 'i'), '');
  t = t.replace(/^\s*\**[A-Z][\w'-]{1,20}( \d+)?\**\s*:\s*(?=["“«])/, ''); // another "Name:" before a quote
  t = t.replace(/^["“”'«»\s]+|["“”'«»\s]+$/g, '').replace(/\s+/g, ' ');
  return t.slice(0, 220);
}

/** What the speaker asks for, from their words (en / fr / es / ar): 'come' | 'follow' | 'bring' | 'stay' | 'stop' | ''. */
export function askedFor(text: string): string {
  const t = ' ' + text.toLowerCase() + ' ';
  if (/\b(follow me|come with me|suis[- ]moi|suivez[- ]moi|viens avec moi|s[ií]gueme|ven conmigo)\b|اتبعني|إتبعني|تعال معي|تبعني/.test(t)) return 'follow';
  if (/\b(bring me|give me|get me)\b.*\b(food|something to eat|eat|can|cans)\b|\b(apporte|donne)[- ]moi\b.*\b(manger|nourriture|bouffe)\b|\b(tráeme|traeme|dame)\b.*\b(comida|comer)\b|(أحضر|جيب|هات|اعطني|أعطني).*(أكل|طعام|ماكلة)/.test(t)) return 'bring';
  if (/\b(come( here| to me| over| find me| search for me)?|get over here|viens|venez|rejoins[- ]moi|ven( aquí| aca| acá)?|ven a buscarme|búscame|buscame)\b|تعال|تعالي|اجي|أجي|ارواح/.test(t) && !/\b(come on|comment|venir de|welcome)\b/.test(t)) return 'come';
  if (/\b(stay( here)?|wait( here| for me)?|don't move|attends|reste( ici)?|espera|quédate|quedate)\b|انتظر|ابق|إبق|استنى/.test(t)) return 'stay';
  if (/\b(stop following|forget it|never ?mind|laisse tomber|olvídalo|olvidalo)\b|انس الأمر/.test(t)) return 'stop';
  return '';
}
/** A number in the words ("hunt 3 animals", "trois", "dos", "ثلاثة"): 0 = none said. */
export function countIn(text: string): number {
  const t = ' ' + text.toLowerCase() + ' ';
  const d = /(?:^|\s)(\d{1,2})(?=\s|[a-zà-ÿ])/.exec(t);
  if (d) return Math.min(20, Number(d[1]));
  // Arabic words only as whole words (with spaces round them): short stems like ست sit inside many other words.
  const W: [RegExp, number][] = [[/\b(two|a couple|deux|dos)\b|\s(اثنين|اثنان|إثنين)\s/, 2], [/\b(three|trois|tres)\b|\sثلاث[ةه]?\s/, 3],
    [/\b(four|quatre|cuatro)\b|\s[أا]ربع[ةه]?\s/, 4], [/\b(five|cinq|cinco)\b|\sخمس[ةه]?\s/, 5], [/\b(six|seis)\b|\sست[ةه]\s/, 6], [/\b(seven|sept|siete)\b|\sسبع[ةه]?\s/, 7],
    [/\b(eight|huit|ocho)\b|\sثماني[ةه]?\s/, 8], [/\b(nine|neuf|nueve)\b|\sتسع[ةه]?\s/, 9], [/\b(ten|dix|diez)\b|\sعشر[ةه]?\s/, 10]];
  for (const [re, n] of W) if (re.test(t)) return n; // "one" / "un" are mostly articles: only 2 and up
  return 0;
}

/** Work the speaker asks for (en / fr / es / ar): steps, or null. A safety net for small models that answer without a plan. */
export function askedWork(text: string): { task: string; steps: Step[] } | null {
  const r = askedWork0(text), n = countIn(text);
  if (!r || n < 2) return r;
  // "hunt 3 animals", "bring me 5 stones": the count goes on the step that repeats, and in the words of the task.
  const st = r.steps.find((x) => ['hunt', 'gather', 'collect', 'loot', 'take'].includes(x.do));
  if (st) { st.times = n; r.task = `${r.task} (${n})`; }
  return r;
}

function askedWork0(text: string): { task: string; steps: Step[] } | null {
  const t = ' ' + text.toLowerCase() + ' ';
  // Pull down your own building (imad 2026-11-25: only one's own, or a dead owner's: Survival.mayDestroy decides).
  if (/\b(destroy|demolish|tear down|pull down|knock down|take down|dismantle|détruis|détruire|démolis|démolir|démonte|destruye|destruir|derriba|derribar|desmonta)\b|اهدم|هدم|دمر|فكك/.test(t)) {
    const what = /\b(hut|house|home|cabin|cabane|maison|casa|caba[ñn]a)\b|بيت|منزل|كوخ/.test(t) ? 'hut' : /\b(fire|campfire|feu|fuego)\b|نار/.test(t) ? 'fire' : /\b(field|farm|champ|huerto)\b|حقل/.test(t) ? 'field'
      : (['palisade', 'spikes', 'stonewall', 'door', 'window', 'bed', 'lamp'].find((x) => t.includes(x)) ?? '');
    return { task: what ? 'pull down my ' + what : 'pull down what I built', steps: [{ do: 'destroy', what }] };
  }
  if (/\b(hut|house|home|shelter|cabin|cabane|maison|abri|casa|caba[ñn]a|refugio)\b|بيت|منزل|كوخ|مأوى/.test(t) && /\b(build|make|construct|construis|construisez|fais|faire|construye|construir|haz|hacer)\b|ابن|إبن|اصنع|بناء|ابني/.test(t)) return { task: 'build a hut', steps: [{ do: 'build', what: 'hut' }] };
  if (/\b(fire|campfire|feu|fuego|hoguera|fogata)\b|نار/.test(t)) {
    if (/\b(feed|keep|add wood|alimente|entretiens|mets du bois|aviva|mant[eé]n)\b|زد|أضف/.test(t)) return { task: 'keep the fire going', steps: [{ do: 'tend' }] };
    return { task: 'make a campfire', steps: [{ do: 'build', what: 'campfire' }] };
  }
  if (/\b(store|stock|stash|keep|save|ranger|stocke|garde|guarda|almacena)\b|خزن|احفظ|خزّن/.test(t) && /\b(food|eat|berr\w*|cans?|nourriture|manger|comida)\b|طعام|أكل/.test(t)) return { task: 'collect food and store it', steps: [{ do: 'collect', what: 'food', times: 4 }, { do: 'store', what: 'food' }] };
  if (/\b(collect|gather|pick up|find|ramasse|cueille|recoge|busca)\b|اجمع|جمع/.test(t) && /\b(food|berr\w*|cans?|nourriture|comida)\b|طعام|أكل/.test(t)) return { task: 'collect food', steps: [{ do: 'collect', what: 'food', times: 4 }] };
  if (/\b(loot|scavenge|search the ruins|fouille|saquea|registra)\b|فتش|ابحث في الأنقاض/.test(t)) return { task: 'search the ruins', steps: [{ do: 'loot', times: 3 }] };
  if (/\b(plant|farm|grow|field|planter|cultive|champ|siembra|cultiva|huerto)\b|ازرع|زراعة|حقل/.test(t)) return { task: 'plant a field', steps: [{ do: 'farm' }] };
  if (/\b(repair|fix|mend|répare|reparar|arregla)\b|أصلح|اصلح|صلح/.test(t)) return { task: 'repair the huts', steps: [{ do: 'repair' }] };
  if (/\b(ride|riding|mount|gallop|monte|chevauche|cabalga|monta)\b|اركب|امتط/.test(t) && /\b(horses?|cheva(l|ux)|caballos?|home|maison|casa)\b|حصان|فرس|البيت/.test(t)) return { task: 'ride my horse', steps: [{ do: 'ride', what: /\b(woods?|forest|for[eê]t|bosque)\b|غابة/.test(t) ? 'woods' : 'home' }] };
  if (/\b(horses?|cheva(l|ux)|caballos?|yegua|stallion|mare)\b|حصان|خيل|فرس/.test(t) && /\b(tame|catch|break|get|find|apprivoise|dompte|attrape|doma|domar|atrapa|consigue)\b|روض|ترويض|امسك|اصطد/.test(t)) return { task: 'tame a horse', steps: [{ do: 'tame' }, { do: 'ride', what: 'home' }] };
  if (/\b(hunt\w*|chasse\w*|chasser|caza\w*|cazar)\b|اصطد|صيد/.test(t)) return { task: 'go hunting', steps: [{ do: 'hunt', what: t }] };
  if (/\b(sword|épée|espada|bow|arc|arco|arrows?|flèches?|flechas?|armou?r|armure|armadura|clothes|vêtements|ropa|helmet|casque|casco)\b|سيف|قوس|سهام|درع|ملابس|خوذة/.test(t)) { const th = thingOf(t, 'craft'); return { task: 'make ' + th, steps: [{ do: 'craft', what: th }] }; }
  if (/\b(door|porte|puerta|window|fenêtre|ventana|bed|lit|cama|lamp|lampe|lámpara|palisade|palissade|fence|barricade|spikes|wall|mur|muro)\b|باب|نافذة|سرير|مصباح|سياج/.test(t) && /\b(build|make|put|place|construis|fais|mets|construye|haz|pon)\b|ابن|اصنع|ضع/.test(t)) { const th = thingOf(t, 'build'); return { task: 'build ' + th, steps: [{ do: 'build', what: th }] }; }
  if (/\b(axe|hache|hacha)\b|فأس/.test(t)) return { task: 'make an axe', steps: [{ do: 'craft', what: 'axe' }] };
  if (/\b(spear|weapon|lance|arme|lanza|arma)\b|رمح|سلاح/.test(t)) return { task: 'make a spear', steps: [{ do: 'craft', what: 'spear' }] };
  if (/\b(wood|firewood|logs|bois|madera|le[ñn]a)\b|حطب|خشب/.test(t)) return { task: 'gather wood', steps: [{ do: 'gather', what: 'wood', times: 4 }] };
  if (/\b(stones?|rocks?|pierres?|piedras?)\b|حجر|حجارة/.test(t)) return { task: 'gather stone', steps: [{ do: 'gather', what: 'stone', times: 3 }] };
  return null;
}
/** "Go ask X to marry you" / "go divorce X" (en / fr / es / ar): which of the two and the words that may hold a name; null = neither. */
export function askedToWedSomeone(text: string): 'marry' | 'divorce' | null {
  const t = ' ' + text.toLowerCase() + ' ';
  if (/divorc|طلاق|طلق/.test(t)) return 'divorce';
  if (/(?<!\p{L})(marry|marriage|propose|wife|husband|épous\w*|mari(er|age)|casar\w*|boda|esposa|esposo)(?!\p{L})|تزوج|زواج|خطب/u.test(t)) return 'marry';
  return null;
}
/** A proposal in the speaker's words (en / fr / es / ar). */
export function askedMarry(text: string): boolean {
  const t = ' ' + text.toLowerCase() + ' ';
  return /(?<!\p{L})(marry me|will you marry|would you marry|wanna marry|want to marry you|be my wife|be my husband|let'?s get married|épouse[- ]moi|veux[- ]tu m'?épouser|voulez[- ]vous m'?épouser|marions[- ]nous|cásate conmigo|casate conmigo|quieres casarte|s[ée] mi esposa|s[ée] mi esposo)(?!\p{L})|تتزوجيني|تزوجيني|تتزوجني|تزوجني|نتزوج|كوني زوجتي|كن زوجي/u.test(t);
}
/** "I want a divorce" in the speaker's words (en / fr / es / ar); "I don't want a divorce" is not one. */
export function askedDivorce(text: string): boolean {
  const t = ' ' + text.toLowerCase() + ' ';
  if (/\b(don'?t|do not|never|not|pas|jamais|nunca|no)\b[^.!?]{0,25}(divorc)/.test(t) || /لا (أريد|اريد|نريد)[^.!?]{0,15}(طلاق|الطلاق)/.test(t)) return false;
  return /(?<!\p{L})(divorce|divorcer|divorçons|divorcio|divorciarnos|divorciemos|me divorcio|i'?m leaving you|je te quitte|te dejo)(?!\p{L})|طلاق|أطلقك|اطلقك|نتطلق|ننفصل|طلقني/u.test(t);
}
/** Does an answer agree to come ("I'm coming", "on my way", "j'arrive", "voy", "حاضر")? */
export function agrees(text: string): boolean {
  return /\b(i'?m coming|coming|on my way|be right there|i'?ll come|ok(ay)?|sure|yes|alright|j'arrive|j'y vais|d'accord|oui|voy|vale|claro|s[ií]|ya voy)\b|حاضر|نعم|حسنا|حسناً|جاي|قادم|آتي|طيب/i.test(text);
}

export class Planner {
  cfg: PlannerConfig;
  readonly log: Exchange[] = [];
  readonly convo = new Convo();
  readonly counts = { batches: 0, plans: 0, chats: 0, failures: 0, builtIn: 0 };
  private busy = false;
  private lastRunAt = 0;
  /** Lines said, for the viewers and the panel (App forwards them). */
  onSay: (i: number, text: string) => void = () => {};

  constructor(private w: World, private ai: Ai, private logger: Logger, cfg?: Partial<PlannerConfig>) {
    this.cfg = { ...PLANNER_DEFAULTS, ...cfg };
    w.speak = (i, text) => this.say(i, text);
    w.listeners.push((ev) => { if (ev.kind === 'talk') this.smallTalk(Number(ev.data.a), Number(ev.data.b)); });
    // Tasks (step plans) speak through the planner and end in memory.
    w.tasks.onSay = (i, text) => this.say(i, text);
    w.rules.onSay = (i, text) => this.say(i, text);
    w.tasks.onAsk = async (a, b, what) => {
      const e = w.e, ida = e.id(a), idb = e.id(b), pa = w.profiles.get(ida), pb = w.profiles.get(idb);
      if (!pa || !pb) return 'they are not here';
      const r = await this.chat(b, pa.name, what === 'marry' ? 'Will you marry me?' : 'I want a divorce.', a);
      const now = w.profiles.get(ida);
      if (what === 'marry') return now?.partner === idb ? 'ok' : `${pb.name} said no${r.reply ? `: "${r.reply}"` : ''}`;
      return now && now.partner !== idb ? 'ok' : `${pb.name} would not divorce`;
    };
    w.tasks.onEnd = (id, t, ok, why) => {
      this.onTaskEnd(id, t.from, t.text, ok, why);
      this.note(id, ok ? `I did what ${t.from === 'owner' ? 'the voice from the sky' : t.from} asked: ${t.text}.` : `I could not ${t.text}: ${why}.`, true);
      const i = w.e.slot(id);
      if (!ok && i >= 0) this.say(i, cleanLine(`I couldn't ${t.text.replace(/^(to )?/, '')}: ${why}.`, ''));
    };
    // Wishes from before a restart still count.
    for (let i = 0; i < w.e.hi; i++) {
      const p = w.e.kind[i] === Kind.Agent ? w.profileOf(i) : undefined;
      const pl = p?.mind?.plan;
      if (pl && pl.until > w.gameSec && GOALS[pl.act] !== undefined) w.brain.wish(i, GOALS[pl.act]!, pl.with ?? -1, pl.until);
    }
    w.listeners.push((ev) => this.onEvent(ev));
  }

  /** A task ended (the panel chat tells whoever asked for it: ai/chatroom.ts). */
  onTaskEnd: (id: number, from: string, text: string, ok: boolean, why: string) => void = () => {};

  /** force = the owner said yes to a value outside the usual range (still > 0). */
  set(p: Partial<PlannerConfig>, force = false): PlannerConfig {
    const n = (v: unknown, lo: number, hi: number, name: string) => {
      if (typeof v !== 'number' || !Number.isFinite(v) || v <= 0 || v > 1e7) throw new Error(`bad ${name}`);
      if ((v < lo || v > hi) && !force) throw new Error(`${CONFIRM}${name} = ${v} is outside the usual ${lo} to ${hi}`);
      return v;
    };
    const c = { ...this.cfg };
    if (p.on !== undefined) c.on = p.on === true;
    if (p.everyGameHours !== undefined) c.everyGameHours = n(p.everyGameHours, 0.25, 48, 'everyGameHours');
    if (p.batch !== undefined) c.batch = Math.round(n(p.batch, 1, 10, 'batch'));
    if (p.minGapSec !== undefined) c.minGapSec = n(p.minGapSec, 2, 3600, 'minGapSec');
    this.cfg = c;
    return c;
  }

  status(): Record<string, unknown> { return { ...this.cfg, busy: this.busy, counts: { ...this.counts } }; }

  // ------------------------------------------------------------------ memory
  mind(id: number): Mind | undefined {
    const p = this.w.profiles.get(id);
    if (!p) return undefined;
    p.mind ??= { notes: [], summary: '', mood: 'calm', rel: {}, lastPlan: this.w.gameSec - 1e9 };
    return p.mind;
  }
  note(id: number, text: string, urgent = false): void {
    const m = this.mind(id);
    if (!m) return;
    m.notes.push({ at: this.w.gameSec, text: text.slice(0, 200) });
    if (m.notes.length > NOTES_MAX) m.notes.splice(0, m.notes.length - NOTES_MAX);
    if (urgent) m.urgent = true;
  }
  private feel(id: number, key: string, d: number): void {
    const m = this.mind(id);
    if (m) m.rel[key] = Math.max(-5, Math.min(5, (m.rel[key] ?? 0) + d));
  }
  /** Two people stop to talk: a short built-in exchange for the log (no AI call, no bubble). */
  private smallTalk(a: number, b: number): void {
    const w = this.w, e = w.e, ia = e.slot(a), ib = e.slot(b);
    if (ia < 0 || ib < 0) return;
    const night = (((w.gameSec / HOUR + 8) % 24) + 24) % 24; const dark = night < 5 || night >= 21;
    const zom = w.zombies.count(e.map[ia]!) > 0;
    const t = (i: number): Parameters<typeof smallTalk>[0] => { const p = w.profileOf(i); return { hunger: e.hunger[i]!, thirst: e.thirst[i]!, tired: e.tired[i]!, lonely: e.lonely[i]!, hp: e.hp[i]!, mood: p ? (this.mind(e.id(i))?.mood ?? '') : '', courage: p?.traits.courage ?? 0.5, empathy: p?.traits.empathy ?? 0.5, night: dark, zombies: !!zom }; };
    const pick = (n: number) => w.rng.int(n);
    this.convo.add(w.gameSec, a, b, smallTalk(t(ia), pick));
    this.convo.add(w.gameSec + 1, b, a, smallTalk(t(ib), pick));
  }
  private name(id: number): string { return this.w.profiles.get(id)?.name ?? 'someone'; }
  /** Living people on map m (slots). */
  private onMap(m: number): number[] {
    const e = this.w.e, out: number[] = [];
    for (let i = 0; i < e.hi; i++) if (e.kind[i] === Kind.Agent && e.map[i] === m) out.push(i);
    return out;
  }

  private onEvent(ev: WorldEvent): void {
    const d = ev.data as Record<string, any>, w = this.w;
    switch (ev.kind) {
      case 'talk':
        this.note(d.a, `Talked with ${this.name(d.b)}.`); this.note(d.b, `Talked with ${this.name(d.a)}.`);
        this.feel(d.a, '#' + d.b, 0.5); this.feel(d.b, '#' + d.a, 0.5);
        break;
      case 'death': {
        const m = w.mapIndex.get(String(d.map));
        if (m === undefined) break;
        for (const i of this.onMap(m)) if (w.e.id(i) !== d.id) this.note(w.e.id(i), `${this.name(d.id)} died (${d.cause}).`, true);
        break;
      }
      case 'supply': {
        const m = w.mapIndex.get(String(d.map));
        if (m === undefined) break;
        for (const i of this.onMap(m)) this.note(w.e.id(i), `A supply drop of ${d.n} food fell near (${Math.round(d.x)}, ${Math.round(d.y)}).`, true);
        break;
      }
      case 'pickup': this.note(d.id, `Found ${d.item}.`); break;
      case 'travel': this.note(d.id, `Left for ${w.maps[w.mapIndex.get(String(d.to)) ?? 0]?.def.name ?? d.to}.`); break;
      case 'arrive': this.note(d.id, 'Arrived in a new place.', true); break;
    }
  }

  // ------------------------------------------------------------------ planning
  /** Called every couple of real seconds by the App: maybe send one planning request. */
  async tick(paused = false): Promise<void> {
    const st = this.ai.status();
    if (!this.cfg.on || !st.ready || this.busy || paused) return;
    if (Date.now() - this.lastRunAt < this.cfg.minGapSec * 1000) return;
    if (st.callsLastHour >= st.maxCallsPerHour * 0.8) return; // keep the rest for chats
    const w = this.w, e = w.e, due = w.gameSec - this.cfg.everyGameHours * HOUR;
    // Who is due, by map: urgent first, then the longest waiting.
    const cand: { i: number; m: number; urgent: boolean; last: number }[] = [];
    for (let i = 0; i < e.hi; i++) {
      if (e.kind[i] !== Kind.Agent || e.map[i] === NO_MAP || w.family.dependent(i)) continue; // babies make no plans
      const mind = this.mind(e.id(i));
      if (!mind) continue;
      if (mind.urgent || mind.lastPlan <= due) cand.push({ i, m: e.map[i]!, urgent: !!mind.urgent, last: mind.lastPlan });
    }
    if (!cand.length) return;
    cand.sort((a, b) => (a.urgent === b.urgent ? a.last - b.last : a.urgent ? -1 : 1));
    const m = cand[0]!.m;
    const batch = cand.filter((c) => c.m === m).slice(0, this.cfg.batch).map((c) => c.i);
    await this.plan(batch);
  }

  /** One request for these people (slots on one map). */
  async plan(slots: number[]): Promise<number> {
    const w = this.w, e = w.e;
    this.busy = true; this.lastRunAt = Date.now();
    const ids = slots.map((i) => e.id(i));
    for (const id of ids) { const m = this.mind(id)!; m.lastPlan = w.gameSec; m.urgent = false; }
    const prompt = this.planPrompt(slots);
    const system = 'You decide what survivors in a post-apocalyptic world want to do next. Stay in character, be practical, '
      + 'keep lines short and natural. Answer ONLY with JSON: {"people":[{"name":"...","goal":"...","with":"name or empty",'
      + '"why":"short reason","say":"one short line they say aloud, or empty","mood":"one word","memory":"their updated long-term memory, '
      + 'at most 300 characters"}]}';
    const ex: Exchange = { at: Date.now(), kind: 'plan', who: ids.map((id) => this.name(id)).join(', '), prompt, reply: '', ms: 0 };
    let applied = 0;
    try {
      const r = await this.ai.generate({ system, prompt, json: true, maxTokens: 220 * slots.length + 100, temperature: 0.8 });
      ex.reply = r.text.slice(0, 6000); ex.ms = r.ms;
      const j = parseJsonReply<{ people?: unknown[] }>(r.text.replace(/<think>[\s\S]*?<\/think>/gi, ''));
      const list = Array.isArray(j?.people) ? j!.people : Array.isArray(j) ? (j as unknown[]) : null;
      if (!list) throw new Error('the answer had no "people" list');
      applied = this.applyPlans(ids, list);
      this.counts.batches++; this.counts.plans += applied;
      if (!applied) throw new Error('no usable plan in the answer');
    } catch (err) {
      ex.err = err instanceof Error ? err.message : String(err);
      this.counts.failures++;
      this.logger.debug('planner failed', { err: ex.err });
    } finally {
      this.busy = false;
      this.keep(ex);
    }
    return applied;
  }

  private applyPlans(ids: number[], list: unknown[]): number {
    const w = this.w, e = w.e;
    let n = 0;
    for (const raw of list) {
      if (!raw || typeof raw !== 'object') continue;
      const p = raw as Record<string, unknown>;
      const name = String(p.name ?? '').trim().toLowerCase();
      const id = ids.find((x) => this.name(x).toLowerCase() === name) ?? (list.length === 1 && ids.length === 1 ? ids[0] : undefined);
      if (id === undefined) continue;
      const i = e.slot(id), mind = this.mind(id)!;
      if (i < 0) continue;
      const goal = String(p.goal ?? '').trim().toLowerCase();
      const act = GOALS[goal];
      const withName = String(p.with ?? '').trim().toLowerCase();
      let withId = -1;
      if (withName) for (const [oid, op] of w.profiles) if (op.name.toLowerCase() === withName && e.slot(oid) >= 0 && oid !== id) { withId = oid; break; }
      if (typeof p.mood === 'string' && p.mood.trim()) mind.mood = p.mood.trim().slice(0, 30);
      if (typeof p.memory === 'string' && p.memory.trim()) mind.summary = p.memory.trim().slice(0, 400);
      const work = WORK_GOALS[goal];
      if (work && !w.profileOf(i)?.mind?.task) {
        mind.plan = { act: goal, why: String(p.why ?? '').slice(0, 160), until: w.gameSec + this.cfg.everyGameHours * HOUR };
        if (w.tasks.start(i, goal, 'myself', work.map((st) => ({ ...st })))) n++;
      } else if (act !== undefined) {
        const until = w.gameSec + this.cfg.everyGameHours * HOUR;
        mind.plan = { act: goal, with: withId >= 0 ? withId : undefined, why: String(p.why ?? '').slice(0, 160), until };
        w.brain.wish(i, act, withId, until);
        n++;
      }
      const say = typeof p.say === 'string' ? cleanLine(p.say, this.name(id)) : '';
      if (say) this.say(i, say);
    }
    return n;
  }

  private planPrompt(slots: number[]): string {
    const w = this.w, e = w.e, m = e.map[slots[0]!]!, place = w.maps[m]!.def.name;
    const goals = ['drink', 'eat (only when carrying food)', 'forage', 'sleep', 'talk (say with whom)', 'wander', 'rest', ...(w.travelOpen ? ['travel (to another place)'] : []),
      ...(w.survival.enabled ? Object.keys(WORK_GOALS) : [])];
    const lines = [`Time: ${this.clock()}. Place: ${place}. Travel to other places is ${w.travelOpen ? 'open' : 'closed'}.`, `Possible goals: ${goals.join(', ')}.`, KNOW_HOW, ''];
    for (const i of slots) lines.push(this.describe(i), '');
    lines.push('For each person above, give one entry in "people".');
    return lines.join('\n');
  }

  /** A person as the model sees them. */
  private describe(i: number): string {
    const w = this.w, e = w.e, id = e.id(i), p = w.profileOf(i)!, mind = this.mind(id)!;
    const near: string[] = [];
    for (let j = 0; j < e.hi; j++) {
      if (j === i || e.map[j] !== e.map[i] || (e.kind[j] !== Kind.Agent && e.kind[j] !== Kind.Player)) continue;
      const d = Math.hypot(e.x[j]! - e.x[i]!, e.y[j]! - e.y[i]!);
      if (d > 80) continue;
      const rl = w.family.relation(id, e.id(j));
      const nm = (e.kind[j] === Kind.Player ? `${this.nameOfId(e.id(j))} (a player)` : this.name(e.id(j))) + (rl ? `, your ${rl}` : '');
      near.push(`${nm} (${Math.round(d)} m, ${ACT_TEXT[e.act[j]!] ?? 'standing'})`);
    }
    const rel = Object.entries(mind.rel).filter(([, v]) => Math.abs(v) >= 1).map(([k, v]) => `${k[0] === '#' ? this.name(Number(k.slice(1))) : k.slice(1)} ${v > 0 ? '+' : ''}${Math.round(v)}`);
    const wish = mind.plan && mind.plan.until > w.gameSec ? `${mind.plan.act}${mind.plan.with !== undefined ? ' with ' + this.name(mind.plan.with) : ''}` : 'none';
    return [
      `Person: ${p.name} (${p.sex === 'f' ? 'woman' : 'man'}, ${Math.floor(ageOf(p, w.gameSec, w.yearSec))}; ${p.personality.join(', ')}; mood: ${mind.mood})`,
      `Hungry: ${level(e.hunger[i]!)}. Thirsty: ${level(e.thirst[i]!)}. Tired: ${level(e.tired[i]!)}. Lonely: ${level(e.lonely[i]!)}. Health ${Math.round(e.hp[i]!)}%. Carrying ${w.survival.foodOf(i)} food${w.survival.inv(i).water ? ` and ${w.survival.inv(i).water} water` : ''}. Now: ${ACT_TEXT[e.act[i]!] ?? 'standing'}. Last wish: ${wish}.`,
      this.selfText(i),
      this.familyText(i),
      ...(kidVoice(w.family.ageOf(i)) ? [kidVoice(w.family.ageOf(i))] : []),
      w.clans.promptText(i),
      ...(w.quests.promptText(i) ? [w.quests.promptText(i)] : []),
      `Has: ${this.invText(i)}.${this.campText(i)}`,
      ...(w.plan.text(e.map[i]!) ? [w.plan.text(e.map[i]!) + ' Help with what is most needed when you are free.'] : []),
      ...(ownText(w, i) ? [ownText(w, i)] : []),
      w.horses.promptText(i),
      ...(this.placeText(i) ? [this.placeText(i)] : []),
      w.weather.promptText(e.map[i]!),
      ...(w.lore.promptText(i) ? [w.lore.promptText(i)] : []),
      `Near: ${near.length ? near.join('; ') : 'nobody'}.`,
      ...(rel.length ? [`Feelings: ${rel.join(', ')}.`] : []),
      ...((() => { const l = w.survival.leader[e.map[i]!] ?? -1; return l < 0 ? [] : l === id ? ['You are the leader of this place: people do the work you give them; keep everyone fed, safe and together.'] : [`Leader here: ${this.name(l)} (people usually do what the leader asks).`]; })()),
      ...(w.rules.text(i) ? [w.rules.text(i)] : []),
      `Memory: ${mind.summary || 'nothing yet'}`,
      ...(w.ai.instinct ? [w.memory.story(i)].filter(Boolean) : []),
      `Recent: ${mind.notes.length ? mind.notes.slice(-8).map((n) => `${this.clock(n.at)} ${n.text}`).join(' | ') : 'nothing'}`,
    ].join('\n');
  }

  /**
   * What everyone knows about the dangerous places (imad 2026-11-26: "the forest is very dangerous, kids are not allowed, they die a
   * lot there"): the wild maps by name, and what to do when you are in one.
   */
  private placeText(i: number): string {
    const w = this.w, m = w.e.map[i]!, wild = w.maps.filter((x) => w.wild(x.index)).map((x) => x.def.name);
    if (!wild.length) return '';
    const kid = (w.e.flags[i]! & EFlag.Child) !== 0;
    if (w.wild(m)) return `DANGER: you are in ${w.maps[m]!.def.name}, a very dangerous wild place (wolves, bears, boars and zombies; many have died here).`
      + (kid ? ' Children are not allowed here: go back to safety now.' : ' Stay close to the others, carry a weapon, help anyone attacked, never bring children, and leave before dark.');
    return `${wild.join(', ')}: very dangerous wild place${wild.length > 1 ? 's' : ''} (wolves, bears, zombies; many die there). Only adults go, armed and together, by day; children are never allowed.`;
  }

  /** What a person knows about themselves: their strengths (0-10), level, what they are doing, how they are armed and dressed. */
  private selfText(i: number): string {
    const w = this.w, id = w.e.id(i), p = w.profileOf(i)!, t = p.traits, k = (x: number) => Math.round(x * 10);
    const wp = w.survival.weapon(i), goal = w.tasks.describe(id);
    return `Stats (0-10): strength ${k(t.strength)}, speed ${k(t.speed)}, courage ${k(t.courage)}, intelligence ${k(t.intelligence)}, kindness ${k(t.empathy)}. Level ${levelOf(p.xp)} (${p.xp ?? 0} xp).`
      + ` Weapon: ${wp[1] > 0 ? wp[0] : 'bare hands'}. Defence ${Math.round(w.survival.defence(i) * 100)}%.${goal ? ` Working on: ${goal}.` : ''}`
      + ` ${w.survival.homes.describe(id)} ${w.survival.homes.mapText(w.e.map[i]!, id)} ${w.influence.promptText(id)}`;
  }
  /** Family: married or single, children, parents, brothers and sisters, a baby on the way (they must know it to talk about it). */
  private familyText(i: number): string {
    const w = this.w, e = w.e, id = e.id(i), p = w.profileOf(i)!, now = w.gameSec, y = w.yearSec;
    const live = (pid: number) => { const q = w.profiles.get(pid); return !!q && q.died === undefined; };
    const nameAge = (pid: number) => { const q = w.profiles.get(pid); return q ? `${q.name} (${Math.floor(ageOf(q, q.died ?? now, y))}${q.died !== undefined ? ', died' : ''})` : 'someone'; };
    const kids = w.family.childrenOf(id), sibs = w.family.siblingsOf(id), parents = w.family.parentsOf(id);
    const partner = p.partner >= 0 ? w.profiles.get(p.partner) : undefined;
    const parts = [
      partner ? `Married to ${partner.name}${live(p.partner) ? '' : ' (dead)'}.` : 'Single: no partner.',
      kids.length ? `Children: ${kids.map(nameAge).join(', ')}.` : 'No children.',
      parents.length ? `Parents: ${parents.map(nameAge).join(' and ')}.` : 'Parents: unknown (born before the town).',
      ...(Object.keys(p.kin ?? {}).length ? ['(Some of this family was chosen, not born: it is just as real. Never court or marry your family.)'] : []),
      ...((() => { const little = kids.filter((c) => { const s = e.slot(c); return s >= 0 && w.family.dependent(s); }); return little.length ? [`You look after your little one${little.length > 1 ? 's' : ''} (${little.map(nameAge).join(', ')}): they cannot feed themselves; keep them fed, watered and safe.`] : []; })()),
      ...(sibs.length ? [`Brothers and sisters: ${sibs.map(nameAge).join(', ')}.`] : []),
      ...(p.pregnant ? [`You are expecting a baby (${w.life.pregnancyPct(p)} % of the way).`] : []),
      ...(partner?.pregnant && p.sex === 'm' ? [`${partner.name} is expecting your baby (${w.life.pregnancyPct(partner)} % of the way).`] : []),
      ...(w.family.lyingInLeft(id) >= 0 ? [`You just gave birth: you stay home with your newborn for ${Math.ceil(w.family.lyingInLeft(id) / 24)} more game days and go out only when it is urgent; your family fills the fridge.`] : []),
      ...(partner && p.partner >= 0 && w.family.lyingInLeft(p.partner) >= 0 ? [`${partner.name} is home with your newborn: you keep your home's fridge filled with food and water.`] : []),
    ];
    void e;
    return `Family: ${parts.join(' ')}`;
  }

 private invText(i: number): string {
    const v = this.w.survival.inv(i), parts = Object.entries(v).filter(([, n]) => n! > 0).map(([k, n]) => `${n} ${k}`);
    return parts.length ? parts.join(', ') : 'no materials';
  }
  private campText(i: number): string {
    const w = this.w, e = w.e, s = w.survival, m = e.map[i]!;
    if (!s.enabled) return '';
    const f = s.nearestFire(i, 60), camp = s.campOf(m);
    const fire = f >= 0 ? ` A campfire burns ${Math.round(Math.hypot((f % w.maps[m]!.tiles.w) + 0.5 - e.x[i]!, ((f / w.maps[m]!.tiles.w) | 0) + 0.5 - e.y[i]!))} m away (${Math.round(s.fuel(m, f))} h of wood left).` : ' No fire nearby.';
    const st = s.stash[m];
    return `${fire} Huts here: ${s.huts[m]!.length}. Fields: ${[...s.farms.keys()].filter((k) => k.startsWith(m + ':')).length}.${st ? ` The camp's store has ${st.food} food, ${st.wood} wood, ${st.stone} stone, ${st.scrap} scrap.` : ' No store yet.'}${w.zombies.count(m) ? ` ${w.zombies.count(m)} zombies are out.` : ''}${camp ? ` Camp ${Math.round(Math.hypot(camp.x - e.x[i]!, camp.y - e.y[i]!))} m away.` : ''} Recipes: ${RECIPE_TEXT}, hut = ${HUT_TEXT}.${w.animals.count(m) ? ` ${w.animals.count(m)} animals roam this map.` : ''}`;
  }

  /** "day 2 14:30 (afternoon)" — the day starts at 08:00 like the viewers show. */
  clock(at = this.w.gameSec): string {
    const h = at / HOUR + 8, day = Math.floor(h / 24) + 1, hh = ((h % 24) + 24) % 24;
    const part = hh < 5 ? 'night' : hh < 12 ? 'morning' : hh < 17 ? 'afternoon' : hh < 21 ? 'evening' : 'night';
    return `day ${day} ${String(Math.floor(hh)).padStart(2, '0')}:${String(Math.floor((hh % 1) * 60)).padStart(2, '0')} (${part})`;
  }

  private say(i: number, text: string, asIs = false): void {
    const w = this.w, e = w.e, id = e.id(i);
    const mind = this.mind(id)!;
    if (!asIs) text = this.childish(i, text);
    mind.said = { at: w.gameSec, text };
    // Others close by hear it.
    for (let j = 0; j < e.hi; j++) {
      if (j !== i && e.kind[j] === Kind.Agent && e.map[j] === e.map[i] && Math.hypot(e.x[j]! - e.x[i]!, e.y[j]! - e.y[i]!) < 12) this.note(e.id(j), `${this.name(id)} said: "${text}"`);
    }
    let to = -1, best = 8;
    for (let j = 0; j < e.hi; j++) if (j !== i && (e.kind[j] === Kind.Agent || w.isChar(j)) && e.map[j] === e.map[i]) { const d = Math.hypot(e.x[j]! - e.x[i]!, e.y[j]! - e.y[i]!); if (d < best) { best = d; to = e.id(j); } }
    this.convo.add(w.gameSec, id, to, text);
    w.emit('say', { id, text, map: w.maps[e.map[i]!]?.def.id ?? '' });
    this.onSay(i, text);
  }

  /** What a child really says (sim/family.ts kidTalk): babies cry and babble, toddlers say a word or two. */
  private childish(i: number, text: string): string {
    const w = this.w, e = w.e, age = w.family.ageOf(i);
    if (age >= 7) return text;
    const c = w.family.carer[i]!, near = c >= 0 ? c : -1;
    return kidTalk(age, text, { hunger: e.hunger[i]!, thirst: e.thirst[i]!, tired: e.tired[i]! }, (n) => w.rng.int(n), near >= 0 ? (w.profileOf(near)?.sex ?? '') : '');
  }

  // ------------------------------------------------------------------ chat
  /** Players' characters by name (App fills it from the network): [name, slot]. */
  players: () => [string, number][] = () => [];

  /** Someone by name: a person (agent) or a player's character. Entity id, or -1. */
  whoIs(name: string, except = -1): number {
    const n = name.trim().toLowerCase().replace(/^@/, '');
    if (!n) return -1;
    const e = this.w.e;
    for (const [id, p] of this.w.profiles) if (p.name.toLowerCase() === n && id !== except && e.slot(id) >= 0) return id;
    for (const [pn, slot] of this.players()) if (pn.toLowerCase() === n && e.kind[slot] === Kind.Player) return e.id(slot);
    return -1;
  }

  /**
   * Someone talks to person i: `from` is the owner ('owner') or a player's name; `text` = what they said (null = they
   * walked up to them); `player` = the speaker's character slot. The model answers in JSON with what they say AND what
   * they do ({"say", "do", "target"}); what they do becomes an order (Brain.order). A small model may forget the "do":
   * the speaker's own words ("come", "follow me", "viens"...) and an answer that agrees ("I'm coming") count too.
   * Built-in lines when the AI is off or fails.
   */
  async chat(i: number, from: string, text: string | null, player = -1, via?: 'dm' | 'world' | 'clan'): Promise<{ reply: string; ai: boolean; did: string }> {
    const w = this.w, e = w.e;
    if (i < 0 || (e.kind[i] !== Kind.Agent && !w.isChar(i))) throw new Error('no such person');
    const id = e.id(i), p = w.profileOf(i)!, mind = this.mind(id)!;
    const owner = from === 'owner';
    const byHand = e.kind[i] === Kind.Player; // a player's character played by hand (or asleep): it answers but no one drives it
    // The owner's strict rule (sim/rules.ts): they do not talk with that player at all, and no AI request is spent.
    const rule = player >= 0 ? w.rules.between(i, player, 'talk') : null;
    if (rule) { w.emit('rule', { id, rule, with: e.id(player) }); return { reply: '', ai: false, did: `rule: ${rule}` }; }
    if (w.family.ageOf(i) < 2) { // a baby: no words yet, and no AI call for it
      if (text) this.convo.add(w.gameSec, player >= 0 ? e.id(player) : owner ? -2 : -1, id, text);
      const reply = this.childish(i, '');
      this.say(i, reply, true);
      return { reply, ai: false, did: '' };
    }
    if (text) this.convo.add(w.gameSec, player >= 0 ? e.id(player) : owner ? -2 : -1, id, text);
    if (player >= 0 && !byHand && !via) w.brain.listen(i, player, 30); // a written message (panel chat) does not stop them
    // My clan's elected leader speaking (a player leading the clan): loyal members do what they ask (imad 2026-11-25).
    const myClan = w.clans.clanOf(id), boss = !owner && player >= 0 && !!myClan && myClan.leader === e.id(player) && myClan.leader !== id;
    const loyalBoss = boss && w.rng.chance(0.25 + w.clans.loyalty(id) * 0.75);
    const who = owner ? 'a voice from the sky (the owner of this world; you always do what it asks)' : boss ? `${from}, the elected leader of your clan ${myClan!.name} (your loyalty ${Math.round(w.clans.loyalty(id) * 100)}%: you usually do what your leader asks)` : `${from}, a player (a survivor like you)`;
    const key = '@' + from;
    let reply = '', usedAi = false, doRaw = '', target = '', planRaw: unknown[] | null = null, taskText = '';
    // Marriage and divorce by words (imad 2026-11-20): only between a player's character and the person spoken to.
    const sid = player >= 0 && w.profileOf(player) ? e.id(player) : -1; // a player's character or a person sent to ask
    const sp = sid >= 0 ? w.profiles.get(sid) : undefined;
    const proposal = !!text && !!sp && askedMarry(text), wantsDivorce = !!text && !!sp && !proposal && askedDivorce(text) && (p.partner === sid || sp.partner === id);
    const canWed = proposal ? w.life.canMarry(sid, id) : false;
    let wed: boolean | undefined;
    const st = this.ai.status();
    if (st.ready && (e.act[i] !== Act.Sleep || owner)) {
      const present = this.presentNames(i);
      const prompt = [this.describe(i), `People you can name: ${present.join(', ') || 'nobody'}.`, KNOW_HOW, '',
        ...(via ? [via === 'dm' ? 'This is a written message only to you (you are not next to them: "come" means walk to where they are).'
          : `This is written in the ${via === 'world' ? 'world channel, which everyone reads' : 'clan channel, which your clan reads'}; answer for yourself, briefly.`] : []),
        text ? `${who} says to you: "${text.slice(0, 300)}"` : `${who} walks up to you.`,
        `Your feeling about them: ${Math.round(mind.rel[key] ?? 0)} (-5..5).`,
        'If you are asked to do something and you agree, say what you do in "do" (come = walk to the one speaking to you; follow = keep '
        + 'walking with someone; goto = walk to someone named in "target"; bring = bring food to someone (the speaker if no target); stay = stop and wait; stop = stop what you were told; or drink, eat, '
        + 'forage, sleep, talk, wander, rest). Otherwise "do" is "nothing".',
        ...(proposal ? [canWed === true
          ? `${from} is asking you to marry them. Decide as yourself, from your feelings about them and how well you know them: add "marry": true if you accept, "marry": false if you refuse, and say it.`
          : `${from} is asking you to marry them, but you cannot: ${canWed}. Say no kindly and add "marry": false.`] : []),
        ...(wantsDivorce ? [`${from}, your partner, is telling you they want a divorce. You are divorced now: react as yourself.`] : [])].join('\n');
      const system = `You are ${p.name}, a survivor in a post-apocalyptic world. ${kidVoice(w.family.ageOf(i))} Speak naturally and briefly (one or two short sentences), in the `
        + 'language you are spoken to. Answer ONLY with JSON: {"say":"the words you say","marry":true or false (only when asked to marry),"do":"come|follow|goto|bring|stay|stop|drink|eat|forage|sleep|talk|wander|rest|nothing","target":"a name or empty",'
        + '"task":"short name of what you will do, or empty","plan":[steps, or empty]}. When you agree to something that takes several steps, write "plan": '
        + 'a list of steps you can do, each {"do":"<skill>", ...}. Skills: goto {"who"}, find {"what": "single woman" | "single man" | "partner" | "food" | "water" | a name}, '
        + 'follow {"who","minutes"}, talk {"who","times"}, court {"who"} (get to know them as a partner), marry {"who"} (walk to them and ask them to marry you: they answer for themselves), divorce {"who"} (walk to them and say you want a divorce; empty = your partner), child {} (have a baby with your partner), '
        + 'bring {"who"} (bring food), give {"who"}, stay {"minutes"}, drink, eat, forage, sleep, rest, wander, say {"text"}, '
        + 'gather {"what": "wood" | "stone" | "scrap" | "ore" | "brick", "times"}, tame {} (go to where wild horses live, walk calmly up to one and tame it), ride {"what": "home" | a place} (get on your horse, it comes when you whistle, and ride there: much faster than walking; after tame, add ride home), hunt {"what": "rabbit" | "deer" | "boar" | "wolf" | "bear" | "", "times"} (meat, leather, claws), '
        + 'craft {"what": "axe" | "spear" | "sword" | "bow" | "arrows" | "clothes" | "armor" | "helmet" | "medkit"}, '
        + 'build {"what": "campfire" | "hut" | "palisade" | "spikes" | "stonewall" | "door" | "window" | "bed" | "lamp"} (it gathers what is missing by itself), '
        + 'tend {} (put wood on the fire), collect {"what":"food","times"} (pick food up and keep it), store {"what": "food" | "wood" | "stone" | "scrap"} '
        + '(put it in the camp\'s store), take {"what","times"} (from the store), loot {"times"} (search ruins), farm {} (plant berries), repair {} (mend a hut wall), destroy {"what": "hut" | "lamp" | "bed" | "palisade" | "fire" | "field" | ""} (pull down something YOU built, or whose owner is dead; never someone else\'s), '
        + 'heal {"who"}, give {"who","what"}, trade {"who","what","get"}, npc {"what": "guide" | "smith" | "hunter" | "warden" | "registrar"} (walk to a town teacher and talk: take or hand in a quest), '
        + 'clan {"what": "join <clan name>" | "quit" | "found" | "vote", "who"} (join walks to its leader and asks; found = at Odile the registrar; vote for "who" in an election). If a request needs something you have no skill for, combine these skills into a plan. '
        + 'Use "me" for the one speaking to you and "found" for the person found by the step before. '
        + 'Example for "go find a wife": {"say":"Alright, I\'ll look around.","task":"find a wife","plan":[{"do":"find","what":"single woman"},'
        + '{"do":"talk","who":"found","times":2},{"do":"court","who":"found"}]}. '
        + 'Example for "go ask Sara to marry you": {"say":"I\'ll go and ask her.","task":"ask Sara to marry me","plan":[{"do":"marry","who":"Sara"}]}. '
        + 'Example for "divorce him": {"say":"It is time.","task":"divorce","plan":[{"do":"divorce","who":"found"}]}. '
        + 'Example for "collect food and store it": {"say":"I\'ll fill the store.","task":"stock the store","plan":[{"do":"collect","what":"food","times":4},{"do":"store","what":"food"}]}. '
        + 'Example for "build us a house": {"say":"Good idea, I\'ll get wood.","task":"build a hut","plan":[{"do":"build","what":"hut"}]}';
      const ex: Exchange = { at: Date.now(), kind: 'chat', who: `${from} -> ${p.name}`, prompt, reply: '', ms: 0 };
      try {
        const r = await this.ai.generate({ system, prompt, json: true, maxTokens: 200, temperature: 0.8 });
        ex.reply = r.text.slice(0, 2000); ex.ms = r.ms;
        const raw = r.text.replace(/<think>[\s\S]*?<\/think>/gi, '');
        const j = parseJsonReply<Record<string, unknown>>(raw);
        if (j && typeof j === 'object') {
          reply = cleanLine(String(j.say ?? j.text ?? j.answer ?? ''), p.name);
          doRaw = String(j.do ?? j.action ?? '').trim().toLowerCase();
          target = String(j.target ?? j.with ?? '').trim();
          if (Array.isArray(j.plan)) planRaw = j.plan as unknown[];
          if (typeof j.task === 'string') taskText = j.task;
          if (typeof j.marry === 'boolean') wed = j.marry;
          else if (typeof j.marry === 'string') wed = /^(true|yes|oui|s[ií])$/i.test(j.marry);
        } else reply = cleanLine(raw, p.name); // the model forgot the JSON: its words are still the answer
        usedAi = !!reply;
        if (!reply) ex.err = 'empty answer';
      } catch (err) {
        ex.err = err instanceof Error ? err.message : String(err);
        this.counts.failures++;
      }
      this.keep(ex);
    }
    let marriage = '';
    if (proposal && sp) {
      // The answer decides (an AI that forgot "marry" but said yes counts); without AI: how well they know and like the speaker.
      const bonds = p.bonds?.['#' + sid] ?? 0, feel = mind.rel[key] ?? 0;
      const yes = canWed === true && (usedAi ? (wed ?? agrees(reply)) : w.rng.chance(Math.min(0.9, 0.2 + bonds * 0.1 + feel * 0.08 + p.traits.empathy * 0.2)));
      if (yes) { const r = w.life.wed(sid, id); marriage = r === true ? 'married' : ''; }
      if (!reply) reply = marriage ? 'Yes! Yes, I will.' : canWed === true ? "I'm sorry... not yet. I need to know you better." : `I can't: ${canWed}.`;
      if (marriage) { this.feel(id, key, 3); this.note(id, `I married ${sp.name}.`, true); mind.mood = 'happy'; }
      else this.note(id, `${sp.name} asked me to marry them; I said no.`, true);
    } else if (wantsDivorce && sp) {
      if (w.life.divorce(sid, id) === true) {
        marriage = 'divorced';
        this.feel(id, key, -3); this.note(id, `${sp.name} divorced me.`, true); mind.mood = 'sad';
        if (!reply) reply = 'So that is how it ends... Goodbye, then.';
      }
    }
    // What was asked, from the speaker's own words (works without AI too).
    const asked = text && !proposal && !wantsDivorce ? askedFor(text) : '';
    const agreed = reply ? agrees(reply) : false;
    if (!doRaw || doRaw === 'nothing' || doRaw === 'none') {
      // The owner is obeyed; a player when the answer agrees (or there is no AI to ask).
      if (asked && (owner || loyalBoss || agreed || !usedAi)) doRaw = asked;
      else doRaw = '';
    }
    if (!reply) {
      reply = doRaw === 'come' || doRaw === 'follow' ? (owner ? 'Yes. On my way.' : "Alright, I'm coming.") : doRaw === 'stay' ? "Okay, I'll wait here." : doRaw === 'bring' ? "I'll find you something to eat." : this.builtInLine(i);
      this.counts.builtIn++;
    }
    // A plan of steps wins over a single "do": that is how any request becomes something they really do.
    let steps = planRaw ? this.toSteps(i, planRaw, player) : [];
    // A model's one-step plan often drops the count the speaker said ("hunt 3 animals" -> [{do: 'hunt'}]): the words give it.
    if (steps.length === 1 && text && !steps[0]!.times && ['hunt', 'gather', 'collect', 'loot', 'take'].includes(steps[0]!.do)) { const n = countIn(text); if (n >= 2) steps[0]!.times = n; }
    const work = text && !steps.length && (!doRaw || doRaw === 'nothing') ? askedWork(text) : null;
    if (work && (owner || loyalBoss || agreed || !usedAi)) { steps = work.steps; if (!taskText) taskText = work.task; }
    // "Go ask Sara to marry you" / "divorce her": the words are enough when a small model gave no plan.
    if (!steps.length && !byHand && text && !proposal && !wantsDivorce && (owner || agreed || !usedAi)) {
      const wed = askedToWedSomeone(text);
      if (wed) {
        let who = -1;
        for (const wd of text.match(/\p{L}[\p{L}'-]*/gu) ?? []) { const x = this.whoIs(wd, id); if (x >= 0 && x !== sid) { who = x; break; } }
        if (wed === 'divorce' && who < 0 && p.partner >= 0) who = p.partner;
        if (who >= 0) { steps = [{ do: wed, who }]; if (!taskText) taskText = `${wed === 'marry' ? 'ask' : 'divorce'} ${this.nameOfId(who)}${wed === 'marry' ? ' to marry me' : ''}`; }
      }
    }
    let did = '';
    if (byHand && steps.some((s) => s.do === 'marry' || s.do === 'divorce')) { // a character played by hand does not walk: it is asked / done now
      const s0 = steps.find((s) => s.do === 'marry' || s.do === 'divorce')!;
      const r = await this.wedNow(i, s0.do as 'marry' | 'divorce', s0.who ?? -1);
      const nm = this.nameOfId(s0.who ?? -1);
      did = r === 'ok' ? (s0.do === 'marry' ? `marry ${nm} (done)` : `divorce ${nm} (done)`) : `${s0.do} ${nm}: not done, ${r}`;
      steps = [];
    }
    if (steps.length >= 1 && (steps.length > 1 || !doRaw || !['come', 'follow', 'goto', 'bring', 'stay', 'stop'].includes(doRaw))) {
      const what = (taskText || (text ?? '') || steps.map((x) => x.do).join(', ')).slice(0, 100);
      if (!byHand && w.tasks.start(i, what, from, steps)) did = `${what} (${steps.map((x) => x.do).join(' > ')})`;
    }
    if (!did && marriage) did = marriage === 'married' ? `marry ${sp!.name}` : `divorce ${sp!.name}`;
    if (!did && !byHand) did = this.applyChatOrder(i, doRaw, target, player, owner);
    this.counts.chats++;
    reply = this.childish(i, reply);
    this.note(id, (text ? `${owner ? 'The voice from the sky' : from} said "${text.slice(0, 80)}"; I answered "${reply.slice(0, 80)}".` : `${from} came to talk; I said "${reply.slice(0, 80)}".`)
      + (did ? ` I will ${did}.` : ''), !!text);
    this.feel(id, key, 0.5);
    if (via) this.convo.add(w.gameSec, id, player >= 0 ? e.id(player) : -1, reply); // written back, not said aloud
    else if (e.slot(id) === i) this.say(i, reply, true);
    return { reply, ai: usedAi, did };
  }

  /** The model's plan as steps the engine runs (names -> people; unknown skills dropped). */
  private toSteps(i: number, raw: unknown[], player: number): Step[] {
    const whoRawOf = (o: Record<string, unknown>) => String(o.who ?? o.with ?? o.target ?? '').trim();
    const e = this.w.e, id = i >= 0 ? e.id(i) : -1, speaker = player >= 0 && e.kind[player] === Kind.Player ? e.id(player) : -1;
    const out: Step[] = [];
    let found = -1, foundStep: Step | null = null;
    for (const r of raw.slice(0, 8)) {
      if (!r || typeof r !== 'object') continue;
      const o = r as Record<string, unknown>;
      let d = String(o.do ?? o.skill ?? o.action ?? '').trim().toLowerCase().replace(/[^a-z_]/g, '');
      d = ({ go_to: 'goto', go: 'goto', come: 'goto', walk: 'goto', search: 'find', look: 'find', marry: 'marry', wed: 'marry', propose: 'marry', ask_to_marry: 'marry', get_married: 'marry', ask_partner: 'court', end_marriage: 'divorce', split: 'divorce', baby: 'child', have_child: 'child', wait: 'stay', fetch: 'bring', get_food: 'forage', chop: 'gather', mine: 'gather', dig: 'gather', hunting: 'hunt', tame_horse: 'tame', catch_horse: 'tame', break_horse: 'tame', horse: 'tame', ride_horse: 'ride', mount: 'ride', gallop: 'ride', kill: 'hunt', shoot: 'hunt', collect: 'gather', cut: 'gather', make: 'craft', light: 'build', fire: 'build', feed: 'tend', refuel: 'tend',
        pick: 'collect', pick_up: 'collect', pickup: 'collect', stock: 'store', deposit: 'store', put: 'store', stash: 'store', scavenge: 'loot',
        plant: 'farm', grow: 'farm', fix: 'repair', mend: 'repair', treat: 'heal', bandage: 'heal', exchange: 'trade', swap: 'trade', withdraw: 'take', demolish: 'destroy', tear_down: 'destroy', pull_down: 'destroy', dismantle: 'destroy' } as Record<string, string>)[d] ?? d;
      if (!(SKILLS as readonly string[]).includes(d)) continue;
      const st: Step = { do: d };
      const whoRaw = String(o.who ?? o.with ?? o.target ?? (o.do === 'come' ? 'me' : '')).trim();
      if (d === 'divorce' && !whoRawOf(o)) { const pt = this.w.profileOf(i)?.partner ?? -1; if (pt >= 0) { st.who = pt; out.push(st); continue; } }
      if (d === 'give' || d === 'trade' || d === 'collect' || d === 'store' || d === 'take') st.what = String(o.what ?? o.item ?? (d === 'collect' || d === 'store' || d === 'take' ? 'food' : '')).slice(0, 40);
      if (d === 'trade') st.text = String(o.get ?? o.for ?? 'food').slice(0, 40);
      if (d === 'npc' || d === 'clan') { st.what = String(o.what ?? o.who ?? o.target ?? '').slice(0, 40); if (d === 'clan' && o.who) { const x = this.whoIs(String(o.who), id); if (x >= 0) st.who = x; } out.push(st); continue; }
      if (d === 'find' || d === 'gather' || d === 'craft' || d === 'build' || d === 'hunt' || d === 'destroy' || d === 'ride') st.what = String(o.what ?? o.item ?? o.target ?? o.who ?? (o.do === 'fire' || o.do === 'light' ? 'campfire' : '')).slice(0, 40);
      else if (whoRaw) {
        const w = whoRaw.toLowerCase();
        if (['me', 'you', 'him', 'her', 'the player', 'speaker'].includes(w)) st.who = speaker;
        else if (['found', 'them', 'they', 'it', 'she', 'he'].includes(w)) { if (foundStep) { st.who = -2; } }
        else st.who = this.whoIs(whoRaw, id);
      } else if (d === 'goto' || d === 'follow' || d === 'bring' || d === 'give') st.who = speaker;
      if (typeof o.times === 'number') st.times = Math.max(1, Math.min(d === 'gather' ? 12 : d === 'collect' || d === 'loot' ? 8 : d === 'take' ? 5 : 4, Math.round(o.times)));
      if (typeof o.minutes === 'number') st.minutes = Math.max(5, Math.min(600, Math.round(o.minutes)));
      if (d === 'say') st.text = String(o.text ?? o.say ?? '').slice(0, 200);
      if ((d === 'goto' || d === 'follow' || d === 'talk' || d === 'court' || d === 'marry' || d === 'divorce' || d === 'bring' || d === 'give' || d === 'heal' || d === 'trade') && (st.who === undefined || st.who === -1)) continue; // nobody to do it with
      out.push(st);
      if (d === 'find') { foundStep = st; found = -2; }
    }
    void found;
    if (out.some((x) => x.do === 'tame') && !out.some((x) => x.do === 'ride')) out.push({ do: 'ride', what: 'home' }); // a tamed horse is ridden home
    return out;
  }

  /** Turn a chat's "do" into an order. Returns what they do, in words ('' = nothing). */
  private applyChatOrder(i: number, doRaw: string, target: string, player: number, owner: boolean): string {
    const w = this.w, e = w.e, id = e.id(i);
    const d = doRaw.replace(/[^a-z]/g, '');
    if (!d) return '';
    const speaker = player >= 0 && e.kind[player] === Kind.Player ? e.id(player) : -1;
    const named = target ? this.whoIs(target, id) : -1;
    const mins = owner ? 180 : 60;
    if (d === 'come' || d === 'goto' || d === 'follow') {
      // The voice from the sky has no body: "come" = to the player named, else the player on this map (the owner playing).
      const onMap = (): number => { for (const [, slot] of this.players()) if (e.map[slot] === e.map[i]) return e.id(slot); return -1; };
      const to = d === 'come' ? (speaker >= 0 ? speaker : named >= 0 ? named : owner ? onMap() : -1) : named >= 0 ? named : speaker >= 0 ? speaker : owner ? onMap() : -1;
      if (to < 0) return '';
      if (!w.brain.order(e.slot(id), d === 'follow' ? 'follow' : 'goto', to, -1, d === 'follow' ? mins * 2 : mins)) return '';
      return `${d === 'follow' ? 'follow' : 'go to'} ${this.nameOfId(to)}`;
    }
    if (d === 'bring' || d === 'fetch' || d === 'give') {
      const to = named >= 0 ? named : speaker >= 0 ? speaker : owner ? (() => { for (const [, slot] of this.players()) if (e.map[slot] === e.map[i]) return e.id(slot); return -1; })() : -1;
      if (to < 0 || !w.brain.order(e.slot(id), 'bring', to, -1, mins * 2)) return '';
      return `bring food to ${this.nameOfId(to)}`;
    }
    if (d === 'stay' || d === 'wait') { w.brain.order(e.slot(id), 'stay', -1, -1, mins); return 'wait here'; }
    if (d === 'stop') { w.brain.order(e.slot(id), 'stop', -1, -1, 0); return 'stop'; }
    const act = GOALS[d];
    if (act === undefined) return '';
    if (act === Act.Talk && named >= 0) { w.brain.order(e.slot(id), 'goto', named, -1, mins); return `go to talk with ${this.nameOfId(named)}`; }
    w.brain.order(e.slot(id), 'act', -1, act, mins);
    return d;
  }

  /** Names a person can use: the people and players on their map. */
  private presentNames(i: number): string[] {
    const e = this.w.e, out: string[] = [];
    for (const [id, p] of this.w.profiles) { const k = e.slot(id); if (k >= 0 && k !== i && e.map[k] === e.map[i]) out.push(p.name); }
    for (const [n, slot] of this.players()) if (e.map[slot] === e.map[i]) out.push(n);
    return out.slice(0, 20);
  }

  whoName(id: number): string { return this.nameOfId(id); }

  private nameOfId(id: number): string {
    const p = this.w.profiles.get(id);
    if (p) return p.name;
    const slot = this.w.e.slot(id);
    for (const [n, s] of this.players()) if (s === slot) return n;
    return 'them';
  }

  /** The owner's order from the panel, without asking the model. */
  /** Right now, without walking: ask them to marry / divorce them. 'ok' = it happened (saved on both), else why not. */
  async wedNow(i: number, what: 'marry' | 'divorce', who: number): Promise<string> {
    const w = this.w, e = w.e, ida = e.id(i), pa = w.profiles.get(ida), pb = w.profiles.get(who), j = e.slot(who);
    if (!pa || !pb || j < 0) return 'they are not here';
    if (what === 'divorce') {
      const r = w.life.divorce(ida, who);
      if (r === true) { this.note(ida, `I divorced ${pb.name}.`, true); this.note(who, `${pa.name} divorced me.`, true); return 'ok'; }
      return String(r);
    }
    const r = await this.chat(j, pa.name, 'Will you marry me?', i);
    return pa.partner === who ? 'ok' : `${pb.name} said no${r.reply ? `: "${r.reply}"` : ''}`;
  }
  /** The panel's order "marry X" / "divorce X" (empty = their partner): a task for a person on their feet, done at once for a player's character played by hand. */
  async orderWed(i: number, kind: 'marry' | 'divorce', target: string): Promise<string> {
    const w = this.w, e = w.e;
    if (i < 0 || (e.kind[i] !== Kind.Agent && !w.isChar(i))) throw new Error('no such person');
    const p = w.profileOf(i)!;
    let who = target.trim() ? this.whoIs(target, e.id(i)) : kind === 'divorce' ? p.partner : -1;
    if (who < 0) throw new Error(kind === 'divorce' && !target.trim() ? 'they have no partner' : 'choose who (a name)');
    const nm = this.nameOfId(who);
    if (e.kind[i] === Kind.Agent) {
      if (!w.tasks.start(i, kind === 'marry' ? `ask ${nm} to marry me` : `divorce ${nm}`, 'owner', [{ do: kind, who }])) throw new Error('could not start');
      this.note(e.id(i), `The voice from the sky told me to ${kind === 'marry' ? 'ask ' + nm + ' to marry me' : 'divorce ' + nm}.`, true);
      return kind === 'marry' ? `go and ask ${nm} to marry them` : `divorce ${nm}`;
    }
    const r = await this.wedNow(i, kind, who);
    if (r !== 'ok') throw new Error(r);
    return kind === 'marry' ? `married ${nm}` : `divorced ${nm}`;
  }

  orderFromPanel(i: number, kind: string, target: string): string {
    const w = this.w, e = w.e;
    if (i < 0 || e.kind[i] !== Kind.Agent) throw new Error('no such person');
    const work = WORK_GOALS[kind];
    if (work) {
      if (!w.tasks.start(i, kind, 'the voice from the sky', work.map((st) => ({ ...st })))) throw new Error('could not start');
      this.note(e.id(i), `The voice from the sky told me to ${kind}.`, true);
      return kind;
    }
    const did = this.applyChatOrder(i, kind, target, -1, true);
    if (!did) throw new Error(kind === 'goto' || kind === 'follow' ? 'choose who' : 'unknown order');
    this.note(e.id(i), `The voice from the sky told me to ${did}.`, true);
    return did;
  }

  /** What a person says without a model: from their needs and the time of day. */
  builtInLine(i: number): string {
    const e = this.w.e, r = this.w.rng.next();
    if (e.act[i] === Act.Sleep) return 'Zzz...';
    if (e.thirst[i]! > 65) return r < 0.5 ? "I'm so thirsty. Is there any clean water near here?" : 'Water... I need water before anything else.';
    if (e.hunger[i]! > 65) return r < 0.5 ? "Got any food? I'm starving." : "I haven't eaten in a while. Seen any cans around?";
    if (e.tired[i]! > 70) return 'I can barely keep my eyes open.';
    if (e.lonely[i]! > 50) return r < 0.5 ? 'Good to see a friendly face out here.' : "Stay a while. It's been lonely.";
    const lines = ['Stay safe out there.', 'Quiet day. I like it that way.', 'Keep an eye out for supply drops.', 'The old town still has a few roofs left.'];
    return lines[Math.floor(r * lines.length)]!;
  }

  /**
   * Make a rule smart: the model reads the owner's words once and says what they forbid and about whom, so any
   * wording works (not only the words compileRule knows). One request per rule, never again. Keeps the word check's
   * findings too (both are forbidden), so a confused answer can only add, never let something through.
   */
  async refineRule(r: Rule, about: string): Promise<Rule> {
    if (!this.ai.status().ready) return r;
    if (r.by === 'words') return r; // an order to DO the engine read from the words: nothing for the AI to add
    if (r.kind === 'when' || (r.kind === 'goal' && r.goal && r.goal !== 'plan')) { r.ai = true; return r; } // the engine knows these already
    const names = [...new Set([...this.w.profiles.values()].filter((p) => p.died === undefined).map((p) => p.name).concat([...this.players()].map(([n]) => n)))];
    const prompt = `The owner of a world gave ${about} this strict rule: "${r.text}".\nPeople: ${names.join(', ')}.\n`
      + `Things a person can do: ${RULE_ACTS.join(', ')}.\nWhich of those things does the rule forbid, and is it about one person (a name from the list) or nobody in particular?`;
    const system = 'Answer ONLY with JSON: {"forbid":["things from the list"],"with":"a name or empty","plan":[steps]}. Forbid everything the rule means: '
      + '"never talk to X" forbids talk, court and child with X; "stay away from X" forbids goto, follow, talk, give, trade, bring, heal, court, child with X; '
      + '"never leave the town" forbids travel. If the rule forbids nothing on the list, "forbid" is []. '
      + 'If the rule is an order to DO something, "plan" is a short list of steps (at most 6), each {"do":"<skill>", ...}. Skills: goto {"who"}, find {"what"}, '
      + 'follow {"who","minutes"}, talk {"who","times"}, court {"who"}, child {}, bring {"who"}, give {"who","what"}, stay {"minutes"}, drink, eat, forage, sleep, rest, '
      + 'wander, say {"text"}, gather {"what": "wood"|"stone"|"scrap"|"ore", "times"}, hunt {"what","times"}, craft {"what"}, build {"what": "campfire"|"hut"|"palisade"|"bed"|"lamp"|"door"}, '
      + 'tend {}, collect {"what":"food","times"}, store {"what"}, take {"what","times"}, loot {"times"}, farm {}, repair {}, destroy {"what"}, heal {"who"}, trade {"who","what","get"}. '
      + 'Use names for "who", "found" for the person found by the step before. Otherwise "plan" is [].';
    const ex: Exchange = { at: Date.now(), kind: 'rule', who: about, prompt, reply: '', ms: 0 };
    try {
      const a = await this.ai.generate({ system, prompt, json: true, maxTokens: 120, temperature: 0.1 });
      ex.reply = a.text.slice(0, 1000); ex.ms = a.ms;
      const j = parseJsonReply<{ forbid?: unknown; with?: unknown; plan?: unknown }>(a.text.replace(/<think>[\s\S]*?<\/think>/gi, ''));
      if (j && (Array.isArray(j.forbid) || Array.isArray(j.plan))) {
        j.forbid ??= [];
        // An order to DO is never turned into a "never" (small models listed "hunt" as forbidden for "you must hunt every day").
        const add = isMust(r.text) ? [] : (j.forbid as unknown[]).map((x) => String(x).trim().toLowerCase()).filter((x) => (RULE_ACTS as readonly string[]).includes(x));
        r.forbid = [...new Set([...r.forbid, ...add])];
        // Forbids something = a "never" rule; else an order to do something: the AI's plan, run once a game day.
        if (r.forbid.length) { r.kind = 'never'; delete r.goal; }
        else if (r.kind === 'goal' && !r.goal && Array.isArray(j.plan)) { const st = this.toSteps(-1, j.plan, -1); if (st.length) { r.plan = st; r.by = 'ai'; classify(r); } }
        const wn = typeof j.with === 'string' ? j.with.trim() : '';
        if (r.with < 0 && wn) { const id = this.whoIs(wn); if (id >= 0) { r.with = id; r.withName = this.nameOfId(id); } }
        r.ai = true;
      } else ex.err = 'no JSON';
    } catch (err) {
      ex.err = err instanceof Error ? err.message : String(err);
      this.counts.failures++;
    }
    this.keep(ex);
    return r;
  }

  private keep(ex: Exchange): void {
    ex.prompt = ex.prompt.slice(0, 6000);
    this.log.push(ex);
    if (this.log.length > 20) this.log.splice(0, this.log.length - 20);
  }
}
