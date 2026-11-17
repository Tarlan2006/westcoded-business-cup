# AIdos host and branding audit

All current host appearances share `Mascot`: four Kazakh outfit poses, taqiya and gold oyu. Each pose now has an aligned closed-mouth keyframe, blended only over the mouth. The torso anchor and fixed frame prevent a pose change from moving surrounding controls. Breathing and speaking transforms run inside that frame; reduced-motion preference disables them.

This is **2.5D sprite animation**, not a rigged 3D model. Recorded speech and local synthesized speech drive mouth openness from the speech-only PCM analyser. Browser speech provides start/end events but no PCM, so its mouth cadence is approximate. Music and animal sounds do not drive the host's mouth. Stop, cancellation, muted sound and hidden tabs stop talking motion.

The PWA manifest and installation icons now use AIdos. Eight obsolete public mascot images and the old public voice reference were removed. The approved voice reference retains the same speaker, with its old-name introduction trimmed off; the new URL prevents reuse of a cached old reference. The 143 content clips were checked with offline Whisper tiny.en, with no old-name matches; all three final reference files were checked separately. ASR is an audit aid, not proof of perfect pronunciation.

Old preference/storage identifiers and legacy allowed origins are deliberately retained for compatibility. Historical release reports and original design references remain historical, not application content.

## Reproduce

- `npm run typecheck`, `npm run lint`, `npm run build`, `npm run check-content`
- `npm run check-sketch`, `npm run check-space`, `npx tsx scripts/worker-tests.ts`
- `npx tsx scripts/speech-motion.check.mjs`, `npx tsx scripts/ambience.check.mjs`
- With Chrome available, set `CHROME_PATH`, `SMOKE_URL`, `SMOKE_MOCK_API=1`, `SMOKE_OUTPUT`, then `npm run smoke`.
- `node scripts/aidos-host.check.mjs`: real MP3 decode/PCM mouth levels, stable frame, mocked browser speech events, stop and reduced motion.
- `node scripts/ambience-browser.check.mjs`: music controls, themes, microphone/dialog/tab pauses and reduced motion.

The smoke test covers 30 states at 390×844, 768×1024, 1280×900 and 844×390, all three age groups, games, quiz, Ask, Mission, locked-game animation and session expiry. It checks branding, loaded host images, frame containment, horizontal overflow and touch targets. API replies are mocked in this flow test; YouTube playback, real microphone recognition, real browser TTS voices and physical iPhone behavior require device testing.

Asset prompts: [aidos-motion-prompts.json](aidos-motion-prompts.json). Runtime assets: `public/mascot/aidos-{wave,point,tablet,jump}-closed.webp`.
