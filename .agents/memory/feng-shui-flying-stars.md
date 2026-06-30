---
name: Feng Shui flying-star conventions
description: Non-obvious Lo Shu / flying-star rules used by Bazi-page activations (e.g. "Удача продвижения"). Read before adding any sector/star-based activation.
---

# Flying-star conventions (oracle.ts)

These are domain conventions, not derivable from code — they encode how the app
models Feng Shui charts. Keep new activations consistent with them.

- **Lo Shu forward-fly path** (顺飞), used for BOTH animal placement and star
  flying: центр first, then `СЗ → З → СВ → Ю → С → ЮЗ → В → ЮВ`. The index in
  this path is the "offset"; the same offset indexes both the month-animal fill
  and the star value at that palace.
- **Star at palace** = `((center - 1 + offset) % 9) + 1` (forward fly). Annual
  2026 center = 1, which reproduces the hardcoded `FLYING_STARS_2026` table
  (NW=2, S=5, E=8, …) — so annual stars can be read from that table directly via
  `getFlyingStar(direction).starNumber`.
- **Monthly center star seed** by year-branch group: `子午卯酉 → 8`,
  `辰戌丑未 → 5`, `寅申巳亥 → 2`. It DESCENDS by one each Bazi month counting
  from the Tiger month (立春) = month 1, wrapping 1..9.
- **Animal ↔ palace**: month animal sits in центр; 12 animals into 9 palaces
  means 3 are always absent. `offset = ((promo - month + 12) % 12)`; `offset > 8`
  ⇒ animal absent ⇒ no activation that month.
- **Affliction suppression**: an activation is hidden when its sector carries an
  annual OR monthly flying star of **2 or 5**. (E.g. NW in 2026 = annual 2, so a
  promotion sector landing on NW in 2026 is suppressed — this is correct, not a
  bug, even though the source docx used NW as its illustrative example.)
- **Bazi month interval**: use `lunar.getPrevJie()/getNextJie().getSolar().toYmd()`
  (the 节 boundaries) — these bound the current Bazi month (~30 days), which is
  exactly the period a monthly sector chart is valid for.

**Why:** these rules are subtle and a wrong center seed / fly direction silently
produces a plausible-but-wrong sector. **How to apply:** any future
sector-based Bazi activation should reuse `FLY_ORDER_DIRECTIONS`,
`monthlyCenterStar`, and the 2/5 suppression rule rather than re-deriving them.

- **Monthly star at a sector** = fly the monthly center forward by the sector's
  offset in `FLY_ORDER_DIRECTIONS`: `((monthlyCenterStar(yearBr,monthBr) - 1 +
  offset) % 9) + 1`. Each of the 9 stars appears once in `FLYING_STARS_2026`, so
  that annual table doubles as a star-number→meaning lookup (`getStarByNumber`).
  `computeFengShui` returns annual + monthly + a combined recommendation and
  falls back monthly=annual on any lunar-typescript failure.

- **Schema-tightening pitfall:** `FengShuiInfo` is embedded in `DailyForecast`,
  which is persisted as jsonb. Adding required fields breaks `*.parse()` of old
  stored payloads. `buildForecast` backfills new monthly fields from the annual
  ones before parse. ANY future required field added to a schema that is stored
  in a forecast payload needs the same backfill, or history/today endpoints 500.
