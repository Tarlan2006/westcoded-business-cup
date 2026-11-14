import { lazy, Suspense, useContext, useEffect, useState } from "react";
import { speakFallback, stopSpeech } from "../audio/engine";
import { ActivityXp } from "../components/ActivityHeader";
import type { SketchGameProps } from "../games/sketch";
import "./Sketch.css";

const SketchGame = lazy(() => import("../games/sketch").then((module) => ({ default: module.SketchGame })));

function speakClue(text: string) {
  stopSpeech();
  return speakFallback(text);
}

/** Host audio and rewards stay outside the independent game module. */
export function Sketch({ onBack, onComplete }: Pick<SketchGameProps, "onBack" | "onComplete">) {
  const xp = useContext(ActivityXp);
  const [sound, setSound] = useState(true);
  useEffect(() => () => stopSpeech(), []);

  return <main>
    <div className="sk-host-controls">
      <span className="xp-chip">{xp ?? 0} XP</span>
      <button type="button" className="quiet-button" aria-pressed={sound} onClick={() => {
        stopSpeech();
        setSound((enabled) => !enabled);
      }}>{sound ? "Clue audio on" : "Clue audio off"}</button>
    </div>
    <Suspense fallback={<div className="shell learn-page" role="status">
      <p>Opening the case…</p><button type="button" className="quiet-button" onClick={onBack}>Back</button>
    </div>}>
      <SketchGame speak={sound ? speakClue : undefined}
        onBack={() => { stopSpeech(); onBack(); }}
        onComplete={(points) => { stopSpeech(); onComplete(points); }} />
    </Suspense>
  </main>;
}
