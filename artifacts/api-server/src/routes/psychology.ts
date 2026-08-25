import { and, asc, desc, eq, isNull } from "drizzle-orm";
import { Router, type IRouter } from "express";
import {
  db,
  psychologyPracticesTable,
  psychologyReflectionsTable,
  type PsychologyPractice,
  type PsychologyReflection,
} from "@workspace/db";
import {
  CreatePsychologyReflectionBody,
  CreatePsychologyReflectionResponse,
  DeletePsychologyReflectionParams,
  ListPsychologyPracticesResponse,
  ListPsychologyReflectionsResponse,
  UpdatePsychologyReflectionBody,
  UpdatePsychologyReflectionParams,
  UpdatePsychologyReflectionResponse,
} from "@workspace/api-zod";
import { requireAuth } from "../lib/auth";
import { ensurePsychologyPractices } from "../lib/seedPsychology";

const router: IRouter = Router();

function serializePractice(practice: PsychologyPractice) {
  return {
    id: practice.id,
    slug: practice.slug,
    title: practice.title,
    summary: practice.summary,
    outcome: practice.outcome,
    durationMinutes: practice.durationMinutes,
    steps: practice.steps,
    safetyNote: practice.safetyNote,
    sourceNote: practice.sourceNote,
    isActive: practice.isActive,
    sortOrder: practice.sortOrder,
    createdAt: practice.createdAt.toISOString(),
    updatedAt: practice.updatedAt.toISOString(),
  };
}

function serializeReflection(
  reflection: PsychologyReflection,
  practiceTitle: string,
) {
  return {
    id: reflection.id,
    practiceId: reflection.practiceId,
    practiceTitle,
    answers: reflection.answers,
    nextStep: reflection.nextStep,
    createdAt: reflection.createdAt.toISOString(),
    updatedAt: reflection.updatedAt.toISOString(),
  };
}

async function findActivePractice(
  practiceId: number,
): Promise<PsychologyPractice | null> {
  const [practice] = await db
    .select()
    .from(psychologyPracticesTable)
    .where(
      and(
        eq(psychologyPracticesTable.id, practiceId),
        eq(psychologyPracticesTable.isActive, true),
      ),
    );
  return practice ?? null;
}

router.get(
  "/psychology/practices",
  requireAuth,
  async (_req, res): Promise<void> => {
    await ensurePsychologyPractices();
    const practices = await db
      .select()
      .from(psychologyPracticesTable)
      .where(eq(psychologyPracticesTable.isActive, true))
      .orderBy(
        asc(psychologyPracticesTable.sortOrder),
        asc(psychologyPracticesTable.id),
      );
    res.json(
      ListPsychologyPracticesResponse.parse(practices.map(serializePractice)),
    );
  },
);

router.get(
  "/psychology/reflections",
  requireAuth,
  async (req, res): Promise<void> => {
    const rows = await db
      .select({
        reflection: psychologyReflectionsTable,
        practiceTitle: psychologyPracticesTable.title,
      })
      .from(psychologyReflectionsTable)
      .innerJoin(
        psychologyPracticesTable,
        eq(psychologyReflectionsTable.practiceId, psychologyPracticesTable.id),
      )
      .where(
        and(
          eq(psychologyReflectionsTable.userId, req.localUser!.id),
          isNull(psychologyReflectionsTable.deletedAt),
        ),
      )
      .orderBy(desc(psychologyReflectionsTable.updatedAt));
    res.json(
      ListPsychologyReflectionsResponse.parse(
        rows.map((row) =>
          serializeReflection(row.reflection, row.practiceTitle),
        ),
      ),
    );
  },
);

router.post(
  "/psychology/reflections",
  requireAuth,
  async (req, res): Promise<void> => {
    const parsed = CreatePsychologyReflectionBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.message });
      return;
    }
    const practice = await findActivePractice(parsed.data.practiceId);
    if (!practice) {
      res.status(400).json({ error: "Практика не найдена или недоступна." });
      return;
    }
    const [reflection] = await db
      .insert(psychologyReflectionsTable)
      .values({
        userId: req.localUser!.id,
        practiceId: practice.id,
        answers: parsed.data.answers,
        nextStep: parsed.data.nextStep?.trim() || null,
      })
      .returning();
    res
      .status(201)
      .json(
        CreatePsychologyReflectionResponse.parse(
          serializeReflection(reflection, practice.title),
        ),
      );
  },
);

router.put(
  "/psychology/reflections/:id",
  requireAuth,
  async (req, res): Promise<void> => {
    const params = UpdatePsychologyReflectionParams.safeParse(req.params);
    const body = UpdatePsychologyReflectionBody.safeParse(req.body);
    if (!params.success || !body.success) {
      res.status(400).json({ error: "Некорректные данные записи." });
      return;
    }
    const practice = await findActivePractice(body.data.practiceId);
    if (!practice) {
      res.status(400).json({ error: "Практика не найдена или недоступна." });
      return;
    }
    const [reflection] = await db
      .update(psychologyReflectionsTable)
      .set({
        practiceId: practice.id,
        answers: body.data.answers,
        nextStep: body.data.nextStep?.trim() || null,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(psychologyReflectionsTable.id, params.data.id),
          eq(psychologyReflectionsTable.userId, req.localUser!.id),
          isNull(psychologyReflectionsTable.deletedAt),
        ),
      )
      .returning();
    if (!reflection) {
      res.status(404).json({ error: "Запись не найдена." });
      return;
    }
    res.json(
      UpdatePsychologyReflectionResponse.parse(
        serializeReflection(reflection, practice.title),
      ),
    );
  },
);

router.delete(
  "/psychology/reflections/:id",
  requireAuth,
  async (req, res): Promise<void> => {
    const params = DeletePsychologyReflectionParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ error: "Некорректный идентификатор записи." });
      return;
    }
    const [reflection] = await db
      .update(psychologyReflectionsTable)
      .set({ deletedAt: new Date(), updatedAt: new Date() })
      .where(
        and(
          eq(psychologyReflectionsTable.id, params.data.id),
          eq(psychologyReflectionsTable.userId, req.localUser!.id),
          isNull(psychologyReflectionsTable.deletedAt),
        ),
      )
      .returning();
    if (!reflection) {
      res.status(404).json({ error: "Запись не найдена." });
      return;
    }
    res.sendStatus(204);
  },
);

export default router;
