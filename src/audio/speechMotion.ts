/** Audio transports publish ownership; the single mascot clock samples the voice bus. */
export type SpeechFrame = Readonly<{ active: boolean; mouth: number }>;
const idle: SpeechFrame = { active: false, mouth: 0 };
let frame = idle;
const thresholds = [.065, .17, .29, .49, .66, .78];
const shapes = [0, 1, 5, 2, 4, 6, 3];
let level = 0, band = 0, recorded = 0, browser = 0;
let lastSample = -Infinity, lastChange = 0, ended = -Infinity, pulse = 0;
let meter = () => 0;

export function setSpeechMeter(read: () => number) { meter = read; }
export function speechBoundary() {
  const now = performance.now();
  if (now - pulse > 130) pulse = now;
}
export function changeVoicePlayback(kind: 'recorded' | 'browser', delta: 1 | -1) {
  if (kind === 'recorded') recorded = Math.max(0, recorded + delta);
  else {
    browser = Math.max(0, browser + delta);
    if (delta === 1) pulse = performance.now();
  }
  if (!recorded && !browser) ended = performance.now();
}
export function sampleSpeech(now: number): SpeechFrame {
  const playing = recorded + browser > 0;
  if (!playing && now-ended >= 125) {
    band = level = 0;
    return frame = idle;
  }
  if (now-lastSample < 32) return frame;
  lastSample = now;
  const syllable = (now-pulse) % 270 / 270;
  const target = !playing ? 0 : recorded ? meter() : .12 + .72*Math.sin(Math.PI*syllable)**2;
  level += (target-level)*(target > level ? .72 : .65);
  if (target < .015 && level < .38) level = 0;
  if (now-lastChange >= 60 || level === 0) {
    const previous = band;
    while (band < thresholds.length && level > thresholds[band]+.025) band++;
    while (band > 0 && level < thresholds[band-1]-.025) band--;
    if (band !== previous) lastChange = now;
  }
  if (!playing && now-ended > 50) band = 0;
  if (!frame.active || frame.mouth !== shapes[band]) frame = {active:true, mouth:shapes[band]};
  return frame;
}
