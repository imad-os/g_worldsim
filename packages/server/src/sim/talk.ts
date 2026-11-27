import { Act, EFlag, Kind } from '@worldsim/protocol';
import type { World, WorldEvent } from './world.js';
import type { PlaceKind } from './memory.js';
import type { Step } from './tasks.js';
import { DANGEROUS, type Sight } from './aware.js';

/**
 * Conversations that carry knowledge (flag `aware`, research/PEOPLE_AI.md, imad 2026-11-27: "they must feel alive").
 *
 * When two people stop to talk (the `talk` event), they now TELL each other things that the other does not know yet and
 * that matter to them, chosen by value to the listener, not at random:
 *
 *  - dangers and game they saw (sim/aware.ts sightings): "Two zombies by the north road, not an hour ago."
 *  - places from their memory (sim/memory.ts): water, wood, rocks, ore, game, where someone got hurt
 *  - news (`Mind.heard`): deaths, births, weddings, a new leader, wars, a dream come true, an expedition's tale. A witness
 *    knows; everyone else hears it from someone (hop 1, 2, 3...: gossip spreads person to person, the evening fire most)
 *  - tips: one who is good at a job (Colony know: successes) tells one who keeps failing at it (`Colony.teach`)
 *  - the people's lore for a child (sim/lore.ts): children learn the old lessons faster from the adults who talk to them
 *  - help: a starving listener gets a share of the speaker's food
 *  - a joint plan (`pact`): "Let's hunt together", "let's fetch wood for the camp": both get a task, one leads
 *
 * The listener's knowledge changes for real (their places, sightings, news, know-how, the lore they carry), so what they
 * do next and what every prompt says about them changes too. Nobody tells an enemy clan where the good places are, and
 * a third-hand story is less precise (a few metres per retelling). No AI calls: the lines are made from what is passed.
 * Each piece passed is a world event `learned` { from, to, kind, what, text, map } (the panel's Thoughts screen reads
 * it), each agreed plan a `pact` { a, b, what, text, map }.
 */
export interface News { key: string; text: string; t: number; imp: number; hop: number; from: number; about: number[] }
export type LearnKind = 'danger' | 'game' | 'place' | 'news' | 'rumour' | 'skill' | 'lore' | 'help' | 'plan';
interface Item { v: number; kind: LearnKind; what: string; say: string; reply: string; apply: () => void }

const HEARD = 10, ROUNDS = 4, PACT_EVERY = 4 * 3600, DAY = 86400;
const PLACE_V: Partial<Record<PlaceKind, number>> = { water: 2, wood: 2, stone: 2, ore: 3, hunt: 3, food: 2, danger: 5 };
const PLACE_TXT: Partial<Record<PlaceKind, string>> = { water: 'water', wood: 'good trees for wood', stone: 'rocks to break for stone', ore: 'rocks with ore', hunt: 'game', food: 'berries and food', danger: 'trouble (someone got hurt there)' };
const KEY_TXT: Record<string, string> = { hunt: 'hunting', 'gather:wood': 'chopping wood', 'gather:stone': 'getting stone', 'gather:ore': 'finding ore', 'gather:herb': 'picking herbs', 'build:hut': 'building huts', 'build:campfire': 'making fires', farm: 'farming', loot: 'searching the ruins', store: 'stocking the store' };
const TIP: Record<string, string> = {
  hunt: 'come at them slowly from behind cover, and go for deer and rabbits before anything with teeth.',
  'gather:wood': 'an axe gives two logs a cut, and the big trees near the water are quicker.',
  'gather:stone': 'hit the rock in the same place: six blows and it breaks.',
  'gather:ore': 'the dark rocks hold ore; keep hitting, it comes about one blow in ten.',
  'build:hut': 'get all the wood, stone and leather together first, then build it in one go.',
};

export class Talk {
  /** Called for each line said (Planner puts them in the conversation log). */
  onLine: (at: number, from: number, to: number, text: string) => void = () => {};
  /** The last talk handled: the planner adds its built-in small talk only when nothing real was said. */
  last = { a: -1, b: -1, tick: -1, n: 0 };
  private readonly pactAt = new Map<number, number>();
  /** Plans agreed in the evening for the next morning: entity id -> the plan (memory only). */
  readonly plans = new Map<number, { other: number; lead: number; what: string; text: string; day: number }>();
  private lastHour = -1;
  stats = { talks: 0, items: 0, pacts: 0, gifts: 0, byKind: {} as Record<string, number> };

  constructor(private readonly w: World) {
    w.listeners.push((ev) => this.on(ev));
  }
  private get on_(): boolean { return this.w.ai.aware !== false; }

  // ------------------------------------------------------------------ news
  heard(id: number): News[] {
    const p = this.w.profiles.get(id);
    if (!p || p.died !== undefined) return [];
    p.mind ??= { notes: [], summary: '', mood: 'calm', rel: {}, lastPlan: 0 };
    return ((p.mind as { heard?: News[] }).heard ??= []);
  }
  knowsNews(id: number, key: string): boolean { return this.heard(id).some((n) => n.key === key); }
  /** Give person id a piece of news (first hand: hop 0). */
  seed(id: number, key: string, text: string, imp: number, about: number[] = [], hop = 0, from = -1, t = this.w.gameSec): boolean {
    const list = this.heard(id);
    if (!this.w.profiles.get(id) || list.some((n) => n.key === key)) return false;
    list.push({ key, text: text.slice(0, 110), t, imp, hop, from, about });
    if (list.length > HEARD) {
      let worst = 0, ws = Infinity;
      for (let k = 0; k < list.length; k++) { const n = list[k]!, v = n.imp - (this.w.gameSec - n.t) / DAY * 1.5; if (v < ws) { ws = v; worst = k; } }
      list.splice(worst, 1);
    }
    return true;
  }
  /** Seed news to the people within r m of (m, x, y) and to the extra ids. */
  private witness(m: number, x: number, y: number, r: number, key: string, text: string, imp: number, about: number[], extra: number[] = []): void {
    const e = this.w.e;
    for (const id of extra) if (id >= 0) this.seed(id, key, text, imp, about);
    if (m < 0) return;
    for (let j = 0; j < e.hi; j++) if (e.kind[j] === Kind.Agent && e.map[j] === m && !(e.flags[j]! & EFlag.Sleeping) && Math.abs(e.x[j]! - x) < r && Math.abs(e.y[j]! - y) < r) this.seed(e.id(j), key, text, imp, about);
  }
  private nm(id: number): string { return this.w.profiles.get(id)?.name ?? 'someone'; }
  private slotPos(id: number): [number, number, number] { const e = this.w.e, i = e.slot(id); return i >= 0 ? [e.map[i]!, e.x[i]!, e.y[i]!] : [-1, 0, 0]; }

  private on(ev: WorldEvent): void {
    if (!this.on_) return;
    const w = this.w, d = ev.data as Record<string, any>;
    switch (ev.kind) {
      case 'talk': this.exchange(Number(d.a), Number(d.b)); break;
      case 'death': {
        const id = Number(d.id), p = w.profiles.get(id), m = w.mapIndex.get(String(d.map)) ?? -1;
        if (!p) break;
        const kin = [p.partner, ...p.parents]; for (const [pid, q] of w.profiles) if (q.parents.includes(id)) kin.push(pid);
        this.witness(m, Number(d.x ?? 0), Number(d.y ?? 0), 25, `death:${id}`, `${p.name} died (${String(d.cause ?? 'unknown')})`, 8, [id], kin);
        break;
      }
      case 'birth': {
        const id = Number(d.id), mo = Number(d.mother), fa = Number(d.father), [m, x, y] = this.slotPos(mo);
        this.witness(m, x, y, 20, `birth:${id}`, `${this.nm(mo)} had a baby: ${this.nm(id)}`, 6, [id], [mo, fa]);
        break;
      }
      case 'partner': {
        const a = Number(d.a), b = Number(d.b), [m, x, y] = this.slotPos(a);
        this.witness(m, x, y, 15, `couple:${Math.min(a, b)}:${Math.max(a, b)}:${Math.floor(w.gameSec / DAY)}`, `${this.nm(a)} and ${this.nm(b)} ${d.wed ? 'got married' : 'are together now'}`, 5, [a, b], [a, b]);
        break;
      }
      case 'divorce': {
        const a = Number(d.a), b = Number(d.b), [m, x, y] = this.slotPos(a);
        this.witness(m, x, y, 15, `split:${Math.min(a, b)}:${Math.max(a, b)}:${Math.floor(w.gameSec / DAY)}`, `${this.nm(a)} and ${this.nm(b)} split up`, 5, [a, b], [a, b]);
        break;
      }
      case 'leader': { const id = Number(d.id); if (id >= 0) { const [m, x, y] = this.slotPos(id); this.witness(m, x, y, 30, `leader:${id}:${Math.floor(w.gameSec / DAY)}`, `${this.nm(id)} leads the camp now`, 5, [id], [id]); } break; }
      case 'dream': if (d.done) this.seed(Number(d.id), `dream:${d.id}:${Math.floor(w.gameSec / DAY)}`, `${this.nm(Number(d.id))}'s dream came true: ${String(d.text ?? '')}`, 4, [Number(d.id)]); break;
      case 'explore': {
        const found = (d.found as string[] | undefined) ?? [];
        if (found.length) this.seed(Number(d.id), `explore:${d.id}:${Math.floor(w.gameSec / 3600)}`, `${this.nm(Number(d.id))} went exploring ${d.wild ? 'deep in' : 'round'} ${String(d.name ?? 'the land')} and found ${found.slice(0, 3).join(', ')}`, d.wild ? 5 : 3, [Number(d.id)]);
        break;
      }
      case 'clanWar': case 'clanPeace': {
        const text = ev.kind === 'clanWar' ? `${String(d.clan)} declared war on ${String(d.foe)}` : `${String(d.clan)} and ${String(d.foe)} made peace`;
        const key = `${ev.kind}:${String(d.clan)}:${String(d.foe)}:${Math.floor(w.gameSec / DAY)}`;
        for (const c of w.clans.clans) if (c.name === d.clan || c.name === d.foe) { this.seed(c.leader, key, text, 7); for (const id of c.members) if (w.rng.chance(0.3)) this.seed(id, key, text, 7); }
        break;
      }
      case 'bitten': if (Number(d.hp ?? 100) < 40) { const id = Number(d.id), [m, x, y] = this.slotPos(id); this.witness(m, x, y, 20, `hurt:${id}:${Math.floor(w.gameSec / 3600)}`, `${this.nm(id)} was badly hurt by ${d.animal ? `a ${String(d.animal)}` : 'a zombie'}`, 5, [id], [id]); } break;
      case 'duel': { const a = Number(d.a), b = Number(d.b), [m, x, y] = this.slotPos(a); this.witness(m, x, y, 20, `duel:${Math.min(a, b)}:${Math.max(a, b)}:${Math.floor(w.gameSec / 3600)}`, `${this.nm(a)} and ${this.nm(b)} came to blows`, 4, [a, b]); break; }
      case 'build': if ((d.what === 'hut' || d.what === 'house') && Number(d.id ?? -1) >= 0) this.seed(Number(d.id), `hut:${d.id}:${d.tx}:${d.ty}`, `${this.nm(Number(d.id))} built a new ${String(d.what)}`, 3, [Number(d.id)]); break;
      case 'trespass': { // territory (sim/territory.ts, another module): an intruder was warned off a clan's camp
        const id = Number(d.id ?? -1), [m, x, y] = this.slotPos(id);
        if (id >= 0) this.witness(m, x, y, 25, `trespass:${id}:${Math.floor(w.gameSec / 3600)}`, `${this.nm(id)} was chased out of ${String(d.clan ?? 'a clan')}'s camp`, 5, [id]);
        break;
      }
    }
  }

  // ------------------------------------------------------------------ the talk
  private exchange(a: number, b: number): void {
    const w = this.w, e = w.e, ia = e.slot(a), ib = e.slot(b);
    this.last = { a, b, tick: w.tick, n: 0 };
    if (ia < 0 || ib < 0 || e.kind[ia] !== Kind.Agent || e.kind[ib] !== Kind.Agent) return;
    this.stats.talks++;
    const told = new Set<string>();
    let at = w.gameSec, n = 0;
    const line = (from: number, to: number, text: string) => { if (!text) return; this.onLine(at, from, to, text); at += 1; n++; };
    for (let r = 0; r < ROUNDS; r++) {
      const [s, l] = r % 2 === 0 ? [ia, ib] : [ib, ia];
      const it = this.best(s, l, told);
      if (!it) { if (r > 0 && !this.best(l, s, told)) break; continue; }
      told.add(it.kind + ':' + it.what);
      it.apply();
      this.stats.items++; this.stats.byKind[it.kind] = (this.stats.byKind[it.kind] ?? 0) + 1;
      line(e.id(s), e.id(l), it.say); line(e.id(l), e.id(s), it.reply);
      w.emit('learned', { from: e.id(s), to: e.id(l), kind: it.kind, what: it.what, text: `${this.nm(e.id(s))} told ${this.nm(e.id(l))}: ${it.say}`, map: w.maps[e.map[s]!]!.def.id });
    }
    for (const [s, l] of [[ia, ib], [ib, ia]] as const) { const g = this.gift(s, l); if (g) { line(e.id(s), e.id(l), g[0]); line(e.id(l), e.id(s), g[1]); } }
    const p = this.pact(ia, ib);
    if (p) { line(a, b, p[0]); line(b, a, p[1]); }
    this.last.n = n;
  }

  /** What speaker s could tell listener l that l does not know, most useful to l first (null: nothing worth saying). */
  private best(s: number, l: number, told: Set<string>): Item | null {
    const w = this.w, e = w.e, sid = e.id(s), lid = e.id(l);
    const foes = w.clans.enemies(sid, lid), feel = (w.profiles.get(sid)?.mind?.rel ?? {})['#' + lid] ?? 0;
    if (feel <= -3) return null; // nothing for someone they dislike
    const items: Item[] = [];
    const lp = w.profileOf(l), lage = w.family.ageOf(l);
    const hunter = lp?.dream?.kind === 'hunter' || lp?.mind?.task?.steps?.[lp.mind.task.k]?.do === 'hunt';
    const want = (lp?.mind?.task?.steps?.[lp.mind.task.k]?.what ?? '').toLowerCase();
    const here = e.map[l]!;
    const where = (m: number, x: number, y: number) => this.where(l, m, x, y);
    // Sightings: dangers always (even to a rival: nobody wants zombies on anyone), game and horses not to an enemy.
    for (const sg of w.aware.of(sid)) {
      const danger = DANGEROUS.has(sg.k);
      if (!danger && foes) continue;
      if (this.knowsSight(lid, sg)) continue;
      const age = (w.gameSec - sg.t) / 3600, fresh = Math.max(0, 1 - age / (danger ? 3 : 6));
      let v = (danger ? (sg.k === 'zombie' ? 7 : 6) : sg.k === 'horses' ? 2 + (lp && (lp.traits.courage > 0.5) ? 2 : 0) : 3 + (hunter ? 3 : 0)) * fresh * (sg.m === here ? 1 : 0.5);
      if (lage < 12 && !danger) v *= 0.3;
      if (v < 1) continue;
      const k = 'sight:' + sg.k + ':' + Math.round(sg.x / 20) + ':' + Math.round(sg.y / 20);
      if (told.has(k)) continue;
      const hop = sg.hop + 1, jit = hop > 1 ? (hop - 1) * 5 : 0;
      const what = sg.k === 'horses' ? 'wild horses' : sg.n > 1 ? `${sg.n} ${sg.k === 'deer' ? 'deer' : sg.k + 's'}` : `a ${sg.k}`;
      const when = age < 0.2 ? 'just now' : age < 1 ? 'not an hour ago' : `about ${Math.round(age)} hours ago`;
      const src = sg.hop === 0 ? 'I saw' : sg.hop === 1 ? `${this.nm(sg.from)} saw` : 'People say there are';
      items.push({ v, kind: danger ? 'danger' : sg.hop >= 1 ? 'rumour' : 'game', what: sg.k,
        say: sg.hop >= 2 ? `${src} ${what} ${where(sg.m, sg.x, sg.y)}.` : `${src} ${what} ${where(sg.m, sg.x, sg.y)}, ${when}.`,
        reply: danger ? (lp && lp.traits.courage > 0.7 ? 'Good to know. I will keep my spear close.' : 'I will keep away from there.') : hunter ? 'Thanks, I will go and look.' : 'Good to know.',
        apply: () => { w.aware.see(lid, sg.k, sg.m, sg.x + w.rng.range(-jit, jit), sg.y + w.rng.range(-jit, jit), hop, sid, sg.n, sg.t); } });
    }
    // Places they know on the listener's map (never to an enemy, except trouble spots).
    const mem = w.memory;
    for (const k of Object.keys(PLACE_V) as PlaceKind[]) {
      if (foes && k !== 'danger') continue;
      const mine = mem.places(sid, k).filter((p) => p.m === here);
      if (!mine.length) continue;
      const theirs = mem.places(lid, k).filter((p) => p.m === here);
      const p = mine.reduce((x, y) => (y.n > x.n ? y : x));
      if (theirs.some((q) => Math.hypot(q.x - p.x, q.y - p.y) < 30) || theirs.length >= 2) continue;
      let v = PLACE_V[k]! + (theirs.length ? -1 : 0);
      if (k === 'water' && e.thirst[l]! > 50) v += 3;
      if ((k === 'food' || k === 'hunt') && e.hunger[l]! > 50) v += 2;
      if (want && PLACE_TXT[k]!.includes(want)) v += 3;
      if (k === 'hunt' && hunter) v += 2;
      if (lage < 10 && k !== 'danger' && k !== 'water') v *= 0.4;
      items.push({ v, kind: k === 'danger' ? 'danger' : 'place', what: k, say: `${k === 'danger' ? 'Be careful' : 'There is'} ${k === 'danger' ? where(p.m, p.x, p.y) + ': ' + PLACE_TXT[k] : PLACE_TXT[k] + ' ' + where(p.m, p.x, p.y)}.`,
        reply: k === 'danger' ? 'I will remember that.' : 'I did not know that. Thank you.', apply: () => mem.place(lid, k, p.m, p.x, p.y) });
    }
    // News they carry (gossip). Not about the listener themselves.
    for (const nw of this.heard(sid)) {
      if (nw.about.includes(lid) || this.knowsNews(lid, nw.key)) continue;
      const days = (w.gameSec - nw.t) / DAY;
      const v = (nw.imp - nw.hop * 0.6) * (days > 2 ? 0.4 : 1) * (lage < 8 ? 0.4 : 1);
      if (v < 1.5) continue;
      const close = nw.about.some((id) => (lp?.mind?.rel ?? {})['#' + id] !== undefined || lp?.partner === id || lp?.parents.includes(id));
      const sad = /died|hurt|split|war|came to blows|chased/.test(nw.text), happy = /baby|married|together|came true|leads|peace|found/.test(nw.text);
      items.push({ v: v + (close ? 2 : 0), kind: nw.hop >= 1 ? 'rumour' : 'news', what: nw.key, say: `${nw.hop === 0 ? 'Did you hear?' : 'They say'} ${nw.text}.`,
        reply: sad ? (close ? 'No... I did not know.' : 'That is bad news.') : happy ? 'That is wonderful!' : 'Really? I had not heard.',
        apply: () => { if (this.seed(lid, nw.key, nw.text, nw.imp, nw.about, nw.hop + 1, sid, nw.t)) w.memory.add(lid, 'heard', Math.max(2, Math.min(7, nw.imp - 1 - nw.hop)), `heard from ${this.nm(sid)}: ${nw.text}`, sid); } });
    }
    // A tip: what I am good at and they keep failing at.
    if (!foes && lage >= 12) {
      const tip = w.colony.tipFor(s, l);
      if (tip) items.push({ v: 3 + Math.min(2, tip.fails), kind: 'skill', what: tip.key, say: `You have trouble with ${KEY_TXT[tip.key] ?? tip.key.replace(':', ' ')}? ${TIP[tip.key] ? 'Try this: ' + TIP[tip.key] : 'Watch how I do it next time.'}`,
        reply: 'I will try it your way.', apply: () => w.colony.teach(s, l, tip.key) });
    }
    // The old lessons for a child.
    if (lage >= 3 && lage < 13 && w.family.ageOf(s) >= 16 && w.lore.lessons.length && w.lore.taughtOf(l) < 1) {
      const ls = w.lore.lessons[w.rng.int(w.lore.lessons.length)]!;
      items.push({ v: 3.5, kind: 'lore', what: ls.kind, say: `Listen, little one: ${ls.text}`, reply: 'I will remember.', apply: () => w.lore.teach(l, 0.15) });
    }
    let best: Item | null = null;
    for (const it of items) if (!told.has(it.kind + ':' + it.what) && (!best || it.v > best.v)) best = it;
    return best && best.v >= 2 ? best : null;
  }
  private knowsSight(id: number, sg: Sight): boolean {
    return this.w.aware.of(id).some((x) => x.k === sg.k && x.m === sg.m && Math.hypot(x.x - sg.x, x.y - sg.y) < 25 && x.t >= sg.t - 600);
  }
  /** "40 m north of here" from the listener's place, or "in the east of Pine Woods" on another map. */
  private where(l: number, m: number, x: number, y: number): string {
    const w = this.w, e = w.e;
    if (m !== e.map[l]) return `in ${w.lore.area({ m, cx: Math.floor(x / 24), cy: Math.floor(y / 24) })}`;
    const dx = x - e.x[l]!, dy = y - e.y[l]!, d = Math.round(Math.hypot(dx, dy) / 5) * 5;
    if (d < 8) return 'right near here';
    const dir = Math.abs(dx) > 2 * Math.abs(dy) ? (dx > 0 ? 'east' : 'west') : Math.abs(dy) > 2 * Math.abs(dx) ? (dy > 0 ? 'south' : 'north') : `${dy > 0 ? 'south' : 'north'}-${dx > 0 ? 'east' : 'west'}`;
    return `about ${d} m ${dir} of here`;
  }

  /** A share of food for someone starving (the kind give, the selfish keep it). [line, reply] or null. */
  private gift(s: number, l: number): [string, string] | null {
    const w = this.w, e = w.e, ps = w.profileOf(s);
    if (!ps || e.hunger[l]! < 55 || e.carry[l]! > 0 || e.carry[s]! < 1) return null;
    if (e.carry[s]! < 2 && e.hunger[s]! > 30) return null;
    if (ps.traits.empathy < 0.35 || w.clans.enemies(e.id(s), e.id(l))) return null;
    e.carry[s]!--; e.carry[l]!++;
    this.stats.gifts++;
    w.emit('give', { id: e.id(s), to: e.id(l), item: 'food', n: 1 });
    w.emit('learned', { from: e.id(s), to: e.id(l), kind: 'help', what: 'food', text: `${this.nm(e.id(s))} gave ${this.nm(e.id(l))} food`, map: w.maps[e.map[s]!]!.def.id });
    return ['You look starving. Here, take some of my food.', 'Thank you. I will not forget it.'];
  }

  // ------------------------------------------------------------------ joint plans
  /** Two free adults by day agree to do something together: [line, reply] or null. */
  private pact(ia: number, ib: number, tomorrow = false): [string, string] | null {
    const w = this.w, e = w.e, h = w.brain.hour();
    const evening = h >= 17 && h < 23;
    if (!tomorrow && (h < 7 || h >= 16) && !evening) return null;
    for (const i of [ia, ib]) {
      const p = w.profileOf(i), t = p?.mind?.task as { goal?: string } | undefined;
      const free = !t || t.goal === 'pastime' || t.goal === 'play' || evening; // a visit or a walk may turn into a plan; in the evening it is for tomorrow
      if (!p || p.player || !free || (!evening && w.brain.orderOf(i).kind) || w.family.ageOf(i) < 16 || w.family.lyingInHome(i) || w.family.dependent(i)) return null;
      if (this.plans.has(e.id(i)) && !tomorrow) return null;
      if (!evening && (e.hunger[i]! > 60 || e.thirst[i]! > 60 || e.tired[i]! > 65 || e.hp[i]! < 50)) return null;
      if ((this.pactAt.get(e.id(i)) ?? -1e9) > w.gameSec) return null;
    }
    const a = e.id(ia), b = e.id(ib);
    if (w.clans.enemies(a, b) || (w.profiles.get(a)?.mind?.rel ?? {})['#' + b]! < 0) return null;
    const pa = w.profileOf(ia)!, pb = w.profileOf(ib)!, m = e.map[ia]!;
    const opts: { v: number; what: string; lead: number; text: string; steps: (me: number, other: number) => Step[]; say: string; reply: string }[] = [];
    // Hunt together: game known about, or a hunter's dream; both brave enough, nobody forbids it.
    const gs = w.aware.game(ia) ?? w.aware.game(ib);
    if ((gs || pa.dream?.kind === 'hunter' || pb.dream?.kind === 'hunter') && pa.traits.courage > 0.35 && pb.traits.courage > 0.35 && !w.rules.forbidden(ia, 'hunt') && !w.rules.forbidden(ib, 'hunt')) {
      const lead = pa.dream?.kind === 'hunter' || (gs && w.aware.game(ia)) ? ia : ib;
      opts.push({ v: (gs ? 3 : 1.5) + (w.survival.stash[m]?.food ?? 0) < 10 ? 1 : 0, what: 'hunt', lead, text: 'hunt together',
        steps: (me, other) => me === lead ? [{ do: 'hunt', times: 1 }] : [{ do: 'follow', who: e.id(other), minutes: 6 }, { do: 'hunt', times: 1 }],
        say: gs ? 'There is game about. Shall we go hunting together? Two of us can corner it.' : 'Come hunting with me. Two of us can corner something.', reply: 'Yes, let us go.' });
    }
    // Wood for the camp: the store is low.
    const st = w.survival.stash[m];
    if (st && (st.wood ?? 0) < 8 && !w.rules.forbidden(ia, 'wood') && !w.rules.forbidden(ib, 'wood')) {
      opts.push({ v: 2 + (8 - (st.wood ?? 0)) / 4, what: 'wood', lead: ia, text: 'fetch wood for the camp together',
        steps: () => [{ do: 'gather', what: 'wood', times: 3 }, { do: 'store', what: 'wood' }], say: 'The camp is short of wood. Let us fetch some together.', reply: 'Good idea, I will come.' });
    }
    if (!opts.length) return null;
    const o = opts.reduce((x, y) => (y.v > x.v ? y : x));
    // Not every talk ends in a plan: the more the two like each other and the more driven they are, the likelier.
    const like = ((pa.mind?.rel ?? {})['#' + b] ?? 0) + ((pb.mind?.rel ?? {})['#' + a] ?? 0);
    if (!w.rng.chance(Math.min(0.8, 0.25 + like * 0.06 + o.v * 0.05))) return null;
    const lead = o.lead, other = lead === ia ? ib : ia;
    if (evening) { // agreed by the fire: they will do it tomorrow morning (Talk.update starts it then)
      const say = o.say.replace(/Shall we go hunting together\?/, 'Shall we go hunting together tomorrow morning?').replace(/Let us fetch some together\./, 'Let us fetch some together tomorrow morning.').replace(/Come hunting with me\./, 'Come hunting with me tomorrow morning.');
      const plan = { other: e.id(other), lead: e.id(lead), what: o.what, text: o.text, day: Math.floor((w.gameSec + 8 * 3600) / DAY) + 1 };
      this.plans.set(e.id(lead), plan); this.plans.set(e.id(other), { ...plan, other: e.id(lead) });
      const text = `${this.nm(a)} and ${this.nm(b)} agreed to ${o.text} tomorrow morning`;
      w.memory.add(a, 'pact', 4, `agreed with ${this.nm(b)} to ${o.text} tomorrow morning`, b);
      w.memory.add(b, 'pact', 4, `agreed with ${this.nm(a)} to ${o.text} tomorrow morning`, a);
      w.emit('pact', { a, b, what: o.what, text, map: w.maps[m]!.def.id, tomorrow: true });
      w.emit('learned', { from: e.id(lead), to: e.id(other), kind: 'plan', what: o.what, text, map: w.maps[m]!.def.id });
      this.stats.pacts++;
      return [say, 'Yes. At first light, then.'];
    }
    const ok1 = w.tasks.start(lead, `${o.text} with ${this.nm(e.id(other))}`, 'myself', o.steps(lead, other));
    const ok2 = ok1 && w.tasks.start(other, `${o.text} with ${this.nm(e.id(lead))}`, 'myself', o.steps(other, lead));
    if (!ok1 || !ok2) { if (ok1) w.tasks.stop(lead); return null; }
    for (const i of [lead, other]) { const t = w.profileOf(i)?.mind?.task as { goal?: string } | undefined; if (t) t.goal = 'pact'; this.pactAt.set(e.id(i), w.gameSec + PACT_EVERY); }
    this.stats.pacts++;
    const text = `${this.nm(a)} and ${this.nm(b)} agreed to ${o.text}`;
    w.memory.add(a, 'pact', 4, `agreed with ${this.nm(b)} to ${o.text}`, b);
    w.memory.add(b, 'pact', 4, `agreed with ${this.nm(a)} to ${o.text}`, a);
    w.emit('pact', { a, b, what: o.what, text, map: w.maps[m]!.def.id });
    w.emit('learned', { from: e.id(lead), to: e.id(other), kind: 'plan', what: o.what, text, map: w.maps[m]!.def.id });
    return lead === ia ? [o.say, o.reply] : [o.say, o.reply];
  }

  /** Every 20 ticks: in the morning (7-10), plans agreed last evening start when both are up and free. */
  update(): void {
    if (!this.on_ || !this.plans.size) return;
    const w = this.w, e = w.e, h = w.brain.hour(), hr = Math.floor(w.gameSec / 3600);
    if (hr === this.lastHour) return;
    this.lastHour = hr;
    const today = Math.floor((w.gameSec + 8 * 3600) / DAY);
    for (const [id, p] of [...this.plans]) {
      if (p.day < today || (p.day === today && h >= 10)) { this.plans.delete(id); continue; } // missed
      if (p.day !== today || h < 7 || id !== p.lead) continue;
      const a = e.slot(id), b = e.slot(p.other);
      if (a < 0 || b < 0 || e.map[a] !== e.map[b]) { this.plans.delete(id); this.plans.delete(p.other); continue; }
      if (e.act[a] === Act.Sleep || e.act[b] === Act.Sleep || w.profileOf(a)?.mind?.task || w.profileOf(b)?.mind?.task) continue; // asleep (Act.Sleep) or busy: next hour
      const steps = (me: number, other: number): Step[] => p.what === 'hunt'
        ? (me === a ? [{ do: 'hunt', times: 1 }] : [{ do: 'follow', who: e.id(other), minutes: 6 }, { do: 'hunt', times: 1 }])
        : [{ do: 'gather', what: 'wood', times: 3 }, { do: 'store', what: 'wood' }];
      this.plans.delete(id); this.plans.delete(p.other);
      if (!w.tasks.start(a, `${p.text} with ${this.nm(p.other)} (as we agreed)`, 'myself', steps(a, b))) continue;
      if (!w.tasks.start(b, `${p.text} with ${this.nm(id)} (as we agreed)`, 'myself', steps(b, a))) { w.tasks.stop(a); continue; }
      for (const i of [a, b]) { const t = w.profileOf(i)?.mind?.task as { goal?: string } | undefined; if (t) t.goal = 'pact'; this.pactAt.set(e.id(i), w.gameSec + PACT_EVERY); }
      w.emit('pact', { a: id, b: p.other, what: p.what, text: `${this.nm(id)} and ${this.nm(p.other)} set off to ${p.text}, as agreed last night`, map: w.maps[e.map[a]!]!.def.id, kept: true });
    }
  }

  /** One line for the prompts: the latest news they carry. */
  promptText(i: number): string {
    if (!this.on_) return '';
    const w = this.w, list = this.heard(w.e.id(i)).filter((n) => w.gameSec - n.t < 3 * DAY).slice(-4);
    const pl = this.plans.get(w.e.id(i));
    const plan = pl ? ` You agreed with ${this.nm(pl.other)} to ${pl.text} tomorrow morning.` : '';
    if (!list.length) return plan.trim();
    return `News you know: ${list.map((n) => `${n.text}${n.hop ? ' (heard)' : ''}`).join('; ')}.${plan}`;
  }
}
