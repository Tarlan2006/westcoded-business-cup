1. Add `balloons` to the host's Activity type and age-appropriate Learn list using `balloonsGameMeta`; this change is not included here.
2. Lazy-load with `const BalloonsGame = React.lazy(() => import("../games/balloons"))` inside a Suspense boundary.
3. Render `<BalloonsGame ageGroup={ageGroup} onBack={goBack} onComplete={(points) => earn(id, "balloons", points)} speak={speak} />` with a unique activity session ID.
4. Allow ages `3-5` and `6-8` only; key by session ID for a fresh game. The module already resets when ageGroup changes.
5. Back and Home both invoke onBack because the public contract has one navigation callback; the header XP counts this game's earned XP, not profile XP.
6. Keep the existing AIdos/Mascot and GameUI components available. The module supplies scoped CSS and bundled fonts; host audio is optional and no audio/network API is called by the game.
7. Add `npx tsx src/games/balloons/check.ts` to CI if desired; run the optional browser/build checks from README. Do not include the dev HTML in production build inputs.
