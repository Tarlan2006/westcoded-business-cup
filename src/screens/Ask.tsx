import { useEffect, useRef, useState } from "react";
import { answerFromFaq, cleanQuestion, quizTopic } from "../../shared/ask-faq";
import type { AskRequest, AskResponse } from "../../shared/types";
import { speakFallback, stopSpeech } from "../audio/engine";
import { usePushToTalk } from "../game/usePushToTalk";
import { LearnPage } from "./Home";
import { useSoundEnabled } from "../audio/sfx";
import { GameButton, SpeechBubble } from "../components/GameUI";

async function askServer(question: string, controller: AbortController): Promise<AskResponse> {
  try {
    const response = await fetch("/api/ask", {
      method: "POST", cache: "no-store", signal: controller.signal,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question, ageBand: "6-8" } satisfies AskRequest),
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

export function Ask({ onBack, onAnswer, onQuiz }: {
  onBack: () => void; onAnswer: () => void; onQuiz: (topic: string) => void;
}) {
  const [question, setQuestion] = useState("");
  const [result, setResult] = useState<AskResponse>();
  const [topic, setTopic] = useState("sky and space");
  const [busy, setBusy] = useState(false);
  const [voiceHint, setVoiceHint] = useState("");
  const input = useRef<HTMLTextAreaElement>(null);
  const request = useRef<AbortController | null>(null);
  const sound = useSoundEnabled();

  function hint() {
    setVoiceHint("Type your question");
    input.current?.focus();
  }

  const voice = usePushToTalk(!busy && !result, (text) => { void submit(text); }, hint);

  useEffect(() => {
    return () => {
      request.current?.abort();
      request.current = null;
      stopSpeech();
    };
  }, []);

  async function submit(value: string) {
    const text = cleanQuestion(value);
    if (!text || request.current) return;
    voice.release(true);
    stopSpeech();
    const controller = new AbortController();
    request.current = controller;
    setBusy(true);
    setVoiceHint("");
    setQuestion("");
    const timeout = window.setTimeout(() => controller.abort(), 6700);
    try {
      const response = await askServer(text, controller);
      if (request.current !== controller) return;
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
    if (busy || voice.status !== "idle") return;
    stopSpeech();
    setVoiceHint("");
    voice.start();
  }

  const voiceLabel = voice.status === "opening" ? "Opening mic…" : voice.status === "recording"
    ? "Release to ask" : voice.status === "decoding" ? "Transcribing…" : "Hold to talk";

  return (
    <LearnPage title="Ask Mission Control" onBack={onBack}>
      <p className="learn-description">Ask about science or nature. Try “Why is the sky blue?”</p>
      {result ? (
        <section className="panel learn-card">
          <SpeechBubble className="ask-answer" live>{result.answer}</SpeechBubble>
          {result.source !== "refusal" && <span className="field-label">+5 XP</span>}
          {sound && <button type="button" className="quiet-button" onClick={() => {
            stopSpeech();
            void speakFallback(result.answer);
          }}>Hear answer</button>}
          <div className="answer-list">
            <button type="button" className="primary-button" onClick={() => {
              stopSpeech();
              setResult(undefined);
            }}>Ask another</button>
            <button type="button" className="secondary-button" onClick={() => onQuiz(topic)}>Quick quiz about this</button>
          </div>
        </section>
      ) : (
        <form className="panel learn-card" onSubmit={(event) => {
          event.preventDefault();
          void submit(question);
        }}>
          <GameButton tone="sky" className="talk-button" data-recording={voice.status === "recording" || undefined} disabled={busy || voice.status === "decoding"}
            onPointerDown={(event) => {
              if (!event.isPrimary || event.button !== 0) return;
              // Keep a denied microphone tap from moving focus back from the question field.
              event.preventDefault();
              event.currentTarget.focus({ preventScroll: true });
              event.currentTarget.setPointerCapture(event.pointerId);
              beginVoice();
            }}
            onPointerUp={() => voice.release()}
            onPointerCancel={voice.cancelHold}
            onLostPointerCapture={voice.cancelHold}
            onContextMenu={(event) => event.preventDefault()}
            onKeyDown={(event) => {
              if (event.key !== " " && event.key !== "Enter") return;
              event.preventDefault();
              if (!event.repeat) beginVoice();
            }}
            onKeyUp={(event) => {
              if (event.key === " " || event.key === "Enter") voice.release();
            }}
            onBlur={voice.cancelHold}>{voiceLabel}</GameButton>
          <label>
            <span className="field-label">Your question</span>
            <textarea ref={input} rows={2} required maxLength={200} autoComplete="off"
              value={question} onChange={(event) => {
                voice.release(true);
                setVoiceHint("");
                setQuestion(event.target.value);
              }} placeholder="Type your question" disabled={busy} />
          </label>
          <button type="submit" className="primary-button" disabled={busy || !question.trim()}>
            {busy ? "Thinking…" : "Ask"}
          </button>
          {voiceHint && <p role="status">{voiceHint}</p>}
        </form>
      )}
      <p className="learn-description text-sm">Mission Control doesn’t save your questions.</p>
    </LearnPage>
  );
}
