import { VideoPlaylist } from "../components/VideoPlaylist";
import { CreatorCredit } from "../components/CreatorCredit";
import { InlineSymbol, withSymbols } from "../components/InlineSymbol";
import { t } from "../i18n/index";
import { useContext, useEffect, useRef, useState } from "react";
import { useSoundEnabled } from "../audio/sfx";
import { AnimalSounds } from "../components/AnimalSounds";
import { Mascot } from "../components/Mascot";
import { PrototypeHeader } from "../components/PrototypeHeader";
import { SessionActivity } from "../components/SessionControls";
import { ToddlerPlayer, type PlayerControls, type VideoStatus } from "../components/ToddlerPlayer";
import type { CatalogueVideo } from "../game/videos";
import { nextVideoIndex, videoTime } from "../game/videoQueue";
import "./ToddlerCinema.css";

const breakMs = 10_000;

export function ToddlerCinema({ videos, name, onParents, onHome, onOpen, onPlay }: {
  videos: CatalogueVideo[];
  name: string; onParents: () => void; onHome: () => void; onOpen: (id: string) => void;
  onPlay: (videoId?: string) => void;
}) {
  const sound = useSoundEnabled();
  const session = useContext(SessionActivity);
  const finishing = session?.finishing ?? false;
  const [index, setIndex] = useState(0);
  const [pending, setPending] = useState<number | null>(null);
  const [remaining, setRemaining] = useState(breakMs);
  const [autoplay, setAutoplay] = useState(true);
  // Muted autoplay works before a browser has granted permission for sound.
  const [muted, setMuted] = useState(true);
  const [stopped, setStopped] = useState(false);
  // After each video AIdos and real animals say cow, cat and dog sounds, then the playlist goes on.
  const [animalTime, setAnimalTime] = useState(false);
  const [status, setStatus] = useState<VideoStatus>("loading");
  const [attempt, setAttempt] = useState(0);
  const player = useRef<PlayerControls | null>(null);
  const opened = useRef(onOpen);
  opened.current = onOpen;
  const selected = videos[index];
  const nextIndex = nextVideoIndex(videos, index);
  const next = videos[pending ?? index];
  const waiting = pending !== null;
  const seconds = Math.ceil(remaining / 1000);

  useEffect(() => { if (status === "playing") opened.current(selected.id); }, [status, selected.id]);
  useEffect(() => { if (!sound) setMuted(true); }, [sound]);
  useEffect(() => {
    if (finishing && !animalTime && (waiting || stopped || status !== "playing")) session?.finishActivity();
  }, [finishing, animalTime, waiting, stopped, status, session]);

  // Returning to a hidden tab never skips the little break.
  useEffect(() => {
    if (pending === null || finishing) return;
    let left = breakMs;
    let previous = performance.now();
    const visibilityChanged = () => { previous = performance.now(); };
    document.addEventListener("visibilitychange", visibilityChanged);
    const interval = window.setInterval(() => {
      const now = performance.now();
      if (!document.hidden) left = Math.max(0, left - (now - previous));
      previous = now;
      setRemaining(left);
      if (left > 0) return;
      window.clearInterval(interval);
      if (session && !session.canStartActivity()) return;
      setIndex(pending);
      setStatus("loading");
      setStopped(false);
      setPending(null);
    }, 100);
    return () => {
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", visibilityChanged);
    };
  }, [pending, finishing, session]);

  function queue(position: number) {
    if (session && !session.canStartActivity()) return;
    if (waiting || position < 0) return;
    setAnimalTime(false);
    setRemaining(breakMs);
    setPending(position);
  }
  function ended() {
    if (session && !session.canStartActivity()) { session.finishActivity(); return; }
    setAnimalTime(true);
  }
  // The animal moment (about 20 seconds) is the breather, so the next video starts right after.
  function afterAnimals() {
    if (session && !session.canStartActivity()) { session.finishActivity(); return; }
    setAnimalTime(false);
    if (!autoplay || nextIndex < 0) return setStopped(true);
    setIndex(nextIndex);
    setStatus("loading");
    setStopped(false);
  }
  function replay() {
    if (session && !session.canStartActivity()) return;
    setStopped(false);
    setStatus("loading");
    setAttempt((value) => value + 1);
  }

  return <main id="screen-toddler-cinema" className="prototype-screen toddler-cinema" aria-label={t("toddlerCinema.littleCinemaForAges1To2")}>
    <PrototypeHeader name={name} label={t("toddlerCinema.ages12")} detail={t("toddlerCinema.aLittleTimeToWatchAndWonder")} onParents={onParents} onHome={onHome} />
    <section className="toddler-heading">
      <div><p className="toddler-eyebrow">{t("toddlerCinema.myLittleCinema")}</p><h1>{t("toddlerCinema.aLittleWorldOfWonder")}<span aria-hidden="true"> <InlineSymbol mark="✦" /></span></h1></div>
      <span className="toddler-age-badge"><span aria-hidden="true"><InlineSymbol mark="✿" /></span> {t("toddlerCinema.justForLittleOnes")}</span>
    </section>
    <section className="toddler-tv" aria-label={t("toddlerCinema.nowShowing")}>
      <div className="toddler-tv-top"><span><i aria-hidden="true" /> {waiting ? t("toddlerCinema.aLittleBreather") : t("toddlerCinema.nowShowingAlt")}</span><span>{String(index + 1).padStart(2, "0")} / {String(videos.length).padStart(2, "0")}</span></div>
      <div className="toddler-screen" inert={finishing}>
        {animalTime ? <AnimalSounds sound={sound} onDone={afterAnimals} /> : waiting ? <div className="toddler-intermission">
          <div className="toddler-break-art"><Mascot pose="tablet" /><span className="toddler-count" role="timer" aria-label={t("toddlerCinema.secondsUntilTheNextVideo", { seconds })}>{seconds}</span></div>
          <p className="toddler-eyebrow">{t("toddlerCinema.oneLittlePause")}</p><h2>{t("toddlerCinema.wiggleYourFingers")}</h2>
          <p>{t("toddlerCinema.ourNextLittleAdventureStartsInSeconds", { seconds })}</p>
          <div className="toddler-break-track" role="progressbar" aria-label={t("toddlerCinema.breakBeforeNextVideo")} aria-valuemin={0} aria-valuemax={10} aria-valuenow={10 - seconds}>
            <span style={{ width: `${(1 - remaining / breakMs) * 100}%` }} />
          </div>
          <button className="toddler-text-button" type="button" onClick={() => { setPending(null); setStopped(true); }}>{t("toddlerCinema.stayOnABreak")}</button>
        </div> : stopped || status === "error" ? <div className="toddler-intermission toddler-rest">
          <div className="toddler-rest-mascot"><Mascot emotion={status === "error" ? "network" : "greeting"} pose={status === "error" ? "point" : "wave"} /></div>
          <h2>{status === "error" ? t("toddlerCinema.thisVideoNeedsALittleHelp") : t("toddlerCinema.aLovelyLittlePause")}</h2>
          <p>{status === "error" ? t("toddlerCinema.checkYourConnectionTryAgainOrChoose") : t("toddlerCinema.readyForAnotherLittleAdventure")}</p>
          <button type="button" className="toddler-button toddler-primary" onClick={replay}>{status === "error" ? t("toddlerCinema.tryAgain") : t("toddlerCinema.watchAgain")}</button>
        </div> : <>
          {status === "loading" && <img className="toddler-loading-cover" src={`https://i.ytimg.com/vi/${selected.id}/hqdefault.jpg`} alt=""
            onError={event => { event.currentTarget.hidden = true; }} />}
          <ToddlerPlayer key={`${selected.id}:${attempt}`} ref={player} videoId={selected.id} title={selected.title}
          muted={muted} onStatus={setStatus} onEnded={ended} onMuted={() => setMuted(true)} /></>}
      </div>
      <div className="toddler-tv-bottom"><span aria-hidden="true">{withSymbols("✦  ✦  ✦")}</span><span>{t("toddlerCinema.aLittleAdventureTogether")}</span><span className="toddler-speaker" aria-hidden="true"><InlineSymbol mark="▥" /></span></div>
    </section>
    <section className="toddler-now" aria-label={t("toddlerCinema.playbackControls")}>
      <div className="toddler-now-title"><span className="toddler-episode">{String(index + 1).padStart(2, "0")}</span><div><p className="toddler-eyebrow">{waiting ? t("toddlerCinema.comingUpNext") : t("toddlerCinema.yourLittleAdventure")}</p><h2>{waiting ? next.title : selected.title}</h2><p>{waiting ? t("toddlerCinema.a10SecondBreatherBetweenEveryVideo") : selected.channel + " · " + videoTime(selected.durationSeconds)}</p></div></div>
      <div className="toddler-controls" inert={finishing}>
        {!animalTime && !waiting && <a href={`https://www.youtube.com/watch?v=${selected.id}`} className="toddler-button toddler-secondary toddler-watch-link"
          target="_blank" rel="noopener noreferrer">{t("videoCatalog.openYoutube")}</a>}
        {!animalTime && !waiting && !stopped && status !== "error" && <>
          <button type="button" className="toddler-button toddler-secondary" disabled={status === "loading"} onClick={() => {
            if (status === "playing") player.current?.pauseVideo();
            else player.current?.playVideo();
          }}>{status === "loading" ? t("toddlerCinema.gettingReady") : status === "playing" ? withSymbols(t("toddlerCinema.pause")) : withSymbols(t("toddlerCinema.playVideo"))}</button>
          <button type="button" className={`toddler-button ${muted ? "toddler-sound" : "toddler-secondary"}`} aria-pressed={!muted} onClick={() => {
            if (muted) { player.current?.unMute(); player.current?.playVideo(); }
            setMuted((value) => !value);
          }}>{muted ? withSymbols(t("toddlerCinema.tapForSound")) : withSymbols(t("toddlerCinema.soundOn"))}</button>
        </>}
        <button type="button" className="toddler-button toddler-primary" disabled={waiting || nextIndex < 0} onClick={() => queue(nextIndex)}>{waiting ? t("toddlerCinema.nextInS", { seconds }) : withSymbols(t("toddlerCinema.nextAdventure"))}</button>
      </div>
    </section>
    {selected.quizTopic && !waiting && <button type="button" disabled={finishing} className="toddler-text-button" onClick={() => onPlay(selected.id)}>{withSymbols(t("toddlerCinema.exploreAnimalSoundsWith"))}</button>}
    <section className="toddler-queue" inert={finishing} aria-labelledby="toddler-queue-heading">
      <div className="toddler-queue-heading"><h2 id="toddler-queue-heading">{t("toddlerCinema.littleAdventuresLinedUp")}</h2><button type="button" role="switch" aria-checked={autoplay} className="toddler-autoplay" onClick={() => {
        setAutoplay((value) => !value);
        if (waiting) { setPending(null); setStopped(true); }
      }}><span className="toddler-toggle" aria-hidden="true" /> {t("toddlerCinema.autoplayNext")}</button></div>
      <VideoPlaylist videos={videos} index={index} disabled={waiting} onChoose={queue} />
    </section>
    <footer>
      <div className="toddler-footer"><p>{t("toddlerCinema.madeForWatchingTogetherVideosPlayThrough")}</p><p>{t("toddlerCinema.onlyThisLittlePlaylistPlaysNext")}</p></div>
      <CreatorCredit />
    </footer>
  </main>;
}
