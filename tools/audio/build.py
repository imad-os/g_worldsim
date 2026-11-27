#!/usr/bin/env python3
"""Cut, level and encode the game's ambience, horse, animal and weather sounds (imad 2026-11-27: "make the audio waaay better").

Sources: tools/audio/fetch.sh (open licences, pinned commits) -> .cache/audio/. Output: docs/audio/<cat>/<name>.ogg.
Needs ffmpeg and numpy. Run from the repo root: python3 -I tools/audio/build.py

Loops are long (45-80 s) and are played by two players that crossfade (packages/client/src/audio.ts), each pass
from a random place, so no seam and no audible repeat. Fire is stitched from nine different crackle takes.
Wolf howls and deer calls are synthesised here (CC0, no good free recordings found).
"""
import os, subprocess, sys
import numpy as np

SR = 44100
ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
SRC = os.path.join(ROOT, '.cache', 'audio')
OUT = os.path.join(ROOT, 'docs', 'audio')
rng = np.random.default_rng(20261127)
Z = 'zad/binaries/data/mods/public/audio/'
M = 'meta/corpora/oculus-audio-pack/ogg/'


def load(rel, ch=1, af=None, ss=None, t=None):
    cmd = ['ffmpeg', '-v', 'error']
    if ss is not None: cmd += ['-ss', str(ss)]
    if t is not None: cmd += ['-t', str(t)]
    cmd += ['-i', os.path.join(SRC, rel)]
    if af: cmd += ['-af', af]
    cmd += ['-ac', str(ch), '-ar', str(SR), '-f', 'f32le', '-']
    x = np.frombuffer(subprocess.run(cmd, check=True, capture_output=True).stdout, dtype=np.float32).copy()
    return x.reshape(-1, ch) if ch > 1 else x


def save(x, name, q=3):
    path = os.path.join(OUT, name)
    os.makedirs(os.path.dirname(path), exist_ok=True)
    ch = 1 if x.ndim == 1 else x.shape[1]
    x = np.clip(x, -1, 1).astype(np.float32)
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-f', 'f32le', '-ac', str(ch), '-ar', str(SR), '-i', '-',
                    '-c:a', 'libvorbis', '-q:a', str(q), path], input=x.tobytes(), check=True)
    print(f'{name:38s} {len(x) / SR:6.1f} s  {os.path.getsize(path) // 1024:5d} kB')


def rms(x): return float(np.sqrt(np.mean(np.square(x)) + 1e-12))


def level(x, db_rms=None, peak_db=-1.0):
    """Loudness to a target RMS (beds sit at the same level, so the manifest gains mean something), peak never above peak_db."""
    if db_rms is not None: x = x * (10 ** (db_rms / 20) / rms(x))
    p = float(np.max(np.abs(x))) + 1e-9
    lim = 10 ** (peak_db / 20)
    if p > lim:  # soft knee: squash only the rare peaks of a bed, never the whole thing
        x = np.where(np.abs(x) > lim * 0.7, np.sign(x) * (lim * 0.7 + (lim * 0.3) * np.tanh((np.abs(x) - lim * 0.7) / (lim * 0.3))), x)
    return x


def fade(x, a=0.005, b=0.02):
    x = x.copy(); n = len(x)
    ia, ib = min(n, int(a * SR)), min(n, int(b * SR))
    if ia: x[:ia] = (x[:ia].T * np.linspace(0, 1, ia)).T
    if ib: x[n - ib:] = (x[n - ib:].T * np.linspace(1, 0, ib)).T
    return x


def xjoin(parts, xf=0.8):
    """Join takes end to start with equal-power crossfades."""
    n = int(xf * SR); out = parts[0]
    for p in parts[1:]:
        t = np.linspace(0, np.pi / 2, n)
        a, b = np.cos(t), np.sin(t)
        if out.ndim > 1: a, b = a[:, None], b[:, None]
        out = np.concatenate([out[:-n], out[-n:] * a + p[:n] * b, p[n:]])
    return out


def trim(x, thr_db=-45, pre=0.01, post=0.08):
    """Cut the silence before / after a one-shot."""
    m = np.abs(x if x.ndim == 1 else x.mean(axis=1))
    idx = np.where(m > 10 ** (thr_db / 20) * m.max())[0]
    if not len(idx): return x
    return x[max(0, idx[0] - int(pre * SR)): min(len(x), idx[-1] + int(post * SR))]


def onsets(x, thr=0.25, gap=0.05):
    env = np.convolve(np.abs(x), np.ones(64) / 64, mode='same')
    hi = env > thr * env.max(); out = []; last = -1e9
    for i in np.where(hi[1:] & ~hi[:-1])[0]:
        if i - last > gap * SR: out.append(i); last = i
    return out


# ---------------------------------------------------------------- beds (loops)
def beds():
    # Town by day: a quiet forest edge with birds (felix.blume, CC0), 80 s.
    save(level(load('omarchy/sounds/birds.ogg', 2, 'highpass=f=90', ss=15, t=80), -27), 'ambience/amb_day.ogg')
    # The woods by day: Oculus forest loop (CC BY 4.0), 59 s.
    save(level(load(M + 'AMBForst_Forest_LOOP_01.ogg', 2, 'highpass=f=60'), -26), 'ambience/amb_woods.ogg')
    # Night: crickets close by (felix.blume, CC0), 80 s from the middle (no engine drone).
    save(level(load('omarchy/sounds/crickets.ogg', 2, 'highpass=f=120', ss=40, t=80), -28), 'ambience/amb_night.ogg')
    # The woods at night: Oculus forest night (CC BY 4.0), 45 s.
    save(level(load(M + 'AMBForst_Night_LOOP_01.ogg', 2, 'highpass=f=60'), -27), 'ambience/amb_night_woods.ogg')
    # Rain: soft rain on a roof (richwise, CC0), 80 s; heavy rain in the leaves for storms (Oculus).
    save(level(load('omarchy/sounds/rain.ogg', 2, 'highpass=f=80', ss=30, t=80), -24), 'ambience/rain_loop.ogg')
    save(level(load(M + 'RAINVege_ForestRain_LOOP_01.ogg', 2, 'highpass=f=70'), -23), 'ambience/rain_heavy.ogg')
    # Wind in bushes (felix.blume, CC0), 80 s; a snow storm (0 A.D., CC BY-SA) for blizzards.
    save(level(load('omarchy/sounds/wind.ogg', 2, 'highpass=f=50', ss=20, t=80), -25), 'ambience/wind_loop.ogg')
    save(level(load(Z + 'ambient/weather/snowstorm_11.ogg', 2, 'highpass=f=50', ss=10, t=80), -24), 'ambience/blizzard_loop.ogg')
    # A campfire: nine different crackle takes (0 A.D., CC BY-SA), each used twice in a different order, crossfaded: 70 s
    # with no repeat you can hear. Warm low end kept, hiss above 9 kHz rolled off.
    takes = [load(Z + f'attack/fire/c_{i}.ogg', 1, 'highpass=f=45,lowpass=f=9000') for i in range(11, 20)]
    order = list(rng.permutation(9)) + list(rng.permutation(9))
    parts = []
    for k in order:
        t = takes[k]
        parts.append(t * (0.85 + 0.3 * rng.random()))
    save(level(xjoin(parts, 1.2), -22), 'ambience/fire_loop.ogg', q=4)


# ---------------------------------------------------------------- one-shots
def shots():
    # Fire pops: the loudest moments of the sizzle / spread takes, short, for layering near a campfire.
    pops = []
    for i in list(range(11, 16)):
        x = load(Z + f'attack/fire/sz{i}.ogg', 1, 'highpass=f=300')
        env = np.convolve(np.abs(x), np.ones(256) / 256, mode='same')
        c = int(np.argmax(env)); a = max(0, c - int(0.05 * SR))
        pops.append(fade(level(x[a:a + int(0.7 * SR)], None, -3), 0.003, 0.25))
    for j, p in enumerate(pops[:4]): save(p, f'ambience/fire_pop_{j + 1}.ogg')
    # Thunder (0 A.D.), mono, 9 s.
    for j, i in enumerate((10, 11)):
        save(fade(level(trim(load(Z + f'ambient/weather/thunder_{i}.ogg', 1, 'highpass=f=30'))[: 9 * SR], None, -1), 0.01, 2.0), f'ambience/thunder_{j + 1}.ogg')
    g = load(Z + 'ambient/weather/windgust_11.ogg', 1, 'highpass=f=60')
    save(fade(level(g, None, -2), 0.4, 1.2), 'ambience/wind_gust_1.ogg')
    save(fade(level(g[::-1].copy(), None, -2), 0.6, 1.0), 'ambience/wind_gust_2.ogg')
    # Owl: each hoot of the take on its own (breviceps, CC0).
    o = load('freesfx/Freesound/Animals/465697__breviceps__owl-hoot.opus', 1, 'highpass=f=150')
    on = onsets(o, 0.3, 0.6)
    cuts = [o[max(0, a - 400): (on[k + 1] - 400 if k + 1 < len(on) else len(o))] for k, a in enumerate(on)]
    cuts = [c for c in cuts if len(c) > 0.3 * SR] or [o]
    for j, c in enumerate(cuts[:3]): save(fade(level(trim(c), None, -2), 0.004, 0.3), f'animal/owl_{j + 1}.ogg')


# ---------------------------------------------------------------- horses
def horses():
    # 0 A.D. cavalry steps (CC BY-SA): each take = three gallop strides. One stride = one 'gallop' sound;
    # single hoof beats (the first hit of a stride) for walk and trot.
    strides, beats = [], []
    for i in range(110, 116):
        x = load(Z + f'actor/mounted/movement/mstep{i}.ogg', 1, 'highpass=f=70')
        on = onsets(x, 0.2, 0.09)
        groups = [on[0]] if on else []
        for a in on[1:]:
            if a - groups[-1] > 0.3 * SR: groups.append(a)
        for k, a in enumerate(groups):
            b = groups[k + 1] if k + 1 < len(groups) else len(x)
            s = x[max(0, a - 220): min(b - 220, a + int(0.45 * SR))]
            if len(s) > 0.15 * SR: strides.append(fade(level(s, None, -2), 0.002, 0.08))
            beats.append(fade(level(x[max(0, a - 120): a + int(0.11 * SR)], None, -2), 0.001, 0.05))
    pick = [strides[k] for k in rng.choice(len(strides), size=min(6, len(strides)), replace=False)]
    for j, s in enumerate(pick): save(s, f'animal/gallop_{j + 1}.ogg')
    pick = [beats[k] for k in rng.choice(len(beats), size=min(8, len(beats)), replace=False)]
    for j, s in enumerate(pick): save(s, f'animal/hoof_{j + 1}.ogg')
    # Neighs (Oculus CC BY 4.0, 0 A.D.) and snorts (0 A.D. idle).
    n = [load(M + 'ANMLHors_HorseNeigh_OS_01.ogg'), load(M + 'ANMLHors_HorseNeighAmbient_OS_01.ogg'),
         load(Z + 'actor/fauna/animal/horse_select1.ogg'), load(Z + 'actor/fauna/animal/horse_select2.ogg')]
    for j, x in enumerate(n): save(fade(level(trim(x), None, -1), 0.003, 0.15), f'animal/horse_{j + 1}.ogg')
    for j, i in enumerate((1, 2, 3)):
        save(fade(level(trim(load(Z + f'actor/fauna/animal/horse_idle{i}.ogg')), None, -2), 0.003, 0.15), f'animal/horse_snort_{j + 1}.ogg')


# ---------------------------------------------------------------- animals
def animals():
    # Boar: pig grunts pitched down (a wild boar is deeper), squeals for the charge.
    gr = [load(Z + 'actor/fauna/animal/pig_10.ogg', 1, 'asetrate=44100*0.84,aresample=44100'),
          load(Z + 'actor/fauna/animal/pig_12.ogg', 1, 'asetrate=44100*0.8,aresample=44100'),
          load(Z + 'actor/fauna/animal/pig_10.ogg', 1, 'asetrate=44100*0.76,aresample=44100,areverse')]
    for j, x in enumerate(gr[:2]): save(fade(level(trim(x), None, -2), 0.004, 0.12), f'animal/boar_{j + 1}.ogg')
    sq = [load(M + 'ANMLFarm_PigSqueal_OS_01.ogg', 1, 'asetrate=44100*0.88,aresample=44100'),
          load(Z + 'actor/fauna/animal/pig_squeal_move.ogg', 1, 'asetrate=44100*0.86,aresample=44100')]
    for j, x in enumerate(sq): save(fade(level(trim(x), None, -1), 0.002, 0.1), f'animal/boar_attack_{j + 2}.ogg')
    # Bear: deep growls (CC0 growl and 0 A.D. big-cat calls, pitched well down: a bear is lower and rounder).
    b = [load('freesfx/Freesound/Animals/516829__matrixxx__lion-growl.opus', 1, 'asetrate=44100*0.78,aresample=44100,lowpass=f=3500'),
         load(Z + 'actor/fauna/attack/lion1.ogg', 1, 'asetrate=44100*0.72,aresample=44100,lowpass=f=3000'),
         load(Z + 'actor/fauna/attack/lion3.ogg', 1, 'asetrate=44100*0.7,aresample=44100,lowpass=f=3000')]
    for j, x in enumerate(b): save(fade(level(trim(x), None, -1), 0.005, 0.3), f'animal/bear_roar_{j + 3}.ogg')
    # Wolves howl far away at night; deer give an alarm snort and a soft bleat.
    for j, (f0, peak, dur, seed) in enumerate([(420, 610, 3.2, 1), (470, 700, 2.6, 2), (380, 560, 3.8, 3)]):
        save(howl(f0, peak, dur, seed), f'animal/wolf_howl_{j + 1}.ogg')
    save(snort(1), 'animal/deer_1.ogg'); save(snort(2, double=True), 'animal/deer_2.ogg'); save(bleat(3), 'animal/deer_3.ogg')


def reverb(x, secs=1.6, wet=0.35, seed=0):
    r = np.random.default_rng(seed)
    n = int(secs * SR); t = np.arange(n) / SR
    ir = r.standard_normal(n) * np.exp(-t * 6.9 / secs)
    ir = np.convolve(ir, np.ones(8) / 8, mode='same'); ir[:int(0.012 * SR)] = 0
    ir /= np.sqrt(np.sum(ir ** 2))
    y = np.convolve(np.concatenate([x, np.zeros(n)]), ir)[: len(x) + n]
    return np.concatenate([x, np.zeros(n)]) * (1 - wet) + y * wet


def howl(f0, peak, dur, seed):
    """A wolf howl: a near-pure voice that slides up, holds with a slow waver and falls away, a little breath, heard over a valley."""
    r = np.random.default_rng(seed)
    n = int(dur * SR); t = np.arange(n) / SR; u = t / dur
    rise = np.clip(u / 0.22, 0, 1)
    f = f0 + (peak - f0) * (np.sin(rise * np.pi / 2)) - (peak - f0) * 0.75 * np.clip((u - 0.7) / 0.3, 0, 1) ** 1.6
    f = f * (1 + 0.012 * np.sin(2 * np.pi * 4.8 * t + r.random() * 6) + 0.006 * np.sin(2 * np.pi * 1.3 * t))
    ph = 2 * np.pi * np.cumsum(f) / SR
    v = np.sin(ph) + 0.22 * np.sin(2 * ph + 0.4) + 0.07 * np.sin(3 * ph + 1.1) + 0.02 * np.sin(4 * ph)
    env = np.clip(u / 0.08, 0, 1) ** 1.5 * np.clip((1 - u) / 0.25, 0, 1) ** 1.2 * (0.9 + 0.1 * np.sin(np.pi * u))
    br = np.convolve(r.standard_normal(n), np.ones(12) / 12, mode='same') * 0.05
    x = (v * 0.5 + br) * env
    x = reverb(x, 2.2, 0.45, seed)
    return fade(level(x, None, -3), 0.01, 0.4)


def snort(seed, double=False):
    """A deer's alarm: a sharp blown snort through the nose (band-passed noise burst)."""
    r = np.random.default_rng(seed + 10)
    def one(d):
        n = int(d * SR); t = np.arange(n) / SR
        w = r.standard_normal(n)
        # band 600-2500 Hz by two one-pole filters
        lo = np.zeros(n); hi = np.zeros(n); a, b = 0.30, 0.06
        for i in range(1, n): lo[i] = lo[i - 1] + a * (w[i] - lo[i - 1])
        for i in range(1, n): hi[i] = hi[i - 1] + b * (lo[i] - hi[i - 1])
        y = lo - hi
        env = np.clip(t / 0.012, 0, 1) * np.exp(-t / (d * 0.35))
        return y * env
    x = one(0.32)
    if double: x = np.concatenate([x, np.zeros(int(0.16 * SR)), one(0.26) * 0.8])
    return fade(level(reverb(x, 0.9, 0.25, seed), None, -3), 0.002, 0.2)


def bleat(seed):
    """A doe's short nasal bleat."""
    r = np.random.default_rng(seed)
    d = 0.42; n = int(d * SR); t = np.arange(n) / SR; u = t / d
    f = 560 + 120 * np.sin(np.pi * u) - 90 * u
    f = f * (1 + 0.03 * np.sin(2 * np.pi * 22 * t))  # the quaver of a bleat
    ph = 2 * np.pi * np.cumsum(f) / SR
    v = sum((0.8 ** k) * np.sin((k + 1) * ph) * (1.4 if k in (2, 3) else 1) for k in range(8))  # nasal: strong 3rd / 4th
    env = np.clip(u / 0.06, 0, 1) * np.clip((1 - u) / 0.3, 0, 1)
    x = v * env * 0.2 + np.convolve(r.standard_normal(n), np.ones(6) / 6, mode='same') * env * 0.03
    return fade(level(reverb(x, 0.8, 0.2, seed), None, -4), 0.004, 0.15)


if __name__ == '__main__':
    if not os.path.isdir(SRC): sys.exit('run tools/audio/fetch.sh first')
    what = sys.argv[1:] or ['beds', 'shots', 'horses', 'animals']
    for w in what: globals()[w]()
