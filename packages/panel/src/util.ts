/** Small helpers shared by every screen of the control panel. */
export const $ = <T extends HTMLElement = HTMLElement>(id: string) => document.getElementById(id) as T;
export const esc = (s: unknown) => String(s ?? '').replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
export const r1 = (v: number) => Math.round(v * 10) / 10;

/** Game time from game seconds (the world starts on day 1 at 08:00). */
export function gameTime(s: number, short = false): string {
  const h = s / 3600 + 8, day = Math.floor(h / 24) + 1, hh = String(Math.floor(h % 24)).padStart(2, '0'), mm = String(Math.floor((s / 60) % 60)).padStart(2, '0');
  return short ? `${hh}:${mm}` : `Day ${day}, ${hh}:${mm}`;
}
export function hourOf(s: number): number { return ((s / 3600 + 8) % 24 + 24) % 24; }
export function ago(t: number): string {
  if (!t) return '-';
  const s = Math.round((Date.now() - t) / 1000);
  return s < 60 ? `${s} s ago` : s < 3600 ? `${Math.round(s / 60)} min ago` : s < 86400 ? `${Math.round(s / 3600)} h ago` : new Date(t).toLocaleDateString();
}
export const ACTS = ['Standing', 'Walking around', 'Getting water', 'Eating', 'Looking for food', 'Sleeping', 'Talking', 'Travelling', 'Resting', 'Running away', 'Going to someone', 'Gathering', 'Building', 'Fighting'];
export const ACT_COLORS = ['#8b95a1', '#4da3ff', '#38bdf8', '#f59e0b', '#eab308', '#8b5cf6', '#ec4899', '#14b8a6', '#a3a3a3', '#ef4444', '#22c55e', '#a16207', '#d97706', '#dc2626'];

/** A "how fine" bar: needs are stored as a lack (0 fine .. 100 desperate), hp as health. */
export function meter(v: number, lack = true, label = ''): string {
  const fine = Math.max(0, Math.min(100, lack ? 100 - v : v));
  const cls = fine > 60 ? 'good' : fine > 30 ? 'mid' : 'low';
  return `<div class="meter ${cls}" title="${label} ${Math.round(fine)}%"><i style="width:${Math.max(2, fine)}%"></i></div>`;
}

let toastTimer = 0;
let lastToast = '', lastToastAt = 0;
export function toast(text: string, kind: 'ok' | 'err' | 'info' = 'info'): void {
  // The same error again and again (a page polling a failing command) is shown once every 20 s, not stacked.
  if (kind === 'err' && text === lastToast && Date.now() - lastToastAt < 20_000) return;
  lastToast = text; lastToastAt = Date.now();
  const el = $('toast');
  el.textContent = text; el.className = `toast show ${kind}`;
  clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => { el.className = 'toast'; }, kind === 'err' ? 6000 : 3000);
}

/** Stored settings of this browser (what the dashboard shows, theme...). */
export function load<T>(k: string, d: T): T { try { const v = localStorage.getItem('ws_' + k); return v === null ? d : (JSON.parse(v) as T); } catch { return d; } }
export function save(k: string, v: unknown): void { try { localStorage.setItem('ws_' + k, JSON.stringify(v)); } catch { /* private mode */ } }

/** Inline icons (stroke, 24 px grid). */
const P: Record<string, string> = {
  dash: '<rect x="3" y="3" width="7" height="9" rx="1.5"/><rect x="14" y="3" width="7" height="5" rx="1.5"/><rect x="14" y="12" width="7" height="9" rx="1.5"/><rect x="3" y="16" width="7" height="5" rx="1.5"/>',
  people: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c.8-3.6 3.4-5.5 6.5-5.5s5.7 1.9 6.5 5.5"/><circle cx="17.5" cy="9" r="2.5"/><path d="M16.5 14.3c2.6.2 4.4 1.9 5 4.7"/>',
  world: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.5 2.7 3.8 5.7 3.8 9s-1.3 6.3-3.8 9c-2.5-2.7-3.8-5.7-3.8-9S9.5 5.7 12 3z"/>',
  zombie: '<path d="M12 3c-4.4 0-7 3-7 7 0 2.4 1 4 2.5 5v4h9v-4c1.5-1 2.5-2.6 2.5-5 0-4-2.6-7-7-7z"/><circle cx="9.5" cy="10" r="1.3"/><circle cx="14.5" cy="10" r="1.3"/><path d="M10 19v-2M14 19v-2M12 19v-2"/>',
  craft: '<path d="M14.5 4.5l5 5-2 2-5-5zM12.5 6.5l-9 9 3 3 9-9"/><path d="M15 15l4.5 4.5"/>',
  rules: '<path d="M12 3l8 3v6c0 4.5-3.3 8-8 9-4.7-1-8-4.5-8-9V6z"/><path d="M8.5 12l2.5 2.5 4.5-5"/>',
  ai: '<rect x="5" y="5" width="14" height="14" rx="3"/><rect x="9" y="9" width="6" height="6" rx="1"/><path d="M9 2v3M15 2v3M9 19v3M15 19v3M2 9h3M2 15h3M19 9h3M19 15h3"/>',
  tv: '<rect x="3" y="5" width="18" height="12" rx="2"/><path d="M8 21h8M12 17v4"/>',
  events: '<path d="M8 6h13M8 12h13M8 18h13"/><circle cx="4" cy="6" r="1.2"/><circle cx="4" cy="12" r="1.2"/><circle cx="4" cy="18" r="1.2"/>',
  server: '<rect x="3" y="4" width="18" height="7" rx="1.5"/><rect x="3" y="13" width="18" height="7" rx="1.5"/><path d="M7 7.5h.01M7 16.5h.01"/>',
  settings: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>',
  more: '<circle cx="5" cy="12" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="19" cy="12" r="1.5"/>',
  help: '<circle cx="12" cy="12" r="9"/><path d="M9.5 9.3a2.6 2.6 0 0 1 5 .9c0 1.8-2.5 2.2-2.5 3.8M12 17h.01"/>',
  x: '<path d="M6 6l12 12M18 6L6 18"/>',
  chart: '<path d="M4 20V4M4 20h16"/><path d="M8 16v-5M12 16V8M16 16v-3M20 16V6"/>',
  code: '<path d="M8.5 7l-5 5 5 5M15.5 7l5 5-5 5M13.5 4.5l-3 15"/>',
  back: '<path d="M15 5l-7 7 7 7"/>',
  play: '<path d="M7 4.5v15l12-7.5z"/>',
  pause: '<path d="M7 4h3.5v16H7zM13.5 4H17v16h-3.5z"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
  shield: '<path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/>',
  check: '<path d="M5 12l5 5L20 7"/>',
  google: '<path d="M21 12.2c0-.7-.1-1.3-.2-1.9H12v3.6h5a4.3 4.3 0 0 1-1.9 2.8v2.3h3A9 9 0 0 0 21 12.2z"/><path d="M12 21a8.9 8.9 0 0 0 6.1-2.2l-3-2.3a5.6 5.6 0 0 1-8.3-2.9H3.7v2.4A9 9 0 0 0 12 21zM6.8 13.6a5.4 5.4 0 0 1 0-3.4V7.8H3.7a9 9 0 0 0 0 8.2zM12 6.6a4.9 4.9 0 0 1 3.4 1.3l2.6-2.6A8.7 8.7 0 0 0 12 3a9 9 0 0 0-8.3 4.8l3.1 2.4A5.4 5.4 0 0 1 12 6.6z"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  search: '<circle cx="11" cy="11" r="6.5"/><path d="M20 20l-4.2-4.2"/>',
  heart: '<path d="M12 20s-7.5-4.6-7.5-10A4.5 4.5 0 0 1 12 7a4.5 4.5 0 0 1 7.5 3c0 5.4-7.5 10-7.5 10z"/>',
  bolt: '<path d="M13 3L5 13.5h6L10 21l8-10.5h-6z"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.5 2"/>',
  paw: '<circle cx="7" cy="10" r="1.8"/><circle cx="11" cy="6.5" r="1.8"/><circle cx="15.5" cy="7.5" r="1.8"/><circle cx="18" cy="11.5" r="1.8"/><path d="M8.5 17.5c0-2.5 2-4.5 4-4.5s4 2 3.5 4.5c-.4 2-3 2.5-3.8 1.6-.7.8-3.7.9-3.7-1.6z"/>',
  baby: '<circle cx="12" cy="8" r="4"/><path d="M6 20c1-3 3.3-4.5 6-4.5s5 1.5 6 4.5"/>',
  cross: '<path d="M10 3h4v7h7v4h-7v7h-4v-7H3v-4h7z"/>',
  fire: '<path d="M12 21c-4 0-6.5-2.6-6.5-6 0-3.2 2.4-5 3.5-8 1 2 2.5 2.7 3 2.7C12 7 12.5 5 14 3c.5 3 4.5 5.5 4.5 11.5 0 3.9-2.6 6.5-6.5 6.5z"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
  moon: '<path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z"/>',
  map: '<path d="M9 4L3 6.5v13.5l6-2.5 6 2.5 6-2.5V4l-6 2.5z"/><path d="M9 4v13.5M15 6.5V20"/>',
  logout: '<path d="M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3M10 16l-4-4 4-4M6 12h10"/>',
  refresh: '<path d="M20 11a8 8 0 0 0-14.6-4.5L4 8M4 4v4h4M4 13a8 8 0 0 0 14.6 4.5L20 16M20 20v-4h-4"/>',
  alert: '<path d="M12 3l9.5 17h-19z"/><path d="M12 10v4M12 17h.01"/>',
  chat: '<path d="M4 5h16v11H9l-5 4z"/>',
  food: '<path d="M7 3v8M5 3v5a2 2 0 0 0 4 0V3M7 11v10M16 3c-2 1.5-3 4-3 7h3v11"/>',
};
export function icon(n: string, cls = ''): string {
  return `<svg class="ic ${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${P[n] ?? ''}</svg>`;
}
