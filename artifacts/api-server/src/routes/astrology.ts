import { Router, type IRouter } from "express";
import { GetNatalChartResponse } from "@workspace/api-zod";
import { requireAuth } from "../lib/auth";
import { computeNatalChart } from "../lib/astrology";
import { computeLunarForProfile, hydrateLunarRecommendations } from "../lib/lunarReturn";
import { hydrateCinderellaGates } from "../lib/cinderellaGates";
import { todayString } from "../lib/oracle";
import { computeMarriageFormula } from "../lib/predictiveFormulas";
import { computeMoneyFormula } from "../lib/moneyFormula";
import { parseNatalChartInput } from "../lib/birthInput";

const router: IRouter = Router();

router.get("/astrology/natal", requireAuth, async (req, res): Promise<void> => {
  const user = req.localUser!;

  const chartInput = parseNatalChartInput(user);
  if (!chartInput) {
    res.status(400).json({
      error: "Для построения натальной карты нужны корректные дата, точное время, координаты и часовой пояс места рождения.",
    });
    return;
  }

  const chart = computeNatalChart(chartInput);

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

router.post("/astrology/money-formula", requireAuth, async (req, res): Promise<void> => {
  const user = req.localUser!;
  const chartInput = parseNatalChartInput(user);
  if (!chartInput) {
    res.status(400).json({ error: "Для расчёта денежной формулы заполните корректные дату, точное время, место рождения и часовой пояс в профиле." });
    return;
  }
  try {
    const chart = computeNatalChart(chartInput);
    res.json(computeMoneyFormula(chart));
  } catch (error) {
    console.error("Money formula calculation failed", error);
    res.status(500).json({ error: "Не удалось рассчитать денежную формулу." });
  }
});

router.post("/astrology/predictive-formula", requireAuth, async (req, res): Promise<void> => {
  const formula = typeof req.body?.formula === "string" ? req.body.formula : "";
  if (formula !== "marriage") {
    res.status(400).json({ error: "Неизвестная прогностическая формула." });
    return;
  }

  const user = req.localUser!;
  if (!user.birthDate || user.birthLatitude == null || user.birthLongitude == null || !user.birthTimezone || (user.gender !== "мужчина" && user.gender !== "женщина")) {
    res.status(400).json({
      error: "Для расчёта формулы заполните дату, точное время, пол, город рождения, координаты и часовой пояс в профиле.",
    });
    return;
  }

  const dateMatch = /^(\d{4})-(\d{2})-(\d{2})/.exec(user.birthDate);
  const timeMatch = /^(\d{1,2}):(\d{2})/.exec(user.birthTime ?? "12:00");
  if (!dateMatch || !timeMatch) {
    res.status(400).json({ error: "Некорректный формат даты или времени рождения." });
    return;
  }

  try {
    const result = computeMarriageFormula({
      year: Number(dateMatch[1]),
      month: Number(dateMatch[2]),
      day: Number(dateMatch[3]),
      hour: Number(timeMatch[1]),
      minute: Number(timeMatch[2]),
      latitude: user.birthLatitude,
      longitude: user.birthLongitude,
      timezone: user.birthTimezone,
    }, user.gender);
    res.json(result);
  } catch (error) {
    console.error("Marriage formula calculation failed", error);
    res.status(500).json({ error: "Не удалось рассчитать формулу возможного бракосочетания." });
  }
});

export default router;
