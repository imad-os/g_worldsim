import { ANIMAL_NAMES, EFlag, Kind } from '@worldsim/protocol';
import type { World, WorldEvent } from './world.js';

/**
 * Awareness (flag `aware`, research/PEOPLE_AI.md): what each person has SEEN or been TOLD about what moves around them.
 *
 * Before, the brain only knew what was within reach right now (the nearest zombie within 10-16 m) or everything at once
 * (`zombies.count(map)`). A person now keeps a few sightings: "two zombies 30 m north, 10 minutes ago", "deer by the
 * river this morning", "wild horses in the east of the woods (Sami told me)". They come from their own eyes (a look round
 * every few seconds, through the map's spatial grid) and from talks (sim/talk.ts: hop 1 = told by the one who saw it,
 * 2+ = a rumour, less precise). A sighting fades: zombies after 3 game hours or at dawn, animals after 6.
 *
 * What it changes: wandering and foraging keep away from fresh dangers (`risky`), people are on the alert when a threat
 * was seen near lately (`alert`: a wider watch), hunters walk to the game someone told them about (`game`), and every
 * prompt says what they know (`promptText`). Memory only (not in snapshots): sightings are fresh news, not a life story.
 */
export type SightKind = 'zombie' | 'wolf' | 'bear' | 'boar' | 'deer' | 'rabbit' | 'horses';
export interface Sight { k: SightKind; m: number; x: number; y: number; n: number; t: number; hop: number; from: number }

export const DANGEROUS: ReadonlySet<SightKind> = new Set(['zombie', 'wolf', 'bear', 'boar']);
const KEEP = 6, LOOK_R = 18, LOOK_EVERY = 5, MERGE_R = 20;
const LIFE: Record<SightKind, number> = { zombie: 3 * 3600, wolf: 6 * 3600, bear: 8 * 3600, boar: 6 * 3600, deer: 5 * 3600, rabbit: 3 * 3600, horses: 12 * 3600 };

export class Aware {
  /** Entity id -> sightings, newest last. */
  readonly sights = new Map<number, Sight[]>();
  private readonly buf = new Int32Array(256);
  private readonly cnt = new Map<SightKind, [number, number, number]>();
  private pass = 0;
  stats = { looks: 0, seen: 0, told: 0 };

  constructor(private readonly w: World) {
    w.listeners.push((ev) => this.on(ev));
  }
  private get on_(): boolean { return this.w.ai.aware !== false; }

  // ------------------------------------------------------------------ eyes (every 20 ticks, each person every 5th pass)
  update(): void {
    if (!this.on_) return;
    const w = this.w, e = w.e, p = this.pass++ % LOOK_EVERY;
    for (let i = p; i < e.hi; i += LOOK_EVERY) {
      if (e.kind[i] !== Kind.Agent || e.flags[i]! & EFlag.Sleeping) continue;
      const m = e.map[i]!, mp = w.maps[m];
      if (!mp) continue;
      this.stats.looks++;
      const n = mp.grid.queryCircle(e, e.x[i]!, e.y[i]!, LOOK_R, this.buf);
      const cnt = this.cnt; cnt.clear();
      for (let q = 0; q < n; q++) {
        const j = this.buf[q]!, kd = e.kind[j];
        const k: SightKind | '' = kd === Kind.Threat ? 'zombie' : kd === Kind.Animal ? this.animalKind(j) : '';
        if (!k || (k === 'horses' && w.horses.owned(j))) continue;
        const c = cnt.get(k);
        if (c) c[0]++; else cnt.set(k, [1, e.x[j]!, e.y[j]!]);
      }
      for (const [k, [c, x, y]] of cnt) this.see(e.id(i), k, m, x, y, 0, -1, c);
    }
    // Dawn: the night's zombies crumble (sim/zombies.ts), so the zombie sightings go too.
    const h = ((w.gameSec / 3600 + 8) % 24 + 24) % 24;
    if (h >= 6 && h < 6.05) for (const list of this.sights.values()) for (let k = list.length - 1; k >= 0; k--) if (list[k]!.k === 'zombie') list.splice(k, 1);
  }
  private animalKind(j: number): SightKind | '' {
    const t = this.w.e.sub[j]! & 7; // horses carry their look in the upper bits (sim/horses.ts)
    return t === 5 ? 'horses' : ANIMAL_NAMES[t] ?? '';
  }

  /** Note a sighting for person id (merged with the same kind within 20 m: the newer, the larger count). True if it was news. */
  see(id: number, k: SightKind, m: number, x: number, y: number, hop: number, from: number, n = 1, t = this.w.gameSec): boolean {
    let list = this.sights.get(id);
    if (!list) this.sights.set(id, (list = []));
    this.prune(list);
    const same = list.find((s) => s.k === k && s.m === m && Math.hypot(s.x - x, s.y - y) < MERGE_R);
    if (same) {
      if (t < same.t - 60) return false; // older than what I know
      const news = t - same.t > 1800 || hop < same.hop;
      same.x = x; same.y = y; same.t = Math.max(same.t, t); same.hop = Math.min(same.hop, hop); same.n = hop === 0 ? n : Math.max(same.n, n);
      if (hop === 0 && same.from >= 0) same.from = -1;
      return news;
    }
    list.push({ k, m, x: Math.round(x), y: Math.round(y), n, t, hop, from });
    if (list.length > KEEP) { // the least useful goes: old harmless ones first
      let worst = 0, ws = Infinity;
      for (let q = 0; q < list.length; q++) { const s = list[q]!, v = (DANGEROUS.has(s.k) ? 2 : 1) * (1 - (this.w.gameSec - s.t) / LIFE[s.k]); if (v < ws) { ws = v; worst = q; } }
      list.splice(worst, 1);
    }
    if (hop === 0) this.stats.seen++; else this.stats.told++;
    return true;
  }
  private prune(list: Sight[]): void {
    const now = this.w.gameSec;
    for (let k = list.length - 1; k >= 0; k--) if (now - list[k]!.t > LIFE[list[k]!.k]) list.splice(k, 1);
  }
  /** Fresh sightings of person id (pruned). */
  of(id: number): Sight[] { const l = this.sights.get(id); if (!l) return []; this.prune(l); return l; }

  // ------------------------------------------------------------------ what it changes
  /** A fresh danger (seen in the last 1.5 game hours, or told within 1) within r m of (x, y) on map m, as slot i knows it. */
  risky(i: number, m: number, x: number, y: number, r = 25): boolean {
    if (!this.on_) return false;
    const now = this.w.gameSec;
    for (const s of this.of(this.w.e.id(i))) if (DANGEROUS.has(s.k) && s.m === m && now - s.t < (s.hop ? 3600 : 5400) && Math.hypot(s.x - x, s.y - y) < r + s.hop * 5) return true;
    return false;
  }
  /** On the alert: a danger seen or told of within 45 m in the last half hour. */
  alert(i: number): boolean {
    const e = this.w.e;
    return this.risky(i, e.map[i]!, e.x[i]!, e.y[i]!, 45) && this.of(e.id(i)).some((s) => DANGEROUS.has(s.k) && this.w.gameSec - s.t < 1800);
  }
  /** The freshest game (deer / rabbit / boar for the armed) person i knows of on their map: where to go hunting. */
  game(i: number, armed = false): Sight | null {
    const e = this.w.e, m = e.map[i]!;
    let best: Sight | null = null, bv = -Infinity;
    for (const s of this.of(e.id(i))) {
      if (s.m !== m || !(s.k === 'deer' || s.k === 'rabbit' || (armed && s.k === 'boar'))) continue;
      const v = -(this.w.gameSec - s.t) / 600 - Math.hypot(s.x - e.x[i]!, s.y - e.y[i]!) / 40 + (s.k === 'deer' ? 1 : 0);
      if (v > bv) { bv = v; best = s; }
    }
    return best;
  }

  /** One line for the prompts: what they know of the dangers and game around them now. */
  promptText(i: number): string {
    if (!this.on_) return '';
    const w = this.w, e = w.e, list = this.of(e.id(i)).filter((s) => s.m === e.map[i]);
    if (!list.length) return '';
    const dir = (dx: number, dy: number) => (Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'east' : 'west') : dy > 0 ? 'south' : 'north');
    const ago = (t: number) => { const m = Math.round((w.gameSec - t) / 60); return m < 2 ? 'just now' : m < 90 ? `${m} min ago` : `${Math.round(m / 60)} h ago`; };
    const out = list.slice(-5).map((s) => {
      const d = Math.round(Math.hypot(s.x - e.x[i]!, s.y - e.y[i]!));
      const what = s.k === 'horses' ? 'wild horses' : s.n > 1 ? `${s.n} ${s.k === 'deer' ? 'deer' : s.k + 's'}` : `a ${s.k}`;
      const src = s.hop === 0 ? 'seen' : s.hop === 1 ? `${w.profiles.get(s.from)?.name ?? 'someone'} told you` : 'a rumour';
      return `${what} ${d < 6 ? 'right here' : `${d} m ${dir(s.x - e.x[i]!, s.y - e.y[i]!)}`} (${src}, ${ago(s.t)})`;
    });
    return `Around you lately: ${out.join('; ')}.`;
  }

  // ------------------------------------------------------------------ from what happens
  private on(ev: WorldEvent): void {
    if (!this.on_) return;
    const w = this.w, e = w.e, d = ev.data;
    if (ev.kind === 'bitten' || ev.kind === 'alarm') { // a bite or a shout: those around know where the danger is
      const i = e.slot(Number(d.id ?? -1));
      if (i < 0) return;
      const k: SightKind = d.animal === 'wolf' || d.animal === 'bear' || d.animal === 'boar' ? d.animal : 'zombie';
      const m = e.map[i]!, x = e.x[i]!, y = e.y[i]!;
      for (let j = 0; j < e.hi; j++) if (e.kind[j] === Kind.Agent && e.map[j] === m && Math.abs(e.x[j]! - x) < 30 && Math.abs(e.y[j]! - y) < 30) this.see(e.id(j), k, m, x, y, j === i ? 0 : 1, j === i ? -1 : e.id(i));
    }
    if (ev.kind === 'death') this.sights.delete(Number(d.id ?? -1));
  }
}
