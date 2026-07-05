import { Router, type IRouter } from "express";
import { eq, or, inArray, ilike } from "drizzle-orm";
import {
  db,
  pool,
  ontologyEntitiesTable,
  ontologyThemesTable,
  ontologyEntityThemesTable,
  ontologyEntityProfilesTable,
  ontologyEntityRelationsTable,
  motivationPhrasesTable,
  type OntologyEntity,
  type OntologyTheme,
  type OntologyEntityTheme,
  type OntologyEntityProfile,
  type MotivationPhrase,
} from "@workspace/db";
import { parseWeight, clampWeight } from "@workspace/db/weights";
import { requireAuth, requireAdmin } from "../lib/auth";
import { seedOntology } from "../lib/seedOntology";
import { refreshOntology } from "../lib/semanticEngine";
import { logger } from "../lib/logger";

const router: IRouter = Router();

function serializeEntity(e: OntologyEntity) {
  return {
    id: e.id,
    name: e.name,
    code: e.code,
    system: e.system,
    type: e.type,
    symbol: e.symbol,
    createdAt: e.createdAt.toISOString(),
    updatedAt: e.updatedAt.toISOString(),
  };
}

function serializeTheme(t: OntologyTheme) {
  return {
    id: t.id,
    name: t.name,
    slug: t.slug,
    description: t.description,
    createdAt: t.createdAt.toISOString(),
    updatedAt: t.updatedAt.toISOString(),
  };
}

function serializeEntityTheme(et: OntologyEntityTheme) {
  return {
    id: et.id,
    entityId: et.entityId,
    themeId: et.themeId,
    weight: et.weight,
    polarity: et.polarity,
  };
}

function serializeProfile(p: OntologyEntityProfile) {
  return {
    id: p.id,
    entityId: p.entityId,
    keyMeanings: p.keyMeanings,
    psychologicalManifestations: p.psychologicalManifestations,
    emotions: p.emotions,
    strengths: p.strengths,
    weaknesses: p.weaknesses,
    recommendations: p.recommendations,
    warnings: p.warnings,
    lifeThemes: p.lifeThemes,
    keyMeaningsArr: p.keyMeaningsArr,
    positiveQualities: p.positiveQualities,
    shadowQualities: p.shadowQualities,
    positiveEmotions: p.positiveEmotions,
    negativeEmotions: p.negativeEmotions,
    strengthsArr: p.strengthsArr,
    weaknessesArr: p.weaknessesArr,
    archetypes: p.archetypes,
    professions: p.professions,
    objects: p.objects,
    colors: p.colors,
    numbers: p.numbers,
    days: p.days,
    animals: p.animals,
    places: p.places,
    materials: p.materials,
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
  };
}

/* ─── Entities ─── */

router.get("/admin/ontology/entities", requireAuth, async (req, res): Promise<void> => {
  const search = typeof req.query.search === "string" ? req.query.search : "";
  const rows = await db
    .select()
    .from(ontologyEntitiesTable)
    .where(
      search
        ? or(
            ilike(ontologyEntitiesTable.name, "%" + search + "%"),
            ilike(ontologyEntitiesTable.code, "%" + search + "%"),
          )
        : undefined,
    )
    .orderBy(ontologyEntitiesTable.name);
  res.json({ entities: rows.map(serializeEntity) });
});

router.get("/admin/ontology/entities/:id", requireAuth, async (req, res): Promise<void> => {
  const id = Number(req.params.id);
  if (!id) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const [entity] = await db
    .select()
    .from(ontologyEntitiesTable)
    .where(eq(ontologyEntitiesTable.id, id));
  if (!entity) {
    res.status(404).json({ error: "Entity not found" });
    return;
  }
  const [profile] = await db
    .select()
    .from(ontologyEntityProfilesTable)
    .where(eq(ontologyEntityProfilesTable.entityId, id));
  const links = await db
    .select()
    .from(ontologyEntityThemesTable)
    .where(eq(ontologyEntityThemesTable.entityId, id));
  const themeIds = links.map((l) => l.themeId);
  const themes = themeIds.length
    ? await db
        .select()
        .from(ontologyThemesTable)
        .where(inArray(ontologyThemesTable.id, themeIds))
    : [];
  const themeMap = new Map(themes.map((t: OntologyTheme) => [t.id, t]));
  res.json({
    entity: serializeEntity(entity),
    profile: profile ? serializeProfile(profile) : null,
    themes: links.map((l: OntologyEntityTheme) => ({
      ...serializeEntityTheme(l),
      theme: themeMap.get(l.themeId)
        ? serializeTheme(themeMap.get(l.themeId)!)
        : null,
    })),
  });
});

router.post("/admin/ontology/entities", requireAuth, requireAdmin, async (req, res): Promise<void> => {
  const body = req.body as Record<string, unknown>;
  if (
    typeof body.name !== "string" ||
    typeof body.code !== "string" ||
    typeof body.system !== "string" ||
    typeof body.type !== "string"
  ) {
    res.status(400).json({ error: "Missing required fields: name, code, system, type" });
    return;
  }
  try {
    const [row] = await db
      .insert(ontologyEntitiesTable)
      .values({
        name: body.name,
        code: body.code,
        system: body.system,
        type: body.type,
        symbol: typeof body.symbol === "string" ? body.symbol : null,
      })
      .returning();
    await refreshOntology().catch(() => {});
    res.status(201).json(serializeEntity(row));
  } catch (e: any) {
    if (e.message?.includes("unique constraint")) {
      res.status(409).json({ error: "Entity code already exists" });
      return;
    }
    throw e;
  }
});

router.put("/admin/ontology/entities/:id", requireAuth, requireAdmin, async (req, res): Promise<void> => {
  const id = Number(req.params.id);
  if (!id) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const body = req.body as Record<string, unknown>;
  const updates: Partial<typeof ontologyEntitiesTable.$inferInsert> = {};
  if (typeof body.name === "string") updates.name = body.name;
  if (typeof body.code === "string") updates.code = body.code;
  if (typeof body.system === "string") updates.system = body.system;
  if (typeof body.type === "string") updates.type = body.type;
  if (typeof body.symbol === "string") updates.symbol = body.symbol;

  const [row] = await db
    .update(ontologyEntitiesTable)
    .set({ ...updates, updatedAt: new Date() })
    .where(eq(ontologyEntitiesTable.id, id))
    .returning();
  if (!row) {
    res.status(404).json({ error: "Entity not found" });
    return;
  }
  await refreshOntology().catch(() => {});
  res.json(serializeEntity(row));
});

router.delete("/admin/ontology/entities/:id", requireAuth, requireAdmin, async (req, res): Promise<void> => {
  const id = Number(req.params.id);
  if (!id) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  await db
    .delete(ontologyEntityThemesTable)
    .where(eq(ontologyEntityThemesTable.entityId, id));
  await db
    .delete(ontologyEntityProfilesTable)
    .where(eq(ontologyEntityProfilesTable.entityId, id));
  const result = await db
    .delete(ontologyEntitiesTable)
    .where(eq(ontologyEntitiesTable.id, id));
  if (result.rowCount === 0) {
    res.status(404).json({ error: "Entity not found" });
    return;
  }
  await refreshOntology().catch(() => {});
  res.json({ success: true });
});

/* ─── Entity Profile ─── */

router.get("/admin/ontology/entities/:id/profile", requireAuth, async (req, res): Promise<void> => {
  const id = Number(req.params.id);
  if (!id) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const [profile] = await db
    .select()
    .from(ontologyEntityProfilesTable)
    .where(eq(ontologyEntityProfilesTable.entityId, id));
  res.json(profile ? serializeProfile(profile) : null);
});

router.put("/admin/ontology/entities/:id/profile", requireAuth, requireAdmin, async (req, res): Promise<void> => {
  const id = Number(req.params.id);
  if (!id) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const body = req.body as Record<string, unknown>;
  const updates: Partial<
    Omit<
      typeof ontologyEntityProfilesTable.$inferInsert,
      "entityId" | "createdAt" | "updatedAt"
    >
  > = {};
  const textFields = [
    "keyMeanings",
    "psychologicalManifestations",
    "emotions",
    "strengths",
    "weaknesses",
    "recommendations",
    "warnings",
  ] as const;
  for (const f of textFields) {
    if (typeof body[f] === "string") updates[f] = body[f];
    if (body[f] === null) updates[f] = null;
  }
  const arrFields = [
    "lifeThemes",
    "keyMeaningsArr",
    "positiveQualities",
    "shadowQualities",
    "positiveEmotions",
    "negativeEmotions",
    "strengthsArr",
    "weaknessesArr",
    "archetypes",
  ] as const;
  for (const f of arrFields) {
    if (Array.isArray(body[f])) {
      const arr = (body[f] as unknown[]).filter((x) => typeof x === "string") as string[];
      updates[f] = arr;
    }
  }

  const [existing] = await db
    .select()
    .from(ontologyEntityProfilesTable)
    .where(eq(ontologyEntityProfilesTable.entityId, id));

  let row: OntologyEntityProfile;
  if (existing) {
    [row] = await db
      .update(ontologyEntityProfilesTable)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(ontologyEntityProfilesTable.entityId, id))
      .returning();
  } else {
    const insertVals = {
      entityId: id,
      ...updates,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    [row] = await db
      .insert(ontologyEntityProfilesTable)
      .values(insertVals)
      .returning();
  }
  await refreshOntology().catch(() => {});
  res.json(serializeProfile(row));
});

/* ─── Themes ─── */

router.get("/admin/ontology/themes", requireAuth, async (_req, res): Promise<void> => {
  const rows = await db
    .select()
    .from(ontologyThemesTable)
    .orderBy(ontologyThemesTable.name);
  res.json({ themes: rows.map(serializeTheme) });
});

router.post("/admin/ontology/themes", requireAuth, requireAdmin, async (req, res): Promise<void> => {
  const body = req.body as Record<string, unknown>;
  if (typeof body.name !== "string" || typeof body.slug !== "string") {
    res.status(400).json({ error: "Missing required fields: name, slug" });
    return;
  }
  try {
    const [row] = await db
      .insert(ontologyThemesTable)
      .values({
        name: body.name,
        slug: body.slug,
        description: typeof body.description === "string" ? body.description : null,
      })
      .returning();
      await refreshOntology().catch(() => {});
    res.status(201).json(serializeTheme(row));
  } catch (e: any) {
    if (e.message?.includes("unique constraint")) {
      res.status(409).json({ error: "Theme slug already exists" });
      return;
    }
    throw e;
  }
});

router.put("/admin/ontology/themes/:id", requireAuth, requireAdmin, async (req, res): Promise<void> => {
  const id = Number(req.params.id);
  if (!id) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const body = req.body as Record<string, unknown>;
  const updates: Partial<typeof ontologyThemesTable.$inferInsert> = {};
  if (typeof body.name === "string") updates.name = body.name;
  if (typeof body.slug === "string") updates.slug = body.slug;
  if (typeof body.description === "string") updates.description = body.description;
  if (body.description === null) updates.description = null;

  const [row] = await db
    .update(ontologyThemesTable)
    .set({ ...updates, updatedAt: new Date() })
    .where(eq(ontologyThemesTable.id, id))
    .returning();
  if (!row) {
    res.status(404).json({ error: "Theme not found" });
    return;
  }
  await refreshOntology().catch(() => {});
  res.json(serializeTheme(row));
});

router.delete("/admin/ontology/themes/:id", requireAuth, requireAdmin, async (req, res): Promise<void> => {
  const id = Number(req.params.id);
  if (!id) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  await db
    .delete(ontologyEntityThemesTable)
    .where(eq(ontologyEntityThemesTable.themeId, id));
  const result = await db
    .delete(ontologyThemesTable)
    .where(eq(ontologyThemesTable.id, id));
  if (result.rowCount === 0) {
    res.status(404).json({ error: "Theme not found" });
    return;
  }
  await refreshOntology().catch(() => {});
  res.json({ success: true });
});

/* ─── Entity-Theme Links ─── */

router.get("/admin/ontology/entities/:id/themes", requireAuth, async (req, res): Promise<void> => {
  const id = Number(req.params.id);
  if (!id) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const links = await db
    .select()
    .from(ontologyEntityThemesTable)
    .where(eq(ontologyEntityThemesTable.entityId, id));
  const themeIds = links.map((l) => l.themeId);
  const themes = themeIds.length
    ? await db
        .select()
        .from(ontologyThemesTable)
        .where(inArray(ontologyThemesTable.id, themeIds))
    : [];
  const themeMap = new Map(themes.map((t: OntologyTheme) => [t.id, t]));
  res.json({
    links: links.map((l: OntologyEntityTheme) => ({
      ...serializeEntityTheme(l),
      theme: themeMap.get(l.themeId)
        ? serializeTheme(themeMap.get(l.themeId)!)
        : null,
    })),
  });
});

router.post("/admin/ontology/entity-themes", requireAuth, requireAdmin, async (req, res): Promise<void> => {
  const body = req.body as Record<string, unknown>;
  if (
    typeof body.entityId !== "number" ||
    typeof body.themeId !== "number"
  ) {
    res.status(400).json({ error: "Missing entityId or themeId" });
    return;
  }
  try {
    const [row] = await db
      .insert(ontologyEntityThemesTable)
      .values({
        entityId: body.entityId,
        themeId: body.themeId,
        weight: clampWeight(parseWeight(body.weight)),
        polarity: typeof body.polarity === "string" ? body.polarity : "neutral",
      })
      .returning();
    await refreshOntology().catch(() => {});
    res.status(201).json(serializeEntityTheme(row));
  } catch (e: any) {
    if (e.message?.includes("unique constraint")) {
      res.status(409).json({ error: "This entity-theme link already exists" });
      return;
    }
    throw e;
  }
});

router.patch("/admin/ontology/entity-themes/:id", requireAuth, requireAdmin, async (req, res): Promise<void> => {
  const id = Number(req.params.id);
  if (!id) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const body = req.body as Record<string, unknown>;
  const updates: Partial<typeof ontologyEntityThemesTable.$inferInsert> = {};
  const pw = clampWeight(parseWeight(body.weight));
  if (Number.isFinite(pw)) updates.weight = pw;
  if (typeof body.polarity === "string") updates.polarity = body.polarity;

  const [row] = await db
    .update(ontologyEntityThemesTable)
    .set(updates)
    .where(eq(ontologyEntityThemesTable.id, id))
    .returning();
  if (!row) {
    res.status(404).json({ error: "Link not found" });
    return;
  }
  await refreshOntology().catch(() => {});
  res.json(serializeEntityTheme(row));
});

router.delete("/admin/ontology/entity-themes/:id", requireAuth, requireAdmin, async (req, res): Promise<void> => {
  const id = Number(req.params.id);
  if (!id) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const result = await db
    .delete(ontologyEntityThemesTable)
    .where(eq(ontologyEntityThemesTable.id, id));
  if (result.rowCount === 0) {
    res.status(404).json({ error: "Link not found" });
    return;
  }
  await refreshOntology().catch(() => {});
  res.json({ success: true });
});

/* ─── Entity Relations ─── */

router.get("/admin/ontology/entities/:id/relations", requireAuth, async (req, res): Promise<void> => {
  const id = Number(req.params.id);
  if (!id) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const [entity] = await db
    .select()
    .from(ontologyEntitiesTable)
    .where(eq(ontologyEntitiesTable.id, id));
  if (!entity) {
    res.status(404).json({ error: "Entity not found" });
    return;
  }
  const fromRels = await db
    .select()
    .from(ontologyEntityRelationsTable)
    .where(eq(ontologyEntityRelationsTable.fromEntityId, id));
  const toRels = await db
    .select()
    .from(ontologyEntityRelationsTable)
    .where(eq(ontologyEntityRelationsTable.toEntityId, id));
  const allIds = [...fromRels.map((r) => r.toEntityId), ...toRels.map((r) => r.fromEntityId)];
  const related = allIds.length
    ? await db
        .select()
        .from(ontologyEntitiesTable)
        .where(inArray(ontologyEntitiesTable.id, [...new Set(allIds)]))
    : [];
  const entityMap = new Map(related.map((e: OntologyEntity) => [e.id, e]));
  res.json({
    from: fromRels.map((r) => ({
      id: r.id,
      relationType: r.relationType,
      description: r.description,
      weight: r.weight,
      toEntity: entityMap.get(r.toEntityId) ? serializeEntity(entityMap.get(r.toEntityId)!) : null,
    })),
    to: toRels.map((r) => ({
      id: r.id,
      relationType: r.relationType,
      description: r.description,
      weight: r.weight,
      fromEntity: entityMap.get(r.fromEntityId) ? serializeEntity(entityMap.get(r.fromEntityId)!) : null,
    })),
  });
});

router.post("/admin/ontology/entity-relations", requireAuth, requireAdmin, async (req, res): Promise<void> => {
  const body = req.body as Record<string, unknown>;
  if (
    typeof body.fromEntityId !== "number" ||
    typeof body.toEntityId !== "number" ||
    typeof body.relationType !== "string"
  ) {
    res.status(400).json({ error: "Missing fromEntityId, toEntityId, or relationType" });
    return;
  }
  try {
    const values = {
      fromEntityId: body.fromEntityId,
      toEntityId: body.toEntityId,
      relationType: body.relationType,
      description: typeof body.description === "string" ? body.description : null,
      weight: clampWeight(parseWeight(body.weight)),
      futuristic: typeof body.futuristic === "object" && body.futuristic !== null ? (body.futuristic as Record<string, unknown>) : undefined,
      keywords: Array.isArray(body.keywords) ? body.keywords as string[] : undefined,
    } as any;
    const [row] = await db
      .insert(ontologyEntityRelationsTable)
      .values(values)
      .returning();
    await refreshOntology().catch(() => {});
    res.status(201).json(row);
  } catch (e: any) {
    if (e.message?.includes("unique constraint")) {
      res.status(409).json({ error: "This relation already exists" });
      return;
    }
    if (e.message?.includes("foreign key constraint")) {
      res.status(400).json({ error: "Invalid entity reference" });
      return;
    }
    throw e;
  }
});

router.patch("/admin/ontology/entity-relations/:id", requireAuth, requireAdmin, async (req, res): Promise<void> => {
  const id = Number(req.params.id);
  if (!id) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const body = req.body as Record<string, unknown>;
  const updates: Record<string, unknown> = {};
  if (typeof body.relationType === "string") updates.relationType = body.relationType;
  if (typeof body.description === "string") updates.description = body.description;
  if (body.description === null) updates.description = null;
  const pw = clampWeight(parseWeight(body.weight));
  if (Number.isFinite(pw)) updates.weight = pw;
  if (typeof body.futuristic === "object" && body.futuristic !== null) updates.futuristic = body.futuristic as Record<string, unknown>;
  if (body.futuristic === null) updates.futuristic = null;
  if (Array.isArray(body.keywords)) updates.keywords = body.keywords as string[];
  if (body.keywords === null) updates.keywords = null;

  const [row] = await db
    .update(ontologyEntityRelationsTable)
    .set({ ...updates, updatedAt: new Date() } as any)
    .where(eq(ontologyEntityRelationsTable.id, id))
    .returning();
  if (!row) {
    res.status(404).json({ error: "Relation not found" });
    return;
  }
  await refreshOntology().catch(() => {});
  res.json(row);
});

router.delete("/admin/ontology/entity-relations/:id", requireAuth, requireAdmin, async (req, res): Promise<void> => {
  const id = Number(req.params.id);
  if (!id) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const result = await db
    .delete(ontologyEntityRelationsTable)
    .where(eq(ontologyEntityRelationsTable.id, id));
  if (result.rowCount === 0) {
    res.status(404).json({ error: "Relation not found" });
    return;
  }
  await refreshOntology().catch(() => {});
  res.json({ success: true });
});

/* ─── Reseed ─── */

router.post("/admin/ontology/reseed", requireAuth, requireAdmin, async (_req, res): Promise<void> => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query("SELECT pg_advisory_lock(424242)");

    await client.query("DELETE FROM ontology_entity_relations");
    await client.query("DELETE FROM ontology_entity_themes");
    await client.query("DELETE FROM ontology_entity_profiles");
    await client.query("DELETE FROM ontology_entities");
    await client.query("DELETE FROM ontology_themes");

    // NOTE: seedOntology() uses the shared db instance, which may be separate from
    // our transaction. We commit the wipe first, then seed (simpler than rewriting seedOntology).
    await client.query("COMMIT");
    await client.query("SELECT pg_advisory_unlock(424242)");

    await seedOntology();
    await refreshOntology().catch(() => {});

    res.json({ success: true, message: "Ontology reseeded" });
    return;
  } catch (err: unknown) {
    await client.query("ROLLBACK").catch(() => {});
    await client.query("SELECT pg_advisory_unlock(424242)").catch(() => {});
    logger.error(err, "Reseed failed");
    res.status(500).json({ error: "Reseed failed" });
    return;
  } finally {
    client.release();
  }
});

/* ==========================
   Motivation Phrases
   ========================== */

function serializeMotivationPhrase(p: MotivationPhrase) {
  return {
    id: p.id,
    phrase: p.phrase,
    isActive: p.isActive,
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
  };
}

router.get("/admin/motivation-phrases", requireAuth, requireAdmin, async (req, res): Promise<void> => {
  const rows = await db.select().from(motivationPhrasesTable).orderBy(motivationPhrasesTable.createdAt);
  res.json(rows.map(serializeMotivationPhrase));
});

router.post("/admin/motivation-phrases", requireAuth, requireAdmin, async (req, res): Promise<void> => {
  const body = req.body as Record<string, unknown>;
  const phrase = typeof body.phrase === "string" ? body.phrase.trim() : "";
  if (!phrase || phrase.length < 3) {
    res.status(400).json({ error: "Phrase must be at least 3 characters" });
    return;
  }
  const [created] = await db.insert(motivationPhrasesTable).values({ phrase }).returning();
  res.status(201).json(serializeMotivationPhrase(created));
});

router.delete("/admin/motivation-phrases/:id", requireAuth, requireAdmin, async (req, res): Promise<void> => {
  const id = req.params.id;
  if (!id || typeof id !== "string") {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  await db.delete(motivationPhrasesTable).where(eq(motivationPhrasesTable.id, id));
  res.json({ success: true });
});

router.patch("/admin/motivation-phrases/:id/toggle", requireAuth, requireAdmin, async (req, res): Promise<void> => {
  const id = req.params.id;
  if (!id || typeof id !== "string") {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const [row] = await db.select().from(motivationPhrasesTable).where(eq(motivationPhrasesTable.id, id)).limit(1);
  if (!row) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  const [updated] = await db
    .update(motivationPhrasesTable)
    .set({ isActive: !row.isActive, updatedAt: new Date() })
    .where(eq(motivationPhrasesTable.id, id))
    .returning();
  res.json(serializeMotivationPhrase(updated));
});

export default router;
