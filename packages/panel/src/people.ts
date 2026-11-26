import { cmd } from './api.js';
import { help } from './help.js';
import { card, on, setHtml, val, view, type Screen } from './screen.js';
import { S, people, profiles, describe, who, mapName, overview, goalHtml, killsText, type Person } from './state.js';
import { esc, gameTime, icon, meter, ACTS, ACT_COLORS, load, save, toast, ruleRow, type Rule, type RulesAns } from './util.js';

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
    return `<div class="tbl-wrap"><table class="tbl"><thead><tr><th>Name</th><th>Age</th><th>Gen.</th><th>Parents</th><th>Partner</th><th>Children</th><th>Kills</th><th>Died</th></tr></thead><tbody>${rows.map((p) =>
      `<tr class="link" data-id="${p.id}"><td>${avatar(p.name, p.sex, 'sm')} <b>${esc(p.name)}</b>${p.alive ? ' <span class="tag ok">alive</span>' : ''}</td><td>${p.age}</td><td>${p.generation}</td><td>${esc(p.parents.join(', ') || '-')}</td><td>${esc(p.partner ?? '-')}</td><td>${p.children}</td><td><small>${esc(killsText(p.kills) || '-')}</small></td><td>${p.died !== null ? `${gameTime(p.died)}<br><small>${esc(p.cause ?? '')}</small>` : '-'}</td></tr>`).join('')}</tbody></table></div>`;
  }
  let list = S.people.filter((p) => !p.player && (mapF === 'all' || p.map === mapF) && (!q || p.name.toLowerCase().includes(q)));
  const key: Record<string, (p: Person) => number | string> = { name: (p) => p.name, age: (p) => -p.age, hp: (p) => p.hp, hunger: (p) => -p.hunger, thirst: (p) => -p.thirst, act: (p) => p.act, influence: (p) => -(p.influence ?? 0), kills: (p) => -((p.kills?.animals ?? 0) + (p.kills?.zombies ?? 0) * 3 + (p.kills?.people ?? 0) * 10) };
  const k = key[sort] ?? key.name!;
  list = list.sort((a, b) => { const x = k(a), y = k(b); return x < y ? -1 : x > y ? 1 : 0; });
  const players = S.people.filter((p) => p.player && (!q || p.name.toLowerCase().includes(q)));
  return (list.length ? `<div class="pgrid">${list.map((p) => `<a class="pcard" href="#/person/${p.id}">
      <div class="pc-h">${avatar(p.name, p.sex)}<div><b>${esc(p.name)}</b><small>${p.sex === 'f' ? 'Woman' : 'Man'}, ${p.age}${p.child ? ' · child' : ''}${p.pregnant ? ' · expecting' : ''}</small></div></div>
      <div class="pc-a"><i class="dotc" style="background:${ACT_COLORS[p.act] ?? '#888'}"></i>${esc(ACTS[p.act] ?? '')}${p.talkingTo ? ' with ' + esc(p.talkingTo) : ''}${!p.goal && p.order ? `<br><small>Told to ${esc(p.order)}</small>` : ''}</div>${p.goal ? goalHtml(p.goal, esc) : ''}
      <div class="pc-m"><span>Food</span>${meter(p.hunger)}<span>Water</span>${meter(p.thirst)}<span>Rest</span>${meter(p.tired)}<span>Health</span>${meter(p.hp, false)}</div>
      <div class="pc-f">${icon('map')} ${esc(mapName(p.map))} (${Math.round(p.x)}, ${Math.round(p.y)})${p.partner ? ` · ${icon('heart')} ${esc(p.partner)}` : ''}${p.influence !== undefined ? ` · ${icon('star')} influence ${p.influence}` : ''}${killsText(p.kills) ? `<br><small>Killed ${esc(killsText(p.kills))}</small>` : ''}</div></a>`).join('')}</div>` : '<div class="empty">Nobody matches.</div>')
    + (players.length ? `<h4 class="sub">Players' characters</h4><div class="pgrid">${players.map((p) => `<a class="pcard player" href="#/person/${p.id}"><div class="pc-h">${avatar(p.name)}<div><b>${esc(p.name)}</b><small>player · ${p.online ? (p.asleep ? 'here, asleep' : 'playing now') : 'away (asleep)'}</small></div></div><div class="pc-f">${icon('map')} ${esc(mapName(p.map))} (${Math.round(p.x)}, ${Math.round(p.y)})</div></a>`).join('')}</div>` : '');
}

export const peopleScreen: Screen = {
  title: 'People', icon: 'people', help: 'people', every: 4,
  render() {
    return `<div class="toolbar">
        <div class="seg" id="pTabs">${[['alive', 'Alive'], ['dead', 'Dead'], ['all', 'Everyone ever']].map(([k, l]) => `<button data-t="${k}" class="${tab === k ? 'on' : ''}">${l}</button>`).join('')}</div>
        <label class="search">${icon('search')}<input id="pQ" placeholder="Search a name" value="${esc(q)}"></label>
        <select id="pMapF" aria-label="Map"><option value="all">Every map</option></select>
        <select id="pSort" aria-label="Sort"><option value="name">Sort: name</option><option value="age">Sort: oldest</option><option value="hp">Sort: weakest</option><option value="hunger">Sort: hungriest</option><option value="thirst">Sort: thirstiest</option><option value="act">Sort: activity</option><option value="influence">Sort: most influence</option><option value="kills">Sort: most kills</option></select>
        <button class="btn" id="pAdd">${icon('plus')} Add a person</button>
      </div><div id="pClans"></div><div id="pList"><div class="skel tall"></div></div>`;
  },
  async mount() {
    on('#pTabs button', 'click', (b) => { tab = b.dataset.t!; save('pTab', tab); for (const x of view().querySelectorAll('#pTabs button')) x.classList.toggle('on', x === b); void this.refresh!(); });
    on('#pQ', 'input', (el) => { q = (el as HTMLInputElement).value.trim().toLowerCase(); setHtml('pList', listHtml()); bindList(); });
    on('#pSort', 'change', (el) => { sort = (el as HTMLSelectElement).value; save('pSort', sort); setHtml('pList', listHtml()); bindList(); });
    on('#pMapF', 'change', (el) => { mapF = (el as HTMLSelectElement).value; setHtml('pList', listHtml()); bindList(); });
    on('#pAdd', 'click', async () => {
      if (!confirm('Add a new person in Old Town? (The world normally grows only by births.)')) return;
      try { const r = await cmd<{ name?: string }>({ cmd: 'spawn', map: 'town', x: 128, y: 128 }); toast(`${r.name || 'A new person'} arrived in Old Town`, 'ok'); void this.refresh!(); } catch (e) { toast(String(e), 'err'); }
    });
    (document.getElementById('pSort') as HTMLSelectElement).value = sort;
    const ov = await overview();
    (document.getElementById('pMapF') as HTMLSelectElement).innerHTML = '<option value="all">Every map</option>' + ov.maps.map((m) => `<option value="${m.id}">${esc(m.name)}</option>`).join('');
    await this.refresh!();
  },
  async refresh() {
    try { if (tab === 'alive') await people(true); else await profiles(); setHtml('pList', listHtml()); bindList(); void loadClans(); } catch (e) { toast(String(e), 'err'); }
  },
};
type ClanRow = { id: number; name: string; map: string; leader: string; leaderId: number; home: number[]; founder: string; approval: number; order: string; lastVote: number;
  vote: { end: number; why: string; cands: string[]; votes: number } | null; result: { at: number; winner: string; old: string; tally: [string, number][] } | null;
  members: { id: number; name: string; loyalty: number; respect: number; influence?: number }[]; rivals: { name: string; tension: number }[] };
type PlanRow = { map: string; name: string; people: number; clan: string; leader: string; most: string; lines: { key: string; have: number; want: number }[];
  boxes: { kind: 'fridge' | 'chest'; at: number[]; inv: Record<string, number>; owner: string }[]; working: Record<string, number> };
const PLAN_WORDS: Record<string, string> = { food: 'Food kept', water: 'Water kept', homes: 'Homes', beds: 'Beds', fridges: 'Fridges', chests: 'Chests', wood: 'Wood in store', stone: 'Stone in store' };
type QuestsInfo = { npcs: { key: string; name: string; x: number; y: number; map: string }[]; quests: { id: string; title: string; npc: string; lesson: string; xp: number }[];
  people: { id: number; name: string; player: boolean; done: number; cur: string; n: number; need: number; ready: boolean }[] };
/**
 * Clans (imad 2026-11-25: deep clans): elected leader with the members' approval, members by respect with loyalty, the election under way or the
 * last result, the leader's order of the day, rivals; "Call a vote" opens an election. Quests: the town's teachers and everyone's progress.
 */
async function loadClans(): Promise<void> {
  const el = document.getElementById('pClans'); if (!el) return;
  try {
    const [r, q, pl] = await Promise.all([cmd<{ clans: ClanRow[]; now: number }>({ cmd: 'clans' }), cmd<QuestsInfo>({ cmd: 'quests' }).catch(() => null), cmd<{ plans: PlanRow[] }>({ cmd: 'campPlan' }).catch(() => null)]);
    const plans = pl?.plans.length ? card('Camp plans', `<p class="dim">Each camp keeps food and water for the days to come, a home for every household with beds, a fridge and a chest, and wood and stone in the store. Free people work on the biggest hole first; the leader says it aloud.</p>`
      + pl.plans.map((p) => `<div class="li" style="display:block"><b>${esc(p.name)}</b> <span class="dim">${p.clan ? esc(p.clan) + ' clan · ' : ''}${p.people} people${p.leader ? ' · leader ' + esc(p.leader) : ''}${p.most ? ' · most needed: <b>' + esc(PLAN_WORDS[p.most] ?? p.most) + '</b>' : ' · all stocked'}</span>
        <div class="plan">${p.lines.filter((l) => l.want > 0).map((l) => { const pc = Math.min(100, Math.round((l.have / l.want) * 100)); return `<div class="pl"><span>${esc(PLAN_WORDS[l.key] ?? l.key)}</span><div class="bar"><i style="width:${pc}%;background:${pc >= 100 ? 'var(--ok)' : pc >= 50 ? 'var(--warn)' : 'var(--bad)'}"></i></div><b>${l.have} / ${l.want}</b></div>`; }).join('')}</div>
        ${Object.keys(p.working).length ? `<small class="dim">Working on it now: ${Object.entries(p.working).sort((a, b) => b[1] - a[1]).map(([k, n]) => `${esc(k)} ${n}`).join(', ')}</small><br>` : ''}
        ${p.boxes.length ? `<small class="dim">Stores at home: ${p.boxes.map((b) => `${b.kind === 'fridge' ? '🧊' : '🧰'} ${esc(b.owner || 'free hut')} (${Object.entries(b.inv).filter(([, v]) => v).map(([k, v]) => `${v} ${esc(k)}`).join(', ') || 'empty'})`).join(' · ')}</small>` : ''}</div>`).join('')) : '';
    const clans = r.clans.length ? card('Clans', r.clans.map((c) => `<div class="li" style="display:block"><b>${esc(c.name)}</b> <span class="dim">elected leader <a href="#/person/${c.leaderId}">${esc(c.leader)}</a> · approval ${c.approval}% · ${esc(mapName(c.map))} · home (${c.home.join(', ')})${c.founder ? ' · founded by ' + esc(c.founder) : ''}</span>
      <div class="chips">${c.members.slice().sort((a, b) => (b.influence ?? 0) - (a.influence ?? 0)).map((m) => `<a class="chip" href="#/person/${m.id}" title="influence ${m.influence ?? '?'}, respect ${m.respect}, loyalty ${m.loyalty}%">${esc(m.name)} <small class="dim">${m.influence !== undefined ? `influence ${m.influence} · ` : ''}loyal ${m.loyalty}%</small></a>`).join('')}</div>
      ${c.vote ? `<small><b>Election on</b>: ${esc(c.vote.cands.join(' / '))} (${esc(c.vote.why)}), ${c.vote.votes} votes so far, closes ${gameTime(c.vote.end)}</small><br>` : c.result ? `<small class="dim">Last vote ${gameTime(c.result.at)}: ${esc(c.result.winner)} won${c.result.winner !== c.result.old ? ' (was ' + esc(c.result.old) + ')' : ''} · ${c.result.tally.map(([n, v]) => `${esc(n)} ${v}`).join(', ')}</small><br>` : ''}
      ${c.order ? `<small class="dim">Leader's order: “${esc(c.order)}”</small><br>` : ''}
      ${c.rivals.length ? `<small class="dim">Rivals: ${c.rivals.map((x) => `${esc(x.name)} (tension ${x.tension}/10)`).join(', ')}</small><br>` : ''}
      ${c.vote ? '' : `<button class="btn sm" data-vote="${c.id}">Call a vote</button>`}</div>`).join('')) : '';
    const quests = q ? card('Quests', `<p class="dim">Teachers in ${esc(mapName(q.npcs[0]?.map ?? ''))}: ${q.npcs.map((n) => `${esc(n.name)} (${n.x}, ${n.y})`).join(', ')}. Ten quests in order; each lesson stays in the person's prompts.</p>
      <table><tr><th>Person</th><th>Done</th><th>Now</th></tr>${q.people.sort((a, b) => b.done - a.done).map((p) => `<tr><td><a href="#/person/${p.id}">${esc(p.name)}</a>${p.player ? ' <small class="dim">player</small>' : ''}</td><td>${p.done} / ${q.quests.length}</td><td>${p.cur ? esc(p.cur) + (p.ready ? ' <small>(hand it in)</small>' : ` <small class="dim">${p.n}/${p.need}</small>`) : '<span class="dim">—</span>'}</td></tr>`).join('')}</table>`) : '';
    el.innerHTML = plans + clans + quests;
    on('[data-vote]', 'click', (b) => { void cmd({ cmd: 'clanVote', id: Number(b.dataset.vote) }).then(() => { toast('Election opened (2 game hours)'); void loadClans(); }, (e) => toast(String(e), 'err')); });
  } catch { /* next time */ }
}
function bindList(): void { on('tr.link', 'click', (el) => { location.hash = `#/person/${el.dataset.id}`; }); }

// ------------------------------------------------------------ one person
type Mind = { notes: { at: number; text: string }[]; summary: string; mood: string; plan?: { act: string; with?: number; why: string; until: number }; said?: { text: string } };
type Detail = Person & { now: number; hpMax?: number; profile: { traits: Record<string, number>; personality: string[]; generation: number; mind?: Mind; died?: number; cause?: string; rules?: Rule[]; kills?: { animals: Record<string, number>; zombies: number; people: number; beaten: number } }; family: { parents: string[]; children: string[]; partner: string | null; siblings?: string[]; stage?: string; carer?: string | null; held?: boolean;
  chosen?: { id: number; name: string; role: string }[]; kids?: { id: number; name: string; age: number; stage: string; hunger: number; thirst: number; tired: number; hp: number; carer: string }[] }; events: { at: number; kind: string; data: Record<string, unknown> }[] };
type Say = { at: number; from: number; to: number; fromName: string; toName: string; text: string };
let pid = -1, ptab = load('ptab', 'overview'), chat: [string, string][] = [];
/** What is typed in the Talk box, kept while answers arrive and pages redraw (imad 2026-11-20: it emptied on every answer). */
let draft = '';
const chatHtml = () => chat.map(([w, t]) => `<div class="msg ${w === 'You' ? 'me' : w ? '' : 'sys'}">${w ? `<b>${esc(w)}</b>` : ''}${esc(t)}</div>`).join('') || '<div class="empty">Say something: they answer as themselves.</div>';
const ORDERS: [string, string, boolean][] = [
  ['goto', 'Go to…', true], ['follow', 'Follow…', true], ['bring', 'Bring food to…', true], ['talk', 'Talk with…', true], ['stay', 'Stay where you are', false], ['stop', 'Stop the order', false],
  ['marry', 'Ask … to marry them (walks there, they decide)', true], ['divorce', 'Divorce … (empty = their partner)', true],
  ['drink', 'Drink', false], ['eat', 'Eat', false], ['forage', 'Find food', false], ['sleep', 'Sleep', false], ['wander', 'Walk around', false], ['rest', 'Rest', false],
  ['gather wood', 'Gather wood', false], ['gather stone', 'Gather stone', false], ['gather ore', 'Mine ore', false], ['go hunting', 'Go hunting', false],
  ['make an axe', 'Make an axe', false], ['make a spear', 'Make a spear', false], ['make a sword', 'Make a sword', false], ['make clothes', 'Make clothes', false],
  ['build a campfire', 'Build a campfire', false], ['build a hut', 'Build a hut', false], ['put a bed in a hut', 'Put a bed in a hut', false], ['put up a palisade', 'Put up a palisade', false],
  ['feed the fire', 'Feed the fire', false], ['collect food and store it', 'Collect food and store it', false], ['search the ruins', 'Search the ruins', false], ['plant a field', 'Plant a field', false], ['repair the huts', 'Repair the huts', false],
];
const convoHtml = (d: Detail & { talk?: Say[] }) => (d.talk ?? []).map((l) => {
  const mine = l.from === d.id;
  return `<div class="msg ${mine ? 'me' : ''}"><b>${esc(l.fromName)}${l.toName ? ' → ' + esc(l.toName) : ''}</b>${esc(l.text)} <small class="dim">${gameTime(l.at)}</small></div>`;
}).join('') || '<div class="empty">Nobody has talked to them yet.</div>';
const TABS: [string, string][] = [['overview', 'Overview'], ['mind', 'Mind'], ['talk', 'Talk & orders'], ['convo', 'Conversations'], ['edit', 'Edit'], ['family', 'Family'], ['rules', 'Rules'], ['events', 'Events']];

function personHtml(d: Detail): string {
  const p = d.profile, mind = p.mind;
  const head = `<div class="phead">${avatar(d.name, d.sex, 'lg')}<div class="ph-t"><h2>${esc(d.name)}</h2>
    <div class="chips">${d.alive ? `<span class="tag ok">alive</span>` : `<span class="tag bad">dead${p.cause ? ': ' + esc(p.cause) : ''}</span>`}<span class="chip">${d.sex === 'f' ? 'Woman' : 'Man'}, ${Math.floor(d.age)}</span><span class="chip">Generation ${p.generation}</span>${p.personality.map((x) => `<span class="chip">${esc(x)}</span>`).join('')}${mind?.mood ? `<span class="chip mood">${esc(mind.mood)}</span>` : ''}</div></div>
    ${(d as { player?: string | null }).player ? `<div class="chips"><span class="tag ok">Player: ${esc(String((d as { player?: string }).player))}</span><span class="chip">${(d as { manual?: boolean }).manual ? ((d as { online?: boolean }).online ? 'played by hand now: it answers, but orders and plans wait for autopilot (watch mode or the Me page)' : 'asleep (away): it answers, orders wait until autopilot is on') : 'on AI autopilot: orders and plans work'}</span></div>` : ''}
    <div class="ph-act">${d.alive ? `<button class="btn" id="xPlan">${icon('ai')} Plan now</button><button class="btn ghost" id="xMove">${icon('map')} To the town centre</button>${(d as { player?: string | null }).player ? '' : '<button class="btn danger ghost" id="xKill">Kill</button>'}` : ''}</div></div>
    <div class="tabs" id="xTabs">${TABS.map(([k, l]) => `<button data-t="${k}" class="${ptab === k ? 'on' : ''}">${l}</button>`).join('')}</div>`;
  let body = '';
  if (ptab === 'overview') body = !d.alive ? card('Died', `<p>${p.died !== undefined ? gameTime(p.died) : ''}: ${esc(p.cause ?? '')}</p>`) : `<div class="grid2">
    ${card('Needs', `<div class="needs"><span>Food</span>${meter(d.hunger)}<b>${Math.round(100 - d.hunger)}%</b><span>Water</span>${meter(d.thirst)}<b>${Math.round(100 - d.thirst)}%</b><span>Rest</span>${meter(d.tired)}<b>${Math.round(100 - d.tired)}%</b><span>Company</span>${meter(d.lonely)}<b>${Math.round(100 - d.lonely)}%</b><span>Health</span>${meter(d.hp, false)}<b>${Math.round((d.hp / (d.hpMax || 100)) * 100)}%</b></div>`)}
    ${card('Now', `<p><i class="dotc" style="background:${ACT_COLORS[d.act]}"></i> <b>${esc(ACTS[d.act] ?? '')}</b>${d.talkingTo ? ' with ' + esc(d.talkingTo) : ''}</p>
      ${d.goal ? goalHtml(d.goal, esc) : ''}${d.order ? `<p>Told to <b>${esc(d.order)}</b></p>` : ''}
      <p>${icon('map')} ${esc(mapName(d.map))} at (${Math.round(d.x)}, ${Math.round(d.y)})</p>
      ${d.partner ? `<p>${icon('heart')} Partner: ${esc(d.partner)}${d.pregnant ? ' · expecting a baby' : ''}</p>` : ''}`)}
    ${card('Objectives', `<p><b>Level ${d.level ?? 0}</b> · ${d.xp ?? 0} points <small class="dim">(orders give more)</small></p>${(d.goals ?? []).length ? `<div class="feed">${d.goals!.map((g) => `<div class="ev"><span class="tag ${g.ok ? 'ok' : ''}">${g.ok ? '+' + g.xp : 'failed'}</span> <span>${esc(g.text)}${g.from !== 'myself' ? ` <small class="dim">(${g.from === 'owner' ? 'your order' : esc(g.from)})</small>` : ''}</span></div>`).join('')}</div>` : '<div class="empty">No objective finished yet.</div>'}`, { help: help('objectives') })}
    ${(d as { clan?: { name: string; leader: string; loyalty: number; rivals: string[] } | null }).clan ? card('Clan', ((c) => `<p><b>${esc(c.name)}</b> · elected leader ${esc(c.leader)}${c.approval !== undefined ? ` (approval ${c.approval}%)` : ''}</p><p>Loyalty ${c.loyalty}%${c.respect !== undefined ? ` · respect ★${c.respect}` : ''}</p>${c.rivals.length ? `<p class="dim">Rivals: ${esc(c.rivals.join(', '))}</p>` : ''}`)((d as unknown as { clan: { name: string; leader: string; loyalty: number; approval?: number; respect?: number; rivals: string[] } }).clan)) : ''}
    ${((q) => q ? card('Quests', `<p>${q.done} of ${q.all} done${q.cur ? ` · now <b>${esc(q.cur)}</b> ${q.ready ? '(done: hand it in)' : `${q.n}/${q.need}`}` : ''}</p>`) : '')((d as { quests?: { done: number; all: number; cur: string; n: number; need: number; ready: boolean } }).quests)}
    ${card('Influence', influenceHtml(d.influence, d.influenceLog), { help: help('influence') })}
    ${card('Kills and fights', killsHtml(p.kills), { help: help('kills') })}
    ${card('Bag', `<div class="chips">${invChips(d.inv, d.carry)}</div>`)}
    ${card('Traits', `<div class="traits">${Object.entries(p.traits).map(([k, v]) => k === 'lifespan' ? `<span>Lifespan</span><span></span><b>${Math.round(v)} years</b>` : `<span>${esc(k)}</span><div class="meter good"><i style="width:${Math.round(Math.min(1, v) * 100)}%"></i></div><b>${Math.round(v * 100)}%</b>`).join('')}</div>`)}
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
  else if (ptab === 'convo') body = card('Conversations', `<div class="chat" id="xConvo">${convoHtml(d)}</div>`);
  else if (ptab === 'edit') body = card('Edit', `<div class="form">${editFields(d).map(([k, label, v, unit]) => `<label class="fld">${esc(label)}${unit ? ` (${esc(unit)})` : ''}<input data-k="${esc(k)}" value="${esc(v)}" ${typeof v === 'number' ? `type="number" step="${k === 'age' ? '0.1' : '1'}"` : ''}></label>`).join('')}</div>
      <button class="btn primary" id="xSave">Save changes</button>`, { help: help('pEdit') });
  else if (ptab === 'family') body = card('Family', `<div class="fam">
      <div><h4 class="sub">Parents</h4>${d.family.parents.map((n) => `<span class="chip">${esc(n)}</span>`).join('') || '<span class="dim">Unknown (first survivors)</span>'}</div>
      <div><h4 class="sub">Partner</h4>${d.family.partner ? `<span class="chip">${icon('heart')} ${esc(d.family.partner)}</span>` : '<span class="dim">none</span>'}</div>
      <div><h4 class="sub">Children</h4>${d.family.children.map((n) => `<span class="chip">${esc(n)}</span>`).join('') || '<span class="dim">none</span>'}</div>
      <div><h4 class="sub">Brothers and sisters</h4>${(d.family.siblings ?? []).map((n) => `<span class="chip">${esc(n)}</span>`).join('') || '<span class="dim">none</span>'}</div>
      ${d.family.stage && d.family.stage !== 'adult' ? `<div><h4 class="sub">Stage</h4><span class="chip">${esc(d.family.stage)}</span>${d.family.carer ? ` <span class="dim">looked after by ${esc(d.family.carer)}${d.family.held ? ', in their arms' : ''}</span>` : d.family.stage === 'baby' || d.family.stage === 'toddler' ? ' <span class="dim">nobody is looking after them!</span>' : ''}</div>` : ''}
      </div>
      ${(d.family.kids ?? []).length ? `<h4 class="sub">Their children now</h4><table class="tbl"><tr><th>Name</th><th>Age</th><th>Food</th><th>Water</th><th>Rest</th><th>Health</th><th>Looked after by</th></tr>${(d.family.kids ?? []).map((k) => `<tr><td>${esc(k.name)}</td><td>${k.age} (${esc(k.stage)})</td><td>${100 - k.hunger} %</td><td>${100 - k.thirst} %</td><td>${100 - k.tired} %</td><td>${k.hp}</td><td>${esc(k.carer || d.name)}</td></tr>`).join('')}</table>` : ''}
      <h4 class="sub">Chosen family</h4>${(d.family.chosen ?? []).map((c) => `<span class="chip">${esc(c.name)}: their ${esc(c.role)} <a href="#" data-kdel="${c.id}">✕</a></span>`).join('') || '<span class="dim">none</span>'}
      <div class="row"><select id="xKinRole"><option value="child">is their child</option><option value="sibling">is their brother / sister</option><option value="parent">is their parent</option></select>
      <input id="xKinWho" list="xKinNames" placeholder="a name"><datalist id="xKinNames">${S.people.filter((x) => x.id !== d.id).map((x) => `<option value="${esc(x.name)}">`).join('')}</datalist>
      <button class="btn primary" id="xKinGo">Set</button></div>`, { help: help('pFamily') });
  else if (ptab === 'rules') body = card('Their rules', `<div id="xRules"><div class="skel"></div></div><div class="row"><input id="xRule" maxlength="160" placeholder="never talk to Jade"><button class="btn primary" id="xRuleAdd">Add rule</button></div>`, { help: help('pRules') });
  else if (ptab === 'events') body = card('What happened to them', d.events.map((e) => `<div class="ev"><span class="ev-t">${gameTime(e.at)}</span><span>${esc(describe(e))}</span></div>`).join('') || '<div class="empty">Nothing yet.</div>');
  return head + `<div id="xBody">${body}</div>`;
}

let detail: Detail | null = null;
/** Redraws the person page and keeps what the reader was doing: page scroll, tab bar scroll, scroll inside the chat boxes (imad 2026-11-21). */
function redraw(): void {
  if (!detail) return;
  const sy = window.scrollY, ts = document.getElementById('xTabs')?.scrollLeft ?? 0;
  const keep: Record<string, [number, boolean]> = {};
  for (const id of ['xChat', 'xConvo']) { const c = document.getElementById(id); if (c) keep[id] = [c.scrollTop, c.scrollTop + c.clientHeight >= c.scrollHeight - 8]; }
  setHtml('xPage', personHtml(detail));
  bindPerson();
  const t = document.getElementById('xTabs'); if (t) { t.scrollLeft = ts; if (!ts) t.querySelector<HTMLElement>('.on')?.scrollIntoView({ inline: 'center', block: 'nearest' }); }
  for (const id of ['xChat', 'xConvo']) { const c = document.getElementById(id); if (c) c.scrollTop = !keep[id] || keep[id]![1] ? c.scrollHeight : keep[id]![0]; }
  window.scrollTo(0, sy);
}
async function loadPerson(): Promise<void> {
  if (!S.people.length) await people();
  detail = await cmd<Detail>({ cmd: 'agent', id: pid });
  redraw();
  if (ptab === 'rules') void loadRules();
}
/** After a chat or an order: what changed (married, divorced, a task...) is fetched again; the box being typed in is not redrawn. */
async function touchPerson(): Promise<void> {
  try {
    detail = await cmd<Detail>({ cmd: 'agent', id: pid });
    if (ptab === 'family' || ptab === 'overview' || ptab === 'mind' || ptab === 'convo') redraw();
  } catch { /* next time */ }
}
async function loadRules(r?: RulesAns): Promise<void> {
  r ??= await cmd<RulesAns>({ cmd: 'rules' });
  const list = r.people.find((x) => x.id === pid)?.rules ?? [];
  // Rules for everyone apply to them too: shown below their own (removed on the Strict rules page), with how THEY keep them.
  const all = r.all.map((x) => ruleRow({ ...x, kept: (x.kept ?? []).filter((p) => p.id === pid) }, -1).replace(/<button[^>]*data-rm="-1"[^>]*>Remove<\/button>/, '')).join('');
  setHtml('xRules', (list.length ? list.map((x, k) => ruleRow(x, k)).join('') : '<div class="empty">No rules for them.</div>') + (all ? `<p class="dim">For everyone:</p>${all}` : ''));
  on('#xRules [data-rm]', 'click', async (b) => { try { await loadRules(await cmd<RulesAns>({ cmd: 'rules', id: pid, remove: Number(b.dataset.rm) })); toast('Rule removed', 'ok'); } catch (e) { toast(String(e), 'err'); } });
}
/** A new line in the conversation: only the messages are redrawn, never the box being typed in. */
function addChat(w: string, t: string): void {
  chat.push([w, t]); if (chat.length > 40) chat.shift();
  const c = document.getElementById('xChat');
  if (c) { c.innerHTML = chatHtml(); c.scrollTop = c.scrollHeight; }
}
export function personSaid(id: number, name: string, text: string): void { if (id === pid) addChat(name, text); }

/**
 * The Edit tab shows every level as 0-100 %: needs as how full they are (like the Needs card: Food 80 % = hunger 20),
 * health as a share of full health, traits 0-1 as %. The bag (a count) and lifespan (years) keep their own units.
 * Saving converts back to what the server keeps.
 */
const NEED_LABEL: Record<string, string> = { hunger: 'Food', thirst: 'Water', tired: 'Rest', lonely: 'Company' };
const pct = (v: number) => Math.round(v * 10) / 10;
function editFields(d: Detail): [key: string, label: string, value: string | number, unit: string][] {
  const p = d.profile, max = d.hpMax || 100;
  return [['name', 'Name', d.name, ''], ['personality', 'Personality', p.personality.join(', '), ''],
    ...(['hunger', 'thirst', 'tired', 'lonely'] as const).map((k) => [k, NEED_LABEL[k]!, pct(100 - d[k]), '%'] as [string, string, number, string]),
    ['hp', 'Health', pct((d.hp / max) * 100), '%'], ['carry', 'Food carried', d.carry, 'portions'],
    ...(d.player ? [] : [['age', 'Age', Math.round(d.age * 10) / 10, 'years'] as [string, string, number, string]]),
    ...Object.entries(p.traits).map(([k, v]) => (k === 'lifespan' ? [k, 'Lifespan', Math.round(v), 'years'] : [k, k, pct(v * 100), '%']) as [string, string, number, string])];
}
function fromPct(k: string, v: number, hpMax: number): number {
  if (NEED_LABEL[k]) return 100 - v;
  if (k === 'hp') return (v / 100) * hpMax;
  if (k === 'carry' || k === 'lifespan' || k === 'age') return v;
  return v / 100; // a trait
}

function bindPerson(): void {
  on('#xTabs button', 'click', (b) => { ptab = b.dataset.t!; save('ptab', ptab); if (detail) { redraw(); window.scrollTo(0, 0); if (ptab === 'rules') void loadRules(); } });
  on('#xPlan', 'click', async (b) => { (b as HTMLButtonElement).disabled = true; b.textContent = 'Thinking…'; try { await cmd({ cmd: 'planNow', id: pid }, 120000); toast('New plan made', 'ok'); ptab = 'mind'; await loadPerson(); } catch (e) { toast(String(e), 'err'); (b as HTMLButtonElement).disabled = false; } });
  on('#xMove', 'click', async () => { try { await cmd({ cmd: 'agentMove', id: pid, map: 'town' }); toast('Moved to the town centre', 'ok'); void loadPerson(); } catch (e) { toast(String(e), 'err'); } });
  on('#xKill', 'click', async () => { if (!detail || !confirm(`Kill ${detail.name}? This can't be undone.`)) return; try { await cmd({ cmd: 'kill', id: pid }); toast(`${detail.name} was killed`, 'ok'); void loadPerson(); } catch (e) { toast(String(e), 'err'); } });
  const talk = async () => {
    const t = val('xSay'); if (!t) return;
    draft = ''; const box = document.getElementById('xSay') as HTMLInputElement | null; if (box) { box.value = ''; box.focus(); }
    addChat('You', t);
    try { const r = await cmd<{ reply: string; ai: boolean; did?: string }>({ cmd: 'chat', id: pid, text: t }, 120000); if (!r.ai) addChat('', 'Answered without AI: turn on Gemini or Ollama on the AI page.'); if (r.did) addChat('', `→ will ${r.did}`); window.setTimeout(() => void touchPerson(), 1500); } catch (e) { addChat('', String(e)); }
  };
  on('#xTalk', 'click', () => void talk());
  on('#xSay', 'input', (el) => { draft = (el as HTMLInputElement).value; });
  { const c = document.getElementById('xChat'); if (c) c.scrollTop = c.scrollHeight; }
  on('#xSay', 'keydown', (_el, e) => { if ((e as KeyboardEvent).key === 'Enter') void talk(); });
  const syncWho = () => { const o = ORDERS.find((x) => x[0] === val('xOrd')); const f = document.getElementById('xWhoF'); if (f) f.hidden = !o?.[2]; };
  on('#xOrd', 'change', syncWho); syncWho();
  on('#xOrdGo', 'click', async () => { try { const r = await cmd<{ did: string }>({ cmd: 'order', id: pid, kind: val('xOrd'), target: val('xWho') }); addChat('', `→ will ${r.did}`); toast(`Order given: ${r.did}`, 'ok'); window.setTimeout(() => void touchPerson(), 1500); } catch (e) { toast(String(e), 'err'); } });
  on('#xSave', 'click', async () => {
    const set: Record<string, number | string> = {};
    for (const i of view().querySelectorAll<HTMLInputElement>('#xBody input[data-k]')) if (i.dataset.k !== 'age' || i.value !== i.defaultValue) set[i.dataset.k!] = i.type === 'number' ? fromPct(i.dataset.k!, Number(i.value), detail?.hpMax ?? 100) : i.value;
    try { await cmd({ cmd: 'agentSet', id: pid, set }); toast('Saved', 'ok'); void loadPerson(); } catch (e) { toast(String(e), 'err'); }
  });
  on('#xKinGo', 'click', async () => {
    const n = val('xKinWho').toLowerCase(), b = S.people.find((x) => x.name.toLowerCase() === n);
    if (!b) { toast('No one by that name', 'err'); return; }
    try { const r = await cmd<{ relation: string }>({ cmd: 'kin', a: pid, b: b.id, role: val('xKinRole') as 'child' }); toast(`${b.name} is now their ${r.relation}`, 'ok'); void touchPerson(); } catch (e) { toast(String(e), 'err'); }
  });
  document.querySelectorAll<HTMLElement>('[data-kdel]').forEach((el) => el.addEventListener('click', async (ev) => {
    ev.preventDefault();
    try { await cmd({ cmd: 'kin', a: pid, b: Number(el.dataset.kdel), role: '' }); toast('Removed', 'ok'); void touchPerson(); } catch (e) { toast(String(e), 'err'); }
  }));
  on('#xRuleAdd', 'click', async () => { const t = val('xRule'); if (!t) return; try { await loadRules(await cmd<RulesAns>({ cmd: 'rules', id: pid, add: t }, 60000)); toast('Rule added', 'ok'); } catch (e) { toast(String(e), 'err'); } });
}

export const personScreen: Screen = {
  title: 'Person', icon: 'people', help: 'person', every: 5,
  render() { return `<a class="backlink" href="#/people">${icon('back')} People</a><div id="xPage"><div class="skel tall"></div></div>`; },
  async mount(arg) { if (Number(arg) !== pid) { chat = []; draft = ''; } pid = Number(arg); try { await loadPerson(); } catch (e) { setHtml('xPage', `<div class="empty">${esc(String(e))}</div>`); } },
  async refresh() {
    // Live tabs only: never while typing in a form.
    if (ptab !== 'overview' && ptab !== 'mind' && ptab !== 'events' && ptab !== 'family' && ptab !== 'convo') return;
    try { await loadPerson(); } catch { /* next time */ }
  },
};

/** The person page's kill counts: animals by kind, zombies, people killed, duels won. */
function influenceHtml(v: number | undefined, log: { t: number; d: number; why: string }[] | undefined): string {
  if (v === undefined) return '<p class="dim">Unknown (the server is older).</p>';
  const rows = (log ?? []).map((x) => `<div class="ev"><span class="tag ${x.d > 0 ? 'ok' : 'bad'}">${x.d > 0 ? '+' : ''}${x.d}</span> <span>${esc(x.why)}</span></div>`).join('');
  return `<p><b>${v}</b> / 100 ${v >= 40 ? '<span class="tag ok">can call a clan election</span>' : '<small class="dim">(40 needed to call a clan election)</small>'}</p><div class="meter good"><i style="width:${v}%"></i></div>${rows ? `<div class="feed">${rows}</div>` : '<p class="dim">Nothing done yet that changed it.</p>'}`;
}
function killsHtml(k: { animals: Record<string, number>; zombies: number; people: number; beaten: number } | undefined): string {
  const animals = Object.entries(k?.animals ?? {}).sort((a, b) => b[1] - a[1]);
  const total = animals.reduce((s, [, n]) => s + n, 0);
  return `<div class="traits"><span>Animals</span><span></span><b>${total}</b><span>Zombies</span><span></span><b>${k?.zombies ?? 0}</b><span>People</span><span></span><b>${k?.people ?? 0}</b><span>Duels won</span><span></span><b>${k?.beaten ?? 0}</b></div>
    ${animals.length ? `<div class="chips">${animals.map(([a, n]) => `<span class="chip">${esc(a)} ${n}</span>`).join('')}</div>` : ''}`;
}
