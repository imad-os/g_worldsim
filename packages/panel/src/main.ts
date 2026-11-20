import type { ServerStats } from '@worldsim/protocol';
import { connect, disconnect, listeners, serverAddress, setServer, token, onServer, stats } from './api.js';
import { dashboard } from './dashboard.js';
import { help, showHelp, closeHelp } from './help.js';
import { peopleScreen, personScreen, personSaid } from './people.js';
import { view, type Screen } from './screen.js';
import { world, zombies, crafting, rules, ai, players, events, server, settings, applyLook } from './screens.js';
import { S } from './state.js';
import { $, esc, gameTime, hourOf, icon, load, save, toast } from './util.js';

/**
 * World control panel 2 (imad 2026-11-20: "advanced, informative, '?' guides, responsive, a dashboard, a screen for
 * each kind of thing, hosted on GitHub"). One page, hash routes, a side menu on wide screens and a bottom bar on phones.
 */
const ROUTES: Record<string, Screen> = { dashboard, people: peopleScreen, person: personScreen, world, zombies, crafting, rules, ai, players, events, server, settings };
const NAV = ['dashboard', 'people', 'world', 'zombies', 'crafting', 'rules', 'ai', 'players', 'events', 'server', 'settings'];
const BOTTOM = ['dashboard', 'people', 'world', 'events'];

let cur: Screen | null = null, curKey = '', timer = 0, ready = false;

function navHtml(): string {
  return NAV.map((k) => { const s = ROUTES[k]!; return `<a href="#/${k}" data-nav="${k}">${icon(s.icon)}<span>${s.title}</span><b class="badge" data-badge="${k}" hidden></b></a>`; }).join('');
}

function route(): void {
  if (!ready) return;
  const [, key = 'dashboard', arg = ''] = location.hash.split('/');
  const s = ROUTES[key] ?? dashboard;
  cur?.leave?.();
  clearInterval(timer);
  closeHelp();
  cur = s; curKey = ROUTES[key] ? key : 'dashboard';
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
setInterval(() => { if (ready && !document.hidden) void import('./state.js').then((m) => m.overview()).catch(() => {}); }, 5000);

function showSignin(msg = ''): void {
  ready = false;
  $('app').hidden = true; $('signin').hidden = false;
  ($('sAddrIn') as HTMLInputElement).value = serverAddress();
  ($('sAddrIn') as HTMLInputElement).disabled = onServer;
  $('sMsg').textContent = msg;
}
function signIn(): void {
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
  $('srv').textContent = serverAddress().replace(/^https?:\/\//, '');
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
  <label class="fld">Admin token ${help('token')}<input id="sTokIn" type="password" autocomplete="current-password" placeholder="ADMIN_TOKEN from the server .env"></label>
  <button class="btn primary wide" id="sGo">Sign in</button><p id="sMsg" class="si-msg"></p>
  <p class="dim small">This device remembers both. The panel can be opened from anywhere: it talks to your server directly.</p></div></div>
<div id="app" class="app" hidden>
  <aside class="side"><div class="brand">${icon('world')}<span>World<small id="srv"></small></span></div><nav class="nav">${navHtml()}</nav>
    <div class="side-f"><span id="conn" class="conn"></span> <span class="dim small">${onServer ? 'on the server' : 'from GitHub'}</span></div></aside>
  <div class="main"><header class="top"><button class="iconbtn only-m" id="menuBtn" aria-label="Menu">${icon('more')}</button><h1 id="title"></h1>
    <div class="top-r"><span id="clock" class="clock"></span><button class="iconbtn" id="pauseBtn" aria-label="Pause or resume"></button></div></header>
    <main id="view" class="view"></main></div>
  <nav class="bottom">${BOTTOM.map((k) => `<a href="#/${k}" data-nav="${k}">${icon(ROUTES[k]!.icon)}<span>${ROUTES[k]!.title.split(' ')[0]}</span></a>`).join('')}<button id="moreBtn">${icon('more')}<span>More</span><b class="badge" data-badge="more" hidden></b></button></nav>
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
($('sTokIn') as HTMLInputElement).onkeydown = (e) => { if (e.key === 'Enter') signIn(); };
($('sAddrIn') as HTMLInputElement).onkeydown = (e) => { if (e.key === 'Enter') ($('sTokIn') as HTMLInputElement).focus(); };
$('pauseBtn').onclick = () => void import('./api.js').then((m) => m.cmd({ cmd: 'pause', paused: !stats?.paused })).catch((e) => toast(String(e), 'err'));
const openSheet = () => { $('sheet').hidden = false; };
$('menuBtn').onclick = openSheet; $('moreBtn').onclick = openSheet;
$('sheetX').onclick = () => { $('sheet').hidden = true; };
$('sheet').onclick = (e) => { if (e.target === $('sheet')) $('sheet').hidden = true; };
window.addEventListener('ws-signout', () => { save('token', ''); disconnect(); showSignin('Signed out.'); });
window.addEventListener('ws-server', (e) => { const a = setServer(String((e as CustomEvent).detail)); disconnect(); ready = false; connect(a, token()); });
document.addEventListener('visibilitychange', () => { if (!document.hidden && cur?.refresh) void Promise.resolve(cur.refresh()).catch(() => {}); });

const addr = serverAddress(), tok = token();
if (addr && tok) { showSignin('Connecting…'); connect(addr, tok); } else showSignin();
