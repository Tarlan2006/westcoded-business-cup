import type { SketchGameProps } from "./index";
import cases from "./cases.json";

/** The playable state machine is added after the canvas and scorer. */
export function SketchGame({ onBack }: SketchGameProps) {
  return <section className="sk-game"><button className="sk-back" onClick={onBack}>Back</button><h1>Case file: {cases[0].title}</h1></section>;
}
