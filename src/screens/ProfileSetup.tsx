import { useState } from "react";
import type { AgeBand } from "../../shared/types";
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

export function ProfileSetup({ profile, profiles, onBack, onSave }: {
  profile?: ChildProfile;
  profiles: ChildProfile[];
  onBack?: () => void;
  onSave: (codename: string, ageBand: AgeBand, preferences: Preferences) => void;
}) {
  const [ageBand, setAgeBand] = useState(profile?.ageBand);
  const [codename, setCodename] = useState(profile?.codenameId ?? codenames[0]);
  const [preferences, setPreferences] = useState(profile?.preferences ?? defaultPreferences);
  const used = new Set(profiles.filter((entry) => entry.id !== profile?.id).map((entry) => entry.codenameId));
  const names = [...new Set([codename, ...codenames.filter((id) => !used.has(id))])];
  const onlyVideos = ageBand === "1-2";

  return (
    <LearnPage title={onBack ? "Parent settings" : "Set up your day"} onBack={onBack} wide>
      <div className="intake-layout">
        <div className="intake-intro">
          <p>Pick an age and tell us where you’re playing. We’ll show activities that fit.</p>
          <div className="radar" aria-hidden="true"><span /><span /><span /><i /></div>
          <a className="quiet-button" href="/privacy">Privacy</a>
        </div>
        <form className="panel setup-form intake-form" onSubmit={(event) => {
          event.preventDefault();
          if (ageBand) onSave(codename, ageBand, onlyVideos ? { ...preferences, first: "watch" } : preferences);
        }}>
          <fieldset>
            <legend className="field-label">How old is your child?</legend>
            <div className="age-choices">
              {ages.map(({ value, label, summary }) => (
                <label key={value} className="age-choice">
                  <input type="radio" name="age" value={value} required checked={ageBand === value}
                    onChange={() => {
                      if (ageBand === "1-2" && value !== "1-2" && preferences.first === "watch") {
                        setPreferences({ ...preferences, first: "any" });
                      }
                      setAgeBand(value);
                    }} />
                  <span><strong>{label}</strong><span>{summary}</span></span>
                </label>
              ))}
            </div>
          </fieldset>
          <label>
            <span className="field-label">Agent codename</span>
            <select value={codename} onChange={(event) => setCodename(event.target.value)}>
              {names.map((id) => <option key={id} value={id}>{codenameFor(id)}</option>)}
            </select>
          </label>
          {!onlyVideos && <>
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
              <legend className="field-label">Active mission length</legend>
              <div className="segmented">
                {([10, 20, 30] as const).map((minutes) => <button key={minutes} type="button"
                  aria-pressed={preferences.minutes === minutes}
                  onClick={() => setPreferences({ ...preferences, minutes })}>{minutes} min</button>)}
              </div>
            </fieldset>
            <fieldset>
              <legend className="field-label">What sounds fun today?</legend>
              <div className="segmented interests">
                {interests.map(({ value, label }) => <button key={value} type="button"
                  aria-pressed={preferences.first === value}
                  onClick={() => setPreferences({ ...preferences, first: value })}>{label}</button>)}
              </div>
            </fieldset>
          </>}
          <button className="primary-button" type="submit">Show activities <span aria-hidden="true">↗</span></button>
        </form>
      </div>
    </LearnPage>
  );
}
