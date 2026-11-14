import type { ReactNode } from "react";

export interface SketchGameProps {
  /** Called from the result screen. Points are between 0 and 28. */
  onComplete: (points: number) => void;
  /** Back is available on every screen. */
  onBack: () => void;
  /** Optional speech. Without it, all clues remain available as text. */
  speak?: (text: string) => Promise<void> | void;
  /** Optional host header; null when the host renders its header outside the module. */
  header?: ReactNode;
}

export { SketchGame } from "./SketchGame";

export { sketchGameMeta } from "./meta";
