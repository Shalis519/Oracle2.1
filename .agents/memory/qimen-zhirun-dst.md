---
name: Qi Men 置闰 ju selection — DST trap
description: Why Qi Men Dun Jia 符头/元 arithmetic must use integer day numbers, not millisecond diffs.
---

# Qi Men 置闰 (Zhi Run) ju selection must use integer day numbers

The 置闰 simulation marches 符头 blocks forward from a solstice ~6 months back, then
computes `offset = day - 符头` and `超神 = term - 符头` to assign (term, yuan) and the
leap (六元 at 芒种/大雪 when 超神≥9). Each 元 is exactly 5 days; the dun (阴/阳) and ju
number come from the 三元歌 table for the block the target day lands in.

**Rule:** do ALL of this arithmetic with a DST-proof civil day count
(`Math.floor(Date.UTC(y,mo,d)/86400000)`), never `(b-a)/86400000` on local Date times.

**Why:** marching dates with `addDays`/`setDate` from months earlier crosses the
spring-forward DST boundary, shifting time-of-day by an hour. A millisecond diff then
reads e.g. 9.96 instead of 10.0, so `floor(offset/5)` drops a 元 — yuan boundaries
drift one day mid-year (observed: a 甲戌 符头 day showing 元2 instead of 元3).

**How to verify correctness:** yuan transitions must land exactly on 符头 days (stem 甲
or 己), and every 上元符头 must have a 子午卯酉 branch. If either is off by a day, suspect
DST/time-of-day leakage in the date math.
