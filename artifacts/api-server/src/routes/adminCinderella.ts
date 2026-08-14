import { Router, type IRouter } from "express";
import { and, asc, eq } from "drizzle-orm";
import {
  db,
  cinderellaInterpretationsTable,
  type CinderellaInterpretation,
} from "@workspace/db";
import { requireAuth, requireAdmin } from "../lib/auth";

const router: IRouter = Router();

function serialize(row: CinderellaInterpretation) {
  return {
    ...row,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

router.get("/admin/cinderella-interpretations", requireAuth, async (req, res): Promise<void> => {
  const mode = typeof req.query.mode === "string" ? req.query.mode : undefined;
  const rows = await db
    .select()
    .from(cinderellaInterpretationsTable)
    .where(mode ? eq(cinderellaInterpretationsTable.mode, mode) : undefined)
    .orderBy(asc(cinderellaInterpretationsTable.mode), asc(cinderellaInterpretationsTable.pairKey));
  res.json({ interpretations: rows.map(serialize) });
});

router.post("/admin/cinderella-interpretations", requireAuth, requireAdmin, async (req, res): Promise<void> => {
  const body = req.body as Record<string, unknown>;
  if (typeof body.pairKey !== "string" || typeof body.mode !== "string" || typeof body.title !== "string") {
    res.status(400).json({ error: "Нужны pairKey, mode и title" });
    return;
  }
  const text = typeof body.text === "string" && body.text.trim() ? body.text : "В разработке";
  try {
    const [row] = await db.insert(cinderellaInterpretationsTable).values({
      pairKey: body.pairKey,
      mode: body.mode,
      aspectKey: typeof body.aspectKey === "string" ? body.aspectKey : "any",
      title: body.title,
      text,
      keywords: Array.isArray(body.keywords) ? body.keywords.filter((v): v is string => typeof v === "string") : [],
      sourceNote: typeof body.sourceNote === "string" ? body.sourceNote : null,
      isActive: body.isActive !== false,
    }).returning();
    res.status(201).json(serialize(row));
  } catch (error: any) {
    if (String(error?.message ?? "").includes("unique constraint")) {
      res.status(409).json({ error: "Такая интерпретация уже существует" });
      return;
    }
    throw error;
  }
});

router.put("/admin/cinderella-interpretations/:id", requireAuth, requireAdmin, async (req, res): Promise<void> => {
  const id = Number(req.params.id);
  if (!id) { res.status(400).json({ error: "Некорректный id" }); return; }
  const body = req.body as Record<string, unknown>;
  const updates: Partial<typeof cinderellaInterpretationsTable.$inferInsert> = { updatedAt: new Date() };
  for (const field of ["pairKey", "mode", "aspectKey", "title", "sourceNote"] as const) {
    if (typeof body[field] === "string") updates[field] = body[field];
  }
  if (typeof body.text === "string") updates.text = body.text.trim() || "В разработке";
  if (Array.isArray(body.keywords)) updates.keywords = body.keywords.filter((v): v is string => typeof v === "string");
  if (typeof body.isActive === "boolean") updates.isActive = body.isActive;
  const [row] = await db.update(cinderellaInterpretationsTable).set(updates).where(eq(cinderellaInterpretationsTable.id, id)).returning();
  if (!row) { res.status(404).json({ error: "Интерпретация не найдена" }); return; }
  res.json(serialize(row));
});

router.delete("/admin/cinderella-interpretations/:id", requireAuth, requireAdmin, async (req, res): Promise<void> => {
  const id = Number(req.params.id);
  if (!id) { res.status(400).json({ error: "Некорректный id" }); return; }
  const result = await db.delete(cinderellaInterpretationsTable).where(eq(cinderellaInterpretationsTable.id, id));
  if (result.rowCount === 0) { res.status(404).json({ error: "Интерпретация не найдена" }); return; }
  res.json({ success: true });
});

export default router;
