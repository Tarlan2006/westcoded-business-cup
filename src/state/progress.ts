import type { AgeBand, Mode, Profile } from "../../shared/types";

const storageKey = "mission-control.progress";
const rankThresholds = [0, 30, 100, 250, 500];
const ranks = ["Recruit", "Scout", "Field Agent", "Special Agent", "Commander"];

interface Progress {
  profiles: Profile[];
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
      cached = { profiles, selectedId, lastFinished };
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

export function saveProfile(codenameId: string, ageBand: AgeBand) {
  const progress = readProgress();
  const existing = progress.profiles.find((profile) => profile.codenameId === codenameId);
  const profile: Profile = existing
    ? { ...existing, ageBand }
    : { id: codenameId, codenameId, ageBand, xp: 0, rank: 0, streak: 0, lastPlayedISO: "", loreNote: "" };
  const profiles = progress.profiles.filter((entry) => entry.id !== profile.id);
  saveProgress({ ...progress, selectedId: profile.id, profiles: [...profiles, profile] });
  return profile;
}

export function finishMission(sessionId: string, profileId: string, mode: Mode, points: number, memory: string, date = new Date()) {
  const progress = readProgress();
  if (progress.lastFinished === sessionId) return progress;
  const yesterday = new Date(date);
  yesterday.setDate(yesterday.getDate() - 1);
  const profiles = progress.profiles.map((profile) => {
    if (profile.id !== profileId) return profile;
    const xp = profile.xp + points;
    const lastDay = localDay(new Date(profile.lastPlayedISO));
    const streak = lastDay === localDay(date) ? profile.streak
      : lastDay === localDay(yesterday) ? profile.streak + 1 : 1;
    return {
      ...profile, xp, rank: rankThresholds.filter((threshold) => threshold <= xp).length - 1,
      streak, lastPlayedISO: date.toISOString(), lastMode: mode, loreNote: memory.slice(0, 120),
    };
  });
  return saveProgress({ ...progress, profiles, lastFinished: sessionId });
}
