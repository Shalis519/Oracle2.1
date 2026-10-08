import { Router, type IRouter } from "express";
import { and, count, desc, eq } from "drizzle-orm";
import { db, dreamsTable, type Dream } from "@workspace/db";
import {
  ListDreamsResponse,
  CreateDreamBody,
  CreateDreamResponse,
  DeleteDreamParams,
} from "@workspace/api-zod";
import { requireAuth } from "../lib/auth";
import { DreamInterpreterError, interpretDreamWithAi } from "../lib/dreamInterpreter";

const DAILY_DREAM_ANALYSIS_LIMIT = 3;
const PROJECT_TIMEZONE = process.env.PROJECT_TIMEZONE ?? "Europe/Moscow";

function projectDateString(): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: PROJECT_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
  return `${values.year}-${values.month}-${values.day}`;
}

const router: IRouter = Router();

function serialize(d: Dream) {
  return {
    id: d.id,
    date: d.date,
    dreamText: d.dreamText,
    interpretation: d.interpretation,
    keywords: d.keywords,
    createdAt: d.createdAt.toISOString(),
  };
}

router.get("/dreams", requireAuth, async (req, res): Promise<void> => {
  const rows = await db
    .select()
    .from(dreamsTable)
    .where(eq(dreamsTable.userId, req.localUser!.id))
    .orderBy(desc(dreamsTable.createdAt));
  res.json(ListDreamsResponse.parse(rows.map(serialize)));
});

router.post("/dreams", requireAuth, async (req, res): Promise<void> => {
  const parsed = CreateDreamBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  if (parsed.data.dreamText.trim().length === 0) {
    res.status(400).json({ error: "Опишите сон." });
    return;
  }
  const today = projectDateString();
  const [{ value: analysesToday }] = await db
    .select({ value: count() })
    .from(dreamsTable)
    .where(
      and(
        eq(dreamsTable.userId, req.localUser!.id),
        eq(dreamsTable.date, today),
      ),
    );

  if (analysesToday >= DAILY_DREAM_ANALYSIS_LIMIT) {
    res.status(429).json({
      error:
        "Вы использовали 3 анализа сновидений за сегодня. Новые интерпретации будут доступны после наступления следующих календарных суток.",
    });
    return;
  }

  let interpretation: string;
  try {
    const result = await interpretDreamWithAi(parsed.data.dreamText);
    interpretation = result.interpretation;
  } catch (error) {
    if (error instanceof DreamInterpreterError) {
      const status = error.code === "missing_key" ? 503 : 502;
      res.status(status).json({ error: error.message });
      return;
    }
    res.status(502).json({ error: "Не удалось завершить анализ сна." });
    return;
  }

  const [row] = await db
    .insert(dreamsTable)
    .values({
      userId: req.localUser!.id,
      date: today,
      dreamText: parsed.data.dreamText,
      interpretation,
      keywords: [],
    })
    .returning();
  res.status(201).json(CreateDreamResponse.parse(serialize(row)));
});

router.delete("/dreams/:id", requireAuth, async (req, res): Promise<void> => {
  const params = DeleteDreamParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [row] = await db
    .delete(dreamsTable)
    .where(
      and(
        eq(dreamsTable.id, params.data.id),
        eq(dreamsTable.userId, req.localUser!.id),
      ),
    )
    .returning();
  if (!row) {
    res.status(404).json({ error: "Запись не найдена." });
    return;
  }
  res.sendStatus(204);
});

export default router;
