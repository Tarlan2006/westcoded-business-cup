import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, readdirSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { parseArgs } from "node:util";
import { audioDir, audioPath, bankPath, fileSize, manifestPath, readClips, readJson, readManifest, root, sizeLimit } from "./audio-content.mjs";

const cacheDir = join(root, "scripts/.cache");
const defaultVoice = { piper: "en_US-hifi_tts_92-medium", kokoro: "af_heart", aura: "luna" };
const python = process.env.PYTHON ?? "python";
const ffmpeg = process.env.FFMPEG ?? "ffmpeg";
const filters = [
  "silenceremove=start_periods=1:start_duration=0.04:start_threshold=-48dB:start_silence=0.04",
  "areverse",
  "silenceremove=start_periods=1:start_duration=0.06:start_threshold=-48dB:start_silence=0.10",
  "areverse",
  "loudnorm=I=-18:TP=-2:LRA=7",
];

function run(command, args, input) {
  const result = spawnSync(command, args, {
    input, encoding: "utf8", timeout: 180_000, maxBuffer: 2_000_000,
    env: { ...process.env, PYTHONUTF8: "1" }, windowsHide: true,
  });
  if (result.error) throw new Error(`${command}: ${result.error.message}`);
  if (result.status !== 0) throw new Error(`${command}: ${(result.stderr || result.stdout).trim().slice(-1400)}`);
  return result.stderr;
}

function writeJson(path, value, compactRows = false) {
  mkdirSync(dirname(path), { recursive: true });
  const json = (compactRows ? "[\n" + value.map((item) => "  " + JSON.stringify(item)).join(",\n") + "\n]" : JSON.stringify(value, null, 2)) + "\n";
  try {
    if (readFileSync(path, "utf8").replace(/\r\n/g, "\n") === json) return;
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
  const staged = `${path}.tmp-${process.pid}`;
  writeFileSync(staged, json);
  renameSync(staged, path);
}

function piperModel(voice) {
  const candidates = voice.endsWith(".onnx")
    ? [resolve(voice)]
    : [join(process.env.PIPER_MODEL_DIR ?? join(cacheDir, "models"), `${voice}.onnx`), resolve(`${voice}.onnx`)];
  const model = candidates.find((path) => fileSize(path) && fileSize(`${path}.json`));
  if (!model) throw new Error(`Piper model/config pair not found for "${voice}". See README → Озвучка.`);
  return model;
}

function engineFor(engine, voice, folder) {
  if (engine === "piper") {
    const model = piperModel(voice);
    const config = readFileSync(`${model}.json`);
    const fingerprint = createHash("sha256").update(readFileSync(model)).update(config).digest("hex");
    return {
      fingerprint,
      batch(jobs) {
        if (!jobs.length) return;
        // Piper names the WAVs with monotonic timestamps in synthesis order.
        const inputPath = join(folder, "input.txt");
        const wavDir = join(folder, "wav");
        mkdirSync(wavDir);
        writeFileSync(inputPath, jobs.map((job) => job.text.replace(/\s+/g, " ")).join("\n") + "\n");
        const output = run(python, [
          "-m", "piper", "-m", model, "-i", inputPath, "-d", wavDir,
          "--output-dir-naming", "timestamp", "--sentence-silence", "0.12",
        ]);
        const names = readdirSync(wavDir).filter((name) => /^\d+\.wav$/.test(name))
          .sort((a, b) => a.length - b.length || a.localeCompare(b));
        if (names.length !== jobs.length) throw new Error(`Piper produced ${names.length}/${jobs.length} WAV files. ${output.slice(-500)}`);
        for (const [index, job] of jobs.entries()) job.input = join(wavDir, names[index]);
      },
    };
  }
  if (engine === "kokoro") {
    return {
      fingerprint: voice,
      generate(text, path) {
        run(python, ["-m", "kokoro", "--voice", voice, "--output-file", path, "--text", text]);
      },
    };
  }
  if (engine === "elevenlabs") {
    const key = process.env.ELEVENLABS_API_KEY;
    if (!key) throw new Error("Set ELEVENLABS_API_KEY for --engine elevenlabs");
    const model = "eleven_multilingual_v2";
    return {
      fingerprint: model,
      generate: (text, path) => download(
        `https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(voice)}?output_format=mp3_44100_128`,
        { "xi-api-key": key }, { text, model_id: model }, path,
      ),
    };
  }
  const key = process.env.CLOUDFLARE_API_TOKEN ?? process.env.CLOUDFLARE_API_KEY;
  const account = process.env.CLOUDFLARE_ACCOUNT_ID;
  if (!key || !account) throw new Error("Set CLOUDFLARE_API_TOKEN and CLOUDFLARE_ACCOUNT_ID for --engine aura");
  const model = "@cf/deepgram/aura-2-en";
  return {
    fingerprint: model,
    generate: (text, path) => download(
      `https://api.cloudflare.com/client/v4/accounts/${encodeURIComponent(account)}/ai/run/${model}`,
      { Authorization: `Bearer ${key}` }, { text, speaker: voice, encoding: "mp3" }, path,
    ),
  };
}

async function download(url, headers, input, path) {
  const result = await fetch(url, {
    method: "POST", headers: { ...headers, "Content-Type": "application/json" },
    body: JSON.stringify(input), signal: AbortSignal.timeout(45_000),
  });
  if (!result.ok || result.headers.get("Content-Type")?.includes("json")) {
    throw new Error(`Speech API returned HTTP ${result.status} without audio`);
  }
  writeFileSync(path, Buffer.from(await result.arrayBuffer()));
}

function encode(input, output) {
  const stats = run(ffmpeg, [
    "-hide_banner", "-nostdin", "-y", "-i", input, "-af", filters.join(","),
    "-ar", "22050", "-ac", "1", "-c:a", "libmp3lame", "-b:a", "64k", "-progress", "pipe:2", output,
  ]);
  const times = [...stats.matchAll(/^out_time_us=(\d+)\s*$/gm)];
  const durationMs = Math.round(Number(times.at(-1)?.[1]) / 1000);
  if (!Number.isFinite(durationMs) || durationMs <= 0 || !fileSize(output)) throw new Error("FFmpeg produced no audible clip");
  return durationMs;
}

async function main() {
  const { values } = parseArgs({
    options: {
      engine: { type: "string", default: "piper" }, voice: { type: "string" },
      only: { type: "string" }, force: { type: "boolean" }, "dry-run": { type: "boolean" }, help: { type: "boolean" },
    },
  });
  if (values.help) {
    console.log("npm run gen-audio -- [--engine piper|kokoro|elevenlabs|aura] [--voice VOICE] [--only PREFIX] [--force] [--dry-run]");
    return;
  }
  const engine = values.engine;
  if (!["piper", "kokoro", "elevenlabs", "aura"].includes(engine)) throw new Error(`Unknown engine "${engine}"`);
  const voice = values.voice ?? defaultVoice[engine];
  const { banks, clips } = readClips();
  const clipIds = new Set();
  for (const clip of clips) {
    if (!/^[a-z0-9][a-z0-9_-]{0,79}$/.test(clip.id) || clipIds.has(clip.id) ||
      typeof clip.text !== "string" || !clip.text.trim()) throw new Error(`Invalid or duplicate clip: ${clip.id}`);
    audioPath(clip.file);
    clipIds.add(clip.id);
  }
  const selected = clips.filter((clip) => clip.id.startsWith(values.only ?? ""));
  if (!selected.length) throw new Error(`No clips match "${values.only}"`);
  const characters = selected.reduce((sum, clip) => sum + clip.text.length, 0);
  if (values["dry-run"]) {
    const stored = selected.reduce((sum, clip) => sum + fileSize(audioPath(clip.file)), 0);
    const estimate = selected.reduce((sum, clip) => sum + Math.max(1, clip.text.split(/\s+/).length / 2.6) * 8000, 0);
    console.log(`Dry run · ${engine} / ${voice ?? "(voice ID required for generation)"} · ${selected.length} clips · ${characters} characters · ${stored} existing bytes · ~${Math.round(estimate)} estimated bytes · 0 errors`);
    return;
  }
  if (readJson(manifestPath).voice === "aidos-luna-v1") throw new Error("Use node scripts/generate-unified-voice.mjs to preserve the single AIdos voice.");
  if (!voice) throw new Error(`Pass --voice for ${engine}`);

  mkdirSync(cacheDir, { recursive: true });
  const folder = mkdtempSync(join(cacheDir, "run-"));
  const indexPath = join(cacheDir, "clips.json");
  const index = fileSize(indexPath) ? readJson(indexPath) : {};
  const manifest = readManifest();
  const current = Object.fromEntries(clips.filter((clip) => manifest[clip.id] === clip.file && fileSize(audioPath(clip.file)))
    .map((clip) => [clip.id, clip.file]));
  const durations = new Map();
  let generated = 0;
  let cached = 0;
  let errors = 0;
  try {
    const tts = engineFor(engine, voice, folder);
    run(ffmpeg, ["-version"]);
    const jobs = new Map();
    for (const clip of selected) {
      const hash = createHash("sha256").update(JSON.stringify([engine, voice, tts.fingerprint, clip.text, filters, 22050, "64k"])).digest("hex");
      const path = audioPath(clip.file);
      if (!values.force && index[clip.id]?.hash === hash && index[clip.id].durationMs > 0 && fileSize(path)) {
        current[clip.id] = clip.file;
        durations.set(clip.id, index[clip.id].durationMs);
        cached++;
      } else {
        if (!jobs.has(hash)) jobs.set(hash, { text: clip.text, clips: [] });
        jobs.get(hash).clips.push(clip);
      }
    }
    tts.batch?.([...jobs.values()]);
    for (const [hash, job] of jobs) {
      const output = join(folder, "clip.mp3");
      try {
        const input = job.input ?? join(folder, engine === "kokoro" ? "input.wav" : "input.mp3");
        if (!job.input) await tts.generate(job.text, input);
        const durationMs = encode(input, output);
        const encoded = readFileSync(output);
        for (const clip of job.clips) {
          const path = audioPath(clip.file);
          mkdirSync(dirname(path), { recursive: true });
          const staged = `${path}.tmp-${process.pid}`;
          writeFileSync(staged, encoded);
          renameSync(staged, path);
          index[clip.id] = { hash, durationMs };
          current[clip.id] = clip.file;
          durations.set(clip.id, durationMs);
          generated++;
        }
      } catch (error) {
        errors += job.clips.length;
        console.error(`${job.clips.map((clip) => clip.id).join(", ")}: ${error.message}`);
      }
    }
    for (const [name, lines] of banks) {
      writeJson(bankPath(name), lines.map((line) => durations.has(line.id) ? { ...line, durationMs: durations.get(line.id) } : line), true);
    }
    writeJson(indexPath, index);
    writeJson(manifestPath, { clips: Object.fromEntries(Object.entries(current).sort(([a], [b]) => a.localeCompare(b))) });
  } finally {
    // Only the temporary directory created by mkdtemp for this invocation is removed.
    rmSync(folder, { recursive: true, force: true });
  }

  const bytes = readdirSync(audioDir, { recursive: true, withFileTypes: true })
    .reduce((sum, entry) => sum + (entry.isFile() ? fileSize(join(entry.parentPath, entry.name)) : 0), 0);
  if (bytes > sizeLimit) {
    errors++;
    console.error(`Audio exceeds the ${sizeLimit} byte budget`);
  }
  console.log(`${selected.length} clips · ${characters} characters · ${generated} generated · ${cached} cached · ${bytes} total bytes · ${errors} errors`);
  if (errors) process.exitCode = 1;
}

if (process.argv.includes("--lang")) {
  const child = spawnSync(python, [join(root, "scripts/localized-audio.py"), ...process.argv.slice(2)], { stdio: "inherit", windowsHide: true, env: { ...process.env, PYTHONUTF8: "1" } });
  if (child.error) throw child.error;
  process.exitCode = child.status ?? 1;
} else main().catch((error) => {
  console.error(`Audio generation error: ${error.message}`);
  process.exitCode = 1;
});
