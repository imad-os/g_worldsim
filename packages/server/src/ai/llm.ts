/**
 * Language models behind one small interface, so the planner never cares which one answers:
 *  - Gemini (Google's API, keys GEMINI_API_KEYS=k1,k2 (or GEMINI_API_KEY) in .env, taking turns call by call),
 *  - any OpenAI-compatible API (OpenAI, OpenRouter, Groq, LM Studio, vLLM...: an address ending in /v1 and a key),
 *  - Ollama (any Ollama server, address in worldsim.config.json `ai.ollamaUrl` or the panel, never in the code; OLLAMA_API_KEY only for ollama.com's hosted models;
 *    no model chosen = the smallest installed one, the fastest on a CPU server),
 *  - none (agents keep their built-in brain).
 * The owner keeps several "brains" (provider + address + model + optional key, `brains.ts`) and switches between them in the
 * control panel; the choice is kept in the database. A brain's own key wins over the .env keys; several keys in one field
 * (comma separated) take turns too.
 * Keys never leave the server. A budget caps calls per hour; at most 2 requests run at once.
 */
import type { Logger } from '../log.js';

export type Provider = 'none' | 'gemini' | 'ollama' | 'openai';
export const PROVIDERS: Provider[] = ['none', 'gemini', 'ollama', 'openai'];
export const DEFAULT_OPENAI_URL = 'https://api.openai.com/v1';

export interface LlmRequest {
  system?: string;
  prompt: string;
  /** Ask for a JSON object back. */
  json?: boolean;
  maxTokens?: number;
  temperature?: number;
}
export interface LlmReply { text: string; ms: number; provider: Provider; model: string }

/** `ollamaUrl` = the address of an Ollama or OpenAI-compatible server. `key` = this brain's own API key(s), never sent to clients. */
export interface AiSettings { provider: Provider; model: string; ollamaUrl: string; key?: string }
export interface AiConfig extends AiSettings {
  maxCallsPerHour: number;
  timeoutMs: number;
  /** Tests only: another address for Google's API. */
  geminiBase?: string;
}
/** imad's Ollama server (owner request 2026-11-19): the default AI. */
/** A local Ollama. The owner's own server is set in the PC's worldsim.config.json (not committed): Ollama has no password. */
export const DEFAULT_OLLAMA_URL = 'http://127.0.0.1:11434';
export const AI_DEFAULTS: AiConfig = {
  provider: 'ollama', model: '', ollamaUrl: DEFAULT_OLLAMA_URL, maxCallsPerHour: 600, timeoutMs: 120_000,
};
export const DEFAULT_MODEL: Record<Provider, string> = { none: '', gemini: 'gemini-flash-latest', ollama: 'llama3.2', openai: 'gpt-4o-mini' };

/** Keys from a field or .env: "k1, k2" -> ['k1', 'k2'] (no blanks, no repeats). */
export function keyList(v: string | string[] | undefined): string[] {
  const all = (Array.isArray(v) ? v : [v ?? '']).flatMap((x) => String(x).split(/[\s,;]+/)).map((k) => k.trim()).filter(Boolean);
  return [...new Set(all)];
}

export class AiError extends Error { constructor(public code: string, msg: string) { super(msg); } }

export class Ai {
  private s: AiSettings;
  private calls: number[] = [];
  private running = 0;
  private queue: (() => void)[] = [];
  lastError = '';
  lastMs = 0;
  totalCalls = 0;

  private envKeys: Record<'gemini' | 'ollama' | 'openai', string[]>;
  /** Next key to use per provider (round robin: first call key 1, next call key 2...). */
  private turn = new Map<string, number>();

  constructor(private cfg: AiConfig, keys: { gemini?: string | string[]; ollama?: string; openai?: string }, private log: Logger, saved?: Partial<AiSettings>) {
    this.envKeys = { gemini: keyList(keys.gemini), ollama: keyList(keys.ollama), openai: keyList(keys.openai) };
    this.s = { provider: cfg.provider, model: cfg.model, ollamaUrl: cfg.ollamaUrl };
    if (saved) this.apply(saved);
    void this.pickAuto();
  }

  get settings(): AiSettings { return { ...this.s }; }
  /** The keys the current provider uses: the brain's own, else the .env ones. */
  private keysNow(): string[] {
    const own = keyList(this.s.key);
    return own.length ? own : this.s.provider === 'none' ? [] : this.envKeys[this.s.provider];
  }
  /** How many keys take turns now (shown in the panel; never the keys). */
  get keyCount(): number { return this.keysNow().length; }
  /** The next key, in turn. */
  private nextKey(): string | undefined {
    const ks = this.keysNow();
    if (!ks.length) return undefined;
    const tag = this.s.provider + '|' + ks.join(',');
    const n = this.turn.get(tag) ?? 0;
    this.turn.set(tag, n + 1);
    return ks[n % ks.length];
  }
  get model(): string { return this.s.model || (this.s.provider === 'ollama' && this.autoModel) || DEFAULT_MODEL[this.s.provider]; }
  /** No model chosen on Ollama: the smallest installed model (the fastest), looked up again every 30 min. */
  private autoModel = '';
  private autoAt = 0;
  get auto(): boolean { return this.s.provider === 'ollama' && !this.s.model; }
  private async pickAuto(): Promise<void> {
    if (!this.auto || (this.autoModel && Date.now() - this.autoAt < 30 * 60_000)) return;
    try {
      const j = await this.http(`${this.s.ollamaUrl}/api/tags`, undefined, this.bearer(), 15000) as { models?: { name: string; size?: number }[] };
      // Skip what can't plan: embedding models, ":cloud" entries (a few hundred bytes, need ollama.com sign-in: HTTP 401),
      // anything under 50 MB, and tinyllama (can't keep to the JSON format, measured on imad's server 2026-11-20).
      const list = (j.models ?? []).filter((m) => !/embed|tinyllama/i.test(m.name) && !/:cloud$|-cloud$/i.test(m.name) && (m.size === undefined || m.size >= 50e6))
        .sort((a, b) => (a.size ?? Infinity) - (b.size ?? Infinity));
      if (list[0]) { this.autoModel = list[0].name; this.autoAt = Date.now(); this.log.info('ai model picked', { model: this.autoModel, size: list[0].size }); }
    } catch (err) { this.log.warn('ai model lookup failed', { err: String(err) }); }
  }
  get enabled(): boolean { return this.s.provider !== 'none'; }

  /** Change provider / model / address / key (validated). */
  apply(p: Partial<AiSettings>): AiSettings {
    const n = this.check(p);
    if (n.provider !== this.s.provider || n.ollamaUrl !== this.s.ollamaUrl || n.key !== this.s.key) { this.autoModel = ''; this.autoAt = 0; }
    this.s = n;
    void this.pickAuto();
    return this.settings;
  }

  /** The settings `p` would give, checked (throws AiError), without changing anything. */
  check(p: Partial<AiSettings>): AiSettings {
    const provider = p.provider ?? this.s.provider;
    if (!PROVIDERS.includes(provider)) throw new AiError('bad-provider', 'unknown provider');
    let model = p.model !== undefined ? String(p.model).trim() : provider === this.s.provider ? this.s.model : '';
    if (model.length > 120 || /[\s"'<>]/.test(model)) throw new AiError('bad-model', 'bad model name');
    let url = p.ollamaUrl !== undefined ? String(p.ollamaUrl) : provider !== this.s.provider && (provider === 'openai' || this.s.provider === 'openai') ? (provider === 'openai' ? '' : DEFAULT_OLLAMA_URL) : this.s.ollamaUrl;
    url = provider === 'openai' ? normalizeOpenAiUrl(url) : normalizeOllamaUrl(url || DEFAULT_OLLAMA_URL);
    if (!/^https?:\/\/[^\s/]+(\/[^\s]*)?$/i.test(url)) throw new AiError('bad-url', 'the address must start with http:// or https://');
    const key = p.key !== undefined ? String(p.key).trim() : this.s.key;
    if (key && (key.length > 2000 || /["'<>]/.test(key))) throw new AiError('bad-key', 'bad API key');
    if (provider === 'none') model = '';
    return { provider, model, ollamaUrl: url, ...(key ? { key } : {}) };
  }

  status(): { provider: Provider; model: string; auto: boolean; ollamaUrl: string; keys: number; ready: boolean; why?: string; callsLastHour: number; maxCallsPerHour: number; lastMs: number; lastError: string } {
    const why = (this.s.provider === 'gemini' || (this.s.provider === 'openai' && /api\.openai\.com/i.test(this.s.ollamaUrl))) && !this.keyCount ? this.missingKey() : undefined;
    this.trim();
    return {
      provider: this.s.provider, model: this.model, auto: this.auto, ollamaUrl: this.s.ollamaUrl, keys: this.keyCount, ready: this.enabled && !why, why,
      callsLastHour: this.calls.length, maxCallsPerHour: this.cfg.maxCallsPerHour, lastMs: this.lastMs, lastError: this.lastError,
    };
  }

  /** Models the current provider offers (Ollama: installed models; Gemini: models that can generate text). */
  async models(): Promise<string[]> {
    if (this.s.provider === 'ollama') {
      const j = await this.http(`${this.s.ollamaUrl}/api/tags`, undefined, this.bearer(), 15000) as { models?: { name: string }[] };
      return (j.models ?? []).map((m) => m.name).filter((n) => !/embed/i.test(n) && !/:cloud$|-cloud$/i.test(n)).sort(); // embedding models can't chat; :cloud ones answer 401 here
    }
    if (this.s.provider === 'openai') {
      const j = await this.http(`${this.s.ollamaUrl}/models`, undefined, this.bearer(), 15000) as { data?: { id: string }[] };
      return (j.data ?? []).map((m) => m.id).filter((n) => !/embed|whisper|tts|dall-e|moderation/i.test(n)).sort();
    }
    if (this.s.provider === 'gemini') {
      const key = this.nextKey();
      if (!key) throw new AiError('no-key', this.missingKey());
      const j = await this.http(`${this.geminiBase()}/v1beta/models?pageSize=200`, undefined, { 'x-goog-api-key': key }, 8000) as
        { models?: { name: string; supportedGenerationMethods?: string[] }[] };
      return (j.models ?? []).filter((m) => m.supportedGenerationMethods?.includes('generateContent')).map((m) => m.name.replace(/^models\//, '')).sort();
    }
    return [];
  }

  /** One request to the current model. Throws AiError (off, budget, http, timeout, bad-reply). */
  async generate(r: LlmRequest): Promise<LlmReply> {
    if (!this.enabled) throw new AiError('off', 'AI is off');
    this.trim();
    if (this.calls.length >= this.cfg.maxCallsPerHour) throw new AiError('budget', 'hourly AI budget used up');
    this.calls.push(Date.now());
    await this.pickAuto();
    await this.slot();
    const t0 = Date.now(), provider = this.s.provider, model = this.model;
    try {
      const text = provider === 'gemini' ? await this.gemini(r, model) : provider === 'openai' ? await this.openai(r, model) : await this.ollama(r, model);
      this.lastMs = Date.now() - t0; this.lastError = ''; this.totalCalls++;
      return { text, ms: this.lastMs, provider, model };
    } catch (err) {
      this.lastError = err instanceof Error ? err.message : String(err);
      this.log.warn('ai request failed', { provider, model, err: this.lastError });
      throw err instanceof AiError ? err : new AiError('http', this.lastError);
    } finally {
      this.running--;
      this.queue.shift()?.();
    }
  }

  private async gemini(r: LlmRequest, model: string): Promise<string> {
    if (!this.keyCount) throw new AiError('no-key', this.missingKey());
    const body = {
      ...(r.system ? { systemInstruction: { parts: [{ text: r.system }] } } : {}),
      contents: [{ role: 'user', parts: [{ text: r.prompt }] }],
      generationConfig: {
        maxOutputTokens: r.maxTokens ?? 512, temperature: r.temperature ?? 0.8,
        ...(r.json ? { responseMimeType: 'application/json' } : {}),
      },
    };
    // Busy (503) or over quota (429) on one key: try the next key once (each key has its own quota).
    let j: { candidates?: { content?: { parts?: { text?: string }[] } }[] } = {};
    for (let tries = Math.min(2, this.keyCount); ; tries--) {
      try {
        j = await this.http(`${this.geminiBase()}/v1beta/models/${encodeURIComponent(model)}:generateContent`, body,
          { 'x-goog-api-key': this.nextKey()! }, this.cfg.timeoutMs) as typeof j;
        break;
      } catch (err) {
        if (tries <= 1 || !(err instanceof AiError) || !/HTTP (429|503)/.test(err.message)) throw err;
      }
    }
    const text = stripThinking((j.candidates?.[0]?.content?.parts ?? []).map((p) => p.text ?? '').join(''));
    if (!text) throw new AiError('bad-reply', 'empty answer from Gemini');
    return text;
  }

  private async ollama(r: LlmRequest, model: string): Promise<string> {
    const body = {
      model, stream: false,
      // Thinking models (qwen3, deepseek-r1...): no hidden thinking, it would eat the whole answer budget.
      think: false,
      messages: [...(r.system ? [{ role: 'system', content: r.system }] : []), { role: 'user', content: r.prompt }],
      ...(r.json ? { format: 'json' } : {}),
      options: { num_predict: r.maxTokens ?? 512, temperature: r.temperature ?? 0.8 },
    };
    let j: { message?: { content?: string; thinking?: string } };
    try {
      j = await this.http(`${this.s.ollamaUrl}/api/chat`, body, this.bearer(), this.cfg.timeoutMs) as typeof j;
    } catch (err) {
      // Ollama before 0.9 (or a model without thinking) may refuse "think": ask again without it.
      if (!(err instanceof AiError) || err.code !== 'http' || !/think/i.test(err.message)) throw err;
      const { think: _t, ...plain } = body;
      j = await this.http(`${this.s.ollamaUrl}/api/chat`, plain, this.bearer(), this.cfg.timeoutMs) as typeof j;
    }
    const text = stripThinking(j.message?.content ?? '');
    if (!text) throw new AiError('bad-reply', j.message?.thinking ? 'the model only thought and gave no answer (raise its answer length or pick a non-thinking model)' : 'empty answer from Ollama');
    return text;
  }

  /** OpenAI-compatible chat (/chat/completions). */
  private async openai(r: LlmRequest, model: string): Promise<string> {
    if (!this.keyCount && /api\.openai\.com/i.test(this.s.ollamaUrl)) throw new AiError('no-key', this.missingKey());
    const body = {
      model, messages: [...(r.system ? [{ role: 'system', content: r.system }] : []), { role: 'user', content: r.prompt }],
      max_tokens: r.maxTokens ?? 512, temperature: r.temperature ?? 0.8,
      ...(r.json ? { response_format: { type: 'json_object' } } : {}),
    };
    let j: { choices?: { message?: { content?: string } }[] };
    try {
      j = await this.http(`${this.s.ollamaUrl}/chat/completions`, body, this.bearer(), this.cfg.timeoutMs) as typeof j;
    } catch (err) {
      // Some servers don't know response_format: ask again without it.
      if (!r.json || !(err instanceof AiError) || err.code !== 'http' || !/response_format|json_object/i.test(err.message)) throw err;
      const { response_format: _f, ...plain } = body as typeof body & { response_format?: unknown };
      j = await this.http(`${this.s.ollamaUrl}/chat/completions`, plain, this.bearer(), this.cfg.timeoutMs) as typeof j;
    }
    const text = stripThinking(j.choices?.[0]?.message?.content ?? '');
    if (!text) throw new AiError('bad-reply', 'empty answer');
    return text;
  }

  private missingKey(): string { return this.s.provider === 'gemini' ? 'no API key: add one to this brain, or GEMINI_API_KEYS in .env' : 'no API key: add one to this brain'; }
  /** Ollama / OpenAI-compatible: the next key as a Bearer header (none = no header). */
  private bearer(): Record<string, string> { const k = this.nextKey(); return k ? { authorization: `Bearer ${k}` } : {}; }
  private geminiBase(): string { return this.cfg.geminiBase ?? 'https://generativelanguage.googleapis.com'; }

  private async http(url: string, body: unknown, headers: Record<string, string>, timeoutMs: number): Promise<unknown> {
    const ac = new AbortController();
    const timer = setTimeout(() => ac.abort(), timeoutMs);
    try {
      const res = await fetch(url, {
        method: body === undefined ? 'GET' : 'POST', signal: ac.signal,
        headers: { ...(body === undefined ? {} : { 'content-type': 'application/json' }), ...headers },
        body: body === undefined ? undefined : JSON.stringify(body),
      });
      const txt = await res.text();
      if (!res.ok) {
        let msg = txt.slice(0, 200);
        try { const e = JSON.parse(txt) as { error?: string | { message?: string } }; msg = typeof e.error === 'string' ? e.error : e.error?.message ?? msg; } catch { /* text */ }
        throw new AiError('http', `${shown(url)} answered HTTP ${res.status}: ${msg}`);
      }
      try { return JSON.parse(txt); } catch { throw new AiError('bad-reply', `${shown(url)} did not answer JSON (is it an Ollama API address?): ${txt.slice(0, 80)}`); }
    } catch (err) {
      if (err instanceof AiError) throw err;
      if ((err as Error).name === 'AbortError') throw new AiError('timeout', `${shown(url)}: no answer within ${Math.round(timeoutMs / 1000)} s`);
      const cause = (err as { cause?: { code?: string; message?: string } }).cause;
      throw new AiError('http', `can't reach ${shown(url)}: ${cause?.code ?? cause?.message ?? (err as Error).message}`);
    } finally {
      clearTimeout(timer);
    }
  }

  private trim(): void { const h = Date.now() - 3_600_000; while (this.calls.length && this.calls[0]! < h) this.calls.shift(); }
  private slot(): Promise<void> {
    if (this.running < 2) { this.running++; return Promise.resolve(); }
    return new Promise((ok) => this.queue.push(() => { this.running++; ok(); }));
  }
}

/** A reply without <think>...</think> blocks (thinking models write them into the answer). */
export function stripThinking(text: string): string {
  return text.replace(/<think>[\s\S]*?<\/think>/gi, '').replace(/^[\s\S]*<\/think>/i, '').trim();
}

/** The first JSON object in a model's answer (models sometimes wrap it in text or ``` fences). */
export function parseJsonReply<T = unknown>(text: string): T | null {
  const a = text.indexOf('{'), b = text.lastIndexOf('}');
  if (a < 0 || b <= a) return null;
  try { return JSON.parse(text.slice(a, b + 1)) as T; } catch { return null; }
}

/** An OpenAI-compatible base address ending in /v1 (or as given): pasted /chat/completions or /models paths are dropped. */
export function normalizeOpenAiUrl(raw: string): string {
  let u = raw.trim() || DEFAULT_OPENAI_URL;
  if (!/^[a-z]+:\/\//i.test(u)) u = 'https://' + u;
  return u.replace(/\/+$/, '').replace(/\/(chat\/completions|completions|models)$/i, '').replace(/\/+$/, '');
}

/** The address as shown in errors (no query string, where a key could be). */
function shown(url: string): string { return url.split('?')[0]!; }

/**
 * The base address of an Ollama server, whatever the owner pasted: trailing slashes and API paths are dropped
 * (http://host:11434/api/tags -> http://host:11434), "http://" is added when missing.
 */
export function normalizeOllamaUrl(raw: string): string {
  let u = raw.trim();
  if (u && !/^[a-z]+:\/\//i.test(u)) u = 'http://' + u;
  u = u.replace(/\/+$/, '').replace(/\/(api\/(tags|chat|generate|version)|api|v1)$/i, '').replace(/\/+$/, '');
  return u;
}
