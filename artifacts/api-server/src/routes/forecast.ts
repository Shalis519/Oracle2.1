import { Router, type IRouter } from "express";
import { and, desc, eq, lt, sql } from "drizzle-orm";
import {
  db,
  forecastsTable,
  feedbackTable,
  dreamsTable,
  contactsTable,
  tasksTable,
  usersTable,
} from "@workspace/db";
import {
  GetTodayForecastResponse,
  ListForecastsResponse,
  SubmitFeedbackParams,
  SubmitFeedbackBody,
  SubmitFeedbackResponse,
  GetDashboardResponse,
} from "@workspace/api-zod";
import { requireAuth } from "../lib/auth";
import {
  computeDailyForecast,
  computeSpendingDays,
  todayString,
  type DailyForecastResult,
} from "../lib/oracle";
import { computeTransits, computeNatalChart, type NatalChart, type NatalChartInput } from "../lib/astrology";
import { hydrateCinderellaGates } from "../lib/cinderellaGates";
import { daysUntilBirthday } from "../lib/dates";

const router: IRouter = Router();
const forecastCleanupByUser = new Map<number, string>();

function ninetyDaysAgoDate(): string {
  const cutoff = new Date();
  cutoff.setUTCDate(cutoff.getUTCDate() - 90);
  return cutoff.toISOString().slice(0, 10);
}

async function cleanupOldForecasts(userId: number): Promise<void> {
  const cutoffDate = ninetyDaysAgoDate();
  if (forecastCleanupByUser.get(userId) === cutoffDate) return;

  // Сначала удаляем отзывы, связанные с истекающими прогнозами, чтобы не оставлять
  // осиротевшие записи и не нарушать будущие внешние ограничения целостности.
  await db.delete(feedbackTable).where(
    sql`${feedbackTable.userId} = ${userId} AND ${feedbackTable.forecastId} IN (
      SELECT ${forecastsTable.id}
      FROM ${forecastsTable}
      WHERE ${forecastsTable.userId} = ${userId}
        AND ${forecastsTable.date} < ${cutoffDate}
    )`,
  );
  await db.delete(forecastsTable).where(
    and(eq(forecastsTable.userId, userId), lt(forecastsTable.date, cutoffDate)),
  );
  forecastCleanupByUser.set(userId, cutoffDate);
}

function serializeFeedback(fb: { id: number; forecastId: number; date: string; accuracy: string; comment: string | null; createdAt: Date }) {
  return {
    id: fb.id,
    forecastId: fb.forecastId,
    date: fb.date,
    accuracy: fb.accuracy,
    comment: fb.comment,
    createdAt: fb.createdAt.toISOString(),
  };
}

function buildForecast(
  row: typeof forecastsTable.$inferSelect,
  fb: { id: number; forecastId: number; date: string; accuracy: string; comment: string | null; createdAt: Date } | null,
) {
  const payload = row.payload as Pick<
    DailyForecastResult,
    "matrix" | "transits" | "cinderellaGates" | "conflicts" | "warnings"
  >;
  return {
    id: row.id,
    date: row.date,
    arcanaNumber: row.arcanaNumber,
    arcanaName: row.arcanaName,
    hasWarning: row.hasWarning,
    synthesisText: row.synthesisText,
    matrix: payload.matrix,
    transits: payload.transits ?? [],
    cinderellaGates: payload.cinderellaGates ?? [],
    conflicts: payload.conflicts ?? [],
    warnings: payload.warnings ?? [],
    feedback: fb ? serializeFeedback(fb) : null,
  };
}

export const CURRENT_FORECAST_VERSION = 52;

async function getOrComputeToday(
  userId: number,
  birthDate: string | null,
  birthTime: string | null,
  natalChartJson: unknown | null,
  birthLatitude: number | null,
  birthLongitude: number | null,
  birthTimezone: string | null,
 ): Promise<typeof forecastsTable.$inferSelect | null> {
  await cleanupOldForecasts(userId);
  const date = todayString();

  const [existing] = await db
    .select()
    .from(forecastsTable)
    .where(and(eq(forecastsTable.userId, userId), eq(forecastsTable.date, date)));

  // If forecast is fresh enough, return it as-is (preserves feedback links)
  if (existing && (existing.version ?? 1) >= CURRENT_FORECAST_VERSION) {
    return existing;
  }

  if (!birthDate || birthLatitude == null || birthLongitude == null) return null;

  // Use cached natal chart or compute live from birth data
  let natalChart: NatalChart | null = null;
  if (natalChartJson) {
    try {
      const parsed = natalChartJson as { bodies?: unknown[] };
      if (parsed && Array.isArray(parsed.bodies) && parsed.bodies.length > 0) {
        natalChart = natalChartJson as NatalChart;
      }
    } catch {
      natalChart = null;
    }
  }
  if (!natalChart) {
    const [y, m, d] = birthDate.split("-").map(Number);
    const [h, min] = birthTime ? birthTime.split(":").map(Number) : [12, 0];
    const input: NatalChartInput = {
      year: y, month: m, day: d,
      hour: Number.isFinite(h) ? h : 12,
      minute: Number.isFinite(min) ? min : 0,
      latitude: birthLatitude,
      longitude: birthLongitude,
      timezone: birthTimezone,
    };
    try {
      natalChart = computeNatalChart(input);
    } catch {
      natalChart = null;
    }
  }

  const transits = natalChart
    ? computeTransits(natalChart, date, birthLatitude, birthLongitude, birthTimezone, {
        excludedNatalBodies: ["chiron"],
      })
    : null;

  const result = await computeDailyForecast(birthDate, natalChart, transits, date);
  if (!result) return null;

  const hydratedCinderellaGates = await hydrateCinderellaGates(result.cinderellaGates);
  const payload = {
    matrix: result.matrix,
    transits: result.transits,
    cinderellaGates: hydratedCinderellaGates,
    conflicts: result.conflicts,
    warnings: result.warnings,
  };

  if (existing) {
    // UPDATE in-place so feedback.forecastId stays valid
    const [updated] = await db
      .update(forecastsTable)
      .set({
        arcanaNumber: result.arcanaNumber,
        arcanaName: result.arcanaName,
        hasWarning: result.hasWarning,
        synthesisText: result.synthesisText,
        version: CURRENT_FORECAST_VERSION,
        payload,
      })
      .where(and(eq(forecastsTable.userId, userId), eq(forecastsTable.date, date)))
      .returning();
    return updated;
  }

  const [created] = await db
    .insert(forecastsTable)
    .values({
      userId,
      date,
      arcanaNumber: result.arcanaNumber,
      arcanaName: result.arcanaName,
      hasWarning: result.hasWarning,
      synthesisText: result.synthesisText,
      version: CURRENT_FORECAST_VERSION,
      payload,
    })
    .returning();
  return created;
}

router.get("/forecast/today", requireAuth, async (req, res): Promise<void> => {
  const user = req.localUser!;
  if (!user.birthDate || user.birthLatitude == null || user.birthLongitude == null) {
    res
      .status(400)
      .json({ error: "Заполните дату рождения и место рождения в профиле, чтобы получить прогноз." });
    return;
  }
  const row = await getOrComputeToday(
    user.id,
    user.birthDate,
    user.birthTime,
    user.natalChart ?? null,
    user.birthLatitude,
    user.birthLongitude,
    user.birthTimezone,
  );
  if (!row) {
    res.status(400).json({ error: "Не удалось рассчитать прогноз." });
    return;
  }
  const [fb] = await db
    .select()
    .from(feedbackTable)
    .where(eq(feedbackTable.forecastId, row.id));
  res
    .set("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0")
    .set("Pragma", "no-cache")
    .set("Expires", "0")
    .json(
      GetTodayForecastResponse.parse(buildForecast(row, fb ?? null)),
    );
});

router.get("/forecast/history", requireAuth, async (req, res): Promise<void> => {
  const rows = await db
    .select()
    .from(forecastsTable)
    .where(eq(forecastsTable.userId, req.localUser!.id))
    .orderBy(desc(forecastsTable.date));

  const fbRows = await db
    .select()
    .from(feedbackTable)
    .where(eq(feedbackTable.userId, req.localUser!.id));
  const fbByForecast = new Map(fbRows.map((f) => [f.forecastId, f]));

  res.json(
    ListForecastsResponse.parse(
      rows.map((r) =>
        buildForecast(r, fbByForecast.get(r.id) ?? null),
      ),
    ),
  );
});

router.post(
  "/forecast/:id/feedback",
  requireAuth,
  async (req, res): Promise<void> => {
    const params = SubmitFeedbackParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }
    const body = SubmitFeedbackBody.safeParse(req.body);
    if (!body.success) {
      res.status(400).json({ error: body.error.message });
      return;
    }

    const [forecast] = await db
      .select()
      .from(forecastsTable)
      .where(
        and(
          eq(forecastsTable.id, params.data.id),
          eq(forecastsTable.userId, req.localUser!.id),
        ),
      );
    if (!forecast) {
      res.status(404).json({ error: "Прогноз не найден." });
      return;
    }

    const [existing] = await db
      .select()
      .from(feedbackTable)
      .where(eq(feedbackTable.forecastId, forecast.id));

    let row: typeof feedbackTable.$inferSelect;
    if (existing) {
      [row] = await db
        .update(feedbackTable)
        .set({ accuracy: body.data.accuracy, comment: body.data.comment ?? null })
        .where(eq(feedbackTable.id, existing.id))
        .returning();
    } else {
      [row] = await db
        .insert(feedbackTable)
        .values({
          userId: req.localUser!.id,
          forecastId: forecast.id,
          date: forecast.date,
          accuracy: body.data.accuracy,
          comment: body.data.comment ?? null,
        })
        .returning();
    }

    res.json(SubmitFeedbackResponse.parse(serializeFeedback(row)));
  },
);

router.get("/dashboard", requireAuth, async (req, res): Promise<void> => {
  const user = req.localUser!;
  const date = todayString();
  const profileComplete = !!user.birthDate && user.birthLatitude != null && user.birthLongitude != null;

  let arcanaNumber: number | null = null;
  let arcanaName: string | null = null;
  let hasWarning = false;

  if (profileComplete) {
    const row = await getOrComputeToday(
      user.id,
      user.birthDate,
      user.birthTime,
      user.natalChart ?? null,
      user.birthLatitude,
      user.birthLongitude,
      user.birthTimezone,
    );
    if (row) {
      arcanaNumber = row.arcanaNumber;
      arcanaName = row.arcanaName;
      hasWarning = row.hasWarning;
    }
  }

  const contacts = await db
    .select()
    .from(contactsTable)
    .where(
      and(eq(contactsTable.userId, user.id), eq(contactsTable.isActive, true)),
    );
  const upcomingBirthdaysCount = contacts.filter((c) => {
    if (!c.birthDate) return false;
    const d = daysUntilBirthday(c.birthDate);
    return d !== null && d <= 7;
  }).length;

  const tasks = await db
    .select()
    .from(tasksTable)
    .where(and(eq(tasksTable.userId, user.id), eq(tasksTable.date, date)));
  const water = tasks.find((t) => t.taskType === "water");
  const steps = tasks.find((t) => t.taskType === "steps");

  const [recentDream] = await db
    .select()
    .from(dreamsTable)
    .where(eq(dreamsTable.userId, user.id))
    .orderBy(desc(dreamsTable.createdAt))
    .limit(1);

  res.json(
    GetDashboardResponse.parse({
      profileComplete,
      arcanaNumber,
      arcanaName,
      hasWarning,
      upcomingBirthdaysCount,
      waterProgress: water?.actualValue ?? 0,
      waterTarget: water?.targetValue ?? 8,
      stepsProgress: steps?.actualValue ?? 0,
      stepsTarget: steps?.targetValue ?? 10000,
      recentDream: recentDream
        ? {
            id: recentDream.id,
            date: recentDream.date,
            dreamText: recentDream.dreamText,
            interpretation: recentDream.interpretation,
            keywords: recentDream.keywords,
            createdAt: recentDream.createdAt.toISOString(),
          }
        : null,
    }),
  );
});

export default router;
