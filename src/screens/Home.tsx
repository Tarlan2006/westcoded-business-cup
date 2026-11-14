import type { ReactNode } from "react";
import type { Mode } from "../../shared/types";
import { ActivityHeader } from "../components/ActivityHeader";
import { Mascot } from "../components/Mascot";
import { codenameFor, MODES } from "../game/content";
import { videosFor } from "../game/videos";
import { activeModes, type ActivityGroup, type Preferences } from "../state/preferences";
import { rankName, type ChildProfile } from "../state/progress";

export function LearnPage({ title, onBack, backHref, children, wide = false, xp }: {
  title: string; onBack?: () => void; backHref?: string; children: ReactNode; wide?: boolean; xp?: number;
}) {
  return (
    <main className={wide ? "shell" : "shell learn-shell"}>
      <ActivityHeader title={title} onBack={onBack} backHref={backHref} xp={xp} />
      <section className="learn-page" aria-label={title}>
        <h1>{title}</h1>
        {children}
      </section>
    </main>
  );
}

export function ActivityTile({ icon, title, children, onClick, tone }: {
  icon: string; title: string; children: ReactNode; onClick: () => void; tone?: ActivityGroup | "mint" | "sun";
}) {
  return (
    <button className="activity-tile" type="button" onClick={onClick} data-tone={tone}>
      <span className="activity-icon" aria-hidden="true">{icon}</span>
      <strong>{title}</strong><span className="tile-description">{children}</span>
      <span aria-hidden="true" className="tile-arrow">→</span>
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

function RankCard({ profile, preferences, onParent }: { profile: ChildProfile; preferences: Preferences; onParent: () => void }) {
  // The thresholds mirror the existing XP ranks. The rank itself comes from the saved profile.
  const thresholds = [0, 30, 100, 250, 500];
  const previous = thresholds[profile.rank] ?? 0;
  const next = thresholds[profile.rank + 1];
  return (
    <div className="panel hub-profile">
      <Mascot mood="happy" />
      <div className="hub-profile-body">
        <h1>Agent {codenameFor(profile.codenameId)}</h1>
        <p>{rankName(profile.rank)} <span aria-hidden="true">·</span> {profile.streak} day streak</p>
        <p>Ages {profile.ageBand.replace("-", "–")} · {preferences.minutes} min planned{profile.ageBand !== "1-2" &&
          ` · ${preferences.location === "car" ? "In the car" : "At home"}`}</p>
        {next ? <>
          <progress value={Math.max(0, profile.xp - previous)} max={next - previous} aria-label="XP progress to next rank" />
          <p className="field-label">{profile.xp} / {next} XP to {rankName(profile.rank + 1)}</p>
        </> : <p className="field-label">{profile.xp} XP · Top rank</p>}
      </div>
      <button className="quiet-button" type="button" onClick={onParent}>Parent settings</button>
    </div>
  );
}

export function Hub({ profile, preferences, onParent, onMission, onQuiz, onMemory, onAsk, onGrid, onWatch }: {
  profile: ChildProfile; preferences: Preferences; onParent: () => void; onMission: (mode: Mode) => void;
  onQuiz: () => void; onMemory: () => void; onAsk: () => void; onGrid: () => void; onWatch: () => void;
}) {
  const toddler = profile.ageBand === "1-2";
  const preschool = profile.ageBand === "3-5";
  const groups: ActivityGroup[] = toddler ? ["watch"] : ["active", "learn", "watch"];
  const first = preferences.first === "any" ? groups[0] : preferences.first;
  const ordered = groups.includes(first) ? [first, ...groups.filter((group) => group !== first)] : groups;
  const titles = { active: "Move", learn: "Learn", watch: "Watch" };
  const rewardReady = (profile.activities?.quiz ?? 0) > 0;

  return (
    <main className="shell">
      <header className="topbar"><span className="wordmark"><span className="signal" aria-hidden="true" /> Mission Control</span></header>
      <div className="learn-page hub">
        <RankCard profile={profile} preferences={preferences} onParent={onParent} />
        {ordered.map((group) => (
          <section className="activity-section" key={group} aria-labelledby={`group-${group}`}>
            <h2 id={`group-${group}`}>{titles[group]}</h2>
            <div className="activity-grid" data-group={group}>
              {group === "active" && activeModes(preferences.location).map((mode) => (
                <ActivityTile key={mode} tone={mode === "roadtrip" ? "sun" : "active"} icon={MODES[mode].icon}
                  title={MODES[mode].name} onClick={() => onMission(mode)}>
                  {MODES[mode].description}
                </ActivityTile>
              ))}
              {group === "learn" && <>
                <ActivityTile tone="learn" icon="?" title="Quiz" onClick={onQuiz}>{preschool ? "Colors, shapes, animals, and counting." : "Space, nature, and science."}</ActivityTile>
                <ActivityTile tone="mint" icon="▦" title="Memory" onClick={onMemory}>{preschool ? "Match 4 pairs." : "Match 8 pairs."}</ActivityTile>
                {!preschool && <>
                  <ActivityTile tone="learn" icon="✦" title="Ask Mission Control" onClick={onAsk}>Ask about science or nature.</ActivityTile>
                  <ActivityTile tone="mint" icon="×" title="Tic-tac-toe" onClick={onGrid}>Get three in a row against the computer.</ActivityTile>
                </>}
              </>}
              {group === "watch" && <ActivityTile tone="watch" icon="▶" title="Video library" onClick={preschool && !rewardReady ? onQuiz : onWatch}>
                {preschool && !rewardReady ? "Finish a quiz to open your video reward." : "Pick a short video to watch together."}
              </ActivityTile>}
            </div>
          </section>
        ))}
        <a className="quiet-button" href="/privacy">Privacy</a>
      </div>
    </main>
  );
}
