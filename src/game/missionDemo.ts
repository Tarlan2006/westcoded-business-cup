import type { BleepAction, BleepMood } from "../components/Mascot";
import type { Task } from "./content";

interface Demo { demoEmoji: string; demoWord: string; prop?: string; action: BleepAction; mood: BleepMood }

const huntProps: Record<string, string> = {
  sock: "🧦", pillow: "🛏️", towel: "🟪", book: "📚", yellow: "🟨", circle: "🟠", toy: "🧸",
  square: "🟦", blanket: "🛏️", shoes: "👟", blue: "🟦", red: "🟥", stripe: "🧦", zipper: "🤐",
  fold: "📄", size: "📏", colors: "🌈", number: "🔢", letter: "🔤", shapes: "🔶", pattern: "🔷",
};

export function missionDemo(task: Task, countdown: boolean): Demo {
  if (task.mode === "roadtrip") return { demoEmoji: "👀", demoWord: "SPOT!", prop: "🔍", action: "wave", mood: "detective" };
  if (task.mode === "lava") {
    return task.riddle
      ? { demoEmoji: "🌋", demoWord: "THINK!", action: "none", mood: "surprised" }
      : { demoEmoji: countdown ? "🌋" : "❄️", demoWord: countdown ? "LAVA!" : "FREEZE!", action: "none", mood: "surprised" };
  }
  const prop = huntProps[task.id.split("_")[1]];
  return { demoEmoji: prop ?? "🧸", demoWord: "FIND!", prop: prop ?? "🔍", action: "sneak", mood: "detective" };
}
