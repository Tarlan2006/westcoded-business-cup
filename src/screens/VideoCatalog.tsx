import type { AgeBand } from "../../shared/types";
import { videosFor } from "../game/videos";
import { LearnPage, VideoShelf } from "./Home";
import { GameButton } from "../components/GameUI";

export function VideoCatalog({ ageBand, id, onBack, onOpen }: {
  ageBand: AgeBand; id?: string; onBack: () => void; onOpen: (id: string) => void;
}) {
  const videos = videosFor(ageBand);
  const index = videos.findIndex((video) => video.id === id);
  const selected = videos[index];

  return (
    <LearnPage title="Video library" onBack={onBack}>
      <p className="video-label">✦ Hand-picked videos</p>
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
          {videos.length > 1 && <>
            <nav className="video-episodes" aria-label="Video episodes">{videos.map((video, position) => (
              <button type="button" className="quiet-button" key={video.id} aria-label={video.title}
                aria-current={position === index ? "true" : undefined}
                onClick={() => { if (position !== index) onOpen(video.id); }}><span aria-hidden="true">●</span></button>
            ))}</nav>
            <div className="video-actions">
              <GameButton tone="purple" disabled={index === 0} onClick={() => onOpen(videos[index - 1].id)}>← Previous</GameButton>
              <GameButton disabled={index === videos.length - 1} onClick={() => onOpen(videos[index + 1].id)}>Next →</GameButton>
            </div>
          </>}
        </div>
      ) : <VideoShelf ageBand={ageBand} onSelect={onOpen} />}
    </LearnPage>
  );
}
