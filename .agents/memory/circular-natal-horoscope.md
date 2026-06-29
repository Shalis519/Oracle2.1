---
name: circular-natal-horoscope-js quirks
description: Non-obvious runtime behavior of the circular-natal-horoscope-js ephemeris library used for western astrology
---

# circular-natal-horoscope-js

Pure-JS ephemeris chosen for natal charts (no native build, unlike `sweph`). Accuracy ~1-2 arcmin of Swiss Ephemeris. `Origin` derives the timezone from lat/lng internally (tz-lookup) and applies historical DST, so only lat/lng + local birth time are needed for a correct computation.

## `Origin.timezone` is an OBJECT, not a string
At runtime `origin.timezone` is an object, even though it's easy to type it as `string`. Never put it directly into an API response — it caused a Zod `meta.timezone expected string, received object` failure that 400'd the natal endpoint and showed users the "missing data" prompt.

**Why:** the value is internal timezone metadata, not an IANA id.

**How to apply:** for any IANA timezone string in the chart payload, pass through your own stored value (e.g. the user's `birthTimezone` saved from the city picker), not `origin.timezone`. The computation itself is still correct regardless.
