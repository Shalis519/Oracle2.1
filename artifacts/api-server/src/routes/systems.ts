import { Router, type IRouter } from "express";
import {
  GetMatrixResponse,
  GetBaziResponse,
  GetFengShuiResponse,
} from "@workspace/api-zod";
import { requireAuth } from "../lib/auth";
import {
  computeMatrix,
  computeBazi,
  computeFengShui,
  computePromotionActivation,
  computeNobleHelperActivation,
  computeSpendingDays,
  todayString,
} from "../lib/oracle";

const router: IRouter = Router();

router.get("/matrix", requireAuth, async (req, res): Promise<void> => {
  const user = req.localUser!;
  if (!user.birthDate) {
    res.status(400).json({ error: "Заполните дату рождения в профиле." });
    return;
  }
  const result = computeMatrix(user.birthDate);
  if (!result) {
    res.status(400).json({ error: "Некорректная дата рождения." });
    return;
  }
  res.json(GetMatrixResponse.parse(result));
});

router.get("/bazi", requireAuth, async (req, res): Promise<void> => {
  const user = req.localUser!;
  if (!user.birthDate) {
    res.status(400).json({ error: "Заполните дату рождения в профиле." });
    return;
  }
  const result = computeBazi(user.birthDate, user.birthTime);
  if (!result) {
    res.status(400).json({ error: "Некорректная дата рождения." });
    return;
  }
  const promotionActivation = computePromotionActivation(
    user.birthDate,
    user.birthTime,
  );
  const nobleHelperActivation = computeNobleHelperActivation(
    user.birthDate,
    user.birthTime,
  );
  const spendingDays = computeSpendingDays(
    user.birthDate,
    user.birthTime,
    todayString(),
    30,
  );
  res.json(
    GetBaziResponse.parse({
      ...result,
      promotionActivation,
      nobleHelperActivation,
      spendingDays,
    }),
  );
});

router.get("/fengshui", requireAuth, async (req, res): Promise<void> => {
  const user = req.localUser!;
  if (!user.bedDirection) {
    res
      .status(400)
      .json({ error: "Укажите направление кровати в профиле для анализа фэн-шуй." });
    return;
  }
  const result = computeFengShui(user.bedDirection);
  res.json(GetFengShuiResponse.parse(result));
});

export default router;
