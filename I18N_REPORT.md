# AIdos · локализация

## Этап 0. Исходная версия

Выполнен git pull origin main. Текущая константа APP_NAME в src/brand.ts содержит AIdos. Canonical, Open Graph, robots, sitemap и CORS уже используют https://aidos.nexcel.kz. В дереве есть незакоммиченные изменения маскота и README, внесённые до этой работы. Исходная сборка с ними: основной JS 92,79 kB gzip. Vite уже предупреждал о размере отдельного 3D-модуля.

48 заданий, 27 вопросов в quiz.json, 30 записей FAQ, 5 видео, 238 записей голосового каталога. Есть дополнительные игры, локальные реплики, политика конфиденциальности. Младшая группа в коде — 1–2 года. README и DEPLOY остаются английскими.

### Источники для проверки

Количество физических строк в исходном файле, включая разметку и логику.

| Тип | Файл | Строк |
|---|---|---:|
| Клиент / документация | README.md | 112 |
| Контент и речь | content/AUDIO_CREDITS.md | 17 |
| Контент и речь | content/common.json | 52 |
| Контент и речь | content/faq.json | 32 |
| Контент и речь | content/hunt.json | 26 |
| Контент и речь | content/lava.json | 15 |
| Контент и речь | content/local-lines.json | 33 |
| Контент и речь | content/quiz.json | 30 |
| Контент и речь | content/roadtrip.json | 16 |
| Контент и речь | content/tasks.json | 50 |
| Контент и речь | content/videos.json | 7 |
| Контент и речь | content/voice/catalog.json | 1192 |
| Контент и речь | content/voice/host-voice.json | 27 |
| Клиент / документация | docs/DEPLOY.md | 121 |
| Публикация и медиа | index.html | 33 |
| Публикация и медиа | public/404.html | 4 |
| Публикация и медиа | public/audio/manifest.json | 148 |
| Публикация и медиа | public/audio/voice-index.json | 223 |
| Публикация и медиа | public/manifest.webmanifest | 23 |
| Публикация и медиа | public/robots.txt | 3 |
| Публикация и медиа | public/sitemap.xml | 5 |
| Клиент / документация | scripts/gen-audio.mjs | 240 |
| Клиент / документация | scripts/generate-unified-voice.mjs | 44 |
| Клиент / документация | scripts/voice-catalog.mjs | 18 |
| Контент и речь | shared/ask-faq.ts | 62 |
| Контент и речь | shared/topics.ts | 31 |
| Контент и речь | shared/types.ts | 71 |
| Контент и речь | shared/voice.ts | 4 |
| Интерфейс | src/App.tsx | 426 |
| Клиент / документация | src/audio/ambienceThemes.ts | 26 |
| Клиент / документация | src/audio/engine.ts | 396 |
| Клиент / документация | src/audio/sfx.ts | 14 |
| Клиент / документация | src/audio/speechMotion.ts | 37 |
| Клиент / документация | src/audio/useClipSpeech.ts | 28 |
| Клиент / документация | src/audio/useMusicPause.ts | 12 |
| Клиент / документация | src/brand.ts | 1 |
| Интерфейс | src/components/ActivityHeader.tsx | 35 |
| Интерфейс | src/components/AnimalSounds.css | 15 |
| Интерфейс | src/components/AnimalSounds.tsx | 66 |
| Интерфейс | src/components/GameUI.tsx | 60 |
| Интерфейс | src/components/Garage.tsx | 24 |
| Интерфейс | src/components/GrownUpsButton.tsx | 15 |
| Интерфейс | src/components/HoldButton.tsx | 19 |
| Интерфейс | src/components/LeaveGameDialog.tsx | 22 |
| Интерфейс | src/components/Mascot.css | 6 |
| Интерфейс | src/components/Mascot.tsx | 54 |
| Интерфейс | src/components/MissionStage.tsx | 95 |
| Интерфейс | src/components/NextUp.tsx | 18 |
| Интерфейс | src/components/PrototypeFrame.tsx | 42 |
| Интерфейс | src/components/PrototypeHeader.tsx | 28 |
| Интерфейс | src/components/RewardCard.tsx | 36 |
| Интерфейс | src/components/SessionControls.tsx | 71 |
| Интерфейс | src/components/ToddlerPlayer.tsx | 137 |
| Интерфейс | src/components/YouTubeVideo.tsx | 57 |
| Интерфейс | src/components/activitySuggestions.ts | 70 |
| Интерфейс | src/components/aidos3d/model.ts | 39 |
| Интерфейс | src/components/aidos3d/renderer.ts | 120 |
| Интерфейс | src/components/ambience.css | 18 |
| Интерфейс | src/components/hold.css | 13 |
| Интерфейс | src/components/session.css | 88 |
| Интерфейс | src/components/useHold.ts | 132 |
| Клиент / документация | src/game/content.ts | 133 |
| Клиент / документация | src/game/mission.ts | 112 |
| Клиент / документация | src/game/missionDemo.ts | 21 |
| Клиент / документация | src/game/useBriefing.ts | 58 |
| Клиент / документация | src/game/usePushToTalk.ts | 119 |
| Клиент / документация | src/game/useWakeLock.ts | 32 |
| Клиент / документация | src/game/videos.ts | 6 |
| Игра | src/games/balloons/BalloonArt.tsx | 12 |
| Игра | src/games/balloons/BalloonsGame.tsx | 178 |
| Игра | src/games/balloons/Guide.tsx | 8 |
| Игра | src/games/balloons/INTEGRATION.md | 7 |
| Игра | src/games/balloons/README.md | 48 |
| Игра | src/games/balloons/balloons.css | 101 |
| Игра | src/games/balloons/check.ts | 53 |
| Игра | src/games/balloons/fonts/Fredoka-OFL.txt | 93 |
| Игра | src/games/balloons/fonts/Nunito-OFL.txt | 93 |
| Игра | src/games/balloons/index.ts | 6 |
| Игра | src/games/balloons/model.ts | 112 |
| Игра | src/games/balloons/preview.css | 5 |
| Игра | src/games/balloons/preview.tsx | 26 |
| Игра | src/games/balloons/reference.css | 78 |
| Игра | src/games/balloons/screens/verification.json | 15 |
| Игра | src/games/balloons/testHost.tsx | 12 |
| Игра | src/games/memory/icons.tsx | 148 |
| Игра | src/games/sketch/INTEGRATION.md | 33 |
| Игра | src/games/sketch/README.md | 74 |
| Игра | src/games/sketch/SketchCanvas.tsx | 185 |
| Игра | src/games/sketch/SketchGame.tsx | 267 |
| Игра | src/games/sketch/art/GeckoHero.tsx | 39 |
| Игра | src/games/sketch/art/index.ts | 5 |
| Игра | src/games/sketch/cases.json | 22 |
| Игра | src/games/sketch/index.ts | 16 |
| Игра | src/games/sketch/meta.ts | 5 |
| Игра | src/games/sketch/preview.tsx | 51 |
| Игра | src/games/sketch/scoreSketch.ts | 114 |
| Игра | src/games/sketch/screens/integration-verification.json | 12 |
| Игра | src/games/sketch/screens/verification.json | 26 |
| Игра | src/games/sketch/sketch.css | 185 |
| Игра | src/games/space/INTEGRATION.md | 30 |
| Игра | src/games/space/Journey.tsx | 274 |
| Игра | src/games/space/Quiz.tsx | 70 |
| Игра | src/games/space/README.md | 45 |
| Игра | src/games/space/SpaceGame.tsx | 90 |
| Игра | src/games/space/art/ObjectArt.tsx | 123 |
| Игра | src/games/space/index.ts | 2 |
| Игра | src/games/space/meta.ts | 8 |
| Игра | src/games/space/objects.json | 10 |
| Игра | src/games/space/preview.tsx | 59 |
| Игра | src/games/space/scale.ts | 56 |
| Игра | src/games/space/space.css | 383 |
| Клиент / документация | src/index.css | 522 |
| Клиент / документация | src/lib/api.ts | 37 |
| Клиент / документация | src/main.tsx | 10 |
| Интерфейс | src/screens/Ask.tsx | 166 |
| Интерфейс | src/screens/Home.tsx | 90 |
| Интерфейс | src/screens/Memory.css | 273 |
| Интерфейс | src/screens/Memory.tsx | 120 |
| Интерфейс | src/screens/Mission.tsx | 226 |
| Интерфейс | src/screens/MissionSummary.tsx | 61 |
| Интерфейс | src/screens/Parent.tsx | 19 |
| Интерфейс | src/screens/ProfileSetup.css | 151 |
| Интерфейс | src/screens/ProfileSetup.tsx | 176 |
| Интерфейс | src/screens/Quiz.tsx | 118 |
| Интерфейс | src/screens/SessionComplete.tsx | 25 |
| Интерфейс | src/screens/Setup.tsx | 56 |
| Интерфейс | src/screens/Sketch.tsx | 38 |
| Интерфейс | src/screens/Space.css | 48 |
| Интерфейс | src/screens/Space.tsx | 40 |
| Интерфейс | src/screens/TicTacToe.tsx | 156 |
| Интерфейс | src/screens/ToddlerCinema.css | 84 |
| Интерфейс | src/screens/ToddlerCinema.tsx | 159 |
| Интерфейс | src/screens/ToddlerMission.tsx | 89 |
| Интерфейс | src/screens/VideoCatalog.tsx | 134 |
| Интерфейс | src/screens/Welcome.tsx | 54 |
| Интерфейс | src/screens/tictactoe.css | 199 |
| Интерфейс | src/screens/ttt/Celebration.tsx | 29 |
| Интерфейс | src/screens/ttt/Piece.tsx | 24 |
| Клиент / документация | src/state/garage.ts | 20 |
| Клиент / документация | src/state/preferences.ts | 44 |
| Клиент / документация | src/state/progress.ts | 121 |
| Клиент / документация | src/state/useSessionTimer.ts | 141 |
| Клиент / документация | src/styles/prototype.css | 227 |
| Клиент / документация | src/voice/recorder.ts | 116 |
| Сервер | worker/ask.ts | 168 |
| Сервер | worker/groq.ts | 62 |
| Сервер | worker/index.ts | 103 |
| Сервер | worker/safety.ts | 27 |
| Сервер | worker/setup.ts | 10 |
| Сервер | worker/stt.ts | 49 |
| Сервер | worker/turn-contract.ts | 57 |
| Сервер | worker/voice.ts | 61 |

### Старые имена

Ключи mission-control.* и mypal.* хранят прогресс и настройки. Имена npm-пакета и Worker, прежние разрешённые origins, файлы прототипов, сценарии проверок, история аудитов и релизов содержат прежние имена. Оставлены для совместимости и сохранения истории.

## Нужна проверка носителем

Запланирована вычитка детских реплик, звукоподражаний и астрономических терминов.

## Этап 1. Система локализации

Типизированные словари загружаются по выбранному языку. Добавлены три переключателя, сохранение выбора на устройстве и в профиле, синхронизация lang и описания. Проверка JSX на этом этапе ожидаемо выявляет исходный английский интерфейс.

## Этап 2. Интерфейс

Перенесены тексты экранов и игр, подписи кнопок, aria-label и статические метатеги. Страница 404 учитывает сохранённый выбор. Английские значения извлечены из исходного интерфейса. Визуальная и сценарная проверки запланированы на этапы 6–7.

## Этап 3. Игровой контент

Переведены реплики заданий, 27 вопросов с вариантами, 30 FAQ, 5 названий видео, подсказки для рисования и факты о космосе. Сравнение ответов использует исходный идентификатор или индекс. В исходном банке видео отдельного описания нет. Список для возможной ручной замены:

- Animal Sounds with Baby — CH1lo6lwQ6o
- I See Something Blue — jYAWf8Y91hA
- Old MacDonald Had a Farm — 5oYKonYBujg
- 10 mins of Gus Goes to Dinosaur Land! | 🦖🌋 Learn 10 Dinosaurs for Kids | Fun Dinosaur Adventure! — I1EETm17qbM
- Why Is the Sky Blue? — ehUIlhKhzDA

## Этап 4. Озвучка

Голос Piper kk_KZ-iseke-x_low. 243 казахских ID и 238 английских ID, включая повторные ссылки на одинаковые записи. Список отсутствующих казахских ID по каталогу пуст. Общая папка public/audio: 5145535 байт вместе с индексами и звуками животных. Английские оригиналы перекодированы в 24 кбит/с. При отсутствии записи используется голос выбранного языка на устройстве, затем текст. Запись приветствия открыта для проверки, но прослушивание в этой среде недоступно. Вычитка произношения и ударений остаётся носителю.

## Этап 5. Голос и Ask

Клиент Ask отправляет question и lang. Текст диктовки можно исправить до отправки. Whisper получает выбранный язык. Добавлены казахские подсказки, выбор FAQ, ограничения для модели и отказ на попытку сменить инструкции. В квизах голос сравнивается с вариантами текущего вопроса. Проверка живого Workers AI требует рабочего AI binding; автоматические проверки с подставным сервисом перечислены ниже.

## Этап 6. Шрифт и размеры

Добавлен локальный вариативный Nunito с диапазонами кириллицы. По таблице глифов проверены все девять казахских букв в обоих регистрах. В Chromium проверены Greeting и Setup с длинным именем: ширина документа 360, 390, 768 и 1280 пикселей точно совпала с шириной окна. Остальные экраны проверяет полный сценарий следующего этапа.

Проверка распознавания выполнена также на реальном Workers AI без публикации Worker. В качестве входа использована синтетическая казахская запись приветствия. Whisper вернул «Сәлем, дос, екраннан көз алып бірге ойнайымыз ба.» Смысл распознан, есть орфографические ошибки. Интерфейс Ask даёт исправить результат перед отправкой.

## Этап 7. Два полных прогона локальной сборки

| Проверка | Результат каждого прогона |
| --- | --- |
| `npm run check:i18n` | 1 064 ключа в каждом словаре. Набор подстановок совпадает. Пустых значений и ошибок проверки JSX нет. |
| `node scripts/i18n-e2e.mjs` | 46 экранов и состояний на каждом языке. 360×740, 390×844, 768×1024 и 1280×800. Проверены выбор и сохранение языка, профиль, XP, ввод, таймер, кнопки и переходы. |
| Локальные ресурсы | В сценарии нет неожиданных HTTP-ошибок, ошибок выполнения, пустых кнопок, неопознанной латиницы в kk и выходящего за границы кнопок текста. |
| Аудио | HTTP 200 и декодирование с положительной длительностью для всех записей двух манифестов. 243 казахских и 238 английских ID. Отсутствующие казахские ID: `[]`. |
| `node scripts/i18n-worker.mjs` | Ответы и отказы на двух языках, смена инструкций на трёх языках, пустой и слишком длинный вопрос, отказ сервиса и таймаут, язык Whisper и варианты ответов всех 27 квизов прошли. |

Сохранены 184 PNG: по 46 состояний на язык в мобильном и настольном размере. Проверены снимки обоих языков. На узком экране подпись «ОРЫНДАДЫМ!» выходила за кнопку. После исправления переноса и размеров обе проверки прошли. Сценарий проверяет присутствие двух полей в теле Ask: question и lang.

Сборка успешна, typecheck и lint для клиента и Worker завершились без замечаний. Vite предупреждает о размере существующего 3D-модуля (631,57 кБ до gzip). Основной входной JS: 92,79 → 69,99 кБ gzip. Отдельный модуль App: 13,87 кБ gzip. Словари EN и KK: 20,40 и 23,53 кБ gzip, всего 43,93 кБ, подгружаются по языку. Сравнение входного файла не является замером полной сетевой загрузки страницы.

E2E запускается с подставным микрофоном и событиями YouTube. Реальный YouTube oEmbed вернул HTTP 200 для всех пяти ID. Проигрывание внешнего потока на устройствах и живая детская диктовка остаются непроверенными. Отдельный исторический компонент ToddlerMission переведён. Текущий путь из младшего видеокаталога открывает квиз звуков животных. Отдельного снимка недоступного из меню компонента нет.

## Этап 8. Материалы для вычитки и публичные адреса

| Материал | Что проверено |
| --- | --- |
| [Таблица перевода](docs/site-texts-kk.md) | 1 103 пары строк. Присутствуют все 1 064 ключа, дополнительные статические подписи, ответы Worker, варианты вопросов и названия каналов. Есть указатель на все 48 заданий. |
| [Автономная галерея](docs/site-kk.html) | 46 подписанных экранов и состояний с мобильным и настольным изображением. Chromium без сети открыл оба размера, декодировал все изображения и нашёл все цели оглавления. |
| [Казахские снимки](docs/screens/kk/) и [английские снимки](docs/screens/en/) | 92 PNG для каждого языка. Снимки и измерения сборки сделаны с уже находившейся в рабочей папке версией маскота. Исходные пользовательские правки маскота, его файлов, проверок и строки README не входят в коммиты перевода. |
| Публичные адреса | В локально собранном ответе для главной и /privacy проверены canonical, og:url, og:image, казахские заголовки, описание, kk_KZ и en_US. Изображение 1 200×630 доступно. Манифесты, robots, sitemap и CORS указывают на https://aidos.nexcel.kz. |
| Превью в мессенджерах | Проверены отдаваемые без JavaScript теги Open Graph, по которым Telegram и WhatsApp строят карточки. Проверка отправкой сообщения и сброс кэша мессенджеров не выполнялись. |
| [README](README.md#languages) | Раздел Languages описывает переключатель, профиль, словари, добавление языка, голосовые пакеты и команды проверки. README и DEPLOY на английском. |

### Объём аудио

| Файлы | Байт |
| --- | ---: |
| Казахские MP3, 223 уникальные записи | 2 517 212 |
| Английские MP3, 218 уникальных записей | 2 471 488 |
| Все медиафайлы, включая звуки животных и историческую эталонную запись | 5 160 839 |
| Те же файлы вместе со всеми индексами из public/audio | 5 273 451 |

Объём указан в байтах. Оба языка вместе с индексами и эталонной записью укладываются в лимит 6 000 000 байт. Источник весов и конфигурации казахского голоса — [карточка Piper iseke](https://huggingface.co/rhasspy/piper-voices/blob/main/kk/kk_KZ/iseke/x_low/MODEL_CARD). Английские видео оставлены по исходным ID, список приведён в этапе 3.

### Нужна проверка носителем перед публикацией

- Прослушать приветствие, подсказку для удержания кнопки, ошибки и победу, затем выборочно задания, вопросы и ответы. Проверить ударения, темп, интонацию обращения «дос» и произношение имени AIdos. Автопроверка декодирования и результат Whisper не оценивают эти свойства.
- Вычитать звукоподражания в младшем квизе и подписи к длине, масштабу и расстояниям в игре о космосе. Оценить понятность формулировок для возрастных групп.
- Записать короткие ответы детским голосом на реальном телефоне. Синтетическое приветствие распознано с ошибками; в Ask доступна правка перед отправкой.

### Сохранённые имена в репозитории

Ниже перечислены отслеживаемые пути, в которых поиск без учёта регистра нашёл MyPal, Bleep, mission-control или Mission Control. Для сохранения профилей и прогресса используются прежние ключи localStorage. В конфигурации Worker оставлены старые разрешённые origins, а в исходниках встречаются внутренние имена и комментарии. Снимки прошлых аудитов, прототипы, журналы и старые проверочные сценарии сохранены.

#### Ключи, классы и клиентский код

- `public/404.html`
- `src/App.tsx`
- `src/components/MissionStage.tsx`
- `src/components/PrototypeFrame.tsx`
- `src/components/useHold.ts`
- `src/i18n/index.ts`
- `src/index.css`
- `src/state/progress.ts`
- `src/state/useSessionTimer.ts`

#### Настройки, сервер и интеграция

- `package-lock.json`
- `package.json`
- `worker/index.ts`
- `wrangler.jsonc`

#### Проверочные сценарии

- `scripts/age-games.check.mjs`
- `scripts/aidos-3d.check.mjs`
- `scripts/ambience-browser.check.mjs`
- `scripts/audio-latency.check.mjs`
- `scripts/audit-http.mjs`
- `scripts/audit-lighthouse.mjs`
- `scripts/greeting.check.mjs`
- `scripts/hold-buttons.check.mjs`
- `scripts/i18n-e2e.mjs`
- `scripts/session-limit.check.mjs`
- `scripts/smoke-prod.mjs`
- `scripts/unified-voice.check.mjs`
- `scripts/worker-tests.ts`
- `src/games/sketch/integration.check.mjs`
- `src/screens/flow.check.mjs`
- `src/screens/navigation.check.mjs`

#### История, прототипы и документация

- `AUDIT.md`
- `Claude outputs/CODEX_PROMPTS.md`
- `Claude outputs/DESIGN_BRIEF.md`
- `Claude outputs/PLAN.md`
- `Claude outputs/PROMPT_AUDIT_FINAL.md`
- `Claude outputs/PROMPT_BALLOONS.md`
- `Claude outputs/PROMPT_FLOW_FIX.md`
- `Claude outputs/PROMPT_FULL_RECONSTRUCTION.md`
- `Claude outputs/PROMPT_LEARN_TRACK.md`
- `Claude outputs/PROMPT_LIGHT_REDESIGN.md`
- `Claude outputs/PROMPT_MEMORY_RESTYLE.md`
- `Claude outputs/PROMPT_PORT_DESIGNER_HTML.md`
- `Claude outputs/PROMPT_REDESIGN_LIGHT.md`
- `Claude outputs/PROMPT_REMOVE_BLEEP.md`
- `Claude outputs/PROMPT_RENAME_MYPAL.md`
- `Claude outputs/PROMPT_SKETCH_GAME.md`
- `Claude outputs/PROMPT_START_SCREEN.md`
- `Claude outputs/PROMPT_TICTACTOE_CUTE.md`
- `Claude outputs/PROMPT_VOICE_BANK.md`
- `Claude outputs/PROMPT_WHITE_THEME.md`
- `Claude outputs/PROMPT_WORKER_HARDENING_DOCS.md`
- `Claude outputs/balloon_count_design_reference.html`
- `Claude outputs/mypal_white_design_reference.html`
- `README.md`
- `content/AUDIO_CREDITS.md`
- `design/FLOW.md`
- `design/RECONSTRUCTION_NOTES.md`
- `docs/AUDIT-2026-11-17.md`
- `docs/CODEX_PROMPTS.md`
- `docs/DEPLOY.md`
- `docs/MYPAL_HOST_HANDOFF.md`
- `docs/PLAN.md`
- `docs/audit-2026-11-17/after-http-bundle.json`
- `docs/audit-2026-11-17/ambience-browser.json`
- `docs/audit-2026-11-17/screens-large/smoke-report.json`
- `docs/audit-2026-11-17/screens/smoke-report.json`
- `docs/audit/after-home.report.html`
- `docs/audit/after-home.report.json`
- `docs/audit/after-http-bundle.json`
- `docs/audit/after-privacy.report.html`
- `docs/audit/after-privacy.report.json`
- `docs/audit/before-home.report.html`
- `docs/audit/before-home.report.json`
- `docs/audit/before-privacy.report.html`
- `docs/audit/before-privacy.report.json`
- `docs/audit/seo-after-local.json`
- `docs/audit/seo-after-local.md`
- `docs/audit/seo-before.json`
- `docs/audit/seo-before.md`
- `docs/design/mission_control_prototype.html`
- `docs/releases/aidos-3d-evidence/after-http-bundle.json`

Образцы для прослушивания: [Приветствие](public/audio/kk/788246c58f8e1eafdf12.mp3) · [Удержание](public/audio/kk/3a4a3436a037fef36f22.mp3) · [Повтор](public/audio/kk/4c5b2d95fb88a26ae21a.mp3) · [Ошибка](public/audio/kk/f8706cee84cd0cc2ef39.mp3) · [Победа](public/audio/kk/f8a7d449b51931895335.mp3).

## Шрифты для казахского интерфейса

В заголовках, кнопках, чипах выбора и таймере используется Rubik. Основной текст набран Nunito. Настройка общая для KK и EN. То же подключение используют страница 404 и отдельные игровые превью. В игре с шарами прежние четыре TTF заменены общими WOFF2, в подписях игры с рисованием убран Georgia. Буквы и цифры обоих языков входят в локальные файлы. Цветные эмодзи остаются системными пиктограммами.

### Проверка кандидатов

FontTools проверил таблицы Unicode, ненулевые ID и наличие контуров глифов. Для казахских букв проверены «ә Ә ғ Ғ қ Қ ң Ң ө Ө ұ Ұ ү Ү һ Һ і І». Для базовой кириллицы взят полный диапазон U+0400–U+045F, включая Ё и ё. Латиница включает A–Z и a–z, цифры — 0–9. Диапазон насыщенности прочитан из оси wght или из таблицы OS/2 у статического шрифта. Проверены исходные TTF из зафиксированной [ревизии Google Fonts](https://github.com/google/fonts/tree/75706cfdd7c49a2be20f66c1e24c26f4f39a33b8/ofl).

| Семейство | Насыщенность | Казахские буквы | Базовая кириллица | Латиница | Цифры | Выбор |
| --- | --- | ---: | ---: | ---: | ---: | --- |
| Rubik | 300–900 | 18/18 | 96/96 | 52/52 | 10/10 | Первый по приоритету. Есть 600, 700 и 800. |
| Nunito | 200–1000 | 18/18 | 96/96 | 52/52 | 10/10 | Для основного текста. |
| Comfortaa | 300–700 | 18/18 | 96/96 | 52/52 | 10/10 | Есть 700. |
| Baloo Bhai 2 | 400–800 | 0/18 | 0/96 | 52/52 | 10/10 | В файле отсутствует кириллица. |
| Marmelad | 400 | 18/18 | 96/96 | 52/52 | 10/10 | Только обычное начертание. |
| Pangolin | 400 | 18/18 | 96/96 | 52/52 | 10/10 | Только обычное начертание. |
| Fredoka, прежний шрифт | 300–700 | 0/18 | 0/96 | 52/52 | 10/10 | В файле отсутствует кириллица. |

### Файлы, включённые в сборку

| Семейство | latin, байт | cyrillic, байт | cyrillic-ext, байт | Всего, байт |
| --- | ---: | ---: | ---: | ---: |
| Rubik | 34 132 | 12 844 | 11 304 | 58 280 |
| Nunito | 42 204 | 18 324 | 27 924 | 88 452 |
| **Всего** | | | | **146 732** |

Размер измерен по всем шрифтовым файлам в `dist/client`. Каждый из шести WOFF2 сохраняет вариативную ось насыщенности. Браузер выбирает подмножества по `unicode-range`. У всех объявлений задан `font-display: swap`. Один preload загружает основную кириллицу Rubik для казахского приветствия. Путь к шрифтам ведёт на тот же домен, лицензии SIL OFL лежат рядом с ними.

### Проверка результата

- `python scripts/check-fonts.py` проверяет именно поставляемые WOFF2 и лимит 150 000 байт. Для повтора таблицы исходных файлов укажите `--candidates <папка-TTF>` с файлами rubik.ttf, nunito.ttf, comfortaa.ttf, baloobhai2.ttf, marmelad.ttf, pangolin.ttf и fredoka.ttf. Требуются fonttools и brotli.
- В Playwright каждый экран проверяется через `document.fonts.check` и Chromium `CSS.getPlatformFontsForNode`. Для сочетаний семейства, веса и стиля, фактически используемых на экране, браузер рисует контрольную строку со всеми девятью парами казахских букв. Проверка также считывает фактические шрифты обычных текстовых элементов. Системные пиктограммы исключены из проверки букв.
- 46 казахских экранов и состояний, включая Parent Setup, Hub, Ask, таймер, игры и 404. Проверка шрифтов и снимки сделаны при 390×844 и 1280×800. Горизонтальное переполнение и границы кнопок проверены также при 360×740 и 768×1024. Для чипов и кнопки запуска с именем «Әбдірахманмұхаммед» проверены обе оси. Обрезания и горизонтального скролла в этих проверках нет.
- `npm run build`, `npm run typecheck` и `npm run check:i18n` прошли. В словарях 1 064 ключа. Сборка по-прежнему предупреждает о размере отдельного 3D-модуля.
- Английский сценарий также прошёл все 46 состояний с теми же проверками шрифтов. Внешних запросов за шрифтами в браузерных проверках не было.
- [Сравнение фрагментов Parent Setup и Hub](docs/fonts/comparison.png), [страница-образец](docs/font-specimen.html), [её снимок](docs/fonts/specimen-1280x800.png), [Parent Setup и Hub до замены](docs/fonts/before/), [92 казахских снимка после замены](docs/screens/kk/). В обеих сериях использовалась одна рабочая версия маскота.

## Казахский текст и отступы · 19 ноября 2026

На экране награды длинную кнопку заменили на «Тағы ойнау 🚀». Внутри кнопки оставили по 16 пикселей с обеих сторон и разрешили перенос. Карточка новой детали растёт по высоте вместе с названием. В игре «Жұлдыз бен бұлт» размер казахского заголовка на планшете и компьютере зависит от ширины колонки рядом с полем.

Перечитаны надписи, задания, вопросы, результаты, ответы AIdos, сообщения родителям, подписи для чтения с экрана и тексты озвучки. Изменены 276 строк интерфейсного словаря и 221 строка словаря контента. На награде уровень теперь указан как «3-деңгей», группа слышит «Жарайсыңдар, балалар!», а новое приглашение звучит так: «Сәлем, досым! Бірге ойнауға дайынсың ба?». Казахские фразы с именем, количеством и единицами измерения собираются в порядке слов соответствующего предложения. Файлы реплик синхронизированы с текстом.

| Что проверили | Результат |
| --- | --- |
| Маршрут в Chromium | По 55 экранов и состояний в KZ и EN при 360×740, 369×800, 390×844, 768×1024 и 1280×800. Всего 550 проверок экрана. |
| Границы | Проверены горизонтальный скролл, кнопки, ссылки, заголовки, абзацы, чипы и реплики. Для основной кнопки награды тест требует не менее 15 px от текста до края. После исправлений нарушений в этом проходе нет. |
| Где проходили | Приветствие, анкета с длинным именем, выбор игры, видео, квизы, все игры, пауза и награды, гараж, Ask, игры для малышей, настройки родителей, конец сессии, конфиденциальность и 404. |
| Звук | 244 казахских идентификатора соответствуют репликам, 224 уникальных казахских файла открылись и декодировались с положительной длительностью. Английские 239 идентификаторов тоже проверены. |
| Автоматические проверки | Сборка, типы, lint, два словаря по 1065 ключей, проверка контента, космических сравнений и двуязычного обработчика Ask прошли. |
| Условия проверки | Локальная версия, браузер с заданными размерами окна. Для проверки интерфейса подставлялись видеопоток и результат распознавания речи. Редактура без независимой вычитки носителем. |

[Награда при ширине окна 369 px](docs/screens/kk/complete-369x800.png) · [Галерея казахских экранов](docs/site-kk.html) · [Тексты для вычитки](docs/site-texts-kk.md)

## Социальный проект Nexcel Solutions

В каталоге три будущие игры с пометкой «Жақында». Родителям доступна информация о проекте. Формулировки карточек ожидают вычитки носителем. [Инвентаризация, результаты проверок и скриншоты](docs/social-project/REPORT.md).
