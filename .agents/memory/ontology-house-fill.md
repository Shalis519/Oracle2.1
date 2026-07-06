---
name: Ontology house profiles fill
description: DB quirks when filling ontology house profiles/themes via SQL (dev DB)
---

- `ontology_themes` is UNIQUE on **slug only** (not name); `ontology_entity_themes` has **no unique (entity_id, theme_id)** — `ON CONFLICT` fails there. Use `WHERE NOT EXISTS` for inserts + separate `UPDATE` for existing links.
- `ontology_entity_relations` IS unique on (from_entity_id, to_entity_id, relation_type); planet→house links use relation_type `association` (e.g. Сатурн/Нептун → Дом 12).
- All 12 house profiles + weighted theme links were filled from user-supplied Oracle Studio lists (July 2026); themes reused where близкие duplicates existed («Короткие поездки» → existing «Короткие путешествия»).
- **How to apply:** for future ontology data loads, follow the same NOT-EXISTS/UPDATE pattern and clear today's `daily_forecasts` so users see updated text immediately (semantic cache TTL 30s handles the engine side).
