#!/usr/bin/env python3
"""Synthesises the launch video's music bed (docs/LAUNCH_VIDEO.md): a warm, restrained, modern cue in D major — pads, a soft bass, a sparse plucked arpeggio, a gentle pulse, bell
accents on the scene changes. Everything is generated here from sine/saw/noise, so it is original and free to use; nothing is sampled and no service is involved.

    python3 scripts/video/music.py --out music.wav [--duration 97.6] [--cuts 5,16,27,43,59.4,67.6,75.6,85.6,91.6]

`--cuts` are the seconds at which scenes start: a bell sounds on each and the arrangement changes there (pulse in at the third cut, out for the proof scene, back for the end).
"""
import argparse
import wave

import numpy as np

SR = 44100
BPM = 100.0
BEAT = 60.0 / BPM
rng = np.random.default_rng(31)


def t_of(n):
    return np.arange(n) / SR


def env_points(points, n):
    """piecewise-linear automation in seconds → per-sample curve"""
    xs = [p[0] for p in points]
    ys = [p[1] for p in points]
    return np.interp(t_of(n), xs, ys)


def lowpass(x, cutoff):
    """one-pole low-pass (per channel, along the last axis)"""
    a = np.exp(-2 * np.pi * cutoff / SR)
    y = np.empty_like(x)
    acc = np.zeros(x.shape[:-1])
    for i in range(x.shape[-1]):
        acc = (1 - a) * x[..., i] + a * acc
        y[..., i] = acc
    return y


def fast_lowpass(x, cutoff, passes=2):
    """a cheap vectorised smoother (moving average cascade) — plenty for soft tone shaping"""
    w = max(1, int(SR / (2 * cutoff)))
    k = np.ones(w) / w
    y = x
    for _ in range(passes):
        y = np.convolve(y, k, mode="same")
    return y


def saw(freq, t, harmonics=14):
    out = np.zeros_like(t)
    for k in range(1, harmonics + 1):
        if freq * k > SR / 2 - 2000:
            break
        out += np.sin(2 * np.pi * freq * k * t) / k
    return out * (2 / np.pi)


def midi(note):
    return 440.0 * 2 ** ((note - 69) / 12)


# D major, four chords of two bars each: Dmaj9 – Bm9 – Gmaj7 – A6/9
NOTE = {"B1": 35, "D2": 38, "G1": 31, "A1": 33, "B2": 47, "D3": 50, "E3": 52, "F#3": 54, "G2": 43, "A2": 45, "A3": 57, "B3": 59, "C#4": 61, "D4": 62, "E4": 64, "F#4": 66, "G4": 67, "A4": 69}
CHORDS = [
    {"root": "D2", "pad": ["D3", "A3", "C#4", "E4", "F#4"], "arp": [74, 78, 81, 85, 88, 85, 81, 78]},  # D F# A C# E
    {"root": "B1", "pad": ["B2", "F#3", "A3", "C#4", "D4"], "arp": [71, 74, 78, 81, 83, 81, 78, 74]},  # B D F# A C#
    {"root": "G1", "pad": ["G2", "D3", "F#3", "B3", "D4"], "arp": [71, 74, 78, 79, 83, 79, 78, 74]},  # G B D F#
    {"root": "A1", "pad": ["A2", "E3", "B3", "C#4", "F#4"], "arp": [73, 76, 81, 83, 85, 83, 81, 76]},  # A C# E F# B
]
BARS_PER_CHORD = 2
CHORD_LEN = BARS_PER_CHORD * 4 * BEAT


def add(dst, src, at):
    i = int(at * SR)
    if i >= len(dst):
        return
    n = min(len(src), len(dst) - i)
    dst[i : i + n] += src[:n]


def pad_voice(freq, dur, detune=0.0035, cutoff=1500):
    n = int(dur * SR)
    t = t_of(n)
    v = saw(freq * (1 - detune), t) + saw(freq * (1 + detune), t) + 0.5 * np.sin(2 * np.pi * freq * t)
    v = fast_lowpass(v, cutoff, 2)
    a = np.minimum(1, t / 1.3)
    r = np.minimum(1, (dur - t) / 1.6)
    trem = 1 + 0.07 * np.sin(2 * np.pi * 0.23 * t + freq)
    return v * a * r * trem


def pluck(freq, dur=0.55):
    n = int(dur * SR)
    t = t_of(n)
    v = np.sin(2 * np.pi * freq * t) + 0.35 * np.sin(2 * np.pi * freq * 2 * t) * np.exp(-t * 14) + 0.12 * np.sin(2 * np.pi * freq * 3 * t) * np.exp(-t * 22)
    return v * np.exp(-t * 7.5) * np.minimum(1, t / 0.004)


def bell(freq, dur=2.4):
    n = int(dur * SR)
    t = t_of(n)
    parts = [(1.0, 1.0, 1.6), (2.0, 0.45, 2.4), (2.76, 0.3, 3.2), (4.07, 0.16, 4.6), (5.4, 0.08, 6.0)]
    v = sum(a * np.sin(2 * np.pi * freq * m * t) * np.exp(-t * d) for m, a, d in parts)
    return v * np.minimum(1, t / 0.003)


def kick(dur=0.45):
    n = int(dur * SR)
    t = t_of(n)
    f = 46 + 90 * np.exp(-t * 28)
    ph = 2 * np.pi * np.cumsum(f) / SR
    return np.sin(ph) * np.exp(-t * 9) * np.minimum(1, t / 0.002)


def hat(dur=0.09):
    n = int(dur * SR)
    t = t_of(n)
    x = rng.standard_normal(n)
    x = np.diff(x, prepend=0)  # tilt to the highs
    return x * np.exp(-t * 55)


def clap(dur=0.22):
    n = int(dur * SR)
    t = t_of(n)
    x = rng.standard_normal(n)
    x = fast_lowpass(np.diff(x, prepend=0), 4200, 1) - fast_lowpass(x, 700, 1) * 0.0
    env = np.exp(-t * 26) + 0.8 * np.exp(-np.maximum(t - 0.012, 0) * 30) * (t > 0.012)
    return x * env


def reverb(x, seconds=2.4, wet=1.0):
    """a smooth synthetic room: exponentially decaying noise, darkened, convolved by FFT (per channel)"""
    n = int(seconds * SR)
    t = t_of(n)
    ir = rng.standard_normal((2, n)) * np.exp(-t * 2.6)
    ir = np.stack([fast_lowpass(ir[0], 3200, 2), fast_lowpass(ir[1], 3200, 2)])
    ir /= np.sqrt((ir**2).sum(axis=1, keepdims=True))
    size = 1 << int(np.ceil(np.log2(x.shape[1] + n)))
    X = np.fft.rfft(x, size, axis=1)
    out = np.fft.irfft(X * np.fft.rfft(ir, size, axis=1), size, axis=1)[:, : x.shape[1]]
    return out * wet


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--out", default="music.wav")
    ap.add_argument("--duration", type=float, default=97.6)
    ap.add_argument("--cuts", default="5,16,27,43,59.4,67.6,75.6,85.6,91.6")
    args = ap.parse_args()
    dur = args.duration
    cuts = [float(c) for c in args.cuts.split(",")]
    n = int((dur + 4.0) * SR)  # a tail for the reverb
    pad = np.zeros((2, n))
    bass = np.zeros(n)
    arp = np.zeros((2, n))
    drums = np.zeros(n)
    kick_gate = np.zeros(n)
    bells = np.zeros((2, n))

    # arrangement (seconds → level), each layer: in at a cut, out at a cut
    pulse_in, pulse_out, pulse_back = cuts[2], cuts[7], cuts[8]
    lvl_pad = env_points([(0, 0.0), (2.5, 0.8), (cuts[7] - 0.3, 0.9), (cuts[7] + 0.2, 1.0), (dur - 3, 0.9), (dur, 0.0)], n)
    lvl_bass = env_points([(0, 0), (cuts[1] - 0.2, 0.0), (cuts[1] + 1.5, 0.75), (cuts[7] - 0.2, 0.9), (cuts[7] + 0.3, 0.0), (cuts[8] - 0.1, 0.0), (cuts[8] + 0.6, 0.55), (dur - 3, 0.4), (dur, 0)], n)
    lvl_arp = env_points([(0, 0), (cuts[0] - 0.1, 0.0), (cuts[0] + 1.2, 0.8), (cuts[3], 0.85), (cuts[6], 0.7), (cuts[7] - 0.2, 0.7), (cuts[7] + 0.4, 0.25), (cuts[8], 0.45), (dur - 2, 0.35), (dur, 0)], n)
    lvl_drum = env_points([(0, 0), (pulse_in - 0.1, 0.0), (pulse_in + 0.5, 0.85), (cuts[6], 0.8), (pulse_out - 0.2, 0.8), (pulse_out + 0.2, 0.0), (pulse_back, 0.0), (pulse_back + 0.4, 0.5), (dur - 3, 0.45), (dur, 0)], n)

    # the chord loop
    chords = []
    t = 0.0
    k = 0
    while t < dur + 1:
        chords.append((t, CHORDS[k % len(CHORDS)]))
        t += CHORD_LEN
        k += 1
    for (t0, ch) in chords:
        for j, name in enumerate(ch["pad"]):
            f = midi(NOTE[name])
            v = pad_voice(f, CHORD_LEN + 1.8, detune=0.0035 + 0.0008 * j, cutoff=1300 + 120 * j)
            pan = -0.35 + 0.7 * (j / (len(ch["pad"]) - 1))
            add(pad[0], v * (0.5 - pan * 0.5) * 0.28, t0)
            add(pad[1], v * (0.5 + pan * 0.5) * 0.28, t0)
        # bass: a root note per beat group, long and soft
        f = midi(NOTE[ch["root"]])
        nb = int((CHORD_LEN + 0.2) * SR)
        tb = t_of(nb)
        b = np.sin(2 * np.pi * f * tb) + 0.18 * np.sin(2 * np.pi * f * 2 * tb)
        b *= np.minimum(1, tb / 0.05) * np.minimum(1, (CHORD_LEN + 0.2 - tb) / 0.25)
        add(bass, b * 0.5, t0)
        # arpeggio: eighth notes, skipping a few for air
        steps = int(CHORD_LEN / (BEAT / 2))
        for s in range(steps):
            if s % 8 in (3, 6):  # rests
                continue
            m = ch["arp"][s % len(ch["arp"])]
            v = pluck(midi(m), 0.6)
            pan = 0.5 * np.sin(s * 1.7)
            at = t0 + s * BEAT / 2
            vel = 0.55 + 0.25 * ((s % 4) == 0)
            add(arp[0], v * vel * (0.5 - pan * 0.5), at)
            add(arp[1], v * vel * (0.5 + pan * 0.5), at + 0.011)

    # the pulse: soft kick on 1 and the "and" of 2, brushed hats, a clap on 2 and 4
    beats = int(dur / BEAT) + 2
    for b in range(beats):
        at = b * BEAT
        pos = b % 4
        if pos == 0 or (pos == 2 and (b // 4) % 2 == 1):
            kk = kick()
            add(drums, kk * 0.8, at)
            add(kick_gate, np.abs(kk) ** 0.5, at)
        if pos in (1, 3):
            add(drums, clap() * 0.10, at)
        add(drums, hat() * (0.045 if pos % 2 == 0 else 0.032), at + BEAT / 2)
        add(drums, hat() * 0.02, at)

    # bells on every scene change, one note of the D major pentatonic each
    scale = [74, 76, 78, 81, 83, 86, 85, 81, 78, 74]
    for i, c in enumerate(cuts):
        v = bell(midi(scale[i % len(scale)] - 12 * (i % 2)))
        add(bells[0], v * 0.34, c)
        add(bells[1], v * 0.34, c + 0.009)
    add(bells[0], bell(midi(62)) * 0.3, 0.05)  # a soft D to begin
    add(bells[1], bell(midi(62)) * 0.3, 0.06)

    # the pad and bass breathe with the kick (sidechain-style)
    gate = fast_lowpass(kick_gate / (kick_gate.max() + 1e-9), 14, 1)
    duck = 1 - 0.38 * np.clip(gate, 0, 1) * lvl_drum
    pad *= lvl_pad * duck
    bass *= lvl_bass * duck
    arp *= lvl_arp
    drums = fast_lowpass(drums, 6000, 1) * lvl_drum

    dry = pad * 0.9 + arp * 0.8 + bells * 0.9
    wet = reverb(pad * 0.55 + arp * 0.7 + bells * 1.1, 2.6, 0.5)
    mix = dry + wet + np.stack([bass, bass]) * 0.8 + np.stack([drums, drums]) * 0.5

    mix = mix[:, : int(dur * SR)]
    # fades, a soft ceiling, normalisation
    nn = mix.shape[1]
    tt = t_of(nn)
    mix *= np.minimum(1, tt / 0.6) * np.minimum(1, (dur - tt) / 3.2)
    mix = np.tanh(mix * 1.15) / np.tanh(1.15)
    peak = np.abs(mix).max()
    mix *= 0.63 / peak
    pcm = (np.clip(mix, -1, 1) * 32767).astype("<i2")
    with wave.open(args.out, "wb") as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(pcm.T.tobytes())
    rms = np.sqrt((mix**2).mean())
    print(f"wrote {args.out}: {nn / SR:.1f} s, peak {20 * np.log10(np.abs(mix).max()):.1f} dBFS, rms {20 * np.log10(rms):.1f} dBFS")


if __name__ == "__main__":
    main()
