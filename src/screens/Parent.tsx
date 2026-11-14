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

function paymentLink() {
  try {
    const url = new URL(import.meta.env.VITE_PAYMENT_LINK ?? "");
    if (url.protocol === "https:") return url.href;
  } catch {
    // Checkout is optional during development.
  }
  return undefined;
}

export function Unlock({ onBack }: { onBack: () => void }) {
  const link = paymentLink();
  return (
    <main className="shell narrow-shell">
      <header className="topbar"><span className="wordmark">Mission Control</span></header>
      <section className="panel parent-panel">
        <h1>Unlock missions</h1>
        <p>You’ve used your two free missions today. More free missions will be available tomorrow.</p>
        {link
          ? <a className="primary-button" href={link}>Continue to Stripe</a>
          : <p>Checkout is currently unavailable.</p>}
        <button type="button" className="quiet-button" onClick={onBack}>Back to setup</button>
      </section>
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
        <p>The microphone is used for a round only when you hold the talk button and allow access. Audio is sent to Mission Control’s speech recognition endpoint for the current request and discarded after processing. The audio and transcript aren’t saved to the profile. You can play every mission with buttons.</p>
        <h2>Checkout</h2>
        <p>A parent can open the Stripe checkout from the Unlock screen. Stripe handles any details entered there.</p>
      </article>
    </main>
  );
}
