import { APP_NAME } from "../brand";
import { useRef, useState } from "react";
import type { AgeBand } from "../../shared/types";
import { uiSound, useSoundEnabled } from "../audio/sfx";
import { Mascot } from "../components/Mascot";
import { codenameFor, codenames } from "../game/content";
import { defaultPreferences, quietTimeGoals, type ChildNeed, type Preferences } from "../state/preferences";
import type { ChildProfile } from "../state/progress";
import "./ProfileSetup.css";

const ages = [["1-2", "1–2 yrs"], ["3-5", "3–5 yrs"], ["6-8", "6–8 yrs"]] as const;
const interestsPlaceholders: Record<AgeBand, string> = {
  "1-2": "My child loves animals, so maybe some cartoon videos and interactives about them while I prepare dinner.",
  "3-5": "Keep them busy with dinosaur games and puzzles while I'm on a work call.",
  "6-8": "Loves the moon and stars! Keep them busy with space-themed activities.",
};
const needs = [
  ["energy", "energy", "Get energy out indoors"], ["screen", "screen", "Less passive screen time"],
  ["listening", "speech", "Talking and listening"], ["science", "rocket", "Science and curiosity"],
] as const;
const sessionFlows = [
  { value: "learn", icon: "quiz", title: "Watch and learn", detail: `A short science video, then ${APP_NAME} asks fun questions.` },
  { value: "active", icon: "energy", title: "Move and play", detail: "Jumping, hunting, and voice games. No watching." },
] as const;

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
            <span className="profile-setup-kicker text-xs font-extrabold uppercase tracking-wider">SET UP IN 1 MINUTE</span>
            <h1 className="font-display text-2xl sm:text-3xl font-bold leading-tight">Tell {APP_NAME} about your child</h1>
          </div>
        </div>
        <a href="/privacy" onClick={(event) => { event.preventDefault(); onPrivacy(); }}
          className="profile-local-profile hidden sm:inline-block shrink-0 px-3 py-1 rounded-full text-xs font-extrabold" aria-label="Privacy · saved on this device"><SetupIcon name="shield" /> Saved on this phone</a>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="profileNameInput" className="profile-label block text-xs font-extrabold uppercase tracking-wider mb-2">What should {APP_NAME} call your child? *</label>
          <input ref={nameInput} id="profileNameInput" type="text" autoComplete="off" value={name} required minLength={1} maxLength={20} placeholder={codenameFor(code)}
            aria-invalid={nameError && !validName} aria-describedby={`profileNameHint${nameError && !validName ? " profileNameError" : ""}`}
            onInvalid={event => { event.preventDefault(); showNameError(); }}
            onKeyDown={event => { if (event.key === "Enter" && !validName) { event.preventDefault(); showNameError(); } }}
            onBlur={() => { if (!validName) setNameError(true); }}
            onChange={(event) => { setName(event.target.value); setNameError(false); }} className="profile-field w-full px-4 py-3 rounded-2xl font-display font-semibold text-xl" />
          <p className="profile-hint mt-1.5 text-xs" id="profileNameHint">A first name or nickname. Stays on this device.</p>
          {nameError && !validName && <p id="profileNameError" role="alert" className="profile-error mt-1 text-xs">{name.trim() ? "Please use no more than 20 characters" : "Please enter a name or nickname"}</p>}
        </div>
        <fieldset className="min-w-0">
          <legend className="profile-label block text-xs font-extrabold uppercase tracking-wider mb-2">Child's age</legend>
          <div className="grid grid-cols-3 gap-2" id="profileAgeGroup">
            {ages.map(([value, label]) => <button key={value} type="button" data-age={value} aria-pressed={age === value}
              className="prof-age-btn profile-choice min-h-13 rounded-2xl font-display font-bold text-base"
              onClick={() => { setAge(value); uiSound("chirp", sound); }}>{label}</button>)}
          </div>
        </fieldset>
      </div>

      <fieldset>
        <legend className="profile-label block text-xs font-extrabold uppercase tracking-wider mb-2">What do you want help with? (Pick any)</legend>
        <div className="flex flex-wrap gap-2" id="needsChips">
          {needs.map(([value, icon, label]) => <button key={value} type="button" aria-pressed={selected.includes(value)}
            onClick={() => { setNeeds((items) => items.includes(value) ? items.filter((item) => item !== value) : [...items, value]); uiSound("chirp", sound); }}
            className="need-chip profile-choice inline-flex min-h-11 items-center gap-2 px-3.5 py-2 rounded-2xl text-sm font-extrabold"><SetupIcon name={icon} /> {label}</button>)}
        </div>
      </fieldset>

      <div>
        <label htmlFor="profileNotesInput" className="profile-label block text-xs font-extrabold uppercase tracking-wider mb-2">Child's interests (Optional)</label>
        <textarea id="profileNotesInput" rows={2} maxLength={600} autoComplete="off" value={notes} onChange={(event) => setNotes(event.target.value)}
          placeholder={interestsPlaceholders[age]}
          className="profile-field w-full min-h-21 px-4 py-3 rounded-2xl font-bold text-sm" />
        <p className="profile-hint mt-1 text-xs">Stays on this device. Never sent to a server.</p>
      </div>

      <div className="profile-goal flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl">
        <div>
          <div className="font-display font-bold text-base" id="quietTimeLabel">How much quiet time do you need?</div>
          <div className="profile-hint text-xs font-bold">{APP_NAME} plays for exactly this long, then stops.</div>
        </div>
        <div className="flex flex-wrap items-center gap-2" role="group" aria-labelledby="quietTimeLabel" id="profileDurationPills">
          {quietTimeGoals.map((value) => <button key={value} type="button" data-min={value} aria-pressed={!custom && minutes === value}
            onClick={() => { setMinutes(value); setCustom(false); setCustomMinutes(String(value)); uiSound("chirp", sound); }}
            className="prof-dur-btn profile-choice px-3.5 py-2 rounded-2xl font-display font-bold text-sm">{value}m</button>)}
          <label className="profile-label flex items-center gap-2 text-xs font-bold">
            Custom minutes
            <input type="number" min={1} max={120} step={1} value={customMinutes} data-selected={custom}
              onFocus={() => setCustom(true)} onChange={event => { setCustom(true); setCustomMinutes(event.target.value); }}
              className="profile-field profile-custom-time w-20 min-h-12 px-2 rounded-2xl" />
          </label>
        </div>
      </div>

      {age === "1-2" ? <div id="toddlerAutoNotice" className="profile-toddler-notice p-4 rounded-2xl text-xs sm:text-sm font-extrabold">
        <SetupIcon name="bear" /> Ages 1–2: Videos start right away. Little breaks come between videos.
      </div> : <fieldset id="parentModeSelectorWrapper" className="space-y-2">
        <legend className="profile-label block text-xs font-extrabold uppercase tracking-wider mb-2">What should your child do?</legend>
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
        {flow === "active" && <label className="profile-label flex flex-wrap gap-2 items-center text-xs font-bold">
          Where are you playing?
          <select value={location} onChange={(event) => setLocation(event.target.value === "car" ? "car" : "home")}
            className="profile-location profile-field px-3 py-2 rounded-2xl text-sm">
            <option value="home">At home</option><option value="car">In the car</option>
          </select>
        </label>}
      </fieldset>}

      <div onClick={() => { if (!validName) showNameError(); }}>
        <button type="submit" disabled={!validName}
          className={`profile-submit w-full min-h-15 py-4 px-2 rounded-2xl font-display font-bold text-xl tracking-wide flex items-center justify-center gap-2 ${validName ? "btn-game cursor-pointer" : "pointer-events-none"}`}>
          <span className="min-w-0 wrap-anywhere">START SESSION FOR <span id="startBtnKidName">{display.toUpperCase()}</span></span><SetupIcon name="rocket" />
        </button>
      </div>
      <div className={`profile-hint flex items-center justify-between gap-3 text-xs ${onBack ? "" : "sm:hidden"}`}>
        {onBack && <button type="button" onClick={onBack}><SetupIcon name="back" /> Back</button>}
        <a href="/privacy" className="sm:hidden ml-auto underline" onClick={(event) => { event.preventDefault(); onPrivacy(); }}>Privacy</a>
      </div>
    </form>
  </main>;
}
