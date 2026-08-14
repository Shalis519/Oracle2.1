import { Router, type IRouter } from "express";
import { and, asc, eq } from "drizzle-orm";
import {
  db,
  synastryInterpretationsTable,
  synastryHouseInterpretationsTable,
  type SynastryInterpretation,
  type SynastryHouseInterpretation,
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
  ["lilith", "Лилит"],
  ["black-moon", "Чёрная Луна"],
]);
const ASPECT_LABELS = new Map([
  ["conjunction", "соединение"],
  ["sextile", "секстиль"],
  ["square", "квадрат"],
  ["trine", "тригон"],
  ["opposition", "оппозиция"],
]);
const DIRECTIONS = new Set(["neutral", "male-to-female", "female-to-male", "mutual"]);

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

function houseTitle(row: Pick<SynastryHouseInterpretation, "planetBody" | "houseNumber">) {
  const planet = BODY_LABELS.get(row.planetBody) ?? row.planetBody;
  return `${planet} в ${row.houseNumber} доме`;
}

function serializeHouse(row: SynastryHouseInterpretation) {
  return {
    ...row,
    title: houseTitle(row),
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

function isValidHouse(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value >= 1 && value <= 12;
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

router.get("/admin/synastry-house-interpretations", requireAuth, requireAdmin, async (_req, res): Promise<void> => {
  const rows = await db.select().from(synastryHouseInterpretationsTable).orderBy(
    asc(synastryHouseInterpretationsTable.planetBody),
    asc(synastryHouseInterpretationsTable.houseNumber),
    asc(synastryHouseInterpretationsTable.directionKey),
  );
  res.json({ interpretations: rows.map(serializeHouse) });
});

router.post("/admin/synastry-house-interpretations", requireAuth, requireAdmin, async (req, res): Promise<void> => {
  const body = req.body as Record<string, unknown>;
  const houseNumber = Number(body.houseNumber);
  if (!isValidBody(body.planetBody) || !isValidHouse(houseNumber)) {
    res.status(400).json({ error: "Укажите допустимую планету и номер дома от 1 до 12" });
    return;
  }
  const directionKey = typeof body.directionKey === "string" && DIRECTIONS.has(body.directionKey) ? body.directionKey : "neutral";
  const [row] = await db.insert(synastryHouseInterpretationsTable).values({
    planetBody: body.planetBody,
    houseNumber,
    directionKey,
    title: houseTitle({ planetBody: body.planetBody, houseNumber }),
    text: typeof body.text === "string" ? body.text.trim() || "В разработке" : "В разработке",
    sourceNote: typeof body.sourceNote === "string" ? body.sourceNote : null,
    isActive: body.isActive !== false,
  }).returning();
  res.status(201).json(serializeHouse(row));
});

router.put("/admin/synastry-house-interpretations/:id", requireAuth, requireAdmin, async (req, res): Promise<void> => {
  const id = Number(req.params.id);
  if (!id) { res.status(400).json({ error: "Некорректный id" }); return; }
  const current = await db.select().from(synastryHouseInterpretationsTable).where(eq(synastryHouseInterpretationsTable.id, id));
  if (!current[0]) { res.status(404).json({ error: "Интерпретация дома не найдена" }); return; }
  const body = req.body as Record<string, unknown>;
  const updates: Partial<typeof synastryHouseInterpretationsTable.$inferInsert> = { updatedAt: new Date() };
  if (typeof body.text === "string") updates.text = body.text.trim() || "В разработке";
  if (typeof body.sourceNote === "string") updates.sourceNote = body.sourceNote;
  if (typeof body.isActive === "boolean") updates.isActive = body.isActive;
  const [row] = await db.update(synastryHouseInterpretationsTable).set(updates).where(eq(synastryHouseInterpretationsTable.id, id)).returning();
  res.json(serializeHouse(row));
});

router.delete("/admin/synastry-house-interpretations/:id", requireAuth, requireAdmin, async (req, res): Promise<void> => {
  const id = Number(req.params.id);
  if (!id) { res.status(400).json({ error: "Некорректный id" }); return; }
  const result = await db.delete(synastryHouseInterpretationsTable).where(eq(synastryHouseInterpretationsTable.id, id));
  if (result.rowCount === 0) { res.status(404).json({ error: "Интерпретация дома не найдена" }); return; }
  res.json({ success: true });
});

export default router;
