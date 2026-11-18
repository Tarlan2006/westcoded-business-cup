import { t } from "../../i18n/index";
import { Mascot } from "../../components/Mascot";
import { useEffect, useId, useRef, useState } from "react";
import { ObjectArt } from "./art/ObjectArt";
import { compareSizes, objects, type SpaceObject } from "./scale";

type Pair = [SpaceObject, SpaceObject];
const questionCount = 5;

function randomPairs(): Pair[] {
  const pairs = objects.flatMap((object, i) =>
    objects.slice(i + 1).map((other): Pair => Math.random() < .5 ? [object, other] : [other, object]));
  for (let i = 0; i < questionCount; i++) {
    const next = i + Math.floor(Math.random() * (pairs.length - i));
    [pairs[i], pairs[next]] = [pairs[next], pairs[i]];
  }
  return pairs.slice(0, questionCount);
}

export function Quiz({ onFinish }: { onFinish: (correct: number) => void }) {
  const [questions] = useState(randomPairs);
  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState<string>();
  const [correct, setCorrect] = useState(0);
  const heading = useRef<HTMLHeadingElement>(null);
  const headingId = useId();
  const pair = questions[index];
  const bigger = pair[0].diameterKm > pair[1].diameterKm ? pair[0] : pair[1];

  useEffect(() => { heading.current?.focus({ preventScroll: true }); }, [index]);

  function advance() {
    if (!picked) return;
    const score = correct + Number(picked === bigger.id);
    if (index === questions.length - 1) {
      onFinish(score);
    } else {
      setCorrect(score);
      setPicked(undefined);
      setIndex(index + 1);
    }
  }

  return (
    <section className="sp-quiz" aria-labelledby={headingId}>
      <div className="sp-quiz-title">
        <div>
          <p className="sp-kicker">{t("quiz.questionOf", { value1: index + 1, value2: questions.length })}</p>
          <h1 id={headingId} ref={heading} tabIndex={-1}>{t("quiz.whichIsBigger")}</h1>
        </div>
        <div className="sp-quiz-rocket"><Mascot pose="point" size={64} /></div>
      </div>
      <div className="sp-choices">
        {pair.map((object) => (
          <button type="button" className="sp-choice" key={object.id} aria-label={object.name}
            aria-disabled={Boolean(picked)} data-answer={picked && (object.id === bigger.id ? "correct" : picked === object.id ? "picked" : undefined)}
            onClick={() => { if (!picked) setPicked(object.id); }}>
            <span className="sp-choice-art"><ObjectArt art={object.art} /></span>
            <strong>{object.name}</strong>
          </button>
        ))}
      </div>
      <div className="sp-quiz-feedback" role="status" aria-atomic="true">
        {picked && <><strong>{picked === bigger.id ? t("quiz.yes") : t("quiz.goodTry")}</strong> {compareSizes(...pair)}</>}
      </div>
      {picked && <button className="sp-button sp-button-primary" type="button" onClick={advance}>
        {index === questions.length - 1 ? t("quiz.seeResults") : t("quiz.nextQuestion")} <span aria-hidden="true">→</span>
      </button>}
    </section>
  );
}
