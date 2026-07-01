# Aether Oracle (Этер Оракул)

A Russian-language esoteric self-knowledge web platform: daily synthesis forecasts combining Matrix of Destiny, Bazi, and Feng Shui, plus a dream journal, habit/ritual tracker, contacts with family tree, and a travel map.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- API contract (source of truth): `lib/api-spec/openapi.yaml` (keep `info.title` = "Api" — it controls codegen filenames)
- Generated React Query hooks + types: `lib/api-client-react/src/generated/`
- Generated Zod schemas: `lib/api-zod/src/generated/`
- DB schema (source of truth): `lib/db/src/schema/*.ts` (users, forecasts, feedback, contacts, familyConnections, dreams, tasks, travels)
- Backend domain logic: `artifacts/api-server/src/lib/oracle.ts` (Matrix/Bazi/FengShui/dreams/daily forecast), `artifacts/api-server/src/lib/peachBlossom.ts` (Цветок Персика / 桃花), `lib/auth.ts` (Clerk JIT bridge), `lib/dates.ts`
- Esoteric content data: `artifacts/api-server/src/data/` (arcana, bazi, fengshui, dreams)
- API routes: `artifacts/api-server/src/routes/` (registered in `index.ts`)
- Frontend pages: `artifacts/web/src/pages/`; theme tokens: `artifacts/web/src/index.css`; auth/router shell: `artifacts/web/src/App.tsx`

## Architecture decisions

- Users are JIT-provisioned in the local `users` table on first authenticated request, keyed by Clerk user id (`getOrCreateUser` in `lib/auth.ts`). Every query is scoped to `req.localUser.id`.
- Daily forecast is computed once per user per day and persisted in `forecasts` (scalar columns for list views + a `payload` jsonb holding the full matrix/bazi/fengShui/conflicts/warnings).
- Systems endpoints return 400 when prerequisites are missing: matrix/bazi need `birthDate`, fengshui needs `bedDirection`. The UI prompts the user to complete their profile.
- Astrology is soft-disabled (no AstroAsk key provisioned).
- All UI copy is Russian; no emojis anywhere in the UI.

## Product

Daily synthesis "Oracle of the Day" (Tarot arcana + Bazi element + Feng Shui stars + synthesis text + feedback), Matrix of Destiny (22 arcana), Bazi (four pillars / day master / symbolic stars / Цветок Персика peach-blossom flowers + 30-day activation days & hours), Feng Shui flying stars for 2026 by bed direction, dream journal with interpretation + keywords, habit/ritual tracker (water/steps/rituals by date), contacts with family tree and upcoming birthdays, and a travel map (visited / wishlist). Multi-user via Clerk auth. Tarot is a stub.

## User preferences

- All user-facing text must be in Russian.
- No emojis anywhere in the UI.

## Gotchas

- After editing `lib/api-spec/openapi.yaml`, run `pnpm --filter @workspace/api-spec run codegen` before using new hooks/schemas.
- Parameterized query hooks require an explicit `queryKey` in options, e.g. `useGetMatrix({ query: { queryKey: getGetMatrixQueryKey() } })` — omitting it is a TS error.
- Route ordering matters: `/contacts/birthdays` before `/contacts/:id`, `/travels/stats` before `/travels/:id`.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
