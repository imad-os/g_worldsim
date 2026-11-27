/**
 * The bag & crafting screen and the gear screen (imad 2026-11-25: "like Minecraft, graphical, not just text"):
 * slots with item icons (gfx/items.ts, CC0 models rendered), a 3 x 3 crafting grid with the result, a recipe book,
 * a 9 x 4 bag; the gear screen shows my character in 3D with what I wear and hold, the slots, and the upgrades
 * (level +0..+10, quality normal .. elite). Both are pages of the game menu (ui.ts Menu with a `grid`): the D-pad /
 * arrows move a cursor between the boxes, A / OK does the thing under it, B / Back goes back.
 */
import { WebGLRenderer, Scene, PerspectiveCamera, HemisphereLight, DirectionalLight, Mesh, CircleGeometry, MeshLambertMaterial, NeutralToneMapping } from 'three';
import {
  RESOURCES, CATEGORIES, RECIPES_ALL, PLACEABLE, MEDKIT_HEAL, WEAPONS, DEFENCE, BOW_DAMAGE, SLOT_OF, QUALITY_COLOR, MAX_LEVEL, baseOf, gearMul, levelCost, qualityCost, qualityNeedsLevel, packGear, matchRecipe,
  type Recipe, type GearState, type Slot, type Anim,
  itemText,
} from '@worldsim/protocol';
import { t, tf, getLang, type Key } from './i18n.js';
import { iconStyle, hasIcon } from './gfx/items.js';
import { People, type PersonLook } from './gfx/people.js';

export interface InvCtx {
  inv(): Record<string, number>;
  gear(): (GearState & { use?: Partial<Record<Slot, string>> }) | undefined;
  thing(k: string): string;
  catName(c: string): string;
  send(a: string, text: string): void;
  note(s: string, ms: number): void;
  close(): void;
  look(): PersonLook;
  /** Open another page of the game menu (the bag screen opens crafting). */
  open(page: string): void;
}

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);
const GEAR_ITEMS = ['sword', 'axe', 'spear', 'bow', 'arrows', 'clothes', 'armor', 'helmet', 'medkit'];
const ORDER = [...RESOURCES, ...GEAR_ITEMS, ...PLACEABLE] as string[];
const CAT_ICON: Record<string, string> = { weapon: 'sword', clothing: 'armor', defence: 'palisade', furniture: 'bed', healing: 'medkit' };
const qName = (q: number) => t(('qual' + q) as Key);
/** Icon size of the bag & crafting screen's slots (.inv .sl i = 4.8vw). */
const IK = 0.048;
/** Icon size in px: k = the icon's CSS width in vw / 100 (.sl i 3.6vw; crafting 4.8vw; big bag 6.6vw). The menu size setting scales the drawing, not these. */
const px = (k = 0.036) => Math.max(24, Math.round(innerWidth * k));

/** One slot: icon, count, quality frame, cursor. */
function slot(id: string, n: number, on: boolean, extra = '', q = -1, k = 0.036): string {
  const st = id ? iconStyle(id, px(k)) : '';
  const qc = q > 0 ? ` style="border-color:${QUALITY_COLOR[q]};box-shadow:0 0 0.6vw ${QUALITY_COLOR[q]} inset"` : '';
  const icon = id ? (st ? `<i style="${st}"></i>` : `<i class="tx">${esc(id.slice(0, 2))}</i>`) : '';
  return `<div class="sl${on ? ' on' : ''}${extra}"${qc}>${icon}${n > 1 ? `<b>${n}</b>` : ''}</div>`;
}
function costHtml(c: Partial<Record<string, number>>, inv: Record<string, number>, thing: (k: string) => string): string {
  return Object.entries(c).map(([k, n]) => {
    const ok = (inv[k] ?? 0) >= n!;
    const st = hasIcon(k) ? iconStyle(k, Math.round(px() * 0.62)) : '';
    return `<span class="cc${ok ? '' : ' no'}">${st ? `<i style="${st}"></i>` : ''}${n} ${esc(thing(k))}</span>`;
  }).join('');
}

// ---------------------------------------------------------------- bag & crafting
type Zone = 'tabs' | 'grid' | 'result' | 'book' | 'bag';
export class InvScreen {
  zone: Zone = 'bag';
  i = 0;
  tab = 0;
  readonly cells: string[] = Array(9).fill('');
  /** How many times the grid's recipe is made at once (imad 2026-11-27: R2 adds one more batch, e.g. +5 arrows, with its materials). */
  batch = 1;
  constructor(private c: InvCtx) {}

  /** R2 / CH+ = one more batch if the bag has the materials for it, L2 / CH− = one less. */
  more(d: 1 | -1): void {
    const r = this.result(), c = this.c;
    if (!r) { c.note(t('invHintNone'), 1500); return; }
    if (d < 0) { this.batch = Math.max(1, this.batch - 1); return; }
    const inv = c.inv(), pot = this.pot(), n = this.batch + 1;
    const lack = Object.entries(pot).filter(([k, v]) => (inv[k] ?? 0) < v * n);
    if (lack.length) { c.note(tf('invBatchMax', lack.map(([k, v]) => `${v * n - (inv[k] ?? 0)} ${c.thing(k)}`).join(', ')), 2500); return; }
    this.batch = n;
  }
  /** What one more batch / all of them use, as words ("10 wood + 5 stone"). */
  private uses(): string { return Object.entries(this.pot()).map(([k, v]) => `${v * this.batch} ${this.c.thing(k)}`).join(' + '); }

  /** What is in the crafting grid, as counts. */
  pot(): Record<string, number> { const p: Record<string, number> = {}; for (const k of this.cells) if (k) p[k] = (p[k] ?? 0) + 1; return p; }
  clear(): void { this.cells.fill(''); this.batch = 1; }
  /** The bag minus what sits in the grid, in a fixed order. */
  bag(): [string, number][] {
    const inv = this.c.inv(), pot = this.pot(), out: [string, number][] = [];
    const keys = Object.keys(inv).filter((k) => (inv[k] ?? 0) > 0).sort((a, b) => (ORDER.indexOf(a) + 1 || 99) - (ORDER.indexOf(b) + 1 || 99));
    for (const k of keys) { const n = (inv[k] ?? 0) - (pot[k] ?? 0) * this.batch; if (n > 0) out.push([k, n]); }
    return out;
  }
  /** What the grid makes: in the open category first, else in another one (same ingredients, other category). */
  result(): Recipe | null {
    const pot = this.pot();
    if (!Object.keys(pot).length) return null;
    const cat = CATEGORIES[this.tab]!;
    return matchRecipe(cat, pot) ?? CATEGORIES.map((k) => matchRecipe(k, pot)).find((r) => r) ?? null;
  }
  book(): Recipe[] { return RECIPES_ALL.filter((r) => r.cat === CATEGORIES[this.tab]); }

  html(): string {
    const c = this.c, inv = c.inv(), z = this.zone, res = this.result(), book = this.book(), bag = this.bag();
    const tabs = CATEGORIES.map((k, i) => `<div class="tb${i === this.tab ? ' cur' : ''}${z === 'tabs' && this.i === i ? ' on' : ''}">${hasIcon(CAT_ICON[k]!) ? `<i style="${iconStyle(CAT_ICON[k]!, Math.round(px() * 0.7))}"></i>` : ''}${esc(c.catName(k))}</div>`).join('');
    const grid = this.cells.map((k, i) => slot(k, 1, z === 'grid' && this.i === i, '', -1, IK)).join('');
    const out = res ? slot(res.what, (res.n ?? 1) * this.batch, z === 'result', res.cat !== CATEGORIES[this.tab] ? ' other' : '', -1, IK) : slot('', 0, z === 'result', ' empty');
    const bk = book.map((r, i) => {
      const can = Object.entries(r.need).every(([k, n]) => (inv[k] ?? 0) >= n!);
      return slot(r.what, r.n ?? 1, z === 'book' && this.i === i, can ? ' can' : ' cant', -1, IK);
    }).join('');
    const bg = Array.from({ length: 36 }, (_, i) => { const it = bag[i]; return slot(it?.[0] ?? '', it?.[1] ?? 0, z === 'bag' && this.i === i, '', it && SLOT_OF[it[0]] ? (c.gear()?.up?.[it[0]]?.[1] ?? 0) : -1, IK); }).join('');
    // What the cursor is on, and what A does there.
    let name = '', hint = '';
    if (z === 'tabs') { name = c.catName(CATEGORIES[this.i]!); hint = t('invHintTab'); }
    else if (z === 'grid') { const k = this.cells[this.i]!; name = k ? c.thing(k) : t('invEmpty'); hint = k ? t('invHintGrid') : t('invHintNone'); }
    else if (z === 'result') { name = res ? `${tf('invBatch', c.thing(res.what), String((res.n ?? 1) * this.batch), this.uses())}${res.cat !== CATEGORIES[this.tab] ? ' · ' + tf('invIn', c.catName(res.cat)) : ''}` : t('invEmpty'); hint = res ? `${tf('invHintMake', c.thing(res.what))} · ${t('invMore')}` : t('invHintNone'); }
    else if (z === 'book') { const r = book[this.i]; if (r) { name = `${c.thing(r.what)} = ${Object.entries(r.need).map(([k, n]) => `${n} ${c.thing(k)}`).join(' + ')}`; hint = t('invHintBook'); } }
    else { const it = bag[this.i]; if (it) { const [k] = it, up = c.gear()?.up?.[k]; name = `${c.thing(k)}${up && (up[0] || up[1]) ? ` +${up[0]} · ${qName(up[1])}` : ''}`; hint = (RESOURCES as readonly string[]).includes(k) ? t('invHintRes') : k === 'medkit' ? tf('invHintHeal', String(MEDKIT_HEAL)) : SLOT_OF[k] ? t('invHintGear') : (PLACEABLE as readonly string[]).includes(k) ? t('invHintPlace') : ''; } else name = t('invEmpty'); }
    return `<div class="inv"><div class="tabs">${tabs}</div>
<div class="ic"><div class="il"><div class="r1"><div class="box"><div class="bt">${esc(t('invCraft'))}</div><div class="cr"><div class="cg">${grid}</div><div class="arr">➜</div>${out}</div></div></div>
<div class="box bkb"><div class="bt">${esc(t('invBook'))}</div><div class="bk">${bk}</div></div>
<div class="ds"><b>${esc(name)}</b><span>${esc(hint)}</span></div></div>
<div class="box"><div class="bt">${esc(t('invBag'))}</div><div class="bg">${bg}</div></div></div>
<div class="nv">${esc(t('invNav'))}</div></div>`;
  }

  move(d: 'up' | 'down' | 'left' | 'right'): void {
    // Left: the tabs, the 3 x 3 grid -> result, the recipe book under it (3 a row). Right: the bag, 6 x 6.
    const z = this.zone, i = this.i, nb = this.book().length, nt = CATEGORIES.length;
    const go = (zone: Zone, k: number) => { this.zone = zone; this.i = k; };
    if (z === 'tabs') {
      if (d === 'left' || d === 'right') { this.i = (i + (d === 'left' ? nt - 1 : 1)) % nt; this.tab = this.i; }
      else if (d === 'down') go('grid', Math.min(i, 2));
    } else if (z === 'grid') {
      const r = Math.floor(i / 3), c = i % 3;
      if (d === 'left' && c > 0) this.i--;
      else if (d === 'right') { if (c < 2) this.i++; else go('result', 0); }
      else if (d === 'up') { if (r > 0) this.i -= 3; else go('tabs', this.tab); }
      else if (d === 'down') { if (r < 2) this.i += 3; else if (nb) go('book', Math.min(nb - 1, c)); }
    } else if (z === 'result') {
      if (d === 'left') go('grid', 5);
      else if (d === 'right') go('bag', 0);
      else if (d === 'up') go('tabs', this.tab);
      else if (d === 'down' && nb) go('book', Math.min(nb - 1, 2));
    } else if (z === 'book') {
      const r = Math.floor(i / 3), c = i % 3;
      if (d === 'left' && c > 0) this.i--;
      else if (d === 'right') { if (c < 2 && i + 1 < nb) this.i++; else go('bag', Math.min(5, 6 * (r + 2))); }
      else if (d === 'up') { if (r > 0) this.i -= 3; else go('grid', 6 + c); }
      else if (d === 'down' && i + 3 < nb) this.i += 3;
    } else {
      const r = Math.floor(i / 6), c = i % 6;
      if (d === 'left') { if (c > 0) this.i--; else if (r === 0) go('result', 0); else if (nb) go('book', Math.min(nb - 1, Math.min(Math.floor((nb - 1) / 3), r - 1) * 3 + 2)); else go('result', 0); }
      else if (d === 'right' && c < 5) this.i++;
      else if (d === 'down' && r < 5) this.i += 6;
      else if (d === 'up') { if (r > 0) this.i -= 6; else go('tabs', this.tab); }
    }
  }

  ok(): void {
    const c = this.c, z = this.zone;
    if (z === 'tabs') { this.tab = this.i; return; }
    if (z === 'grid') { this.cells[this.i] = ''; this.batch = 1; return; }
    if (z === 'result') {
      const r = this.result();
      if (!r) { c.note(t('invHintNone'), 2000); return; }
      c.send('craft', `${r.cat}:${Object.entries(this.pot()).map(([k, n]) => `${k}=${n}`).join(',')}${this.batch > 1 ? '*' + this.batch : ''}`);
      return;
    }
    if (z === 'book') {
      const r = this.book()[this.i];
      if (!r) return;
      const inv = c.inv(), lack = Object.entries(r.need).filter(([k, n]) => (inv[k] ?? 0) < n!);
      if (lack.length) { c.note(tf('invMissing', lack.map(([k, n]) => `${n! - (inv[k] ?? 0)} ${c.thing(k)}`).join(', ')), 3000); return; }
      this.clear();
      let k = 0;
      for (const [res, n] of Object.entries(r.need)) for (let j = 0; j < n! && k < 9; j++) this.cells[k++] = res;
      this.zone = 'result'; this.i = 0;
      return;
    }
    const it = this.bag()[this.i];
    if (!it) return;
    const [k] = it;
    if ((RESOURCES as readonly string[]).includes(k)) {
      const free = this.cells.indexOf('');
      if (free < 0) { c.note(t('invHintGrid'), 1500); return; }
      this.cells[free] = k; this.batch = 1;
      if (!this.bag()[this.i]) this.i = Math.max(0, this.i - 1);
    } else if (k === 'medkit') c.send('medkit', '');
    else if (SLOT_OF[k]) c.send('equip', `${SLOT_OF[k]}:${k}`);
    else if ((PLACEABLE as readonly string[]).includes(k)) { c.send('place', k); c.close(); }
  }
}

// ---------------------------------------------------------------- the bag, big (imad 2026-11-25: "a bag screen, bigger")
export class BagScreen {
  i = 0;
  constructor(private c: InvCtx) {}
  items(): [string, number][] {
    const inv = this.c.inv();
    return Object.keys(inv).filter((k) => (inv[k] ?? 0) > 0).sort((a, b) => (ORDER.indexOf(a) + 1 || 99) - (ORDER.indexOf(b) + 1 || 99)).map((k) => [k, inv[k]!]);
  }
  /** Keep the cursor on something after the bag changed. */
  fix(): void { this.i = Math.max(0, Math.min(this.i, this.items().length - 1)); }
  /** What it is / does (the item's phrase, protocol/items.ts, after its numbers), and what A does. */
  private what(k: string): [string, string] {
    const [d, a] = this.what0(k), info = itemText(k, getLang());
    if (!info) return [d, a];
    return [WEAPONS[k] || k === 'bow' || DEFENCE[k] ? `${d} · ${info}` : info, a];
  }
  private what0(k: string): [string, string] {
    const up = this.c.gear()?.up?.[k] ?? [0, 0];
    if (k === 'medkit') return [tf('dsHeal', String(MEDKIT_HEAL)), tf('invHintHeal', String(MEDKIT_HEAL))];
    if (k === 'arrows') return [t('dsArrows'), ''];
    if (WEAPONS[k] || k === 'bow') return [`${t('gDamage')} ${((WEAPONS[k] ?? BOW_DAMAGE) * gearMul(up[0], up[1])).toFixed(1)}${up[0] || up[1] ? ` · +${up[0]} ${qName(up[1])}` : ''}`, t('invHintGear')];
    if (DEFENCE[k]) return [`${t('gDefence')} ${Math.round(DEFENCE[k]! * gearMul(up[0], up[1]) * 100)} %${up[0] || up[1] ? ` · +${up[0]} ${qName(up[1])}` : ''}`, t('invHintGear')];
    if ((PLACEABLE as readonly string[]).includes(k)) return [t('dsPlace'), t('invHintPlace')];
    if ((RESOURCES as readonly string[]).includes(k)) return [k === 'herb' ? t('dsHerb') : t('dsMat'), t('bagHintCraft')];
    return ['', ''];
  }
  html(): string {
    const c = this.c, items = this.items(), n = Math.max(24, Math.ceil(items.length / 6) * 6);
    if (this.i >= items.length) this.fix();
    const cells = Array.from({ length: n }, (_, k) => {
      const it = items[k], q = it && SLOT_OF[it[0]] ? (c.gear()?.up?.[it[0]]?.[1] ?? 0) : -1;
      return `<div class="bc">${slot(it?.[0] ?? '', it?.[1] ?? 0, k === this.i && !!it, it ? ' xl' : ' xl empty', q, 0.066)}<span>${it ? esc(c.thing(it[0])) : ''}</span></div>`;
    }).join('');
    const cur = items[this.i];
    let side = `<p class="dim">${esc(t('bagEmptyAll'))}</p>`;
    if (cur) {
      const [k, cnt] = cur, [d, a] = this.what(k), st = iconStyle(k, px(0.13));
      side = `<div class="bbig">${st ? `<i style="${st}"></i>` : ''}</div><div class="bname">${esc(c.thing(k))}</div><div class="bcnt">${esc(tf('bagCount', String(cnt)))}</div>
<div class="bdesc">${esc(d)}</div>${a ? `<div class="bact">${esc(a)}</div>` : ''}`;
    }
    return `<div class="bagv"><div class="box bgl"><div class="bgrid">${cells}</div></div><div class="box bside">${side}</div></div><div class="nv">${esc(t('bagNav'))}</div>`;
  }
  move(d: 'up' | 'down' | 'left' | 'right'): void {
    const n = this.items().length;
    if (!n) return;
    const k = d === 'left' ? -1 : d === 'right' ? 1 : d === 'up' ? -6 : 6;
    if (this.i + k >= 0 && this.i + k < n) this.i += k;
    else if (d === 'down' && Math.floor(this.i / 6) < Math.floor((n - 1) / 6)) this.i = n - 1;
  }
  ok(): void {
    const c = this.c, it = this.items()[this.i];
    if (!it) return;
    const [k] = it;
    if (k === 'medkit') c.send('medkit', '');
    else if (SLOT_OF[k]) c.send('equip', `${SLOT_OF[k]}:${k}`);
    else if ((PLACEABLE as readonly string[]).includes(k)) { c.send('place', k); c.close(); }
    else if ((RESOURCES as readonly string[]).includes(k)) c.open('inv');
  }
}

// ---------------------------------------------------------------- gear
const SLOTS: Slot[] = ['weapon', 'ranged', 'head', 'body'];
const SLOT_KEY: Record<Slot, Key> = { weapon: 'gSlotWeapon', ranged: 'gSlotRanged', head: 'gSlotHead', body: 'gSlotBody' };
const SLOT_ICON: Record<Slot, string> = { weapon: 'sword', ranged: 'bow', head: 'helmet', body: 'armor' };

export class GearScreen {
  col = 0;
  row = 0;
  opt = 0;
  private prev: GearPreview | null = null;
  constructor(private c: InvCtx) {}

  private slotNow(): Slot { return SLOTS[this.row0]!; }
  private row0 = 0;
  /** Choices for a slot: the best carried, nothing, then each thing carried for it. */
  options(s: Slot): string[] { const inv = this.c.inv(); return ['', '-', ...Object.keys(SLOT_OF).filter((k) => SLOT_OF[k] === s && (inv[k] ?? 0) > 0)]; }
  private used(s: Slot): string { return this.c.gear()?.use?.[s] ?? ''; }
  private up(k: string): [number, number] { return this.c.gear()?.up?.[k] ?? [0, 0]; }
  private stat(k: string, lv: number, q: number): string {
    if (!k) return '';
    const v = baseOf(k) * gearMul(lv, q);
    return SLOT_OF[k] === 'body' || SLOT_OF[k] === 'head' ? `${t('gDefence')} ${Math.round(v * 100)} %` : `${t('gDamage')} ${v.toFixed(1)}`;
  }

  html(): string {
    const c = this.c, inv = c.inv(), s = this.slotNow();
    const slots = SLOTS.map((k, i) => {
      const it = this.used(k), [lv, q] = it ? this.up(it) : [0, 0];
      const on = this.col === 0 && this.row0 === i, cur = this.row0 === i;
      return `<div class="gs${on ? ' on' : ''}${cur ? ' cur' : ''}">${slot(it || SLOT_ICON[k], 0, false, it ? '' : ' ghost', it ? q : -1)}<div><div class="gl">${esc(t(SLOT_KEY[k]))}</div><div class="gv">${it ? `${esc(c.thing(it))} <span style="color:${QUALITY_COLOR[q]}">+${lv} ${esc(qName(q))}</span>` : esc(k === 'weapon' ? t('gHands') : t('gNone'))}</div></div></div>`;
    }).join('');
    const opts = this.options(s), want = c.gear()?.[s] ?? '';
    const orow = opts.map((k, i) => {
      const on = this.col === 1 && this.row === 0 && this.opt === i, chosen = (want || '') === k;
      const lbl = k === '' ? t('gBest') : k === '-' ? t('gNone') : c.thing(k);
      const [, q] = k && k !== '-' ? this.up(k) : [0, 0];
      return `<div class="go${on ? ' on' : ''}${chosen ? ' cur' : ''}">${k && k !== '-' ? slot(k, inv[k] ?? 0, false, '', q) : `<div class="sl txt">${k === '' ? '★' : '∅'}</div>`}<span>${esc(lbl)}</span></div>`;
    }).join('');
    const it = this.used(s), [lv, q] = it ? this.up(it) : [0, 0];
    let detail = `<p class="dim">${esc(t('gEmpty'))}</p>`;
    if (it) {
      const lvOn = this.col === 1 && this.row === 1, qOn = this.col === 1 && this.row === 2;
      const lvTxt = lv >= MAX_LEVEL ? t('gMax') : `${this.stat(it, lv, q)} ➜ ${this.stat(it, lv + 1, q)}`;
      const needLv = qualityNeedsLevel(q);
      const qTxt = q >= 4 ? t('gMax') : lv < needLv ? tf('gNeedLv', String(needLv)) : `${qName(q)} ➜ <span style="color:${QUALITY_COLOR[q + 1]}">${esc(qName(q + 1))}</span>`;
      detail = `<div class="gd"><div class="gbig">${slot(it, 0, false, ' big', q)}<div><b style="color:${QUALITY_COLOR[q]}">${esc(c.thing(it))} +${lv}</b><div>${esc(qName(q))} · ${esc(this.stat(it, lv, q))}</div>
<div class="qbar">${[0, 1, 2, 3, 4].map((k) => `<i style="background:${k <= q ? QUALITY_COLOR[k] : 'rgba(255,255,255,.12)'}"></i>`).join('')}</div><div class="lbar">${Array.from({ length: MAX_LEVEL }, (_, k) => `<i class="${k < lv ? 'f' : ''}"></i>`).join('')}</div></div></div>
<div class="gb${lvOn ? ' on' : ''}${lv >= MAX_LEVEL ? ' off' : ''}"><b>${esc(t('gLevelUp'))}</b><span>${esc(lvTxt)}</span><div>${lv < MAX_LEVEL ? costHtml(levelCost(it, lv), inv, c.thing) : ''}</div></div>
<div class="gb${qOn ? ' on' : ''}${q >= 4 || lv < needLv ? ' off' : ''}"><b>${esc(t('gQualityUp'))}</b><span>${qTxt}</span><div>${q < 4 ? costHtml(qualityCost(it, q), inv, c.thing) : ''}</div></div></div>`;
    }
    // Totals.
    const w = this.used('weapon'), b = this.used('body'), h = this.used('head');
    const dmg = w ? baseOf(w) * gearMul(...this.up(w)) : 15;
    const def = Math.min(0.7, (b ? baseOf(b) * gearMul(...this.up(b)) : 0) + (h ? baseOf(h) * gearMul(...this.up(h)) : 0));
    return `<div class="gear"><div class="gp"><div id="gprev"></div><div class="gt"><span>⚔ ${dmg.toFixed(0)}</span><span>🛡 ${Math.round(def * 100)} %</span></div></div>
<div class="gsl">${slots}</div><div class="gr"><div class="gor">${orow}</div>${detail}</div></div><div class="nv">${esc(t('gNav'))}</div>`;
  }

  move(d: 'up' | 'down' | 'left' | 'right'): void {
    const hasItem = !!this.used(this.slotNow());
    if (this.col === 0) {
      if (d === 'up') this.row0 = (this.row0 + 3) % 4;
      else if (d === 'down') this.row0 = (this.row0 + 1) % 4;
      else if (d === 'right') { this.col = 1; this.row = 0; this.opt = Math.max(0, this.options(this.slotNow()).indexOf(this.c.gear()?.[this.slotNow()] ?? '')); }
      return;
    }
    const n = this.options(this.slotNow()).length;
    if (this.row === 0) {
      if (d === 'left') { if (this.opt > 0) this.opt--; else this.col = 0; }
      else if (d === 'right') this.opt = Math.min(n - 1, this.opt + 1);
      else if (d === 'down' && hasItem) this.row = 1;
    } else {
      if (d === 'up') this.row--;
      else if (d === 'down') this.row = Math.min(2, this.row + 1);
      else if (d === 'left') this.col = 0;
    }
  }

  ok(): void {
    const s = this.slotNow();
    if (this.col === 0) { this.move('right'); return; }
    if (this.row === 0) { const k = this.options(s)[this.opt] ?? ''; this.c.send('equip', `${s}:${k}`); return; }
    const it = this.used(s);
    if (it) this.c.send('upgrade', `${it}:${this.row === 1 ? 'lv' : 'q'}`);
  }

  /** Called every frame while the gear page is open: the preview follows its box. */
  draw(now: number): void {
    const box = document.getElementById('gprev');
    if (!box) { this.stop(); return; }
    this.prev ??= new GearPreview();
    const g = this.c.gear(), use = g?.use ?? {}, up = (k?: string) => (k ? g?.up?.[k] ?? [0, 0] : [0, 0]);
    const held = use.weapon || (use.ranged ? 'bow' : '');
    // Show the moves now and then: a swing with the weapon, or a shot with the bow.
    const cyc = now / 1000 % 5, anim: Anim = cyc > 3.6 ? (held === 'bow' ? 'shoot' : held ? 'attack' : 'use') : '';
    const code = packGear({ held, hq: up(held)[1]!, helmet: use.head === 'helmet', headQ: up(use.head)[1]!, body: use.body === 'armor' ? 'armor' : use.body === 'clothes' ? 'clothes' : '', bodyQ: up(use.body)[1]!, anim, seq: 0, back: !!use.ranged && held !== 'bow' });
    this.prev.draw(box, this.c.look(), code, anim ? cyc - 3.6 : 0, now / 1000);
  }
  stop(): void { this.prev?.dispose(); this.prev = null; }
}

/** My character on a small stage of its own (a second renderer, only while the gear screen is open). */
class GearPreview {
  private canvas = Object.assign(document.createElement('canvas'), { className: 'gpc' });
  private r: WebGLRenderer;
  private scene = new Scene();
  private cam = new PerspectiveCamera(30, 0.75, 0.1, 50);
  private people: People;
  private w = 0; private h = 0;
  constructor() {
    this.r = new WebGLRenderer({ canvas: this.canvas, antialias: true, alpha: true });
    this.r.setPixelRatio(1);
    this.r.toneMapping = NeutralToneMapping;
    this.scene.add(new HemisphereLight(0xeaf2ff, 0x4a3c30, 1.6));
    const key = new DirectionalLight(0xfff1d6, 2.4); key.position.set(-2, 4, 4); this.scene.add(key);
    const rim = new DirectionalLight(0xa8c8ff, 1.3); rim.position.set(3, 3, -4); this.scene.add(rim);
    const floor = new Mesh(new CircleGeometry(1.1, 40).rotateX(-Math.PI / 2), new MeshLambertMaterial({ color: 0x3a3428 }));
    this.scene.add(floor);
    this.people = new People(this.scene, 1, false);
    this.cam.position.set(0, 1.5, 5.3); this.cam.lookAt(0, 0.98, 0);
  }
  draw(box: HTMLElement, look: PersonLook, code: number, at: number, ts: number): void {
    if (this.canvas.parentElement !== box) { box.textContent = ''; box.appendChild(this.canvas); }
    const w = box.clientWidth, h = box.clientHeight;
    if (w !== this.w || h !== this.h) { this.w = w; this.h = h; this.r.setSize(w, h, false); this.cam.aspect = w / Math.max(1, h); this.cam.updateProjectionMatrix(); }
    const p = this.people;
    p.begin(); p.add(0, 0, Math.sin(ts * 0.6) * 0.9, 0, 0, look, false, 1, false, code, at); p.end();
    this.r.render(this.scene, this.cam);
  }
  dispose(): void { this.r.dispose(); this.r.forceContextLoss(); this.canvas.remove(); }
}
