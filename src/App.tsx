import { useEffect, useRef, useState } from "react";
import type { Activity, AgeBand, Mode, Profile } from "../shared/types";
import { unlock } from "./audio/engine";
import { ActivityXp } from "./components/ActivityHeader";
import { tasksFor } from "./game/content";
import type { Mission as MissionState, Session } from "./game/mission";
import { videosFor } from "./game/videos";
import { Ask } from "./screens/Ask";
import { Hub, LearnPage } from "./screens/Home";
import { Memory } from "./screens/Memory";
import { Mission, Results } from "./screens/Mission";
import { Privacy } from "./screens/Parent";
import { ProfileSetup } from "./screens/ProfileSetup";
import { Quiz } from "./screens/Quiz";
import { Setup } from "./screens/Setup";
import { Sketch } from "./screens/Sketch";
import { Space } from "./screens/Space";
import { TicTacToe } from "./screens/TicTacToe";
import { VideoCatalog } from "./screens/VideoCatalog";
import { defaultPreferences, type Preferences } from "./state/preferences";
import { readProgress, rewardActivity, saveProfile, updateProfile } from "./state/progress";

type Screen =
  | { name: "home" | "parent" | "ask" }
  | { name: "setup"; mode: Mode }
  | { name: "quiz"; id: string; topic?: string }
  | { name: "memory" | "tic-tac-toe" | "sketch" | "space"; id: string }
  | { name: "reward"; points: number; video: boolean }
  | { name: "video"; id?: string }
  | { name: "mission"; session: Session; profile: Profile }
  | { name: "results"; session: Session; profile: Profile; result: MissionState };

export default function App() {
  const [screen, setScreen] = useState<Screen>({ name: "home" });
  const [progress, setProgress] = useState(readProgress);
  const [saved, setSaved] = useState(false);
  useEffect(() => {
    if (!saved) return;
    const timer = window.setTimeout(() => setSaved(false), 2000);
    return () => window.clearTimeout(timer);
  }, [saved]);
  const launchPending = useRef(false);
  const profile = progress.profiles.find((entry) => entry.id === progress.selectedId) ?? progress.profiles[0];
  return <ActivityXp value={profile?.xp}>{saved && <div className="flow-saved" role="status">Saved ✓</div>}{renderScreen()}</ActivityXp>;

  function renderScreen() {
    const preferences = profile?.preferences ?? defaultPreferences;
    const goHome = () => setScreen({ name: "home" });

    if (window.location.pathname.replace(/\/$/, "") === "/privacy") return <Privacy />;

    function chooseProfile(codenameId: string, ageBand: AgeBand, choices: Preferences) {
      if (screen.name === "parent") setSaved(true);
      setProgress(profile
        ? updateProfile(profile.id, codenameId, ageBand, choices)
        : saveProfile(codenameId, ageBand, choices));
      goHome();
    }

    if (!profile?.preferences || screen.name === "parent") {
      return <ProfileSetup key={profile?.id ?? "new"} profile={profile} profiles={progress.profiles}
        onBack={profile?.preferences ? goHome : undefined} onSave={chooseProfile} />;
    }

    function startLearn(name: "quiz" | "memory" | "ask" | "tic-tac-toe" | "sketch" | "space") {
      if (name === "sketch" && profile.ageBand !== "6-8") return;
      if (name !== "space") void unlock().catch(() => {});
      if (name === "ask") {
        setScreen({ name });
        return;
      }
      const id = crypto.randomUUID();
      setScreen(name === "quiz" ? { name: "quiz", id } : { name, id });
    }

    function earn(id: string, activity: Activity, points: number, video = false) {
      if (!profile) return;
      setProgress(rewardActivity(id, profile.id, activity, points));
      setScreen({ name: "reward", points, video });
    }

    function launch(mode: Mode, selected: Profile, minutes: number) {
      if (launchPending.current || selected.ageBand === "1-2") return;
      launchPending.current = true;
      const tasks = tasksFor(mode, selected.ageBand);
      const session: Session = { id: crypto.randomUUID(), mode, tasks, durationMinutes: minutes };
      void unlock().catch(() => {});
      setScreen({ name: "mission", profile: selected, session });
    }

    function rewardVideo() {
      if (profile) setProgress(rewardActivity(crypto.randomUUID(), profile.id, "video", 5));
    }

    function openVideo(id: string) {
      if (!profile || !videosFor(profile.ageBand).some((video) => video.id === id)) return;
      if (profile.ageBand === "3-5" && !(profile.activities?.quiz ?? 0)) return;
      rewardVideo();
      setScreen({ name: "video", id });
    }

    if (screen.name === "setup") {
      return <Setup key={screen.mode} initialMode={screen.mode} preferences={preferences} xp={profile.xp}
        onBack={goHome} onStart={(mode, minutes) => launch(mode, profile, minutes)} />;
    }
    if (screen.name === "mission") {
      const { session, profile } = screen;
      return <Mission key={session.id} session={session} profile={profile} onFinish={(result) => {
        const memory = result.done ? `Completed ${result.done} rounds in ${session.mode}.` : `Played ${session.mode}.`;
        const updated = rewardActivity(session.id, profile.id, session.mode, result.points, {
          mode: session.mode, memory: result.loreNote || memory,
        });
        setProgress(updated);
        launchPending.current = false;
        setScreen({
          name: "results", session, result,
          profile: updated.profiles.find((entry) => entry.id === profile.id) ?? profile,
        });
      }} />;
    }
    if (screen.name === "results") {
      return <Results session={screen.session} profile={screen.profile} state={screen.result} onBack={goHome} />;
    }
    if (screen.name === "ask" && profile.ageBand === "6-8") {
      return <Ask onBack={goHome} onAnswer={() => setProgress(rewardActivity(crypto.randomUUID(), profile.id, "ask", 5))}
        onQuiz={(topic) => setScreen({ name: "quiz", id: crypto.randomUUID(), topic })} />;
    }
    if (screen.name === "quiz" && profile.ageBand !== "1-2") {
      return <Quiz key={screen.id} ageBand={profile.ageBand} topic={screen.topic}
        onBack={screen.topic ? () => setScreen({ name: "ask" }) : goHome}
        onComplete={(points) => earn(screen.id, "quiz", points, profile.ageBand === "3-5")} />;
    }
    if (screen.name === "memory" && profile.ageBand !== "1-2") {
      return <Memory key={screen.id} pairs={profile.ageBand === "6-8" ? 8 : 4}
        onBack={goHome} onComplete={() => earn(screen.id, "memory", 20)} />;
    }
    if (screen.name === "tic-tac-toe" && profile.ageBand === "6-8") {
      return <TicTacToe key={screen.id} onBack={goHome} onComplete={(won) => {
        if (won) earn(screen.id, "tic-tac-toe", 20);
        else {
          setProgress(rewardActivity(screen.id, profile.id, "tic-tac-toe", 0));
          goHome();
        }
      }} />;
    }
    if (screen.name === "sketch" && profile.ageBand === "6-8") {
      return <Sketch key={screen.id} onBack={goHome}
        onComplete={(points) => earn(screen.id, "sketch", points)} />;
    }
    if (screen.name === "space" && profile.ageBand !== "1-2") {
      return <Space key={screen.id} exploreOnly={profile.ageBand === "3-5"} onBack={goHome}
        onComplete={(points) => earn(screen.id, "space", points)} />;
    }
    if (screen.name === "reward") {
      return <LearnPage title="Nice work, agent!" onBack={goHome}>
        <div className="panel learn-card">
          <h2>+{screen.points} XP</h2>
          <p>{profile.xp} total XP · {profile.streak} day streak</p>
          {screen.video && <button className="primary-button" type="button"
            onClick={() => setScreen({ name: "video" })}>Open video reward</button>}
          <button className="quiet-button" type="button" onClick={goHome}>Back to activities</button>
        </div>
      </LearnPage>;
    }
    if (screen.name === "video" && (profile.ageBand !== "3-5" || (profile.activities?.quiz ?? 0) > 0)) {
      return <VideoCatalog ageBand={profile.ageBand} id={screen.id} onBack={goHome} onOpen={openVideo} />;
    }
    return <Hub profile={profile} preferences={preferences} onParent={() => setScreen({ name: "parent" })}
      onMission={(mode) => setScreen({ name: "setup", mode })} onQuiz={() => startLearn("quiz")}
      onMemory={() => startLearn("memory")} onAsk={() => startLearn("ask")} onGrid={() => startLearn("tic-tac-toe")}
      onSketch={() => startLearn("sketch")} onSpace={() => startLearn("space")}
      onWatch={() => setScreen({ name: "video" })} />;
  }
}
