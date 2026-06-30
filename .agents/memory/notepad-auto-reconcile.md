---
name: Daily auto-reminder reconciliation
description: How per-day auto-generated reminder rows (notepad) stay idempotent under concurrent GETs
---

The daily "Блокнот дня" (notepad) mixes user-created rows with auto-generated reminder rows derived from other sections (Bazi activations today, contact birthdays today). Auto rows are reconciled on every `GET /notepad/today`: desired set is computed, missing rows inserted, changed text updated, stale auto rows deleted — done-state is preserved across reconciliations.

**Rule:** auto rows must have a partial unique index over `(user_id, date, source, ref_key) WHERE source <> 'manual'`, and the reconcile insert must use `.onConflictDoNothing()`.

**Why:** reconcile does read-then-insert. Concurrent GETs (multiple tabs, React strict-mode double effects) would otherwise create duplicate auto rows and fragment the done checkbox state. The partial index excludes manual rows so users can still add unlimited free notes (ref_key null).

**How to apply:** any feature that regenerates derived rows on read (not write) should use this pattern. Also guard the PATCH: allow `done` on any row but restrict `text` edits to `source = 'manual'` server-side, since auto text is overwritten by the next reconcile anyway.
