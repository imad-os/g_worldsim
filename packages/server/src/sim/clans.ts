/**
 * Clans and fights between people (imad 2026-11-21: "clans by themselves since they already have leaders", "PvP, small damage").
 *
 * - Clans form on their own: each map's leader founds one and the others join by how they feel about the leader (feelings
 *   `mind.rel`, family, partner). A strong member who does not like the leader can split off with friends once the clan
 *   has 6+ adults, claiming a home of its own. Loyalty goes up and down hourly with feelings; a disloyal member leaves.
 * - Rival clans living close get tense; tense neighbours, people who dislike each other and people on edge (hungry, worn out,
 *   grumpy, proud) can come to blows. Fights are duels: hits for small damage (see pvpDamage), the loser yields, nobody dies.
 * - Players never take part unless their PvP switch is on (App.pvpOn).
 */
import { Act, Kind } from '@worldsim/protocol';
import { CALL_MIN } from './influence.js';
import type { World } from './world.js';
import { NO_MAP } from './entities.js';
import { ageOf } from './people.js';

/** A clan with more members than this gets a camp of its own (imad 2026-11-26), away from the map's first camp. */
export const CLAN_CAMP_AT = 20;
/** Everyone belongs to a clan (imad 2026-11-26: "force them to choose a clan"): an adult with none after this long is taken in by the best one. */
const CHOOSE_WITHIN = 12 * 3600;
/** From this age people choose a clan themselves; younger ones are in their parents' clan. */
const CLAN_AGE = 16;

/** Damage of one hit between people (imad 2026-11-21): strong weapon on someone with no weapon at most 30, a weapon on an armed person 10,
 *  bare hands on someone in armour 3. `weapon` = the weapon's damage (0 = none), `armed` = the victim carries one, `def` = their armour (0..0.5). */
export function pvpDamage(weapon: number, armed: boolean, def: number): number {
  const base = weapon > 0 ? 30 * Math.min(1, weapon / 34) : 4;
  const d = (armed && weapon > 0 ? base / 3 : base) * (1 - def);
  return Math.max(1, Math.round(Math.min(30, d)));
}

/** A leader election: who stands, who voted for whom (voter id -> candidate id), when it closes (game seconds). */
export interface Vote { start: number; end: number; cands: number[]; ballots: [number, number][]; why: string }
export interface Clan {
  id: number; name: string; map: number; leader: number; members: number[]; hx: number; hy: number; at: number;
  founder?: number;
  /** The election under way, the time of the last one and its result. */
  vote?: Vote; lastVote?: number; result?: { at: number; winner: number; tally: [number, number][]; old: number };
  /** The leader's last word to the clan (an order of the day) and when. */
  order?: string; orderAt?: number;
  /** The clan's own camp (imad 2026-11-26: past CLAN_CAMP_AT members): centre in metres, map index, when it was founded. Members build their huts there. */
  camp?: { x: number; y: number; m: number; at: number };
}
interface Duel { a: number; b: number; start: number; hitAt: number; hurt: [number, number]; /** Tick it began: a duel lasts 40 real (sim) seconds, not 40 game seconds (at clockScale 30 that was 1.3 s: no duel ever got to blows). */ t0?: number }
/**
 * A war between two clans of one map (imad 2026-11-27: "how can I start a clan war? I ordered a leader, nothing happened"). Declared by
 * a leader: told in words (panel chat / TV / a player leader's Clan page), the owner's panel button, or by itself when tension stays
 * at the top. While it lasts members of the two clans come to blows on sight (duels: nobody dies), by day a leader sends a war party
 * to the other clan's home, and each duel won counts. It ends with a peace: the side 5 duels behind sues for it, either leader is told
 * to make peace, or both sides are worn out after WAR_DAYS. Zombies stop it for the night (people never quarrel with zombies about).
 */
export interface War { a: number; b: number; start: number; by: string; why: string; wins: [number, number]; raidAt: number }
/** War words in the 4 languages: 'war' (declare it), 'peace' (end it), '' = neither. */
export function warWords(text: string): '' | 'war' | 'peace' {
  const t = text.toLowerCase();
  if (/\b(peace|truce|ceasefire|cease fire|stop (the )?(war|fighting))\b|\bpaix\b|trêve|\bpaz\b|tregua|سلام|هدنة|صلح/.test(t)) return 'peace';
  if (/\b(war|wars|declare war|attack|raid|invade)\b|guerre|attaqu|guerra|atac|invad|حرب|هاجم|اغز|غزو/.test(t)) return 'war';
  return '';
}
const WAR_DAYS = 3, WAR_LEAD = 5;
/** Tension must stay at 10/10 this long (game seconds) before a leader declares war by themselves. */
const TOP_HOLD = 3 * 3600;

const NAMES = ['Ashfall', 'Redhand', 'Ironwood', 'Northgate', 'Stonefield', 'Emberline', 'Greywolves', 'Blackthorn', 'Riverside', 'Highwall', 'Dustwalkers', 'Oakheart', 'Sunrise', 'Nightwatch'];
const HOUR = 3600, DAY = 24 * HOUR;
/** An AI ballot for a candidate: 60 % influence (0..100), 40 % feelings (-5..5) + family + loyalty to a sitting leader (0..1). */
export function voteScore(influence: number, feel: number, kin: boolean, loyal: number): number {
  const heart = Math.max(0, Math.min(1, (feel + (kin ? 1.5 : 0) + (loyal - 0.5) * 2 + 5) / 11));
  return 0.6 * (influence / 100) + 0.4 * heart;
}
/** Elections: every 3 game days, sooner when the leader is not liked (approval under 35 %, a day at least), 2 game hours to vote. */
const VOTE_EVERY = 3 * DAY, VOTE_LOW = 35, VOTE_OPEN = 2 * HOUR;
/** A clan leader (AI) gives the clan an order of the day at most every 6 game hours. */
const ORDER_EVERY = 6 * HOUR;

/**
 * Clans (imad 2026-11-25: "deep clans: people can change clan, members vote for their leader by popularity and respect, the leader
 * truly instructs the members, an NPC to found clans, actions for AI people to join or quit"). Two kinds of leader (imad's choice
 * 2026-11-25): the camp leader picked by traits (Survival.pickLeader) hands out the camp's work; a clan's leader is ELECTED by its
 * members and gives orders only to them.
 *
 * - Founding happens at Odile the registrar (an NPC in town): an AI founder walks there (task skill `clan found`); a player founds
 *   next to her (TV: talk to her). On a map without a registrar the founder founds at the camp.
 * - Joining is an action: an AI person walks to the leader and asks (the leader agrees unless they dislike them); players pick a
 *   clan on the TV. Quitting too. People change clan when another one fits them clearly better (feelings for its leader and
 *   members, family there) and their loyalty is low. Players' characters never change clan by themselves.
 * - Respect = what the members feel for someone + leadership (courage, mind, kindness, strength, level). Approval = how the members
 *   feel about the leader and their loyalty. Elections: the leader and the 2 most respected members stand; each member votes for the
 *   one they like and respect most (family counts); players vote on the TV; most votes wins, a tie keeps the leader.
 * - Orders: an AI leader gives an order of the day (rally at night when zombies come, fill the store with food or wood, hunt) and the
 *   members do it as a task "from <leader>", the more loyal the more surely. A player leader gives orders in their own words
 *   (TV: Clan > Give my clan an order): each member hears it as words from their leader (Planner.chat) and loyal ones obey.
 */
export class Clans {
  clans: Clan[] = [];
  /** Entity id -> clan id. */
  private of = new Map<number, number>();
  /** Loyalty of each member to their clan 0..1. */
  private loyal = new Map<number, number>();
  /** Tension between two clans (key `lo:hi`), 0..10. */
  private tense = new Map<string, number>();
  /** What made each pair tense (key `lo:hi` -> cause -> amount, fading ~4 % an hour) and since when it has been at 10/10. */
  private causes = new Map<string, Record<string, number>>();
  private topSince = new Map<string, number>();
  private duels = new Map<number, Duel>(); // by either id
  /** Wars going on (clan ids a < b) and when each pair last made peace (key `lo:hi` -> game seconds). */
  wars: War[] = [];
  private peaceAt = new Map<string, number>();
  /** Leaders start a war by themselves when tension stays at 9.5+ (rare: a few per cent an hour, by the leader's courage). */
  autoWar = true;
  /** A rebel on the way to the registrar: the clan they leave and the friends who come with them. */
  private pending = new Map<number, { from: number; friends: number[] }>();
  private nextId = 1;
  private nextHour = 0;
  private scan = 0;
  private lastAt = new Map<number, number>();
  /** Since when (game seconds) an adult has been in no clan. */
  private unaligned = new Map<number, number>();
  /** The App says whether a player's character has PvP on. */
  pvpOn: (i: number) => boolean = () => false;
  onChange: () => void = () => {};
  /** An election opened / closed: the App tells the players in that clan. */
  onVote: (c: Clan, open: boolean) => void = () => {};

  constructor(private w: World) {}

  // ------------------------------------------------------------------ queries
  clanOf(id: number): Clan | undefined { const c = this.of.get(id); return c === undefined ? undefined : this.clans.find((x) => x.id === c); }
  byId(id: number): Clan | undefined { return this.clans.find((c) => c.id === id); }
  byName(q: string): Clan | undefined { const n = q.trim().toLowerCase(); return n ? this.clans.find((c) => c.name.toLowerCase() === n) ?? this.clans.find((c) => n.includes(c.name.toLowerCase())) : undefined; }
  tension(a: number, b: number): number { return this.tense.get(a < b ? `${a}:${b}` : `${b}:${a}`) ?? 0; }
  /** Tension changes only from real causes (imad 2026-11-27: "recheck how it is calculated, it shouldn't be random"); each cause is kept
   *  (fading over about a day) so the panel can say why two clans are tense. */
  private addTension(a: number, b: number, d: number, cause = ''): void {
    const k = a < b ? `${a}:${b}` : `${b}:${a}`;
    const old = this.tense.get(k) ?? 0, now = Math.max(0, Math.min(10, old + d));
    this.tense.set(k, now);
    if (cause && now !== old) { const c = this.causes.get(k) ?? {}; c[cause] = (c[cause] ?? 0) + (now - old); this.causes.set(k, c); }
  }
  /** Why clans a and b are tense: the causes of the last day or so, biggest first ([cause, amount], amount < 0 = calmed it). */
  why(a: number, b: number): [string, number][] {
    const c = this.causes.get(a < b ? `${a}:${b}` : `${b}:${a}`) ?? {};
    return Object.entries(c).filter(([, v]) => Math.abs(v) >= 0.05).sort((x, y) => Math.abs(y[1]) - Math.abs(x[1])).map(([k, v]) => [k, Math.round(v * 10) / 10]);
  }
  /**
   * Hourly tension between two clans of one map, from what is really going on (no dice):
   * - living close (homes < 40 m) +0.08, and when that camp is short of food or water +0.15 more (fighting over the same berries and water);
   * - bad blood: how the members feel about each other on average (-5..5): below -0.5 raises it by 0.06 per point, above 0.5 calms it;
   * - families across the two clans (partners, parents, children) calm it, 0.05 each (at most 0.3);
   * - time heals: -0.1 an hour.
   * Events add on top: a fight between members +1, a member beaten +0.5, a player hitting someone +1, a killing +4, a split +3. A war holds it at 10.
   */
  private tensionHour(A: Clan, B: Clan): void {
    const w = this.w, k = A.id < B.id ? `${A.id}:${B.id}` : `${B.id}:${A.id}`;
    const c = this.causes.get(k);
    if (c) { for (const x of Object.keys(c)) { c[x]! *= 0.96; if (Math.abs(c[x]!) < 0.02) delete c[x]; } }
    if (this.warOf(A.id, B.id)) return;
    this.addTension(A.id, B.id, -0.1, 'time heals'); // calming first, then what raises it: a steady cause can hold it at 10
    let sum = 0, n = 0, mixed = 0;
    const as = A.members.slice(0, 40), bs = B.members.slice(0, 40);
    for (const x of as) for (const y of bs) {
      sum += this.rel(x, y) + this.rel(y, x); n += 2;
      if (mixed < 6) { const p = w.profiles.get(x); if (p && (p.partner === y || p.parents?.includes(y) || w.profiles.get(y)?.parents?.includes(x))) mixed++; }
    }
    const feel = n ? sum / n : 0;
    if (feel > 0.5) this.addTension(A.id, B.id, -feel * 0.04, 'friendship');
    if (mixed) this.addTension(A.id, B.id, -0.05 * mixed, 'families across the clans');
    if (feel < -0.5) this.addTension(A.id, B.id, -feel * 0.06, 'bad blood');
    const d = Math.hypot(A.hx - B.hx, A.hy - B.hy);
    if (d < 40) {
      this.addTension(A.id, B.id, 0.08, 'living too close');
      const plan = w.plan.of(A.map), lack = (key: string) => { const l = plan.lines.find((x) => x.key === key); return l ? w.plan.lack(l) : 0; };
      if (Math.max(lack('food'), lack('water')) > 0.5) this.addTension(A.id, B.id, 0.15, 'not enough food and water');
    }
    if (this.tension(A.id, B.id) >= 10) { if (!this.topSince.has(k)) this.topSince.set(k, w.gameSec); } else this.topSince.delete(k);
  }
  /** Event hook: a killing between clans. */
  private watched = false;
  private watch(): void {
    if (this.watched) return;
    this.watched = true;
    this.w.listeners.push((ev) => {
      if (ev.kind !== 'death') return;
      const by = Number(ev.data.by), id = Number(ev.data.id);
      if (!Number.isFinite(by) || !Number.isFinite(id)) return;
      const ca = this.of.get(by), cb = this.of.get(id);
      if (ca !== undefined && cb !== undefined && ca !== cb) this.addTension(ca, cb, 4, 'a killing');
    });
  }
  loyalty(id: number): number { return this.loyal.get(id) ?? 0; }
  /** The war between clans a and b, if any. */
  warOf(a: number, b: number): War | undefined { return this.wars.find((x) => (x.a === a && x.b === b) || (x.a === b && x.b === a)); }
  /** The clans c is at war with. */
  foes(c: Clan): Clan[] { return this.wars.filter((x) => x.a === c.id || x.b === c.id).map((x) => this.byId(x.a === c.id ? x.b : x.a)).filter((x): x is Clan => !!x); }
  /** People ids a and b are in clans at war with each other. */
  enemies(a: number, b: number): boolean { const ca = this.of.get(a), cb = this.of.get(b); return ca !== undefined && cb !== undefined && ca !== cb && !!this.warOf(ca, cb); }
  /** Tension each clan has with each other clan (for the panel and prompts). */
  rivals(c: Clan): { clan: Clan; tension: number; why: [string, number][] }[] {
    return this.clans.filter((x) => x.id !== c.id).map((x) => ({ clan: x, tension: this.tension(c.id, x.id), why: this.why(c.id, x.id) })).filter((r) => r.tension >= 1);
  }
  duelling(i: number): boolean { return this.duels.has(this.w.e.id(i)); }
  /** How much the members respect `id`: their feelings for them (-5..5 on average) + leadership. */
  respect(id: number, c: Clan): number {
    const others = c.members.filter((x) => x !== id);
    const feel = others.length ? others.reduce((a, x) => a + this.rel(x, id), 0) / others.length : 0;
    return feel + this.inf(id) / 20; // influence 0..100 -> 0..5, like the feelings (imad 2026-11-26)
  }
  /** Influence 0..100 (sim/influence.ts): what they did for the people. */
  inf(id: number): number { return this.w.influence.of(id); }
  /** The most influential first (respect breaks ties). */
  private byInfluence(ids: number[], c: Clan): number[] { return ids.slice().sort((a, b) => this.inf(b) - this.inf(a) || this.respect(b, c) - this.respect(a, c)); }
  /** How the members feel about the leader, 0..100. */
  approval(c: Clan): number {
    const m = c.members.filter((x) => x !== c.leader);
    if (!m.length) return 100;
    const v = m.reduce((a, x) => a + 0.5 * Math.max(0, Math.min(1, (this.rel(x, c.leader) + (this.kin(x, c.leader) ? 2 : 0) + 3) / 6)) + 0.5 * (this.loyal.get(x) ?? 0.5), 0) / m.length;
    return Math.round(v * 100);
  }
  /** How well clan c fits person id: feelings for its leader and members, family in it. */
  fit(id: number, c: Clan): number {
    const mem = c.members.filter((x) => x !== c.leader && x !== id);
    return this.rel(id, c.leader) + (mem.length ? mem.reduce((a, x) => a + this.rel(id, x), 0) / mem.length : 0) * 0.5
      + (c.members.some((x) => x !== id && this.kin(id, x)) ? 2 : 0) + (this.w.profiles.get(id)?.personality.includes('loyal') ? 0.5 : 0) + Math.min(1, c.members.length * 0.1);
  }

  // ------------------------------------------------------------------ feelings
  private rel(a: number, b: number): number { return this.w.profiles.get(a)?.mind?.rel['#' + b] ?? 0; }
  private feel(a: number, b: number, d: number): void {
    const p = this.w.profiles.get(a); if (!p) return;
    p.mind ??= { notes: [], summary: '', mood: 'calm', rel: {}, lastPlan: this.w.gameSec - 1e9 };
    p.mind.rel['#' + b] = Math.max(-5, Math.min(5, (p.mind.rel['#' + b] ?? 0) + d));
  }
  private kin(a: number, b: number): boolean {
    return this.w.family.related(a, b); // blood, marriage and family roles chosen by players (sim/family.ts)
  }
  private lead(id: number): number {
    const p = this.w.profiles.get(id); if (!p) return -9;
    const t = p.traits;
    return t.courage * 1.2 + t.intelligence + t.empathy * 0.8 + t.strength * 0.4 + Math.sqrt((p.xp ?? 0) / 50) * 0.15;
  }
  /** An AI person who can quarrel (fights). */
  private adult(i: number): boolean { const e = this.w.e; return e.kind[i] === Kind.Agent && e.map[i] !== NO_MAP && !(e.flags[i]! & 32); }
  /** Who can be in a clan: AI adults and players' characters (by hand or on autopilot). */
  private member(i: number): boolean { const e = this.w.e; return (e.kind[i] === Kind.Agent || (e.kind[i] === Kind.Player && !!this.w.charName(i))) && !(e.flags[i]! & 32); }
  /** The engine may move this person between clans by itself (never a player's character). */
  private auto(i: number): boolean { return this.w.e.kind[i] === Kind.Agent && !this.w.charName(i); }
  /** A task of their own (not an order from the owner, a player or a strict rule): a clan order may replace it. */
  private ownWork(t: { from: string; rule?: string } | undefined): boolean {
    if (!t) return true;
    if (t.rule || t.from === 'owner' || t.from === 'the voice from the sky') return false;
    for (const p of this.w.profiles.values()) if (p.player && p.player === t.from) return false;
    return true;
  }
  private free(i: number): boolean { const p = this.w.profileOf(i), e = this.w.e; return !!p && this.ownWork(p.mind?.task) && (!!p.mind?.task || !this.w.survival.busy(e.id(i))) && e.hunger[i]! < 70 && e.thirst[i]! < 70 && e.hp[i]! > 40 && e.act[i] !== Act.Sleep; }
  private name(id: number): string { return this.w.profiles.get(id)?.name ?? 'someone'; }

  // ------------------------------------------------------------------ hourly: who belongs where, elections, orders
  private hourly(): void {
    const w = this.w, e = w.e;
    // Forget the dead and the gone; a clan with no leader picks the most respected member; a clan of nobody is no clan.
    for (const c of this.clans) {
      c.members = c.members.filter((id) => { const i = e.slot(id); return i >= 0 && this.member(i); });
      if (!c.members.includes(c.leader) && c.members.length) { const old = c.leader; c.leader = this.byInfluence(c.members, c)[0]!; c.vote = undefined; w.emit('clanLeader', { clan: c.name, id: c.leader, old, why: 'the leader is gone' }); }
    }
    for (const c of this.clans.filter((x) => x.members.length < 1 || (x.members.length < 2 && w.gameSec - x.at > DAY))) { for (const id of c.members) this.of.delete(id); w.emit('clanEnd', { clan: c.name }); }
    this.clans = this.clans.filter((x) => x.members.length >= 2 || (x.members.length >= 1 && w.gameSec - x.at <= DAY));
    for (const [id, cid] of this.of) if (!this.clans.some((c) => c.id === cid && c.members.includes(id))) this.of.delete(id);
    for (const [id] of this.pending) if (e.slot(id) < 0) this.pending.delete(id);

    for (let m = 0; m < w.maps.length; m++) {
      const adults: number[] = [];
      for (let i = 0; i < e.hi; i++) if (e.map[i] === m && this.member(i) && e.kind[i] === Kind.Agent) adults.push(e.id(i));
      if (adults.length < 3) continue;
      const here = this.clans.filter((c) => c.map === m);
      // Founding: the camp's leader goes to the registrar to found the first clan (the others join by liking).
      if (!here.length) {
        const lid = w.survival.leader[m] ?? -1, L = lid >= 0 ? e.slot(lid) : -1;
        if (L >= 0 && this.auto(L) && !this.foundTask(L)) {
          if (w.quests.npcSlot('registrar') >= 0 && e.map[w.quests.npcSlot('registrar')] === m) { if (this.free(L)) w.tasks.start(L, 'found a clan at the registrar', 'myself', [{ do: 'clan', what: 'found' }]); }
          else this.found(m, lid);
        }
      }
      // Nobody founds the first clan (no camp leader): the most influential adult does, so everyone has a clan to choose.
      if (!here.length && !this.foundTask(-1)) {
        const lid = w.survival.leader[m] ?? -1;
        if (lid < 0 || e.slot(lid) < 0 || !this.auto(e.slot(lid))) { const f = this.byInfluence(adults.filter((id) => this.auto(e.slot(id)) && this.grown(id)), { members: adults } as Clan)[0]; if (f !== undefined) this.found(m, f); }
      }
      for (const id of adults) {
        const i = e.slot(id);
        if (!this.auto(i)) continue;
        const mine = this.clanOf(id);
        if (!mine && !this.grown(id)) { this.kidClan(id); continue; } // children are in their parents' clan
        if (!mine) { this.choose1(i, m); continue; }
        this.unaligned.delete(id);
        if (id !== mine.leader) this.reconsider(i, mine, m);
      }
      for (const c of this.clans.filter((x) => x.map === m)) {
        // Loyalty follows feelings; a very unhappy member quits.
        for (const id of c.members.slice()) {
          if (id === c.leader) continue;
          const f = this.rel(id, c.leader) + (this.kin(id, c.leader) ? 1.5 : 0) + (w.profiles.get(id)?.personality.includes('loyal') ? 1 : 0) + (this.approval(c) - 50) / 50;
          const l = Math.max(0, Math.min(1, (this.loyal.get(id) ?? 0.5) + f * 0.03 - 0.005));
          this.loyal.set(id, l);
          const i = e.slot(id);
          if (l < 0.12 && f < -0.5 && this.auto(i)) { if (this.free(i)) w.tasks.start(i, `quit the ${c.name} clan`, 'myself', [{ do: 'clan', what: 'quit' }]); else this.leave(c, id, 'lost faith in the leader'); }
        }
        if (c.members.length >= 6 && this.clans.filter((x) => x.map === m).length < 3) this.maybeSplit(c);
        this.campCheck(c);
        this.elections(c);
        this.leaderOrder(c);
      }
      // Tension between clans of this map, from real causes (tensionHour); a war keeps it up (warHourly).
      const cl = this.clans.filter((x) => x.map === m);
      for (let a = 0; a < cl.length; a++) for (let b = a + 1; b < cl.length; b++) {
        this.tensionHour(cl[a]!, cl[b]!);
      }
    }
    this.warHourly();
    this.onChange();
  }
  /**
   * Changing clan (imad 2026-11-27: "people need to be able to change clans if they want"): an AI member weighs the other clans of the map
   * every hour and walks to the leader of a better one to ask (the join step; the leader may say no). Reasons, strongest first: their partner
   * is in another clan (couples end up together, the less loyal one moves), a clan that fits clearly better (feelings for its leader and
   * members, family there) while loyalty is low or middling, and a war against family or friends.
   */
  private reconsider(i: number, mine: Clan, m: number): void {
    const w = this.w, id = this.w.e.id(i), loyal = this.loyal.get(id) ?? 0.5;
    if (!this.free(i) || this.switching(i)) return;
    const go = (c: Clan, why: string) => { if (this.accepts(c, id) && w.tasks.start(i, `move to the ${c.name} clan`, 'myself', [{ do: 'clan', what: 'join', who: c.leader }])) w.emit('clanMove', { id, from: mine.name, clan: c.name, why }); };
    const p = w.profiles.get(id), pc = p && p.partner >= 0 ? this.clanOf(p.partner) : undefined;
    if (pc && pc.id !== mine.id && pc.map === m && pc.members.length && (mine.members.length > 1)) {
      const theirs = this.loyal.get(p!.partner) ?? 0.5, leads = pc.leader === p!.partner;
      if ((leads || loyal <= theirs) && w.rng.chance(0.2)) { go(pc, 'to be with my partner'); return; }
    }
    const here = this.fit(id, mine);
    let best: Clan | undefined, bs = -Infinity;
    for (const c of this.clans) if (c.map === m && c.id !== mine.id && c.members.length) { const f = this.fit(id, c); if (f > bs) { bs = f; best = c; } }
    if (!best) return;
    // A war against the clan where my family and friends are: the war weighs on loyalty, and they may cross over.
    if (this.warOf(mine.id, best.id) && best.members.some((x) => this.kin(id, x))) this.loyal.set(id, Math.max(0, loyal - 0.04));
    const gap = bs - here;
    if ((loyal < 0.4 && gap > 1.2 && w.rng.chance(0.25)) || (loyal < 0.7 && gap > 3 && w.rng.chance(0.12))) go(best, gap > 3 ? 'a clan that suits me much better' : 'I lost faith in my clan');
  }
  /** On the way to join another clan already. */
  private switching(i: number): boolean { const t = this.w.profileOf(i)?.mind?.task as { steps?: { do: string; what?: string }[] } | undefined; return !!t?.steps?.some((s) => s.do === 'clan' && s.what === 'join'); }
  private grown(id: number): boolean { const p = this.w.profiles.get(id); return !!p && (!!p.player || ageOf(p, this.w.gameSec, this.w.yearSec) >= CLAN_AGE); }
  /** A child goes into a parent's clan (the mother's first), without a word. */
  private kidClan(id: number): void {
    const p = this.w.profiles.get(id);
    for (const par of p?.parents ?? []) { const c = this.clanOf(par); if (c) { this.join(c, id, 0.7); return; } }
  }
  /**
   * An adult in no clan must choose one (imad 2026-11-26): they walk to the leader of the clan that fits them best and ask (any clan here,
   * however little they like it); someone who could not get there within CHOOSE_WITHIN is taken in by the best clan that accepts them; if
   * no clan here takes them, they found a clan of their own.
   */
  private choose1(i: number, m: number): void {
    const w = this.w, e = w.e, id = e.id(i);
    if (!this.unaligned.has(id)) this.unaligned.set(id, w.gameSec);
    const ok = this.clans.filter((c) => c.map === m && c.members.length && this.accepts(c, id)).sort((a, b) => this.fit(id, b) - this.fit(id, a));
    const t = w.profileOf(i)?.mind?.task as { steps?: { do: string }[] } | undefined, onIt = !!t?.steps?.some((s) => s.do === 'clan');
    if (!ok.length) {
      if (!onIt && this.free(i) && this.clans.filter((c) => c.map === m).length < 6) w.tasks.start(i, 'found a clan of my own', 'myself', [{ do: 'clan', what: 'found' }]);
      return;
    }
    const best = ok[0]!;
    if (w.gameSec - this.unaligned.get(id)! >= CHOOSE_WITHIN) {
      if (onIt) w.tasks.stop(i);
      this.join(best, id, 0.45 + Math.max(0, this.rel(id, best.leader)) * 0.08);
      w.emit('clanChosen', { id, clan: best.name, why: 'everyone must belong to a clan' });
      return;
    }
    if (!onIt && this.free(i)) w.tasks.start(i, `join the ${best.name} clan`, 'myself', [{ do: 'clan', what: 'join', who: best.leader }]);
  }

  // ------------------------------------------------------------------ the clan's own camp
  /**
   * Past CLAN_CAMP_AT members a clan needs a camp of its own (imad 2026-11-26), unless it is the clan of the map's first camp (the clan of
   * the camp leader, else the biggest): a site 45-90 m from every other camp with water, wood and room is picked (Survival.campSite), the
   * clan's home moves there, the leader is sent to light its fire, and from then on its members build their huts round it
   * (Survival.campFor) and every prompt about them says where it is.
   */
  private campCheck(c: Clan): void {
    const w = this.w, e = w.e, sv = w.survival, m = c.map;
    if (c.camp || c.members.length <= CLAN_CAMP_AT) return;
    const main = sv.campOf(m);
    if (!main) return; // the map's first camp is founded by the usual work; it then belongs to the main clan
    if (this.mainClan(m)?.id === c.id) return;
    const others = [main, ...this.clans.filter((x) => x.camp && x.camp.m === m).map((x) => x.camp!)];
    const tm = w.maps[m]!.tiles;
    let site: { x: number; y: number } | null = null;
    for (let k = 0; k < 12 && !site; k++) {
      const a = (k / 12) * Math.PI * 2 + (c.id % 12) * 0.5, d = 55 + (k % 3) * 12;
      const x = main.x + Math.cos(a) * d, y = main.y + Math.sin(a) * d;
      if (x < 12 || y < 12 || x > tm.w - 12 || y > tm.h - 12) continue;
      const s = sv.campSite(m, x, y);
      if (s && others.every((o) => Math.hypot(o.x - s.x, o.y - s.y) >= 45)) site = s;
    }
    if (!site) return;
    c.camp = { x: site.x, y: site.y, m, at: w.gameSec };
    c.hx = site.x; c.hy = site.y;
    w.emit('clanCamp', { clan: c.name, map: w.maps[m]!.def.id, x: Math.round(site.x), y: Math.round(site.y), n: c.members.length });
    for (const id of c.members) {
      const p = w.profiles.get(id);
      if (!p || p.player) continue;
      p.mind ??= { notes: [], summary: '', mood: 'calm', rel: {}, lastPlan: w.gameSec - 1e9 };
      p.mind.notes.push({ at: w.gameSec, text: `The ${c.name} clan grew past ${CLAN_CAMP_AT} and has its own camp now, at (${Math.round(site.x)}, ${Math.round(site.y)}). Our new huts go there.` });
      if (p.mind.notes.length > 12) p.mind.notes.splice(0, p.mind.notes.length - 12);
    }
    const L = e.slot(c.leader);
    if (L >= 0 && e.kind[L] === Kind.Agent) {
      w.speak(L, `${c.name}! We are too many for one camp. Our own camp will be at (${Math.round(site.x)}, ${Math.round(site.y)}): build your huts there.`);
      if (this.free(L)) w.tasks.start(L, 'light the fire of our clan\'s camp', 'myself', [{ do: 'build', what: 'campfire' }]);
    }
  }
  /** The clan the map's first camp belongs to: the camp leader's, else the biggest one there. */
  mainClan(m: number): Clan | undefined {
    const lid = this.w.survival.leader[m] ?? -1, lc = lid >= 0 ? this.clanOf(lid) : undefined;
    if (lc && lc.map === m && !lc.camp) return lc;
    return this.clans.filter((c) => c.map === m && !c.camp).sort((a, b) => b.members.length - a.members.length)[0];
  }
  /** The camp of person id's clan, when it has one of its own on map m (else null: the map's camp is theirs). */
  campOf(id: number, m: number): { x: number; y: number } | null {
    const c = this.clanOf(id);
    return c?.camp && c.camp.m === m ? { x: c.camp.x, y: c.camp.y } : null;
  }
  private foundTask(i: number): boolean { if (i < 0) return false; const t = this.w.profileOf(i)?.mind?.task as { steps?: { do: string; what?: string }[] } | undefined; return !!t?.steps?.some((s) => s.do === 'clan' && s.what === 'found'); }

  // ------------------------------------------------------------------ elections
  private elections(c: Clan): void {
    const w = this.w, e = w.e;
    if (c.vote) { if (w.gameSec >= c.vote.end) this.closeVote(c); return; }
    if (c.members.length < 3) return;
    const since = w.gameSec - (c.lastVote ?? c.at), ap = this.approval(c);
    if (since >= VOTE_EVERY) { this.callVote(c, 'the time has come'); return; }
    if (ap < VOTE_LOW && since >= DAY) { this.callVote(c, `the members are unhappy (approval ${ap} %)`); return; }
    // An ambitious member who does not like the leader may call one.
    if (since < 12 * HOUR) return;
    for (const id of c.members) {
      if (id === c.leader || !this.auto(e.slot(id))) continue;
      if (this.inf(id) >= CALL_MIN && this.inf(id) > this.inf(c.leader) + 10 && this.rel(id, c.leader) < 1 && w.rng.chance(0.05)) { this.callVote(c, `${this.name(id)} challenges the leader`, id); return; }
    }
  }
  /** Open an election: the leader and the 2 most influential members stand (and whoever called it). */
  callVote(c: Clan, why: string, by = -1): boolean {
    const w = this.w, e = w.e;
    if (c.vote || c.members.length < 2) return false;
    const ranked = c.members.filter((x) => x !== c.leader && e.slot(x) >= 0 && this.member(e.slot(x)));
    const cands = [c.leader, ...this.byInfluence(ranked, c).slice(0, 2)];
    if (by >= 0 && !cands.includes(by) && c.members.includes(by)) cands.push(by);
    c.vote = { start: w.gameSec, end: w.gameSec + VOTE_OPEN, cands, ballots: [], why };
    w.emit('clanVoteStart', { clan: c.name, why, cands, by });
    const L = e.slot(c.leader);
    if (L >= 0 && e.kind[L] === Kind.Agent) w.speak(L, `${c.name}! We choose our leader again: ${why}. Vote within two hours.`);
    this.onVote(c, true);
    return true;
  }
  /** A ballot (players on the TV; AI people when the vote closes). */
  ballot(c: Clan, voter: number, cand: number): boolean {
    if (!c.vote || !c.members.includes(voter) || !c.vote.cands.includes(cand)) return false;
    c.vote.ballots = c.vote.ballots.filter(([v]) => v !== voter);
    c.vote.ballots.push([voter, cand]);
    return true;
  }
  /** Who an AI person votes for (hybrid, imad 2026-11-26): 60 % the candidate's influence, 40 % feelings, family and loyalty
   *  (themselves a little more, if proud). */
  private choose(voter: number, c: Clan): number {
    const p = this.w.profiles.get(voter), proud = !!p?.personality.some((x) => x === 'proud' || x === 'stubborn');
    let best = c.vote!.cands[0]!, bs = -Infinity;
    for (const k of c.vote!.cands) {
      const v = voteScore(this.inf(k), k === voter ? (proud ? 3 : 1) : this.rel(voter, k), k !== voter && this.kin(voter, k), k === c.leader ? (this.loyal.get(voter) ?? 0.5) : 0.5)
        + this.w.rng.next() * 0.05;
      if (v > bs) { bs = v; best = k; }
    }
    return best;
  }
  closeVote(c: Clan): void {
    const w = this.w, e = w.e, v = c.vote;
    if (!v) return;
    const cast = new Set(v.ballots.map(([x]) => x));
    for (const id of c.members) { const i = e.slot(id); if (!cast.has(id) && i >= 0 && e.kind[i] === Kind.Agent) v.ballots.push([id, this.choose(id, c)]); } // players by hand who did not vote: no vote
    const tally = new Map<number, number>(v.cands.map((k) => [k, 0]));
    for (const [, k] of v.ballots) tally.set(k, (tally.get(k) ?? 0) + 1);
    const top = Math.max(...tally.values());
    const tied = [...tally].filter(([, n]) => n === top).map(([k]) => k).filter((k) => c.members.includes(k));
    const old = c.leader;
    const winner = tied.includes(old) ? old : this.byInfluence(tied, c)[0] ?? old;
    c.leader = winner; c.lastVote = w.gameSec; c.vote = undefined;
    c.result = { at: w.gameSec, winner, old, tally: [...tally] };
    for (const [x, k] of v.ballots) { if (k === winner && x !== winner) { this.feel(x, winner, 0.3); this.loyal.set(x, Math.min(1, (this.loyal.get(x) ?? 0.5) + 0.1)); } else if (x !== k) this.feel(x, winner, -0.2); }
    this.loyal.set(winner, 1);
    w.emit('clanVote', { clan: c.name, winner, old, tally: [...tally], votes: v.ballots.length });
    if (winner !== old) {
      w.emit('clanLeader', { clan: c.name, id: winner, old, why: 'elected' });
      this.feel(old, winner, -0.5);
    }
    const W = e.slot(winner);
    if (W >= 0 && e.kind[W] === Kind.Agent) w.speak(W, winner === old ? `Thank you for your trust. ${c.name} stands together.` : `I will lead ${c.name} well. Thank you.`);
    this.onVote(c, false);
  }

  // ------------------------------------------------------------------ the leader's orders
  /** An AI leader gives the clan an order of the day; members who are free do it, the more loyal the more surely. */
  private leaderOrder(c: Clan): void {
    const w = this.w, e = w.e, L = e.slot(c.leader);
    if (L < 0 || e.kind[L] !== Kind.Agent || e.act[L] === Act.Sleep || c.members.length < 3) return;
    if (w.gameSec - (c.orderAt ?? -1e9) < ORDER_EVERY) return;
    const hour = w.brain.hour();
    const danger = (hour >= 18 || hour < 5) && (w.zombies.perNight > 0 || w.zombies.count(c.map) > 0);
    const st = w.survival.stash[c.map]; // only once the camp has a store (an order never picks the store's spot)
    type S = Parameters<typeof w.tasks.start>[3];
    let text: string, steps: (i: number) => S;
    if (danger) { text = 'Night is coming: arm yourselves and gather by me.'; steps = (i) => [...(w.survival.weapon(i)[1] > 0 ? [] : [{ do: 'craft', what: 'spear' }]), { do: 'goto', who: c.leader }, { do: 'stay', minutes: 90 }]; }
    else if (hour >= 5 && hour < 18) { // by day: the hole in the clan's plan that is the biggest (sim/campplan.ts, imad 2026-11-26)
      const plan = w.plan.of(c.map), line = (k: string) => plan.lines.find((l) => l.key === k)!;
      const big = (k: string) => w.plan.lack(line(k)) > 0.5;
      const fridges = line('fridges').have;
      if (big('water') && (st || fridges)) { text = 'We have no water put by. Fill bottles at the water and store them.'; steps = () => [{ do: 'gather', what: 'water', times: 3 }, { do: 'store', what: 'water' }]; }
      else if (big('food') && (st || fridges)) { text = 'We need food in the stores. Collect some and put it away.'; steps = () => [{ do: 'collect', what: 'food', times: 3 }, { do: 'store', what: 'food' }]; }
      else if (st && big('wood')) { text = 'Bring wood for the store: fires and walls need it.'; steps = () => [{ do: 'gather', what: 'wood', times: 3 }, { do: 'store', what: 'wood' }]; }
      else if (st && big('stone')) { text = 'Bring stone for the store: repairs and huts need it.'; steps = () => [{ do: 'gather', what: 'stone', times: 3 }, { do: 'store', what: 'stone' }]; }
      else return;
    } else return;
    c.order = text; c.orderAt = w.gameSec;
    w.speak(L, `${c.name}! ${text}`);
    // A day's chore goes to a crew, not the whole clan: with 300 people a clan of 100 all walked to the one store crate and the water's
    // edge at once and jammed there, pushing each other every tick (half the server's work, imad 2026-11-27). The night rally is for all.
    let n = 0;
    const crew = danger ? Infinity : Math.min(12, 4 + Math.floor(c.members.length / 15));
    for (const id of c.members) {
      if (n >= crew) break;
      const i = e.slot(id);
      if (id === c.leader || i < 0 || e.kind[i] !== Kind.Agent || e.map[i] !== c.map || !this.free(i)) continue;
      if (!w.rng.chance(0.15 + (this.loyal.get(id) ?? 0.5) * 0.6)) continue;
      if (w.profileOf(i)?.mind?.task) w.tasks.stop(i); // their own work waits for the clan's order
      if (w.tasks.start(i, text.replace(/[.:!].*$/, '').toLowerCase().slice(0, 60) || 'the clan\'s order', this.name(c.leader), steps(i))) n++;
    }
    w.emit('clanOrder', { clan: c.name, id: c.leader, text, n });
  }
  /** Members a player leader's words go to (AI people on the same map, the most loyal first), for Planner.chat. */
  hearers(c: Clan): number[] {
    const e = this.w.e, L = e.slot(c.leader);
    return c.members.filter((id) => { const i = e.slot(id); return id !== c.leader && i >= 0 && e.kind[i] === Kind.Agent && L >= 0 && e.map[i] === e.map[L]; })
      .sort((a, b) => (this.loyal.get(b) ?? 0) - (this.loyal.get(a) ?? 0)).slice(0, 8).map((id) => e.slot(id));
  }

  // ------------------------------------------------------------------ wars
  /** Leader of clan c (by `by`, a name or 'owner') declares war on foe. true = declared, a string = why not. */
  declareWar(c: Clan, foe: Clan, by: string, why = ''): true | string {
    const w = this.w, e = w.e;
    if (c.id === foe.id) return 'that is my own clan';
    if (c.map !== foe.map) return `the ${foe.name} live in another place`;
    if (this.warOf(c.id, foe.id)) return `we are already at war with the ${foe.name}`;
    if (!foe.members.length) return `the ${foe.name} are no more`;
    const [a, b] = c.id < foe.id ? [c, foe] : [foe, c];
    const war: War = { a: a.id, b: b.id, start: w.gameSec, by, why: why || `${c.name} against ${foe.name}`, wins: [0, 0], raidAt: w.gameSec + HOUR };
    this.wars.push(war);
    this.addTension(c.id, foe.id, 10, 'war');
    w.emit('clanWar', { clan: c.name, foe: foe.name, id: c.leader, by, why: war.why });
    const L = e.slot(c.leader);
    if (L >= 0 && e.kind[L] === Kind.Agent) w.speak(L, `${c.name}! We are at war with the ${foe.name}. Arm yourselves and stand together.`);
    const F = e.slot(foe.leader);
    if (F >= 0 && e.kind[F] === Kind.Agent) w.speak(F, `The ${c.name} want war? Then they will have it.`);
    for (const [cl, other] of [[c, foe], [foe, c]] as const) for (const id of cl.members) {
      this.note(id, `${cl === c ? 'Our clan' : `The ${c.name} clan`} declared war ${cl === c ? `on the ${foe.name}` : 'on us'}.`);
      // Family on the other side: torn, less loyal.
      if (other.members.some((x) => this.kin(id, x))) this.loyal.set(id, Math.max(0, (this.loyal.get(id) ?? 0.5) - 0.15));
    }
    this.onChange();
    return true;
  }
  /** The war between c and foe ends. `winner` = clan id or -1 (by the duels won). */
  makePeace(c: Clan, foe: Clan, by: string, why: string): true | string {
    const w = this.w, e = w.e, war = this.warOf(c.id, foe.id);
    if (!war) return `we are not at war with the ${foe.name}`;
    this.wars = this.wars.filter((x) => x !== war);
    const k = war.a < war.b ? `${war.a}:${war.b}` : `${war.b}:${war.a}`;
    this.peaceAt.set(k, w.gameSec);
    this.tense.set(k, 3); this.causes.delete(k); this.topSince.delete(k);
    const [wa, wb] = war.wins, winner = wa === wb ? -1 : wa > wb ? war.a : war.b;
    w.emit('clanPeace', { clan: c.name, foe: foe.name, by, why, wins: war.wins, winner: winner >= 0 ? this.byId(winner)?.name ?? '' : '', days: Math.round((w.gameSec - war.start) / DAY * 10) / 10 });
    for (const cl of [c, foe]) {
      const won = winner === cl.id, lost = winner >= 0 && !won;
      for (const id of cl.members) {
        this.note(id, `Peace between the ${c.name} and the ${foe.name}${winner >= 0 ? `: ${won ? 'we won' : 'we lost'} (${Math.max(wa, wb)} to ${Math.min(wa, wb)})` : ''}.`);
        if (id !== cl.leader) this.loyal.set(id, Math.max(0, Math.min(1, (this.loyal.get(id) ?? 0.5) + (won ? 0.08 : lost ? -0.12 : 0))));
      }
    }
    const L = e.slot(c.leader);
    if (L >= 0 && e.kind[L] === Kind.Agent) w.speak(L, `Enough blood. There is peace with the ${foe.name}.`);
    this.onChange();
    return true;
  }
  /** Words to a leader ("declare war on the Redhand", "make peace"): done at once. Returns what was done, or why not. */
  warOrder(i: number, kind: 'war' | 'peace', words: string, by: string): { ok: boolean; text: string } {
    const w = this.w, id = w.e.id(i), c = this.clanOf(id);
    if (!c) return { ok: false, text: 'I am in no clan' };
    if (c.leader !== id) return { ok: false, text: `only ${this.name(c.leader)}, our leader, can ${kind === 'war' ? 'declare war' : 'make peace'}` };
    const foe = this.foeIn(c, words, kind);
    if (!foe) return { ok: false, text: kind === 'war' ? 'there is no other clan here to fight' : 'we are at war with nobody' };
    const r = kind === 'war' ? this.declareWar(c, foe, by, `${by === 'owner' ? 'the voice from the sky' : by} ordered it`) : this.makePeace(c, foe, by, `${by === 'owner' ? 'the voice from the sky' : by} ordered it`);
    return r === true ? { ok: true, text: kind === 'war' ? `war on the ${foe.name}` : `peace with the ${foe.name}` } : { ok: false, text: r };
  }
  /** The keyword net for words to a person (no clan step from the model): "war" needs a real war word or a clan named ("attack the zombie"
   *  is no war), "peace" only counts while their clan is at war. */
  warNet(i: number, text: string): '' | 'war' | 'peace' {
    const k = warWords(text), t = text.toLowerCase(), c = this.clanOf(this.w.e.id(i));
    if (!k || !c) return '';
    if (k === 'peace') return this.foes(c).length ? 'peace' : '';
    return /\bwars?\b|guerre|guerra|حرب/.test(t) || this.clans.some((x) => x.id !== c.id && t.includes(x.name.toLowerCase())) ? 'war' : '';
  }
  /** The clan named in the words, else (war) the tensest other clan of the map, (peace) the only / first enemy. */
  private foeIn(c: Clan, words: string, kind: 'war' | 'peace'): Clan | undefined {
    const t = words.toLowerCase();
    const named = this.clans.filter((x) => x.id !== c.id && x.members.length && t.includes(x.name.toLowerCase())).sort((a, b) => b.name.length - a.name.length)[0];
    if (named) return named;
    if (kind === 'peace') return this.foes(c)[0];
    // a clan named by its leader ("attack Omar's clan")
    for (const x of this.clans) if (x.id !== c.id && x.map === c.map && x.members.length && t.includes(this.name(x.leader).toLowerCase())) return x;
    return this.clans.filter((x) => x.id !== c.id && x.map === c.map && x.members.length && !this.warOf(c.id, x.id)).sort((a, b) => this.tension(c.id, b.id) - this.tension(c.id, a.id) || b.members.length - a.members.length)[0];
  }
  /** Hourly: wars end, war parties go out by day, leaders may start one when tension stays at the top. */
  private warHourly(): void {
    const w = this.w, e = w.e, hour = w.brain.hour();
    for (const war of this.wars.slice()) {
      const A = this.byId(war.a), B = this.byId(war.b);
      if (!A || !B || !A.members.length || !B.members.length) { this.wars = this.wars.filter((x) => x !== war); w.emit('clanPeace', { clan: A?.name ?? '', foe: B?.name ?? '', why: 'a clan is gone', wins: war.wins, winner: '' }); continue; }
      this.tense.set(A.id < B.id ? `${A.id}:${B.id}` : `${B.id}:${A.id}`, 10); // a war keeps them at the top
      const [wa, wb] = war.wins;
      // The side far behind sues for peace (an AI leader; a player leader decides on the TV).
      const loser = wa - wb >= WAR_LEAD ? B : wb - wa >= WAR_LEAD ? A : undefined;
      if (loser && this.auto(e.slot(loser.leader)) && w.rng.chance(0.35)) { this.makePeace(loser, loser === A ? B : A, this.name(loser.leader), 'too many beaten'); continue; }
      if (w.gameSec - war.start > WAR_DAYS * DAY) { this.makePeace(A, B, 'both', 'worn out by the war'); continue; }
      // War parties go out by day, not with zombies about.
      if (hour < 8 || hour >= 17 || w.gameSec < war.raidAt || w.zombies.count(A.map) > 0) continue;
      war.raidAt = w.gameSec + 5 * HOUR;
      for (const [me, foe] of [[A, B], [B, A]] as const) if (w.rng.chance(0.6)) this.raid(me, foe);
    }
    if (!this.autoWar) return;
    for (let a = 0; a < this.clans.length; a++) for (let b = a + 1; b < this.clans.length; b++) {
      const A = this.clans[a]!, B = this.clans[b]!;
      const k = A.id < B.id ? `${A.id}:${B.id}` : `${B.id}:${A.id}`, top = this.topSince.get(k);
      // At 10/10 for TOP_HOLD (imad 2026-11-27: "yes, when it hits 10/10"): the bolder AI leader declares it. No dice.
      if (A.map !== B.map || A.members.length < 3 || B.members.length < 3 || this.warOf(A.id, B.id) || top === undefined || w.gameSec - top < TOP_HOLD) continue;
      if (w.gameSec - (this.peaceAt.get(k) ?? -1e9) < 2 * DAY) continue;
      const leaders = [A, B].filter((x) => { const L = e.slot(x.leader); return L >= 0 && this.auto(L); })
        .sort((x, y) => (this.w.profiles.get(y.leader)?.traits.courage ?? 0) - (this.w.profiles.get(x.leader)?.traits.courage ?? 0));
      const pick = leaders[0];
      if (pick) this.declareWar(pick, pick === A ? B : A, this.name(pick.leader), `tension at 10/10 (${this.why(A.id, B.id).filter(([, v]) => v > 0).slice(0, 2).map(([c]) => c).join(', ') || 'old grudges'})`);
    }
  }
  /** A war party: the bravest free members walk over to the foe's home and stay a while; duels start on sight. */
  raid(c: Clan, foe: Clan): number {
    const w = this.w, e = w.e;
    const nerve = (id: number) => { const p = w.profiles.get(id), t = p?.traits; const i = e.slot(id); return t ? t.courage + t.strength * 0.4 + (i >= 0 && w.survival.weapon(i)[1] > 0 ? 0.25 : 0) : 0; };
    const fit = c.members.filter((id) => { const i = e.slot(id); return i >= 0 && e.kind[i] === Kind.Agent && e.map[i] === c.map && this.grown(id) && this.free(i) && e.hp[i]! > 60 && nerve(id) > 0.6; })
      .sort((a, b) => nerve(b) - nerve(a)).slice(0, Math.min(6, 2 + Math.floor(c.members.length / 5)));
    const targets = foe.members.filter((id) => { const j = e.slot(id); return j >= 0 && e.map[j] === c.map && e.kind[j] === Kind.Agent; });
    if (fit.length < 2 || !targets.length) return 0;
    let n = 0;
    type S = Parameters<typeof w.tasks.start>[3];
    for (const id of fit) {
      const i = e.slot(id), who = targets[w.rng.int(targets.length)]!;
      const steps: S = [...(w.survival.weapon(i)[1] > 0 ? [] : [{ do: 'craft', what: 'spear' }]), { do: 'goto', who }, { do: 'stay', minutes: 40 }];
      if (w.profileOf(i)?.mind?.task) w.tasks.stop(i);
      if (w.tasks.start(i, `raid the ${foe.name}`, this.name(c.leader), steps)) n++;
    }
    if (n) {
      const L = e.slot(c.leader);
      if (L >= 0 && e.kind[L] === Kind.Agent) w.speak(L, `Go, ${n} of you: show the ${foe.name} who we are.`);
      w.emit('clanRaid', { clan: c.name, foe: foe.name, n });
    }
    return n;
  }
  private note(id: number, text: string): void {
    const p = this.w.profiles.get(id);
    if (!p || p.player) return;
    p.mind ??= { notes: [], summary: '', mood: 'calm', rel: {}, lastPlan: this.w.gameSec - 1e9 };
    p.mind.notes.push({ at: this.w.gameSec, text });
    if (p.mind.notes.length > 12) p.mind.notes.splice(0, p.mind.notes.length - 12);
  }

  // ------------------------------------------------------------------ joining, leaving, founding
  found(m: number, leader: number, members: number[] = [], home?: { x: number; y: number }, want = ''): Clan {
    const w = this.w, e = w.e, used = new Set(this.clans.map((c) => c.name.toLowerCase()));
    const clean = want.replace(/[^\p{L}\p{N} '-]/gu, '').trim().slice(0, 20);
    const name = clean && !used.has(clean.toLowerCase()) ? clean : NAMES.find((n) => !used.has(n.toLowerCase())) ?? `Clan ${this.nextId}`;
    const old = this.clanOf(leader);
    if (old) this.leave(old, leader, 'founded a clan of their own');
    const L = e.slot(leader), camp = w.survival.campOf(m);
    const c: Clan = { id: this.nextId++, name, map: m, leader, founder: leader, members: [], hx: home?.x ?? camp?.x ?? e.x[L]!, hy: home?.y ?? camp?.y ?? e.y[L]!, at: w.gameSec, lastVote: w.gameSec };
    this.clans.push(c);
    this.join(c, leader, 1);
    // The first clan of a place founded by an AI person: those who like the founder (and family) come along (a player recruits by hand).
    const first = this.clans.filter((x) => x.map === m).length === 1;
    const invited = members.length ? members : first && this.auto(L) ? (() => { const out: number[] = []; for (let i = 0; i < e.hi; i++) if (e.map[i] === m && this.auto(i) && this.member(i) && !this.of.has(e.id(i)) && (this.rel(e.id(i), leader) >= -1 || this.kin(e.id(i), leader))) out.push(e.id(i)); return out; })() : [];
    for (const id of invited) if (!this.of.has(id) && id !== leader) this.join(c, id, 0.5 + Math.max(0, this.rel(id, leader)) * 0.08);
    w.emit('clan', { clan: name, leader, n: c.members.length, map: w.maps[m]!.def.id });
    return c;
  }
  join(c: Clan, id: number, loyal: number): void {
    const old = this.clanOf(id);
    if (old?.id === c.id) return;
    if (old) { this.leave(old, id, `moved to ${c.name}`); this.w.emit('clanSwitch', { id, from: old.name, clan: c.name }); }
    c.members.push(id); this.of.set(id, c.id); this.loyal.set(id, Math.min(1, loyal));
    this.w.emit('clanJoin', { id, clan: c.name, n: c.members.length });
  }
  leave(c: Clan, id: number, why: string): void {
    c.members = c.members.filter((x) => x !== id); this.of.delete(id); this.loyal.delete(id);
    if (c.vote) { c.vote.cands = c.vote.cands.filter((x) => x !== id); c.vote.ballots = c.vote.ballots.filter(([v, k]) => v !== id && k !== id); }
    this.w.emit('clanLeave', { clan: c.name, id, why });
    if (c.leader !== id) this.feel(id, c.leader, -0.5);
    else if (c.members.length) { c.leader = this.byInfluence(c.members, c)[0]!; c.vote = undefined; this.w.emit('clanLeader', { clan: c.name, id: c.leader, old: id, why: 'the leader left' }); }
  }
  /** Does the leader of c take `id` in? Players leading take everyone; an AI leader not someone they dislike. */
  accepts(c: Clan, id: number): boolean {
    const L = this.w.e.slot(c.leader);
    if (L < 0) return true;
    if (this.w.e.kind[L] === Kind.Player) return true;
    return this.rel(c.leader, id) >= -1.5 || this.kin(c.leader, id);
  }
  /** A strong member who does not like the leader goes to found a rival clan, with friends. */
  private maybeSplit(c: Clan): void {
    const w = this.w, e = w.e;
    const cands = c.members.filter((id) => id !== c.leader && this.auto(e.slot(id)) && this.rel(id, c.leader) <= 0 && this.inf(id) >= this.inf(c.leader) * 0.85 && (this.loyal.get(id) ?? 0.5) < 0.5 && !this.pending.has(id));
    if (!cands.length || !w.rng.chance(0.15)) return;
    const rebel = cands.sort((a, b) => this.inf(b) - this.inf(a))[0]!;
    const friends = c.members.filter((id) => id !== rebel && id !== c.leader && this.auto(e.slot(id)) && (this.kin(id, rebel) || this.rel(id, rebel) > this.rel(id, c.leader) + 0.5)).slice(0, Math.floor(c.members.length / 2) - 1);
    if (!friends.length) return;
    const R = e.slot(rebel);
    if (!this.free(R)) return;
    this.pending.set(rebel, { from: c.id, friends });
    w.tasks.start(R, 'found a clan of my own', 'myself', [{ do: 'clan', what: 'found' }]);
    w.emit('clanRebel', { clan: c.name, id: rebel, friends });
  }
  /** The rebel founded: their friends still in the old clan come along, homes apart, tension. */
  private settleSplit(rebel: number, n: Clan): void {
    const w = this.w, e = w.e, pd = this.pending.get(rebel);
    if (!pd) return;
    this.pending.delete(rebel);
    const from = this.byId(pd.from);
    const R = e.slot(rebel), ang = w.rng.next() * Math.PI * 2;
    const spot = R >= 0 ? w.freeSpot(n.map, e.x[R]! + Math.cos(ang) * 22, e.y[R]! + Math.sin(ang) * 22, 12) : null;
    if (spot) { n.hx = spot.x; n.hy = spot.y; }
    for (const id of pd.friends) if (from && from.members.includes(id)) { this.join(n, id, 0.6); if (from) this.feel(id, from.leader, -0.4); }
    if (from) { this.addTension(from.id, n.id, 3, 'the split'); w.emit('clanSplit', { from: from.name, clan: n.name, id: rebel }); }
  }

  /** The task skill `clan` (sim/tasks.ts): join who / quit / found / vote who / call. true = done, a string = why not. */
  step(i: number, s: { what?: string; who?: number; phase?: number }, first: boolean): boolean | string {
    const w = this.w, e = w.e, id = e.id(i), b = w.brain;
    const q = (s.what ?? '').toLowerCase().trim();
    const ww = warWords(q);
    if (ww) { const r = this.warOrder(i, ww, q, this.name(id)); return r.ok || r.text; }
    const verb = /quit|leave|quitter|dejar|salir|غادر|انسحب/.test(q) ? 'quit' : /found|create|start|fonder|créer|fundar|crear|أسس|انشئ/.test(q) ? 'found'
      : /vote|élire|elegir|votar|صوت/.test(q) ? 'vote' : /call|election|élection|elección|انتخاب/.test(q) ? 'call' : 'join';
    const near = (j: number, r: number) => j >= 0 && e.map[j] === e.map[i] && Math.hypot(e.x[j]! - e.x[i]!, e.y[j]! - e.y[i]!) <= r;
    const walk = (j: number) => { if (b.orderOf(i).kind !== 'goto') b.order(i, 'goto', e.id(j), -1, 180); return false; };
    void first;
    switch (verb) {
      case 'quit': {
        const c = this.clanOf(id);
        if (!c) return true;
        w.speak(i, `I am leaving the ${c.name}.`);
        this.leave(c, id, 'chose to quit');
        return true;
      }
      case 'found': {
        const r = w.quests.npcSlot('registrar');
        if (r >= 0 && e.map[r] === e.map[i] && !near(r, 3)) return walk(r);
        b.order(i, 'stop', -1, -1, 0);
        const c = this.found(e.map[i]!, id, [], undefined, q.replace(/^.*?(found|create|start)\s*/, '').replace(/^(a )?clan\s*/, ''));
        w.speak(i, `I found the ${c.name} clan. Who is with me?`);
        this.settleSplit(id, c);
        return true;
      }
      case 'vote': case 'call': {
        const c = this.clanOf(id);
        if (!c) return 'I am in no clan';
        if (verb === 'call') return this.inf(id) < CALL_MIN ? `my influence is only ${this.inf(id)}, ${CALL_MIN} is needed to call a vote` : this.callVote(c, `${this.name(id)} asked for a vote`, id) || 'a vote is already on';
        if (!c.vote) return 'there is no vote now';
        const cand = s.who !== undefined && c.vote.cands.includes(s.who) ? s.who : this.choose(id, c);
        this.ballot(c, id, cand);
        return true;
      }
      default: { // join: walk to the leader and ask
        let c = s.who !== undefined && s.who >= 0 ? this.clanOf(s.who) : undefined;
        c ??= this.byName(q.replace(/^.*?join\s*(the\s*)?/, '').replace(/\s*clan$/, ''));
        if (!c) { let bs = -Infinity; for (const x of this.clans) if (x.map === e.map[i] && x.id !== this.clanOf(id)?.id) { const f = this.fit(id, x); if (f > bs) { bs = f; c = x; } } }
        if (!c) return 'there is no clan here to join';
        if (c.members.includes(id)) return true;
        const L = e.slot(c.leader);
        if (L < 0 || e.map[L] !== e.map[i]) return `the leader of ${c.name} is not here`;
        if (!near(L, 3)) return walk(L);
        b.order(i, 'stop', -1, -1, 0);
        w.speak(i, `May I join the ${c.name}?`);
        if (!this.accepts(c, id)) { if (e.kind[L] === Kind.Agent) w.speak(L, 'No. Not you.'); return `${this.name(c.leader)} would not take me`; }
        this.join(c, id, 0.55 + Math.max(0, this.rel(id, c.leader)) * 0.08);
        if (e.kind[L] === Kind.Agent) w.speak(L, `Welcome to the ${c.name}.`);
        return true;
      }
    }
  }

  // ------------------------------------------------------------------ players (TV: Clan page, the registrar)
  /** A player's clan action: info / join:<clan id> / quit / found:<name> (next to the registrar) / vote:<entity id> / call / order:<words>. */
  playerDo(i: number, cmd: string): { ok: boolean; code: string; [k: string]: unknown } {
    const w = this.w, e = w.e, id = e.id(i), [verb0, ...rest] = cmd.split(':'), arg = rest.join(':').trim(), verb = verb0!.trim();
    const mine = this.clanOf(id);
    if (verb === 'info' || !verb) return { ok: true, code: 'clan', clan: this.info(i) };
    if (verb === 'join') {
      const c = this.byId(Number(arg));
      if (!c) return { ok: false, code: 'clanNone' };
      if (c.members.includes(id)) return { ok: true, code: 'clan', clan: this.info(i) };
      if (!this.accepts(c, id)) return { ok: false, code: 'clanRefused', name: this.name(c.leader) };
      this.join(c, id, 0.6);
      return { ok: true, code: 'clanJoined', name: c.name, clan: this.info(i) };
    }
    if (verb === 'quit') {
      if (!mine) return { ok: false, code: 'clanNone' };
      this.leave(mine, id, 'chose to quit');
      return { ok: true, code: 'clanLeft', name: mine.name, clan: this.info(i) };
    }
    if (verb === 'found') {
      if (w.quests.nearNpc(i, 4) !== 'registrar') return { ok: false, code: 'clanAtRegistrar' };
      if (mine && mine.leader === id && mine.members.length > 1) return { ok: false, code: 'clanLeadAlready' };
      const c = this.found(e.map[i]!, id, [], undefined, arg);
      return { ok: true, code: 'clanFounded', name: c.name, clan: this.info(i) };
    }
    if (!mine) return { ok: false, code: 'clanNone' };
    if (verb === 'vote') {
      if (!mine.vote) return { ok: false, code: 'clanNoVote' };
      return this.ballot(mine, id, Number(arg)) ? { ok: true, code: 'clanVoted', name: this.name(Number(arg)), clan: this.info(i) } : { ok: false, code: 'clanNoVote' };
    }
    if (verb === 'call') {
      if (w.gameSec - (mine.lastVote ?? mine.at) < 6 * HOUR) return { ok: false, code: 'clanTooSoon' };
      if (this.inf(id) < CALL_MIN) return { ok: false, code: 'clanLowInfluence', n: this.inf(id), need: CALL_MIN };
      return this.callVote(mine, `${this.name(id)} asked for a vote`, id) ? { ok: true, code: 'clanVoteOn', clan: this.info(i) } : { ok: false, code: 'clanVoteOn' };
    }
    if (verb === 'war' || verb === 'peace') {
      if (mine.leader !== id) return { ok: false, code: 'clanNotLeader' };
      const foe = this.byId(Number(arg));
      if (!foe) return { ok: false, code: 'clanNone' };
      const r = verb === 'war' ? this.declareWar(mine, foe, this.name(id), `${this.name(id)} declared it`) : this.makePeace(mine, foe, this.name(id), `${this.name(id)} asked for peace`);
      return r === true ? { ok: true, code: verb === 'war' ? 'clanWarOn' : 'clanPeaceOn', name: foe.name, clan: this.info(i) } : { ok: false, code: 'clanWarNo', why: r, clan: this.info(i) };
    }
    if (verb === 'order') {
      if (mine.leader !== id) return { ok: false, code: 'clanNotLeader' };
      if (!arg) return { ok: false, code: 'nothing' };
      mine.order = arg.slice(0, 200); mine.orderAt = w.gameSec;
      w.emit('clanOrder', { clan: mine.name, id, text: mine.order, n: this.hearers(mine).length, player: true });
      return { ok: true, code: 'clanOrdered', n: this.hearers(mine).length, clan: this.info(i) };
    }
    return { ok: false, code: 'nothing' };
  }
  /** What the TV's Clan page shows. */
  info(i: number): Record<string, unknown> {
    const w = this.w, e = w.e, id = e.id(i), c = this.clanOf(id);
    const others = this.clans.filter((x) => x.map === e.map[i] && x.id !== c?.id).map((x) => { const war = c ? this.warOf(c.id, x.id) : undefined; return { id: x.id, name: x.name, leader: this.name(x.leader), n: x.members.length, approval: this.approval(x), tension: c ? Math.round(this.tension(c.id, x.id)) : 0, war: war ? (war.a === c!.id ? war.wins : [war.wins[1], war.wins[0]]) : null }; });
    const nearReg = w.quests.nearNpc(i, 4) === 'registrar';
    if (!c) return { mine: null, others, nearReg };
    return {
      mine: {
        id: c.id, name: c.name, leader: c.leader, leaderName: this.name(c.leader), me: id, lead: c.leader === id, approval: this.approval(c), loyalty: Math.round(this.loyalty(id) * 100),
        members: c.members.map((x) => ({ id: x, name: this.name(x), respect: Math.round(this.respect(x, c) * 10) / 10, influence: this.inf(x) })).sort((a, b) => b.influence - a.influence || b.respect - a.respect),
        influence: this.inf(id), callMin: CALL_MIN,
        vote: c.vote ? { end: c.vote.end, why: c.vote.why, cands: c.vote.cands.map((k) => ({ id: k, name: this.name(k) })), my: c.vote.ballots.find(([v]) => v === id)?.[1] ?? -1 } : null,
        result: c.result ? { winner: this.name(c.result.winner), old: this.name(c.result.old), tally: c.result.tally.map(([k, n]) => [this.name(k), n]) } : null,
        order: c.order ?? '', camp: c.camp ? { x: Math.round(c.camp.x), y: Math.round(c.camp.y) } : null, rivals: this.rivals(c).map((r) => ({ name: r.clan.name, tension: Math.round(r.tension) })), now: w.gameSec,
      }, others, nearReg,
    };
  }
  /** The clan line of every prompt about a person. */
  promptText(i: number): string {
    const w = this.w, id = w.e.id(i), c = this.clanOf(id);
    if (!c) { const n = this.clans.filter((x) => x.map === w.e.map[i]).map((x) => x.name); return n.length ? `You are in no clan, and everyone must belong to one: choose now. Clans here: ${n.join(', ')} (skill clan {"what":"join <name>"}).` : 'There is no clan here yet, and everyone must belong to one: Odile the registrar in town founds them (skill clan {"what":"found"}).'; }
    const r = this.rivals(c).map((x) => `${x.clan.name} (tension ${Math.round(x.tension)}/10)`);
    const lead = c.leader === id;
    return `Clan: ${c.name}, ${lead ? 'you are its elected leader (your members follow your orders)' : `led by ${this.name(c.leader)} (elected; approval ${this.approval(c)}%)`}, ${c.members.length} members; your loyalty ${Math.round(this.loyalty(id) * 100)}%.`
      + (c.order ? ` The leader's order: "${c.order}".` : '') + (c.vote ? ` An election is on: ${c.vote.cands.map((k) => this.name(k)).join(' or ')}.` : '')
      + (c.camp ? ` Your clan has its own camp at (${Math.round(c.camp.x)}, ${Math.round(c.camp.y)}): your home and huts belong there.` : c.members.length > CLAN_CAMP_AT - 4 ? ` Past ${CLAN_CAMP_AT} members a clan gets a camp of its own.` : '')
      + (r.length ? ' Rivals: ' + r.join(', ') + '.' : '') + this.warText(c, lead) + ' You may change clan (skill clan), but everyone must belong to one.';
  }
  private warText(c: Clan, lead: boolean): string {
    const ws = this.wars.filter((x) => x.a === c.id || x.b === c.id).map((x) => { const mine = x.a === c.id ? 0 : 1, f = this.byId(x.a === c.id ? x.b : x.a); return `${f?.name ?? '?'} (duels won ${x.wins[mine]} to ${x.wins[1 - mine]})`; });
    if (ws.length) return ` AT WAR with ${ws.join(', ')}: their members are your enemies (you fight them when you meet).${lead ? ' As leader you may end it (skill clan {"what":"peace <clan>"}).' : ''}`;
    return lead && this.clans.some((x) => x.id !== c.id && x.map === c.map) ? ' As leader you may declare war on a clan (skill clan {"what":"war <clan>"}) or make peace.' : '';
  }

  // ------------------------------------------------------------------ every second: fights
  update(): void {
    const w = this.w, e = w.e;
    this.watch();
    if (this.nextHour === 0) this.nextHour = w.gameSec + HOUR;
    if (w.gameSec >= this.nextHour) { this.nextHour = w.gameSec + HOUR; this.hourly(); }
    for (const d of [...new Set(this.duels.values())]) this.stepDuel(d);
    // Look at a few people each second (round robin) for a quarrel.
    for (let n = 0; n < 8 && e.hi; n++) {
      const i = this.scan++ % e.hi;
      if (!this.adult(i) || this.duels.has(e.id(i))) continue;
      this.quarrel(i);
    }
  }

  private quarrel(i: number): void {
    const w = this.w, e = w.e, id = e.id(i), p = w.profileOf(i);
    if (!p || e.act[i] === Act.Sleep || e.act[i] === Act.Flee || e.act[i] === Act.Fight || e.hp[i]! < 55 || w.rules.forbidden(i, 'fight')) return;
    if (this.wars.length && this.warFight(i)) return;
    if ((this.lastAt.get(id) ?? -1e9) > w.gameSec - 3 * HOUR) return; // one quarrel at most every 3 game hours each
    let b = -1, bd = 4;
    for (let j = 0; j < e.hi; j++) {
      if (j === i || e.map[j] !== e.map[i] || (e.kind[j] !== Kind.Agent && e.kind[j] !== Kind.Player) || (e.flags[j]! & 32) || this.duels.has(e.id(j))) continue;
      const d = Math.hypot(e.x[j]! - e.x[i]!, e.y[j]! - e.y[i]!);
      if (d < bd) { bd = d; b = j; }
    }
    if (b < 0 || this.kin(id, e.id(b))) return;
    if (e.kind[b] === Kind.Player && !(this.pvpOn(b) && this.fightsPlayers(i))) return;
    if (w.zombies.nearest(e.map[i]!, e.x[i]!, e.y[i]!, 14) >= 0) return; // together against the zombies
    const t = p.traits, ca = this.clanOf(id), cb = this.clanOf(e.id(b));
    let pr = 0;
    if (ca && cb && ca.id !== cb.id) pr += 0.004 * this.tension(ca.id, cb.id) * (this.tension(ca.id, cb.id) >= 4 ? 1 : 0);
    const r = this.rel(id, e.id(b));
    if (r <= -2) pr += 0.01 * -r;
    const edgy = e.hunger[i]! > 75 || e.thirst[i]! > 75 || e.tired[i]! > 85 || p.personality.some((x) => x === 'grumpy' || x === 'proud' || x === 'stubborn');
    if (edgy) pr += 0.0015; // a misunderstanding
    if (pr <= 0) return;
    pr *= 0.4 + t.courage * 0.6 + (1 - t.empathy) * 0.5;
    if (!w.rng.chance(Math.min(0.2, pr))) return;
    this.start(i, b, r <= -2 || (ca && cb && ca.id !== cb.id) ? 'old grudges' : 'a misunderstanding');
  }
  /** At war: an enemy within 9 m and the nerve for it = a fight (at most one every 40 game minutes each). */
  private warFight(i: number): boolean {
    const w = this.w, e = w.e, id = e.id(i), c = this.clanOf(id);
    if (!c || !this.foes(c).length || (this.lastAt.get(id) ?? -1e9) > w.gameSec - 40 * 60 || w.family.ageOf(i) < CLAN_AGE) return false;
    if (w.zombies.nearest(e.map[i]!, e.x[i]!, e.y[i]!, 14) >= 0) return false;
    let b = -1, bd = 9;
    for (let j = 0; j < e.hi; j++) {
      if (j === i || e.map[j] !== e.map[i] || (e.kind[j] !== Kind.Agent && e.kind[j] !== Kind.Player) || (e.flags[j]! & 32) || this.duels.has(e.id(j))) continue;
      if (!this.enemies(id, e.id(j)) || e.act[j] === Act.Sleep || w.family.ageOf(j) < CLAN_AGE) continue;
      const d = Math.hypot(e.x[j]! - e.x[i]!, e.y[j]! - e.y[i]!);
      if (d < bd) { bd = d; b = j; }
    }
    if (b < 0 || this.kin(id, e.id(b))) return false;
    if (e.kind[b] === Kind.Player && !(this.pvpOn(b) && this.fightsPlayers(i))) return false;
    const t = w.profileOf(i)!.traits;
    if (!w.rng.chance(Math.min(0.9, 0.2 + t.courage * 0.5 + (w.survival.weapon(i)[1] > 0 ? 0.15 : 0)))) return false;
    this.start(i, b, 'war');
    return true;
  }
  private fightsPlayers(i: number): boolean { const r = this.w.profileOf(i); return !!r && r.traits.courage > 0.55; }

  /** A fight starts: `a` goes for `b`. Used by quarrels and when a player hits someone. */
  start(a: number, b: number, why: string): void {
    const w = this.w, e = w.e, ia = e.id(a), ib = e.id(b);
    if (this.duels.has(ia) || this.duels.has(ib)) return;
    const d: Duel = { a: ia, b: ib, start: w.gameSec, hitAt: 0, hurt: [0, 0], t0: w.tick };
    this.duels.set(ia, d); if (e.kind[b] === Kind.Agent) this.duels.set(ib, d);
    this.lastAt.set(ia, w.gameSec); this.lastAt.set(ib, w.gameSec);
    this.feel(ia, ib, -1); this.feel(ib, ia, -1);
    const ca = this.clanOf(ia), cb = this.clanOf(ib);
    if (ca && cb && ca.id !== cb.id) this.addTension(ca.id, cb.id, 1, 'fights');
    w.emit('duel', { a: ia, b: ib, why });
    w.speak(a, why === 'a misunderstanding' ? 'What did you say?!' : why === 'war' ? `For the ${ca?.name ?? 'clan'}!` : 'Enough. Back off!');
  }
  /** A player hit a person: they answer in kind (brave) or give way (timid). */
  hurtBy(victim: number, by: number): void {
    const w = this.w, e = w.e, p = w.profileOf(victim);
    if (!p || e.kind[victim] !== Kind.Agent) return;
    this.feel(e.id(victim), e.id(by), -2);
    const ca = this.clanOf(e.id(victim)), cb = this.clanOf(e.id(by));
    if (ca && cb && ca.id !== cb.id) this.addTension(ca.id, cb.id, 1, 'a player hit one of them');
    if (p.traits.courage + p.traits.strength * 0.4 > 0.7 && e.hp[victim]! > 40 && !this.duels.has(e.id(victim))) this.start(victim, by, 'hit first');
  }

  private stepDuel(d: Duel): void {
    const w = this.w, e = w.e, a = e.slot(d.a), b = e.slot(d.b);
    const end = (why: string, loser = -1) => this.end(d, why, loser);
    if (a < 0 || b < 0 || e.map[a] !== e.map[b] || e.map[a] === NO_MAP) return end('gone');
    const dist = Math.hypot(e.x[b]! - e.x[a]!, e.y[b]! - e.y[a]!);
    if (dist > 14) return end('apart');
    if ((w.tick - (d.t0 ?? w.tick)) / w.opt.tickRate > 40) return end('tired out');
    if (w.zombies.nearest(e.map[a]!, e.x[a]!, e.y[a]!, 12) >= 0) return end('zombies');
    // Whoever is hurt enough yields: the timid sooner.
    const max = w.sc.agents.hp;
    const give = (i: number) => e.hp[i]! < max * (0.35 + (1 - (w.profileOf(i)?.traits.courage ?? 0.5)) * 0.25);
    if (give(a)) return end('yielded', a);
    if (e.kind[b] === Kind.Agent && give(b)) return end('yielded', b);
    for (const [x, y] of [[a, b], [b, a]] as const) {
      if (e.kind[x] !== Kind.Agent) continue; // a player's character is played by hand
      w.brain.duelMove(x, e.x[y]!, e.y[y]!, dist < 1.7, e.id(y));
    }
    if (dist >= 1.7 || w.gameSec - d.hitAt < 1) return;
    d.hitAt = w.gameSec;
    for (const [x, y] of [[a, b], [b, a]] as const) {
      if (e.kind[x] !== Kind.Agent || !w.rng.chance(0.7)) continue;
      if (e.kind[y] === Kind.Player && !this.pvpOn(y)) continue;
      const dmg = pvpDamage(w.survival.weapon(x)[1], w.survival.weapon(y)[1] > 0, w.survival.defence(y));
      this.damage(y, dmg, x);
      d.hurt[x === a ? 1 : 0] += dmg;
    }
  }
  /** One hit between people; nobody dies of it (hp stays at 3 or more). */
  damage(victim: number, dmg: number, by: number): number {
    const w = this.w, e = w.e;
    e.hp[victim] = Math.max(e.kind[victim] === Kind.Player ? 5 : 3, e.hp[victim]! - dmg);
    w.emit('pvp', { id: e.id(victim), by: e.id(by), dmg });
    return dmg;
  }
  private end(d: Duel, why: string, loser = -1): void {
    const w = this.w, e = w.e;
    this.duels.delete(d.a); this.duels.delete(d.b);
    for (const id of [d.a, d.b]) { const i = e.slot(id); if (i >= 0 && e.kind[i] === Kind.Agent) w.brain.duelEnd(i, i === loser, id === d.a ? d.b : d.a); }
    const win = loser >= 0 ? e.id(loser) === d.a ? d.b : d.a : -1;
    if (win >= 0) { this.feel(e.id(loser), win, -0.5); const wi = e.slot(win); if (wi >= 0 && e.kind[wi] === Kind.Agent) w.speak(wi, 'Remember this.'); }
    w.emit('duelEnd', { a: d.a, b: d.b, why, winner: win });
    // A duel won in a war counts for the winner's clan.
    const cw = win >= 0 ? this.of.get(win) : undefined, cl = win >= 0 ? this.of.get(e.id(loser)) : undefined, war = cw !== undefined && cl !== undefined ? this.warOf(cw, cl) : undefined;
    if (war) war.wins[war.a === cw ? 0 : 1]++;
    else if (cw !== undefined && cl !== undefined && cw !== cl) this.addTension(cw, cl, 0.5, 'a member beaten');
  }

  // ------------------------------------------------------------------ saving
  save(): unknown { return { clans: this.clans, loyal: [...this.loyal], tense: [...this.tense], nextId: this.nextId, pending: [...this.pending], wars: this.wars, peaceAt: [...this.peaceAt], autoWar: this.autoWar, causes: [...this.causes], topSince: [...this.topSince] }; }
  load(s: unknown): void {
    const d = s as { clans?: Clan[]; loyal?: [number, number][]; tense?: [string, number][]; nextId?: number; pending?: [number, { from: number; friends: number[] }][]; wars?: War[]; peaceAt?: [string, number][]; autoWar?: boolean; causes?: [string, Record<string, number>][]; topSince?: [string, number][] } | undefined;
    this.wars = d?.wars ?? []; this.peaceAt = new Map(d?.peaceAt ?? []); this.autoWar = d?.autoWar ?? true; this.causes = new Map(d?.causes ?? []); this.topSince = new Map(d?.topSince ?? []);
    this.clans = d?.clans ?? []; this.loyal = new Map(d?.loyal ?? []); this.tense = new Map(d?.tense ?? []); this.nextId = d?.nextId ?? 1; this.pending = new Map(d?.pending ?? []);
    this.of.clear(); for (const c of this.clans) for (const id of c.members) this.of.set(id, c.id);
    this.duels.clear(); this.nextHour = 0;
  }
}
