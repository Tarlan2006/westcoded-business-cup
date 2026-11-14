import type { BleepAction, BleepMood } from "../components/Mascot";
import type { Task } from "./content";

interface Demo { demoEmoji: string; demoWord: string; prop?: string; action: BleepAction; mood: BleepMood }

export function missionDemo(task: Task, countdown: boolean): Demo {
  if (task.mode === "roadtrip") return { demoEmoji: "👀", demoWord: "SPOT!", prop: "🔍", action: "wave", mood: "detective" };
  if (task.mode === "lava") {
    return task.riddle
      ? { demoEmoji: "🌋", demoWord: "THINK!", action: "none", mood: "surprised" }
      : { demoEmoji: countdown ? "🌋" : "❄️", demoWord: countdown ? "LAVA!" : "FREEZE!", action: "none", mood: "surprised" };
  }
  if (task.id.includes("sock")) return { demoEmoji: "🧦", demoWord: "FIND!", prop: "🧦", action: "sneak", mood: "detective" };
  if (task.id.includes("book")) return { demoEmoji: "📚", demoWord: "FIND!", prop: "📚", action: "sneak", mood: "detective" };
  return { demoEmoji: "🧸", demoWord: "FIND!", prop: "🔍", action: "sneak", mood: "detective" };
}
