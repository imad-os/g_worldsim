import { esc, load, save } from './util.js';

export interface Series { name: string; color: string; values: number[] }

/** Chart time ranges (imad 2026-11-27): the server keeps minutes for 2 days and hours forever. */
export const RANGES: [string, string][] = [['all', 'All'], ['1y', '1y'], ['6m', '6m'], ['1m', '1m'], ['1w', '1w'], ['1d', '1d']];
export const chartRange = () => load<string>('chartRange', '1d');
/** The All / 1y / 6m / 1m / 1w / 1d switch; every switch on the page follows the same choice (event 'ws-range'). */
export const rangeSeg = () => `<div class="seg rng" role="group" aria-label="Time range">${RANGES.map(([k, l]) => `<button data-range="${k}" class="${chartRange() === k ? 'on' : ''}" title="${RANGE_NAMES[k]}">${l}</button>`).join('')}</div>`;
const RANGE_NAMES: Record<string, string> = { all: 'Since the world began', '1y': 'Last year', '6m': 'Last 6 months', '1m': 'Last month', '1w': 'Last week', '1d': 'Last day' };
document.addEventListener('click', (e) => {
  const b = (e.target as HTMLElement).closest<HTMLElement>('[data-range]'); if (!b) return;
  save('chartRange', b.dataset.range!);
  for (const x of document.querySelectorAll<HTMLElement>('[data-range]')) x.classList.toggle('on', x.dataset.range === b.dataset.range);
  window.dispatchEvent(new CustomEvent('ws-range', { detail: b.dataset.range }));
});

const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'], DAY = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const p2 = (n: number) => String(n).padStart(2, '0');
/** A time label that fits the span shown: 14:05, Mon 14h, 26 Nov, Nov 2026. */
function tlabel(t: number, span: number, full = false): string {
  const d = new Date(t), hm = `${p2(d.getHours())}:${p2(d.getMinutes())}`;
  if (full) return `${d.getDate()} ${MON[d.getMonth()]} ${d.getFullYear() !== new Date().getFullYear() ? d.getFullYear() + ' ' : ''}${hm}`;
  if (span <= 1.5 * 864e5) return hm;
  if (span <= 8 * 864e5) return `${DAY[d.getDay()]} ${p2(d.getHours())}h`;
  if (span <= 200 * 864e5) return `${d.getDate()} ${MON[d.getMonth()]}`;
  return `${MON[d.getMonth()]} ${d.getFullYear()}`;
}
const nice = (v: number) => (Math.abs(v) >= 100 ? String(Math.round(v)) : String(Math.round(v * 10) / 10));

let chartN = 0;
const CHARTS = new Map<string, { series: Series[]; times: number[]; unit: string; span: number }>();
/**
 * A responsive line chart: the svg stretches to its box (lines keep their width), the axis labels are HTML so they
 * never squash on a phone. Hover / touch shows the values at that time. `times` = ms per point.
 */
export function lineChart(series: Series[], times: number[], opts: { max?: number; min?: number; height?: number; unit?: string } = {}): string {
  const W = 600, H = 100, n = times.length;
  if (n < 2) return `<div class="empty">Collecting data: a point every minute.</div>`;
  let lo = opts.min ?? Infinity, hi = opts.max ?? -Infinity;
  for (const s of series) for (const v of s.values) { if (opts.min === undefined) lo = Math.min(lo, v); if (opts.max === undefined) hi = Math.max(hi, v); }
  if (opts.min === undefined) lo = Math.min(0, lo);
  if (opts.max === undefined) hi = hi + (hi - lo) * 0.08;
  if (hi <= lo) hi = lo + 1;
  const t0 = times[0]!, t1 = times[n - 1]!, span = Math.max(1, t1 - t0);
  const x = (t: number) => ((t - t0) / span) * W, y = (v: number) => (1 - (v - lo) / (hi - lo)) * H;
  let grid = '', ylab = '', xlab = '';
  for (let k = 0; k <= 4; k++) { const v = lo + ((hi - lo) * k) / 4, yy = y(v); grid += `<line x1="0" x2="${W}" y1="${yy}" y2="${yy}" class="grid"/>`; ylab += `<span style="top:${(yy / H) * 100}%">${nice(v)}</span>`; }
  for (let k = 0; k <= 4; k++) { const t = t0 + (span * k) / 4; xlab += `<span style="left:${(k / 4) * 100}%">${tlabel(t, span)}</span>`; }
  const lines = series.map((s) => {
    const pts = s.values.map((v, i) => `${x(times[i]!).toFixed(1)},${y(v).toFixed(1)}`).join(' ');
    return `<polygon points="0,${H} ${pts} ${W},${H}" fill="${s.color}" opacity="0.07"/><polyline points="${pts}" fill="none" stroke="${s.color}" stroke-width="2" stroke-linejoin="round" vector-effect="non-scaling-stroke"/>`;
  }).join('');
  const id = 'c' + ++chartN; CHARTS.set(id, { series, times, unit: opts.unit ?? '', span });
  if (CHARTS.size > 40) CHARTS.delete(CHARTS.keys().next().value!);
  const legend = series.map((s) => `<span><i style="background:${s.color}"></i>${esc(s.name)} <b>${nice(s.values[s.values.length - 1]!)}${opts.unit ?? ''}</b></span>`).join('');
  return `<div class="lc" data-chart="${id}" style="--ch:${opts.height ?? 170}px"><div class="lc-y">${ylab}</div><div class="lc-p"><svg class="chart" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none">${grid}${lines}</svg><i class="lc-cur" hidden></i><div class="lc-tip" hidden></div></div><div class="lc-x">${xlab}</div></div><div class="legend">${legend}</div>`;
}
function hover(e: PointerEvent): void {
  const p = (e.target as HTMLElement).closest?.<HTMLElement>('.lc-p'); 
  for (const el of document.querySelectorAll<HTMLElement>('.lc-p.hov')) if (el !== p) { el.classList.remove('hov'); el.querySelector<HTMLElement>('.lc-cur')!.hidden = true; el.querySelector<HTMLElement>('.lc-tip')!.hidden = true; }
  if (!p) return;
  const c = CHARTS.get(p.parentElement!.dataset.chart!); if (!c) return;
  const r = p.getBoundingClientRect(), f = Math.max(0, Math.min(1, (e.clientX - r.left) / r.width)), t = c.times[0]! + f * (c.times[c.times.length - 1]! - c.times[0]!);
  let i = 0; for (let k = 1; k < c.times.length; k++) if (Math.abs(c.times[k]! - t) < Math.abs(c.times[i]! - t)) i = k;
  const fx = (c.times[i]! - c.times[0]!) / Math.max(1, c.times[c.times.length - 1]! - c.times[0]!);
  const cur = p.querySelector<HTMLElement>('.lc-cur')!, tip = p.querySelector<HTMLElement>('.lc-tip')!;
  p.classList.add('hov'); cur.hidden = false; tip.hidden = false; cur.style.left = `${fx * 100}%`;
  tip.innerHTML = `<b>${tlabel(c.times[i]!, c.span, true)}</b>` + c.series.map((s) => `<span><i style="background:${s.color}"></i>${esc(s.name)} <b>${nice(s.values[i]!)}${c.unit}</b></span>`).join('');
  tip.style.left = fx > 0.6 ? '' : `calc(${fx * 100}% + 10px)`; tip.style.right = fx > 0.6 ? `calc(${(1 - fx) * 100}% + 10px)` : '';
}
document.addEventListener('pointermove', hover);
document.addEventListener('pointerdown', hover);

/** Horizontal bars: [label, value, colour]. */
export function bars(rows: [string, number, string][], total?: number): string {
  const max = total ?? Math.max(1, ...rows.map((r) => r[1]));
  return `<div class="hbars">${rows.map(([l, v, c]) => `<div class="hb"><span class="hb-l" title="${esc(l)}">${esc(l)}</span><span class="hb-t"><i style="width:${(v / max) * 100}%;background:${c}"></i></span><b>${v}</b></div>`).join('')}</div>`;
}

/** A ring (donut) gauge, value 0..100. */
export function ring(v: number, color: string, label: string): string {
  const c = 2 * Math.PI * 15.5, f = Math.max(0, Math.min(100, v)) / 100;
  return `<div class="ring"><svg viewBox="0 0 36 36"><circle cx="18" cy="18" r="15.5" class="ring-bg"/><circle cx="18" cy="18" r="15.5" stroke="${color}" stroke-dasharray="${(f * c).toFixed(1)} ${c.toFixed(1)}" class="ring-fg"/></svg><div><b>${Math.round(v)}</b><small>${esc(label)}</small></div></div>`;
}
