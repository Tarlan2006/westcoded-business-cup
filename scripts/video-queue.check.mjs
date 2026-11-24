import assert from "node:assert/strict";
import videos from "../content/videos.json" with { type: "json" };
import { nextVideoIndex, planVideos } from "../src/game/videoQueue.ts";

assert.equal(new Set(videos.map(video => video.id)).size, videos.length);
for (const video of videos) {
  assert.match(video.id, /^[a-zA-Z0-9_-]{11}$/);
  assert.ok(Number.isInteger(video.durationSeconds) && video.durationSeconds > 0, video.title);
}
for (const language of ["kk", "en"]) {
  for (const age of ["1-2", "3-5", "6-8"]) {
    const catalogue = videos.filter(video => video.language === language && video.ageBand === age);
    assert.ok(catalogue.length > 0);
    for (let offset = 0; offset <= catalogue.length; offset++) {
      const queue = planVideos(catalogue, offset);
      assert.equal(queue.length, catalogue.length);
      assert.deepEqual(new Set(queue), new Set(catalogue));
      assert.equal(queue[0], catalogue[offset % catalogue.length]);
      assert.equal(nextVideoIndex(queue, queue.length - 1), queue.length > 1 ? 0 : -1);
    }
    console.log(language, age, catalogue.length, "videos available");
  }
}
assert.deepEqual(planVideos([]), []);
assert.equal(nextVideoIndex([], 0), -1);
