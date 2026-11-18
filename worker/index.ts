import { responses } from "../shared/language";
import { IpLimiter } from "./safety";
import { Hono } from "hono";
import { bodyLimit } from "hono/body-limit";

import { ask } from "./ask";
import { setup } from "./setup";
import { voice } from "./voice";
import { chooseTurn } from "./groq";
import { maxWavBytes, recognizeSpeech, validWav } from "./stt";
import { isTurnRequest } from "./turn-contract";

export interface Env {
  ASSETS?: Fetcher;
  AI: Ai;
  ALLOWED_ORIGINS?: string;
  GROQ_API_KEY?: string;
  LLM_MODEL?: string;
}

type WorkerEnv = { Bindings: Env };
const app = new Hono<WorkerEnv>();
const limiter = new IpLimiter();
app.use("*", async (c, next) => {
  c.header("X-Content-Type-Options", "nosniff");
  c.header("Referrer-Policy", "strict-origin-when-cross-origin");
  c.header("X-Frame-Options", "DENY");
  c.header("Content-Security-Policy", "frame-ancestors 'none'");
  c.header("Permissions-Policy", "microphone=(self), camera=(), geolocation=()");
  const url = new URL(c.req.url);
  if (url.protocol === "http:" && url.hostname.endsWith(".workers.dev")) {
    url.protocol = "https:";
    return c.redirect(url.href, 308);
  }
  await next();
  if (/^\/assets\/worker-.*\.js$/.test(url.pathname)) c.header("Referrer-Policy", "no-referrer");
  if (/^\/assets\/.+-[\w-]+\.(js|css|woff2?|ttf)$/.test(url.pathname) && c.res.status === 200)
    c.header("Cache-Control", "public, max-age=31536000, immutable");
});
app.use("/api/*", async (c,next) => {
 c.header("Cache-Control","no-store"); c.header("Vary","Origin");
 const origin=c.req.header("Origin");
 const allowed=(c.env.ALLOWED_ORIGINS ?? "https://aidos.nexcel.kz,https://mypal.tarlan-b06.workers.dev,https://mission-control.tarlan-b06.workers.dev,http://localhost:5173").split(",").map(s=>s.trim());
 if(origin && !allowed.includes(origin)) return c.json({error:"Let's return to the game."},403);
 if(origin) c.header("Access-Control-Allow-Origin",origin);
 if(c.req.method === "OPTIONS") { c.header("Access-Control-Allow-Methods","GET, POST, OPTIONS"); c.header("Access-Control-Allow-Headers","Content-Type"); return c.body(null,204); }
 if(c.req.method === "POST" && !limiter.take(c.req.header("CF-Connecting-IP") ?? "local")) {
  c.header("Retry-After","60"); const message="Let's take a little break and try again soon!";
  return c.json(c.req.path === "/api/ask" ? {answer:message,source:"refusal"} : c.req.path === "/api/stt" ? {text:"",message} : {error:message},429);
 }
 await next();
});
app.route("/",ask); app.route("/",setup); app.route("/",voice);
app.get("/api/health", (c) => c.json({ ok: true, time: new Date().toISOString() }));

app.post("/api/stt", bodyLimit({
  maxSize: maxWavBytes,
  onError: (c) => c.json({ error: "Please use a shorter recording." }, 413),
}), async (c) => {
  const lang = c.req.query("lang") === "kk" ? "kk" : "en";
  const retryReply = responses[lang].retry;
  if (c.req.header("Content-Type")?.split(";")[0].trim().toLowerCase() !== "audio/wav") {
    return c.json({ text: "", message: retryReply });
  }
  const wav = await c.req.arrayBuffer();
  if (!validWav(wav)) return c.json({ text: "", message: retryReply });
  try {
    const text = await recognizeSpeech(c.env.AI, wav, lang);
    return c.json(text ? {text} : {text:"",message:retryReply});
  } catch {
    return c.json({text:"",message:retryReply});
  }
});

app.post("/api/turn", bodyLimit({
  maxSize: 16_384,
  onError: (c) => c.json({ error: "Turn request is too large" }, 413),
}), async (c) => {
  const request: unknown = await c.req.json().catch(() => null);
  if (!isTurnRequest(request)) return c.json({ error: "Invalid turn request" }, 400);
  return c.json(await chooseTurn(request, c.env.GROQ_API_KEY, c.env.LLM_MODEL));
});

app.onError((_error, c) => c.json({ error: "Request could not be processed" }, 500));

app.all("/api/*", c => c.json({ error: "Let's return to the game." }, 404));
app.get("*", async c => {
  const url = new URL(c.req.url);
  if (/(^|\/)\.(env|git)(\/|$|\.)|\.map$/.test(url.pathname)) return c.text("Not found", 404);
  if (!c.env.ASSETS) return c.text("Not found", 404);
  const privacy = url.pathname === "/privacy" || url.pathname === "/privacy/";
  if (privacy) url.pathname = "/";
  const response = await c.env.ASSETS.fetch(new Request(url, c.req.raw));
  if (!privacy || response.status !== 200) return response;
  const title = "Privacy · AIdos";
  const description = "How AIdos handles local child settings, optional voice input and questions.";
  return new HTMLRewriter()
    .on("title", { element: el => { el.setInnerContent(title); } })
    .on('meta[name="description"],meta[property="og:description"],meta[name="twitter:description"]', { element: el => { el.setAttribute("content", description); } })
    .on('meta[property="og:title"],meta[name="twitter:title"]', { element: el => { el.setAttribute("content", title); } })
    .on('link[rel="canonical"]', { element: el => { el.setAttribute("href", "https://aidos.nexcel.kz/privacy"); } })
    .on('meta[property="og:url"]', { element: el => { el.setAttribute("content", "https://aidos.nexcel.kz/privacy"); } })
    .transform(response);
});

export default app;
