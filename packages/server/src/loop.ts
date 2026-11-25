/**
 * Fixed-timestep scheduler. The world always advances in whole ticks of 1/tickRate simulated seconds;
 * `speed` only changes how many ticks run per real second (x1 = tickRate per second, x100 = 100 times that).
 * When the machine can not keep up, it runs what it can (at most `budgetMs` per wake, so the network and
 * timers stay responsive) and drops the backlog: the effective speed goes down, the physics never gets a
 * bigger step.
 */
export class Loop {
  speed: number;
  paused = false;
  private acc = 0;
  private last = 0;
  private timer: NodeJS.Timeout | NodeJS.Immediate | null = null;
  private running = false;
  /** Ticks run in the last full second and the effective speed derived from it. */
  ticksLastSec = 0;
  effSpeed = 0;
  private secStart = 0;
  private secTicks = 0;

  constructor(
    private readonly step: () => void,
    readonly tickRate: number,
    speed = 1,
    private readonly budgetMs = 25,
    readonly maxSpeed = 100,
  ) {
    this.speed = speed;
  }

  /** force = the owner confirmed a speed above the configured maximum. */
  setSpeed(s: number, force = false): void {
    if (!(s > 0)) throw new Error('speed must be > 0');
    this.speed = force ? s : Math.min(this.maxSpeed, s);
  }

  start(): void {
    if (this.running) return;
    this.running = true;
    this.last = performance.now();
    this.secStart = this.last;
    this.schedule(0);
  }

  stop(): void {
    this.running = false;
    if (this.timer) { clearTimeout(this.timer as NodeJS.Timeout); clearImmediate(this.timer as NodeJS.Immediate); }
    this.timer = null;
  }

  private schedule(ms: number): void {
    if (!this.running) return;
    this.timer = ms <= 0 ? setImmediate(() => this.wake()) : setTimeout(() => this.wake(), ms);
  }

  private wake(): void {
    const now = performance.now();
    const realDt = (now - this.last) / 1000;
    this.last = now;
    const rate = this.tickRate * this.speed;
    if (!this.paused) {
      this.acc += realDt * rate;
      const start = now;
      while (this.acc >= 1) {
        this.step();
        this.acc -= 1;
        this.secTicks++;
        if (performance.now() - start > this.budgetMs) break;
      }
      // More than half a second behind: drop it (effective speed goes down).
      if (this.acc > rate * 0.5) this.acc = rate * 0.5;
    } else {
      this.acc = 0;
    }
    if (now - this.secStart >= 1000) {
      const secs = (now - this.secStart) / 1000;
      this.ticksLastSec = this.secTicks / secs;
      this.effSpeed = this.ticksLastSec / this.tickRate;
      this.secTicks = 0;
      this.secStart = now;
    }
    if (this.paused) { this.schedule(100); return; }
    if (this.acc >= 1) { this.schedule(0); return; }
    // Sleep until the next tick is due (>= 1 ms; at high speed setImmediate keeps it tight).
    const waitMs = ((1 - this.acc) / rate) * 1000;
    this.schedule(waitMs < 1 ? 0 : Math.floor(waitMs));
  }
}
