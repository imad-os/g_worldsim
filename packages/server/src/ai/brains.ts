/**
 * Saved AI "brains" (imad 2026-11-20): several provider + address + model + optional API key sets, one in use.
 * Kept in the server's own database (meta `brains`), never in the repo. Keys never go to a client: the panel gets
 * only whether a brain has a key and its last 4 characters.
 */
import { keyList, PROVIDERS, type AiSettings, type Provider } from './llm.js';

export interface Brain { id: string; name: string; provider: Provider; url: string; model: string; key: string }
export interface BrainView { id: string; name: string; provider: Provider; url: string; model: string; keys: number; keyEnd: string; keyEnds: string[]; active: boolean }
interface Store { active: string; list: Brain[]; fallback?: string }

const MAX = 20;
const NAMES: Record<Provider, string> = { none: 'Built-in (no AI)', gemini: 'Gemini', ollama: 'Ollama', openai: 'OpenAI-compatible' };

export class Brains {
  private s: Store;

  constructor(private readonly load: () => string | undefined, private readonly save: (json: string) => void, current: AiSettings, extra: Partial<Brain>[] = []) {
    let s: Store | null = null;
    try { const raw = load(); if (raw) s = JSON.parse(raw) as Store; } catch { s = null; }
    if (!s || !Array.isArray(s.list) || !s.list.length) {
      // First start with brains: the AI in use becomes the first one (+ any suggested, e.g. Gemini when .env has keys).
      const first: Brain = { id: 'b1', name: NAMES[current.provider], provider: current.provider, url: current.ollamaUrl, model: current.model, key: current.key ?? '' };
      s = { active: 'b1', list: [first] };
      for (const x of extra) if (x.provider && x.provider !== current.provider) s.list.push(this.make({ ...x, id: `b${s.list.length + 1}` }));
      this.s = s;
      this.write();
    } else this.s = s;
    if (!this.s.list.some((b) => b.id === this.s.active)) this.s.active = this.s.list[0]!.id;
    // Google closed gemini-2.5-flash to new keys (2026-11-20): saved brains on it use the default (gemini-flash-latest).
    for (const b of this.s.list) if (b.provider === 'gemini' && b.model === 'gemini-2.5-flash') { b.model = ''; this.write(); }
  }

  private write(): void { this.save(JSON.stringify(this.s)); }
  private make(p: Partial<Brain>): Brain {
    const provider = (p.provider ?? 'none') as Provider;
    if (!PROVIDERS.includes(provider)) throw new Error('unknown provider');
    const name = String(p.name ?? '').trim().slice(0, 40) || NAMES[provider];
    return { id: String(p.id), name, provider, url: String(p.url ?? '').trim().slice(0, 300), model: String(p.model ?? '').trim().slice(0, 120), key: String(p.key ?? '').trim().slice(0, 2000) };
  }

  get active(): Brain { return this.s.list.find((b) => b.id === this.s.active)!; }
  get(id: string): Brain | undefined { return this.s.list.find((b) => b.id === id); }
  settingsOf(b: Brain): AiSettings { return { provider: b.provider, model: b.model, ollamaUrl: b.url, key: b.key }; }

  /** The brain that takes over when the one in use fails 3 times in a row ('' = none; the one in use itself = none). */
  get fallbackId(): string { const f = this.s.fallback ?? ''; return f && f !== this.s.active && this.get(f) ? f : ''; }
  setFallback(id: string): void {
    if (id && !this.get(id)) throw new Error('no such brain');
    if (id && id === this.s.active) throw new Error('the brain in use cannot be its own fallback');
    this.s.fallback = id;
    this.write();
  }

  view(): { active: string; fallback: string; list: BrainView[] } {
    return {
      active: this.s.active, fallback: this.fallbackId,
      list: this.s.list.map((b) => { const ks = keyList(b.key); return { id: b.id, name: b.name, provider: b.provider, url: b.url, model: b.model, keys: ks.length, keyEnd: ks.map((k) => k.slice(-4)).join(', '), keyEnds: ks.map((k) => k.slice(-4)), active: b.id === this.s.active }; }),
    };
  }

  /** Add (no id) or change a brain. `key`: undefined = keep the saved one, '' = remove it. Returns the saved brain. */
  /** `addKey`: one or more keys added to the saved ones (they take turns); `removeKey`: the index of a saved key to drop. */
  put(p: { id?: string; name?: string; provider?: Provider; url?: string; model?: string; key?: string; addKey?: string; removeKey?: number }, check: (s: AiSettings) => AiSettings): Brain {
    const old = p.id ? this.get(p.id) : undefined;
    if (p.id && !old) throw new Error('no such brain');
    if (!old && this.s.list.length >= MAX) throw new Error(`at most ${MAX} brains`);
    let id = old?.id;
    if (!id) { let n = this.s.list.length + 1; while (this.get(`b${n}`)) n++; id = `b${n}`; }
    let keys = keyList(p.key !== undefined ? p.key : old?.key ?? '');
    if (typeof p.removeKey === 'number') { if (!keys[p.removeKey]) throw new Error('no such key'); keys = keys.filter((_, i) => i !== p.removeKey); }
    if (p.addKey) { const add = keyList(p.addKey); if (keys.length + add.length > 20) throw new Error('at most 20 keys'); keys = keyList([...keys, ...add]); }
    const { addKey: _a, removeKey: _r, ...fields } = p;
    const b = this.make({ ...old, ...Object.fromEntries(Object.entries(fields).filter(([, v]) => v !== undefined)), id, key: keys.join(',') });
    // Same checks as the AI itself (address, model name, key), and the address as it will be used.
    const s = check(this.settingsOf(b));
    b.url = s.ollamaUrl; b.model = s.model;
    if (old) Object.assign(old, b); else this.s.list.push(b);
    this.write();
    return old ?? b;
  }

  use(id: string): Brain {
    const b = this.get(id);
    if (!b) throw new Error('no such brain');
    this.s.active = id;
    this.write();
    return b;
  }

  remove(id: string): void {
    if (id === this.s.active) throw new Error('this brain is in use: switch to another one first');
    const n = this.s.list.length;
    this.s.list = this.s.list.filter((b) => b.id !== id);
    if (this.s.list.length === n) throw new Error('no such brain');
    if (this.s.fallback === id) this.s.fallback = '';
    this.write();
  }

  /** The brain in use was changed from the old AI form (aiSet): keep it in step. */
  syncActive(s: AiSettings): void {
    const b = this.active;
    b.provider = s.provider; b.url = s.ollamaUrl; b.model = s.model; if (s.key !== undefined) b.key = s.key;
    this.write();
  }
}
