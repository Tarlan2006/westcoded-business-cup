import { useState } from "react";
// The development entry point mounts React. The game itself depends only on React.
import { createRoot } from "react-dom/client";
import { SpaceGame, SpaceViewer } from "./index";

function speakLocally(text: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const speech = window.speechSynthesis;
    const voice = speech?.getVoices().find((entry) => entry.localService && /^en(?:-|$)/i.test(entry.lang));
    if (!voice) {
      reject(new Error("No local English voice"));
      return;
    }
    const words = new SpeechSynthesisUtterance(text);
    words.voice = voice;
    words.lang = voice.lang;
    words.rate = .9;
    const timeout = window.setTimeout(() => {
      speech.cancel();
      reject(new Error("Speech timed out"));
    }, 15000);
    words.onend = () => {
      window.clearTimeout(timeout);
      resolve();
    };
    words.onerror = () => {
      window.clearTimeout(timeout);
      reject(new Error("Speech is unavailable"));
    };
    speech.speak(words);
  });
}

function Preview() {
  const [message, setMessage] = useState("");
  const [away, setAway] = useState(false);
  const query = new URLSearchParams(window.location.search);
  const Game = query.get("view") === "1" ? SpaceViewer : SpaceGame;
  return <main>
    {message && <div className="sp-preview-message" role="status">
      {message}
      {away && <button type="button" className="sp-button sp-button-soft" onClick={() => {
        setAway(false);
        setMessage("");
      }}>Return to preview</button>}
    </div>}
    {!away && <Game speak={query.get("text") === "1" ? undefined : speakLocally} onBack={() => {
      window.speechSynthesis?.cancel();
      setAway(true);
      setMessage("Back pressed. The host would show the previous screen.");
    }} onComplete={(points) => {
      window.speechSynthesis?.cancel();
      setMessage(`onComplete(${points}) · ${points} XP`);
    }} />}
  </main>;
}

const root = document.getElementById("sp-preview-root");
if (root) createRoot(root).render(<Preview />);
