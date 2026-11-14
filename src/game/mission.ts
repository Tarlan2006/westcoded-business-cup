import type { Mode, TurnRequest, TurnResponse } from "../../shared/types";
import type { Task } from "./content";

export type Player = 1 | 2;
type Phase = "countdown" | "round" | "resolving" | "feedback" | "finished";

export interface Session {
  id: string;
  mode: Mode;
  tasks: Task[];
  durationMinutes: number;
}

export interface Mission {
  phase: Phase;
  round: number;
  taskIndex: number;
  nextTaskIndex: number;
  done: number;
  points: number;
  players: [number, number];
  missionEndsAt: number;
  phaseEndsAt: number;
  phaseDuration: number;
  feedback: string;
  pausedAt: number | null;
}

type Action =
  | { type: "tick" | "pause" | "resume" | "finish"; now: number }
  | { type: "submit"; now: number; round: number }
  | { type: "resolve"; now: number; round: number; selectedTaskId: string; completed: boolean; points: number; player?: Player; feedback: string };

export const timeUp = "time-up";

export function createMission(session: Session, now: number): Mission {
  const phase = session.mode === "lava" ? "countdown" : "round";
  const phaseDuration = phase === "countdown" ? 10_000 : session.tasks[0].durationSec * 1000;
  return {
    phase, phaseDuration, round: 1, taskIndex: 0, nextTaskIndex: 0, done: 0, points: 0,
    players: [0, 0], missionEndsAt: now + session.durationMinutes * 60_000,
    phaseEndsAt: now + phaseDuration, feedback: "", pausedAt: null,
  };
}

function finish(state: Mission): Mission {
  return { ...state, phase: "finished", pausedAt: null };
}

function nextRound(state: Mission, taskIndex: number, session: Session, now: number): Mission {
  const phaseDuration = session.tasks[taskIndex].durationSec * 1000;
  return { ...state, phase: "round", taskIndex, phaseDuration, phaseEndsAt: now + phaseDuration };
}

function nextIndex(state: Mission, session: Session) {
  return (state.taskIndex + 1) % session.tasks.length;
}

export function advanceMission(state: Mission, action: Action, session: Session): Mission {
  if (state.phase === "finished") return state;
  if (action.type === "finish") return finish(state);

  if (state.pausedAt !== null) {
    if (action.type !== "resume") return state;
    const elapsed = action.now - state.pausedAt;
    return {
      ...state, pausedAt: null, missionEndsAt: state.missionEndsAt + elapsed,
      phaseEndsAt: state.phaseEndsAt + elapsed,
    };
  }

  if (action.now >= state.missionEndsAt) return finish(state);

  if (action.type === "tick") {
    if (action.now < state.phaseEndsAt) return state;
    if (state.phase === "countdown") return nextRound(state, 0, session, action.now);
    if (state.phase === "feedback") {
      return nextRound({ ...state, round: state.round + 1 }, state.nextTaskIndex, session, action.now);
    }
    if (state.phase === "round") {
      return { ...state, phase: "feedback", feedback: timeUp, phaseEndsAt: action.now + 2400, nextTaskIndex: nextIndex(state, session) };
    }
  }

  if (action.type === "pause" && state.phase !== "resolving") {
    return { ...state, pausedAt: action.now };
  }

  if (action.type === "submit" && state.phase === "round" && action.round === state.round && action.now < state.phaseEndsAt) {
    return { ...state, phase: "resolving" };
  }

  if (action.type !== "resolve" || state.phase !== "resolving" || action.round !== state.round) return state;
  const chosen = session.tasks.findIndex((task) => task.id === action.selectedTaskId);
  const players: [number, number] = [...state.players];
  if (action.player === 1) players[0] += 1;
  if (action.player === 2) players[1] += 1;
  return {
    ...state, phase: "feedback", phaseEndsAt: action.now + 2600, feedback: action.feedback,
    nextTaskIndex: chosen < 0 ? nextIndex(state, session) : chosen,
    done: state.done + Number(action.completed), points: state.points + action.points, players,
  };
}

export function selectTurn(request: TurnRequest, response?: TurnResponse): TurnResponse {
  const praiseLineId = request.candidatePraiseIds[(request.round - 1) % request.candidatePraiseIds.length];
  const fallback = {
    praiseLineId, nextTaskId: request.candidateNextTaskIds[0], scoreDelta: 10,
    loreNote: request.loreNote, source: "fallback",
  } satisfies TurnResponse;
  if (response?.source !== "llm" || !request.candidatePraiseIds.includes(response.praiseLineId) ||
    !request.candidateNextTaskIds.includes(response.nextTaskId) || !Number.isInteger(response.scoreDelta) ||
    response.scoreDelta < 0 || response.scoreDelta > 10) return fallback;
  return response;
}
