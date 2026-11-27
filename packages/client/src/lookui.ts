/**
 * The TV "How I look" page (imad 2026-11-27: "better customisation"): woman / man, skin tone, hair style and colour, beard, build,
 * the colour of the top and of the trousers. OK on a row picks the next choice (◀ ▶ too); Save sends Do `look`
 * "sex:skin:hair:hairColour:build:top:pants:beard" (protocol look.ts). Texts in 4 languages; app.ts only asks for the page and picks.
 */
import { SKIN_TONES, HAIR_COLOURS, TOP_COLOURS, PANTS_COLOURS, HAIR_STYLES, BEARDS, BUILDS } from '@worldsim/protocol';
import { getLang } from './i18n.js';
import type { Row } from './ui.js';

type L = 'en' | 'fr' | 'es' | 'ar';
const S: Record<L, Record<string, string>> = {
  en: { hair: 'Hair', hairColour: 'Hair colour', beard: 'Beard', build: 'Build', top: 'Top colour', pants: 'Trousers colour', help: 'OK changes a row. Then Save.',
    short: 'Short', crop: 'Cropped', swept: 'Swept fringe', curly: 'Curly', long: 'Long', ponytail: 'Ponytail', bun: 'Bun', bald: 'Bald',
    none: 'None', moustache: 'Moustache', bshort: 'Short beard', full: 'Full beard', slim: 'Slim', average: 'Average', broad: 'Broad shoulders', heavy: 'Heavy' },
  fr: { hair: 'Cheveux', hairColour: 'Couleur des cheveux', beard: 'Barbe', build: 'Carrure', top: 'Couleur du haut', pants: 'Couleur du pantalon', help: 'OK change une ligne. Puis Enregistrer.',
    short: 'Courts', crop: 'Ras', swept: 'Mèche', curly: 'Bouclés', long: 'Longs', ponytail: 'Queue de cheval', bun: 'Chignon', bald: 'Chauve',
    none: 'Aucune', moustache: 'Moustache', bshort: 'Barbe courte', full: 'Barbe pleine', slim: 'Mince', average: 'Moyenne', broad: 'Larges épaules', heavy: 'Fort' },
  es: { hair: 'Pelo', hairColour: 'Color del pelo', beard: 'Barba', build: 'Complexión', top: 'Color de la camisa', pants: 'Color del pantalón', help: 'OK cambia una fila. Luego Guardar.',
    short: 'Corto', crop: 'Rapado', swept: 'Flequillo', curly: 'Rizado', long: 'Largo', ponytail: 'Coleta', bun: 'Moño', bald: 'Calvo',
    none: 'Ninguna', moustache: 'Bigote', bshort: 'Barba corta', full: 'Barba completa', slim: 'Delgado', average: 'Normal', broad: 'Espalda ancha', heavy: 'Robusto' },
  ar: { hair: 'الشعر', hairColour: 'لون الشعر', beard: 'اللحية', build: 'البنية', top: 'لون القميص', pants: 'لون السروال', help: 'OK يغيّر السطر. ثم حفظ.',
    short: 'قصير', crop: 'محلوق', swept: 'غرة جانبية', curly: 'مجعد', long: 'طويل', ponytail: 'ذيل حصان', bun: 'كعكة', bald: 'أصلع',
    none: 'بدون', moustache: 'شارب', bshort: 'لحية قصيرة', full: 'لحية كاملة', slim: 'نحيف', average: 'متوسط', broad: 'أكتاف عريضة', heavy: 'ممتلئ' },
};
const tx = (k: string) => (S[getLang() as L] ?? S.en)[k] ?? S.en[k] ?? k;

export interface LookDraft { sex: 'f' | 'm'; skin: number; hair: number; hairColour: number; build: number; top: number; pants: number; beard: number }
export const lookDraft: LookDraft = { sex: 'm', skin: 1, hair: 0, hairColour: 1, build: 1, top: 2, pants: 0, beard: 0 };
/** Start from what my character has now (`me.look` from the server, protocol look.ts LookParts). */
export function draftFrom(c: { sex: 'f' | 'm'; skin: number; look?: { hair: number; hairColour: number; build: number; top: number; pants: number; beard: number } } | null): void {
  lookDraft.sex = c?.sex ?? 'm'; lookDraft.skin = c?.skin ?? 1;
  if (c?.look) Object.assign(lookDraft, { hair: c.look.hair, hairColour: c.look.hairColour, build: c.look.build, top: c.look.top, pants: c.look.pants, beard: c.look.beard });
}
const hex = (c: number) => '#' + c.toString(16).padStart(6, '0');
const N: Record<string, number> = { hair: HAIR_STYLES.length, hairColour: HAIR_COLOURS.length, beard: BEARDS.length, build: BUILDS.length, top: TOP_COLOURS.length, pants: PANTS_COLOURS.length };

/** The extra rows (after woman / man and the skin tones). */
export function lookRows(): Row[] {
  const d = lookDraft, rows: Row[] = [
    { id: 'lk:hair', label: tx('hair'), value: tx(HAIR_STYLES[d.hair] ?? 'short') },
    { id: 'lk:hairColour', label: tx('hairColour'), value: `${d.hairColour + 1} / ${N.hairColour}` },
  ];
  if (d.sex === 'm') rows.push({ id: 'lk:beard', label: tx('beard'), value: tx(d.beard === 2 ? 'bshort' : BEARDS[d.beard] ?? 'none') });
  rows.push({ id: 'lk:build', label: tx('build'), value: tx(BUILDS[d.build] ?? 'average') },
    { id: 'lk:top', label: tx('top'), value: `${d.top + 1} / ${N.top}` },
    { id: 'lk:pants', label: tx('pants'), value: `${d.pants + 1} / ${N.pants}` });
  return rows;
}
export const lookHelp = () => tx('help');
/** Swatches of the chosen colours (skin, hair, top, trousers) for the page's header. */
export function lookSwatches(): string {
  const d = lookDraft, sw = (c: number, label: string) => `<span class="sw on" title="${label}" style="background:${hex(c)}"></span>`;
  return `<div class="sws">${sw(SKIN_TONES[d.skin] ?? 0, '')}${sw(HAIR_COLOURS[d.hairColour] ?? 0, tx('hairColour'))}${sw(TOP_COLOURS[d.top] ?? 0, tx('top'))}${sw(PANTS_COLOURS[d.pants] ?? 0, tx('pants'))}</div>`;
}
/** OK (dir 1) or ◀ (-1) on a row: the next / previous choice. True = it was one of these rows. */
export function lookPick(row: string, dir = 1): boolean {
  if (!row.startsWith('lk:')) return false;
  const k = row.slice(3) as keyof LookDraft, n = N[k];
  if (!n) return false;
  (lookDraft as unknown as Record<string, number>)[k] = (((lookDraft[k] as number) + dir) % n + n) % n;
  return true;
}
export function lookText(): string {
  const d = lookDraft;
  return `${d.sex}:${d.skin}:${d.hair}:${d.hairColour}:${d.build}:${d.top}:${d.pants}:${d.sex === 'f' ? 0 : d.beard}`;
}
