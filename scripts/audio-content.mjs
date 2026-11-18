import { readFileSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

export const root = fileURLToPath(new URL("../", import.meta.url));
export const audioDir = join(root, "public/audio");
export const manifestPath = join(audioDir, "manifest.json");
export const sizeLimit = 6_000_000;
export const modes = ["common", "hunt", "roadtrip", "lava"];
export const bankNames = [...modes, "local-lines"];

export function readJson(path) {
  return JSON.parse(readFileSync(path, "utf8"));
}

export function bankPath(name) {
  return join(root, "content", `${name}.json`);
}

export function readRows(name) {
  const rows = readJson(bankPath(name));
  if (!Array.isArray(rows)) throw new Error(`${name}.json must contain an array`);
  return rows;
}

export function readClips() {
  const banks = new Map(bankNames.map((name) => [name, readRows(name)]));
  const quiz = readRows("quiz");
  const clips = [...banks.values()].flat().map((row) => ({ id: row.id, file: row.file, text: row.text }));
  for (const row of quiz) {
    if (row.ageBand === "1-2" || row.ageBand === "3-5") clips.push({
      id: `quiz_${row.id}`, file: readManifest()[`quiz_${row.id}`], text: row.question,
    });
  }
  return { banks, quiz, clips };
}

export function readManifest() {
  try {
    const { clips } = readJson(manifestPath);
    if (Array.isArray(clips)) {
      const map = Object.create(null);
      for (const clip of clips) {
        if (typeof clip?.id !== "string" || Object.hasOwn(map, clip.id)) {
          throw new Error("Manifest contains a missing or duplicate clip ID");
        }
        map[clip.id] = clip.file;
      }
      return map;
    }
    if (!clips || typeof clips !== "object") throw new Error("Manifest must have a clips map or array");
    return clips;
  } catch (error) {
    if (error.code === "ENOENT") return {};
    throw error;
  }
}

export const clipPathPattern = /^\/?audio\/[\w/-]+\.mp3$/;

export function audioPath(file) {
  if (typeof file !== "string" || !clipPathPattern.test(file)) throw new Error(`Invalid clip path: ${file}`);
  return join(dirname(audioDir), file.replace(/^\//, ""));
}

export function fileSize(path) {
  try {
    const stat = statSync(path);
    return stat.isFile() ? stat.size : 0;
  } catch (error) {
    if (error.code === "ENOENT") return 0;
    throw error;
  }
}
