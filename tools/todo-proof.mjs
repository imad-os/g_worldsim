// To-do tab proof without touching GitHub: node tools/todo-proof.mjs <server> <outdir> (ADMIN_TOKEN set).
// api.github.com is answered by a small in-memory fake (issues + comments), so adding, replying and the status tags can be checked.
import { createRequire } from 'node:module';
import { mkdirSync } from 'node:fs';
const { chromium } = createRequire(import.meta.url)('playwright');
const [server, out] = process.argv.slice(2);
mkdirSync(out, { recursive: true });
const now = Date.now(), iso = (minAgo) => new Date(now - minAgo * 60000).toISOString();
const me = { login: 'imad-os' }, claude = { login: 'claude[bot]' };
let next = 4;
const issue = (number, title, body, extra = {}) => ({ number, title, body, state: 'open', state_reason: null, labels: [{ name: 'claude-todo' }], comments: 0, created_at: iso(90), closed_at: null, html_url: `https://github.com/imad-os/g_worldsim/issues/${number}`, user: me, ...extra });
const issues = [
  issue(1, 'Horses run through hut walls', 'Saw a wild horse walk through the north hut wall in town.', { state: 'closed', state_reason: 'completed', closed_at: iso(20), comments: 1 }),
  issue(2, 'Add rain', 'Weather: rain at night sometimes, people go inside.', { labels: [{ name: 'claude-todo' }, { name: 'claude-question' }], comments: 1 }),
  issue(3, 'Show the clan name over heads', '', { labels: [{ name: 'claude-todo' }, { name: 'claude-doing' }] }),
];
const comments = {
  1: [{ id: 11, body: 'Done in `a1b2c3d`: horses now use the same wall check as people (`World.step`). Test horses.test "walls" passes. Pushed to main, your PC updates itself.', created_at: iso(20), user: claude }],
  2: [{ id: 21, body: 'Should rain also put out campfires, or only make people go in?', created_at: iso(30), user: claude }],
};
const seen = [];
const b = await chromium.launch();
const errors = [];
for (const [tag, vp] of [['desk', { width: 1440, height: 900 }], ['phone', { width: 390, height: 844, isMobile: true, hasTouch: true }]]) {
  const ctx = await b.newContext({ viewport: { width: vp.width, height: vp.height }, isMobile: vp.isMobile, hasTouch: vp.hasTouch, deviceScaleFactor: 1 });
  await ctx.route('https://api.github.com/**', async (r) => {
    const req = r.request(), u = new URL(req.url()), m = req.method(), body = req.postData() ? JSON.parse(req.postData()) : null;
    seen.push(`${m} ${u.pathname}${u.search} auth=${req.headers().authorization ? 'yes' : 'no'}`);
    const p = u.pathname.replace('/repos/imad-os/g_worldsim', '');
    const json = (v, status = 200) => r.fulfill({ status, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: JSON.stringify(v) });
    if (m === 'GET' && p === '/issues') { const st = u.searchParams.get('state'); return json(issues.filter((x) => st === 'all' || x.state === st).sort((a, b2) => b2.number - a.number)); }
    let k;
    if ((k = p.match(/^\/issues\/(\d+)\/comments$/))) {
      const n = Number(k[1]);
      if (m === 'GET') return json(comments[n] ?? []);
      (comments[n] ??= []).push({ id: Date.now(), body: body.body, created_at: new Date().toISOString(), user: me }); issues.find((x) => x.number === n).comments++; return json({}, 201);
    }
    if ((k = p.match(/^\/issues\/(\d+)\/labels\/(.+)$/))) { const x = issues.find((y) => y.number === Number(k[1])); x.labels = x.labels.filter((l) => l.name !== decodeURIComponent(k[2])); return json([]); }
    if ((k = p.match(/^\/issues\/(\d+)$/)) && m === 'PATCH') { const x = issues.find((y) => y.number === Number(k[1])); Object.assign(x, body); return json(x); }
    if (p === '/issues' && m === 'POST') { const x = issue(next++, body.title, body.body, { labels: body.labels.map((name) => ({ name })), created_at: new Date().toISOString() }); issues.push(x); return json(x, 201); }
    return json({ message: 'not faked' }, 404);
  });
  const page = await ctx.newPage();
  page.on('pageerror', (e) => errors.push(`${tag} pageerror ${e.message}`));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(`${tag} console ${m.text()}`); });
  page.on('dialog', (d) => d.accept());
  await page.goto(server + '/panel/');
  await page.waitForSelector('#sTokBox');
  await page.evaluate(() => { const d = document.getElementById('sTokBox'); if (d) d.open = true; });
  await page.waitForSelector('#sTokIn', { state: 'visible' });
  await page.fill('#sTokIn', process.env.ADMIN_TOKEN);
  if (await page.inputValue('#sAddrIn') === '') await page.fill('#sAddrIn', server);
  await page.click('#sGo');
  await page.waitForSelector('#app:not([hidden])', { timeout: 15000 });
  await page.evaluate(() => { location.hash = '#/todo'; });
  await page.waitForSelector('#tList details', { timeout: 8000 });
  if (tag === 'desk') {
    await page.screenshot({ path: `${out}/1-no-token.png`, fullPage: true });
    await page.fill('#tTok', 'github_pat_FAKE_for_proof_1234');
    await page.click('#tTokSave');
    await page.fill('#tTitle', 'Zombies should avoid lamps more');
    await page.fill('#tBody', 'At night they still walk right up to the lamp at the camp gate.');
    await page.click('#tAdd');
    await page.waitForFunction(() => document.querySelector('#tList')?.textContent.includes('Zombies should avoid lamps'));
    await page.click('#tList details[data-n="2"] summary');
    await page.waitForTimeout(600);
    await page.fill('[data-reply="2"]', 'Only make them go in. Fires stay lit.');
    await page.click('[data-send="2"]');
    await page.waitForTimeout(800);
    await page.screenshot({ path: `${out}/2-added-and-answered.png`, fullPage: true });
    await page.selectOption('#tShow', 'closed');
    await page.waitForTimeout(800);
    await page.click('#tList details[data-n="1"] summary');
    await page.waitForTimeout(400);
    await page.screenshot({ path: `${out}/3-done-with-answer.png`, fullPage: true });
  } else {
    await page.waitForTimeout(800);
    await page.screenshot({ path: `${out}/4-phone.png`, fullPage: true });
  }
  const t = await page.textContent('#view'); if (/undefined|NaN|\[object/.test(t)) errors.push(`${tag}: text has undefined/NaN`);
  await ctx.close();
}
await b.close();
console.log(seen.join('\n'));
console.log('issue 2 labels now:', issues[1].labels.map((l) => l.name).join(','), '| new issue:', JSON.stringify(issues.at(-1).title), issues.at(-1).labels.map((l) => l.name));
console.log(errors.length ? errors.join('\n') : 'no page errors');
