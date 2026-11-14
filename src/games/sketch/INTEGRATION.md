# Deferred integration — not implemented here

Only `src/games/sketch/**` and `dev/sketch-preview.html` were added or edited for this module. A separate integration change should perform these eight steps:

1. Add `"sketch"` to `Activity` in `shared/types.ts`. Check any exhaustive activity maps or switches in the host; do not change the game's props to import the shared type.
2. Add a route and screen wrapper in `src/App.tsx`, reachable from Learn for ages `6-8` only. Keep its lifecycle separate from other games; unmount on Back and after completion.
3. Lazy-load the named export with `React.lazy` (or the named `lazy` import) and wrap it in `Suspense`. The game imports its own CSS; no import in `src/index.css` is needed.
4. Pass `speak={speakFallback}`, `onComplete={(p) => earn(id, "sketch", p)}` and the host's `onBack` callback. Import `speakFallback` from `src/audio/engine` in the **wrapper only**. Use the existing stable activity/session `id`. The game awards nothing by itself and emits Done only once per play; keep the host's reward deduplication too. Cancel host speech on route exit and when replacing an utterance. Respect the host's sound preference by omitting `speak` when muted.
5. Add a Learn card for ages `6-8` using `sketchGameMeta` (`id`, `title`, `description`, `icon`, `ageBands`, `activity`). To keep the game genuinely lazy, don't eagerly import the barrel solely for metadata: dynamically load metadata or move a shared copy into a lightweight metadata file in a later integration change.
6. Add `"check-sketch": "node src/games/sketch/scoreSketch.check.ts"` to `package.json` and include it in CI. No new package dependencies or lockfile changes are needed.
7. Check the host's theme and global element rules at 360/390/1280px, text-only behavior, navigation from every screen, repeated reward prevention and actual iPhone touch/PNG behavior. Keep the module's scoped CSS. Keep the local `.gitignore` scanner exclusion unless a deliberate Tailwind integration requires removing it; the module uses no Tailwind utilities. Add no camera/microphone/network requirement. Any host speech provider must respect the product's privacy settings.
8. Keep `dev/sketch-preview.html` as a development-only entry, outside the Vite production inputs. Run typecheck, build, content and scoring checks, then repeat the preview flow and inspect Network. Do not wire the preview harness or its test runner into the production application.

Minimal wrapper usage (the wrapper supplies `id`, `earn`, `speakFallback`, `onBack`):

```tsx
import { lazy, Suspense } from "react";
const SketchGame = lazy(() => import("./games/sketch").then((m) => ({ default: m.SketchGame })));
<Suspense fallback={<p>Opening the case…</p>}><SketchGame speak={speakFallback} onComplete={(p) => earn(id, "sketch", p)} onBack={onBack} /></Suspense>;
```

Public contract, exported from `index.ts`:

```ts
interface SketchGameProps {
  onComplete: (points: number) => void; // 0–28, after the result screen
  onBack: () => void;
  speak?: (text: string) => Promise<void> | void;
}
```

The site currently enables Cloudflare AI in its Vite plugin, so its normal dev server may require Cloudflare login. The module itself does not need it; the isolated fallback preview command is in [README.md](./README.md). No Cloudflare, Vite, audio-engine or host-state changes were made here.
