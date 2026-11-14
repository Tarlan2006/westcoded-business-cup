import { useEffect, useRef, useState } from "react";
import { transcribe } from "../lib/api";
import { startRecording, stopRecording } from "../voice/recorder";
import { within } from "./useBriefing";

type Status = "idle" | "opening" | "recording" | "decoding";

interface Recording {
  cancel: boolean;
  released: boolean;
  started: boolean;
  timer?: number;
  finish: () => Promise<void>;
}

export function usePushToTalk(enabled: boolean, submit: (text: string) => void, onUnavailable?: () => void) {
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");
  const current = useRef<Recording | null>(null);
  const onSubmit = useRef(submit);
  onSubmit.current = submit;
  const fallback = useRef(onUnavailable);
  fallback.current = onUnavailable;

  function unavailable(message: string) {
    if (fallback.current) fallback.current();
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
          const text = await within(transcribe(wav), 4000, "");
          if (recording.cancel) return;
          if (text.trim()) onSubmit.current(text);
          else unavailable("Voice unavailable. Tap I DID IT! to keep playing.");
        } catch {
          if (!recording.cancel) unavailable("Voice unavailable. Tap I DID IT! to keep playing.");
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
      if (fallback.current) fallback.current();
      else setMessage("Microphone unavailable. Tap I DID IT! to keep playing.");
    }, 5000);
    void startRecording().then(() => {
      window.clearTimeout(recording.timer);
      recording.started = true;
      if (recording.released) return recording.finish();
      setStatus("recording");
      recording.timer = window.setTimeout(() => release(), 8000);
    }).catch(() => {
      window.clearTimeout(recording.timer);
      if (current.current === recording) {
        current.current = null;
        setStatus("idle");
        if (!recording.cancel) unavailable("Microphone unavailable. Tap I DID IT! to keep playing.");
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

  return { status, message, start, release };
}
