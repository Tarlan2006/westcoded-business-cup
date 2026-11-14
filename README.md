# Mission Control — Bleep

A voice game master for children aged 1–8, built by **westcoded** for **Business Cup 2.0**.
[Try the live demo](https://mission-control.tarlan-b06.workers.dev).

For working parents seeking a 15–30 minute break from passive screen time. Active missions encourage listening and movement; setup and some controls still need a screen. This is not childcare: a grown-up should choose a safe space and supervise age-appropriate play.

## Flow and activities
A parent selects an age, location, interests and session length. The activity hub offers Active, Learn and Watch. Hunt, Road Trip and Floor Is Lava use spoken tasks; the child can confirm with a button or optional microphone. Learn includes quizzes, Memory, Sketch Artist and Space Scale. Ask Bleep answers questions with cloud models or a prepared FAQ. The youngest band uses a parent-selected video catalogue. Balloon Count is an isolated preview module, not a published hub activity.

Watch embeds YouTube: third-party requests and ads may occur. It is not an ad-free promise.

## Stack
Vite, React, TypeScript and Tailwind; Hono on Cloudflare Workers serves APIs and assets. Groq selects validated mission IDs and answers questions. Workers AI provides Whisper transcription and optional language-model fallback. Pre-rendered Piper clips support scripted speech; current dynamic speech also has browser/local-model fallback paths. See [architecture](docs/ARCHITECTURE.md) and [privacy](docs/PRIVACY.md).

## Run
Use Node 24:

```sh
npm i
npm run dev
```

Open the localhost address printed by Vite. Cloudflare AI bindings may require Wrangler login. Use the variable names in [.env.example](.env.example), but put local Worker values in an untracked `.dev.vars` file; a Vite `.env` file does not automatically configure Worker bindings. Never expose keys through VITE-prefixed variables.

## Check and deploy

```sh
npm run typecheck
npm run build
npm run check-content
npx tsx scripts/worker-tests.ts
npx wrangler login
npm run deploy
```

See [deployment and secrets](docs/DEPLOY.md). No new test dependencies or package scripts are required. Worker tests mock upstreams and do not send children's data. Safety controls reduce risk; they are not a guarantee that every model output is appropriate.
