import { t } from "../i18n/index";
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
    <LearnPage title={t("setup.chooseYourGame")} xp={xp} onBack={onBack}>
      <form className="panel setup-form centered-card" onSubmit={(event) => {
        event.preventDefault();
        onStart(mode, minutes);
      }}>
        <fieldset>
          <legend className="field-label">{t("setup.whereWillYouPlay")}</legend>
          <div className="segmented">
            <button type="button" aria-pressed={location === "home"} onClick={() => {
              if (location === "car") setMode("hunt");
            }}>{t("profileSetup.atHome")}</button>
            <button type="button" aria-pressed={location === "car"} onClick={() => setMode("roadtrip")}>{t("profileSetup.inTheCar")}</button>
          </div>
        </fieldset>
        <fieldset>
          <legend className="field-label">{t("setup.game")}</legend>
          <div className="segmented">
            {activeModes(location).map((option) => (
              <button key={option} type="button" aria-pressed={mode === option}
                onClick={() => setMode(option)}>{MODES[option].name}</button>
            ))}
          </div>
        </fieldset>
        <fieldset>
          <legend className="field-label">{t("setup.howLong")}</legend>
          <div className="segmented">
            {[...new Set([...quietTimeGoals, preferences.minutes])].sort((a, b) => a - b).map((option) => (
              <button key={option} type="button" aria-pressed={minutes === option}
                onClick={() => setMinutes(option)}>{t("setup.min", { option })}</button>
            ))}
          </div>
        </fieldset>
        <p className="safety"><strong>{t("setup.parentCheck")}</strong>{" "}
          {location === "car" ? t("setup.passengersOnlyStayBuckledAndKeepThe")
            : t("setup.playWithAnAdultNearbyClearThe")}
        </p>
        <button className="primary-button" type="submit">{t("setup.startGame")}</button>
      </form>
    </LearnPage>
  );
}
