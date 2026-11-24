export interface TimedVideo { id: string; durationSeconds: number }

export const videoReserveSeconds = 60;

export function playbackBudget(endsAt?: number, now = Date.now()) {
  return endsAt === undefined ? Infinity : Math.max(0, Math.floor((endsAt - now) / 1000) - videoReserveSeconds);
}

// Keep existing episodes in place when a parent extends the session.
export function planVideos<T extends TimedVideo>(catalogue: readonly T[], seconds: number, pause: number,
  offset = 0, existing: readonly T[] = []): T[] {
  const queue = [...existing];
  const seen = new Set(queue.map(video => video.id));
  let left = seconds - queue.reduce((sum, video) => sum + video.durationSeconds, 0) - Math.max(0, queue.length - 1) * pause;
  for (let n = 0; n < catalogue.length; n++) {
    const video = catalogue[(n + offset) % catalogue.length];
    const cost = video.durationSeconds + (queue.length ? pause : 0);
    if (seen.has(video.id) || cost > left) continue;
    queue.push(video);
    seen.add(video.id);
    left -= cost;
  }
  return queue;
}

export function nextVideoIndex(videos: readonly TimedVideo[], index: number, seconds: number, wrap: boolean) {
  const count = wrap ? videos.length - 1 : videos.length - index - 1;
  for (let step = 1; step <= count; step++) {
    const next = (index + step) % videos.length;
    if (videos[next].durationSeconds <= seconds) return next;
  }
  return -1;
}

export function videoTime(seconds: number) {
  return Math.floor(seconds / 60) + ":" + String(seconds % 60).padStart(2, "0");
}
