import { useState } from "react";
import type { AgeBand } from "../../shared/types";
import { useSoundEnabled, uiSound } from "../audio/sfx";
import { PrototypeHeader } from "../components/PrototypeHeader";
import { videosFor } from "../game/videos";

export function VideoCatalog({ ageBand, name, onParents, onHome, onOpen, onPlay }: {
  ageBand: AgeBand; name: string; onParents: () => void; onHome: () => void;
  onOpen: (id: string) => void; onPlay: () => void;
}) {
  const videos = videosFor(ageBand);
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const sound = useSoundEnabled();
  const selected = videos[index];
  function choose(position: number) {
    uiSound("chirp", sound);
    setIndex(position);
    setPlaying(false);
  }

  const actions = <div className={playing ? "flex flex-wrap items-center justify-between gap-2" : "absolute bottom-4 left-4 right-4 flex flex-wrap items-center justify-between gap-2"}>
    <button type="button" onClick={() => index + 1 >= videos.length ? onPlay() : choose(index + 1)}
      className="px-5 py-2.5 rounded-2xl bg-[#2A1F8A] hover:bg-[#3A2BB5] border-2 border-[#8B5CF6] text-white font-display font-bold text-sm sm:text-base flex items-center gap-2 cursor-pointer">
      <span aria-hidden="true">⏭️</span> Next Video in Catalog
    </button>
    <button type="button" onClick={onPlay}
      className="px-6 py-3 rounded-2xl btn-game btn-mint text-[#062C1E] font-display font-bold text-base sm:text-lg flex items-center gap-2 cursor-pointer">
      <span aria-hidden="true">🤖</span> Play with Bleep Now!
    </button>
  </div>;

  return <main id="screen-video" className="prototype-screen relative flex-1 w-full max-w-4xl mx-auto px-4 py-4 flex flex-col justify-between z-10 space-y-4" aria-label="Video library">
    <PrototypeHeader name={name} label="Video Catalog" detail={selected ? `Episode ${index + 1} of ${videos.length} • ${selected.channel}` : "Watch with a grown-up"}
      onParents={onParents} onHome={onHome} />
    <div className="flex-1 flex flex-col justify-center">
      <div className={`relative w-full aspect-video max-h-[430px] mx-auto rounded-3xl bg-[#120B4D] border-4 border-[#6C47FF] shadow-[0_14px_40px_rgba(0,0,0,0.5)] overflow-hidden ${playing ? "prototype-frame-video" : "prototype-video-placeholder flex flex-col items-center justify-center p-6 text-center"}`}>
        {playing && selected ? <iframe key={selected.id} title={selected.title} className="absolute inset-0 w-full h-full"
          src={`https://www.youtube-nocookie.com/embed/${selected.id}?rel=0&modestbranding=1&playsinline=1`}
          allow="encrypted-media; picture-in-picture" allowFullScreen referrerPolicy="strict-origin-when-cross-origin" /> : <>
          <div className="absolute top-4 left-4 right-4 flex items-start justify-between gap-3">
            <nav aria-label="Video episodes" className="flex items-center gap-2 min-h-6">
              {videos.map((video, position) => <button type="button" key={video.id} onClick={() => choose(position)}
                aria-label={video.title} aria-current={index === position ? "true" : undefined} className="py-2">
                <span aria-hidden="true" className={`block w-8 h-2.5 rounded-full transition-all ${index === position ? "bg-[#FFD13B]" : "bg-white/25"}`} />
              </button>)}
            </nav>
            <span className="px-3 py-1 rounded-full bg-black/40 text-xs font-black text-indigo-200">{selected ? "Watch on YouTube ✨" : "Curated Video Slot ✨"}</span>
          </div>
          <div className="space-y-3 max-w-md pb-9 sm:pb-0">
            {selected ? <button type="button" className="max-w-full space-y-3 rounded-xl" aria-label={`Open video: ${selected.title}`}
              onClick={() => { setPlaying(true); onOpen(selected.id); }}>
              <span aria-hidden="true" className="block text-6xl sm:text-7xl animate-bounce">{ageBand === "1-2" ? "👏" : ageBand === "3-5" ? "🚀" : "🪐"}</span>
              <span className="block font-display text-2xl sm:text-3xl font-bold text-white">{selected.title}</span>
              <span className="block text-xs sm:text-sm font-bold text-indigo-200">▶ Open video · Hosted on YouTube</span>
            </button> : <>
              <p aria-hidden="true" className="text-6xl sm:text-7xl animate-bounce">{ageBand === "1-2" ? "👏" : "🚀"}</p>
              <h1 className="font-display text-2xl sm:text-3xl font-bold text-white">More videos coming soon</h1>
              <p className="text-xs sm:text-sm font-bold text-indigo-200">Play with Bleep while we get the next episode ready.</p>
            </>}
          </div>
          {actions}
        </>}
      </div>
      {playing && <div className="mt-4 space-y-3">
        <p className="text-xs text-indigo-300">Videos are hosted on YouTube</p>
        {actions}
      </div>}
    </div>
  </main>;
}
