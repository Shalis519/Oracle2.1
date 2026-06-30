---
name: Ji Fu (值符/Джи Фу) four scales
description: How year/month/day/hour Ji Fu palaces are computed for the wish-fulfilment feature, and the scope where each calibration is trusted.
---

# Ji Fu (Джи Фу) wish-fulfilment scales

Feature "Исполнение желаний с Джи Фу" on /qimen anchors on the HOUR Ji Fu palace
over a 14-day window and counts how many of {year, month, day, hour} Ji Fu land in
that SAME palace → "Сила взаимодействия" (strength 1..4). Card emitted only if
strength ≥ 2. Universal: NO birthDate gate, NO 六冲 filter (unlike Три Генерала).

Engine: `artifacts/api-server/src/lib/qimen/jifu.ts` (`computeJiFuWishes(from, days)`).
Each scale resolves a palace via `palaceOfStem(ju, yin, stemIdx)` over the local
SEQ `[4,5,6,7,8,9,3,2,1]`, with center-5 adjusted to palace 2. The 旬首仪 of a
pillar is `XUN_YI_STEM[floor(ganzhiIndex/10)]`; a 甲 (stem 0) day hides as its 旬首仪.

## The four definitions (each validated against user anchors)

- **HOUR** = "def A" 置闰: reuse the chart's own `zhiFuPalace` from `buildChart`
  (pHour, def A). Validated 341/341 against the July-2026 hour table.
- **DAY** = "def A" continuous 阴 ju via `(-index) % 9 || 9` on the day pillar.
  Anchors: 30 Jun 2026 → СВ (NE), 8 Jul 2026 → Восток (East).
- **MONTH** = "def B" 旬首仪, 中元-calibrated. Anchors: 午 month → Север (North),
  未 month → ЮЗ (SW).
- **YEAR** = "def B" 旬首仪, 阴 ju picked from `[7,4,1]` by `(year-1984) % 3`.
  Anchor: 2026 → Восток (East).

## Calibration scope — IMPORTANT before reusing outside 2026

**Why:** the anchors the user gave all fall in the 阴 (yin) half of 2026, so all four
scales are confirmed correct *now*. They are NOT all universally proven:
- HOUR and DAY (阴-half) are general.
- MONTH is calibrated for 中元 years (子午卯酉 group, which includes 2026).
- YEAR is calibrated for the current 三元 cycle.
- 阳-half (yang) daily behavior is mirrored but UNVALIDATED.

**How to apply:** if extending the window past 2026 or into the 阳 half, re-validate
MONTH/YEAR against a fresh authoritative table before trusting output. The scope
caveat is also documented in the `jifu.ts` header.

## Pluralization / display

Backend only emits strength 2..4, so the UI always renders "балла" (grammatically
valid for 2–4). Card sentence: "Джи Фу в час {hourAnimalGen} на {directionLoc}.
Сила взаимодействия с ним {strength} балла." Day basis is server-local civil day.
