import { cmd } from './api.js';
import { bars } from './charts.js';
import { help } from './help.js';
import { card, on, setHtml, val, type Screen } from './screen.js';
import { ago, esc, icon, load, save, toast, ACT_COLORS } from './util.js';

/**
 * The Analysis page (imad 2026-11-25): every stat of the world in one place, and a box to ask a brain about them
 * ("why do people refuse to reproduce?", "how many animals?"). The owner ticks which logs go along with the question;
 * the server builds the prompt (Preview shows it), the brain answers from the data only. Nothing in the world changes.
 */
interface MapStat { id: string; name: string; people: number; zombies: number; foodItems: number; animals: Record<string, number>; trees: number; rocks: number; rubble: number; farms: number; huts: number; doors: number; beds: number; leader: string | null }
interface Stats {
  clock: { gameDay: number; hour: number; yearDays: number; maxPopulation: number; travelOpen: boolean };
  population: { alive: number; children: number; adults: number; pregnant: number; couples: number; asleep: number; working: number; talking: number; hungry: number; thirsty: number; hurt: number; averageLack: Record<string, number>; dead: number; born: number; generations: number; causesOfDeath: Record<string, number> };
  doingNow: Record<string, number>;
  reproduction: { adultMen: number; adultWomen: number; singleMen: number; singleWomen: number; possibleSinglePairs: number; women18plus: Record<string, number>; women: { name: string; age: number; why: string }[] };
  objectives: { done: number; failed: number; running: number; reasons: Record<string, number>; byFrom: Record<string, unknown> };
  maps: MapStat[];
  clans: { name: string; map: string; leader: string; members: number }[];
  zombiesPerNight: number;
  rules: { forEveryone: string[]; perPerson: { name: string; rules: string[] }[] };
  ai: { brain: { provider: string; model: string; ready: boolean; why?: string; callsLastHour: number; maxCallsPerHour: number; lastError: string; brain: string }; planner: { counts?: Record<string, number> } };
  eventsLately: Record<string, number>;
}
interface Answer { at: number; q: string; include: string[]; brain: string; model: string; answer: string; ms: number; chars: number; err?: string; who: string }
interface View { stats: Stats; types: { id: string; name: string; about: string }[]; defaults: string[]; brains: { id: string; name: string; provider: string; model: string }[]; inUse: string; history: Answer[]; busy: boolean }

const err = (e: unknown) => toast(e instanceof Error ? e.message : String(e), 'err');
const EXAMPLES = ['Why are people refusing to reproduce?', 'How many animals are there on each map, and are they enough?', 'Why do most objectives fail?', 'Who is in danger right now and why?', 'Are rocks and trees running out?', 'Why do people stand still so much?'];
const PALETTE = ['#4da3ff', '#22c55e', '#f59e0b', '#ec4899', '#8b5cf6', '#14b8a6', '#ef4444', '#eab308', '#a16207', '#38bdf8', '#d97706', '#a3a3a3'];
let last: View | null = null, asking = false;

const tile = (ic: string, label: string, value: string, sub: string, cls = '') =>
  `<div class="kpi ${cls}"><div class="kpi-i">${icon(ic)}</div><div class="kpi-b"><div class="kpi-l">${label}</div><div class="kpi-v">${value}</div><div class="kpi-s">${sub}</div></div></div>`;
const rowsOf = (o: Record<string, number>, n = 12): [string, number, string][] =>
  Object.entries(o).sort((a, b) => b[1] - a[1]).slice(0, n).map(([k, v], i) => [k, v, PALETTE[i % PALETTE.length]!]);
const sum = (o: Record<string, number>) => Object.values(o).reduce((a, b) => a + b, 0);

const clanLine = (c: Stats['clans'][number]) => `<p class="small"><b>${esc(c.name)}</b> (${esc(c.map)}) · leader ${esc(c.leader)} · ${c.members} member${c.members === 1 ? '' : 's'}</p>`;
function statsHtml(s: Stats): string {
  const P = s.population, R = s.reproduction, O = s.objectives;
  const animals = s.maps.reduce((a, m) => a + sum(m.animals), 0), zombies = s.maps.reduce((a, m) => a + m.zombies, 0);
  const tried = O.done + O.failed, okPct = tried ? Math.round((O.done / tried) * 100) : 0;
  const tiles = `<div class="kpis">
    ${tile('people', 'People alive', String(P.alive), `${P.adults} adults · ${P.children} children · cap ${s.clock.maxPopulation}`)}
    ${tile('heart', 'Couples', String(P.couples), `${P.pregnant} expecting · ${R.singleMen} single men · ${R.singleWomen} single women`)}
    ${tile('baby', 'Births / deaths', `${P.born}<small> / ${P.dead}</small>`, `generation ${P.generations}`)}
    ${tile('check', 'Objectives', `${okPct}<small> % done</small>`, `${O.done} done · ${O.failed} failed · ${O.running} going on`, tried && okPct < 40 ? 'hot' : '')}
    ${tile('paw', 'Animals', String(animals), s.maps.map((m) => `${esc(m.name)} ${sum(m.animals)}`).join(' · '))}
    ${tile('zombie', 'Zombies', String(zombies), `${s.zombiesPerNight} each night`, zombies ? 'hot' : '')}
    ${tile('food', 'In need', String(P.hungry + P.thirsty), `${P.hungry} hungry · ${P.thirsty} thirsty · ${P.hurt} hurt`, P.hungry + P.thirsty ? 'hot' : '')}
    ${tile('ai', 'People\'s brain', esc(s.ai.brain.brain || s.ai.brain.provider), `${s.ai.brain.ready ? 'ready' : esc(s.ai.brain.why ?? 'not ready')} · ${s.ai.brain.callsLastHour}/${s.ai.brain.maxCallsPerHour} calls this hour`, s.ai.brain.ready ? '' : 'hot')}
  </div>`;
  const women = R.women.length ? `<table class="tbl"><thead><tr><th>Woman</th><th>Age</th><th>Why no baby now</th></tr></thead><tbody>${R.women.map((w) => `<tr><td>${esc(w.name)}</td><td>${w.age}</td><td>${esc(w.why)}</td></tr>`).join('')}</tbody></table>` : '<div class="empty">No women of 18 or more.</div>';
  const repro = card('Babies and couples', `<p class="small">${R.adultMen} men and ${R.adultWomen} women of 18 or more · ${R.possibleSinglePairs} possible pairs among the single ones.</p>
    <h5>Women of 18 or more: what stops a baby</h5>${bars(rowsOf(R.women18plus))}<details class="logi"><summary>Each woman</summary>${women}</details>`, { help: help('anRepro') });
  const objectives = card('Objectives', `${bars([['done', O.done, '#22c55e'], ['failed', O.failed, '#ef4444'], ['going on now', O.running, '#4da3ff']])}
    <h5>Why they failed (last 500)</h5>${Object.keys(O.reasons).length ? bars(rowsOf(O.reasons)) : '<div class="empty">No failures logged.</div>'}`, { help: help('anObjectives') });
  const doing = card('What people do now', bars(Object.entries(s.doingNow).sort((a, b) => b[1] - a[1]).map(([k, v], i) => [k, v, ACT_COLORS[i % ACT_COLORS.length]!])) || '<div class="empty">Nobody.</div>');
  const lack = card('How people are (average lack, 0 = fine)', bars(Object.entries(P.averageLack).map(([k, v]) => [k === 'hp' ? 'health (not a lack)' : k, Math.round(v), k === 'hp' ? '#22c55e' : v > 60 ? '#ef4444' : v > 35 ? '#f59e0b' : '#4da3ff']), 100));
  const deaths = card('Causes of death', Object.keys(P.causesOfDeath).length ? bars(rowsOf(P.causesOfDeath)) : '<div class="empty">Nobody died yet.</div>');
  const maps = card('Maps and resources', `<div class="tbl-wrap"><table class="tbl"><thead><tr><th>Map</th><th>People</th><th>Leader</th><th>Animals</th><th>Zombies</th><th>Food on the ground</th><th>Trees</th><th>Rocks</th><th>Rubble</th><th>Farms</th><th>Huts</th><th>Doors</th><th>Beds</th></tr></thead><tbody>
    ${s.maps.map((m) => `<tr><td><b>${esc(m.name)}</b></td><td>${m.people}</td><td>${esc(m.leader ?? '-')}</td><td>${Object.entries(m.animals).map(([k, v]) => `${esc(k)} ${v}`).join(', ') || '0'}</td><td>${m.zombies}</td><td>${m.foodItems}</td><td>${m.trees}</td><td>${m.rocks}</td><td>${m.rubble}</td><td>${m.farms}</td><td>${m.huts}</td><td>${m.doors}</td><td>${m.beds}</td></tr>`).join('')}
    </tbody></table></div>`, { cls: 'span2', help: help('anMaps') });
  const clans = card('Clans and rules', `${s.clans.length ? ((cl) => `<p class="small">${cl.length} clan${cl.length > 1 ? 's' : ''}${cl.filter((c) => c.members <= 1).length ? ` · <b class="warn">${cl.filter((c) => c.members <= 1).length} with one member</b>` : ''}</p>${cl.slice(0, 6).map(clanLine).join('')}${cl.length > 6 ? `<details class="logi"><summary>${cl.length - 6} more</summary>${cl.slice(6).map(clanLine).join('')}</details>` : ''}`)(s.clans.slice().sort((a, b) => b.members - a.members)) : '<p class="dim small">No clans yet.</p>'}
    <h5>Strict rules for everyone</h5>${s.rules.forEveryone.length ? s.rules.forEveryone.map((r) => `<p class="small">“${esc(r)}”</p>`).join('') : '<p class="dim small">None.</p>'}
    ${s.rules.perPerson.length ? `<h5>Rules for one person</h5>${s.rules.perPerson.map((p) => `<p class="small"><b>${esc(p.name)}</b>: ${p.rules.map((r) => '“' + esc(r) + '”').join(', ')}</p>`).join('')}` : ''}`);
  const events = card('What happened lately (last 3000 events)', bars(rowsOf(s.eventsLately, 16)) || '<div class="empty">No events yet.</div>');
  return `${tiles}${repro}${objectives}${lack}${doing}${maps}${deaths}${clans}${events}
    ${card('Every number (what the brain gets)', `<details class="logi"><summary>Show the raw stats</summary><pre>${esc(JSON.stringify(s, null, 1))}</pre></details>`, { cls: 'span2' })}`;
}

function answerHtml(a: Answer): string {
  const meta = `${ago(a.at)} · ${esc(a.brain)}${a.model ? ' · ' + esc(a.model) : ''}${a.ms ? ` · ${Math.round(a.ms / 100) / 10} s` : ''} · ${Math.round(a.chars / 1000)}k characters sent · logs: ${a.include.length ? esc(a.include.join(', ')) : 'stats only'}`;
  return `<div class="msg me"><b>${esc(a.who || 'You')}</b>${esc(a.q)}</div>
    ${a.err ? `<div class="msg sys bad">${icon('alert')} ${esc(a.err)}</div>` : `<div class="msg an-ans"><b>Analysis</b><div class="an-text">${esc(a.answer)}</div></div>`}<div class="dim small an-meta">${meta}</div>`;
}

function drawAsk(v: View): void {
  const box = document.getElementById('anTypes');
  if (box && !box.dataset.filled) {
    box.dataset.filled = '1';
    const chosen = load<string[]>('anTypes', v.defaults);
    box.innerHTML = v.types.map((t) => `<label class="an-type" title="${esc(t.about)}"><input type="checkbox" value="${esc(t.id)}"${chosen.includes(t.id) ? ' checked' : ''}> <span><b>${esc(t.name)}</b><small>${esc(t.about)}</small></span></label>`).join('');
    for (const c of box.querySelectorAll<HTMLInputElement>('input')) c.onchange = () => save('anTypes', picked());
  }
  const b = document.getElementById('anBrain') as HTMLSelectElement | null;
  if (b && !b.dataset.filled) {
    b.dataset.filled = '1';
    b.innerHTML = `<option value="">In use: ${esc(v.inUse)} (with its fallback)</option>` + v.brains.filter((x) => x.provider !== 'none').map((x) => `<option value="${esc(x.id)}">${esc(x.name)}${x.model ? ' · ' + esc(x.model) : ''}</option>`).join('');
    b.value = load('anBrain', '');
    if (b.selectedIndex < 0) b.value = '';
  }
  setHtml('anChat', v.history.length ? [...v.history].reverse().map(answerHtml).join('') : `<div class="empty">Ask about the world. Examples:<br>${EXAMPLES.map((x) => `<a class="ag-ex">${esc(x)}</a>`).join('<br>')}</div>`);
  for (const a of document.querySelectorAll<HTMLElement>('#anChat .ag-ex')) a.onclick = () => { (document.getElementById('anQ') as HTMLTextAreaElement).value = a.textContent ?? ''; };
  const chat = document.getElementById('anChat');
  if (chat) chat.scrollTop = chat.scrollHeight;
}

const picked = () => [...document.querySelectorAll<HTMLInputElement>('#anTypes input:checked')].map((c) => c.value);

async function ask(): Promise<void> {
  const q = val('anQ');
  if (!q || asking) return;
  asking = true;
  const go = document.getElementById('anGo') as HTMLButtonElement;
  go.disabled = true;
  const chat = document.getElementById('anChat')!;
  if (chat.querySelector('.empty')) chat.innerHTML = '';
  chat.insertAdjacentHTML('beforeend', `<div class="msg me"><b>You</b>${esc(q)}</div><div class="msg sys" id="anWait"><span class="ag-dots"></span> The brain is reading the stats and logs…</div>`);
  chat.scrollTop = chat.scrollHeight;
  try {
    const a = await cmd<Answer>({ cmd: 'analysisAsk', question: q, include: picked(), brain: (document.getElementById('anBrain') as HTMLSelectElement).value }, 330_000);
    (document.getElementById('anQ') as HTMLTextAreaElement).value = '';
    if (a.err) toast(a.err, 'err');
    if (last) { last.history = [a, ...last.history]; drawAsk(last); }
  } catch (e) { err(e); document.getElementById('anWait')?.remove(); } finally { asking = false; go.disabled = false; }
}

export const analysisScreen: Screen = {
  title: 'Analysis', icon: 'chart', help: 'analysis', every: 15,
  render() {
    return `<div class="grid2">
      ${card('Ask the AI about the world', `<div class="chat ag-chat" id="anChat"><div class="skel"></div></div>
        <div class="ag-ask"><textarea id="anQ" rows="2" maxlength="2000" placeholder="e.g. “why are people refusing to reproduce?”"></textarea>
        <h5>Send along ${help('anTypes')}</h5><div class="an-types" id="anTypes"></div>
        <div class="row"><button class="btn primary" id="anGo">${icon('bolt')} Ask</button><button class="btn ghost sm" id="anPrev">${icon('search')} Preview what is sent</button>
        <label class="dim small">Brain <select id="anBrain"></select></label><button class="btn ghost sm danger" id="anForget">${icon('x')} Clear the answers</button></div>
        <div id="anPreview"></div></div>`, { cls: 'span2', help: help('anAsk') })}
      <div id="anStats" class="grid2 span2 an-stats"><div class="skel"></div></div></div>`;
  },
  async mount() {
    on('#anGo', 'click', () => void ask());
    on('#anQ', 'keydown', (_el, e) => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); void ask(); } });
    on('#anBrain', 'change', (el) => save('anBrain', (el as HTMLSelectElement).value));
    on('#anPrev', 'click', async () => {
      try {
        const p = await cmd<{ system: string; prompt: string; chars: number }>({ cmd: 'analysisPreview', question: val('anQ') || '(your question)', include: picked() });
        setHtml('anPreview', `<details class="logi" open><summary>${icon('search')} ${Math.round(p.chars / 1000)}k characters would be sent (about ${Math.round(p.chars / 4000)}k tokens)</summary><h5>Instructions</h5><pre>${esc(p.system)}</pre><h5>Data and question</h5><pre class="an-pre">${esc(p.prompt)}</pre></details>`);
      } catch (e) { err(e); }
    });
    on('#anForget', 'click', () => { if (confirm('Clear every saved question and answer?')) cmd({ cmd: 'analysisForget' }).then(() => { if (last) { last.history = []; drawAsk(last); } }, err); });
    try {
      last = await cmd<View>({ cmd: 'analysis' });
      setHtml('anStats', statsHtml(last.stats));
      drawAsk(last);
    } catch (e) { setHtml('anStats', `<div class="empty">${esc(e instanceof Error ? e.message : e)}</div>`); }
  },
  async refresh() {
    try {
      const v = await cmd<View>({ cmd: 'analysis' });
      if (!last) return;
      last.stats = v.stats;
      // Keep the fold-outs the owner opened.
      const open = [...document.querySelectorAll<HTMLDetailsElement>('#anStats details')].map((d) => d.open);
      setHtml('anStats', statsHtml(v.stats));
      document.querySelectorAll<HTMLDetailsElement>('#anStats details').forEach((d, k) => { d.open = !!open[k]; });
    } catch { /* */ }
  },
};
