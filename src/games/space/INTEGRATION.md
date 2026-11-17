# Connect Space Scale to AIdos

The module can run via `dev/space-preview.html`. Follow these steps when adding it to the production app.

The current site connection is implemented in `src/screens/Space.tsx`. It shows the shared `ActivityHeader` outside Suspense, including Back/Home, breadcrumb, profile XP and fact audio control. Both SpaceGame and SpaceViewer receive `header={null}`. Their optional `header?: ReactNode` prop replaces the module header; omitting it preserves the standalone header. The journey's Previous stop control changes the object, while the shared Back leaves the module. `src/screens/navigation.check.mjs` verifies both age modes and every hosted stage at 390/1280px.

1. Add `"space"` to `Activity` in `shared/types.ts`. The existing `rewardActivity` handles new activity keys. Review any new exhaustive maps when merging.
2. In `src/App.tsx`, add a `{ name: "space"; id: string }` screen and a launcher that uses `crypto.randomUUID()`. Use a stable ID throughout one session. Gate the route to ages 3–5 and 6–8.
3. Lazy-load the game and viewer. Choose `SpaceViewer` for ages 3–5 and `SpaceGame` for ages 6–8. Pass the existing Back callback and send the Done callback to `earn(id, "space", points)`. Cancel host speech on route exit and omit `speak` if audio is muted. The type of `speakFallback` already matches the optional prop.

```tsx
import { lazy, Suspense } from "react";
import { speakFallback } from "./audio/engine";

const SpaceGame = lazy(() => import("./games/space").then((m) => ({ default: m.SpaceGame })));
const SpaceViewer = lazy(() => import("./games/space").then((m) => ({ default: m.SpaceViewer })));

// In the guarded space screen, using the host's profile and session ID.
const Game = profile.ageBand === "3-5" ? SpaceViewer : SpaceGame;
return (
  <Suspense fallback={<p>Opening Space Scale…</p>}>
    <Game key={id} onBack={goHome} speak={speakFallback} onComplete={(p) => earn(id, "space", p)} />
  </Suspense>
);
```

4. Pass an `onSpace` callback to the Hub and add a Learn tile for both age bands. Use the values from `spaceGameMeta`. If the Hub needs an eager metadata import, move the metadata to a lightweight file in the module and re-export it from the barrel so the game stays lazy.
5. Add `"check-space": "node src/games/space/scale.check.ts"` to `package.json` and wire it into the existing checks if needed. Dependencies already cover the game.
6. Keep `dev/space-preview.html` and its mount script out of production inputs. The lazy module loads its own `space.css`. It reads host theme variables and supplies defaults.
7. After integration, test touch and keyboard controls, reduced motion, age gating, Back from each stage, reward deduplication and a full run with speech disabled. Check the sidebar or app wrappers at small widths so the sticky scene still has space.
