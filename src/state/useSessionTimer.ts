import { useCallback, useEffect, useRef, useState } from "react";
import { isSpeechActive, setMusic, speakFallback, stopSpeech } from "../audio/engine";

const storageKey = "mission-control.session";
const finishGraceMs = 30_000;
const reminderMs = 120_000;

interface TimedSession {
  startedAt: number;
  sessionEndsAt: number;
  reminded: boolean;
  complete?: boolean;
}

function readSession(): TimedSession | null {
  try {
    const data: Partial<TimedSession> | null = JSON.parse(localStorage.getItem(storageKey) ?? "null");
    if (typeof data?.startedAt === "number" && Number.isSafeInteger(data.startedAt) &&
        typeof data.sessionEndsAt === "number" && Number.isSafeInteger(data.sessionEndsAt) &&
        data.sessionEndsAt >= data.startedAt) {
      return { startedAt: data.startedAt, sessionEndsAt: data.sessionEndsAt, reminded: data.reminded === true, complete: data.complete === true };
    }
  } catch { /* An unavailable store still allows a session in this tab. */ }
  return null;
}

export function useSessionTimer(sound: boolean) {
  const [session, setSession] = useState(() => {
    const saved = readSession();
    // A reload never grants a fresh grace period to an expired session.
    return saved && Date.now() >= saved.sessionEndsAt ? { ...saved, complete: true } : saved;
  });
  const current = useRef(session);
  const [wrapUp, setWrapUp] = useState<"playing" | "finishing" | "settling">("playing");

  const save = useCallback((next: TimedSession | null) => {
    current.current = next;
    setSession(next);
    try {
      if (next) localStorage.setItem(storageKey, JSON.stringify(next));
      else localStorage.removeItem(storageKey);
    } catch { /* Keep the clock in this tab if storage is blocked. */ }
  }, []);

  const end = useCallback(() => {
    const active = current.current;
    if (!active || active.complete) return;
    stopSpeech();
    setMusic(false);
    save({ ...active, complete: true, sessionEndsAt: Math.max(active.startedAt, Math.min(active.sessionEndsAt, Date.now())) });
  }, [save]);

  const start = useCallback((minutes: number) => {
    const startedAt = Date.now();
    setWrapUp("playing");
    save({ startedAt, sessionEndsAt: startedAt + minutes * 60_000, reminded: false });
  }, [save]);

  const clear = useCallback(() => {
    setWrapUp("playing");
    save(null);
  }, [save]);

  const canStartActivity = useCallback(() => {
    const active = current.current;
    return !!active && !active.complete && Date.now() < active.sessionEndsAt;
  }, []);

  const canAcceptResult = useCallback((startedAt: number | undefined) => {
    const active = current.current;
    return !!active && active.startedAt === startedAt && !active.complete && Date.now() < active.sessionEndsAt + finishGraceMs;
  }, []);

  const extend = useCallback(() => {
    const active = current.current;
    if (active && canStartActivity()) save({ ...active, sessionEndsAt: active.sessionEndsAt + 5 * 60_000 });
  }, [canStartActivity, save]);

  const finishActivity = useCallback(() => {
    const active = current.current;
    if (!active || active.complete || Date.now() < active.sessionEndsAt) return;
    setWrapUp("settling");
  }, []);

  useEffect(() => {
    const sync = (event: StorageEvent) => {
      if (event.key !== storageKey && event.key !== null) return;
      const next = readSession();
      const previous = current.current;
      current.current = next;
      setSession(next);
      if (!next || next.startedAt !== previous?.startedAt || next.sessionEndsAt > Date.now()) {
        setWrapUp("playing");
      }
      if ((!next || next.complete) && previous && !previous.complete) {
        stopSpeech();
        setMusic(false);
      }
    };
    window.addEventListener("storage", sync);
    return () => window.removeEventListener("storage", sync);
  }, []);

  useEffect(() => {
    if (!session || session.complete) return;
    function check() {
      const active = current.current;
      if (!active || active.complete) return;
      const remaining = active.sessionEndsAt - Date.now();
      if (remaining <= -finishGraceMs || (remaining <= 0 && wrapUp === "settling" && !isSpeechActive())) {
        end();
      } else if (remaining <= 0) {
        setWrapUp((state) => state === "playing" ? "finishing" : state);
      } else if (sound && !document.hidden && !active.reminded && !isSpeechActive() && remaining <= reminderMs &&
          active.sessionEndsAt - active.startedAt >= reminderMs) {
        // A second visible tab may already have spoken the reminder.
        const stored = readSession();
        if (stored?.startedAt === active.startedAt && stored.reminded) return;
        save({ ...active, reminded: true });
        void speakFallback("Two more minutes, pal!");
      }
    }
    check();
    const interval = window.setInterval(check, 200);
    const limit = window.setTimeout(check, Math.max(0, session.sessionEndsAt + finishGraceMs - Date.now()));
    window.addEventListener("focus", check);
    window.addEventListener("pageshow", check);
    document.addEventListener("visibilitychange", check);
    return () => {
      window.clearInterval(interval);
      window.clearTimeout(limit);
      window.removeEventListener("focus", check);
      window.removeEventListener("pageshow", check);
      document.removeEventListener("visibilitychange", check);
    };
  }, [end, save, session, sound, wrapUp]);

  const finishBy = session ? session.sessionEndsAt + finishGraceMs : undefined;
  return { session, finishBy, finishing: wrapUp !== "playing", actionFinished: wrapUp === "settling",
    start, clear, end, extend, canStartActivity, canAcceptResult, finishActivity };
}
