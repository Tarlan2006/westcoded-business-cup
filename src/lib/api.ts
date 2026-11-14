import type { TurnRequest, TurnResponse } from "../../shared/types";
import { fallbackTurn, isTurnSelection, maxTranscriptLength } from "../../worker/turn-contract";

async function post(path: string, body: BodyInit, contentType: string, timeout: number): Promise<unknown> {
  const response = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": contentType },
    body,
    cache: "no-store",
    signal: AbortSignal.timeout(timeout),
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.json();
}

export async function transcribe(wav: Blob): Promise<string> {
  try {
    const result = await post("/api/stt", wav, "audio/wav", 3900) as { text?: unknown } | null;
    return typeof result?.text === "string" ? result.text.trim().slice(0, maxTranscriptLength) : "";
  } catch {
    return "";
  }
}

export async function turn(req: TurnRequest): Promise<TurnResponse> {
  const fallback = fallbackTurn(req);
  try {
    const input: TurnRequest = {
      ...req, childSaid: req.childSaid.slice(0, maxTranscriptLength), loreNote: fallback.loreNote,
    };
    const result = await post("/api/turn", JSON.stringify(input), "application/json", 3050) as Partial<TurnResponse> | null;
    if (result?.source === "llm" && isTurnSelection(result, req)) return result as TurnResponse;
  } catch {
    // The same selection is available when the Worker cannot be reached.
  }
  return fallback;
}
