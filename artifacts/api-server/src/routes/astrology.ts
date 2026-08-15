import { Router, type IRouter } from "express";
import { GetNatalChartResponse } from "@workspace/api-zod";
import { requireAuth } from "../lib/auth";
import { computeNatalChart } from "../lib/astrology";
import { computeLunarForProfile, hydrateLunarRecommendations } from "../lib/lunarReturn";
import { hydrateCinderellaGates } from "../lib/cinderellaGates";
import { todayString } from "../lib/oracle";

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

  const hydratedGates = await hydrateCinderellaGates(chart.cinderellaGates);
  const chartWithInterpretations = { ...chart, cinderellaGates: hydratedGates };

  const lunarReturn = computeLunarForProfile(
    {
      birthDate: user.birthDate,
      birthTime: user.birthTime,
      birthPlace: user.birthPlace,
      birthLatitude: user.birthLatitude,
      birthLongitude: user.birthLongitude,
      birthTimezone: user.birthTimezone,
      city: user.city,
      cityLatitude: user.cityLatitude,
      cityLongitude: user.cityLongitude,
      cityTimezone: user.cityTimezone,
    },
    todayString(),
    (input) => computeNatalChart(input),
  );

  const hydratedLunarReturn = await hydrateLunarRecommendations(lunarReturn);
  res.json(GetNatalChartResponse.parse({ ...chartWithInterpretations, lunarReturn: hydratedLunarReturn }));
});

export default router;
