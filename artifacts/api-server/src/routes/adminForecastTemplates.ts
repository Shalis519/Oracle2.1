import { Router, type IRouter } from "express";
import { asc, eq } from "drizzle-orm";
import { db, forecastTextTemplatesTable, type ForecastTextTemplate } from "@workspace/db";
import { requireAdmin, requireAuth } from "../lib/auth";

const router: IRouter = Router();

function serialize(row: ForecastTextTemplate) {
  return {
    ...row,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

router.get("/admin/forecast-text-templates", requireAuth, async (_req, res): Promise<void> => {
  const rows = await db
    .select()
    .from(forecastTextTemplatesTable)
    .orderBy(asc(forecastTextTemplatesTable.category), asc(forecastTextTemplatesTable.context), asc(forecastTextTemplatesTable.key));
  res.json({ templates: rows.map(serialize) });
});

router.post("/admin/forecast-text-templates", requireAuth, requireAdmin, async (req, res): Promise<void> => {
  const body = req.body as Record<string, unknown>;
  if (typeof body.category !== "string" || typeof body.context !== "string" || typeof body.key !== "string" || typeof body.title !== "string") {
    res.status(400).json({ error: "Нужны category, context, key и title" });
    return;
  }
  try {
    const [row] = await db.insert(forecastTextTemplatesTable).values({
      category: body.category.trim(),
      context: body.context.trim(),
      key: body.key.trim(),
      title: body.title.trim(),
      text: typeof body.text === "string" && body.text.trim() ? body.text.trim() : "В разработке",
      sourceNote: typeof body.sourceNote === "string" ? body.sourceNote.trim() || null : null,
      isActive: body.isActive !== false,
    }).returning();
    res.status(201).json(serialize(row));
  } catch (error: any) {
    if (String(error?.message ?? "").includes("unique constraint")) {
      res.status(409).json({ error: "Такой шаблон уже существует" });
      return;
    }
    throw error;
  }
});

router.put("/admin/forecast-text-templates/:id", requireAuth, requireAdmin, async (req, res): Promise<void> => {
  const id = Number(req.params.id);
  if (!id) {
    res.status(400).json({ error: "Некорректный id" });
    return;
  }
  const body = req.body as Record<string, unknown>;
  const updates: Partial<typeof forecastTextTemplatesTable.$inferInsert> = { updatedAt: new Date() };
  if (typeof body.category === "string") updates.category = body.category.trim();
  if (typeof body.context === "string") updates.context = body.context.trim();
  if (typeof body.key === "string") updates.key = body.key.trim();
  if (typeof body.title === "string") updates.title = body.title.trim();
  if (typeof body.text === "string") updates.text = body.text.trim() || "В разработке";
  if (typeof body.sourceNote === "string") updates.sourceNote = body.sourceNote.trim() || null;
  if (typeof body.isActive === "boolean") updates.isActive = body.isActive;

  const [row] = await db.update(forecastTextTemplatesTable).set(updates).where(eq(forecastTextTemplatesTable.id, id)).returning();
  if (!row) {
    res.status(404).json({ error: "Шаблон не найден" });
    return;
  }
  res.json(serialize(row));
});

router.delete("/admin/forecast-text-templates/:id", requireAuth, requireAdmin, async (req, res): Promise<void> => {
  const id = Number(req.params.id);
  if (!id) {
    res.status(400).json({ error: "Некорректный id" });
    return;
  }
  const result = await db.delete(forecastTextTemplatesTable).where(eq(forecastTextTemplatesTable.id, id));
  if (result.rowCount === 0) {
    res.status(404).json({ error: "Шаблон не найден" });
    return;
  }
  res.json({ success: true });
});

export default router;
