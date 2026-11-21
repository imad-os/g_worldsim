import { cmd } from './api.js';
import { help } from './help.js';
import { card, on, setHtml, val, view, type Screen } from './screen.js';
import { S, people, profiles, describe, who, mapName, overview, goalHtml, type Person } from './state.js';
import { esc, gameTime, icon, meter, ACTS, ACT_COLORS, load, save, toast } from './util.js';

const avatar = (name: string, sex?: string, size = '') => `<span class="av ${sex === 'f' ? 'f' : 'm'} ${size}">${esc(name.charAt(0).toUpperCase())}</span>`;
const invChips = (inv?: Record<string, number>, carry = 0) => {
  const p = Object.entries(inv ?? {}).filter(([, n]) => n > 0).map(([k, n]) => `<span class="chip">${n > 1 || !['axe', 'spear', 'sword', 'bow', 'armor', 'clothes', 'helmet'].includes(k) ? n + ' ' : ''}${esc(k)}</span>`);
  if (carry) p.unshift(`<span class="chip food">${carry} food</span>`);
  return p.join('') || '<span class="dim">nothing</span>';
};

// ------------------------------------------------------------ the list
let tab = load('pTab', 'alive'), q = '', sort = load('pSort', 'name'), mapF = 'all';
function listHtml(): string {
  if (tab === 'dead' || tab === 'all') {
    const rows = S.profiles.filter((p) => (tab === 'all' || !p.alive) && (!q || p.name.toLowerCase().includes(q))).sort((a, b) => (b.died ?? 1e12) - (a.died ?? 1e12));
    if (!rows.length) return '<div class="empty">Nobody here.</div>';
    return `<div class="tbl-wrap"><table class="tbl"><thead><tr><th>Name</th><th>Age</th><th>Gen.</th><th>Parents</th><th>Partner</th><th>Children</th><th>Died</th></tr></thead><tbody>${rows.map((p) =>
      `<tr class="link" data-id="${p.id}"><td>${avatar(p.name, p.sex, 'sm')} <b>${esc(p.name)}</b>${p.alive ? ' <span class="tag ok">alive</span>' : ''}</td><td>${p.age}</td><td>${p.generation}</td><td>${esc(p.parents.join(', ') || '-')}</td><td>${esc(p.partner ?? '-')}</td><td>${p.children}</td><td>${p.died !== null ? `${gameTime(p.died)}<br><small>${esc(p.cause ?? '')}</small>` : '-'}</td></tr>`).join('')}</tbody></table></div>`;
  }
  let list = S.people.filter((p) => !p.player && (mapF === 'all' || p.map === mapF) && (!q || p.name.toLowerCase().includes(q)));
  const key: Record<string, (p: Person) => number | string> = { name: (p) => p.name, age: (p) => -p.age, hp: (p) => p.hp, hunger: (p) => -p.hunger, thirst: (p) => -p.thirst, act: (p) => p.act };
  const k = key[sort] ?? key.name!;
  list = list.sort((a, b) => { const x = k(a), y = k(b); return x < y ? -1 : x > y ? 1 : 0; });
  const players = S.people.filter((p) => p.player && (!q || p.name.toLowerCase().includes(q)));
  return (list.length ? `<div class="pgrid">${list.map((p) => `<a class="pcard" href="#/person/${p.id}">
      <div class="pc-h">${avatar(p.name, p.sex)}<div><b>${esc(p.name)}</b><small>${p.sex === 'f' ? 'Woman' : 'Man'}, ${p.age}${p.child ? ' · child' : ''}${p.pregnant ? ' · expecting' : ''}</small></div></div>
      <div class="pc-a"><i class="dotc" style="background:${ACT_COLORS[p.act] ?? '#888'}"></i>${esc(ACTS[p.act] ?? '')}${p.talkingTo ? ' with ' + esc(p.talkingTo) : ''}${!p.goal && p.order ? `<br><small>Told to ${esc(p.order)}</small>` : ''}</div>${p.goal ? goalHtml(p.goal, esc) : ''}
      <div class="pc-m"><span>Food</span>${meter(p.hunger)}<span>Water</span>${meter(p.thirst)}<span>Rest</span>${meter(p.tired)}<span>Health</span>${meter(p.hp, false)}</div>
      <div class="pc-f">${icon('map')} ${esc(mapName(p.map))} (${Math.round(p.x)}, ${Math.round(p.y)})${p.partner ? ` · ${icon('heart')} ${esc(p.partner)}` : ''}</div></a>`).join('')}</div>` : '<div class="empty">Nobody matches.</div>')
    + (players.length ? `<h4 class="sub">Players' characters</h4><div class="pgrid">${players.map((p) => `<a class="pcard player" href="#/person/${p.id}"><div class="pc-h">${avatar(p.name)}<div><b>${esc(p.name)}</b><small>player · ${p.online ? (p.asleep ? 'here, asleep' : 'playing now') : 'away (asleep)'}</small></div></div><div class="pc-f">${icon('map')} ${esc(mapName(p.map))} (${Math.round(p.x)}, ${Math.round(p.y)})</div></a>`).join('')}</div>` : '');
}

export const peopleScreen: Screen = {
  title: 'People', icon: 'people', help: 'people', every: 4,
  render() {
    return `<div class="toolbar">
        <div class="seg" id="pTabs">${[['alive', 'Alive'], ['dead', 'Dead'], ['all', 'Everyone ever']].map(([k, l]) => `<button data-t="${k}" class="${tab === k ? 'on' : ''}">${l}</button>`).join('')}</div>
        <label class="search">${icon('search')}<input id="pQ" placeholder="Search a name" value="${esc(q)}"></label>
        <select id="pMapF" aria-label="Map"><option value="all">Every map</option></select>
        <select id="pSort" aria-label="Sort"><option value="name">Sort: name</option><option value="age">Sort: oldest</option><option value="hp">Sort: weakest</option><option value="hunger">Sort: hungriest</option><option value="thirst">Sort: thirstiest</option><option value="act">Sort: activity</option></select>
        <button class="btn" id="pAdd">${icon('plus')} Add a person</button>
      </div><div id="pList"><div class="skel tall"></div></div>`;
  },
  async mount() {
    on('#pTabs button', 'click', (b) => { tab = b.dataset.t!; save('pTab', tab); for (const x of view().querySelectorAll('#pTabs button')) x.classList.toggle('on', x === b); void this.refresh!(); });
    on('#pQ', 'input', (el) => { q = (el as HTMLInputElement).value.trim().toLowerCase(); setHtml('pList', listHtml()); bindList(); });
    on('#pSort', 'change', (el) => { sort = (el as HTMLSelectElement).value; save('pSort', sort); setHtml('pList', listHtml()); bindList(); });
    on('#pMapF', 'change', (el) => { mapF = (el as HTMLSelectElement).value; setHtml('pList', listHtml()); bindList(); });
    on('#pAdd', 'click', async () => {
      if (!confirm('Add a new person in Old Town? (The world normally grows only by births.)')) return;
      try { await cmd({ cmd: 'spawn', map: 'town', x: 128, y: 128 }); toast('A new person arrived in Old Town', 'ok'); void this.refresh!(); } catch (e) { toast(String(e), 'err'); }
    });
    (document.getElementById('pSort') as HTMLSelectElement).value = sort;
    const ov = await overview();
    (document.getElementById('pMapF') as HTMLSelectElement).innerHTML = '<option value="all">Every map</option>' + ov.maps.map((m) => `<option value="${m.id}">${esc(m.name)}</option>`).join('');
    await this.refresh!();
  },
  async refresh() {
    try { if (tab === 'alive') await people(true); else await profiles(); setHtml('pList', listHtml()); bindList(); } catch (e) { toast(String(e), 'err'); }
  },
};
function bindList(): void { on('tr.link', 'click', (el) => { location.hash = `#/person/${el.dataset.id}`; }); }

// ------------------------------------------------------------ one person
type Mind = { notes: { at: number; text: string }[]; summary: string; mood: string; plan?: { act: string; with?: number; why: string; until: number }; said?: { text: string } };
type Rule = { text: string; forbid: string[]; with: number; withName?: string; ai?: boolean; kind?: string; goal?: string; say?: string; plan?: { do: string }[] };
const ruleWhat = (x: Rule) => x.kind === 'when' ? `trigger: says “${esc(x.say ?? '')}” when ${esc(x.withName ?? '?')} is near` : x.kind === 'goal' ? (x.goal === 'marry' ? 'goal: finds a partner and marries' : x.goal === 'child' ? 'goal: marries, then has a child' : x.goal === 'plan' ? `goal: ${esc((x.plan ?? []).map((s) => s.do).join(' > '))}, once a game day` : 'goal: told to the AI as a main goal')
  : x.forbid.length ? 'blocks ' + esc(x.forbid.join(', ')) + (x.withName ? ' with ' + esc(x.withName) : '') : 'told to the AI only';
type Detail = Person & { now: number; profile: { traits: Record<string, number>; personality: string[]; generation: number; mind?: Mind; died?: number; cause?: string; rules?: Rule[] }; family: { parents: string[]; children: string[]; partner: string | null }; events: { at: number; kind: string; data: Record<string, unknown> }[] };
let pid = -1, ptab = load('ptab', 'overview'), chat: [string, string][] = [];
/** What is typed in the Talk box, kept while answers arrive and pages redraw (imad 2026-11-20: it emptied on every answer). */
let draft = '';
const chatHtml = () => chat.map(([w, t]) => `<div class="msg ${w === 'You' ? 'me' : w ? '' : 'sys'}">${w ? `<b>${esc(w)}</b>` : ''}${esc(t)}</div>`).join('') || '<div class="empty">Say something: they answer as themselves.</div>';
const ORDERS: [string, string, boolean][] = [
  ['goto', 'Go to…', true], ['follow', 'Follow…', true], ['bring', 'Bring food to…', true], ['talk', 'Talk with…', true], ['stay', 'Stay where you are', false], ['stop', 'Stop the order', false],
  ['drink', 'Drink', false], ['eat', 'Eat', false], ['forage', 'Find food', false], ['sleep', 'Sleep', false], ['wander', 'Walk around', false], ['rest', 'Rest', false],
  ['gather wood', 'Gather wood', false], ['gather stone', 'Gather stone', false], ['gather ore', 'Mine ore', false], ['go hunting', 'Go hunting', false],
  ['make an axe', 'Make an axe', false], ['make a spear', 'Make a spear', false], ['make a sword', 'Make a sword', false], ['make clothes', 'Make clothes', false],
  ['build a campfire', 'Build a campfire', false], ['build a hut', 'Build a hut', false], ['put a bed in a hut', 'Put a bed in a hut', false], ['put up a palisade', 'Put up a palisade', false],
  ['feed the fire', 'Feed the fire', false], ['collect food and store it', 'Collect food and store it', false], ['search the ruins', 'Search the ruins', false], ['plant a field', 'Plant a field', false], ['repair the huts', 'Repair the huts', false],
];
const TABS: [string, string][] = [['overview', 'Overview'], ['mind', 'Mind'], ['talk', 'Talk & orders'], ['edit', 'Edit'], ['family', 'Family'], ['rules', 'Rules'], ['events', 'Events']];

function personHtml(d: Detail): string {
  const p = d.profile, mind = p.mind;
  const head = `<div class="phead">${avatar(d.name, d.sex, 'lg')}<div class="ph-t"><h2>${esc(d.name)}</h2>
    <div class="chips">${d.alive ? `<span class="tag ok">alive</span>` : `<span class="tag bad">dead${p.cause ? ': ' + esc(p.cause) : ''}</span>`}<span class="chip">${d.sex === 'f' ? 'Woman' : 'Man'}, ${Math.floor(d.age)}</span><span class="chip">Generation ${p.generation}</span>${p.personality.map((x) => `<span class="chip">${esc(x)}</span>`).join('')}${mind?.mood ? `<span class="chip mood">${esc(mind.mood)}</span>` : ''}</div></div>
    ${(d as { player?: string | null }).player ? `<div class="chips"><span class="tag ok">Player: ${esc(String((d as { player?: string }).player))}</span><span class="chip">${(d as { manual?: boolean }).manual ? ((d as { online?: boolean }).online ? 'played by hand now: it answers, but orders and plans wait for autopilot (watch mode or the Me page)' : 'asleep (away): it answers, orders wait until autopilot is on') : 'on AI autopilot: orders and plans work'}</span></div>` : ''}
    <div class="ph-act">${d.alive ? `<button class="btn" id="xPlan">${icon('ai')} Plan now</button><button class="btn ghost" id="xMove">${icon('map')} To the town centre</button>${(d as { player?: string | null }).player ? '' : '<button class="btn danger ghost" id="xKill">Kill</button>'}` : ''}</div></div>
    <div class="tabs" id="xTabs">${TABS.map(([k, l]) => `<button data-t="${k}" class="${ptab === k ? 'on' : ''}">${l}</button>`).join('')}</div>`;
  let body = '';
  if (ptab === 'overview') body = !d.alive ? card('Died', `<p>${p.died !== undefined ? gameTime(p.died) : ''}: ${esc(p.cause ?? '')}</p>`) : `<div class="grid2">
    ${card('Needs', `<div class="needs"><span>Food</span>${meter(d.hunger)}<b>${Math.round(100 - d.hunger)}%</b><span>Water</span>${meter(d.thirst)}<b>${Math.round(100 - d.thirst)}%</b><span>Rest</span>${meter(d.tired)}<b>${Math.round(100 - d.tired)}%</b><span>Company</span>${meter(d.lonely)}<b>${Math.round(100 - d.lonely)}%</b><span>Health</span>${meter(d.hp, false)}<b>${Math.round(d.hp)}</b></div>`)}
    ${card('Now', `<p><i class="dotc" style="background:${ACT_COLORS[d.act]}"></i> <b>${esc(ACTS[d.act] ?? '')}</b>${d.talkingTo ? ' with ' + esc(d.talkingTo) : ''}</p>
      ${d.goal ? goalHtml(d.goal, esc) : ''}${d.order ? `<p>Told to <b>${esc(d.order)}</b></p>` : ''}
      <p>${icon('map')} ${esc(mapName(d.map))} at (${Math.round(d.x)}, ${Math.round(d.y)})</p>
      ${d.partner ? `<p>${icon('heart')} Partner: ${esc(d.partner)}${d.pregnant ? ' · expecting a baby' : ''}</p>` : ''}`)}
    ${card('Objectives', `<p><b>Level ${d.level ?? 0}</b> · ${d.xp ?? 0} points <small class="dim">(orders give more)</small></p>${(d.goals ?? []).length ? `<div class="feed">${d.goals!.map((g) => `<div class="ev"><span class="tag ${g.ok ? 'ok' : ''}">${g.ok ? '+' + g.xp : 'failed'}</span> <span>${esc(g.text)}${g.from !== 'myself' ? ` <small class="dim">(${g.from === 'owner' ? 'your order' : esc(g.from)})</small>` : ''}</span></div>`).join('')}</div>` : '<div class="empty">No objective finished yet.</div>'}`, { help: help('objectives') })}
    ${card('Bag', `<div class="chips">${invChips(d.inv, d.carry)}</div>`)}
    ${card('Traits', `<div class="traits">${Object.entries(p.traits).map(([k, v]) => k === 'lifespan' ? `<span>Lifespan</span><b>${Math.round(v)} years</b>` : `<span>${esc(k)}</span><div class="meter good"><i style="width:${Math.round(Math.min(1, v) * 100)}%"></i></div>`).join('')}</div>`)}
    </div>`;
  else if (ptab === 'mind') body = card('Mind', !mind ? '<div class="empty">The AI has not thought for them yet (turn on an AI provider on the AI page).</div>' : `
    <p>Mood: <b>${esc(mind.mood)}</b></p>
    ${mind.plan && mind.plan.until > d.now ? `<p>Wants to <b>${esc(mind.plan.act)}${mind.plan.with != null ? ' with ' + esc(who(mind.plan.with)) : ''}</b>${mind.plan.why ? ` <span class="dim">(${esc(mind.plan.why)})</span>` : ''}</p>` : ''}
    ${mind.said ? `<p>Last said: “${esc(mind.said.text)}”</p>` : ''}
    <h4 class="sub">Memory</h4><p>${esc(mind.summary || 'nothing yet')}</p>
    <h4 class="sub">Recent notes</h4>${mind.notes.length ? mind.notes.slice().reverse().map((n) => `<div class="ev"><span class="ev-t">${gameTime(n.at)}</span><span>${esc(n.text)}</span></div>`).join('') : '<div class="empty">None.</div>'}`, { help: help('pMind') });
  else if (ptab === 'talk') body = `<div class="grid2">${card('Talk', `<div class="chat" id="xChat">${chatHtml()}</div>
      <div class="row"><input id="xSay" maxlength="300" value="${esc(draft)}" placeholder="Say something to ${esc(d.name)}…"><button class="btn primary" id="xTalk">${icon('chat')} Talk</button></div>`, { help: help('pTalk') })}
    ${card('Give an order', `<label class="fld">What<select id="xOrd">${ORDERS.map(([k, l]) => `<option value="${k}">${l}</option>`).join('')}</select></label>
      <label class="fld" id="xWhoF">Who<input id="xWho" list="xNames" placeholder="a name"><datalist id="xNames">${[...new Set(S.people.map((x) => x.name))].filter((n) => n !== d.name).map((n) => `<option value="${esc(n)}">`).join('')}</datalist></label>
      <button class="btn primary" id="xOrdGo">Do it</button>`, { help: help('pOrder') })}</div>`;
  else if (ptab === 'edit') body = card('Edit', `<div class="form">${[['name', d.name], ['personality', p.personality.join(', ')], ['hunger', d.hunger], ['thirst', d.thirst], ['tired', d.tired], ['lonely', d.lonely], ['hp', d.hp], ['carry', d.carry],
      ...Object.entries(p.traits).map(([k, v]) => [k, Math.round(v * 100) / 100])].map(([k, v]) => `<label class="fld">${esc(k)}<input data-k="${esc(k)}" value="${esc(v)}" ${typeof v === 'number' ? `type="number" step="${k === 'lifespan' ? 1 : ['hunger', 'thirst', 'tired', 'lonely', 'hp', 'carry'].includes(String(k)) ? 1 : 0.05}"` : ''}></label>`).join('')}</div>
      <button class="btn primary" id="xSave">Save changes</button>`, { help: help('pEdit') });
  else if (ptab === 'family') body = card('Family', `<div class="fam">
      <div><h4 class="sub">Parents</h4>${d.family.parents.map((n) => `<span class="chip">${esc(n)}</span>`).join('') || '<span class="dim">Unknown (first survivors)</span>'}</div>
      <div><h4 class="sub">Partner</h4>${d.family.partner ? `<span class="chip">${icon('heart')} ${esc(d.family.partner)}</span>` : '<span class="dim">none</span>'}</div>
      <div><h4 class="sub">Children</h4>${d.family.children.map((n) => `<span class="chip">${esc(n)}</span>`).join('') || '<span class="dim">none</span>'}</div></div>`, { help: help('pFamily') });
  else if (ptab === 'rules') body = card('Their rules', `<div id="xRules"><div class="skel"></div></div><div class="row"><input id="xRule" maxlength="160" placeholder="never talk to Jade"><button class="btn primary" id="xRuleAdd">Add rule</button></div>`, { help: help('pRules') });
  else if (ptab === 'events') body = card('What happened to them', d.events.map((e) => `<div class="ev"><span class="ev-t">${gameTime(e.at)}</span><span>${esc(describe(e))}</span></div>`).join('') || '<div class="empty">Nothing yet.</div>');
  return head + `<div id="xBody">${body}</div>`;
}

let detail: Detail | null = null;
async function loadPerson(): Promise<void> {
  if (!S.people.length) await people();
  detail = await cmd<Detail>({ cmd: 'agent', id: pid });
  setHtml('xPage', personHtml(detail));
  bindPerson();
  if (ptab === 'rules') void loadRules();
}
type RulesAns = { all: Rule[]; people: { id: number; name: string; rules: Rule[] }[]; max: number };
async function loadRules(r?: RulesAns): Promise<void> {
  r ??= await cmd<RulesAns>({ cmd: 'rules' });
  const list = r.people.find((x) => x.id === pid)?.rules ?? [];
  setHtml('xRules', list.length ? list.map((x, k) => `<div class="li"><span>“${esc(x.text)}”<br><small class="dim">${ruleWhat(x)}${x.ai ? ' · understood by the AI' : ''}</small></span><button class="btn sm ghost" data-rm="${k}">Remove</button></div>`).join('') : '<div class="empty">No rules for them.</div>');
  on('#xRules [data-rm]', 'click', async (b) => { try { await loadRules(await cmd<RulesAns>({ cmd: 'rules', id: pid, remove: Number(b.dataset.rm) })); toast('Rule removed', 'ok'); } catch (e) { toast(String(e), 'err'); } });
}
/** A new line in the conversation: only the messages are redrawn, never the box being typed in. */
function addChat(w: string, t: string): void {
  chat.push([w, t]); if (chat.length > 40) chat.shift();
  const c = document.getElementById('xChat');
  if (c) { c.innerHTML = chatHtml(); c.scrollTop = c.scrollHeight; }
}
export function personSaid(id: number, name: string, text: string): void { if (id === pid) addChat(name, text); }

function bindPerson(): void {
  on('#xTabs button', 'click', (b) => { ptab = b.dataset.t!; save('ptab', ptab); if (detail) { setHtml('xPage', personHtml(detail)); bindPerson(); if (ptab === 'rules') void loadRules(); } });
  on('#xPlan', 'click', async (b) => { (b as HTMLButtonElement).disabled = true; b.textContent = 'Thinking…'; try { await cmd({ cmd: 'planNow', id: pid }, 120000); toast('New plan made', 'ok'); ptab = 'mind'; await loadPerson(); } catch (e) { toast(String(e), 'err'); (b as HTMLButtonElement).disabled = false; } });
  on('#xMove', 'click', async () => { try { await cmd({ cmd: 'agentMove', id: pid, map: 'town' }); toast('Moved to the town centre', 'ok'); void loadPerson(); } catch (e) { toast(String(e), 'err'); } });
  on('#xKill', 'click', async () => { if (!detail || !confirm(`Kill ${detail.name}? This can't be undone.`)) return; try { await cmd({ cmd: 'kill', id: pid }); toast(`${detail.name} was killed`, 'ok'); void loadPerson(); } catch (e) { toast(String(e), 'err'); } });
  const talk = async () => {
    const t = val('xSay'); if (!t) return;
    draft = ''; const box = document.getElementById('xSay') as HTMLInputElement | null; if (box) { box.value = ''; box.focus(); }
    addChat('You', t);
    try { const r = await cmd<{ reply: string; ai: boolean; did?: string }>({ cmd: 'chat', id: pid, text: t }, 120000); if (!r.ai) addChat('', 'Answered without AI: turn on Gemini or Ollama on the AI page.'); if (r.did) addChat('', `→ will ${r.did}`); } catch (e) { addChat('', String(e)); }
  };
  on('#xTalk', 'click', () => void talk());
  on('#xSay', 'input', (el) => { draft = (el as HTMLInputElement).value; });
  { const c = document.getElementById('xChat'); if (c) c.scrollTop = c.scrollHeight; }
  on('#xSay', 'keydown', (_el, e) => { if ((e as KeyboardEvent).key === 'Enter') void talk(); });
  const syncWho = () => { const o = ORDERS.find((x) => x[0] === val('xOrd')); const f = document.getElementById('xWhoF'); if (f) f.hidden = !o?.[2]; };
  on('#xOrd', 'change', syncWho); syncWho();
  on('#xOrdGo', 'click', async () => { try { const r = await cmd<{ did: string }>({ cmd: 'order', id: pid, kind: val('xOrd'), target: val('xWho') }); addChat('', `→ will ${r.did}`); toast(`Order given: ${r.did}`, 'ok'); } catch (e) { toast(String(e), 'err'); } });
  on('#xSave', 'click', async () => {
    const set: Record<string, number | string> = {};
    for (const i of view().querySelectorAll<HTMLInputElement>('#xBody input[data-k]')) set[i.dataset.k!] = i.type === 'number' ? Number(i.value) : i.value;
    try { await cmd({ cmd: 'agentSet', id: pid, set }); toast('Saved', 'ok'); void loadPerson(); } catch (e) { toast(String(e), 'err'); }
  });
  on('#xRuleAdd', 'click', async () => { const t = val('xRule'); if (!t) return; try { await loadRules(await cmd<RulesAns>({ cmd: 'rules', id: pid, add: t }, 60000)); toast('Rule added', 'ok'); } catch (e) { toast(String(e), 'err'); } });
}

export const personScreen: Screen = {
  title: 'Person', icon: 'people', help: 'person', every: 5,
  render() { return `<a class="backlink" href="#/people">${icon('back')} People</a><div id="xPage"><div class="skel tall"></div></div>`; },
  async mount(arg) { if (Number(arg) !== pid) { chat = []; draft = ''; } pid = Number(arg); try { await loadPerson(); } catch (e) { setHtml('xPage', `<div class="empty">${esc(String(e))}</div>`); } },
  async refresh() {
    // Live tabs only: never while typing in a form.
    if (ptab !== 'overview' && ptab !== 'mind' && ptab !== 'events') return;
    try { await loadPerson(); } catch { /* next time */ }
  },
};
