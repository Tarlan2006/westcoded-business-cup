import { HoldButton } from "../components/HoldButton";
import { usePushToTalk } from "../game/usePushToTalk";
import { matchQuizSpeech } from "../../shared/quiz-speech";
import { contentText, t, useLanguage } from "../i18n/index";
import { useContext, useEffect, useEffectEvent, useRef, useState } from "react";
import type { AgeBand } from "../../shared/types";
import questions from "../../content/quiz.json";
import { useClipSpeech } from "../audio/useClipSpeech";
import { useSoundEnabled } from "../audio/sfx";
import { GameButton } from "../components/GameUI";
import { Mascot } from "../components/Mascot";
import { LearnPage } from "./Home";
import { MissionStage, missionButtonStyle, missionReplyStyle } from "../components/MissionStage";
import { SessionActivity } from "../components/SessionControls";

export function Quiz({ ageBand, topic, missionMinutes, cycle = 0, onBack, onComplete, onExit = onBack }: {
  ageBand: AgeBand; topic?: string; missionMinutes?: number; cycle?: number;
  onBack: () => void; onComplete: (points: number) => void; onExit?: () => void;
}) {
  const session = useContext(SessionActivity);
  const lang = useLanguage();
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
  const nextLabel = index === quiz.length - 1 || session?.finishing ? t("quiz.finishQuiz") : t("quiz.nextQuestion");

  useEffect(() => {
    if (sound && current) void speak(contentText("quiz." + current.id + ".question"), clipId);
    return stop;
  }, [lang, clipId, current, sound, speak, stop]);

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
    if (sound && choice !== current.answer) {
      void speak(contentText("voice.common_quiz_encourage"), "common_quiz_encourage");
    } else stop();
  }

  const [heard, setHeard] = useState("");
  function trySpoken(text: string) {
    const index = matchQuizSpeech(text, current.choices.map((_, i) => contentText("quiz." + current.id + ".option" + i)), lang);
    if (index >= 0) { choose(current.choices[index]); setHeard(""); } else setHeard(text);
  }
  const voice = usePushToTalk(!!current && answer === undefined && !session?.finishing, trySpoken, () => setHeard(" "));
  const emotion = answer !== undefined ? (answer === current.answer ? "correct" : "wrong")
    : voice.status === "recording" || voice.status === "opening" ? "listening"
    : voice.status === "decoding" ? "thinking" : index === 0 ? "greeting" : "idle";
  const voiceControl = answer === undefined && <>
    <HoldButton talk hintKey="quiz-talk" className="quiet-button" onBegin={() => { stop(); voice.start(); }} onRelease={() => voice.release()} onCancel={voice.cancelHold} disabled={session?.finishing || voice.status === "decoding"}>
      {voice.status === "recording" ? t("holdButton.letGoToSend") : t("ask.holdToTalk")}
    </HoldButton>
    {heard && <label>{t("quiz.editAnswer")} <input value={heard} onChange={event => setHeard(event.target.value)} onKeyDown={event => { if (event.key === "Enter") trySpoken(heard); }} /><button type="button" onClick={() => trySpoken(heard)}>{t("quiz.submitAnswer")}</button></label>}
  </>;

  function next() {
    setHeard("");
    if (completed.current) return;
    if (index === quiz.length - 1 || (session && !session.canStartActivity())) {
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
    return <MissionStage heading={t("activitySuggestions.quiz")} round={index + 1} total={quiz.length} seconds={roundSeconds} clockSeconds={seconds} ratio={roundSeconds / roundDuration}
      demoEmoji={current.emoji && !current.emoji.includes(" ") ? current.emoji : "🧠"} demoWord={t("quiz.quiz")} prop="💭"
      emotion={emotion} action={answer === current.answer ? "clap" : "none"} mood={answer === current.answer ? "excited" : "detective"} onExit={onExit}
      prompt={answer === undefined ? [contentText("quiz." + current.id + ".question"), current.emoji?.includes(" ") ? current.emoji : ""].filter(Boolean).join(" ") : answer === current.answer ? t("quiz.correct10Xp") : t("quiz.goodTry2Xp")}
      feedback={answer === current.answer}
      replies={current.choices.map((choice, i) => <button type="button" key={choice} className={missionReplyStyle} disabled={answer !== undefined}
        data-result={answer !== undefined && choice === current.answer ? "correct" : undefined} onClick={() => choose(choice)}>{contentText("quiz." + current.id + ".option" + i)}</button>)}
      controls={<>{voiceControl}
        <button type="button" className={`${missionButtonStyle} btn-mint text-[#062C1E]`} disabled={answer === undefined} onClick={next}>
          {nextLabel}
        </button>
        <button type="button" className={`${missionButtonStyle} btn-sky`} disabled={!sound || answer !== undefined || session?.finishing}
          onClick={() => { void speak(contentText("quiz." + current.id + ".question"), clipId); }}>{t("quiz.hearIt")}</button>
      </>} />;
  }

  return (
    <LearnPage title={topic ? t("quiz.quickQuiz") : t("activitySuggestions.quiz")} onBack={onBack}>
      {current && <section className="panel learn-card centered-card quiz-card">
        <p className="field-label">{t("quiz.questionOf", { value1: index + 1, value2: quiz.length })}</p>
        <Mascot pose={emotion === "correct" ? "jump" : "point"} emotion={emotion} eventKey={index} size={120} className="mx-auto" />
        {current.emoji && <p className="quiz-emoji" aria-hidden="true">{current.emoji}</p>}
        <h2>{contentText("quiz." + current.id + ".question")}</h2>
        {sound && <button type="button" className="quiet-button" disabled={session?.finishing} onClick={() => {
          void speak(contentText("quiz." + current.id + ".question"), clipId);
        }}>{t("sketchGame.hearIt")}</button>}
        {voiceControl}
        <div className="answer-list">
          {current.choices.map((choice, i) => (
            <button className="secondary-button" key={choice} type="button" disabled={answer !== undefined}
              data-result={answer !== undefined && choice === current.answer ? "correct" : undefined}
              onClick={() => choose(choice)}>{contentText("quiz." + current.id + ".option" + i)}</button>
          ))}
        </div>
        {answer !== undefined && <>
          <p role="status">{answer === current.answer ? t("quiz.correct10Xp") : t("quiz.goodTry2Xp")}</p>
          <GameButton onClick={next}>{nextLabel}</GameButton>
        </>}
      </section>}
    </LearnPage>
  );
}
