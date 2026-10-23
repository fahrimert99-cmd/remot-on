"""Gercekci videosu için müzik + ortam sesi sentezi (internet gerektirmez).

Zamanlama Remotion kompozisyonuyla aynı: 3 sahne x 270 kare, 25 karelik geçişler, 30 fps.
Çıktı: public/soundtrack.wav (48 kHz, stereo)
"""

import sys
import numpy as np
from scipy import signal
from scipy.io import wavfile

SR = 48000
FPS = 30
SCENE, T = 270, 25
DUR = (SCENE * 3 - T * 2) / FPS
N = int(DUR * SR)
t = np.arange(N) / SR
rng = np.random.default_rng(7)

# Sahne başlangıç/bitiş saniyeleri
S1 = (0, SCENE / FPS)
S2 = ((SCENE - T) / FPS, (2 * SCENE - T) / FPS)
S3 = ((2 * SCENE - 2 * T) / FPS, DUR)
XF = T / FPS


def env(start, end, fade_in=XF, fade_out=XF):
    """Sahne zarfı: geçiş boyunca yumuşak (eşit güç) giriş/çıkış."""
    e = np.zeros(N)
    a = np.clip((t - start) / max(fade_in, 1e-3), 0, 1)
    b = np.clip((end - t) / max(fade_out, 1e-3), 0, 1)
    e = np.sin(np.minimum(a, b) * np.pi / 2)
    e[(t < start) | (t > end)] = 0
    return e


def midi(m):
    return 440.0 * 2 ** ((m - 69) / 12)


def lowpass(x, fc, order=4):
    sos = signal.butter(order, fc, "low", fs=SR, output="sos")
    return signal.sosfilt(sos, x)


def bandpass(x, lo, hi, order=2):
    sos = signal.butter(order, [lo, hi], "band", fs=SR, output="sos")
    return signal.sosfilt(sos, x)


def pad(notes, start, end, bright=1800, detune=0.12):
    """Hafif detune edilmiş testere dişi dalgalardan sıcak pad."""
    seg = (t >= start - 0.01) & (t <= end + 0.01)
    out = np.zeros((N, 2))
    tt = t[seg]
    for m in notes:
        f = midi(m)
        for k, d in enumerate((-detune, 0, detune)):
            ph = rng.uniform(0, 2 * np.pi)
            w = signal.sawtooth(2 * np.pi * f * 2 ** (d / 12) * tt + ph)
            pan = 0.5 + (k - 1) * 0.35
            out[seg, 0] += w * (1 - pan)
            out[seg, 1] += w * pan
    lfo = 1 + 0.35 * np.sin(2 * np.pi * 0.11 * t)
    for c in range(2):
        out[:, c] = lowpass(out[:, c], bright) * lfo
    return out / (len(notes) * 3)


def chord_seq(chords, start, end, **kw):
    """Akorları sahne süresine yayıp aralarında yumuşak geçiş yap."""
    out = np.zeros((N, 2))
    step = (end - start) / len(chords)
    for i, ch in enumerate(chords):
        s = start + i * step
        e = env(s - 0.6, s + step + 0.6, 1.2, 1.2)
        out += pad(ch, s - 0.6, s + step + 0.6, **kw) * e[:, None]
    return out


def bell(f, at, dur=3.5, amp=0.25):
    """FM çan sesi."""
    out = np.zeros(N)
    i0 = int(at * SR)
    n = min(int(dur * SR), N - i0)
    if n <= 0:
        return out
    tt = np.arange(n) / SR
    mod = np.sin(2 * np.pi * f * 3.5 * tt) * 2.2 * np.exp(-tt * 3)
    out[i0:i0 + n] = np.sin(2 * np.pi * f * tt + mod) * np.exp(-tt * 1.6) * amp
    return out


def chirp(at, amp=0.08):
    """Kuş cıvıltısı: hızlı frekans süpürmesi."""
    out = np.zeros(N)
    i0 = int(at * SR)
    for k in range(rng.integers(2, 5)):
        n = int(0.07 * SR)
        s = i0 + k * int(0.11 * SR)
        if s + n >= N:
            break
        tt = np.arange(n) / SR
        f0, f1 = rng.uniform(3200, 4200), rng.uniform(5000, 6800)
        fr = f0 + (f1 - f0) * (tt / tt[-1]) ** 0.6
        ph = 2 * np.pi * np.cumsum(fr) / SR
        out[s:s + n] += np.sin(ph) * np.sin(np.pi * tt / tt[-1]) ** 2 * amp
    return out


def noise(n=N):
    return rng.standard_normal(n)


def reverb(x, seconds=3.2, wet=0.35):
    """Üstel sönen gürültü ile basit stereo yankı (konvolüsyon)."""
    n = int(seconds * SR)
    tt = np.arange(n) / SR
    out = np.zeros_like(x)
    for c in range(2):
        ir = noise(n) * np.exp(-tt * 6.9 / seconds)
        ir = lowpass(ir, 6000)
        ir /= np.sqrt(np.sum(ir ** 2))
        out[:, c] = signal.fftconvolve(x[:, c], ir)[:N]
    return x * (1 - wet) + out * wet * 2.2


def stereo(x, pan=0.5):
    return np.stack([x * (1 - pan) * 1.4, x * pan * 1.4], axis=1)


mix = np.zeros((N, 2))

# --- 1) Dağlarda gün batımı: D majör, sıcak ---
e1 = env(*S1, fade_in=1.5)
mus1 = chord_seq([[50, 57, 62, 66, 69], [47, 54, 62, 66, 71], [43, 55, 62, 67, 69]], *S1, bright=1600)
mus1 += stereo(sum(bell(midi(m), at) for m, at in [(74, 1.5), (78, 3.2), (81, 5.0), (76, 6.8)]), 0.6)
river = bandpass(noise(), 300, 2600) * (0.6 + 0.4 * lowpass(np.abs(noise()), 6))
river = np.stack([river, bandpass(noise(), 300, 2600) * 0.9], axis=1) * 0.05
wind = lowpass(noise(), 500) * (0.5 + 0.5 * np.sin(2 * np.pi * 0.08 * t + 1))
mix += (mus1 * 0.9 + river + stereo(wind * 0.08)) * e1[:, None]

# --- 2) Gece şehri: A minör, nabız + şehir uğultusu ---
e2 = env(*S2)
mus2 = chord_seq([[45, 52, 57, 60, 64], [41, 53, 57, 60, 65], [43, 50, 55, 59, 62]], *S2, bright=1100)
pulse_t = (t - S2[0]) % 0.5
pulse = np.sin(2 * np.pi * midi(33) * t) * np.exp(-pulse_t * 9) * 0.35
arp_notes = [69, 72, 76, 79, 76, 72]
arp = np.zeros(N)
step = 0.25
for i in range(int((S2[1] - S2[0]) / step)):
    at = S2[0] + i * step
    arp += bell(midi(arp_notes[i % len(arp_notes)]), at, dur=0.6, amp=0.07)
hum = lowpass(noise(), 180) * 0.5 + np.sin(2 * np.pi * 60 * t) * 0.02
cars = np.zeros(N)
for at in [S2[0] + 1.2, S2[0] + 3.9, S2[0] + 6.1, S2[0] + 7.6]:
    w = np.exp(-((t - at) / 0.7) ** 2)
    cars += bandpass(noise(), 120, 900) * w * 0.25
mix += (mus2 * 0.85 + stereo(pulse) + stereo(arp, 0.35) + stereo(hum * 0.15) + stereo(cars, 0.6)) * e2[:, None]

# --- 3) Şafakta zirveler: G majör, aydınlık + kuşlar ---
e3 = env(*S3, fade_out=2.5)
mus3 = chord_seq([[43, 50, 57, 59, 62, 66], [40, 52, 59, 62, 66], [48, 55, 59, 64, 67, 71]], *S3, bright=2400)
bells3 = sum(bell(midi(m), S3[0] + at, amp=0.2) for m, at in
             [(79, 0.8), (83, 2.0), (86, 3.4), (81, 4.9), (79, 6.3), (74, 7.6)])
birds = sum(chirp(at) for at in S3[0] + np.sort(rng.uniform(0.5, 8.0, 7)))
wind3 = lowpass(noise(), 700) * (0.5 + 0.5 * np.sin(2 * np.pi * 0.06 * t))
mix += (mus3 * 0.9 + stereo(bells3, 0.4) + stereo(birds, 0.7) + stereo(wind3 * 0.09)) * e3[:, None]

mix = reverb(mix)
# Yumuşak limiter + normalize
mix = np.tanh(mix * 1.3)
mix *= 0.89 / np.max(np.abs(mix))
fade = np.clip(t / 0.3, 0, 1) * np.clip((DUR - t) / 1.5, 0, 1)
mix *= fade[:, None]

out = sys.argv[1] if len(sys.argv) > 1 else "public/soundtrack.wav"
wavfile.write(out, SR, (mix * 32767).astype(np.int16))
print(f"{out}: {DUR:.2f}s")
