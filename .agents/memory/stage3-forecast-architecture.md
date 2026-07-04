---
name: Stage 3 Forecast Architecture
description: Western astrology transits + Matrix of Destiny arcana integrated into daily forecasts. Single prose synthesis without technical subsections.
---

## Forecast Pipeline

Daily forecast = `computeDailyForecast(birthDate, natalChart, transits, date)`

1. **Arcana**: computed from birth date via `reduceToArcana()`, pulled from ontology with semantic profile
2. **Transits**: `computeTransits(natalChart, date)` — 10 transit bodies vs natal chart, classical Lilly moiety orbs, house mapping, duration by planet speed
3. **Synthesis**: `buildSynthesisText()` — single prose paragraph combining arcana essence + transit sentences. No technical labels, no subsections.

## Natal Chart Caching

- Stored in `users.natalChart` (JSONB)
- Computed on-demand via `POST /profile/natal-chart` or auto-computed in `getOrComputeToday()` when cache missing
- Runtime guard: validates `bodies` array before trusting cached JSON; falls back to recompute from birth data
- Default birth time: 12:00 if not provided

## Type Safety

- `baziElement` removed from `Dashboard` and `DailyForecast` schemas
- `transits` array added to forecast payload: `{transitBody, natalBody, type, orb, house, durationDays}`
- `baziElement` column in `daily_forecasts` made nullable (schema drift from prior version)

## Coordinate Validation

- Always use nullish checks (`birthLatitude == null`) not falsy checks; allows 0° lat/lon (equator/prime meridian)

## Ontology Seed

- 22 arcana entities (`type = 'arcana'`) with full semantic profiles
- Auto-seeded on server startup if tables empty
