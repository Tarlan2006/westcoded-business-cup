import { useRef, useState } from "react";
import type { AgeBand, Profile } from "../shared/types";
import { unlock } from "./audio/engine";
import { codenames, tasksFor } from "./game/content";
import type { Mission as MissionState, Session } from "./game/mission";
import { Home, ParentSettings, Welcome } from "./screens/Home";
import { Mission, Results } from "./screens/Mission";
import { ParentGate, Privacy } from "./screens/Parent";
import { Setup, type SetupOptions } from "./screens/Setup";
import { VideoCatalog } from "./screens/VideoCatalog";
import { readProgress, rewardActivity, saveProfile } from "./state/progress";

type Screen =
  | { name: "home" | "setup" | "learn" | "parent" }
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
    return <ParentSettings key={profile.id} profile={profile} onSave={chooseProfile} onBack={goHome} />;
  }
  if (screen.name === "setup" && profile.ageBand !== "1-2") {
    return <Setup profile={profile} onStart={(options) => launch(options, profile)} onBack={goHome} />;
  }
  if (profile.ageBand === "1-2") {
    return <VideoCatalog ageBand={profile.ageBand} onParent={openParent}
      onOpen={() => setProgress(rewardActivity(crypto.randomUUID(), profile.id, "video", 5))} />;
  }
  return <Home profile={profile} onParent={openParent} onActive={() => setScreen({ name: "setup" })}
    onLearn={() => setScreen({ name: "learn" })} />;
}
