import { cmd } from './api.js';
import { help } from './help.js';
import { card, on, setHtml, val, type Screen } from './screen.js';
import { ago, esc, gameTime, icon, load, paged, pageReset, save, toast } from './util.js';

/**
 * Thoughts (imad 2026-11-27: "a screen where I can see what people are thinking, not every person; whether an update, a global
 * strict rule or a tweak changes their thoughts and drives them, e.g. a new rule 'never stay at home'; a good way to know what is
 * happening quickly"). Server: admin `thoughts` (ops/thoughts.ts): a sample of everyone every 30 s, kept 6 hours, and a mark for
 * every change made from the panel. This page compares the minutes before a change with the time since.
 */
type Driver = 'danger' | 'order' | 'rule' | 'asked' | 'own' | 'plan' | 'need' | 'social' | 'work' | 'travel' | 'idle';
type Place = 'home' | 'hut' | 'camp' | 'out' | 'wild' | 'away';
interface Point { at: number; g: number; n: number; src: Partial<Record<Driver, number>>; place: Partial<Record<Place, number>>; labels: Record<string, number>; needs: number[]; hits: number }
interface Group { src: Driver; label: string; n: number; people: [number, string][]; whys: [string, number][]; acts: [string, number][]; places: Partial<Record<Place, number>>; rules: [string, number][] }
interface Mark { id: number; at: number; g: number; who: string; cmd: string; text: string }
interface RuleInfo { text: string; scope: string; kind: string; how: string; hits: number; hitsHour: number; held: number; heldNames: string[]; ok: number; fail: number; why: string; people: number }
interface Spread { at: number; g: number; kind: string; what: string; text: string; map: string }
interface Ans { now: number; g: number; every: number; drivers: Driver[]; places: Place[]; groups: Group[]; series: Point[]; marks: Mark[]; rules: RuleInfo[]; moods: [string, number][]; feed: Spread[] }

const DRV: Record<Driver, [string, string]> = {
  danger: ['Danger', '#ef4444'], order: ['Your orders', '#f472b6'], rule: ['Strict rules', '#e11d48'], asked: ['Asked by someone', '#a855f7'],
  own: ['Own plans', '#22c55e'], plan: ['AI planner wish', '#06b6d4'], need: ['Needs', '#f59e0b'], social: ['Company', '#ec4899'],
  work: ['Camp work', '#a16207'], travel: ['Travel', '#14b8a6'], idle: ['Nothing pressing', '#8b95a1'],
};
const PLC: Record<Place, [string, string]> = {
  home: ['In their home', '#22c55e'], hut: ['In a hut', '#84cc16'], camp: ['At the camp', '#f59e0b'], out: ['Out in the map', '#4da3ff'], wild: ['In the wild', '#ef4444'], away: ['Away', '#8b95a1'],
};
const pct = (v: number) => `${Math.round(v * 100)}%`;
const pts = (d: number) => `${d > 0 ? '+' : ''}${Math.round(d * 100)} pts`;
const tag = (d: Driver) => `<span class="tag" style="border-color:${DRV[d][1]};color:${DRV[d][1]}">${esc(DRV[d][0])}</span>`;

let last: Ans | null = null;
let pick = load<number>('thMark', 0); // the change's time (ms); 0 = the latest change
let bound = false;
let only: Driver | '' = '';

/** Average share of each key over some samples. */
function shares(ps: Point[], get: (p: Point) => Record<string, number | undefined>): Map<string, number> {
  const out = new Map<string, number>();
  for (const p of ps) { if (!p.n) continue; for (const [k, v] of Object.entries(get(p))) out.set(k, (out.get(k) ?? 0) + (v ?? 0) / p.n / ps.length); }
  return out;
}
/** The samples of the 10 minutes before the mark (at least the one just before) and every one since it (up to the next mark). */
function windows(A: Ans, m: Mark): { before: Point[]; after: Point[]; next?: Mark; mixed: boolean } {
  const next = A.marks.find((x) => x.at > m.at);
  const before = A.series.filter((p) => p.at <= m.at && p.at > m.at - 10 * 60_000);
  if (!before.length) { const b = [...A.series].reverse().find((p) => p.at <= m.at); if (b) before.push(b); }
  let after = A.series.filter((p) => p.at > m.at && (!next || p.at <= next.at));
  // Two changes inside one sample: compare with everything since (the later change is in it too).
  let mixed = false;
  if (!after.length && next) { after = A.series.filter((p) => p.at > m.at); mixed = after.length > 0; }
  return { before, after, next, mixed };
}
function diffRows(b: Map<string, number>, a: Map<string, number>, name: (k: string) => string, n = 6): [string, number, number][] {
  const keys = new Set([...b.keys(), ...a.keys()]);
  return [...keys].map((k) => [name(k), b.get(k) ?? 0, a.get(k) ?? 0] as [string, number, number]).filter((r) => Math.abs(r[2] - r[1]) >= 0.02).sort((x, y) => Math.abs(y[2] - y[1]) - Math.abs(x[2] - x[1])).slice(0, n);
}
const arrow = (b: number, a: number) => `<span class="dim">${pct(b)}</span> → <b>${pct(a)}</b> <span style="color:${a > b ? 'var(--acc)' : 'var(--warn)'}">${pts(a - b)}</span>`;
const labelName = (k: string) => { const [s, l] = k.split('|') as [Driver, string]; return `${DRV[s]?.[0] ?? s}: ${l}`; };

function compare(A: Ans): string {
  if (!A.marks.length) return `<div class="empty">No change made from the panel in the last 6 hours. Add a rule above (or change anything on another page) and this card shows what it did to people's thoughts, sample by sample (every ${A.every} s).</div>`;
  const m = A.marks.find((x) => x.at === pick) ?? A.marks[A.marks.length - 1]!;
  const sel = `<label class="thsel"><span class="dim small">Change</span><select id="thMark">${[...A.marks].reverse().map((x) => `<option value="${x.at}" ${x.id === m.id ? 'selected' : ''}>${esc(ago(x.at))} · ${esc(x.text)}</option>`).join('')}</select></label>`;
  const { before, after, next, mixed } = windows(A, m);
  const head = `<p><b>${esc(m.text)}</b> <span class="dim small">by ${esc(m.who)} · ${esc(ago(m.at))} · game ${esc(gameTime(m.g))}${next && !mixed ? ` · until the next change (${esc(ago(next.at))})` : ''}</span></p>${mixed ? `<p class="small" style="color:var(--warn)">The next change (${esc(next!.text)}) came before any sample, so its effect is mixed in.</p>` : ''}`;
  if (!before.length) return sel + head + '<div class="empty">No sample from before this change is kept.</div>';
  if (!after.length) return sel + head + `<div class="empty">Waiting for the first sample after it (every ${A.every} s).</div>`;
  const drv = diffRows(shares(before, (p) => p.src), shares(after, (p) => p.src), (k) => DRV[k as Driver]?.[0] ?? k, 11);
  const plc = diffRows(shares(before, (p) => p.place), shares(after, (p) => p.place), (k) => PLC[k as Place]?.[0] ?? k, 6);
  const lab = diffRows(shares(before, (p) => p.labels), shares(after, (p) => p.labels), labelName, 8);
  const nb = before.reduce((a, p) => a + p.hits, 0) / before.length, na = after.reduce((a, p) => a + p.hits, 0) / after.length;
  const need = (k: number) => { const b = before.reduce((a, p) => a + (p.needs[k] ?? 0), 0) / before.length, a = after.reduce((s, p) => s + (p.needs[k] ?? 0), 0) / after.length; return [b, a] as const; };
  const NEEDS = ['Thirst', 'Hunger', 'Tiredness', 'Loneliness', 'Health'];
  const needRows = NEEDS.map((n, k) => { const [b, a] = need(k); return Math.abs(a - b) >= 3 ? `<div class="statrow"><span>${n}</span><b>${Math.round(b)} → ${Math.round(a)}</b></div>` : ''; }).join('');
  const list = (rows: [string, number, number][], empty: string) => rows.length ? rows.map(([l, b, a]) => `<div class="statrow"><span>${esc(l)}</span><span>${arrow(b, a)}</span></div>`).join('') : `<div class="dim small">${empty}</div>`;
  const big = [...drv, ...plc].sort((x, y) => Math.abs(y[2] - y[1]) - Math.abs(x[2] - x[1]))[0];
  const verdict = big && Math.abs(big[2] - big[1]) >= 0.05
    ? `<div class="verdict">${icon('alert')} Biggest shift: <b>${esc(big[0])}</b> ${arrow(big[1], big[2])}</div>`
    : `<div class="verdict dim">No clear shift yet (under 5 points). People may not have met the situation the change is about: give it a few game hours.</div>`;
  return `${sel}${head}${verdict}<div class="dim small">${before.length} sample${before.length > 1 ? 's' : ''} before, ${after.length} since.</div>
    <div class="grid3 thcmp">
      <div><h4>What drives them</h4>${list(drv, 'No change.')}</div>
      <div><h4>Where they are</h4>${list(plc, 'No change.')}</div>
      <div><h4>Thoughts that grew or shrank</h4>${list(lab, 'No change.')}</div>
    </div>
    <div class="grid3 thcmp"><div><h4>Rules saying no</h4><div class="statrow"><span>per sample</span><b>${nb.toFixed(1)} → ${na.toFixed(1)}</b></div></div>
      <div><h4>Needs (0 fine, 100 desperate)</h4>${needRows || '<div class="dim small">No change.</div>'}</div><div></div></div>`;
}

/** Shares of the drivers over time, stacked, with a line at every change. */
function timeline(A: Ans): string {
  const S = A.series.filter((p) => p.n);
  if (S.length < 2) return `<div class="empty">Collecting: a sample every ${A.every} s.</div>`;
  const W = 600, H = 120, t0 = S[0]!.at, t1 = S[S.length - 1]!.at, span = Math.max(1, t1 - t0);
  const x = (t: number) => ((t - t0) / span) * W;
  const base = S.map(() => 0);
  let areas = '';
  for (const d of A.drivers) {
    const top = S.map((p, k) => base[k]! + (p.src[d] ?? 0) / p.n);
    if (top.every((v, k) => v === base[k])) continue;
    const up = S.map((p, k) => `${x(p.at).toFixed(1)},${(H - top[k]! * H).toFixed(1)}`).join(' ');
    const dn = S.map((p, k) => `${x(p.at).toFixed(1)},${(H - base[k]! * H).toFixed(1)}`).reverse().join(' ');
    areas += `<polygon points="${up} ${dn}" fill="${DRV[d][1]}" opacity="0.85"><title>${esc(DRV[d][0])}</title></polygon>`;
    for (let k = 0; k < S.length; k++) base[k] = top[k]!;
  }
  const marks = A.marks.filter((m) => m.at >= t0 && m.at <= t1).map((m) => `<line x1="${x(m.at)}" x2="${x(m.at)}" y1="0" y2="${H}" stroke="currentColor" stroke-width="1.5" stroke-dasharray="4 3" vector-effect="non-scaling-stroke"><title>${esc(m.text)}</title></line>`).join('');
  const lbl = (t: number) => new Date(t).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const legend = A.drivers.filter((d) => S.some((p) => p.src[d])).map((d) => `<span><i style="background:${DRV[d][1]}"></i>${esc(DRV[d][0])}</span>`).join('');
  const markList = A.marks.filter((m) => m.at >= t0).slice(-6).reverse().map((m) => `<div class="logi"><span class="dim small">${esc(lbl(m.at))}</span> <a href="#" data-mark="${m.at}">${esc(m.text)}</a></div>`).join('');
  return `<div class="thtl"><svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" class="chart">${areas}${marks}</svg><div class="thx"><span>${esc(lbl(t0))}</span><span>${esc(lbl(t1))}</span></div></div>
    <div class="legend">${legend}</div>${markList ? `<div class="small dim" style="margin-top:8px">Dashed lines = your changes (tap one to compare):</div>${markList}` : ''}`;
}

function groupsHtml(A: Ans): string {
  const total = A.groups.reduce((a, g) => a + g.n, 0) || 1;
  const counts = new Map<Driver, number>(); for (const g of A.groups) counts.set(g.src, (counts.get(g.src) ?? 0) + g.n);
  const chips = `<div class="pfilt"><button class="${only ? '' : 'on'}" data-only="">All <b>${total}</b></button>${A.drivers.filter((d) => counts.get(d)).map((d) => `<button class="${only === d ? 'on' : ''}" data-only="${d}"><i class="dotc" style="background:${DRV[d][1]}"></i>${esc(DRV[d][0])} <b>${counts.get(d)}</b></button>`).join('')}</div>`;
  const gs = A.groups.filter((g) => !only || g.src === only);
  return chips + (gs.length ? paged('thGroups', gs, 12, (sl) => sl.map((g) => {
    const places = Object.entries(g.places).sort((a, b) => b[1]! - a[1]!).map(([k, n]) => `${esc(PLC[k as Place]?.[0] ?? k)} ${n}`).join(' · ');
    return `<div class="thg"><div class="thg-h">${tag(g.src)} <b>${esc(g.label)}</b><span class="thg-n">${g.n} <small class="dim">${pct(g.n / total)}</small></span></div>
      <div class="meter" style="--c:${DRV[g.src][1]}"><i style="width:${Math.max(2, (g.n / total) * 100)}%;background:${DRV[g.src][1]}"></i></div>
      <div class="small">${g.whys.map(([w, n]) => `“${esc(w)}”${n > 1 ? ` <span class="dim">×${n}</span>` : ''}`).join('<br>')}</div>
      <div class="small dim">${places}${g.acts.length > 1 || (g.acts[0] && !g.label.includes(g.acts[0][0])) ? ' · doing: ' + g.acts.map(([a, n]) => `${esc(a)} ${n}`).join(', ') : ''}</div>
      ${g.rules.length ? `<div class="small" style="color:${DRV.rule[1]}">${icon('alert')} held back by ${g.rules.map(([r, n]) => `“${esc(r)}” (${n})`).join(', ')}</div>` : ''}
      <div class="small">${g.people.map(([id, n]) => `<a href="#/person/${id}">${esc(n)}</a>`).join(', ')}${g.n > g.people.length ? ` <span class="dim">and ${g.n - g.people.length} more</span>` : ''}</div></div>`;
  }).join(''), redraw) : '<div class="empty">Nobody.</div>');
}

function rulesHtml(A: Ans): string {
  if (!A.rules.length) return '<div class="empty">No strict rules. Add one above to see how it changes what people do.</div>';
  return `<div class="tbl-wrap"><table class="tbl"><thead><tr><th>Rule</th><th>For</th><th>Said no</th><th>Last hour</th><th>Held back now</th><th>Done / failed</th></tr></thead><tbody>
    ${A.rules.map((r) => `<tr><td>“${esc(r.text)}”<br><small class="dim">${esc(r.how)}</small>${r.why ? `<br><small>last failure: “${esc(r.why)}”</small>` : ''}${r.kind === 'never' && !r.hits && /no action of the engine/.test(r.how) ? '<br><small style="color:var(--bad)">The engine has no action for these words: only the AI planner hears it.</small>' : ''}</td>
      <td>${esc(r.scope)}</td><td>${r.hits}</td><td>${r.hitsHour}</td><td title="${esc(r.heldNames.join(', '))}">${r.held}${r.heldNames.length ? ` <small class="dim">${esc(r.heldNames.slice(0, 3).join(', '))}${r.held > 3 ? '…' : ''}</small>` : ''}</td><td>${r.kind === 'goal' ? `${r.ok} / ${r.fail}` : '<span class="dim">-</span>'}</td></tr>`).join('')}</tbody></table></div>`;
}

function nowHtml(A: Ans): string {
  const p = A.series[A.series.length - 1];
  if (!p || !p.n) return '<div class="empty">No people yet.</div>';
  const strip = (rec: Record<string, number | undefined>, names: Record<string, [string, string]>, order: string[]) => `<div class="thbar">${order.filter((k) => rec[k]).map((k) => `<i style="flex:${rec[k]};background:${names[k]![1]}" title="${esc(names[k]![0])}: ${rec[k]}"></i>`).join('')}</div>
    <div class="legend">${order.filter((k) => rec[k]).map((k) => `<span><i style="background:${names[k]![1]}"></i>${esc(names[k]![0])} <b>${rec[k]}</b></span>`).join('')}</div>`;
  const top = A.groups[0];
  return `<p class="thlead">${p.n} people. ${top ? `Most of them: <b>${esc(top.label)}</b> (${top.n}, ${esc(DRV[top.src][0].toLowerCase())}).` : ''} ${A.groups.some((g) => g.rules.length) ? `<b style="color:${DRV.rule[1]}">${A.groups.reduce((a, g) => a + g.rules.reduce((s, r) => s + r[1], 0), 0)}</b> were held back by a rule in the last game hour.` : ''}</p>
    <h4>What drives them</h4>${strip(p.src, DRV, A.drivers)}<h4 style="margin-top:12px">Where they are</h4>${strip(p.place, PLC, A.places)}
    ${A.moods.length ? `<h4 style="margin-top:12px">Moods</h4><div class="small">${A.moods.map(([m, n]) => `${esc(m)} <b>${n}</b>`).join(' · ')}</div>` : ''}
    <div class="dim small" style="margin-top:8px">Sampled ${esc(ago(p.at))} · game ${esc(gameTime(p.g))}</div>`;
}

function feedHtml(A: Ans): string {
  if (!A.feed.length) return '<div class="empty">When people pass knowledge on in a talk (where the water is, a danger, news, a skill) or agree to do something together, it shows here.</div>';
  return paged('thFeed', A.feed, 10, (sl) => sl.map((f) => `<div class="logi"><span class="dim small">${esc(gameTime(f.g))}</span> <span class="tag">${esc(f.kind)}</span> ${esc(f.text)} <span class="dim small">${esc(f.map)}</span></div>`).join(''), redraw);
}

const redraw = () => { if (last) draw(last); };
function draw(A: Ans): void {
  last = A;
  // Keep a select the owner is using.
  if (document.activeElement?.id !== 'thMark') setHtml('thCmp', compare(A));
  setHtml('thNow', nowHtml(A));
  setHtml('thTl', timeline(A));
  setHtml('thGroups', groupsHtml(A));
  setHtml('thRules', rulesHtml(A));
  setHtml('thFeed', feedHtml(A));
}

async function load_(): Promise<void> {
  try { draw(await cmd<Ans>({ cmd: 'thoughts' })); } catch (e) { setHtml('thNow', `<div class="empty">${esc(e instanceof Error ? e.message : e)}</div>`); }
}

export const thoughtsScreen: Screen = {
  title: 'Thoughts', icon: 'chat', help: 'thoughts', every: 15,
  render() {
    const add = `<div class="row wrap thadd"><input id="thRule" placeholder="Try a rule for everyone, e.g. never stay at home" maxlength="200"><button class="btn primary" id="thAdd">Add rule</button><a class="btn ghost" href="#/rules">All rules</a></div>`;
    return `<div class="grid2">
      ${card('Try a change', add + '<p class="dim small">Every change made from the panel (a rule, a setting, an order) is marked. The card below compares the minutes before it with the time since.</p>', { cls: 'span2', help: help('thTry') })}
      ${card('What it changed', '<div id="thCmp"><div class="skel"></div></div>', { cls: 'span2', help: help('thCmp') })}
      ${card('Right now', '<div id="thNow"><div class="skel"></div></div>', { help: help('thNow') })}
      ${card('Over the last hours', '<div id="thTl"></div>', { help: help('thTl') })}
      ${card('What they are thinking', '<div id="thGroups"></div>', { cls: 'span2', help: help('thGroups') })}
      ${card('Strict rules at work', '<div id="thRules"></div>', { cls: 'span2', help: help('thRules') })}
      ${card('Knowledge spreading', '<div id="thFeed" class="feed"></div>', { cls: 'span2', help: help('thFeed') })}</div>`;
  },
  mount() {
    on('#thAdd', 'click', async () => {
      const t = val('thRule'); if (!t) return;
      try { await cmd({ cmd: 'rules', add: t }, 60000); (document.getElementById('thRule') as HTMLInputElement).value = ''; pick = 0; save('thMark', 0); toast('Rule added: watch this page over the next minutes', 'ok'); await load_(); } catch (e) { toast(String(e instanceof Error ? e.message : e), 'err'); }
    });
    const v = document.getElementById('view')!;
    if (bound) { void load_(); return; }
    bound = true;
    v.addEventListener('change', (e) => { const t = e.target as HTMLSelectElement; if (t.id === 'thMark') { pick = Number(t.value); save('thMark', pick); t.blur(); redraw(); } });
    v.addEventListener('click', (e) => {
      const t = e.target as HTMLElement;
      const o = t.closest<HTMLElement>('[data-only]'); if (o) { only = (o.dataset.only ?? '') as Driver | ''; pageReset('thGroups'); redraw(); return; }
      const mk = t.closest<HTMLElement>('[data-mark]'); if (mk) { e.preventDefault(); pick = Number(mk.dataset.mark); save('thMark', pick); setHtml('thCmp', last ? compare(last) : ''); document.getElementById('thCmp')?.scrollIntoView({ block: 'center', behavior: 'smooth' }); }
    });
    void load_();
  },
  refresh() { void load_(); },
};
