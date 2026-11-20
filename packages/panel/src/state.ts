import { cmd } from './api.js';

/** What several screens share: everyone (names), the overview, the history. Refreshed on demand, at most so often. */
export type Person = { id: number; alive: boolean; player?: boolean; online?: boolean; asleep?: boolean; child?: boolean; pregnant?: boolean; partner?: string | null; name: string; sex?: string; age: number;
  map: string | null; x: number; y: number; act: number; hunger: number; thirst: number; tired: number; lonely: number; hp: number; carry: number; inv?: Record<string, number>;
  talkingTo: string | null; task?: string | null; order?: string | null;
  goal?: Goal | null; xp?: number; level?: number; goals?: { text: string; from: string; ok: boolean; at: number; xp: number }[] };
export type Goal = { text: string; from: string; k: number; n: number; step: string; pct: number };
/** An objective with its progress bar; who asked it (the owner = you). */
export const goalHtml = (g: Goal, esc: (s: unknown) => string) => `<div class="goal${g.from !== 'myself' ? ' ordered' : ''}"><div class="goal-t"><b>${esc(g.text)}</b><small>${g.from === 'myself' ? 'their own goal' : g.from === 'owner' ? 'your order' : 'asked by ' + esc(g.from)} · step ${Math.min(g.k + 1, g.n)}/${g.n}: ${esc(g.step)}</small></div><div class="meter good goal-m" role="progressbar" aria-valuenow="${g.pct}" aria-valuemin="0" aria-valuemax="100"><i style="width:${Math.max(4, g.pct)}%"></i></div></div>`;
export type Profile = { id: number; name: string; sex: string; age: number; alive: boolean; died: number | null; cause: string | null; generation: number; parents: string[]; partner: string | null; children: number; personality: string[]; mood: string | null; rules: number };
export type MapOv = { id: string; name: string; w: number; h: number; type: string; people: number; players: number; online: number; zombies: number; animals: number[]; items: number;
  camp: [number, number] | null; huts: number; fires: number; store: Record<string, number> | null };
export type Overview = { gameSec: number; clockScale: number; yearDays: number; speed: number; paused: boolean; alive: number; children: number; adults: number; pregnant: number; couples: number;
  asleep: number; working: number; talking: number; hungry: number; thirsty: number; hurt: number; needs: { hunger: number; thirst: number; tired: number; lonely: number; hp: number };
  acts: Record<string, number>; dead: number; born: number; generations: number; causes: Record<string, number>; maps: MapOv[]; animalNames: string[]; travelOpen: boolean;
  rules: { all: number; people: number }; zombiesNight: number; pairings: number; replays: number };

export const S = {
  people: [] as Person[], peopleAt: 0,
  profiles: [] as Profile[],
  ov: null as Overview | null, ovAt: 0,
  hist: [] as number[][], histAt: 0,
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
export async function history(): Promise<number[][]> {
  if (Date.now() - S.histAt > 30000) { S.hist = await cmd<number[][]>({ cmd: 'history' }); S.histAt = Date.now(); }
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
    default: return `${e.kind}: ${JSON.stringify(d).slice(0, 120)}`;
  }
}
/** Event kinds grouped for the filters, with a colour each. */
export const KINDS: Record<string, [string, string]> = {
  life: ['Life', '#ec4899'], social: ['Talks', '#4da3ff'], work: ['Work', '#d97706'], danger: ['Danger', '#ef4444'], travel: ['Travel', '#14b8a6'], owner: ['Owner', '#8b5cf6'], other: ['Other', '#8b95a1'],
};
export function groupOf(kind: string): string {
  if (['birth', 'death', 'partner', 'pregnant', 'spawn', 'remove'].includes(kind)) return 'life';
  if (['talk', 'say', 'give', 'rule'].includes(kind)) return 'social';
  if (['build', 'craft', 'store', 'loot', 'repair', 'heal', 'task', 'camp', 'hunt'].includes(kind)) return 'work';
  if (['zombie', 'zombies', 'fight', 'replay'].includes(kind)) return 'danger';
  if (['travel', 'arrive', 'teleport'].includes(kind)) return 'travel';
  if (['admin', 'ruleSet', 'supply', 'land'].includes(kind)) return 'owner';
  return 'other';
}
