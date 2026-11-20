import { esc } from './util.js';

export interface Series { name: string; color: string; values: number[] }

/** A responsive SVG line chart (the svg scales with its box). `times` = ms per point, for the x labels. */
export function lineChart(series: Series[], times: number[], opts: { max?: number; min?: number; height?: number; unit?: string } = {}): string {
  const W = 600, H = opts.height ?? 180, L = 34, R = 8, T = 10, B = 22;
  const n = times.length;
  if (n < 2) return `<div class="empty">Collecting data: a point every minute.</div>`;
  let lo = opts.min ?? Infinity, hi = opts.max ?? -Infinity;
  if (opts.min === undefined || opts.max === undefined) for (const s of series) for (const v of s.values) { if (opts.min === undefined) lo = Math.min(lo, v); if (opts.max === undefined) hi = Math.max(hi, v); }
  if (opts.min === undefined) lo = Math.min(0, lo);
  if (hi <= lo) hi = lo + 1;
  const x = (i: number) => L + (i / (n - 1)) * (W - L - R), y = (v: number) => T + (1 - (v - lo) / (hi - lo)) * (H - T - B);
  let g = '';
  for (let k = 0; k <= 4; k++) {
    const v = lo + ((hi - lo) * k) / 4, yy = y(v);
    g += `<line x1="${L}" x2="${W - R}" y1="${yy}" y2="${yy}" class="grid"/><text x="${L - 6}" y="${yy + 4}" class="axis" text-anchor="end">${Math.round(v)}</text>`;
  }
  const seen = new Set<number>();
  for (let k = 0; k < 4; k++) {
    const i = Math.round((k / 3) * (n - 1)); if (seen.has(i)) continue; seen.add(i);
    const d = new Date(times[i]!);
    g += `<text x="${x(i)}" y="${H - 5}" class="axis" text-anchor="${k === 0 ? 'start' : k === 3 ? 'end' : 'middle'}">${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}</text>`;
  }
  const lines = series.map((s) => {
    const pts = s.values.map((v, i) => `${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ');
    const area = `${L},${y(lo)} ${pts} ${x(n - 1)},${y(lo)}`;
    return `<polygon points="${area}" fill="${s.color}" opacity="0.08"/><polyline points="${pts}" fill="none" stroke="${s.color}" stroke-width="2" stroke-linejoin="round" vector-effect="non-scaling-stroke"/>`;
  }).join('');
  const legend = series.map((s) => `<span><i style="background:${s.color}"></i>${esc(s.name)} <b>${Math.round(s.values[s.values.length - 1]!)}${opts.unit ?? ''}</b></span>`).join('');
  return `<svg class="chart" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none">${g}${lines}</svg><div class="legend">${legend}</div>`;
}

/** Horizontal bars: [label, value, colour]. */
export function bars(rows: [string, number, string][], total?: number): string {
  const max = total ?? Math.max(1, ...rows.map((r) => r[1]));
  return `<div class="hbars">${rows.map(([l, v, c]) => `<div class="hb"><span class="hb-l">${esc(l)}</span><span class="hb-t"><i style="width:${(v / max) * 100}%;background:${c}"></i></span><b>${v}</b></div>`).join('')}</div>`;
}

/** A ring (donut) gauge, value 0..100. */
export function ring(v: number, color: string, label: string): string {
  const c = 2 * Math.PI * 15.5, f = Math.max(0, Math.min(100, v)) / 100;
  return `<div class="ring"><svg viewBox="0 0 36 36"><circle cx="18" cy="18" r="15.5" class="ring-bg"/><circle cx="18" cy="18" r="15.5" stroke="${color}" stroke-dasharray="${(f * c).toFixed(1)} ${c.toFixed(1)}" class="ring-fg"/></svg><div><b>${Math.round(v)}</b><small>${esc(label)}</small></div></div>`;
}
