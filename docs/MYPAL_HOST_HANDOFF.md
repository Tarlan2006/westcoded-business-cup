# MyPal host handoff

Product and host name: MyPal. Address the child as pal. Use APP_NAME from src/brand.ts in interface text; retain internal identifiers and CSS classes. Leave docs/design unchanged.

## Frontend work for agent 2
- Greeting bubble: “Hey pal! Ready for a screen-free adventure?”
- On CONTINUE, play common_setup_greeting: “Hey pal! Let's set up your adventure!”. It is in public/audio/manifest.json at /audio/common/common_setup_greeting.mp3. Use the existing user-gesture audio path; a playback failure must not prevent navigation.
- Immediately show the complete Parent Setup form: Child's Nickname, Age Group, needs chips, notes, Quiet-Time Goal, flow and START. Heading: “Tell MyPal About Your Child”. Subtitle: “MyPal paces missions to match your break”.
- Labels: “Play with MyPal Now!”, “MyPal heard…”, “Wake MyPal tomorrow”. First-person reaction: “I love tickles”. Use APP_NAME for visible names, aria-label, alt and titles across all games, Hub, Garage, Complete and parent pages.
- Update matching frontend test expectations and any spoken fallback strings. Keep the parent's free text on-device.

## Audio changed by agent 1
New: common_setup_greeting.
Regenerated with pal: common_praise_01, common_praise_04, common_retry_01, common_retry_06, common_transition_02, common_intro_01, local_hunt_intro, local_try_again, local_praise_found, local_praise_next.
The existing bank contained no former host-name lines; these additional regenerations standardise the child's form of address. Piper voice and encoding remain unchanged.

## Release
Current production address: https://mypal.tarlan-b06.workers.dev.
This change is prepared in main only. Do not deploy until the user explicitly says “деплой”. Complete and verify the frontend handoff before publishing.
