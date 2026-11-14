# Промпт для Codex: новый кинематографичный мультяшный стиль Space Scale

Скопируй всё ниже в Codex целиком.

---

## Задача

Переделай внешний вид игры **Space Scale** в `src/games/space/**` по утверждённому макету. Логику (данные, камера, квиз, очки, `onComplete`, `speak`) не ломай. Меняется только оформление и компоновка сцены.

### Разрешено менять
`src/games/space/**`, `dev/space-preview.html`, `src/screens/Space.tsx` и `src/screens/Space.css` (только если нужно для рамки, без смены пропсов), скриншоты в `src/games/space/screens/`.

### Запрещено менять
`src/App.tsx`, `src/screens/Home.tsx`, `src/index.css`, `shared/types.ts`, `package.json`, `worker/*`, `src/audio/*`, `src/state/*`, `content/*`, `scripts/*`, `src/games/sketch/**`. Не добавляй зависимости и внешние картинки: вся графика только SVG в коде.

## Стиль: «тёмный космос, мультяшно и минималистично»

Идея: в духе масштабных сравнений, где объекты стоят в один ряд на общей линии. Графика **полностью наша** (плоские формы с глазками), никаких фотографий и чужих материалов.

**Палитра** (оформи переменными `--sp-*` в `space.css`, на корне игры):
- фон `#0b1020`, карточки и кнопки `#141a35`, границы `#2b3560` и `#3a4577`
- основной текст `#ffffff`, второй текст `#a9b8f0`, подписи `#c7d2fe`, иконки `#e8edff`
- акцент `#ffd166` (активная точка, кнопка Start quiz, Солнце)
- звёзды: мелкие белые точки радиусом 1–1,5 px, 15–20 штук через `radial-gradient` на фоне, без картинок и без анимации по умолчанию

**Шрифты:** заголовки Fredoka 600, текст Nunito 700 (если на сайте уже подключены другие, возьми их и сохрани те же размеры и веса).

**Компоновка кадра (десктоп 1280x720; на телефоне масштабируется, см. ниже):**
1. Слева сверху маленький логотип «Space Scale» (Fredoka, 20 px).
2. По центру сверху название объекта (56 px) и под ним строка «Тип · about N km wide» (20 px, цвет `#a9b8f0`).
3. Ряд объектов на **общей нижней линии** (baseline около 72% высоты). Все объекты нарисованы в одном масштабе относительно друг друга, самый большой занимает 60–70% высоты сцены, маленькие остаются крошечными (это и есть эффект). Под каждым подпись 15 px (`#c7d2fe`). Если подписи близких маленьких объектов налезают, раздвигай их по горизонтали.
4. Под рядом одна плашка-сравнение по центру: скругление 24 px, фон `#141a35`, рамка 1,5 px `#2b3560`, текст 20 px, например «Jupiter is about 11 times as wide as Earth.» (число считать из данных, как сейчас).
5. Внизу слева круглая кнопка Back 56 px, справа круглая кнопка Next 56 px (границa `#3a4577`, фон `#141a35`, шеврон-иконка SVG), по центру 8 точек прогресса: активная 22x8 px жёлтая, остальные 8x8 `#3a4577`. На последней остановке вместо Next жёлтая кнопка-пилюля «Start quiz» (высота 56 px, текст `#1b1f3b`).
6. Убери всё лишнее с экрана: никаких рамок вокруг сцены, карточек фактов поверх объектов и тяжёлых градиентов. Факт и кнопка «Hear it» переезжают в компактную строку под плашкой сравнения (или открываются по иконке 🔊 рядом с названием), главное правило: на экране не больше одной плашки и одной строки с фактом.

**Переходы:** оставь существующую плавную логарифмическую камеру. При смене остановки объекты едут и масштабируются через `transform` (400–600 мс, `ease-in-out`), подписи плавно появляются (`opacity`). Новое название появляется с коротким fade. При `prefers-reduced-motion` только fade.

**Мобильная версия (390 px):** сцена занимает ширину экрана, название 36 px, подписи 13 px, самый большой объект масштабируется до ширины экрана, маленькие остаются точками с подписью-выноской (тонкая линия 1 px `#3a4577` к подписи сверху). Кнопки Back и Next по 48 px, плашка сравнения в два ряда при необходимости. Всё помещается без горизонтальной прокрутки, кнопки не меньше 48 px.

**Особые случаи (как в макете):**
- Если объект меньше 6 px (Солнце рядом с Бетельгейзе), рисуй его жёлтой точкой 4 px со свечением (`box-shadow: 0 0 10px 3px rgba(255,209,102,.7)`) и подписью «Sun (a tiny dot!)». В остальных остановках минимальный размер 11 px.
- Бетельгейзе: красно-оранжевая звезда с мягким радиальным свечением позади, глазки и улыбка, жёлтые пятнышки.
- Квиз и экран результата переведи в тот же тёмный стиль (фон `#0b1020`, карточки `#141a35`, крупные варианты ответа не ниже 56 px, верный ответ подсвечивается зелёным `#6fd08c`, неверный мягко подсвечивается оранжевым `#ffb347`, без красного).

## Контент и объекты
- Данные остаются в `objects.json`. Все 8 остановок (Child, Blue whale, Mount Everest, Moon, Earth, Jupiter, Sun, Betelgeuse) нарисуй в этом же стиле. Первые шесть пока в светлом стиле, переделай их по образцу ниже (плоские формы, крупные глазки и улыбка, пастельные цвета). Everest нарисуй как простую горку с шапкой снега и маленьким флажком.
- Пропорции берутся только из данных, а не из SVG: SVG рисуется один раз в своём размере и масштабируется через `transform: scale`.

## Образцы графики (наши, готовые к копированию)

Каждый SVG уже нарисован в нужном стиле; адаптируй под компоненты React (`className` вместо `class`, camelCase для атрибутов). `id` градиентов и клипов сделай уникальными (`useId`).

### Child
```svg
<svg role="img" aria-label="Child" style="position:absolute; left:296px; top:498px" width="12" height="22" viewBox="0 0 12 22">
<circle cx="6" cy="4" r="3.5" fill="#ffd9b0"/><rect x="2" y="8" width="8" height="8" rx="2" fill="#ffb347"/><rect x="2.5" y="16" width="3" height="6" fill="#5b6bd6"/><rect x="6.5" y="16" width="3" height="6" fill="#5b6bd6"/></svg>
```

### Blue whale
```svg
<svg role="img" aria-label="Blue whale" style="position:absolute; left:380px; top:290px" width="640" height="240" viewBox="0 0 640 240">
<path d="M150 70 Q140 40 118 28 M150 70 Q162 40 188 28" stroke="#9fd0ff" stroke-width="5" fill="none" stroke-linecap="round"/>
<ellipse cx="300" cy="150" rx="280" ry="80" fill="#4f8cff"/>
<path d="M560 132 Q612 112 626 58 Q646 122 630 150 Q646 190 626 232 Q612 172 560 164 Z" fill="#4f8cff"/>
<ellipse cx="290" cy="192" rx="230" ry="36" fill="#dbeafe"/>
<circle cx="118" cy="132" r="8" fill="#0b1020"/><circle cx="121" cy="129" r="2.6" fill="#fff"/>
<path d="M62 160 Q104 188 158 166" stroke="#0b1020" stroke-width="5" fill="none" stroke-linecap="round"/>
<ellipse cx="86" cy="152" rx="12" ry="7" fill="#ff9fb2" opacity=".7"/>
</svg>
```

### Moon
```svg
<svg role="img" aria-label="Moon" style="position:absolute; left:364px; top:509px" width="11" height="11" viewBox="0 0 11 11"><circle cx="5.5" cy="5.5" r="5.5" fill="#c9cfe6"/><circle cx="3.5" cy="4" r="1.2" fill="#a6aecb"/><circle cx="7" cy="7" r="1" fill="#a6aecb"/></svg>
```

### Earth
```svg
<svg role="img" aria-label="Earth" style="position:absolute; left:420px; top:480px" width="40" height="40" viewBox="0 0 40 40">
<circle cx="20" cy="20" r="20" fill="#4f9cff"/><path d="M8 14q6-6 12-2t2 8q-8 2-10 8-6-8-4-14zM26 24q6 0 8 6-6 6-12 4 0-6 4-10z" fill="#6fd08c"/></svg>
```

### Jupiter
```svg
<svg role="img" aria-label="Jupiter" style="position:absolute; left:540px; top:81px" width="440" height="440" viewBox="0 0 440 440">
<defs><clipPath id="jc"><circle cx="220" cy="220" r="220"/></clipPath></defs>
<circle cx="220" cy="220" r="220" fill="#f3c08a"/>
<g clip-path="url(#jc)"><rect y="50" width="440" height="46" fill="#e39a63"/><rect y="132" width="440" height="30" fill="#fbd9ae"/><rect y="290" width="440" height="52" fill="#e39a63"/><rect y="360" width="440" height="28" fill="#fbd9ae"/></g>
<ellipse cx="330" cy="316" rx="46" ry="26" fill="#d9694a"/>
<circle cx="168" cy="212" r="15" fill="#0b1020"/><circle cx="173" cy="207" r="5" fill="#fff"/>
<circle cx="272" cy="212" r="15" fill="#0b1020"/><circle cx="277" cy="207" r="5" fill="#fff"/>
<path d="M170 258 Q220 308 274 258" stroke="#0b1020" stroke-width="9" fill="none" stroke-linecap="round"/>
<ellipse cx="130" cy="252" rx="22" ry="12" fill="#ff9fb2" opacity=".6"/><ellipse cx="312" cy="252" rx="22" ry="12" fill="#ff9fb2" opacity=".6"/>
</svg>
```

### Betelgeuse
```svg
<svg role="img" aria-label="Betelgeuse" style="position:absolute; left:610px; top:150px" width="370" height="370" viewBox="0 0 370 370">
<defs><radialGradient id="sg" cx="50%" cy="50%" r="50%"><stop offset="70%" stop-color="#ff7a59" stop-opacity=".35"/><stop offset="100%" stop-color="#ff7a59" stop-opacity="0"/></radialGradient></defs>
<circle cx="185" cy="185" r="185" fill="url(#sg)"/>
<circle cx="185" cy="185" r="160" fill="#e8553f"/>
<path d="M44 120 Q150 70 320 140 Q230 150 150 210 Q90 190 44 120Z" fill="#ff9a7a" opacity=".85"/>
<circle cx="250" cy="105" r="18" fill="#ffc15c"/><circle cx="105" cy="270" r="14" fill="#ffc15c"/><circle cx="290" cy="250" r="20" fill="#ffc15c"/>
<circle cx="142" cy="178" r="12" fill="#0b1020"/><circle cx="146" cy="174" r="4" fill="#fff"/>
<circle cx="228" cy="178" r="12" fill="#0b1020"/><circle cx="232" cy="174" r="4" fill="#fff"/>
<path d="M146 218 Q185 252 226 218" stroke="#0b1020" stroke-width="8" fill="none" stroke-linecap="round"/>
</svg>
```

### Sun при малом размере
```html
<div role="img" aria-label="Sun" style="width:4px;height:4px;border-radius:2px;background:#ffd166;box-shadow:0 0 10px 3px rgba(255,209,102,.7)"></div>
```

## Правила работы
- Перед коммитом: `npm run typecheck && npm run build && npm run check-content` и `node src/games/space/scale.check.ts`.
- Коммиты небольшие: 1) переменные и тёмный фон, 2) компоновка сцены, 3) все 8 SVG, 4) кнопки, точки и плашка, 5) мобильная версия, 6) квиз и результат, 7) скриншоты.
- Перед пушем `git pull --rebase origin main`. Если конфликт вне разрешённых файлов, остановись и сообщи.
- Без `Co-Authored-By` и подписей в коммитах.

## Критерии приёмки
1. На десктопе и на 390 px каждая из 8 остановок выглядит как макет: тёмный фон со звёздами, объекты на общей линии, подписи, плашка со сравнением, кнопки и точки прогресса.
2. Масштаб объектов верен (Jupiter примерно в 11 раз больше Earth, Earth примерно в 3,7 раза больше Moon), Солнце рядом с Betelgeuse рисуется точкой.
3. Квиз и результат в том же стиле, очки и `onComplete` работают как прежде.
4. Нет горизонтальной прокрутки, кнопки не меньше 48 px, текст контрастный (не ниже 4,5:1), `prefers-reduced-motion` учтён.
5. `git diff --stat origin/main...HEAD` показывает только разрешённые пути, проверки зелёные.

В конце приложи скриншоты всех 8 остановок на 1280 и 390 px и коротко опиши, что изменилось.
