import { WARMTH,
  Act, Kind, SLOT_OF, SLOTS, UPGRADABLE, MAX_LEVEL, MAX_QUALITY, WEAPONS, DEFENCE, baseOf, gearMul, levelCost, qualityCost, qualityNeedsLevel, qualityReady, defenceOf, shownLevel, packGear,
  type Anim, type GearState, type Slot,
} from '@worldsim/protocol';
import type { World } from './world.js';

/**
 * Gear (imad 2026-11-25): which weapon / clothes a person uses, upgrades (level 1..50 kept as 0..49, quality normal .. legendary), and what
 * the viewers see them doing (the animation sent in frames). Kept in `Profile.gear` (players' characters have profiles
 * too), so it is saved with the world. The bag itself stays in Survival (counts per item).
 *
 * A slot left empty uses the best item carried (people never need to think about it); a player picks on the gear screen
 * (Do `equip` "slot:item", '' = best, '-' = nothing) and upgrades there (Do `upgrade` "item:lv" | "item:q").
 */
export const ANIM_SECS = 0.9;

export class Gear {
  /** A one-off move (a swing, a chop...) shown until `until` (tick), and a counter so a new one restarts it. */
  private readonly anim: Uint8Array;
  private readonly seq: Uint8Array;
  private readonly until: Float64Array;
  /** Players holding the aim button with a bow: the bow is drawn and held (Do `aim` 1 / 0). */
  readonly aiming: Uint8Array;
  private lastHour = -1;

  constructor(private readonly w: World) {
    const cap = w.e.cap;
    this.anim = new Uint8Array(cap); this.seq = new Uint8Array(cap); this.until = new Float64Array(cap); this.aiming = new Uint8Array(cap);
  }

  state(i: number): GearState {
    const p = this.w.profileOf(i);
    if (!p) return {};
    return ((p as { gear?: GearState }).gear ??= {});
  }
  /** [level, quality] of an item type for this person. */
  up(i: number, item: string): [number, number] { return this.state(i).up?.[item] ?? [0, 0]; }
  /** How strong an item is for this person (damage for weapons, the share of a bite taken off for clothes). */
  power(i: number, item: string): number { const [lv, q] = this.up(i, item); return baseOf(item) * gearMul(lv, q); }

  /** The item used in a slot: the one chosen if still carried, nothing if '-', else the strongest carried. */
  equipped(i: number, slot: Slot): string {
    const inv = this.w.survival.inv(i), want = this.state(i)[slot];
    if (want === '-') return '';
    if (want && (inv[want] ?? 0) > 0 && SLOT_OF[want] === slot) return want;
    let best = '', bp = 0;
    for (const [k, s] of Object.entries(SLOT_OF)) {
      if (s !== slot || (inv[k] ?? 0) < 1) continue;
      const p = this.power(i, k);
      if (p > bp) { bp = p; best = k; }
    }
    return best;
  }
  /** The weapon in hand and its damage (0 = bare hands). */
  weapon(i: number): [string, number] {
    const k = this.equipped(i, 'weapon');
    return k && WEAPONS[k] ? [k, this.power(i, k)] : ['', 0];
  }
  /** A bow shot's damage multiplier (level / quality of the bow). */
  bowMul(i: number): number { const [lv, q] = this.up(i, 'bow'); return gearMul(lv, q); }
  /** What worn things take off a bite (0..0.8, `defenceOf`: levels keep counting, more and more slowly). */
  defence(i: number): number {
    const b = this.equipped(i, 'body'), h = this.equipped(i, 'head');
    return defenceOf((b && DEFENCE[b] ? this.power(i, b) : 0) + (h && DEFENCE[h] ? this.power(i, h) : 0));
  }

  /** How much of the cold worn things keep off (0..0.8; WARMTH x level / quality). */
  warmth(i: number): number {
    let v = 0;
    for (const slot of ['body', 'head'] as const) {
      const k = this.equipped(i, slot);
      if (k && WARMTH[k]) { const [lv, q] = this.up(i, k); v += WARMTH[k]! * gearMul(lv, q); }
    }
    return Math.min(0.8, v);
  }

  /** A player picks what to use: "slot:item" ('' = the best carried, '-' = nothing). */
  equip(i: number, text: string): { ok: boolean; code: string } {
    const [slot0, item0] = text.split(':'), slot = slot0 as Slot, item = (item0 ?? '').trim();
    if (!SLOTS.includes(slot)) return { ok: false, code: 'nothing' };
    if (item && item !== '-' && (SLOT_OF[item] !== slot || (this.w.survival.inv(i)[item] ?? 0) < 1)) return { ok: false, code: 'notCarried' };
    const st = this.state(i);
    if (item) st[slot] = item; else delete st[slot];
    return { ok: true, code: 'equipped' };
  }

  /** Level up ("item:lv") or raise the quality ("item:q") of an item carried, paying the materials. */
  upgrade(i: number, text: string): { ok: boolean; code: string; item?: string; lv?: number; q?: number; need?: Record<string, number> } {
    const [item = '', kind = 'lv'] = text.split(':');
    const sv = this.w.survival, inv = sv.inv(i);
    if (!UPGRADABLE.includes(item) || (inv[item] ?? 0) < 1) return { ok: false, code: 'notCarried', item };
    const [lv, q] = this.up(i, item);
    let cost: Record<string, number>;
    if (kind === 'q') {
      if (q >= MAX_QUALITY) return { ok: false, code: 'maxQuality', item, lv, q };
      if (!qualityReady(lv, q)) return { ok: false, code: 'needLevel', item, lv, q, need: { level: qualityNeedsLevel(q) } };
      cost = qualityCost(item, q) as Record<string, number>;
    } else {
      if (lv >= MAX_LEVEL) return { ok: false, code: 'maxLevel', item, lv, q };
      cost = levelCost(item, lv) as Record<string, number>;
    }
    const lack: Record<string, number> = {};
    for (const [k, n] of Object.entries(cost)) if ((inv[k] ?? 0) < n) lack[k] = n - (inv[k] ?? 0);
    if (Object.keys(lack).length) return { ok: false, code: 'upNeed', item, lv, q, need: lack };
    for (const [k, n] of Object.entries(cost)) sv.add(i, k, -n);
    const st = this.state(i), nv: [number, number] = kind === 'q' ? [lv, q + 1] : [lv + 1, q];
    (st.up ??= {})[item] = nv;
    this.w.emit('upgrade', { id: this.w.e.id(i), item, lv: nv[0], q: nv[1], player: this.w.e.kind[i] === Kind.Player });
    this.play(i, 'build');
    return { ok: true, code: 'upgraded', item, lv: nv[0], q: nv[1] };
  }

  /** Show a one-off move on viewers (a swing, a chop, a shot...). */
  play(i: number, a: Anim, secs = ANIM_SECS): void {
    const k = ['', 'attack', 'chop', 'mine', 'build', 'talk', 'shoot', 'use'].indexOf(a);
    this.anim[i] = Math.max(0, k);
    this.seq[i] = (this.seq[i]! + 1) & 15;
    this.until[i] = this.w.tick + Math.max(1, Math.round(secs * this.w.opt.tickRate));
  }

  /** The packed gear + animation of a person for frames (0 for anything else). */
  code(i: number): number {
    const w = this.w, e = w.e, kd = e.kind[i];
    if (kd !== Kind.Agent && kd !== Kind.Player) return 0;
    const wp = this.equipped(i, 'weapon'), bow = this.equipped(i, 'ranged'), head = this.equipped(i, 'head'), body = this.equipped(i, 'body');
    let anim: Anim = '', aim = false;
    if (this.aiming[i] && (kd !== Kind.Player || (w.survival.inv(i).bow ?? 0) < 1)) this.aiming[i] = 0;
    if (this.until[i]! > w.tick) anim = (['', 'attack', 'chop', 'mine', 'build', 'talk', 'shoot', 'use'] as const)[this.anim[i]!] ?? '';
    else if (this.aiming[i]) { anim = 'shoot'; aim = true; }
    else {
      const a = e.act[i];
      if (a === Act.Fight) anim = 'attack';
      else if (a === Act.Build) anim = 'build';
      else if (a === Act.Talk) anim = 'talk';
      else if (a === Act.Gather) anim = this.nearTree(i) ? 'chop' : 'mine';
    }
    const shooting = anim === 'shoot';
    const held = shooting ? 'bow' : wp || (bow && !wp ? 'bow' : '');
    return packGear({
      held, hq: held ? this.up(i, held)[1] : 0,
      helmet: head === 'helmet', headQ: head ? this.up(i, head)[1] : 0,
      body: body === 'armor' ? 'armor' : body === 'clothes' ? 'clothes' : '', bodyQ: body ? this.up(i, body)[1] : 0,
      anim, seq: this.seq[i]!, back: !!bow && held !== 'bow', aim,
    });
  }
  private nearTree(i: number): boolean {
    const w = this.w, e = w.e, tm = w.maps[e.map[i]!]?.tiles, T = w.survival.T.tree;
    if (!tm || T < 0) return false;
    const cx = Math.floor(e.x[i]!), cy = Math.floor(e.y[i]!);
    for (let y = cy - 1; y <= cy + 1; y++) for (let x = cx - 1; x <= cx + 1; x++) if (tm.inside(x, y) && tm.get(x, y) === T) return true;
    return false;
  }

  /** The next upgrade worth working for on this item: quality when the level allows it, else a level ('' = at its best). */
  next(i: number, item: string): '' | 'lv' | 'q' {
    const [lv, q] = this.up(i, item);
    if (qualityReady(lv, q)) return 'q';
    return lv < MAX_LEVEL ? 'lv' : '';
  }
  /** What that next upgrade still lacks (materials -> how many more). */
  lacks(i: number, item: string, kind: 'lv' | 'q'): Record<string, number> {
    const [lv, q] = this.up(i, item), inv = this.w.survival.inv(i), cost = (kind === 'q' ? qualityCost(item, q) : levelCost(item, lv)) as Record<string, number>;
    const lack: Record<string, number> = {};
    for (const [k, n] of Object.entries(cost)) if ((inv[k] ?? 0) < n) lack[k] = n - (inv[k] ?? 0);
    return lack;
  }
  /** The bow and what is worn, with levels, and what the next upgrade still lacks (prompts). */
  gearText(i: number): string {
    const out: string[] = [];
    for (const slot of ['ranged', 'head', 'body'] as const) { const k = this.equipped(i, slot); if (k) out.push(this.label(i, k)); }
    const wp = this.equipped(i, 'weapon') || this.equipped(i, 'ranged');
    let next = '';
    if (wp) {
      const kind = this.next(i, wp);
      if (kind) {
        const lack = Object.entries(this.lacks(i, wp, kind)).map(([k, n]) => `${n} ${k}`).join(', ');
        next = ` Next for the ${wp}: ${kind === 'q' ? 'higher quality' : 'a level'}${lack ? `, needs ${lack} more` : ', you have what it takes (upgrade)'}.`;
      }
    }
    return (out.length ? ` Also: ${out.join(', ')}.` : '') + next;
  }
  /** "sword Lv 12 rare" for prompts and the panel. */
  label(i: number, item: string): string {
    const [lv, q] = this.up(i, item);
    return `${item} Lv ${shownLevel(lv)}${q ? ' ' + ['normal', 'fine', 'rare', 'epic', 'legendary'][q] : ''}`;
  }

  /**
   * Hourly: people (not players) improve what they use with what they carry, as a player would on the gear screen
   * (imad 2026-11-27: "AI people use the system too"): quality first when the level allows it, else a level, one step per
   * slot an hour; they keep a little back of what the camp needs most (leather for huts while homeless, some wood and stone).
   */
  update(): void {
    const w = this.w, h = Math.floor(w.gameSec / 3600);
    if (h === this.lastHour) return;
    this.lastHour = h;
    const e = w.e, sv = w.survival;
    for (let i = 0; i < e.hi; i++) {
      if (e.kind[i] !== Kind.Agent || e.hp[i]! <= 0 || w.profileOf(i)?.player) continue;
      const homeless = !sv.homes.homeOf(e.id(i));
      const keep: Record<string, number> = { leather: homeless ? 6 : 1, wood: 3, stone: 2 };
      for (const slot of SLOTS) {
        const item = this.equipped(i, slot);
        if (!item) continue;
        const kind = this.next(i, item);
        if (!kind) continue;
        const [lv, q] = this.up(i, item), inv = sv.inv(i);
        const cost = (kind === 'q' ? qualityCost(item, q) : levelCost(item, lv)) as Record<string, number>;
        if (Object.entries(cost).every(([k, n]) => (inv[k] ?? 0) >= n + (keep[k] ?? 0))) this.upgrade(i, `${item}:${kind}`);
      }
    }
  }
}
