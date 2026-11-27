import { cmd } from './api.js';

/** What several screens share: everyone (names), the overview, the history. Refreshed on demand, at most so often. */
export type Person = { id: number; alive: boolean; player?: boolean; online?: boolean; asleep?: boolean; child?: boolean; pregnant?: boolean; pregnantPct?: number | null; lyingIn?: number | null; partner?: string | null; name: string; sex?: string; age: number;
  map: string | null; x: number; y: number; act: number; hunger: number; thirst: number; tired: number; lonely: number; hp: number; carry: number; inv?: Record<string, number>;
  talkingTo: string | null; task?: string | null; order?: string | null;
  goal?: Goal | null; xp?: number; level?: number; goals?: { text: string; from: string; ok: boolean; at: number; xp: number }[]; kills?: Kills; influence?: number; influenceLog?: { t: number; d: number; why: string }[] };
/** Animals, zombies and people killed, duels won. */
export type Kills = { animals: number; zombies: number; people: number; beaten: number };
export const killsText = (k: Kills | undefined) => !k ? '' : [k.animals ? `${k.animals} animal${k.animals > 1 ? 's' : ''}` : '', k.zombies ? `${k.zombies} zombie${k.zombies > 1 ? 's' : ''}` : '', k.people ? `${k.people} ${k.people > 1 ? 'people' : 'person'}` : '', k.beaten ? `${k.beaten} duel${k.beaten > 1 ? 's' : ''} won` : ''].filter(Boolean).join(' · ');
export type Goal = { text: string; from: string; k: number; n: number; step: string; pct: number };
/** An objective with its progress bar; who asked it (the owner = you). */
export const goalHtml = (g: Goal, esc: (s: unknown) => string) => `<div class="goal${g.from !== 'myself' ? ' ordered' : ''}"><div class="goal-t"><b>${esc(g.text)}</b><small>${g.from === 'myself' ? 'their own goal' : g.from === 'owner' ? 'your order' : 'asked by ' + esc(g.from)} · step ${Math.min(g.k + 1, g.n)}/${g.n}: ${esc(g.step)}</small></div><div class="meter good goal-m" role="progressbar" aria-valuenow="${g.pct}" aria-valuemin="0" aria-valuemax="100"><i style="width:${Math.max(4, g.pct)}%"></i></div></div>`;
export type Profile = { id: number; name: string; sex: string; age: number; alive: boolean; died: number | null; cause: string | null; generation: number; parents: string[]; partner: string | null; children: number; personality: string[]; mood: string | null; rules: number; kills?: Kills; influence?: number | null };
export type MapOv = { id: string; name: string; w: number; h: number; type: string; people: number; players: number; online: number; zombies: number; animals: number[]; items: number;
  camp: [number, number] | null; huts: number; fires: number; store: Record<string, number> | null; leader?: string; defence?: [number, number]; doors?: number };
export type Overview = { gameSec: number; clockScale: number; yearDays: number; speed: number; paused: boolean; alive: number; children: number; adults: number; pregnant: number; couples: number;
  asleep: number; working: number; talking: number; hungry: number; thirsty: number; hurt: number; needs: { hunger: number; thirst: number; tired: number; lonely: number; hp: number };
  acts: Record<string, number>; dead: number; born: number; generations: number; causes: Record<string, number>; maps: MapOv[]; animalNames: string[]; travelOpen: boolean;
  rules: { all: number; people: number }; zombiesNight: number; pairings: number; replays: number };

export const S = {
  people: [] as Person[], peopleAt: 0,
  profiles: [] as Profile[],
  ov: null as Overview | null, ovAt: 0,
  hist: [] as number[][], histAt: 0, histRange: '',
  names: new Map<number, string>(),
};

export async function people(force = false): Promise<Person[]> {
  if (force || Date.now() - S.peopleAt > 2500) {
    S.people = await cmd<Person[]>({ cmd: 'agents' }); S.peopleAt = Date.now();
    for (const p of S.people) S.names.set(p.id, p.name);
  }
  return S.people;
}
export async function profiles(): Promise<Profile[]> {
  S.profiles = await cmd<Profile[]>({ cmd: 'people' });
  for (const p of S.profiles) S.names.set(p.id, p.name);
  return S.profiles;
}
export async function overview(force = false): Promise<Overview> {
  if (force || !S.ov || Date.now() - S.ovAt > 2500) { S.ov = await cmd<Overview>({ cmd: 'overview' }); S.ovAt = Date.now(); }
  return S.ov;
}
/** Chart rows of a time range ('1d' .. 'all'); a server from before ranges answers its last 24 h whatever the range. */
export async function history(range = '1d', force = false): Promise<number[][]> {
  if (force || range !== S.histRange || Date.now() - S.histAt > (range === '1d' ? 30000 : 120000)) {
    const r = await cmd<number[][] | { rows: number[][] }>({ cmd: 'history', range: range as '1d' });
    S.hist = Array.isArray(r) ? r : r.rows; S.histAt = Date.now(); S.histRange = range;
  }
  return S.hist;
}
export const who = (id: unknown) => S.names.get(Number(id)) ?? `#${Number(id) & 0xffff}`;
export const mapName = (id: string | null) => (id ? S.ov?.maps.find((m) => m.id === id)?.name ?? id : 'on the road');

export function describe(e: { kind: string; data: Record<string, unknown> }): string {
  const d = e.data;
  switch (e.kind) {
    case 'talk': return `${who(d.a)} talked with ${who(d.b)}`;
    case 'death': return `${who(d.id)} died (${d.cause})`;
    case 'spawn': return `${who(d.id)} arrived in ${d.map}`;
    case 'remove': return `${who(d.id)} left the world (${d.cause})`;
    case 'travel': return `${who(d.id)} set off from ${d.from} to ${d.to}`;
    case 'arrive': return `${who(d.id)} arrived in ${d.map}`;
    case 'supply': return `Supply drop: ${d.n} food in ${d.map}`;
    case 'birth': return `${who(d.id)} was born (${who(d.mother)} and ${who(d.father)})`;
    case 'partner': return `${who(d.a)} and ${who(d.b)} became partners`;
    case 'pregnant': return `${who(d.id)} is expecting a baby with ${who(d.father)}`;
    case 'admin': return `Panel: ${d.cmd}`;
    case 'say': return `${who(d.id)}: “${d.text}”`;
    case 'build': return `${d.id !== undefined ? who(d.id) + ' built' : 'Built'} a ${d.what} in ${d.map} (${d.tx}, ${d.ty})`;
    case 'craft': return `${who(d.id)} made ${d.what === 'axe' || d.what === 'armor' ? 'an ' + d.what : 'a ' + d.what}`;
    case 'store': return `${who(d.id)} stored ${d.n} ${d.what} (store: ${d.total})`;
    case 'loot': return `${who(d.id)} searched a ruin: ${d.got}`;
    case 'replay': return `Zombie attack recorded (${d.secs} s, ${d.zombies} zombies, ${d.people || 'nobody'})`;
    case 'ruleSet': return `New rule for ${(d.id as number) >= 0 ? who(d.id) : 'everyone'}: "${d.text}"`;
    case 'rule': return `${who(d.id)} kept the rule "${d.rule}" and did not talk with ${who(d.with)}`;
    case 'zombie': return d.how === 'killed' ? `A zombie was killed${(d.by as number) >= 0 ? ' by ' + who(d.by) : ''}` : d.how === 'dawn' ? 'A zombie crumbled at dawn' : `A zombie appeared in ${d.map} (${d.x}, ${d.y})${d.how === 'spawned' ? ' (panel)' : ''}`;
    case 'zombies': return `${d.n} zombies came out in ${d.map}`;
    case 'fight': return `${who(d.id)} fights a zombie`;
    case 'heal': return `${who(d.id)} treated ${who(d.who)} (health ${d.hp})`;
    case 'repair': return `${who(d.id)} repaired a hut wall`;
    case 'task': return `${who(d.id)} ${d.ok ? 'finished' : 'gave up'}: ${d.text}${d.why ? ' (' + d.why + ')' : ''}`;
    case 'camp': return `A camp was set up in ${d.map} (${Math.round(d.x as number)}, ${Math.round(d.y as number)})`;
    case 'teleport': return `A player jumped next to ${who(d.to)}`;
    case 'give': return `${who(d.id)} gave ${d.n ?? 1} ${d.item} to ${who(d.to)}${d.trade ? ' for ' + d.trade : ''}`;
    case 'hunt': return `${(d.id as number) >= 0 ? who(d.id) : 'Someone'} hunted a ${d.animal ?? 'animal'} in ${d.map}`;
    case 'land': return `The land changed in ${d.map}: ${d.what}`;
    case 'reward': return `${who(d.id)} earned ${d.xp} xp for “${d.text}”${d.from && d.from !== 'myself' ? ' (from ' + d.from + ')' : ''}`;
    case 'levelup': return `${who(d.id)} reached level ${d.level}`;
    case 'quest': return `${who(d.id)} took the quest “${d.title}” from ${d.npc}`;
    case 'questDone': return `${who(d.id)} finished the quest “${d.title}” (+${d.xp} xp)`;
    case 'questReady': return `${who(d.id)} can hand in “${d.title ?? 'a quest'}”`;
    case 'clan': return `${who(d.leader)} founded the clan ${d.clan}${d.map ? ' in ' + d.map : ''}`;
    case 'clanJoin': return `${who(d.id)} joined ${d.clan}${d.n ? ' (' + d.n + ' members)' : ''}`;
    case 'clanLeave': return `${who(d.id)} left ${d.clan}${d.why ? ' (' + d.why + ')' : ''}`;
    case 'clanWar': return `War: ${d.clan} declared war on ${d.foe}${d.by === 'owner' ? ' (your order)' : ''}`;
    case 'clanPeace': return `Peace: ${d.clan} and ${d.foe}${d.winner ? ` (${d.winner} won ${Array.isArray(d.wins) ? Math.max(...(d.wins as number[])) + ' to ' + Math.min(...(d.wins as number[])) : ''})` : ''}`;
    case 'clanRaid': return `${d.clan} sent ${d.n} raiders against ${d.foe}`;
    case 'clanMove': return `${who(d.id)} wants to move from ${d.from} to ${d.clan} (${d.why})`;
    case 'clanSwitch': return `${who(d.id)} moved from ${d.from} to ${d.clan}`;
    case 'clanOrder': return `${who(d.id)} (${d.clan}) ordered: “${d.text}”`;
    case 'clanLeader': return `${who(d.id)} leads ${d.clan ?? 'the clan'} now`;
    case 'clanVoteStart': return `${d.clan ?? 'A clan'} is voting for a leader`;
    case 'clanVote': return `${d.clan ?? 'A clan'} voted: ${d.winner !== undefined ? who(d.winner) : 'done'}`;
    case 'duel': return `${who(d.a)} and ${who(d.b)} came to blows${d.why ? ' (' + d.why + ')' : ''}`;
    case 'duelEnd': return `${who(d.a)} and ${who(d.b)} stopped fighting${(d.winner as number) >= 0 ? ': ' + who(d.winner) + ' won' : ''}`;
    case 'guard': return `${who(d.id)} keeps watch tonight in ${d.map}`;
    case 'lyingIn': return `${who(d.id)} stays home ${d.days} days with the new baby`;
    case 'divorce': return `${who(d.a)} and ${who(d.b)} split up`;
    case 'grown': return `${who(d.id)} has grown up`;
    case 'leftHome': return `${who(d.id)} left the family home`;
    case 'leader': return `${who(d.id)} leads the camp in ${d.map ?? 'town'} now`;
    case 'dream': return `${who(d.id)}'s dream came true${d.kind ? ' (' + d.kind + ')' : ''}`;
    case 'explore': return `${who(d.id)} explored ${d.map ?? 'the land'}`;
    case 'tamed': return `${who(d.id)} tamed a horse`;
    case 'bitten': return `${who(d.id)} was bitten`;
    case 'flee': return `${who(d.id)} ran from danger`;
    default: return `${e.kind}: ${Object.entries(d).map(([k, v]) => `${k} ${typeof v === 'object' ? JSON.stringify(v) : v}`).join(', ').slice(0, 120)}`;
  }
}
/** Event kinds grouped for the filters, with a colour each. */
export const KINDS: Record<string, [string, string]> = {
  life: ['Life', '#ec4899'], social: ['Talks', '#4da3ff'], work: ['Work', '#d97706'], danger: ['Danger', '#ef4444'], travel: ['Travel', '#14b8a6'], owner: ['Owner', '#8b5cf6'], other: ['Other', '#8b95a1'],
};
export function groupOf(kind: string): string {
  if (['birth', 'death', 'partner', 'pregnant', 'spawn', 'remove'].includes(kind)) return 'life';
  if (['divorce', 'grown', 'leftHome', 'lyingIn', 'dream'].includes(kind)) return 'life';
  if (['talk', 'say', 'give', 'rule', 'clan', 'clanJoin', 'clanLeave', 'clanSwitch', 'clanOrder', 'clanLeader', 'clanVote', 'clanVoteStart', 'clanWar', 'clanPeace', 'clanRaid', 'clanMove', 'leader'].includes(kind)) return 'social';
  if (['build', 'craft', 'store', 'loot', 'repair', 'heal', 'task', 'camp', 'hunt', 'reward', 'levelup', 'quest', 'questDone', 'questReady', 'explore', 'tamed', 'guard'].includes(kind)) return 'work';
  if (['zombie', 'zombies', 'fight', 'replay', 'duel', 'duelEnd', 'bitten', 'flee'].includes(kind)) return 'danger';
  if (['travel', 'arrive', 'teleport'].includes(kind)) return 'travel';
  if (['admin', 'ruleSet', 'supply', 'land'].includes(kind)) return 'owner';
  return 'other';
}
