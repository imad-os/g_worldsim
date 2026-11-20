import { Act, Kind } from '@worldsim/protocol';
import { NO_MAP } from './entities.js';
import type { World, WorldEvent } from './world.js';

/**
 * Zombie attacks recorded as replays (imad 2026-11-20: "not video but something like replay, so I see how they
 * behaved"). When a zombie goes for someone, everyone within RADIUS of the fight (people, players, zombies) is
 * sampled 5 times a second (where, facing, doing what, health) with the hits, kills, deaths, flights and what people
 * said, until it is over (nobody chased, fighting or fleeing for 10 s, or 3 minutes). The few seconds before the
 * start are kept too. Positions are int16 decimetres: a 3 minute attack of 10 people is ~60 KB. The last KEEP are
 * kept (the app stores them in SQLite, never in snapshots or the cloud backup); viewers play them back.
 */
export const KEEP = 20;
const EVERY = 4, HZ = 5, RADIUS = 30, QUIET = 10 * HZ, MAX = 180 * HZ, BEFORE = 5 * HZ, ROW = 7;

/** Who is in a replay: [entity id, kind (0 person, 1 player, 2 zombie), name]. */
export type ReplayWho = [number, number, string];
/** Something that happened: [frame, kind, who index, other who index (-1), number or text]. */
export type ReplayEvent = [number, 'bite' | 'killed' | 'death' | 'fight' | 'flee' | 'say', number, number, number | string];
export interface ReplaySummary {
  id: number; map: string; start: number; end: number; secs: number;
  people: string[]; zombies: number; bites: number; killed: number; deaths: string[];
}
export interface Replay extends ReplaySummary {
  hz: number; who: ReplayWho[];
  /** Per frame: count, then count rows of [who index, x dm, y dm, angle x 5000, act, hp, flags]. Base64 of an Int16Array. */
  frames: string; events: ReplayEvent[];
}

interface Rec {
  m: number; start: number; frames: number[][]; events: ReplayEvent[]; who: ReplayWho[]; idx: Map<number, number>;
  cx: number; cy: number; quiet: number; bites: number; killed: number; deaths: string[];
}

export class Replays {
  /** Called with each finished replay (the app saves it). */
  onDone: (r: Replay) => void = () => {};
  /** Names of players' characters (the world only knows its own people). */
  nameOf: (id: number) => string = () => '';
  nextId = 1;
  private readonly rec = new Map<number, Rec>();
  /** The last seconds on each map with zombies: [frame rows (entity ids), ...], so a replay starts a little before. */
  private readonly ring = new Map<number, { rows: number[][]; cx: number; cy: number }[]>();

  constructor(private w: World) {
    w.listeners.push((ev) => this.onEvent(ev));
  }

  get recording(): number { return this.rec.size; }

  update(): void {
    const w = this.w, e = w.e;
    if (w.tick % EVERY !== 0) return;
    for (let m = 0; m < w.maps.length; m++) {
      // Where zombies are going for someone (the fight's centre), on this map.
      let n = 0, sx = 0, sy = 0, zed = 0;
      for (let i = 0; i < e.hi; i++) {
        if (e.kind[i] !== Kind.Threat || e.map[i] !== m) continue;
        zed++;
        if (e.act[i] !== Act.Fight) continue;
        const t = e.slot(e.target[i]!);
        sx += e.x[i]!; sy += e.y[i]!; n++;
        if (t >= 0) { sx += e.x[t]!; sy += e.y[t]!; n++; }
      }
      let r = this.rec.get(m);
      if (!zed && !r) { this.ring.delete(m); continue; }
      const cx = n ? sx / n : r ? r.cx : 0, cy = n ? sy / n : r ? r.cy : 0;
      if (!r) {
        // Keep the last seconds around the zombies, in case an attack starts.
        if (!n) { let zx = 0, zy = 0, k = 0; for (let i = 0; i < e.hi; i++) if (e.kind[i] === Kind.Threat && e.map[i] === m) { zx += e.x[i]!; zy += e.y[i]!; k++; } this.keepRing(m, zx / k, zy / k); continue; }
        r = { m, start: w.gameSec, frames: [], events: [], who: [], idx: new Map(), cx, cy, quiet: 0, bites: 0, killed: 0, deaths: [] };
        for (const f of this.ring.get(m) ?? []) r.frames.push(this.rows(r, f.rows));
        r.start -= (r.frames.length / HZ) * w.opt.clockScale;
        this.rec.set(m, r);
        this.ring.delete(m);
      }
      r.cx += (cx - r.cx) * 0.3; r.cy += (cy - r.cy) * 0.3;
      r.frames.push(this.rows(r, this.sample(m, r.cx, r.cy)));
      // Over when nobody is chased, fighting or running for 10 s (or the zombies are gone), or too long.
      let busy = n > 0;
      if (!busy) for (let i = 0; i < e.hi && !busy; i++) if (e.map[i] === m && e.kind[i] === Kind.Agent && (e.act[i] === Act.Fight || e.act[i] === Act.Flee) && Math.hypot(e.x[i]! - r.cx, e.y[i]! - r.cy) < RADIUS) busy = true;
      r.quiet = busy ? 0 : r.quiet + 1;
      if (r.quiet >= QUIET || !zed && r.quiet >= HZ * 2 || r.frames.length >= MAX) this.finish(r);
    }
  }

  /** Stop every recording now (server stopping): what was seen so far is kept. */
  flush(): void { for (const r of [...this.rec.values()]) this.finish(r); }

  private keepRing(m: number, cx: number, cy: number): void {
    let ring = this.ring.get(m);
    if (!ring) this.ring.set(m, (ring = []));
    ring.push({ rows: this.sample(m, cx, cy), cx, cy });
    if (ring.length > BEFORE) ring.shift();
  }

  /** Everyone within RADIUS of (cx, cy): rows [entity id, x, y, angle, act, hp, flags, kind]. */
  private sample(m: number, cx: number, cy: number): number[][] {
    const e = this.w.e, out: number[][] = [];
    for (let i = 0; i < e.hi; i++) {
      const k = e.kind[i];
      if ((k !== Kind.Agent && k !== Kind.Player && k !== Kind.Threat) || e.map[i] !== m) continue;
      if (Math.hypot(e.x[i]! - cx, e.y[i]! - cy) > RADIUS) continue;
      out.push([e.id(i), e.x[i]!, e.y[i]!, e.angle[i]!, e.act[i]!, e.hp[i]!, e.flags[i]!, k === Kind.Agent ? 0 : k === Kind.Player ? 1 : 2]);
    }
    return out;
  }

  private whoIdx(r: Rec, id: number, kind: number): number {
    let k = r.idx.get(id);
    if (k === undefined) {
      k = r.who.length; r.idx.set(id, k);
      const name = kind === 2 ? `Z${r.who.filter((x) => x[1] === 2).length + 1}` : this.w.profiles.get(id)?.name ?? this.nameOf(id) ?? `#${id & 0xffff}`;
      r.who.push([id, kind, name]);
    }
    return k;
  }

  private rows(r: Rec, rows: number[][]): number[] {
    const f = [rows.length];
    for (const [id, x, y, a, act, hp, fl, kind] of rows) {
      f.push(this.whoIdx(r, id!, kind!), Math.round(x! * 10), Math.round(y! * 10), Math.round(Math.atan2(Math.sin(a!), Math.cos(a!)) * 5000), act!, Math.max(0, Math.round(hp!)), fl! & 0x7fff);
    }
    return f;
  }

  private onEvent(ev: WorldEvent): void {
    if (!this.rec.size) return;
    const w = this.w, e = w.e, d = ev.data as Record<string, unknown>;
    const id = Number(d.id ?? -1);
    // Which recording: the map of the one it is about (a dead person has left the map: use their death place).
    const slot = id >= 0 ? e.slot(id) : -1;
    let r: Rec | undefined;
    if (slot >= 0 && e.map[slot] !== NO_MAP) r = this.rec.get(e.map[slot]!);
    else if (typeof d.map === 'string') r = this.rec.get(w.mapIndex.get(d.map) ?? -1);
    if (!r) return;
    const f = r.frames.length, idx = (x: unknown) => (r!.idx.has(Number(x)) ? r!.idx.get(Number(x))! : -1);
    switch (ev.kind) {
      case 'bitten': if (idx(d.id) >= 0) { r.events.push([f, 'bite', idx(d.id), idx(d.by), Number(d.hp)]); r.bites++; } break;
      case 'zombie': if (d.how === 'killed' && idx(d.id) >= 0) { r.events.push([f, 'killed', idx(d.id), idx(d.by), 0]); r.killed++; } break;
      case 'death': if (idx(d.id) >= 0) { r.events.push([f, 'death', idx(d.id), -1, String(d.cause ?? '')]); r.deaths.push(r.who[idx(d.id)]![2]); } break;
      case 'fight': case 'flee': { // once per person and kind every 5 s (they decide again often while it lasts)
        const k = idx(d.id);
        if (k >= 0 && !r.events.some((x) => x[1] === ev.kind && x[2] === k && f - x[0] < 5 * HZ)) r.events.push([f, ev.kind, k, idx(d.zombie), 0]);
        break;
      }
      case 'say': if (idx(d.id) >= 0) r.events.push([f, 'say', idx(d.id), -1, String(d.text ?? '').slice(0, 200)]); break;
    }
  }

  private finish(r: Rec): void {
    const w = this.w;
    this.rec.delete(r.m);
    if (r.frames.length < HZ * 3 || !r.events.length) return; // a glimpse, or nothing happened (a zombie at a hut's wall all night)
    let len = 0;
    for (const f of r.frames) len += f.length;
    const a = new Int16Array(len);
    let k = 0;
    for (const f of r.frames) for (const v of f) a[k++] = Math.max(-32768, Math.min(32767, v));
    const people = r.who.filter((x) => x[1] !== 2).map((x) => x[2]);
    const rep: Replay = {
      id: this.nextId++, map: w.maps[r.m]!.def.id, start: r.start, end: w.gameSec, secs: Math.round(r.frames.length / HZ),
      people, zombies: r.who.filter((x) => x[1] === 2).length, bites: r.bites, killed: r.killed, deaths: r.deaths,
      hz: HZ, who: r.who, frames: Buffer.from(a.buffer).toString('base64'), events: r.events.slice(0, 2000),
    };
    void ROW;
    w.emit('replay', { id: rep.id, map: rep.map, secs: rep.secs, people: people.join(', '), zombies: rep.zombies });
    this.onDone(rep);
  }
}

/** The list a viewer sees (no frames). */
export function summary(r: Replay): ReplaySummary {
  const { id, map, start, end, secs, people, zombies, bites, killed, deaths } = r;
  return { id, map, start, end, secs, people, zombies, bites, killed, deaths };
}
