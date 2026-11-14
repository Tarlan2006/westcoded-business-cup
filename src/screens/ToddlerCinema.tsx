import { useEffect, useRef, useState } from "react";
import { APP_NAME } from "../brand";
import { useSoundEnabled } from "../audio/sfx";
import { AnimalSounds } from "../components/AnimalSounds";
import { PrototypeBleep } from "../components/Mascot";
import { PrototypeHeader } from "../components/PrototypeHeader";
import { ToddlerPlayer, type PlayerControls, type VideoStatus } from "../components/ToddlerPlayer";
import { videosFor } from "../game/videos";
import "./ToddlerCinema.css";

const videos = videosFor("1-2");
const breakMs = 10_000;

export function ToddlerCinema({ name, onParents, onHome, onOpen, onPlay }: {
  name: string; onParents: () => void; onHome: () => void; onOpen: (id: string) => void;
  onPlay: (videoId?: string) => void;
}) {
  const sound = useSoundEnabled();
  const [index, setIndex] = useState(0);
  const [pending, setPending] = useState<number | null>(null);
  const [remaining, setRemaining] = useState(breakMs);
  const [autoplay, setAutoplay] = useState(true);
  // Muted autoplay works before a browser has granted permission for sound.
  const [muted, setMuted] = useState(true);
  const [stopped, setStopped] = useState(false);
  // After each video MyPal and real animals say cow, cat and dog sounds, then the playlist goes on.
  const [animalTime, setAnimalTime] = useState(false);
  const [status, setStatus] = useState<VideoStatus>("loading");
  const [attempt, setAttempt] = useState(0);
  const player = useRef<PlayerControls | null>(null);
  const opened = useRef(onOpen);
  opened.current = onOpen;
  const selected = videos[index];
  const nextIndex = (index + 1) % videos.length;
  const next = videos[pending ?? nextIndex];
  const waiting = pending !== null;
  const seconds = Math.ceil(remaining / 1000);

  useEffect(() => { if (status === "playing") opened.current(selected.id); }, [status, selected.id]);
  useEffect(() => { if (!sound) setMuted(true); }, [sound]);

  // Returning to a hidden tab never skips the little break.
  useEffect(() => {
    if (pending === null) return;
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
      setIndex(pending);
      setStatus("loading");
      setStopped(false);
      setPending(null);
    }, 100);
    return () => {
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", visibilityChanged);
    };
  }, [pending]);

  function queue(position: number) {
    setAnimalTime(false);
    if (waiting) return;
    setRemaining(breakMs);
    setPending(position);
  }
  function ended() {
    setAnimalTime(true);
  }
  // The animal moment (about 20 seconds) is the breather, so the next video starts right after.
  function afterAnimals() {
    setAnimalTime(false);
    if (!autoplay) return setStopped(true);
    setIndex(nextIndex);
    setStatus("loading");
    setStopped(false);
  }
  function replay() {
    setStopped(false);
    setStatus("loading");
    setAttempt((value) => value + 1);
  }

  return <main id="screen-toddler-cinema" className="prototype-screen toddler-cinema" aria-label="Little cinema for ages 1 to 2">
    <PrototypeHeader name={name} label="Ages 1–2" detail="A little time to watch and wonder" onParents={onParents} onHome={onHome} />
    <section className="toddler-heading">
      <div><p className="toddler-eyebrow">MY LITTLE CINEMA</p><h1>A little world of wonder<span aria-hidden="true"> ✦</span></h1></div>
      <span className="toddler-age-badge"><span aria-hidden="true">✿</span> Just for little ones</span>
    </section>
    <section className="toddler-tv" aria-label="Now showing">
      <div className="toddler-tv-top"><span><i aria-hidden="true" /> {waiting ? "A LITTLE BREATHER" : "NOW SHOWING"}</span><span>{String(index + 1).padStart(2, "0")} / {String(videos.length).padStart(2, "0")}</span></div>
      <div className="toddler-screen">
        {animalTime ? <AnimalSounds sound={sound} onDone={afterAnimals} /> : waiting ? <div className="toddler-intermission">
          <div className="toddler-break-art"><PrototypeBleep variant="greeting" action="wave" /><span className="toddler-count" role="timer" aria-label={`${seconds} seconds until the next video`}>{seconds}</span></div>
          <p className="toddler-eyebrow">ONE LITTLE PAUSE</p><h2>Wiggle your fingers!</h2>
          <p>Our next little adventure starts in {seconds} seconds.</p>
          <div className="toddler-break-track" role="progressbar" aria-label="Break before next video" aria-valuemin={0} aria-valuemax={10} aria-valuenow={10 - seconds}>
            <span style={{ width: `${(1 - remaining / breakMs) * 100}%` }} />
          </div>
          <button className="toddler-text-button" type="button" onClick={() => { setPending(null); setStopped(true); }}>Stay on a break</button>
        </div> : stopped || status === "error" ? <div className="toddler-intermission toddler-rest">
          <div className="toddler-rest-mascot"><PrototypeBleep variant="greeting" /></div>
          <h2>{status === "error" ? "This video needs a little help" : "A lovely little pause"}</h2>
          <p>{status === "error" ? "Check your connection, try again, or choose the next video." : "Ready for another little adventure?"}</p>
          <button type="button" className="toddler-button toddler-primary" onClick={replay}>{status === "error" ? "Try again" : "Watch again"}</button>
        </div> : <ToddlerPlayer key={`${selected.id}:${attempt}`} ref={player} videoId={selected.id} title={selected.title}
          muted={muted} onStatus={setStatus} onEnded={ended} onMuted={() => setMuted(true)} />}
      </div>
      <div className="toddler-tv-bottom"><span aria-hidden="true">✦ &nbsp; ✦ &nbsp; ✦</span><span>A little adventure, together</span><span className="toddler-speaker" aria-hidden="true">▥</span></div>
    </section>
    <section className="toddler-now" aria-label="Playback controls">
      <div className="toddler-now-title"><span className="toddler-episode">{String(index + 1).padStart(2, "0")}</span><div><p className="toddler-eyebrow">{waiting ? "COMING UP NEXT" : "YOUR LITTLE ADVENTURE"}</p><h2>{waiting ? next.title : selected.title}</h2><p>{waiting ? "A 10-second breather between every video" : selected.channel}</p></div></div>
      <div className="toddler-controls">
        {!waiting && !stopped && status !== "error" && <>
          <button type="button" className="toddler-button toddler-secondary" disabled={status === "loading"} onClick={() => {
            if (status === "playing") player.current?.pauseVideo();
            else player.current?.playVideo();
          }}>{status === "loading" ? "Getting ready…" : status === "playing" ? "Ⅱ Pause" : "▶ Play video"}</button>
          <button type="button" className={`toddler-button ${muted ? "toddler-sound" : "toddler-secondary"}`} aria-pressed={!muted} onClick={() => {
            if (muted) { player.current?.unMute(); player.current?.playVideo(); }
            setMuted((value) => !value);
          }}>{muted ? "♪ Tap for sound" : "♪ Sound on"}</button>
        </>}
        <button type="button" className="toddler-button toddler-primary" disabled={waiting} onClick={() => queue(nextIndex)}>{waiting ? `Next in ${seconds}s` : "Next adventure →"}</button>
      </div>
    </section>
    {selected.quizTopic && !waiting && <button type="button" className="toddler-text-button" onClick={() => onPlay(selected.id)}>Explore animal sounds with {APP_NAME} →</button>}
    <section className="toddler-queue" aria-labelledby="toddler-queue-heading">
      <div className="toddler-queue-heading"><h2 id="toddler-queue-heading">Little adventures, lined up</h2><button type="button" role="switch" aria-checked={autoplay} className="toddler-autoplay" onClick={() => {
        setAutoplay((value) => !value);
        if (waiting) { setPending(null); setStopped(true); }
      }}><span className="toddler-toggle" aria-hidden="true" /> Autoplay next</button></div>
      <div className="toddler-episodes">{videos.map((video, position) => <button type="button" key={video.id} disabled={waiting || position === index}
        className="toddler-card" aria-label={`${position === index ? "Now showing" : "Play next"}: ${video.title}`} aria-current={position === index ? "true" : undefined}
        onClick={() => queue(position)}>
        <div className="toddler-thumbnail"><img src={`https://i.ytimg.com/vi/${video.id}/mqdefault.jpg`} alt="" loading="lazy" /><span>{position === index ? "NOW SHOWING" : `0${position + 1}`}</span></div>
        <span className="toddler-card-title">{video.title}</span><span className="toddler-card-detail">{position === index ? "Enjoy this little moment" : "Starts after a 10-second break"}</span>
      </button>)}</div>
    </section>
    <footer className="toddler-footer"><p>Made for watching together. Videos play through YouTube and may show ads.</p><p>Only this little playlist plays next.</p></footer>
  </main>;
}
