export type AgeGroup = "3-5" | "6-8";
export interface Balloon {
  id: number; x: number; y: number; diameter: number; tilt: number;
  bob: number; period: number; phase: number; color: number;
  halfWidth: number; halfHeight: number; topExtent: number;
  headRadius: number; tailRadius: number; tailOffsetX: number; tailOffsetY: number;
}
export const palette = [
  ["#FF7849", "#FFB08F"], ["#2CE69B", "#9FF5CF"], ["#FFD13B", "#FFF3A8"],
  ["#38BDF8", "#A5E4FD"], ["#B66CFF", "#DDB8FF"], ["#FF6B9A", "#FFB3CC"],
] as const;

export function random(seed: number): () => number {
  let value = seed >>> 0;
  return () => {
    value += 0x6D2B79F5;
    let t = Math.imul(value ^ value >>> 15, value | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}
function shuffled<T>(items: readonly T[], next: () => number): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(next() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}
export function roundSpec(age: AgeGroup, round: number, seed: number, previous = 0) {
  const ranges = age === "3-5" ? [[3, 4], [4, 5], [5, 6], [6, 7], [7, 8]] : [[6, 8], [8, 10], [10, 12], [12, 14], [13, 15]];
  const [low, high] = ranges[Math.min(4, Math.max(0, round))];
  const minimum = Math.min(high, Math.max(low, previous + 1));
  return { count: minimum + Math.floor(random(seed)() * (high - minimum + 1)),
    seconds: age === "3-5" || round >= 3 ? 12 : 10, baseDiameter: age === "3-5" ? 76 : 58 };
}
export function answerOptions(count: number, age: AgeGroup, seed: number): number[] {
  const next = random(seed ^ 0xABCDEF);
  if (age === "3-5") {
    const start = Math.max(1, count - 1 - Math.floor(next() * 2));
    return shuffled([start, start + 1, start + 2, start + 3], next);
  }
  const candidates = shuffled(Array.from({ length: 9 }, (_, i) => Math.max(1, count - 4) + i).filter((n) => n !== count), next);
  return shuffled([count, ...candidates.slice(0, 3)], next);
}
export function quadrant(balloon: Pick<Balloon, "x" | "y">, width: number, height: number) {
  return Number(balloon.x >= width / 2) + 2 * Number(balloon.y >= height / 2);
}
export function separated(a: Balloon, b: Balloon): boolean {
  const dx = a.x - b.x, dy = a.y - b.y;
  const apart = (x: number, y: number, radius: number) => x * x + y * y >= radius * radius;
  return apart(dx, dy, 1.2 * Math.max(a.diameter, b.diameter))
    && apart(dx, dy, a.headRadius + b.headRadius + 2)
    && apart(dx + a.tailOffsetX, dy + a.tailOffsetY, a.tailRadius + b.headRadius + 2)
    && apart(dx - b.tailOffsetX, dy - b.tailOffsetY, a.headRadius + b.tailRadius + 2)
    && apart(dx + a.tailOffsetX - b.tailOffsetX, dy + a.tailOffsetY - b.tailOffsetY, a.tailRadius + b.tailRadius + 2);
}

/** Seeded rejection sampling. Bounds include string, tilt, marker ring and maximum bob. */
export function layoutBalloons(count: number, width: number, height: number, baseDiameter: number, seed: number): Balloon[] {
  if (!Number.isInteger(count) || count < 1 || count > 15 || width < 280 || height < 280) throw new RangeError("Unsupported balloon stage");
  for (let retry = 0; retry < 100; retry++) {
    const next = random(seed ^ Math.imul(retry, 0x9E3779B9));
    const scale = .95 ** retry;
    const required = count >= 6 ? Math.ceil(count * .1) : 0;
    const zones = shuffled(Array.from({ length: required }, () => [0, 1, 2, 3]).flat(), next);
    const balloons: Balloon[] = [];
    for (let id = 0; id < count; id++) {
      const diameter = baseDiameter * (.85 + next() * .3) * scale;
      const tilt = -14 + next() * 28;
      const bob = 3 + next() * 3;
      const radians = tilt * Math.PI / 180;
      // Two conservative circles cover the round hit target/head and thin trailing string.
      // Counting empty rectangle corners as balloon area needlessly shrinks crowded rounds.
      const headRadius = Math.max(44, diameter) * .5 + bob + 4;
      const tailRadius = diameter * .28 + bob + 2;
      const tailOffsetX = -Math.sin(radians) * diameter * .75;
      const tailOffsetY = Math.cos(radians) * diameter * .75;
      const halfWidth = Math.max(headRadius, Math.abs(tailOffsetX) + tailRadius);
      const halfHeight = Math.max(headRadius, Math.abs(tailOffsetY) + tailRadius);
      const topExtent = Math.max(headRadius, tailRadius - tailOffsetY);
      const attributes = { id, diameter, tilt, bob, halfWidth, halfHeight,
        headRadius, tailRadius, tailOffsetX, tailOffsetY, topExtent,
        period: 2.5 + next() * 1.5, phase: -next() * 4, color: Math.floor(next() * 6) };
      let best: Balloon | undefined;
      let bestSpace = -1;
      for (let attempt = 0; attempt < 200; attempt++) {
        const x = 8 + halfWidth + next() * (width - 16 - halfWidth * 2);
        const y = 8 + topExtent + next() * (height - 16 - topExtent - halfHeight);
        const candidate = { ...attributes, x, y };
        if (zones[id] !== undefined && quadrant(candidate, width, height) !== zones[id]) continue;
        if (balloons.every((other) => separated(candidate, other))) {
          const space = balloons.length ? Math.min(...balloons.map((other) => Math.hypot(x - other.x, y - other.y))) : next();
          if (space > bestSpace) { best = candidate; bestSpace = space; }
        }
      }
      if (!best) break;
      balloons.push(best);
    }
    if (balloons.length !== count) continue;
    // A balloon and its two closest neighbours must not all have the same color.
    for (let pass = 0; pass < count; pass++) for (const balloon of balloons) {
      const neighbours = balloons.filter((other) => other !== balloon)
        .sort((a, b) => Math.hypot(a.x - balloon.x, a.y - balloon.y) - Math.hypot(b.x - balloon.x, b.y - balloon.y)).slice(0, 2);
      if (neighbours.length === 2 && neighbours.every((other) => other.color === balloon.color)) balloon.color = (balloon.color + 1 + Math.floor(next() * 5)) % 6;
    }
    return balloons;
  }
  throw new Error("Stage is too small to keep every balloon countable");
}

export function pointsFor(correct: number) { return Math.min(5, Math.max(0, Math.floor(correct))) * 4; }
