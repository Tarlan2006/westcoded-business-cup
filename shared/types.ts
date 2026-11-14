export type Mode = "hunt" | "roadtrip" | "lava";
export type AgeBand = "3-5" | "6-8" | "9-11";

export interface Line {
  id: string;            // уникальный, например "hunt_task_frame_01"
  voice: string;         // "hq" (основной голос MVP)
  mode: Mode | "common";
  kind: "intro" | "task" | "item" | "praise" | "retry" | "transition"
      | "recall" | "outro" | "codename" | "sfx";
  ageBand?: AgeBand | "all";
  text: string;          // что произносится (для генерации и субтитров)
  file: string;          // путь в /audio/...
  durationMs: number;
}

export interface Profile {
  id: string;
  codenameId: string;    // id реплики из набора codename, без реальных имён
  ageBand: AgeBand;
  xp: number;
  rank: number;          // 0..N, звание по порогам XP
  streak: number;
  lastPlayedISO: string;
  lastMode?: Mode;
  loreNote: string;      // до 120 символов, без личных данных
}

export interface TurnRequest {
  mode: Mode;
  ageBand: AgeBand;
  round: number;
  elapsedSec: number;
  taskLineIds: string[];        // что было дано в этом раунде
  childSaid: string;            // текст после распознавания, может быть пустым
  candidatePraiseIds: string[]; // из этих id модель обязана выбрать
  candidateNextTaskIds: string[];
  loreNote: string;
}

export interface TurnResponse {
  praiseLineId: string;         // обязательно из candidatePraiseIds
  nextTaskId: string;           // обязательно из candidateNextTaskIds
  scoreDelta: number;           // 0..10
  loreNote: string;             // до 120 символов
  source: "llm" | "fallback";
}
