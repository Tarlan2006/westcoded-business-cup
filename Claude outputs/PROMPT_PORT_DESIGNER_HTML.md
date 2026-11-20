# Codex: перенести дизайн дизайнера 1 в 1, а в логику встроить наши готовые игры, видео и контент

Репозиторий: Tarlan2006/westcoded-business-cup, ветка main. `git pull --rebase` перед началом. Коммиты без Co-Authored-By и трейлеров Claude.

ЭТОТ ПРОМПТ ЗАМЕНЯЕТ: PROMPT_LIGHT_REDESIGN, PROMPT_START_SCREEN, PROMPT_FULL_RECONSTRUCTION. Не выполняй их. PROMPT_MEMORY_RESTYLE и PROMPT_BALLOONS остаются в силе (они тёмные, как этот дизайн).

## Эталон
Файл дизайнера `mission_control_screen_free_voice_game_master.html` (1477 строк). Положи его в репозиторий БЕЗ изменений: `docs/design/mission_control_prototype.html` (пользователь прикрепит файл к этой задаче; если файла нет, остановись и попроси его). Это единственный источник правды по виду. Не придумывай свой дизайн, не «улучшай», не переосмысляй. Задача: сайт должен выглядеть и анимироваться точно как этот HTML.

## Что за дизайн (разметка в файле)
1. **Splash** (`#screen-splash`): белый экран, плавающий Bleep, «Mission Control», «Waking up Bleep…», зелёная полоса загрузки (≈1 с).
2. **Greeting** (`#screen-greeting`): белый экран, пузырь «Hi! I'm Bleep! Ready for a screen-free adventure?» (с хвостиком, bounce), большой Bleep машет коралловой рукой, снизу линия и зелёная кнопка CONTINUE (справа на десктопе), кнопка Sound сверху справа.
3. **Parent Setup** (`#screen-profile-setup`): ОДНА тёмная карточка, где спрашивается ВСЯ информация сразу (скриншот пользователя): Child's Name, Age Group (1–2 / 3–5 / 6–8), чипы «What does your child need most right now?», поле Interests/Parent Context, Default Parent Quiet-Time Goal (20m/30m/60m), выбор потока «Educational Video + Quiz» или «Active Physical Missions» (для 1–2 лет скрыт, вместо него зелёная плашка Toddler Mode), кнопка «START SESSION FOR NAME 🚀», бейдж COPPA Safe.
4. **Video stage** (`#screen-video`): тёмная шапка (имя, «Zero Ads • Auto-Next», «Parents»), рамка видео 16:9 с фиолетовой границей, точки эпизодов, кнопки «Next Video in Catalog» и «Play with Bleep Now!».
5. **Mission** (`#screen-mission`): верхняя панель (звёзды раундов, таймер сессии, Hold: Exit), круг с обратным отсчётом и Bleep по центру (позы: clap, jump, wave, sneak, drink; эмоции: happy, giggle, excited, surprised, detective, listening), жёлтый бейдж-демо (эмодзи + слово), белая карточка с короткой фразой и быстрыми ответами, две огромные кнопки «I DID IT!» (мятная) и «TALK» (голубая, пульсирует при записи). Тап по Bleep = щекотка и хихиканье.
6. **Complete** (`#screen-complete`): «MISSION ACCOMPLISHED!», награда (Ship Part), тизер завтрашнего эпизода, Level и Streak, «PLAY NEXT ADVENTURE 🚀». Модалка Spaceship Garage.
7. Hub-плитки: в `<style>` есть класс `.hub-tile` (толстая белая рамка 4px, тень, hover) под экран выбора активностей. Используй его для Hub (см. ниже).

## Как переносить (обязательные правила)
- Скопируй блок `<style>` дизайнера почти дословно в `src/styles/prototype.css` (переменные, `.btn-game`, `.btn-lime/mint/purple/coral/sky`, `.hub-tile`, `.speech-bubble-duo`, анимации Bleep, `.action-*`, `.bleep-tickle`, `.voice-pulse`, `.particle-pop`, `.countdown-circle`). Фон body, шрифты Fredoka + Nunito, как в файле.
- Разметку каждого экрана переведи в React-компоненты 1 в 1: те же Tailwind-классы (в проекте Tailwind 4, произвольные значения вроде `bg-[#1C145C]/95` работают), те же SVG Bleep (перенеси в `Mascot.tsx` с вариантами `splash/greeting/mission`, эмоциями и действиями из `setBleepEmotion` и классов `action-*`). `class` → `className`, inline `onclick` → React-обработчики. Эмодзи оставь как в дизайне.
- Не меняй цвета, отступы, радиусы, тени, текст кнопок и заголовков, порядок блоков. Допустимы только отличия из раздела «Допустимые отклонения».
- Экраны Splash и Greeting белые, остальное тёмное космическое, ровно как в файле.

## Поток и логика (дизайн дизайнера + наши готовые части)
Первый запуск: Splash → Greeting → Parent Setup → дальше по режиму. Повторный запуск (профиль в localStorage): Splash (короткий) → сразу Hub. Кнопка «Parents» в шапке открывает Parent Setup для правки.
После START SESSION (как в дизайне):
- 1–2 года: Video stage → Mission (clap / peek-a-boo / cow).
- 3–8, «Educational Video + Quiz»: Video stage → Mission в режиме quiz.
- 3–8, «Active Physical Missions»: сразу Mission.
Это каркас дизайнера. Дальше заменяем его заглушки нашим готовым:

| В дизайне | Что подставить из нашего проекта |
|---|---|
| Видео-заглушка («Curated Ad-Free Video Slot») | Наш реальный видеоплеер/каталог (YouTube-embed из нашего каталога, без рекомендаций и ссылок наружу), те же кнопки Next Video / Play with Bleep. Видео по возрастной группе. Если ID ещё `REPLACE_ME`, покажи аккуратный placeholder из дизайна и не падай. |
| `MISSIONS_DB` (по 3 раунда) | Наш контент: 48 физических заданий (режимы Hunt, Roadtrip Spy, Lava) для turbo, 24 вопроса Quiz для brain, 1–2 года остаются из дизайна. Раунды берутся из нашего content-слоя, формат раунда как в дизайне (demoEmoji, demoWord, shortPrompt, replies, praise, seconds). Если у задания нет эмодзи/слова, добавь адаптер. |
| `speakText` (browser TTS) | Наши pre-rendered Piper-клипы (manifest), fallback на speechSynthesis. |
| TALK (Web SpeechRecognition) | Наш пайплайн: запись → Workers AI Whisper → Groq-ответ Bleep (воркер). Fallback как в дизайне, если микрофон недоступен. Визуально кнопка и пульс как в дизайне. |
| `state` (level, streak, stars) | Наш профиль/XP/ранги/streak в localStorage (ранги Recruit→Commander). Complete показывает Agent Level и Streak из нашего профиля. Garage хранит наши разблокированные части. |
| Нет других игр | Hub с нашими играми (см. ниже). |

## Hub и игры (в дизайне их нет, добавляем в том же стиле)
- Экран Hub в стиле дизайнера: тёмный фон, шапка как у video-экрана (аватар, имя, «Parents»), плитки `.hub-tile` с большими иконками и цветными заливками из палитры: Quiz, Memory, Move (Hunt/Roadtrip/Lava), Ask Bleep, Space Scale, Sketch Artist, Tic-tac-toe, Balloon Count (когда будет). Плитки по возрасту как у нас: 1–2 только видео-режим; 3–5 Quiz/Memory/Move/Space; 6–8 и дополнительно Ask, Tic-tac-toe, Sketch.
- Вход в Hub: со страницы Complete вторая кнопка «More games», из шапки video/mission экранов (кроме Mission во время раунда), и как главный экран при повторном запуске.
- Все наши игры (Memory, Space Scale, Sketch, Tic-tac-toe, Quiz, Move, Ask) уже тёмные; открывай их внутри рамки дизайна: та же шапка, кнопки Back/Home, фон и шрифты. Игры не переписывай, только обёртка и цвета в тему. Сохрани: историю навигации, «Next up», хлебные крошки, press-and-hold Grown-ups (в дизайне это «Hold: Exit», сделай так же), начисление XP.

## Допустимые отклонения от HTML (минимальные, по COPPA и нашей логике)
1. Child's Name: поле остаётся как в дизайне, но подпись «Child's Nickname» и подсказка «First name or fun nickname, saved only on this device». Хранится только локально, на сервер не отправляется.
2. Поле Interests/Parent Context: остаётся визуально, хранится локально; в LLM-запросы НЕ отправляется. Взамен для персонализации используй выбранные чипы потребностей.
3. Убери всё, что требует сети/трекинга. Никакой камеры и геолокации.
4. Tailwind CDN не подключай: используй Tailwind проекта (классы те же).
Все остальные различия считаются багом.

## Приёмка (Definition of Done)
1. После очистки localStorage: Splash → белый Greeting → Parent Setup (визуально совпадает со скриншотом пользователя) → START SESSION → Video stage или Mission → Complete → Hub.
2. Каждый из 6 экранов дизайнера сверен с исходным HTML рядом в браузере (390×844 и 1280×720) и совпадает.
3. Mission: Bleep меняет позы и эмоции, кольцо отсчёта, бейдж-демо, быстрые ответы, I DID IT, TALK, щекотка Bleep работают.
4. Наши реальные видео, задания, Quiz, озвучка Piper, STT работают внутри дизайна; игры открываются из Hub и возвращают XP.
5. Повторный запуск открывает Hub, а «Parents» открывает Parent Setup.
6. `npm run typecheck && npm run build`, все check-скрипты чистые; main chunk < 110 KB gzip, игры lazy.
Коммиты по шагам: «Add designer prototype and tokens», «Port Splash/Greeting/Setup», «Port Video/Mission/Complete», «Wire content, voice and profile», «Hub and games in theme». Пуш в main. В ответе: список файлов, таблица «что из дизайна → что подключено», список отклонений и всё, что не удалось сделать.
