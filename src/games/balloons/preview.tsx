import { lazy, Suspense, useState } from "react";
import { createRoot } from "react-dom/client";
import { Chip } from "../../components/GameUI";
import type { AgeGroup } from "./model";
import "./preview.css";

const BalloonsGame = lazy(() => import("./index"));
function Preview() {
  const [age, setAge] = useState<AgeGroup>("3-5");
  const [message, setMessage] = useState("");
  const [active, setActive] = useState(true);
  const [key, setKey] = useState(0);
  function restart(next = age) { setAge(next); setKey((old) => old + 1); setMessage(""); setActive(true); }
  return <>
    <div className="bl-preview-tools" aria-label="Preview controls"><span>DEV PREVIEW</span>
      {(["3-5", "6-8"] as const).map((value) => <Chip key={value} selected={age === value} onClick={() => restart(value)}>Ages {value}</Chip>)}
      {!active && <button type="button" onClick={() => restart()}>Return to preview</button>}
      <span role="status" className="bl-preview-message">{message}</span>
    </div>
    {active && <Suspense fallback={<p className="bl-preview-loading">Opening Balloon Count…</p>}>
      <BalloonsGame key={key} ageGroup={age} onBack={() => { setActive(false); setMessage("Back pressed. The host would show activities."); }}
        onComplete={(points) => setMessage(`onComplete(${points})`)} />
    </Suspense>}
  </>;
}
createRoot(document.getElementById("bl-preview-root")!).render(<Preview />);
