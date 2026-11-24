import { t } from "../../i18n/index.ts";
/** DOM-free pixels; transparent pixels are composited onto white. */
export interface ImageDataLike {
  width: number;
  height: number;
  data: ArrayLike<number>;
}

const COLS = 32;
const ROWS = 40;
type Bucket = 0 | 1 | 2 | 3; // empty, green, yellow, other

function bucket(r: number, g: number, b: number): Bucket {
  const max = Math.max(r, g, b) / 255;
  const min = Math.min(r, g, b) / 255;
  const delta = max - min;
  const saturation = max === 0 ? 0 : delta / max;
  if (min >= 0.92 || (max >= 0.94 && saturation < 0.10)) return 0;
  let hue = 0;
  if (delta) {
    if (max === r / 255) hue = ((g - b) / 255 / delta) % 6;
    else if (max === g / 255) hue = (b - r) / 255 / delta + 2;
    else hue = (r - g) / 255 / delta + 4;
    hue = (hue * 60 + 360) % 360;
  }
  if (saturation >= 0.18 && max >= 0.22) {
    if (hue >= 75 && hue <= 165) return 1;
    if (hue >= 35 && hue <= 70) return 2;
  }
  return 3;
}

/** Area-weighted cell averages, including fractional edge pixels. */
function grid(image: ImageDataLike): Bucket[] {
  const { width, height, data } = image;
  if (!Number.isInteger(width) || !Number.isInteger(height) || width < 1 || height < 1 || data.length < width * height * 4) {
    throw new RangeError("Expected a nonempty RGBA image with integer dimensions.");
  }
  const result: Bucket[] = [];
  for (let gy = 0; gy < ROWS; gy++) {
    const top = gy * height / ROWS, bottom = (gy + 1) * height / ROWS;
    for (let gx = 0; gx < COLS; gx++) {
      const left = gx * width / COLS, right = (gx + 1) * width / COLS;
      let r = 0, g = 0, b = 0, area = 0;
      for (let y = Math.floor(top); y < Math.ceil(bottom); y++) {
        for (let x = Math.floor(left); x < Math.ceil(right); x++) {
          const weight = (Math.min(x + 1, right) - Math.max(x, left)) * (Math.min(y + 1, bottom) - Math.max(y, top));
          const i = (y * width + x) * 4;
          const alpha = data[i + 3] / 255;
          r += (data[i] * alpha + 255 * (1 - alpha)) * weight;
          g += (data[i + 1] * alpha + 255 * (1 - alpha)) * weight;
          b += (data[i + 2] * alpha + 255 * (1 - alpha)) * weight;
          area += weight;
        }
      }
      result.push(bucket(r / area, g / area, b / area));
    }
  }
  return result;
}

function nearby(cells: Bucket[], index: number, color?: Bucket): boolean {
  const cx = index % COLS, cy = Math.floor(index / COLS);
  for (let y = Math.max(0, cy - 2); y <= Math.min(ROWS - 1, cy + 2); y++) {
    for (let x = Math.max(0, cx - 2); x <= Math.min(COLS - 1, cx + 2); x++) {
      if ((x - cx) ** 2 + (y - cy) ** 2 > 4) continue;
      const candidate = cells[y * COLS + x];
      if (color === undefined ? candidate !== 0 : candidate === color) return true;
    }
  }
  return false;
}

export interface DrawingStats { empty: boolean; flooded: boolean }
function stats(cells: Bucket[]): DrawingStats {
  const counts = [0, 0, 0, 0];
  cells.forEach((color) => counts[color]++);
  return { empty: counts[0] === cells.length, flooded: Math.max(...counts.slice(1)) / cells.length > 0.7 };
}

export function drawingStats(image: ImageDataLike): DrawingStats { return stats(grid(image)); }

/** No checklist is available here: match is the automatic score. */
export function scoreSketch(child: ImageDataLike, reference: ImageDataLike): { match: number; colorsAndShape: number } {
  const drawn = grid(child), target = grid(reference);
  const { empty, flooded } = stats(drawn);
  const referenceCount = target.filter((c) => c !== 0).length;
  if (empty || referenceCount === 0) return { match: 0, colorsAndShape: 0 };
  const coverage = target.filter((c, i) => c !== 0 && nearby(drawn, i, c)).length / referenceCount;
  const precision = drawn.filter((c, i) => c !== 0 && nearby(target, i)).length / drawn.filter((c) => c !== 0).length;
  const curved = 100 * (0.6 * coverage + 0.4 * precision) ** 0.8;
  const colorsAndShape = Math.round(Math.min(flooded ? 25 : 100, curved));
  return { match: colorsAndShape, colorsAndShape };
}

/** The presentation layer combines self-assessment with the automatic score. */
export function sketchResult(automatic: number | null, checked: readonly boolean[], strokeCount: number, state: DrawingStats) {
  const clues = checked.length ? checked.filter(Boolean).length / checked.length * 100 : 0;
  let match = Math.round(automatic === null ? clues : 0.5 * automatic + 0.5 * clues);
  // Blank/erased pictures and flood protection take precedence over encouragement.
  if (state.empty || automatic === 0) match = 0;
  else {
    if (match > 0 && strokeCount >= 5) match = Math.max(10, match);
    match = Math.min(state.flooded ? 25 : 100, Math.max(0, match));
  }
  const bonus = match > 0 && checked.length > 0 && checked.every(Boolean) ? 4 : 0;
  return { match, clues: Math.round(clues), points: Math.min(28, Math.round(match / 100 * 24) + bonus) };
}

export function sketchEncouragement(match: number): string {
  if (match < 40) return t("scoreSketch.goodStartAgentTryAddingMoreClues");
  if (match < 70) return t("scoreSketch.niceSketchYouCaughtManyDetails");
  if (match < 90) return t("scoreSketch.greatWorkThatLooksVeryClose");
  return t("scoreSketch.wowPerfectMatch");
}
