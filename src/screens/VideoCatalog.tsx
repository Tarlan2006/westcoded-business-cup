import { t } from "../i18n/index";
import { useContext, useEffect, useState } from "react";
import type { AgeBand } from "../../shared/types";
import { useSoundEnabled, uiSound } from "../audio/sfx";
import { PrototypeHeader } from "../components/PrototypeHeader";
import { ActivityNavigation } from "../components/ActivityHeader";
import { SessionActivity } from "../components/SessionControls";
import { videosFor } from "../game/videos";
import { Mascot } from "../components/Mascot";
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
  const [watching, setWatching] = useState(false);
  const [autoplay, setAutoplay] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const sound = useSoundEnabled();
  const navigation = useContext(ActivityNavigation);
  const session = useContext(SessionActivity);
  const finishing = session?.finishing ?? false;
  const selected = videos[index];

  useEffect(() => {
    if (countdown === null || finishing) return;
    const timer = window.setTimeout(() => {
      if (session && !session.canStartActivity()) return;
      if (countdown > 1) setCountdown(countdown - 1);
      else {
        setCountdown(null);
        const next = videos[index + 1];
        if (!next) return;
        setIndex(index + 1);
        setAutoplay(true);
        setWatching(true);
        onOpen(next.id);
      }
    }, 1000);
    return () => window.clearTimeout(timer);
  }, [countdown, index, videos, onOpen, session, finishing]);

  useEffect(() => {
    if (finishing && !watching) session?.finishActivity();
  }, [finishing, watching, session]);

  function choose(position: number) {
    if (session && !session.canStartActivity()) return;
    uiSound("chirp", sound);
    setIndex(position);
    setPlaying(false);
    setWatching(false);
    setAutoplay(false);
    setCountdown(null);
  }

  const actions = <div className={playing ? "flex flex-wrap items-center justify-between gap-2" : "video-frame-controls absolute bottom-4 left-4 right-4 flex flex-wrap items-center justify-between gap-2"}>
    <button type="button" disabled={!selected || finishing} onClick={() => index + 1 >= videos.length ? onPlay(selected?.id) : choose(index + 1)}
      className="px-5 py-2.5 rounded-2xl bg-[#2A1F8A] hover:bg-[#3A2BB5] border-2 border-[#8B5CF6] text-white font-display font-bold text-sm sm:text-base flex items-center gap-2 cursor-pointer">
      <span aria-hidden="true">⏭️</span> {t("videoCatalog.nextVideo")}</button>
    <button type="button" disabled={finishing} onClick={() => onPlay(selected?.id)}
      className="px-6 py-3 rounded-2xl btn-game btn-mint text-[#062C1E] font-display font-bold text-base sm:text-lg flex items-center gap-2 cursor-pointer">
      <Mascot pose="point" size={48} /> {t("video.playNow")}</button>
  </div>;

  return <main id="screen-video" className="prototype-screen relative flex-1 w-full max-w-4xl mx-auto px-4 py-4 flex flex-col justify-between z-10 space-y-4" aria-label={t("activitySuggestions.videoLibrary")}>
    {selected && <h1 className="sr-only">{t("activitySuggestions.videoLibrary")}</h1>}
    {navigation && <nav className="sr-only" aria-label={t("activityHeader.breadcrumb")}>{navigation.breadcrumb}</nav>}
    <PrototypeHeader name={name} label={t("videoCatalog.videos")} detail={selected ? t("videoCatalog.episodeOf", { value1: index + 1, value2: videos.length, value3: selected.channel }) : t("videoCatalog.watchWithAGrownUp")}
      onParents={onParents} onHome={onHome} />
    <div className="flex-1 flex flex-col justify-center">
      <div inert={finishing} className={`relative w-full aspect-video max-h-[430px] mx-auto rounded-3xl bg-[#120B4D] border-4 border-[#6C47FF] shadow-[0_14px_40px_rgba(0,0,0,0.5)] overflow-hidden ${playing ? "prototype-frame-video" : "prototype-video-placeholder flex flex-col items-center justify-center p-6 text-center"}`}>
        {playing && selected ? <YouTubeVideo key={selected.id} id={selected.id} title={selected.title} autoplay={autoplay}
          onPlaying={() => { setWatching(true); setCountdown(null); }}
          onPaused={() => setWatching(false)}
          onEnded={() => {
            setWatching(false);
            if (session && !session.canStartActivity()) { session.finishActivity(); return; }
            if (selected.id === "CH1lo6lwQ6o") onPlay(selected.id);
            else if (index + 1 < videos.length) setCountdown(5);
          }} /> : <>
          <div className="absolute top-4 left-4 right-4 flex items-start justify-between gap-3">
            <nav aria-label={t("videoCatalog.videoEpisodes")} className="flex items-center gap-2 min-h-6">
              {videos.length === 0 && <span aria-hidden="true" className="block w-8 h-2.5 rounded-full bg-[#FFD13B]" />}
              {videos.map((video, position) => <button type="button" key={video.id} onClick={() => choose(position)}
                aria-label={video.title} aria-current={index === position ? "true" : undefined} className="py-2">
                <span aria-hidden="true" className={`block w-8 h-2.5 rounded-full transition-all ${index === position ? "bg-[#FFD13B]" : "bg-white/25"}`} />
              </button>)}
            </nav>
            <span className="px-3 py-1 rounded-full bg-black/40 text-xs font-black text-indigo-200">{selected ? t("videoCatalog.watchOnYoutube") : t("videoCatalog.videosComingSoon")}</span>
          </div>
          <div className="video-frame-content space-y-3 max-w-md">
            {selected ? <button type="button" className="max-w-full space-y-3 rounded-xl" aria-label={t("videoCatalog.openVideoWatchVideoPlaysOnYoutube", { value1: selected.title })}
              onClick={() => {
                if (session && !session.canStartActivity()) return;
                setPlaying(true);
                setWatching(true);
                onOpen(selected.id);
              }}>
              <Mascot pose="tablet" className="video-mascot" />
              <span className="block font-display text-2xl sm:text-3xl font-bold text-white">{selected.title}</span>
              <span className="block text-xs sm:text-sm font-bold text-indigo-200">{t("videoCatalog.watchVideoPlaysOnYoutube")}</span>
            </button> : <>
              <Mascot pose="tablet" className="video-mascot" />
              <h1 className="font-display text-2xl sm:text-3xl font-bold text-white">{t("videoCatalog.moreVideosComingSoon")}</h1>
              <p className="text-xs sm:text-sm font-bold text-indigo-200">{t("videoCatalog.playWithWhileWeGetTheNext")}</p>
            </>}
          </div>
          {actions}
        </>}
      </div>
      {playing && <div className="mt-4 space-y-3">
        {countdown !== null && <div className="flex flex-wrap items-center justify-between gap-2">
          <p role="status" aria-live="polite">{t("videoCatalog.nextVideoInSeconds", { countdown })}</p>
          <button type="button" className="min-h-12 px-4 rounded-2xl btn-game" onClick={() => setCountdown(null)}>{t("videoCatalog.cancelAutoplay")}</button>
        </div>}
        <p className="text-xs text-indigo-300">{t("videoCatalog.videosPlayOnYoutube")}</p>
        {actions}
      </div>}
    </div>
  </main>;
}
