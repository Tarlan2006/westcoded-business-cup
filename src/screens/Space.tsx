import { lazy, Suspense, useEffect, useState } from "react";
import { speakFallback, stopSpeech } from "../audio/engine";
import type { SpaceGameProps } from "../games/space";

const SpaceGame = lazy(() => import("../games/space").then(({ SpaceGame }) => ({ default: SpaceGame })));
const SpaceViewer = lazy(() => import("../games/space").then(({ SpaceViewer }) => ({ default: SpaceViewer })));

export function Space({ exploreOnly, onBack, onComplete }: Pick<SpaceGameProps, "onBack" | "onComplete"> & {
  exploreOnly: boolean;
}) {
  const [sound, setSound] = useState(true);
  const Game = exploreOnly ? SpaceViewer : SpaceGame;

  useEffect(() => () => stopSpeech(), []);

  return (
    <main>
      <Suspense fallback={<div className="shell learn-page">
        <p role="status">Opening Space Scale…</p>
        <button type="button" className="quiet-button" onClick={onBack}>Back</button>
      </div>}>
        <div className="sp-host-controls">
          <button type="button" className="quiet-button" aria-pressed={sound} onClick={() => {
            stopSpeech();
            setSound((enabled) => !enabled);
          }}>{sound ? "Fact audio on" : "Fact audio off"}</button>
        </div>
        <Game speak={sound ? speakFallback : undefined}
          onBack={() => { stopSpeech(); onBack(); }}
          onComplete={(points) => { stopSpeech(); onComplete(points); }} />
      </Suspense>
    </main>
  );
}
