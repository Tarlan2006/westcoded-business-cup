import { APP_NAME } from "../brand";
import { useContext, useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { uiSound, useSoundEnabled } from "../audio/sfx";
import { GrownUpsButton } from "./GrownUpsButton";
import { ActivityNavigation } from "./ActivityHeader";
import { Mascot, poseFor, type MascotAction, type MascotMood } from "./Mascot";
import { SessionActivity, SessionClock } from "./SessionControls";

export const missionReplyStyle = "px-4 py-2 rounded-2xl bg-[#EDE9FE] hover:bg-[#DDD6FE] border-2 border-[#8B5CF6] text-[#1E1B4B] font-extrabold text-sm sm:text-base transition cursor-pointer";
export const missionButtonStyle = "relative py-5 px-3 sm:px-4 rounded-3xl btn-game font-display font-bold text-xl sm:text-2xl flex items-center justify-center gap-2.5 cursor-pointer";

export function PrototypeParticles({ icon, count, x = 50, y = 55 }: { icon: string; count: number; x?: number; y?: number }) {
  return Array.from({ length: count }, (_, index) => <span key={index} aria-hidden="true"
    className="prototype-particle text-2xl sm:text-3xl" style={{
      left: `calc(${x}% + ${((index * 43) % 158) - 78}px)`, top: `calc(${y}% + ${((index * 29) % 74) - 37}px)`,
    }}>{icon}</span>);
}

export function MissionStage({ heading, round, total = 3, seconds, clockSeconds, ratio, demoEmoji, demoWord, action, mood,
  speaking, prompt, replies, controls, status, onExit, exitDisabled, toolbar, feedback, paused }: {
  heading?: string; round: number; total?: number; seconds: number; clockSeconds: number; ratio: number;
  demoEmoji: string; demoWord: string; prop?: string; action?: MascotAction; mood: MascotMood; speaking?: boolean;
  prompt: string; replies?: ReactNode; controls: ReactNode; status?: string; onExit: () => void; exitDisabled?: boolean;
  toolbar?: ReactNode; feedback?: boolean; paused?: boolean;
}) {
  const [tickled, setTickled] = useState(false);
  const [tap, setTap] = useState({ x: 50, y: 55 });
  const ticklingRound = useRef(round);
  const tickleTimer = useRef<number>(0);
  const sound = useSoundEnabled();
  const navigation = useContext(ActivityNavigation);
  const session = useContext(SessionActivity);
  useEffect(() => () => window.clearTimeout(tickleTimer.current), []);
  const circumference = 716.28;
  const visibleRound = (round - 1) % total;
  const giggling = tickled && ticklingRound.current === round && !paused && !feedback;
  const clock = `${Math.floor(clockSeconds / 60)}:${String(clockSeconds % 60).padStart(2, "0")}`;

  return <main id="screen-mission" aria-label="Mission" className="prototype-screen relative flex-1 w-full max-w-4xl mx-auto px-4 py-3 flex flex-col items-center justify-between space-y-3 z-10">
    <h1 className="sr-only">{heading ?? "Mission"}</h1>
    <header className="mission-stats w-full flex flex-wrap items-center justify-between gap-1 bg-[#1C145C]/90 px-4 py-2 rounded-2xl border-2 border-[#4C35DE]">
      <div className="flex items-center gap-2" id="starProgressContainer" aria-label={`Round ${round}`}>
        {Array.from({ length: total }, (_, index) => <span key={index} aria-hidden="true"
          className={`text-xl transition-transform ${index <= visibleRound ? "scale-110" : "opacity-35"}`}>⭐</span>)}
      </div>
      <SessionClock id="sessionClockDisplay" fallback={<div className="text-xs font-black text-[#FFD13B] uppercase tracking-wider tabular-nums" id="sessionClockDisplay" aria-label="Time left">{clock}</div>} />
      <div className="flex flex-wrap items-center gap-2">
        {paused && navigation && <button type="button" className="prototype-parent-button" aria-label="Home, back to activities" onClick={navigation.onHome}>🏠</button>}
        {toolbar}<GrownUpsButton variant="exit" disabled={exitDisabled || session?.finishing} onOpen={onExit} />
      </div>
    </header>
    {navigation && <nav className="sr-only" aria-label="Breadcrumb">{navigation.breadcrumb}</nav>}

    <div className="relative flex flex-col items-center justify-center my-1">
      <div className="prototype-countdown relative w-72 h-72 sm:w-80 sm:h-80 flex items-center justify-center">
        <svg className="w-full h-full" viewBox="0 0 260 260" aria-hidden="true">
          <circle cx="130" cy="130" r="114" fill="rgba(28, 20, 92, 0.78)" stroke="#3B28B0" strokeWidth="16" />
          <circle id="countdownRing" className="countdown-circle countdown-fill" cx="130" cy="130" r="114" fill="none"
            style={{ "--countdown-stroke": ratio > .5 ? "#2CE69B" : ratio > .25 ? "#FFD13B" : "#FF7849" } as CSSProperties} strokeWidth="16" strokeLinecap="round"
            strokeDasharray={circumference} strokeDashoffset={circumference * (1 - Math.min(1, Math.max(0, ratio)))} />
        </svg>
        <div id="actionDemoBadge" className="absolute -top-2 -right-2 z-20 w-20 h-20 rounded-3xl bg-[#FFD13B] border-4 border-white shadow-xl flex flex-col items-center justify-center animate-bounce" title={demoWord}>
          <span aria-hidden="true" className="text-4xl leading-none">{demoEmoji}</span>
          <span className="px-1 text-center leading-none text-[10px] font-black uppercase text-[#1E1B4B] mt-0.5">{demoWord}</span>
        </div>
        <button type="button" className="absolute inset-0 flex items-center justify-center cursor-pointer rounded-full" aria-label={`Tickle ${APP_NAME}`}
          disabled={paused} onClick={(event) => {
            window.clearTimeout(tickleTimer.current);
            const { clientX, clientY, detail } = event;
            if (detail) setTap({ x: 100 * clientX / innerWidth, y: 100 * clientY / innerHeight });
            else setTap({ x: 50, y: 55 });
            ticklingRound.current = round;
            setTickled(true);
            uiSound("giggle", sound);
            tickleTimer.current = window.setTimeout(() => setTickled(false), 900);
          }}>
          <span className={`block w-52 h-52 sm:w-60 sm:h-60 drop-shadow-xl${giggling ? " aidos-giggle" : ""}`}>
            <Mascot pose={poseFor(mood, paused ? "none" : action)} speaking={speaking} /></span>
        </button>
        {giggling && <PrototypeParticles icon="💖" count={8} {...tap} />}
        {feedback && <PrototypeParticles icon="🎉" count={10} />}
        <div id="roundSecondsBadge" className="absolute -bottom-2 pointer-events-none bg-[#FFD13B] px-5 py-1 rounded-full border-3 border-white font-black text-lg text-[#1E1B4B] shadow-md">
          {paused ? "Ⅱ" : feedback ? "✦" : `${seconds}s`}
        </div>
      </div>
    </div>

    <div className="w-full bg-white rounded-3xl p-4 sm:p-5 border-4 border-[#8B5CF6] shadow-[0_10px_28px_rgba(0,0,0,0.35)] text-center space-y-3">
      <p className="caption font-display text-xl sm:text-2xl font-bold text-[#1E1B4B] leading-snug" aria-live="polite">{giggling ? "Hee-hee-hee! That tickles! 😂" : prompt}</p>
      {replies && <div className="flex flex-wrap items-center justify-center gap-2.5" aria-label="Quick replies">{replies}</div>}
    </div>
    <div className="w-full grid grid-cols-2 gap-3 sm:gap-4 pt-1">{controls}</div>
    {status && <p className="text-sm text-indigo-200" role="status">{status}</p>}
  </main>;
}
