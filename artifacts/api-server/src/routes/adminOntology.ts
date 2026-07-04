import { Router, type IRouter } from "express";
import { eq, or, inArray, ilike } from "drizzle-orm";
import {
  db,
  ontologyEntitiesTable,
  ontologyThemesTable,
  ontologyEntityThemesTable,
  ontologyEntityProfilesTable,
  type OntologyEntity,
  type OntologyTheme,
  type OntologyEntityTheme,
  type OntologyEntityProfile,
} from "@workspace/db";
import { requireAuth, requireAdmin } from "../lib/auth";

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
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
  };
}

/* ─── Entities ─── */

router.get("/admin/ontology/entities", requireAuth, requireAdmin, async (req, res): Promise<void> => {
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

router.get("/admin/ontology/entities/:id", requireAuth, requireAdmin, async (req, res): Promise<void> => {
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
  res.json({ success: true });
});

/* ─── Entity Profile ─── */

router.get("/admin/ontology/entities/:id/profile", requireAuth, requireAdmin, async (req, res): Promise<void> => {
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
  res.json(serializeProfile(row));
});

/* ─── Themes ─── */

router.get("/admin/ontology/themes", requireAuth, requireAdmin, async (_req, res): Promise<void> => {
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
  res.json({ success: true });
});

/* ─── Entity-Theme Links ─── */

router.get("/admin/ontology/entities/:id/themes", requireAuth, requireAdmin, async (req, res): Promise<void> => {
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
        weight: typeof body.weight === "number" ? body.weight : 1.0,
        polarity: typeof body.polarity === "string" ? body.polarity : "neutral",
      })
      .returning();
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
  if (typeof body.weight === "number") updates.weight = body.weight;
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
  res.json({ success: true });
});

export default router;
