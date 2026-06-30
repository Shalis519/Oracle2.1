import { Router, type IRouter } from "express";
import { GetQimenResponse } from "@workspace/api-zod";
import { requireAuth } from "../lib/auth";
import { computeQimenStructures } from "../lib/qimen";

const router: IRouter = Router();

router.get("/qimen", requireAuth, async (req, res): Promise<void> => {
  const user = req.localUser!;
  if (!user.birthDate) {
    res.json(
      GetQimenResponse.parse({
        hasBirthDate: false,
        birthYearAnimal: null,
        windowDays: 14,
        structures: [],
      }),
    );
    return;
  }
  const result = computeQimenStructures({
    birthDate: user.birthDate,
    birthTime: user.birthTime,
    days: 14,
  });
  res.json(GetQimenResponse.parse(result));
});

export default router;
