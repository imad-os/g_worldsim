import { BufferGeometry, Float32BufferAttribute, Group, Mesh, MeshLambertMaterial, Color, Vector3 } from 'three';
import { CHUNK_TILES } from '@worldsim/protocol';
import { Shape, hash2, HOME_WALL_H, HOME_WALL_T, type Look } from './look.js';

/**
 * Roofs on huts and houses (imad 2026-11-27: "add roofs; when the character enters, the roof goes see-through from above; in first /
 * third person make it look good without that"). The viewer finds every room from the tiles (no protocol change, and the farms'
 * barns get roofs too): a rectangle of floor (beds, fridges, chests, lamps on it are fine) closed all round by thin hut walls,
 * doors and windows. Each gets a gable roof: shingle rows on the outside, plank boards underneath (the ceiling seen from inside),
 * gable ends closing the triangles, a ridge beam. The ridge runs along the side with the door, so the door is under an eave.
 *
 * From above, the roof of the room I am in fades to ROOF_FADE opacity (imad asked for "0.8": read as 80 % see-through, since a roof at 0.8
 * opacity hides the character inside; screenshots in the thread) and its inside face is hidden. In first person the roof stays: it is the
 * ceiling. In third person the camera comes down under the ceiling and stays inside the room (World3D.room), as games do indoors.
 * One mesh (outer + inner) per roof; rooms are rescanned only when a chunk's tiles change.
 */
export const ROOF_FADE = 0.25;
/** The roof's pitch (rad), eave and gable overhangs (m), thickness (m). */
const PITCH = (32 * Math.PI) / 180, EAVE = 0.45, GABLE = 0.3, THICK = 0.14, MAX_ROOM = 13;

export interface Room {
  /** Outer wall tiles (inclusive). */
  x0: number; y0: number; x1: number; y1: number;
  /** The ridge runs along x (door in the north / south wall) or along y. */
  alongX: boolean;
  /** Height of the walls' top (m): the ceiling. */
  h: number;
  key: string;
  outer: Mesh; inner: Mesh;
}

type TileAt = (x: number, y: number) => number;

export class Roofs {
  readonly group = new Group();
  readonly rooms = new Map<string, Room>();
  private mat = new MeshLambertMaterial({ vertexColors: true });
  private fadeMat = new MeshLambertMaterial({ vertexColors: true, transparent: true, opacity: ROOF_FADE, depthWrite: false });
  private looks: Look[] = [];
  /** The room I am in (null = outside) and how faded its roof is now (1 = solid). */
  mine: Room | null = null;
  private fadeK = 1;
  shadows = true;

  setLooks(l: Look[]): void { this.looks = l; }

  clear(): void { for (const r of [...this.rooms.values()]) this.remove(r); this.mine = null; }

  private remove(r: Room): void {
    this.group.remove(r.outer, r.inner);
    r.outer.geometry.dispose(); r.inner.geometry.dispose();
    this.rooms.delete(r.key);
    if (this.mine === r) this.mine = null;
  }

  /** Chunk (cx, cy) is gone: its roofs too. */
  drop(cx: number, cy: number): void {
    const x0 = cx * CHUNK_TILES, y0 = cy * CHUNK_TILES, x1 = x0 + CHUNK_TILES - 1, y1 = y0 + CHUNK_TILES - 1;
    for (const r of [...this.rooms.values()]) if (r.x1 >= x0 && r.x0 <= x1 && r.y1 >= y0 && r.y0 <= y1) this.remove(r);
  }

  /** Chunk (cx, cy) arrived or its tiles changed: find its rooms again (a tile's margin round it, for rooms across the edge). */
  rescan(cx: number, cy: number, at: TileAt): void {
    const L = this.looks;
    if (!L.length) return;
    const X0 = cx * CHUNK_TILES - 1, Y0 = cy * CHUNK_TILES - 1, X1 = X0 + CHUNK_TILES + 1, Y1 = Y0 + CHUNK_TILES + 1;
    const found = new Set<string>();
    const seen = new Set<number>();
    for (let y = Y0; y <= Y1; y++) for (let x = X0; x <= X1; x++) {
      const k = y * 65536 + x;
      if (seen.has(k)) continue;
      const id = at(x, y);
      if (id < 0 || !isFloor(L[id]!)) continue;
      const room = this.flood(x, y, at, seen);
      if (room) found.add(room.key), this.ensure(room);
    }
    // Rooms that touched this chunk and are no longer there (pulled down, a wall broken).
    for (const r of [...this.rooms.values()]) {
      if (found.has(r.key)) continue;
      if (r.x1 >= X0 && r.x0 <= X1 && r.y1 >= Y0 && r.y0 <= Y1) this.remove(r);
    }
  }

  /** The room whose floor (x, y) is on (metres), or null. */
  roomAt(x: number, y: number): Room | null {
    const tx = Math.floor(x), ty = Math.floor(y);
    for (const r of this.rooms.values()) if (tx > r.x0 && tx < r.x1 && ty > r.y0 && ty < r.y1) return r;
    return null;
  }

  /** Once a frame: I stand at (x, y); from above (top) the roof of my room fades. */
  update(x: number, y: number, top: boolean, dt: number): void {
    const r = this.roomAt(x, y);
    if (r !== this.mine) {
      if (this.mine) this.solid(this.mine);
      this.mine = r;
      this.fadeK = 1;
    }
    if (!r) return;
    const want = top ? ROOF_FADE : 1;
    this.fadeK += (want - this.fadeK) * (1 - Math.exp(-dt * 8));
    if (Math.abs(this.fadeK - want) < 0.005) this.fadeK = want;
    if (this.fadeK > 0.995) { this.solid(r); return; }
    this.fadeMat.opacity = this.fadeK;
    r.outer.material = this.fadeMat;
    r.outer.castShadow = false; // light comes in: the room is seen, not black
    r.inner.visible = false;
    r.outer.renderOrder = 3;
  }
  private solid(r: Room): void {
    r.outer.material = this.mat;
    r.outer.castShadow = this.shadows;
    r.inner.visible = true;
    r.outer.renderOrder = 0;
  }

  /** The room round floor tile (x, y), if it is one: a filled rectangle of floor closed by hut walls / doors / windows. */
  private flood(sx: number, sy: number, at: TileAt, seen: Set<number>): Omit<Room, 'outer' | 'inner'> | null {
    const L = this.looks, stack = [sx, sy];
    let fx0 = sx, fx1 = sx, fy0 = sy, fy1 = sy, n = 0, ok = true;
    seen.add(sy * 65536 + sx);
    while (stack.length) {
      const y = stack.pop()!, x = stack.pop()!;
      n++;
      if (x < fx0) fx0 = x; if (x > fx1) fx1 = x; if (y < fy0) fy0 = y; if (y > fy1) fy1 = y;
      if (fx1 - fx0 > MAX_ROOM || fy1 - fy0 > MAX_ROOM) ok = false;
      if (!ok) continue; // keep marking, so this region is not flooded again from another tile
      for (const [dx, dy] of NB) {
        const X = x + dx, Y = y + dy, k = Y * 65536 + X;
        if (seen.has(k)) continue;
        const id = at(X, Y);
        if (id < 0) { ok = false; continue; }
        const l = L[id]!;
        if (isRing(l)) continue;
        if (!isInside(l)) { ok = false; continue; }
        seen.add(k);
        stack.push(X, Y);
      }
    }
    if (!ok || n !== (fx1 - fx0 + 1) * (fy1 - fy0 + 1) || fx1 - fx0 < 1 || fy1 - fy0 < 1) return null;
    // Closed all round, corners too.
    const x0 = fx0 - 1, y0 = fy0 - 1, x1 = fx1 + 1, y1 = fy1 + 1;
    let door = -1, h = HOME_WALL_H;
    for (let x = x0; x <= x1; x++) for (const y of [y0, y1]) { const r = ringOf(at(x, y)); if (r < 0) return null; if (r === 1 && door < 0) door = y === y0 ? 2 : 0; }
    for (let y = y0 + 1; y < y1; y++) for (const x of [x0, x1]) { const r = ringOf(at(x, y)); if (r < 0) return null; if (r === 1 && door < 0) door = x === x0 ? 3 : 1; }
    for (let x = x0; x <= x1; x++) { const id = at(x, y0); if (L[id]!.shape === Shape.Wall) { h = L[id]!.height; break; } }
    function ringOf(id: number): number { if (id < 0) return -1; const l = L[id]!; return l.shape === Shape.Door ? 1 : isRing(l) ? 0 : -1; }
    // Door in the north / south wall: the ridge runs east-west (the door under an eave); a square room with no door: along the longer side.
    const alongX = door === 0 || door === 2 ? true : door === 1 || door === 3 ? false : x1 - x0 >= y1 - y0;
    return { x0, y0, x1, y1, alongX, h, key: `${x0},${y0},${x1},${y1},${alongX ? 1 : 0}` };
  }

  private ensure(r: Omit<Room, 'outer' | 'inner'>): void {
    if (this.rooms.has(r.key)) return;
    // A room that overlaps one already drawn replaced it (rebuilt bigger / smaller).
    for (const o of [...this.rooms.values()]) if (o.x1 >= r.x0 && o.x0 <= r.x1 && o.y1 >= r.y0 && o.y0 <= r.y1) this.remove(o);
    const [outer, inner] = roofGeo(r);
    const room: Room = { ...r, outer: new Mesh(outer, this.mat), inner: new Mesh(inner, this.mat) };
    room.outer.castShadow = this.shadows; room.outer.receiveShadow = this.shadows; room.inner.receiveShadow = this.shadows;
    this.group.add(room.outer, room.inner);
    this.rooms.set(r.key, room);
  }
}

const NB = [[1, 0], [-1, 0], [0, 1], [0, -1]] as const;
const FLOOR = 0xb08a5f;
function isFloor(l: Look): boolean { return l.shape === Shape.Ground && l.ground === FLOOR; }
function isRing(l: Look): boolean { return (l.shape === Shape.Wall && !!l.thin) || l.shape === Shape.Door || l.shape === Shape.Window; }
/** What can stand on a room's floor. */
function isInside(l: Look): boolean {
  return isFloor(l) || l.shape === Shape.Bed || l.shape === Shape.Fridge || l.shape === Shape.Chest || l.shape === Shape.Lamp || l.shape === Shape.Fire || l.shape === Shape.Ashes;
}

// ------------------------------------------------------------------ geometry
const SHINGLE = [new Color(0x9a5f3e), new Color(0xa86a45), new Color(0x8e5739)];
const UNDER = new Color(0x9a7248), GABLE_OUT = new Color(0x7a5432), RIDGE = new Color(0x4f3322), FASCIA = new Color(0x5a3b26);
const va = new Vector3(), vb = new Vector3(), vn = new Vector3();

class Geo {
  p: number[] = []; n: number[] = []; c: number[] = [];
  /** A flat polygon (3 or 4 points, [x, y, z] each) facing `want` (the winding is fixed to match), coloured c x k per point. */
  face(pts: number[][], want: [number, number, number], c: Color, k: number[] = [1, 1, 1, 1]): void {
    const [a, b, d] = pts as [number[], number[], number[]];
    va.set(b[0]! - a[0]!, b[1]! - a[1]!, b[2]! - a[2]!); vb.set(d[0]! - a[0]!, d[1]! - a[1]!, d[2]! - a[2]!);
    vn.crossVectors(va, vb).normalize();
    let P = pts, K = k;
    if (vn.x * want[0] + vn.y * want[1] + vn.z * want[2] < 0) { P = [...pts].reverse(); K = [...k.slice(0, pts.length)].reverse(); vn.negate(); }
    const tri = P.length === 3 ? [0, 1, 2] : [0, 1, 2, 0, 2, 3];
    for (const i of tri) { const q = P[i]!; this.p.push(q[0]!, q[1]!, q[2]!); this.n.push(vn.x, vn.y, vn.z); const s = K[i] ?? 1; this.c.push(c.r * s, c.g * s, c.b * s); }
  }
  geo(): BufferGeometry {
    const g = new BufferGeometry();
    g.setAttribute('position', new Float32BufferAttribute(this.p, 3));
    g.setAttribute('normal', new Float32BufferAttribute(this.n, 3));
    g.setAttribute('color', new Float32BufferAttribute(this.c, 3));
    g.computeBoundingSphere();
    return g;
  }
}

/**
 * The roof of room r as [outer, inner] meshes. Worked out in the ridge's frame (u along the ridge, v across it) and turned into
 * world x / z at the end. Wall lines are the middles of the wall tiles.
 */
function roofGeo(r: Omit<Room, 'outer' | 'inner'>): [BufferGeometry, BufferGeometry] {
  const out = new Geo(), inn = new Geo();
  const u0 = (r.alongX ? r.x0 : r.y0) + 0.5, u1 = (r.alongX ? r.x1 : r.y1) + 0.5;
  const v0 = (r.alongX ? r.y0 : r.x0) + 0.5, v1 = (r.alongX ? r.y1 : r.x1) + 0.5;
  const half = (v1 - v0) / 2, vm = (v0 + v1) / 2, tan = Math.tan(PITCH), H = r.h;
  const ridge = H + half * tan, eaveY = H - EAVE * tan, U0 = u0 - GABLE, U1 = u1 + GABLE;
  // (u, y, v) -> world [x, y, z].
  const W = (u: number, y: number, v: number): number[] => (r.alongX ? [u, y, v] : [v, y, u]);
  const N = (nu: number, ny: number, nv: number): [number, number, number] => (r.alongX ? [nu, ny, nv] : [nv, ny, nu]);
  const seed = hash2(r.x0 * 7 + r.y1, r.y0 * 3 + r.x1);
  for (const side of [-1, 1]) {
    // Slope from the eave (v = edge -/+ EAVE) up to the ridge (vm): shingle rows, each a little darker at its lower edge.
    const vE = side < 0 ? v0 - EAVE : v1 + EAVE, len = Math.abs(vm - vE), rows = Math.max(3, Math.round(len / 0.42));
    const nY = Math.cos(PITCH), nV = side * Math.sin(PITCH);
    for (let k = 0; k < rows; k++) {
      const a = k / rows, b = (k + 1) / rows;
      const va0 = vE + (vm - vE) * a, vb0 = vE + (vm - vE) * b, ya = eaveY + (ridge - eaveY) * a, yb = eaveY + (ridge - eaveY) * b;
      const c = SHINGLE[(k + Math.floor(seed * 3)) % 3]!;
      // Rows overlap a little: the lower edge of each row sits a few cm proud of the one under it.
      const lift = 0.035;
      out.face([W(U0, ya + lift, va0), W(U1, ya + lift, va0), W(U1, yb, vb0), W(U0, yb, vb0)], N(0, nY, nV), c, [0.78, 0.78, 1, 1]);
      if (k > 0) out.face([W(U0, ya, va0), W(U1, ya, va0), W(U1, ya + lift, va0), W(U0, ya + lift, va0)], N(0, -nV * 0.2, side), c, [0.55, 0.55, 0.65, 0.65]);
    }
    // Underneath: plank boards (the ceiling), THICK below the shingles.
    const boards = Math.max(4, Math.round(len / 0.3));
    for (let k = 0; k < boards; k++) {
      const a = k / boards, b = (k + 1) / boards;
      const va0 = vE + (vm - vE) * a, vb0 = vE + (vm - vE) * b, ya = eaveY + (ridge - eaveY) * a - THICK, yb = eaveY + (ridge - eaveY) * b - THICK;
      const s = k & 1 ? 0.88 : 1;
      inn.face([W(U0, ya, va0), W(U1, ya, va0), W(U1, yb, vb0), W(U0, yb, vb0)], N(0, -nY, -nV), UNDER, [s, s, s * 0.92, s * 0.92]);
    }
    // The fascia board along the eave, and the edge at each gable end.
    out.face([W(U0, eaveY - THICK, vE), W(U1, eaveY - THICK, vE), W(U1, eaveY + 0.035, vE), W(U0, eaveY + 0.035, vE)], N(0, 0, side), FASCIA);
    for (const [u, su] of [[U0, -1], [U1, 1]] as const) {
      out.face([W(u, eaveY - THICK, vE), W(u, eaveY + 0.035, vE), W(u, ridge + 0.035, vm), W(u, ridge - THICK, vm)], N(su, 0, 0), FASCIA);
    }
    // Rafter ends under the eave (a beam every 1.2 m): shadowed lines that read as a built roof.
    for (let u = u0; u <= u1 + 0.01; u += (u1 - u0) / Math.max(2, Math.round((u1 - u0) / 1.2))) {
      const vi = side < 0 ? v0 : v1;
      inn.face([W(u - 0.06, H - 0.02, vi), W(u + 0.06, H - 0.02, vi), W(u + 0.06, eaveY - THICK, vE), W(u - 0.06, eaveY - THICK, vE)], N(0, -1, 0), FASCIA);
    }
  }
  // Ridge beam on top.
  const rb = 0.09;
  out.face([W(U0 - 0.05, ridge + 0.03, vm - rb), W(U1 + 0.05, ridge + 0.03, vm - rb), W(U1 + 0.05, ridge + 0.14, vm), W(U0 - 0.05, ridge + 0.14, vm)], N(0, 0.6, -0.8), RIDGE);
  out.face([W(U0 - 0.05, ridge + 0.03, vm + rb), W(U1 + 0.05, ridge + 0.03, vm + rb), W(U1 + 0.05, ridge + 0.14, vm), W(U0 - 0.05, ridge + 0.14, vm)], N(0, 0.6, 0.8), RIDGE);
  // Gable ends: the wall goes on up into the triangle under the roof, planks outside and in.
  const t2 = HOME_WALL_T / 2;
  for (const [u, su] of [[u0, -1], [u1, 1]] as const) {
    const rows = 4, top = ridge - THICK;
    for (let k = 0; k < rows; k++) {
      const ya = H + ((top - H) * k) / rows, yb = H + ((top - H) * (k + 1)) / rows;
      const wa = half * (1 - (ya - H) / (top - H)), wb = half * (1 - (yb - H) / (top - H));
      const s = k & 1 ? 0.9 : 1;
      const quad = (uu: number, g: Geo, n: number, c: Color) => g.face(wb > 0.01
        ? [W(uu, ya, vm - wa), W(uu, ya, vm + wa), W(uu, yb, vm + wb), W(uu, yb, vm - wb)]
        : [W(uu, ya, vm - wa), W(uu, ya, vm + wa), W(uu, yb, vm)], N(n, 0, 0), c, [s, s, s * 0.95, s * 0.95]);
      quad(u + su * t2, out, su, GABLE_OUT);
      quad(u - su * t2, inn, -su, UNDER);
    }
  }
  return [out.geo(), inn.geo()];
}
