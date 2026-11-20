import type { Art } from './mascotPainter';

type Surface = CanvasRenderingContext2D;
type Point = readonly [number, number];
type Arm = { shoulder: Point; angle: number; length: number; handAngle: number; handLength: number };
type Rig = { rows: Point[]; left: Arm; right: Arm };
type Part = 'body' | 'left' | 'right' | 'leftHand' | 'rightHand';
type Layers = Record<Part, Surface>;
type Pose = { layers: Layers; rig: Rig };
const parts: Part[] = ['body', 'left', 'right', 'leftHand', 'rightHand'];
const width = 320, height = 496;

export function poseSurface() {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  return canvas.getContext('2d')!;
}

function outline(points: Point[]) {
  const path = new Path2D();
  path.moveTo(...points[0]);
  for (const p of points.slice(1)) path.lineTo(...p);
  path.closePath();
  return path;
}

// The inner edge follows the seam of the sleeve. The outer edge runs through transparent pixels.
const hangingLeft = outline([[0, 171], [108, 176], [124, 187], [115, 213], [109, 247], [105, 281], [108, 313], [102, 339], [65, 352], [0, 352]]);
const hangingRight = outline([[320, 171], [213, 176], [196, 187], [204, 211], [209, 244], [213, 277], [208, 310], [213, 340], [247, 352], [320, 352]]);
const wavingLeft = outline([[0, 173], [104, 176], [122, 184], [113, 211], [105, 248], [99, 279], [102, 322], [103, 343], [55, 350], [0, 350]]);
const raisedRight = outline([[184, 167], [197, 161], [218, 147], [224, 53], [320, 28], [320, 181], [217, 219], [200, 207], [198, 192]]);
const raisedLeft = outline([[124, 168], [101, 158], [86, 155], [81, 149], [81, 136], [75, 131], [69, 124], [62, 116], [61, 101], [61, 82], [0, 73], [0, 178], [95, 216], [108, 215], [113, 189]]);
const talkingLeft = outline([[55, 179], [101, 178], [122, 187], [112, 205], [118, 208], [122, 215], [123, 222], [130, 228], [135, 230], [140, 230], [147, 234], [153, 237], [155, 242], [149, 247], [143, 250], [134, 251], [132, 262], [124, 271], [116, 276], [66, 279]]);
const talkingRight = outline([[190, 184], [207, 177], [233, 184], [305, 168], [305, 265], [231, 280], [214, 272], [205, 256], [204, 228]]);

const palmLeft = outline([[114, 209], [113, 212], [114, 223], [111, 230], [111, 248], [116, 253],
[127, 252], [133, 254], [142, 252], [152, 245], [152, 242], [147, 238], [142, 239], [140, 235],
[134, 236], [128, 230], [122, 221], [122, 213], [119, 210]]);
const palmRight = outline([[229, 219], [245, 193], [282, 190], [282, 243], [250, 242],
[239, 242], [232, 239], [229, 236], [228, 232]]);

function arm(shoulder: Point, wrist: Point, fingers: Point): Arm {
  const dx = wrist[0] - shoulder[0], dy = wrist[1] - shoulder[1];
  const hx = fingers[0] - wrist[0], hy = fingers[1] - wrist[1];
  return {
    shoulder, angle: Math.atan2(dy, dx), length: Math.hypot(dx, dy),
    handAngle: Math.atan2(hy, hx), handLength: Math.hypot(hx, hy)
  };
}

// Keep the face rigid as the head turns. Only the jacket between collar and belt bends.
function bodyRows(eyes: Point, eyeLine: Point, belt: number): Point[] {
  const [dx, dy] = eyeLine;
  function headPoint(x: number, y: number): Point {
    return [eyes[0] + (x * dx - y * dy) / 42, eyes[1] + (x * dy + y * dx) / 42];
  }
  return [headPoint(-132, -154), headPoint(132, -154), headPoint(-132, 73), headPoint(132, 73),
  [belt - 116, 255], [belt + 116, 255], [34, 365], [286, 365], [0, 496], [320, 496]];
}

function rigFor(art: Art, tile: number): Rig {
  if (art === 'talk') return {
    rows: bodyRows([174, 109], [37, -9], 177),
    left: arm([118, 190], [112, 246], [145, 236]), right: arm([196, 189], [237, 235], [267, 212])
  };
  if (art === 'wave' || art === 'cheer') {
    const t = art === 'cheer' ? 1 : tile / 14;
    return {
      rows: bodyRows([142, 110], [45, -12], 164),
      left: art === 'cheer' ? arm([119, 180], [58, 139], [25, 96]) : arm([116, 188], [89, 297], [88, 332]),
      right: arm([193, 177], [239 + 22 * t, 116 + 22 * t], [241 + 46 * t, 72 + 24 * t])
    };
  }
  const eyes: Point = art === 'think' ? [157, 114] : art === 'listen' ? [161, 114] : [157, 115];
  const eyeLine: Point = art === 'think' ? [42, -5] : art === 'listen' ? [43, 2] : [42, -1];
  return {
    rows: bodyRows(eyes, eyeLine, 158), left: arm([119, 189], [96, 296], [98, 332]),
    right: arm([201, 189], [222, 296], [221, 332])
  };
}

function emptyLayers(): Layers {
  return { body: poseSurface(), left: poseSurface(), right: poseSurface(), leftHand: poseSurface(), rightHand: poseSurface() };
}

function cutPose(image: HTMLCanvasElement, atlas: HTMLImageElement, art: Art, tile: number, layers = emptyLayers()): Pose {
  const left = art === 'cheer' ? raisedLeft : art === 'wave' ? wavingLeft : art === 'talk' ? talkingLeft : hangingLeft;
  const right = art === 'cheer' || art === 'wave' ? raisedRight : art === 'talk' ? talkingRight : hangingRight;
  const { body } = layers;
  body.clearRect(0, 0, width, height);
  body.drawImage(image, 0, 0);
  body.globalCompositeOperation = 'destination-out';
  body.fill(left); body.fill(right);
  if (art === 'talk') { body.lineWidth = 5; body.stroke(left); body.stroke(right); }
  body.globalCompositeOperation = 'source-over';
  // Continue the jacket behind the palms. These pixels become visible only as a hand lifts.
  body.save();
  body.clip(outline([[123, 188], [192, 184], [207, 212], [212, 268], [193, 316], [114, 316], [102, 267], [111, 214]]));
  body.globalCompositeOperation = 'destination-over';
  const shift = art === 'talk' ? 17 : art === 'wave' || art === 'cheer' ? 5 : 0;
  body.drawImage(atlas, 112, 183, 92, 141, 107 + shift, 183, 103, 141);
  body.restore();
  body.globalCompositeOperation = 'destination-in';
  body.drawImage(image, 0, 0);
  body.globalCompositeOperation = 'source-over';
  function sleeve(ctx: Surface, hand: Surface, path: Path2D, cut: Path2D) {
    ctx.clearRect(0, 0, width, height);
    ctx.fill(path);
    ctx.lineWidth = 1.5;
    ctx.stroke(path);
    ctx.globalCompositeOperation = 'source-in';
    ctx.drawImage(image, 0, 0);
    ctx.globalCompositeOperation = 'source-over';
    hand.clearRect(0, 0, width, height);
    hand.save(); hand.clip(cut); hand.drawImage(ctx.canvas, 0, 0); hand.restore();
    ctx.globalCompositeOperation = 'destination-out'; ctx.fill(cut);
    if (art === 'talk') { ctx.lineWidth = 2; ctx.stroke(cut); }
    ctx.globalCompositeOperation = 'source-over';
  }
  const wristCut = (part: Arm, normal: number) => {
    const [x, y] = wrist(part), nx = Math.cos(normal), ny = Math.sin(normal);
    const dx = -ny * 240, dy = nx * 240;
    return outline([[x + dx, y + dy], [x - dx, y - dy], [x - dx + nx * 240, y - dy + ny * 240], [x + dx + nx * 240, y + dy + ny * 240]]);
  };
  const rig = rigFor(art, tile);
  // The speaking palms face the viewer and overlap the jacket. A half-plane at
  // the wrist would also pull the shoulder and belt along with the fingers.
  sleeve(layers.left, layers.leftHand, left, art === 'talk' ? palmLeft : wristCut(rig.left, rig.left.handAngle));
  sleeve(layers.right, layers.rightHand, right, art === 'talk' ? palmRight : wristCut(rig.right, rig.right.handAngle));
  return { layers, rig };
}

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
function point(a: Point, b: Point, t: number): Point {
  return [lerp(a[0], b[0], t), lerp(a[1], b[1], t)];
}

function swing(a: Arm, b: Arm, t: number): Arm {
  // Take the short arc around the shoulder, including across the -π/π boundary.
  if (t === 0) return a;
  if (t === 1) return b;
  const turn = Math.atan2(Math.sin(b.angle - a.angle), Math.cos(b.angle - a.angle));
  const handTurn = Math.atan2(Math.sin(b.handAngle - a.handAngle), Math.cos(b.handAngle - a.handAngle));
  const result = {
    shoulder: point(a.shoulder, b.shoulder, t), angle: a.angle + turn * t, length: lerp(a.length, b.length, t),
    handAngle: a.handAngle + handTurn * t, handLength: lerp(a.handLength, b.handLength, t)
  };
  const reach = Math.cos(result.angle);
  const fingerX = wrist(result)[0] + Math.cos(result.handAngle) * result.handLength;
  // Bend at mid-swing so the fingers stay inside the original sprite bounds.
  if (fingerX < 12 && reach < -.1) result.length += (12 - fingerX) / reach;
  if (fingerX > 308 && reach > .1) result.length += (308 - fingerX) / reach;
  return result;
}

function between(a: Rig, b: Rig, t: number): Rig {
  return {
    rows: a.rows.map((p, i) => point(p, b.rows[i], t)),
    left: swing(a.left, b.left, t), right: swing(a.right, b.right, t)
  };
}

function wrist(a: Arm): Point {
  return [a.shoulder[0] + Math.cos(a.angle) * a.length, a.shoulder[1] + Math.sin(a.angle) * a.length];
}

function trunk(ctx: Surface, pose: Pose, rig: Rig) {
  const src = pose.rig.rows, dst = rig.rows;
  function triangle(i: number, j: number, k: number) {
    const p = src[i], q = src[j], r = src[k], a = dst[i], b = dst[j], c = dst[k];
    const x = q[0] - p[0], y = q[1] - p[1], u = r[0] - p[0], v = r[1] - p[1], det = x * v - u * y;
    const m = ((b[0] - a[0]) * v - (c[0] - a[0]) * y) / det, n = ((b[1] - a[1]) * v - (c[1] - a[1]) * y) / det;
    const h = (x * (c[0] - a[0]) - u * (b[0] - a[0])) / det, l = (x * (c[1] - a[1]) - u * (b[1] - a[1])) / det;
    const cx = (a[0] + b[0] + c[0]) / 3, cy = (a[1] + b[1] + c[1]) / 3;
    ctx.save(); ctx.beginPath();
    for (const [ix, t] of [a, b, c].entries()) {
      // Half a pixel of overlap avoids antialiased seams between adjoining triangles.
      const len = Math.hypot(t[0] - cx, t[1] - cy);
      const tx = t[0] + (t[0] - cx) / len * 1.3, ty = t[1] + (t[1] - cy) / len * 1.3;
      if (ix === 0) ctx.moveTo(tx, ty); else ctx.lineTo(tx, ty);
    }
    ctx.closePath(); ctx.clip();
    ctx.setTransform(m, n, h, l, a[0] - m * p[0] - h * p[1], a[1] - n * p[0] - l * p[1]);
    ctx.drawImage(pose.layers.body.canvas, 0, 0); ctx.restore();
  }
  for (let i = 0; i + 3 < src.length; i += 2) { triangle(i, i + 1, i + 2); triangle(i + 1, i + 3, i + 2); }
}

function drawPart(ctx: Surface, pose: Pose, rig: Rig, part: Part, body: Surface) {
  if (part === 'body') {
    body.clearRect(0, 0, width, height);
    trunk(body, pose, rig);
    ctx.drawImage(body.canvas, 0, 0);
    return;
  }
  const isHand = part === 'leftHand' || part === 'rightHand';
  const side = part === 'left' || part === 'leftHand' ? 'left' : 'right';
  const from = pose.rig[side], to = rig[side];
  const angle = isHand ? to.handAngle - from.handAngle : to.angle - from.angle;
  const scale = isHand ? to.handLength / from.handLength : to.length / from.length;
  const c = scale * Math.cos(angle), s = scale * Math.sin(angle);
  const [x, y] = isHand ? wrist(from) : from.shoulder, [tx, ty] = isHand ? wrist(to) : to.shoulder;
  ctx.setTransform(c, s, -s, c, tx - c * x + s * y, ty - s * x - c * y);
  ctx.drawImage(pose.layers[part].canvas, 0, 0); ctx.resetTransform();
}

export const poseTransitionMs = 280;

export function startPoseTransition(source: Pose, targetImage: HTMLCanvasElement, atlas: HTMLImageElement, art: Art, tile: number, start: number) {
  let target = cutPose(targetImage, atlas, art, tile);
  const scratch = poseSurface(), body = poseSurface();
  function travelTime() {
    return source.rig.left.angle === target.rig.left.angle && source.rig.right.angle === target.rig.right.angle
      ? 150 : poseTransitionMs;
  }
  let duration = travelTime();
  function progress(now: number) {
    const t = Math.min(1, Math.max(0, (now - start) / duration));
    return t * t * (3 - 2 * t);
  }
  function partAt(ctx: Surface, rig: Rig, part: Part, progress: number) {
    // The face turns ahead of the hands. Swap aligned features during the turn.
    const w = part === 'body' ? (progress - .25) / .30 : (progress - .30) / .42;
    const t = Math.min(1, Math.max(0, w));
    const mix = t * t * (3 - 2 * t);
    ctx.clearRect(0, 0, width, height);
    ctx.globalAlpha = 1 - mix;
    if (mix < 1) drawPart(ctx, source, rig, part, body);
    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = mix;
    if (mix > 0) drawPart(ctx, target, rig, part, body);
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
  }
  function sample(now: number) {
    const t = progress(now);
    const rig = between(source.rig, target.rig, t);
    return { rig, t };
  }
  return {
    update(image: HTMLCanvasElement, index: number, box: [number, number, number, number]) {
      if (art === 'wave') {
        target = cutPose(image, atlas, art, index, target.layers);
      } else {
        // Lip and eyelid frames only affect the face. Keep the arm masks and the transition clock.
        target.layers.body.clearRect(...box);
        target.layers.body.drawImage(image, ...box, ...box);
      }
    },
    paint(ctx: Surface, now: number, departure: HTMLCanvasElement) {
      const { rig, t } = sample(now);
      ctx.clearRect(0, 0, width, height);
      for (const part of parts) {
        partAt(scratch, rig, part, t);
        ctx.drawImage(scratch.canvas, 0, 0);
      }
      // Ease the last subpixel of resampling into the exact atlas drawing at either end.
      const elapsed = now - start;
      const edge = elapsed < 28 ? 1 - elapsed / 28 : Math.max(0, 1 - (duration - elapsed) / 28);
      if (edge > 0) {
        ctx.globalAlpha = edge;
        ctx.globalCompositeOperation = 'destination-out'; ctx.fillRect(0, 0, width, height);
        ctx.globalCompositeOperation = 'lighter'; ctx.drawImage(elapsed < 28 ? departure : targetImage, 0, 0);
        ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1;
      }
    },
    redirect(image: HTMLCanvasElement, next: Art, index: number, now: number) {
      // Freeze each limb in stage coordinates. Reuse its surface when another event arrives mid-swing.
      const { rig, t } = sample(now);
      for (const part of parts) {
        partAt(scratch, rig, part, t);
        const layer = source.layers[part];
        layer.clearRect(0, 0, width, height);
        layer.drawImage(scratch.canvas, 0, 0);
      }
      source = { layers: source.layers, rig };
      art = next;
      target = cutPose(image, atlas, art, index, target.layers);
      start = now;
      duration = travelTime();
    },
    finished(now: number) { return now - start >= duration; }
  };
}

export { cutPose };
