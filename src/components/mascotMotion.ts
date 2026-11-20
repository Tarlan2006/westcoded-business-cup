import type { SpeechFrame } from '../audio/speechMotion';
import { watchMascot, wakeMascots } from './mascotClock';
import { loadGuide, painter, type Art } from './mascotPainter';

export type Emotion = 'idle' | 'greeting' | 'listening' | 'thinking' | 'speaking' | 'correct' | 'wrong' | 'network';
const duration: Partial<Record<Emotion, number>> = {greeting:3200, correct:1380, wrong:1500, network:1300};
const lids = [0,1,2,3,4,5,6,7,8,8,7,6,5,4,3,2,1];
const random = (min: number, max: number) => min + Math.random()*(max-min);
const tau = 2*Math.PI;
function waveFrame(age: number) {
  return Math.round(7*(1-Math.cos(tau*age/1350)));
}

export function animateMascot(host: HTMLElement, canvas: HTMLCanvasElement) {
  const draw = painter(canvas);
  let requested: Emotion = 'idle', state: Emotion | undefined, key: string | number | undefined;
  let lastGreeting: string | number | undefined, greeted = false, blinkCount = 0;
  let until: number | undefined;
  let entered = 0, speaking = true, blink = 0, double = false, glance = 0;
  let previousTick = 0;
  let visible = false, ready = false, disposed = false, last = 0;
  let y = 0, angle = 0, scale = 1;
  let detach: (() => void) | undefined;

  function tick(now: number, voice: SpeechFrame, reduced: boolean) {
    // An opening gesture gets its full duration after the first visible frame.
    until ??= now + (duration[requested] ?? Infinity);
    const intent = now < until ? requested : 'idle';
    const audible = !reduced && speaking && voice.active;
    const next = audible && (intent === 'idle' || intent === 'greeting') ? 'speaking' : intent;
    const resumed = now-previousTick > 1500;
    previousTick = now;
    const changed = next !== state;
    if (changed || resumed) {
      state = next; entered = now;
      blink = now + (state === 'thinking' ? 280 : random(2000,4000));
      glance = now + random(8000,12000);
      double = false; blinkCount = 0;
      host.dataset.emotion = state;
    }
    const age = now-entered;
    const slow = state === 'thinking';
    const lidMs = slow ? 51 : 30;
    if (now >= blink + lids.length*lidMs) {
      const second = !double && Math.random() < .18;
      blink = second ? now+145 : blink+random(2000,4000);
      double = second;
      if (slow && ++blinkCount >= 2) blink = Infinity;
    }
    if (now >= glance+920) glance += random(8000,12000);
    const lid = reduced || now < blink ? 0 : lids[Math.min(lids.length-1, Math.floor((now-blink)/lidMs))];
    let art: Art = 'idle', frame = lid;
    let tilt = 0, lift = 0;
    switch (state) {
      case 'greeting': art = 'wave'; frame = reduced ? 7 : waveFrame(age); break;
      case 'correct':
        art = 'cheer'; frame = 0;
        lift = -7*Math.abs(Math.sin(Math.PI*Math.min(age,900)/450))*(1-Math.min(age,900)/1100);
        break;
      case 'wrong':
        art = 'talk'; frame = audible ? voice.mouth : 0;
        tilt = 1.6*Math.sin(tau*age/720)*Math.max(0,1-age/1500);
        lift = 1.15*(1-Math.cos(tau*age/720));
        break;
      case 'network':
        art = 'talk'; frame = audible ? voice.mouth : 0;
        tilt = -1.7*Math.sin(Math.PI*Math.min(1,age/1300));
        break;
      case 'thinking': art = 'think'; tilt = -.8; break;
      case 'listening': art = 'listen'; tilt = .65; break;
      case 'speaking':
        art = 'talk'; frame = audible ? voice.mouth : 0;
        tilt = .85*Math.sin(tau*age/1450); break;
      case 'idle':
        if (!reduced && now >= glance) art = 'listen';
        break;
    }
    draw(art,frame,now,reduced);
    const motion = art === 'talk' && (audible || state === 'speaking') ? 'talk' : art === 'wave' ? 'wave' : 'idle';
    if (host.dataset.motion !== motion) host.dataset.motion = motion;
    if (motion === 'talk') {
      if (canvas.dataset.mouth !== String(frame)) canvas.dataset.mouth = String(frame);
    } else if (canvas.hasAttribute('data-mouth')) delete canvas.dataset.mouth;
    if (!host.dataset.ready) host.dataset.ready = 'true';
    if (host.dataset.running !== String(!reduced && visible && !document.hidden))
      host.dataset.running = String(!reduced && visible && !document.hidden);
    // The same clock drives breathing during silence, microphone capture and network waits.
    if (reduced) {
      canvas.style.transform = 'none';
      y = angle = 0; scale = 1;
    } else if (changed || now-last >= 15) {
      const breath = (1-Math.cos(tau*now/3200))/2;
      const mix = 1-Math.exp(-Math.min(100,now-last)/32);
      y += (lift-breath*.85-y)*mix;
      angle += (tilt-angle)*mix;
      scale += (1+breath*.014-scale)*mix;
      canvas.style.transform = `translateY(${y.toFixed(3)}%) rotate(${angle.toFixed(3)}deg) scale(${scale.toFixed(5)})`;
      last = now;
    }
    return until > now ? until : Infinity;
  }
  function sync() {
    detach?.(); detach = undefined;
    if (!ready || disposed) return;
    if (visible && !document.hidden) detach = watchMascot(tick);
    else host.dataset.running = 'false';
  }
  const observer = new IntersectionObserver(entries => {
    // A dialog can move into the top layer in the same batch as its hidden record.
    visible = entries[entries.length - 1].isIntersecting;
    sync();
  });
  observer.observe(host);
  document.addEventListener('visibilitychange',sync);
  let retry: ReturnType<typeof setTimeout> | undefined;
  let retried = false;
  function prepare() {
    if (ready || disposed) return;
    void loadGuide().then(ok => {
      if (disposed || ready) return;
      if (ok) { ready = true; sync(); }
      else if (!retried) {
        retried = true;
        retry = setTimeout(prepare, 600);
      }
    });
  }
  window.addEventListener('online', prepare);
  prepare();
  return {
    update(emotion: Emotion, allowSpeech: boolean, eventKey?: string | number) {
      speaking = allowSpeech;
      if (emotion !== requested || eventKey !== key) {
        requested = emotion; key = eventKey;
        until = previousTick ? performance.now()+(duration[emotion] ?? Infinity) : undefined;
        if (emotion === 'greeting') {
          if (greeted && lastGreeting === eventKey) until = 0;
          greeted = true; lastGreeting = eventKey;
        }
        if (emotion === state) state = undefined;
      }
      wakeMascots();
    },
    dispose() {
      disposed = true; detach?.(); observer.disconnect();
      clearTimeout(retry);
      window.removeEventListener('online', prepare);
      document.removeEventListener('visibilitychange',sync);
    }
  };
}
