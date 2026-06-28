---
name: Bazi (Four Pillars) computation
description: Why Bazi is computed with a local library instead of an external API, and the accuracy/robustness rules
---

# Bazi (Four Pillars) computation

**Decision:** compute the Four Pillars locally with the `lunar-typescript` library (MIT, zero deps), NOT via an external Bazi API.

**Why:** Bazi is deterministic calendar/astronomy math (solar terms 节气 + sexagenary cycle). Free public Bazi APIs are mostly Chinese, key-gated, rate-limited, Chinese-language, and unreliable — a poor production dependency. A local library is offline, free, private, and accurate. The previous in-house "simplified" version was wrong near boundaries: it changed the year pillar on Jan 1 (should be Lichun 立春 ~Feb 4) and tied the month pillar to the calendar month (should be solar terms).

**How to apply / gotchas:**
- Map the library's Chinese gan/zhi characters back to our Russian `HEAVENLY_STEMS`/`EARTHLY_BRANCHES` by canonical index via `GAN_CN`/`ZHI_CN` (those arrays are in canonical 甲.../子... order).
- The library THROWS on out-of-range input (month 13, hour 99). Our `parseDate` regex doesn't range-check, so validate month/day/hour/minute and wrap the library calls in try/catch — return `null` (callers turn null into a 400 "complete your profile"), never let it 500.
- Sanity anchors when changing this: 2000-01-07 day pillar = 甲子; 2000-02-03 year = 己卯 (pre-Lichun) vs 2000-02-05 year = 庚辰.
