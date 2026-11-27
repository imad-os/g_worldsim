import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { randomBytes } from 'node:crypto';
import type { Logger } from '../log.js';

/**
 * The server's public link in Firestore (imad 2026-11-27: "we already use Firebase and Firestore, this must be automatic").
 * A cloudflare-quick link is random and new at every start, so each time the tunnel's address changes it is written to the
 * public-read document `server/current` { url, provider, at, uid }. TVs and the panel read it when they have no address or the
 * one they have stops answering. One write per change: nothing is polled.
 *
 * No service account: the server makes its own Firebase account once (email / password with a random password, else an
 * anonymous one), kept in data/firebase-link.json (never in the repo, never shown to the AI agent: data/ is denied to it).
 * The rules let only that account change the document; the owner can delete it, and the server then writes it again.
 */
type Fetch = (url: string, init?: { method?: string; headers?: Record<string, string>; body?: string }) => Promise<{ ok: boolean; status: number; json(): Promise<unknown>; text(): Promise<string> }>;
interface Account { email?: string; password?: string; refresh?: string; uid?: string }

export interface LinkStatus { url: string; ok: boolean; at: number; err?: string }

const RETRY_MS = [60_000, 5 * 60_000, 15 * 60_000, 30 * 60_000];

export class LinkPublisher {
  status: LinkStatus = { url: '', ok: false, at: 0 };
  private want = '';
  private provider = '';
  private timer: ReturnType<typeof setTimeout> | null = null;
  private fails = 0;
  private busy = false;
  authBase = 'https://identitytoolkit.googleapis.com';
  tokenBase = 'https://securetoken.googleapis.com';
  storeBase = 'https://firestore.googleapis.com';

  constructor(
    private readonly projectId: string, private readonly apiKey: string, private readonly file: string,
    private readonly log: Logger, private readonly fetchFn: Fetch = fetch as unknown as Fetch,
  ) {}

  get enabled(): boolean { return !!this.projectId && !!this.apiKey; }

  /** Publish this address (the latest one wins; a failure is tried again later, then every 30 min). */
  publish(url: string, provider: string): void {
    if (!this.enabled || !/^https:\/\//.test(url)) return;
    this.want = url; this.provider = provider; this.fails = 0;
    if (this.timer) { clearTimeout(this.timer); this.timer = null; }
    void this.run();
  }

  stop(): void { if (this.timer) { clearTimeout(this.timer); this.timer = null; } this.want = ''; }

  /** Words the AI agent must never see. */
  secrets(): string[] { const a = this.account(); return [a?.password ?? '', a?.refresh ?? ''].filter(Boolean); }

  private async run(): Promise<void> {
    if (this.busy) return;
    this.busy = true;
    const url = this.want;
    try {
      await this.write(url);
      this.status = { url, ok: true, at: Date.now() };
      this.log.info('public link published', { url });
    } catch (err) {
      const e = String((err as Error)?.message ?? err);
      this.status = { url, ok: false, at: Date.now(), err: e };
      this.log.warn('public link not published', { url, err: e });
      if (url === this.want) {
        const wait = RETRY_MS[Math.min(this.fails++, RETRY_MS.length - 1)]!;
        this.timer = setTimeout(() => { this.timer = null; void this.run(); }, wait);
        this.timer.unref?.();
      }
    } finally {
      this.busy = false;
    }
    if (this.want && this.want !== url && !this.timer) void this.run(); // changed again meanwhile
  }

  private account(): Account | null {
    try { return existsSync(this.file) ? (JSON.parse(readFileSync(this.file, 'utf8')) as Account) : null; } catch { return null; }
  }
  private keep(a: Account): void {
    mkdirSync(dirname(this.file), { recursive: true });
    writeFileSync(this.file, JSON.stringify(a), { mode: 0o600 });
  }

  private async post(url: string, body: Record<string, unknown>, form = false): Promise<Record<string, unknown>> {
    const r = await this.fetchFn(url, {
      method: 'POST',
      headers: { 'content-type': form ? 'application/x-www-form-urlencoded' : 'application/json' },
      body: form ? new URLSearchParams(body as Record<string, string>).toString() : JSON.stringify(body),
    });
    const j = (await r.json().catch(() => ({}))) as Record<string, unknown> & { error?: { message?: string } };
    if (!r.ok) throw new Error(`firebase sign-in: ${j.error?.message ?? r.status}`);
    return j;
  }

  /** An ID token of the server's own account (made the first time). */
  private async token(): Promise<{ id: string; uid: string }> {
    const k = encodeURIComponent(this.apiKey);
    const a = this.account();
    if (a?.email && a.password) {
      const j = await this.post(`${this.authBase}/v1/accounts:signInWithPassword?key=${k}`, { email: a.email, password: a.password, returnSecureToken: true });
      return { id: String(j.idToken), uid: String(j.localId) };
    }
    if (a?.refresh) {
      const j = await this.post(`${this.tokenBase}/v1/token?key=${k}`, { grant_type: 'refresh_token', refresh_token: a.refresh }, true);
      return { id: String(j.id_token), uid: String(j.user_id) };
    }
    // First time: an email / password account of its own; an anonymous one when that sign-in is not switched on.
    const email = `server-${randomBytes(6).toString('hex')}@worldsim-server.invalid`, password = randomBytes(24).toString('base64url');
    try {
      const j = await this.post(`${this.authBase}/v1/accounts:signUp?key=${k}`, { email, password, returnSecureToken: true });
      this.keep({ email, password, uid: String(j.localId) });
      return { id: String(j.idToken), uid: String(j.localId) };
    } catch (err) {
      if (!/OPERATION_NOT_ALLOWED|INVALID_EMAIL|ADMIN_ONLY/.test(String(err))) throw err;
      const j = await this.post(`${this.authBase}/v1/accounts:signUp?key=${k}`, { returnSecureToken: true });
      this.keep({ refresh: String(j.refreshToken), uid: String(j.localId) });
      return { id: String(j.idToken), uid: String(j.localId) };
    }
  }

  private async write(url: string): Promise<void> {
    const t = await this.token();
    const doc = `${this.storeBase}/v1/projects/${encodeURIComponent(this.projectId)}/databases/(default)/documents/server/current`;
    const r = await this.fetchFn(doc, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json', authorization: `Bearer ${t.id}` },
      body: JSON.stringify({ fields: {
        url: { stringValue: url }, provider: { stringValue: this.provider }, at: { integerValue: String(Date.now()) }, uid: { stringValue: t.uid },
      } }),
    });
    if (!r.ok) {
      const why = (await r.text().catch(() => '')).slice(0, 300);
      throw new Error(r.status === 403 ? 'Firestore refused (publish the rules in firebase/firestore.rules: match /server/{doc})' : `Firestore ${r.status} ${why}`);
    }
  }
}
