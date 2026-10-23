"""'Pıtır ile Kelebek' için neşeli müzik + animasyona senkron ses efektleri.

İniş kareleri src/Pixar/anim.ts içindeki JUMPS ile aynıdır.
Çıktı: public/pitir.wav (48 kHz, stereo)
"""

import sys
import numpy as np
from scipy import signal
from scipy.io import wavfile

SR = 48000
FPS = 30
DUR = 300 / FPS
N = int(DUR * SR)
t = np.arange(N) / SR
rng = np.random.default_rng(3)

JUMPS = [(8, 20), (36, 20), (64, 20), (205, 26), (262, 14)]  # (t0, air)
PREP = 6
TAKEOFFS = [(a + PREP) / FPS for a, _ in JUMPS]
LANDINGS = [(a + PREP + air) / FPS for a, air in JUMPS]


def midi(m):
    return 440.0 * 2 ** ((m - 69) / 12)


def place(out, sig, at, gain=1.0, pan=0.5):
    i0 = int(at * SR)
    if i0 >= N:
        return
    n = min(len(sig), N - i0)
    out[i0:i0 + n, 0] += sig[:n] * gain * (1 - pan) * 1.4
    out[i0:i0 + n, 1] += sig[:n] * gain * pan * 1.4


def marimba(f, dur=0.6):
    tt = np.arange(int(dur * SR)) / SR
    s = np.sin(2 * np.pi * f * tt) * np.exp(-tt * 7)
    s += 0.35 * np.sin(2 * np.pi * f * 4 * tt) * np.exp(-tt * 22)
    s += 0.15 * np.sin(2 * np.pi * f * 10 * tt) * np.exp(-tt * 40)
    return s * np.minimum(1, tt * 400)


def pluck(f, dur=0.4):
    tt = np.arange(int(dur * SR)) / SR
    s = signal.sawtooth(2 * np.pi * f * tt) * np.exp(-tt * 9)
    sos = signal.butter(2, 900, "low", fs=SR, output="sos")
    return signal.sosfilt(sos, s)


def boing(dur=0.35, f0=520, f1=170):
    tt = np.arange(int(dur * SR)) / SR
    fr = f1 + (f0 - f1) * np.exp(-tt * 12)
    vib = 1 + 0.08 * np.sin(2 * np.pi * 28 * tt) * np.exp(-tt * 6)
    ph = 2 * np.pi * np.cumsum(fr * vib) / SR
    return np.sin(ph) * np.exp(-tt * 9) * np.minimum(1, tt * 300)


def whoop(dur=0.25):
    tt = np.arange(int(dur * SR)) / SR
    fr = 300 + 900 * (tt / dur) ** 1.4
    ph = 2 * np.pi * np.cumsum(fr) / SR
    return np.sin(ph) * np.sin(np.pi * tt / dur) * 0.6


def chime(f, dur=1.8):
    tt = np.arange(int(dur * SR)) / SR
    mod = np.sin(2 * np.pi * f * 2.76 * tt) * 1.6 * np.exp(-tt * 4)
    return np.sin(2 * np.pi * f * tt + mod) * np.exp(-tt * 2.5)


mix = np.zeros((N, 2))

# --- Müzik: Do majör, 120 BPM, sekizlik notalar ---
BEAT = 0.5
eighth = BEAT / 2
melody = [
    76, None, 79, 76, 72, None, 74, 76, 77, None, 76, 74, 72, None, None, None,
    74, None, 77, 74, 71, None, 72, 74, 76, None, 74, 72, 71, None, 67, None,
    76, None, 79, 81, 79, None, 76, 72, 74, 76, 77, 79, 84, None, None, None,
]
for i, m in enumerate(melody):
    at = 0.25 + i * eighth
    if m is not None and at < DUR - 0.5:
        place(mix, marimba(midi(m)), at, 0.22, 0.4 + 0.2 * (i % 2))

bass = [48, 48, 43, 43, 45, 45, 41, 43] * 3
for i, m in enumerate(bass):
    for k in (0, 1):
        at = 0.25 + i * BEAT * 2 + k * BEAT
        if at < DUR - 0.5:
            place(mix, pluck(midi(m if k == 0 else m + 7)), at, 0.32)

# Hafif tıkırtı (shaker) ritmi
for i in range(int(DUR / eighth)):
    at = 0.25 + i * eighth
    n = int(0.04 * SR)
    sh = rng.standard_normal(n) * np.exp(-np.arange(n) / SR * 90)
    sos = signal.butter(2, 6000, "high", fs=SR, output="sos")
    place(mix, signal.sosfilt(sos, sh), at, 0.05 if i % 2 else 0.08, 0.65)

# --- Senkron ses efektleri ---
for k, at in enumerate(TAKEOFFS):
    place(mix, whoop(), at - 0.02, 0.10, 0.5)
for k, at in enumerate(LANDINGS):
    big = k == 3
    place(mix, boing(f0=620 if big else 520, f1=140 if big else 180), at, 0.45 if big else 0.32)

# Kelebek kanat titreşimi (140-258. kareler)
fl = (t >= 140 / FPS) & (t <= 258 / FPS)
flutter = rng.standard_normal(N)
sos = signal.butter(2, [2500, 7000], "band", fs=SR, output="sos")
flutter = signal.sosfilt(sos, flutter) * (0.5 + 0.5 * np.sin(2 * np.pi * 13 * t)) * fl * 0.03
mix[:, 1] += flutter
mix[:, 0] += flutter * 0.6

# Sevinç anı: yükselen çan arpeji (254. kare)
for i, m in enumerate([84, 88, 91, 96]):
    place(mix, chime(midi(m)), 254 / FPS + i * 0.07, 0.12, 0.3 + i * 0.13)

# Basit yankı
d = int(0.18 * SR)
wet = np.zeros_like(mix)
wet[d:] += mix[:-d] * 0.25
wet[2 * d:] += mix[:-2 * d, ::-1] * 0.12
mix = mix + wet

mix = np.tanh(mix * 1.2)
mix *= 0.89 / np.max(np.abs(mix))
mix *= (np.clip(t / 0.1, 0, 1) * np.clip((DUR - t) / 0.8, 0, 1))[:, None]

out = sys.argv[1] if len(sys.argv) > 1 else "public/pitir.wav"
wavfile.write(out, SR, (mix * 32767).astype(np.int16))
print(f"{out}: {DUR:.2f}s")
