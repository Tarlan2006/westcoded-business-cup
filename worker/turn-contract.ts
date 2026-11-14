import type { TurnRequest, TurnResponse } from "../shared/types";

export const maxTranscriptLength = 400;

export const missionNotes = [
  "The agent recovered the signal.",
  "The agent tracked down the clues.",
  "The agent is ready for the next assignment.",
] as const;

export function safeNote(value: unknown): value is string {
  return typeof value === "string" && value.length <= 120 && (
    value === "" || missionNotes.some((note) => note === value) ||
    /^(?:Completed [0-9]{1,3} rounds in |Played )(?:hunt|roadtrip|lava)\.$/.test(value)
  );
}

function ids(value: unknown): value is string[] {
  return Array.isArray(value) && value.length > 0 && value.length <= 40 &&
    value.every((id) => typeof id === "string" && /^[a-z0-9][a-z0-9_-]{0,79}$/i.test(id));
}

function boundedInteger(value: unknown, min: number, max: number): value is number {
  return typeof value === "number" && Number.isInteger(value) && value >= min && value <= max;
}

export function isTurnRequest(value: unknown): value is TurnRequest {
  const request = value as Partial<TurnRequest> | null;
  return !!request && (
    (request.mode === "hunt" || request.mode === "roadtrip" || request.mode === "lava") &&
    (request.ageBand === "3-5" || request.ageBand === "6-8" || request.ageBand === "9-11") &&
    boundedInteger(request.round, 1, 300) && boundedInteger(request.elapsedSec, 0, 1800) &&
    ids(request.taskLineIds) && ids(request.candidatePraiseIds) && ids(request.candidateNextTaskIds) &&
    typeof request.childSaid === "string" && request.childSaid.length <= maxTranscriptLength &&
    typeof request.loreNote === "string" && request.loreNote.length <= 120
  );
}

export function isTurnSelection(value: unknown, request: TurnRequest): value is Omit<TurnResponse, "source"> {
  const result = value as Partial<TurnResponse> | null;
  return !!result && (
    typeof result.praiseLineId === "string" && request.candidatePraiseIds.includes(result.praiseLineId) &&
    typeof result.nextTaskId === "string" && request.candidateNextTaskIds.includes(result.nextTaskId) &&
    boundedInteger(result.scoreDelta, 0, 10) && safeNote(result.loreNote)
  );
}

export function fallbackTurn(request: TurnRequest): TurnResponse {
  const index = Math.max(0, request.round - 1) % request.candidatePraiseIds.length;
  return {
    praiseLineId: request.candidatePraiseIds[index] ?? "",
    nextTaskId: request.candidateNextTaskIds[0] ?? "",
    scoreDelta: 10,
    loreNote: safeNote(request.loreNote) ? request.loreNote : "",
    source: "fallback",
  };
}
