import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { createServer, type IncomingMessage } from 'node:http';
import type { AddressInfo } from 'node:net';
import { Ai, AI_DEFAULTS, parseJsonReply } from '../ai/llm.js';
import { Logger } from '../log.js';

const seen: { url: string; headers: IncomingMessage['headers']; body: any }[] = [];
const fake = createServer((req, res) => {
  let b = '';
  req.on('data', (c) => (b += c));
  req.on('end', () => {
    seen.push({ url: req.url!, headers: req.headers, body: b ? JSON.parse(b) : null });
    res.setHeader('content-type', 'application/json');
    if (req.url === '/api/tags') return res.end(JSON.stringify({ models: [{ name: 'qwen3:4b' }, { name: 'llama3.2:latest' }] }));
    if (req.url === '/think/api/chat') return res.end(JSON.stringify({ message: { role: 'assistant', content: '<think>let me see</think>\n\nHello!' } }));
    if (req.url === '/old/api/chat') {
      const j = JSON.parse(b);
      if ('think' in j) { res.statusCode = 400; return res.end(JSON.stringify({ error: 'json: unknown field "think"' })); }
      return res.end(JSON.stringify({ message: { content: 'old ollama ok' } }));
    }
    if (req.url === '/api/chat') return res.end(JSON.stringify({ message: { role: 'assistant', content: '{"say":"hi from ollama"}' } }));
    if (req.url!.startsWith('/v1beta/models?')) return res.end(JSON.stringify({ models: [{ name: 'models/gemini-2.5-flash', supportedGenerationMethods: ['generateContent'] }, { name: 'models/embed', supportedGenerationMethods: ['embedContent'] }] }));
    if (req.url!.includes(':generateContent')) {
      if (req.headers['x-goog-api-key'] !== 'gkey') { res.statusCode = 403; return res.end(JSON.stringify({ error: { message: 'bad key' } })); }
      return res.end(JSON.stringify({ candidates: [{ content: { parts: [{ text: 'hello ' }, { text: 'from gemini' }] } }] }));
    }
    res.statusCode = 404; res.end('{}');
  });
});
await new Promise<void>((ok) => fake.listen(0, '127.0.0.1', ok));
const base = `http://127.0.0.1:${(fake.address() as AddressInfo).port}`;
after(() => fake.close());
const log = new Logger('error');

test('ai: Ollama models and chat (system + user, JSON format), switch to Gemini, key in a header only', async () => {
  const ai = new Ai({ ...AI_DEFAULTS, geminiBase: base }, { gemini: 'gkey' }, log);
  await assert.rejects(ai.generate({ prompt: 'x' }), /off/);
  ai.apply({ provider: 'ollama', ollamaUrl: base + '/', model: 'qwen3:4b' });
  assert.deepEqual(await ai.models(), ['llama3.2:latest', 'qwen3:4b']);
  const r = await ai.generate({ system: 'be brief', prompt: 'hello', json: true, maxTokens: 50 });
  assert.equal(parseJsonReply<{ say: string }>(r.text)!.say, 'hi from ollama');
  const chat = seen.find((s) => s.url === '/api/chat')!;
  assert.equal(chat.body.model, 'qwen3:4b');
  assert.equal(chat.body.format, 'json');
  assert.equal(chat.body.stream, false);
  assert.equal(chat.body.think, false, 'thinking models answer straight away');
  assert.deepEqual(chat.body.messages.map((m: any) => m.role), ['system', 'user']);
  assert.equal(chat.body.options.num_predict, 50);

  ai.apply({ provider: 'gemini' });
  assert.equal(ai.model, 'gemini-2.5-flash', 'default model when switching provider');
  assert.deepEqual(await ai.models(), ['gemini-2.5-flash']);
  const g = await ai.generate({ prompt: 'hi', system: 'sys' });
  assert.equal(g.text, 'hello from gemini');
  const call = seen.find((s) => s.url!.includes(':generateContent'))!;
  assert.ok(!call.url.includes('gkey'), 'key never in the address');
  assert.equal(call.body.systemInstruction.parts[0].text, 'sys');
  assert.equal(ai.status().ready, true);
});

test('ai: bad settings refused, missing key reported, budget enforced, unreachable server is a clear error', async () => {
  const ai = new Ai({ ...AI_DEFAULTS, maxCallsPerHour: 1 }, {}, log);
  assert.throws(() => ai.apply({ provider: 'nope' as never }), /unknown provider/);
  assert.throws(() => ai.apply({ provider: 'ollama', ollamaUrl: 'file:///etc' }), /http/);
  ai.apply({ provider: 'gemini' });
  assert.equal(ai.status().ready, false);
  assert.match(ai.status().why!, /GEMINI_API_KEY/);
  ai.apply({ provider: 'ollama', ollamaUrl: base });
  await ai.generate({ prompt: 'one' });
  await assert.rejects(ai.generate({ prompt: 'two' }), /budget/);
  const off = new Ai({ ...AI_DEFAULTS, timeoutMs: 2000 }, {}, log, { provider: 'ollama', ollamaUrl: 'http://127.0.0.1:9' });
  await assert.rejects(off.generate({ prompt: 'x' }), /can't reach/);
  assert.deepEqual(parseJsonReply('```json\n{"a":1}\n```'), { a: 1 });
});

test('ai: thinking models (qwen3) give their answer without the <think> part; an older Ollama without "think" still works', async () => {
  const ai = new Ai({ ...AI_DEFAULTS }, {}, log, { provider: 'ollama', ollamaUrl: base + '/think' });
  assert.equal((await ai.generate({ prompt: 'hi' })).text, 'Hello!');
  ai.apply({ ollamaUrl: base + '/old' });
  assert.equal((await ai.generate({ prompt: 'hi' })).text, 'old ollama ok');
});

test('ai: any pasted Ollama address works (API paths and missing http:// are fixed), errors say which address failed', async () => {
  const { normalizeOllamaUrl } = await import('../ai/llm.js');
  assert.equal(normalizeOllamaUrl('http://dom.com/'), 'http://dom.com');
  assert.equal(normalizeOllamaUrl('https://dom.com/api/tags'), 'https://dom.com');
  assert.equal(normalizeOllamaUrl('dom.com:11434/api'), 'http://dom.com:11434');
  assert.equal(normalizeOllamaUrl('http://h/ollama/api/chat'), 'http://h/ollama');
  const ai = new Ai({ ...AI_DEFAULTS }, {}, log);
  ai.apply({ provider: 'ollama', ollamaUrl: base + '/api/tags' });
  assert.equal(ai.settings.ollamaUrl, base);
  assert.deepEqual(await ai.models(), ['llama3.2:latest', 'qwen3:4b']);
  ai.apply({ ollamaUrl: base + '/nothing' });
  await assert.rejects(ai.models(), (e: Error) => e.message.includes(`${base}/nothing/api/tags`) && /404/.test(e.message));
});
