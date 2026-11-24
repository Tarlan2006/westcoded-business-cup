import type { CatalogueVideo } from "../game/videos";
import { videoTime } from "../game/videoQueue";
import { t } from "../i18n";

export function VideoPlaylist({ videos, index, disabled, onChoose }: {
  videos: CatalogueVideo[]; index: number; disabled?: boolean; onChoose: (position: number) => void;
}) {
  return <div className="toddler-episodes">{videos.map((video, position) => <button type="button" key={video.id} disabled={disabled || position === index}
        className="toddler-card" aria-label={`${t(position === index ? "toddlerCinema.nowShowing" : "cinema.playNext")}: ${video.title}`} aria-current={position === index ? "true" : undefined}
        onClick={() => onChoose(position)}>
        <div className="toddler-thumbnail"><img src={`https://i.ytimg.com/vi/${video.id}/mqdefault.jpg`} alt="" loading="lazy"
          onError={event => { event.currentTarget.hidden = true; }} /><span>{position === index ? t("toddlerCinema.nowShowingAlt") : String(position + 1).padStart(2, "0")}</span></div>
        <span className="toddler-card-title">{video.title}</span><span className="toddler-card-detail">{videoTime(video.durationSeconds)} · {video.channel}</span>
      </button>)}</div>;
}
