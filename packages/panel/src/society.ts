import { cmd } from './api.js';
import { help } from './help.js';
import { card, setHtml, type Screen } from './screen.js';
import { esc, gameTime } from './util.js';

/**
 * Society: what the people learned as a community and pass on to their children (imad 2026-11-26: "community memory for
 * places, persons and animals ... a screen in the panel to check what they have in their society"). Server: admin `lore`
 * (sim/lore.ts). Read only.
 */
interface Place { map: string; mapName: string; area: string; x: number; y: number; fear: number; deaths: number; hurts: number; causes: Record<string, number>; who: string[]; first: number; last: number }
interface Threat { k: string; fear: number; deaths: number; hurts: number; beaten: number; last: number }
interface MapL { map: string; name: string; wild: boolean; fear: number; deaths: number }
interface Person { id: number; name: string; fear: number; trust: number; deeds: string[]; alive: boolean }
interface Lesson { t: number; text: string; kind: string }
interface Living { id: number; name: string; age: number; knows: number; fears: string[] }
interface Lore { now: number; generations: number; dead: number; places: Place[]; threats: Threat[]; maps: MapL[]; persons: Person[]; lessons: Lesson[]; living: Living[] }

/** A 0-10 bar (red = fear, green = trust). */
const bar = (v: number, cls = 'low') => `<div class="meter ${cls}" title="${v} of 10" style="min-width:70px"><i style="width:${Math.max(2, Math.min(100, v * 10))}%"></i></div>`;
const causes = (c: Record<string, number>) => Object.entries(c).sort((a, b) => b[1] - a[1]).map(([k, n]) => `${esc(k)} ×${n}`).join(', ');
const NOUN: Record<string, string> = { zombie: 'Zombies', rabbit: 'Rabbits', deer: 'Deer', boar: 'Boars', wolf: 'Wolves', bear: 'Bears', horse: 'Horses' };

function draw(L: Lore): void {
  const knowAll = L.living.filter((p) => p.knows >= 100).length, learning = L.living.filter((p) => p.knows > 0 && p.knows < 100).length;
  setHtml('soTop', `<div class="stat">
    <div class="statrow"><span>Generations alive</span><b>${L.generations}</b></div>
    <div class="statrow"><span>People who died (their lessons stay)</span><b>${L.dead}</b></div>
    <div class="statrow"><span>Know it all (13+)</span><b>${knowAll}</b></div>
    <div class="statrow"><span>Still being taught (3-12)</span><b>${learning}</b></div>
    <div class="statrow"><span>Places feared</span><b>${L.places.filter((p) => p.fear >= 3).length}</b></div>
    <div class="statrow"><span>Lessons remembered</span><b>${L.lessons.length}</b></div></div>`);
  setHtml('soThreats', L.threats.length ? `<div class="tbl-wrap"><table class="tbl"><thead><tr><th>What</th><th>Fear</th><th>Killed of us</th><th>Bitten</th><th>We beat</th></tr></thead><tbody>
    ${L.threats.map((t) => `<tr><td>${esc(NOUN[t.k] ?? t.k)}</td><td>${bar(t.fear)}</td><td>${t.deaths}</td><td>${t.hurts}</td><td>${t.beaten}</td></tr>`).join('')}</tbody></table></div>`
    : '<div class="empty">Nothing feared yet: nobody has been bitten or killed.</div>');
  setHtml('soMaps', `<div class="tbl-wrap"><table class="tbl"><thead><tr><th>Map</th><th>Dread</th><th>Died there</th><th></th></tr></thead><tbody>
    ${L.maps.map((m) => `<tr><td>${esc(m.name)}</td><td>${bar(m.fear)}</td><td>${m.deaths}</td><td>${m.wild ? '<span class="tag bad">wild: no children</span>' : ''}${m.fear >= 9 ? ' <span class="tag bad">nobody goes</span>' : m.fear >= 5 ? ' <span class="tag warn">armed adults only</span>' : ''}</td></tr>`).join('')}</tbody></table></div>`);
  setHtml('soPlaces', L.places.length ? `<div class="tbl-wrap"><table class="tbl"><thead><tr><th>Place</th><th>Fear</th><th>Died</th><th>Hurt</th><th>By</th><th>Who died there</th><th>Last</th></tr></thead><tbody>
    ${L.places.map((p) => `<tr><td>${esc(p.area)} <span class="dim small">(${Math.round(p.x)}, ${Math.round(p.y)})</span>${p.fear >= 3 ? ' <span class="tag bad">kept away from</span>' : ''}</td><td>${bar(p.fear)}</td><td>${p.deaths}</td><td>${p.hurts}</td><td>${causes(p.causes)}</td><td>${p.who.map(esc).join(', ') || '-'}</td><td class="dim small">${gameTime(p.last)}</td></tr>`).join('')}</tbody></table></div>`
    : '<div class="empty">No dangerous places known yet.</div>');
  setHtml('soPeople', L.persons.length ? `<div class="tbl-wrap"><table class="tbl"><thead><tr><th>Person</th><th>Feared</th><th>Trusted</th><th>What people say</th></tr></thead><tbody>
    ${L.persons.map((p) => `<tr><td><a href="#/person/${p.id}">${esc(p.name)}</a>${p.alive ? '' : ' <span class="dim small">(dead)</span>'}${p.fear - p.trust >= 4 ? ' <span class="tag bad">avoided</span>' : p.trust - p.fear >= 2 ? ' <span class="tag good">trusted</span>' : ''}</td><td>${bar(p.fear)}</td><td>${bar(p.trust, 'good')}</td><td class="small">${p.deeds.map(esc).join(' · ')}</td></tr>`).join('')}</tbody></table></div>`
    : '<div class="empty">Nobody is feared or trusted for what they did yet.</div>');
  setHtml('soLessons', L.lessons.length ? L.lessons.map((l) => `<div class="logi"><span class="dim small">${gameTime(l.t)}</span> <span class="tag">${esc(l.kind)}</span> ${esc(l.text)}</div>`).join('')
    : '<div class="empty">No lessons yet. A death or many bites in one place become a lesson the whole community keeps.</div>');
  setHtml('soLiving', `<div class="tbl-wrap"><table class="tbl"><thead><tr><th>Person</th><th>Age</th><th>Knows</th><th>Fears</th></tr></thead><tbody>
    ${L.living.sort((a, b) => a.age - b.age).map((p) => `<tr><td><a href="#/person/${p.id}">${esc(p.name)}</a></td><td>${p.age}</td><td><div class="meter ${p.knows >= 100 ? 'good' : p.knows > 0 ? 'mid' : 'low'}" style="min-width:70px"><i style="width:${Math.max(2, p.knows)}%"></i></div></td><td class="small">${p.fears.map(esc).join(', ') || '<span class="dim">nothing</span>'}</td></tr>`).join('')}</tbody></table></div>`);
}

async function load(): Promise<void> {
  try { draw(await cmd<Lore>({ cmd: 'lore' })); } catch (e) { setHtml('soTop', `<div class="empty">${esc(e instanceof Error ? e.message : e)}</div>`); }
}

export const societyScreen: Screen = {
  title: 'Society', icon: 'people', help: 'society', every: 20,
  render() {
    return `<div class="grid2">
      ${card('What the people know', '<div id="soTop"><div class="skel"></div></div>', { help: help('society') })}
      ${card('Threats they fear', '<div id="soThreats"></div>', { help: help('soThreats') })}
      ${card('Maps', '<div id="soMaps"></div>', { help: help('soMaps') })}
      ${card('Lessons passed on', '<div id="soLessons" class="feed"></div>', { help: help('soLessons') })}
      ${card('Dangerous places', '<div id="soPlaces"></div>', { cls: 'span2', help: help('soPlaces') })}
      ${card('People they fear or trust', '<div id="soPeople"></div>', { cls: 'span2', help: help('soPeople') })}
      ${card('Who knows what', '<div id="soLiving"></div>', { cls: 'span2', help: help('soLiving') })}</div>`;
  },
  mount() { void load(); },
  refresh() { void load(); },
};
