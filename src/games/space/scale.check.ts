import assert from "node:assert/strict";
// Node runs this file directly and requires the extension.
// @ts-expect-error -- the Vite project's TypeScript settings omit allowImportingTsExtensions.
import { cameraScale, compareSizes, formatSize, objects, screenSize, sizeRatio, stopCount } from "./scale.ts";

assert.equal(new Set(objects.map(({ id }) => id)).size, objects.length);
assert(objects.every((object, index) => object.diameterKm > (objects[index - 1]?.diameterKm ?? 0)));
assert(objects.every((object) => !object.rangeKm ||
  object.diameterKm >= object.rangeKm[0] && object.diameterKm <= object.rangeKm[1]));

for (const width of [288, 360, 390, 1280]) {
  const focus = width * .6;
  let prior = 0;
  for (let step = 0; step <= 1000; step++) {
    const scale = cameraScale(step / 1000, focus);
    assert(scale > prior, "Zoom must be strictly increasing");
    prior = scale;
    for (const object of objects) {
      const pixels = screenSize(object.diameterKm, scale, width);
      assert(pixels >= 2 && pixels <= width * .9, "Object must stay inside the render limits");
    }
  }
  for (const [index, object] of objects.entries()) {
    const scale = cameraScale(index / stopCount, focus);
    assert(Math.abs(screenSize(object.diameterKm, scale, width) - focus) < .01);
  }
}

const byId = (id: string) => objects.find((object) => object.id === id)!;
assert(Math.abs(sizeRatio(byId("earth"), byId("moon")) - 3.7) < .05);
assert(Math.abs(sizeRatio(byId("sun"), byId("earth")) - 109) < .25);
assert.equal(compareSizes(byId("earth"), byId("jupiter")), "Jupiter is about 11 times as big as Earth.");
assert.equal(compareSizes(byId("child"), byId("whale")), "A blue whale is about 25 times as big as a child.");
for (const [size, formatted] of [
  [.0012, "1.2 m"], [.03, "30 m"], [8.84886, "8.8 km"],
  [12742, "12,700 km"], [1391400, "1.4 million km"], [1063000000, "1.1 billion km"],
] as const) {
  assert.equal(formatSize(size), formatted);
}
console.log("Space Scale: ordered data, monotonic zoom, pixel bounds, comparisons, and formatting passed.");
