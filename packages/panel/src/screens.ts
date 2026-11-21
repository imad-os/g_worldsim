import type { ServerStats } from '@worldsim/protocol';
import { RECIPES_ALL, CATEGORIES, WEAPONS, DEFENCE, PLACEABLE, ANIMAL_NAMES } from '@worldsim/protocol';
import { cmd, stats, serverAddress, onServer, isStaff } from './api.js';
import { lineChart } from './charts.js';
import { help } from './help.js';
import { card, on, setHtml, val, type Screen } from './screen.js';
import { S, overview, people, history, describe, groupOf, KINDS } from './state.js';
import { esc, gameTime, ago, icon, load, save, toast } from './util.js';
import { WIDGETS, dashOn, setDash } from './dashboard.js';

const err = (e: unknown) => toast(e instanceof Error ? e.message : String(e), 'err');
const mapOpts = () => (S.ov?.maps ?? [{ id: 'town', name: 'Old Town' }, { id: 'woods', name: 'Woods' }]).map((m) => `<option value="${m.id}">${esc(m.name)}</option>`).join('');
const names = () => [...new Set(S.people.map((p) => p.name))].map((n) => `<option value="${esc(n)}">`).join('');
const row = (label: string, ctl: string, h = '') => `<div class="srow"><div class="srow-l">${label}${h}</div><div class="srow-c">${ctl}</div></div>`;

// ------------------------------------------------------------ world
export const world: Screen = {
  title: 'World', icon: 'world', help: 'world', every: 5,
  render() {
    return `<div class="grid2">
    ${card('Time', `<div class="bigclock" id="wClock">-</div>
      <div class="row wrap"><button class="btn primary" id="wPause">${icon('pause')} Pause</button><button class="btn" id="wResume">${icon('play')} Resume</button></div>
      ${row('Speed', `<div class="seg" id="wSpeed">${[0.5, 1, 2, 5, 10, 25, 100].map((v) => `<button data-v="${v}">x${v}</button>`).join('')}</div>`, help('speed'))}
      ${row('Custom speed', `<input type="number" id="wSpeedN" min="0.1" max="100" step="0.1" style="width:90px"> <button class="btn sm" id="wSpeedGo">Set</button>`)}`)}
    ${card('Life', `${row('Difficulty <b id="wDiffV" class="tag"></b>', `<input type="range" id="wDiff" min="0.25" max="3" step="0.25">`, help('difficulty'))}
      ${row('Ageing', `<select id="wYear"><option value="0.041666666666666664">1 game hour = 1 year</option><option value="0.25">6 game hours = 1 year</option><option value="1">1 game day = 1 year</option><option value="7">7 game days = 1 year</option><option value="365">365 days (real life)</option></select>`, help('ageing'))}
      ${row('Population limit', `<input type="number" id="wMax" min="1" max="100" style="width:80px"> people`, help('maxPop'))}`)}
    ${card('Travel between maps', `<p id="wTravelS" class="dim">-</p><button class="btn" id="wTravel">-</button>`, { help: help('travel') })}
    ${card('Supply drop', `${row('Map', `<select id="wSupMap">${mapOpts()}</select>`)}${row('Food portions', `<input type="number" id="wSupN" min="1" max="30" value="8" style="width:80px">`)}
      <button class="btn primary" id="wSup">${icon('food')} Drop now</button>`, { help: help('supply') })}
    ${card('Save', `<p class="dim">Last save: <span id="wSnapAt">-</span></p><button class="btn" id="wSnap">Save the world now</button>`, { help: help('snapshot') })}
    ${card('Maps', `<div id="wMaps"></div>`, { help: help('mapsTable') })}
    </div>`;
  },
  async mount() {
    on('#wPause', 'click', () => void cmd({ cmd: 'pause', paused: true }).then(() => toast('Paused', 'ok'), err));
    on('#wResume', 'click', () => void cmd({ cmd: 'pause', paused: false }).then(() => toast('Running', 'ok'), err));
    on('#wSpeed button', 'click', (b) => void cmd({ cmd: 'speed', speed: Number(b.dataset.v) }).then(() => toast(`Speed x${b.dataset.v}`, 'ok'), err));
    on('#wSpeedGo', 'click', () => void cmd({ cmd: 'speed', speed: Number(val('wSpeedN')) }).then(() => toast('Speed set', 'ok'), err));
    on('#wDiff', 'input', (el) => { document.getElementById('wDiffV')!.textContent = (el as HTMLInputElement).value; });
    on('#wDiff', 'change', (el) => void cmd({ cmd: 'difficulty', value: Number((el as HTMLInputElement).value) }).then(() => toast('Difficulty changed', 'ok'), err));
    on('#wYear', 'change', (el) => void cmd({ cmd: 'life', yearDays: Number((el as HTMLSelectElement).value) }).then(() => toast('Ageing changed', 'ok'), err));
    on('#wMax', 'change', (el) => void cmd({ cmd: 'life', maxPopulation: Number((el as HTMLInputElement).value) }).then(() => toast('Population limit changed', 'ok'), err));
    on('#wTravel', 'click', async () => {
      const open = !S.ov?.travelOpen;
      if (open && !confirm('Open travel? People may walk to the other maps and the wrecked cars leave the roads.')) return;
      try { await cmd({ cmd: 'travel', open }); toast(open ? 'Travel opened' : 'Travel closed', 'ok'); await this.refresh!(); } catch (e) { err(e); }
    });
    on('#wSup', 'click', async () => { try { const r = await cmd<{ n: number }>({ cmd: 'supply', map: val('wSupMap'), n: Number(val('wSupN') || 8) }); toast(`Dropped ${r.n} food`, 'ok'); } catch (e) { err(e); } });
    on('#wSnap', 'click', async () => { try { await cmd({ cmd: 'snapshot' }); toast('Saved', 'ok'); } catch (e) { err(e); } });
    const s = stats;
    if (s) {
      (document.getElementById('wDiff') as HTMLInputElement).value = String(s.difficulty ?? 1); document.getElementById('wDiffV')!.textContent = String(s.difficulty ?? 1);
      (document.getElementById('wYear') as HTMLSelectElement).value = String(s.yearDays ?? 1);
      (document.getElementById('wMax') as HTMLInputElement).value = String(s.maxPopulation ?? 14);
      (document.getElementById('wSpeedN') as HTMLInputElement).value = String(s.speed);
    }
    await this.refresh!();
  },
  async refresh() {
    const o = await overview(true);
    setHtml('wTravelS', o.travelOpen ? 'Open: people may go to every map.' : 'Closed: people stay where they are and wrecked cars block the 4 roads out of town. Players can still travel.');
    const b = document.getElementById('wTravel'); if (b) b.textContent = o.travelOpen ? 'Close travel' : 'Open travel';
    setHtml('wMaps', `<div class="tbl-wrap"><table class="tbl"><thead><tr><th>Map</th><th>Size</th><th>People</th><th>Zombies</th><th>Animals</th><th>Food on the ground</th></tr></thead><tbody>${o.maps.map((m) => `<tr><td><b>${esc(m.name)}</b></td><td>${m.w}×${m.h}</td><td>${m.people}</td><td>${m.zombies}</td><td>${m.animals.reduce((a, c) => a + c, 0)}</td><td>${m.items}</td></tr>`).join('')}</tbody></table></div>`);
    this.onStats?.(stats!);
  },
  onStats(s: ServerStats) {
    if (!s) return;
    setHtml('wClock', `${S.ov ? gameTime(S.ov.gameSec) : ''}<small>${s.paused ? 'Paused' : `Speed x${s.speed}${Math.abs(s.effSpeed - s.speed) > 0.5 ? ` (running x${s.effSpeed.toFixed(1)})` : ''}`}</small>`);
    for (const b of document.querySelectorAll<HTMLElement>('#wSpeed button')) b.classList.toggle('on', Number(b.dataset.v) === s.speed);
    setHtml('wSnapAt', s.lastSnapshotAt ? ago(s.lastSnapshotAt) : '-');
  },
};

// ------------------------------------------------------------ zombies & animals
type Zs = { perNight: number; cfg: { hp: number; speed: number; bite: number; sight: number; smell: number }; now: { id: number; map: string; x: number; y: number; hp: number; stays: boolean }[] };
const ANIMAL_INFO: [string, string, string, string][] = [
  ['Rabbit', '12', 'Runs away', '1 meat, 1 leather'], ['Deer', '40', 'Runs away', '3 meat, 2 leather'], ['Boar', '55', 'Fights back when hurt (bite 7)', '3 meat, 1 leather, 1 claw'],
  ['Wolf', '45', 'Bites at night or when hurt (bite 9)', '1 meat, 1 leather, 2 claws'], ['Bear', '120', 'Attacks within 5 m (bite 16)', '5 meat, 3 leather, 3 claws'],
];
export const zombies: Screen = {
  title: 'Zombies & animals', icon: 'zombie', help: 'zombies', every: 4,
  render() {
    return `<div class="grid2">
    ${card('Zombies', `<div class="bignum" id="zNow">-</div>${row('Released each night at 21:00', `<input type="number" id="zNight" min="0" max="50" style="width:80px"> zombies`)}
      <button class="btn danger ghost" id="zClear">Remove all zombies</button>`, { help: help('zombies') })}
    ${card('Zombie strength', `${row('Health', `<input type="number" id="zcHp" min="10" max="5000" style="width:90px"> hp`)}${row('Speed', `<input type="number" id="zcSpeed" min="0.2" max="6" step="0.05" style="width:90px"> m/s <small class="dim">(a walk is about 1.4)</small>`)}
      ${row('Attack (bite)', `<input type="number" id="zcBite" min="0" max="200" style="width:90px"> damage`)}${row('Sight (chase)', `<input type="number" id="zcSight" min="3" max="80" style="width:90px"> m`)}${row('Smell (drift to people)', `<input type="number" id="zcSmell" min="10" max="400" style="width:90px"> m`)}
      <div class="row"><button class="btn primary" id="zcSave">Save</button><button class="btn ghost" id="zcNow">Save and apply to zombies out now</button></div>`, { help: help('zStrength') })}
    ${card('Spawn now', `<div class="seg" id="zHow"><button data-h="near" class="on">Next to someone</button><button data-h="at">At a place</button></div>
      <div id="zNearF">${row('Next to', `<input id="zNear" list="zNames" placeholder="a name"><datalist id="zNames">${names()}</datalist>`)}${row('Distance', `<input type="number" id="zDist" min="2" max="60" value="8" style="width:80px"> m`)}</div>
      <div id="zAtF" hidden>${row('Map', `<select id="zMap">${mapOpts()}</select>`)}${row('x / y (empty = anywhere)', `<input type="number" id="zX" style="width:80px"> <input type="number" id="zY" style="width:80px">`)}</div>
      ${row('How many', `<input type="number" id="zN" min="1" max="20" value="1" style="width:80px">`)}
      <button class="btn primary" id="zGo">${icon('zombie')} Spawn</button>`, { help: help('zSpawn') })}
    ${card('Zombies out now', `<div id="zList"></div>`, { cls: 'span2' })}
    ${card('Plan a zombie attack', `${row('When', `<select id="paDay"><option value="0">Today</option><option value="1">Tomorrow</option><option value="2">In 2 days</option><option value="3">In 3 days</option><option value="7">In a week</option></select> at <input type="time" id="paTime" value="21:00" style="width:110px">`)}
      ${row('Map', `<select id="paMap">${mapOpts()}</select>`)}${row('How many', `<input type="number" id="paN" min="1" max="40" value="8" style="width:80px"> zombies`)}
      ${row('From', `<select id="paWhere"><option value="edge">The roads at the edge of the map</option><option value="camp">All around the camp</option><option value="near">Next to someone</option><option value="random">Anywhere</option></select>`)}
      <div id="paNearF" hidden>${row('Who', `<input id="paNear" list="zNames" placeholder="a name">`)}</div>
      ${row('', `<label><input type="checkbox" id="paDaily"> Every day</label> <label><input type="checkbox" id="paStays" checked> Stay until killed</label>`)}
      <div class="row"><button class="btn primary" id="paAdd">${icon('zombie')} Plan it</button><button class="btn danger ghost" id="paNow">Attack now</button></div>
      <div id="paList"></div>`, { help: help('zAttack') })}
    ${card('Animals by map', `<div id="aMaps"></div>`, { help: help('animals'), cls: 'span2' })}
    ${card('Animal guide', `<div class="tbl-wrap"><table class="tbl"><thead><tr><th>Animal</th><th>Health</th><th>Behaviour</th><th>A kill gives</th></tr></thead><tbody>${ANIMAL_INFO.map((a) => `<tr><td><b>${a[0]}</b></td><td>${a[1]}</td><td>${a[2]}</td><td>${a[3]}</td></tr>`).join('')}</tbody></table></div><p class="dim">A campfire within 5 m or a lamp within 3.5 m keeps dangerous animals and zombies away.</p>`, { help: help('animalTable') })}
    </div>`;
  },
  async mount() {
    await people();
    setHtml('zNames', names());
    on('#zHow button', 'click', (b) => { for (const x of document.querySelectorAll('#zHow button')) x.classList.toggle('on', x === b); document.getElementById('zNearF')!.hidden = b.dataset.h !== 'near'; document.getElementById('zAtF')!.hidden = b.dataset.h !== 'at'; });
    const cfgArgs = () => ({ hp: Number(val('zcHp')), speed: Number(val('zcSpeed')), bite: Number(val('zcBite')), sight: Number(val('zcSight')), smell: Number(val('zcSmell')) });
    on('#zcSave', 'click', () => void cmd<Zs>({ cmd: 'zombies', cfg: cfgArgs() }).then((r) => { toast('Zombie strength saved (new zombies)', 'ok'); void this.refresh!(r as never); }, err));
    on('#zcNow', 'click', () => void cmd<Zs>({ cmd: 'zombies', cfg: cfgArgs(), applyNow: true }).then((r) => { toast('Saved, and applied to the zombies out now', 'ok'); void this.refresh!(r as never); }, err));
    on('#zNight', 'change', (el) => void cmd<Zs>({ cmd: 'zombies', perNight: Number((el as HTMLInputElement).value) }).then((r) => { this.refresh!(r as never); toast('Zombies per night changed', 'ok'); }, err));
    const attackArgs = () => ({ map: val('paMap'), n: Number(val('paN') || 8), where: val('paWhere'), near: val('paNear'), stays: (document.getElementById('paStays') as HTMLInputElement).checked });
    on('#paWhere', 'change', () => { document.getElementById('paNearF')!.hidden = val('paWhere') !== 'near'; });
    on('#paAdd', 'click', async () => {
      const [h, mi] = (val('paTime') || '21:00').split(':').map(Number);
      try { const r = await cmd<Plans>({ cmd: 'zombieAttack', add: { ...attackArgs(), days: Number(val('paDay') || 0), hour: h, minute: mi, daily: (document.getElementById('paDaily') as HTMLInputElement).checked } }); drawPlans(r); toast('Attack planned', 'ok'); } catch (e) { err(e); }
    });
    on('#paNow', 'click', async () => {
      if (!confirm('Send the zombies now?')) return;
      try { const r = await cmd<Plans>({ cmd: 'zombieAttack', now: attackArgs() }); toast(`${r.ran?.n ?? 0} zombies are coming (${r.ran?.map ?? ''})`, 'ok'); void this.refresh!(); } catch (e) { err(e); }
    });
    drawPlans(await cmd<Plans>({ cmd: 'zombieAttack' }));
    await drawAnimals();
    on('#zClear', 'click', async () => { if (!confirm('Remove every zombie now?')) return; try { await cmd({ cmd: 'zombies', clear: true }); toast('Zombies removed', 'ok'); void this.refresh!(); } catch (e) { err(e); } });
    on('#zGo', 'click', async () => {
      const near = !document.getElementById('zNearF')!.hidden ? val('zNear') : '';
      try {
        const r = await cmd<{ map: string; x: number; y: number }[]>(near ? { cmd: 'zombieSpawn', near, dist: Number(val('zDist') || 8), n: Number(val('zN') || 1) } : { cmd: 'zombieSpawn', map: val('zMap'), x: val('zX'), y: val('zY'), n: Number(val('zN') || 1) });
        toast(`Spawned ${r.length} in ${r[0]!.map} (${r[0]!.x}, ${r[0]!.y})`, 'ok'); void this.refresh!();
      } catch (e) { err(e); }
    });
    await this.refresh!();
  },
  async refresh(given?: Zs) {
    const r = given ?? await cmd<Zs>({ cmd: 'zombies' });
    const n = document.getElementById('zNight') as HTMLInputElement | null;
    if (n && document.activeElement !== n) n.value = String(r.perNight);
    for (const [id, v] of [['zcHp', r.cfg.hp], ['zcSpeed', r.cfg.speed], ['zcBite', r.cfg.bite], ['zcSight', r.cfg.sight], ['zcSmell', r.cfg.smell]] as const) {
      const el = document.getElementById(id) as HTMLInputElement | null;
      if (el && document.activeElement !== el) el.value = String(v);
    }
    setHtml('zNow', `${r.now.length}<small>out now · ${r.perNight} each night</small>`);
    setHtml('zList', r.now.length ? `<div class="tbl-wrap"><table class="tbl"><thead><tr><th>Map</th><th>Where</th><th>Health</th><th>Leaves</th></tr></thead><tbody>${r.now.map((z) => `<tr><td>${esc(z.map)}</td><td>(${z.x}, ${z.y})</td><td>${z.hp}</td><td>${z.stays ? 'stays until killed' : 'at dawn'}</td></tr>`).join('')}</tbody></table></div>` : '<div class="empty">No zombie is out.</div>');
    // Animals: only the "now" numbers change (the boxes being typed in stay).
    const a = await cmd<AnimalsAns>({ cmd: 'animals' });
    for (const m of a.maps) m.now.forEach((n, k) => { const el = document.getElementById(`an-${m.id}-${k}`); if (el) el.textContent = String(n); });
  },
};

type Plans = { plans: { id: number; at: number; map: string; n: number; where: string; near?: string; daily?: boolean; stays?: boolean }[]; gameSec: number; ran?: { map: string; n: number } };
type AnimalsAns = { maps: { id: string; name: string; now: number[]; want: number[] | null; cap: number }[] };
const WHERE_NAME: Record<string, string> = { edge: 'from the roads', camp: 'around the camp', near: 'next to', random: 'anywhere' };
function drawPlans(r: Plans): void {
  setHtml('paList', r.plans.length ? `<div class="tbl-wrap"><table class="tbl"><thead><tr><th>When</th><th>Map</th><th>How many</th><th>From</th><th></th></tr></thead><tbody>${r.plans.map((p) =>
    `<tr><td>${gameTime(p.at)}${p.daily ? ' · every day' : ''}</td><td>${esc(p.map)}</td><td>${p.n}${p.stays === false ? '' : ' (stay)'}</td><td>${esc(WHERE_NAME[p.where] ?? p.where)}${p.near ? ' ' + esc(p.near) : ''}</td><td><button class="btn ghost" data-unplan="${p.id}">Remove</button></td></tr>`).join('')}</tbody></table></div>` : '<p class="dim">No attack planned.</p>');
  on('[data-unplan]', 'click', async (b) => { try { drawPlans(await cmd<Plans>({ cmd: 'zombieAttack', remove: Number(b.dataset.unplan) })); toast('Attack removed', 'ok'); } catch (e) { err(e); } });
}
async function drawAnimals(): Promise<void> {
  const a = await cmd<AnimalsAns>({ cmd: 'animals' });
  setHtml('aMaps', `<div class="tbl-wrap"><table class="tbl"><thead><tr><th>Map</th>${ANIMAL_NAMES.map((n) => `<th>${esc(n)}<br><small>now · wanted</small></th>`).join('')}<th></th></tr></thead><tbody>${a.maps.map((m) => `<tr><td><b>${esc(m.name)}</b><br><small class="dim">${m.want ? 'your numbers' : `built-in mix (up to ${m.cap})`}</small></td>${ANIMAL_NAMES.map((_, k) =>
    `<td><span id="an-${m.id}-${k}">${m.now[k] ?? 0}</span> · <input type="number" min="0" max="40" style="width:60px" data-am="${m.id}" data-ak="${k}" value="${m.want ? m.want[k] ?? 0 : ''}" placeholder="${m.now[k] ?? 0}"></td>`).join('')}
    <td><button class="btn primary" data-asave="${m.id}">Save</button> <button class="btn" data-afill="${m.id}">Now</button> ${m.want ? `<button class="btn ghost" data-areset="${m.id}">Built-in mix</button>` : ''}</td></tr>`).join('')}</tbody></table></div>`);
  const wantOf = (id: string) => ANIMAL_NAMES.map((_, k) => { const el = document.querySelector<HTMLInputElement>(`[data-am="${id}"][data-ak="${k}"]`); return Number(el?.value === '' ? el?.placeholder : el?.value) || 0; });
  on('[data-asave]', 'click', async (b) => { try { await cmd({ cmd: 'animals', map: b.dataset.asave, want: wantOf(b.dataset.asave!) }); toast('Saved: they come or go over the next game hours', 'ok'); await drawAnimals(); } catch (e) { err(e); } });
  on('[data-afill]', 'click', async (b) => { try { await cmd({ cmd: 'animals', map: b.dataset.afill, want: wantOf(b.dataset.afill!), fill: true }); toast('Done', 'ok'); await drawAnimals(); } catch (e) { err(e); } });
  on('[data-areset]', 'click', async (b) => { try { await cmd({ cmd: 'animals', map: b.dataset.areset, want: null }); toast('Back to the built-in mix', 'ok'); await drawAnimals(); } catch (e) { err(e); } });
}

// ------------------------------------------------------------ crafting
const CAT_NAME: Record<string, string> = { weapon: 'Weapons', clothing: 'Clothes and armour', defence: 'Defences', furniture: 'Furniture' };
const WHAT_DO: Record<string, string> = {
  sword: 'damage 34', axe: 'damage 22, chops 2 wood at once', spear: 'damage 30', bow: 'shoots 14 m (needs arrows), damage 26', arrows: '5 arrows for the bow',
  clothes: 'defence 15 %', armor: 'defence 35 %', helmet: 'defence 15 %', palisade: 'log wall', spikes: 'hurts zombies that claw it', stonewall: 'strongest wall, takes half damage',
  door: 'people pass, zombies and animals do not', window: 'light, blocks passage', bed: 'rest twice as fast', lamp: 'light at night, keeps zombies back 3 m', campfire: 'warmth and light, 10 h of fuel',
};
export const crafting: Screen = {
  title: 'Crafting', icon: 'craft', help: 'crafting', every: 10,
  render() {
    const book = CATEGORIES.map((c) => card(CAT_NAME[c] ?? c, `<div class="recipes">${RECIPES_ALL.filter((r) => r.cat === c).map((r) => `<div class="recipe"><div class="rc-n">${esc(r.what)}${r.n && r.n > 1 ? ` ×${r.n}` : ''}</div><div class="rc-i">${Object.entries(r.need).map(([k, n]) => `<span class="chip">${n} ${esc(k)}</span>`).join('<span class="plus">+</span>')}</div><div class="rc-d">${esc(WHAT_DO[r.what] ?? '')}${PLACEABLE.includes(r.what as never) ? ' · can be put down' : ''}</div></div>`).join('')}</div>`)).join('');
    void WEAPONS; void DEFENCE;
    return `<p class="lead">${icon('craft')} Same ingredients, different category, different thing: <b>1 wood + 1 ore</b> is a <b>sword</b> in Weapons and a <b>door</b> in Furniture. ${help('crafting')}</p>
      <div class="grid2">${book}${card('Camp stores', `<div id="cStores"></div>`, { help: help('stores') })}${card('Who has what', `<div id="cHold"></div>`, { help: help('holdings') })}</div>`;
  },
  async mount() { await this.refresh!(); },
  async refresh() {
    const o = await overview(), ps = await people();
    setHtml('cStores', o.maps.map((m) => `<div class="li"><b>${esc(m.name)}</b><span>${m.store ? Object.entries(m.store).filter(([k, v]) => k !== 't' && v > 0).map(([k, v]) => `<span class="chip">${v} ${esc(k)}</span>`).join('') || '<span class="dim">empty</span>' : '<span class="dim">no camp store yet</span>'}</span></div>`).join(''));
    setHtml('cHold', ps.filter((p) => !p.player).map((p) => `<div class="li"><a href="#/person/${p.id}"><b>${esc(p.name)}</b></a><span>${[p.carry ? `<span class="chip food">${p.carry} food</span>` : '', ...Object.entries(p.inv ?? {}).filter(([, n]) => n > 0).map(([k, n]) => `<span class="chip">${n} ${esc(k)}</span>`)].join('') || '<span class="dim">nothing</span>'}</span></div>`).join('') || '<div class="empty">Nobody.</div>');
  },
};

// ------------------------------------------------------------ rules
type Rule = { text: string; forbid: string[]; with: number; withName?: string; ai?: boolean; kind?: string; goal?: string; say?: string; plan?: { do: string }[] };
const ruleWhat = (x: Rule) => x.kind === 'when' ? `trigger: says “${esc(x.say ?? '')}” when ${esc(x.withName ?? '?')} is near` : x.kind === 'goal' ? (x.goal === 'marry' ? 'goal: finds a partner and marries' : x.goal === 'child' ? 'goal: marries, then has a child' : x.goal === 'plan' ? `goal: ${esc((x.plan ?? []).map((s) => s.do).join(' > '))}, once a game day` : 'goal: told to the AI as a main goal')
  : x.forbid.length ? 'blocks ' + esc(x.forbid.join(', ')) + (x.withName ? ' with ' + esc(x.withName) : '') : 'told to the AI only';
type RulesAns = { all: Rule[]; people: { id: number; name: string; rules: Rule[] }[]; max: number };
let rFor = -1;
export const rules: Screen = {
  title: 'Strict rules', icon: 'rules', help: 'rules',
  render() {
    return `<p class="lead">${icon('rules')} Your orders that are never broken, in your own words, in any language. ${help('rules')}</p><div class="grid2">
      ${card('Rules for', `<div id="rWho" class="whos"></div>`)}
      ${card('Rules', `<div id="rList"></div><div class="row"><input id="rText" maxlength="160" placeholder="never talk to Jade"><button class="btn primary" id="rAdd">Add rule</button></div>
        <p class="dim">Examples: "never talk to Jade", "never leave the town", "never fight", "never have children".</p>`, { id: 'rCard' })}</div>`;
  },
  async mount() {
    on('#rAdd', 'click', async () => { const t = val('rText'); if (!t) return; try { await this.refresh!(await cmd<RulesAns>({ cmd: 'rules', id: rFor, add: t }, 60000) as never); (document.getElementById('rText') as HTMLInputElement).value = ''; toast('Rule added', 'ok'); } catch (e) { err(e); } });
    on('#rText', 'keydown', (_el, e) => { if ((e as KeyboardEvent).key === 'Enter') document.getElementById('rAdd')!.click(); });
    await this.refresh!();
  },
  async refresh(given?: RulesAns) {
    const r = given ?? await cmd<RulesAns>({ cmd: 'rules' });
    setHtml('rWho', [`<button class="who ${rFor < 0 ? 'on' : ''}" data-id="-1">Everyone <small>${r.all.length}/${r.max}</small></button>`, ...r.people.map((p) => `<button class="who ${rFor === p.id ? 'on' : ''}" data-id="${p.id}">${esc(p.name)} <small>${p.rules.length}/${r.max}</small></button>`)].join(''));
    const list = rFor < 0 ? r.all : r.people.find((p) => p.id === rFor)?.rules ?? [];
    setHtml('rList', list.length ? list.map((x, k) => `<div class="li"><span>“${esc(x.text)}”<br><small class="dim">${ruleWhat(x)}${x.ai ? ' · understood by the AI' : ''}</small></span><button class="btn sm ghost" data-rm="${k}">Remove</button></div>`).join('') : '<div class="empty">No rules yet.</div>');
    (document.getElementById('rAdd') as HTMLButtonElement | null)?.toggleAttribute('disabled', list.length >= r.max);
    on('#rWho .who', 'click', (b) => { rFor = Number(b.dataset.id); void this.refresh!(r as never); });
    on('#rList [data-rm]', 'click', async (b) => { try { await this.refresh!(await cmd<RulesAns>({ cmd: 'rules', id: rFor, remove: Number(b.dataset.rm) }) as never); toast('Rule removed', 'ok'); } catch (e) { err(e); } });
  },
};

// ------------------------------------------------------------ AI
type AiStatus = { provider: string; model: string; auto?: boolean; ollamaUrl: string; keys?: number; ready: boolean; why?: string; callsLastHour: number; maxCallsPerHour: number; lastMs: number; lastError: string };
type PlannerStatus = { on: boolean; everyGameHours: number; batch: number; minGapSec: number; busy: boolean; counts: { batches: number; plans: number; chats: number; failures: number; builtIn: number } };
export const ai: Screen = {
  title: 'AI brain', icon: 'ai', help: 'ai', every: 10,
  render() {
    return `<div class="grid2">
    ${card('Status', `<div id="aStatus" class="stat"></div>`)}
    ${card('Saved brains', `<div id="bList"><div class="skel"></div></div><button class="btn" id="bAdd">${icon('plus')} Add a brain</button>`, { help: help('brains') })}
    ${card('<span id="bEdTitle">Edit brain</span>', `${row('Name', `<input id="aName" maxlength="40" placeholder="e.g. Gemini fast">`)}
      ${row('Type', `<select id="aProv"><option value="none">Off (built-in brain)</option><option value="gemini">Gemini (Google)</option><option value="ollama">Ollama (your own models)</option><option value="openai">OpenAI-compatible</option></select>`)}
      <div id="aUrlRow">${row('Address', `<input id="aUrl" placeholder="https://your-ollama-server">`, help('aiUrl'))}</div>
      <div id="aModelRow">${row('Model', `<input id="aModel" list="aModels" placeholder="fastest (automatic)"><datalist id="aModels"></datalist>`, help('aiModel'))}</div>
      <div id="aKeyRow">${row('API keys', `<div id="aKeys" class="keys"></div><div class="row"><input id="aKey" type="password" autocomplete="off" placeholder="Paste a key" aria-label="New API key"><button class="btn sm" id="aKeyAdd">${icon('plus')} Add key</button></div><small class="dim" id="aKeyNote"></small>`, help('aiKey'))}</div>
      <div class="row wrap"><button class="btn primary" id="aSave">Save</button><button class="btn" id="aUse">Save and use</button><button class="btn" id="aList">List models</button><button class="btn" id="aTest">Test</button></div><pre id="aOut" class="out"></pre>`, { help: help('ai') })}
    ${card('Planner', `<div id="plState" class="dim"></div>
      ${row('Plans on', `<label class="switch"><input type="checkbox" id="plOn"><i></i></label>`)}
      ${row('A new plan every', `<input type="number" id="plEvery" min="0.5" max="48" step="0.5" style="width:80px"> game hours`)}
      ${row('People per request', `<input type="number" id="plBatch" min="1" max="10" style="width:80px">`)}
      ${row('Seconds between requests', `<input type="number" id="plGap" min="5" max="600" style="width:80px">`)}
      <button class="btn primary" id="plSave">Save planner</button>`, { help: help('planner') })}
    ${card('Requests and answers', `<div id="aLog"></div><button class="btn sm" id="aLogR">${icon('refresh')} Refresh</button>`, { help: help('aiLog'), cls: 'span2' })}
    </div>`;
  },
  async mount() {
    on('#aProv', 'change', () => { provRows(); (document.getElementById('aModel') as HTMLInputElement).value = ''; });
    on('#bAdd', 'click', () => edit(null));
    on('#aSave', 'click', () => void saveBrain(false));
    on('#aKeyAdd', 'click', () => { if (!val('aKey')) { toast('Paste a key first', 'err'); return; } void saveBrain(false); });
    on('#aUse', 'click', () => void saveBrain(true));
    on('#aList', 'click', async () => { setHtml('aOut', 'Asking for the models…'); try { const l = await cmd<string[]>({ cmd: 'brainModels', ...form() }, 60000); setHtml('aModels', l.map((m) => `<option value="${esc(m)}">`).join('')); setHtml('aOut', l.length ? esc(`Models: ${l.join(', ')}`) : 'No models found.'); } catch (e) { setHtml('aOut', esc(String(e))); } });
    on('#aTest', 'click', async () => { setHtml('aOut', 'Asking the model…'); try { const r = await cmd<{ text: string; ms: number; model: string }>({ cmd: 'brainTest', ...form() }, 120000); setHtml('aOut', esc(`${r.model} (${(r.ms / 1000).toFixed(1)} s): ${r.text}`)); } catch (e) { setHtml('aOut', esc(String(e))); } });
    await loadBrains(true);
    on('#plSave', 'click', async () => { try { const p = await cmd<PlannerStatus>({ cmd: 'planner', on: (document.getElementById('plOn') as HTMLInputElement).checked, everyGameHours: Number(val('plEvery')), batch: Number(val('plBatch')), minGapSec: Number(val('plGap')) }); planner(p, true); toast('Planner saved', 'ok'); } catch (e) { err(e); } });
    on('#aLogR', 'click', () => void this.refresh!());
    const s = await cmd<AiStatus>({ cmd: 'ai' }); show(s);
    await this.refresh!(true as never);
  },
  async refresh(fill?: boolean) {
    const r = await cmd<{ ai: AiStatus; planner: PlannerStatus; log: { at: number; kind: string; who: string; prompt: string; reply: string; ms: number; err?: string }[] }>({ cmd: 'aiLog' });
    show(r.ai); planner(r.planner, !!fill);
    const open = new Set([...document.querySelectorAll<HTMLDetailsElement>('#aLog details[open]')].map((d) => d.dataset.k));
    setHtml('aLog', r.log.length ? r.log.slice(0, 30).map((x) => { const k = `${x.at}`; return `<details class="logi" data-k="${k}"${open.has(k) ? ' open' : ''}><summary><span class="ev-t">${new Date(x.at).toLocaleTimeString()}</span> <span class="tag">${esc(x.kind)}</span> ${esc(x.who)} · ${x.err ? `<span class="bad">${esc(x.err)}</span>` : (x.ms / 1000).toFixed(1) + ' s'}</summary><h5>Asked</h5><pre>${esc(x.prompt)}</pre><h5>Answer</h5><pre>${esc(x.reply || '-')}</pre></details>`; }).join('') : '<div class="empty">No request yet.</div>');
  },
};
// Saved brains: the list, and the editor (the brain being edited, or null = a new one).
type BrainV = { id: string; name: string; provider: string; url: string; model: string; keys: number; keyEnd: string; keyEnds?: string[]; active: boolean };
type BrainsAns = { active: string; list: BrainV[]; envKeys?: { gemini: number } };
const PROV_NAMES: Record<string, string> = { none: 'Built-in', gemini: 'Gemini', ollama: 'Ollama', openai: 'OpenAI-compatible' };
let brains: BrainsAns = { active: '', list: [] };
let editing: BrainV | null = null;
function provRows(): void {
  const p = val('aProv');
  document.getElementById('aUrlRow')!.hidden = p !== 'ollama' && p !== 'openai';
  document.getElementById('aModelRow')!.hidden = p === 'none';
  document.getElementById('aKeyRow')!.hidden = p === 'none';
  (document.getElementById('aUrl') as HTMLInputElement).placeholder = p === 'openai' ? 'https://api.openai.com/v1' : 'https://your-ollama-server';
  (document.getElementById('aModel') as HTMLInputElement).placeholder = p === 'ollama' ? 'fastest (automatic)' : p === 'gemini' ? 'gemini-flash-latest (newest Flash)' : 'gpt-4o-mini';
  const env = brains.envKeys?.gemini ?? 0, n = editing?.keys ?? 0;
  setHtml('aKeys', (editing?.keyEnds ?? []).map((e, i) => `<span class="tag keytag">Key ${i + 1} …${esc(e)} <button class="iconbtn sm" data-krm="${i}" aria-label="Remove key ${i + 1}">${icon('x')}</button></span>`).join(''));
  setHtml('aKeyNote', n > 1 ? `${n} keys take turns: one per request, and a busy key hands over to the next.` : n === 1 ? 'Add more keys to take turns between them.'
    : p === 'gemini' && env ? `No key here: the ${env} keys in the server .env are used, taking turns.` : p === 'ollama' ? 'Your own Ollama needs no key (ollama.com does).' : 'Paste a key, then Add key (or Save).');
  on('[data-krm]', 'click', async (b) => {
    if (!editing || !confirm(`Remove key ${Number(b.dataset.krm) + 1} (…${editing.keyEnds?.[Number(b.dataset.krm)]})?`)) return;
    try { const r = await cmd<BrainsAns & { saved: string }>({ cmd: 'brainSave', id: editing.id, removeKey: Number(b.dataset.krm) }); brains = r; renderBrains(); editing = brains.list.find((x) => x.id === r.saved) ?? null; provRows(); toast('Key removed', 'ok'); } catch (e) { err(e); }
  });
}
function edit(b: BrainV | null): void {
  editing = b;
  setHtml('bEdTitle', b ? `Edit "${esc(b.name)}"` : 'New brain');
  (document.getElementById('aName') as HTMLInputElement).value = b?.name ?? '';
  (document.getElementById('aProv') as HTMLSelectElement).value = b?.provider ?? 'ollama';
  (document.getElementById('aUrl') as HTMLInputElement).value = b?.url && (b.provider === 'ollama' || b.provider === 'openai') ? b.url : '';
  (document.getElementById('aModel') as HTMLInputElement).value = b?.model ?? '';
  (document.getElementById('aKey') as HTMLInputElement).value = '';
  setHtml('aOut', ''); setHtml('aModels', '');
  provRows();
  if (!b) document.getElementById('aName')?.focus();
}
/** The editor's values; the key only when typed (or removed), so a saved key stays on the server. */
function form(): { id?: string; name: string; provider: string; url: string; model: string; addKey?: string } {
  const add = val('aKey');
  return { ...(editing ? { id: editing.id } : {}), name: val('aName'), provider: val('aProv'), url: val('aUrl'), model: val('aModel'), ...(add ? { addKey: add } : {}) };
}
async function saveBrain(use: boolean): Promise<void> {
  try {
    const r = await cmd<BrainsAns & { saved: string }>({ cmd: 'brainSave', ...form() });
    brains = r;
    if (use && r.saved !== r.active) brains = await cmd<BrainsAns>({ cmd: 'brainUse', id: r.saved });
    renderBrains();
    edit(brains.list.find((b) => b.id === r.saved) ?? null);
    toast(use || r.saved === brains.active ? 'Brain saved and in use' : 'Brain saved', 'ok');
    show(await cmd<AiStatus>({ cmd: 'ai' }));
  } catch (e) { setHtml('aOut', esc(String((e as Error).message ?? e))); }
}
async function loadBrains(first = false): Promise<void> {
  brains = await cmd<BrainsAns>({ cmd: 'brains' });
  renderBrains();
  if (first) edit(brains.list.find((b) => b.active) ?? null);
}
function renderBrains(): void {
  setHtml('bList', brains.list.map((b) => `<div class="li${b.active ? ' on' : ''}"><div><b>${esc(b.name)}</b> ${b.active ? '<span class="tag ok">In use</span>' : ''}<br>
    <small class="dim">${esc(PROV_NAMES[b.provider] ?? b.provider)}${b.provider !== 'none' ? ` · ${esc(b.model || (b.provider === 'ollama' ? 'fastest model' : 'default model'))}` : ''}${b.provider === 'ollama' || b.provider === 'openai' ? ` · ${esc(b.url)}` : ''}${b.keys ? ` · ${b.keys > 1 ? `${b.keys} keys` : 'key'} …${esc(b.keyEnd)}` : b.provider === 'gemini' && brains.envKeys?.gemini ? ` · ${brains.envKeys.gemini} keys from .env` : ''}</small></div>
    <div class="row">${b.active ? '' : `<button class="btn sm primary" data-buse="${esc(b.id)}">Use</button>`}<button class="btn sm ghost" data-bed="${esc(b.id)}">Edit</button>${b.active ? '' : `<button class="btn sm ghost danger" data-brm="${esc(b.id)}" aria-label="Delete">${icon('x')}</button>`}</div></div>`).join(''));
  on('[data-buse]', 'click', async (el) => { try { const r = await cmd<BrainsAns & { ai: AiStatus }>({ cmd: 'brainUse', id: el.dataset.buse! }); brains = r; renderBrains(); show(r.ai); toast(`Now thinking with ${brains.list.find((b) => b.active)?.name}`, 'ok'); } catch (e) { err(e); } });
  on('[data-bed]', 'click', (el) => edit(brains.list.find((b) => b.id === el.dataset.bed) ?? null));
  on('[data-brm]', 'click', async (el) => { const b = brains.list.find((x) => x.id === el.dataset.brm); if (!b || !confirm(`Delete the brain "${b.name}"?`)) return; try { brains = { ...brains, ...(await cmd<BrainsAns>({ cmd: 'brainDelete', id: b.id })) }; renderBrains(); if (editing?.id === b.id) edit(null); } catch (e) { err(e); } });
}
function show(s: AiStatus): void {
  const active = brains.list.find((b) => b.active);
  setHtml('aStatus', `<div class="statrow"><span>Brain</span><b>${active ? esc(active.name) + ' · ' : ''}${s.provider === 'none' ? 'Off (built-in)' : esc(PROV_NAMES[s.provider] ?? s.provider)}</b></div>
    <div class="statrow"><span>Model</span><b>${esc(s.model || '-')}${s.auto ? ' <small>(fastest, automatic)</small>' : ''}</b></div>
    <div class="statrow"><span>State</span><b class="${s.ready ? 'ok' : 'bad'}">${s.provider === 'none' ? '-' : s.ready ? 'Ready' : esc(s.why ?? 'not ready')}</b></div>
    <div class="statrow"><span>Calls this hour</span><b>${s.callsLastHour} / ${s.maxCallsPerHour}</b></div>
    <div class="statrow"><span>Last answer took</span><b>${s.lastMs ? (s.lastMs / 1000).toFixed(1) + ' s' : '-'}</b></div>
    ${s.keys && s.keys > 1 ? `<div class="statrow"><span>API keys</span><b>${s.keys}, taking turns</b></div>` : ''}
    ${s.lastError ? `<div class="statrow"><span>Last error</span><b class="bad">${esc(s.lastError)}</b></div>` : ''}`);
}
function planner(p: PlannerStatus, fill: boolean): void {
  setHtml('plState', `${p.on ? 'On' : 'Off'}${p.busy ? ' · thinking now' : ''} · ${p.counts.batches} requests, ${p.counts.plans} plans, ${p.counts.chats} chats (${p.counts.builtIn} without AI), ${p.counts.failures} failures`);
  if (fill) {
    (document.getElementById('plOn') as HTMLInputElement).checked = p.on;
    (document.getElementById('plEvery') as HTMLInputElement).value = String(p.everyGameHours);
    (document.getElementById('plBatch') as HTMLInputElement).value = String(p.batch);
    (document.getElementById('plGap') as HTMLInputElement).value = String(p.minGapSec);
  }
}

// ------------------------------------------------------------ players & TVs
type Pairing = { code: string; name: string; dev: string; at: number };
type Player = { name: string; dev: string; created: number; lastSeen: number; fromEnv: boolean; seer?: boolean };
export const players: Screen = {
  title: 'Players & TVs', icon: 'tv', help: 'players', every: 5,
  render() {
    return `<div class="grid2">${card('How TVs join', `${row('TVs join by themselves', `<label class="switch"><input type="checkbox" id="plAuto"><i></i></label>`, help('autoJoin'))}<p class="dim small" id="plAutoTxt"></p>`, { help: help('autoJoin') })}
      ${card('TVs waiting', `<div id="plPairs"></div>`, { help: help('pairings'), id: 'pairCard' })}${card('Players', `<div id="plList"></div>`, { help: help('players'), cls: 'span2' })}</div>`;
  },
  async mount() {
    on('#plAuto', 'change', async (el) => { try { const r = await cmd<{ on: boolean }>({ cmd: 'autoJoin', on: (el as HTMLInputElement).checked }); autoTxt(r.on); toast(r.on ? 'TVs now join by themselves' : 'Each TV now waits for your approval', 'ok'); } catch (e) { err(e); } });
    await this.refresh!();
  },
  async refresh() {
    const [pairs, list, all, aj] = await Promise.all([cmd<Pairing[]>({ cmd: 'pairings' }), cmd<Player[]>({ cmd: 'players' }), people(), cmd<{ on: boolean }>({ cmd: 'autoJoin' })]);
    (document.getElementById('plAuto') as HTMLInputElement).checked = aj.on; autoTxt(aj.on);
    document.getElementById('pairCard')?.classList.toggle('alert-card', pairs.length > 0);
    const focus = document.activeElement?.id;
    if (!focus?.startsWith('pn_')) setHtml('plPairs', pairs.length ? pairs.map((p) => `<div class="pair"><div><div class="code">${esc(p.code)}</div><small class="dim">${esc(p.dev || 'device')} · ${ago(p.at)}</small></div>
      <div class="row"><input id="pn_${esc(p.code)}" value="${esc(p.name)}" placeholder="Player name"><button class="btn primary" data-ok="${esc(p.code)}">Approve</button><button class="btn ghost" data-no="${esc(p.code)}">Deny</button></div></div>`).join('') : '<div class="empty">No TV is waiting.</div>');
    setHtml('plList', list.length ? list.map((p) => { const ch = all.find((x) => x.player && x.name.toLowerCase() === p.name.toLowerCase()); return `<div class="li"><div><b>${esc(p.name)}</b> ${ch?.online ? '<span class="tag ok">online</span>' : '<span class="tag">away</span>'}<br><small class="dim">${esc(p.dev)} · last seen ${ago(p.lastSeen)}${ch ? ` · ${esc(ch.map ?? 'on the road')} (${Math.round(ch.x)}, ${Math.round(ch.y)})` : ''}</small></div>
      <div class="row"><label class="switch sm" title="Sees what people think, over their heads"><input type="checkbox" data-seer="${esc(p.name)}"${p.seer ? ' checked' : ''}><i></i><span>Sees thoughts</span></label>${p.fromEnv ? '<span class="tag">.env</span>' : `<button class="btn sm ghost danger" data-rm="${esc(p.name)}">Remove</button>`}</div></div>`; }).join('') : '<div class="empty">No players yet.</div>');
    on('[data-ok]', 'click', async (b) => { const code = b.dataset.ok!; try { const r = await cmd<{ name: string }>({ cmd: 'approve', code, name: val('pn_' + code) }); toast(`TV approved as ${r.name}`, 'ok'); void this.refresh!(); } catch (e) { err(e); } });
    on('[data-no]', 'click', async (b) => { try { await cmd({ cmd: 'deny', code: b.dataset.no! }); void this.refresh!(); } catch (e) { err(e); } });
    on('[data-rm]', 'click', async (b) => { if (!confirm(`Remove ${b.dataset.rm}? That TV will have to pair again.`)) return; try { await cmd({ cmd: 'revoke', name: b.dataset.rm! }); toast('Removed', 'ok'); void this.refresh!(); } catch (e) { err(e); } });
    on('[data-seer]', 'change', async (el) => { const c = el as HTMLInputElement; try { await cmd({ cmd: 'seer', name: c.dataset.seer!, on: c.checked }); toast(`${c.dataset.seer} ${c.checked ? 'sees' : 'no longer sees'} thoughts`, 'ok'); } catch (e) { err(e); } });
  },
};

function autoTxt(on: boolean): void {
  setHtml('plAutoTxt', on ? 'A TV that opens the World app (My PC > App Store) plays at once under its My PC username. Nobody signs in.'
    : 'A TV that opens the World app shows a 6-digit code below. Approve it with the player\'s name.');
}

// ------------------------------------------------------------ events
type Ev = { at: number; kind: string; data: Record<string, unknown> };
let evGroup = 'all', evQ = '', evLimit = 200;
export const events: Screen = {
  title: 'Events', icon: 'events', help: 'events', every: 8,
  render() {
    return `<div class="toolbar"><div class="seg" id="eG"><button data-g="all" class="on">All</button>${Object.entries(KINDS).map(([k, [l, c]]) => `<button data-g="${k}"><i class="dotc" style="background:${c}"></i>${l}</button>`).join('')}</div>
      <label class="search">${icon('search')}<input id="eQ" placeholder="Search (a name, a word)"></label>
      <select id="eL"><option value="100">Last 100</option><option value="200" selected>Last 200</option><option value="500">Last 500</option></select></div>
      <div class="grid2">${card('Timeline', `<div id="eList" class="feed long"></div>`, { cls: 'span2' })}${card('Past events (zombie attacks)', `<div id="eRep"></div>`, { help: help('replays'), cls: 'span2' })}</div>`;
  },
  async mount() {
    on('#eG button', 'click', (b) => { evGroup = b.dataset.g!; for (const x of document.querySelectorAll('#eG button')) x.classList.toggle('on', x === b); void this.refresh!(); });
    on('#eQ', 'input', (el) => { evQ = (el as HTMLInputElement).value.trim().toLowerCase(); void this.refresh!(); });
    on('#eL', 'change', (el) => { evLimit = Number((el as HTMLSelectElement).value); void this.refresh!(); });
    await people();
    await this.refresh!();
  },
  async refresh() {
    const list = (await cmd<Ev[]>({ cmd: 'timeline', limit: evLimit })).filter((e) => e.kind !== 'admin' && (evGroup === 'all' || groupOf(e.kind) === evGroup));
    const rows = list.map((e) => [e, describe(e)] as const).filter(([, t]) => !evQ || t.toLowerCase().includes(evQ));
    let day = -1;
    setHtml('eList', rows.map(([e, t]) => { const d = Math.floor((e.at / 3600 + 8) / 24); const head = d !== day ? `<div class="evday">Day ${d + 1}</div>` : ''; day = d; return `${head}<div class="ev"><i class="dotc" style="background:${KINDS[groupOf(e.kind)]![1]}"></i><span class="ev-t">${gameTime(e.at, true)}</span><span>${esc(t)}</span></div>`; }).join('') || '<div class="empty">Nothing matches.</div>');
    const reps = await cmd<{ id: number; map: string; start: number; secs: number; people: string[]; zombies: number; bites: number; killed: number; deaths: string[] }[]>({ cmd: 'replays' });
    setHtml('eRep', reps.length ? `<div class="tbl-wrap"><table class="tbl"><thead><tr><th>When</th><th>Map</th><th>Length</th><th>People</th><th>Zombies</th><th>Bites</th><th>Killed</th><th>Deaths</th></tr></thead><tbody>${reps.map((r) => `<tr><td>${gameTime(r.start)}</td><td>${esc(r.map)}</td><td>${r.secs} s</td><td>${esc(r.people.join(', ') || '-')}</td><td>${r.zombies}</td><td>${r.bites}</td><td>${r.killed}</td><td>${esc(r.deaths.join(', ') || '-')}</td></tr>`).join('')}</tbody></table></div><p class="dim">Watch them on the TV: game menu > Past events.</p>` : '<div class="empty">No zombie attack recorded yet.</div>');
  },
};

// ------------------------------------------------------------ server
export const server: Screen = {
  title: 'Server', icon: 'server', help: 'server', every: 30,
  render() {
    return `<div class="grid2">${card('Live', `<div id="sLive" class="stat"></div>`)}
      ${card('Internet link', `<div id="sTun" class="stat"></div>${row('Provider', `<select id="sProv"><option value="ngrok">ngrok</option><option value="cloudflare">Cloudflare (named)</option><option value="cloudflare-quick">Cloudflare (quick)</option><option value="tailscale">Tailscale</option><option value="none">None (this PC only)</option></select> <button class="btn sm" id="sSwitch">Switch</button>`)}`, { help: help('tunnel') })}
      ${card('Speed of the simulation', `<div id="sChart" class="chartbox"></div>`, { cls: 'span2' })}
      ${card('Memory', `<div id="sRam" class="chartbox"></div>`, { cls: 'span2' })}
      ${card('This panel', `<div class="stat"><div class="statrow"><span>Server address</span><b>${esc(serverAddress())}</b></div><div class="statrow"><span>Panel opened from</span><b>${onServer ? 'the server itself' : esc(location.host)}</b></div>
        <div class="statrow"><span>Panel on GitHub</span><b><a href="https://imad-os.github.io/g_worldsim/panel/" target="_blank" rel="noopener">imad-os.github.io/g_worldsim/panel</a></b></div></div>`)}
      ${card('Save', `<button class="btn" id="sSnap">Save the world now</button>`, { help: help('snapshot') })}</div>`;
  },
  async mount() {
    on('#sSwitch', 'click', async () => { const p = val('sProv'); if (!confirm(`Switch the internet link to ${p}? TVs and this panel lose the link for a few seconds${p === 'none' ? ' (and for good from outside your PC)' : ''}.`)) return; try { const st = await cmd<{ url: string }>({ cmd: 'tunnelSwitch', provider: p as 'ngrok' }, 60000); toast(`Link: ${st.url || 'off'}`, 'ok'); } catch (e) { err(e); } });
    on('#sSnap', 'click', async () => { try { await cmd({ cmd: 'snapshot' }); toast('Saved', 'ok'); } catch (e) { err(e); } });
    if (stats) { this.onStats!(stats); (document.getElementById('sProv') as HTMLSelectElement).value = stats.tunnel?.provider ?? 'ngrok'; }
    await this.refresh!();
  },
  async refresh() {
    const h = await history(), t = h.map((r) => r[0]!);
    setHtml('sChart', lineChart([{ name: 'Ticks/s', color: '#22c55e', values: h.map((r) => r[10]!) }, { name: 'CPU %', color: '#f59e0b', values: h.map((r) => r[11]!) }], t, { min: 0 }));
    setHtml('sRam', lineChart([{ name: 'RAM MB', color: '#8b5cf6', values: h.map((r) => r[12]!) }], t, { min: 0 }));
  },
  onStats(s: ServerStats) {
    setHtml('sLive', [['Ticks per second', `${s.tps.toFixed(0)}`], ['Tick time', `${s.tickMsAvg.toFixed(2)} ms (p95 ${s.tickMsP95.toFixed(2)}, max ${s.tickMsMax.toFixed(1)})`], ['CPU', `${s.cpuPct.toFixed(0)} %`],
      ['RAM', `${s.rssMb.toFixed(0)} MB (heap ${s.heapMb.toFixed(0)})`], ['Entities', `${s.entities} (${s.agents} people)`], ['Viewers', `${Math.max(0, s.clients - 1)}`], ['Tick', String(s.tick)],
      ['Last save', s.lastSnapshotAt ? ago(s.lastSnapshotAt) : '-'], ['Up for', `${Math.floor(s.uptimeSec / 3600)} h ${Math.round((s.uptimeSec % 3600) / 60)} min`]].map(([k, v]) => `<div class="statrow"><span>${k}</span><b>${v}</b></div>`).join(''));
    const tn = s.tunnel;
    if (tn) setHtml('sTun', `<div class="statrow"><span>Provider</span><b>${esc(tn.provider)}</b></div><div class="statrow"><span>State</span><b class="${tn.state === 'up' ? 'ok' : 'bad'}">${esc(tn.state)}${tn.error ? ': ' + esc(tn.error) : ''}</b></div><div class="statrow"><span>Address</span><b>${tn.url ? `<a href="${esc(tn.url)}/panel/" target="_blank" rel="noopener">${esc(tn.url)}</a>` : '-'}</b></div>`);
  },
};

// ------------------------------------------------------------ settings (this device)
export const settings: Screen = {
  title: 'Settings', icon: 'settings', help: 'settings',
  render() {
    return `<div class="grid2">
      ${!isStaff() ? '' : card('Dashboard', `<p class="dim">What the dashboard shows.</p>${WIDGETS.map(([k, l]) => `<label class="check"><input type="checkbox" data-w="${k}"${dashOn(k) ? ' checked' : ''}> ${esc(l)}</label>`).join('')}`, { help: help('dashboard') })}
      ${card('Look', `${row('Theme', `<div class="seg" id="sTheme">${[['auto', 'Automatic'], ['dark', 'Dark'], ['light', 'Light']].map(([k, l]) => `<button data-t="${k}" class="${load('theme', 'auto') === k ? 'on' : ''}">${l}</button>`).join('')}</div>`)}
        ${row('Accent', `<div class="seg" id="sAcc">${['#4da3ff', '#22c55e', '#f59e0b', '#ec4899', '#8b5cf6'].map((c) => `<button data-c="${c}" class="${load('accent', '#4da3ff') === c ? 'on' : ''}"><i class="dotc" style="background:${c}"></i></button>`).join('')}</div>`)}
        ${row('Compact lists', `<label class="switch"><input type="checkbox" id="sCompact"${load('compact', false) ? ' checked' : ''}><i></i></label>`)}
        ${row('"?" help buttons', `<label class="switch"><input type="checkbox" id="sHelp"${load('helpOn', true) ? ' checked' : ''}><i></i></label>`)}`)}
      ${card('Server', `${row('Address', `<input id="sAddr" value="${esc(serverAddress())}" placeholder="https://your-link.ngrok-free.dev"${onServer ? ' disabled' : ''}>`, help('address'))}
        <div class="row wrap">${onServer ? '' : '<button class="btn" id="sAddrGo">Connect</button>'}<button class="btn danger ghost" id="sOut">${icon('logout')} Sign out</button></div>`)}
      ${card('Alerts', `${row('Vibrate when a TV waits (phones)', `<label class="switch"><input type="checkbox" id="sVib"${load('vibrate', true) ? ' checked' : ''}><i></i></label>`)}
        ${row('Show a notice for each line people say', `<label class="switch"><input type="checkbox" id="sSay"${load('sayToasts', false) ? ' checked' : ''}><i></i></label>`)}`)}
    </div>`;
  },
  mount() {
    on('[data-w]', 'change', (el) => setDash(el.dataset.w!, (el as HTMLInputElement).checked));
    on('#sTheme button', 'click', (b) => { save('theme', b.dataset.t); for (const x of document.querySelectorAll('#sTheme button')) x.classList.toggle('on', x === b); applyLook(); });
    on('#sAcc button', 'click', (b) => { save('accent', b.dataset.c); for (const x of document.querySelectorAll('#sAcc button')) x.classList.toggle('on', x === b); applyLook(); });
    on('#sCompact', 'change', (el) => { save('compact', (el as HTMLInputElement).checked); applyLook(); });
    on('#sHelp', 'change', (el) => { save('helpOn', (el as HTMLInputElement).checked); applyLook(); });
    on('#sVib', 'change', (el) => save('vibrate', (el as HTMLInputElement).checked));
    on('#sSay', 'change', (el) => save('sayToasts', (el as HTMLInputElement).checked));
    on('#sAddrGo', 'click', () => { window.dispatchEvent(new CustomEvent('ws-server', { detail: val('sAddr') })); });
    on('#sOut', 'click', () => window.dispatchEvent(new CustomEvent('ws-signout')));
  },
};
export function applyLook(): void {
  const t = load('theme', 'auto'), root = document.documentElement;
  root.dataset.theme = t === 'auto' ? (matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark') : t;
  root.style.setProperty('--acc', load('accent', '#4da3ff'));
  root.classList.toggle('compact', load('compact', false));
  root.classList.toggle('nohelp', !load('helpOn', true));
}
