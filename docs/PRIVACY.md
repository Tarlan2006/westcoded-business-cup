# Privacy and child safety

This hackathon prototype follows data-minimisation principles relevant to children's products. This document is not a claim of COPPA certification or a substitute for a compliance review before public use by children.

There are no app accounts. Profile/preferences and progress are held in browser localStorage. Use a nickname rather than a real name. Clearing site data removes local records; other people using the same browser may see them. No camera or geolocation permission is requested. Sketch drawings stay on the device and are exported only when the user downloads a PNG.

## What leaves the device
- Optional microphone recordings are sent to the Worker for Whisper transcription through Cloudflare Workers AI. Accepted audio is mono 16 kHz, 16-bit PCM WAV, up to 15 seconds (about 481 KB including headers, below 1.5 MB). The Worker does not persist audio or transcripts.
- The current Ask client sends only the question to the Worker. It does not send profile age, selected interests, parent notes, nickname or conversation history. The Worker keeps validated history/topic fields for compatibility with older clients; those older requests can reach Groq or Workers AI. Personal or unsafe text is refused before the Ask model call. Automated filters are imperfect.
- Hunt sends task IDs and an allowlisted set of game words for selection. Responses must select supplied candidates; arbitrary model prose is not shown.
- The parent setup form keeps nicknames and optional notes in localStorage. The compatibility route `/api/setup` ignores the body and returns a fixed suggestion for older clients.
- The Worker uses CF-Connecting-IP for bounded, per-isolate rate-limit buckets in memory. It does not intentionally log text/audio. Infrastructure providers can process network metadata under their own terms; provider retention and deployment logging must be reviewed before launch.
- Fixed voice clips are downloaded from this site. For a new spoken response, the client sends only the response text to `/api/voice`; the Worker synthesizes it with Cloudflare Workers AI (Aura-2 Luna). Parent notes, profiles and nicknames are not included. Dynamic speech is not written to a server cache; decoded audio is kept in bounded tab memory for repeat playback. Only the fixed public script catalogue is cached on the server. The app does not use system voices or download a browser voice-cloning model.
- YouTube embeds contact a third party after the user opens a video. YouTube may show ads and collect data.

There is no application database storing recordings, questions or accounts. This does not promise zero provider retention. A parent should approve microphone use and supervise activities. Before a broader launch, review consent, provider contracts, retention, deletion procedures and age-appropriate access with qualified advisers.
