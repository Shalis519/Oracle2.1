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
    timezone: user.cityTimezone ?? user.birthTimezone,
    birthTimezone: user.birthTimezone,
    birthLongitude: user.birthLongitude,
    days: 2,
  });
  res.json(GetQimenResponse.parse(result));
});

export default router;
