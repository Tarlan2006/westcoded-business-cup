import { contentText } from "../i18n";
import type { AgeBand } from "../../shared/types";
import videos from "../../content/videos.json";

export function videosFor(ageBand: AgeBand) {
  return videos.filter((video) => video.ageBand === ageBand && /^[A-Za-z0-9_-]{11}$/.test(video.id) && video.id !== "REPLACE_ME").map(video => ({ ...video, title: contentText("video." + video.id + ".title") }));
}
