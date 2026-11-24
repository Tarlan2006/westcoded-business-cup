export function planVideos<T>(catalogue: readonly T[], offset = 0): T[] {
  if (!catalogue.length) return [];
  const start = offset % catalogue.length;
  return [...catalogue.slice(start), ...catalogue.slice(0, start)];
}

export function nextVideoIndex(videos: readonly unknown[], index: number) {
  return videos.length > 1 ? (index + 1) % videos.length : -1;
}

export function videoTime(seconds: number) {
  return Math.floor(seconds / 60) + ":" + String(seconds % 60).padStart(2, "0");
}
