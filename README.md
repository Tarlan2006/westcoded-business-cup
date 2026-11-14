# Mission Control

Mission Control — детское приложение с двумя треками, Active и Learn. Для 1–2 лет доступен видеокаталог. Для 3–5 и 6–8 лет есть активные миссии, квизы и игры. В Learn для 6–8 лет можно задать вопрос о науке и природе. Cloudflare Workers раздаёт приложение и обслуживает API на Hono.

**Живой URL** [mission-control.tarlan-b06.workers.dev](https://mission-control.tarlan-b06.workers.dev)

## Локальный запуск

Нужны Node.js 24 и npm.

```sh
npm install
npm run dev
```

Откройте [localhost:5173](http://localhost:5173), выберите возраст и параметры и нажмите **Show activities**. Каталог подбирает занятия по возрасту и месту, а предпочтение определяет первый раздел. Все режимы бесплатны, количество миссий не ограничено. Состояние Worker можно проверить через `GET /api/health`.

В Scavenger Hunt кнопка **HOLD TO TALK** отправляет WAV длительностью до восьми секунд в `POST /api/stt` для распознавания через Workers AI. `POST /api/turn` выбирает реплику и задание через Groq. При недоступности модели игра выбирает следующий ход локально. Кнопка **I DID IT!** работает без доступа к микрофону.

В Learn `POST /api/ask` отвечает через Groq при наличии `GROQ_API_KEY` и `LLM_MODEL`, а без них использует встроенный FAQ. Ролики подбираются по возрасту из `content/videos.json`. Для 3–5 лет раздел видео открывается после первого квиза.

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

## Озвучка

Готовые клипы лежат в `public/audio`. После изменения реплик или вопросов 3–5 лет обновите клипы, манифест и длительности. Для генерации нужны Python и FFmpeg с `libmp3lame` в PATH.

```sh
python -m pip install piper-tts==1.8.0
python -m piper.download_voices --data-dir scripts/.cache/models en_US-hifi_tts_92-medium
npm run gen-audio -- --dry-run
npm run gen-audio
npm run check-content -- --require-audio
```

В Windows с кириллицей в пути репозитория установите Piper в отдельное окружение в папке с латинским путём. Задайте `PYTHON` как путь к его `python.exe`. Через `FFMPEG` можно указать путь к исполняемому файлу FFmpeg. Для другого голоса Piper передайте `--voice <путь-к-модели.onnx>`; рядом нужен файл `.onnx.json`.

- Для пробного прогона используйте `npm run gen-audio -- --only local_hunt`. Повторный запуск пропускает неизменённые клипы. `--force` перезаписывает выбранные клипы.
- Kokoro работает через `python -m pip install kokoro soundfile` и `npm run gen-audio -- --engine kokoro --voice af_heart`. При первом запуске нужны веса модели. Для офлайн-работы загрузите их заранее.
- Если решите использовать облачную озвучку, для ElevenLabs задайте `ELEVENLABS_API_KEY` и запустите `npm run gen-audio -- --engine elevenlabs --voice <voice-id>`. Для Aura задайте `CLOUDFLARE_API_TOKEN` и `CLOUDFLARE_ACCOUNT_ID` и запустите `npm run gen-audio -- --engine aura --voice luna`.

Перед публикацией прослушайте десять клипов из разных режимов и квиза. В Git добавляйте MP3, манифест и обновлённые банки. Веса и кэш генерации хранятся локально. [Атрибуция голоса](content/AUDIO_CREDITS.md)

## Документы

- [План и контракты](docs/PLAN.md)
- [Промпты команды](docs/CODEX_PROMPTS.md)
- [Что сдаём](docs/SUBMISSION_CHECKLIST.md)
- [План презентации](docs/PITCH_OUTLINE.md)
