import { createPublicKey, createVerify, type JsonWebKey } from 'node:crypto';

/**
 * Firebase sign-ins for the control panel (imad 2026-11-20). No service account and no Admin SDK:
 *  - an ID token is checked against Google's public keys (RS256; audience, issuer, times, subject),
 *  - the person's role is read from Firestore `roles/<uid>` WITH THEIR OWN TOKEN, so the project's rules decide
 *    what anyone can read or change (a person can never give themselves a role the rules refuse).
 * No document = 'player'. Who is the owner lives only in Firestore (data + the published rules), never in this code.
 */
export type AccountRole = 'owner' | 'admin' | 'player';
export interface FbUser { uid: string; email: string; emailVerified: boolean; name: string; picture: string }

const JWKS = 'https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com';
type Fetch = (url: string, init?: { headers?: Record<string, string> }) => Promise<{ ok: boolean; status: number; headers: { get(k: string): string | null }; json(): Promise<unknown> }>;

const b64 = (s: string) => Buffer.from(s.replace(/-/g, '+').replace(/_/g, '/'), 'base64');

export class FirebaseAuth {
  private keys: Map<string, ReturnType<typeof createPublicKey>> = new Map();
  private keysUntil = 0;
  private roles = new Map<string, { role: AccountRole; at: number }>();

  constructor(readonly projectId: string, private readonly fetchFn: Fetch = fetch as unknown as Fetch, private readonly now = () => Date.now()) {}

  get enabled(): boolean { return !!this.projectId; }

  private async publicKey(kid: string): Promise<ReturnType<typeof createPublicKey> | undefined> {
    if (this.now() > this.keysUntil || !this.keys.has(kid)) {
      const r = await this.fetchFn(JWKS);
      if (!r.ok) throw new Error(`google keys: HTTP ${r.status}`);
      const j = (await r.json()) as { keys: (JsonWebKey & { kid: string })[] };
      this.keys = new Map(j.keys.map((k) => [k.kid, createPublicKey({ key: k, format: 'jwk' })]));
      const age = /max-age=(\d+)/.exec(r.headers.get('cache-control') ?? '')?.[1];
      this.keysUntil = this.now() + Math.min(6 * 3600, Number(age ?? 3600)) * 1000;
    }
    return this.keys.get(kid);
  }

  /** Check an ID token; throws with a short reason when it is not a valid sign-in to this project. */
  async verify(token: string): Promise<FbUser> {
    if (!this.projectId) throw new Error('sign-in is not set up on this server');
    const parts = token.split('.');
    if (parts.length !== 3 || token.length > 4096) throw new Error('bad token');
    let head: { alg?: string; kid?: string }, body: Record<string, unknown>;
    try { head = JSON.parse(b64(parts[0]!).toString('utf8')); body = JSON.parse(b64(parts[1]!).toString('utf8')); } catch { throw new Error('bad token'); }
    if (head.alg !== 'RS256' || typeof head.kid !== 'string') throw new Error('bad token');
    const key = await this.publicKey(head.kid);
    if (!key) throw new Error('unknown key');
    const ok = createVerify('RSA-SHA256').update(`${parts[0]}.${parts[1]}`).verify(key, b64(parts[2]!));
    if (!ok) throw new Error('bad signature');
    const t = Math.floor(this.now() / 1000);
    if (body.aud !== this.projectId || body.iss !== `https://securetoken.google.com/${this.projectId}`) throw new Error('other project');
    if (typeof body.exp !== 'number' || body.exp <= t) throw new Error('expired');
    if (typeof body.iat !== 'number' || body.iat > t + 300) throw new Error('bad time');
    if (typeof body.sub !== 'string' || !body.sub || body.sub.length > 128) throw new Error('bad subject');
    return {
      uid: body.sub, email: typeof body.email === 'string' ? body.email : '', emailVerified: body.email_verified === true,
      name: typeof body.name === 'string' ? body.name : '', picture: typeof body.picture === 'string' ? body.picture : '',
    };
  }

  /** The person's role from Firestore roles/<uid>, read with their own token (cached 30 s). */
  async role(uid: string, token: string): Promise<AccountRole> {
    const c = this.roles.get(uid);
    if (c && this.now() - c.at < 30_000) return c.role;
    const url = `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(this.projectId)}/databases/(default)/documents/roles/${encodeURIComponent(uid)}`;
    const r = await this.fetchFn(url, { headers: { Authorization: `Bearer ${token}` } });
    let role: AccountRole = 'player';
    if (r.ok) {
      const j = (await r.json()) as { fields?: { role?: { stringValue?: string } } };
      const v = j.fields?.role?.stringValue;
      if (v === 'owner' || v === 'admin') role = v;
    } else if (r.status !== 404) throw new Error(`roles: HTTP ${r.status}`);
    this.roles.set(uid, { role, at: this.now() });
    return role;
  }
}
