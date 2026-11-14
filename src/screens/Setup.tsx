import { useState } from "react";
import type { AgeBand, Mode, Profile } from "../../shared/types";
import { codenames, lineFor, MODES, recallLine } from "../game/content";
import { rankName } from "../state/progress";

export interface SetupOptions {
  codenameId: string;
  ageBand: AgeBand;
  mode: Mode;
  durationMinutes: number;
}

interface Props {
  profiles: Profile[];
  selectedId?: string;
  onStart: (options: SetupOptions) => void;
}

export function Setup({ profiles, selectedId, onStart }: Props) {
  const saved = profiles.find((profile) => profile.id === selectedId);
  const [codenameId, setCodenameId] = useState(saved && codenames.includes(saved.codenameId) ? saved.codenameId : codenames[0]);
  const [ageBand, setAgeBand] = useState<AgeBand>(saved?.ageBand ?? "6-8");
  const [mode, setMode] = useState<Mode>("hunt");
  const [durationMinutes, setDurationMinutes] = useState(10);
  const profile = profiles.find((entry) => entry.codenameId === codenameId);
  const inCar = mode === "roadtrip";

  function changeLocation(car: boolean) {
    if (car) setMode("roadtrip");
    else if (inCar) setMode("hunt");
  }

  return (
    <main className="shell">
      <header className="topbar">
        <span className="wordmark"><span className="signal" aria-hidden="true" /> Mission Control</span>
        <a className="quiet-button" href="/privacy">Privacy</a>
      </header>
      <section className="setup-layout">
        <div className="setup-intro">
          <h1>Brief your<br className="desktop-break" /> <em>agent.</em></h1>
          <p>Pick a mission and hand over the controls.</p>
          <div className="radar" aria-hidden="true"><span /><span /><span /><i /></div>
          <aside className="progress-card">
            <div>
              <span className="field-label">Agent {lineFor(codenameId).text}</span>
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
          onStart({ codenameId, ageBand, mode, durationMinutes });
        }}>
          <h2>Mission setup</h2>
          <div className="form-row">
            <label><span className="field-label">Codename</span>
              <select value={codenameId} onChange={(event) => {
                const id = event.target.value;
                setCodenameId(id);
                const savedProfile = profiles.find((entry) => entry.codenameId === id);
                if (savedProfile) setAgeBand(savedProfile.ageBand);
              }}>
                {codenames.map((id) => <option key={id} value={id}>{lineFor(id).text}</option>)}
              </select>
            </label>
            <label><span className="field-label">Age</span>
              <select value={ageBand} onChange={(event) => setAgeBand(event.target.value as AgeBand)}>
                {(["3-5", "6-8", "9-11"] as const).map((band) => <option value={band} key={band}>{band.replace("-", "–")}</option>)}
              </select>
            </label>
          </div>
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
