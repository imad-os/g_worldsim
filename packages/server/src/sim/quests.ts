/**
 * Quests and the town's teachers (imad 2026-11-25). The table (NPCs, the 10 tutorial quests, texts in 4 languages) is in
 * @worldsim/protocol quests.ts, shared with the TV.
 *
 * - NPCs (Kind.Npc) stand in the middle of the start map. They are not people (imad 2026-11-25: "NPCs are not people"): no profile,
 *   no needs, no age, never hurt, never in clans, not counted in the population. Kept in snapshots; `setup` at every start finds them
 *   (by look) or makes them; quests remember NPCs by key, not by entity id.
 * - A person (player or AI) talks to an NPC: the next quest is taken from its giver, a quest that is done is handed in (reward +
 *   lesson), else a reminder. What counts comes from the world's own events (drink, pickup, gather, craft, build, tend, hunt, npc,
 *   clanJoin) by that person, after the quest was taken.
 * - AI people take the quests too, like players: when free and safe they get a task (sim/tasks.ts) "walk to the giver, do the
 *   quest's steps, walk back". Each lesson stays in their profile and is written in every prompt about them (planner), so what
 *   they learned shapes what they plan.
 */
import { Kind, NPCS, QUESTS, npcDef, questDef, type NpcKey, type QuestDef, type QuestRow, type L } from '@worldsim/protocol';
import { NO_MAP } from './entities.js';
import { ageOf, levelOf, TRAIT_KEYS } from './people.js';
import type { Step } from './tasks.js';
import type { World, WorldEvent } from './world.js';

export interface QuestState { done: string[]; cur?: { id: string; n: number; at: number; ready?: boolean } }
export interface NpcTalk { npc: NpcKey; name: string; say: L; quest?: string; state?: 'taken' | 'handed' | 'remind' | 'elsewhere' | 'none' | 'all'; n?: number; need?: number; next?: NpcKey; reward?: QuestDef['reward'] }

const CHECK_SEC = 1800; // AI people look at their quests every 30 game minutes
const HOUR = 3600;

export class Quests {
  /** NPC key -> entity id (this run). */
  readonly npcs = new Map<NpcKey, number>();
  private map = -1;
  private nextCheck = 0;
  /** An NPC says a line to person `to` (imad 2026-11-26: only the player who talked hears it, never the whole map). */
  onNpcSay: (npcSlot: number, name: string, text: string, to: number) => void = () => {};
  /** A person learned something (planner memory). */
  onLearn: (id: number, text: string) => void = () => {};
  /** A player's character: quest progress for their TV. */
  onProgress: (i: number, data: Record<string, unknown>) => void = () => {};

  constructor(private w: World) {
    w.listeners.push((ev) => this.onEvent(ev));
  }

  // ------------------------------------------------------------------ NPCs
  /**
   * Put the NPCs in the middle of the start map (called at every start, after the land is set up). NPCs kept in the snapshot stay
   * where they are (the same world after a restart); missing ones are made, extras removed.
   */
  setup(): void {
    const w = this.w, e = w.e;
    this.npcs.clear();
    const start = w.startMap() >= 0 ? w.startMap() : 0;
    const mapOf = (n: (typeof NPCS)[number]) => (n.map !== undefined ? w.mapIndex.get(n.map) ?? -1 : start);
    const used = new Set<number>();
    for (const n of NPCS) {
      const m = mapOf(n);
      for (let i = 0; i < e.hi; i++) {
        if (!e.alive(i) || e.kind[i] !== Kind.Npc || e.sub[i] !== n.look || e.map[i] !== m || used.has(i)) continue;
        used.add(i); this.npcs.set(n.key, e.id(i)); e.tx[i] = e.x[i]!; e.ty[i] = e.y[i]!; e.speed[i] = 1;
        break;
      }
    }
    for (let i = 0; i < e.hi; i++) if (e.alive(i) && e.kind[i] === Kind.Npc && !used.has(i)) w.remove(i, 'npc');
    if (!w.maps[start]) return;
    this.map = start;
    for (const n of NPCS) {
      const m = mapOf(n), def = w.maps[m]?.def;
      if (this.npcs.has(n.key) || !def) continue;
      const cx = def.w / 2, cy = def.h / 2;
      const s = w.freeSpot(m, cx + n.dx, cy + n.dy, 200);
      if (!s) continue;
      const i = w.spawnNpc(m, s.x, s.y, n.look);
      if (i >= 0) this.npcs.set(n.key, e.id(i));
    }
  }
  npcSlot(key: string): number { const id = this.npcs.get(key as NpcKey); return id === undefined ? -1 : this.w.e.slot(id); }
  /** The map a teacher stands on (-1: not there). */
  npcMap(key: string): number { const j = this.npcSlot(key); return j < 0 ? -1 : this.w.e.map[j]!; }
  /** A teacher's key from words: the key itself, their name, or what they do ('' = none). */
  static keyFrom(words: string): NpcKey | '' {
    const t = words.toLowerCase().replace(/[^a-z ]/g, '');
    const k = NPCS.find((n) => t.includes(n.key) || t.includes(n.name.toLowerCase().split(' ').find((x) => x.length > 3 && !['elder', 'warden', 'mayor', 'ranger', 'the'].includes(x)) ?? '#'));
    if (k) return k.key;
    return /elder|mara/.test(t) ? 'guide' : /joren|forge/.test(t) ? 'smith' : /sela|hunt/.test(t) ? 'hunter' : /bram|guard/.test(t) ? 'warden' : /odile|clan|regist/.test(t) ? 'registrar'
      : /ines|ridge/.test(t) ? 'mayor' : /yasmin|heal|herb/.test(t) ? 'healer' : /tobias|farm|field/.test(t) ? 'farmer' : /idris|explor|horse/.test(t) ? 'ranger' : /nadia|build|wall/.test(t) ? 'builder' : '';
  }
  /** The NPC key of an entity id ('' = not an NPC). */
  keyOf(id: number): NpcKey | '' { for (const [k, v] of this.npcs) if (v === id) return k; return ''; }
  /** Nearest NPC to slot i within r metres: its key, or ''. */
  nearNpc(i: number, r: number): NpcKey | '' {
    const e = this.w.e;
    let best: NpcKey | '' = '', bd = r;
    for (const [k, id] of this.npcs) {
      const j = e.slot(id);
      if (j < 0 || e.map[j] !== e.map[i]) continue;
      const d = Math.hypot(e.x[j]! - e.x[i]!, e.y[j]! - e.y[i]!);
      if (d <= bd) { bd = d; best = k; }
    }
    return best;
  }
  list(): { key: NpcKey; id: number; name: string; x: number; y: number; map: string }[] {
    const e = this.w.e;
    return [...this.npcs].map(([key, id]) => { const j = e.slot(id); return { key, id, name: npcDef(key)!.name, x: j >= 0 ? Math.round(e.x[j]!) : 0, y: j >= 0 ? Math.round(e.y[j]!) : 0, map: this.w.maps[j >= 0 ? e.map[j]! : this.map]?.def.id ?? '' }; });
  }

  // ------------------------------------------------------------------ a person's quests
  state(id: number): QuestState {
    const p = this.w.profiles.get(id);
    if (!p) return { done: [] };
    return (p.quests ??= { done: [] });
  }
  /** The next quest to take (none = all done or one in hand). */
  /** Person i (an AI on the quest map, teachers standing) has a quest left to take: the camp plan's filler leaves them to it. */
  wants(i: number): boolean { const e = this.w.e, q = this.map >= 0 && this.npcs.size > 0 ? this.next(e.id(i)) : undefined; return !!q && this.npcMap(q.npc) === e.map[i]; }
  next(id: number): QuestDef | undefined { const s = this.state(id); return s.cur ? undefined : QUESTS.find((q) => !s.done.includes(q.id)); }
  rows(id: number): QuestRow[] {
    const s = this.state(id), nx = this.next(id);
    return QUESTS.map((q) => {
      const need = q.need[0]!.n;
      if (s.done.includes(q.id)) return { id: q.id, state: 'done', n: need, need };
      if (s.cur?.id === q.id) return { id: q.id, state: s.cur.ready ? 'ready' : 'active', n: Math.min(need, s.cur.n), need };
      return { id: q.id, state: nx?.id === q.id ? 'next' : 'locked', n: 0, need };
    });
  }
  /** "2 / 10 quests, now: Wood for everything 1/3" for the panel. */
  summary(id: number): { done: number; all: number; cur: string; n: number; need: number; ready: boolean } {
    const s = this.state(id), q = s.cur ? questDef(s.cur.id) : undefined;
    return { done: s.done.length, all: QUESTS.length, cur: q?.title.en ?? '', n: s.cur?.n ?? 0, need: q?.need[0]!.n ?? 0, ready: !!s.cur?.ready };
  }

  /**
   * Person i talks to an NPC: hand in a quest that is done, take the next one if this NPC gives it, else a reminder / a hint.
   * Players and AI people alike. The 'npc' event counts for "go and meet ..." quests.
   */
  talk(i: number, key: NpcKey): NpcTalk {
    const w = this.w, e = w.e, id = e.id(i), def = npcDef(key)!;
    w.emit('npc', { id, what: key, npc: def.name });
    const s = this.state(id);
    const out: NpcTalk = { npc: key, name: def.name, say: def.idle };
    const cur = s.cur ? questDef(s.cur.id) : undefined;
    if (cur && s.cur!.ready && cur.npc === key) {
      this.handIn(i, cur);
      out.say = cur.done; out.quest = cur.id; out.state = 'handed'; out.reward = cur.reward;
      const nx = this.next(id);
      if (nx) out.next = nx.npc;
    } else if (cur) {
      out.quest = cur.id; out.n = s.cur!.n; out.need = cur.need[0]!.n;
      if (cur.npc === key) { out.say = cur.ask; out.state = 'remind'; }
      else { out.state = 'elsewhere'; out.next = cur.npc; }
    } else {
      const nx = this.next(id);
      if (!nx) out.state = 'all';
      else if (nx.npc === key) {
        s.cur = { id: nx.id, n: 0, at: w.gameSec };
        out.say = nx.ask; out.quest = nx.id; out.state = 'taken'; out.n = 0; out.need = nx.need[0]!.n;
        w.emit('quest', { id, quest: nx.id, title: nx.title.en, npc: def.name });
      } else { out.state = 'elsewhere'; out.next = nx.npc; }
    }
    const j = this.npcSlot(key);
    if (j >= 0) this.onNpcSay(j, def.name, out.say.en, i);
    return out;
  }

  private handIn(i: number, q: QuestDef): void {
    const w = this.w, e = w.e, id = e.id(i), s = this.state(id), p = w.profileOf(i);
    delete s.cur;
    if (!s.done.includes(q.id)) s.done.push(q.id);
    if (p) {
      const before = levelOf(p.xp);
      p.xp = (p.xp ?? 0) + q.reward.xp;
      if (levelOf(p.xp) > before) { for (const k of TRAIT_KEYS) if (k !== 'metabolism') p.traits[k] = Math.min(1, p.traits[k] + 0.02); w.emit('levelup', { id, level: levelOf(p.xp) }); }
      p.traits.intelligence = Math.min(1, p.traits.intelligence + 0.005); // every lesson makes them a little wiser
    }
    for (const [k, n] of Object.entries(q.reward.items ?? {})) w.survival.add(i, k, n);
    if (q.reward.food) w.survival.addFood(i, q.reward.food);
    this.onLearn(id, `I finished the quest "${q.title.en}" for ${npcDef(q.npc)!.name}. I learned: ${q.lesson}`);
    w.emit('questDone', { id, quest: q.id, title: q.title.en, xp: q.reward.xp, done: s.done.length });
  }

  /** What counts: events by the person who has the quest. */
  private onEvent(ev: WorldEvent): void {
    const id = Number(ev.data.id);
    if (!Number.isFinite(id) || id < 0) return;
    const p = this.w.profiles.get(id);
    const cur = p?.quests?.cur;
    if (!cur || cur.ready) return;
    const q = questDef(cur.id);
    if (!q || ev.gameSec < cur.at) return;
    const what = String(ev.data.what ?? ev.data.item ?? ev.data.animal ?? '').toLowerCase();
    const hit = q.need.find((n) => n.ev === ev.kind && (!n.what || what.split('+').includes(n.what) || what === n.what));
    if (!hit) return;
    cur.n++;
    const i = this.w.e.slot(id);
    if (cur.n >= hit.n) { cur.ready = true; this.w.emit('questReady', { id, quest: q.id, title: q.title.en }); }
    if (i >= 0 && this.w.e.kind[i] === Kind.Player) this.onProgress(i, { quest: q.id, n: Math.min(cur.n, hit.n), need: hit.n, ready: !!cur.ready, npc: q.npc });
  }

  /** The lessons a person keeps (for every prompt about them). */
  promptText(i: number): string {
    const s = this.state(this.w.e.id(i)), parts: string[] = [];
    const learned = s.done.map((d) => questDef(d)?.lesson).filter(Boolean);
    if (learned.length) parts.push(`Lessons you learned from the town's teachers (use them): ${learned.join(' ')}`);
    const q = s.cur ? questDef(s.cur.id) : undefined;
    // A quest to make something they already carry: only a new one counts (imad's example: "your first axe" for a man with an axe).
    const nd = q?.need[0], owned = !!nd && nd.ev === 'craft' && !!nd.what && (this.w.survival.inv(i)[nd.what] ?? 0) > 0;
    if (q) parts.push(`Your quest now: "${q.title.en}" for ${npcDef(q.npc)!.name} (${s.cur!.ready ? 'done: go back to hand it in' : `${s.cur!.n}/${q.need[0]!.n}: ${q.ask.en}${owned ? ` You already have one: only a new one you make counts.` : ''}`}).`);
    else if (this.next(this.w.e.id(i))) { const k = this.next(this.w.e.id(i))!.npc, m = this.npcMap(k); parts.push(`${npcDef(k)!.name} in ${this.w.maps[m]?.def.name ?? 'town'} has a quest for you (skill npc).`); }
    return parts.join('\n');
  }

  // ------------------------------------------------------------------ AI people take quests
  /** World.step every 20 ticks: the NPCs stay at their spot; now and then free AI people go and do their quests. */
  update(): void {
    const w = this.w, e = w.e;
    for (const id of this.npcs.values()) { // stand still at home (people bumping into them push them a little)
      const j = e.slot(id);
      if (j >= 0) { e.hp[j] = 100; e.hunger[j] = e.thirst[j] = e.tired[j] = e.lonely[j] = 0; }
    }
    if (w.gameSec < this.nextCheck) return;
    this.nextCheck = w.gameSec + CHECK_SEC;
    if (this.map < 0 || !this.npcs.size) return;
    const hour = w.brain.hour();
    if (hour < 7 || hour > 19) return; // quests by day; nights are for the fire and the hut
    for (let i = 0; i < e.hi; i++) {
      if (e.kind[i] !== Kind.Agent || e.map[i] === NO_MAP) continue;
      const p = w.profileOf(i);
      if (!p || ageOf(p, w.gameSec, w.yearSec) < 14 || p.mind?.task || w.survival.busy(e.id(i))) continue;
      const s = this.state(e.id(i)), q = s.cur ? questDef(s.cur.id) : this.next(e.id(i));
      if (!q) continue;
      // The giver on another map (Ridgeford's teachers): only with the roads open, never from the wild, with an hour's margin
      // before dusk, and rarely (a day's trip, not a rush).
      const gm = this.npcMap(q.npc), here = e.map[i]!, away = gm !== here;
      if (gm < 0 || w.zombies.count(here) > 0 || w.zombies.count(gm) > 0) continue;
      if (away && (!w.travelOpen || w.wild(here) || hour > 13 || !w.routeMaps(here, gm)?.length)) continue;
      if (e.hunger[i]! > 65 || e.thirst[i]! > 65 || e.tired[i]! > 80 || e.hp[i]! < 45) continue;
      if (w.clans.duelling(i) || w.rules.forbidden(i, 'npc')) continue;
      if (!w.rng.chance(away ? 0.08 : 0.35)) continue;
      this.planFor(i);
    }
  }

  /** A task for person i: to the giver, the quest's steps, back to the giver. */
  planFor(i: number): boolean {
    const w = this.w, id = w.e.id(i), s = this.state(id);
    const q = s.cur ? questDef(s.cur.id) : this.next(id);
    if (!q) return false;
    const giver: Step = { do: 'npc', what: q.npc };
    const steps: Step[] = s.cur?.ready ? [giver] : [...(s.cur ? [] : [giver]), ...q.plan.map((x) => ({ ...x }) as Step), giver];
    return w.tasks.start(i, `quest: ${q.title.en}`, npcDef(q.npc)!.name, steps);
  }
}
