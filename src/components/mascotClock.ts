import { sampleSpeech, type SpeechFrame } from '../audio/speechMotion';

type Tick = (now: number, voice: SpeechFrame, reduced: boolean) => number;
const visible = new Set<Tick>();
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
let raf = 0, alarm = 0;

// Each visible guide returns its next deadline. Only static mode needs an alarm.
function tick(now: number) {
  raf = 0;
  if (document.hidden || !visible.size) return;
  const voice = sampleSpeech(now);
  let deadline = Infinity;
  for (const draw of visible) deadline = Math.min(deadline, draw(now, voice, reduced.matches));
  if (!reduced.matches) raf = requestAnimationFrame(tick);
  else if (Number.isFinite(deadline)) alarm = window.setTimeout(wakeMascots, Math.max(1, deadline-now));
}
export function wakeMascots() {
  clearTimeout(alarm);
  if (!visible.size || document.hidden) {
    cancelAnimationFrame(raf);
    raf = 0;
  } else if (!raf) raf = requestAnimationFrame(tick);
}
document.addEventListener('visibilitychange', wakeMascots);
reduced.addEventListener('change', wakeMascots);
export function watchMascot(draw: Tick) {
  visible.add(draw);
  wakeMascots();
  return () => { visible.delete(draw); wakeMascots(); };
}
