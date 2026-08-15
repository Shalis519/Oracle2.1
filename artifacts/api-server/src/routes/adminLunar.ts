import { Router, type IRouter } from "express";
import { asc, eq } from "drizzle-orm";
import { db, lunarInterpretationsTable, type LunarInterpretation } from "@workspace/db";
import { requireAuth, requireAdmin } from "../lib/auth";

const router: IRouter = Router();
const CATEGORIES = new Set(["house", "sign"]);
const HOUSE_KEYS = new Set(Array.from({ length: 12 }, (_, index) => String(index + 1)));
const SIGN_KEYS = new Set(["aries", "taurus", "gemini", "cancer", "leo", "virgo", "libra", "scorpio", "sagittarius", "capricorn", "aquarius", "pisces"]);

function validKey(category: string, key: string): boolean {
  return category === "house" ? HOUSE_KEYS.has(key) : SIGN_KEYS.has(key);
}

function serialize(row: LunarInterpretation) {
  return { ...row, createdAt: row.createdAt.toISOString(), updatedAt: row.updatedAt.toISOString() };
}

router.get("/admin/lunar-interpretations", requireAuth, requireAdmin, async (_req, res): Promise<void> => {
  const rows = await db.select().from(lunarInterpretationsTable).orderBy(asc(lunarInterpretationsTable.category), asc(lunarInterpretationsTable.key));
  res.json({ interpretations: rows.map(serialize) });
});

router.post("/admin/lunar-interpretations", requireAuth, requireAdmin, async (req, res): Promise<void> => {
  const body = req.body as Record<string, unknown>;
  const category = typeof body.category === "string" ? body.category : "";
  const key = typeof body.key === "string" ? body.key : "";
  if (!CATEGORIES.has(category) || !validKey(category, key)) {
    res.status(400).json({ error: "Укажите корректную категорию и ключ лунара." });
    return;
  }
  try {
    const [row] = await db.insert(lunarInterpretationsTable).values({
      category,
      key,
      title: typeof body.title === "string" && body.title.trim() ? body.title.trim() : category === "house" ? `${key} дом лунара` : key,
      text: typeof body.text === "string" && body.text.trim() ? body.text.trim() : "В разработке",
      sourceNote: typeof body.sourceNote === "string" ? body.sourceNote : null,
      isActive: body.isActive !== false,
    }).returning();
    res.status(201).json(serialize(row));
  } catch (error: any) {
    if (String(error?.message ?? "").includes("unique constraint")) {
      res.status(409).json({ error: "Такая запись лунара уже существует." });
      return;
    }
    throw error;
  }
});

router.put("/admin/lunar-interpretations/:id", requireAuth, requireAdmin, async (req, res): Promise<void> => {
  const id = Number(req.params.id);
  if (!id) { res.status(400).json({ error: "Некорректный id." }); return; }
  const body = req.body as Record<string, unknown>;
  const updates: Partial<typeof lunarInterpretationsTable.$inferInsert> = { updatedAt: new Date() };
  if (typeof body.title === "string") updates.title = body.title.trim();
  if (typeof body.text === "string") updates.text = body.text.trim() || "В разработке";
  if (typeof body.sourceNote === "string") updates.sourceNote = body.sourceNote;
  if (typeof body.isActive === "boolean") updates.isActive = body.isActive;
  const [row] = await db.update(lunarInterpretationsTable).set(updates).where(eq(lunarInterpretationsTable.id, id)).returning();
  if (!row) { res.status(404).json({ error: "Запись лунара не найдена." }); return; }
  res.json(serialize(row));
});

router.delete("/admin/lunar-interpretations/:id", requireAuth, requireAdmin, async (req, res): Promise<void> => {
  const id = Number(req.params.id);
  if (!id) { res.status(400).json({ error: "Некорректный id." }); return; }
  const result = await db.delete(lunarInterpretationsTable).where(eq(lunarInterpretationsTable.id, id));
  if (result.rowCount === 0) { res.status(404).json({ error: "Запись лунара не найдена." }); return; }
  res.json({ success: true });
});

export default router;
