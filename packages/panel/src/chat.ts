import { account, cmd } from './api.js';
import { help } from './help.js';
import { card, setHtml, view, type Screen } from './screen.js';
import { ago, esc, gameTime, icon, load, save, toast } from './util.js';

/**
 * Chat of my character (imad 2026-11-25: "a chat tab where the people can talk to me when needed: I order someone to do a long task
 * and when he is done he says done; also a world channel and a clan channel"). Server side: packages/server/src/ai/chatroom.ts.
 * Left: World, my clan, my direct chats (unread counts) and "New message"; right: the messages and a box to write. Phones show
 * one side at a time. New messages arrive live (Notice 'chat').
 */
interface Msg { id: number; chan: string; at: number; game: number; from: number; name: string; text: string; sys: number }
interface Chan { chan: string; kind: 'world' | 'clan' | 'dm'; title: string; with?: number; withPlayer?: boolean; last?: Msg; unread: number }
interface List { token?: boolean; me: number; chans: Chan[]; people: { id: number; name: string; map: string; player: boolean; clan: string }[] }

const err = (e: unknown) => toast(e instanceof Error ? e.message : String(e), 'err');
let list: List | null = null;
let cur = '';
let msgs: Msg[] = [];
let more = false;
let open = false; // the chat page is showing
let pendingTo = -1; // a new direct chat not written yet: the person's id
/** Unread messages while the page is closed (nav badge). */
let unseen = Number(load('chatUnseen', 0)) || 0;

export function chatBadge(): void {
  for (const b of document.querySelectorAll<HTMLElement>('[data-badge="chat"]')) { b.hidden = !unseen; b.textContent = unseen > 99 ? '99+' : String(unseen); }
}

/** A new message somewhere (any page): shown at once when its channel is open, else counted. */
export function chatNotice(m: Msg): void {
  const mine = list && m.from === list.me;
  if (open && m.chan === cur) {
    if (!msgs.some((x) => x.id === m.id)) { msgs.push(m); drawMsgs(true); }
    if (!mine) void cmd({ cmd: 'chatRead', chan: cur }).catch(() => {}); // mark it read
    void refreshList();
    return;
  }
  if (mine) return;
  if (open) { void refreshList(); return; }
  if (m.chan !== 'world' || !m.sys) { unseen++; save('chatUnseen', unseen); chatBadge(); }
  if (m.chan.startsWith('dm:') && load('chatToasts', true)) toast(`${m.name}: “${m.text.slice(0, 120)}”`, 'info');
}

function chanIcon(c: Chan): string { return icon(c.kind === 'world' ? 'world' : c.kind === 'clan' ? 'shield' : c.withPlayer ? 'tv' : 'user'); }
function lastLine(c: Chan): string {
  const l = c.last;
  if (!l) return c.kind === 'world' ? 'Everyone in the world' : c.kind === 'clan' ? 'Your clan' : 'No messages yet';
  return `${l.sys ? '' : (list && l.from === list.me ? 'You' : esc(l.name)) + ': '}${esc(l.text.slice(0, 60))}`;
}
function title(): string {
  if (pendingTo >= 0) return list?.people.find((p) => p.id === pendingTo)?.name ?? 'New message';
  return list?.chans.find((c) => c.chan === cur)?.title ?? '';
}

function drawList(): void {
  if (!list) return;
  const rows = list.chans.map((c) => `<button class="ch-row${c.chan === cur && pendingTo < 0 ? ' on' : ''}" data-chan="${esc(c.chan)}">${chanIcon(c)}
      <span class="ch-t"><b>${esc(c.title)}</b><small>${lastLine(c)}</small></span>${c.unread ? `<b class="badge">${c.unread > 99 ? '99+' : c.unread}</b>` : c.last ? `<small class="dim">${ago(c.last.at)}</small>` : ''}</button>`).join('');
  const people = list.people.map((p) => `<option value="${p.id}">${esc(p.name)}${p.player ? ' (player)' : ''}${p.map ? ' · ' + esc(p.map) : ''}</option>`).join('');
  setHtml('chList', `${rows}
    <div class="ch-new"><select id="chTo" aria-label="Write to"><option value="">New message to…</option>${people}</select></div>`);
  for (const el of document.querySelectorAll<HTMLElement>('#chList [data-chan]')) el.onclick = () => void pick(el.dataset.chan!);
  const sel = document.getElementById('chTo') as HTMLSelectElement;
  sel.onchange = () => {
    const id = Number(sel.value);
    if (!sel.value) return;
    const have = list!.chans.find((c) => c.kind === 'dm' && c.with === id);
    if (have) { void pick(have.chan); return; }
    pendingTo = id; cur = ''; msgs = []; more = false;
    showPane(); drawMsgs(false);
  };
}

function bubble(m: Msg, prev: Msg | undefined): string {
  if (m.sys) return `<div class="ch-sys">${esc(m.text)} <small>${esc(gameTime(m.game, true))}</small></div>`;
  const mine = !!list && m.from === list.me;
  const head = !prev || prev.from !== m.from || prev.sys || m.at - prev.at > 5 * 60_000;
  return `<div class="ch-m${mine ? ' me' : ''}">${head && !mine && cur !== '' && !cur.startsWith('dm:') ? `<b class="ch-n">${esc(m.name)}</b>` : ''}<p>${esc(m.text)}</p>
    <small title="${esc(new Date(m.at).toLocaleString())}">${esc(gameTime(m.game))} · ${ago(m.at)}</small></div>`;
}

function drawMsgs(keepBottom: boolean): void {
  const box = document.getElementById('chMsgs');
  if (!box) return;
  const atBottom = box.scrollHeight - box.scrollTop - box.clientHeight < 60;
  setHtml('chHead', `<button class="iconbtn only-m" id="chBack" aria-label="Back to the list">${icon('back')}</button><b>${esc(title())}</b>${cur.startsWith('clan:') ? ' <span class="tag">clan</span>' : cur === 'world' ? ' <span class="tag">everyone</span>' : ''}`);
  document.getElementById('chBack')!.onclick = () => { view().querySelector('.chatpg')?.classList.remove('open'); };
  const empty = pendingTo >= 0 ? `Write to ${esc(title())}. You can ask them to do something: they answer, and when a long job is done they write back here.`
    : cur === 'world' ? 'The world channel: everyone reads it. Name someone to get their answer.' : cur.startsWith('clan:') ? 'Your clan\'s channel: members answer, and the leader\'s orders arrive here.' : 'No messages yet.';
  box.innerHTML = (more ? '<button class="btn sm ghost ch-more" id="chMore">Older messages</button>' : '')
    + (msgs.length ? msgs.map((m, k) => bubble(m, msgs[k - 1])).join('') : `<div class="empty">${empty}</div>`);
  document.getElementById('chMore')?.addEventListener('click', () => void older());
  if (!keepBottom || atBottom) box.scrollTop = box.scrollHeight;
}

function showPane(): void { view().querySelector('.chatpg')?.classList.add('open'); drawList(); (document.getElementById('chIn') as HTMLInputElement | null)?.focus(); }

async function pick(chan: string): Promise<void> {
  cur = chan; pendingTo = -1; save('chatCur', chan);
  msgs = []; more = false; showPane(); drawMsgs(false);
  try {
    const r = await cmd<{ msgs: Msg[]; more: boolean }>({ cmd: 'chatRead', chan });
    if (cur !== chan) return;
    msgs = r.msgs; more = r.more; drawMsgs(false);
    const c = list?.chans.find((x) => x.chan === chan); if (c) { c.unread = 0; drawList(); }
  } catch (e) { err(e); }
}
async function older(): Promise<void> {
  if (!msgs.length) return;
  const box = document.getElementById('chMsgs')!, h = box.scrollHeight;
  const r = await cmd<{ msgs: Msg[]; more: boolean }>({ cmd: 'chatRead', chan: cur, before: msgs[0]!.id });
  msgs = [...r.msgs, ...msgs]; more = r.more; drawMsgs(true);
  box.scrollTop = box.scrollHeight - h;
}
async function send(): Promise<void> {
  const inp = document.getElementById('chIn') as HTMLInputElement, text = inp.value.trim();
  if (!text || (!cur && pendingTo < 0)) return;
  const btn = document.getElementById('chGo') as HTMLButtonElement;
  btn.disabled = true;
  try {
    const r = await cmd<{ msg: Msg; chan: string }>(pendingTo >= 0 ? { cmd: 'chatSend', to: pendingTo, text } : { cmd: 'chatSend', chan: cur, text });
    inp.value = '';
    if (pendingTo >= 0) { pendingTo = -1; cur = r.chan; save('chatCur', cur); }
    if (!msgs.some((x) => x.id === r.msg.id)) msgs.push(r.msg);
    drawMsgs(false);
    await refreshList();
  } catch (e) { err(e); } finally { btn.disabled = false; inp.focus(); }
}
async function refreshList(): Promise<void> {
  const r = await cmd<List>({ cmd: 'chats' });
  list = r;
  drawList();
}

export const chatScreen: Screen = {
  title: 'Chat', icon: 'chat', help: 'chat', every: 30,
  render() {
    return `<div id="chWrap">${card('Loading', '<div class="skel"></div>')}</div>`;
  },
  async mount() {
    open = true; unseen = 0; save('chatUnseen', 0); chatBadge();
    let r: List;
    try { r = await cmd<List>({ cmd: 'chats' }); } catch (e) {
      setHtml('chWrap', card('Chat', `<p>${esc(e instanceof Error ? e.message : String(e))}</p><p><a href="#/me">My character</a></p>`, { help: help('chat') }));
      return;
    }
    if (r.token) {
      setHtml('chWrap', card('Chat needs your character', `<p>You are signed in with the <b>admin token</b>, the PC's own key. It is not an account and has no character, so nobody in the world can write to it.</p>
        <p>Sign out and sign in with <b>Google or email</b> (the account linked to your character${account?.name ? '' : ', see Users & roles to link it'}): this page then shows your direct chats, the world channel and your clan's channel.</p>
        <p class="dim small">You can still talk to anyone as the owner from their person page (People > a person > Talk & orders).</p>`, { help: help('chat') }));
      return;
    }
    list = r;
    setHtml('chWrap', `<div class="chatpg">
      <aside class="ch-side card"><div id="chList"></div></aside>
      <section class="ch-pane card"><header class="ch-head" id="chHead"></header><div class="ch-msgs" id="chMsgs"></div>
        <form class="ch-in" id="chForm"><input id="chIn" maxlength="400" autocomplete="off" placeholder="Write a message…" aria-label="Message"><button class="btn primary" id="chGo" aria-label="Send">${icon('send')}<span>Send</span></button></form></section></div>`);
    (document.getElementById('chForm') as HTMLFormElement).onsubmit = (e) => { e.preventDefault(); void send(); };
    const want = load<string>('chatCur', 'world');
    drawList();
    await pick(r.chans.some((c) => c.chan === want) ? want : 'world');
    if (matchMedia('(max-width: 900px)').matches) view().querySelector('.chatpg')?.classList.remove('open');
  },
  async refresh() { if (list && !list.token) await refreshList(); },
  leave() { open = false; },
};
