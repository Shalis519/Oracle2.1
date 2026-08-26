import { Router, type IRouter } from "express";
import { GetQimenResponse } from "@workspace/api-zod";
import { requireAuth } from "../lib/auth";
import { computeQimenStructures } from "../lib/qimen";

const router: IRouter = Router();

router.get("/qimen", requireAuth, async (req, res): Promise<void> => {
  const user = req.localUser!;
  // Джи Фу is universal and computed even without a birth date; the personal
  // "Три Генерала" structures require one (handled inside the engine).
  const result = computeQimenStructures({
    birthDate: user.birthDate,
    birthTime: user.birthTime,
    // Личная карта строится по месту рождения, а не по текущему городу проживания.
    timezone: user.birthTimezone,
    birthTimezone: user.birthTimezone,
    birthLongitude: user.birthLongitude,
    days: 14,
    tigerDunDays: 30,
  });
  res.json(GetQimenResponse.parse(result));
});

export default router;
