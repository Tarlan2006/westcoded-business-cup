export interface SketchGameProps {
  /** Called from the result screen. Points are between 0 and 28. */
  onComplete: (points: number) => void;
  /** Back is available on every screen. */
  onBack: () => void;
  /** Optional speech. Without it, all clues remain available as text. */
  speak?: (text: string) => Promise<void> | void;
}

export { SketchGame } from "./SketchGame";

export const sketchGameMeta = {
  id: "sketch", title: "Sketch Artist", description: "Listen, then draw the hero!",
  icon: "✏️", ageBands: ["6-8"], activity: "sketch",
} as const;
