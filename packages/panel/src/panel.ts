import { Msg, type ServerMsg, type AdminCmd } from '@worldsim/protocol';
import { Conn } from '../../client/src/conn.js';

/**
 * Control panel (first version; milestone 5 adds the rest): login once (kept on this device), approve TVs that
 * want to watch, players, internet link, time speed, live server stats. Works on a phone.
 */
const $ = (id: string) => document.getElementById(id)!;
const KEY = 'worldsim_admin';
let conn: Conn | null = null;
let nextId = 1;
let providerShown = false;
const waiting = new Map<number, (ok: boolean, data: unknown, err?: string) => void>();

function store(v: string | null): void {
  try { if (v) localStorage.setItem(KEY, v); else localStorage.removeItem(KEY); } catch { /* private mode */ }
}
function stored(): string { try { return localStorage.getItem(KEY) ?? ''; } catch { return ''; } }

function log(s: string): void {
  const el = $('log');
  el.textContent = `${new Date().toLocaleTimeString()}  ${s}\n${el.textContent!.slice(0, 4000)}`;
}

function cmd(c: AdminCmd): Promise<unknown> {
  return new Promise((ok, fail) => {
    const id = nextId++;
    waiting.set(id, (good, data, err) => (good ? ok(data) : fail(new Error(err))));
    conn?.send({ t: Msg.Admin, id, c });
  });
}

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
const ago = (t: number) => {
  if (!t) return '-';
  const s = Math.round((Date.now() - t) / 1000);
  return s < 60 ? `${s} s ago` : s < 3600 ? `${Math.round(s / 60)} min ago` : s < 86400 ? `${Math.round(s / 3600)} h ago` : new Date(t).toLocaleDateString();
};

async function refreshPairings(): Promise<void> {
  const list = (await cmd({ cmd: 'pairings' })) as { code: string; name: string; dev: string; at: number }[];
  const el = $('pairs');
  $('pairsCard').classList.toggle('alert', list.length > 0);
  if (!list.length) { el.innerHTML = '<p class="dim">No TV is waiting. Open the app on a TV: it shows a 6-digit code here.</p>'; return; }
  el.innerHTML = list.map((p) => `<div class="row"><div><b class="code">${esc(p.code)}</b><br><span class="dim">${esc(p.name)} · ${esc(p.dev || 'device')} · ${ago(p.at)}</span></div>
    <div><input data-name="${p.code}" value="${esc(p.name)}" aria-label="Player name"><button data-ok="${p.code}" class="primary">Approve</button><button data-no="${p.code}">Deny</button></div></div>`).join('');
  for (const b of el.querySelectorAll<HTMLButtonElement>('[data-ok]')) b.onclick = async () => {
    const name = (el.querySelector(`[data-name="${b.dataset.ok}"]`) as HTMLInputElement).value;
    try { const r = (await cmd({ cmd: 'approve', code: b.dataset.ok!, name })) as { name: string }; log(`TV approved as ${r.name}`); } catch (e) { log(String(e)); }
    void refreshPairings(); void refreshPlayers();
  };
  for (const b of el.querySelectorAll<HTMLButtonElement>('[data-no]')) b.onclick = async () => { await cmd({ cmd: 'deny', code: b.dataset.no! }); void refreshPairings(); };
}

let travelOpen = false;
function showTravel(open: boolean): void {
  travelOpen = open;
  $('travelState').textContent = open ? 'Open: people may go to every map.' : 'Closed: people stay on the map they are on (players can still travel).';
  $('travelBtn').textContent = open ? 'Close travel' : 'Open travel';
}

type AiStatus = { provider: string; model: string; ollamaUrl: string; ready: boolean; why?: string; callsLastHour: number; maxCallsPerHour: number; lastMs: number; lastError: string };
function showAi(s: AiStatus, fill: boolean): void {
  $('aiState').textContent = s.provider === 'none' ? 'Off: people use the built-in brain.'
    : `${s.provider} · ${s.model} · ${s.ready ? 'ready' : s.why ?? 'not ready'} · ${s.callsLastHour}/${s.maxCallsPerHour} calls this hour${s.lastError ? ' · last error: ' + s.lastError : ''}`;
  if (fill) {
    ($('aiProv') as HTMLSelectElement).value = s.provider;
    ($('aiUrl') as HTMLInputElement).value = s.ollamaUrl;
    ($('aiModel') as HTMLInputElement).value = s.provider === 'none' ? '' : s.model;
  }
  $('aiUrlRow').hidden = ($('aiProv') as HTMLSelectElement).value !== 'ollama';
}
async function refreshAi(): Promise<void> { try { showAi((await cmd({ cmd: 'ai' })) as AiStatus, true); } catch (e) { log(String(e)); } }

async function refreshPlayers(): Promise<void> {
  const list = (await cmd({ cmd: 'players' })) as { name: string; dev: string; created: number; lastSeen: number; fromEnv: boolean }[];
  $('players').innerHTML = list.length ? list.map((p) => `<div class="row"><div><b>${esc(p.name)}</b><br><span class="dim">${esc(p.dev)} · last seen ${ago(p.lastSeen)}</span></div>
    <div>${p.fromEnv ? '<span class="dim">.env</span>' : `<button data-rm="${esc(p.name)}">Remove</button>`}</div></div>`).join('') : '<p class="dim">No players yet.</p>';
  for (const b of $('players').querySelectorAll<HTMLButtonElement>('[data-rm]')) b.onclick = async () => {
    if (!confirm(`Remove ${b.dataset.rm}? That TV will have to pair again.`)) return;
    try { await cmd({ cmd: 'revoke', name: b.dataset.rm! }); log(`removed ${b.dataset.rm}`); } catch (e) { log(String(e)); }
    void refreshPlayers();
  };
}

function connect(token: string): void {
  conn?.close();
  const proto = location.protocol === 'https:' ? 'wss:' : 'ws:';
  conn = new Conn(`${proto}//${location.host}/ws`, token, 'panel');
  conn.onState = (s, why) => {
    $('state').textContent = s === 'open' ? 'connected' : s + (why ? ` (${why})` : '');
    $('state').className = s === 'open' ? 'ok' : 'bad';
  };
  conn.onMsg = (m: ServerMsg) => {
    switch (m.t) {
      case Msg.Welcome:
        if (m.role !== 'admin') { log('That is a viewer token, not the admin token.'); conn?.close(); store(null); showLogin(); return; }
        store(token);
        $('login').hidden = true; $('main').hidden = false;
        void refreshPairings(); void refreshPlayers(); void refreshAi();
        break;
      case Msg.Error:
        if (m.code === 'auth' || m.code === 'locked') { store(null); showLogin(m.code === 'locked' ? 'Too many wrong tokens: wait 10 minutes.' : 'Wrong token.'); }
        else log('error ' + m.code);
        break;
      case Msg.Notice:
        if (m.kind === 'pairing') { log('A TV wants to watch: approve it below'); void refreshPairings(); try { navigator.vibrate?.(200); } catch { /* */ } }
        if (m.kind === 'paired') void refreshPlayers();
        if (m.kind === 'url') log(`Internet link changed: ${(m.data as { url: string }).url}`);
        break;
      case Msg.AdminResult: {
        const w = waiting.get(m.id);
        if (w) { waiting.delete(m.id); w(m.ok, m.data, m.err); }
        break;
      }
      case Msg.Stats: {
        const s = m.s;
        $('time').textContent = s.paused ? 'Paused' : `Speed x${s.speed}${s.effSpeed && Math.abs(s.effSpeed - s.speed) > 0.5 ? ` (running x${s.effSpeed.toFixed(1)})` : ''}`;
        $('stats').textContent = [
          `tick ${s.tick} · ${s.tps.toFixed(0)} ticks/s`,
          `tick time ${s.tickMsAvg.toFixed(2)} ms (p95 ${s.tickMsP95.toFixed(2)}, max ${s.tickMsMax.toFixed(1)})`,
          `RAM ${s.rssMb.toFixed(0)} MB · CPU ${s.cpuPct.toFixed(0)} %`,
          `agents ${s.agents} · entities ${s.entities} · viewers ${s.clients - 1}`,
          `snapshot ${s.lastSnapshotAt ? ago(s.lastSnapshotAt) : '-'} · up ${Math.round(s.uptimeSec / 60)} min`,
        ].join('\n');
        if (s.travelOpen !== undefined && s.travelOpen !== travelOpen) showTravel(s.travelOpen);
        else if ($('travelBtn').textContent === '-') showTravel(!!s.travelOpen);
        const t = s.tunnel;
        if (t) {
          $('url').innerHTML = t.url ? `<a href="${esc(t.url)}/panel/">${esc(t.url)}</a>` : `<span class="dim">${t.provider === 'none' ? 'Only on this PC (no tunnel)' : esc(t.state + (t.error ? ': ' + t.error : ''))}</span>`;
          $('tunnelState').textContent = `${t.provider} · ${t.state}`;
          if (!providerShown) { (document.getElementById('provider') as HTMLSelectElement).value = t.provider; providerShown = true; }
        }
        break;
      }
    }
  };
  conn.open();
}

function showLogin(msg = ''): void {
  $('login').hidden = false; $('main').hidden = true; $('loginMsg').textContent = msg;
}

$('go').onclick = () => { const t = ($('token') as HTMLInputElement).value.trim(); if (t) connect(t); };
($('token') as HTMLInputElement).onkeydown = (e) => { if (e.key === 'Enter') $('go').click(); };
$('logout').onclick = () => { store(null); conn?.close(); showLogin(); };
$('pause').onclick = () => void cmd({ cmd: 'pause', paused: true });
$('resume').onclick = () => void cmd({ cmd: 'pause', paused: false });
$('snap').onclick = async () => { await cmd({ cmd: 'snapshot' }); log('snapshot saved'); };
$('switch').onclick = async () => {
  const p = ($('provider') as HTMLSelectElement).value as 'ngrok';
  log(`switching the internet link to ${p}...`);
  try { const st = (await cmd({ cmd: 'tunnelSwitch', provider: p })) as { url: string }; log(`link: ${st.url || 'off'}`); } catch (e) { log(String(e)); }
};
$('travelBtn').onclick = async () => {
  const open = !travelOpen;
  if (open && !confirm('Open travel? People may walk to the other maps.')) return;
  try { const r = (await cmd({ cmd: 'travel', open })) as { open: boolean }; showTravel(r.open); log(r.open ? 'travel opened' : 'travel closed'); } catch (e) { log(String(e)); }
};
($('aiProv') as HTMLSelectElement).onchange = () => { $('aiUrlRow').hidden = ($('aiProv') as HTMLSelectElement).value !== 'ollama'; ($('aiModel') as HTMLInputElement).value = ''; };
$('aiSave').onclick = async () => {
  const provider = ($('aiProv') as HTMLSelectElement).value as 'none';
  try {
    const s = (await cmd({ cmd: 'aiSet', provider, model: ($('aiModel') as HTMLInputElement).value.trim(), ollamaUrl: ($('aiUrl') as HTMLInputElement).value.trim() || undefined })) as AiStatus;
    showAi(s, true); log(`AI: ${s.provider} ${s.model}`);
  } catch (e) { log(String(e)); $('aiOut').textContent = String(e); }
};
/** List and Test use what is typed in the form: save it first. */
async function saveForm(): Promise<boolean> {
  const provider = ($('aiProv') as HTMLSelectElement).value as 'none';
  try {
    const s = (await cmd({ cmd: 'aiSet', provider, model: ($('aiModel') as HTMLInputElement).value.trim(), ollamaUrl: ($('aiUrl') as HTMLInputElement).value.trim() || undefined })) as AiStatus;
    showAi(s, false); ($('aiUrl') as HTMLInputElement).value = s.ollamaUrl; return true;
  } catch (e) { $('aiOut').textContent = String(e); return false; }
}
function helpText(): void {
  const base = (($('aiUrl') as HTMLInputElement).value.trim() || 'http://127.0.0.1:11434').replace(/\/+$/, '').replace(/\/(api\/(tags|chat|generate)|api|v1)$/i, '');
  const model = ($('aiModel') as HTMLInputElement).value.trim() || 'llama3.2';
  $('aiHelp').innerHTML = `<p><b>Ollama address</b> = the base address only, without /api. Examples: <code>http://192.168.1.20:11434</code>, <code>https://dom.com</code>.</p>
    <p>The <b>world server</b> (your PC), not this phone, calls:<br>
    list models: <code>GET ${esc(base)}/api/tags</code><br>
    talk: <code>POST ${esc(base)}/api/chat</code> with <code>{"model": "${esc(model)}", "messages": [...], "stream": false}</code></p>
    <p>So the address must work from the PC that runs the server. <code>127.0.0.1</code> means that PC itself.
    If your Ollama needs a key (ollama.com or a proxy), put <code>OLLAMA_API_KEY=...</code> in the server's .env: it is sent as <code>Authorization: Bearer</code>.</p>
    <p><b>Model</b> = a name from "List models", for example <code>llama3.2:3b</code> or <code>qwen3:4b</code>.</p>`;
}
$('aiHelpBtn').onclick = () => { helpText(); $('aiHelp').hidden = !$('aiHelp').hidden; };
($('aiUrl') as HTMLInputElement).oninput = () => { if (!$('aiHelp').hidden) helpText(); };
($('aiModel') as HTMLInputElement).oninput = () => { if (!$('aiHelp').hidden) helpText(); };
$('aiList').onclick = async () => {
  $('aiOut').textContent = 'Asking for the models...';
  if (!(await saveForm())) return;
  try {
    const list = (await cmd({ cmd: 'aiModels' })) as string[];
    $('aiModelList').innerHTML = list.map((m) => `<option value="${esc(m)}">`).join('');
    $('aiOut').textContent = list.length ? `Models: ${list.join(', ')}` : 'No models found.';
  } catch (e) { $('aiOut').textContent = String(e); }
};
$('aiTest').onclick = async () => {
  $('aiOut').textContent = 'Asking the model...';
  if (!(await saveForm())) return;
  try { const r = (await cmd({ cmd: 'aiTest' })) as { text: string; ms: number; model: string }; $('aiOut').textContent = `${r.model} (${(r.ms / 1000).toFixed(1)} s): ${r.text}`; } catch (e) { $('aiOut').textContent = String(e); }
  void refreshAi();
};
for (const b of document.querySelectorAll<HTMLButtonElement>('[data-speed]')) b.onclick = () => void cmd({ cmd: 'speed', speed: Number(b.dataset.speed) });
const saved = stored();
if (saved) connect(saved); else showLogin();
