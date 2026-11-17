# Deployment

## Procedural 3D and audio reliability release

The next main release replaces sprite-only host motion with procedural Three.js meshes and fixes recording priority, stale speech queues, repeated electronic cues, stop clicks and manifest retry. See [audit and measurements](releases/aidos-3d-audio-audit.md). The previously successful source is `2b233e7` (sprite motion release). Roll back by selecting that source's successful deployment in Cloudflare Worker `westcoded-business-cup`, then revert the new Git commit before another automatic main build. No secrets or bindings need modification. The Three.js renderer is a lazy chunk (~138 KB gzip); it does not download model assets or the retired voice-cloning model.

## AIdos motion release — 2026-11-17

This release adds speech-driven mouth keyframes and stable mascot frames, updates installation branding, and removes obsolete public mascot/voice-reference assets. See [host audit](releases/aidos-motion-2026-11-17.md). Publish through the existing main → Cloudflare Builds connection for **https://aidos.nexcel.kz**; no secret changes are required.

The previous successful release is source `4140852403f384596596b53cfa7d23c49cec37f2`, Cloudflare version prefix `3a2f39ed`. To undo this release, select that successful deployment in Worker `westcoded-business-cup` → Deployments → Rollback, verify the domain, then revert the motion commit in Git before another push. Do not reset main or change secrets. A rollback restores the previous static host and old voice-reference URL.

## Current target — AIdos, 2026-11-17

The production site is **https://aidos.nexcel.kz**, served by Worker **westcoded-business-cup** in the Cloudflare account that owns **nexcel.kz**. The old `mypal.tarlan-b06.workers.dev` address is retired/unavailable; its 404 is not a failure of the new custom domain. Records below this section describe historical deployments.

Cloudflare Builds is connected to `Tarlan2006/westcoded-business-cup`, branch `main`: **pushing main automatically deploys**. The dashboard confirmed commit `95aa6b5` at 100% on version prefix `a66cffb8` before this branding release. This also supersedes the earlier audit's assumption that its push would not publish.

The Wrangler name now matches the real Worker. `keep_vars: true` preserves dashboard variables; application secrets must not be read, set or deleted during deployment. `ALLOWED_ORIGINS` explicitly includes `https://aidos.nexcel.kz`, both historical workers.dev origins and localhost. Do not deploy this project into the old CLI account or create another Worker merely because the old `mypal` name is missing.

Release content: AIdos name in UI, accessibility labels, metadata and host prompts; four Kazakh-clothing mascot poses with taqiya and gold oyu; seven regenerated Piper clips; the previously audited nine music themes and animated backgrounds. Existing localStorage keys are retained to preserve preferences at the same origin. The new domain cannot automatically read profiles from an old origin.

To publish: pull/rebase main, run checks, commit and push; wait for Cloudflare Builds to show the source commit Ready at 100%. Then verify the live HTML/assets, health, CORS, music controls and screenshots. Before any future release, record its currently active version; do not blindly use a historical rollback target.

To roll back this release: open Workers & Pages → westcoded-business-cup → Deployments in the same account, select the previous successful version (pre-release prefix `a66cffb8`, source `95aa6b5`), and use Rollback. Confirm the active deployment and repeat the live checks. Revert the offending Git commit before another push so the automatic build does not republish it. Do not reset main or change secrets. The fallback version has the old name and allowlist; check CORS again after any rollback.

## Historical records

Production runs on the `mypal` Worker at [MyPal](https://mypal.tarlan-b06.workers.dev). Cloudflare version `dfc6fed0-ec8c-48a7-9b34-c72e71086fcd` was deployed from `a34b06b`. The deployment includes the designer screens, games, and refreshed voice clips.

Verified after rename: Chrome title/Splash/meta, all seven MyPal audio hashes and decoding, Ask HTTP 200, own/dev Origin HTTP 200, foreign Origin HTTP 403. Application secrets were not read or changed. Browser profiles are origin-scoped: the new URL starts with its own localStorage; records from the old URL are not automatically transferred.

1. Install Node 24, run npm i, then npm run typecheck, npm run build, npm run check-content and npx tsx scripts/worker-tests.ts.
2. Authenticate with `npx wrangler login`.
3. Set GROQ_API_KEY using npx wrangler secret put GROQ_API_KEY. Set LLM_MODEL using npx wrangler secret put LLM_MODEL to a model enabled in your Groq account. Hunt falls back locally without both. Ask can use the existing Cloudflare AI binding without a Groq key.
4. `wrangler.jsonc` lists the MyPal URL and development origins in `ALLOWED_ORIGINS`. Add any owned custom production origins explicitly, comma-separated, without trailing slashes.
5. For local development only, set ALLOWED_ORIGINS in .dev.vars to the exact localhost origins printed by Vite (for example http://localhost:5173 and http://127.0.0.1:5173), plus production if needed. An empty configured value allows no browser Origin. .env.example lists names only, not secrets or defaults.
6. WORKERS_AI_MODEL is optional. Verify the AI binding and model availability in your Cloudflare account. Configure secrets as Worker bindings, never client VITE variables.
7. Run `npm run build` and `npx wrangler deploy --keep-vars` to preserve dashboard variables. Verify `/api/health` and run `node src/screens/flow.check.mjs` with `FLOW_SITE_URL` set to the deployment URL and Playwright available.

## Manual follow-up
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

## MyPal audio deployment — 2026-11-15 (Asia/Qyzylorda)

Source main: 328aeb5. Cloudflare version: 7be61eba-41b4-4b73-a357-c64ab4f64f0a. Published with wrangler deploy --keep-vars; secrets were not read or changed. Existing site URL is unchanged.

Regenerated all seven MyPal clips with Piper 1.8.0 / en_US-hifi_tts_92-medium and updated durations. Local Whisper tiny.en recognized “my pal” in all seven. Production title, description, Open Graph and Splash heading/aria show MyPal. All seven production MP3 hashes match local files and decode in Chrome. Typecheck, build and check-content --require-audio passed (139/139 clips).

Rollback: inspect npx wrangler deployments list and run npx wrangler rollback VERSION_ID for the intended previous version. Previous recorded version bd1e316d-3ac9-4250-906d-a30cb3a68da2 restores older frontend/branding/audio as well; prefer a corrected forward deploy. Verify the site and origins afterwards.

## Pending host naming release

Prepared only; do not deploy until the user explicitly says “деплой”. The host is MyPal and addresses children as pal. The dedicated CONTINUE clip is common_setup_greeting. See MYPAL_HOST_HANDOFF.md for frontend integration and the regenerated clip list. Keep the current MyPal production URL, legacy URL and localhost in ALLOWED_ORIGINS. Frontend text/flow integration is owned by agent 2.

## MyPal host UI published — 2026-11-15

Source: b1e0868. Version: 50fbd38f-a3f4-4f5f-8a91-84112576fe2c. Published after explicit user approval, using --keep-vars; secrets unchanged. Frontend host strings and accessibility labels use APP_NAME; internal component/CSS names are retained. CONTINUE starts common_setup_greeting when sound is enabled and opens Parent Setup without waiting for audio. Forced welcome with a saved profile also opens Parent Setup.

Local and production Chrome tests passed at 390px and 1280px: exact greeting, Parent Setup, MP3 request and AudioBufferSourceNode start. Muted and missing-clip scenarios preserve navigation. Typecheck, build, content (140/140 clips), Worker/FAQ tests passed. Preview greeting: https://mypal.tarlan-b06.workers.dev/?welcome=1. This supersedes the pending frontend handoff above.

## Pending audit release — 2026-11-15

**Not deployed.** The audit branch is based on `main` (`85db5da` before audit commits). Historical version records above are not proof of the currently active deployment. The audit adds asset routing/security headers, private-path 404s, question-only Ask payloads, a seven-second cloud-answer budget, SEO metadata, smaller lazy-loaded bundles and interaction/accessibility fixes. The visual design and normal product copy are retained. See `AUDIT.md` for exact checks and limits.

### Release checklist (only after approval)

1. `git pull --rebase origin main`; stop on conflicts rather than overwriting another agent's work. Record `git rev-parse HEAD`.
2. `npm ci`, then `npm run typecheck`, `npm run lint`, `npm run build`, `npm run check-content`, `npm run check-sketch`, `npm run check-space` and `npx tsx scripts/worker-tests.ts`.
3. Start `npm run preview`. Set `SMOKE_URL` to the printed local URL and `SMOKE_MOCK_API=1`; run `npm run smoke`. The built Worker preview must be restarted after every build, because its asset index is fixed at startup.
4. Record the currently active version with `npx wrangler deployments list` and available rollback versions with `npx wrangler versions list`. Do not assume a historical UUID below is still the correct rollback target.
5. Verify `ALLOWED_ORIGINS` includes `https://mypal.tarlan-b06.workers.dev`, the legacy `https://mission-control.tarlan-b06.workers.dev`, and `http://localhost:5173`. Local preview on another port needs that exact Origin if using real APIs. Never use a wildcard.
6. Deploy the built frontend and Worker together: `npx wrangler deploy --keep-vars`. The owner manages `GROQ_API_KEY` and `LLM_MODEL`; do not read, print or replace them. The existing AI binding remains unchanged. If the dashboard allowlist differs, update only `ALLOWED_ORIGINS` explicitly while preserving other variables.
7. Record the new Worker version ID and source hash here. Verify HTML, `/privacy`, `/api/health`, private-path 404s, HTTP→HTTPS and headers. Rerun Lighthouse and `npm run smoke` against production. Run rate-limit/failure injection tests locally, not against children using the live demo.
8. Check one real microphone interaction, audio playback, YouTube playback and link previews on actual phones/Telegram/WhatsApp. Those external interactions cannot be certified by mocked Chromium tests. Review provider retention/consent before a public child-facing launch.

### Roll back this future release

Use `npx wrangler rollback <PREVIOUS_VERSION_ID>` with the version recorded immediately before deployment, then confirm the active version with `npx wrangler deployments list`. Repeat health, asset, CORS and playback checks. Rollback restores that version's Worker/assets/configuration; it may also restore the old missing security headers or broader Ask payload. Confirm the allowlist again, preserve secrets and do not reset Git main.

### Operational caveats

- `run_worker_first: true` and the `ASSETS` binding are needed for consistent headers and private-path routing. `not_found_handling: "404-page"` serves the checked-in friendly 404; `/privacy` is explicitly routed by the Worker.
- CSP intentionally only blocks embedding this app (`frame-ancestors 'none'`). It does not block YouTube, voice models or scripts. `/assets/worker-*.js` retains the voice-model `no-referrer` exception.
- Hash-named assets receive immutable cache headers. Compression is handled by Cloudflare; verify live response headers after release.
- Keep Worker source maps outside the `dist/client` asset directory. `.assetsignore` prevents private files/maps being uploaded as public assets.
- The built-in local Explorer and remote-AI warning are development tooling, not production features. Browser audit API calls are mocked to avoid provider usage.
- No external uptime monitor is configured. `/api/health` is available for a future UptimeRobot/other monitor; do not advertise an unconfigured status page.
