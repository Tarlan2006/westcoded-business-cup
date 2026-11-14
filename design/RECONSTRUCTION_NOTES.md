# Mission Control reconstruction

The supplied HTML was used as a visual reference. The app keeps its React screens, game state, audio pipeline, and server endpoints. The prototype's demo data and CDN scripts are absent from the build.

- Fresh profiles see a brief splash, Bleep's greeting, and the shared parent form. Reloading a saved profile opens the Hub. `?welcome=1` opens the greeting again for a demo.
- The first-run form and Parent settings use the same fields. The Hub uses the saved preferences to order sections and choose a starting activity. Nicknames and interest chips stay in the local profile. Age bands are still used to select appropriate game content.
- The Garage keeps a local count of completed sessions and cycles through five ship parts. Older profiles begin with an empty garage and retain their existing XP and activity history.
- The optional greeting uses the existing welcome clip and falls back to browser speech after the Hear Bleep button is pressed. Short UI sounds use the engine's shared audio context. Ask uses the existing microphone and STT flow, then offers text input if transcription is unavailable.

## Verification

- Run `npm run typecheck`, `npm run build`, `npm run check-content`, `npm run check-sketch`, and `npm run check-space`.
- The Chromium walkthrough covered first visit, all three age bands, Hunt with a denied microphone, Garage persistence, Parent settings, Learn screens, the preschool video reward, and a double click on Quiz completion. The key screens were checked with axe at 390 and 1280 px, and the smallest scenario was checked at 360×640. Network requests were checked for the test nickname and example preference labels.
- Screenshots are in [screens](./screens/) with filenames beginning `recon-`. Sketch and Space still load separately. The main JavaScript and stylesheet together grew by about 6 kB gzip from the prior build.

## Follow-up

- Verify the microphone, playback volume, and touch behavior on a physical iPhone or Android device. Chromium used emulated touch, a speech stub, and a denied microphone for the regression walkthrough.
- Add a dedicated recording for Bleep's exact greeting if the content bank is revised. The closest existing welcome clip is used now.
- Add a quiz specifically about tooth brushing and drinking water if the team wants the Healthy habits choice to affect activity order. This release uses that choice when it finds a matching question.
