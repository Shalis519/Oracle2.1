import { Router, type IRouter } from "express";
import { GetTodayActivationsResponse } from "@workspace/api-zod";
import { requireAuth } from "../lib/auth";
import { todayString } from "../lib/oracle";
import { getActivationsForDate } from "../lib/data/activations";

const router: IRouter = Router();

router.get("/activations/today", requireAuth, async (_req, res): Promise<void> => {
  const date = todayString();
  const items = getActivationsForDate(date);
  const body = GetTodayActivationsResponse.parse({ date, items });
  res.json(body);
});

export default router;
