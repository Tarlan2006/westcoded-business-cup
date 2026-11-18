/** The voice bus supplies RMS. Only visible, animated guides subscribe. */
export type SpeechFrame = Readonly<{ active: boolean; mouth: number }>;
const idle = { active: false, mouth: 0 };
let frame: SpeechFrame = idle;
const listeners = new Set<() => void>();
const thresholds = [.065, .24, .49, .78];
const shapes = [0, 1, 2, 4, 3]; // round the vowel before the widest opening
let level = 0, band = 0, recorded = 0, browser = 0;
let lastChange = 0;
let raf = 0, lastSample = 0, ended = 0, pulse = 0;
let meter = () => 0;

export const getSpeechFrame = () => frame;
export function setSpeechMeter(read: () => number) { meter = read; }
export function speechBoundary() {
  const now = performance.now();
  if (now - pulse > 130) pulse = now;
}
function publish(active: boolean, mouth: number) {
  if (frame.active === active && frame.mouth === mouth) return;
  frame = { active, mouth };
  listeners.forEach(listener => listener());
}
function tick(now: number) {
  raf = 0;
  if (!listeners.size || document.hidden) return;
  if (now - lastSample >= 32) {
    lastSample = now;
    const playing = recorded + browser > 0;
    const syllable = (now - pulse) % 270 / 270;
    const target = !playing ? 0 : recorded ? meter() : .12 + .72 * Math.sin(Math.PI * syllable) ** 2;
    level += (target - level) * (target > level ? .72 : .65);
    if (target < .015 && level < .13) level = 0;
    if (now - lastChange >= 60 || level === 0) {
      const previous = band;
      while (band < 4 && level > thresholds[band] + .025) band++;
      while (band > 0 && level < thresholds[band - 1] - .025) band--;
      if (band !== previous) lastChange = now;
    }
    if (!playing && now - ended > 50) band = 0;
    const active = playing || now - ended < 125;
    publish(active, active ? shapes[band] : 0);
    if (!active) return;
  }
  raf = requestAnimationFrame(tick);
}
function wake() {
  if (!raf && listeners.size && !document.hidden) raf = requestAnimationFrame(tick);
}
export function changeVoicePlayback(kind: 'recorded' | 'browser', delta: 1 | -1) {
  if (kind === 'recorded') recorded = Math.max(0, recorded + delta);
  else {
    browser = Math.max(0, browser + delta);
    if (delta === 1) pulse = performance.now();
  }
  if (!recorded && !browser) ended = performance.now();
  wake();
}
export function subscribeSpeechFrame(listener: () => void) {
  listeners.add(listener);
  if (recorded || browser) wake();
  return () => {
    listeners.delete(listener);
    if (!listeners.size) {
      cancelAnimationFrame(raf);
      raf = lastSample = band = level = 0;
      frame = idle;
    }
  };
}
