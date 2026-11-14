import type { Mode } from "../../shared/types";

export type ActivityGroup = "active" | "learn" | "watch";
export const childNeeds = [
  { value: "energy", label: "Burn energy indoors" },
  { value: "screen", label: "Replace passive iPad / YouTube time" },
  { value: "listening", label: "Speech & active listening" },
  { value: "habits", label: "Healthy habits (water & teeth)" },
  { value: "science", label: "Science & logic curiosity" },
] as const;
export const childInterests = ["Dinosaurs", "Space", "Animals", "Vehicles", "Music", "Art", "Superheroes"] as const;
export type ChildNeed = typeof childNeeds[number]["value"];
export type ChildInterest = typeof childInterests[number];

export interface Preferences {
  location: "home" | "car";
  minutes: 10 | 20 | 30;
  first: ActivityGroup | "any";
  nickname?: string;
  needs?: ChildNeed[];
  interests?: ChildInterest[];
}

export const defaultPreferences: Preferences = { location: "home", minutes: 10, first: "any" };

export function readPreferences(value: unknown): Preferences | undefined {
  if (!value || typeof value !== "object") return undefined;
  const { location, minutes, first, nickname, needs, interests } = value as Partial<Preferences>;
  if ((location !== "home" && location !== "car") ||
    (minutes !== 10 && minutes !== 20 && minutes !== 30) ||
    (first !== "any" && first !== "active" && first !== "learn" && first !== "watch")) return undefined;
  return { location, minutes, first,
    nickname: typeof nickname === "string" && nickname.trim().length >= 2 && nickname.trim().length <= 12 ? nickname.trim() : undefined,
    needs: Array.isArray(needs) ? [...new Set(needs)].filter((need) => childNeeds.some((item) => item.value === need)) : [],
    interests: Array.isArray(interests) ? [...new Set(interests)].filter((item) => childInterests.includes(item)).slice(0, 3) : [],
  };
}

export function activeModes(location: Preferences["location"]): Mode[] {
  return location === "car" ? ["roadtrip"] : ["hunt", "lava"];
}
