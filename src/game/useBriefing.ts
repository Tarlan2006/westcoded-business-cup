import { useLanguage } from "../i18n";
import { useEffect, useState } from "react";
import { playQueue, speakFallback, stopSpeech } from "../audio/engine";
import { lineFor } from "./content";


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

// Every available recording starts directly; cancelled briefings cannot block new ones.
export function useBriefing(ids: string[], paused: boolean, _preferClips = false) {
  const [spoken, setSpoken] = useState({ key: "", caption: "", speaking: false });
  const lang = useLanguage();
  const key = ids.join(" ");

  useEffect(() => {
    if (paused || !key) return;
    let active = true;
    void (async () => {
      for (const id of key.split(" ")) {
        if (!active) return;
        const line = lineFor(id);
        setSpoken({ key, caption: line.text, speaking: true });
        try {
          if (line.file) {
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
    })();
    return () => {
      active = false;
      stopSpeech();
    };
  }, [key, paused, lang]);

  const fallback = ids.length ? lineFor(ids.at(-1)!).text : "";
  return {
    caption: spoken.key === key ? spoken.caption : fallback,
    speaking: !paused && spoken.key === key && spoken.speaking,
  };
}
