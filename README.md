# westcoded: Business Cup 2.0 (Zimran)

B2C web-продукт для взрослых американцев 25-45. Команда: **westcoded**.

> Статус: каркас. Тема продукта выбирается; текущий пресет (BillCheck, проверка медицинских счетов) является заглушкой, чтобы каркас работал end-to-end. Подробнее: `docs/IDEA_SWAP.md`.

**Живой URL:** _(добавить после деплоя)_

## Что внутри

- Next.js 15 (App Router) + TypeScript + Tailwind
- Без регистрации и логина: открыл URL и пользуешься
- `POST /api/analyze`: AI-анализ (Anthropic или OpenAI), rate limit, demo-режим без ключа
- Paywall: бесплатные проверки, затем Stripe Payment Link (test mode) или demo-разблокировка
- Вся тема продукта в одном файле: `src/config/product.ts`

## Запуск локально

```bash
npm install
cp .env.example .env.local   # ключ необязателен: без него работает demo-режим
npm run dev                  # http://localhost:3000
```

## Деплой (Vercel)

1. Import Project -> выбрать этот репозиторий.
2. Environment Variables: `LLM_PROVIDER`, `ANTHROPIC_API_KEY` (или `OPENAI_API_KEY`), `NEXT_PUBLIC_PAYMENT_LINK`, `NEXT_PUBLIC_SITE_URL`.
3. Deploy. Проверить URL в инкогнито.

## Документы

- `docs/SUBMISSION_CHECKLIST.md`: что сдать и как нас оценивают
- `docs/PITCH_OUTLINE.md`: 10 слайдов
- `docs/IDEA_SWAP.md`: как перенастроить под выбранную идею
- `docs/CODEX_TASKS.md`: разделение задач между агентами и командой

## Дисклеймер

Информационный сервис, не юридическая, не медицинская и не финансовая консультация.
