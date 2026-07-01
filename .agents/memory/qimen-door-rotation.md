---
name: Qi Men 八门 door rotation formula
description: Correct doorShift formula for 转盘 Qi Men — differs between Yang and Yin dun, and is NOT the same as xun.pos.
---

## The rule

`doorShift = ((iHour - iFu * dir) % 8 + 8) % 8`

where `iFu = pathIndex(pFu)`, `iHour = pathIndex(pHour)`, `dir = yin ? -1 : 1`.

- Yang (dir=+1): reduces to `kStar = iHour - iFu` (classical, door plate moves same as star plate)
- Yin  (dir=-1): reduces to `(iFu + iHour) % 8` (empirically verified, NOT xun.pos-based)

**Why:** The old formula `xun.pos * dir` was wrong for Yin dun. Verified against external reference calculator for July 4, 2026 (己卯, 阴8局):
- Dragon hour (iFu=1, iHour=1, yin): correct doorShift=2 → 杜门 at SW, 生门 at SE ✓
- Ox hour    (iFu=1, iHour=4, yin): correct doorShift=5 → 杜门 at N ✓

**How to apply:** In `chart.ts`, the single line `const doorShift = ...` near `const kStar = ...`. The `xun.pos` variable is irrelevant to door rotation.

Note: FuYin (kStar=0) does NOT mean doorShift=0 in Yin dun. Stars freeze (heaven=earth), but doors still shift by 2*iFu.
