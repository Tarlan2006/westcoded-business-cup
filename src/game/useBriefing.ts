import { useEffect, useState } from "react";
import { hostVoiceReady, playQueue, speakFallback, stopSpeech } from "../audio/engine";
import { lineFor } from "./content";

let playback: Promise<void> = Promise.resolve();

export async function within<T>(promise: Promise<T>, milliseconds: number, fallback: T): Promise<T> {
  let timer = 0;
  try {
    return await Promise.race([
      promise,
      new Promise<T>((resolve) => { timer = window.setTimeout(() => resolve(fallback), milliseconds); }),
    ]);
  } finally {
    window.clearTimeout(timer);
  }
}

export function useBriefing(ids: string[], paused: boolean) {
  const [spoken, setSpoken] = useState({ key: "", caption: "", speaking: false });
  const key = ids.join(" ");

  useEffect(() => {
    if (paused || !key) return;
    let active = true;
    playback = playback.catch(() => {}).then(async () => {
      for (const id of key.split(" ")) {
        if (!active) return;
        const line = lineFor(id);
        setSpoken({ key, caption: line.text, speaking: true });
        try {
          if (line.file && !hostVoiceReady()) {
            try {
              await playQueue([id]);
              continue;
            } catch {
              // Use the same line when a clip is missing.
            }
          }
          if (active) await speakFallback(line.text);
        } catch {
          // Captions and timer work when audio is unavailable.
        }
      }
      if (active) setSpoken((previous) => ({ ...previous, speaking: false }));
    });
    return () => {
      active = false;
      stopSpeech();
    };
  }, [key, paused]);

  const fallback = ids.length ? lineFor(ids.at(-1)!).text : "";
  return {
    caption: spoken.key === key ? spoken.caption : fallback,
    speaking: !paused && spoken.key === key && spoken.speaking,
  };
}
