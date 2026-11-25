/**
 * The game's own screens, drawn over the 3D view (My PC's menu stays short: one "Game menu" item):
 *  - Menu: pages of rows, moved with up / down, OK opens, Back goes back. Remote, controller (D-pad + A / B) alike.
 *  - Buttons: every action on a controller button and a remote button; the player chooses one by pressing it.
 *  - Person card (watch mode), my needs (play mode), thought bubbles (only for viewers the owner allows).
 * DOM is built once; updates only touch text and transforms.
 */
import { t, tf, type Key } from './i18n.js';

// ------------------------------------------------------------ actions and buttons
export const ACTIONS = ['use', 'talk', 'attack', 'aim', 'build', 'run', 'eat', 'drink', 'pickup', 'sleep', 'zoomIn', 'zoomOut', 'thoughts', 'person', 'menu', 'camera', 'wheel', 'attackPerson'] as const;
export type ActionId = (typeof ACTIONS)[number];
const ACTION_KEY: Record<ActionId, Key> = {
  use: 'aUse', run: 'aRun', eat: 'aEat', drink: 'aDrink', pickup: 'aPickup', sleep: 'aSleep', zoomIn: 'aZoomIn', zoomOut: 'aZoomOut',
  thoughts: 'aThoughts', person: 'aPerson', menu: 'aMenu', camera: 'aCamera', wheel: 'aWheel', talk: 'aTalk', attack: 'aAttack', aim: 'aAim', build: 'aBuild', attackPerson: 'aAttackPerson',
};
export const actionLabel = (a: ActionId) => t(ACTION_KEY[a]);

export interface Binds { pad: Partial<Record<ActionId, number>>; remote: Partial<Record<ActionId, string>>; v?: number }
/** Version of the default layout: saved binds from an older one are replaced once (imad 2026-11-20: interact / talk / attack). */
export const BINDS_V = 2;
/**
 * Defaults (imad 2026-11-20): A interact (take, gather, drink...), B run, X attack, Y talk to the person next to me,
 * L / R zoom, ZL aim the bow (hold), ZR quick actions (hold), − thoughts, + menu, L3 build, R3 camera. Eat / sleep are on the wheel.
 * Remote: OK interact, red attack, green talk, yellow thoughts, blue person, CH + / − zoom, Info menu, ⏯ quick actions, ⏩ aim, Tools build.
 */
export const DEFAULT_BINDS: Binds = {
  pad: { use: 0, run: 1, attack: 2, talk: 3, zoomIn: 4, zoomOut: 5, aim: 6, wheel: 7, thoughts: 8, menu: 9, build: 10, camera: 11 },
  remote: { use: 'ok', attack: 'red', talk: 'green', thoughts: 'yellow', person: 'blue', zoomIn: 'chUp', zoomOut: 'chDown', menu: 'info', wheel: 'playPause', aim: 'ff', build: 'tools' },
  v: BINDS_V,
};
export function cloneBinds(b: Binds): Binds { return { pad: { ...b.pad }, remote: { ...b.remote }, v: b.v }; }
/** The action on pad button i / remote button name (undefined = none). */
export function padAction(b: Binds, i: number): ActionId | undefined { for (const a of ACTIONS) if (b.pad[a] === i) return a; return undefined; }
export function remoteAction(b: Binds, name: string): ActionId | undefined { for (const a of ACTIONS) if (b.remote[a] === name) return a; return undefined; }
/** Remote button names as players know them. */
const REMOTE_NAMES: Record<string, string> = {
  ok: 'OK', red: '🔴', green: '🟢', yellow: '🟡', blue: '🔵', chUp: 'CH +', chDown: 'CH −', info: 'Info', play: '▶', pause: '⏸', playPause: '⏯',
  ff: '⏩', rew: '⏪', next: '⏭', prev: '⏮', stop: '⏹', record: '⏺', tools: 'Tools', chList: 'CH list', guide: 'Guide', space: 'Space',
  pageUp: 'PgUp', pageDown: 'PgDn',
};
export const remoteName = (n: string) => REMOTE_NAMES[n] ?? (/^\d$/.test(n) ? n : n);

// ------------------------------------------------------------ menu
export interface Row { id: string; label: string; value?: string; sub?: boolean; dim?: boolean }
export interface Page { id: string; title: string; rows: Row[]; text?: string; html?: string; wide?: boolean }

export class Menu {
  readonly el: HTMLDivElement;
  private titleEl: HTMLDivElement;
  private textEl: HTMLDivElement;
  private listEl: HTMLDivElement;
  private stack: { id: string; sel: number }[] = [];
  private rows: Row[] = [];
  open = false;
  sel = 0;

  constructor(private build: (id: string) => Page, private onPick: (pageId: string, rowId: string) => void, private onClose: () => void) {
    this.el = document.createElement('div');
    this.el.id = 'gmenu';
    this.el.hidden = true;
    this.el.setAttribute('role', 'dialog');
    this.titleEl = document.createElement('div'); this.titleEl.className = 'mt';
    this.textEl = document.createElement('div'); this.textEl.className = 'mx';
    this.listEl = document.createElement('div'); this.listEl.className = 'ml'; this.listEl.setAttribute('role', 'menu');
    this.el.append(this.titleEl, this.textEl, this.listEl);
    document.body.appendChild(this.el);
  }

  get page(): string { return this.stack.length ? this.stack[this.stack.length - 1]!.id : ''; }

  show(id = 'root'): void { this.onSound('ui_open'); this.stack = [{ id, sel: 0 }]; this.open = true; this.el.hidden = false; document.body.classList.add('menu-open'); this.render(); }
  push(id: string): void { if (this.stack.length) this.stack[this.stack.length - 1]!.sel = this.sel; this.stack.push({ id, sel: 0 }); this.render(); }
  /** Back: previous page, or close. */
  back(): void {
    this.stack.pop();
    if (!this.stack.length) { this.close(); return; }
    this.render(this.stack[this.stack.length - 1]!.sel);
  }
  close(): void { this.open = false; this.el.hidden = true; document.body.classList.remove('menu-open'); this.stack = []; this.onClose(); }
  /** Draw the current page again (values changed), keeping the selection. */
  refresh(): void { if (this.open) this.render(this.sel); }

  private render(sel = 0): void {
    const p = this.build(this.page);
    this.rows = p.rows;
    this.titleEl.textContent = p.title;
    this.el.classList.toggle('wide', !!p.wide);
    if (p.html) this.textEl.innerHTML = p.html; else this.textEl.textContent = p.text ?? '';
    this.textEl.hidden = !p.text && !p.html;
    this.listEl.textContent = '';
    for (const r of p.rows) {
      const d = document.createElement('div');
      d.className = 'mr' + (r.dim ? ' dim' : '');
      d.setAttribute('role', 'menuitem');
      const l = document.createElement('span'); l.textContent = r.label + (r.sub ? ' ›' : '');
      d.appendChild(l);
      if (r.value !== undefined) { const v = document.createElement('span'); v.className = 'mv'; v.textContent = r.value; d.appendChild(v); }
      this.listEl.appendChild(d);
    }
    this.select(Math.min(sel, Math.max(0, p.rows.length - 1)));
  }

  private select(i: number): void {
    const kids = this.listEl.children;
    kids[this.sel]?.classList.remove('on');
    this.sel = i;
    const k = kids[i] as HTMLElement | undefined;
    if (k) {
      k.classList.add('on');
      k.scrollIntoView?.({ block: 'nearest' });
      const r = this.rows[i]!;
      (globalThis as { MyPC?: { announce?: (s: string) => void } }).MyPC?.announce?.(r.label + (r.value ? ', ' + r.value : ''));
    }
  }

  /** Remote / D-pad / A / B. True = handled. */
  input(a: 'up' | 'down' | 'ok' | 'back'): void {
    if (!this.open) return;
    const n = this.rows.length;
    this.onSound(a === 'up' || a === 'down' ? 'ui_move' : a === 'ok' ? 'ui_ok' : this.stack.length > 1 ? 'ui_back' : 'ui_close');
    if (a === 'up' && n) this.select((this.sel + n - 1) % n);
    else if (a === 'down' && n) this.select((this.sel + 1) % n);
    else if (a === 'back') this.back();
    else if (a === 'ok' && n) { const r = this.rows[this.sel]!; this.onPick(this.page, r.id); }
  }
  /** Menu sounds (set by the app). */
  onSound: (id: string) => void = () => {};
}

// ------------------------------------------------------------ needs bars (mine in play, the followed person's in watch)
export function bar(label: string, lack: number): string {
  const v = Math.max(0, Math.min(100, 100 - lack));
  const col = v > 60 ? '#5cc98a' : v > 30 ? '#e8b64a' : '#e5625b';
  return `<span class="nb"><span class="nl">${label}</span><span class="nt"><i style="width:${Math.max(3, v)}%;background:${col}"></i></span></span>`;
}

// ------------------------------------------------------------ thought bubbles
export interface MindRow { id: number; act: number; to: string; dist: number; wish: string; wishWith: string; why: string; mood: string; said: string; pct: number; from: string }

const GOAL_KEY: Record<string, Key> = { drink: 'gDrink', eat: 'gEat', forage: 'gForage', sleep: 'gSleep', talk: 'gTalk', wander: 'gWander', rest: 'gRest', travel: 'gTravel',
  'gather wood': 'wGatherWood', 'gather stone': 'wGatherStone', 'gather scrap': 'wGatherScrap', 'make an axe': 'wAxe', 'make a spear': 'wSpear', 'build a campfire': 'wFire', 'build a hut': 'wHut', 'feed the fire': 'wTend',
  'collect food and store it': 'wStore', 'search the ruins': 'wLoot', 'plant a field': 'wFarm', 'repair the huts': 'wRepair' };
/** "3 wood, 1 stone, an axe" in the viewer's language. */
export function invWords(v?: Record<string, number>): string {
  const K: Record<string, Key> = { wood: 'iWood', stone: 'iStone', scrap: 'iScrap', axe: 'iAxe', spear: 'iSpear' };
  return Object.entries(v ?? {}).filter(([k, n]) => n > 0 && K[k]).map(([k, n]) => (k === 'axe' || k === 'spear' ? t(K[k]!) : `${n} ${t(K[k]!)}`)).join(', ');
}

export class Bubbles {
  private readonly box: HTMLDivElement;
  private readonly pool: { el: HTMLDivElement; a: HTMLDivElement; b: HTMLDivElement; p: HTMLDivElement; pi: HTMLElement; pct: number; id: number; text: string; act: number; ver: number; lx: number; ly: number }[] = [];
  private ver = 0;
  private readonly pt = { x: 0, y: 0 };
  data = new Map<number, MindRow>();

  constructor(private max = 10) {
    this.box = document.createElement('div');
    this.box.id = 'bubbles';
    document.body.appendChild(this.box);
    for (let k = 0; k < max; k++) {
      const el = document.createElement('div'); el.className = 'bub'; el.hidden = true;
      const a = document.createElement('div'); a.className = 'ba';
      const b = document.createElement('div'); b.className = 'bb';
      // An objective's progress bar (gold when it is an order: the owner's or a player's).
      const p = document.createElement('div'); p.className = 'bp'; p.hidden = true;
      const pi = document.createElement('i'); p.appendChild(pi);
      el.append(a, b, p);
      this.box.appendChild(el);
      this.pool.push({ el, a, b, p, pi, pct: -2, id: -1, text: '', act: -1, ver: -1, lx: 0, ly: 0 });
    }
  }

  set(list: unknown[], actName: (a: number) => string): void {
    this.data.clear();
    for (const r of list as (string | number)[][]) {
      const m: MindRow = { id: r[0] as number, act: r[1] as number, to: String(r[2] ?? ''), dist: Number(r[3]) || 0, wish: String(r[4] ?? ''), wishWith: String(r[5] ?? ''), why: String(r[6] ?? ''), mood: String(r[7] ?? ''), said: String(r[8] ?? ''), pct: typeof r[9] === 'number' ? r[9] : -1, from: String(r[10] ?? '') };
      this.data.set(m.id, m);
    }
    void actName;
    this.ver++;
  }

  hide(): void { for (const p of this.pool) { p.el.hidden = true; p.id = -1; } }

  private readonly cand = Array.from({ length: 48 }, () => ({ id: -1, x: 0, y: 0, d: 0 }));
  private readonly wp = { x: 0, y: 0 };

  /**
   * Place the bubbles of the people nearest the focus. `pos(id, out)` writes a person's drawn position (false = not in
   * view), `project` turns it into screen pixels. No allocation unless a text changes.
   */
  draw(pos: (id: number, out: { x: number; y: number }) => boolean, project: (x: number, z: number, out: { x: number; y: number }) => boolean, fx: number, fy: number, actName: (a: number) => string): void {
    let n = 0;
    for (const id of this.data.keys()) {
      if (n >= this.cand.length) break;
      if (!pos(id, this.wp)) continue;
      const c = this.cand[n++]!;
      c.id = id; c.x = this.wp.x; c.y = this.wp.y; c.d = Math.hypot(c.x - fx, c.y - fy);
    }
    // Selection of the nearest (n is small: at most 48).
    let k = 0;
    for (; k < this.pool.length && k < n; k++) {
      let best = k;
      for (let j = k + 1; j < n; j++) if (this.cand[j]!.d < this.cand[best]!.d) best = j;
      if (best !== k) { const tmp = this.cand[k]!; this.cand[k] = this.cand[best]!; this.cand[best] = tmp; }
      const c = this.cand[k]!, b = this.pool[k]!, m = this.data.get(c.id)!;
      if (!project(c.x, c.y, this.pt)) { b.el.hidden = true; continue; }
      if (b.id !== c.id || b.act !== m.act || b.ver !== this.ver) {
        const first = actName(m.act) + (m.to ? ' · ' + tf('bWith', m.to) : '') + (m.dist >= 3 ? ` · ${m.dist} m` : '');
        const wish = m.wish === 'task' ? m.why : m.wish ? tf('bWants', t(GOAL_KEY[m.wish] ?? 'gWander') + (m.wishWith ? ' ' + tf('bWith', m.wishWith) : '')) + (m.why ? ` (${m.why})` : '') : '';
        const second = [m.said ? `“${m.said}”` : '', wish].filter(Boolean).join(' · ');
        const text = first + '|' + second;
        if (b.text !== text) { b.text = text; b.a.textContent = first; b.b.textContent = second; b.b.hidden = !second; }
        const pct = m.wish === 'task' ? m.pct : -1;
        if (b.pct !== pct) { b.pct = pct; b.p.hidden = pct < 0; if (pct >= 0) { b.pi.style.width = `${Math.max(6, pct)}%`; b.p.className = m.from ? 'bp ord' : 'bp'; } }
        b.id = c.id; b.act = m.act; b.ver = this.ver;
      }
      b.el.hidden = false;
      const rx = Math.round(this.pt.x), ry = Math.round(this.pt.y);
      if (rx !== b.lx || ry !== b.ly) { b.lx = rx; b.ly = ry; b.el.style.transform = `translate(${rx}px, ${ry}px) translate(-50%, -100%)`; }
    }
    for (; k < this.pool.length; k++) { this.pool[k]!.el.hidden = true; this.pool[k]!.id = -1; }
  }
}

// ------------------------------------------------------------ person card text (watch mode / menu page)
export interface PersonInfo {
  id: number; name: string; sex: 'f' | 'm'; age: number; alive: boolean; cause?: string; personality: string[]; generation: number; pregnant: boolean;
  partner: string | null; parents: string[]; children: string[]; traits: Record<string, number>;
  act?: number; hunger?: number; thirst?: number; tired?: number; lonely?: number; hp?: number; carry?: number; inv?: Record<string, number>;
  mind?: { mood: string; plan: { act: string; with: string | null; why: string } | null; memory: string; said: string | null; recent: string[] };
  goal?: { text: string; from: string; k: number; n: number; step: string; pct: number } | null; level?: number; xp?: number;
  isPlayer?: boolean; stage?: string; siblings?: string[]; chosen?: { name: string; role: string }[]; carer?: string | null; held?: boolean;
}
export const STAGE_KEY: Record<string, Key> = { baby: 'stBaby', toddler: 'stToddler', child: 'stChild', teen: 'stTeen', adult: 'stAdult' };
const TRAIT_KEY: Record<string, Key> = { strength: 'tStrength', speed: 'tSpeed', intelligence: 'tIntelligence', courage: 'tCourage', empathy: 'tEmpathy', metabolism: 'tMetabolism', lifespan: 'tLifespan' };

/** HTML for the side card (short) or the menu page (full). Escapes everything. */
export function personHtml(p: PersonInfo, actName: (a: number) => string, full: boolean): string {
  const e = (s: string) => s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
  const head = `<div class="pn">${e(p.name)}</div><div class="ps">${p.sex === 'f' ? t('pWoman') : t('pMan')} · ${tf('pAge', String(p.age))}${p.stage && p.stage !== 'adult' ? ' · ' + t(STAGE_KEY[p.stage] ?? 'stChild') : p.age < 16 ? ' · ' + t('pChild') : ''}${p.carer ? ' · ' + e(tf('famLooked', p.carer)) : ''}${p.pregnant ? ' · ' + t('pExpecting') : ''}</div>`;
  if (!p.alive) return head + `<div class="ps">${t('pDead')}${p.cause ? ' (' + e(p.cause) + ')' : ''}</div>`;
  const lines = [head, `<div class="pa">${e(actName(p.act ?? 0))}${p.carry ? ' · ' + tf('carry', String(p.carry)) : ''}${invWords(p.inv) ? ' · ' + e(tf('has', invWords(p.inv))) : ''}</div>`,
    `<div class="pbars">${bar(t('nFood'), p.hunger ?? 0)}${bar(t('nWater'), p.thirst ?? 0)}${bar(t('nRest'), p.tired ?? 0)}${bar(t('nFun'), p.lonely ?? 0)}${bar(t('nHp'), 100 - (p.hp ?? 100))}</div>`];
  if (p.goal) lines.push(`<div class="pm">${t('pGoal')}: <b>${e(p.goal.text)}</b> · ${Math.min(p.goal.k + 1, p.goal.n)}/${p.goal.n}</div><div class="bp${p.goal.from !== 'myself' ? ' ord' : ''}"><i style="width:${Math.max(6, p.goal.pct)}%"></i></div>`);
  if (p.level !== undefined) lines.push(`<div class="pm">${tf('pLevel', String(p.level), String(p.xp ?? 0))}</div>`);
  if (p.mind) {
    const m = p.mind;
    lines.push(`<div class="pm">${t('pMood')}: <b>${e(m.mood)}</b>${m.plan ? ` · ${t('pWants')} ${e(t(GOAL_KEY[m.plan.act] ?? 'gWander'))}${m.plan.with ? ' ' + e(tf('bWith', m.plan.with)) : ''}${m.plan.why ? ' (' + e(m.plan.why) + ')' : ''}` : ''}</div>`);
    if (m.said) lines.push(`<div class="pm">${t('pSaid')}: “${e(m.said)}”</div>`);
  }
  if (!full) return lines.join('');
  lines.push(`<div class="pm">${e(p.personality.join(', '))} · ${tf('pGen', String(p.generation))}</div>`,
    `<div class="pm">${t('pPartner')}: ${e(p.partner ?? t('pNone'))} · ${t('pParents')}: ${e(p.parents.join(', ') || t('pFirst'))} · ${t('pChildren')}: ${e(p.children.join(', ') || t('pNone'))}${p.siblings?.length ? ' · ' + e(p.siblings.join(', ')) : ''}</div>`,
    `<div class="pm">${t('pTraits')}: ${Object.entries(p.traits).map(([k, v]) => `${t(TRAIT_KEY[k] ?? 'tStrength')} ${k === 'lifespan' ? v : Math.round(v * 100) + '%'}`).join(' · ')}</div>`);
  if (p.mind?.memory) lines.push(`<div class="pm">${t('pMemory')}: ${e(p.mind.memory)}</div>`);
  if (p.mind?.recent.length) lines.push(`<div class="pm">${t('pRecent')}: ${e(p.mind.recent.join(' · '))}</div>`);
  return lines.join('');
}
