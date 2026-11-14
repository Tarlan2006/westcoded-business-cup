import { useEffect, useRef, useState } from "react";
import { answerFromFaq, cleanQuestion, quizTopic } from "../../shared/ask-faq";
import type { AskRequest, AskResponse } from "../../shared/types";
import { speakFallback, stopSpeech } from "../audio/engine";
import { usePushToTalk } from "../game/usePushToTalk";
import { LearnPage } from "./Home";

interface LocalRecognition extends EventTarget {
  processLocally: boolean;
  lang: string;
  start(): void;
  abort(): void;
  onresult: ((event: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
}

type RecognitionConstructor = new () => LocalRecognition;

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
  const recognition = useRef<LocalRecognition | null>(null);
  const speechTimer = useRef<number>(undefined);
  const detectedVoice = useRef(false);

  function hint() {
    setVoiceHint("Type your question");
    input.current?.focus();
  }

  function stopRecognition() {
    window.clearTimeout(speechTimer.current);
    const active = recognition.current;
    recognition.current = null;
    if (active) {
      active.onend = null;
      active.onerror = null;
      active.onresult = null;
      active.abort();
    }
  }

  function useBrowserSpeech() {
    if (!detectedVoice.current || request.current) return;
    const browser = window as Window & {
      SpeechRecognition?: RecognitionConstructor; webkitSpeechRecognition?: RecognitionConstructor;
    };
    const Recognition = browser.SpeechRecognition ?? browser.webkitSpeechRecognition;
    if (!Recognition || recognition.current) {
      hint();
      return;
    }
    const local = new Recognition();
    if (!("processLocally" in local)) { hint(); return; }
    local.processLocally = true;
    local.lang = "en-US";
    recognition.current = local;
    setVoiceHint("Listening on this device…");
    local.onresult = (event) => {
      const text = event.results[0]?.[0]?.transcript;
      stopRecognition();
      if (text?.trim()) {
        setVoiceHint("");
        setQuestion(cleanQuestion(text));
        input.current?.focus();
      } else hint();
    };
    const failed = () => { stopRecognition(); hint(); };
    local.onerror = failed;
    local.onend = failed;
    try {
      local.start();
      speechTimer.current = window.setTimeout(failed, 6500);
    } catch {
      failed();
    }
  }

  const voice = usePushToTalk(!busy && !result, (text) => {
    setQuestion(cleanQuestion(text));
    setVoiceHint("");
    input.current?.focus();
  }, useBrowserSpeech);

  useEffect(() => {
    function stopWhenHidden() {
      if (document.hidden) stopRecognition();
    }
    document.addEventListener("visibilitychange", stopWhenHidden);
    return () => {
      document.removeEventListener("visibilitychange", stopWhenHidden);
      request.current?.abort();
      request.current = null;
      stopRecognition();
      stopSpeech();
    };
  }, []);

  async function submit() {
    const text = cleanQuestion(question);
    if (!text || request.current) return;
    stopRecognition();
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
      void speakFallback(response.answer);
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
    stopRecognition();
    stopSpeech();
    detectedVoice.current = true;
    setVoiceHint("");
    voice.start();
  }

  function cancelVoice() {
    detectedVoice.current = false;
    voice.release(true);
  }

  const voiceLabel = voice.status === "opening" ? "Opening mic…" : voice.status === "recording"
    ? "Release to keep question" : voice.status === "decoding" ? "Transcribing…" : "Hold to talk";

  return (
    <LearnPage title="Ask Mission Control" onBack={onBack}>
      <p className="learn-description">Ask about science or nature. Try “Why is the sky blue?”</p>
      {result ? (
        <section className="panel learn-card">
          <p className="ask-answer" aria-live="polite">{result.answer}</p>
          <button type="button" className="quiet-button" onClick={() => {
            stopSpeech();
            void speakFallback(result.answer);
          }}>Hear answer</button>
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
          void submit();
        }}>
          <button type="button" className="secondary-button talk-button" disabled={busy || voice.status === "decoding"}
            onPointerDown={(event) => {
              if (!event.isPrimary || event.button !== 0) return;
              event.currentTarget.setPointerCapture(event.pointerId);
              beginVoice();
            }}
            onPointerUp={() => voice.release()}
            onPointerCancel={cancelVoice}
            onLostPointerCapture={() => voice.release()}
            onContextMenu={(event) => event.preventDefault()}
            onKeyDown={(event) => {
              if (event.key !== " " && event.key !== "Enter") return;
              event.preventDefault();
              if (!event.repeat) beginVoice();
            }}
            onKeyUp={(event) => {
              if (event.key === " " || event.key === "Enter") voice.release();
            }}
            onBlur={cancelVoice}>{voiceLabel}</button>
          <label>
            <span className="field-label">Your question</span>
            <textarea ref={input} rows={2} required maxLength={200} autoComplete="off"
              value={question} onChange={(event) => {
                stopRecognition();
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
