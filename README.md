# Mission Control

Mission Control — голосовая игра с короткими миссиями для детей. Сейчас в репозитории каркас на Vite, React, TypeScript и Tailwind CSS. Cloudflare Workers раздаёт страницу и обслуживает API на Hono.

**Живой URL** [mission-control.tarlan-b06.workers.dev](https://mission-control.tarlan-b06.workers.dev)

## Локальный запуск

Нужны Node.js 24 и npm.

```sh
npm install
npm run dev
```

Откройте [localhost:5173](http://localhost:5173) и нажмите **Check API health**. Кнопка покажет JSON от `GET /api/health`. `POST /api/stt` и `POST /api/turn` возвращают HTTP 501.

Vite подключает Workers AI через аккаунт Cloudflare. Если появится запрос на вход, выполните `npx wrangler login` или воспользуйтесь запуском через `wrangler dev --local` ниже. Для проверки API секреты Groq не нужны.

Для локальной разработки с ключами скопируйте `.dev.vars.example` в `.dev.vars` и заполните `GROQ_API_KEY` и `LLM_MODEL`.

```sh
npm run typecheck
npm run build
npx wrangler dev
```

После сборки Wrangler раздаёт приложение на [localhost:8787](http://localhost:8787). Чтобы проверить API без подключения к Workers AI, запустите `npx wrangler dev --local`. Собранное приложение также можно запустить командой `npm run preview`.

## Деплой на Cloudflare Workers

```sh
npx wrangler login
npm run deploy
npx wrangler secret put GROQ_API_KEY
npx wrangler secret put LLM_MODEL
```

`npm run deploy` выполняет `vite build && wrangler deploy`. После публикации откройте указанный Wrangler адрес и проверьте `/api/health`.

Для автодеплоя откройте **Workers & Pages → mission-control → Settings → Builds → Connect** в панели Cloudflare. Авторизуйте приложение Cloudflare Workers & Pages в GitHub, выберите `Tarlan2006/westcoded-business-cup` и ветку `main`. Оставьте корнем репозиторий, задайте `npm run build` для сборки и `npx wrangler deploy` для деплоя. [Инструкция Cloudflare](https://developers.cloudflare.com/workers/ci-cd/builds/#connect-an-existing-worker)

## Документы

- [План и контракты](docs/PLAN.md)
- [Промпты команды](docs/CODEX_PROMPTS.md)
- [Что сдаём](docs/SUBMISSION_CHECKLIST.md)
- [План презентации](docs/PITCH_OUTLINE.md)
