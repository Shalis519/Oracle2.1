# Aether Oracle (Этер Оракул)

A Russian-language esoteric self-knowledge web platform: daily synthesis
forecasts combining Matrix of Destiny, Bazi, Feng Shui and Qi Men Dun Jia, plus
a dream journal, habit/ritual tracker, contacts with a family tree, and a travel
map.

> All user-facing text is in Russian. This README (developer documentation) is in
> English.

## Tech stack

- **Monorepo:** pnpm workspaces, Node.js 24, TypeScript 5.9
- **API:** Express 5
- **Database:** PostgreSQL + Drizzle ORM
- **Auth:** Clerk
- **Frontend:** React + Vite
- **API contract:** OpenAPI → Orval codegen (React Query hooks + Zod schemas)

## Repository layout

```text
artifacts/        Deployable apps (web frontend, api-server, mockup-sandbox)
lib/              Shared libraries (db, auth, api-spec, generated clients, ...)
scripts/          Utility scripts
```

See `replit.md` for a detailed map of where each feature lives.

## Prerequisites

- Node.js 24+
- pnpm 9+
- A PostgreSQL database
- A Clerk application (for authentication)

## Environment variables

Copy `.env.example` to `.env` and fill in the values. You must provide:

| Variable                     | Required | Description                                        |
| ---------------------------- | -------- | -------------------------------------------------- |
| `DATABASE_URL`               | yes      | PostgreSQL connection string                       |
| `CLERK_SECRET_KEY`           | yes      | Clerk backend secret key                           |
| `CLERK_PUBLISHABLE_KEY`      | yes      | Clerk publishable key (read by the API server)     |
| `VITE_CLERK_PUBLISHABLE_KEY` | yes      | Clerk publishable key (read by the web frontend)   |
| `VITE_CLERK_PROXY_URL`       | optional | Clerk proxy URL (only when using a Clerk proxy)    |

The following are provided automatically by the Replit runtime and normally do
**not** need to be set by hand: `PORT`, `BASE_PATH`, `NODE_ENV`, `LOG_LEVEL`,
`REPL_ID`, `REPLIT_DOMAINS`.

## Setup

```bash
# 1. Install dependencies
pnpm install

# 2. Push the database schema (development)
pnpm --filter @workspace/db run push

# 3. Generate the API client hooks and Zod schemas from the OpenAPI spec
pnpm --filter @workspace/api-spec run codegen

# 4. Typecheck everything
pnpm run typecheck
```

## Running

Each app runs as its own service. On Replit these are wired up as workflows; run
them locally with:

```bash
# API server
pnpm --filter @workspace/api-server run dev

# Web frontend
pnpm --filter @workspace/web run dev
```

## Common commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks/schemas
  after editing `lib/api-spec/openapi.yaml`
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)

## Local development (outside Replit)

See [`LOCAL_SETUP.md`](./LOCAL_SETUP.md) for a step-by-step guide to running
this project on your own computer (Windows, macOS, or Linux), including
Node.js/pnpm installation, a local `.env`, and a database/auth provider that
work outside Replit.

## Reusing this project on another Replit account

1. Import this GitHub repository into the new account (Replit → Create → Import
   from GitHub).
2. Add a PostgreSQL database and set `DATABASE_URL`.
3. Set up Clerk for the new account and add the Clerk keys listed above to the
   secrets.
4. Run `pnpm install`, then `pnpm --filter @workspace/db run push` to create the
   schema.
5. Start the workflows. Publish/deploy from the new account to get a fresh URL.

## Notes

- After editing `lib/api-spec/openapi.yaml`, always run the codegen command
  before using new hooks/schemas.
- The app currently targets the year 2026 for its annual Feng Shui / Qi Men
  calculations.

## Системы построения карт Ци Мэнь

В Aether Oracle разные временные слои рассчитываются отдельными методами. Их нельзя автоматически заменять друг другом.

| Слой карты | Система Aether Oracle | Основной вход | Примечание |
|---|---|---|---|
| Годовая карта | Отдельный годовой слой проекта, 180-летний цикл | Солнечный год, годовой Gan-Zhi | Не использует часовой Zhi Run |
| Месячная карта | **Qi Men Month Chart School Joey Yap** | Солнечный месячный Gan-Zhi, таблица Yin 1/Yin 4/Yin 7 | 2026: 丙申 и 丁酉 относятся к Yin 7 |
| Дневная карта | **Joey Yap Day Chart** | Дневной Gan-Zhi, солнечный сезон, отдельный 甲子-якорь | Не использует месячный или часовой Ju |
| Часовая карта | **Zhi Run / 置闰** | Солнечный термин, 符头, Yuan, часовой Gan-Zhi | Подтверждённый рабочий режим часовых карт |
| Личная карта рождения | Часовой расклад на момент рождения | Ба-цзы рождения, часовой Ju и часовой Gan-Zhi | Строится на базе часового слоя; режим времени фиксируется отдельно |

### Политика времени

Книги Joey Yap подтверждают, что месячные карты определяются солнечными терминами и что личная карта Ци Мэнь является часовым раскладом на момент рождения. В просмотренных книгах Joey Yap нет прямого универсального требования автоматически переводить каждую дату в истинное солнечное время с уравнением времени. Поэтому это нельзя приписывать Joey Yap без отдельного подтверждения.

В Aether Oracle для событийных часовых карт сохраняется локальная гражданская дата и действующая проверенная сетка Zhi Run. Для личной карты рождения предусмотрена отдельная обработка времени рождения с координатами: базовый режим использует среднее местное солнечное время, а истинное солнечное время с уравнением времени, «резиновое» и совмещённое время являются отдельными режимами и не должны молча смешиваться с часовыми картами событий.

Видео Марины описывают именно такую расширенную модель: «Солнечное время», «Резиновое время» и «Совмещённое время». Это полезная отдельная методика расчёта времени рождения, но она не является автоматически подтверждённым правилом всех книг Joey Yap. Подробная фиксация находится в [`docs/qimen-birth-time-policy.md`](./docs/qimen-birth-time-policy.md) и [`docs/qimen-calculation-methods.md`](./docs/qimen-calculation-methods.md).

### Месячный блок в приложении

Месячный блок использует тот же визуальный построитель девяти дворцов, но получает Ju через `monthJoeyYapJuForDate()`, а месячный столп через `monthPillarForDate()`. Контрольные даты 21.08.2026 (`丙申`, Yin 7) и 22.09.2026 (`丁酉`, Yin 7) совпали с Mingli в ключевых показателях: `天辅` и `杜门`.
