// Node 24 needs the explicit .ts extension; the app uses Bundler resolution.
import { changeLanguage } from "../../i18n/index.ts";
await changeLanguage("en", false);
const { scoreSketch, drawingStats, sketchResult } = await import("./scoreSketch.ts");
import type { ImageDataLike } from "./scoreSketch";

function check(condition: boolean, message: string) {
  if (!condition) throw new Error(message);
  console.log(`PASS ${message}`);
}
function picture(paint: (x: number, y: number) => readonly number[] | null, width = 320, height = 400): ImageDataLike {
  const data = new Uint8ClampedArray(width * height * 4);
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
    data.set(paint(x * 32 / width, y * 40 / height) ?? [255, 255, 255, 255], (y * width + x) * 4);
  }
  return { width, height, data };
}
const green = [90, 180, 110, 255], yellow = [245, 205, 65, 255];
function hero(x: number, y: number): readonly number[] | null {
  if ((x - 15) ** 2 + (y - 10) ** 2 < 36) return green;
  if (x >= 10 && x < 21 && y >= 16 && y < 33) return y < 20 ? yellow : green;
  if (x >= 21 && x < 26 && y >= 26 && y < 29) return green;
  return null;
}
const reference = picture(hero);
const blank = picture(() => null);
const shifted = picture((x, y) => {
  if (y > 24) return null; // an unfinished drawing: head, stripe and upper body
  const color = hero(x - 1.5, y - 1);
  return color === green ? [120, 205, 90, 255] : color;
});
const flood = picture(() => green);
let seed = 82411;
const random = picture((x, y) => {
  // Stable sparse blue marks, including marks outside the reference silhouette.
  if (Math.floor(x * 10) % 10 || Math.floor(y * 10) % 10) return null;
  seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
  return seed % 4 === 0 ? [40, 60, 220, 255] : null;
}, 32, 40);

check(scoreSketch(blank, reference).match === 0, "blank canvas = 0%");
check(scoreSketch(reference, reference).match >= 90 && scoreSketch(reference, reference).match <= 100, "reference against itself = 90–100%");
const approximate = scoreSketch(shifted, reference).match;
check(approximate >= 55 && approximate <= 85, `shifted, approximate drawing = 55–85% (got ${approximate}%)`);
check(scoreSketch(flood, reference).match <= 25, "solid green flood <= 25%");
const unrelated = scoreSketch(random, reference).match;
check(unrelated <= 35, `random wrong-color marks <= 35% (got ${unrelated}%)`);
check(scoreSketch(picture(() => [0, 0, 0, 0]), reference).match === 0, "transparent canvas = 0%");
check(scoreSketch(picture(() => [249, 249, 249, 255]), reference).match === 0, "almost white canvas = 0%");
check(scoreSketch(reference, blank).match === 0, "empty reference is safe");
check(scoreSketch(picture(hero, 321, 403), reference).match >= 90, "non-divisible sizes use area averaging");
check(sketchResult(64, [true, true, true, true, true, false], 6, drawingStats(reference)).match === 74, "weighted score uses the exact checklist ratio");
check(sketchResult(100, Array(6).fill(true), 6, drawingStats(reference)).points === 28, "maximum reward is 28 XP");
check(sketchResult(0, Array(6).fill(false), 5, drawingStats(reference)).match === 10, "five strokes get encouragement floor");
check(sketchResult(0, Array(6).fill(true), 5, drawingStats(blank)).match === 0, "blank canvas stays at zero even with checked clues");
check(sketchResult(25, Array(6).fill(true), 5, drawingStats(flood)).match <= 25, "checklist cannot bypass flood protection");
check(sketchResult(null, [true, true, true, false, false, false], 2, drawingStats(reference)).match === 50, "failed reference falls back to Clues");
console.log("All sketch scoring checks passed.");
