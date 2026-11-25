// Proof of the panel's AI agent and server controls on a running server, with a scripted fake model (no real AI needed):
//   ADMIN_TOKEN=... node tools/agent-proof.mjs <server> <outdir>
// Adds a brain "proof (fake)" pointing at a fake Ollama started here, asks the agent in the panel to change a person's sex,
// screenshots the proposal, presses Run, checks the world changed, screenshots the Server page, presses Restart and
// checks a new process answers. The fake brain is removed at the end.
import { createRequire } from 'node:module';
import { createServer } from 'node:http';
import { mkdirSync } from 'node:fs';
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const { WebSocket } = require('ws');
const { encode, decode, Msg, PROTOCOL_VERSION } = await import('../packages/protocol/dist/index.js');
const [server, out] = process.argv.slice(2);
mkdirSync(out, { recursive: true });
const TOKEN = process.env.ADMIN_TOKEN;

let who = '', to = '';
const fake = createServer((req, res) => {
  let b = ''; req.on('data', (d) => (b += d)); req.on('end', () => {
    const j = JSON.parse(b || '{}');
    if (req.url === '/api/tags') { res.end(JSON.stringify({ models: [{ name: 'fake' }] })); return; }
    const p = (j.messages ?? []).map((m) => m.content).join('\n');
    const turn = p.split('Your next JSON answer:')[0];
    let a;
    if (/ACTION RESULT/.test(turn.slice(turn.lastIndexOf('OWNER:')))) a = { say: `Done: ${who} is now ${to === 'f' ? 'a woman' : 'a man'}.` };
    else if (/LOOK RESULT/.test(turn.slice(turn.lastIndexOf('OWNER:')))) a = { say: `${who} is found. This code changes the sex and redraws them.`, why: `The owner asked to change ${who}'s sex.`,
      run: `const x = person(${JSON.stringify(who)});\nif (!x) throw new Error('not found');\nconst before = x.p.sex;\nx.p.sex = '${to}';\nworld.setLook(x.i);\nprint('was', before);\nreturn { name: x.p.name, sex: x.p.sex };` };
    else a = { say: `Let me find ${who} first.`, peek: `return data.agents.filter(a => a.name === ${JSON.stringify(who)}).map(a => ({ name: a.name, sex: a.sex, map: a.map }))`, read: ['packages/server/src/sim/people.ts:13-16'] };
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ message: { role: 'assistant', content: JSON.stringify(a) } }));
  });
});
await new Promise((ok) => fake.listen(0, '127.0.0.1', ok));
const fakeUrl = `http://127.0.0.1:${fake.address().port}`;

function admin() {
  return new Promise((ok, fail) => {
    const ws = new WebSocket(server.replace(/^http/, 'ws') + '/ws');
    let id = 1; const wait = new Map();
    ws.on('open', () => ws.send(encode({ t: Msg.Hello, v: PROTOCOL_VERSION, token: TOKEN })));
    ws.on('error', fail);
    ws.on('message', (d) => {
      const m = decode(d);
      if (m.t === Msg.Welcome) ok({ ws, cmd: (c) => new Promise((y, n) => { const k = id++; wait.set(k, [y, n]); ws.send(encode({ t: Msg.Admin, id: k, c })); }) });
      if (m.t === Msg.AdminResult) { const w = wait.get(m.id); if (w) { wait.delete(m.id); m.ok ? w[0](m.data) : w[1](new Error(m.err)); } }
    });
  });
}
const a = await admin();
const people = await a.cmd({ cmd: 'agents' });
const person = (Array.isArray(people) ? people : people.list ?? []).find((p) => p.name && p.sex);
who = person.name; to = person.sex === 'f' ? 'm' : 'f';
console.log('person', who, person.sex, '->', to);
const saved = await a.cmd({ cmd: 'brainSave', name: 'proof (fake)', provider: 'ollama', url: fakeUrl, model: 'fake' });
await a.cmd({ cmd: 'coderReset' });
await a.cmd({ cmd: 'coderBrain', id: saved.saved });
const pid0 = (await a.cmd({ cmd: 'serverInfo' })).pid;

const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 1280, height: 900 }, deviceScaleFactor: 1 });
const page = await ctx.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
page.on('dialog', (d) => d.accept());
await page.goto(server + '/panel/');
await page.waitForSelector('#sTokBox');
await page.evaluate(() => { document.getElementById('sTokBox').open = true; });
await page.waitForSelector('#sTokIn', { state: 'visible' });
await page.fill('#sTokIn', TOKEN);
await page.click('#sGo');
await page.waitForSelector('#app:not([hidden])', { timeout: 15000 });
await page.evaluate(() => { location.hash = '#/agent'; });
await page.waitForSelector('#agSay');
await page.fill('#agSay', `Change the sex of ${who} to ${to === 'f' ? 'woman' : 'man'}`);
await page.click('#agGo');
await page.waitForSelector('#agRun', { timeout: 20000 });
await page.waitForTimeout(500);
await page.screenshot({ path: `${out}/1-proposal.png`, fullPage: true });
await page.click('#agRun');
await page.waitForFunction(() => /done:/.test(document.getElementById('agChat')?.textContent ?? ''), null, { timeout: 30000 });
await page.waitForFunction(() => /Done: /.test(document.getElementById('agChat')?.textContent ?? ''), null, { timeout: 15000 }).catch(() => {});
await page.waitForTimeout(800);
await page.screenshot({ path: `${out}/2-after-run.png`, fullPage: true });
const after = (await a.cmd({ cmd: 'people' })).find((p) => p.name === who);
console.log('sex now', after.sex, after.sex === to ? 'CHANGED' : 'NOT CHANGED');
const audit = await a.cmd({ cmd: 'coderAudit', limit: 1 });
console.log('audit', audit[0].id, audit[0].status, 'backup', audit[0].backup);

await page.evaluate(() => { location.hash = '#/server'; });
await page.waitForSelector('#cBackups .pair', { timeout: 10000 });
await page.waitForTimeout(1500);
await page.screenshot({ path: `${out}/3-server.png`, fullPage: true });
a.ws.close();
await page.click('#cRestart');
const t0 = Date.now();
let pid1 = 0;
for (let k = 0; k < 60 && !pid1; k++) {
  await new Promise((r) => setTimeout(r, 1000));
  try { const h = await (await fetch(server + '/health')).json(); if (h.ok) { const c = await admin(); const i = await c.cmd({ cmd: 'serverInfo' }); if (i.pid !== pid0) pid1 = i.pid; if (pid1) { await c.cmd({ cmd: 'brainDelete', id: saved.saved }); await c.cmd({ cmd: 'coderBrain', id: (await c.cmd({ cmd: 'brains' })).list[0].id }).catch(() => {}); } c.ws.close(); } } catch { /* down */ }
}
console.log('restart', pid1 ? `new pid ${pid1} (was ${pid0}) after ${Math.round((Date.now() - t0) / 1000)} s` : 'NO NEW PROCESS');
await page.waitForTimeout(6000);
await page.screenshot({ path: `${out}/4-after-restart.png` });
console.log(errors.length ? 'page errors: ' + errors.join(' | ') : 'no page errors');
await b.close();
fake.close();
process.exit(0);
