import { Act, EFlag, Kind, WARMTH, WEATHERS, SEASONS, COLD_BELOW, type WeatherKind } from '@worldsim/protocol';
import { Rng } from './rng.js';
import type { World } from './world.js';

/**
 * Weather and seasons (imad 2026-11-26: "add weather and seasons, and here comes the benefit of fire: it is needed when the
 * temperature is under 5 °C, to keep health points, only when not moving, because moving makes heat; clothes make it better,
 * fire makes health come back faster, and staying in huts in the cold is good too").
 *
 * The calendar: `seasonDays` game days per season (spring, summer, autumn, winter); a new world starts late in spring. The
 * temperature = the season's curve (warmest mid-summer, coldest mid-winter) + the weather's offset + the day's swing (coldest
 * at 03:00, warmest at 15:00; clear skies swing most) + the map's own (the wild woods a little colder). The weather is a spell
 * (clear, cloudy, rain, storm, snow, blizzard, fog) drawn from the season's odds for 2-9 game hours; rain turns to snow below
 * 1 °C and back above 2.5 °C. Its own dice (`rng`), so the weather never shifts the rest of the world's draws.
 *
 * Cold: below 5 °C anyone standing still (asleep, resting, talking, idle) loses health: (5 - T) x 2 hp a game hour x how
 * exposed they are. Moving, working (chopping, building) and fighting make heat: no loss. Exposure = 1 - clothes' warmth
 * (WARMTH, by level / quality) x a hut's roof (0.2, a bed in it 0.5 more) x a burning fire within 6 m (0 = fully warm).
 * While the cold takes more than 2 hp an hour the body does not heal at its usual pace (half). By a fire anyone heals
 * faster (Brain: x2.5 for people, x2 for players' characters).
 */
const HOUR = 3600, DAY = 86400;
/** Season means at the middle of each season, as a curve over the year (fraction f, 0 = spring starts). */
const MEAN = 10, SWING = 11, WARMEST = 0.375;
/** Where a brand new world's calendar starts (late spring: the first nights are mild). */
const START_F = 0.2;
const KIND_OFF: Record<WeatherKind, number> = { clear: 0, cloudy: -1, rain: -2, storm: -4, snow: -2, blizzard: -5, fog: -1 };
const KIND_AMP: Record<WeatherKind, number> = { clear: 7, cloudy: 3, rain: 2, storm: 2, snow: 2, blizzard: 1, fog: 2 };
/** Chances of the next spell by season: clear, cloudy, rain (snow when cold), storm (blizzard when cold), fog. */
const ODDS: number[][] = [
  [0.35, 0.3, 0.25, 0.05, 0.05], // spring
  [0.55, 0.2, 0.12, 0.1, 0.03], // summer
  [0.25, 0.3, 0.3, 0.07, 0.08], // autumn
  [0.3, 0.3, 0.3, 0.05, 0.05], // winter
];
const DRAW: WeatherKind[] = ['clear', 'cloudy', 'rain', 'storm', 'fog'];
/** A hut's roof keeps 80 % of the cold off, a bed in it half the rest. */
const HUT = 0.2, BED = 0.5;
/** hp a game hour per degree under COLD_BELOW, fully exposed. */
const RATE = 2;

export interface WeatherCfg { seasonDays: number; shift: number; cold: boolean }
export interface Warmth { fire: boolean; hut: boolean; bed: boolean; clothes: number; exposure: number; drain: number }

export class Weather {
  readonly cfg: WeatherCfg = { seasonDays: 3, shift: 0, cold: true };
  kind: WeatherKind = 'clear';
  /** How strong (0..1): rain / snow density, fog thickness. */
  k = 0.5;
  /** When this spell ends (game seconds). */
  until = 0;
  /** An admin's weather holds until then (game seconds); 0 = none. */
  forced = 0;
  /** The weather's offset and day swing, eased towards the spell's (no jumps). */
  private off = 0;
  private amp = 7;
  private lastSec = -1;
  private readonly rng: Rng;
  /** Set by the server: the config changed (saved in meta). */
  onCfg: () => void = () => {};

  constructor(private w: World) { this.rng = new Rng(w.seed + ':weather'); }

  save(): unknown { return { kind: this.kind, k: this.k, until: this.until, forced: this.forced, off: this.off, amp: this.amp, rng: [...this.rng.s] }; }
  load(d: unknown): void {
    const v = d as Partial<{ kind: WeatherKind; k: number; until: number; forced: number; off: number; amp: number; rng: number[] }> | undefined;
    if (!v || typeof v !== 'object') return;
    if (v.kind && WEATHERS.includes(v.kind)) this.kind = v.kind;
    if (typeof v.k === 'number') this.k = v.k;
    if (typeof v.until === 'number') this.until = v.until;
    if (typeof v.forced === 'number') this.forced = v.forced;
    if (typeof v.off === 'number') this.off = v.off;
    if (typeof v.amp === 'number') this.amp = v.amp;
    if (Array.isArray(v.rng) && v.rng.length === 4) this.rng.setState(v.rng);
    this.lastSec = this.w.gameSec;
  }

  // ------------------------------------------------------------------ calendar
  /** Game days since the start (the day counted from 08:00 like the viewers show). */
  private days(): number { return (this.w.gameSec + 8 * HOUR) / DAY; }
  /** Fraction of the year (0 = the first day of spring). */
  yearF(): number {
    const f = (this.days() + this.cfg.shift) / (4 * this.cfg.seasonDays) + START_F;
    return ((f % 1) + 1) % 1;
  }
  /** Today = where a new world's calendar starts (late spring): for worlds that existed before the weather. */
  startNow(): void { this.cfg.shift = -this.days(); }
  season(): number { return Math.min(3, Math.floor(this.yearF() * 4)); }
  /** Day of the season, 1..seasonDays. */
  seasonDay(): number { return Math.floor((this.yearF() * 4 - this.season()) * this.cfg.seasonDays) + 1; }
  /** The season's mean temperature now (°C). */
  mean(): number { return MEAN + SWING * Math.cos(2 * Math.PI * (this.yearF() - WARMEST)); }
  /** Temperature on map m now (°C). */
  temp(m = 0): number {
    const h = this.w.brain.hour();
    return this.mean() + this.off + this.amp * Math.cos((2 * Math.PI * (h - 15)) / 24) + (this.w.wild(m) ? -1.5 : 0);
  }
  /** Is it cold enough on map m for the cold to hurt someone standing still? */
  cold(m = 0): boolean { return this.cfg.cold && this.temp(m) < COLD_BELOW; }
  /** The lowest temperature of the coming hours (planning a fire): now and 6 hours on, with today's swing. */
  coldSoon(m = 0, hours = 6): boolean {
    if (!this.cfg.cold) return false;
    const h = this.w.brain.hour(), base = this.mean() + this.off + (this.w.wild(m) ? -1.5 : 0);
    for (let d = 0; d <= hours; d += 2) if (base + this.amp * Math.cos((2 * Math.PI * (h + d - 15)) / 24) < COLD_BELOW) return true;
    return false;
  }

  // ------------------------------------------------------------------ the spells
  /** Every 20 ticks (World.step): ease the numbers, start the next spell when this one is over. */
  update(): void {
    const w = this.w, now = w.gameSec;
    const dh = this.lastSec < 0 ? 0 : Math.max(0, (now - this.lastSec) / HOUR);
    this.lastSec = now;
    if (this.forced && now >= this.forced) this.forced = 0;
    if (now >= this.until && !this.forced) this.next();
    // Rain is snow in the cold (and back again).
    const t = this.mean() + this.off + this.amp * Math.cos((2 * Math.PI * (w.brain.hour() - 15)) / 24);
    if (!this.forced) {
      if (this.kind === 'rain' && t < 1) this.kind = 'snow';
      else if (this.kind === 'storm' && t < 1) this.kind = 'blizzard';
      else if (this.kind === 'snow' && t > 2.5) this.kind = 'rain';
      else if (this.kind === 'blizzard' && t > 2.5) this.kind = 'storm';
    }
    const ease = Math.min(1, dh * 0.8);
    this.off += (KIND_OFF[this.kind] - this.off) * ease;
    this.amp += (KIND_AMP[this.kind] - this.amp) * ease;
  }
  private next(): void {
    const odds = ODDS[this.season()]!, r = this.rng.next();
    let acc = 0, kind: WeatherKind = 'clear';
    for (let k = 0; k < odds.length; k++) { acc += odds[k]!; if (r < acc) { kind = DRAW[k]!; break; } }
    // Spells of the same sky last longer; the first one of a world is clear.
    if (this.until === 0) kind = 'clear';
    const t = this.mean() + KIND_OFF[kind];
    if (kind === 'rain' && t < 1) kind = 'snow';
    if (kind === 'storm' && t < 1) kind = 'blizzard';
    if (kind !== this.kind) this.w.emit('weather', { kind, from: this.kind, season: SEASONS[this.season()], t: Math.round(this.temp(0)) });
    this.kind = kind;
    this.k = 0.35 + this.rng.next() * 0.65;
    this.until = this.w.gameSec + (2 + this.rng.next() * 7) * HOUR;
  }
  /** An admin sets the weather (for `hours` game hours, then the usual spells again). */
  set(kind: WeatherKind, hours: number, k?: number): void {
    if (kind !== this.kind) this.w.emit('weather', { kind, from: this.kind, season: SEASONS[this.season()], t: Math.round(this.temp(0)), admin: true });
    this.kind = kind;
    if (k !== undefined) this.k = Math.max(0, Math.min(1, k));
    this.forced = this.until = this.w.gameSec + Math.max(0.1, hours) * HOUR;
    this.off = KIND_OFF[kind]; this.amp = KIND_AMP[kind];
  }
  /** Jump the calendar into season s (a little before its middle). */
  jumpTo(s: number): void {
    const sd = this.cfg.seasonDays, f = this.yearF(), want = (s + 0.4) / 4;
    let df = want - f;
    df = ((df % 1) + 1) % 1;
    this.cfg.shift += df * 4 * sd;
    this.onCfg();
  }

  // ------------------------------------------------------------------ the body
  /** Clothes' warmth of slot i (0..0.8). */
  clothes(i: number): number { return this.w.gear.warmth(i); }
  /**
   * How the cold reaches slot i if they stood at (x, y) on map m: shelter there, exposure 0..1, and the health it would
   * take a game hour standing still (0 when it is not cold).
   */
  warmthAt(i: number, m: number, x: number, y: number): Warmth {
    const w = this.w, sv = w.survival, tm = w.maps[m]!.tiles;
    const fire = sv.warm(m, x, y);
    const k = Math.floor(y) * tm.w + Math.floor(x);
    const hut = !!sv.homes.at(m, k);
    const bed = hut && sv.onBed(m, x, y);
    const cl = this.clothes(i);
    const exposure = fire ? 0 : (1 - cl) * (hut ? HUT * (bed ? BED : 1) : 1);
    const T = this.temp(m);
    const drain = this.cfg.cold && T < COLD_BELOW ? (COLD_BELOW - T) * RATE * exposure : 0;
    return { fire, hut, bed, clothes: cl, exposure, drain };
  }
  /** Where they stand. */
  warmth(i: number): Warmth { const e = this.w.e; return this.warmthAt(i, e.map[i]!, e.x[i]!, e.y[i]!); }
  /** Moving, working or fighting keeps you warm. */
  active(i: number): boolean {
    const e = this.w.e, a = e.act[i]!;
    if (e.flags[i]! & EFlag.Sleeping) return false;
    if (e.flags[i]! & EFlag.Moving) return true;
    return e.kind[i] !== Kind.Player && (a === Act.Gather || a === Act.Build || a === Act.Fight);
  }
  /** Health the cold takes from slot i a game hour now (0 = warm enough, moving, or not cold). */
  chill(i: number): number {
    const e = this.w.e;
    if (!this.cfg.cold || e.map[i]! < 0 || e.map[i]! >= this.w.maps.length || this.active(i)) return 0;
    if (!this.cold(e.map[i]!)) return 0;
    return this.warmth(i).drain;
  }

  /** For the AI's prompts: the season, the weather, the temperature and what the cold means here. */
  promptText(m: number): string {
    const T = Math.round(this.temp(m)), s = SEASONS[this.season()];
    const sky = this.kind === 'clear' ? 'clear sky' : this.kind === 'blizzard' ? 'a blizzard' : this.kind === 'storm' ? 'a storm' : this.kind;
    let t = `Weather: ${s} (day ${this.seasonDay()} of ${this.cfg.seasonDays}), ${sky}, ${T} °C.`;
    if (this.cfg.cold && (T < COLD_BELOW || this.coldSoon(m))) t += ` Under ${COLD_BELOW} °C standing still or sleeping in the open costs health (moving keeps you warm): sleep by a burning fire, in a hut (a bed helps), wear clothes. By a fire wounds heal faster.`;
    return t;
  }
  /** For viewers and the panel. */
  info(m: number): { s: number; sd: number; day: number; w: WeatherKind; k: number; t: number; f: number } {
    return { s: this.season(), sd: this.cfg.seasonDays, day: this.seasonDay(), w: this.kind, k: Math.round(this.k * 100) / 100, t: Math.round(this.temp(m) * 10) / 10, f: Math.round(this.yearF() * 1000) / 1000 };
  }
}

export { WARMTH };
