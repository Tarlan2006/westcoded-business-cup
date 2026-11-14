import type { TurnRequest, TurnResponse } from "../../shared/types";

export async function transcribe(wav: Blob): Promise<string> {
  return "";
}

export async function turn(req: TurnRequest): Promise<TurnResponse> {
  return {
    praiseLineId: req.candidatePraiseIds[0] ?? "",
    nextTaskId: req.candidateNextTaskIds[0] ?? "",
    scoreDelta: 0,
    loreNote: req.loreNote.slice(0, 120),
    source: "fallback",
  };
}
