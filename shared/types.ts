export type Mode = "hunt" | "roadtrip" | "lava";
export type AgeBand = "1-2" | "3-5" | "6-8";
export type Activity = Mode | "video" | "toddler" | "quiz" | "ask" | "memory" | "tic-tac-toe" | "sketch" | "space" | "balloons";

export interface AskRequest {
  question: string;
  ageBand: AgeBand;
  topics?: string[];       // ids from shared/topics.ts, the child's favorite topics
  history?: { question: string; answer: string }[]; // last exchanges on this screen, for follow-ups
}

// What the AI filled in from a parent's quick description (POST /api/setup).
export interface SetupSuggestion {
  ageBand?: AgeBand;
  minutes?: 10 | 20 | 30;
  location?: "home" | "car";
  topics: string[];       // topic ids from shared/topics.ts
  needs?: string[];       // values from childNeeds in src/state/preferences.ts
  first?: "any" | "active" | "learn" | "watch";
  summary: string;
}

export interface AskResponse {
  answer: string;
  source: "llm" | "faq" | "refusal";
}

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
  activities?: Partial<Record<Activity, number>>;
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
