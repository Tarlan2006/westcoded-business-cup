import { t, useLanguage } from "../i18n/index";
import { useContext, useEffect, useState } from "react";
import type { AgeBand } from "../../shared/types";
import { useSoundEnabled, uiSound } from "../audio/sfx";
import { PrototypeHeader } from "../components/PrototypeHeader";
import { ActivityNavigation } from "../components/ActivityHeader";
import { SessionActivity, useSessionSeconds } from "../components/SessionControls";
import { nextVideoIndex, planVideos, playbackBudget, videoReserveSeconds, videoTime } from "../game/videoQueue";
import { videosFor, type CatalogueVideo } from "../game/videos";
import { ToddlerCinema } from "./ToddlerCinema";
import { YouTubeVideo } from "../components/YouTubeVideo";

type VideoCatalogProps = {
  watchedCount: number; ageBand: AgeBand; name: string; onParents: () => void; onHome: () => void;
  onOpen: (id: string) => void; onPlay: (videoId?: string) => void;
};

export function VideoCatalog(props: VideoCatalogProps) {
  const language = useLanguage();
  return <SessionVideoCatalog key={language + props.ageBand} {...props} />;
}

type PlaylistProps = VideoCatalogProps & { videos: CatalogueVideo[]; available: number };

function SessionVideoCatalog(props: VideoCatalogProps) {
  const session = useContext(SessionActivity);
  const seconds = useSessionSeconds();
  const deadline = session?.endsAt;
  const [entry] = useState(() => ({
    now: Date.now(), catalogue: videosFor(props.ageBand), offset: props.watchedCount,
    pause: props.ageBand === "1-2" ? 30 : 5,
  }));
  const [playlist, setPlaylist] = useState(() => ({
    deadline, videos: planVideos(entry.catalogue, playbackBudget(deadline, entry.now), entry.pause, entry.offset),
  }));
  useEffect(() => {
    if (deadline === undefined || deadline === playlist.deadline) return;
    setPlaylist({ deadline, videos: planVideos(entry.catalogue, playbackBudget(deadline, entry.now), entry.pause,
      entry.offset, playlist.videos) });
  }, [deadline, entry, playlist]);

  const available = seconds === null ? playbackBudget(deadline) : Math.max(0, seconds - videoReserveSeconds);
  if (!playlist.videos.length || available <= 0) return <main id="screen-video" className="prototype-screen w-full max-w-4xl mx-auto px-4 py-4 space-y-4">
    <PrototypeHeader name={props.name} label={t("videoCatalog.videos")} onParents={props.onParents} onHome={props.onHome} />
    <section className="cinema-card cinema-details">
      <h2>{t("videoCatalog.timeForGame")}</h2>
      <button type="button" className="cinema-action btn-mint" onClick={() => props.onPlay()}>{t("video.playNow")}</button>
    </section>
  </main>;
  const childProps = { ...props, videos: playlist.videos, available };
  return props.ageBand === "1-2" ? <ToddlerCinema {...childProps} /> : <StandardVideoCatalog {...childProps} />;
}

function StandardVideoCatalog({ videos, available, name, onParents, onHome, onOpen, onPlay }: PlaylistProps) {
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [watching, setWatching] = useState(false);
  const [unavailable, setUnavailable] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const sound = useSoundEnabled();
  const navigation = useContext(ActivityNavigation);
  const session = useContext(SessionActivity);
  const finishing = session?.finishing ?? false;
  const selected = videos[index];
  const fits = selected.durationSeconds <= available;
  const nextManual = nextVideoIndex(videos, index, available, true);

  useEffect(() => {
    if (countdown === null || finishing) return;
    const timer = window.setTimeout(() => {
      if (session && !session.canStartActivity()) return;
      if (countdown > 1) setCountdown(countdown - 1);
      else {
        setCountdown(null);
        const next = nextVideoIndex(videos, index, playbackBudget(session?.endsAt), false);
        if (next < 0) return;
        setIndex(next);
        setUnavailable(false);
        setWatching(false);
      }
    }, 1000);
    return () => window.clearTimeout(timer);
  }, [countdown, index, videos, session, finishing]);

  useEffect(() => {
    if (finishing && !watching) session?.finishActivity();
  }, [finishing, watching, session]);

  function choose(position: number) {
    if (position < 0 || videos[position].durationSeconds > playbackBudget(session?.endsAt) || (session && !session.canStartActivity())) return;
    uiSound("chirp", sound);
    setIndex(position);
    setPlaying(false);
    setWatching(false);
    setUnavailable(false);
    setCountdown(null);
  }

  return <main id="screen-video" className="prototype-screen relative w-full max-w-4xl mx-auto px-4 py-4 space-y-4" aria-label={t("activitySuggestions.videoLibrary")}>
    <h1 className="sr-only">{t("activitySuggestions.videoLibrary")}</h1>
    {navigation && <nav className="sr-only" aria-label={t("activityHeader.breadcrumb")}>{navigation.breadcrumb}</nav>}
    <PrototypeHeader name={name} label={t("videoCatalog.videos")} detail={selected ? t("videoCatalog.episodeOf", { value1: index + 1, value2: videos.length, value3: selected.channel }) : undefined}
      onParents={onParents} onHome={onHome} />
    {selected && <section className="cinema-card" inert={finishing} aria-labelledby="video-title">
      <div className="cinema-stage video-frame-content">
        {playing && !unavailable ? <YouTubeVideo key={selected.id} id={selected.id} title={selected.title} autoplay
          onPlaying={() => { setWatching(true); setCountdown(null); onOpen(selected.id); }}
          onPaused={() => setWatching(false)}
          onError={() => { setWatching(false); setUnavailable(true); setCountdown(null); }}
          onEnded={() => {
            setWatching(false);
            if (session && !session.canStartActivity()) { session.finishActivity(); return; }
            if (nextVideoIndex(videos, index, playbackBudget(session?.endsAt) - 5, false) >= 0) setCountdown(5);
          }} /> :
          <button type="button" className="cinema-poster" disabled={!fits} aria-label={t("videoCatalog.openVideoWatchVideoPlaysOnYoutube", { value1: selected.title })}
            onClick={() => { if (selected.durationSeconds <= playbackBudget(session?.endsAt) && (!session || session.canStartActivity())) { setUnavailable(false); setPlaying(true); } }}>
            <img key={selected.id} src={`https://i.ytimg.com/vi/${selected.id}/hqdefault.jpg`} alt=""
              onError={event => { event.currentTarget.hidden = true; }} />
            <span className="cinema-play-icon" aria-hidden="true">▶</span>
            <span className="cinema-play-label">{unavailable ? t("toddlerCinema.tryAgain") : t("videoCatalog.playInline")}</span>
          </button>}
      </div>
      <div className="cinema-details">
        <h2 id="video-title">{selected.title}</h2>
        <p>{videoTime(selected.durationSeconds)}{!fits && (!playing || unavailable) ? " · " + t("videoCatalog.timeForGame") : ""}</p>
        {unavailable && <p role="status">{t("toddlerCinema.thisVideoNeedsALittleHelp")}</p>}
        <div className="cinema-actions">
          {fits && <a className="cinema-action" href={`https://www.youtube.com/watch?v=${selected.id}`} target="_blank" rel="noopener noreferrer">{t("videoCatalog.openYoutube")}</a>}
          {nextManual >= 0 && <button className="cinema-action" type="button" onClick={() => choose(nextManual)}>{t("videoCatalog.nextVideo")}</button>}
          <button className="cinema-action btn-mint" type="button" onClick={() => onPlay(selected.id)}>{t("video.playNow")}</button>
        </div>
        {countdown !== null && <div className="cinema-countdown">
          <p role="status">{t("videoCatalog.nextVideoInSeconds", { countdown })}</p>
          <button type="button" className="cinema-action" onClick={() => setCountdown(null)}>{t("videoCatalog.cancelAutoplay")}</button>
        </div>}
      </div>
    </section>}
    {!selected && <p>{t("videoCatalog.moreVideosComingSoon")}</p>}
  </main>;
}
