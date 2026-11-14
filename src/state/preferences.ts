import type { Mode } from "../../shared/types";

export type ActivityGroup = "active" | "learn" | "watch";
export const childNeeds = [
  { value: "energy", label: "Get energy out indoors" },
  { value: "screen", label: "Less passive screen time" },
  { value: "listening", label: "Talking and listening" },
  { value: "habits", label: "Healthy habits (water, teeth)" },
  { value: "science", label: "Science and curiosity" },
] as const;
export const childInterests = ["Dinosaurs", "Space", "Animals", "Vehicles", "Music", "Art", "Superheroes"] as const;
export type ChildNeed = typeof childNeeds[number]["value"];
export type ChildInterest = typeof childInterests[number];
export const quietTimeGoals = [20, 30, 60] as const;

export interface Preferences {
  location: "home" | "car";
  minutes: number;
  first: ActivityGroup | "any";
  nickname?: string;
  notes?: string;
  needs?: ChildNeed[];
  interests?: ChildInterest[];
}

export const defaultPreferences: Preferences = { location: "home", minutes: 20, first: "learn" };

export function readPreferences(value: unknown): Preferences | undefined {
  if (!value || typeof value !== "object") return undefined;
  const { location, minutes, first, nickname, notes, needs, interests } = value as Partial<Preferences>;
  if ((location !== "home" && location !== "car") ||
    (typeof minutes !== "number" || !Number.isInteger(minutes) || minutes < 1 || minutes > 120) ||
    (first !== "any" && first !== "active" && first !== "learn" && first !== "watch")) return undefined;
  return { location, minutes, first,
    nickname: typeof nickname === "string" ? nickname.trim().slice(0, 24) || undefined : undefined,
    notes: typeof notes === "string" ? notes.trim().slice(0, 600) || undefined : undefined,
    needs: Array.isArray(needs) ? [...new Set(needs)].filter((need) => childNeeds.some((item) => item.value === need)) : [],
    interests: Array.isArray(interests) ? [...new Set(interests)].filter((item) => childInterests.includes(item)).slice(0, 3) : [],
  };
}

export function activeModes(location: Preferences["location"]): Mode[] {
  return location === "car" ? ["roadtrip"] : ["hunt", "lava"];
}
