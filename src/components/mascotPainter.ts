import { cutPose, poseSurface, startPoseTransition } from './mascotTransition';

let atlas: HTMLImageElement;
let decoding: Promise<boolean> | undefined;

export function loadGuide(): Promise<boolean> {
  if (!decoding) {
    atlas = new Image();
    atlas.src = '/mascot/frames/guide.webp?v=5';
    decoding = atlas.decode().then(() => true, () => {
      decoding = undefined;
      return false;
    });
  }
  return decoding;
}
export type Art = 'idle' | 'wave' | 'talk' | 'listen' | 'think' | 'cheer';
type Rect = [number, number, number, number];
const whole: Rect = [0, 0, 320, 496];
const patches: Record<Art, { column: number; x: number; y: number; box: Rect }> = {
  idle: { column: 0, x: 0, y: 496, box: [116, 98, 81, 33] },
  wave: { column: 1, x: 0, y: 529, box: [200, 41, 113, 141] },
  talk: { column: 2, x: 544, y: 928, box: [154, 127, 51, 31] },
  listen: { column: 0, x: 0, y: 1000, box: [110, 96, 92, 39] },
  cheer: { column: 1, x: 368, y: 811, box: [0, 64, 153, 189] },
  think: { column: 0, x: 0, y: 1039, box: [110, 96, 92, 39] },
};
export function painter(canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext('2d')!;
  let previous: CanvasRenderingContext2D | undefined, composite: CanvasRenderingContext2D | undefined;
  let transition: ReturnType<typeof startPoseTransition> | undefined;
  let mode: Art | undefined, tile = -1, started = 0, fading = false;
  let dest: Rect = whole, source: Rect = whole;

  function patchSource(art: Art, index: number): Rect {
    const { x, y, box } = patches[art];
    if (art === 'wave') return [x + index % 8 * box[2], y + Math.floor(index / 8) * box[3], box[2], box[3]];
    return [x + index * box[2], y, box[2], box[3]];
  }

  let fadeMs = 72;
  function blend(now: number) {
    if (!fading || !previous) return;
    const t = Math.min(1, Math.max(0, (now - started) / fadeMs));
    const weight = t * t * (3 - 2 * t);
    ctx.clearRect(...dest);
    ctx.globalAlpha = 1 - weight;
    ctx.drawImage(previous.canvas, ...dest, ...dest);
    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = weight;
    ctx.drawImage(atlas, ...source, ...dest);
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
    fading = t < 1;
  }
  function compose(art: Art, index: number) {
    composite ??= poseSurface();
    const { column, box } = patches[art];
    composite.clearRect(...whole);
    composite.drawImage(atlas, column * 320, 0, 320, 496, ...whole);
    if (art === 'listen' || art === 'think') {
      composite.clearRect(65, 0, 184, 189);
      composite.drawImage(atlas, art === 'think' ? 184 : 0, 811, 184, 189, 65, 0, 184, 189);
    }
    if (art === 'cheer') {
      composite.clearRect(0, 253, 153, 108);
      composite.drawImage(atlas, 700, 811, 153, 108, 0, 253, 153, 108);
    }
    composite.clearRect(...box);
    composite.drawImage(atlas, ...patchSource(art, index), ...box);
    return composite.canvas;
  }

  return (next: Art, index: number, now: number, still: boolean) => {
    if (next !== mode || (still && (transition || fading))) {
      if (fading) blend(now);
      if (mode && !still) {
        previous ??= poseSurface();
        previous.clearRect(...whole);
        previous.drawImage(canvas, 0, 0);
      }
      const image = compose(next, index);
      if (!mode || still) transition = undefined;
      else if (transition) transition.redirect(image, next, index, now);
      else transition = startPoseTransition(cutPose(canvas, atlas, mode, tile), image, atlas, next, index, now);
      fading = false;
      mode = next;
      tile = index;
      canvas.dataset.frame = String(index);
      if (!transition) {
        ctx.clearRect(...whole);
        ctx.drawImage(image, 0, 0);
      }
      return;
    }
    if (transition && composite) {
      if (index !== tile) {
        const box = patches[next].box;
        composite.clearRect(...box);
        composite.drawImage(atlas, ...patchSource(next, index), ...box);
        transition.update(composite.canvas, index, box);
        tile = index;
        canvas.dataset.frame = String(index);
      }
      if (transition.finished(now)) {
        ctx.clearRect(...whole);
        ctx.drawImage(composite.canvas, 0, 0);
        transition = undefined;
      } else {
        transition.paint(ctx, now, previous!.canvas);
      }
      return;
    }
    blend(now);
    if (tile === index) return;
    tile = index;
    canvas.dataset.frame = String(index);
    dest = patches[next].box;
    source = patchSource(next, index);
    if (still) {
      ctx.clearRect(...dest);
      ctx.drawImage(atlas, ...source, ...dest);
    } else {
      previous ??= poseSurface();
      previous.clearRect(...dest);
      previous.drawImage(canvas, ...dest, ...dest);
      fadeMs = next === 'talk' ? 72 : 38;
      started = now;
      fading = true;
    }
  };
}
