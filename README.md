# MyPal

MyPal is a voice game master for children aged 1–8, built by **westcoded** for **Business Cup 2.0**. [Open the live demo](https://mypal.tarlan-b06.workers.dev).

## Flow and activities

On the first visit, a parent chooses an age and a 20-, 30-, or 60-minute quiet-time goal. Ages 1–2 start with the video catalogue and three short rounds with MyPal. Ages 3–8 can start with video and three quiz questions or go straight to an active mission. On later visits, the activity hub opens after the splash. Press and hold **Parents** to edit the profile or **Hold: Exit** from a mission.

The hub offers age-appropriate videos, quiz, Memory, Space Scale, and Balloon Count. The 6–8 band also sees Ask MyPal, Tic-tac-toe, and Sketch Artist. Move supports Scavenger Hunt and Floor is Lava at home and Roadtrip Spy for passengers. Supervise play and choose a clear space. YouTube videos load on request and may display ads or related videos.

## Stack

Vite, React, TypeScript, and Tailwind build the UI. Hono on Cloudflare Workers serves APIs and assets. Earlier progress, XP, and unlocked Ship Parts persist locally. Parent notes and nicknames stay on the device. Groq selects among safe mission candidates. Workers AI transcribes optional voice input, and Ask MyPal uses Groq or Workers AI with a built-in FAQ fallback. [Architecture](docs/ARCHITECTURE.md) · [Privacy](docs/PRIVACY.md) · [Original design](docs/design/mission_control_prototype.html)

## Run

Use Node.js 24.

```sh
npm ci
npm run dev
```

Open the URL printed by Vite. For local Worker secrets, copy `.dev.vars.example` to an untracked `.dev.vars` and fill in the values you need. Cloudflare AI may require Wrangler login. See [deployment and secrets](docs/DEPLOY.md).

## Check and deploy

```sh
npm run typecheck
npm run build
npm run check-content
npm run check-sketch
npm run check-space
npx tsx scripts/worker-tests.ts
npx wrangler login
npx wrangler deploy --keep-vars
```

The Worker tests use mocked providers. Use `/api/health` to check a deployment and the age and navigation checks under `src/screens` to exercise a built app with Playwright.

## Voice clips

MyPal speaks with a live mascot voice: Kyutai Pocket TTS runs in the browser and clones the approved reference in `content/voice` (see `host-voice.json`), so scripted lines and Ask answers share one voice. The model downloads once (about 146 MB) and is skipped on Data Saver or low-memory devices. Until it loads, MyPal plays pre-rendered Piper MP3s from `public/audio/manifest.json` and uses a local browser voice for other lines; timed mission cues always use the recordings. `patches/pocket-tts-js+0.1.0.patch` adds a temperature option; 0.3 here (library default 0.7) halves squeaky pitch jumps without changing the voice. To regenerate clips, install Python and FFmpeg with `libmp3lame`, then run the following commands.

```sh
python -m pip install piper-tts==1.8.0
python -m piper.download_voices --data-dir scripts/.cache/models en_US-hifi_tts_92-medium
npm run gen-audio -- --dry-run
npm run gen-audio
npm run check-content -- --require-audio
```

On Windows, use a Python environment in a path with Latin characters if Piper cannot open the workspace path. `PYTHON` and `FFMPEG` can point to the executables. `--only` selects clip IDs by prefix. Use `--voice` to specify a different Piper model with its `.onnx.json` file. Keep model weights and keys outside Git. [Voice credits](content/AUDIO_CREDITS.md)
