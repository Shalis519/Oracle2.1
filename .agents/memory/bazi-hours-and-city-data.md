---
name: Bazi hours calc & offline city data
description: Non-obvious lessons for the "Расчёт времени" double-hours feature and the bundled GeoNames city DB
---

## tvoibazi.ru/hours algorithm (reproduced in api-server baziHours.ts)
- Three columns: Солнечное (solar), Резиновое (rubber), Совмещённое (combined).
- The clock shift is **mean solar**: `shift_mins = utcOffset*60 - lng*4`. There is NO equation-of-time term — adding one breaks the match.
- `utcOffset` flows through the pipeline as **hours (may be fractional**, e.g. +5.5, +5.75); the sunrise loop and `shift` both rely on that. Don't coerce to integer.
- Solar = fixed solar 2h blocks (Rat centred on solar midnight, 23:00–01:00 solar) + shift.
- Combined = per-branch **intersection** of the solar and rubber arcs (this was the site's actual behaviour; show "—" when arcs don't overlap). Arc intersection must be done on a circular 24h clock (Rat crosses midnight).
- "Сдвоенный час Крысы" ON = single Rat row; OFF = split Rat at 00:00 into late/early → 13 rows total.
- **Why:** verified exactly against Anapa 2026-06-29 UTC+3 (solar Крыса 23:31–01:31, rubber Лошадь 11:08–14:02). Treat the math as a faithful port; don't "improve" it.

## GeoNames Russian city names — join, don't guess
- The comma-joined `alternatenames` column in `cities5000.txt` mixes ALL Cyrillic languages with no tags. Naive "first Cyrillic token" picks wrong-language names (gave Ossetian "Мæскуы" / Serbian "Шангај" instead of "Москва"/"Шанхай").
- Correct: stream `alternateNamesV2.txt`, filter `isolanguage == 'ru'`, prefer isPreferredName > short > plain, skip colloquial/historic, and JOIN to cities by **geonameid**. Only ~23k of 69k cities have a Russian name; fall back to the Latin name otherwise.
- Country names in Russian are computed on the frontend via `Intl.DisplayNames(['ru'],{type:'region'})` from the country code — no need to bundle them.
- TZ → UTC offset computed on the frontend from the IANA tz + selected date via `Intl.DateTimeFormat(..., {timeZoneName:'longOffset'})` (handles DST); parsed to fractional hours and sent to the backend.

## Shipping a large JSON data asset with the esbuild api-server
- Big runtime data (cities.json, ~5MB) is NOT imported in TS (would make tsc parse it / esbuild inline it). Instead it lives at the artifact root and `build.mjs` `copyFile`s it into `dist/`; the module reads it at runtime via `readFileSync(path.join(dirname(fileURLToPath(import.meta.url)), 'cities.json'))`.
- **Why:** the api-server `dev` script runs `build` then `start` from `dist/`, so dev and prod both resolve the copied file. Use `import.meta.url` (ESM-correct, typechecks) not `__dirname`. Wrap the read in try/catch so a missing file degrades to empty results instead of crashing boot.
