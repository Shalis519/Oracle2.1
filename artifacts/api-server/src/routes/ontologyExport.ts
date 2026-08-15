import { Router, type IRouter } from "express";
import {
  db,
  pool,
  ontologyEntitiesTable,
  ontologyThemesTable,
  ontologyEntityThemesTable,
  ontologyEntityProfilesTable,
  ontologyEntityRelationsTable,
  motivationPhrasesTable,
  cinderellaInterpretationsTable,
  lunarInterpretationsTable,
  ontologyExportSchema,
  ontologyImportSchema,
  type OntologyExport,
} from "@workspace/db";
import { requireAuth, requireAdmin } from "../lib/auth";
import { refreshOntology } from "../lib/semanticEngine";
import { logger } from "../lib/logger";

const router: IRouter = Router();

/* ─── Export ─── */

router.get("/admin/ontology/export", requireAuth, requireAdmin, async (_req, res): Promise<void> => {
  try {
    const [entities, themes, entityThemes, profiles, relations, phrases, cinderellaInterpretations, lunarInterpretations] = await Promise.all([
      db.select().from(ontologyEntitiesTable),
      db.select().from(ontologyThemesTable),
      db.select().from(ontologyEntityThemesTable),
      db.select().from(ontologyEntityProfilesTable),
      db.select().from(ontologyEntityRelationsTable),
      db.select().from(motivationPhrasesTable),
      db.select().from(cinderellaInterpretationsTable),
      db.select().from(lunarInterpretationsTable),
    ]);

    const entityMap = new Map(entities.map((e) => [e.id, e]));
    const themeMap = new Map(themes.map((t) => [t.id, t]));

    const exportData: OntologyExport = {
      version: "2.1",
      exportedAt: new Date().toISOString(),
      entities: entities.map((e) => ({
        name: e.name,
        code: e.code,
        system: e.system,
        type: e.type,
        symbol: e.symbol,
      })),
      themes: themes.map((t) => ({
        name: t.name,
        slug: t.slug,
        description: t.description,
      })),
      entityThemes: entityThemes.map((et) => ({
        entityCode: entityMap.get(et.entityId)?.code ?? "",
        themeSlug: themeMap.get(et.themeId)?.slug ?? "",
        weight: et.weight,
        polarity: et.polarity as "positive" | "negative" | "neutral",
      })).filter((x) => x.entityCode && x.themeSlug),
      profiles: profiles.map((p) => ({
        entityCode: entityMap.get(p.entityId)?.code ?? "",
        keyMeanings: p.keyMeanings,
        psychologicalManifestations: p.psychologicalManifestations,
        emotions: p.emotions,
        strengths: p.strengths,
        weaknesses: p.weaknesses,
        recommendations: p.recommendations,
        warnings: p.warnings,
        lifeThemes: (p.lifeThemes as string[]) ?? [],
        keyMeaningsArr: (p.keyMeaningsArr as string[]) ?? [],
        positiveQualities: (p.positiveQualities as string[]) ?? [],
        shadowQualities: (p.shadowQualities as string[]) ?? [],
        positiveEmotions: (p.positiveEmotions as string[]) ?? [],
        negativeEmotions: (p.negativeEmotions as string[]) ?? [],
        strengthsArr: (p.strengthsArr as string[]) ?? [],
        weaknessesArr: (p.weaknessesArr as string[]) ?? [],
        archetypes: (p.archetypes as string[]) ?? [],
        professions: (p.professions as string[]) ?? [],
        objects: (p.objects as string[]) ?? [],
        colors: (p.colors as string[]) ?? [],
        numbers: (p.numbers as string[]) ?? [],
        days: (p.days as string[]) ?? [],
        animals: (p.animals as string[]) ?? [],
        places: (p.places as string[]) ?? [],
        materials: (p.materials as string[]) ?? [],
      })).filter((x) => x.entityCode),
      relations: relations.map((r) => ({
        fromCode: entityMap.get(r.fromEntityId)?.code ?? "",
        toCode: entityMap.get(r.toEntityId)?.code ?? "",
        relationType: r.relationType,
        description: r.description,
        weight: r.weight,
        futuristic: r.futuristic,
        keywords: r.keywords,
      })).filter((x) => x.fromCode && x.toCode),
      motivationPhrases: phrases.map((p) => ({
        phrase: p.phrase,
        isActive: p.isActive,
      })),
      cinderellaInterpretations: cinderellaInterpretations.map((item) => ({
        pairKey: item.pairKey,
        mode: item.mode as "natal" | "transit" | "synastry",
        aspectKey: item.aspectKey,
        title: item.title,
        text: item.text,
        keywords: item.keywords,
        sourceNote: item.sourceNote,
        isActive: item.isActive,
      })),
      lunarInterpretations: lunarInterpretations.map((item) => ({
        category: item.category as "house" | "sign",
        key: item.key,
        title: item.title,
        text: item.text,
        sourceNote: item.sourceNote,
        isActive: item.isActive,
      })),
    };

    res.json({ success: true, data: exportData });
  } catch (err) {
    logger.error(err, "Export failed");
    res.status(500).json({ error: "Export failed" });
  }
});

/* ─── Helpers for raw SQL inside transaction ─── */

async function loadEntityMap(client: any) {
  const { rows } = await client.query(
    "SELECT id, code FROM ontology_entities",
  );
  return new Map(rows.map((r: any) => [r.code, r.id]));
}

async function loadThemeMap(client: any) {
  const { rows } = await client.query(
    "SELECT id, slug FROM ontology_themes",
  );
  return new Map(rows.map((r: any) => [r.slug, r.id]));
}

/* ─── Import ─── */

router.post("/admin/ontology/import", requireAuth, requireAdmin, async (req, res): Promise<void> => {
  const parsed = ontologyImportSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid import format", details: parsed.error.flatten() });
    return;
  }

  const { mode, data } = parsed.data;

  // Pre-validate natural-key references (fail fast before touching DB)
  const entityCodes = new Set(data.entities.map((e) => e.code));
  const themeSlugs = new Set(data.themes.map((t) => t.slug));
  const missing: string[] = [];

  for (const et of data.entityThemes) {
    if (!entityCodes.has(et.entityCode)) missing.push(`entityThemes: unknown entityCode "${et.entityCode}"`);
    if (!themeSlugs.has(et.themeSlug)) missing.push(`entityThemes: unknown themeSlug "${et.themeSlug}"`);
  }
  for (const p of data.profiles) {
    if (!entityCodes.has(p.entityCode)) missing.push(`profiles: unknown entityCode "${p.entityCode}"`);
  }
  for (const r of data.relations) {
    if (!entityCodes.has(r.fromCode)) missing.push(`relations: unknown fromCode "${r.fromCode}"`);
    if (!entityCodes.has(r.toCode)) missing.push(`relations: unknown toCode "${r.toCode}"`);
  }

  if (missing.length > 0) {
    res.status(400).json({ error: "Import references missing keys", details: missing.slice(0, 20) });
    return;
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    if (mode === "replace") {
      // Wipe all ontology tables
      await client.query("DELETE FROM motivation_phrases");
      await client.query("DELETE FROM cinderella_interpretations");
      await client.query("DELETE FROM lunar_interpretations");
      await client.query("DELETE FROM ontology_entity_relations");
      await client.query("DELETE FROM ontology_entity_themes");
      await client.query("DELETE FROM ontology_entity_profiles");
      await client.query("DELETE FROM ontology_entities");
      await client.query("DELETE FROM ontology_themes");
    }

    // Upsert entities by code
    for (const e of data.entities) {
      await client.query(
        `INSERT INTO ontology_entities (name, code, system, type, symbol, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
         ON CONFLICT (code) DO UPDATE SET name=$1, system=$3, type=$4, symbol=$5, updated_at=NOW()`,
        [e.name, e.code, e.system, e.type, e.symbol ?? null],
      );
    }

    // Upsert themes by slug
    for (const t of data.themes) {
      await client.query(
        `INSERT INTO ontology_themes (name, slug, description, created_at, updated_at)
         VALUES ($1, $2, $3, NOW(), NOW())
         ON CONFLICT (slug) DO UPDATE SET name=$1, description=$3, updated_at=NOW()`,
        [t.name, t.slug, t.description ?? null],
      );
    }

    // Rebuild maps from the same transaction
    const entityMap = await loadEntityMap(client);
    const themeMap = await loadThemeMap(client);

    // Upsert entity-theme links
    for (const et of data.entityThemes) {
      const eid = entityMap.get(et.entityCode);
      const tid = themeMap.get(et.themeSlug);
      if (!eid || !tid) continue;
      await client.query(
        `INSERT INTO ontology_entity_themes (entity_id, theme_id, weight, polarity)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (entity_id, theme_id) DO UPDATE SET weight=$3, polarity=$4`,
        [eid, tid, et.weight, et.polarity],
      );
    }

    // Upsert profiles
    for (const p of data.profiles) {
      const eid = entityMap.get(p.entityCode);
      if (!eid) continue;
      await client.query(
        `INSERT INTO ontology_entity_profiles (
           entity_id, key_meanings, psychological_manifestations, emotions, strengths, weaknesses,
           recommendations, warnings, life_themes, key_meanings_arr, positive_qualities, shadow_qualities,
           positive_emotions, negative_emotions, strengths_arr, weaknesses_arr, archetypes, professions,
           objects, colors, numbers, days, animals, places, materials, created_at, updated_at
         ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,NOW(),NOW())
         ON CONFLICT (entity_id) DO UPDATE SET
           key_meanings=$2, psychological_manifestations=$3, emotions=$4, strengths=$5, weaknesses=$6,
           recommendations=$7, warnings=$8, life_themes=$9, key_meanings_arr=$10, positive_qualities=$11,
           shadow_qualities=$12, positive_emotions=$13, negative_emotions=$14, strengths_arr=$15,
           weaknesses_arr=$16, archetypes=$17, professions=$18, objects=$19, colors=$20, numbers=$21,
           days=$22, animals=$23, places=$24, materials=$25, updated_at=NOW()`,
        [
          eid, p.keyMeanings ?? null, p.psychologicalManifestations ?? null, p.emotions ?? null,
          p.strengths ?? null, p.weaknesses ?? null, p.recommendations ?? null, p.warnings ?? null,
          JSON.stringify(p.lifeThemes), JSON.stringify(p.keyMeaningsArr), JSON.stringify(p.positiveQualities),
          JSON.stringify(p.shadowQualities), JSON.stringify(p.positiveEmotions), JSON.stringify(p.negativeEmotions),
          JSON.stringify(p.strengthsArr), JSON.stringify(p.weaknessesArr), JSON.stringify(p.archetypes),
          JSON.stringify(p.professions), JSON.stringify(p.objects), JSON.stringify(p.colors),
          JSON.stringify(p.numbers), JSON.stringify(p.days), JSON.stringify(p.animals),
          JSON.stringify(p.places), JSON.stringify(p.materials),
        ],
      );
    }

    // Upsert relations
    for (const r of data.relations) {
      const fromId = entityMap.get(r.fromCode);
      const toId = entityMap.get(r.toCode);
      if (!fromId || !toId) continue;
      await client.query(
        `INSERT INTO ontology_entity_relations (from_entity_id, to_entity_id, relation_type, description, weight, futuristic, keywords, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
         ON CONFLICT (from_entity_id, to_entity_id, relation_type) DO UPDATE SET
           description=$4, weight=$5, futuristic=$6, keywords=$7, updated_at=NOW()`,
        [
          fromId, toId, r.relationType, r.description ?? null, r.weight,
          r.futuristic ? JSON.stringify(r.futuristic) : null,
          r.keywords ?? null,
        ],
      );
    }

    // Upsert Cinderella interpretations
    for (const ci of data.cinderellaInterpretations ?? []) {
      await client.query(
        `INSERT INTO cinderella_interpretations (pair_key, mode, aspect_key, title, text, keywords, source_note, is_active, created_at, updated_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,NOW(),NOW())
         ON CONFLICT (pair_key, mode, aspect_key) DO UPDATE SET title=$4, text=$5, keywords=$6, source_note=$7, is_active=$8, updated_at=NOW()`,
        [ci.pairKey, ci.mode, ci.aspectKey, ci.title, ci.text || "В разработке", ci.keywords ?? [], ci.sourceNote ?? null, ci.isActive],
      );
    }

    // Upsert lunar interpretations
    for (const li of data.lunarInterpretations ?? []) {
      await client.query(
        `INSERT INTO lunar_interpretations (category, key, title, text, source_note, is_active, created_at, updated_at)
         VALUES ($1,$2,$3,$4,$5,$6,NOW(),NOW())
         ON CONFLICT (category, key) DO UPDATE SET title=$3, text=$4, source_note=$5, is_active=$6, updated_at=NOW()`,
        [li.category, li.key, li.title, li.text || "В разработке", li.sourceNote ?? null, li.isActive],
      );
    }

    // Upsert motivation phrases
    for (const mp of data.motivationPhrases) {
      await client.query(
        `INSERT INTO motivation_phrases (phrase, is_active, created_at, updated_at)
         VALUES ($1, $2, NOW(), NOW())
         ON CONFLICT (phrase) DO UPDATE SET is_active=$2, updated_at=NOW()`,
        [mp.phrase, mp.isActive],
      );
    }

    await client.query("COMMIT");
    await refreshOntology().catch(() => {});
    res.json({ success: true, message: `Import completed (${mode} mode)` });
  } catch (err) {
    await client.query("ROLLBACK").catch(() => {});
    logger.error(err, "Import failed");
    res.status(500).json({ error: "Import failed" });
  } finally {
    client.release();
  }
});

export default router;
