import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, usersTable } from "@workspace/db";
import {
  GetProfileResponse,
  UpdateProfileBody,
  UpdateProfileResponse,
} from "@workspace/api-zod";
import { requireAuth } from "../lib/auth";
import { computeNatalChart, type NatalChartInput, type NatalChart } from "../lib/astrology";

const router: IRouter = Router();

function serialize(user: {
  id: number;
  name: string;
  city: string | null;
  cityLatitude: number | null;
  cityLongitude: number | null;
  cityTimezone: string | null;
  birthDate: string | null;
  birthTime: string | null;
  birthPlace: string | null;
  birthLatitude: number | null;
  birthLongitude: number | null;
  birthTimezone: string | null;
  photoPath: string | null;
  bedDirection: string | null;
  avatarType: string | null;
  natalChart: unknown | null;
  notificationsEnabled: boolean;
  role: string;
  createdAt: Date;
}) {
  return {
    id: user.id,
    name: user.name,
    city: user.city,
    cityLatitude: user.cityLatitude,
    cityLongitude: user.cityLongitude,
    cityTimezone: user.cityTimezone,
    birthDate: user.birthDate,
    birthTime: user.birthTime,
    birthPlace: user.birthPlace,
    birthLatitude: user.birthLatitude,
    birthLongitude: user.birthLongitude,
    birthTimezone: user.birthTimezone,
    photoPath: user.photoPath,
    bedDirection: user.bedDirection,
    avatarType: user.avatarType,
    natalChart: user.natalChart,
    notificationsEnabled: user.notificationsEnabled,
    role: user.role,
    createdAt: user.createdAt.toISOString(),
  };
}

router.get("/profile", requireAuth, async (req, res): Promise<void> => {
  res.json(GetProfileResponse.parse(serialize(req.localUser!)));
});

router.put("/profile", requireAuth, async (req, res): Promise<void> => {
  const parsed = UpdateProfileBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [updated] = await db
    .update(usersTable)
    .set(parsed.data)
    .where(eq(usersTable.id, req.localUser!.id))
    .returning();

  res.json(UpdateProfileResponse.parse(serialize(updated)));
});

router.post("/profile/make-admin", requireAuth, async (req, res): Promise<void> => {
  if (req.localUser!.role === "admin") {
    res.status(409).json({ error: "Already admin" });
    return;
  }
  const [updated] = await db
    .update(usersTable)
    .set({ role: "admin" })
    .where(eq(usersTable.id, req.localUser!.id))
    .returning();
  res.json(serialize(updated));
});

function parseBirthTime(time: string | null): { hour: number; minute: number } {
  if (!time) return { hour: 12, minute: 0 };
  const [h, m] = time.split(":").map(Number);
  return { hour: Number.isFinite(h) ? h : 12, minute: Number.isFinite(m) ? m : 0 };
}

router.post("/profile/natal-chart", requireAuth, async (req, res): Promise<void> => {
  const user = req.localUser!;
  if (!user.birthDate || user.birthLatitude == null || user.birthLongitude == null) {
    res.status(400).json({ error: "Заполните дату рождения и место рождения в профиле." });
    return;
  }
  const [y, m, d] = user.birthDate.split("-").map(Number);
  const { hour, minute } = parseBirthTime(user.birthTime);
  const input: NatalChartInput = {
    year: y,
    month: m,
    day: d,
    hour,
    minute,
    latitude: user.birthLatitude,
    longitude: user.birthLongitude,
    timezone: user.birthTimezone,
  };
  try {
    const chart: NatalChart = computeNatalChart(input);
    const [updated] = await db
      .update(usersTable)
      .set({ natalChart: chart as any })
      .where(eq(usersTable.id, user.id))
      .returning();
    res.json({ chart: updated.natalChart });
  } catch (e) {
    res.status(500).json({ error: "Не удалось рассчитать натальную карту." });
  }
});

export default router;
