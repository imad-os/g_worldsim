import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { App } from '../app.js';
import { DEFAULTS, type Config } from '../config.js';
import { Logger } from '../log.js';

test('analysis: every stat, a question to a chosen brain with the ticked logs, secrets hidden, answers kept', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'ws-analysis-'));
  const prompts: string[] = [];
  const fake = createServer((req, res) => {
    let b = '';
    req.on('data', (d) => (b += d));
    req.on('end', () => {
      const j = JSON.parse(b) as { messages: { content: string }[] };
      prompts.push(j.messages.map((m) => m.content).join('\n'));
      res.setHeader('content-type', 'application/json');
      res.end(JSON.stringify({ message: { role: 'assistant', content: '<think>hmm</think>Nobody is expecting because they are single.' } }));
    });
  });
  await new Promise<void>((ok) => fake.listen(0, '127.0.0.1', () => ok()));
  after(() => fake.close());
  const cfg: Config = { ...structuredClone(DEFAULTS), dataDir: dir, port: 0, snapshotEverySec: 3600, auth: { projectId: 'none' } };
  cfg.tunnel = { provider: 'none', bin: { ngrok: '/nonexistent/ngrok' } };
  cfg.ai = { ...cfg.ai, provider: 'none' };
  const app = new App(cfg, { adminToken: 'admin-token-0123456789abcdef', viewers: new Map(), openaiKey: 'sk-secret-openai-key-123456' }, new Logger('error', undefined, true));
  try {
    await app.start();
    const v = await app.adminCmd({ cmd: 'analysis' }, 'admin', true) as { stats: { population: { alive: number }; reproduction: { women: unknown[]; women18plus: Record<string, number> }; maps: { trees: number; animals: Record<string, number> }[] }; types: { id: string }[]; history: unknown[] };
    assert.equal(v.stats.population.alive, 5);
    assert.ok(v.stats.maps.some((m) => m.trees > 0), 'trees counted');
    assert.ok(v.types.some((t) => t.id === 'life') && v.types.some((t) => t.id === 'people'));
    assert.equal(v.history.length, 0);

    const pre = await app.adminCmd({ cmd: 'analysisPreview', question: 'why no babies?', include: ['people', 'life'] }, 'admin', true) as { prompt: string };
    assert.match(pre.prompt, /WORLD STATS NOW/);
    assert.match(pre.prompt, /LOG "Everyone now"/);
    assert.doesNotMatch(pre.prompt, /LOG "Server warnings/);

    const port = (fake.address() as { port: number }).port;
    const saved = await app.adminCmd({ cmd: 'brainSave', name: 'fake', provider: 'ollama', url: `http://127.0.0.1:${port}`, model: 'fake' }, 'admin', true) as { saved: string };
    app.log.warn('test warning', { key: 'sk-secret-openai-key-123456' });
    const a = await app.adminCmd({ cmd: 'analysisAsk', question: 'why no babies?', include: ['people', 'life', 'server'], brain: saved.saved }, 'admin', true) as { answer: string; err?: string; brain: string };
    assert.equal(a.err, undefined);
    assert.equal(a.answer, 'Nobody is expecting because they are single.');
    assert.equal(a.brain, 'fake');
    assert.equal(prompts.length, 1);
    assert.match(prompts[0]!, /THE OWNER'S QUESTION: why no babies\?/);
    assert.match(prompts[0]!, /Births, deaths, couples/);
    assert.doesNotMatch(prompts[0]!, /sk-secret-openai-key-123456/, 'secrets never sent');
    const v2 = await app.adminCmd({ cmd: 'analysis' }, 'admin', true) as { history: { q: string }[] };
    assert.equal(v2.history[0]!.q, 'why no babies?');
    // The brain in use is off: a clear error, kept with the question.
    const b = await app.adminCmd({ cmd: 'analysisAsk', question: 'how many animals?', include: [] }, 'admin', true) as { err?: string };
    assert.match(String(b.err), /off/i);
    await app.adminCmd({ cmd: 'analysisForget' }, 'admin', true);
    assert.equal((await app.adminCmd({ cmd: 'analysis' }, 'admin', true) as { history: unknown[] }).history.length, 0);
  } finally { await app.stop(); rmSync(dir, { recursive: true, force: true }); }
});
