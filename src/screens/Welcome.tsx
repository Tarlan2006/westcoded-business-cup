import { useEffect, useRef, useState } from "react";
import { APP_NAME } from "../brand";
import { playQueue, speakFallback, stopSpeech, unlock } from "../audio/engine";
import { useSoundEnabled } from "../audio/sfx";
import { GameButton, SpeechBubble } from "../components/GameUI";
import { Mascot } from "../components/Mascot";

const greeting = "Hi! I'm Bleep! Ready for a screen-free adventure?";

export function Welcome({ onContinue, onToggleSound }: { onContinue: () => void; onToggleSound: () => void }) {
  const [stage, setStage] = useState(0);
  const heard = useRef(false);
  const sound = useSoundEnabled();

  useEffect(() => {
    const timers = [window.setTimeout(() => setStage(1), 210), window.setTimeout(() => setStage(2), 480),
      window.setTimeout(() => setStage(3), 680)];
    return () => timers.forEach((timer) => window.clearTimeout(timer));
  }, []);

  function speakGreeting() {
    if (!sound || heard.current) return;
    heard.current = true;
    void unlock().then(() => heard.current ? playQueue(["common_intro_01"]) : undefined).catch(() => {
      if (heard.current) void speakFallback(greeting);
    });
  }

  if (stage < 3) return <main className="recon-welcome recon-splash" aria-label="Loading Mission Control">
    <div className="welcome-bleep"><Mascot mood="happy" /></div>
    <h1>{APP_NAME}</h1>
    <progress value={stage + 1} max={3} aria-label="Loading progress" />
    <p role="status">{["Waking up Bleep…", "Charging space antennas…", "Ready!"][stage]}</p>
  </main>;

  return <main className="recon-welcome recon-greeting">
    <header><strong>{APP_NAME}</strong><button className="quiet-button welcome-sound" type="button"
      aria-pressed={sound} onClick={() => { heard.current = false; onToggleSound(); }}>Sound {sound ? "on" : "off"}</button></header>
    <div className="recon-greeting-stage">
      <SpeechBubble><h1>Hi! I'm Bleep!</h1><p>Ready for a screen-free adventure?</p></SpeechBubble>
      <div className="welcome-bleep"><Mascot mood="happy" action="wave" playful /></div>
      {sound && <button className="quiet-button welcome-sound" type="button" onClick={speakGreeting}>🔊 Hear Bleep</button>}
    </div>
    <GameButton tone="lime" className="welcome-continue" onClick={() => { heard.current = false; stopSpeech(); onContinue(); }}>
      Continue <span aria-hidden="true">↗</span>
    </GameButton>
  </main>;
}
