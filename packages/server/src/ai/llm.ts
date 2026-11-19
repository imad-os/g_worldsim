/**
 * Language models behind one small interface, so the planner never cares which one answers:
 *  - Gemini (Google's API, key GEMINI_API_KEY in .env),
 *  - Ollama (any Ollama server: imad's https://ollama-cpu.chtipol.xyz by default; OLLAMA_API_KEY only for ollama.com's hosted models;
 *    no model chosen = the smallest installed one, the fastest on a CPU server),
 *  - none (agents keep their built-in brain).
 * The owner switches provider / model / address in the control panel; the choice is kept in the database.
 * Keys never leave the server. A budget caps calls per hour; at most 2 requests run at once.
 */
import type { Logger } from '../log.js';

export type Provider = 'none' | 'gemini' | 'ollama';
export const PROVIDERS: Provider[] = ['none', 'gemini', 'ollama'];

export interface LlmRequest {
  system?: string;
  prompt: string;
  /** Ask for a JSON object back. */
  json?: boolean;
  maxTokens?: number;
  temperature?: number;
}
export interface LlmReply { text: string; ms: number; provider: Provider; model: string }

export interface AiSettings { provider: Provider; model: string; ollamaUrl: string }
export interface AiConfig extends AiSettings {
  maxCallsPerHour: number;
  timeoutMs: number;
  /** Tests only: another address for Google's API. */
  geminiBase?: string;
}
/** imad's Ollama server (owner request 2026-11-19): the default AI. */
export const DEFAULT_OLLAMA_URL = 'https://ollama-cpu.chtipol.xyz';
export const AI_DEFAULTS: AiConfig = {
  provider: 'ollama', model: '', ollamaUrl: DEFAULT_OLLAMA_URL, maxCallsPerHour: 600, timeoutMs: 120_000,
};
export const DEFAULT_MODEL: Record<Provider, string> = { none: '', gemini: 'gemini-2.5-flash', ollama: 'llama3.2' };

export class AiError extends Error { constructor(public code: string, msg: string) { super(msg); } }

export class Ai {
  private s: AiSettings;
  private calls: number[] = [];
  private running = 0;
  private queue: (() => void)[] = [];
  lastError = '';
  lastMs = 0;
  totalCalls = 0;

  constructor(private cfg: AiConfig, private keys: { gemini?: string; ollama?: string }, private log: Logger, saved?: Partial<AiSettings>) {
    this.s = { provider: cfg.provider, model: cfg.model, ollamaUrl: cfg.ollamaUrl };
    if (saved) this.apply(saved);
    void this.pickAuto();
  }

  get settings(): AiSettings { return { ...this.s }; }
  get model(): string { return this.s.model || (this.s.provider === 'ollama' && this.autoModel) || DEFAULT_MODEL[this.s.provider]; }
  /** No model chosen on Ollama: the smallest installed model (the fastest), looked up again every 30 min. */
  private autoModel = '';
  private autoAt = 0;
  get auto(): boolean { return this.s.provider === 'ollama' && !this.s.model; }
  private async pickAuto(): Promise<void> {
    if (!this.auto || (this.autoModel && Date.now() - this.autoAt < 30 * 60_000)) return;
    try {
      const j = await this.http(`${this.s.ollamaUrl}/api/tags`, undefined, this.ollamaHeaders(), 15000) as { models?: { name: string; size?: number }[] };
      const list = (j.models ?? []).filter((m) => !/embed/i.test(m.name)).sort((a, b) => (a.size ?? Infinity) - (b.size ?? Infinity));
      if (list[0]) { this.autoModel = list[0].name; this.autoAt = Date.now(); this.log.info('ai model picked', { model: this.autoModel, size: list[0].size }); }
    } catch (err) { this.log.warn('ai model lookup failed', { err: String(err) }); }
  }
  get enabled(): boolean { return this.s.provider !== 'none'; }

  /** Change provider / model / Ollama address (validated). */
  apply(p: Partial<AiSettings>): AiSettings {
    const provider = p.provider ?? this.s.provider;
    if (!PROVIDERS.includes(provider)) throw new AiError('bad-provider', 'unknown provider');
    let model = p.model !== undefined ? String(p.model).trim() : provider === this.s.provider ? this.s.model : '';
    if (model.length > 120 || /[\s"'<>]/.test(model)) throw new AiError('bad-model', 'bad model name');
    let url = p.ollamaUrl !== undefined ? normalizeOllamaUrl(String(p.ollamaUrl)) : this.s.ollamaUrl;
    if (!/^https?:\/\/[^\s/]+(\/[^\s]*)?$/i.test(url)) throw new AiError('bad-url', 'the Ollama address must start with http:// or https://');
    if (provider === 'none') model = '';
    if (provider !== this.s.provider || url !== this.s.ollamaUrl) { this.autoModel = ''; this.autoAt = 0; }
    this.s = { provider, model, ollamaUrl: url };
    void this.pickAuto();
    return this.settings;
  }

  status(): { provider: Provider; model: string; auto: boolean; ollamaUrl: string; ready: boolean; why?: string; callsLastHour: number; maxCallsPerHour: number; lastMs: number; lastError: string } {
    const why = this.s.provider === 'gemini' && !this.keys.gemini ? 'GEMINI_API_KEY is missing in .env' : undefined;
    this.trim();
    return {
      provider: this.s.provider, model: this.model, auto: this.auto, ollamaUrl: this.s.ollamaUrl, ready: this.enabled && !why, why,
      callsLastHour: this.calls.length, maxCallsPerHour: this.cfg.maxCallsPerHour, lastMs: this.lastMs, lastError: this.lastError,
    };
  }

  /** Models the current provider offers (Ollama: installed models; Gemini: models that can generate text). */
  async models(): Promise<string[]> {
    if (this.s.provider === 'ollama') {
      const j = await this.http(`${this.s.ollamaUrl}/api/tags`, undefined, this.ollamaHeaders(), 15000) as { models?: { name: string }[] };
      return (j.models ?? []).map((m) => m.name).filter((n) => !/embed/i.test(n)).sort(); // embedding models can't chat
    }
    if (this.s.provider === 'gemini') {
      if (!this.keys.gemini) throw new AiError('no-key', 'GEMINI_API_KEY is missing in .env');
      const j = await this.http(`${this.geminiBase()}/v1beta/models?pageSize=200`, undefined, { 'x-goog-api-key': this.keys.gemini }, 8000) as
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
      const text = provider === 'gemini' ? await this.gemini(r, model) : await this.ollama(r, model);
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
    if (!this.keys.gemini) throw new AiError('no-key', 'GEMINI_API_KEY is missing in .env');
    const body = {
      ...(r.system ? { systemInstruction: { parts: [{ text: r.system }] } } : {}),
      contents: [{ role: 'user', parts: [{ text: r.prompt }] }],
      generationConfig: {
        maxOutputTokens: r.maxTokens ?? 512, temperature: r.temperature ?? 0.8,
        ...(r.json ? { responseMimeType: 'application/json' } : {}),
      },
    };
    const j = await this.http(`${this.geminiBase()}/v1beta/models/${encodeURIComponent(model)}:generateContent`, body,
      { 'x-goog-api-key': this.keys.gemini }, this.cfg.timeoutMs) as { candidates?: { content?: { parts?: { text?: string }[] } }[] };
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
      j = await this.http(`${this.s.ollamaUrl}/api/chat`, body, this.ollamaHeaders(), this.cfg.timeoutMs) as typeof j;
    } catch (err) {
      // Ollama before 0.9 (or a model without thinking) may refuse "think": ask again without it.
      if (!(err instanceof AiError) || err.code !== 'http' || !/think/i.test(err.message)) throw err;
      const { think: _t, ...plain } = body;
      j = await this.http(`${this.s.ollamaUrl}/api/chat`, plain, this.ollamaHeaders(), this.cfg.timeoutMs) as typeof j;
    }
    const text = stripThinking(j.message?.content ?? '');
    if (!text) throw new AiError('bad-reply', j.message?.thinking ? 'the model only thought and gave no answer (raise its answer length or pick a non-thinking model)' : 'empty answer from Ollama');
    return text;
  }

  private ollamaHeaders(): Record<string, string> { return this.keys.ollama ? { authorization: `Bearer ${this.keys.ollama}` } : {}; }
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
