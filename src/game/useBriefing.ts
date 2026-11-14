import { useEffect, useState } from "react";
import { playQueue, speakFallback } from "../audio/engine";
import { lineFor } from "./content";

let manifest: Promise<unknown> | undefined;
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

function hasClip(value: unknown, id: string): boolean {
  if (Array.isArray(value)) return value.some((entry) => entry?.id === id);
  if (typeof value !== "object" || value === null) return false;
  const entries = value as Record<string, unknown>;
  return Object.hasOwn(entries, id) || hasClip(entries.clips ?? entries.lines, id);
}

export function useBriefing(ids: string[], paused: boolean) {
  const [spoken, setSpoken] = useState({ key: "", caption: "", speaking: false });
  const key = ids.join(" ");

  useEffect(() => {
    if (paused || !key) return;
    let active = true;
    let usingSpeech = false;
    let stopSpeech: (() => void) | undefined;
    playback = playback.catch(() => {}).then(async () => {
      for (const id of key.split(" ")) {
        if (!active) return;
        const line = lineFor(id);
        setSpoken({ key, caption: line.text, speaking: true });
        try {
          if (line.file) {
            manifest ??= within(
              fetch("/audio/manifest.json").then((response) => response.ok ? response.json() : null).catch(() => null),
              2000, null,
            );
            if (hasClip(await manifest, id)) {
              if (!active) return;
              try {
                await playQueue([id]);
                continue;
              } catch {
                // Use the same caption if playback fails.
              }
            }
          }
          if (!active) return;
          usingSpeech = true;
          const cancelled = new Promise<void>((resolve) => { stopSpeech = resolve; });
          await within(Promise.race([speakFallback(line.text), cancelled]), Math.max(3000, line.text.length * 95), undefined);
          if (active) window.speechSynthesis?.cancel();
          usingSpeech = false;
          stopSpeech = undefined;
        } catch {
          // Captions and timer work when audio is unavailable.
        }
      }
      if (active) setSpoken((previous) => ({ ...previous, speaking: false }));
    });
    return () => {
      active = false;
      if (usingSpeech) {
        stopSpeech?.();
        window.speechSynthesis?.cancel();
      }
    };
  }, [key, paused]);

  const fallback = ids.length ? lineFor(ids.at(-1)!).text : "";
  return {
    caption: spoken.key === key ? spoken.caption : fallback,
    speaking: !paused && spoken.key === key && spoken.speaking,
  };
}
