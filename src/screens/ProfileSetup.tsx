import { APP_NAME } from "../brand";
import { useState } from "react";
import type { AgeBand } from "../../shared/types";
import { uiSound, useSoundEnabled } from "../audio/sfx";
import { codenameFor, codenames } from "../game/content";
import { defaultPreferences, quietTimeGoals, type ChildNeed, type Preferences } from "../state/preferences";
import type { ChildProfile } from "../state/progress";

const ages = [["1-2", "1–2 yrs"], ["3-5", "3–5 yrs"], ["6-8", "6–8 yrs"]] as const;
const needs = [
  ["energy", "⚡ Burn physical energy indoors"], ["screen", "📵 Replace passive iPad / YouTube"],
  ["listening", "🗣️ Speech & active listening"], ["habits", "🥦 Healthy habits (water & teeth)"],
  ["science", "🚀 Science & logic curiosity"],
] as const;
const sessionFlows = [
  { value: "learn", icon: "🧠", title: "Educational Video + Quiz", detail: `Curated science video → ${APP_NAME} asks fun interactive questions.` },
  { value: "active", icon: "⚡", title: "Active Physical Missions", detail: "Zero passive watching — scavenger hunts, movement, and voice challenges." },
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
  const [notes, setNotes] = useState(saved?.notes ?? "");
  const [selected, setNeeds] = useState<ChildNeed[]>(saved?.needs ?? ["energy", "screen"]);
  const [minutes, setMinutes] = useState(saved?.minutes ?? defaultPreferences.minutes);
  const [flow, setFlow] = useState<(typeof sessionFlows)[number]["value"]>(saved?.first === "active" ? "active" : "learn");
  const [location, setLocation] = useState(saved?.location ?? defaultPreferences.location);
  const sound = useSoundEnabled();
  const code = profile?.codenameId ?? codenames.find((id) => !profiles.some((item) => item.codenameId === id)) ?? codenames[0];
  const display = name.trim() || codenameFor(code);

  return <main id="screen-profile-setup" className="prototype-screen relative flex-1 w-full max-w-3xl mx-auto px-4 py-6 flex flex-col justify-center z-10">
    <form className="bg-[#1C145C]/95 backdrop-blur-md rounded-3xl p-6 sm:p-8 border-4 border-[#4C35DE] shadow-[0_14px_40px_rgba(0,0,0,0.45)] space-y-6"
      onSubmit={(event) => {
        event.preventDefault();
        uiSound("chirp", sound);
        onSave(code, age, { ...defaultPreferences, ...saved, location, minutes, first: age === "1-2" ? "watch" : flow,
          nickname: name.trim() || undefined, notes: notes.trim() || undefined, needs: selected });
      }}>
      <div className="flex items-center justify-between gap-2 border-b border-indigo-800/80 pb-4">
        <div className="flex items-center gap-3">
          <div aria-hidden="true" className="w-12 h-12 shrink-0 rounded-2xl bg-[#6C47FF] border-2 border-white/40 flex items-center justify-center text-2xl shadow-md">👨‍👩‍👧</div>
          <div>
            <span className="text-xs font-extrabold uppercase tracking-wider text-[#38BDF8]">Parent Setup • 1-Time Profile</span>
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-white">Tell {APP_NAME} About Your Child</h1>
          </div>
        </div>
        <a href="/privacy" onClick={(event) => { event.preventDefault(); onPrivacy(); }}
          className="hidden sm:inline-block shrink-0 px-3 py-1 rounded-full bg-indigo-950 border border-indigo-700 text-xs font-extrabold text-indigo-300" aria-label="Privacy · saved on this device">🛡️ Local Profile</a>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="profileNameInput" className="block text-xs font-extrabold uppercase tracking-wider text-indigo-300 mb-1.5">Child's Nickname</label>
          <input id="profileNameInput" type="text" autoComplete="off" value={name} maxLength={24} placeholder={codenameFor(code)} aria-describedby="profileNameHint"
            onChange={(event) => setName(event.target.value)} className="w-full px-4 py-3.5 rounded-2xl bg-[#100B3B] border-2 border-[#4C35DE] focus:border-[#38BDF8] text-white font-extrabold text-lg" />
          <p className="mt-1 text-xs text-indigo-300" id="profileNameHint">First name or fun nickname, saved only on this device.</p>
        </div>
        <fieldset className="min-w-0">
          <legend className="block text-xs font-extrabold uppercase tracking-wider text-indigo-300 mb-1.5">Age Group</legend>
          <div className="grid grid-cols-3 gap-2" id="profileAgeGroup">
            {ages.map(([value, label]) => <button key={value} type="button" data-age={value} aria-pressed={age === value}
              className={`prof-age-btn py-3 rounded-2xl border-2 font-extrabold text-sm transition ${age === value ? selectedAge : unselectedAge}`}
              onClick={() => { setAge(value); uiSound("chirp", sound); }}>{label}</button>)}
          </div>
        </fieldset>
      </div>

      <fieldset>
        <legend className="block text-xs font-extrabold uppercase tracking-wider text-indigo-300 mb-2">What does your child need most right now? (Select all that apply)</legend>
        <div className="flex flex-wrap gap-2" id="needsChips">
          {needs.map(([value, label]) => <button key={value} type="button" aria-pressed={selected.includes(value)}
            onClick={() => { setNeeds((items) => items.includes(value) ? items.filter((item) => item !== value) : [...items, value]); uiSound("chirp", sound); }}
            className={`need-chip px-3.5 py-2 rounded-2xl border-2 text-xs sm:text-sm font-extrabold transition ${selected.includes(value) ? "border-[#2CE69B] bg-[#2CE69B]/20 text-white" : "border-[#4C35DE] bg-[#100B3B] text-indigo-200 hover:border-indigo-400"}`}>{label}</button>)}
        </div>
      </fieldset>

      <div>
        <label htmlFor="profileNotesInput" className="block text-xs font-extrabold uppercase tracking-wider text-indigo-300 mb-1.5">Child's Interests, Sensitivities, or Parent Context (Optional)</label>
        <textarea id="profileNotesInput" rows={2} maxLength={600} autoComplete="off" value={notes} onChange={(event) => setNotes(event.target.value)}
          placeholder="e.g., Loves dinosaurs & space rockets; needs 25 mins of quiet play while I'm on a work call; avoid loud sirens."
          className="w-full px-4 py-3 rounded-2xl bg-[#100B3B] border-2 border-[#4C35DE] focus:border-[#38BDF8] text-white font-bold text-sm" />
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#100B3B] p-4 rounded-2xl border border-[#4C35DE]">
        <div>
          <div className="font-extrabold text-sm text-white" id="quietTimeLabel">Default Parent Quiet-Time Goal</div>
          <div className="text-xs font-bold text-indigo-300">{APP_NAME} paces missions to match your break</div>
        </div>
        <div className="flex items-center gap-2" role="group" aria-labelledby="quietTimeLabel" id="profileDurationPills">
          {(saved?.minutes === 10 ? [10 as const, ...quietTimeGoals] : quietTimeGoals).map((value) => <button key={value} type="button" data-min={value} aria-pressed={minutes === value}
            onClick={() => { setMinutes(value); uiSound("chirp", sound); }}
            className={`prof-dur-btn px-3.5 py-2 rounded-xl border-2 font-black text-xs ${minutes === value ? "bg-[#6C47FF] border-[#FFD13B] text-white" : "bg-[#1C145C] border-[#4C35DE] text-indigo-200"}`}>{value}m</button>)}
        </div>
      </div>

      {age === "1-2" ? <div id="toddlerAutoNotice" className="p-4 rounded-2xl bg-[#2CE69B]/15 border-2 border-[#2CE69B] text-xs sm:text-sm font-extrabold text-[#2CE69B]">
        🧸 Toddler Mode (1-2 yrs): Your little cinema opens right away, with a 10-second breather between videos.
      </div> : <fieldset id="parentModeSelectorWrapper" className="space-y-2">
        <legend className="block text-xs font-extrabold uppercase tracking-wider text-indigo-300">Choose Session Flow for Your Child</legend>
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

      <button type="submit" className="w-full py-4 px-2 rounded-2xl btn-game btn-mint text-[#082F22] font-display font-bold text-xl tracking-wide flex items-center justify-center gap-2 cursor-pointer">
        <span className="min-w-0 wrap-anywhere">{onBack ? "SAVE SETTINGS" : <>START SESSION FOR <span id="startBtnKidName">{display.toUpperCase()}</span></>}</span><span aria-hidden="true">🚀</span>
      </button>
      <div className={`flex items-center justify-between gap-3 text-xs text-indigo-300 ${onBack ? "" : "sm:hidden"}`}>
        {onBack && <button type="button" className="hover:text-white" onClick={onBack}><span aria-hidden="true">← </span>Back</button>}
        <a href="/privacy" className="sm:hidden ml-auto underline" onClick={(event) => { event.preventDefault(); onPrivacy(); }}>Privacy</a>
      </div>
    </form>
  </main>;
}
