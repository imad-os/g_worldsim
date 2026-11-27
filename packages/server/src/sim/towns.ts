/**
 * Towns and their government (imad 2026-11-27: "change the camp rules to match small towns, so people can live in; the leader has a
 * government of 3 at most, 1 for security, 1 for resources, 1 for society, depending on the size; the leader can make a town only with
 * more than 10 members").
 *
 * - A clan's camp (its own, or the map's first camp for the main clan) becomes a TOWN when its leader says so, once the clan has more than
 *   TOWN_AT members: an AI leader does it by itself, a player leader on the TV (Do `clan` `town`). A town's edge takes in every hut of
 *   its people up to 42 m out (sim/territory.ts); a camp stays small (28 m).
 * - Seats by size: 11-15 members = Security; 16-24 = + Resources; 25+ = + Society. The leader appoints the best fitting member (never
 *   themselves, adults, AI or players' characters), checked once a game day: a seat changes when its holder is gone / left, or someone
 *   fits 0.25 better.
 * - Duties, hourly: Security picks the guards (first on the watch, first to warn intruders, sim/territory.ts) and has spears made when
 *   zombies walk; Resources gives the day's chore (the town's biggest lack: water, food, wood, stone) instead of the leader; Society finds
 *   the homeless a free hut, brings two members who dislike each other to make up, and eases tension with clans at peace.
 */
import { Kind } from '@worldsim/protocol';
import type { Clan } from './clans.js';
import type { World } from './world.js';

export const TOWN_AT = 10;
export const ROLES = ['security', 'resources', 'society'] as const;
export type Role = (typeof ROLES)[number];
const DAY = 24 * 3600, HOUR = 3600;

/** How many seats a town of n members has. */
export function seats(n: number): number { return n > 24 ? 3 : n > 15 ? 2 : n > TOWN_AT ? 1 : 0; }

export const ROLE_TEXT: Record<Role, string> = {
  security: 'security (guards, the watch, warning intruders, weapons when zombies come)',
  resources: 'resources (the stores: water, food, wood, stone; sends crews to fill them)',
  society: 'society (homes for the homeless, making up quarrels, peace with neighbours)',
};

export class Towns {
  constructor(private w: World) {}

  /** The clan has a camp it can call a town: its own, or the map's first camp when it is the main clan. */
  private hasCamp(c: Clan): boolean { return !!c.camp || (!!this.w.survival.campOf(c.map) && this.w.clans.mainClan(c.map)?.id === c.id); }
  /** Who holds `role` in clan c (entity id), or -1. */
  holder(c: Clan, r: Role): number { const id = c.gov?.[r]; return id !== undefined && c.members.includes(id) ? id : -1; }
  /** The role person id holds in their clan, or ''. */
  roleOf(id: number): Role | '' {
    const c = this.w.clans.clanOf(id);
    if (!c?.gov) return '';
    for (const r of ROLES) if (c.gov[r] === id) return r;
    return '';
  }
  fit(id: number, r: Role): number {
    const w = this.w, p = w.profiles.get(id), t = p?.traits, i = w.e.slot(id);
    if (!t) return -9;
    const armed = i >= 0 && w.survival.weapon(i)[1] > 0 ? 0.3 : 0, lv = Math.sqrt((p!.xp ?? 0) / 50) * 0.05;
    return r === 'security' ? t.courage * 1.2 + t.strength * 0.8 + armed + lv
      : r === 'resources' ? t.intelligence * 1.1 + t.strength * 0.5 + t.speed * 0.2 + lv
      : t.empathy * 1.2 + t.intelligence * 0.4 + w.influence.of(id) / 100 + lv;
  }

  /** Make clan c's camp a town (its leader decides). '' = done, else why not. */
  found(c: Clan, by: string): string {
    const w = this.w;
    if (c.town) return 'already a town';
    if (c.members.length <= TOWN_AT) return `a town needs more than ${TOWN_AT} members (we are ${c.members.length})`;
    if (!this.hasCamp(c)) return 'we have no camp yet';
    c.town = { at: w.gameSec };
    const L = w.e.slot(c.leader);
    if (L >= 0) w.speak(L, `${c.name}! Our camp is a town now. I will name who looks after security${seats(c.members.length) > 1 ? ', resources' : ''}${seats(c.members.length) > 2 ? ' and our people' : ''}.`);
    w.emit('clanTown', { clan: c.name, map: w.maps[c.map]!.def.id, n: c.members.length, by });
    this.appoint(c, true);
    return '';
  }

  /** Hourly (from Territory). */
  hourly(): void {
    const w = this.w;
    for (const c of w.clans.clans) {
      if (!c.members.length) continue;
      if (!c.town) {
        const L = w.e.slot(c.leader);
        if (L >= 0 && w.e.kind[L] === Kind.Agent && !w.charName(L) && c.members.length > TOWN_AT && this.hasCamp(c)) this.found(c, w.profiles.get(c.leader)?.name ?? 'the leader');
        continue;
      }
      if (w.gameSec - (c.gov?.at ?? -1e9) >= DAY || ROLES.some((r) => c.gov?.[r] !== undefined && this.holder(c, r) < 0)) this.appoint(c, false);
      this.security(c); this.society(c);
    }
  }

  /** The leader fills the seats the town's size allows. */
  appoint(c: Clan, first: boolean): void {
    const w = this.w, n = seats(c.members.length), g = (c.gov ??= { at: w.gameSec });
    g.at = w.gameSec;
    const taken = new Set<number>([c.leader]);
    for (let k = 0; k < ROLES.length; k++) {
      const r = ROLES[k]!;
      if (k >= n) { delete g[r]; continue; }
      const cands = c.members.filter((id) => !taken.has(id) && this.grown(id) && w.e.slot(id) >= 0);
      if (!cands.length) { delete g[r]; continue; }
      const best = cands.sort((a, b) => this.fit(b, r) - this.fit(a, r))[0]!;
      const cur = this.holder(c, r);
      const keep = cur >= 0 && !taken.has(cur) && this.fit(cur, r) + 0.25 >= this.fit(best, r);
      const who = keep ? cur : best;
      taken.add(who);
      if (who === cur) continue;
      g[r] = who;
      const name = w.profiles.get(who)?.name ?? 'someone';
      w.emit('clanRole', { clan: c.name, role: r, id: who, name });
      this.note(who, `${w.profiles.get(c.leader)?.name ?? 'Our leader'} named me head of ${ROLE_TEXT[r]} for the ${c.name} town.`);
      const L = w.e.slot(c.leader);
      if (L >= 0 && !first) w.speak(L, `${name} looks after ${r} for us from now on.`);
    }
  }
  private grown(id: number): boolean { const i = this.w.e.slot(id); return i >= 0 && this.w.family.ageOf(i) >= 18; }

  /** Security: spears for the unarmed when zombies come (the watch and the warnings are in sim/territory.ts). */
  private security(c: Clan): void {
    const w = this.w, e = w.e, s = this.holder(c, 'security');
    if (s < 0) return;
    const hour = w.brain.hour();
    if (!(hour >= 16 && hour < 20) || !(w.zombies.perNight > 0 || w.zombies.count(c.map) > 0) || w.gameSec - (c.secAt ?? -1e9) < 12 * HOUR) return;
    c.secAt = w.gameSec;
    let n = 0;
    for (const id of c.members) {
      const i = e.slot(id);
      if (n >= 3 || i < 0 || e.kind[i] !== Kind.Agent || e.map[i] !== c.map || w.survival.weapon(i)[1] > 0 || !this.grown(id) || w.profileOf(i)?.mind?.task) continue;
      if (w.tasks.start(i, 'make a spear before night', w.profiles.get(s)?.name ?? 'security', [{ do: 'craft', what: 'spear' }])) n++;
    }
    const S = e.slot(s);
    if (n && S >= 0) w.speak(S, 'Zombies tonight. Everyone without a weapon: make a spear.');
  }

  /** Society: homes, quarrels, neighbours. */
  private society(c: Clan): void {
    const w = this.w, e = w.e, s = this.holder(c, 'society');
    if (s < 0) return;
    const S = e.slot(s), sn = w.profiles.get(s)?.name ?? 'someone';
    // A home for a homeless member (a free hut on the map).
    for (const id of c.members) {
      const i = e.slot(id);
      if (i < 0 || e.kind[i] !== Kind.Agent || e.map[i] !== c.map || !this.grown(id) || w.survival.homes.homeOf(id)) continue;
      if (w.survival.homes.moveIn(id, c.map) !== '') { this.note(id, `${sn} found me a home in the town.`); w.emit('clanHelp', { clan: c.name, by: s, id, what: 'home' }); break; }
    }
    // Two members who dislike each other make up a little (once a game day per town).
    if (w.gameSec - (c.socAt ?? -1e9) >= DAY) {
      c.socAt = w.gameSec;
      const rel = (a: number, b: number) => w.profiles.get(a)?.mind?.rel['#' + b] ?? 0;
      let pair: [number, number] | null = null, low = -2;
      const ms = c.members.slice(0, 60);
      for (let a = 0; a < ms.length; a++) for (let b = a + 1; b < ms.length; b++) { const r = rel(ms[a]!, ms[b]!) + rel(ms[b]!, ms[a]!); if (r < low * 2) { low = r / 2; pair = [ms[a]!, ms[b]!]; } }
      if (pair) {
        for (const [x, y] of [pair, [pair[1], pair[0]]] as const) { const p = w.profiles.get(x); if (p?.mind) p.mind.rel['#' + y] = Math.min(5, (p.mind.rel['#' + y] ?? 0) + 1.5); }
        const n0 = w.profiles.get(pair[0])?.name ?? '?', n1 = w.profiles.get(pair[1])?.name ?? '?';
        if (S >= 0) w.speak(S, `${n0}, ${n1}: we are one town. Shake hands.`);
        w.emit('clanHelp', { clan: c.name, by: s, a: pair[0], b: pair[1], what: 'makeUp' });
      }
      for (const x of w.clans.clans) if (x.id !== c.id && x.map === c.map && !w.clans.warOf(c.id, x.id) && w.clans.tension(c.id, x.id) > 0) w.clans.ease(c.id, x.id, 0.5, 'diplomacy');
    }
  }

  /** The government line of every prompt about a member. */
  promptText(id: number): string {
    const w = this.w, c = w.clans.clanOf(id);
    if (!c) return '';
    if (!c.town) return c.members.length > TOWN_AT && c.leader === id ? ` Your clan is big enough to make its camp a town (skill clan {"what":"town"}).` : '';
    const g = ROLES.map((r) => { const h = this.holder(c, r); return h >= 0 ? `${r}: ${w.profiles.get(h)?.name ?? '?'}` : ''; }).filter(Boolean);
    const mine = this.roleOf(id);
    return ` Your clan's camp is a TOWN${g.length ? ` with a government (${g.join(', ')})` : ''}: live in it, build your hut there.${mine ? ` YOU are the head of ${ROLE_TEXT[mine]}.` : ''}`;
  }
  /** For the panel / TV Clan page. */
  info(c: Clan): { town: boolean; seats: number; gov: { role: Role; id: number; name: string }[] } {
    return { town: !!c.town, seats: c.town ? seats(c.members.length) : 0, gov: ROLES.map((r) => ({ role: r, id: this.holder(c, r), name: this.w.profiles.get(this.holder(c, r))?.name ?? '' })).filter((x) => x.id >= 0) };
  }
  private note(id: number, text: string): void {
    const p = this.w.profiles.get(id);
    if (!p || p.player) return;
    p.mind ??= { notes: [], summary: '', mood: 'calm', rel: {}, lastPlan: this.w.gameSec - 1e9 };
    p.mind.notes.push({ at: this.w.gameSec, text });
    if (p.mind.notes.length > 12) p.mind.notes.splice(0, p.mind.notes.length - 12);
  }
}
