import { t } from "../i18n/index";
import { useMusicPause } from "../audio/useMusicPause";
import { useEffect, useRef, useState } from "react";
import { transcribe } from "../lib/api";
import { startRecording, stopRecording } from "../voice/recorder";

type Status = "idle" | "opening" | "recording" | "decoding";

interface Recording {
  cancel: boolean;
  released: boolean;
  started: boolean;
  timer?: number;
  finish: () => Promise<void>;
}

export type VoiceProblem = "microphone" | "no-speech";

export interface PushToTalkOptions { maxRecordMs?: number; transcribeTimeoutMs?: number }

export function usePushToTalk(enabled: boolean, submit: (text: string) => void,
  onUnavailable?: (problem: VoiceProblem) => void, options: PushToTalkOptions = {}) {
  const { maxRecordMs = 8000, transcribeTimeoutMs } = options;
  const [status, setStatus] = useState<Status>("idle");
  useMusicPause(status !== "idle");
  const [message, setMessage] = useState("");
  const current = useRef<Recording | null>(null);
  const onSubmit = useRef(submit);
  onSubmit.current = submit;
  const fallback = useRef(onUnavailable);
  fallback.current = onUnavailable;

  function unavailable(message: string, problem: VoiceProblem = "microphone") {
    if (fallback.current) fallback.current(problem);
    else setMessage(message);
  }

  function release(cancel = false) {
    const recording = current.current;
    if (!recording) return;
    recording.cancel ||= cancel;
    recording.released = true;
    if (recording.started) void recording.finish();
    if (cancel) {
      window.clearTimeout(recording.timer);
      setStatus("idle");
    }
  }

  function cancelHold() {
    const recording = current.current;
    // A disabled button can lose focus as soon as decoding starts.
    if (recording && !recording.released) release(true);
  }

  function start() {
    if (!enabled || current.current) return;
    setMessage("");
    setStatus("opening");
    let stopping = false;
    const recording: Recording = {
      cancel: false, released: false, started: false,
      async finish() {
        if (stopping) return;
        stopping = true;
        window.clearTimeout(recording.timer);
        if (!recording.cancel) setStatus("decoding");
        try {
          const wav = await stopRecording();
          if (recording.cancel) return;
          const text = await transcribe(wav, transcribeTimeoutMs);
          if (recording.cancel) return;
          if (text.trim()) onSubmit.current(text);
          else unavailable(t("usePushToTalk.voiceUnavailableTapIDidItTo"), "no-speech");
        } catch {
          if (!recording.cancel) unavailable(t("usePushToTalk.voiceUnavailableTapIDidItTo"));
        } finally {
          window.clearTimeout(recording.timer);
          if (current.current === recording) {
            current.current = null;
            setStatus("idle");
          }
        }
      },
    };
    current.current = recording;
    recording.timer = window.setTimeout(() => {
      release(true);
      if (fallback.current) fallback.current("microphone");
      else setMessage(t("usePushToTalk.microphoneUnavailableTapIDidItTo"));
    }, 5000);
    void startRecording(maxRecordMs).then(() => {
      window.clearTimeout(recording.timer);
      recording.started = true;
      if (recording.released) return recording.finish();
      setStatus("recording");
      recording.timer = window.setTimeout(() => release(), maxRecordMs);
    }).catch(() => {
      window.clearTimeout(recording.timer);
      if (current.current === recording) {
        current.current = null;
        setStatus("idle");
        if (!recording.cancel) unavailable(t("usePushToTalk.microphoneUnavailableTapIDidItTo"));
      }
    });
  }

  useEffect(() => {
    function onVisibilityChange() {
      if (document.hidden) release(true);
    }
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => {
      release(true);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [enabled]);

  return { status, message, start, release, cancelHold };
}
