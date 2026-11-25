import { help } from './help.js';
import { card, on, setHtml, val, type Screen } from './screen.js';
import { ago, esc, icon, load, save, toast } from './util.js';

/**
 * To-do list for Claude (imad 2026-11-25: "a tab with a to-do list for you to fix or implement; check it every hour, do the list and mark
 * it done with a response"). The panel runs on the PC, which Claude in the cloud can't reach, so the list lives where both can: GitHub
 * issues of this repo with the label `claude-todo`, opened with the owner's own GitHub token (kept only in this browser). Every hour
 * Claude takes the open ones written by the owner, does them, pushes to main, answers in a comment and closes the issue. Labels:
 * `claude-doing` (Claude is on it), `claude-question` (Claude needs an answer: reply here, it is picked up next hour).
 */
const REPO = 'imad-os/g_worldsim';
const API = `https://api.github.com/repos/${REPO}`;
export const TODO_LABEL = 'claude-todo';

interface Label { name: string }
interface Issue { number: number; title: string; body: string | null; state: 'open' | 'closed'; state_reason: string | null; labels: Label[]; comments: number; created_at: string; closed_at: string | null; html_url: string; user: { login: string }; pull_request?: unknown }
interface Comment { id: number; body: string; created_at: string; user: { login: string } }

let show: 'open' | 'closed' | 'all' = load('todoShow', 'open');
const comments = new Map<number, Comment[]>();
const opened = new Set<number>();

const token = () => load<string>('ghToken', '');
const err = (e: unknown) => toast(e instanceof Error ? e.message : String(e), 'err');

async function gh<T>(path: string, init: RequestInit = {}): Promise<T> {
  const t = token();
  const r = await fetch(path.startsWith('http') ? path : API + path, {
    ...init,
    cache: 'no-store',
    headers: { Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28', ...(t ? { Authorization: `Bearer ${t}` } : {}), ...(init.body ? { 'Content-Type': 'application/json' } : {}) },
  });
  if (!r.ok) {
    let msg = `GitHub said ${r.status}`;
    try { const j = await r.json() as { message?: string }; if (j.message) msg += `: ${j.message}`; } catch { /* */ }
    if (r.status === 401) msg = 'GitHub refused the token (wrong or expired). Make a new one below.';
    if (r.status === 403 || r.status === 404) msg += t ? ' (does the token have Issues: Read and write on g_worldsim?)' : ' (add your GitHub token below)';
    throw new Error(msg);
  }
  return (r.status === 204 ? null : await r.json()) as T;
}

/** What the item is at now, from its state and labels. */
function status(x: Issue): [string, string] {
  const has = (n: string) => x.labels.some((l) => l.name === n);
  if (x.state === 'closed') return x.state_reason === 'not_planned' ? ['Cancelled', ''] : ['Done', 'ok'];
  if (has('claude-question')) return ['Claude asks you', 'warn'];
  if (has('claude-doing')) return ['Claude is on it', 'info'];
  return ['Waiting for the next hourly check', ''];
}

const md = (s: string) => esc(s).replace(/`([^`\n]+)`/g, '<code>$1</code>').replace(/\*\*([^*\n]+)\*\*/g, '<b>$1</b>')
  .replace(/(https:\/\/[^\s<]+)/g, '<a href="$1" target="_blank" rel="noopener">$1</a>');

function itemHtml(x: Issue): string {
  const [st, cls] = status(x);
  const cs = comments.get(x.number);
  const thread = cs ? cs.map((c) => `<div class="todo-c ${c.user.login === 'imad-os' ? '' : 'claude'}"><div class="dim small">${c.user.login === 'imad-os' ? 'You' : esc(c.user.login)} · ${ago(Date.parse(c.created_at))}</div><div class="todo-t">${md(c.body)}</div></div>`).join('')
    : x.comments ? '<div class="skel"></div>' : '';
  return `<details class="logi todo" data-n="${x.number}"${opened.has(x.number) ? ' open' : ''}><summary><span class="tag ${cls}">${st}</span> <b>${esc(x.title)}</b>
      <span class="dim small">· #${x.number} · added ${ago(Date.parse(x.created_at))}${x.closed_at ? ` · closed ${ago(Date.parse(x.closed_at))}` : ''}${x.comments ? ` · ${x.comments} ${x.comments === 1 ? 'reply' : 'replies'}` : ''}</span></summary>
    ${x.body ? `<div class="todo-c"><div class="todo-t">${md(x.body)}</div></div>` : ''}${thread}
    <div class="row wrap"><textarea data-reply="${x.number}" rows="2" placeholder="${x.state === 'open' ? 'Add details or answer Claude' : 'Not right? Say what is wrong and reopen it'}" style="flex:1;min-width:200px"></textarea></div>
    <div class="row wrap"><button class="btn sm" data-send="${x.number}">${icon('chat')} ${x.state === 'open' ? 'Send' : 'Send and reopen'}</button>
      ${x.state === 'open' ? `<button class="btn sm ghost danger" data-cancel="${x.number}">${icon('x')} Cancel it</button>` : ''}
      <a class="btn sm ghost" href="${esc(x.html_url)}" target="_blank" rel="noopener">Open on GitHub</a></div></details>`;
}

async function loadComments(n: number): Promise<void> {
  try { comments.set(n, await gh<Comment[]>(`/issues/${n}/comments?per_page=100`)); } catch (e) { err(e); comments.set(n, []); }
}

async function list(): Promise<void> {
  try {
    const rows = (await gh<Issue[]>(`/issues?labels=${TODO_LABEL}&state=${show}&per_page=50&sort=created&direction=desc`)).filter((x) => !x.pull_request);
    const open = rows.filter((x) => x.state === 'open').length;
    setHtml('tCount', `${rows.length} ${show === 'open' ? 'open' : show === 'closed' ? 'done or cancelled' : 'items'}${show === 'all' ? ` (${open} open)` : ''}`);
    // Replies: loaded for what is unfolded, and for the newest finished ones (that is where Claude's answer is).
    const want = rows.filter((x) => x.comments && (opened.has(x.number) || (x.state === 'closed' && rows.indexOf(x) < 10)) && (comments.get(x.number)?.length ?? -1) < x.comments);
    await Promise.all(want.map((x) => loadComments(x.number)));
    setHtml('tList', rows.length ? rows.map(itemHtml).join('') : `<div class="empty">${show === 'open' ? 'Nothing waiting. Add something above: Claude looks every hour.' : 'Nothing here yet.'}</div>`);
    bindItems(rows);
  } catch (e) { setHtml('tList', `<div class="empty">${esc(e instanceof Error ? e.message : e)}</div>`); }
}

function bindItems(rows: Issue[]): void {
  for (const d of document.querySelectorAll<HTMLDetailsElement>('#tList details.todo')) {
    d.addEventListener('toggle', () => {
      const n = Number(d.dataset.n), x = rows.find((y) => y.number === n);
      if (d.open) opened.add(n); else opened.delete(n);
      if (d.open && x?.comments && !comments.has(n)) void loadComments(n).then(() => { d.outerHTML = itemHtml(x); bindItems(rows); });
    });
  }
  on('[data-send]', 'click', async (el) => {
    const n = Number(el.dataset.send), x = rows.find((y) => y.number === n);
    const box = document.querySelector<HTMLTextAreaElement>(`[data-reply="${n}"]`), text = box?.value.trim() ?? '';
    if (!text) { toast('Write something first', 'info'); return; }
    try {
      await gh(`/issues/${n}/comments`, { method: 'POST', body: JSON.stringify({ body: text }) });
      if (x?.labels.some((l) => l.name === 'claude-question')) await gh(`/issues/${n}/labels/claude-question`, { method: 'DELETE' }).catch(() => null);
      if (x?.state === 'closed') await gh(`/issues/${n}`, { method: 'PATCH', body: JSON.stringify({ state: 'open' }) });
      comments.delete(n); opened.add(n);
      toast(x?.state === 'closed' ? 'Sent and reopened' : 'Sent', 'ok'); void list();
    } catch (e) { err(e); }
  });
  on('[data-cancel]', 'click', async (el) => {
    if (!confirm('Cancel this item? Claude will not do it.')) return;
    try { await gh(`/issues/${el.dataset.cancel}`, { method: 'PATCH', body: JSON.stringify({ state: 'closed', state_reason: 'not_planned' }) }); toast('Cancelled', 'ok'); void list(); } catch (e) { err(e); }
  });
}

function tokenCard(): string {
  const t = token();
  return `<p class="dim small">The list is kept as GitHub issues of ${REPO} (label <code>${TODO_LABEL}</code>), the one place both this panel and Claude in the cloud can reach.
    Adding needs your GitHub token, kept only in this browser. Make one at <a href="https://github.com/settings/personal-access-tokens/new" target="_blank" rel="noopener">GitHub > Fine-grained tokens</a>:
    Repository access = only g_worldsim, Permissions > Issues = Read and write.</p>
    <div class="row wrap"><input id="tTok" type="password" autocomplete="off" placeholder="${t ? 'Saved: …' + esc(t.slice(-4)) : 'github_pat_…'}" style="flex:1;min-width:200px">
    <button class="btn sm" id="tTokSave">${icon('check')} Save</button>${t ? `<button class="btn sm ghost danger" id="tTokDel">${icon('x')} Forget</button>` : ''}</div>`;
}

export const todoScreen: Screen = {
  title: 'To-do for Claude', icon: 'check', help: 'todo', every: 60,
  render() {
    return `<div class="grid2">${card('Add something for Claude', `<input id="tTitle" placeholder="What to fix or add, in a few words" style="width:100%;margin-bottom:8px">
        <textarea id="tBody" rows="5" placeholder="Details: what you see, what you want, where (optional)" style="width:100%;resize:vertical;margin-bottom:8px"></textarea>
        <div class="row"><button class="btn" id="tAdd">${icon('plus')} Add to the list</button><span class="dim small">Claude checks every hour, does it, pushes it to main and answers here.</span></div>`, { help: help('todoAdd') })}
      ${card('GitHub token', `<div id="tTokBox">${tokenCard()}</div>`, { help: help('todoToken') })}
      ${card('The list', `<div class="row wrap"><select id="tShow"><option value="open"${show === 'open' ? ' selected' : ''}>Waiting / in progress</option><option value="closed"${show === 'closed' ? ' selected' : ''}>Done</option><option value="all"${show === 'all' ? ' selected' : ''}>Everything</option></select>
        <button class="btn sm" id="tGo">${icon('refresh')} Refresh</button><span class="dim small" id="tCount"></span></div>
        <div id="tList" class="feed long"><div class="skel"></div></div>`, { cls: 'span2', help: help('todo') })}</div>`;
  },
  async mount() {
    const bindTok = () => {
      on('#tTokSave', 'click', () => { const t = val('tTok'); if (!t) return; save('ghToken', t); setHtml('tTokBox', tokenCard()); bindTok(); toast('Token saved in this browser', 'ok'); void list(); });
      on('#tTokDel', 'click', () => { save('ghToken', ''); setHtml('tTokBox', tokenCard()); bindTok(); });
    };
    bindTok();
    on('#tShow', 'change', () => { show = val('tShow') as typeof show; save('todoShow', show); void list(); });
    on('#tGo', 'click', () => { comments.clear(); void list(); });
    on('#tAdd', 'click', async (el) => {
      const title = val('tTitle'), body = val('tBody');
      if (!title) { toast('Write what to do first', 'info'); return; }
      if (!token()) { toast('Save your GitHub token first (card on the right)', 'err'); return; }
      (el as HTMLButtonElement).disabled = true;
      try {
        const x = await gh<Issue>('/issues', { method: 'POST', body: JSON.stringify({ title, body: `${body}\n\n<sub>Added from the control panel's To-do tab.</sub>`.trim(), labels: [TODO_LABEL] }) });
        (document.getElementById('tTitle') as HTMLInputElement).value = ''; (document.getElementById('tBody') as HTMLTextAreaElement).value = '';
        toast(`Added (#${x.number}). Claude picks it up within the hour.`, 'ok');
        if (show === 'closed') { show = 'open'; save('todoShow', show); (document.getElementById('tShow') as HTMLSelectElement).value = 'open'; }
        void list();
      } catch (e) { err(e); } finally { (el as HTMLButtonElement).disabled = false; }
    });
    await list();
  },
  async refresh() {
    // Don't redraw while the owner is typing a reply.
    if ([...document.querySelectorAll<HTMLTextAreaElement>('#tList textarea')].some((t) => t.value.trim() || t === document.activeElement)) return;
    await list();
  },
};
