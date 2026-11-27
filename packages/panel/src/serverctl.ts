import { cmd } from './api.js';
import { help } from './help.js';
import { card, on, setHtml, val } from './screen.js';
import { ago, esc, icon, toast } from './util.js';
import { S } from './state.js';

/** Server page controls (imad 2026-11-25): restart, rebuild, update from GitHub, backups, the server log. */
interface Job { what: string; state: string; log: string; at: number; end?: number; before?: string; after?: string }
interface Restart { at: number; why: string; state: string; log?: string; end?: number; pid?: number; from?: string; to?: string }
interface Deploy { job?: Job; restart?: Restart }
interface Info { pid: number; node: string; platform: string; root: string; uptimeSec: number; dbBytes: number; backups: number; git: { commit: string; branch: string; subject: string; changed: string[] }; job: Job | null; lastDeploy?: Deploy | null; restorePending: boolean; owner: boolean }
interface Backup { file: string; bytes: number; at: number; why: string }

const err = (e: unknown) => toast(e instanceof Error ? e.message : String(e), 'err');
const mb = (b: number) => `${(b / 1e6).toFixed(b > 1e8 ? 0 : 1)} MB`;
let jobTimer = 0;

export function ctlCards(): string {
  return `${card('Controls', `<div id="cInfo" class="stat"><div class="skel"></div></div>
      <div class="row ag-btns"><button class="btn" id="cRestart">${icon('refresh')} Restart</button><button class="btn" id="cBuild">${icon('code')} Rebuild and restart</button><button class="btn primary" id="cUpdate">${icon('bolt')} Deploy</button></div>
      <p class="dim small">Deploy = get the latest code from GitHub (git pull), install packages if they changed, rebuild, restart. If the new code does not start, the server goes back to the code it had. Rebuild = compile the code already on the PC (nothing new is fetched).</p>
      <div id="cJob"></div>`, { help: help('serverCtl') })}
    ${card('Backups', `<div class="row"><button class="btn sm" id="cBackup">${icon('plus')} Make one now</button></div><div id="cBackups" class="feed"></div>`, { help: help('backups') })}
    ${card('Start over', `<p class="dim small">Pull down every building (huts, walls, doors, beds, lamps, fires, fields, the store crate and what is in it). Homes and camps are forgotten; people, bags, trees and rocks stay. A backup is made first.</p>
      <div class="row"><select id="cResetMap"><option value="">All maps</option>${(S.ov?.maps ?? []).map((m) => `<option value="${esc(m.id)}">${esc(m.name)}</option>`).join('')}</select><button class="btn danger" id="cReset">${icon('x')} Reset all buildings</button></div>`, { help: help('resetBuildings') })}
    ${card('Server log', `<div class="row"><select id="cLevel"><option value="info">Info and up</option><option value="warn">Warnings and errors</option><option value="error">Errors</option><option value="debug">Everything</option></select><button class="btn sm" id="cLogGo">${icon('refresh')} Refresh</button></div><pre id="cLog" class="ag-log"></pre>`, { cls: 'span2', help: help('serverLog') })}`;
}

/** Waiting for a restart: the link drops, the panel reconnects by itself; then the new process (other pid) says how it went. */
let watch: { pid: number; since: number; why: string } | null = null;
let lastPid = 0;
function restarting(why = 'Restart'): void {
  watch = { pid: lastPid, since: Date.now(), why };
  toast(`${why}: the server is restarting, the panel reconnects by itself`, 'info');
  setHtml('cJob', `<div class="logi"><span class="tag">restarting</span> ${esc(why)}: waiting for the server to come back…</div>`);
  clearTimeout(jobTimer);
  jobTimer = window.setTimeout(() => void info(), 3000);
}

/** A build / deploy job is running and restarts the server when it ends: a dropped link from now on means "restarting". */
function expectRestart(why: string): void { watch = { pid: lastPid, since: Date.now(), why }; }

const RESTART_TEXT: Record<string, [string, string]> = {
  asked: ['', 'restart asked'], stopping: ['', 'saving and stopping'], starting: ['', 'starting (it compiles first when the code changed)'],
  up: ['ok', 'back up'], rolledBack: ['bad', 'the new code did not start: back on the old code'], failed: ['bad', 'did not come back'],
};
function drawRestart(r: Restart): string {
  const [cls, text] = RESTART_TEXT[r.state] ?? ['', r.state];
  const extra = r.state === 'rolledBack' ? ` (${esc((r.from ?? '').slice(0, 7))} -> ${esc((r.to ?? '').slice(0, 7))})` : r.state === 'failed' ? ' · the watchdog tries again every 2 minutes' : '';
  return `<details class="logi" ${cls === 'bad' ? 'open' : ''}><summary><span class="tag ${cls}">${esc(text)}</span> ${esc(r.why)} · ${ago(r.at)}${extra}</summary><pre>${esc(r.log || '…')}</pre></details>`;
}

function drawJob(j: Job | null, d?: Deploy | null): void {
  clearTimeout(jobTimer);
  const parts: string[] = [];
  const job = j ?? d?.job ?? null;
  if (job) parts.push(`<details class="logi" ${job.state === 'running' || job.state === 'failed' ? 'open' : ''}><summary><span class="tag ${job.state === 'done' ? 'ok' : job.state === 'failed' ? 'bad' : ''}">${esc(job.state === 'failed' ? 'failed: still running the old code' : job.state === 'done' ? (job.what === 'update' ? 'pulled and built' : 'built') : job.state)}</span> ${job.what === 'update' ? 'Deploy' : 'Rebuild'} · ${ago(job.at)}</summary><pre>${esc(job.log || '…')}</pre></details>`);
  if (d?.restart && (!job || d.restart.at >= job.at)) parts.push(drawRestart(d.restart));
  setHtml('cJob', parts.join(''));
  const busy = job?.state === 'running' || (!!d?.restart && !['up', 'rolledBack', 'failed'].includes(d.restart.state) && Date.now() - d.restart.at < 600_000);
  if (busy) jobTimer = window.setTimeout(() => void info(), 2000);
}

async function info(): Promise<void> {
  try {
    const i = await cmd<Info>({ cmd: 'serverInfo' });
    const rows: [string, string][] = [['Code', `${esc(i.git.commit || '?')} on ${esc(i.git.branch || '?')}${i.git.subject ? `<small class="subj" title="${esc(i.git.subject)}">${esc(i.git.subject.split(/[.:;]\s/)[0]!.slice(0, 90))}${i.git.subject.length > 90 ? '…' : ''}</small>` : ''}`],
      ['Local changes', i.git.changed.length ? `<span class="bad">${i.git.changed.length}</span> <span class="dim small">${esc(i.git.changed.slice(0, 6).join(', '))}${i.git.changed.length > 6 ? '…' : ''}</span>` : 'none'],
      ['Process', `pid ${i.pid} · Node ${esc(i.node)} · ${esc(i.platform)}`], ['Database', `${mb(i.dbBytes)} · ${i.backups} backup(s)`]];
    if (i.restorePending) rows.push(['Restore', '<span class="bad">waiting for the next start</span>']);
    if (!i.owner) rows.push(['Your access', '<span class="dim">read only: the owner restarts and updates</span>']);
    setHtml('cInfo', rows.map(([k, v]) => `<div class="statrow"><span>${k}</span><b>${v}</b></div>`).join(''));
    lastPid = i.pid;
    if (watch && i.pid !== watch.pid) {
      const r = i.lastDeploy?.restart;
      toast(r?.state === 'rolledBack' ? 'Deploy: the new code did not start, the server went back to the old code (see the log)' : `${watch.why}: the server is back`, r?.state === 'rolledBack' ? 'err' : 'ok');
      watch = null;
    }
    drawJob(i.job, i.lastDeploy);
    if (watch && i.pid === watch.pid && i.job?.state === 'failed') watch = null; // the job failed: no restart comes
    // A job with restart that just finished: the server goes down in a moment.
    if (!watch && i.job?.state === 'done' && i.lastDeploy?.restart && i.lastDeploy.restart.at >= i.job.at && !['up', 'rolledBack', 'failed'].includes(i.lastDeploy.restart.state)) restarting(i.job.what === 'update' ? 'Deploy' : 'Rebuild');
  } catch (e) {
    if (watch) {
      const s = Math.round((Date.now() - watch.since) / 1000);
      setHtml('cJob', `<div class="logi"><span class="tag">restarting</span> ${esc(watch.why)}: waiting for the server to come back… ${s} s${s > 300 ? ' · taking long: the watchdog starts it within 2 minutes, data/relaunch.log on the PC says why' : ''}</div>`);
      clearTimeout(jobTimer);
      jobTimer = window.setTimeout(() => void info(), 3000);
      return;
    }
    setHtml('cInfo', `<div class="empty">${esc(e instanceof Error ? e.message : e)}</div>`);
  }
}

function drawBackups(list: Backup[]): void {
  setHtml('cBackups', list.length ? list.map((b) => `<div class="pair"><div><b>${esc(b.why)}</b><div class="dim small">${new Date(b.at).toLocaleString()} · ${mb(b.bytes)}</div></div>
    <div class="row"><button class="btn sm" data-restore="${esc(b.file)}">Restore</button><button class="btn sm ghost danger" data-del="${esc(b.file)}" aria-label="Delete">${icon('x')}</button></div></div>`).join('') : '<div class="empty">No backup yet.</div>');
  on('[data-restore]', 'click', async (el) => {
    if (!confirm(`Restore ${el.dataset.restore}? The world goes back to that moment (anything after it is lost; the current database is kept as a copy) and the server restarts.`)) return;
    try { await cmd({ cmd: 'backupRestore', file: el.dataset.restore! }); restarting('Restore'); } catch (e) { err(e); }
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
  on('#cRestart', 'click', async () => { if (!confirm('Restart the server now? The world is saved first; TVs and this panel reconnect in a few seconds.')) return; try { await cmd({ cmd: 'serverRestart' }); restarting('Restart'); } catch (e) { err(e); } });
  on('#cBuild', 'click', async () => { if (!confirm('Rebuild = compile the code already on the PC (nothing is fetched from GitHub), then restart. Use Deploy to get new code. Go on?')) return; try { drawJob((await cmd<{ job: Job }>({ cmd: 'serverBuild', restart: true })).job); expectRestart('Rebuild'); } catch (e) { err(e); } });
  on('#cUpdate', 'click', async () => { if (!confirm('Deploy: get the latest code from GitHub (git pull), rebuild and restart? The world is saved first. If a step fails the server keeps running and the log below says why; if the new code does not start, it goes back to the old code.')) return; try { drawJob((await cmd<{ job: Job }>({ cmd: 'serverUpdate', restart: true })).job); expectRestart('Deploy'); } catch (e) { err(e); } });
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
