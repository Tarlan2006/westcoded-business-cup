# Убрать имя «Bleep» везде. Ведущий теперь просто «MyPal / pal»

Репозиторий: Tarlan2006/westcoded-business-cup, ветка main. `git pull --rebase` перед каждым коммитом. Коммиты без Co-Authored-By и трейлеров Claude.
Решение: у продукта и героя-ведущего одно имя: **MyPal**. Имя «Bleep» нигде не используется ни в тексте, ни в озвучке, ни в доках. Герой обращается к ребёнку «pal». Код-идентификаторы (имя компонента `Mascot`, CSS-классы `bleep-*`, ключи файлов) можно оставить, пользователь их не видит. Оригинал дизайна `docs/design/**` не трогать.

## Что должно быть по тексту
- Приветствие (белый экран): пузырь **«Hey pal! Ready for a screen-free adventure?»**. Озвучка при CONTINUE: «Hey pal! Let's set up your adventure!».
- После приветствия сразу страница с вопросами о пользователе (как в дизайне дизайнера: Child's Nickname, Age Group, чипы потребностей, заметки, Quiet-Time Goal, поток, кнопка START). Заголовок «Tell MyPal About Your Child», подпись «MyPal paces missions to match your break». Если сейчас приветствия нет первым или после него идёт что-то иное, исправить.
- Замены: «Play with Bleep Now!» → «Play with MyPal Now!»; «Bleep heard…» → «MyPal heard…»; «Wake Bleep tomorrow» → «Wake MyPal tomorrow»; «Bleep loves tickles» → «I love tickles»; в репликах героя от первого лица говорить «I», если лишнее имя не нужно. Везде, где нужно имя, использовать `APP_NAME` из `src/brand.ts`. Обращение к ребёнку: «Hey pal!», «Great job, pal!», «Hey {nickname}!» (для вариативности).
- aria-label и alt: «MyPal», не «Bleep».
- Тексты задач, квизов, FAQ, пузырей, Parent, Privacy, Garage, Complete, Hub, подписи игр (Memory, Space, Sketch, Balloons, Tic-tac-toe).

## Сообщение для агента 2 (отправить сейчас)
```
Имя «Bleep» убираем полностью: ведущий = MyPal, ребёнку говорит «pal». Это касается всего, что ты переносишь из дизайна и из наших данных:
1. Приветствие: «Hey pal! Ready for a screen-free adventure?» (вместо «Hi! I'm Bleep!…»). Озвучка CONTINUE: «Hey pal! Let's set up your adventure!».
2. Сразу после приветствия идёт страница со всеми вопросами (Parent Setup). Заголовок «Tell MyPal About Your Child», «MyPal paces missions to match your break», кнопка «Play with MyPal Now!», тексты реакций («MyPal heard…», «Wake MyPal tomorrow»).
3. Везде в src/** замени пользовательские тексты, aria-label, alt, title с «Bleep» на APP_NAME/«MyPal» или перепиши от первого лица. Идентификаторы кода (Mascot, bleep-* классы) оставь.
4. Для тестов: grep -rni "bleep" src/ --include=*.ts --include=*.tsx --include=*.json | grep -v "className\|class=\|id=" не должен показывать пользовательские строки.
Клипы озвучки перегенерирует агент 1; ты скажи ему, какие ключи изменил.
```

## Задача агента 1 (запускай сейчас)
Разрешённые пути: `README.md`, `docs/**` (кроме `docs/design/**`), `worker/**`, `scripts/**`, `index.html`, `public/**`, `.env.example`, `wrangler.*`, папка озвучки и manifest, `shared/**`. В `src/**` меняй только строки текстов клипов (если там лежит источник текстов), минимальным diff и после `git pull --rebase`.
1. **Озвучка**: найди все клипы, где произносится «Bleep» (grep по текстам и manifest: praise/transition/recall/hunt/ask и т.д.), перепиши фразы по правилам выше («Hey pal!», «I», «MyPal»), перегенерируй их тем же Piper-голосом и скриптом, обнови manifest, `npm run check-content` зелёный. Отдельно новый клип приветствия «Hey pal! Let's set up your adventure!». Выведи список перегенерированных клипов.
2. **Воркер**: системные промпты и fallback-фразы без «Bleep»: «You are MyPal, a friendly game host for kids. Address the child as “pal”.» Обнови тесты.
3. **Документация и мета**: README, docs, `index.html`, manifest: без «Bleep». Добавь новый прод-адрес: `<ВСТАВЬ_НОВЫЙ_АДРЕС>` в README, docs/DEPLOY.md и `ALLOWED_ORIGINS` (оставь старый адрес и localhost как запасные).
4. Деплой: только после моего слова «деплой». Затем проверь прод: главная, Ask, Hunt, CORS по новому адресу.
5. Приёмка: `grep -rni "bleep" . --exclude-dir=node_modules --exclude-dir=.git --exclude-dir=src --exclude-dir=design` пусто. `npm run typecheck && npm run build && npm run check-content` и `npx tsx scripts/worker-tests.ts` зелёные.
Коммиты: «Voice: remove Bleep name, add Hey pal greeting», «Worker and docs: MyPal host». Пуш в main. В ответе: список клипов, результат grep, что нужно сделать вручную.
