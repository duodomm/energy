# Деплой на Cloudflare (бесплатный тариф)

Сайт спроектирован под платформу из ТЗ v1.1: **Workers + Static Assets**, без SSR.
Все вычисления — на клиенте; серверная логика — только лид-контур.

## Архитектура

```
                    Cloudflare (free tier)
 ┌──────────────────────────────────────────────────────────┐
 │  Workers Static Assets  ←  out/  (статика из next build) │
 │    • index.html + _next (SPA, hash-роутинг)              │
 │    • /photos/* (PIL-оптимизированы), /api-data/*.json    │
 │                                                          │
 │  Worker (worker/index.ts)  —  run_worker_first: /api/*   │
 │    • POST /api/lead: Turnstile → CRM(РФ) → D1 (без ПДн)  │
 │    • GET  /api/*: 404 → клиент читает /api-data/*.json   │
 │                                                          │
 │  D1 «altenergo-leads»: ТЕХНИЧЕСКИЕ записи без ПДн        │
 │  (имя/контакт живут только в CRM на территории РФ)       │
 └──────────────────────────────────────────────────────────┘
```

Публичные страницы НЕ ходят в D1 на каждый запрос: контент читается из
статического бандла `public/api-data/*.json` (ТЗ раздел 5). Бандл пересобирается
при изменении контента (`bun scripts/build-api-json.ts`).

## Шаги деплоя

### 0. Предусловия
- Node 20+ и/или Bun; аккаунт Cloudflare
- `npm install -g wrangler` (или `bunx wrangler …`)
- `npx wrangler login`

### 1. Создать D1 и применить схему
```bash
npx wrangler d1 create altenergo-leads
# вставить database_id в wrangler.json (вместо ЗАМЕНИ_НА_ID_…)
npx wrangler d1 execute altenergo-leads --file worker/schema.sql --remote
```

### 2. Сборка статики
```bash
bash scripts/build-static.sh
```
Скрипт: дампит контент БД → `public/api-data/`, временно исключает
`src/app/api` (POST-роуты несовместимы с `output: export`), собирает `out/`,
возвращает всё на место.

### 3. Секреты (Turnstile + каналы доставки лидов)
```bash
npx wrangler secret put TURNSTILE_SECRET   # из dash.cloudflare.com → Turnstile
npx wrangler secret put CRM_WEBHOOK_URL    # webhook CRM на территории РФ
# резервный канал (если CRM ещё нет):
npx wrangler secret put TG_BOT_TOKEN
npx wrangler secret put TG_CHAT_ID
```
Без `TURNSTILE_SECRET` проверка пропускается (антиспам: honeypot + WAF).
Клиентский ключ Turnstile — в настройках форм (в проде заменить тестовый
`always-passes` на боевой sitekey).

### 4. Деплой
```bash
npx wrangler deploy
# превью: npx wrangler versions upload && npx wrangler deployments …
```
Статика и Worker едут одним деплоем (`assets.directory: ./out`).

### 5. Домен, WAF, лимиты (дашборд Cloudflare)
- Привязать свой домен (Workers Routes / Custom Domains), включить SSL «Full»
- WAF-правило rate-limit на `POST /api/lead`: ~10 запросов/мин/IP (ТЗ 7.1)
- Кэш: ассеты уже иммутабельны (`_next/*` с хэшами); при желании
  `Cache-Control` для `/photos/*` и `/api-data/*` — 1 час
- HSTS, Bot Fight Mode — по вкусу

### 6. Аналитика и реклама
- Яндекс.Метрика: счётчик подключён в `src/lib/analytics.ts` (+ цели);
  заменить тестовый ID на боевой в `src/app/layout.tsx` / `analytics.ts`
- РСЯ: слоты `AdSlot` (`src/components/common/ad-slot.tsx`) — вставить боевые
  blockId из Еды РСЯ; пока показывают заглушки-плейсхолдеры
- robots.txt уже в `public/`

## Обновление контента

Контент живёт в SQLite (Prisma). Правки через админку (`#/admin`, dev-режим)
или напрямую в `prisma/data/*.ts` + `db push` + seed. После изменений:

```bash
bash scripts/build-static.sh && npx wrangler deploy
```

(В проде по ТЗ это делает ежедневный Cron Worker — при желании вынести
`build-api-json` в CI.)

## Бесплатные лимиты Cloudflare (хватает с запасом)

| Ресурс | Free tier | Наш расход |
|---|---|---|
| Static assets | без лимита запросов | ~4 МБ файлов |
| Worker-запросы | 100 000/сутки | только /api/* (лиды + 404-фолбэки) |
| CPU на запрос | 10 мс (free) | лид < 5 мс CPU (subrequest не считается) |
| D1 | 5 млн чтений/сутки | единичные INSERT |

## Локальная проверка

- Dev-режим (живой API + Prisma): `bun run dev`
- Статика как файлы: `cd out && python3 -m http.server 8899`
- Статика + Worker вместе: `npx wrangler dev` (после build-static.sh)

## Что НЕ переносится в статическую версию

- `#/admin` — внутренний редактор контента, работает только в dev-режиме
  (в статике данные читаются из бандла, редактирование — через пересборку)
- API-роуты Next — заменены JSON-бандлом + Worker (см. архитектуру)
