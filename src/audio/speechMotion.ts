/** One shared sampler for every visible host; never creates an audio context. */
export type SpeechFrame = Readonly<{ active: boolean; mouth: number }>;
const idle: SpeechFrame = { active: false, mouth: 0 };
let frame = idle;
let recorded = 0, browser = 0, timer: ReturnType<typeof setTimeout> | undefined;
let meter = () => 0;
const listeners = new Set<() => void>();
export const getSpeechFrame = () => frame;
export function setSpeechMeter(read: () => number) { meter = read; }
function publish(next: SpeechFrame) {
  if (frame.active === next.active && frame.mouth === next.mouth) return;
  frame = next;
  listeners.forEach(listener => listener());
}
function sample() {
  timer = undefined;
  if (!listeners.size) return;
  const active = recorded + browser > 0 && (typeof document === 'undefined' || !document.hidden);
  // Browser speech does not expose PCM; a gentle syllable cadence is approximate.
  const level = browser > 0 ? (Math.sin(Date.now() / 72) + Math.sin(Date.now() / 113) + 2) / 4 : meter();
  publish(active ? { active, mouth: Math.min(3, Math.max(0, Math.round(level * 3))) } : idle);
  if (recorded + browser > 0) timer = setTimeout(sample, 60);
}
export function changeVoicePlayback(kind: 'recorded' | 'browser', delta: 1 | -1) {
  if (kind === 'recorded') recorded = Math.max(0, recorded + delta);
  else browser = Math.max(0, browser + delta);
  if (timer) clearTimeout(timer);
  sample();
}
export function subscribeSpeechFrame(listener: () => void) {
  listeners.add(listener);
  if (!timer) sample();
  return () => {
    listeners.delete(listener);
    if (!listeners.size && timer) { clearTimeout(timer); timer = undefined; }
  };
}
