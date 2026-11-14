/** Browser-check fixture only. Never imported by the game or preview entry. */
import { createRoot } from "react-dom/client";
import BalloonsGame from "./BalloonsGame";

export function mountTestHost(container: HTMLElement, events: Array<[string, (number | string)?]>) {
  const root = createRoot(container);
  root.render(<BalloonsGame ageGroup="6-8"
    speak={(text) => { events.push(["speak", text]); throw new Error("Voice unavailable"); }}
    onBack={() => { events.push(["back"]); }}
    onComplete={(points) => { events.push(["complete", points]); }} />);
  return () => root.unmount();
}
