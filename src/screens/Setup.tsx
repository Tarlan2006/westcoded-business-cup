import { useState } from "react";
import type { Mode, Profile } from "../../shared/types";
import { codenameFor, lineFor, MODES, recallLine } from "../game/content";
import { rankName } from "../state/progress";

export interface SetupOptions {
  mode: Mode;
  durationMinutes: number;
}

interface Props {
  profile: Profile;
  onBack: () => void;
  onStart: (options: SetupOptions) => void;
}

export function Setup({ profile, onStart, onBack }: Props) {
  const [mode, setMode] = useState<Mode>("hunt");
  const [durationMinutes, setDurationMinutes] = useState(10);
  const inCar = mode === "roadtrip";

  function changeLocation(car: boolean) {
    if (car) setMode("roadtrip");
    else if (inCar) setMode("hunt");
  }

  return (
    <main className="shell">
      <header className="topbar">
        <span className="wordmark"><span className="signal" aria-hidden="true" /> Mission Control</span>
        <button type="button" className="quiet-button" onClick={onBack}>Home</button>
      </header>
      <section className="setup-layout">
        <div className="setup-intro">
          <h1>Brief your<br className="desktop-break" /> <em>agent.</em></h1>
          <p>Pick a mission and hand over the controls.</p>
          <div className="radar" aria-hidden="true"><span /><span /><span /><i /></div>
          <aside className="progress-card">
            <div>
              <span className="field-label">Agent {codenameFor(profile.codenameId)}</span>
              <strong>{rankName(profile?.rank ?? 0)}</strong>
            </div>
            <div className="progress-values">
              <span>{profile?.xp ?? 0} XP</span>
              <span>{profile?.streak ?? 0} day streak</span>
            </div>
            {profile?.lastMode && <p>{lineFor(recallLine[profile.lastMode]).text}</p>}
          </aside>
        </div>
        <form className="panel setup-form" onSubmit={(event) => {
          event.preventDefault();
          onStart({ mode, durationMinutes });
        }}>
          <h2>Mission setup</h2>
          <fieldset>
            <legend className="field-label">Location</legend>
            <div className="segmented">
              <button type="button" aria-pressed={!inCar} onClick={() => changeLocation(false)}>At home</button>
              <button type="button" aria-pressed={inCar} onClick={() => changeLocation(true)}>In the car</button>
            </div>
          </fieldset>
          <fieldset>
            <legend className="field-label">Mission</legend>
            <div className="mode-options">
              {(inCar ? ["roadtrip"] as const : ["hunt", "lava"] as const).map((option) => (
                <button type="button" className="mode-option" aria-pressed={mode === option} key={option} onClick={() => setMode(option)}>
                  <span className="mode-icon" aria-hidden="true">{MODES[option].icon}</span>
                  <span><strong>{MODES[option].name}</strong><small>{MODES[option].description}</small></span>
                  <span className="selected-dot" aria-hidden="true" />
                </button>
              ))}
            </div>
          </fieldset>
          <div className="form-row duration-row">
            <fieldset>
              <legend className="field-label">Duration</legend>
              <div className="segmented">
                {[10, 20, 30].map((minutes) => (
                  <button type="button" aria-pressed={durationMinutes === minutes} key={minutes} onClick={() => setDurationMinutes(minutes)}>{minutes} min</button>
                ))}
              </div>
            </fieldset>
            <label><span className="field-label">Voice</span><select defaultValue="hq"><option value="hq">HQ</option></select></label>
          </div>
          <p className="safety">
            <strong>Parent check</strong>{" "}
            {inCar ? "Passengers only. Stay buckled and keep the driver focused."
              : "An adult should supervise. Clear the floor, walk, and keep both feet on the ground."}
          </p>
          <button className="primary-button" type="submit">Start mission <span aria-hidden="true">↗</span></button>
        </form>
      </section>
    </main>
  );
}
