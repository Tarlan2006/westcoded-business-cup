import { useCallback, useEffect, useRef } from "react";
import { contentText } from "../i18n";
import { useSoundEnabled } from "./sfx";
import { playQueue, speakFallback, stopSpeech } from "./engine";

export function useClipSpeech() {
  const generation = useRef(0);
  const stop = useCallback(() => {
    generation.current++;
    stopSpeech();
  }, []);

  useEffect(() => stop, [stop]);

  const speak = useCallback(async (text: string, clipId?: string) => {
    stop();
    const current = generation.current;
    if (clipId) {
      try {
        await playQueue([clipId]);
        return;
      } catch {
        // A missing or unavailable recording still has a spoken fallback.
      }
    }
    if (current === generation.current) await speakFallback(text);
  }, [stop]);

  return { speak, stop };
}

/** Speak once per missed attempt, even when two guides display the same game result. */
export function useEncouragement(missed: boolean) {
  const { speak } = useClipSpeech();
  const sound = useSoundEnabled();
  const previous = useRef(false);
  useEffect(() => {
    if (missed && !previous.current && sound) void speak(contentText("voice.common_quiz_encourage"), "common_quiz_encourage");
    previous.current = missed;
  }, [missed, sound, speak]);
}
