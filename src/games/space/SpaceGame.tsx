import { InlineSymbol } from "../../components/InlineSymbol";
import { t } from "../../i18n/index";
import { Mascot } from "../../components/Mascot";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { ObjectArt } from "./art/ObjectArt";
import { Journey } from "./Journey";
import { Quiz } from "./Quiz";
import { objects } from "./scale";

export interface SpaceGameProps {
  onComplete: (points: number) => void;
  onBack: () => void;
  speak?: (text: string) => Promise<void> | void;
  /** Optional host header; null when the host renders its header outside the module. */
  header?: ReactNode;
}

type Stage = "intro" | "journey" | "quiz" | "result";
const journeyPoints = 8;

function SpaceActivity({ onBack, onComplete, speak, header, exploreOnly }: SpaceGameProps & { exploreOnly: boolean }) {
  const [stage, setStage] = useState<Stage>("intro");
  const [correct, setCorrect] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const submittedRef = useRef(false);
  const resultTitle = useRef<HTMLHeadingElement>(null);
  const points = exploreOnly ? journeyPoints : correct * 4;

  useEffect(() => {
    if (stage === "result") resultTitle.current?.focus({ preventScroll: true });
  }, [stage]);

  function finish() {
    if (submittedRef.current) return;
    submittedRef.current = true;
    setSubmitted(true);
    onComplete(points);
  }

  return (
    <section className="sp-game" aria-label={t("spaceGame.spaceScale")}>
      {header === undefined ? <header className="sp-topbar">
        <button type="button" className="sp-button sp-button-soft" onClick={onBack} aria-label={t("nextUp.backToActivities")}>
          <span aria-hidden="true"><InlineSymbol mark="←" /></span> {t("activityHeader.back")}</button>
        <div className="sp-title">{t("spaceGame.spaceScale")}</div>
      </header> : header}
      {stage === "intro" && <div className="sp-intro">
        <div className="sp-intro-copy">
          <h1>{t("spaceGame.howBig")}<br />{t("spaceGame.is")} <em>{t("spaceGame.space")}</em></h1>
          <p>{t("spaceGame.startWithSomeoneYourSizeZoomOut")}</p>
          <button type="button" className="sp-button sp-button-primary" onClick={() => setStage("journey")}>{t("spaceGame.startExploring")} <span aria-hidden="true"><InlineSymbol mark="→" /></span>
          </button>
        </div>
        <div className="sp-hero" aria-hidden="true">
          <div className="sp-hero-earth"><ObjectArt art="earth" /></div>
          <div className="sp-hero-rocket"><Mascot emotion="greeting" pose="point" /></div>
          <div className="sp-hero-moon"><ObjectArt art="moon" /></div>
        </div>
      </div>}
      {stage === "journey" && <div className="sp-journey">
        <Journey speak={speak} exploreOnly={exploreOnly} onFinish={() => setStage(exploreOnly ? "result" : "quiz")} />
      </div>}
      {stage === "quiz" && <Quiz speak={speak} onFinish={(count) => {
        setCorrect(count);
        setStage("result");
      }} />}
      {stage === "result" && <div className="sp-result">
        <div className="sp-result-art" aria-hidden="true">
          <Mascot pose="jump" size={120} />
          {["earth", "jupiter", "star"].map((art) => <div key={art}><ObjectArt art={art} /></div>)}
        </div>
        <h1 tabIndex={-1} ref={resultTitle}>{t("spaceGame.whatAJourney")}</h1>
        <p>{t("spaceGame.youZoomedFromAChildAllThe", { value1: objects[objects.length - 1].name })}</p>
        <p className="sp-result-score">+{points} XP</p>
        <p>{exploreOnly ? t("spaceGame.8XpForExploring") : t("spaceGame.quizResult", { correct })}</p>
        <button type="button" className="sp-button sp-button-primary" disabled={submitted} onClick={finish}>{t("sketchGame.done")} <span aria-hidden="true"><InlineSymbol mark="✓" /></span>
        </button>
      </div>}
    </section>
  );
}

export function SpaceGame(props: SpaceGameProps) {
  return <SpaceActivity {...props} exploreOnly={false} />;
}

export function SpaceViewer(props: SpaceGameProps) {
  return <SpaceActivity {...props} exploreOnly />;
}
