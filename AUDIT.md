# MyPal release audit

Audit started 2026-11-15. Baseline: `85db5da`; final audit also includes upstream `827684f` (locked-game chains) and `06506e2` (preschool video replacement). No deployment is authorized in this task.
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
| SEC-01 | P1 | HTTP serves the site without redirecting to HTTPS | Fixed locally; HTTPS redirect regression tested, production unchanged |
| SEC-02 | P1 | Missing browser security headers on HTML and API responses | Fixed locally; HTTP checks pass |
| ROUTE-01 | P1 | Unknown paths, `.env`, `.git/config`, source-map requests return app HTML 200 | Fixed locally; private probes and unknown pages return 404 |
| PRIV-01 | P1 | Ask sends age/topics/history as well as the question | Fixed; Ask sends question only, browser sentinel checks pass |
| API-01 | P1 | Sequential cloud fallbacks can exceed the total 8-second budget | Fixed; seven-second total cloud-answer budget, mocked timeout tests pass |
| SEO-01 | P2 | Missing canonical/social metadata and discovery files | Fixed locally; real messaging preview pending deployment |
| PERF-01 | P2 | Main JS exceeds the requested ~93 KB gzip target | Fixed; final gzip is below baseline (see final measurements) |
| QA-01 | P2 | Existing browser checks predate current session/Parents dialog behavior | Added npm run smoke, screenshots and repeat checks |
| CLEAN-01 | P2 | Knip reports manual test entrypoints and apparent unused exports | Reviewed; proven dead code removed, uncertain/manual entrypoints retained |

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

## Stage 4 — interaction, accessibility and upstream merge

| ID | Priority | Finding | Resolution |
|---|---|---|---|
| UI-01 | P1 | Greeting CONTINUE outside the viewport on a short landscape screen | Welcome panels now grow/scroll naturally instead of trapping content in a fixed viewport |
| UI-02 | P1 | Home covered by XP when text is enlarged | Header controls wrap rather than overlap |
| UI-03 | P1 | Large text overflows Mission pause controls, reward card and Tic-tac-toe score | Wrap controls/text and constrain the reward card to its container |
| AGE-01 | P1 | 3–5 science preference recommends Space despite its 6–8 availability | Recommendation now respects age; browser regression checks Start here |
| A11Y-01 | P1 | White/pale Sketch caption on pale reference card | Reused existing dark ink for readable contrast; card/art palette retained |
| UI-04 | P2 | Sketch intro exceeds tablet width due to rotated art and grid minimums | Constrained grid tracks and gave the rotated cover an 8px inset |
| A11Y-02 | P2 | Small sound/header/video controls; missing h1 on Space stages | Minimum 44px targets and semantic headings, without changing wording/type sizes |
| A11Y-03 | P2 | Accessible button names omit visible wording | Natural button names plus supplementary description; visible text retained |
| DEP-01 | P1 | High-severity tmp advisory via development patch-package | Compatible lockfile update to patch-package 8.0.1; npm audit now reports zero vulnerabilities |

The newest main added steel chains and a 550ms rattle before opening MyPal Plus. Pull/rebase succeeded, but applying autostash conflicted in `GameUI.tsx`. Work stopped; the user explicitly authorised the merge. The upstream `Chains` component, all animation CSS, timer cleanup, repeat-tap guard and reduced-motion immediate action are retained. The old direct-click handler and emoji-lock markup from the stashed version were discarded in favour of main. Accessibility uses the visible title/description as the button name and `aria-description` for the locked state. No chain logic was removed. `useId` was removed only because the unused Segmented component was deleted; the animation's `useEffect/useRef/useState` remain.

The shared Chip component was retained: TypeScript showed that the standalone Balloon preview imports it, despite Knip marking it unused. The initial deletion was reversed before committing. This is why static-analysis output was reviewed rather than applied mechanically.

## Stage 5 — cleanup and reproducible checks

Removed confirmed unused code:

- `Segmented`, `StarProgress`, `CountdownRing` in `GameUI.tsx`.
- Old `RocketArt` SVG in Space; the active artwork and mascot remain.
- Unused `onVolumeChange` observer loop and its now-unused state in the audio engine. The playback graph, microphone and voice generation are unchanged.
- Unused `topicsFromInterests` / `interestsFromTopics` converters.
- Unnecessary exports of internal voice settings, preference arrays/type, animal list, premium features and recorder duration constant.

Retained deliberately:

- All 143 manifest-backed MP3 clips; all four mascot poses and 2× variants; fonts/icons/share image/voice reference.
- Original `docs/design/**` and authoring assets: these are source material, not abandoned public assets.
- Standalone preview entrypoints and manually invoked regression scripts. Knip does not infer every dev HTML or manual test entry.
- Ignored `.cache` files that Knip saw locally: not tracked, not deployed, not part of cleanup commits.
- Compatibility Worker exports/contracts and some old CSS selectors where removing them could affect manual previews or another agent's design. No blanket CSS purge or design-token rewrite was attempted.

[Knip raw results](docs/audit/knip-before.json) contain 33 issue records, mostly entrypoint/export findings and ignored cache artifacts; no unused dependency package was reported. The [final Knip run](docs/audit/knip-after.json) has 29 remaining issue records and zero dependency findings; the remaining records are documented manual entrypoints/exports, not a claim of a zero-warning Knip run. TypeScript unused-local/parameter checks pass for client and Worker. `npm run lint` explicitly means those TypeScript checks, not ESLint. Playwright is a development-only dependency for `npm run smoke`. The normal pocket-tts patch reapplied successfully after dependency updates. [Dependency audit](docs/audit/dependencies-after.json).

## Final verification and evidence

- Build, client/Worker typecheck, lint, content, Sketch scoring, Space scale checks and mocked Worker/FAQ suite pass. Content: 132 lines, 48 tasks, 27 quiz questions, 30 FAQ answers, 143/143 clips. Worker tests include injection, privacy fields, profanity, empty/long input, upstream failures/timeouts, STT, CORS, limits and routing. FAQ checks cover 90 question formulations plus collision regressions.
- [Normal browser report](docs/screens/smoke-report.json) and [screenshots](docs/screens): 390×844, 768×1024, 1280×900 and 844×390. Tests assert one visible h1, no horizontal overflow, minimum 44px interactive areas (including enclosing labels), no uncaught JavaScript exceptions, no private-note/nickname sentinel in API bodies, and Ask's question-only payload.
- Full path: Greeting → mandatory nickname validation → timed session → video embed → quiz → Complete → Hub → Garage → Memory/Tic-tac-toe/Space/Sketch → PNG download → Plus plans → Hunt/pause/result → Ask → denied microphone → offline fallback → session expiry/reload → Setup again → 3–5 science/balloons → 1–2 cinema → Privacy → 404.
- All three locked cards are checked with motion enabled at every viewport (12 animation checks). The script asserts `data-rattling`, `chains-rattle`, and arrival at Plans. Music Band uses Enter; reduced motion is also checked. Open games are exercised with a real click/drawing export, not merely inspected for their presence.
- [Large-text report](docs/screens/large-text/smoke-report.json): same path at 390×844 with root text size 200%. This simulates enlarged CSS text; it is not proof of native iOS Dynamic Type behaviour.
- Console resource failures are intentional in this suite: one mocked 503, one offline request and the explicit 404 visit per viewport. They are retained in reports, not misrepresented as a literally empty console. No application runtime exception is expected or accepted.
- [HTTP and bundle checks](docs/audit/after-http-bundle.json): expected 200/404, security headers, own/legacy/dev Origin accepted, foreign Origin 403, bounded 40-request **local** rate-limit test includes 429 and Retry-After. API responses are no-store; hash-named assets are immutable. Public HTTP→HTTPS is covered by Worker tests; no production deployment occurred.
- Every manifest MP3 was fetched successfully from the built local Worker. [Media checks](docs/audit/media-after.json) decode greeting and a Hunt clip in Chromium, verify the 1200×630 OG image and local fonts. This verifies decoding, not listening quality on physical speakers.
- [Source scan](docs/audit/source-scan.json): 129 tracked text files scanned; no tracked private env files or credential-pattern matches. Built JS has no console.log, debugger, localhost URLs, old production-host URLs or matched secret patterns. No secret value was read or printed. Pattern scans cannot prove absence of every credential format.

### Performance and SEO

Baseline and final build figures use the same measurement methods. The baseline predates upstream's new chains; the final includes them. Garage, Privacy and secondary screens are loaded lazily. The final Vite main bundle is **93.09 KB gzip**, versus **96.70 KB** before; this is approximately the requested 93KB target. Node zlib measurements are recorded independently in the JSON reports; do not mix those numbers with Vite's estimator. No functionality was removed to reduce size.

Lighthouse mobile navigation results (P / A / BP / SEO):

| Page | Before | After |
|---|---|---|
| Home | 99 / 100 / 100 / 92 | 85 / 100 / 100 / 100 |
| Privacy | 99 / 100 / 100 / 91 | 88 / 100 / 100 / 100 |

[Home report](docs/audit/after-home.report.html) · [Privacy report](docs/audit/after-privacy.report.html). All requested score thresholds are met. Performance declined despite a smaller initial bundle: measured LCP is 4.3s (home) and 3.9s (privacy), versus 1.6s/0.9s before. The timed welcome transition and extra lazy Privacy request are likely contributors; this is an inference, not a traced causal proof. FCP is 1.3s on both pages, TBT 0ms/0ms, CLS 0.002/0.015. We retained the welcome/design rather than hiding its timing from Lighthouse. A future optimisation should measure the trade-off between lazy Privacy and its first-load latency.

Final Node gzip: **92,238 bytes (90.08 KiB)** versus **95,810 bytes (93.56 KiB)** baseline, using the same compressor.  Internal-screen snapshot results are in [state-accessibility.json](docs/audit/state-accessibility.json): Setup, Video, Hub, Ask and Sketch reveal each score **A100 / BP100 / SEO100**. Snapshot mode does not provide navigation Performance scores; it would be misleading to invent them.

The requested SEO scanner improved from **48/100, two errors** on the initial production version to **80/100, zero errors** on the local audited build: [before](docs/audit/seo-before.md), [after](docs/audit/seo-after-local.md). For the after run, an explicit test sitemap mapped `/` and `/privacy` to the local preview; the real canonical/social URLs were left pointing to production. Otherwise the scanner follows the production sitemap and audits the old deployed site. Remaining warnings include a short brand title, thin static SPA shell, JS-only links, trailing-slash variants, missing HSTS and local-vs-production canonical/sitemap mismatch. The scanner's 80 is not the Lighthouse SEO score. We did not change product copy or add fake SEO content just to inflate it.

### What remains / honest limits

| Priority | Item | Why it remains |
|---|---|---|
| P2 | Production verification of this release | Deployment explicitly prohibited until the user says “деплой”; production still serves earlier code |
| P2 | Real iPhone/Safari, system text settings, safe-area notches | Chromium viewport/touch/reduced-motion tests available; physical device testing not available in this run |
| P2 | Actual microphone speech, provider success and voice quality | Tests use denial/mocks; no private recordings, paid calls or secret changes were performed |
| P2 | YouTube playback and real end-of-video behaviour | Smoke validates embed and app progression, not third-party playback; network policies/browser autoplay can differ |
| P2 | Telegram/WhatsApp share previews | Metadata and dimensions checked; requires real messaging-client/cache checks after deployment |
| P2 | Full fresh-launch offline support | No service worker; graceful offline recovery is tested on an already loaded app |
| P2 | Host-reference provenance retains the old product phrase | `content/voice/host-voice.json` accurately transcribes the approved old source recording; it is not UI copy. No old name was found in active UI/Worker/content prompts or deployed client JS. Replacing the reference requires separate voice approval; falsifying its transcript would be wrong |
| P2 | Provider retention/child consent and distributed quotas | Prototype has per-isolate limits and no app payload logging; not COPPA certification or a globally enforced quota |
| P3 | HSTS/custom-domain hardening and static SEO warnings | Not claimed fixed; inspect Cloudflare policy after deployment and consider SSR only if public search traffic matters |
| P3 | Uptime monitoring | Health endpoint exists; no external monitor/account configured, so no fictional status link |

No design-original files or Cloudflare secrets were changed. README now describes the audience, working product, proposed $18/month or $144/year model, and limitations honestly: premium games/checkout/progress emails are not implemented. Deployment docs describe the pending release and rollback using the version captured immediately before a future deployment, rather than a stale hard-coded version.

## Final synchronisation

The last pull brought `06506e2`, replacing the 3–5 video with a dinosaur video. It merged without conflicts. Build, typecheck, lint and content checks were rerun; its long title was checked on all four viewports with no overflow ([evidence](docs/screens/new-main-video.json)). The full 120-state/12-chain smoke plus the 30-state/3-chain enlarged-text run passed before this isolated data replacement; the changed video received the targeted repeat. Final bundle/HTTP and navigation Lighthouse reports were refreshed after it. There are 154 screenshot artifacts (120 normal, 30 enlarged text, four new-video checks).

No release or Cloudflare secret change was performed. Commits are local; this audit does not claim a push or deployment. The conflict-recovery autostash remains as a safety copy.
