import { Hono } from "hono";
import { bodyLimit } from "hono/body-limit";
import { createMiddleware } from "hono/factory";
import { ask } from "./ask";
import { setup } from "./setup";
import { chooseTurn } from "./groq";
import { maxWavBytes, recognizeSpeech, validWav } from "./stt";
import { isTurnRequest } from "./turn-contract";

export interface Env {
  AI: Ai;
  GROQ_API_KEY?: string;
  LLM_MODEL?: string;
}

type WorkerEnv = { Bindings: Env };
const app = new Hono<WorkerEnv>();
app.route("/", ask);
app.route("/", setup);
const windowMs = 60_000;
const windowCounts = new Map<string, number>();
let currentWindow = -1;

const limitByIp = createMiddleware<WorkerEnv>(async (c, next) => {
  const now = Date.now();
  const window = Math.floor(now / windowMs);
  if (window !== currentWindow) {
    currentWindow = window;
    windowCounts.clear();
  }
  const ip = c.req.header("CF-Connecting-IP") ?? "local";
  const key = `${c.req.path}:${ip}`;
  const limit = c.req.path === "/api/stt" ? 16 : 40;
  const count = windowCounts.get(key) ?? 0;
  if (count >= limit || (!count && windowCounts.size >= 4096)) {
    c.header("Retry-After", String(Math.ceil((windowMs - now % windowMs) / 1000)));
    return c.json({ error: "Too many requests" }, 429);
  }
  windowCounts.set(key, count + 1);
  c.header("Cache-Control", "no-store");
  await next();
});

app.get("/api/health", (c) => c.json({ ok: true, time: new Date().toISOString() }));

app.post("/api/stt", limitByIp, bodyLimit({
  maxSize: maxWavBytes,
  onError: (c) => c.json({ error: "WAV exceeds eight seconds" }, 413),
}), async (c) => {
  if (c.req.header("Content-Type")?.split(";")[0].trim().toLowerCase() !== "audio/wav") {
    return c.json({ error: "Expected audio/wav" }, 415);
  }
  const wav = await c.req.arrayBuffer();
  if (!validWav(wav)) return c.json({ error: "Expected 16 kHz mono 16-bit PCM WAV up to eight seconds" }, 400);
  try {
    const text = await recognizeSpeech(c.env.AI, wav);
    return c.json({ text });
  } catch {
    return c.json({ error: "Speech recognition unavailable" }, 503);
  }
});

app.post("/api/turn", limitByIp, bodyLimit({
  maxSize: 16_384,
  onError: (c) => c.json({ error: "Turn request is too large" }, 413),
}), async (c) => {
  const request: unknown = await c.req.json().catch(() => null);
  if (!isTurnRequest(request)) return c.json({ error: "Invalid turn request" }, 400);
  return c.json(await chooseTurn(request, c.env.GROQ_API_KEY, c.env.LLM_MODEL));
});

app.onError((_error, c) => c.json({ error: "Request could not be processed" }, 500));

export default app;
