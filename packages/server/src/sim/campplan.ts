import { Kind } from '@worldsim/protocol';
import type { World } from './world.js';

/**
 * The collective plan of a camp / clan (imad 2026-11-26: "people still wander without goals, doing random things; we need
 * a collective plan for the clan: plan for food and water, shelter, even storing resources").
 *
 * Once per call it counts what the camp of map m has against what it should have for the days to come:
 *  - food kept (camp crate + every fridge on the map): 3 portions a head;
 *  - water kept (bottles in fridges + the crate): 2 a head;
 *  - homes: a hut for every household (sim/homes.ts), beds for every sleeper, a fridge and a chest in every home;
 *  - building stock in the crate: wood and stone for repairs and the next hut.
 * The camp's work mind (sim/colony.ts) turns the lines into goals (the most lacking first, with a crew sized by the lack),
 * and whoever is still idle after the hand-out takes the most lacking stock line: nobody stands around while the plan
 * has holes. The plan is written in every AI prompt about a person of that camp (Planner.describe), the leader speaks it,
 * and the panel shows it (admin `campPlan`).
 */
export interface PlanLine {
  key: 'food' | 'water' | 'homes' | 'beds' | 'fridges' | 'chests' | 'wood' | 'stone';
  have: number;
  want: number;
}
export interface Plan { map: string; people: number; clan: string; leader: string; lines: PlanLine[]; most: string }

const WORDS: Record<PlanLine['key'], string> = {
  food: 'food kept', water: 'water kept', homes: 'homes', beds: 'beds', fridges: 'fridges', chests: 'chests', wood: 'wood in store', stone: 'stone in store',
};
/** Days of food / water the camp keeps (a head). */
export const FOOD_HEAD = 3, WATER_HEAD = 2, WOOD_STOCK = 15, STONE_STOCK = 8;

export class CampPlan {
  constructor(private w: World) {}

  /** The people the plan is for: the AI people and players' characters of map m. */
  private people(m: number): number[] {
    const e = this.w.e, out: number[] = [];
    for (let i = 0; i < e.hi; i++) if ((e.kind[i] === Kind.Agent || e.kind[i] === Kind.Player) && e.map[i] === m) out.push(i);
    return out;
  }

  /** Food and water kept on map m (crate + fridges). */
  kept(m: number): { food: number; water: number; wood: number; stone: number } {
    const sv = this.w.survival, st = sv.stash[m];
    const out = { food: st?.food ?? 0, water: st?.water ?? 0, wood: st?.wood ?? 0, stone: st?.stone ?? 0 };
    for (const b of sv.boxesOf(m)) if (b.kind === 'fridge') { out.food += b.inv.food ?? 0; out.water += b.inv.water ?? 0; }
    return out;
  }

  of(m: number): Plan {
    const w = this.w, sv = w.survival, n = this.people(m).length, kept = this.kept(m);
    const homes = sv.homes.list.filter((h) => h.m === m && h.owner >= 0);
    let beds = 0, bedsWant = 0, fridges = 0, chests = 0;
    for (const h of homes) {
      const b = sv.homes.bedsIn(h); beds += b; bedsWant += Math.max(b, sv.homes.sleepers(h).length);
      if (sv.boxIn(h, 'fridge') >= 0) fridges++;
      if (sv.boxIn(h, 'chest') >= 0) chests++;
    }
    const huts = sv.huts[m]!.length;
    const lines: PlanLine[] = [
      { key: 'food', have: kept.food, want: n * FOOD_HEAD },
      { key: 'water', have: kept.water, want: n * WATER_HEAD },
      { key: 'homes', have: huts, want: huts + sv.homes.needed(m) },
      { key: 'beds', have: beds, want: bedsWant },
      { key: 'fridges', have: fridges, want: homes.length },
      { key: 'chests', have: chests, want: homes.length },
      { key: 'wood', have: kept.wood, want: sv.campOf(m) ? WOOD_STOCK : 0 },
      { key: 'stone', have: kept.stone, want: sv.campOf(m) ? STONE_STOCK : 0 },
    ];
    const clan = this.clanOf(m);
    const most = [...lines].filter((l) => l.want > 0 && l.have < l.want).sort((a, b) => this.lack(b) - this.lack(a))[0];
    return { map: w.maps[m]!.def.id, people: n, clan: clan?.name ?? '', leader: clan ? w.profiles.get(clan.leader)?.name ?? '' : sv.leaderName(m), lines, most: most?.key ?? '' };
  }

  /** 0 = done .. 1 = nothing yet. */
  lack(l: PlanLine): number { return l.want <= 0 ? 0 : Math.max(0, 1 - l.have / l.want); }

  /** The clan whose home is on map m (the biggest one). */
  clanOf(m: number): { name: string; leader: number } | undefined {
    return this.w.clans.clans.filter((c) => c.map === m).sort((a, b) => b.members.length - a.members.length)[0];
  }

  /** One line for the prompts and the panel: "The camp's plan (Ashfall clan, 6 people): food kept 4/18, water kept 0/12 ... Most needed now: water kept." */
  text(m: number): string {
    const p = this.of(m);
    if (!p.people) return '';
    const parts = p.lines.filter((l) => l.want > 0).map((l) => `${WORDS[l.key]} ${l.have}/${l.want}${l.have >= l.want ? ' ✓' : ''}`);
    const who = p.clan ? `the ${p.clan} clan's plan` : "the camp's plan";
    return `${who[0]!.toUpperCase()}${who.slice(1)} (${p.people} people): ${parts.join(', ')}.${p.most ? ` Most needed now: ${WORDS[p.most as PlanLine['key']]}.` : ' Everything is stocked.'}`;
  }

  /** What the leader says about the plan (no AI call). */
  speech(m: number): string {
    const p = this.of(m);
    switch (p.most) {
      case 'water': return 'We have no water put by. Fill bottles at the water and put them in the fridges!';
      case 'food': return 'Our stores are low. Gather food and put it in the fridges and the store for the bad days.';
      case 'homes': return 'Not everyone has a roof. Wood, stone and leather for a new hut!';
      case 'beds': return 'Some of us sleep on the floor: beds for every home.';
      case 'fridges': return 'Every home needs a fridge to keep food and water.';
      case 'chests': return 'A chest in every home, to keep our things safe.';
      case 'wood': case 'stone': return 'Fill the store with wood and stone for repairs and the next hut.';
      default: return 'Our stores are full. Keep them that way.';
    }
  }
}
