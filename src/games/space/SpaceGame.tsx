import { useEffect, useId, useRef, useState } from "react";
import { ObjectArt, RocketArt } from "./art/ObjectArt";
import { Journey } from "./Journey";
import { Quiz } from "./Quiz";
import { objects } from "./scale";

export interface SpaceGameProps {
  onComplete: (points: number) => void;
  onBack: () => void;
  speak?: (text: string) => Promise<void> | void;
}

type Stage = "intro" | "journey" | "quiz" | "result";
const journeyPoints = 8;

function SpaceActivity({ onBack, onComplete, speak, exploreOnly }: SpaceGameProps & { exploreOnly: boolean }) {
  const [stage, setStage] = useState<Stage>("intro");
  const [correct, setCorrect] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const submittedRef = useRef(false);
  const resultTitle = useRef<HTMLHeadingElement>(null);
  const titleId = useId();
  const points = journeyPoints + correct * 4;

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
    <section className="sp-game" aria-labelledby={titleId}>
      <header className="sp-topbar">
        <button type="button" className="sp-button sp-button-soft" onClick={onBack} aria-label="Back to activities">
          <span aria-hidden="true">←</span> Back
        </button>
        <div className="sp-title" id={titleId}>Space Scale</div>
        <span className="sp-tag">{stage === "journey" ? "Journey" : stage === "quiz" ? "Quiz" : stage === "result" ? "Results" : "Explore"}</span>
      </header>
      {stage === "intro" && <div className="sp-intro">
        <div className="sp-intro-copy">
          <h1>How big<br />is <em>space?</em></h1>
          <p>Start with someone your size. Zoom out, past planets and all the way to a giant red star.</p>
          <button type="button" className="sp-button sp-button-primary" onClick={() => setStage("journey")}>
            Start exploring <span aria-hidden="true">→</span>
          </button>
        </div>
        <div className="sp-hero" aria-hidden="true">
          <div className="sp-hero-earth"><ObjectArt art="earth" /></div>
          <div className="sp-hero-rocket"><RocketArt /></div>
          <div className="sp-hero-moon"><ObjectArt art="moon" /></div>
        </div>
      </div>}
      {stage === "journey" && <div className="sp-journey">
        <Journey speak={speak} exploreOnly={exploreOnly} onFinish={() => setStage(exploreOnly ? "result" : "quiz")} />
      </div>}
      {stage === "quiz" && <Quiz onFinish={(count) => {
        setCorrect(count);
        setStage("result");
      }} />}
      {stage === "result" && <div className="sp-result">
        <div className="sp-result-art" aria-hidden="true">
          {["earth", "jupiter", "star"].map((art) => <div key={art}><ObjectArt art={art} /></div>)}
        </div>
        <h2 tabIndex={-1} ref={resultTitle}>What a journey!</h2>
        <p>You zoomed from a child all the way to {objects.at(-1)?.name}.</p>
        <p className="sp-result-score">+{points} XP</p>
        <p>{exploreOnly ? "8 XP for exploring" : `8 XP for exploring · ${correct} out of 5 quiz answers right`}</p>
        <button type="button" className="sp-button sp-button-primary" disabled={submitted} onClick={finish}>
          Done <span aria-hidden="true">✓</span>
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
