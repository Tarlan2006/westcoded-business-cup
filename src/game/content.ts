import { contentText, t, subscribe } from "../i18n/index";
import type { AgeBand, Line, Mode } from "../../shared/types";
import localLines from "../../content/local-lines.json";

function makeMODES(): Record<Mode, { name: string; icon: string; description: string }> { return {
  hunt: { name: t("content.scavengerHunt"), icon: "🔍", description: t("content.findEverydayObjectsBeforeTimeRunsOut") },
  roadtrip: { name: t("content.roadtripSpy"), icon: "🚗", description: t("content.spotThingsThroughTheWindowTwoPlayers") },
  lava: { name: t("content.floorIsLava"), icon: "🌋", description: t("content.findASafeSpotFreezeAndSolve") },
}; }
export let MODES = makeMODES();
subscribe(() => { MODES = makeMODES(); });

export interface Task {
  id: string;
  mode: Mode;
  ageBand: AgeBand | "all";
  lineIds: string[];
  durationSec: number;
  riddle?: { choices: [string, string]; answer: string };
}

const banks = import.meta.glob<unknown>("../../content/{common,hunt,roadtrip,lava,tasks}.json", {
  eager: true,
  import: "default",
});

function bank(name: string): Record<string, unknown>[] {
  const value = banks[`../../content/${name}.json`];
  return Array.isArray(value)
    ? value.filter((row) => typeof row === "object" && row !== null)
    : [];
}

const lines = new Map<string, Line>((localLines as Line[]).map((line) => [line.id, line]));

export function lineFor(id: string): Line {
  const line = lines.get(id);
  if (!line) throw new Error(`Unknown line: ${id}`);
  return { ...line, text: contentText("voice." + id) };
}

export const modeIntro = { hunt: "local_hunt_intro", roadtrip: "local_roadtrip_intro", lava: "local_lava_intro" };
export const recallLine = { hunt: "local_hunt_recall", roadtrip: "local_roadtrip_recall", lava: "local_lava_recall" };
export const countdownLine = "local_lava_countdown";
export const outroLine = "local_outro";
export const timeUpLine = "local_time_up";
export const tryAgainLine = "local_try_again";

const localPraise = ["local_praise_found", "local_praise_radio", "local_praise_next"];
function makeLocalTasks(): Task[] { return [
  ...localLines.filter((line) => /^local_(hunt|roadtrip)_task_/.test(line.id)).map((line, i) => ({
    id: line.id.replace("_task_", "_"),
    mode: line.mode as "hunt" | "roadtrip",
    ageBand: line.ageBand as Task["ageBand"],
    lineIds: [line.id],
    durationSec: line.mode === "roadtrip" ? 45 : line.ageBand === "3-5" ? 60 : i < 6 ? 50 : 45,
  })),
  {
    id: "local_lava_freeze", mode: "lava", ageBand: "all", durationSec: 20,
    lineIds: ["local_lava_freeze_line"],
  },
  {
    id: "local_lava_riddle_1", mode: "lava", ageBand: "all", durationSec: 20,
    lineIds: ["local_lava_riddle_line_1"],
    riddle: { choices: [t("content.aTowel"), t("content.aSock")], answer: t("content.aTowel") },
  },
  {
    id: "local_lava_riddle_2", mode: "lava", ageBand: "all", durationSec: 20,
    lineIds: ["local_lava_riddle_line_2"],
    riddle: { choices: [t("content.aShoe"), t("content.aClock")], answer: t("content.aClock") },
  },
]; }
let localTasks = makeLocalTasks();
subscribe(() => { localTasks = makeLocalTasks(); });

const importedLines: Line[] = [];
for (const mode of ["common", "hunt", "roadtrip", "lava"] as const) {
  for (const row of bank(mode)) {
    if (typeof row.id !== "string" || typeof row.text !== "string" || row.voice !== "hq" ||
      row.mode !== mode || typeof row.kind !== "string") continue;
    const line = {
      ...row, ageBand: row.ageBand === "9-11" ? "6-8" : row.ageBand,
      file: typeof row.file === "string" ? row.file : "",
    } as unknown as Line;
    lines.set(line.id, line);
    importedLines.push(line);
  }
}

const importedTasks: Task[] = [];
for (const row of bank("tasks")) {
  const { id, mode, lineIds, durationSec } = row;
  const ageBand = row.ageBand === "9-11" ? "6-8" : row.ageBand;
  if (typeof id !== "string" || (mode !== "hunt" && mode !== "roadtrip" && mode !== "lava") ||
    (ageBand !== "all" && ageBand !== "3-5" && ageBand !== "6-8") ||
    !Array.isArray(lineIds) || !lineIds.length || !lineIds.every((id) => typeof id === "string" && lines.has(id))) continue;
  const defaultDuration = mode === "hunt" ? 60 : mode === "roadtrip" ? 45 : 20;
  const duration = typeof durationSec === "number" && Number.isFinite(durationSec) && durationSec > 0
    ? durationSec : defaultDuration;
  const choices: unknown = (row.riddle as Record<string, unknown> | undefined)?.choices;
  const answer: unknown = (row.riddle as Record<string, unknown> | undefined)?.answer;
  importedTasks.push({
    id, mode, ageBand, lineIds,
    durationSec: mode === "hunt" ? Math.max(45, Math.min(60, duration)) : duration,
    riddle: mode === "lava" && Array.isArray(choices) && choices.length === 2 &&
      choices.every((choice) => typeof choice === "string") && typeof answer === "string" && choices.includes(answer)
      ? { choices: [choices[0], choices[1]], answer } : undefined,
  });
}

export const codenames = [...new Set([
  ...importedLines.filter((line) => line.mode === "common" && line.kind === "codename").map((line) => line.id),
])];

export function codenameFor(id: string) {
  return codenames.includes(id) ? lineFor(id).text : t("content.agent");
}

export function praiseFor(mode: Mode, ageBand: AgeBand): string[] {
  const curated = importedLines.filter((line) =>
    line.kind === "praise" && (line.mode === mode || line.mode === "common") &&
    (!line.ageBand || line.ageBand === "all" || line.ageBand === ageBand),
  );
  return curated.length ? curated.map((line) => line.id) : localPraise;
}

export function tasksFor(mode: Mode, ageBand: AgeBand): Task[] {
  const matches = (task: Task) => task.mode === mode && (task.ageBand === "all" || task.ageBand === ageBand);
  const curated = importedTasks.filter(matches);
  if (!curated.length) return localTasks.filter(matches);
  // Keep the opening freeze after the lava countdown. Mix the remaining assignments per mission.
  const first = mode === "lava" ? 1 : 0;
  for (let index = curated.length - 1; index > first; index--) {
    const next = first + Math.floor(Math.random() * (index - first + 1));
    [curated[index], curated[next]] = [curated[next], curated[index]];
  }
  return curated;
}
