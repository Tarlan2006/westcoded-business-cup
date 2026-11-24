import assert from "node:assert/strict";
import videos from "../content/videos.json" with { type: "json" };
import { nextVideoIndex, planVideos, playbackBudget, videoTime } from "../src/game/videoQueue.ts";

assert.equal(new Set(videos.map(video => video.id)).size, videos.length);
assert.equal(playbackBudget(59_000, 0), 0);
assert.equal(playbackBudget(600_000, 0), 540);
for (const video of videos) {
  assert.match(video.id, /^[a-zA-Z0-9_-]{11}$/);
  assert.ok(Number.isInteger(video.durationSeconds) && video.durationSeconds > 0, video.title);
}
for (const language of ["kk", "en"]) {
  for (const age of ["1-2", "3-5", "6-8"]) {
    const catalogue = videos.filter(video => video.language === language && video.ageBand === age);
    const pause = age === "1-2" ? 30 : 5;
    const duration = queue => queue.reduce((sum, video) => sum + video.durationSeconds, 0)
      + Math.max(0, queue.length - 1) * pause;
    if (language === "kk") assert.ok(catalogue.length >= 20);
    for (const minutes of [5, 10, 20, 30, 60, 90]) {
      const budget = playbackBudget(minutes * 60_000, 1000);
      for (let offset = 0; offset < catalogue.length; offset++) {
        const queue = planVideos(catalogue, budget, pause, offset);
        assert.ok(queue.length > 0 && duration(queue) <= budget);
        assert.equal(new Set(queue.map(video => video.id)).size, queue.length);
        const longer = planVideos(catalogue, budget + 300, pause, offset, queue);
        assert.deepEqual(longer.slice(0, queue.length), queue);
        assert.ok(duration(longer) <= budget + 300);
        assert.equal(nextVideoIndex(queue, queue.length - 1, budget, false), -1);
        assert.equal(nextVideoIndex(queue, 0, 0, true), -1);
      }
    }
    assert.deepEqual(planVideos(catalogue, 0, pause), []);
    const ten = planVideos(catalogue, 539, pause);
    console.log(language, age, catalogue.length, "videos;", ten.length, "in a 10-minute session,", videoTime(duration(ten)), "with breaks");
  }
}
