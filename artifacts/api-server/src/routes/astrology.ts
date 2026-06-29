import { Router, type IRouter } from "express";
import { GetNatalChartResponse } from "@workspace/api-zod";
import { requireAuth } from "../lib/auth";
import { computeNatalChart } from "../lib/astrology";

const router: IRouter = Router();

router.get("/astrology/natal", requireAuth, async (req, res): Promise<void> => {
  const user = req.localUser!;

  const { birthDate, birthTime, birthLatitude, birthLongitude, birthTimezone } =
    user;

  if (
    !birthDate ||
    !birthTime ||
    birthLatitude === null ||
    birthLatitude === undefined ||
    birthLongitude === null ||
    birthLongitude === undefined
  ) {
    res.status(400).json({
      error:
        "Для построения натальной карты нужны дата, точное время и координаты места рождения.",
    });
    return;
  }

  const dateMatch = /^(\d{4})-(\d{2})-(\d{2})/.exec(birthDate);
  const timeMatch = /^(\d{1,2}):(\d{2})/.exec(birthTime);

  if (!dateMatch || !timeMatch) {
    res.status(400).json({
      error: "Некорректный формат даты или времени рождения.",
    });
    return;
  }

  const chart = computeNatalChart({
    year: Number(dateMatch[1]),
    month: Number(dateMatch[2]),
    day: Number(dateMatch[3]),
    hour: Number(timeMatch[1]),
    minute: Number(timeMatch[2]),
    latitude: birthLatitude,
    longitude: birthLongitude,
    timezone: birthTimezone,
  });

  res.json(GetNatalChartResponse.parse(chart));
});

export default router;
