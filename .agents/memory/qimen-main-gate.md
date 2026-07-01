---
name: Qi Men Главные Врата (Main Gate/Star)
description: How the "Главные Врата"/"Главная звезда" of an hour chart are derived (literaqimen method), reusable for any structure that keys off them.
---
Главные Врата / Главная звезда of an hour chart (метод literaqimen.ru):
1. Find the hour heavenly stem on the EARTH plate → palace A (this equals `chart.zhiFuPalace` = 时干宫; it already handles 甲 hiding via 旬首仪).
2. Read the stem standing ABOVE it (heaven plate at A) → stem X.
3. Find X on the EARTH plate → palace B (X is never 甲, so always found; if B==5 use 寄宫 → 坤2).
4. Главные Врата = the gate whose HOME/native palace is B; Главная звезда = the star whose home palace is B.

**Why:** Several structures (e.g. Нефритовая Дева) require the structure's palace door to equal this computed Main Gate. It is derived per-hour, not a fixed list.
**How to apply:** Implemented as `mainGateStar(chart)` in `artifacts/api-server/src/lib/qimen/chart.ts`. Verified vs article example: hour 乙 → palace2, above=己, 己 on earth→palace7 Dui → door 惊门, star 天柱.
