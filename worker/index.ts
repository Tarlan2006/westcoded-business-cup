import { Hono } from "hono";

export interface Env {
  AI: Ai;
  GROQ_API_KEY: string;
  LLM_MODEL: string;
}

const app = new Hono<{ Bindings: Env }>();

app.get("/api/health", (c) => c.json({ ok: true, time: new Date().toISOString() }));
app.post("/api/stt", (c) => c.json({ error: "not implemented" }, 501));
app.post("/api/turn", (c) => c.json({ error: "not implemented" }, 501));

export default app;
