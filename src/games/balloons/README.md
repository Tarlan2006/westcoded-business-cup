# Balloon Count

A five-round counting game for ages 3–5 and 6–8. MyPal loads it from the Learn section. The standalone preview uses the same game.

## Preview

Run `npm run dev` and open `/dev/balloons-preview.html`. The development toolbar switches age group and displays Back/Done callback results. Speech is omitted by default; every instruction is visible as text. The preview uses React.lazy and loads a separate game chunk.

If the site's Cloudflare plugin needs authentication, the already-installed Vite and React plugin can serve the same isolated page without changing project configuration:

```sh
node --input-type=module -e 'import { createServer } from "vite"; import react from "@vitejs/plugin-react"; const s = await createServer({ configFile:false, plugins:[react()], server:{host:"127.0.0.1",port:5174,strictPort:true} }); await s.listen(); s.printUrls();'
```

Open `http://127.0.0.1:5174/dev/balloons-preview.html`. No dependency installation is required.

## Checks

```sh
npx tsx src/games/balloons/check.ts
# Node 24 can also execute the same test without downloading a runner:
node src/games/balloons/check.ts
npm run typecheck
npm run build
npm run check-content
node src/games/balloons/build.check.mjs
node src/games/balloons/browser.check.mjs
```

The browser harness uses an existing external Playwright installation. Set `BALLOONS_PLAYWRIGHT_MODULE` to its `index.mjs`, `BALLOONS_CHROME` to Chrome if needed, and `BALLOONS_PREVIEW_URL` to override the default port 5174 URL. It uses controlled browser time for countdown/fade checks. Its callback fixture deliberately supplies a throwing speech function to verify graceful failure.

`check.ts` covers 2000 seeds for each age, all supported counts, mobile/desktop bounds and spacing, color-neighbour diversity, all four quadrants, deterministic rerenders, different seeds, round progression, unique answer options and rewards. It checks both balloon heads and strings with envelopes that include tilt, full bob amplitude and marked rings. The minimum hit target stays 44px even if the illustrated balloon shrinks to fit a crowded stage. The sampler never drops a balloon; after unsuccessful placement it reduces size by 5% and tries another deterministic set of random candidates. Geometry is regenerated only for a new round or actual stage resize.

`build.check.mjs` writes an ignored `.build/` under this folder and checks that the isolated preview's game chunk is below 40 KB gzip. The React runtime and local font assets are separate.

The browser checks cover 390×844 and 1280×720, both ages, all five rounds, touch marking/renumbering, keyboard focus, timer and early submission, 400ms fade, correct/incorrect answers, all three final scores (8/20/28 XP), single delivery per run, replay, Back/Home, optional speech, reduced motion, no horizontal overflow and no storage/API/upload activity. Screenshots and a JSON report are in `screens/`. Physical iPhone/Safari testing remains manual.

## Design and boundaries

The supplied Claude artifact URL required sign-in. The user subsequently provided `balloon_count_design_reference.html` with all seven screens; `reference.css` follows its backgrounds, header, outlined XP chip, 470px mobile counting stage, separate 190px answer panel, answer buttons, footer bubble and final card. Interactive differences are intentional: rounds/counts/XP are real, positions are seeded and randomized instead of the sample's fixed positions, and the sample's 40px count button is raised to the required 44px minimum. The shared Bleep art is reused as requested. Disabled answer text is slightly brighter to preserve contrast. On the desktop, the count/next button is retained next to the scene so the playable flow has no dead end.

The module reuses the repository's `GameButton`, `Chip` (preview), and `Mascot`/Bleep without modifying them. Bleep is not playful, so its optional sound path never runs. Its existing `surprised` expression represents the requested friendly “oops” state. The game adds only scoped `.bl-` rules; Fredoka SemiBold/Bold and Nunito Bold/ExtraBold are bundled with their SIL Open Font Licenses under `fonts/` and loaded from local assets, never a font CDN.

There are no fetch calls, trackers, user fields, camera/microphone access, or storage writes. A host-provided `speak` callback controls its own behaviour. Result XP is `correct * 4 + 8`; duplicate answer/Done events are ignored. Play again starts a new run and allows one new completion callback. Back stops the timer even if a host keeps the component mounted.

The local `.gitignore` keeps Tailwind's scanner from interpreting game/test text as site utilities. Track intended new source, fonts, documents and screenshots with `git add -f`, excluding `.build/` and `.cache/`.

See [INTEGRATION.md](./INTEGRATION.md) for the host contract.
