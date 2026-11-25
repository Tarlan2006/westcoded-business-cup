// Raya adds a low-level noise bed outside the spoken sentence. Locate sustained
// speech in 10 ms windows, then retain the quiet consonants around that region.
export function cleanSentence(samples, sampleRate = 16000) {
  const frame = Math.max(1, Math.round(sampleRate / 100));
  const count = Math.ceil(samples.length / frame);
  const levels = new Float32Array(count);
  for (let k = 0; k < count; k++) {
    const end = Math.min(samples.length, (k + 1) * frame);
    let power = 0;
    for (let i = k * frame; i < end; i++) power += samples[i] ** 2;
    levels[k] = Math.sqrt(power / (end - k * frame));
  }
  // A percentile rather than the largest sample prevents a single click from
  // raising the threshold enough to remove a short or softly spoken word.
  const sorted = levels.slice().sort();
  const reference = sorted[Math.floor(count * 0.90)] ?? 0;
  const threshold = Math.min(0.055, Math.max(0.012, reference * 0.15));
  let first = -1;
  let last = -1;
  for (let k = 0; k + 2 < count; k++) {
    if (levels[k] >= threshold && levels[k + 1] >= threshold && levels[k + 2] >= threshold) {
      if (first < 0) first = k;
      last = k + 2;
    }
  }

  const start = first < 0 ? 0 : Math.max(0, (first - 9) * frame);
  const end = last < 0 ? samples.length : Math.min(samples.length, (last + 11) * frame);
  const length = end - start;
  const pad = 4 * frame;
  const output = new Float32Array(length + 2 * pad);
  output.set(samples.subarray(start, end), pad);
  // The ramp only touches the margin outside detected speech. Use a minimal
  // ramp when the sentence starts immediately or ends on a voiced sound.
  const attack = Math.min(Math.floor(length / 2), first < 0 ? frame : Math.max(frame / 2, Math.min(7 * frame, first * frame - start)));
  const release = Math.min(Math.floor(length / 2), last < 0 ? frame : Math.max(frame / 2, Math.min(8 * frame, end - (last + 1) * frame)));
  for (let i = 0; i < attack; i++) output[pad + i] *= Math.sin(Math.PI * i / (2 * attack)) ** 2;
  for (let i = 0; i < release; i++) output[pad + length - 1 - i] *= Math.sin(Math.PI * i / (2 * release)) ** 2;
  return output;
}
