import { useState } from "react";
import type { Mode } from "../../shared/types";
import { MODES } from "../game/content";
import { activeModes, quietTimeGoals, type Preferences } from "../state/preferences";
import { LearnPage } from "./Home";

export function Setup({ initialMode, preferences, xp, onBack, onStart }: {
  initialMode: Mode; preferences: Preferences; xp: number; onBack: () => void;
  onStart: (mode: Mode, minutes: Preferences["minutes"]) => void;
}) {
  const [mode, setMode] = useState(initialMode);
  const [minutes, setMinutes] = useState(preferences.minutes);
  const location = mode === "roadtrip" ? "car" : "home";

  return (
    <LearnPage title="Choose your game" xp={xp} onBack={onBack}>
      <form className="panel setup-form centered-card" onSubmit={(event) => {
        event.preventDefault();
        onStart(mode, minutes);
      }}>
        <fieldset>
          <legend className="field-label">Where will you play?</legend>
          <div className="segmented">
            <button type="button" aria-pressed={location === "home"} onClick={() => {
              if (location === "car") setMode("hunt");
            }}>At home</button>
            <button type="button" aria-pressed={location === "car"} onClick={() => setMode("roadtrip")}>In the car</button>
          </div>
        </fieldset>
        <fieldset>
          <legend className="field-label">Game</legend>
          <div className="segmented">
            {activeModes(location).map((option) => (
              <button key={option} type="button" aria-pressed={mode === option}
                onClick={() => setMode(option)}>{MODES[option].name}</button>
            ))}
          </div>
        </fieldset>
        <fieldset>
          <legend className="field-label">How long?</legend>
          <div className="segmented">
            {[...new Set([10, ...quietTimeGoals, preferences.minutes])].sort((a, b) => a - b).map((option) => (
              <button key={option} type="button" aria-pressed={minutes === option}
                onClick={() => setMinutes(option)}>{option} min</button>
            ))}
          </div>
        </fieldset>
        <p className="safety"><strong>Parent check</strong>{" "}
          {location === "car" ? "Passengers only. Stay buckled and keep the driver focused."
            : "Play with an adult nearby. Clear the floor, walk, and keep both feet on the ground."}
        </p>
        <button className="primary-button" type="submit">Start game</button>
      </form>
    </LearnPage>
  );
}
