import { useEffect, useEffectEvent, useRef, useState } from "react";
import type { AgeBand } from "../../shared/types";
import questions from "../../content/quiz.json";
import { useClipSpeech } from "../audio/useClipSpeech";
import { useSoundEnabled } from "../audio/sfx";
import { GameButton } from "../components/GameUI";
import { Mascot } from "../components/Mascot";
import { LearnPage } from "./Home";
import { MissionStage, missionButtonStyle, missionReplyStyle } from "../components/MissionStage";

export function Quiz({ ageBand, topic, missionMinutes, cycle = 0, onBack, onComplete, onExit = onBack }: {
  ageBand: AgeBand; topic?: string; missionMinutes?: number; cycle?: number;
  onBack: () => void; onComplete: (points: number) => void; onExit?: () => void;
}) {
  const bank = questions.filter((question) => question.ageBand === ageBand);
  const matching = bank.filter((question) => question.topic === topic);
  const ordered = topic ? [...matching, ...bank.filter((question) => question.topic !== topic)] : bank;
  const offset = missionMinutes && ordered.length ? cycle * 3 % ordered.length : 0;
  const quiz = topic || missionMinutes ? [...ordered.slice(offset), ...ordered.slice(0, offset)].slice(0, 3) : ordered;
  const [index, setIndex] = useState(0);
  const [answer, setAnswer] = useState<string>();
  const [points, setPoints] = useState(0);
  const [startedAt] = useState(Date.now);
  const [roundStartedAt, setRoundStartedAt] = useState(startedAt);
  const [now, setNow] = useState(startedAt);
  const completed = useRef(false);
  const current = quiz[index];
  const { speak, stop } = useClipSpeech();
  const sound = useSoundEnabled();
  const clipId = current && (ageBand === "1-2" || ageBand === "3-5") ? `quiz_${current.id}` : undefined;
  const roundDuration = ageBand === "6-8" && index === 0 ? 40 : 35;
  const roundSeconds = Math.max(0, roundDuration - Math.floor((now - roundStartedAt) / 1000));
  const advanceOnTimeout = useEffectEvent(() => next());

  useEffect(() => {
    if (sound && current) void speak(current.question, clipId);
    return stop;
  }, [clipId, current, sound, speak, stop]);

  useEffect(() => {
    if (!missionMinutes) return;
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [missionMinutes]);

  useEffect(() => {
    if (missionMinutes && current && roundSeconds === 0 && answer === undefined) advanceOnTimeout();
  }, [missionMinutes, current, roundSeconds, answer]);

  function choose(choice: string) {
    if (answer !== undefined) return;
    setAnswer(choice);
    setPoints(points + (choice === current.answer ? 10 : 2));
    stop();
  }

  function next() {
    if (completed.current) return;
    if (index === quiz.length - 1) {
      completed.current = true;
      onComplete(points);
    } else {
      setAnswer(undefined);
      if (missionMinutes) {
        const time = Date.now();
        setNow(time);
        setRoundStartedAt(time);
      }
      setIndex(index + 1);
    }
  }

  if (current && missionMinutes) {
    const seconds = Math.max(0, missionMinutes * 60 - Math.floor((now - startedAt) / 1000));
    return <MissionStage heading="Quiz" round={index + 1} total={quiz.length} seconds={roundSeconds} clockSeconds={seconds} ratio={roundSeconds / roundDuration}
      demoEmoji={current.emoji && !current.emoji.includes(" ") ? current.emoji : "🧠"} demoWord="QUIZ!" prop="💭"
      action={answer === current.answer ? "clap" : "none"} mood={answer === current.answer ? "excited" : "detective"} onExit={onExit}
      prompt={answer === undefined ? [current.question, current.emoji?.includes(" ") ? current.emoji : ""].filter(Boolean).join(" ") : answer === current.answer ? "Correct! +10 XP" : "Good try! +2 XP"}
      feedback={answer !== undefined}
      replies={current.choices.map((choice) => <button type="button" key={choice} className={missionReplyStyle} disabled={answer !== undefined}
        data-result={answer !== undefined && choice === current.answer ? "correct" : undefined} onClick={() => choose(choice)}>{choice}</button>)}
      controls={<>
        <button type="button" className={`${missionButtonStyle} btn-mint text-[#062C1E]`} disabled={answer === undefined} onClick={next}>
          {index === quiz.length - 1 ? "Finish quiz" : "Next question"}
        </button>
        <button type="button" className={`${missionButtonStyle} btn-sky text-white`} disabled={!sound || answer !== undefined}
          onClick={() => { void speak(current.question, clipId); }}>🔊 Hear it</button>
      </>} />;
  }

  return (
    <LearnPage title={topic ? "Quick quiz" : "Quiz"} onBack={onBack}>
      {current && <section className="panel learn-card centered-card quiz-card">
        <p className="field-label">Question {index + 1} of {quiz.length}</p>
        {current.emoji && <p className="quiz-emoji" aria-hidden="true">{current.emoji}</p>}
        <h2>{current.question}</h2>
        {sound && <button type="button" className="quiet-button" onClick={() => {
          void speak(current.question, clipId);
        }}>Hear it</button>}
        <div className="answer-list">
          {current.choices.map((choice) => (
            <button className="secondary-button" key={choice} type="button" disabled={answer !== undefined}
              data-result={answer !== undefined && choice === current.answer ? "correct" : undefined}
              onClick={() => choose(choice)}>{choice}</button>
          ))}
        </div>
        {answer !== undefined && <>
          <Mascot pose={answer === current.answer ? "jump" : "point"} size={120} className="mx-auto" />
          <p role="status">{answer === current.answer ? "Correct! +10 XP" : "Good try! +2 XP"}</p>
          <GameButton onClick={next}>{index === quiz.length - 1 ? "Finish quiz" : "Next question"}</GameButton>
        </>}
      </section>}
    </LearnPage>
  );
}
