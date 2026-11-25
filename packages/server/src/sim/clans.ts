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
import type { World } from './world.js';
import { NO_MAP } from './entities.js';

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
}
interface Duel { a: number; b: number; start: number; hitAt: number; hurt: [number, number] }

const NAMES = ['Ashfall', 'Redhand', 'Ironwood', 'Northgate', 'Stonefield', 'Emberline', 'Greywolves', 'Blackthorn', 'Riverside', 'Highwall', 'Dustwalkers', 'Oakheart', 'Sunrise', 'Nightwatch'];
const HOUR = 3600, DAY = 24 * HOUR;
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
  private duels = new Map<number, Duel>(); // by either id
  /** A rebel on the way to the registrar: the clan they leave and the friends who come with them. */
  private pending = new Map<number, { from: number; friends: number[] }>();
  private nextId = 1;
  private nextHour = 0;
  private scan = 0;
  private lastAt = new Map<number, number>();
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
  private addTension(a: number, b: number, d: number): void {
    const k = a < b ? `${a}:${b}` : `${b}:${a}`;
    this.tense.set(k, Math.max(0, Math.min(10, (this.tense.get(k) ?? 0) + d)));
  }
  loyalty(id: number): number { return this.loyal.get(id) ?? 0; }
  /** Tension each clan has with each other clan (for the panel and prompts). */
  rivals(c: Clan): { clan: Clan; tension: number }[] {
    return this.clans.filter((x) => x.id !== c.id).map((x) => ({ clan: x, tension: this.tension(c.id, x.id) })).filter((r) => r.tension >= 1);
  }
  duelling(i: number): boolean { return this.duels.has(this.w.e.id(i)); }
  /** How much the members respect `id`: their feelings for them (-5..5 on average) + leadership. */
  respect(id: number, c: Clan): number {
    const others = c.members.filter((x) => x !== id);
    const feel = others.length ? others.reduce((a, x) => a + this.rel(x, id), 0) / others.length : 0;
    return feel + this.lead(id) * 1.2;
  }
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
      if (!c.members.includes(c.leader) && c.members.length) { const old = c.leader; c.leader = c.members.slice().sort((a, b) => this.respect(b, c) - this.respect(a, c))[0]!; c.vote = undefined; w.emit('clanLeader', { clan: c.name, id: c.leader, old, why: 'the leader is gone' }); }
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
      for (const id of adults) {
        const i = e.slot(id);
        if (!this.auto(i)) continue;
        const mine = this.clanOf(id);
        // The unaligned look for a clan; the unhappy look for a better one. Joining is walking to the leader and asking.
        if (!mine || (id !== mine.leader && (this.loyal.get(id) ?? 0.5) < 0.4)) {
          let best: Clan | undefined, bs = mine ? this.fit(id, mine) + 1.2 : -0.5;
          for (const c of this.clans) if (c.map === m && c.id !== mine?.id && c.members.length) { const f = this.fit(id, c); if (f > bs) { bs = f; best = c; } }
          if (best && this.free(i) && w.rng.chance(mine ? 0.25 : 0.6)) w.tasks.start(i, `${mine ? 'move to' : 'join'} the ${best.name} clan`, 'myself', [{ do: 'clan', what: 'join', who: best.leader }]);
        }
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
        this.elections(c);
        this.leaderOrder(c);
      }
      // Tension between clans of this map: the closer their homes, the tenser; it wears off with time.
      const cl = this.clans.filter((x) => x.map === m);
      for (let a = 0; a < cl.length; a++) for (let b = a + 1; b < cl.length; b++) {
        const A = cl[a]!, B = cl[b]!, d = Math.hypot(A.hx - B.hx, A.hy - B.hy);
        this.addTension(A.id, B.id, (d < 40 ? 0.5 : 0.1) - 0.25);
        if (this.tension(A.id, B.id) >= 3) for (const x of A.members) for (const y of B.members) { if (w.rng.chance(0.15)) { this.feel(x, y, -0.15); this.feel(y, x, -0.15); } }
      }
    }
    this.onChange();
  }
  private foundTask(i: number): boolean { const t = this.w.profileOf(i)?.mind?.task as { steps?: { do: string; what?: string }[] } | undefined; return !!t?.steps?.some((s) => s.do === 'clan' && s.what === 'found'); }

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
      if (this.lead(id) > this.lead(c.leader) * 1.05 && this.rel(id, c.leader) < 0 && w.rng.chance(0.05)) { this.callVote(c, `${this.name(id)} challenges the leader`, id); return; }
    }
  }
  /** Open an election: the leader and the 2 most respected members stand (and whoever called it). */
  callVote(c: Clan, why: string, by = -1): boolean {
    const w = this.w, e = w.e;
    if (c.vote || c.members.length < 2) return false;
    const ranked = c.members.filter((x) => x !== c.leader && e.slot(x) >= 0 && this.member(e.slot(x))).sort((a, b) => this.respect(b, c) - this.respect(a, c));
    const cands = [c.leader, ...ranked.slice(0, 2)];
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
  /** Who an AI person votes for: the one they like and respect most (themselves a little, if proud). */
  private choose(voter: number, c: Clan): number {
    const p = this.w.profiles.get(voter), proud = !!p?.personality.some((x) => x === 'proud' || x === 'stubborn');
    let best = c.vote!.cands[0]!, bs = -Infinity;
    for (const k of c.vote!.cands) {
      const v = (k === voter ? (proud ? 1.2 : 0.4) + this.lead(k) : this.rel(voter, k) + this.lead(k) * 1.5 + (this.kin(voter, k) ? 1.5 : 0)) + (k === c.leader ? (this.loyal.get(voter) ?? 0.5) - 0.5 : 0) + this.w.rng.next() * 0.3;
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
    const winner = tied.includes(old) ? old : tied.sort((a, b) => this.respect(b, c) - this.respect(a, c))[0] ?? old;
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
    else if (st && hour >= 5 && hour < 18 && st.food < 4) { text = 'We need food in the store. Collect some and put it there.'; steps = () => [{ do: 'collect', what: 'food', times: 3 }, { do: 'store', what: 'food' }]; }
    else if (st && hour >= 5 && hour < 18 && st.wood < 6) { text = 'Bring wood for the store: fires and walls need it.'; steps = () => [{ do: 'gather', what: 'wood', times: 3 }, { do: 'store', what: 'wood' }]; }
    else return;
    c.order = text; c.orderAt = w.gameSec;
    w.speak(L, `${c.name}! ${text}`);
    let n = 0;
    for (const id of c.members) {
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
    else if (c.members.length) { c.leader = c.members.slice().sort((a, b) => this.respect(b, c) - this.respect(a, c))[0]!; c.vote = undefined; this.w.emit('clanLeader', { clan: c.name, id: c.leader, old: id, why: 'the leader left' }); }
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
    const cands = c.members.filter((id) => id !== c.leader && this.auto(e.slot(id)) && this.rel(id, c.leader) <= 0 && this.lead(id) >= this.lead(c.leader) * 0.85 && (this.loyal.get(id) ?? 0.5) < 0.5 && !this.pending.has(id));
    if (!cands.length || !w.rng.chance(0.15)) return;
    const rebel = cands.sort((a, b) => this.lead(b) - this.lead(a))[0]!;
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
    if (from) { this.addTension(from.id, n.id, 3); w.emit('clanSplit', { from: from.name, clan: n.name, id: rebel }); }
  }

  /** The task skill `clan` (sim/tasks.ts): join who / quit / found / vote who / call. true = done, a string = why not. */
  step(i: number, s: { what?: string; who?: number; phase?: number }, first: boolean): boolean | string {
    const w = this.w, e = w.e, id = e.id(i), b = w.brain;
    const q = (s.what ?? '').toLowerCase().trim();
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
        if (verb === 'call') return this.callVote(c, `${this.name(id)} asked for a vote`, id) || 'a vote is already on';
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
      return this.callVote(mine, `${this.name(id)} asked for a vote`, id) ? { ok: true, code: 'clanVoteOn', clan: this.info(i) } : { ok: false, code: 'clanVoteOn' };
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
    const others = this.clans.filter((x) => x.map === e.map[i] && x.id !== c?.id).map((x) => ({ id: x.id, name: x.name, leader: this.name(x.leader), n: x.members.length, approval: this.approval(x) }));
    const nearReg = w.quests.nearNpc(i, 4) === 'registrar';
    if (!c) return { mine: null, others, nearReg };
    return {
      mine: {
        id: c.id, name: c.name, leader: c.leader, leaderName: this.name(c.leader), me: id, lead: c.leader === id, approval: this.approval(c), loyalty: Math.round(this.loyalty(id) * 100),
        members: c.members.map((x) => ({ id: x, name: this.name(x), respect: Math.round(this.respect(x, c) * 10) / 10 })).sort((a, b) => b.respect - a.respect),
        vote: c.vote ? { end: c.vote.end, why: c.vote.why, cands: c.vote.cands.map((k) => ({ id: k, name: this.name(k) })), my: c.vote.ballots.find(([v]) => v === id)?.[1] ?? -1 } : null,
        result: c.result ? { winner: this.name(c.result.winner), old: this.name(c.result.old), tally: c.result.tally.map(([k, n]) => [this.name(k), n]) } : null,
        order: c.order ?? '', rivals: this.rivals(c).map((r) => ({ name: r.clan.name, tension: Math.round(r.tension) })), now: w.gameSec,
      }, others, nearReg,
    };
  }
  /** The clan line of every prompt about a person. */
  promptText(i: number): string {
    const w = this.w, id = w.e.id(i), c = this.clanOf(id);
    if (!c) { const n = this.clans.filter((x) => x.map === w.e.map[i]).map((x) => x.name); return n.length ? `You are in no clan. Clans here: ${n.join(', ')} (skill clan {"what":"join <name>"}).` : 'There is no clan here yet: Odile the registrar in town founds them (skill clan {"what":"found"}).'; }
    const r = this.rivals(c).map((x) => `${x.clan.name} (tension ${Math.round(x.tension)}/10)`);
    const lead = c.leader === id;
    return `Clan: ${c.name}, ${lead ? 'you are its elected leader (your members follow your orders)' : `led by ${this.name(c.leader)} (elected; approval ${this.approval(c)}%)`}, ${c.members.length} members; your loyalty ${Math.round(this.loyalty(id) * 100)}%.`
      + (c.order ? ` The leader's order: "${c.order}".` : '') + (c.vote ? ` An election is on: ${c.vote.cands.map((k) => this.name(k)).join(' or ')}.` : '')
      + (r.length ? ' Rivals: ' + r.join(', ') + '.' : '') + ' You may quit or change clan (skill clan).';
  }

  // ------------------------------------------------------------------ every second: fights
  update(): void {
    const w = this.w, e = w.e;
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
  private fightsPlayers(i: number): boolean { const r = this.w.profileOf(i); return !!r && r.traits.courage > 0.55; }

  /** A fight starts: `a` goes for `b`. Used by quarrels and when a player hits someone. */
  start(a: number, b: number, why: string): void {
    const w = this.w, e = w.e, ia = e.id(a), ib = e.id(b);
    if (this.duels.has(ia) || this.duels.has(ib)) return;
    const d: Duel = { a: ia, b: ib, start: w.gameSec, hitAt: 0, hurt: [0, 0] };
    this.duels.set(ia, d); if (e.kind[b] === Kind.Agent) this.duels.set(ib, d);
    this.lastAt.set(ia, w.gameSec); this.lastAt.set(ib, w.gameSec);
    this.feel(ia, ib, -1); this.feel(ib, ia, -1);
    const ca = this.clanOf(ia), cb = this.clanOf(ib);
    if (ca && cb && ca.id !== cb.id) this.addTension(ca.id, cb.id, 1);
    w.emit('duel', { a: ia, b: ib, why });
    w.speak(a, why === 'a misunderstanding' ? 'What did you say?!' : 'Enough. Back off!');
  }
  /** A player hit a person: they answer in kind (brave) or give way (timid). */
  hurtBy(victim: number, by: number): void {
    const w = this.w, e = w.e, p = w.profileOf(victim);
    if (!p || e.kind[victim] !== Kind.Agent) return;
    this.feel(e.id(victim), e.id(by), -2);
    const ca = this.clanOf(e.id(victim)), cb = this.clanOf(e.id(by));
    if (ca && cb && ca.id !== cb.id) this.addTension(ca.id, cb.id, 1);
    if (p.traits.courage + p.traits.strength * 0.4 > 0.7 && e.hp[victim]! > 40 && !this.duels.has(e.id(victim))) this.start(victim, by, 'hit first');
  }

  private stepDuel(d: Duel): void {
    const w = this.w, e = w.e, a = e.slot(d.a), b = e.slot(d.b);
    const end = (why: string, loser = -1) => this.end(d, why, loser);
    if (a < 0 || b < 0 || e.map[a] !== e.map[b] || e.map[a] === NO_MAP) return end('gone');
    const dist = Math.hypot(e.x[b]! - e.x[a]!, e.y[b]! - e.y[a]!);
    if (dist > 14) return end('apart');
    if (w.gameSec - d.start > 40) return end('tired out');
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
  }

  // ------------------------------------------------------------------ saving
  save(): unknown { return { clans: this.clans, loyal: [...this.loyal], tense: [...this.tense], nextId: this.nextId, pending: [...this.pending] }; }
  load(s: unknown): void {
    const d = s as { clans?: Clan[]; loyal?: [number, number][]; tense?: [string, number][]; nextId?: number; pending?: [number, { from: number; friends: number[] }][] } | undefined;
    this.clans = d?.clans ?? []; this.loyal = new Map(d?.loyal ?? []); this.tense = new Map(d?.tense ?? []); this.nextId = d?.nextId ?? 1; this.pending = new Map(d?.pending ?? []);
    this.of.clear(); for (const c of this.clans) for (const id of c.members) this.of.set(id, c.id);
    this.duels.clear(); this.nextHour = 0;
  }
}
