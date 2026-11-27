import { Kind, packLook, unpackLook, defaultLook, lookFromOld } from '@worldsim/protocol';
import type { World } from './world.js';
import type { Profile } from './people.js';

/**
 * How someone looks, as the packed code of protocol look.ts (imad 2026-11-27: "better bodies, better customisation, hair").
 * No dice: people who never chose get a look from a hash of their id, their sex, age (beard from 18, grey from 55), strength
 * (build) and their parents (skin tone and, mostly, hair colour). Players' characters use what they chose on the TV.
 */
export function lookCode(w: World, i: number): number {
  const e = w.e, k = e.kind[i];
  if (k === Kind.Npc) return packLook(lookFromOld(e.sub[i]!, e.id(i) * 7 + 3));
  if (k !== Kind.Agent && k !== Kind.Player) return 0;
  const id = e.id(i), p = w.profileOf(i);
  if (!p) return packLook(lookFromOld(e.sub[i]! || 2, id));
  return profileLook(w, id, p, 3);
}

export function profileLook(w: World, id: number, p: Profile, depth: number): number {
  const age = (w.gameSec - p.born) / Math.max(1, w.yearSec), woman = p.sex === 'f';
  let skin = p.skin ?? -1, parentHair = -1;
  if (depth > 0) for (const pid of p.parents) {
    const pp = w.profiles.get(pid);
    if (!pp) continue;
    const pl = unpackLook(profileLook(w, pid, pp, depth - 1));
    if (skin < 0) skin = pl.skin; // the first parent known (mother first) gives the skin tone
    if (parentHair < 0) parentHair = pl.hairColour;
  }
  const d = defaultLook(id, woman, p.player ? 25 : age, p.traits.strength, skin, parentHair);
  const own = p.player ? p.look : undefined;
  if (own) Object.assign(d, { hair: own.hair, hairColour: own.hairColour, build: own.build, top: own.top, pants: own.pants, beard: woman ? 0 : own.beard });
  return packLook(d);
}
