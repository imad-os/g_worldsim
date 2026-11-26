// Influence and hybrid clan elections: node tools/influence-proof.mjs <outdir>
// Starts a server in-process, lives a game day with zombies at night, stages a rescue (a zombie bites a child, an adult kills it),
// founds a clan, holds an election, then screenshots (dark) the hero's person page and the People page's Clans card.
import { createRequire } from 'node:module';
import { mkdtempSync, mkdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { App } from '../packages/server/dist/app.js';
import { DEFAULTS } from '../packages/server/dist/config.js';
import { Logger } from '../packages/server/dist/log.js';
import { Kind, EFlag } from '@worldsim/protocol';
const { chromium } = createRequire(import.meta.url)('playwright');
const out = process.argv[2] ?? 'influence-proof'; mkdirSync(out, { recursive: true });
const ADMIN = 'admin-token-0123456789abcdef', dir = mkdtempSync(join(tmpdir(), 'ws-inf-'));
const cfg = { ...structuredClone(DEFAULTS), dataDir: dir, port: 0, snapshotEverySec: 3600, capacity: 2048, auth: { projectId: 'none' } };
cfg.tunnel = { provider: 'none', bin: { ngrok: '/nonexistent/ngrok' } }; cfg.ai = { ...cfg.ai, provider: 'none' };
const app = new App(cfg, { adminToken: ADMIN, viewers: new Map() }, new Logger('error', undefined, true));
await app.start();
app.loop?.stop?.();
const w = app.world, e = w.e, town = w.mapIndex.get('town');
w.zombies.perNight = 3;
const step = (secs) => { for (let k = 0; k < secs * 20; k++) w.step(); };
step(86400 / w.opt.clockScale);
const people = []; for (let i = 0; i < e.hi; i++) if (e.kind[i] === Kind.Agent && e.map[i] === town) people.push(i);
const [hero, kid] = [people[0], people.find((i) => e.flags[i] & EFlag.Child) ?? people[people.length - 1]];
e.flags[kid] |= EFlag.Child;
for (let n = 0; n < 2; n++) { const z = w.zombies.spawn(town, e.x[kid] + 1, e.y[kid], true); w.emit('bitten', { id: e.id(kid), by: e.id(z), hp: 70 }); w.zombies.hit(z, 9999, hero); }
const ids = people.filter((i) => i !== kid).map((i) => e.id(i));
for (const c of w.clans.clans) if (c.members.includes(e.id(kid))) w.clans.leave(c, e.id(kid), 'proof: a child');
const cl = w.clans.clans.find((c) => c.map === town && c.members.length) ?? w.clans.found(town, ids[1], ids.filter((x) => x !== ids[1]));
for (const id of ids) if (!cl.members.includes(id)) w.clans.join(cl, id, 0.5);
const before = Object.fromEntries(cl.members.map((id) => [w.profiles.get(id).name, w.influence.of(id)]));
cl.leader = cl.members.slice().sort((a, b) => w.influence.of(a) - w.influence.of(b))[0]; // the least influential leads before the vote
const oldLeader = w.profiles.get(cl.leader).name;
w.clans.callVote(cl, 'proof'); w.clans.closeVote(cl);
console.log(JSON.stringify({ influence: before, oldLeader, newLeader: w.profiles.get(cl.leader).name, tally: cl.result.tally.map(([k, n]) => [w.profiles.get(k).name, n]), heroLog: w.influence.log(e.id(hero)) }, null, 1));
step(60);
const port = app.net.http.address().port, server = `http://127.0.0.1:${port}`;
const b = await chromium.launch();
const ctx = await b.newContext({ colorScheme: 'dark', viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
const page = await ctx.newPage();
page.on('pageerror', (er) => console.log('pageerror', er.message));
await page.goto(server + '/panel/');
await page.waitForSelector('#sTokBox');
await page.evaluate(() => { document.getElementById('sTokBox').open = true; });
await page.fill('#sTokIn', ADMIN);
if (await page.inputValue('#sAddrIn') === '') await page.fill('#sAddrIn', server);
await page.click('#sGo');
await page.waitForSelector('#app:not([hidden])', { timeout: 15000 });
await page.evaluate((id) => { location.hash = '#/person/' + id; }, e.id(hero));
await page.waitForTimeout(2500);
await page.screenshot({ path: `${out}/1-person-influence.png`, fullPage: true });
await page.evaluate(() => { location.hash = '#/people'; });
await page.waitForTimeout(2500);
await page.screenshot({ path: `${out}/2-people-clans.png`, fullPage: true });
const t = await page.textContent('#view'); if (/undefined|NaN|\[object/.test(t)) console.log('bad text', t.match(/.{0,40}(undefined|NaN).{0,40}/)?.[0]);
await b.close();
app.stop(); rmSync(dir, { recursive: true, force: true });
process.exit(0);
