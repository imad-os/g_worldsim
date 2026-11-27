/**
 * The TV's quest and clan screens (imad 2026-11-25): talking to a town teacher (NPC), the Quests page (the 10 tutorial quests:
 * done / in hand / next / locked, with progress), the Clan page (my clan, its leader and approval, members by respect, the
 * election with my ballot, join / quit / call a vote / found at the registrar / give my clan an order as its leader).
 * Kept apart from app.ts: app.ts only asks this module for a page, a pick, a server answer or a notice.
 * Texts in 4 languages; the quest texts come from the shared table (@worldsim/protocol quests.ts).
 */
import { Msg, QUESTS, npcDef, questDef, type L, type Lang, type QuestRow } from '@worldsim/protocol';
import { getLang } from './i18n.js';
import type { Page, Row } from './ui.js';

const S = {
  en: { quests: 'Quests', again: 'Talk to me again for the next quest.', clan: 'Clan', qHelp: 'Talk to the town\'s teachers (Talk next to them): they give the quests in order, and you hand each one in to the one who gave it.',
    done: 'done', active: 'in hand', ready: 'done: hand it in', next: 'next', locked: 'locked', from: 'from {0}', goSee: 'Go and see {0}.', handIn: 'Hand it in to {0}.',
    taken: 'Quest taken: {0}', handed: 'Quest done: {0} (+{1} points)', progress: '{0}: {1} / {2}', readyNote: '{0}: done! Go back to {1}.', noNpc: 'No one to talk to here.',
    allDone: 'You finished every quest. Well done!', reward: 'Reward: {0}', close: 'OK', npcClan: 'Clans', found: 'Found a clan', foundLabel: 'Name of your clan',
    noClan: 'You are in no clan.', leader: 'Leader', approval: 'Approval {0} %', loyalty: 'Your loyalty {0} %', members: 'Members (by influence)', myInf: 'Your influence {0} / 100 ({1} needed to ask for a vote)', lowInf: 'Your influence is {0}: you need {1} to ask for a vote. Save people, fight off zombies, finish tasks and keep the rules to gain it.', join: 'Join a clan', quit: 'Quit my clan',
    callVote: 'Ask for a vote', vote: 'Vote for the leader', voteOn: 'Election: {0}. Closes in {1} min.', voted: 'You voted for {0}.', order: 'Give my clan an order', orderLabel: 'Your order to the clan',
    lastVote: 'Last vote: {0} won', ordered: 'Your order went to {0} members.', joined: 'You joined {0}.', left: 'You left {0}.', founded: 'You founded {0}.',
    refused: '{0} would not take you.', atReg: 'Clans are founded with Odile, the registrar in town: talk to her.', leadAlready: 'You already lead a clan.', noVote: 'There is no vote now.',
    tooSoon: 'There was a vote a short while ago.', notLeader: 'Only the leader gives the clan orders.', clanNone: 'No such clan.', others: 'Other clans here', none: 'none',
    clanHelp: 'Members vote for their leader: mostly by influence (what each one did for the people), partly by how they feel. The leader gives orders; loyal members follow them. You can change clan at any time.', townMake: 'Make our camp a town', townOn: 'The {0} camp is a town now', townNo: 'Not yet: {0}', gov: 'Town government: {0}', rSecurity: 'security', rResources: 'resources', rSociety: 'society', townSoon: 'A town needs more than 10 members.', order0: 'Leader\'s order: {0}', rivals: 'Rivals: {0}', war: 'Declare war', peace: 'Make peace', warOn: 'War on the {0}!', peaceOn: 'Peace with the {0}.', warNo: 'Not done: {0}', atWar: 'At war with {0}', warHelp: 'At war, members of the two clans fight when they meet (nobody dies of it) and each duel won counts. The side 5 duels behind asks for peace; a war ends after 3 days anyway.' },
  fr: { quests: 'Quêtes', again: 'Reparle-moi pour la quête suivante.', clan: 'Clan', qHelp: 'Parle aux maîtres de la ville (Parler à côté d\'eux) : ils donnent les quêtes dans l\'ordre, et tu rends chacune à celui qui l\'a donnée.',
    done: 'faite', active: 'en cours', ready: 'faite : à rendre', next: 'suivante', locked: 'verrouillée', from: 'de {0}', goSee: 'Va voir {0}.', handIn: 'Rends-la à {0}.',
    taken: 'Quête prise : {0}', handed: 'Quête finie : {0} (+{1} points)', progress: '{0} : {1} / {2}', readyNote: '{0} : fait ! Retourne voir {1}.', noNpc: 'Personne à qui parler ici.',
    allDone: 'Tu as fini toutes les quêtes. Bravo !', reward: 'Récompense : {0}', close: 'OK', npcClan: 'Clans', found: 'Fonder un clan', foundLabel: 'Nom de ton clan',
    noClan: 'Tu n\'es dans aucun clan.', leader: 'Chef', approval: 'Approbation {0} %', loyalty: 'Ta loyauté {0} %', members: 'Membres (par influence)', myInf: 'Ton influence {0} / 100 ({1} pour demander un vote)', lowInf: 'Ton influence est de {0} : il faut {1} pour demander un vote. Sauve des gens, repousse les zombies, finis tes tâches et respecte les règles pour la gagner.', join: 'Rejoindre un clan', quit: 'Quitter mon clan',
    callVote: 'Demander un vote', vote: 'Voter pour le chef', voteOn: 'Élection : {0}. Fin dans {1} min.', voted: 'Tu as voté pour {0}.', order: 'Donner un ordre au clan', orderLabel: 'Ton ordre au clan',
    lastVote: 'Dernier vote : {0} a gagné', ordered: 'Ton ordre est allé à {0} membres.', joined: 'Tu as rejoint {0}.', left: 'Tu as quitté {0}.', founded: 'Tu as fondé {0}.',
    refused: '{0} ne veut pas de toi.', atReg: 'Les clans se fondent avec Odile, en ville : parle-lui.', leadAlready: 'Tu diriges déjà un clan.', noVote: 'Pas de vote en ce moment.',
    tooSoon: 'Un vote a eu lieu il y a peu.', notLeader: 'Seul le chef donne des ordres au clan.', clanNone: 'Ce clan n\'existe pas.', others: 'Autres clans ici', none: 'aucun',
    clanHelp: 'Les membres élisent leur chef : surtout par influence (ce que chacun a fait pour les siens), en partie par sentiments. Le chef donne des ordres ; les membres loyaux les suivent. Tu peux changer de clan à tout moment.', townMake: 'Faire de notre camp une ville', townOn: 'Le camp des {0} est une ville', townNo: 'Pas encore : {0}', gov: 'Gouvernement de la ville : {0}', rSecurity: 'sécurité', rResources: 'ressources', rSociety: 'société', townSoon: 'Une ville demande plus de 10 membres.', order0: 'Ordre du chef : {0}', rivals: 'Rivaux : {0}', war: 'Déclarer la guerre', peace: 'Faire la paix', warOn: 'Guerre contre les {0} !', peaceOn: 'Paix avec les {0}.', warNo: 'Pas fait : {0}', atWar: 'En guerre contre {0}', warHelp: 'En guerre, les membres des deux clans se battent quand ils se croisent (personne n\'en meurt) et chaque duel gagné compte. Le camp qui a 5 duels de retard demande la paix ; une guerre finit de toute façon après 3 jours.' },
  es: { quests: 'Misiones', again: 'Háblame otra vez para la siguiente misión.', clan: 'Clan', qHelp: 'Habla con los maestros del pueblo (Hablar a su lado): dan las misiones en orden y entregas cada una a quien te la dio.',
    done: 'hecha', active: 'en curso', ready: 'hecha: entrégala', next: 'siguiente', locked: 'bloqueada', from: 'de {0}', goSee: 'Ve a ver a {0}.', handIn: 'Entrégala a {0}.',
    taken: 'Misión aceptada: {0}', handed: 'Misión cumplida: {0} (+{1} puntos)', progress: '{0}: {1} / {2}', readyNote: '{0}: ¡hecho! Vuelve con {1}.', noNpc: 'No hay nadie con quien hablar aquí.',
    allDone: 'Terminaste todas las misiones. ¡Bien hecho!', reward: 'Recompensa: {0}', close: 'OK', npcClan: 'Clanes', found: 'Fundar un clan', foundLabel: 'Nombre de tu clan',
    noClan: 'No estás en ningún clan.', leader: 'Líder', approval: 'Aprobación {0} %', loyalty: 'Tu lealtad {0} %', members: 'Miembros (por influencia)', myInf: 'Tu influencia {0} / 100 ({1} para pedir una votación)', lowInf: 'Tu influencia es {0}: necesitas {1} para pedir una votación. Salva a gente, lucha contra zombis, termina tareas y cumple las reglas para ganarla.', join: 'Unirme a un clan', quit: 'Dejar mi clan',
    callVote: 'Pedir una votación', vote: 'Votar al líder', voteOn: 'Elección: {0}. Cierra en {1} min.', voted: 'Votaste por {0}.', order: 'Dar una orden al clan', orderLabel: 'Tu orden al clan',
    lastVote: 'Última votación: ganó {0}', ordered: 'Tu orden llegó a {0} miembros.', joined: 'Te uniste a {0}.', left: 'Dejaste {0}.', founded: 'Fundaste {0}.',
    refused: '{0} no te acepta.', atReg: 'Los clanes se fundan con Odile, en el pueblo: habla con ella.', leadAlready: 'Ya diriges un clan.', noVote: 'No hay votación ahora.',
    tooSoon: 'Hubo una votación hace poco.', notLeader: 'Solo el líder da órdenes al clan.', clanNone: 'Ese clan no existe.', others: 'Otros clanes aquí', none: 'ninguno',
    clanHelp: 'Los miembros eligen a su líder: sobre todo por influencia (lo que cada uno hizo por los suyos), en parte por sentimientos. El líder da órdenes; los leales las siguen. Puedes cambiar de clan cuando quieras.', townMake: 'Convertir nuestro campamento en pueblo', townOn: 'El campamento de los {0} es un pueblo', townNo: 'Aún no: {0}', gov: 'Gobierno del pueblo: {0}', rSecurity: 'seguridad', rResources: 'recursos', rSociety: 'sociedad', townSoon: 'Un pueblo necesita más de 10 miembros.', order0: 'Orden del líder: {0}', rivals: 'Rivales: {0}', war: 'Declarar la guerra', peace: 'Hacer la paz', warOn: '¡Guerra contra los {0}!', peaceOn: 'Paz con los {0}.', warNo: 'No hecho: {0}', atWar: 'En guerra con {0}', warHelp: 'En guerra, los miembros de los dos clanes pelean al cruzarse (nadie muere por ello) y cada duelo ganado cuenta. El bando con 5 duelos de desventaja pide la paz; una guerra termina tras 3 días de todos modos.' },
  ar: { quests: 'المهام', again: 'تحدث معي مرة أخرى للمهمة التالية.', clan: 'العشيرة', qHelp: 'تحدث مع معلمي البلدة (تحدث بجانبهم): يعطون المهام بالترتيب، وتسلّم كل مهمة لمن أعطاك إياها.',
    done: 'منجزة', active: 'قيد التنفيذ', ready: 'منجزة: سلّمها', next: 'التالية', locked: 'مقفلة', from: 'من {0}', goSee: 'اذهب إلى {0}.', handIn: 'سلّمها إلى {0}.',
    taken: 'مهمة جديدة: {0}', handed: 'أنجزت المهمة: {0} (+{1} نقطة)', progress: '{0}: {1} / {2}', readyNote: '{0}: تم! عد إلى {1}.', noNpc: 'لا أحد للتحدث معه هنا.',
    allDone: 'أنهيت كل المهام. أحسنت!', reward: 'المكافأة: {0}', close: 'حسنًا', npcClan: 'العشائر', found: 'تأسيس عشيرة', foundLabel: 'اسم عشيرتك',
    noClan: 'لست في أي عشيرة.', leader: 'القائد', approval: 'الرضا {0} %', loyalty: 'ولاؤك {0} %', members: 'الأعضاء (حسب النفوذ)', myInf: 'نفوذك {0} / 100 (يلزم {1} لطلب تصويت)', lowInf: 'نفوذك {0}: يلزمك {1} لطلب تصويت. أنقذ الناس، واصدّ الزومبي، وأنهِ المهام، والتزم بالقواعد لتكسبه.', join: 'الانضمام إلى عشيرة', quit: 'مغادرة عشيرتي',
    callVote: 'طلب تصويت', vote: 'التصويت للقائد', voteOn: 'انتخاب: {0}. ينتهي بعد {1} دقيقة.', voted: 'صوّتت لـ {0}.', order: 'إعطاء أمر للعشيرة', orderLabel: 'أمرك للعشيرة',
    lastVote: 'آخر تصويت: فاز {0}', ordered: 'وصل أمرك إلى {0} أعضاء.', joined: 'انضممت إلى {0}.', left: 'غادرت {0}.', founded: 'أسست {0}.',
    refused: '{0} لا يقبلك.', atReg: 'تُؤسَّس العشائر عند أوديل في البلدة: تحدث معها.', leadAlready: 'أنت تقود عشيرة بالفعل.', noVote: 'لا يوجد تصويت الآن.',
    tooSoon: 'جرى تصويت قبل قليل.', notLeader: 'القائد وحده يعطي الأوامر للعشيرة.', clanNone: 'هذه العشيرة غير موجودة.', others: 'عشائر أخرى هنا', none: 'لا شيء',
    clanHelp: 'ينتخب الأعضاء قائدهم: بالنفوذ أساسًا (ما قدّمه كل واحد لقومه)، وبالمشاعر جزئيًا. القائد يعطي الأوامر ويتبعها الأوفياء. يمكنك تغيير عشيرتك متى شئت.', townMake: 'اجعل مخيمنا بلدة', townOn: 'مخيم {0} صار بلدة', townNo: 'ليس بعد: {0}', gov: 'حكومة البلدة: {0}', rSecurity: 'الأمن', rResources: 'الموارد', rSociety: 'المجتمع', townSoon: 'البلدة تحتاج أكثر من 10 أعضاء.', order0: 'أمر القائد: {0}', rivals: 'الخصوم: {0}', war: 'إعلان الحرب', peace: 'عقد السلام', warOn: 'الحرب على {0}!', peaceOn: 'السلام مع {0}.', warNo: 'لم يتم: {0}', atWar: 'في حرب مع {0}', warHelp: 'في الحرب يتقاتل أفراد العشيرتين عند اللقاء (لا يموت أحد) وكل مبارزة رابحة تُحسب. الطرف المتأخر بخمس مبارزات يطلب السلام، وتنتهي الحرب بعد 3 أيام على أي حال.' },
} as const;
type K = keyof typeof S.en;
const lang = (): Lang => (['en', 'fr', 'es', 'ar'].includes(getLang()) ? getLang() : 'en') as Lang;
const s = (k: K, ...a: string[]) => ((S[lang()] as Record<string, string>)[k] ?? S.en[k]).replace(/\{(\d)\}/g, (_, i) => a[Number(i)] ?? '');
const l = (x: L) => x[lang()] || x.en;
const esc = (x: string) => x.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]!));
const npcName = (k: string) => npcDef(k)?.name ?? k;

interface NpcTalk { npc: string; name: string; say: L; quest?: string; state?: string; n?: number; need?: number; next?: string; reward?: { xp: number; items?: Record<string, number>; food?: number } }
interface Member { id: number; name: string; respect: number; influence?: number }
interface MyClan { id: number; name: string; leader: number; leaderName: string; me: number; lead: boolean; approval: number; loyalty: number; members: Member[]; influence?: number; callMin?: number; vote: { end: number; why: string; cands: { id: number; name: string }[]; my: number } | null; result: { winner: string } | null; order: string; town?: { town: boolean; seats: number; gov: { role: string; id: number; name: string }[] }; rivals: { name: string; tension: number }[]; now: number }
interface ClanInfo { mine: MyClan | null; others: { id: number; name: string; leader: string; n: number; approval: number; tension?: number; war?: [number, number] | null }[]; nearReg: boolean }

export interface QuestCtx {
  send: (m: Record<string, unknown>) => void;
  push: (page: string) => void;
  refresh: (page: string) => void;
  note: (text: string, ms?: number) => void;
  keyboard: (label: string, cb: (v: string) => void) => void;
  thing: (k: string) => string;
}

export class QuestUi {
  rows: QuestRow[] | null = null;
  talk: NpcTalk | null = null;
  clan: ClanInfo | null = null;
  constructor(private c: QuestCtx) {}

  /** Talk next to an NPC (app.ts checks there is one). */
  talkToNpc(): void { this.talk = null; this.c.send({ t: Msg.Do, a: 'npc' }); this.c.push('npc'); }
  rootRows(): Row[] { return [{ id: 'quests', label: s('quests'), sub: true }, { id: 'clan', label: s('clan'), sub: true }]; }

  /** A page of this module, or null. */
  page(id: string): Page | null {
    const rows: Row[] = [];
    switch (id) {
      case 'quests': {
        for (const r of this.rows ?? []) {
          const q = questDef(r.id)!;
          rows.push({ id: 'q:' + r.id, label: `${r.state === 'done' ? '✓ ' : r.state === 'ready' ? '★ ' : r.state === 'active' ? '▶ ' : ''}${l(q.title)}`,
            value: r.state === 'active' ? `${r.n} / ${r.need}` : s(r.state), dim: r.state === 'locked' });
        }
        const cur = this.rows?.find((r) => r.state === 'active' || r.state === 'ready' || r.state === 'next');
        const q = cur ? questDef(cur.id) : undefined;
        const html = q ? `<p><b>${esc(l(q.title))}</b> · ${esc(s('from', npcName(q.npc)))}</p><p>${esc(l(q.ask))}</p><p class="dim">${esc(cur!.state === 'next' ? s('goSee', npcName(q.npc)) : cur!.state === 'ready' ? s('handIn', npcName(q.npc)) : s('progress', l(q.title), String(cur!.n), String(cur!.need)))}</p>`
          : this.rows ? `<p>${esc(s('allDone'))}</p>` : '<p>…</p>';
        if (!rows.length) rows.push({ id: 'back', label: s('close') });
        return { id, title: s('quests'), rows, wide: true, html: `${html}<p class="dim">${esc(s('qHelp'))}</p>` };
      }
      case 'npc': {
        const t = this.talk;
        if (!t) return { id, title: '…', rows: [{ id: 'back', label: s('close') }], text: '…' };
        const q = t.quest ? questDef(t.quest) : undefined;
        let extra = '';
        if (t.state === 'taken' && q) extra = s('taken', l(q.title));
        else if (t.state === 'handed' && q) extra = s('handed', l(q.title), String(t.reward?.xp ?? 0)) + (t.reward ? ' · ' + s('reward', this.rewardText(t.reward)) : '') + (t.next ? ' ' + (t.next === t.npc ? s('again') : s('goSee', npcName(t.next))) : '');
        else if (t.state === 'remind' && q) extra = s('progress', l(q.title), String(t.n ?? 0), String(t.need ?? 1));
        else if (t.state === 'elsewhere' && t.next) extra = q ? s('handIn', npcName(t.next)) + ` (${l(q.title)} ${t.n ?? 0}/${t.need ?? 1})` : s('goSee', npcName(t.next));
        else if (t.state === 'all') extra = s('allDone');
        if (t.npc === 'registrar') {
          rows.push({ id: 'found', label: s('found') }, { id: 'clan', label: s('clan'), sub: true });
        }
        rows.push({ id: 'quests', label: s('quests'), sub: true }, { id: 'back', label: s('close') });
        const title = npcDef(t.npc) ? l(npcDef(t.npc)!.title) : t.name;
        return { id, title, rows, wide: true, html: `<p>“${esc(l(t.say))}”</p>${extra ? `<p><b>${esc(extra)}</b></p>` : ''}` };
      }
      case 'clan': {
        const c = this.clan;
        if (!c) return { id, title: s('clan'), rows: [{ id: 'back', label: s('close') }], text: '…' };
        const m = c.mine;
        let html = '';
        if (m) {
          html = `<p><b>${esc(m.name)}</b> · ${esc(s('leader'))}: <b>${esc(m.leaderName)}</b> · ${esc(s('approval', String(m.approval)))} · ${esc(s('loyalty', String(m.loyalty)))}</p>`
            + (m.vote ? `<p><b>${esc(s('voteOn', m.vote.cands.map((x) => x.name).join(' / '), String(Math.max(0, Math.round((m.vote.end - m.now) / 60)))))}</b></p>` : '')
            + (m.order ? `<p>${esc(s('order0', m.order))}</p>` : '')
            + (m.town?.town && m.town.gov.length ? `<p>${esc(s('gov', m.town.gov.map((g) => `${s(g.role === 'security' ? 'rSecurity' : g.role === 'resources' ? 'rResources' : 'rSociety')}: ${g.name}`).join(', ')))}</p>` : '')
            + `<p class="dim">${esc(s('members'))}: ${m.members.map((x) => `${esc(x.name)} (${x.influence ?? x.respect})`).join(', ')}</p>`
            + (m.influence !== undefined ? `<p class="dim">${esc(s('myInf', String(m.influence), String(m.callMin ?? 40)))}</p>` : '')
            + (m.result ? `<p class="dim">${esc(s('lastVote', m.result.winner))}</p>` : '')
            + (m.rivals.length ? `<p class="dim">${esc(s('rivals', m.rivals.map((r) => `${r.name} ${r.tension}/10`).join(', ')))}</p>` : '')
            + (c.others.some((x) => x.war) ? `<p><b>${esc(s('atWar', c.others.filter((x) => x.war).map((x) => `${x.name} (${x.war![0]}-${x.war![1]})`).join(', ')))}</b></p><p class="dim">${esc(s('warHelp'))}</p>` : '');
          if (m.vote) rows.push({ id: 'vote', label: s('vote'), sub: true, value: m.vote.my >= 0 ? m.vote.cands.find((x) => x.id === m.vote!.my)?.name ?? '' : '' });
          if (m.lead) {
            rows.push({ id: 'order', label: s('order') });
            if (!m.town?.town) rows.push({ id: 'town', label: s('townMake'), dim: m.members.length <= 10, value: m.members.length <= 10 ? `${m.members.length}/11` : '' });
            if (c.others.some((x) => !x.war)) rows.push({ id: 'war', label: s('war'), sub: true });
            for (const x of c.others.filter((o) => o.war)) rows.push({ id: 'p:' + x.id, label: s('peace'), value: x.name });
          }
          else if (!m.vote) rows.push({ id: 'call', label: s('callVote') });
          rows.push({ id: 'quit', label: s('quit') });
        } else html = `<p>${esc(s('noClan'))}</p>`;
        if (c.others.length) rows.push({ id: 'join', label: s('join'), sub: true });
        if (c.nearReg) rows.push({ id: 'found', label: s('found') });
        rows.push({ id: 'back', label: s('close') });
        html += `<p class="dim">${esc(s('others'))}: ${c.others.length ? c.others.map((x) => `${esc(x.name)} (${esc(x.leader)}, ${x.n})`).join(', ') : esc(s('none'))}</p><p class="dim">${esc(s('clanHelp'))}</p>`;
        return { id, title: s('clan'), rows, wide: true, html };
      }
      case 'clanJoin':
        for (const o of this.clan?.others ?? []) rows.push({ id: 'j:' + o.id, label: o.name, value: `${o.leader} · ${o.n} · ${o.approval} %` });
        rows.push({ id: 'back', label: s('close') });
        return { id, title: s('join'), rows };
      case 'clanWar':
        for (const o of (this.clan?.others ?? []).filter((x) => !x.war)) rows.push({ id: 'w:' + o.id, label: o.name, value: `${o.leader} · ${o.n}${o.tension ? ` · ${o.tension}/10` : ''}` });
        rows.push({ id: 'back', label: s('close') });
        return { id, title: s('war'), rows, text: s('warHelp') };
      case 'clanVote':
        for (const k of this.clan?.mine?.vote?.cands ?? []) rows.push({ id: 'v:' + k.id, label: k.name, value: this.clan!.mine!.vote!.my === k.id ? '●' : '' });
        rows.push({ id: 'back', label: s('close') });
        return { id, title: s('vote'), rows, text: this.clan?.mine?.vote?.why };
    }
    return null;
  }

  /** A row picked: true = handled here. */
  pick(page: string, row: string, back: () => void): boolean {
    const c = this.c;
    if (row === 'quests' && (page === 'root' || page === 'npc')) { this.rows = null; c.send({ t: Msg.Do, a: 'quests' }); c.push('quests'); return true; }
    if (row === 'clan' && (page === 'root' || page === 'npc')) { this.openClan(); return true; }
    if (page === 'quests') { back(); return true; }
    if (page === 'npc') {
      if (row === 'found') { c.keyboard(s('foundLabel'), (v) => c.send({ t: Msg.Do, a: 'clan', text: 'found:' + v.slice(0, 20) })); return true; }
      if (row === 'back') { back(); return true; }
      return false;
    }
    if (page === 'clan') {
      if (row === 'join') { c.push('clanJoin'); return true; }
      if (row === 'war') { c.push('clanWar'); return true; }
      if (row === 'town') { c.send({ t: Msg.Do, a: 'clan', text: 'town' }); return true; }
      if (row.startsWith('p:')) { c.send({ t: Msg.Do, a: 'clan', text: 'peace:' + row.slice(2) }); return true; }
      if (row === 'vote') { c.push('clanVote'); return true; }
      if (row === 'quit') { c.send({ t: Msg.Do, a: 'clan', text: 'quit' }); return true; }
      if (row === 'call') { c.send({ t: Msg.Do, a: 'clan', text: 'call' }); return true; }
      if (row === 'found') { c.keyboard(s('foundLabel'), (v) => c.send({ t: Msg.Do, a: 'clan', text: 'found:' + v.slice(0, 20) })); return true; }
      if (row === 'order') { c.keyboard(s('orderLabel'), (v) => { if (v.trim()) c.send({ t: Msg.Do, a: 'clan', text: 'order:' + v.slice(0, 200) }); }); return true; }
      if (row === 'back') { back(); return true; }
      return false;
    }
    if (page === 'clanJoin') { if (row.startsWith('j:')) { c.send({ t: Msg.Do, a: 'clan', text: 'join:' + row.slice(2) }); back(); } else back(); return true; }
    if (page === 'clanWar') { if (row.startsWith('w:')) { c.send({ t: Msg.Do, a: 'clan', text: 'war:' + row.slice(2) }); back(); } else back(); return true; }
    if (page === 'clanVote') { if (row.startsWith('v:')) { c.send({ t: Msg.Do, a: 'clan', text: 'vote:' + row.slice(2) }); back(); } else back(); return true; }
    return false;
  }
  openClan(): void { this.clan = null; this.c.send({ t: Msg.Do, a: 'clan', text: 'info' }); this.c.push('clan'); }

  /** The server's answer to a Do: true = handled here. */
  did(d: { a: string; ok: boolean; code: string; [k: string]: unknown }): boolean {
    const c = this.c;
    if (d.code === 'quests') { this.rows = d.list as QuestRow[]; c.refresh('quests'); return true; }
    if (d.code === 'npc') {
      this.talk = d.talk as NpcTalk; this.rows = d.quests as QuestRow[];
      if (d.clan) this.clan = d.clan as ClanInfo;
      c.refresh('npc');
      return true;
    }
    if (d.code === 'noNpc') { c.note(s('noNpc'), 2500); return true; }
    if (d.a !== 'clan') return false;
    if (d.clan) this.clan = d.clan as ClanInfo;
    const name = String(d.name ?? '');
    const msg: Partial<Record<string, string>> = {
      clanJoined: s('joined', name), clanLeft: s('left', name), clanFounded: s('founded', name), clanVoted: s('voted', name), clanOrdered: s('ordered', String(d.n ?? 0)),
      clanRefused: s('refused', name), clanAtRegistrar: s('atReg'), clanLeadAlready: s('leadAlready'), clanNoVote: s('noVote'), clanTooSoon: s('tooSoon'), clanNotLeader: s('notLeader'), clanLowInfluence: s('lowInf', String(d.n ?? 0), String(d.need ?? 40)),
      clanWarOn: s('warOn', name), clanPeaceOn: s('peaceOn', name), clanWarNo: s('warNo', String(d.why ?? '')), clanTown: s('townOn', name), clanTownNo: s('townNo', String(d.why ?? '')),
      clanNone: s('clanNone'), clanVoteOn: s('voteOn', this.clan?.mine?.vote?.cands.map((x) => x.name).join(' / ') ?? '', '120'),
    };
    if (msg[d.code]) c.note(msg[d.code]!, 3500);
    c.refresh('clan'); c.refresh('npc');
    return true;
  }

  /** Live notices: quest progress, an election opened / closed. */
  notice(kind: string, data: unknown): boolean {
    if (kind === 'quest') {
      const d = data as { quest: string; n: number; need: number; ready: boolean; npc: string };
      const q = questDef(d.quest);
      if (q) this.c.note(d.ready ? s('readyNote', l(q.title), npcName(d.npc)) : s('progress', l(q.title), String(d.n), String(d.need)), 3500);
      const r = this.rows?.find((x) => x.id === d.quest);
      if (r) { r.n = d.n; if (d.ready) r.state = 'ready'; this.c.refresh('quests'); }
      return true;
    }
    if (kind === 'clanVote') {
      const d = data as { open: boolean; clan: string };
      this.c.note(d.open ? `${d.clan}: ${s('vote')}` : `${d.clan}: ${s('lastVote', '…')}`, 4000);
      return true;
    }
    return false;
  }

  private rewardText(r: NonNullable<NpcTalk['reward']>): string {
    const parts = [`${r.xp} xp`];
    for (const [k, n] of Object.entries(r.items ?? {})) parts.push(`${n} ${this.c.thing(k)}`);
    if (r.food) parts.push(`${r.food} ${this.c.thing('food')}`);
    return parts.join(', ');
  }
}
export { QUESTS };
