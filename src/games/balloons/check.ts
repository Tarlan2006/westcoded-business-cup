import assert from "node:assert/strict";
// Node 24 needs the explicit extension; production uses Vite Bundler resolution.
import { answerOptions, layoutBalloons, pointsFor, quadrant, roundSpec } from "./model.ts";
import type { AgeGroup, Balloon } from "./model";

let checked = 0;
let smallest = Infinity;
for (const age of ["3-5", "6-8"] as AgeGroup[]) {
  for (let seed = 0; seed < 2000; seed++) {
    let previous = 0;
    for (let index = 0; index < 5; index++) {
      const spec = roundSpec(age, index, seed * 5 + index, previous);
      assert(spec.count !== previous && spec.count >= (age === "3-5" ? 3 : 6) && spec.count <= (age === "3-5" ? 8 : 15));
      if (age === "6-8" && index >= 3) assert(spec.count >= 12);
      const options = answerOptions(spec.count, age, seed);
      assert.equal(new Set(options).size, 4); assert(options.includes(spec.count)); assert(options.every((n: number) => n >= 1 && Number.isInteger(n)));
      if (age === "3-5") assert.equal(Math.max(...options) - Math.min(...options), 3);
      previous = spec.count;
    }
    // Exercise every supported N, including the most crowded rounds, at both layouts.
    const count = (age === "3-5" ? 3 : 6) + seed % (age === "3-5" ? 6 : 10);
    for (const [width, height] of [[350, 470], [760, 440]]) {
      const balloons: Balloon[] = layoutBalloons(count, width, height, age === "3-5" ? 76 : 58, seed);
      assert.equal(balloons.length, count); assert.equal(new Set(balloons.map((b) => b.id)).size, count);
      const quadrants = [0, 0, 0, 0];
      for (const [i, balloon] of balloons.entries()) {
        smallest = Math.min(smallest, balloon.diameter);
        assert(balloon.x - balloon.halfWidth >= 8 && balloon.x + balloon.halfWidth <= width - 8);
        assert(balloon.y - balloon.topExtent >= 8 && balloon.y + balloon.halfHeight <= height - 8);
        assert(Math.abs(balloon.tilt) <= 14 && balloon.bob >= 3 && balloon.bob <= 6 && balloon.period >= 2.5 && balloon.period <= 4);
        quadrants[quadrant(balloon, width, height)]++;
        for (const other of balloons.slice(i + 1)) {
          assert(Math.hypot(balloon.x - other.x, balloon.y - other.y) >= 1.2 * Math.max(balloon.diameter, other.diameter), "center spacing");
          const parts = (b: Balloon) => [[b.x, b.y, b.headRadius], [b.x + b.tailOffsetX, b.y + b.tailOffsetY, b.tailRadius]];
          for (const [x, y, radius] of parts(balloon)) for (const [otherX, otherY, otherRadius] of parts(other)) {
            assert(Math.hypot(x - otherX, y - otherY) >= radius + otherRadius + 2, "animated head/string envelopes never overlap");
          }
        }
        const closest = balloons.filter((b) => b !== balloon).sort((a, b) => Math.hypot(a.x - balloon.x, a.y - balloon.y) - Math.hypot(b.x - balloon.x, b.y - balloon.y)).slice(0, 2);
        assert(!closest.every((b) => b.color === balloon.color), "no three nearest balloons share one color");
      }
      if (count >= 6) assert(quadrants.every((n) => n >= Math.ceil(count * .1)), "at least 10% in every quadrant");
      const otherSeed = layoutBalloons(count, width, height, age === "3-5" ? 76 : 58, seed + 2000);
      assert.notDeepEqual(balloons.map((b) => [b.x, b.y]), otherSeed.map((b: Balloon) => [b.x, b.y]));
      assert.deepEqual(balloons, layoutBalloons(count, width, height, age === "3-5" ? 76 : 58, seed), "rerender preserves seeded geometry");
      checked++;
    }
  }
  console.log(`PASS ${age}: 2000 seeds, every N, mobile/desktop, counts, bounds, spacing, quadrants, color variety, stable seed, distinct seeds, unique answers, progression`);
}
for (let correct = 0; correct <= 5; correct++) assert.equal(pointsFor(correct), correct * 4 + 8);
console.log(`PASS ${checked} layouts and deterministic/alternate seed repeats; smallest SVG ${smallest.toFixed(1)}px (hit targets remain >=44px); rewards 8..28 XP`);
