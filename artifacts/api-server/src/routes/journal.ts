import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, lifeJournalsTable, type LifeJournal } from "@workspace/db";
import {
  GetJournalResponse,
  UpdateJournalBody,
  UpdateJournalResponse,
} from "@workspace/api-zod";
import { requireAuth } from "../lib/auth";

const router: IRouter = Router();

function serialize(j: LifeJournal) {
  return {
    id: j.id,
    marriageDate: j.marriageDate,
    divorceDate: j.divorceDate,
    marriages: j.marriages,
    children: j.children,
    relocations: j.relocations,
    jobChanges: j.jobChanges,
    losses: j.losses,
    heightCm: j.heightCm,
    weightKg: j.weightKg,
    bloodType: j.bloodType,
    chronicConditions: j.chronicConditions,
    allergies: j.allergies,
    smoking: j.smoking,
    fears: j.fears,
    lastMenstruationDate: j.lastMenstruationDate,
    createdAt: j.createdAt.toISOString(),
    updatedAt: j.updatedAt.toISOString(),
  };
}

async function getOrCreate(userId: number): Promise<LifeJournal> {
  const [existing] = await db
    .select()
    .from(lifeJournalsTable)
    .where(eq(lifeJournalsTable.userId, userId));
  if (existing) return existing;
  const [created] = await db
    .insert(lifeJournalsTable)
    .values({ userId })
    .returning();
  return created;
}

router.get("/journal", requireAuth, async (req, res): Promise<void> => {
  const journal = await getOrCreate(req.localUser!.id);
  res.json(GetJournalResponse.parse(serialize(journal)));
});

router.put("/journal", requireAuth, async (req, res): Promise<void> => {
  const parsed = UpdateJournalBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  await getOrCreate(req.localUser!.id);

  const [updated] = await db
    .update(lifeJournalsTable)
    .set({ ...parsed.data, updatedAt: new Date() })
    .where(eq(lifeJournalsTable.userId, req.localUser!.id))
    .returning();

  res.json(UpdateJournalResponse.parse(serialize(updated)));
});

export default router;
