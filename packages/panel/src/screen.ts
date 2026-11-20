import type { ServerStats } from '@worldsim/protocol';

/** One page of the panel. `render` gives the HTML, `mount` binds it and loads data, `refresh` runs every `every` s. */
export interface Screen {
  title: string;
  icon: string;
  help?: string;
  render(arg: string): string;
  mount?(arg: string): void | Promise<void>;
  refresh?(arg?: never): void | Promise<void>;
  every?: number;
  onStats?(s: ServerStats): void;
  leave?(): void;
}
export const view = () => document.getElementById('view')!;
/** Bind an event on every element matching `sel` inside the page. */
export function on<K extends keyof HTMLElementEventMap>(sel: string, ev: K, fn: (el: HTMLElement, e: HTMLElementEventMap[K]) => void): void {
  for (const el of view().querySelectorAll<HTMLElement>(sel)) el.addEventListener(ev, (e) => fn(el, e as HTMLElementEventMap[K]));
}
export const val = (id: string) => (document.getElementById(id) as HTMLInputElement | HTMLSelectElement | null)?.value.trim() ?? '';
export const setHtml = (id: string, html: string) => { const el = document.getElementById(id); if (el) el.innerHTML = html; };
export const card = (title: string, body: string, opts: { help?: string; id?: string; cls?: string; tools?: string } = {}) =>
  `<section class="card ${opts.cls ?? ''}"${opts.id ? ` id="${opts.id}"` : ''}><header><h3>${title}</h3>${opts.tools ?? ''}${opts.help ?? ''}</header><div class="card-b">${body}</div></section>`;
