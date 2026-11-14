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
