import type { Activity } from "../../shared/types";
import quizBank from "../../content/quiz.json";
import { MODES } from "../game/content";
import { sketchGameMeta } from "../games/sketch/meta";
import { spaceGameMeta } from "../games/space/meta";
import { activeModes, type ActivityGroup, type Preferences } from "../state/preferences";
import type { ChildProfile } from "../state/progress";

export interface ActivitySuggestion { activity: Activity; title: string; description: string; icon: string; topic?: string }
const quiz: ActivitySuggestion = { activity: "quiz", title: "Quiz", description: "A little question, a big discovery. Let's think together.", icon: "?" };
const memory: ActivitySuggestion = { activity: "memory", title: "Memory", description: "Turn over the cards and find matching pairs.", icon: "▦" };
const ask: ActivitySuggestion = { activity: "ask", title: "Ask Mission Control", description: "Ask about space, animals, or your favorite hero.", icon: "✦" };
const video: ActivitySuggestion = { activity: "video", title: "Video library", description: "Pick a short video to watch together.", icon: "▶" };

export function availableActivities(profile: ChildProfile, preferences: Preferences): ActivitySuggestion[] {
  if (profile.ageBand === "1-2") return [video];
  const moves = activeModes(preferences.location).map((mode) => ({ activity: mode, title: MODES[mode].name, description: MODES[mode].description, icon: MODES[mode].icon }));
  const older: ActivitySuggestion[] = profile.ageBand === "6-8" ? [ask, sketchGameMeta,
    { activity: "tic-tac-toe", title: "Tic-tac-toe", description: "Try three in a row against the computer.", icon: "×" }] : [];
  return [quiz, memory, ...older, spaceGameMeta, ...moves, video];
}

export function startingActivity(profile: ChildProfile, preferences: Preferences): ActivitySuggestion {
  if (profile.ageBand === "1-2") return video;
  const first = orderedGroups(profile, preferences)[0];
  const priorities = preferences.needs ?? [];
  const interests = preferences.interests ?? [];
  const options = availableActivities(profile, preferences);
  if (first === "watch") return video;
  if (first === "learn") {
    if (priorities.includes("habits")) {
      const habits = quizBank.find((item) => item.ageBand === profile.ageBand &&
        /\b(water to drink|drinking water|brush|teeth|healthy habits)\b/i.test(`${item.topic} ${item.question}`));
      if (habits) return { ...quiz, topic: habits.topic };
    }
    if (priorities.includes("listening")) return profile.ageBand === "6-8" ? ask : quiz;
    if (interests.includes("Animals") || interests.includes("Dinosaurs")) {
      if (quizBank.some((item) => item.ageBand === profile.ageBand && item.topic === "animals")) return { ...quiz, topic: "animals" };
    }
    if (interests.includes("Art") && profile.ageBand === "6-8") return sketchGameMeta;
    if (interests.includes("Space") || priorities.includes("science")) return spaceGameMeta;
    return profile.ageBand === "6-8" ? ask : quiz;
  }
  const mode = preferences.location === "car" ? "roadtrip" : "hunt";
  return options.find((item) => item.activity === mode) ?? quiz;
}

export function orderedGroups(profile: ChildProfile, { first, needs = [], interests = [] }: Preferences): ActivityGroup[] {
  if (profile.ageBand === "1-2") return ["watch"];
  const groups: ActivityGroup[] = ["active", "learn", "watch"];
  const hasHabitsQuiz = needs.includes("habits") && quizBank.some((item) => item.ageBand === profile.ageBand &&
    /\b(water to drink|drinking water|brush|teeth|healthy habits)\b/i.test(`${item.topic} ${item.question}`));
  const lead = first !== "any" ? first : needs.includes("energy") || needs.includes("screen") ? "active" :
    needs.includes("listening") || needs.includes("science") || hasHabitsQuiz || interests.some((item) => item !== "Music" && item !== "Vehicles") ? "learn" :
    interests.includes("Music") ? "watch" : interests.includes("Vehicles") ? "active" : profile.ageBand === "3-5" ? "learn" : "active";
  return [lead, ...groups.filter((item) => item !== lead)];
}

export function nextActivities(profile: ChildProfile, preferences: Preferences, previous: Activity): ActivitySuggestion[] {
  const options = availableActivities(profile, preferences).filter((entry) => entry.activity !== previous);
  if (profile.ageBand === "3-5" && previous === "quiz" && (profile.activities?.quiz ?? 0) > 0) {
    return [{ ...video, title: "Watch your video reward", description: "You unlocked it! Choose a video to watch together." }, memory];
  }
  const recommended = startingActivity(profile, preferences).activity;
  return [...options.filter((item) => item.activity === recommended), ...options.filter((item) => item.activity !== recommended)].slice(0, 2);
}
