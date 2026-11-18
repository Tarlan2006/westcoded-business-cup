import { t } from "../i18n/index";
import { useMusicPause } from "../audio/useMusicPause";
import { HoldButton } from "../components/HoldButton";
import { useContext, useEffect, useLayoutEffect, useReducer, useRef, useState } from "react";
import type { Profile, TurnRequest, TurnResponse } from "../../shared/types";
import { MissionStage, missionButtonStyle, missionReplyStyle } from "../components/MissionStage";
import { SessionActivity } from "../components/SessionControls";
import { useSoundEnabled } from "../audio/sfx";
import { isSpeechActive, playSfx, preload, stopSpeech } from "../audio/engine";
import { turn } from "../lib/api";
import {
  countdownLine, lineFor, MODES, modeIntro, outroLine, praiseFor, recallLine, timeUpLine, tryAgainLine,
} from "../game/content";
import { advanceMission, createMission, selectTurn, timeUp } from "../game/mission";
import type { Mission as MissionState, Player, Session } from "../game/mission";
import { missionDemo } from "../game/missionDemo";
import { useBriefing, within } from "../game/useBriefing";
import { usePushToTalk } from "../game/usePushToTalk";
import { useWakeLock } from "../game/useWakeLock";

interface Props {
  session: Session;
  profile: Profile;
  onFinish: (state: MissionState) => void;
  onExit: () => void;
  /** Temporarily suspend play while the host confirms navigation. */
  navigationPaused?: boolean;
}

export function Mission({ session, profile, onFinish, onExit, navigationPaused = false }: Props) {
  const activity = useContext(SessionActivity);
  const [state, dispatch] = useReducer(
    (current: MissionState, action: Parameters<typeof advanceMission>[1]) => {
      // The last round can resolve during the session's grace period.
      const withinGrace = activity && action.now >= activity.endsAt && action.now < activity.finishBy &&
        (action.type === "submit" || action.type === "resolve");
      const round = withinGrace ? { ...current, missionEndsAt: Math.max(current.missionEndsAt, activity.finishBy) } : current;
      return advanceMission(round, action, session);
    },
    session, (session) => createMission(session, Date.now()),
  );
  const [now, setNow] = useState(Date.now);
  const submittedRound = useRef(0);
  const delivered = useRef(false);
  const sound = useSoundEnabled();
  const navigationOwnsPause = useRef(false);
  const paused = navigationPaused || state.pausedAt !== null;
  const finished = state.phase === "finished";
  const task = session.tasks[state.taskIndex];
  const isHunt = session.mode === "hunt";
  const isRoadtrip = session.mode === "roadtrip";
  const remainingMs = Math.max(0, Math.min(state.phaseEndsAt, state.missionEndsAt) - (state.pausedAt ?? now));
  const remainingSeconds = Math.ceil(remainingMs / 1000);
  const missionSeconds = Math.max(0, Math.ceil((state.missionEndsAt - (state.pausedAt ?? now)) / 1000));
  const running = state.phase === "round" && !paused;
  const freezeHold = session.mode === "lava" && !task.riddle && state.phaseEndsAt - now > state.phaseDuration - 5000;
  const choices = task.riddle;

  useLayoutEffect(() => {
    if (navigationPaused) {
      if (state.pausedAt === null && state.phase !== "resolving" && !finished) {
        navigationOwnsPause.current = true;
        dispatch({ type: "pause", now: Date.now() });
      }
    } else if (navigationOwnsPause.current) {
      // Only undo our own pause. A manually paused mission stays paused.
      navigationOwnsPause.current = false;
      const now = Date.now();
      setNow(now);
      dispatch({ type: "resume", now });
    }
  }, [navigationPaused, state.pausedAt, state.phase, finished]);

  useEffect(() => {
    if (finished || (paused && !activity?.finishing)) return;
    const tick = () => {
      const now = Date.now();
      setNow(now);
      if (activity && !activity.canStartActivity()) {
        const roundDone = paused || state.phase === "countdown" || (state.phase !== "resolving" && now >= state.phaseEndsAt);
        if (roundDone && !isSpeechActive()) dispatch({ type: "finish", now });
        return;
      }
      dispatch({ type: "tick", now });
    };
    const timer = window.setInterval(tick, 125);
    document.addEventListener("visibilitychange", tick);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", tick);
    };
  }, [paused, finished, activity, state.phase, state.phaseEndsAt]);

  useEffect(() => {
    if (sound) playSfx(session.mode === "lava" ? "siren" : "radio");
  }, [session.mode, sound]);

  useEffect(() => {
    const ids = [
      modeIntro[session.mode], outroLine, timeUpLine, tryAgainLine,
      ...(profile.lastMode ? [recallLine[profile.lastMode]] : []),
      ...(session.mode === "lava" ? [countdownLine] : []),
      ...praiseFor(session.mode, profile.ageBand),
      ...session.tasks.flatMap((task) => task.lineIds),
    ];
    if (sound) void preload(ids.filter((id) => lineFor(id).file));
  }, [sound, session, profile.ageBand, profile.lastMode]);

  useEffect(() => {
    if (finished && !delivered.current) {
      delivered.current = true;
      onFinish(state);
    }
  }, [finished, onFinish, state]);

  useWakeLock(!paused && !finished);

  async function submit(childSaid = "", player?: Player, answer?: string) {
    const now = Date.now();
    const missionEnd = activity && !activity.canStartActivity() ? activity.finishBy : state.missionEndsAt;
    if (!running || now >= Math.min(state.phaseEndsAt, missionEnd) ||
      freezeHold || submittedRound.current === state.round) return;
    submittedRound.current = state.round;
    dispatch({ type: "submit", round: state.round, now });
    const orderedCandidates = [
      ...session.tasks.slice(state.taskIndex + 1), ...session.tasks.slice(0, state.taskIndex),
    ];
    const request: TurnRequest = {
      mode: session.mode, ageBand: profile.ageBand, round: state.round,
      elapsedSec: Math.max(0, Math.floor((now - (state.phaseEndsAt - state.phaseDuration)) / 1000)),
      taskLineIds: task.lineIds, childSaid,
      candidatePraiseIds: praiseFor(session.mode, profile.ageBand),
      candidateNextTaskIds: (orderedCandidates.length ? orderedCandidates : [task]).slice(0, 4).map((option) => option.id),
      loreNote: state.loreNote || profile.loreNote,
    };
    let response: TurnResponse | undefined;
    if (isHunt) {
      try {
        response = await within(turn(request), 3100, undefined);
      } catch {
        // Choose from the same task bank when the API is unavailable.
      }
    }
    const result = selectTurn(request, response);
    const correct = !choices || choices.answer === answer;
    dispatch({
      type: "resolve", now: Date.now(), round: state.round, selectedTaskId: result.nextTaskId,
      completed: correct, points: correct ? result.scoreDelta : 0, player,
      feedback: correct ? result.praiseLineId : tryAgainLine,
      loreNote: result.source === "llm" ? result.loreNote : undefined,
    });
  }

  const voice = usePushToTalk(running && isHunt, (text) => { void submit(text); });
  const isFeedback = state.phase === "feedback";
  const briefing = state.phase === "countdown" ? [countdownLine] : isFeedback
    ? [state.feedback === timeUp ? timeUpLine : state.feedback]
    : state.phase === "round"
      ? [...(state.round === 1 ? [
        ...(profile.lastMode ? [recallLine[profile.lastMode]] : []),
        modeIntro[session.mode],
      ] : []), ...task.lineIds]
      : [];
  // Timed cues play their recordings at once instead of waiting for the live voice.
  const timedCue = state.phase === "countdown" || isFeedback;
  const { caption, speaking } = useBriefing(briefing, !sound || paused || voice.status !== "idle", timedCue);
  const assignment = task.lineIds.map((id) => lineFor(id).text).join(" ");
  const progress = isFeedback || state.phase === "resolving" ? 0 : remainingMs / state.phaseDuration;
  const recording = voice.status === "opening" || voice.status === "recording";
  const tickedAt = useRef<number>(0);
  useEffect(() => {
    if (!sound || !running || voice.status !== "idle" || remainingSeconds < 1 || remainingSeconds > 5) return;
    const mark = state.round * 10 + remainingSeconds;
    if (tickedAt.current !== mark) { tickedAt.current = mark; playSfx("tick"); }
  }, [sound, running, voice.status, remainingSeconds, state.round]);

  useMusicPause(paused || finished);

  function togglePause() {
    voice.release(true);
    const now = Date.now();
    setNow(now);
    dispatch({ type: paused ? "resume" : "pause", now });
  }

  function startVoice() {
    if (voice.status !== "idle" || (activity && !activity.canStartActivity())) return;
    stopSpeech();
    voice.start();
  }

  function completeWithButton(player?: Player, answer?: string) {
    voice.release(true);
    void submit("", player, answer);
  }

  const demo = missionDemo(task, state.phase === "countdown");
  const doneButton = `${missionButtonStyle} btn-mint text-[#062C1E]`;
  const quickReplies = choices ? choices.choices.map((answer) => <button type="button" key={answer} className={missionReplyStyle}
    disabled={!running} onClick={() => completeWithButton(undefined, answer)}>{answer}</button>) : isHunt
    ? <button type="button" className={missionReplyStyle} disabled={!running} onClick={() => completeWithButton()}>{t("mission.foundIt")}</button> : undefined;

  return <MissionStage heading={MODES[session.mode].name} round={state.round} seconds={remainingSeconds} clockSeconds={missionSeconds} ratio={progress}
    {...demo} mood={recording ? "listening" : isFeedback ? state.feedback === timeUp ? "surprised" : "excited" : demo.mood}
    action={isFeedback ? "clap" : demo.action} speaking={speaking} paused={paused} feedback={isFeedback && state.feedback !== timeUp}
    onExit={onExit} exitDisabled={state.phase === "resolving"}
    toolbar={<button type="button" className="prototype-parent-button" disabled={state.phase === "resolving"} onClick={togglePause}>{paused ? t("mission.resume") : t("mission.pause")}</button>}
    prompt={paused ? t("mission.readyWhenYouAre") : state.phase === "resolving" ? t("mission.isCheckingIn") : running ? assignment : caption || assignment}
    replies={!paused && state.phase === "round" ? quickReplies : undefined}
    status={isHunt && !paused ? voice.message : isRoadtrip ? t("mission.player1Player2", { value1: state.players[0], value2: state.players[1] }) : undefined}
    controls={paused ? <>
      <button type="button" className={doneButton} onClick={togglePause}>{t("mission.resumeMission")}</button>
      <button type="button" className={`${missionButtonStyle} btn-purple text-white`} onClick={() => dispatch({ type: "finish", now: Date.now() })}>{t("mission.endMission")}</button>
    </> : isRoadtrip ? ([1, 2] as const).map((player) => <button key={player} type="button"
      className={player === 1 ? doneButton : `${missionButtonStyle} btn-sky text-white`}
      disabled={!running} onClick={() => completeWithButton(player)}>{t("mission.playerSpottedIt", { player })}</button>) : <>
      <button type="button" className={`${doneButton}${isHunt ? "" : " col-span-2"}`}
        disabled={!running || freezeHold || !!choices} onClick={() => completeWithButton()}><span aria-hidden="true">✅</span> {t("mission.iDidIt")}</button>
      {isHunt && <HoldButton talk hintKey="hunt-talk" className={`${missionButtonStyle} btn-sky text-white talk-button`}
        disabled={!running || voice.status === "decoding" || (activity?.finishing && !recording)} onBegin={startVoice}
        onRelease={() => voice.release()} onCancel={voice.cancelHold}>
        <span aria-hidden="true">🎙️</span><span>{recording ? voice.status === "opening" ? t("ask.openingMic") : t("holdButton.letGoToSend")
          : voice.status === "decoding" ? t("ask.listening") : t("mission.talk")}</span>
      </HoldButton>}
    </>} />;
}
