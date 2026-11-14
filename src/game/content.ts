import type { AgeBand, Line, Mode } from "../../shared/types";

export const MODES: Record<Mode, { name: string; icon: string; description: string }> = {
  hunt: { name: "Scavenger Hunt", icon: "⌕", description: "Find everyday objects before time runs out." },
  roadtrip: { name: "Roadtrip Spy", icon: "◉", description: "Spot things through the window. Two players." },
  lava: { name: "Floor is Lava", icon: "▲", description: "Find a safe spot, freeze, and solve riddles." },
};

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

const lines = new Map<string, Line>();

function localLine(id: string, text: string, kind: Line["kind"], mode: Line["mode"] = "common") {
  lines.set(id, { id, text, kind, mode, voice: "hq", file: "", durationMs: 0 });
  return id;
}

export function lineFor(id: string): Line {
  const line = lines.get(id);
  if (!line) throw new Error(`Unknown line: ${id}`);
  return line;
}

const names = ["Comet", "Echo", "Fox", "Nova", "Scout", "Sparrow", "Orbit", "Pixel", "Radar", "Sunny", "Raven", "Dash"];
const localCodenames = names.map((name) => localLine(`codename_${name.toLowerCase()}`, name, "codename"));

export const modeIntro = {
  hunt: localLine("local_hunt_intro", "Agent, your mission is to find objects nearby. Walk and watch your step.", "intro", "hunt"),
  roadtrip: localLine("local_roadtrip_intro", "Agents, stay buckled and spy through your windows.", "intro", "roadtrip"),
  lava: localLine("local_lava_intro", "Walk to your safe spot. Keep both feet on the floor.", "intro", "lava"),
};

export const recallLine = {
  hunt: localLine("local_hunt_recall", "Last time, you tracked down objects for Mission Control.", "recall", "hunt"),
  roadtrip: localLine("local_roadtrip_recall", "Last time, you spotted clues on the road.", "recall", "roadtrip"),
  lava: localLine("local_lava_recall", "Last time, you stayed cool when the floor got hot.", "recall", "lava"),
};

export const countdownLine = localLine("local_lava_countdown", "Lava alert! Walk to your safe spot. You have ten seconds.", "task", "lava");
export const outroLine = localLine("local_outro", "Mission complete. Great work, agents!", "outro");
export const timeUpLine = localLine("local_time_up", "Time’s up. Let’s try a new assignment.", "transition");
export const tryAgainLine = localLine("local_try_again", "Good try, agent. On to the next assignment.", "retry");

const localPraise = [
  localLine("local_praise_found", "Nicely spotted, agent!", "praise"),
  localLine("local_praise_radio", "Mission Control copies. Great work!", "praise"),
  localLine("local_praise_next", "Well done, agent. Ready for the next one?", "praise"),
];

const huntPrompts = [
  ["Find a sock and a soft toy. Walk back to Mission Control.", "3-5"],
  ["Find a pillow and something blue. Walk, agent!", "3-5"],
  ["Find a towel and a paper napkin. Walk back to base.", "3-5"],
  ["Find a book, a sock, and a cushion. Bring them one at a time.", "6-8"],
  ["Find something soft, something red, and something round. Walk back to base.", "6-8"],
  ["Find a paper napkin, a pencil, and a towel. Walk back to base.", "6-8"],
  ["Find two soft objects of different colors. Describe them without showing them.", "6-8"],
  ["Find a book, something striped, and something with a zipper. Walk back to base.", "6-8"],
  ["Find something round, something square, and something blue. Walk back to base.", "6-8"],
] as const;

const roadtripPrompts = [
  "Spot a red car through the window. Keep your seat belt on.",
  "Who can spot a yellow sign first?",
  "Look for a white truck.",
  "Find a tree taller than the cars.",
  "Spot a blue sign through your window.",
  "Who can spot a bridge first?",
];

const localTasks: Task[] = [
  ...huntPrompts.map(([prompt, ageBand], i) => ({
    id: `local_hunt_${i}`, mode: "hunt" as const, ageBand,
    lineIds: [localLine(`local_hunt_task_${i}`, prompt, "task", "hunt")],
    durationSec: ageBand === "3-5" ? 60 : i < 6 ? 50 : 45,
  })),
  ...roadtripPrompts.map((prompt, i) => ({
    id: `local_roadtrip_${i}`, mode: "roadtrip" as const, ageBand: "all" as const,
    lineIds: [localLine(`local_roadtrip_task_${i}`, prompt, "task", "roadtrip")], durationSec: 45,
  })),
  {
    id: "local_lava_freeze", mode: "lava", ageBand: "all", durationSec: 20,
    lineIds: [localLine("local_lava_freeze_line", "Freeze like a statue for five seconds. Then tap I DID IT!", "task", "lava")],
  },
  {
    id: "local_lava_riddle_1", mode: "lava", ageBand: "all", durationSec: 20,
    lineIds: [localLine("local_lava_riddle_line_1", "What gets wetter while it dries you?", "task", "lava")],
    riddle: { choices: ["A towel", "A sock"], answer: "A towel" },
  },
  {
    id: "local_lava_riddle_2", mode: "lava", ageBand: "all", durationSec: 20,
    lineIds: [localLine("local_lava_riddle_line_2", "What has hands and tells the time?", "task", "lava")],
    riddle: { choices: ["A shoe", "A clock"], answer: "A clock" },
  },
];

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
  ...localCodenames,
])];

export function codenameFor(id: string) {
  return codenames.includes(id) ? lineFor(id).text : "Agent";
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
  return curated.length ? curated : localTasks.filter(matches);
}
