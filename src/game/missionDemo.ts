import { t } from "../i18n/index";
import type { MascotAction, MascotMood } from "../components/Mascot";
import type { Task } from "./content";

interface Demo { demoEmoji: string; demoWord: string; prop?: string; action: MascotAction; mood: MascotMood }

const huntProps: Record<string, string> = {
  sock: "🧦", pillow: "🛏️", towel: "🟪", book: "📚", yellow: "🟨", circle: "🟠", toy: "🧸",
  square: "🟦", blanket: "🛏️", shoes: "👟", blue: "🟦", red: "🟥", stripe: "🧦", zipper: "🤐",
  fold: "📄", size: "📏", colors: "🌈", number: "🔢", letter: "🔤", shapes: "🔶", pattern: "🔷",
};

export function missionDemo(task: Task, countdown: boolean): Demo {
  if (task.mode === "roadtrip") return { demoEmoji: "👀", demoWord: t("missionDemo.spot"), prop: "🔍", action: "wave", mood: "detective" };
  if (task.mode === "lava") {
    return task.riddle
      ? { demoEmoji: "🌋", demoWord: t("missionDemo.think"), action: "none", mood: "surprised" }
      : { demoEmoji: countdown ? "🌋" : "❄️", demoWord: countdown ? t("missionDemo.lava") : t("missionDemo.freeze"), action: "none", mood: "surprised" };
  }
  const prop = huntProps[task.id.split("_")[1]];
  return { demoEmoji: prop ?? "🧸", demoWord: t("missionDemo.find"), prop: prop ?? "🔍", action: "sneak", mood: "detective" };
}
