import { APP_NAME } from "../brand";
import { useContext, useEffect, useState } from "react";
import type { AgeBand } from "../../shared/types";
import { useSoundEnabled, uiSound } from "../audio/sfx";
import { PrototypeHeader } from "../components/PrototypeHeader";
import { ActivityNavigation } from "../components/ActivityHeader";
import { videosFor } from "../game/videos";
import { Mascot, MascotHead } from "../components/Mascot";
import { ToddlerCinema } from "./ToddlerCinema";
import { YouTubeVideo } from "../components/YouTubeVideo";

type VideoCatalogProps = {
  ageBand: AgeBand; name: string; onParents: () => void; onHome: () => void;
  onOpen: (id: string) => void; onPlay: (videoId?: string) => void;
};

export function VideoCatalog(props: VideoCatalogProps) {
  return props.ageBand === "1-2" ? <ToddlerCinema {...props} /> : <StandardVideoCatalog {...props} />;
}

function StandardVideoCatalog({ ageBand, name, onParents, onHome, onOpen, onPlay }: VideoCatalogProps) {
  const videos = videosFor(ageBand);
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [autoplay, setAutoplay] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const sound = useSoundEnabled();
  const navigation = useContext(ActivityNavigation);
  const selected = videos[index];
  useEffect(() => {
    if (countdown === null) return;
    const timer = window.setTimeout(() => {
      if (countdown > 1) setCountdown(countdown - 1);
      else {
        setCountdown(null);
        const next = videos[index + 1];
        if (!next) return;
        setIndex(index + 1);
        setAutoplay(true);
        onOpen(next.id);
      }
    }, 1000);
    return () => window.clearTimeout(timer);
  }, [countdown, index, videos, onOpen]);

  function choose(position: number) {
    uiSound("chirp", sound);
    setIndex(position);
    setPlaying(false);
    setAutoplay(false);
    setCountdown(null);
  }

  const actions = <div className={playing ? "flex flex-wrap items-center justify-between gap-2" : "video-frame-controls absolute bottom-4 left-4 right-4 flex flex-wrap items-center justify-between gap-2"}>
    <button type="button" disabled={!selected} onClick={() => index + 1 >= videos.length ? onPlay(selected?.id) : choose(index + 1)}
      className="px-5 py-2.5 rounded-2xl bg-[#2A1F8A] hover:bg-[#3A2BB5] border-2 border-[#8B5CF6] text-white font-display font-bold text-sm sm:text-base flex items-center gap-2 cursor-pointer">
      <span aria-hidden="true">⏭️</span> Next video
    </button>
    <button type="button" onClick={() => onPlay(selected?.id)}
      className="px-6 py-3 rounded-2xl btn-game btn-mint text-[#062C1E] font-display font-bold text-base sm:text-lg flex items-center gap-2 cursor-pointer">
      <MascotHead size={26} className="bg-[#FFD13B]" /> Play with {APP_NAME} Now!
    </button>
  </div>;

  return <main id="screen-video" className="prototype-screen relative flex-1 w-full max-w-4xl mx-auto px-4 py-4 flex flex-col justify-between z-10 space-y-4" aria-label="Video library">
    {selected && <h1 className="sr-only">Video library</h1>}
    {navigation && <nav className="sr-only" aria-label="Breadcrumb">{navigation.breadcrumb}</nav>}
    <PrototypeHeader name={name} label="Videos" detail={selected ? `Episode ${index + 1} of ${videos.length} • ${selected.channel}` : "Watch with a grown-up"}
      onParents={onParents} onHome={onHome} />
    <div className="flex-1 flex flex-col justify-center">
      <div className={`relative w-full aspect-video max-h-[430px] mx-auto rounded-3xl bg-[#120B4D] border-4 border-[#6C47FF] shadow-[0_14px_40px_rgba(0,0,0,0.5)] overflow-hidden ${playing ? "prototype-frame-video" : "prototype-video-placeholder flex flex-col items-center justify-center p-6 text-center"}`}>
        {playing && selected ? <YouTubeVideo key={selected.id} id={selected.id} title={selected.title} autoplay={autoplay}
          onPlaying={() => setCountdown(null)}
          onEnded={() => {
            if (selected.id === "CH1lo6lwQ6o") onPlay(selected.id);
            else if (index + 1 < videos.length) setCountdown(5);
          }} /> : <>
          <div className="absolute top-4 left-4 right-4 flex items-start justify-between gap-3">
            <nav aria-label="Video episodes" className="flex items-center gap-2 min-h-6">
              {videos.length === 0 && <span aria-hidden="true" className="block w-8 h-2.5 rounded-full bg-[#FFD13B]" />}
              {videos.map((video, position) => <button type="button" key={video.id} onClick={() => choose(position)}
                aria-label={video.title} aria-current={index === position ? "true" : undefined} className="py-2">
                <span aria-hidden="true" className={`block w-8 h-2.5 rounded-full transition-all ${index === position ? "bg-[#FFD13B]" : "bg-white/25"}`} />
              </button>)}
            </nav>
            <span className="px-3 py-1 rounded-full bg-black/40 text-xs font-black text-indigo-200">{selected ? "Watch on YouTube ✨" : "Videos coming soon ✨"}</span>
          </div>
          <div className="video-frame-content space-y-3 max-w-md">
            {selected ? <button type="button" className="max-w-full space-y-3 rounded-xl" aria-label={`Open video: ${selected.title}`}
              onClick={() => { setPlaying(true); onOpen(selected.id); }}>
              <Mascot pose="tablet" className="video-mascot" eager />
              <span className="block font-display text-2xl sm:text-3xl font-bold text-white">{selected.title}</span>
              <span className="block text-xs sm:text-sm font-bold text-indigo-200">▶ Watch video · Plays on YouTube</span>
            </button> : <>
              <Mascot pose="tablet" className="video-mascot" eager />
              <h1 className="font-display text-2xl sm:text-3xl font-bold text-white">More videos coming soon</h1>
              <p className="text-xs sm:text-sm font-bold text-indigo-200">Play with {APP_NAME} while we get the next episode ready.</p>
            </>}
          </div>
          {actions}
        </>}
      </div>
      {playing && <div className="mt-4 space-y-3">
        {countdown !== null && <div className="flex flex-wrap items-center justify-between gap-2">
          <p role="status" aria-live="polite">Next video in {countdown} seconds</p>
          <button type="button" className="min-h-12 px-4 rounded-2xl btn-game" onClick={() => setCountdown(null)}>Cancel autoplay</button>
        </div>}
        <p className="text-xs text-indigo-300">Videos play on YouTube</p>
        {actions}
      </div>}
    </div>
  </main>;
}
