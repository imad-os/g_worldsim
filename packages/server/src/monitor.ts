/** Tick timings, RAM and CPU, sampled without allocating per tick. */
export class Monitor {
  private readonly ring = new Float64Array(1200);
  private n = 0;
  private pos = 0;
  private lastCpu = process.cpuUsage();
  private lastCpuAt = performance.now();
  cpuPct = 0;
  readonly startedAt = Date.now();

  recordTick(ms: number): void {
    this.ring[this.pos] = ms;
    this.pos = (this.pos + 1) % this.ring.length;
    if (this.n < this.ring.length) this.n++;
  }

  /** Called about once a second. */
  sample(): { avg: number; p95: number; max: number; rssMb: number; heapMb: number; cpuPct: number } {
    const now = performance.now();
    const cpu = process.cpuUsage(this.lastCpu);
    this.cpuPct = ((cpu.user + cpu.system) / 1000 / (now - this.lastCpuAt)) * 100;
    this.lastCpu = process.cpuUsage();
    this.lastCpuAt = now;
    const v = this.ring.slice(0, this.n).sort();
    let sum = 0;
    for (let i = 0; i < v.length; i++) sum += v[i]!;
    const mem = process.memoryUsage();
    return {
      avg: v.length ? sum / v.length : 0,
      p95: v.length ? v[Math.min(v.length - 1, Math.floor(v.length * 0.95))]! : 0,
      max: v.length ? v[v.length - 1]! : 0,
      rssMb: mem.rss / 1048576,
      heapMb: mem.heapUsed / 1048576,
      cpuPct: this.cpuPct,
    };
  }
}
