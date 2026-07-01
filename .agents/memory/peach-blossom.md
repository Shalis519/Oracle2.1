---
name: Peach Blossom (桃花) computation
description: How the Цветок Персика feature derives flowers and selects activation days/hours, and how its rule differs from the Noble Helper activation.
---

# Peach Blossom (桃花 / Цветок Персика)

Two flowers are derived from the **birth year branch** (social charisma) and
**birth day branch** (personal romance) via the peach map:
申子辰→酉 Петух, 寅午戌→卯 Кролик, 亥卯未→子 Крыса, 巳酉丑→午 Лошадь.
If year and day give the same animal → "coincide" (double strength, one block);
otherwise two flowers.

## Day/hour selection differs from the Noble Helper rule

**Do not reuse `selectActivationHours` (Noble Helper) for peach.** The peach rule
(ported from the astrologer's own bot) is different:

- **Valid activation DAYS** = the flower's own branch + its 六合 / 三合 / 方合
  partners, **minus** any branch that clashes (六冲) with the natal year OR day
  branch; a day is **also skipped** when its branch clashes with that day's
  current year/month branch.
- **Valid HOURS** = only the **天乙贵人 (Noble Person) hours of that day's day
  stem**, minus void (旬空 via `getDayXunKong`), minus the 六害 harm hour of the
  day branch, minus hours clashing (六冲) with the natal year/day branch.

Contrast: Noble Helper anchors on the day-branch's own hour (always preferred,
bypasses exclusions) plus 六合/三合/三會 affinity hours; it has **no 六害
filter** and does not restrict to 天乙贵人. So the two engines are genuinely
separate — keep them separate.

**Why:** mixing the two rules silently produces wrong hour lists (e.g. missing the
六害 exclusion, or offering non-Noble hours).

**How to apply:** the peach engine (`artifacts/api-server/src/lib/peachBlossom.ts`)
carries its own `GUIREN`, `SIX_HARMS`, `PEACH_MAP` tables; reuse those, not
oracle.ts's Noble helper.

## Structure

- Separate endpoint `/peach-blossom` + `PeachBlossomSummary` schema — deliberately
  NOT folded into `BaziSummary` (that schema is shared with the persisted forecast
  payload; adding required fields there 500s `/forecast/today` — see
  forecast-payload-schema-drift.md).
- All esoteric text lives in `data/peachBlossom.ts` (verbatim from source, emojis
  stripped per the app's no-emoji rule). The 5 activation methods / conditions /
  warnings / placement are static; only branches, flowers and the 30-day pairs are
  computed.
- Birth time defaults to noon when null (matches computeBazi); day branch is
  unaffected by noon-vs-midnight except at the 23:00 rollover.
