import { spawn, execFile, type ChildProcess } from 'node:child_process';
import type { Logger } from './log.js';

/**
 * Outbound tunnels: the PC opens a connection to a tunnel service, which gives a public https address.
 * No router port is opened. Every provider is the same small adapter, so the simulation, the WebSocket
 * server and the login never know which one is used.
 */
export type ProviderName = 'ngrok' | 'tailscale' | 'cloudflare' | 'cloudflare-quick' | 'none';
export interface TunnelStatus { provider: ProviderName; state: 'off' | 'starting' | 'up' | 'error'; url: string; error?: string; check?: { at: number; ok: boolean; restarts: number; fails: number } }

export interface TunnelOptions {
  port: number;
  /** Program paths (default: found on PATH). */
  bin?: { ngrok?: string; cloudflared?: string; tailscale?: string };
  /** ngrok: your free static domain (e.g. "name.ngrok-free.app"); empty = ngrok's default for the account. */
  ngrokDomain?: string;
  /** Cloudflare named tunnel: its public hostname (e.g. "world.example.com"); the token is CLOUDFLARE_TUNNEL_TOKEN in .env. */
  cloudflareHostname?: string;
  cloudflareToken?: string;
}

export interface Tunnel {
  readonly name: ProviderName;
  start(): Promise<void>;
  stop(): Promise<void>;
  status(): TunnelStatus;
  publicUrl(): string;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function run(bin: string, args: string[], timeoutMs = 15000): Promise<string> {
  return new Promise((ok, fail) => {
    execFile(bin, args, { timeout: timeoutMs, windowsHide: true }, (err, stdout, stderr) => (err ? fail(new Error(`${bin} ${args[0]}: ${stderr || err.message}`.trim())) : ok(stdout)));
  });
}

/** Base for providers that run a long-lived program. Restarts it if it dies (10 s, then up to 2 min apart). */
abstract class ProcTunnel implements Tunnel {
  abstract readonly name: ProviderName;
  protected proc: ChildProcess | null = null;
  protected url = '';
  protected state: TunnelStatus['state'] = 'off';
  protected error = '';
  private wanted = false;
  private restarts = 0;

  constructor(protected readonly o: TunnelOptions, protected readonly log: Logger) {}
  protected abstract command(): { bin: string; args: string[]; env?: Record<string, string> };
  /** Find the public URL (from output lines or a local API). */
  protected abstract findUrl(line: string): string | null;
  protected async pollUrl(): Promise<string | null> { return null; }

  async start(): Promise<void> {
    this.wanted = true;
    this.spawn();
    const t0 = Date.now();
    while (Date.now() - t0 < 45000) {
      // Only ask the local API once our own process runs (another ngrok on this PC answers on the same port).
      if (!this.url && this.proc?.pid) { const u = await this.pollUrl().catch(() => null); if (u) this.url = u; }
      if (this.url) { this.state = 'up'; this.error = ''; return; }
      if (this.state === 'error' && !this.proc) throw new Error(this.error || `${this.name} stopped`);
      await sleep(500);
    }
    throw new Error(`${this.name}: no public address after 45 s`);
  }

  private spawn(): void {
    const { bin, args, env } = this.command();
    this.state = 'starting';
    this.url = '';
    let p: ChildProcess;
    try { p = spawn(bin, args, { windowsHide: true, env: { ...process.env, ...env } }); }
    catch (err) { this.state = 'error'; this.error = String(err); return; }
    this.proc = p;
    const onData = (b: Buffer) => {
      for (const line of b.toString().split(/\r?\n/)) {
        const u = line && this.findUrl(line);
        if (u && !this.url) { this.url = u; this.state = 'up'; this.log.info('tunnel up', { provider: this.name, url: u }); }
        if (/ERR_NGROK|authentication failed|failed to|error=/i.test(line) && !this.url) this.error = line.slice(0, 300);
      }
    };
    p.stdout?.on('data', onData);
    p.stderr?.on('data', onData);
    p.on('error', (err) => { this.error = `${bin}: ${err.message}`; this.state = 'error'; this.proc = null; });
    p.on('exit', (code) => {
      this.proc = null;
      if (!this.wanted) { this.state = 'off'; return; }
      this.state = 'error';
      this.error ||= `${bin} exited (${code})`;
      const wait = Math.min(120_000, 10_000 * 2 ** this.restarts++);
      this.log.warn('tunnel stopped, restarting', { provider: this.name, code, inMs: wait });
      setTimeout(() => { if (this.wanted && !this.proc) this.spawn(); }, wait);
    });
  }

  async stop(): Promise<void> {
    this.wanted = false;
    const p = this.proc;
    this.proc = null;
    if (p) { p.kill(); await sleep(300); }
    this.state = 'off';
    this.url = '';
  }

  status(): TunnelStatus { return { provider: this.name, state: this.state, url: this.url, error: this.error || undefined }; }
  publicUrl(): string { return this.url; }
}

class NgrokTunnel extends ProcTunnel {
  readonly name = 'ngrok' as const;
  protected command() {
    const args = ['http', String(this.o.port), '--log', 'stdout', '--log-format', 'json'];
    if (this.o.ngrokDomain) args.push('--url', this.o.ngrokDomain);
    return { bin: this.o.bin?.ngrok ?? 'ngrok', args };
  }
  protected findUrl(line: string): string | null {
    const m = /"url":"(https:\/\/[^"]+)"/.exec(line);
    return m ? m[1]! : null;
  }
  protected override async pollUrl(): Promise<string | null> {
    const r = await fetch('http://127.0.0.1:4040/api/tunnels', { signal: AbortSignal.timeout(1500) });
    const j = (await r.json()) as { tunnels?: { public_url: string }[] };
    return j.tunnels?.find((t) => t.public_url.startsWith('https://'))?.public_url ?? null;
  }
}

class CloudflareQuickTunnel extends ProcTunnel {
  readonly name = 'cloudflare-quick' as const;
  protected command() {
    return { bin: this.o.bin?.cloudflared ?? 'cloudflared', args: ['tunnel', '--no-autoupdate', '--url', `http://127.0.0.1:${this.o.port}`] };
  }
  protected findUrl(line: string): string | null {
    const m = /(https:\/\/[a-z0-9-]+\.trycloudflare\.com)/.exec(line);
    return m ? m[1]! : null;
  }
}

class CloudflareNamedTunnel extends ProcTunnel {
  readonly name = 'cloudflare' as const;
  protected command() {
    if (!this.o.cloudflareToken || !this.o.cloudflareHostname) throw new Error('cloudflare needs CLOUDFLARE_TUNNEL_TOKEN in .env and tunnel.cloudflareHostname');
    return { bin: this.o.bin?.cloudflared ?? 'cloudflared', args: ['tunnel', '--no-autoupdate', 'run'], env: { TUNNEL_TOKEN: this.o.cloudflareToken } };
  }
  protected findUrl(line: string): string | null {
    return /Registered tunnel connection/i.test(line) ? `https://${this.o.cloudflareHostname}` : null;
  }
}

/** Tailscale Funnel runs inside the Tailscale service; we only switch it on and read the address. */
class TailscaleTunnel implements Tunnel {
  readonly name = 'tailscale' as const;
  private url = '';
  private state: TunnelStatus['state'] = 'off';
  private error = '';
  constructor(private readonly o: TunnelOptions, private readonly log: Logger) {}
  private get bin() { return this.o.bin?.tailscale ?? 'tailscale'; }
  async start(): Promise<void> {
    this.state = 'starting';
    try {
      await run(this.bin, ['funnel', '--bg', String(this.o.port)], 30000);
      const st = JSON.parse(await run(this.bin, ['status', '--json'])) as { Self?: { DNSName?: string } };
      const dns = st.Self?.DNSName?.replace(/\.$/, '');
      if (!dns) throw new Error('tailscale: no DNS name (is it signed in?)');
      this.url = `https://${dns}`;
      this.state = 'up';
      this.log.info('tunnel up', { provider: this.name, url: this.url });
    } catch (err) {
      this.state = 'error'; this.error = String((err as Error).message ?? err);
      throw err;
    }
  }
  async stop(): Promise<void> {
    await run(this.bin, ['funnel', '--bg', String(this.o.port), 'off']).catch(() => run(this.bin, ['funnel', 'reset']).catch(() => ''));
    this.state = 'off'; this.url = '';
  }
  status(): TunnelStatus { return { provider: this.name, state: this.state, url: this.url, error: this.error || undefined }; }
  publicUrl(): string { return this.url; }
}

class NoTunnel implements Tunnel {
  readonly name = 'none' as const;
  async start(): Promise<void> {}
  async stop(): Promise<void> {}
  status(): TunnelStatus { return { provider: 'none', state: 'off', url: '' }; }
  publicUrl(): string { return ''; }
}

export function makeTunnel(name: ProviderName, o: TunnelOptions, log: Logger): Tunnel {
  switch (name) {
    case 'ngrok': return new NgrokTunnel(o, log);
    case 'cloudflare-quick': return new CloudflareQuickTunnel(o, log);
    case 'cloudflare': return new CloudflareNamedTunnel(o, log);
    case 'tailscale': return new TailscaleTunnel(o, log);
    default: return new NoTunnel();
  }
}

/**
 * Owns the current tunnel. Switching starts the new one first and checks the public /health; only then the old
 * one stops. If the new one fails, the old one stays. The simulation is never touched.
 */
export class TunnelManager {
  current: Tunnel;
  switching = false;
  onUrl: (url: string, old: string) => void = () => {};
  /** Watchdog (imad 2026-11-21, ERR_NGROK_3200 kept him out while away from the PC): how often the public /health is asked. */
  watchEveryMs = 60_000;
  /** Failed checks in a row before the tunnel is restarted. */
  watchFails = 3;
  private watchTimer: ReturnType<typeof setTimeout> | null = null;
  private fails = 0;
  private restarting = false;
  private restartsInRow = 0;
  lastCheck = { at: 0, ok: false, restarts: 0 };

  constructor(private readonly o: TunnelOptions, private readonly log: Logger, first: ProviderName = 'none') {
    this.current = makeTunnel(first, o, log);
  }

  async start(): Promise<void> {
    try { await this.current.start(); if (this.current.publicUrl()) this.onUrl(this.current.publicUrl(), ''); }
    catch (err) { this.log.error('tunnel failed to start', { provider: this.current.name, err: String((err as Error).message ?? err) }); }
    this.watch();
  }

  /**
   * Every minute: does the public address still reach this server? (ERR_NGROK_3200 = ngrok's endpoint offline while
   * the program may still run; the PC changed network; the program died and could not come back.) After `watchFails`
   * misses in a row the tunnel is stopped and started again; a start that failed is retried the same way. Waits grow
   * (1, 2, 4 ... 10 min) while it keeps failing, and reset once the address answers.
   */
  private watch(): void {
    if (this.watchTimer || this.current.name === 'none') return;
    const tick = async () => {
      this.watchTimer = null;
      if (this.current.name === 'none') return;
      if (!this.switching && !this.restarting) await this.check().catch(() => {});
      const wait = this.fails >= this.watchFails ? Math.min(600_000, this.watchEveryMs * 2 ** Math.min(4, this.restartsInRow)) : this.watchEveryMs;
      this.watchTimer = setTimeout(() => void tick(), wait);
      this.watchTimer.unref?.();
    };
    this.watchTimer = setTimeout(() => void tick(), this.watchEveryMs);
    this.watchTimer.unref?.();
  }

  /** One check; restarts the tunnel when it has failed `watchFails` times in a row. Returns whether it answered. */
  async check(): Promise<boolean> {
    const url = this.current.publicUrl();
    let ok = false;
    if (url) {
      try {
        const r = await fetch(`${url}/health`, { signal: AbortSignal.timeout(8000), headers: { 'ngrok-skip-browser-warning': '1' } });
        ok = r.ok && !!((await r.json()) as { ok?: boolean }).ok;
      } catch { ok = false; }
    }
    this.lastCheck = { at: Date.now(), ok, restarts: this.lastCheck.restarts };
    if (ok) { if (this.fails) this.log.info('tunnel answers again', { provider: this.current.name }); this.fails = 0; this.restartsInRow = 0; return true; }
    this.fails++;
    this.log.warn('tunnel check failed', { provider: this.current.name, url, fails: this.fails });
    if (this.fails >= this.watchFails) await this.restart();
    return false;
  }

  /** Stop and start the current tunnel again (the same provider and address). */
  async restart(): Promise<void> {
    if (this.restarting || this.switching) return;
    this.restarting = true;
    const t = this.current, old = t.publicUrl();
    this.log.warn('tunnel restarting', { provider: t.name, tries: this.restartsInRow + 1 });
    this.restartsInRow++;
    this.lastCheck.restarts++;
    try {
      await t.stop().catch(() => {});
      await t.start();
      const url = t.publicUrl();
      if (url && url !== old) this.onUrl(url, old);
      this.log.info('tunnel restarted', { provider: t.name, url });
    } catch (err) {
      this.log.error('tunnel restart failed', { provider: t.name, err: String((err as Error).message ?? err) });
    } finally { this.restarting = false; }
  }

  watchStatus() { return { ...this.lastCheck, fails: this.fails }; }

  status(): TunnelStatus { return { ...this.current.status(), check: this.watchStatus() }; }

  async healthy(url: string): Promise<boolean> {
    for (let k = 0; k < 10; k++) {
      try {
        const r = await fetch(`${url}/health`, { signal: AbortSignal.timeout(4000), headers: { 'ngrok-skip-browser-warning': '1' } });
        if (r.ok && ((await r.json()) as { ok?: boolean }).ok) return true;
      } catch { /* not yet */ }
      await sleep(1500);
    }
    return false;
  }

  async switchTo(name: ProviderName): Promise<TunnelStatus> {
    if (this.switching) throw new Error('already switching');
    if (name === this.current.name && this.current.status().state === 'up') return this.status();
    this.switching = true;
    const old = this.current, oldUrl = old.publicUrl();
    const next = makeTunnel(name, this.o, this.log);
    try {
      if (name !== 'none') {
        await next.start();
        if (!(await this.healthy(next.publicUrl()))) throw new Error(`${name}: public address does not answer`);
      }
      this.current = next;
      await old.stop();
      this.log.info('tunnel switched', { from: old.name, to: name, url: next.publicUrl() });
      if (next.publicUrl() !== oldUrl) this.onUrl(next.publicUrl(), oldUrl);
      this.fails = 0; this.restartsInRow = 0;
      this.watch();
      return next.status();
    } catch (err) {
      await next.stop().catch(() => {});
      this.log.warn('tunnel switch failed, keeping the old one', { to: name, err: String((err as Error).message ?? err) });
      throw err;
    } finally {
      this.switching = false;
    }
  }

  async stop(): Promise<void> {
    if (this.watchTimer) { clearTimeout(this.watchTimer); this.watchTimer = null; }
    await this.current.stop();
  }
}
