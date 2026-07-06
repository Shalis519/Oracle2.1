---
name: Ontology seed/load startup race
description: Why seedOntology() and loadOntology() must be sequential before app.listen(), and why Studio UI edits must be mirrored in seedOntology.ts.
---

## The race

`seedOntology()` and `loadOntology()` used to fire simultaneously:

```typescript
seedOntology(); // async, updates DB
loadOntology(); // async, reads DB into cache
```

`loadOntology()` could finish **before** `seedOntology()` wrote its updates, leaving the cache permanently stale (5 min TTL). Requests served from stale cache showed "no themes resolved for transit planet=Луна" despite data existing in the DB.

## Fix

1. Make them sequential and await before `app.listen()`:
```typescript
async function start() {
  await seedOntology();
  await loadOntology();
  // sanity check
  const moon = getEntity("Луна");
  if (!moon?.themes.length) process.exit(1);
  app.listen(port, ...);
}
```

2. Bumping `CURRENT_FORECAST_VERSION` invalidates persisted forecast snapshots.

## Studio UI vs seedOntology.ts

- Studio UI edits write to **dev** database.
- `seedOntology.ts` with `onConflictDoUpdate` overwrites production on deploy.
- **Rule**: if you edit via Studio, also copy the change into `seedOntology.ts` before deploy, or the deploy will revert it.

## Sanity check

Post-load validation catches regressions immediately instead of letting the server serve broken forecasts.