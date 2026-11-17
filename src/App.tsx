import { themeForActivity } from "./audio/ambienceThemes";
import { videosFor } from "./game/videos";
import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Activity, AgeBand, Mode, Profile } from "../shared/types";
import { speakFallback, stopSpeech, unlock } from "./audio/engine";
import { APP_NAME } from "./brand";
import { SoundEnabled } from "./audio/sfx";
import { ActivityHeader, ActivityNavigation, ActivityXp } from "./components/ActivityHeader";
import { LeaveGameDialog } from "./components/LeaveGameDialog";
import { PrototypeFrame } from "./components/PrototypeFrame";
import { NextUp } from "./components/NextUp";
import { RewardCard } from "./components/RewardCard";
import { ParentSessionDialog, SessionActivity, SessionClockProvider } from "./components/SessionControls";
import { nextActivities } from "./components/activitySuggestions";
import { codenameFor, MODES, tasksFor } from "./game/content";
import type { Mission as MissionState, Session } from "./game/mission";
import { Hub, LearnPage } from "./screens/Home";
const Privacy = lazy(() => import("./screens/Parent").then(module => ({ default: module.Privacy })));
const Plans = lazy(() => import("./screens/Plans").then(module => ({ default: module.Plans })));
const ProfileSetup = lazy(() => import("./screens/ProfileSetup").then(module => ({ default: module.ProfileSetup })));
import { SessionComplete } from "./screens/SessionComplete";
const Setup = lazy(() => import("./screens/Setup").then(module => ({ default: module.Setup })));
const Sketch = lazy(() => import("./screens/Sketch").then(module => ({ default: module.Sketch })));
const Space = lazy(() => import("./screens/Space").then(module => ({ default: module.Space })));
import { Welcome } from "./screens/Welcome";
import type { TopicId } from "../shared/topics";
import { defaultPreferences, type Preferences } from "./state/preferences";
import { readProgress, rewardActivity, saveProfile, updateProfile, type ChildProfile } from "./state/progress";
import { useSessionTimer } from "./state/useSessionTimer";

const Ask = lazy(() => import("./screens/Ask").then(({ Ask }) => ({ default: Ask })));
const Memory = lazy(() => import("./screens/Memory").then(({ Memory }) => ({ default: Memory })));
const Mission = lazy(() => import("./screens/Mission").then(({ Mission }) => ({ default: Mission })));
const MissionSummary = lazy(() => import("./screens/MissionSummary").then(({ MissionSummary }) => ({ default: MissionSummary })));
const Quiz = lazy(() => import("./screens/Quiz").then(({ Quiz }) => ({ default: Quiz })));
const TicTacToe = lazy(() => import("./screens/TicTacToe").then(({ TicTacToe }) => ({ default: TicTacToe })));
const ToddlerMission = lazy(() => import("./screens/ToddlerMission").then(({ ToddlerMission }) => ({ default: ToddlerMission })));
const VideoCatalog = lazy(() => import("./screens/VideoCatalog").then(({ VideoCatalog }) => ({ default: VideoCatalog })));
const Balloons = lazy(() => import("./games/balloons"));

type Screen =
  | { name: "home" | "parent" | "ask" | "privacy" | "plans" }
  | { name: "setup"; mode: Mode }
  | { name: "quiz"; id: string; topic?: string; afterVideo?: boolean }
  | { name: "memory" | "tic-tac-toe" | "sketch" | "space" | "balloons"; id: string }
  | { name: "reward"; points: number; activity: Activity; topic?: string; afterVideo?: boolean }
  | { name: "video"; id: string }
  | { name: "toddler"; id: string }
  | { name: "mission"; session: Session; profile: Profile }
  | { name: "results"; session: Session; result: MissionState };

interface HistoryEntry { screen: Screen; key: string; enteredAt: number; scrollY?: number }
function entry(screen: Screen): HistoryEntry { return { screen, key: crypto.randomUUID(), enteredAt: Date.now() }; }
function breadcrumb(screen: Screen): string {
  switch (screen.name) {
    case "parent": return "Grown-ups › Parent settings";
    case "privacy": return "Grown-ups › Privacy";
    case "plans": return `Grown-ups › ${APP_NAME} Plus`;
    case "setup": return `Move › ${MODES[screen.mode].name} › Setup`;
    case "mission": return `Move › ${MODES[screen.session.mode].name}`;
    case "results": return `Move › ${MODES[screen.session.mode].name} › Results`;
    case "toddler": return `Watch › Play with ${APP_NAME}`;
    case "quiz": return screen.topic ? `Learn › Ask ${APP_NAME} › Quick quiz` : "Learn › Quiz";
    case "memory": return "Learn › Memory";
    case "ask": return `Learn › Ask ${APP_NAME}`;
    case "tic-tac-toe": return "Learn › Tic-tac-toe";
    case "sketch": return "Learn › Sketch Artist";
    case "space": return "Learn › Space Scale";
    case "balloons": return "Learn › Balloon Count";
    case "reward": return "Learn › Results";
    case "video": return "Watch › Video library";
    default: return "Activities";
  }
}

function missionQuizTopic(profile: ChildProfile, preferences: Preferences) {
  if (preferences.needs?.includes("habits") && profile.ageBand === "6-8") return "nature and water";
  if (preferences.needs?.includes("science")) return profile.ageBand === "6-8" ? "sky and space" : "shapes";
  if (preferences.needs?.includes("listening") && profile.ageBand === "3-5") return "animals";
  return undefined;
}

function FocusScreenHeading({ active }: { active: boolean }) {
  useEffect(() => {
    if (!active) return;
    const heading = document.querySelector<HTMLElement>('[data-flow-active="true"] h1');
    if (heading) {
      heading.tabIndex = -1;
      heading.focus({ preventScroll: true });
    }
  }, [active]);
  return null;
}

export default function App() {
  const [pendingNavigation, setPendingNavigation] = useState<(() => void) | null>(null);
  const [progress, setProgress] = useState(readProgress);
  const profile = progress.profiles.find((item) => item.id === progress.selectedId) ?? progress.profiles[0];
  const [sound, setSound] = useState(() => {
    try { return localStorage.getItem("mission-control.sound") !== "off"; } catch { return true; }
  });
  const timer = useSessionTimer(sound);
  const { session, finishBy, finishing, actionFinished, canStartActivity, finishActivity } = timer;
  const sessionEndsAt = session?.sessionEndsAt;
  const [history, setHistory] = useState<HistoryEntry[]>(() => {
    const home = entry({ name: "home" });
    return session && !session.complete && profile?.ageBand === "1-2"
      ? [home, entry({ name: "video", id: crypto.randomUUID() })] : [home];
  });
  const current = history[history.length - 1];
  const [welcoming, setWelcoming] = useState(!session);
  const [repeatVisit] = useState(() => !!profile?.preferences &&
    new URLSearchParams(window.location.search).get("welcome") !== "1");
  const [parentsOpen, setParentsOpen] = useState(false);
  const launchPending = useRef(false);
  const privacy = window.location.pathname.replace(/\/$/, "") === "/privacy";
  const openParents = useCallback(() => {
    if (canStartActivity()) setParentsOpen(true);
  }, [canStartActivity]);
  const sessionActive = !!session && !session.complete && !!profile?.preferences;
  const sessionActivity = useMemo(() => sessionActive && !privacy && sessionEndsAt !== undefined && finishBy !== undefined
    ? { endsAt: sessionEndsAt, finishBy, finishing, canStartActivity, finishActivity, openParents } : null,
    [sessionActive, privacy, sessionEndsAt, finishBy, finishing, canStartActivity, finishActivity, openParents]);

  useEffect(() => {
    if (!finishing) return;
    setPendingNavigation(null);
    setParentsOpen(false);
    if (privacy || ["home", "parent", "privacy", "plans", "setup", "results", "reward"].includes(current.screen.name)) finishActivity();
  }, [finishing, current.screen.name, finishActivity, privacy]);

  useEffect(() => {
    const section = privacy ? "Privacy" : session?.complete ? "Session complete" : welcoming ? "" : !session ? "Parent Setup" : breadcrumb(current.screen);
    document.title = section ? section + " · " + APP_NAME : APP_NAME;
    const description = privacy ? "How MyPal handles local child settings, optional voice input and questions."
      : section ? section + " with MyPal: playful adventures for children and their grown-ups."
      : "MyPal: playful adventures, learning games and friendly voice guidance with MyPal for children and their grown-ups.";
    document.querySelector('meta[name="description"]')?.setAttribute("content", description);
  }, [privacy, session?.complete, !!session, welcoming, current.screen.name]);

  function toggleSound() {
    const enabled = !sound;
    setSound(enabled);
    if (!enabled) stopSpeech();
    else void unlock().catch(() => {});
    try { localStorage.setItem("mission-control.sound", enabled ? "on" : "off"); } catch { /* This tab still works. */ }
  }

  function continueWelcome() {
    setWelcoming(false);
    const url = new URL(window.location.href);
    if (url.searchParams.has("welcome")) {
      url.searchParams.delete("welcome");
      window.history.replaceState(null, "", url);
    }
  }

  useEffect(() => {
    setPendingNavigation(null);
    window.scrollTo(0, current.scrollY ?? 0);
  }, [current.key, welcoming]);

  function backToStart() {
    timer.clear();
    launchPending.current = false;
    setPendingNavigation(null);
    setParentsOpen(false);
    setWelcoming(false);
    setHistory([entry({ name: "parent" })]);
  }

  function setScreen(next: Screen, navigation: "push" | "replace" | "from-home" = "push") {
    if (session && !canStartActivity()) {
      if (next.name === "results" || next.name === "reward") finishActivity();
      return;
    }
    stopSpeech();
    if (next.name !== "mission") launchPending.current = false;
    const previousScroll = window.scrollY;
    setHistory((previous) => {
      if (next.name === "home") return [entry(next)];
      if (navigation === "from-home") return [entry({ name: "home" }), entry(next)];
      if (navigation === "replace") return [...previous.slice(0, -1), entry(next)];
      // A finished activity is never a resumable game in the Back stack.
      if (next.name === "reward" || next.name === "results" ||
        previous.at(-1)?.screen.name === "reward" || previous.at(-1)?.screen.name === "results") {
        return [entry({ name: "home" }), entry(next)];
      }
      return [...previous.map((item, index) => index === previous.length - 1 ? { ...item, scrollY: previousScroll } : item), entry(next)];
    });
  }
  function requestNavigation(action: () => void) {
    if (session && !canStartActivity()) {
      finishActivity();
      return;
    }
    if (["mission", "quiz", "memory", "tic-tac-toe", "sketch", "space", "toddler"].includes(current.screen.name) && Date.now() - current.enteredAt >= 5000) {
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
    (item.screen.name === "parent" || item.screen.name === "home" && !session) && history.slice(index + 1).every((next) => next.screen.name === "privacy"));

  if (session?.complete && !privacy) return <PrototypeFrame>
    <SessionComplete name={profile?.preferences?.nickname ?? (profile ? codenameFor(profile.codenameId) : "pal")}
      xp={profile?.xp ?? 0} streak={profile?.streak ?? 0} onBack={backToStart} />
  </PrototypeFrame>;

  if (welcoming && !privacy && !session) return <SoundEnabled value={sound}><PrototypeFrame>
    <Welcome repeat={repeatVisit} onContinue={continueWelcome} onToggleSound={toggleSound} />
  </PrototypeFrame></SoundEnabled>;

  return <SoundEnabled value={sound}><PrototypeFrame
    theme={themeForActivity(current.screen.name === 'mission' ? current.screen.session.mode : current.screen.name === 'setup' ? current.screen.mode : current.screen.name)}
    music={sessionActive && !privacy && !['video', 'privacy', 'parent', 'plans'].includes(current.screen.name)}
    paused={parentsOpen || !!pendingNavigation || finishing}><ActivityXp value={profile?.xp}>
    <SessionClockProvider endsAt={sessionActivity?.endsAt}>
    <ActivityNavigation value={{ onBack: goBack, onHome: goHome, breadcrumb: privacy ? "Grown-ups › Privacy" : breadcrumb(current.screen),
      name: profile ? profile.preferences?.nickname ?? codenameFor(profile.codenameId) : undefined }}>
      {visibleEntries.map((item) => <div key={item.key} data-flow-active={item.key === current.key}
        hidden={item.key !== current.key} inert={item.key !== current.key || actionFinished}>
        <SessionActivity value={item.key === current.key ? sessionActivity : null}>
          <Suspense fallback={<LearnPage title="Loading activity…" onBack={goBack}><p role="status">Getting things ready.</p></LearnPage>}>
            {renderScreen(item.screen)}
            <FocusScreenHeading active={item.key === current.key} />
          </Suspense>
        </SessionActivity>
      </div>)}
      {pendingNavigation && !finishing && <LeaveGameDialog onStay={() => setPendingNavigation(null)} onLeave={() => {
        const leave = pendingNavigation; setPendingNavigation(null); leave();
      }} />}
      {parentsOpen && sessionActive && !finishing && <ParentSessionDialog onClose={() => setParentsOpen(false)}
        onExtend={() => { timer.extend(); setParentsOpen(false); }}
        onEnd={() => { timer.end(); setParentsOpen(false); }} />}
    </ActivityNavigation>
    </SessionClockProvider>
  </ActivityXp></PrototypeFrame></SoundEnabled>;

  function renderScreen(screen: Screen) {
    const preferences = profile?.preferences ?? defaultPreferences;

    if (privacy || screen.name === "privacy") return <Privacy onBack={privacy ? undefined : goBack} />;
    if (screen.name === "plans") return <Plans onBack={goBack} />;

    function chooseProfile(codenameId: string, ageBand: AgeBand, choices: Preferences) {
      if (canStartActivity() && profile?.preferences) return;
      const updated = profile
        ? updateProfile(profile.id, codenameId, ageBand, choices)
        : saveProfile(codenameId, ageBand, choices);
      const selected = updated.profiles.find((entry) => entry.id === updated.selectedId);
      setProgress(updated);
      if (!selected) return;
      timer.start(choices.minutes);
      launchPending.current = false;
      if (ageBand !== "1-2" && choices.first === "active") {
        launch(choices.location === "car" ? "roadtrip" : "hunt", selected, choices.minutes, 3);
      } else {
        if (sound) void unlock().catch(() => {});
        setScreen({ name: "video", id: crypto.randomUUID() }, "from-home");
      }
    }

    if (!sessionActive || !profile?.preferences) {
      return <ProfileSetup key={profile?.id ?? "new"} profile={profile} profiles={progress.profiles}
        onSave={chooseProfile} onPrivacy={() => setScreen({ name: "privacy" })} />;
    }

    function startLearn(name: "quiz" | "memory" | "ask" | "tic-tac-toe" | "sketch" | "space" | "balloons") {
      if (!canStartActivity()) return;
      if (name === "sketch" && profile.ageBand !== "6-8") return;
      if (sound && name !== "space") void unlock().catch(() => {});
      if (name === "ask") {
        setScreen({ name });
        return;
      }
      const id = crypto.randomUUID();
      setScreen(name === "quiz" ? { name: "quiz", id } : { name, id });
    }

    function earn(id: string, activity: Activity, points: number) {
      if (!profile || !timer.canAcceptResult(session?.startedAt)) return;
      setProgress(rewardActivity(id, profile.id, activity, points));
      setScreen({ name: "reward", points, activity, topic: screen.name === "quiz" ? screen.topic : undefined,
        afterVideo: screen.name === "quiz" && screen.afterVideo });
    }

    function launch(mode: Mode, selected: Profile, minutes: number, roundLimit?: number) {
      if (!canStartActivity() || launchPending.current || selected.ageBand === "1-2") return;
      launchPending.current = true;
      const tasks = tasksFor(mode, selected.ageBand);
      const session: Session = { id: crypto.randomUUID(), mode, tasks, durationMinutes: minutes, roundLimit };
      if (sound) void unlock().catch(() => {});
      setScreen({ name: "mission", profile: selected, session }, roundLimit ? "from-home" : "push");
    }

    function openActivity(activity: Activity, topic?: string) {
      if (activity === "hunt" || activity === "roadtrip" || activity === "lava") setScreen({ name: "setup", mode: activity });
      else if (activity === "video" || activity === "toddler") setScreen({ name: "video", id: crypto.randomUUID() });
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
      const { session: mission, profile } = screen;
      return <Mission key={mission.id} session={mission} profile={profile} navigationPaused={pendingNavigation !== null}
        onExit={openParents} onFinish={(result) => {
        if (!timer.canAcceptResult(session?.startedAt)) return;
        const memory = result.done ? `Completed ${result.done} rounds in ${mission.mode}.` : `Played ${mission.mode}.`;
        const updated = rewardActivity(mission.id, profile.id, mission.mode, result.points, {
          mode: mission.mode, memory: result.loreNote || memory,
        });
        setProgress(updated);
        launchPending.current = false;
        setScreen({ name: "results", session: mission, result });
      }} />;
    }
    if (screen.name === "results") {
      const { mode, durationMinutes, roundLimit } = screen.session;
      const replay = () => launch(mode, profile, durationMinutes, roundLimit);
      return <MissionSummary points={screen.result.points} profile={profile} onHome={goHome} onReplay={replay}>
        {screen.session.mode === "roadtrip" && <p className="text-center text-sm text-indigo-200">Player 1: {screen.result.players[0]} · Player 2: {screen.result.players[1]}</p>}
        {nextUp(mode, replay)}
      </MissionSummary>;
    }
    if (screen.name === "toddler" && profile.ageBand === "1-2") {
      return <ToddlerMission key={screen.id} minutes={preferences.minutes} onExit={openParents}
        onComplete={(points) => earn(screen.id, "toddler", points)} />;
    }
    if (screen.name === "ask" && profile.ageBand === "6-8") {
      const topics: TopicId[] = preferences.needs?.includes("science") ? ["space", "animals"] : preferences.needs?.includes("listening") ? ["music"] : [];
      return <Ask topics={topics} onBack={goBack} onAnswer={() => {
        if (timer.canAcceptResult(session?.startedAt)) setProgress(rewardActivity(crypto.randomUUID(), profile.id, "ask", 5));
      }}
        onQuiz={(topic) => setScreen({ name: "quiz", id: crypto.randomUUID(), topic })} />;
    }
    if (screen.name === "quiz" && (profile.ageBand !== "1-2" || screen.afterVideo && screen.topic)) {
      return <Quiz key={screen.id} ageBand={profile.ageBand} topic={screen.topic}
        onBack={goBack} missionMinutes={screen.afterVideo ? preferences.minutes : undefined}
        cycle={profile.ageBand === "1-2" ? 0 : profile.activities?.quiz ?? 0}
        onExit={openParents} onComplete={(points) => earn(screen.id, "quiz", points)} />;
    }
    if (screen.name === "memory" && profile.ageBand !== "1-2") {
      return <Memory key={screen.id} pairs={profile.ageBand === "6-8" ? 8 : 4}
        onBack={goBack} onComplete={() => earn(screen.id, "memory", 20)} onReplay={() => {
          if (!canStartActivity()) {
            earn(screen.id, "memory", 20);
            return;
          }
          setProgress(rewardActivity(screen.id, profile.id, "memory", 20));
          setScreen({ name: "memory", id: crypto.randomUUID() }, "replace");
        }} />;
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
    if (screen.name === "space" && profile.ageBand === "6-8") {
      return <Space key={screen.id} exploreOnly={false} onBack={goBack}
        onComplete={(points) => earn(screen.id, "space", points)} />;
    }
    if (screen.name === "balloons" && profile.ageBand !== "1-2") {
      return <main>
        <div className="shell flow-module-header"><ActivityHeader title="Balloon Count" onBack={goBack} /></div>
        <Suspense fallback={<p className="shell learn-page" role="status">Opening Balloon Count…</p>}>
          <div className="prototype-balloons"><Balloons key={screen.id} ageGroup={profile.ageBand} onBack={goBack}
            speak={sound ? speakFallback : undefined} onComplete={(points) => earn(screen.id, "balloons", points)} /></div>
        </Suspense>
      </main>;
    }
    if (screen.name === "reward") {
      if (screen.afterVideo || screen.activity === "toddler") return <MissionSummary profile={profile} points={screen.points} onHome={goHome}
        onReplay={() => openActivity("video")}>
        {nextUp(screen.activity, () => openActivity("video"))}
      </MissionSummary>;
      return <LearnPage title="Nice work, agent!" onBack={goHome}>
        <RewardCard profile={profile} points={screen.points} />
        {nextUp(screen.activity, () => openActivity(screen.activity, screen.topic))}
      </LearnPage>;
    }
    if (screen.name === "video") {
      return <VideoCatalog ageBand={profile.ageBand} name={preferences.nickname ?? codenameFor(profile.codenameId)} onHome={goHome}
        onParents={openParents} onOpen={(video) => {
          if (canStartActivity()) setProgress(rewardActivity(`${screen.id}:${video}`, profile.id, "video", 5));
        }}
        onPlay={(videoId) => {
          if (!canStartActivity()) return;
          if (sound) void unlock().catch(() => {});
          const id = crypto.randomUUID();
          const videoTopic = videosFor(profile.ageBand).find((video) => video.id === videoId)?.quizTopic;
          setScreen(videoTopic ? { name: "quiz", id, afterVideo: true, topic: videoTopic } : profile.ageBand === "1-2" ? { name: "toddler", id } : { name: "quiz", id, afterVideo: true, topic: missionQuizTopic(profile, preferences) });
        }} />;
    }
    return <Hub profile={profile} preferences={preferences} onActivity={openActivity} onToggleSound={toggleSound}
      onParent={openParents} onPrivacy={() => setScreen({ name: "privacy" })}
      onPlans={() => setScreen({ name: "plans" })} />;
  }
}
