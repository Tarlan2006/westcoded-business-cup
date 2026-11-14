import { useRef, useState } from "react";
import type { Activity, AgeBand, Profile } from "../shared/types";
import { unlock } from "./audio/engine";
import { codenames, tasksFor } from "./game/content";
import type { Mission as MissionState, Session } from "./game/mission";
import { Ask } from "./screens/Ask";
import { Home, LearnHome, LearnPage, ParentSettings, Welcome } from "./screens/Home";
import { Memory } from "./screens/Memory";
import { Mission, Results } from "./screens/Mission";
import { ParentGate, Privacy } from "./screens/Parent";
import { Quiz } from "./screens/Quiz";
import { Setup, type SetupOptions } from "./screens/Setup";
import { TicTacToe } from "./screens/TicTacToe";
import { VideoCatalog } from "./screens/VideoCatalog";
import { readProgress, rewardActivity, saveProfile, updateProfile } from "./state/progress";

type Screen =
  | { name: "home" | "setup" | "learn" | "parent" | "ask" }
  | { name: "quiz"; id: string; topic?: string }
  | { name: "memory" | "tic-tac-toe"; id: string }
  | { name: "reward"; points: number; video: boolean }
  | { name: "video" }
  | { name: "mission"; session: Session; profile: Profile }
  | { name: "results"; session: Session; profile: Profile; result: MissionState }
  | { name: "gate"; back: Screen; destination: "setup" | "parent" };

export default function App() {
  const [screen, setScreen] = useState<Screen>({ name: "home" });
  const [progress, setProgress] = useState(readProgress);
  const launchPending = useRef(false);
  const profile = progress.profiles.find((entry) => entry.id === progress.selectedId) ?? progress.profiles[0];
  const goHome = () => setScreen({ name: "home" });
  const openParent = () => setScreen({ name: "gate", back: screen, destination: "parent" });

  if (window.location.pathname.replace(/\/$/, "") === "/privacy") return <Privacy />;

  function chooseProfile(codenameId: string, ageBand: AgeBand) {
    saveProfile(codenameId, ageBand);
    setProgress(readProgress());
    goHome();
  }

  if (!profile) return <Welcome onChoose={(ageBand) => chooseProfile(codenames[0], ageBand)} />;

  const goLearn = () => setScreen({ name: "learn" });
  function startLearn(name: "quiz" | "memory" | "ask" | "tic-tac-toe") {
    void unlock().catch(() => {});
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

  function launch(options: SetupOptions, selected: Profile) {
    if (launchPending.current || selected.ageBand === "1-2") return;
    launchPending.current = true;
    const tasks = tasksFor(options.mode, selected.ageBand);
    const session: Session = { id: crypto.randomUUID(), mode: options.mode, tasks, durationMinutes: options.durationMinutes };
    void unlock().catch(() => {});
    setScreen({ name: "mission", profile: selected, session });
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
    return <Results session={screen.session} profile={screen.profile} state={screen.result}
      onBack={() => setScreen({ name: "gate", back: screen, destination: "setup" })} />;
  }
  if (screen.name === "gate") {
    return <ParentGate onPass={() => setScreen({ name: screen.destination })} onBack={() => setScreen(screen.back)} />;
  }
  if (screen.name === "parent") {
    return <ParentSettings key={profile.id} profile={profile} profiles={progress.profiles}
      onSave={(codenameId, ageBand) => {
        setProgress(updateProfile(profile.id, codenameId, ageBand));
        goHome();
      }} onBack={goHome} />;
  }
  if (screen.name === "setup" && profile.ageBand !== "1-2") {
    return <Setup profile={profile} onStart={(options) => launch(options, profile)} onBack={goHome} />;
  }
  if (profile.ageBand === "1-2") {
    return <VideoCatalog ageBand={profile.ageBand} onParent={openParent}
      onOpen={() => setProgress(rewardActivity(crypto.randomUUID(), profile.id, "video", 5))} />;
  }
  if (screen.name === "learn") {
    return <LearnHome profile={profile} onBack={goHome} onQuiz={() => startLearn("quiz")}
      onMemory={() => startLearn("memory")}
      onAsk={profile.ageBand === "6-8" ? () => startLearn("ask") : undefined}
      onGrid={profile.ageBand === "6-8" ? () => startLearn("tic-tac-toe") : undefined} />;
  }
  if (screen.name === "ask" && profile.ageBand === "6-8") {
    return <Ask onBack={goLearn} onAnswer={() => setProgress(rewardActivity(crypto.randomUUID(), profile.id, "ask", 5))}
      onQuiz={(topic) => setScreen({ name: "quiz", id: crypto.randomUUID(), topic })} />;
  }
  if (screen.name === "quiz") {
    return <Quiz key={screen.id} ageBand={profile.ageBand} topic={screen.topic}
      onBack={screen.topic ? () => setScreen({ name: "ask" }) : goLearn}
      onComplete={(points) => earn(screen.id, "quiz", points, profile.ageBand === "3-5")} />;
  }
  if (screen.name === "memory") {
    return <Memory key={screen.id} pairs={profile.ageBand === "6-8" ? 8 : 4}
      onBack={goLearn} onComplete={() => earn(screen.id, "memory", 20)} />;
  }
  if (screen.name === "tic-tac-toe" && profile.ageBand === "6-8") {
    return <TicTacToe key={screen.id} onBack={goLearn} onComplete={(won) => {
      if (won) earn(screen.id, "tic-tac-toe", 20);
      else {
        setProgress(rewardActivity(screen.id, profile.id, "tic-tac-toe", 0));
        goLearn();
      }
    }} />;
  }
  if (screen.name === "reward") {
    return <LearnPage title="Nice work, agent!" onBack={goLearn}>
      <div className="panel learn-card">
        <h2>+{screen.points} XP</h2>
        <p>{profile.xp} total XP · {profile.streak} day streak</p>
        {screen.video && <button className="primary-button" type="button"
          onClick={() => setScreen({ name: "video" })}>Open video reward</button>}
        <button className="quiet-button" type="button" onClick={goHome}>Back to profile</button>
      </div>
    </LearnPage>;
  }
  if (screen.name === "video") {
    return <VideoCatalog ageBand={profile.ageBand} onBack={goLearn}
      onOpen={() => setProgress(rewardActivity(crypto.randomUUID(), profile.id, "video", 5))} />;
  }
  return <Home profile={profile} onParent={openParent} onActive={() => setScreen({ name: "setup" })}
    onLearn={goLearn} />;
}
