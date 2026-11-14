# MyPal release audit

Audit started 2026-11-15. Baseline: `85db5da`. No deployment is authorized in this task.
Existing visual identity, colors, fonts and product copy are preserved. Error/404 copy and metadata are within scope.

## Method and baseline

- Local production build, Chrome, Lighthouse 13.6 mobile defaults; `/` and `/privacy` are the real addressable pages. Game screens are client state, not independent URLs.
- Reports: [home](docs/audit/before-home.report.html), [privacy](docs/audit/before-privacy.report.html), [HTTP and bundle evidence](docs/audit/baseline.json).
- Initial main JS: 321,500 bytes, Node gzip 95,810 bytes (93.56 KiB). Vite reports 96.70 KB using its compression settings. Compare like-for-like final measurements.
- Lighthouse before: home P99 / A100 / BP100 / SEO92; privacy P99 / A100 / BP100 / SEO91. These scores do not certify hidden application screens.
- `tsc --noUnusedLocals --noUnusedParameters` passed. Mocked Worker tests and 90 FAQ formulations passed.
- No tracked private `.env`/`.dev.vars`, private-key markers or Groq/OpenAI-shaped secrets were found. No secret values are included in the report. Pattern scanning is not proof that every possible credential format is absent.

## Findings

| ID | Priority | Finding | Status |
|---|---|---|---|
| SEC-01 | P1 | HTTP serves the site without redirecting to HTTPS | Confirmed on current production; fix pending |
| SEC-02 | P1 | Missing browser security headers on HTML and API responses | Confirmed; fix pending |
| ROUTE-01 | P1 | Unknown paths, `.env`, `.git/config`, source-map requests return app HTML 200 | No leaked content; proper 404 pending |
| PRIV-01 | P1 | Ask sends age/topics/history as well as the question | Remove unnecessary context per audit requirement; verify Network |
| API-01 | P1 | Sequential cloud fallbacks can exceed the total 8-second budget | Total deadline pending |
| SEO-01 | P2 | Missing canonical, description/image Twitter metadata, robots and sitemap; share image is square | Pending |
| PERF-01 | P2 | Main JS exceeds the requested ~93 KB gzip target | Lazy loading review pending |
| QA-01 | P2 | Existing browser checks predate current session/Parents dialog behavior | Add reproducible full smoke and screenshots |
| CLEAN-01 | P2 | Knip reports manual test entrypoints and apparent unused exports | Review reachability before deleting |

## Constraints and follow-up

- Production is read-only during this audit; after-fix checks use the local built Worker and browser. Production verification must be repeated after a separately authorized deployment.
- No Cloudflare secrets are read or changed. External model success cannot be guaranteed without a paid-provider test; failure paths use mocks.
- Telegram/WhatsApp preview delivery requires external account interaction and may retain old cache. Validate metadata/image locally; record messaging-client verification separately.
- Do not delete original design sources or recorded clips merely because static analysis misses dynamic registries.

Further stage results, screenshots, scanner output, cleanup decisions and before/after measurements will be appended here.

## Stage 2 — security, privacy and routing

- SEC-01/02 and ROUTE-01 fixed locally: all requests pass the Worker, HTTPS redirect on public workers.dev hosts, nosniff/referrer/frame/permissions headers, explicit 404 for private-file probes and missing APIs. A friendly static 404 uses the existing palette and mascot. CSP only sets `frame-ancestors 'none'`; it does not restrict media/script sources.
- The existing voice-worker `Referrer-Policy: no-referrer` exception is retained because model downloads require it. Camera/geolocation disabled; microphone restricted to self.
- PRIV-01: `/api/ask` now sends `{question}` only. Removed client conversation history transmission. Structured Hunt candidates and optional STT audio remain necessary API inputs; the instruction “only question” cannot literally apply to STT/game-turn endpoints. Parent notes/nickname are not included.
- API-01: total cloud-answer fallback deadline is seven seconds. Existing friendly 200 refusal/empty-speech bodies remain intentional, backwards-compatible successful safe responses; malformed turn requests, oversized requests, foreign origins, rate limits and missing APIs use 4xx/5xx.
- Worker regression tests pass, including private paths, HTTPS redirect, header policy, ignored parent context, injection, CORS and mocked provider failure. Typecheck/build pass. No Cloudflare settings/secrets or production deployment changed.
- SEO scanner before: 48/100, two errors and eight warnings; [full report](docs/audit/seo-before.md). External scanner timestamps follow its UTC clock; this audit uses the user's local date.

## Stage 3 — metadata and loading

- Added canonical, OpenGraph description/type/URL/dimensions, Twitter large card, robots and sitemap for the two actual public URLs. Internal games are intentionally not advertised as nonexistent routes.
- Generated `public/og-image.png` at exactly 1200×630 from existing mascot art, brand palette, font and greeting. No new visual identity. Messaging-client cache refresh is not tested without those accounts.
- Privacy has server-rendered unique metadata for crawlers. App state changes update document title/description. Critical existing WOFF2 fonts are preloaded; existing `font-display: swap` remains.
- Plans, Parent Setup, mission Setup, Sketch/Space wrappers now load lazily. Main bundle drops from Vite 96.70 KB gzip to 93.26 KB at this stage. All game code and behavior are retained.
- Typecheck and build pass. HTTP headers/statuses were exercised against the built local Worker on port 5181.
