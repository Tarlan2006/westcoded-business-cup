import { lazy, Suspense, useEffect, useState } from "react";
import { speakFallback, stopSpeech } from "../audio/engine";
import { useSoundEnabled } from "../audio/sfx";
import { ActivityHeader } from "../components/ActivityHeader";
import type { SketchGameProps } from "../games/sketch";

const SketchGame = lazy(() => import("../games/sketch").then((module) => ({ default: module.SketchGame })));

function speakClue(text: string) {
  stopSpeech();
  return speakFallback(text);
}

/** Host audio and rewards stay outside the independent game module. */
export function Sketch({ onBack, onComplete }: Pick<SketchGameProps, "onBack" | "onComplete">) {
  const [localSound, setSound] = useState(true);
  const globalSound = useSoundEnabled();
  const sound = globalSound && localSound;
  useEffect(() => () => stopSpeech(), []);

  return <main>
    <div className="shell flow-module-header">
      <ActivityHeader title="Sketch Artist" onBack={onBack}>
        <button type="button" className="quiet-button" disabled={!globalSound} aria-pressed={sound} onClick={() => {
          stopSpeech();
          setSound((enabled) => !enabled);
        }}>{sound ? "Clue audio on" : "Clue audio off"}</button>
      </ActivityHeader>
    </div>
    <Suspense fallback={<div className="shell learn-page" role="status">
      <p>Opening the case…</p>
    </div>}>
      <SketchGame header={null} speak={sound ? speakClue : undefined}
        onBack={() => { stopSpeech(); onBack(); }}
        onComplete={(points) => { stopSpeech(); onComplete(points); }} />
    </Suspense>
  </main>;
}
