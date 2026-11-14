import { useState, type ReactNode } from "react";
import type { Mode } from "../../shared/types";
import { ActivityHeader } from "../components/ActivityHeader";
import { Mascot } from "../components/Mascot";
import { GrownUpsButton } from "../components/GrownUpsButton";
import { orderedGroups, startingActivity } from "../components/activitySuggestions";
import { GameButton, HubTile } from "../components/GameUI";
import { Garage } from "../components/Garage";
import { APP_NAME } from "../brand";
import { useSoundEnabled } from "../audio/sfx";
import { codenameFor, MODES } from "../game/content";
import { videosFor } from "../game/videos";
import { sketchGameMeta } from "../games/sketch/meta";
import { spaceGameMeta } from "../games/space/meta";
import { activeModes, type Preferences } from "../state/preferences";
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

export const ActivityTile = HubTile;

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

function RankCard({ profile, preferences }: { profile: ChildProfile; preferences: Preferences }) {
  // The thresholds mirror the existing XP ranks. The rank itself comes from the saved profile.
  const thresholds = [0, 30, 100, 250, 500];
  const previous = thresholds[profile.rank] ?? 0;
  const next = thresholds[profile.rank + 1];
  return (
    <div className="panel hub-profile">
      <Mascot mood="happy" playful />
      <div className="hub-profile-body">
        <h1>Agent {preferences.nickname ?? codenameFor(profile.codenameId)}</h1>
        <p>{rankName(profile.rank)} <span aria-hidden="true">·</span> {profile.streak} day streak</p>
        <p>Ages {profile.ageBand.replace("-", "–")}{profile.ageBand !== "1-2" &&
          ` · ${preferences.location === "car" ? "In the car" : "At home"}`}</p>
        {next ? <>
          <progress value={Math.max(0, profile.xp - previous)} max={next - previous} aria-label="XP progress to next rank" />
          <p className="field-label">{profile.xp} / {next} XP to {rankName(profile.rank + 1)}</p>
        </> : <p className="field-label">{profile.xp} XP · Top rank</p>}
      </div>
    </div>
  );
}

export function Hub({ profile, preferences, onToggleSound, onParent, onPrivacy, onMission, onQuiz, onMemory, onAsk, onGrid, onSketch, onSpace, onWatch }: {
  profile: ChildProfile; preferences: Preferences; onParent: () => void; onPrivacy: () => void; onMission: (mode: Mode) => void;
  onToggleSound: () => void; onQuiz: (topic?: string) => void; onMemory: () => void; onAsk: () => void; onGrid: () => void;
  onSketch: () => void; onSpace: () => void; onWatch: () => void;
}) {
  const [garage, setGarage] = useState(false);
  const sound = useSoundEnabled();
  const preschool = profile.ageBand === "3-5";
  const ordered = orderedGroups(profile, preferences);
  const titles = { active: "Move", learn: "Learn", watch: "Watch" };
  const rewardReady = (profile.activities?.quiz ?? 0) > 0;
  const suggestion = startingActivity(profile, preferences);
  const startSuggested = () => {
    switch (suggestion.activity) {
      case "quiz": return onQuiz(suggestion.topic);
      case "memory": return onMemory();
      case "ask": return onAsk();
      case "tic-tac-toe": return onGrid();
      case "sketch": return onSketch();
      case "space": return onSpace();
      case "video": return onWatch();
      default: return onMission(suggestion.activity);
    }
  };

  return (
    <main className="shell">
      <header className="topbar recon-hub-header"><span className="wordmark"><span className="signal" aria-hidden="true" /> {APP_NAME}</span>
        <div><button type="button" className="quiet-button" aria-pressed={sound} onClick={onToggleSound}>Sound {sound ? "on" : "off"}</button>
          <button type="button" className="quiet-button" onClick={() => setGarage(true)}>🛸 Garage</button>
          <GrownUpsButton onOpen={onParent} /></div>
      </header>
      <div className="learn-page hub">
        <RankCard profile={profile} preferences={preferences} />
        <section className="flow-start panel" aria-labelledby="flow-start-title">
          <div className="flow-start-icon" aria-hidden="true">{suggestion.icon}</div>
          <div><h2 id="flow-start-title" className="field-label">Start here</h2><h3>{suggestion.title}</h3><p>{suggestion.description}</p></div>
          <GameButton onClick={startSuggested}>Start <span aria-hidden="true">→</span><span className="flow-sr-only"> {suggestion.title}</span></GameButton>
        </section>
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
                <ActivityTile tone="learn" icon="?" title="Quiz" onClick={() => onQuiz()}>{preschool ? "Colors, shapes, animals, and counting." : "Space, nature, and science."}</ActivityTile>
                <ActivityTile tone="mint" icon="▦" title="Memory" onClick={onMemory}>{preschool ? "Match 4 pairs." : "Match 8 pairs."}</ActivityTile>
                {!preschool && <>
                  <ActivityTile tone="learn" icon="✦" title="Ask Mission Control" onClick={onAsk}>Ask about anything you wonder.</ActivityTile>
                  <ActivityTile tone="mint" icon="×" title="Tic-tac-toe" onClick={onGrid}>Get three in a row against the computer.</ActivityTile>
                </>}
                {sketchGameMeta.ageBands.some((ageBand) => ageBand === profile.ageBand) &&
                  <ActivityTile key={sketchGameMeta.id} tone="sun" icon={sketchGameMeta.icon}
                    title={sketchGameMeta.title} onClick={onSketch}>{sketchGameMeta.description}</ActivityTile>}
                {spaceGameMeta.ageBands.some((ageBand) => ageBand === profile.ageBand) &&
                  <ActivityTile tone="learn" icon={spaceGameMeta.icon}
                    title={spaceGameMeta.title} onClick={onSpace}>{spaceGameMeta.description}</ActivityTile>}
              </>}
              {group === "watch" && <ActivityTile tone="watch" icon="▶" title="Video library" onClick={preschool && !rewardReady ? () => onQuiz() : onWatch}>
                {preschool && !rewardReady ? "Finish a quiz to open your video reward." : "Pick a short video to watch together."}
              </ActivityTile>}
            </div>
          </section>
        ))}
        <a className="quiet-button" href="/privacy" onClick={(event) => { event.preventDefault(); onPrivacy(); }}>Privacy</a>
      </div>
      {garage && <Garage sessions={profile.garageSessions ?? 0} onClose={() => setGarage(false)} />}
    </main>
  );
}
