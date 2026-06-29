import { Router, type IRouter } from "express";
import {
  SearchCitiesQueryParams,
  SearchCitiesResponse,
  ComputeBaziHoursBody,
  ComputeBaziHoursResponse,
} from "@workspace/api-zod";
import { requireAuth } from "../lib/auth";
import { searchCities } from "../lib/cities";
import { computeBaziHours } from "../lib/baziHours";

const router: IRouter = Router();

router.get("/cities/search", requireAuth, async (req, res): Promise<void> => {
  const parsed = SearchCitiesQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: "Некорректный запрос." });
    return;
  }
  const cities = searchCities(parsed.data.q);
  res.json(SearchCitiesResponse.parse(cities));
});

router.post("/bazi/hours", requireAuth, async (req, res): Promise<void> => {
  const parsed = ComputeBaziHoursBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Некорректные данные расчёта." });
    return;
  }
  const result = computeBaziHours(parsed.data);
  res.json(ComputeBaziHoursResponse.parse(result));
});

export default router;
