"""'Elif ve Uçan Balon' fragmanı için müzik: Hicaz renkli telli melodi, pad, def + efektler.

Sahne zamanları src/Elif/index.tsx ile aynı (30 fps, 15 karelik geçişler).
Çıktı: public/elif.wav
"""

import sys
import numpy as np
from scipy import signal
from scipy.io import wavfile

SR = 48000
FPS = 30
SCENES = [180, 150, 165, 165, 135, 195]
T = 15
starts = []
acc = 0
for d in SCENES:
    starts.append(acc / FPS)
    acc += d - T
DUR = (sum(SCENES) - T * (len(SCENES) - 1)) / FPS
N = int(DUR * SR)
t = np.arange(N) / SR
rng = np.random.default_rng(9)


def midi(m):
    return 440.0 * 2 ** ((m - 69) / 12)


def place(out, sig, at, gain=1.0, pan=0.5):
    i0 = int(at * SR)
    if i0 >= N or i0 < 0:
        return
    n = min(len(sig), N - i0)
    out[i0:i0 + n, 0] += sig[:n] * gain * (1 - pan) * 1.4
    out[i0:i0 + n, 1] += sig[:n] * gain * pan * 1.4


def ks_pluck(f, dur=1.6, bright=0.5):
    """Karplus-Strong: ud/saz benzeri telli çalgı."""
    n = int(dur * SR)
    p = int(SR / f)
    buf = rng.uniform(-1, 1, p)
    buf = signal.lfilter([bright, 1 - bright], [1], buf)
    out = np.zeros(n)
    for i in range(n):
        out[i] = buf[i % p]
        buf[i % p] = 0.996 * 0.5 * (buf[i % p] + buf[(i + 1) % p])
    return out * np.minimum(1, np.arange(n) / 40)


def pad(notes, start, end, cutoff=1400, gain=0.12):
    seg = (t >= start) & (t < end)
    tt = t[seg] - start
    sig = np.zeros(seg.sum())
    for m in notes:
        for d in (-0.08, 0, 0.08):
            sig += signal.sawtooth(2 * np.pi * midi(m) * 2 ** (d / 12) * tt + rng.uniform(0, 6))
    sos = signal.butter(3, cutoff, "low", fs=SR, output="sos")
    sig = signal.sosfilt(sos, sig) / (len(notes) * 3)
    L = end - start
    env = np.minimum(1, tt / 1.2) * np.minimum(1, (L - tt) / 1.2)
    out = np.zeros(N)
    out[seg] = sig * env * gain
    return out


def drum(dur=0.5, f0=110):
    tt = np.arange(int(dur * SR)) / SR
    fr = f0 * (1 + 1.5 * np.exp(-tt * 30))
    body = np.sin(2 * np.pi * np.cumsum(fr) / SR) * np.exp(-tt * 9)
    slap = rng.standard_normal(len(tt)) * np.exp(-tt * 60) * 0.3
    return body + slap


def chime(f, dur=2.5):
    tt = np.arange(int(dur * SR)) / SR
    mod = np.sin(2 * np.pi * f * 3.01 * tt) * 1.4 * np.exp(-tt * 3)
    return np.sin(2 * np.pi * f * tt + mod) * np.exp(-tt * 1.8)


def whoosh(dur=1.2):
    n = int(dur * SR)
    tt = np.arange(n) / SR
    x = rng.standard_normal(n)
    sos = signal.butter(2, [150, 1800], "band", fs=SR, output="sos")
    x = signal.sosfilt(sos, x)
    rumble = np.sin(2 * np.pi * 55 * tt) * 0.4
    return (x + rumble) * np.sin(np.pi * np.minimum(1, tt / dur)) ** 0.7 * np.exp(-tt * 1.2)


mix = np.zeros((N, 2))
s = starts

# Pad akorları (Re Hicaz rengi)
chords = [
    ([50, 54, 57, 62], s[0], s[1] + 0.5),
    ([43, 50, 55, 58], s[1], s[2] + 0.5),
    ([50, 54, 57, 63], s[2], s[3] + 0.5),
    ([48, 52, 55, 60], s[3], s[3] + 2.6),
    ([46, 50, 53, 58], s[3] + 2.5, s[4] + 0.5),
    ([43, 46, 50, 55], s[4], s[4] + 2.3),
    ([45, 49, 52, 57], s[4] + 2.2, s[5] + 0.5),
    ([38, 50, 54, 57, 62, 66], s[5], DUR),
]
for notes, a, b in chords:
    p = pad(notes, a, b)
    mix[:, 0] += p
    mix[:, 1] += p

# Telli melodi (Hicaz: Re Mi♭ Fa# Sol La Si♭ Do Re)
H = {"D": 62, "Eb": 63, "F#": 66, "G": 67, "A": 69, "Bb": 70, "C": 72, "D2": 74}
phrase1 = ["A", None, "Bb", "A", "G", "F#", None, "G", "A", None, None, None]
phrase2 = ["D2", None, "C", "Bb", "A", None, "G", "F#", "Eb", None, "D", None]
step = 0.36
for k, (ph, at) in enumerate([(phrase1, s[0] + 1.0), (phrase2, s[2] + 0.3), (phrase1, s[4] + 0.2), (phrase2, s[5] + 0.4)]):
    for i, n in enumerate(ph):
        if n:
            place(mix, ks_pluck(midi(H[n])), at + i * step, 0.28, 0.35 + 0.3 * (i % 2))

# Def: koşu sahnesinden itibaren ritim
beat = 0.48
tt0 = s[3]
while tt0 < DUR - 2:
    place(mix, drum(), tt0, 0.35)
    place(mix, drum(f0=180) * 0.5, tt0 + beat * 1.5, 0.22, 0.6)
    tt0 += beat * 2

# Efektler
place(mix, chime(midi(86)), s[0] + 25 / FPS, 0.12, 0.6)  # başlık
place(mix, chime(midi(81)), s[1] + 70 / FPS, 0.10, 0.4)  # uyanış
for i, m in enumerate([81, 85, 88]):
    place(mix, chime(midi(m)), s[2] + 85 / FPS + i * 0.08, 0.10, 0.3 + i * 0.2)  # heyecan
place(mix, whoosh(), s[3] + 108 / FPS, 0.55, 0.65)  # balon yakıcısı
place(mix, drum(dur=1.2, f0=70), s[4], 0.6)  # kararlılık vuruşu
for i, m in enumerate([74, 78, 81, 86]):
    place(mix, chime(midi(m)), s[5] + 110 / FPS + i * 0.12, 0.13, 0.3 + i * 0.13)  # final

# Rüzgâr
wind = signal.sosfilt(signal.butter(2, 500, "low", fs=SR, output="sos"), rng.standard_normal(N))
wind *= (0.5 + 0.5 * np.sin(2 * np.pi * 0.07 * t)) * 0.05
mix[:, 0] += wind
mix[:, 1] += wind[::-1]

# Yankı
for d, g in [(0.23, 0.28), (0.41, 0.16), (0.67, 0.09)]:
    k = int(d * SR)
    mix[k:] += mix[:-k, ::-1] * g

mix = np.tanh(mix * 1.3)
mix *= 0.89 / np.max(np.abs(mix))
mix *= (np.clip(t / 0.5, 0, 1) * np.clip((DUR - t) / 2.0, 0, 1))[:, None]

out = sys.argv[1] if len(sys.argv) > 1 else "public/elif.wav"
wavfile.write(out, SR, (mix * 32767).astype(np.int16))
print(f"{out}: {DUR:.2f}s, sahne başlangıçları: {[round(x, 2) for x in starts]}")
