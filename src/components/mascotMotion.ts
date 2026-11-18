import { getSpeechFrame, subscribeSpeechFrame } from '../audio/speechMotion';
import type { MascotPose } from './Mascot';

const atlas = new Image();
atlas.src = '/mascot/frames/guide.webp?v=2';
const decoded = atlas.decode().then(() => true, () => false);
const width = 320, height = 496, fadeMs = 64;
type Motion = 'idle' | 'wave' | 'talk';
type Rect = [number, number, number, number];
const patches: Record<Motion, { column: number; y: number; box: Rect }> = {
  idle: { column: 0, y: 496, box: [116, 98, 81, 33] },
  wave: { column: 1, y: 559, box: [200, 41, 113, 141] },
  talk: { column: 2, y: 529, box: [154, 127, 51, 31] },
};
const blink = [[0,3400],[1,66],[2,66],[3,66],[4,76],[3,66],[2,66],[1,66]];
const wave = [[0,230],[1,112],[2,90],[3,78],[4,78],[5,84],[6,100],[7,190],
  [6,100],[5,84],[4,78],[3,78],[2,90],[1,112],[0,900]];

function surface() {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  return canvas.getContext('2d')!;
}

export function animateMascot(host: HTMLElement, canvas: HTMLCanvasElement, pose: MascotPose, allowed: boolean) {
  const ctx = canvas.getContext('2d')!;
  const rest: Motion = pose === 'wave' || pose === 'jump' ? 'wave' : 'idle';
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  let disposed = false, ready = false, visible = false, running = false;
  let mode: Motion | undefined, tile = -1, step = 0, timer = 0, raf = 0;
  let fullFade = false;
  let previous: CanvasRenderingContext2D | undefined, composite: CanvasRenderingContext2D | undefined;
  let unsubscribe: (() => void) | undefined;

  function show(next: Motion, index: number, still = false) {
    if (mode === next && tile === index && !still) return;
    cancelAnimationFrame(raf);
    const { column, y, box } = patches[next];
    const [left, top, w, h] = box;
    const full = next !== mode || still || fullFade;
    const rect: Rect = full ? [0, 0, width, height] : box;
    const [x, dy, dw, dh] = rect;
    let target: CanvasImageSource = atlas;
    let source: Rect = [index*w, y, w, h];
    if (full) {
      composite ??= surface();
      composite.clearRect(0, 0, width, height);
      composite.drawImage(atlas, column*width, 0, width, height, 0, 0, width, height);
      composite.clearRect(...box);
      composite.drawImage(atlas, ...source, left, top, w, h);
      target = composite.canvas;
      source = rect;
    }
    const fade = mode !== undefined && !still;
    fullFade = fade && full;
    mode = next;
    tile = index;
    host.dataset.motion = mode;
    canvas.dataset.frame = String(index);
    if (next === 'talk') canvas.dataset.mouth = String(index);
    else delete canvas.dataset.mouth;
    if (!fade) {
      ctx.clearRect(...rect);
      ctx.drawImage(target, ...source, ...rect);
      host.dataset.ready = 'true';
      return;
    }
    previous ??= surface();
    previous.clearRect(0, 0, dw, dh);
    previous.drawImage(canvas, ...rect, 0, 0, dw, dh);
    const before = previous.canvas;
    const start = performance.now();
    function paint(now: number) {
      const t = Math.max(0, Math.min(1, (now-start)/fadeMs));
      const weight = t*t*(3-2*t);
      ctx.clearRect(...rect);
      ctx.globalAlpha = 1-weight;
      ctx.drawImage(before, 0, 0, dw, dh, x, dy, dw, dh);
      // Sum premultiplied samples; an opaque cheek stays opaque throughout a fade.
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = weight;
      ctx.drawImage(target, ...source, ...rect);
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = 'source-over';
      if (t === 1) fullFade = false;
      raf = t < 1 ? requestAnimationFrame(paint) : 0;
    }
    raf = requestAnimationFrame(paint);
  }

  function advance() {
    const sequence = rest === 'wave' ? wave : blink;
    const [index, delay] = sequence[step];
    show(rest, index);
    step = (step+1) % sequence.length;
    timer = window.setTimeout(advance, delay);
  }
  function updateSpeech() {
    const speech = getSpeechFrame();
    if (speech.active) {
      clearTimeout(timer);
      timer = step = 0;
      show('talk', speech.mouth);
    } else if (!timer) advance();
  }
  function sync() {
    if (!ready || disposed) return;
    const animate = visible && !document.hidden && !reduce.matches;
    if (animate === running && mode !== undefined) return;
    running = animate;
    clearTimeout(timer);
    cancelAnimationFrame(raf);
    unsubscribe?.();
    unsubscribe = undefined;
    timer = step = raf = 0;
    host.dataset.running = String(animate);
    show(rest, 0, true);
    if (animate) {
      if (allowed) {
        unsubscribe = subscribeSpeechFrame(updateSpeech);
        updateSpeech();
      } else advance();
    }
  }
  const observer = new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    sync();
  });
  observer.observe(host);
  document.addEventListener('visibilitychange', sync);
  reduce.addEventListener('change', sync);
  void decoded.then(ok => { ready = ok; sync(); });
  return () => {
    disposed = true;
    clearTimeout(timer);
    cancelAnimationFrame(raf);
    unsubscribe?.();
    observer.disconnect();
    reduce.removeEventListener('change', sync);
    document.removeEventListener('visibilitychange', sync);
  };
}
