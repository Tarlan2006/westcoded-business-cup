import { t } from "../i18n/index";
import { lazy, Suspense, useEffect, useState } from "react";
import { speakFallback, stopSpeech } from "../audio/engine";
import { useSoundEnabled } from "../audio/sfx";
import { ActivityHeader } from "../components/ActivityHeader";
import type { SpaceGameProps } from "../games/space";
import "./Space.css";

const SpaceGame = lazy(() => import("../games/space").then(({ SpaceGame }) => ({ default: SpaceGame })));
const SpaceViewer = lazy(() => import("../games/space").then(({ SpaceViewer }) => ({ default: SpaceViewer })));

export function Space({ exploreOnly, onBack, onComplete }: Pick<SpaceGameProps, "onBack" | "onComplete"> & {
  exploreOnly: boolean;
}) {
  const [localSound, setSound] = useState(true);
  const globalSound = useSoundEnabled();
  const sound = globalSound && localSound;
  const Game = exploreOnly ? SpaceViewer : SpaceGame;

  useEffect(() => () => stopSpeech(), []);

  return (
    <main className="sp-host">
      <div className="shell flow-module-header">
        <ActivityHeader title={t("spaceGame.spaceScale")} onBack={onBack}>
          <button type="button" className="quiet-button" disabled={!globalSound} aria-pressed={sound} onClick={() => {
            stopSpeech();
            setSound((enabled) => !enabled);
          }}>{sound ? t("space.factAudioOn") : t("space.factAudioOff")}</button>
        </ActivityHeader>
      </div>
      <Suspense fallback={<div className="shell learn-page">
        <p role="status">{t("space.openingSpaceScale")}</p>
      </div>}>
        <Game header={null} speak={sound ? speakFallback : undefined}
          onBack={() => { stopSpeech(); onBack(); }}
          onComplete={(points) => { stopSpeech(); onComplete(points); }} />
      </Suspense>
    </main>
  );
}
