import { Router, type IRouter } from "express";
import { and, asc, eq } from "drizzle-orm";
import {
  db,
  cinderellaInterpretationsTable,
  type CinderellaInterpretation,
} from "@workspace/db";
import { requireAuth, requireAdmin } from "../lib/auth";

const router: IRouter = Router();

const CINDERELLA_PAIRS = new Map([
  ["chiron-venus", "Венера"],
  ["chiron-jupiter", "Юпитер"],
  ["chiron-neptune", "Нептун"],
  ["chiron-sun", "Солнце"],
  ["chiron-pluto", "Плутон"],
]);
const CINDERELLA_MODES = new Set(["natal", "transit", "synastry"]);

function canonicalTitle(pairKey: string, mode: string) {
  const pair = `Хирон - ${CINDERELLA_PAIRS.get(pairKey) ?? "планета"}`;
  if (mode === "natal") return `${pair}: натальный аспект`;
  if (mode === "transit") return `${pair}: транзит Врат Золушки`;
  return `${pair}: синастрия`;
}

function serialize(row: CinderellaInterpretation) {
  return {
    ...row,
    title: canonicalTitle(row.pairKey, row.mode),
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

router.get("/admin/cinderella-interpretations", requireAuth, requireAdmin, async (req, res): Promise<void> => {
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
  if (typeof body.pairKey !== "string" || typeof body.mode !== "string") {
    res.status(400).json({ error: "Нужны pairKey и mode" });
    return;
  }
  if (!CINDERELLA_PAIRS.has(body.pairKey) || !CINDERELLA_MODES.has(body.mode)) {
    res.status(400).json({ error: "Поддерживаются только фиксированные пары Врат Золушки" });
    return;
  }
  const text = typeof body.text === "string" && body.text.trim() ? body.text : "В разработке";
  try {
    const [row] = await db.insert(cinderellaInterpretationsTable).values({
      pairKey: body.pairKey,
      mode: body.mode,
      aspectKey: "any",
      title: canonicalTitle(body.pairKey, body.mode),
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
  if (typeof body.sourceNote === "string") updates.sourceNote = body.sourceNote;
  if (typeof body.text === "string") updates.text = body.text.trim() || "В разработке";
  updates.aspectKey = "any";
  if (typeof body.pairKey === "string" && CINDERELLA_PAIRS.has(body.pairKey)) updates.pairKey = body.pairKey;
  if (typeof body.mode === "string" && CINDERELLA_MODES.has(body.mode)) updates.mode = body.mode;
  const nextPair = (updates.pairKey as string | undefined) ?? "chiron-venus";
  const nextMode = (updates.mode as string | undefined) ?? "natal";
  updates.title = canonicalTitle(nextPair, nextMode);
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
