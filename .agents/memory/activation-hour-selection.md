---
name: Activation hour selection
description: How Bazi activation favourable/excluded double-hours are chosen, and the anchor-always-preferred rule.
---

# Activation hour selection (Bazi «Благородный человек» / «Удача продвижения»)

A shared `selectActivationHours({anchorIdx, dayBranchIdx, monthBranchIdx, natalBranchIdxs, voidBranchIdxs})` in `oracle.ts` returns `{hours, avoidHours}` with Russian reason strings. Branch idx 子=0…亥=11; `clashOf(i)=(i+6)%12`.

## Four exclusion conditions (mingli.ru)
- **пустой час** = day void (空亡): from `EightChar.getDayXunKong()` (returns CN branch chars like "申酉"), mapped via `ZHI_CN.indexOf`.
- **разрушитель дня** = 六冲 clash with the DAY branch.
- **неиспользуемый час** = 六冲 clash with the MONTH branch (月破 month-breaker).
- **нежелательный час** = clash with the user's natal year/day branches.

Preferred/favourable candidates: the anchor's own hour first, then harmony hours — слияние 六合, союз 三合, сезон 三會.

## Anchor-always-preferred rule (deliberate)
The Noble's own hour (`idx === anchorIdx`) is ALWAYS emitted as `preferred: true` and BYPASSES all exclusions. Exclusions only prune the supplementary harmony hours.

**Why:** the user instruction "предлагать час с благородным человеком в приоритете" makes the Noble's hour the anchor of the whole activation. When the noble DAY clashes the MONTH (e.g. 子 day in 午 month), the noble's own 子 hour is itself a month-breaker; applying the exclusion uniformly removed the central hour and left no preferred option. Keeping the anchor exempt avoids that degenerate case.

**How to apply:** day-level filtering already skips days where the noble clashes natal (so natal-clash can't hit the anchor); a branch never clashes/voids itself, so the only exclusion that could ever hit the anchor is month-break — which the anchor exemption intentionally ignores. Do not add day-level 月破 skipping unless asked; scope was hour selection only.

`computePromotionActivation(birthDate, birthTime, today)` reuses `computeNobleHelperActivation` internally and surfaces its `hours`/`avoidHours`/date as `nobleDate`. Promotion can legitimately return null.
