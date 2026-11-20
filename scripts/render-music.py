"""Render the original AIdos background loops. Requires numpy and ffmpeg."""
from pathlib import Path
import shutil
import subprocess

import numpy as np

OUT = Path(__file__).resolve().parents[1] / "public/audio/music"
RATE = 24000
# Tonic (MIDI), quarter notes/min, lead, accompaniment, eight bars of scale degrees.
# Each character is an eighth note. A dash extends a note and a dot leaves a rest.
SCORES = {
    "calm": (60, 96, "flute", "waltz", "3-5-6- 5---3- 4-6-8- 7-5--- 3-2-1- 4-3-2- 5-7-2- 1-----"),
    "patterns": (62, 116, "wood", "bounce", "1.3.5.3. 2.4.5--- 3.5.6.5. 4.2.5--- 1.3.8.5. 6.4.3--- 2.4.7.2. 1-------"),
    "cosmic": (65, 98, "bell", "stars", "1---5-8- 7---5--- 6-8-9--- 8---5--- 3---6-8- 9---6--- 5-7-9-7- 8-------"),
    "studio": (64, 106, "strings", "waltz", "5.3-1- 2-3-5- 6.4-1- 5----- 8.7-6- 4-3-2- 3.2-7- 8-----"),
    "playful": (65, 124, "wood", "skip", "1.15.53. 2.24.45. 3.36.65. 4.42.25. 5.58.87. 6.64.43. 2.47.52. 1---1-.."),
    "curious": (67, 104, "pluck", "stars", "3-2.3-5. 2---5... 4-3.4-6. 5---2... 3-5.6-8. 6---4... 2-4.7-2. 1-------"),
    "nature": (62, 108, "flute", "lilt", "1-235- 3-2-1- 4-568- 6-5--- 8-765- 4-321- 2-475- 1-----"),
    "adventure": (60, 120, "strings", "bounce", "1--35-5. 6-5-3--- 4--68-6. 5-2-5--- 8--76-5. 4-6-8--- 7-5-2-7- 8-------"),
    "journey": (63, 114, "pluck", "lilt", "1.3.5- 5-3-2- 4.6.8- 7-5--- 6.8.9- 8-6-4- 5.7.2- 1-----"),
}
SCALE = (0, 2, 4, 5, 7, 9, 11)
TIMBRES = {
    "wood": ((1, 1), (3, .38), (4, .16)), "bell": ((1, 1), (2, .34), (4, .24)),
    "strings": ((1, 1), (2, .48), (3, .21), (5, .08)),
    "flute": ((1, 1), (2, .12), (3, .08)), "pluck": ((1, 1), (2, .42), (3, .28)),
}


def render(tonic, bpm, lead, style, score):
    bars = score.split()
    steps = len(bars[0])
    assert all(len(bar) == steps for bar in bars)
    unit = 30 / bpm
    mix = np.zeros(round(len(bars) * steps * unit * RATE))

    def note(start, length, degree, octave, instrument, level):
        pitch = tonic + SCALE[(degree - 1) % 7] + 12 * ((degree - 1) // 7 + octave)
        hz = 440 * 2 ** ((pitch - 69) / 12)
        begin = round(start * unit * RATE)
        end = min(len(mix), begin + round(length * unit * RATE))
        t = np.arange(end - begin) / RATE
        duration = len(t) / RATE
        envelope = np.minimum(1, t / .016) * np.minimum(1, (duration - t) / .065)
        signal = np.zeros_like(t)
        decay = {"wood": 6, "pluck": 4, "bell": 2.7, "flute": .9, "strings": 2}[instrument]
        for harmonic, weight in TIMBRES[instrument]:
            signal += weight * np.sin(2 * np.pi * hz * harmonic * t) * np.exp(-decay * harmonic ** .55 * t)
        mix[begin:end] += level * envelope * signal

    for index, bar in enumerate(bars):
        offset = index * steps
        for pos, symbol in enumerate(bar):
            if symbol.isdigit():
                length = 1
                while pos + length < steps and bar[pos + length] == "-":
                    length += 1
                note(offset + pos, length * .94, int(symbol), 0, lead, .48)
        chord = (1, 5, 4, 5, 6, 4, 5, 1)[index]
        note(offset, 2.7, chord, -1, "pluck", .31)
        if style in ("bounce", "skip"):
            note(offset + 4, 1.8, chord + 4, -1, "wood", .26)
        pulses = {"waltz": [2, 4], "stars": [2, 5, 7], "bounce": [2, 6],
                  "skip": [1, 3, 6], "lilt": [2, 3, 5]}[style]
        for j, pulse in enumerate(pulses):
            note(offset + pulse, 1.45, chord + (2, 4, 2)[j], -1, "pluck", .18)
    return np.int16(np.round(mix * (26500 / np.max(np.abs(mix)))))


if __name__ == "__main__":
    encoder = shutil.which("ffmpeg")
    if not encoder:
        import imageio_ffmpeg
        encoder = imageio_ffmpeg.get_ffmpeg_exe()
    OUT.mkdir(exist_ok=True, parents=True)
    for name, score in SCORES.items():
        pcm = render(*score)
        subprocess.run([encoder, "-loglevel", "error", "-y", "-f", "s16le", "-ar", str(RATE),
                        "-ac", "1", "-i", "-", "-codec:a", "libmp3lame", "-b:a", "40k",
                        str(OUT / (name + ".mp3"))], input=pcm.astype("<i2").tobytes(), check=True)
