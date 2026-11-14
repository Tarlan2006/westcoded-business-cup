import { useEffect, useReducer, useRef, useState } from "react";
import type { Profile, TurnRequest, TurnResponse } from "../../shared/types";
import { ActivityHeader } from "../components/ActivityHeader";
import { Mascot } from "../components/Mascot";
import { onVolumeChange, playSfx, preload, setMusic, stopSpeech } from "../audio/engine";
import { turn } from "../lib/api";
import {
  countdownLine, lineFor, MODES, modeIntro, outroLine, praiseFor, recallLine, timeUpLine, tryAgainLine,
} from "../game/content";
import { advanceMission, createMission, selectTurn, timeUp } from "../game/mission";
import type { Mission as MissionState, Player, Session } from "../game/mission";
import { useBriefing, within } from "../game/useBriefing";
import { usePushToTalk } from "../game/usePushToTalk";
import { useWakeLock } from "../game/useWakeLock";
import { rankName } from "../state/progress";

function clock(seconds: number) {
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}

interface Props {
  session: Session;
  profile: Profile;
  onFinish: (state: MissionState) => void;
}

export function Mission({ session, profile, onFinish }: Props) {
  const [state, dispatch] = useReducer(
    (current: MissionState, action: Parameters<typeof advanceMission>[1]) => advanceMission(current, action, session),
    session, (session) => createMission(session, Date.now()),
  );
  const [now, setNow] = useState(Date.now);
  const submittedRound = useRef(0);
  const delivered = useRef(false);
  const avatar = useRef<HTMLDivElement>(null);
  const paused = state.pausedAt !== null;
  const finished = state.phase === "finished";
  const task = session.tasks[state.taskIndex];
  const isHunt = session.mode === "hunt";
  const isRoadtrip = session.mode === "roadtrip";
  const remainingMs = Math.max(0, Math.min(state.phaseEndsAt, state.missionEndsAt) - (state.pausedAt ?? now));
  const remainingSeconds = Math.ceil(remainingMs / 1000);
  const missionSeconds = Math.max(0, Math.ceil((state.missionEndsAt - (state.pausedAt ?? now)) / 1000));
  const running = state.phase === "round" && !paused;
  const freezeHold = task.id === "local_lava_freeze" && state.phaseEndsAt - now > state.phaseDuration - 5000;
  const choices = task.riddle;

  useEffect(() => {
    if (paused || finished) return;
    const tick = () => {
      const now = Date.now();
      setNow(now);
      dispatch({ type: "tick", now });
    };
    const timer = window.setInterval(tick, 125);
    document.addEventListener("visibilitychange", tick);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", tick);
    };
  }, [paused, finished]);

  useEffect(() => {
    if (session.mode === "lava") playSfx("siren");
    else playSfx("radio");
  }, [session.mode]);

  useEffect(() => {
    const ids = [
      modeIntro[session.mode], outroLine, timeUpLine, tryAgainLine,
      ...(profile.lastMode ? [recallLine[profile.lastMode]] : []),
      ...(session.mode === "lava" ? [countdownLine] : []),
      ...praiseFor(session.mode, profile.ageBand),
      ...session.tasks.flatMap((task) => task.lineIds),
    ];
    void preload(ids.filter((id) => lineFor(id).file));
  }, [session, profile.ageBand, profile.lastMode]);

  useEffect(() => onVolumeChange((volume) => {
    avatar.current?.style.setProperty("--voice-level", String(volume));
  }), []);

  useEffect(() => {
    if (finished && !delivered.current) {
      delivered.current = true;
      onFinish(state);
    }
  }, [finished, onFinish, state]);

  useWakeLock(!paused && !finished);

  async function submit(childSaid = "", player?: Player, answer?: string) {
    const now = Date.now();
    if (!running || now >= Math.min(state.phaseEndsAt, state.missionEndsAt) ||
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
  const { caption, speaking } = useBriefing(briefing, paused || voice.status !== "idle");
  const assignment = task.lineIds.map((id) => lineFor(id).text).join(" ");
  const progress = isFeedback || state.phase === "resolving" ? 0 : remainingMs / state.phaseDuration;
  const recording = voice.status === "opening" || voice.status === "recording";

  useEffect(() => {
    setMusic(!paused && !finished && voice.status === "idle", { duck: true });
    return () => setMusic(false);
  }, [paused, finished, voice.status]);

  function togglePause() {
    voice.release(true);
    const now = Date.now();
    setNow(now);
    dispatch({ type: paused ? "resume" : "pause", now });
  }

  function startVoice() {
    if (voice.status !== "idle") return;
    stopSpeech();
    voice.start();
  }

  function completeWithButton(player?: Player, answer?: string) {
    voice.release(true);
    void submit("", player, answer);
  }

  return (
    <main className="shell mission-shell">
      <ActivityHeader title={MODES[session.mode].name} xp={profile.xp + state.points}
        backDisabled={state.phase === "resolving"}
        onBack={paused ? () => dispatch({ type: "finish", now: Date.now() }) : togglePause}>
        <button type="button" className="quiet-button" disabled={state.phase === "resolving"} onClick={togglePause}>
          {paused ? "Resume" : "Pause"}
        </button>
      </ActivityHeader>
      <section className="mission-console" aria-label="Mission">
        <div className="mission-stats">
          <span>Round <strong>{state.round}</strong></span>
          <span>Mission <strong>{clock(missionSeconds)}</strong></span>
          {isRoadtrip && <span>Score <strong>{state.players.join(" : ")}</strong></span>}
        </div>
        <div className="timer" data-warm={running && remainingSeconds <= 10}
          style={{ "--remaining": `${progress * 100}%` } as React.CSSProperties}>
          <div className="timer-center">
            <div ref={avatar} className={speaking ? "avatar speaking" : "avatar"} aria-hidden="true"><i /><i /><i /><i /><i /></div>
            <span className="timer-value">{paused ? "Ⅱ" : isFeedback ? "✦" : clock(remainingSeconds)}</span>
            <span className="timer-label">{paused ? "Paused" : state.phase === "countdown" ? "Get to safety"
              : isFeedback ? "Next up" : state.phase === "resolving" ? "Checking" : "Round time"}</span>
          </div>
        </div>
        <div className="caption" aria-live="polite">
          {paused ? "Ready when you are." : state.phase === "resolving" ? "Mission Control is checking in…" : caption}
        </div>
        {running && caption !== assignment && (
          <p className="assignment">{assignment}</p>
        )}
        {paused ? (
          <div className="mission-actions">
            <button type="button" className="primary-button" onClick={() => {
              const now = Date.now();
              setNow(now);
              dispatch({ type: "resume", now });
            }}>Resume mission</button>
            <button type="button" className="secondary-button" onClick={() => dispatch({ type: "finish", now: Date.now() })}>End mission</button>
          </div>
        ) : (
          <div className="mission-actions">
            {isRoadtrip ? ([1, 2] as const).map((player) => (
              <button key={player} type="button" className={player === 1 ? "primary-button" : "secondary-button"}
                disabled={!running} onClick={() => completeWithButton(player)}>Player {player} spotted it!</button>
            )) : choices ? choices.choices.map((answer) => (
              <button type="button" key={answer} className="secondary-button"
                disabled={!running} onClick={() => completeWithButton(undefined, answer)}>{answer}</button>
            )) : (
              <button type="button" className="primary-button"
                disabled={!running || freezeHold} onClick={() => completeWithButton()}>I DID IT!</button>
            )}
            {isHunt && (
              <button type="button" className="secondary-button talk-button" disabled={!running || voice.status === "decoding"}
                onPointerDown={(event) => {
                  if (!event.isPrimary || event.button !== 0) return;
                  event.currentTarget.setPointerCapture(event.pointerId);
                  startVoice();
                }}
                onPointerUp={() => voice.release()}
                onPointerCancel={() => voice.release(true)}
                onLostPointerCapture={() => voice.release()}
                onContextMenu={(event) => event.preventDefault()}
                onKeyDown={(event) => {
                  if (event.key !== " " && event.key !== "Enter") return;
                  event.preventDefault();
                  if (!event.repeat) startVoice();
                }}
                onKeyUp={(event) => {
                  if (event.key === " " || event.key === "Enter") voice.release();
                }}
                onBlur={() => voice.release(true)}>
                {recording ? voice.status === "opening" ? "Opening mic…" : "Release to send"
                  : voice.status === "decoding" ? "Listening…" : "HOLD TO TALK"}
              </button>
            )}
          </div>
        )}
        {voice.message && isHunt && !paused && <p className="voice-message" role="status">{voice.message}</p>}
      </section>
    </main>
  );
}

export function Results({ state, profile, session, onBack }: {
  state: MissionState; profile: Profile; session: Session; onBack: () => void;
}) {
  useEffect(() => {
    playSfx("fanfare");
  }, []);
  const { caption } = useBriefing([outroLine], false);
  return (
    <main className="shell narrow-shell">
      <ActivityHeader title={MODES[session.mode].name} xp={profile.xp} onBack={onBack} />
      <section className="panel results">
        <Mascot mood="happy" />
        <h1>Mission <em>complete.</em></h1>
        <p>{rankName(profile.rank)} · {caption}</p>
        <dl className="result-stats">
          <div><dt>Completed rounds</dt><dd>{state.done}</dd></div>
          <div><dt>XP earned</dt><dd>+{state.points}</dd></div>
          <div><dt>Total XP</dt><dd>{profile.xp}</dd></div>
          <div><dt>Day streak</dt><dd>{profile.streak}</dd></div>
        </dl>
        {session.mode === "roadtrip" && <p>Player 1: {state.players[0]} · Player 2: {state.players[1]}</p>}
        <button type="button" className="primary-button" onClick={onBack}>Back to activities <span aria-hidden="true">↗</span></button>
      </section>
    </main>
  );
}
