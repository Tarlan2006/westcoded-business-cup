# Переименование продукта в «MyPal»

Репозиторий: Tarlan2006/westcoded-business-cup, ветка main. `git pull --rebase` перед каждым коммитом. Коммиты без Co-Authored-By и трейлеров Claude.
Новое название: **MyPal** (пишется слитно, M и P заглавные). Ведущий-маскот остаётся **Bleep**. Старое имя «Mission Control» нигде не должно остаться в пользовательских текстах.
Агент 2 сейчас переносит дизайн в `src/**`. Поэтому задача разделена.

## Сообщение для агента 2 (отправить сейчас, одним куском)
```
Новое название продукта: MyPal. Во всём переносимом дизайне:
1. Создай/используй константу APP_NAME = 'MyPal' в src/brand.ts и подставляй её везде, где в HTML-прототипе написано «Mission Control» (заголовок Splash, вкладка/title, шапки, Garage, тексты, aria-label). Никаких жёстко прописанных «Mission Control» в src/**.
2. Название «Mission Control» как имя родительской панели не используй. Родительская панель называется «Parents» / «Grown-ups».
3. В index.html (title, meta description, og:title) тоже MyPal; если index.html вне твоей зоны, оставь это агенту 1.
4. Озвучка: фразы, где Bleep произносит «Mission Control», замени на «MyPal» в текстах заданий; перегенерацию клипов сделает агент 1, ты только поправь текстовые строки и скажи, какие ключи изменил.
```

## Задача для агента 1 (запускай сейчас, зона без конфликтов)
Разрешённые пути: `README.md`, `docs/**`, `worker/**`, `wrangler.*`, `package.json` (только поле `name` и описание), `index.html`, `public/**`, `scripts/**`, `.env.example`, папка озвучки/manifest, `shared/**`. В `src/**` ничего не меняй (кроме строк текстов клипов, если они лежат там: только эти строки, минимальный diff, и только после `git pull --rebase`).

1. Текст: во всех файлах из разрешённых путей замени «Mission Control» и вариации на «MyPal» (README, docs, worker-промпты, комментарии, заголовок в `index.html`, `<title>`, meta description, og:title, manifest/PWA name и short_name). Системный промпт воркера: «Bleep, the friendly host of MyPal».
2. Озвучка: найди клипы, где произносится «Mission Control» (common_praise_02, common_transition_06, common_recall_01, local_hunt_recall, local_praise_radio и любые другие, найди через grep по текстам и manifest). Перепиши фразы с «MyPal» (или нейтрально, если звучит неловко), перегенерируй эти mp3 тем же Piper-голосом и скриптом, что использовался для остальных, обнови manifest, проверь `npm run check-content` (все клипы на месте). Если скрипта генерации нет, опиши в ответе, как сделать вручную, и поставь fallback на speechSynthesis для этих ключей.
3. Воркер и адрес: в `wrangler.*` поменяй `name` на `mypal`. Это создаст новый воркер с адресом `https://mypal.tarlan-b06.workers.dev`; старый `mission-control` остаётся как запасной, его не удаляй. `ALLOWED_ORIGINS` должен содержать оба адреса (новый и старый) и localhost. Секреты GROQ_API_KEY и LLM_MODEL для нового воркера задаст пользователь вручную (не печатай их). Опиши точные шаги в `docs/DEPLOY.md` (включая `wrangler secret put`, чек после деплоя).
4. Если пользователь купит домен, в `docs/DEPLOY.md` добавь раздел: Custom Domain в Cloudflare и необходимость добавить домен в `ALLOWED_ORIGINS`.
5. Проверка: `npm run typecheck && npm run build && npm run check-content` и `npx tsx scripts/worker-tests.ts` зелёные; `grep -ri "mission control" --exclude-dir=node_modules --exclude-dir=.git .` показывает только то, что лежит в `src/**` (зона агента 2) и в `docs/design/**` (оригинал дизайна, не трогать). Выведи результат grep в ответе.
6. НЕ деплой, пока не подтвердит пользователь: после его слов «деплой» выполни деплой и проверь прод по новому адресу (главная, Ask, Hunt, CORS).
Коммиты: «Rename to MyPal: docs, worker, meta», «Regenerate voice clips for MyPal». Пуш в main. В ответе: изменённые файлы, регенерированные клипы, остаток grep, что должен сделать пользователь вручную.
