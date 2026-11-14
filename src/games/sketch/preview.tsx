import { useState } from "react";
// Only this dev harness imports React DOM; the game itself depends on React alone.
import { createRoot } from "react-dom/client";
import { SketchGame } from "./index";

let finishSpeech: (() => void) | undefined;
function stopSpeech() {
  finishSpeech?.();
  finishSpeech = undefined;
  window.speechSynthesis?.cancel();
}

/** Use installed local voices only; the preview never chooses a cloud voice. */
function previewSpeak(text: string): Promise<void> {
  stopSpeech();
  return new Promise((resolve, reject) => {
    if (!("speechSynthesis" in window)) { reject(new Error("Speech is unavailable")); return; }
    const voice = window.speechSynthesis.getVoices().find((entry) => entry.localService && /^en(?:-|_)/i.test(entry.lang));
    if (!voice) { reject(new Error("No local English voice is available")); return; }
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.voice = voice; utterance.lang = voice.lang; utterance.rate = 0.85;
    let finished = false;
    const finish = (failed = false) => {
      if (finished) return;
      finished = true; clearTimeout(timeout); finishSpeech = undefined;
      if (failed) reject(new Error("Speech could not play")); else resolve();
    };
    const timeout = setTimeout(() => { window.speechSynthesis.cancel(); finish(true); }, 25_000);
    finishSpeech = () => finish();
    utterance.onend = () => finish(); utterance.onerror = () => finish(true);
    window.speechSynthesis.speak(utterance);
  });
}

function Preview() {
  const [message, setMessage] = useState("");
  const [away, setAway] = useState(false);
  // ?text=1 exercises the exact same game without the optional speak prop.
  const textOnly = new URLSearchParams(window.location.search).get("text") === "1";
  return <main className="sk-preview-page">
    <div className="sk-preview-banner">SKETCH ARTIST · ISOLATED PLAYROOM</div>
    {message && <div className="sk-preview-message" role="status">{message}{away && <div><button type="button" className="sk-button" onClick={() => { setAway(false); setMessage(""); }}>Return to preview</button></div>}</div>}
    {!away && <SketchGame speak={textOnly ? undefined : previewSpeak}
      onBack={() => { stopSpeech(); setMessage("Back pressed — the host would show the previous screen."); setAway(true); }}
      onComplete={(points) => { stopSpeech(); setMessage(`Case complete! onComplete(${points}) · ${points} XP. Nothing was sent or saved.`); }} />}
  </main>;
}

const root = document.getElementById("sk-preview-root");
if (root) createRoot(root).render(<Preview />);
window.addEventListener("pagehide", stopSpeech);
