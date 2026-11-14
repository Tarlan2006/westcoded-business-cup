# Deployment

1. Install Node 24, run npm i, then npm run typecheck, npm run build, npm run check-content and npx tsx scripts/worker-tests.ts.
2. Authenticate with npx wrangler login. Keep the existing Worker name, asset configuration and AI binding. This task does not modify Wrangler or Vite configuration.
3. Set GROQ_API_KEY using npx wrangler secret put GROQ_API_KEY. Set LLM_MODEL using npx wrangler secret put LLM_MODEL to a model enabled in your Groq account. Hunt falls back locally without both. Ask can use the existing Cloudflare AI binding without a Groq key.
4. Set ALLOWED_ORIGINS in Worker environment variables to https://mission-control.tarlan-b06.workers.dev. Add any owned custom production origins explicitly, comma-separated, without trailing slashes. Do not use a wildcard. Production defaults to the listed workers.dev domain when the variable is absent.
5. For local development only, set ALLOWED_ORIGINS in .dev.vars to the exact localhost origins printed by Vite (for example http://localhost:5173 and http://127.0.0.1:5173), plus production if needed. An empty configured value allows no browser Origin. .env.example lists names only, not secrets or defaults.
6. WORKERS_AI_MODEL is optional. Verify the AI binding and model availability in your Cloudflare account. Configure secrets as Worker bindings, never client VITE variables.
7. Run npm run deploy. Verify /api/health, an allowed-origin Ask request, a refused origin, and fallback with unavailable upstreams. Confirm dashboard logs do not capture request bodies. See the deployment record below.

## Manual follow-up outside this agent's allowed paths
- The Worker ignores /api/setup bodies and returns a fixed compatible suggestion. Agent 2 must remove the frontend transmission to keep parent text entirely on-device.
- The client currently gives STT about 6 seconds and Hunt about 3 seconds before local fallback, shorter than the new 8-second server deadlines. This is safe but can discard a slow successful response. Align these timeouts in src/lib/api.ts if desired.
- Display optional STT message on empty transcription and handle 429 gently in every new UI; current helpers already catch non-2xx responses.
- Add the worker test command to CI/package scripts later if desired; package.json is unchanged.
- For serious production traffic, replace per-isolate buckets with a shared limiter and review provider retention/consent. Origin checks do not authenticate callers.

## Deployment record — 2026-11-15 (Asia/Qyzylorda)

- Source: main commit d255641 (based on 7b0a2be); Worker plus Vite frontend assets built together. No src files were changed by this task.
- Live URL: https://mission-control.tarlan-b06.workers.dev
- Cloudflare version: bd1e316d-3ac9-4250-906d-a30cb3a68da2, deployed to 100% traffic.
- Previous version: 5b317da5-5030-4a7b-91a2-43663394078e.
- Command: npx wrangler deploy --keep-vars --var "ALLOWED_ORIGINS:https://mission-control.tarlan-b06.workers.dev,http://localhost:5173"
- Existing model keys/settings were not read or changed. Keep --keep-vars on future deployments so dashboard variables survive; pass the origin allowlist explicitly or configure it in the deployment environment.
- Parent setup bodies are ignored with a fixed HTTP 200 SetupSuggestion response. Extra parent-context fields in Ask are not included in its explicitly selected LLM messages. Tests verify no sentinel context is forwarded. The frontend still needs to stop sending this data to the Worker itself.

### Verification
TypeScript, build and worker/FAQ tests passed. Production smoke checks: HTML and JS asset HTTP 200; Ask ordinary question HTTP 200 with short LLM answer; injection and 301-character input HTTP 200 with warm refusal; foreign Origin HTTP 403 without allow-origin; production and localhost Origin allowed; Hunt HTTP 200 with validated fallback selection; parent setup HTTP 200 with fixed response. A bounded 40-request empty-input burst returned 24 HTTP 200 and 16 HTTP 429 responses with Retry-After.

Groq 500/timeout fallbacks passed mocked local tests. No production outage was induced and no model credentials were changed, so this is not evidence of a forced Groq-outage test on production. Hunt's production response used its normal fallback path. Ask's LLM source does not identify which configured provider answered.

### Rollback
Run npx wrangler rollback 5b317da5-5030-4a7b-91a2-43663394078e and confirm the prompt, then check the active version with npx wrangler deployments list and repeat /api/health and smoke checks. This restores the previous deployed Worker/assets/configuration, including its earlier privacy and safety behaviour; it can re-enable parent setup model forwarding. Verify ALLOWED_ORIGINS after rollback. Do not reset Git main or change model secrets to roll back a deployment. Prefer a corrected forward deployment if restoring the older privacy behaviour is unacceptable.
