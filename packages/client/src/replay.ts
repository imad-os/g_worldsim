/**
 * Past events: a recorded zombie attack played back in the 3D view (server: sim/replays.ts). Not a video: the
 * positions, facing, actions and health of everyone near the fight 5 times a second, plus what happened (bites,
 * kills, deaths, who fought or ran, what they said). The player interpolates between samples, so it moves smoothly
 * at 60 fps; A / OK = pause, left / right = 5 s back / on, up / down = speed, B / Back = back to the list.
 */
import { t, tf } from './i18n.js';
const esc = (s: string) => s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
import type { People, PersonLook } from './gfx/people.js';

export interface ReplaySummary { id: number; map: string; start: number; end: number; secs: number; people: string[]; zombies: number; bites: number; killed: number; deaths: string[] }
export interface ReplayRec extends ReplaySummary {
  hz: number; who: [number, number, string][]; frames: string;
  events: [number, string, number, number, number | string][];
}

import { Color } from 'three';
const MARK = new Color(0xffffff);
const SPEEDS = [0.5, 1, 2, 4];
const SLEEP = 4, DEAD = 8, CHILD = 32;

/** "Day 2 21:40" from game seconds. */
export function gameTime(gs: number, day: string): string {
  const d = Math.floor((gs / 3600 + 8) / 24) + 1, h = Math.floor((gs / 3600 + 8) % 24), m = Math.floor((gs / 60) % 60);
  return `${day} ${d} ${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export class ReplayPlayer {
  readonly rec: ReplayRec;
  t = 0; playing = true; speed = 1;
  private data: Int16Array;
  private offs: number[] = [];
  private face: Float32Array; private phase: Float32Array; private lastX: Float32Array; private lastY: Float32Array; private spd: Float32Array;
  private el: HTMLDivElement;
  private html = '';
  /** The centre of what is drawn (the camera follows it). */
  cx = 0; cy = 0;
  /** How wide the group is (metres): the camera backs off to fit it. */
  span = 10;

  constructor(rec: ReplayRec, private mapName: string, private scale: number, private looks: (k: number, name: string) => PersonLook, private zombie: PersonLook) {
    this.rec = rec;
    const bin = atob(rec.frames), u8 = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i);
    this.data = new Int16Array(u8.buffer, 0, u8.length >> 1);
    for (let k = 0; k < this.data.length; k += 1 + this.data[k]! * 7) this.offs.push(k);
    const n = rec.who.length;
    this.face = new Float32Array(n); this.phase = new Float32Array(n); this.lastX = new Float32Array(n).fill(NaN); this.lastY = new Float32Array(n); this.spd = new Float32Array(n);
    this.el = document.createElement('div');
    this.el.id = 'replay';
    document.body.appendChild(this.el);
    this.centre(0);
  }

  get length(): number { return Math.max(0, this.offs.length - 1) / this.rec.hz; }

  close(): void { this.el.remove(); }

  toggle(): void { if (this.t >= this.length) this.t = 0; this.playing = !this.playing; }
  seek(ds: number): void { this.t = Math.max(0, Math.min(this.length, this.t + ds)); this.lastX.fill(NaN); }
  faster(up: boolean): void { const i = SPEEDS.indexOf(this.speed); this.speed = SPEEDS[Math.max(0, Math.min(SPEEDS.length - 1, i + (up ? 1 : -1)))]!; }

  update(dt: number): void {
    if (!this.playing) return;
    this.t += dt * this.speed;
    if (this.t >= this.length) { this.t = this.length; this.playing = false; }
  }

  /** Rows of frame f: who index -> [x, y, angle, act, hp, flags]. */
  private rows(f: number, out: Map<number, number[]>): void {
    out.clear();
    const d = this.data, o = this.offs[Math.max(0, Math.min(this.offs.length - 1, f))];
    if (o === undefined) return;
    const n = d[o]!;
    for (let r = 0, k = o + 1; r < n; r++, k += 7) out.set(d[k]!, [d[k + 1]! / 10, d[k + 2]! / 10, d[k + 3]! / 5000, d[k + 4]!, d[k + 5]!, d[k + 6]!]);
  }
  private a = new Map<number, number[]>();
  private b = new Map<number, number[]>();

  private centre(f: number): void {
    this.rows(f, this.a);
    let sx = 0, sy = 0, n = 0;
    for (const [w, r] of this.a) { const z = this.rec.who[w]![1] === 2 ? 2 : 1; sx += r[0]! * z; sy += r[1]! * z; n += z; }
    if (n) { this.cx = sx / n; this.cy = sy / n; }
  }

  /** Draw everyone at time t. */
  draw(P: People, dt: number, actName: (a: number) => string): void {
    const fr = this.t * this.rec.hz, f = Math.floor(fr), k = fr - f;
    this.rows(f, this.a); this.rows(f + 1, this.b);
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    for (const [w, ra] of this.a) {
      const rb = this.b.get(w) ?? ra, who = this.rec.who[w]!, zed = who[1] === 2;
      const x = ra[0]! + (rb[0]! - ra[0]!) * k, y = ra[1]! + (rb[1]! - ra[1]!) * k;
      const lx = this.lastX[w]!, moved = Number.isNaN(lx) ? 0 : Math.hypot(x - lx, y - this.lastY[w]!);
      if (moved > 0.004) this.face[w] = Math.atan2(x - lx, y - this.lastY[w]!);
      this.lastX[w] = x; this.lastY[w] = y;
      const v = dt > 0 ? Math.min(6, moved / dt) : 0;
      this.spd[w] = this.spd[w]! + (v - this.spd[w]!) * Math.min(1, dt * 10);
      this.phase[w] = (this.phase[w]! + moved * 4.2) % (Math.PI * 2);
      const fl = ra[5]!;
      P.add(x, y, this.face[w]!, this.phase[w]!, Math.min(1, this.spd[w]! / (zed ? 1.2 : 2.2)), zed ? this.zombie : this.looks(who[0], who[2]),
        (fl & (SLEEP | DEAD)) !== 0, fl & CHILD ? 0.62 : 1, zed);
      if (!zed) P.marker(x, y, performance.now() / 1000, MARK);
      x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y);
    }
    // The camera keeps everyone in view: the middle of all of them, far enough back to see them all.
    if (x0 <= x1) {
      const q = Math.min(1, dt * 3);
      this.cx += ((x0 + x1) / 2 - this.cx) * q; this.cy += ((y0 + y1) / 2 - this.cy) * q;
      this.span += (Math.max(x1 - x0, (y1 - y0) * 1.6) - this.span) * q;
    }
    this.overlay(f, actName);
  }

  private overlay(f: number, actName: (a: number) => string): void {
    const r = this.rec, name = (i: number) => (i >= 0 ? esc(r.who[i]?.[2] ?? '?') : '?');
    const lines: string[] = [];
    for (let i = r.events.length - 1; i >= 0 && lines.length < 4; i--) {
      const [ef, kind, a, b, v] = r.events[i]!;
      if (ef > f || f - ef > r.hz * 6) continue;
      const txt = kind === 'bite' ? tf('evBite', name(b), name(a), String(v)) : kind === 'killed' ? tf('evKilled', name(b), name(a))
        : kind === 'death' ? tf('evDeath', name(a)) : kind === 'fight' ? tf('evFight', name(a), name(b)) : kind === 'flee' ? tf('evFlee', name(a), name(b))
        : `${name(a)}: “${esc(String(v))}”`;
      lines.unshift(`<div class="re re-${kind}">${txt}</div>`);
    }
    // Who is in it now, and what they do / their health.
    this.rows(f, this.a);
    const people: string[] = [];
    for (const [w, row] of this.a) {
      const who = r.who[w]!;
      if (who[1] === 2) continue;
      people.push(`<span class="rp-p"><b>${esc(who[2])}</b> ${actName(row[3]!)} · ${row[4]!}</span>`);
    }
    const mm = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
    const pct = this.length ? (this.t / this.length) * 100 : 0;
    const html = `<div class="rp-t">${t('rpTitle')} · ${esc(gameTime(r.start + this.t * this.scale, t('day')))} · ${esc(this.mapName)}</div>`
      + `<div class="rp-bar"><i style="width:${pct.toFixed(1)}%"></i></div>`
      + `<div class="rp-s"><span>${this.playing ? '▶' : '❚❚'} ${mm(this.t)} / ${mm(this.length)} · x${this.speed}</span><span>${t('rpHint')}</span></div>`
      + `<div class="rp-people">${people.join('')}</div><div class="rp-ev">${lines.join('')}</div>`;
    if (html !== this.html) { this.html = html; this.el.innerHTML = html; }
  }
}
