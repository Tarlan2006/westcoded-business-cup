import { useState } from "react";
import { LearnPage } from "./Home";

export function ParentGate({ onPass, onBack }: { onPass: () => void; onBack: () => void }) {
  const [numbers] = useState(() => [7 + Math.floor(Math.random() * 6), 4 + Math.floor(Math.random() * 5)]);
  const [answer, setAnswer] = useState("");
  const [wrong, setWrong] = useState(false);
  return (
    <LearnPage title="For grown-ups" onBack={onBack}>
      <form className="panel parent-panel centered-card" onSubmit={(event) => {
        event.preventDefault();
        if (answer.trim() && Number(answer) === numbers[0] + numbers[1]) onPass();
        else setWrong(true);
      }}>
        <label className="gate-answer">
          <span className="field-label">What is {numbers[0]} + {numbers[1]}?</span>
          <input autoComplete="off" inputMode="numeric" value={answer} onChange={(event) => {
            setAnswer(event.target.value);
            setWrong(false);
          }} required />
        </label>
        {wrong && <p role="alert">Try that answer again.</p>}
        <button type="submit" className="primary-button">Continue</button>
      </form>
    </LearnPage>
  );
}

export function Privacy() {
  return (
    <LearnPage title="Privacy" backHref="/">
      <article className="panel parent-panel privacy centered-card">
        <h2>Profiles stay on this device</h2>
        <p>Mission Control needs no account, real name, or camera. Your chosen codename, age range, activity preferences, and game progress are saved in this browser. Clear this site’s data in your browser settings to remove them.</p>
        <h2>Voice is optional</h2>
        <p>The microphone is used for a round only when you hold the talk button and allow access. Cloudflare Workers AI transcribes the audio for that request. When Groq is enabled, it receives words from the game’s vocabulary to choose the next response. Mission Control saves neither audio nor transcripts to the profile. Avoid saying names or other personal details. You can play every mission with buttons.</p>
        <h2>Questions in Learn</h2>
        <p>Ask Mission Control sends the question text to our server. If Groq is enabled, it receives the question to answer it. Mission Control does not save questions to the profile or record them in its logs. Please leave out names, addresses, schools, and phone numbers.</p>
        <h2>Video library</h2>
        <p>When you open a video, its player loads from YouTube. You choose when to start playback.</p>
      </article>
    </LearnPage>
  );
}
