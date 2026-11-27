import { Act } from '@worldsim/protocol';
import type { World } from './world.js';

/**
 * "Why now" (flag `aware`): the reason behind what a person does, where it is not plain from their state (a task, an
 * order, a need). The brain notes it with a small code when it chooses for a reason of its own (`Brain.why`), and
 * `World.why(i)` turns it into words for the panel's Thoughts screen (ops/thoughts.ts) and the AI prompts.
 * Drivers use the Thoughts screen's words: danger | order | rule | asked | own | plan | need | social | work | travel | idle.
 */
export const Why = {
  None: 0,
  /** Evening by the camp's fire with the others. */
  Evening: 1,
  /** Went to talk with someone (arg = entity id). */
  Talk: 2,
  /** Kept sleeping: the night is not over (their own rhythm). */
  SleepIn: 3,
  /** Kept away from a danger they saw or were told about. */
  Avoid: 4,
  /** On the alert: a danger seen near lately. */
  Alert: 5,
  /** Went for the game someone told them about. */
  Game: 6,
  /** A rule kept them from what they would have done (e.g. "never stay at home"). */
  Rule: 7,
} as const;
export type WhyCode = (typeof Why)[keyof typeof Why];
export interface WhyNow { src: string; text: string; at: number }

/** The act each code belongs to: the note counts only while they still do it. */
const ACT_OF: Record<number, number> = { [Why.Evening]: Act.Rest, [Why.Talk]: Act.Talk, [Why.SleepIn]: Act.Sleep };

export function whyOf(w: World, i: number): WhyNow | null {
  if (w.ai.aware === false) return null;
  const b = w.brain, code = b.whyCode[i]!, at = b.whyAt[i]!, arg = b.whyArg[i]!, e = w.e;
  if (!code || w.gameSec - at > 3 * 3600) return null;
  const act = ACT_OF[code];
  if (act !== undefined && e.act[i] !== act) return null;
  const name = (id: number) => w.profiles.get(id)?.name ?? 'someone';
  switch (code) {
    case Why.Evening: return { src: 'social', text: 'the evening: sitting by the fire with the others', at };
    case Why.Talk: {
      const n = w.talk.last.a === e.id(i) || w.talk.last.b === e.id(i) ? w.talk.last.n : 0;
      return { src: 'social', text: `talking with ${name(arg)}${n ? ' (passing on news and what they know)' : ''}`, at };
    }
    case Why.SleepIn: return { src: 'need', text: 'night time: sleeping until morning', at };
    case Why.Avoid: return { src: 'danger', text: 'keeping away from a danger seen or told about', at };
    case Why.Alert: return { src: 'danger', text: 'on the alert: danger was seen near lately', at };
    case Why.Rule: return { src: 'rule', text: 'a rule keeps them out of their home: resting elsewhere', at };
    case Why.Game: return { src: 'own', text: `going after game ${arg >= 0 ? name(arg) + ' told them about' : 'seen lately'}`, at };
  }
  return null;
}
