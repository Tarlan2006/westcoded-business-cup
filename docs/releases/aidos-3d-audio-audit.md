# AIdos 3D and audio reliability

The user approved a procedural 3D interpretation with an approximate face. The actual Three.js meshes preserve the turquoise coat, gold oyu, cream shirt, boots, backpack and taqiya. Shoulder, elbow, wrist and head pivots animate independently; speech controls the mouth geometry. This replaces the former sprite-only motion. One WebGL context renders all placements into local canvases at up to 24 fps. Hidden/offscreen hosts stop updating; reduced motion freezes gestures. Devices without WebGL use the existing AIdos illustration.

## Audio findings and fixes

- The previous runtime downloaded a roughly 146 MB cloning model, then bypassed available recordings after it loaded. Synthesis awaited the complete first sentence and could compete with games for CPU. Runtime cloning and its downloads are now disabled. Existing recordings always take priority; dynamic text uses the installed browser voice. That voice can differ across devices and from the recordings.
- Electronic radio/countdown cues and routine tap/tickle chirps are suppressed. Reward effects are throttled and no longer share the speech queue or wait behind long prompts.
- A cancelled clip download could keep the next prompt waiting in the global promise queue. Cancellation now detaches that queue; stale generations cannot play. Briefings no longer keep a second global queue.
- MP3 playback has short gain ramps, including a 20 ms stop fade, to avoid discontinuities when users skip speech.
- A failed manifest request was cached as an empty map for the whole tab. It now retries after a temporary network failure.
- Browser speech no longer silently gives up merely because the voice list has not populated yet; the browser can choose its default English voice.
- The live audit measured a 4,022 ms model response for "Why is the sky blue?", despite an existing prepared FAQ. A follow-up Worker fix returns exact recognized topic phrases immediately after safety checks. Extra meaningful words ("red sky") and requests with conversation history still use the model; regression tests cover both. The API response shape is unchanged.

## Measurements and checks

`audio-latency.check.mjs` plays a real MP3 three times through Chrome Web Audio. Final local run: first source start 46.9 ms; cached repeats 0.2/0.1 ms. A new prompt started in 0.3 ms while a cancelled earlier request was deliberately delayed by two seconds. Exactly one new clip started; the stale clip never played. A separate fresh page recovered after its first manifest request returned 503. Earlier repeated runs also passed (cold starts varied approximately 45–110 ms).

These are local source-start measurements, not end-to-end guarantees for mobile networks or speakers. Browser TTS voice/startup and API response time remain device/network dependent. The 143 MP3s were decoded and measured: longest leading low-level interval 40 ms, zero samples at or above 0.999 amplitude. No long leading silence or digital clipping was found. This does not substitute for listening on every physical device.

The 3D check verifies four poses, nonempty rendering, no edge clipping, moving meshes, one shared context, reduced motion and no-WebGL fallback. Smoke checks cover all three ages, games, quiz, Mission, Ask, Parents, session expiry and locked cards at four viewports. Separate speech tests exercise actual PCM mouth levels, mocked browser speech events, cancellation and stable placement. Music checks cover mute, themes, microphone/dialog/tab pauses and reduced motion. Layout checks include doubled text on mobile.

Commands:

```sh
npm run typecheck
npm run lint
npm run build
npm run check-content
npm run check-sketch
npm run check-space
npx tsx scripts/worker-tests.ts
npx tsx scripts/ambience.check.mjs
npx tsx scripts/speech-motion.check.mjs
# Local Vite dev server on 5197; CHROME_PATH set when needed:
node scripts/audio-latency.check.mjs
node scripts/aidos-3d.check.mjs
# Production preview, with SMOKE_URL and SMOKE_OUTPUT set:
node scripts/aidos-host.check.mjs
node scripts/ambience-browser.check.mjs
SMOKE_MOCK_API=1 npm run smoke
```

Remaining device checks: physical iPhone WebGL performance, actual installed TTS voices, YouTube playback and real microphone recognition. Smoke API replies are mocked; no Cloudflare secrets are used or changed.
