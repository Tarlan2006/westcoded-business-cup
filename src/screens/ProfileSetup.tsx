import { useState } from "react";
import type { AgeBand, SetupSuggestion } from "../../shared/types";
import { interestsFromTopics } from "../../shared/topics";
import { usePushToTalk } from "../game/usePushToTalk";
import { APP_NAME } from "../brand";
import { Chip, GameButton, Segmented } from "../components/GameUI";
import { Mascot } from "../components/Mascot";
import { codenameFor, codenames } from "../game/content";
import { childInterests, childNeeds, defaultPreferences, type ChildInterest, type ChildNeed, type Preferences } from "../state/preferences";
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

// Parents can say or type one sentence ("She's 7, loves space and dinosaurs, we have
// twenty minutes in the car") and the AI fills in the choices below for them to check.
function QuickDescribe({ onFill }: { onFill: (suggestion: SetupSuggestion) => void }) {
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState("");

  async function fill(description: string) {
    const value = description.trim();
    if (!value || busy) return;
    setBusy(true);
    setNote("");
    try {
      const response = await fetch("/api/setup", {
        method: "POST", cache: "no-store", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: value }), signal: AbortSignal.timeout(10_000),
      });
      const result = await response.json() as SetupSuggestion & { error?: string };
      if (!response.ok || result.error) throw new Error(result.error);
      onFill(result);
      setNote(result.summary || "Done! Check the choices below.");
    } catch {
      setNote("We couldn't fill it in this time. Please pick the choices below.");
    } finally {
      setBusy(false);
    }
  }

  const voice = usePushToTalk(!busy, (spoken) => {
    setText(spoken);
    void fill(spoken);
  }, (problem) => setNote(problem === "no-speech"
    ? "Sorry, Bleep didn't catch that. Hold the button, speak, then let go. Or type instead."
    : "The microphone is blocked. Allow it in your browser (lock icon by the address), or type instead."),
  { maxRecordMs: 15_000, transcribeTimeoutMs: 8000 });
  const listening = voice.status === "opening" || voice.status === "recording";

  return (
    <section className="quick-describe" aria-labelledby="quick-describe-title">
      <h2 id="quick-describe-title" className="field-label">In a hurry? Just tell Bleep</h2>
      <p className="recon-field-hint">For example: “She’s 7, loves space and dinosaurs, needs to burn energy, we have 20 minutes at home.” No names needed.</p>
      <textarea rows={2} maxLength={600} value={text} disabled={busy}
        placeholder="Age, what they love, what they need, how much time, where you are"
        onChange={(event) => setText(event.target.value)} />
      <div className="quick-describe-actions">
        <button type="button" className="secondary-button talk-button" disabled={busy || voice.status === "decoding"}
          data-recording={listening || undefined}
          onPointerDown={(event) => {
            if (!event.isPrimary || event.button !== 0) return;
            event.preventDefault();
            event.currentTarget.focus({ preventScroll: true });
            event.currentTarget.setPointerCapture(event.pointerId);
            voice.start();
          }}
          onPointerUp={() => voice.release()}
          onPointerCancel={voice.cancelHold}
          onLostPointerCapture={voice.cancelHold}
          onContextMenu={(event) => event.preventDefault()}>
          {listening ? "Speak, then let go" : voice.status === "decoding" ? "Understanding…" : "🎤 Hold to talk"}
        </button>
        <button type="button" className="primary-button" disabled={busy || !text.trim()} onClick={() => { void fill(text); }}>
          {busy ? "Filling in…" : "✨ Fill it in for me"}
        </button>
      </div>
      {note && <p role="status" className="quick-describe-note">{note}</p>}
    </section>
  );
}

export function ProfileSetup({ profile, profiles, onBack, onSave, onPrivacy }: {
  profile?: ChildProfile;
  profiles: ChildProfile[];
  onBack?: () => void;
  onPrivacy?: () => void;
  onSave: (codename: string, ageBand: AgeBand, preferences: Preferences) => void;
}) {
  const [age, setAge] = useState(profile?.ageBand);
  const [codename, setCodename] = useState(profile?.codenameId ?? codenames[0]);
  const [settings, setSettings] = useState(() => {
    const saved = profile?.preferences ?? defaultPreferences;
    return profile?.ageBand === "1-2" ? { ...saved, first: "any" as const } : saved;
  });
  const [nickname, setNickname] = useState(profile?.preferences?.nickname ?? "");
  const [nameError, setNameError] = useState(false);
  const toddler = age === "1-2";
  const needs = settings.needs ?? [];
  const interests = settings.interests ?? [];
  const used = new Set(profiles.filter((entry) => entry.id !== profile?.id).map((entry) => entry.codenameId));
  const names = [...new Set([codename, ...codenames.filter((id) => !used.has(id))])].slice(0, 6);
  const displayName = nickname.trim() || codenameFor(codename);

  function applySuggestion(suggestion: SetupSuggestion) {
    if (suggestion.ageBand) setAge(suggestion.ageBand);
    const suggestedInterests = interestsFromTopics(suggestion.topics)
      .filter((item): item is ChildInterest => (childInterests as readonly string[]).includes(item));
    const suggestedNeeds = (suggestion.needs ?? [])
      .filter((item): item is ChildNeed => childNeeds.some((need) => need.value === item));
    setSettings((current) => ({
      ...current,
      minutes: suggestion.minutes ?? current.minutes,
      location: suggestion.location ?? current.location,
      first: suggestion.first ?? current.first,
      interests: suggestedInterests.length ? suggestedInterests : current.interests,
      needs: suggestedNeeds.length ? suggestedNeeds : current.needs,
    }));
  }

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
    <QuickDescribe onFill={applySuggestion} />
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
