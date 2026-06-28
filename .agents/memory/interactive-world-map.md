---
name: Interactive world map (travel page)
description: Why the travel map uses the d3-geo stack and the non-obvious country-code gotchas
---

# Interactive world map

**Decision:** build the clickable world map from **d3-geo** + **topojson-client** + **world-atlas** + **i18n-iso-countries** (Russian names) instead of react-simple-maps.

**Why:** the web app runs React 19; react-simple-maps declares older React peer ranges and causes install/runtime peer conflicts. The d3-geo stack has no React peer dependency.

**How to apply / gotchas:**
- world-atlas topojson feature ids are ISO 3166-1 **numeric**; pad to 3 digits before converting to alpha-2.
- Persist travels by ISO **alpha-2**; map highlighting matches on that. Legacy rows stored as `"XX"` will never highlight (expected, not a bug).
- Mutual exclusivity of visited/wishlist is enforced only in the UI, not server-side — concurrent/legacy writes can hold ambiguous states.
