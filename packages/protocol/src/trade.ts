/**
 * Trading between two players (imad 2026-11-27: "a player can open a trade screen with another player and trade stuff").
 * One shape for the server (ops/trade.ts) and the TV (client tradeui.ts).
 *
 * Do `trade` text:
 *   ask:<their character id>  invite a player standing near me (TRADE_NEAR m), playing by hand and online
 *   yes:<their id> / no:<id>  answer an invite (both asking each other = opened at once)
 *   put:<item>:<n>            add n of an item to my offer (n < 0 takes some back); every change clears both "accept"s
 *   ok:1 | ok:0               accept / take back; both accepted = the swap happens at once (checked again: still have it, room)
 *   cancel                    close it for both;  view = the current state
 * The server answers with code + `trade` (TradeView) and sends Notice `trade` (TradeView | { state: 'invite' ... }) to the other side.
 */
export const TRADE_NEAR = 6;
/** Farther apart than this, an open trade closes by itself. */
export const TRADE_APART = 14;
/** An invite is good for this long (ms). */
export const TRADE_INVITE_MS = 60_000;
/** Different things on one side at most. */
export const TRADE_MAX_KINDS = 12;

export interface TradeSide {
  id: number;
  name: string;
  /** item -> how many. 'food' = food from the hands and the bag. */
  offer: Record<string, number>;
  /** Gear upgrades that go with an item (only when it is the giver's last one): item -> [level, quality]. */
  up: Record<string, [number, number]>;
  ok: boolean;
}
export interface TradeView {
  state: 'open' | 'done' | 'closed';
  me: TradeSide;
  them: TradeSide;
  /** Changes so far (the TV highlights a fresh change before I accept). */
  ver: number;
  /** Why it closed (cancelled | apart | left | ...). */
  why?: string;
  /** What I got (state done). */
  got?: Record<string, number>;
}
export interface TradeInvite { state: 'invite'; id: number; name: string }
