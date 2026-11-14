import { useEffect, useState } from "react";
import type { AgeBand } from "../../shared/types";
import questions from "../../content/quiz.json";
import { useClipSpeech } from "../audio/useClipSpeech";
import { LearnPage } from "./Home";

export function Quiz({ ageBand, topic, onBack, onComplete }: {
  ageBand: AgeBand; topic?: string; onBack: () => void; onComplete: (points: number) => void;
}) {
  const bank = questions.filter((question) => question.ageBand === ageBand);
  const matching = bank.filter((question) => question.topic === topic);
  const quiz = topic ? [...matching, ...bank.filter((question) => question.topic !== topic)].slice(0, 3) : bank;
  const [index, setIndex] = useState(0);
  const [answer, setAnswer] = useState<string>();
  const [points, setPoints] = useState(0);
  const current = quiz[index];
  const { speak, stop } = useClipSpeech();
  const clipId = current && ageBand === "3-5" ? `quiz_${current.id}` : undefined;

  useEffect(() => {
    if (current) void speak(current.question, clipId);
  }, [clipId, current, speak]);

  function choose(choice: string) {
    if (answer !== undefined) return;
    setAnswer(choice);
    setPoints(points + (choice === current.answer ? 10 : 2));
    stop();
  }

  return (
    <LearnPage title={topic ? "Quick quiz" : "Quiz"} onBack={onBack}>
      {current && <section className="panel learn-card centered-card quiz-card">
        <p className="field-label">Question {index + 1} of {quiz.length}</p>
        {current.emoji && <p className="quiz-emoji" aria-hidden="true">{current.emoji}</p>}
        <h2>{current.question}</h2>
        <button type="button" className="quiet-button" onClick={() => {
          void speak(current.question, clipId);
        }}>Hear it</button>
        <div className="answer-list">
          {current.choices.map((choice) => (
            <button className="secondary-button" key={choice} type="button" disabled={answer !== undefined}
              data-result={answer !== undefined && choice === current.answer ? "correct" : undefined}
              onClick={() => choose(choice)}>{choice}</button>
          ))}
        </div>
        {answer !== undefined && <>
          <p role="status">{answer === current.answer ? "Correct! +10 XP" : "Good try! +2 XP"}</p>
          <button type="button" className="primary-button" onClick={() => {
            if (index === quiz.length - 1) onComplete(points);
            else {
              setAnswer(undefined);
              setIndex(index + 1);
            }
          }}>{index === quiz.length - 1 ? "Finish quiz" : "Next question"}</button>
        </>}
      </section>}
    </LearnPage>
  );
}
