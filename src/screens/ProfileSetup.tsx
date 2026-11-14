import { APP_NAME } from "../brand";
import { useRef, useState } from "react";
import type { AgeBand } from "../../shared/types";
import { uiSound, useSoundEnabled } from "../audio/sfx";
import { Mascot } from "../components/Mascot";
import { codenameFor, codenames } from "../game/content";
import { defaultPreferences, quietTimeGoals, type ChildNeed, type Preferences } from "../state/preferences";
import type { ChildProfile } from "../state/progress";

const ages = [["1-2", "1–2 yrs"], ["3-5", "3–5 yrs"], ["6-8", "6–8 yrs"]] as const;
const interestsPlaceholders: Record<AgeBand, string> = {
  "1-2": "My child loves animals, so maybe some cartoon videos and interactives about them while I prepare dinner.",
  "3-5": "Keep them busy with dinosaur games and puzzles while I'm on a work call.",
  "6-8": "Loves the moon and stars! Keep them busy with space-themed activities.",
};
const needs = [
  ["energy", "⚡ Get energy out indoors"], ["screen", "📵 Less passive screen time"],
  ["listening", "🗣️ Talking and listening"],
  ["science", "🚀 Science and curiosity"],
] as const;
const sessionFlows = [
  { value: "learn", icon: "🧠", title: "Watch and learn", detail: `A short science video, then ${APP_NAME} asks fun questions.` },
  { value: "active", icon: "⚡", title: "Move and play", detail: "Jumping, hunting, and voice games. No watching." },
] as const;
const selectedAge = "border-[#FFD13B] bg-[#6C47FF] text-white shadow-md";
const unselectedAge = "border-[#4C35DE] bg-[#100B3B] text-indigo-200 hover:border-white";

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
  const [minutes, setMinutes] = useState(saved?.minutes ?? defaultPreferences.minutes);
  const [customMinutes, setCustomMinutes] = useState(String(saved?.minutes ?? defaultPreferences.minutes));
  const [custom, setCustom] = useState(!!saved && !quietTimeGoals.some(value => value === saved.minutes));
  const [flow, setFlow] = useState<(typeof sessionFlows)[number]["value"]>(saved?.first === "active" ? "active" : "learn");
  const [location, setLocation] = useState(saved?.location ?? defaultPreferences.location);
  const sound = useSoundEnabled();
  const code = profile?.codenameId ?? codenames.find((id) => !profiles.some((item) => item.codenameId === id)) ?? codenames[0];
  const display = name.trim() || codenameFor(code);

  return <main id="screen-profile-setup" className="prototype-screen relative flex-1 w-full max-w-3xl mx-auto px-4 py-6 flex flex-col justify-center z-10">
    <form className="bg-[#1C145C]/95 backdrop-blur-md rounded-3xl p-6 sm:p-8 border-4 border-[#4C35DE] shadow-[0_14px_40px_rgba(0,0,0,0.45)] space-y-6"
      onSubmit={(event) => {
        event.preventDefault();
        if (!validName) { showNameError(); return; }
        uiSound("chirp", sound);
        onSave(code, age, { ...defaultPreferences, ...saved, location, minutes: custom && customMinutes.trim() ? Number(customMinutes) : minutes, first: age === "1-2" ? "watch" : flow,
          nickname: name.trim() || undefined, notes: notes.trim() || undefined, needs: selected });
      }}>
      <div className="flex items-center justify-between gap-2 border-b border-indigo-800/80 pb-4">
        <div className="flex items-center gap-3">
          <Mascot pose="wave" size={72} eager className="shrink-0" />
          <div>
            <span className="text-xs font-extrabold uppercase tracking-wider text-[#38BDF8]">SET UP IN 1 MINUTE</span>
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-white">Tell {APP_NAME} about your child</h1>
          </div>
        </div>
        <a href="/privacy" onClick={(event) => { event.preventDefault(); onPrivacy(); }}
          className="hidden sm:inline-block shrink-0 px-3 py-1 rounded-full bg-indigo-950 border border-indigo-700 text-xs font-extrabold text-indigo-300" aria-label="Privacy · saved on this device">🛡️ Saved on this phone</a>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="profileNameInput" className="block text-xs font-extrabold uppercase tracking-wider text-indigo-300 mb-1.5">What should {APP_NAME} call your child? *</label>
          <input ref={nameInput} id="profileNameInput" type="text" autoComplete="off" value={name} required minLength={1} maxLength={20} placeholder={codenameFor(code)}
            aria-invalid={nameError && !validName} aria-describedby={`profileNameHint${nameError && !validName ? " profileNameError" : ""}`}
            onInvalid={event => { event.preventDefault(); showNameError(); }}
            onKeyDown={event => { if (event.key === "Enter" && !validName) { event.preventDefault(); showNameError(); } }}
            onBlur={() => { if (!validName) setNameError(true); }}
            onChange={(event) => { setName(event.target.value); setNameError(false); }} className="w-full px-4 py-3.5 rounded-2xl bg-[#100B3B] border-2 border-[#4C35DE] focus:border-[#38BDF8] text-white font-extrabold text-lg" />
          <p className="mt-1 text-xs text-indigo-300" id="profileNameHint">A first name or nickname. Stays on this device.</p>
          {nameError && !validName && <p id="profileNameError" role="alert" className="mt-1 text-xs text-red-400">{name.trim() ? "Please use no more than 20 characters" : "Please enter a name or nickname"}</p>}
        </div>
        <fieldset className="min-w-0">
          <legend className="block text-xs font-extrabold uppercase tracking-wider text-indigo-300 mb-1.5">Child's age</legend>
          <div className="grid grid-cols-3 gap-2" id="profileAgeGroup">
            {ages.map(([value, label]) => <button key={value} type="button" data-age={value} aria-pressed={age === value}
              className={`prof-age-btn py-3 rounded-2xl border-2 font-extrabold text-sm transition ${age === value ? selectedAge : unselectedAge}`}
              onClick={() => { setAge(value); uiSound("chirp", sound); }}>{label}</button>)}
          </div>
        </fieldset>
      </div>

      <fieldset>
        <legend className="block text-xs font-extrabold uppercase tracking-wider text-indigo-300 mb-2">What do you want help with? (Pick any)</legend>
        <div className="flex flex-wrap gap-2" id="needsChips">
          {needs.map(([value, label]) => <button key={value} type="button" aria-pressed={selected.includes(value)}
            onClick={() => { setNeeds((items) => items.includes(value) ? items.filter((item) => item !== value) : [...items, value]); uiSound("chirp", sound); }}
            className={`need-chip px-3.5 py-2 rounded-2xl border-2 text-xs sm:text-sm font-extrabold transition ${selected.includes(value) ? "border-[#2CE69B] bg-[#2CE69B]/20 text-white" : "border-[#4C35DE] bg-[#100B3B] text-indigo-200 hover:border-indigo-400"}`}>{label}</button>)}
        </div>
      </fieldset>

      <div>
        <label htmlFor="profileNotesInput" className="block text-xs font-extrabold uppercase tracking-wider text-indigo-300 mb-1.5">Child's interests (Optional)</label>
        <textarea id="profileNotesInput" rows={2} maxLength={600} autoComplete="off" value={notes} onChange={(event) => setNotes(event.target.value)}
          placeholder={interestsPlaceholders[age]}
          className="w-full px-4 py-3 rounded-2xl bg-[#100B3B] border-2 border-[#4C35DE] focus:border-[#38BDF8] text-white font-bold text-sm" />
        <p className="mt-1 text-xs text-indigo-300">Stays on this device. Never sent to a server.</p>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#100B3B] p-4 rounded-2xl border border-[#4C35DE]">
        <div>
          <div className="font-extrabold text-sm text-white" id="quietTimeLabel">How much quiet time do you need?</div>
          <div className="text-xs font-bold text-indigo-300">{APP_NAME} plays for exactly this long, then stops.</div>
        </div>
        <div className="flex flex-wrap items-center gap-2" role="group" aria-labelledby="quietTimeLabel" id="profileDurationPills">
          {(saved?.minutes === 10 ? [10 as const, ...quietTimeGoals] : quietTimeGoals).map((value) => <button key={value} type="button" data-min={value} aria-pressed={!custom && minutes === value}
            onClick={() => { setMinutes(value); setCustom(false); setCustomMinutes(String(value)); uiSound("chirp", sound); }}
            className={`prof-dur-btn px-3.5 py-2 rounded-xl border-2 font-black text-xs ${!custom && minutes === value ? "bg-[#6C47FF] border-[#FFD13B] text-white" : "bg-[#1C145C] border-[#4C35DE] text-indigo-200"}`}>{value} min</button>)}
          <label className="flex items-center gap-2 text-xs font-bold text-indigo-200">
            Custom minutes
            <input type="number" min={1} max={120} step={1} value={customMinutes}
              onFocus={() => setCustom(true)} onChange={event => { setCustom(true); setCustomMinutes(event.target.value); }}
              className={`w-20 min-h-12 px-2 rounded-xl border-2 bg-[#100B3B] text-white ${custom ? "border-[#FFD13B]" : "border-[#4C35DE]"}`} />
          </label>
        </div>
      </div>

      {age === "1-2" ? <div id="toddlerAutoNotice" className="p-4 rounded-2xl bg-[#2CE69B]/15 border-2 border-[#2CE69B] text-xs sm:text-sm font-extrabold text-[#2CE69B]">
        🧸 Ages 1–2: Videos start right away. Little breaks come between videos.
      </div> : <fieldset id="parentModeSelectorWrapper" className="space-y-2">
        <legend className="block text-xs font-extrabold uppercase tracking-wider text-indigo-300">What should your child do?</legend>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {sessionFlows.map((option) => <button key={option.value} type="button" aria-pressed={flow === option.value}
            id={option.value === "learn" ? "modeCardBrain" : "modeCardTurbo"}
            onClick={() => { setFlow(option.value); uiSound("chirp", sound); }}
            className={`p-4 rounded-2xl border-2 text-left transition cursor-pointer ${flow === option.value ? "border-[#FFD13B] bg-[#6C47FF] shadow-md" : "border-[#4C35DE] bg-[#100B3B] hover:border-indigo-400"}`}>
            <span className="flex items-center gap-2.5 mb-1"><span className="text-2xl" aria-hidden="true">{option.icon}</span>
              <span className="font-display font-bold text-base text-white">{option.title}</span></span>
            <span className={`block text-xs font-bold ${flow === option.value ? "text-indigo-100" : "text-indigo-300"}`}>{option.detail}</span>
          </button>)}
        </div>
        {flow === "active" && <label className="flex flex-wrap gap-2 items-center text-xs font-bold text-indigo-200">
          Where are you playing?
          <select value={location} onChange={(event) => setLocation(event.target.value === "car" ? "car" : "home")}
            className="profile-location px-3 py-2 rounded-xl border-2 border-[#4C35DE] bg-[#100B3B] text-sm text-white">
            <option value="home">At home</option><option value="car">In the car</option>
          </select>
        </label>}
      </fieldset>}

      <div onClick={() => { if (!validName) showNameError(); }}>
      <button type="submit" disabled={!validName}
        className={`w-full py-4 px-2 rounded-2xl font-display font-bold text-xl tracking-wide flex items-center justify-center gap-2 ${validName ? "btn-game btn-mint text-[#082F22] cursor-pointer" : "bg-gray-500 text-gray-200 cursor-not-allowed pointer-events-none"}`}>
        <span className="min-w-0 wrap-anywhere"><>START FOR <span id="startBtnKidName">{display.toUpperCase()}</span></></span><span aria-hidden="true">🚀</span>
      </button>
      </div>
      <div className={`flex items-center justify-between gap-3 text-xs text-indigo-300 ${onBack ? "" : "sm:hidden"}`}>
        {onBack && <button type="button" className="hover:text-white" onClick={onBack}><span aria-hidden="true">← </span>Back</button>}
        <a href="/privacy" className="sm:hidden ml-auto underline" onClick={(event) => { event.preventDefault(); onPrivacy(); }}>Privacy</a>
      </div>
    </form>
  </main>;
}
