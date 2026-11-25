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
  { held: 'spear', hq: 0, anim: '' , back: true},
  { held: 'sword', hq: 4, anim: '', helmet: true, headQ: 4, body: 'armor', bodyQ: 4 },
] as const;
(window as any).draw = (t: number, frac: number) => {
  g3.dist = 17; g3.follow(4.5, 1.6, 0.016, true); g3.setHour(12, t);
  const pp = g3.people; pp.begin();
  P.forEach((p, k) => {
    const code = packGear({ held: p.held, hq: p.hq, helmet: !!(p as any).helmet, headQ: (p as any).headQ ?? 0, body: (p as any).body ?? '', bodyQ: (p as any).bodyQ ?? 0, anim: p.anim as any, seq: 0, back: !!(p as any).back });
    pp.add((k % 4) * 3, Math.floor(k / 4) * 3.2, (k % 2 ? 0.6 : -0.5), 0, 0, look, false, 1, false, code, frac);
  });
  pp.end(); g3.render();
};
(window as any).ready = loadItems();
