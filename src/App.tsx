import { useEffect, useRef, useState } from "react";
import type { Activity, AgeBand, Mode, Profile } from "../shared/types";
import { stopSpeech, unlock } from "./audio/engine";
import { ActivityNavigation, ActivityXp } from "./components/ActivityHeader";
import { LeaveGameDialog } from "./components/LeaveGameDialog";
import { NextUp } from "./components/NextUp";
import { nextActivities } from "./components/activitySuggestions";
import { MODES, tasksFor } from "./game/content";
import type { Mission as MissionState, Session } from "./game/mission";
import { videosFor } from "./game/videos";
import { Ask } from "./screens/Ask";
import { Hub, LearnPage } from "./screens/Home";
import { Memory } from "./screens/Memory";
import { Mission } from "./screens/Mission";
import { MissionSummary } from "./screens/MissionSummary";
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
  | { name: "home" | "parent" | "ask" | "privacy" }
  | { name: "setup"; mode: Mode }
  | { name: "quiz"; id: string; topic?: string }
  | { name: "memory" | "tic-tac-toe" | "sketch" | "space"; id: string }
  | { name: "reward"; points: number; video: boolean; activity: Activity; topic?: string }
  | { name: "video"; id?: string }
  | { name: "mission"; session: Session; profile: Profile }
  | { name: "results"; session: Session; profile: Profile; result: MissionState };

interface HistoryEntry { screen: Screen; key: string; enteredAt: number; scrollY?: number }
function entry(screen: Screen): HistoryEntry { return { screen, key: crypto.randomUUID(), enteredAt: Date.now() }; }
function breadcrumb(screen: Screen): string {
  switch (screen.name) {
    case "parent": return "Grown-ups › Parent settings";
    case "privacy": return "Grown-ups › Privacy";
    case "setup": return `Move › ${MODES[screen.mode].name} › Setup`;
    case "mission": return `Move › ${MODES[screen.session.mode].name}`;
    case "results": return `Move › ${MODES[screen.session.mode].name} › Results`;
    case "quiz": return screen.topic ? "Learn › Ask Mission Control › Quick quiz" : "Learn › Quiz";
    case "memory": return "Learn › Memory";
    case "ask": return "Learn › Ask Mission Control";
    case "tic-tac-toe": return "Learn › Tic-tac-toe";
    case "sketch": return "Learn › Sketch Artist";
    case "space": return "Learn › Space Scale";
    case "reward": return "Learn › Results";
    case "video": return screen.id ? "Watch › Video library › Video" : "Watch › Video library";
    default: return "Activities";
  }
}

export default function App() {
  const [history, setHistory] = useState<HistoryEntry[]>(() => [entry({ name: "home" })]);
  const current = history[history.length - 1];
  const [pendingNavigation, setPendingNavigation] = useState<(() => void) | null>(null);
  const [progress, setProgress] = useState(readProgress);
  const [saved, setSaved] = useState(false);
  useEffect(() => {
    if (!saved) return;
    const timer = window.setTimeout(() => setSaved(false), 2000);
    return () => window.clearTimeout(timer);
  }, [saved]);
  const launchPending = useRef(false);
  const profile = progress.profiles.find((entry) => entry.id === progress.selectedId) ?? progress.profiles[0];
  const privacy = window.location.pathname.replace(/\/$/, "") === "/privacy";

  useEffect(() => {
    setPendingNavigation(null);
    window.scrollTo(0, current.scrollY ?? 0);
    const heading = document.querySelector<HTMLElement>('[data-flow-active="true"] h1');
    if (heading) { heading.tabIndex = -1; heading.focus({ preventScroll: true }); }
  }, [current.key]);

  function setScreen(next: Screen) {
    stopSpeech();
    if (next.name !== "mission") launchPending.current = false;
    const previousScroll = window.scrollY;
    setHistory((previous) => {
      if (next.name === "home") return [entry(next)];
      // A finished activity is never a resumable game in the Back stack.
      if (next.name === "reward" || next.name === "results" ||
        previous.at(-1)?.screen.name === "reward" || previous.at(-1)?.screen.name === "results") {
        return [entry({ name: "home" }), entry(next)];
      }
      return [...previous.map((item, index) => index === previous.length - 1 ? { ...item, scrollY: previousScroll } : item), entry(next)];
    });
  }
  function requestNavigation(action: () => void) {
    if (["mission", "quiz", "memory", "tic-tac-toe"].includes(current.screen.name) && Date.now() - current.enteredAt >= 5000) {
      setPendingNavigation(() => action);
    } else action();
  }
  function goBack() {
    requestNavigation(() => {
      stopSpeech(); launchPending.current = false;
      setHistory((previous) => previous.length > 1 ? previous.slice(0, -1) : [entry({ name: "home" })]);
    });
  }
  function goHome() {
    if (privacy) { window.location.assign("/"); return; }
    requestNavigation(() => setScreen({ name: "home" }));
  }

  // Keep just the Ask answer mounted while its follow-up quiz is open.
  // Games with timers are never retained behind another screen.
  const visibleEntries = history.filter((item, index) => index === history.length - 1 ||
    item.screen.name === "ask" && history.slice(index + 1).every((next) => next.screen.name === "quiz") ||
    (item.screen.name === "parent" || item.screen.name === "home" && !profile?.preferences) && history.slice(index + 1).every((next) => next.screen.name === "privacy"));

  return <ActivityXp value={profile?.xp}>
    <ActivityNavigation value={{ onBack: goBack, onHome: goHome, breadcrumb: privacy ? "Grown-ups › Privacy" : breadcrumb(current.screen) }}>
      {saved && <div className="flow-saved" role="status">Saved ✓</div>}
      {visibleEntries.map((item) => <div key={item.key} data-flow-active={item.key === current.key}
        hidden={item.key !== current.key} inert={item.key !== current.key}>{renderScreen(item.screen)}</div>)}
      {pendingNavigation && <LeaveGameDialog onStay={() => setPendingNavigation(null)} onLeave={() => {
        const leave = pendingNavigation; setPendingNavigation(null); leave();
      }} />}
    </ActivityNavigation>
  </ActivityXp>;

  function renderScreen(screen: Screen) {
    const preferences = profile?.preferences ?? defaultPreferences;

    if (privacy || screen.name === "privacy") return <Privacy onBack={privacy ? undefined : goBack} />;

    function chooseProfile(codenameId: string, ageBand: AgeBand, choices: Preferences) {
      if (screen.name === "parent") setSaved(true);
      setProgress(profile
        ? updateProfile(profile.id, codenameId, ageBand, choices)
        : saveProfile(codenameId, ageBand, choices));
      goHome();
    }

    if (!profile?.preferences || screen.name === "parent") {
      return <ProfileSetup key={profile?.id ?? "new"} profile={profile} profiles={progress.profiles}
        onBack={profile?.preferences ? goBack : undefined} onSave={chooseProfile} onPrivacy={() => setScreen({ name: "privacy" })} />;
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
      setScreen({ name: "reward", points, video, activity, topic: screen.name === "quiz" ? screen.topic : undefined });
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

    function openActivity(activity: Activity, topic?: string) {
      if (activity === "hunt" || activity === "roadtrip" || activity === "lava") setScreen({ name: "setup", mode: activity });
      else if (activity === "video") setScreen({ name: "video" });
      else if (activity === "quiz" && topic) setScreen({ name: "quiz", id: crypto.randomUUID(), topic });
      else startLearn(activity);
    }
    function nextUp(activity: Activity, replay: () => void) {
      return <NextUp options={nextActivities(profile, preferences, activity)} onReplay={replay} onChoose={openActivity} onHome={goHome} />;
    }

    if (screen.name === "setup") {
      return <Setup key={screen.mode} initialMode={screen.mode} preferences={preferences} xp={profile.xp}
        onBack={goBack} onStart={(mode, minutes) => launch(mode, profile, minutes)} />;
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
      return <MissionSummary session={screen.session} profile={screen.profile} state={screen.result} onBack={goHome}>
        {nextUp(screen.session.mode, () => launch(screen.session.mode, profile, screen.session.durationMinutes))}
      </MissionSummary>;
    }
    if (screen.name === "ask" && profile.ageBand === "6-8") {
      return <Ask onBack={goBack} onAnswer={() => setProgress(rewardActivity(crypto.randomUUID(), profile.id, "ask", 5))}
        onQuiz={(topic) => setScreen({ name: "quiz", id: crypto.randomUUID(), topic })} />;
    }
    if (screen.name === "quiz" && profile.ageBand !== "1-2") {
      return <Quiz key={screen.id} ageBand={profile.ageBand} topic={screen.topic}
        onBack={goBack}
        onComplete={(points) => earn(screen.id, "quiz", points, profile.ageBand === "3-5")} />;
    }
    if (screen.name === "memory" && profile.ageBand !== "1-2") {
      return <Memory key={screen.id} pairs={profile.ageBand === "6-8" ? 8 : 4}
        onBack={goBack} onComplete={() => earn(screen.id, "memory", 20)} />;
    }
    if (screen.name === "tic-tac-toe" && profile.ageBand === "6-8") {
      return <TicTacToe key={screen.id} onBack={goBack} onComplete={(won) => {
        if (won) earn(screen.id, "tic-tac-toe", 20);
        else {
          earn(screen.id, "tic-tac-toe", 0);
        }
      }} />;
    }
    if (screen.name === "sketch" && profile.ageBand === "6-8") {
      return <Sketch key={screen.id} onBack={goBack}
        onComplete={(points) => earn(screen.id, "sketch", points)} />;
    }
    if (screen.name === "space" && profile.ageBand !== "1-2") {
      return <Space key={screen.id} exploreOnly={profile.ageBand === "3-5"} onBack={goBack}
        onComplete={(points) => earn(screen.id, "space", points)} />;
    }
    if (screen.name === "reward") {
      return <LearnPage title="Nice work, agent!" onBack={goHome}>
        <div className="panel learn-card">
          <h2 className="flow-earned">+{screen.points} XP</h2>
          <p className="flow-progress-note">{profile.xp} total XP · {profile.streak} day streak</p>
        </div>
        {nextUp(screen.activity, () => openActivity(screen.activity, screen.topic))}
      </LearnPage>;
    }
    if (screen.name === "video" && (profile.ageBand !== "3-5" || (profile.activities?.quiz ?? 0) > 0)) {
      return <VideoCatalog ageBand={profile.ageBand} id={screen.id} onBack={goBack} onOpen={openVideo} />;
    }
    return <Hub profile={profile} preferences={preferences} onParent={() => setScreen({ name: "parent" })} onPrivacy={() => setScreen({ name: "privacy" })}
      onMission={(mode) => setScreen({ name: "setup", mode })} onQuiz={() => startLearn("quiz")}
      onMemory={() => startLearn("memory")} onAsk={() => startLearn("ask")} onGrid={() => startLearn("tic-tac-toe")}
      onSketch={() => startLearn("sketch")} onSpace={() => startLearn("space")}
      onWatch={() => setScreen({ name: "video" })} />;
  }
}
