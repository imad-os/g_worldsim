// A human "come here" whistle: a rising note then a long falling one, slight vibrato and breath (synthesised, CC0).
import { writeFileSync } from 'node:fs';
const SR = 44100;
function make(seed, notes) {
  let rnd = seed; const r = () => { rnd = (rnd * 16807) % 2147483647; return rnd / 2147483647 * 2 - 1; };
  const total = notes.reduce((a, n) => a + n.d + (n.gap ?? 0), 0.15);
  const out = new Float32Array(Math.ceil(total * SR));
  let t0 = 0.03, ph = 0, lp = 0;
  for (const n of notes) {
    const N = Math.floor(n.d * SR), s0 = Math.floor(t0 * SR);
    for (let k = 0; k < N; k++) {
      const u = k / N;
      const ease = n.shape === 'rise' ? Math.sin(u * Math.PI / 2) : n.shape === 'fall' ? 1 - Math.pow(1 - u, 2) : u;
      const f = n.f0 + (n.f1 - n.f0) * ease + Math.sin(2 * Math.PI * 5.5 * (k / SR)) * 18 * u;
      ph += 2 * Math.PI * f / SR;
      const att = Math.min(1, k / (0.025 * SR)), rel = Math.min(1, (N - k) / (0.06 * SR));
      const env = att * rel * (0.85 + 0.15 * Math.sin(u * Math.PI));
      lp += (r() - lp) * 0.25; // breath: soft filtered noise
      const v = (Math.sin(ph) * 0.9 + Math.sin(2 * ph) * 0.04) * env * 0.55 + lp * env * 0.035;
      out[s0 + k] += v;
    }
    t0 += n.d + (n.gap ?? 0);
  }
  return out;
}
function wav(f32, file) {
  const b = Buffer.alloc(44 + f32.length * 2);
  b.write('RIFF', 0); b.writeUInt32LE(36 + f32.length * 2, 4); b.write('WAVEfmt ', 8); b.writeUInt32LE(16, 16); b.writeUInt16LE(1, 20); b.writeUInt16LE(1, 22);
  b.writeUInt32LE(SR, 24); b.writeUInt32LE(SR * 2, 28); b.writeUInt16LE(2, 32); b.writeUInt16LE(16, 34); b.write('data', 36); b.writeUInt32LE(f32.length * 2, 40);
  for (let i = 0; i < f32.length; i++) b.writeInt16LE(Math.max(-32767, Math.min(32767, Math.round(f32[i] * 32767))), 44 + i * 2);
  writeFileSync(file, b);
}
wav(make(7, [{ f0: 1350, f1: 2350, d: 0.22, shape: 'rise', gap: 0.07 }, { f0: 2450, f1: 1500, d: 0.48, shape: 'fall' }]), 'whistle_1.wav');
wav(make(11, [{ f0: 1500, f1: 2600, d: 0.18, shape: 'rise', gap: 0.05 }, { f0: 2600, f1: 2550, d: 0.12, shape: 'lin', gap: 0.04 }, { f0: 2500, f1: 1450, d: 0.4, shape: 'fall' }]), 'whistle_2.wav');
