import { cmd } from './api.js';
import { help } from './help.js';
import { card, on, setHtml, val, type Screen } from './screen.js';
import { ago, esc, icon, toast } from './util.js';

/**
 * The AI agent page (imad 2026-11-25): ask in words for what the panel has no button for. The agent looks at the code and
 * the world by itself, then shows the code it wants to run (or the file changes it wants to make). Nothing happens until
 * Run / Apply is pressed; the database is copied first, and every action can be undone.
 */
interface Edit { path: string; find?: string; replace?: string; create?: string }
interface Proposal { id: number; kind: 'run' | 'edit'; commit?: string; revertCommit?: string; why: string; code?: string; edits?: Edit[]; restart?: boolean; status: string; result?: string; backup?: string; at: number; by?: string; ask: string }
interface Step { at: number; role: 'you' | 'agent' | 'look' | 'result' | 'error'; text: string; who?: string; proposal?: number }
interface View { busy: boolean; phase: string; brain: string; steps: Step[]; pending: Proposal | null; brains?: { id: string; name: string; provider: string; model: string }[]; brainId?: string }

const err = (e: unknown) => toast(e instanceof Error ? e.message : String(e), 'err');
let last: View | null = null, seen = '', poll = 0, running = false;

const EXAMPLES = ['Change the sex of Lina to man', 'Give everyone on the town map 10 wood', 'Add a new animal: a fox, small, runs away, gives meat and leather', 'How many people are hungry right now?'];

function stepHtml(s: Step): string {
  if (s.role === 'you') return `<div class="msg me"><b>${esc(s.who || 'You')}</b>${esc(s.text)}</div>`;
  if (s.role === 'agent') return `<div class="msg"><b>Agent</b>${esc(s.text)}</div>`;
  if (s.role === 'look') { const first = s.text.split('\n')[0]!.slice(0, 120); return `<details class="logi ag-look"><summary>${icon('search')} Looked: ${esc(first)}</summary><pre>${esc(s.text)}</pre></details>`; }
  if (s.role === 'result') return `<div class="msg sys ag-res"><pre>${esc(s.text)}</pre></div>`;
  return `<div class="msg sys bad">${icon('alert')} ${esc(s.text)}</div>`;
}

function editHtml(e: Edit): string {
  if (typeof e.create === 'string') return `<div class="ag-edit"><div class="ag-path">${esc(e.path)} <span class="tag ok">new file</span></div><pre class="ag-add">${esc(e.create)}</pre></div>`;
  return `<div class="ag-edit"><div class="ag-path">${esc(e.path)}</div><pre class="ag-del">${esc(e.find ?? '')}</pre><pre class="ag-add">${esc(e.replace ?? '')}</pre></div>`;
}

function proposalHtml(p: Proposal): string {
  const body = p.kind === 'run'
    ? `<p class="dim small">JavaScript that runs inside the live server. You can change it before running.</p><textarea id="agCode" class="ag-code" spellcheck="false" rows="${Math.min(24, Math.max(6, (p.code ?? '').split('\n').length + 1))}">${esc(p.code ?? '')}</textarea>`
    : `<p class="dim small">Changes to the source files (red = taken out, green = put in). After Apply the server rebuilds; restart to use the new code.</p>${(p.edits ?? []).map(editHtml).join('')}`;
  return card(`#${p.id} · ${p.kind === 'run' ? 'Code to run' : 'File changes'}`, `${p.why ? `<p><b>Why:</b> ${esc(p.why)}</p>` : ''}${p.result ? `<p class="bad small">${esc(p.result)}</p>` : ''}${body}
    <div class="row ag-btns"><button class="btn primary" id="agRun">${icon('play')} ${p.kind === 'run' ? 'Run' : 'Apply and build'}</button><button class="btn ghost" id="agCancel">${icon('x')} Cancel</button>
    <span class="dim small">${p.kind === 'run' ? 'The world is saved and the database copied first.' : 'The original files are kept for undo.'}</span></div>`, { cls: 'ag-prop', help: help('agentRun') });
}

function draw(v: View): void {
  last = v;
  const chat = document.getElementById('agChat');
  if (chat) {
    const key = JSON.stringify([v.steps.length, v.steps.at(-1)?.at, v.busy, v.phase]);
    if (key !== seen) {
      seen = key;
      const atEnd = chat.scrollHeight - chat.scrollTop - chat.clientHeight < 60;
      chat.innerHTML = (v.steps.map(stepHtml).join('') || `<div class="empty">Ask for something the panel can't do yet. Examples:<br>${EXAMPLES.map((x) => `<a class="ag-ex">${esc(x)}</a>`).join('<br>')}</div>`)
        + (v.busy ? `<div class="msg sys"><span class="ag-dots"></span> ${esc(v.phase || 'working…')}</div>` : '');
      if (atEnd || v.busy) chat.scrollTop = chat.scrollHeight;
      for (const a of chat.querySelectorAll<HTMLElement>('.ag-ex')) a.onclick = () => { (document.getElementById('agSay') as HTMLTextAreaElement).value = a.textContent ?? ''; };
    }
  }
  const pid = v.pending?.status === 'waiting' ? v.pending.id : 0;
  const box = document.getElementById('agProp');
  if (box && box.dataset.id !== String(pid)) {
    box.dataset.id = String(pid);
    box.innerHTML = v.pending && pid ? proposalHtml(v.pending) : '';
    if (pid) {
      document.getElementById('agRun')!.onclick = () => void runIt(pid, v.pending!.kind);
      document.getElementById('agCancel')!.onclick = () => void cmd<View>({ cmd: 'coderCancel', id: pid }).then(draw, err);
      box.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }
  const b = document.getElementById('agBrain') as HTMLSelectElement | null;
  if (b && v.brains && !b.dataset.filled) { b.dataset.filled = '1'; b.innerHTML = v.brains.map((x) => `<option value="${esc(x.id)}">${esc(x.name)}${x.model ? ' · ' + esc(x.model) : ''}</option>`).join(''); b.value = v.brainId ?? ''; }
  const go = document.getElementById('agGo') as HTMLButtonElement | null;
  if (go) go.disabled = v.busy;
  clearTimeout(poll);
  if (v.busy) poll = window.setTimeout(() => void cmd<View>({ cmd: 'coder' }).then(draw).catch(() => {}), 1500);
}

async function runIt(id: number, kind: string): Promise<void> {
  if (running) return;
  const code = kind === 'run' ? (document.getElementById('agCode') as HTMLTextAreaElement | null)?.value : undefined;
  if (!confirm(kind === 'run' ? 'Run this code on the live server now?' : 'Change these files and rebuild the server now?')) return;
  running = true;
  const btn = document.getElementById('agRun') as HTMLButtonElement | null;
  if (btn) { btn.disabled = true; btn.textContent = kind === 'run' ? 'Running…' : 'Building…'; }
  try {
    const r = await cmd<View & { proposal: Proposal }>({ cmd: 'coderRun', id, code }, 600_000);
    toast(r.proposal.status === 'done' ? `#${id} done` : `#${id} failed`, r.proposal.status === 'done' ? 'ok' : 'err');
    draw(r);
    void loadAudit();
  } catch (e) { err(e); } finally { running = false; }
}

const STATUS_TAG: Record<string, string> = { done: 'ok', failed: 'bad', undone: '', cancelled: '', waiting: '', running: '' };
async function loadAudit(): Promise<void> {
  try {
    const list = await cmd<Proposal[]>({ cmd: 'coderAudit', limit: 40 });
    setHtml('agAudit', list.length ? list.map((p) => `<details class="logi"><summary><span class="tag ${STATUS_TAG[p.status] ?? ''}">${esc(p.status === 'undone' ? 'reverted' : p.status)}</span> #${p.id} ${p.kind === 'run' ? 'code' : 'files'} · ${esc(p.ask.slice(0, 80))} <span class="dim small">${ago(p.at)}${p.by && p.by !== 'agent' ? ' · ' + esc(p.by) : ''}</span></summary>
      ${p.why ? `<p class="small">${esc(p.why)}</p>` : ''}${p.kind === 'run' ? `<h5>Code</h5><pre>${esc(p.code ?? '')}</pre>` : (p.edits ?? []).map(editHtml).join('')}
      ${p.commit ? `<p class="small">Git commit <b>${esc(p.commit.slice(0, 10))}</b>${p.revertCommit ? ` · reverted by <b>${esc(p.revertCommit.slice(0, 10))}</b>` : ''}</p>` : p.backup ? `<p class="small">Database copy before it: <b>${esc(p.backup)}</b></p>` : ''}
      ${p.result ? `<h5>Result</h5><pre>${esc(p.result)}</pre>` : ''}
      ${(p.status === 'done' || p.status === 'failed') && (p.kind === 'edit' || p.backup) ? `<button class="btn sm danger" data-undo="${p.id}" data-kind="${p.kind}">${icon('refresh')} Revert</button>` : ''}</details>`).join('') : '<div class="empty">Nothing run yet.</div>');
    on('[data-undo]', 'click', async (el) => {
      const run = el.dataset.kind === 'run';
      if (!confirm(run ? 'Revert this run? The whole world goes back to the copy made just before it (anything that happened since is lost) and the server restarts.' : 'Revert these code changes? Git takes out exactly this change, the server rebuilds and restarts.')) return;
      try { const r = await cmd<View & { text: string }>({ cmd: 'coderUndo', id: Number(el.dataset.undo) }, 600_000); toast(r.text, 'ok'); draw(r); void loadAudit(); } catch (e) { err(e); }
    });
  } catch (e) { setHtml('agAudit', `<div class="empty">${esc(e instanceof Error ? e.message : e)}</div>`); }
}

export const coderScreen: Screen = {
  title: 'AI agent', icon: 'code', help: 'agent', every: 10,
  render() {
    seen = '';
    return `<div class="grid2">
      ${card('Ask the agent', `<div class="chat ag-chat" id="agChat"></div><div id="agProp"></div>
        <div class="ag-ask"><textarea id="agSay" rows="2" maxlength="4000" placeholder="What should be done? e.g. “change the sex of Lina to man”"></textarea>
        <div class="row"><button class="btn primary" id="agGo">${icon('bolt')} Ask</button><button class="btn ghost sm" id="agNew">${icon('plus')} New conversation</button>
        <label class="dim small">Brain <select id="agBrain"></select></label></div></div>`, { cls: 'span2', help: help('agentAsk') })}
      ${card('What the agent did', `<div id="agAudit" class="feed"><div class="skel"></div></div>`, { cls: 'span2', help: help('agentAudit') })}</div>`;
  },
  async mount() {
    const say = () => {
      const t = val('agSay');
      if (!t) return;
      cmd<View>({ cmd: 'coderAsk', text: t }).then((v) => { (document.getElementById('agSay') as HTMLTextAreaElement).value = ''; draw(v); }, err);
    };
    on('#agGo', 'click', say);
    on('#agSay', 'keydown', (_el, e) => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); say(); } });
    on('#agNew', 'click', () => { if (confirm('Start a new conversation? A waiting proposal is cancelled; the history below stays.')) cmd<View>({ cmd: 'coderReset' }).then((v) => { seen = ''; draw(v); }, err); });
    on('#agBrain', 'change', (el) => { cmd<View>({ cmd: 'coderBrain', id: (el as HTMLSelectElement).value }).then((v) => { toast(`The agent thinks with ${v.brain}`, 'ok'); draw(v); }, err); });
    try { draw(await cmd<View>({ cmd: 'coder' })); } catch (e) { setHtml('agChat', `<div class="empty">${esc(e instanceof Error ? e.message : e)}</div>`); }
    await loadAudit();
  },
  async refresh() { if (!last?.busy && !running) { try { draw(await cmd<View>({ cmd: 'coder' })); } catch { /* */ } } },
  leave() { clearTimeout(poll); },
};
