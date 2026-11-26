/**
 * Adaptive resolution (imad 2026-11-26: "60 fps on low-end devices without losing quality").
 *
 * The 3D view is drawn at `scale` x the screen and stretched to fit. On a small GPU the number of pixels is what costs most, so
 * when the frame rate falls under the screen's rate the picture is drawn a little smaller (5 % steps, never under `min`), and
 * when it has been smooth for a while it goes back up (never over `max`). A step up that brings the stutter back is not tried
 * again for a while (30 s, doubling to 5 min), so it settles instead of see-sawing. Everything on top (menus, text, the HUD) is
 * HTML and stays sharp. The screen's own rate is learnt (the best second seen, 50-60 Hz), so a 50 Hz TV is not "always slow".
 */
export class DynRes {
  scale: number;
  private n = 0; private at = 0; private slow = 0; private good = 0;
  private hz = 50;
  private raisedAt = -1e9; private raisedTo = 0;
  private blocked = new Map<number, number>(); // scale (x100) -> until (ms)
  private wait = 30000;
  /** Seconds of smooth frames before trying a step up. */
  upAfter = 8;

  constructor(readonly start: number, readonly min: number, readonly max: number) { this.scale = start; }

  /** Last second's frame rate (0 = not measured yet). */
  fps = 0;

  /**
   * One drawn frame at `now` (ms). `steady` = false while nothing should be judged (a menu draws 10 times a second, loading,
   * a new map). Returns true when `scale` changed (resize the canvas).
   */
  frame(now: number, steady: boolean): boolean {
    if (!steady) { this.n = 0; this.at = now; return false; }
    if (!this.at) { this.at = now; return false; }
    this.n++;
    const span = now - this.at;
    if (span < 1000) return false;
    const fps = (this.fps = (this.n * 1000) / span);
    this.n = 0; this.at = now;
    if (span > 1600) return false; // the tab slept or a long hitch (a map loading): not a fair second
    this.hz = Math.min(60, Math.max(this.hz, Math.round(fps)));
    if (fps < this.hz - 5) {
      this.good = 0;
      if (++this.slow < 2) return false;
      this.slow = 0;
      if (now - this.raisedAt < 15000 && this.raisedTo) { // the last step up did not hold: leave that size alone for a while
        this.blocked.set(this.raisedTo, now + this.wait);
        this.wait = Math.min(300000, this.wait * 2);
        this.raisedTo = 0;
      }
      return this.set(this.scale - 0.05);
    }
    this.slow = 0;
    if (fps >= this.hz - 1.5) {
      if (++this.good < this.upAfter) return false;
      this.good = 0;
      const up = Math.round((this.scale + 0.05) * 100);
      if (this.scale >= this.max - 1e-6 || (this.blocked.get(up) ?? 0) > now) return false;
      this.raisedAt = now; this.raisedTo = up;
      return this.set(this.scale + 0.05);
    }
    return false;
  }

  private set(s: number): boolean {
    const v = Math.round(Math.min(this.max, Math.max(this.min, s)) * 100) / 100;
    if (Math.abs(v - this.scale) < 1e-6) return false;
    this.scale = v;
    return true;
  }
}
