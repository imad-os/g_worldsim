import type { World, WorldEvent } from './world.js';

/** What a person has killed or beaten (imad 2026-11-25: "each person needs more stats like killing animals and killing people"). */
export interface Kills { animals: Record<string, number>; zombies: number; people: number; beaten: number }

export const noKills = (): Kills => ({ animals: {}, zombies: 0, people: 0, beaten: 0 });
export const animalKills = (k: Kills | undefined): number => Object.values(k?.animals ?? {}).reduce((s, v) => s + v, 0);

/**
 * Counts kills from the world's events into `Profile.kills` (kept in snapshots with the profile):
 * hunt (an animal killed, by `id`), zombie killed (`by`), death with `by` (a person killed by someone), duelEnd (the winner beat the other).
 */
export function trackKills(w: World): void {
  const of = (id: unknown) => {
    if (typeof id !== 'number' || id < 0) return null;
    const p = w.profiles.get(id);
    if (!p) return null;
    return (p.kills ??= noKills());
  };
  w.listeners.push((ev: WorldEvent) => {
    const d = ev.data;
    switch (ev.kind) {
      case 'hunt': { const k = of(d.id); if (k) { const a = String(d.animal ?? 'animal'); k.animals[a] = (k.animals[a] ?? 0) + 1; } break; }
      case 'zombie': if (d.how === 'killed') { const k = of(d.by); if (k) k.zombies++; } break;
      case 'death': if (d.by !== undefined && d.by !== d.id) { const k = of(d.by); if (k) k.people++; } break;
      case 'duelEnd': { const k = of(d.winner); if (k) k.beaten++; break; }
    }
  });
}
