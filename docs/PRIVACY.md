# Privacy and child safety

This hackathon prototype follows data-minimisation principles relevant to children's products. This document is not a claim of COPPA certification or a substitute for a compliance review before public use by children.

There are no app accounts. Profile/preferences and progress are held in browser localStorage. Use a nickname rather than a real name. Clearing site data removes local records; other people using the same browser may see them. No camera or geolocation permission is requested. Sketch drawings stay on the device and are exported only when the user downloads a PNG.

## What leaves the device
- Optional microphone recordings are sent to the Worker for Whisper transcription through Cloudflare Workers AI. Accepted audio is mono 16 kHz, 16-bit PCM WAV, up to 15 seconds (about 481 KB including headers, below 1.5 MB). The Worker does not persist audio or transcripts.
- Ask questions and up to two validated earlier exchanges can reach Groq or Workers AI. Topic IDs based on the selected needs may accompany them. Personal or unsafe text is refused before the Ask model call. Automated filters are imperfect.
- Hunt sends task IDs and an allowlisted set of game words for selection. Responses must select supplied candidates; arbitrary model prose is not shown.
- The parent setup form keeps nicknames and optional notes in localStorage. The compatibility route `/api/setup` ignores the body and returns a fixed suggestion for older clients.
- The Worker uses CF-Connecting-IP for bounded, per-isolate rate-limit buckets in memory. It does not intentionally log text/audio. Infrastructure providers can process network metadata under their own terms; provider retention and deployment logging must be reviewed before launch.
- YouTube embeds contact a third party after the user opens a video. YouTube may show ads and collect data. Scripted speech uses local clips, and dynamic speech selects an installed device voice when available.

There is no application database storing recordings, questions or accounts. This does not promise zero provider retention. A parent should approve microphone use and supervise activities. Before a broader launch, review consent, provider contracts, retention, deletion procedures and age-appropriate access with qualified advisers.
