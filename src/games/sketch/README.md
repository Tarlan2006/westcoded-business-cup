# Sketch Artist — reusable game module

An original drawing mystery for ages 6–8. The only playable case is **The Wall-Climber**, featuring **Gecko Hero**. The site now offers it in **Learn → Sketch Artist** for ages 6–8. The game and its styles load on demand; the host wrapper handles speech, navigation and XP. The independent dev preview remains available and is not included in production.

## Preview

From the repository root, with Node.js 24 and the existing dependencies installed:

```sh
npm run dev
```

Open **http://localhost:5173/dev/sketch-preview.html**. Add `?text=1` to test without speech. The preview uses installed local English `speechSynthesis` voices only. If none is available, clues remain readable and a friendly audio message appears. The Back and Done callbacks display a message in the preview; Done includes the awarded XP.

The existing site's Cloudflare Vite plugin may require `npx wrangler login` to start `npm run dev`, even though this game does not use Cloudflare. To preview just the game without signing in, run the following from the repository root. It starts a separate Vite process using already-installed packages, without changing any configuration file:

```sh
node --input-type=module -e 'import { createServer } from "vite"; import react from "@vitejs/plugin-react"; const server = await createServer({ configFile: false, plugins: [react()], server: { host: "127.0.0.1", port: 5174, strictPort: true } }); await server.listen(); server.printUrls();'
```

Then open **http://127.0.0.1:5174/dev/sketch-preview.html**. Stop the server with Ctrl+C. In this Windows workspace, the parent folder's `terminal.cmd` makes the portable Node/npm installation available.

## Checks

No extra packages or package.json scripts are required for the scorer:

```sh
node src/games/sketch/scoreSketch.check.ts
# Equivalent project command:
npm run check-sketch
# If needed on an earlier Node release:
node --experimental-strip-types src/games/sketch/scoreSketch.check.ts

npm run typecheck
npm run build
npm run check-content
```

The synthetic checks cover blank, identical, approximate/shifted, flooded, wrong-color, transparent, almost-white and differently sized images; they also cover the checklist formula, reward cap, encouragement floor and failed-reference fallback. All 15 checks pass. The approximate fixture scores 85%; unrelated blue marks score 23%.

`browser.check.mjs` is an optional developer harness, separate from the game. It uses an **existing** Playwright installation; do not add it as a project dependency for this module. Start the preview server first, then:

```sh
node src/games/sketch/browser.check.mjs
```

If Playwright is supplied by your tools, set `SKETCH_PLAYWRIGHT_MODULE` to its absolute `index.mjs` path. Set `SKETCH_CHROME` to an installed Chrome executable if needed, and `SKETCH_PREVIEW_URL` if using a URL other than the default port 5174 preview.

The harness verifies the complete desktop and touch flows, 24-step Undo, erasing, confirmed Clear, resize preservation, all six clues, immediate Done availability, live checklist/XP, valid PNG download, replay, blank/flood safeguards, optional speech, Back and failed SVG decoding. It checks 48px controls, two toolbar rows at 360/390px, no horizontal overflow, no gameplay HTTP requests and no local/session storage writes. Initial Vite module loading and its development WebSocket are not game network activity.

Screenshots of intro, drawing and reveal at **390px** and **1280px**, plus the machine-readable report, are in [`screens/`](./screens/). Mobile drawing was tested using Chromium touch events at DPR 2. Physical iPhone/Safari testing has not been performed. Reduced motion was enabled during these checks.

`integration.check.mjs` uses the same optional Playwright environment to test the production site at `http://127.0.0.1:5175` (override with `SKETCH_SITE_URL`). Run `npm run build`, serve `dist/client`, then execute `node src/games/sketch/integration.check.mjs`. It verifies age gating, lazy JS/CSS loading, speech replacement/mute/cleanup, the reward screen, persistence and duplicate-click protection at 390/1280px. Its screenshots and report use the `site-` and `integration-` prefixes in `screens/`. Only XP and activity progress enter the host's normal storage; drawings remain private and in memory.

## Design and scoring

- The canvas keeps vector strokes in memory and replays them when its size/DPR changes. Mouse, pen and touch use Pointer Events and pointer capture; drawing has `touch-action: none`. Undo has no fixed step limit. Clear is explicitly confirmed. PNG export uses `toBlob`.
- The reference is an inline original SVG. It is rasterized into an ordinary hidden canvas at the drawing's pixel dimensions using a local data URL. No OffscreenCanvas is used. Both images are area-averaged into a 32×40 grid with alpha composited onto white, then classified into empty/green/yellow/other buckets using HSV.
- Automatic score: `100 × (0.6 × coverage + 0.4 × precision)^0.8`, with a two-cell circular search radius. Coverage requires the same color bucket; precision requires a nearby nonempty reference cell. `scoreSketch().match` equals its automatic `colorsAndShape` score because the pure function receives no checklist.
- Displayed match: `round(0.5 × colorsAndShape + 0.5 × exactChecklistPercentage)`. The checklist percentage is rounded only for display. `sketchResult` applies the blank/flood safeguards to this final value too: empty stays 0%, a >70% single-bucket flood stays at most 25%. Five non-eraser strokes give a minimum 10% for a nonempty picture. Undo removes strokes from this count; Clear resets it.
- If the reference cannot be decoded, match uses the checklist alone, retaining blank/flood protections. XP is `round(match / 100 × 24)` plus 4 when every clue is checked, capped at 28. The all-checked bonus follows the child's checklist even when the drawing is empty; the blank match still stays 0%.
- The score is playful self-assessment, not image recognition or a measure of artistic ability. Text and all essential controls work without speech.

## Isolation and adding cases

Runtime imports stay inside this folder or React. `preview.tsx` additionally imports the already-installed `react-dom/client` solely to mount the dev page. The optional browser harness uses Node built-ins and an external test runner; it is not imported by the game.

Add a case to `cases.json`, create its original SVG with a `0 0 400 500` viewBox and white background in `art/`, then register its case ID in `art/index.ts`. The clue/checklist lengths and case selection are data-driven. Replay selects a different case when alternatives exist. A missing SVG gracefully falls back to the checklist. No game-logic changes are needed.

The local `.gitignore` intentionally excludes this folder from Tailwind v4's automatic scanner, which otherwise turns words in game code into site-wide utilities. These files are tracked with `git add -f`; tracked edits can use `git add -u`. Force-add **only the new intended files** when extending the module. Keep this exclusion: the game uses ordinary imported CSS with `sk-` class names and theme-variable fallbacks, not Tailwind utilities.

The game never calls a network API, requests device permissions, or writes a drawing to browser storage. Pixel data and strokes live in memory until replay/unmount. Only **Save my picture** downloads a PNG. The host controls any behavior of a supplied `speak` callback.

See [INTEGRATION.md](./INTEGRATION.md) for the implemented site connection.
