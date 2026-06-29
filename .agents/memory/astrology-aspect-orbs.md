---
name: Astrology aspect orbs (classical / moiety)
description: How natal aspects are computed and which orb system is used; reuse for synastry/transits.
---

# Aspect orbs — classical per-planet (moiety) system

Aspects in the natal chart are NOT taken from `circular-natal-horoscope-js`'s
built-in aspect engine. That library only supports orbs **per aspect type**
(fixed angle orbs), not **per planet**. We compute aspects ourselves in
`artifacts/api-server/src/lib/astrology.ts` (`computeAspects`).

**Rule:** the orb allowed for an aspect between two bodies = the average of the
two bodies' full orbs (equivalently the sum of their moieties / half-orbs), per
William Lilly's classical orbs. Full orbs used: Sun 15, Moon 12, Mercury 7,
Venus 7, Mars 8, Jupiter 9, Saturn 9. Modern planets/points (Uranus/Neptune/
Pluto 5, Chiron 4, Nodes 3, Lilith 3) get modest orbs (not classical tradition).
Only the 5 major aspects (conjunction/sextile/square/trine/opposition). Output
sorted tightest-first.

**Why:** user explicitly asked for the classical orb-by-planet system rather
than fixed orbs per aspect type or modern luminary bumps.

**How to apply:** when building synastry (Task: synastry) and predictive
techniques (transits/progressions/directions), reuse the same `CLASSICAL_ORB`
table + moiety approach for consistency rather than the library's aspect engine.
Consider exporting `CLASSICAL_ORB` / `moiety` / `MAJOR_ASPECTS` from
`astrology.ts` if those tasks need them.
