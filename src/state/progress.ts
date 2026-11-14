import type { Activity, AgeBand, Mode, Profile } from "../../shared/types";
import { readPreferences, type Preferences } from "./preferences";

const storageKey = "mission-control.progress";
const rankThresholds = [0, 30, 100, 250, 500];
const ranks = ["Recruit", "Scout", "Field Agent", "Special Agent", "Commander"];

export interface ChildProfile extends Profile {
  preferences?: Preferences;
  garageSessions?: number;
  recentSessions?: string[];
}

interface Progress {
  profiles: ChildProfile[];
  selectedId?: string;
  lastFinished?: string;
}

let cached: Progress = { profiles: [] };

function localDay(date: Date) {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

export function readProgress(): Progress {
  try {
    const raw = localStorage.getItem(storageKey);
    if (!raw) return cached;
    const progress = JSON.parse(raw) as Progress | null;
    if (Array.isArray(progress?.profiles)) {
      const { profiles, selectedId, lastFinished } = progress;
      const migrated = profiles.flatMap((profile) => {
        if (!profile || typeof profile.id !== "string" || typeof profile.codenameId !== "string") return [];
        const age = profile.ageBand as unknown;
        const ageBand: AgeBand = age === "1-2" || age === "3-5" ? age : "6-8";
        const xp = Number.isFinite(profile.xp) ? Math.max(0, profile.xp) : 0;
        const lastMode = profile.lastMode;
        return [{
          ...profile, ageBand, xp, rank: rankFor(xp),
          streak: Number.isFinite(profile.streak) ? Math.max(0, profile.streak) : 0,
          lastPlayedISO: typeof profile.lastPlayedISO === "string" ? profile.lastPlayedISO : "",
          loreNote: typeof profile.loreNote === "string" ? profile.loreNote : "",
          lastMode: lastMode === "hunt" || lastMode === "roadtrip" || lastMode === "lava" ? lastMode : undefined,
          activities: profile.activities && typeof profile.activities === "object" ? profile.activities : {},
          preferences: readPreferences(profile.preferences),
          garageSessions: Number.isSafeInteger(profile.garageSessions) ? Math.max(0, profile.garageSessions!) : 0,
          recentSessions: Array.isArray(profile.recentSessions) ? profile.recentSessions.filter((id) => typeof id === "string").slice(-100) : [],
        }];
      });
      cached = { profiles: migrated, selectedId, lastFinished };
    }
  } catch {
    // An unavailable or unreadable store still allows play in this tab.
  }
  return cached;
}

function saveProgress(progress: Progress) {
  cached = progress;
  try {
    localStorage.setItem(storageKey, JSON.stringify(progress));
  } catch {
    // Keep progress for this tab when the browser blocks storage.
  }
  return progress;
}

export function rankName(rank: number) {
  return ranks[rank] ?? ranks[0];
}

function rankFor(xp: number) {
  return rankThresholds.filter((threshold) => threshold <= xp).length - 1;
}

export function saveProfile(codenameId: string, ageBand: AgeBand, preferences: Preferences) {
  const progress = readProgress();
  const existing = progress.profiles.find((profile) => profile.codenameId === codenameId);
  const profile: ChildProfile = existing
    ? { ...existing, ageBand, preferences }
    : { id: codenameId, codenameId, ageBand, preferences, xp: 0, rank: 0, streak: 0, lastPlayedISO: "", loreNote: "" };
  const profiles = progress.profiles.filter((entry) => entry.id !== profile.id);
  saveProgress({ ...progress, selectedId: profile.id, profiles: [...profiles, profile] });
  return readProgress();
}

export function updateProfile(profileId: string, codenameId: string, ageBand: AgeBand, preferences: Preferences) {
  const progress = readProgress();
  const profiles = progress.profiles.map((profile) =>
    profile.id === profileId ? { ...profile, codenameId, ageBand, preferences } : profile);
  return saveProgress({ ...progress, profiles, selectedId: profileId });
}

export function rewardActivity(
  sessionId: string, profileId: string, activity: Activity, points: number,
  mission?: { mode: Mode; memory: string }, date = new Date(),
) {
  const progress = readProgress();
  const target = progress.profiles.find((profile) => profile.id === profileId);
  if (!target || progress.lastFinished === sessionId || target.recentSessions?.includes(sessionId)) return progress;
  const yesterday = new Date(date);
  yesterday.setDate(yesterday.getDate() - 1);
  const profiles = progress.profiles.map((profile) => {
    if (profile.id !== profileId) return profile;
    const xp = profile.xp + points;
    const lastDay = localDay(new Date(profile.lastPlayedISO));
    const streak = lastDay === localDay(date) ? profile.streak
      : lastDay === localDay(yesterday) ? profile.streak + 1 : 1;
    return {
      ...profile, xp, rank: rankFor(xp), streak, lastPlayedISO: date.toISOString(),
      garageSessions: (profile.garageSessions ?? 0) + 1,
      recentSessions: [...(profile.recentSessions ?? []).slice(-99), sessionId],
      activities: { ...profile.activities, [activity]: (profile.activities?.[activity] ?? 0) + 1 },
      ...(mission ? { lastMode: mission.mode, loreNote: mission.memory.slice(0, 120) } : {}),
    };
  });
  return saveProgress({ ...progress, profiles, lastFinished: sessionId });
}
