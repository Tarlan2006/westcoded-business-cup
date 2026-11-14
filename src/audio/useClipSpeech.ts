import { useCallback, useEffect, useRef } from "react";
import { hostVoiceReady, playQueue, speakFallback, stopSpeech } from "./engine";

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
    if (clipId && !hostVoiceReady()) {
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
