/**
 * Game sounds (imad 2026-11-20: "high quality audio for effects, movements, actions, animals, zombies, with options").
 * Real recordings (CC0 / CC-BY, docs/audio/CREDITS.md) listed in docs/audio/manifest.json.
 * - One-shots are decoded once into AudioBuffers (short, mono) and played through one Web Audio graph:
 *   source -> gain (distance) -> stereo pan (left / right of the camera) -> bus (effects / ui / voices) -> master.
 * - Loops (ambience, fire, rain) are streamed <audio> elements, so they cost no decoded memory on small TVs. Each loop has
 *   TWO players: a few seconds before one ends the other starts from a random place and they crossfade (equal power), so
 *   there is never a gap at the seam (an <audio loop> stops for a moment there) and the 45-80 s recordings never repeat
 *   the same way (imad 2026-11-27: "fire is badly repeating, it needs to be continuous like rain and wind and the night").
 * - At most MAX_VOICES at once; the same sound at most once per 60 ms. Missing files are simply silent.
 */
export interface SoundPrefs { on: boolean; master: number; fx: number; amb: number; ui: number }
export const SOUND_DEFAULTS: SoundPrefs = { on: true, master: 0.8, fx: 0.9, amb: 0.5, ui: 0.6 };

interface Entry { id: string; files: string[]; cat: string; loop?: boolean; gain?: number }
const MAX_VOICES = 14;
const HEAR = 26; // metres: quieter with distance, silent past this
const XFADE = 3; // seconds: the two players of a loop overlap this long
interface Loop { id: string; file: string; a: HTMLAudioElement | null; b: HTMLAudioElement | null; x: number; want: number; cur: number }

export class Sound {
  prefs: SoundPrefs = { ...SOUND_DEFAULTS };
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private bus: Record<string, GainNode> = {};
  private entries = new Map<string, Entry>();
  private buffers = new Map<string, AudioBuffer[]>();
  private loading = new Set<string>();
  private lastAt = new Map<string, number>();
  private voices = 0;
  private loops = new Map<string, Loop>();
  private lastPick = new Map<string, number>();
  private base = '';
  /** Listener: where the camera looks and which way (yaw: 0 = north). */
  lx = 0; ly = 0; yaw = 0; topView = true;
  ready = false;
  /** The last sounds played (newest last): for checks. */
  readonly log: string[] = [];
  stats() { return { ready: this.ready, state: this.ctx?.state ?? 'none', sounds: this.entries.size, decoded: this.buffers.size, loops: [...this.loops.entries()].map(([k, l]) => `${k}:${l.cur.toFixed(2)}${l.b ? '+x' : ''}`), swaps: this.swaps, log: this.log.slice() }; }

  async load(base: string): Promise<void> {
    this.base = base;
    try {
      const r = await fetch(base + 'manifest.json', { cache: 'no-cache' });
      if (!r.ok) return;
      const m = (await r.json()) as { sounds?: Entry[] };
      for (const e of m.sounds ?? []) if (e && e.id && Array.isArray(e.files) && e.files.length) this.entries.set(e.id, e);
      this.ready = true;
    } catch { /* no sounds: the game stays silent */ }
  }

  has(id: string): boolean { return this.entries.has(id); }

  /** Create the audio graph on the first button press (TVs and browsers want a gesture before sound). */
  unlock(): void {
    if (this.ctx) { if (this.ctx.state === 'suspended') void this.ctx.resume().catch(() => {}); return; }
    try {
      const AC = (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext);
      this.ctx = new AC({ latencyHint: 'interactive' });
    } catch { return; }
    this.master = this.ctx.createGain();
    this.master.connect(this.ctx.destination);
    for (const b of ['fx', 'ui']) { const g = this.ctx.createGain(); g.connect(this.master); this.bus[b] = g; }
    this.apply();
    // Decode the one-shots in the background, a few at a time.
    void this.preload();
  }

  private async preload(): Promise<void> {
    const list = [...this.entries.values()].filter((e) => !e.loop);
    for (let i = 0; i < list.length; i += 4) await Promise.all(list.slice(i, i + 4).map((e) => this.decode(e)));
  }

  private async decode(e: Entry): Promise<AudioBuffer[] | null> {
    if (this.buffers.has(e.id)) return this.buffers.get(e.id)!;
    if (!this.ctx || this.loading.has(e.id)) return null;
    this.loading.add(e.id);
    const out: AudioBuffer[] = [];
    for (const f of e.files) {
      try {
        const r = await fetch(this.base + f);
        if (!r.ok) continue;
        const data = await r.arrayBuffer();
        out.push(await new Promise<AudioBuffer>((ok, bad) => this.ctx!.decodeAudioData(data, ok, bad)));
      } catch { /* this variant is missing: the others play */ }
    }
    this.loading.delete(e.id);
    this.buffers.set(e.id, out);
    return out;
  }

  /** Volumes / on-off changed. */
  apply(): void {
    const p = this.prefs;
    if (this.master) this.master.gain.value = p.on ? p.master : 0;
    if (this.bus.fx) this.bus.fx.gain.value = p.fx;
    if (this.bus.ui) this.bus.ui.gain.value = p.ui;
    for (const l of this.loops.values()) this.setLoopVol(l);
  }

  /**
   * Play a sound. With (x, y): from that place in the world (quieter far away, left / right of the camera).
   * `vol` scales it, `rate` changes the pitch a little (variety).
   */
  play(id: string, x?: number, y?: number, vol = 1, rate = 1): void { this.start(id, x, y, vol, rate); }

  /** Far away, beyond hearing range (thunder, a howl over the hills): only a side (-1 left .. 1 right) and a volume. */
  playFar(id: string, pan: number, vol = 1, rate = 1): void { this.start(id, undefined, undefined, vol, rate, pan); }

  private start(id: string, x?: number, y?: number, vol = 1, rate = 1, side = 0): void {
    const ctx = this.ctx, e = this.entries.get(id);
    if (!ctx || !e || !this.prefs.on || ctx.state !== 'running' || this.voices >= MAX_VOICES) return;
    const now = performance.now();
    if (now - (this.lastAt.get(id) ?? 0) < 60) return;
    const bufs = this.buffers.get(id);
    if (!bufs) { void this.decode(e); return; }
    if (!bufs.length) return;
    let g = (e.gain ?? 1) * vol, pan = Math.max(-0.9, Math.min(0.9, side));
    if (x !== undefined && y !== undefined) {
      const dx = x - this.lx, dy = y - this.ly, d = Math.hypot(dx, dy);
      if (d > HEAR) return;
      g *= d < 3 ? 1 : Math.pow(1 - (d - 3) / (HEAR - 3), 1.6);
      // Side of the camera: from above the camera looks north (x = right); in third / first person along yaw.
      const right = this.topView ? dx : dx * Math.cos(this.yaw) + dy * Math.sin(this.yaw);
      pan = Math.max(-0.85, Math.min(0.85, right / 10));
    }
    if (g < 0.02) return;
    this.lastAt.set(id, now);
    const src = ctx.createBufferSource();
    // A different take from the last one (never the same recording twice in a row).
    let k = (Math.random() * bufs.length) | 0;
    if (bufs.length > 1 && k === this.lastPick.get(id)) k = (k + 1 + ((Math.random() * (bufs.length - 1)) | 0)) % bufs.length;
    this.lastPick.set(id, k);
    src.buffer = bufs[k]!;
    src.playbackRate.value = rate * (0.94 + Math.random() * 0.12);
    const gain = ctx.createGain();
    gain.gain.value = g;
    src.connect(gain);
    let last: AudioNode = gain;
    if (pan && ctx.createStereoPanner) { const p = ctx.createStereoPanner(); p.pan.value = pan; gain.connect(p); last = p; }
    last.connect(e.cat === 'ui' ? this.bus.ui! : this.bus.fx!);
    this.voices++;
    this.log.push(id); if (this.log.length > 30) this.log.shift();
    src.onended = () => { this.voices--; try { last.disconnect(); gain.disconnect(); } catch { /* gone */ } };
    src.start();
  }

  /** A looping sound (ambience, a campfire) at volume 0..1; 0 fades it out and stops it. */
  loop(id: string, vol: number): void {
    const e = this.entries.get(id);
    if (!e || !e.loop) return;
    let l = this.loops.get(id);
    if (!l) {
      if (vol <= 0.01 || !this.ctx) return;
      l = { id, file: this.base + e.files[(Math.random() * e.files.length) | 0]!, a: null, b: null, x: 0, want: 0, cur: 0 };
      l.a = this.player(l, true);
      this.loops.set(id, l);
    }
    l.want = vol * (e.gain ?? 1);
  }

  private swaps = 0;
  private player(l: Loop, first: boolean): HTMLAudioElement {
    const el = new Audio(l.file);
    el.preload = 'auto'; el.loop = true; el.volume = 0; // loop = a safety net only: the other player takes over before the end
    // Start somewhere in the recording (the first pass anywhere, later ones in the first third), so passes never line up.
    el.addEventListener('loadedmetadata', () => {
      const d = el.duration;
      if (isFinite(d) && d > XFADE * 3) { try { el.currentTime = Math.random() * (first ? d * 0.7 : d * 0.33); } catch { /* not seekable yet */ } }
    }, { once: true });
    return el;
  }

  private stopEl(el: HTMLAudioElement | null): void { if (!el) return; el.pause(); el.removeAttribute('src'); el.load(); }

  private setLoopVol(l: Loop): void {
    const p = this.prefs, v = p.on ? l.cur * p.amb * p.master : 0;
    // Equal-power crossfade between the two players.
    const ga = l.b ? Math.cos(l.x * Math.PI / 2) : 1, gb = Math.sin(l.x * Math.PI / 2);
    if (l.a) l.a.volume = Math.max(0, Math.min(1, v * ga));
    if (l.b) l.b.volume = Math.max(0, Math.min(1, v * gb));
  }

  /** Every frame (or so): loops fade towards where they should be, and hand over to their second player near the end. */
  tick(dt: number): void {
    for (const [id, l] of this.loops) {
      const k = Math.min(1, dt * 1.5);
      l.cur += (l.want - l.cur) * k;
      if (l.want <= 0.01 && l.cur < 0.01) { this.stopEl(l.a); this.stopEl(l.b); this.loops.delete(id); continue; }
      const a = l.a!;
      if (!l.b) {
        const d = a.duration, left = d - a.currentTime;
        if (isFinite(d) && d > XFADE * 3 && !a.paused && left < XFADE + 0.25) { l.b = this.player(l, false); l.x = 0; this.swaps++; }
      } else {
        if (!l.b.paused && l.b.currentTime > 0) l.x = Math.min(1, l.x + dt / XFADE);
        if (l.x >= 1) { this.stopEl(a); l.a = l.b; l.b = null; l.x = 0; }
      }
      this.setLoopVol(l);
      if (this.prefs.on && this.ctx) for (const el of [l.a, l.b]) if (el && el.paused) void el.play().catch(() => {});
    }
  }

  /** For checks: move every loop close to its end, so the handover to the second player happens now. */
  seekEnd(): number {
    let n = 0;
    for (const l of this.loops.values()) { const a = l.a; if (a && !l.b && isFinite(a.duration)) { a.currentTime = Math.max(0, a.duration - XFADE - 1); n++; } }
    return n;
  }
  /** For checks: each loop's players (time / length / volume / playing). */
  players(): Record<string, string> {
    const o: Record<string, string> = {}, f = (e: HTMLAudioElement | null) => (e ? `${e.currentTime.toFixed(1)}/${(e.duration || 0).toFixed(0)}@${e.volume.toFixed(2)}${e.paused ? 'p' : ''}` : '-');
    for (const [k, l] of this.loops) o[k] = f(l.a) + ' | ' + f(l.b);
    return o;
  }

  /** The app is hidden / under My PC's menu: everything stops; back: it goes on. */
  pause(on: boolean): void {
    if (on) { for (const l of this.loops.values()) { l.a?.pause(); l.b?.pause(); } void this.ctx?.suspend().catch(() => {}); }
    else { void this.ctx?.resume().catch(() => {}); }
  }
}
