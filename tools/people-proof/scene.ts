import { World3D } from '../../packages/client/src/gfx/world3d.js';
import { loadItems } from '../../packages/client/src/gfx/items.js';
import { packGear } from '../../packages/protocol/src/gear.js';
import { Color } from 'three';
const C = (h: number) => new Color(h);
const look = { tunic: C(0x2fa36b), skin: C(0xe8b890), hair: C(0x3a2416), pants: C(0x3a3f5a) };
const canvas = document.querySelector('canvas')!;
const g3 = new World3D(canvas, 'mid');
g3.resize(innerWidth, innerHeight);
(window as any).g3 = g3;
const P = [
  { held: 'sword', hq: 0, anim: 'attack', helmet: true, body: 'armor' },
  { held: 'axe', hq: 1, anim: 'chop', body: 'clothes' },
  { held: '', hq: 0, anim: 'mine' },
  { held: 'spear', hq: 2, anim: 'build', helmet: true },
  { held: 'sword', hq: 4, anim: 'talk', body: 'armor', back: true },
  { held: 'bow', hq: 3, anim: 'shoot', body: 'clothes' },
  { held: 'bow', hq: 2, anim: 'shoot', aim: true }, // aiming: the bow drawn and held
  { held: 'sword', hq: 4, anim: '', helmet: true, headQ: 4, body: 'armor', bodyQ: 4 },
] as const;
(window as any).draw = (t: number, frac: number) => {
  g3.dist = 19; g3.follow(4.5, 2.6, 0.016, true); g3.setHour(12, t);
  const pp = g3.people; pp.begin();
  P.forEach((p, k) => {
    const code = packGear({ held: p.held, hq: p.hq, helmet: !!(p as any).helmet, headQ: (p as any).headQ ?? 0, body: (p as any).body ?? '', bodyQ: (p as any).bodyQ ?? 0, anim: p.anim as any, seq: 0, back: !!(p as any).back, aim: !!(p as any).aim });
    pp.add((k % 4) * 3, Math.floor(k / 4) * 3.2, (k % 2 ? 0.6 : -0.5), 0, 0, look, false, 1, false, code, frac);
  });
  pp.end();
  // Killed animals at different moments of the fall (rabbit, deer, boar, wolf, bear).
  const an = g3.animals; an.begin();
  [0.1, 0.35, 0.7, 1.2, 3.4].forEach((age, k) => an.add(k, k * 2.4 - 1, 5.6, 0.5, 0, 0, age + frac * 0));
  an.add(1, 11, 5.6, 0.5, 0, 0); // a deer alive, for comparison
  an.end();
  g3.render();
};
(window as any).ready = loadItems();
