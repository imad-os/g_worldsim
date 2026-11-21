import type { ServerStats } from '@worldsim/protocol';
import { cmd, stats } from './api.js';
import { lineChart, bars, ring } from './charts.js';
import { help } from './help.js';
import { LiveMap } from './livemap.js';
import { card, on, setHtml, type Screen } from './screen.js';
import { S, overview, history, describe, groupOf, KINDS, people } from './state.js';
import { esc, gameTime, hourOf, icon, ACTS, ACT_COLORS, load, save, toast, ago } from './util.js';

/** What the dashboard shows (Settings > Dashboard). */
export const WIDGETS: [string, string][] = [
  ['kpis', 'Tiles: time, people, players, zombies, animals, births and deaths, server, AI'],
  ['alerts', 'Needs your attention'],
  ['map', 'Live map'],
  ['needs', 'Chart: how people are'],
  ['pop', 'Chart: population, zombies, animals'],
  ['acts', 'What people are doing'],
  ['maps', 'Maps table'],
  ['feed', 'Latest events'],
  ['server', 'Chart: server load'],
];
export const dashOn = (k: string) => load<Record<string, boolean>>('dash', {})[k] !== false;
export function setDash(k: string, v: boolean): void { const d = load<Record<string, boolean>>('dash', {}); d[k] = v; save('dash', d); }

let lm: LiveMap | null = null;
let mapId = load('dashMap', 'town');
let tick = 0;

const kpi = (ic: string, label: string, value: string, sub: string, h: string, cls = '', id = '') =>
  `<div class="kpi ${cls}"${id ? ` id="${id}"` : ''}><div class="kpi-i">${icon(ic)}</div><div class="kpi-b"><div class="kpi-l">${label}${h}</div><div class="kpi-v">${value}</div><div class="kpi-s">${sub}</div></div></div>`;

function kpis(): string {
  const o = S.ov, s = stats;
  if (!o) return '';
  const h = hourOf(o.gameSec), night = h < 6 || h >= 21;
  const players = o.maps.reduce((a, m) => a + m.players, 0), online = o.maps.reduce((a, m) => a + m.online, 0);
  const zombies = o.maps.reduce((a, m) => a + m.zombies, 0), animals = o.maps.reduce((a, m) => a + m.animals.reduce((x, y) => x + y, 0), 0);
  return [
    kpi(night ? 'moon' : 'sun', 'Game time', gameTime(o.gameSec, true), `${gameTime(o.gameSec).split(',')[0]} · ` + (o.paused ? '<span class="tag bad">Paused</span>' : `speed x${o.speed}`), help('kpiTime')),
    kpi('people', 'People alive', String(o.alive), `${o.children} children · ${o.couples} couples${o.pregnant ? ` · ${o.pregnant} expecting` : ''}`, help('kpiPeople')),
    kpi('tv', 'Players', `${online}<small>/${players}</small>`, `online now${o.pairings ? ` · <b class="warn">${o.pairings} TV waiting</b>` : ''}`, help('kpiPlayers')),
    kpi('zombie', 'Zombies', String(zombies), `${o.zombiesNight} each night`, help('kpiZombies'), zombies ? 'hot' : ''),
    kpi('paw', 'Animals', String(animals), o.maps.map((m) => `${esc(m.name)} ${m.animals.reduce((x, y) => x + y, 0)}`).join(' · '), help('kpiAnimals')),
    kpi('baby', 'Births / deaths', `${o.born}<small> / ${o.dead}</small>`, `generation ${o.generations}`, help('kpiDeaths')),
    s ? kpi('server', 'Server', `${Math.round(s.tps)}<small> ticks/s</small>`, `CPU ${Math.round(s.cpuPct)} % · RAM ${Math.round(s.rssMb)} MB`, help('kpiServer'), s.tps < 18 ? 'hot' : '') : '',
    s?.ai ? kpi('ai', 'AI brain', s.ai.provider === 'none' ? 'Off' : esc(s.ai.model || s.ai.provider), `${s.ai.ready ? 'ready' : esc(s.ai.why ?? 'not ready')} · ${s.ai.plans ?? 0} plans · ${s.ai.chats ?? 0} chats`, help('kpiAi'), s.ai.provider !== 'none' && !s.ai.ready ? 'hot' : '') : '',
  ].join('');
}

function alerts(): string {
  const o = S.ov, s = stats, out: string[] = [];
  if (!o) return '';
  if (o.pairings) out.push(`<a class="alert warn" href="#/players">${icon('tv')} ${o.pairings} TV${o.pairings > 1 ? 's are' : ' is'} waiting for approval</a>`);
  if (o.paused) out.push(`<a class="alert" href="#/world">${icon('pause')} The world is paused</a>`);
  if (o.hungry) out.push(`<a class="alert bad" href="#/people">${icon('food')} ${o.hungry} ${o.hungry > 1 ? 'people are' : 'person is'} very hungry</a>`);
  if (o.thirsty) out.push(`<a class="alert bad" href="#/people">${icon('alert')} ${o.thirsty} ${o.thirsty > 1 ? 'people are' : 'person is'} very thirsty</a>`);
  if (o.hurt) out.push(`<a class="alert bad" href="#/people">${icon('cross')} ${o.hurt} hurt (health under 50)</a>`);
  if (s?.ai && s.ai.provider !== 'none' && !s.ai.ready) out.push(`<a class="alert bad" href="#/ai">${icon('ai')} AI not ready: ${esc(s.ai.why ?? '')}</a>`);
  if (s?.tunnel && s.tunnel.provider !== 'none' && s.tunnel.state !== 'up' && s.tunnel.state !== 'connected') out.push(`<a class="alert bad" href="#/server">${icon('world')} Internet link: ${esc(s.tunnel.state)}</a>`);
  if (s && s.tps < 15 && !s.paused) out.push(`<a class="alert warn" href="#/server">${icon('bolt')} The server is slow (${Math.round(s.tps)} ticks/s)</a>`);
  if (o.alive === 0) out.push(`<a class="alert bad" href="#/people">${icon('alert')} Nobody is alive</a>`);
  return out.length ? out.join('') : `<div class="allgood">${icon('rules')} All good: nothing needs you right now.</div>`;
}

function actsHtml(): string {
  const o = S.ov; if (!o) return '';
  const rows = Object.entries(o.acts).map(([a, n]) => [ACTS[Number(a)] ?? `#${a}`, n, ACT_COLORS[Number(a)] ?? '#888'] as [string, number, string]).sort((a, b) => b[1] - a[1]);
  const n = o.needs;
  return `<div class="rings">${ring(100 - n.hunger, '#f59e0b', 'Food')}${ring(100 - n.thirst, '#38bdf8', 'Water')}${ring(100 - n.tired, '#8b5cf6', 'Rest')}${ring(n.hp, '#22c55e', 'Health')}</div>` + (rows.length ? bars(rows, o.alive) : '<div class="empty">Nobody is alive.</div>');
}

function mapsTable(): string {
  const o = S.ov; if (!o) return '';
  const store = (st: Record<string, number> | null) => !st ? '-' : Object.entries(st).filter(([k, v]) => k !== 't' && v > 0).map(([k, v]) => `${v} ${k}`).join(', ') || 'empty';
  return `<div class="tbl-wrap"><table class="tbl"><thead><tr><th>Map</th><th>People</th><th>Players</th><th>Zombies</th><th>Animals</th><th>Camp</th><th>Huts</th><th>Fires</th><th>Leader</th><th>Wall</th><th>Store</th></tr></thead><tbody>${o.maps.map((m) =>
    `<tr><td><b>${esc(m.name)}</b><br><small>${m.w}×${m.h} · ${esc(m.type)}</small></td><td>${m.people}</td><td>${m.online}/${m.players}</td><td>${m.zombies}</td><td title="${o.animalNames.map((a, k) => `${a} ${m.animals[k] ?? 0}`).join(', ')}">${m.animals.reduce((x, y) => x + y, 0)}</td><td>${m.camp ? `(${m.camp[0]}, ${m.camp[1]})` : '-'}</td><td>${m.huts}${m.doors ? ` <small>(${m.doors} doors)</small>` : ''}</td><td>${m.fires}</td><td>${m.leader ? `<b>${esc(m.leader)}</b>` : '-'}</td><td>${m.defence && (m.defence[0] || m.camp) ? `${m.defence[0]} / ${m.defence[0] + m.defence[1]}` : '-'}</td><td><small>${esc(store(m.store))}</small></td></tr>`).join('')}</tbody></table></div>`;
}

async function feed(): Promise<void> {
  const list = await cmd<{ at: number; kind: string; data: Record<string, unknown> }[]>({ cmd: 'timeline', limit: 80 });
  setHtml('dFeed', list.filter((e) => e.kind !== 'admin').slice(0, 12).map((e) => { const g = groupOf(e.kind); return `<div class="ev"><i class="dotc" style="background:${KINDS[g]![1]}"></i><span class="ev-t">${gameTime(e.at, true)}</span><span>${esc(describe(e))}</span></div>`; }).join('') || '<div class="empty">Nothing yet.</div>');
}

function charts(): void {
  const h = S.hist; if (!h.length) return;
  const t = h.map((r) => r[0]!);
  if (dashOn('needs')) setHtml('dNeeds', lineChart([
    { name: 'Food', color: '#f59e0b', values: h.map((r) => 100 - r[3]!) }, { name: 'Water', color: '#38bdf8', values: h.map((r) => 100 - r[4]!) },
    { name: 'Rest', color: '#8b5cf6', values: h.map((r) => 100 - r[5]!) }, { name: 'Health', color: '#22c55e', values: h.map((r) => r[7]!) }], t, { min: 0, max: 100, unit: '%' }));
  if (dashOn('pop')) setHtml('dPop', lineChart([
    { name: 'People', color: '#4da3ff', values: h.map((r) => r[2]!) }, { name: 'Zombies', color: '#ef4444', values: h.map((r) => r[8]!) }, { name: 'Animals', color: '#a8743a', values: h.map((r) => r[9]!) }], t, { min: 0 }));
  if (dashOn('server')) setHtml('dSrv', lineChart([
    { name: 'Ticks/s', color: '#22c55e', values: h.map((r) => r[10]!) }, { name: 'CPU %', color: '#f59e0b', values: h.map((r) => r[11]!) }], t, { min: 0 }));
}

async function loadAll(first = false): Promise<void> {
  await overview(true);
  if (dashOn('kpis')) setHtml('dKpis', kpis());
  if (dashOn('alerts')) setHtml('dAlerts', alerts());
  if (dashOn('acts')) setHtml('dActs', actsHtml());
  if (dashOn('maps')) setHtml('dMaps', mapsTable());
  if (dashOn('map') && lm) {
    const sel = document.getElementById('dMapSel') as HTMLSelectElement | null;
    if (sel && first) sel.innerHTML = S.ov!.maps.map((m) => `<option value="${m.id}">${esc(m.name)} (${m.people} people)</option>`).join('');
    if (sel) sel.value = mapId;
    if (first) { await people(); lm.names = S.names; await lm.show(mapId); } else await lm.refresh(mapId);
  }
  if (first || tick % 6 === 0) { await history(); charts(); }
  if (dashOn('feed') && (first || tick % 2 === 0)) await feed();
}

export const dashboard: Screen = {
  title: 'Dashboard', icon: 'dash', help: 'dashboard', every: 3,
  render() {
    const w = (k: string, html: string) => (dashOn(k) ? html : '');
    return `<div class="dash">
      ${w('kpis', `<div class="kpis" id="dKpis"><div class="skel"></div></div>`)}
      ${w('alerts', card('Needs your attention', `<div id="dAlerts" class="alerts"></div>`, { help: help('alerts'), cls: 'span2' }))}
      ${w('map', card('Live map', `<div class="mapbox"><canvas id="dMap"></canvas><div class="maptip" id="dTip" hidden></div></div>
        <div class="mapkey"><span><i style="background:#38bdf8;box-shadow:0 0 0 2px #fff inset"></i>People</span><span><i style="background:#ffd166"></i>Players</span><span><i style="background:#ff5252"></i>Zombies</span><span><i style="background:#a8743a"></i>Animals</span><span><i style="background:#ff8a3d"></i>Fires</span><span><i class="sq" style="background:#b388ff"></i>Roads out</span><span><i class="ringk"></i>Camp</span></div>`,
        { help: help('liveMap'), cls: 'span2 tall', tools: `<select id="dMapSel" aria-label="Map"></select>` }))}
      ${dashOn('acts') || dashOn('feed') ? `<div class="dcol">
      ${w('acts', card('What people are doing', `<div id="dActs"></div>`, { help: help('acts') }))}
      ${w('feed', card('Latest events', `<div id="dFeed" class="feed"></div>`, { help: help('feed'), tools: `<a class="btn sm ghost" href="#/events">All</a>` }))}
      </div>` : ''}
      ${w('needs', card('How people are', `<div id="dNeeds" class="chartbox"></div>`, { help: help('needsChart') }))}
      ${w('pop', card('Population', `<div id="dPop" class="chartbox"></div>`, { help: help('popChart') }))}
      ${w('server', card('Server load', `<div id="dSrv" class="chartbox"></div>`, { help: help('kpiServer') }))}
      ${w('maps', card('Maps', `<div id="dMaps"></div>`, { help: help('mapsTable'), cls: 'span2' }))}
      <p class="hint">${icon('settings')} Choose what this page shows in <a href="#/settings">Settings</a>.</p>
    </div>`;
  },
  async mount() {
    tick = 0;
    const c = document.getElementById('dMap') as HTMLCanvasElement | null;
    lm = c ? new LiveMap(c, document.getElementById('dTip')!) : null;
    if (lm) lm.onPick = (id) => { location.hash = `#/person/${id}`; };
    on('#dMapSel', 'change', (el) => { mapId = (el as HTMLSelectElement).value; save('dashMap', mapId); void lm?.show(mapId); });
    try { await loadAll(true); } catch (e) { toast(String(e), 'err'); }
  },
  async refresh() { tick++; try { await loadAll(); } catch { /* next time */ } },
  onStats(s: ServerStats) { void s; if (dashOn('kpis') && S.ov) setHtml('dKpis', kpis()); },
  leave() { lm = null; },
};
window.addEventListener('resize', () => lm?.draw());
void ago;
