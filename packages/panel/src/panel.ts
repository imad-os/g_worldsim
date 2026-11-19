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

// ------------------------------------------------------------ people (milestone 5)
type Person = { id: number; alive: boolean; name: string; sex?: string; age: number; map: string | null; x: number; y: number; act: number;
  hunger: number; thirst: number; tired: number; lonely: number; hp: number; carry: number; talkingTo: string | null };
const ACTS = ['standing', 'walking around', 'getting water', 'eating', 'looking for food', 'sleeping', 'talking', 'travelling', 'resting', 'running away'];
const names = new Map<number, string>();
let openId = -1; // -1 = nobody open (0 is a real id)
let lastChatId = -1;
type Mind = { notes: { at: number; text: string }[]; summary: string; mood: string; plan?: { act: string; with?: number; why: string; until: number }; said?: { text: string } };
const bar = (lack: number, good = false) => {
  const v = good ? lack : 100 - lack; // bars show how fine they are
  const col = v > 60 ? 'var(--ok)' : v > 30 ? 'var(--warn)' : 'var(--bad)';
  return `<span class="bar" title="${Math.round(v)}%"><i style="width:${Math.max(3, v)}%;background:${col}"></i></span>`;
};
async function refreshPeople(): Promise<void> {
  try {
    const list = (await cmd({ cmd: 'agents' })) as Person[];
    for (const p of list) names.set(p.id, p.name);
    $('people').innerHTML = list.length ? list.map((p) => `<div class="row person" data-id="${p.id}"><div><b>${esc(p.name)}</b> <span class="dim">${p.sex === 'f' ? '♀' : '♂'} ${p.age} · ${esc(ACTS[p.act] ?? '')}${p.talkingTo ? ' with ' + esc(p.talkingTo) : ''} · ${esc(p.map ?? 'on the road')}</span></div>
      <div class="dim">food ${bar(p.hunger)} water ${bar(p.thirst)} rest ${bar(p.tired)} hp ${bar(p.hp, true)}</div></div>`).join('') : '<p class="dim">Nobody is alive.</p>';
    for (const r of $('people').querySelectorAll<HTMLElement>('[data-id]')) r.onclick = () => void openPerson(Number(r.dataset.id));
  } catch (e) { log(String(e)); }
}
async function openPerson(id: number): Promise<void> {
  openId = id;
  try {
    const d = (await cmd({ cmd: 'agent', id })) as Person & { now: number; profile: { traits: Record<string, number>; personality: string[]; generation: number }; family: { parents: string[]; children: string[]; partner: string | null }; events: { at: number; kind: string; data: Record<string, unknown> }[] };
    $('personCard').hidden = false;
    $('pName').textContent = d.name;
    $('pSum').textContent = d.alive ? `${d.sex === 'f' ? 'Woman' : 'Man'}, ${Math.floor(d.age)} · ${ACTS[d.act] ?? ''} · ${d.map} (${d.x}, ${d.y}) · carries ${d.carry} food · ${d.profile.personality.join(', ')}` : 'Dead';
    const f = (k: string, v: number | string, step = '1') => `<label>${k}<input data-k="${k}" value="${v}" ${typeof v === 'number' ? `type="number" step="${step}"` : ''}></label>`;
    $('pEdit').innerHTML = d.alive ? [f('name', d.name), f('personality', d.profile.personality.join(', ')),
      f('hunger', d.hunger), f('thirst', d.thirst), f('tired', d.tired), f('lonely', d.lonely), f('hp', d.hp), f('carry', d.carry),
      ...Object.entries(d.profile.traits).map(([k, v]) => f(k, Math.round(v * 100) / 100, k === 'lifespan' ? '1' : '0.05'))].join('') : '';
    const mind = (d.profile as { mind?: Mind }).mind;
    $('pMind').innerHTML = !mind ? 'The AI has not thought for them yet (turn on an AI provider below).' : [
      `<div>Mood: <b>${esc(mind.mood)}</b>${mind.plan && mind.plan.until > d.now ? ` · Wants to <b>${esc(mind.plan.act)}${mind.plan.with ? ' with ' + esc(who(mind.plan.with)) : ''}</b>${mind.plan.why ? ' (' + esc(mind.plan.why) + ')' : ''}` : ''}</div>`,
      mind.said ? `<div>Last said: “${esc(mind.said.text)}”</div>` : '',
      `<div>Memory: ${esc(mind.summary || 'nothing yet')}</div>`,
      mind.notes.length ? `<div>Recent: ${mind.notes.slice(-6).reverse().map((n) => `${gameTime(n.at)} ${esc(n.text)}`).join(' · ')}</div>` : '',
    ].join('');
    if (openId !== lastChatId) { $('pChat').innerHTML = ''; lastChatId = openId; }
    $('pFam').textContent = `Partner: ${d.family.partner ?? 'none'} · Parents: ${d.family.parents.join(', ') || 'unknown (first survivors)'} · Children: ${d.family.children.join(', ') || 'none'} · Generation ${d.profile.generation}`;
    $('pEv').innerHTML = d.events.map((e) => `<div class="ev">${gameTime(e.at)} · ${esc(describe(e))}</div>`).join('') || '<p class="dim">Nothing yet.</p>';
    $('personCard').scrollIntoView({ behavior: 'smooth' });
  } catch (e) { log(String(e)); }
}
const gameTime = (s: number) => { const h = s / 3600 + 8; return `day ${Math.floor(h / 24) + 1} ${String(Math.floor(h % 24)).padStart(2, '0')}:${String(Math.floor((s / 60) % 60)).padStart(2, '0')}`; };
const who = (id: unknown) => names.get(Number(id)) ?? `#${Number(id) & 0xffff}`;
function describe(e: { kind: string; data: Record<string, unknown> }): string {
  const d = e.data;
  switch (e.kind) {
    case 'talk': return `${who(d.a)} talked with ${who(d.b)}`;
    case 'death': return `${who(d.id)} died (${d.cause})`;
    case 'spawn': return `${who(d.id)} arrived in ${d.map}`;
    case 'remove': return `${who(d.id)} left the world (${d.cause})`;
    case 'travel': return `${who(d.id)} set off from ${d.from} to ${d.to}`;
    case 'arrive': return `${who(d.id)} arrived in ${d.map}`;
    case 'supply': return `Supply drop: ${d.n} food in ${d.map}`;
    case 'birth': return `${who(d.id)} was born (${who(d.mother)} and ${who(d.father)})`;
    case 'partner': return `${who(d.a)} and ${who(d.b)} became partners`;
    case 'admin': return `Panel: ${d.cmd}`;
    case 'say': return `${who(d.id)}: “${d.text}”`;
    default: return `${e.kind} ${JSON.stringify(d)}`;
  }
}
async function refreshTimeline(): Promise<void> {
  try {
    const list = (await cmd({ cmd: 'timeline', limit: 60 })) as { at: number; kind: string; data: Record<string, unknown> }[];
    $('timeline').innerHTML = list.filter((e) => e.kind !== 'admin').slice(0, 30).map((e) => `<div class="ev">${gameTime(e.at)} · ${esc(describe(e))}</div>`).join('') || '<p class="dim">Nothing yet.</p>';
  } catch (e) { log(String(e)); }
}

let travelOpen = false;
let statsN = 0;
function showTravel(open: boolean): void {
  travelOpen = open;
  $('travelState').textContent = open ? 'Open: people may go to every map.' : 'Closed: people stay on the map they are on (players can still travel).';
  $('travelBtn').textContent = open ? 'Close travel' : 'Open travel';
}

type AiStatus = { provider: string; model: string; auto?: boolean; ollamaUrl: string; ready: boolean; why?: string; callsLastHour: number; maxCallsPerHour: number; lastMs: number; lastError: string };
function showAi(s: AiStatus, fill: boolean): void {
  $('aiState').textContent = s.provider === 'none' ? 'Off: people use the built-in brain.'
    : `${s.provider} · ${s.model}${s.auto ? ' (fastest, picked automatically)' : ''} · ${s.ready ? 'ready' : s.why ?? 'not ready'} · ${s.callsLastHour}/${s.maxCallsPerHour} calls this hour${s.lastError ? ' · last error: ' + s.lastError : ''}`;
  if (fill) {
    ($('aiProv') as HTMLSelectElement).value = s.provider;
    ($('aiUrl') as HTMLInputElement).value = s.ollamaUrl;
    ($('aiModel') as HTMLInputElement).value = s.provider === 'none' || s.auto ? '' : s.model;
  }
  $('aiUrlRow').hidden = ($('aiProv') as HTMLSelectElement).value !== 'ollama';
}
async function refreshAi(): Promise<void> { try { showAi((await cmd({ cmd: 'ai' })) as AiStatus, true); void refreshPlanner(true); } catch (e) { log(String(e)); } }

type PlannerStatus = { on: boolean; everyGameHours: number; batch: number; minGapSec: number; busy: boolean; counts: { batches: number; plans: number; chats: number; failures: number; builtIn: number } };
function showPlanner(p: PlannerStatus, fill: boolean): void {
  $('plState').textContent = `${p.on ? 'On' : 'Off'}${p.busy ? ' · thinking now' : ''} · ${p.counts.batches} requests, ${p.counts.plans} plans, ${p.counts.chats} chats (${p.counts.builtIn} without AI), ${p.counts.failures} failures`;
  if (fill) {
    ($('plOn') as HTMLInputElement).checked = p.on;
    ($('plEvery') as HTMLInputElement).value = String(p.everyGameHours);
    ($('plBatch') as HTMLInputElement).value = String(p.batch);
    ($('plGap') as HTMLInputElement).value = String(p.minGapSec);
  }
}
async function refreshPlanner(fill = false): Promise<void> {
  try { const r = (await cmd({ cmd: 'aiLog' })) as { planner: PlannerStatus }; showPlanner(r.planner, fill); } catch (e) { log(String(e)); }
}
function addChat(name: string, text: string): void {
  const div = document.createElement('div');
  div.className = 'ev';
  div.innerHTML = `<b>${esc(name)}</b>: ${esc(text)}`;
  $('pChat').appendChild(div);
  while ($('pChat').children.length > 12) $('pChat').firstElementChild!.remove();
}

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
        void refreshPairings(); void refreshPlayers(); void refreshAi(); void refreshPeople().then(refreshTimeline);
        break;
      case Msg.Error:
        if (m.code === 'auth' || m.code === 'locked') { store(null); showLogin(m.code === 'locked' ? 'Too many wrong tokens: wait 10 minutes.' : 'Wrong token.'); }
        else log('error ' + m.code);
        break;
      case Msg.Notice:
        if (m.kind === 'pairing') { log('A TV wants to watch: approve it below'); void refreshPairings(); try { navigator.vibrate?.(200); } catch { /* */ } }
        if (m.kind === 'paired') void refreshPlayers();
        if (m.kind === 'say') { const d = m.data as { id: number; name: string; text: string }; log(`${d.name}: “${d.text}”`); if (d.id === openId) addChat(d.name, d.text); }
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
        if (s.difficulty !== undefined && document.activeElement !== $('diff')) { ($('diff') as HTMLInputElement).value = String(s.difficulty); $('diffV').textContent = String(s.difficulty); }
        if (++statsN % 3 === 0) { void refreshPeople(); if (statsN % 15 === 0) { void refreshTimeline(); void refreshPlanner(); } }
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
    <p><b>Model</b> = a name from "List models", for example <code>qwen3:1.7b</code>. Leave it empty and the server uses the smallest installed model, the fastest.</p>`;
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
$('pTalk').onclick = async () => {
  const inp = $('pSay') as HTMLInputElement, text = inp.value.trim();
  if (!text || openId < 0) return;
  inp.value = '';
  addChat('You', text);
  const b = $('pTalk') as HTMLButtonElement;
  b.disabled = true;
  try { const r = (await cmd({ cmd: 'chat', id: openId, text })) as { reply: string; ai: boolean }; if (!r.ai) addChat('', '(answered without AI: turn on Gemini or Ollama in the AI brain card)'); void openPerson(openId); } catch (e) { addChat('', String(e)); }
  b.disabled = false;
};
($('pSay') as HTMLInputElement).onkeydown = (e) => { if (e.key === 'Enter') $('pTalk').click(); };
$('pPlan').onclick = async () => {
  const b = $('pPlan') as HTMLButtonElement;
  b.disabled = true; b.textContent = 'Thinking...';
  try { await cmd({ cmd: 'planNow', id: openId }); void openPerson(openId); } catch (e) { addChat('', String(e)); }
  b.disabled = false; b.textContent = 'Plan now';
};
$('plSave').onclick = async () => {
  try {
    const r = (await cmd({ cmd: 'planner', on: ($('plOn') as HTMLInputElement).checked, everyGameHours: Number(($('plEvery') as HTMLInputElement).value), batch: Number(($('plBatch') as HTMLInputElement).value), minGapSec: Number(($('plGap') as HTMLInputElement).value) })) as PlannerStatus;
    showPlanner(r, true); log('planner saved');
  } catch (e) { log(String(e)); }
};
$('plLog').onclick = async () => {
  try {
    const r = (await cmd({ cmd: 'aiLog' })) as { planner: PlannerStatus; log: { at: number; kind: string; who: string; prompt: string; reply: string; ms: number; err?: string }[] };
    showPlanner(r.planner, false);
    $('plOut').innerHTML = r.log.length ? r.log.map((x) => `<details class="ev"><summary>${new Date(x.at).toLocaleTimeString()} · ${x.kind} · ${esc(x.who)} · ${x.err ? '<span style="color:var(--bad)">' + esc(x.err) + '</span>' : (x.ms / 1000).toFixed(1) + ' s'}</summary><b>Asked</b><pre>${esc(x.prompt)}</pre><b>Answer</b><pre>${esc(x.reply || '-')}</pre></details>`).join('') : '<p class="dim">No request yet.</p>';
  } catch (e) { log(String(e)); }
};
$('pClose').onclick = () => { $('personCard').hidden = true; openId = -1; };
$('pSave').onclick = async () => {
  const set: Record<string, number | string> = {};
  for (const i of $('pEdit').querySelectorAll<HTMLInputElement>('input')) set[i.dataset.k!] = i.type === 'number' ? Number(i.value) : i.value;
  try { await cmd({ cmd: 'agentSet', id: openId, set }); log('saved'); void openPerson(openId); void refreshPeople(); } catch (e) { log(String(e)); }
};
$('pMove').onclick = async () => { try { await cmd({ cmd: 'agentMove', id: openId, map: 'town' }); void openPerson(openId); } catch (e) { log(String(e)); } };
$('pKill').onclick = async () => {
  if (!confirm(`Kill ${$('pName').textContent}? This can't be undone.`)) return;
  try { await cmd({ cmd: 'kill', id: openId }); log(`${$('pName').textContent} was killed`); $('personCard').hidden = true; void refreshPeople(); } catch (e) { log(String(e)); }
};
$('addPerson').onclick = async () => {
  try { await cmd({ cmd: 'spawn', map: 'town', x: 128, y: 128 }); log('a new person arrived in Old Town'); void refreshPeople(); } catch (e) { log(String(e)); }
};
($('diff') as HTMLInputElement).oninput = () => { $('diffV').textContent = ($('diff') as HTMLInputElement).value; };
($('diff') as HTMLInputElement).onchange = async () => { try { await cmd({ cmd: 'difficulty', value: Number(($('diff') as HTMLInputElement).value) }); log('difficulty changed'); } catch (e) { log(String(e)); } };
$('supply').onclick = async () => { try { const r = (await cmd({ cmd: 'supply', map: ($('supMap') as HTMLSelectElement).value })) as { n: number }; log(`supply drop: ${r.n} food`); void refreshTimeline(); } catch (e) { log(String(e)); } };
$('tlMore').onclick = () => void refreshTimeline();
for (const b of document.querySelectorAll<HTMLButtonElement>('[data-speed]')) b.onclick = () => void cmd({ cmd: 'speed', speed: Number(b.dataset.speed) });
const saved = stored();
if (saved) connect(saved); else showLogin();
