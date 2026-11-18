# AIdos · локализация

## Этап 0. Исходная версия

Выполнен git pull origin main. Текущая константа APP_NAME в src/brand.ts содержит AIdos. Canonical, Open Graph, robots, sitemap и CORS уже используют https://aidos.nexcel.kz. В дереве есть незакоммиченные изменения маскота и README, внесённые до этой работы. Исходная сборка с ними: основной JS 92,79 kB gzip. Vite уже предупреждал о размере отдельного 3D-модуля.

48 заданий, 27 вопросов в quiz.json, 30 записей FAQ, 5 видео, 238 записей голосового каталога. Есть дополнительные игры, локальные реплики, политика конфиденциальности и тарифы. Младшая группа в коде — 1–2 года. README и DEPLOY остаются английскими.

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
| Интерфейс | src/components/Chains.tsx | 47 |
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
| Клиент / документация | src/game/premium.ts | 29 |
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
| Интерфейс | src/screens/Plans.tsx | 41 |
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
