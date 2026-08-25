import { asc, eq } from "drizzle-orm";
import { Router, type IRouter } from "express";
import {
  db,
  psychologyPracticesTable,
  type PsychologyPractice,
} from "@workspace/db";
import {
  CreateAdminPsychologyPracticeBody,
  CreateAdminPsychologyPracticeResponse,
  DeleteAdminPsychologyPracticeParams,
  ListAdminPsychologyPracticesResponse,
  UpdateAdminPsychologyPracticeBody,
  UpdateAdminPsychologyPracticeParams,
  UpdateAdminPsychologyPracticeResponse,
} from "@workspace/api-zod";
import { requireAdmin, requireAuth } from "../lib/auth";
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

function normalizePractice(input: {
  slug: string;
  title: string;
  summary: string;
  outcome: string;
  durationMinutes: number;
  steps: Array<{
    id: string;
    title: string;
    instruction: string;
    fieldLabel?: string | null;
    fieldPlaceholder?: string | null;
    optional?: boolean;
  }>;
  safetyNote: string;
  sourceNote?: string | null;
  isActive: boolean;
  sortOrder: number;
}) {
  return {
    slug: input.slug.trim(),
    title: input.title.trim(),
    summary: input.summary.trim(),
    outcome: input.outcome.trim(),
    durationMinutes: Math.max(1, Math.round(input.durationMinutes)),
    steps: input.steps.map((step) => ({
      ...step,
      fieldLabel: step.fieldLabel ?? undefined,
      fieldPlaceholder: step.fieldPlaceholder ?? undefined,
    })),
    safetyNote: input.safetyNote.trim(),
    sourceNote: input.sourceNote?.trim() || null,
    isActive: input.isActive,
    sortOrder: Math.round(input.sortOrder),
  };
}

function hasRequiredText(input: ReturnType<typeof normalizePractice>): boolean {
  return Boolean(
    input.slug &&
    input.title &&
    input.summary &&
    input.outcome &&
    input.safetyNote &&
    input.steps.length,
  );
}

router.get(
  "/admin/psychology/practices",
  requireAuth,
  requireAdmin,
  async (_req, res): Promise<void> => {
    await ensurePsychologyPractices();
    const practices = await db
      .select()
      .from(psychologyPracticesTable)
      .orderBy(
        asc(psychologyPracticesTable.sortOrder),
        asc(psychologyPracticesTable.id),
      );
    res.json(
      ListAdminPsychologyPracticesResponse.parse(
        practices.map(serializePractice),
      ),
    );
  },
);

router.post(
  "/admin/psychology/practices",
  requireAuth,
  requireAdmin,
  async (req, res): Promise<void> => {
    const parsed = CreateAdminPsychologyPracticeBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.message });
      return;
    }
    const practice = normalizePractice(parsed.data);
    if (!hasRequiredText(practice)) {
      res.status(400).json({
        error:
          "Заполните обязательные поля практики и добавьте хотя бы один шаг.",
      });
      return;
    }
    try {
      const [created] = await db
        .insert(psychologyPracticesTable)
        .values(practice)
        .returning();
      res
        .status(201)
        .json(
          CreateAdminPsychologyPracticeResponse.parse(
            serializePractice(created),
          ),
        );
    } catch (error: any) {
      if (String(error?.message ?? "").includes("unique")) {
        res
          .status(409)
          .json({ error: "Практика с таким кодом уже существует." });
        return;
      }
      throw error;
    }
  },
);

router.put(
  "/admin/psychology/practices/:id",
  requireAuth,
  requireAdmin,
  async (req, res): Promise<void> => {
    const params = UpdateAdminPsychologyPracticeParams.safeParse(req.params);
    const parsed = UpdateAdminPsychologyPracticeBody.safeParse(req.body);
    if (!params.success || !parsed.success) {
      res.status(400).json({ error: "Некорректные данные практики." });
      return;
    }
    const practice = normalizePractice(parsed.data);
    if (!hasRequiredText(practice)) {
      res.status(400).json({
        error:
          "Заполните обязательные поля практики и добавьте хотя бы один шаг.",
      });
      return;
    }
    const [updated] = await db
      .update(psychologyPracticesTable)
      .set({ ...practice, updatedAt: new Date() })
      .where(eq(psychologyPracticesTable.id, params.data.id))
      .returning();
    if (!updated) {
      res.status(404).json({ error: "Практика не найдена." });
      return;
    }
    res.json(
      UpdateAdminPsychologyPracticeResponse.parse(serializePractice(updated)),
    );
  },
);

router.delete(
  "/admin/psychology/practices/:id",
  requireAuth,
  requireAdmin,
  async (req, res): Promise<void> => {
    const params = DeleteAdminPsychologyPracticeParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ error: "Некорректный идентификатор практики." });
      return;
    }
    try {
      const result = await db
        .delete(psychologyPracticesTable)
        .where(eq(psychologyPracticesTable.id, params.data.id));
      if (result.rowCount === 0) {
        res.status(404).json({ error: "Практика не найдена." });
        return;
      }
      res.sendStatus(204);
    } catch (error: any) {
      if (String(error?.message ?? "").includes("foreign key")) {
        res.status(409).json({
          error:
            "Нельзя удалить практику, пока с ней связаны личные записи. Скройте её из публикации вместо удаления.",
        });
        return;
      }
      throw error;
    }
  },
);

export default router;
