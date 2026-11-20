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
    if (req.url === '/api/tags') return res.end(JSON.stringify({ models: [{ name: 'qwen3:4b', size: 2.5e9 }, { name: 'nomic-embed-text', size: 2.7e8 }, { name: 'glm-5.2:cloud', size: 338 }, { name: 'tinyllama:latest', size: 6.4e8 }, { name: 'llama3.2:latest', size: 2.0e9 }] }));
    if (req.url === '/think/api/chat') return res.end(JSON.stringify({ message: { role: 'assistant', content: '<think>let me see</think>\n\nHello!' } }));
    if (req.url === '/old/api/chat') {
      const j = JSON.parse(b);
      if ('think' in j) { res.statusCode = 400; return res.end(JSON.stringify({ error: 'json: unknown field "think"' })); }
      return res.end(JSON.stringify({ message: { content: 'old ollama ok' } }));
    }
    if (req.url === '/api/chat') return res.end(JSON.stringify({ message: { role: 'assistant', content: '{"say":"hi from ollama"}' } }));
    if (req.url!.startsWith('/v1beta/models?')) return res.end(JSON.stringify({ models: [{ name: 'models/gemini-2.5-flash', supportedGenerationMethods: ['generateContent'] }, { name: 'models/embed', supportedGenerationMethods: ['embedContent'] }] }));
    if (req.url === '/oa/v1/models') return res.end(JSON.stringify({ data: [{ id: 'gpt-x' }, { id: 'text-embedding-3' }, { id: 'aaa-mini' }] }));
    if (req.url === '/oa/v1/chat/completions') {
      if (req.headers.authorization !== 'Bearer sk-1') { res.statusCode = 401; return res.end(JSON.stringify({ error: { message: 'bad key' } })); }
      return res.end(JSON.stringify({ choices: [{ message: { content: '{"say":"hi from openai"}' } }] }));
    }
    if (req.url!.includes(':generateContent')) {
      if (req.headers['x-goog-api-key'] === 'busy') { res.statusCode = 503; return res.end(JSON.stringify({ error: { message: 'high demand' } })); }
      if (req.headers['x-goog-api-key'] === 'g1' || req.headers['x-goog-api-key'] === 'g2') return res.end(JSON.stringify({ candidates: [{ content: { parts: [{ text: 'turn ' + req.headers['x-goog-api-key'] }] } }] }));
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
  const ai = new Ai({ ...AI_DEFAULTS, provider: 'none', geminiBase: base }, { gemini: 'gkey' }, log);
  await assert.rejects(ai.generate({ prompt: 'x' }), /off/);
  ai.apply({ provider: 'ollama', ollamaUrl: base + '/', model: 'qwen3:4b' });
  assert.deepEqual(await ai.models(), ['llama3.2:latest', 'qwen3:4b', 'tinyllama:latest']);
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
  assert.equal(ai.model, 'gemini-flash-latest', 'default model when switching provider');
  assert.deepEqual(await ai.models(), ['gemini-2.5-flash']);
  const g = await ai.generate({ prompt: 'hi', system: 'sys' });
  assert.equal(g.text, 'hello from gemini');
  const call = seen.find((s) => s.url!.includes(':generateContent'))!;
  assert.ok(!call.url.includes('gkey'), 'key never in the address');
  assert.equal(call.body.systemInstruction.parts[0].text, 'sys');
  assert.equal(ai.status().ready, true);
});

test('ai: bad settings refused, missing key reported, budget enforced, unreachable server is a clear error', async () => {
  const ai = new Ai({ ...AI_DEFAULTS, provider: 'none', maxCallsPerHour: 1 }, {}, log);
  assert.throws(() => ai.apply({ provider: 'nope' as never }), /unknown provider/);
  assert.throws(() => ai.apply({ provider: 'ollama', ollamaUrl: 'file:///etc' }), /http/);
  ai.apply({ provider: 'gemini' });
  assert.equal(ai.status().ready, false);
  assert.match(ai.status().why!, /GEMINI_API_KEY/);
  ai.apply({ provider: 'ollama', ollamaUrl: base });
  await ai.generate({ prompt: 'one' });
  await assert.rejects(ai.generate({ prompt: 'two' }), /budget/);
  const off = new Ai({ ...AI_DEFAULTS, provider: 'none', timeoutMs: 2000 }, {}, log, { provider: 'ollama', ollamaUrl: 'http://127.0.0.1:9' });
  await assert.rejects(off.generate({ prompt: 'x' }), /can't reach/);
  assert.deepEqual(parseJsonReply('```json\n{"a":1}\n```'), { a: 1 });
});

test('ai: no model chosen on Ollama = the smallest installed one (fastest), embedding models skipped', async () => {
  const ai = new Ai({ ...AI_DEFAULTS, provider: 'none' }, {}, log, { provider: 'ollama', ollamaUrl: base });
  assert.equal(ai.status().auto, true);
  const r = await ai.generate({ prompt: 'hi' });
  assert.equal(r.model, 'llama3.2:latest');
  assert.equal(ai.status().model, 'llama3.2:latest');
  ai.apply({ model: 'qwen3:4b' });
  assert.equal(ai.status().auto, false);
  assert.equal((await ai.generate({ prompt: 'hi' })).model, 'qwen3:4b');
});

test('ai: thinking models (qwen3) give their answer without the <think> part; an older Ollama without "think" still works', async () => {
  const ai = new Ai({ ...AI_DEFAULTS, provider: 'none' }, {}, log, { provider: 'ollama', ollamaUrl: base + '/think' });
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
  const ai = new Ai({ ...AI_DEFAULTS, provider: 'none' }, {}, log);
  ai.apply({ provider: 'ollama', ollamaUrl: base + '/api/tags' });
  assert.equal(ai.settings.ollamaUrl, base);
  assert.deepEqual(await ai.models(), ['llama3.2:latest', 'qwen3:4b', 'tinyllama:latest']);
  ai.apply({ ollamaUrl: base + '/nothing' });
  await assert.rejects(ai.models(), (e: Error) => e.message.includes(`${base}/nothing/api/tags`) && /404/.test(e.message));
});

test('ai: Gemini keys take turns call by call; OpenAI-compatible APIs; a brain\'s own key wins', async () => {
  const ai = new Ai({ ...AI_DEFAULTS, provider: 'none', geminiBase: base }, { gemini: 'g1, g2,g1' }, log);
  ai.apply({ provider: 'gemini' });
  assert.equal(ai.status().keys, 2);
  const used = [];
  for (let k = 0; k < 4; k++) used.push((await ai.generate({ prompt: 'x' })).text);
  assert.deepEqual(used, ['turn g1', 'turn g2', 'turn g1', 'turn g2']);
  ai.apply({ key: 'busy,g2' }); // Google busy on one key: the next key answers
  assert.equal((await ai.generate({ prompt: 'x' })).text, 'turn g2');
  ai.apply({ key: 'gkey' }); // the brain's own key
  assert.equal((await ai.generate({ prompt: 'x' })).text, 'hello from gemini');
  ai.apply({ provider: 'openai', ollamaUrl: base + '/oa/v1/chat/completions', model: 'gpt-x', key: 'sk-1' });
  assert.equal(ai.settings.ollamaUrl, base + '/oa/v1');
  assert.deepEqual(await ai.models(), ['aaa-mini', 'gpt-x']);
  const r = await ai.generate({ prompt: 'hi', system: 's', json: true });
  assert.equal(r.text, '{"say":"hi from openai"}');
  const last = seen.filter((x) => x.url === '/oa/v1/chat/completions').pop()!;
  assert.equal(last.body.messages[0].role, 'system');
  assert.deepEqual(last.body.response_format, { type: 'json_object' });
  ai.apply({ key: 'sk-wrong' });
  await assert.rejects(ai.generate({ prompt: 'hi' }), /401/);
});

test('brains: saved, switched, keys kept server side (only the last 4 shown), the one in use cannot be removed', async () => {
  const { Brains } = await import('../ai/brains.js');
  let stored: string | undefined;
  const ai = new Ai({ ...AI_DEFAULTS, provider: 'none', geminiBase: base }, { gemini: 'g1,g2' }, log, { provider: 'ollama', ollamaUrl: base });
  const br = new Brains(() => stored, (j) => { stored = j; }, ai.settings, [{ provider: 'gemini', name: 'Gemini' }]);
  assert.deepEqual(br.view().list.map((b) => [b.id, b.provider, b.active]), [['b1', 'ollama', true], ['b2', 'gemini', false]]);
  const b = br.put({ name: 'Groq', provider: 'openai', url: base + '/oa/v1', model: 'gpt-x', key: 'sk-1' }, (s) => ai.check(s));
  assert.equal(b.id, 'b3');
  const v = br.view().list.find((x) => x.id === 'b3')!;
  assert.equal(v.keys, 1); assert.equal(v.keyEnd, 'sk-1'.slice(-4));
  assert.ok(!JSON.stringify(br.view()).includes('"key"'), 'no key field in what clients get');
  br.put({ id: 'b3', name: 'Groq fast' }, (s) => ai.check(s));
  br.put({ id: 'b2', addKey: 'AIzaKEY1xxxx' }, (s) => ai.check(s));
  br.put({ id: 'b2', addKey: 'AIzaKEY2yyyy, AIzaKEY1xxxx' }, (s) => ai.check(s));
  assert.deepEqual(br.view().list.find((x) => x.id === 'b2')!.keyEnds, ['xxxx', 'yyyy'], 'keys added one by one, no repeats');
  br.put({ id: 'b2', removeKey: 0 }, (s) => ai.check(s));
  assert.equal(br.get('b2')!.key, 'AIzaKEY2yyyy');
  assert.equal(br.get('b3')!.key, 'sk-1', 'key kept when not sent');
  assert.throws(() => br.put({ id: 'b3', url: 'file:///etc' }, (s) => ai.check(s)), /http/);
  ai.apply(br.settingsOf(br.use('b3')));
  assert.equal((await ai.generate({ prompt: 'x' })).text, '{"say":"hi from openai"}');
  assert.throws(() => br.remove('b3'), /in use/);
  br.remove('b1');
  // Read again from what was stored.
  const again = new Brains(() => stored, () => {}, ai.settings);
  assert.equal(again.active.name, 'Groq fast');
  assert.deepEqual(again.view().list.map((x) => x.id), ['b2', 'b3']);
});
