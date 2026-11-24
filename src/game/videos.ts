import { getLanguage } from "../i18n";
import type { AgeBand } from "../../shared/types";
import videos from "../../content/videos.json";

export function videosFor(ageBand: AgeBand, language = getLanguage()) {
  return videos.filter(video => video.ageBand === ageBand && video.language === language);
}
