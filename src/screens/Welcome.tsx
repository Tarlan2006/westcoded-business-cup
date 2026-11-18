import { t, subscribe } from "../i18n/index";
import { LanguageSwitch } from "../i18n/LanguageSwitch";
import { playQueue, unlock } from "../audio/engine";
import { useEffect, useRef, useState } from "react";
import { useSoundEnabled } from "../audio/sfx";
import { Mascot } from "../components/Mascot";

function makeStatus() { return [t("welcome.wakingUp"), t("welcome.packingTheBackpack"), t("welcome.ready")]; }
let status = makeStatus();
subscribe(() => { status = makeStatus(); });
const progress = [15, 60, 100];

export function Welcome({ repeat, onContinue, onToggleSound }: {
  repeat: boolean; onContinue: () => void; onToggleSound: () => void;
}) {
  const [stage, setStage] = useState(0);
  const sound = useSoundEnabled();
  const greeting = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    // A short welcome with AIdos every time the site opens (about two and a half seconds).
    const times = repeat ? [700, 1500, 2300] : [800, 1700, 2600];
    const timers = times.map((time, index) => window.setTimeout(() => setStage(index + 1), time));
    return () => timers.forEach((timer) => window.clearTimeout(timer));
  }, [repeat]);

  useEffect(() => {
    if (stage === 3 && repeat) onContinue();
    else if (stage === 3) greeting.current?.focus({ preventScroll: true });
  }, [stage, repeat, onContinue]);

  if (stage < 3 || repeat) return <main id="screen-splash" className="prototype-screen fixed inset-0 z-50 bg-white flex flex-col items-center justify-center p-6 text-center transition-opacity duration-500" aria-label={t("welcome.loading")}>
    <div className="splash-mascot mb-6 drop-shadow-lg"><Mascot pose="tablet" size={200} eager /></div>
    <h1 className="splash-title font-display text-3xl sm:text-4xl font-bold text-[#6C47FF] tracking-tight mb-2">{t("welcome.welcomeTo")}</h1>
    <p className="text-slate-400 font-extrabold text-sm tracking-widest uppercase mb-6" role="status">{status[Math.min(stage, 2)]}</p>
    <div className="w-64 h-4 bg-slate-200 rounded-full overflow-hidden p-0.5" role="progressbar" aria-label={t("welcome.loadingProgress")} aria-valuenow={progress[Math.min(stage, 2)]}>
      <div className="h-full bg-[#58CC02] rounded-full transition-all duration-300" style={{ width: `${progress[Math.min(stage, 2)]}%` }} />
    </div>
  </main>;

  return <main id="screen-greeting" className="prototype-screen fixed inset-0 z-40 bg-white flex flex-col justify-between p-6">
    <div className="flex justify-end"><LanguageSwitch />
      <button type="button" className="px-3.5 py-1.5 rounded-full bg-slate-100 text-slate-600 text-xs font-extrabold"
        aria-pressed={sound} onClick={onToggleSound}><span aria-hidden="true">{sound ? "🔊" : "🔇"}</span> {t("home.sound")}</button>
    </div>
    <div className="flex-1 flex flex-col items-center justify-center max-w-md mx-auto text-center">
      <div className="speech-bubble-duo px-6 py-4 mb-6 animate-bounce">
        <h1 ref={greeting} tabIndex={-1} className="focus:outline-none font-display text-xl sm:text-2xl font-bold text-slate-800">{t("welcome.heyPalReadyForAScreenFree")}</h1>
      </div>
      <Mascot pose="wave" size={230} eager className="drop-shadow-lg" />
    </div>
    <div className="w-full border-t-2 border-slate-200 pt-4 pb-2 flex justify-center sm:justify-end max-w-4xl mx-auto">
      <button type="button" onClick={() => { if (sound) { void unlock().then(() => playQueue(["common_setup_greeting"])).catch(() => {}); } onContinue(); }}
        className="w-full sm:w-auto px-12 py-4 rounded-2xl btn-game btn-lime text-white font-display font-bold text-lg tracking-wider uppercase cursor-pointer">{t("welcome.continue")}</button>
    </div>
  </main>;
}
