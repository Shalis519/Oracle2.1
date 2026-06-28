import { Router, type IRouter } from "express";
import { and, desc, eq } from "drizzle-orm";
import { db, dreamsTable, type Dream } from "@workspace/db";
import {
  ListDreamsResponse,
  CreateDreamBody,
  CreateDreamResponse,
  DeleteDreamParams,
} from "@workspace/api-zod";
import { requireAuth } from "../lib/auth";
import { interpretDream, todayString } from "../lib/oracle";

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
  const { interpretation, keywords } = interpretDream(parsed.data.dreamText);
  const [row] = await db
    .insert(dreamsTable)
    .values({
      userId: req.localUser!.id,
      date: todayString(),
      dreamText: parsed.data.dreamText,
      interpretation,
      keywords,
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
