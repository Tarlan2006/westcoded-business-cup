import { useState } from "react";
import type { AgeBand } from "../../shared/types";
import { Mascot } from "../components/Mascot";
import { codenameFor, codenames } from "../game/content";
import { defaultPreferences, type Preferences } from "../state/preferences";
import type { ChildProfile } from "../state/progress";
import { LearnPage } from "./Home";

const ages: { value: AgeBand; label: string; summary: string }[] = [
  { value: "1-2", label: "1–2", summary: "Videos" },
  { value: "3-5", label: "3–5", summary: "Play & learn" },
  { value: "6-8", label: "6–8", summary: "Play, learn & ask" },
];

const interests: { value: Preferences["first"]; label: string }[] = [
  { value: "any", label: "Surprise us" },
  { value: "active", label: "Move & play" },
  { value: "learn", label: "Think & learn" },
  { value: "watch", label: "Watch a video" },
];

export function ProfileSetup({ profile, profiles, onBack, onSave, onPrivacy }: {
  profile?: ChildProfile;
  profiles: ChildProfile[];
  onBack?: () => void;
  onPrivacy?: () => void;
  onSave: (codename: string, ageBand: AgeBand, preferences: Preferences) => void;
}) {
  const [ageBand, setAgeBand] = useState(profile?.ageBand);
  const [step, setStep] = useState(1);
  const editing = Boolean(onBack);
  const [codename, setCodename] = useState(profile?.codenameId ?? codenames[0]);
  const [preferences, setPreferences] = useState(() => {
    const saved = profile?.preferences ?? defaultPreferences;
    return profile?.ageBand === "1-2" ? { ...saved, first: "any" as const } : saved;
  });
  const used = new Set(profiles.filter((entry) => entry.id !== profile?.id).map((entry) => entry.codenameId));
  const names = [...new Set([codename, ...codenames.filter((id) => !used.has(id))])];
  const onlyVideos = ageBand === "1-2";

  const form = (
    <form className="panel setup-form centered-card" onSubmit={(event) => {
      event.preventDefault();
      if (!editing && !onlyVideos && step === 1 && ageBand) { setStep(2); return; }
      if (ageBand) onSave(codename, ageBand, onlyVideos ? { ...preferences, first: "watch" } : preferences);
    }}>
      {!editing && <div className="flow-form-progress" role="status">
        <span className="field-label">{onlyVideos ? "One quick step: age and time" : `Step ${step} of 2: ${step === 1 ? "age and time" : "where and what first"}`}</span>
        <div aria-hidden="true"><span data-current={step >= 1} />{!onlyVideos && <span data-current={step >= 2} />}</div>
      </div>}
      {(editing || step === 1) && <>
      <fieldset>
        <legend className="field-label">How old is your child?</legend>
        <div className="age-choices">
          {ages.map(({ value, label, summary }) => (
            <label key={value} className="age-choice">
              <input type="radio" name="age" value={value} required checked={ageBand === value}
                onChange={() => setAgeBand(value)} />
              <span><strong>{label}</strong><span>{summary}</span></span>
            </label>
          ))}
        </div>
      </fieldset>
      <fieldset>
        <legend className="field-label">How much play time do you have?</legend>
        <div className="segmented">
          {([10, 20, 30] as const).map((minutes) => <button key={minutes} type="button"
            aria-pressed={preferences.minutes === minutes}
            onClick={() => setPreferences({ ...preferences, minutes })}>{minutes} min</button>)}
        </div>
      </fieldset>
      </>}
      {!onlyVideos && (editing || step === 2) && <>
        <fieldset>
          <legend className="field-label">Where are you playing?</legend>
          <div className="segmented">
            <button type="button" aria-pressed={preferences.location === "home"}
              onClick={() => setPreferences({ ...preferences, location: "home" })}>At home</button>
            <button type="button" aria-pressed={preferences.location === "car"}
              onClick={() => setPreferences({ ...preferences, location: "car" })}>In the car</button>
          </div>
        </fieldset>
        <fieldset>
          <legend className="field-label">What would you like to see first?</legend>
          <div className="segmented interests">
            {interests.map(({ value, label }) => <button key={value} type="button"
              aria-pressed={preferences.first === value}
              onClick={() => setPreferences({ ...preferences, first: value })}>{label}</button>)}
          </div>
        </fieldset>
      </>}
      {(editing || step === 2 || onlyVideos) && <label>
        <span className="field-label">Agent codename</span>
        <select value={codename} onChange={(event) => setCodename(event.target.value)}>
          {names.map((id) => <option key={id} value={id}>{codenameFor(id)}</option>)}
        </select>
      </label>}
      <div className="flow-form-actions">
        {!editing && step === 2 && <button className="secondary-button" type="button" onClick={() => setStep(1)}>← Back</button>}
        <button className="primary-button" type="submit" disabled={!ageBand}>{editing ? "Save changes" : step === 1 && !onlyVideos ? "Next" : "See activities"}</button>
      </div>
      <a className="privacy-link" href="/privacy" onClick={onPrivacy ? (event) => { event.preventDefault(); onPrivacy(); } : undefined}>Privacy</a>
    </form>
  );

  if (onBack) return <LearnPage title="Parent settings" onBack={onBack}>
    <p className="learn-description">Changes apply right away</p>{form}
  </LearnPage>;

  return (
    <main className="shell learn-shell learn-page">
      <header className="welcome-hero">
        <div>
          <h1>Mission Control</h1>
          <p>Games, quizzes and videos that get kids moving and learning, so you get a few calm minutes</p>
        </div>
        <Mascot />
      </header>
      <ul className="flow-promises" aria-label="Good to know"><li>No account</li><li>No camera</li><li>Progress stays on this device</li></ul>
      <p className="flow-intro-note">A few quick choices help us find the right activities for your child.</p>
      {form}
    </main>
  );
}
