import type { ReactNode } from "react";
import type { Mode } from "../../shared/types";
import type { AgeBand } from "../../shared/types";
import { Mascot } from "../components/Mascot";
import { codenameFor, MODES } from "../game/content";
import { videosFor } from "../game/videos";
import { activeModes, type ActivityGroup, type Preferences } from "../state/preferences";
import { rankName, type ChildProfile } from "../state/progress";

export function LearnPage({ title, onBack, children, wide = false }: {
  title: string; onBack?: () => void; children: ReactNode; wide?: boolean;
}) {
  return (
    <main className={wide ? "shell" : "shell learn-shell"}>
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

const welcomeAges = [
  { age: "1-2", years: "1–2 years", title: "Watch & wonder", text: "Songs and videos", icon: "▶", tone: "watch" },
  { age: "3-5", years: "3–5 years", title: "Play & learn", text: "Quizzes, memory, missions", icon: "✦", tone: "active" },
  { age: "6-8", years: "6–8 years", title: "Explore & ask", text: "Ask questions, quizzes, missions", icon: "?", tone: "learn" },
] as const;

export function Welcome({ onChoose }: { onChoose: (age: AgeBand) => void }) {
  return (
    <main className="shell welcome">
      <header className="welcome-hero">
        <div>
          <h1>Mission Control</h1>
          <p>Voice-guided missions that get kids moving, learning, and laughing.</p>
        </div>
        <Mascot />
      </header>
      <section aria-labelledby="choose-age" className="welcome-choice">
        <h2 id="choose-age">Grown-ups: pick your child's age to start.</h2>
        <div className="welcome-ages">
          {welcomeAges.map(({ age, years, title, text, icon, tone }) => (
            <button key={age} type="button" className="activity-tile welcome-age" data-tone={tone} onClick={() => onChoose(age)}>
              <span aria-hidden="true" className="activity-icon">{icon}</span>
              <span className="welcome-age-label">{years}</span>
              <strong>{title}</strong>
              <span className="tile-description">{text}</span>
              <span className="tile-arrow" aria-hidden="true">→</span>
            </button>
          ))}
        </div>
      </section>
      <ul className="welcome-promises">
        <li><span aria-hidden="true">✓</span>No sign-up</li>
        <li><span aria-hidden="true">♡</span>Kid-safe</li>
        <li><span aria-hidden="true">⌂</span>Stays on this device</li>
      </ul>
      <footer className="welcome-footer"><a href="/privacy">Privacy</a></footer>
    </main>
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

export function VideoShelf({ ageBand, onSelect }: {
  ageBand: ChildProfile["ageBand"]; onSelect: (id: string) => void;
}) {
  const entries = videosFor(ageBand);
  if (!entries.length) return <p className="panel learn-description">More videos coming soon</p>;
  return (
    <div className="activity-grid">
      {entries.map((video) => (
        <ActivityTile key={video.id} icon="▶" title={video.title} onClick={() => onSelect(video.id)}>
          {video.channel}
        </ActivityTile>
      ))}
    </div>
  );
}

export function Home({ profile, preferences, onParent, onMission, onQuiz, onMemory, onAsk, onGrid, onVideo }: {
  profile: ChildProfile; preferences: Preferences; onParent: () => void; onMission: (mode: Mode) => void;
  onQuiz: () => void; onMemory: () => void; onAsk: () => void; onGrid: () => void; onVideo: (id: string) => void;
}) {
  const toddler = profile.ageBand === "1-2";
  const preschool = profile.ageBand === "3-5";
  const groups: ActivityGroup[] = toddler ? ["watch"] : ["active", "learn", "watch"];
  const first = preferences.first === "any" ? groups[0] : preferences.first;
  const ordered = groups.includes(first) ? [first, ...groups.filter((group) => group !== first)] : groups;
  const title = { active: "Active games", learn: "Learn & play", watch: preschool ? "Video rewards" : "Videos" };
  const rewardReady = (profile.activities?.quiz ?? 0) > 0;

  return (
    <LearnPage title="Activities for your day" wide>
      <div className="panel activity-summary">
        <div>
          <span className="field-label">Agent {codenameFor(profile.codenameId)}</span>
          <p>Ages {profile.ageBand.replace("-", "–")}{!toddler && (preferences.location === "car" ? " · In the car" : " · At home")}</p>
        </div>
        <div className="summary-actions">
          <span>{profile.xp} XP · {rankName(profile.rank)} · {profile.streak} day streak</span>
          <button className="quiet-button" type="button" onClick={onParent}>Change choices</button>
        </div>
      </div>
      {ordered.map((group) => (
        <section className="activity-section" key={group} aria-labelledby={`group-${group}`}>
          <h2 id={`group-${group}`}>{title[group]}</h2>
          {group === "active" && <div className="activity-grid">
            {activeModes(preferences.location).map((mode) => (
              <ActivityTile key={mode} icon={MODES[mode].icon} title={MODES[mode].name} onClick={() => onMission(mode)}>
                {preferences.minutes} min · {MODES[mode].description}
              </ActivityTile>
            ))}
          </div>}
          {group === "learn" && <div className="activity-grid">
            {!preschool && <ActivityTile icon="✦" title="Ask Mission Control" onClick={onAsk}>Ask about science or nature.</ActivityTile>}
            <ActivityTile icon="?" title="Quiz" onClick={onQuiz}>{preschool ? "Colors, shapes, animals, and counting." : "Space, nature, and science."}</ActivityTile>
            <ActivityTile icon="▦" title="Memory" onClick={onMemory}>{preschool ? "Match 4 pairs." : "Match 8 pairs."}</ActivityTile>
            {!preschool && <ActivityTile icon="×" title="Tic-tac-toe" onClick={onGrid}>Get three in a row against the computer.</ActivityTile>}
          </div>}
          {group === "watch" && (preschool && !rewardReady ? (
            <div className="activity-grid">
              <ActivityTile icon="▶" title="Unlock a video" onClick={onQuiz}>Finish a quiz to open your video reward.</ActivityTile>
            </div>
          ) : <VideoShelf ageBand={profile.ageBand} onSelect={onVideo} />)}
        </section>
      ))}
      <a className="quiet-button" href="/privacy">Privacy</a>
    </LearnPage>
  );
}
