---
name: Forecast payload vs shared response schema drift
description: Why persisted daily_forecasts payloads break when a shared response schema gains a new required field.
---

The daily forecast persists a JSONB `payload` (matrix/bazi/fengShui/conflicts/warnings)
produced by `computeDailyForecast` → `computeBazi`. The forecast response schema reuses
`BaziSummary`, which is ALSO used by the live `/bazi` endpoint.

**Rule:** when a required field is added to a *shared* response schema (e.g. `BaziSummary`),
the persisted-snapshot path (forecast) will fail `GetTodayForecastResponse.parse` for both
legacy rows AND fresh rows, because `computeBazi` does not produce live/date-relative fields
(`spendingDays`, etc.). The live endpoint composes those fields separately in its route.

**Why:** `computeBazi`/`BaziResult` is a timeless core chart; date-relative projections
(`spendingDays` via `computeSpendingDays(birthDate, birthTime, fromDate, days)`) belong in
route composition, not in the stored payload. So they are simply absent from the payload.

**How to apply:** inject such fields at serialization time from the user's birthDate/birthTime
(empty array when no birthDate), do NOT trust the stored payload and do NOT widen `computeBazi`.
This already mirrors the existing fengShui monthly-field backfill in `buildForecast`. Same
pattern applies to any future required field added to a schema shared between a live endpoint
and a persisted snapshot. Symptom in prod logs: ZodError at `forecast.ts` parse with
`path: ["bazi", <field>]`, received undefined; UI shows "Прогноз на сегодня пока недоступен".
