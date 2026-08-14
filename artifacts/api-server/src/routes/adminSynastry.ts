import { Router, type IRouter } from "express";
import { and, asc, eq } from "drizzle-orm";
import {
  db,
  synastryInterpretationsTable,
  type SynastryInterpretation,
} from "@workspace/db";
import { requireAuth, requireAdmin } from "../lib/auth";

const router: IRouter = Router();

const BODY_LABELS = new Map([
  ["sun", "Солнце"],
  ["moon", "Луна"],
  ["mercury", "Меркурий"],
  ["venus", "Венера"],
  ["mars", "Марс"],
  ["jupiter", "Юпитер"],
  ["saturn", "Сатурн"],
  ["uranus", "Уран"],
  ["neptune", "Нептун"],
  ["pluto", "Плутон"],
  ["chiron", "Хирон"],
  ["black-moon", "Чёрная Луна"],
]);
const ASPECT_LABELS = new Map([
  ["conjunction", "соединение"],
  ["sextile", "секстиль"],
  ["square", "квадрат"],
  ["trine", "тригон"],
  ["opposition", "оппозиция"],
]);
const DIRECTIONS = new Set(["neutral", "male-to-female", "female-to-male"]);

function canonicalTitle(row: Pick<SynastryInterpretation, "sourceBody" | "targetBody" | "aspectKey">) {
  const source = BODY_LABELS.get(row.sourceBody) ?? row.sourceBody;
  const target = BODY_LABELS.get(row.targetBody) ?? row.targetBody;
  const aspect = ASPECT_LABELS.get(row.aspectKey) ?? row.aspectKey;
  return `${source} - ${target}: ${aspect}`;
}

function serialize(row: SynastryInterpretation) {
  return {
    ...row,
    title: canonicalTitle(row),
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

function isValidBody(value: unknown): value is string {
  return typeof value === "string" && BODY_LABELS.has(value);
}
function isValidAspect(value: unknown): value is string {
  return typeof value === "string" && ASPECT_LABELS.has(value);
}

router.get("/admin/synastry-interpretations", requireAuth, requireAdmin, async (req, res): Promise<void> => {
  const category = typeof req.query.categoryKey === "string" ? req.query.categoryKey : undefined;
  const rows = await db
    .select()
    .from(synastryInterpretationsTable)
    .where(category ? eq(synastryInterpretationsTable.categoryKey, category) : undefined)
    .orderBy(
      asc(synastryInterpretationsTable.categoryKey),
      asc(synastryInterpretationsTable.sourceBody),
      asc(synastryInterpretationsTable.targetBody),
      asc(synastryInterpretationsTable.aspectKey),
    );
  res.json({ interpretations: rows.map(serialize) });
});

router.post("/admin/synastry-interpretations", requireAuth, requireAdmin, async (req, res): Promise<void> => {
  const body = req.body as Record<string, unknown>;
  if (!isValidBody(body.sourceBody) || !isValidBody(body.targetBody) || !isValidAspect(body.aspectKey)) {
    res.status(400).json({ error: "Укажите допустимые объекты и аспект" });
    return;
  }
  const directionKey = typeof body.directionKey === "string" && DIRECTIONS.has(body.directionKey)
    ? body.directionKey
    : "neutral";
  const [row] = await db.insert(synastryInterpretationsTable).values({
    categoryKey: typeof body.categoryKey === "string" ? body.categoryKey.trim() || "general" : "general",
    sourceBody: body.sourceBody,
    targetBody: body.targetBody,
    aspectKey: body.aspectKey,
    directionKey,
    title: canonicalTitle({ sourceBody: body.sourceBody, targetBody: body.targetBody, aspectKey: body.aspectKey }),
    text: typeof body.text === "string" ? body.text.trim() || "В разработке" : "В разработке",
    keywords: Array.isArray(body.keywords) ? body.keywords.filter((v): v is string => typeof v === "string") : [],
    sourceNote: typeof body.sourceNote === "string" ? body.sourceNote : null,
    isActive: body.isActive !== false,
  }).returning();
  res.status(201).json(serialize(row));
});

router.put("/admin/synastry-interpretations/:id", requireAuth, requireAdmin, async (req, res): Promise<void> => {
  const id = Number(req.params.id);
  if (!id) { res.status(400).json({ error: "Некорректный id" }); return; }
  const current = await db.select().from(synastryInterpretationsTable).where(eq(synastryInterpretationsTable.id, id));
  if (!current[0]) { res.status(404).json({ error: "Интерпретация не найдена" }); return; }
  const body = req.body as Record<string, unknown>;
  const updates: Partial<typeof synastryInterpretationsTable.$inferInsert> = { updatedAt: new Date() };
  if (typeof body.text === "string") updates.text = body.text.trim() || "В разработке";
  if (typeof body.sourceNote === "string") updates.sourceNote = body.sourceNote;
  if (Array.isArray(body.keywords)) updates.keywords = body.keywords.filter((v): v is string => typeof v === "string");
  if (typeof body.isActive === "boolean") updates.isActive = body.isActive;
  const [row] = await db.update(synastryInterpretationsTable).set(updates).where(eq(synastryInterpretationsTable.id, id)).returning();
  res.json(serialize(row));
});

router.delete("/admin/synastry-interpretations/:id", requireAuth, requireAdmin, async (req, res): Promise<void> => {
  const id = Number(req.params.id);
  if (!id) { res.status(400).json({ error: "Некорректный id" }); return; }
  const result = await db.delete(synastryInterpretationsTable).where(eq(synastryInterpretationsTable.id, id));
  if (result.rowCount === 0) { res.status(404).json({ error: "Интерпретация не найдена" }); return; }
  res.json({ success: true });
});

export default router;
