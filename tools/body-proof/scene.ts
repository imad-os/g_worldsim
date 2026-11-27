// People's bodies, looks and moves without a server (imad 2026-11-27): node tools/body-proof/run.mjs <outdir>
import { World3D } from '../../packages/client/src/gfx/world3d.js';
import { loadItems } from '../../packages/client/src/gfx/items.js';
import { packGear } from '../../packages/protocol/src/gear.js';
import { packLook, unpackLook, SKIN_TONES, HAIR_COLOURS, TOP_COLOURS, PANTS_COLOURS, type LookParts } from '../../packages/protocol/src/look.js';
import { Color } from 'three';
import type { PersonLook } from '../../packages/client/src/gfx/people.js';
const C = (h: number) => new Color(h);
const lookOf = (l: Partial<LookParts>): PersonLook => {
  const p = unpackLook(packLook({ skin: 1, woman: false, hair: 0, hairColour: 1, build: 1, top: 2, pants: 0, beard: 0, elder: false, ...l }));
  return { tunic: C(TOP_COLOURS[p.top]!), skin: C(SKIN_TONES[p.skin]!), hair: C(HAIR_COLOURS[p.hairColour]!), pants: C(PANTS_COLOURS[p.pants]!), woman: p.woman, hairStyle: p.hair, beard: p.beard, build: p.build, elder: p.elder };
};
const canvas = document.querySelector('canvas')!;
const g3 = new World3D(canvas, 'high');
g3.resize(innerWidth, innerHeight);
interface Who { x: number; z: number; f: number; ph?: number; amp?: number; look: Partial<LookParts>; gear?: Record<string, unknown>; at?: number; seat?: boolean; horseSpeed?: number; size?: number; zed?: boolean; lie?: number }
let t = 0;
(window as any).draw = (people: Who[], cam: { x: number; y: number; z: number; tx: number; ty: number; tz: number }, dt = 0.016) => {
  t += dt;
  g3.view = 'third'; g3.follow(cam.tx, cam.tz, dt, true); g3.setHour(11, t);
  g3.camera.position.set(cam.x, cam.y, cam.z); g3.camera.lookAt(cam.tx, cam.ty, cam.tz);
  const pp = g3.people; pp.begin(); g3.horses.begin();
  people.forEach((p, k) => {
    const g = p.gear ?? {};
    const code = packGear({ held: (g.held as string) ?? '', hq: (g.hq as number) ?? 0, helmet: !!g.helmet, headQ: 0, body: (g.body as any) ?? '', bodyQ: 0, anim: (g.anim as any) ?? '', seq: (g.seq as number) ?? 0, back: !!g.back, aim: !!g.aim });
    let seat = 0, st = { g: 0, gp: 0, w: 0, wp: 0 };
    if (p.seat && g3.horses.ready) {
      g3.horses.add(100 + k, p.x, p.z, p.f, p.horseSpeed ?? 0, 0, 1, 0, k % 8, true, t, dt);
      seat = g3.horses.seat(1) + g3.horses.bounce(100 + k, 1);
      const s = g3.horses.strideOf(100 + k); st = { ...s };
    }
    pp.add(p.x, p.z, p.f, p.ph ?? 0, p.amp ?? 0, lookOf(p.look), p.lie ?? false, p.size ?? 1, !!p.zed, code, p.at ?? 0, seat, 0, false, k + 1, st.g, st.gp, st.w, st.wp);
  });
  pp.end(); g3.horses.end();
  g3.render();
};
(window as any).ready = Promise.all([loadItems(), g3.horses.load('models/horse.glb')]);
(window as any).bench = () => {
  const pp = g3.people, L = { tunic: new Color(0x445566), skin: new Color(0xe0ac82), hair: new Color(0x332211), pants: new Color(0x333333), hairStyle: 4, woman: true, build: 1 };
  const t0 = performance.now(); let n = 0;
  for (let f = 0; f < 200; f++) { pp.begin(); for (let k = 0; k < 100; k++) { pp.add(k % 10, (k / 10) | 0, 0, f * 0.2 + k, 0.7, L as any, false, 1, false, 0, 0, 0, 0, false, k); n++; } pp.end(); }
  const us = ((performance.now() - t0) * 1000) / n;
  g3.renderer.info.reset(); g3.render();
  return { usPerPerson: us, calls: g3.renderer.info.render.calls, tris: g3.renderer.info.render.triangles };
};
