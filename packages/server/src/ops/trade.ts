import { Kind, gearMul, TRADE_NEAR, TRADE_APART, TRADE_INVITE_MS, TRADE_MAX_KINDS, type TradeSide, type TradeView } from '@worldsim/protocol';
import { NO_MAP } from '../sim/entities.js';
import type { World } from '../sim/world.js';

/**
 * Trading between two players (imad 2026-11-27), the protocol in @worldsim/protocol trade.ts.
 * A player invites another player standing near; once the other says yes, both see one trade screen: each puts things from
 * their bag on their side, each accepts, and when both have accepted the swap happens at once. Any change to an offer
 * takes both acceptances back (nobody is tricked by a last-second swap). Nothing leaves a bag before the swap: the swap
 * checks again that each still has what they offered and that the other has room for it, else nothing moves.
 * Only characters played by hand (Kind.Player) of players whose TV is connected; memory only (a restart closes trades).
 */
interface Side { slot: number; id: number; name: string; offer: Record<string, number>; ok: boolean }
interface Trade { a: Side; b: Side; ver: number }
interface Invite { from: number; to: number; at: number }

export type TradeAnswer = Record<string, unknown> & { ok: boolean; code: string };

export class Trades {
  private open = new Map<number, Trade>(); // entity id (either side) -> trade
  private invites: Invite[] = [];
  /** Is this character's player connected now? */
  online: (slot: number) => boolean = () => true;
  /** A notice for the player of that character. */
  notice: (slot: number, kind: string, data: unknown) => void = () => {};

  constructor(private w: World) {}

  /** Do `trade` from the player whose character is in `slot`. */
  act(slot: number, name: string, text: string): TradeAnswer {
    const w = this.w, e = w.e, me = e.id(slot);
    this.check();
    const [verb = 'view', a1 = '', a2 = ''] = text.split(':');
    const t = this.open.get(me);
    switch (verb) {
      case 'ask': {
        const j = e.slot(Number(a1));
        const why = this.canTrade(slot, j);
        if (why) return { ok: false, code: why };
        const back = this.invites.find((v) => v.from === e.id(j) && v.to === me);
        if (back) return this.start(j, slot); // they asked me too: open now
        this.invites = this.invites.filter((v) => !(v.from === me && v.to === e.id(j)));
        this.invites.push({ from: me, to: e.id(j), at: Date.now() });
        this.notice(j, 'trade', { state: 'invite', id: me, name: this.nameOf(slot, name) });
        return { ok: true, code: 'tradeAsked', name: this.nameOf(j) };
      }
      case 'yes': case 'no': {
        const from = Number(a1), k = this.invites.findIndex((v) => v.from === from && v.to === me);
        if (k < 0) return { ok: false, code: 'tradeNoInvite' };
        this.invites.splice(k, 1);
        const j = e.slot(from);
        if (verb === 'no') { if (j >= 0) this.notice(j, 'did', { a: 'trade', ok: false, code: 'tradeRefused', name: this.nameOf(slot, name) }); return { ok: true, code: 'tradeDeclined' }; }
        const why = this.canTrade(slot, j);
        if (why) return { ok: false, code: why };
        return this.start(j, slot);
      }
      case 'put': {
        if (!t) return { ok: false, code: 'tradeNone' };
        const s = this.side(t, me), item = a1, n = Math.trunc(Number(a2));
        if (!/^[a-z]+$/.test(item) || !Number.isFinite(n) || n === 0) return { ok: false, code: 'tradeBad', trade: this.view(t, me) };
        const cur = s.offer[item] ?? 0, want = Math.max(0, Math.min(this.has(slot, item), cur + n));
        if (want === cur) return { ok: false, code: n > 0 ? 'tradeNoMore' : 'tradeBad', trade: this.view(t, me) };
        if (!cur && Object.keys(s.offer).length >= TRADE_MAX_KINDS) return { ok: false, code: 'tradeTooMany', trade: this.view(t, me) };
        if (want) s.offer[item] = want; else delete s.offer[item];
        t.a.ok = t.b.ok = false; t.ver++;
        this.push(t, me);
        return { ok: true, code: 'trade', trade: this.view(t, me) };
      }
      case 'ok': {
        if (!t) return { ok: false, code: 'tradeNone' };
        const s = this.side(t, me);
        s.ok = a1 !== '0';
        if (s.ok && !Object.keys(t.a.offer).length && !Object.keys(t.b.offer).length) { s.ok = false; return { ok: false, code: 'tradeEmpty', trade: this.view(t, me) }; }
        if (t.a.ok && t.b.ok) return this.swap(t, me);
        this.push(t, me);
        return { ok: true, code: 'trade', trade: this.view(t, me) };
      }
      case 'cancel': {
        if (!t) { this.invites = this.invites.filter((v) => v.from !== me); return { ok: true, code: 'tradeClosed' }; }
        this.close(t, 'cancelled', me);
        return { ok: true, code: 'tradeClosed', trade: { ...this.view(t, me), state: 'closed', why: 'cancelled' } };
      }
      default:
        return t ? { ok: true, code: 'trade', trade: this.view(t, me) } : { ok: false, code: 'tradeNone' };
    }
  }

  /** Is this character in a trade now? */
  trading(slot: number): boolean { return this.open.has(this.w.e.id(slot)); }

  /** Close trades whose two sides walked apart, left, went through a gate or were taken over by the autopilot; drop old invites. */
  check(): void {
    const now = Date.now();
    this.invites = this.invites.filter((v) => now - v.at < TRADE_INVITE_MS);
    for (const t of new Set(this.open.values())) {
      const why = this.broken(t);
      if (why) this.close(t, why, -1);
    }
  }

  // ------------------------------------------------------------------------------------------------------------------------
  private nameOf(slot: number, fallback = ''): string { return this.w.charName(slot) || fallback || this.w.profileOf(slot)?.name || '?'; }

  /** Why these two can't open a trade now, or ''. */
  private canTrade(i: number, j: number): string {
    const e = this.w.e;
    if (j < 0 || j === i || !e.alive(j)) return 'tradeNobody';
    if (e.kind[j] !== Kind.Player || !this.online(j)) return 'tradeNotPlayer';
    if (e.map[i] === NO_MAP || e.map[j] !== e.map[i]) return 'tradeTooFar';
    if (Math.hypot(e.x[j]! - e.x[i]!, e.y[j]! - e.y[i]!) > TRADE_NEAR) return 'tradeTooFar';
    if (this.open.has(e.id(i))) return 'tradeBusyMe';
    if (this.open.has(e.id(j))) return 'tradeBusy';
    return '';
  }

  private broken(t: Trade): string {
    const e = this.w.e;
    for (const s of [t.a, t.b]) {
      if (e.slot(s.id) !== s.slot || !e.alive(s.slot) || e.kind[s.slot] !== Kind.Player || !this.online(s.slot)) return 'left';
    }
    if (e.map[t.a.slot] === NO_MAP || e.map[t.a.slot] !== e.map[t.b.slot]) return 'apart';
    if (Math.hypot(e.x[t.a.slot]! - e.x[t.b.slot]!, e.y[t.a.slot]! - e.y[t.b.slot]!) > TRADE_APART) return 'apart';
    return '';
  }

  private start(i: number, j: number): TradeAnswer {
    const e = this.w.e;
    const mk = (s: number): Side => ({ slot: s, id: e.id(s), name: this.nameOf(s), offer: {}, ok: false });
    const t: Trade = { a: mk(i), b: mk(j), ver: 0 };
    this.open.set(t.a.id, t); this.open.set(t.b.id, t);
    this.invites = this.invites.filter((v) => v.from !== t.a.id && v.from !== t.b.id && v.to !== t.a.id && v.to !== t.b.id);
    this.w.emit('tradeOpen', { a: t.a.id, b: t.b.id });
    this.notice(i, 'trade', this.view(t, t.a.id));
    this.notice(j, 'trade', this.view(t, t.b.id));
    return { ok: true, code: 'trade', trade: this.view(t, t.b.id) }; // j answered (or asked back): the answer is theirs
  }

  private side(t: Trade, me: number): Side { return t.a.id === me ? t.a : t.b; }
  private other(t: Trade, me: number): Side { return t.a.id === me ? t.b : t.a; }

  /** How many of `item` this character can give: food = hands + bag. */
  private has(i: number, item: string): number {
    const sv = this.w.survival;
    return item === 'food' ? sv.foodOf(i) : sv.inv(i)[item] ?? 0;
  }

  /** The upgrades that would go with each item: only when it is the giver's last one (an item's level belongs to the person). */
  private ups(s: Side): Record<string, [number, number]> {
    const out: Record<string, [number, number]> = {};
    for (const [k, n] of Object.entries(s.offer)) {
      const u = this.w.gear.up(s.slot, k);
      if ((u[0] || u[1]) && n >= this.has(s.slot, k)) out[k] = [u[0], u[1]];
    }
    return out;
  }

  private view(t: Trade, me: number): TradeView {
    const out = (s: Side): TradeSide => ({ id: s.id, name: s.name, offer: { ...s.offer }, up: this.ups(s), ok: s.ok });
    return { state: 'open', me: out(this.side(t, me)), them: out(this.other(t, me)), ver: t.ver };
  }

  /** Tell the other side what changed. */
  private push(t: Trade, me: number): void { const o = this.other(t, me); this.notice(o.slot, 'trade', this.view(t, o.id)); }

  private close(t: Trade, why: string, by: number): void {
    this.open.delete(t.a.id); this.open.delete(t.b.id);
    for (const s of [t.a, t.b]) if (s.id !== by) this.notice(s.slot, 'trade', { ...this.view(t, s.id), state: 'closed', why });
    this.w.emit('tradeClose', { a: t.a.id, b: t.b.id, why });
  }

  /** Both accepted: check everything again, then move it all at once (or nothing). */
  private swap(t: Trade, me: number): TradeAnswer {
    const sv = this.w.survival;
    const fail = (code: string, who: Side): TradeAnswer => {
      t.a.ok = t.b.ok = false; t.ver++;
      for (const s of [t.a, t.b]) if (s.id !== me) this.notice(s.slot, 'did', { a: 'trade', ok: false, code, name: who.name, trade: this.view(t, s.id) });
      this.push(t, me);
      return { ok: false, code, name: who.name, trade: this.view(t, me) };
    };
    for (const s of [t.a, t.b]) for (const [k, n] of Object.entries(s.offer)) if (this.has(s.slot, k) < n) return fail('tradeLost', s);
    for (const [s, o] of [[t.a, t.b], [t.b, t.a]] as const) {
      for (const [k, n] of Object.entries(o.offer)) {
        const keep = this.has(s.slot, k) - (s.offer[k] ?? 0);
        const room = k === 'food' ? sv.foodRoom(s.slot) + (s.offer.food ?? 0) : sv.capOf(k) - keep;
        if (room < n) return fail('tradeNoRoom', s);
      }
    }
    const ua = this.ups(t.a), ub = this.ups(t.b);
    // Take both offers out first, then put them in (so a side that gives 5 food and gets 5 food has room).
    for (const s of [t.a, t.b]) for (const [k, n] of Object.entries(s.offer)) { if (k === 'food') sv.useFood(s.slot, n); else sv.add(s.slot, k, -n); }
    for (const [s, o, u] of [[t.a, t.b, ub], [t.b, t.a, ua]] as const) {
      for (const [k, n] of Object.entries(o.offer)) { if (k === 'food') sv.addFood(s.slot, n); else sv.add(s.slot, k, n); }
      for (const [k, lv] of Object.entries(u)) this.moveUp(o.slot, s.slot, k, lv);
    }
    sv.refill(t.a.slot); sv.refill(t.b.slot);
    this.open.delete(t.a.id); this.open.delete(t.b.id);
    this.w.emit('trade', { a: t.a.id, b: t.b.id, aGave: { ...t.a.offer }, bGave: { ...t.b.offer } });
    const done = (s: Side): TradeView => ({ ...this.view(t, s.id), state: 'done', got: { ...this.other(t, s.id).offer } });
    for (const s of [t.a, t.b]) if (s.id !== me) this.notice(s.slot, 'trade', done(s));
    return { ok: true, code: 'traded', trade: done(this.side(t, me)) };
  }

  /** The giver's last upgraded item went over: its level / quality goes with it, unless the receiver's own is better. */
  private moveUp(from: number, to: number, item: string, u: [number, number]): void {
    const g = this.w.gear, fs = g.state(from), ts = g.state(to);
    const mine = g.up(to, item);
    if (gearMul(u[0], u[1]) > gearMul(mine[0], mine[1])) (ts.up ??= {})[item] = [u[0], u[1]];
    if (fs.up) delete fs.up[item];
  }
}
