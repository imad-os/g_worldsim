/**
 * Clan camps as territory (imad 2026-11-27: "every clan can have their own camp and defend it against animals, zombies and other clans
 * if they are in war; clans not in war let their members go in for family or other needs; members should be aware, not walk into an
 * enemy clan and get killed; not too aggressive: often walk away, or just keep them out of the camp: tell the enemy to get out, else
 * they are attacked on the spot").
 *
 * - A camp = the map's first camp (it belongs to `Clans.mainClan`) or a clan's own camp (`Clan.camp`), a circle of `r` metres.
 * - Visitors: a member of a clan at PEACE walks in and out freely (family, water, trade, a chat). Only when the two clans are very tense
 *   (8+/10) and the visitor has no family there, a guard asks them to leave, but never strikes.
 * - Intruders: a member of a clan at WAR inside the circle is seen by the nearest awake grown member (a guard on duty first), who walks
 *   up and WARNS them ("this is the X camp, turn back"). Most turn round (raiders weigh the odds: their numbers against the defenders,
 *   their courage); whoever leaves is barred from that camp for BAR_HOURS and their way goes round it. One still inside after GRACE
 *   seconds is attacked on the spot (a duel: small hits, nobody dies, Clans.pvpDamage) until they give way or leave.
 * - Awareness: the camps of clans at war with mine are tiles to avoid in every path (Pathfinder.avoid) and a goal inside one is refused
 *   (no wandering, foraging or drinking there), unless it is my own home or I was sent on a raid. Every prompt names the camps around
 *   and which are safe. Being warned off goes into memory and the event `trespass` (sim/talk.ts passes it on as a danger).
 * - Defence: each clan camp has its own night watch (1 guard, 2 at war or with zombies about, from 3 members on the map) and, while at
 *   war, a day guard; when zombies come, members rally at their own camp's fire (Tactics.muster(m, i)).
 *
 * Cost: one pass a second over the people of maps that have camps (a few circle tests each); path masks are built once per set of
 * hostile camps and reused.
 */
import { Act, Kind } from '@worldsim/protocol';
import { NO_MAP } from './entities.js';
import type { World } from './world.js';

export interface Camp { clan: number; m: number; x: number; y: number; r: number; main: boolean }
interface Intruder { clan: number; guard: number; at: number; warned: number; fought: boolean; war: boolean; leaving: boolean }

/** Sim seconds an intruder at war is given to turn round before the guards strike. */
export const GRACE = 15;
/** Game hours someone told to leave keeps out of that camp. */
export const BAR_HOURS = 3;
/** Radius of a clan's own camp (metres); the map's first camp uses its wall circle. Paths keep MARGIN more off it. */
const CLAN_R = 18, MARGIN = 3;
/** A town's edge reaches its farthest hut + HUT_PAD (a hut is 7 x 7), up to TOWN_MAX metres from the centre; farther huts are strays. */
const TOWN_MAX = 42, CAMP_MAX = 28, HUT_PAD = 6;
const HOUR = 3600;

export class Territory {
  private campCache: { tick: number; list: Camp[]; sig: string }[] = [];
  private masks = new Map<string, Uint8Array>();
  private intr = new Map<number, Intruder>(); // by intruder entity id
  /** Entity id -> barred camps: clan id -> until (game seconds). */
  private barred = new Map<number, Map<number, number>>();
  private nextHour = 0;
  /** Warnings given / intruders who left / fights over a camp (stats for the panel and tests). */
  readonly count = { warned: 0, left: 0, fought: 0, refused: 0 };

  constructor(private w: World) {}

  // ------------------------------------------------------------------ the camps
  camps(m: number): Camp[] {
    const w = this.w, c = this.campCache[m], main = w.survival.campOf(m);
    let sig = main ? `${main.x},${main.y}` : '-';
    for (const k of w.clans.clans) if (k.camp && k.camp.m === m) sig += `|${k.id}:${k.camp.x},${k.camp.y}:${k.members.length ? 1 : 0}`;
    if (c && c.sig === sig && w.tick - c.tick < 20) return c.list; // the towns' edges are worked out once a sim second
    const list: Camp[] = [];
    if (main) {
      const mc = w.clans.mainClan(m), per = w.survival.perimeter(m);
      list.push({ clan: mc ? mc.id : -1, m, x: main.x, y: main.y, r: Math.max(14, Math.min(30, per ? per.r : CLAN_R)), main: true });
    }
    for (const k of w.clans.clans) if (k.camp && k.camp.m === m && k.members.length) list.push({ clan: k.id, m, x: k.camp.x, y: k.camp.y, r: CLAN_R, main: false });
    // A camp is a small town (imad 2026-11-27): its edge takes in every hut of its people standing near it.
    if (list.length) {
      const H = w.survival.homes;
      for (const h of H.list) {
        if (h.m !== m) continue;
        const o = h.owner >= 0 ? h.owner : h.by, oc = o >= 0 ? w.clans.clanOf(o)?.id : undefined, mid = H.middle(h);
        let best: Camp | undefined, bd = TOWN_MAX;
        for (const cp of list) {
          const d = Math.hypot(mid.x - cp.x, mid.y - cp.y);
          const theirs = cp.clan >= 0 && oc === cp.clan || cp.main && (oc === undefined || !list.some((x) => x.clan === oc));
          if (theirs && d < bd) { bd = d; best = cp; }
        }
        if (best) { const k = w.clans.byId(best.clan); best.r = Math.max(best.r, Math.min(k?.town ? TOWN_MAX : CAMP_MAX, bd + HUT_PAD)); }
      }
    }
    this.campCache[m] = { tick: w.tick, list, sig };
    return list;
  }
  /** The camp (x, y) on map m is in, if any. */
  campAt(m: number, x: number, y: number, pad = 0): Camp | undefined {
    for (const c of this.camps(m)) if (Math.hypot(x - c.x, y - c.y) < c.r + pad) return c;
    return undefined;
  }
  /** Camp c is closed to person id: their clan is at war with its clan, or they were told to leave it a short while ago. */
  closedTo(id: number, c: Camp): boolean {
    if (c.clan < 0) return false;
    const w = this.w, mine = w.clans.clanOf(id);
    if (mine?.id === c.clan) return false;
    if (mine && w.clans.warOf(mine.id, c.clan)) return true;
    const until = this.barred.get(id)?.get(c.clan);
    return until !== undefined && until > w.gameSec;
  }
  private raiding(i: number): boolean { const t = this.w.profileOf(i)?.mind?.task; return !!t && t.text.startsWith('raid the '); }

  // ------------------------------------------------------------------ awareness: paths
  /** The tiles person i keeps out of (camps closed to them), or null when every camp is open. */
  avoidFor(i: number): Uint8Array | null {
    const w = this.w, e = w.e, m = e.map[i]!;
    if (m === NO_MAP || e.kind[i] !== Kind.Agent) return null;
    const camps = this.camps(m);
    if (!camps.length) return null;
    if (this.raiding(i)) return null;
    const id = e.id(i), home = w.survival.homes.homeOf(id), hm = home && home.m === m ? w.survival.homes.middle(home) : null;
    let key = '';
    for (let k = 0; k < camps.length; k++) {
      const c = camps[k]!;
      if (!this.closedTo(id, c)) continue;
      if (hm && Math.hypot(hm.x - c.x, hm.y - c.y) < c.r + 2) continue; // my own home is in there (family across the clans)
      key += `${k}:${Math.round(c.x)}:${Math.round(c.y)}:${c.r};`;
    }
    if (!key) return null;
    key = `${m}|${key}`;
    let mask = this.masks.get(key);
    if (!mask) {
      const tm = w.maps[m]!.tiles;
      mask = new Uint8Array(tm.w * tm.h);
      for (const part of key.split('|')[1]!.split(';')) {
        if (!part) continue;
        const [, sx, sy, sr] = part.split(':').map(Number) as [number, number, number, number];
        const R = sr + MARGIN;
        for (let y = Math.max(0, Math.floor(sy - R)); y <= Math.min(tm.h - 1, Math.ceil(sy + R)); y++)
          for (let x = Math.max(0, Math.floor(sx - R)); x <= Math.min(tm.w - 1, Math.ceil(sx + R)); x++)
            if (Math.hypot(x + 0.5 - sx, y + 0.5 - sy) < R) mask[y * tm.w + x] = 1;
      }
      if (this.masks.size > 24) this.masks.clear();
      this.masks.set(key, mask);
    }
    return mask;
  }
  /** A goal (x, y) inside a closed camp while person i is outside it: refused (they choose something else). */
  refuse(i: number, mask: Uint8Array, x: number, y: number): boolean {
    const w = this.w, e = w.e, W = w.maps[e.map[i]!]!.tiles.w;
    const at = (px: number, py: number) => mask[Math.floor(py) * W + Math.floor(px)] === 1;
    if (!at(x, y) || at(e.x[i]!, e.y[i]!)) return false;
    this.count.refused++;
    return true;
  }

  // ------------------------------------------------------------------ every second: visitors, intruders
  update(): void {
    const w = this.w, e = w.e;
    if (w.gameSec >= this.nextHour) { this.nextHour = w.gameSec + HOUR; this.hourly(); }
    const any = w.clans.clans.length > 0;
    if (!any) { this.intr.clear(); return; }
    const seen = new Set<number>();
    for (let j = 0; j < e.hi; j++) {
      const k = e.kind[j];
      if ((k !== Kind.Agent && k !== Kind.Player) || e.map[j] === NO_MAP || e.flags[j]! & 32 || e.flags[j]! & 4) continue;
      const m = e.map[j]!, camps = this.camps(m);
      if (!camps.length) continue;
      const c = this.campAt(m, e.x[j]!, e.y[j]!);
      const id = e.id(j);
      if (!c || c.clan < 0) continue;
      const mine = w.clans.clanOf(id);
      if (mine?.id === c.clan || !mine && k === Kind.Player && !w.charName(j)) continue;
      const war = !!mine && !!w.clans.warOf(mine.id, c.clan);
      const tense = !war && !!mine && w.clans.tension(mine.id, c.clan) >= 8 && !this.kinIn(id, c.clan);
      const barred = (this.barred.get(id)?.get(c.clan) ?? -1) > w.gameSec;
      if (!war && !tense && !barred) continue; // a visitor: welcome
      seen.add(id);
      this.intruder(j, id, c, war);
    }
    for (const [id, it] of this.intr) if (!seen.has(id)) { // gone out of the camp
      this.intr.delete(id);
      const g = e.slot(it.guard);
      if (g >= 0 && e.kind[g] === Kind.Agent && e.act[g] === Act.Idle) e.nextThink[g] = w.tick + 1;
      if (it.warned) { this.count.left++; w.emit('clanLeft', { id, clan: it.clan }); }
    }
  }
  private kinIn(id: number, clan: number): boolean {
    const c = this.w.clans.byId(clan);
    return !!c && c.members.some((x) => this.w.family.related(id, x));
  }
  /** The nearest awake grown member of clan `clan` within reach of (x, y) who can speak up: a guard on duty first. */
  private guardFor(clan: number, m: number, x: number, y: number, r: number): number {
    const w = this.w, e = w.e, c = w.clans.byId(clan);
    if (!c) return -1;
    let best = -1, bs = Infinity;
    for (const id of c.members) {
      const g = e.slot(id);
      if (g < 0 || e.kind[g] !== Kind.Agent || e.map[g] !== m || e.flags[g]! & (4 | 32) || e.act[g] === Act.Flee || e.act[g] === Act.Fight || w.clans.duelling(g)) continue;
      if (w.family.ageOf(g) < 16 || e.hp[g]! < 35) continue;
      const d = Math.hypot(e.x[g]! - x, e.y[g]! - y);
      if (d > r + 14) continue;
      const s = d - (w.survival.guarding(id) ? 20 : 0) - (c.gov?.security === id ? 25 : 0) - (w.profiles.get(id)?.traits.courage ?? 0.5) * 6;
      if (s < bs) { bs = s; best = g; }
    }
    return best;
  }
  private intruder(j: number, id: number, c: Camp, war: boolean): void {
    const w = this.w, e = w.e, tps = w.opt.tickRate;
    let it = this.intr.get(id);
    if (!it || it.clan !== c.clan) { it = { clan: c.clan, guard: -1, at: w.tick, warned: 0, fought: false, war, leaving: false }; this.intr.set(id, it); }
    let g = it.guard >= 0 ? e.slot(it.guard) : -1;
    if (g < 0 || e.map[g] !== c.m || e.flags[g]! & 4) { g = this.guardFor(c.clan, c.m, e.x[j]!, e.y[j]!, c.r); it.guard = g >= 0 ? e.id(g) : -1; }
    if (g < 0) return; // nobody of theirs about to see it
    if (!it.fought) w.brain.confront(g, e.x[j]!, e.y[j]!);
    const since = (w.tick - it.at) / tps;
    const clan = w.clans.byId(c.clan), name = w.profileOf(j)?.name ?? 'you';
    if (!it.warned) {
      it.warned = 1; it.at = w.tick; this.count.warned++;
      w.speak(g, war ? `${name}! This is the ${clan?.name ?? 'clan'} camp. Turn back now, or we drive you out.` : `You are not welcome here, ${name}. Please leave.`);
      w.emit('clanWarn', { id, by: it.guard, clan: clan?.name ?? '', map: w.maps[c.m]!.def.id, war });
      { const ic = w.clans.clanOf(id); if (ic) w.clans.warStat(c.clan, ic.id, 'warned', 1); }
      w.emit('trespass', { id, clan: clan?.name ?? '', map: w.maps[c.m]!.def.id, x: Math.round(c.x), y: Math.round(c.y), r: c.r, war });
      this.react(j, id, c, war, g);
      return;
    }
    if (it.leaving && e.kind[j] === Kind.Agent) { // on the way out: keep them going
      if (!e.speed[j]) w.brain.stepAway(j, c.x, c.y, c.r + 8);
      if (since < GRACE * 3) return;
    }
    if (since < GRACE || it.fought) return;
    if (!war) { // tense but at peace: say it again, never strike
      if (it.warned < 3 && since > GRACE * 2) { it.warned++; it.at = w.tick; w.speak(g, `I said leave, ${name}.`); w.clans.bump(c.clan, id, 0.3, 'trespassing'); }
      return;
    }
    // Still inside after the warning: attacked on the spot.
    if (e.kind[j] === Kind.Player && !w.clans.pvpOn(j)) { if (it.warned < 4 && since > GRACE * 2) { it.warned++; it.at = w.tick; w.speak(g, `Last warning, ${name}. Out!`); } return; }
    it.fought = true; this.count.fought++;
    w.clans.start(g, j, 'intruder');
  }
  /** An AI intruder hears the warning: most turn round; a raider weighs the odds. */
  private react(j: number, id: number, c: Camp, war: boolean, g: number): void {
    const w = this.w, e = w.e;
    if (e.kind[j] !== Kind.Agent) return;
    const it = this.intr.get(id)!, p = w.profileOf(j), courage = p?.traits.courage ?? 0.5;
    let leave = 1;
    if (war && this.raiding(j)) {
      let def = 0, mine = 0;
      const myClan = w.clans.clanOf(id)?.id;
      for (let k = 0; k < e.hi; k++) {
        if (e.kind[k] !== Kind.Agent || e.map[k] !== c.m || e.flags[k]! & 4 || Math.hypot(e.x[k]! - e.x[j]!, e.y[k]! - e.y[j]!) > 25) continue;
        const ck = w.clans.clanOf(e.id(k))?.id;
        if (ck === c.clan) def++; else if (ck === myClan) mine++;
      }
      leave = Math.max(0.2, Math.min(0.95, 0.55 + (def - mine) * 0.08 - courage * 0.3 + (e.hp[j]! < 60 ? 0.2 : 0)));
    }
    if (!w.rng.chance(leave)) { w.speak(j, courage > 0.7 ? 'Make me.' : 'We are not going anywhere.'); return; }
    it.leaving = true;
    if (this.raiding(j)) w.tasks.stop(j);
    this.bar(id, c.clan);
    w.speak(j, war ? 'All right, all right. We are going.' : 'Fine. I am going.');
    w.brain.stepAway(j, c.x, c.y, c.r + 8);
    const gn = w.profileOf(g)?.name ?? 'a guard', cn = w.clans.byId(c.clan)?.name ?? 'a clan';
    this.note(j, `${gn} of the ${cn} warned me out of their camp at (${Math.round(c.x)}, ${Math.round(c.y)}).${war ? ' We are at war: keep out of it.' : ''}`);
  }
  bar(id: number, clan: number): void {
    let b = this.barred.get(id);
    if (!b) { b = new Map(); this.barred.set(id, b); }
    b.set(clan, this.w.gameSec + BAR_HOURS * HOUR);
  }
  /** A duel over a camp ended: whoever gave way among the intruders leaves and is barred. */
  duelEnded(a: number, b: number, loser: number): void {
    for (const id of [a, b]) {
      const it = this.intr.get(id);
      if (!it) continue;
      it.fought = false; it.at = this.w.tick;
      const j = this.w.e.slot(id);
      if (j < 0 || loser !== j) continue;
      const c = this.camps(this.w.e.map[j]!).find((x) => x.clan === it.clan);
      if (!c) continue;
      it.leaving = true; this.bar(id, it.clan);
      if (this.raiding(j)) this.w.tasks.stop(j);
      this.w.brain.stepAway(j, c.x, c.y, c.r + 8, true);
    }
  }
  private note(id: number, text: string): void {
    const p = this.w.profiles.get(id);
    if (!p || p.player) return;
    p.mind ??= { notes: [], summary: '', mood: 'calm', rel: {}, lastPlan: this.w.gameSec - 1e9 };
    p.mind.notes.push({ at: this.w.gameSec, text });
    if (p.mind.notes.length > 12) p.mind.notes.splice(0, p.mind.notes.length - 12);
  }
  /** Person id is in camp trouble now (an intruder being warned or fought). */
  intruding(id: number): boolean { return this.intr.has(id); }

  // ------------------------------------------------------------------ hourly: each clan camp's watch
  private hourly(): void {
    const w = this.w, e = w.e, hour = w.brain.hour(), night = hour >= 20 || hour < 5;
    this.w.towns.hourly();
    for (const b of [...this.barred]) { for (const [k, t] of b[1]) if (t <= w.gameSec) b[1].delete(k); if (!b[1].size) this.barred.delete(b[0]); }
    for (let m = 0; m < w.maps.length; m++) for (const c of this.camps(m)) {
      const clan = w.clans.byId(c.clan);
      if (!clan) continue;
      const atWar = w.clans.foes(clan).some((f) => f.map === m);
      if (c.main && !atWar) continue; // the map's first camp has the usual night watch (Survival.watch)
      if (!night && !atWar) continue;
      const people = clan.members.map((id) => e.slot(id)).filter((i) => i >= 0 && e.kind[i] === Kind.Agent && e.map[i] === m && !(e.flags[i]! & 32));
      if (people.length < 3) continue;
      const zomb = w.zombies.perNight > 0 || w.zombies.count(m) > 0;
      const sec = clan.gov?.security, want = (night ? ((atWar || zomb) && people.length >= 6 ? 2 : 1) : 1) + (night && sec !== undefined && people.length >= 8 ? 1 : 0); // a town's head of security keeps one more on the watch
      let have = people.filter((i) => w.survival.guarding(e.id(i))).length;
      if (have >= want) continue;
      const fit = people.filter((i) => !w.survival.busy(e.id(i)) && !w.profileOf(i)?.mind?.task && !w.brain.orderOf(i).kind && e.hp[i]! > 60 && e.hunger[i]! < 60
        && e.thirst[i]! < 60 && e.tired[i]! < 65 && w.family.ageOf(i) >= 16 && !w.family.lyingInHome(i) && !w.rules.forbidden(i, 'fight') && (w.profileOf(i)?.traits.courage ?? 0.5) > 0.4)
        .sort((a, b) => this.score(b) + (e.id(b) === sec ? 1 : 0) - this.score(a) - (e.id(a) === sec ? 1 : 0)); // the head of security takes the watch first
      for (const i of fit) {
        if (have >= want) break;
        // Face the way trouble comes from: the nearest enemy camp, else outwards.
        const foe = this.camps(m).find((x) => x.clan !== c.clan && w.clans.warOf(c.clan, x.clan));
        const a = foe ? Math.atan2(foe.y - c.y, foe.x - c.x) + (have ? 0.8 : 0) : ((Math.floor(w.gameSec / (3 * HOUR)) + have) % 4) * Math.PI / 2;
        const post = w.freeSpot(m, c.x + Math.cos(a) * (c.r - 2), c.y + Math.sin(a) * (c.r - 2), 6);
        if (!post) break;
        if (w.survival.postGuard(i, m, post.x, post.y, post.x + Math.cos(a) * 3, post.y + Math.sin(a) * 3, 3)) have++;
      }
    }
  }
  private score(i: number): number {
    const t = this.w.profileOf(i)?.traits;
    return (t?.courage ?? 0.5) * 1.2 + (t?.strength ?? 0.5) * 0.6 + (this.w.survival.weapon(i)[1] > 0 ? 0.3 : 0);
  }

  // ------------------------------------------------------------------ prompts
  /** The camps round person i and which are safe for them, for every prompt about them. */
  promptText(i: number): string {
    const w = this.w, e = w.e, m = e.map[i]!;
    if (m === NO_MAP) return '';
    const id = e.id(i), mine = w.clans.clanOf(id)?.id, out: string[] = [];
    for (const c of this.camps(m)) {
      if (c.clan < 0) continue;
      const k = w.clans.byId(c.clan), d = Math.round(Math.hypot(c.x - e.x[i]!, c.y - e.y[i]!));
      const where = `at (${Math.round(c.x)}, ${Math.round(c.y)}), ${d} m away, ${Math.round(c.r)} m across`;
      if (c.clan === mine) out.push(`your clan's town ${where} (build your hut there, near the others; defend it)`);
      else if (this.closedTo(id, c)) out.push(`the ${k?.name} town ${where}: CLOSED to you${mine !== undefined && w.clans.warOf(mine, c.clan) ? ' (at war: their guards warn, then attack)' : ' (you were told to leave)'}, keep out`);
      else out.push(`the ${k?.name} town ${where}: open to visit (family, water, trade)`);
    }
    return out.length ? ` Towns (camps): ${out.join('; ')}.` : '';
  }

  // ------------------------------------------------------------------ saving
  save(): unknown { return { barred: [...this.barred].map(([id, b]) => [id, [...b]]) }; }
  load(s: unknown): void {
    const d = s as { barred?: [number, [number, number][]][] } | undefined;
    this.barred = new Map((d?.barred ?? []).map(([id, b]) => [id, new Map(b)]));
    this.intr.clear(); this.masks.clear(); this.campCache = []; this.nextHour = 0;
  }
}
