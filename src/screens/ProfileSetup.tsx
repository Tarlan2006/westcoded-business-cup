import { useState } from "react";
import type { AgeBand } from "../../shared/types";
import { APP_NAME } from "../brand";
import { Chip, GameButton, Segmented } from "../components/GameUI";
import { Mascot } from "../components/Mascot";
import { codenameFor, codenames } from "../game/content";
import { childInterests, childNeeds, defaultPreferences, type Preferences } from "../state/preferences";
import type { ChildProfile } from "../state/progress";
import { LearnPage } from "./Home";

const ages = [
  { value: "1-2", label: "1–2 years", detail: "Gentle videos" },
  { value: "3-5", label: "3–5 years", detail: "Play & learn" },
  { value: "6-8", label: "6–8 years", detail: "Explore & ask" },
] as const;
const location = [{ value: "home", label: "🏠 At home" }, { value: "car", label: "🚗 In the car" }] as const;
const minutes = [{ value: 10, label: "10 min" }, { value: 20, label: "20 min" }, { value: 30, label: "30 min" }] as const;
const first = [{ value: "active", label: "Move" }, { value: "learn", label: "Learn" }, { value: "watch", label: "Watch" },
  { value: "any", label: "Surprise us" }] as const;

export function ProfileSetup({ profile, profiles, onBack, onSave, onPrivacy }: {
  profile?: ChildProfile;
  profiles: ChildProfile[];
  onBack?: () => void;
  onPrivacy?: () => void;
  onSave: (codename: string, ageBand: AgeBand, preferences: Preferences) => void;
}) {
  const [age, setAge] = useState(profile?.ageBand);
  const [codename, setCodename] = useState(profile?.codenameId ?? codenames[0]);
  const [settings, setSettings] = useState(profile?.preferences ?? defaultPreferences);
  const [nickname, setNickname] = useState(profile?.preferences?.nickname ?? "");
  const [nameError, setNameError] = useState(false);
  const toddler = age === "1-2";
  const needs = settings.needs ?? [];
  const interests = settings.interests ?? [];
  const used = new Set(profiles.filter((entry) => entry.id !== profile?.id).map((entry) => entry.codenameId));
  const names = [...new Set([codename, ...codenames.filter((id) => !used.has(id))])].slice(0, 6);
  const displayName = nickname.trim() || codenameFor(codename);

  const form = <form className="recon-form" onSubmit={(event) => {
    event.preventDefault();
    const cleaned = nickname.trim();
    if (cleaned && cleaned.length < 2) { setNameError(true); return; }
    if (age) onSave(codename, age, { ...settings, first: toddler ? "watch" : settings.first,
      nickname: cleaned || undefined });
  }}>
    <div className="recon-form-heading">
      <div className="recon-form-bleep"><Mascot mood="happy" /></div>
      <div>{onBack ? <h2>Tell Bleep About Your Child</h2> : <h1>Tell Bleep About Your Child</h1>}
        <p><span aria-hidden="true">🛡️</span> Stays on this device</p></div>
    </div>
    <div className="recon-form-grid">
      <div className="recon-nickname">
        <label htmlFor="recon-nickname" className="field-label">What should Bleep call your child?</label>
        <input id="recon-nickname" type="text" value={nickname} maxLength={12} autoComplete="off"
          aria-describedby="nickname-hint" aria-invalid={nameError || undefined} placeholder="Choose a nickname"
          onChange={(event) => { setNickname(event.target.value); setNameError(false); }} />
        <p id="nickname-hint" className="recon-field-hint">{nameError ? "Use at least 2 characters or choose a codename." : "Use a nickname, not a full name (2–12 characters)."}</p>
        <div className="recon-chips">{names.map((id) => <Chip key={id} selected={!nickname.trim() && codename === id}
          onClick={() => { setCodename(id); setNickname(""); setNameError(false); }}>{codenameFor(id)}</Chip>)}</div>
      </div>
      <fieldset><legend className="field-label">How old is your child?</legend>
        <Segmented<AgeBand> required options={ages} value={age} onChange={setAge} />
      </fieldset>
      {!toddler && <fieldset><legend className="field-label">Where are you playing?</legend>
        <Segmented options={location} value={settings.location} onChange={(value) => setSettings({ ...settings, location: value })} />
      </fieldset>}
      <fieldset><legend className="field-label">How much play time do you have?</legend>
        <Segmented options={minutes} value={settings.minutes} onChange={(value) => setSettings({ ...settings, minutes: value })} />
      </fieldset>
      <fieldset><legend className="field-label">What does your child need most?</legend>
        <div className="recon-chips">{childNeeds.map(({ value, label }) => <Chip key={value} selected={needs.includes(value)}
          onClick={() => setSettings({ ...settings, needs: needs.includes(value) ? needs.filter((item) => item !== value) : [...needs, value] })}>{label}</Chip>)}</div>
      </fieldset>
      <fieldset><legend className="field-label">Interests <span>(up to 3)</span></legend>
        <div className="recon-chips">{childInterests.map((item) => <Chip key={item} selected={interests.includes(item)}
          disabled={interests.length >= 3 && !interests.includes(item)}
          onClick={() => setSettings({ ...settings, interests: interests.includes(item) ? interests.filter((interest) => interest !== item) : [...interests, item] })}>{item}</Chip>)}</div>
      </fieldset>
      {toddler ? <p className="safety">Toddler mode: gentle videos</p> :
        <fieldset className="recon-first"><legend className="field-label">What would you like to see first?</legend>
          <Segmented options={first} value={settings.first} onChange={(value) => setSettings({ ...settings, first: value })} />
        </fieldset>}
    </div>
    <div className="recon-form-footer">
      <GameButton type="submit">{onBack ? "Save and show activities" : `Start for ${displayName}`} <span aria-hidden="true">🚀</span></GameButton>
      <a className="privacy-link" href="/privacy" onClick={onPrivacy ? (event) => { event.preventDefault(); onPrivacy(); } : undefined}>Privacy</a>
    </div>
  </form>;

  return onBack ? <LearnPage title="Parent settings" wide onBack={onBack}>{form}</LearnPage> :
    <main className="shell recon-setup"><p className="wordmark"><span className="signal" aria-hidden="true" />{APP_NAME}</p>{form}</main>;
}
