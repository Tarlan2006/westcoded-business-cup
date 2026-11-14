import { useState, type ReactNode } from "react";
import type { AgeBand, Profile } from "../../shared/types";
import { codenameFor, codenames } from "../game/content";
import { rankName } from "../state/progress";

const ageBands = ["1-2", "3-5", "6-8"] as const;

export function LearnPage({ title, onBack, children }: { title: string; onBack?: () => void; children: ReactNode }) {
  return (
    <main className="shell learn-shell">
      <header className="topbar">
        <span className="wordmark"><span className="signal" aria-hidden="true" /> Mission Control</span>
        {onBack && <button className="quiet-button" type="button" onClick={onBack}>Back</button>}
      </header>
      <section className="learn-page" aria-label={title}>
        <h1>{title}</h1>
        {children}
      </section>
    </main>
  );
}

export function Welcome({ onChoose }: { onChoose: (ageBand: AgeBand) => void }) {
  return (
    <LearnPage title="Welcome to Mission Control">
      <p className="learn-description">Grown-ups, pick your child’s age to get started.</p>
      <div className="activity-grid age-grid">
        {ageBands.map((ageBand) => (
          <button key={ageBand} className="activity-tile" type="button" onClick={() => onChoose(ageBand)}>
            <strong>{ageBand.replace("-", "–")}</strong><span>years old</span>
          </button>
        ))}
      </div>
      <a className="quiet-button" href="/privacy">Privacy</a>
    </LearnPage>
  );
}

export function ActivityTile({ icon, title, children, onClick }: {
  icon: string; title: string; children: ReactNode; onClick: () => void;
}) {
  return (
    <button className="activity-tile" type="button" onClick={onClick}>
      <span className="activity-icon" aria-hidden="true">{icon}</span>
      <strong>{title}</strong><span>{children}</span>
    </button>
  );
}

export function ProfileCard({ profile, onParent }: { profile: Profile; onParent: () => void }) {
  return (
    <div className="progress-card home-profile">
      <div><span className="field-label">Agent {codenameFor(profile.codenameId)}</span><strong>{rankName(profile.rank)}</strong></div>
      <div className="progress-values"><span>{profile.xp} XP</span><span>{profile.streak} day streak</span></div>
      <button className="quiet-button" type="button" onClick={onParent}>Parent settings</button>
    </div>
  );
}

export function Home({ profile, onParent, onActive, onLearn }: {
  profile: Profile; onParent: () => void; onActive: () => void; onLearn: () => void;
}) {
  return (
    <LearnPage title={`Welcome, ${codenameFor(profile.codenameId)}`}>
      <ProfileCard profile={profile} onParent={onParent} />
      {profile.ageBand !== "1-2" && (
        <div className="activity-grid">
          <ActivityTile icon="⚡" title="Active" onClick={onActive}>Go on a hunt, spot clues in the car, or play Floor is Lava.</ActivityTile>
          <ActivityTile icon="✦" title="Learn" onClick={onLearn}>
            {profile.ageBand === "6-8" ? "Ask Mission Control, take a quiz, or play." : "Try a quiz or match emoji pairs."}
          </ActivityTile>
        </div>
      )}
      <a className="quiet-button" href="/privacy">Privacy</a>
    </LearnPage>
  );
}

export function ParentSettings({ profile, onSave, onBack }: {
  profile: Profile; onSave: (codenameId: string, ageBand: AgeBand) => void; onBack: () => void;
}) {
  const [ageBand, setAgeBand] = useState(profile.ageBand);
  const [codenameId, setCodenameId] = useState(profile.codenameId);
  return (
    <LearnPage title="Parent settings" onBack={onBack}>
      <form className="panel parent-panel" onSubmit={(event) => {
        event.preventDefault();
        onSave(codenameId, ageBand);
      }}>
        <label><span className="field-label">Codename</span>
          <select value={codenameId} onChange={(event) => setCodenameId(event.target.value)}>
            {[...new Set([profile.codenameId, ...codenames])].map((id) => (
              <option key={id} value={id}>{codenameFor(id)}</option>
            ))}
          </select>
        </label>
        <label><span className="field-label">Age</span>
          <select value={ageBand} onChange={(event) => setAgeBand(event.target.value as AgeBand)}>
            {ageBands.map((band) => <option key={band} value={band}>{band.replace("-", "–")} years</option>)}
          </select>
        </label>
        <button className="primary-button" type="submit">Save profile</button>
      </form>
      <a className="quiet-button" href="/privacy">Privacy</a>
    </LearnPage>
  );
}
