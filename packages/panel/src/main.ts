import type { ServerStats } from '@worldsim/protocol';
import { connect, disconnect, listeners, serverAddress, setServer, token, onServer, stats } from './api.js';
import { dashboard } from './dashboard.js';
import { help, showHelp, closeHelp } from './help.js';
import { peopleScreen, personScreen, personSaid } from './people.js';
import { view, type Screen } from './screen.js';
import { world, zombies, crafting, rules, ai, players, events, server, settings, applyLook } from './screens.js';
import { S } from './state.js';
import { $, esc, gameTime, hourOf, icon, load, save, toast } from './util.js';
import * as fb from './fb.js';
import { meScreen, usersScreen } from './account.js';
import { account, isStaff } from './api.js';
const val2 = (id: string) => ($(id) as HTMLInputElement).value.trim();

/**
 * World control panel 2 (imad 2026-11-20: "advanced, informative, '?' guides, responsive, a dashboard, a screen for
 * each kind of thing, hosted on GitHub"). One page, hash routes, a side menu on wide screens and a bottom bar on phones.
 */
const ROUTES: Record<string, Screen> = { me: meScreen, users: usersScreen, dashboard, people: peopleScreen, person: personScreen, world, zombies, crafting, rules, ai, players, events, server, settings };
const STAFF_NAV = ['dashboard', 'people', 'world', 'zombies', 'crafting', 'rules', 'ai', 'players', 'events', 'server', 'me', 'users', 'settings'];
const PLAYER_NAV = ['me', 'settings'];
let NAV = STAFF_NAV;
const BOTTOM = ['dashboard', 'people', 'world', 'events'];

let cur: Screen | null = null, curKey = '', timer = 0, ready = false;

function navHtml(): string {
  return NAV.map((k) => { const s = ROUTES[k]!; return `<a href="#/${k}" data-nav="${k}">${icon(s.icon)}<span>${s.title}</span><b class="badge" data-badge="${k}" hidden></b></a>`; }).join('');
}

function bottomHtml(keys: string[]): string {
  return keys.map((k) => `<a href="#/${k}" data-nav="${k}">${icon(ROUTES[k]!.icon)}<span>${ROUTES[k]!.title.split(' ')[0]}</span></a>`).join('') + `<button id="moreBtn">${icon('more')}<span>More</span><b class="badge" data-badge="more" hidden></b></button>`;
}

function route(): void {
  if (!ready) return;
  const home = isStaff() ? 'dashboard' : 'me';
  let [, key = home, arg = ''] = location.hash.split('/');
  if (!NAV.includes(key) && !(key === 'person' && isStaff())) key = home;
  const s = ROUTES[key] ?? ROUTES[home]!;
  cur?.leave?.();
  clearInterval(timer);
  closeHelp();
  cur = s; curKey = key;
  for (const a of document.querySelectorAll<HTMLElement>('[data-nav]')) a.classList.toggle('on', a.dataset.nav === (curKey === 'person' ? 'people' : curKey));
  $('title').innerHTML = `${esc(s.title)}${s.help ? help(s.help) : ''}`;
  document.title = `${s.title} · World`;
  view().innerHTML = s.render(arg);
  view().scrollTop = 0; window.scrollTo(0, 0);
  $('sheet').hidden = true;
  void Promise.resolve(s.mount?.(arg)).catch((e) => toast(String(e), 'err'));
  if (s.refresh && s.every) timer = window.setInterval(() => { if (!document.hidden && cur === s) void Promise.resolve(s.refresh!()).catch(() => {}); }, s.every * 1000);
}

function topStats(s: ServerStats): void {
  const g = S.ov ? S.ov.gameSec : 0, h = hourOf(g);
  $('clock').innerHTML = `${icon(h < 6 || h >= 21 ? 'moon' : 'sun')}<span>${S.ov ? gameTime(g) : ''}</span>${s.paused ? '<span class="tag bad">Paused</span>' : `<span class="tag">x${s.speed}</span>`}`;
  $('pauseBtn').innerHTML = s.paused ? icon('play') : icon('pause');
  $('pauseBtn').title = s.paused ? 'Resume' : 'Pause';
  const pb = document.querySelector<HTMLElement>('[data-badge="players"]');
  if (pb) { pb.hidden = !s.pairings; pb.textContent = String(s.pairings ?? ''); }
  const zb = document.querySelector<HTMLElement>('[data-badge="zombies"]');
  if (zb) { zb.hidden = !s.zombies?.now; zb.textContent = String(s.zombies?.now ?? ''); }
  cur?.onStats?.(s);
}
// The game clock moves on between overviews (every few seconds is enough for the top bar).
setInterval(() => { if (ready && S.ov && stats && !stats.paused) { S.ov.gameSec += (stats.effSpeed || stats.speed) * (S.ov.clockScale || 10); topStats(stats); } }, 1000);
setInterval(() => { if (ready && isStaff() && !document.hidden) void import('./state.js').then((m) => m.overview()).catch(() => {}); }, 5000);

function showSignin(msg = ''): void {
  ready = false;
  $('app').hidden = true; $('signin').hidden = false;
  ($('sAddrIn') as HTMLInputElement).value = serverAddress();
  ($('sAddrIn') as HTMLInputElement).disabled = onServer;
  $('sMsg').textContent = msg;
}
/** Signed in with Firebase: connect with a fresh ID token at every (re)connect. */
async function fbConnect(u: fb.FbUserInfo): Promise<void> {
  const addr = onServer ? location.origin : setServer(($('sAddrIn') as HTMLInputElement).value);
  if (!addr) { $('sMsg').textContent = 'Type the server address first.'; return; }
  $('sMsg').textContent = 'Checking your account…';
  try { await fb.ensureRole(u); } catch (e) { $('sMsg').textContent = fb.why(e); return; }
  $('sMsg').textContent = 'Connecting…';
  save('mode', 'fb');
  connect(addr, async () => 'fb:' + (await fb.idToken()));
}
async function fbDo(f: () => Promise<fb.FbUserInfo>): Promise<void> {
  $('sMsg').textContent = '';
  try { await fbConnect(await f()); } catch (e) { $('sMsg').textContent = fb.why(e); }
}
function signIn(): void {
  save('mode', 'token');
  const addr = onServer ? location.origin : setServer(($('sAddrIn') as HTMLInputElement).value);
  const tok = ($('sTokIn') as HTMLInputElement).value.trim() || token();
  if (!addr) { $('sMsg').textContent = 'Type the server address first.'; return; }
  if (!tok) { $('sMsg').textContent = 'Type the admin token.'; return; }
  $('sMsg').textContent = 'Connecting…';
  connect(addr, tok);
}

listeners.state = (s, why) => {
  const el = $('conn');
  el.className = `conn ${s}`;
  el.title = s === 'open' ? 'Connected' : s === 'connecting' ? 'Connecting…' : `Disconnected${why ? ': ' + why : ''}`;
  if (s === 'closed' && !ready && !$('signin').hidden) $('sMsg').textContent = `Could not reach ${serverAddress()}${why ? ' (' + why + ')' : ''}. Check the address and that the server is running.`;
};
listeners.welcome = () => {
  const first = !ready;
  ready = true;
  $('signin').hidden = true; $('app').hidden = false;
  $('srv').textContent = account ? `${account.email} · ${account.role}` : serverAddress().replace(/^https?:\/\//, '');
  // What this account may see: players get their own page (and the panel settings) only.
  const nav = isStaff() ? STAFF_NAV : PLAYER_NAV;
  if (nav !== NAV || first) {
    NAV = nav;
    for (const n of document.querySelectorAll('.nav')) n.innerHTML = navHtml();
    const bottom = isStaff() ? BOTTOM : PLAYER_NAV;
    document.querySelector('nav.bottom')!.innerHTML = bottomHtml(bottom);
    $('moreBtn').onclick = () => { $('sheet').hidden = false; };
    $('pauseBtn').hidden = !isStaff();
  }
  if (!isStaff()) { if (first) route(); else cur?.refresh?.(); return; }
  void import('./state.js').then(async (m) => { await m.overview(true); await m.people(); if (first) route(); else cur?.refresh?.(); });
};
listeners.denied = (why) => { disconnect(); showSignin(why); };
listeners.stats = (s) => topStats(s);
listeners.notice = (kind, data) => {
  if (kind === 'pairing') { toast('A TV wants to join: approve it on Players & TVs', 'info'); if (load('vibrate', true)) try { navigator.vibrate?.(200); } catch { /* */ } if (curKey === 'players') void cur?.refresh?.(); }
  if (kind === 'paired' && curKey === 'players') void cur?.refresh?.();
  if (kind === 'say') { const d = data as { id: number; name: string; text: string }; personSaid(d.id, d.name, d.text); if (load('sayToasts', false)) toast(`${d.name}: “${d.text}”`); }
  if (kind === 'url') toast(`Internet link changed: ${(data as { url: string }).url}`);
};

// ------------------------------------------------------------ the page
document.body.innerHTML = `
<div id="signin" class="signin" hidden><div class="si-card">
  <div class="brand big">${icon('world')}<span>World<small>control panel</small></span></div>
  <label class="fld">Server address ${help('address')}<input id="sAddrIn" placeholder="https://your-link.ngrok-free.dev" autocomplete="url" inputmode="url"></label>
  <div id="sFb" hidden>
    <button class="btn google wide" id="sGoogle">${icon('google')} Continue with Google</button>
    <div class="si-or">or with your email</div>
    <label class="fld">Email<input id="sEmail" type="email" autocomplete="email" placeholder="you@example.com"></label>
    <label class="fld">Password<input id="sPass" type="password" autocomplete="current-password" placeholder="at least 6 characters"></label>
    <button class="btn primary wide" id="sEmailGo">Sign in</button>
    <div class="si-links"><a id="sNew">Create an account</a><a id="sForgot">Forgot the password?</a></div>
  </div>
  <p id="sMsg" class="si-msg"></p>
  <details class="si-tok" id="sTokBox"><summary>Admin token (your PC only) ${help('token')}</summary>
    <label class="fld"><input id="sTokIn" type="password" autocomplete="off" placeholder="ADMIN_TOKEN from the server .env"></label>
    <button class="btn wide" id="sGo">Sign in with the token</button></details>
  <p class="dim small">This device remembers you. The panel can be opened from anywhere: it talks to your server directly.</p></div></div>
<div id="app" class="app" hidden>
  <aside class="side"><div class="brand">${icon('world')}<span>World<small id="srv"></small></span></div><nav class="nav">${navHtml()}</nav>
    <div class="side-f"><span id="conn" class="conn"></span> <span class="dim small">${onServer ? 'on the server' : 'from GitHub'}</span></div></aside>
  <div class="main"><header class="top"><button class="iconbtn only-m" id="menuBtn" aria-label="Menu">${icon('more')}</button><h1 id="title"></h1>
    <div class="top-r"><span id="clock" class="clock"></span><button class="iconbtn" id="pauseBtn" aria-label="Pause or resume"></button></div></header>
    <main id="view" class="view"></main></div>
  <nav class="bottom">${bottomHtml(BOTTOM)}</nav>
  <div id="sheet" class="sheet" hidden><div class="sheet-b"><div class="sheet-h"><b>All pages</b><button class="iconbtn" id="sheetX" aria-label="Close">${icon('x')}</button></div><nav class="nav grid">${navHtml()}</nav></div></div>
</div>
<div id="toast" class="toast" role="status"></div>`;

applyLook();
matchMedia('(prefers-color-scheme: light)').addEventListener('change', applyLook);
window.addEventListener('hashchange', route);
document.addEventListener('click', (e) => {
  const t = e.target as HTMLElement;
  const hq = t.closest<HTMLElement>('[data-help]');
  if (hq) { e.preventDefault(); e.stopPropagation(); showHelp(hq); return; }
  if (!t.closest('.pop')) closeHelp();
});
$('sGo').onclick = signIn;
$('sGoogle').onclick = () => void fbDo(fb.google);
$('sEmailGo').onclick = () => void fbDo(() => fb.emailIn(val2('sEmail'), val2('sPass')));
$('sNew').onclick = () => void fbDo(() => fb.emailUp(val2('sEmail'), val2('sPass')));
$('sForgot').onclick = () => { const e = val2('sEmail'); if (!e) { $('sMsg').textContent = 'Type your email first.'; return; } fb.reset(e).then(() => { $('sMsg').textContent = 'Check your email: a link to choose a new password is on its way.'; }, (x) => { $('sMsg').textContent = fb.why(x); }); };
($('sPass') as HTMLInputElement).onkeydown = (e) => { if (e.key === 'Enter') $('sEmailGo').click(); };
($('sTokIn') as HTMLInputElement).onkeydown = (e) => { if (e.key === 'Enter') signIn(); };
($('sAddrIn') as HTMLInputElement).onkeydown = (e) => { if (e.key === 'Enter') ($('sTokIn') as HTMLInputElement).focus(); };
$('pauseBtn').onclick = () => void import('./api.js').then((m) => m.cmd({ cmd: 'pause', paused: !stats?.paused })).catch((e) => toast(String(e), 'err'));
const openSheet = () => { $('sheet').hidden = false; };
$('menuBtn').onclick = openSheet; $('moreBtn').onclick = openSheet;
$('sheetX').onclick = () => { $('sheet').hidden = true; };
$('sheet').onclick = (e) => { if (e.target === $('sheet')) $('sheet').hidden = true; };
window.addEventListener('ws-signout', () => { save('token', ''); save('mode', ''); disconnect(); void fb.out(); showSignin('Signed out.'); });
window.addEventListener('ws-server', (e) => { const a = setServer(String((e as CustomEvent).detail)); disconnect(); ready = false; if (load<string>('mode', '') === 'fb') connect(a, async () => 'fb:' + (await fb.idToken())); else connect(a, token()); });
document.addEventListener('visibilitychange', () => { if (!document.hidden && cur?.refresh) void Promise.resolve(cur.refresh()).catch(() => {}); });

const addr = serverAddress(), tok = token();
showSignin(addr && (tok || load<string>('mode', '') === 'fb') ? 'Connecting…' : '');
// Sign-in with Firebase only when the project's web config is published (docs/panel/firebase.json).
void fb.config().then(async (c) => {
  $('sFb').hidden = !c;
  if (!c) { ($('sTokBox') as HTMLDetailsElement).open = true; $('sTokBox').querySelector('summary')!.hidden = true; }
  if (c && load<string>('mode', '') === 'fb' && addr) {
    const u = await fb.current().catch(() => null);
    if (u) { void fbConnect(u); return; }
    $('sMsg').textContent = '';
  }
  if (addr && tok && load<string>('mode', 'token') !== 'fb') connect(addr, tok);
});
