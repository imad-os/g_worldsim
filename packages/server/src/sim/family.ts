/**
 * Families (imad 2026-11-25: "children under 3 can't walk or do their needs on their own; parents provide and protect them;
 * a 1 year old can't say words; kids grow knowing their family and siblings; a player can choose another player as their
 * kid, sibling or parent, and marriage must know it").
 *
 * - Who is family: blood (`Profile.parents`) plus family roles chosen between players (`Profile.kin`, '#<id>' -> what that
 *   person is to me). `close()` = may never marry or have a child together (parents, children, brothers and sisters, half
 *   ones too, grandparents, aunts / uncles, nieces / nephews).
 * - Little ones (under `TODDLER` = 3 years) are dependents: they never fetch water or food, go nowhere on their own and only
 *   sleep, cry and toddle next to their carer (a parent first, else family, else the kindest grown-up near). Babies (under 1)
 *   are carried in arms; toddlers walk at their carer's feet and are picked up when the carer walks off or danger comes.
 *   The carer feeds them (carried food or from the camp's store), takes them to water and protects them; a player who is a
 *   parent does it by hand from the TV (Do `care`), and when a player lets it slide too far, family or a neighbour helps.
 * - How children talk grows with age (`kidTalk`): crying and babbling, then single words, then two or three words, then
 *   short simple sentences (the AI is told how a child of that age speaks).
 */
import { Act, EFlag, Kind } from '@worldsim/protocol';
import { NO_MAP } from './entities.js';
import { ageOf, PLAYER_AGE, type Profile } from './people.js';
import type { World } from './world.js';

export const BABY = 1;
/** A new mother stays home this many game days with her newborn (imad 2026-11-26: "it must stay home for the game week"). */
export const LYING_IN_DAYS = 7;
/** The fridge of a home with a newborn is kept at least this full (food, water) by the father. */
const KEEP_FOOD = 4, KEEP_WATER = 3;
export const TODDLER = 3;
export type Stage = 'baby' | 'toddler' | 'child' | 'teen' | 'adult';
export function stageOf(age: number): Stage { return age < BABY ? 'baby' : age < TODDLER ? 'toddler' : age < 14 ? 'child' : age < 16 ? 'teen' : 'adult'; }

/** What another person is to me, by choice (players): kept on both sides, each as seen from that side. */
export type Role = 'parent' | 'child' | 'sibling';
export const ROLES: Role[] = ['parent', 'child', 'sibling'];
const INVERSE: Record<Role, Role> = { parent: 'child', child: 'parent', sibling: 'sibling' };
/** A little one's need above this: the carer sees to it. */
const NEED = 45;
/** A player-parent let it get this far: someone else helps. */
const NEGLECT = 75;

export interface KinAsk { from: number; to: number; role: Role; at: number }

export class Family {
  /** Per slot: who looks after this little one (slot, -1 none) and who holds it in their arms (slot, -1 = on the ground). */
  readonly carer: Int32Array;
  readonly carried: Int32Array;
  /** Family role requests waiting for an answer (player to player), memory only. */
  asks: KinAsk[] = [];
  /** Food and water each grown-up gave children lately (entity id -> count, halved every game day): the parent who gave less goes next. */
  readonly given = new Map<number, number>();
  private nextHour = 0;
  private nextDay = 0;

  constructor(private w: World) {
    this.carer = new Int32Array(w.e.cap).fill(-1);
    this.carried = new Int32Array(w.e.cap).fill(-1);
    w.listeners.push((ev) => { if (ev.kind === 'birth') { this.born(Number(ev.data.id)); this.startLyingIn(Number(ev.data.mother), Number(ev.data.id)); } });
  }

  // ------------------------------------------------------------------ who is family
  private prof(id: number): Profile | undefined { return this.w.profiles.get(id); }
  private roleOf(a: number, b: number): Role | undefined { return this.prof(a)?.kin?.['#' + b]; }
  /** Parents by blood and by choice. */
  parentsOf(id: number): number[] {
    const p = this.prof(id); if (!p) return [];
    const out = [...p.parents];
    for (const [k, r] of Object.entries(p.kin ?? {})) if (r === 'parent') { const x = Number(k.slice(1)); if (!out.includes(x)) out.push(x); }
    return out;
  }
  childrenOf(id: number): number[] {
    const out: number[] = [];
    for (const [cid, q] of this.w.profiles) if (q.parents.includes(id)) out.push(cid);
    for (const [k, r] of Object.entries(this.prof(id)?.kin ?? {})) if (r === 'child') { const x = Number(k.slice(1)); if (!out.includes(x)) out.push(x); }
    return out;
  }
  siblingsOf(id: number): number[] {
    const out = new Set<number>(), mine = this.parentsOf(id);
    for (const pid of mine) for (const c of this.childrenOf(pid)) if (c !== id) out.add(c);
    for (const [k, r] of Object.entries(this.prof(id)?.kin ?? {})) if (r === 'sibling') out.add(Number(k.slice(1)));
    return [...out];
  }
  /** What b is to a, in words ('' = not family). */
  relation(a: number, b: number): string {
    if (a === b) return '';
    const p = this.prof(a), q = this.prof(b);
    if (!p || !q) return '';
    const her = q.sex === 'f';
    if (p.partner === b) return her ? 'wife' : 'husband';
    const pa = this.parentsOf(a), pb = this.parentsOf(b);
    if (pa.includes(b)) return her ? 'mother' : 'father';
    if (pb.includes(a)) return her ? 'daughter' : 'son';
    if (this.siblingsOf(a).includes(b)) return her ? 'sister' : 'brother';
    if (pa.some((x) => this.parentsOf(x).includes(b))) return her ? 'grandmother' : 'grandfather';
    if (pb.some((x) => this.parentsOf(x).includes(a))) return her ? 'granddaughter' : 'grandson';
    if (pa.some((x) => this.siblingsOf(x).includes(b))) return her ? 'aunt' : 'uncle';
    if (pb.some((x) => this.siblingsOf(x).includes(a))) return her ? 'niece' : 'nephew';
    return '';
  }
  /** Too close to marry or have children together. */
  close(a: number, b: number): boolean { const r = this.relation(a, b); return !!r && r !== 'wife' && r !== 'husband'; }
  /** Family at all (partner included): for clans and loyalty. */
  related(a: number, b: number): boolean { return !!this.relation(a, b); }

  /** Choose what b is to a (null = no longer). True, or why not. Both sides are kept. */
  setRole(a: number, b: number, role: Role | null): true | string {
    const p = this.prof(a), q = this.prof(b);
    if (!p || !q || a === b) return 'no such person';
    if (role && !ROLES.includes(role)) return 'unknown role';
    if (role && (p.partner === b || q.partner === a)) return `you are married to ${q.name}: divorce first`;
    if (role === 'parent' && this.parentsOf(a).filter((x) => x !== b).length >= 2) return `${p.name} already has two parents`;
    if (role === 'child' && this.parentsOf(b).filter((x) => x !== a).length >= 2) return `${q.name} already has two parents`;
    p.kin ??= {}; q.kin ??= {};
    if (!role) { delete p.kin['#' + b]; delete q.kin['#' + a]; }
    else { p.kin['#' + b] = role; q.kin['#' + a] = INVERSE[role]; }
    this.feel(a, b, role ? 2 : 0); this.feel(b, a, role ? 2 : 0);
    this.w.emit('kin', { a, b, role: role ?? '' });
    return true;
  }
  /** A player asks another to be their child / sibling / parent; the other answers from their TV. */
  ask(from: number, to: number, role: Role): true | string {
    if (!this.prof(from) || !this.prof(to) || from === to) return 'no such person';
    if (this.roleOf(from, to) === role) return 'already';
    this.asks = this.asks.filter((x) => !(x.from === from && x.to === to)).concat({ from, to, role, at: Date.now() });
    if (this.asks.length > 200) this.asks.splice(0, this.asks.length - 200);
    return true;
  }
  answer(to: number, from: number, yes: boolean): true | string {
    const k = this.asks.findIndex((x) => x.to === to && x.from === from);
    if (k < 0) return 'no such request';
    const r = this.asks[k]!; this.asks.splice(k, 1);
    return yes ? this.setRole(r.from, r.to, r.role) : true;
  }

  // ------------------------------------------------------------------ little ones
  ageOf(i: number): number { const p = this.w.profileOf(i); return p ? (p.player ? PLAYER_AGE : ageOf(p, this.w.gameSec, this.w.yearSec)) : 99; }
  /** A person under 3 (never a player's character). */
  dependent(i: number): boolean {
    const e = this.w.e, p = this.w.profileOf(i);
    return !!p && !p.player && e.kind[i] === Kind.Agent && e.map[i] !== NO_MAP && ageOf(p, this.w.gameSec, this.w.yearSec) < TODDLER;
  }
  /** The little ones a carer (slot) looks after now. */
  kidsOf(c: number): number[] {
    const e = this.w.e, out: number[] = [];
    for (let i = 0; i < e.hi; i++) if (this.carer[i] === c && this.dependent(i)) out.push(i);
    return out;
  }
  /** Played by hand right now (online, not on autopilot): a player-parent does the caring from the TV. */
  private byHand(j: number): boolean { return this.w.e.kind[j] === Kind.Player && !this.w.away.has(this.w.e.id(j)); }
  private awakeAdult(j: number, m: number): boolean {
    const e = this.w.e;
    if (e.map[j] !== m || (e.kind[j] !== Kind.Agent && e.kind[j] !== Kind.Player) || this.w.away.has(e.id(j))) return false;
    return this.ageOf(j) >= 14 && !this.dependent(j);
  }
  /** Mother first, then father (AI or a player), then grown family, then the kindest grown-up within 60 m. A player-parent who
   *  lets a need pass NEGLECT gets help from someone the AI drives. */
  private chooseCarer(i: number): number {
    const w = this.w, e = w.e, m = e.map[i]!, id = e.id(i);
    const worst = Math.max(e.hunger[i]!, e.thirst[i]!);
    const ok = (j: number) => j >= 0 && this.awakeAdult(j, m) && !(worst > NEGLECT && this.byHand(j));
    const parents = this.parentsOf(id).map((x) => e.slot(x)).filter(ok);
    parents.sort((a, b) => (w.profileOf(a)?.sex === 'f' ? 0 : 1) - (w.profileOf(b)?.sex === 'f' ? 0 : 1) + (this.byHand(a) ? 0.5 : 0) - (this.byHand(b) ? 0.5 : 0));
    if (parents.length) return parents[0]!;
    const fam = [...this.siblingsOf(id), ...this.parentsOf(id).flatMap((x) => [...this.parentsOf(x), ...this.siblingsOf(x)])].map((x) => e.slot(x)).filter(ok);
    if (fam.length) return fam[0]!;
    let best = -1, bs = -1;
    for (let j = 0; j < e.hi; j++) {
      if (j === i || e.kind[j] !== Kind.Agent || !this.awakeAdult(j, m) || this.dependent(j)) continue;
      const d = Math.hypot(e.x[j]! - e.x[i]!, e.y[j]! - e.y[i]!);
      if (d > 60) continue;
      const clan = this.parentsOf(id).some((p) => { const c = w.clans.clanOf(p); return !!c && c === w.clans.clanOf(e.id(j)); });
      const s = (w.profileOf(j)?.traits.empathy ?? 0.5) * 2 - d / 60 + (w.profileOf(j)?.sex === 'f' ? 0.2 : 0) + (clan ? 0.6 : 0);
      if (s > bs) { bs = s; best = j; }
    }
    return best;
  }

  /** Every second (20 ticks): who looks after each little one, who holds them, how they feel about their family. */
  update(): void {
    const w = this.w, e = w.e;
    for (let i = 0; i < e.hi; i++) {
      if (!this.dependent(i)) { if (this.carried[i]! >= 0) this.putDown(i); this.carer[i] = -1; continue; }
      const old = this.carer[i]!;
      const keep = old >= 0 && this.awakeAdult(old, e.map[i]!) && this.parentsOf(e.id(i)).includes(e.id(old)) && !(Math.max(e.hunger[i]!, e.thirst[i]!) > NEGLECT && this.byHand(old));
      const c = keep ? old : this.chooseCarer(i);
      if (c !== old && this.carried[i]! >= 0) this.putDown(i);
      this.carer[i] = c;
      if (c < 0) continue;
      const d = Math.hypot(e.x[c]! - e.x[i]!, e.y[c]! - e.y[i]!), age = this.ageOf(i);
      const held = this.carried[i]! >= 0;
      // A player-parent picks up and puts down by hand (Do care carry); the AI does it by itself.
      if (this.byHand(c)) continue;
      const moving = (e.flags[c]! & EFlag.Moving) !== 0 || e.act[c] === Act.Flee || e.act[c] === Act.Fight;
      const danger = w.zombies.nearest(e.map[i]!, e.x[i]!, e.y[i]!, 12) >= 0 || (e.kind[c] === Kind.Agent && w.brain.tactics.alert(c));
      if (!held && d <= 1.8 && (age < BABY || moving || danger)) this.pickUp(i, c);
      else if (held && age >= BABY && !moving && !danger && e.act[c] !== Act.Sleep) this.putDown(i);
    }
    if (this.nextHour === 0) this.nextHour = w.gameSec + 3600;
    if (w.gameSec >= this.nextHour) { this.nextHour = w.gameSec + 3600; this.hourly(); this.provide(); }
    if (this.nextDay === 0) this.nextDay = w.gameSec + 86400;
    if (w.gameSec >= this.nextDay) { this.nextDay = w.gameSec + 86400; for (const [k, v] of this.given) if (v < 1) this.given.delete(k); else this.given.set(k, v / 2); }
  }

  // ------------------------------------------------------------------ a week at home after a birth (imad 2026-11-26)
  /**
   * "When the mother gives birth, she must stay home for the game week to take care of him and get out only for urgent actions,
   * no walking or standing outside, and the father must provide water and food to the fridge."
   * The mother (AI-driven) keeps to her home: no wandering, talks, travel, work or quests (Tasks.start and Survival.begin refuse
   * them, Brain.choose leaves only rest, sleep and the fridge); she goes out only when it is urgent (danger, the cold, thirst
   * past 80 or hunger past 85 with an empty fridge). The father (else grown family) keeps the home's fridge stocked.
   */
  private startLyingIn(mid: number, baby: number): void {
    const w = this.w, p = this.prof(mid);
    if (!p || p.player) return; // a player's character is played by hand: their own choice
    p.lyingIn = { until: w.gameSec + LYING_IN_DAYS * 86400, baby };
    const i = w.e.slot(mid);
    if (i >= 0 && this.lyingInHome(i) && p.mind?.task && p.mind.task.from !== 'owner') w.tasks.stop(i); // the work waits: home with the baby
    w.emit('lyingIn', { id: mid, baby, days: LYING_IN_DAYS });
  }
  /** Person (slot) i is a mother in her week at home with a newborn (AI-driven, the baby alive). */
  lyingIn(i: number): boolean {
    const w = this.w, e = w.e;
    if (i < 0 || e.kind[i] !== Kind.Agent) return false;
    const p = w.profileOf(i), l = p?.lyingIn;
    if (!l) return false;
    if (w.gameSec >= l.until || e.slot(l.baby) < 0) { delete p!.lyingIn; return false; }
    return true;
  }
  /** Her home on the map she is on (lying-in only means something there), or undefined. */
  lyingInHome(i: number): import('./homes.js').Home | undefined {
    if (!this.lyingIn(i)) return undefined;
    const h = this.w.survival.homes.homeOf(this.w.e.id(i));
    return h && h.m === this.w.e.map[i] ? h : undefined;
  }
  /** Urgent enough to step out: thirst past 80 (no water in the fridge) or hunger past 85 (no food in it). */
  urgentOut(i: number): boolean {
    const e = this.w.e, sv = this.w.survival;
    return (e.thirst[i]! > 80 && sv.myBox(i, 'fridge', 60, 'water') < 0) || (e.hunger[i]! > 85 && sv.myBox(i, 'fridge', 60, 'food') < 0 && e.carry[i]! <= 0);
  }
  /** Game hours of the lying-in left (-1 = none): the panel / prompts. */
  lyingInLeft(id: number): number {
    const p = this.prof(id), l = p?.lyingIn;
    return l && l.until > this.w.gameSec ? (l.until - this.w.gameSec) / 3600 : -1;
  }
  /** Every game hour: the father (else grown family) fills the fridge of every home with a lying-in mother. */
  private provide(): void {
    const w = this.w, e = w.e, sv = w.survival;
    for (let i = 0; i < e.hi; i++) {
      const h = this.lyingInHome(i);
      if (!h) continue;
      const p = w.profileOf(i)!, f = sv.boxIn(h, 'fridge'), inv = f >= 0 ? sv.box(h.m, f) : {};
      const food = inv.food ?? 0, water = inv.water ?? 0;
      if (f >= 0 && food >= KEEP_FOOD && water >= KEEP_WATER) continue;
      const fid = p.lyingIn ? this.parentsOf(p.lyingIn.baby).find((x) => x !== e.id(i)) : undefined;
      const cands = [fid ?? p.partner, ...this.childrenOf(e.id(i)), ...this.parentsOf(e.id(i)), ...this.siblingsOf(e.id(i))];
      let j = -1;
      for (const id of cands) {
        if (id === undefined || id < 0) continue;
        const k = e.slot(id);
        if (k < 0 || k === i || e.kind[k] !== Kind.Agent || e.map[k] !== h.m || this.dependent(k) || this.ageOf(k) < 14 || this.lyingIn(k)) continue;
        if (e.act[k] === Act.Sleep || e.act[k] === Act.Fight || e.act[k] === Act.Flee || e.thirst[k]! > 85 || e.hunger[k]! > 90) continue;
        const t = w.profileOf(k)?.mind?.task;
        if (t && (t.from === 'owner' || t.rule || /fridge/.test(t.text))) continue;
        if (t && [...w.profiles.values()].some((q) => q.player && q.player === t.from)) continue; // a player's order comes first
        j = k; break;
      }
      if (j < 0) continue;
      const steps: Parameters<typeof w.tasks.start>[3] = [];
      if (f < 0) steps.push({ do: 'build', what: 'fridge' });
      if (food < KEEP_FOOD) steps.push({ do: 'collect', what: 'food', times: 3 }, { do: 'store', what: 'food' });
      if (water < KEEP_WATER) steps.push({ do: 'store', what: 'water' });
      if (w.tasks.start(j, `fill the fridge for ${p.name} and the baby`, 'myself', steps)) w.emit('care', { id: e.id(j), kid: p.lyingIn!.baby, what: 'fridge', mother: e.id(i) });
    }
  }

  // ------------------------------------------------------------------ both parents provide (imad 2026-11-26: "both parents must be responsible")
  private gave(c: number): void { const id = this.w.e.id(c); this.given.set(id, (this.given.get(id) ?? 0) + 1); }
  /** A parent free to see to a child now: grown, awake, on their feet, not in a fight, on the map within 60 m, driven by the AI. */
  private free(j: number, k: number): boolean {
    const e = this.w.e;
    if (j < 0 || !this.awakeAdult(j, e.map[k]!) || this.byHand(j) || e.kind[j] !== Kind.Agent) return false;
    if (e.flags[j]! & EFlag.Sleeping || e.act[j] === Act.Fight || e.act[j] === Act.Flee || e.act[j] === Act.Sleep) return false;
    if (e.thirst[j]! > 85 || e.hunger[j]! > 90) return false;
    return Math.hypot(e.x[j]! - e.x[k]!, e.y[j]! - e.y[k]!) < 60;
  }
  /** Whose turn it is to feed / water child k: of the free parents, the one who gave less (the one already with it on a tie); -1 = nobody free. */
  provider(k: number): number {
    const e = this.w.e, near = this.carer[k]!;
    const mum = e.slot(this.prof(e.id(k))?.parents[0] ?? -1);
    if (mum >= 0 && this.prof(e.id(mum))?.lyingIn?.baby === e.id(k) && this.lyingIn(mum) && this.free(mum, k)) return mum; // her week at home: she has it
    let best = -1, bs = Infinity;
    for (const pid of this.parentsOf(e.id(k))) {
      const j = e.slot(pid);
      if (!this.free(j, k)) continue;
      const s = (this.given.get(pid) ?? 0) - (j === near ? 0.5 : 0) + Math.hypot(e.x[j]! - e.x[k]!, e.y[j]! - e.y[k]!) / 200;
      if (s < bs) { bs = s; best = j; }
    }
    return best;
  }
  /** Older children (3-13) of c on this map within 50 m who are hungry, when c has food to bring them; also a clan member's child
   *  whose parents are not around, for a kind person. The hungriest, or -1. */
  hungryKid(c: number): number {
    const w = this.w, e = w.e;
    if (e.carry[c]! <= 0) return -1;
    const me = e.id(c), mine = new Set(this.childrenOf(me)), clan = w.clans.clanOf(me), kind = (w.profileOf(c)?.traits.empathy ?? 0.5) > 0.6;
    let best = -1, top = 60;
    for (let k = 0; k < e.hi; k++) {
      if (e.kind[k] !== Kind.Agent || e.map[k] !== e.map[c] || this.dependent(k) || e.hunger[k]! <= top || e.carry[k]! > 0) continue;
      const age = this.ageOf(k);
      if (age < TODDLER || age >= 14 || Math.hypot(e.x[k]! - e.x[c]!, e.y[k]! - e.y[c]!) > 50) continue;
      const id = e.id(k);
      if (mine.has(id)) { if (this.provider(k) !== c) continue; }
      else if (!(kind && clan && e.hunger[k]! > 75 && this.parentsOf(id).some((p) => w.clans.clanOf(p) === clan) && this.provider(k) < 0)) continue;
      top = e.hunger[k]!; best = k;
    }
    return best;
  }
  /** Hand one food to child k (within 2.5 m). */
  bring(c: number, k: number): boolean {
    const e = this.w.e;
    if (e.carry[c]! <= 0 || Math.hypot(e.x[k]! - e.x[c]!, e.y[k]! - e.y[c]!) > 2.5) return false;
    e.carry[c]!--; e.carry[k]!++;
    this.gave(c);
    this.w.emit('care', { id: e.id(c), kid: e.id(k), what: 'food', brought: true });
    return true;
  }
  pickUp(i: number, c: number): void {
    const w = this.w, e = w.e;
    this.carried[i] = c;
    e.flags[i] = e.flags[i]! | EFlag.Carried;
    w.bodyOn(i, false);
  }
  putDown(i: number): void {
    const w = this.w, e = w.e, c = this.carried[i]!;
    this.carried[i] = -1;
    e.flags[i] = e.flags[i]! & ~EFlag.Carried;
    if (c >= 0 && e.map[i] !== NO_MAP) {
      const s = w.freeSpot(e.map[i]!, e.x[c]! + Math.cos(e.angle[c]! + 1.3) * 0.7, e.y[c]! + Math.sin(e.angle[c]! + 1.3) * 0.7, 3);
      if (s) w.setPos(i, s.x, s.y);
    }
    w.bodyOn(i, true);
  }
  /** Every tick, after physics: little ones in arms go where their carer goes. */
  carry(): void {
    const w = this.w, e = w.e;
    for (let i = 0; i < e.hi; i++) {
      const c = this.carried[i]!;
      if (c < 0) continue;
      if (e.kind[i] !== Kind.Agent || e.kind[c] === Kind.None || e.map[c] !== e.map[i]) { this.putDown(i); continue; }
      const a = e.angle[c]! + 0.9;
      w.setPos(i, e.x[c]! + Math.cos(a) * 0.28, e.y[c]! + Math.sin(a) * 0.28);
      e.angle[i] = e.angle[c]!; e.vx[i] = e.vx[c]!; e.vy[i] = e.vy[c]!;
    }
  }
  /** The carer just drank: the little ones with them drink too. */
  drank(c: number): void {
    const e = this.w.e;
    for (const k of this.kidsOf(c)) if (Math.hypot(e.x[k]! - e.x[c]!, e.y[k]! - e.y[c]!) < 3) { if (e.thirst[k]! > 20) this.gave(c); e.thirst[k] = 0; this.w.emit('care', { id: e.id(c), kid: e.id(k), what: 'water' }); }
  }
  /** The carer has food and a hungry little one close: feed it. True = fed one. */
  feed(c: number): boolean {
    const e = this.w.e;
    for (const k of this.kidsOf(c)) {
      if (e.hunger[k]! < NEED || e.carry[c]! <= 0 || Math.hypot(e.x[k]! - e.x[c]!, e.y[k]! - e.y[c]!) > 3) continue;
      e.carry[c]!--; e.hunger[k] = Math.max(0, e.hunger[k]! - 50);
      this.gave(c);
      this.w.emit('care', { id: e.id(c), kid: e.id(k), what: 'food' });
      return true;
    }
    return false;
  }
  /** What the carer should see to first for their little ones: 'water' | 'food' | 'fetch' (go to them) | ''. */
  duty(c: number): { what: '' | 'water' | 'food' | 'fetch' | 'bring'; kid: number } {
    const e = this.w.e;
    // My child in need and it is my turn (the other parent gave more): I take it over from them.
    if (e.kind[c] === Kind.Agent) for (const cid of this.childrenOf(e.id(c))) {
      const k = e.slot(cid);
      if (k < 0 || this.carer[k] === c || !this.dependent(k) || Math.max(e.hunger[k]!, e.thirst[k]!) <= NEED || this.provider(k) !== c) continue;
      const old = this.carer[k]!;
      if (old >= 0 && e.kind[old] === Kind.Agent && this.free(old, k) && (this.given.get(e.id(old)) ?? 0) <= (this.given.get(e.id(c)) ?? 0)) continue;
      if (this.carried[k]! >= 0) this.putDown(k);
      this.carer[k] = c;
      this.w.emit('care', { id: e.id(c), kid: cid, what: 'turn', from: old >= 0 ? e.id(old) : -1 });
    }
    let what: '' | 'water' | 'food' | 'fetch' | 'bring' = '', kid = -1, top = NEED;
    for (const k of this.kidsOf(c)) {
      const d = Math.hypot(e.x[k]! - e.x[c]!, e.y[k]! - e.y[c]!);
      if (this.carried[k]! < 0 && d > (this.ageOf(k) < BABY ? 1.5 : 5)) { if (what !== 'fetch' || d > top) { what = 'fetch'; kid = k; top = 1e9; } continue; }
      if (what === 'fetch') continue;
      const pv = this.provider(k);
      if (pv >= 0 && pv !== c && this.parentsOf(e.id(k)).includes(e.id(c))) continue; // the other parent's turn: they come and take it
      if (e.thirst[k]! > top) { what = 'water'; kid = k; top = e.thirst[k]!; }
      if (e.hunger[k]! > top) { what = 'food'; kid = k; top = e.hunger[k]!; }
    }
    if (!what) { const k = this.hungryKid(c); if (k >= 0) return { what: 'bring', kid: k }; }
    return { what, kid };
  }
  /** Needs a carer has to meet for someone else: they keep found food instead of eating it. */
  wantsFood(c: number): boolean {
    const e = this.w.e;
    if (this.kidsOf(c).some((k) => e.hunger[k]! > NEED - 15)) return true;
    // Older children of mine who are hungry, when it is my turn to provide.
    return this.childrenOf(e.id(c)).some((cid) => { const k = e.slot(cid); return k >= 0 && e.map[k] === e.map[c] && !this.dependent(k) && this.ageOf(k) < 14 && e.hunger[k]! > 55 && this.provider(k) === c; });
  }

  /** A player-parent cares by hand (Do care "what:id"): feed, water (near water), carry / put down, bed. */
  care(c: number, what: string, kid: number): { ok: boolean; code: string } {
    const w = this.w, e = w.e, k = e.slot(kid);
    if (k < 0 || !this.dependent(k)) return { ok: false, code: 'kidNone' };
    if (!this.parentsOf(kid).includes(e.id(c)) && this.carer[k] !== c) return { ok: false, code: 'kidNotMine' };
    if (Math.hypot(e.x[k]! - e.x[c]!, e.y[k]! - e.y[c]!) > 3) return { ok: false, code: 'kidFar' };
    this.carer[k] = c;
    switch (what) {
      case 'feed':
        if (e.carry[c]! <= 0) return { ok: false, code: 'noFood' };
        e.carry[c]!--; e.hunger[k] = Math.max(0, e.hunger[k]! - 50);
        w.emit('care', { id: e.id(c), kid, what: 'food' }); return { ok: true, code: 'kidFed' };
      case 'water':
        if (!w.brain.nearWater(e.map[c]!, e.x[c]!, e.y[c]!)) return { ok: false, code: 'noWater' };
        e.thirst[k] = 0; w.emit('care', { id: e.id(c), kid, what: 'water' }); return { ok: true, code: 'kidWater' };
      case 'carry':
        if (this.carried[k]! >= 0) { this.putDown(k); return { ok: true, code: 'kidDown' }; }
        this.pickUp(k, c); return { ok: true, code: 'kidUp' };
      case 'bed':
        e.act[k] = Act.Sleep; e.flags[k] = e.flags[k]! | EFlag.Sleeping; e.nextThink[k] = w.tick + 60;
        return { ok: true, code: 'kidBed' };
    }
    return { ok: false, code: 'nothing' };
  }

  /** A child of mine (under 14) a zombie or a wild animal is near: that zombie / animal slot, or -1. */
  threatToMine(c: number): number {
    const w = this.w, e = w.e, m = e.map[c]!;
    for (const cid of this.childrenOf(e.id(c))) {
      const k = e.slot(cid);
      if (k < 0 || e.map[k] !== m || this.ageOf(k) >= 14 || Math.hypot(e.x[k]! - e.x[c]!, e.y[k]! - e.y[c]!) > 40) continue;
      const z = w.zombies.nearest(m, e.x[k]!, e.y[k]!, 9);
      if (z >= 0) return z;
      const a = w.animals.attacker(k);
      if (a >= 0) return a;
    }
    return -1;
  }

  /**
   * A child (under 14) of someone in my clan is in danger near me (25 m): the zombie / beast, or -1. Not like a parent: only people
   * kind or brave enough care (empathy x 0.6 + courage x 0.4 > 0.45), and only against a few: up to 1-4 attackers by the same
   * traits, never 5 or more (imad 2026-11-26: "clan members feel responsible too, by empathy and courage, but can't face 10
   * zombies to save someone else's kids").
   */
  threatToClanKid(c: number): number {
    const w = this.w, e = w.e, m = e.map[c]!, me = e.id(c), clan = w.clans.clanOf(me);
    if (!clan || this.ageOf(c) < 16) return -1;
    const t = w.profileOf(c)?.traits, care = (t?.empathy ?? 0.5) * 0.6 + (t?.courage ?? 0.5) * 0.4;
    if (care <= 0.45) return -1;
    const most = Math.min(4, 1 + Math.floor((care - 0.45) * 8));
    const mine = this.childrenOf(me);
    for (let k = 0; k < e.hi; k++) {
      if (e.kind[k] !== Kind.Agent || e.map[k] !== m || this.ageOf(k) >= 14 || Math.hypot(e.x[k]! - e.x[c]!, e.y[k]! - e.y[c]!) > 25) continue;
      const kid = e.id(k);
      if (mine.includes(kid) || !this.parentsOf(kid).some((p) => w.clans.clanOf(p) === clan)) continue;
      const z = w.zombies.nearest(m, e.x[k]!, e.y[k]!, 7);
      const a = z >= 0 ? z : w.animals.attacker(k);
      if (a < 0) continue;
      if (w.brain.tactics.threats(m, e.x[k]!, e.y[k]!, 8).length > most) continue; // too many: not for someone else's child
      return a;
    }
    return -1;
  }

  /** The TV's family page: my little ones' needs, and every child's age. */
  kidsInfo(c: number): { id: number; name: string; age: number; stage: Stage; hunger: number; thirst: number; tired: number; hp: number; held: boolean; near: boolean; carer: string }[] {
    const w = this.w, e = w.e, out = [];
    for (const cid of this.childrenOf(e.id(c))) {
      const k = e.slot(cid), q = this.prof(cid);
      if (k < 0 || !q || q.died !== undefined) continue;
      const age = this.ageOf(k), car = this.carer[k]!;
      out.push({ id: cid, name: q.name, age: Math.round(age * 10) / 10, stage: stageOf(age), hunger: Math.round(e.hunger[k]!), thirst: Math.round(e.thirst[k]!), tired: Math.round(e.tired[k]!), hp: Math.round(e.hp[k]!),
        held: this.carried[k] === c, near: e.map[k] === e.map[c] && Math.hypot(e.x[k]! - e.x[c]!, e.y[k]! - e.y[c]!) <= 3, carer: car >= 0 && car !== c ? (w.profileOf(car)?.name ?? '') : '' });
    }
    return out;
  }

  // ------------------------------------------------------------------ feelings
  private feel(a: number, b: number, d: number): void {
    const p = this.prof(a); if (!p) return;
    p.mind ??= { notes: [], summary: '', mood: 'calm', rel: {}, lastPlan: this.w.gameSec - 1e9 };
    p.mind.rel['#' + b] = Math.max(-5, Math.min(5, (p.mind.rel['#' + b] ?? 0) + d));
  }
  /** A baby is born: it knows its parents and brothers and sisters from the start, and they love it. */
  private born(id: number): void {
    for (const pid of this.parentsOf(id)) { this.feel(id, pid, 4); this.feel(pid, id, 5); }
    for (const s of this.siblingsOf(id)) { this.feel(id, s, 2); this.feel(s, id, 2); }
  }
  /** Every game hour: children growing up near their family grow closer to them (family ties feed clan loyalty). */
  private hourly(): void {
    const w = this.w, e = w.e;
    for (let i = 0; i < e.hi; i++) {
      if (e.kind[i] !== Kind.Agent || e.map[i] === NO_MAP || this.ageOf(i) >= 16) continue;
      const id = e.id(i);
      for (const f of [...this.parentsOf(id), ...this.siblingsOf(id)]) {
        const j = e.slot(f);
        if (j >= 0 && e.map[j] === e.map[i] && Math.hypot(e.x[j]! - e.x[i]!, e.y[j]! - e.y[i]!) < 20) { this.feel(id, f, 0.15); this.feel(f, id, 0.1); }
      }
    }
  }
}

// ------------------------------------------------------------------ how children talk
const CRY = ['Waaah!', 'Waaah... waaah!', 'Mmm... ngh... waah!'];
const BABBLE = ['Ba-ba-ba!', 'Goo goo.', 'Ah-ah! Da!', 'Mmm-ma.', '*giggles*', 'Bah! Bah!'];
/**
 * What a child of this age really says for `text` (what an adult would have said). Under 1: cries and babbling; under 2: one
 * word; under 4: two or three words; under 7: a short simple sentence (cut); from 7 on: the text as it is.
 * `needs` = hunger, thirst, tired (0..100); `mum` / `dad` = whether a parent is near (for "Mama!").
 */
export function kidTalk(age: number, text: string, needs: { hunger: number; thirst: number; tired: number }, pick: (n: number) => number, parent: 'f' | 'm' | '' = ''): string {
  if (age >= 7) return text;
  const want = needs.thirst > 50 ? 'water' : needs.hunger > 50 ? 'food' : needs.tired > 65 ? 'sleep' : '';
  if (age < 1) return want ? CRY[pick(CRY.length)]! : BABBLE[pick(BABBLE.length)]!;
  const mama = parent === 'm' ? 'Dada' : 'Mama';
  if (age < 2) {
    const w = want === 'water' ? ['Wawa!', 'Wa-wa!'] : want === 'food' ? ['Num-num!', 'Mmm... num!'] : want === 'sleep' ? ['Sleepy...', 'Nigh-nigh.'] : [`${mama}!`, 'Up!', 'No!', 'Look!', 'Hi!', 'Ball!', 'Doggy!'];
    return w[pick(w.length)]!;
  }
  if (age < 4) {
    const w = want === 'water' ? [`${mama}, water!`, 'Want water!', 'Me thirsty!'] : want === 'food' ? ['Me hungry!', `${mama}, food!`, 'Want num-num!'] : want === 'sleep' ? ['Me sleepy.', 'Want bed.']
      : [`${mama}, look!`, 'Play with me?', 'Me do it!', 'What that?', 'Me scared...', 'Big tree!', 'I love you!'];
    return w[pick(w.length)]!;
  }
  // 4 to 6: their own words, kept short and simple.
  const words = text.replace(/[;:—–]/g, ',').split(/\s+/).filter(Boolean);
  const cut = words.slice(0, 7).join(' ').replace(/[,.]+$/, '');
  return cut ? cut + (/[!?]$/.test(cut) ? '' : '!') : 'Look at me!';
}
/** For prompts: how a child of this age speaks (empty for grown-ups). */
export function kidVoice(age: number): string {
  if (age < 2) return 'You are a baby: you cannot speak words yet, only cry, babble and laugh.';
  if (age < 4) return `You are a little child of ${Math.floor(age)}: you say only two or three simple words at a time ("Me hungry!", "Mama, look!").`;
  if (age < 7) return `You are a child of ${Math.floor(age)}: speak like a small child, short simple sentences, simple words, no grown-up talk.`;
  if (age < 12) return `You are a child of ${Math.floor(age)}: speak like a child of that age, simply and honestly.`;
  if (age < 16) return `You are a teenager of ${Math.floor(age)}: speak like one.`;
  return '';
}
