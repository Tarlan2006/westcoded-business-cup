import { t, subscribe } from "../i18n/index";
import { LanguageSwitch } from "../i18n/LanguageSwitch";
import { useRef, useState } from "react";
import type { AgeBand } from "../../shared/types";
import { uiSound, useSoundEnabled } from "../audio/sfx";
import { Mascot } from "../components/Mascot";
import { codenameFor, codenames } from "../game/content";
import { defaultPreferences, quietTimeGoals, type ChildNeed, type Preferences } from "../state/preferences";
import type { ChildProfile } from "../state/progress";
import "./ProfileSetup.css";

function makeAges() { return [["1-2", t("profileSetup.12Yrs")], ["3-5", t("profileSetup.35Yrs")], ["6-8", t("profileSetup.68Yrs")]] as const; }
let ages = makeAges();
subscribe(() => { ages = makeAges(); });
function makeInterestsPlaceholders(): Record<AgeBand, string> { return {
  "1-2": t("profileSetup.myChildLovesAnimalsSoMaybeSome"),
  "3-5": t("profileSetup.keepThemBusyWithDinosaurGamesAnd"),
  "6-8": t("profileSetup.lovesTheMoonAndStarsKeepThem"),
}; }
let interestsPlaceholders = makeInterestsPlaceholders();
subscribe(() => { interestsPlaceholders = makeInterestsPlaceholders(); });
function makeNeeds() { return [
  ["energy", "energy", t("profileSetup.getEnergyOutIndoors")], ["screen", "screen", t("profileSetup.lessPassiveScreenTime")],
  ["listening", "speech", t("profileSetup.talkingAndListening")], ["science", "rocket", t("profileSetup.scienceAndCuriosity")],
] as const; }
let needs = makeNeeds();
subscribe(() => { needs = makeNeeds(); });
function makeSessionFlows() { return [
  { value: "learn", icon: "quiz", title: t("profileSetup.watchAndLearn"), detail: t("profileSetup.aShortScienceVideoThenAsksFun") },
  { value: "active", icon: "energy", title: t("profileSetup.moveAndPlay"), detail: t("profileSetup.jumpingHuntingAndVoiceGamesNoWatching") },
] as const; }
let sessionFlows = makeSessionFlows();
subscribe(() => { sessionFlows = makeSessionFlows(); });

function SetupIcon({ name, className = "" }: { name: string; className?: string }) {
  return <svg className={`profile-icon ${className}`} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" focusable="false">
    <use href={`${import.meta.env.BASE_URL}icons/profile-setup.svg#${name}`} />
  </svg>;
}

export function ProfileSetup({ profile, profiles, onBack, onSave, onPrivacy }: {
  profile?: ChildProfile; profiles: ChildProfile[];
  onBack?: () => void; onSave: (id: string, ageBand: AgeBand, preferences: Preferences) => void; onPrivacy: () => void;
}) {
  const saved = profile?.preferences;
  const [age, setAge] = useState<AgeBand>(profile?.ageBand ?? "3-5");
  const [name, setName] = useState(saved?.nickname ?? "");
  const nameInput = useRef<HTMLInputElement>(null);
  const [nameError, setNameError] = useState(false);
  const validName = name.trim().length > 0 && name.length <= 20;
  function showNameError() {
    setNameError(true);
    nameInput.current?.focus();
  }
  const [notes, setNotes] = useState(saved?.notes ?? "");
  const [selected, setNeeds] = useState<ChildNeed[]>(saved?.needs?.filter(need => need !== "habits") ?? ["energy", "screen"]);
  const [minutes, setMinutes] = useState(defaultPreferences.minutes);
  const [customMinutes, setCustomMinutes] = useState(String(defaultPreferences.minutes));
  const [custom, setCustom] = useState(false);
  const [flow, setFlow] = useState<(typeof sessionFlows)[number]["value"]>(saved?.first === "active" ? "active" : "learn");
  const [location, setLocation] = useState(saved?.location ?? defaultPreferences.location);
  const sound = useSoundEnabled();
  const code = profile?.codenameId ?? codenames.find((id) => !profiles.some((item) => item.codenameId === id)) ?? codenames[0];
  const display = name.trim() || codenameFor(code);

  return <main id="screen-profile-setup" className="prototype-screen profile-setup">
    <form className="profile-setup-form space-y-5"
      onSubmit={(event) => {
        event.preventDefault();
        if (!validName) { showNameError(); return; }
        uiSound("chirp", sound);
        onSave(code, age, { ...defaultPreferences, ...saved, location, minutes: custom && customMinutes.trim() ? Number(customMinutes) : minutes, first: age === "1-2" ? "watch" : flow,
          nickname: name.trim() || undefined, notes: notes.trim() || undefined, needs: selected });
      }}>
      <div className="profile-setup-heading flex flex-wrap items-center justify-between gap-2 pb-4">
        <div className="flex min-w-0 items-center gap-3">
          <Mascot pose="wave" size={72} className="shrink-0" />
          <div>
            <span className="profile-setup-kicker text-xs font-extrabold uppercase tracking-wider">{t("profileSetup.setUpIn1Minute")}</span>
            <h1 className="font-display text-2xl sm:text-3xl font-bold leading-tight">{t("profileSetup.tellAboutYourChild")}</h1>
          </div>
        </div>
        <LanguageSwitch />
        <a href="/privacy" onClick={(event) => { event.preventDefault(); onPrivacy(); }}
          className="profile-local-profile hidden sm:inline-block shrink-0 px-3 py-1 rounded-full text-xs font-extrabold" aria-label={t("profileSetup.savedOnThisPhonePrivacy")}><SetupIcon name="shield" /> {t("profileSetup.savedOnThisPhone")}</a>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="profileNameInput" className="profile-label block text-xs font-extrabold uppercase tracking-wider mb-2">{t("profileSetup.whatShouldCallYourChild")}</label>
          <input ref={nameInput} id="profileNameInput" type="text" autoComplete="off" value={name} required minLength={1} maxLength={20} placeholder={codenameFor(code)}
            aria-invalid={nameError && !validName} aria-describedby={`profileNameHint${nameError && !validName ? " profileNameError" : ""}`}
            onInvalid={event => { event.preventDefault(); showNameError(); }}
            onKeyDown={event => { if (event.key === "Enter" && !validName) { event.preventDefault(); showNameError(); } }}
            onBlur={() => { if (!validName) setNameError(true); }}
            onChange={(event) => { setName(event.target.value); setNameError(false); }} className="profile-field w-full px-4 py-3 rounded-2xl font-display font-semibold text-xl" />
          <p className="profile-hint mt-1.5 text-xs" id="profileNameHint">{t("profileSetup.aFirstNameOrNicknameStaysOn")}</p>
          {nameError && !validName && <p id="profileNameError" role="alert" className="profile-error mt-1 text-xs">{name.trim() ? t("profileSetup.pleaseUseNoMoreThan20Characters") : t("profileSetup.pleaseEnterANameOrNickname")}</p>}
        </div>
        <fieldset className="min-w-0">
          <legend className="profile-label block text-xs font-extrabold uppercase tracking-wider mb-2">{t("profileSetup.childSAge")}</legend>
          <div className="grid grid-cols-3 gap-2" id="profileAgeGroup">
            {ages.map(([value, label]) => <button key={value} type="button" data-age={value} aria-pressed={age === value}
              className="prof-age-btn profile-choice min-h-13 rounded-2xl font-display font-bold text-base"
              onClick={() => { setAge(value); uiSound("chirp", sound); }}>{label}</button>)}
          </div>
        </fieldset>
      </div>

      <fieldset>
        <legend className="profile-label block text-xs font-extrabold uppercase tracking-wider mb-2">{t("profileSetup.whatDoYouWantHelpWithPick")}</legend>
        <div className="flex flex-wrap gap-2" id="needsChips">
          {needs.map(([value, icon, label]) => <button key={value} type="button" aria-pressed={selected.includes(value)}
            onClick={() => { setNeeds((items) => items.includes(value) ? items.filter((item) => item !== value) : [...items, value]); uiSound("chirp", sound); }}
            className="need-chip profile-choice inline-flex min-h-11 items-center gap-2 px-3.5 py-2 rounded-2xl text-sm font-extrabold"><SetupIcon name={icon} /> {label}</button>)}
        </div>
      </fieldset>

      <div>
        <label htmlFor="profileNotesInput" className="profile-label block text-xs font-extrabold uppercase tracking-wider mb-2">{t("profileSetup.childSInterestsOptional")}</label>
        <textarea id="profileNotesInput" rows={2} maxLength={600} autoComplete="off" value={notes} onChange={(event) => setNotes(event.target.value)}
          placeholder={interestsPlaceholders[age]}
          className="profile-field w-full min-h-21 px-4 py-3 rounded-2xl font-bold text-sm" />
        <p className="profile-hint mt-1 text-xs">{t("profileSetup.staysOnThisDeviceNeverSentTo")}</p>
      </div>

      <div className="profile-goal p-4 rounded-2xl">
        <div>
          <div className="font-display font-bold text-base" id="quietTimeLabel">{t("profileSetup.howMuchQuietTimeDoYouNeed")}</div>
          <div className="profile-hint text-xs font-bold">{t("profileSetup.playsForExactlyThisLongThenStops")}</div>
        </div>
        <div className="profile-duration-options" role="group" aria-labelledby="quietTimeLabel" id="profileDurationPills">
          {quietTimeGoals.map((value) => <button key={value} type="button" data-min={value} aria-pressed={!custom && minutes === value}
            onClick={() => { setMinutes(value); setCustom(false); setCustomMinutes(String(value)); uiSound("chirp", sound); }}
            className="prof-dur-btn profile-choice rounded-2xl font-display font-bold text-sm">{t("profileSetup.min", { value })}</button>)}
          <label className="profile-field profile-custom-time rounded-2xl text-xs font-bold" data-selected={custom}>
            <input type="text" inputMode="numeric" pattern="(?:[5-9]|[1-8][0-9]|90)" required={custom}
              aria-label={t("profileSetup.customMinutes")} aria-describedby="customTimeHint" placeholder={t("profileSetup.custom")} value={customMinutes}
              onChange={event => {
                const value = event.target.value;
                if (!/^\d*$/.test(value)) return;
                setCustom(true);
                setCustomMinutes(value);
              }} />
            <span aria-hidden="true">{t("profileSetup.minAlt")}</span>
          </label>
          <span id="customTimeHint" className="sr-only">{t("profileSetup.enterAWholeNumberFrom5To")}</span>
        </div>
      </div>

      {age === "1-2" ? <div id="toddlerAutoNotice" className="profile-toddler-notice p-4 rounded-2xl text-xs sm:text-sm font-extrabold">
        <SetupIcon name="bear" /> {t("profileSetup.ages12VideosStartRightAway")}</div> : <fieldset id="parentModeSelectorWrapper" className="space-y-2">
        <legend className="profile-label block text-xs font-extrabold uppercase tracking-wider mb-2">{t("profileSetup.whatShouldYourChildDo")}</legend>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {sessionFlows.map((option) => <button key={option.value} type="button" aria-pressed={flow === option.value}
            id={option.value === "learn" ? "modeCardBrain" : "modeCardTurbo"}
            onClick={() => { setFlow(option.value); uiSound("chirp", sound); }}
            className="profile-choice p-4 rounded-2xl text-left cursor-pointer">
            <span className="flex items-center gap-2.5 mb-1"><SetupIcon name={option.icon} className="text-xl" />
              <span className="font-display font-bold text-lg leading-tight">{option.title}</span></span>
            <span className="profile-hint block text-xs font-bold">{option.detail}</span>
          </button>)}
        </div>
        {flow === "active" && <label className="profile-label flex flex-wrap gap-2 items-center text-xs font-bold">{t("profileSetup.whereAreYouPlaying")}<select value={location} onChange={(event) => setLocation(event.target.value === "car" ? "car" : "home")}
            className="profile-location profile-field px-3 py-2 rounded-2xl text-sm">
            <option value="home">{t("profileSetup.atHome")}</option><option value="car">{t("profileSetup.inTheCar")}</option>
          </select>
        </label>}
      </fieldset>}

      <div onClick={() => { if (!validName) showNameError(); }}>
        <button type="submit" disabled={!validName}
          className={`profile-submit w-full min-h-15 py-4 px-2 rounded-2xl font-display font-bold text-xl tracking-wide flex items-center justify-center gap-2 ${validName ? "btn-game cursor-pointer" : "pointer-events-none"}`}>
          <span className="min-w-0 wrap-anywhere">{t("profileSetup.startSessionFor")} <span id="startBtnKidName">{display.toUpperCase()}</span></span><SetupIcon name="rocket" />
        </button>
      </div>
      <div className={`profile-hint flex items-center justify-between gap-3 text-xs ${onBack ? "" : "sm:hidden"}`}>
        {onBack && <button type="button" onClick={onBack}><SetupIcon name="back" /> {t("activityHeader.back")}</button>}
        <a href="/privacy" className="sm:hidden ml-auto underline" onClick={(event) => { event.preventDefault(); onPrivacy(); }}>{t("app.privacy")}</a>
      </div>
    </form>
  </main>;
}
