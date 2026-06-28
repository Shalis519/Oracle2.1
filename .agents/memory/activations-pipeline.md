---
name: Activations data pipeline
description: How monthly Feng Shui "Активации" PDFs become the activations.ts data file, and the non-obvious pdftotext layout gotcha.
---

# Activations (Активации) ingestion

Flow: monthly PDF → `pdftotext -layout <pdf> attached_assets/<month>.txt` → `pnpm --filter @workspace/scripts run parse-activations` (`scripts/src/parse-activations.mjs`) → overwrites `artifacts/api-server/src/lib/data/activations.ts` (keyed by ISO date) → served by authed `GET /api/activations/today` (uses `todayString()`, UTC) → rendered on the dashboard.

Script takes optional args: `node parse-activations.mjs <input.txt> <MM> <YYYY> <monthGenitive>` (defaults: july.txt / 07 / 2026 / "Июля"). It currently overwrites with a single month — extend it to merge if you need multiple months in one file.

**Why / the gotcha:** `pdftotext -layout` renders the table's vertical date cell (the day number on one row, the month word e.g. "Июля" several rows lower) spread across *body* rows at **column 0**. Naively reading the left column makes the day number leak into the activation title and the month word leak mid-paragraph (e.g. "в натальных Июля комбинациях"). 

**How to apply:** the third (activation) column starts at fixed column index 23. The fix: on body (continuation) rows, ignore the left column entirely; only read the animal/day-number from the left column on the *first* row of an activation. Dates appear in two forms — standalone ("N" line followed by a month-word line) and inline (day number sharing the first activation row with the animal) — handle both; re-setting the same date is idempotent (entries merge). The script runs a validation pass (rejects titles starting with a digit, month-word in title/body, unknown hour animal) and exits non-zero on corruption — keep it.

Hour animal → Chinese double-hour time ranges live on the frontend (`HOUR_RANGES` in `dashboard.tsx`), not in the data.
