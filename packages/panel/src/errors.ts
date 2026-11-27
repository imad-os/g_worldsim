import { cmd, build, missing } from './api.js';
import { help } from './help.js';
import { card, on, setHtml, val, type Screen } from './screen.js';
import { ago, esc, icon, toast, save } from './util.js';

/** The server's error log (imad 2026-11-25: "I need an error log in the server"): kept in SQLite on the PC, newest first. */
interface Row { id: number; at: number; last: number; n: number; level: 'warn' | 'error'; source: string; msg: string; ctx: string; stack: string }
interface List { rows: Row[]; total: number; sources: { source: string; n: number }[] }

const err = (e: unknown) => toast(e instanceof Error ? e.message : String(e), 'err');
let q = '', level = '', source = '';

function buildCard(): string {
  const b = build;
  const rows: [string, string][] = b
    ? [['Running code', `${esc(b.commit || '?')}${b.subject ? `<small class="subj" title="${esc(b.subject)}">${esc(b.subject.split(/[.:;]\s/)[0]!.slice(0, 90))}${b.subject.length > 90 ? '…' : ''}</small>` : ''}`], ['Started', `${new Date(b.started).toLocaleString()} (${ago(b.started)})`], ['Commands it knows', String(b.cmds.length)]]
    : [['Running code', '<span class="bad">an older server (from before the error log): it does not say which build it runs</span>']];
  if (missing.size) rows.push(['Missing for this panel', `<span class="bad">${[...missing].map(esc).join(', ')}</span>`]);
  return `<div class="stat">${rows.map(([k, v]) => `<div class="statrow"><span>${k}</span><b>${v}</b></div>`).join('')}</div>`;
}

function pretty(ctx: string): string {
  if (!ctx) return '';
  try { return JSON.stringify(JSON.parse(ctx), null, 1); } catch { return ctx; }
}

async function load(): Promise<void> {
  try {
    const r = await cmd<List>({ cmd: 'errors', limit: 300, q: q || undefined, level: level || undefined, source: source || undefined });
    const sel = document.getElementById('eSource') as HTMLSelectElement | null;
    if (sel) sel.innerHTML = `<option value="">All sources</option>${r.sources.map((s) => `<option value="${esc(s.source)}"${s.source === source ? ' selected' : ''}>${esc(s.source)} (${s.n})</option>`).join('')}`;
    setHtml('eCount', `${r.total} kept${r.total > r.rows.length ? `, newest ${r.rows.length} shown` : ''}`);
    setHtml('eList', r.rows.length ? r.rows.map((x) => `<details class="logi err-row"><summary><span class="tag ${x.level === 'error' ? 'bad' : 'warn'}">${x.level}</span> <span class="tag">${esc(x.source)}</span>${x.n > 1 ? ` <b class="badge">×${x.n}</b>` : ''} ${esc(x.msg)}
        <span class="dim small">· ${new Date(x.last).toLocaleString()}${x.n > 1 ? ` (first ${new Date(x.at).toLocaleString()})` : ''}</span></summary>
        ${x.ctx ? `<h5>Context</h5><pre>${esc(pretty(x.ctx))}</pre>` : ''}${x.stack ? `<h5>Where</h5><pre>${esc(x.stack)}</pre>` : ''}
        <div class="row"><button class="btn sm ghost" data-copy="${x.id}">Copy</button><button class="btn sm ghost danger" data-rm="${x.id}">${icon('x')} Remove</button></div></details>`).join('')
      : '<div class="empty">No errors kept. Problems the server meets (failed panel commands, AI, tunnel, saving, crashes) appear here.</div>');
    on('[data-rm]', 'click', async (el) => { try { await cmd({ cmd: 'errorsClear', id: Number(el.dataset.rm) }); void load(); } catch (e) { err(e); } });
    on('[data-copy]', 'click', (el) => {
      const x = r.rows.find((y) => y.id === Number(el.dataset.copy));
      if (!x) return;
      const text = `[${new Date(x.last).toISOString()}] ${x.level} ${x.source} x${x.n}: ${x.msg}\n${pretty(x.ctx)}\n${x.stack}`.trim();
      void navigator.clipboard?.writeText(text).then(() => toast('Copied', 'ok'), () => toast('Could not copy', 'err'));
    });
    save('errSeen', Date.now());
  } catch (e) { setHtml('eList', `<div class="empty">${esc(e instanceof Error ? e.message : e)}</div>`); }
}

export const errorsScreen: Screen = {
  title: 'Errors', icon: 'alert', help: 'errors', every: 15,
  render() {
    return `<div class="grid2">${card('The server', `<div id="eBuild">${buildCard()}</div>`, { help: help('errBuild') })}
      ${card('Error log', `<div class="row wrap"><input id="eQ" placeholder="Search" value="${esc(q)}" style="flex:1;min-width:140px">
        <select id="eLevel"><option value="">Errors and warnings</option><option value="error"${level === 'error' ? ' selected' : ''}>Errors only</option><option value="warn"${level === 'warn' ? ' selected' : ''}>Warnings only</option></select>
        <select id="eSource"><option value="">All sources</option></select>
        <button class="btn sm" id="eGo">${icon('refresh')} Refresh</button><button class="btn sm ghost danger" id="eClear">Clear all</button></div>
        <div class="dim small" id="eCount"></div><div id="eList" class="feed"><div class="skel"></div></div>`, { cls: 'span2', help: help('errors') })}</div>`;
  },
  async mount() {
    on('#eGo', 'click', () => void load());
    on('#eQ', 'change', (el) => { q = (el as HTMLInputElement).value.trim(); void load(); });
    on('#eLevel', 'change', () => { level = val('eLevel'); void load(); });
    on('#eSource', 'change', () => { source = val('eSource'); void load(); });
    on('#eClear', 'click', async () => { if (!confirm('Remove every kept error?')) return; try { await cmd({ cmd: 'errorsClear' }); void load(); } catch (e) { err(e); } });
    await load();
  },
  async refresh() {
    // Don't close what the owner opened: only redraw when nothing is unfolded.
    if (document.querySelector('#eList details[open]')) return;
    setHtml('eBuild', buildCard());
    await load();
  },
};
