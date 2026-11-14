import { useState } from "react";
import type { AgeBand } from "../../shared/types";
import videos from "../../content/videos.json";
import { ActivityTile, LearnPage } from "./Home";

export function VideoCatalog({ ageBand, onBack, onOpen, onParent }: {
  ageBand: AgeBand; onBack?: () => void; onOpen: (id: string) => void; onParent?: () => void;
}) {
  const entries = videos.filter((video) => video.ageBand === ageBand && /^[A-Za-z0-9_-]{11}$/.test(video.id) && video.id !== "REPLACE_ME");
  const [selectedId, setSelectedId] = useState<string>();
  const selected = entries.find((video) => video.id === selectedId);

  return (
    <LearnPage title="Video library" onBack={selected ? () => setSelectedId(undefined) : onBack}>
      {selected ? (
        <div className="panel video-panel">
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
      ) : entries.length ? (
        <div className="activity-grid">
          {entries.map((video) => (
            <ActivityTile key={video.id} icon="▶" title={video.title} onClick={() => {
              setSelectedId(video.id);
              onOpen(video.id);
            }}>{video.channel}</ActivityTile>
          ))}
        </div>
      ) : <p className="panel learn-description">More videos coming soon</p>}
      {onParent && <button type="button" className="quiet-button" onClick={onParent}>Parent settings</button>}
    </LearnPage>
  );
}
