import { Act, Kind } from '@worldsim/protocol';
import type { World, WorldEvent } from '../sim/world.js';
import type { Task } from '../sim/tasks.js';
import { Rules, type Rule } from '../sim/rules.js';

/**
 * What the people are thinking, all together (imad 2026-11-27: "a screen where I can see what people think, not every
 * person; see if an update, a strict rule or a tweak changes their thoughts and drives them, quickly").
 *
 * Every 30 real seconds every AI person is put in one "thought" = what drives them now (danger, an order, a rule, a task
 * somebody gave, their own plan, the planner's wish, a need, company, nothing) + what they do and where they are. Only the
 * counts are kept (6 hours), plus the people of the latest sample. Every change made from the panel is a mark, so the panel
 * can show before / after. The strict rules carry how often each one said no (Rules.hits).
 * Memory only: nothing goes to snapshots or the cloud.
 */

export const DRIVERS = ['danger', 'order', 'rule', 'asked', 'own', 'plan', 'need', 'social', 'work', 'travel', 'idle'] as const;
export type Driver = (typeof DRIVERS)[number];
export const PLACES = ['home', 'hut', 'camp', 'out', 'wild', 'away'] as const;
export type Place = (typeof PLACES)[number];

const ACT_TEXT: Record<number, string> = {
  [Act.Idle]: 'standing', [Act.Wander]: 'wandering', [Act.Drink]: 'getting water', [Act.Eat]: 'eating', [Act.Forage]: 'looking for food',
  [Act.Sleep]: 'sleeping', [Act.Talk]: 'talking', [Act.Travel]: 'travelling', [Act.Rest]: 'resting', [Act.Flee]: 'running away',
  [Act.Go]: 'going to someone', [Act.Gather]: 'gathering', [Act.Build]: 'building', [Act.Fight]: 'fighting',
};
const PLAN_ACT = ['', 'wander', 'drink', 'eat', 'forage', 'sleep', 'talk', 'travel', 'rest'];

/** One person in the latest sample. */
export interface Row { id: number; name: string; src: Driver; label: string; why: string; act: string; place: Place; mood: string; map: string; rule?: string }
/** One sample: counts only. */
export interface Sample { at: number; g: number; n: number; src: Partial<Record<Driver, number>>; place: Partial<Record<Place, number>>; labels: Record<string, number>; hits: Record<string, number>; needs: [number, number, number, number, number] }
export interface Mark { id: number; at: number; g: number; who: string; cmd: string; text: string }
export interface Spread { at: number; g: number; kind: string; what: string; text: string; map: string }

const SAMPLES = 720, MARKS = 120, FEED = 200, EVERY_MS = 30_000;
const cut = (s: string, n = 70) => (s.length > n ? s.slice(0, n - 1) + '…' : s);
/** Task texts with numbers or names in them still group together ("hunt 3 animals" ~ "hunt 2 animals"). */
const norm = (s: string) => cut(s.toLowerCase().replace(/\d+/g, 'N').replace(/\s+/g, ' ').trim(), 60);

/** Commands whose args say nothing useful in a mark. */
const SECRET = /key|token|pass/i;

export class Thoughts {
  samples: Sample[] = [];
  rows: Row[] = [];
  marks: Mark[] = [];
  feed: Spread[] = [];
  private seq = 1;
  private lastHits = new Map<string, number>();
  private lastAt = 0;

  constructor(private w: World, private mapName: (m: number) => string) {
    w.listeners.push((ev) => this.onEvent(ev));
  }

  /** Called often (the app's 1 s timer is enough): samples every 30 s, at once the first time. */
  maybeSample(now = Date.now()): void { if (now - this.lastAt >= EVERY_MS) this.sample(now); }

  /** A change from the panel (not a read): a mark on the timeline, with the words that matter. */
  mark(who: string, c: Record<string, unknown>): void {
    const cmd = String(c.cmd ?? '?');
    if (cmd === 'thoughts') return;
    let text = '';
    if (cmd === 'rules') {
      const pid = typeof c.id === 'number' && c.id >= 0 ? c.id : -1, whom = pid >= 0 ? this.w.profiles.get(pid)?.name ?? `#${pid}` : 'everyone';
      text = typeof c.add === 'string' ? `New rule for ${whom}: "${cut(c.add, 90)}"` : c.remove !== undefined ? `Removed rule ${Number(c.remove) + 1} of ${whom}` : '';
      if (!text) return;
    } else {
      const args = Object.entries(c).filter(([k]) => k !== 'cmd' && k !== 'id' && k !== 'force' && !SECRET.test(k))
        .map(([k, v]) => `${k} ${typeof v === 'object' ? cut(JSON.stringify(v), 50) : cut(String(v), 40)}`);
      text = `${cmd}${args.length ? ': ' + args.join(', ') : ''}`;
    }
    this.marks.push({ id: this.seq++, at: Date.now(), g: this.w.gameSec, who, cmd, text: cut(text, 140) });
    if (this.marks.length > MARKS) this.marks.splice(0, this.marks.length - MARKS);
  }

  private onEvent(ev: WorldEvent): void {
    // Knowledge passed in talks and plans agreed (sim/talk.ts of the "smarter people" work): shown as it spreads.
    if (ev.kind !== 'learned' && ev.kind !== 'pact') return;
    const d = ev.data as { kind?: string; what?: string; text?: string; map?: unknown };
    const m = typeof d.map === 'number' ? this.mapName(d.map) : String(d.map ?? '');
    this.feed.push({ at: Date.now(), g: ev.gameSec, kind: ev.kind === 'pact' ? 'plan together' : String(d.kind ?? 'news'), what: String(d.what ?? ''), text: cut(String(d.text ?? ''), 160), map: m });
    if (this.feed.length > FEED) this.feed.splice(0, this.feed.length - FEED);
  }

  /** What drives person i now, in words. */
  classify(i: number): Omit<Row, 'id' | 'name' | 'place' | 'mood' | 'map'> {
    const w = this.w, e = w.e, id = e.id(i), p = w.profileOf(i), act = e.act[i]!;
    const doing = ACT_TEXT[act] ?? 'busy';
    const lastRule = w.rules.lastHit(id, w.gameSec - 3600);
    // The "why now" record of the smarter brain, when it is there (World.why).
    const why = (w as unknown as { why?: (i: number) => { src: string; text: string } | null | undefined }).why?.(i);
    const t = p?.mind?.task as Task | undefined;
    if (act === Act.Flee || act === Act.Fight) return { src: 'danger', label: act === Act.Flee ? 'running from danger' : 'fighting', why: why?.text ?? doing, act: doing, rule: lastRule };
    if (t) {
      const src: Driver = t.rule ? 'rule' : t.from === 'owner' || t.from === 'the voice from the sky' ? 'order' : t.from === 'myself' || !t.from ? 'own' : 'asked';
      const step = t.steps[t.k];
      return { src, label: norm(t.text), why: `${t.rule ? `rule "${cut(t.rule, 50)}"` : t.from && t.from !== 'myself' ? `from ${t.from}` : 'my own idea'}; step ${t.k + 1}/${t.steps.length}${step ? ': ' + step.do : ''}`, act: doing, rule: lastRule };
    }
    if (why && (DRIVERS as readonly string[]).includes(why.src)) return { src: why.src as Driver, label: norm(why.text || doing), why: cut(why.text || doing, 120), act: doing, rule: lastRule };
    const o = w.brain.orderOf(i);
    if (o.kind && o.kind !== 'job') return { src: 'order', label: `ordered: ${o.kind}`, why: 'an order from a chat or the panel', act: doing, rule: lastRule };
    if (o.kind === 'job') return { src: 'work', label: doing, why: 'camp work', act: doing, rule: lastRule };
    const plan = p?.mind?.plan && p.mind.plan.until > w.gameSec ? p.mind.plan : undefined;
    const wish = w.brain.wishOf(i);
    if (plan && wish >= 0 && wish === act) return { src: 'plan', label: `wants to ${PLAN_ACT[act] ?? plan.act}`, why: cut(plan.why || 'the planner', 120), act: doing, rule: lastRule };
    const needs = `water ${Math.round(e.thirst[i]!)}, food ${Math.round(e.hunger[i]!)}, tired ${Math.round(e.tired[i]!)}, lonely ${Math.round(e.lonely[i]!)}`;
    if (act === Act.Drink || act === Act.Eat || act === Act.Forage || act === Act.Sleep) {
      const top = act === Act.Drink ? 'thirsty' : act === Act.Sleep ? 'tired' : 'hungry';
      return { src: 'need', label: `${top}: ${doing}`, why: `lacks ${needs}`, act: doing, rule: lastRule };
    }
    if (act === Act.Talk) return { src: 'social', label: 'talking', why: `lonely ${Math.round(e.lonely[i]!)}`, act: doing, rule: lastRule };
    if (act === Act.Gather || act === Act.Build) return { src: 'work', label: doing, why: 'work', act: doing, rule: lastRule };
    if (act === Act.Travel) return { src: 'travel', label: 'travelling', why: 'going to another map', act: doing, rule: lastRule };
    // Nothing to do because a strict rule said no to what they wanted (sleep, talk, travel...): that is the rule driving them.
    if (lastRule) return { src: 'rule', label: `held back: "${cut(lastRule, 50)}"`, why: `${doing}; the rule stopped what they wanted (${needs})`, act: doing, rule: lastRule };
    return { src: 'idle', label: doing, why: plan ? `planner wished "${plan.act}" (${cut(plan.why, 60)}) but needs and rules won` : 'nothing pressing', act: doing, rule: lastRule };
  }

  private placeOf(i: number): Place {
    const w = this.w, e = w.e, m = e.map[i]!;
    if (m === undefined || !w.maps[m]) return 'away';
    const homes = w.survival.homes, h = homes.homeOf(e.id(i));
    if (h && h.m === m && homes.inside(i, h)) return 'home';
    const t = w.maps[m]!.tiles, k = Math.floor(e.y[i]!) * t.w + Math.floor(e.x[i]!);
    if (homes.at(m, k)) return 'hut';
    if (w.wild(m)) return 'wild';
    const c = w.survival.campFor(i) ?? w.survival.campOf(m);
    return c && Math.hypot(c.x - e.x[i]!, c.y - e.y[i]!) < 30 ? 'camp' : 'out';
  }

  sample(now = Date.now()): Sample {
    this.lastAt = now;
    const w = this.w, e = w.e, rows: Row[] = [];
    const s: Sample = { at: now, g: w.gameSec, n: 0, src: {}, place: {}, labels: {}, hits: {}, needs: [0, 0, 0, 0, 0] };
    for (let i = 0; i < e.hi; i++) {
      if (e.kind[i] !== Kind.Agent) continue;
      const p = w.profileOf(i);
      if (!p) continue;
      const c = this.classify(i), place = this.placeOf(i);
      rows.push({ id: e.id(i), name: p.name, place, mood: p.mind?.mood ?? '', map: this.mapName(e.map[i]!), ...c });
      s.n++;
      s.src[c.src] = (s.src[c.src] ?? 0) + 1;
      s.place[place] = (s.place[place] ?? 0) + 1;
      const lk = `${c.src}|${c.label}`;
      s.labels[lk] = (s.labels[lk] ?? 0) + 1;
      s.needs[0] += e.thirst[i]!; s.needs[1] += e.hunger[i]!; s.needs[2] += e.tired[i]!; s.needs[3] += e.lonely[i]!; s.needs[4] += e.hp[i]!;
    }
    if (s.n) s.needs = s.needs.map((v) => Math.round(v / s.n)) as Sample['needs'];
    // Keep the 15 biggest groups per sample (enough for before / after), the rest are in the latest rows.
    const top = Object.entries(s.labels).sort((a, b) => b[1] - a[1]).slice(0, 15);
    s.labels = Object.fromEntries(top);
    for (const [text, n] of w.rules.hits) { const d = n - (this.lastHits.get(text) ?? 0); if (d > 0) s.hits[text] = d; this.lastHits.set(text, n); }
    this.rows = rows;
    this.samples.push(s);
    if (this.samples.length > SAMPLES) this.samples.splice(0, this.samples.length - SAMPLES);
    return s;
  }

  /** The panel's Thoughts page. */
  info(): Record<string, unknown> {
    if (!this.samples.length) this.sample();
    const w = this.w, rows = this.rows;
    const groups = new Map<string, { src: Driver; label: string; n: number; people: [number, string][]; whys: Map<string, number>; places: Partial<Record<Place, number>>; acts: Map<string, number>; rules: Map<string, number> }>();
    for (const r of rows) {
      const k = `${r.src}|${r.label}`;
      let g = groups.get(k);
      if (!g) groups.set(k, g = { src: r.src, label: r.label, n: 0, people: [], whys: new Map(), places: {}, acts: new Map(), rules: new Map() });
      g.n++;
      if (g.people.length < 12) g.people.push([r.id, r.name]);
      g.whys.set(r.why, (g.whys.get(r.why) ?? 0) + 1);
      g.acts.set(r.act, (g.acts.get(r.act) ?? 0) + 1);
      g.places[r.place] = (g.places[r.place] ?? 0) + 1;
      if (r.rule) g.rules.set(r.rule, (g.rules.get(r.rule) ?? 0) + 1);
    }
    const top = (m: Map<string, number>, n: number) => [...m].sort((a, b) => b[1] - a[1]).slice(0, n);
    const ruleRow = (r: Rule, scope: string, ids: number[]) => {
      const kept = w.rules.kept(r, ids);
      const held = rows.filter((x) => x.rule === r.text);
      return { text: r.text, scope, kind: r.kind ?? '', how: Rules.how(r), hits: w.rules.hits.get(r.text) ?? 0,
        hitsHour: this.samples.slice(-120).reduce((a, s) => a + (s.hits[r.text] ?? 0), 0),
        held: held.length, heldNames: held.slice(0, 8).map((x) => x.name),
        ok: kept.reduce((a, k) => a + k.ok, 0), fail: kept.reduce((a, k) => a + k.fail, 0), why: kept.find((k) => k.why)?.why ?? '', people: ids.length };
    };
    const agents = rows.map((r) => r.id);
    const rules = w.rules.all.map((r) => ruleRow(r, 'everyone', agents));
    for (const r0 of rows) for (const r of w.profiles.get(r0.id)?.rules ?? []) rules.push(ruleRow(r, r0.name, [r0.id]));
    const moods = new Map<string, number>();
    for (const r of rows) if (r.mood) moods.set(r.mood.toLowerCase(), (moods.get(r.mood.toLowerCase()) ?? 0) + 1);
    return {
      now: Date.now(), g: w.gameSec, every: EVERY_MS / 1000, drivers: DRIVERS, places: PLACES,
      latest: this.samples[this.samples.length - 1],
      groups: [...groups.values()].sort((a, b) => b.n - a.n).map((g) => ({ src: g.src, label: g.label, n: g.n, people: g.people, whys: top(g.whys, 3), acts: top(g.acts, 3), places: g.places, rules: top(g.rules, 3) })),
      series: this.samples.map((s) => ({ at: s.at, g: s.g, n: s.n, src: s.src, place: s.place, labels: s.labels, needs: s.needs, hits: Object.values(s.hits).reduce((a, b) => a + b, 0) })),
      marks: this.marks, rules, moods: top(moods, 10), feed: this.feed.slice(-60).reverse(),
    };
  }
}
