---
name: Studio UI as ontology source of truth
description: How relations & profiles became Studio-editable without deploy reverts; 30-sec cache with explicit invalidation.
---

## Decision

Studio UI is the single source of truth for relations & profiles.
seedOntology.ts only creates skeleton (entities + themes) and never overwrites manual edits.

## What changed

### seedOntology.ts
- `ontology_entity_relations`: `onConflictDoNothing` — Studio edits survive deploy
- `ontology_entity_profiles`: `onConflictDoNothing` — Studio edits survive deploy
- `ontology_entity_themes`: `onConflictDoUpdate` — mass updates still possible from code
- `ontology_entities` / `ontology_themes`: `onConflictDoUpdate` — base data synced

### semanticEngine.ts
- Removed permanent in-memory `ontologyCache` with 5-min TTL
- Added 30-second lazy cache rebuilt on first request after expiry
- `refreshOntology()` explicitly invalidates cache (called by Studio mutations)
- All functions async: `getEntity`, `getEntityThemes`, `findRelation`, etc.
- Single-flight guard prevents stampede rebuilds

### futuristicGenerator.ts / oracle.ts / index.ts
- All sync calls migrated to `await`
- `ensureOntologyLoaded()` removed (no-op)
- `loadOntology()` pre-warms cache at startup

## Operational notes
- Multi-instance: each instance has its own 30-sec cache. Acceptable eventual consistency.
- Cache rebuild reads all ontology tables in parallel (5 queries), then builds Map in memory.
- DB errors are thrown (not swallowed as `null`) so failures are visible in logs.

## Startup sequence (critical)
`index.ts` calls `seedOntology()` then `app.listen()`. **Do NOT call `loadOntology()` at startup** — it can hang in production (DB pool/SSL in containerized env). Cache is lazy-loaded on first request instead.

## How to invalidate cache manually
- POST `/admin/forecast/invalidate-cache` — bumps forecast version
- POST `/admin/ontology/reseed` — wipes & reseeds everything
- Any Studio mutation — calls `refreshOntology()` internally
