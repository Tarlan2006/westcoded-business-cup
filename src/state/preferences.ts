import type { Mode } from "../../shared/types";

export type ActivityGroup = "active" | "learn" | "watch";

export interface Preferences {
  location: "home" | "car";
  minutes: 10 | 20 | 30;
  first: ActivityGroup | "any";
}

export const defaultPreferences: Preferences = { location: "home", minutes: 10, first: "any" };

export function readPreferences(value: unknown): Preferences | undefined {
  if (!value || typeof value !== "object") return undefined;
  const { location, minutes, first } = value as Partial<Preferences>;
  if ((location !== "home" && location !== "car") ||
    (minutes !== 10 && minutes !== 20 && minutes !== 30) ||
    (first !== "any" && first !== "active" && first !== "learn" && first !== "watch")) return undefined;
  return { location, minutes, first };
}

export function activeModes(location: Preferences["location"]): Mode[] {
  return location === "car" ? ["roadtrip"] : ["hunt", "lava"];
}
