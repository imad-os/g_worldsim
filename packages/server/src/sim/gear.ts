import {
  Act, Kind, SLOT_OF, SLOTS, UPGRADABLE, MAX_LEVEL, WEAPONS, DEFENCE, baseOf, gearMul, levelCost, qualityCost, qualityNeedsLevel, packGear,
  type Anim, type GearState, type Slot,
} from '@worldsim/protocol';
import type { World } from './world.js';

/**
 * Gear (imad 2026-11-25): which weapon / clothes a person uses, upgrades (level +0..+10, quality normal .. elite), and what
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
  /** What worn things take off a bite (0..0.7). */
  defence(i: number): number {
    const b = this.equipped(i, 'body'), h = this.equipped(i, 'head');
    const v = (b && DEFENCE[b] ? this.power(i, b) : 0) + (h && DEFENCE[h] ? this.power(i, h) : 0);
    return Math.min(0.7, v);
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
      if (q >= 4) return { ok: false, code: 'maxQuality', item, lv, q };
      if (lv < qualityNeedsLevel(q)) return { ok: false, code: 'needLevel', item, lv, q, need: { level: qualityNeedsLevel(q) } };
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

  /** Hourly: people (not players) with plenty of spare materials level up what they use (up to +3 on their own). */
  update(): void {
    const w = this.w, h = Math.floor(w.gameSec / 3600);
    if (h === this.lastHour) return;
    this.lastHour = h;
    const e = w.e;
    for (let i = 0; i < e.hi; i++) {
      if (e.kind[i] !== Kind.Agent || e.hp[i]! <= 0 || w.profileOf(i)?.player) continue;
      for (const slot of ['weapon', 'body'] as const) {
        const item = this.equipped(i, slot);
        if (!item) continue;
        const [lv] = this.up(i, item);
        if (lv >= 3) continue;
        const inv = w.survival.inv(i), cost = levelCost(item, lv);
        if (Object.entries(cost).every(([k, n]) => (inv[k] ?? 0) >= 2 * n! + 2)) this.upgrade(i, `${item}:lv`);
      }
    }
  }
}
