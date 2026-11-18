import { t, subscribe } from "../i18n/index";
import type { Activity } from "../../shared/types";
import quizBank from "../../content/quiz.json";
import { MODES } from "../game/content";
import { sketchGameMeta } from "../games/sketch/meta";
import { spaceGameMeta } from "../games/space/meta";
import { activeModes, type ActivityGroup, type Preferences } from "../state/preferences";
import type { ChildProfile } from "../state/progress";

export interface ActivitySuggestion { activity: Activity; title: string; description: string; icon: string; topic?: string }
function makeQuiz(): ActivitySuggestion { return { activity: "quiz", title: t("activitySuggestions.quiz"), description: t("activitySuggestions.answerFunQuestionsLetSThinkTogether"), icon: "🧠" }; }
let quiz = makeQuiz();
subscribe(() => { quiz = makeQuiz(); });
function makeMemory(): ActivitySuggestion { return { activity: "memory", title: t("activitySuggestions.memory"), description: t("activitySuggestions.turnOverTheCardsAndFindMatching"), icon: "🃏" }; }
let memory = makeMemory();
subscribe(() => { memory = makeMemory(); });
function makeAsk(): ActivitySuggestion { return { activity: "ask", title: t("activitySuggestions.ask"), description: t("activitySuggestions.askAboutSpaceAnimalsOrYourFavorite"), icon: "💬" }; }
let ask = makeAsk();
subscribe(() => { ask = makeAsk(); });
function makeVideo(): ActivitySuggestion { return { activity: "video", title: t("activitySuggestions.videoLibrary"), description: t("activitySuggestions.pickAShortVideoToWatchTogether"), icon: "▶️" }; }
let video = makeVideo();
subscribe(() => { video = makeVideo(); });
function makeBalloons(): ActivitySuggestion { return { activity: "balloons", title: t("app.balloonCount"), description: t("activitySuggestions.countTheBalloonsBeforeTimeRunsOut"), icon: "🎈" }; }
let balloons = makeBalloons();
subscribe(() => { balloons = makeBalloons(); });

export function availableActivities(profile: ChildProfile, preferences: Preferences): ActivitySuggestion[] {
  if (profile.ageBand === "1-2") return [video];
  const moves = activeModes(preferences.location).map((mode) => ({ activity: mode, title: MODES[mode].name, description: MODES[mode].description, icon: MODES[mode].icon }));
  // Space Scale's distances and big numbers suit 6–8, not 3–5.
  const older: ActivitySuggestion[] = profile.ageBand === "6-8" ? [ask, sketchGameMeta,
    { activity: "tic-tac-toe", title: t("activitySuggestions.ticTacToe"), description: t("activitySuggestions.tryThreeInARowAgainstThe"), icon: "⭐" }, spaceGameMeta] : [];
  return [quiz, memory, ...older, balloons, ...moves, video].filter(item =>
    profile.ageBand !== "6-8" || item.activity !== "balloons");
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
    if (profile.ageBand === "6-8" && (interests.includes("Space") || priorities.includes("science"))) return spaceGameMeta;
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
    return [{ ...video, title: t("activitySuggestions.watchYourVideoReward"), description: t("activitySuggestions.youUnlockedItChooseAVideoTo") }, memory];
  }
  const recommended = startingActivity(profile, preferences).activity;
  return [...options.filter((item) => item.activity === recommended), ...options.filter((item) => item.activity !== recommended)].slice(0, 2);
}
