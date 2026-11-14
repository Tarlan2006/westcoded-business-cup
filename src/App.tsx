import { useRef, useState } from "react";
import type { Profile } from "../shared/types";
import { unlock } from "./audio/engine";
import { tasksFor } from "./game/content";
import type { Mission as MissionState, Session } from "./game/mission";
import { Mission, Results } from "./screens/Mission";
import { ParentGate, Privacy, Unlock } from "./screens/Parent";
import { Setup, type SetupOptions } from "./screens/Setup";
import { finishMission, readProgress, remainingMissions, saveProfile, startMission } from "./state/progress";

type Screen =
  | { name: "setup" | "unlock" }
  | { name: "mission"; session: Session; profile: Profile }
  | { name: "results"; session: Session; profile: Profile; result: MissionState }
  | { name: "gate"; destination: "unlock" | "setup"; back: Screen };

export default function App() {
  const [screen, setScreen] = useState<Screen>({ name: "setup" });
  const [progress, setProgress] = useState(readProgress);
  const launchPending = useRef(false);
  if (window.location.pathname.replace(/\/$/, "") === "/privacy") return <Privacy />;

  function openGate(destination: "setup" | "unlock") {
    setScreen({ name: "gate", destination, back: screen });
  }

  function launch(options: SetupOptions) {
    if (launchPending.current) return;
    launchPending.current = true;
    const id = crypto.randomUUID();
    const usage = startMission(id);
    if (!usage) {
      setProgress(readProgress());
      launchPending.current = false;
      openGate("unlock");
      return;
    }
    const profile = saveProfile(options.codenameId, options.ageBand);
    setProgress(readProgress());
    const tasks = tasksFor(options.mode, options.ageBand);
    const session: Session = { id, mode: options.mode, tasks, durationMinutes: options.durationMinutes };
    void unlock().catch(() => {});
    setScreen({ name: "mission", profile, session });
  }

  if (screen.name === "mission") {
    const { session, profile } = screen;
    return <Mission key={session.id} session={session} profile={profile} onFinish={(result) => {
      const memory = result.done ? `Completed ${result.done} rounds in ${session.mode}.` : `Played ${session.mode}.`;
      const updated = finishMission(session.id, profile.id, session.mode, result.points, memory);
      setProgress(updated);
      launchPending.current = false;
      setScreen({
        name: "results", session, result,
        profile: updated.profiles.find((entry) => entry.id === profile.id) ?? profile,
      });
    }} />;
  }
  if (screen.name === "results") {
    return <Results session={screen.session} profile={screen.profile} state={screen.result} onBack={() => openGate("setup")} />;
  }
  if (screen.name === "gate") {
    return <ParentGate onPass={() => setScreen({ name: screen.destination })} onBack={() => setScreen(screen.back)} />;
  }
  if (screen.name === "unlock") return <Unlock onBack={() => setScreen({ name: "setup" })} />;

  return <Setup profiles={progress.profiles} selectedId={progress.selectedId} remaining={remainingMissions(progress)}
    onStart={launch} onUnlock={() => {
      const current = readProgress();
      setProgress(current);
      if (!remainingMissions(current)) openGate("unlock");
    }} />;
}
