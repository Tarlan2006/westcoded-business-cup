import { Hono } from "hono";
import { bodyLimit } from "hono/body-limit";
import type { SetupSuggestion } from "../shared/types";

export const setup = new Hono();
// Compatibility endpoint only. Do not parse, store, echo, or forward parent text.
setup.post("/api/setup", bodyLimit({ maxSize: 4096, onError: (c) => c.json({ error: "Please choose your preferences below." }, 413) }), (c) => {
  c.header("Cache-Control", "no-store");
  return c.json({ topics: [], needs: [], first: "any", summary: "Please choose your preferences below." } satisfies SetupSuggestion);
});
