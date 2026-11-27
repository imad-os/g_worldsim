import { Act, Kind } from '@worldsim/protocol';
import { NO_MAP } from '../sim/entities.js';
import type { Db } from '../persist/db.js';
import type { World, WorldEvent } from '../sim/world.js';
import type { Planner } from './planner.js';

/**
 * Chat for a player's own character (imad 2026-11-25: "a chat tab where people can talk to me when needed: I order someone to
 * do a long task and when he is done he says to me done; also a world channel and a clan channel, I talk to them and they talk
 * to me"). Panel page "Chat" (packages/panel/src/chat.ts), for an account with a character.
 *
 * Channels:
 * - `world`: everyone. A player's message gets at most ONE answer from an AI person: the one named in it, else (when the AI is
 *   up, at most every 20 s) someone who knows the speaker. Big moments of the world are posted here by the engine (births,
 *   weddings, deaths, a zombie alarm, a new camp leader): built-in lines, no AI call.
 * - `clan:<id>`: the members of a clan. A message gets up to 2 answers from members (named first, then the most loyal); the
 *   clan leader's words are heard as their leader's (loyal members obey, Planner.chat). An AI leader's order of the day, joins
 *   and elections are posted here.
 * - `dm:<a>:<b>` (a < b, character / person entity ids): one to one. An AI person answers every message (one at a time; what
 *   arrives while they think is answered next, together) through Planner.chat, so orders and plans work from far away
 *   ("go build a hut" -> a task). When a task someone gave in words ends, the person writes to them by themselves: "Done: ..."
 *   or "I couldn't ...: why". A person on a task for a player who gets badly hurt or starving says so too. Two players' characters
 *   chat person to person (no AI).
 *
 * LLM calls stay bounded: every answer is ONE Planner.chat (the Ai class's hourly budget, 2 at once, the fallback brain), one
 * at a time per person, and no unnamed answers in the world / clan channels while the AI is not ready (no built-in chatter).
 * Kept in SQLite `chat_msgs` (the last 400 per channel); read marks in meta `chat_read:<character id>`.
 */
export interface ChatMsg { id: number; chan: string; at: number; game: number; from: number; name: string; text: string; sys: number }
export interface ChanInfo { chan: string; kind: 'world' | 'clan' | 'dm'; title: string; with?: number; withPlayer?: boolean; last?: ChatMsg; unread: number }

const KEEP = 400;
const MAX_TEXT = 400;
const WORLD_GAP_MS = 20_000, CLAN_GAP_MS = 10_000, SEND_GAP_MS = 1200;

export interface ChatHooks {
  /** A player's character entity id by player name (-1 = none). */
  charOf(name: string): number;
  /** The player name of a character entity id ('' = not a player's character). */
  playerOf(id: number): string;
  /** Can the AI answer now (on, a model, budget left)? */
  aiReady(): boolean;
  /** A new message: tell the panels of the players who can read it (`to` = player names; null = everyone). */
  notify(to: string[] | null, m: ChatMsg): void;
  /** A world-channel line, for the TVs' chat log (bottom left). */
  world?(m: ChatMsg): void;
}

export class Chats {
  private writes = 0;
  private busy = new Set<number>();             // people thinking of an answer
  private again = new Map<number, () => void>(); // their next answer (newest words while busy)
  private lastSend = new Map<number, number>();
  private chanGap = new Map<string, number>();
  private alarmAt = new Map<string, number>();
  private hurtTold = new Set<string>();
  /** Answers still on the way (tests wait for them). */
  pending = 0;

  constructor(private db: Db, private w: World, private planner: Planner, private h: ChatHooks) {
    db.sql.exec(`CREATE TABLE IF NOT EXISTS chat_msgs (
      id INTEGER PRIMARY KEY AUTOINCREMENT, chan TEXT NOT NULL, at INTEGER NOT NULL, game INTEGER NOT NULL,
      "from" INTEGER NOT NULL, name TEXT NOT NULL, text TEXT NOT NULL, sys INTEGER NOT NULL DEFAULT 0);
      CREATE INDEX IF NOT EXISTS chat_chan ON chat_msgs(chan, id);`);
    w.listeners.push((ev) => { try { this.onEvent(ev); } catch { /* chat never breaks the world */ } });
  }

  // ------------------------------------------------------------------ channels
  static dm(a: number, b: number): string { return a < b ? `dm:${a}:${b}` : `dm:${b}:${a}`; }
  private name(id: number): string { return this.w.profiles.get(id)?.name || this.h.playerOf(id) || `#${id}`; }
  private clanChan(id: number): string { const c = this.w.clans.clanOf(id); return c ? `clan:${c.id}` : ''; }
  /** Who may read a channel: world = all; clan = members; dm = the two. */
  canRead(me: number, chan: string): boolean {
    if (chan === 'world') return true;
    if (chan.startsWith('clan:')) return this.clanChan(me) === chan;
    const m = /^dm:(\d+):(\d+)$/.exec(chan);
    return !!m && (Number(m[1]) === me || Number(m[2]) === me);
  }
  private other(me: number, chan: string): number { const m = /^dm:(\d+):(\d+)$/.exec(chan)!; return Number(m[1]) === me ? Number(m[2]) : Number(m[1]); }
  /** Player names that read a channel (for live notices). */
  private readers(chan: string): string[] | null {
    if (chan === 'world') return null;
    const dm = /^dm:(\d+):(\d+)$/.exec(chan);
    const ids = dm ? [Number(dm[1]), Number(dm[2])] : (this.w.clans.clans.find((c) => `clan:${c.id}` === chan)?.members ?? []);
    return ids.map((id) => this.h.playerOf(id)).filter(Boolean);
  }

  // ------------------------------------------------------------------ storage
  post(chan: string, from: number, text: string, sys = false, name?: string): ChatMsg | null {
    const t = text.replace(/\s+/g, ' ').trim().slice(0, MAX_TEXT);
    if (!t) return null;
    const m: ChatMsg = { id: 0, chan, at: Date.now(), game: Math.floor(this.w.gameSec), from, name: name ?? (from >= 0 ? this.name(from) : ''), text: t, sys: sys ? 1 : 0 };
    m.id = Number(this.db.sql.prepare('INSERT INTO chat_msgs (chan, at, game, "from", name, text, sys) VALUES (?, ?, ?, ?, ?, ?, ?)')
      .run(m.chan, m.at, m.game, m.from, m.name, m.text, m.sys).lastInsertRowid);
    if (++this.writes % 50 === 0) this.db.sql.prepare('DELETE FROM chat_msgs WHERE chan = ? AND id <= (SELECT id FROM chat_msgs WHERE chan = ? ORDER BY id DESC LIMIT 1 OFFSET ?)').run(chan, chan, KEEP);
    this.h.notify(this.readers(chan), m);
    if (chan === 'world') this.h.world?.(m);
    return m;
  }
  private marks(me: number): Record<string, number> { try { return JSON.parse(this.db.getMeta(`chat_read:${me}`) ?? '{}') as Record<string, number>; } catch { return {}; } }
  private lastOf(chan: string): ChatMsg | undefined { return this.db.sql.prepare('SELECT * FROM chat_msgs WHERE chan = ? ORDER BY id DESC LIMIT 1').get(chan) as unknown as ChatMsg | undefined; }
  private unread(chan: string, me: number, after: number): number {
    return Number((this.db.sql.prepare('SELECT COUNT(*) AS n FROM chat_msgs WHERE chan = ? AND id > ? AND "from" != ?').get(chan, after, me) as { n: number }).n);
  }

  /** My channels (world, my clan, my direct chats, newest first) + the people I can write to. */
  list(me: number): { me: number; chans: ChanInfo[]; people: { id: number; name: string; map: string; player: boolean; clan: string }[] } {
    const marks = this.marks(me), w = this.w, e = w.e;
    const chans: ChanInfo[] = [];
    const add = (chan: string, kind: ChanInfo['kind'], title: string, x: Partial<ChanInfo> = {}) =>
      chans.push({ chan, kind, title, last: this.lastOf(chan), unread: this.unread(chan, me, marks[chan] ?? 0), ...x });
    add('world', 'world', 'World');
    const c = w.clans.clanOf(me);
    if (c) add(`clan:${c.id}`, 'clan', `Clan ${c.name}`);
    const rows = this.db.sql.prepare('SELECT DISTINCT chan FROM chat_msgs WHERE chan LIKE ? OR chan LIKE ?').all(`dm:${me}:%`, `dm:%:${me}`) as { chan: string }[];
    const dms: ChanInfo[] = [];
    for (const r of rows) {
      const o = this.other(me, r.chan);
      dms.push({ chan: r.chan, kind: 'dm', title: this.name(o), with: o, withPlayer: !!this.h.playerOf(o), last: this.lastOf(r.chan), unread: this.unread(r.chan, me, marks[r.chan] ?? 0) });
    }
    dms.sort((a, b) => (b.last?.id ?? 0) - (a.last?.id ?? 0));
    chans.push(...dms);
    const people: { id: number; name: string; map: string; player: boolean; clan: string }[] = [];
    for (const [id, p] of w.profiles) {
      const i = e.slot(id);
      if (i < 0 || id === me || (e.kind[i] !== Kind.Agent && e.kind[i] !== Kind.Player)) continue;
      const mi = e.map[i]! === NO_MAP ? e.toMap[i]! : e.map[i]!;
      people.push({ id, name: p.name, map: w.maps[mi]?.def.name ?? '', player: !!p.player, clan: w.clans.clanOf(id)?.name ?? '' });
    }
    people.sort((a, b) => a.name.localeCompare(b.name));
    return { me, chans, people };
  }

  /** The last messages of a channel (oldest first; `before` = an id for older ones); marks it read. */
  read(me: number, chan: string, before = 0): { chan: string; msgs: ChatMsg[]; more: boolean } {
    if (!this.canRead(me, chan)) throw new Error(chan.startsWith('clan:') ? 'you are not in that clan' : 'not your chat');
    const rows = (before > 0
      ? this.db.sql.prepare('SELECT * FROM chat_msgs WHERE chan = ? AND id < ? ORDER BY id DESC LIMIT 61').all(chan, before)
      : this.db.sql.prepare('SELECT * FROM chat_msgs WHERE chan = ? ORDER BY id DESC LIMIT 61').all(chan)) as unknown as ChatMsg[];
    const more = rows.length > 60;
    const msgs = rows.slice(0, 60).reverse();
    if (!before && msgs.length) { const m = this.marks(me); m[chan] = msgs[msgs.length - 1]!.id; this.db.setMeta(`chat_read:${me}`, JSON.stringify(m)); }
    return { chan, msgs, more };
  }

  // ------------------------------------------------------------------ a player writes
  /**
   * `me` = the player's character id, `myName` = the player's name (the one AI people know and obey). `chan` or `to` (a person's
   * id: their direct chat). Answers come later as their own messages.
   */
  send(me: number, myName: string, o: { chan?: string; to?: number; text: string }): { msg: ChatMsg; chan: string } {
    const w = this.w, e = w.e;
    const text = String(o.text ?? '').replace(/\s+/g, ' ').trim().slice(0, MAX_TEXT);
    if (!text) throw new Error('type something first');
    const now = Date.now();
    if (now - (this.lastSend.get(me) ?? 0) < SEND_GAP_MS) throw new Error('slow down a little');
    let chan = String(o.chan ?? '');
    if (o.to !== undefined) {
      const to = Number(o.to);
      if (!Number.isInteger(to) || to === me || !w.profiles.get(to) || e.slot(to) < 0) throw new Error('nobody by that id is alive');
      chan = Chats.dm(me, to);
    }
    if (!this.canRead(me, chan)) throw new Error(chan.startsWith('clan:') ? 'you are not in a clan' : 'not your chat');
    if (chan.startsWith('dm:')) { const o2 = this.other(me, chan); if (e.slot(o2) < 0) throw new Error(`${this.name(o2)} is no longer alive`); }
    this.lastSend.set(me, now);
    const msg = this.post(chan, me, text, false, myName)!;
    this.answer(me, myName, chan, text);
    return { msg, chan };
  }

  /** Who answers a player's message, and how (bounded, see the class note). */
  private answer(me: number, myName: string, chan: string, text: string): void {
    const w = this.w, e = w.e, mySlot = e.slot(me);
    const named = this.namedIn(text, me);
    if (chan.startsWith('dm:')) {
      const o = this.other(me, chan), j = e.slot(o);
      if (j >= 0 && e.kind[j] === Kind.Agent) this.ask(o, myName, mySlot, text, chan, 'dm');
      return;
    }
    const ai = this.h.aiReady(), now = Date.now();
    if (chan === 'world') {
      let who = named.find((id) => this.canAnswer(id)) ?? -1;
      if (who < 0 && ai && now - (this.chanGap.get(chan) ?? 0) > WORLD_GAP_MS) who = this.pick(this.everyone(), me, myName);
      if (who >= 0) { this.chanGap.set(chan, now); this.ask(who, myName, mySlot, text, chan, 'world'); }
      return;
    }
    const c = w.clans.clans.find((x) => `clan:${x.id}` === chan);
    if (!c) return;
    const members = c.members.filter((id) => id !== me && this.canAnswer(id));
    const out = named.filter((id) => members.includes(id)).slice(0, 2);
    if (ai && out.length < 2 && now - (this.chanGap.get(chan) ?? 0) > CLAN_GAP_MS) {
      const rest = members.filter((id) => !out.includes(id));
      // The leader first (they answer for the clan), then the ones who like the speaker most.
      rest.sort((a, b) => (b === c.leader ? 1 : 0) - (a === c.leader ? 1 : 0) || this.feel(b, myName) - this.feel(a, myName));
      out.push(...rest.slice(0, 2 - out.length));
    }
    if (out.length) this.chanGap.set(chan, now);
    for (const id of out) this.ask(id, myName, mySlot, text, chan, 'clan');
  }
  private canAnswer(id: number): boolean { const i = this.w.e.slot(id); return i >= 0 && this.w.e.kind[i] === Kind.Agent; }
  private everyone(): number[] { const out: number[] = []; for (const id of this.w.profiles.keys()) if (this.canAnswer(id)) out.push(id); return out; }
  private feel(id: number, myName: string): number { return this.w.profiles.get(id)?.mind?.rel['@' + myName] ?? 0; }
  /** The one who knows the speaker best (a little luck among the close ones; awake ones first). */
  private pick(ids: number[], me: number, myName: string): number {
    const e = this.w.e;
    let best = -1, bs = -Infinity;
    for (const id of ids) {
      if (id === me) continue;
      const i = e.slot(id), asleep = e.act[i] === Act.Sleep ? 1 : 0;
      const s = this.feel(id, myName) - asleep * 3 + Math.random() * 1.5; // not the world's dice: chat must not change the run
      if (s > bs) { bs = s; best = id; }
    }
    return best;
  }
  /** People named in the words ("Lina, come" / "@Lina"). */
  private namedIn(text: string, me: number): number[] {
    const out: number[] = [];
    for (const wd of text.match(/@?\p{L}[\p{L}'-]*/gu) ?? []) { const x = this.planner.whoIs(wd, me); if (x >= 0 && x !== me && !out.includes(x)) out.push(x); }
    return out;
  }

  /** One answer from person `id` (one at a time each; words that arrive meanwhile are answered next). */
  private ask(id: number, myName: string, mySlot: number, text: string, chan: string, via: 'dm' | 'world' | 'clan'): void {
    const run = () => {
      const i = this.w.e.slot(id);
      if (i < 0) return;
      this.busy.add(id); this.pending++;
      void this.planner.chat(i, myName, text, mySlot, via).then((r) => {
        if (r.reply) this.post(chan, id, r.reply);
      }, () => {}).finally(() => {
        this.busy.delete(id); this.pending--;
        const next = this.again.get(id);
        if (next) { this.again.delete(id); next(); }
      });
    };
    if (this.busy.has(id)) this.again.set(id, run); else run();
  }

  // ------------------------------------------------------------------ people write by themselves (no AI call)
  /** A task someone gave in words ended: the person tells them (Tasks.onEnd, from the Planner). */
  taskEnded(id: number, from: string, text: string, ok: boolean, why: string): void {
    const to = from && from !== 'owner' && from !== 'myself' ? this.h.charOf(from) : -1;
    if (to < 0 || to === id) return;
    this.hurtTold.delete(`${id}:${text}`);
    const t = text.replace(/^(to )?/, '');
    this.post(Chats.dm(id, to), id, ok ? `Done: ${t}.` : `I couldn't ${t}: ${why}.`);
  }

  private onEvent(ev: WorldEvent): void {
    const w = this.w, d = ev.data as Record<string, unknown>;
    const person = (x: unknown) => w.profiles.get(Number(x));
    switch (ev.kind) {
      case 'birth': { const k = person(d.id), m = person(d.mother), f = person(d.father); if (k) this.post('world', -1, `A baby is born: ${k.name}, child of ${m?.name ?? '?'}${f ? ' and ' + f.name : ''}.`, true); break; }
      case 'partner': if (d.wed) { const a = person(d.a), b = person(d.b); if (a && b) this.post('world', -1, `${a.name} and ${b.name} are married.`, true); } break;
      case 'divorce': { const a = person(d.a), b = person(d.b); if (a && b) this.post('world', -1, `${a.name} and ${b.name} are divorced.`, true); break; }
      case 'death': { const p = person(d.id); if (p && !p.player) this.post('world', -1, `${p.name} has died (${String(d.cause ?? 'unknown')}).`, true); break; }
      case 'leader': { const p = person(d.id); if (p) this.post('world', -1, `${p.name} now leads the camp of ${w.maps.find((m) => m.def.id === d.map)?.def.name ?? d.map}.`, true); break; }
      case 'alarm': { // a zombie / beast alarm: the one who shouted writes it, at most once a game hour per map
        const p = person(d.id), key = String(d.map);
        if (!p || ev.gameSec - (this.alarmAt.get(key) ?? -1e9) < 3600) break;
        this.alarmAt.set(key, ev.gameSec);
        this.post('world', Number(d.id), d.zombie ? `Zombies! ${Number(d.n) > 1 ? d.n + ' of them' : 'One'} near me in ${w.maps.find((m) => m.def.id === d.map)?.def.name ?? key}. Stay by the fire!` : 'A wild animal is attacking here! Careful!');
        break;
      }
      case 'clanOrder': { // an AI leader's order of the day (a player leader's words are already in the channel when typed here)
        if (d.player) break;
        const c = w.clans.clans.find((x) => x.name === d.clan);
        if (c && d.text) this.post(`clan:${c.id}`, Number(d.id), String(d.text));
        break;
      }
      case 'clanJoin': { const c = w.clans.clans.find((x) => x.name === d.clan), p = person(d.id); if (c && p) this.post(`clan:${c.id}`, -1, `${p.name} joined the clan.`, true); break; }
      case 'clanVote': { const c = w.clans.clans.find((x) => x.name === d.clan), p = person(d.winner); if (c && p) this.post(`clan:${c.id}`, -1, `Election over: ${p.name} leads the clan${Number(d.old) === Number(d.winner) ? ' again' : ''} (${d.votes} votes).`, true); break; }
    }
  }

  /** Every few game minutes: someone working for a player who is badly hurt or starving says so (once per task). */
  check(): void {
    const w = this.w, e = w.e;
    for (const [id, p] of w.profiles) {
      const t = p.mind?.task, i = e.slot(id);
      if (!t || i < 0 || e.kind[i] !== Kind.Agent) continue;
      const to = t.from && t.from !== 'owner' && t.from !== 'myself' ? this.h.charOf(t.from) : -1;
      if (to < 0 || to === id) continue;
      const key = `${id}:${t.text}`;
      if (this.hurtTold.has(key)) continue;
      const why = e.hp[i]! < 35 ? "I'm badly hurt" : e.hunger[i]! > 90 ? "I'm starving" : e.thirst[i]! > 90 ? "I'm dying of thirst" : '';
      if (!why) continue;
      this.hurtTold.add(key);
      this.post(Chats.dm(id, to), id, `${why}. I'm still on "${t.text}", but I may need help.`);
    }
  }
}
