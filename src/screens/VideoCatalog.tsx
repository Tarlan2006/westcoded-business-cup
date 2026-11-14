import type { AgeBand } from "../../shared/types";
import { videosFor } from "../game/videos";
import { LearnPage, VideoShelf } from "./Home";

export function VideoCatalog({ ageBand, id, onBack, onOpen }: {
  ageBand: AgeBand; id?: string; onBack: () => void; onOpen: (id: string) => void;
}) {
  const selected = videosFor(ageBand).find((video) => video.id === id);

  return (
    <LearnPage title="Video library" onBack={onBack}>
      {selected ? (
        <div className="panel video-panel centered-card">
          <h2>{selected.title}</h2>
          <iframe
            className="video-player"
            title={selected.title}
            src={`https://www.youtube-nocookie.com/embed/${selected.id}?rel=0&modestbranding=1&playsinline=1`}
            allow="encrypted-media; picture-in-picture"
            allowFullScreen
            referrerPolicy="strict-origin-when-cross-origin"
          />
          <p className="learn-description">Videos are hosted on YouTube</p>
        </div>
      ) : <VideoShelf ageBand={ageBand} onSelect={onOpen} />}
    </LearnPage>
  );
}
