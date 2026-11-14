# Codex: Memory — космический редизайн (карточки, иконки, победа)

Репозиторий: Tarlan2006/westcoded-business-cup, ветка main. Перед началом: `git pull --rebase`. Если агент полной реконструкции (PROMPT_FULL_RECONSTRUCTION) ещё не слит в main — дождись его, иначе будут конфликты. Коммиты без Co-Authored-By и любых трейлеров Claude.

## Задача
Найди экран игры Memory (`grep -ril memory src/`). Поменяй только его внешний вид: карточки, иконки, шапку, подвал с Bleep, оверлей победы. Логику игры (пары, XP, возраст 3-5 = 4 пары, 6-8 = 8 пар, колбэки onComplete/onBack) НЕ трогай. Другие файлы не меняй, кроме нового `src/games/memory/icons.tsx` (или рядом с Memory) и CSS самого Memory. Если в проекте уже есть Mascot/Bleep, GameButton, Chip из реконструкции — используй их, не дублируй.

## Палитра
Фон #0F0A3C (звёзды: несколько радиальных точек + мягкий радиальный градиент #24187A сверху слева), карточки/кнопки #1C145C, рамки #4C35DE, фиолетовый #6C47FF, мятный #2CE69B (#15B875 тень), коралл #FF7849, золото #FFD13B, небо #38BDF8. Шрифты Fredoka (заголовки, кнопки) + Nunito (текст).

## Карточка
- Закрытая: градиент `linear-gradient(180deg,#7C5CFF,#5B3DE0)`, рамка 3px rgba(255,255,255,.92), радиус 20px, тень `0 6px 0 #2A1F8A`, в центре золотая 4-конечная звезда (#FFD13B) + 4 маленькие точки #C7D2FE по углам. Отступ внутри ≈22% ширины.
- Открытая: фон #F8FAFC, рамка #fff, тень `0 6px 0 #C7D2FE`, иконка занимает почти всю карточку (внутренний отступ ≈5% ширины, иконки КРУПНЫЕ).
- Найденная пара: рамка #2CE69B, тень `0 6px 0 #15B875, 0 0 22px rgba(44,230,155,.6)`, справа сверху бейдж-галочка 28px (круг #2CE69B, белая рамка 3px, тёмная галочка #062C1E).
- Ошибка (две разные): рамка #FF7849, тень `0 6px 0 #D95326`, лёгкое покачивание 300 мс, потом карточки закрываются. Bleep в подвале делает mood «oops».
- Переворот: rotateY 180°, 350 мс, transform/opacity only; `prefers-reduced-motion` — без анимации. Нажатие: translateY(4px) и тень 2px.
- Каждая карточка — настоящий `<button>` с aria-label (закрытая «Hidden card», открытая — название иконки), минимум 44px.
- Сетка: 3-5 лет — 2 колонки × 4 ряда (карточки ≈170×112, зазор 12); 6-8 лет — 4×4 (≈80×92, зазор 10); десктоп ≥1024px — 4 колонки по ≈160×190, справа большой Bleep с репликой.

## Шапка и подвал
- Сверху: «← Back» (пилюля 48px, #1C145C, рамка #4C35DE, текст #C7D2FE), круглая кнопка Home, справа чип «N XP» (фон rgba(255,209,59,.16), рамка и текст #FFD13B).
- Под ней: хлебные крошки «Learn › Memory» (#A5B4FC, 13px), заголовок Memory (Fredoka 40px, белый), подзаголовок «Flip two cards to find a matching pair.», ряд звёзд прогресса (найдено = #FFD13B, остальные #3A2E8E) и «N of M pairs».
- Подвал: Bleep 64px слева + белый пузырь реплики (рамка 3px #E2E8F0, тень `0 5px 0 #CBD5E1`, Fredoka 15px, цвет #1E293B). Реплики: старт «Find the matching space friends!», ошибка «Oops, not a pair! Try again!», победа «You found them all!». Если Bleep уже есть в проекте — вызывай его с mood happy/oops/excited; иначе встрой SVG.

## Победа
Затемнение rgba(9,6,38,.72) + карточка #1C145C с рамкой 4px #FFD13B, радиус 28px: зелёная плашка «🎉 ALL PAIRS FOUND!», Bleep 110px (excited), «Great memory!» (Fredoka 30px), «+20 XP ⭐» (#FFD13B), большая кнопка PLAY AGAIN (градиент #34E89E→#1CC88A, тень `0 6px 0 #0F8F60`, тёмный текст #062C1E), ниже вторичная «Try something else». XP начисляй как сейчас.

## Иконки (8 штук, мультяшный стиль)
Общий стиль: толстый тёмный контур #1E1B4B (3.5px, round), яркая заливка, блик, мордочка с глазами, румянцем и улыбкой. Сделай компонент `MemoryIcon({ name })`, ниже готовые SVG (viewBox 64). Вставь как есть, `aria-hidden="true"`; размер 100% карточки.

### sat
```svg
<svg viewBox="0 0 64 64" width="100%" height="100%" aria-hidden="true"><path d="M6 40Q4 28 32 22" fill="none" stroke="#1E1B4B" stroke-width="11" stroke-linecap="round" opacity="0"/><path d="M5 38Q10 24 32 24" fill="none" stroke="#1E1B4B" stroke-width="3.5" stroke-linejoin="round" stroke-linecap="round" stroke-width="8"/><path d="M5 38Q10 24 32 24" fill="none" stroke="#8B7CFF" stroke-width="4" stroke-linecap="round"/><circle cx="32" cy="32" r="19" fill="#FFB347" stroke="#1E1B4B" stroke-width="3.5" stroke-linejoin="round" stroke-linecap="round"/><path d="M14 27Q32 33 50 27M15 40Q32 46 49 40" stroke="#FF8A3D" stroke-width="4" fill="none" stroke-linecap="round" opacity=".6"/><ellipse cx="23" cy="21" rx="5" ry="3" fill="#fff" opacity=".55" transform="rotate(-30 23 21)"/><ellipse cx="25" cy="32" rx="2.9" ry="3.5" fill="#1E1B4B"/><ellipse cx="39" cy="32" rx="2.9" ry="3.5" fill="#1E1B4B"/><circle cx="26" cy="30.8" r="1.1" fill="#fff"/><circle cx="40" cy="30.8" r="1.1" fill="#fff"/><ellipse cx="21" cy="37" rx="3" ry="2" fill="#FF6B9A" opacity=".7"/><ellipse cx="43" cy="37" rx="3" ry="2" fill="#FF6B9A" opacity=".7"/><path d="M27 37Q32 43 37 37Z" fill="#7F1D3A" stroke="#1E1B4B" stroke-width="2" stroke-linejoin="round"/><path d="M59 38Q54 52 32 52" fill="none" stroke="#1E1B4B" stroke-width="3.5" stroke-linejoin="round" stroke-linecap="round" stroke-width="8"/><path d="M59 38Q54 52 32 52" fill="none" stroke="#8B7CFF" stroke-width="4" stroke-linecap="round"/></svg>
```
### rocket
```svg
<svg viewBox="0 0 64 64" width="100%" height="100%" aria-hidden="true"><path d="M16 38L5 52l14-2zM48 38l11 14-14-2z" fill="#FF6B4A" stroke="#1E1B4B" stroke-width="3.5" stroke-linejoin="round" stroke-linecap="round"/><path d="M25 48h14l-7 13z" fill="#FFD13B" stroke="#1E1B4B" stroke-width="3.5" stroke-linejoin="round" stroke-linecap="round"/><path d="M32 4Q52 18 48 46H16Q12 18 32 4z" fill="#F8FAFC" stroke="#1E1B4B" stroke-width="3.5" stroke-linejoin="round" stroke-linecap="round"/><path d="M32 4Q44 12 46 28" fill="none" stroke="#E2E8F0" stroke-width="4" stroke-linecap="round"/><path d="M32 4Q26 8 24 14Q32 10 40 14Q38 8 32 4z" fill="#FF6B4A" stroke="#1E1B4B" stroke-width="3.5" stroke-linejoin="round" stroke-linecap="round" stroke-width="2.5"/><circle cx="32" cy="26" r="9" fill="#38BDF8" stroke="#1E1B4B" stroke-width="3.5" stroke-linejoin="round" stroke-linecap="round"/><circle cx="29" cy="23" r="2.6" fill="#fff" opacity=".85"/><ellipse cx="27" cy="40" rx="2.9" ry="2.6" fill="#1E1B4B"/><ellipse cx="37" cy="40" rx="2.9" ry="2.6" fill="#1E1B4B"/><circle cx="28" cy="38.8" r="1.1" fill="#fff"/><circle cx="38" cy="38.8" r="1.1" fill="#fff"/><ellipse cx="23" cy="45" rx="3" ry="2" fill="#FF6B9A" opacity=".7"/><ellipse cx="41" cy="45" rx="3" ry="2" fill="#FF6B9A" opacity=".7"/><path d="M28.5 45Q32 51 35.5 45Z" fill="#7F1D3A" stroke="#1E1B4B" stroke-width="2" stroke-linejoin="round"/></svg>
```
### star
```svg
<svg viewBox="0 0 64 64" width="100%" height="100%" aria-hidden="true"><path d="M32 4l8.6 17.6 19.4 2.8-14 13.7 3.3 19.3L32 48.3 14.7 57.4 18 38.1 4 24.4l19.4-2.8z" fill="#FFD13B" stroke="#1E1B4B" stroke-width="3.5" stroke-linejoin="round" stroke-linecap="round"/><path d="M32 10l5 11" stroke="#FFF3A8" stroke-width="4" stroke-linecap="round" fill="none"/><ellipse cx="25" cy="31" rx="2.9" ry="3.5" fill="#1E1B4B"/><ellipse cx="39" cy="31" rx="2.9" ry="3.5" fill="#1E1B4B"/><circle cx="26" cy="29.8" r="1.1" fill="#fff"/><circle cx="40" cy="29.8" r="1.1" fill="#fff"/><ellipse cx="21" cy="36" rx="3" ry="2" fill="#FF6B9A" opacity=".7"/><ellipse cx="43" cy="36" rx="3" ry="2" fill="#FF6B9A" opacity=".7"/><path d="M27 36Q32 42 37 36Z" fill="#7F1D3A" stroke="#1E1B4B" stroke-width="2" stroke-linejoin="round"/></svg>
```
### ufo
```svg
<svg viewBox="0 0 64 64" width="100%" height="100%" aria-hidden="true"><path d="M20 30Q20 8 32 8t12 22z" fill="#A5F3FC" stroke="#1E1B4B" stroke-width="3.5" stroke-linejoin="round" stroke-linecap="round"/><ellipse cx="32" cy="22" rx="6" ry="8" fill="#2CE69B" stroke="#1E1B4B" stroke-width="2.5"/><circle cx="30" cy="21" r="1.6" fill="#1E1B4B"/><circle cx="35" cy="21" r="1.6" fill="#1E1B4B"/><ellipse cx="32" cy="35" rx="28" ry="11" fill="#8B7CFF" stroke="#1E1B4B" stroke-width="3.5" stroke-linejoin="round" stroke-linecap="round"/><ellipse cx="32" cy="32" rx="20" ry="4" fill="#B6A9FF" opacity=".6"/><circle cx="14" cy="37" r="3.2" fill="#FFD13B" stroke="#1E1B4B" stroke-width="2"/><circle cx="32" cy="41" r="3.2" fill="#FFD13B" stroke="#1E1B4B" stroke-width="2"/><circle cx="50" cy="37" r="3.2" fill="#FFD13B" stroke="#1E1B4B" stroke-width="2"/><path d="M22 47l-5 12M42 47l5 12" stroke="#FFD13B" stroke-width="4" stroke-linecap="round" opacity=".8"/></svg>
```
### moon
```svg
<svg viewBox="0 0 64 64" width="100%" height="100%" aria-hidden="true"><path d="M40 5A27 27 0 1 0 59 44 22 22 0 0 1 40 5z" fill="#FFD13B" stroke="#1E1B4B" stroke-width="3.5" stroke-linejoin="round" stroke-linecap="round"/><path d="M26 14Q14 22 14 34" fill="none" stroke="#FFF3A8" stroke-width="4" stroke-linecap="round"/><circle cx="22" cy="42" r="4" fill="#F5B800" stroke="#1E1B4B" stroke-width="2"/><ellipse cx="20" cy="32" rx="2.9" ry="3.5" fill="#1E1B4B"/><ellipse cx="32" cy="32" rx="2.9" ry="3.5" fill="#1E1B4B"/><circle cx="21" cy="30.8" r="1.1" fill="#fff"/><circle cx="33" cy="30.8" r="1.1" fill="#fff"/><ellipse cx="16" cy="37" rx="3" ry="2" fill="#FF6B9A" opacity=".7"/><ellipse cx="36" cy="37" rx="3" ry="2" fill="#FF6B9A" opacity=".7"/><path d="M22 37Q26 43 30 37Z" fill="#7F1D3A" stroke="#1E1B4B" stroke-width="2" stroke-linejoin="round"/><path d="M52 12l2 4 4 2-4 2-2 4-2-4-4-2 4-2z" fill="#fff" stroke="#1E1B4B" stroke-width="1.5" stroke-linejoin="round"/></svg>
```
### astro
```svg
<svg viewBox="0 0 64 64" width="100%" height="100%" aria-hidden="true"><circle cx="32" cy="32" r="26" fill="#F8FAFC" stroke="#1E1B4B" stroke-width="3.5" stroke-linejoin="round" stroke-linecap="round"/><rect x="13" y="17" width="38" height="29" rx="14" fill="#2B2A7A" stroke="#1E1B4B" stroke-width="3.5" stroke-linejoin="round" stroke-linecap="round"/><path d="M18 24Q24 20 34 21" stroke="#8FA8FF" stroke-width="3" fill="none" stroke-linecap="round"/><ellipse cx="25" cy="33" rx="2.9" ry="3.5" fill="#fff"/><ellipse cx="39" cy="33" rx="2.9" ry="3.5" fill="#fff"/><circle cx="26" cy="31.8" r="1.1" fill="#fff"/><circle cx="40" cy="31.8" r="1.1" fill="#fff"/><ellipse cx="21" cy="38" rx="3" ry="2" fill="#FF6B9A" opacity=".7"/><ellipse cx="43" cy="38" rx="3" ry="2" fill="#FF6B9A" opacity=".7"/><path d="M27 38Q32 44 37 38Z" fill="#7F1D3A" stroke="#1E1B4B" stroke-width="2" stroke-linejoin="round"/><rect x="26" y="52" width="12" height="7" rx="3" fill="#FF6B4A" stroke="#1E1B4B" stroke-width="2.5"/><circle cx="55" cy="22" r="4" fill="#FF6B4A" stroke="#1E1B4B" stroke-width="2.5"/></svg>
```
### comet
```svg
<svg viewBox="0 0 64 64" width="100%" height="100%" aria-hidden="true"><path d="M4 58Q18 34 38 26" stroke="#FF6B4A" stroke-width="13" fill="none" stroke-linecap="round" opacity=".6"/><path d="M10 60Q26 42 42 32" stroke="#FFD13B" stroke-width="7" fill="none" stroke-linecap="round"/><circle cx="43" cy="24" r="17" fill="#FF8A3D" stroke="#1E1B4B" stroke-width="3.5" stroke-linejoin="round" stroke-linecap="round"/><ellipse cx="36" cy="17" rx="5" ry="3" fill="#fff" opacity=".5" transform="rotate(-30 36 17)"/><ellipse cx="37" cy="24" rx="2.9" ry="3.5" fill="#1E1B4B"/><ellipse cx="49" cy="24" rx="2.9" ry="3.5" fill="#1E1B4B"/><circle cx="38" cy="22.8" r="1.1" fill="#fff"/><circle cx="50" cy="22.8" r="1.1" fill="#fff"/><ellipse cx="33" cy="29" rx="3" ry="2" fill="#FF6B9A" opacity=".7"/><ellipse cx="53" cy="29" rx="3" ry="2" fill="#FF6B9A" opacity=".7"/><path d="M38.5 29Q43 35 47.5 29Z" fill="#7F1D3A" stroke="#1E1B4B" stroke-width="2" stroke-linejoin="round"/></svg>
```
### alien
```svg
<svg viewBox="0 0 64 64" width="100%" height="100%" aria-hidden="true"><path d="M20 14L15 5M44 14l5-9" stroke="#1E1B4B" stroke-width="3.5" stroke-linecap="round"/><circle cx="15" cy="5" r="3.6" fill="#FF6B9A" stroke="#1E1B4B" stroke-width="2.5"/><circle cx="49" cy="5" r="3.6" fill="#FF6B9A" stroke="#1E1B4B" stroke-width="2.5"/><path d="M6 36Q6 11 32 11t26 25q0 22-26 22T6 36z" fill="#2CE69B" stroke="#1E1B4B" stroke-width="3.5" stroke-linejoin="round" stroke-linecap="round"/><ellipse cx="20" cy="34" rx="7" ry="9" fill="#1E1B4B" transform="rotate(-12 20 34)"/><ellipse cx="44" cy="34" rx="7" ry="9" fill="#1E1B4B" transform="rotate(12 44 34)"/><circle cx="22" cy="31" r="2.6" fill="#fff"/><circle cx="46" cy="31" r="2.6" fill="#fff"/><path d="M26 48Q32 54 38 48Z" fill="#7F1D3A" stroke="#1E1B4B" stroke-width="2.5" stroke-linejoin="round"/><path d="M16 18Q22 13 30 13" stroke="#9FF5CF" stroke-width="3.5" fill="none" stroke-linecap="round"/></svg>
```

Для 4 пар (3-5 лет) бери: sat, rocket, star, ufo. Для 8 пар (6-8 лет) — все восемь. Перемешивай как сейчас.

## Проверка
`npm run typecheck && npm run build` без ошибок; запусти существующие check-скрипты. Проверь на 390×844 и 1280×720: карточки не обрезаны, иконки крупные, контраст текста ≥4.5:1, фокус виден. Один коммит: «Memory: space restyle». Запушь в main и напиши, какие файлы изменил.
