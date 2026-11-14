# Site integration

Sketch Artist is now connected to the site's Learn section for ages 6–8. The game module still has no host audio, state or screen imports. The connection is implemented as follows:

1. `Activity` in `shared/types.ts` includes `"sketch"`. The game's props do not import the shared type.
2. `src/App.tsx` has a `sketch` screen with a unique session ID, age checks on launch and render, and `earn(id, "sketch", points)` on completion. Back returns to the activity hub without awarding XP.
3. `src/screens/Sketch.tsx` loads the game with `React.lazy` and `Suspense`. The game's CSS is in a separate lazy asset. The loading state includes a working Back button.
4. The wrapper supplies a stable speech callback using `stopSpeech()` then `speakFallback(text)`. It stops speech on replacement, mute, Back, Done and unmount. A per-game **Clue audio on/off** control omits `speak` when muted; XP is shown from the host's existing context. No shared sound preference exists in the current profile format.
5. `src/screens/Home.tsx` uses lightweight `sketchGameMeta` from `meta.ts` for the Learn card and age eligibility. `index.ts` re-exports the same metadata to preserve the public API. The barrel is not eagerly imported for the card.
6. `npm run check-sketch` runs the pure Node scoring checks. No dependencies or lockfile changes were required. There is no existing repository CI workflow; include this command if CI is added later.
7. `integration.check.mjs` verifies the production host at 390/1280px: age gating, lazy loading, speech controls, completion, persisted XP exactly once even on a duplicate click, and Back without reward. The standalone checks also cover 360px and touch input. Physical iPhone testing remains manual. The Tailwind scanner exclusion stays in place because the module uses its own scoped CSS.
8. `dev/sketch-preview.html` and both browser test harnesses remain development-only. The production entry does not include the preview. The module makes no API calls or uploads; the host persists only its ordinary activity/XP progress, never the picture.

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

The site enables Cloudflare AI in its Vite plugin, so its normal dev server may require Cloudflare login. The game itself does not need it; the fallback preview command is in [README.md](./README.md). No Cloudflare, Vite, audio-engine or reward-storage changes were needed for this integration.
