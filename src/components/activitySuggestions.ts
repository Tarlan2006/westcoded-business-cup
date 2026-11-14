import type { Activity } from "../../shared/types";
import { MODES } from "../game/content";
import { sketchGameMeta } from "../games/sketch/meta";
import { activeModes, type Preferences } from "../state/preferences";
import type { ChildProfile } from "../state/progress";

export interface ActivitySuggestion { activity: Activity; title: string; description: string; icon: string }
const quiz: ActivitySuggestion = { activity: "quiz", title: "Quiz", description: "A little question, a big discovery. Let's think together.", icon: "?" };
const memory: ActivitySuggestion = { activity: "memory", title: "Memory", description: "Turn over the cards and find matching pairs.", icon: "▦" };
const ask: ActivitySuggestion = { activity: "ask", title: "Ask Mission Control", description: "Start with a question about science or nature.", icon: "✦" };
const video: ActivitySuggestion = { activity: "video", title: "Video library", description: "Pick a short video to watch together.", icon: "▶" };

export function availableActivities(profile: ChildProfile, preferences: Preferences): ActivitySuggestion[] {
  if (profile.ageBand === "1-2") return [video];
  const moves = activeModes(preferences.location).map((mode) => ({ activity: mode, title: MODES[mode].name, description: MODES[mode].description, icon: MODES[mode].icon }));
  const older: ActivitySuggestion[] = profile.ageBand === "6-8" ? [ask, sketchGameMeta,
    { activity: "tic-tac-toe", title: "Tic-tac-toe", description: "Try three in a row against the computer.", icon: "×" }] : [];
  const unlocked = profile.ageBand !== "3-5" || (profile.activities?.quiz ?? 0) > 0;
  return [quiz, memory, ...older, ...moves, ...(unlocked ? [video] : [])];
}

export function startingActivity(profile: ChildProfile, preferences: Preferences): ActivitySuggestion {
  if (profile.ageBand === "1-2") return video;
  if (preferences.first === "watch") {
    return profile.ageBand === "3-5" && !(profile.activities?.quiz ?? 0)
      ? { ...quiz, description: "Finish a quiz to unlock a video to watch together." } : video;
  }
  if (preferences.first === "learn") return profile.ageBand === "6-8" ? ask : quiz;
  if (preferences.first === "any" && profile.ageBand === "3-5") return quiz;
  const mode = preferences.location === "car" ? "roadtrip" : "hunt";
  return { activity: mode, title: MODES[mode].name, description: MODES[mode].description, icon: MODES[mode].icon };
}

export function nextActivities(profile: ChildProfile, preferences: Preferences, previous: Activity): ActivitySuggestion[] {
  const options = availableActivities(profile, preferences).filter((entry) => entry.activity !== previous);
  if (profile.ageBand === "3-5" && previous === "quiz" && (profile.activities?.quiz ?? 0) > 0) {
    return [{ ...video, title: "Watch your video reward", description: "You unlocked it! Choose a video to watch together." }, memory];
  }
  return options.slice(0, 2);
}
