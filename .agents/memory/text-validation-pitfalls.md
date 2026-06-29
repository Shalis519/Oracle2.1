---
name: Text validation pitfalls (regex boundaries & length)
description: Non-obvious gotchas when validating/moderating user text — JS \b is ASCII-only, and maxLength counts UTF-16 units not code points.
---

# JS word boundary `\b` is ASCII-only

`\b` (and `\w`) only recognize `[A-Za-z0-9_]`. Against Cyrillic (or any non-ASCII)
text, `\bхер\b` NEVER matches, because there is no `\w`/non-`\w` transition around
Cyrillic letters — they read as all-non-word. Result: word-boundary profanity rules
silently fail on Russian.

**Fix:** use explicit letter-class lookarounds covering both alphabets, e.g.
`/(?<![a-zа-яё])хер(?![a-zа-яё])/i`. Node 24 supports lookbehind.

**Why:** discovered when "хер с ним" / "ты сука" passed moderation while "сукно"/
"теперь" must NOT false-positive — boundaries are required, but `\b` doesn't provide
them for Cyrillic.

# maxLength counts UTF-16 code units, not code points

OpenAPI/Zod `maxLength` (and JS `string.length`) count UTF-16 code units. Astral
chars (most emoji) are 2 units each, so a "4096 chars" rule expressed as
`max(4096)` rejects emoji-heavy messages well under 4096 actual characters.

**Fix:** when the product limit means code points, set the schema bound to a relaxed
UTF-16 ceiling (~2x, e.g. 8192) purely as an anti-abuse cap, and enforce the true
limit separately with `Array.from(text).length` (code-point count) in app logic.

**How to apply:** any "max N characters" requirement on user text that may contain
emoji — don't rely on the generated Zod `max()` as the authoritative check.
