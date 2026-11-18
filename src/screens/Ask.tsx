import { t } from "../i18n/index";
import { HoldButton } from "../components/HoldButton";
import { useContext, useEffect, useRef, useState } from "react";
import { answerFromFaq, cleanQuestion, quizTopic } from "../../shared/ask-faq";
import type { AskRequest, AskResponse } from "../../shared/types";
import { suggestedQuestions, type TopicId } from "../../shared/topics";
import { speakFallback, stopSpeech } from "../audio/engine";
import { usePushToTalk } from "../game/usePushToTalk";
import { LearnPage } from "./Home";
import { useSoundEnabled } from "../audio/sfx";
import { SpeechBubble } from "../components/GameUI";
import { Mascot } from "../components/Mascot";
import { SessionActivity } from "../components/SessionControls";



async function askServer(question: string, controller: AbortController): Promise<AskResponse> {
  try {
    const response = await fetch("/api/ask", {
      method: "POST", cache: "no-store", signal: controller.signal,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question } satisfies AskRequest),
    });
    if (response.ok) {
      const result: Partial<AskResponse> | null = await response.json();
      if (typeof result?.answer === "string" && result.answer.trim() &&
        (result.source === "llm" || result.source === "faq" || result.source === "refusal")) {
        return { answer: result.answer.trim().slice(0, 400), source: result.source };
      }
    }
  } catch {
    // Use the built-in answers offline and when the Worker is unavailable.
  }
  return answerFromFaq(question);
}

export function Ask({ topics = [], onBack, onAnswer, onQuiz }: {
  topics?: TopicId[]; onBack: () => void; onAnswer: () => void; onQuiz: (topic: string) => void;
}) {
  const [question, setQuestion] = useState("");
  const [asked, setAsked] = useState("");
  const [result, setResult] = useState<AskResponse>();
  const [topic, setTopic] = useState("sky and space");
  const [busy, setBusy] = useState(false);
  const [voiceHint, setVoiceHint] = useState("");
  const input = useRef<HTMLTextAreaElement>(null);
  const request = useRef<AbortController | null>(null);
  const sound = useSoundEnabled();
  const session = useContext(SessionActivity);
  const finishing = session?.finishing ?? false;

  function hint() {
    setVoiceHint(t("ask.typeYourQuestion"));
    input.current?.focus();
  }

  const voice = usePushToTalk(!busy && !result, (text) => { void submit(text, true); }, hint, { transcribeTimeoutMs: 8000 });
  const recording = voice.status === "opening" || voice.status === "recording";

  useEffect(() => {
    if (finishing && !busy && voice.status === "idle") session?.finishActivity();
  }, [busy, finishing, session, voice.status]);

  useEffect(() => {
    return () => {
      request.current?.abort();
      request.current = null;
      stopSpeech();
    };
  }, []);

  async function submit(value: string, fromVoice = false) {
    const text = cleanQuestion(value);
    if (!text || request.current || (!fromVoice && session && !session.canStartActivity())) return;
    voice.release(true);
    stopSpeech();
    const controller = new AbortController();
    request.current = controller;
    setBusy(true);
    setVoiceHint("");
    setQuestion("");
    const timeout = window.setTimeout(() => controller.abort(), 9000);
    try {
      const response = await askServer(text, controller);
      if (request.current !== controller) return;
      setAsked(text);
      setResult(response);
      setTopic(quizTopic(text));
      if (response.source !== "refusal") onAnswer();
      if (sound) void speakFallback(response.answer);
    } finally {
      window.clearTimeout(timeout);
      if (request.current === controller) {
        request.current = null;
        setBusy(false);
      }
    }
  }

  function beginVoice() {
    if (busy || voice.status !== "idle" || (session && !session.canStartActivity())) return;
    stopSpeech();
    setVoiceHint("");
    voice.start();
  }

  const voiceLabel = voice.status === "opening" ? t("ask.openingMic") : voice.status === "recording"
    ? t("holdButton.letGoToSend") : voice.status === "decoding" ? t("ask.listening") : t("ask.holdToTalk");

  return (
    <LearnPage title={t("activitySuggestions.ask")} onBack={onBack}>
      <p className="learn-description">{t("ask.askAboutSpaceAnimalsOrHowThings")}</p>
      {result ? (
        <section className="panel learn-card">
          {asked && <p className="field-label ask-question">{t("ask.youAsked", { asked })}</p>}
          <div className="ask-host">
            <Mascot pose="point" size={72} className="ask-mascot" />
            <SpeechBubble className="ask-answer" live>{result.answer}</SpeechBubble>
          </div>
          {result.source !== "refusal" && <span className="field-label">+5 XP</span>}
          {sound && <button type="button" className="quiet-button" disabled={finishing} onClick={() => {
            stopSpeech();
            void speakFallback(result.answer);
          }}>{t("ask.hearAnswer")}</button>}
          <div className="answer-list">
            <button type="button" className="primary-button" disabled={finishing} onClick={() => {
              stopSpeech();
              setResult(undefined);
            }}>{t("ask.askAnother")}</button>
            <button type="button" className="secondary-button" disabled={finishing} onClick={() => onQuiz(topic)}>{t("ask.quickQuizAboutThis")}</button>
          </div>
        </section>
      ) : (
        <form className="panel learn-card" onSubmit={(event) => {
          event.preventDefault();
          void submit(question);
        }}>
          <Mascot pose={busy || voice.status === "decoding" ? "tablet" : "point"} className="ask-mascot-large" />
          <HoldButton talk hintKey="ask-talk" className="game-button talk-button" data-button-tone="sky"
            data-recording={voice.status === "recording" || undefined} disabled={busy || voice.status === "decoding" || (finishing && !recording)}
            onBegin={beginVoice} onRelease={() => voice.release()} onCancel={voice.cancelHold}>
            {voiceLabel}
          </HoldButton>
          <label>
            <span className="field-label">{t("ask.yourQuestion")}</span>
            <textarea ref={input} rows={2} required maxLength={200} autoComplete="off"
              value={question} onChange={(event) => {
                voice.release(true);
                setVoiceHint("");
                setQuestion(event.target.value);
              }} placeholder={t("ask.typeYourQuestion")} disabled={busy || finishing} />
          </label>
          <button type="submit" className="primary-button" disabled={busy || !question.trim() || finishing}>
            {busy ? t("ask.thinking") : t("ask.ask")}
          </button>
          {voiceHint && <p role="status">{voiceHint}</p>}
          <div className="answer-list ask-suggestions" aria-label={t("ask.tryAsking")}>
            {suggestedQuestions(topics).map((idea) => <button key={idea} type="button" className="quiet-button"
              disabled={busy || finishing} onClick={() => { void submit(idea); }}>{idea}</button>)}
          </div>
        </form>
      )}
      <p className="learn-description text-sm">{t("ask.doesnTSaveYourQuestions")}</p>
    </LearnPage>
  );
}
