import { createContext, useContext } from "react";
import { playSfx, unlock } from "./engine";

export const SoundEnabled = createContext(true);
export const useSoundEnabled = () => useContext(SoundEnabled);

const effects = { chirp: "whoosh", win: "fanfare", giggle: "radio", tick: "tick" } as const;

export function uiSound(effect: keyof typeof effects, enabled: boolean) {
  if (!enabled) return;
  void unlock().then(() => playSfx(effects[effect])).catch(() => {});
}
