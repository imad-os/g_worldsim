/**
 * Conversation log (imad 2026-11-21: "when I open a person I need to see his conversations with others").
 * Memory only, newest 600 lines. Lines come from three places: what people say aloud to someone close
 * (`Planner.say`), chats with players / the owner (`Planner.chat`) and small talk between two people
 * (a `talk` event: a short built-in exchange chosen from their needs, mood and personality, no AI call).
 */
export type Line = { at: number; from: number; to: number; text: string };

export class Convo {
  readonly lines: Line[] = [];
  add(at: number, from: number, to: number, text: string): void {
    const t = text.trim().slice(0, 200); if (!t) return;
    const last = this.lines[this.lines.length - 1];
    if (last && last.from === from && last.to === to && last.text === t && at - last.at < 5) return;
    this.lines.push({ at, from, to, text: t });
    if (this.lines.length > 600) this.lines.splice(0, this.lines.length - 600);
  }
  /** Lines this person spoke or heard, oldest first. */
  of(id: number, n = 80): Line[] {
    const out: Line[] = [];
    for (let k = this.lines.length - 1; k >= 0 && out.length < n; k--) { const l = this.lines[k]!; if (l.from === id || l.to === id) out.push(l); }
    return out.reverse();
  }
}

export type Talker = { hunger: number; thirst: number; tired: number; lonely: number; hp: number; mood: string; courage: number; empathy: number; night: boolean; zombies: boolean };

/** One built-in line from how a person is doing (en; the panel shows it as it is). */
export function smallTalk(a: Talker, pick: (n: number) => number): string {
  const pool: string[] = [];
  if (a.zombies) pool.push('Did you hear them? We should stay close to the fire.', a.courage > 0.6 ? 'Let them come. I will stand at the door.' : 'I am scared. Can we go inside?');
  if (a.thirst > 70) pool.push('I am so thirsty. Do you know where the water is?');
  if (a.hunger > 70) pool.push('I have not eaten in hours. Any berries around?');
  if (a.tired > 70) pool.push(a.night ? 'I can barely keep my eyes open.' : 'I need to rest soon.');
  if (a.lonely > 60) pool.push('It is good to talk to someone.');
  if (a.hp < 40) pool.push('I got hurt. I need to take it easy.');
  if (a.empathy > 0.6) pool.push('How are you holding up?');
  pool.push(a.night ? 'The night is quiet. For now.' : 'Nice day, all things considered.', 'We should build something sturdy before winter.', 'Have you seen anyone new around?', 'We are still here. That is something.');
  return pool[pick(pool.length)]!;
}
