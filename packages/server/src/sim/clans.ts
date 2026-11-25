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

export interface Clan { id: number; name: string; map: number; leader: number; members: number[]; hx: number; hy: number; at: number }
interface Duel { a: number; b: number; start: number; hitAt: number; hurt: [number, number] }

const NAMES = ['Ashfall', 'Redhand', 'Ironwood', 'Northgate', 'Stonefield', 'Emberline', 'Greywolves', 'Blackthorn', 'Riverside', 'Highwall', 'Dustwalkers', 'Oakheart', 'Sunrise', 'Nightwatch'];
const HOUR = 3600;

export class Clans {
  clans: Clan[] = [];
  /** Entity id -> clan id. */
  private of = new Map<number, number>();
  /** Loyalty of each member to their clan 0..1. */
  private loyal = new Map<number, number>();
  /** Tension between two clans (key `lo:hi`), 0..10. */
  private tense = new Map<string, number>();
  private duels = new Map<number, Duel>(); // by either id
  private nextId = 1;
  private nextHour = 0;
  private scan = 0;
  private lastAt = new Map<number, number>();
  /** The App says whether a player's character has PvP on. */
  pvpOn: (i: number) => boolean = () => false;
  onChange: () => void = () => {};

  constructor(private w: World) {}

  // ------------------------------------------------------------------ queries
  clanOf(id: number): Clan | undefined { const c = this.of.get(id); return c === undefined ? undefined : this.clans.find((x) => x.id === c); }
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
  private adult(i: number): boolean { const e = this.w.e; return e.kind[i] === Kind.Agent && e.map[i] !== NO_MAP && !(e.flags[i]! & 32); }

  // ------------------------------------------------------------------ hourly: who belongs where
  /** One game hour: clans form, people join and leave, rivals get tenser or calmer. */
  private hourly(): void {
    const w = this.w, e = w.e;
    // Forget the dead; a clan with no leader picks the best member; a clan of one is no clan.
    for (const c of this.clans) {
      c.members = c.members.filter((id) => e.slot(id) >= 0 && this.adult(e.slot(id)));
      if (!c.members.includes(c.leader) && c.members.length) { c.leader = c.members.slice().sort((a, b) => this.lead(b) - this.lead(a))[0]!; w.emit('clanLeader', { clan: c.name, id: c.leader }); }
    }
    for (const c of this.clans.filter((x) => x.members.length < 2)) { for (const id of c.members) this.of.delete(id); w.emit('clanEnd', { clan: c.name }); }
    this.clans = this.clans.filter((x) => x.members.length >= 2);
    for (const [id, cid] of this.of) if (!this.clans.some((c) => c.id === cid && c.members.includes(id))) this.of.delete(id);

    for (let m = 0; m < w.maps.length; m++) {
      const adults: number[] = [];
      for (let i = 0; i < e.hi; i++) if (e.map[i] === m && this.adult(i)) adults.push(e.id(i));
      if (adults.length < 3) continue;
      const here = this.clans.filter((c) => c.map === m);
      // Founding: the map's leader starts a clan, most others join by liking.
      if (!here.length) {
        const lid = w.survival.leader[m] ?? -1;
        if (lid >= 0 && e.slot(lid) >= 0) this.found(m, lid, adults.filter((id) => id !== lid && this.rel(id, lid) >= -1 && !this.kin(id, lid) || this.kin(id, lid)));
      }
      // The unaligned (new adults, the ones who left) look for a clan: best feeling for its leader and members, family first.
      for (const id of adults) {
        if (this.of.has(id)) continue;
        let best: Clan | undefined, bs = -0.5;
        for (const c of this.clans.filter((x) => x.map === m)) {
          const mem = c.members.filter((x) => x !== c.leader);
          const s = this.rel(id, c.leader) + (mem.length ? mem.reduce((a, x) => a + this.rel(id, x), 0) / mem.length : 0) * 0.5 + (c.members.some((x) => this.kin(id, x)) ? 2 : 0) + (w.profiles.get(id)?.personality.includes('loyal') ? 0.5 : 0);
          if (s > bs) { bs = s; best = c; }
        }
        if (best) this.join(best, id, 0.5);
      }
      // Loyalty follows feelings; a very unhappy member leaves; a strong rival of the leader may split off.
      for (const c of this.clans.filter((x) => x.map === m)) {
        for (const id of c.members.slice()) {
          if (id === c.leader) continue;
          const f = this.rel(id, c.leader) + (this.kin(id, c.leader) ? 1.5 : 0) + (w.profiles.get(id)?.personality.includes('loyal') ? 1 : 0);
          const l = Math.max(0, Math.min(1, (this.loyal.get(id) ?? 0.5) + f * 0.03 - 0.005));
          this.loyal.set(id, l);
          if (l < 0.12 && f < -0.5) this.leave(c, id, 'lost faith in the leader');
        }
        const adultsIn = c.members.length;
        if (adultsIn >= 6 && this.clans.filter((x) => x.map === m).length < 3) this.maybeSplit(c);
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

  private found(m: number, leader: number, members: number[], home?: { x: number; y: number }): Clan {
    const w = this.w, e = w.e, used = new Set(this.clans.map((c) => c.name));
    const name = NAMES.find((n) => !used.has(n)) ?? `Clan ${this.nextId}`;
    const L = e.slot(leader), camp = w.survival.campOf(m);
    const c: Clan = { id: this.nextId++, name, map: m, leader, members: [], hx: home?.x ?? camp?.x ?? e.x[L]!, hy: home?.y ?? camp?.y ?? e.y[L]!, at: w.gameSec };
    this.clans.push(c);
    this.join(c, leader, 1);
    for (const id of members) if (!this.of.has(id) && id !== leader) this.join(c, id, 0.5 + Math.max(0, this.rel(id, leader)) * 0.08);
    w.emit('clan', { clan: name, leader, n: c.members.length, map: w.maps[m]!.def.id });
    return c;
  }
  private join(c: Clan, id: number, loyal: number): void { if (!c.members.includes(id)) c.members.push(id); this.of.set(id, c.id); this.loyal.set(id, Math.min(1, loyal)); }
  private leave(c: Clan, id: number, why: string): void {
    c.members = c.members.filter((x) => x !== id); this.of.delete(id); this.loyal.delete(id);
    this.w.emit('clanLeave', { clan: c.name, id, why });
    this.feel(id, c.leader, -0.5);
  }
  /** A strong member who does not like the leader takes friends and goes: a rival clan, with a home of its own. */
  private maybeSplit(c: Clan): void {
    const w = this.w, e = w.e;
    const cands = c.members.filter((id) => id !== c.leader && this.rel(id, c.leader) <= 0 && this.lead(id) >= this.lead(c.leader) * 0.85 && (this.loyal.get(id) ?? 0.5) < 0.5);
    if (!cands.length || !w.rng.chance(0.15)) return;
    const rebel = cands.sort((a, b) => this.lead(b) - this.lead(a))[0]!;
    const friends = c.members.filter((id) => id !== rebel && id !== c.leader && (this.kin(id, rebel) || this.rel(id, rebel) > this.rel(id, c.leader) + 0.5)).slice(0, Math.floor(c.members.length / 2) - 1);
    if (!friends.length) return;
    const R = e.slot(rebel), ang = w.rng.next() * Math.PI * 2;
    const spot = w.freeSpot(c.map, e.x[R]! + Math.cos(ang) * 22, e.y[R]! + Math.sin(ang) * 22, 12) ?? { x: e.x[R]!, y: e.y[R]! };
    for (const id of [rebel, ...friends]) { c.members = c.members.filter((x) => x !== id); this.of.delete(id); }
    const n = this.found(c.map, rebel, friends, spot);
    this.addTension(c.id, n.id, 3);
    for (const id of friends) this.feel(id, c.leader, -0.4);
    w.emit('clanSplit', { from: c.name, clan: n.name, id: rebel });
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
  save(): unknown { return { clans: this.clans, loyal: [...this.loyal], tense: [...this.tense], nextId: this.nextId }; }
  load(s: unknown): void {
    const d = s as { clans?: Clan[]; loyal?: [number, number][]; tense?: [string, number][]; nextId?: number } | undefined;
    this.clans = d?.clans ?? []; this.loyal = new Map(d?.loyal ?? []); this.tense = new Map(d?.tense ?? []); this.nextId = d?.nextId ?? 1;
    this.of.clear(); for (const c of this.clans) for (const id of c.members) this.of.set(id, c.id);
    this.duels.clear(); this.nextHour = 0;
  }
}
