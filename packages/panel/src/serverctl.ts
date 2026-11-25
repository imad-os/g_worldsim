import { cmd } from './api.js';
import { help } from './help.js';
import { card, on, setHtml, val } from './screen.js';
import { ago, esc, icon, toast } from './util.js';
import { S } from './state.js';

/** Server page controls (imad 2026-11-25): restart, rebuild, update from GitHub, backups, the server log. */
interface Job { what: string; state: string; log: string; at: number; end?: number }
interface Info { pid: number; node: string; platform: string; root: string; uptimeSec: number; dbBytes: number; backups: number; git: { commit: string; branch: string; subject: string; changed: string[] }; job: Job | null; restorePending: boolean; owner: boolean }
interface Backup { file: string; bytes: number; at: number; why: string }

const err = (e: unknown) => toast(e instanceof Error ? e.message : String(e), 'err');
const mb = (b: number) => `${(b / 1e6).toFixed(b > 1e8 ? 0 : 1)} MB`;
let jobTimer = 0;

export function ctlCards(): string {
  return `${card('Controls', `<div id="cInfo" class="stat"><div class="skel"></div></div>
      <div class="row ag-btns"><button class="btn" id="cRestart">${icon('refresh')} Restart</button><button class="btn" id="cBuild">${icon('code')} Rebuild and restart</button><button class="btn primary" id="cUpdate">${icon('bolt')} Update from GitHub</button></div>
      <div id="cJob"></div>`, { help: help('serverCtl') })}
    ${card('Backups', `<div class="row"><button class="btn sm" id="cBackup">${icon('plus')} Make one now</button></div><div id="cBackups" class="feed"></div>`, { help: help('backups') })}
    ${card('Start over', `<p class="dim small">Pull down every building (huts, walls, doors, beds, lamps, fires, fields, the store crate and what is in it). Homes and camps are forgotten; people, bags, trees and rocks stay. A backup is made first.</p>
      <div class="row"><select id="cResetMap"><option value="">All maps</option>${(S.ov?.maps ?? []).map((m) => `<option value="${esc(m.id)}">${esc(m.name)}</option>`).join('')}</select><button class="btn danger" id="cReset">${icon('x')} Reset all buildings</button></div>`, { help: help('resetBuildings') })}
    ${card('Server log', `<div class="row"><select id="cLevel"><option value="info">Info and up</option><option value="warn">Warnings and errors</option><option value="error">Errors</option><option value="debug">Everything</option></select><button class="btn sm" id="cLogGo">${icon('refresh')} Refresh</button></div><pre id="cLog" class="ag-log"></pre>`, { cls: 'span2', help: help('serverLog') })}`;
}

/** After a restart the link drops; the panel reconnects by itself. */
function restarting(): void { toast('Restarting: the panel reconnects in a few seconds', 'info'); }

function drawJob(j: Job | null): void {
  clearTimeout(jobTimer);
  if (!j) { setHtml('cJob', ''); return; }
  setHtml('cJob', `<details class="logi" ${j.state === 'running' || j.state === 'failed' ? 'open' : ''}><summary><span class="tag ${j.state === 'done' ? 'ok' : j.state === 'failed' ? 'bad' : ''}">${esc(j.state)}</span> ${j.what === 'update' ? 'Update from GitHub' : 'Rebuild'} · ${ago(j.at)}</summary><pre>${esc(j.log || '…')}</pre></details>`);
  if (j.state === 'running') jobTimer = window.setTimeout(() => void info(), 2000);
}

async function info(): Promise<void> {
  try {
    const i = await cmd<Info>({ cmd: 'serverInfo' });
    const rows: [string, string][] = [['Code', `${esc(i.git.commit || '?')} on ${esc(i.git.branch || '?')}${i.git.subject ? ' · ' + esc(i.git.subject) : ''}`],
      ['Local changes', i.git.changed.length ? `<span class="bad">${i.git.changed.length}</span> <span class="dim small">${esc(i.git.changed.slice(0, 6).join(', '))}${i.git.changed.length > 6 ? '…' : ''}</span>` : 'none'],
      ['Process', `pid ${i.pid} · Node ${esc(i.node)} · ${esc(i.platform)}`], ['Database', `${mb(i.dbBytes)} · ${i.backups} backup(s)`]];
    if (i.restorePending) rows.push(['Restore', '<span class="bad">waiting for the next start</span>']);
    if (!i.owner) rows.push(['Your access', '<span class="dim">read only: the owner restarts and updates</span>']);
    setHtml('cInfo', rows.map(([k, v]) => `<div class="statrow"><span>${k}</span><b>${v}</b></div>`).join(''));
    drawJob(i.job);
  } catch (e) { setHtml('cInfo', `<div class="empty">${esc(e instanceof Error ? e.message : e)}</div>`); }
}

function drawBackups(list: Backup[]): void {
  setHtml('cBackups', list.length ? list.map((b) => `<div class="pair"><div><b>${esc(b.why)}</b><div class="dim small">${new Date(b.at).toLocaleString()} · ${mb(b.bytes)}</div></div>
    <div class="row"><button class="btn sm" data-restore="${esc(b.file)}">Restore</button><button class="btn sm ghost danger" data-del="${esc(b.file)}" aria-label="Delete">${icon('x')}</button></div></div>`).join('') : '<div class="empty">No backup yet.</div>');
  on('[data-restore]', 'click', async (el) => {
    if (!confirm(`Restore ${el.dataset.restore}? The world goes back to that moment (anything after it is lost; the current database is kept as a copy) and the server restarts.`)) return;
    try { await cmd({ cmd: 'backupRestore', file: el.dataset.restore! }); restarting(); } catch (e) { err(e); }
  });
  on('[data-del]', 'click', async (el) => { if (!confirm('Delete this backup?')) return; try { drawBackups(await cmd<Backup[]>({ cmd: 'backupDelete', file: el.dataset.del! })); } catch (e) { err(e); } });
}

async function logs(): Promise<void> {
  try {
    const l = await cmd<{ t: string; level: string; msg: string; data: string }[]>({ cmd: 'serverLog', lines: 300, level: val('cLevel') || 'info' });
    const el = document.getElementById('cLog');
    if (!el) return;
    el.innerHTML = l.map((x) => `<span class="lv-${esc(x.level)}">${esc(x.t.slice(5, 19).replace('T', ' '))} ${esc(x.level.padEnd(5))} ${esc(x.msg)}${x.data ? ' ' + esc(x.data) : ''}</span>`).join('\n') || 'nothing yet';
    el.scrollTop = el.scrollHeight;
  } catch (e) { setHtml('cLog', esc(e instanceof Error ? e.message : e)); }
}

export async function ctlMount(): Promise<void> {
  on('#cRestart', 'click', async () => { if (!confirm('Restart the server now? The world is saved first; TVs and this panel reconnect in a few seconds.')) return; try { await cmd({ cmd: 'serverRestart' }); restarting(); } catch (e) { err(e); } });
  on('#cBuild', 'click', async () => { if (!confirm('Rebuild the code on the PC, then restart?')) return; try { drawJob((await cmd<{ job: Job }>({ cmd: 'serverBuild', restart: true })).job); } catch (e) { err(e); } });
  on('#cUpdate', 'click', async () => { if (!confirm('Get the latest code from GitHub, rebuild and restart?')) return; try { drawJob((await cmd<{ job: Job }>({ cmd: 'serverUpdate', restart: true })).job); } catch (e) { err(e); } });
  on('#cBackup', 'click', async () => { try { const r = await cmd<{ list: Backup[] }>({ cmd: 'backupMake' }, 120_000); drawBackups(r.list); toast('Backup made', 'ok'); } catch (e) { err(e); } });
  on('#cReset', 'click', async () => {
    const m = val('cResetMap'), where = m ? (S.ov?.maps.find((x) => x.id === m)?.name ?? m) : 'every map';
    if (!confirm(`Pull down ALL buildings on ${where} and start over? Huts, walls, doors, fires, fields and the store crate go; homes and camps are forgotten. A backup is made first (restore it below to undo).`)) return;
    try {
      const r = await cmd<{ tiles: number; huts: number; maps: number; backup: { file: string } }>({ cmd: 'resetBuildings', ...(m ? { map: m } : {}) }, 120_000);
      toast(`Reset: ${r.huts} hut(s), ${r.tiles} built tile(s) removed. Backup ${r.backup.file}`, 'ok');
      drawBackups(await cmd<Backup[]>({ cmd: 'backups' }));
    } catch (e) { err(e); }
  });
  on('#cLogGo', 'click', () => void logs());
  on('#cLevel', 'change', () => void logs());
  await Promise.all([info(), cmd<Backup[]>({ cmd: 'backups' }).then(drawBackups, err), logs()]);
}

export async function ctlRefresh(): Promise<void> { await info(); }
export function ctlLeave(): void { clearTimeout(jobTimer); }
