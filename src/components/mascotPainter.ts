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
const whole: Rect = [0,0,320,496];
const patches: Record<Art, { column: number; x: number; y: number; box: Rect }> = {
  idle: {column:0, x:0, y:496, box:[116,98,81,33]},
  wave: {column:1, x:0, y:529, box:[200,41,113,141]},
  talk: {column:2, x:544, y:928, box:[154,127,51,31]},
  listen: {column:0, x:0, y:1000, box:[110,96,92,39]},
  cheer: {column:1, x:368, y:811, box:[0,64,153,189]},
  think: {column:0, x:0, y:1039, box:[110,96,92,39]},
};
function surface() {
  const node = document.createElement('canvas');
  node.width = 320; node.height = 496;
  return node.getContext('2d')!;
}

export function painter(canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext('2d')!;
  let previous: CanvasRenderingContext2D | undefined, composite: CanvasRenderingContext2D | undefined;
  let mode: Art | undefined, tile = -1, started = 0, fading = false, full = false;
  let dest: Rect = whole, source: Rect = whole, target: CanvasImageSource = atlas;

  function patchSource(art: Art, index: number): Rect {
    const { x, y, box } = patches[art];
    if (art === 'wave') return [x+index%8*box[2], y+Math.floor(index/8)*box[3], box[2], box[3]];
    return [x+index*box[2], y, box[2], box[3]];
  }

  let fadeMs = 72;
  function blend(now: number) {
    if (!fading || !previous) return;
    const t = Math.min(1, Math.max(0,(now-started)/fadeMs));
    const weight = t*t*(3-2*t);
    ctx.clearRect(...dest);
    ctx.globalAlpha = 1-weight;
    ctx.drawImage(previous.canvas, ...dest, ...dest);
    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = weight;
    ctx.drawImage(target, ...source, ...dest);
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
    fading = t < 1;
  }
  return (next: Art, index: number, now: number, still: boolean) => {
    blend(now);
    if (mode === next && tile === index && !(still && fading)) return;
    // A new syllable during a pose change must not restart the whole-body fade.
    if (mode === next && full && fading && composite && !still) {
      const { box } = patches[next];
      composite.clearRect(...box);
      composite.drawImage(atlas, ...patchSource(next,index), ...box);
      tile = index;
      canvas.dataset.frame = String(index);
      blend(now);
      return;
    }
    full = next !== mode || (fading && full);
    const fade = mode !== undefined && !still;
    mode = next; tile = index;
    const {column,box} = patches[next];
    dest = full ? whole : box;
    source = patchSource(next,index);
    target = atlas;
    if (full) {
      composite ??= surface();
      composite.clearRect(...whole);
      composite.drawImage(atlas,column*320,0,320,496,...whole);
      if (next === 'listen' || next === 'think') {
        composite.clearRect(65,0,184,189);
        composite.drawImage(atlas,next === 'think' ? 184 : 0,811,184,189,65,0,184,189);
      }
      if (next === 'cheer') {
        composite.clearRect(0,253,153,108);
        composite.drawImage(atlas,700,811,153,108,0,253,153,108);
      }
      composite.clearRect(...box);
      composite.drawImage(atlas,...source,...box);
      source = whole;
      target = composite.canvas;
    }
    canvas.dataset.frame = String(index);
    if (fade) {
      previous ??= surface();
      previous.clearRect(...dest);
      previous.drawImage(canvas,...dest,...dest);
      fadeMs = full || next === 'talk' ? 72 : 38;
      started = now;
      fading = true;
    } else {
      fading = false;
      ctx.clearRect(...dest);
      ctx.drawImage(target,...source,...dest);
    }
  };
}
