# Exact AIdos reference and unified speech — 2026-11-17

Production: https://aidos.nexcel.kz. Release via Cloudflare Builds from main; secrets unchanged.

## Changes
- Every production Mascot uses the exact supplied PNG (SHA-256 1740a357fc5d2c29debbe69aaa75a92469f8a4c669c25649095c6249e4d30eb8). The simplified 3D character is no longer loaded. This release uses a still image, not a claim of matching 3D animation.
- 238 prepared clips use Aura-2 English, Luna, `aidos-luna-v1`; dynamic Ask synthesis pins the same model and speaker. Natural pitch and speed, no device speech fallback or live voice-cloning download.
- Versioned asset URLs prevent old recordings being mixed with the new voice. Decoded dynamic responses are held in bounded tab memory for replay. Failed synthesis preserves the answer text and replay button.
- Existing short fades and cancellation protection remain. No repeating tick/radio/siren cues during speech.
- Privacy and architecture docs describe server synthesis honestly. Historical authoring references and dev-only standalone game previews do not define the production voice.

## Verification
- Typecheck, lint, production build, content checks (143 required clips and all 238 catalogue paths), Sketch and Space scoring, Worker/FAQ and voice-route tests passed.
- Decoded all 238 MP3s: no clipped samples, peak 0.6521, longest leading low-amplitude interval 465 ms.
- Three greeting plays started at about 59 ms, 0.4 ms and 0.2 ms locally. A cancelled slow download did not block the next line. Quiz, Sketch, Balloons and FAQ fixed lines loaded local prepared assets without synthesis requests.
- Browser Ask test: three replays, one dynamic audio download, zero device voice calls or electronic beep oscillators. This test mocks the dynamic provider response; it does not establish live service availability.
- 120 screen states across 390x844, 768x1024, 1280x900 and 844x390: no JavaScript errors, overflow, missing/out-of-frame mascots or undersized targets. Ambience themes, mute, microphone pause, visibility and reduced-motion tests passed.
- Evidence is in `unified-voice-evidence/`. Automated PCM/ASR checks are not a subjective listening review on every physical device.

## Live-service limitation
The fixed catalogue was successfully generated through production. Subsequent live POST synthesis probes returned 503 `provider_daily_limit`: Cloudflare Workers AI is refusing further generation because its daily allowance is exhausted. The owner was asked to review the account allowance/billing; no secrets or billing settings were changed. Fixed game, quiz and FAQ audio remains available from static assets. New arbitrary Ask speech cannot be certified until the provider allows requests again; its text remains available. Never claim zero latency for uncached network synthesis.

## Rollback
See the current section of `docs/DEPLOY.md`. The foundation commit `220816c` preserves the supplied image and server route but has the earlier client voice implementation. Prefer a corrective forward release; do not reset shared main.

Production verification after e065bbf: exact PNG, greeting MP3 and voice-index hashes match local files; real Ask FAQ and voice started in 424 ms without a TTS call. The arbitrary synthesis probe still returned the daily-limit code. Manifest fetches now also carry the voice version to bypass older browser caches.
