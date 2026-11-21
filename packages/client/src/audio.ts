/**
 * Game sounds (imad 2026-11-20: "high quality audio for effects, movements, actions, animals, zombies, with options").
 * Real recordings (CC0 / CC-BY, docs/audio/CREDITS.md) listed in docs/audio/manifest.json.
 * - One-shots are decoded once into AudioBuffers (short, mono) and played through one Web Audio graph:
 *   source -> gain (distance) -> stereo pan (left / right of the camera) -> bus (effects / ui / voices) -> master.
 * - Loops (ambience, fire) are <audio loop> elements: streamed, so they cost no decoded memory on small TVs.
 * - At most MAX_VOICES at once; the same sound at most once per 60 ms. Missing files are simply silent.
 */
export interface SoundPrefs { on: boolean; master: number; fx: number; amb: number; ui: number }
export const SOUND_DEFAULTS: SoundPrefs = { on: true, master: 0.8, fx: 0.9, amb: 0.5, ui: 0.6 };

interface Entry { id: string; files: string[]; cat: string; loop?: boolean; gain?: number }
const MAX_VOICES = 14;
const HEAR = 26; // metres: quieter with distance, silent past this

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
  private loops = new Map<string, { el: HTMLAudioElement; want: number; cur: number }>();
  private base = '';
  /** Listener: where the camera looks and which way (yaw: 0 = north). */
  lx = 0; ly = 0; yaw = 0; topView = true;
  ready = false;
  /** The last sounds played (newest last): for checks. */
  readonly log: string[] = [];
  stats() { return { ready: this.ready, state: this.ctx?.state ?? 'none', sounds: this.entries.size, decoded: this.buffers.size, loops: [...this.loops.entries()].map(([k, l]) => `${k}:${l.cur.toFixed(2)}`), log: this.log.slice() }; }

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
  play(id: string, x?: number, y?: number, vol = 1, rate = 1): void {
    const ctx = this.ctx, e = this.entries.get(id);
    if (!ctx || !e || !this.prefs.on || ctx.state !== 'running' || this.voices >= MAX_VOICES) return;
    const now = performance.now();
    if (now - (this.lastAt.get(id) ?? 0) < 60) return;
    const bufs = this.buffers.get(id);
    if (!bufs) { void this.decode(e); return; }
    if (!bufs.length) return;
    let g = (e.gain ?? 1) * vol, pan = 0;
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
    src.buffer = bufs[(Math.random() * bufs.length) | 0]!;
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
      const el = new Audio(this.base + e.files[0]);
      el.loop = true; el.preload = 'auto'; el.volume = 0;
      l = { el, want: 0, cur: 0 };
      this.loops.set(id, l);
    }
    l.want = vol * (e.gain ?? 1);
  }

  private setLoopVol(l: { el: HTMLAudioElement; cur: number }): void {
    const p = this.prefs, v = p.on ? l.cur * p.amb * p.master : 0;
    l.el.volume = Math.max(0, Math.min(1, v));
  }

  /** Every frame (or so): loops fade towards where they should be. */
  tick(dt: number): void {
    for (const [id, l] of this.loops) {
      const k = Math.min(1, dt * 1.5);
      l.cur += (l.want - l.cur) * k;
      if (l.want <= 0.01 && l.cur < 0.01) { l.el.pause(); l.el.removeAttribute('src'); l.el.load(); this.loops.delete(id); continue; }
      this.setLoopVol(l);
      if (l.el.paused && this.prefs.on && this.ctx) void l.el.play().catch(() => {});
    }
  }

  /** The app is hidden / under My PC's menu: everything stops; back: it goes on. */
  pause(on: boolean): void {
    if (on) { for (const l of this.loops.values()) l.el.pause(); void this.ctx?.suspend().catch(() => {}); }
    else { void this.ctx?.resume().catch(() => {}); }
  }
}
