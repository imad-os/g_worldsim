/**
 * The TV's trade screen (imad 2026-11-27: "a player can open a trade screen with another player and trade stuff").
 * Pages: tradeWho (players standing near me), tradeInvite (someone asks me), trade (both offers, accept / cancel), tradeAdd
 * (my bag: A adds one, "all" adds every one). The server (ops/trade.ts) keeps the trade; every change to an offer takes both
 * acceptances back, and the swap happens only when both have accepted the offers as they stand.
 * Kept apart from app.ts: app.ts only asks this module for a page, a pick, a server answer or a notice. Texts in 4 languages.
 */
import { Msg, TRADE_NEAR, QUALITY_COLOR, type TradeInvite, type TradeView } from '@worldsim/protocol';
import { getLang } from './i18n.js';
import type { Page, Row } from './ui.js';

const S = {
  en: { title: 'Trade', who: 'Trade with a player', none: 'No player near you. Stand next to another player (within {0} m) to trade.', asks: '{0} wants to trade with you.',
    yes: 'Trade', no: 'No thanks', asked: 'You asked {0} to trade. Waiting for an answer…', refused: '{0} does not want to trade now.', with: 'Trading with {0}',
    mine: 'You give', theirs: '{0} gives', nothing: 'nothing yet', add: 'Add from my bag', back1: 'Take back 1 {0}', accept: 'Accept the trade', unaccept: 'Accepted ✓ (A to take it back)',
    cancel: 'Cancel the trade', waitThem: 'Waiting for {0} to accept.', theyOk: '{0} accepted ✓', changed: 'The offer changed: look again before you accept.',
    addTitle: 'Add to my offer', addOne: '{0}', addAll: 'All of it: {0}', bagEmpty: 'Nothing left in your bag to give.', done: 'Trade done. You got: {0}', gotNothing: 'nothing (a gift)',
    closed: 'The trade was closed.', cancelled: '{0} cancelled the trade.', apart: 'The trade closed: you are too far apart.', left: 'The trade closed: {0} left.',
    help: 'Put what you give on your side. When you both accept, everything changes hands at once. If either offer changes, both must accept again.', withUp: 'its level goes with it',
    tradeNobody: 'Nobody there.', tradeNotPlayer: 'Only other players can trade.', tradeTooFar: 'Stand closer to trade (within {0} m).', tradeBusy: 'They are trading with someone else.',
    tradeBusyMe: 'You are already trading.', tradeNoInvite: 'That invite is gone.', tradeNone: 'No trade is open.', tradeNoMore: 'You have no more of that.', tradeTooMany: 'Too many different things.',
    tradeEmpty: 'Nothing is offered yet.', tradeLost: '{0} no longer has what was offered.', tradeNoRoom: '{0} has no room in the bag for it.', tradeBad: 'Not possible.', tradeDeclined: 'You said no.' },
  fr: { title: 'Échange', who: 'Échanger avec un joueur', none: 'Aucun joueur près de toi. Mets-toi à côté d\'un autre joueur (à {0} m) pour échanger.', asks: '{0} veut échanger avec toi.',
    yes: 'Échanger', no: 'Non merci', asked: 'Tu as proposé un échange à {0}. En attente de sa réponse…', refused: '{0} ne veut pas échanger maintenant.', with: 'Échange avec {0}',
    mine: 'Tu donnes', theirs: '{0} donne', nothing: 'rien pour l\'instant', add: 'Ajouter depuis mon sac', back1: 'Reprendre 1 {0}', accept: 'Accepter l\'échange', unaccept: 'Accepté ✓ (A pour revenir)',
    cancel: 'Annuler l\'échange', waitThem: 'En attente de l\'accord de {0}.', theyOk: '{0} a accepté ✓', changed: 'L\'offre a changé : regarde bien avant d\'accepter.',
    addTitle: 'Ajouter à mon offre', addOne: '{0}', addAll: 'Tout : {0}', bagEmpty: 'Plus rien à donner dans ton sac.', done: 'Échange fait. Tu as reçu : {0}', gotNothing: 'rien (un cadeau)',
    closed: 'L\'échange est fermé.', cancelled: '{0} a annulé l\'échange.', apart: 'Échange fermé : vous êtes trop loin l\'un de l\'autre.', left: 'Échange fermé : {0} est parti.',
    help: 'Mets ce que tu donnes de ton côté. Quand vous acceptez tous les deux, tout change de main d\'un coup. Si une offre change, il faut accepter à nouveau.', withUp: 'son niveau part avec',
    tradeNobody: 'Personne ici.', tradeNotPlayer: 'Seuls les autres joueurs peuvent échanger.', tradeTooFar: 'Approche-toi pour échanger (à {0} m).', tradeBusy: 'Ce joueur échange déjà avec quelqu\'un.',
    tradeBusyMe: 'Tu échanges déjà.', tradeNoInvite: 'Cette proposition n\'existe plus.', tradeNone: 'Aucun échange ouvert.', tradeNoMore: 'Tu n\'en as plus.', tradeTooMany: 'Trop de choses différentes.',
    tradeEmpty: 'Rien n\'est encore proposé.', tradeLost: '{0} n\'a plus ce qui était proposé.', tradeNoRoom: '{0} n\'a pas de place dans son sac.', tradeBad: 'Impossible.', tradeDeclined: 'Tu as dit non.' },
  es: { title: 'Intercambio', who: 'Intercambiar con un jugador', none: 'No hay ningún jugador cerca. Ponte al lado de otro jugador (a {0} m) para intercambiar.', asks: '{0} quiere intercambiar contigo.',
    yes: 'Intercambiar', no: 'No, gracias', asked: 'Propusiste un intercambio a {0}. Esperando respuesta…', refused: '{0} no quiere intercambiar ahora.', with: 'Intercambio con {0}',
    mine: 'Tú das', theirs: '{0} da', nothing: 'nada todavía', add: 'Añadir de mi bolsa', back1: 'Quitar 1 {0}', accept: 'Aceptar el intercambio', unaccept: 'Aceptado ✓ (A para retirarlo)',
    cancel: 'Cancelar el intercambio', waitThem: 'Esperando a que {0} acepte.', theyOk: '{0} aceptó ✓', changed: 'La oferta cambió: mírala antes de aceptar.',
    addTitle: 'Añadir a mi oferta', addOne: '{0}', addAll: 'Todo: {0}', bagEmpty: 'No te queda nada en la bolsa para dar.', done: 'Intercambio hecho. Recibiste: {0}', gotNothing: 'nada (un regalo)',
    closed: 'El intercambio se cerró.', cancelled: '{0} canceló el intercambio.', apart: 'Intercambio cerrado: estáis demasiado lejos.', left: 'Intercambio cerrado: {0} se fue.',
    help: 'Pon lo que das en tu lado. Cuando los dos aceptáis, todo cambia de manos a la vez. Si una oferta cambia, hay que aceptar otra vez.', withUp: 'su nivel va con él',
    tradeNobody: 'No hay nadie.', tradeNotPlayer: 'Solo otros jugadores pueden intercambiar.', tradeTooFar: 'Acércate para intercambiar (a {0} m).', tradeBusy: 'Está intercambiando con otra persona.',
    tradeBusyMe: 'Ya estás intercambiando.', tradeNoInvite: 'Esa propuesta ya no existe.', tradeNone: 'No hay ningún intercambio abierto.', tradeNoMore: 'No tienes más.', tradeTooMany: 'Demasiadas cosas distintas.',
    tradeEmpty: 'Aún no se ofrece nada.', tradeLost: '{0} ya no tiene lo ofrecido.', tradeNoRoom: '{0} no tiene sitio en la bolsa.', tradeBad: 'No es posible.', tradeDeclined: 'Dijiste que no.' },
  ar: { title: 'تبادل', who: 'التبادل مع لاعب', none: 'لا يوجد لاعب قربك. قف بجانب لاعب آخر (على بعد {0} م) للتبادل.', asks: '{0} يريد التبادل معك.',
    yes: 'تبادل', no: 'لا شكرًا', asked: 'طلبت من {0} التبادل. في انتظار الرد…', refused: '{0} لا يريد التبادل الآن.', with: 'تبادل مع {0}',
    mine: 'تعطي', theirs: '{0} يعطي', nothing: 'لا شيء بعد', add: 'إضافة من حقيبتي', back1: 'استرجاع 1 {0}', accept: 'قبول التبادل', unaccept: 'تم القبول ✓ (A للتراجع)',
    cancel: 'إلغاء التبادل', waitThem: 'في انتظار قبول {0}.', theyOk: '{0} قبل ✓', changed: 'تغير العرض: انظر جيدًا قبل القبول.',
    addTitle: 'إضافة إلى عرضي', addOne: '{0}', addAll: 'الكل: {0}', bagEmpty: 'لم يبق في حقيبتك ما تعطيه.', done: 'تم التبادل. حصلت على: {0}', gotNothing: 'لا شيء (هدية)',
    closed: 'أُغلق التبادل.', cancelled: 'ألغى {0} التبادل.', apart: 'أُغلق التبادل: أنتما بعيدان جدًا.', left: 'أُغلق التبادل: غادر {0}.',
    help: 'ضع ما تعطيه في جهتك. عندما تقبلان معًا ينتقل كل شيء دفعة واحدة. إن تغير أي عرض فعليكما القبول من جديد.', withUp: 'ينتقل مستواه معه',
    tradeNobody: 'لا أحد هناك.', tradeNotPlayer: 'التبادل مع اللاعبين الآخرين فقط.', tradeTooFar: 'اقترب للتبادل (على بعد {0} م).', tradeBusy: 'إنه يتبادل مع شخص آخر.',
    tradeBusyMe: 'أنت تتبادل بالفعل.', tradeNoInvite: 'هذا الطلب لم يعد قائمًا.', tradeNone: 'لا يوجد تبادل مفتوح.', tradeNoMore: 'لم يعد لديك منه.', tradeTooMany: 'أشياء مختلفة كثيرة.',
    tradeEmpty: 'لم يُعرض شيء بعد.', tradeLost: 'لم يعد لدى {0} ما عرضه.', tradeNoRoom: 'لا مكان في حقيبة {0}.', tradeBad: 'غير ممكن.', tradeDeclined: 'قلت لا.' },
} as const;
type K = keyof typeof S.en;
const lang = () => (['en', 'fr', 'es', 'ar'].includes(getLang()) ? getLang() : 'en') as keyof typeof S;
export const ts = (k: K, ...a: string[]): string => ((S[lang()] as Record<string, string>)[k] ?? S.en[k]).replace(/\{(\d)\}/g, (_, i) => a[Number(i)] ?? '');
const esc = (x: string) => x.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]!));
const PAGES = new Set(['trade', 'tradeAdd', 'tradeWho', 'tradeInvite']);

export interface TradeCtx {
  send: (m: Record<string, unknown>) => void;
  /** Open this page (the menu opens if closed). */
  show: (page: string) => void;
  refresh: (page: string) => void;
  /** The page on top now ('' = the menu is closed). */
  page: () => string;
  close: () => void;
  note: (text: string, ms?: number) => void;
  thing: (k: string) => string;
  /** "+4 epic" for a gear upgrade. */
  upText: (lv: number, q: number) => string;
  /** What my bag holds now (food = hands + bag). */
  bag: () => Record<string, number>;
  /** Players standing near me: [entity id, name, metres]. */
  near: () => [number, string, number][];
  sound: (id: string) => void;
}

export class TradeUi {
  view: TradeView | null = null;
  invite: TradeInvite | null = null;
  /** The version of the offers when I last accepted (a change after it gets a warning line). */
  private seenVer = -1;
  constructor(private c: TradeCtx) {}

  rootRow(): Row { return { id: 'tradeWho', label: `🤝 ${ts('who')}`, sub: true }; }

  /** Ask this player to trade (from the person page or the Talk button next to a player). */
  ask(id: number): void { this.c.send({ t: Msg.Do, a: 'trade', text: `ask:${id}` }); }

  page(id: string): Page | null {
    if (!PAGES.has(id)) return null;
    const rows: Row[] = [], c = this.c;
    switch (id) {
      case 'tradeWho': {
        const list = c.near();
        for (const [pid, name, d] of list) rows.push({ id: 'p:' + pid, label: name, value: `${Math.round(d)} m` });
        rows.push({ id: 'back', label: '↩' });
        return { id, title: `🤝 ${ts('who')}`, rows, text: list.length ? ts('help') : ts('none', String(TRADE_NEAR)) };
      }
      case 'tradeInvite': {
        const v = this.invite;
        if (!v) return { id, title: ts('title'), rows: [{ id: 'back', label: '↩' }], text: ts('tradeNoInvite') };
        rows.push({ id: 'yes', label: `🤝 ${ts('yes')}` }, { id: 'no', label: ts('no') });
        return { id, title: `🤝 ${ts('title')}`, rows, text: ts('asks', v.name) };
      }
      case 'trade': {
        const v = this.view;
        if (!v || v.state !== 'open') return { id, title: ts('title'), rows: [{ id: 'back', label: '↩' }], text: ts('closed') };
        for (const [k, n] of Object.entries(v.me.offer)) rows.push({ id: 'tk:' + k, label: ts('back1', c.thing(k)), value: `× ${n}` });
        rows.push({ id: 'add', label: `➕ ${ts('add')}`, sub: true });
        rows.push({ id: 'ok', label: v.me.ok ? ts('unaccept') : `✅ ${ts('accept')}` });
        rows.push({ id: 'cancel', label: `✖ ${ts('cancel')}` });
        const side = (title: string, s: TradeView['me'], ok: boolean) => {
          const items = Object.entries(s.offer);
          const lines = items.length ? items.map(([k, n]) => {
            const u = s.up[k];
            const up = u ? ` <span style="color:${QUALITY_COLOR[u[1]] ?? '#fff'}">${esc(c.upText(u[0], u[1]))}</span> <span class="dim">(${esc(ts('withUp'))})</span>` : '';
            return `<div>${n} × ${esc(c.thing(k))}${up}</div>`;
          }).join('') : `<div class="dim">${esc(ts('nothing'))}</div>`;
          return `<div style="flex:1;min-width:0;padding:0.4vw 0.8vw;border:0.15vw solid ${ok ? '#62c95a' : 'rgba(255,255,255,0.18)'};border-radius:0.6vw"><b>${esc(title)}${ok ? ' ✓' : ''}</b>${lines}</div>`;
        };
        const status = v.them.ok ? ts('theyOk', v.them.name) : v.me.ok ? ts('waitThem', v.them.name) : this.seenVer >= 0 && v.ver !== this.seenVer ? ts('changed') : ts('help');
        const html = `<div style="display:flex;gap:1vw">${side(ts('mine'), v.me, v.me.ok)}${side(ts('theirs', v.them.name), v.them, v.them.ok)}</div><p class="dim">${esc(status)}</p>`;
        return { id, title: `🤝 ${ts('with', v.them.name)}`, rows, wide: true, html };
      }
      case 'tradeAdd': {
        const v = this.view;
        if (!v || v.state !== 'open') return { id, title: ts('addTitle'), rows: [{ id: 'back', label: '↩' }], text: ts('closed') };
        const bag = c.bag();
        for (const [k, have] of Object.entries(bag).sort((a, b) => b[1] - a[1])) {
          const left = have - (v.me.offer[k] ?? 0);
          if (left <= 0) continue;
          rows.push({ id: 'a1:' + k, label: ts('addOne', c.thing(k)), value: `× ${left}` });
          if (left > 1) rows.push({ id: 'aa:' + k, label: ts('addAll', c.thing(k)), value: `+${left}` });
        }
        if (!rows.length) rows.push({ id: 'h:none', label: ts('bagEmpty'), dim: true });
        rows.push({ id: 'back', label: '↩' });
        return { id, title: `➕ ${ts('addTitle')}`, rows, wide: true };
      }
    }
    return null;
  }

  /** A row picked on one of these pages: true = handled. */
  pick(page: string, row: string, back: () => void): boolean {
    if (!PAGES.has(page)) return false;
    const c = this.c, send = (text: string) => c.send({ t: Msg.Do, a: 'trade', text });
    if (row === 'back' || row.startsWith('h:')) { if (row === 'back') back(); return true; }
    if (page === 'tradeWho' && row.startsWith('p:')) { this.ask(Number(row.slice(2))); back(); return true; }
    if (page === 'tradeInvite') {
      const v = this.invite;
      if (v) send(`${row === 'yes' ? 'yes' : 'no'}:${v.id}`);
      this.invite = null;
      if (row !== 'yes') back();
      return true;
    }
    if (page === 'trade') {
      const v = this.view;
      if (!v) { back(); return true; }
      if (row.startsWith('tk:')) send(`put:${row.slice(3)}:-1`);
      else if (row === 'add') c.show('tradeAdd');
      else if (row === 'ok') { if (!v.me.ok) this.seenVer = v.ver; send(`ok:${v.me.ok ? 0 : 1}`); }
      else if (row === 'cancel') send('cancel');
      return true;
    }
    if (page === 'tradeAdd') {
      const m = /^(a1|aa):([a-z]+)$/.exec(row);
      if (m && this.view) {
        const left = (c.bag()[m[2]!] ?? 0) - (this.view.me.offer[m[2]!] ?? 0);
        send(`put:${m[2]}:${m[1] === 'aa' ? left : 1}`);
      }
      return true;
    }
    return false;
  }

  /** The server's answer to my own Do `trade`. True = handled. */
  did(d: { a: string; ok: boolean; code: string; [k: string]: unknown }): boolean {
    if (d.a !== 'trade') return false;
    const c = this.c, name = String(d.name ?? '');
    if (d.trade) this.set(d.trade as TradeView);
    else if (d.code === 'tradeClosed') this.set(null);
    if (d.code === 'tradeAsked') { c.note(ts('asked', name), 4000); return true; }
    if (d.code === 'tradeRefused') { c.note(ts('refused', name), 4000); return true; }
    if (d.code === 'trade' || d.code === 'traded' || d.code === 'tradeClosed') return true;
    if (d.code === 'tradeDeclined') return true;
    if (d.code in S.en) { c.sound('ui_error'); c.note(ts(d.code as K, d.code === 'tradeTooFar' ? String(TRADE_NEAR) : name), 3500); }
    return true;
  }

  /** Notice `trade` from the server: an invite, the trade's new state, done or closed. */
  notice(data: unknown): void {
    const c = this.c, d = data as TradeView | TradeInvite;
    if (d.state === 'invite') {
      this.invite = d;
      c.sound('ui_open');
      c.note(ts('asks', d.name), 6000);
      if (!PAGES.has(c.page())) c.show('tradeInvite'); else c.refresh('tradeInvite');
      return;
    }
    this.set(d);
  }

  private set(v: TradeView | null): void {
    const c = this.c, was = this.view;
    if (!v || v.state === 'closed') {
      this.view = null; this.seenVer = -1;
      if (PAGES.has(c.page())) c.close(); // first: closing the menu hides the note line
      if (v && was) c.note(v.why === 'apart' ? ts('apart') : v.why === 'left' ? ts('left', v.them.name) : ts('cancelled', v.them.name), 4000);
      return;
    }
    if (v.state === 'done') {
      this.view = null; this.seenVer = -1;
      const got = Object.entries(v.got ?? {}).map(([k, n]) => `${n} ${c.thing(k)}`).join(', ');
      if (PAGES.has(c.page())) c.close();
      c.sound('ui_ok');
      c.note(ts('done', got || ts('gotNothing')), 5000);
      return;
    }
    const opened = !was;
    this.view = v;
    if (opened) { this.invite = null; c.show('trade'); }
    else { c.refresh('trade'); c.refresh('tradeAdd'); }
  }
}
