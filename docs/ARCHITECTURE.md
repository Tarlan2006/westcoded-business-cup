# Architecture

```mermaid
flowchart TD
 Client[React client: local profile and progress] --> Worker[Hono / Cloudflare Worker]
 Client --> Clips[Pre-rendered Piper clips]
 Client --> Host[Live mascot voice: Pocket TTS in the browser]
 Host --> Speech[Installed browser voice while it loads]
 Worker --> Guard[Origin allowlist + IP buckets + body limits]
 Guard --> Ask[Ask: input checks + short MyPal prompt]
 Ask --> Groq[Groq chat completion]
 Ask --> AI[Workers AI language model fallback]
 Groq --> Filter[Output safety filter]
 AI --> Filter
 Filter --> Client
 Ask --> FAQ[Prepared FAQ / warm refusal]
 FAQ --> Client
 Guard --> STT[Whisper on Workers AI: 8 second deadline]
 STT --> Client
 Guard --> Hunt[Hunt: allowlisted words and candidate IDs]
 Hunt --> Groq
 Hunt --> Local[Validated selection / deterministic fallback]
 Local --> Client
```

API shapes remain compatible: Ask returns answer/source, STT returns text (empty on retry, plus optional message), and turns return praiseLineId/nextTaskId/scoreDelta/loreNote/source. Rate-limited calls return HTTP 429 and a friendly body; existing client catch paths use local fallbacks.

Groq calls use an 8-second abort deadline. Whisper uses an 8-second response deadline; the binding does not expose cancellation, so underlying work may finish later. Ask cloud calls have bounded attempts, then prepared FAQ. CORS is an origin allowlist, not authentication: clients without Origin can call APIs. In-memory token buckets refill at 30/minute and 300/hour with matching burst capacities, capped at 4096 IPs and expired after inactivity. Limits are per isolate, not globally distributed quotas.

No raw user payload logging is added. Filters are conservative defence in depth, not a semantic safety proof. FAQ matches whole words and informative multiword phrases, avoiding generic water/sky matches when a more specific fish/bird question is present.
