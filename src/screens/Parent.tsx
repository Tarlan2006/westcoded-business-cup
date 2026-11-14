import { useState } from "react";

export function ParentGate({ onPass, onBack }: { onPass: () => void; onBack: () => void }) {
  const [numbers] = useState(() => [7 + Math.floor(Math.random() * 6), 4 + Math.floor(Math.random() * 5)]);
  const [answer, setAnswer] = useState("");
  const [wrong, setWrong] = useState(false);
  return (
    <main className="shell narrow-shell">
      <header className="topbar"><span className="wordmark">Mission Control</span></header>
      <form className="panel parent-panel" onSubmit={(event) => {
        event.preventDefault();
        if (answer.trim() && Number(answer) === numbers[0] + numbers[1]) onPass();
        else setWrong(true);
      }}>
        <h1>For grown-ups</h1>
        <label className="gate-answer">
          <span className="field-label">What is {numbers[0]} + {numbers[1]}?</span>
          <input autoComplete="off" inputMode="numeric" value={answer} onChange={(event) => {
            setAnswer(event.target.value);
            setWrong(false);
          }} required />
        </label>
        {wrong && <p role="alert">Try that answer again.</p>}
        <button type="submit" className="primary-button">Continue</button>
        <button type="button" className="quiet-button" onClick={onBack}>Back</button>
      </form>
    </main>
  );
}

export function Privacy() {
  return (
    <main className="shell narrow-shell">
      <header className="topbar"><span className="wordmark">Mission Control</span><a className="quiet-button" href="/">Back to setup</a></header>
      <article className="panel parent-panel privacy">
        <h1>Privacy</h1>
        <h2>Profiles stay on this device</h2>
        <p>Mission Control needs no account, real name, or camera. Your chosen codename, age range, and game progress are saved in this browser. Clear this site’s data in your browser settings to remove them.</p>
        <h2>Voice is optional</h2>
        <p>The microphone is used for a round only when you hold the talk button and allow access. Cloudflare Workers AI transcribes the audio for that request. When Groq is enabled, it receives words from the game’s vocabulary to choose the next response. Mission Control saves neither audio nor transcripts to the profile. Avoid saying names or other personal details. You can play every mission with buttons.</p>
      </article>
    </main>
  );
}
